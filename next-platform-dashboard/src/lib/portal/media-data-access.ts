import "server-only";

/**
 * Portal Media DAL (Session 5).
 *
 * Wraps `assets` (media files) and `media_folders` with portal guards.
 * Gated on `canEditContent`.
 *
 * Important schema note: media files live in the `assets` table, not
 * `media_files`. Assets may be agency-wide (site_id NULL) or
 * site-scoped. The portal DAL ONLY surfaces site-scoped assets for the
 * current site — agency-wide assets are invisible to portal users, per
 * the portal-first isolation rule.
 *
 * Folders are agency-scoped in the schema, but the portal exposes only
 * folders in use by this site's assets, plus the root virtual folder.
 *
 * Guarded-delete: if an asset is referenced in `media_usage` rows,
 * `delete` refuses unless `confirm: true`. The refusal payload lists
 * the usage summary so the portal UI can show "this asset is used in
 * 3 blog posts, 1 page — delete anyway?".
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { withPortalEvent } from "./observability";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";

const MEDIA_PERM = "canEditContent" as const;
const T = {
  assets: "assets",
  folders: "media_folders",
  usage: "media_usage",
} as const;

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, MEDIA_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${MEDIA_PERM}`,
      permissionKey: MEDIA_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      MEDIA_PERM,
    );
  }
  return result.scope!;
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata?: Record<string, unknown>,
): void {
  writePortalAudit({
    authUserId: ctx.user.userId,
    clientId: ctx.user.clientId,
    agencyId: ctx.user.agencyId,
    siteId,
    isImpersonation: ctx.isImpersonation,
    impersonatorEmail: ctx.impersonatorEmail,
    action,
    resourceType,
    resourceId,
    permissionKey: MEDIA_PERM,
    metadata,
  }).catch(() => {});
}

function evtCtx(ctx: PortalDALContext, siteId: string) {
  return {
    agencyId: ctx.user.agencyId,
    clientId: ctx.user.clientId,
    authUserId: ctx.user.userId,
    siteId,
    isImpersonation: ctx.isImpersonation,
  };
}

function emit(
  siteId: string,
  eventType: string,
  ctx: PortalDALContext,
  payload: Record<string, unknown>,
  sourceEntityType: string,
  sourceEntityId: string,
): void {
  logAutomationEvent(
    siteId,
    eventType,
    {
      ...payload,
      source: "portal",
      actor_user_id: ctx.user.userId,
      is_impersonation: ctx.isImpersonation,
    },
    {
      sourceModule: "portal",
      sourceEntityType,
      sourceEntityId,
    },
  ).catch(() => {});
}

export interface PortalMediaAsset {
  id: string;
  siteId: string | null;
  folderId: string | null;
  fileName: string;
  originalName: string;
  fileType: "image" | "video" | "document" | "other";
  mimeType: string;
  fileSize: number;
  publicUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  tags: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PortalMediaFolder {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
}

export interface PortalMediaUsageSummary {
  total: number;
  byEntityType: Record<string, number>;
}

export interface PortalMediaListFilter {
  folderId?: string | null;
  fileType?: "image" | "video" | "document" | "other";
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PortalMediaDeleteResult {
  deleted: boolean;
  blocked?: { reason: "in_use"; usage: PortalMediaUsageSummary };
}

function mapAsset(row: any): PortalMediaAsset {
  return {
    id: String(row.id),
    siteId: row.site_id ?? null,
    folderId: row.folder_id ?? null,
    fileName: row.file_name ?? "",
    originalName: row.original_name ?? row.file_name ?? "",
    fileType: (row.file_type ?? "other") as PortalMediaAsset["fileType"],
    mimeType: row.mime_type ?? "",
    fileSize: Number(row.size ?? 0),
    publicUrl: row.public_url ?? row.url ?? "",
    thumbnailUrl: row.thumbnail_url ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    altText: row.alt_text ?? null,
    caption: row.caption ?? null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? row.created_at ?? null,
  };
}

function mapFolder(row: any): PortalMediaFolder {
  return {
    id: String(row.id),
    parentId: row.parent_id ?? null,
    name: row.name ?? "",
    slug: row.slug ?? "",
  };
}

export interface PortalMediaNamespace {
  list(
    siteId: string,
    filter?: PortalMediaListFilter,
  ): Promise<{ assets: PortalMediaAsset[]; total: number }>;
  detail(
    siteId: string,
    assetId: string,
  ): Promise<PortalMediaAsset & { usage: PortalMediaUsageSummary }>;
  updateMeta(
    siteId: string,
    assetId: string,
    patch: {
      altText?: string | null;
      caption?: string | null;
      tags?: string[];
      folderId?: string | null;
    },
  ): Promise<PortalMediaAsset>;
  delete(
    siteId: string,
    assetId: string,
    opts?: { confirm?: boolean },
  ): Promise<PortalMediaDeleteResult>;
  folders: {
    list(siteId: string): Promise<PortalMediaFolder[]>;
  };
}

async function loadUsageSummary(
  assetId: string,
): Promise<PortalMediaUsageSummary> {
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from(T.usage)
    .select("entity_type")
    .eq("asset_id", assetId);
  const rows = (data ?? []) as Array<{ entity_type: string }>;
  const byEntityType: Record<string, number> = {};
  for (const r of rows) {
    const k = r.entity_type ?? "unknown";
    byEntityType[k] = (byEntityType[k] ?? 0) + 1;
  }
  return { total: rows.length, byEntityType };
}

export function createMediaNamespace(
  ctx: PortalDALContext,
): PortalMediaNamespace {
  async function loadAsset(scope: PortalSiteScope, assetId: string) {
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from(T.assets)
      .select("*")
      .eq("id", assetId)
      .eq("site_id", scope.siteId)
      .maybeSingle();
    if (error || !data)
      throw new Error(
        `[portal][media] asset_not_found: ${error?.message ?? "none"}`,
      );
    return data;
  }

  return {
    list: (siteId, filter) =>
      withPortalEvent(
        "portal.dal.media.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.assets)
            .select("*", { count: "exact" })
            .eq("site_id", scope.siteId)
            .order("created_at", { ascending: false });
          if (filter?.folderId !== undefined) {
            if (filter.folderId === null) q = q.is("folder_id", null);
            else q = q.eq("folder_id", filter.folderId);
          }
          if (filter?.fileType) q = q.eq("file_type", filter.fileType);
          if (filter?.search) q = q.ilike("file_name", `%${filter.search}%`);
          const limit = filter?.limit ?? 50;
          const offset = filter?.offset ?? 0;
          q = q.range(offset, offset + limit - 1);
          const { data, count, error } = await q;
          if (error) throw new Error(`[portal][media] list: ${error.message}`);
          finalizeAudit(ctx, siteId, "portal.media.list", "asset", null, {
            count: (data ?? []).length,
          });
          return {
            assets: (data ?? []).map(mapAsset),
            total: count ?? data?.length ?? 0,
          };
        },
      ),

    detail: (siteId, assetId) =>
      withPortalEvent(
        "portal.dal.media.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const row = await loadAsset(scope, assetId);
          const usage = await loadUsageSummary(assetId);
          finalizeAudit(ctx, siteId, "portal.media.detail", "asset", assetId);
          return { ...mapAsset(row), usage };
        },
      ),

    updateMeta: (siteId, assetId, patch) =>
      withPortalEvent(
        "portal.dal.media.updateMeta",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          await loadAsset(scope, assetId);
          const admin = createAdminClient() as any;
          const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (patch.altText !== undefined) updates.alt_text = patch.altText;
          if (patch.caption !== undefined) updates.caption = patch.caption;
          if (patch.tags !== undefined) updates.tags = patch.tags;
          if (patch.folderId !== undefined) updates.folder_id = patch.folderId;
          const { data, error } = await admin
            .from(T.assets)
            .update(updates)
            .eq("id", assetId)
            .eq("site_id", scope.siteId)
            .select("*")
            .single();
          if (error || !data)
            throw new Error(`[portal][media] update: ${error?.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.media.asset.updated",
            "asset",
            assetId,
          );
          emit(
            scope.siteId,
            "media.asset.updated",
            ctx,
            { asset_id: assetId },
            "asset",
            assetId,
          );
          return mapAsset(data);
        },
      ),

    delete: (siteId, assetId, opts) =>
      withPortalEvent(
        "portal.dal.media.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          await loadAsset(scope, assetId);
          const usage = await loadUsageSummary(assetId);
          if (usage.total > 0 && !opts?.confirm) {
            finalizeAudit(
              ctx,
              siteId,
              "portal.media.asset.delete_blocked",
              "asset",
              assetId,
              { usage },
            );
            return {
              deleted: false,
              blocked: { reason: "in_use" as const, usage },
            };
          }
          const admin = createAdminClient() as any;
          await admin.from(T.usage).delete().eq("asset_id", assetId);
          const { error } = await admin
            .from(T.assets)
            .delete()
            .eq("id", assetId)
            .eq("site_id", scope.siteId);
          if (error)
            throw new Error(`[portal][media] delete: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.media.asset.deleted",
            "asset",
            assetId,
            { forced: !!opts?.confirm, previous_usage_total: usage.total },
          );
          emit(
            scope.siteId,
            "media.asset.deleted",
            ctx,
            { asset_id: assetId, forced: !!opts?.confirm },
            "asset",
            assetId,
          );
          return { deleted: true };
        },
      ),

    folders: {
      list: (siteId) =>
        withPortalEvent(
          "portal.dal.media.folders.list",
          evtCtx(ctx, siteId),
          async () => {
            const scope = await requireScope(ctx, siteId);
            const admin = createAdminClient() as any;
            // Folders referenced by this site's assets, resolved via a
            // distinct lookup — portal users don't see agency-wide
            // folders that contain no site-scoped assets.
            const { data: inUse } = await admin
              .from(T.assets)
              .select("folder_id")
              .eq("site_id", scope.siteId)
              .not("folder_id", "is", null);
            const folderIds = Array.from(
              new Set(
                ((inUse ?? []) as Array<{ folder_id: string | null }>)
                  .map((r) => r.folder_id)
                  .filter((v): v is string => !!v),
              ),
            );
            if (folderIds.length === 0) {
              finalizeAudit(
                ctx,
                siteId,
                "portal.media.folders.list",
                "media_folder",
                null,
                { count: 0 },
              );
              return [];
            }
            const { data } = await admin
              .from(T.folders)
              .select("*")
              .in("id", folderIds);
            finalizeAudit(
              ctx,
              siteId,
              "portal.media.folders.list",
              "media_folder",
              null,
              { count: (data ?? []).length },
            );
            return (data ?? []).map(mapFolder);
          },
        ),
    },
  };
}

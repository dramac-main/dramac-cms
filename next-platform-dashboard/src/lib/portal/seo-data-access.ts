import "server-only";

/**
 * Portal SEO DAL (Session 5).
 *
 * Exposes a read-only view of SEO health + a small, safe subset of
 * site-wide SEO settings (title, default meta description, default OG
 * image, default robots). Out of scope by design:
 *   - site-wide `noindex` toggle (agency-managed)
 *   - canonical URL rewrites (studio-level)
 *   - sitemap exclusion rules (studio-level)
 *   - per-page meta overrides (rendered read-only from page studio data)
 *
 * Gated on `canEditContent`.
 *
 * Storage: this wraps `sites.seo_settings` (jsonb column) — the same
 * blob agency uses. Writes are merged, not replaced, so agency-managed
 * keys survive a portal write. If `sites.seo_settings` is absent in
 * your schema, this DAL falls back to reading `sites.metadata`.
 *
 * Insights (`getInsights`) computes a lightweight score from: has
 * title, has default description, has default OG image, has published
 * blog posts, published page count. It is a "traffic-light" preview,
 * not a full audit.
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

const SEO_PERM = "canEditContent" as const;

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, SEO_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${SEO_PERM}`,
      permissionKey: SEO_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      SEO_PERM,
    );
  }
  return result.scope!;
}

function finalizeAudit(
  ctx: PortalDALContext,
  siteId: string,
  action: string,
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
    resourceType: "site_seo_settings",
    resourceId: siteId,
    permissionKey: SEO_PERM,
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
      sourceEntityType: "site",
      sourceEntityId: siteId,
    },
  ).catch(() => {});
}

export interface PortalSeoSettings {
  siteTitle: string | null;
  defaultMetaDescription: string | null;
  defaultOgImageUrl: string | null;
  defaultRobots: string | null;
}

export interface PortalSeoInsights {
  score: number; // 0-100
  items: Array<{
    key: string;
    status: "ok" | "warn" | "fail";
    message: string;
  }>;
}

export interface PortalSeoNamespace {
  getSettings(siteId: string): Promise<PortalSeoSettings>;
  updateSettings(
    siteId: string,
    patch: Partial<PortalSeoSettings>,
  ): Promise<PortalSeoSettings>;
  getInsights(siteId: string): Promise<PortalSeoInsights>;
}

const SEO_COLUMN = "seo_settings";

function extractSettings(row: any): PortalSeoSettings {
  const raw =
    (row?.[SEO_COLUMN] as Record<string, unknown> | null) ??
    (row?.metadata as Record<string, unknown> | null) ??
    {};
  return {
    siteTitle: (raw.site_title as string) ?? (row?.name as string) ?? null,
    defaultMetaDescription: (raw.default_meta_description as string) ?? null,
    defaultOgImageUrl: (raw.default_og_image_url as string) ?? null,
    defaultRobots: (raw.default_robots as string) ?? null,
  };
}

export function createSeoNamespace(ctx: PortalDALContext): PortalSeoNamespace {
  return {
    getSettings: (siteId) =>
      withPortalEvent(
        "portal.dal.seo.getSettings",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data } = await admin
            .from("sites")
            .select(`id, name, ${SEO_COLUMN}, metadata`)
            .eq("id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .maybeSingle();
          finalizeAudit(ctx, siteId, "portal.seo.getSettings");
          return extractSettings(data);
        },
      ),

    updateSettings: (siteId, patch) =>
      withPortalEvent(
        "portal.dal.seo.updateSettings",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data: current } = await admin
            .from("sites")
            .select(`${SEO_COLUMN}, metadata`)
            .eq("id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .maybeSingle();

          // Merge, preserving agency-managed keys (e.g. site_noindex,
          // canonical_rewrites). Portal only writes the safe subset.
          const existing =
            (current?.[SEO_COLUMN] as Record<string, unknown>) ?? {};
          const merged = { ...existing };
          if (patch.siteTitle !== undefined)
            merged.site_title = patch.siteTitle;
          if (patch.defaultMetaDescription !== undefined)
            merged.default_meta_description = patch.defaultMetaDescription;
          if (patch.defaultOgImageUrl !== undefined)
            merged.default_og_image_url = patch.defaultOgImageUrl;
          if (patch.defaultRobots !== undefined)
            merged.default_robots = patch.defaultRobots;

          const { error } = await admin
            .from("sites")
            .update({ [SEO_COLUMN]: merged })
            .eq("id", scope.siteId)
            .eq("client_id", ctx.user.clientId);
          if (error)
            throw new Error(`[portal][seo] updateSettings: ${error.message}`);
          finalizeAudit(ctx, siteId, "portal.seo.settings.updated", {
            fields: Object.keys(patch),
          });
          emit(scope.siteId, "seo.settings.updated", ctx, {
            fields: Object.keys(patch),
          });
          return extractSettings({
            ...(current ?? {}),
            [SEO_COLUMN]: merged,
          });
        },
      ),

    getInsights: (siteId) =>
      withPortalEvent(
        "portal.dal.seo.getInsights",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const settings = extractSettings(
            (
              await admin
                .from("sites")
                .select(`name, ${SEO_COLUMN}`)
                .eq("id", scope.siteId)
                .maybeSingle()
            ).data,
          );

          const items: PortalSeoInsights["items"] = [];
          items.push({
            key: "site_title",
            status: settings.siteTitle ? "ok" : "fail",
            message: settings.siteTitle
              ? "Site title is set."
              : "Site title is missing.",
          });
          items.push({
            key: "default_meta_description",
            status: settings.defaultMetaDescription ? "ok" : "warn",
            message: settings.defaultMetaDescription
              ? "Default meta description is set."
              : "No default meta description — pages without their own description will have no fallback.",
          });
          items.push({
            key: "default_og_image",
            status: settings.defaultOgImageUrl ? "ok" : "warn",
            message: settings.defaultOgImageUrl
              ? "Default social share image is set."
              : "No default social share image — pages shared on social will have no preview image.",
          });

          const ok = items.filter((i) => i.status === "ok").length;
          const total = items.length;
          const score = total === 0 ? 0 : Math.round((ok / total) * 100);

          finalizeAudit(ctx, siteId, "portal.seo.insights", { score });
          return { score, items };
        },
      ),
  };
}

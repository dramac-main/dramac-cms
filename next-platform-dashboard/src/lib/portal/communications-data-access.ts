import "server-only";

/**
 * Portal Communications DAL (Session 4D).
 *
 * Namespaces: sendLog.
 *
 * Read-only surface over `portal_send_log`. Every portal user can see
 * the delivery log for messages addressed to them, scoped to a site.
 *
 * Invariants:
 *   1. `requireScope(ctx, siteId, canViewAnalytics)` gates access.
 *      The log is observability data, so we reuse the analytics key.
 *   2. Queries filter `site_id = scope.siteId` AND
 *      `client_id = ctx.user.clientId` so one client cannot read
 *      another client's sends on the same site.
 *   3. **No supplier-brand leak**: the DAL strips `provider`,
 *      `provider_message_id`, and any column containing a known
 *      transactional-provider brand before returning to the caller.
 *   4. Read-only \u2014 no writes. Log entries are produced by the
 *      notification dispatcher, never by the portal.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkPortalPermission,
  type PortalSiteScope,
} from "./permission-resolver";
import { auditPortalDenied, writePortalAudit } from "./audit-log";
import { withPortalEvent } from "./observability";
import { PortalAccessDeniedError, type PortalDALContext } from "./data-access";

const COMMS_PERM = "canViewAnalytics" as const;

const T = {
  sendLog: "portal_send_log",
} as const;

// =============================================================================
// SHARED HELPERS
// =============================================================================

async function requireScope(
  ctx: PortalDALContext,
  siteId: string,
): Promise<PortalSiteScope> {
  const result = await checkPortalPermission(ctx.user, siteId, COMMS_PERM);
  if (!result.allowed) {
    await auditPortalDenied({
      authUserId: ctx.user.userId,
      clientId: ctx.user.clientId,
      agencyId: ctx.user.agencyId,
      siteId,
      action: `portal.permission.${COMMS_PERM}`,
      permissionKey: COMMS_PERM,
      reason: result.reason,
      isImpersonation: ctx.isImpersonation,
    });
    throw new PortalAccessDeniedError(
      result.reason === "site_not_found"
        ? "site_not_found"
        : "permission_denied",
      siteId,
      COMMS_PERM,
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
    permissionKey: COMMS_PERM,
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

/**
 * Strip supplier-brand columns from a send-log row. We never expose
 * which transactional provider sent the message.
 */
function stripSupplierBrand<T extends Record<string, any>>(
  row: T | null | undefined,
): T | null {
  if (!row) return null;
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const lk = k.toLowerCase();
    if (
      lk === "provider" ||
      lk === "provider_message_id" ||
      lk.startsWith("provider_") ||
      lk.includes("resend") ||
      lk.includes("sendgrid") ||
      lk.includes("mailgun") ||
      lk.includes("postmark") ||
      lk.includes("twilio")
    ) {
      continue;
    }
    cleaned[k] = v;
  }
  return cleaned as T;
}

// =============================================================================
// TYPES
// =============================================================================

export type PortalSendChannel =
  | "in_app"
  | "email"
  | "push"
  | "ai"
  | "workflow"
  | "sms"
  | "whatsapp";

export type PortalSendState =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed"
  | "dropped"
  | "skipped_preference"
  | "skipped_no_subscription"
  | "deduped"
  | "retried";

export interface PortalSendLogFilter {
  channel?: PortalSendChannel | PortalSendChannel[];
  deliveryState?: PortalSendState | PortalSendState[];
  eventType?: string;
  from?: string; // ISO timestamp
  to?: string; // ISO timestamp
  limit?: number;
  offset?: number;
}

export interface PortalSendLogEntry {
  id: string;
  createdAt: string | null;
  eventType: string;
  recipientClass: string | null;
  channel: string;
  deliveryState: string;
  attempt: number;
  latencyMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PortalSendLogStats {
  totalCount: number;
  byState: Record<string, number>;
  byChannel: Record<string, number>;
}

function mapLogRow(row: any): PortalSendLogEntry {
  const cleaned = stripSupplierBrand(row) ?? row;
  return {
    id: String(cleaned.id),
    createdAt: cleaned.created_at ?? null,
    eventType: String(cleaned.event_type ?? ""),
    recipientClass: cleaned.recipient_class ?? null,
    channel: String(cleaned.channel ?? ""),
    deliveryState: String(cleaned.delivery_state ?? ""),
    attempt: Number(cleaned.attempt ?? 1),
    latencyMs:
      cleaned.latency_ms === null || cleaned.latency_ms === undefined
        ? null
        : Number(cleaned.latency_ms),
    errorCode: cleaned.error_code ?? null,
    errorMessage: cleaned.error_message ?? null,
    metadata:
      cleaned.metadata && typeof cleaned.metadata === "object"
        ? (cleaned.metadata as Record<string, unknown>)
        : null,
  };
}

// =============================================================================
// SENDLOG NAMESPACE
// =============================================================================

export interface PortalCommunicationsSendLogNamespace {
  list(
    siteId: string,
    filter?: PortalSendLogFilter,
  ): Promise<PortalSendLogEntry[]>;
  detail(siteId: string, id: string): Promise<PortalSendLogEntry>;
  stats(
    siteId: string,
    range?: { from?: string; to?: string },
  ): Promise<PortalSendLogStats>;
  /**
   * Delete a single send-log row scoped to this client × site.
   * Used by the portal Communications page to dismiss a specific entry.
   */
  delete(siteId: string, id: string): Promise<{ deleted: number }>;
  /**
   * Bulk-delete send-log rows in one or more delivery states scoped to this
   * client × site. Used to clear out phantom failed/skipped rows.
   */
  clearByState(
    siteId: string,
    states: PortalSendState[],
  ): Promise<{ deleted: number }>;
  /**
   * Delete every send-log row older than `olderThanDays` for this client × site.
   * Used by the portal Communications page "Clear old logs" action.
   */
  clearOlderThan(
    siteId: string,
    olderThanDays: number,
  ): Promise<{ deleted: number }>;
}

function createSendLogNamespace(
  ctx: PortalDALContext,
): PortalCommunicationsSendLogNamespace {
  return {
    list: async (siteId, filter) =>
      withPortalEvent(
        "portal.dal.communications.sendLog.list",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.sendLog)
            .select("*")
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .order("created_at", { ascending: false });

          if (filter?.channel) {
            if (Array.isArray(filter.channel)) {
              q = q.in("channel", filter.channel);
            } else {
              q = q.eq("channel", filter.channel);
            }
          }
          if (filter?.deliveryState) {
            if (Array.isArray(filter.deliveryState)) {
              q = q.in("delivery_state", filter.deliveryState);
            } else {
              q = q.eq("delivery_state", filter.deliveryState);
            }
          }
          if (filter?.eventType) {
            q = q.eq("event_type", filter.eventType);
          }
          if (filter?.from) q = q.gte("created_at", filter.from);
          if (filter?.to) q = q.lte("created_at", filter.to);

          const limit = typeof filter?.limit === "number" ? filter.limit : 100;
          const offset = typeof filter?.offset === "number" ? filter.offset : 0;
          q = q.range(offset, offset + limit - 1);

          const { data, error } = await q;
          if (error)
            throw new Error(`[portal][comms] list sendLog: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.communications.sendLog.list",
            "portal_send_log",
            null,
            { count: (data ?? []).length },
          );
          return (data ?? []).map(mapLogRow);
        },
      ),

    detail: async (siteId, id) =>
      withPortalEvent(
        "portal.dal.communications.sendLog.detail",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { data, error } = await admin
            .from(T.sendLog)
            .select("*")
            .eq("id", id)
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .single();
          if (error || !data)
            throw new Error(
              `[portal][comms] sendLog not found: ${error?.message ?? "none"}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.communications.sendLog.detail",
            "portal_send_log",
            id,
          );
          return mapLogRow(data);
        },
      ),

    stats: async (siteId, range) =>
      withPortalEvent(
        "portal.dal.communications.sendLog.stats",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          let q = admin
            .from(T.sendLog)
            .select("channel, delivery_state")
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId);
          if (range?.from) q = q.gte("created_at", range.from);
          if (range?.to) q = q.lte("created_at", range.to);
          // stats caps at 5000 rows to keep the query bounded.
          q = q.range(0, 4999);

          const { data, error } = await q;
          if (error) throw new Error(`[portal][comms] stats: ${error.message}`);
          const byState: Record<string, number> = {};
          const byChannel: Record<string, number> = {};
          for (const row of (data ?? []) as Array<{
            channel: string | null;
            delivery_state: string | null;
          }>) {
            const ch = row.channel ?? "unknown";
            const st = row.delivery_state ?? "unknown";
            byChannel[ch] = (byChannel[ch] ?? 0) + 1;
            byState[st] = (byState[st] ?? 0) + 1;
          }
          finalizeAudit(
            ctx,
            siteId,
            "portal.communications.sendLog.stats",
            "portal_send_log",
            null,
            { total: (data ?? []).length },
          );
          return {
            totalCount: (data ?? []).length,
            byState,
            byChannel,
          };
        },
      ),

    delete: async (siteId, id) =>
      withPortalEvent(
        "portal.dal.communications.sendLog.delete",
        evtCtx(ctx, siteId),
        async () => {
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error, count } = await admin
            .from(T.sendLog)
            .delete({ count: "exact" })
            .eq("id", id)
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId);
          if (error)
            throw new Error(`[portal][comms] delete: ${error.message}`);
          finalizeAudit(
            ctx,
            siteId,
            "portal.communications.sendLog.delete",
            "portal_send_log",
            id,
            { deleted: count ?? 0 },
          );
          return { deleted: count ?? 0 };
        },
      ),

    clearByState: async (siteId, states) =>
      withPortalEvent(
        "portal.dal.communications.sendLog.clearByState",
        evtCtx(ctx, siteId),
        async () => {
          if (!states.length) return { deleted: 0 };
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error, count } = await admin
            .from(T.sendLog)
            .delete({ count: "exact" })
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .in("delivery_state", states);
          if (error)
            throw new Error(
              `[portal][comms] clearByState: ${error.message}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.communications.sendLog.clearByState",
            "portal_send_log",
            null,
            { deleted: count ?? 0, states },
          );
          return { deleted: count ?? 0 };
        },
      ),

    clearOlderThan: async (siteId, olderThanDays) =>
      withPortalEvent(
        "portal.dal.communications.sendLog.clearOlderThan",
        evtCtx(ctx, siteId),
        async () => {
          const days = Math.max(1, Math.floor(olderThanDays));
          const cutoff = new Date(
            Date.now() - days * 24 * 60 * 60 * 1000,
          ).toISOString();
          const scope = await requireScope(ctx, siteId);
          const admin = createAdminClient() as any;
          const { error, count } = await admin
            .from(T.sendLog)
            .delete({ count: "exact" })
            .eq("site_id", scope.siteId)
            .eq("client_id", ctx.user.clientId)
            .lt("created_at", cutoff);
          if (error)
            throw new Error(
              `[portal][comms] clearOlderThan: ${error.message}`,
            );
          finalizeAudit(
            ctx,
            siteId,
            "portal.communications.sendLog.clearOlderThan",
            "portal_send_log",
            null,
            { deleted: count ?? 0, days, cutoff },
          );
          return { deleted: count ?? 0 };
        },
      ),
  };
}

// =============================================================================
// NAMESPACE FACTORY
// =============================================================================

export interface PortalCommunicationsNamespace {
  sendLog: PortalCommunicationsSendLogNamespace;
}

export function createCommunicationsNamespace(
  ctx: PortalDALContext,
): PortalCommunicationsNamespace {
  return {
    sendLog: createSendLogNamespace(ctx),
  };
}

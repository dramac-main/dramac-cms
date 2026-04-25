"use server";

/**
 * Portal audit log writer.
 *
 * Every sensitive portal action writes one row to `portal_audit_log` via the
 * service-role admin client. Writes are fire-and-forget — they must never
 * block or break the calling request.
 *
 * For routine per-request observability, use `./observability.ts` instead.
 * This file is only for actions that must be traceable after the fact.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { logPortalEvent } from "./observability";

export type PortalAuditResult = "ok" | "denied" | "error";

export interface PortalAuditEntry {
  /** auth.users.id of the caller (impersonator if impersonating). */
  authUserId: string | null;
  /** Target client (subject of the action). */
  clientId: string | null;
  agencyId: string | null;
  siteId?: string | null;
  isImpersonation?: boolean;
  impersonatorEmail?: string | null;

  /** Action key, e.g. `portal.signin`, `portal.orders.view`. */
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;

  result?: PortalAuditResult;
  permissionKey?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Pull `ip` and `user-agent` from the current request headers. Returns empty
 * strings if headers are not available (e.g. in background jobs).
 */
async function getRequestContext(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    const ip = fwd ? fwd.split(",")[0]!.trim() : (h.get("x-real-ip") ?? null);
    return {
      ipAddress: ip,
      userAgent: h.get("user-agent"),
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

/**
 * Write a single audit row. Fire-and-forget — errors are logged but never
 * thrown back to the caller.
 */
export async function writePortalAudit(entry: PortalAuditEntry): Promise<void> {
  const { ipAddress, userAgent } = await getRequestContext();

  const admin = createAdminClient();

  const row = {
    auth_user_id: entry.authUserId,
    client_id: entry.clientId,
    agency_id: entry.agencyId,
    site_id: entry.siteId ?? null,
    is_impersonation: entry.isImpersonation ?? false,
    impersonator_email: entry.impersonatorEmail ?? null,
    action: entry.action,
    resource_type: entry.resourceType ?? null,
    resource_id: entry.resourceId ?? null,
    result: entry.result ?? "ok",
    permission_key: entry.permissionKey ?? null,
    reason: entry.reason ?? null,
    metadata: entry.metadata ?? {},
    ip_address: ipAddress,
    user_agent: userAgent,
  };

  const { error } = await admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("portal_audit_log" as any)
    .insert(row);

  if (error) {
    // Don't throw — audit must never break the request. Log loudly instead.
    logPortalEvent({
      event: "portal.audit.write.failed",
      level: "error",
      ok: false,
      agencyId: entry.agencyId,
      clientId: entry.clientId,
      siteId: entry.siteId ?? null,
      authUserId: entry.authUserId,
      isImpersonation: entry.isImpersonation,
      error: error.message,
      metadata: { action: entry.action, result: entry.result ?? "ok" },
    });
  }

  // Section 7 — when this audit row represents a successful WRITE performed
  // during an active impersonation session, mirror it into the dedicated
  // `impersonation_actions` ledger so agency owners have a single,
  // tamper-evident view of every staff-as-customer write. Pure read actions
  // (action ends in `.view` / `.list` / `.read`) are skipped.
  if (
    (entry.result ?? "ok") === "ok" &&
    entry.isImpersonation === true &&
    !/\.(view|list|read|search|count)$/i.test(entry.action)
  ) {
    try {
      await admin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("impersonation_actions" as any)
        .insert({
          impersonator_user_id: entry.authUserId,
          impersonated_user_id: null,
          impersonated_client_id: entry.clientId,
          agency_id: entry.agencyId,
          site_id: entry.siteId ?? null,
          action_type: entry.action,
          resource_type: entry.resourceType ?? null,
          resource_id: entry.resourceId ?? null,
          http_method: null,
          request_path: null,
          metadata: {
            ...(entry.metadata ?? {}),
            impersonatorEmail: entry.impersonatorEmail ?? null,
            ipAddress,
            userAgent,
          },
        });
    } catch (auditErr) {
      logPortalEvent({
        event: "portal.impersonation.audit.failed",
        level: "error",
        ok: false,
        agencyId: entry.agencyId,
        clientId: entry.clientId,
        siteId: entry.siteId ?? null,
        authUserId: entry.authUserId,
        isImpersonation: true,
        error:
          auditErr instanceof Error ? auditErr.message : String(auditErr),
        metadata: { action: entry.action },
      });
    }
  }
}

/**
 * Convenience helpers for common audit events.
 */

export async function auditPortalSignIn(params: {
  authUserId: string;
  clientId: string;
  agencyId: string;
  method: "password" | "magic_link";
  result?: PortalAuditResult;
  reason?: string;
}): Promise<void> {
  await writePortalAudit({
    authUserId: params.authUserId,
    clientId: params.clientId,
    agencyId: params.agencyId,
    action: "portal.signin",
    result: params.result ?? "ok",
    reason: params.reason ?? null,
    metadata: { method: params.method },
  });
}

export async function auditPortalSiteSwitch(params: {
  authUserId: string;
  clientId: string;
  agencyId: string;
  fromSiteId: string | null;
  toSiteId: string;
  isImpersonation?: boolean;
}): Promise<void> {
  await writePortalAudit({
    authUserId: params.authUserId,
    clientId: params.clientId,
    agencyId: params.agencyId,
    siteId: params.toSiteId,
    isImpersonation: params.isImpersonation,
    action: "portal.site.switch",
    resourceType: "site",
    resourceId: params.toSiteId,
    metadata: { fromSiteId: params.fromSiteId },
  });
}

export async function auditPortalDenied(params: {
  authUserId: string | null;
  clientId: string | null;
  agencyId: string | null;
  siteId?: string | null;
  action: string;
  permissionKey?: string;
  reason: string;
  isImpersonation?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writePortalAudit({
    authUserId: params.authUserId,
    clientId: params.clientId,
    agencyId: params.agencyId,
    siteId: params.siteId ?? null,
    isImpersonation: params.isImpersonation,
    action: params.action,
    result: "denied",
    permissionKey: params.permissionKey ?? null,
    reason: params.reason,
    metadata: params.metadata,
  });
}

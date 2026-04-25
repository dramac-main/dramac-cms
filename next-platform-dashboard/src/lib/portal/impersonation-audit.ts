import "server-only";

/**
 * Section 7 — Impersonation write audit helper.
 *
 * When a portal admin is impersonating a client and performs a WRITE
 * (create / update / delete on any portal resource), call
 * `logImpersonationWrite()` immediately after the write succeeds. The
 * helper is a no-op when there is no active impersonation, so it can be
 * sprinkled liberally into server actions without conditional plumbing.
 *
 * The helper never throws — audit failures must not roll back the actual
 * write that just succeeded. They are logged to console for the agency to
 * notice on the next deployment.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalSession } from "./portal-auth";
import { cookies } from "next/headers";

export interface ImpersonationWriteEntry {
  /** Stable verb describing the write — "create", "update", "delete",
   *  "send", "approve", "reject", "publish", "archive", etc. */
  actionType: string;
  /** Resource family — "order", "appointment", "product", "post", etc. */
  resourceType?: string;
  /** Resource identifier (uuid, numeric id, or slug). */
  resourceId?: string;
  /** Site context for the write. */
  siteId?: string;
  /** HTTP method if available (server actions usually POST). */
  httpMethod?: string;
  /** Originating request path, if known. */
  requestPath?: string;
  /** Free-form metadata — do NOT include PII or full email bodies. */
  metadata?: Record<string, unknown>;
}

/**
 * Append an impersonation audit entry for the current request.
 * No-ops when the request is not within an active impersonation session.
 */
export async function logImpersonationWrite(
  entry: ImpersonationWriteEntry,
): Promise<void> {
  try {
    const session = await getPortalSession();
    if (!session.isImpersonating || !session.user) {
      return;
    }

    // The impersonator's actual auth id is `user.userId` while the
    // impersonated client's id is `user.clientId`. Resolve the
    // impersonated user's auth id (clients.portal_user_id) for searchability.
    const admin = createAdminClient();
    let impersonatedUserId: string | null = null;
    try {
      const { data: client } = await admin
        .from("clients" as never)
        .select("portal_user_id")
        .eq("id" as never, session.user.clientId)
        .single();
      impersonatedUserId =
        ((client as Record<string, unknown> | null)?.portal_user_id as
          | string
          | undefined) ?? null;
    } catch {
      // ignore — best-effort enrichment
    }

    await admin.from("impersonation_actions" as never).insert({
      impersonator_user_id: session.user.userId,
      impersonated_user_id: impersonatedUserId,
      impersonated_client_id: session.user.clientId,
      agency_id: session.user.agencyId,
      site_id: entry.siteId ?? null,
      action_type: entry.actionType,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      http_method: entry.httpMethod ?? null,
      request_path: entry.requestPath ?? null,
      metadata: entry.metadata ?? {},
    } as never);
  } catch (err) {
    console.error("[impersonation-audit] failed to log entry:", err);
  }
}

/**
 * Read the active impersonation cookie without going through the full
 * portal session resolver. Returns null when not impersonating.
 * Useful for lightweight checks in middleware/route handlers.
 */
export async function getActiveImpersonationClientId(): Promise<string | null> {
  try {
    const store = await cookies();
    const c = store.get("impersonating_client_id");
    return c?.value ?? null;
  } catch {
    return null;
  }
}

import "server-only";

/**
 * Portal structured send log.
 *
 * Every message delivery across in-app / email / push / AI / workflow MUST
 * write one row to `portal_send_log` with enough shape to answer:
 *   "was the *user* of a given client on a given site reached, on which
 *   channel, with what latency, and did it succeed?"
 *
 * The log stores no message body, no note text, no AI generated content,
 * and no customer PII beyond what already lives in `notifications` /
 * `email_logs`. Only routing metadata.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { logPortalEvent } from "./observability";

// Keep in sync with the CHECK constraints in migrations/portal-02-communication.sql
export type SendChannel =
  | "in_app"
  | "email"
  | "push"
  | "ai"
  | "workflow"
  | "sms"
  | "whatsapp";

export type DeliveryState =
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

export type RecipientClass =
  | "agency_owner"
  | "portal_user"
  | "agent"
  | "customer"
  | "system";

export interface SendLogEntry {
  eventType: string;
  recipientClass: RecipientClass;
  channel: SendChannel;
  deliveryState: DeliveryState;
  userId?: string | null;
  clientId?: string | null;
  siteId?: string | null;
  agencyId?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
  attempt?: number;
  latencyMs?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Write a single send-log entry. Fire-and-forget — never throws, never
 * blocks the dispatch path. Returns the row id on success so the caller
 * can link `email_logs.send_log_id` to it.
 */
export async function writeSendLog(
  entry: SendLogEntry,
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("portal_send_log" as never)
      .insert({
        event_type: entry.eventType,
        recipient_class: entry.recipientClass,
        channel: entry.channel,
        delivery_state: entry.deliveryState,
        user_id: entry.userId ?? null,
        client_id: entry.clientId ?? null,
        site_id: entry.siteId ?? null,
        agency_id: entry.agencyId ?? null,
        provider: entry.provider ?? null,
        provider_message_id: entry.providerMessageId ?? null,
        attempt: entry.attempt ?? 1,
        latency_ms: entry.latencyMs ?? null,
        error_code: entry.errorCode ?? null,
        error_message: entry.errorMessage ?? null,
        metadata: entry.metadata ?? {},
      } as never)
      .select("id")
      .single();

    if (error) {
      logPortalEvent({
        event: "portal.send_log.insert_error",
        level: "warn",
        ok: false,
        error: error.message,
        metadata: { eventType: entry.eventType, channel: entry.channel },
      });
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (err) {
    logPortalEvent({
      event: "portal.send_log.insert_throw",
      level: "warn",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      metadata: { eventType: entry.eventType, channel: entry.channel },
    });
    return null;
  }
}

/**
 * Update a previously-logged send (e.g. when a delivery webhook fires).
 * Safe to call with a null id — becomes a no-op.
 */
export async function updateSendLogState(
  id: string | null,
  patch: {
    deliveryState?: DeliveryState;
    providerMessageId?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    latencyMs?: number;
    attempt?: number;
    metadataMerge?: Record<string, unknown>;
  },
): Promise<void> {
  if (!id) return;
  try {
    const admin = createAdminClient();
    const update: Record<string, unknown> = {};
    if (patch.deliveryState) update.delivery_state = patch.deliveryState;
    if (patch.providerMessageId !== undefined)
      update.provider_message_id = patch.providerMessageId;
    if (patch.errorCode !== undefined) update.error_code = patch.errorCode;
    if (patch.errorMessage !== undefined)
      update.error_message = patch.errorMessage;
    if (patch.latencyMs !== undefined) update.latency_ms = patch.latencyMs;
    if (patch.attempt !== undefined) update.attempt = patch.attempt;
    if (patch.metadataMerge) update.metadata = patch.metadataMerge;
    await admin
      .from("portal_send_log" as never)
      .update(update as never)
      .eq("id", id);
  } catch (err) {
    logPortalEvent({
      event: "portal.send_log.update_error",
      level: "warn",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Look up the most recent send-log row for a provider message id. Used by
 * the Resend delivery webhook to attach bounce/complaint/delivery state.
 */
export async function findSendLogByProviderMessageId(
  provider: string,
  providerMessageId: string,
): Promise<{
  id: string;
  siteId: string | null;
  userId: string | null;
} | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("portal_send_log" as never)
      .select("id, site_id, user_id")
      .eq("provider", provider)
      .eq("provider_message_id", providerMessageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = data as {
      id: string;
      site_id: string | null;
      user_id: string | null;
    } | null;
    if (!row) return null;
    return { id: row.id, siteId: row.site_id, userId: row.user_id };
  } catch {
    return null;
  }
}

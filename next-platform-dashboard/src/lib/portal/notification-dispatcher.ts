import "server-only";

/**
 * Portal notification dispatcher.
 *
 * ONE function is the single source of truth for deciding who gets notified
 * about a business event and through which channels. Callers (the 19 notify*
 * functions in `business-notifications.ts`, the live-chat bridges, etc.) stop
 * calling `createNotification` + `sendBrandedEmail` + `sendPushToUser`
 * directly; instead they call `dispatchBusinessEvent(...)`.
 *
 * Responsibilities:
 *   1. Resolve interested recipients (agency owner + portal users with the
 *      required permission flag). Impersonators are never recipients.
 *   2. Apply per-user × per-event × per-site × per-channel preferences from
 *      `portal_notification_preferences`. Default is all-on.
 *   3. Apply site-level channel toggles (the existing
 *      notification-channel-resolver feeds us `shouldSendEmail`/`shouldSendInApp`).
 *   4. Compute a deterministic `dedupe_key` so a double-submit becomes a
 *      single notification.
 *   5. Write a `portal_send_log` row for every dispatch decision — sent,
 *      deduped, skipped-by-preference, or failed. Nothing is silent.
 *
 * No PII, no email bodies, no note text is stored in the log. Only routing
 * metadata + message ids.
 */

import {
  dedupeRecipients,
  resolveInterestedRecipients,
  type DispatchRecipient,
} from "./recipient-resolver";
import {
  writeSendLog,
  updateSendLogState,
  type DeliveryState,
} from "./send-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/services/notifications";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import type { EmailType } from "@/lib/email/email-types";
import type { NotificationType } from "@/types/notifications";
import type { PortalPermissionKey } from "./permission-resolver";
import type { NotificationTemplateType } from "@/modules/ecommerce/types/ecommerce-types";
import {
  shouldSendEmail as siteAllowsEmail,
  shouldSendInApp as siteAllowsInApp,
} from "@/lib/services/notification-channel-resolver";

export interface DispatchOptions {
  /** Stable business event type. Drives preferences + dedupe. */
  eventType: NotificationType;
  /** Optional site-level channel template key for the site-side toggle. */
  siteTemplateType?: NotificationTemplateType;
  /** Permission flag gating access to the resource. Controls who gets listed
   *  as a portal recipient. Pass `null` for agency-owner-only events. */
  permission: PortalPermissionKey | null;
  /** Site the event happened on — drives tenant scoping + recipient lookup. */
  siteId: string;
  /** Resource pair for dedupe. */
  resourceType: string;
  resourceId: string;
  /** In-app copy. */
  title: string;
  message: string;
  link?: string;
  /** Metadata to persist on the notification row (kept out of send log). */
  metadata?: Record<string, unknown>;
  /** Web-push payload (reused for every recipient). `tag` is appended with
   *  the recipient user id to keep OS-level coalescing per-user. */
  push?: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    type?: "chat" | "notification" | "general";
  };
  /** Owner-facing transactional email — rendered per recipient so each user
   *  gets their own unsubscribe footer. */
  email?: {
    emailType: EmailType;
    data: Record<string, unknown>;
    subjectOverride?: string;
  };
  /**
   * User IDs to exclude from the recipient set. Use this when the caller has
   * already handled a recipient through a legacy path (e.g. the agency owner)
   * and only wants the dispatcher to fan out to the *additional* portal users.
   */
  excludeUserIds?: string[];
}

export interface DispatchResult {
  recipients: number;
  inAppSent: number;
  inAppSkipped: number;
  emailSent: number;
  emailSkipped: number;
  emailFailed: number;
  pushSent: number;
  pushSkipped: number;
  pushFailed: number;
}

interface UserChannelDecision {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

interface PreferenceRow {
  user_id: string;
  event_type: string;
  site_id: string | null;
  in_app: boolean;
  email: boolean;
  push: boolean;
}

/**
 * Main entry point. Never throws — notification failures must never break
 * the business flow that triggered them.
 */
export async function dispatchBusinessEvent(
  opts: DispatchOptions,
): Promise<DispatchResult> {
  const result: DispatchResult = {
    recipients: 0,
    inAppSent: 0,
    inAppSkipped: 0,
    emailSent: 0,
    emailSkipped: 0,
    emailFailed: 0,
    pushSent: 0,
    pushSkipped: 0,
    pushFailed: 0,
  };

  try {
    const raw = await resolveInterestedRecipients(opts.siteId, opts.permission);
    const excluded = new Set(opts.excludeUserIds ?? []);
    const filtered = raw.filter((r) => !excluded.has(r.userId));
    const recipients = dedupeRecipients(filtered);
    result.recipients = recipients.length;
    if (recipients.length === 0) return result;

    const prefs = await loadPreferencesBatch(
      recipients.map((r) => r.userId),
      opts.eventType,
      opts.siteId,
    );

    // Site-level channel toggles (cached inside resolver).
    const siteInAppAllowed = opts.siteTemplateType
      ? await siteAllowsInApp(opts.siteId, opts.siteTemplateType)
      : true;
    const siteEmailAllowed = opts.siteTemplateType
      ? await siteAllowsEmail(opts.siteId, opts.siteTemplateType)
      : true;

    await Promise.all(
      recipients.map((r) =>
        dispatchForRecipient(r, opts, prefs.get(r.userId), {
          siteInAppAllowed,
          siteEmailAllowed,
          result,
        }),
      ),
    );
  } catch (err) {
    // Dispatcher never throws out.
    console.error("[dispatcher] fatal error:", err);
  }

  return result;
}

async function dispatchForRecipient(
  recipient: DispatchRecipient,
  opts: DispatchOptions,
  pref: UserChannelDecision | undefined,
  siteCtx: {
    siteInAppAllowed: boolean;
    siteEmailAllowed: boolean;
    result: DispatchResult;
  },
): Promise<void> {
  const decision: UserChannelDecision = {
    inApp: pref?.inApp ?? true,
    email: pref?.email ?? true,
    push: pref?.push ?? true,
  };

  // --- IN-APP ---------------------------------------------------------
  const inAppKey = buildDedupeKey(opts, recipient.userId, "in_app");
  if (!decision.inApp || !siteCtx.siteInAppAllowed) {
    siteCtx.result.inAppSkipped++;
    await writeSendLog({
      eventType: opts.eventType,
      recipientClass: recipient.recipientClass,
      channel: "in_app",
      deliveryState: "skipped_preference",
      userId: recipient.userId,
      agencyId: recipient.agencyId,
      clientId: recipient.clientId,
      siteId: recipient.siteId,
      metadata: {
        reason: !decision.inApp ? "user_pref_off" : "site_pref_off",
      },
    });
  } else {
    const started = Date.now();
    const notif = await createNotification({
      userId: recipient.userId,
      type: opts.eventType,
      title: opts.title,
      message: opts.message,
      link: opts.link,
      metadata: opts.metadata,
      agencyId: recipient.agencyId,
      clientId: recipient.clientId,
      siteId: recipient.siteId,
      recipientClass: recipient.recipientClass,
      dedupeKey: inAppKey,
    });
    const state: DeliveryState = notif ? "sent" : "failed";
    if (notif) siteCtx.result.inAppSent++;
    await writeSendLog({
      eventType: opts.eventType,
      recipientClass: recipient.recipientClass,
      channel: "in_app",
      deliveryState: state,
      userId: recipient.userId,
      agencyId: recipient.agencyId,
      clientId: recipient.clientId,
      siteId: recipient.siteId,
      provider: "internal",
      providerMessageId: (notif as { id?: string } | null)?.id ?? null,
      latencyMs: Date.now() - started,
      metadata: { dedupeKey: inAppKey },
    });
  }

  // --- EMAIL ---------------------------------------------------------
  if (opts.email && recipient.email) {
    if (!decision.email || !siteCtx.siteEmailAllowed) {
      siteCtx.result.emailSkipped++;
      await writeSendLog({
        eventType: opts.eventType,
        recipientClass: recipient.recipientClass,
        channel: "email",
        deliveryState: "skipped_preference",
        userId: recipient.userId,
        agencyId: recipient.agencyId,
        clientId: recipient.clientId,
        siteId: recipient.siteId,
        metadata: {
          reason: !decision.email ? "user_pref_off" : "site_pref_off",
        },
      });
    } else {
      const logId = await writeSendLog({
        eventType: opts.eventType,
        recipientClass: recipient.recipientClass,
        channel: "email",
        deliveryState: "queued",
        userId: recipient.userId,
        agencyId: recipient.agencyId,
        clientId: recipient.clientId,
        siteId: recipient.siteId,
        provider: "resend",
        metadata: { emailType: opts.email.emailType },
      });
      const started = Date.now();
      const res = await sendBrandedEmail(recipient.agencyId, {
        to: { email: recipient.email, name: recipient.name ?? undefined },
        emailType: opts.email.emailType,
        data: opts.email.data,
        recipientUserId: recipient.userId,
        subjectOverride: opts.email.subjectOverride,
        sendLogId: logId,
      });
      const latencyMs = Date.now() - started;
      if (res.success) {
        siteCtx.result.emailSent++;
        await updateSendLogState(logId, {
          deliveryState: "sent",
          providerMessageId: res.messageId ?? null,
          latencyMs,
        });
      } else {
        siteCtx.result.emailFailed++;
        await updateSendLogState(logId, {
          deliveryState: "failed",
          errorMessage: res.error ?? "unknown",
          latencyMs,
        });
      }
    }
  }

  // --- PUSH ---------------------------------------------------------
  if (opts.push) {
    if (!decision.push) {
      siteCtx.result.pushSkipped++;
      await writeSendLog({
        eventType: opts.eventType,
        recipientClass: recipient.recipientClass,
        channel: "push",
        deliveryState: "skipped_preference",
        userId: recipient.userId,
        agencyId: recipient.agencyId,
        clientId: recipient.clientId,
        siteId: recipient.siteId,
        metadata: { reason: "user_pref_off" },
      });
    } else {
      const started = Date.now();
      let ok = false;
      let errMsg: string | null = null;
      try {
        const mod = await import("@/lib/actions/web-push");
        const res = await mod.sendPushToUser(recipient.userId, {
          title: opts.push.title,
          body: opts.push.body,
          url: opts.push.url,
          tag: opts.push.tag
            ? `${opts.push.tag}:${recipient.userId}`
            : undefined,
          type: opts.push.type || "notification",
          renotify: true,
        });
        ok = Boolean((res as { sent?: number } | undefined)?.sent ?? true);
      } catch (err) {
        errMsg = err instanceof Error ? err.message : String(err);
      }
      if (ok) siteCtx.result.pushSent++;
      else siteCtx.result.pushFailed++;
      await writeSendLog({
        eventType: opts.eventType,
        recipientClass: recipient.recipientClass,
        channel: "push",
        deliveryState: ok ? "sent" : "failed",
        userId: recipient.userId,
        agencyId: recipient.agencyId,
        clientId: recipient.clientId,
        siteId: recipient.siteId,
        provider: "web_push",
        latencyMs: Date.now() - started,
        errorMessage: errMsg,
      });
    }
  }
}

function buildDedupeKey(
  opts: DispatchOptions,
  userId: string,
  channel: string,
): string {
  return `${opts.eventType}:${opts.resourceType}:${opts.resourceId}:${userId}:${channel}`;
}

/**
 * Load per-user preferences for a specific event_type × site in one query.
 * Site-scoped preference wins over the user's global default.
 */
async function loadPreferencesBatch(
  userIds: string[],
  eventType: string,
  siteId: string,
): Promise<Map<string, UserChannelDecision>> {
  const out = new Map<string, UserChannelDecision>();
  if (userIds.length === 0) return out;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("portal_notification_preferences" as never)
      .select("user_id, event_type, site_id, in_app, email, push")
      .in("user_id", userIds)
      .eq("event_type", eventType);

    const rows = (data ?? []) as PreferenceRow[];
    // site-scoped wins over global (null site_id)
    for (const r of rows) {
      if (r.site_id && r.site_id === siteId) {
        out.set(r.user_id, {
          inApp: r.in_app,
          email: r.email,
          push: r.push,
        });
      }
    }
    for (const r of rows) {
      if (!r.site_id && !out.has(r.user_id)) {
        out.set(r.user_id, {
          inApp: r.in_app,
          email: r.email,
          push: r.push,
        });
      }
    }
  } catch (err) {
    console.error("[dispatcher] preference load error:", err);
  }
  return out;
}

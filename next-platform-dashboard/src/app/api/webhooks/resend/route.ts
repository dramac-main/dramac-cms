/**
 * Resend webhook endpoint.
 *
 * Resend signs webhook deliveries using Svix-style headers:
 *   svix-id, svix-timestamp, svix-signature
 *
 * `svix-signature` is a space-separated list of `v1,<base64(hmac_sha256(signedPayload, secret))>`
 * entries where `signedPayload = ${svix_id}.${svix_timestamp}.${raw_body}`.
 *
 * Set `RESEND_WEBHOOK_SECRET` in env. If unset we still accept (dev mode)
 * but log a warning — in production the secret MUST be set.
 *
 * Events handled (mapped onto portal_send_log.delivery_state):
 *   email.sent           -> delivered=false, just confirms acceptance (no-op)
 *   email.delivered      -> delivered
 *   email.bounced        -> bounced
 *   email.complained     -> complained
 *   email.opened         -> opened
 *   email.clicked        -> clicked
 *   email.failed         -> failed
 *   email.delivery_delayed -> no update; already queued
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSendLogState } from "@/lib/portal/send-log";

type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked"
  | "email.failed"
  | "email.delivery_delayed";

interface ResendWebhookBody {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
    bounce?: { message?: string };
    click?: { link?: string };
    [k: string]: unknown;
  };
}

function verifySvixSignature(
  rawBody: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  secret: string,
): boolean {
  if (!svixId || !svixTimestamp || !svixSignature) return false;
  // Svix secrets are prefixed with `whsec_` — strip and base64-decode.
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret, "utf8");
  const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedPayload)
    .digest("base64");
  // Signature header may contain multiple entries: "v1,abc v1,def"
  const entries = svixSignature.split(" ");
  for (const entry of entries) {
    const [version, sig] = entry.split(",");
    if (version !== "v1" || !sig) continue;
    try {
      if (
        crypto.timingSafeEqual(
          Buffer.from(sig, "base64"),
          Buffer.from(expected, "base64"),
        )
      ) {
        return true;
      }
    } catch {
      // length mismatch — try next
    }
  }
  return false;
}

function mapEventToStatus(type: ResendEventType): {
  emailStatus: string | null;
  deliveryState:
    | "sent"
    | "failed"
    | "delivered"
    | "bounced"
    | "complained"
    | "opened"
    | "clicked"
    | null;
} {
  switch (type) {
    case "email.sent":
      return { emailStatus: "sent", deliveryState: "sent" };
    case "email.delivered":
      return { emailStatus: "delivered", deliveryState: "delivered" };
    case "email.bounced":
      return { emailStatus: "bounced", deliveryState: "bounced" };
    case "email.complained":
      return { emailStatus: "complained", deliveryState: "complained" };
    case "email.opened":
      return { emailStatus: "opened", deliveryState: "opened" };
    case "email.clicked":
      return { emailStatus: "clicked", deliveryState: "clicked" };
    case "email.failed":
      return { emailStatus: "failed", deliveryState: "failed" };
    default:
      return { emailStatus: null, deliveryState: null };
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (secret) {
    const verified = verifySvixSignature(
      rawBody,
      request.headers.get("svix-id"),
      request.headers.get("svix-timestamp"),
      request.headers.get("svix-signature"),
      secret,
    );
    if (!verified) {
      console.warn("[resend-webhook] invalid signature");
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET missing in prod");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  let body: ResendWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const messageId = body?.data?.email_id;
  if (!messageId) {
    return NextResponse.json({ ok: true, ignored: "no message id" });
  }

  const { emailStatus, deliveryState } = mapEventToStatus(body.type);
  if (!emailStatus || !deliveryState) {
    return NextResponse.json({ ok: true, ignored: body.type });
  }

  const supabase = createAdminClient();
  try {
    // 1. Update email_logs row (if it exists). Preserve send_log_id for step 2.
    const { data: existing } = await supabase
      .from("email_logs" as never)
      .select("id, send_log_id")
      .eq("resend_message_id", messageId)
      .maybeSingle();

    const row = existing as { id: string; send_log_id: string | null } | null;

    const errorMsg =
      body.type === "email.bounced"
        ? body.data.bounce?.message ?? "bounced"
        : body.type === "email.complained"
          ? "complained"
          : body.type === "email.failed"
            ? "failed"
            : null;

    await supabase
      .from("email_logs" as never)
      .update({
        status: emailStatus,
        error_message: errorMsg,
        last_event_at: new Date().toISOString(),
      } as never)
      .eq("resend_message_id", messageId);

    // 2. Update portal_send_log so the portal surfaces the final state.
    if (row?.send_log_id) {
      await updateSendLogState(row.send_log_id, {
        deliveryState,
        providerMessageId: messageId,
        errorMessage: errorMsg,
      });
    }

    return NextResponse.json({ ok: true, type: body.type });
  } catch (err) {
    console.error("[resend-webhook] error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

/**
 * Meta WhatsApp Status Webhook Handler
 *
 * Phase MKT-08: SMS & WhatsApp Channel Foundation
 *
 * Processes Meta Cloud API webhook events for WhatsApp delivery tracking:
 * - sent, delivered, read, failed
 *
 * GET  /api/marketing/webhooks/whatsapp-status — Verification challenge
 * POST /api/marketing/webhooks/whatsapp-status — Status updates
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";

export const dynamic = "force-dynamic";

/**
 * Webhook verification (Meta requires this for setup)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * WhatsApp status callback processing
 */
export async function POST(request: NextRequest) {
  let payload: WhatsAppWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Meta sends a nested structure
  const entries = payload?.entry;
  if (!entries || !Array.isArray(entries)) {
    return NextResponse.json({ received: true, processed: 0 });
  }

  const supabase = createAdminClient() as any;
  let processed = 0;

  for (const entry of entries) {
    const changes = entry.changes;
    if (!changes || !Array.isArray(changes)) continue;

    for (const change of changes) {
      if (change.field !== "messages") continue;

      const statuses = change.value?.statuses;
      if (!statuses || !Array.isArray(statuses)) continue;

      for (const status of statuses) {
        await processWhatsAppStatus(supabase, status);
        processed++;
      }
    }
  }

  return NextResponse.json({ received: true, processed });
}

async function processWhatsAppStatus(supabase: any, status: WhatsAppStatus) {
  const { id: waMessageId, status: messageStatus, errors } = status;

  if (!waMessageId || !messageStatus) return;

  // Find the campaign send record by provider message ID
  const { data: sendRecord } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("id, campaign_id, subscriber_id, site_id")
    .eq("provider_message_id", waMessageId)
    .single();

  if (!sendRecord) return;

  const { id: sendId, campaign_id: campaignId, site_id: siteId } = sendRecord;
  const today = new Date().toISOString().split("T")[0];

  switch (messageStatus) {
    case "delivered": {
      await supabase
        .from(MKT_TABLES.campaignSends)
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", sendId);

      await incrementSendingStat(supabase, siteId, today, "sms_delivered");

      if (siteId) {
        try {
          await logAutomationEvent(
            siteId,
            "marketing.whatsapp.delivered",
            {
              campaign_id: campaignId,
              subscriber_id: sendRecord.subscriber_id,
            },
            {
              sourceModule: "marketing",
              sourceEntityType: "campaign_send",
              sourceEntityId: sendId,
            },
          );
        } catch (e) {
          console.error("[WhatsApp Webhook] Automation event error:", e);
        }
      }
      break;
    }

    case "read": {
      await supabase
        .from(MKT_TABLES.campaignSends)
        .update({
          status: "read",
          first_opened_at: new Date().toISOString(),
        })
        .eq("id", sendId);

      if (siteId) {
        try {
          await logAutomationEvent(
            siteId,
            "marketing.whatsapp.read",
            {
              campaign_id: campaignId,
              subscriber_id: sendRecord.subscriber_id,
            },
            {
              sourceModule: "marketing",
              sourceEntityType: "campaign_send",
              sourceEntityId: sendId,
            },
          );
        } catch (e) {
          console.error("[WhatsApp Webhook] Automation event error:", e);
        }
      }
      break;
    }

    case "failed": {
      const errorMessage = errors?.[0]?.title || "WhatsApp delivery failed";

      await supabase
        .from(MKT_TABLES.campaignSends)
        .update({
          status: "failed",
          error_message: errorMessage,
          failed_at: new Date().toISOString(),
        })
        .eq("id", sendId);

      await incrementSendingStat(supabase, siteId, today, "sms_failed");

      if (siteId) {
        try {
          await logAutomationEvent(
            siteId,
            "marketing.whatsapp.failed",
            {
              campaign_id: campaignId,
              subscriber_id: sendRecord.subscriber_id,
              error: errorMessage,
            },
            {
              sourceModule: "marketing",
              sourceEntityType: "campaign_send",
              sourceEntityId: sendId,
            },
          );
        } catch (e) {
          console.error("[WhatsApp Webhook] Automation event error:", e);
        }
      }
      break;
    }

    case "sent": {
      await supabase
        .from(MKT_TABLES.campaignSends)
        .update({ status: "sent" })
        .eq("id", sendId);
      break;
    }
  }
}

async function incrementSendingStat(
  supabase: any,
  siteId: string,
  date: string,
  field: string,
) {
  const { data: existing } = await supabase
    .from(MKT_TABLES.sendingStats)
    .select(`id, ${field}`)
    .eq("site_id", siteId)
    .eq("date", date)
    .single();

  if (existing) {
    await supabase
      .from(MKT_TABLES.sendingStats)
      .update({ [field]: (existing[field] || 0) + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from(MKT_TABLES.sendingStats).insert({
      site_id: siteId,
      date,
      [field]: 1,
    });
  }
}

// ── Meta WhatsApp Webhook Types ──────────────────────────────

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        statuses?: WhatsAppStatus[];
      };
    }>;
  }>;
}

interface WhatsAppStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

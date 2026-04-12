/**
 * Twilio SMS Status Webhook Handler
 *
 * Phase MKT-08: SMS & WhatsApp Channel Foundation
 *
 * Processes Twilio status callback events for SMS delivery tracking:
 * - queued, sent, delivered, undelivered, failed
 *
 * POST /api/marketing/webhooks/sms-status
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: URLSearchParams;
  try {
    const text = await request.text();
    body = new URLSearchParams(text);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const messageSid = body.get("MessageSid");
  const messageStatus = body.get("MessageStatus");
  const errorCode = body.get("ErrorCode");
  const to = body.get("To");

  if (!messageSid || !messageStatus) {
    return NextResponse.json(
      { error: "Missing MessageSid or MessageStatus" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient() as any;

  // Find the campaign send record by provider message ID
  const { data: sendRecord } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("id, campaign_id, subscriber_id, site_id")
    .eq("provider_message_id", messageSid)
    .single();

  if (!sendRecord) {
    // Not a marketing SMS — might be transactional, ignore
    return NextResponse.json({ received: true, matched: false });
  }

  const { id: sendId, campaign_id: campaignId, site_id: siteId } = sendRecord;
  const today = new Date().toISOString().split("T")[0];

  try {
    switch (messageStatus) {
      case "delivered": {
        await supabase
          .from(MKT_TABLES.campaignSends)
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", sendId);

        // Update daily stats
        await incrementSendingStat(supabase, siteId, today, "sms_delivered");

        if (siteId) {
          try {
            await logAutomationEvent(
              siteId,
              "marketing.sms.delivered",
              {
                campaign_id: campaignId,
                subscriber_id: sendRecord.subscriber_id,
                phone: to,
              },
              {
                sourceModule: "marketing",
                sourceEntityType: "campaign_send",
                sourceEntityId: sendId,
              },
            );
          } catch (e) {
            console.error("[SMS Webhook] Automation event error:", e);
          }
        }
        break;
      }

      case "failed":
      case "undelivered": {
        await supabase
          .from(MKT_TABLES.campaignSends)
          .update({
            status: "failed",
            error_message: errorCode
              ? `Twilio error: ${errorCode}`
              : `SMS ${messageStatus}`,
            failed_at: new Date().toISOString(),
          })
          .eq("id", sendId);

        await incrementSendingStat(supabase, siteId, today, "sms_failed");

        if (siteId) {
          try {
            await logAutomationEvent(
              siteId,
              "marketing.sms.failed",
              {
                campaign_id: campaignId,
                subscriber_id: sendRecord.subscriber_id,
                phone: to,
                error_code: errorCode,
              },
              {
                sourceModule: "marketing",
                sourceEntityType: "campaign_send",
                sourceEntityId: sendId,
              },
            );
          } catch (e) {
            console.error("[SMS Webhook] Automation event error:", e);
          }
        }
        break;
      }

      case "sent":
      case "queued": {
        await supabase
          .from(MKT_TABLES.campaignSends)
          .update({ status: messageStatus })
          .eq("id", sendId);
        break;
      }
    }

    return NextResponse.json({ received: true, status: messageStatus });
  } catch (error) {
    console.error("[SMS Webhook] Processing error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
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

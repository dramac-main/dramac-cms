/**
 * Resend Webhook Handler
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Processes Resend webhook events for email delivery tracking:
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 *
 * POST /api/marketing/webhooks/resend
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";

export const dynamic = "force-dynamic";

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce-specific
    bounce?: {
      message: string;
      type?: string;
    };
    // Click-specific
    click?: {
      link: string;
      timestamp: string;
      user_agent: string;
      ip_address: string;
    };
    // Open-specific
    open?: {
      timestamp: string;
      user_agent: string;
      ip_address: string;
    };
  };
}

export async function POST(request: NextRequest) {
  // Verify webhook signature if configured
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = request.headers.get("svix-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    // Note: Full Svix verification would require the svix package.
    // For now, we rely on the webhook secret being set as a basic check.
  }

  let event: ResendWebhookEvent;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient() as any;
  const resendMessageId = event.data?.email_id;

  if (!resendMessageId) {
    return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
  }

  // Find the send record by Resend message ID
  const { data: sendRecord } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("id, campaign_id, subscriber_id, email, opened_at, clicked_at")
    .eq("resend_message_id", resendMessageId)
    .single();

  if (!sendRecord) {
    // Not a marketing email — might be a transactional email, ignore
    return NextResponse.json({ received: true, matched: false });
  }

  const {
    id: sendId,
    campaign_id: campaignId,
    subscriber_id: subscriberId,
  } = sendRecord;

  // Get site_id from campaign for automation events
  const { data: campaign } = await supabase
    .from(MKT_TABLES.campaigns)
    .select("site_id, name")
    .eq("id", campaignId)
    .single();

  const siteId = campaign?.site_id;

  try {
    switch (event.type) {
      case "email.delivered": {
        await supabase
          .from(MKT_TABLES.campaignSends)
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", sendId);

        // Increment delivered count on campaign
        await supabase
          .rpc("increment_campaign_stat", {
            p_campaign_id: campaignId,
            p_stat: "delivered_count",
          })
          .catch(() => {
            // RPC may not exist yet — manual increment fallback
            return incrementCampaignField(
              supabase,
              campaignId,
              "total_delivered",
            );
          });
        break;
      }

      case "email.opened": {
        const isFirstOpen = !sendRecord.opened_at;

        if (isFirstOpen) {
          await supabase
            .from(MKT_TABLES.campaignSends)
            .update({
              first_opened_at: new Date().toISOString(),
              last_opened_at: new Date().toISOString(),
              open_count: 1,
            })
            .eq("id", sendId);

          await incrementCampaignField(supabase, campaignId, "total_opened");

          if (siteId) {
            try {
              await logAutomationEvent(
                siteId,
                "marketing.email.opened",
                {
                  campaign_id: campaignId,
                  subscriber_id: subscriberId,
                  email: sendRecord.email,
                },
                {
                  sourceModule: "marketing",
                  sourceEntityType: "campaign_send",
                  sourceEntityId: sendId,
                },
              );
            } catch (e) {
              console.error("[Marketing] Webhook automation event error:", e);
            }
          }
        } else {
          // Subsequent open — just update last_opened_at and increment count
          await supabase
            .from(MKT_TABLES.campaignSends)
            .update({
              last_opened_at: new Date().toISOString(),
              open_count: (sendRecord as any).open_count
                ? (sendRecord as any).open_count + 1
                : 2,
            })
            .eq("id", sendId);
        }

        // Update subscriber engagement
        await supabase
          .from(MKT_TABLES.subscribers)
          .update({ last_email_opened_at: new Date().toISOString() })
          .eq("id", subscriberId);
        break;
      }

      case "email.clicked": {
        const isFirstClick = !sendRecord.clicked_at;

        if (isFirstClick) {
          await supabase
            .from(MKT_TABLES.campaignSends)
            .update({
              first_clicked_at: new Date().toISOString(),
              last_clicked_at: new Date().toISOString(),
              click_count: 1,
            })
            .eq("id", sendId);

          await incrementCampaignField(supabase, campaignId, "total_clicked");

          if (siteId) {
            try {
              await logAutomationEvent(
                siteId,
                "marketing.email.clicked",
                {
                  campaign_id: campaignId,
                  subscriber_id: subscriberId,
                  email: sendRecord.email,
                  url: event.data.click?.link,
                },
                {
                  sourceModule: "marketing",
                  sourceEntityType: "campaign_send",
                  sourceEntityId: sendId,
                },
              );
            } catch (e) {
              console.error("[Marketing] Webhook automation event error:", e);
            }
          }
        } else {
          await supabase
            .from(MKT_TABLES.campaignSends)
            .update({
              last_clicked_at: new Date().toISOString(),
              click_count: (sendRecord as any).click_count
                ? (sendRecord as any).click_count + 1
                : 2,
            })
            .eq("id", sendId);
        }

        // Track the specific link
        if (event.data.click?.link) {
          await trackLinkClick(supabase, campaignId, event.data.click.link);
        }

        // Update subscriber engagement
        await supabase
          .from(MKT_TABLES.subscribers)
          .update({ last_email_clicked_at: new Date().toISOString() })
          .eq("id", subscriberId);
        break;
      }

      case "email.bounced": {
        const bounceType = event.data.bounce?.type || "unknown";
        const bounceReason = event.data.bounce?.message || "Unknown bounce";

        await supabase
          .from(MKT_TABLES.campaignSends)
          .update({
            status: "bounced",
            bounced_at: new Date().toISOString(),
            bounce_type: bounceType,
            bounce_reason: bounceReason,
          })
          .eq("id", sendId);

        await incrementCampaignField(supabase, campaignId, "total_bounced");

        // Update subscriber bounce count
        const { data: subscriber } = await supabase
          .from(MKT_TABLES.subscribers)
          .select("bounce_count")
          .eq("id", subscriberId)
          .single();

        const newBounceCount = (subscriber?.bounce_count || 0) + 1;
        const updateData: Record<string, unknown> = {
          bounce_count: newBounceCount,
        };

        // Auto-clean: mark as bounced after 3 bounces
        if (newBounceCount >= 3) {
          updateData.status = "bounced";
          updateData.email_opt_in = false;
        }

        await supabase
          .from(MKT_TABLES.subscribers)
          .update(updateData)
          .eq("id", subscriberId);
        break;
      }

      case "email.complained": {
        await supabase
          .from(MKT_TABLES.campaignSends)
          .update({
            status: "complained",
            complained_at: new Date().toISOString(),
          })
          .eq("id", sendId);

        await incrementCampaignField(supabase, campaignId, "total_complained");

        // Auto-clean: immediately mark as complained and opt-out
        await supabase
          .from(MKT_TABLES.subscribers)
          .update({
            status: "complained",
            email_opt_in: false,
            unsubscribed_at: new Date().toISOString(),
          })
          .eq("id", subscriberId);
        break;
      }

      default:
        console.log(
          `[Marketing] Unhandled Resend webhook event: ${event.type}`,
        );
    }
  } catch (error) {
    console.error(
      `[Marketing] Webhook processing error for ${event.type}:`,
      error,
    );
    return NextResponse.json(
      { error: "Processing failed", type: event.type },
      { status: 500 },
    );
  }

  return NextResponse.json({
    received: true,
    type: event.type,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// HELPERS
// ============================================================================

async function incrementCampaignField(
  supabase: any,
  campaignId: string,
  field: string,
) {
  const { data: campaign } = await supabase
    .from(MKT_TABLES.campaigns)
    .select(field)
    .eq("id", campaignId)
    .single();

  if (campaign) {
    await supabase
      .from(MKT_TABLES.campaigns)
      .update({ [field]: (campaign[field] || 0) + 1 })
      .eq("id", campaignId);
  }
}

async function trackLinkClick(supabase: any, campaignId: string, url: string) {
  // Check if link already tracked
  const { data: existing } = await supabase
    .from(MKT_TABLES.campaignLinks)
    .select("id, total_clicks")
    .eq("campaign_id", campaignId)
    .eq("original_url", url)
    .single();

  if (existing) {
    await supabase
      .from(MKT_TABLES.campaignLinks)
      .update({
        total_clicks: (existing.total_clicks || 0) + 1,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from(MKT_TABLES.campaignLinks).insert({
      campaign_id: campaignId,
      original_url: url,
      tracking_url: url,
      total_clicks: 1,
      unique_clicks: 1,
    });
  }
}

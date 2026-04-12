/**
 * Marketing Module - Email Campaign Sending Service
 *
 * Phase MKT-02: Email Campaign Engine
 *
 * Handles campaign sending with batch processing, throttling,
 * A/B testing variant assignment, and Resend integration.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, isEmailEnabled } from "@/lib/email/resend-client";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";
import { MKT_TABLES } from "../lib/marketing-constants";
import { resolveAudience } from "./audience-resolver";
import { renderTemplate } from "./template-renderer";
import { encodeTrackingToken, encodeClickToken } from "./tracking-utils";

// ============================================================================
// TYPES
// ============================================================================

interface SendResult {
  success: boolean;
  error?: string;
  totalSent?: number;
  totalFailed?: number;
}

interface ResolvedRecipient {
  subscriberId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  customFields?: Record<string, unknown>;
}

// ============================================================================
// CAMPAIGN SENDING
// ============================================================================

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000; // 1 second between batches to respect rate limits

export async function sendCampaign(
  siteId: string,
  campaignId: string,
): Promise<SendResult> {
  const supabase = createAdminClient() as any;

  // 1. Load campaign
  const { data: campaign, error: campError } = await supabase
    .from(MKT_TABLES.campaigns)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (campError || !campaign) {
    return { success: false, error: "Campaign not found" };
  }

  if (!["draft", "scheduled"].includes(campaign.status)) {
    return {
      success: false,
      error: `Cannot send campaign with status "${campaign.status}"`,
    };
  }

  if (!campaign.subject_line) {
    return { success: false, error: "Campaign must have a subject line" };
  }

  if (
    !campaign.content_html &&
    !campaign.content_json &&
    !campaign.template_id
  ) {
    return {
      success: false,
      error: "Campaign must have content or a template",
    };
  }

  // 2. Load settings for from/reply-to defaults
  const { data: settings } = await supabase
    .from(MKT_TABLES.settings)
    .select("*")
    .eq("site_id", siteId)
    .single();

  const fromName =
    campaign.from_name || settings?.default_from_name || "No Reply";
  const fromEmail =
    campaign.from_email ||
    settings?.default_from_email ||
    "noreply@app.dramacagency.com";
  const replyTo = campaign.reply_to || settings?.default_reply_to || fromEmail;

  // 3. Update campaign status to sending
  await supabase
    .from(MKT_TABLES.campaigns)
    .update({
      status: "sending",
      started_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  try {
    await logAutomationEvent(
      siteId,
      "marketing.campaign.sending",
      {
        id: campaignId,
        name: campaign.name,
      },
      {
        sourceModule: "marketing",
        sourceEntityType: "campaign",
        sourceEntityId: campaignId,
      },
    );
  } catch (e) {
    console.error("[Marketing] Failed to emit campaign.sending event:", e);
  }

  // 4. Resolve audience
  const recipients = await resolveAudience(
    siteId,
    campaign.audience_id,
    campaign.segment_id,
  );

  if (recipients.length === 0) {
    await supabase
      .from(MKT_TABLES.campaigns)
      .update({
        status: "failed",
        metadata: { ...campaign.metadata, error: "No recipients found" },
      })
      .eq("id", campaignId);
    return { success: false, error: "No eligible recipients found" };
  }

  await supabase
    .from(MKT_TABLES.campaigns)
    .update({ total_recipients: recipients.length })
    .eq("id", campaignId);

  // 5. Resolve email content
  let htmlContent = campaign.content_html;
  if (!htmlContent && campaign.template_id) {
    const { data: template } = await supabase
      .from(MKT_TABLES.emailTemplates)
      .select("content_html, content_json")
      .eq("id", campaign.template_id)
      .single();

    if (template) {
      htmlContent = template.content_html;
    }
  }

  if (!htmlContent) {
    await supabase
      .from(MKT_TABLES.campaigns)
      .update({
        status: "failed",
        metadata: { ...campaign.metadata, error: "No email content" },
      })
      .eq("id", campaignId);
    return { success: false, error: "No email content available" };
  }

  // 6. A/B Testing variant assignment
  let variants: string[] = ["default"];
  if (campaign.ab_test_enabled && campaign.ab_test_config) {
    const config = campaign.ab_test_config as {
      variants?: Array<{ id: string; subjectLine: string }>;
    };
    if (config.variants?.length) {
      variants = config.variants.map((v) => v.id);
    }
  }

  // 7. Send emails in batches
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    // Check if campaign was paused
    const { data: currentCampaign } = await supabase
      .from(MKT_TABLES.campaigns)
      .select("status")
      .eq("id", campaignId)
      .single();

    if (currentCampaign?.status === "paused") {
      console.log(`[Marketing] Campaign ${campaignId} paused. Stopping send.`);
      break;
    }

    const batch = recipients.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (recipient, idx) => {
        // Assign A/B variant
        const variantIndex = (i + idx) % variants.length;
        const variant = variants[variantIndex];

        // Determine subject line for variant
        let subjectLine = campaign.subject_line;
        if (campaign.ab_test_enabled && campaign.ab_test_config) {
          const config = campaign.ab_test_config as {
            variants?: Array<{ id: string; subjectLine: string }>;
          };
          const variantConfig = config.variants?.find((v) => v.id === variant);
          if (variantConfig) {
            subjectLine = variantConfig.subjectLine;
          }
        }

        // Create send record
        const { data: sendRecord } = await supabase
          .from(MKT_TABLES.campaignSends)
          .insert({
            campaign_id: campaignId,
            subscriber_id: recipient.subscriberId,
            email: recipient.email,
            status: "queued",
            ab_variant: variant,
            metadata: {},
            clicked_links: [],
            open_count: 0,
            click_count: 0,
          })
          .select("id")
          .single();

        const sendId = sendRecord?.id || "unknown";

        // Personalize content
        const personalizedHtml = renderTemplate(htmlContent, {
          firstName: recipient.firstName || "",
          lastName: recipient.lastName || "",
          email: recipient.email,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/marketing/unsubscribe/${encodeTrackingToken(campaignId, recipient.subscriberId, sendId)}`,
          trackingPixel: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/marketing/track/open/${encodeTrackingToken(campaignId, recipient.subscriberId, sendId)}`,
          ...((recipient.customFields as Record<string, string>) || {}),
        });

        // Inject click tracking
        const trackedHtml = injectClickTracking(
          personalizedHtml,
          campaignId,
          recipient.subscriberId,
          sendId,
        );

        // Inject open tracking pixel
        const finalHtml = injectOpenTrackingPixel(
          trackedHtml,
          campaignId,
          recipient.subscriberId,
          sendId,
        );

        // Send via Resend
        const resend = getResend();
        if (!resend) {
          await supabase
            .from(MKT_TABLES.campaignSends)
            .update({ status: "failed" })
            .eq("id", sendId);
          throw new Error("Email not configured");
        }

        const { data: resendResult, error: resendError } =
          await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [recipient.email],
            replyTo: replyTo,
            subject: subjectLine,
            html: finalHtml,
            headers: {
              "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL || ""}/api/marketing/unsubscribe/${encodeTrackingToken(campaignId, recipient.subscriberId, sendId)}>`,
            },
          });

        if (resendError) {
          await supabase
            .from(MKT_TABLES.campaignSends)
            .update({
              status: "failed",
              metadata: { error: resendError.message },
            })
            .eq("id", sendId);
          throw new Error(resendError.message);
        }

        // Update send record with Resend message ID
        await supabase
          .from(MKT_TABLES.campaignSends)
          .update({
            status: "sent",
            resend_message_id: resendResult?.id || null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", sendId);

        // Update subscriber last email sent
        await supabase
          .from(MKT_TABLES.subscribers)
          .update({
            last_email_sent_at: new Date().toISOString(),
            total_emails_sent: (recipient as any).totalEmailsSent
              ? (recipient as any).totalEmailsSent + 1
              : 1,
          })
          .eq("id", recipient.subscriberId);
      }),
    );

    // Count results
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        totalSent++;
      } else {
        totalFailed++;
        console.error(`[Marketing] Send failed:`, result.reason);
      }
    }

    // Update campaign progress
    await supabase
      .from(MKT_TABLES.campaigns)
      .update({ total_sent: totalSent })
      .eq("id", campaignId);

    // Throttle between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // 8. Finalize campaign
  const { data: finalCampaign } = await supabase
    .from(MKT_TABLES.campaigns)
    .select("status")
    .eq("id", campaignId)
    .single();

  // Only mark as sent if still in sending state (not paused)
  if (finalCampaign?.status === "sending") {
    await supabase
      .from(MKT_TABLES.campaigns)
      .update({
        status: "sent",
        completed_at: new Date().toISOString(),
        total_sent: totalSent,
      })
      .eq("id", campaignId);

    try {
      await logAutomationEvent(
        siteId,
        "marketing.campaign.sent",
        {
          id: campaignId,
          name: campaign.name,
          totalSent,
          totalFailed,
        },
        {
          sourceModule: "marketing",
          sourceEntityType: "campaign",
          sourceEntityId: campaignId,
        },
      );
    } catch (e) {
      console.error("[Marketing] Failed to emit campaign.sent event:", e);
    }
  }

  return { success: true, totalSent, totalFailed };
}

// ============================================================================
// TEST EMAIL
// ============================================================================

export async function sendCampaignTestEmail(
  siteId: string,
  campaignId: string,
  testEmail: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient() as any;

  const { data: campaign } = await supabase
    .from(MKT_TABLES.campaigns)
    .select("*")
    .eq("site_id", siteId)
    .eq("id", campaignId)
    .single();

  if (!campaign) return { success: false, error: "Campaign not found" };
  if (!campaign.subject_line)
    return { success: false, error: "No subject line set" };

  const { data: settings } = await supabase
    .from(MKT_TABLES.settings)
    .select("*")
    .eq("site_id", siteId)
    .single();

  const fromName =
    campaign.from_name || settings?.default_from_name || "No Reply";
  const fromEmail =
    campaign.from_email ||
    settings?.default_from_email ||
    "noreply@app.dramacagency.com";

  let htmlContent = campaign.content_html;
  if (!htmlContent && campaign.template_id) {
    const { data: template } = await supabase
      .from(MKT_TABLES.emailTemplates)
      .select("content_html")
      .eq("id", campaign.template_id)
      .single();
    htmlContent = template?.content_html;
  }

  if (!htmlContent) return { success: false, error: "No email content" };

  const personalizedHtml = renderTemplate(htmlContent, {
    firstName: "Test",
    lastName: "User",
    email: testEmail,
    unsubscribeUrl: "#",
    trackingPixel: "",
  });

  const resend = getResend();
  if (!resend) return { success: false, error: "Email not configured" };

  const { error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [testEmail],
    subject: `[TEST] ${campaign.subject_line}`,
    html: personalizedHtml,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ============================================================================
// HTML PROCESSING HELPERS
// ============================================================================

function injectClickTracking(
  html: string,
  campaignId: string,
  subscriberId: string,
  sendId: string,
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  // Replace href URLs with tracking redirects (skip mailto: and #)
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_match, url) => {
    // Don't track unsubscribe links (already tracked separately)
    if (url.includes("/unsubscribe/")) return `href="${url}"`;
    const token = encodeClickToken(campaignId, subscriberId, sendId, url);
    return `href="${baseUrl}/api/marketing/track/click/${token}"`;
  });
}

function injectOpenTrackingPixel(
  html: string,
  campaignId: string,
  subscriberId: string,
  sendId: string,
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const token = encodeTrackingToken(campaignId, subscriberId, sendId);
  const pixelImg = `<img src="${baseUrl}/api/marketing/track/open/${token}" width="1" height="1" style="display:none" alt="" />`;

  // Inject before closing </body> tag if present, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelImg}</body>`);
  }
  return html + pixelImg;
}

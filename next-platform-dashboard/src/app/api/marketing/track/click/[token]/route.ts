/**
 * Click Tracking Redirect Route
 *
 * Phase MKT-03: Email Analytics & Tracking
 *
 * Validates the click token, records the click event, and redirects
 * the user to the original URL.
 *
 * Route: /api/marketing/track/click/[token]
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeClickToken } from "@/modules/marketing/services/tracking-utils";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";

export const dynamic = "force-dynamic";

// Block common phishing/injection targets
const BLOCKED_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const {
      campaignId,
      subscriberId,
      sendId,
      originalUrl: url,
    } = decodeClickToken(token);

    // Validate URL — must be absolute HTTP(S)
    if (
      !url ||
      BLOCKED_PROTOCOLS.some((p) => url.toLowerCase().startsWith(p))
    ) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
      if (!["http:", "https:"].includes(targetUrl.protocol)) {
        return NextResponse.json(
          { error: "Invalid URL protocol" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json({ error: "Malformed URL" }, { status: 400 });
    }

    // Record click asynchronously — fire-and-forget
    recordClick(campaignId, subscriberId, sendId, url, {
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for"),
    }).catch((e) => {
      console.error("[Marketing] Click tracking error:", e);
    });

    // 302 Found redirect to original URL
    return NextResponse.redirect(targetUrl.toString(), 302);
  } catch {
    // Invalid token — redirect to site root
    return NextResponse.redirect("/", 302);
  }
}

async function recordClick(
  campaignId: string,
  subscriberId: string,
  sendId: string,
  url: string,
  metadata: { userAgent: string | null; ip: string | null },
) {
  const supabase = createAdminClient() as any;

  // Check if first click for this send
  const { data: send } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("id, first_clicked_at, click_count, campaign_id")
    .eq("id", sendId)
    .eq("subscriber_id", subscriberId)
    .single();

  if (!send) return;

  const isFirstClick = !send.first_clicked_at;
  const now = new Date().toISOString();

  // Update send record
  if (isFirstClick) {
    await supabase
      .from(MKT_TABLES.campaignSends)
      .update({
        first_clicked_at: now,
        last_clicked_at: now,
        click_count: 1,
      })
      .eq("id", sendId);

    // Increment unique clicks on campaign
    const { data: campaign } = await supabase
      .from(MKT_TABLES.campaigns)
      .select("total_clicked, site_id")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      await supabase
        .from(MKT_TABLES.campaigns)
        .update({ total_clicked: (campaign.total_clicked || 0) + 1 })
        .eq("id", campaignId);

      // Fire automation event
      try {
        await logAutomationEvent(
          campaign.site_id,
          "marketing.email.clicked",
          {
            campaign_id: campaignId,
            subscriber_id: subscriberId,
            url,
          },
          {
            sourceModule: "marketing",
            sourceEntityType: "campaign_send",
            sourceEntityId: sendId,
          },
        );
      } catch (e) {
        console.error("[Marketing] Click tracking automation event error:", e);
      }
    }

    // Update subscriber engagement
    await supabase
      .from(MKT_TABLES.subscribers)
      .update({ last_email_clicked_at: now })
      .eq("id", subscriberId);
  } else {
    // Subsequent click
    await supabase
      .from(MKT_TABLES.campaignSends)
      .update({
        last_clicked_at: now,
        click_count: (send.click_count || 0) + 1,
      })
      .eq("id", sendId);
  }

  // Track link click in campaign_links table
  const { data: existingLink } = await supabase
    .from(MKT_TABLES.campaignLinks)
    .select("id, total_clicks, unique_clicks")
    .eq("campaign_id", campaignId)
    .eq("original_url", url)
    .single();

  if (existingLink) {
    await supabase
      .from(MKT_TABLES.campaignLinks)
      .update({
        total_clicks: (existingLink.total_clicks || 0) + 1,
        unique_clicks: isFirstClick
          ? (existingLink.unique_clicks || 0) + 1
          : existingLink.unique_clicks,
      })
      .eq("id", existingLink.id);
  } else {
    await supabase.from(MKT_TABLES.campaignLinks).insert({
      campaign_id: campaignId,
      original_url: url,
      total_clicks: 1,
      unique_clicks: 1,
    });
  }
}

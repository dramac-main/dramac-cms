/**
 * Open Tracking Pixel Route
 *
 * Phase MKT-03: Email Analytics & Tracking
 *
 * Returns a 1x1 transparent GIF and records the email open event.
 * Public route — no auth required. Token is signed.
 *
 * Route: /api/marketing/track/open/[token]
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeTrackingToken } from "@/modules/marketing/services/tracking-utils";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";
import { logAutomationEvent } from "@/modules/automation/services/event-processor";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const PIXEL_HEADERS = {
  "Content-Type": "image/gif",
  "Content-Length": String(PIXEL.length),
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  // Always return the pixel first — never block the response
  const pixelResponse = new Response(PIXEL, { headers: PIXEL_HEADERS });

  try {
    const { token } = await params;
    const { campaignId, subscriberId, sendId } = decodeTrackingToken(token);

    // Record open asynchronously — use fire-and-forget
    recordOpen(campaignId, subscriberId, sendId, {
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for"),
    }).catch((e) => {
      console.error("[Marketing] Open tracking error:", e);
    });
  } catch {
    // Invalid token — return pixel anyway
  }

  return pixelResponse;
}

async function recordOpen(
  campaignId: string,
  subscriberId: string,
  sendId: string,
  metadata: { userAgent: string | null; ip: string | null },
) {
  const supabase = createAdminClient() as any;

  // Check if first open
  const { data: send } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("id, first_opened_at, open_count, campaign_id")
    .eq("id", sendId)
    .eq("subscriber_id", subscriberId)
    .single();

  if (!send) return;

  const isFirstOpen = !send.first_opened_at;
  const now = new Date().toISOString();

  if (isFirstOpen) {
    await supabase
      .from(MKT_TABLES.campaignSends)
      .update({
        first_opened_at: now,
        last_opened_at: now,
        open_count: 1,
      })
      .eq("id", sendId);

    // Increment unique opens on campaign
    const { data: campaign } = await supabase
      .from(MKT_TABLES.campaigns)
      .select("total_opened, site_id")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      await supabase
        .from(MKT_TABLES.campaigns)
        .update({ total_opened: (campaign.total_opened || 0) + 1 })
        .eq("id", campaignId);

      // Fire automation event
      try {
        await logAutomationEvent(
          campaign.site_id,
          "marketing.email.opened",
          {
            campaign_id: campaignId,
            subscriber_id: subscriberId,
          },
          {
            sourceModule: "marketing",
            sourceEntityType: "campaign_send",
            sourceEntityId: sendId,
          },
        );
      } catch (e) {
        console.error("[Marketing] Open tracking automation event error:", e);
      }
    }

    // Update subscriber engagement
    await supabase
      .from(MKT_TABLES.subscribers)
      .update({ last_email_opened_at: now })
      .eq("id", subscriberId);
  } else {
    // Subsequent open
    await supabase
      .from(MKT_TABLES.campaignSends)
      .update({
        last_opened_at: now,
        open_count: (send.open_count || 0) + 1,
      })
      .eq("id", sendId);
  }
}

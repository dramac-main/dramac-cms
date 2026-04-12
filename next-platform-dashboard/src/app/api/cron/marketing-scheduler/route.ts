/**
 * Marketing Campaign Scheduler Cron Route
 *
 * Phase MKT-02: Campaign Engine
 *
 * Checks for campaigns with status 'scheduled' where scheduled_at <= now(),
 * then triggers sending for each. Designed to be called every 5 minutes
 * by the unified cron handler or Vercel cron.
 *
 * Route: /api/cron/marketing-scheduler
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient() as any;
    const now = new Date().toISOString();

    // Find all campaigns that are scheduled and due
    const { data: dueCampaigns, error } = await supabase
      .from(MKT_TABLES.campaigns)
      .select("id, site_id, name, scheduled_at")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;

    if (!dueCampaigns || dueCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No campaigns due for sending",
        timestamp: now,
      });
    }

    // Lazy-load the send service to keep imports light
    const { sendCampaign } =
      await import("@/modules/marketing/services/email-campaign-service");

    const results: Array<{
      campaignId: string;
      name: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const campaign of dueCampaigns) {
      try {
        // Mark as sending before processing
        await supabase
          .from(MKT_TABLES.campaigns)
          .update({ status: "sending" })
          .eq("id", campaign.id)
          .eq("status", "scheduled"); // Optimistic lock

        const result = await sendCampaign(campaign.site_id, campaign.id);
        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          success: result.success,
          error: result.error,
        });
      } catch (e) {
        console.error(
          `[MarketingScheduler] Failed to send campaign ${campaign.id}:`,
          e,
        );

        // Mark as failed
        await supabase
          .from(MKT_TABLES.campaigns)
          .update({
            status: "failed",
            error_message: e instanceof Error ? e.message : "Unknown error",
          })
          .eq("id", campaign.id);

        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          success: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // ─── Process Drip Sequences ───────────────────────────────────
    let sequenceResult = null;
    try {
      const { processSequences } =
        await import("@/modules/marketing/services/sequence-engine");
      sequenceResult = await processSequences();
    } catch (seqError) {
      console.error(
        "[MarketingScheduler] Sequence processing error:",
        seqError,
      );
      sequenceResult = {
        error: seqError instanceof Error ? seqError.message : "Unknown error",
      };
    }

    return NextResponse.json({
      success: true,
      campaigns: {
        processed: dueCampaigns.length,
        succeeded,
        failed,
        results,
      },
      sequences: sequenceResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[MarketingScheduler] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

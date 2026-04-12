/**
 * Marketing Hub Dashboard
 * Phase MKT-05: Marketing Hub Dashboard
 *
 * Server component that fetches marketing data and renders
 * the hub client component with stats, charts, and quick actions.
 */
import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "../../lib/marketing-constants";
import { MarketingHubClient } from "./marketing-hub-client";

interface MarketingHubDashboardProps {
  siteId: string;
}

async function getMarketingHubData(siteId: string) {
  const supabase = (await createClient()) as any;

  // Fetch counts and recent data in parallel
  const [
    campaignsResult,
    sequencesResult,
    subscribersResult,
    recentCampaignsResult,
    activeSequencesResult,
    sentCampaignsResult,
  ] = await Promise.all([
    supabase
      .from(MKT_TABLES.campaigns)
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId),
    supabase
      .from(MKT_TABLES.sequences)
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId),
    supabase
      .from(MKT_TABLES.subscribers)
      .select("*", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "active"),
    supabase
      .from(MKT_TABLES.campaigns)
      .select("*")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from(MKT_TABLES.sequences)
      .select("*")
      .eq("site_id", siteId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from(MKT_TABLES.campaigns)
      .select(
        "id, name, total_sent, total_delivered, total_opened, total_clicked, total_bounced, completed_at",
      )
      .eq("site_id", siteId)
      .eq("status", "sent")
      .order("completed_at", { ascending: false })
      .limit(10),
  ]);

  // Calculate aggregate stats from sent campaigns
  const sentCampaigns = sentCampaignsResult.data || [];
  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalClicked = 0;
  let totalBounced = 0;

  for (const c of sentCampaigns) {
    totalSent += c.total_sent || 0;
    totalDelivered += c.total_delivered || 0;
    totalOpened += c.total_opened || 0;
    totalClicked += c.total_clicked || 0;
    totalBounced += c.total_bounced || 0;
  }

  const openRate =
    totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

  return {
    stats: {
      totalCampaigns: campaignsResult.count || 0,
      totalSequences: sequencesResult.count || 0,
      activeSubscribers: subscribersResult.count || 0,
      totalEmailsSent: totalSent,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      bounceRate:
        totalSent > 0 ? Math.round((totalBounced / totalSent) * 1000) / 10 : 0,
    },
    recentCampaigns: (recentCampaignsResult.data || []) as any[],
    activeSequences: (activeSequencesResult.data || []) as any[],
  };
}

export async function MarketingHubDashboard({
  siteId,
}: MarketingHubDashboardProps) {
  const data = await getMarketingHubData(siteId);

  return <MarketingHubClient siteId={siteId} data={data} />;
}

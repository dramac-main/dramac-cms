/**
 * Marketing Analytics Actions
 *
 * Phase MKT-03: Email Analytics & Tracking
 *
 * Server actions for fetching aggregate marketing analytics,
 * campaign reports, and engagement data.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { MKT_TABLES } from "@/modules/marketing/lib/marketing-constants";

function getModuleClient() {
  return createClient() as any;
}

// ------------------------------------------------------------------
// Campaign Report (individual campaign)
// ------------------------------------------------------------------

export async function getCampaignReport(siteId: string, campaignId: string) {
  const supabase = getModuleClient();

  const [campaignRes, sendsRes, linksRes] = await Promise.all([
    supabase
      .from(MKT_TABLES.campaigns)
      .select("*")
      .eq("id", campaignId)
      .eq("site_id", siteId)
      .single(),
    supabase
      .from(MKT_TABLES.campaignSends)
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sent_at", { ascending: false }),
    supabase
      .from(MKT_TABLES.campaignLinks)
      .select("*")
      .eq("campaign_id", campaignId)
      .order("total_clicks", { ascending: false }),
  ]);

  if (campaignRes.error) {
    return { success: false, error: campaignRes.error.message };
  }

  const campaign = campaignRes.data;
  const sends = sendsRes.data || [];
  const links = linksRes.data || [];

  const totalSent = sends.length;
  const delivered = sends.filter(
    (s: any) => s.status === "delivered" || s.first_opened_at,
  ).length;
  const opened = sends.filter((s: any) => s.first_opened_at).length;
  const clicked = sends.filter((s: any) => s.first_clicked_at).length;
  const bounced = sends.filter((s: any) => s.status === "bounced").length;
  const complained = sends.filter((s: any) => s.status === "complained").length;
  const unsubscribed = sends.filter(
    (s: any) => s.status === "unsubscribed",
  ).length;
  const failed = sends.filter((s: any) => s.status === "failed").length;

  return {
    success: true,
    data: {
      campaign,
      stats: {
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        complained,
        unsubscribed,
        failed,
        openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
        bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
      },
      links,
      sends,
    },
  };
}

// ------------------------------------------------------------------
// Campaign Opens Over Time (for line chart)
// ------------------------------------------------------------------

export async function getCampaignOpensTimeline(
  siteId: string,
  campaignId: string,
) {
  const supabase = getModuleClient();

  const { data: sends } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("first_opened_at, first_clicked_at")
    .eq("campaign_id", campaignId);

  if (!sends || sends.length === 0) {
    return { success: true, data: [] };
  }

  // Group opens and clicks by day
  const timeline: Record<
    string,
    { date: string; opens: number; clicks: number }
  > = {};

  for (const send of sends) {
    if (send.first_opened_at) {
      const day = send.first_opened_at.split("T")[0];
      if (!timeline[day]) timeline[day] = { date: day, opens: 0, clicks: 0 };
      timeline[day].opens++;
    }
    if (send.first_clicked_at) {
      const day = send.first_clicked_at.split("T")[0];
      if (!timeline[day]) timeline[day] = { date: day, opens: 0, clicks: 0 };
      timeline[day].clicks++;
    }
  }

  const sorted = Object.values(timeline).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return { success: true, data: sorted };
}

// ------------------------------------------------------------------
// A/B Test Results
// ------------------------------------------------------------------

export async function getABTestResults(siteId: string, campaignId: string) {
  const supabase = getModuleClient();

  const { data: sends } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("variant, first_opened_at, first_clicked_at, status")
    .eq("campaign_id", campaignId);

  if (!sends) return { success: true, data: null };

  // Group by variant
  const variants: Record<
    string,
    { sent: number; opened: number; clicked: number }
  > = {};

  for (const send of sends) {
    const v = send.variant || "default";
    if (!variants[v]) variants[v] = { sent: 0, opened: 0, clicked: 0 };
    variants[v].sent++;
    if (send.first_opened_at) variants[v].opened++;
    if (send.first_clicked_at) variants[v].clicked++;
  }

  const variantNames = Object.keys(variants);
  if (variantNames.length <= 1) return { success: true, data: null };

  const results = variantNames.map((name) => {
    const v = variants[name];
    return {
      variant: name,
      sent: v.sent,
      opened: v.opened,
      clicked: v.clicked,
      openRate: v.sent > 0 ? (v.opened / v.sent) * 100 : 0,
      clickRate: v.sent > 0 ? (v.clicked / v.sent) * 100 : 0,
    };
  });

  // Determine winner by open rate
  const winner = results.reduce((best, current) =>
    current.openRate > best.openRate ? current : best,
  );

  return { success: true, data: { results, winner: winner.variant } };
}

// ------------------------------------------------------------------
// Recipient Activity (paginated)
// ------------------------------------------------------------------

export async function getCampaignRecipients(
  siteId: string,
  campaignId: string,
  page = 1,
  pageSize = 50,
) {
  const supabase = getModuleClient();
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("*", { count: "exact" })
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  };
}

// ------------------------------------------------------------------
// Marketing Analytics Overview (aggregate across all campaigns)
// ------------------------------------------------------------------

export async function getMarketingAnalytics(
  siteId: string,
  dateRange?: { from: string; to: string },
) {
  const supabase = getModuleClient();

  const from =
    dateRange?.from || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = dateRange?.to || new Date().toISOString();

  const [
    campaignCountsRes,
    sentCampaignsRes,
    subscriberCountRes,
    newSubsRes,
    unsubCountRes,
  ] = await Promise.all([
    // Campaign counts by status
    supabase
      .from(MKT_TABLES.campaigns)
      .select("id, status")
      .eq("site_id", siteId),

    // Campaigns sent in date range with stats
    supabase
      .from(MKT_TABLES.campaigns)
      .select(
        "id, name, status, total_sent, total_delivered, total_opened, total_clicked, total_bounced, sent_at",
      )
      .eq("site_id", siteId)
      .in("status", ["sent", "sending"])
      .gte("sent_at", from)
      .lte("sent_at", to)
      .order("sent_at", { ascending: false }),

    // Total active subscribers
    supabase
      .from(MKT_TABLES.subscribers)
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "active"),

    // New subscribers in date range
    supabase
      .from(MKT_TABLES.subscribers)
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .gte("created_at", from)
      .lte("created_at", to),

    // Unsubscribes in date range
    supabase
      .from(MKT_TABLES.subscribers)
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("status", "unsubscribed")
      .gte("unsubscribed_at", from)
      .lte("unsubscribed_at", to),
  ]);

  const allCampaigns = campaignCountsRes.data || [];
  const sentCampaigns = sentCampaignsRes.data || [];

  // Aggregate stats from sent campaigns
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

  // Top campaigns by open rate
  const topCampaigns = sentCampaigns
    .filter((c: any) => (c.total_sent || 0) > 0)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      openRate: ((c.total_opened || 0) / (c.total_sent || 1)) * 100,
      clickRate: ((c.total_clicked || 0) / (c.total_sent || 1)) * 100,
      sentAt: c.sent_at,
    }))
    .sort((a: any, b: any) => b.openRate - a.openRate)
    .slice(0, 5);

  // Campaign status counts
  const campaignCounts = {
    total: allCampaigns.length,
    draft: allCampaigns.filter((c: any) => c.status === "draft").length,
    scheduled: allCampaigns.filter((c: any) => c.status === "scheduled").length,
    sent: allCampaigns.filter((c: any) => c.status === "sent").length,
    sending: allCampaigns.filter((c: any) => c.status === "sending").length,
  };

  return {
    success: true,
    data: {
      totalSent,
      totalDelivered,
      averageOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      averageClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      totalSubscribers: subscriberCountRes.count || 0,
      newSubscribers: newSubsRes.count || 0,
      totalUnsubscribes: unsubCountRes.count || 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      campaigns: campaignCounts,
      topCampaigns,
      dateRange: { from, to },
    },
  };
}

// ------------------------------------------------------------------
// Subscriber Growth Over Time
// ------------------------------------------------------------------

export async function getSubscriberGrowth(
  siteId: string,
  dateRange?: { from: string; to: string },
) {
  const supabase = getModuleClient();

  const from =
    dateRange?.from || new Date(Date.now() - 90 * 86400000).toISOString();
  const to = dateRange?.to || new Date().toISOString();

  const { data: subscribers } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("created_at, status")
    .eq("site_id", siteId)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: true });

  if (!subscribers) return { success: true, data: [] };

  // Group by week
  const weeks: Record<
    string,
    { week: string; newSubscribers: number; unsubscribes: number }
  > = {};

  for (const sub of subscribers) {
    const date = new Date(sub.created_at);
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekKey = monday.toISOString().split("T")[0];

    if (!weeks[weekKey])
      weeks[weekKey] = { week: weekKey, newSubscribers: 0, unsubscribes: 0 };
    weeks[weekKey].newSubscribers++;
    if (sub.status === "unsubscribed") weeks[weekKey].unsubscribes++;
  }

  return {
    success: true,
    data: Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)),
  };
}

// ------------------------------------------------------------------
// Contact Engagement Profile (for CRM integration)
// ------------------------------------------------------------------

export async function getContactEngagement(
  siteId: string,
  subscriberEmail: string,
) {
  const supabase = getModuleClient();

  // Find subscriber
  const { data: subscriber } = await supabase
    .from(MKT_TABLES.subscribers)
    .select("*")
    .eq("site_id", siteId)
    .eq("email", subscriberEmail)
    .single();

  if (!subscriber) {
    return { success: false, error: "Subscriber not found" };
  }

  // Get sends for this subscriber
  const { data: sends } = await supabase
    .from(MKT_TABLES.campaignSends)
    .select("*")
    .eq("subscriber_id", subscriber.id)
    .order("sent_at", { ascending: false })
    .limit(50);

  const allSends = sends || [];
  const totalReceived = allSends.length;
  const totalOpened = allSends.filter((s: any) => s.first_opened_at).length;
  const totalClicked = allSends.filter((s: any) => s.first_clicked_at).length;

  return {
    success: true,
    data: {
      subscriber,
      stats: {
        totalReceived,
        totalOpened,
        totalClicked,
        openRate: totalReceived > 0 ? (totalOpened / totalReceived) * 100 : 0,
        clickRate: totalReceived > 0 ? (totalClicked / totalReceived) * 100 : 0,
      },
      recentCampaigns: allSends.slice(0, 20),
    },
  };
}

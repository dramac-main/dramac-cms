"use server";

/**
 * CRM Analytics Server Actions
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Server actions using REAL database queries against mod_crmmod01_* tables.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  CRMTimeRange,
  PipelineOverview,
  PipelineStageMetrics,
  DealVelocityData,
  DealsByStatus,
  DealsBySource,
  ContactMetrics,
  ContactsBySource,
  ContactsByStatus,
  LeadScoreDistribution,
  ContactGrowth,
  ActivityMetrics,
  ActivitiesByType,
  ActivityTimeline,
  TeamActivityMetrics,
  RevenueMetrics,
  RevenueByMonth,
  RevenueByOwner,
  RevenueForecast,
  CRMAnalyticsData,
} from "@/types/crm-analytics";

const TABLE_PREFIX = "mod_crmmod01";

// ============================================================================
// HELPER
// ============================================================================

function getDateRange(timeRange: CRMTimeRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (timeRange) {
    case "7d": start.setDate(end.getDate() - 7); break;
    case "30d": start.setDate(end.getDate() - 30); break;
    case "90d": start.setDate(end.getDate() - 90); break;
    case "12m": start.setMonth(end.getMonth() - 12); break;
    case "1y": start.setFullYear(end.getFullYear() - 1); break;
    case "all": start.setFullYear(2020); break;
    default: start.setDate(end.getDate() - 30);
  }
  return { start, end };
}

// ============================================================================
// PIPELINE
// ============================================================================

export async function getPipelineOverview(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<PipelineOverview> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: pipeline } = await supabase
    .from(`${TABLE_PREFIX}_pipelines`)
    .select("id, name")
    .eq("site_id", siteId)
    .eq("is_default", true)
    .single();

  const pipelineId = pipeline?.id || "default";
  const pipelineName = pipeline?.name || "Sales Pipeline";

  const { data: stages } = await supabase
    .from(`${TABLE_PREFIX}_pipeline_stages`)
    .select("id, name, color, position, probability, stage_type")
    .eq("pipeline_id", pipelineId)
    .order("position");

  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select("id, amount, status, stage_id, created_at")
    .eq("site_id", siteId)
    .eq("pipeline_id", pipelineId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const allDeals = deals || [];
  const totalDeals = allDeals.length;
  const totalValue = allDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const wonDeals = allDeals.filter(d => d.status === "won");
  const wonValue = wonDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const stageMetrics: PipelineStageMetrics[] = (stages || []).map((stage) => {
    const sd = allDeals.filter(d => d.stage_id === stage.id);
    const sv = sd.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return {
      stageId: stage.id,
      stageName: stage.name,
      stagePosition: stage.position,
      dealCount: sd.length,
      dealValue: sv,
      avgTimeInStage: 0,
      conversionRate: stage.probability || 0,
      color: stage.color || "hsl(var(--chart-1))",
    };
  });

  return {
    pipelineId,
    pipelineName,
    totalDeals,
    totalValue,
    avgDealSize: totalDeals > 0 ? Math.floor(totalValue / totalDeals) : 0,
    winRate: totalDeals > 0 ? Math.floor((wonDeals.length / totalDeals) * 100) : 0,
    avgSalesCycle: 0,
    stages: stageMetrics,
  };
}

// ============================================================================
// DEALS
// ============================================================================

export async function getDealVelocity(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<DealVelocityData[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select("id, amount, status, created_at")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at");

  const grouped = new Map<string, { newDeals: number; wonDeals: number; lostDeals: number; dealValue: number; wonValue: number }>();
  for (const deal of deals || []) {
    const key = new Date(deal.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const e = grouped.get(key) || { newDeals: 0, wonDeals: 0, lostDeals: 0, dealValue: 0, wonValue: 0 };
    e.newDeals++;
    e.dealValue += Number(deal.amount) || 0;
    if (deal.status === "won") { e.wonDeals++; e.wonValue += Number(deal.amount) || 0; }
    if (deal.status === "lost") e.lostDeals++;
    grouped.set(key, e);
  }

  return Array.from(grouped.entries()).map(([period, data]) => ({ period, ...data }));
}

export async function getDealsByStatus(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<DealsByStatus[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select("id, amount, status")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const all = deals || [];
  const total = all.length;

  return (["open", "won", "lost"] as const).map((status) => {
    const f = all.filter(d => d.status === status);
    const v = f.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return {
      status,
      count: f.length,
      value: v,
      avgValue: f.length > 0 ? Math.floor(v / f.length) : 0,
      percentage: total > 0 ? Math.floor((f.length / total) * 100) : 0,
    };
  });
}

export async function getDealsBySource(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<DealsBySource[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select(`id, amount, status, contact:${TABLE_PREFIX}_contacts(source)`)
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const grouped = new Map<string, { dealCount: number; dealValue: number; wonCount: number }>();
  for (const deal of deals || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source = (deal.contact as any)?.source || "Unknown";
    const e = grouped.get(source) || { dealCount: 0, dealValue: 0, wonCount: 0 };
    e.dealCount++;
    e.dealValue += Number(deal.amount) || 0;
    if (deal.status === "won") e.wonCount++;
    grouped.set(source, e);
  }

  return Array.from(grouped.entries())
    .map(([source, d]) => ({
      source,
      dealCount: d.dealCount,
      dealValue: Math.floor(d.dealValue),
      winRate: d.dealCount > 0 ? Math.floor((d.wonCount / d.dealCount) * 100) : 0,
      avgDealSize: d.dealCount > 0 ? Math.floor(d.dealValue / d.dealCount) : 0,
    }))
    .sort((a, b) => b.dealValue - a.dealValue);
}

// ============================================================================
// CONTACTS
// ============================================================================

export async function getContactMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactMetrics> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const [
    { count: totalContacts },
    { count: newContacts },
    { count: activeContacts },
    { count: qualifiedLeads },
    { count: convertedLeads },
    { count: contactsWithDeals },
  ] = await Promise.all([
    supabase.from(`${TABLE_PREFIX}_contacts`).select("id", { count: "exact", head: true }).eq("site_id", siteId),
    supabase.from(`${TABLE_PREFIX}_contacts`).select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
    supabase.from(`${TABLE_PREFIX}_contacts`).select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "active"),
    supabase.from(`${TABLE_PREFIX}_contacts`).select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("lead_status", "qualified"),
    supabase.from(`${TABLE_PREFIX}_contacts`).select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("lead_status", "converted"),
    supabase.from(`${TABLE_PREFIX}_deals`).select("contact_id", { count: "exact", head: true }).eq("site_id", siteId).not("contact_id", "is", null),
  ]);

  const { data: scoreData } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("lead_score")
    .eq("site_id", siteId);

  const scores = (scoreData || []).map(c => c.lead_score || 0);
  const avgLeadScore = scores.length > 0 ? Math.floor(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const total = totalContacts || 0;
  const convRate = total > 0 ? Math.floor(((convertedLeads || 0) / total) * 100) : 0;

  return {
    totalContacts: total,
    newContacts: newContacts || 0,
    activeContacts: activeContacts || 0,
    qualifiedLeads: qualifiedLeads || 0,
    conversionRate: convRate,
    avgLeadScore,
    contactsWithDeals: contactsWithDeals || 0,
    contactsTrend: 0,
  };
}

export async function getContactsBySource(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactsBySource[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("source, lead_status")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const all = contacts || [];
  const grouped = new Map<string, { count: number; converted: number }>();
  for (const c of all) {
    const src = c.source || "Unknown";
    const e = grouped.get(src) || { count: 0, converted: 0 };
    e.count++;
    if (c.lead_status === "converted") e.converted++;
    grouped.set(src, e);
  }

  const total = all.length;
  return Array.from(grouped.entries())
    .map(([source, d]) => ({
      source,
      count: d.count,
      percentage: total > 0 ? Math.floor((d.count / total) * 100) : 0,
      conversionRate: d.count > 0 ? Math.floor((d.converted / d.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getContactsByStatus(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactsByStatus[]> {
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("status")
    .eq("site_id", siteId);

  const all = contacts || [];
  const grouped = new Map<string, number>();
  for (const c of all) grouped.set(c.status || "unknown", (grouped.get(c.status || "unknown") || 0) + 1);

  const total = all.length;
  return Array.from(grouped.entries())
    .map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: total > 0 ? Math.floor((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getLeadScoreDistribution(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<LeadScoreDistribution[]> {
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("lead_score")
    .eq("site_id", siteId);

  const ranges = [
    { range: "0-20", minScore: 0, maxScore: 20, count: 0 },
    { range: "21-40", minScore: 21, maxScore: 40, count: 0 },
    { range: "41-60", minScore: 41, maxScore: 60, count: 0 },
    { range: "61-80", minScore: 61, maxScore: 80, count: 0 },
    { range: "81-100", minScore: 81, maxScore: 100, count: 0 },
  ];

  for (const c of contacts || []) {
    const score = c.lead_score || 0;
    const r = ranges.find(r => score >= r.minScore && score <= r.maxScore);
    if (r) r.count++;
  }

  const total = (contacts || []).length;
  return ranges.map(r => ({ ...r, percentage: total > 0 ? Math.floor((r.count / total) * 100) : 0 }));
}

export async function getContactGrowth(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactGrowth[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: contacts } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("created_at, lead_status")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at");

  const { count: previousTotal } = await supabase
    .from(`${TABLE_PREFIX}_contacts`)
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .lt("created_at", start.toISOString());

  const grouped = new Map<string, { new: number; converted: number }>();
  for (const c of contacts || []) {
    const date = new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const e = grouped.get(date) || { new: 0, converted: 0 };
    e.new++;
    if (c.lead_status === "converted") e.converted++;
    grouped.set(date, e);
  }

  let total = previousTotal || 0;
  return Array.from(grouped.entries()).map(([date, d]) => {
    total += d.new;
    return { date, total, new: d.new, converted: d.converted };
  });
}

// ============================================================================
// ACTIVITIES
// ============================================================================

export async function getActivityMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ActivityMetrics> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const [
    { count: totalActivities },
    { count: periodActivities },
  ] = await Promise.all([
    supabase.from(`${TABLE_PREFIX}_activities`).select("id", { count: "exact", head: true }).eq("site_id", siteId),
    supabase.from(`${TABLE_PREFIX}_activities`).select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
  ]);

  const { data: typeData } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .select("activity_type")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const typeCounts = new Map<string, number>();
  for (const a of typeData || []) typeCounts.set(a.activity_type, (typeCounts.get(a.activity_type) || 0) + 1);
  const topType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "email";

  return {
    totalActivities: totalActivities || 0,
    activitiesThisPeriod: periodActivities || 0,
    activitiesTrend: 0,
    avgActivitiesPerDeal: 0,
    topActivityType: topType as "call" | "email" | "meeting" | "note" | "task",
    responseRate: 0,
  };
}

export async function getActivitiesByType(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ActivitiesByType[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: activities } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .select("activity_type")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  const grouped = new Map<string, number>();
  for (const a of activities || []) grouped.set(a.activity_type, (grouped.get(a.activity_type) || 0) + 1);

  const total = (activities || []).length;
  return Array.from(grouped.entries())
    .map(([type, count]) => ({
      type: type as "call" | "email" | "meeting" | "note" | "task",
      count,
      percentage: total > 0 ? Math.floor((count / total) * 100) : 0,
      trend: 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getActivityTimeline(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ActivityTimeline[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: activities } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .select("activity_type, created_at")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at");

  const grouped = new Map<string, { calls: number; emails: number; meetings: number; notes: number; tasks: number }>();
  for (const a of activities || []) {
    const date = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const e = grouped.get(date) || { calls: 0, emails: 0, meetings: 0, notes: 0, tasks: 0 };
    switch (a.activity_type) {
      case "call": e.calls++; break;
      case "email": e.emails++; break;
      case "meeting": e.meetings++; break;
      case "note": e.notes++; break;
      case "task": e.tasks++; break;
    }
    grouped.set(date, e);
  }

  return Array.from(grouped.entries()).map(([date, d]) => ({
    date,
    ...d,
    total: d.calls + d.emails + d.meetings + d.notes + d.tasks,
  }));
}

export async function getTeamActivityMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<TeamActivityMetrics[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: activities } = await supabase
    .from(`${TABLE_PREFIX}_activities`)
    .select("created_by")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .not("created_by", "is", null);

  const activityCounts = new Map<string, number>();
  for (const a of activities || []) {
    if (a.created_by) activityCounts.set(a.created_by, (activityCounts.get(a.created_by) || 0) + 1);
  }

  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select("owner_id, status, amount")
    .eq("site_id", siteId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .not("owner_id", "is", null);

  const dealData = new Map<string, { deals: number; wonDeals: number; revenue: number }>();
  for (const d of deals || []) {
    if (d.owner_id) {
      const e = dealData.get(d.owner_id) || { deals: 0, wonDeals: 0, revenue: 0 };
      e.deals++;
      if (d.status === "won") { e.wonDeals++; e.revenue += Number(d.amount) || 0; }
      dealData.set(d.owner_id, e);
    }
  }

  const userIds = new Set<string>([...activityCounts.keys(), ...dealData.keys()]);
  if (userIds.size === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", Array.from(userIds));

  const profileMap = new Map<string, { name: string; initials: string }>();
  for (const p of profiles || []) {
    const name = p.full_name || p.email || "Unknown";
    const initials = name.split(" ").map((w: string) => w[0] || "").join("").toUpperCase().slice(0, 2);
    profileMap.set(p.id, { name, initials });
  }

  return Array.from(userIds)
    .map((userId) => {
      const p = profileMap.get(userId) || { name: "Unknown", initials: "??" };
      const dd = dealData.get(userId) || { deals: 0, wonDeals: 0, revenue: 0 };
      return {
        userId,
        userName: p.name,
        userAvatar: p.initials,
        totalActivities: activityCounts.get(userId) || 0,
        deals: dd.deals,
        wonDeals: dd.wonDeals,
        revenue: Math.floor(dd.revenue),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

// ============================================================================
// REVENUE
// ============================================================================

export async function getRevenueMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<RevenueMetrics> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const [
    { data: allWon },
    { data: periodWon },
    { data: periodLost },
    { data: openDeals },
  ] = await Promise.all([
    supabase.from(`${TABLE_PREFIX}_deals`).select("amount").eq("site_id", siteId).eq("status", "won"),
    supabase.from(`${TABLE_PREFIX}_deals`).select("amount").eq("site_id", siteId).eq("status", "won").gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
    supabase.from(`${TABLE_PREFIX}_deals`).select("amount").eq("site_id", siteId).eq("status", "lost").gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
    supabase.from(`${TABLE_PREFIX}_deals`).select("amount").eq("site_id", siteId).eq("status", "open"),
  ]);

  const sum = (arr: Array<{ amount: number | null }> | null) => (arr || []).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const totalRevenue = sum(allWon);
  const wonThisPeriod = sum(periodWon);
  const lostThisPeriod = sum(periodLost);
  const pipeline = sum(openDeals);
  const count = (allWon || []).length;

  return {
    totalRevenue: Math.floor(totalRevenue),
    revenueTrend: 0,
    avgDealValue: count > 0 ? Math.floor(totalRevenue / count) : 0,
    avgDealValueTrend: 0,
    projectedRevenue: Math.floor(pipeline * 0.3 + wonThisPeriod),
    pipeline: Math.floor(pipeline),
    wonThisPeriod: Math.floor(wonThisPeriod),
    lostThisPeriod: Math.floor(lostThisPeriod),
  };
}

export async function getRevenueByMonth(
  siteId: string,
  timeRange: CRMTimeRange = "12m"
): Promise<RevenueByMonth[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select("amount, status, created_at")
    .eq("site_id", siteId)
    .in("status", ["won", "lost"])
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at");

  const grouped = new Map<string, { won: number; lost: number }>();
  for (const d of deals || []) {
    const month = new Date(d.created_at).toLocaleDateString("en-US", { month: "short" });
    const e = grouped.get(month) || { won: 0, lost: 0 };
    if (d.status === "won") e.won += Number(d.amount) || 0;
    if (d.status === "lost") e.lost += Number(d.amount) || 0;
    grouped.set(month, e);
  }

  return Array.from(grouped.entries()).map(([month, d]) => ({
    month,
    won: Math.floor(d.won),
    lost: Math.floor(d.lost),
    projected: 0,
    target: 0,
  }));
}

export async function getRevenueByOwner(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<RevenueByOwner[]> {
  const supabase = await createClient();
  const { start, end } = getDateRange(timeRange);

  const { data: deals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select("owner_id, amount, status")
    .eq("site_id", siteId)
    .eq("status", "won")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .not("owner_id", "is", null);

  const grouped = new Map<string, { revenue: number; deals: number }>();
  for (const d of deals || []) {
    if (d.owner_id) {
      const e = grouped.get(d.owner_id) || { revenue: 0, deals: 0 };
      e.revenue += Number(d.amount) || 0;
      e.deals++;
      grouped.set(d.owner_id, e);
    }
  }

  if (grouped.size === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", Array.from(grouped.keys()));

  return Array.from(grouped.entries())
    .map(([ownerId, d]) => {
      const p = (profiles || []).find(x => x.id === ownerId);
      const name = p?.full_name || p?.email || "Unknown";
      const initials = name.split(" ").map((w: string) => w[0] || "").join("").toUpperCase().slice(0, 2);
      return {
        ownerId,
        ownerName: name,
        ownerAvatar: initials,
        revenue: Math.floor(d.revenue),
        deals: d.deals,
        avgDealSize: d.deals > 0 ? Math.floor(d.revenue / d.deals) : 0,
        winRate: 100,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getRevenueForecast(
  siteId: string,
  timeRange: CRMTimeRange = "90d"
): Promise<RevenueForecast[]> {
  const supabase = await createClient();

  const { data: openDeals } = await supabase
    .from(`${TABLE_PREFIX}_deals`)
    .select("amount, probability, expected_close_date")
    .eq("site_id", siteId)
    .eq("status", "open")
    .not("expected_close_date", "is", null);

  const grouped = new Map<string, { committed: number; upside: number; pipeline: number }>();
  for (const d of openDeals || []) {
    if (!d.expected_close_date) continue;
    const month = new Date(d.expected_close_date).toLocaleDateString("en-US", { month: "short" });
    const e = grouped.get(month) || { committed: 0, upside: 0, pipeline: 0 };
    const amt = Number(d.amount) || 0;
    const prob = d.probability || 0;
    if (prob >= 80) e.committed += amt;
    else if (prob >= 50) e.upside += amt;
    else e.pipeline += amt;
    grouped.set(month, e);
  }

  return Array.from(grouped.entries()).slice(0, 3).map(([month, d]) => ({
    month,
    committed: Math.floor(d.committed),
    upside: Math.floor(d.upside),
    pipeline: Math.floor(d.pipeline),
    target: 0,
  }));
}

// ============================================================================
// COMBINED
// ============================================================================

export async function getCRMAnalytics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<CRMAnalyticsData> {
  const [
    pipeline,
    dealVelocity,
    dealsByStatus,
    contactMetrics,
    contactsBySource,
    activityMetrics,
    activitiesByType,
    revenueMetrics,
    revenueByMonth,
  ] = await Promise.all([
    getPipelineOverview(siteId, timeRange),
    getDealVelocity(siteId, timeRange),
    getDealsByStatus(siteId, timeRange),
    getContactMetrics(siteId, timeRange),
    getContactsBySource(siteId, timeRange),
    getActivityMetrics(siteId, timeRange),
    getActivitiesByType(siteId, timeRange),
    getRevenueMetrics(siteId, timeRange),
    getRevenueByMonth(siteId, "12m"),
  ]);

  return {
    timeRange,
    pipeline,
    dealVelocity,
    dealsByStatus,
    contactMetrics,
    contactsBySource,
    activityMetrics,
    activitiesByType,
    revenueMetrics,
    revenueByMonth,
  };
}

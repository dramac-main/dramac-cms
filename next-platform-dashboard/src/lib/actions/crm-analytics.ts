"use server";

/**
 * CRM Analytics Server Actions
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Server actions for fetching CRM analytics data
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDateRange(timeRange: CRMTimeRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (timeRange) {
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
    case "12m":
      start.setMonth(end.getMonth() - 12);
      break;
    case "1y":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "all":
      start.setFullYear(2020);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
}

// Seeded random for consistent mock data
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return () => {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
  };
}

const PIPELINE_STAGES = [
  { name: "Lead", color: "hsl(var(--chart-1))" },
  { name: "Qualified", color: "hsl(var(--chart-2))" },
  { name: "Proposal", color: "hsl(var(--chart-3))" },
  { name: "Negotiation", color: "hsl(var(--chart-4))" },
  { name: "Closed Won", color: "hsl(var(--chart-5))" },
];

const SOURCES = ["Website", "Referral", "LinkedIn", "Cold Call", "Trade Show", "Email Campaign"];
const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "task"] as const;

// ============================================================================
// PIPELINE ANALYTICS
// ============================================================================

export async function getPipelineOverview(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<PipelineOverview> {
  const random = seededRandom(`${siteId}-pipeline-${timeRange}`);

  // Generate mock deal counts using seeded random
  const baseDealCount = Math.floor(random() * 150) + 50;
  const baseValue = Math.floor(random() * 800000) + 200000;

  // Generate pipeline stage metrics
  const stages: PipelineStageMetrics[] = PIPELINE_STAGES.map((stage, index) => {
    const dropoffRate = 0.15 + random() * 0.15;
    const stageDeals = Math.floor(baseDealCount * Math.pow(1 - dropoffRate, index));
    const stageValue = Math.floor(baseValue * Math.pow(1 - dropoffRate * 0.8, index));
    
    return {
      stageId: `stage-${index + 1}`,
      stageName: stage.name,
      stagePosition: index + 1,
      dealCount: stageDeals,
      dealValue: stageValue,
      avgTimeInStage: Math.floor(3 + random() * 10),
      conversionRate: index < PIPELINE_STAGES.length - 1 
        ? Math.floor(60 + random() * 30) 
        : 100,
      color: stage.color,
    };
  });

  const wonDeals = Math.floor(baseDealCount * (0.2 + random() * 0.15));
  const wonValue = Math.floor(baseValue * (0.25 + random() * 0.15));

  return {
    pipelineId: "default",
    pipelineName: "Sales Pipeline",
    totalDeals: baseDealCount,
    totalValue: baseValue,
    avgDealSize: Math.floor(baseValue / baseDealCount),
    winRate: Math.floor((wonDeals / Math.max(baseDealCount, 1)) * 100),
    avgSalesCycle: Math.floor(25 + random() * 20),
    stages,
  };
}

// ============================================================================
// DEAL ANALYTICS
// ============================================================================

export async function getDealVelocity(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<DealVelocityData[]> {
  const random = seededRandom(`${siteId}-velocity-${timeRange}`);
  const { start, end } = getDateRange(timeRange);
  const data: DealVelocityData[] = [];

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const interval = days <= 30 ? 1 : days <= 90 ? 7 : 30;
  
  let currentDate = new Date(start);
  while (currentDate <= end) {
    const month = currentDate.toLocaleDateString("en-US", { month: "short" });
    const day = currentDate.getDate();
    const period = interval === 30 ? month : `${month} ${day}`;
    
    const newDeals = Math.floor(5 + random() * 15);
    const wonDeals = Math.floor(newDeals * (0.2 + random() * 0.2));
    const lostDeals = Math.floor(newDeals * (0.1 + random() * 0.15));
    
    data.push({
      period,
      newDeals,
      wonDeals,
      lostDeals,
      dealValue: newDeals * (8000 + random() * 12000),
      wonValue: wonDeals * (10000 + random() * 15000),
    });

    currentDate.setDate(currentDate.getDate() + interval);
  }

  return data.slice(-12);
}

export async function getDealsByStatus(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<DealsByStatus[]> {
  const random = seededRandom(`${siteId}-status-${timeRange}`);

  const openDeals = Math.floor(30 + random() * 30);
  const wonDeals = Math.floor(15 + random() * 20);
  const lostDeals = Math.floor(10 + random() * 15);
  
  const total = openDeals + wonDeals + lostDeals;

  const openValue = Math.floor(openDeals * (8000 + random() * 7000));
  const wonValue = Math.floor(wonDeals * (12000 + random() * 8000));
  const lostValue = Math.floor(lostDeals * (6000 + random() * 5000));

  return [
    {
      status: "open",
      count: openDeals,
      value: openValue,
      avgValue: Math.floor(openValue / Math.max(openDeals, 1)),
      percentage: Math.floor((openDeals / Math.max(total, 1)) * 100),
    },
    {
      status: "won",
      count: wonDeals,
      value: wonValue,
      avgValue: Math.floor(wonValue / Math.max(wonDeals, 1)),
      percentage: Math.floor((wonDeals / Math.max(total, 1)) * 100),
    },
    {
      status: "lost",
      count: lostDeals,
      value: lostValue,
      avgValue: Math.floor(lostValue / Math.max(lostDeals, 1)),
      percentage: Math.floor((lostDeals / Math.max(total, 1)) * 100),
    },
  ];
}

export async function getDealsBySource(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<DealsBySource[]> {
  const random = seededRandom(`${siteId}-source-${timeRange}`);

  return SOURCES.map(source => {
    const dealCount = Math.floor(5 + random() * 25);
    const dealValue = dealCount * (5000 + random() * 15000);
    const winRate = Math.floor(15 + random() * 40);
    
    return {
      source,
      dealCount,
      dealValue: Math.floor(dealValue),
      winRate,
      avgDealSize: Math.floor(dealValue / dealCount),
    };
  }).sort((a, b) => b.dealValue - a.dealValue);
}

// ============================================================================
// CONTACT ANALYTICS
// ============================================================================

export async function getContactMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactMetrics> {
  const random = seededRandom(`${siteId}-contacts-${timeRange}`);

  const baseContacts = Math.floor(150 + random() * 150);
  const newContacts = Math.floor(baseContacts * (0.1 + random() * 0.1));
  const activeContacts = Math.floor(baseContacts * (0.4 + random() * 0.2));
  const qualifiedLeads = Math.floor(baseContacts * (0.2 + random() * 0.15));

  return {
    totalContacts: baseContacts,
    newContacts,
    activeContacts,
    qualifiedLeads,
    conversionRate: Math.floor(10 + random() * 20),
    avgLeadScore: Math.floor(45 + random() * 30),
    contactsWithDeals: Math.floor(baseContacts * (0.15 + random() * 0.1)),
    contactsTrend: Math.floor(-10 + random() * 30),
  };
}

export async function getContactsBySource(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactsBySource[]> {
  const random = seededRandom(`${siteId}-contact-source-${timeRange}`);
  
  const data = SOURCES.map(source => ({
    source,
    count: Math.floor(20 + random() * 80),
    percentage: 0,
    conversionRate: Math.floor(5 + random() * 25),
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);
  data.forEach(d => {
    d.percentage = Math.floor((d.count / total) * 100);
  });

  return data.sort((a, b) => b.count - a.count);
}

export async function getContactsByStatus(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactsByStatus[]> {
  const random = seededRandom(`${siteId}-contact-status-${timeRange}`);
  
  const statuses = [
    { status: "Active", count: Math.floor(100 + random() * 150) },
    { status: "New Lead", count: Math.floor(50 + random() * 80) },
    { status: "Qualified", count: Math.floor(40 + random() * 60) },
    { status: "Contacted", count: Math.floor(30 + random() * 50) },
    { status: "Inactive", count: Math.floor(20 + random() * 40) },
  ];

  const total = statuses.reduce((sum, s) => sum + s.count, 0);
  
  return statuses.map(s => ({
    ...s,
    percentage: Math.floor((s.count / total) * 100),
  }));
}

export async function getLeadScoreDistribution(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<LeadScoreDistribution[]> {
  const random = seededRandom(`${siteId}-score-${timeRange}`);
  
  const ranges = [
    { range: "0-20", minScore: 0, maxScore: 20, count: Math.floor(20 + random() * 30) },
    { range: "21-40", minScore: 21, maxScore: 40, count: Math.floor(30 + random() * 40) },
    { range: "41-60", minScore: 41, maxScore: 60, count: Math.floor(50 + random() * 60) },
    { range: "61-80", minScore: 61, maxScore: 80, count: Math.floor(40 + random() * 50) },
    { range: "81-100", minScore: 81, maxScore: 100, count: Math.floor(15 + random() * 25) },
  ];

  const total = ranges.reduce((sum, r) => sum + r.count, 0);
  
  return ranges.map(r => ({
    ...r,
    percentage: Math.floor((r.count / total) * 100),
  }));
}

export async function getContactGrowth(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ContactGrowth[]> {
  const random = seededRandom(`${siteId}-growth-${timeRange}`);
  const { start, end } = getDateRange(timeRange);
  const data: ContactGrowth[] = [];

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const interval = days <= 30 ? 1 : days <= 90 ? 7 : 30;
  
  let total = Math.floor(150 + random() * 100);
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    const newContacts = Math.floor(3 + random() * 10);
    const converted = Math.floor(newContacts * (0.1 + random() * 0.2));
    total += newContacts;

    data.push({
      date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total,
      new: newContacts,
      converted,
    });

    currentDate.setDate(currentDate.getDate() + interval);
  }

  return data.slice(-12);
}

// ============================================================================
// ACTIVITY ANALYTICS
// ============================================================================

export async function getActivityMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ActivityMetrics> {
  const random = seededRandom(`${siteId}-activity-${timeRange}`);

  const totalActivities = Math.floor(300 + random() * 400);
  const activitiesThisPeriod = Math.floor(totalActivities * (0.3 + random() * 0.2));

  return {
    totalActivities,
    activitiesThisPeriod,
    activitiesTrend: Math.floor(-15 + random() * 40),
    avgActivitiesPerDeal: Math.floor(5 + random() * 8),
    topActivityType: ACTIVITY_TYPES[Math.floor(random() * 3)],
    responseRate: Math.floor(40 + random() * 35),
  };
}

export async function getActivitiesByType(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ActivitiesByType[]> {
  const random = seededRandom(`${siteId}-activity-type-${timeRange}`);

  const data: ActivitiesByType[] = ACTIVITY_TYPES.map(type => ({
    type,
    count: Math.floor(30 + random() * 100),
    percentage: 0,
    trend: Math.floor(-20 + random() * 50),
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);
  data.forEach(d => {
    d.percentage = Math.floor((d.count / total) * 100);
  });

  return data.sort((a, b) => b.count - a.count);
}

export async function getActivityTimeline(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<ActivityTimeline[]> {
  const random = seededRandom(`${siteId}-timeline-${timeRange}`);
  const { start, end } = getDateRange(timeRange);
  const data: ActivityTimeline[] = [];

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const interval = days <= 30 ? 1 : days <= 90 ? 7 : 30;
  
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    const calls = Math.floor(2 + random() * 8);
    const emails = Math.floor(5 + random() * 15);
    const meetings = Math.floor(1 + random() * 4);
    const notes = Math.floor(3 + random() * 10);
    const tasks = Math.floor(2 + random() * 6);

    data.push({
      date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      calls,
      emails,
      meetings,
      notes,
      tasks,
      total: calls + emails + meetings + notes + tasks,
    });

    currentDate.setDate(currentDate.getDate() + interval);
  }

  return data.slice(-12);
}

export async function getTeamActivityMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<TeamActivityMetrics[]> {
  const random = seededRandom(`${siteId}-team-${timeRange}`);

  const teamMembers = [
    { name: "John Smith", avatar: "JS" },
    { name: "Sarah Johnson", avatar: "SJ" },
    { name: "Mike Williams", avatar: "MW" },
    { name: "Emily Davis", avatar: "ED" },
    { name: "Chris Brown", avatar: "CB" },
  ];

  return teamMembers.map((member, index) => ({
    userId: `user-${index + 1}`,
    userName: member.name,
    userAvatar: member.avatar,
    totalActivities: Math.floor(40 + random() * 80),
    deals: Math.floor(5 + random() * 15),
    wonDeals: Math.floor(2 + random() * 8),
    revenue: Math.floor(20000 + random() * 80000),
  })).sort((a, b) => b.revenue - a.revenue);
}

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

export async function getRevenueMetrics(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<RevenueMetrics> {
  const random = seededRandom(`${siteId}-revenue-${timeRange}`);

  const totalRevenue = Math.floor(150000 + random() * 350000);
  const pipeline = Math.floor(300000 + random() * 500000);
  const wonThisPeriod = Math.floor(totalRevenue * (0.15 + random() * 0.15));
  const lostThisPeriod = Math.floor(wonThisPeriod * (0.3 + random() * 0.3));

  return {
    totalRevenue,
    revenueTrend: Math.floor(-10 + random() * 35),
    avgDealValue: Math.floor(8000 + random() * 12000),
    avgDealValueTrend: Math.floor(-5 + random() * 20),
    projectedRevenue: Math.floor(totalRevenue * (1.1 + random() * 0.3)),
    pipeline,
    wonThisPeriod,
    lostThisPeriod,
  };
}

export async function getRevenueByMonth(
  siteId: string,
  timeRange: CRMTimeRange = "12m"
): Promise<RevenueByMonth[]> {
  const random = seededRandom(`${siteId}-revenue-month-${timeRange}`);
  const data: RevenueByMonth[] = [];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();

  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth - 11 + i + 12) % 12;
    const won = Math.floor(30000 + random() * 60000);
    const lost = Math.floor(won * (0.2 + random() * 0.3));
    const target = Math.floor(50000 + random() * 30000);
    
    data.push({
      month: months[monthIndex],
      won,
      lost,
      projected: i >= 9 ? Math.floor(won * (0.8 + random() * 0.4)) : 0,
      target,
    });
  }

  return data;
}

export async function getRevenueByOwner(
  siteId: string,
  timeRange: CRMTimeRange = "30d"
): Promise<RevenueByOwner[]> {
  const random = seededRandom(`${siteId}-revenue-owner-${timeRange}`);

  const owners = [
    { name: "John Smith", avatar: "JS" },
    { name: "Sarah Johnson", avatar: "SJ" },
    { name: "Mike Williams", avatar: "MW" },
    { name: "Emily Davis", avatar: "ED" },
  ];

  return owners.map((owner, index) => {
    const deals = Math.floor(8 + random() * 20);
    const revenue = Math.floor(30000 + random() * 100000);
    
    return {
      ownerId: `owner-${index + 1}`,
      ownerName: owner.name,
      ownerAvatar: owner.avatar,
      revenue,
      deals,
      avgDealSize: Math.floor(revenue / deals),
      winRate: Math.floor(20 + random() * 40),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export async function getRevenueForecast(
  siteId: string,
  timeRange: CRMTimeRange = "90d"
): Promise<RevenueForecast[]> {
  const random = seededRandom(`${siteId}-forecast-${timeRange}`);
  const data: RevenueForecast[] = [];

  const months = ["Jan", "Feb", "Mar"];
  const currentMonth = new Date().getMonth();

  for (let i = 0; i < 3; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    data.push({
      month: monthNames[monthIndex],
      committed: Math.floor(30000 + random() * 40000),
      upside: Math.floor(15000 + random() * 25000),
      pipeline: Math.floor(40000 + random() * 60000),
      target: Math.floor(60000 + random() * 30000),
    });
  }

  return data;
}

// ============================================================================
// COMBINED DATA
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

// Admin analytics — Real DB queries where possible, empty states elsewhere

/**
 * Admin Analytics Server Actions
 * 
 * PHASE-DS-04A: Admin Dashboard - Platform Overview
 * PHASE-DS-04B: Admin Dashboard - Agency Metrics
 * PHASE-DS-05: Billing & Revenue Dashboards
 * 
 * Server actions for fetching platform-wide analytics, agency metrics, and billing data.
 * Uses createAdminClient() for service-role access. All queries wrapped in try/catch.
 */

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import type {
  AdminTimeRange,
  PlatformOverviewMetrics,
  SystemHealthMetrics,
  PlatformTrendData,
  PlatformActivityItem,
  AgencyMetrics,
  AgencyLeaderboard,
  AgencyGrowthData,
  AgencySegmentation,
  RevenueMetrics,
  SubscriptionMetrics,
  RevenueByPlan,
  RevenueByModule,
  RevenueTrendData,
  PaymentMetrics,
  CustomerMetrics,
  BillingActivityItem,
  InvoiceMetrics,
  ModuleStats,
  ServiceStatus,
} from "@/types/admin-analytics";

// ============================================================================
// Utility Functions
// ============================================================================

function getDateRangeFromTimeRange(timeRange: AdminTimeRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (timeRange) {
    case "24h":
      start.setHours(start.getHours() - 24);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "12m":
      start.setMonth(start.getMonth() - 12);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "all":
      start.setFullYear(2020, 0, 1); // Platform start date
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ============================================================================
// Platform Overview Actions (PHASE-DS-04A)
// ============================================================================

export async function getPlatformOverview(
  timeRange: AdminTimeRange = "30d"
): Promise<PlatformOverviewMetrics> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();
    const { start } = getDateRangeFromTimeRange(timeRange);
    const prevStart = new Date(start);
    prevStart.setTime(prevStart.getTime() - (Date.now() - start.getTime()));

    // Fetch all counts in parallel
    const [
      usersTotal,
      usersNew,
      usersPrevPeriod,
      agenciesTotal,
      agenciesNew,
      agenciesPrevPeriod,
      sitesTotal,
      sitesPublished,
      sitesNew,
      pagesTotal,
      moduleInstalls,
      superAdmins,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString()),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", start.toISOString()),
      supabase.from("agencies").select("*", { count: "exact", head: true }),
      supabase.from("agencies").select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString()),
      supabase.from("agencies").select("*", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", start.toISOString()),
      supabase.from("sites").select("*", { count: "exact", head: true }),
      supabase.from("sites").select("*", { count: "exact", head: true })
        .eq("published", true),
      supabase.from("sites").select("*", { count: "exact", head: true })
        .gte("created_at", start.toISOString()),
      supabase.from("pages").select("*", { count: "exact", head: true }),
      supabase.from("site_module_installations").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("role", "super_admin"),
    ]);

    // Get module installation stats
    const { data: moduleData } = await supabase
      .from("site_module_installations")
      .select("module_id");

    const moduleCountMap = new Map<string, number>();
    moduleData?.forEach((m) => {
      if (m.module_id) {
        moduleCountMap.set(m.module_id, (moduleCountMap.get(m.module_id) || 0) + 1);
      }
    });

    // Get module names
    const { data: modulesInfo } = await supabase
      .from("modules_v2")
      .select("id, name, slug");

    const moduleNameMap = new Map<string, { name: string; slug: string }>();
    modulesInfo?.forEach((m) => {
      moduleNameMap.set(m.id, { name: m.name, slug: m.slug });
    });

    const topModules: ModuleStats[] = Array.from(moduleCountMap.entries())
      .map(([id, installations]) => ({
        id,
        name: moduleNameMap.get(id)?.name || id,
        slug: moduleNameMap.get(id)?.slug || id,
        installations,
        activeUsage: installations, // No way to distinguish active vs total without tracking
      }))
      .sort((a, b) => b.installations - a.installations)
      .slice(0, 10);

    // Calculate growth percentages
    const totalUsers = usersTotal.count || 0;
    const newUsers = usersNew.count || 0;
    const prevUsers = usersPrevPeriod.count || 0;
    const userGrowth = prevUsers > 0 
      ? Math.round(((newUsers - prevUsers) / prevUsers) * 100 * 10) / 10
      : newUsers > 0 ? 100 : 0;

    const totalAgencies = agenciesTotal.count || 0;
    const newAgencies = agenciesNew.count || 0;
    const prevAgencies = agenciesPrevPeriod.count || 0;
    const agencyGrowth = prevAgencies > 0
      ? Math.round(((newAgencies - prevAgencies) / prevAgencies) * 100 * 10) / 10
      : newAgencies > 0 ? 100 : 0;

    const totalSites = sitesTotal.count || 0;
    const publishedSites = sitesPublished.count || 0;
    const totalPages = pagesTotal.count || 0;

    // Query actual plan distribution from agencies table
    const { data: planData } = await supabase
      .from("agencies")
      .select("plan");

    const planCounts = { free: 0, starter: 0, professional: 0, enterprise: 0 };
    planData?.forEach((a) => {
      const plan = a.plan || "starter";
      if (plan in planCounts) {
        planCounts[plan as keyof typeof planCounts]++;
      } else {
        planCounts.starter++; // fallback
      }
    });

    // Query actual role distribution from profiles table
    const { data: roleData } = await supabase
      .from("profiles")
      .select("role");

    let adminCount = 0;
    let memberCount = 0;
    const superAdminCount = superAdmins.count || 0;
    roleData?.forEach((p) => {
      const role = p.role || "member";
      if (role === "admin" || role === "agency_admin") adminCount++;
      else if (role !== "super_admin") memberCount++;
    });

    // Query agencies by subscription_status for active/trial/churned
    const { data: statusData } = await supabase
      .from("agencies")
      .select("subscription_status");

    let activeAgencies = 0;
    let trialAgencies = 0;
    let churnedAgencies = 0;
    statusData?.forEach((a) => {
      const s = a.subscription_status || "active";
      if (s === "active") activeAgencies++;
      else if (s === "trialing" || s === "trial") trialAgencies++;
      else if (s === "canceled" || s === "cancelled" || s === "churned") churnedAgencies++;
      else activeAgencies++; // default
    });

    return {
      users: {
        total: totalUsers,
        active: totalUsers, // No session tracking — report total as active
        newToday: Math.floor(newUsers / 30),
        newThisWeek: Math.floor(newUsers / 4),
        newThisMonth: newUsers,
        growthPercent: userGrowth,
        byRole: {
          superAdmin: superAdminCount,
          admin: adminCount,
          member: memberCount,
        },
      },
      agencies: {
        total: totalAgencies,
        active: activeAgencies || totalAgencies,
        trial: trialAgencies,
        churned: churnedAgencies,
        newThisMonth: newAgencies,
        growthPercent: agencyGrowth,
        byPlan: planCounts,
      },
      sites: {
        total: totalSites,
        published: publishedSites,
        draft: totalSites - publishedSites,
        publishedPercent: totalSites > 0 ? Math.round((publishedSites / totalSites) * 100) : 0,
        totalPages,
        avgPagesPerSite: totalSites > 0 ? Math.round(totalPages / totalSites) : 0,
        newThisMonth: sitesNew.count || 0,
      },
      modules: {
        totalAvailable: modulesInfo?.length || 0,
        totalInstallations: moduleInstalls.count || 0,
        avgPerAgency: totalAgencies > 0 
          ? Math.round((moduleInstalls.count || 0) / totalAgencies * 10) / 10 
          : 0,
        topModules,
      },
    };
  } catch (error) {
    console.error("[admin-analytics] getPlatformOverview error:", error);
    return {
      users: { total: 0, active: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0, growthPercent: 0, byRole: { superAdmin: 0, admin: 0, member: 0 } },
      agencies: { total: 0, active: 0, trial: 0, churned: 0, newThisMonth: 0, growthPercent: 0, byPlan: { free: 0, starter: 0, professional: 0, enterprise: 0 } },
      sites: { total: 0, published: 0, draft: 0, publishedPercent: 0, totalPages: 0, avgPagesPerSite: 0, newThisMonth: 0 },
      modules: { totalAvailable: 0, totalInstallations: 0, avgPerAgency: 0, topModules: [] },
    };
  }
}

export async function getSystemHealth(): Promise<SystemHealthMetrics> {
  await requireSuperAdmin();
  
  // System health metrics require external monitoring (e.g. Uptime Robot, Supabase dashboard).
  // No real data source available — return placeholder state with zeroed metrics.
  const services: ServiceStatus[] = [
    { name: "Database (Supabase)", status: "degraded", latency: 0, lastChecked: new Date().toISOString() },
    { name: "Authentication", status: "degraded", latency: 0, lastChecked: new Date().toISOString() },
    { name: "Storage", status: "degraded", latency: 0, lastChecked: new Date().toISOString() },
    { name: "Edge Functions", status: "degraded", latency: 0, lastChecked: new Date().toISOString() },
    { name: "Email (Resend)", status: "degraded", latency: 0, lastChecked: new Date().toISOString() },
    { name: "Billing (Paddle)", status: "degraded", latency: 0, lastChecked: new Date().toISOString() },
  ];

  return {
    status: "degraded",
    uptime: 0,
    responseTime: {
      avg: 0,
      p95: 0,
      p99: 0,
    },
    errorRate: 0,
    activeSessions: 0,
    requestsPerMinute: 0,
    databaseStatus: "slow",
    storageUsed: 0,
    storageLimit: 0,
    apiCalls: {
      today: 0,
      thisMonth: 0,
      limit: 0,
    },
    services,
  };
}

export async function getPlatformTrends(
  timeRange: AdminTimeRange = "30d"
): Promise<PlatformTrendData[]> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();
    const { start, end } = getDateRangeFromTimeRange(timeRange);

    // Determine granularity based on time range
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const granularity = daysDiff <= 7 ? "day" : daysDiff <= 90 ? "day" : "month";

    // Get actual counts from database
    const { data: profiles } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true });

    const { data: agencies } = await supabase
      .from("agencies")
      .select("created_at")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true });

    const { data: sites } = await supabase
      .from("sites")
      .select("created_at")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true });

    // Generate trend data points
    const trends: PlatformTrendData[] = [];
    const current = new Date(start);
    let cumulativeUsers = profiles?.length || 0;
    let cumulativeAgencies = agencies?.length || 0;
    let cumulativeSites = sites?.length || 0;

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];

      // Count items for this period
      const usersInPeriod = profiles?.filter(p => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d >= current && d < new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }).length || 0;

      const agenciesInPeriod = agencies?.filter(a => {
        if (!a.created_at) return false;
        const d = new Date(a.created_at);
        return d >= current && d < new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }).length || 0;

      const sitesInPeriod = sites?.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        return d >= current && d < new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }).length || 0;

      // Revenue & pageViews: 0 — no billing/analytics tables to query
      trends.push({
        label: granularity === "month" 
          ? current.toLocaleDateString(DEFAULT_LOCALE, { month: "short", year: "2-digit" })
          : current.toLocaleDateString(DEFAULT_LOCALE, { month: "short", day: "numeric" }),
        date: dateStr,
        users: cumulativeUsers,
        agencies: cumulativeAgencies,
        sites: cumulativeSites,
        revenue: 0, // No billing table — placeholder
        pageViews: 0, // No analytics tracking table — placeholder
      });

      cumulativeUsers += usersInPeriod;
      cumulativeAgencies += agenciesInPeriod;
      cumulativeSites += sitesInPeriod;

      // Move to next period
      if (granularity === "month") {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setDate(current.getDate() + 1);
      }
    }

    return trends;
  } catch (error) {
    console.error("[admin-analytics] getPlatformTrends error:", error);
    return [];
  }
}

export async function getPlatformActivity(
  limit: number = 20
): Promise<PlatformActivityItem[]> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();
    const activities: PlatformActivityItem[] = [];

    // Get recent signups
    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("id, email, name, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent sites
    const { data: recentSites } = await supabase
      .from("sites")
      .select("id, name, created_at, published, agency_id")
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent agencies
    const { data: recentAgencies } = await supabase
      .from("agencies")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recent module installations
    const { data: recentInstalls } = await supabase
      .from("site_module_installations")
      .select("id, module_id, site_id, installed_at")
      .order("installed_at", { ascending: false })
      .limit(5);

    // Add signups
    recentUsers?.filter(u => u.created_at).forEach((user) => {
      activities.push({
        id: `signup-${user.id}`,
        type: "signup",
        title: "New user signed up",
        description: user.name || user.email,
        timestamp: user.created_at!,
        metadata: { userId: user.id, userName: user.name || user.email },
      });
    });

    // Add site publishes
    recentSites?.filter(s => s.published && s.created_at).forEach((site) => {
      activities.push({
        id: `publish-${site.id}`,
        type: "publish",
        title: "Site published",
        description: site.name,
        timestamp: site.created_at!,
        metadata: { siteId: site.id, siteName: site.name, agencyId: site.agency_id },
      });
    });

    // Add new agencies
    recentAgencies?.filter(a => a.created_at).forEach((agency) => {
      activities.push({
        id: `agency-${agency.id}`,
        type: "subscription",
        title: "New agency registered",
        description: agency.name,
        timestamp: agency.created_at!,
        metadata: { agencyId: agency.id, agencyName: agency.name },
      });
    });

    // Add module installations
    recentInstalls?.filter(i => i.installed_at).forEach((install) => {
      activities.push({
        id: `install-${install.id}`,
        type: "module_install",
        title: "Module installed",
        description: install.module_id,
        timestamp: install.installed_at!,
        metadata: { module: install.module_id, siteId: install.site_id },
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("[admin-analytics] getPlatformActivity error:", error);
    return [];
  }
}

// ============================================================================
// Agency Metrics Actions (PHASE-DS-04B)
// ============================================================================

export async function getAgencyMetricsList(
  timeRange: AdminTimeRange = "30d",
  page: number = 1,
  limit: number = 20
): Promise<{ agencies: AgencyMetrics[]; total: number }> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();
    const offset = (page - 1) * limit;

    // Get agencies with counts
    const { data: agencies, count } = await supabase
      .from("agencies")
      .select("*, sites(count), agency_members(count)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Get module installation counts per agency's sites
    const agencyIds = (agencies || []).map(a => a.id);
    const siteModuleCounts = new Map<string, number>();
    if (agencyIds.length > 0) {
      const { data: siteModules } = await supabase
        .from("sites")
        .select("agency_id, site_module_installations(count)")
        .in("agency_id", agencyIds);
      
      siteModules?.forEach((s) => {
        const agencyId = s.agency_id;
        const installCount = (s.site_module_installations as unknown as { count: number }[])?.[0]?.count || 0;
        siteModuleCounts.set(agencyId, (siteModuleCounts.get(agencyId) || 0) + installCount);
      });
    }

    // Get published site counts per agency
    const publishedSiteCounts = new Map<string, number>();
    if (agencyIds.length > 0) {
      const { data: pubSites } = await supabase
        .from("sites")
        .select("agency_id")
        .in("agency_id", agencyIds)
        .eq("published", true);

      pubSites?.forEach((s) => {
        publishedSiteCounts.set(s.agency_id, (publishedSiteCounts.get(s.agency_id) || 0) + 1);
      });
    }

    const agencyMetrics: AgencyMetrics[] = (agencies || []).map((agency) => {
      const sitesCount = (agency.sites as unknown as { count: number }[])?.[0]?.count || 0;
      const membersCount = (agency.agency_members as unknown as { count: number }[])?.[0]?.count || 0;
      const publishedCount = publishedSiteCounts.get(agency.id) || 0;
      const modulesInstalled = siteModuleCounts.get(agency.id) || 0;

      // Normalize status to expected values
      const rawStatus = agency.subscription_status || "active";
      const status: AgencyMetrics["status"] = 
        rawStatus === "active" || rawStatus === "trial" || rawStatus === "churned" || rawStatus === "suspended"
          ? rawStatus 
          : "active";

      return {
        id: agency.id,
        name: agency.name,
        plan: agency.plan || "starter",
        status,
        createdAt: agency.created_at || new Date().toISOString(),
        metrics: {
          sites: sitesCount,
          publishedSites: publishedCount,
          totalPages: 0, // Would need a join through sites→pages; placeholder
          teamMembers: membersCount,
          clients: 0, // No clients table — placeholder
          modulesInstalled,
          storageUsed: 0, // No storage tracking per agency — placeholder
        },
        billing: {
          mrr: 0, // No billing table to query — placeholder
          totalRevenue: 0,
          lastPayment: "",
          nextBilling: "",
          paymentStatus: "current" as const,
        },
        engagement: {
          lastActive: "", // No session tracking — placeholder
          loginCount30d: 0,
          pagesCreated30d: 0,
          postsPublished30d: 0,
        },
        health: {
          score: 0, // No health scoring system — placeholder
          riskLevel: "low" as const,
          factors: [],
        },
      };
    });

    return { agencies: agencyMetrics, total: count || 0 };
  } catch (error) {
    console.error("[admin-analytics] getAgencyMetricsList error:", error);
    return { agencies: [], total: 0 };
  }
}

export async function getAgencyLeaderboard(): Promise<AgencyLeaderboard> {
  await requireSuperAdmin();

  const emptyLeaderboard: AgencyLeaderboard = {
    topByRevenue: [],
    topBySites: [],
    topByEngagement: [],
    atRisk: [],
    newlyOnboarded: [],
  };

  try {
    const supabase = createAdminClient();

    // Get agencies with site counts
    const { data: agencies } = await supabase
      .from("agencies")
      .select("id, name, plan, created_at, sites(count)")
      .limit(100);

    if (!agencies || agencies.length === 0) return emptyLeaderboard;

    const agencyList = agencies.map((a) => {
      const sitesCount = (a.sites as unknown as { count: number }[])?.[0]?.count || 0;
      const createdDate = a.created_at ? new Date(a.created_at).getTime() : Date.now();
      return {
        ...a,
        sites: sitesCount,
        daysOld: Math.floor((Date.now() - createdDate) / (24 * 60 * 60 * 1000)),
      };
    });

    return {
      topByRevenue: [], // No billing data — placeholder
      topBySites: agencyList
        .sort((a, b) => b.sites - a.sites)
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          name: a.name,
          plan: a.plan || "starter",
          value: a.sites,
          valueLabel: `${a.sites} sites`,
          trend: "stable" as const,
        })),
      topByEngagement: [], // No session tracking — placeholder
      atRisk: [], // No health scoring — placeholder
      newlyOnboarded: agencyList
        .filter((a) => a.daysOld <= 30)
        .sort((a, b) => a.daysOld - b.daysOld)
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          name: a.name,
          plan: a.plan || "starter",
          value: a.daysOld,
          valueLabel: a.daysOld === 0 ? "Today" : `${a.daysOld}d ago`,
          trend: "up" as const,
        })),
    };
  } catch (error) {
    console.error("[admin-analytics] getAgencyLeaderboard error:", error);
    return emptyLeaderboard;
  }
}

export async function getAgencyGrowth(
  timeRange: AdminTimeRange = "12m"
): Promise<AgencyGrowthData[]> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();
    const { start } = getDateRangeFromTimeRange(timeRange);

    const { data: agencies } = await supabase
      .from("agencies")
      .select("created_at")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true });

    // Group by month
    const monthlyData = new Map<string, { new: number }>();
    
    agencies?.filter(a => a.created_at).forEach((a) => {
      const month = new Date(a.created_at!).toISOString().slice(0, 7);
      const existing = monthlyData.get(month) || { new: 0 };
      existing.new++;
      monthlyData.set(month, existing);
    });

    const result: AgencyGrowthData[] = [];

    Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([period, data]) => {
        // No churn tracking table — report churn as 0
        result.push({
          period,
          newAgencies: data.new,
          churnedAgencies: 0, // No churn tracking — placeholder
          netGrowth: data.new,
          conversionRate: 0, // No funnel tracking — placeholder
          avgLifetimeValue: 0, // No billing data — placeholder
        });
      });

    return result;
  } catch (error) {
    console.error("[admin-analytics] getAgencyGrowth error:", error);
    return [];
  }
}

export async function getAgencySegmentation(
  _timeRange?: AdminTimeRange
): Promise<AgencySegmentation> {
  await requireSuperAdmin();

  const empty: AgencySegmentation = {
    byPlan: [],
    bySize: [],
    byIndustry: [],
    byRegion: [],
  };

  try {
    const supabase = createAdminClient();

    const { data: agencies } = await supabase
      .from("agencies")
      .select("id, plan, industry, created_at");

    const total = agencies?.length || 0;
    if (total === 0) return empty;

    // By Plan — real data from agencies.plan column
    const planCounts = new Map<string, number>();
    agencies?.forEach((a) => {
      const plan = a.plan || "starter";
      planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
    });

    const planPrices: Record<string, number> = {
      free: 0,
      starter: 2900,
      professional: 9900,
      enterprise: 29900,
    };

    const byPlan = Array.from(planCounts.entries()).map(([plan, count]) => ({
      plan,
      count,
      revenue: count * (planPrices[plan] || 2900),
      avgMrr: planPrices[plan] || 2900,
      percentage: Math.round((count / total) * 100),
    }));

    // By Industry — real data from agencies.industry column
    const industryCounts = new Map<string, number>();
    agencies?.forEach((a) => {
      const industry = a.industry || "Other";
      industryCounts.set(industry, (industryCounts.get(industry) || 0) + 1);
    });

    const byIndustry = Array.from(industryCounts.entries())
      .map(([industry, count]) => ({
        industry,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // By Size — query actual site counts per agency for accurate sizing
    const { data: agencySites } = await supabase
      .from("agencies")
      .select("id, sites(count)");

    let small = 0, medium = 0, large = 0, enterprise = 0;
    agencySites?.forEach((a) => {
      const sitesCount = (a.sites as unknown as { count: number }[])?.[0]?.count || 0;
      if (sitesCount <= 3) small++;
      else if (sitesCount <= 10) medium++;
      else if (sitesCount <= 50) large++;
      else enterprise++;
    });

    const bySize = [
      { segment: "small" as const, size: "Small", count: small, criteria: "1-3 sites", percentage: total > 0 ? Math.round((small / total) * 100) : 0 },
      { segment: "medium" as const, size: "Medium", count: medium, criteria: "4-10 sites", percentage: total > 0 ? Math.round((medium / total) * 100) : 0 },
      { segment: "large" as const, size: "Large", count: large, criteria: "11-50 sites", percentage: total > 0 ? Math.round((large / total) * 100) : 0 },
      { segment: "enterprise" as const, size: "Enterprise", count: enterprise, criteria: "50+ sites", percentage: total > 0 ? Math.round((enterprise / total) * 100) : 0 },
    ];

    // By Region — no region column in agencies table; empty
    const byRegion: { region: string; count: number; percentage: number }[] = [];

    return { byPlan, bySize, byIndustry, byRegion };
  } catch (error) {
    console.error("[admin-analytics] getAgencySegmentation error:", error);
    return empty;
  }
}

// ============================================================================
// Billing & Revenue Actions (PHASE-DS-05)
// ============================================================================

export async function getRevenueMetrics(
  timeRange: AdminTimeRange = "30d"
): Promise<RevenueMetrics> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();

    const { count: totalAgencies } = await supabase
      .from("agencies")
      .select("*", { count: "exact", head: true });

    // Query actual plan distribution for MRR calculation
    const { data: planData } = await supabase
      .from("agencies")
      .select("plan");

    const planPrices: Record<string, number> = {
      free: 0,
      starter: 2900,
      professional: 9900,
      enterprise: 29900,
    };

    let mrr = 0;
    planData?.forEach((a) => {
      const plan = a.plan || "starter";
      mrr += planPrices[plan] || 2900;
    });

    const agencyCount = totalAgencies || 0;
    const avgRevenuePerAccount = agencyCount > 0 ? Math.floor(mrr / agencyCount) : 0;

    // No historical billing data to calculate growth — placeholder
    return {
      mrr,
      arr: mrr * 12,
      mrrGrowth: 0, // No historical data — placeholder
      arrGrowth: 0,
      revenueToday: 0, // No daily billing table — placeholder
      revenueThisMonth: 0,
      revenueLastMonth: 0,
      projectedMonthEnd: mrr,
      totalRevenue: 0, // No cumulative billing — placeholder
      revenueGrowth: 0,
      avgRevenuePerAccount,
      arpaGrowth: 0,
    };
  } catch (error) {
    console.error("[admin-analytics] getRevenueMetrics error:", error);
    return {
      mrr: 0, arr: 0, mrrGrowth: 0, arrGrowth: 0,
      revenueToday: 0, revenueThisMonth: 0, revenueLastMonth: 0,
      projectedMonthEnd: 0, totalRevenue: 0, revenueGrowth: 0,
      avgRevenuePerAccount: 0, arpaGrowth: 0,
    };
  }
}

export async function getSubscriptionMetrics(
  _timeRange?: AdminTimeRange
): Promise<SubscriptionMetrics> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();

    const { count: total } = await supabase
      .from("agencies")
      .select("*", { count: "exact", head: true });

    // Query actual subscription statuses
    const { data: statusData } = await supabase
      .from("agencies")
      .select("subscription_status");

    let active = 0;
    let trial = 0;
    let cancelled = 0;
    let pastDue = 0;

    statusData?.forEach((a) => {
      const s = a.subscription_status || "active";
      if (s === "active") active++;
      else if (s === "trialing" || s === "trial") trial++;
      else if (s === "canceled" || s === "cancelled") cancelled++;
      else if (s === "past_due") pastDue++;
      else active++; // default
    });

    const agencyCount = total || 0;

    // Query new agencies this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: newThisMonth } = await supabase
      .from("agencies")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());

    const newCount = newThisMonth || 0;

    return {
      total: agencyCount,
      active,
      trial,
      cancelled,
      pastDue,
      churnRate: 0, // No churn tracking — placeholder
      churnedThisMonth: 0,
      newThisMonth: newCount,
      netGrowth: newCount,
      conversionRate: 0, // No funnel tracking — placeholder
      trialToPayRate: 0,
      // Additional fields for components
      totalActive: active,
      activeGrowth: 0,
      newThisPeriod: newCount,
      churnedThisPeriod: 0,
      trialActive: trial,
      trialConversionRate: 0,
      avgSubscriptionValue: 0, // No billing data — placeholder
    };
  } catch (error) {
    console.error("[admin-analytics] getSubscriptionMetrics error:", error);
    return {
      total: 0, active: 0, trial: 0, cancelled: 0, pastDue: 0,
      churnRate: 0, churnedThisMonth: 0, newThisMonth: 0, netGrowth: 0,
      conversionRate: 0, trialToPayRate: 0,
      totalActive: 0, activeGrowth: 0, newThisPeriod: 0, churnedThisPeriod: 0,
      trialActive: 0, trialConversionRate: 0, avgSubscriptionValue: 0,
    };
  }
}

export async function getRevenueByPlan(
  _timeRange?: AdminTimeRange
): Promise<RevenueByPlan[]> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();

    // Query actual plan distribution
    const { data: planData } = await supabase
      .from("agencies")
      .select("plan");

    const planPrices: Record<string, number> = {
      free: 0,
      starter: 2900,
      professional: 9900,
      enterprise: 29900,
    };

    const planCounts: Record<string, number> = {};
    planData?.forEach((a) => {
      const plan = a.plan || "starter";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    const plans = [
      { plan: "free", planName: "Free", price: 0 },
      { plan: "starter", planName: "Starter", price: 2900 },
      { plan: "professional", planName: "Professional", price: 9900 },
      { plan: "enterprise", planName: "Enterprise", price: 29900 },
    ];

    const totalRevenue = plans.reduce((sum, p) => sum + (planCounts[p.plan] || 0) * p.price, 0);

    return plans.map((p) => {
      const subscribers = planCounts[p.plan] || 0;
      const revenue = subscribers * p.price;
      return {
        plan: p.plan,
        planName: p.planName,
        subscribers,
        mrr: revenue,
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
        avgRevenuePerUser: p.price,
        churnRate: 0, // No churn tracking — placeholder
        // Additional fields for components
        revenue,
        count: subscribers,
      };
    });
  } catch (error) {
    console.error("[admin-analytics] getRevenueByPlan error:", error);
    return [];
  }
}

export async function getRevenueByModule(): Promise<RevenueByModule[]> {
  await requireSuperAdmin();

  try {
    const supabase = createAdminClient();

    const { data: modules } = await supabase
      .from("modules_v2")
      .select("id, name")
      .limit(10);

    const { data: subscriptions } = await supabase
      .from("agency_module_subscriptions")
      .select("module_id, custom_price_monthly");

    const moduleCountMap = new Map<string, { count: number; totalPrice: number }>();
    subscriptions?.forEach((s) => {
      if (s.module_id) {
        const existing = moduleCountMap.get(s.module_id) || { count: 0, totalPrice: 0 };
        existing.count++;
        existing.totalPrice += s.custom_price_monthly || 0;
        moduleCountMap.set(s.module_id, existing);
      }
    });

    const totalSubs = Array.from(moduleCountMap.values()).reduce((a, b) => a + b.count, 0);

    return (modules || []).map((m) => {
      const data = moduleCountMap.get(m.id) || { count: 0, totalPrice: 0 };
      return {
        moduleId: m.id,
        moduleName: m.name,
        subscribers: data.count,
        mrr: data.totalPrice,
        percentage: totalSubs > 0 ? Math.round((data.count / totalSubs) * 100) : 0,
        growth: 0, // No historical data — placeholder
      };
    }).sort((a, b) => b.mrr - a.mrr);
  } catch (error) {
    console.error("[admin-analytics] getRevenueByModule error:", error);
    return [];
  }
}

export async function getRevenueTrends(
  timeRange: AdminTimeRange = "12m"
): Promise<RevenueTrendData[]> {
  await requireSuperAdmin();

  // No billing/payment history table — return empty array
  // When Paddle integration is live, query paddle_transactions or billing_events here
  return [];
}

export async function getPaymentMetrics(
  _timeRange?: AdminTimeRange
): Promise<PaymentMetrics> {
  await requireSuperAdmin();

  // No payment processing table — return zeroed placeholder
  return {
    totalProcessed: 0,
    successRate: 0,
    failedPayments: 0,
    pendingPayments: 0,
    refunds: 0,
    refundRate: 0,
    avgTransactionValue: 0,
    paymentMethods: [],
    // Additional fields for components
    successfulPayments: 0,
    failureRate: 0,
    refundedAmount: 0,
  };
}

export async function getCustomerMetrics(
  _timeRange?: AdminTimeRange
): Promise<CustomerMetrics> {
  await requireSuperAdmin();

  // No customer lifetime / billing analytics tables — return zeroed placeholder
  return {
    ltv: 0,
    arpu: 0,
    cac: 0,
    ltvCacRatio: 0,
    paybackPeriod: 0,
    avgSubscriptionLength: 0,
    expansionRevenue: 0,
    contractionRevenue: 0,
    // Additional fields for components
    healthy: 0,
    atRisk: 0,
    churning: 0,
    avgCustomerAge: 0,
    npsScore: 0,
  };
}

export async function getBillingActivity(
  limit: number = 20
): Promise<BillingActivityItem[]> {
  await requireSuperAdmin();

  // No billing_events / payment_history table — return empty
  // When Paddle webhooks are integrated, query billing events here
  return [];
}

export async function getInvoiceMetrics(
  _timeRange?: AdminTimeRange
): Promise<InvoiceMetrics> {
  await requireSuperAdmin();

  // No invoices table — return zeroed placeholder
  return {
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    avgDaysToPayment: 0,
    // Additional fields for components
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0,
    avgInvoiceAmount: 0,
  };
}

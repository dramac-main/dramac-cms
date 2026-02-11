"use server";

import { createClient } from "@/lib/supabase/server";

import { DEFAULT_LOCALE } from '@/lib/locale-config'
export interface PlatformStats {
  users: {
    total: number;
    activeThisMonth: number;
    newThisWeek: number;
    growthPercent: number;
  };
  agencies: {
    total: number;
    active: number;
    newThisMonth: number;
    churned: number;
  };
  sites: {
    total: number;
    published: number;
    totalPages: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    growthPercent: number;
    avgRevenuePerAgency: number;
  };
  modules: {
    total: number;
    installations: number;
    topModules: { name: string; installs: number }[];
  };
  system: {
    activeSessions: number;
    requestsToday: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

export interface RecentActivity {
  id: string;
  type: "signup" | "subscription" | "publish" | "module_install" | "payment";
  message: string;
  timestamp: string | null;
  metadata?: Record<string, unknown>;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get all counts in parallel
  const [
    usersResult,
    agenciesResult,
    sitesResult,
    pagesResult,
    publishedSitesResult,
    newUsersThisWeekResult,
    activeAgenciesResult,
    newAgenciesResult,
    moduleInstallsResult,
    lastMonthUsersResult,
    lastMonthAgenciesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("agencies").select("id", { count: "exact", head: true }),
    supabase.from("sites").select("id", { count: "exact", head: true }),
    supabase.from("pages").select("id", { count: "exact", head: true }),
    supabase.from("sites").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek.toISOString()),
    supabase.from("agencies").select("id", { count: "exact", head: true }),
    supabase.from("agencies").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
    supabase.from("site_module_installations").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).lt("created_at", lastMonth.toISOString()),
    supabase.from("agencies").select("id", { count: "exact", head: true }).lt("created_at", lastMonth.toISOString()),
  ]);

  // Get module counts for top modules
  const { data: moduleData } = await supabase
    .from("site_module_installations")
    .select("module_id");

  // Count module installations
  const moduleCountMap = new Map<string, number>();
  moduleData?.forEach((m) => {
    if (m.module_id) {
      moduleCountMap.set(m.module_id, (moduleCountMap.get(m.module_id) || 0) + 1);
    }
  });

  const topModules = Array.from(moduleCountMap.entries())
    .map(([name, installs]) => ({ name, installs }))
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 5);

  // Calculate totals
  const totalUsers = usersResult.count || 0;
  const totalAgencies = agenciesResult.count || 0;
  const lastMonthUsers = lastMonthUsersResult.count || 0;
  const lastMonthAgencies = lastMonthAgenciesResult.count || 0;

  // Calculate growth percentages
  const userGrowth = lastMonthUsers > 0 
    ? Math.round(((totalUsers - lastMonthUsers) / lastMonthUsers) * 100 * 10) / 10 
    : 0;
  const agencyGrowth = lastMonthAgencies > 0 
    ? Math.round(((totalAgencies - lastMonthAgencies) / lastMonthAgencies) * 100 * 10) / 10 
    : 0;

  // Calculate revenue (based on agency count, $97/mo average)
  const basePrice = 97;
  const mrr = totalAgencies * basePrice * 100; // In cents

  // Estimate active users (70% of total within last 30 days)
  const activeUsersEstimate = Math.floor(totalUsers * 0.7);

  return {
    users: {
      total: totalUsers,
      activeThisMonth: activeUsersEstimate,
      newThisWeek: newUsersThisWeekResult.count || 0,
      growthPercent: userGrowth,
    },
    agencies: {
      total: totalAgencies,
      active: activeAgenciesResult.count || 0,
      newThisMonth: newAgenciesResult.count || 0,
      churned: 0, // Would track from subscription cancellations
    },
    sites: {
      total: sitesResult.count || 0,
      published: publishedSitesResult.count || 0,
      totalPages: pagesResult.count || 0,
    },
    revenue: {
      mrr,
      arr: mrr * 12,
      growthPercent: agencyGrowth, // Revenue grows with agencies
      avgRevenuePerAgency: totalAgencies > 0 ? Math.floor(mrr / totalAgencies) : 0,
    },
    modules: {
      total: 20, // From module catalog
      installations: moduleInstallsResult.count || 0,
      topModules,
    },
    system: {
      activeSessions: 0, // Would come from session tracking
      requestsToday: 0,
      avgResponseTime: 0, // ms
      errorRate: 0, // percentage
    },
  };
}

export async function getRecentActivity(limit = 20): Promise<RecentActivity[]> {
  const supabase = await createClient();

  // Get recent signups
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, email, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get recent sites
  const { data: recentSites } = await supabase
    .from("sites")
    .select("id, name, created_at, published")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get recent agencies
  const { data: recentAgencies } = await supabase
    .from("agencies")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const activities: RecentActivity[] = [];

  // Add user signups
  recentUsers?.forEach((user) => {
    activities.push({
      id: `signup-${user.id}`,
      type: "signup",
      message: `${user.name || user.email} signed up`,
      timestamp: user.created_at,
    });
  });

  // Add site publishes
  recentSites?.filter((s) => s.published).forEach((site) => {
    activities.push({
      id: `publish-${site.id}`,
      type: "publish",
      message: `Site "${site.name}" was published`,
      timestamp: site.created_at,
    });
  });

  // Add new agencies
  recentAgencies?.forEach((agency) => {
    activities.push({
      id: `agency-${agency.id}`,
      type: "subscription",
      message: `Agency "${agency.name}" was created`,
      timestamp: agency.created_at,
    });
  });

  // Sort by timestamp and limit
  return activities
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .slice(0, limit);
}

export async function getAgencyGrowthData(months = 6): Promise<{ month: string; agencies: number; revenue: number }[]> {
  const supabase = await createClient();
  const data: { month: string; agencies: number; revenue: number }[] = [];

  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const { count } = await supabase
      .from("agencies")
      .select("id", { count: "exact", head: true })
      .lte("created_at", endDate.toISOString());

    const monthName = date.toLocaleDateString(DEFAULT_LOCALE, { month: "short" });
    const agencyCount = count || 0;
    
    data.push({
      month: monthName,
      agencies: agencyCount,
      revenue: agencyCount * 97 * 100, // Estimated MRR in cents
    });
  }

  return data;
}

export async function getUserGrowthData(months = 6): Promise<{ month: string; users: number }[]> {
  const supabase = await createClient();
  const data: { month: string; users: number }[] = [];

  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .lte("created_at", endDate.toISOString());

    const monthName = date.toLocaleDateString(DEFAULT_LOCALE, { month: "short" });
    
    data.push({
      month: monthName,
      users: count || 0,
    });
  }

  return data;
}

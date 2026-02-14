"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalClients: number;
  totalSites: number;
  publishedSites: number;
  totalPages: number;
}

// Enhanced metrics for the dashboard
export interface EnhancedMetrics {
  moduleInstallations: number;
  totalAssets: number;
  formSubmissions: number;
  blogPosts: number;
  teamMembers: number;
  activeWorkflows: number;
}

// Module subscription info
export interface ModuleSubscriptionInfo {
  id: string;
  moduleName: string;
  status: string;
  installedAt: string | null;
}

// Recent client info
export interface RecentClient {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  createdAt: string | null;
  siteCount: number;
}

export interface RecentSite {
  id: string;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  status: string;
  updated_at: string | null;
  client?: { name: string } | null;
}

export interface ActivityItem {
  id: string;
  type: "site_created" | "site_published" | "page_created" | "client_created" | "module_installed" | "form_submission";
  title: string;
  description: string;
  timestamp: string;
}

// Time-range filtered metrics
export interface RangeMetrics {
  newClients: number;
  newSites: number;
  newPages: number;
  formSubmissions: number;
}

// Time-series data for charts
export interface TimeSeriesPoint {
  date: string;
  sites: number;
  pages: number;
  clients: number;
}

export interface DashboardData {
  user: { email: string; name?: string } | null;
  stats: DashboardStats;
  enhancedMetrics: EnhancedMetrics;
  rangeMetrics: RangeMetrics;
  timeSeries: TimeSeriesPoint[];
  timeRange: string;
  recentSites: RecentSite[];
  recentClients: RecentClient[];
  recentActivity: ActivityItem[];
  moduleSubscriptions: ModuleSubscriptionInfo[];
  agencyName: string | null;
  subscriptionPlan: string | null;
}

/**
 * Convert a time range string to a date cutoff
 */
function getDateCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Generate date labels for time series based on range
 */
function generateDateLabels(range: string): string[] {
  const now = new Date();
  const labels: string[] = [];
  
  let days: number;
  switch (range) {
    case '24h': days = 1; break;
    case '7d': days = 7; break;
    case '30d': days = 30; break;
    case '90d': days = 90; break;
    default: days = 30;
  }
  
  // For 90d, group by week; for 30d, daily; for 7d, daily; for 24h, hourly
  if (days <= 7) {
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toISOString().split('T')[0]);
    }
  } else if (days <= 30) {
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toISOString().split('T')[0]);
    }
  } else {
    // Weekly buckets for 90d
    for (let i = Math.ceil(days / 7); i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      labels.push(d.toISOString().split('T')[0]);
    }
  }
  
  return labels;
}

export async function getDashboardData(timeRange: string = '30d'): Promise<DashboardData> {
  const supabase = await createClient();

  const emptyResponse: DashboardData = {
    user: null,
    stats: { totalClients: 0, totalSites: 0, publishedSites: 0, totalPages: 0 },
    enhancedMetrics: { 
      moduleInstallations: 0, 
      totalAssets: 0, 
      formSubmissions: 0, 
      blogPosts: 0, 
      teamMembers: 0, 
      activeWorkflows: 0 
    },
    rangeMetrics: { newClients: 0, newSites: 0, newPages: 0, formSubmissions: 0 },
    timeSeries: [],
    timeRange,
    recentSites: [],
    recentClients: [],
    recentActivity: [],
    moduleSubscriptions: [],
    agencyName: null,
    subscriptionPlan: null,
  };

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return emptyResponse;
  }

  // Get profile with agency info
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, full_name")
    .eq("id", user.id)
    .single();

  const agencyId = profile?.agency_id;

  if (!agencyId) {
    return {
      ...emptyResponse,
      user: { email: user.email || "", name: profile?.full_name || undefined },
    };
  }

  // Get agency details
  const { data: agency } = await supabase
    .from("agencies")
    .select("name, plan, subscription_plan")
    .eq("id", agencyId)
    .single();

  // Get all counts in parallel for performance
  const [
    clientsResult, 
    sitesResult, 
    publishedSitesResult, 
    pagesResult,
    moduleInstallsResult,
    assetsResult,
    teamMembersResult,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("published", true),
    supabase
      .from("pages")
      .select("id, site:sites!inner(agency_id)", { count: "exact", head: true })
      .eq("site.agency_id", agencyId),
    supabase
      .from("agency_module_installations")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("is_enabled", true),
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId),
    supabase
      .from("agency_members")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId),
  ]);

  // Get site IDs for querying related data
  const { data: siteIds } = await supabase
    .from("sites")
    .select("id")
    .eq("agency_id", agencyId);
  
  const siteIdList = siteIds?.map(s => s.id) || [];

  // Get form submissions, blog posts, and workflows counts
  let formSubmissions = 0;
  let blogPosts = 0;
  let activeWorkflows = 0;

  if (siteIdList.length > 0) {
    const [formResult, blogResult, workflowResult] = await Promise.all([
      supabase
        .from("form_submissions")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIdList),
      supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIdList),
      supabase
        .from("automation_workflows")
        .select("id", { count: "exact", head: true })
        .in("site_id", siteIdList)
        .eq("is_active", true),
    ]);
    
    formSubmissions = formResult.count || 0;
    blogPosts = blogResult.count || 0;
    activeWorkflows = workflowResult.count || 0;
  }

  // Get recent sites
  const { data: recentSitesData } = await supabase
    .from("sites")
    .select("id, name, subdomain, custom_domain, published, published_at, updated_at, client:clients(name)")
    .eq("agency_id", agencyId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const recentSites: RecentSite[] = (recentSitesData || []).map((site) => ({
    id: site.id,
    name: site.name,
    subdomain: site.subdomain,
    custom_domain: site.custom_domain,
    status: site.published ? "published" : "draft",
    updated_at: site.updated_at,
    client: site.client,
  }));

  // Get recent clients
  const { data: recentClientsData } = await supabase
    .from("clients")
    .select("id, name, company, email, created_at, sites:sites(count)")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentClients: RecentClient[] = (recentClientsData || []).map((client) => ({
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    createdAt: client.created_at,
    siteCount: (client.sites as unknown as { count: number }[])?.[0]?.count || 0,
  }));

  // Get module subscriptions
  const { data: moduleSubsData } = await supabase
    .from("agency_module_installations")
    .select(`
      id,
      installed_at,
      is_enabled,
      module:modules_v2(name, status)
    `)
    .eq("agency_id", agencyId)
    .eq("is_enabled", true)
    .limit(5);

  const moduleSubscriptions: ModuleSubscriptionInfo[] = (moduleSubsData || []).map((sub) => ({
    id: sub.id,
    moduleName: (sub.module as unknown as { name: string; status: string })?.name || "Unknown Module",
    status: sub.is_enabled ? "active" : "inactive",
    installedAt: sub.installed_at,
  }));

  // Build activity from recent data
  const activities: ActivityItem[] = [];

  // Recent sites as activity
  recentSites.slice(0, 3).forEach((site) => {
    activities.push({
      id: `site-${site.id}`,
      type: "site_created",
      title: "Site Updated",
      description: `${site.name} was updated`,
      timestamp: site.updated_at || new Date().toISOString(),
    });
  });

  // Get recently published sites
  const { data: publishedSites } = await supabase
    .from("sites")
    .select("id, name, published_at")
    .eq("agency_id", agencyId)
    .eq("published", true)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(3);

  publishedSites?.forEach((site) => {
    activities.push({
      id: `published-${site.id}`,
      type: "site_published",
      title: "Site Published",
      description: `${site.name} is now live`,
      timestamp: site.published_at!,
    });
  });

  // Get recent clients as activity
  recentClients.slice(0, 2).forEach((client) => {
    if (client.createdAt) {
      activities.push({
        id: `client-${client.id}`,
        type: "client_created",
        title: "New Client Added",
        description: `${client.name} was added`,
        timestamp: client.createdAt,
      });
    }
  });

  // Get recent form submissions as activity
  if (siteIdList.length > 0) {
    const { data: recentForms } = await supabase
      .from("form_submissions")
      .select("id, form_id, created_at, site:sites(name)")
      .in("site_id", siteIdList)
      .order("created_at", { ascending: false })
      .limit(3);

    recentForms?.forEach((form) => {
      activities.push({
        id: `form-${form.id}`,
        type: "form_submission",
        title: "Form Submission",
        description: `New submission on ${(form.site as unknown as { name: string })?.name || "a site"}`,
        timestamp: form.created_at || new Date().toISOString(),
      });
    });
  }

  // Sort activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // =========================================================================
  // Time-range filtered metrics
  // =========================================================================
  const cutoff = getDateCutoff(timeRange).toISOString();
  
  const [rangeClientsResult, rangeSitesResult, rangePagesResult, rangeFormsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .gte("created_at", cutoff),
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .gte("created_at", cutoff),
    supabase
      .from("pages")
      .select("id, site:sites!inner(agency_id)", { count: "exact", head: true })
      .eq("site.agency_id", agencyId)
      .gte("created_at", cutoff),
    siteIdList.length > 0
      ? supabase
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .in("site_id", siteIdList)
          .gte("created_at", cutoff)
      : Promise.resolve({ count: 0 }),
  ]);

  const rangeMetrics: RangeMetrics = {
    newClients: rangeClientsResult.count || 0,
    newSites: rangeSitesResult.count || 0,
    newPages: rangePagesResult.count || 0,
    formSubmissions: rangeFormsResult.count || 0,
  };

  // =========================================================================
  // Time-series data for charts
  // =========================================================================
  const dateLabels = generateDateLabels(timeRange);
  
  // Fetch created_at dates for sites, pages, clients within range
  const [tsSites, tsPages, tsClients] = await Promise.all([
    supabase
      .from("sites")
      .select("created_at")
      .eq("agency_id", agencyId)
      .gte("created_at", cutoff),
    supabase
      .from("pages")
      .select("created_at, site:sites!inner(agency_id)")
      .eq("site.agency_id", agencyId)
      .gte("created_at", cutoff),
    supabase
      .from("clients")
      .select("created_at")
      .eq("agency_id", agencyId)
      .gte("created_at", cutoff),
  ]);

  // Build time-series by bucketing into date labels
  const timeSeries: TimeSeriesPoint[] = dateLabels.map((date, idx) => {
    const nextDate = idx < dateLabels.length - 1 ? dateLabels[idx + 1] : null;
    const dateStart = `${date}T00:00:00`;
    const dateEnd = nextDate ? `${nextDate}T00:00:00` : new Date().toISOString();
    
    const countInRange = (items: { created_at: string | null }[] | null) => {
      if (!items) return 0;
      return items.filter(item => {
        if (!item.created_at) return false;
        return item.created_at >= dateStart && item.created_at < dateEnd;
      }).length;
    };

    return {
      date,
      sites: countInRange(tsSites.data),
      pages: countInRange(tsPages.data),
      clients: countInRange(tsClients.data),
    };
  });

  return {
    user: { email: user.email || "", name: profile?.full_name || undefined },
    stats: {
      totalClients: clientsResult.count || 0,
      totalSites: sitesResult.count || 0,
      publishedSites: publishedSitesResult.count || 0,
      totalPages: pagesResult.count || 0,
    },
    enhancedMetrics: {
      moduleInstallations: moduleInstallsResult.count || 0,
      totalAssets: assetsResult.count || 0,
      formSubmissions,
      blogPosts,
      teamMembers: teamMembersResult.count || 0,
      activeWorkflows,
    },
    rangeMetrics,
    timeSeries,
    timeRange,
    recentSites,
    recentClients,
    recentActivity: activities.slice(0, 10),
    moduleSubscriptions,
    agencyName: agency?.name || null,
    subscriptionPlan: agency?.subscription_plan || agency?.plan || null,
  };
}

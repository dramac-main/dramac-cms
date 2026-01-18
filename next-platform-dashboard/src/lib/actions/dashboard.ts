"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalClients: number;
  totalSites: number;
  publishedSites: number;
  totalPages: number;
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
  type: "site_created" | "site_published" | "page_created" | "client_created";
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardData {
  user: { email: string } | null;
  stats: DashboardStats;
  recentSites: RecentSite[];
  recentActivity: ActivityItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      user: null,
      stats: { totalClients: 0, totalSites: 0, publishedSites: 0, totalPages: 0 },
      recentSites: [],
      recentActivity: [],
    };
  }

  // Get agency ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  const agencyId = profile?.agency_id;

  if (!agencyId) {
    return {
      user: { email: user.email || "" },
      stats: { totalClients: 0, totalSites: 0, publishedSites: 0, totalPages: 0 },
      recentSites: [],
      recentActivity: [],
    };
  }

  // Get counts in parallel
  const [clientsResult, sitesResult, publishedSitesResult, pagesResult] = await Promise.all([
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
  ]);

  // Get recent sites
  const { data: recentSitesData } = await supabase
    .from("sites")
    .select("id, name, subdomain, custom_domain, published, published_at, updated_at, client:clients(name)")
    .eq("agency_id", agencyId)
    .order("updated_at", { ascending: false })
    .limit(5);

  // Transform sites to match interface (convert published boolean to status string)
  const recentSites: RecentSite[] = (recentSitesData || []).map((site) => ({
    id: site.id,
    name: site.name,
    subdomain: site.subdomain,
    custom_domain: site.custom_domain,
    status: site.published ? "published" : "draft",
    updated_at: site.updated_at,
    client: site.client,
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

  // Sort activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    user: { email: user.email || "" },
    stats: {
      totalClients: clientsResult.count || 0,
      totalSites: sitesResult.count || 0,
      publishedSites: publishedSitesResult.count || 0,
      totalPages: pagesResult.count || 0,
    },
    recentSites,
    recentActivity: activities.slice(0, 8),
  };
}

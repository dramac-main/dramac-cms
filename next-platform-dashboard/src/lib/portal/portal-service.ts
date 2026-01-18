"use server";

import { createClient } from "@/lib/supabase/server";

export interface PortalSite {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  isPublished: boolean;
  lastUpdatedAt: string | null;
  pageCount: number;
}

export interface PortalAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: { page: string; views: number }[];
  visitsByDay: { date: string; visits: number }[];
}

export interface PortalSiteDetail extends PortalSite {
  pages: {
    id: string;
    title: string;
    slug: string;
    isHomepage: boolean;
    updatedAt: string | null;
  }[];
  analytics?: PortalAnalytics;
}

/**
 * Get all sites for a client
 */
export async function getClientSites(clientId: string): Promise<PortalSite[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select(`
      id, 
      name, 
      subdomain, 
      custom_domain, 
      published, 
      updated_at
    `)
    .eq("client_id", clientId)
    .order("name");

  if (error || !data) {
    console.error("Error fetching client sites:", error);
    return [];
  }

  // Get page counts separately
  const siteIds = data.map(s => s.id);
  const { data: pageCounts } = await supabase
    .from("pages")
    .select("site_id")
    .in("site_id", siteIds);

  const pageCountMap = new Map<string, number>();
  pageCounts?.forEach(p => {
    pageCountMap.set(p.site_id, (pageCountMap.get(p.site_id) || 0) + 1);
  });

  return data.map((site) => ({
    id: site.id,
    name: site.name,
    subdomain: site.subdomain,
    customDomain: site.custom_domain,
    isPublished: site.published ?? false,
    lastUpdatedAt: site.updated_at,
    pageCount: pageCountMap.get(site.id) || 0,
  }));
}

/**
 * Get a specific site for a client
 */
export async function getClientSite(
  clientId: string,
  siteId: string
): Promise<PortalSiteDetail | null> {
  const supabase = await createClient();

  const { data: site, error } = await supabase
    .from("sites")
    .select(`
      id, 
      name, 
      subdomain, 
      custom_domain, 
      published, 
      updated_at
    `)
    .eq("id", siteId)
    .eq("client_id", clientId)
    .single();

  if (error || !site) {
    return null;
  }

  // Get pages for this site
  const { data: pages } = await supabase
    .from("pages")
    .select("id, name, slug, is_homepage, updated_at")
    .eq("site_id", siteId)
    .order("is_homepage", { ascending: false })
    .order("name");

  return {
    id: site.id,
    name: site.name,
    subdomain: site.subdomain,
    customDomain: site.custom_domain,
    isPublished: site.published ?? false,
    lastUpdatedAt: site.updated_at,
    pageCount: pages?.length || 0,
    pages: (pages || []).map(p => ({
      id: p.id,
      title: p.name,
      slug: p.slug,
      isHomepage: p.is_homepage ?? false,
      updatedAt: p.updated_at,
    })),
  };
}

/**
 * Get analytics for a client's sites
 * In production, this would integrate with an actual analytics provider
 */
export async function getPortalAnalytics(
  clientId: string,
  _siteId?: string
): Promise<PortalAnalytics> {
  // In production, integrate with actual analytics provider (Google Analytics, Plausible, etc.)
  // For now, return deterministic mock data based on clientId hash
  
  // Simple hash function for deterministic values
  const hash = clientId.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const baseVisits = Math.abs(hash % 10000) + 500;
  const baseRate = Math.abs((hash >> 8) % 40) + 20;
  
  // Generate last 7 days
  const visitsByDay = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    visitsByDay.push({
      date: date.toISOString().split("T")[0],
      visits: Math.floor(baseVisits / 7 * (0.8 + Math.random() * 0.4)),
    });
  }

  return {
    totalVisits: baseVisits,
    uniqueVisitors: Math.floor(baseVisits * 0.7),
    pageViews: Math.floor(baseVisits * 2.3),
    avgSessionDuration: 180 + Math.abs(hash % 120),
    bounceRate: baseRate,
    topPages: [
      { page: "/", views: Math.floor(baseVisits * 0.4) },
      { page: "/about", views: Math.floor(baseVisits * 0.2) },
      { page: "/services", views: Math.floor(baseVisits * 0.15) },
      { page: "/contact", views: Math.floor(baseVisits * 0.1) },
      { page: "/blog", views: Math.floor(baseVisits * 0.08) },
    ],
    visitsByDay,
  };
}

/**
 * Get client info for the portal header
 */
export async function getClientInfo(clientId: string): Promise<{
  name: string;
  companyName: string | null;
  email: string | null;
  agencyId: string;
  agencyName: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select(`
      name,
      company,
      email,
      agency_id,
      agencies(name)
    `)
    .eq("id", clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    name: data.name,
    companyName: data.company,
    email: data.email,
    agencyId: data.agency_id,
    agencyName: (data.agencies as { name: string } | null)?.name || "Agency",
  };
}

/**
 * Get site permissions for a client
 */
export async function getSitePermissions(
  clientId: string,
  siteId: string
): Promise<{
  canView: boolean;
  canEditContent: boolean;
  canViewAnalytics: boolean;
  canPublish: boolean;
} | null> {
  const supabase = await createClient();

  // First check site-specific permissions
  const { data: sitePerms } = await supabase
    .from("client_site_permissions")
    .select("*")
    .eq("client_id", clientId)
    .eq("site_id", siteId)
    .single();

  if (sitePerms) {
    return {
      canView: sitePerms.can_view ?? true,
      canEditContent: sitePerms.can_edit_content ?? false,
      canViewAnalytics: sitePerms.can_view_analytics ?? true,
      canPublish: sitePerms.can_publish ?? false,
    };
  }

  // Fall back to client-level permissions
  const { data: client } = await supabase
    .from("clients")
    .select("can_view_analytics, can_edit_content")
    .eq("id", clientId)
    .single();

  if (!client) {
    return null;
  }

  return {
    canView: true,
    canEditContent: client.can_edit_content ?? false,
    canViewAnalytics: client.can_view_analytics ?? true,
    canPublish: false,
  };
}

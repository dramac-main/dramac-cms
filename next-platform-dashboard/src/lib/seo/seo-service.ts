"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, isSuperAdmin } from "@/lib/auth/permissions";
import { cookies } from "next/headers";

export interface SiteSeoSettings {
  id: string;
  siteId: string;
  defaultTitleTemplate: string;
  defaultDescription: string | null;
  defaultKeywords: string[];
  ogImageUrl: string | null;
  twitterCardType: "summary" | "summary_large_image";
  twitterHandle: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  organizationName: string | null;
  organizationLogoUrl: string | null;
}

export interface PageSeo {
  pageId: string;
  pageName: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl: string | null;
  score?: number;
}

export interface SeoUserContext {
  userId: string | null;
  role: string | null;
  agencyRole: string | null;
  accessibleSiteIds: string[] | null; // null = all (super admin)
  isPortalUser: boolean;
  portalClientId: string | null;
}

/**
 * Get user context for SEO access control
 */
export async function getUserSeoContext(): Promise<SeoUserContext> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const cookieStore = await cookies();
  
  // Check for portal user
  const portalClientId = cookieStore.get("impersonating_client_id")?.value || null;
  
  if (portalClientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("id, has_portal_access")
      .eq("id", portalClientId)
      .single();
    
    if (!client?.has_portal_access) {
      return { 
        userId: null, 
        role: null, 
        agencyRole: null, 
        accessibleSiteIds: [], 
        isPortalUser: true, 
        portalClientId 
      };
    }
    
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("client_id", portalClientId);
    
    return {
      userId: null,
      role: "client",
      agencyRole: null,
      accessibleSiteIds: sites?.map(s => s.id) || [],
      isPortalUser: true,
      portalClientId
    };
  }
  
  if (!userId) {
    return { 
      userId: null, 
      role: null, 
      agencyRole: null, 
      accessibleSiteIds: [], 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  if (await isSuperAdmin()) {
    return { 
      userId, 
      role: "super_admin", 
      agencyRole: null, 
      accessibleSiteIds: null, 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .single();
  
  if (!membership) {
    return { 
      userId, 
      role: null, 
      agencyRole: null, 
      accessibleSiteIds: [], 
      isPortalUser: false, 
      portalClientId: null 
    };
  }
  
  const { data: sites } = await supabase
    .from("sites")
    .select("id, clients!inner(agency_id)")
    .eq("clients.agency_id", membership.agency_id);
  
  return {
    userId,
    role: null,
    agencyRole: membership.role,
    accessibleSiteIds: sites?.map(s => s.id) || [],
    isPortalUser: false,
    portalClientId: null
  };
}

/**
 * Check if user can access a site's SEO
 */
export async function canAccessSiteSeo(siteId: string): Promise<boolean> {
  const context = await getUserSeoContext();
  if (context.accessibleSiteIds === null) return true; // Super admin
  return context.accessibleSiteIds.includes(siteId);
}

/**
 * Check if user can edit site-level SEO settings
 * Agency members and portal users cannot edit site SEO
 */
export async function canEditSiteSeo(): Promise<boolean> {
  const context = await getUserSeoContext();
  if (context.isPortalUser) return false;
  if (context.agencyRole === "member") return false;
  if (context.role === "super_admin") return true;
  if (context.agencyRole === "owner" || context.agencyRole === "admin") return true;
  return false;
}

/**
 * Check if user can edit page SEO
 * Members CAN edit page SEO, but portal users cannot
 */
export async function canEditPageSeo(): Promise<boolean> {
  const context = await getUserSeoContext();
  if (context.isPortalUser) return false;
  return context.userId !== null; // Any authenticated agency user
}

/**
 * Check if user can view analytics codes
 */
export async function canViewAnalyticsCodes(): Promise<boolean> {
  const context = await getUserSeoContext();
  if (context.isPortalUser) return false;
  if (context.agencyRole === "member") return false;
  return true;
}

/**
 * Map database row to SiteSeoSettings
 */
function mapToSettings(data: Record<string, unknown>, hideSensitive = false): SiteSeoSettings {
  return {
    id: data.id as string,
    siteId: data.site_id as string,
    defaultTitleTemplate: (data.default_title_template as string) || "{page_title} | {site_name}",
    defaultDescription: data.default_description as string | null,
    defaultKeywords: (data.default_keywords as string[]) || [],
    ogImageUrl: data.og_image_url as string | null,
    twitterCardType: (data.twitter_card_type as "summary" | "summary_large_image") || "summary_large_image",
    twitterHandle: data.twitter_handle as string | null,
    // Hide sensitive codes from unauthorized users
    googleSiteVerification: hideSensitive ? null : (data.google_site_verification as string | null),
    bingSiteVerification: hideSensitive ? null : (data.bing_site_verification as string | null),
    googleAnalyticsId: hideSensitive ? null : (data.google_analytics_id as string | null),
    facebookPixelId: hideSensitive ? null : (data.facebook_pixel_id as string | null),
    robotsIndex: (data.robots_index as boolean) ?? true,
    robotsFollow: (data.robots_follow as boolean) ?? true,
    organizationName: data.organization_name as string | null,
    organizationLogoUrl: data.organization_logo_url as string | null,
  };
}

/**
 * Get SEO settings for a site
 */
export async function getSiteSeoSettings(siteId: string): Promise<SiteSeoSettings | null> {
  // Permission check
  if (!(await canAccessSiteSeo(siteId))) {
    console.error("[SEO] Access denied for site:", siteId);
    return null;
  }

  const supabase = await createClient();
  const context = await getUserSeoContext();
  const hideSensitive = context.agencyRole === "member" || context.isPortalUser;

  const { data, error } = await supabase
    .from("site_seo_settings")
    .select("*")
    .eq("site_id", siteId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[SEO] Error fetching settings:", error);
    return null;
  }

  if (!data) {
    // Create default settings (only if allowed)
    if (await canEditSiteSeo()) {
      const { data: newData, error: insertError } = await supabase
        .from("site_seo_settings")
        .insert({ site_id: siteId })
        .select()
        .single();

      if (insertError) {
        console.error("[SEO] Error creating settings:", insertError);
        return null;
      }

      if (newData) {
        return mapToSettings(newData, hideSensitive);
      }
    }
    // Return default settings for read-only access
    return {
      id: "",
      siteId: siteId,
      defaultTitleTemplate: "{page_title} | {site_name}",
      defaultDescription: null,
      defaultKeywords: [],
      ogImageUrl: null,
      twitterCardType: "summary_large_image",
      twitterHandle: null,
      googleSiteVerification: null,
      bingSiteVerification: null,
      googleAnalyticsId: null,
      facebookPixelId: null,
      robotsIndex: true,
      robotsFollow: true,
      organizationName: null,
      organizationLogoUrl: null,
    };
  }

  return mapToSettings(data, hideSensitive);
}

/**
 * Update SEO settings for a site
 */
export async function updateSiteSeoSettings(
  siteId: string,
  updates: Partial<Omit<SiteSeoSettings, "id" | "siteId">>
): Promise<{ success: boolean; error?: string }> {
  // Permission check - only owner/admin can update site SEO
  if (!(await canEditSiteSeo())) {
    return { 
      success: false, 
      error: "Permission denied: Only agency owners/admins can edit site SEO settings" 
    };
  }
  
  if (!(await canAccessSiteSeo(siteId))) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();

  // Check if settings exist
  const { data: existing } = await supabase
    .from("site_seo_settings")
    .select("id")
    .eq("site_id", siteId)
    .single();

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.defaultTitleTemplate !== undefined) dbUpdates.default_title_template = updates.defaultTitleTemplate;
  if (updates.defaultDescription !== undefined) dbUpdates.default_description = updates.defaultDescription;
  if (updates.defaultKeywords !== undefined) dbUpdates.default_keywords = updates.defaultKeywords;
  if (updates.ogImageUrl !== undefined) dbUpdates.og_image_url = updates.ogImageUrl;
  if (updates.twitterCardType !== undefined) dbUpdates.twitter_card_type = updates.twitterCardType;
  if (updates.twitterHandle !== undefined) dbUpdates.twitter_handle = updates.twitterHandle;
  if (updates.googleSiteVerification !== undefined) dbUpdates.google_site_verification = updates.googleSiteVerification;
  if (updates.bingSiteVerification !== undefined) dbUpdates.bing_site_verification = updates.bingSiteVerification;
  if (updates.googleAnalyticsId !== undefined) dbUpdates.google_analytics_id = updates.googleAnalyticsId;
  if (updates.facebookPixelId !== undefined) dbUpdates.facebook_pixel_id = updates.facebookPixelId;
  if (updates.robotsIndex !== undefined) dbUpdates.robots_index = updates.robotsIndex;
  if (updates.robotsFollow !== undefined) dbUpdates.robots_follow = updates.robotsFollow;
  if (updates.organizationName !== undefined) dbUpdates.organization_name = updates.organizationName;
  if (updates.organizationLogoUrl !== undefined) dbUpdates.organization_logo_url = updates.organizationLogoUrl;

  if (!existing) {
    // Insert new settings
    const { error } = await supabase
      .from("site_seo_settings")
      .insert({ site_id: siteId, ...dbUpdates });

    if (error) {
      console.error("[SEO] Error creating settings:", error);
      return { success: false, error: "Failed to create settings" };
    }
  } else {
    // Update existing settings
    const { error } = await supabase
      .from("site_seo_settings")
      .update(dbUpdates)
      .eq("site_id", siteId);

    if (error) {
      console.error("[SEO] Error updating settings:", error);
      return { success: false, error: "Failed to update settings" };
    }
  }

  return { success: true };
}

/**
 * Get SEO data for all pages of a site
 */
export async function getPagesSeo(siteId: string): Promise<PageSeo[]> {
  // Permission check
  if (!(await canAccessSiteSeo(siteId))) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pages")
    .select(`
      id, 
      name, 
      slug, 
      seo_title, 
      seo_description, 
      seo_keywords, 
      og_title, 
      og_description, 
      og_image_url, 
      robots_index, 
      robots_follow, 
      canonical_url
    `)
    .eq("site_id", siteId)
    .eq("status", "published")
    .order("name");

  if (error || !data) {
    console.error("[SEO] Error fetching pages:", error);
    return [];
  }

  return data.map((p) => ({
    pageId: p.id,
    pageName: p.name,
    slug: p.slug,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    seoKeywords: p.seo_keywords || [],
    ogTitle: p.og_title,
    ogDescription: p.og_description,
    ogImageUrl: p.og_image_url,
    robotsIndex: p.robots_index ?? true,
    robotsFollow: p.robots_follow ?? true,
    canonicalUrl: p.canonical_url,
  }));
}

/**
 * Update SEO for a specific page
 */
export async function updatePageSeo(
  pageId: string,
  updates: Partial<{
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
    ogTitle: string;
    ogDescription: string;
    ogImageUrl: string | null;
    robotsIndex: boolean;
    robotsFollow: boolean;
    canonicalUrl: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  // Permission check - members can edit page SEO
  if (!(await canEditPageSeo())) {
    return { success: false, error: "Permission denied" };
  }
  
  const supabase = await createClient();
  
  // Verify user has access to the page's site
  const { data: page } = await supabase
    .from("pages")
    .select("site_id")
    .eq("id", pageId)
    .single();
  
  if (!page || !(await canAccessSiteSeo(page.site_id))) {
    return { success: false, error: "Access denied" };
  }

  const dbUpdates: Record<string, unknown> = {};

  if (updates.seoTitle !== undefined) dbUpdates.seo_title = updates.seoTitle;
  if (updates.seoDescription !== undefined) dbUpdates.seo_description = updates.seoDescription;
  if (updates.seoKeywords !== undefined) dbUpdates.seo_keywords = updates.seoKeywords;
  if (updates.ogTitle !== undefined) dbUpdates.og_title = updates.ogTitle;
  if (updates.ogDescription !== undefined) dbUpdates.og_description = updates.ogDescription;
  if (updates.ogImageUrl !== undefined) dbUpdates.og_image_url = updates.ogImageUrl;
  if (updates.robotsIndex !== undefined) dbUpdates.robots_index = updates.robotsIndex;
  if (updates.robotsFollow !== undefined) dbUpdates.robots_follow = updates.robotsFollow;
  if (updates.canonicalUrl !== undefined) dbUpdates.canonical_url = updates.canonicalUrl;

  const { error } = await supabase
    .from("pages")
    .update(dbUpdates)
    .eq("id", pageId);

  if (error) {
    console.error("[SEO] Error updating page SEO:", error);
    return { success: false, error: "Failed to update page SEO" };
  }

  return { success: true };
}

/**
 * Get a single page's SEO data
 */
export async function getPageSeo(pageId: string): Promise<PageSeo | null> {
  const supabase = await createClient();
  
  const { data: page, error } = await supabase
    .from("pages")
    .select(`
      id, 
      name, 
      slug, 
      site_id,
      seo_title, 
      seo_description, 
      seo_keywords, 
      og_title, 
      og_description, 
      og_image_url, 
      robots_index, 
      robots_follow, 
      canonical_url
    `)
    .eq("id", pageId)
    .single();

  if (error || !page) {
    return null;
  }

  // Permission check
  if (!(await canAccessSiteSeo(page.site_id))) {
    return null;
  }

  return {
    pageId: page.id,
    pageName: page.name,
    slug: page.slug,
    seoTitle: page.seo_title,
    seoDescription: page.seo_description,
    seoKeywords: page.seo_keywords || [],
    ogTitle: page.og_title,
    ogDescription: page.og_description,
    ogImageUrl: page.og_image_url,
    robotsIndex: page.robots_index ?? true,
    robotsFollow: page.robots_follow ?? true,
    canonicalUrl: page.canonical_url,
  };
}

/**
 * Get accessible sites for portal SEO view
 */
export async function getPortalSeoSites(): Promise<{
  sites: Array<{ id: string; name: string; domain: string | null; subdomain: string }>;
}> {
  const context = await getUserSeoContext();
  
  if (!context.isPortalUser || !context.portalClientId) {
    return { sites: [] };
  }
  
  const supabase = await createClient();
  
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, custom_domain, subdomain")
    .eq("client_id", context.portalClientId)
    .order("name");
  
  return { sites: sites?.map(s => ({ ...s, domain: s.custom_domain })) || [] };
}

/**
 * Get site's robots.txt content
 */
export async function getSiteRobotsTxt(siteId: string): Promise<string | null> {
  if (!(await canAccessSiteSeo(siteId))) {
    return null;
  }

  const supabase = await createClient();
  
  const { data: site } = await supabase
    .from("sites")
    .select("robots_txt, subdomain, custom_domain")
    .eq("id", siteId)
    .single();

  if (!site) return null;

  return site.robots_txt || generateDefaultRobotsTxt(site.subdomain, site.custom_domain);
}

/**
 * Update site's robots.txt content
 */
export async function updateSiteRobotsTxt(
  siteId: string,
  robotsTxt: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await canEditSiteSeo())) {
    return { success: false, error: "Permission denied" };
  }

  if (!(await canAccessSiteSeo(siteId))) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("sites")
    .update({ robots_txt: robotsTxt })
    .eq("id", siteId);

  if (error) {
    return { success: false, error: "Failed to update robots.txt" };
  }

  return { success: true };
}

/**
 * Get site's sitemap settings
 */
export async function getSiteSitemapSettings(siteId: string): Promise<{
  enabled: boolean;
  changefreq: string;
  includeImages: boolean;
} | null> {
  if (!(await canAccessSiteSeo(siteId))) {
    return null;
  }

  const supabase = await createClient();
  
  const { data: site } = await supabase
    .from("sites")
    .select("sitemap_enabled, sitemap_changefreq, sitemap_include_images")
    .eq("id", siteId)
    .single();

  if (!site) return null;

  return {
    enabled: site.sitemap_enabled ?? true,
    changefreq: site.sitemap_changefreq || "weekly",
    includeImages: site.sitemap_include_images ?? true,
  };
}

/**
 * Update site's sitemap settings
 */
export async function updateSiteSitemapSettings(
  siteId: string,
  settings: {
    enabled?: boolean;
    changefreq?: string;
    includeImages?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!(await canEditSiteSeo())) {
    return { success: false, error: "Permission denied" };
  }

  if (!(await canAccessSiteSeo(siteId))) {
    return { success: false, error: "Access denied" };
  }

  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (settings.enabled !== undefined) updates.sitemap_enabled = settings.enabled;
  if (settings.changefreq !== undefined) updates.sitemap_changefreq = settings.changefreq;
  if (settings.includeImages !== undefined) updates.sitemap_include_images = settings.includeImages;

  const { error } = await supabase
    .from("sites")
    .update(updates)
    .eq("id", siteId);

  if (error) {
    return { success: false, error: "Failed to update sitemap settings" };
  }

  return { success: true };
}

/**
 * Generate default robots.txt content
 */
function generateDefaultRobotsTxt(subdomain: string, customDomain?: string | null): string {
  const baseUrl = customDomain 
    ? `https://${customDomain}` 
    : `https://${subdomain}.dramac.app`;

  return `# Robots.txt for ${subdomain}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin paths
Disallow: /api/
Disallow: /_next/
`;
}

/**
 * Save SEO audit result
 */
export async function saveSeoAudit(
  siteId: string,
  pageId: string | null,
  score: number,
  issues: Array<{ type: string; field: string; message: string; suggestion: string }>,
  suggestions: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("seo_audits")
    .insert({
      site_id: siteId,
      page_id: pageId,
      score,
      issues,
      suggestions,
    });

  if (error) {
    return { success: false, error: "Failed to save audit" };
  }

  return { success: true };
}

/**
 * Get latest SEO audits for a site
 */
export async function getSiteAudits(
  siteId: string,
  limit = 10
): Promise<Array<{
  id: string;
  pageId: string | null;
  score: number | null;
  issues: unknown[];
  recommendations: unknown[];
  createdAt: string | null;
}>> {
  if (!(await canAccessSiteSeo(siteId))) {
    return [];
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("seo_audits")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((a) => ({
    id: a.id,
    pageId: a.page_id,
    score: a.score,
    issues: (a.issues as unknown[]) || [],
    recommendations: (a.suggestions as unknown[]) || [],
    createdAt: a.created_at,
  }));
}

/**
 * Get site basic info for SEO pages
 */
export async function getSiteForSeo(siteId: string): Promise<{
  id: string;
  name: string;
  subdomain: string;
  domain: string | null;
} | null> {
  if (!(await canAccessSiteSeo(siteId))) {
    return null;
  }

  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("id, name, subdomain, custom_domain")
    .eq("id", siteId)
    .single();

  if (!site) return null;

  return { ...site, domain: site.custom_domain };
}

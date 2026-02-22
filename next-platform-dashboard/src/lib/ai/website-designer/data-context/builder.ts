/**
 * PHASE AWD-02: Data Context System
 * Data Context Builder
 * 
 * Fetches all business data from the database in parallel
 * to provide AI with complete knowledge of the client/site.
 * 
 * NOTE: This module uses a flexible approach to query tables that may or may not
 * exist in different deployments. Tables are queried via RPC functions or
 * with proper error handling for missing tables.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  BusinessDataContext,
  SiteData,
  BrandingData,
  ClientData,
  ContactData,
  SocialLink,
  BusinessHours,
  Location,
  TeamMember,
  Service,
  PortfolioItem,
  Testimonial,
  BlogPost,
  FAQItem,
  EnabledModule,
  DataContextBuilderOptions,
} from "./types";

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const DEFAULT_OPTIONS: DataContextBuilderOptions = {
  includeModules: true,
  includeBlog: true,
  maxTestimonials: 20,
  maxPortfolioItems: 20,
  maxBlogPosts: 10,
};

// =============================================================================
// MAIN BUILDER FUNCTION
// =============================================================================

/**
 * Build complete data context for a site
 * Fetches all related business data from the database in parallel
 */
export async function buildDataContext(
  siteId: string,
  options: DataContextBuilderOptions = {}
): Promise<BusinessDataContext> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const supabase = await createClient();

  // First, fetch the site to get client_id
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*, agencies(*)")
    .eq("id", siteId)
    .single();

  if (siteError) {
    console.error("[DataContextBuilder] Error fetching site:", siteError);
  }

  // Fetch client data if site has client_id
  let clientData: ClientData = {};
  if (site?.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", site.client_id)
      .maybeSingle();
    if (client) {
      clientData = normalizeToClientData(client);
    }
  }

  // Create empty context to populate
  const context: BusinessDataContext = {
    site: normalizeSiteData(site) || createEmptySite(),
    branding: {},
    client: clientData,
    contact: { address: {} },
    social: [],
    hours: [],
    locations: [],
    testimonials: [],
    team: [],
    services: [],
    portfolio: [],
    blog: [],
    faq: [],
    modules: [],
  };

  // Fetch remaining data in parallel - using safe fetchers that handle missing tables
  const results = await Promise.allSettled([
    fetchBranding(supabase, siteId),
    fetchSocialLinks(supabase, siteId),
    fetchBusinessHours(supabase, siteId),
    fetchLocations(supabase, siteId),
    fetchTeamMembers(supabase, siteId),
    fetchServices(supabase, siteId),
    fetchPortfolio(supabase, siteId, opts.maxPortfolioItems),
    fetchTestimonials(supabase, siteId, opts.maxTestimonials),
    fetchFAQ(supabase, siteId),
    opts.includeBlog ? fetchBlogPosts(supabase, siteId, opts.maxBlogPosts) : Promise.resolve([]),
    opts.includeModules ? fetchModules(supabase, siteId) : Promise.resolve([]),
  ]);

  // Process results
  if (results[0].status === "fulfilled" && results[0].value) {
    context.branding = results[0].value;
  }
  if (results[1].status === "fulfilled") {
    context.social = results[1].value || [];
  }
  if (results[2].status === "fulfilled") {
    context.hours = results[2].value || [];
  }
  if (results[3].status === "fulfilled") {
    context.locations = results[3].value || [];
  }
  if (results[4].status === "fulfilled") {
    context.team = results[4].value || [];
  }
  if (results[5].status === "fulfilled") {
    context.services = results[5].value || [];
  }
  if (results[6].status === "fulfilled") {
    context.portfolio = results[6].value || [];
  }
  if (results[7].status === "fulfilled") {
    context.testimonials = results[7].value || [];
  }
  if (results[8].status === "fulfilled") {
    context.faq = results[8].value || [];
  }
  if (results[9].status === "fulfilled") {
    context.blog = results[9].value || [];
  }
  if (results[10].status === "fulfilled") {
    context.modules = results[10].value || [];
  }

  // Build contact from multiple sources
  context.contact = buildContactData(clientData, context.locations);

  return context;
}

// =============================================================================
// DATA NORMALIZERS
// =============================================================================

/**
 * Normalize client data from database (handles null vs undefined)
 */
function normalizeToClientData(client: Record<string, unknown>): ClientData {
  return {
    id: client.id as string | undefined,
    company: (client.company as string) ?? undefined,
    company_name: (client.company_name as string) ?? (client.company as string) ?? undefined,
    name: (client.name as string) ?? undefined,
    email: (client.email as string) ?? undefined,
    phone: (client.phone as string) ?? undefined,
    website: (client.website as string) ?? undefined,
    industry: (client.industry as string) ?? undefined,
    notes: (client.notes as string) ?? undefined,
    address: (client.address as string) ?? undefined,
    city: (client.city as string) ?? undefined,
    state: (client.state as string) ?? undefined,
    zip: (client.zip as string) ?? undefined,
    country: (client.country as string) ?? undefined,
    tagline: (client.tagline as string) ?? undefined,
    mission: (client.mission as string) ?? undefined,
    vision: (client.vision as string) ?? undefined,
    values: (client.values as string[]) ?? undefined,
    description: (client.description as string) ?? undefined,
    founded_year: (client.founded_year as number) ?? undefined,
  };
}

/**
 * Normalize site data
 */
function normalizeSiteData(site: Record<string, unknown> | null): SiteData | null {
  if (!site) return null;
  return {
    id: site.id as string,
    name: (site.name as string) ?? "",
    domain: (site.domain as string) ?? undefined,
    description: (site.description as string) ?? undefined,
    settings: (site.settings as Record<string, unknown>) ?? undefined,
    seo_title: (site.seo_title as string) ?? undefined,
    seo_description: (site.seo_description as string) ?? undefined,
    analytics_id: (site.analytics_id as string) ?? undefined,
    client_id: (site.client_id as string) ?? undefined,
    agency_id: (site.agency_id as string) ?? undefined,
    created_at: (site.created_at as string) ?? undefined,
    updated_at: (site.updated_at as string) ?? undefined,
  };
}

// =============================================================================
// SAFE DATA FETCHERS
// =============================================================================

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Fetch branding data
 */
async function fetchBranding(supabase: SupabaseClient, siteId: string): Promise<BrandingData | null> {
  // The branding might be stored directly on the site or in a separate table
  // Try site_settings first, then fall back to checking site.settings
  try {
    // Try to get from a branding/settings table if it exists
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      return {
        business_name: (settings.business_name as string) ?? undefined,
        primary_color: (settings.primary_color as string) ?? undefined,
        secondary_color: (settings.secondary_color as string) ?? undefined,
        accent_color: (settings.accent_color as string) ?? undefined,
        logo_url: (settings.logo_url as string) ?? undefined,
        heading_font: (settings.heading_font as string) ?? undefined,
        body_font: (settings.body_font as string) ?? undefined,
      };
    }
  } catch {
    // Silently fail - branding is optional
  }
  return null;
}

/**
 * Fetch social links - tries multiple possible table structures
 */
async function fetchSocialLinks(supabase: SupabaseClient, siteId: string): Promise<SocialLink[]> {
  // Social links might be stored in site.settings.social or a separate table
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const social = settings.social_links as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(social)) {
        return social.map((s, i) => ({
          id: String(i),
          site_id: siteId,
          platform: (s.platform as string) ?? "",
          url: (s.url as string) ?? "",
          label: (s.label as string) ?? undefined,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch business hours
 */
async function fetchBusinessHours(supabase: SupabaseClient, siteId: string): Promise<BusinessHours[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const hours = settings.business_hours as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(hours)) {
        return hours.map((h, i) => ({
          id: String(i),
          site_id: siteId,
          day: (h.day as string) ?? "",
          open_time: (h.open_time as string) ?? undefined,
          close_time: (h.close_time as string) ?? undefined,
          is_closed: (h.is_closed as boolean) ?? undefined,
          is_24_hours: (h.is_24_hours as boolean) ?? undefined,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch locations
 */
async function fetchLocations(supabase: SupabaseClient, siteId: string): Promise<Location[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const locations = settings.locations as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(locations)) {
        return locations.map((l, i) => ({
          id: String(i),
          site_id: siteId,
          name: (l.name as string) ?? "Location",
          address: (l.address as string) ?? undefined,
          city: (l.city as string) ?? undefined,
          state: (l.state as string) ?? undefined,
          zip: (l.zip as string) ?? undefined,
          country: (l.country as string) ?? undefined,
          phone: (l.phone as string) ?? undefined,
          email: (l.email as string) ?? undefined,
          lat: (l.lat as number) ?? undefined,
          lng: (l.lng as number) ?? undefined,
          is_primary: (l.is_primary as boolean) ?? i === 0,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch team members
 */
async function fetchTeamMembers(supabase: SupabaseClient, siteId: string): Promise<TeamMember[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const team = settings.team as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(team)) {
        return team.map((t, i) => ({
          id: String(i),
          site_id: siteId,
          name: (t.name as string) ?? "",
          role: (t.role as string) ?? undefined,
          title: (t.title as string) ?? undefined,
          department: (t.department as string) ?? undefined,
          bio: (t.bio as string) ?? undefined,
          image_url: (t.image_url as string) ?? undefined,
          email: (t.email as string) ?? undefined,
          phone: (t.phone as string) ?? undefined,
          qualifications: (t.qualifications as string[]) ?? undefined,
          social_links: (t.social_links as Record<string, string>) ?? undefined,
          display_order: i,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch services
 */
async function fetchServices(supabase: SupabaseClient, siteId: string): Promise<Service[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const services = settings.services as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(services)) {
        return services.map((s, i) => ({
          id: String(i),
          site_id: siteId,
          name: (s.name as string) ?? "",
          description: (s.description as string) ?? undefined,
          price: (s.price as string) ?? undefined,
          price_unit: (s.price_unit as string) ?? undefined,
          duration: (s.duration as string) ?? undefined,
          image_url: (s.image_url as string) ?? undefined,
          features: (s.features as string[]) ?? undefined,
          category: (s.category as string) ?? undefined,
          is_featured: (s.is_featured as boolean) ?? undefined,
          display_order: i,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch portfolio items
 */
async function fetchPortfolio(
  supabase: SupabaseClient,
  siteId: string,
  limit?: number
): Promise<PortfolioItem[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const portfolio = settings.portfolio as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(portfolio)) {
        const items = portfolio.slice(0, limit || 20);
        return items.map((p, i) => ({
          id: String(i),
          site_id: siteId,
          title: (p.title as string) ?? "",
          description: (p.description as string) ?? undefined,
          image_url: (p.image_url as string) ?? undefined,
          gallery: (p.gallery as string[]) ?? undefined,
          client: (p.client as string) ?? undefined,
          client_name: (p.client_name as string) ?? undefined,
          category: (p.category as string) ?? undefined,
          technologies: (p.technologies as string[]) ?? undefined,
          completed_date: (p.completed_date as string) ?? undefined,
          link: (p.link as string) ?? undefined,
          featured: (p.featured as boolean) ?? undefined,
          is_featured: (p.is_featured as boolean) ?? undefined,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch testimonials
 */
async function fetchTestimonials(
  supabase: SupabaseClient,
  siteId: string,
  limit?: number
): Promise<Testimonial[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const testimonials = settings.testimonials as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(testimonials)) {
        const items = testimonials.slice(0, limit || 20);
        return items.map((t, i) => ({
          id: String(i),
          site_id: siteId,
          name: (t.name as string) ?? (t.author_name as string) ?? "",
          author_name: (t.author_name as string) ?? (t.name as string) ?? undefined,
          author_title: (t.author_title as string) ?? (t.role as string) ?? undefined,
          company: (t.company as string) ?? undefined,
          role: (t.role as string) ?? undefined,
          content: (t.content as string) ?? (t.text as string) ?? "",
          rating: (t.rating as number) ?? undefined,
          image_url: (t.image_url as string) ?? undefined,
          featured: (t.featured as boolean) ?? undefined,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch FAQ items
 */
async function fetchFAQ(supabase: SupabaseClient, siteId: string): Promise<FAQItem[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const faq = settings.faq as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(faq)) {
        return faq.map((f, i) => ({
          id: String(i),
          site_id: siteId,
          question: (f.question as string) ?? "",
          answer: (f.answer as string) ?? "",
          category: (f.category as string) ?? undefined,
          display_order: i,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch blog posts
 */
async function fetchBlogPosts(
  supabase: SupabaseClient,
  siteId: string,
  limit?: number
): Promise<BlogPost[]> {
  try {
    const { data } = await supabase
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();
    
    if (data?.settings && typeof data.settings === "object") {
      const settings = data.settings as Record<string, unknown>;
      const blog = settings.blog_posts as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(blog)) {
        const items = blog.slice(0, limit || 10);
        return items.map((b) => ({
          id: (b.id as string) ?? "",
          site_id: siteId,
          title: (b.title as string) ?? "",
          excerpt: (b.excerpt as string) ?? undefined,
          content: (b.content as string) ?? undefined,
          featured_image: (b.featured_image as string) ?? undefined,
          category: (b.category as string) ?? undefined,
          author: (b.author as string) ?? undefined,
          published_at: (b.published_at as string) ?? undefined,
          status: (b.status as string) ?? undefined,
        }));
      }
    }
  } catch {
    // Silently fail
  }
  return [];
}

/**
 * Fetch enabled modules from site_module_installations (the actual source of truth).
 * 
 * Previously this read from sites.settings.enabled_modules which was never populated
 * by any installation flow. The real module installation data lives in the
 * site_module_installations table, joined with modules_v2 for module details.
 */
async function fetchModules(supabase: SupabaseClient, siteId: string): Promise<EnabledModule[]> {
  try {
    // Query active module installations for this site
    const { data: installations, error: installError } = await supabase
      .from("site_module_installations")
      .select("id, module_id, is_enabled, settings")
      .eq("site_id", siteId)
      .eq("is_enabled", true);

    if (installError || !installations || installations.length === 0) {
      return [];
    }

    // Fetch module details (name, slug) from modules_v2
    const moduleIds = installations.map((i: { module_id: string }) => i.module_id);
    const { data: modulesData } = await supabase
      .from("modules_v2")
      .select("id, name, slug")
      .in("id", moduleIds);

    const moduleMap = new Map(
      (modulesData || []).map((m: { id: string; name: string; slug: string }) => [m.id, m])
    );

    return installations.map((inst: { id: string; module_id: string; is_enabled: boolean; settings: Record<string, unknown> | null }) => {
      const mod = moduleMap.get(inst.module_id) as { id: string; name: string; slug: string } | undefined;
      return {
        id: inst.id,
        site_id: siteId,
        module_type: mod?.slug ?? "",
        module_name: mod?.name ?? undefined,
        name: mod?.name ?? undefined,
        enabled: inst.is_enabled,
        settings: inst.settings ?? undefined,
      };
    });
  } catch {
    // Silently fail
  }
  return [];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Build contact data from client and locations
 */
function buildContactData(
  client: ClientData | null,
  locations: Location[] | null
): ContactData {
  const primaryLocation = locations?.find((l) => l.is_primary) || locations?.[0];

  return {
    email: client?.email || primaryLocation?.email,
    phone: client?.phone || primaryLocation?.phone,
    address: {
      street: client?.address || primaryLocation?.address,
      city: client?.city || primaryLocation?.city,
      state: client?.state || primaryLocation?.state,
      zip: client?.zip || primaryLocation?.zip,
      country: client?.country || primaryLocation?.country,
    },
    mapCoordinates:
      primaryLocation?.lat && primaryLocation?.lng
        ? {
            lat: primaryLocation.lat,
            lng: primaryLocation.lng,
          }
        : null,
  };
}

/**
 * Create an empty site object
 */
function createEmptySite(): SiteData {
  return {
    id: "",
    name: "",
  };
}

// =============================================================================
// CACHED BUILDER (with in-memory cache)
// =============================================================================

const contextCache = new Map<string, { data: BusinessDataContext; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Build data context with caching
 */
export async function buildDataContextCached(
  siteId: string,
  options?: DataContextBuilderOptions
): Promise<BusinessDataContext> {
  const cacheKey = `${siteId}-${JSON.stringify(options || {})}`;
  const cached = contextCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await buildDataContext(siteId, options);
  contextCache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Clear cache for a specific site
 */
export function clearContextCache(siteId?: string): void {
  if (siteId) {
    for (const key of contextCache.keys()) {
      if (key.startsWith(siteId)) {
        contextCache.delete(key);
      }
    }
  } else {
    contextCache.clear();
  }
}

// =============================================================================
// PARTIAL BUILDERS (for specific use cases)
// =============================================================================

/**
 * Build only branding context (for quick access)
 */
export async function buildBrandingContext(siteId: string): Promise<{
  site: SiteData;
  branding: BrandingData;
  client: ClientData;
}> {
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("*, agencies(*)")
    .eq("id", siteId)
    .single();

  const branding = await fetchBranding(supabase, siteId);

  let clientData: ClientData = {};
  if (site?.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", site.client_id)
      .single();
    if (client) {
      clientData = normalizeToClientData(client as Record<string, unknown>);
    }
  }

  return {
    site: normalizeSiteData(site as Record<string, unknown>) || createEmptySite(),
    branding: branding || {},
    client: clientData,
  };
}

/**
 * Build content-focused context (team, services, testimonials)
 */
export async function buildContentContext(siteId: string): Promise<{
  team: TeamMember[];
  services: Service[];
  testimonials: Testimonial[];
  portfolio: PortfolioItem[];
  faq: FAQItem[];
}> {
  const supabase = await createClient();

  const [team, services, testimonials, portfolio, faq] = await Promise.all([
    fetchTeamMembers(supabase, siteId),
    fetchServices(supabase, siteId),
    fetchTestimonials(supabase, siteId),
    fetchPortfolio(supabase, siteId),
    fetchFAQ(supabase, siteId),
  ]);

  return { team, services, testimonials, portfolio, faq };
}

/**
 * Build contact-focused context
 */
export async function buildContactContext(siteId: string): Promise<{
  contact: ContactData;
  social: SocialLink[];
  hours: BusinessHours[];
  locations: Location[];
}> {
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("client_id")
    .eq("id", siteId)
    .single();

  let clientData: ClientData = {};
  if (site?.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", site.client_id)
      .single();
    if (client) {
      clientData = normalizeToClientData(client as Record<string, unknown>);
    }
  }

  const [social, hours, locations] = await Promise.all([
    fetchSocialLinks(supabase, siteId),
    fetchBusinessHours(supabase, siteId),
    fetchLocations(supabase, siteId),
  ]);

  return {
    contact: buildContactData(clientData, locations),
    social,
    hours,
    locations,
  };
}

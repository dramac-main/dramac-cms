// src/lib/marketplace/search-service.ts
// Phase EM-42: Module Marketplace 2.0 - Search & Discovery Service

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Use 'any' type for Supabase client to handle dynamic tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  type: string | null;
  rating: number;
  review_count: number;
  install_count: number;
  price: number | null;
  tags: string[];
  developer: {
    name: string;
    slug: string;
    is_verified: boolean;
  } | null;
  highlights?: {
    name?: string;
    description?: string;
  };
  featuredHeadline?: string;
  featuredDescription?: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  type?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  tags?: string[];
  developer?: string;
  isFree?: boolean;
  sortBy?: "relevance" | "popular" | "newest" | "rating" | "price_low" | "price_high";
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: { name: string; count: number }[];
    types: { name: string; count: number }[];
    priceRanges: { min: number; max: number | null; count: number }[];
    ratings: { rating: number; count: number }[];
  };
}

/**
 * Search modules in the marketplace
 */
export async function searchModules(
  filters: SearchFilters,
  page = 1,
  limit = 20
): Promise<SearchResults> {
  const supabase = await createClient() as AnySupabase;
  const from = (page - 1) * limit;

  let query = supabase
    .from("modules_v2")
    .select(`
      id,
      name,
      slug,
      description,
      icon,
      category,
      install_level,
      rating_average,
      review_count,
      install_count,
      wholesale_price_monthly,
      tags,
      developer_profile_id,
      developer_profiles:developer_profile_id (
        display_name,
        slug,
        is_verified
      )
    `, { count: "exact" })
    .eq("status", "active");

  // Full-text search
  if (filters.query) {
    // Use the search_vector column if available, otherwise fallback to ilike
    query = query.or(
      `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
    );
  }

  // Category filter
  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  // Type filter
  if (filters.type) {
    query = query.eq("install_level", filters.type);
  }

  // Price filters
  if (filters.isFree) {
    query = query.or("wholesale_price_monthly.is.null,wholesale_price_monthly.eq.0");
  } else {
    if (filters.priceMin !== undefined) {
      query = query.gte("wholesale_price_monthly", filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      query = query.lte("wholesale_price_monthly", filters.priceMax);
    }
  }

  // Rating filter
  if (filters.minRating) {
    query = query.gte("rating_average", filters.minRating);
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  // Sorting
  switch (filters.sortBy) {
    case "popular":
      query = query.order("install_count", { ascending: false, nullsFirst: false });
      break;
    case "newest":
      query = query.order("published_at", { ascending: false, nullsFirst: false });
      break;
    case "rating":
      query = query.order("rating_average", { ascending: false, nullsFirst: false });
      break;
    case "price_low":
      query = query.order("wholesale_price_monthly", { ascending: true, nullsFirst: true });
      break;
    case "price_high":
      query = query.order("wholesale_price_monthly", { ascending: false, nullsFirst: false });
      break;
    default:
      // Relevance - default to popularity if no search query
      if (!filters.query) {
        query = query.order("install_count", { ascending: false, nullsFirst: false });
      }
  }

  // Pagination
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[SearchService] Error searching modules:", error);
    throw new Error("Failed to search modules");
  }

  // Get facets
  const facets = await getFacets(supabase, filters);

  // Map results
  const results: SearchResult[] = (data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    slug: m.slug as string,
    description: m.description as string | null,
    icon: m.icon as string | null,
    category: m.category as string | null,
    type: m.install_level as string | null,
    rating: (m.rating_average as number) || 0,
    review_count: (m.review_count as number) || 0,
    install_count: (m.install_count as number) || 0,
    price: m.wholesale_price_monthly as number | null,
    tags: (m.tags as string[]) || [],
    developer: m.developer_profiles ? {
      name: (m.developer_profiles as Record<string, unknown>).display_name as string,
      slug: (m.developer_profiles as Record<string, unknown>).slug as string,
      is_verified: (m.developer_profiles as Record<string, unknown>).is_verified as boolean
    } : null
  }));

  return {
    results,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    facets
  };
}

/**
 * Get facets for filtering
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFacets(supabase: any, filters: SearchFilters): Promise<SearchResults["facets"]> {
  // Get category counts
  const { data: categoryData } = await supabase
    .from("modules_v2")
    .select("category")
    .eq("status", "active");

  const categoryCounts: Record<string, number> = {};
  (categoryData || []).forEach((m: { category: string | null }) => {
    if (m.category) {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    }
  });
  const categories = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));

  // Get type counts
  const { data: typeData } = await supabase
    .from("modules_v2")
    .select("install_level")
    .eq("status", "active");

  const typeCounts: Record<string, number> = {};
  (typeData || []).forEach((m: { install_level: string | null }) => {
    if (m.install_level) {
      typeCounts[m.install_level] = (typeCounts[m.install_level] || 0) + 1;
    }
  });
  const types = Object.entries(typeCounts).map(([name, count]) => ({ name, count }));

  // Get rating distribution
  const { data: ratingData } = await supabase
    .from("modules_v2")
    .select("rating_average")
    .eq("status", "active");

  const ratingCounts = [0, 0, 0, 0, 0];
  (ratingData || []).forEach((m: { rating_average: number | null }) => {
    const rating = m.rating_average || 0;
    if (rating >= 4.5) ratingCounts[4]++;
    else if (rating >= 3.5) ratingCounts[3]++;
    else if (rating >= 2.5) ratingCounts[2]++;
    else if (rating >= 1.5) ratingCounts[1]++;
    else ratingCounts[0]++;
  });
  const ratings = ratingCounts.map((count, i) => ({ rating: i + 1, count }));

  // Get price range counts
  const { data: priceData } = await supabase
    .from("modules_v2")
    .select("wholesale_price_monthly")
    .eq("status", "active");

  let freeCount = 0;
  let lowCount = 0;
  let midCount = 0;
  let highCount = 0;

  (priceData || []).forEach((m: { wholesale_price_monthly: number | null }) => {
    const price = m.wholesale_price_monthly || 0;
    if (price === 0) freeCount++;
    else if (price <= 25) lowCount++;
    else if (price <= 100) midCount++;
    else highCount++;
  });

  return {
    categories,
    types,
    priceRanges: [
      { min: 0, max: 0, count: freeCount },
      { min: 1, max: 25, count: lowCount },
      { min: 25, max: 100, count: midCount },
      { min: 100, max: null, count: highCount }
    ],
    ratings
  };
}

/**
 * Get featured modules by placement
 */
export async function getFeaturedModules(placement: string): Promise<SearchResult[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("featured_modules")
    .select(`
      id,
      headline,
      description,
      custom_image_url,
      module:modules_v2 (
        id,
        name,
        slug,
        description,
        icon,
        category,
        install_level,
        rating_average,
        review_count,
        install_count,
        wholesale_price_monthly,
        tags,
        developer_profiles:developer_profile_id (
          display_name,
          slug,
          is_verified
        )
      )
    `)
    .eq("placement", placement)
    .eq("is_active", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("position");

  if (error) {
    console.error("[SearchService] Error fetching featured modules:", error);
    return [];
  }

  return (data || []).map((f: Record<string, unknown>) => {
    const module = f.module as Record<string, unknown> | null;
    if (!module) return null;

    return {
      id: module.id as string,
      name: module.name as string,
      slug: module.slug as string,
      description: module.description as string | null,
      icon: module.icon as string | null,
      category: module.category as string | null,
      type: module.install_level as string | null,
      rating: (module.rating_average as number) || 0,
      review_count: (module.review_count as number) || 0,
      install_count: (module.install_count as number) || 0,
      price: module.wholesale_price_monthly as number | null,
      tags: (module.tags as string[]) || [],
      developer: module.developer_profiles ? {
        name: (module.developer_profiles as Record<string, unknown>).display_name as string,
        slug: (module.developer_profiles as Record<string, unknown>).slug as string,
        is_verified: (module.developer_profiles as Record<string, unknown>).is_verified as boolean
      } : null,
      featuredHeadline: f.headline as string | undefined,
      featuredDescription: f.description as string | undefined
    };
  }).filter(Boolean) as SearchResult[];
}

/**
 * Get recommendations for user
 */
export async function getRecommendations(limit = 10): Promise<SearchResult[]> {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Return popular modules for anonymous users
    return getPopularModules(limit);
  }

  // Get user's installed modules
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: installed } = await (supabase as any)
    .from("site_modules")
    .select(`
      module:modules_v2 (
        category,
        install_level,
        tags
      )
    `);

  if (!installed || installed.length === 0) {
    // Return popular modules for new users
    return getPopularModules(limit);
  }

  // Extract preferences
  const categories = new Set<string>();
  const types = new Set<string>();
  const tags = new Set<string>();

  installed.forEach((i: { module: { category: string | null; install_level: string | null; tags: string[] | null } | null }) => {
    if (i.module?.category) categories.add(i.module.category);
    if (i.module?.install_level) types.add(i.module.install_level);
    i.module?.tags?.forEach((t: string) => tags.add(t));
  });

  // Get installed module IDs to exclude
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: installedIds } = await (supabase as any)
    .from("site_modules")
    .select("module_id");

  const excludeIds = (installedIds || []).map((i: { module_id: string }) => i.module_id);

  // Find similar modules
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("modules_v2")
    .select(`
      id, name, slug, description, icon, category, install_level,
      rating_average, review_count, install_count, wholesale_price_monthly, tags,
      developer_profiles:developer_profile_id (display_name, slug, is_verified)
    `)
    .eq("status", "active")
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  if (categories.size > 0) {
    query = query.in("category", Array.from(categories));
  }

  const { data, error } = await query.order("rating_average", { ascending: false });

  if (error) {
    console.error("[SearchService] Error fetching recommendations:", error);
    return getPopularModules(limit);
  }

  return (data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    slug: m.slug as string,
    description: m.description as string | null,
    icon: m.icon as string | null,
    category: m.category as string | null,
    type: m.install_level as string | null,
    rating: (m.rating_average as number) || 0,
    review_count: (m.review_count as number) || 0,
    install_count: (m.install_count as number) || 0,
    price: m.wholesale_price_monthly as number | null,
    tags: (m.tags as string[]) || [],
    developer: m.developer_profiles ? {
      name: (m.developer_profiles as Record<string, unknown>).display_name as string,
      slug: (m.developer_profiles as Record<string, unknown>).slug as string,
      is_verified: (m.developer_profiles as Record<string, unknown>).is_verified as boolean
    } : null
  }));
}

/**
 * Get popular modules (fallback for recommendations)
 */
async function getPopularModules(limit = 10): Promise<SearchResult[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("modules_v2")
    .select(`
      id, name, slug, description, icon, category, install_level,
      rating_average, review_count, install_count, wholesale_price_monthly, tags,
      developer_profiles:developer_profile_id (display_name, slug, is_verified)
    `)
    .eq("status", "active")
    .order("install_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[SearchService] Error fetching popular modules:", error);
    return [];
  }

  return (data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    slug: m.slug as string,
    description: m.description as string | null,
    icon: m.icon as string | null,
    category: m.category as string | null,
    type: m.install_level as string | null,
    rating: (m.rating_average as number) || 0,
    review_count: (m.review_count as number) || 0,
    install_count: (m.install_count as number) || 0,
    price: m.wholesale_price_monthly as number | null,
    tags: (m.tags as string[]) || [],
    developer: m.developer_profiles ? {
      name: (m.developer_profiles as Record<string, unknown>).display_name as string,
      slug: (m.developer_profiles as Record<string, unknown>).slug as string,
      is_verified: (m.developer_profiles as Record<string, unknown>).is_verified as boolean
    } : null
  }));
}

/**
 * Get trending modules (based on recent views)
 */
export async function getTrendingModules(limit = 10): Promise<SearchResult[]> {
  const supabase = await createClient();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Use the database function to get trending modules
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_trending_modules", {
    since_date: weekAgo.toISOString(),
    limit_count: limit
  });

  if (error) {
    console.error("[SearchService] Error fetching trending modules:", error);
    // Fallback to popular modules
    return getPopularModules(limit);
  }

  return (data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    slug: m.slug as string,
    description: m.description as string | null,
    icon: m.icon as string | null,
    category: m.category as string | null,
    type: m.type as string | null,
    rating: (m.rating as number) || 0,
    review_count: (m.review_count as number) || 0,
    install_count: (m.install_count as number) || 0,
    price: m.price as number | null,
    tags: (m.tags as string[]) || [],
    developer: null // Trending query doesn't include developer info
  }));
}

/**
 * Log search for analytics
 */
export async function logSearch(
  query: string,
  filters: SearchFilters,
  resultCount: number
): Promise<void> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_search_history").insert({
    user_id: user.id,
    query,
    filters,
    result_count: resultCount
  });
}

/**
 * Log module view
 */
export async function logModuleView(
  moduleId: string,
  sessionId?: string
): Promise<void> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user (optional)
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("module_views").insert({
    module_id: moduleId,
    user_id: user?.id || null,
    session_id: sessionId || null
  });
}

/**
 * Update module view engagement
 */
export async function updateViewEngagement(
  moduleId: string,
  engagement: {
    viewDurationSeconds?: number;
    scrolledToBottom?: boolean;
    clickedInstall?: boolean;
  }
): Promise<void> {
  const supabase = await createClient() as AnySupabase;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Find the most recent view for this module by this user
  const { data: view } = await supabase
    .from("module_views")
    .select("id")
    .eq("module_id", moduleId)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (view) {
    await supabase
      .from("module_views")
      .update({
        view_duration_seconds: engagement.viewDurationSeconds,
        scrolled_to_bottom: engagement.scrolledToBottom,
        clicked_install: engagement.clickedInstall
      })
      .eq("id", view.id);
  }
}

/**
 * Get all available categories
 */
export async function getCategories(): Promise<string[]> {
  const supabase = await createClient() as AnySupabase;

  const { data, error } = await supabase
    .from("modules_v2")
    .select("category")
    .eq("status", "active")
    .not("category", "is", null);

  if (error) {
    console.error("[SearchService] Error fetching categories:", error);
    return [];
  }

  const categories = new Set<string>();
  (data || []).forEach((m: { category: string | null }) => {
    if (m.category) categories.add(m.category);
  });

  return Array.from(categories).sort();
}

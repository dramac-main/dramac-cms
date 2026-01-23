// src/lib/marketplace/developer-service.ts
// Phase EM-42: Module Marketplace 2.0 - Developer Profile Service

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Use 'any' type for Supabase client to handle dynamic tables
// The developer_profiles table is new and not in generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export interface DeveloperProfile {
  id: string;
  user_id: string;
  agency_id: string | null;
  display_name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  website_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verification_type: string | null;
  total_modules: number;
  total_downloads: number;
  total_revenue: number;
  avg_rating: number;
  total_reviews: number;
  accepts_custom_requests: boolean;
  custom_request_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeveloperProfileInput {
  display_name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  website_url?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  accepts_custom_requests?: boolean;
  custom_request_rate?: number;
}

export interface UpdateDeveloperProfileInput {
  display_name?: string;
  slug?: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  website_url?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  accepts_custom_requests?: boolean;
  custom_request_rate?: number;
}

/**
 * Get developer profile by slug
 */
export async function getDeveloperBySlug(slug: string): Promise<DeveloperProfile | null> {
  const supabase = await createClient() as AnySupabase;

  const { data, error } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("[DeveloperService] Error fetching developer:", error);
    return null;
  }

  return data as DeveloperProfile;
}

/**
 * Get developer profile by user ID
 */
export async function getDeveloperByUserId(userId: string): Promise<DeveloperProfile | null> {
  const supabase = await createClient() as AnySupabase;

  const { data, error } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("[DeveloperService] Error fetching developer:", error);
    return null;
  }

  return data as DeveloperProfile;
}

/**
 * Get current user's developer profile
 */
export async function getCurrentDeveloperProfile(): Promise<DeveloperProfile | null> {
  const supabase = await createClient() as AnySupabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  return getDeveloperByUserId(user.id);
}

/**
 * Create developer profile
 */
export async function createDeveloperProfile(
  input: CreateDeveloperProfileInput
): Promise<DeveloperProfile> {
  const supabase = await createClient() as AnySupabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // Check if profile already exists
  const existing = await getDeveloperByUserId(user.id);
  if (existing) {
    throw new Error("Developer profile already exists");
  }

  // Check if slug is available
  const { data: slugCheck } = await supabase
    .from("developer_profiles")
    .select("id")
    .eq("slug", input.slug)
    .single();

  if (slugCheck) {
    throw new Error("This slug is already taken");
  }

  // Get user's agency if any
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("developer_profiles")
    .insert({
      user_id: user.id,
      agency_id: membership?.agency_id || null,
      display_name: input.display_name,
      slug: input.slug,
      bio: input.bio || null,
      avatar_url: input.avatar_url || null,
      cover_image_url: input.cover_image_url || null,
      website_url: input.website_url || null,
      github_url: input.github_url || null,
      twitter_url: input.twitter_url || null,
      linkedin_url: input.linkedin_url || null,
      accepts_custom_requests: input.accepts_custom_requests || false,
      custom_request_rate: input.custom_request_rate || null
    })
    .select("*")
    .single();

  if (error) {
    console.error("[DeveloperService] Error creating profile:", error);
    throw new Error("Failed to create developer profile");
  }

  return data as DeveloperProfile;
}

/**
 * Update developer profile
 */
export async function updateDeveloperProfile(
  input: UpdateDeveloperProfileInput
): Promise<DeveloperProfile> {
  const supabase = await createClient() as AnySupabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  // Check if slug is changing and is available
  if (input.slug) {
    const { data: slugCheck } = await supabase
      .from("developer_profiles")
      .select("id, user_id")
      .eq("slug", input.slug)
      .single();

    if (slugCheck && slugCheck.user_id !== user.id) {
      throw new Error("This slug is already taken");
    }
  }

  const { data, error } = await supabase
    .from("developer_profiles")
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("[DeveloperService] Error updating profile:", error);
    throw new Error("Failed to update developer profile");
  }

  return data as DeveloperProfile;
}

/**
 * Get modules by developer
 */
export async function getDeveloperModules(
  developerUserId: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: "newest" | "popular" | "rating";
  } = {}
): Promise<{
  modules: Array<{
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
  }>;
  total: number;
}> {
  const supabase = await createClient() as AnySupabase;
  
  const page = options.page || 1;
  const limit = options.limit || 20;
  const from = (page - 1) * limit;

  let query = supabase
    .from("modules_v2")
    .select(`
      id, name, slug, description, icon, category, install_level,
      rating_average, review_count, install_count, wholesale_price_monthly, tags
    `, { count: "exact" })
    .eq("created_by", developerUserId)
    .eq("status", "active");

  // Sorting
  switch (options.sortBy) {
    case "newest":
      query = query.order("published_at", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_average", { ascending: false });
      break;
    case "popular":
    default:
      query = query.order("install_count", { ascending: false });
  }

  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[DeveloperService] Error fetching modules:", error);
    throw new Error("Failed to fetch developer modules");
  }

  return {
    modules: (data || []).map((m: Record<string, unknown>) => ({
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
      tags: (m.tags as string[]) || []
    })),
    total: count || 0
  };
}

/**
 * Get reviews for all modules by a developer
 */
export async function getDeveloperReviews(
  developerUserId: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: "newest" | "rating";
  } = {}
): Promise<{
  reviews: Array<{
    id: string;
    module_id: string;
    module_name: string;
    rating: number;
    title: string | null;
    content: string | null;
    created_at: string;
    user_name: string | null;
  }>;
  total: number;
}> {
  const supabase = await createClient() as AnySupabase;
  
  const page = options.page || 1;
  const limit = options.limit || 10;
  const from = (page - 1) * limit;

  // Get all module IDs by this developer
  const { data: modules } = await supabase
    .from("modules_v2")
    .select("id, name")
    .eq("created_by", developerUserId)
    .eq("status", "active");

  if (!modules || modules.length === 0) {
    return { reviews: [], total: 0 };
  }

  const moduleIds = modules.map((m: { id: string }) => m.id);
  const moduleMap = new Map(modules.map((m: { id: string; name: string }) => [m.id, m.name]));

  // Get reviews for these modules
  let query = supabase
    .from("module_reviews")
    .select("*", { count: "exact" })
    .in("module_id", moduleIds)
    .eq("status", "published");

  // Sorting
  switch (options.sortBy) {
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[DeveloperService] Error fetching reviews:", error);
    throw new Error("Failed to fetch developer reviews");
  }

  return {
    reviews: (data || []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      module_id: r.module_id as string,
      module_name: moduleMap.get(r.module_id as string) || "Unknown Module",
      rating: r.rating as number,
      title: r.title as string | null,
      content: r.content as string | null,
      created_at: r.created_at as string,
      user_name: null // Would need to join with users table
    })),
    total: count || 0
  };
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createClient() as AnySupabase;

  const { data } = await supabase
    .from("developer_profiles")
    .select("id")
    .eq("slug", slug)
    .single();

  return !data;
}

/**
 * Get verified developers (for marketplace featured section)
 */
export async function getVerifiedDevelopers(limit = 10): Promise<DeveloperProfile[]> {
  const supabase = await createClient() as AnySupabase;

  const { data, error } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("is_verified", true)
    .order("total_downloads", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[DeveloperService] Error fetching verified developers:", error);
    return [];
  }

  return (data || []) as DeveloperProfile[];
}

/**
 * Get top developers by metrics
 */
export async function getTopDevelopers(
  metric: "downloads" | "rating" | "modules" = "downloads",
  limit = 10
): Promise<DeveloperProfile[]> {
  const supabase = await createClient() as AnySupabase;

  const orderColumn = {
    downloads: "total_downloads",
    rating: "avg_rating",
    modules: "total_modules"
  }[metric];

  const { data, error } = await supabase
    .from("developer_profiles")
    .select("*")
    .gt("total_modules", 0) // Only developers with published modules
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[DeveloperService] Error fetching top developers:", error);
    return [];
  }

  return (data || []) as DeveloperProfile[];
}

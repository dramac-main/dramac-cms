"use server";

import { createClient } from "@/lib/supabase/server";
import { MODULE_CATALOG } from "./module-catalog";
import type { ModuleDefinition, ModuleCategory } from "./module-types";

import { DEFAULT_CURRENCY } from '@/lib/locale-config'
// Type for database rows
interface ModulesV2Row {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  icon: string | null;
  category: string | null;
  tags: string[] | null;
  current_version: string | null;
  studio_version: string | null;
  pricing_type: string | null;
  wholesale_price_monthly: number | null;
  wholesale_price_yearly: number | null;
  features: string[] | null;
  screenshots: string[] | null;
  render_code: string | null;
  styles: string | null;
  settings_schema: Record<string, unknown> | null;
  default_settings: Record<string, unknown> | null;
  status: string;
  is_featured: boolean | null;
  is_premium: boolean | null;
  install_level: string | null;
  source: string | null;
  studio_module_id: string | null;
  author_name: string | null;
  author_verified: boolean | null;
  rating_average: number | null;
  rating_count: number | null;
  install_count: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/**
 * Get all marketplace modules (catalog + studio published).
 * This is the primary function for the marketplace browse page.
 */
export async function getMarketplaceModules(options?: {
  category?: string;
  search?: string;
  includeStudio?: boolean;
}): Promise<ModuleDefinition[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Build query for modules_v2 table
  let query = db
    .from("modules_v2")
    .select("*")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("install_count", { ascending: false });

  // Filter by category if provided
  if (options?.category) {
    query = query.eq("category", options.category);
  }

  // Search filter
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,description.ilike.%${options.search}%`
    );
  }

  const { data: dbModules, error } = await query;

  if (error) {
    console.error("[MarketplaceService] Error fetching modules:", error);
    // Fall back to static catalog on error
    return MODULE_CATALOG;
  }

  // Convert database rows to ModuleDefinition format
  const studioModules: ModuleDefinition[] = ((dbModules as ModulesV2Row[]) || [])
    .filter((m) => m.source === "studio")
    .map((m) => convertToModuleDefinition(m));

  // Get slugs of studio modules to filter catalog
  const studioSlugs = new Set(studioModules.map((m) => m.slug));

  // Filter catalog modules (those not overridden by studio)
  let catalogModules = MODULE_CATALOG.filter((m) => !studioSlugs.has(m.slug));

  // Apply category filter to catalog modules
  if (options?.category) {
    catalogModules = catalogModules.filter((m) => m.category === options.category);
  }

  // Apply search filter to catalog modules
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    catalogModules = catalogModules.filter(
      (m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower)
    );
  }

  // Combine studio and catalog modules
  // Studio modules first (they're typically featured/newer)
  return [...studioModules, ...catalogModules];
}

/**
 * Get a single module by ID or slug.
 * First checks modules_v2 (database), then falls back to static catalog.
 */
export async function getModuleByIdOrSlug(
  idOrSlug: string
): Promise<ModuleDefinition | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check if it's a UUID format
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  if (isUUID) {
    // Try to find by ID first
    const { data: moduleById } = await db
      .from("modules_v2")
      .select("*")
      .eq("id", idOrSlug)
      .eq("status", "active")
      .single();

    if (moduleById) {
      return convertToModuleDefinition(moduleById as ModulesV2Row);
    }
  }

  // Try to find by slug
  const { data: moduleBySlug } = await db
    .from("modules_v2")
    .select("*")
    .eq("slug", idOrSlug)
    .eq("status", "active")
    .single();

  if (moduleBySlug) {
    return convertToModuleDefinition(moduleBySlug as ModulesV2Row);
  }

  // Fall back to static catalog
  return (
    MODULE_CATALOG.find((m) => m.id === idOrSlug || m.slug === idOrSlug) || null
  );
}

/**
 * Get modules by category.
 */
export async function getModulesByCategory(
  category: ModuleCategory
): Promise<ModuleDefinition[]> {
  return getMarketplaceModules({ category });
}

/**
 * Get featured modules for homepage display.
 */
export async function getFeaturedModules(limit: number = 6): Promise<ModuleDefinition[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: featured } = await db
    .from("modules_v2")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("install_count", { ascending: false })
    .limit(limit);

  if (featured && featured.length > 0) {
    return (featured as ModulesV2Row[]).map((m) => convertToModuleDefinition(m));
  }

  // Fall back to first N catalog modules
  return MODULE_CATALOG.filter((m) => m.status === "active").slice(0, limit);
}

/**
 * Get all available categories.
 */
export async function getAvailableCategories(): Promise<string[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data } = await db
    .from("modules_v2")
    .select("category")
    .eq("status", "active");

  const dbCategories = new Set((data || []).map((d: { category: string }) => d.category));

  // Also include categories from static catalog
  MODULE_CATALOG.forEach((m) => {
    if (m.status === "active") {
      dbCategories.add(m.category);
    }
  });

  return Array.from(dbCategories).filter(Boolean).sort() as string[];
}

/**
 * Search modules by query string.
 */
export async function searchModules(query: string): Promise<ModuleDefinition[]> {
  return getMarketplaceModules({ search: query });
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Convert a database row to ModuleDefinition format.
 */
function convertToModuleDefinition(m: ModulesV2Row): ModuleDefinition {
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    description: m.description || "",
    longDescription: m.long_description || m.description || "",
    version: m.current_version || m.studio_version || "1.0.0",
    icon: m.icon || "📦",
    screenshots: m.screenshots || [],
    category: (m.category as ModuleCategory) || "other",
    tags: m.tags || [],
    author: {
      name: m.author_name || "DRAMAC Studio",
      verified: m.author_verified ?? true,
    },
    pricing: {
      type:
        m.pricing_type === "free"
          ? "free"
          : m.pricing_type === "one-time"
          ? "one-time"
          : m.pricing_type === "yearly"
          ? "yearly"
          : "monthly",
      amount: m.wholesale_price_monthly || 0,
      currency: DEFAULT_CURRENCY,
    },
    features: m.features || [],
    status: m.status === "active" ? "active" : m.status === "beta" ? "beta" : "inactive",
    rating: m.rating_average || 0,
    reviewCount: m.rating_count || 0,
    installCount: m.install_count || 0,
    createdAt: new Date(m.created_at),
    updatedAt: new Date(m.updated_at),
    // Studio-specific fields
    source: (m.source as "catalog" | "studio") || "catalog",
    renderCode: m.render_code || undefined,
    styles: m.styles || undefined,
    settingsSchema: m.settings_schema || undefined,
    defaultSettings: m.default_settings || undefined,
    isFeatured: m.is_featured || false,
    isPremium: m.is_premium || false,
  };
}

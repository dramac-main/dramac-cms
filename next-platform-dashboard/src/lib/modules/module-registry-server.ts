"use server";

import { createClient } from "@/lib/supabase/server";
import type { ModuleDefinition, ModuleCategory, ModulePricingType } from "./module-types";
import { MODULE_CATALOG } from "./module-catalog";

/**
 * Server actions for loading dynamic modules from the database
 * These can be called from Server Components to get modules from Module Studio
 * 
 * Phase 81A: Now also fetches from modules_v2 for synced studio modules
 */

/**
 * Get all modules from the modules_v2 catalog table.
 * This includes both static catalog modules synced to DB and studio-built modules.
 */
export async function getModulesFromCatalog(): Promise<ModuleDefinition[]> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("modules_v2")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("[ModuleRegistry] Error loading catalog modules:", error);
      return [];
    }

    return (data || []).map(mapCatalogModuleToDefinition);
  } catch (error) {
    console.error("[ModuleRegistry] Error fetching catalog:", error);
    return [];
  }
}

/**
 * Get all published modules from the Module Studio database (module_source)
 * This is the legacy method - prefer getModulesFromCatalog for synced modules
 */
export async function getPublishedStudioModules(): Promise<ModuleDefinition[]> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("module_source")
      .select("*")
      .eq("status", "published");

    if (error) {
      console.error("[ModuleRegistry] Error loading published modules:", error);
      return [];
    }

    return (data || []).map((m: Record<string, unknown>): ModuleDefinition => ({
      id: m.module_id as string,
      name: m.name as string,
      slug: m.slug as string,
      description: (m.description as string) || "",
      icon: (m.icon as string) || "📦",
      category: (m.category as ModuleCategory) || "other",
      version: (m.published_version as string) || "1.0.0",
      status: "active",
      tags: [],
      pricing: {
        type: "free", // Studio modules use tier-based pricing system
        amount: 0,
        currency: "USD",
      },
      author: {
        name: "DRAMAC",
        verified: true,
      },
      createdAt: new Date(m.created_at as string),
      updatedAt: new Date(m.updated_at as string),
      installCount: 0,
      rating: 5,
      settingsSchema: m.settings_schema as Record<string, unknown> || {},
      defaultSettings: m.default_settings as Record<string, unknown> || {},
      dependencies: (m.dependencies as string[]) || [],
      source: "studio" as const,
      renderCode: m.render_code as string,
      styles: m.styles as string,
    }));
  } catch (error) {
    console.error("[ModuleRegistry] Error:", error);
    return [];
  }
}

/**
 * Get modules in testing status (for super admin / test sites)
 */
export async function getTestingStudioModules(): Promise<ModuleDefinition[]> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data, error } = await db
      .from("module_source")
      .select("*")
      .eq("status", "testing");

    if (error) {
      console.error("[ModuleRegistry] Error loading testing modules:", error);
      return [];
    }

    return (data || []).map((m: Record<string, unknown>): ModuleDefinition => ({
      id: m.module_id as string,
      name: m.name as string,
      slug: m.slug as string,
      description: (m.description as string) || "",
      icon: (m.icon as string) || "📦",
      category: (m.category as ModuleCategory) || "other",
      version: (m.latest_version as string) || "0.0.1",
      status: "beta",
      tags: ["testing"],
      pricing: {
        type: "free",
        amount: 0,
        currency: "USD",
      },
      author: {
        name: "DRAMAC",
        verified: true,
      },
      createdAt: new Date(m.created_at as string),
      updatedAt: new Date(m.updated_at as string),
      installCount: 0,
      source: "studio" as const,
      renderCode: m.render_code as string,
      styles: m.styles as string,
      settingsSchema: m.settings_schema as Record<string, unknown> || {},
      defaultSettings: m.default_settings as Record<string, unknown> || {},
      dependencies: (m.dependencies as string[]) || [],
    }));
  } catch (error) {
    console.error("[ModuleRegistry] Error:", error);
    return [];
  }
}

/**
 * Get all modules: static catalog + modules_v2 + published studio modules
 * This is the main entry point for fetching all available modules.
 * 
 * Priority order:
 * 1. modules_v2 catalog (synced studio modules + platform modules)
 * 2. Static MODULE_CATALOG as fallback
 * 3. Published studio modules not yet synced (direct from module_source)
 */
export async function getAllModules(): Promise<ModuleDefinition[]> {
  try {
    // Try to get modules from modules_v2 first (includes synced studio modules)
    const catalogModules = await getModulesFromCatalog();
    
    // Also get any published studio modules not yet synced
    const studioModules = await getPublishedStudioModules();
    
    // Start with static catalog as base
    const moduleMap = new Map<string, ModuleDefinition>();
    MODULE_CATALOG.forEach((m) => moduleMap.set(m.slug || m.id, m));
    
    // Layer in catalog modules (these override static for same slug)
    catalogModules.forEach((m) => moduleMap.set(m.slug || m.id, m));
    
    // Layer in any studio modules not in catalog (by slug to avoid duplicates)
    studioModules.forEach((m) => {
      // Only add if not already present from catalog (avoids duplicates)
      if (!moduleMap.has(m.slug || m.id)) {
        moduleMap.set(m.slug || m.id, m);
      }
    });
    
    return Array.from(moduleMap.values());
  } catch (error) {
    console.error("[ModuleRegistry] Error in getAllModules:", error);
    // Fallback to static catalog on error
    return [...MODULE_CATALOG];
  }
}

/**
 * Get all modules including testing (for super admin view)
 */
export async function getAllModulesIncludingTesting(): Promise<{
  published: ModuleDefinition[];
  testing: ModuleDefinition[];
}> {
  const [publishedModules, testingModules] = await Promise.all([
    getAllModules(),
    getTestingStudioModules(),
  ]);
  
  return {
    published: publishedModules,
    testing: testingModules,
  };
}

/**
 * Get a single module by ID or slug from any source.
 * Priority: modules_v2 catalog → module_source → static catalog
 */
export async function getModuleById(moduleIdOrSlug: string): Promise<ModuleDefinition | null> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // First check modules_v2 catalog (includes synced studio modules)
    // Check by id first, then by slug
    let catalogModule = null;
    let catalogError = null;
    
    // Check if it's a UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleIdOrSlug);
    
    if (isUUID) {
      const result = await db
        .from("modules_v2")
        .select("*")
        .eq("id", moduleIdOrSlug)
        .eq("status", "active")
        .maybeSingle();
      catalogModule = result.data;
      catalogError = result.error;
    }
    
    if (!catalogModule) {
      // Try by slug
      const result = await db
        .from("modules_v2")
        .select("*")
        .eq("slug", moduleIdOrSlug)
        .eq("status", "active")
        .maybeSingle();
      catalogModule = result.data;
      catalogError = result.error;
    }

    if (!catalogError && catalogModule) {
      return mapCatalogModuleToDefinition(catalogModule);
    }

    // Then check module_source for unsynced studio modules
    // Try by module_id first, then by slug
    let studioModule = null;
    let studioError = null;
    
    let result = await db
      .from("module_source")
      .select("*")
      .eq("module_id", moduleIdOrSlug)
      .in("status", ["published", "testing"])
      .maybeSingle();
    studioModule = result.data;
    studioError = result.error;
    
    if (!studioModule && !studioError) {
      result = await db
        .from("module_source")
        .select("*")
        .eq("slug", moduleIdOrSlug)
        .in("status", ["published", "testing"])
        .maybeSingle();
      studioModule = result.data;
      studioError = result.error;
    }

    if (!studioError && studioModule) {
      // Check if user can access testing modules
      if (studioModule.status === "testing") {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await db
            .from("profiles")
            .select("agency_id")
            .eq("id", user.id)
            .single();
          
          if (profile?.agency_id) {
            // Check testing_tier: 'internal' modules are dev-only, not accessible via detail page
            if (studioModule.testing_tier === "internal") {
              console.log(`[ModuleRegistry] Module ${studioModule.slug} is internal tier - not accessible`);
              return null; // Internal testing only - not accessible
            }
            
            // Check if user has test sites
            const { data: testSites } = await db
              .from("test_site_configuration" as any)
              .select("site_id, sites!inner(agency_id)")
              .eq("is_active", true)
              .eq("sites.agency_id", profile.agency_id);
            
            const hasTestSites = testSites && testSites.length > 0;
            
            // Test site users can access beta/public tier modules
            if (hasTestSites && (studioModule.testing_tier === "beta" || studioModule.testing_tier === "public")) {
              console.log(`[ModuleRegistry] Test site user accessing ${studioModule.slug} (${studioModule.testing_tier})`);
              // Allow access - skip to module return
            } else {
              // Check beta enrollment for non-test-site users
              const { data: betaEnrollment } = await db
                .from("beta_enrollment")
                .select("*")
                .eq("agency_id", profile.agency_id)
                .eq("is_active", true)
                .single();
              
              // If not enrolled in beta and no test sites, return null
              if (!betaEnrollment) {
                return null;
              }
              
              // Check tier-specific access
              if ((betaEnrollment as any).beta_tier === "standard") {
                // Standard tier: must be opted in AND module must be beta/public tier
                if (studioModule.testing_tier !== "beta" && studioModule.testing_tier !== "public") {
                  return null;
                }
                const acceptedModules = (betaEnrollment as any).accepted_modules || [];
                if (!acceptedModules.includes(studioModule.slug)) {
                  return null; // Not opted in
                }
              }
              // Internal/Alpha/Early Access: Allow access to beta/public tier modules
            }
          } else {
            return null; // No agency
          }
        } else {
          return null; // Not logged in
        }
      }

      return {
        id: studioModule.module_id as string,
        name: studioModule.name as string,
        slug: studioModule.slug as string,
        description: (studioModule.description as string) || "",
        icon: (studioModule.icon as string) || "📦",
        category: (studioModule.category as ModuleCategory) || "other",
        version: (studioModule.published_version || studioModule.latest_version || "1.0.0") as string,
        status: studioModule.status === "testing" ? "beta" : "active",
        tags: studioModule.status === "testing" ? ["testing", "beta"] : [],
        pricing: {
          type: "free",
          amount: 0,
          currency: "USD",
        },
        author: {
          name: "DRAMAC",
          verified: true,
        },
        createdAt: new Date(studioModule.created_at as string),
        updatedAt: new Date(studioModule.updated_at as string),
        installCount: 0,
        source: "studio" as const,
        renderCode: studioModule.render_code as string,
        styles: studioModule.styles as string,
        settingsSchema: studioModule.settings_schema as Record<string, unknown> || {},
        defaultSettings: studioModule.default_settings as Record<string, unknown> || {},
        dependencies: (studioModule.dependencies as string[]) || [],
      };
    }
  } catch (error) {
    console.error("[ModuleRegistry] Error fetching module by ID:", error);
  }
  
  // Finally check static catalog
  const staticModule = MODULE_CATALOG.find(
    (m) => m.id === moduleIdOrSlug || m.slug === moduleIdOrSlug
  );
  return staticModule || null;
}

/**
 * Get a module by slug (alias for getModuleById that also accepts slugs)
 */
export async function getModuleBySlug(slug: string): Promise<ModuleDefinition | null> {
  return getModuleById(slug);
}

/**
 * Check if a module exists and is available (published or testing)
 */
export async function isModuleAvailable(
  moduleId: string, 
  includeTestingModules: boolean = false
): Promise<boolean> {
  // Check static
  if (MODULE_CATALOG.some((m) => m.id === moduleId)) {
    return true;
  }
  
  // Check database
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const statuses = includeTestingModules ? ["published", "testing"] : ["published"];
    
    const { data, error } = await db
      .from("module_source")
      .select("id")
      .eq("module_id", moduleId)
      .in("status", statuses)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}
// ============================================================
// Helper Functions
// ============================================================

/**
 * Map a modules_v2 catalog row to ModuleDefinition
 */
function mapCatalogModuleToDefinition(m: Record<string, unknown>): ModuleDefinition {
  // Determine pricing type
  const pricingType = m.pricing_type as string || "free";
  const wholesaleMonthly = (m.wholesale_price_monthly as number) || 0;
  const wholesaleYearly = (m.wholesale_price_yearly as number) || 0;
  
  let priceType: ModulePricingType = "free";
  let amount = 0;
  
  if (pricingType === "monthly" || wholesaleMonthly > 0) {
    priceType = "monthly";
    amount = wholesaleMonthly;
  } else if (pricingType === "yearly" || wholesaleYearly > 0) {
    priceType = "monthly"; // Display as monthly equivalent
    amount = Math.round(wholesaleYearly / 12);
  } else if (pricingType === "one_time") {
    priceType = "one-time";
    amount = (m.wholesale_price_one_time as number) || 0;
  }

  return {
    id: m.id as string,
    name: m.name as string,
    slug: m.slug as string,
    description: (m.description as string) || "",
    longDescription: m.long_description as string,
    icon: (m.icon as string) || "📦",
    category: (m.category as ModuleCategory) || "other",
    version: (m.current_version as string) || "1.0.0",
    status: m.status === "active" ? "active" : "inactive",
    tags: (m.tags as string[]) || [],
    pricing: {
      type: priceType,
      amount,
      currency: "USD",
    },
    author: {
      name: (m.author_name as string) || "DRAMAC",
      verified: (m.author_verified as boolean) ?? true,
    },
    createdAt: m.created_at ? new Date(m.created_at as string) : new Date(),
    updatedAt: m.updated_at ? new Date(m.updated_at as string) : new Date(),
    installCount: (m.install_count as number) || 0,
    rating: (m.rating_average as number) || undefined,
    reviewCount: (m.rating_count as number) || undefined,
    
    // Studio-specific fields
    source: (m.source as "catalog" | "studio") || "catalog",
    renderCode: m.render_code as string | undefined,
    styles: m.styles as string | undefined,
    settingsSchema: (m.settings_schema as Record<string, unknown>) || {},
    defaultSettings: (m.default_settings as Record<string, unknown>) || {},
    
    // Additional fields
    features: m.features as string[] | undefined,
    screenshots: m.screenshots as string[] | undefined,
    documentationUrl: m.documentation_url as string | undefined,
    supportUrl: m.support_url as string | undefined,
    isFeatured: m.is_featured as boolean,
    isPremium: m.is_premium as boolean,
  };
}
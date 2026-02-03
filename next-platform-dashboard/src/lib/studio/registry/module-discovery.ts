/**
 * DRAMAC Studio Module Discovery Service
 * 
 * Server-side functions to discover installed modules for a site.
 * Queries site_module_installations and modules_v2 tables.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import type { InstalledModuleInfo } from "@/types/studio-module";

// =============================================================================
// MAIN DISCOVERY FUNCTION
// =============================================================================

/**
 * Get installed modules for a site
 * 
 * Queries site_module_installations table and joins with modules_v2 for module info.
 */
export async function getInstalledModulesForSite(
  siteId: string
): Promise<InstalledModuleInfo[]> {
  const supabase = await createClient();
  
  // Query site_module_installations with module details from modules_v2
  // The relationship is: site_module_installations.module_id -> modules_v2.id
  const { data, error } = await supabase
    .from("site_module_installations")
    .select(`
      id,
      module_id,
      is_enabled,
      installed_at,
      settings
    `)
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (error) {
    console.error("[ModuleDiscovery] Failed to fetch installed modules:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Fetch module details from modules_v2
  const moduleIds = data.map(d => d.module_id);
  
  const { data: modulesData, error: modulesError } = await supabase
    .from("modules_v2")
    .select(`
      id,
      name,
      slug,
      current_version,
      category,
      icon,
      status
    `)
    .in("id", moduleIds);

  if (modulesError) {
    console.error("[ModuleDiscovery] Failed to fetch module details:", modulesError);
    return [];
  }

  // Create a map for quick lookup
  const moduleMap = new Map(modulesData?.map(m => [m.id, m]) || []);

  // Transform to InstalledModuleInfo
  const modules: InstalledModuleInfo[] = [];

  for (const row of data) {
    const mod = moduleMap.get(row.module_id);
    
    if (!mod) {
      console.warn(`[ModuleDiscovery] Module ${row.module_id} not found in modules_v2`);
      continue;
    }

    // Only include published/active modules
    if (mod.status !== "published" && mod.status !== "active") {
      continue;
    }

    modules.push({
      id: mod.id,
      name: mod.name,
      slug: mod.slug,
      status: row.is_enabled ? "active" : "inactive",
      version: mod.current_version || "1.0.0",
      category: mod.category,
      icon: mod.icon || undefined,
      // Assume all modules with known slugs have Studio components
      hasStudioComponents: KNOWN_MODULE_SLUGS.includes(mod.slug),
      installationId: row.id,
    });
  }

  return modules;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a specific module is installed on a site
 */
export async function isModuleInstalled(
  siteId: string,
  moduleId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("site_module_installations")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .eq("is_enabled", true);

  if (error) {
    console.error("[ModuleDiscovery] Failed to check module installation:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Get module info by ID from modules_v2
 */
export async function getModuleInfo(
  moduleId: string
): Promise<InstalledModuleInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modules_v2")
    .select(`
      id,
      name,
      slug,
      current_version,
      category,
      icon,
      status
    `)
    .eq("id", moduleId)
    .single();

  if (error || !data) {
    console.error("[ModuleDiscovery] Failed to get module info:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    status: "active", // Default since we're fetching by ID
    version: data.current_version || "1.0.0",
    category: data.category,
    icon: data.icon || undefined,
    hasStudioComponents: KNOWN_MODULE_SLUGS.includes(data.slug),
  };
}

/**
 * Get module info by slug from modules_v2
 */
export async function getModuleInfoBySlug(
  slug: string
): Promise<InstalledModuleInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modules_v2")
    .select(`
      id,
      name,
      slug,
      current_version,
      category,
      icon,
      status
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("[ModuleDiscovery] Failed to get module info by slug:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    status: "active",
    version: data.current_version || "1.0.0",
    category: data.category,
    icon: data.icon || undefined,
    hasStudioComponents: KNOWN_MODULE_SLUGS.includes(data.slug),
  };
}

// =============================================================================
// KNOWN MODULES
// =============================================================================

/**
 * Known module slugs that have Studio component exports
 * These modules have components defined in src/modules/[slug]/studio/
 */
export const KNOWN_MODULE_SLUGS: string[] = [
  "ecommerce",
  "booking",
  "crm",
  "automation",
  "social-media",
];

/**
 * Get module import path from slug
 * Used for dynamic imports of module Studio exports
 */
export function getModuleImportPath(slug: string): string {
  // Local modules are in src/modules/
  return `@/modules/${slug}/studio`;
}

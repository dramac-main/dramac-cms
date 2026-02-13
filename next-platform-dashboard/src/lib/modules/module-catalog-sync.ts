"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/permissions";

export interface SyncResult {
  success: boolean;
  moduleId?: string;
  catalogModuleId?: string;
  action?: "created" | "updated";
  error?: string;
}

export interface BulkSyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  details: Array<{
    moduleId: string;
    name: string;
    action: "created" | "updated" | "failed";
    error?: string;
  }>;
}

/**
 * Sync a published studio module to the modules_v2 catalog table.
 * Called automatically on production deployment.
 * 
 * This bridges the gap between Module Studio (module_source) and 
 * the marketplace/portal (modules_v2).
 */
export async function syncStudioModuleToCatalog(
  studioModuleId: string
): Promise<SyncResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    // Get studio module data
    const { data: studioModule, error: fetchError } = await db
      .from("module_source")
      .select("*")
      .eq("module_id", studioModuleId)
      .eq("status", "published")
      .single();

    if (fetchError || !studioModule) {
      return { 
        success: false, 
        error: fetchError?.message || "Studio module not found or not published" 
      };
    }

    // Check if already exists in modules_v2 table by slug
    const { data: existingBySlug } = await db
      .from("modules_v2")
      .select("id")
      .eq("slug", studioModule.slug)
      .single();

    // Also check by studio_module_id for existing sync
    const { data: existingByStudioId } = await db
      .from("modules_v2")
      .select("id")
      .eq("studio_module_id", studioModule.id)
      .single();

    const existingModule = existingBySlug || existingByStudioId;

    // Build the catalog module data
    const moduleData = {
      // Identity
      slug: studioModule.slug,
      name: studioModule.name,
      description: studioModule.description || "",
      long_description: studioModule.long_description || studioModule.description || "",
      icon: studioModule.icon || "📦",
      
      // Classification
      category: studioModule.category || "other",
      tags: studioModule.tags || [],
      
      // Installation level - Studio modules are site-level by default
      install_level: "site",
      
      // Version
      current_version: studioModule.published_version || studioModule.latest_version || "1.0.0",
      studio_version: studioModule.published_version || studioModule.latest_version || "1.0.0",
      
      // Studio-specific fields
      source: "studio",
      studio_module_id: studioModule.id,
      render_code: studioModule.render_code,
      styles: studioModule.styles || "",
      
      // Settings
      settings_schema: studioModule.settings_schema || {},
      default_settings: studioModule.default_settings || {},
      
      // Pricing from tier
      pricing_type: getPricingType(studioModule.pricing_tier),
      wholesale_price_monthly: getPriceFromTier(studioModule.pricing_tier),
      wholesale_price_yearly: getYearlyPriceFromTier(studioModule.pricing_tier),
      
      // Status - active means visible in marketplace
      status: "active",
      is_featured: false,
      is_premium: studioModule.pricing_tier !== "free",
      
      // Metadata
      author_name: "DRAMAC",
      author_verified: true,
      features: studioModule.features || [],
      
      updated_at: new Date().toISOString(),
    };

    if (existingModule) {
      // Update existing catalog entry
      const { error: updateError } = await db
        .from("modules_v2")
        .update(moduleData)
        .eq("id", existingModule.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Update the module_source with catalog reference
      await db
        .from("module_source")
        .update({
          catalog_module_id: existingModule.id,
          catalog_synced_at: new Date().toISOString(),
        })
        .eq("id", studioModule.id);

      console.log(`[CatalogSync] Updated module ${studioModule.name} in catalog`);

      return { 
        success: true, 
        moduleId: studioModuleId,
        catalogModuleId: existingModule.id, 
        action: "updated" 
      };
    } else {
      // Create new catalog entry
      const { data: newModule, error: insertError } = await db
        .from("modules_v2")
        .insert({
          ...moduleData,
          created_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Update the module_source with catalog reference
      await db
        .from("module_source")
        .update({
          catalog_module_id: newModule.id,
          catalog_synced_at: new Date().toISOString(),
        })
        .eq("id", studioModule.id);

      console.log(`[CatalogSync] Created module ${studioModule.name} in catalog`);

      return { 
        success: true, 
        moduleId: studioModuleId,
        catalogModuleId: newModule.id, 
        action: "created" 
      };
    }
  } catch (error) {
    console.error("[CatalogSync] Error syncing module:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error during sync" 
    };
  }
}

/**
 * Remove/deprecate a module from the catalog.
 * Sets is_active to false rather than deleting to preserve history.
 */
export async function removeFromCatalog(slug: string): Promise<SyncResult> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data: module, error: fetchError } = await db
      .from("modules_v2")
      .select("id, name")
      .eq("slug", slug)
      .eq("source", "studio")
      .single();

    if (fetchError || !module) {
      return { success: false, error: "Module not found or not a studio module" };
    }

    const { error } = await db
      .from("modules_v2")
      .update({ 
        status: "deprecated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", module.id);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log(`[CatalogSync] Deprecated module ${module.name} from catalog`);
    return { success: true, catalogModuleId: module.id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Sync ALL published studio modules to the catalog (bulk operation).
 * Useful for initial migration or recovery.
 */
export async function syncAllStudioModules(): Promise<BulkSyncResult> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { 
      success: false, 
      synced: 0, 
      failed: 0, 
      errors: ["Super admin required"],
      details: []
    };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    // Get all published studio modules
    const { data: publishedModules, error } = await db
      .from("module_source")
      .select("module_id, name")
      .eq("status", "published");

    if (error || !publishedModules) {
      return { 
        success: false, 
        synced: 0, 
        failed: 0, 
        errors: [error?.message || "Failed to fetch published modules"],
        details: []
      };
    }

    if (publishedModules.length === 0) {
      return {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
        details: []
      };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];
    const details: BulkSyncResult["details"] = [];

    // Process each module
    for (const mod of publishedModules) {
      const result = await syncStudioModuleToCatalog(mod.module_id);
      
      if (result.success) {
        synced++;
        details.push({
          moduleId: mod.module_id,
          name: mod.name,
          action: result.action || "updated"
        });
      } else {
        failed++;
        const errorMsg = `${mod.name} (${mod.module_id}): ${result.error}`;
        errors.push(errorMsg);
        details.push({
          moduleId: mod.module_id,
          name: mod.name,
          action: "failed",
          error: result.error
        });
      }
    }

    console.log(`[CatalogSync] Bulk sync complete: ${synced} synced, ${failed} failed`);

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
      details
    };
  } catch (error) {
    return { 
      success: false, 
      synced: 0, 
      failed: 0, 
      errors: [error instanceof Error ? error.message : "Unknown error"],
      details: []
    };
  }
}

/**
 * Check if a specific module needs syncing.
 * Returns true if the studio module is published but not synced or outdated.
 */
export async function moduleNeedsSync(studioModuleId: string): Promise<{
  needsSync: boolean;
  reason?: string;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data: studioModule, error } = await db
      .from("module_source")
      .select("id, status, published_version, updated_at, catalog_synced_at, catalog_module_id")
      .eq("module_id", studioModuleId)
      .single();

    if (error || !studioModule) {
      return { needsSync: false, reason: "Module not found" };
    }

    // Not published = no sync needed
    if (studioModule.status !== "published") {
      return { needsSync: false, reason: "Module not published" };
    }

    // Never synced
    if (!studioModule.catalog_synced_at || !studioModule.catalog_module_id) {
      return { needsSync: true, reason: "Never synced to catalog" };
    }

    // Check if updated since last sync
    const lastUpdate = new Date(studioModule.updated_at);
    const lastSync = new Date(studioModule.catalog_synced_at);
    
    if (lastUpdate > lastSync) {
      return { needsSync: true, reason: "Updated since last sync" };
    }

    return { needsSync: false };
  } catch (_error) {
    return { needsSync: false, reason: "Error checking sync status" };
  }
}

/**
 * Get sync status for all studio modules.
 */
export async function getSyncStatus(): Promise<{
  total: number;
  synced: number;
  needsSync: number;
  unpublished: number;
  modules: Array<{
    moduleId: string;
    name: string;
    status: string;
    synced: boolean;
    lastSynced?: string;
  }>;
}> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { total: 0, synced: 0, needsSync: 0, unpublished: 0, modules: [] };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data: modules, error } = await db
      .from("module_source")
      .select("module_id, name, status, catalog_synced_at, catalog_module_id, updated_at")
      .order("name");

    if (error || !modules) {
      return { total: 0, synced: 0, needsSync: 0, unpublished: 0, modules: [] };
    }

    let synced = 0;
    let needsSync = 0;
    let unpublished = 0;

    const moduleList = modules.map((m: Record<string, unknown>) => {
      const isPublished = m.status === "published";
      const isSynced = !!m.catalog_synced_at && !!m.catalog_module_id;
      const isOutdated = isSynced && new Date(m.updated_at as string) > new Date(m.catalog_synced_at as string);
      
      if (!isPublished) {
        unpublished++;
      } else if (isSynced && !isOutdated) {
        synced++;
      } else {
        needsSync++;
      }

      return {
        moduleId: m.module_id as string,
        name: m.name as string,
        status: m.status as string,
        synced: isSynced && !isOutdated,
        lastSynced: m.catalog_synced_at as string | undefined
      };
    });

    return {
      total: modules.length,
      synced,
      needsSync,
      unpublished,
      modules: moduleList
    };
  } catch (_error) {
    return { total: 0, synced: 0, needsSync: 0, unpublished: 0, modules: [] };
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Convert pricing tier to pricing type for modules_v2
 */
function getPricingType(tier: string | null): string {
  if (!tier || tier === "free") return "free";
  return "monthly"; // Studio modules use monthly subscription by default
}

/**
 * Convert pricing tier to wholesale monthly price in cents
 */
function getPriceFromTier(tier: string | null): number {
  const tierPrices: Record<string, number> = {
    free: 0,
    starter: 999,      // $9.99/month
    pro: 2499,         // $24.99/month
    enterprise: 9999,  // $99.99/month
  };
  return tierPrices[tier || "free"] || 0;
}

/**
 * Convert pricing tier to wholesale yearly price in cents (with discount)
 */
function getYearlyPriceFromTier(tier: string | null): number {
  const monthlyPrice = getPriceFromTier(tier);
  // 2 months free on yearly (10 months worth)
  return monthlyPrice * 10;
}

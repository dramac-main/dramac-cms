"use server";

import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/permissions";

export interface SyncResult {
  success: boolean;
  moduleId?: string;
  modulesV2Id?: string;
  error?: string;
  action: "created" | "updated" | "skipped";
}

export interface BulkSyncResult {
  success: boolean;
  results: SyncResult[];
  summary: { created: number; updated: number; skipped: number; errors: number };
}

/**
 * Sync a published module_source to modules_v2 for marketplace visibility.
 * This is the core function that bridges Module Studio → Marketplace.
 */
export async function syncModuleToMarketplace(
  moduleSourceId: string
): Promise<SyncResult> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin required", action: "skipped" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Get the module_source record
  const { data: source, error: sourceError } = await db
    .from("module_source")
    .select("*")
    .eq("id", moduleSourceId)
    .single();

  if (sourceError || !source) {
    return { success: false, error: "Module source not found", action: "skipped" };
  }

  // 2. Only sync published modules
  if (source.status !== "published") {
    return {
      success: false,
      error: "Only published modules can be synced",
      action: "skipped",
    };
  }

  // 3. Check if already exists in modules_v2
  const { data: existing } = await db
    .from("modules_v2")
    .select("id")
    .eq("studio_module_id", source.id)
    .single();

  // 4. Map module_source to modules_v2 schema
  const pricing = mapPricingTier(
    source.pricing_tier,
    source.wholesale_price_monthly,
    source.suggested_retail_monthly
  );

  const moduleData = {
    studio_module_id: source.id,
    slug: source.slug,
    name: source.name,
    description: source.description || "",
    long_description: source.long_description || source.description || "",
    icon: source.icon || "📦",
    category: source.category || "other",
    tags: source.tags || [],

    // Version
    current_version: source.published_version || source.latest_version || "1.0.0",
    studio_version: source.published_version || source.latest_version || "1.0.0",

    // Pricing
    pricing_type: pricing.pricingType,
    wholesale_price_monthly: pricing.wholesalePriceMonthly,
    wholesale_price_yearly: pricing.wholesalePriceYearly,

    // Features from settings or explicit features field
    features: source.features || source.default_settings?.features || [],

    // Render configuration - critical for rendering
    render_code: source.render_code,
    settings_schema: source.settings_schema || {},
    styles: source.styles || "",
    default_settings: source.default_settings || {},

    // Status
    status: "active",
    is_featured: false,
    is_premium: source.pricing_tier !== "free",

    // Metadata
    install_level: source.install_level || "site",
    source: "studio", // Mark as studio-created

    // Author
    author_name: "DRAMAC Studio",
    author_verified: true,

    updated_at: new Date().toISOString(),
  };

  if (existing) {
    // Update existing
    const { error: updateError } = await db
      .from("modules_v2")
      .update(moduleData)
      .eq("id", existing.id);

    if (updateError) {
      return { success: false, error: updateError.message, action: "skipped" };
    }

    // Update module_source with sync info
    await db
      .from("module_source")
      .update({
        catalog_module_id: existing.id,
        catalog_synced_at: new Date().toISOString(),
      })
      .eq("id", source.id);

    return {
      success: true,
      moduleId: source.module_id,
      modulesV2Id: existing.id,
      action: "updated",
    };
  } else {
    // Create new
    const { data: created, error: createError } = await db
      .from("modules_v2")
      .insert({
        ...moduleData,
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      return { success: false, error: createError.message, action: "skipped" };
    }

    // Update module_source with sync info
    await db
      .from("module_source")
      .update({
        catalog_module_id: created.id,
        catalog_synced_at: new Date().toISOString(),
      })
      .eq("id", source.id);

    return {
      success: true,
      moduleId: source.module_id,
      modulesV2Id: created.id,
      action: "created",
    };
  }
}

/**
 * Sync ALL published modules to marketplace.
 * Useful for initial migration or recovery operations.
 */
export async function syncAllPublishedModules(): Promise<BulkSyncResult> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return {
      success: false,
      results: [],
      summary: { created: 0, updated: 0, skipped: 0, errors: 1 },
    };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get all published modules
  const { data: publishedModules, error } = await db
    .from("module_source")
    .select("id, module_id, name")
    .eq("status", "published");

  if (error || !publishedModules) {
    return {
      success: false,
      results: [],
      summary: { created: 0, updated: 0, skipped: 0, errors: 1 },
    };
  }

  const results: SyncResult[] = [];
  const summary = { created: 0, updated: 0, skipped: 0, errors: 0 };

  for (const mod of publishedModules) {
    const result = await syncModuleToMarketplace(mod.id);
    results.push(result);

    if (result.success) {
      if (result.action === "created") summary.created++;
      if (result.action === "updated") summary.updated++;
    } else {
      if (result.action === "skipped") summary.skipped++;
      else summary.errors++;
    }
  }

  console.log(
    `[ModuleSyncService] Bulk sync complete: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped, ${summary.errors} errors`
  );

  return { success: true, results, summary };
}

/**
 * Remove a module from marketplace when unpublished.
 * Sets status to deprecated rather than deleting to preserve history.
 */
export async function unsyncModuleFromMarketplace(
  moduleSourceId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Soft-delete by marking deprecated (preserve subscription history)
  const { error } = await db
    .from("modules_v2")
    .update({
      status: "deprecated",
      updated_at: new Date().toISOString(),
    })
    .eq("studio_module_id", moduleSourceId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================
// Helper Functions
// ============================================================

interface PricingResult {
  pricingType: string;
  wholesalePriceMonthly: number;
  wholesalePriceYearly: number;
}

/**
 * Map pricing tier to actual prices
 */
function mapPricingTier(
  tier: string | null,
  wholesalePrice?: number | null,
  _suggestedRetail?: number | null
): PricingResult {
  // If explicit prices provided, use them
  if (wholesalePrice !== null && wholesalePrice !== undefined) {
    return {
      pricingType: wholesalePrice === 0 ? "free" : "monthly",
      wholesalePriceMonthly: wholesalePrice,
      wholesalePriceYearly: wholesalePrice * 10, // 2 months free on yearly
    };
  }

  // Otherwise map from tier
  const tierMap: Record<string, { wholesale: number; retail: number }> = {
    free: { wholesale: 0, retail: 0 },
    starter: { wholesale: 999, retail: 1499 }, // $9.99 wholesale, K14.99 retail
    pro: { wholesale: 2499, retail: 3999 }, // $24.99 wholesale, K39.99 retail
    enterprise: { wholesale: 9999, retail: 14999 }, // $99.99 wholesale, K149.99 retail
  };

  const prices = tierMap[tier || "free"] || tierMap["free"];

  return {
    pricingType: prices.wholesale === 0 ? "free" : "monthly",
    wholesalePriceMonthly: prices.wholesale,
    wholesalePriceYearly: prices.wholesale * 10,
  };
}

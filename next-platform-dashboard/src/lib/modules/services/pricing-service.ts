"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  WholesalePricing,
  AgencyModulePricing,
  ClientModulePricing,
  MarkupType,
  MarkupConfig,
  BillingStatus,
} from "../types/module-pricing";
import type { SupabaseClient } from "@supabase/supabase-js";

// Note: Using AnyClient type alias for new module tables.
// Once Supabase types are regenerated with the new schema,
// replace AnyClient with proper SupabaseClient type.

// Temporary type alias until types are regenerated
type AnyClient = SupabaseClient<any, "public", any>;

// =============================================================
// TYPES
// =============================================================

export interface SetWholesalePriceParams {
  moduleId: string;
  wholesalePriceMonthly?: number;
  wholesalePriceYearly?: number;
  wholesalePriceOneTime?: number;
  pricingType?: "free" | "monthly" | "yearly" | "one_time";
  suggestedRetailMonthly?: number;
  suggestedRetailYearly?: number;
  lemonProductId?: string;
  lemonVariantMonthlyId?: string;
  lemonVariantYearlyId?: string;
  lemonVariantOneTimeId?: string;
}

export interface SetMarkupParams {
  agencyId: string;
  moduleId: string;
  markupType: MarkupType;
  markupPercentage?: number;
  markupFixedAmount?: number;
  customPriceMonthly?: number;
  customPriceYearly?: number;
}

// =============================================================
// SUPER ADMIN FUNCTIONS
// =============================================================

/**
 * Get all wholesale pricing (Super Admin view)
 */
export async function getAllWholesalePricing(): Promise<WholesalePricing[]> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  const { data, error } = await db
    .from("modules_v2")
    .select(
      `
      id, name, slug,
      wholesale_price_monthly, wholesale_price_yearly, wholesale_price_one_time,
      pricing_type, suggested_retail_monthly, suggested_retail_yearly,
      lemon_product_id, lemon_variant_monthly_id, lemon_variant_yearly_id, lemon_variant_one_time_id
    `
    )
    .eq("status", "active")
    .order("name");

  if (error) {
    console.error("[PricingService] Get wholesale error:", error);
    return [];
  }

  return (data || []).map((m: Record<string, unknown>) => ({
    moduleId: m.id as string,
    moduleName: m.name as string,
    moduleSlug: m.slug as string,
    wholesalePriceMonthly: (m.wholesale_price_monthly as number) || 0,
    wholesalePriceYearly: (m.wholesale_price_yearly as number) || 0,
    wholesalePriceOneTime: (m.wholesale_price_one_time as number) || 0,
    pricingType: (m.pricing_type || "free") as WholesalePricing["pricingType"],
    suggestedRetailMonthly:
      (m.suggested_retail_monthly as number) || ((m.wholesale_price_monthly as number) || 0) * 2,
    suggestedRetailYearly:
      (m.suggested_retail_yearly as number) || ((m.wholesale_price_yearly as number) || 0) * 2,
    lemonProductId: m.lemon_product_id as string | null,
    lemonVariantMonthlyId: m.lemon_variant_monthly_id as string | null,
    lemonVariantYearlyId: m.lemon_variant_yearly_id as string | null,
    lemonVariantOneTimeId: m.lemon_variant_one_time_id as string | null,
  }));
}

/**
 * Get wholesale pricing for a single module
 */
export async function getModuleWholesalePricing(
  moduleId: string
): Promise<WholesalePricing | null> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  const { data, error } = await db
    .from("modules_v2")
    .select(
      `
      id, name, slug,
      wholesale_price_monthly, wholesale_price_yearly, wholesale_price_one_time,
      pricing_type, suggested_retail_monthly, suggested_retail_yearly,
      lemon_product_id, lemon_variant_monthly_id, lemon_variant_yearly_id, lemon_variant_one_time_id
    `
    )
    .eq("id", moduleId)
    .single();

  if (error || !data) {
    console.error("[PricingService] Get module pricing error:", error);
    return null;
  }

  return {
    moduleId: data.id,
    moduleName: data.name,
    moduleSlug: data.slug,
    wholesalePriceMonthly: data.wholesale_price_monthly || 0,
    wholesalePriceYearly: data.wholesale_price_yearly || 0,
    wholesalePriceOneTime: data.wholesale_price_one_time || 0,
    pricingType: (data.pricing_type || "free") as WholesalePricing["pricingType"],
    suggestedRetailMonthly:
      data.suggested_retail_monthly || (data.wholesale_price_monthly || 0) * 2,
    suggestedRetailYearly:
      data.suggested_retail_yearly || (data.wholesale_price_yearly || 0) * 2,
    lemonProductId: data.lemon_product_id,
    lemonVariantMonthlyId: data.lemon_variant_monthly_id,
    lemonVariantYearlyId: data.lemon_variant_yearly_id,
    lemonVariantOneTimeId: data.lemon_variant_one_time_id,
  };
}

/**
 * Set wholesale price for a module (Super Admin)
 */
export async function setWholesalePrice(
  params: SetWholesalePriceParams
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Only update fields that are provided
  if (params.wholesalePriceMonthly !== undefined) {
    updateData.wholesale_price_monthly = params.wholesalePriceMonthly;
  }
  if (params.wholesalePriceYearly !== undefined) {
    updateData.wholesale_price_yearly = params.wholesalePriceYearly;
  }
  if (params.wholesalePriceOneTime !== undefined) {
    updateData.wholesale_price_one_time = params.wholesalePriceOneTime;
  }
  if (params.pricingType !== undefined) {
    updateData.pricing_type = params.pricingType;
  }
  if (params.suggestedRetailMonthly !== undefined) {
    updateData.suggested_retail_monthly = params.suggestedRetailMonthly;
  }
  if (params.suggestedRetailYearly !== undefined) {
    updateData.suggested_retail_yearly = params.suggestedRetailYearly;
  }
  if (params.lemonProductId !== undefined) {
    updateData.lemon_product_id = params.lemonProductId;
  }
  if (params.lemonVariantMonthlyId !== undefined) {
    updateData.lemon_variant_monthly_id = params.lemonVariantMonthlyId;
  }
  if (params.lemonVariantYearlyId !== undefined) {
    updateData.lemon_variant_yearly_id = params.lemonVariantYearlyId;
  }
  if (params.lemonVariantOneTimeId !== undefined) {
    updateData.lemon_variant_one_time_id = params.lemonVariantOneTimeId;
  }

  const { error } = await db
    .from("modules_v2")
    .update(updateData)
    .eq("id", params.moduleId);

  if (error) {
    console.error("[PricingService] Set wholesale error:", error);
    return { success: false, error: "Failed to update pricing" };
  }

  return { success: true };
}

// =============================================================
// AGENCY FUNCTIONS
// =============================================================

/**
 * Get agency's module pricing configuration
 */
export async function getAgencyModulePricing(
  agencyId: string
): Promise<AgencyModulePricing[]> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  // Get all active modules
  const { data: modules, error: modulesError } = await db
    .from("modules_v2")
    .select("id, name, slug, wholesale_price_monthly, wholesale_price_yearly, pricing_type")
    .eq("status", "active")
    .order("name");

  if (modulesError || !modules) {
    console.error("[PricingService] Get modules error:", modulesError);
    return [];
  }

  // Get agency's subscriptions
  const { data: subscriptions } = await db
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", agencyId);

  const subMap = new Map(
    (subscriptions || []).map((s: Record<string, unknown>) => [s.module_id, s])
  );

  return modules.map((m: Record<string, unknown>) => {
    const sub = subMap.get(m.id) as Record<string, unknown> | undefined;
    const wholesaleMonthly = (m.wholesale_price_monthly as number) || 0;
    const wholesaleYearly = (m.wholesale_price_yearly as number) || 0;

    // Calculate retail based on markup
    let retailMonthly = wholesaleMonthly;
    let retailYearly = wholesaleYearly;

    if (sub) {
      const config: MarkupConfig = {
        markupType: sub.markup_type as MarkupType,
        markupPercentage: sub.markup_percentage as number | undefined,
        markupFixedAmount: sub.markup_fixed_amount as number | undefined,
        customPriceMonthly: sub.custom_price_monthly as number | undefined,
        customPriceYearly: sub.custom_price_yearly as number | undefined,
      };

      // Use cached values if available, otherwise calculate
      if (sub.retail_price_monthly_cached) {
        retailMonthly = sub.retail_price_monthly_cached as number;
      } else {
        retailMonthly = calculateRetailPriceInternal(wholesaleMonthly, config);
      }

      if (sub.retail_price_yearly_cached) {
        retailYearly = sub.retail_price_yearly_cached as number;
      } else {
        retailYearly = calculateRetailPriceInternal(wholesaleYearly, {
          ...config,
          customPriceMonthly: config.customPriceYearly,
        });
      }
    } else {
      // Default: 100% markup for non-subscribed modules
      retailMonthly = wholesaleMonthly * 2;
      retailYearly = wholesaleYearly * 2;
    }

    const profitMonthly = retailMonthly - wholesaleMonthly;
    const profitYearly = retailYearly - wholesaleYearly;

    return {
      moduleId: m.id as string,
      moduleName: m.name as string,
      moduleSlug: m.slug as string,
      markupType: ((sub?.markup_type as string) || "percentage") as MarkupType,
      markupPercentage: (sub?.markup_percentage as number) ?? 100,
      markupFixedAmount: (sub?.markup_fixed_amount as number) ?? 0,
      customPriceMonthly: (sub?.custom_price_monthly as number) ?? null,
      customPriceYearly: (sub?.custom_price_yearly as number) ?? null,
      wholesalePriceMonthly: wholesaleMonthly,
      wholesalePriceYearly: wholesaleYearly,
      retailPriceMonthly: retailMonthly,
      retailPriceYearly: retailYearly,
      profitMonthly,
      profitYearly,
      profitMarginMonthly: retailMonthly > 0 ? Math.round((profitMonthly / retailMonthly) * 100) : 0,
      profitMarginYearly: retailYearly > 0 ? Math.round((profitYearly / retailYearly) * 100) : 0,
      isSubscribed: !!sub,
      subscriptionStatus: (sub?.status as BillingStatus | null) || null,
      lemonSubscriptionId: (sub?.lemon_subscription_id as string) || null,
      currentInstallations: (sub?.current_installations as number) ?? 0,
      maxInstallations: (sub?.max_installations as number) ?? null,
    };
  });
}

/**
 * Get pricing for a specific module for an agency
 */
export async function getAgencyModulePricingById(
  agencyId: string,
  moduleId: string
): Promise<AgencyModulePricing | null> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  // Get module
  const { data: module } = await db
    .from("modules_v2")
    .select("id, name, slug, wholesale_price_monthly, wholesale_price_yearly, pricing_type")
    .eq("id", moduleId)
    .single();

  if (!module) return null;

  // Get subscription
  const { data: sub } = await db
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  const wholesaleMonthly = module.wholesale_price_monthly || 0;
  const wholesaleYearly = module.wholesale_price_yearly || 0;

  let retailMonthly = wholesaleMonthly;
  let retailYearly = wholesaleYearly;

  if (sub) {
    retailMonthly = sub.retail_price_monthly_cached || calculateRetailPriceInternal(wholesaleMonthly, {
      markupType: sub.markup_type as MarkupType,
      markupPercentage: sub.markup_percentage,
      markupFixedAmount: sub.markup_fixed_amount,
      customPriceMonthly: sub.custom_price_monthly,
    });
    retailYearly = sub.retail_price_yearly_cached || calculateRetailPriceInternal(wholesaleYearly, {
      markupType: sub.markup_type as MarkupType,
      markupPercentage: sub.markup_percentage,
      markupFixedAmount: sub.markup_fixed_amount,
      customPriceMonthly: sub.custom_price_yearly,
    });
  } else {
    retailMonthly = wholesaleMonthly * 2;
    retailYearly = wholesaleYearly * 2;
  }

  const profitMonthly = retailMonthly - wholesaleMonthly;
  const profitYearly = retailYearly - wholesaleYearly;

  return {
    moduleId: module.id,
    moduleName: module.name,
    moduleSlug: module.slug,
    markupType: (sub?.markup_type || "percentage") as MarkupType,
    markupPercentage: sub?.markup_percentage ?? 100,
    markupFixedAmount: sub?.markup_fixed_amount ?? 0,
    customPriceMonthly: sub?.custom_price_monthly ?? null,
    customPriceYearly: sub?.custom_price_yearly ?? null,
    wholesalePriceMonthly: wholesaleMonthly,
    wholesalePriceYearly: wholesaleYearly,
    retailPriceMonthly: retailMonthly,
    retailPriceYearly: retailYearly,
    profitMonthly,
    profitYearly,
    profitMarginMonthly: retailMonthly > 0 ? Math.round((profitMonthly / retailMonthly) * 100) : 0,
    profitMarginYearly: retailYearly > 0 ? Math.round((profitYearly / retailYearly) * 100) : 0,
    isSubscribed: !!sub,
    subscriptionStatus: sub?.status || null,
    lemonSubscriptionId: sub?.lemon_subscription_id || null,
    currentInstallations: sub?.current_installations ?? 0,
    maxInstallations: sub?.max_installations ?? null,
  };
}

/**
 * Set agency's markup for a module
 */
export async function setAgencyModuleMarkup(
  params: SetMarkupParams
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  // Build the upsert data
  const upsertData: Record<string, unknown> = {
    agency_id: params.agencyId,
    module_id: params.moduleId,
    markup_type: params.markupType,
    markup_percentage: params.markupPercentage ?? 100,
    markup_fixed_amount: params.markupFixedAmount ?? 0,
    updated_at: new Date().toISOString(),
  };

  if (params.customPriceMonthly !== undefined) {
    upsertData.custom_price_monthly = params.customPriceMonthly;
  }
  if (params.customPriceYearly !== undefined) {
    upsertData.custom_price_yearly = params.customPriceYearly;
  }

  const { error } = await db
    .from("agency_module_subscriptions")
    .upsert(upsertData, { onConflict: "agency_id,module_id" });

  if (error) {
    console.error("[PricingService] Set markup error:", error);
    return { success: false, error: "Failed to update markup" };
  }

  return { success: true };
}

// =============================================================
// CLIENT PRICING FUNCTIONS
// =============================================================

/**
 * Get module price for a client (shows agency's retail price)
 */
export async function getModulePriceForClient(
  clientId: string,
  moduleId: string
): Promise<ClientModulePricing | null> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  // Get client's agency
  const { data: client } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", clientId)
    .single();

  if (!client) return null;

  // Get module wholesale price
  const { data: module } = await db
    .from("modules_v2")
    .select("id, name, slug, wholesale_price_monthly, pricing_type, status")
    .eq("id", moduleId)
    .single();

  if (!module || module.status !== "active") return null;

  // Get agency's markup
  const { data: subscription } = await db
    .from("agency_module_subscriptions")
    .select(
      "markup_type, markup_percentage, markup_fixed_amount, custom_price_monthly, retail_price_monthly_cached, status"
    )
    .eq("agency_id", client.agency_id)
    .eq("module_id", moduleId)
    .single();

  const wholesaleCents = module.wholesale_price_monthly || 0;

  // If agency hasn't subscribed, module isn't available to client
  if (!subscription || subscription.status !== "active") {
    return {
      moduleId,
      moduleName: module.name,
      moduleSlug: module.slug,
      wholesalePriceCents: wholesaleCents,
      retailPriceCents: wholesaleCents * 2, // Suggested price
      agencyProfitCents: wholesaleCents,
      billingCycle: (module.pricing_type || "monthly") as ClientModulePricing["billingCycle"],
      isAvailable: false,
      unavailableReason: "This module is not available from your agency",
    };
  }

  // Use cached retail price or calculate
  const retailCents =
    subscription.retail_price_monthly_cached ||
    calculateRetailPriceInternal(wholesaleCents, {
      markupType: subscription.markup_type as MarkupType,
      markupPercentage: subscription.markup_percentage,
      markupFixedAmount: subscription.markup_fixed_amount,
      customPriceMonthly: subscription.custom_price_monthly,
    });

  return {
    moduleId,
    moduleName: module.name,
    moduleSlug: module.slug,
    wholesalePriceCents: wholesaleCents,
    retailPriceCents: retailCents,
    agencyProfitCents: retailCents - wholesaleCents,
    billingCycle: (module.pricing_type || "monthly") as ClientModulePricing["billingCycle"],
    isAvailable: true,
  };
}

/**
 * Get all available module prices for a client
 */
export async function getAllModulePricesForClient(
  clientId: string
): Promise<ClientModulePricing[]> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  // Get client's agency
  const { data: client } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", clientId)
    .single();

  if (!client) return [];

  // Get all active modules
  const { data: modules } = await db
    .from("modules_v2")
    .select("id, name, slug, wholesale_price_monthly, pricing_type")
    .eq("status", "active")
    .in("install_level", ["client", "site"]); // Only modules clients can use

  if (!modules) return [];

  // Get agency's subscriptions
  const { data: subscriptions } = await db
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", client.agency_id)
    .eq("status", "active");

  const subMap = new Map((subscriptions || []).map((s: Record<string, unknown>) => [s.module_id, s]));

  return modules.map((module: Record<string, unknown>) => {
    const sub = subMap.get(module.id) as Record<string, unknown> | undefined;
    const wholesaleCents = (module.wholesale_price_monthly as number) || 0;

    if (!sub) {
      return {
        moduleId: module.id as string,
        moduleName: module.name as string,
        moduleSlug: module.slug as string,
        wholesalePriceCents: wholesaleCents,
        retailPriceCents: wholesaleCents * 2,
        agencyProfitCents: wholesaleCents,
        billingCycle: ((module.pricing_type as string) || "monthly") as ClientModulePricing["billingCycle"],
        isAvailable: false,
        unavailableReason: "Not available from your agency",
      };
    }

    const retailCents =
      (sub.retail_price_monthly_cached as number) ||
      calculateRetailPriceInternal(wholesaleCents, {
        markupType: sub.markup_type as MarkupType,
        markupPercentage: sub.markup_percentage as number | undefined,
        markupFixedAmount: sub.markup_fixed_amount as number | undefined,
        customPriceMonthly: sub.custom_price_monthly as number | undefined,
      });

    return {
      moduleId: module.id as string,
      moduleName: module.name as string,
      moduleSlug: module.slug as string,
      wholesalePriceCents: wholesaleCents,
      retailPriceCents: retailCents,
      agencyProfitCents: retailCents - wholesaleCents,
      billingCycle: ((module.pricing_type as string) || "monthly") as ClientModulePricing["billingCycle"],
      isAvailable: true,
    };
  });
}

// =============================================================
// REVENUE CALCULATIONS
// =============================================================

/**
 * Calculate total revenue for an agency from module sales
 */
export async function calculateAgencyModuleRevenue(
  agencyId: string
): Promise<{
  totalWholesale: number;
  totalRetail: number;
  totalProfit: number;
  moduleBreakdown: Array<{
    moduleId: string;
    moduleName: string;
    installations: number;
    revenue: number;
    profit: number;
  }>;
}> {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  // Get all client installations with pricing
  const { data: clientInstalls } = await db
    .from("client_module_installations")
    .select(`
      module_id,
      price_paid,
      client:clients!inner(agency_id),
      module:modules_v2(name, wholesale_price_monthly)
    `)
    .eq("client.agency_id", agencyId)
    .eq("billing_status", "active");

  if (!clientInstalls) {
    return {
      totalWholesale: 0,
      totalRetail: 0,
      totalProfit: 0,
      moduleBreakdown: [],
    };
  }

  const moduleStats = new Map<
    string,
    { name: string; installations: number; revenue: number; wholesale: number }
  >();

  let totalWholesale = 0;
  let totalRetail = 0;

  for (const install of clientInstalls) {
    const moduleId = install.module_id;
    const revenue = install.price_paid || 0;
    // module is an object from the join
    const moduleObj = Array.isArray(install.module) ? install.module[0] : install.module;
    const moduleData = moduleObj as { name?: string; wholesale_price_monthly?: number } | undefined;
    const wholesale = moduleData?.wholesale_price_monthly || 0;
    const moduleName = moduleData?.name || "Unknown";

    totalRetail += revenue;
    totalWholesale += wholesale;

    const current = moduleStats.get(moduleId) || {
      name: moduleName,
      installations: 0,
      revenue: 0,
      wholesale: 0,
    };

    moduleStats.set(moduleId, {
      name: moduleName,
      installations: current.installations + 1,
      revenue: current.revenue + revenue,
      wholesale: current.wholesale + wholesale,
    });
  }

  const moduleBreakdown = Array.from(moduleStats.entries()).map(
    ([moduleId, stats]) => ({
      moduleId,
      moduleName: stats.name,
      installations: stats.installations,
      revenue: stats.revenue,
      profit: stats.revenue - stats.wholesale,
    })
  );

  return {
    totalWholesale,
    totalRetail,
    totalProfit: totalRetail - totalWholesale,
    moduleBreakdown,
  };
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

/**
 * Internal helper to calculate retail price (mirrors the SQL function)
 */
function calculateRetailPriceInternal(
  wholesaleCents: number,
  config: MarkupConfig
): number {
  const {
    markupType,
    markupPercentage = 100,
    markupFixedAmount = 0,
    customPriceMonthly,
  } = config;

  // Custom price overrides everything
  if (markupType === "custom" && customPriceMonthly != null) {
    return customPriceMonthly;
  }

  // Passthrough = no markup
  if (markupType === "passthrough") {
    return wholesaleCents;
  }

  // Fixed = wholesale + fixed amount
  if (markupType === "fixed") {
    return wholesaleCents + markupFixedAmount;
  }

  // Percentage (default) = wholesale + (wholesale * percentage / 100)
  return wholesaleCents + Math.round((wholesaleCents * markupPercentage) / 100);
}

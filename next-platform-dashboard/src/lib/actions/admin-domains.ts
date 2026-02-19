"use server";

// src/lib/actions/admin-domains.ts
// Super Admin Domain Platform Actions
// Platform-level pricing controls, supplier health, and revenue analytics

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { DEFAULT_CURRENCY } from "@/lib/locale-config";
import type {
  AgencyDomainPricing,
  RevenueAnalytics,
} from "@/types/domain-pricing";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

// ============================================================================
// Platform Pricing Controls (Super Admin Only)
// ============================================================================

export interface PlatformPricingConfig {
  apply_platform_markup: boolean;
  default_markup_type: "percentage" | "fixed";
  default_markup_value: number;
}

/**
 * Get the platform-level pricing configuration.
 * This is from the PLATFORM agency's agency_domain_pricing row,
 * or creates a default if none exists.
 */
export async function getPlatformPricingConfig(): Promise<{
  success: boolean;
  data?: PlatformPricingConfig;
  error?: string;
}> {
  await requireSuperAdmin();

  const admin = createAdminClient() as AnyRecord;

  // Get the platform's own agency_domain_pricing config
  // Use a well-known approach: find or create a "platform" row
  const { data: configs, error } = await admin
    .from("agency_domain_pricing")
    .select("*")
    .limit(1)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  const config = configs?.[0];

  if (!config) {
    return {
      success: true,
      data: {
        apply_platform_markup: false,
        default_markup_type: "percentage",
        default_markup_value: 0,
      },
    };
  }

  return {
    success: true,
    data: {
      apply_platform_markup: config.apply_platform_markup ?? false,
      default_markup_type: config.default_markup_type || "percentage",
      default_markup_value: config.default_markup_value ?? 0,
    },
  };
}

/**
 * Update the platform-level pricing configuration.
 * Updates ALL agency_domain_pricing rows to keep platform markup consistent.
 */
export async function updatePlatformPricingConfig(
  updates: Partial<PlatformPricingConfig>
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const admin = createAdminClient() as AnyRecord;

  try {
    // Update all agency pricing rows with the platform-level settings
    const { error } = await admin
      .from("agency_domain_pricing")
      .update({
        apply_platform_markup:
          updates.apply_platform_markup !== undefined
            ? updates.apply_platform_markup
            : undefined,
        default_markup_type: updates.default_markup_type,
        default_markup_value: updates.default_markup_value,
        updated_at: new Date().toISOString(),
      })
      .neq("agency_id", ""); // Update all rows

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/domains");
    revalidatePath("/admin/domains/pricing");
    return { success: true };
  } catch (error) {
    console.error("[Admin Domains] Update platform pricing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}

// ============================================================================
// Supplier Health Check
// ============================================================================

export interface SupplierHealthStatus {
  apiReachable: boolean;
  apiLatencyMs: number;
  accountBalance: number | null;
  balanceCurrency: string;
  pricingCacheAge: string | null;
  pricingCacheTldCount: number;
  emailPricingCacheAge: string | null;
  lastError: string | null;
}

/**
 * Check ResellerClub API health, balance, and cache freshness
 */
export async function checkSupplierHealth(): Promise<{
  success: boolean;
  data?: SupplierHealthStatus;
  error?: string;
}> {
  await requireSuperAdmin();

  const result: SupplierHealthStatus = {
    apiReachable: false,
    apiLatencyMs: 0,
    accountBalance: null,
    balanceCurrency: "USD",
    pricingCacheAge: null,
    pricingCacheTldCount: 0,
    emailPricingCacheAge: null,
    lastError: null,
  };

  try {
    const { isClientAvailable } = await import("@/lib/resellerclub/client");

    if (!isClientAvailable()) {
      result.lastError = "ResellerClub client not configured";
      return { success: true, data: result };
    }

    // Check API reachability by fetching cost pricing for .com (lightweight call)
    const start = Date.now();
    try {
      const { domainService } = await import("@/lib/resellerclub/domains");
      await domainService.getResellerCostPricing([".com"]);
      result.apiReachable = true;
      result.apiLatencyMs = Date.now() - start;
    } catch (err) {
      result.apiLatencyMs = Date.now() - start;
      result.lastError =
        err instanceof Error ? err.message : "API unreachable";
    }

    // Check balance
    try {
      const { getResellerClubClient } = await import(
        "@/lib/resellerclub/client"
      );
      const client = getResellerClubClient();
      const balanceResult = await client.getBalance();
      result.accountBalance = balanceResult.balance;
      result.balanceCurrency = balanceResult.currency;
    } catch {
      // Balance check is optional
    }

    // Check pricing cache freshness
    const admin = createAdminClient() as AnyRecord;
    const { data: cacheRows } = await admin
      .from("domain_pricing_cache")
      .select("tld, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (cacheRows && cacheRows.length > 0) {
      result.pricingCacheAge = cacheRows[0].updated_at;
    }

    const { count } = await admin
      .from("domain_pricing_cache")
      .select("*", { count: "exact", head: true });
    result.pricingCacheTldCount = count || 0;

    // Check email pricing cache
    const { data: emailCache } = await admin
      .from("email_pricing_cache")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (emailCache && emailCache.length > 0) {
      result.emailPricingCacheAge = emailCache[0].updated_at;
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("[Admin Domains] Health check error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Health check failed",
    };
  }
}

// ============================================================================
// Platform Revenue Analytics (aggregated across all agencies)
// ============================================================================

/**
 * Get platform-wide revenue analytics for domains and email
 */
export async function getPlatformRevenueAnalytics(
  period: "month" | "quarter" | "year" = "month"
): Promise<{
  success: boolean;
  data?: RevenueAnalytics & {
    agency_count: number;
    top_tlds: Array<{ tld: string; count: number; revenue: number }>;
  };
  error?: string;
}> {
  await requireSuperAdmin();

  const admin = createAdminClient() as AnyRecord;

  const now = new Date();
  let fromDate: Date;
  switch (period) {
    case "quarter":
      fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case "year":
      fromDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  try {
    // Get all billing records across ALL agencies
    const { data: records } = await admin
      .from("domain_billing_records")
      .select("*")
      .eq("status", "paid")
      .gte("paid_at", fromDate.toISOString());

    if (!records || records.length === 0) {
      return {
        success: true,
        data: {
          total_revenue: 0,
          total_cost: 0,
          total_profit: 0,
          profit_margin: 0,
          by_type: {},
          agency_count: 0,
          top_tlds: [],
        },
      };
    }

    // Aggregate
    const agencySet = new Set<string>();
    interface ByTypeEntry {
      revenue: number;
      cost: number;
      profit: number;
      count: number;
    }
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const byType: Record<string, ByTypeEntry> = {};

    for (const record of records) {
      const retail = (record.retail_amount as number) || 0;
      const wholesale = (record.wholesale_amount as number) || 0;
      const markup = (record.markup_amount as number) || 0;
      const billingType = (record.billing_type as string) || "other";
      const agencyId = record.agency_id as string;

      totalRevenue += retail;
      totalCost += wholesale;
      totalProfit += markup;
      if (agencyId) agencySet.add(agencyId);

      if (!byType[billingType]) {
        byType[billingType] = { revenue: 0, cost: 0, profit: 0, count: 0 };
      }
      byType[billingType].revenue += retail;
      byType[billingType].cost += wholesale;
      byType[billingType].profit += markup;
      byType[billingType].count += 1;
    }

    return {
      success: true,
      data: {
        total_revenue: Math.round(totalRevenue * 100) / 100,
        total_cost: Math.round(totalCost * 100) / 100,
        total_profit: Math.round(totalProfit * 100) / 100,
        profit_margin:
          totalRevenue > 0
            ? Math.round((totalProfit / totalRevenue) * 10000) / 100
            : 0,
        by_type: byType,
        agency_count: agencySet.size,
        top_tlds: [], // Could be expanded with domain join
      },
    };
  } catch (error) {
    console.error("[Admin Domains] Revenue analytics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Analytics failed",
    };
  }
}

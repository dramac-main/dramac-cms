"use server";

// src/lib/actions/domain-billing.ts
// Domain Billing & Pricing Server Actions for Phase DM-10

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { DEFAULT_CURRENCY } from '@/lib/locale-config'
import { getFallbackPrice } from '@/lib/domain-fallback-prices'
import type { 
  AgencyDomainPricing, 
  AgencyDomainPricingUpdate,
  TldPricingConfig, 
  ClientPricingTier,
  PricingCalculation,
  DomainUsageSummary,
  DomainBillingRecord,
  BillingRecordFilters,
  RevenueAnalytics,
  BillingRecordType,
} from "@/types/domain-pricing";

// Type for raw database results - tables not yet in generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

// ============================================================================
// Pricing Configuration
// ============================================================================

/**
 * Get the agency's domain pricing configuration
 */
export async function getAgencyPricingConfig(): Promise<{
  success: boolean;
  data?: Partial<AgencyDomainPricing>;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  const { data: config, error } = await supabase
    .from('agency_domain_pricing' as 'profiles') // Type workaround
    .select('*')
    .eq('agency_id', profile.agency_id)
    .single() as { data: AnyRecord | null; error: unknown };
  
  if (error && (error as { code?: string })?.code !== 'PGRST116') {
    return { success: false, error: (error as Error).message || 'Failed to fetch config' };
  }
  
  // Return default config if none exists
  if (!config) {
    return {
      success: true,
      data: {
        agency_id: profile.agency_id,
        default_markup_type: 'percentage',
        default_markup_value: 0, // 0% = use RC selling prices as-is (they already include your profit margin)
        tld_pricing: {},
        client_tiers: [],
        billing_enabled: false,
        show_wholesale_prices: false,
        paddle_product_id: null,
        paddle_price_id: null,
        custom_terms_url: null,
        custom_support_email: null,
      },
    };
  }
  
  return { 
    success: true, 
    data: {
      ...config,
      tld_pricing: (config.tld_pricing as TldPricingConfig) || {},
      client_tiers: (config.client_tiers as ClientPricingTier[]) || [],
    } as AgencyDomainPricing 
  };
}

/**
 * Update agency domain pricing configuration
 */
export async function updateAgencyPricingConfig(
  updates: AgencyDomainPricingUpdate
): Promise<{
  success: boolean;
  data?: AgencyDomainPricing;
  error?: string;
}> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  // Only admins and owners can update pricing
  if (!['owner', 'admin'].includes(profile.role || '')) {
    return { success: false, error: 'Permission denied' };
  }
  
  try {
    // Upsert config using admin client
    const adminClient = admin as SupabaseClient;
    const { data, error } = await adminClient
      .from('agency_domain_pricing')
      .upsert({
        agency_id: profile.agency_id,
        ...updates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'agency_id',
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message || 'Update failed' };
    }
    
    revalidatePath('/dashboard/domains/settings');
    revalidatePath('/dashboard/domains/settings/pricing');
    
    return { success: true, data: data as AgencyDomainPricing };
  } catch (error) {
    console.error('[Billing] Update config error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    };
  }
}

// ============================================================================
// Price Calculation
// ============================================================================

/**
 * Calculate the retail price for a domain operation
 */
export async function calculateDomainPrice(params: {
  tld: string;
  years: number;
  operation: 'register' | 'renew' | 'transfer';
  includePrivacy?: boolean;
  clientId?: string;
}): Promise<{ success: boolean; data?: PricingCalculation; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  try {
    // Get agency's ResellerClub customer ID for customer pricing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agency } = await (supabase as any)
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();
    
    const customerId = agency?.resellerclub_customer_id;
    
    // Get pricing from cache (uses customer pricing with fallback)
    let wholesalePrice: number = 0;
    let retailPrice: number = 0;
    let usedRealPricing = false;
    
    try {
      const { isClientAvailable } = await import('@/lib/resellerclub/client');
      const { pricingCacheService } = await import('@/lib/resellerclub/pricing-cache');
      
      if (isClientAvailable()) {
        // Get cached customer/selling pricing (your configured retail prices from RC panel)
        // Uses 'customer' type WITHOUT customer-id — returns default selling prices
        const sellingPriceData = await pricingCacheService.getCachedDomainPrice(
          params.tld,
          '', // No customer ID needed — API returns default selling prices
          'customer',
          24 // 24-hour cache
        );
        
        // Get cached cost pricing (wholesale)
        const costPriceData = await pricingCacheService.getCachedDomainPrice(
          params.tld,
          '', // No customer ID needed for cost pricing
          'cost',
          24
        );
        
        if (sellingPriceData && costPriceData) {
          switch (params.operation) {
            case 'register': {
              const sellingPrices = sellingPriceData.register as Record<number, number>;
              const costPrices = costPriceData.register as Record<number, number>;
              retailPrice = sellingPrices[params.years] || (sellingPrices[1] || 0) * params.years;
              wholesalePrice = costPrices[params.years] || (costPrices[1] || 0) * params.years;
              break;
            }
            case 'renew': {
              const sellingPrices = sellingPriceData.renew as Record<number, number>;
              const costPrices = costPriceData.renew as Record<number, number>;
              retailPrice = sellingPrices[params.years] || (sellingPrices[1] || 0) * params.years;
              wholesalePrice = costPrices[params.years] || (costPrices[1] || 0) * params.years;
              break;
            }
            case 'transfer':
              retailPrice = sellingPriceData.transfer;
              wholesalePrice = costPriceData.transfer;
              break;
          }
          usedRealPricing = true;
        }
      }
    } catch {
      // Fall through to fallback pricing
    }
    
    // Fallback pricing if API/cache is unavailable
    if (!usedRealPricing) {
      const fb = getFallbackPrice(params.tld);
      
      switch (params.operation) {
        case 'register': {
          wholesalePrice = fb.register[params.years] || fb.register[1] * params.years;
          retailPrice = wholesalePrice; // Will be marked up below
          break;
        }
        case 'renew': {
          wholesalePrice = fb.renew[params.years] || fb.renew[1] * params.years;
          retailPrice = wholesalePrice; // Will be marked up below
          break;
        }
        case 'transfer':
          wholesalePrice = fb.transfer;
          retailPrice = wholesalePrice; // Will be marked up below
          break;
      }
    }
    
    // Get agency pricing config
    const supabaseClient = supabase as SupabaseClient;
    const { data: config } = await supabaseClient
      .from('agency_domain_pricing')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .single();
    
    // Determine markup settings (declared at this scope so privacy calc can use them)
    let markupType = (config?.default_markup_type as string) || 'percentage';
    let markupValue = (config?.default_markup_value as number) ?? 0;
    
    // Check for TLD-specific pricing overrides
    const tldConfig = (config?.tld_pricing as TldPricingConfig)?.[params.tld];
    if (tldConfig?.enabled) {
      markupType = tldConfig.markup_type;
      markupValue = tldConfig.markup_value;
      
      // Use custom price if set
      if (markupType === 'custom') {
        const customPrices: Record<number, number> | undefined = params.operation === 'transfer' 
          ? { 1: tldConfig.custom_transfer ?? 0 }
          : params.operation === 'register'
            ? tldConfig.custom_register
            : tldConfig.custom_renew;
        
        if (customPrices && customPrices[params.years]) {
          retailPrice = customPrices[params.years];
        }
      }
    }
    
    // Pricing logic:
    // - If we have REAL pricing from RC, `retailPrice` is already the RC customer/selling
    //   price (which reflects the profit margin set in RC panel). The DRAMAC markup is
    //   applied ON TOP of that selling price as an additional layer.
    // - If using FALLBACK pricing, `retailPrice === wholesalePrice`, so we need to add
    //   at least a 30% margin to ensure profitability.
    if (markupType !== 'custom' || retailPrice === 0) {
      if (usedRealPricing) {
        // retailPrice already = RC selling price. Apply DRAMAC additional markup on top.
        switch (markupType) {
          case 'percentage':
            retailPrice = retailPrice * (1 + markupValue / 100);
            break;
          case 'fixed':
            retailPrice = retailPrice + markupValue;
            break;
        }
      } else {
        // Fallback: retailPrice === wholesalePrice, apply at least 30% or configured markup
        const effectiveMarkup = (markupType === 'percentage' && markupValue === 0) ? 30 : markupValue;
        switch (markupType) {
          case 'percentage':
            retailPrice = wholesalePrice * (1 + effectiveMarkup / 100);
            break;
          case 'fixed':
            retailPrice = wholesalePrice + (markupValue || wholesalePrice * 0.3);
            break;
          default:
            retailPrice = wholesalePrice * 1.3; // 30% default
        }
      }
    }
    
    // Round retail price
    retailPrice = Math.round(retailPrice * 100) / 100;
    
    // Apply client tier discount if applicable
    if (params.clientId && config?.client_tiers) {
      const tiers = config.client_tiers as ClientPricingTier[];
      const clientTier = tiers.find(
        (tier) => tier.client_ids?.includes(params.clientId!)
      );
      
      if (clientTier) {
        retailPrice = retailPrice * (1 - clientTier.discount_percentage / 100);
      }
    }
    
    // Calculate privacy pricing
    let privacyWholesale = 0;
    let privacyRetail = 0;
    
    if (params.includePrivacy) {
      privacyWholesale = 5 * params.years;
      // Use the same markup percentage for privacy add-on
      const privacyMarkupPct = markupType === 'percentage' ? markupValue : 30;
      privacyRetail = privacyWholesale * (1 + privacyMarkupPct / 100);
    }
    
    const result: PricingCalculation = {
      tld: params.tld,
      years: params.years,
      wholesale_price: wholesalePrice,
      retail_price: Math.round(retailPrice * 100) / 100,
      markup_amount: Math.round((retailPrice - wholesalePrice) * 100) / 100,
      markup_percentage: wholesalePrice > 0 
        ? Math.round(((retailPrice - wholesalePrice) / wholesalePrice) * 10000) / 100 
        : 0,
      privacy_wholesale: privacyWholesale,
      privacy_retail: Math.round(privacyRetail * 100) / 100,
      total_wholesale: wholesalePrice + privacyWholesale,
      total_retail: Math.round((retailPrice + privacyRetail) * 100) / 100,
      total_profit: Math.round((retailPrice - wholesalePrice + privacyRetail - privacyWholesale) * 100) / 100,
    };
    
    return { success: true, data: result };
  } catch (error) {
    console.error('[Billing] Calculate price error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Calculation failed' 
    };
  }
}

// ============================================================================
// Billing Records
// ============================================================================

/**
 * Create a new billing record for a domain operation
 */
export async function createBillingRecord(params: {
  domain_id?: string;
  billing_type: BillingRecordType;
  description: string;
  wholesale_amount: number;
  retail_amount: number;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; data?: DomainBillingRecord; error?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  const adminClient = admin as SupabaseClient;
  const { data, error } = await adminClient
    .from('domain_billing_records')
    .insert({
      agency_id: profile.agency_id,
      domain_id: params.domain_id,
      billing_type: params.billing_type,
      description: params.description,
      wholesale_amount: params.wholesale_amount,
      retail_amount: params.retail_amount,
      markup_amount: params.retail_amount - params.wholesale_amount,
      currency: DEFAULT_CURRENCY,
      status: 'pending',
      metadata: params.metadata || {},
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message || 'Failed to create record' };
  }
  
  revalidatePath('/dashboard/domains/settings');
  
  return { success: true, data: data as DomainBillingRecord };
}

/**
 * Get billing records with optional filters
 */
export async function getBillingRecords(
  filters?: BillingRecordFilters
): Promise<{ success: boolean; data: DomainBillingRecord[]; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated', data: [] };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency', data: [] };
  
  const supabaseClient = supabase as SupabaseClient;
  let query = supabaseClient
    .from('domain_billing_records')
    .select(`
      *,
      domain:domains(domain_name)
    `)
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.billing_type) {
    query = query.eq('billing_type', filters.billing_type);
  }
  
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date);
  }
  
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return { success: false, error: error.message || 'Failed to fetch records', data: [] };
  }
  
  return { success: true, data: (data || []) as DomainBillingRecord[] };
}

/**
 * Update billing record status (e.g., mark as paid)
 */
export async function updateBillingRecordStatus(
  recordId: string,
  status: 'pending' | 'paid' | 'failed' | 'refunded',
  paddleTransactionId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }
  
  if (paddleTransactionId) {
    updateData.paddle_transaction_id = paddleTransactionId;
  }
  
  const adminClient = admin as SupabaseClient;
  const { error } = await adminClient
    .from('domain_billing_records')
    .update(updateData)
    .eq('id', recordId);
  
  if (error) {
    return { success: false, error: error.message || 'Update failed' };
  }
  
  revalidatePath('/dashboard/domains/settings');
  
  return { success: true };
}

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Get usage summary for a specific month
 */
export async function getUsageSummary(
  year?: number, 
  month?: number
): Promise<{
  success: boolean;
  data?: DomainUsageSummary;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;
  
  const supabaseClient = supabase as SupabaseClient;
  const { data, error } = await supabaseClient
    .from('domain_usage_summary')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .eq('year', targetYear)
    .eq('month', targetMonth)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message || 'Failed to fetch summary' };
  }
  
  // Return empty summary if none exists
  if (!data) {
    return {
      success: true,
      data: {
        id: '',
        agency_id: profile.agency_id,
        year: targetYear,
        month: targetMonth,
        domains_registered: 0,
        domains_renewed: 0,
        domains_transferred: 0,
        email_accounts_created: 0,
        wholesale_total: 0,
        retail_total: 0,
        profit_total: 0,
      },
    };
  }
  
  return { success: true, data: data as DomainUsageSummary };
}

/**
 * Get usage history for the past X months
 */
export async function getUsageHistory(
  months: number = 12
): Promise<{
  success: boolean;
  data: DomainUsageSummary[];
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated', data: [] };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency', data: [] };
  
  const supabaseClient = supabase as SupabaseClient;
  const { data, error } = await supabaseClient
    .from('domain_usage_summary')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(months);
  
  if (error) {
    return { success: false, error: error.message || 'Failed to fetch history', data: [] };
  }
  
  return { success: true, data: (data || []) as DomainUsageSummary[] };
}

// ============================================================================
// Revenue Analytics
// ============================================================================

/**
 * Get revenue analytics for a period
 */
export async function getRevenueAnalytics(
  period: 'month' | 'quarter' | 'year' = 'month'
): Promise<{
  success: boolean;
  data?: RevenueAnalytics;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  // Calculate date range
  const now = new Date();
  let fromDate: Date;
  
  switch (period) {
    case 'quarter':
      fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case 'year':
      fromDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  
  // Get billing records for period
  const supabaseClient = supabase as SupabaseClient;
  const { data: records } = await supabaseClient
    .from('domain_billing_records')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .eq('status', 'paid')
    .gte('paid_at', fromDate.toISOString());
  
  if (!records || records.length === 0) {
    return { 
      success: true, 
      data: {
        total_revenue: 0,
        total_cost: 0,
        total_profit: 0,
        profit_margin: 0,
        by_type: {},
      }
    };
  }
  
  // Calculate totals
  interface ByTypeEntry { revenue: number; cost: number; profit: number; count: number }
  interface Accumulator { 
    revenue: number; 
    cost: number; 
    profit: number; 
    by_type: Record<string, ByTypeEntry>;
  }
  
  const totals = (records as AnyRecord[]).reduce<Accumulator>((acc, record) => {
    const retail = (record.retail_amount as number) || 0;
    const wholesale = (record.wholesale_amount as number) || 0;
    const markup = (record.markup_amount as number) || 0;
    const billingType = (record.billing_type as string) || 'other';
    
    acc.revenue += retail;
    acc.cost += wholesale;
    acc.profit += markup;
    
    // Group by type
    if (!acc.by_type[billingType]) {
      acc.by_type[billingType] = { revenue: 0, cost: 0, profit: 0, count: 0 };
    }
    acc.by_type[billingType].revenue += retail;
    acc.by_type[billingType].cost += wholesale;
    acc.by_type[billingType].profit += markup;
    acc.by_type[billingType].count += 1;
    
    return acc;
  }, {
    revenue: 0,
    cost: 0,
    profit: 0,
    by_type: {} as Record<string, ByTypeEntry>,
  });
  
  return {
    success: true,
    data: {
      total_revenue: Math.round(totals.revenue * 100) / 100,
      total_cost: Math.round(totals.cost * 100) / 100,
      total_profit: Math.round(totals.profit * 100) / 100,
      profit_margin: totals.revenue > 0 
        ? Math.round((totals.profit / totals.revenue) * 10000) / 100 
        : 0,
      by_type: totals.by_type,
    },
  };
}

// ============================================================================
// Client Pricing Tiers
// ============================================================================

/**
 * Add a client pricing tier
 */
export async function addClientPricingTier(
  tier: Omit<ClientPricingTier, 'id'>
): Promise<{ success: boolean; error?: string }> {
  const { data: config } = await getAgencyPricingConfig();
  
  if (!config) {
    return { success: false, error: 'No pricing config found' };
  }
  
  const newTier: ClientPricingTier = {
    ...tier,
    id: crypto.randomUUID(),
  };
  
  const currentTiers = config.client_tiers || [];
  
  const result = await updateAgencyPricingConfig({
    client_tiers: [...currentTiers, newTier],
  });
  
  return { success: result.success, error: result.error };
}

/**
 * Update a client pricing tier
 */
export async function updateClientPricingTier(
  tierId: string,
  updates: Partial<ClientPricingTier>
): Promise<{ success: boolean; error?: string }> {
  const { data: config } = await getAgencyPricingConfig();
  
  if (!config) {
    return { success: false, error: 'No pricing config found' };
  }
  
  const currentTiers = config.client_tiers || [];
  const tierIndex = currentTiers.findIndex(t => t.id === tierId);
  
  if (tierIndex === -1) {
    return { success: false, error: 'Tier not found' };
  }
  
  const updatedTiers = [...currentTiers];
  updatedTiers[tierIndex] = { ...updatedTiers[tierIndex], ...updates };
  
  const result = await updateAgencyPricingConfig({
    client_tiers: updatedTiers,
  });
  
  return { success: result.success, error: result.error };
}

/**
 * Delete a client pricing tier
 */
export async function deleteClientPricingTier(
  tierId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: config } = await getAgencyPricingConfig();
  
  if (!config) {
    return { success: false, error: 'No pricing config found' };
  }
  
  const currentTiers = config.client_tiers || [];
  const updatedTiers = currentTiers.filter(t => t.id !== tierId);
  
  const result = await updateAgencyPricingConfig({
    client_tiers: updatedTiers,
  });
  
  return { success: result.success, error: result.error };
}

/**
 * Assign a client to a pricing tier
 */
export async function assignClientToTier(
  tierId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: config } = await getAgencyPricingConfig();
  
  if (!config) {
    return { success: false, error: 'No pricing config found' };
  }
  
  const currentTiers = config.client_tiers || [];
  const tier = currentTiers.find(t => t.id === tierId);
  
  if (!tier) {
    return { success: false, error: 'Tier not found' };
  }
  
  // Remove client from other tiers first
  const updatedTiers = currentTiers.map(t => ({
    ...t,
    client_ids: (t.client_ids || []).filter(id => id !== clientId),
  }));
  
  // Add to target tier
  const tierIndex = updatedTiers.findIndex(t => t.id === tierId);
  updatedTiers[tierIndex].client_ids = [
    ...(updatedTiers[tierIndex].client_ids || []),
    clientId,
  ];
  
  const result = await updateAgencyPricingConfig({
    client_tiers: updatedTiers,
  });
  
  return { success: result.success, error: result.error };
}

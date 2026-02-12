"use server";

// src/lib/actions/domain-billing.ts
// Domain Billing & Pricing Server Actions for Phase DM-10

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { DEFAULT_CURRENCY } from '@/lib/locale-config'
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
        default_markup_value: 30,
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
    
    revalidatePath('/dashboard/settings/domains');
    revalidatePath('/dashboard/settings/domains/pricing');
    
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
    // Get real wholesale pricing from ResellerClub API when available
    let wholesalePrice: number = 0;
    let usedRealPricing = false;
    
    try {
      const { isClientAvailable } = await import('@/lib/resellerclub/client');
      const { domainService } = await import('@/lib/resellerclub/domains');
      
      if (isClientAvailable()) {
        const rcPrices = await domainService.getPricing([params.tld]);
        const tldPricing = rcPrices[params.tld];
        
        if (tldPricing) {
          switch (params.operation) {
            case 'register': {
              const prices = tldPricing.register as Record<number, number>;
              wholesalePrice = prices[params.years] || (prices[1] || 0) * params.years;
              break;
            }
            case 'renew': {
              const prices = tldPricing.renew as Record<number, number>;
              wholesalePrice = (prices[params.years] || (prices[1] || 0) * params.years);
              break;
            }
            case 'transfer':
              wholesalePrice = tldPricing.transfer;
              break;
          }
          usedRealPricing = true;
        }
      }
    } catch {
      // Fall through to fallback pricing
    }
    
    // Fallback pricing if API is unavailable
    if (!usedRealPricing) {
      const basePrices: Record<string, Record<string, number | Record<number, number>>> = {
        // Popular gTLDs
        '.com': { register: { 1: 9.99, 2: 19.98, 3: 29.97 }, renew: { 1: 10.99 }, transfer: 9.99 },
        '.net': { register: { 1: 11.99, 2: 23.98 }, renew: { 1: 12.99 }, transfer: 11.99 },
        '.org': { register: { 1: 10.99, 2: 21.98 }, renew: { 1: 11.99 }, transfer: 10.99 },
        '.info': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 18.99 }, transfer: 9.99 },
        '.biz': { register: { 1: 12.99, 2: 25.98 }, renew: { 1: 15.99 }, transfer: 12.99 },
        '.name': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 10.99 }, transfer: 9.99 },
        // Tech TLDs
        '.io': { register: { 1: 35.99, 2: 71.98 }, renew: { 1: 39.99 }, transfer: 35.99 },
        '.co': { register: { 1: 25.99, 2: 51.98 }, renew: { 1: 28.99 }, transfer: 25.99 },
        '.app': { register: { 1: 15.99, 2: 31.98 }, renew: { 1: 17.99 }, transfer: 15.99 },
        '.dev': { register: { 1: 13.99, 2: 27.98 }, renew: { 1: 15.99 }, transfer: 13.99 },
        '.tech': { register: { 1: 5.99, 2: 11.98 }, renew: { 1: 39.99 }, transfer: 35.99 },
        '.ai': { register: { 1: 69.99, 2: 139.98 }, renew: { 1: 69.99 }, transfer: 69.99 },
        '.cloud': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 21.99 }, transfer: 9.99 },
        '.digital': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.software': { register: { 1: 25.99, 2: 51.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.systems': { register: { 1: 19.99, 2: 39.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.solutions': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.website': { register: { 1: 2.99, 2: 5.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.site': { register: { 1: 2.99, 2: 5.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.online': { register: { 1: 2.99, 2: 5.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.space': { register: { 1: 2.99, 2: 5.98 }, renew: { 1: 19.99 }, transfer: 15.99 },
        '.host': { register: { 1: 79.99, 2: 159.98 }, renew: { 1: 79.99 }, transfer: 79.99 },
        '.hosting': { register: { 1: 299.99, 2: 599.98 }, renew: { 1: 299.99 }, transfer: 299.99 },
        // Business TLDs
        '.store': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 49.99 }, transfer: 39.99 },
        '.shop': { register: { 1: 2.99, 2: 5.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.agency': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.company': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 12.99 }, transfer: 9.99 },
        '.consulting': { register: { 1: 25.99, 2: 51.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.services': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.pro': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 18.99 }, transfer: 14.99 },
        '.media': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.studio': { register: { 1: 19.99, 2: 39.98 }, renew: { 1: 24.99 }, transfer: 19.99 },
        '.design': { register: { 1: 39.99, 2: 79.98 }, renew: { 1: 44.99 }, transfer: 39.99 },
        '.marketing': { register: { 1: 25.99, 2: 51.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.ventures': { register: { 1: 39.99, 2: 79.98 }, renew: { 1: 45.99 }, transfer: 39.99 },
        '.enterprises': { register: { 1: 25.99, 2: 51.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.group': { register: { 1: 15.99, 2: 31.98 }, renew: { 1: 18.99 }, transfer: 15.99 },
        '.global': { register: { 1: 59.99, 2: 119.98 }, renew: { 1: 64.99 }, transfer: 59.99 },
        '.world': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.international': { register: { 1: 19.99, 2: 39.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        // Creative & Community TLDs
        '.blog': { register: { 1: 2.99, 2: 5.98 }, renew: { 1: 25.99 }, transfer: 19.99 },
        '.art': { register: { 1: 12.99, 2: 25.98 }, renew: { 1: 14.99 }, transfer: 12.99 },
        '.photography': { register: { 1: 19.99, 2: 39.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.community': { register: { 1: 25.99, 2: 51.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.social': { register: { 1: 25.99, 2: 51.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.education': { register: { 1: 19.99, 2: 39.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        // Country-code TLDs
        '.us': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 10.99 }, transfer: 9.99 },
        '.uk': { register: { 1: 7.99, 2: 15.98 }, renew: { 1: 8.99 }, transfer: 7.99 },
        '.ca': { register: { 1: 12.99, 2: 25.98 }, renew: { 1: 14.99 }, transfer: 12.99 },
        '.de': { register: { 1: 8.99, 2: 17.98 }, renew: { 1: 9.99 }, transfer: 8.99 },
        '.eu': { register: { 1: 7.99, 2: 15.98 }, renew: { 1: 9.99 }, transfer: 7.99 },
        '.in': { register: { 1: 8.99, 2: 17.98 }, renew: { 1: 9.99 }, transfer: 8.99 },
        '.au': { register: { 1: 14.99, 2: 29.98 }, renew: { 1: 16.99 }, transfer: 14.99 },
        '.me': { register: { 1: 5.99, 2: 11.98 }, renew: { 1: 17.99 }, transfer: 14.99 },
        '.tv': { register: { 1: 29.99, 2: 59.98 }, renew: { 1: 34.99 }, transfer: 29.99 },
        '.cc': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 12.99 }, transfer: 9.99 },
        '.za': { register: { 1: 5.99, 2: 11.98 }, renew: { 1: 6.99 }, transfer: 5.99 },
        '.co.za': { register: { 1: 5.99, 2: 11.98 }, renew: { 1: 6.99 }, transfer: 5.99 },
        // Other popular
        '.xyz': { register: { 1: 1.99, 2: 3.98 }, renew: { 1: 12.99 }, transfer: 9.99 },
        '.club': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 15.99 }, transfer: 12.99 },
        '.live': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.life': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.today': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.email': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.news': { register: { 1: 19.99, 2: 39.98 }, renew: { 1: 22.99 }, transfer: 19.99 },
        '.guru': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.zone': { register: { 1: 9.99, 2: 19.98 }, renew: { 1: 29.99 }, transfer: 25.99 },
        '.rocks': { register: { 1: 3.99, 2: 7.98 }, renew: { 1: 14.99 }, transfer: 12.99 },
        '.top': { register: { 1: 2.99, 2: 5.98 }, renew: { 1: 8.99 }, transfer: 6.99 },
        '.mobi': { register: { 1: 5.99, 2: 11.98 }, renew: { 1: 19.99 }, transfer: 15.99 },
      };
      
      const tldPrices = basePrices[params.tld];
      if (!tldPrices) {
        // Generic fallback for unknown TLDs
        const genericPrices: Record<string, number | Record<number, number>> = {
          register: { 1: 14.99, 2: 29.98 },
          renew: { 1: 16.99 },
          transfer: 14.99,
        };
        switch (params.operation) {
          case 'register': {
            const prices = genericPrices.register as Record<number, number>;
            wholesalePrice = prices[params.years] || (prices[1] as number) * params.years;
            break;
          }
          case 'renew': {
            const prices = genericPrices.renew as Record<number, number>;
            wholesalePrice = prices[params.years] || (prices[1] as number) * params.years;
            break;
          }
          case 'transfer':
            wholesalePrice = genericPrices.transfer as number;
            break;
        }
      } else {
        switch (params.operation) {
          case 'register': {
            const prices = tldPrices.register as Record<number, number>;
            wholesalePrice = prices[params.years] || prices[1] * params.years;
            break;
          }
          case 'renew': {
            const prices = tldPrices.renew as Record<number, number>;
            wholesalePrice = (prices[params.years] || prices[1] * params.years);
            break;
          }
          case 'transfer':
            wholesalePrice = tldPrices.transfer as number;
            break;
        }
      }
    }
    
    // Get agency pricing config
    const supabaseClient = supabase as SupabaseClient;
    const { data: config } = await supabaseClient
      .from('agency_domain_pricing')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .single();
    
    // Calculate retail price
    let retailPrice: number = 0;
    let markupType = (config?.default_markup_type as string) || 'percentage';
    let markupValue = (config?.default_markup_value as number) || 30;
    
    // Check for TLD-specific pricing
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
    
    // Calculate markup if not custom price
    if (retailPrice === 0) {
      switch (markupType) {
        case 'percentage':
          retailPrice = wholesalePrice * (1 + markupValue / 100);
          break;
        case 'fixed':
          retailPrice = wholesalePrice + markupValue;
          break;
        default:
          retailPrice = wholesalePrice * 1.3; // 30% default
      }
    }
    
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
      privacyRetail = privacyWholesale * (1 + markupValue / 100);
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
  
  revalidatePath('/dashboard/settings/domains');
  
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
  
  revalidatePath('/dashboard/settings/domains');
  
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

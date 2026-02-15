"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { isConfigured } from "@/lib/resellerclub/config";
import { isClientAvailable } from "@/lib/resellerclub/client";
import { domainService } from "@/lib/resellerclub/domains";
import { customerService } from "@/lib/resellerclub/customers";
import { contactService } from "@/lib/resellerclub/contacts";
import { arePurchasesAllowed, TLD_CATEGORIES } from "@/lib/resellerclub/config";
import { normalizeDomainKeyword } from "@/lib/domain-keyword";
import { createDomainPurchase } from "@/lib/paddle/transactions";
import { getFallbackPrice } from "@/lib/domain-fallback-prices";
import type { 
  DomainFilters, 
  DomainWithDetails, 
  DomainSearchResult,
  RegisterDomainParams,
  DomainStats 
} from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

// Note: Domain tables (domains, domain_pricing, domain_orders, cloudflare_zones, domain_email_accounts)
// are created by DM-02 migration but may not be in the generated Supabase types yet.
// We use type assertions to work around this until types are regenerated.

// Type for raw RPC/query results
type AnyRecord = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTable(client: SupabaseClient<any>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).from(table);
}

// ============================================================================
// Helper: Ensure agency has a ResellerClub customer ID
// ============================================================================

async function ensureResellerClubCustomer(
  agencyId: string,
  userEmail: string
): Promise<string | null> {
  if (!isConfigured()) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Check if agency already has a customer ID
  const { data: agency } = await admin
    .from('agencies')
    .select('id, name, resellerclub_customer_id')
    .eq('id', agencyId)
    .single();

  if (agency?.resellerclub_customer_id) {
    return agency.resellerclub_customer_id as string;
  }

  // Create a new ResellerClub customer for this agency
  try {
    const customer = await customerService.createOrGet({
      username: userEmail,
      password: customerService.generatePassword(),
      name: (agency?.name as string) || 'Agency',
      company: (agency?.name as string) || 'Agency',
      email: userEmail,
      addressLine1: 'Not Provided',
      city: 'Lusaka',
      state: 'Lusaka',
      country: 'ZM',
      zipcode: '10101',
      phoneCountryCode: '260',
      phone: '955000000',
    });

    // Save customer ID to agency
    await admin
      .from('agencies')
      .update({ resellerclub_customer_id: String(customer.customerId) })
      .eq('id', agencyId);

    return String(customer.customerId);
  } catch (error) {
    console.error('[Domains] Failed to create ResellerClub customer:', error);
    return null;
  }
}

// ============================================================================
// Search & Availability
// ============================================================================

export type DomainSearchResponse = {
  success: boolean;
  data?: DomainSearchResult[];
  error?: string;
  /** When present, results are from DNS/RDAP fallback, not ResellerClub */
  source?: 'resellerclub' | 'fallback';
  /** Shown when source is fallback (e.g. why API was not used) */
  message?: string;
};

export async function searchDomains(
  keyword: string,
  tlds?: string[]
): Promise<DomainSearchResponse> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  // Get user's agency for pricing
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };
  
  try {
    const cleanKeyword = normalizeDomainKeyword(keyword);
    if (!cleanKeyword || cleanKeyword.length < 2) {
      return { success: false, error: 'Keyword must be at least 2 characters' };
    }
    
    // Use provided TLDs or fall back to popular TLDs from config
    const allConfigTlds = Object.values(TLD_CATEGORIES).flat();
    const popularTlds = tlds || allConfigTlds;

    // Get agency pricing settings (markup + pricing mode)
    const { data: pricing } = await getTable(supabase, 'agency_domain_pricing')
      .select('default_markup_type, default_markup_value')
      .eq('agency_id', profile.agency_id)
      .maybeSingle() as { data: { default_markup_type?: string; default_markup_value?: number } | null };

    const markupType = pricing?.default_markup_type || 'percentage';
    const markupValue = pricing?.default_markup_value ?? 0;

    // How pricing works:
    // 1. ResellerClub provides TWO price tiers:
    //    - Cost/wholesale price: what you pay RC (your cost)
    //    - Customer/selling price: the retail price you configured in RC panel
    //      (reflects the profit margin you set in RC, e.g. 100% → selling = 2× cost)
    // 2. The DRAMAC agency markup is an ADDITIONAL layer on top of RC selling price.
    //    Default 0% means: use exactly what you set in RC panel.
    //    Setting e.g. 10% means: add 10% on top of RC selling price.
    // 3. When RC data is unavailable, fallback prices are used as wholesale
    //    and markup is applied to derive retail.

    const applyMarkup = (base: number): number => {
      if (markupValue === 0 && markupType === 'percentage') return Math.round(base * 100) / 100;
      if (markupType === 'fixed') return Math.round((base + markupValue) * 100) / 100;
      return Math.round(base * (1 + markupValue / 100) * 100) / 100;
    };

    let fallbackReason: string | undefined;
    // Try ResellerClub API first (live data)
    if (isClientAvailable()) {
      try {
        const availability = await domainService.suggestDomains(cleanKeyword, popularTlds);
        
        // Fetch TWO price tiers from ResellerClub in parallel:
        // 1. Reseller pricing (products/reseller-price.json) — the SELLING prices
        //    configured in your RC panel. No customer-id needed. This is the source of
        //    truth for what to charge end-customers.
        // 2. Cost pricing (products/reseller-cost-price.json) — WHOLESALE prices
        //    (what you pay RC). Used to show profit margin.

        type SimplePrice = { register: Record<number, number>; renew: Record<number, number>; transfer: number };
        let sellingByTld: Record<string, SimplePrice> = {};
        let wholesaleByTld: Record<string, SimplePrice> = {};

        const mapDomainPrice = (price: { register: Record<number, number>; renew: Record<number, number>; transfer: number }) => ({
          register: Object.fromEntries(Object.entries(price.register).filter(([, v]) => v != null && Number(v) > 0)) as Record<number, number>,
          renew: Object.fromEntries(Object.entries(price.renew).filter(([, v]) => v != null && Number(v) > 0)) as Record<number, number>,
          transfer: Number(price.transfer) || 0,
        });

        const [sellingResult, wholesaleResult] = await Promise.all([
          (async () => {
            // reseller-price.json: your configured selling prices (no customer-id needed)
            const rcSelling = await domainService.getResellerPricing(popularTlds);
            return Object.fromEntries(Object.entries(rcSelling).map(([tld, price]) => [tld, mapDomainPrice(price)]));
          })().catch((err) => {
            console.warn('[Domains] Could not fetch RC reseller/selling pricing:', err instanceof Error ? err.message : String(err));
            return null;
          }),
          (async () => {
            const rcWholesale = await domainService.getResellerCostPricing(popularTlds);
            return Object.fromEntries(Object.entries(rcWholesale).map(([tld, price]) => [tld, mapDomainPrice(price)]));
          })().catch((err) => {
            console.warn('[Domains] Could not fetch RC cost pricing:', err instanceof Error ? err.message : String(err));
            return null;
          }),
        ]);

        if (sellingResult) sellingByTld = sellingResult as Record<string, SimplePrice>;
        if (wholesaleResult) wholesaleByTld = wholesaleResult as Record<string, SimplePrice>;

        if (Object.keys(sellingByTld).length > 0) {
          console.log(`[Domains] Fetched live selling pricing for ${Object.keys(sellingByTld).length} TLDs`);
        } else {
          console.warn('[Domains] RC selling pricing returned empty — will use cost × markup as fallback');
        }
        if (Object.keys(wholesaleByTld).length > 0) {
          console.log(`[Domains] Fetched live cost pricing for ${Object.keys(wholesaleByTld).length} TLDs`);
        } else {
          console.warn('[Domains] RC cost pricing returned empty');
        }

        const results: DomainSearchResult[] = availability.map(item => {
          const tld = domainService.extractTld(item.domain);
          const rcSelling = sellingByTld[tld];    // RC selling prices (your configured retail)
          const rcCost = wholesaleByTld[tld];      // RC cost prices (what you pay RC)

          const fallbackBase = 12.99;
          
          // If the API returned 'unknown' status (no matching key in response),
          // mark as unverified so the UI shows a warning instead of "Already registered"
          const isUnknown = item.status === 'unknown';
          
          // WHOLESALE (cost) prices — what the agency pays ResellerClub
          const baseWholesale = rcCost?.register?.[1] || fallbackBase;
          const wholesaleRegister = rcCost?.register?.[1] ? rcCost.register : { 1: baseWholesale };
          const wholesaleRenew = rcCost?.renew?.[1] ? rcCost.renew : { 1: baseWholesale * 1.1 };
          const wholesaleTransfer = rcCost?.transfer || baseWholesale * 0.9;

          // RETAIL (selling) prices — what the agency charges their clients.
          // Base retail = RC reseller/selling price (reflects the profit margin
          // you configured in your ResellerClub panel, e.g. 100% = 2× cost).
          // The DRAMAC agency markup (if any) is applied ON TOP of these prices.
          // With markup=0% (default), prices match exactly what's in your RC panel.
          const hasRcSellingPrice = !!rcSelling?.register?.[1];

          let retailRegister: Record<number, number>;
          let retailRenew: Record<number, number>;
          let retailTransfer: number;

          if (hasRcSellingPrice) {
            // Use RC selling prices as base, then apply any DRAMAC additional markup
            retailRegister = Object.fromEntries(
              Object.entries(rcSelling!.register).map(([y, p]) => [y, applyMarkup(Number(p) || 0)])
            ) as Record<number, number>;
            retailRenew = Object.fromEntries(
              Object.entries(rcSelling!.renew).map(([y, p]) => [y, applyMarkup(Number(p) || 0)])
            ) as Record<number, number>;
            retailTransfer = applyMarkup(rcSelling!.transfer || 0);
          } else {
            // No RC customer pricing available — derive retail from cost + markup
            // Use a minimum 30% markup on cost when we don't have selling prices
            const costMarkup = (base: number): number => {
              if (markupValue > 0) return applyMarkup(base);
              // Default: at least 30% on cost when no RC selling price
              return Math.round(base * 1.3 * 100) / 100;
            };
            retailRegister = Object.fromEntries(
              Object.entries(wholesaleRegister).map(([y, p]) => [y, costMarkup(Number(p) || 0)])
            ) as Record<number, number>;
            retailRenew = Object.fromEntries(
              Object.entries(wholesaleRenew).map(([y, p]) => [y, costMarkup(Number(p) || 0)])
            ) as Record<number, number>;
            retailTransfer = costMarkup(wholesaleTransfer);
          }

          return {
            domain: item.domain,
            tld,
            available: item.status === 'available',
            ...(isUnknown ? { unverified: true } : {}),
            premium: item.status === 'premium',
            prices: {
              register: wholesaleRegister,
              renew: wholesaleRenew,
              transfer: wholesaleTransfer,
            },
            retailPrices: {
              register: retailRegister,
              renew: retailRenew,
              transfer: retailTransfer,
            },
          };
        });
        
        results.sort((a, b) => {
          if (a.available && !b.available) return -1;
          if (!a.available && b.available) return 1;
          return (a.retailPrices.register[1] || 0) - (b.retailPrices.register[1] || 0);
        });
        
        return { success: true, data: results, source: 'resellerclub' };
      } catch (apiError) {
        fallbackReason = apiError instanceof Error ? apiError.message : String(apiError);
        console.error('[Domains] ResellerClub API search failed:', apiError);
      }
    } else {
      fallbackReason = 'ResellerClub is not configured (set RESELLERCLUB_RESELLER_ID and RESELLERCLUB_API_KEY) or server IP is not whitelisted.';
    }
    
    // Fallback: Use DNS/RDAP to check domain availability
    // This gives much better results than blindly marking everything as "unavailable"
    
    // Import and run the DNS/RDAP fallback checker
    let fallbackAvailability: Array<{ domain: string; available: boolean }> = [];
    try {
      const { checkAvailabilityFallback } = await import('@/lib/domain-availability-fallback');
      const domainNames = popularTlds.map(tld => cleanKeyword + tld);
      const fbResults = await checkAvailabilityFallback(domainNames);
      fallbackAvailability = fbResults.map(r => ({ domain: r.domain, available: r.available }));
    } catch (fbError) {
      console.error('[Domains] DNS/RDAP fallback also failed:', fbError);
    }
    
    const results: DomainSearchResult[] = popularTlds.map(tld => {
      const domainName = cleanKeyword + tld;
      const fb = getFallbackPrice(tld);
      const fbResult = fallbackAvailability.find(r => r.domain === domainName);
      
      // Fallback prices are wholesale-level, so always apply at least 30% markup
      const fallbackMarkup = (base: number): number => {
        if (markupValue > 0) return applyMarkup(base);
        return Math.round(base * 1.3 * 100) / 100; // minimum 30% when no markup configured
      };
      
      return {
        domain: domainName,
        tld,
        available: fbResult?.available ?? false,
        unverified: true, // Always true for fallback — results are heuristic-based
        premium: false,
        prices: {
          register: fb.register,
          renew: fb.renew,
          transfer: fb.transfer,
        },
        retailPrices: {
          register: Object.fromEntries(
            Object.entries(fb.register).map(([y, p]) => [y, fallbackMarkup(Number(p))])
          ) as Record<number, number>,
          renew: Object.fromEntries(
            Object.entries(fb.renew).map(([y, p]) => [y, fallbackMarkup(Number(p))])
          ) as Record<number, number>,
          transfer: fallbackMarkup(fb.transfer),
        },
      };
    });
    
    results.sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return (a.retailPrices.register[1] || 0) - (b.retailPrices.register[1] || 0);
    });
    
    return {
      success: true,
      data: results,
      source: 'fallback',
      message: fallbackReason
        ? `ResellerClub API was not used: ${fallbackReason} Showing approximate availability (DNS lookup) — register to confirm.`
        : 'Showing approximate availability (DNS lookup) — register to confirm.',
    };
  } catch (error) {
    console.error('[Domains] Search error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed' 
    };
  }
}

export async function checkDomainAvailability(domainName: string) {
  try {
    // Use real API if configured
    if (isClientAvailable()) {
      try {
        const result = await domainService.checkAvailability(domainName);
        return { 
          success: true, 
          data: {
            domain: domainName,
            available: result.status === 'available',
            premium: result.status === 'premium',
          }
        };
      } catch (apiError) {
        console.warn('[Domains] RC availability check failed:', apiError);
      }
    }
    
    // Fallback: Use DNS/RDAP to check single domain
    try {
      const { checkAvailabilityFallback } = await import('@/lib/domain-availability-fallback');
      const fbResults = await checkAvailabilityFallback([domainName]);
      const fbResult = fbResults[0];
      return { 
        success: true, 
        data: {
          domain: domainName,
          available: fbResult?.available ?? false,
          unverified: true,
          premium: false,
        }
      };
    } catch {
      // Even fallback failed
    }
    
    return { 
      success: true, 
      data: {
        domain: domainName,
        available: false,
        unverified: true,
        premium: false,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Check failed' 
    };
  }
}

// ============================================================================
// Registration
// ============================================================================

export async function registerDomain(params: RegisterDomainParams) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };
  
  try {
    // Parse domain
    const parts = params.domainName.split('.');
    const tld = '.' + parts.pop();
    
    // Calculate pricing using cached customer pricing
    const { calculateDomainPrice } = await import('@/lib/actions/domain-billing');
    const pricing = await calculateDomainPrice({
      tld,
      years: params.years,
      operation: 'register',
      includePrivacy: params.privacy ?? true,
      clientId: params.clientId,
    });
    
    if (!pricing.success || !pricing.data) {
      return { success: false, error: 'Failed to calculate pricing' };
    }
    
    // Create Paddle transaction for payment
    const { createDomainPurchase } = await import('@/lib/paddle/transactions');
    
    const purchase = await createDomainPurchase({
      agencyId: profile.agency_id,
      userId: user.id,
      clientId: params.clientId,
      purchaseType: 'domain_register',
      domainName: params.domainName,
      years: params.years,
      tld,
      wholesaleAmount: pricing.data.total_wholesale,
      retailAmount: pricing.data.total_retail,
      currency: 'USD',
      contactInfo: params.contactInfo,
      privacy: params.privacy,
      autoRenew: params.autoRenew,
    });
    
    return {
      success: true,
      data: {
        pendingPurchaseId: purchase.id,
        transactionId: purchase.paddleTransactionId,
        checkoutUrl: purchase.checkoutUrl,
        status: 'pending_payment',
      },
    };
  } catch (error) {
    console.error('[Domains] Registration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    };
  }
}

/**
 * Create a domain cart checkout for multiple domains
 * Returns pendingPurchaseId and transactionId for Paddle checkout
 */
export async function createDomainCartCheckout(params: {
  domains: Array<{
    domainName: string;
    years: number;
    privacy?: boolean;
    autoRenew?: boolean;
  }>;
  clientId?: string;
  contactInfo?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.agency_id) return { success: false, error: 'No agency found' };
    
    // Validate domains
    if (!params.domains || params.domains.length === 0) {
      return { success: false, error: 'No domains selected' };
    }
    
    // Calculate total pricing for all domains
    let totalWholesale = 0;
    let totalRetail = 0;
    const domainDetails = [];
    
    for (const domain of params.domains) {
      const pricing = await calculateDomainPricing({
        domainName: domain.domainName,
        years: domain.years,
        privacy: domain.privacy,
        agencyId: profile.agency_id,
      });
      
      if (!pricing.success || !pricing.data) {
        return { 
          success: false, 
          error: `Failed to get pricing for ${domain.domainName}` 
        };
      }
      
      totalWholesale += pricing.data.total_wholesale;
      totalRetail += pricing.data.total_retail;
      domainDetails.push({
        ...domain,
        tld: domain.domainName.split('.').pop(),
        wholesale: pricing.data.total_wholesale,
        retail: pricing.data.total_retail,
      });
    }
    
    // Create a single pending purchase for the cart
    // Use a deterministic identifier based on sorted domain names
    const sortedDomains = params.domains
      .map(d => d.domainName)
      .sort()
      .join(',');
    
    const purchase = await createDomainPurchase({
      agencyId: profile.agency_id,
      userId: user.id,
      clientId: params.clientId,
      purchaseType: 'domain_register',
      domainName: sortedDomains, // For idempotency key
      years: params.domains[0].years, // Representative value
      tld: 'multi', // Indicates multiple domains
      wholesaleAmount: totalWholesale,
      retailAmount: totalRetail,
      currency: 'USD',
      contactInfo: params.contactInfo,
      privacy: params.domains.some(d => d.privacy),
      autoRenew: params.domains.some(d => d.autoRenew),
    });
    
    // Update the purchase_data to include all domains
    const admin = createAdminClient();
    await admin
      .from('pending_purchases')
      .update({
        purchase_data: {
          domains: domainDetails,
          contact_info: params.contactInfo,
        },
      })
      .eq('id', purchase.id);
    
    return {
      success: true,
      data: {
        pendingPurchaseId: purchase.id,
        transactionId: purchase.paddleTransactionId,
        checkoutUrl: purchase.checkoutUrl,
        totalAmount: totalRetail,
        currency: 'USD',
        domains: domainDetails,
      },
    };
  } catch (error) {
    console.error('[Domains] Cart checkout error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create checkout' 
    };
  }
}

// ============================================================================
// Domain List & Management
// ============================================================================

export async function getDomains(filters?: DomainFilters): Promise<{
  success: boolean;
  data: DomainWithDetails[];
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
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
  
  try {
    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build query
    let query = getTable(supabase, 'domains')
      .select('*', { count: 'exact' })
      .eq('agency_id', profile.agency_id)
      .neq('status', 'cancelled');
    
    // Apply text search filter
    if (filters?.search) {
      query = query.ilike('domain_name', `%${filters.search}%`);
    }
    
    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Apply TLD filter
    if (filters?.tld) {
      query = query.eq('tld', filters.tld);
    }
    
    // Apply sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);
    
    if (error) {
      console.error('[Domains] List error:', error);
      return { 
        success: true, 
        data: [],
        total: 0,
        page,
        limit,
      };
    }
    
    return { 
      success: true, 
      data: (data || []) as unknown as DomainWithDetails[],
      total: count || data?.length || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('[Domains] List error:', error);
    return { success: false, error: 'Failed to load domains', data: [] };
  }
}

export async function getDomain(domainId: string): Promise<{
  success: boolean;
  data?: DomainWithDetails;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  try {
    const { data, error } = await getTable(supabase, 'domains')
      .select('*')
      .eq('id', domainId)
      .single();
    
    if (error) {
      console.error('[Domains] Get error:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      data: data as unknown as DomainWithDetails,
    };
  } catch (error) {
    console.error('[Domains] Get error:', error);
    return { success: false, error: 'Failed to load domain' };
  }
}

export async function getDomainStats(): Promise<{ success: boolean; data?: DomainStats; error?: string }> {
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
    // Query real domain counts from database
    const { data: allDomains } = await getTable(supabase, 'domains')
      .select('id, status, expiry_date, auto_renew')
      .eq('agency_id', profile.agency_id)
      .neq('status', 'cancelled');

    const domains = (allDomains || []) as { id: string; status: string; expiry_date: string | null; auto_renew: boolean }[];
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const total = domains.length;
    const active = domains.filter(d => d.status === 'active').length;
    const expiringSoon = domains.filter(d => {
      if (!d.expiry_date) return false;
      const expiry = new Date(d.expiry_date);
      return expiry > now && expiry < thirtyDaysFromNow;
    }).length;
    const expired = domains.filter(d => {
      if (!d.expiry_date) return false;
      return new Date(d.expiry_date) < now;
    }).length;

    // Query email accounts count
    const { data: emailOrders } = await getTable(supabase, 'email_orders')
      .select('id, used_accounts')
      .eq('agency_id', profile.agency_id)
      .eq('status', 'Active');

    const emailOrdersList = (emailOrders || []) as { id: string; used_accounts: number }[];
    const totalEmails = emailOrdersList.reduce((sum, o) => sum + (o.used_accounts || 0), 0);
    const domainsWithEmail = emailOrdersList.length;

    return {
      success: true,
      data: {
        total,
        active,
        expiringSoon,
        expired,
        totalEmails,
        domainsWithEmail,
      },
    };
  } catch (error) {
    console.error('[Domains] Stats error:', error);
    // Return zeros on error rather than failing completely
    return { 
      success: true, 
      data: {
        total: 0, active: 0, expiringSoon: 0, expired: 0,
        totalEmails: 0, domainsWithEmail: 0,
      } 
    };
  }
}

// ============================================================================
// Renewal
// ============================================================================

export async function renewDomain(domainId: string, years: number): Promise<{
  success: boolean;
  data?: { pendingPurchaseId?: string; checkoutUrl?: string; status?: string; newExpiryDate?: string };
  error?: string;
}> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };
  
  try {
    // Get domain
    const { data: domain, error } = await getTable(supabase, 'domains')
      .select('*')
      .eq('id', domainId)
      .single() as { data: AnyRecord | null; error: { message: string } | null };
    
    if (error || !domain) {
      return { success: false, error: 'Domain not found' };
    }
    
    // Parse domain for TLD
    const parts = (domain.domain_name as string).split('.');
    const tld = '.' + parts.pop();
    
    // Calculate pricing using cached customer pricing
    const { calculateDomainPrice } = await import('@/lib/actions/domain-billing');
    const pricing = await calculateDomainPrice({
      tld,
      years,
      operation: 'renew',
      includePrivacy: false,
    });
    
    if (!pricing.success || !pricing.data) {
      return { success: false, error: 'Failed to calculate pricing' };
    }
    
    // Create Paddle transaction for payment
    const { createDomainPurchase } = await import('@/lib/paddle/transactions');
    
    const purchase = await createDomainPurchase({
      agencyId: profile.agency_id,
      userId: user.id,
      clientId: domain.client_id as string | undefined,
      purchaseType: 'domain_renew',
      domainName: domain.domain_name as string,
      years,
      tld,
      wholesaleAmount: pricing.data.total_wholesale,
      retailAmount: pricing.data.total_retail,
      currency: 'USD',
    });
    
    return {
      success: true,
      data: {
        pendingPurchaseId: purchase.id,
        checkoutUrl: purchase.checkoutUrl,
        status: 'pending_payment',
      },
    };
  } catch (error) {
    console.error('[Domains] Renewal error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Renewal failed' 
    };
  }
}

// ============================================================================
// Domain Settings
// ============================================================================

export async function updateDomainAutoRenew(domainId: string, autoRenew: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  const admin = createAdminClient();
  
  try {
    // Get domain to check for RC order
    const supabase = await createClient();
    const { data: domain } = await getTable(supabase, 'domains')
      .select('resellerclub_order_id')
      .eq('id', domainId)
      .single() as { data: { resellerclub_order_id?: string } | null };
    
    // Sync auto-renew with ResellerClub
    if (isClientAvailable() && domain?.resellerclub_order_id) {
      try {
        if (autoRenew) {
          await domainService.enableAutoRenew(domain.resellerclub_order_id);
        } else {
          await domainService.disableAutoRenew(domain.resellerclub_order_id);
        }
      } catch (apiError) {
        console.warn('[Domains] RC auto-renew update failed:', apiError);
      }
    }
    
    await getTable(admin, 'domains')
      .update({ auto_renew: autoRenew })
      .eq('id', domainId);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { success: true };
  } catch (error) {
    console.error('[Domains] Update auto-renew error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    };
  }
}

export async function updateDomainPrivacy(domainId: string, privacy: boolean): Promise<{
  success: boolean;
  error?: string;
}> {
  const admin = createAdminClient();
  
  try {
    // Get domain to check for RC order
    const supabase = await createClient();
    const { data: domain } = await getTable(supabase, 'domains')
      .select('resellerclub_order_id')
      .eq('id', domainId)
      .single() as { data: { resellerclub_order_id?: string } | null };
    
    // Sync privacy with ResellerClub
    if (isClientAvailable() && domain?.resellerclub_order_id && privacy) {
      try {
        await domainService.enablePrivacy(domain.resellerclub_order_id);
      } catch (apiError) {
        console.warn('[Domains] RC privacy update failed:', apiError);
      }
    }
    
    await getTable(admin, 'domains')
      .update({ whois_privacy: privacy })
      .eq('id', domainId);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { success: true };
  } catch (error) {
    console.error('[Domains] Update privacy error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    };
  }
}

export async function deleteDomain(domainId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const admin = createAdminClient();
  
  try {
    // Soft delete - just mark as cancelled
    await getTable(admin, 'domains')
      .update({ status: 'cancelled' })
      .eq('id', domainId);
    
    revalidatePath('/dashboard/domains');
    
    return { success: true };
  } catch (error) {
    console.error('[Domains] Delete error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

// ============================================================================
// ResellerClub Configuration Status
// ============================================================================

export async function getResellerClubStatus(): Promise<{
  success: boolean;
  data: {
    configured: boolean;
    connected: boolean;
    purchasesEnabled: boolean;
    balance?: number;
    currency?: string;
  };
}> {
  try {
    const configured = isConfigured();
    if (!configured) {
      return { 
        success: true, 
        data: { configured: false, connected: false, purchasesEnabled: false } 
      };
    }
    
    if (!isClientAvailable()) {
      return { 
        success: true, 
        data: { configured: true, connected: false, purchasesEnabled: false } 
      };
    }

    // Try to get balance to verify connection
    try {
      const { getResellerClubClient } = await import('@/lib/resellerclub/client');
      const client = getResellerClubClient();
      const balance = await client.getBalance();
      return {
        success: true,
        data: {
          configured: true,
          connected: true,
          purchasesEnabled: arePurchasesAllowed(),
          balance: balance.balance,
          currency: balance.currency,
        },
      };
    } catch {
      return {
        success: true,
        data: { configured: true, connected: false, purchasesEnabled: false },
      };
    }
  } catch {
    return {
      success: true,
      data: { configured: false, connected: false, purchasesEnabled: false },
    };
  }
}

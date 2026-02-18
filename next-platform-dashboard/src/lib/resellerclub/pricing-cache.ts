// src/lib/resellerclub/pricing-cache.ts
// ResellerClub Pricing Cache Service
// Manages cached pricing data from ResellerClub APIs

import { createAdminClient } from '@/lib/supabase/admin';
import { domainService } from './domains';
import { businessEmailApi } from './email';
import { SUPPORTED_TLDS } from './config';
import type { DomainPrice } from './types';
import type { EmailPricingResponse } from './email/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Flatten Titan Mail `plans`-structured pricing into standard `email_account_ranges` shape.
 * Shared by both the pricing cache (for DB storage) and the server action (for wizard display).
 *
 * RC confirmed structure:
 *   titanmailglobal: { plans: { "1762": { add: { "1": 0.60, "12": 5.76 }, renew: {...} } } }
 *
 * Converted to:
 *   titanmailglobal_1762: { email_account_ranges: { "1-200000": { add: {...}, renew: {...} } } }
 */
function flattenTitanMailForCache(pricing: EmailPricingResponse): EmailPricingResponse {
  const TITAN_KEYS = ['titanmailglobal', 'titanmailindia'];
  const result = { ...pricing };

  for (const parentKey of TITAN_KEYS) {
    const parentValue = pricing[parentKey];
    if (!parentValue || typeof parentValue !== 'object') continue;
    if (parentValue.email_account_ranges) continue; // already flat

    const pv = parentValue as Record<string, unknown>;
    const plans = pv.plans as Record<string, unknown> | undefined;

    if (plans && typeof plans === 'object') {
      let foundAny = false;
      for (const [planId, planData] of Object.entries(plans)) {
        if (typeof planData !== 'object' || planData === null) continue;
        const pd = planData as Record<string, unknown>;
        const syntheticKey = `${parentKey}_${planId}`;

        if (pd.email_account_ranges) {
          result[syntheticKey] = planData as EmailPricingResponse[string];
          foundAny = true;
        } else if (pd.add || pd.renew) {
          // Direct add/renew pricing — wrap in a single slab
          result[syntheticKey] = {
            email_account_ranges: {
              '1-200000': {
                add: (pd.add as Record<string, number>) || {},
                renew: (pd.renew as Record<string, number>) || {},
              },
            },
          };
          foundAny = true;
        } else {
          // Check for range-keyed sub-keys
          const subKeys = Object.keys(pd);
          if (subKeys.some(k => /^\d+-\d+$/.test(k))) {
            result[syntheticKey] = { email_account_ranges: pd };
            foundAny = true;
          }
        }
      }
      if (foundAny) delete result[parentKey];
    }
  }

  return result;
}

export interface PricingSyncResult {
  success: boolean;
  syncType: 'domain' | 'email' | 'full';
  pricingType: 'customer' | 'reseller' | 'cost' | 'all';
  tldsRefreshed: number;
  emailProductsRefreshed: number;
  duration: number;
  apiCallsMade: number;
  error?: string;
  errorDetails?: unknown;
}

export interface CachedDomainPrice extends DomainPrice {
  lastRefreshedAt: string;
  sourceEndpoint: string;
}

/**
 * Convert price in dollars to cents (avoiding floating point issues)
 */
function toCents(price: number): number {
  return Math.round(price * 100);
}

/**
 * Convert price in cents to dollars
 */
function toDollars(cents: number): number {
  return cents / 100;
}

/**
 * Pricing Cache Service
 */
export const pricingCacheService = {
  /**
   * Refresh domain pricing cache from ResellerClub
   */
  async refreshDomainPricing(
    customerId: string,
    pricingTypes: Array<'customer' | 'reseller' | 'cost'> = ['customer', 'cost'],
    tlds: string[] = SUPPORTED_TLDS
  ): Promise<PricingSyncResult> {
    const startTime = Date.now();
    const admin = createAdminClient() as SupabaseClient;
    
    let tldsRefreshed = 0;
    let apiCallsMade = 0;
    let lastError: Error | null = null;
    
    try {
      for (const pricingType of pricingTypes) {
        let prices: Record<string, DomainPrice> = {};
        let endpoint = '';
        
        // Fetch pricing from appropriate API
        try {
          if (pricingType === 'customer') {
            // customer-price.json works without customer-id (returns default selling prices)
            prices = await domainService.getCustomerPricing(customerId || undefined, tlds);
            endpoint = 'products/customer-price.json';
          } else if (pricingType === 'cost') {
            prices = await domainService.getResellerCostPricing(tlds);
            endpoint = 'products/reseller-cost-price.json';
          } else if (pricingType === 'reseller') {
            prices = await domainService.getResellerPricing(tlds);
            endpoint = 'products/reseller-price.json';
          }
          apiCallsMade++;
        } catch (error) {
          console.error(`[PricingCache] Failed to fetch ${pricingType} pricing:`, error);
          lastError = error as Error;
          continue; // Try next pricing type
        }
        
        // Upsert each TLD's pricing into cache
        for (const [tld, priceData] of Object.entries(prices)) {
          try {
            await admin
              .from('domain_pricing_cache')
              .upsert({
                tld,
                pricing_type: pricingType,
                currency: priceData.currency,
                register_1yr: toCents(priceData.register[1]),
                register_2yr: priceData.register[2] ? toCents(priceData.register[2]) : null,
                register_3yr: priceData.register[3] ? toCents(priceData.register[3]) : null,
                register_5yr: priceData.register[5] ? toCents(priceData.register[5]) : null,
                register_10yr: priceData.register[10] ? toCents(priceData.register[10]) : null,
                renew_1yr: toCents(priceData.renew[1]),
                renew_2yr: priceData.renew[2] ? toCents(priceData.renew[2]) : null,
                renew_3yr: priceData.renew[3] ? toCents(priceData.renew[3]) : null,
                renew_5yr: priceData.renew[5] ? toCents(priceData.renew[5]) : null,
                renew_10yr: priceData.renew[10] ? toCents(priceData.renew[10]) : null,
                transfer_price: toCents(priceData.transfer),
                restore_price: priceData.restore ? toCents(priceData.restore) : null,
                source_api_endpoint: endpoint,
                last_refreshed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'tld,pricing_type',
              });
            
            tldsRefreshed++;
          } catch (error) {
            console.error(`[PricingCache] Failed to cache ${tld} ${pricingType} pricing:`, error);
            lastError = error as Error;
          }
        }
      }
      
      const duration = Date.now() - startTime;
      
      // Log sync result
      await admin.from('pricing_sync_log').insert({
        sync_type: 'domain',
        pricing_type: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        status: lastError ? 'partial' : 'success',
        tlds_refreshed: tldsRefreshed,
        email_products_refreshed: 0,
        duration_ms: duration,
        api_calls_made: apiCallsMade,
        error_message: lastError?.message,
        error_details: lastError ? { name: lastError.name, stack: lastError.stack } : null,
        completed_at: new Date().toISOString(),
      });
      
      return {
        success: !lastError,
        syncType: 'domain',
        pricingType: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        tldsRefreshed,
        emailProductsRefreshed: 0,
        duration,
        apiCallsMade,
        error: lastError?.message,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed sync
      await admin.from('pricing_sync_log').insert({
        sync_type: 'domain',
        pricing_type: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        status: 'failed',
        tlds_refreshed: tldsRefreshed,
        email_products_refreshed: 0,
        duration_ms: duration,
        api_calls_made: apiCallsMade,
        error_message: errorMsg,
        error_details: error instanceof Error ? { name: error.name, stack: error.stack } : error,
        completed_at: new Date().toISOString(),
      });
      
      return {
        success: false,
        syncType: 'domain',
        pricingType: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        tldsRefreshed,
        emailProductsRefreshed: 0,
        duration,
        apiCallsMade,
        error: errorMsg,
        errorDetails: error,
      };
    }
  },
  
  /**
   * Refresh email pricing cache from the pricing API.
   * Pass an empty productKeys array (default) to auto-cache ALL plans found in the API response.
   * This enables automatic discovery of new plans (e.g. Professional) without code changes.
   */
  async refreshEmailPricing(
    customerId: string,
    pricingTypes: Array<'customer' | 'reseller' | 'cost'> = ['customer', 'cost'],
    productKeys: string[] = [] // Empty = auto-discover all plans from the API response
  ): Promise<PricingSyncResult> {
    const startTime = Date.now();
    const admin = createAdminClient() as SupabaseClient;
    
    let emailProductsRefreshed = 0;
    let apiCallsMade = 0;
    let lastError: Error | null = null;
    
    const monthsOptions = [1, 3, 6, 12];
    
    try {
      for (const pricingType of pricingTypes) {
        let pricing: EmailPricingResponse = {};
        let endpoint = '';
        
        // Fetch pricing from appropriate API
        try {
          if (pricingType === 'customer') {
            pricing = await businessEmailApi.getCustomerPricing(customerId);
            endpoint = 'products/customer-price.json';
          } else if (pricingType === 'cost') {
            pricing = await businessEmailApi.getResellerCostPricing();
            endpoint = 'products/reseller-cost-price.json';
          } else if (pricingType === 'reseller') {
            pricing = await businessEmailApi.getResellerPricing();
            endpoint = 'products/reseller-pricing.json';
          }
          apiCallsMade++;
        } catch (error) {
          console.error(`[PricingCache] Failed to fetch ${pricingType} email pricing:`, error);
          lastError = error as Error;
          continue; // Try next pricing type
        }
        
        // Upsert each product + slab + tenure combination into cache
        // RC response structure: { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": 0.86, "12": 10.20 }, "renew": {...} } } } }
        // Titan Mail uses a `plans` structure — flatten it first so we cache synthetic keys.
        const flattenedPricing = flattenTitanMailForCache(pricing);

        // When productKeys is empty, cache ALL plans found in the flattened response (auto-discovery)
        const keysToCache = productKeys.length > 0
          ? productKeys
          : Object.keys(flattenedPricing).filter(k => flattenedPricing[k]?.email_account_ranges);

        for (const productKey of keysToCache) {
          const productPricing = flattenedPricing[productKey];
          if (!productPricing?.email_account_ranges) continue;
          
          const ranges = productPricing.email_account_ranges as Record<string, { add?: Record<string, number>; renew?: Record<string, number> }>;
          
          for (const [slab, slabData] of Object.entries(ranges)) {
            if (!slabData || typeof slabData !== 'object') continue;
            
            for (const months of monthsOptions) {
              const addPrice = slabData.add?.[String(months)];
              const renewPrice = slabData.renew?.[String(months)];
              
              // Skip if neither price exists
              if (addPrice == null && renewPrice == null) continue;
              
              try {
                await admin
                  .from('email_pricing_cache')
                  .upsert({
                    product_key: productKey,
                    pricing_type: pricingType,
                    currency: 'USD',
                    months,
                    account_slab: slab,
                    add_account_price: addPrice != null ? toCents(Number(addPrice)) : null,
                    renew_account_price: renewPrice != null ? toCents(Number(renewPrice)) : null,
                    source_api_endpoint: endpoint,
                    last_refreshed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'product_key,months,pricing_type,account_slab',
                  });
                
                emailProductsRefreshed++;
              } catch (error) {
                console.error(`[PricingCache] Failed to cache ${productKey}/${slab}/${months}mo ${pricingType} pricing:`, error);
                lastError = error as Error;
              }
            }
          }
        }
      }
      
      const duration = Date.now() - startTime;
      
      // Log sync result
      await admin.from('pricing_sync_log').insert({
        sync_type: 'email',
        pricing_type: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        status: lastError ? 'partial' : 'success',
        tlds_refreshed: 0,
        email_products_refreshed: emailProductsRefreshed,
        duration_ms: duration,
        api_calls_made: apiCallsMade,
        error_message: lastError?.message,
        error_details: lastError ? { name: lastError.name, stack: lastError.stack } : null,
        completed_at: new Date().toISOString(),
      });
      
      return {
        success: !lastError,
        syncType: 'email',
        pricingType: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        tldsRefreshed: 0,
        emailProductsRefreshed,
        duration,
        apiCallsMade,
        error: lastError?.message,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed sync
      await admin.from('pricing_sync_log').insert({
        sync_type: 'email',
        pricing_type: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        status: 'failed',
        tlds_refreshed: 0,
        email_products_refreshed: emailProductsRefreshed,
        duration_ms: duration,
        api_calls_made: apiCallsMade,
        error_message: errorMsg,
        error_details: error instanceof Error ? { name: error.name, stack: error.stack } : error,
        completed_at: new Date().toISOString(),
      });
      
      return {
        success: false,
        syncType: 'email',
        pricingType: pricingTypes.length === 1 ? pricingTypes[0] : 'all',
        tldsRefreshed: 0,
        emailProductsRefreshed,
        duration,
        apiCallsMade,
        error: errorMsg,
        errorDetails: error,
      };
    }
  },
  
  /**
   * Get cached domain pricing (with fallback to live API if cache is stale/missing)
   */
  async getCachedDomainPrice(
    tld: string,
    customerId: string,
    pricingType: 'customer' | 'reseller' | 'cost' = 'customer',
    maxAgeHours = 24
  ): Promise<DomainPrice | null> {
    const admin = createAdminClient() as SupabaseClient;
    
    try {
      const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
      
      const { data: cached } = await admin
        .from('domain_pricing_cache')
        .select('*')
        .eq('tld', tld)
        .eq('pricing_type', pricingType)
        .gte('last_refreshed_at', maxAge)
        .single();
      
      if (cached) {
        // Convert from cache format to DomainPrice
        return {
          register: {
            1: toDollars(cached.register_1yr),
            ...(cached.register_2yr ? { 2: toDollars(cached.register_2yr) } : {}),
            ...(cached.register_3yr ? { 3: toDollars(cached.register_3yr) } : {}),
            ...(cached.register_5yr ? { 5: toDollars(cached.register_5yr) } : {}),
            ...(cached.register_10yr ? { 10: toDollars(cached.register_10yr) } : {}),
          },
          renew: {
            1: toDollars(cached.renew_1yr),
            ...(cached.renew_2yr ? { 2: toDollars(cached.renew_2yr) } : {}),
            ...(cached.renew_3yr ? { 3: toDollars(cached.renew_3yr) } : {}),
            ...(cached.renew_5yr ? { 5: toDollars(cached.renew_5yr) } : {}),
            ...(cached.renew_10yr ? { 10: toDollars(cached.renew_10yr) } : {}),
          },
          transfer: toDollars(cached.transfer_price),
          ...(cached.restore_price ? { restore: toDollars(cached.restore_price) } : {}),
          currency: cached.currency,
        };
      }
      
      // Cache miss or stale - fetch live and cache in background (don't await)
      console.log(`[PricingCache] Cache miss for ${tld} ${pricingType}, fetching live...`);
      this.refreshDomainPricing(customerId, [pricingType], [tld]).catch(err => {
        console.error('[PricingCache] Background refresh failed:', err);
      });
      
      // Return live data immediately
      if (pricingType === 'customer') {
        // customer-price.json works without customer-id
        const prices = await domainService.getCustomerPricing(customerId || undefined, [tld]);
        return prices[tld] || null;
      } else if (pricingType === 'cost') {
        const prices = await domainService.getResellerCostPricing([tld]);
        return prices[tld] || null;
      } else {
        const prices = await domainService.getResellerPricing([tld]);
        return prices[tld] || null;
      }
    } catch (error) {
      console.error('[PricingCache] Error getting cached price:', error);
      return null;
    }
  },
  
  /**
   * Get cached email pricing for all slabs and tenures
   * Returns structured data matching the RC API response shape
   */
  async getCachedEmailPricing(
    productKey: string = 'eeliteus',
    pricingType: 'customer' | 'reseller' | 'cost' = 'customer',
    maxAgeHours = 24
  ): Promise<EmailPricingResponse | null> {
    const admin = createAdminClient() as SupabaseClient;
    
    try {
      const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
      
      const { data: cached } = await admin
        .from('email_pricing_cache')
        .select('*')
        .eq('product_key', productKey)
        .eq('pricing_type', pricingType)
        .gte('last_refreshed_at', maxAge);
      
      if (!cached || cached.length === 0) {
        return null; // Cache miss — caller should fetch live
      }
      
      // Reconstruct the RC response structure from cached rows
      // { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": price, "12": price }, "renew": {...} } } } }
      const ranges: Record<string, { add: Record<string, number>; renew: Record<string, number> }> = {};
      
      for (const row of cached) {
        const slab = row.account_slab || '1-5';
        if (!ranges[slab]) {
          ranges[slab] = { add: {}, renew: {} };
        }
        if (row.add_account_price != null) {
          ranges[slab].add[String(row.months)] = toDollars(row.add_account_price);
        }
        if (row.renew_account_price != null) {
          ranges[slab].renew[String(row.months)] = toDollars(row.renew_account_price);
        }
      }
      
      return {
        [productKey]: {
          email_account_ranges: ranges,
        },
      } as EmailPricingResponse;
    } catch (error) {
      console.error('[PricingCache] Error getting cached email pricing:', error);
      return null;
    }
  },
  
  /**
   * Get ALL cached email plans merged into a single RC-shaped response.
   * Returns all product keys that have been cached (e.g. eeliteus, enterpriseemailus, + any
   * dynamically discovered plans such as Professional) in one `EmailPricingResponse`.
   */
  async getAllCachedEmailPlans(
    pricingType: 'customer' | 'reseller' | 'cost' = 'customer',
    maxAgeHours = 24
  ): Promise<EmailPricingResponse | null> {
    const admin = createAdminClient() as SupabaseClient;

    try {
      const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

      const { data: cached } = await admin
        .from('email_pricing_cache')
        .select('*')
        .eq('pricing_type', pricingType)
        .gte('last_refreshed_at', maxAge);

      if (!cached || cached.length === 0) {
        return null;
      }

      // Group rows by product_key → slab → action → months
      const products: Record<string, Record<string, { add: Record<string, number>; renew: Record<string, number> }>> = {};

      for (const row of cached) {
        const key = row.product_key as string;
        const slab = (row.account_slab as string) || '1-5';

        if (!products[key]) products[key] = {};
        if (!products[key][slab]) products[key][slab] = { add: {}, renew: {} };

        if (row.add_account_price != null) {
          products[key][slab].add[String(row.months)] = toDollars(row.add_account_price as number);
        }
        if (row.renew_account_price != null) {
          products[key][slab].renew[String(row.months)] = toDollars(row.renew_account_price as number);
        }
      }

      if (Object.keys(products).length === 0) return null;

      // Reconstruct RC-shaped response
      const result: EmailPricingResponse = {};
      for (const [key, ranges] of Object.entries(products)) {
        result[key] = { email_account_ranges: ranges };
      }
      return result;
    } catch (error) {
      console.error('[PricingCache] Error getting all cached email plans:', error);
      return null;
    }
  },

  /**
   * Check if pricing cache is stale
   */
  async isCacheStale(
    cacheType: 'domain' | 'email' = 'domain',
    maxAgeHours = 24
  ): Promise<boolean> {
    const admin = createAdminClient() as SupabaseClient;
    
    try {
      const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
      
      const table = cacheType === 'domain' ? 'domain_pricing_cache' : 'email_pricing_cache';
      
      const { count } = await admin
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('pricing_type', 'customer')
        .gte('last_refreshed_at', maxAge);
      
      // Stale if no cached entries or count is 0
      return count === null || count === 0;
    } catch (error) {
      console.error('[PricingCache] Error checking cache staleness:', error);
      return true; // Assume stale on error
    }
  },
};

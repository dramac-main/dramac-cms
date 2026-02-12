"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { isConfigured } from "@/lib/resellerclub/config";
import { isClientAvailable } from "@/lib/resellerclub/client";
import { domainService } from "@/lib/resellerclub/domains";
import { customerService } from "@/lib/resellerclub/customers";
import { contactService } from "@/lib/resellerclub/contacts";
import { arePurchasesAllowed } from "@/lib/resellerclub/config";
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

export async function searchDomains(
  keyword: string,
  tlds?: string[]
): Promise<{ success: boolean; data?: DomainSearchResult[]; error?: string }> {
  const supabase = await createClient();
  
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
    // Clean keyword
    const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanKeyword || cleanKeyword.length < 2) {
      return { success: false, error: 'Keyword must be at least 2 characters' };
    }
    
    const popularTlds = tlds || ['.com', '.net', '.org', '.io', '.co', '.app', '.dev'];

    // Get agency markup settings for retail pricing
    const { data: pricing } = await getTable(supabase, 'agency_domain_pricing')
      .select('default_markup_type, default_markup_value')
      .eq('agency_id', profile.agency_id)
      .maybeSingle() as { data: { default_markup_type?: string; default_markup_value?: number } | null };

    const markupType = pricing?.default_markup_type || 'percentage';
    const markupValue = pricing?.default_markup_value ?? 30;

    const calculateRetail = (wholesale: number): number => {
      if (markupType === 'fixed') return Math.round((wholesale + markupValue) * 100) / 100;
      return Math.round(wholesale * (1 + markupValue / 100) * 100) / 100;
    };

    // Try ResellerClub API first (live data)
    if (isClientAvailable()) {
      try {
        // Check availability via real API
        const availability = await domainService.suggestDomains(cleanKeyword, popularTlds);
        
        // Get real pricing from ResellerClub
        let apiPrices: Record<string, { register: Record<number, number>; renew: Record<number, number>; transfer: number }> = {};
        try {
          const rcPrices = await domainService.getPricing(popularTlds);
          apiPrices = Object.fromEntries(
            Object.entries(rcPrices).map(([tld, price]) => [tld, {
              register: Object.fromEntries(Object.entries(price.register).filter(([, v]) => v != null)) as Record<number, number>,
              renew: Object.fromEntries(Object.entries(price.renew).filter(([, v]) => v != null)) as Record<number, number>,
              transfer: price.transfer,
            }])
          );
        } catch {
          console.warn('[Domains] Could not fetch RC pricing, using defaults');
        }

        const results: DomainSearchResult[] = availability.map(item => {
          const tld = domainService.extractTld(item.domain);
          const rcPrice = apiPrices[tld];
          const basePrice = rcPrice?.register?.[1] || 12.99;
          
          // If the API returned 'unknown' status (no matching key in response),
          // mark as unverified so the UI shows a warning instead of "Already registered"
          const isUnknown = item.status === 'unknown';
          
          return {
            domain: item.domain,
            tld,
            available: item.status === 'available',
            ...(isUnknown ? { unverified: true } : {}),
            premium: item.status === 'premium',
            prices: {
              register: rcPrice?.register || { 1: basePrice, 2: basePrice * 1.9, 3: basePrice * 2.8 },
              renew: rcPrice?.renew || { 1: basePrice * 1.1 },
              transfer: rcPrice?.transfer || basePrice * 0.9,
            },
            retailPrices: {
              register: Object.fromEntries(
                Object.entries(rcPrice?.register || { 1: basePrice }).map(([y, p]) => [y, calculateRetail(p)])
              ) as Record<number, number>,
              renew: Object.fromEntries(
                Object.entries(rcPrice?.renew || { 1: basePrice * 1.1 }).map(([y, p]) => [y, calculateRetail(p)])
              ) as Record<number, number>,
              transfer: calculateRetail(rcPrice?.transfer || basePrice * 0.9),
            },
          };
        });
        
        results.sort((a, b) => {
          if (a.available && !b.available) return -1;
          if (!a.available && b.available) return 1;
          return (a.retailPrices.register[1] || 0) - (b.retailPrices.register[1] || 0);
        });
        
        return { success: true, data: results };
      } catch (apiError) {
        console.error('[Domains] ResellerClub API search failed:', apiError);
        // Fall through to DNS/RDAP fallback below
      }
    } else {
      console.warn('[Domains] ResellerClub API not available — isClientAvailable() returned false');
    }
    
    // Fallback: Use DNS/RDAP to check domain availability
    // This gives much better results than blindly marking everything as "unavailable"
    const fallbackPrices: Record<string, number> = {
      '.com': 12.99, '.net': 14.99, '.org': 13.99, '.io': 39.99,
      '.co': 29.99, '.app': 19.99, '.dev': 15.99,
    };
    
    // Import and run the DNS/RDAP fallback checker
    let fallbackAvailability: Array<{ domain: string; available: boolean }> = [];
    try {
      const { checkAvailabilityFallback } = await import('@/lib/domain-availability-fallback');
      const domainNames = popularTlds.map(tld => cleanKeyword + tld);
      const fbResults = await checkAvailabilityFallback(domainNames);
      fallbackAvailability = fbResults.map(r => ({ domain: r.domain, available: r.available }));
      console.log('[Domains] Fallback availability results:', JSON.stringify(fallbackAvailability));
    } catch (fbError) {
      console.error('[Domains] DNS/RDAP fallback also failed:', fbError);
    }
    
    const results: DomainSearchResult[] = popularTlds.map(tld => {
      const domainName = cleanKeyword + tld;
      const basePrice = fallbackPrices[tld] || 15.99;
      const fbResult = fallbackAvailability.find(r => r.domain === domainName);
      
      return {
        domain: domainName,
        tld,
        available: fbResult?.available ?? false,
        unverified: true, // Always true for fallback — results are heuristic-based
        premium: false,
        prices: {
          register: { 1: basePrice, 2: basePrice * 1.9, 3: basePrice * 2.8 } as Record<number, number>,
          renew: { 1: basePrice * 1.1 } as Record<number, number>,
          transfer: basePrice * 0.9,
        },
        retailPrices: {
          register: { 
            1: calculateRetail(basePrice), 
            2: calculateRetail(basePrice * 1.9), 
            3: calculateRetail(basePrice * 2.8) 
          } as Record<number, number>,
          renew: { 1: calculateRetail(basePrice * 1.1) } as Record<number, number>,
          transfer: calculateRetail(basePrice * 0.9),
        },
      };
    });
    
    results.sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return (a.retailPrices.register[1] || 0) - (b.retailPrices.register[1] || 0);
    });
    
    return { success: true, data: results };
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
    const sld = parts.join('.');
    
    let orderId: string;
    let customerId: string;
    let contactId: string;
    let registrationViaApi = false;

    // Try real ResellerClub registration
    if (isClientAvailable()) {
      try {
        // Ensure agency has a ResellerClub customer
        const rcCustomerId = await ensureResellerClubCustomer(
          profile.agency_id, 
          user.email || `agency-${profile.agency_id}@dramacagency.com`
        );
        
        if (!rcCustomerId) {
          return { success: false, error: 'Failed to provision domain services for your agency. Please check ResellerClub configuration.' };
        }

        customerId = rcCustomerId;

        // Create or get a default contact for this customer
        const contact = await contactService.createOrUpdate({
          name: params.contactInfo?.name || user.user_metadata?.full_name || 'Domain Admin',
          company: params.contactInfo?.company || 'Agency',
          email: params.contactInfo?.email || user.email || '',
          addressLine1: params.contactInfo?.address || 'Not Provided',
          city: params.contactInfo?.city || 'Lusaka',
          state: params.contactInfo?.state || 'Lusaka',
          country: params.contactInfo?.country || 'ZM',
          zipcode: params.contactInfo?.zipcode || '10101',
          phoneCountryCode: '260',
          phone: params.contactInfo?.phone || '955000000',
          customerId: rcCustomerId,
          type: 'Contact',
        });

        contactId = String(contact.contactId);

        // Register domain via ResellerClub API
        const result = await domainService.register({
          domainName: params.domainName,
          years: params.years,
          customerId: rcCustomerId,
          registrantContactId: contactId,
          adminContactId: contactId,
          techContactId: contactId,
          billingContactId: contactId,
          purchasePrivacy: params.privacy ?? true,
          nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        });
        
        orderId = result.orderId;
        registrationViaApi = true;
      } catch (apiError) {
        console.error('[Domains] ResellerClub registration failed:', apiError);
        return { 
          success: false, 
          error: apiError instanceof Error ? apiError.message : 'Domain registration failed. Please try again.' 
        };
      }
    } else {
      // No API configured — cannot register domains
      return { 
        success: false, 
        error: 'Domain registration service is not configured. Please set up ResellerClub API credentials in Settings → Domain Services.' 
      };
    }
    
    // Calculate expiry date
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setFullYear(expiryDate.getFullYear() + params.years);
    
    // Create domain record in our database
    const domainData = {
      agency_id: profile.agency_id,
      client_id: params.clientId || null,
      domain_name: params.domainName.toLowerCase(),
      tld,
      sld,
      resellerclub_order_id: orderId,
      resellerclub_customer_id: customerId,
      registration_date: now.toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'active',
      auto_renew: params.autoRenew ?? true,
      whois_privacy: params.privacy ?? true,
      registrant_contact_id: contactId,
      admin_contact_id: contactId,
      tech_contact_id: contactId,
      billing_contact_id: contactId,
      nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      registered_via_api: registrationViaApi,
    };
    
    const { data: domain, error: insertError } = await getTable(admin, 'domains')
      .insert(domainData)
      .select()
      .single() as { data: AnyRecord | null; error: { message: string } | null };
    
    if (insertError) {
      console.error('[Domains] DB insert error:', insertError);
      // Domain was registered at RC but DB insert failed - still return success with order ID
      revalidatePath('/dashboard/domains');
      return { 
        success: true, 
        data: {
          domainId: orderId,
          orderId,
          domain: params.domainName,
        }
      };
    }
    
    const domainId = (domain as AnyRecord)?.id as string;
    
    // Create order record with real pricing
    let orderWholesale = 0;
    let orderRetail = 0;
    try {
      const { calculateDomainPrice } = await import('@/lib/actions/domain-billing');
      const pricing = await calculateDomainPrice({
        tld,
        years: params.years,
        operation: 'register',
        includePrivacy: params.privacy ?? true,
        clientId: params.clientId,
      });
      if (pricing.success && pricing.data) {
        orderWholesale = pricing.data.total_wholesale;
        orderRetail = pricing.data.total_retail;
      }
    } catch {
      // Use 0 if pricing calculation fails
    }

    const orderData = {
      agency_id: profile.agency_id,
      domain_id: domainId,
      order_type: 'registration',
      domain_name: params.domainName,
      years: params.years,
      wholesale_price: orderWholesale,
      retail_price: orderRetail,
      resellerclub_order_id: orderId,
      status: 'completed',
      payment_status: 'paid',
      completed_at: new Date().toISOString(),
    };
    
    await getTable(admin, 'domain_orders').insert(orderData);
    
    revalidatePath('/dashboard/domains');
    
    return { 
      success: true, 
      data: {
        domainId,
        orderId,
        domain: params.domainName,
      }
    };
  } catch (error) {
    console.error('[Domains] Registration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
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
  data?: { newExpiryDate: string };
  error?: string;
}> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  try {
    // Get domain
    const { data: domain, error } = await getTable(supabase, 'domains')
      .select('*')
      .eq('id', domainId)
      .single() as { data: AnyRecord | null; error: { message: string } | null };
    
    if (error || !domain) {
      return { success: false, error: 'Domain not found' };
    }
    
    // Try real ResellerClub renewal
    if (isClientAvailable() && domain.resellerclub_order_id) {
      try {
        await domainService.renew({
          orderId: String(domain.resellerclub_order_id),
          years,
        });
      } catch (apiError) {
        console.error('[Domains] RC renewal failed:', apiError);
        return { 
          success: false, 
          error: apiError instanceof Error ? apiError.message : 'Renewal failed at registrar' 
        };
      }
    }
    
    // Calculate new expiry
    const currentExpiry = new Date(domain.expiry_date as string);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + years);
    
    // Update domain in database
    await getTable(admin, 'domains')
      .update({
        expiry_date: newExpiry.toISOString(),
        last_renewed_at: new Date().toISOString(),
      })
      .eq('id', domainId);
    
    // Create order record with real pricing
    let renewWholesale = 0;
    let renewRetail = 0;
    try {
      const { calculateDomainPrice } = await import('@/lib/actions/domain-billing');
      const tld = '.' + (domain.domain_name as string).split('.').pop();
      const pricing = await calculateDomainPrice({
        tld,
        years,
        operation: 'renew',
      });
      if (pricing.success && pricing.data) {
        renewWholesale = pricing.data.total_wholesale;
        renewRetail = pricing.data.total_retail;
      }
    } catch {
      // Use 0 if pricing calculation fails
    }

    await getTable(admin, 'domain_orders')
      .insert({
        agency_id: domain.agency_id,
        domain_id: domainId,
        order_type: 'renewal',
        domain_name: domain.domain_name,
        years,
        wholesale_price: renewWholesale,
        retail_price: renewRetail,
        resellerclub_order_id: domain.resellerclub_order_id || `RENEW-${Date.now()}`,
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
      });
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath('/dashboard/domains');
    
    return { success: true, data: { newExpiryDate: newExpiry.toISOString() } };
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

"use server";

/**
 * Business Email Server Actions
 * 
 * Server actions for managing Business Email (Titan) orders via ResellerClub.
 * This is separate from transactional email actions in email.ts
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  emailOrderService, 
  emailAccountService, 
  businessEmailApi,
  emailDnsService,
  titanMailApi,
  TITAN_PLAN_IDS,
} from "@/lib/resellerclub/email";
import { pricingCacheService } from "@/lib/resellerclub/pricing-cache";
import type { 
  EmailOrder, 
  EmailAccount, 
  EmailPricingResponse,
  EmailDnsRecords,
} from "@/lib/resellerclub/email/types";

// ============================================================================
// Email Order Actions
// ============================================================================

/**
 * Create a new Business Email order
 */
export async function createBusinessEmailOrder(formData: FormData): Promise<{
  success: boolean;
  data?: { 
    pendingPurchaseId?: string; 
    transactionId?: string;
    checkoutUrl?: string; 
    status?: string; 
    order?: EmailOrder;
  };
  error?: string;
}> {
  const supabase = await createClient();
  
  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  // Get user's agency
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  try {
    const domainId = formData.get('domainId') as string | null;
    const domainName = formData.get('domainName') as string;
    const numberOfAccounts = parseInt(formData.get('numberOfAccounts') as string);
    const months = parseInt(formData.get('months') as string);
    const clientId = formData.get('clientId') as string | null;
    const productKey = (formData.get('productKey') as string | null) || 'eeliteus';
    const planIdRaw = formData.get('planId') as string | null;
    const planId = planIdRaw ? parseInt(planIdRaw) : null;

    // Validate inputs
    if (!domainName) {
      return { success: false, error: 'Domain name is required' };
    }
    if (isNaN(numberOfAccounts) || numberOfAccounts < 1) {
      return { success: false, error: 'Invalid number of accounts' };
    }
    if (isNaN(months) || ![1, 3, 6, 12].includes(months)) {
      return { success: false, error: 'Invalid subscription period. Choose 1, 3, 6, or 12 months.' };
    }

    // Get customer ID from agency — create one if it doesn't exist yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agency } = await (supabase as any)
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();

    let customerId = agency?.resellerclub_customer_id;
    
    // Guard against stringified falsy values ("undefined", "null", "") stored in DB
    if (customerId === 'undefined' || customerId === 'null' || customerId?.trim() === '') {
      console.warn(`[BusinessEmail] Clearing invalid RC customer ID "${customerId}"`);
      customerId = undefined;
    }

    if (!customerId) {
      // Auto-create ResellerClub customer for this agency
      try {
        const { ensureResellerClubCustomerForAgency } = await import('@/lib/actions/domains');
        customerId = await ensureResellerClubCustomerForAgency(profile.agency_id, user.email || '');
      } catch {
        // Fallback: try inline creation
      }
    }
    
    if (!customerId) {
      return { success: false, error: 'Agency not configured for email services. Please search for a domain first to set up your account.' };
    }

    // Calculate pricing using cached customer pricing from ResellerClub
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agencyPricing } = await (supabase as any)
      .from('agency_domain_pricing')
      .select('default_markup_type, default_markup_value, pricing_source, apply_platform_markup')
      .eq('agency_id', profile.agency_id)
      .single();

    // Try to get customer pricing first (includes RC markups)
    const rawCustomerPricing = await businessEmailApi.getCustomerPricing(customerId);
    const customerPricing = flattenTitanMailPricing(rawCustomerPricing);
    
    // Calculate base price from customer pricing for the selected plan
    const basePrice = calculateBasePrice(customerPricing, months, numberOfAccounts, productKey);
    
    // Get wholesale cost for margin tracking
    const rawWholesalePricing = await businessEmailApi.getResellerCostPricing();
    const wholesalePricing = flattenTitanMailPricing(rawWholesalePricing);
    const wholesalePrice = calculateBasePrice(wholesalePricing, months, numberOfAccounts, productKey);
    
    console.log(`[BusinessEmail] Pricing for ${domainName}: ${numberOfAccounts} accounts × ${months}mo → base=$${basePrice.toFixed(2)}, wholesale=$${wholesalePrice.toFixed(2)}`);
    
    // Calculate retail price
    let retailPrice = basePrice;
    
    // Apply additional platform markup only if configured
    if (agencyPricing?.apply_platform_markup) {
      retailPrice = applyMarkup(
        basePrice, 
        agencyPricing.default_markup_type || 'percentage', 
        agencyPricing.default_markup_value || 0
      );
    }

    // Guard: prevent $0 Paddle transactions (e.g. missing pricing for selected month)
    if (!retailPrice || retailPrice <= 0) {
      return { success: false, error: `Unable to calculate price for ${months}-month plan. Please try a different period.` };
    }

    // Create Paddle transaction for payment
    const { createEmailPurchase } = await import('@/lib/paddle/transactions');
    
    // Resolve the Titan Mail plan-id if the product key is a Titan Mail variant
    const resolvedPlanId = planId || resolveTitanPlanId(productKey);

    const purchase = await createEmailPurchase({
      agencyId: profile.agency_id,
      userId: user.id,
      clientId: clientId || undefined,
      domainId: domainId || undefined,
      domainName,
      numberOfAccounts,
      months,
      productKey,
      planId: resolvedPlanId || undefined,
      wholesaleAmount: wholesalePrice,
      retailAmount: retailPrice,
      currency: 'USD',
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
    console.error('Create business email order error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create email order' 
    };
  }
}

/**
 * Get all email orders for the current agency
 */
export async function getBusinessEmailOrders(): Promise<{
  success: boolean;
  data?: EmailOrder[];
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
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('email_orders')
    .select(`
      *,
      domain:domains(id, domain_name, status),
      client:clients(id, name)
    `)
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as EmailOrder[] };
}

/**
 * Get a single email order by ID
 */
export async function getBusinessEmailOrder(orderId: string): Promise<{
  success: boolean;
  data?: EmailOrder;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('email_orders')
    .select(`
      *,
      domain:domains(id, domain_name, status, cloudflare_zone_id),
      client:clients(id, name)
    `)
    .eq('id', orderId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as EmailOrder };
}

/**
 * Configure DNS records for email
 */
export async function configureBusinessEmailDns(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get order with domain
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('email_orders')
      .select(`
        *,
        domain:domains(cloudflare_zone_id)
      `)
      .eq('id', orderId)
      .single();

    if (!order) {
      return { success: false, error: 'Email order not found' };
    }

    const domain = order.domain as { cloudflare_zone_id: string | null } | null;
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not configured with Cloudflare' };
    }

    await emailOrderService.configureDns(orderId, domain.cloudflare_zone_id);
    
    revalidatePath(`/dashboard/domains/${order.domain_id}`);
    revalidatePath('/dashboard/email');
    
    return { success: true };
  } catch (error) {
    console.error('Configure business email DNS error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to configure DNS' 
    };
  }
}

/**
 * Sync email order from ResellerClub
 */
export async function syncBusinessEmailOrder(orderId: string): Promise<{
  success: boolean;
  data?: EmailOrder;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const order = await emailOrderService.syncOrder(orderId);
    
    revalidatePath('/dashboard/email');
    revalidatePath(`/dashboard/email/${orderId}`);
    
    return { success: true, data: order };
  } catch (error) {
    console.error('Sync business email order error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync order' 
    };
  }
}

/**
 * Renew email order
 */
export async function renewBusinessEmailOrder(
  orderId: string, 
  months: number
): Promise<{
  success: boolean;
  data?: EmailOrder;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    if (![1, 3, 6, 12].includes(months)) {
      return { success: false, error: 'Invalid renewal period. Choose 1, 3, 6, or 12 months.' };
    }

    const order = await emailOrderService.renewOrder(orderId, months);
    
    revalidatePath('/dashboard/email');
    revalidatePath(`/dashboard/email/${orderId}`);
    
    return { success: true, data: order };
  } catch (error) {
    console.error('Renew business email order error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to renew order' 
    };
  }
}

// ============================================================================
// Email Account Actions
// ============================================================================

/**
 * Get email order stats for the current agency
 */
export async function getBusinessEmailStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    active: number;
    accounts: number;
    expiringSoon: number;
  };
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
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  // Get counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase as any)
    .from('email_orders')
    .select('id, status, number_of_accounts, used_accounts, expiry_date')
    .eq('agency_id', profile.agency_id);

  if (!orders) return { success: true, data: { total: 0, active: 0, accounts: 0, expiringSoon: 0 } };

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: orders.length,
    active: orders.filter((o: { status: string }) => o.status === 'Active').length,
    accounts: orders.reduce((sum: number, o: { used_accounts: number }) => sum + o.used_accounts, 0),
    expiringSoon: orders.filter((o: { expiry_date: string }) => new Date(o.expiry_date) < thirtyDaysFromNow).length,
  };

  return { success: true, data: stats };
}

/**
 * Create a new email account
 */
export async function createBusinessEmailAccount(formData: FormData): Promise<{
  success: boolean;
  data?: EmailAccount;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const emailOrderId = formData.get('emailOrderId') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    // Validate inputs
    if (!emailOrderId) {
      return { success: false, error: 'Email order ID is required' };
    }
    if (!username || username.length < 1) {
      return { success: false, error: 'Username is required' };
    }
    if (!password || password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }
    if (!firstName || !lastName) {
      return { success: false, error: 'First name and last name are required' };
    }

    // Verify user has access to this order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('email_orders')
      .select('id')
      .eq('id', emailOrderId)
      .single();

    if (!order) {
      return { success: false, error: 'Email order not found' };
    }

    const account = await emailAccountService.createAccount({
      emailOrderId,
      username,
      password,
      firstName,
      lastName,
    });

    revalidatePath(`/dashboard/email/${emailOrderId}`);
    revalidatePath('/dashboard/email');
    
    return { success: true, data: account };
  } catch (error) {
    console.error('Create business email account error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create email account' 
    };
  }
}

/**
 * Delete an email account
 */
export async function deleteBusinessEmailAccount(accountId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    await emailAccountService.deleteAccount(accountId);
    
    revalidatePath('/dashboard/email');
    
    return { success: true };
  } catch (error) {
    console.error('Delete business email account error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete email account' 
    };
  }
}

/**
 * Get email accounts for an order
 */
export async function getBusinessEmailAccounts(emailOrderId: string): Promise<{
  success: boolean;
  data?: EmailAccount[];
  error?: string;
}> {
  try {
    const accounts = await emailAccountService.listAccounts(emailOrderId);
    return { success: true, data: accounts };
  } catch (error) {
    console.error('Get business email accounts error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get email accounts' 
    };
  }
}

/**
 * Sync email accounts from ResellerClub
 */
export async function syncBusinessEmailAccounts(emailOrderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    await emailAccountService.syncAccounts(emailOrderId);
    
    revalidatePath(`/dashboard/email/${emailOrderId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Sync business email accounts error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync accounts' 
    };
  }
}

// ============================================================================
// Pricing Actions
// ============================================================================

/**
 * Get email pricing from ResellerClub — uses cache with live fallback.
 * Returns both 'add' (new purchase) and 'renew' pricing for all slabs.
 * Prices auto-update via daily cron job (/api/cron/resellerclub-sync).
 * 
 * When you update prices in ResellerClub panel, the daily sync picks them up
 * automatically. You can also force a refresh via POST /api/admin/pricing/refresh.
 */
export async function getBusinessEmailPricing(): Promise<{
  success: boolean;
  data?: EmailPricingResponse;
  costData?: EmailPricingResponse;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();
    if (!profile?.agency_id) return { success: false, error: 'No agency found' };

    // Get customer ID from agency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agency } = await (supabase as any)
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();

    let customerId = agency?.resellerclub_customer_id;
    if (customerId === 'undefined' || customerId === 'null' || customerId?.trim() === '') {
      customerId = undefined;
    }

    // Try cache first (refreshed daily by cron), fall back to live API
    let customerPricing: EmailPricingResponse | null = null;
    let costPricing: EmailPricingResponse | null = null;
    
    // 1. Try cache — get ALL email plans in a single query (includes Business, Enterprise,
    //    Professional, and any other plan the RC account has enabled).
    customerPricing = await pricingCacheService.getAllCachedEmailPlans('customer');

    // If cache hit but no Titan Mail plans, the cache pre-dates Titan Mail support.
    // Bypass it and fetch live so the wizard shows all plans; background refresh will
    // repopulate the cache with synthetic Titan Mail keys for the next request.
    const cacheMissingTitanMail = customerPricing !== null &&
      !Object.keys(customerPricing).some(k => k.startsWith('titanmail'));

    if (!customerPricing || cacheMissingTitanMail) {
      // Cache miss or incomplete — fetch live from RC (returns ALL products in one call)
      console.log(
        cacheMissingTitanMail
          ? '[BusinessEmail] Customer pricing cache incomplete (no Titan Mail plans), fetching live...'
          : '[BusinessEmail] Customer pricing cache miss, fetching live...'
      );
      try {
        customerPricing = customerId
          ? await businessEmailApi.getCustomerPricing(customerId)
          : await businessEmailApi.getResellerPricing();

        // Trigger background cache refresh (auto-discovers all plans including Titan Mail)
        if (customerId) {
          pricingCacheService.refreshEmailPricing(customerId, ['customer']).catch(err => {
            console.error('[BusinessEmail] Background cache refresh failed:', err);
          });
        }
      } catch (error) {
        console.error('[BusinessEmail] Live pricing fetch failed:', error);
        return { success: false, error: 'Failed to load pricing from provider' };
      }
    }

    // 2. Try cached cost pricing (for margin tracking) — all plans
    costPricing = await pricingCacheService.getAllCachedEmailPlans('cost');
    
    if (!costPricing) {
      try {
        costPricing = await businessEmailApi.getResellerCostPricing();
      } catch {
        // Cost pricing is optional — continue without it
      }
    }

    // Flatten any nested Titan Mail pricing (titanmailglobal → per-plan synthetic keys)
    // RC returns plan-specific pricing under the parent key; we normalise them into
    // separate top-level keys (e.g. titanmailglobal_1762) so the wizard treats them
    // as distinct purchaseable plans.
    customerPricing = flattenTitanMailPricing(customerPricing || {});
    costPricing = costPricing ? flattenTitanMailPricing(costPricing) : costPricing;

    // ── Filter plans down to only what the wizard should show ──
    // 1. Remove India-region plans (titanmailindia_*)
    // 2. Remove free-trial plans where every add price is $0
    // 3. Remove legacy pre-Titan products (eeliteus, enterpriseemailus)
    //    when Titan Mail plans are available — Titan replaces them.
    customerPricing = filterWizardPlans(customerPricing);
    costPricing = costPricing ? filterWizardPlans(costPricing) : costPricing;

    // Log available plans AFTER flattening + filtering
    const availablePlans = Object.keys(customerPricing).filter(k =>
      (customerPricing?.[k] as { email_account_ranges?: unknown })?.email_account_ranges
    );
    console.log(`[BusinessEmail] Pricing loaded — available plans: ${availablePlans.join(', ')}`);

    return {
      success: true,
      data: customerPricing || undefined,
      costData: costPricing || undefined,
    };
  } catch (error) {
    console.error('Get business email pricing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get pricing' 
    };
  }
}

// ============================================================================
// DNS Actions
// ============================================================================

/**
 * Get email DNS records for an order
 */
export async function getBusinessEmailDnsRecords(orderId: string): Promise<{
  success: boolean;
  data?: EmailDnsRecords;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('email_orders')
      .select('resellerclub_order_id')
      .eq('id', orderId)
      .single();

    if (!order) {
      return { success: false, error: 'Email order not found' };
    }

    const records = await emailDnsService.getDnsRecords(order.resellerclub_order_id);
    return { success: true, data: records };
  } catch (error) {
    console.error('Get business email DNS records error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get DNS records' 
    };
  }
}

/**
 * Verify email DNS configuration
 */
export async function verifyBusinessEmailDns(orderId: string): Promise<{
  success: boolean;
  data?: {
    mxConfigured: boolean;
    spfConfigured: boolean;
    dkimConfigured: boolean;
    issues: string[];
  };
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get order with domain
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await (supabase as any)
      .from('email_orders')
      .select(`
        *,
        domain:domains(cloudflare_zone_id)
      `)
      .eq('id', orderId)
      .single();

    if (!order) {
      return { success: false, error: 'Email order not found' };
    }

    const domain = order.domain as { cloudflare_zone_id: string | null } | null;
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not configured with Cloudflare' };
    }

    const result = await emailDnsService.verifyDnsRecords(domain.cloudflare_zone_id);
    return { success: true, data: result };
  } catch (error) {
    console.error('Verify business email DNS error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify DNS' 
    };
  }
}

// ============================================================================
// Domain-Specific Email Actions
// ============================================================================

/**
 * Get email order for a specific domain by domain ID
 * Returns the email order with accounts if exists, or null if no email purchased
 */
export async function getBusinessEmailOrderByDomainId(domainId: string): Promise<{
  success: boolean;
  data?: {
    order: EmailOrder | null;
    accounts: EmailAccount[];
    domain: {
      id: string;
      domain_name: string;
      status: string;
      cloudflare_zone_id: string | null;
    } | null;
  };
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get the domain first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: domain, error: domainError } = await (supabase as any)
      .from('domains')
      .select('id, domain_name, status, cloudflare_zone_id')
      .eq('id', domainId)
      .single();

    if (domainError || !domain) {
      return { success: false, error: 'Domain not found' };
    }

    // Get email order for this domain
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (supabase as any)
      .from('email_orders')
      .select('*')
      .eq('domain_id', domainId)
      .maybeSingle();

    if (orderError) {
      return { success: false, error: orderError.message };
    }

    // If no order, return domain info with null order
    if (!order) {
      return {
        success: true,
        data: {
          order: null,
          accounts: [],
          domain: domain as {
            id: string;
            domain_name: string;
            status: string;
            cloudflare_zone_id: string | null;
          },
        },
      };
    }

    // Get accounts for this order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: accounts, error: accountsError } = await (supabase as any)
      .from('email_accounts')
      .select('*')
      .eq('email_order_id', order.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (accountsError) {
      return { success: false, error: accountsError.message };
    }

    return {
      success: true,
      data: {
        order: order as EmailOrder,
        accounts: (accounts || []) as EmailAccount[],
        domain: domain as {
          id: string;
          domain_name: string;
          status: string;
          cloudflare_zone_id: string | null;
        },
      },
    };
  } catch (error) {
    console.error('Get business email order by domain ID error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get email order',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Flatten Titan Mail pricing into the standard `email_account_ranges` shape.
 *
 * RC returns Titan Mail with `plans` instead of `email_account_ranges`:
 *
 * Shape A — plans keyed by plan-id with direct add/renew pricing:
 *   titanmailglobal: { plans: { "1762": { add: { "1": 0.60, "12": 5.76 }, renew: {...} }, "1756": {...} } }
 *
 * Shape B — plans keyed by plan-id with slab sub-structure:
 *   titanmailglobal: { plans: { "1762": { email_account_ranges: { "1-5": { add: {...}, renew: {...} } } } } }
 *
 * In both cases we convert each plan into a synthetic top-level key
 * `titanmailglobal_<planId>` with a standard `email_account_ranges` shape.
 *
 * Shape C — parent already has email_account_ranges → legacy key, leave as-is.
 */
function flattenTitanMailPricing(pricing: EmailPricingResponse): EmailPricingResponse {
  const TITAN_KEYS = ['titanmailglobal', 'titanmailindia'];
  const result = { ...pricing };

  for (const parentKey of TITAN_KEYS) {
    const parentValue = pricing[parentKey];
    if (!parentValue || typeof parentValue !== 'object') continue;

    // Shape C: already flat with email_account_ranges — leave as-is
    if (parentValue.email_account_ranges) continue;

    const pv = parentValue as Record<string, unknown>;

    // Shape A / B: has a `plans` key
    const plans = pv.plans as Record<string, unknown> | undefined;
    if (plans && typeof plans === 'object') {
      let foundAnyPlan = false;

      for (const [planId, planData] of Object.entries(plans)) {
        if (typeof planData !== 'object' || planData === null) continue;
        const pd = planData as Record<string, unknown>;

        const syntheticKey = `${parentKey}_${planId}`;

        // Shape B: plan has its own email_account_ranges
        if (pd.email_account_ranges) {
          result[syntheticKey] = planData as EmailPricingResponse[string];
          foundAnyPlan = true;
          continue;
        }

        // Shape A: plan has direct add/renew pricing (no slabs)
        // Normalise into a single "1-200000" slab so the rest of the system works
        if (pd.add || pd.renew) {
          result[syntheticKey] = {
            email_account_ranges: {
              '1-200000': {
                add: (pd.add as Record<string, number>) || {},
                renew: (pd.renew as Record<string, number>) || {},
              },
            },
          };
          foundAnyPlan = true;
          continue;
        }

        // Shape A variant: plan has per-account-count sub-keys (numeric range keys)
        // e.g. { "1-5": { add: {...}, renew: {...} }, "6-25": {...} }
        const subKeys = Object.keys(pd);
        const hasRangeKeys = subKeys.some(k => /^\d+-\d+$/.test(k));
        if (hasRangeKeys) {
          result[syntheticKey] = {
            email_account_ranges: pd,
          };
          foundAnyPlan = true;
        }
      }

      if (foundAnyPlan) {
        delete result[parentKey];
      }
      continue;
    }

    // No `plans` key — check if sub-keys are plan IDs with email_account_ranges directly
    let foundNestedPlans = false;
    for (const [subKey, subValue] of Object.entries(pv)) {
      if (
        typeof subValue === 'object' &&
        subValue !== null &&
        'email_account_ranges' in (subValue as Record<string, unknown>)
      ) {
        result[`${parentKey}_${subKey}`] = subValue as EmailPricingResponse[string];
        foundNestedPlans = true;
      }
    }
    if (foundNestedPlans) {
      delete result[parentKey];
    }
  }

  return result;
}

/** True if every `add` price in every slab is $0 (or no add prices at all). */
function isFreeTrial(plan: EmailPricingResponse[string] | undefined): boolean {
  if (!plan || typeof plan !== 'object') return true;
  const ranges = (plan as { email_account_ranges?: Record<string, { add?: Record<string, number> }> })
    .email_account_ranges;
  if (!ranges) return true;
  for (const slab of Object.values(ranges)) {
    if (slab.add) {
      for (const price of Object.values(slab.add)) {
        if (price > 0) return false;
      }
    }
  }
  return true;
}

const LEGACY_EMAIL_KEYS = ['eeliteus', 'enterpriseemailus'];

/**
 * Filter the flattened pricing to only the plans the purchase wizard should show.
 *
 * Rules:
 *  1. Remove India-region plans (titanmailindia_*)
 *  2. Remove free-trial plans where every add price is $0
 *  3. Remove legacy pre-Titan products (eeliteus, enterpriseemailus)
 *     when at least one paid Titan Mail Global plan exists — Titan replaces them.
 */
function filterWizardPlans(pricing: EmailPricingResponse): EmailPricingResponse {
  const result = { ...pricing };

  // Check whether any paid Titan Mail Global plans exist
  const hasPaidTitanGlobal = Object.keys(result).some(
    k => k.startsWith('titanmailglobal_') && !isFreeTrial(result[k])
  );

  for (const key of Object.keys(result)) {
    // 1. India-region plans
    if (key.startsWith('titanmailindia')) {
      delete result[key];
      continue;
    }
    // 2. Free-trial plans ($0 pricing)
    if (isFreeTrial(result[key])) {
      delete result[key];
      continue;
    }
    // 3. Legacy plans when Titan Mail is available
    if (hasPaidTitanGlobal && LEGACY_EMAIL_KEYS.includes(key)) {
      delete result[key];
    }
  }

  return result;
}

/**
 * Calculate base price from RC email pricing response.
 * 
 * RC response structure (confirmed from API docs):
 * { "eeliteus": { "email_account_ranges": { "1-5": { "add": { "1": 0.86, "12": 10.20 }, "renew": {...} } } } }
 * 
 * Prices are TOTAL for the tenure per-account.
 * E.g. add["12"] = 10.20 → $10.20 total for 12 months for 1 account.
 * Total = price * numberOfAccounts
 */
function calculateBasePrice(
  pricing: EmailPricingResponse,
  months: number,
  accounts: number,
  productKey: string = 'eeliteus'
): number {
  // Navigate the real RC structure: productKey → email_account_ranges → slab → add → months
  const productPricing = pricing[productKey];
  if (!productPricing) {
    // Try fallback to eeliteus if the specific plan isn't in the response
    const fallback = pricing['eeliteus'];
    if (!fallback) {
      console.warn(`[EmailPricing] No pricing found for product key: ${productKey}`);
      return 0;
    }
    console.warn(`[EmailPricing] No pricing for ${productKey}, falling back to eeliteus`);
    return calculateBasePrice(pricing, months, accounts, 'eeliteus');
  }
  
  const ranges = productPricing.email_account_ranges;
  if (!ranges || typeof ranges !== 'object') {
    console.warn('[EmailPricing] No email_account_ranges in pricing response. Keys:', Object.keys(productPricing));
    return 0;
  }
  
  // Find the correct slab for the number of accounts (e.g. "1-5", "6-25", "26-49", "50-200000")
  const slab = findAccountSlab(ranges, accounts);
  if (!slab) {
    console.warn(`[EmailPricing] No slab found for ${accounts} accounts. Available slabs:`, Object.keys(ranges));
    return 0;
  }
  
  const slabPricing = ranges[slab];
  const addPricing = slabPricing?.add;
  if (!addPricing) {
    console.warn(`[EmailPricing] No 'add' pricing in slab ${slab}`);
    return 0;
  }
  
  // Get price for the requested tenure (months)
  const price = addPricing[String(months)];
  if (price == null || isNaN(Number(price))) {
    console.warn(`[EmailPricing] No price for ${months} months in slab ${slab}. Available:`, Object.keys(addPricing));
    return 0;
  }
  
  // Price is PER-ACCOUNT PER-MONTH. Multiply by accounts AND months.
  return Number(price) * accounts * months;
}

/**
 * Find the correct account slab for a given number of accounts.
 * Slabs are like: "1-5", "6-25", "26-49", "50-200000"
 */
function findAccountSlab(
  ranges: Record<string, unknown>,
  accounts: number
): string | null {
  for (const slab of Object.keys(ranges)) {
    const parts = slab.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0]);
      const max = parseInt(parts[1]);
      if (!isNaN(min) && !isNaN(max) && accounts >= min && accounts <= max) {
        return slab;
      }
    }
  }
  // Fallback: return first slab if no match
  const firstSlab = Object.keys(ranges)[0];
  console.warn(`[EmailPricing] No exact slab match for ${accounts} accounts, falling back to: ${firstSlab}`);
  return firstSlab || null;
}

function applyMarkup(
  basePrice: number,
  markupType: string,
  markupValue: number
): number {
  switch (markupType) {
    case 'percentage':
      return basePrice * (1 + markupValue / 100);
    case 'fixed':
      return basePrice + markupValue;
    default:
      return basePrice;
  }
}

/**
 * Resolve a Titan Mail plan-id from a product key.
 * Handles both:
 * - Direct product keys like `titanmailglobal` (defaults to Business)
 * - Synthetic flattened keys like `titanmailglobal_1762` (extracts the plan-id)
 * - Legacy keys like `eeliteus` → mapped to Titan Mail Business
 * - Legacy keys like `enterpriseemailus` → mapped to Titan Mail Enterprise
 */
function resolveTitanPlanId(productKey: string): number | null {
  // Check for synthetic keys: titanmailglobal_<planId> or titanmailindia_<planId>
  const titanSyntheticMatch = productKey.match(/^titanmail(?:global|india)_(\d+)$/);
  if (titanSyntheticMatch) return parseInt(titanSyntheticMatch[1]);

  // Direct titanmailglobal key without plan suffix — shouldn't happen in normal flow
  if (productKey === 'titanmailglobal') return TITAN_PLAN_IDS.global.business;
  if (productKey === 'titanmailindia') return TITAN_PLAN_IDS.india.business;

  // Legacy key mapping — these correspond to Titan Mail plans
  if (productKey === 'eeliteus') return TITAN_PLAN_IDS.global.business;
  if (productKey === 'enterpriseemailus') return TITAN_PLAN_IDS.global.enterprise;
  if (productKey === 'eelitein') return TITAN_PLAN_IDS.india.business;
  if (productKey === 'enterpriseemailin') return TITAN_PLAN_IDS.india.enterprise;

  // Unknown key — no plan-id
  return null;
}

/**
 * Check whether a product key should route through the new Titan Mail REST API.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isTitanMailProduct(productKey: string): boolean {
  return productKey.startsWith('titanmailglobal') || productKey.startsWith('titanmailindia');
}

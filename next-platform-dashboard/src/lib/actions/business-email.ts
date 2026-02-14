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
} from "@/lib/resellerclub/email";
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
  data?: { pendingPurchaseId?: string; checkoutUrl?: string; status?: string; order?: EmailOrder };
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

    // Validate inputs
    if (!domainName) {
      return { success: false, error: 'Domain name is required' };
    }
    if (isNaN(numberOfAccounts) || numberOfAccounts < 1) {
      return { success: false, error: 'Invalid number of accounts' };
    }
    if (isNaN(months) || ![1, 3, 6, 12, 24, 36].includes(months)) {
      return { success: false, error: 'Invalid subscription period' };
    }

    // Get customer ID from agency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agency } = await (supabase as any)
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();

    if (!agency?.resellerclub_customer_id) {
      return { success: false, error: 'Agency not configured for domain services' };
    }

    // Calculate pricing using cached customer pricing from ResellerClub
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agencyPricing } = await (supabase as any)
      .from('agency_domain_pricing')
      .select('default_markup_type, default_markup_value, pricing_source, apply_platform_markup')
      .eq('agency_id', profile.agency_id)
      .single();

    // Get pricing from cache or live API
    const { pricingCacheService } = await import('@/lib/resellerclub/pricing-cache');
    
    // Try to get customer pricing first (includes RC markups)
    const customerPricing = await businessEmailApi.getCustomerPricing(agency.resellerclub_customer_id);
    const productKey = 'eeliteus'; // Default to US datacenter
    
    // Calculate base price from customer pricing (what RC says customer should pay)
    const basePrice = calculateBasePrice(customerPricing, months, numberOfAccounts);
    
    // Get wholesale cost for margin tracking
    const wholesalePricing = await businessEmailApi.getResellerCostPricing();
    const wholesalePrice = calculateBasePrice(wholesalePricing, months, numberOfAccounts);
    
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

    // Create Paddle transaction for payment
    const { createEmailPurchase } = await import('@/lib/paddle/transactions');
    
    const purchase = await createEmailPurchase({
      agencyId: profile.agency_id,
      userId: user.id,
      clientId: clientId || undefined,
      domainId: domainId || undefined,
      domainName,
      numberOfAccounts,
      months,
      productKey,
      wholesaleAmount: wholesalePrice,
      retailAmount: retailPrice,
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
    if (![1, 3, 6, 12, 24, 36].includes(months)) {
      return { success: false, error: 'Invalid renewal period' };
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
 * Get email pricing from ResellerClub
 */
export async function getBusinessEmailPricing(): Promise<{
  success: boolean;
  data?: EmailPricingResponse;
  error?: string;
}> {
  try {
    const pricing = await businessEmailApi.getResellerPricing();
    return { success: true, data: pricing };
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

function calculateBasePrice(
  pricing: EmailPricingResponse,
  months: number,
  accounts: number
): number {
  // Default to US pricing
  const productPricing = pricing['eeliteus'];
  if (!productPricing) return 0;
  
  const monthPricing = productPricing[String(months)];
  if (!monthPricing) return 0;
  
  return parseFloat(monthPricing.addnewaccount) * accounts;
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

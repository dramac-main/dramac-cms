// src/lib/resellerclub/email/order-service.ts
// Email Order Service - Database operations + ResellerClub API integration

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessEmailApi } from './client';
import { titanMailApi, TITAN_PLAN_IDS } from './titan-client';
import { emailDnsService } from './dns-service';
import { dnsService } from '@/lib/cloudflare';
import { DEFAULT_CURRENCY } from '@/lib/locale-config'
import type { 
  CreateEmailOrderInput,
  EmailOrder,
  EmailPricingResponse,
} from './types';

// ============================================================================
// Email Order Service
// ============================================================================

export const emailOrderService = {
  /**
   * Create a new email order with database sync
   */
  async createOrder(params: CreateEmailOrderInput): Promise<EmailOrder> {
    const adminClient = createAdminClient();

    const productKey = params.productKey || 'eeliteus';
    const isTitan = isTitanMailKey(productKey);

    let rcOrderId: string;
    let storedProductKey: string;
    let wholesalePrice = 0;

    if (isTitan) {
      // ── Titan Mail REST API ──────────────────────────────────────────────
      const planId = resolveTitanPlanId(productKey);
      const region = extractTitanRegion(productKey);

      console.log(`[EmailOrderService] Titan Mail order: domain=${params.domainName}, planId=${planId}, region=${region}`);

      const rcResult = await titanMailApi.createOrder({
        domainName: params.domainName,
        customerId: params.customerId,
        planId,
        numberOfAccounts: params.numberOfAccounts,
        months: params.months,
        region,
      });

      rcOrderId = rcResult.orderId;
      // Normalize: strip synthetic planId suffix ('titanmailglobal_1762' -> 'titanmailglobal')
      storedProductKey = normalizeTitanProductKey(productKey);
      // Wholesale pricing not available via legacy endpoint for Titan plans — left at 0
    } else {
      // ── Legacy Business / Enterprise Email API ───────────────────────────
      const rcResult = await businessEmailApi.createOrder({
        domainName: params.domainName,
        customerId: params.customerId,
        numberOfAccounts: params.numberOfAccounts,
        months: params.months,
      });

      rcOrderId = rcResult.orderId;

      // Fetch canonical productKey that RC assigned
      const orderDetails = await businessEmailApi.getOrderDetails(rcOrderId);
      storedProductKey = orderDetails.productKey;

      // Wholesale pricing for margin tracking
      try {
        const pricing = await businessEmailApi.getResellerCostPricing();
        wholesalePrice = calculateWholesalePrice(
          pricing,
          storedProductKey,
          params.months,
          params.numberOfAccounts
        );
      } catch (pricingError) {
        console.warn('[EmailOrderService] Failed to fetch wholesale pricing, using 0:', pricingError);
      }
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + params.months);

    // Save to database (using 'any' until table types are generated)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: emailOrder, error } = await (adminClient as any)
      .from('email_orders')
      .insert({
        agency_id: params.agencyId,
        client_id: params.clientId || null,
        domain_id: params.domainId || null,
        resellerclub_order_id: rcOrderId,
        resellerclub_customer_id: params.customerId,
        domain_name: params.domainName,
        product_key: storedProductKey,
        number_of_accounts: params.numberOfAccounts,
        used_accounts: 0,
        status: 'Active',
        start_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        wholesale_price: wholesalePrice,
        retail_price: params.retailPrice,
        currency: params.currency || DEFAULT_CURRENCY,
      })
      .select()
      .single();

    if (error) throw error;
    return emailOrder as EmailOrder;
  },

  /**
   * Get email order by ID
   */
  async getOrder(orderId: string): Promise<EmailOrder | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('email_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) return null;
    return data as EmailOrder;
  },

  /**
   * Get email order by domain
   */
  async getOrderByDomain(domainName: string, agencyId: string): Promise<EmailOrder | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('email_orders')
      .select('*')
      .eq('domain_name', domainName)
      .eq('agency_id', agencyId)
      .single();

    if (error) return null;
    return data as EmailOrder;
  },

  /**
   * Get all email orders for an agency
   */
  async getOrdersForAgency(agencyId: string): Promise<EmailOrder[]> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('email_orders')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EmailOrder[];
  },

  /**
   * Sync order details from ResellerClub
   */
  async syncOrder(orderId: string): Promise<EmailOrder> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get local order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: localOrder, error: fetchError } = await (supabase as any)
      .from('email_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !localOrder) {
      throw new Error('Order not found');
    }

    // Get details from ResellerClub — route to Titan or legacy API based on stored product key
    let rcStatus: string;
    let numberOfAccounts: number;
    let usedAccounts: number;
    let endTime: string;

    if (isTitanMailKey(localOrder.product_key)) {
      const region = extractTitanRegion(localOrder.product_key);
      const rcDetails = await titanMailApi.getOrderDetails(localOrder.resellerclub_order_id, region);
      rcStatus = rcDetails.currentStatus;
      numberOfAccounts = rcDetails.numberOfAccounts;
      usedAccounts = rcDetails.usedAccounts;
      endTime = rcDetails.endTime;
    } else {
      const rcDetails = await businessEmailApi.getOrderDetails(localOrder.resellerclub_order_id);
      rcStatus = rcDetails.currentStatus;
      numberOfAccounts = rcDetails.numberOfAccounts;
      usedAccounts = rcDetails.usedAccounts;
      endTime = rcDetails.endTime;
    }

    // Update local order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedOrder, error: updateError } = await (adminClient as any)
      .from('email_orders')
      .update({
        status: rcStatus,
        number_of_accounts: numberOfAccounts,
        used_accounts: usedAccounts,
        expiry_date: new Date(parseInt(endTime) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedOrder as EmailOrder;
  },

  /**
   * Configure DNS for email
   */
  async configureDns(orderId: string, cloudflareZoneId: string): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase as any)
      .from('email_orders')
      .select('resellerclub_order_id, domain_id')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new Error('Order not found');

    // Get DNS records — emailDnsService falls back to standard Titan Mail records if API fails
    const dnsRecords = await emailDnsService.getDnsRecords(order.resellerclub_order_id);

    // Add MX records
    for (const mx of dnsRecords.mx) {
      await dnsService.createRecord({
        zoneId: cloudflareZoneId,
        type: 'MX',
        name: '@',
        content: mx.host,
        priority: mx.priority,
        ttl: mx.ttl,
      });
    }

    // Add SPF record
    await dnsService.createRecord({
      zoneId: cloudflareZoneId,
      type: 'TXT',
      name: dnsRecords.spf.host,
      content: dnsRecords.spf.value,
      ttl: dnsRecords.spf.ttl,
    });

    // Add DKIM record if available
    if (dnsRecords.dkim) {
      await dnsService.createRecord({
        zoneId: cloudflareZoneId,
        type: 'TXT',
        name: dnsRecords.dkim.host,
        content: dnsRecords.dkim.value,
        ttl: dnsRecords.dkim.ttl,
      });
    }

    // Update domain with email DNS configured flag
    if (order.domain_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from('domains')
        .update({ email_dns_configured: true })
        .eq('id', order.domain_id);
    }
  },

  /**
   * Renew email order
   */
  async renewOrder(orderId: string, months: number): Promise<EmailOrder> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get local order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: localOrder, error: fetchError } = await (supabase as any)
      .from('email_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !localOrder) {
      throw new Error('Order not found');
    }

    // Renew in ResellerClub — route to Titan or legacy API based on stored product key
    if (isTitanMailKey(localOrder.product_key)) {
      const region = extractTitanRegion(localOrder.product_key);
      await titanMailApi.renewOrder({
        orderId: localOrder.resellerclub_order_id,
        months,
        region,
      });
    } else {
      await businessEmailApi.renewOrder({
        orderId: localOrder.resellerclub_order_id,
        months,
        numberOfAccounts: localOrder.number_of_accounts,
      });
    }

    // Calculate new expiry date
    const currentExpiry = new Date(localOrder.expiry_date);
    currentExpiry.setMonth(currentExpiry.getMonth() + months);

    // Update local order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedOrder, error: updateError } = await (adminClient as any)
      .from('email_orders')
      .update({
        expiry_date: currentExpiry.toISOString(),
        status: 'Active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedOrder as EmailOrder;
  },
};

// ============================================================================
// Titan Mail Helper Functions (private)
// ============================================================================

/** Returns true for any 'titanmailglobal' or 'titanmailindia' key (including synthetic variants). */
function isTitanMailKey(productKey: string | undefined | null): boolean {
  if (!productKey) return false;
  return productKey.startsWith('titanmailglobal') || productKey.startsWith('titanmailindia');
}

/**
 * Extract Titan Mail plan ID from a product key.
 * - Synthetic key 'titanmailglobal_1762' → 1762
 * - Plain key 'titanmailglobal' → defaults to Business plan (1756)
 * - Plain key 'titanmailindia'  → defaults to Business plan (1758)
 */
function resolveTitanPlanId(productKey: string): number {
  const match = productKey.match(/^titanmail(?:global|india)_?(\d+)$/);
  if (match) return parseInt(match[1], 10);
  if (productKey.includes('india')) return TITAN_PLAN_IDS.india.business;
  return TITAN_PLAN_IDS.global.business;
}

/** Determine Titan Mail region from product key. */
function extractTitanRegion(productKey: string): 'global' | 'india' {
  return productKey.includes('india') ? 'india' : 'global';
}

/** Strip the synthetic plan-ID suffix: 'titanmailglobal_1762' → 'titanmailglobal'. */
function normalizeTitanProductKey(productKey: string): string {
  const match = productKey.match(/^(titanmail(?:global|india))_?\d*$/);
  return match ? match[1] : productKey;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate wholesale price from RC email pricing response.
 * Same structure as calculateBasePrice — navigates email_account_ranges.
 */
function calculateWholesalePrice(
  pricing: EmailPricingResponse,
  productKey: string,
  months: number,
  accounts: number
): number {
  const productPricing = pricing[productKey];
  if (!productPricing) return 0;
  
  const ranges = productPricing.email_account_ranges;
  if (!ranges || typeof ranges !== 'object') return 0;
  
  // Find the correct slab for the number of accounts
  let matchedSlab: string | null = null;
  for (const slab of Object.keys(ranges)) {
    const parts = slab.split('-');
    if (parts.length === 2) {
      const min = parseInt(parts[0]);
      const max = parseInt(parts[1]);
      if (!isNaN(min) && !isNaN(max) && accounts >= min && accounts <= max) {
        matchedSlab = slab;
        break;
      }
    }
  }
  if (!matchedSlab) matchedSlab = Object.keys(ranges)[0] || null;
  if (!matchedSlab) return 0;
  
  const slabPricing = ranges[matchedSlab] as { add?: Record<string, number>; renew?: Record<string, number> };
  const addPricing = slabPricing?.add;
  if (!addPricing) return 0;
  
  const price = addPricing[String(months)];
  if (price == null || isNaN(Number(price))) return 0;
  
  // Price is total-for-tenure per account
  return Number(price) * accounts;
}

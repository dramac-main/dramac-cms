// src/lib/resellerclub/email/order-service.ts
// Email Order Service - Database operations + ResellerClub API integration

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessEmailApi } from './client';
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
    
    // 1. Create order in ResellerClub
    const rcResult = await businessEmailApi.createOrder({
      domainName: params.domainName,
      customerId: params.customerId,
      numberOfAccounts: params.numberOfAccounts,
      months: params.months,
    });

    // 2. Get order details from ResellerClub
    const orderDetails = await businessEmailApi.getOrderDetails(rcResult.orderId);

    // 3. Get pricing info
    const pricing = await businessEmailApi.getResellerPricing();
    const wholesalePrice = calculateWholesalePrice(
      pricing, 
      orderDetails.productKey, 
      params.months, 
      params.numberOfAccounts
    );

    // 4. Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + params.months);

    // 5. Save to database (using 'any' until table types are generated)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: emailOrder, error } = await (adminClient as any)
      .from('email_orders')
      .insert({
        agency_id: params.agencyId,
        client_id: params.clientId || null,
        domain_id: params.domainId || null,
        resellerclub_order_id: rcResult.orderId,
        resellerclub_customer_id: params.customerId,
        domain_name: params.domainName,
        product_key: orderDetails.productKey,
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

    // Get details from ResellerClub
    const rcDetails = await businessEmailApi.getOrderDetails(localOrder.resellerclub_order_id);

    // Update local order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedOrder, error: updateError } = await (adminClient as any)
      .from('email_orders')
      .update({
        status: rcDetails.currentStatus,
        number_of_accounts: rcDetails.numberOfAccounts,
        used_accounts: rcDetails.usedAccounts,
        expiry_date: new Date(parseInt(rcDetails.endTime) * 1000).toISOString(),
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

    // Get DNS records from ResellerClub
    const dnsRecords = await businessEmailApi.getDnsRecords(order.resellerclub_order_id);

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

    // Renew in ResellerClub
    await businessEmailApi.renewOrder({
      orderId: localOrder.resellerclub_order_id,
      months,
      numberOfAccounts: localOrder.number_of_accounts,
    });

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

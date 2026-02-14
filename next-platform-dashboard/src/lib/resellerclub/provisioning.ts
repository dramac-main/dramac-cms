// src/lib/resellerclub/provisioning.ts
// ResellerClub Provisioning Service
// Handles actual domain/email provisioning after payment

import { createAdminClient } from '@/lib/supabase/admin';
import { domainService } from './domains';
import { customerService } from './customers';
import { contactService } from './contacts';
import { emailOrderService } from './email';
import { updatePendingPurchaseStatus } from '@/lib/paddle/transactions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface ProvisioningResult {
  success: boolean;
  resourceId?: string; // domain_id or email_order_id (first domain for multi-domain purchases)
  resellerclubOrderId?: string;
  error?: string;
  errorDetails?: unknown;
  multiDomainResults?: Array<{
    domainName: string;
    success: boolean;
    resourceId?: string;
    error?: string;
  }>;
}

/**
 * Provision a domain registration after payment
 */
export async function provisionDomainRegistration(
  pendingPurchaseId: string
): Promise<ProvisioningResult> {
  const admin = createAdminClient() as SupabaseClient;
  
  try {
    // Get pending purchase
    const { data: purchase, error: fetchError } = await admin
      .from('pending_purchases')
      .select('*')
      .eq('id', pendingPurchaseId)
      .single();
    
    if (fetchError || !purchase) {
      throw new Error('Pending purchase not found');
    }
    
    // Check if already provisioned
    if (purchase.status === 'completed' && purchase.provisioned_resource_id) {
      return {
        success: true,
        resourceId: purchase.provisioned_resource_id,
        resellerclubOrderId: purchase.resellerclub_order_id,
      };
    }
    
    // Update status to provisioning
    await updatePendingPurchaseStatus(pendingPurchaseId, 'provisioning');
    
    const purchaseData = purchase.purchase_data as Record<string, unknown>;
    
    // Check if this is a multi-domain purchase (from cart)
    const domains = purchaseData.domains as Array<{
      domainName: string;
      years: number;
      tld?: string;
      privacy?: boolean;
      autoRenew?: boolean;
    }> | undefined;
    
    // If domains array exists, provision multiple domains
    if (domains && domains.length > 0) {
      return await provisionMultipleDomains(pendingPurchaseId, purchase, domains);
    }
    
    // Single domain provisioning (legacy flow)
    const domainName = purchaseData.domain_name as string;
    const years = purchaseData.years as number;
    const tld = purchaseData.tld as string;
    const privacy = purchaseData.privacy as boolean | undefined;
    const autoRenew = purchaseData.auto_renew as boolean | undefined;
    const contactInfo = purchaseData.contact_info as Record<string, unknown> | undefined;
    
    // Get agency's ResellerClub customer ID
    const { data: agency } = await admin
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', purchase.agency_id)
      .single();
    
    if (!agency?.resellerclub_customer_id) {
      throw new Error('Agency not configured for ResellerClub');
    }
    
    const customerId = agency.resellerclub_customer_id as string;
    
    // Create or get contact
    const contact = await contactService.createOrUpdate({
      name: (contactInfo?.name as string) || 'Domain Admin',
      company: (contactInfo?.company as string) || 'Agency',
      email: (contactInfo?.email as string) || '',
      addressLine1: (contactInfo?.address as string) || 'Not Provided',
      city: (contactInfo?.city as string) || 'Lusaka',
      state: (contactInfo?.state as string) || 'Lusaka',
      country: (contactInfo?.country as string) || 'ZM',
      zipcode: (contactInfo?.zipcode as string) || '10101',
      phoneCountryCode: '260',
      phone: (contactInfo?.phone as string) || '955000000',
      customerId: customerId,
      type: 'Contact',
    });
    
    const contactId = String(contact.contactId);
    
    // Register domain via ResellerClub
    const result = await domainService.register({
      domainName,
      years,
      customerId,
      registrantContactId: contactId,
      adminContactId: contactId,
      techContactId: contactId,
      billingContactId: contactId,
      purchasePrivacy: privacy ?? true,
      nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
    });
    
    const orderId = result.orderId;
    
    // Calculate expiry date
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setFullYear(expiryDate.getFullYear() + years);
    
    // Create domain record in database
    const { data: domain, error: insertError } = await admin
      .from('domains')
      .insert({
        agency_id: purchase.agency_id,
        client_id: purchase.client_id,
        domain_name: domainName.toLowerCase(),
        tld,
        sld: domainName.split('.').slice(0, -1).join('.'),
        resellerclub_order_id: orderId,
        resellerclub_customer_id: customerId,
        registration_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        status: 'active',
        auto_renew: autoRenew ?? true,
        whois_privacy: privacy ?? true,
        registrant_contact_id: contactId,
        admin_contact_id: contactId,
        tech_contact_id: contactId,
        billing_contact_id: contactId,
        nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        registered_via_api: true,
        wholesale_price: purchase.wholesale_amount,
        retail_price: purchase.retail_amount,
        currency: purchase.currency,
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to create domain record: ${insertError.message}`);
    }
    
    const domainId = domain.id;
    
    // Create domain order record
    await admin.from('domain_orders').insert({
      agency_id: purchase.agency_id,
      domain_id: domainId,
      order_type: 'registration',
      domain_name: domainName,
      years,
      wholesale_price: purchase.wholesale_amount,
      retail_price: purchase.retail_amount,
      currency: purchase.currency,
      resellerclub_order_id: orderId,
      paddle_transaction_id: purchase.paddle_transaction_id,
      status: 'completed',
      payment_status: 'paid',
      completed_at: new Date().toISOString(),
      pending_purchase_id: pendingPurchaseId,
      idempotency_key: purchase.idempotency_key,
    });
    
    // Update pending purchase to completed
    await updatePendingPurchaseStatus(pendingPurchaseId, 'completed', {
      resellerclub_order_id: orderId,
      provisioned_resource_id: domainId,
      provisioned_at: new Date().toISOString(),
    });
    
    return {
      success: true,
      resourceId: domainId,
      resellerclubOrderId: orderId,
    };
  } catch (error) {
    console.error('[Provisioning] Domain registration failed:', error);
    
    // Update pending purchase to failed
    await updatePendingPurchaseStatus(pendingPurchaseId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_details: error instanceof Error ? { name: error.name, stack: error.stack } : error,
      retry_count: (await admin.from('pending_purchases').select('retry_count').eq('id', pendingPurchaseId).single()).data?.retry_count || 0 + 1,
      last_retry_at: new Date().toISOString(),
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error,
    };
  }
}

/**
 * Provision multiple domains from a cart purchase
 */
async function provisionMultipleDomains(
  pendingPurchaseId: string,
  purchase: any,
  domains: Array<{
    domainName: string;
    years: number;
    tld?: string;
    privacy?: boolean;
    autoRenew?: boolean;
    wholesale?: number;
    retail?: number;
  }>
): Promise<ProvisioningResult> {
  const admin = createAdminClient() as SupabaseClient;
  const results: Array<{
    domainName: string;
    success: boolean;
    resourceId?: string;
    error?: string;
  }> = [];
  
  let firstDomainId: string | undefined;
  
  try {
    const purchaseData = purchase.purchase_data as Record<string, unknown>;
    const contactInfo = purchaseData.contact_info as Record<string, unknown> | undefined;
    
    // Get agency's ResellerClub customer ID
    const { data: agency } = await admin
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', purchase.agency_id)
      .maybeSingle();
    
    if (!agency?.resellerclub_customer_id) {
      throw new Error('Agency not configured for ResellerClub');
    }
    
    const customerId = agency.resellerclub_customer_id as string;
    
    // Create or get contact (reuse for all domains)
    const contact = await contactService.createOrUpdate({
      name: (contactInfo?.name as string) || 'Domain Admin',
      company: (contactInfo?.company as string) || 'Agency',
      email: (contactInfo?.email as string) || '',
      addressLine1: (contactInfo?.address as string) || 'Not Provided',
      city: (contactInfo?.city as string) || 'Lusaka',
      state: (contactInfo?.state as string) || 'Lusaka',
      country: (contactInfo?.country as string) || 'ZM',
      zipcode: (contactInfo?.zipcode as string) || '10101',
      phoneCountryCode: '260',
      phone: (contactInfo?.phone as string) || '955000000',
      customerId: customerId,
      type: 'Contact',
    });
    
    const contactId = String(contact.contactId);
    
    // Process each domain sequentially
    for (const domainConfig of domains) {
      try {
        // Register domain via ResellerClub
        const result = await domainService.register({
          domainName: domainConfig.domainName,
          years: domainConfig.years,
          customerId,
          registrantContactId: contactId,
          adminContactId: contactId,
          techContactId: contactId,
          billingContactId: contactId,
          nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
          idnLanguageCode: null,
          protectPrivacy: domainConfig.privacy ?? true,
          invoiceOption: 'NoInvoice',
        });
        
        const orderId = String(result.orderId);
        
        // Create domain record in our database
        const { data: domain, error: insertError } = await admin
          .from('domains')
          .insert({
            agency_id: purchase.agency_id,
            domain_name: domainConfig.domainName,
            tld: domainConfig.tld || domainConfig.domainName.split('.').pop(),
            status: 'active',
            resellerclub_order_id: orderId,
            resellerclub_customer_id: customerId,
            registration_years: domainConfig.years,
            registration_date: new Date().toISOString(),
            expiration_date: new Date(Date.now() + domainConfig.years * 365 * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: domainConfig.autoRenew ?? true,
            whois_privacy: domainConfig.privacy ?? true,
            registrant_contact_id: contactId,
            admin_contact_id: contactId,
            tech_contact_id: contactId,
            billing_contact_id: contactId,
            nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
            registered_via_api: true,
            wholesale_price: domainConfig.wholesale || 0,
            retail_price: domainConfig.retail || 0,
            currency: purchase.currency,
          })
          .select()
          .single();
        
        if (insertError || !domain) {
          throw new Error(`Failed to create domain record: ${insertError?.message || 'Unknown error'}`);
        }
        
        const domainId = domain.id;
        if (!firstDomainId) {
          firstDomainId = domainId;
        }
        
        // Create domain order record
        await admin.from('domain_orders').insert({
          agency_id: purchase.agency_id,
          domain_id: domainId,
          order_type: 'registration',
          domain_name: domainConfig.domainName,
          years: domainConfig.years,
          wholesale_price: domainConfig.wholesale || 0,
          retail_price: domainConfig.retail || 0,
          currency: purchase.currency,
          resellerclub_order_id: orderId,
          paddle_transaction_id: purchase.paddle_transaction_id,
          status: 'completed',
          payment_status: 'paid',
          completed_at: new Date().toISOString(),
          pending_purchase_id: pendingPurchaseId,
          idempotency_key: `${purchase.idempotency_key}-${domainConfig.domainName}`,
        });
        
        results.push({
          domainName: domainConfig.domainName,
          success: true,
          resourceId: domainId,
        });
      } catch (error) {
        console.error(`[Provisioning] Failed to provision ${domainConfig.domainName}:`, error);
        results.push({
          domainName: domainConfig.domainName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    // Update pending purchase status based on results
    const allSucceeded = results.every(r => r.success);
    const allFailed = results.every(r => !r.success);
    
    if (allSucceeded) {
      await updatePendingPurchaseStatus(pendingPurchaseId, 'completed', {
        provisioned_resource_id: firstDomainId,
        provisioned_at: new Date().toISOString(),
        error_details: { multi_domain_results: results },
      });
      
      return {
        success: true,
        resourceId: firstDomainId,
        multiDomainResults: results,
      };
    } else if (allFailed) {
      await updatePendingPurchaseStatus(pendingPurchaseId, 'failed', {
        error_message: 'All domain registrations failed',
        error_details: { multi_domain_results: results },
      });
      
      return {
        success: false,
        error: 'All domain registrations failed',
        multiDomainResults: results,
      };
    } else {
      // Partial success
      await updatePendingPurchaseStatus(pendingPurchaseId, 'completed', {
        provisioned_resource_id: firstDomainId,
        provisioned_at: new Date().toISOString(),
        error_message: 'Some domains failed to provision',
        error_details: { multi_domain_results: results },
      });
      
      return {
        success: true,
        resourceId: firstDomainId,
        multiDomainResults: results,
        error: 'Some domains failed to provision',
      };
    }
  } catch (error) {
    console.error('[Provisioning] Multi-domain provisioning failed:', error);
    
    await updatePendingPurchaseStatus(pendingPurchaseId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_details: { error, multi_domain_results: results },
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to provision domains',
      multiDomainResults: results,
    };
  }
}

/**
 * Provision a domain renewal after payment
 */
export async function provisionDomainRenewal(
  pendingPurchaseId: string
): Promise<ProvisioningResult> {
  const admin = createAdminClient() as SupabaseClient;
  
  try {
    // Get pending purchase
    const { data: purchase, error: fetchError } = await admin
      .from('pending_purchases')
      .select('*')
      .eq('id', pendingPurchaseId)
      .single();
    
    if (fetchError || !purchase) {
      throw new Error('Pending purchase not found');
    }
    
    // Check if already provisioned
    if (purchase.status === 'completed') {
      return {
        success: true,
        resourceId: purchase.provisioned_resource_id,
        resellerclubOrderId: purchase.resellerclub_order_id,
      };
    }
    
    // Update status to provisioning
    await updatePendingPurchaseStatus(pendingPurchaseId, 'provisioning');
    
    const purchaseData = purchase.purchase_data as Record<string, unknown>;
    const domainName = purchaseData.domain_name as string;
    const years = purchaseData.years as number;
    
    // Find domain in database
    const { data: domain } = await admin
      .from('domains')
      .select('*')
      .eq('domain_name', domainName)
      .eq('agency_id', purchase.agency_id)
      .single();
    
    if (!domain || !domain.resellerclub_order_id) {
      throw new Error('Domain not found or not registered via ResellerClub');
    }
    
    // Renew domain via ResellerClub
    await domainService.renew({
      orderId: domain.resellerclub_order_id,
      years,
    });
    
    // Calculate new expiry date
    const currentExpiry = new Date(domain.expiry_date);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + years);
    
    // Update domain in database
    await admin
      .from('domains')
      .update({
        expiry_date: newExpiry.toISOString(),
        last_renewed_at: new Date().toISOString(),
      })
      .eq('id', domain.id);
    
    // Create domain order record
    await admin.from('domain_orders').insert({
      agency_id: purchase.agency_id,
      domain_id: domain.id,
      order_type: 'renewal',
      domain_name: domainName,
      years,
      wholesale_price: purchase.wholesale_amount,
      retail_price: purchase.retail_amount,
      currency: purchase.currency,
      resellerclub_order_id: domain.resellerclub_order_id,
      paddle_transaction_id: purchase.paddle_transaction_id,
      status: 'completed',
      payment_status: 'paid',
      completed_at: new Date().toISOString(),
      pending_purchase_id: pendingPurchaseId,
      idempotency_key: purchase.idempotency_key,
    });
    
    // Update pending purchase to completed
    await updatePendingPurchaseStatus(pendingPurchaseId, 'completed', {
      resellerclub_order_id: domain.resellerclub_order_id,
      provisioned_resource_id: domain.id,
      provisioned_at: new Date().toISOString(),
    });
    
    return {
      success: true,
      resourceId: domain.id,
      resellerclubOrderId: domain.resellerclub_order_id,
    };
  } catch (error) {
    console.error('[Provisioning] Domain renewal failed:', error);
    
    // Update pending purchase to failed
    await updatePendingPurchaseStatus(pendingPurchaseId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_details: error instanceof Error ? { name: error.name, stack: error.stack } : error,
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error,
    };
  }
}

/**
 * Provision an email order after payment
 */
export async function provisionEmailOrder(
  pendingPurchaseId: string
): Promise<ProvisioningResult> {
  const admin = createAdminClient() as SupabaseClient;
  
  try {
    // Get pending purchase
    const { data: purchase, error: fetchError } = await admin
      .from('pending_purchases')
      .select('*')
      .eq('id', pendingPurchaseId)
      .single();
    
    if (fetchError || !purchase) {
      throw new Error('Pending purchase not found');
    }
    
    // Check if already provisioned
    if (purchase.status === 'completed' && purchase.provisioned_resource_id) {
      return {
        success: true,
        resourceId: purchase.provisioned_resource_id,
        resellerclubOrderId: purchase.resellerclub_order_id,
      };
    }
    
    // Update status to provisioning
    await updatePendingPurchaseStatus(pendingPurchaseId, 'provisioning');
    
    const purchaseData = purchase.purchase_data as Record<string, unknown>;
    const domainName = purchaseData.domain_name as string;
    const numberOfAccounts = purchaseData.number_of_accounts as number;
    const months = purchaseData.months as number;
    const productKey = (purchaseData.product_key as string) || 'eeliteus';
    const domainId = purchaseData.domain_id as string | undefined;
    
    // Get agency's ResellerClub customer ID
    const { data: agency } = await admin
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', purchase.agency_id)
      .single();
    
    if (!agency?.resellerclub_customer_id) {
      throw new Error('Agency not configured for ResellerClub');
    }
    
    const customerId = agency.resellerclub_customer_id as string;
    
    // Create email order via ResellerClub
    const order = await emailOrderService.createOrder({
      agencyId: purchase.agency_id,
      clientId: purchase.client_id,
      domainId: domainId,
      domainName,
      customerId,
      numberOfAccounts,
      months,
      retailPrice: purchase.retail_amount,
      currency: purchase.currency,
    });
    
    const emailOrderId = order.id;
    const rcOrderId = order.resellerclub_order_id;
    
    // Update email_orders with pending_purchase reference
    await admin
      .from('email_orders')
      .update({
        pending_purchase_id: pendingPurchaseId,
        idempotency_key: purchase.idempotency_key,
      })
      .eq('id', emailOrderId);
    
    // Update pending purchase to completed
    await updatePendingPurchaseStatus(pendingPurchaseId, 'completed', {
      resellerclub_order_id: rcOrderId,
      provisioned_resource_id: emailOrderId,
      provisioned_at: new Date().toISOString(),
    });
    
    return {
      success: true,
      resourceId: emailOrderId,
      resellerclubOrderId: rcOrderId,
    };
  } catch (error) {
    console.error('[Provisioning] Email order failed:', error);
    
    // Update pending purchase to failed
    await updatePendingPurchaseStatus(pendingPurchaseId, 'failed', {
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_details: error instanceof Error ? { name: error.name, stack: error.stack } : error,
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error,
    };
  }
}

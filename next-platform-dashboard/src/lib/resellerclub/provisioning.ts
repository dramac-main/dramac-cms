// src/lib/resellerclub/provisioning.ts
// ResellerClub Provisioning Service
// Handles actual domain/email provisioning after payment

import { createAdminClient } from '@/lib/supabase/admin';
import { domainService } from './domains';
import { customerService } from './customers';

/**
 * Helper: Ensure agency has a ResellerClub customer ID.
 * This is a FALLBACK for provisioning — normally ensureResellerClubCustomer()
 * in domains.ts runs during checkout. But if that failed or was skipped,
 * we must be able to create the customer during provisioning too.
 */
async function ensureResellerClubCustomerForProvisioning(
  admin: any,
  agencyId: string,
  userId: string
): Promise<string | null> {
  console.log(`[Provisioning] ensureResellerClubCustomerForProvisioning called for agency=${agencyId}, user=${userId}`);
  
  // Check if already set
  const { data: agency } = await admin
    .from('agencies')
    .select('id, name, resellerclub_customer_id')
    .eq('id', agencyId)
    .maybeSingle();

  const existingRcId = agency?.resellerclub_customer_id;
  // Guard against stringified falsy values ("undefined", "null", "") that got stored in DB
  const isValidRcId = existingRcId && existingRcId !== 'undefined' && existingRcId !== 'null' && existingRcId.trim() !== '';
  
  if (isValidRcId) {
    console.log(`[Provisioning] Agency already has RC customer: ${existingRcId}`);
    return existingRcId as string;
  }
  
  // If we had a bogus value, clear it from the DB
  if (existingRcId && !isValidRcId) {
    console.warn(`[Provisioning] Clearing invalid RC customer ID "${existingRcId}" for agency ${agencyId}`);
    await admin.from('agencies').update({ resellerclub_customer_id: null }).eq('id', agencyId);
  }

  console.log(`[Provisioning] Agency has NO RC customer ID, creating one...`);

  // Get user email for RC customer creation
  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  // Also try auth.users if profiles doesn't have email
  let userEmail = profile?.email;
  if (!userEmail) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    userEmail = authUser?.user?.email;
  }

  if (!userEmail) {
    console.error('[Provisioning] Cannot create RC customer: no email found for user', userId);
    return null;
  }

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
      languagePreference: 'en',
    });

    // Save to DB
    await admin
      .from('agencies')
      .update({ resellerclub_customer_id: String(customer.customerId) })
      .eq('id', agencyId);

    console.log(`[Provisioning] Auto-created RC customer ${customer.customerId} for agency ${agencyId}`);
    return String(customer.customerId);
  } catch (error) {
    console.error('[Provisioning] Failed to auto-create RC customer:', error);
    return null;
  }
}
import { contactService } from './contacts';
import { emailOrderService } from './email';
import { transferService } from './transfers';
import { updatePendingPurchaseStatus } from '@/lib/paddle/transactions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Map of country codes to phone country codes (ITU-T E.164)
 * ResellerClub requires phone-cc as a separate field (without the + prefix)
 */
const COUNTRY_PHONE_CODES: Record<string, string> = {
  ZM: '260', ZA: '27', KE: '254', NG: '234', GH: '233', TZ: '255', UG: '256',
  ZW: '263', BW: '267', MW: '265', MZ: '258', NA: '264', RW: '250', CD: '243',
  US: '1', CA: '1', MX: '52', BR: '55', AR: '54', GB: '44', DE: '49', FR: '33',
  IT: '39', ES: '34', NL: '31', AU: '61', NZ: '64', IN: '91', CN: '86', JP: '81',
  SG: '65', AE: '971', SA: '966', IL: '972', TR: '90', EG: '20', MA: '212',
  TH: '66', MY: '60', PH: '63', ID: '62', VN: '84', PK: '92', BD: '880',
  HK: '852', TW: '886', KR: '82', SE: '46', NO: '47', DK: '45', FI: '358',
  PL: '48', IE: '353', PT: '351', CH: '41', AT: '43', BE: '32', CZ: '420',
  RO: '40', GR: '30', HU: '36', CO: '57', PE: '51', CL: '56', EC: '593',
  QA: '974', KW: '965', BH: '973', OM: '968', JO: '962',
};

/**
 * Extract phone country code from a 2-letter country code
 */
function extractPhoneCountryCode(countryCode: string): string {
  return COUNTRY_PHONE_CODES[countryCode?.toUpperCase()] || '260';
}

/**
 * Strip leading + and country code prefix from a phone number
 * ResellerClub expects phone WITHOUT the country code prefix
 */
function stripPhoneCountryCode(phone: string, countryCode: string): string {
  if (!phone) return '955000000';
  // Remove leading +, spaces, dashes
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const cc = COUNTRY_PHONE_CODES[countryCode?.toUpperCase()] || '';
  // Strip leading + followed by country code
  if (cleaned.startsWith('+' + cc)) {
    cleaned = cleaned.substring(cc.length + 1);
  } else if (cleaned.startsWith(cc) && cleaned.length > cc.length + 5) {
    cleaned = cleaned.substring(cc.length);
  }
  // Strip leading + if still present
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  return cleaned || '955000000';
}

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
    
    // Get or auto-create ResellerClub customer ID
    // This is a critical fallback — normally ensureResellerClubCustomer() runs at checkout time,
    // but if it failed or was skipped, we MUST create the customer now to avoid permanent failure.
    const customerId = await ensureResellerClubCustomerForProvisioning(
      admin,
      purchase.agency_id,
      purchase.user_id
    );
    
    if (!customerId) {
      throw new Error('Failed to create ResellerClub customer for this agency. Please contact support.');
    }
    
    // Get user email for contact creation
    const { data: userProfile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', purchase.user_id)
      .maybeSingle();
    const userEmail = userProfile?.email || '';
    
    // Create or get contact
    const contact = await contactService.createOrUpdate({
      name: (contactInfo?.name as string) || 'Domain Admin',
      company: (contactInfo?.company as string) || 'Agency',
      email: (contactInfo?.email as string) || userEmail || purchase.user_id + '@agency.local',
      addressLine1: (contactInfo?.address as string) || 'Not Provided',
      city: (contactInfo?.city as string) || 'Lusaka',
      state: (contactInfo?.state as string) || 'Lusaka',
      country: (contactInfo?.country as string) || 'ZM',
      zipcode: (contactInfo?.zipcode as string) || '10101',
      phoneCountryCode: extractPhoneCountryCode((contactInfo?.country as string) || 'ZM'),
      phone: stripPhoneCountryCode((contactInfo?.phone as string) || '955000000', (contactInfo?.country as string) || 'ZM'),
      customerId: customerId,
      type: 'Contact',
    });
    
    const contactId = String(contact.contactId);
    
    // GUARD: Ensure contactId is valid before calling RC registration API
    if (!contactId || contactId === 'undefined' || contactId === 'null' || contactId === '') {
      throw new Error(`[Provisioning] Invalid contactId="${contactId}" — cannot register domain without a valid ResellerClub contact. Contact response: ${JSON.stringify(contact)}`);
    }
    console.log(`[Provisioning] Using RC contact ${contactId} for domain ${domainName}`);
    
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
    
    // Create billing record for revenue tracking
    try {
      await admin.from('domain_billing_records').insert({
        agency_id: purchase.agency_id,
        domain_id: domainId,
        billing_type: 'registration',
        description: `Domain registration: ${domainName} (${years} year${years > 1 ? 's' : ''})`,
        wholesale_amount: purchase.wholesale_amount,
        retail_amount: purchase.retail_amount,
        profit_amount: (purchase.retail_amount || 0) - (purchase.wholesale_amount || 0),
        currency: purchase.currency || 'USD',
        payment_status: 'paid',
        paddle_transaction_id: purchase.paddle_transaction_id,
        billing_period_start: now.toISOString(),
        billing_period_end: expiryDate.toISOString(),
      });
    } catch (billingErr) {
      console.warn('[Provisioning] Failed to create billing record (non-fatal):', billingErr);
    }
    
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
      retry_count: ((await admin.from('pending_purchases').select('retry_count').eq('id', pendingPurchaseId).single()).data?.retry_count || 0) + 1,
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
    
    // Get or auto-create ResellerClub customer ID (CRITICAL FALLBACK)
    const customerId = await ensureResellerClubCustomerForProvisioning(
      admin,
      purchase.agency_id,
      purchase.user_id
    );
    
    if (!customerId) {
      throw new Error('Failed to create ResellerClub customer for this agency. Please contact support.');
    }
    
    // Get user email for contact creation
    const { data: userProfile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', purchase.user_id)
      .maybeSingle();
    const userEmail = userProfile?.email || '';
    
    // Create or get contact (reuse for all domains)
    const contact = await contactService.createOrUpdate({
      name: (contactInfo?.name as string) || 'Domain Admin',
      company: (contactInfo?.company as string) || 'Agency',
      email: (contactInfo?.email as string) || userEmail || purchase.user_id + '@agency.local',
      addressLine1: (contactInfo?.address as string) || 'Not Provided',
      city: (contactInfo?.city as string) || 'Lusaka',
      state: (contactInfo?.state as string) || 'Lusaka',
      country: (contactInfo?.country as string) || 'ZM',
      zipcode: (contactInfo?.zipcode as string) || '10101',
      phoneCountryCode: extractPhoneCountryCode((contactInfo?.country as string) || 'ZM'),
      phone: stripPhoneCountryCode((contactInfo?.phone as string) || '955000000', (contactInfo?.country as string) || 'ZM'),
      customerId: customerId,
      type: 'Contact',
    });
    
    const contactId = String(contact.contactId);
    
    // GUARD: Ensure contactId is valid before calling RC registration API
    if (!contactId || contactId === 'undefined' || contactId === 'null' || contactId === '') {
      throw new Error(`[Provisioning] Invalid contactId="${contactId}" — cannot register domains without a valid ResellerClub contact. Contact response: ${JSON.stringify(contact)}`);
    }
    console.log(`[Provisioning] Using RC contact ${contactId} for ${domains.length} domain(s)`);
    
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
          nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
          purchasePrivacy: domainConfig.privacy ?? true,
          invoiceOption: 'NoInvoice',
        });
        
        const orderId = String(result.orderId);
        
        // Create domain record in our database
        const { data: domain, error: insertError } = await admin
          .from('domains')
          .insert({
            agency_id: purchase.agency_id,
            client_id: purchase.client_id,
            domain_name: domainConfig.domainName.toLowerCase(),
            tld: domainConfig.tld || ('.' + domainConfig.domainName.split('.').slice(1).join('.')),
            sld: domainConfig.domainName.split('.')[0],
            status: 'active',
            resellerclub_order_id: orderId,
            resellerclub_customer_id: customerId,
            registration_years: domainConfig.years,
            registration_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + domainConfig.years * 365.25 * 24 * 60 * 60 * 1000).toISOString(),
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
    
    // Get or auto-create ResellerClub customer ID (CRITICAL FALLBACK)
    const customerId = await ensureResellerClubCustomerForProvisioning(
      admin,
      purchase.agency_id,
      purchase.user_id
    );
    
    if (!customerId) {
      throw new Error('Failed to create ResellerClub customer for this agency. Please contact support.');
    }
    
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

/**
 * Provision a domain transfer after payment
 * Called by the Paddle webhook when a domain_transfer transaction completes.
 */
export async function provisionDomainTransfer(
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
    const authCode = purchaseData.auth_code as string;
    const privacy = purchaseData.privacy as boolean | undefined;
    const autoRenew = purchaseData.auto_renew as boolean | undefined;
    const contactInfo = purchaseData.contact_info as Record<string, unknown> | undefined;

    // Get or auto-create ResellerClub customer ID (CRITICAL FALLBACK)
    const customerId = await ensureResellerClubCustomerForProvisioning(
      admin,
      purchase.agency_id,
      purchase.user_id
    );

    if (!customerId) {
      throw new Error('Failed to create ResellerClub customer for this agency. Please contact support.');
    }

    // Get user email for contact creation
    const { data: userProfileT } = await admin
      .from('profiles')
      .select('email')
      .eq('id', purchase.user_id)
      .maybeSingle();
    const userEmailT = userProfileT?.email || '';

    // Create or get contact for the transfer
    const contact = await contactService.createOrUpdate({
      name: (contactInfo?.name as string) || 'Domain Admin',
      company: (contactInfo?.company as string) || 'Agency',
      email: (contactInfo?.email as string) || userEmailT || purchase.user_id + '@agency.local',
      addressLine1: (contactInfo?.address as string) || 'Not Provided',
      city: (contactInfo?.city as string) || 'Lusaka',
      state: (contactInfo?.state as string) || 'Lusaka',
      country: (contactInfo?.country as string) || 'ZM',
      zipcode: (contactInfo?.zipcode as string) || '10101',
      phoneCountryCode: extractPhoneCountryCode((contactInfo?.country as string) || 'ZM'),
      phone: stripPhoneCountryCode((contactInfo?.phone as string) || '955000000', (contactInfo?.country as string) || 'ZM'),
      customerId: customerId,
      type: 'Contact',
    });

    const contactId = String(contact.contactId);

    // Initiate transfer via ResellerClub
    const result = await transferService.initiateTransferIn({
      domainName,
      authCode: authCode || '',
      customerId,
      registrantContactId: contactId,
      adminContactId: contactId,
      techContactId: contactId,
      billingContactId: contactId,
      purchasePrivacy: privacy ?? true,
      autoRenew: autoRenew ?? true,
    });

    const orderId = result.orderId;

    // Create transfer record in domain_transfers table
    await admin.from('domain_transfers').insert({
      agency_id: purchase.agency_id,
      domain_name: domainName,
      transfer_type: 'in',
      resellerclub_order_id: orderId,
      status: 'in-progress',
      current_step: 1,
      total_steps: 5,
      registrant_contact_id: contactId,
      admin_contact_id: contactId,
      tech_contact_id: contactId,
      billing_contact_id: contactId,
    });

    // Create domain order record
    await admin.from('domain_orders').insert({
      agency_id: purchase.agency_id,
      order_type: 'transfer',
      domain_name: domainName,
      years: 1,
      wholesale_price: purchase.wholesale_amount,
      retail_price: purchase.retail_amount,
      currency: purchase.currency,
      resellerclub_order_id: orderId,
      paddle_transaction_id: purchase.paddle_transaction_id,
      status: 'in-progress',
      payment_status: 'paid',
      pending_purchase_id: pendingPurchaseId,
      idempotency_key: purchase.idempotency_key,
    });

    // Update pending purchase to completed (transfer is in-progress but payment is done)
    await updatePendingPurchaseStatus(pendingPurchaseId, 'completed', {
      resellerclub_order_id: orderId,
      provisioned_resource_id: orderId,
      provisioned_at: new Date().toISOString(),
    });

    return {
      success: true,
      resourceId: orderId,
      resellerclubOrderId: orderId,
    };
  } catch (error) {
    console.error('[Provisioning] Domain transfer failed:', error);

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
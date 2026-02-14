// src/lib/resellerclub/reconciliation.ts
// ResellerClub Data Reconciliation Service
// Syncs domain and email order data from ResellerClub to detect discrepancies

import { createAdminClient } from '@/lib/supabase/admin';
import { domainService } from './domains';
import { businessEmailApi } from './email';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface ReconciliationResult {
  success: boolean;
  domainsChecked: number;
  domainsUpdated: number;
  emailOrdersChecked: number;
  emailOrdersUpdated: number;
  discrepancies: Array<{
    type: 'domain' | 'email';
    resourceId: string;
    resourceName: string;
    field: string;
    platformValue: unknown;
    resellerclubValue: unknown;
  }>;
  duration: number;
  error?: string;
}

/**
 * Reconcile a single domain with ResellerClub
 */
async function reconcileDomain(domainId: string): Promise<{
  updated: boolean;
  discrepancies: Array<{ field: string; platformValue: unknown; resellerclubValue: unknown }>;
  error?: string;
}> {
  const admin = createAdminClient() as SupabaseClient;
  
  try {
    // Get domain from database
    const { data: domain, error: fetchError } = await admin
      .from('domains')
      .select('*')
      .eq('id', domainId)
      .single();
    
    if (fetchError || !domain) {
      return { updated: false, discrepancies: [], error: 'Domain not found' };
    }
    
    // Skip if not registered via ResellerClub API
    if (!domain.resellerclub_order_id || !domain.registered_via_api) {
      return { updated: false, discrepancies: [] };
    }
    
    // Get current details from ResellerClub
    const rcDetails = await domainService.getDetails(domain.resellerclub_order_id);
    
    const discrepancies: Array<{ field: string; platformValue: unknown; resellerclubValue: unknown }> = [];
    const updates: Record<string, unknown> = {};
    
    // Check status
    if (domain.status !== rcDetails.currentStatus.toLowerCase()) {
      discrepancies.push({
        field: 'status',
        platformValue: domain.status,
        resellerclubValue: rcDetails.currentStatus.toLowerCase(),
      });
      updates.status = rcDetails.currentStatus.toLowerCase();
    }
    
    // Check expiry date (convert RC timestamp to ISO)
    const rcExpiry = new Date(parseInt(rcDetails.expiryDate) * 1000).toISOString();
    if (domain.expiry_date !== rcExpiry) {
      discrepancies.push({
        field: 'expiry_date',
        platformValue: domain.expiry_date,
        resellerclubValue: rcExpiry,
      });
      updates.expiry_date = rcExpiry;
    }
    
    // Check auto-renew
    if (domain.auto_renew !== rcDetails.autoRenew) {
      discrepancies.push({
        field: 'auto_renew',
        platformValue: domain.auto_renew,
        resellerclubValue: rcDetails.autoRenew,
      });
      updates.auto_renew = rcDetails.autoRenew;
    }
    
    // Check privacy protection
    if (domain.whois_privacy !== rcDetails.privacyProtection) {
      discrepancies.push({
        field: 'whois_privacy',
        platformValue: domain.whois_privacy,
        resellerclubValue: rcDetails.privacyProtection,
      });
      updates.whois_privacy = rcDetails.privacyProtection;
    }
    
    // Check transfer lock
    if (domain.transfer_lock !== rcDetails.transferLock) {
      discrepancies.push({
        field: 'transfer_lock',
        platformValue: domain.transfer_lock,
        resellerclubValue: rcDetails.transferLock,
      });
      updates.transfer_lock = rcDetails.transferLock;
    }
    
    // Check nameservers (compare arrays)
    const nsMatch = JSON.stringify(domain.nameservers || []) === JSON.stringify(rcDetails.nameservers);
    if (!nsMatch) {
      discrepancies.push({
        field: 'nameservers',
        platformValue: domain.nameservers,
        resellerclubValue: rcDetails.nameservers,
      });
      updates.nameservers = rcDetails.nameservers;
    }
    
    // Update if discrepancies found
    if (Object.keys(updates).length > 0) {
      updates.resellerclub_last_synced_at = new Date().toISOString();
      
      await admin
        .from('domains')
        .update(updates)
        .eq('id', domainId);
      
      return { updated: true, discrepancies };
    }
    
    // No updates needed, just update sync timestamp
    await admin
      .from('domains')
      .update({ resellerclub_last_synced_at: new Date().toISOString() })
      .eq('id', domainId);
    
    return { updated: false, discrepancies };
  } catch (error) {
    console.error('[Reconciliation] Domain sync error:', error);
    return {
      updated: false,
      discrepancies: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reconcile a single email order with ResellerClub
 */
async function reconcileEmailOrder(emailOrderId: string): Promise<{
  updated: boolean;
  discrepancies: Array<{ field: string; platformValue: unknown; resellerclubValue: unknown }>;
  error?: string;
}> {
  const admin = createAdminClient() as SupabaseClient;
  
  try {
    // Get email order from database
    const { data: order, error: fetchError } = await admin
      .from('email_orders')
      .select('*')
      .eq('id', emailOrderId)
      .single();
    
    if (fetchError || !order) {
      return { updated: false, discrepancies: [], error: 'Email order not found' };
    }
    
    // Skip if no ResellerClub order ID
    if (!order.resellerclub_order_id) {
      return { updated: false, discrepancies: [] };
    }
    
    // Get current details from ResellerClub
    const rcDetails = await businessEmailApi.getOrderDetails(order.resellerclub_order_id);
    
    const discrepancies: Array<{ field: string; platformValue: unknown; resellerclubValue: unknown }> = [];
    const updates: Record<string, unknown> = {};
    
    // Check status
    if (order.status !== rcDetails.currentStatus) {
      discrepancies.push({
        field: 'status',
        platformValue: order.status,
        resellerclubValue: rcDetails.currentStatus,
      });
      updates.status = rcDetails.currentStatus;
    }
    
    // Check number of accounts
    if (order.number_of_accounts !== rcDetails.numberOfAccounts) {
      discrepancies.push({
        field: 'number_of_accounts',
        platformValue: order.number_of_accounts,
        resellerclubValue: rcDetails.numberOfAccounts,
      });
      updates.number_of_accounts = rcDetails.numberOfAccounts;
    }
    
    // Check used accounts
    if (order.used_accounts !== rcDetails.usedAccounts) {
      discrepancies.push({
        field: 'used_accounts',
        platformValue: order.used_accounts,
        resellerclubValue: rcDetails.usedAccounts,
      });
      updates.used_accounts = rcDetails.usedAccounts;
    }
    
    // Check expiry date (convert RC timestamp to ISO)
    const rcExpiry = new Date(parseInt(rcDetails.endTime) * 1000).toISOString();
    if (order.expiry_date !== rcExpiry) {
      discrepancies.push({
        field: 'expiry_date',
        platformValue: order.expiry_date,
        resellerclubValue: rcExpiry,
      });
      updates.expiry_date = rcExpiry;
    }
    
    // Update if discrepancies found
    if (Object.keys(updates).length > 0) {
      updates.resellerclub_last_synced_at = new Date().toISOString();
      
      await admin
        .from('email_orders')
        .update(updates)
        .eq('id', emailOrderId);
      
      return { updated: true, discrepancies };
    }
    
    // No updates needed, just update sync timestamp
    await admin
      .from('email_orders')
      .update({ resellerclub_last_synced_at: new Date().toISOString() })
      .eq('id', emailOrderId);
    
    return { updated: false, discrepancies };
  } catch (error) {
    console.error('[Reconciliation] Email order sync error:', error);
    return {
      updated: false,
      discrepancies: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reconcile all domains for an agency
 */
export async function reconcileAgencyDomains(agencyId: string): Promise<ReconciliationResult> {
  const startTime = Date.now();
  const admin = createAdminClient() as SupabaseClient;
  
  let domainsChecked = 0;
  let domainsUpdated = 0;
  const allDiscrepancies: ReconciliationResult['discrepancies'] = [];
  
  try {
    // Get all active domains registered via API
    const { data: domains } = await admin
      .from('domains')
      .select('id, domain_name')
      .eq('agency_id', agencyId)
      .eq('registered_via_api', true)
      .not('resellerclub_order_id', 'is', null)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true });
    
    if (!domains || domains.length === 0) {
      return {
        success: true,
        domainsChecked: 0,
        domainsUpdated: 0,
        emailOrdersChecked: 0,
        emailOrdersUpdated: 0,
        discrepancies: [],
        duration: Date.now() - startTime,
      };
    }
    
    // Process each domain
    for (const domain of domains) {
      const result = await reconcileDomain(domain.id);
      domainsChecked++;
      
      if (result.updated) {
        domainsUpdated++;
      }
      
      if (result.discrepancies.length > 0) {
        allDiscrepancies.push(
          ...result.discrepancies.map(d => ({
            type: 'domain' as const,
            resourceId: domain.id,
            resourceName: domain.domain_name,
            field: d.field,
            platformValue: d.platformValue,
            resellerclubValue: d.resellerclubValue,
          }))
        );
      }
      
      // Rate limiting - wait 200ms between domains
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return {
      success: true,
      domainsChecked,
      domainsUpdated,
      emailOrdersChecked: 0,
      emailOrdersUpdated: 0,
      discrepancies: allDiscrepancies,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[Reconciliation] Agency domains sync error:', error);
    return {
      success: false,
      domainsChecked,
      domainsUpdated,
      emailOrdersChecked: 0,
      emailOrdersUpdated: 0,
      discrepancies: allDiscrepancies,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reconcile all email orders for an agency
 */
export async function reconcileAgencyEmailOrders(agencyId: string): Promise<ReconciliationResult> {
  const startTime = Date.now();
  const admin = createAdminClient() as SupabaseClient;
  
  let emailOrdersChecked = 0;
  let emailOrdersUpdated = 0;
  const allDiscrepancies: ReconciliationResult['discrepancies'] = [];
  
  try {
    // Get all active email orders
    const { data: orders } = await admin
      .from('email_orders')
      .select('id, domain_name')
      .eq('agency_id', agencyId)
      .not('resellerclub_order_id', 'is', null)
      .neq('status', 'Deleted')
      .order('created_at', { ascending: true });
    
    if (!orders || orders.length === 0) {
      return {
        success: true,
        domainsChecked: 0,
        domainsUpdated: 0,
        emailOrdersChecked: 0,
        emailOrdersUpdated: 0,
        discrepancies: [],
        duration: Date.now() - startTime,
      };
    }
    
    // Process each email order
    for (const order of orders) {
      const result = await reconcileEmailOrder(order.id);
      emailOrdersChecked++;
      
      if (result.updated) {
        emailOrdersUpdated++;
      }
      
      if (result.discrepancies.length > 0) {
        allDiscrepancies.push(
          ...result.discrepancies.map(d => ({
            type: 'email' as const,
            resourceId: order.id,
            resourceName: order.domain_name,
            field: d.field,
            platformValue: d.platformValue,
            resellerclubValue: d.resellerclubValue,
          }))
        );
      }
      
      // Rate limiting - wait 200ms between orders
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return {
      success: true,
      domainsChecked: 0,
      domainsUpdated: 0,
      emailOrdersChecked,
      emailOrdersUpdated,
      discrepancies: allDiscrepancies,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[Reconciliation] Agency email orders sync error:', error);
    return {
      success: false,
      domainsChecked: 0,
      domainsUpdated: 0,
      emailOrdersChecked,
      emailOrdersUpdated,
      discrepancies: allDiscrepancies,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reconcile all domains and email orders for an agency
 */
export async function reconcileAgency(agencyId: string): Promise<ReconciliationResult> {
  const startTime = Date.now();
  
  try {
    // Run domain and email reconciliation in parallel
    const [domainResult, emailResult] = await Promise.all([
      reconcileAgencyDomains(agencyId),
      reconcileAgencyEmailOrders(agencyId),
    ]);
    
    return {
      success: domainResult.success && emailResult.success,
      domainsChecked: domainResult.domainsChecked,
      domainsUpdated: domainResult.domainsUpdated,
      emailOrdersChecked: emailResult.emailOrdersChecked,
      emailOrdersUpdated: emailResult.emailOrdersUpdated,
      discrepancies: [...domainResult.discrepancies, ...emailResult.discrepancies],
      duration: Date.now() - startTime,
      error: domainResult.error || emailResult.error,
    };
  } catch (error) {
    console.error('[Reconciliation] Agency sync error:', error);
    return {
      success: false,
      domainsChecked: 0,
      domainsUpdated: 0,
      emailOrdersChecked: 0,
      emailOrdersUpdated: 0,
      discrepancies: [],
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

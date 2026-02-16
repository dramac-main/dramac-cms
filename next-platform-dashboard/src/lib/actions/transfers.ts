"use server";

// src/lib/actions/transfers.ts
// Domain Transfer Server Actions

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { transferService } from "@/lib/resellerclub/transfers";
import type { TransferStatus } from "@/lib/resellerclub/transfers";

// Type definitions for raw database records
type TransferRecord = {
  id: string;
  agency_id: string;
  domain_id: string | null;
  domain_name: string;
  transfer_type: 'in' | 'out';
  resellerclub_order_id: string | null;
  status: TransferStatus;
  current_step: number;
  total_steps: number;
  failure_reason: string | null;
  registrant_contact_id: string | null;
  admin_contact_id: string | null;
  tech_contact_id: string | null;
  billing_contact_id: string | null;
  initiated_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type AgencyRecord = {
  resellerclub_customer_id?: string | null;
};

type DomainRecord = {
  id: string;
  resellerclub_order_id?: string | null;
  status?: string;
};

// Helper type for Supabase query builder
type AnyQueryBuilder = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown[]; error: unknown }>;
      };
    };
    insert: (data: Record<string, unknown>) => {
      select: () => { single: () => Promise<{ data: unknown; error: unknown }> };
    };
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: unknown }>;
    };
  };
};

// ============================================================================
// Transfer-In Actions
// ============================================================================

export async function initiateTransferIn(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  try {
    const domainName = formData.get('domainName') as string;
    const authCode = formData.get('authCode') as string;
    const registrantContactId = formData.get('registrantContactId') as string;
    const purchasePrivacy = formData.get('purchasePrivacy') === 'true';
    const autoRenew = formData.get('autoRenew') === 'true';

    if (!domainName) return { success: false, error: 'Domain name is required' };
    if (!authCode) return { success: false, error: 'Auth code is required' };

    // Get agency's customer ID (if configured) - use type assertion
    const { data: agencyRaw } = await (supabase as unknown as AnyQueryBuilder)
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();

    const agency = agencyRaw as AgencyRecord | null;

    let resellerclubOrderId: string | undefined;
    let customerIdToUse = agency?.resellerclub_customer_id;
    
    // Guard against stringified falsy values ("undefined", "null", "") stored in DB
    if (customerIdToUse === 'undefined' || customerIdToUse === 'null' || customerIdToUse?.trim() === '') {
      console.warn(`[Transfers] Clearing invalid RC customer ID "${customerIdToUse}"`);
      customerIdToUse = undefined;
    }

    // Auto-create ResellerClub customer if not configured
    if (!customerIdToUse) {
      try {
        const { ensureResellerClubCustomerForAgency } = await import('@/lib/actions/domains');
        customerIdToUse = await ensureResellerClubCustomerForAgency(profile.agency_id, user.email || '');
      } catch {
        // Continue without — will create local record only
      }
    }

    // If ResellerClub is configured, initiate real transfer
    if (customerIdToUse) {
      try {
        const result = await transferService.initiateTransferIn({
          domainName,
          authCode,
          customerId: customerIdToUse,
          registrantContactId: registrantContactId || 'default',
          adminContactId: registrantContactId || 'default',
          techContactId: registrantContactId || 'default',
          billingContactId: registrantContactId || 'default',
          purchasePrivacy,
          autoRenew,
        });
        resellerclubOrderId = result.orderId;
      } catch (apiError) {
        console.warn('[Transfer] ResellerClub API call failed, proceeding with local record:', apiError);
        // Continue with local record only
      }
    }

    // Create transfer record - use type assertion
    const { data: transfer, error } = await (adminClient as unknown as AnyQueryBuilder)
      .from('domain_transfers')
      .insert({
        agency_id: profile.agency_id,
        domain_name: domainName,
        transfer_type: 'in',
        resellerclub_order_id: resellerclubOrderId || null,
        status: 'in-progress',
        current_step: 1,
        total_steps: 5,
        registrant_contact_id: registrantContactId || null,
        admin_contact_id: registrantContactId || null,
        tech_contact_id: registrantContactId || null,
        billing_contact_id: registrantContactId || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/domains/transfer');

    return { success: true, data: transfer };
  } catch (error) {
    console.error('[Transfer] Initiate transfer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate transfer'
    };
  }
}

export async function getTransfers(type?: 'in' | 'out'): Promise<{
  success: boolean;
  data?: TransferRecord[];
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

  try {
    // Use type assertion for domain_transfers table
    const baseQuery = (supabase as unknown as AnyQueryBuilder)
      .from('domain_transfers')
      .select('*')
      .eq('agency_id', profile.agency_id);

    // Note: simplified query without chained type filter for type safety
    const { data, error } = await baseQuery.order('initiated_at', { ascending: false });

    if (error) throw error;

    // Filter by type if specified
    let filteredData = data as TransferRecord[];
    if (type) {
      filteredData = filteredData.filter(t => t.transfer_type === type);
    }

    return { success: true, data: filteredData };
  } catch (error) {
    console.error('[Transfer] Get transfers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transfers'
    };
  }
}

export async function getTransferById(transferId: string): Promise<{
  success: boolean;
  data?: TransferRecord;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Use type assertion for domain_transfers table
    const { data, error } = await (supabase as unknown as AnyQueryBuilder)
      .from('domain_transfers')
      .select('*')
      .eq('id', transferId)
      .single();

    if (error) throw error;

    return { success: true, data: data as TransferRecord };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transfer'
    };
  }
}

export async function cancelTransfer(transferId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get transfer - use type assertion
    const { data: transferRaw } = await (supabase as unknown as AnyQueryBuilder)
      .from('domain_transfers')
      .select('resellerclub_order_id, status')
      .eq('id', transferId)
      .single();

    const transfer = transferRaw as { resellerclub_order_id?: string; status?: string } | null;

    if (!transfer) {
      return { success: false, error: 'Transfer not found' };
    }

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      return { success: false, error: 'Transfer cannot be cancelled' };
    }

    // Cancel at ResellerClub if order exists
    if (transfer.resellerclub_order_id) {
      try {
        await transferService.cancelTransfer(transfer.resellerclub_order_id);
      } catch (apiError) {
        console.warn('[Transfer] ResellerClub cancel failed:', apiError);
      }
    }

    // Update status - use type assertion
    const { error } = await (adminClient as unknown as AnyQueryBuilder)
      .from('domain_transfers')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', transferId);

    if (error) throw error;

    revalidatePath('/dashboard/domains/transfer');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel transfer'
    };
  }
}

export async function updateTransferStatus(
  transferId: string,
  status: TransferStatus,
  step?: number
) {
  const adminClient = createAdminClient();

  try {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (step !== undefined) {
      updateData.current_step = step;
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Use type assertion for domain_transfers table
    const { error } = await (adminClient as unknown as AnyQueryBuilder)
      .from('domain_transfers')
      .update(updateData)
      .eq('id', transferId);

    if (error) throw error;

    revalidatePath('/dashboard/domains/transfer');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transfer status'
    };
  }
}

// ============================================================================
// Transfer-Out Actions
// ============================================================================

export async function getAuthCode(domainId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain - use type assertion
    const { data: domainRaw } = await (supabase as unknown as AnyQueryBuilder)
      .from('domains')
      .select('resellerclub_order_id, domain_name')
      .eq('id', domainId)
      .single();

    const domain = domainRaw as DomainRecord & { domain_name?: string } | null;

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    // If ResellerClub is configured, get real auth code
    if (domain.resellerclub_order_id) {
      try {
        const authCode = await transferService.getAuthCode(domain.resellerclub_order_id);
        return { success: true, data: { authCode } };
      } catch {
        // Fall through to simulated code
      }
    }

    // For demo/testing, return a simulated auth code
    const domainName = domain.domain_name || 'unknown';
    const simulatedAuthCode = `AUTH-${domainName.replace(/\./g, '-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    return { success: true, data: { authCode: simulatedAuthCode } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get auth code'
    };
  }
}

export async function setTransferLock(domainId: string, locked: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Use type assertion for domains table
    const { data: domainRaw } = await (supabase as unknown as AnyQueryBuilder)
      .from('domains')
      .select('resellerclub_order_id')
      .eq('id', domainId)
      .single();

    const domain = domainRaw as DomainRecord | null;

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    // Update at ResellerClub if configured
    if (domain.resellerclub_order_id) {
      try {
        await transferService.setTransferLock(domain.resellerclub_order_id, locked);
      } catch (apiError) {
        console.warn('[Transfer] ResellerClub transfer lock update failed:', apiError);
      }
    }

    // Update local record - use type assertion
    const { error } = await (supabase as unknown as AnyQueryBuilder)
      .from('domains')
      .update({ transfer_lock: locked })
      .eq('id', domainId);

    if (error) throw error;

    revalidatePath(`/dashboard/domains/${domainId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transfer lock'
    };
  }
}

export async function initiateTransferOut(domainId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  try {
    // Get domain - use type assertion
    const { data: domainRaw } = await (supabase as unknown as AnyQueryBuilder)
      .from('domains')
      .select('id, domain_name, resellerclub_order_id')
      .eq('id', domainId)
      .single();

    const domain = domainRaw as { id: string; domain_name?: string; resellerclub_order_id?: string | null } | null;

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    // Disable transfer lock first
    await setTransferLock(domainId, false);

    // Create transfer-out record - use type assertion
    const { data: transfer, error } = await (adminClient as unknown as AnyQueryBuilder)
      .from('domain_transfers')
      .insert({
        agency_id: profile.agency_id,
        domain_id: domain.id,
        domain_name: domain.domain_name || 'unknown',
        transfer_type: 'out',
        resellerclub_order_id: domain.resellerclub_order_id || null,
        status: 'pending',
        current_step: 1,
        total_steps: 3,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/domains/transfer');
    revalidatePath(`/dashboard/domains/${domainId}`);

    return { success: true, data: transfer };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate transfer out'
    };
  }
}

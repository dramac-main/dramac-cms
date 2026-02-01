// src/lib/resellerclub/email/account-service.ts
// Email Account Service - Manage email accounts within orders

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { businessEmailApi } from './client';
import type { 
  CreateEmailAccountInput,
  EmailAccount,
} from './types';

// ============================================================================
// Email Account Service
// ============================================================================

export const emailAccountService = {
  /**
   * Add a new email account
   */
  async createAccount(params: CreateEmailAccountInput): Promise<EmailAccount> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get email order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (supabase as any)
      .from('email_orders')
      .select('resellerclub_order_id, domain_name, used_accounts, number_of_accounts')
      .eq('id', params.emailOrderId)
      .single();

    if (orderError || !order) {
      throw new Error('Email order not found');
    }

    // Check account limit
    if (order.used_accounts >= order.number_of_accounts) {
      throw new Error('Account limit reached. Please upgrade your plan.');
    }

    const fullEmail = `${params.username}@${order.domain_name}`;

    // Create account in ResellerClub
    await businessEmailApi.addEmailAccount({
      orderId: order.resellerclub_order_id,
      email: fullEmail,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
    });

    // Save to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: account, error: insertError } = await (adminClient as any)
      .from('email_accounts')
      .insert({
        email_order_id: params.emailOrderId,
        email: fullEmail,
        first_name: params.firstName,
        last_name: params.lastName,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update used accounts count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('email_orders')
      .update({ used_accounts: order.used_accounts + 1 })
      .eq('id', params.emailOrderId);

    return account as EmailAccount;
  },

  /**
   * Delete an email account
   */
  async deleteAccount(accountId: string): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get account with order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: account, error: accountError } = await (supabase as any)
      .from('email_accounts')
      .select(`
        *,
        email_order:email_orders(resellerclub_order_id, used_accounts)
      `)
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    const emailOrder = account.email_order as { resellerclub_order_id: string; used_accounts: number };

    // Delete in ResellerClub
    await businessEmailApi.deleteEmailAccount({
      orderId: emailOrder.resellerclub_order_id,
      email: account.email,
    });

    // Update database - mark as deleted (soft delete)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('email_accounts')
      .update({ status: 'deleted' })
      .eq('id', accountId);

    // Update used accounts count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('email_orders')
      .update({ used_accounts: Math.max(0, emailOrder.used_accounts - 1) })
      .eq('id', account.email_order_id);
  },

  /**
   * List email accounts for an order
   */
  async listAccounts(emailOrderId: string): Promise<EmailAccount[]> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('email_accounts')
      .select('*')
      .eq('email_order_id', emailOrderId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EmailAccount[];
  },

  /**
   * Get email account by ID
   */
  async getAccount(accountId: string): Promise<EmailAccount | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) return null;
    return data as EmailAccount;
  },

  /**
   * Sync accounts from ResellerClub
   */
  async syncAccounts(emailOrderId: string): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (supabase as any)
      .from('email_orders')
      .select('resellerclub_order_id')
      .eq('id', emailOrderId)
      .single();

    if (orderError || !order) {
      throw new Error('Email order not found');
    }

    // Get details from ResellerClub
    const rcDetails = await businessEmailApi.getOrderDetails(order.resellerclub_order_id);

    // Sync each account
    for (const rcAccount of rcDetails.emailAccounts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from('email_accounts')
        .upsert({
          email_order_id: emailOrderId,
          email: rcAccount.email,
          first_name: rcAccount.firstName,
          last_name: rcAccount.lastName,
          status: rcAccount.status,
          last_login: rcAccount.lastLogin || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email_order_id,email',
        });
    }

    // Update the order's used_accounts count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('email_orders')
      .update({ used_accounts: rcDetails.usedAccounts })
      .eq('id', emailOrderId);
  },

  /**
   * Suspend an email account
   */
  async suspendAccount(accountId: string): Promise<void> {
    const adminClient = createAdminClient();
    
    // Note: ResellerClub doesn't have individual account suspend
    // This is a local-only operation for record keeping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('email_accounts')
      .update({ status: 'suspended' })
      .eq('id', accountId);
  },

  /**
   * Unsuspend an email account
   */
  async unsuspendAccount(accountId: string): Promise<void> {
    const adminClient = createAdminClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('email_accounts')
      .update({ status: 'active' })
      .eq('id', accountId);
  },
};

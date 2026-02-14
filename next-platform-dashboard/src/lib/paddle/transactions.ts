// src/lib/paddle/transactions.ts
// Paddle One-Time Transactions for Domain/Email Purchases

import { paddle, isPaddleConfigured } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Transaction } from '@paddle/paddle-node-sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export interface CreateDomainPurchaseParams {
  agencyId: string;
  userId: string;
  clientId?: string;
  purchaseType: 'domain_register' | 'domain_renew' | 'domain_transfer';
  domainName: string;
  years: number;
  tld: string;
  wholesaleAmount: number;
  retailAmount: number;
  currency?: string;
  contactInfo?: Record<string, unknown>;
  privacy?: boolean;
  autoRenew?: boolean;
}

export interface CreateEmailPurchaseParams {
  agencyId: string;
  userId: string;
  clientId?: string;
  domainId?: string;
  domainName: string;
  numberOfAccounts: number;
  months: number;
  productKey?: string;
  wholesaleAmount: number;
  retailAmount: number;
  currency?: string;
}

export interface PendingPurchase {
  id: string;
  idempotencyKey: string;
  paddleTransactionId: string;
  checkoutUrl: string;
  status: string;
}

/**
 * Generate idempotency key for purchase
 */
function generateIdempotencyKey(
  agencyId: string,
  purchaseType: string,
  identifier: string
): string {
  const timestamp = Date.now();
  // Format: {agencyId}:{purchaseType}:{identifier}:{timestamp}
  return `${agencyId}:${purchaseType}:${identifier}:${timestamp}`;
}

/**
 * Create a domain purchase with Paddle transaction
 */
export async function createDomainPurchase(
  params: CreateDomainPurchaseParams
): Promise<PendingPurchase> {
  if (!isPaddleConfigured || !paddle) {
    throw new Error('Paddle not configured');
  }
  
  const admin = createAdminClient() as SupabaseClient;
  
  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey(
    params.agencyId,
    params.purchaseType,
    params.domainName
  );
  
  // Check if purchase already exists
  const { data: existing } = await admin
    .from('pending_purchases')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();
  
  if (existing) {
    // Return existing purchase if still valid
    if (existing.status === 'pending_payment' && new Date(existing.expires_at) > new Date()) {
      return {
        id: existing.id,
        idempotencyKey: existing.idempotency_key,
        paddleTransactionId: existing.paddle_transaction_id,
        checkoutUrl: existing.paddle_checkout_url,
        status: existing.status,
      };
    }
  }
  
  try {
    // Create Paddle transaction with custom non-catalog item
    const description = `${params.purchaseType.replace('domain_', 'Domain ')} - ${params.domainName} (${params.years} year${params.years > 1 ? 's' : ''})`;
    
    const transaction: Transaction = await paddle.transactions.create({
      items: [
        {
          quantity: 1,
          price: {
            description,
            name: `${params.domainName} - ${params.years}yr`,
            unit_price: {
              amount: String(Math.round(params.retailAmount * 100)), // Convert to cents
              currency_code: params.currency || 'USD',
            },
            product: {
              name: `Domain ${params.purchaseType.split('_')[1]}`,
              tax_category: 'standard',
              description: `${params.purchaseType.replace('_', ' ')} for ${params.domainName}`,
            },
          },
        },
      ],
      currency_code: params.currency || 'USD',
      custom_data: {
        purchase_type: params.purchaseType,
        agency_id: params.agencyId,
        user_id: params.userId,
        idempotency_key: idempotencyKey,
      },
    });
    
    // Create pending purchase record
    const { data: purchase, error } = await admin
      .from('pending_purchases')
      .insert({
        agency_id: params.agencyId,
        user_id: params.userId,
        client_id: params.clientId,
        purchase_type: params.purchaseType,
        purchase_data: {
          domain_name: params.domainName,
          years: params.years,
          tld: params.tld,
          contact_info: params.contactInfo,
          privacy: params.privacy,
          auto_renew: params.autoRenew,
        },
        wholesale_amount: params.wholesaleAmount,
        retail_amount: params.retailAmount,
        currency: params.currency || 'USD',
        paddle_transaction_id: transaction.id,
        paddle_checkout_url: transaction.checkout?.url || null,
        status: 'pending_payment',
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create pending purchase: ${error.message}`);
    }
    
    return {
      id: purchase.id,
      idempotencyKey: purchase.idempotency_key,
      paddleTransactionId: purchase.paddle_transaction_id,
      checkoutUrl: purchase.paddle_checkout_url,
      status: purchase.status,
    };
  } catch (error) {
    console.error('[Paddle] Failed to create domain purchase:', error);
    throw error;
  }
}

/**
 * Create an email purchase with Paddle transaction
 */
export async function createEmailPurchase(
  params: CreateEmailPurchaseParams
): Promise<PendingPurchase> {
  if (!isPaddleConfigured || !paddle) {
    throw new Error('Paddle not configured');
  }
  
  const admin = createAdminClient() as SupabaseClient;
  
  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey(
    params.agencyId,
    'email_order',
    `${params.domainName}-${params.months}mo`
  );
  
  // Check if purchase already exists
  const { data: existing } = await admin
    .from('pending_purchases')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();
  
  if (existing) {
    // Return existing purchase if still valid
    if (existing.status === 'pending_payment' && new Date(existing.expires_at) > new Date()) {
      return {
        id: existing.id,
        idempotencyKey: existing.idempotency_key,
        paddleTransactionId: existing.paddle_transaction_id,
        checkoutUrl: existing.paddle_checkout_url,
        status: existing.status,
      };
    }
  }
  
  try {
    // Create Paddle transaction with custom non-catalog item
    const description = `Business Email - ${params.domainName} (${params.numberOfAccounts} account${params.numberOfAccounts > 1 ? 's' : ''}, ${params.months} month${params.months > 1 ? 's' : ''})`;
    
    const transaction: Transaction = await paddle.transactions.create({
      items: [
        {
          quantity: 1,
          price: {
            description,
            name: `${params.domainName} Email - ${params.months}mo`,
            unit_price: {
              amount: String(Math.round(params.retailAmount * 100)), // Convert to cents
              currency_code: params.currency || 'USD',
            },
            product: {
              name: 'Business Email',
              tax_category: 'standard',
              description: `Business Email for ${params.domainName}`,
            },
          },
        },
      ],
      currency_code: params.currency || 'USD',
      custom_data: {
        purchase_type: 'email_order',
        agency_id: params.agencyId,
        user_id: params.userId,
        idempotency_key: idempotencyKey,
      },
    });
    
    // Create pending purchase record
    const { data: purchase, error } = await admin
      .from('pending_purchases')
      .insert({
        agency_id: params.agencyId,
        user_id: params.userId,
        client_id: params.clientId,
        purchase_type: 'email_order',
        purchase_data: {
          domain_id: params.domainId,
          domain_name: params.domainName,
          number_of_accounts: params.numberOfAccounts,
          months: params.months,
          product_key: params.productKey || 'eeliteus',
        },
        wholesale_amount: params.wholesaleAmount,
        retail_amount: params.retailAmount,
        currency: params.currency || 'USD',
        paddle_transaction_id: transaction.id,
        paddle_checkout_url: transaction.checkout?.url || null,
        status: 'pending_payment',
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create pending purchase: ${error.message}`);
    }
    
    return {
      id: purchase.id,
      idempotencyKey: purchase.idempotency_key,
      paddleTransactionId: purchase.paddle_transaction_id,
      checkoutUrl: purchase.paddle_checkout_url,
      status: purchase.status,
    };
  } catch (error) {
    console.error('[Paddle] Failed to create email purchase:', error);
    throw error;
  }
}

/**
 * Get pending purchase by ID
 */
export async function getPendingPurchase(
  purchaseId: string
): Promise<Record<string, unknown> | null> {
  const admin = createAdminClient() as SupabaseClient;
  
  const { data, error } = await admin
    .from('pending_purchases')
    .select('*')
    .eq('id', purchaseId)
    .single();
  
  if (error) {
    console.error('[Paddle] Failed to get pending purchase:', error);
    return null;
  }
  
  return data;
}

/**
 * Get pending purchase by Paddle transaction ID
 */
export async function getPendingPurchaseByTransaction(
  transactionId: string
): Promise<Record<string, unknown> | null> {
  const admin = createAdminClient() as SupabaseClient;
  
  const { data, error } = await admin
    .from('pending_purchases')
    .select('*')
    .eq('paddle_transaction_id', transactionId)
    .single();
  
  if (error) {
    console.error('[Paddle] Failed to get pending purchase:', error);
    return null;
  }
  
  return data;
}

/**
 * Update pending purchase status
 */
export async function updatePendingPurchaseStatus(
  purchaseId: string,
  status: string,
  updates?: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient() as SupabaseClient;
  
  const { error } = await admin
    .from('pending_purchases')
    .update({
      status,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', purchaseId);
  
  if (error) {
    console.error('[Paddle] Failed to update pending purchase:', error);
    throw error;
  }
}

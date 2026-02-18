// src/lib/paddle/transactions.ts
// Paddle One-Time Transactions for Domain/Email Purchases

import { paddle, isPaddleConfigured } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Transaction } from '@paddle/paddle-node-sdk';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

// =============================================================================
// Pre-Flight Balance Check — prevents overselling when RC balance is too low
// =============================================================================

/**
 * Check if the reseller has enough ResellerClub balance to fulfill a domain order.
 * This MUST be called BEFORE creating a Paddle transaction to prevent charging
 * customers for domains we can't afford to register.
 *
 * Industry standard: WHMCS, cPanel reseller panels all do this check.
 */
export async function checkResellerBalance(wholesaleAmount: number): Promise<{
  sufficient: boolean;
  balance: number;
  required: number;
  currency: string;
  shortfall: number;
}> {
  try {
    const { getResellerClubClient } = await import('@/lib/resellerclub');
    const client = getResellerClubClient();
    const { balance, currency } = await client.getBalance();
    
    const sufficient = balance >= wholesaleAmount;
    return {
      sufficient,
      balance,
      required: wholesaleAmount,
      currency,
      shortfall: sufficient ? 0 : wholesaleAmount - balance,
    };
  } catch (error) {
    console.error('[Paddle] Failed to check RC balance:', error);
    // If we can't check balance, allow the transaction but log a warning.
    // The provisioning step will catch insufficient funds and the auto-refund
    // mechanism will handle it.
    return {
      sufficient: true, // fail-open: don't block checkout if RC is unreachable
      balance: -1,
      required: wholesaleAmount,
      currency: 'USD',
      shortfall: 0,
    };
  }
}

// =============================================================================
// Auto-Refund — issues Paddle refund when provisioning fails
// =============================================================================

/**
 * Issue a full refund via Paddle Adjustments API when provisioning fails.
 * This is the safety net: if a customer paid but we couldn't register their
 * domain (e.g., insufficient RC funds), we refund automatically.
 *
 * Industry standard: All major platforms auto-refund on provisioning failure.
 */
export async function autoRefundTransaction(
  paddleTransactionId: string,
  reason: string,
  pendingPurchaseId?: string
): Promise<{ success: boolean; adjustmentId?: string; error?: string }> {
  if (!paddle) {
    return { success: false, error: 'Paddle not configured' };
  }

  try {
    console.log(`[Paddle] Issuing auto-refund for transaction ${paddleTransactionId}: ${reason}`);

    // Paddle Billing uses "Adjustments" for refunds
    // type: 'full' = refund the entire transaction amount (no items array needed)
    // action: 'refund' = returns money to customer's payment method
    const adjustment = await paddle.adjustments.create({
      action: 'refund',
      transactionId: paddleTransactionId,
      reason: reason.substring(0, 255), // Paddle limits reason length
      type: 'full', // Full refund — no items array needed
    });

    const adjustmentId = adjustment.id;
    console.log(`[Paddle] Auto-refund created: ${adjustmentId} for transaction ${paddleTransactionId}`);

    // Update the pending purchase status
    // Use 'failed' as fallback status if migration dm-12b hasn't added 'refunded' yet
    if (pendingPurchaseId) {
      const admin = createAdminClient() as SupabaseClient;
      
      // Try 'refunded' first (requires dm-12b migration)
      const { error: updateError } = await admin
        .from('pending_purchases')
        .update({
          status: 'refunded',
          refund_reason: reason,
          paddle_refund_id: adjustmentId,
          refunded_at: new Date().toISOString(),
        })
        .eq('id', pendingPurchaseId);
      
      // Fallback: if 'refunded' status violates CHECK constraint, use 'failed' + error_details
      if (updateError) {
        console.warn(`[Paddle] Could not set status='refunded', falling back to 'failed':`, updateError.message);
        await admin
          .from('pending_purchases')
          .update({
            status: 'failed',
            error_message: `Auto-refunded: ${reason}`,
            error_details: {
              refunded: true,
              paddle_refund_id: adjustmentId,
              refund_reason: reason,
              refunded_at: new Date().toISOString(),
            },
          })
          .eq('id', pendingPurchaseId);
      }
    }

    return { success: true, adjustmentId };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Paddle] Auto-refund FAILED for ${paddleTransactionId}:`, errorMsg);
    // Don't throw — log for manual intervention
    return { success: false, error: errorMsg };
  }
}

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
 * IMPORTANT: Must be deterministic for true idempotency.
 * Includes a price fingerprint so price corrections invalidate stale transactions.
 */
function generateIdempotencyKey(
  agencyId: string,
  purchaseType: string,
  identifier: string,
  amountCents?: number
): string {
  // Format: {agencyId}:{purchaseType}:{identifier}[:{amountCents}]
  // For multi-domain purchases, identifier should be a sorted, joined list
  const base = `${agencyId}:${purchaseType}:${identifier}`;
  if (amountCents != null && amountCents > 0) {
    return `${base}:${amountCents}`;
  }
  return base;
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
  
  // Generate idempotency key — includes years + amount so price/year changes
  // create a fresh transaction instead of reusing a stale one
  const retailCents = Math.round(params.retailAmount * 100);
  const idempotencyKey = generateIdempotencyKey(
    params.agencyId,
    params.purchaseType,
    `${params.domainName}-${params.years}yr`,
    retailCents
  );
  
  // Check if purchase already exists (maybeSingle avoids error if not found)
  const { data: existing } = await admin
    .from('pending_purchases')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  
  if (existing) {
    // Return existing purchase if still valid (pending and not expired)
    if (existing.status === 'pending_payment' && new Date(existing.expires_at) > new Date()) {
      return {
        id: existing.id,
        idempotencyKey: existing.idempotency_key,
        paddleTransactionId: existing.paddle_transaction_id,
        checkoutUrl: existing.paddle_checkout_url,
        status: existing.status,
      };
    }
    // If existing purchase is failed, cancelled, or expired — delete it so we can retry
    if (['failed', 'cancelled'].includes(existing.status) || new Date(existing.expires_at) <= new Date()) {
      await admin
        .from('pending_purchases')
        .delete()
        .eq('id', existing.id);
    }
  }
  
  // Also clean up any OLD pending purchases for the same domain(s) that have
  // a different idempotency key (e.g. user changed years or price was corrected).
  // This prevents orphaned pending_purchases from accumulating.
  try {
    const domainIdentifier = `${params.domainName}`;
    await admin
      .from('pending_purchases')
      .delete()
      .eq('agency_id', params.agencyId)
      .eq('purchase_type', params.purchaseType)
      .eq('status', 'pending_payment')
      .neq('idempotency_key', idempotencyKey)
      .like('idempotency_key', `%:${domainIdentifier}%`);
  } catch {
    // Non-critical — just cleanup, don't block checkout
  }
  
  try {
    // =========================================================================
    // PRE-FLIGHT BALANCE CHECK — Fail-open design with auto-refund safety
    // 
    // Strategy: WARN but DO NOT BLOCK. Let the checkout proceed even if RC 
    // balance is insufficient. This prevents false positives from blocking 
    // legitimate orders.
    //
    // Safety net: Auto-refund mechanism (Strategy 2 in payment safety) will 
    // issue full refund if provisioning fails after payment. Customer is 
    // protected and we avoid incorrectly blocking orders.
    //
    // Why fail-open?
    // - getBalance() API call can fail (network, API timeout, auth issues)
    // - Balance can change between check and provisioning (race condition)
    // - False positives damage user experience more than auto-refunds
    // - Auto-refund provides stronger safety than pre-flight blocking
    // =========================================================================
    const balanceCheck = await checkResellerBalance(params.wholesaleAmount);
    if (!balanceCheck.sufficient) {
      console.warn(
        `[Paddle] PRE-FLIGHT WARNING: RC balance ($${balanceCheck.balance.toFixed(2)}) ` +
        `insufficient for ${params.domainName} (needs $${balanceCheck.required.toFixed(2)}, ` +
        `shortfall: $${balanceCheck.shortfall.toFixed(2)}). ` +
        `Allowing checkout to proceed - auto-refund will handle provisioning failure.`
      );
    } else if (balanceCheck.balance > 0) {
      console.log(
        `[Paddle] Pre-flight OK: RC balance $${balanceCheck.balance.toFixed(2)} >= ` +
        `wholesale cost $${balanceCheck.required.toFixed(2)} for ${params.domainName}`
      );
    }

    // Create Paddle transaction with custom non-catalog item
    const description = `${params.purchaseType.replace('domain_', 'Domain ')} - ${params.domainName} (${params.years} year${params.years > 1 ? 's' : ''})${params.privacy ? ' + Privacy Protection' : ''}`;
    
    const transaction: Transaction = await paddle.transactions.create({
      items: [
        {
          quantity: 1,
          price: {
            description,
            name: `${params.domainName} (${params.years} Year${params.years > 1 ? 's' : ''})`,
            unitPrice: {
              amount: String(Math.round(params.retailAmount * 100)), // Convert to cents
              currencyCode: (params.currency || 'USD') as any,
            },
            // Lock quantity to exactly 1 — prevents Paddle checkout from showing
            // a quantity stepper that confuses users (they think it's years, not items)
            quantity: {
              minimum: 1,
              maximum: 1,
            },
            product: {
              name: `Domain ${params.purchaseType.split('_')[1]} - ${params.years}yr`,
              taxCategory: 'standard',
              description: `${params.purchaseType.replace('_', ' ')} for ${params.domainName} (${params.years} year${params.years > 1 ? 's' : ''})`,
            },
          },
        },
      ],
      currencyCode: (params.currency || 'USD') as any,
      customData: {
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
  
  // Generate idempotency key — includes months + amount
  const idempotencyKey = generateIdempotencyKey(
    params.agencyId,
    'email_order',
    `${params.domainName}-${params.months}mo`,
    Math.round(params.retailAmount * 100)
  );
  
  // Check if purchase already exists (use maybeSingle to avoid errors if not found)
  const { data: existing, error: existingError } = await admin
    .from('pending_purchases')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  
  if (existingError) {
    console.error('[Paddle] Error checking existing purchase:', existingError);
  }
  
  if (existing) {
    // Return existing purchase if still valid (pending and not expired)
    if (existing.status === 'pending_payment' && new Date(existing.expires_at) > new Date()) {
      return {
        id: existing.id,
        idempotencyKey: existing.idempotency_key,
        paddleTransactionId: existing.paddle_transaction_id,
        checkoutUrl: existing.paddle_checkout_url,
        status: existing.status,
      };
    }
    // If existing purchase is failed, cancelled, or expired — delete it so we can retry
    if (['failed', 'cancelled'].includes(existing.status) || new Date(existing.expires_at) <= new Date()) {
      await admin
        .from('pending_purchases')
        .delete()
        .eq('id', existing.id);
    }
  }
  
  // Clean up stale pending purchases for the same domain email
  // (e.g. user changed months or number of accounts)
  try {
    await admin
      .from('pending_purchases')
      .delete()
      .eq('agency_id', params.agencyId)
      .eq('purchase_type', 'email_order')
      .eq('status', 'pending_payment')
      .neq('idempotency_key', idempotencyKey)
      .like('idempotency_key', `%:${params.domainName}%`);
  } catch {
    // Non-critical — just cleanup, don't block checkout
  }
  
  try {
    // =========================================================================
    // PRE-FLIGHT BALANCE CHECK — Same safety mechanism as domain purchases
    // =========================================================================
    // Pre-flight balance check — FAIL-OPEN design (consistent with domain flow)
    // If RC balance is low, warn but allow checkout. The provisioning step will catch
    // actual failures and the auto-refund mechanism handles refunds automatically.
    // Blocking users on a balance check that may have false positives damages UX.
    const balanceCheck = await checkResellerBalance(params.wholesaleAmount);
    if (!balanceCheck.sufficient) {
      console.warn(
        `[Paddle] PRE-FLIGHT WARNING: RC balance ($${balanceCheck.balance.toFixed(2)}) ` +
        `may be insufficient for ${params.domainName} email (needs $${balanceCheck.required.toFixed(2)}, ` +
        `shortfall: $${balanceCheck.shortfall.toFixed(2)}). Proceeding — auto-refund will handle failures.`
      );
    } else if (balanceCheck.balance > 0) {
      console.log(
        `[Paddle] Pre-flight OK: RC balance $${balanceCheck.balance.toFixed(2)} >= ` +
        `wholesale cost $${balanceCheck.required.toFixed(2)} for ${params.domainName} email`
      );
    }

    // Create Paddle transaction with custom non-catalog item
    const isEnterprise = params.productKey === 'enterpriseemailus' || params.productKey === 'enterpriseemailin';
    const planName = isEnterprise ? 'Enterprise Email' : 'Business Email';
    const description = `${planName} - ${params.domainName} (${params.numberOfAccounts} account${params.numberOfAccounts > 1 ? 's' : ''}, ${params.months} month${params.months > 1 ? 's' : ''})`;

    const transaction: Transaction = await paddle.transactions.create({
      items: [
        {
          quantity: 1,
          price: {
            description,
            name: `${params.domainName} ${planName} - ${params.months}mo`,
            unitPrice: {
              amount: String(Math.round(params.retailAmount * 100)), // Convert to cents
              currencyCode: (params.currency || 'USD') as any,
            },
            // Lock quantity to exactly 1 — prevents checkout quantity editing
            quantity: {
              minimum: 1,
              maximum: 1,
            },
            product: {
              name: planName,
              taxCategory: 'standard',
              description: `${planName} for ${params.domainName}`,
            },
          },
        },
      ],
      currencyCode: (params.currency || 'USD') as any,
      customData: {
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

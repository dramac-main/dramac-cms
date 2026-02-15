/**
 * Paddle Webhook Handlers
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * Handles all Paddle webhook events:
 * - Subscription lifecycle (created, updated, canceled, paused, resumed)
 * - Transaction events (completed, payment_failed)
 * - Customer events (created, updated)
 * 
 * Also emits automation events for workflow integration.
 * 
 * NOTE: The Paddle tables (paddle_subscriptions, paddle_customers, paddle_products, 
 * paddle_transactions, paddle_webhooks, usage_billing_period) must be created by 
 * running the migration: migrations/em-59-paddle-billing.sql
 * 
 * After running the migration, regenerate Supabase types with:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
 * 
 * Until the migration is run, this file uses explicit typing to avoid TS errors.
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_CONFIGS } from './client';
import { DunningService } from './dunning-service';

// ============================================================================
// Types for Paddle Webhook Events
// ============================================================================

interface PaddleWebhookEvent {
  eventId: string;
  eventType: string;
  occurredAt: string;
  data: any;
}

// ============================================================================
// ============================================================================
// Main Event Handler
// ============================================================================

/**
 * Handle incoming Paddle webhook event
 */
export async function handlePaddleEvent(event: PaddleWebhookEvent): Promise<void> {
  console.log(`[Paddle Webhook] Processing event: ${event.eventType}`);
  
  switch (event.eventType) {
    // Subscription events
    case 'subscription.created':
      await handleSubscriptionCreated(event);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event);
      break;
    case 'subscription.paused':
      await handleSubscriptionPaused(event);
      break;
    case 'subscription.resumed':
      await handleSubscriptionResumed(event);
      break;
    case 'subscription.past_due':
      await handleSubscriptionPastDue(event);
      break;
    case 'subscription.activated':
      await handleSubscriptionActivated(event);
      break;
    
    // Transaction events
    case 'transaction.completed':
      await handleTransactionCompleted(event);
      break;
    case 'transaction.billed':
      await handleTransactionBilled(event);
      break;
    case 'transaction.payment_failed':
      await handlePaymentFailed(event);
      break;
    
    // Customer events
    case 'customer.created':
      await handleCustomerCreated(event);
      break;
    case 'customer.updated':
      await handleCustomerUpdated(event);
      break;
    
    default:
      console.log(`[Paddle Webhook] Unhandled event type: ${event.eventType}`);
  }
}

// ============================================================================
// Subscription Handlers
// ============================================================================

async function handleSubscriptionCreated(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  // Get agency ID from custom data
  const agencyId = data.customData?.agency_id;
  if (!agencyId) {
    console.error('[Paddle Webhook] No agency_id in subscription custom data');
    return;
  }
  
  // Determine plan type from price
  const planInfo = determinePlanFromPrice(data.items?.[0]?.price?.id);
  
  // Get included usage from our products table
  const { data: product } = await supabase.from('paddle_products')
    .select('*')
    .eq('plan_type', planInfo.planType)
    .eq('billing_cycle', planInfo.billingCycle)
    .maybeSingle();
  
  // Get or create customer record
  let customerId: string | null = null;
  const { data: existingCustomer } = await supabase.from('paddle_customers')
    .select('id')
    .eq('paddle_customer_id', data.customerId)
    .maybeSingle();
  
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    // Create customer record
    const { data: newCustomer, error: customerError } = await supabase.from('paddle_customers')
      .insert({
        agency_id: agencyId,
        paddle_customer_id: data.customerId,
        email: data.customer?.email || '',
        name: data.customer?.name || null,
      })
      .select('id')
      .single();
    
    if (customerError) {
      console.error('[Paddle Webhook] Error creating customer:', customerError);
    } else {
      customerId = newCustomer.id;
    }
  }
  
  if (!customerId) {
    console.error('[Paddle Webhook] Could not get/create customer record');
    return;
  }
  
  // Create subscription record
  const { error: subError } = await supabase.from('paddle_subscriptions')
    .insert({
      agency_id: agencyId,
      customer_id: customerId,
      paddle_subscription_id: data.id,
      paddle_product_id: data.items?.[0]?.product?.id || '',
      paddle_price_id: data.items?.[0]?.price?.id || '',
      plan_type: planInfo.planType,
      billing_cycle: planInfo.billingCycle,
      status: data.status,
      current_period_start: data.currentBillingPeriod?.startsAt,
      current_period_end: data.currentBillingPeriod?.endsAt,
      trial_end: data.trialPeriod?.endsAt || null,
      unit_price: parseInt(data.items?.[0]?.price?.unitPrice?.amount || '0'),
      currency: data.currencyCode || 'USD', // Paddle billing currency - USD is correct for platform billing
      included_automation_runs: product?.included_automation_runs || 0,
      included_ai_actions: product?.included_ai_actions || 0,
      included_api_calls: product?.included_api_calls || 0,
    });
  
  if (subError) {
    console.error('[Paddle Webhook] Error creating subscription:', subError);
    return;
  }
  
  // Update agency with subscription status
  await supabase
    .from('agencies')
    .update({
      subscription_status: 'active',
      subscription_plan: planInfo.planType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agencyId);
  
  // Emit automation event
  await emitBillingEvent(agencyId, 'billing.subscription.created', {
    subscription_id: data.id,
    agency_id: agencyId,
    plan_type: planInfo.planType,
    billing_cycle: planInfo.billingCycle,
    amount: parseInt(data.items?.[0]?.price?.unitPrice?.amount || '0'),
  });
  
  console.log(`[Paddle Webhook] Subscription created for agency ${agencyId}`);
}

async function handleSubscriptionUpdated(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  // Get existing subscription
  const { data: existing } = await supabase.from('paddle_subscriptions')
    .select('id, agency_id, plan_type, billing_cycle')
    .eq('paddle_subscription_id', data.id)
    .maybeSingle();
  
  if (!existing) {
    console.error('[Paddle Webhook] Subscription not found:', data.id);
    return;
  }
  
  // Check for plan change
  const newPlanInfo = determinePlanFromPrice(data.items?.[0]?.price?.id);
  const planChanged = existing.plan_type !== newPlanInfo.planType || 
                      existing.billing_cycle !== newPlanInfo.billingCycle;
  
  // Get new product limits if plan changed
  let productUpdate = {};
  if (planChanged) {
    const { data: product } = await supabase.from('paddle_products')
      .select('*')
      .eq('plan_type', newPlanInfo.planType)
      .eq('billing_cycle', newPlanInfo.billingCycle)
      .maybeSingle();
    
    if (product) {
      productUpdate = {
        plan_type: newPlanInfo.planType,
        billing_cycle: newPlanInfo.billingCycle,
        paddle_price_id: data.items?.[0]?.price?.id,
        included_automation_runs: product.included_automation_runs,
        included_ai_actions: product.included_ai_actions,
        included_api_calls: product.included_api_calls,
      };
    }
  }
  
  // Update subscription
  await supabase.from('paddle_subscriptions')
    .update({
      status: data.status,
      current_period_start: data.currentBillingPeriod?.startsAt,
      current_period_end: data.currentBillingPeriod?.endsAt,
      cancel_at_period_end: data.scheduledChange?.action === 'cancel',
      unit_price: parseInt(data.items?.[0]?.price?.unitPrice?.amount || '0'),
      ...productUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);
  
  // Emit plan change events
  if (planChanged) {
    const oldPlanLevel = getPlanLevel(existing.plan_type);
    const newPlanLevel = getPlanLevel(newPlanInfo.planType);
    
    if (newPlanLevel > oldPlanLevel) {
      await emitBillingEvent(existing.agency_id, 'billing.subscription.upgraded', {
        subscription_id: data.id,
        old_plan: existing.plan_type,
        new_plan: newPlanInfo.planType,
      });
    } else if (newPlanLevel < oldPlanLevel) {
      await emitBillingEvent(existing.agency_id, 'billing.subscription.downgraded', {
        subscription_id: data.id,
        old_plan: existing.plan_type,
        new_plan: newPlanInfo.planType,
      });
    }
    
    // Update agency plan
    await supabase
      .from('agencies')
      .update({
        subscription_plan: newPlanInfo.planType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.agency_id);
  }
  
  console.log(`[Paddle Webhook] Subscription updated: ${data.id}`);
}

async function handleSubscriptionCanceled(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  // Update subscription
  const { data: sub, error } = await supabase.from('paddle_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('agency_id')
    .maybeSingle();
  
  if (error || !sub) {
    console.error('[Paddle Webhook] Error updating canceled subscription:', error);
    return;
  }
  
  // Update agency
  await supabase
    .from('agencies')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.agency_id);
  
  // Emit automation event
  await emitBillingEvent(sub.agency_id, 'billing.subscription.canceled', {
    subscription_id: data.id,
    agency_id: sub.agency_id,
    reason: data.cancellationReason || 'user_requested',
  });
  
  console.log(`[Paddle Webhook] Subscription canceled: ${data.id}`);
}

async function handleSubscriptionPaused(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  await supabase.from('paddle_subscriptions')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id);
  
  console.log(`[Paddle Webhook] Subscription paused: ${data.id}`);
}

async function handleSubscriptionResumed(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  const { data: sub } = await supabase.from('paddle_subscriptions')
    .update({
      status: 'active',
      paused_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('agency_id')
    .maybeSingle();
  
  if (sub) {
    await supabase
      .from('agencies')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.agency_id);
  }
  
  console.log(`[Paddle Webhook] Subscription resumed: ${data.id}`);
}

async function handleSubscriptionPastDue(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  const { data: sub } = await supabase.from('paddle_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('agency_id')
    .maybeSingle();
  
  if (sub) {
    await supabase
      .from('agencies')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.agency_id);
  }
  
  console.log(`[Paddle Webhook] Subscription past due: ${data.id}`);
}

async function handleSubscriptionActivated(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  const { data: sub } = await supabase.from('paddle_subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .select('agency_id')
    .maybeSingle();
  
  if (sub) {
    await supabase
      .from('agencies')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.agency_id);
  }
  
  console.log(`[Paddle Webhook] Subscription activated: ${data.id}`);
}

// ============================================================================
// Transaction Handlers
// ============================================================================

async function handleTransactionCompleted(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  // Check if this is a domain/email purchase (custom_data contains purchase_type)
  const purchaseType = data.customData?.purchase_type;
  
  if (purchaseType && ['domain_register', 'domain_renew', 'domain_transfer', 'email_order'].includes(purchaseType)) {
    // This is a one-time domain/email purchase
    await handleDomainEmailPurchaseCompleted(event);
    return;
  }
  
  // Otherwise, this is a subscription transaction
  // Get agency from subscription
  const { data: sub } = await supabase.from('paddle_subscriptions')
    .select('agency_id, id')
    .eq('paddle_subscription_id', data.subscriptionId)
    .maybeSingle();
  
  if (!sub) {
    console.error('[Paddle Webhook] No subscription found for transaction:', data.subscriptionId);
    return;
  }
  
  // Create transaction record
  await supabase.from('paddle_transactions')
    .upsert({
      agency_id: sub.agency_id,
      subscription_id: sub.id,
      paddle_transaction_id: data.id,
      paddle_invoice_id: data.invoiceId || null,
      paddle_invoice_number: data.invoiceNumber || null,
      origin: data.origin,
      status: 'completed',
      subtotal: parseInt(data.details?.totals?.subtotal || '0'),
      tax: parseInt(data.details?.totals?.tax || '0'),
      total: parseInt(data.details?.totals?.total || '0'),
      currency: data.currencyCode || 'USD', // Paddle billing currency - USD is correct for platform billing
      line_items: data.items || [],
      billing_period_start: data.billingPeriod?.startsAt,
      billing_period_end: data.billingPeriod?.endsAt,
      invoice_url: data.checkout?.url || null,
      billed_at: data.billedAt,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'paddle_transaction_id',
    });
  
  // Emit automation event
  await emitBillingEvent(sub.agency_id, 'billing.payment.succeeded', {
    transaction_id: data.id,
    amount: parseInt(data.details?.totals?.total || '0'),
    currency: data.currencyCode || 'USD' // Paddle billing currency - USD is correct for platform billing,
  });
  
  // If this is a renewal, emit renewal event
  if (data.origin === 'subscription_recurring') {
    await emitBillingEvent(sub.agency_id, 'billing.subscription.renewed', {
      subscription_id: data.subscriptionId,
      amount: parseInt(data.details?.totals?.total || '0'),
      next_period_end: data.billingPeriod?.endsAt,
    });
  }
  
  console.log(`[Paddle Webhook] Transaction completed: ${data.id}`);
}

async function handleTransactionBilled(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  // Get agency from subscription
  const { data: sub } = await supabase.from('paddle_subscriptions')
    .select('agency_id, id')
    .eq('paddle_subscription_id', data.subscriptionId)
    .maybeSingle();
  
  if (!sub) {
    console.log('[Paddle Webhook] No subscription found for billed transaction');
    return;
  }
  
  // Create/update transaction record
  await supabase.from('paddle_transactions')
    .upsert({
      agency_id: sub.agency_id,
      subscription_id: sub.id,
      paddle_transaction_id: data.id,
      paddle_invoice_id: data.invoiceId || null,
      paddle_invoice_number: data.invoiceNumber || null,
      origin: data.origin,
      status: 'billed',
      subtotal: parseInt(data.details?.totals?.subtotal || '0'),
      tax: parseInt(data.details?.totals?.tax || '0'),
      total: parseInt(data.details?.totals?.total || '0'),
      currency: data.currencyCode || 'USD', // Paddle billing currency - USD is correct for platform billing
      line_items: data.items || [],
      billing_period_start: data.billingPeriod?.startsAt,
      billing_period_end: data.billingPeriod?.endsAt,
      billed_at: new Date().toISOString(),
    }, {
      onConflict: 'paddle_transaction_id',
    });
  
  console.log(`[Paddle Webhook] Transaction billed: ${data.id}`);
}

async function handlePaymentFailed(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  // Update subscription status
  await supabase.from('paddle_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.subscriptionId);
  
  // Get agency for notification
  const { data: sub } = await supabase.from('paddle_subscriptions')
    .select('agency_id')
    .eq('paddle_subscription_id', data.subscriptionId)
    .maybeSingle();
  
  if (sub) {
    // Update agency
    await supabase
      .from('agencies')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.agency_id);
    
    // Emit automation event
    await emitBillingEvent(sub.agency_id, 'billing.payment.failed', {
      transaction_id: data.id,
      agency_id: sub.agency_id,
      error_code: data.errorCode || 'unknown',
      retry_count: data.retryCount || 0,
    });
  }
  
  // Delegate to DunningService for email notifications, retry tracking, and escalation
  try {
    const dunning = new DunningService();
    await dunning.handlePaymentFailed(data.subscriptionId, data.id);
  } catch (err) {
    console.error('[Paddle Webhook] DunningService error (non-fatal):', err);
  }
  
  console.log(`[Paddle Webhook] Payment failed: ${data.id}`);
}

// ============================================================================
// Customer Handlers
// ============================================================================

async function handleCustomerCreated(event: PaddleWebhookEvent): Promise<void> {
  // Customer creation is handled during subscription creation
  // This is a backup handler
  console.log(`[Paddle Webhook] Customer created: ${event.data.id}`);
}

async function handleCustomerUpdated(event: PaddleWebhookEvent): Promise<void> {
  const supabase = createAdminClient();
  const data = event.data;
  
  await supabase.from('paddle_customers')
    .update({
      email: data.email,
      name: data.name || null,
      address_country: data.address?.countryCode || null,
      address_postal_code: data.address?.postalCode || null,
      address_city: data.address?.city || null,
      address_line1: data.address?.firstLine || null,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_customer_id', data.id);
  
  console.log(`[Paddle Webhook] Customer updated: ${data.id}`);
}

// ============================================================================
// Helper Functions
// ============================================================================

function determinePlanFromPrice(priceId: string | undefined): {
  planType: 'starter' | 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
} {
  if (!priceId) {
    return { planType: 'starter', billingCycle: 'monthly' };
  }
  
  // Check against our configured price IDs
  for (const [key, config] of Object.entries(PLAN_CONFIGS)) {
    if (config.priceId === priceId) {
      const [planType, billingCycle] = key.split('_');
      return {
        planType: planType as 'starter' | 'pro' | 'enterprise',
        billingCycle: billingCycle as 'monthly' | 'yearly',
      };
    }
  }
  
  // Fallback: try to determine from price ID naming
  const lowerPriceId = priceId.toLowerCase();
  
  const planType = lowerPriceId.includes('pro')
    ? 'pro'
    : lowerPriceId.includes('enterprise')
      ? 'enterprise'
      : 'starter';
  
  const billingCycle = lowerPriceId.includes('year')
    ? 'yearly'
    : 'monthly';
  
  return { planType, billingCycle };
}

function getPlanLevel(planType: string): number {
  switch (planType) {
    case 'enterprise': return 3;
    case 'pro': return 2;
    case 'starter': return 1;
    default: return 0;
  }
}

/**
 * Handle domain/email purchase transaction completion
 * Triggered when a one-time Paddle transaction for domain/email is completed
 */
async function handleDomainEmailPurchaseCompleted(event: PaddleWebhookEvent): Promise<void> {
  const data = event.data;
  const transactionId = data.id;
  
  console.log(`[Paddle Webhook] Domain/Email purchase completed: ${transactionId}`);
  
  try {
    // Import provisioning dynamically to avoid circular deps
    const { getPendingPurchaseByTransaction, updatePendingPurchaseStatus } = await import('@/lib/paddle/transactions');
    const { 
      provisionDomainRegistration, 
      provisionDomainRenewal, 
      provisionEmailOrder 
    } = await import('@/lib/resellerclub/provisioning');
    
    // Get pending purchase by transaction ID
    const purchase = await getPendingPurchaseByTransaction(transactionId);
    
    if (!purchase) {
      console.error('[Paddle Webhook] No pending purchase found for transaction:', transactionId);
      return;
    }
    
    // Check idempotency - if already processed, skip
    if (purchase.status === 'completed') {
      console.log('[Paddle Webhook] Purchase already completed (idempotent):', purchase.id);
      return;
    }
    
    if (purchase.status === 'provisioning') {
      console.log('[Paddle Webhook] Purchase already provisioning:', purchase.id);
      return;
    }
    
    // Update status to paid
    await updatePendingPurchaseStatus(purchase.id as string, 'paid');
    
    // Provision based on purchase type
    let result;
    const purchaseType = purchase.purchase_type as string;
    
    if (purchaseType === 'domain_register') {
      result = await provisionDomainRegistration(purchase.id as string);
    } else if (purchaseType === 'domain_renew') {
      result = await provisionDomainRenewal(purchase.id as string);
    } else if (purchaseType === 'email_order') {
      result = await provisionEmailOrder(purchase.id as string);
    } else {
      console.error('[Paddle Webhook] Unknown purchase type:', purchaseType);
      return;
    }
    
    if (result.success) {
      console.log(`[Paddle Webhook] Provisioning successful for ${purchaseType}:`, result.resourceId);
    } else {
      console.error(`[Paddle Webhook] Provisioning failed for ${purchaseType}:`, result.error);
    }
  } catch (error) {
    console.error('[Paddle Webhook] Error handling domain/email purchase:', error);
  }
}

/**
 * Emit a billing event for automation workflows
 */
async function emitBillingEvent(
  agencyId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    
    // Get a site ID for this agency (for event logging)
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('agency_id', agencyId)
      .limit(1)
      .maybeSingle();
    
    if (!site) {
      console.log('[Paddle Webhook] No site found for automation event');
      return;
    }
    
    // Log the event for automation processing
    // This integrates with the EM-57 automation module
    // Use any cast since payload types don't perfectly align
    await (supabase as any)
      .from('automation_events_log')
      .insert({
        site_id: site.id,
        event_type: eventType,
        payload: payload as any,
        source_module: 'paddle_billing',
      });
    
    console.log(`[Paddle Webhook] Emitted automation event: ${eventType}`);
  } catch (error) {
    console.error('[Paddle Webhook] Error emitting automation event:', error);
    // Don't throw - billing shouldn't fail due to automation
  }
}



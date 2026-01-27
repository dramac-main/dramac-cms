/**
 * Paddle Subscription Service
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * Manages subscription lifecycle including:
 * - Creating customers
 * - Managing subscriptions
 * - Plan changes (upgrades/downgrades)
 * - Cancellations and pauses
 * 
 * NOTE: The Paddle tables (paddle_subscriptions, paddle_customers, paddle_transactions)
 * must be created by running the migration: migrations/em-59-paddle-billing.sql
 * 
 * After running the migration, regenerate Supabase types with:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

import { paddle, isPaddleConfigured, PADDLE_IDS, PLAN_CONFIGS, getPlanConfig } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  PaddleSubscription,
  PaddleCustomer,
  PaddleTransaction,
  PaddleProduct,
  BillingOverview,
  UsageStats,
} from '@/types/paddle';

// ============================================================================
// Types
// ============================================================================

export interface CreateSubscriptionParams {
  agencyId: string;
  email: string;
  planType: 'starter' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  name?: string;
  customData?: Record<string, unknown>;
}

export interface SubscriptionDetails {
  id: string;
  paddleSubscriptionId: string;
  planType: string;
  billingCycle: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  unitPrice: number;
  currency: string;
  includedUsage: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
}

// ============================================================================
// Subscription Service
// ============================================================================

export class SubscriptionService {
  private supabase = createAdminClient();

  /**
   * Get subscription for an agency
   * First checks local database, then falls back to Paddle API if no record exists
   */
  async getSubscription(agencyId: string): Promise<SubscriptionDetails | null> {
    // First, try to get from local database
    const { data, error } = await this.supabase.from('paddle_subscriptions')
      .select('*')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();
    
    if (error) {
      console.error('[Paddle] Error fetching subscription:', error);
    }
    
    // If found in database, return it
    if (data) {
      return {
        id: data.id,
        paddleSubscriptionId: data.paddle_subscription_id,
        planType: data.plan_type,
        billingCycle: data.billing_cycle ?? 'monthly',
        status: data.status,
        currentPeriodStart: new Date(data.current_period_start ?? Date.now()),
        currentPeriodEnd: new Date(data.current_period_end ?? Date.now()),
        cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
        unitPrice: data.unit_price,
        currency: data.currency ?? 'USD',
        includedUsage: {
          automationRuns: data.included_automation_runs ?? 0,
          aiActions: data.included_ai_actions ?? 0,
          apiCalls: data.included_api_calls ?? 0,
        },
      };
    }
    
    // No local record - try to fetch from Paddle API directly
    // This handles the case where webhooks haven't been received yet
    const syncedSubscription = await this.syncSubscriptionFromPaddle(agencyId);
    return syncedSubscription;
  }

  /**
   * Sync subscription from Paddle API
   * Fetches active subscriptions for the customer and syncs to local database
   */
  async syncSubscriptionFromPaddle(agencyId: string): Promise<SubscriptionDetails | null> {
    if (!paddle) {
      console.warn('[Paddle] Paddle not configured, cannot sync from API');
      return null;
    }
    
    try {
      // Get customer from local database (need both the internal ID and paddle ID)
      const { data: customer } = await this.supabase.from('paddle_customers')
        .select('id, paddle_customer_id')
        .eq('agency_id', agencyId)
        .maybeSingle();
      
      if (!customer?.paddle_customer_id) {
        console.log('[Paddle] No customer found for agency:', agencyId);
        return null;
      }
      
      console.log('[Paddle] Syncing subscriptions for customer:', customer.paddle_customer_id);
      
      // Fetch subscriptions from Paddle API
      const subscriptionCollection = await paddle.subscriptions.list({
        customerId: [customer.paddle_customer_id],
        status: ['active', 'trialing', 'past_due'],
      });
      
      // Get the first subscription from the iterator
      let paddleSub = null;
      for await (const sub of subscriptionCollection) {
        paddleSub = sub;
        break; // Just get the first one
      }
      
      if (!paddleSub) {
        console.log('[Paddle] No active subscriptions found in Paddle');
        return null;
      }
      
      console.log('[Paddle] Found subscription in Paddle:', paddleSub.id, paddleSub.status);
      
      // Determine plan type from price ID
      const priceId = paddleSub.items?.[0]?.price?.id || '';
      const productId = paddleSub.items?.[0]?.price?.productId || '';
      const planType = this.getPlanTypeFromPriceId(priceId);
      const billingCycle = this.getBillingCycleFromPriceId(priceId);
      const planConfig = getPlanConfig(planType, billingCycle);
      
      // Extract unit price (in smallest currency unit, e.g., cents)
      const unitPrice = parseInt(paddleSub.items?.[0]?.price?.unitPrice?.amount || '0', 10);
      const currency = paddleSub.currencyCode || 'USD';
      
      // Save to local database - use correct column names from schema
      const { data: insertedSub, error: insertError } = await this.supabase
        .from('paddle_subscriptions')
        .upsert({
          agency_id: agencyId,
          customer_id: customer.id, // Use the internal UUID, not the paddle ID
          paddle_subscription_id: paddleSub.id,
          paddle_product_id: productId,
          paddle_price_id: priceId,
          plan_type: planType,
          billing_cycle: billingCycle,
          status: paddleSub.status,
          unit_price: unitPrice,
          currency: currency,
          current_period_start: paddleSub.currentBillingPeriod?.startsAt,
          current_period_end: paddleSub.currentBillingPeriod?.endsAt,
          cancel_at_period_end: paddleSub.scheduledChange?.action === 'cancel',
          included_automation_runs: planConfig?.includedUsage?.automationRuns ?? 0,
          included_ai_actions: planConfig?.includedUsage?.aiActions ?? 0,
          included_api_calls: planConfig?.includedUsage?.apiCalls ?? 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'paddle_subscription_id',
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[Paddle] Error saving synced subscription:', insertError);
        // Still return the data from Paddle even if save fails
      } else {
        console.log('[Paddle] Successfully synced subscription to database:', insertedSub?.id);
      }
      
      // Also update agency subscription status
      await this.supabase
        .from('agencies')
        .update({
          subscription_status: paddleSub.status,
          subscription_plan: planType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agencyId);
      
      return {
        id: insertedSub?.id || paddleSub.id,
        paddleSubscriptionId: paddleSub.id,
        planType: planType,
        billingCycle: billingCycle,
        status: paddleSub.status,
        currentPeriodStart: new Date(paddleSub.currentBillingPeriod?.startsAt || Date.now()),
        currentPeriodEnd: new Date(paddleSub.currentBillingPeriod?.endsAt || Date.now()),
        cancelAtPeriodEnd: paddleSub.scheduledChange?.action === 'cancel',
        unitPrice: unitPrice,
        currency: currency,
        includedUsage: {
          automationRuns: planConfig?.includedUsage?.automationRuns ?? 0,
          aiActions: planConfig?.includedUsage?.aiActions ?? 0,
          apiCalls: planConfig?.includedUsage?.apiCalls ?? 0,
        },
      };
    } catch (err) {
      console.error('[Paddle] Error syncing subscription from Paddle:', err);
      return null;
    }
  }

  /**
   * Determine plan type from Paddle price ID
   */
  private getPlanTypeFromPriceId(priceId: string): 'starter' | 'pro' {
    const starterPrices = [
      process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY,
      process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY,
    ];
    return starterPrices.includes(priceId) ? 'starter' : 'pro';
  }

  /**
   * Determine billing cycle from Paddle price ID
   */
  private getBillingCycleFromPriceId(priceId: string): 'monthly' | 'yearly' {
    const yearlyPrices = [
      process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY,
      process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY,
    ];
    return yearlyPrices.includes(priceId) ? 'yearly' : 'monthly';
  }

  /**
   * Get or create Paddle customer
   */
  async getOrCreateCustomer(
    agencyId: string,
    email: string,
    name?: string
  ): Promise<{ customerId: string; isNew: boolean }> {
    // Check for existing customer
    const { data: existing } = await this.supabase.from('paddle_customers')
      .select('id, paddle_customer_id')
      .eq('agency_id', agencyId)
      .maybeSingle();
    
    if (existing) {
      return {
        customerId: existing.paddle_customer_id,
        isNew: false,
      };
    }
    
    // Create new customer in Paddle
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    const customer = await paddle.customers.create({
      email,
      name: name || undefined,
    });
    
    // Save to database
    const { error } = await this.supabase.from('paddle_customers')
      .insert({
        agency_id: agencyId,
        paddle_customer_id: customer.id,
        email,
        name,
      });
    
    if (error) {
      console.error('[Paddle] Error creating customer record:', error);
      throw error;
    }
    
    return {
      customerId: customer.id,
      isNew: true,
    };
  }

  /**
   * Get customer by agency ID
   */
  async getCustomerByAgency(agencyId: string): Promise<PaddleCustomer | null> {
    const { data, error } = await this.supabase.from('paddle_customers')
      .select('*')
      .eq('agency_id', agencyId)
      .maybeSingle();
    
    if (error) {
      console.error('[Paddle] Error fetching customer:', error);
      return null;
    }
    
    return data as PaddleCustomer | null;
  }

  /**
   * Get checkout data for opening Paddle.js checkout
   * Returns the data needed to initialize checkout on the frontend
   */
  async getCheckoutData(params: CreateSubscriptionParams): Promise<{
    priceId: string;
    customerId: string | null;
    customerEmail: string;
    agencyId: string;
  }> {
    // Get price ID
    const planKey = `${params.planType}_${params.billingCycle}` as keyof typeof PLAN_CONFIGS;
    const planConfig = PLAN_CONFIGS[planKey];
    
    if (!planConfig || !planConfig.priceId) {
      throw new Error(`Invalid plan: ${params.planType} ${params.billingCycle}`);
    }
    
    // Try to get existing customer
    const { data: existingCustomer } = await this.supabase.from('paddle_customers')
      .select('paddle_customer_id')
      .eq('agency_id', params.agencyId)
      .maybeSingle();
    
    return {
      priceId: planConfig.priceId,
      customerId: existingCustomer?.paddle_customer_id || null,
      customerEmail: params.email,
      agencyId: params.agencyId,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    agencyId: string,
    immediately: boolean = false
  ): Promise<void> {
    // Get subscription
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('paddle_subscription_id, id')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();
    
    if (!sub) {
      throw new Error('No active subscription found');
    }
    
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    if (immediately) {
      // Cancel immediately
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: 'immediately',
      });
      
      // Update local record
      await this.supabase.from('paddle_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);
      
      // Update agency
      await this.supabase
        .from('agencies')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agencyId);
    } else {
      // Cancel at end of billing period
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: 'next_billing_period',
      });
      
      // Update local record
      await this.supabase.from('paddle_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(agencyId: string): Promise<void> {
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('paddle_subscription_id')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing'])
      .maybeSingle();
    
    if (!sub) {
      throw new Error('No active subscription found');
    }
    
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    await paddle.subscriptions.pause(sub.paddle_subscription_id, {
      effectiveFrom: 'next_billing_period',
    });
  }

  /**
   * Resume paused subscription
   */
  async resumeSubscription(agencyId: string): Promise<void> {
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('paddle_subscription_id')
      .eq('agency_id', agencyId)
      .eq('status', 'paused')
      .maybeSingle();
    
    if (!sub) {
      throw new Error('No paused subscription found');
    }
    
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    await paddle.subscriptions.resume(sub.paddle_subscription_id, {
      effectiveFrom: 'immediately',
    });
  }

  /**
   * Undo scheduled cancellation
   */
  async undoCancelSubscription(agencyId: string): Promise<void> {
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('paddle_subscription_id, id')
      .eq('agency_id', agencyId)
      .eq('cancel_at_period_end', true)
      .maybeSingle();
    
    if (!sub) {
      throw new Error('No subscription scheduled for cancellation');
    }
    
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    // Remove scheduled change
    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      scheduledChange: null,
    });
    
    // Update local record
    await this.supabase.from('paddle_subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id);
  }

  /**
   * Change subscription plan
   */
  async changePlan(
    agencyId: string,
    newPlanType: 'starter' | 'pro',
    newBillingCycle: 'monthly' | 'yearly',
    prorate: boolean = true
  ): Promise<void> {
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('paddle_subscription_id, plan_type, billing_cycle')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();
    
    if (!sub) {
      throw new Error('No active subscription found');
    }
    
    // Validate plan change
    if (sub.plan_type === newPlanType && sub.billing_cycle === newBillingCycle) {
      throw new Error('Already on this plan');
    }
    
    const planKey = `${newPlanType}_${newBillingCycle}` as keyof typeof PLAN_CONFIGS;
    const newPlanConfig = PLAN_CONFIGS[planKey];
    
    if (!newPlanConfig || !newPlanConfig.priceId) {
      throw new Error(`Invalid plan: ${newPlanType} ${newBillingCycle}`);
    }
    
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: newPlanConfig.priceId, quantity: 1 }],
      prorationBillingMode: prorate
        ? 'prorated_immediately'
        : 'full_next_billing_period',
    });
  }

  /**
   * Get invoices for an agency
   */
  async getInvoices(agencyId: string, limit: number = 10): Promise<PaddleTransaction[]> {
    const { data, error } = await this.supabase.from('paddle_transactions')
      .select('*')
      .eq('agency_id', agencyId)
      .in('status', ['completed', 'paid', 'billed'])
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[Paddle] Error fetching invoices:', error);
      return [];
    }
    
    return (data || []) as PaddleTransaction[];
  }

  /**
   * Get billing overview for an agency
   */
  async getBillingOverview(agencyId: string): Promise<BillingOverview> {
    // Parallel fetch all billing data
    const [subscription, customer, transactions, products] = await Promise.all([
      this.supabase.from('paddle_subscriptions')
        .select('*')
        .eq('agency_id', agencyId)
        .in('status', ['active', 'trialing', 'past_due', 'paused'])
        .maybeSingle()
        .then((r: any) => r.data),
      
      this.supabase.from('paddle_customers')
        .select('*')
        .eq('agency_id', agencyId)
        .maybeSingle()
        .then((r: any) => r.data),
      
      this.supabase.from('paddle_transactions')
        .select('*')
        .eq('agency_id', agencyId)
        .in('status', ['completed', 'paid', 'billed'])
        .order('created_at', { ascending: false })
        .limit(10)
        .then((r: any) => r.data || []),
      
      this.supabase.from('paddle_products')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .then((r: any) => r.data || []),
    ]);
    
    // Get usage if subscription exists
    let usage: UsageStats | null = null;
    if (subscription) {
      // Use any cast for RPC call to functions not in types yet
      const { data: usageData } = await (this.supabase as any)
        .rpc('get_current_period_usage', { p_agency_id: agencyId });
      
      if (usageData && usageData.length > 0) {
        const u = usageData[0] as any;
        usage = {
          automation_runs: u.automation_runs,
          ai_actions: u.ai_actions,
          api_calls: u.api_calls,
          included_automation_runs: subscription.included_automation_runs,
          included_ai_actions: subscription.included_ai_actions,
          included_api_calls: subscription.included_api_calls,
          overage_automation_runs: Math.max(0, u.automation_runs - subscription.included_automation_runs),
          overage_ai_actions: Math.max(0, u.ai_actions - subscription.included_ai_actions),
          overage_api_calls: Math.max(0, u.api_calls - subscription.included_api_calls),
          period_start: subscription.current_period_start,
          period_end: subscription.current_period_end,
        };
      }
    }
    
    return {
      subscription,
      customer,
      transactions,
      usage,
      products,
    };
  }

  /**
   * Get products/pricing for display
   */
  async getProducts(): Promise<PaddleProduct[]> {
    const { data, error } = await this.supabase.from('paddle_products')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (error) {
      console.error('[Paddle] Error fetching products:', error);
      return [];
    }
    
    return (data || []) as PaddleProduct[];
  }

  /**
   * Check if agency has active subscription
   */
  async hasActiveSubscription(agencyId: string): Promise<boolean> {
    const { count } = await this.supabase.from('paddle_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing']);
    
    return (count || 0) > 0;
  }

  /**
   * Get subscription status for agency
   */
  async getSubscriptionStatus(agencyId: string): Promise<string> {
    const { data } = await this.supabase.from('paddle_subscriptions')
      .select('status')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return data?.status || 'free';
  }

  /**
   * Reactivate a canceled subscription (before period end)
   * Phase EM-59B: Added for subscription management
   */
  async reactivateSubscription(agencyId: string): Promise<void> {
    // Get the subscription that's scheduled for cancellation
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('paddle_subscription_id, id, status, cancel_at_period_end')
      .eq('agency_id', agencyId)
      .or('cancel_at_period_end.eq.true,status.eq.canceled')
      .maybeSingle();
    
    if (!sub) {
      throw new Error('No subscription found to reactivate');
    }
    
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    // If subscription is still active but scheduled to cancel, just undo the cancellation
    if (sub.cancel_at_period_end && sub.status !== 'canceled') {
      await this.undoCancelSubscription(agencyId);
      return;
    }
    
    // If fully canceled, need to create a new subscription
    if (sub.status === 'canceled') {
      throw new Error('Subscription is fully canceled. Please create a new subscription.');
    }
    
    // Try to resume if paused
    if (sub.status === 'paused') {
      await paddle.subscriptions.resume(sub.paddle_subscription_id, {
        effectiveFrom: 'immediately',
      });
      
      // Update local record
      await this.supabase.from('paddle_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);
      
      // Update agency
      await this.supabase.from('agencies')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agencyId);
    }
  }

  /**
   * Get URL to update payment method
   * Phase EM-59B: Added for subscription management
   */
  async getUpdatePaymentUrl(agencyId: string): Promise<string | null> {
    // Get subscription
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('paddle_subscription_id')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due', 'paused'])
      .maybeSingle();
    
    if (!sub) {
      throw new Error('No active subscription found');
    }
    
    if (!paddle) {
      throw new Error('Paddle is not configured');
    }
    
    try {
      // Get the subscription from Paddle to get the update URL
      const subscription = await paddle.subscriptions.get(sub.paddle_subscription_id);
      
      // Paddle's update payment URL is typically accessed via the management URLs
      // The subscription object contains management_urls.update_payment_method
      const managementUrls = (subscription as any).managementUrls;
      if (managementUrls?.updatePaymentMethod) {
        return managementUrls.updatePaymentMethod;
      }
      
      // Fallback: Generate a checkout URL with existing customer for payment update
      // This is handled via the Paddle.js overlay on the frontend
      return null;
    } catch (error) {
      console.error('[Paddle] Error getting update payment URL:', error);
      throw new Error('Unable to get payment update URL');
    }
  }

  /**
   * Get subscription details including management URLs
   * Phase EM-59B: Added for subscription management
   */
  async getSubscriptionDetails(agencyId: string): Promise<{
    subscription: PaddleSubscription | null;
    managementUrls?: {
      cancel?: string;
      updatePaymentMethod?: string;
    };
  }> {
    // Get local subscription record
    const { data: localSub } = await this.supabase.from('paddle_subscriptions')
      .select('*')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due', 'paused'])
      .maybeSingle();
    
    if (!localSub) {
      return { subscription: null };
    }
    
    // Get fresh data from Paddle if available
    if (paddle && localSub.paddle_subscription_id) {
      try {
        const paddleSub = await paddle.subscriptions.get(localSub.paddle_subscription_id);
        const managementUrls = (paddleSub as any).managementUrls;
        
        return {
          subscription: localSub as PaddleSubscription,
          managementUrls: managementUrls ? {
            cancel: managementUrls.cancel,
            updatePaymentMethod: managementUrls.updatePaymentMethod,
          } : undefined,
        };
      } catch (error) {
        console.error('[Paddle] Error fetching subscription from Paddle:', error);
      }
    }
    
    return { subscription: localSub as PaddleSubscription };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();


/**
 * DRAMAC CMS - Paddle Billing Types
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * Paddle is the primary billing provider for DRAMAC CMS.
 * Supports Zambia payouts via Payoneer/Wise.
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

// ============================================================================
// Enums & Basic Types
// ============================================================================

export type PaddleSubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled';

export type BillingCycle = 'monthly' | 'yearly';

export type PlanType = 'starter' | 'pro' | 'enterprise' | 'addon';

export type TransactionOrigin = 
  | 'subscription_recurring'
  | 'subscription_charge'
  | 'subscription_payment_method_change'
  | 'web'
  | 'api';

export type TransactionStatus = 
  | 'draft'
  | 'ready'
  | 'billed'
  | 'paid'
  | 'completed'
  | 'canceled'
  | 'past_due';

// ============================================================================
// Core Entities
// ============================================================================

export interface PaddleCustomer {
  id: string;
  agency_id: string;
  paddle_customer_id: string;
  email: string;
  name: string | null;
  address_country: string | null;
  address_postal_code: string | null;
  address_city: string | null;
  address_line1: string | null;
  tax_identifier: string | null;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaddleSubscription {
  id: string;
  agency_id: string;
  customer_id: string;
  paddle_subscription_id: string;
  paddle_product_id: string;
  paddle_price_id: string;
  plan_type: PlanType;
  billing_cycle: BillingCycle;
  status: PaddleSubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  paused_at: string | null;
  cancel_at_period_end: boolean;
  cancellation_reason: string | null;
  unit_price: number;
  currency: string;
  included_automation_runs: number;
  included_ai_actions: number;
  included_api_calls: number;
  discount_id: string | null;
  discount_percentage: number | null;
  discount_ends_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaddleTransaction {
  id: string;
  agency_id: string;
  subscription_id: string | null;
  paddle_transaction_id: string;
  paddle_invoice_id: string | null;
  paddle_invoice_number: string | null;
  origin: TransactionOrigin;
  status: TransactionStatus;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  tax_rate: number | null;
  tax_rates: unknown[];
  line_items: unknown[];
  billing_period_start: string | null;
  billing_period_end: string | null;
  payment_method: string | null;
  card_last_four: string | null;
  invoice_url: string | null;
  receipt_url: string | null;
  billed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Usage Tracking
// ============================================================================

export interface UsageHourly {
  id: string;
  agency_id: string;
  site_id: string;
  hour_timestamp: string;
  automation_runs: number;
  ai_actions: number;
  api_calls: number;
  automation_by_workflow: Record<string, number>;
  ai_by_agent: Record<string, number>;
  api_by_endpoint: Record<string, number>;
  created_at: string;
}

export interface UsageDaily {
  id: string;
  agency_id: string;
  date: string;
  automation_runs: number;
  ai_actions: number;
  api_calls: number;
  usage_by_site: Record<string, {
    automation_runs: number;
    ai_actions: number;
    api_calls: number;
  }>;
  created_at: string;
}

export interface UsageBillingPeriod {
  id: string;
  agency_id: string;
  subscription_id: string;
  period_start: string;
  period_end: string;
  automation_runs: number;
  ai_actions: number;
  api_calls: number;
  included_automation_runs: number;
  included_ai_actions: number;
  included_api_calls: number;
  overage_automation_runs: number;
  overage_ai_actions: number;
  overage_api_calls: number;
  overage_cost: number;
  reported_to_paddle: boolean;
  reported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  automation_runs: number;
  ai_actions: number;
  api_calls: number;
  included_automation_runs: number;
  included_ai_actions: number;
  included_api_calls: number;
  overage_automation_runs: number;
  overage_ai_actions: number;
  overage_api_calls: number;
  period_start: string;
  period_end: string;
}

// ============================================================================
// Products & Pricing
// ============================================================================

export interface PaddleProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  paddle_product_id: string | null;
  paddle_price_id: string | null;
  plan_type: PlanType;
  billing_cycle: BillingCycle | 'one_time';
  price_cents: number;
  currency: string;
  included_automation_runs: number;
  included_ai_actions: number;
  included_api_calls: number;
  max_modules: number | null;
  max_sites: number | null;
  max_team_members: number | null;
  features: string[];
  overage_rate_automation: number | null;
  overage_rate_ai: number | null;
  overage_rate_api: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    modules: number;
    sites: number;
    teamMembers: number;
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
  popular?: boolean;
}

// ============================================================================
// Webhooks
// ============================================================================

export interface PaddleWebhook {
  id: string;
  paddle_event_id: string | null;
  event_type: string;
  payload: unknown;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  occurred_at: string | null;
  received_at: string;
  created_at: string;
}

export type PaddleWebhookEventType = 
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.past_due'
  | 'subscription.activated'
  | 'transaction.billed'
  | 'transaction.completed'
  | 'transaction.payment_failed'
  | 'customer.created'
  | 'customer.updated';

// ============================================================================
// Composite Types for UI
// ============================================================================

export interface BillingOverview {
  subscription: PaddleSubscription | null;
  customer: PaddleCustomer | null;
  transactions: PaddleTransaction[];
  usage: UsageStats | null;
  products: PaddleProduct[];
}

export interface SubscriptionWithCustomer extends PaddleSubscription {
  customer: PaddleCustomer;
}

export interface TransactionWithSubscription extends PaddleTransaction {
  subscription: PaddleSubscription | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateCheckoutParams {
  priceId: string;
  agencyId: string;
  email: string;
  customerId?: string;
  successUrl?: string;
  discountCode?: string;
}

export interface CreateCheckoutResult {
  checkoutUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  pause?: boolean;
  resume?: boolean;
  cancel?: boolean;
  cancelAtPeriodEnd?: boolean;
}

export interface ReportUsageParams {
  subscriptionId: string;
  priceId: string;
  quantity: number;
}

// ============================================================================
// Backwards Compatibility (DEPRECATED - will be removed after migration)
// ============================================================================

/**
 * @deprecated Use PaddleSubscription instead. This is kept for backwards compatibility.
 */
export interface LegacyBillingSubscription {
  id: string;
  agency_id: string;
  stripe_subscription_id?: string;        // Old Stripe field
  lemonsqueezy_subscription_id?: string;  // Old LemonSqueezy field
  status: string;
  billing_cycle: string;
  quantity: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

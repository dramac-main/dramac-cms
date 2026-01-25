/**
 * DEPRECATED: LemonSqueezy Payment Types
 * 
 * ⚠️ WARNING: This file contains legacy LemonSqueezy billing types.
 * 
 * LemonSqueezy does NOT support Zambia payouts, so DRAMAC is migrating
 * to Paddle as the primary billing provider.
 * 
 * DO NOT USE for new code. These types are kept for backwards compatibility
 * during the migration period only.
 * 
 * NEW CODE SHOULD USE: @/types/paddle
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 * @deprecated Use types from @/types/paddle instead
 */

export type SubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export type BillingInterval = "monthly" | "yearly";

/**
 * @deprecated Use PaddleProduct from @/types/paddle instead
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  /** @deprecated LemonSqueezy field */
  variant_id_monthly: string;
  /** @deprecated LemonSqueezy field */
  variant_id_yearly: string;
  features: string[];
  limits: {
    sites: number;
    clients: number;
    storage_gb: number;
    team_members: number;
    custom_domains: boolean;
    ai_generations: number;
    white_label: boolean;
  };
  popular?: boolean;
}

/**
 * @deprecated Use PaddleSubscription from @/types/paddle instead
 */
export interface Subscription {
  id: string;
  agency_id: string;
  plan_id: string;
  /** @deprecated LemonSqueezy field - use paddle_subscription_id */
  lemonsqueezy_subscription_id: string;
  /** @deprecated LemonSqueezy field - use paddle_customer_id */
  lemonsqueezy_customer_id: string;
  /** @deprecated LemonSqueezy field */
  lemonsqueezy_variant_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Use PaddleTransaction from @/types/paddle instead
 */
export interface Invoice {
  id: string;
  agency_id: string;
  subscription_id: string;
  /** @deprecated LemonSqueezy field - use paddle_transaction_id */
  lemonsqueezy_order_id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "refunded";
  invoice_url: string;
  receipt_url: string;
  created_at: string;
}

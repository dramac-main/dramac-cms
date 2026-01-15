export type SubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export type BillingInterval = "monthly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  variant_id_monthly: string;
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

export interface Subscription {
  id: string;
  agency_id: string;
  plan_id: string;
  lemonsqueezy_subscription_id: string;
  lemonsqueezy_customer_id: string;
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

export interface Invoice {
  id: string;
  agency_id: string;
  subscription_id: string;
  lemonsqueezy_order_id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "refunded";
  invoice_url: string;
  receipt_url: string;
  created_at: string;
}

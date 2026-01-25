/**
 * DEPRECATED: Stripe Billing Types
 * 
 * ⚠️ WARNING: This file contains legacy Stripe billing types.
 * 
 * DO NOT USE for new code. These types are kept for backwards compatibility
 * during the migration period only.
 * 
 * NEW CODE SHOULD USE: @/types/paddle
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 * @deprecated Use PaddleSubscription, PaddleCustomer from @/types/paddle instead
 */

/**
 * @deprecated Use PaddleCustomer from @/types/paddle instead
 */
export interface BillingCustomer {
  id: string;
  agency_id: string;
  /** @deprecated Stripe field - use paddle_customer_id */
  stripe_customer_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

/**
 * @deprecated Use PaddleSubscription from @/types/paddle instead
 */
export interface BillingSubscription {
  id: string;
  agency_id: string;
  /** @deprecated Stripe field - use paddle_subscription_id */
  stripe_subscription_id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  billing_cycle: "monthly" | "yearly";
  quantity: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Use PaddleTransaction from @/types/paddle instead
 */
export interface BillingInvoice {
  id: string;
  agency_id: string;
  /** @deprecated Stripe field - use paddle_transaction_id */
  stripe_invoice_id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

/**
 * @deprecated Use BillingOverview from @/types/paddle instead
 */
export interface BillingOverview {
  subscription: BillingSubscription | null;
  customer: BillingCustomer | null;
  invoices: BillingInvoice[];
  currentSeats: number;
  totalClients: number;
}

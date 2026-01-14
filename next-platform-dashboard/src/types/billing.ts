export interface BillingCustomer {
  id: string;
  agency_id: string;
  stripe_customer_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface BillingSubscription {
  id: string;
  agency_id: string;
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

export interface BillingInvoice {
  id: string;
  agency_id: string;
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

export interface BillingOverview {
  subscription: BillingSubscription | null;
  customer: BillingCustomer | null;
  invoices: BillingInvoice[];
  currentSeats: number;
  totalClients: number;
}

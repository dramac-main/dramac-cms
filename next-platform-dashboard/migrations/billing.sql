-- Customer records linking agencies to Stripe
CREATE TABLE public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions for seat-based billing
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  quantity INTEGER NOT NULL DEFAULT 0, -- Number of seats
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice history
CREATE TABLE public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage records for metered billing (modules)
CREATE TABLE public.billing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  stripe_subscription_item_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  idempotency_key TEXT UNIQUE
);

-- RLS Policies
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage ENABLE ROW LEVEL SECURITY;

-- Owners can view billing
CREATE POLICY "Owners can view billing customers"
  ON public.billing_customers FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can view subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can view invoices"
  ON public.billing_invoices FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Indexes
CREATE INDEX idx_billing_customers_stripe ON public.billing_customers(stripe_customer_id);
CREATE INDEX idx_billing_subscriptions_stripe ON public.billing_subscriptions(stripe_subscription_id);
CREATE INDEX idx_billing_invoices_agency ON public.billing_invoices(agency_id);

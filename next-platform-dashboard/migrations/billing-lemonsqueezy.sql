-- Phase 53: LemonSqueezy Payment Integration
-- Subscriptions table for LemonSqueezy

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  plan_id text NOT NULL DEFAULT 'free',
  lemonsqueezy_subscription_id text UNIQUE,
  lemonsqueezy_customer_id text,
  lemonsqueezy_variant_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  lemonsqueezy_order_id text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'paid',
  invoice_url text,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ls_id ON subscriptions(lemonsqueezy_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agency ON invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view their agency subscription" ON subscriptions;
CREATE POLICY "Users can view their agency subscription"
  ON subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access subscriptions" ON subscriptions;
CREATE POLICY "Service role full access subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own agency subscription (for free tier)
DROP POLICY IF EXISTS "Users can insert their agency subscription" ON subscriptions;
CREATE POLICY "Users can insert their agency subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view their agency invoices" ON invoices;
CREATE POLICY "Users can view their agency invoices"
  ON invoices FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access invoices" ON invoices;
CREATE POLICY "Service role full access invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Comments for documentation
COMMENT ON TABLE subscriptions IS 'LemonSqueezy subscription data for agencies';
COMMENT ON TABLE invoices IS 'Payment invoices from LemonSqueezy';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status: on_trial, active, paused, past_due, unpaid, cancelled, expired';
COMMENT ON COLUMN subscriptions.plan_id IS 'References plan ID from application config (free, starter, professional, enterprise)';

-- ============================================================================
-- Phase EM-59: Paddle Billing Schema
-- Created: 2026-01-25
-- Description: Replaces LemonSqueezy with Paddle billing integration
-- 
-- Paddle is the primary billing provider for DRAMAC CMS.
-- Supports Zambia payouts via Payoneer/Wise.
-- 
-- @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
-- ============================================================================

-- ============================================================================
-- PADDLE CUSTOMERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Paddle identifiers
  paddle_customer_id TEXT NOT NULL UNIQUE,
  
  -- Customer info
  email TEXT NOT NULL,
  name TEXT,
  
  -- Address (for tax)
  address_country TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  address_line1 TEXT,
  
  -- Tax
  tax_identifier TEXT,
  
  -- Metadata
  marketing_consent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PADDLE SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES paddle_customers(id) ON DELETE CASCADE,
  
  -- Paddle identifiers
  paddle_subscription_id TEXT NOT NULL UNIQUE,
  paddle_product_id TEXT NOT NULL,
  paddle_price_id TEXT NOT NULL,
  
  -- Plan details
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing',
    'active',
    'past_due',
    'paused',
    'canceled'
  )),
  
  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  
  -- Pricing at time of subscription
  unit_price INTEGER NOT NULL,           -- In cents
  currency TEXT DEFAULT 'USD',
  
  -- Included usage (snapshot at subscription time)
  included_automation_runs INTEGER DEFAULT 0,
  included_ai_actions INTEGER DEFAULT 0,
  included_api_calls INTEGER DEFAULT 0,
  
  -- Discount
  discount_id TEXT,
  discount_percentage DECIMAL(5,2),
  discount_ends_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PADDLE TRANSACTIONS (Invoices)
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES paddle_subscriptions(id) ON DELETE SET NULL,
  
  -- Paddle identifiers
  paddle_transaction_id TEXT NOT NULL UNIQUE,
  paddle_invoice_id TEXT,
  paddle_invoice_number TEXT,
  
  -- Type
  origin TEXT CHECK (origin IN (
    'subscription_recurring',
    'subscription_charge',
    'subscription_payment_method_change',
    'web',
    'api'
  )),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'draft',
    'ready',
    'billed',
    'paid',
    'completed',
    'canceled',
    'past_due'
  )),
  
  -- Amounts
  subtotal INTEGER NOT NULL,             -- Before tax, in cents
  tax INTEGER DEFAULT 0,                 -- Tax amount
  total INTEGER NOT NULL,                -- Final amount
  currency TEXT DEFAULT 'USD',
  
  -- Tax details
  tax_rate DECIMAL(5,4),
  tax_rates JSONB DEFAULT '[]',          -- Multiple tax rates if applicable
  
  -- Line items
  line_items JSONB DEFAULT '[]',
  
  -- Billing period
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  
  -- Payment
  payment_method TEXT,
  card_last_four TEXT,
  
  -- URLs
  invoice_url TEXT,
  receipt_url TEXT,
  
  -- Dates
  billed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USAGE TRACKING
-- ============================================================================

-- Hourly usage buckets (for real-time tracking)
CREATE TABLE IF NOT EXISTS usage_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Time bucket
  hour_timestamp TIMESTAMPTZ NOT NULL,   -- Truncated to hour
  
  -- Counts
  automation_runs INTEGER DEFAULT 0,
  ai_actions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Breakdown by type
  automation_by_workflow JSONB DEFAULT '{}',  -- { workflow_id: count }
  ai_by_agent JSONB DEFAULT '{}',             -- { agent_id: count }
  api_by_endpoint JSONB DEFAULT '{}',         -- { endpoint: count }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (agency_id, site_id, hour_timestamp)
);

-- Daily usage aggregates
CREATE TABLE IF NOT EXISTS usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL,
  
  -- Totals
  automation_runs INTEGER DEFAULT 0,
  ai_actions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Breakdown by site
  usage_by_site JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (agency_id, date)
);

-- Billing period usage (for invoicing)
CREATE TABLE IF NOT EXISTS usage_billing_period (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES paddle_subscriptions(id) ON DELETE CASCADE,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Usage totals
  automation_runs INTEGER DEFAULT 0,
  ai_actions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Included (from plan)
  included_automation_runs INTEGER DEFAULT 0,
  included_ai_actions INTEGER DEFAULT 0,
  included_api_calls INTEGER DEFAULT 0,
  
  -- Overage
  overage_automation_runs INTEGER DEFAULT 0,
  overage_ai_actions INTEGER DEFAULT 0,
  overage_api_calls INTEGER DEFAULT 0,
  
  -- Overage cost (in cents)
  overage_cost INTEGER DEFAULT 0,
  
  -- Status
  reported_to_paddle BOOLEAN DEFAULT false,
  reported_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (subscription_id, period_start)
);

-- ============================================================================
-- PADDLE PRODUCTS (Platform Configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug TEXT NOT NULL UNIQUE,             -- 'starter_monthly', 'pro_yearly', etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Paddle IDs
  paddle_product_id TEXT,
  paddle_price_id TEXT,
  
  -- Pricing
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise', 'addon')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Included usage
  included_automation_runs INTEGER DEFAULT 0,
  included_ai_actions INTEGER DEFAULT 0,
  included_api_calls INTEGER DEFAULT 0,
  
  -- Limits
  max_modules INTEGER,
  max_sites INTEGER,
  max_team_members INTEGER,
  
  -- Features
  features JSONB DEFAULT '[]',
  
  -- Overage rates (cents per unit)
  overage_rate_automation DECIMAL(10,6),
  overage_rate_ai DECIMAL(10,6),
  overage_rate_api DECIMAL(10,6),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PADDLE WEBHOOKS LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  paddle_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  
  -- Timing
  occurred_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_paddle_customers_agency ON paddle_customers(agency_id);
CREATE INDEX IF NOT EXISTS idx_paddle_customers_paddle_id ON paddle_customers(paddle_customer_id);

CREATE INDEX IF NOT EXISTS idx_paddle_subscriptions_agency ON paddle_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_paddle_subscriptions_status ON paddle_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_paddle_subscriptions_paddle_id ON paddle_subscriptions(paddle_subscription_id);

CREATE INDEX IF NOT EXISTS idx_paddle_transactions_agency ON paddle_transactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_paddle_transactions_subscription ON paddle_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_paddle_transactions_status ON paddle_transactions(status);

CREATE INDEX IF NOT EXISTS idx_usage_hourly_agency_hour ON usage_hourly(agency_id, hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_hourly_site_hour ON usage_hourly(site_id, hour_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_usage_daily_agency_date ON usage_daily(agency_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_usage_billing_period_sub ON usage_billing_period(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_billing_period_dates ON usage_billing_period(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_paddle_webhooks_event_type ON paddle_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_paddle_webhooks_processed ON paddle_webhooks(processed) WHERE processed = false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE paddle_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_billing_period ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_webhooks ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies
DO $$ 
BEGIN
  -- paddle_customers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_customers' AND policyname = 'Service role bypass paddle_customers') THEN
    CREATE POLICY "Service role bypass paddle_customers" ON paddle_customers FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  -- paddle_subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_subscriptions' AND policyname = 'Service role bypass paddle_subscriptions') THEN
    CREATE POLICY "Service role bypass paddle_subscriptions" ON paddle_subscriptions FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  -- paddle_transactions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_transactions' AND policyname = 'Service role bypass paddle_transactions') THEN
    CREATE POLICY "Service role bypass paddle_transactions" ON paddle_transactions FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  -- usage_hourly
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_hourly' AND policyname = 'Service role bypass usage_hourly') THEN
    CREATE POLICY "Service role bypass usage_hourly" ON usage_hourly FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  -- usage_daily
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_daily' AND policyname = 'Service role bypass usage_daily') THEN
    CREATE POLICY "Service role bypass usage_daily" ON usage_daily FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  -- usage_billing_period
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_billing_period' AND policyname = 'Service role bypass usage_billing_period') THEN
    CREATE POLICY "Service role bypass usage_billing_period" ON usage_billing_period FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  -- paddle_products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_products' AND policyname = 'Service role bypass paddle_products') THEN
    CREATE POLICY "Service role bypass paddle_products" ON paddle_products FOR ALL USING (auth.role() = 'service_role');
  END IF;
  
  -- paddle_webhooks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_webhooks' AND policyname = 'Service role bypass paddle_webhooks') THEN
    CREATE POLICY "Service role bypass paddle_webhooks" ON paddle_webhooks FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- User policies
DO $$
BEGIN
  -- Users can view their agency's customer
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_customers' AND policyname = 'Users can view their agency customer') THEN
    CREATE POLICY "Users can view their agency customer" ON paddle_customers
      FOR SELECT USING (agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      ));
  END IF;

  -- Users can view their agency's subscription
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_subscriptions' AND policyname = 'Users can view their agency subscription') THEN
    CREATE POLICY "Users can view their agency subscription" ON paddle_subscriptions
      FOR SELECT USING (agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      ));
  END IF;

  -- Users can view their agency's transactions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_transactions' AND policyname = 'Users can view their agency transactions') THEN
    CREATE POLICY "Users can view their agency transactions" ON paddle_transactions
      FOR SELECT USING (agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      ));
  END IF;

  -- Users can view their agency's hourly usage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_hourly' AND policyname = 'Users can view their agency usage_hourly') THEN
    CREATE POLICY "Users can view their agency usage_hourly" ON usage_hourly
      FOR SELECT USING (agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      ));
  END IF;

  -- Users can view their agency's daily usage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_daily' AND policyname = 'Users can view their agency usage_daily') THEN
    CREATE POLICY "Users can view their agency usage_daily" ON usage_daily
      FOR SELECT USING (agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      ));
  END IF;

  -- Users can view their agency's billing period
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_billing_period' AND policyname = 'Users can view their agency billing_period') THEN
    CREATE POLICY "Users can view their agency billing_period" ON usage_billing_period
      FOR SELECT USING (agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      ));
  END IF;

  -- Products are public (read-only)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_products' AND policyname = 'Anyone can view active products') THEN
    CREATE POLICY "Anyone can view active products" ON paddle_products
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Increment usage (atomic operation)
CREATE OR REPLACE FUNCTION increment_usage(
  p_agency_id UUID,
  p_site_id UUID,
  p_automation_runs INTEGER DEFAULT 0,
  p_ai_actions INTEGER DEFAULT 0,
  p_api_calls INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_hour TIMESTAMPTZ;
BEGIN
  v_hour := date_trunc('hour', NOW());
  
  INSERT INTO usage_hourly (
    agency_id, site_id, hour_timestamp,
    automation_runs, ai_actions, api_calls
  ) VALUES (
    p_agency_id, p_site_id, v_hour,
    p_automation_runs, p_ai_actions, p_api_calls
  )
  ON CONFLICT (agency_id, site_id, hour_timestamp)
  DO UPDATE SET
    automation_runs = usage_hourly.automation_runs + p_automation_runs,
    ai_actions = usage_hourly.ai_actions + p_ai_actions,
    api_calls = usage_hourly.api_calls + p_api_calls;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggregate daily usage (called by cron)
CREATE OR REPLACE FUNCTION aggregate_daily_usage(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO usage_daily (agency_id, date, automation_runs, ai_actions, api_calls, usage_by_site)
  SELECT 
    agency_id,
    p_date,
    SUM(automation_runs),
    SUM(ai_actions),
    SUM(api_calls),
    jsonb_object_agg(site_id::text, jsonb_build_object(
      'automation_runs', total_automation,
      'ai_actions', total_ai,
      'api_calls', total_api
    ))
  FROM (
    SELECT 
      agency_id,
      site_id,
      SUM(automation_runs) as total_automation,
      SUM(ai_actions) as total_ai,
      SUM(api_calls) as total_api,
      SUM(automation_runs) as automation_runs,
      SUM(ai_actions) as ai_actions,
      SUM(api_calls) as api_calls
    FROM usage_hourly
    WHERE hour_timestamp >= p_date::timestamptz
      AND hour_timestamp < (p_date + 1)::timestamptz
    GROUP BY agency_id, site_id
  ) subq
  GROUP BY agency_id
  ON CONFLICT (agency_id, date)
  DO UPDATE SET
    automation_runs = EXCLUDED.automation_runs,
    ai_actions = EXCLUDED.ai_actions,
    api_calls = EXCLUDED.api_calls,
    usage_by_site = EXCLUDED.usage_by_site;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current period usage for an agency
CREATE OR REPLACE FUNCTION get_current_period_usage(p_agency_id UUID)
RETURNS TABLE (
  automation_runs BIGINT,
  ai_actions BIGINT,
  api_calls BIGINT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(uh.automation_runs), 0)::BIGINT,
    COALESCE(SUM(uh.ai_actions), 0)::BIGINT,
    COALESCE(SUM(uh.api_calls), 0)::BIGINT,
    ps.current_period_start,
    ps.current_period_end
  FROM paddle_subscriptions ps
  LEFT JOIN usage_hourly uh ON uh.agency_id = ps.agency_id
    AND uh.hour_timestamp >= ps.current_period_start
    AND uh.hour_timestamp < ps.current_period_end
  WHERE ps.agency_id = p_agency_id
    AND ps.status IN ('active', 'trialing', 'past_due')
  GROUP BY ps.current_period_start, ps.current_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate overage for a subscription
CREATE OR REPLACE FUNCTION calculate_overage(p_subscription_id UUID)
RETURNS TABLE (
  overage_automation INTEGER,
  overage_ai INTEGER,
  overage_api INTEGER,
  overage_cost_cents INTEGER
) AS $$
DECLARE
  v_sub RECORD;
  v_usage RECORD;
  v_rates RECORD;
  v_overage_automation INTEGER;
  v_overage_ai INTEGER;
  v_overage_api INTEGER;
  v_overage_cost INTEGER;
BEGIN
  -- Get subscription details
  SELECT * INTO v_sub FROM paddle_subscriptions WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get current usage
  SELECT 
    COALESCE(SUM(uh.automation_runs), 0) as total_automation_runs,
    COALESCE(SUM(uh.ai_actions), 0) as total_ai_actions,
    COALESCE(SUM(uh.api_calls), 0) as total_api_calls
  INTO v_usage
  FROM usage_hourly uh
  WHERE uh.agency_id = v_sub.agency_id
    AND uh.hour_timestamp >= v_sub.current_period_start
    AND uh.hour_timestamp < v_sub.current_period_end;
  
  -- Get overage rates from product
  SELECT 
    pp.overage_rate_automation,
    pp.overage_rate_ai,
    pp.overage_rate_api
  INTO v_rates
  FROM paddle_products pp
  WHERE pp.plan_type = v_sub.plan_type
    AND pp.billing_cycle = v_sub.billing_cycle;
  
  -- Calculate overages
  v_overage_automation := GREATEST(0, v_usage.total_automation_runs - v_sub.included_automation_runs);
  v_overage_ai := GREATEST(0, v_usage.total_ai_actions - v_sub.included_ai_actions);
  v_overage_api := GREATEST(0, v_usage.total_api_calls - v_sub.included_api_calls);
  
  -- Calculate cost (convert to cents)
  v_overage_cost := (
    (v_overage_automation * COALESCE(v_rates.overage_rate_automation, 0)) +
    (v_overage_ai * COALESCE(v_rates.overage_rate_ai, 0)) +
    (v_overage_api * COALESCE(v_rates.overage_rate_api, 0))
  )::INTEGER * 100;
  
  overage_automation := v_overage_automation;
  overage_ai := v_overage_ai;
  overage_api := v_overage_api;
  overage_cost_cents := v_overage_cost;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Products
-- ============================================================================

INSERT INTO paddle_products (slug, name, description, plan_type, billing_cycle, price_cents, included_automation_runs, included_ai_actions, included_api_calls, max_modules, max_sites, max_team_members, overage_rate_automation, overage_rate_ai, overage_rate_api, features, display_order) VALUES

('starter_monthly', 'Starter Monthly', 'Perfect for small businesses getting started', 'starter', 'monthly', 2900,
  1000, 500, 10000, 3, 1, 3,
  0.001, 0.005, 0.0001,
  '["3 modules", "1 site", "3 team members", "Basic support", "1,000 automation runs/mo", "500 AI actions/mo"]',
  1),

('starter_yearly', 'Starter Yearly', 'Perfect for small businesses getting started - Save 17%', 'starter', 'yearly', 29000,
  12000, 6000, 120000, 3, 1, 3,
  0.001, 0.005, 0.0001,
  '["3 modules", "1 site", "3 team members", "Basic support", "12,000 automation runs/yr", "6,000 AI actions/yr", "Save 17%"]',
  2),

('pro_monthly', 'Pro Monthly', 'For growing businesses that need more power', 'pro', 'monthly', 9900,
  10000, 5000, 100000, 10, 5, 10,
  0.0005, 0.0025, 0.00005,
  '["10 modules", "5 sites", "10 team members", "Priority support", "Custom domain", "White-label", "10,000 automation runs/mo", "5,000 AI actions/mo", "50% overage discount"]',
  3),

('pro_yearly', 'Pro Yearly', 'For growing businesses that need more power - Save 17%', 'pro', 'yearly', 99000,
  120000, 60000, 1200000, 10, 5, 10,
  0.0005, 0.0025, 0.00005,
  '["10 modules", "5 sites", "10 team members", "Priority support", "Custom domain", "White-label", "120,000 automation runs/yr", "60,000 AI actions/yr", "50% overage discount", "Save 17%"]',
  4),

('ai_agent_pack', 'AI Agent Pack', 'Extra AI actions for power users', 'addon', 'monthly', 4900,
  0, 5000, 0, NULL, NULL, NULL,
  NULL, 0.003, NULL,
  '["5,000 extra AI actions/mo", "Priority AI queue", "Advanced AI models"]',
  10),

('white_label_complete', 'White-label Complete', 'Remove all DRAMAC branding', 'addon', 'monthly', 9900,
  0, 0, 0, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '["Custom branding", "Remove DRAMAC branding", "Custom email domain", "Custom login page"]',
  11)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  included_automation_runs = EXCLUDED.included_automation_runs,
  included_ai_actions = EXCLUDED.included_ai_actions,
  included_api_calls = EXCLUDED.included_api_calls,
  max_modules = EXCLUDED.max_modules,
  max_sites = EXCLUDED.max_sites,
  max_team_members = EXCLUDED.max_team_members,
  overage_rate_automation = EXCLUDED.overage_rate_automation,
  overage_rate_ai = EXCLUDED.overage_rate_ai,
  overage_rate_api = EXCLUDED.overage_rate_api,
  updated_at = NOW();

-- ============================================================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION increment_usage TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_daily_usage TO service_role;
GRANT EXECUTE ON FUNCTION get_current_period_usage TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_overage TO authenticated;

-- ============================================================================
-- Add subscription_status and subscription_plan to agencies table if not exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'subscription_status') THEN
    ALTER TABLE agencies ADD COLUMN subscription_status TEXT DEFAULT 'free';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'subscription_plan') THEN
    ALTER TABLE agencies ADD COLUMN subscription_plan TEXT DEFAULT NULL;
  END IF;
END $$;

-- ============================================================================
-- CLEANUP NOTE: Run this AFTER migration is verified
-- ============================================================================
-- The following tables should be dropped after verifying Paddle migration:
-- - subscriptions (LemonSqueezy)
-- - invoices (LemonSqueezy)
-- - billing_customers (Stripe)
-- - billing_subscriptions (Stripe)
-- - billing_invoices (Stripe)
-- - billing_usage (Stripe)
-- 
-- See: migrations/em-59-cleanup-old-billing.sql
-- ============================================================================

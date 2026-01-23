-- migrations/em-43-revenue-schema.sql
-- Phase EM-43: Revenue Sharing Dashboard
-- Developer payout accounts, module sales, payouts, usage records, analytics

-- ============================================================================
-- DEVELOPER PAYOUT ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS developer_payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
  
  -- Stripe Connect
  stripe_account_id TEXT UNIQUE,
  stripe_account_status TEXT DEFAULT 'pending' CHECK (stripe_account_status IN (
    'pending', 'active', 'restricted', 'disabled'
  )),
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  
  -- Payout Preferences
  payout_frequency TEXT DEFAULT 'monthly' CHECK (payout_frequency IN (
    'weekly', 'biweekly', 'monthly'
  )),
  payout_threshold DECIMAL(10,2) DEFAULT 50.00,
  payout_currency TEXT DEFAULT 'USD',
  
  -- Tax Info
  tax_form_type TEXT CHECK (tax_form_type IN ('W-9', 'W-8BEN', 'W-8BEN-E')),
  tax_form_submitted_at TIMESTAMPTZ,
  tax_form_verified BOOLEAN DEFAULT false,
  tax_id_last4 TEXT,
  
  -- Stats
  total_earnings DECIMAL(12,2) DEFAULT 0,
  total_paid_out DECIMAL(12,2) DEFAULT 0,
  pending_balance DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(developer_id)
);

-- ============================================================================
-- MODULE REVENUE CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_revenue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Pricing
  base_price DECIMAL(10,2),
  price_type TEXT NOT NULL CHECK (price_type IN (
    'free', 'one_time', 'subscription', 'usage_based'
  )),
  
  -- Revenue Split
  platform_fee_percent DECIMAL(5,2) DEFAULT 30.00,
  developer_share_percent DECIMAL(5,2) DEFAULT 70.00,
  
  -- Subscription tiers
  tiers JSONB DEFAULT '[]'::jsonb,
  
  -- Usage-based pricing
  usage_unit TEXT,
  usage_rate DECIMAL(10,6),
  usage_included INTEGER,
  
  -- Trial
  trial_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id)
);

-- ============================================================================
-- SALES TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  agency_id UUID REFERENCES agencies(id),
  site_id UUID REFERENCES sites(id),
  
  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'subscription', 'renewal', 'upgrade', 'usage', 'refund'
  )),
  
  -- Amounts
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  developer_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'pending', 'completed', 'refunded', 'disputed', 'failed'
  )),
  
  -- Refund tracking
  refund_reason TEXT,
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYOUTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS developer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id),
  payout_account_id UUID NOT NULL REFERENCES developer_payout_accounts(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  gross_earnings DECIMAL(12,2) NOT NULL,
  platform_fees DECIMAL(12,2) NOT NULL,
  net_earnings DECIMAL(12,2) NOT NULL,
  refunds DECIMAL(12,2) DEFAULT 0,
  adjustments DECIMAL(12,2) DEFAULT 0,
  payout_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  
  -- Stripe
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,
  
  -- Processing
  scheduled_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  failed_reason TEXT,
  
  -- Statement
  statement_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYOUT LINE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payout_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES developer_payouts(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES module_sales(id),
  
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USAGE RECORDS (for usage-based billing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id),
  site_id UUID NOT NULL REFERENCES sites(id),
  
  -- Usage
  usage_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  
  -- Billing
  billable_quantity INTEGER,
  unit_price DECIMAL(10,6),
  total_amount DECIMAL(10,2),
  billed BOOLEAN DEFAULT false,
  billed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, site_id, usage_date)
);

-- ============================================================================
-- REVENUE ANALYTICS CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id),
  module_id UUID REFERENCES modules(id),
  
  -- Date
  date DATE NOT NULL,
  
  -- Metrics
  sales_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  refund_count INTEGER DEFAULT 0,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  
  -- New vs returning
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- Geography (aggregated)
  by_country JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(developer_id, module_id, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payout_accounts_developer ON developer_payout_accounts(developer_id);
CREATE INDEX IF NOT EXISTS idx_payout_accounts_stripe ON developer_payout_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_sales_developer ON module_sales(developer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_module ON module_sales(module_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status ON module_sales(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON module_sales(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_developer ON developer_payouts(developer_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_period ON developer_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON developer_payouts(status);
CREATE INDEX IF NOT EXISTS idx_analytics_developer ON revenue_analytics_daily(developer_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_module ON revenue_analytics_daily(module_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_module ON module_usage_records(module_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_records_site ON module_usage_records(site_id, usage_date DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate developer earnings
CREATE OR REPLACE FUNCTION calculate_sale_amounts(
  p_gross_amount DECIMAL,
  p_platform_fee_percent DECIMAL DEFAULT 30.00
)
RETURNS TABLE(platform_fee DECIMAL, developer_amount DECIMAL) AS $$
BEGIN
  platform_fee := ROUND(p_gross_amount * (p_platform_fee_percent / 100), 2);
  developer_amount := p_gross_amount - platform_fee;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert revenue analytics
CREATE OR REPLACE FUNCTION upsert_revenue_analytics(
  p_developer_id UUID,
  p_module_id UUID,
  p_date DATE,
  p_sale_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO revenue_analytics_daily (
    developer_id, module_id, date, 
    sales_count, gross_revenue, net_revenue, new_customers
  )
  VALUES (
    p_developer_id, p_module_id, p_date,
    1, p_sale_amount, p_sale_amount, 1
  )
  ON CONFLICT (developer_id, module_id, date)
  DO UPDATE SET
    sales_count = revenue_analytics_daily.sales_count + 1,
    gross_revenue = revenue_analytics_daily.gross_revenue + p_sale_amount,
    net_revenue = revenue_analytics_daily.net_revenue + p_sale_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update refund analytics
CREATE OR REPLACE FUNCTION update_refund_analytics(
  p_developer_id UUID,
  p_module_id UUID,
  p_date DATE,
  p_refund_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO revenue_analytics_daily (
    developer_id, module_id, date, 
    refund_count, refund_amount
  )
  VALUES (
    p_developer_id, p_module_id, p_date,
    1, p_refund_amount
  )
  ON CONFLICT (developer_id, module_id, date)
  DO UPDATE SET
    refund_count = revenue_analytics_daily.refund_count + 1,
    refund_amount = revenue_analytics_daily.refund_amount + p_refund_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement balance
CREATE OR REPLACE FUNCTION decrement_payout_balance(
  p_account_id UUID,
  p_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  UPDATE developer_payout_accounts
  SET 
    pending_balance = pending_balance - p_amount,
    updated_at = NOW()
  WHERE id = p_account_id
  RETURNING pending_balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to increment paid out
CREATE OR REPLACE FUNCTION increment_total_paid_out(
  p_account_id UUID,
  p_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_new_total DECIMAL;
BEGIN
  UPDATE developer_payout_accounts
  SET 
    total_paid_out = total_paid_out + p_amount,
    updated_at = NOW()
  WHERE id = p_account_id
  RETURNING total_paid_out INTO v_new_total;
  
  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update developer balance on sale
CREATE OR REPLACE FUNCTION update_developer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    -- Ensure payout account exists
    INSERT INTO developer_payout_accounts (developer_id)
    VALUES (NEW.developer_id)
    ON CONFLICT (developer_id) DO NOTHING;
    
    -- Update balances
    UPDATE developer_payout_accounts
    SET 
      total_earnings = total_earnings + NEW.developer_amount,
      pending_balance = pending_balance + NEW.developer_amount,
      updated_at = NOW()
    WHERE developer_id = NEW.developer_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'refunded' AND OLD.status = 'completed' THEN
    UPDATE developer_payout_accounts
    SET 
      total_earnings = total_earnings - COALESCE(NEW.refund_amount, 0),
      pending_balance = pending_balance - COALESCE(NEW.refund_amount, 0),
      updated_at = NOW()
    WHERE developer_id = NEW.developer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_developer_balance ON module_sales;
CREATE TRIGGER trg_update_developer_balance
AFTER INSERT OR UPDATE ON module_sales
FOR EACH ROW EXECUTE FUNCTION update_developer_balance();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE developer_payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_revenue_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Payout accounts: Developers can see their own
CREATE POLICY "Developers can view own payout account"
  ON developer_payout_accounts FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM developer_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Developers can update own payout account"
  ON developer_payout_accounts FOR UPDATE
  USING (
    developer_id IN (
      SELECT id FROM developer_profiles WHERE user_id = auth.uid()
    )
  );

-- Revenue config: Module owners can manage
CREATE POLICY "Module owners can view revenue config"
  ON module_revenue_config FOR SELECT
  USING (
    module_id IN (
      SELECT id FROM modules WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Module owners can manage revenue config"
  ON module_revenue_config FOR ALL
  USING (
    module_id IN (
      SELECT id FROM modules WHERE created_by = auth.uid()
    )
  );

-- Sales: Developers see their own sales
CREATE POLICY "Developers can view own sales"
  ON module_sales FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM developer_profiles WHERE user_id = auth.uid()
    )
    OR buyer_id = auth.uid()
  );

-- Payouts: Developers see their own
CREATE POLICY "Developers can view own payouts"
  ON developer_payouts FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM developer_profiles WHERE user_id = auth.uid()
    )
  );

-- Line items: Developers see their own
CREATE POLICY "Developers can view own payout line items"
  ON payout_line_items FOR SELECT
  USING (
    payout_id IN (
      SELECT id FROM developer_payouts 
      WHERE developer_id IN (
        SELECT id FROM developer_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Usage records: Site owners and module developers
CREATE POLICY "Usage records viewable by site owners and developers"
  ON module_usage_records FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR module_id IN (
      SELECT id FROM modules WHERE created_by = auth.uid()
    )
  );

-- Analytics: Developers see their own
CREATE POLICY "Developers can view own analytics"
  ON revenue_analytics_daily FOR SELECT
  USING (
    developer_id IN (
      SELECT id FROM developer_profiles WHERE user_id = auth.uid()
    )
  );

-- Service role bypass for all tables
CREATE POLICY "Service role full access payout_accounts"
  ON developer_payout_accounts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access revenue_config"
  ON module_revenue_config FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access sales"
  ON module_sales FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access payouts"
  ON developer_payouts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access line_items"
  ON payout_line_items FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access usage_records"
  ON module_usage_records FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access analytics"
  ON revenue_analytics_daily FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

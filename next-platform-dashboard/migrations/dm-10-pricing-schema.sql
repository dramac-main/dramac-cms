-- ============================================================================
-- Phase DM-10: White-Label & Pricing Configuration Schema
-- ============================================================================
-- Description: Tables for agency domain pricing, billing records, and usage tracking
-- Created: February 2, 2026
-- ============================================================================

-- Agency domain pricing configuration
CREATE TABLE IF NOT EXISTS agency_domain_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Default markup settings
  default_markup_type TEXT NOT NULL DEFAULT 'percentage' CHECK (default_markup_type IN ('percentage', 'fixed', 'custom')),
  default_markup_value DECIMAL(10, 2) NOT NULL DEFAULT 30.00,
  
  -- TLD-specific pricing overrides
  tld_pricing JSONB DEFAULT '{}',
  
  -- Client tier pricing
  client_tiers JSONB DEFAULT '[]',
  
  -- Billing settings
  paddle_product_id TEXT,
  paddle_price_id TEXT,
  billing_enabled BOOLEAN DEFAULT false,
  
  -- White-label settings
  show_wholesale_prices BOOLEAN DEFAULT false,
  custom_terms_url TEXT,
  custom_support_email TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agency_id)
);

-- Domain billing records
CREATE TABLE IF NOT EXISTS domain_billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- Billing details
  billing_type TEXT NOT NULL CHECK (billing_type IN ('registration', 'renewal', 'transfer', 'email', 'addon')),
  description TEXT NOT NULL,
  
  -- Pricing
  wholesale_amount DECIMAL(10, 2) NOT NULL,
  retail_amount DECIMAL(10, 2) NOT NULL,
  markup_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Paddle integration
  paddle_transaction_id TEXT,
  paddle_subscription_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly usage summary for billing
CREATE TABLE IF NOT EXISTS domain_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Period
  year INT NOT NULL,
  month INT NOT NULL,
  
  -- Usage counts
  domains_registered INT DEFAULT 0,
  domains_renewed INT DEFAULT 0,
  domains_transferred INT DEFAULT 0,
  email_accounts_created INT DEFAULT 0,
  
  -- Revenue
  wholesale_total DECIMAL(10, 2) DEFAULT 0,
  retail_total DECIMAL(10, 2) DEFAULT 0,
  profit_total DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agency_id, year, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agency_domain_pricing_agency ON agency_domain_pricing(agency_id);
CREATE INDEX IF NOT EXISTS idx_domain_billing_agency ON domain_billing_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_domain_billing_status ON domain_billing_records(status);
CREATE INDEX IF NOT EXISTS idx_domain_billing_type ON domain_billing_records(billing_type);
CREATE INDEX IF NOT EXISTS idx_domain_billing_created ON domain_billing_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_usage_period ON domain_usage_summary(agency_id, year, month);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE agency_domain_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_usage_summary ENABLE ROW LEVEL SECURITY;

-- Agency domain pricing policies
CREATE POLICY "Agency members can view pricing config" ON agency_domain_pricing
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency admins can manage pricing config" ON agency_domain_pricing
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Domain billing records policies
CREATE POLICY "Agency members can view billing records" ON domain_billing_records
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency admins can manage billing records" ON domain_billing_records
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Domain usage summary policies
CREATE POLICY "Agency members can view usage summary" ON domain_usage_summary
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agency_domain_pricing_updated_at
  BEFORE UPDATE ON agency_domain_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_billing_records_updated_at
  BEFORE UPDATE ON domain_billing_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_usage_summary_updated_at
  BEFORE UPDATE ON domain_usage_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function to update usage summary when billing record is created
-- ============================================================================

CREATE OR REPLACE FUNCTION update_domain_usage_on_billing()
RETURNS TRIGGER AS $$
DECLARE
  v_year INT;
  v_month INT;
BEGIN
  v_year := EXTRACT(YEAR FROM NEW.created_at);
  v_month := EXTRACT(MONTH FROM NEW.created_at);
  
  -- Insert or update usage summary
  INSERT INTO domain_usage_summary (agency_id, year, month, 
    domains_registered, domains_renewed, domains_transferred, 
    wholesale_total, retail_total, profit_total)
  VALUES (
    NEW.agency_id, 
    v_year, 
    v_month,
    CASE WHEN NEW.billing_type = 'registration' THEN 1 ELSE 0 END,
    CASE WHEN NEW.billing_type = 'renewal' THEN 1 ELSE 0 END,
    CASE WHEN NEW.billing_type = 'transfer' THEN 1 ELSE 0 END,
    NEW.wholesale_amount,
    NEW.retail_amount,
    NEW.markup_amount
  )
  ON CONFLICT (agency_id, year, month)
  DO UPDATE SET
    domains_registered = domain_usage_summary.domains_registered + 
      CASE WHEN NEW.billing_type = 'registration' THEN 1 ELSE 0 END,
    domains_renewed = domain_usage_summary.domains_renewed + 
      CASE WHEN NEW.billing_type = 'renewal' THEN 1 ELSE 0 END,
    domains_transferred = domain_usage_summary.domains_transferred + 
      CASE WHEN NEW.billing_type = 'transfer' THEN 1 ELSE 0 END,
    wholesale_total = domain_usage_summary.wholesale_total + NEW.wholesale_amount,
    retail_total = domain_usage_summary.retail_total + NEW.retail_amount,
    profit_total = domain_usage_summary.profit_total + NEW.markup_amount,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_domain_usage
  AFTER INSERT ON domain_billing_records
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION update_domain_usage_on_billing();

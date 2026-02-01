-- migrations/dm-07-email-schema.sql
-- Business Email (Titan) Database Schema via ResellerClub
-- Phase DM-07: Business Email Integration

-- ============================================================================
-- ADD RESELLERCLUB CUSTOMER ID TO AGENCIES TABLE
-- ============================================================================

ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS resellerclub_customer_id TEXT;

-- ============================================================================
-- EMAIL ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- ResellerClub Integration
  resellerclub_order_id TEXT NOT NULL UNIQUE,
  resellerclub_customer_id TEXT NOT NULL,
  
  -- Order Details
  domain_name TEXT NOT NULL,
  product_key TEXT NOT NULL DEFAULT 'eeliteus',
  number_of_accounts INTEGER NOT NULL DEFAULT 1,
  used_accounts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ NOT NULL,
  
  -- Pricing
  wholesale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  retail_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_orders_agency ON email_orders(agency_id);
CREATE INDEX IF NOT EXISTS idx_email_orders_domain ON email_orders(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_orders_status ON email_orders(status);
CREATE INDEX IF NOT EXISTS idx_email_orders_expiry ON email_orders(expiry_date);
CREATE INDEX IF NOT EXISTS idx_email_orders_rc_order ON email_orders(resellerclub_order_id);
CREATE INDEX IF NOT EXISTS idx_email_orders_domain_name ON email_orders(domain_name);

-- ============================================================================
-- EMAIL ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_order_id UUID NOT NULL REFERENCES email_orders(id) ON DELETE CASCADE,
  
  -- Account Details
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  
  -- Usage Stats
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 10737418240, -- 10GB default
  last_login TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique email per order
  UNIQUE(email_order_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_accounts_order ON email_accounts(email_order_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_status ON email_accounts(status);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);

-- ============================================================================
-- ADD EMAIL DNS FLAG TO DOMAINS TABLE
-- ============================================================================

ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS email_dns_configured BOOLEAN DEFAULT false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE email_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Email Orders RLS Policies
DROP POLICY IF EXISTS "Users can view email orders for their agency" ON email_orders;
CREATE POLICY "Users can view email orders for their agency"
  ON email_orders FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create email orders for their agency" ON email_orders;
CREATE POLICY "Users can create email orders for their agency"
  ON email_orders FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update email orders for their agency" ON email_orders;
CREATE POLICY "Users can update email orders for their agency"
  ON email_orders FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Email Accounts RLS Policies
DROP POLICY IF EXISTS "Users can view email accounts for their orders" ON email_accounts;
CREATE POLICY "Users can view email accounts for their orders"
  ON email_accounts FOR SELECT
  USING (
    email_order_id IN (
      SELECT id FROM email_orders WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create email accounts for their orders" ON email_accounts;
CREATE POLICY "Users can create email accounts for their orders"
  ON email_accounts FOR INSERT
  WITH CHECK (
    email_order_id IN (
      SELECT id FROM email_orders WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update email accounts for their orders" ON email_accounts;
CREATE POLICY "Users can update email accounts for their orders"
  ON email_accounts FOR UPDATE
  USING (
    email_order_id IN (
      SELECT id FROM email_orders WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete email accounts for their orders" ON email_accounts;
CREATE POLICY "Users can delete email accounts for their orders"
  ON email_accounts FOR DELETE
  USING (
    email_order_id IN (
      SELECT id FROM email_orders WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Email orders trigger
DROP TRIGGER IF EXISTS trigger_email_orders_updated_at ON email_orders;
CREATE TRIGGER trigger_email_orders_updated_at
  BEFORE UPDATE ON email_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

-- Email accounts trigger
DROP TRIGGER IF EXISTS trigger_email_accounts_updated_at ON email_accounts;
CREATE TRIGGER trigger_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

-- ============================================================================
-- SERVICE ROLE BYPASS POLICIES (for admin operations)
-- ============================================================================

-- Allow service role to bypass RLS for admin operations
DROP POLICY IF EXISTS "Service role can manage all email orders" ON email_orders;
CREATE POLICY "Service role can manage all email orders"
  ON email_orders
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all email accounts" ON email_accounts;
CREATE POLICY "Service role can manage all email accounts"
  ON email_accounts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- migrations/dm-02-domain-schema.sql
-- Phase DM-02: Domain Database Schema
-- Domain & Email Reseller Module

-- ============================================================================
-- DOMAIN REGISTRY
-- ============================================================================

-- Main domains table
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  
  -- Domain Information
  domain_name TEXT NOT NULL,
  tld TEXT NOT NULL,
  sld TEXT NOT NULL, -- Second-level domain (part before TLD)
  
  -- ResellerClub Integration
  resellerclub_order_id TEXT,
  resellerclub_customer_id TEXT,
  
  -- Registration Details
  registration_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  last_renewed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting registration
    'active',       -- Registered and active
    'expired',      -- Domain has expired
    'suspended',    -- Suspended by registrar
    'transferred',  -- Transferred to another registrar
    'cancelled',    -- Cancelled/deleted
    'redemption'    -- In redemption grace period
  )),
  
  -- DNS Configuration
  cloudflare_zone_id TEXT,
  nameservers TEXT[] DEFAULT ARRAY[]::TEXT[],
  dns_configured BOOLEAN DEFAULT false,
  dns_verified_at TIMESTAMPTZ,
  
  -- Settings
  auto_renew BOOLEAN DEFAULT true,
  whois_privacy BOOLEAN DEFAULT true,
  transfer_lock BOOLEAN DEFAULT true,
  
  -- Contact IDs (ResellerClub)
  registrant_contact_id TEXT,
  admin_contact_id TEXT,
  tech_contact_id TEXT,
  billing_contact_id TEXT,
  
  -- Pricing
  wholesale_price DECIMAL(10, 2),
  retail_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT domains_domain_name_unique UNIQUE (domain_name),
  CONSTRAINT domains_valid_tld CHECK (tld ~ '^\.[a-z]{2,}$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_domains_agency_id ON domains(agency_id);
CREATE INDEX IF NOT EXISTS idx_domains_client_id ON domains(client_id);
CREATE INDEX IF NOT EXISTS idx_domains_site_id ON domains(site_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_expiry ON domains(expiry_date);
CREATE INDEX IF NOT EXISTS idx_domains_tld ON domains(tld);
CREATE INDEX IF NOT EXISTS idx_domains_search ON domains USING gin(to_tsvector('english', domain_name));

-- ============================================================================
-- DNS RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Record Details
  record_type TEXT NOT NULL CHECK (record_type IN (
    'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR'
  )),
  name TEXT NOT NULL,           -- '@' for root, 'www', 'mail', etc.
  content TEXT NOT NULL,        -- IP address, hostname, or value
  
  -- Optional Fields
  ttl INTEGER DEFAULT 3600,     -- Time to live in seconds
  priority INTEGER,             -- For MX records
  proxied BOOLEAN DEFAULT false, -- Cloudflare proxy
  
  -- Cloudflare Integration
  cloudflare_record_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Not yet created in DNS
    'active',     -- Active in DNS
    'error',      -- Failed to create/update
    'deleting'    -- Being deleted
  )),
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_by TEXT, -- 'system' | 'user' | 'import'
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint for DNS records
  CONSTRAINT domain_dns_records_unique UNIQUE (domain_id, record_type, name, content)
);

CREATE INDEX IF NOT EXISTS idx_dns_records_domain_id ON domain_dns_records(domain_id);
CREATE INDEX IF NOT EXISTS idx_dns_records_type ON domain_dns_records(record_type);

-- ============================================================================
-- EMAIL ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Email Address
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- Account Type
  account_type TEXT DEFAULT 'mailbox' CHECK (account_type IN (
    'mailbox',     -- Full email account
    'alias',       -- Alias to another address
    'forwarder',   -- Forward to external address
    'group'        -- Distribution group
  )),
  
  -- For aliases/forwarders
  forward_to TEXT[], -- Array of destination addresses
  
  -- ResellerClub Business Email Integration
  -- NOTE: Business Email (Titan) is managed through ResellerClub API (/api/eelite/)
  resellerclub_email_account_id TEXT,
  resellerclub_email_order_id TEXT,
  resellerclub_email_subscription_id TEXT,
  
  -- Mailbox Settings
  mailbox_size_gb INTEGER DEFAULT 10,
  storage_used_mb INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Awaiting provisioning
    'active',      -- Active and working
    'suspended',   -- Suspended
    'cancelled'    -- Deleted
  )),
  
  -- Billing
  monthly_price DECIMAL(10, 2),
  next_billing_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT email_accounts_address_unique UNIQUE (email_address)
);

CREATE INDEX IF NOT EXISTS idx_email_accounts_domain_id ON domain_email_accounts(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_agency_id ON domain_email_accounts(agency_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_status ON domain_email_accounts(status);

-- ============================================================================
-- DOMAIN ORDERS (Purchase History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- Order Type
  order_type TEXT NOT NULL CHECK (order_type IN (
    'registration',  -- New domain registration
    'renewal',       -- Domain renewal
    'transfer',      -- Domain transfer in
    'privacy',       -- Privacy protection
    'email'          -- Email subscription
  )),
  
  -- Item Details
  domain_name TEXT NOT NULL,
  years INTEGER,
  
  -- Pricing
  wholesale_price DECIMAL(10, 2) NOT NULL,
  retail_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'paid',
    'failed',
    'refunded'
  )),
  payment_method TEXT,
  paddle_transaction_id TEXT,
  
  -- ResellerClub
  resellerclub_order_id TEXT,
  resellerclub_invoice_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  )),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_domain_orders_agency_id ON domain_orders(agency_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_domain_id ON domain_orders(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_status ON domain_orders(status);
CREATE INDEX IF NOT EXISTS idx_domain_orders_created ON domain_orders(created_at);

-- ============================================================================
-- DOMAIN TRANSFERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- Transfer Direction
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  
  -- Domain Info
  domain_name TEXT NOT NULL,
  
  -- Transfer Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Transfer initiated
    'auth_required', -- Waiting for auth code
    'processing',    -- Transfer in progress
    'approved',      -- Approved by losing registrar
    'rejected',      -- Rejected
    'completed',     -- Successfully transferred
    'cancelled',     -- Cancelled by user
    'failed'         -- Failed
  )),
  
  -- Auth Code (encrypted in practice)
  auth_code_hash TEXT,
  
  -- ResellerClub
  resellerclub_transfer_id TEXT,
  
  -- Pricing (for transfers in)
  wholesale_price DECIMAL(10, 2),
  retail_price DECIMAL(10, 2),
  
  -- Dates
  initiated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Transfer request expiration
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_transfers_agency_id ON domain_transfers(agency_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON domain_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_domain ON domain_transfers(domain_name);

-- ============================================================================
-- PRICING CONFIGURATION (Agency-level)
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- TLD (null means default for all TLDs)
  tld TEXT, -- '.com', '.net', etc.
  
  -- Markup Configuration
  markup_type TEXT NOT NULL DEFAULT 'percentage' CHECK (markup_type IN (
    'percentage',  -- Add X% to wholesale
    'fixed',       -- Add $X to wholesale
    'custom'       -- Set exact price
  )),
  markup_value DECIMAL(10, 2) NOT NULL DEFAULT 30, -- 30% or $30
  
  -- Minimum/Maximum (for percentage)
  min_markup DECIMAL(10, 2),
  max_markup DECIMAL(10, 2),
  
  -- Email Pricing
  email_markup_type TEXT DEFAULT 'percentage',
  email_markup_value DECIMAL(10, 2) DEFAULT 50,
  
  -- Settings
  enabled BOOLEAN DEFAULT true,
  show_wholesale_to_clients BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One config per TLD per agency
  CONSTRAINT domain_pricing_unique UNIQUE (agency_id, tld)
);

CREATE INDEX IF NOT EXISTS idx_domain_pricing_agency_id ON domain_pricing(agency_id);

-- ============================================================================
-- CLOUDFLARE ZONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS cloudflare_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- Cloudflare Details
  zone_id TEXT NOT NULL UNIQUE,
  account_id TEXT,
  
  -- Zone Info
  name TEXT NOT NULL, -- Domain name
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'active',
    'moved',
    'deleted',
    'deactivated'
  )),
  
  -- Nameservers assigned by Cloudflare
  assigned_nameservers TEXT[] DEFAULT ARRAY[]::TEXT[],
  original_nameservers TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Settings
  plan TEXT DEFAULT 'free',
  ssl_mode TEXT DEFAULT 'flexible' CHECK (ssl_mode IN (
    'off', 'flexible', 'full', 'strict'
  )),
  always_https BOOLEAN DEFAULT true,
  min_tls_version TEXT DEFAULT '1.2',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_cloudflare_zones_domain_id ON cloudflare_zones(domain_id);
CREATE INDEX IF NOT EXISTS idx_cloudflare_zones_zone_id ON cloudflare_zones(zone_id);

-- ============================================================================
-- EMAIL SUBSCRIPTIONS (ResellerClub Business Email / Titan-powered)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  -- ResellerClub Business Email Integration
  -- NOTE: Business Email is powered by Titan but managed via ResellerClub API
  resellerclub_email_subscription_id TEXT,
  resellerclub_email_order_id TEXT,
  
  -- Plan Details
  plan_type TEXT DEFAULT 'business' CHECK (plan_type IN (
    'starter',   -- Basic email
    'business',  -- Business features
    'enterprise' -- Advanced features
  )),
  
  -- Mailbox Allocation
  max_mailboxes INTEGER DEFAULT 5,
  current_mailboxes INTEGER DEFAULT 0,
  
  -- Billing
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  price_per_mailbox DECIMAL(10, 2),
  next_billing_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',
    'past_due',
    'suspended',
    'cancelled'
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_subscriptions_agency_id ON email_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_domain_id ON email_subscriptions(domain_id);

-- ============================================================================
-- DOMAIN CONTACTS (Cached from ResellerClub)
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- ResellerClub Reference
  resellerclub_contact_id TEXT NOT NULL,
  resellerclub_customer_id TEXT,
  
  -- Contact Type
  contact_type TEXT DEFAULT 'Contact' CHECK (contact_type IN (
    'Contact', 'CoopContact', 'UkContact', 'EuContact', 'CnContact'
  )),
  
  -- Contact Details
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  address_line_3 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL, -- 2-letter code
  zipcode TEXT NOT NULL,
  phone_country_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax_country_code TEXT,
  fax TEXT,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT domain_contacts_resellerclub_unique UNIQUE (agency_id, resellerclub_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_domain_contacts_agency_id ON domain_contacts(agency_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloudflare_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_contacts ENABLE ROW LEVEL SECURITY;

-- Domains RLS
DROP POLICY IF EXISTS "domains_agency_access" ON domains;
CREATE POLICY "domains_agency_access" ON domains
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- DNS Records RLS (through domain)
DROP POLICY IF EXISTS "dns_records_agency_access" ON domain_dns_records;
CREATE POLICY "dns_records_agency_access" ON domain_dns_records
  FOR ALL USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Email Accounts RLS
DROP POLICY IF EXISTS "email_accounts_agency_access" ON domain_email_accounts;
CREATE POLICY "email_accounts_agency_access" ON domain_email_accounts
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Orders RLS
DROP POLICY IF EXISTS "domain_orders_agency_access" ON domain_orders;
CREATE POLICY "domain_orders_agency_access" ON domain_orders
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Transfers RLS
DROP POLICY IF EXISTS "domain_transfers_agency_access" ON domain_transfers;
CREATE POLICY "domain_transfers_agency_access" ON domain_transfers
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Pricing RLS
DROP POLICY IF EXISTS "domain_pricing_agency_access" ON domain_pricing;
CREATE POLICY "domain_pricing_agency_access" ON domain_pricing
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Cloudflare Zones RLS (through domain)
DROP POLICY IF EXISTS "cloudflare_zones_agency_access" ON cloudflare_zones;
CREATE POLICY "cloudflare_zones_agency_access" ON cloudflare_zones
  FOR ALL USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Email Subscriptions RLS
DROP POLICY IF EXISTS "email_subscriptions_agency_access" ON email_subscriptions;
CREATE POLICY "email_subscriptions_agency_access" ON email_subscriptions
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Contacts RLS
DROP POLICY IF EXISTS "domain_contacts_agency_access" ON domain_contacts;
CREATE POLICY "domain_contacts_agency_access" ON domain_contacts
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_domain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers (drop existing first to avoid duplicates)
DROP TRIGGER IF EXISTS domains_updated_at ON domains;
CREATE TRIGGER domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

DROP TRIGGER IF EXISTS domain_dns_records_updated_at ON domain_dns_records;
CREATE TRIGGER domain_dns_records_updated_at
  BEFORE UPDATE ON domain_dns_records
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

DROP TRIGGER IF EXISTS domain_email_accounts_updated_at ON domain_email_accounts;
CREATE TRIGGER domain_email_accounts_updated_at
  BEFORE UPDATE ON domain_email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

DROP TRIGGER IF EXISTS domain_pricing_updated_at ON domain_pricing;
CREATE TRIGGER domain_pricing_updated_at
  BEFORE UPDATE ON domain_pricing
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

DROP TRIGGER IF EXISTS email_subscriptions_updated_at ON email_subscriptions;
CREATE TRIGGER email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

DROP TRIGGER IF EXISTS domain_contacts_updated_at ON domain_contacts;
CREATE TRIGGER domain_contacts_updated_at
  BEFORE UPDATE ON domain_contacts
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get domains expiring soon
CREATE OR REPLACE FUNCTION get_expiring_domains(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  domain_id UUID,
  domain_name TEXT,
  agency_id UUID,
  expiry_date TIMESTAMPTZ,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.domain_name,
    d.agency_id,
    d.expiry_date,
    EXTRACT(DAY FROM d.expiry_date - now())::INTEGER as days_until
  FROM domains d
  WHERE d.status = 'active'
    AND d.expiry_date <= now() + (days_ahead || ' days')::INTERVAL
    AND d.expiry_date > now()
  ORDER BY d.expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate retail price based on pricing config
CREATE OR REPLACE FUNCTION calculate_domain_retail_price(
  p_agency_id UUID,
  p_tld TEXT,
  p_wholesale_price DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_config domain_pricing%ROWTYPE;
  v_markup DECIMAL;
BEGIN
  -- Get TLD-specific config or default
  SELECT * INTO v_config
  FROM domain_pricing
  WHERE agency_id = p_agency_id
    AND (tld = p_tld OR tld IS NULL)
  ORDER BY tld NULLS LAST
  LIMIT 1;
  
  -- If no config, use 30% default
  IF v_config IS NULL THEN
    RETURN p_wholesale_price * 1.3;
  END IF;
  
  -- Calculate based on markup type
  CASE v_config.markup_type
    WHEN 'percentage' THEN
      v_markup := p_wholesale_price * (v_config.markup_value / 100);
    WHEN 'fixed' THEN
      v_markup := v_config.markup_value;
    WHEN 'custom' THEN
      RETURN v_config.markup_value; -- Return custom price directly
    ELSE
      v_markup := p_wholesale_price * 0.3;
  END CASE;
  
  -- Apply min/max if set
  IF v_config.min_markup IS NOT NULL AND v_markup < v_config.min_markup THEN
    v_markup := v_config.min_markup;
  END IF;
  IF v_config.max_markup IS NOT NULL AND v_markup > v_config.max_markup THEN
    v_markup := v_config.max_markup;
  END IF;
  
  RETURN p_wholesale_price + v_markup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get domain stats for an agency
CREATE OR REPLACE FUNCTION get_domain_stats(p_agency_id UUID)
RETURNS TABLE (
  total_domains BIGINT,
  active_domains BIGINT,
  expiring_soon BIGINT,
  expired_domains BIGINT,
  total_email_accounts BIGINT,
  domains_with_email BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM domains WHERE agency_id = p_agency_id)::BIGINT as total_domains,
    (SELECT COUNT(*) FROM domains WHERE agency_id = p_agency_id AND status = 'active')::BIGINT as active_domains,
    (SELECT COUNT(*) FROM domains WHERE agency_id = p_agency_id AND status = 'active' 
      AND expiry_date <= now() + '30 days'::INTERVAL AND expiry_date > now())::BIGINT as expiring_soon,
    (SELECT COUNT(*) FROM domains WHERE agency_id = p_agency_id AND status = 'expired')::BIGINT as expired_domains,
    (SELECT COUNT(*) FROM domain_email_accounts WHERE agency_id = p_agency_id AND status = 'active')::BIGINT as total_email_accounts,
    (SELECT COUNT(DISTINCT domain_id) FROM domain_email_accounts WHERE agency_id = p_agency_id AND status = 'active')::BIGINT as domains_with_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE domains IS 'Main domain registry - stores all domains managed by agencies';
COMMENT ON TABLE domain_dns_records IS 'DNS records for domains - synced with Cloudflare';
COMMENT ON TABLE domain_email_accounts IS 'Email accounts/mailboxes linked to domains via ResellerClub Business Email';
COMMENT ON TABLE domain_orders IS 'Purchase history for domain operations (registration, renewal, transfer, etc.)';
COMMENT ON TABLE domain_transfers IS 'Domain transfer tracking - both incoming and outgoing';
COMMENT ON TABLE domain_pricing IS 'Agency-level pricing configuration with markup rules per TLD';
COMMENT ON TABLE cloudflare_zones IS 'Cloudflare zone information synced with Cloudflare API';
COMMENT ON TABLE email_subscriptions IS 'Email subscription plans per domain via ResellerClub Business Email';
COMMENT ON TABLE domain_contacts IS 'Cached WHOIS contact information from ResellerClub';

COMMENT ON FUNCTION get_expiring_domains(INTEGER) IS 'Get domains expiring within specified days';
COMMENT ON FUNCTION calculate_domain_retail_price(UUID, TEXT, DECIMAL) IS 'Calculate retail price based on agency markup config';
COMMENT ON FUNCTION get_domain_stats(UUID) IS 'Get domain statistics for an agency dashboard';

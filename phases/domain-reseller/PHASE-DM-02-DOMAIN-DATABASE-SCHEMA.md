# Phase DM-02: Domain Database Schema

> **Priority**: 🔴 HIGH
> **Estimated Time**: 4 hours
> **Prerequisites**: DM-01 (ResellerClub Integration)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create comprehensive database schema for domain management:
1. Domain registry with full metadata
2. DNS records tracking
3. Email accounts linked to domains
4. Order history and invoicing
5. Pricing configuration for agencies
6. Domain transfers tracking
7. Cloudflare zone management
8. RLS policies for multi-tenant security

---

## 📁 Files to Create

```
migrations/
└── dm-02-domain-schema.sql        # Database migration

src/types/
└── domain.ts                      # TypeScript type definitions
```

---

## 📋 Implementation Tasks

### Task 1: Core Domain Tables (60 mins)

```sql
-- migrations/dm-02-domain-schema.sql

-- ============================================================================
-- DOMAIN REGISTRY
-- ============================================================================

-- Main domains table
CREATE TABLE domains (
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
  /*
  metadata: {
    "purchased_from": "resellerclub" | "transfer",
    "original_registrar": "...",
    "verification_status": "...",
    "ssl_status": "...",
  }
  */
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT domains_domain_name_unique UNIQUE (domain_name),
  CONSTRAINT domains_valid_tld CHECK (tld ~ '^\.[a-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_domains_agency_id ON domains(agency_id);
CREATE INDEX idx_domains_client_id ON domains(client_id);
CREATE INDEX idx_domains_site_id ON domains(site_id);
CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_domains_expiry ON domains(expiry_date);
CREATE INDEX idx_domains_tld ON domains(tld);
CREATE INDEX idx_domains_search ON domains USING gin(to_tsvector('english', domain_name));

-- ============================================================================
-- DNS RECORDS
-- ============================================================================

CREATE TABLE domain_dns_records (
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

CREATE INDEX idx_dns_records_domain_id ON domain_dns_records(domain_id);
CREATE INDEX idx_dns_records_type ON domain_dns_records(record_type);

-- ============================================================================
-- EMAIL ACCOUNTS
-- ============================================================================

CREATE TABLE domain_email_accounts (
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
  -- There is NO separate Titan API - all operations go through ResellerClub
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

CREATE INDEX idx_email_accounts_domain_id ON domain_email_accounts(domain_id);
CREATE INDEX idx_email_accounts_agency_id ON domain_email_accounts(agency_id);
CREATE INDEX idx_email_accounts_status ON domain_email_accounts(status);

-- ============================================================================
-- DOMAIN ORDERS (Purchase History)
-- ============================================================================

CREATE TABLE domain_orders (
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

CREATE INDEX idx_domain_orders_agency_id ON domain_orders(agency_id);
CREATE INDEX idx_domain_orders_domain_id ON domain_orders(domain_id);
CREATE INDEX idx_domain_orders_status ON domain_orders(status);
CREATE INDEX idx_domain_orders_created ON domain_orders(created_at);

-- ============================================================================
-- DOMAIN TRANSFERS
-- ============================================================================

CREATE TABLE domain_transfers (
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

CREATE INDEX idx_transfers_agency_id ON domain_transfers(agency_id);
CREATE INDEX idx_transfers_status ON domain_transfers(status);
CREATE INDEX idx_transfers_domain ON domain_transfers(domain_name);

-- ============================================================================
-- PRICING CONFIGURATION (Agency-level)
-- ============================================================================

CREATE TABLE domain_pricing (
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

CREATE INDEX idx_domain_pricing_agency_id ON domain_pricing(agency_id);

-- ============================================================================
-- CLOUDFLARE ZONES
-- ============================================================================

CREATE TABLE cloudflare_zones (
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

CREATE INDEX idx_cloudflare_zones_domain_id ON cloudflare_zones(domain_id);
CREATE INDEX idx_cloudflare_zones_zone_id ON cloudflare_zones(zone_id);

-- ============================================================================
-- EMAIL SUBSCRIPTIONS (ResellerClub Business Email / Titan-powered)
-- ============================================================================

CREATE TABLE email_subscriptions (
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

CREATE INDEX idx_email_subscriptions_agency_id ON email_subscriptions(agency_id);
CREATE INDEX idx_email_subscriptions_domain_id ON email_subscriptions(domain_id);

-- ============================================================================
-- DOMAIN CONTACTS (Cached from ResellerClub)
-- ============================================================================

CREATE TABLE domain_contacts (
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

CREATE INDEX idx_domain_contacts_agency_id ON domain_contacts(agency_id);

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
CREATE POLICY "domains_agency_access" ON domains
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- DNS Records RLS (through domain)
CREATE POLICY "dns_records_agency_access" ON domain_dns_records
  FOR ALL USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Email Accounts RLS
CREATE POLICY "email_accounts_agency_access" ON domain_email_accounts
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Orders RLS
CREATE POLICY "domain_orders_agency_access" ON domain_orders
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Transfers RLS
CREATE POLICY "domain_transfers_agency_access" ON domain_transfers
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Pricing RLS
CREATE POLICY "domain_pricing_agency_access" ON domain_pricing
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Cloudflare Zones RLS (through domain)
CREATE POLICY "cloudflare_zones_agency_access" ON cloudflare_zones
  FOR ALL USING (
    domain_id IN (
      SELECT id FROM domains WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Email Subscriptions RLS
CREATE POLICY "email_subscriptions_agency_access" ON email_subscriptions
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

-- Domain Contacts RLS
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

-- Apply triggers
CREATE TRIGGER domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

CREATE TRIGGER domain_dns_records_updated_at
  BEFORE UPDATE ON domain_dns_records
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

CREATE TRIGGER domain_email_accounts_updated_at
  BEFORE UPDATE ON domain_email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

CREATE TRIGGER domain_pricing_updated_at
  BEFORE UPDATE ON domain_pricing
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

CREATE TRIGGER email_subscriptions_updated_at
  BEFORE UPDATE ON email_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_domain_updated_at();

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
  v_retail_price DECIMAL;
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
```

### Task 2: TypeScript Type Definitions (45 mins)

```typescript
// src/types/domain.ts

import type { Database } from './database';

// ============================================================================
// Base Types from Database
// ============================================================================

export type Domain = Database['public']['Tables']['domains']['Row'];
export type DomainInsert = Database['public']['Tables']['domains']['Insert'];
export type DomainUpdate = Database['public']['Tables']['domains']['Update'];

export type DomainDnsRecord = Database['public']['Tables']['domain_dns_records']['Row'];
export type DomainDnsRecordInsert = Database['public']['Tables']['domain_dns_records']['Insert'];

export type DomainEmailAccount = Database['public']['Tables']['domain_email_accounts']['Row'];
export type DomainEmailAccountInsert = Database['public']['Tables']['domain_email_accounts']['Insert'];

export type DomainOrder = Database['public']['Tables']['domain_orders']['Row'];
export type DomainOrderInsert = Database['public']['Tables']['domain_orders']['Insert'];

export type DomainTransfer = Database['public']['Tables']['domain_transfers']['Row'];
export type DomainTransferInsert = Database['public']['Tables']['domain_transfers']['Insert'];

export type DomainPricing = Database['public']['Tables']['domain_pricing']['Row'];
export type DomainPricingInsert = Database['public']['Tables']['domain_pricing']['Insert'];

export type CloudflareZone = Database['public']['Tables']['cloudflare_zones']['Row'];
export type EmailSubscription = Database['public']['Tables']['email_subscriptions']['Row'];
export type DomainContact = Database['public']['Tables']['domain_contacts']['Row'];

// ============================================================================
// Enums
// ============================================================================

export type DomainStatus = 
  | 'pending'
  | 'active'
  | 'expired'
  | 'suspended'
  | 'transferred'
  | 'cancelled'
  | 'redemption';

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA' | 'PTR';

export type DnsRecordStatus = 'pending' | 'active' | 'error' | 'deleting';

export type EmailAccountType = 'mailbox' | 'alias' | 'forwarder' | 'group';

export type EmailAccountStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

export type DomainOrderType = 'registration' | 'renewal' | 'transfer' | 'privacy' | 'email';

export type DomainOrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type TransferDirection = 'in' | 'out';

export type TransferStatus = 
  | 'pending'
  | 'auth_required'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type MarkupType = 'percentage' | 'fixed' | 'custom';

export type CloudflareZoneStatus = 'pending' | 'active' | 'moved' | 'deleted' | 'deactivated';

export type SslMode = 'off' | 'flexible' | 'full' | 'strict';

export type EmailPlanType = 'starter' | 'business' | 'enterprise';

export type BillingCycle = 'monthly' | 'yearly';

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface DomainWithDetails extends Domain {
  client?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  site?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  dns_records?: DomainDnsRecord[];
  cloudflare_zone?: CloudflareZone | null;
  email_accounts_count?: number;
}

export interface DomainWithDns extends Domain {
  dns_records: DomainDnsRecord[];
}

export interface DomainWithEmail extends Domain {
  email_accounts: DomainEmailAccount[];
  email_subscription?: EmailSubscription | null;
}

export interface DomainOrderWithDomain extends DomainOrder {
  domain?: Domain | null;
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface DomainFilters {
  search?: string;
  status?: DomainStatus | 'all';
  tld?: string;
  clientId?: string;
  expiringWithinDays?: number;
  hasEmail?: boolean;
  hasCloudflare?: boolean;
  sortBy?: 'domain_name' | 'created_at' | 'expiry_date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DomainSearchResult {
  domain: string;
  tld: string;
  available: boolean;
  premium: boolean;
  prices: {
    register: Record<number, number>;
    renew: Record<number, number>;
    transfer: number;
  };
  retailPrices: {
    register: Record<number, number>;
    renew: Record<number, number>;
    transfer: number;
  };
}

// ============================================================================
// Action Types
// ============================================================================

export interface RegisterDomainParams {
  domainName: string;
  years: number;
  clientId?: string;
  contactInfo: {
    name: string;
    email: string;
    company?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    phone: string;
  };
  privacy?: boolean;
  autoRenew?: boolean;
  customNameservers?: string[];
}

export interface RenewDomainParams {
  domainId: string;
  years: number;
}

export interface TransferDomainParams {
  domainName: string;
  authCode: string;
  contactInfo?: RegisterDomainParams['contactInfo'];
}

export interface DnsRecordParams {
  domainId: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
}

export interface EmailAccountParams {
  domainId: string;
  email: string; // Just the local part (before @)
  displayName?: string;
  accountType?: EmailAccountType;
  forwardTo?: string[];
  mailboxSizeGb?: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DomainStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  totalEmails: number;
  domainsWithEmail: number;
}

export interface ExpiringDomain {
  id: string;
  domainName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  autoRenew: boolean;
}

// ============================================================================
// Cart Types (for checkout flow)
// ============================================================================

export interface DomainCartItem {
  type: 'registration' | 'renewal' | 'transfer';
  domainName: string;
  years: number;
  wholesalePrice: number;
  retailPrice: number;
  privacy: boolean;
  privacyPrice: number;
}

export interface DomainCart {
  items: DomainCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface DomainActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedDomains {
  domains: DomainWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Webhook Event Types (Automation Engine Integration)
// ============================================================================

/**
 * Domain Module Events
 * 
 * These events integrate with the Automation Engine (EM-57).
 * When implementing, emit events using:
 * 
 * import { emitEvent } from '@/lib/modules/module-events';
 * await emitEvent(domainModuleId, siteId, 'domain.domain.registered', payload);
 * 
 * Naming Convention: domain.{entity}.{action}
 */
export type DomainEventType =
  // Domain lifecycle events
  | 'domain.domain.registered'        // New domain registered
  | 'domain.domain.renewed'           // Domain renewed
  | 'domain.domain.transferred_in'    // Transfer completed
  | 'domain.domain.transferred_out'   // Transfer out initiated
  | 'domain.domain.expiring_soon'     // Expiring within X days
  | 'domain.domain.expired'           // Domain expired
  | 'domain.domain.suspended'         // Domain suspended
  | 'domain.domain.reactivated'       // Domain reactivated
  | 'domain.domain.auto_renewed'      // Auto-renewal processed
  | 'domain.domain.nameservers_changed' // Nameservers changed
  // DNS events
  | 'domain.dns.record_created'       // DNS record added
  | 'domain.dns.record_updated'       // DNS record updated
  | 'domain.dns.record_deleted'       // DNS record deleted
  | 'domain.dns.zone_created'         // Cloudflare zone created
  | 'domain.dns.ssl_provisioned'      // SSL certificate ready
  | 'domain.dns.propagation_complete' // DNS propagated
  // Email events
  | 'domain.email.subscription_created'   // Email plan purchased
  | 'domain.email.subscription_cancelled' // Email cancelled
  | 'domain.email.account_created'    // Email mailbox created
  | 'domain.email.account_deleted'    // Email mailbox deleted
  | 'domain.email.quota_warning'      // Mailbox near capacity
  // Order events
  | 'domain.order.created'            // New order placed
  | 'domain.order.completed'          // Order fulfilled
  | 'domain.order.failed'             // Order failed
  | 'domain.order.refunded'           // Order refunded
  // Transfer events
  | 'domain.transfer.initiated'       // Transfer started
  | 'domain.transfer.auth_required'   // Auth code needed
  | 'domain.transfer.approved'        // Transfer approved
  | 'domain.transfer.completed'       // Transfer done
  | 'domain.transfer.failed'          // Transfer failed
  | 'domain.transfer.cancelled';      // Transfer cancelled

export interface DomainEvent {
  type: DomainEventType;
  domainId: string;
  domainName: string;
  agencyId: string;
  siteId?: string;
  timestamp: string;
  data: Record<string, unknown>;
}
```

---

## ✅ Completion Checklist

- [ ] Domain registry table with all fields
- [ ] DNS records table with Cloudflare integration fields
- [ ] Email accounts table with ResellerClub Business Email integration
- [ ] Domain orders/purchase history table
- [ ] Domain transfers tracking table
- [ ] Pricing configuration table
- [ ] Cloudflare zones table
- [ ] Email subscriptions table
- [ ] Domain contacts cache table
- [ ] RLS policies for all tables (multi-tenant security)
- [ ] Update timestamp triggers
- [ ] Helper functions (expiring domains, price calculation)
- [ ] Proper indexes for performance
- [ ] TypeScript type definitions
- [ ] Extended types with relations
- [ ] Filter and search types
- [ ] Action parameter types
- [ ] Migration runs without errors

---

## 🔄 After Implementation

1. Run migration: `psql -f migrations/dm-02-domain-schema.sql`
2. Regenerate Supabase types: `npx supabase gen types typescript --project-id <id> > src/types/supabase.ts`
3. Verify types compile: `npx tsc --noEmit`
4. Update database.types.ts if needed

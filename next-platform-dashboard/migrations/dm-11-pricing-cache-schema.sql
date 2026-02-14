-- ============================================================================
-- Phase DM-11: ResellerClub Pricing Cache & Sync Configuration
-- ============================================================================
-- Description: Pricing cache tables, sync timestamps, and pricing source config
-- Created: February 14, 2026
-- ============================================================================

-- ============================================================================
-- Extend agency_domain_pricing with pricing source configuration
-- ============================================================================

ALTER TABLE agency_domain_pricing 
ADD COLUMN IF NOT EXISTS pricing_source TEXT DEFAULT 'resellerclub_customer' 
  CHECK (pricing_source IN ('resellerclub_customer', 'resellerclub_reseller', 'resellerclub_cost_plus_markup'));

ALTER TABLE agency_domain_pricing 
ADD COLUMN IF NOT EXISTS apply_platform_markup BOOLEAN DEFAULT false;

COMMENT ON COLUMN agency_domain_pricing.pricing_source IS 
  'Source for retail pricing: resellerclub_customer (RC markups applied), resellerclub_reseller (slab prices), or resellerclub_cost_plus_markup (wholesale + platform markup)';

COMMENT ON COLUMN agency_domain_pricing.apply_platform_markup IS 
  'Whether to apply additional platform markup on top of ResellerClub pricing (only if pricing_source is resellerclub_customer)';

-- ============================================================================
-- Domain pricing cache (TLD pricing from ResellerClub APIs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_pricing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- TLD identifier
  tld TEXT NOT NULL,
  
  -- Pricing type
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('customer', 'reseller', 'cost')),
  
  -- Currency
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Registration prices by tenure (in cents to avoid floating point issues)
  register_1yr INTEGER NOT NULL,
  register_2yr INTEGER,
  register_3yr INTEGER,
  register_5yr INTEGER,
  register_10yr INTEGER,
  
  -- Renewal prices by tenure (in cents)
  renew_1yr INTEGER NOT NULL,
  renew_2yr INTEGER,
  renew_3yr INTEGER,
  renew_5yr INTEGER,
  renew_10yr INTEGER,
  
  -- Transfer and restore prices (in cents)
  transfer_price INTEGER NOT NULL,
  restore_price INTEGER,
  
  -- Privacy protection pricing (optional, in cents)
  privacy_1yr INTEGER,
  
  -- Metadata
  source_api_endpoint TEXT,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one cache entry per TLD + pricing_type
  CONSTRAINT domain_pricing_cache_unique UNIQUE (tld, pricing_type)
);

CREATE INDEX IF NOT EXISTS idx_domain_pricing_cache_tld ON domain_pricing_cache(tld);
CREATE INDEX IF NOT EXISTS idx_domain_pricing_cache_type ON domain_pricing_cache(pricing_type);
CREATE INDEX IF NOT EXISTS idx_domain_pricing_cache_refreshed ON domain_pricing_cache(last_refreshed_at);

COMMENT ON TABLE domain_pricing_cache IS 
  'Cached pricing data from ResellerClub APIs (customer, reseller, cost) to avoid real-time API calls and provide fallback during outages';

-- ============================================================================
-- Email pricing cache (Business Email/Titan pricing from ResellerClub)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_pricing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product key (eeliteus, eelitein, eeliteuk)
  product_key TEXT NOT NULL,
  
  -- Pricing type
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('customer', 'reseller', 'cost')),
  
  -- Currency
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Tenure (months)
  months INTEGER NOT NULL CHECK (months IN (1, 3, 6, 12, 24, 36)),
  
  -- Prices per account (in cents)
  add_account_price INTEGER NOT NULL,
  renew_account_price INTEGER NOT NULL,
  
  -- Metadata
  source_api_endpoint TEXT,
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one cache entry per product + tenure + pricing_type
  CONSTRAINT email_pricing_cache_unique UNIQUE (product_key, months, pricing_type)
);

CREATE INDEX IF NOT EXISTS idx_email_pricing_cache_product ON email_pricing_cache(product_key);
CREATE INDEX IF NOT EXISTS idx_email_pricing_cache_type ON email_pricing_cache(pricing_type);
CREATE INDEX IF NOT EXISTS idx_email_pricing_cache_months ON email_pricing_cache(months);
CREATE INDEX IF NOT EXISTS idx_email_pricing_cache_refreshed ON email_pricing_cache(last_refreshed_at);

COMMENT ON TABLE email_pricing_cache IS 
  'Cached Business Email (Titan) pricing from ResellerClub eelite APIs';

-- ============================================================================
-- Add sync timestamps to domains and email_orders
-- ============================================================================

ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS resellerclub_last_synced_at TIMESTAMPTZ;

ALTER TABLE domains 
ADD COLUMN IF NOT EXISTS registered_via_api BOOLEAN DEFAULT false;

COMMENT ON COLUMN domains.resellerclub_last_synced_at IS 
  'Last time domain status/expiry/settings were synced from ResellerClub';

COMMENT ON COLUMN domains.registered_via_api IS 
  'Whether domain was registered via ResellerClub API (true) or manually added (false)';

ALTER TABLE email_orders 
ADD COLUMN IF NOT EXISTS resellerclub_last_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN email_orders.resellerclub_last_synced_at IS 
  'Last time email order status/accounts were synced from ResellerClub';

-- ============================================================================
-- Pricing sync log (audit trail for pricing refresh operations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('domain', 'email', 'full')),
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('customer', 'reseller', 'cost', 'all')),
  
  -- Results
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  tlds_refreshed INTEGER DEFAULT 0,
  email_products_refreshed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Performance
  duration_ms INTEGER,
  api_calls_made INTEGER DEFAULT 0,
  
  -- Metadata
  triggered_by TEXT DEFAULT 'manual', -- 'manual', 'cron', 'webhook'
  trigger_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pricing_sync_log_type ON pricing_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_pricing_sync_log_status ON pricing_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_pricing_sync_log_started ON pricing_sync_log(started_at DESC);

COMMENT ON TABLE pricing_sync_log IS 
  'Audit log for pricing cache refresh operations';

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Pricing caches are read-only for all authenticated users
ALTER TABLE domain_pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_sync_log ENABLE ROW LEVEL SECURITY;

-- Anyone can read pricing caches
CREATE POLICY "Anyone can view domain pricing cache" ON domain_pricing_cache
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view email pricing cache" ON email_pricing_cache
  FOR SELECT USING (true);

-- Only service role can write to pricing caches
CREATE POLICY "Service role can manage domain pricing cache" ON domain_pricing_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage email pricing cache" ON email_pricing_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can view sync logs
CREATE POLICY "Authenticated users can view sync logs" ON pricing_sync_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can write sync logs
CREATE POLICY "Service role can manage sync logs" ON pricing_sync_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER update_domain_pricing_cache_updated_at
  BEFORE UPDATE ON domain_pricing_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_pricing_cache_updated_at
  BEFORE UPDATE ON email_pricing_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if pricing cache is stale (older than X hours)
CREATE OR REPLACE FUNCTION is_pricing_cache_stale(
  p_cache_type TEXT DEFAULT 'domain',
  p_max_age_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  v_oldest_refresh TIMESTAMPTZ;
BEGIN
  IF p_cache_type = 'domain' THEN
    SELECT MIN(last_refreshed_at) INTO v_oldest_refresh
    FROM domain_pricing_cache
    WHERE pricing_type = 'customer';
  ELSIF p_cache_type = 'email' THEN
    SELECT MIN(last_refreshed_at) INTO v_oldest_refresh
    FROM email_pricing_cache
    WHERE pricing_type = 'customer';
  ELSE
    RETURN true; -- Unknown cache type, consider stale
  END IF;
  
  -- If no cache entries or oldest is beyond max age, it's stale
  RETURN v_oldest_refresh IS NULL OR 
         v_oldest_refresh < (now() - (p_max_age_hours || ' hours')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_pricing_cache_stale IS 
  'Check if pricing cache is stale and needs refresh';

-- Function to get cached pricing or null if not available/stale
CREATE OR REPLACE FUNCTION get_cached_domain_price(
  p_tld TEXT,
  p_pricing_type TEXT DEFAULT 'customer',
  p_max_age_hours INTEGER DEFAULT 24
)
RETURNS domain_pricing_cache AS $$
DECLARE
  v_cache domain_pricing_cache%ROWTYPE;
BEGIN
  SELECT * INTO v_cache
  FROM domain_pricing_cache
  WHERE tld = p_tld
    AND pricing_type = p_pricing_type
    AND last_refreshed_at > (now() - (p_max_age_hours || ' hours')::INTERVAL);
  
  RETURN v_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_cached_domain_price IS 
  'Get cached domain pricing if available and not stale';

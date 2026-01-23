-- Phase EM-32: Custom Domain Support
-- Database schema for custom domains, SSL certificates, and white-label settings
-- Date: January 23, 2026

-- ================================================================
-- DROP EXISTING TABLES (Clean slate for development)
-- ================================================================

DROP TABLE IF EXISTS domain_request_logs CASCADE;
DROP TABLE IF EXISTS domain_ssl_certificates CASCADE;
DROP TABLE IF EXISTS domain_dns_records CASCADE;
DROP TABLE IF EXISTS module_custom_domains CASCADE;

-- ================================================================
-- CUSTOM DOMAINS FOR MODULE HOSTING
-- ================================================================

CREATE TABLE IF NOT EXISTS module_custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_module_installation_id UUID NOT NULL REFERENCES site_module_installations(id) ON DELETE CASCADE,
  
  -- Domain info
  domain TEXT NOT NULL UNIQUE,           -- "app.clientbusiness.com"
  subdomain TEXT,                        -- if using *.dramac.app
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'verifying', 'verified', 'provisioning', 'active', 
    'failed', 'expired', 'disabled'
  )),
  
  -- Verification
  verification_method TEXT CHECK (verification_method IN (
    'cname', 'txt', 'file', 'meta'
  )),
  verification_token TEXT,
  verification_value TEXT,              -- Expected value
  verified_at TIMESTAMPTZ,
  
  -- SSL
  ssl_status TEXT DEFAULT 'none' CHECK (ssl_status IN (
    'none', 'pending', 'provisioning', 'active', 'expired', 'failed'
  )),
  ssl_provider TEXT DEFAULT 'letsencrypt',
  ssl_certificate TEXT,                 -- PEM certificate
  ssl_private_key_encrypted TEXT,       -- Encrypted private key
  ssl_expires_at TIMESTAMPTZ,
  ssl_auto_renew BOOLEAN DEFAULT true,
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  /*
  {
    "redirect_to_https": true,
    "force_www": false,
    "custom_headers": {},
    "cache_ttl": 3600,
    "enable_cdn": true
  }
  */
  
  -- White-label
  white_label JSONB DEFAULT '{}'::jsonb,
  /*
  {
    "logo_url": "...",
    "favicon_url": "...",
    "brand_name": "Client App",
    "brand_colors": { "primary": "#...", "secondary": "#..." },
    "hide_powered_by": true,
    "custom_css": "..."
  }
  */
  
  -- Analytics
  total_requests BIGINT DEFAULT 0,
  bandwidth_bytes BIGINT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_domain CHECK (
    domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]*[.][a-zA-Z0-9.-]+$'
  )
);

-- ================================================================
-- DNS RECORDS FOR VERIFICATION
-- ================================================================

CREATE TABLE IF NOT EXISTS domain_dns_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES module_custom_domains(id) ON DELETE CASCADE,
  
  record_type TEXT NOT NULL,             -- 'A', 'CNAME', 'TXT'
  host TEXT NOT NULL,                    -- '@', 'www', '_dramac-verify'
  value TEXT NOT NULL,                   -- IP or target
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SSL CERTIFICATE HISTORY
-- ================================================================

CREATE TABLE IF NOT EXISTS domain_ssl_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES module_custom_domains(id) ON DELETE CASCADE,
  
  -- Certificate info
  serial_number TEXT,
  issuer TEXT,
  subject TEXT,
  san TEXT[],                            -- Subject Alternative Names
  
  -- Dates
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  revoked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- DOMAIN REQUEST LOGS (for analytics)
-- ================================================================

CREATE TABLE IF NOT EXISTS domain_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES module_custom_domains(id) ON DELETE CASCADE,
  
  -- Request info
  path TEXT,
  method TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  bytes_sent INTEGER,
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  country_code TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: For production, consider partitioning by month:
-- CREATE TABLE domain_request_logs_YYYY_MM PARTITION OF domain_request_logs ...

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX idx_custom_domains_site_module ON module_custom_domains(site_module_installation_id);
CREATE INDEX idx_custom_domains_domain ON module_custom_domains(domain);
CREATE INDEX idx_custom_domains_status ON module_custom_domains(status);
CREATE INDEX idx_custom_domains_ssl_expires ON module_custom_domains(ssl_expires_at) 
  WHERE ssl_status = 'active' AND ssl_auto_renew = true;

CREATE INDEX idx_domain_dns_records_domain ON domain_dns_records(domain_id);

CREATE INDEX idx_domain_ssl_certs_domain ON domain_ssl_certificates(domain_id);
CREATE INDEX idx_domain_ssl_certs_status ON domain_ssl_certificates(domain_id, status);

CREATE INDEX idx_request_logs_domain_time ON domain_request_logs(domain_id, created_at DESC);
CREATE INDEX idx_request_logs_created ON domain_request_logs(created_at DESC);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Function to get module by domain (for routing)
CREATE OR REPLACE FUNCTION get_module_by_domain(p_domain TEXT)
RETURNS TABLE (
  site_module_installation_id UUID,
  module_id UUID,
  site_id UUID,
  config JSONB,
  white_label JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mcd.site_module_installation_id,
    smi.module_id,
    smi.site_id,
    mcd.config,
    mcd.white_label
  FROM module_custom_domains mcd
  JOIN site_module_installations smi ON mcd.site_module_installation_id = smi.id
  WHERE mcd.domain = p_domain
    AND mcd.status = 'active'
    AND mcd.ssl_status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to increment domain stats (for analytics)
CREATE OR REPLACE FUNCTION increment_domain_stats(
  p_domain_id UUID,
  p_requests INTEGER DEFAULT 1,
  p_bytes BIGINT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE module_custom_domains
  SET 
    total_requests = total_requests + p_requests,
    bandwidth_bytes = bandwidth_bytes + p_bytes,
    updated_at = NOW()
  WHERE id = p_domain_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get domains needing SSL renewal
CREATE OR REPLACE FUNCTION get_domains_for_ssl_renewal(p_days_before_expiry INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  domain TEXT,
  ssl_expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mcd.id,
    mcd.domain,
    mcd.ssl_expires_at
  FROM module_custom_domains mcd
  WHERE mcd.ssl_status = 'active'
    AND mcd.ssl_auto_renew = true
    AND mcd.ssl_expires_at < NOW() + (p_days_before_expiry || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE module_custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_ssl_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_request_logs ENABLE ROW LEVEL SECURITY;

-- Custom domains: access through site_module_installations which has agency check
CREATE POLICY "Users can view their site module domains"
  ON module_custom_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM site_module_installations smi
      JOIN sites s ON smi.site_id = s.id
      WHERE smi.id = module_custom_domains.site_module_installation_id
        AND s.agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can manage their site module domains"
  ON module_custom_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM site_module_installations smi
      JOIN sites s ON smi.site_id = s.id
      WHERE smi.id = module_custom_domains.site_module_installation_id
        AND s.agency_id IN (
          SELECT agency_id FROM agency_members 
          WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    )
  );

-- DNS records: inherit from domain
CREATE POLICY "Users can view their domain DNS records"
  ON domain_dns_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_custom_domains mcd
      JOIN site_module_installations smi ON mcd.site_module_installation_id = smi.id
      JOIN sites s ON smi.site_id = s.id
      WHERE mcd.id = domain_dns_records.domain_id
        AND s.agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
    )
  );

-- SSL certificates: inherit from domain
CREATE POLICY "Users can view their domain SSL certificates"
  ON domain_ssl_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_custom_domains mcd
      JOIN site_module_installations smi ON mcd.site_module_installation_id = smi.id
      JOIN sites s ON smi.site_id = s.id
      WHERE mcd.id = domain_ssl_certificates.domain_id
        AND s.agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
    )
  );

-- Request logs: inherit from domain
CREATE POLICY "Users can view their domain request logs"
  ON domain_request_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_custom_domains mcd
      JOIN site_module_installations smi ON mcd.site_module_installation_id = smi.id
      JOIN sites s ON smi.site_id = s.id
      WHERE mcd.id = domain_request_logs.domain_id
        AND s.agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
    )
  );

-- Service role bypass for background jobs
CREATE POLICY "Service role can manage all domains"
  ON module_custom_domains FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all DNS records"
  ON domain_dns_records FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all SSL certificates"
  ON domain_ssl_certificates FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all request logs"
  ON domain_request_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_domain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_domain_timestamp
  BEFORE UPDATE ON module_custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_domain_updated_at();

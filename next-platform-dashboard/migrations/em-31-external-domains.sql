-- Phase EM-31: External Website Integration
-- Database schema for external domain management, OAuth, and webhooks

-- ================================================================
-- DROP EXISTING TABLES (Clean slate)
-- ================================================================

DROP TABLE IF EXISTS module_webhook_deliveries CASCADE;
DROP TABLE IF EXISTS module_webhooks CASCADE;
DROP TABLE IF EXISTS module_oauth_refresh_tokens CASCADE;
DROP TABLE IF EXISTS module_oauth_codes CASCADE;
DROP TABLE IF EXISTS module_oauth_clients CASCADE;
DROP TABLE IF EXISTS module_external_requests CASCADE;
DROP TABLE IF EXISTS module_external_tokens CASCADE;
DROP TABLE IF EXISTS module_allowed_domains CASCADE;

-- ================================================================
-- ALLOWED DOMAINS FOR EXTERNAL EMBEDDING
-- ================================================================

CREATE TABLE IF NOT EXISTS module_allowed_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  
  domain TEXT NOT NULL,               -- "example.com" or "*.example.com"
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  
  -- Settings
  allow_embed BOOLEAN DEFAULT true,
  allow_api BOOLEAN DEFAULT true,
  
  -- Restrictions
  embed_types TEXT[] DEFAULT '{}',    -- Empty = all, or ['widget', 'popup']
  rate_limit INTEGER DEFAULT 1000,    -- Requests per hour
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, module_id, domain)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_allowed_domains_site ON module_allowed_domains(site_id);
CREATE INDEX IF NOT EXISTS idx_allowed_domains_module ON module_allowed_domains(module_id);
CREATE INDEX IF NOT EXISTS idx_allowed_domains_verified ON module_allowed_domains(module_id, verified);

-- ================================================================
-- API ACCESS TOKENS FOR EXTERNAL APPS
-- ================================================================

CREATE TABLE IF NOT EXISTS module_external_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,           -- Hashed token
  token_prefix TEXT NOT NULL,         -- First 8 chars for identification
  
  -- Permissions
  scopes TEXT[] DEFAULT '{}',         -- ['read', 'write', 'delete']
  
  -- Restrictions
  allowed_domains TEXT[],             -- null = any domain
  allowed_ips TEXT[],                 -- null = any IP
  rate_limit INTEGER DEFAULT 100,     -- Requests per minute
  
  -- Tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_external_tokens_site ON module_external_tokens(site_id);
CREATE INDEX IF NOT EXISTS idx_external_tokens_module ON module_external_tokens(module_id);
CREATE INDEX IF NOT EXISTS idx_external_tokens_prefix ON module_external_tokens(token_prefix);

-- ================================================================
-- EXTERNAL REQUEST LOGS
-- ================================================================

CREATE TABLE IF NOT EXISTS module_external_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  module_id UUID NOT NULL,
  token_id UUID REFERENCES module_external_tokens(id) ON DELETE SET NULL,
  
  -- Request info
  method TEXT,
  path TEXT,
  origin TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  
  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_requests_created ON module_external_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_external_requests_site ON module_external_requests(site_id, created_at);
CREATE INDEX IF NOT EXISTS idx_external_requests_module ON module_external_requests(module_id, created_at);

-- ================================================================
-- OAUTH CLIENTS
-- ================================================================

CREATE TABLE IF NOT EXISTS module_oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NOT NULL,
  
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  scopes TEXT[] NOT NULL DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_clients_site ON module_oauth_clients(site_id);
CREATE INDEX IF NOT EXISTS idx_oauth_clients_module ON module_oauth_clients(module_id);
CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON module_oauth_clients(client_id);

-- ================================================================
-- OAUTH AUTHORIZATION CODES
-- ================================================================

CREATE TABLE IF NOT EXISTS module_oauth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  
  -- PKCE support
  code_challenge TEXT,
  code_challenge_method TEXT,
  
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_codes_hash ON module_oauth_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON module_oauth_codes(expires_at);

-- ================================================================
-- OAUTH REFRESH TOKENS
-- ================================================================

CREATE TABLE IF NOT EXISTS module_oauth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON module_oauth_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_client ON module_oauth_refresh_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON module_oauth_refresh_tokens(user_id);

-- ================================================================
-- WEBHOOKS
-- ================================================================

CREATE TABLE IF NOT EXISTS module_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  
  events TEXT[] NOT NULL DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_site ON module_webhooks(site_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_module ON module_webhooks(module_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON module_webhooks(module_id, is_active);

-- ================================================================
-- WEBHOOK DELIVERIES
-- ================================================================

CREATE TABLE IF NOT EXISTS module_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES module_webhooks(id) ON DELETE CASCADE,
  
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  status_code INTEGER,
  response TEXT,
  
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON module_webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON module_webhook_deliveries(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON module_webhook_deliveries(created_at);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

-- Enable RLS but allow all authenticated users for now
-- TODO: Update policies based on actual site membership structure
ALTER TABLE module_allowed_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_external_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_external_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_oauth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_authenticated" ON module_allowed_domains;
DROP POLICY IF EXISTS "allow_authenticated" ON module_external_tokens;
DROP POLICY IF EXISTS "allow_authenticated" ON module_external_requests;
DROP POLICY IF EXISTS "allow_authenticated" ON module_oauth_clients;
DROP POLICY IF EXISTS "allow_authenticated" ON module_webhooks;
DROP POLICY IF EXISTS "allow_authenticated" ON module_webhook_deliveries;
DROP POLICY IF EXISTS "user_owns_code" ON module_oauth_codes;
DROP POLICY IF EXISTS "user_owns_token" ON module_oauth_refresh_tokens;

-- Simple policies: allow authenticated users (refine later based on your site structure)
CREATE POLICY "allow_authenticated" ON module_allowed_domains
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated" ON module_external_tokens
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated" ON module_external_requests
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated" ON module_oauth_clients
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated" ON module_webhooks
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "allow_authenticated" ON module_webhook_deliveries
  FOR ALL USING (auth.uid() IS NOT NULL);

-- OAuth codes accessible by the user who created them
CREATE POLICY "user_owns_code" ON module_oauth_codes
  FOR ALL USING (user_id = auth.uid());

-- OAuth refresh tokens accessible by the user who owns them
CREATE POLICY "user_owns_token" ON module_oauth_refresh_tokens
  FOR ALL USING (user_id = auth.uid());

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Function to clean up expired OAuth codes
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM module_oauth_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM module_oauth_refresh_tokens
  WHERE expires_at < NOW()
  OR revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update webhook stats
CREATE OR REPLACE FUNCTION update_webhook_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
    UPDATE module_webhooks
    SET 
      success_count = success_count + 1,
      last_success_at = NOW(),
      last_triggered_at = NOW()
    WHERE id = NEW.webhook_id;
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    UPDATE module_webhooks
    SET 
      failure_count = failure_count + 1,
      last_failure_at = NOW(),
      last_triggered_at = NOW()
    WHERE id = NEW.webhook_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for webhook stats
DROP TRIGGER IF EXISTS webhook_delivery_stats ON module_webhook_deliveries;
CREATE TRIGGER webhook_delivery_stats
  AFTER INSERT OR UPDATE ON module_webhook_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_stats();

-- Function to log external requests
CREATE OR REPLACE FUNCTION log_external_request(
  p_site_id UUID,
  p_module_id UUID,
  p_token_id UUID,
  p_method TEXT,
  p_path TEXT,
  p_origin TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO module_external_requests (
    site_id, module_id, token_id, method, path, origin,
    ip_address, user_agent, status_code, response_time_ms,
    error_code, error_message
  ) VALUES (
    p_site_id, p_module_id, p_token_id, p_method, p_path, p_origin,
    p_ip_address, p_user_agent, p_status_code, p_response_time_ms,
    p_error_code, p_error_message
  )
  RETURNING id INTO v_id;
  
  -- Update token usage if applicable
  IF p_token_id IS NOT NULL THEN
    UPDATE module_external_tokens
    SET last_used_at = NOW(), usage_count = usage_count + 1
    WHERE id = p_token_id;
  END IF;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- UPDATED_AT TRIGGERS
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_allowed_domains_updated_at ON module_allowed_domains;
CREATE TRIGGER update_allowed_domains_updated_at
  BEFORE UPDATE ON module_allowed_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oauth_clients_updated_at ON module_oauth_clients;
CREATE TRIGGER update_oauth_clients_updated_at
  BEFORE UPDATE ON module_oauth_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON module_webhooks;
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON module_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Phase EM-33: API-Only Mode Schema
-- Database schema for API consumers, request logging, GraphQL schemas, and webhooks
-- Date: January 23, 2026
-- 
-- Enables modules to run in headless/API-only mode for programmatic access:
-- 1. REST API endpoints for all module data
-- 2. GraphQL API option
-- 3. Webhook event delivery
-- 4. SDK generation support
-- 5. API documentation auto-generation

-- ================================================================
-- DROP EXISTING TABLES (Clean slate for development)
-- ================================================================

DROP TABLE IF EXISTS module_api_webhook_deliveries CASCADE;
DROP TABLE IF EXISTS module_api_webhooks CASCADE;
DROP TABLE IF EXISTS module_graphql_schemas CASCADE;
DROP TABLE IF EXISTS module_api_requests CASCADE;
DROP TABLE IF EXISTS module_api_consumers CASCADE;

-- ================================================================
-- API CONSUMERS (Applications using the API)
-- ================================================================

CREATE TABLE module_api_consumers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_module_installation_id UUID NOT NULL REFERENCES site_module_installations(id) ON DELETE CASCADE,
  
  -- Consumer info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Authentication
  api_key TEXT UNIQUE NOT NULL,          -- For simple auth (dk_xxxx format)
  api_secret_hash TEXT,                  -- Hashed secret for HMAC signing
  
  -- OAuth (optional - link to existing OAuth clients from EM-31)
  oauth_client_id UUID REFERENCES module_oauth_clients(id) ON DELETE SET NULL,
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read'],   -- ['read', 'write', 'delete', 'admin']
  allowed_endpoints TEXT[] DEFAULT ARRAY['*'], -- ['GET /products', 'POST /orders', '*']
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- IP restrictions (null = all allowed)
  allowed_ips INET[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_requests BIGINT DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  /*
  {
    "environment": "production" | "staging" | "development",
    "platform": "web" | "mobile" | "server",
    "version": "1.0.0",
    "notes": "..."
  }
  */
  
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- API REQUEST LOG
-- ================================================================

CREATE TABLE module_api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID REFERENCES module_api_consumers(id) ON DELETE SET NULL,
  site_module_installation_id UUID NOT NULL REFERENCES site_module_installations(id) ON DELETE CASCADE,
  
  -- Request details
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')),
  path TEXT NOT NULL,
  query_params JSONB,
  request_body JSONB,
  request_headers JSONB,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  response_size_bytes INTEGER,
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  
  -- Error (if any)
  error_message TEXT,
  error_code TEXT,
  
  -- GraphQL specific
  is_graphql BOOLEAN DEFAULT false,
  graphql_operation_name TEXT,
  graphql_operation_type TEXT CHECK (graphql_operation_type IN ('query', 'mutation', 'subscription')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- GRAPHQL SCHEMA CACHE
-- ================================================================

CREATE TABLE module_graphql_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules_v2(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  
  -- Schema
  sdl TEXT NOT NULL,                     -- GraphQL SDL (Schema Definition Language)
  introspection_json JSONB,              -- Full introspection result
  
  -- Status
  is_active BOOLEAN DEFAULT true,        -- Only one active version per module
  
  -- Generation metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_from JSONB,                  -- Module entities/config used to generate
  
  -- Unique active schema per module
  UNIQUE (module_id, version)
);

-- ================================================================
-- WEBHOOK SUBSCRIPTIONS (enhanced from EM-31)
-- ================================================================

CREATE TABLE module_api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES module_api_consumers(id) ON DELETE CASCADE,
  
  -- Webhook config
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,                -- ['product.created', 'order.completed', '*']
  
  -- Security
  secret TEXT,                           -- For signing payloads (HMAC-SHA256)
  
  -- Headers
  custom_headers JSONB DEFAULT '{}'::jsonb,
  
  -- Retry configuration
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- WEBHOOK DELIVERY LOG
-- ================================================================

CREATE TABLE module_api_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES module_api_webhooks(id) ON DELETE CASCADE,
  
  -- Event info
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),
  
  -- Response details
  response_status_code INTEGER,
  response_body TEXT,
  response_headers JSONB,
  response_time_ms INTEGER,
  
  -- Retry info
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Signature
  signature TEXT,                        -- HMAC signature sent with request
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ================================================================
-- API ENDPOINT CONFIGURATIONS
-- ================================================================

CREATE TABLE module_api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules_v2(id) ON DELETE CASCADE,
  
  -- Endpoint definition
  path TEXT NOT NULL,                    -- '/products', '/orders/{id}'
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  
  -- Entity mapping
  entity_name TEXT NOT NULL,             -- 'product', 'order'
  operation TEXT NOT NULL CHECK (operation IN ('list', 'create', 'read', 'update', 'delete')),
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  /*
  {
    "pagination": { "defaultLimit": 20, "maxLimit": 100 },
    "filtering": ["status", "category"],
    "sorting": ["created_at", "name", "price"],
    "searchable": ["name", "description"],
    "relations": ["category", "tags"]
  }
  */
  
  -- Security
  required_scopes TEXT[] DEFAULT ARRAY['read'],
  is_public BOOLEAN DEFAULT false,       -- Allow unauthenticated access
  rate_limit_override INTEGER,           -- Override consumer rate limit
  
  -- Documentation
  summary TEXT,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique endpoint per module
  UNIQUE (module_id, path, method)
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Drop indexes if they exist (for idempotency)
DROP INDEX IF EXISTS idx_api_consumers_site_module;
DROP INDEX IF EXISTS idx_api_consumers_key;
DROP INDEX IF EXISTS idx_api_consumers_oauth;
DROP INDEX IF EXISTS idx_api_requests_consumer;
DROP INDEX IF EXISTS idx_api_requests_module;
DROP INDEX IF EXISTS idx_api_requests_time;
DROP INDEX IF EXISTS idx_api_requests_graphql;
DROP INDEX IF EXISTS idx_graphql_schemas;
DROP INDEX IF EXISTS idx_graphql_schemas_active;
DROP INDEX IF EXISTS idx_api_webhooks_consumer;
DROP INDEX IF EXISTS idx_api_webhooks_active;
DROP INDEX IF EXISTS idx_webhook_deliveries_webhook;
DROP INDEX IF EXISTS idx_webhook_deliveries_pending;
DROP INDEX IF EXISTS idx_api_endpoints_module;
DROP INDEX IF EXISTS idx_api_endpoints_lookup;

-- API Consumers
CREATE INDEX idx_api_consumers_site_module ON module_api_consumers(site_module_installation_id);
CREATE INDEX idx_api_consumers_key ON module_api_consumers(api_key) WHERE is_active;
CREATE INDEX idx_api_consumers_oauth ON module_api_consumers(oauth_client_id) WHERE oauth_client_id IS NOT NULL;

-- API Requests (time-series optimized)
CREATE INDEX idx_api_requests_consumer ON module_api_requests(consumer_id, created_at DESC);
CREATE INDEX idx_api_requests_module ON module_api_requests(site_module_installation_id, created_at DESC);
CREATE INDEX idx_api_requests_time ON module_api_requests(created_at DESC);
CREATE INDEX idx_api_requests_graphql ON module_api_requests(site_module_installation_id, created_at DESC) WHERE is_graphql;

-- GraphQL Schemas
CREATE INDEX idx_graphql_schemas ON module_graphql_schemas(module_id, version);
CREATE INDEX idx_graphql_schemas_active ON module_graphql_schemas(module_id) WHERE is_active;

-- Webhooks
CREATE INDEX idx_api_webhooks_consumer ON module_api_webhooks(consumer_id);
CREATE INDEX idx_api_webhooks_active ON module_api_webhooks(consumer_id) WHERE is_active;

-- Webhook Deliveries
CREATE INDEX idx_webhook_deliveries_webhook ON module_api_webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_pending ON module_api_webhook_deliveries(next_retry_at) 
  WHERE status IN ('pending', 'processing');

-- API Endpoints
CREATE INDEX idx_api_endpoints_module ON module_api_endpoints(module_id);
CREATE INDEX idx_api_endpoints_lookup ON module_api_endpoints(module_id, path, method) WHERE is_active;

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Function to generate API key (dk_ prefix for DRAMAC Key)
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'dk_' || encode(gen_random_bytes(24), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to generate webhook secret
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN 'whsec_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_consumer_id UUID,
  p_window_minutes INTEGER DEFAULT 1
) RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  -- Get consumer's rate limit
  SELECT rate_limit_per_minute INTO v_limit
  FROM module_api_consumers
  WHERE id = p_consumer_id AND is_active;
  
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 0::INTEGER, NOW()::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Count requests in window
  SELECT COUNT(*) INTO v_count
  FROM module_api_requests
  WHERE consumer_id = p_consumer_id
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Calculate reset time
  v_reset := NOW() + (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN QUERY SELECT 
    (v_count < v_limit)::BOOLEAN,
    GREATEST(0, v_limit - v_count)::INTEGER,
    v_reset;
END;
$$ LANGUAGE plpgsql;

-- Function to check daily rate limit
CREATE OR REPLACE FUNCTION check_api_daily_limit(
  p_consumer_id UUID
) RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  -- Get consumer's daily limit
  SELECT rate_limit_per_day INTO v_limit
  FROM module_api_consumers
  WHERE id = p_consumer_id AND is_active;
  
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 0::INTEGER, NOW()::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Count requests today (UTC)
  SELECT COUNT(*) INTO v_count
  FROM module_api_requests
  WHERE consumer_id = p_consumer_id
    AND created_at > date_trunc('day', NOW() AT TIME ZONE 'UTC');
  
  -- Calculate reset time (next midnight UTC)
  v_reset := date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day';
  
  RETURN QUERY SELECT 
    (v_count < v_limit)::BOOLEAN,
    GREATEST(0, v_limit - v_count)::INTEGER,
    v_reset;
END;
$$ LANGUAGE plpgsql;

-- Function to increment request count
CREATE OR REPLACE FUNCTION increment_consumer_requests(
  p_consumer_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE module_api_consumers
  SET 
    total_requests = total_requests + 1,
    last_request_at = NOW(),
    updated_at = NOW()
  WHERE id = p_consumer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log API request
CREATE OR REPLACE FUNCTION log_api_request(
  p_consumer_id UUID,
  p_site_module_id UUID,
  p_method TEXT,
  p_path TEXT,
  p_query_params JSONB DEFAULT NULL,
  p_request_body JSONB DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_response_size INTEGER DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_is_graphql BOOLEAN DEFAULT false,
  p_graphql_operation TEXT DEFAULT NULL,
  p_graphql_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO module_api_requests (
    consumer_id,
    site_module_installation_id,
    method,
    path,
    query_params,
    request_body,
    status_code,
    response_time_ms,
    response_size_bytes,
    ip_address,
    user_agent,
    error_message,
    is_graphql,
    graphql_operation_name,
    graphql_operation_type
  ) VALUES (
    p_consumer_id,
    p_site_module_id,
    p_method,
    p_path,
    p_query_params,
    p_request_body,
    p_status_code,
    p_response_time_ms,
    p_response_size,
    p_ip_address,
    p_user_agent,
    p_error_message,
    p_is_graphql,
    p_graphql_operation,
    p_graphql_type
  ) RETURNING id INTO v_request_id;
  
  -- Also increment consumer request count
  IF p_consumer_id IS NOT NULL THEN
    PERFORM increment_consumer_requests(p_consumer_id);
  END IF;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update webhook stats
CREATE OR REPLACE FUNCTION update_webhook_stats(
  p_webhook_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE module_api_webhooks
  SET 
    total_deliveries = total_deliveries + 1,
    successful_deliveries = successful_deliveries + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_deliveries = failed_deliveries + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    last_delivery_at = NOW(),
    last_success_at = CASE WHEN p_success THEN NOW() ELSE last_success_at END,
    last_error = CASE WHEN NOT p_success THEN p_error ELSE last_error END,
    updated_at = NOW()
  WHERE id = p_webhook_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- RLS POLICIES
-- ================================================================

ALTER TABLE module_api_consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_graphql_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_api_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_api_endpoints ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for internal operations)
CREATE POLICY "service_role_api_consumers" ON module_api_consumers
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_api_requests" ON module_api_requests
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_graphql_schemas" ON module_graphql_schemas
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_api_webhooks" ON module_api_webhooks
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_webhook_deliveries" ON module_api_webhook_deliveries
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_api_endpoints" ON module_api_endpoints
  FOR ALL TO service_role USING (true);

-- Users can manage their own consumers (through site module installations)
CREATE POLICY "users_manage_api_consumers" ON module_api_consumers
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM site_module_installations smi
      WHERE smi.id = module_api_consumers.site_module_installation_id
        AND public.can_access_site(smi.site_id)
    )
  );

-- Users can view their own request logs
CREATE POLICY "users_view_api_requests" ON module_api_requests
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM site_module_installations smi
      WHERE smi.id = module_api_requests.site_module_installation_id
        AND public.can_access_site(smi.site_id)
    )
  );

-- Module developers can manage GraphQL schemas (allow all authenticated users for now)
CREATE POLICY "users_manage_graphql_schemas" ON module_graphql_schemas
  FOR ALL TO authenticated USING (true);

-- Users can manage their own webhooks
CREATE POLICY "users_manage_api_webhooks" ON module_api_webhooks
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM module_api_consumers mac
      JOIN site_module_installations smi ON smi.id = mac.site_module_installation_id
      WHERE mac.id = module_api_webhooks.consumer_id
        AND public.can_access_site(smi.site_id)
    )
  );

-- Users can view webhook deliveries
CREATE POLICY "users_view_webhook_deliveries" ON module_api_webhook_deliveries
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM module_api_webhooks maw
      JOIN module_api_consumers mac ON mac.id = maw.consumer_id
      JOIN site_module_installations smi ON smi.id = mac.site_module_installation_id
      WHERE maw.id = module_api_webhook_deliveries.webhook_id
        AND public.can_access_site(smi.site_id)
    )
  );

-- Module developers can manage API endpoints (allow all authenticated users for now)
CREATE POLICY "users_manage_api_endpoints" ON module_api_endpoints
  FOR ALL TO authenticated USING (true);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-generate API key on insert
CREATE OR REPLACE FUNCTION set_api_consumer_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key IS NULL OR NEW.api_key = '' THEN
    NEW.api_key := generate_api_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_api_consumer_key
  BEFORE INSERT ON module_api_consumers
  FOR EACH ROW
  EXECUTE FUNCTION set_api_consumer_key();

-- Auto-generate webhook secret on insert
CREATE OR REPLACE FUNCTION set_webhook_secret()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.secret IS NULL OR NEW.secret = '' THEN
    NEW.secret := generate_webhook_secret();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_webhook_secret
  BEFORE INSERT ON module_api_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION set_webhook_secret();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_api_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_api_consumers_updated
  BEFORE UPDATE ON module_api_consumers
  FOR EACH ROW
  EXECUTE FUNCTION update_api_timestamp();

CREATE TRIGGER tr_api_webhooks_updated
  BEFORE UPDATE ON module_api_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_api_timestamp();

CREATE TRIGGER tr_api_endpoints_updated
  BEFORE UPDATE ON module_api_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_api_timestamp();

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE module_api_consumers IS 'Applications/services that consume module APIs';
COMMENT ON TABLE module_api_requests IS 'Log of all API requests for analytics and debugging';
COMMENT ON TABLE module_graphql_schemas IS 'Cached GraphQL schemas for modules';
COMMENT ON TABLE module_api_webhooks IS 'Webhook subscriptions for event notifications';
COMMENT ON TABLE module_api_webhook_deliveries IS 'Log of webhook delivery attempts';
COMMENT ON TABLE module_api_endpoints IS 'Configured API endpoints for modules';

COMMENT ON FUNCTION generate_api_key() IS 'Generate a secure API key with dk_ prefix';
COMMENT ON FUNCTION generate_webhook_secret() IS 'Generate a secure webhook signing secret';
COMMENT ON FUNCTION check_api_rate_limit(UUID, INTEGER) IS 'Check if consumer is within rate limit';
COMMENT ON FUNCTION log_api_request IS 'Log an API request and update consumer stats';

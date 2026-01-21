-- ============================================================================
-- Phase EM-12: Module API Gateway
-- 
-- This migration creates the infrastructure for:
-- 1. API key management for external access
-- 2. Route registration for module endpoints
-- 3. Request logging for debugging and analytics
-- 4. Rate limiting state tracking
--
-- @see phases/enterprise-modules/PHASE-EM-12-MODULE-API-GATEWAY.md
-- ============================================================================

-- ============================================================================
-- CLEANUP: Drop EM-12 tables if they exist (safe for development)
-- ============================================================================

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS module_api_logs CASCADE;
DROP TABLE IF EXISTS module_rate_limits CASCADE;
DROP TABLE IF EXISTS module_api_routes CASCADE;
DROP TABLE IF EXISTS module_api_keys CASCADE;

-- ============================================================================
-- MODULE API KEYS (For external access)
-- ============================================================================

CREATE TABLE module_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  module_id UUID NOT NULL,  -- References module_source or modules_v2
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Key (hashed for storage)
  key_prefix TEXT NOT NULL,  -- First 12 chars for identification (e.g., "dmc_live_abc")
  key_hash TEXT NOT NULL,    -- SHA256 hash of full key
  name TEXT NOT NULL,        -- User-friendly name
  
  -- Permissions
  scopes TEXT[] DEFAULT '{}',  -- e.g., ['read:contacts', 'write:contacts']
  
  -- Rate Limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Restrictions
  allowed_ips TEXT[] DEFAULT '{}',  -- Empty = all allowed
  allowed_origins TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Indexes for API key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON module_api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON module_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_module_site ON module_api_keys(module_id, site_id);

-- ============================================================================
-- MODULE API ROUTES (Registered endpoints)
-- ============================================================================

CREATE TABLE module_api_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  module_id UUID NOT NULL,
  
  -- Route definition
  path TEXT NOT NULL,           -- e.g., "/contacts", "/contacts/:id"
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  
  -- Handler
  handler_type TEXT NOT NULL DEFAULT 'function' CHECK (handler_type IN ('function', 'proxy', 'static')),
  handler_code TEXT,            -- For function type
  handler_url TEXT,             -- For proxy type
  
  -- Configuration
  requires_auth BOOLEAN DEFAULT true,
  required_scopes TEXT[] DEFAULT '{}',
  
  -- Rate limiting (overrides default)
  rate_limit_per_minute INTEGER,
  
  -- Caching
  cache_ttl_seconds INTEGER DEFAULT 0,  -- 0 = no cache
  
  -- Documentation
  summary TEXT,
  description TEXT,
  request_schema JSONB,
  response_schema JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, path, method)
);

-- Indexes for route lookups
CREATE INDEX IF NOT EXISTS idx_api_routes_module ON module_api_routes(module_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_routes_path ON module_api_routes(module_id, path, method);

-- ============================================================================
-- API REQUEST LOGS (For debugging and analytics)
-- ============================================================================

CREATE TABLE module_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request
  module_id UUID NOT NULL,
  site_id UUID,
  route_id UUID REFERENCES module_api_routes(id) ON DELETE SET NULL,
  
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  
  -- Authentication
  auth_type TEXT,  -- 'jwt', 'api_key', 'none'
  api_key_id UUID REFERENCES module_api_keys(id) ON DELETE SET NULL,
  user_id UUID,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for log queries
CREATE INDEX IF NOT EXISTS idx_api_logs_module ON module_api_logs(module_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_date ON module_api_logs(created_at DESC);

-- ============================================================================
-- RATE LIMITING STATE
-- Note: For production, Redis is better, but this works as a starting point
-- ============================================================================

CREATE TABLE module_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifier (API key or user)
  rate_limit_key TEXT NOT NULL,  -- e.g., "apikey:abc123" or "user:uuid:module:uuid"
  
  -- Counts
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_minutes INTEGER DEFAULT 1,
  
  UNIQUE(rate_limit_key, window_minutes)
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON module_rate_limits(rate_limit_key);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE module_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_api_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_rate_limits ENABLE ROW LEVEL SECURITY;

-- API Keys: Users can view/manage keys for agencies they belong to
CREATE POLICY "api_keys_select" ON module_api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.agency_id = module_api_keys.agency_id
      AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "api_keys_insert" ON module_api_keys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.agency_id = module_api_keys.agency_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "api_keys_update" ON module_api_keys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.agency_id = module_api_keys.agency_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- API Routes: Anyone can read active routes, only admins can modify
CREATE POLICY "api_routes_select" ON module_api_routes
  FOR SELECT USING (is_active = true);

-- Allow service role to manage routes (for system use)
-- Note: In production, you may want more granular policies here

-- API Logs: Users can view logs for sites in their agencies
CREATE POLICY "api_logs_select" ON module_api_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE s.id = module_api_logs.site_id
      AND am.user_id = auth.uid()
    )
  );

-- Rate Limits: Generally managed by system, but viewable for debugging
CREATE POLICY "rate_limits_select" ON module_rate_limits
  FOR SELECT USING (true);  -- Public read for transparency

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM module_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Function to clean up old API logs (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM module_api_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Function to get API key stats
CREATE OR REPLACE FUNCTION get_api_key_stats(p_api_key_id UUID)
RETURNS TABLE (
  total_requests BIGINT,
  requests_today BIGINT,
  requests_this_week BIGINT,
  last_used TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')::BIGINT as requests_today,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT as requests_this_week,
    MAX(created_at) as last_used
  FROM module_api_logs
  WHERE api_key_id = p_api_key_id;
END;
$$;

-- Function to check rate limit (atomic operation)
CREATE OR REPLACE FUNCTION check_and_update_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record module_rate_limits%ROWTYPE;
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Try to get existing record
  SELECT * INTO v_record
  FROM module_rate_limits
  WHERE rate_limit_key = p_key
  AND window_minutes = p_window_minutes
  FOR UPDATE;
  
  IF v_record IS NULL OR v_record.window_start < v_window_start THEN
    -- Create new window
    INSERT INTO module_rate_limits (rate_limit_key, request_count, window_start, window_minutes)
    VALUES (p_key, 1, NOW(), p_window_minutes)
    ON CONFLICT (rate_limit_key, window_minutes) 
    DO UPDATE SET request_count = 1, window_start = NOW();
    
    RETURN QUERY SELECT 
      true::BOOLEAN,
      (p_limit - 1)::INTEGER,
      (NOW() + (p_window_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
  ELSE
    IF v_record.request_count >= p_limit THEN
      -- Rate limited
      RETURN QUERY SELECT 
        false::BOOLEAN,
        0::INTEGER,
        (v_record.window_start + (p_window_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
    ELSE
      -- Increment counter
      UPDATE module_rate_limits
      SET request_count = request_count + 1
      WHERE id = v_record.id;
      
      v_current_count := v_record.request_count + 1;
      
      RETURN QUERY SELECT 
        true::BOOLEAN,
        (p_limit - v_current_count)::INTEGER,
        (v_record.window_start + (p_window_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE module_api_keys IS 'Stores API keys for external access to module APIs';
COMMENT ON TABLE module_api_routes IS 'Registered API routes/endpoints for modules';
COMMENT ON TABLE module_api_logs IS 'Request logs for debugging and analytics';
COMMENT ON TABLE module_rate_limits IS 'Rate limiting state (sliding window counters)';

COMMENT ON FUNCTION cleanup_old_rate_limits() IS 'Removes expired rate limit records (run periodically)';
COMMENT ON FUNCTION cleanup_old_api_logs() IS 'Removes API logs older than 30 days';
COMMENT ON FUNCTION get_api_key_stats(UUID) IS 'Returns usage statistics for an API key';
COMMENT ON FUNCTION check_and_update_rate_limit(TEXT, INTEGER, INTEGER) IS 'Atomic rate limit check and update';

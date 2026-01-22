-- migrations/20260122_module_analytics.sql
-- Phase EM-03: Analytics Foundation
-- Created: 2026-01-22

-- ============================================================================
-- MODULE ANALYTICS EVENTS (Time-series event log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What
  module_id UUID NOT NULL,  -- Can reference module_source or modules_v2
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  
  -- Where
  site_id UUID,
  agency_id UUID,
  
  -- Who (anonymous or identified)
  session_id TEXT,
  user_id UUID,
  
  -- Context
  properties JSONB DEFAULT '{}',
  
  -- Device/Browser
  user_agent TEXT,
  ip_hash TEXT,  -- Hashed for privacy
  country TEXT,
  device_type TEXT,  -- 'desktop', 'mobile', 'tablet'
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Partitioning hint (for future optimization)
  event_date DATE GENERATED ALWAYS AS (DATE(created_at AT TIME ZONE 'UTC')) STORED
);

-- Partition by date for performance (optional, can enable later)
-- CREATE INDEX idx_analytics_events_date ON module_analytics_events(event_date);
CREATE INDEX IF NOT EXISTS idx_analytics_events_module ON module_analytics_events(module_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON module_analytics_events(event_type, event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_site ON module_analytics_events(site_id, created_at DESC);

-- ============================================================================
-- MODULE ANALYTICS AGGREGATES (Pre-computed for dashboards)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  module_id UUID NOT NULL,
  site_id UUID,  -- NULL = all sites aggregate
  stat_date DATE NOT NULL,
  
  -- Engagement
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  
  -- Usage
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  
  -- Events
  events_total INTEGER DEFAULT 0,
  events_by_type JSONB DEFAULT '{}',
  
  -- Performance
  avg_load_time_ms INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  crash_count INTEGER DEFAULT 0,
  
  -- Business
  revenue_cents INTEGER DEFAULT 0,
  new_installs INTEGER DEFAULT 0,
  uninstalls INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, site_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_module ON module_analytics_daily(module_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON module_analytics_daily(stat_date DESC);

-- ============================================================================
-- MODULE HEALTH METRICS (Real-time health monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  module_id UUID NOT NULL,
  site_id UUID,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  
  -- Metrics
  response_time_ms INTEGER,
  memory_usage_mb DECIMAL(10, 2),
  cpu_usage_percent DECIMAL(5, 2),
  
  -- Errors
  last_error TEXT,
  error_count_last_hour INTEGER DEFAULT 0,
  
  -- Timestamps
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Only keep latest per module/site
  UNIQUE(module_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_health_checks_module ON module_health_checks(module_id);

-- ============================================================================
-- EVENT TYPES REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  description TEXT,
  
  -- Schema for validation
  properties_schema JSONB DEFAULT '{}',
  
  -- Categorization
  category TEXT DEFAULT 'custom',
  is_system BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_type, event_name)
);

-- Insert standard event types
INSERT INTO analytics_event_types (event_type, event_name, description, category, is_system) VALUES
  -- Lifecycle
  ('lifecycle', 'module_loaded', 'Module finished loading', 'lifecycle', true),
  ('lifecycle', 'module_mounted', 'Module mounted to DOM', 'lifecycle', true),
  ('lifecycle', 'module_unmounted', 'Module removed from DOM', 'lifecycle', true),
  ('lifecycle', 'module_error', 'Module encountered an error', 'lifecycle', true),
  
  -- User
  ('user', 'session_start', 'User started a session', 'user', true),
  ('user', 'session_end', 'User ended a session', 'user', true),
  ('user', 'page_view', 'User viewed a page', 'user', true),
  
  -- Interaction
  ('interaction', 'click', 'User clicked an element', 'interaction', true),
  ('interaction', 'submit', 'User submitted a form', 'interaction', true),
  ('interaction', 'scroll', 'User scrolled', 'interaction', true),
  
  -- Performance
  ('performance', 'load_time', 'Module load time measured', 'performance', true),
  ('performance', 'api_call', 'API call made', 'performance', true),
  ('performance', 'error', 'Error occurred', 'performance', true),
  
  -- Business
  ('business', 'install', 'Module installed', 'business', true),
  ('business', 'uninstall', 'Module uninstalled', 'business', true),
  ('business', 'upgrade', 'Module plan upgraded', 'business', true),
  ('business', 'downgrade', 'Module plan downgraded', 'business', true)
ON CONFLICT (event_type, event_name) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Helper function to get top events
CREATE OR REPLACE FUNCTION get_top_module_events(
  p_module_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
  event_type TEXT,
  event_name TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.event_type,
    e.event_name,
    COUNT(*) as count
  FROM module_analytics_events e
  WHERE e.module_id = p_module_id
    AND e.created_at >= p_start_date
    AND e.created_at <= p_end_date
  GROUP BY e.event_type, e.event_name
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate daily stats
CREATE OR REPLACE FUNCTION aggregate_module_analytics_daily()
RETURNS void AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Aggregate yesterday's events
  INSERT INTO module_analytics_daily (
    module_id, site_id, stat_date,
    views, unique_visitors, sessions, events_total
  )
  SELECT 
    module_id,
    site_id,
    yesterday,
    COUNT(*) FILTER (WHERE event_name = 'page_view') as views,
    COUNT(DISTINCT session_id) as unique_visitors,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'session_start') as sessions,
    COUNT(*) as events_total
  FROM module_analytics_events
  WHERE event_date = yesterday
  GROUP BY module_id, site_id
  ON CONFLICT (module_id, site_id, stat_date)
  DO UPDATE SET
    views = EXCLUDED.views,
    unique_visitors = EXCLUDED.unique_visitors,
    sessions = EXCLUDED.sessions,
    events_total = EXCLUDED.events_total,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE module_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_event_types ENABLE ROW LEVEL SECURITY;

-- Analytics events: Module owners can read their data
CREATE POLICY "Module owners can read analytics"
  ON module_analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_analytics_events.module_id
      AND (ms.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin'
      ))
    )
  );

-- Service role can insert events (tracked server-side with validation)
CREATE POLICY "Service role can insert events"
  ON module_analytics_events FOR INSERT
  WITH CHECK (true);

-- Daily aggregates readable by module owners
CREATE POLICY "Module owners can read daily stats"
  ON module_analytics_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_analytics_daily.module_id
      AND (ms.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin'
      ))
    )
  );

-- Health checks readable by module owners
CREATE POLICY "Module owners can read health checks"
  ON module_health_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_health_checks.module_id
      AND (ms.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'super_admin'
      ))
    )
  );

-- Service role can insert/update health checks
CREATE POLICY "Service role can manage health checks"
  ON module_health_checks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Event types are readable by everyone (public registry)
CREATE POLICY "Event types are public"
  ON analytics_event_types FOR SELECT
  USING (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON module_analytics_events TO authenticated;
GRANT SELECT ON module_analytics_daily TO authenticated;
GRANT SELECT ON module_health_checks TO authenticated;
GRANT SELECT ON analytics_event_types TO authenticated;

-- Service role needs full access for tracking
GRANT ALL ON module_analytics_events TO service_role;
GRANT ALL ON module_analytics_daily TO service_role;
GRANT ALL ON module_health_checks TO service_role;
GRANT ALL ON analytics_event_types TO service_role;

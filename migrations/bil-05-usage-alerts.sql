-- =============================================================================
-- BIL-05: Usage Alerts Table + Storage Helper RPCs
-- Phase BIL-05: Usage Metering & Enforcement
--
-- Creates:
-- 1. usage_alerts table — tracks which threshold alerts have been sent
-- 2. increment_file_storage RPC — atomic file storage increment
-- 3. decrement_file_storage RPC — atomic file storage decrement
-- 4. increment_agency_email_sends RPC — atomic email counter increment
-- =============================================================================

-- ============================================================================
-- 1. Usage Alerts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,  -- 'ai_actions', 'email_sends', 'automation_runs', 'file_storage'
  threshold INTEGER NOT NULL,  -- 80, 95, or 100
  period_start TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  UNIQUE(agency_id, metric, threshold, period_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_alerts_agency_period
  ON usage_alerts(agency_id, period_start DESC);

-- RLS
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members view own alerts" ON usage_alerts
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access on usage_alerts" ON usage_alerts
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. File Storage Increment RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_file_storage(
  p_agency_id UUID,
  p_bytes BIGINT
)
RETURNS VOID AS $$
BEGIN
  UPDATE agencies
  SET file_storage_used_bytes = COALESCE(file_storage_used_bytes, 0) + p_bytes
  WHERE id = p_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. File Storage Decrement RPC (never goes below 0)
-- ============================================================================

CREATE OR REPLACE FUNCTION decrement_file_storage(
  p_agency_id UUID,
  p_bytes BIGINT
)
RETURNS VOID AS $$
BEGIN
  UPDATE agencies
  SET file_storage_used_bytes = GREATEST(0, COALESCE(file_storage_used_bytes, 0) - p_bytes)
  WHERE id = p_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Email Sends Period Counter Increment RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_agency_email_sends(
  p_agency_id UUID,
  p_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE agencies
  SET email_sends_current_period = COALESCE(email_sends_current_period, 0) + p_count
  WHERE id = p_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

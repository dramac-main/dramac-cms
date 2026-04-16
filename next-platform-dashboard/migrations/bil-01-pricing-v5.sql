-- ============================================================================
-- BIL-01: Pricing V5 Migration
-- 
-- Adds new billing columns to agencies table for the 3-tier v5 pricing model.
-- Creates subscription_events audit table for tracking plan changes.
--
-- Run with: mcp_supabase_apply_migration or Supabase dashboard
-- ============================================================================

-- Add new billing columns to agencies
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS subscription_plan_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_sends_current_period INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_storage_used_bytes BIGINT DEFAULT 0;

-- Subscription events audit table
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'paused', 'resumed', 'trial_started', 'trial_expired', 'trial_converted', 'payment_failed', 'payment_recovered'
  from_plan TEXT,
  to_plan TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscription_events_agency
  ON subscription_events(agency_id, created_at DESC);

-- RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Agency members can view their own subscription events
CREATE POLICY "Agency members view own events" ON subscription_events
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())
  );

-- Service role has full access (for webhooks, server actions)
CREATE POLICY "Service role full access" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');

-- Add email sends column to paddle_subscriptions if it doesn't exist
ALTER TABLE paddle_subscriptions
  ADD COLUMN IF NOT EXISTS included_email_sends INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_sends_current_period INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_storage_used_bytes BIGINT DEFAULT 0;

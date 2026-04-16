-- ============================================================================
-- BIL-08: Overage Charges Table
-- Phase: Overage Billing Engine
-- ============================================================================

-- Stores periodic overage charge snapshots for billing
CREATE TABLE IF NOT EXISTS overage_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  ai_actions_overage INTEGER DEFAULT 0,
  ai_actions_cost_cents INTEGER DEFAULT 0,
  email_sends_overage INTEGER DEFAULT 0,
  email_sends_cost_cents INTEGER DEFAULT 0,
  automation_runs_overage INTEGER DEFAULT 0,
  automation_runs_cost_cents INTEGER DEFAULT 0,
  file_storage_overage_mb INTEGER DEFAULT 0,
  file_storage_cost_cents INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  reported_to_paddle BOOLEAN DEFAULT FALSE,
  paddle_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, period_start)
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_overage_charges_agency
  ON overage_charges(agency_id);
CREATE INDEX IF NOT EXISTS idx_overage_charges_period
  ON overage_charges(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_overage_charges_unreported
  ON overage_charges(reported_to_paddle) WHERE reported_to_paddle = FALSE;

-- RLS
ALTER TABLE overage_charges ENABLE ROW LEVEL SECURITY;

-- Agency owners can view their own overage charges
CREATE POLICY "Agency owners view overage charges"
  ON overage_charges
  FOR SELECT
  USING (
    agency_id IN (
      SELECT am.agency_id FROM agency_members am
      WHERE am.user_id = auth.uid() AND am.role = 'owner'
    )
  );

-- Super admins can view all overage charges
CREATE POLICY "Super admins view all overage charges"
  ON overage_charges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.user_id = auth.uid() AND am.role = 'super_admin'
    )
  );

-- Service role has full access (for cron jobs and webhook handlers)
-- Note: Service role bypasses RLS by default

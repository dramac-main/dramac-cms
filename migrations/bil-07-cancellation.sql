-- ============================================================================
-- BIL-07: Cancellation Feedback Table
-- Phase: Payment Methods & Cancellation
-- ============================================================================

-- Stores structured cancellation feedback for churn analysis
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  monthly_spend_cents INTEGER,
  months_subscribed INTEGER,
  offered_downgrade BOOLEAN DEFAULT FALSE,
  accepted_downgrade BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for churn analysis queries
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_agency
  ON cancellation_feedback(agency_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_created
  ON cancellation_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason
  ON cancellation_feedback(reason);

-- RLS
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Agency owners can insert their own feedback
CREATE POLICY "Agency owners insert cancellation feedback"
  ON cancellation_feedback
  FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT am.agency_id FROM agency_members am
      WHERE am.user_id = auth.uid() AND am.role = 'owner'
    )
  );

-- Agency owners can view their own feedback
CREATE POLICY "Agency owners view cancellation feedback"
  ON cancellation_feedback
  FOR SELECT
  USING (
    agency_id IN (
      SELECT am.agency_id FROM agency_members am
      WHERE am.user_id = auth.uid() AND am.role = 'owner'
    )
  );

-- Super admins can view all feedback (for churn analysis dashboard)
CREATE POLICY "Super admins view all cancellation feedback"
  ON cancellation_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.user_id = auth.uid() AND am.role = 'super_admin'
    )
  );

-- Service role has full access (for webhook handlers)
-- Note: Service role bypasses RLS by default

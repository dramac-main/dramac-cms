-- =====================================================================
-- Portal Onboarding State (Section 9)
--
-- Tracks per-user progress through the portal "first run" checklist so
-- it can be dismissed/persisted across sessions. One row per portal user.
-- =====================================================================

CREATE TABLE IF NOT EXISTS portal_onboarding_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  app_installed BOOLEAN NOT NULL DEFAULT FALSE,
  team_invited BOOLEAN NOT NULL DEFAULT FALSE,
  first_order_seen BOOLEAN NOT NULL DEFAULT FALSE,
  payments_setup BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER update_portal_onboarding_state_updated_at
  BEFORE UPDATE ON portal_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE portal_onboarding_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_self_read" ON portal_onboarding_state;
CREATE POLICY "onboarding_self_read" ON portal_onboarding_state
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "onboarding_self_upsert" ON portal_onboarding_state;
CREATE POLICY "onboarding_self_upsert" ON portal_onboarding_state
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "onboarding_self_update" ON portal_onboarding_state;
CREATE POLICY "onboarding_self_update" ON portal_onboarding_state
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

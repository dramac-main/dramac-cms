-- Portal Test Email History (Section 5 of CLIENT-PORTAL-PERFECTION-PROMPT)
--
-- Lets a portal user fire a "send test email" from the notification
-- preferences page and see the most recent attempts. The row is owned
-- by the auth user and scoped to an agency for cross-cutting analytics.

CREATE TABLE IF NOT EXISTS public.portal_test_email_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id    uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  site_id      uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  email_type   text NOT NULL,
  recipient    text NOT NULL,
  success      boolean NOT NULL DEFAULT false,
  error        text,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_test_email_history_user_sent
  ON public.portal_test_email_history (user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_portal_test_email_history_agency_sent
  ON public.portal_test_email_history (agency_id, sent_at DESC);

ALTER TABLE public.portal_test_email_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS test_email_history_owner_read
  ON public.portal_test_email_history;

CREATE POLICY test_email_history_owner_read
  ON public.portal_test_email_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Writes are performed via the service role from server actions; no
-- INSERT policy is required for end-users.
COMMENT ON TABLE public.portal_test_email_history IS
  'Section 5: history of "send test email" attempts triggered from the portal.';

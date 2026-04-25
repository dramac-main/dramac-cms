-- Section 7 — Impersonation write audit.
--
-- When an agency admin impersonates a portal user via cookie
-- `impersonating_client_id`, every WRITE performed during that session
-- MUST be recorded here so the agency can prove (or refute) that an
-- action attributed to the customer was actually performed by staff.
--
-- This is an append-only ledger: rows are inserted by server actions
-- that pass through `logImpersonationWrite()`. The SELECT side is
-- restricted to agency owners (impersonator) — they can audit their
-- own staff's behavior. Impersonated users (customers) cannot read
-- this table at all.

CREATE TABLE IF NOT EXISTS public.impersonation_actions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  impersonator_user_id    uuid NOT NULL,
  impersonated_user_id    uuid,
  impersonated_client_id  uuid,
  agency_id               uuid,
  site_id                 uuid,
  action_type             text NOT NULL,
  resource_type           text,
  resource_id             text,
  http_method             text,
  request_path            text,
  metadata                jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_imp_actions_impersonator_time
  ON public.impersonation_actions (impersonator_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_imp_actions_impersonated_time
  ON public.impersonation_actions (impersonated_user_id, created_at DESC)
  WHERE impersonated_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_imp_actions_agency_time
  ON public.impersonation_actions (agency_id, created_at DESC)
  WHERE agency_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_imp_actions_site_time
  ON public.impersonation_actions (site_id, created_at DESC)
  WHERE site_id IS NOT NULL;

ALTER TABLE public.impersonation_actions ENABLE ROW LEVEL SECURITY;

-- Impersonators (the actual signed-in admin) can read their own audit trail.
DROP POLICY IF EXISTS imp_actions_self_read ON public.impersonation_actions;
CREATE POLICY imp_actions_self_read ON public.impersonation_actions
  FOR SELECT TO authenticated
  USING (impersonator_user_id = auth.uid());

-- Writes happen through the service role only.
DROP POLICY IF EXISTS imp_actions_no_client_write ON public.impersonation_actions;
CREATE POLICY imp_actions_no_client_write ON public.impersonation_actions
  FOR INSERT TO authenticated
  WITH CHECK (false);

COMMENT ON TABLE public.impersonation_actions IS
  'Section 7: append-only audit log of every write performed during an active impersonation session.';

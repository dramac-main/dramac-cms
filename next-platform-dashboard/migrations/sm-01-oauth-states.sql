-- =============================================================================
-- PHASE-SM-01: OAuth States Table
-- Stores temporary CSRF state tokens for social OAuth flows.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.social_oauth_states (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state       text NOT NULL UNIQUE,
  platform    text NOT NULL,
  site_id     uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL,
  user_id     uuid NOT NULL,
  code_verifier text,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Auto-cleanup: delete expired states
CREATE INDEX IF NOT EXISTS idx_social_oauth_states_expires
  ON public.social_oauth_states (expires_at);

-- RLS
ALTER TABLE public.social_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.social_oauth_states
  FOR ALL USING (true) WITH CHECK (true);

-- Periodic cleanup function (call from cron or trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.social_oauth_states WHERE expires_at < now();
$$;

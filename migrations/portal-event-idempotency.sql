-- Section 6 — Event-level idempotency for portal notifications.
--
-- A given business event (resource_type + resource_id + event_type +
-- state_hash) must dispatch AT MOST ONCE across the entire platform. This
-- table is the single source of truth for that decision: the dispatcher
-- INSERTs (claims) the event before fanning out, and a duplicate INSERT
-- short-circuits early.
--
-- The (recipient × channel) dedupe inside the dispatcher remains; this
-- table sits ABOVE that, preventing the recipient walk altogether when
-- the same event has already been claimed.

CREATE TABLE IF NOT EXISTS public.automation_event_dispatches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key       text NOT NULL UNIQUE,
  event_type      text NOT NULL,
  resource_type   text NOT NULL,
  resource_id     text NOT NULL,
  state_hash      text,
  agency_id       uuid,
  site_id         uuid,
  dispatched_at   timestamptz NOT NULL DEFAULT now(),
  result          jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_automation_event_dispatches_resource
  ON public.automation_event_dispatches (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_automation_event_dispatches_event_time
  ON public.automation_event_dispatches (event_type, dispatched_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_event_dispatches_site_time
  ON public.automation_event_dispatches (site_id, dispatched_at DESC);

-- Service-role only writes; no end-user access.
ALTER TABLE public.automation_event_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aed_no_anon ON public.automation_event_dispatches;
CREATE POLICY aed_no_anon ON public.automation_event_dispatches
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

COMMENT ON TABLE public.automation_event_dispatches IS
  'Section 6: global idempotency claim table for business event dispatches.';
COMMENT ON COLUMN public.automation_event_dispatches.event_key IS
  'sha256(resource_type|resource_id|event_type|state_hash) — globally unique claim.';

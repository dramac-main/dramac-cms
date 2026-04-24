-- ============================================================================
-- PORTAL 02 — COMMUNICATION FOUNDATIONS (Session 2A)
-- ============================================================================
-- Foundations for the Client Portal Overhaul Session 2 "Communication".
-- Fully additive — no existing rows mutated, no existing columns dropped.
--
-- Scope:
--   1. Extend `notifications` with tenant scoping + dedupe primitives so
--      portal users become first-class recipients alongside agency owners.
--   2. `portal_notification_preferences` — per user × event × site × channel
--      opt-in / opt-out registry.
--   3. `portal_send_log` — structured observability for every dispatch across
--      in-app / email / push / AI / workflow / sms / whatsapp channels.
--   4. `email_logs` — finally materialised (code already attempted to write
--      to this table but it never existed, so writes were silently dropped).
--   5. `portal_event_log` — portal-originated action events for downstream
--      automation hooks.
--
-- No PII, no note content, no AI bodies stored in these telemetry tables.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. notifications — tenant scoping + dedupe
-- ----------------------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS agency_id UUID,
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS site_id UUID,
  ADD COLUMN IF NOT EXISTS recipient_class TEXT,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

-- FKs added guarded (schemas may not have the ref tables in all environments).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='agencies')
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notifications_agency_id_fkey'
     )
  THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_agency_id_fkey
      FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notifications_client_id_fkey'
     )
  THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sites')
     AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notifications_site_id_fkey'
     )
  THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_site_id_fkey
      FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE SET NULL;
  END IF;
END$$;

-- recipient_class enum-esque constraint (permissive; we keep it text so
-- adding new recipient classes later is a code-only change).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'notifications_recipient_class_chk'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_recipient_class_chk
      CHECK (
        recipient_class IS NULL OR recipient_class IN (
          'agency_owner','portal_user','agent','customer','system'
        )
      );
  END IF;
END$$;

-- Dedupe: one notification per (event_type, resource, recipient user) when
-- dedupe_key is set by the dispatcher. NULL dedupe_key disables dedupe for
-- that row (ad-hoc / legacy callers).
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_key_unique
  ON public.notifications (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_user_read_created_idx
  ON public.notifications (user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_client_created_idx
  ON public.notifications (client_id, created_at DESC)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_site_created_idx
  ON public.notifications (site_id, created_at DESC)
  WHERE site_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_agency_created_idx
  ON public.notifications (agency_id, created_at DESC)
  WHERE agency_id IS NOT NULL;

-- Backfill recipient_class for existing rows (all prior dispatches were
-- agency-owner-scoped).
UPDATE public.notifications
   SET recipient_class = 'agency_owner'
 WHERE recipient_class IS NULL;

-- ----------------------------------------------------------------------------
-- 2. portal_notification_preferences — per user × event × site × channel
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portal_notification_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  -- NULL site_id = global default for this user × event.
  site_id     UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  in_app      BOOLEAN NOT NULL DEFAULT true,
  email       BOOLEAN NOT NULL DEFAULT true,
  push        BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uniqueness treating NULL site as a sentinel.
CREATE UNIQUE INDEX IF NOT EXISTS portal_notification_preferences_unique
  ON public.portal_notification_preferences (
    user_id,
    event_type,
    COALESCE(site_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS portal_notification_preferences_user_idx
  ON public.portal_notification_preferences (user_id);

ALTER TABLE public.portal_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_notification_preferences_self
  ON public.portal_notification_preferences;
CREATE POLICY portal_notification_preferences_self
  ON public.portal_notification_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. portal_send_log — structured observability for every dispatch
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portal_send_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type           TEXT NOT NULL,
  recipient_class      TEXT NOT NULL,
  user_id              UUID,
  client_id            UUID,
  site_id              UUID,
  agency_id            UUID,
  channel              TEXT NOT NULL,
  delivery_state       TEXT NOT NULL,
  provider             TEXT,
  provider_message_id  TEXT,
  attempt              SMALLINT NOT NULL DEFAULT 1,
  latency_ms           INTEGER,
  error_code           TEXT,
  error_message        TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- permissive enums (kept text; constraint for early misuse signal only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'portal_send_log_channel_chk'
  ) THEN
    ALTER TABLE public.portal_send_log
      ADD CONSTRAINT portal_send_log_channel_chk
      CHECK (channel IN ('in_app','email','push','ai','workflow','sms','whatsapp'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'portal_send_log_state_chk'
  ) THEN
    ALTER TABLE public.portal_send_log
      ADD CONSTRAINT portal_send_log_state_chk
      CHECK (delivery_state IN (
        'queued','sent','delivered','bounced','complained',
        'failed','dropped','skipped_preference','deduped','retried'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'portal_send_log_recipient_chk'
  ) THEN
    ALTER TABLE public.portal_send_log
      ADD CONSTRAINT portal_send_log_recipient_chk
      CHECK (recipient_class IN ('agency_owner','portal_user','agent','customer','system'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS portal_send_log_site_created_idx
  ON public.portal_send_log (site_id, created_at DESC)
  WHERE site_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_send_log_user_created_idx
  ON public.portal_send_log (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_send_log_agency_created_idx
  ON public.portal_send_log (agency_id, created_at DESC)
  WHERE agency_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_send_log_provider_msg_idx
  ON public.portal_send_log (provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_send_log_event_created_idx
  ON public.portal_send_log (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_send_log_state_created_idx
  ON public.portal_send_log (delivery_state, created_at DESC);

ALTER TABLE public.portal_send_log ENABLE ROW LEVEL SECURITY;
-- No policies: service role only. DAL surfaces reads with tenant filters.

-- ----------------------------------------------------------------------------
-- 4. email_logs — finally created (code already wrote here; writes were dropped)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  to_email            TEXT NOT NULL,
  from_email          TEXT,
  subject             TEXT,
  email_type          TEXT,
  agency_id           UUID,
  site_id             UUID,
  recipient_user_id   UUID,
  resend_message_id   TEXT,
  status              TEXT NOT NULL DEFAULT 'sent',
  error_message       TEXT,
  attempt             SMALLINT NOT NULL DEFAULT 1,
  last_event_at       TIMESTAMPTZ,
  send_log_id         UUID REFERENCES public.portal_send_log(id) ON DELETE SET NULL,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'email_logs_status_chk'
  ) THEN
    ALTER TABLE public.email_logs
      ADD CONSTRAINT email_logs_status_chk
      CHECK (status IN (
        'queued','sent','delivered','bounced','complained',
        'opened','clicked','failed','dropped','skipped'
      ));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS email_logs_resend_msg_idx
  ON public.email_logs (resend_message_id)
  WHERE resend_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_logs_recipient_created_idx
  ON public.email_logs (recipient_user_id, created_at DESC)
  WHERE recipient_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_logs_status_created_idx
  ON public.email_logs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS email_logs_site_created_idx
  ON public.email_logs (site_id, created_at DESC)
  WHERE site_id IS NOT NULL;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
-- service role only

-- ----------------------------------------------------------------------------
-- 5. portal_event_log — portal action event emission
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portal_event_log (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type                TEXT NOT NULL,
  actor_user_id             UUID,
  actor_is_impersonation    BOOLEAN NOT NULL DEFAULT false,
  actor_impersonator_email  TEXT,
  agency_id                 UUID,
  client_id                 UUID,
  site_id                   UUID,
  resource_type             TEXT,
  resource_id               TEXT,
  payload                   JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS portal_event_log_site_created_idx
  ON public.portal_event_log (site_id, created_at DESC)
  WHERE site_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS portal_event_log_event_created_idx
  ON public.portal_event_log (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS portal_event_log_client_created_idx
  ON public.portal_event_log (client_id, created_at DESC)
  WHERE client_id IS NOT NULL;

ALTER TABLE public.portal_event_log ENABLE ROW LEVEL SECURITY;
-- service role only

-- ----------------------------------------------------------------------------
-- 6. updated_at triggers (best-effort — idempotent)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.portal_02_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_portal_send_log_touch ON public.portal_send_log;
CREATE TRIGGER trg_portal_send_log_touch
  BEFORE UPDATE ON public.portal_send_log
  FOR EACH ROW EXECUTE FUNCTION public.portal_02_touch_updated_at();

DROP TRIGGER IF EXISTS trg_email_logs_touch ON public.email_logs;
CREATE TRIGGER trg_email_logs_touch
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.portal_02_touch_updated_at();

DROP TRIGGER IF EXISTS trg_portal_notif_prefs_touch ON public.portal_notification_preferences;
CREATE TRIGGER trg_portal_notif_prefs_touch
  BEFORE UPDATE ON public.portal_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.portal_02_touch_updated_at();

-- ============================================================================
-- DONE — portal-02-communication.sql
-- ============================================================================

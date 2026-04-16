-- ============================================================================
-- BIL-03: Trial Tracking Table
-- Phase BIL-03: Subscription Checkout & Trial Management
--
-- Tracks 14-day free trials for the Growth plan.
-- One active trial per agency (enforced by unique constraint on agency_id 
-- where status = 'active').
-- ============================================================================

-- Create trial_tracking table
CREATE TABLE IF NOT EXISTS public.trial_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'growth',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted', 'canceled')),
  conversion_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: only one active trial per agency
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_tracking_active_agency
  ON public.trial_tracking (agency_id, status) WHERE status = 'active';

-- Index for expiry cron job
CREATE INDEX IF NOT EXISTS idx_trial_tracking_expires
  ON public.trial_tracking (expires_at) WHERE status = 'active';

-- Index for agency lookups
CREATE INDEX IF NOT EXISTS idx_trial_tracking_agency
  ON public.trial_tracking (agency_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.trial_tracking ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for webhooks and server actions)
CREATE POLICY "service_role_full_access" ON public.trial_tracking
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow agency owners to read their own trials
CREATE POLICY "agency_owner_read" ON public.trial_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = trial_tracking.agency_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- Add subscription_events logging for trial events
-- (Only if subscription_events table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_events') THEN
    -- Table already exists, no action needed
    RAISE NOTICE 'subscription_events table already exists';
  ELSE
    CREATE TABLE public.subscription_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_subscription_events_agency ON public.subscription_events (agency_id);
    CREATE INDEX idx_subscription_events_type ON public.subscription_events (event_type);

    ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "service_role_full_access_events" ON public.subscription_events
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "agency_owner_read_events" ON public.subscription_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.agency_members am
          WHERE am.agency_id = subscription_events.agency_id
            AND am.user_id = auth.uid()
            AND am.role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;

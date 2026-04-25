-- Adds `skipped_no_subscription` to the portal_send_log.delivery_state CHECK
-- so that push attempts to recipients who have not enabled web-push are
-- recorded as "skipped" instead of polluting the log with phantom "failed"
-- rows. Backfills existing failed push rows that match this pattern.

BEGIN;

ALTER TABLE public.portal_send_log
  DROP CONSTRAINT IF EXISTS portal_send_log_state_chk;

ALTER TABLE public.portal_send_log
  ADD CONSTRAINT portal_send_log_state_chk CHECK (
    delivery_state = ANY (ARRAY[
      'queued'::text,
      'sent'::text,
      'delivered'::text,
      'bounced'::text,
      'complained'::text,
      'failed'::text,
      'dropped'::text,
      'skipped_preference'::text,
      'skipped_no_subscription'::text,
      'deduped'::text,
      'retried'::text
    ])
  );

-- Backfill: prior to this migration, every push fan-out to a user without
-- a registered subscription was logged as "failed". Re-classify those rows.
UPDATE public.portal_send_log
SET delivery_state = 'skipped_no_subscription',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('reason', 'no_subscription_backfilled')
WHERE channel = 'push'
  AND delivery_state = 'failed'
  AND (error_message IS NULL OR error_message = '')
  AND (provider IS NULL OR provider IN ('web_push', 'web-push'));

COMMIT;

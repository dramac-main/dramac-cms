-- portal-02b: Extend `notifications` with archive + resource linkage.
--
-- The portal needs to show/hide archived items and link to the underlying
-- resource (order / quote / appointment / product). The base migration
-- (portal-02-communication.sql) only added tenancy + dedupe columns; this
-- follow-up adds the UI-facing bits.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS resource_id TEXT;

-- Back-fill is_read from the legacy `read` column so new code can rely on it.
UPDATE public.notifications
   SET is_read = COALESCE(is_read, read, FALSE)
 WHERE is_read IS NULL;

-- Ensure future inserts that set only one of the two stay in sync. A trigger
-- keeps `read` and `is_read` mirrored until the legacy column is removed.
CREATE OR REPLACE FUNCTION public.notifications_sync_read_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.is_read IS DISTINCT FROM OLD.is_read OR TG_OP = 'INSERT' THEN
      NEW.read := COALESCE(NEW.is_read, NEW.read, FALSE);
    ELSIF NEW.read IS DISTINCT FROM OLD.read THEN
      NEW.is_read := COALESCE(NEW.read, NEW.is_read, FALSE);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_sync_read ON public.notifications;
CREATE TRIGGER trg_notifications_sync_read
  BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_sync_read_flags();

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE is_archived = FALSE AND is_read = FALSE;

CREATE INDEX IF NOT EXISTS notifications_resource_idx
  ON public.notifications (resource_type, resource_id)
  WHERE resource_type IS NOT NULL;

-- ============================================================================
-- Migration: Create admin_settings table
-- Date: 2026-02-10
-- Description: Key-value store for platform-wide admin settings (general,
--              email, notifications, security, etc.)
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key         text NOT NULL UNIQUE,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings (key);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only service_role (admin client) can read/write admin settings
CREATE POLICY "Service role full access on admin_settings"
  ON public.admin_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Optional: allow authenticated super-admins to read (if you prefer RLS-based reads)
-- CREATE POLICY "Super admins can read admin_settings"
--   ON public.admin_settings
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.role = 'super_admin'
--     )
--   );

-- Grant table access to the authenticated and service roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO service_role;
GRANT SELECT ON public.admin_settings TO authenticated;

COMMENT ON TABLE public.admin_settings IS 'Platform-wide admin settings (key-value store with JSONB values)';
COMMENT ON COLUMN public.admin_settings.key IS 'Setting section key, e.g. general, email, notifications, security';
COMMENT ON COLUMN public.admin_settings.value IS 'JSONB blob containing all settings for this section';

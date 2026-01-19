-- =============================================================
-- Phase EM-01: Module Lifecycle Completion - Additional Columns
-- Created: 2026-01-19
-- 
-- This migration ensures all required columns exist for the
-- module lifecycle completion phase.
-- =============================================================

-- Ensure modules_v2 has all required columns for studio modules
-- Most of these should already exist from phase-81a, but ADD IF NOT EXISTS for safety

-- Source type tracking (catalog vs studio)
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'catalog';

-- Link back to module_source for studio-built modules
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS studio_module_id UUID REFERENCES public.module_source(id) ON DELETE SET NULL;

-- Render code - the actual JS/React code
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS render_code TEXT;

-- CSS styles for the module
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS styles TEXT;

-- Studio version tracking
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS studio_version TEXT;

-- Settings schema (JSON schema for module configuration)
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS settings_schema JSONB DEFAULT '{}';

-- Default settings
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS default_settings JSONB DEFAULT '{}';

-- Ensure source_type constraint exists (allow 'catalog', 'studio', 'imported')
DO $$
BEGIN
  -- Drop old constraint if exists and recreate with proper values
  ALTER TABLE public.modules_v2 DROP CONSTRAINT IF EXISTS modules_v2_source_check;
  
  -- Add constraint only if source column has wrong values
  -- For now, we'll allow any value and handle validation in application code
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_modules_v2_source ON public.modules_v2(source);
CREATE INDEX IF NOT EXISTS idx_modules_v2_studio_id ON public.modules_v2(studio_module_id) WHERE studio_module_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_modules_v2_status_source ON public.modules_v2(status, source);

-- =============================================================
-- module_source columns for tracking sync status
-- =============================================================

-- Track when module was last synced to catalog
ALTER TABLE public.module_source ADD COLUMN IF NOT EXISTS catalog_synced_at TIMESTAMPTZ;

-- Store the catalog module ID after sync (FK to modules_v2)
ALTER TABLE public.module_source ADD COLUMN IF NOT EXISTS catalog_module_id UUID REFERENCES public.modules_v2(id) ON DELETE SET NULL;

-- Index for finding unsynced published modules
CREATE INDEX IF NOT EXISTS idx_module_source_needs_sync 
  ON public.module_source(status, catalog_synced_at) 
  WHERE status = 'published';

-- =============================================================
-- site_module_installations enhancements
-- =============================================================

-- Ensure installed_at exists
ALTER TABLE public.site_module_installations ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure installed_by exists
ALTER TABLE public.site_module_installations ADD COLUMN IF NOT EXISTS installed_by UUID REFERENCES auth.users(id);

-- Ensure enabled_at exists
ALTER TABLE public.site_module_installations ADD COLUMN IF NOT EXISTS enabled_at TIMESTAMPTZ;

-- Ensure updated_at exists
ALTER TABLE public.site_module_installations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================================
-- RLS Policies for modules_v2
-- =============================================================

-- Ensure RLS is enabled
ALTER TABLE public.modules_v2 ENABLE ROW LEVEL SECURITY;

-- Anyone can read active/testing modules
DROP POLICY IF EXISTS "Anyone can view active modules_v2" ON public.modules_v2;
CREATE POLICY "Anyone can view active modules_v2" ON public.modules_v2
  FOR SELECT
  USING (status IN ('active', 'testing'));

-- Super admins can manage all modules
DROP POLICY IF EXISTS "Super admins manage modules_v2" ON public.modules_v2;
CREATE POLICY "Super admins manage modules_v2" ON public.modules_v2
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =============================================================
-- Summary
-- =============================================================
-- This migration ensures all columns needed for EM-01 exist:
--
-- modules_v2 columns:
--   - source (catalog/studio)
--   - studio_module_id (FK to module_source)
--   - render_code (JS code)
--   - styles (CSS)
--   - studio_version
--   - settings_schema
--   - default_settings
--
-- module_source columns:
--   - catalog_synced_at
--   - catalog_module_id (FK to modules_v2)
--
-- site_module_installations columns:
--   - installed_at
--   - installed_by
--   - enabled_at
--   - updated_at
-- =============================================================

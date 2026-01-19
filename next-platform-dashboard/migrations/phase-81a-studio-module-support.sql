-- =============================================================
-- Phase 81A: Studio Module Support for modules_v2
-- Created: 2026-01-19
-- 
-- This migration adds columns to support Studio-built modules
-- in the modules_v2 catalog table, enabling sync from module_source.
-- =============================================================

-- Add source tracking column
-- source: 'catalog' (static/predefined) or 'studio' (built in module studio)
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'catalog';

-- Link back to module_source for studio-built modules
-- This allows us to reference the original source code and track origin
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS studio_module_id UUID REFERENCES public.module_source(id) ON DELETE SET NULL;

-- Cache render code for performance (avoid join on every render)
-- This is the actual React/JS code that runs the module
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS render_code TEXT;

-- Cache CSS styles for the module
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS styles TEXT;

-- Module version from studio (may differ from current_version during updates)
ALTER TABLE public.modules_v2 ADD COLUMN IF NOT EXISTS studio_version TEXT;

-- Index for filtering by source type
CREATE INDEX IF NOT EXISTS idx_modules_v2_source ON public.modules_v2(source);

-- Index for looking up studio modules by their source ID
CREATE INDEX IF NOT EXISTS idx_modules_v2_studio_id ON public.modules_v2(studio_module_id) WHERE studio_module_id IS NOT NULL;

-- Add constraint to ensure studio modules have required fields
-- This is a soft constraint via application logic rather than DB constraint
-- to allow gradual migration

-- Create function to validate studio module data
CREATE OR REPLACE FUNCTION validate_studio_module()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a studio module, ensure render_code is present
  IF NEW.source = 'studio' AND (NEW.render_code IS NULL OR NEW.render_code = '') THEN
    RAISE WARNING 'Studio module % should have render_code', NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation (warning only, not blocking)
DROP TRIGGER IF EXISTS trigger_validate_studio_module ON public.modules_v2;
CREATE TRIGGER trigger_validate_studio_module
  BEFORE INSERT OR UPDATE ON public.modules_v2
  FOR EACH ROW
  EXECUTE FUNCTION validate_studio_module();

-- Grant necessary permissions
GRANT SELECT ON public.modules_v2 TO authenticated;
GRANT SELECT ON public.modules_v2 TO anon;

-- RLS Policy: Anyone can read active modules
DROP POLICY IF EXISTS "Anyone can view active modules_v2" ON public.modules_v2;
CREATE POLICY "Anyone can view active modules_v2" ON public.modules_v2
  FOR SELECT
  USING (status = 'active' OR status = 'draft');

-- RLS Policy: Super admins can manage all modules
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

-- Enable RLS if not already enabled
ALTER TABLE public.modules_v2 ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Update module_source table to track sync status
-- =============================================================

-- Add column to track when module was last synced to catalog
ALTER TABLE public.module_source ADD COLUMN IF NOT EXISTS catalog_synced_at TIMESTAMPTZ;

-- Add column to store the catalog module ID after sync
ALTER TABLE public.module_source ADD COLUMN IF NOT EXISTS catalog_module_id UUID REFERENCES public.modules_v2(id) ON DELETE SET NULL;

-- Index for finding unsynced published modules
CREATE INDEX IF NOT EXISTS idx_module_source_needs_sync 
  ON public.module_source(status, catalog_synced_at) 
  WHERE status = 'published';

-- =============================================================
-- Summary
-- =============================================================
-- Added to modules_v2:
--   - source TEXT ('catalog' | 'studio')
--   - studio_module_id UUID (FK to module_source)
--   - render_code TEXT (cached module code)
--   - styles TEXT (cached CSS)
--   - studio_version TEXT
--   - Indexes for efficient lookups
--
-- Added to module_source:
--   - catalog_synced_at TIMESTAMPTZ
--   - catalog_module_id UUID (FK to modules_v2)
-- =============================================================

-- Phase 81: Fix assets table - make site_id optional for agency-level media
-- Run this in Supabase SQL Editor

-- ============================================
-- MAKE site_id NULLABLE FOR AGENCY-LEVEL MEDIA
-- ============================================

-- Assets should be uploadable at the agency level without requiring a site
-- This allows for a shared media library across all sites in an agency

ALTER TABLE public.assets 
ALTER COLUMN site_id DROP NOT NULL;

-- ============================================
-- ENSURE ALL REQUIRED COLUMNS EXIST
-- ============================================

-- These should already exist from phase-81-media-library.sql but adding IF NOT EXISTS to be safe
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS optimized_url TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'other';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS original_name TEXT;

-- ============================================
-- UPDATE RLS POLICIES (if needed)
-- ============================================

-- Drop existing policy if it exists (ignore error if not exists)
DROP POLICY IF EXISTS "Users can view agency assets" ON public.assets;
DROP POLICY IF EXISTS "Users can insert agency assets" ON public.assets;
DROP POLICY IF EXISTS "Users can update agency assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete agency assets" ON public.assets;

-- Create new policies that work with nullable site_id
CREATE POLICY "Users can view agency assets"
ON public.assets
FOR SELECT
TO authenticated
USING (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert agency assets"
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update agency assets"
ON public.assets
FOR UPDATE
TO authenticated
USING (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete agency assets"
ON public.assets
FOR DELETE
TO authenticated
USING (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify site_id is now nullable:
-- SELECT column_name, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'assets' AND column_name = 'site_id';

-- Should return: site_id | YES

-- Phase 81: Media Library System
-- Migration file for media library tables and assets enhancements

-- ============================================
-- MEDIA FOLDERS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS public.media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, parent_id, slug)
);

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING assets TABLE
-- ============================================
-- Note: We're enhancing the existing assets table, not creating a new one

-- Add folder reference (replaces the old string 'folder' column with proper FK)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL;

-- Add tags array for better organization
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add caption for extended descriptions
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS caption TEXT;

-- Add thumbnail URL for video/document previews
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add optimized URL for transformed images
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS optimized_url TEXT;

-- Track who uploaded the file
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add updated_at timestamp
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add file_type enum column for easier filtering
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'other';

-- Add original_name to preserve the original filename
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS original_name TEXT;

-- Add public_url as an alias (some code expects this)
-- We'll use a computed approach in queries since url column exists

-- ============================================
-- MEDIA USAGE TRACKING TABLE (NEW)
-- ============================================
-- Track where media files are used across the platform
CREATE TABLE IF NOT EXISTS public.media_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Where it's used
  entity_type TEXT NOT NULL, -- 'page', 'site', 'component', 'section'
  entity_id UUID NOT NULL,
  
  -- Optional: specific field/property where media is used
  field_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_agency ON public.assets(agency_id);
CREATE INDEX IF NOT EXISTS idx_assets_folder ON public.assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(mime_type);
CREATE INDEX IF NOT EXISTS idx_assets_file_type ON public.assets(file_type);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON public.assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_site ON public.assets(site_id);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON public.assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

-- Media folders indexes
CREATE INDEX IF NOT EXISTS idx_media_folders_agency ON public.media_folders(agency_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_parent ON public.media_folders(parent_id);

-- Media usage indexes
CREATE INDEX IF NOT EXISTS idx_media_usage_asset ON public.media_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_entity ON public.media_usage(entity_type, entity_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on media_folders
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Agency members can view their folders
DROP POLICY IF EXISTS "Agency members can view their folders" ON public.media_folders;
CREATE POLICY "Agency members can view their folders"
ON public.media_folders FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Policy: Agency admins can insert folders
DROP POLICY IF EXISTS "Agency admins can insert folders" ON public.media_folders;
CREATE POLICY "Agency admins can insert folders"
ON public.media_folders FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Policy: Agency admins can update folders
DROP POLICY IF EXISTS "Agency admins can update folders" ON public.media_folders;
CREATE POLICY "Agency admins can update folders"
ON public.media_folders FOR UPDATE
USING (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Policy: Agency admins can delete folders
DROP POLICY IF EXISTS "Agency admins can delete folders" ON public.media_folders;
CREATE POLICY "Agency admins can delete folders"
ON public.media_folders FOR DELETE
USING (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Enable RLS on media_usage
ALTER TABLE public.media_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view usage for their agency's assets
DROP POLICY IF EXISTS "Users can view media usage" ON public.media_usage;
CREATE POLICY "Users can view media usage"
ON public.media_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assets a
    WHERE a.id = media_usage.asset_id
    AND (
      a.agency_id IN (
        SELECT agency_id FROM public.profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    )
  )
);

-- Policy: Users can manage usage for their agency's assets
DROP POLICY IF EXISTS "Users can manage media usage" ON public.media_usage;
CREATE POLICY "Users can manage media usage"
ON public.media_usage FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.assets a
    WHERE a.id = media_usage.asset_id
    AND (
      a.agency_id IN (
        SELECT agency_id FROM public.profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
      )
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    )
  )
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assets updated_at
DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for media_folders updated_at
DROP TRIGGER IF EXISTS update_media_folders_updated_at ON public.media_folders;
CREATE TRIGGER update_media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKET (if not exists)
-- ============================================
-- Note: This should be run via Supabase dashboard or storage API
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('media', 'media', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DATA MIGRATION: Update existing assets
-- ============================================
-- Set file_type based on mime_type for existing records
UPDATE public.assets 
SET file_type = CASE 
  WHEN mime_type LIKE 'image/%' THEN 'image'
  WHEN mime_type LIKE 'video/%' THEN 'video'
  WHEN mime_type LIKE 'application/pdf' THEN 'document'
  WHEN mime_type LIKE '%document%' THEN 'document'
  WHEN mime_type LIKE '%spreadsheet%' THEN 'document'
  WHEN mime_type LIKE '%presentation%' THEN 'document'
  ELSE 'other'
END
WHERE file_type IS NULL OR file_type = 'other';

-- Set original_name from name if not set
UPDATE public.assets 
SET original_name = name 
WHERE original_name IS NULL;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.media_folders TO authenticated;
GRANT ALL ON public.media_usage TO authenticated;

-- ============================================================================
-- PHASE SM-05: Social Media Storage Bucket & Media Folders
-- Creates the Supabase Storage bucket policies and media folders table
-- ============================================================================

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

-- Upload policy: authenticated users can upload
CREATE POLICY "Social media upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'social-media' AND
    auth.role() = 'authenticated'
  );

-- Read policy: anyone can read (public bucket for serving to platforms)
CREATE POLICY "Social media public read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'social-media'
  );

-- Delete policy: authenticated users can delete their uploads
CREATE POLICY "Social media delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'social-media' AND
    auth.role() = 'authenticated'
  );

-- Update policy: authenticated users can update their uploads
CREATE POLICY "Social media update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'social-media' AND
    auth.role() = 'authenticated'
  );

-- Media folders table
CREATE TABLE IF NOT EXISTS public.social_media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.social_media_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6366f1',
  item_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_media_folders_policy ON public.social_media_folders
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

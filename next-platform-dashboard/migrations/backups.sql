-- Backups table for site backup system
-- Phase 62: Backup & Export System

-- Backups table
CREATE TABLE IF NOT EXISTS public.backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'automatic')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.backups IS 'Stores backup records for sites';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backups_site ON public.backups(site_id);
CREATE INDEX IF NOT EXISTS idx_backups_created ON public.backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_type ON public.backups(type);

-- RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "View site backups" ON public.backups;
DROP POLICY IF EXISTS "Create site backups" ON public.backups;
DROP POLICY IF EXISTS "Delete site backups" ON public.backups;

-- View backups for sites you have access to
CREATE POLICY "View site backups"
  ON public.backups FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create backups for sites you have access to
CREATE POLICY "Create site backups"
  ON public.backups FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Delete backups for sites you have access to
CREATE POLICY "Delete site backups"
  ON public.backups FOR DELETE
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Create storage bucket for backups (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups', 
  'backups', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/json']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/json']::text[];

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can download their backups" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their backups" ON storage.objects;

-- Storage policies
CREATE POLICY "Authenticated users can upload backups"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'backups');

CREATE POLICY "Users can download their backups"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'backups');

CREATE POLICY "Users can delete their backups"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'backups');

-- Function to get backup count for a site
CREATE OR REPLACE FUNCTION get_backup_count(p_site_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO backup_count
  FROM public.backups
  WHERE site_id = p_site_id;
  
  RETURN COALESCE(backup_count, 0);
END;
$$;

-- Function to get total backup size for a site
CREATE OR REPLACE FUNCTION get_backup_total_size(p_site_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_size BIGINT;
BEGIN
  SELECT COALESCE(SUM(size_bytes), 0)
  INTO total_size
  FROM public.backups
  WHERE site_id = p_site_id;
  
  RETURN total_size;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_backup_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_backup_total_size(UUID) TO authenticated;

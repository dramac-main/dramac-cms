-- Storage Buckets Migration
-- Run this in your Supabase SQL Editor

-- Create avatars bucket for user profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create branding bucket for agency logos and branding assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for avatars bucket

-- Allow authenticated users to view all avatars (public bucket)
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for branding bucket

-- Allow public viewing of branding assets
CREATE POLICY "Public branding assets are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Allow agency owners/admins to upload branding assets
-- The folder structure should be: branding/{agency_id}/logo.png
CREATE POLICY "Agency members can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Allow agency owners/admins to update branding assets
CREATE POLICY "Agency members can update branding assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Allow agency owners/admins to delete branding assets
CREATE POLICY "Agency members can delete branding assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding'
  AND EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

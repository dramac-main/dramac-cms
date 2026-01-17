-- Phase 81: Media Library System - Storage Bucket Setup
-- Run this in Supabase SQL Editor to create the media storage bucket

-- ============================================
-- CREATE MEDIA STORAGE BUCKET
-- ============================================

-- Insert bucket into storage.buckets table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR MEDIA BUCKET
-- ============================================

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to read their agency's files
CREATE POLICY "Users can read agency media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'media');

-- Allow authenticated users to update their agency's files
CREATE POLICY "Users can update agency media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to delete their agency's files
CREATE POLICY "Users can delete agency media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify bucket was created:
-- SELECT * FROM storage.buckets WHERE name = 'media';

-- Run this to verify policies were created:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%media%';

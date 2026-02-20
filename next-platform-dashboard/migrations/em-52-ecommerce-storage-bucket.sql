-- ============================================================================
-- E-Commerce Storage Bucket Setup
-- Phase EM-52: E-Commerce Module - Product Image Storage
-- 
-- PURPOSE: Creates the 'ecommerce' storage bucket that the image-upload.tsx
-- component expects. Without this bucket, ALL product image uploads fail
-- with "Bucket not found" error.
--
-- RUN THIS IN: Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- Create the ecommerce storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ecommerce',
  'ecommerce',
  true,  -- Public bucket so product images are accessible without auth
  5242880, -- 5MB max file size (matches image-upload.tsx default maxSizeMB=5)
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- RLS POLICIES FOR ECOMMERCE BUCKET
-- ============================================================================

-- Allow anyone to VIEW product images (public storefront needs this)
CREATE POLICY "Public ecommerce images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'ecommerce');

-- Allow authenticated users to UPLOAD product images
CREATE POLICY "Authenticated users can upload ecommerce images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ecommerce');

-- Allow authenticated users to UPDATE product images
CREATE POLICY "Authenticated users can update ecommerce images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ecommerce')
WITH CHECK (bucket_id = 'ecommerce');

-- Allow authenticated users to DELETE product images
CREATE POLICY "Authenticated users can delete ecommerce images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ecommerce');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify everything was created:
--
-- SELECT * FROM storage.buckets WHERE id = 'ecommerce';
-- SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%ecommerce%';

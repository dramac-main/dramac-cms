-- ============================================================================
-- Make CRM and Social Media Modules FREE for Testing
-- ============================================================================
-- Run this in Supabase SQL Editor to make modules free for testing
-- This allows you to test module functionality without payment
-- ============================================================================

-- Step 1: Make modules free
UPDATE public.modules_v2
SET 
  pricing_type = 'free',
  wholesale_price_monthly = 0,
  wholesale_price_yearly = 0,
  suggested_retail_monthly = 0,
  suggested_retail_yearly = 0
WHERE slug IN ('social-media', 'crm');

-- Step 2: Verify the update
SELECT 
  slug, 
  name, 
  pricing_type, 
  wholesale_price_monthly,
  status
FROM public.modules_v2 
WHERE slug IN ('social-media', 'crm');

-- ============================================================================
-- Optional: Auto-install modules for a specific site
-- ============================================================================
-- Replace YOUR_SITE_ID with your actual site ID from the URL
-- Format: /dashboard/sites/[siteId]

-- First, get your agency/user info
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Get your agency ID
-- SELECT id FROM agencies WHERE user_id = 'YOUR_USER_ID';

-- Get your sites
-- SELECT id, name FROM sites WHERE agency_id = 'YOUR_AGENCY_ID';

-- To install modules for a site, run this (after replacing IDs):
/*
-- Get the module IDs
WITH module_ids AS (
  SELECT id, slug FROM modules_v2 WHERE slug IN ('social-media', 'crm')
)
-- Install them for the site
INSERT INTO site_module_installations (site_id, module_id, is_enabled, enabled_at)
SELECT 
  'YOUR_SITE_ID'::uuid,
  m.id,
  true,
  NOW()
FROM module_ids m
ON CONFLICT (site_id, module_id) 
DO UPDATE SET is_enabled = true, enabled_at = NOW();
*/

-- ============================================================================
-- To restore original pricing (after testing):
-- ============================================================================
/*
UPDATE public.modules_v2
SET 
  pricing_type = 'one_time',
  wholesale_price_monthly = 29,
  wholesale_price_yearly = 290,
  suggested_retail_monthly = 49,
  suggested_retail_yearly = 490
WHERE slug IN ('social-media', 'crm');
*/

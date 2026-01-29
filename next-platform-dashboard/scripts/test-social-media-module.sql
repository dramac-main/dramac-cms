-- ============================================================================
-- Social Media Module Testing Script
-- ============================================================================
-- Run these queries in Supabase SQL Editor to test the module
-- ============================================================================

-- ============================================================================
-- 1. CHECK MODULE IS REGISTERED
-- ============================================================================
SELECT 
  id,
  slug, 
  name, 
  pricing_type, 
  wholesale_price_monthly,
  status,
  install_level
FROM public.modules_v2 
WHERE slug = 'social-media';

-- Expected: 1 row with status 'active', install_level 'site'

-- ============================================================================
-- 2. CHECK TABLES EXIST
-- ============================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'social_%'
ORDER BY table_name;

-- Expected: 13 tables

-- ============================================================================
-- 3. CHECK YOUR AGENCY
-- ============================================================================
SELECT id, name FROM public.agencies LIMIT 5;

-- ============================================================================
-- 4. CHECK AGENCY SUBSCRIPTIONS
-- ============================================================================
-- Replace with your agency_id
SELECT 
  ams.id,
  ams.agency_id,
  ams.module_id,
  ams.status,
  m.slug,
  m.name
FROM public.agency_module_subscriptions ams
JOIN public.modules_v2 m ON m.id = ams.module_id
WHERE ams.status = 'active';

-- ============================================================================
-- 5. CHECK SITE MODULE INSTALLATIONS
-- ============================================================================
SELECT 
  smi.id,
  smi.site_id,
  smi.module_id,
  smi.is_enabled,
  m.slug,
  m.name,
  s.name as site_name
FROM public.site_module_installations smi
JOIN public.modules_v2 m ON m.id = smi.module_id
JOIN public.sites s ON s.id = smi.site_id
ORDER BY smi.site_id;

-- ============================================================================
-- 6. SUBSCRIBE AGENCY TO SOCIAL MEDIA MODULE (if not already)
-- ============================================================================
-- First get the module ID
SELECT id FROM public.modules_v2 WHERE slug = 'social-media';

-- Then get your agency ID (from profiles)
SELECT agency_id FROM public.profiles WHERE id = auth.uid();

-- Or manually:
-- INSERT INTO public.agency_module_subscriptions (
--   agency_id,
--   module_id,
--   status,
--   subscribed_at
-- ) VALUES (
--   'YOUR-AGENCY-UUID',
--   (SELECT id FROM public.modules_v2 WHERE slug = 'social-media'),
--   'active',
--   NOW()
-- ) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ENABLE MODULE FOR A SITE
-- ============================================================================
-- First get your site ID
SELECT id, name FROM public.sites LIMIT 5;

-- Then enable the module
-- INSERT INTO public.site_module_installations (
--   site_id,
--   module_id,
--   is_enabled,
--   settings
-- ) VALUES (
--   'YOUR-SITE-UUID',
--   (SELECT id FROM public.modules_v2 WHERE slug = 'social-media'),
--   true,
--   '{}'::jsonb
-- ) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. INSERT TEST SOCIAL ACCOUNT (Optional)
-- ============================================================================
-- INSERT INTO public.social_accounts (
--   site_id,
--   tenant_id,
--   platform,
--   platform_account_id,
--   account_type,
--   account_name,
--   account_handle,
--   access_token,
--   status
-- ) VALUES (
--   'YOUR-SITE-UUID',
--   'YOUR-AGENCY-UUID',
--   'facebook',
--   'fb_123456',
--   'page',
--   'Test Facebook Page',
--   '@testpage',
--   'mock_access_token',
--   'active'
-- );

-- ============================================================================
-- QUICK CLEANUP (if needed)
-- ============================================================================
-- DELETE FROM public.site_module_installations WHERE module_id = (SELECT id FROM public.modules_v2 WHERE slug = 'social-media');
-- DELETE FROM public.agency_module_subscriptions WHERE module_id = (SELECT id FROM public.modules_v2 WHERE slug = 'social-media');

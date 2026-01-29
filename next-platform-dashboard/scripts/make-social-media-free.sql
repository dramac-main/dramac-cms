-- ============================================================================
-- Make Social Media Module FREE for Testing
-- ============================================================================
-- Run this in Supabase SQL Editor to make the module free
-- After testing, run the restore script to revert to paid pricing
-- ============================================================================

UPDATE public.modules_v2
SET 
  pricing_type = 'free',
  wholesale_price_monthly = 0,
  wholesale_price_yearly = 0,
  suggested_retail_monthly = 0,
  suggested_retail_yearly = 0
WHERE slug = 'social-media';

-- Verify the update
SELECT 
  slug, 
  name, 
  pricing_type, 
  wholesale_price_monthly,
  wholesale_price_yearly,
  status
FROM public.modules_v2 
WHERE slug = 'social-media';

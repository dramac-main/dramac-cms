-- Run this in Supabase SQL Editor
-- Phase 81B: Allow subscriptions to testing modules

ALTER TABLE public.agency_module_subscriptions 
DROP CONSTRAINT IF EXISTS agency_module_subscriptions_module_id_fkey;

COMMENT ON COLUMN public.agency_module_subscriptions.module_id IS 
  'References either modules_v2.id (published) or module_source.id (testing). No FK constraint - validated in app code.';

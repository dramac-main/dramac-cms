-- Phase 81B: Allow agency subscriptions to testing modules
-- Problem: agency_module_subscriptions.module_id FK only references modules_v2,
-- but testing modules exist in module_source

-- Drop the existing FK constraint to modules_v2
ALTER TABLE public.agency_module_subscriptions 
DROP CONSTRAINT IF EXISTS agency_module_subscriptions_module_id_fkey;

-- Note: We'll enforce referential integrity in application code
-- Subscriptions can now reference modules in either:
-- - modules_v2 (published modules)
-- - module_source (testing modules)

-- Add comment for documentation
COMMENT ON COLUMN public.agency_module_subscriptions.module_id IS 
  'References either modules_v2.id (published) or module_source.id (testing). No FK constraint - validated in app code.';

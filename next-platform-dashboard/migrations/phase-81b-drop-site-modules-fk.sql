-- Phase 81B: Allow site module installations for testing modules
-- Same issue as agency_module_subscriptions - FK only allows modules_v2

ALTER TABLE site_module_installations 
DROP CONSTRAINT IF EXISTS site_module_installations_module_id_fkey;

COMMENT ON COLUMN site_module_installations.module_id IS 
  'References either modules_v2.id (published) or module_source.id (testing). No FK constraint - validated in app code.';

-- Phase 81B: Add testing_tier to module_source for granular testing control
-- This allows developers to control which testing modules are visible to test sites

-- Add testing_tier column to module_source
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS testing_tier TEXT 
CHECK (testing_tier IN ('internal', 'beta', 'public'))
DEFAULT 'internal';

-- Add comment to explain the field
COMMENT ON COLUMN module_source.testing_tier IS 
'Controls visibility of testing modules: internal (dev only), beta (test sites + beta users), public (wider testing)';

-- Update existing testing modules to 'beta' tier so they remain visible to test sites
UPDATE module_source 
SET testing_tier = 'beta' 
WHERE status = 'testing' AND testing_tier IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_module_source_testing_tier 
ON module_source(testing_tier) 
WHERE status = 'testing';

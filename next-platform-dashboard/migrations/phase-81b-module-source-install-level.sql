-- Phase 81B: Add install_level to module_source for testing modules
-- This allows proper categorization during testing before production deploy

-- Add install_level column to module_source
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS install_level TEXT DEFAULT 'site' 
CHECK (install_level IN ('agency', 'client', 'site'));

-- Add wholesale pricing fields (needed for marketplace/subscriptions)
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS wholesale_price_monthly INTEGER DEFAULT 0;

ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS suggested_retail_monthly INTEGER DEFAULT 0;

-- Update Welcome Banner to be a site-level module (deployed to websites)
UPDATE module_source 
SET install_level = 'site', 
    wholesale_price_monthly = 0,
    suggested_retail_monthly = 0
WHERE slug = 'welcome-banner';

COMMENT ON COLUMN module_source.install_level IS 
  'Where this module can be installed: agency (internal tools), client (client apps), site (website components)';

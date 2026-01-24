-- =============================================================================
-- Phase EM-50: CRM Module - Add is_active Column Fix
-- =============================================================================
-- Adds missing is_active column to pipelines table
-- =============================================================================

-- Add is_active column to pipelines table
ALTER TABLE mod_crmmod01_pipelines 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mod_crmmod01_pipelines_is_active 
ON mod_crmmod01_pipelines(is_active);

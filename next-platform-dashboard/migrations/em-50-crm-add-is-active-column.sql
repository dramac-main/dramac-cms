-- =============================================================================
-- Phase EM-50: CRM Module - Database Schema Fixes
-- =============================================================================
-- Adds missing columns to pipelines table for existing databases
-- Run this in Supabase SQL Editor if you get column not found errors
-- =============================================================================

-- Add is_active column to pipelines table
ALTER TABLE mod_crmmod01_pipelines 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add deal_rotting_days column to pipelines table
ALTER TABLE mod_crmmod01_pipelines 
ADD COLUMN IF NOT EXISTS deal_rotting_days INTEGER NOT NULL DEFAULT 30;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mod_crmmod01_pipelines_is_active 
ON mod_crmmod01_pipelines(is_active);

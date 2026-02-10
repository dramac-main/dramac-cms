-- Migration: automation_connections table
-- Phase EM-57B: Automation Engine - Connection Setup
-- Created: 2025-02-10

-- Drop existing table if it exists (in case of partial previous migration)
DROP TABLE IF EXISTS automation_connections CASCADE;

-- Create automation_connections table
CREATE TABLE automation_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  name TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_automation_connections_agency ON automation_connections(agency_id);
CREATE INDEX idx_automation_connections_site ON automation_connections(site_id);

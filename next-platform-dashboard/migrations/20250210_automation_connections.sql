-- Migration: automation_connections table
-- Phase EM-57B: Automation Engine - Connection Setup
-- Created: 2025-02-10

CREATE TABLE IF NOT EXISTS automation_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  name TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_connections_agency ON automation_connections(agency_id);
CREATE INDEX IF NOT EXISTS idx_automation_connections_site ON automation_connections(site_id);

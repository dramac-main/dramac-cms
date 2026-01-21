-- ============================================================================
-- Phase EM-05: Module Naming Conventions & Conflict Prevention
-- Migration: Module Schema Helper Functions and Registry Tables
-- ============================================================================
-- 
-- This migration creates:
-- 1. Helper functions for module schema management
-- 2. module_database_registry table for tracking module database objects
-- 3. reserved_table_names table to prevent platform conflicts
--
-- Run this migration in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================================================

-- Check if a table exists in any schema
CREATE OR REPLACE FUNCTION check_table_exists(p_table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables t
    WHERE t.table_name = p_table_name
    AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_table_exists(TEXT) IS 
'Checks if a table exists in any user schema. Used for module table validation.';

-- Get all tables for a module prefix
CREATE OR REPLACE FUNCTION get_module_tables(prefix TEXT)
RETURNS TABLE(table_name TEXT, table_schema TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::TEXT, t.table_schema::TEXT
  FROM information_schema.tables t
  WHERE t.table_name LIKE prefix || '%'
  AND t.table_schema NOT IN ('pg_catalog', 'information_schema');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_module_tables(TEXT) IS 
'Returns all tables matching a module prefix pattern. Used for cleanup and inspection.';

-- Get all module schemas
CREATE OR REPLACE FUNCTION get_module_schemas()
RETURNS TABLE(schema_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.schema_name::TEXT
  FROM information_schema.schemata s
  WHERE s.schema_name LIKE 'mod_%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_module_schemas() IS 
'Returns all PostgreSQL schemas created for modules (pattern: mod_*).';

-- Execute arbitrary SQL (admin only, used for schema/table creation)
-- WARNING: This function is powerful and restricted to service_role only
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION exec_sql(TEXT) IS 
'Executes arbitrary SQL. SECURITY: Restricted to service_role only.';

-- CRITICAL SECURITY: Restrict exec_sql to service role only
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- Check if a table name is reserved
CREATE OR REPLACE FUNCTION is_name_reserved(p_table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM reserved_table_names WHERE name = LOWER(p_table_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_name_reserved(TEXT) IS 
'Checks if a table name is reserved by the platform and cannot be used by modules.';

-- Get module short ID from a full table name
CREATE OR REPLACE FUNCTION extract_module_short_id(p_table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_match TEXT[];
BEGIN
  -- Try schema-based pattern first: mod_xxxxxxxx.table_name
  v_match := regexp_matches(p_table_name, '^mod_([a-f0-9]{8})\.');
  IF v_match IS NOT NULL THEN
    RETURN v_match[1];
  END IF;
  
  -- Try table-based pattern: mod_xxxxxxxx_table_name
  v_match := regexp_matches(p_table_name, '^mod_([a-f0-9]{8})_');
  IF v_match IS NOT NULL THEN
    RETURN v_match[1];
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION extract_module_short_id(TEXT) IS 
'Extracts the 8-character module short ID from a table or schema name.';

-- Validate a module short ID format
CREATE OR REPLACE FUNCTION is_valid_module_short_id(p_short_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_short_id ~ '^[a-f0-9]{8}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_module_short_id(TEXT) IS 
'Validates that a short ID is exactly 8 lowercase hex characters.';

-- ============================================================================
-- SECTION 2: MODULE DATABASE REGISTRY TABLE
-- ============================================================================

-- Create the registry table if it doesn't exist
CREATE TABLE IF NOT EXISTS module_database_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Module identification
  module_id UUID NOT NULL,  -- References module_source.id (or modules_v2.id)
  module_short_id TEXT NOT NULL,  -- 8-char prefix (unique)
  
  -- Database objects owned by this module
  uses_schema BOOLEAN DEFAULT false,
  schema_name TEXT,  -- e.g., 'mod_a1b2c3d4' (only if uses_schema = true)
  
  -- Tables owned (array of table names WITHOUT prefix)
  table_names TEXT[] DEFAULT '{}',
  
  -- Metadata
  module_name TEXT,  -- Human-readable name for reference
  module_version TEXT,  -- Version when provisioned
  
  -- Tracking timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT uq_module_short_id UNIQUE (module_short_id),
  CONSTRAINT valid_schema_name CHECK (
    schema_name IS NULL OR schema_name ~ '^mod_[a-f0-9]{8}$'
  ),
  CONSTRAINT valid_short_id CHECK (
    module_short_id ~ '^[a-f0-9]{8}$'
  ),
  CONSTRAINT schema_consistency CHECK (
    (uses_schema = false AND schema_name IS NULL) OR
    (uses_schema = true AND schema_name IS NOT NULL)
  )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_module_db_registry_module_id 
  ON module_database_registry(module_id);

CREATE INDEX IF NOT EXISTS idx_module_db_registry_short_id 
  ON module_database_registry(module_short_id);

CREATE INDEX IF NOT EXISTS idx_module_db_registry_schema 
  ON module_database_registry(schema_name) 
  WHERE schema_name IS NOT NULL;

-- Add table comment
COMMENT ON TABLE module_database_registry IS 
'Tracks all database objects (schemas, tables) owned by each module. Used for conflict prevention and cleanup.';

-- Column comments
COMMENT ON COLUMN module_database_registry.module_id IS 'UUID of the module (from module_source or modules_v2)';
COMMENT ON COLUMN module_database_registry.module_short_id IS 'Deterministic 8-character hex prefix derived from module UUID';
COMMENT ON COLUMN module_database_registry.uses_schema IS 'True if module uses dedicated PostgreSQL schema (System modules)';
COMMENT ON COLUMN module_database_registry.schema_name IS 'Full schema name (e.g., mod_a1b2c3d4) if uses_schema is true';
COMMENT ON COLUMN module_database_registry.table_names IS 'Array of table names WITHOUT prefix (e.g., contacts, deals)';

-- Enable RLS
ALTER TABLE module_database_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service_role can modify (admin operation)
CREATE POLICY module_db_registry_service_role ON module_database_registry
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can read (for debugging/inspection)
CREATE POLICY module_db_registry_read ON module_database_registry
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- SECTION 3: RESERVED TABLE NAMES
-- ============================================================================

-- Create the reserved names table
CREATE TABLE IF NOT EXISTS reserved_table_names (
  name TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  category TEXT DEFAULT 'platform',
  reserved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE reserved_table_names IS 
'Contains table names that are reserved by the platform and cannot be used by modules.';

-- Insert platform reserved names
INSERT INTO reserved_table_names (name, reason, category) VALUES
  -- Core platform tables
  ('users', 'Platform users table', 'core'),
  ('profiles', 'User profiles table', 'core'),
  ('sites', 'Platform sites table', 'core'),
  ('pages', 'Platform pages table', 'core'),
  ('sections', 'Platform sections table', 'core'),
  ('components', 'Platform components table', 'core'),
  ('assets', 'Media assets table', 'core'),
  
  -- Organization tables
  ('agencies', 'Platform agencies table', 'organization'),
  ('clients', 'Platform clients table', 'organization'),
  ('teams', 'Team management', 'organization'),
  ('invitations', 'User invitations', 'organization'),
  
  -- Module system tables
  ('modules', 'Legacy module table', 'modules'),
  ('modules_v2', 'Module catalog table', 'modules'),
  ('module_source', 'Module studio source table', 'modules'),
  ('site_modules', 'Site-module associations', 'modules'),
  ('module_subscriptions', 'Module subscription billing', 'modules'),
  ('module_database_registry', 'Module DB tracking', 'modules'),
  ('module_data', 'Shared module data storage', 'modules'),
  
  -- Billing tables
  ('subscriptions', 'Billing subscriptions', 'billing'),
  ('invoices', 'Billing invoices', 'billing'),
  ('billing_customers', 'Billing customer records', 'billing'),
  ('payments', 'Payment records', 'billing'),
  ('plans', 'Subscription plans', 'billing'),
  
  -- Auth & security
  ('sessions', 'Auth sessions', 'auth'),
  ('tokens', 'Auth tokens', 'auth'),
  ('api_keys', 'API key management', 'auth'),
  ('audit_logs', 'Security audit logs', 'auth'),
  ('rate_limits', 'Rate limiting data', 'auth'),
  
  -- Content tables
  ('templates', 'Page templates', 'content'),
  ('blogs', 'Blog configuration', 'content'),
  ('blog_posts', 'Blog post content', 'content'),
  ('blog_categories', 'Blog categories', 'content'),
  ('media', 'Media library', 'content'),
  
  -- Forms & submissions
  ('forms', 'Form definitions', 'forms'),
  ('form_submissions', 'Form submission data', 'forms'),
  ('form_fields', 'Form field definitions', 'forms'),
  
  -- Analytics
  ('analytics', 'Platform analytics', 'analytics'),
  ('events', 'Event tracking', 'analytics'),
  ('pageviews', 'Page view tracking', 'analytics'),
  
  -- Settings & configuration
  ('settings', 'Platform settings', 'config'),
  ('configurations', 'System configurations', 'config'),
  ('preferences', 'User preferences', 'config'),
  ('feature_flags', 'Feature flag management', 'config'),
  
  -- Notifications
  ('notifications', 'User notifications', 'notifications'),
  ('email_templates', 'Email template storage', 'notifications'),
  ('webhooks', 'Webhook configurations', 'notifications'),
  
  -- Reserved module prefixes (prevent generic names)
  ('data', 'Too generic - use specific names', 'reserved'),
  ('items', 'Too generic - use specific names', 'reserved'),
  ('records', 'Too generic - use specific names', 'reserved'),
  ('entries', 'Too generic - use specific names', 'reserved'),
  ('objects', 'Too generic - use specific names', 'reserved'),
  ('things', 'Too generic - use specific names', 'reserved')
  
ON CONFLICT (name) DO UPDATE SET
  reason = EXCLUDED.reason,
  category = EXCLUDED.category;

-- Enable RLS
ALTER TABLE reserved_table_names ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read (modules need to check)
CREATE POLICY reserved_names_read ON reserved_table_names
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- RLS Policy: Only service_role can modify
CREATE POLICY reserved_names_admin ON reserved_table_names
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SECTION 4: HELPER VIEWS
-- ============================================================================

-- View: All module database objects with their tables
CREATE OR REPLACE VIEW module_database_overview AS
SELECT 
  r.module_id,
  r.module_short_id,
  r.module_name,
  r.module_version,
  r.uses_schema,
  r.schema_name,
  r.table_names,
  array_length(r.table_names, 1) as table_count,
  r.created_at,
  r.updated_at,
  -- Actual tables found in database
  (
    SELECT array_agg(t.table_name) 
    FROM information_schema.tables t 
    WHERE 
      (r.uses_schema AND t.table_schema = r.schema_name)
      OR (NOT r.uses_schema AND t.table_name LIKE 'mod_' || r.module_short_id || '_%')
  ) as actual_tables
FROM module_database_registry r;

COMMENT ON VIEW module_database_overview IS 
'Provides an overview of all module database objects, including registered and actual tables.';

-- View: Find orphaned module tables (tables without registry entry)
CREATE OR REPLACE VIEW orphaned_module_tables AS
SELECT 
  t.table_schema,
  t.table_name,
  extract_module_short_id(t.table_name) as short_id,
  'No registry entry' as issue
FROM information_schema.tables t
WHERE 
  (t.table_name LIKE 'mod_%' OR t.table_schema LIKE 'mod_%')
  AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND NOT EXISTS (
    SELECT 1 FROM module_database_registry r
    WHERE 
      (r.uses_schema AND t.table_schema = r.schema_name)
      OR (NOT r.uses_schema AND t.table_name LIKE 'mod_' || r.module_short_id || '_%')
  );

COMMENT ON VIEW orphaned_module_tables IS 
'Lists module tables that exist in the database but have no registry entry. These may be leftovers from failed uninstalls.';

-- ============================================================================
-- SECTION 5: UTILITY FUNCTIONS FOR MANAGEMENT
-- ============================================================================

-- Function to get complete module database status
CREATE OR REPLACE FUNCTION get_module_database_status(p_module_id UUID)
RETURNS TABLE(
  module_id UUID,
  short_id TEXT,
  uses_schema BOOLEAN,
  schema_name TEXT,
  registered_tables TEXT[],
  actual_tables TEXT[],
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH module_info AS (
    SELECT 
      r.module_id,
      r.module_short_id,
      r.uses_schema,
      r.schema_name,
      r.table_names
    FROM module_database_registry r
    WHERE r.module_id = p_module_id
  ),
  actual AS (
    SELECT 
      array_agg(t.table_name) as tables
    FROM information_schema.tables t, module_info m
    WHERE 
      (m.uses_schema AND t.table_schema = m.schema_name)
      OR (NOT m.uses_schema AND t.table_name LIKE 'mod_' || m.module_short_id || '_%')
  )
  SELECT 
    m.module_id,
    m.module_short_id,
    m.uses_schema,
    m.schema_name,
    m.table_names,
    COALESCE(a.tables, '{}'::TEXT[]),
    CASE 
      WHEN m.module_id IS NULL THEN 'not_registered'
      WHEN a.tables IS NULL OR array_length(a.tables, 1) = 0 THEN 'registered_no_tables'
      WHEN m.table_names = a.tables THEN 'healthy'
      ELSE 'mismatch'
    END
  FROM module_info m
  LEFT JOIN actual a ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_module_database_status(UUID) IS 
'Returns the database status for a specific module, including registered vs actual tables.';

-- Function to clean up orphaned module tables
CREATE OR REPLACE FUNCTION cleanup_orphaned_module_tables(p_short_id TEXT, p_dry_run BOOLEAN DEFAULT true)
RETURNS TABLE(
  action TEXT,
  object_name TEXT,
  executed BOOLEAN
) AS $$
DECLARE
  v_table RECORD;
BEGIN
  FOR v_table IN 
    SELECT t.table_schema, t.table_name
    FROM information_schema.tables t
    WHERE 
      t.table_name LIKE 'mod_' || p_short_id || '_%'
      OR t.table_schema = 'mod_' || p_short_id
  LOOP
    IF p_dry_run THEN
      RETURN QUERY SELECT 
        'DROP TABLE'::TEXT,
        v_table.table_schema || '.' || v_table.table_name,
        false;
    ELSE
      EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', v_table.table_schema, v_table.table_name);
      RETURN QUERY SELECT 
        'DROP TABLE'::TEXT,
        v_table.table_schema || '.' || v_table.table_name,
        true;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict to service_role
REVOKE ALL ON FUNCTION cleanup_orphaned_module_tables(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_module_tables(TEXT, BOOLEAN) TO service_role;

COMMENT ON FUNCTION cleanup_orphaned_module_tables(TEXT, BOOLEAN) IS 
'Cleans up orphaned module tables. Use dry_run=true to preview, dry_run=false to execute. SERVICE_ROLE ONLY.';

-- ============================================================================
-- SECTION 6: TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_module_registry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS tr_module_db_registry_updated ON module_database_registry;
CREATE TRIGGER tr_module_db_registry_updated
  BEFORE UPDATE ON module_database_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_module_registry_timestamp();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Phase EM-05 Migration Complete!';
  RAISE NOTICE '  ✓ Helper functions created';
  RAISE NOTICE '  ✓ module_database_registry table created';
  RAISE NOTICE '  ✓ reserved_table_names table created and populated';
  RAISE NOTICE '  ✓ Views and utility functions created';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify, run:';
  RAISE NOTICE '  SELECT * FROM reserved_table_names;';
  RAISE NOTICE '  SELECT * FROM module_database_overview;';
END $$;

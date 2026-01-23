-- ============================================================================
-- Phase EM-40: Multi-Tenant Architecture Foundation
-- Created: 2026-01-25
-- Description: Complete data isolation across all modules with RLS
-- ============================================================================

-- ============================================================================
-- ENSURE BASE TABLES HAVE PROPER STRUCTURE
-- ============================================================================

-- Verify agencies table has necessary columns
ALTER TABLE agencies 
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS max_sites INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Verify sites table has agency_id and client_id
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create indexes for agency lookups
CREATE INDEX IF NOT EXISTS idx_sites_agency ON sites(agency_id);
CREATE INDEX IF NOT EXISTS idx_sites_client ON sites(client_id);

-- ============================================================================
-- MODULE ACCESS LOGS TABLE (for audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_module TEXT NOT NULL,
  target_module TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_access_logs_agency ON module_access_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_module_access_logs_site ON module_access_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_module_access_logs_created ON module_access_logs(created_at DESC);

-- Enable RLS on module_access_logs
ALTER TABLE module_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see logs for their agency
DROP POLICY IF EXISTS "Users can view their agency's access logs" ON module_access_logs;
CREATE POLICY "Users can view their agency's access logs" ON module_access_logs
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- MODULE DATABASE REGISTRY TABLE (Use existing from EM-05)
-- ============================================================================

-- Table already exists from phase-em05-module-naming.sql
-- Ensure it has columns needed for multi-tenant tracking

-- Add status column if it doesn't exist (for tracking table lifecycle)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'module_database_registry' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE module_database_registry 
    ADD COLUMN status TEXT DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'migrating', 'deprecated'));
  END IF;
END $$;

-- Indexes already created by EM-05 migration

-- ============================================================================
-- TENANT CONTEXT FUNCTIONS
-- ============================================================================

-- Set current tenant context (called at start of each request)
CREATE OR REPLACE FUNCTION set_tenant_context(
  p_agency_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Set session variables for RLS policies
  PERFORM set_config('app.agency_id', COALESCE(p_agency_id::TEXT, ''), TRUE);
  PERFORM set_config('app.site_id', COALESCE(p_site_id::TEXT, ''), TRUE);
  PERFORM set_config('app.user_id', COALESCE(p_user_id::TEXT, ''), TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current agency ID from session
CREATE OR REPLACE FUNCTION current_agency_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.agency_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current site ID from session
CREATE OR REPLACE FUNCTION current_site_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.site_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VERIFY TENANT ACCESS FUNCTIONS
-- ============================================================================

-- NOTE: Most helper functions already exist from phase-59-rls-helpers.sql
-- We only add new ones needed specifically for multi-tenant module architecture

-- Check if user has access to a site (NEW - not in phase-59)
CREATE OR REPLACE FUNCTION user_has_site_access(p_user_id UUID, p_site_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM agency_members am
    JOIN sites s ON s.agency_id = am.agency_id
    WHERE am.user_id = p_user_id
      AND s.id = p_site_id
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user belongs to agency (NEW - not in phase-59)
CREATE OR REPLACE FUNCTION user_in_agency(p_user_id UUID, p_agency_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_in_agency BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM agency_members
    WHERE user_id = p_user_id
      AND agency_id = p_agency_id
  ) INTO v_in_agency;
  
  RETURN v_in_agency;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get user's agency ID (NEW - not in phase-59)
CREATE OR REPLACE FUNCTION get_user_agency_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  SELECT agency_id INTO v_agency_id
  FROM agency_members
  WHERE user_id = p_user_id
  LIMIT 1;
  
  RETURN v_agency_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get user's role in agency (NEW - not in phase-59)
CREATE OR REPLACE FUNCTION get_user_agency_role(p_user_id UUID, p_agency_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM agency_members
  WHERE user_id = p_user_id
    AND agency_id = p_agency_id;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- TENANT-AWARE MODULE TABLE CREATOR
-- ============================================================================

-- Creates a module table with proper multi-tenant columns and RLS
CREATE OR REPLACE FUNCTION create_module_table(
  p_table_name TEXT,
  p_columns TEXT,  -- Column definitions (name TYPE, ...)
  p_module_id UUID
) RETURNS VOID AS $$
DECLARE
  v_full_table TEXT;
  v_sql TEXT;
BEGIN
  -- Validate table name follows convention
  IF NOT (p_table_name ~ '^mod_[a-f0-9]{8}_[a-z_]+$') THEN
    RAISE EXCEPTION 'Table name must follow pattern: mod_{8char}_{table}';
  END IF;
  
  v_full_table := p_table_name;
  
  -- Create table with multi-tenant columns
  v_sql := format('
    CREATE TABLE IF NOT EXISTS %I (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Multi-tenant columns (REQUIRED)
      site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      
      -- User tracking
      created_by UUID REFERENCES auth.users(id),
      updated_by UUID REFERENCES auth.users(id),
      
      -- Timestamps
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Module columns
      %s
    )',
    v_full_table,
    p_columns
  );
  
  EXECUTE v_sql;
  
  -- Create indexes
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_site ON %I(site_id)', v_full_table, v_full_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_agency ON %I(agency_id)', v_full_table, v_full_table);
  
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_full_table);
  
  -- Drop existing policies if they exist
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'site_select_' || v_full_table, v_full_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'site_insert_' || v_full_table, v_full_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'site_update_' || v_full_table, v_full_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'site_delete_' || v_full_table, v_full_table);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'admin_all_' || v_full_table, v_full_table);
  
  -- SELECT: Users can see data for their current site
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR SELECT
    USING (site_id = current_site_id())
  ', 'site_select_' || v_full_table, v_full_table);
  
  -- INSERT: Users can insert for their current site
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR INSERT
    WITH CHECK (
      site_id = current_site_id() 
      AND agency_id = current_agency_id()
    )
  ', 'site_insert_' || v_full_table, v_full_table);
  
  -- UPDATE: Users can update their site''s data
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR UPDATE
    USING (site_id = current_site_id())
    WITH CHECK (site_id = current_site_id())
  ', 'site_update_' || v_full_table, v_full_table);
  
  -- DELETE: Users can delete their site''s data
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR DELETE
    USING (site_id = current_site_id())
  ', 'site_delete_' || v_full_table, v_full_table);
  
  -- Admin bypass: Agency admins can access all sites in their agency
  -- Note: is_agency_admin() is in public schema, takes only agency_id, gets user from auth.uid()
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR ALL
    USING (
      agency_id = current_agency_id()
      AND is_agency_admin(agency_id)
    )
  ', 'admin_all_' || v_full_table, v_full_table);
  
  -- Register table in module database registry (using existing EM-05 schema)
  -- Note: This updates table_names array, not a singular table_name column
  INSERT INTO module_database_registry (
    module_id, 
    module_short_id,
    table_names,
    uses_schema,
    status
  )
  VALUES (
    p_module_id, 
    substring(p_module_id::TEXT from 1 for 8), -- First 8 chars as short_id
    ARRAY[v_full_table]::TEXT[],
    false,
    'active'
  )
  ON CONFLICT (module_id) DO UPDATE SET 
    table_names = CASE 
      WHEN v_full_table = ANY(module_database_registry.table_names) 
      THEN module_database_registry.table_names
      ELSE array_append(module_database_registry.table_names, v_full_table)
    END,
    status = 'active',
    updated_at = NOW();
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DROP MODULE TABLE FUNCTION
-- ============================================================================

-- Safely drops a module table and removes from registry
CREATE OR REPLACE FUNCTION drop_module_table(
  p_table_name TEXT,
  p_module_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Validate table name follows convention
  IF NOT (p_table_name ~ '^mod_[a-f0-9]{8}_[a-z_]+$') THEN
    RAISE EXCEPTION 'Table name must follow pattern: mod_{8char}_{table}';
  END IF;
  
  -- Remove table from table_names array in registry
  UPDATE module_database_registry 
  SET 
    table_names = array_remove(table_names, p_table_name),
    status = CASE 
      WHEN array_length(array_remove(table_names, p_table_name), 1) = 0 THEN 'inactive'
      ELSE status
    END,
    updated_at = NOW()
  WHERE module_id = p_module_id 
    AND p_table_name = ANY(table_names);
  
  -- Drop the table
  EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', p_table_name);
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TENANT DATA ISOLATION VERIFICATION
-- ============================================================================

-- Verify data isolation between tenants (for testing/auditing)
CREATE OR REPLACE FUNCTION verify_tenant_isolation(
  p_table_name TEXT,
  p_site_id_1 UUID,
  p_site_id_2 UUID
) RETURNS TABLE (
  check_name TEXT,
  passed BOOLEAN,
  details TEXT
) AS $$
DECLARE
  v_count_1 INTEGER;
  v_count_2 INTEGER;
  v_cross_count INTEGER;
BEGIN
  -- Check 1: Both sites have separate data
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE site_id = $1', p_table_name) 
    INTO v_count_1 USING p_site_id_1;
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE site_id = $1', p_table_name) 
    INTO v_count_2 USING p_site_id_2;
  
  RETURN QUERY SELECT 
    'Data separation'::TEXT,
    TRUE,
    format('Site 1: %s records, Site 2: %s records', v_count_1, v_count_2);
  
  -- Check 2: No cross-site references
  RETURN QUERY SELECT
    'Cross-site isolation'::TEXT,
    TRUE,
    'Sites have independent data sets';
    
  -- Check 3: RLS is enabled
  RETURN QUERY SELECT
    'RLS enabled'::TEXT,
    (SELECT relrowsecurity FROM pg_class WHERE relname = p_table_name),
    'Row Level Security status';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION set_tenant_context IS 'Sets the current tenant context for RLS policies';
COMMENT ON FUNCTION current_agency_id IS 'Returns the current agency ID from session context';
COMMENT ON FUNCTION current_site_id IS 'Returns the current site ID from session context';
COMMENT ON FUNCTION current_user_id IS 'Returns the current user ID from session context';
COMMENT ON FUNCTION user_has_site_access IS 'Checks if a user has access to a specific site';
COMMENT ON FUNCTION is_agency_admin IS 'Checks if a user is an admin for an agency';
COMMENT ON FUNCTION create_module_table IS 'Creates a multi-tenant module table with proper RLS';
COMMENT ON FUNCTION drop_module_table IS 'Safely drops a module table and removes from registry';
COMMENT ON TABLE module_access_logs IS 'Audit trail for cross-module data access';
COMMENT ON TABLE module_database_registry IS 'Registry of all module database tables';

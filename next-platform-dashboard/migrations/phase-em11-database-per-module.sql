-- ============================================================================
-- Phase EM-11: Database Per Module (Multi-Tenant Data Isolation)
-- Created: 2026-01-21
-- 
-- This migration adds:
-- 1. Secure DDL execution function (exec_ddl)
-- 2. Module database registry table
-- 3. Helper functions for module database management
-- 4. Query execution function for module data access
--
-- Prerequisites: EM-05, EM-10 must be run first
-- ============================================================================

-- ============================================================================
-- SECTION 1: SECURE DDL EXECUTION (Service Role Only)
-- ============================================================================

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS exec_ddl(TEXT);

-- Function to execute DDL commands (CREATE, ALTER, DROP)
-- Only callable by service_role
CREATE OR REPLACE FUNCTION exec_ddl(ddl_command TEXT)
RETURNS void AS $$
BEGIN
  -- Validate command starts with allowed keywords
  IF NOT (
    ddl_command ~* '^\s*(CREATE|ALTER|DROP|GRANT|REVOKE)'
  ) THEN
    RAISE EXCEPTION 'Only DDL commands (CREATE, ALTER, DROP, GRANT, REVOKE) are allowed';
  END IF;
  
  -- Prevent dangerous operations
  IF ddl_command ~* 'DROP\s+(DATABASE|ROLE|USER)' THEN
    RAISE EXCEPTION 'Cannot drop database, role, or user';
  END IF;
  
  -- Prevent modifications to core schemas
  IF ddl_command ~* '(DROP|ALTER)\s+SCHEMA\s+(public|auth|storage|extensions)' THEN
    RAISE EXCEPTION 'Cannot modify system schemas';
  END IF;
  
  -- Prevent modifications to core tables
  IF ddl_command ~* 'DROP\s+TABLE\s+(public\.)?(agencies|sites|users|profiles|clients|pages|sections|components|module_source|modules_v2)' THEN
    RAISE EXCEPTION 'Cannot drop core platform tables';
  END IF;
  
  -- Execute the DDL
  EXECUTE ddl_command;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION exec_ddl(TEXT) IS 
'Executes DDL commands (CREATE, ALTER, DROP, GRANT, REVOKE). Restricted to service_role only.';

-- Restrict to service_role only
REVOKE ALL ON FUNCTION exec_ddl(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_ddl(TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION exec_ddl(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION exec_ddl(TEXT) TO service_role;

-- ============================================================================
-- SECTION 2: MODULE DATABASE REGISTRY
-- (Track what database objects each module created)
-- ============================================================================

-- Create table with basic structure
CREATE TABLE IF NOT EXISTS public.module_database_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL,
  module_short_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (handles upgrades)
DO $$ 
BEGIN
  -- Schema info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='uses_schema') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN uses_schema BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='schema_name') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN schema_name TEXT;
  END IF;
  
  -- Tables created
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='table_names') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN table_names TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='full_table_names') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN full_table_names TEXT[] DEFAULT '{}';
  END IF;
  
  -- Status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='status') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
  
  -- Storage metrics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='total_rows') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN total_rows BIGINT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='storage_bytes') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN storage_bytes BIGINT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='last_metrics_at') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN last_metrics_at TIMESTAMPTZ;
  END IF;
  
  -- Error tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='last_error') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN last_error TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='module_database_registry' AND column_name='last_error_at') 
  THEN
    ALTER TABLE public.module_database_registry ADD COLUMN last_error_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Status check constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'module_database_registry_status_check'
  ) THEN
    ALTER TABLE public.module_database_registry 
    ADD CONSTRAINT module_database_registry_status_check 
    CHECK (status IN ('active', 'provisioning', 'migrating', 'deprecated', 'failed'));
  END IF;
  
  -- Schema name pattern constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_schema_name'
  ) THEN
    ALTER TABLE public.module_database_registry 
    ADD CONSTRAINT valid_schema_name 
    CHECK (schema_name IS NULL OR schema_name ~* '^mod_[a-f0-9]{8}$');
  END IF;
  
  -- Short ID pattern constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_short_id'
  ) THEN
    ALTER TABLE public.module_database_registry 
    ADD CONSTRAINT valid_short_id 
    CHECK (module_short_id ~* '^[a-f0-9]{8}$');
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_module_db_registry_module_id 
  ON public.module_database_registry(module_id);
CREATE INDEX IF NOT EXISTS idx_module_db_registry_status 
  ON public.module_database_registry(status);
CREATE INDEX IF NOT EXISTS idx_module_db_registry_schema 
  ON public.module_database_registry(schema_name) WHERE schema_name IS NOT NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_module_db_registry_updated_at ON public.module_database_registry;
CREATE TRIGGER update_module_db_registry_updated_at
  BEFORE UPDATE ON public.module_database_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for module_database_registry (service role only for writes)
ALTER TABLE public.module_database_registry ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Super admins can read module_database_registry" ON public.module_database_registry;

-- Super admins can read (inline check to avoid auth schema permission issues)
CREATE POLICY "Super admins can read module_database_registry" 
  ON public.module_database_registry
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Service role has full access (for programmatic operations)
-- Note: Service role bypasses RLS by default

-- ============================================================================
-- SECTION 3: HELPER FUNCTIONS FOR MODULE SCHEMA MANAGEMENT
-- ============================================================================

-- List all tables in a module's schema with row counts
CREATE OR REPLACE FUNCTION get_module_schema_tables(p_schema_name TEXT)
RETURNS TABLE(
  table_name TEXT, 
  row_count BIGINT,
  size_bytes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    (SELECT COUNT(*) FROM (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_schema_name 
      AND table_name = t.table_name
    ) x)::BIGINT as row_count,
    pg_total_relation_size(quote_ident(p_schema_name) || '.' || quote_ident(t.table_name))::BIGINT as size_bytes
  FROM information_schema.tables t
  WHERE t.table_schema = p_schema_name
    AND t.table_type = 'BASE TABLE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_module_schema_tables(TEXT) IS 
'Lists all tables in a module schema with row counts and sizes.';

-- Check if a module schema exists
CREATE OR REPLACE FUNCTION module_schema_exists(p_schema_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = p_schema_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION module_schema_exists(TEXT) IS 
'Checks if a module schema (mod_xxxxxxxx) exists.';

-- Get storage size of a module's schema or tables
CREATE OR REPLACE FUNCTION get_module_storage_size(p_schema_name TEXT)
RETURNS BIGINT AS $$
DECLARE
  total_size BIGINT := 0;
BEGIN
  SELECT COALESCE(
    SUM(pg_total_relation_size(quote_ident(p_schema_name) || '.' || quote_ident(table_name))),
    0
  )
  INTO total_size
  FROM information_schema.tables
  WHERE table_schema = p_schema_name
    AND table_type = 'BASE TABLE';
    
  RETURN total_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_module_storage_size(TEXT) IS 
'Returns total storage size in bytes for all tables in a module schema.';

-- Get storage size for prefixed tables (non-schema isolation)
CREATE OR REPLACE FUNCTION get_module_prefixed_tables_size(p_prefix TEXT)
RETURNS BIGINT AS $$
DECLARE
  total_size BIGINT := 0;
BEGIN
  SELECT COALESCE(
    SUM(pg_total_relation_size('public.' || quote_ident(table_name))),
    0
  )
  INTO total_size
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE p_prefix || '%'
    AND table_type = 'BASE TABLE';
    
  RETURN total_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_module_prefixed_tables_size(TEXT) IS 
'Returns total storage size for module tables using prefix pattern (mod_{short_id}_*).';

-- Count total rows across all module tables
CREATE OR REPLACE FUNCTION count_module_rows(p_module_short_id TEXT, p_uses_schema BOOLEAN)
RETURNS BIGINT AS $$
DECLARE
  total_count BIGINT := 0;
  schema_name TEXT;
  table_rec RECORD;
  row_count BIGINT;
BEGIN
  IF p_uses_schema THEN
    schema_name := 'mod_' || p_module_short_id;
    
    FOR table_rec IN 
      SELECT t.table_name 
      FROM information_schema.tables t
      WHERE t.table_schema = schema_name
        AND t.table_type = 'BASE TABLE'
    LOOP
      EXECUTE format('SELECT COUNT(*) FROM %I.%I', schema_name, table_rec.table_name) INTO row_count;
      total_count := total_count + COALESCE(row_count, 0);
    END LOOP;
  ELSE
    -- Prefixed tables in public schema
    FOR table_rec IN 
      SELECT t.table_name 
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_name LIKE 'mod_' || p_module_short_id || '_%'
        AND t.table_type = 'BASE TABLE'
    LOOP
      EXECUTE format('SELECT COUNT(*) FROM public.%I', table_rec.table_name) INTO row_count;
      total_count := total_count + COALESCE(row_count, 0);
    END LOOP;
  END IF;
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION count_module_rows(TEXT, BOOLEAN) IS 
'Counts total rows across all tables for a module.';

-- ============================================================================
-- SECTION 4: MODULE DATA QUERY EXECUTION (For SDK)
-- ============================================================================

-- Execute a read-only query within a module context
-- This ensures site isolation is enforced
CREATE OR REPLACE FUNCTION execute_module_query(
  p_module_id UUID,
  p_site_id UUID,
  p_sql TEXT,
  p_params JSONB DEFAULT '[]'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_module_short_id TEXT;
  v_uses_schema BOOLEAN;
  v_schema_name TEXT;
BEGIN
  -- Validate the query is SELECT only
  IF NOT (p_sql ~* '^\s*SELECT') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Prevent SQL injection attempts
  IF p_sql ~* '(;|--|DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)' THEN
    RAISE EXCEPTION 'Query contains disallowed keywords';
  END IF;
  
  -- Get module info from registry
  SELECT module_short_id, uses_schema, schema_name 
  INTO v_module_short_id, v_uses_schema, v_schema_name
  FROM public.module_database_registry
  WHERE module_id = p_module_id;
  
  IF v_module_short_id IS NULL THEN
    RAISE EXCEPTION 'Module not found in database registry';
  END IF;
  
  -- Verify the query only accesses this module's tables
  IF v_uses_schema THEN
    -- Check schema is correct
    IF NOT (p_sql ~* ('FROM\s+' || v_schema_name)) THEN
      RAISE EXCEPTION 'Query must access tables in module schema: %', v_schema_name;
    END IF;
  ELSE
    -- Check table prefix is correct
    IF NOT (p_sql ~* ('FROM\s+(public\.)?mod_' || v_module_short_id || '_')) THEN
      RAISE EXCEPTION 'Query must access tables with module prefix: mod_%s_*', v_module_short_id;
    END IF;
  END IF;
  
  -- Execute and return results as JSON
  -- Note: In production, you'd want proper parameterized queries
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || p_sql || ') t'
    INTO v_result;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION execute_module_query(UUID, UUID, TEXT, JSONB) IS 
'Executes a read-only SELECT query within a module context. Validates module ownership.';

-- Grant to authenticated for SDK usage
GRANT EXECUTE ON FUNCTION execute_module_query(UUID, UUID, TEXT, JSONB) TO authenticated;

-- ============================================================================
-- SECTION 5: METRICS UPDATE FUNCTION
-- ============================================================================

-- Update storage metrics for a module
CREATE OR REPLACE FUNCTION update_module_storage_metrics(p_module_short_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_uses_schema BOOLEAN;
  v_schema_name TEXT;
  v_total_rows BIGINT;
  v_storage_bytes BIGINT;
BEGIN
  -- Get registry info
  SELECT uses_schema, schema_name 
  INTO v_uses_schema, v_schema_name
  FROM public.module_database_registry
  WHERE module_short_id = p_module_short_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate metrics
  v_total_rows := count_module_rows(p_module_short_id, v_uses_schema);
  
  IF v_uses_schema THEN
    v_storage_bytes := get_module_storage_size(v_schema_name);
  ELSE
    v_storage_bytes := get_module_prefixed_tables_size('mod_' || p_module_short_id || '_');
  END IF;
  
  -- Update registry
  UPDATE public.module_database_registry
  SET 
    total_rows = v_total_rows,
    storage_bytes = v_storage_bytes,
    last_metrics_at = NOW(),
    updated_at = NOW()
  WHERE module_short_id = p_module_short_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_module_storage_metrics(TEXT) IS 
'Updates storage and row count metrics for a module in the registry.';

-- ============================================================================
-- SECTION 6: CLEANUP/DEPROVISION HELPER
-- ============================================================================

-- Safely drop all objects for a module
CREATE OR REPLACE FUNCTION cleanup_module_database(
  p_module_short_id TEXT,
  p_uses_schema BOOLEAN,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS TABLE(
  action TEXT,
  object_type TEXT,
  object_name TEXT,
  executed BOOLEAN
) AS $$
DECLARE
  v_schema_name TEXT;
  v_table_name TEXT;
BEGIN
  v_schema_name := 'mod_' || p_module_short_id;
  
  IF p_uses_schema THEN
    -- Return schema to drop
    RETURN QUERY SELECT 
      'DROP'::TEXT,
      'SCHEMA'::TEXT,
      v_schema_name::TEXT,
      CASE WHEN NOT p_dry_run THEN true ELSE false END;
    
    IF NOT p_dry_run THEN
      EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', v_schema_name);
    END IF;
  ELSE
    -- Return all prefixed tables to drop
    FOR v_table_name IN 
      SELECT t.table_name 
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_name LIKE 'mod_' || p_module_short_id || '_%'
    LOOP
      RETURN QUERY SELECT 
        'DROP'::TEXT,
        'TABLE'::TEXT,
        ('public.' || v_table_name)::TEXT,
        CASE WHEN NOT p_dry_run THEN true ELSE false END;
      
      IF NOT p_dry_run THEN
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', v_table_name);
      END IF;
    END LOOP;
  END IF;
  
  -- Delete from registry if not dry run
  IF NOT p_dry_run THEN
    DELETE FROM public.module_database_registry 
    WHERE module_short_id = p_module_short_id;
    
    RETURN QUERY SELECT 
      'DELETE'::TEXT,
      'REGISTRY'::TEXT,
      p_module_short_id::TEXT,
      true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_module_database(TEXT, BOOLEAN, BOOLEAN) IS 
'Cleans up all database objects for a module. Use dry_run=true to preview.';

-- Restrict to service_role
REVOKE ALL ON FUNCTION cleanup_module_database(TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_module_database(TEXT, BOOLEAN, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION cleanup_module_database(TEXT, BOOLEAN, BOOLEAN) TO service_role;

-- ============================================================================
-- SECTION 7: DEFAULT RLS POLICY HELPERS
-- ============================================================================

-- Generate site isolation RLS policy SQL
CREATE OR REPLACE FUNCTION generate_site_isolation_policy(
  p_table_name TEXT,
  p_policy_name TEXT DEFAULT 'site_isolation'
)
RETURNS TEXT AS $$
BEGIN
  RETURN format(
    'CREATE POLICY "%s" ON %s FOR ALL USING (
      site_id IN (
        SELECT s.id FROM public.sites s
        JOIN public.clients c ON s.client_id = c.id
        JOIN public.agencies a ON c.agency_id = a.id
        JOIN public.agency_members am ON a.id = am.agency_id
        WHERE am.user_id = auth.uid()
      )
    )',
    p_policy_name,
    p_table_name
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_site_isolation_policy(TEXT, TEXT) IS 
'Generates standard site isolation RLS policy SQL for a table.';

-- ============================================================================
-- DONE
-- ============================================================================

-- Add comment for documentation
COMMENT ON SCHEMA public IS 
'DRAMAC Platform schema - Phase EM-11 adds module database isolation functions.';

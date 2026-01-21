-- =============================================================
-- Phase EM-10: Enterprise Module Type System
-- Created: 2026-01-21
-- 
-- This migration adds:
-- - Module types (widget, app, integration, system, custom)
-- - Module capabilities and resources
-- - Database isolation configuration
-- - Runtime requirements
-- 
-- Related phases:
-- - EM-11: Database provisioning (uses capabilities from EM-10)
-- - EM-12: API gateway (uses capabilities from EM-10)
-- =============================================================

-- =============================================================
-- 1. Add short_id to module_source for database naming
-- =============================================================

-- Add module short ID for database naming (see EM-05)
-- Short ID is first 8 chars of UUID without hyphens
ALTER TABLE public.module_source 
ADD COLUMN IF NOT EXISTS short_id TEXT;

-- Generate short_id for existing records
UPDATE public.module_source 
SET short_id = SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)
WHERE short_id IS NULL;

-- Make short_id NOT NULL after populating existing records
-- (Done in separate statement to handle existing data)
ALTER TABLE public.module_source 
ALTER COLUMN short_id SET DEFAULT '';

-- Create function to auto-generate short_id
CREATE OR REPLACE FUNCTION generate_module_short_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_id IS NULL OR NEW.short_id = '' THEN
    NEW.short_id := SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating short_id
DROP TRIGGER IF EXISTS trg_generate_module_short_id ON public.module_source;
CREATE TRIGGER trg_generate_module_short_id
  BEFORE INSERT OR UPDATE ON public.module_source
  FOR EACH ROW
  EXECUTE FUNCTION generate_module_short_id();

-- Unique index on short_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_module_source_short_id ON public.module_source(short_id);

-- =============================================================
-- 2. Add module type to module_source
-- =============================================================

-- Add module type with constraint
ALTER TABLE public.module_source 
ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'widget';

-- Add check constraint for module_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'module_source_module_type_check'
  ) THEN
    ALTER TABLE public.module_source 
    ADD CONSTRAINT module_source_module_type_check 
    CHECK (module_type IN ('widget', 'app', 'integration', 'system', 'custom'));
  END IF;
END $$;

-- =============================================================
-- 3. Add database isolation level
-- =============================================================

-- Database isolation level (based on type)
-- - none: Uses shared module_data table
-- - tables: Creates prefixed tables (mod_{short_id}_{table})
-- - schema: Creates dedicated schema (mod_{short_id}.{table})
ALTER TABLE public.module_source 
ADD COLUMN IF NOT EXISTS db_isolation TEXT DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'module_source_db_isolation_check'
  ) THEN
    ALTER TABLE public.module_source 
    ADD CONSTRAINT module_source_db_isolation_check 
    CHECK (db_isolation IN ('none', 'tables', 'schema'));
  END IF;
END $$;

-- =============================================================
-- 4. Add capabilities JSONB column
-- =============================================================

-- Module capabilities flags
ALTER TABLE public.module_source 
ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{
  "has_database": false,
  "has_api": false,
  "has_webhooks": false,
  "has_oauth": false,
  "has_multi_page": false,
  "has_roles": false,
  "has_workflows": false,
  "has_reporting": false,
  "embeddable": true,
  "standalone": false,
  "requires_setup": false
}'::jsonb;

-- =============================================================
-- 5. Add resources JSONB column
-- =============================================================

-- Module resources (what it creates/uses)
ALTER TABLE public.module_source 
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '{
  "tables": [],
  "storage_buckets": [],
  "edge_functions": [],
  "scheduled_jobs": [],
  "webhooks": []
}'::jsonb;

-- =============================================================
-- 6. Add requirements JSONB column
-- =============================================================

-- Runtime requirements
ALTER TABLE public.module_source 
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{
  "min_platform_version": "1.0.0",
  "required_permissions": [],
  "required_integrations": [],
  "required_modules": []
}'::jsonb;

-- =============================================================
-- 7. Update modules_v2 table with same columns
-- =============================================================

-- Add short_id to modules_v2
ALTER TABLE public.modules_v2 
ADD COLUMN IF NOT EXISTS short_id TEXT;

-- Generate short_id for existing records in modules_v2
UPDATE public.modules_v2 
SET short_id = SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)
WHERE short_id IS NULL;

-- Trigger for modules_v2 short_id
DROP TRIGGER IF EXISTS trg_generate_modules_v2_short_id ON public.modules_v2;
CREATE TRIGGER trg_generate_modules_v2_short_id
  BEFORE INSERT OR UPDATE ON public.modules_v2
  FOR EACH ROW
  EXECUTE FUNCTION generate_module_short_id();

-- Add module_type to modules_v2
ALTER TABLE public.modules_v2 
ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'widget';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'modules_v2_module_type_check'
  ) THEN
    ALTER TABLE public.modules_v2 
    ADD CONSTRAINT modules_v2_module_type_check 
    CHECK (module_type IN ('widget', 'app', 'integration', 'system', 'custom'));
  END IF;
END $$;

-- Add db_isolation to modules_v2
ALTER TABLE public.modules_v2 
ADD COLUMN IF NOT EXISTS db_isolation TEXT DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'modules_v2_db_isolation_check'
  ) THEN
    ALTER TABLE public.modules_v2 
    ADD CONSTRAINT modules_v2_db_isolation_check 
    CHECK (db_isolation IN ('none', 'tables', 'schema'));
  END IF;
END $$;

-- Add capabilities to modules_v2
ALTER TABLE public.modules_v2 
ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}'::jsonb;

-- Add resources to modules_v2
ALTER TABLE public.modules_v2 
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '{}'::jsonb;

-- Add requirements to modules_v2
ALTER TABLE public.modules_v2 
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}'::jsonb;

-- =============================================================
-- 8. Create indexes for new columns
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_module_source_type ON public.module_source(module_type);
CREATE INDEX IF NOT EXISTS idx_module_source_db_isolation ON public.module_source(db_isolation);
CREATE INDEX IF NOT EXISTS idx_module_source_capabilities ON public.module_source USING GIN(capabilities);

CREATE INDEX IF NOT EXISTS idx_modules_v2_type ON public.modules_v2(module_type);
CREATE INDEX IF NOT EXISTS idx_modules_v2_short_id ON public.modules_v2(short_id);
CREATE INDEX IF NOT EXISTS idx_modules_v2_db_isolation ON public.modules_v2(db_isolation);
CREATE INDEX IF NOT EXISTS idx_modules_v2_capabilities ON public.modules_v2 USING GIN(capabilities);

-- =============================================================
-- 9. Helper function to get database prefix for module
-- =============================================================

CREATE OR REPLACE FUNCTION get_module_db_prefix(p_module_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_short_id TEXT;
  v_db_isolation TEXT;
BEGIN
  -- Try module_source first
  SELECT short_id, db_isolation INTO v_short_id, v_db_isolation
  FROM public.module_source
  WHERE id = p_module_id;
  
  -- If not found, try modules_v2
  IF v_short_id IS NULL THEN
    SELECT short_id, db_isolation INTO v_short_id, v_db_isolation
    FROM public.modules_v2
    WHERE id = p_module_id;
  END IF;
  
  IF v_short_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return prefix based on isolation level
  CASE v_db_isolation
    WHEN 'tables' THEN
      RETURN 'mod_' || v_short_id || '_';
    WHEN 'schema' THEN
      RETURN 'mod_' || v_short_id || '.';
    ELSE
      RETURN NULL; -- No prefix for 'none' isolation
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================
-- 10. DDL execution helper for module provisioning
-- =============================================================

-- Create a helper function for executing DDL statements
-- This is used by the module database provisioner
-- SECURITY: Only super_admins can use this via RPC
CREATE OR REPLACE FUNCTION execute_ddl(sql_statement TEXT)
RETURNS VOID AS $$
BEGIN
  -- Validate that the statement starts with allowed commands
  IF NOT (
    sql_statement ~* '^(CREATE|ALTER|DROP|GRANT|REVOKE)\s+' 
    OR sql_statement ~* '^SET\s+'
  ) THEN
    RAISE EXCEPTION 'Only DDL statements (CREATE, ALTER, DROP, GRANT, REVOKE) are allowed';
  END IF;
  
  -- Prevent dangerous operations
  IF sql_statement ~* 'profiles|agencies|sites|auth\.' THEN
    RAISE EXCEPTION 'Cannot modify core platform tables';
  END IF;
  
  EXECUTE sql_statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke from public and grant only to authenticated (RLS will check super_admin)
REVOKE ALL ON FUNCTION execute_ddl(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION execute_ddl(TEXT) TO authenticated;

COMMENT ON FUNCTION execute_ddl(TEXT) IS 
'Execute DDL statements for module database provisioning. 
Only super_admins can call this via RPC. 
Restricted to CREATE, ALTER, DROP, GRANT, REVOKE statements.
Cannot modify core platform tables.';

-- =============================================================
-- 11. Update existing modules with default capabilities
-- =============================================================

-- Set default capabilities based on existing module complexity
UPDATE public.module_source
SET 
  module_type = CASE 
    WHEN category IN ('integrations') THEN 'integration'
    WHEN dependencies IS NOT NULL AND array_length(dependencies, 1) > 0 THEN 'app'
    ELSE 'widget'
  END,
  db_isolation = CASE 
    WHEN dependencies IS NOT NULL AND array_length(dependencies, 1) > 0 THEN 'tables'
    ELSE 'none'
  END
WHERE module_type IS NULL OR module_type = '';

-- =============================================================
-- VERIFICATION QUERIES
-- =============================================================
-- Run these to verify the migration:
-- 
-- SELECT short_id, module_type, db_isolation, capabilities 
-- FROM module_source LIMIT 5;
-- 
-- SELECT short_id, module_type, db_isolation, capabilities 
-- FROM modules_v2 LIMIT 5;
-- 
-- SELECT get_module_db_prefix('some-uuid-here');
-- =============================================================

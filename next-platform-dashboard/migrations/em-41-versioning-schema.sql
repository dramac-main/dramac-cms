-- =============================================================
-- Phase EM-41: Module Versioning & Rollback System
-- =============================================================
-- This migration extends the existing module_versions table and adds
-- comprehensive versioning, migrations, and rollback support.
-- Prerequisites: EM-01, EM-05, EM-11
-- =============================================================

-- =============================================================
-- SECTION 1: EXTEND module_versions TABLE
-- =============================================================
-- Add additional columns to existing module_versions table

-- Add version parsing columns if they don't exist
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS version_major INTEGER;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS version_minor INTEGER;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS version_patch INTEGER;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS prerelease TEXT;

-- Add bundle/content columns
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS bundle_url TEXT;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS bundle_hash TEXT;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS release_notes TEXT;

-- Add compatibility columns
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS breaking_description TEXT;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '{}';

-- Add status management
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS active_installs INTEGER DEFAULT 0;

-- Add publishing info
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE module_versions ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES profiles(id);

-- Add check constraint for status if not exists (wrap in DO block for safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'module_versions_status_check'
  ) THEN
    ALTER TABLE module_versions ADD CONSTRAINT module_versions_status_check 
      CHECK (status IN ('draft', 'published', 'deprecated', 'yanked'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update existing rows to parse version into components
UPDATE module_versions 
SET 
  version_major = COALESCE(
    NULLIF(SPLIT_PART(version, '.', 1), '')::INTEGER, 
    0
  ),
  version_minor = COALESCE(
    NULLIF(SPLIT_PART(version, '.', 2), '')::INTEGER, 
    0
  ),
  version_patch = COALESCE(
    NULLIF(SPLIT_PART(SPLIT_PART(version, '.', 3), '-', 1), '')::INTEGER, 
    0
  ),
  prerelease = CASE 
    WHEN version LIKE '%-%' THEN SPLIT_PART(version, '-', 2)
    ELSE NULL
  END,
  status = COALESCE(status, 'published')
WHERE version_major IS NULL;

-- =============================================================
-- SECTION 2: MODULE MIGRATIONS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS module_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Version range
  from_version TEXT,                   -- null for initial
  to_version TEXT NOT NULL,
  
  -- Migration content
  up_sql TEXT NOT NULL,                -- Forward migration
  down_sql TEXT,                       -- Rollback migration (optional)
  
  -- Metadata
  description TEXT,
  is_reversible BOOLEAN DEFAULT true,
  requires_maintenance BOOLEAN DEFAULT false,  -- Needs downtime
  estimated_duration_seconds INTEGER DEFAULT 30,
  
  -- Execution order
  sequence INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, sequence)
);

-- Index for migrations lookup
CREATE INDEX IF NOT EXISTS idx_module_migrations_module 
  ON module_migrations(module_id);
CREATE INDEX IF NOT EXISTS idx_module_migrations_version 
  ON module_migrations(module_id, to_version);

-- =============================================================
-- SECTION 3: SITE MODULE VERSION INSTALLATIONS
-- =============================================================
-- Track which version of a module is installed on each site
CREATE TABLE IF NOT EXISTS site_module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_module_id UUID NOT NULL,        -- References site_module_installations or site_modules
  version_id UUID NOT NULL REFERENCES module_versions(id) ON DELETE RESTRICT,
  
  -- Status
  status TEXT DEFAULT 'installing' CHECK (status IN (
    'installing', 'active', 'pending_rollback', 'rolled_back', 'failed'
  )),
  
  -- Timestamps
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  
  installed_by UUID REFERENCES profiles(id),
  
  UNIQUE(site_module_id, version_id)
);

CREATE INDEX IF NOT EXISTS idx_site_module_versions_active 
  ON site_module_versions(site_module_id, status)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_site_module_versions_site_module 
  ON site_module_versions(site_module_id);

-- =============================================================
-- SECTION 4: DATA BACKUPS TABLE
-- =============================================================
-- Store backups for rollback capability
CREATE TABLE IF NOT EXISTS module_data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  version TEXT NOT NULL,
  
  -- Backup type
  type TEXT DEFAULT 'auto' CHECK (type IN ('auto', 'manual', 'pre_upgrade')),
  
  -- Storage
  backup_url TEXT NOT NULL,           -- Storage URL
  size_bytes BIGINT,
  
  -- Metadata
  table_counts JSONB DEFAULT '{}',    -- {table_name: row_count}
  
  -- Retention
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_module_data_backups_site 
  ON module_data_backups(site_id, module_id);
CREATE INDEX IF NOT EXISTS idx_module_data_backups_expires 
  ON module_data_backups(expires_at) WHERE expires_at IS NOT NULL;

-- =============================================================
-- SECTION 5: MIGRATION EXECUTION LOG
-- =============================================================
CREATE TABLE IF NOT EXISTS module_migration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  migration_id UUID NOT NULL REFERENCES module_migrations(id),
  
  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  
  -- Execution
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Result
  status TEXT DEFAULT 'running' CHECK (status IN (
    'running', 'success', 'failed', 'rolled_back'
  )),
  error_message TEXT,
  
  -- Backup reference
  backup_id UUID REFERENCES module_data_backups(id),
  
  executed_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_migration_runs_site 
  ON module_migration_runs(site_id, module_id);
CREATE INDEX IF NOT EXISTS idx_migration_runs_status 
  ON module_migration_runs(status);

-- =============================================================
-- SECTION 6: HELPER FUNCTIONS
-- =============================================================

-- Get current active version for a site module
CREATE OR REPLACE FUNCTION get_active_module_version(p_site_module_id UUID)
RETURNS UUID AS $$
  SELECT version_id 
  FROM site_module_versions 
  WHERE site_module_id = p_site_module_id 
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Parse semver string into components
CREATE OR REPLACE FUNCTION parse_semver(version_str TEXT)
RETURNS TABLE (
  major INTEGER,
  minor INTEGER,
  patch INTEGER,
  prerelease TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(NULLIF(SPLIT_PART(version_str, '.', 1), '')::INTEGER, 0),
    COALESCE(NULLIF(SPLIT_PART(version_str, '.', 2), '')::INTEGER, 0),
    COALESCE(NULLIF(SPLIT_PART(SPLIT_PART(version_str, '.', 3), '-', 1), '')::INTEGER, 0),
    CASE 
      WHEN version_str LIKE '%-%' THEN SPLIT_PART(version_str, '-', 2)
      ELSE NULL
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Compare two semver versions
-- Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
CREATE OR REPLACE FUNCTION compare_semver(v1 TEXT, v2 TEXT)
RETURNS INTEGER AS $$
DECLARE
  v1_parts RECORD;
  v2_parts RECORD;
BEGIN
  SELECT * INTO v1_parts FROM parse_semver(v1);
  SELECT * INTO v2_parts FROM parse_semver(v2);
  
  IF v1_parts.major != v2_parts.major THEN
    RETURN CASE WHEN v1_parts.major > v2_parts.major THEN 1 ELSE -1 END;
  END IF;
  
  IF v1_parts.minor != v2_parts.minor THEN
    RETURN CASE WHEN v1_parts.minor > v2_parts.minor THEN 1 ELSE -1 END;
  END IF;
  
  IF v1_parts.patch != v2_parts.patch THEN
    RETURN CASE WHEN v1_parts.patch > v2_parts.patch THEN 1 ELSE -1 END;
  END IF;
  
  -- Handle prerelease (null = release, which is > prerelease)
  IF v1_parts.prerelease IS NULL AND v2_parts.prerelease IS NOT NULL THEN
    RETURN 1;
  ELSIF v1_parts.prerelease IS NOT NULL AND v2_parts.prerelease IS NULL THEN
    RETURN -1;
  ELSIF v1_parts.prerelease IS NOT NULL AND v2_parts.prerelease IS NOT NULL THEN
    IF v1_parts.prerelease > v2_parts.prerelease THEN RETURN 1;
    ELSIF v1_parts.prerelease < v2_parts.prerelease THEN RETURN -1;
    END IF;
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get latest version for a module
CREATE OR REPLACE FUNCTION get_latest_module_version(
  p_module_source_id UUID,
  p_include_prerelease BOOLEAN DEFAULT false
)
RETURNS module_versions AS $$
DECLARE
  result module_versions%ROWTYPE;
BEGIN
  SELECT * INTO result
  FROM module_versions
  WHERE module_source_id = p_module_source_id
    AND (status = 'published' OR status IS NULL)
    AND (p_include_prerelease OR prerelease IS NULL)
  ORDER BY version_major DESC, version_minor DESC, version_patch DESC
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if version satisfies constraint (basic implementation)
-- Supports: ^1.0.0, ~1.0.0, >=1.0.0, <=1.0.0, >1.0.0, <1.0.0, 1.0.0
CREATE OR REPLACE FUNCTION version_satisfies(
  version_str TEXT,
  constraint_str TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  constraint_version TEXT;
  v_parts RECORD;
  c_parts RECORD;
  comparison INTEGER;
BEGIN
  -- Handle exact match
  IF constraint_str !~ '^[\^~<>=]' THEN
    RETURN version_str = constraint_str;
  END IF;
  
  -- Extract version from constraint
  constraint_version := REGEXP_REPLACE(constraint_str, '^[\^~<>=]+', '');
  
  SELECT * INTO v_parts FROM parse_semver(version_str);
  SELECT * INTO c_parts FROM parse_semver(constraint_version);
  
  comparison := compare_semver(version_str, constraint_version);
  
  -- Handle caret (^) - compatible with version
  IF constraint_str LIKE '^%' THEN
    RETURN v_parts.major = c_parts.major 
      AND compare_semver(version_str, constraint_version) >= 0;
  END IF;
  
  -- Handle tilde (~) - approximately equivalent
  IF constraint_str LIKE '~%' THEN
    RETURN v_parts.major = c_parts.major 
      AND v_parts.minor = c_parts.minor
      AND compare_semver(version_str, constraint_version) >= 0;
  END IF;
  
  -- Handle comparisons
  IF constraint_str LIKE '>=%' THEN
    RETURN comparison >= 0;
  ELSIF constraint_str LIKE '<=%' THEN
    RETURN comparison <= 0;
  ELSIF constraint_str LIKE '>%' THEN
    RETURN comparison > 0;
  ELSIF constraint_str LIKE '<%' THEN
    RETURN comparison < 0;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================
-- SECTION 7: RLS POLICIES
-- =============================================================

-- Enable RLS on new tables
ALTER TABLE module_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_module_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_migration_runs ENABLE ROW LEVEL SECURITY;

-- Module migrations - read by all authenticated, write by super admins
CREATE POLICY "module_migrations_select" ON module_migrations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "module_migrations_all" ON module_migrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Site module versions - access based on site membership
CREATE POLICY "site_module_versions_select" ON site_module_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_module_installations smi
      JOIN sites s ON s.id = smi.site_id
      JOIN clients c ON c.id = s.client_id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE smi.id = site_module_versions.site_module_id
        AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "site_module_versions_all" ON site_module_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM site_module_installations smi
      JOIN sites s ON s.id = smi.site_id
      JOIN clients c ON c.id = s.client_id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE smi.id = site_module_versions.site_module_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  );

-- Data backups - access based on site membership
CREATE POLICY "module_data_backups_select" ON module_data_backups
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON c.id = s.client_id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE s.id = module_data_backups.site_id
        AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "module_data_backups_all" ON module_data_backups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON c.id = s.client_id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE s.id = module_data_backups.site_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  );

-- Migration runs - same as backups
CREATE POLICY "module_migration_runs_select" ON module_migration_runs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON c.id = s.client_id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE s.id = module_migration_runs.site_id
        AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "module_migration_runs_all" ON module_migration_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON c.id = s.client_id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE s.id = module_migration_runs.site_id
        AND am.user_id = auth.uid()
        AND am.role IN ('owner', 'admin')
    )
  );

-- =============================================================
-- SECTION 8: TRIGGER FOR VERSION PARSING
-- =============================================================

-- Auto-parse version on insert/update
CREATE OR REPLACE FUNCTION parse_version_trigger()
RETURNS TRIGGER AS $$
DECLARE
  parts RECORD;
BEGIN
  SELECT * INTO parts FROM parse_semver(NEW.version);
  
  NEW.version_major := parts.major;
  NEW.version_minor := parts.minor;
  NEW.version_patch := parts.patch;
  NEW.prerelease := parts.prerelease;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS module_versions_parse_trigger ON module_versions;
CREATE TRIGGER module_versions_parse_trigger
  BEFORE INSERT OR UPDATE OF version ON module_versions
  FOR EACH ROW
  EXECUTE FUNCTION parse_version_trigger();

-- =============================================================
-- COMMENTS
-- =============================================================
COMMENT ON TABLE module_migrations IS 'Database migrations for each module version';
COMMENT ON TABLE site_module_versions IS 'Tracks which version of a module is installed on each site';
COMMENT ON TABLE module_data_backups IS 'Backup storage for module data before upgrades/rollbacks';
COMMENT ON TABLE module_migration_runs IS 'Log of executed migrations per site';
COMMENT ON FUNCTION get_active_module_version IS 'Returns the currently active version ID for a site module';
COMMENT ON FUNCTION parse_semver IS 'Parses a semver string into major, minor, patch, prerelease components';
COMMENT ON FUNCTION compare_semver IS 'Compares two semver strings: 1 if v1>v2, -1 if v1<v2, 0 if equal';
COMMENT ON FUNCTION version_satisfies IS 'Checks if a version satisfies a constraint (^, ~, >=, <=, >, <)';

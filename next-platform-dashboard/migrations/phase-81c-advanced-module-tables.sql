-- ============================================================================
-- Phase 81C: Advanced Module Development Tables
-- ============================================================================
-- This migration creates tables for multi-file modules, dependencies, 
-- API routes, storage quotas, webhooks, and module dependency resolution.
-- Note: Uses 'agency_members' table (not 'agency_members')
-- ============================================================================

-- ============================================================================
-- 📁 MODULE FILES (Multi-file support)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  -- e.g., "src/components/Widget.tsx"
  file_type TEXT NOT NULL CHECK (file_type IN ('typescript', 'javascript', 'css', 'json', 'markdown', 'image', 'svg', 'html')),
  content TEXT,
  -- For text files
  storage_url TEXT,
  -- For binary files (stored in Supabase Storage)
  size_bytes INTEGER DEFAULT 0,
  checksum TEXT,
  -- SHA256 hash for integrity
  is_entry_point BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_source_id, file_path)
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_module_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_module_files_updated_at ON module_files;
CREATE TRIGGER trigger_module_files_updated_at
  BEFORE UPDATE ON module_files
  FOR EACH ROW
  EXECUTE FUNCTION update_module_files_updated_at();

-- ============================================================================
-- 📦 MODULE DEPENDENCIES (NPM packages via CDN)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  version TEXT NOT NULL,
  cdn_url TEXT,
  -- esm.sh or unpkg URL
  cdn_provider TEXT DEFAULT 'esm' CHECK (cdn_provider IN ('esm', 'unpkg', 'skypack', 'jsdelivr')),
  is_dev_dependency BOOLEAN DEFAULT false,
  is_peer_dependency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_source_id, package_name)
);

-- ============================================================================
-- 🌐 MODULE API ROUTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_api_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  route_path TEXT NOT NULL,
  -- e.g., "/submit", "/webhook"
  methods TEXT[] NOT NULL DEFAULT ARRAY['GET'],
  handler_code TEXT NOT NULL,
  requires_auth BOOLEAN DEFAULT true,
  rate_limit_requests INTEGER DEFAULT 100,
  rate_limit_window_ms INTEGER DEFAULT 60000,
  -- 1 minute
  allowed_origins TEXT[] DEFAULT '{}',
  -- CORS origins
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_source_id, route_path)
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_module_api_routes_updated_at ON module_api_routes;
CREATE TRIGGER trigger_module_api_routes_updated_at
  BEFORE UPDATE ON module_api_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_module_files_updated_at();

-- ============================================================================
-- 💾 MODULE STORAGE BUCKETS (Per-module, per-site quotas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_storage_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  -- Can be module_source.id or modules_v2.id
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  max_size_bytes BIGINT DEFAULT 104857600,
  -- 100MB default
  used_size_bytes BIGINT DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, site_id)
);

-- ============================================================================
-- 🔗 MODULE WEBHOOKS (External integrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Webhook identification
  webhook_name TEXT NOT NULL,
  -- e.g., 'stripe_payment', 'zapier_trigger'
  endpoint_path TEXT NOT NULL,
  -- e.g., '/webhook/stripe'
  secret TEXT NOT NULL,
  -- For signature verification (generate with gen_random_uuid() or external)
  
  -- Configuration
  allowed_sources TEXT[] DEFAULT '{}',
  -- IP whitelist (optional)
  expected_headers JSONB DEFAULT '{}',
  -- Headers to verify
  signature_header TEXT,
  -- Which header contains the signature
  signature_algorithm TEXT DEFAULT 'sha256',
  -- 'sha256', 'sha1', etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  -- Error tracking
  last_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_source_id, site_id, endpoint_path)
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_module_webhooks_updated_at ON module_webhooks;
CREATE TRIGGER trigger_module_webhooks_updated_at
  BEFORE UPDATE ON module_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_module_files_updated_at();

-- ============================================================================
-- 📋 WEBHOOK EVENT LOG (For debugging)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES module_webhooks(id) ON DELETE CASCADE,
  
  -- Request details
  request_method TEXT NOT NULL,
  request_headers JSONB,
  request_body TEXT,
  request_ip TEXT,
  request_query JSONB,
  
  -- Response details
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,
  
  -- Timing
  processing_time_ms INTEGER,
  
  -- Status
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  error_stack TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM module_webhook_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 🔄 MODULE INTER-DEPENDENCIES (Module depends on other modules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_dependencies_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  depends_on_module_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  
  dependency_type TEXT NOT NULL DEFAULT 'required' CHECK (dependency_type IN ('required', 'optional', 'peer')),
  min_version TEXT,
  -- Minimum required version (semver)
  max_version TEXT,
  -- Maximum compatible version (semver)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_source_id, depends_on_module_id),
  -- Prevent self-dependency
  CHECK (module_source_id != depends_on_module_id)
);

-- ============================================================================
-- 📊 MODULE DATA STORAGE (Generic key-value for module state)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  -- module_source.id or slug
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  data_key TEXT NOT NULL,
  data_value JSONB,
  data_type TEXT DEFAULT 'json' CHECK (data_type IN ('json', 'text', 'number', 'boolean', 'array')),
  expires_at TIMESTAMPTZ,
  -- Optional TTL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, site_id, data_key)
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_module_data_updated_at ON module_data;
CREATE TRIGGER trigger_module_data_updated_at
  BEFORE UPDATE ON module_data
  FOR EACH ROW
  EXECUTE FUNCTION update_module_files_updated_at();

-- ============================================================================
-- 🔐 MODULE SECRETS (Encrypted storage for API keys, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  secret_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  -- Encrypted with platform key
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, site_id, secret_name)
);

-- ============================================================================
-- 🎯 MODULE EVENTS (For pub/sub between modules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  source_module_id TEXT NOT NULL,
  target_module_id TEXT,
  -- NULL = broadcast to all
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup old events (keep last 7 days)
CREATE INDEX idx_module_events_cleanup ON module_events(created_at) WHERE processed = true;

-- ============================================================================
-- 📑 MODULE MANIFEST (Parsed manifest.json storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE UNIQUE,
  
  -- Core manifest fields
  manifest_version TEXT DEFAULT '1.0.0',
  entry_point TEXT DEFAULT 'src/index.tsx',
  main_component TEXT DEFAULT 'default',
  
  -- Permissions requested
  permissions TEXT[] DEFAULT '{}',
  -- e.g., ['storage:read', 'storage:write', 'api:call']
  
  -- UI configuration
  render_mode TEXT DEFAULT 'iframe' CHECK (render_mode IN ('iframe', 'inline', 'modal', 'drawer')),
  default_width TEXT,
  default_height TEXT,
  resizable BOOLEAN DEFAULT true,
  
  -- Feature flags
  supports_dark_mode BOOLEAN DEFAULT true,
  supports_mobile BOOLEAN DEFAULT true,
  supports_offline BOOLEAN DEFAULT false,
  
  -- Build configuration
  build_target TEXT DEFAULT 'es2020',
  minify BOOLEAN DEFAULT true,
  source_maps BOOLEAN DEFAULT false,
  
  -- Raw manifest JSON (backup)
  raw_manifest JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 🗂️ INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_module_files_module ON module_files(module_source_id);
CREATE INDEX IF NOT EXISTS idx_module_files_path ON module_files(module_source_id, file_path);
CREATE INDEX IF NOT EXISTS idx_module_files_entry ON module_files(module_source_id) WHERE is_entry_point = true;

CREATE INDEX IF NOT EXISTS idx_module_deps_module ON module_dependencies(module_source_id);
CREATE INDEX IF NOT EXISTS idx_module_deps_package ON module_dependencies(package_name);

CREATE INDEX IF NOT EXISTS idx_module_routes_module ON module_api_routes(module_source_id);
CREATE INDEX IF NOT EXISTS idx_module_routes_path ON module_api_routes(module_source_id, route_path);
CREATE INDEX IF NOT EXISTS idx_module_routes_enabled ON module_api_routes(module_source_id) WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_module_storage_module ON module_storage_buckets(module_id, site_id);

CREATE INDEX IF NOT EXISTS idx_module_webhooks_site ON module_webhooks(site_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_module_webhooks_lookup ON module_webhooks(module_source_id, site_id, endpoint_path);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON module_webhook_logs(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_success ON module_webhook_logs(webhook_id, success);

CREATE INDEX IF NOT EXISTS idx_module_deps_graph_module ON module_dependencies_graph(module_source_id);
CREATE INDEX IF NOT EXISTS idx_module_deps_graph_depends ON module_dependencies_graph(depends_on_module_id);

CREATE INDEX IF NOT EXISTS idx_module_data_lookup ON module_data(module_id, site_id, data_key);
CREATE INDEX IF NOT EXISTS idx_module_data_expires ON module_data(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_module_secrets_lookup ON module_secrets(module_id, site_id);

CREATE INDEX IF NOT EXISTS idx_module_events_pending ON module_events(site_id, processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_module_events_target ON module_events(target_module_id, processed) WHERE processed = false;

-- ============================================================================
-- 🔒 ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE module_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_api_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_storage_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_dependencies_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_manifests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for module_files
-- ============================================================================
CREATE POLICY "module_files_select" ON module_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      LEFT JOIN profiles p ON ms.created_by = p.id
      WHERE ms.id = module_files.module_source_id
      AND (
        ms.created_by = auth.uid()
        OR p.agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
          UNION
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

CREATE POLICY "module_files_insert" ON module_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_files.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_files_update" ON module_files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_files.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_files_delete" ON module_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_files.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_dependencies
-- ============================================================================
CREATE POLICY "module_deps_select" ON module_dependencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      LEFT JOIN profiles p ON ms.created_by = p.id
      WHERE ms.id = module_dependencies.module_source_id
      AND (
        ms.created_by = auth.uid()
        OR p.agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
          UNION
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

CREATE POLICY "module_deps_insert" ON module_dependencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_dependencies.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_deps_update" ON module_dependencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_dependencies.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_deps_delete" ON module_dependencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_dependencies.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_api_routes
-- ============================================================================
CREATE POLICY "module_routes_select" ON module_api_routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      LEFT JOIN profiles p ON ms.created_by = p.id
      WHERE ms.id = module_api_routes.module_source_id
      AND (
        ms.created_by = auth.uid()
        OR p.agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
          UNION
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

CREATE POLICY "module_routes_insert" ON module_api_routes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_api_routes.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_routes_update" ON module_api_routes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_api_routes.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_routes_delete" ON module_api_routes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_api_routes.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_storage_buckets
-- ============================================================================
CREATE POLICY "module_storage_select" ON module_storage_buckets FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_storage_insert" ON module_storage_buckets FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_storage_update" ON module_storage_buckets FOR UPDATE
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_webhooks
-- ============================================================================
CREATE POLICY "module_webhooks_select" ON module_webhooks FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_webhooks_insert" ON module_webhooks FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_webhooks_update" ON module_webhooks FOR UPDATE
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_webhooks_delete" ON module_webhooks FOR DELETE
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_webhook_logs
-- ============================================================================
CREATE POLICY "webhook_logs_select" ON module_webhook_logs FOR SELECT
  USING (
    webhook_id IN (
      SELECT mw.id FROM module_webhooks mw
      WHERE mw.site_id IN (
        SELECT s.id FROM sites s
        JOIN clients c ON s.client_id = c.id
        WHERE c.agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
          UNION
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_data
-- ============================================================================
CREATE POLICY "module_data_select" ON module_data FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_data_insert" ON module_data FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_data_update" ON module_data FOR UPDATE
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_data_delete" ON module_data FOR DELETE
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_secrets (more restrictive - owner/admin only)
-- ============================================================================
CREATE POLICY "module_secrets_select" ON module_secrets FOR SELECT
  USING (
    created_by = auth.uid()
    OR site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_secrets_insert" ON module_secrets FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_secrets_update" ON module_secrets FOR UPDATE
  USING (
    created_by = auth.uid()
    OR site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_secrets_delete" ON module_secrets FOR DELETE
  USING (
    created_by = auth.uid()
    OR site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid() AND am.role IN ('owner', 'admin')
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_events
-- ============================================================================
CREATE POLICY "module_events_select" ON module_events FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_events_insert" ON module_events FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_manifests
-- ============================================================================
CREATE POLICY "module_manifests_select" ON module_manifests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      LEFT JOIN profiles p ON ms.created_by = p.id
      WHERE ms.id = module_manifests.module_source_id
      AND (
        ms.created_by = auth.uid()
        OR p.agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
          UNION
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

CREATE POLICY "module_manifests_insert" ON module_manifests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_manifests.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "module_manifests_update" ON module_manifests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_manifests.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS Policies for module_dependencies_graph
-- ============================================================================
CREATE POLICY "deps_graph_select" ON module_dependencies_graph FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      LEFT JOIN profiles p ON ms.created_by = p.id
      WHERE ms.id = module_dependencies_graph.module_source_id
      AND (
        ms.created_by = auth.uid()
        OR p.agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
          UNION
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
        OR ms.status = 'published'
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
      )
    )
  );

CREATE POLICY "deps_graph_insert" ON module_dependencies_graph FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_dependencies_graph.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "deps_graph_delete" ON module_dependencies_graph FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_dependencies_graph.module_source_id
      AND ms.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- 🎉 DONE
-- ============================================================================

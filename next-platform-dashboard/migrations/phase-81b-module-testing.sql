-- Phase 81B: Module Testing System
-- Creates tables for test sites, beta enrollment, and test runs

-- Test site configuration
CREATE TABLE IF NOT EXISTS test_site_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  test_features TEXT[] DEFAULT '{}',
  -- Features: beta_modules, experimental_ui, debug_mode, analytics_testing
  allowed_module_statuses TEXT[] DEFAULT ARRAY['published', 'testing'],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  UNIQUE(site_id)
);

-- Beta program enrollment
CREATE TABLE IF NOT EXISTS beta_enrollment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  beta_tier TEXT NOT NULL DEFAULT 'standard',
  -- Tiers: internal, alpha, early_access, standard
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{}',
  -- { receive_notifications: true, auto_enroll_new_betas: false }
  accepted_modules TEXT[] DEFAULT '{}',
  -- Specific modules they've opted into
  UNIQUE(agency_id)
);

-- Module test runs
CREATE TABLE IF NOT EXISTS module_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  module_version TEXT NOT NULL,
  test_type TEXT NOT NULL,
  -- Types: unit, integration, performance, accessibility, security
  test_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status: pending, running, passed, failed, error
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES auth.users(id),
  environment JSONB DEFAULT '{}',
  -- { browser: 'chrome', viewport: '1920x1080', user_agent: '...' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test results (detailed)
CREATE TABLE IF NOT EXISTS module_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_run_id UUID NOT NULL REFERENCES module_test_runs(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL,
  -- Categories: render, settings, api, performance, security, structure, syntax, quality, configuration, documentation, integration, accessibility
  status TEXT NOT NULL,
  -- Status: passed, failed, skipped, warning
  duration_ms INTEGER,
  message TEXT,
  details JSONB DEFAULT '{}',
  -- { expected: '...', actual: '...', screenshot_url: '...' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_site_config_site ON test_site_configuration(site_id);
CREATE INDEX IF NOT EXISTS idx_test_site_config_active ON test_site_configuration(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_beta_enrollment_agency ON beta_enrollment(agency_id);
CREATE INDEX IF NOT EXISTS idx_beta_enrollment_active ON beta_enrollment(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_test_runs_module ON module_test_runs(module_source_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON module_test_runs(status);
CREATE INDEX IF NOT EXISTS idx_test_runs_created ON module_test_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_run ON module_test_results(test_run_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON module_test_results(status);

-- RLS Policies
ALTER TABLE test_site_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_test_results ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins manage test sites" ON test_site_configuration
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins manage beta enrollment" ON beta_enrollment
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins manage test runs" ON module_test_runs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins manage test results" ON module_test_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Agency users can view their own beta enrollment
CREATE POLICY "Agencies view own enrollment" ON beta_enrollment
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agency_members am
      WHERE am.user_id = auth.uid()
      AND am.agency_id = beta_enrollment.agency_id
    )
  );

-- Agency users can view test runs for their modules
CREATE POLICY "Module creators view test runs" ON module_test_runs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM module_source ms
      WHERE ms.id = module_test_runs.module_source_id
      AND ms.created_by = auth.uid()
    )
  );

-- Agency users can view test results for their test runs
CREATE POLICY "Module creators view test results" ON module_test_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM module_test_runs mtr
      JOIN module_source ms ON ms.id = mtr.module_source_id
      WHERE mtr.id = module_test_results.test_run_id
      AND ms.created_by = auth.uid()
    )
  );

-- Updated_at trigger for test_site_configuration
CREATE OR REPLACE FUNCTION update_test_site_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS test_site_updated_at ON test_site_configuration;
CREATE TRIGGER test_site_updated_at
  BEFORE UPDATE ON test_site_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_test_site_timestamp();

-- Comments for documentation
COMMENT ON TABLE test_site_configuration IS 'Sites designated for testing pre-release modules';
COMMENT ON TABLE beta_enrollment IS 'Agencies enrolled in the beta testing program';
COMMENT ON TABLE module_test_runs IS 'Test execution records for modules';
COMMENT ON TABLE module_test_results IS 'Detailed test results for each test run';
COMMENT ON COLUMN test_site_configuration.test_features IS 'Features enabled: beta_modules, experimental_ui, debug_mode, analytics_testing';
COMMENT ON COLUMN beta_enrollment.beta_tier IS 'Tiers: internal, alpha, early_access, standard';
COMMENT ON COLUMN module_test_runs.test_type IS 'Types: unit, integration, performance, accessibility, security';
COMMENT ON COLUMN module_test_runs.status IS 'Status: pending, running, passed, failed, error';
COMMENT ON COLUMN module_test_results.status IS 'Status: passed, failed, skipped, warning';

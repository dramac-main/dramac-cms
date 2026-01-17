-- Module Development Studio Tables
-- Phase 80: Module source code, versions, deployments, and analytics

-- Module source code and configuration
CREATE TABLE IF NOT EXISTS module_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  
  -- Module metadata
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📦',
  category TEXT DEFAULT 'other',
  
  -- Code
  render_code TEXT, -- React component code
  settings_schema JSONB DEFAULT '{}', -- JSON schema for settings
  api_routes JSONB DEFAULT '[]', -- API endpoints
  styles TEXT, -- Custom CSS
  
  -- Configuration
  default_settings JSONB DEFAULT '{}',
  required_fields TEXT[] DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  
  -- Pricing reference
  pricing_tier TEXT DEFAULT 'free', -- free, starter, pro, enterprise
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, testing, published, deprecated
  published_version TEXT,
  latest_version TEXT,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Module version history
CREATE TABLE IF NOT EXISTS module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  
  -- Version info
  version TEXT NOT NULL, -- semver: 1.0.0, 1.0.1, etc.
  changelog TEXT,
  
  -- Snapshot of code at this version
  render_code TEXT,
  settings_schema JSONB,
  api_routes JSONB,
  styles TEXT,
  default_settings JSONB,
  
  -- Metadata
  is_breaking_change BOOLEAN DEFAULT FALSE,
  min_platform_version TEXT,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployment logs
CREATE TABLE IF NOT EXISTS module_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_source_id UUID NOT NULL REFERENCES module_source(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES module_versions(id) ON DELETE CASCADE,
  
  -- Deployment info
  environment TEXT NOT NULL, -- staging, production
  status TEXT DEFAULT 'pending', -- pending, deploying, success, failed, rolled_back
  
  -- Results
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Audit
  deployed_by UUID REFERENCES profiles(id)
);

-- Module analytics
CREATE TABLE IF NOT EXISTS module_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  
  -- Counts (updated periodically)
  total_installs INTEGER DEFAULT 0,
  active_installs INTEGER DEFAULT 0,
  weekly_installs INTEGER DEFAULT 0,
  uninstalls INTEGER DEFAULT 0,
  
  -- Performance
  avg_load_time_ms DECIMAL,
  error_count INTEGER DEFAULT 0,
  
  -- Revenue (cents)
  total_revenue_cents INTEGER DEFAULT 0,
  monthly_revenue_cents INTEGER DEFAULT 0,
  
  -- Period
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_module_source_status ON module_source(status);
CREATE INDEX IF NOT EXISTS idx_module_source_category ON module_source(category);
CREATE INDEX IF NOT EXISTS idx_module_source_created_by ON module_source(created_by);
CREATE INDEX IF NOT EXISTS idx_module_versions_source ON module_versions(module_source_id);
CREATE INDEX IF NOT EXISTS idx_module_versions_version ON module_versions(version);
CREATE INDEX IF NOT EXISTS idx_module_deployments_source ON module_deployments(module_source_id);
CREATE INDEX IF NOT EXISTS idx_module_deployments_status ON module_deployments(status);
CREATE INDEX IF NOT EXISTS idx_module_analytics_module ON module_analytics(module_id);

-- RLS Policies
ALTER TABLE module_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_analytics ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage module_source" ON module_source
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage module_versions" ON module_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage module_deployments" ON module_deployments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage module_analytics" ON module_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Published modules are viewable by all authenticated users
CREATE POLICY "Published modules are viewable" ON module_source
  FOR SELECT USING (
    status = 'published' AND auth.uid() IS NOT NULL
  );

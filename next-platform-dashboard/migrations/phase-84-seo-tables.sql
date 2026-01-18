-- Phase 84: SEO Dashboard - Database Schema
-- Extends existing sites and pages tables with SEO fields

-- EXTEND existing sites table with advanced SEO fields
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_analytics_id TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS google_site_verification TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS bing_site_verification TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS robots_txt TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS sitemap_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS sitemap_changefreq TEXT DEFAULT 'weekly';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS sitemap_include_images BOOLEAN DEFAULT TRUE;

-- Site SEO settings for advanced/additional fields
-- (We use a separate table to avoid bloating sites table too much)
CREATE TABLE IF NOT EXISTS site_seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Title template
  default_title_template TEXT DEFAULT '{page_title} | {site_name}',
  default_description TEXT,
  default_keywords TEXT[],
  
  -- Social sharing
  og_image_url TEXT,
  twitter_card_type TEXT DEFAULT 'summary_large_image',
  twitter_handle TEXT,
  
  -- Verification codes
  google_site_verification TEXT,
  bing_site_verification TEXT,
  
  -- Analytics
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  
  -- Robots defaults
  robots_index BOOLEAN DEFAULT TRUE,
  robots_follow BOOLEAN DEFAULT TRUE,
  
  -- Structured data
  organization_name TEXT,
  organization_logo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXTEND existing pages table with SEO fields
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS robots_index BOOLEAN DEFAULT TRUE;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS robots_follow BOOLEAN DEFAULT TRUE;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];

-- SEO audit logs
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  
  score INTEGER, -- 0-100
  issues JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_site_seo_settings_site ON site_seo_settings(site_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_site ON seo_audits(site_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_page ON seo_audits(page_id);
CREATE INDEX IF NOT EXISTS idx_seo_audits_created ON seo_audits(created_at DESC);

-- RLS Policies for site_seo_settings
ALTER TABLE site_seo_settings ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage all SEO settings"
  ON site_seo_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Agency members can view SEO settings for their agency's sites
CREATE POLICY "Agency members can view SEO settings"
  ON site_seo_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE s.id = site_seo_settings.site_id
      AND am.user_id = auth.uid()
    )
  );

-- Agency owners/admins can update SEO settings
CREATE POLICY "Agency owners and admins can update SEO settings"
  ON site_seo_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE s.id = site_seo_settings.site_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- Agency owners/admins can insert SEO settings
CREATE POLICY "Agency owners and admins can insert SEO settings"
  ON site_seo_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE s.id = site_seo_settings.site_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for seo_audits
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage all SEO audits"
  ON seo_audits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Agency members can view SEO audits for their agency's sites
CREATE POLICY "Agency members can view SEO audits"
  ON seo_audits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE s.id = seo_audits.site_id
      AND am.user_id = auth.uid()
    )
  );

-- Agency members can insert SEO audits
CREATE POLICY "Agency members can insert SEO audits"
  ON seo_audits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE s.id = seo_audits.site_id
      AND am.user_id = auth.uid()
    )
  );

-- Updated at trigger for site_seo_settings
CREATE OR REPLACE FUNCTION update_site_seo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_site_seo_settings_updated_at ON site_seo_settings;
CREATE TRIGGER trigger_site_seo_settings_updated_at
  BEFORE UPDATE ON site_seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_seo_settings_updated_at();

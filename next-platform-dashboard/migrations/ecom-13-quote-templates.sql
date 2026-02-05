-- ============================================================================
-- QUOTE TEMPLATES & SETTINGS
-- Phase ECOM-13: Quote Templates & Automation
-- ============================================================================

-- Quote templates table
CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Template info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Template content
  title_template VARCHAR(255),
  introduction_template TEXT,
  terms_and_conditions TEXT,
  notes_template TEXT,
  
  -- Default pricing
  default_discount_type VARCHAR(20) DEFAULT 'percentage',
  default_discount_value DECIMAL(10, 2) DEFAULT 0,
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  default_validity_days INTEGER DEFAULT 30,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Template items (predefined line items)
  default_items JSONB DEFAULT '[]'::jsonb,
  
  -- Appearance
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  show_company_logo BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote settings table (per-site configuration)
CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Numbering
  quote_number_prefix VARCHAR(20) DEFAULT 'QT-',
  quote_number_padding INTEGER DEFAULT 5,
  next_quote_number INTEGER DEFAULT 1,
  
  -- Defaults
  default_validity_days INTEGER DEFAULT 30,
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  default_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Auto-actions
  auto_expire_enabled BOOLEAN DEFAULT TRUE,
  auto_reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_days_before INTEGER DEFAULT 3,
  max_reminders INTEGER DEFAULT 2,
  
  -- Email settings
  send_acceptance_notification BOOLEAN DEFAULT TRUE,
  send_rejection_notification BOOLEAN DEFAULT TRUE,
  cc_email_on_send VARCHAR(255),
  
  -- Branding
  company_name VARCHAR(255),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  
  -- Default content
  default_introduction TEXT,
  default_terms TEXT,
  default_footer TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quote_templates_site ON mod_ecommod01_quote_templates(site_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_active ON mod_ecommod01_quote_templates(site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_quote_settings_site ON mod_ecommod01_quote_settings(site_id);

-- Trigger for updated_at on templates
DROP TRIGGER IF EXISTS update_quote_templates_timestamp ON mod_ecommod01_quote_templates;
CREATE TRIGGER update_quote_templates_timestamp
  BEFORE UPDATE ON mod_ecommod01_quote_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Trigger for updated_at on settings
DROP TRIGGER IF EXISTS update_quote_settings_timestamp ON mod_ecommod01_quote_settings;
CREATE TRIGGER update_quote_settings_timestamp
  BEFORE UPDATE ON mod_ecommod01_quote_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- RLS Policies
ALTER TABLE mod_ecommod01_quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_settings ENABLE ROW LEVEL SECURITY;

-- Templates policies
DROP POLICY IF EXISTS "Templates viewable by site members" ON mod_ecommod01_quote_templates;
CREATE POLICY "Templates viewable by site members"
  ON mod_ecommod01_quote_templates FOR SELECT
  USING (site_id IN (SELECT site_id FROM site_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Templates manageable by site admins" ON mod_ecommod01_quote_templates;
CREATE POLICY "Templates manageable by site admins"
  ON mod_ecommod01_quote_templates FOR ALL
  USING (site_id IN (
    SELECT site_id FROM site_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin', 'editor')
  ));

-- Settings policies
DROP POLICY IF EXISTS "Quote settings viewable by site members" ON mod_ecommod01_quote_settings;
CREATE POLICY "Quote settings viewable by site members"
  ON mod_ecommod01_quote_settings FOR SELECT
  USING (site_id IN (SELECT site_id FROM site_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Quote settings manageable by site admins" ON mod_ecommod01_quote_settings;
CREATE POLICY "Quote settings manageable by site admins"
  ON mod_ecommod01_quote_settings FOR ALL
  USING (site_id IN (
    SELECT site_id FROM site_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Add reminder_count column to quotes table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_quotes' 
    AND column_name = 'reminder_count'
  ) THEN
    ALTER TABLE mod_ecommod01_quotes ADD COLUMN reminder_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_quotes' 
    AND column_name = 'last_reminder_at'
  ) THEN
    ALTER TABLE mod_ecommod01_quotes ADD COLUMN last_reminder_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_quotes' 
    AND column_name = 'template_id'
  ) THEN
    ALTER TABLE mod_ecommod01_quotes ADD COLUMN template_id UUID REFERENCES mod_ecommod01_quote_templates(id);
  END IF;
END
$$;

-- Comments
COMMENT ON TABLE mod_ecommod01_quote_templates IS 'Reusable quote templates for quick quote creation';
COMMENT ON TABLE mod_ecommod01_quote_settings IS 'Per-site quote configuration and defaults';

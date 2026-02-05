-- ============================================================================
-- COMPLETE QUOTATION SYSTEM MIGRATION
-- Run this in Supabase SQL Editor to set up all quote tables
-- ============================================================================
-- This combines ECOM-10 and ECOM-13 migrations into one complete file
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================================

-- Ensure timestamp function exists
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. QUOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Quote identification
  quote_number TEXT NOT NULL,
  reference_number TEXT,
  
  -- Customer info
  customer_id UUID,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  
  -- Addresses (JSONB for flexibility)
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'sent', 'viewed', 
    'accepted', 'rejected', 'expired', 'converted', 'cancelled'
  )),
  
  -- Financial amounts
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Validity period
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Content fields
  title TEXT,
  introduction TEXT,
  terms_and_conditions TEXT,
  notes_to_customer TEXT,
  internal_notes TEXT,
  
  -- Tracking timestamps
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  responded_at TIMESTAMPTZ,
  response_notes TEXT,
  
  -- Conversion tracking
  converted_to_order_id UUID,
  converted_at TIMESTAMPTZ,
  
  -- Access token for customer portal
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Reminder tracking (ECOM-13)
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  
  -- Template reference (ECOM-13)
  template_id UUID,
  
  -- Metadata and audit
  created_by UUID,
  last_modified_by UUID,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(site_id, quote_number),
  UNIQUE(access_token)
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
  -- ECOM-13 columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mod_ecommod01_quotes' AND column_name = 'reminder_count') THEN
    ALTER TABLE mod_ecommod01_quotes ADD COLUMN reminder_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mod_ecommod01_quotes' AND column_name = 'last_reminder_at') THEN
    ALTER TABLE mod_ecommod01_quotes ADD COLUMN last_reminder_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mod_ecommod01_quotes' AND column_name = 'template_id') THEN
    ALTER TABLE mod_ecommod01_quotes ADD COLUMN template_id UUID;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotes_site_id ON mod_ecommod01_quotes(site_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON mod_ecommod01_quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_access_token ON mod_ecommod01_quotes(access_token);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON mod_ecommod01_quotes(created_at DESC);

-- ============================================================================
-- 2. QUOTE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  -- Product reference (optional - allows custom line items)
  product_id UUID,
  variant_id UUID,
  
  -- Item details
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  image_url TEXT,
  
  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  tax_rate DECIMAL(5,2) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  line_total DECIMAL(12,2) NOT NULL,
  
  -- Product options
  options JSONB DEFAULT '{}',
  
  -- Sorting
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON mod_ecommod01_quote_items(quote_id);

-- ============================================================================
-- 3. QUOTE ACTIVITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'updated', 'sent', 'viewed', 'accepted', 'rejected',
    'expired', 'converted', 'cancelled', 'note_added', 'reminder_sent',
    'item_added', 'item_removed', 'item_updated', 'status_changed', 'resent', 'duplicated'
  )),
  
  description TEXT NOT NULL,
  performed_by UUID,
  performed_by_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_activities_quote_id ON mod_ecommod01_quote_activities(quote_id);

-- ============================================================================
-- 4. QUOTE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Template content (ECOM-13 style)
  title_template VARCHAR(255),
  introduction_template TEXT,
  terms_and_conditions TEXT,
  notes_template TEXT,
  
  -- Aliases for compatibility
  default_title TEXT,
  default_introduction TEXT,
  default_terms TEXT,
  default_notes TEXT,
  
  -- Default pricing
  default_discount_type VARCHAR(20) DEFAULT 'percentage',
  default_discount_value DECIMAL(10, 2) DEFAULT 0,
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  default_validity_days INTEGER DEFAULT 30,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Template items
  default_items JSONB DEFAULT '[]'::jsonb,
  items JSONB DEFAULT '[]',
  
  -- Appearance
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  show_company_logo BOOLEAN DEFAULT TRUE,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_templates_site ON mod_ecommod01_quote_templates(site_id);

-- ============================================================================
-- 5. QUOTE SETTINGS TABLE (Site-specific)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Quote numbering
  quote_number_prefix TEXT DEFAULT 'QUO-',
  quote_number_counter INTEGER DEFAULT 1000,
  quote_number_padding INTEGER DEFAULT 5,
  quote_number_format TEXT DEFAULT '{prefix}{counter}',
  next_quote_number INTEGER DEFAULT 1,
  
  -- Default settings
  default_validity_days INTEGER DEFAULT 30,
  default_terms TEXT,
  default_currency VARCHAR(3) DEFAULT 'USD',
  default_tax_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Automation settings
  auto_expire_enabled BOOLEAN DEFAULT TRUE,
  auto_reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_days_before INTEGER DEFAULT 3,
  reminder_days_before_expiry INTEGER DEFAULT 3,
  max_reminders INTEGER DEFAULT 2,
  
  -- Email settings
  send_copy_to_admin BOOLEAN DEFAULT TRUE,
  send_acceptance_notification BOOLEAN DEFAULT TRUE,
  send_rejection_notification BOOLEAN DEFAULT TRUE,
  admin_notification_email TEXT,
  cc_email_on_send VARCHAR(255),
  
  -- Branding
  company_name VARCHAR(255),
  company_address TEXT,
  company_phone VARCHAR(50),
  company_email VARCHAR(255),
  logo_url TEXT,
  pdf_logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  pdf_header_color TEXT DEFAULT '#1f2937',
  pdf_show_bank_details BOOLEAN DEFAULT FALSE,
  pdf_bank_details TEXT,
  
  -- Default content
  default_introduction TEXT,
  default_footer TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_settings_site ON mod_ecommod01_quote_settings(site_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_quotes_timestamp ON mod_ecommod01_quotes;
CREATE TRIGGER update_quotes_timestamp
  BEFORE UPDATE ON mod_ecommod01_quotes
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_quote_items_timestamp ON mod_ecommod01_quote_items;
CREATE TRIGGER update_quote_items_timestamp
  BEFORE UPDATE ON mod_ecommod01_quote_items
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_quote_templates_timestamp ON mod_ecommod01_quote_templates;
CREATE TRIGGER update_quote_templates_timestamp
  BEFORE UPDATE ON mod_ecommod01_quote_templates
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_quote_settings_timestamp ON mod_ecommod01_quote_settings;
CREATE TRIGGER update_quote_settings_timestamp
  BEFORE UPDATE ON mod_ecommod01_quote_settings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mod_ecommod01_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_settings ENABLE ROW LEVEL SECURITY;

-- Quotes policies
DROP POLICY IF EXISTS "Quotes full access" ON mod_ecommod01_quotes;
CREATE POLICY "Quotes full access" ON mod_ecommod01_quotes FOR ALL USING (true);

-- Quote items policies
DROP POLICY IF EXISTS "Quote items full access" ON mod_ecommod01_quote_items;
CREATE POLICY "Quote items full access" ON mod_ecommod01_quote_items FOR ALL USING (true);

-- Quote activities policies
DROP POLICY IF EXISTS "Quote activities full access" ON mod_ecommod01_quote_activities;
CREATE POLICY "Quote activities full access" ON mod_ecommod01_quote_activities FOR ALL USING (true);

-- Quote templates policies
DROP POLICY IF EXISTS "Quote templates full access" ON mod_ecommod01_quote_templates;
CREATE POLICY "Quote templates full access" ON mod_ecommod01_quote_templates FOR ALL USING (true);

-- Quote settings policies
DROP POLICY IF EXISTS "Quote settings full access" ON mod_ecommod01_quote_settings;
CREATE POLICY "Quote settings full access" ON mod_ecommod01_quote_settings FOR ALL USING (true);

-- ============================================================================
-- DONE! Quotation system tables are ready.
-- ============================================================================

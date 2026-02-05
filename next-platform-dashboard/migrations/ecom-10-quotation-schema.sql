-- ============================================================================
-- PHASE-ECOM-10: Quotation System Database Schema
-- ============================================================================
-- This migration creates all tables required for the quotation system:
-- 1. mod_ecommod01_quotes - Main quotes table
-- 2. mod_ecommod01_quote_items - Quote line items
-- 3. mod_ecommod01_quote_activities - Activity/audit log
-- 4. mod_ecommod01_quote_templates - Reusable templates
-- 5. mod_ecommod01_quote_settings - Site-specific settings
-- ============================================================================

-- ============================================================================
-- 1. QUOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Quote identification
  quote_number TEXT NOT NULL,
  reference_number TEXT, -- Optional customer/external reference
  
  -- Customer info (can reference existing customer or store info for new)
  customer_id UUID REFERENCES mod_ecommod01_customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  
  -- Addresses (JSONB for flexibility)
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Being created/edited
    'pending_approval', -- Awaiting internal approval
    'sent',            -- Sent to customer
    'viewed',          -- Customer viewed the quote
    'accepted',        -- Customer accepted
    'rejected',        -- Customer rejected
    'expired',         -- Past valid_until date
    'converted',       -- Converted to order
    'cancelled'        -- Cancelled by staff
  )),
  
  -- Financial amounts (stored in decimal for precision)
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
  converted_to_order_id UUID REFERENCES mod_ecommod01_orders(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  
  -- Access token for customer portal (public link)
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Metadata and audit
  template_id UUID,
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

-- Indexes for quotes table
CREATE INDEX IF NOT EXISTS idx_quotes_site_id ON mod_ecommod01_quotes(site_id);
CREATE INDEX IF NOT EXISTS idx_quotes_agency_id ON mod_ecommod01_quotes(agency_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON mod_ecommod01_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON mod_ecommod01_quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON mod_ecommod01_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON mod_ecommod01_quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_access_token ON mod_ecommod01_quotes(access_token);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON mod_ecommod01_quotes(site_id, quote_number);

-- ============================================================================
-- 2. QUOTE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  -- Product reference (optional - allows custom line items without product)
  product_id UUID REFERENCES mod_ecommod01_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE SET NULL,
  
  -- Item details (snapshot at time of quote creation)
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
  
  -- Product options (for variants)
  options JSONB DEFAULT '{}',
  
  -- Sorting
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON mod_ecommod01_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON mod_ecommod01_quote_items(product_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_sort_order ON mod_ecommod01_quote_items(quote_id, sort_order);

-- ============================================================================
-- 3. QUOTE ACTIVITIES TABLE (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created',          -- Quote created
    'updated',          -- Quote details updated
    'sent',             -- Quote sent to customer
    'viewed',           -- Customer viewed quote
    'accepted',         -- Customer accepted quote
    'rejected',         -- Customer rejected quote
    'expired',          -- Quote expired
    'converted',        -- Converted to order
    'cancelled',        -- Quote cancelled
    'note_added',       -- Internal note added
    'reminder_sent',    -- Reminder email sent
    'item_added',       -- Line item added
    'item_removed',     -- Line item removed
    'item_updated',     -- Line item updated
    'status_changed',   -- Status changed
    'resent',           -- Quote resent to customer
    'duplicated'        -- Quote duplicated
  )),
  
  -- Activity details
  description TEXT NOT NULL,
  
  -- Tracking info
  performed_by UUID,
  performed_by_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Additional context
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote activities
CREATE INDEX IF NOT EXISTS idx_quote_activities_quote_id ON mod_ecommod01_quote_activities(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_activities_type ON mod_ecommod01_quote_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_quote_activities_created_at ON mod_ecommod01_quote_activities(created_at DESC);

-- ============================================================================
-- 4. QUOTE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Template identification
  name TEXT NOT NULL,
  description TEXT,
  
  -- Default content
  default_title TEXT,
  default_introduction TEXT,
  default_terms TEXT,
  default_notes TEXT,
  default_validity_days INTEGER DEFAULT 30 CHECK (default_validity_days > 0),
  
  -- Pre-filled items (JSONB array of item templates)
  items JSONB DEFAULT '[]',
  
  -- Default discount (optional)
  default_discount_type TEXT CHECK (default_discount_type IN ('percentage', 'fixed')),
  default_discount_value DECIMAL(10,2) DEFAULT 0,
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote templates
CREATE INDEX IF NOT EXISTS idx_quote_templates_site_id ON mod_ecommod01_quote_templates(site_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_agency_id ON mod_ecommod01_quote_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_is_active ON mod_ecommod01_quote_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_quote_templates_is_default ON mod_ecommod01_quote_templates(site_id, is_default);

-- ============================================================================
-- 5. QUOTE SETTINGS TABLE (Site-specific settings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_quote_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE UNIQUE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Quote numbering
  quote_number_prefix TEXT DEFAULT 'QUO-',
  quote_number_counter INTEGER DEFAULT 1000,
  quote_number_format TEXT DEFAULT '{prefix}{counter}', -- e.g., QUO-1001
  
  -- Default settings
  default_validity_days INTEGER DEFAULT 30,
  default_terms TEXT,
  default_currency TEXT DEFAULT 'USD',
  
  -- Automation settings
  auto_expire_enabled BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_days_before_expiry INTEGER DEFAULT 3,
  
  -- Email settings
  send_copy_to_admin BOOLEAN DEFAULT true,
  admin_notification_email TEXT,
  
  -- PDF branding
  pdf_logo_url TEXT,
  pdf_header_color TEXT DEFAULT '#1f2937',
  pdf_show_bank_details BOOLEAN DEFAULT false,
  pdf_bank_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote settings
CREATE INDEX IF NOT EXISTS idx_quote_settings_site_id ON mod_ecommod01_quote_settings(site_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quotes table
DROP TRIGGER IF EXISTS trigger_quotes_updated_at ON mod_ecommod01_quotes;
CREATE TRIGGER trigger_quotes_updated_at
  BEFORE UPDATE ON mod_ecommod01_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- Trigger for quote items table
DROP TRIGGER IF EXISTS trigger_quote_items_updated_at ON mod_ecommod01_quote_items;
CREATE TRIGGER trigger_quote_items_updated_at
  BEFORE UPDATE ON mod_ecommod01_quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- Trigger for quote templates table
DROP TRIGGER IF EXISTS trigger_quote_templates_updated_at ON mod_ecommod01_quote_templates;
CREATE TRIGGER trigger_quote_templates_updated_at
  BEFORE UPDATE ON mod_ecommod01_quote_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- Trigger for quote settings table
DROP TRIGGER IF EXISTS trigger_quote_settings_updated_at ON mod_ecommod01_quote_settings;
CREATE TRIGGER trigger_quote_settings_updated_at
  BEFORE UPDATE ON mod_ecommod01_quote_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_updated_at();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE mod_ecommod01_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_quote_settings ENABLE ROW LEVEL SECURITY;

-- Quotes policies
DROP POLICY IF EXISTS quotes_site_isolation ON mod_ecommod01_quotes;
CREATE POLICY quotes_site_isolation ON mod_ecommod01_quotes
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Public access for customer portal (by access_token - handled in app code)
DROP POLICY IF EXISTS quotes_public_view ON mod_ecommod01_quotes;
CREATE POLICY quotes_public_view ON mod_ecommod01_quotes
  FOR SELECT USING (true);

-- Quote items policies
DROP POLICY IF EXISTS quote_items_site_isolation ON mod_ecommod01_quote_items;
CREATE POLICY quote_items_site_isolation ON mod_ecommod01_quote_items
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM mod_ecommod01_quotes WHERE site_id IN (
        SELECT id FROM sites WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Quote activities policies
DROP POLICY IF EXISTS quote_activities_site_isolation ON mod_ecommod01_quote_activities;
CREATE POLICY quote_activities_site_isolation ON mod_ecommod01_quote_activities
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM mod_ecommod01_quotes WHERE site_id IN (
        SELECT id FROM sites WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Quote templates policies
DROP POLICY IF EXISTS quote_templates_site_isolation ON mod_ecommod01_quote_templates;
CREATE POLICY quote_templates_site_isolation ON mod_ecommod01_quote_templates
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Quote settings policies
DROP POLICY IF EXISTS quote_settings_site_isolation ON mod_ecommod01_quote_settings;
CREATE POLICY quote_settings_site_isolation ON mod_ecommod01_quote_settings
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_quotes IS 'E-commerce quotations/proposals sent to customers';
COMMENT ON TABLE mod_ecommod01_quote_items IS 'Line items within a quote';
COMMENT ON TABLE mod_ecommod01_quote_activities IS 'Activity log for quote auditing';
COMMENT ON TABLE mod_ecommod01_quote_templates IS 'Reusable quote templates';
COMMENT ON TABLE mod_ecommod01_quote_settings IS 'Site-specific quote settings';

COMMENT ON COLUMN mod_ecommod01_quotes.access_token IS 'Unique token for customer portal access';
COMMENT ON COLUMN mod_ecommod01_quotes.status IS 'Quote workflow status';
COMMENT ON COLUMN mod_ecommod01_quote_items.line_total IS 'Calculated: (quantity * unit_price) - discount + tax';

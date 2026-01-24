-- ==========================================
-- E-COMMERCE MODULE DATABASE SCHEMA
-- Phase EM-52: E-Commerce Module
-- 
-- Uses mod_ecommod01_ prefix per EM-05 conventions
-- Short ID: ecommod01 (8 chars to match CRM/Booking pattern)
-- ==========================================

-- ==========================================
-- PRODUCT CATEGORIES
-- ==========================================

CREATE TABLE mod_ecommod01_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES mod_ecommod01_categories(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  seo_title TEXT,
  seo_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- ==========================================
-- PRODUCTS
-- ==========================================

CREATE TABLE mod_ecommod01_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- Original price for sale display
  cost_price DECIMAL(10,2),       -- For profit calculation
  
  -- Tax
  tax_class TEXT DEFAULT 'standard',
  is_taxable BOOLEAN DEFAULT true,
  
  -- Inventory
  sku TEXT,
  barcode TEXT,
  track_inventory BOOLEAN DEFAULT true,
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  
  -- Physical
  weight DECIMAL(10,2),
  weight_unit TEXT DEFAULT 'kg',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  
  -- Media (JSON array of image URLs)
  images JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_by UUID, -- User ID from auth.users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- ==========================================
-- PRODUCT TO CATEGORY MAPPING
-- ==========================================

CREATE TABLE mod_ecommod01_product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES mod_ecommod01_categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(product_id, category_id)
);

-- ==========================================
-- PRODUCT OPTIONS (Size, Color, etc.)
-- ==========================================

CREATE TABLE mod_ecommod01_product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,           -- "Size", "Color"
  values JSONB NOT NULL,        -- ["S", "M", "L", "XL"]
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE(product_id, name)
);

-- ==========================================
-- PRODUCT VARIANTS (specific combinations)
-- ==========================================

CREATE TABLE mod_ecommod01_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  
  -- Variant options (e.g., {"size": "L", "color": "Red"})
  options JSONB NOT NULL DEFAULT '{}',
  
  -- Override pricing
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  
  -- Inventory
  sku TEXT,
  barcode TEXT,
  quantity INTEGER DEFAULT 0,
  
  -- Image specific to this variant
  image_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- DISCOUNT CODES
-- ==========================================

CREATE TABLE mod_ecommod01_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,
  description TEXT,
  
  -- Discount type
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value DECIMAL(10,2) NOT NULL,
  
  -- Conditions
  minimum_order_amount DECIMAL(10,2),
  minimum_quantity INTEGER,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'products', 'categories')),
  applies_to_ids UUID[],
  
  -- Limits
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  once_per_customer BOOLEAN DEFAULT false,
  
  -- Validity
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, code)
);

-- ==========================================
-- SHOPPING CARTS
-- ==========================================

CREATE TABLE mod_ecommod01_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Can be guest or logged in user
  user_id UUID, -- User ID from auth.users
  session_id TEXT, -- For guest carts
  
  -- Applied discount
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Currency
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- ==========================================
-- CART ITEMS
-- ==========================================

CREATE TABLE mod_ecommod01_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES mod_ecommod01_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  
  -- Custom options (if any)
  custom_options JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cart_id, product_id, variant_id)
);

-- ==========================================
-- ORDERS
-- ==========================================

CREATE TABLE mod_ecommod01_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Order number (human readable)
  order_number TEXT NOT NULL,
  
  -- Customer
  customer_id UUID, -- User ID from auth.users
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Addresses (stored as JSON for immutability)
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_code TEXT,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 
    'delivered', 'cancelled', 'refunded'
  )),
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'partially_refunded', 'refunded', 'failed'
  )),
  payment_method TEXT,
  payment_provider TEXT CHECK (payment_provider IN ('paddle', 'flutterwave', 'pesapal', 'dpo', 'manual')),
  payment_transaction_id TEXT, -- Provider-specific transaction ID
  
  -- Fulfillment
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partial', 'fulfilled'
  )),
  
  -- Shipping
  shipping_method TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, order_number)
);

-- ==========================================
-- ORDER ITEMS
-- ==========================================

CREATE TABLE mod_ecommod01_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES mod_ecommod01_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot of product at time of order
  product_name TEXT NOT NULL,
  product_sku TEXT,
  variant_options JSONB DEFAULT '{}',
  image_url TEXT,
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Fulfillment
  fulfilled_quantity INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- STORE SETTINGS
-- ==========================================

CREATE TABLE mod_ecommod01_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Store info
  store_name TEXT,
  store_email TEXT,
  store_phone TEXT,
  store_address JSONB,
  
  -- Currency & Tax
  currency TEXT DEFAULT 'USD',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_included_in_price BOOLEAN DEFAULT false,
  
  -- Shipping
  shipping_zones JSONB DEFAULT '[]',
  free_shipping_threshold DECIMAL(10,2),
  
  -- Checkout
  enable_guest_checkout BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT false,
  
  -- Payment providers (encrypted)
  paddle_config JSONB,      -- For global customers (SaaS billing system)
  flutterwave_config JSONB, -- Primary African e-commerce (Zambia + 30+ countries)
  pesapal_config JSONB,     -- Secondary African markets (cards + mobile money)
  dpo_config JSONB,         -- Zambian local backup (optional)
  
  -- Notifications
  order_notification_email TEXT,
  send_order_confirmation BOOLEAN DEFAULT true,
  
  -- Inventory
  continue_selling_when_out_of_stock BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_ecommod01_products_site ON mod_ecommod01_products(site_id);
CREATE INDEX idx_ecommod01_products_status ON mod_ecommod01_products(site_id, status);
CREATE INDEX idx_ecommod01_products_featured ON mod_ecommod01_products(site_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_ecommod01_products_slug ON mod_ecommod01_products(site_id, slug);
CREATE INDEX idx_ecommod01_categories_site ON mod_ecommod01_categories(site_id);
CREATE INDEX idx_ecommod01_categories_slug ON mod_ecommod01_categories(site_id, slug);
CREATE INDEX idx_ecommod01_orders_site ON mod_ecommod01_orders(site_id);
CREATE INDEX idx_ecommod01_orders_status ON mod_ecommod01_orders(site_id, status);
CREATE INDEX idx_ecommod01_orders_customer ON mod_ecommod01_orders(customer_id);
CREATE INDEX idx_ecommod01_orders_number ON mod_ecommod01_orders(site_id, order_number);
CREATE INDEX idx_ecommod01_carts_session ON mod_ecommod01_carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_ecommod01_carts_user ON mod_ecommod01_carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ecommod01_discounts_code ON mod_ecommod01_discounts(site_id, code);
CREATE INDEX idx_ecommod01_variants_product ON mod_ecommod01_product_variants(product_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE mod_ecommod01_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_settings ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "ecommod01_categories_site_isolation" ON mod_ecommod01_categories
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Products policies
CREATE POLICY "ecommod01_products_site_isolation" ON mod_ecommod01_products
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Product categories policies
CREATE POLICY "ecommod01_product_categories_access" ON mod_ecommod01_product_categories
  FOR ALL USING (
    product_id IN (
      SELECT id FROM mod_ecommod01_products WHERE site_id IN (
        SELECT id FROM sites 
        WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Product options policies
CREATE POLICY "ecommod01_product_options_access" ON mod_ecommod01_product_options
  FOR ALL USING (
    product_id IN (
      SELECT id FROM mod_ecommod01_products WHERE site_id IN (
        SELECT id FROM sites 
        WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Product variants policies
CREATE POLICY "ecommod01_product_variants_access" ON mod_ecommod01_product_variants
  FOR ALL USING (
    product_id IN (
      SELECT id FROM mod_ecommod01_products WHERE site_id IN (
        SELECT id FROM sites 
        WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Discounts policies
CREATE POLICY "ecommod01_discounts_site_isolation" ON mod_ecommod01_discounts
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Carts policies (allow public access for guest carts)
CREATE POLICY "ecommod01_carts_public_read" ON mod_ecommod01_carts
  FOR SELECT USING (true);

CREATE POLICY "ecommod01_carts_public_insert" ON mod_ecommod01_carts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ecommod01_carts_public_update" ON mod_ecommod01_carts
  FOR UPDATE USING (true);

-- Cart items policies (allow public access for guest carts)
CREATE POLICY "ecommod01_cart_items_public" ON mod_ecommod01_cart_items
  FOR ALL USING (true);

-- Orders policies
CREATE POLICY "ecommod01_orders_site_isolation" ON mod_ecommod01_orders
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Order items policies
CREATE POLICY "ecommod01_order_items_access" ON mod_ecommod01_order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM mod_ecommod01_orders WHERE site_id IN (
        SELECT id FROM sites 
        WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Settings policies
CREATE POLICY "ecommod01_settings_site_isolation" ON mod_ecommod01_settings
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- ==========================================
-- ORDER NUMBER SEQUENCE FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION mod_ecommod01_generate_order_number(p_site_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Get current count for site
  SELECT COUNT(*) + 1 INTO v_count
  FROM mod_ecommod01_orders
  WHERE site_id = p_site_id;
  
  -- Generate order number: ORD-20260124-00001
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION mod_ecommod01_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ecommod01_categories_updated_at
  BEFORE UPDATE ON mod_ecommod01_categories
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

CREATE TRIGGER trigger_ecommod01_products_updated_at
  BEFORE UPDATE ON mod_ecommod01_products
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

CREATE TRIGGER trigger_ecommod01_carts_updated_at
  BEFORE UPDATE ON mod_ecommod01_carts
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

CREATE TRIGGER trigger_ecommod01_orders_updated_at
  BEFORE UPDATE ON mod_ecommod01_orders
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

CREATE TRIGGER trigger_ecommod01_settings_updated_at
  BEFORE UPDATE ON mod_ecommod01_settings
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE mod_ecommod01_categories IS 'E-Commerce product categories with nested hierarchy support';
COMMENT ON TABLE mod_ecommod01_products IS 'E-Commerce products with pricing, inventory, and media';
COMMENT ON TABLE mod_ecommod01_product_variants IS 'Product variants for size/color combinations with individual pricing';
COMMENT ON TABLE mod_ecommod01_discounts IS 'Discount codes with usage limits and conditions';
COMMENT ON TABLE mod_ecommod01_carts IS 'Shopping carts for both guests and registered users';
COMMENT ON TABLE mod_ecommod01_orders IS 'Customer orders with payment and fulfillment tracking';
COMMENT ON TABLE mod_ecommod01_settings IS 'Store-wide settings including payment provider configuration';

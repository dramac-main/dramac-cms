-- ============================================================================
-- PHASE-ECOM-42A: Marketing Features Database Schema
-- ============================================================================
-- Description: Creates tables for flash sales, bundles, gift cards, and loyalty.
-- Date: February 2026
-- ============================================================================

-- ============================================================================
-- FLASH SALES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Sale details
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Discount settings
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,  -- Percentage (0-100) or amount in cents
  
  -- Limits
  max_uses INTEGER,               -- Total redemptions allowed
  max_uses_per_customer INTEGER,  -- Per customer limit
  current_uses INTEGER DEFAULT 0,
  
  -- Display settings
  is_featured BOOLEAN DEFAULT false,
  show_countdown BOOLEAN DEFAULT true,
  banner_image TEXT,
  badge_text TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'ended', 'cancelled')),
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique slug per site
  UNIQUE(site_id, slug)
);

-- Flash sale products
CREATE TABLE IF NOT EXISTS mod_ecommod01_flash_sale_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id UUID NOT NULL REFERENCES mod_ecommod01_flash_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  
  -- Override discount (optional - uses sale default if null)
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER,
  
  -- Inventory limit for this sale
  quantity_limit INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  
  -- Position in sale
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(flash_sale_id, product_id)
);

-- Indexes for flash sales
CREATE INDEX IF NOT EXISTS idx_flash_sales_site ON mod_ecommod01_flash_sales(site_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_status ON mod_ecommod01_flash_sales(status);
CREATE INDEX IF NOT EXISTS idx_flash_sales_timing ON mod_ecommod01_flash_sales(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON mod_ecommod01_flash_sales(site_id, status) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_flash_sale_products_sale ON mod_ecommod01_flash_sale_products(flash_sale_id);
CREATE INDEX IF NOT EXISTS idx_flash_sale_products_product ON mod_ecommod01_flash_sale_products(product_id);

-- ============================================================================
-- PRODUCT BUNDLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Bundle details
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  sku TEXT,
  
  -- Images
  images TEXT[] DEFAULT '{}',
  
  -- Pricing
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('fixed', 'percentage_discount', 'cheapest_free')),
  fixed_price INTEGER,          -- For fixed pricing (cents)
  discount_percentage INTEGER,   -- For percentage discount
  
  -- Computed totals (updated when items change)
  original_total INTEGER DEFAULT 0,  -- Sum of individual prices
  bundle_price INTEGER DEFAULT 0,     -- Actual bundle price
  savings INTEGER DEFAULT 0,          -- original_total - bundle_price
  
  -- Inventory
  track_inventory BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 0,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Display
  show_savings BOOLEAN DEFAULT true,
  badge_text TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Bundle items
CREATE TABLE IF NOT EXISTS mod_ecommod01_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES mod_ecommod01_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  
  -- Quantity of this product in bundle
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Optional variant
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE SET NULL,
  
  -- Price override (uses product price if null)
  price_override INTEGER,
  
  -- Optional/required
  is_optional BOOLEAN DEFAULT false,
  
  -- Sort order
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bundles
CREATE INDEX IF NOT EXISTS idx_bundles_site ON mod_ecommod01_bundles(site_id);
CREATE INDEX IF NOT EXISTS idx_bundles_active ON mod_ecommod01_bundles(site_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON mod_ecommod01_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON mod_ecommod01_bundle_items(product_id);

-- Unique constraint for bundle items (handles optional variant_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bundle_items_unique 
  ON mod_ecommod01_bundle_items(bundle_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ============================================================================
-- GIFT CARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Card details
  code TEXT NOT NULL,           -- Unique code (e.g., GIFT-XXXX-XXXX)
  pin TEXT,                     -- Optional PIN for security
  
  -- Value
  initial_balance INTEGER NOT NULL,  -- Original value in cents
  current_balance INTEGER NOT NULL,  -- Remaining balance
  currency TEXT DEFAULT 'USD',
  
  -- Type
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'promotional', 'reward', 'refund')),
  
  -- Validity
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Restrictions
  minimum_order INTEGER,        -- Minimum order amount to use
  max_uses INTEGER,             -- Total redemptions (usually 1 for gift cards)
  current_uses INTEGER DEFAULT 0,
  
  -- Sender/recipient info (for gifting)
  sender_name TEXT,
  sender_email TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  personal_message TEXT,
  
  -- Delivery
  delivery_method TEXT CHECK (delivery_method IN ('email', 'physical', 'instant')),
  delivered_at TIMESTAMPTZ,
  
  -- Purchase info (if sold)
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID,                -- Order it was purchased with
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, code)
);

-- Gift card transactions
CREATE TABLE IF NOT EXISTS mod_ecommod01_gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES mod_ecommod01_gift_cards(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption', 'refund', 'adjustment', 'expiration')),
  amount INTEGER NOT NULL,      -- Positive for credit, negative for debit
  balance_after INTEGER NOT NULL,
  
  -- Reference
  order_id UUID,                -- Related order
  notes TEXT,
  
  -- Who made the transaction
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for gift cards
CREATE INDEX IF NOT EXISTS idx_gift_cards_site ON mod_ecommod01_gift_cards(site_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON mod_ecommod01_gift_cards(site_id, code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON mod_ecommod01_gift_cards(site_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gift_card_txn_card ON mod_ecommod01_gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_txn_order ON mod_ecommod01_gift_card_transactions(order_id);

-- ============================================================================
-- LOYALTY PROGRAM TABLES
-- ============================================================================

-- Loyalty program configuration
CREATE TABLE IF NOT EXISTS mod_ecommod01_loyalty_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Program settings
  is_enabled BOOLEAN DEFAULT false,
  program_name TEXT DEFAULT 'Rewards',
  points_name TEXT DEFAULT 'Points',
  
  -- Earning rules
  points_per_dollar INTEGER DEFAULT 1,  -- Points earned per dollar spent
  signup_bonus INTEGER DEFAULT 0,       -- Points for account creation
  referral_bonus INTEGER DEFAULT 0,     -- Points for referring a friend
  review_bonus INTEGER DEFAULT 0,       -- Points for leaving a review
  
  -- Redemption rules
  points_value_cents INTEGER DEFAULT 1, -- Value of 1 point in cents
  minimum_redemption INTEGER DEFAULT 100, -- Minimum points to redeem
  maximum_redemption_percent INTEGER DEFAULT 50, -- Max % of order payable with points
  
  -- Tiers (optional)
  enable_tiers BOOLEAN DEFAULT false,
  tiers JSONB DEFAULT '[]',
  -- Example: [
  --   { "name": "Bronze", "minPoints": 0, "multiplier": 1 },
  --   { "name": "Silver", "minPoints": 1000, "multiplier": 1.5 },
  --   { "name": "Gold", "minPoints": 5000, "multiplier": 2 }
  -- ]
  
  -- Expiration
  points_expire BOOLEAN DEFAULT false,
  points_expire_months INTEGER DEFAULT 12,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id)
);

-- Customer loyalty points balance
CREATE TABLE IF NOT EXISTS mod_ecommod01_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  
  -- Balance
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,  -- Total ever earned
  redeemed_points INTEGER DEFAULT 0,  -- Total ever redeemed
  
  -- Tier
  current_tier TEXT,
  tier_points INTEGER DEFAULT 0,     -- Points counting toward tier
  
  -- Audit
  last_earned_at TIMESTAMPTZ,
  last_redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, customer_id)
);

-- Loyalty point transactions
CREATE TABLE IF NOT EXISTS mod_ecommod01_loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN (
    'earn_purchase', 'earn_signup', 'earn_referral', 'earn_review', 
    'earn_bonus', 'earn_adjustment',
    'redeem_order', 'redeem_refund', 'redeem_adjustment',
    'expire', 'tier_bonus'
  )),
  points INTEGER NOT NULL,           -- Positive for earn, negative for redeem
  balance_after INTEGER NOT NULL,
  
  -- Reference
  order_id UUID,
  description TEXT,
  
  -- Multiplier applied (for tier bonus)
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Expiration tracking
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for loyalty
CREATE INDEX IF NOT EXISTS idx_loyalty_config_site ON mod_ecommod01_loyalty_config(site_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer ON mod_ecommod01_loyalty_points(site_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_balance ON mod_ecommod01_loyalty_points(site_id, points_balance) WHERE points_balance > 0;
CREATE INDEX IF NOT EXISTS idx_loyalty_txn_customer ON mod_ecommod01_loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_txn_site ON mod_ecommod01_loyalty_transactions(site_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_txn_order ON mod_ecommod01_loyalty_transactions(order_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE mod_ecommod01_flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_flash_sale_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Flash sales policies (using correct sites + agency_members join pattern)
CREATE POLICY "ecommod01_flash_sales_site_isolation"
  ON mod_ecommod01_flash_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "ecommod01_flash_sale_products_site_isolation"
  ON mod_ecommod01_flash_sale_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mod_ecommod01_flash_sales fs
      JOIN sites s ON s.id = fs.site_id
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE fs.id = flash_sale_id AND am.user_id = auth.uid()
    )
  );

-- Bundles policies
CREATE POLICY "ecommod01_bundles_site_isolation"
  ON mod_ecommod01_bundles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "ecommod01_bundle_items_site_isolation"
  ON mod_ecommod01_bundle_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mod_ecommod01_bundles b
      JOIN sites s ON s.id = b.site_id
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE b.id = bundle_id AND am.user_id = auth.uid()
    )
  );

-- Gift card policies
CREATE POLICY "ecommod01_gift_cards_site_isolation"
  ON mod_ecommod01_gift_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "ecommod01_gift_card_transactions_site_isolation"
  ON mod_ecommod01_gift_card_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mod_ecommod01_gift_cards gc
      JOIN sites s ON s.id = gc.site_id
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE gc.id = gift_card_id AND am.user_id = auth.uid()
    )
  );

-- Loyalty policies
CREATE POLICY "ecommod01_loyalty_config_site_isolation"
  ON mod_ecommod01_loyalty_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "ecommod01_loyalty_points_site_isolation"
  ON mod_ecommod01_loyalty_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid()
    )
  );

CREATE POLICY "ecommod01_loyalty_transactions_site_isolation"
  ON mod_ecommod01_loyalty_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE s.id = site_id AND am.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update flash sale status based on timing
CREATE OR REPLACE FUNCTION update_flash_sale_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND NOW() >= NEW.starts_at AND NOW() < NEW.ends_at THEN
    NEW.status := 'active';
  ELSIF NEW.status IN ('scheduled', 'active') AND NOW() >= NEW.ends_at THEN
    NEW.status := 'ended';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_flash_sale_status ON mod_ecommod01_flash_sales;
CREATE TRIGGER trigger_flash_sale_status
  BEFORE INSERT OR UPDATE ON mod_ecommod01_flash_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_sale_status();

-- Auto-update bundle pricing when items change
CREATE OR REPLACE FUNCTION update_bundle_pricing()
RETURNS TRIGGER AS $$
DECLARE
  v_bundle_id UUID;
  v_original_total INTEGER;
  v_bundle_price INTEGER;
  v_pricing_type TEXT;
  v_fixed_price INTEGER;
  v_discount_percentage INTEGER;
  v_cheapest_price INTEGER;
BEGIN
  -- Determine the bundle_id
  IF TG_OP = 'DELETE' THEN
    v_bundle_id := OLD.bundle_id;
  ELSE
    v_bundle_id := NEW.bundle_id;
  END IF;
  
  -- Get bundle pricing config
  SELECT pricing_type, fixed_price, discount_percentage
  INTO v_pricing_type, v_fixed_price, v_discount_percentage
  FROM mod_ecommod01_bundles
  WHERE id = v_bundle_id;
  
  -- Calculate original total from items
  SELECT COALESCE(SUM(
    COALESCE(bi.price_override, p.base_price * 100, 0) * bi.quantity
  ), 0)
  INTO v_original_total
  FROM mod_ecommod01_bundle_items bi
  JOIN mod_ecommod01_products p ON p.id = bi.product_id
  WHERE bi.bundle_id = v_bundle_id;
  
  -- Calculate bundle price based on pricing type
  CASE v_pricing_type
    WHEN 'fixed' THEN
      v_bundle_price := COALESCE(v_fixed_price, v_original_total);
    WHEN 'percentage_discount' THEN
      v_bundle_price := v_original_total - (v_original_total * COALESCE(v_discount_percentage, 0) / 100);
    WHEN 'cheapest_free' THEN
      -- Get cheapest item price
      SELECT MIN(COALESCE(bi.price_override, p.base_price * 100, 0))
      INTO v_cheapest_price
      FROM mod_ecommod01_bundle_items bi
      JOIN mod_ecommod01_products p ON p.id = bi.product_id
      WHERE bi.bundle_id = v_bundle_id;
      
      v_bundle_price := v_original_total - COALESCE(v_cheapest_price, 0);
    ELSE
      v_bundle_price := v_original_total;
  END CASE;
  
  -- Update bundle totals
  UPDATE mod_ecommod01_bundles
  SET 
    original_total = v_original_total,
    bundle_price = v_bundle_price,
    savings = v_original_total - v_bundle_price,
    updated_at = NOW()
  WHERE id = v_bundle_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bundle_items_pricing ON mod_ecommod01_bundle_items;
CREATE TRIGGER trigger_bundle_items_pricing
  AFTER INSERT OR UPDATE OR DELETE ON mod_ecommod01_bundle_items
  FOR EACH ROW
  EXECUTE FUNCTION update_bundle_pricing();

-- Update loyalty config timestamp
CREATE OR REPLACE FUNCTION update_loyalty_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_loyalty_config_timestamp ON mod_ecommod01_loyalty_config;
CREATE TRIGGER trigger_loyalty_config_timestamp
  BEFORE UPDATE ON mod_ecommod01_loyalty_config
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_config_timestamp();

-- Update gift card timestamp
CREATE OR REPLACE FUNCTION update_gift_card_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gift_card_timestamp ON mod_ecommod01_gift_cards;
CREATE TRIGGER trigger_gift_card_timestamp
  BEFORE UPDATE ON mod_ecommod01_gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_timestamp();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Generate unique gift card code
CREATE OR REPLACE FUNCTION generate_gift_card_code(
  p_prefix TEXT DEFAULT 'GIFT'
) RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := p_prefix || '-' || 
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)) || '-' ||
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    SELECT EXISTS(
      SELECT 1 FROM mod_ecommod01_gift_cards WHERE code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_flash_sales IS 'Time-limited promotional sales with countdown timers';
COMMENT ON TABLE mod_ecommod01_flash_sale_products IS 'Products included in flash sales with optional discount overrides';
COMMENT ON TABLE mod_ecommod01_bundles IS 'Product bundle definitions with various pricing strategies';
COMMENT ON TABLE mod_ecommod01_bundle_items IS 'Products included in bundles with quantities and price overrides';
COMMENT ON TABLE mod_ecommod01_gift_cards IS 'Gift cards and store credit for customers';
COMMENT ON TABLE mod_ecommod01_gift_card_transactions IS 'Transaction history for gift card usage';
COMMENT ON TABLE mod_ecommod01_loyalty_config IS 'Loyalty program configuration per site';
COMMENT ON TABLE mod_ecommod01_loyalty_points IS 'Customer loyalty point balances and tier status';
COMMENT ON TABLE mod_ecommod01_loyalty_transactions IS 'Transaction history for loyalty points';

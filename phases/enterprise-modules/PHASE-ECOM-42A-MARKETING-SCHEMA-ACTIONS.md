# PHASE-ECOM-42A: Marketing Features - Schema & Server Actions

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 6-7 hours
> **Prerequisites**: Waves 1-4 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the database schema and server actions for marketing features including flash sales/promotions, product bundles, gift cards/store credit, loyalty points, and promotional campaigns. This phase establishes the marketing engine for customer engagement and revenue growth.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing discounts-view.tsx component
- [ ] Verify existing discount tables if any
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Marketing Architecture (Phase 42A)
├── Database Schema
│   ├── mod_ecommod01_flash_sales       → Time-limited promotions
│   ├── mod_ecommod01_flash_sale_products → Products in flash sales
│   ├── mod_ecommod01_bundles           → Product bundles
│   ├── mod_ecommod01_bundle_items      → Bundle components
│   ├── mod_ecommod01_gift_cards        → Gift card definitions
│   ├── mod_ecommod01_gift_card_transactions → Gift card usage
│   ├── mod_ecommod01_loyalty_config    → Loyalty program settings
│   ├── mod_ecommod01_loyalty_points    → Customer point balances
│   └── mod_ecommod01_loyalty_transactions → Point history
│
├── Server Actions
│   ├── Flash Sales
│   │   ├── createFlashSale()         → Create promotion
│   │   ├── updateFlashSale()         → Modify settings
│   │   ├── getFlashSales()           → List sales
│   │   ├── getActiveFlashSales()     → Current sales
│   │   └── addProductsToFlashSale()  → Add products
│   │
│   ├── Bundles
│   │   ├── createBundle()            → Create bundle
│   │   ├── updateBundle()            → Modify bundle
│   │   ├── getBundles()              → List bundles
│   │   ├── addItemsToBundle()        → Add products
│   │   └── calculateBundlePrice()    → Compute pricing
│   │
│   ├── Gift Cards
│   │   ├── createGiftCard()          → Issue card
│   │   ├── redeemGiftCard()          → Apply to order
│   │   ├── getGiftCardBalance()      → Check balance
│   │   ├── refundToGiftCard()        → Credit card
│   │   └── getGiftCardHistory()      → Transaction log
│   │
│   └── Loyalty Points
│       ├── configureLoyalty()        → Program settings
│       ├── earnPoints()              → Credit points
│       ├── redeemPoints()            → Use points
│       ├── getPointsBalance()        → Current balance
│       └── getPointsHistory()        → Transaction log
│
└── Types (marketing-types.ts)
    ├── FlashSale
    ├── Bundle
    ├── GiftCard
    └── LoyaltyProgram
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `migrations/ecom-42-marketing.sql` | Create | Database schema for marketing |
| `src/modules/ecommerce/types/marketing-types.ts` | Create | TypeScript type definitions |
| `src/modules/ecommerce/actions/marketing-actions.ts` | Create | Server actions for marketing |

---

## 🗃️ Database Migration

**File**: `next-platform-dashboard/migrations/ecom-42-marketing.sql`
**Action**: Create

```sql
-- ============================================================================
-- PHASE-ECOM-42A: Marketing Features Database Schema
-- ============================================================================
-- Description: Creates tables for flash sales, bundles, gift cards, and loyalty.
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
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(bundle_id, product_id, variant_id)
);

-- Indexes for bundles
CREATE INDEX IF NOT EXISTS idx_bundles_site ON mod_ecommod01_bundles(site_id);
CREATE INDEX IF NOT EXISTS idx_bundles_active ON mod_ecommod01_bundles(site_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON mod_ecommod01_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON mod_ecommod01_bundle_items(product_id);

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
CREATE INDEX IF NOT EXISTS idx_loyalty_txn_customer ON mod_ecommod01_loyalty_transactions(customer_id);
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

-- Flash sales policies
CREATE POLICY "Users can manage flash sales for their agency sites"
  ON mod_ecommod01_flash_sales FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage flash sale products"
  ON mod_ecommod01_flash_sale_products FOR ALL
  USING (
    flash_sale_id IN (
      SELECT fs.id FROM mod_ecommod01_flash_sales fs
      JOIN sites s ON fs.site_id = s.id
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Bundles policies
CREATE POLICY "Users can manage bundles for their agency sites"
  ON mod_ecommod01_bundles FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage bundle items"
  ON mod_ecommod01_bundle_items FOR ALL
  USING (
    bundle_id IN (
      SELECT b.id FROM mod_ecommod01_bundles b
      JOIN sites s ON b.site_id = s.id
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Gift card policies
CREATE POLICY "Users can manage gift cards for their agency sites"
  ON mod_ecommod01_gift_cards FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view gift card transactions"
  ON mod_ecommod01_gift_card_transactions FOR ALL
  USING (
    gift_card_id IN (
      SELECT gc.id FROM mod_ecommod01_gift_cards gc
      JOIN sites s ON gc.site_id = s.id
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Loyalty policies
CREATE POLICY "Users can manage loyalty config for their agency sites"
  ON mod_ecommod01_loyalty_config FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view loyalty points for their agency sites"
  ON mod_ecommod01_loyalty_points FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view loyalty transactions for their agency sites"
  ON mod_ecommod01_loyalty_transactions FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
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

CREATE TRIGGER trigger_flash_sale_status
  BEFORE INSERT OR UPDATE ON mod_ecommod01_flash_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_sale_status();

-- Auto-update bundle pricing
CREATE OR REPLACE FUNCTION update_bundle_pricing()
RETURNS TRIGGER AS $$
DECLARE
  v_original_total INTEGER;
  v_bundle_price INTEGER;
BEGIN
  -- Calculate original total from items
  SELECT COALESCE(SUM(
    COALESCE(bi.price_override, p.price, 0) * bi.quantity
  ), 0)
  INTO v_original_total
  FROM mod_ecommod01_bundle_items bi
  JOIN mod_ecommod01_products p ON p.id = bi.product_id
  WHERE bi.bundle_id = COALESCE(NEW.bundle_id, NEW.id);
  
  -- Get the bundle record for pricing type
  IF TG_TABLE_NAME = 'mod_ecommod01_bundle_items' THEN
    SELECT 
      CASE 
        WHEN b.pricing_type = 'fixed' THEN b.fixed_price
        WHEN b.pricing_type = 'percentage_discount' THEN 
          v_original_total - (v_original_total * b.discount_percentage / 100)
        WHEN b.pricing_type = 'cheapest_free' THEN
          v_original_total - (
            SELECT MIN(COALESCE(bi2.price_override, p2.price, 0))
            FROM mod_ecommod01_bundle_items bi2
            JOIN mod_ecommod01_products p2 ON p2.id = bi2.product_id
            WHERE bi2.bundle_id = NEW.bundle_id
          )
        ELSE v_original_total
      END
    INTO v_bundle_price
    FROM mod_ecommod01_bundles b
    WHERE b.id = NEW.bundle_id;
    
    -- Update bundle totals
    UPDATE mod_ecommod01_bundles
    SET 
      original_total = v_original_total,
      bundle_price = v_bundle_price,
      savings = v_original_total - v_bundle_price,
      updated_at = NOW()
    WHERE id = NEW.bundle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bundle_items_pricing
  AFTER INSERT OR UPDATE OR DELETE ON mod_ecommod01_bundle_items
  FOR EACH ROW
  EXECUTE FUNCTION update_bundle_pricing();

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

COMMENT ON TABLE mod_ecommod01_flash_sales IS 'Time-limited promotional sales';
COMMENT ON TABLE mod_ecommod01_bundles IS 'Product bundle definitions';
COMMENT ON TABLE mod_ecommod01_gift_cards IS 'Gift card and store credit';
COMMENT ON TABLE mod_ecommod01_loyalty_config IS 'Loyalty program configuration';
COMMENT ON TABLE mod_ecommod01_loyalty_points IS 'Customer loyalty point balances';
```

---

## 📋 Implementation Tasks

### Task 42A.1: Create Marketing Types

**File**: `src/modules/ecommerce/types/marketing-types.ts`
**Action**: Create

```typescript
/**
 * Marketing Types
 * 
 * Phase ECOM-42A: Marketing Features - Schema & Server Actions
 * 
 * Type definitions for flash sales, bundles, gift cards, and loyalty.
 */

// ============================================================================
// FLASH SALES
// ============================================================================

export type FlashSaleDiscountType = 'percentage' | 'fixed_amount'
export type FlashSaleStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled'

export interface FlashSale {
  id: string
  site_id: string
  
  name: string
  description: string | null
  slug: string
  
  starts_at: string
  ends_at: string
  
  discount_type: FlashSaleDiscountType
  discount_value: number  // Percentage or cents
  
  max_uses: number | null
  max_uses_per_customer: number | null
  current_uses: number
  
  is_featured: boolean
  show_countdown: boolean
  banner_image: string | null
  badge_text: string | null
  
  status: FlashSaleStatus
  
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Joined
  products?: FlashSaleProduct[]
  product_count?: number
}

export interface FlashSaleProduct {
  id: string
  flash_sale_id: string
  product_id: string
  
  discount_type: FlashSaleDiscountType | null
  discount_value: number | null
  
  quantity_limit: number | null
  quantity_sold: number
  
  sort_order: number
  created_at: string
  
  // Joined
  product?: {
    id: string
    name: string
    price: number
    images: string[]
  }
  sale_price?: number  // Computed
}

export interface FlashSaleInput {
  name: string
  description?: string
  slug: string
  starts_at: string
  ends_at: string
  discount_type: FlashSaleDiscountType
  discount_value: number
  max_uses?: number
  max_uses_per_customer?: number
  is_featured?: boolean
  show_countdown?: boolean
  banner_image?: string
  badge_text?: string
}

export interface FlashSaleUpdate extends Partial<FlashSaleInput> {
  status?: FlashSaleStatus
}

export interface AddFlashSaleProductInput {
  product_id: string
  discount_type?: FlashSaleDiscountType
  discount_value?: number
  quantity_limit?: number
  sort_order?: number
}

// ============================================================================
// PRODUCT BUNDLES
// ============================================================================

export type BundlePricingType = 'fixed' | 'percentage_discount' | 'cheapest_free'

export interface Bundle {
  id: string
  site_id: string
  
  name: string
  description: string | null
  slug: string
  sku: string | null
  
  images: string[]
  
  pricing_type: BundlePricingType
  fixed_price: number | null
  discount_percentage: number | null
  
  original_total: number
  bundle_price: number
  savings: number
  
  track_inventory: boolean
  quantity: number
  
  is_active: boolean
  available_from: string | null
  available_until: string | null
  
  show_savings: boolean
  badge_text: string | null
  
  created_by: string | null
  created_at: string
  updated_at: string
  
  // Joined
  items?: BundleItem[]
}

export interface BundleItem {
  id: string
  bundle_id: string
  product_id: string
  
  quantity: number
  variant_id: string | null
  price_override: number | null
  is_optional: boolean
  sort_order: number
  
  created_at: string
  
  // Joined
  product?: {
    id: string
    name: string
    price: number
    images: string[]
  }
  variant?: {
    id: string
    name: string
    price: number | null
  }
}

export interface BundleInput {
  name: string
  description?: string
  slug: string
  sku?: string
  images?: string[]
  pricing_type: BundlePricingType
  fixed_price?: number
  discount_percentage?: number
  track_inventory?: boolean
  quantity?: number
  available_from?: string
  available_until?: string
  show_savings?: boolean
  badge_text?: string
}

export interface BundleUpdate extends Partial<BundleInput> {
  is_active?: boolean
}

export interface BundleItemInput {
  product_id: string
  quantity?: number
  variant_id?: string
  price_override?: number
  is_optional?: boolean
  sort_order?: number
}

// ============================================================================
// GIFT CARDS
// ============================================================================

export type GiftCardType = 'standard' | 'promotional' | 'reward' | 'refund'
export type GiftCardDelivery = 'email' | 'physical' | 'instant'
export type GiftCardTransactionType = 'purchase' | 'redemption' | 'refund' | 'adjustment' | 'expiration'

export interface GiftCard {
  id: string
  site_id: string
  
  code: string
  pin: string | null
  
  initial_balance: number
  current_balance: number
  currency: string
  
  type: GiftCardType
  
  is_active: boolean
  expires_at: string | null
  
  minimum_order: number | null
  max_uses: number | null
  current_uses: number
  
  sender_name: string | null
  sender_email: string | null
  recipient_name: string | null
  recipient_email: string | null
  personal_message: string | null
  
  delivery_method: GiftCardDelivery | null
  delivered_at: string | null
  
  purchased_by: string | null
  order_id: string | null
  
  created_at: string
  updated_at: string
  
  // Joined
  transactions?: GiftCardTransaction[]
}

export interface GiftCardTransaction {
  id: string
  gift_card_id: string
  
  type: GiftCardTransactionType
  amount: number
  balance_after: number
  
  order_id: string | null
  notes: string | null
  
  performed_by: string | null
  created_at: string
}

export interface GiftCardInput {
  initial_balance: number
  currency?: string
  type?: GiftCardType
  expires_at?: string
  minimum_order?: number
  max_uses?: number
  sender_name?: string
  sender_email?: string
  recipient_name?: string
  recipient_email?: string
  personal_message?: string
  delivery_method?: GiftCardDelivery
}

export interface GiftCardRedemption {
  gift_card_id: string
  amount: number
  order_id: string
}

// ============================================================================
// LOYALTY PROGRAM
// ============================================================================

export interface LoyaltyTier {
  name: string
  minPoints: number
  multiplier: number
  benefits?: string[]
}

export interface LoyaltyConfig {
  id: string
  site_id: string
  
  is_enabled: boolean
  program_name: string
  points_name: string
  
  points_per_dollar: number
  signup_bonus: number
  referral_bonus: number
  review_bonus: number
  
  points_value_cents: number
  minimum_redemption: number
  maximum_redemption_percent: number
  
  enable_tiers: boolean
  tiers: LoyaltyTier[]
  
  points_expire: boolean
  points_expire_months: number
  
  created_at: string
  updated_at: string
}

export interface LoyaltyConfigInput {
  is_enabled?: boolean
  program_name?: string
  points_name?: string
  points_per_dollar?: number
  signup_bonus?: number
  referral_bonus?: number
  review_bonus?: number
  points_value_cents?: number
  minimum_redemption?: number
  maximum_redemption_percent?: number
  enable_tiers?: boolean
  tiers?: LoyaltyTier[]
  points_expire?: boolean
  points_expire_months?: number
}

export interface LoyaltyPoints {
  id: string
  site_id: string
  customer_id: string
  
  points_balance: number
  lifetime_points: number
  redeemed_points: number
  
  current_tier: string | null
  tier_points: number
  
  last_earned_at: string | null
  last_redeemed_at: string | null
  created_at: string
  updated_at: string
}

export type LoyaltyTransactionType = 
  | 'earn_purchase' 
  | 'earn_signup' 
  | 'earn_referral' 
  | 'earn_review'
  | 'earn_bonus' 
  | 'earn_adjustment'
  | 'redeem_order' 
  | 'redeem_refund' 
  | 'redeem_adjustment'
  | 'expire' 
  | 'tier_bonus'

export interface LoyaltyTransaction {
  id: string
  site_id: string
  customer_id: string
  
  type: LoyaltyTransactionType
  points: number
  balance_after: number
  
  order_id: string | null
  description: string | null
  
  multiplier: number
  expires_at: string | null
  
  created_at: string
}

export interface EarnPointsInput {
  customer_id: string
  type: LoyaltyTransactionType
  points: number
  order_id?: string
  description?: string
}

export interface RedeemPointsInput {
  customer_id: string
  points: number
  order_id: string
}
```

---

### Task 42A.2: Create Marketing Server Actions

**File**: `src/modules/ecommerce/actions/marketing-actions.ts`
**Action**: Create

```typescript
/**
 * Marketing Server Actions
 * 
 * Phase ECOM-42A: Marketing Features - Schema & Server Actions
 * 
 * Server actions for flash sales, bundles, gift cards, and loyalty.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FlashSale,
  FlashSaleInput,
  FlashSaleUpdate,
  FlashSaleProduct,
  AddFlashSaleProductInput,
  Bundle,
  BundleInput,
  BundleUpdate,
  BundleItem,
  BundleItemInput,
  GiftCard,
  GiftCardInput,
  GiftCardTransaction,
  GiftCardRedemption,
  LoyaltyConfig,
  LoyaltyConfigInput,
  LoyaltyPoints,
  LoyaltyTransaction,
  EarnPointsInput,
  RedeemPointsInput
} from '../types/marketing-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// HELPERS
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

// ============================================================================
// FLASH SALES
// ============================================================================

/**
 * Get all flash sales for a site
 */
export async function getFlashSales(
  siteId: string,
  status?: string
): Promise<FlashSale[]> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .select(`
        *,
        products:${TABLE_PREFIX}_flash_sale_products(count)
      `)
      .eq('site_id', siteId)
      .order('starts_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return (data ?? []).map(sale => ({
      ...sale,
      product_count: sale.products?.[0]?.count ?? 0
    }))
  } catch (error) {
    console.error('Error getting flash sales:', error)
    return []
  }
}

/**
 * Get active flash sales (currently running)
 */
export async function getActiveFlashSales(siteId: string): Promise<FlashSale[]> {
  try {
    const supabase = await getModuleClient()
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .select(`
        *,
        products:${TABLE_PREFIX}_flash_sale_products(
          *,
          product:${TABLE_PREFIX}_products(id, name, price, images)
        )
      `)
      .eq('site_id', siteId)
      .eq('status', 'active')
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('ends_at', { ascending: true })
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting active flash sales:', error)
    return []
  }
}

/**
 * Get a single flash sale by ID
 */
export async function getFlashSale(saleId: string): Promise<FlashSale | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .select(`
        *,
        products:${TABLE_PREFIX}_flash_sale_products(
          *,
          product:${TABLE_PREFIX}_products(id, name, price, images, sku)
        )
      `)
      .eq('id', saleId)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error getting flash sale:', error)
    return null
  }
}

/**
 * Create a new flash sale
 */
export async function createFlashSale(
  siteId: string,
  input: FlashSaleInput
): Promise<{ success: boolean; sale?: FlashSale; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Determine initial status based on timing
    const now = new Date()
    const startsAt = new Date(input.starts_at)
    const endsAt = new Date(input.ends_at)
    
    let status = 'draft'
    if (startsAt <= now && endsAt > now) {
      status = 'active'
    } else if (startsAt > now) {
      status = 'scheduled'
    } else if (endsAt <= now) {
      status = 'ended'
    }
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .insert({
        site_id: siteId,
        ...input,
        status,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true, sale: data }
  } catch (error) {
    console.error('Error creating flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create flash sale' 
    }
  }
}

/**
 * Update a flash sale
 */
export async function updateFlashSale(
  saleId: string,
  updates: FlashSaleUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .update(updates)
      .eq('id', saleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error updating flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update flash sale' 
    }
  }
}

/**
 * Delete a flash sale
 */
export async function deleteFlashSale(
  saleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sales`)
      .delete()
      .eq('id', saleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error deleting flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete flash sale' 
    }
  }
}

/**
 * Add products to a flash sale
 */
export async function addProductsToFlashSale(
  saleId: string,
  products: AddFlashSaleProductInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const rows = products.map((p, index) => ({
      flash_sale_id: saleId,
      product_id: p.product_id,
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      quantity_limit: p.quantity_limit,
      sort_order: p.sort_order ?? index
    }))
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sale_products`)
      .upsert(rows, { 
        onConflict: 'flash_sale_id,product_id',
        ignoreDuplicates: false 
      })
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error adding products to flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add products' 
    }
  }
}

/**
 * Remove a product from a flash sale
 */
export async function removeProductFromFlashSale(
  saleId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_flash_sale_products`)
      .delete()
      .eq('flash_sale_id', saleId)
      .eq('product_id', productId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error removing product from flash sale:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove product' 
    }
  }
}

// ============================================================================
// BUNDLES
// ============================================================================

/**
 * Get all bundles for a site
 */
export async function getBundles(
  siteId: string,
  activeOnly: boolean = false
): Promise<Bundle[]> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .select(`
        *,
        items:${TABLE_PREFIX}_bundle_items(
          *,
          product:${TABLE_PREFIX}_products(id, name, price, images)
        )
      `)
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting bundles:', error)
    return []
  }
}

/**
 * Get a single bundle by ID
 */
export async function getBundle(bundleId: string): Promise<Bundle | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .select(`
        *,
        items:${TABLE_PREFIX}_bundle_items(
          *,
          product:${TABLE_PREFIX}_products(id, name, price, images, sku),
          variant:${TABLE_PREFIX}_product_variants(id, name, price)
        )
      `)
      .eq('id', bundleId)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error getting bundle:', error)
    return null
  }
}

/**
 * Create a new bundle
 */
export async function createBundle(
  siteId: string,
  input: BundleInput
): Promise<{ success: boolean; bundle?: Bundle; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .insert({
        site_id: siteId,
        ...input,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true, bundle: data }
  } catch (error) {
    console.error('Error creating bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create bundle' 
    }
  }
}

/**
 * Update a bundle
 */
export async function updateBundle(
  bundleId: string,
  updates: BundleUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .update(updates)
      .eq('id', bundleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error updating bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update bundle' 
    }
  }
}

/**
 * Delete a bundle
 */
export async function deleteBundle(
  bundleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_bundles`)
      .delete()
      .eq('id', bundleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error deleting bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete bundle' 
    }
  }
}

/**
 * Add items to a bundle
 */
export async function addItemsToBundle(
  bundleId: string,
  items: BundleItemInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const rows = items.map((item, index) => ({
      bundle_id: bundleId,
      product_id: item.product_id,
      quantity: item.quantity ?? 1,
      variant_id: item.variant_id,
      price_override: item.price_override,
      is_optional: item.is_optional ?? false,
      sort_order: item.sort_order ?? index
    }))
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_bundle_items`)
      .upsert(rows, {
        onConflict: 'bundle_id,product_id,variant_id',
        ignoreDuplicates: false
      })
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error adding items to bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add items' 
    }
  }
}

/**
 * Remove an item from a bundle
 */
export async function removeItemFromBundle(
  bundleId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_bundle_items`)
      .delete()
      .eq('id', itemId)
      .eq('bundle_id', bundleId)
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error removing item from bundle:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove item' 
    }
  }
}

// ============================================================================
// GIFT CARDS
// ============================================================================

/**
 * Get gift cards for a site
 */
export async function getGiftCards(
  siteId: string,
  options?: { 
    type?: string
    active_only?: boolean
    limit?: number
  }
): Promise<GiftCard[]> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (options?.type) {
      query = query.eq('type', options.type)
    }
    
    if (options?.active_only) {
      query = query.eq('is_active', true)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting gift cards:', error)
    return []
  }
}

/**
 * Get a gift card by code
 */
export async function getGiftCardByCode(
  siteId: string,
  code: string
): Promise<GiftCard | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select(`
        *,
        transactions:${TABLE_PREFIX}_gift_card_transactions(*)
      `)
      .eq('site_id', siteId)
      .eq('code', code.toUpperCase())
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error getting gift card:', error)
    return null
  }
}

/**
 * Create a new gift card
 */
export async function createGiftCard(
  siteId: string,
  input: GiftCardInput
): Promise<{ success: boolean; gift_card?: GiftCard; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Generate unique code using database function
    const { data: codeResult } = await supabase
      .rpc('generate_gift_card_code')
    
    const code = codeResult || `GIFT-${Date.now().toString(36).toUpperCase()}`
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .insert({
        site_id: siteId,
        code,
        current_balance: input.initial_balance,
        ...input,
        purchased_by: user?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Record initial purchase transaction
    await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .insert({
        gift_card_id: data.id,
        type: 'purchase',
        amount: input.initial_balance,
        balance_after: input.initial_balance,
        performed_by: user?.id
      })
    
    revalidatePath('/ecommerce/marketing')
    return { success: true, gift_card: data }
  } catch (error) {
    console.error('Error creating gift card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create gift card' 
    }
  }
}

/**
 * Redeem a gift card for an order
 */
export async function redeemGiftCard(
  siteId: string,
  redemption: GiftCardRedemption
): Promise<{ success: boolean; amount_applied?: number; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get current gift card
    const { data: card } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select('*')
      .eq('id', redemption.gift_card_id)
      .eq('site_id', siteId)
      .single()
    
    if (!card) {
      return { success: false, error: 'Gift card not found' }
    }
    
    if (!card.is_active) {
      return { success: false, error: 'Gift card is not active' }
    }
    
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return { success: false, error: 'Gift card has expired' }
    }
    
    if (card.current_balance < redemption.amount) {
      return { success: false, error: 'Insufficient balance' }
    }
    
    // Deduct balance
    const newBalance = card.current_balance - redemption.amount
    
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .update({ 
        current_balance: newBalance,
        current_uses: card.current_uses + 1
      })
      .eq('id', redemption.gift_card_id)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .insert({
        gift_card_id: redemption.gift_card_id,
        type: 'redemption',
        amount: -redemption.amount,
        balance_after: newBalance,
        order_id: redemption.order_id,
        performed_by: user?.id
      })
    
    return { success: true, amount_applied: redemption.amount }
  } catch (error) {
    console.error('Error redeeming gift card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to redeem gift card' 
    }
  }
}

/**
 * Refund to a gift card
 */
export async function refundToGiftCard(
  giftCardId: string,
  amount: number,
  orderId?: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get current balance
    const { data: card } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .select('current_balance')
      .eq('id', giftCardId)
      .single()
    
    if (!card) {
      return { success: false, error: 'Gift card not found' }
    }
    
    const newBalance = card.current_balance + amount
    
    // Update balance
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_gift_cards`)
      .update({ current_balance: newBalance })
      .eq('id', giftCardId)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .insert({
        gift_card_id: giftCardId,
        type: 'refund',
        amount,
        balance_after: newBalance,
        order_id: orderId,
        notes,
        performed_by: user?.id
      })
    
    return { success: true }
  } catch (error) {
    console.error('Error refunding to gift card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refund' 
    }
  }
}

/**
 * Get gift card transaction history
 */
export async function getGiftCardTransactions(
  giftCardId: string
): Promise<GiftCardTransaction[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_gift_card_transactions`)
      .select('*')
      .eq('gift_card_id', giftCardId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting gift card transactions:', error)
    return []
  }
}

// ============================================================================
// LOYALTY PROGRAM
// ============================================================================

/**
 * Get loyalty program config for a site
 */
export async function getLoyaltyConfig(
  siteId: string
): Promise<LoyaltyConfig | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_config`)
      .select('*')
      .eq('site_id', siteId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return data
  } catch (error) {
    console.error('Error getting loyalty config:', error)
    return null
  }
}

/**
 * Configure loyalty program
 */
export async function configureLoyalty(
  siteId: string,
  input: LoyaltyConfigInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_config`)
      .upsert({
        site_id: siteId,
        ...input
      }, {
        onConflict: 'site_id'
      })
    
    if (error) throw error
    
    revalidatePath('/ecommerce/marketing')
    return { success: true }
  } catch (error) {
    console.error('Error configuring loyalty:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to configure loyalty' 
    }
  }
}

/**
 * Get customer loyalty points
 */
export async function getCustomerLoyaltyPoints(
  siteId: string,
  customerId: string
): Promise<LoyaltyPoints | null> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select('*')
      .eq('site_id', siteId)
      .eq('customer_id', customerId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    return data
  } catch (error) {
    console.error('Error getting customer loyalty points:', error)
    return null
  }
}

/**
 * Earn loyalty points
 */
export async function earnPoints(
  siteId: string,
  input: EarnPointsInput
): Promise<{ success: boolean; new_balance?: number; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get or create loyalty points record
    let { data: pointsRecord } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select('*')
      .eq('site_id', siteId)
      .eq('customer_id', input.customer_id)
      .single()
    
    if (!pointsRecord) {
      // Create new record
      const { data: newRecord, error: createError } = await supabase
        .from(`${TABLE_PREFIX}_loyalty_points`)
        .insert({
          site_id: siteId,
          customer_id: input.customer_id,
          points_balance: 0,
          lifetime_points: 0,
          redeemed_points: 0
        })
        .select()
        .single()
      
      if (createError) throw createError
      pointsRecord = newRecord
    }
    
    const newBalance = pointsRecord.points_balance + input.points
    const newLifetime = pointsRecord.lifetime_points + input.points
    
    // Update balance
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .update({
        points_balance: newBalance,
        lifetime_points: newLifetime,
        last_earned_at: new Date().toISOString()
      })
      .eq('id', pointsRecord.id)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_loyalty_transactions`)
      .insert({
        site_id: siteId,
        customer_id: input.customer_id,
        type: input.type,
        points: input.points,
        balance_after: newBalance,
        order_id: input.order_id,
        description: input.description
      })
    
    return { success: true, new_balance: newBalance }
  } catch (error) {
    console.error('Error earning points:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to earn points' 
    }
  }
}

/**
 * Redeem loyalty points
 */
export async function redeemPoints(
  siteId: string,
  input: RedeemPointsInput
): Promise<{ success: boolean; new_balance?: number; discount_value?: number; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get config for point value
    const config = await getLoyaltyConfig(siteId)
    
    if (!config?.is_enabled) {
      return { success: false, error: 'Loyalty program is not enabled' }
    }
    
    // Get current balance
    const { data: pointsRecord } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .select('*')
      .eq('site_id', siteId)
      .eq('customer_id', input.customer_id)
      .single()
    
    if (!pointsRecord) {
      return { success: false, error: 'No loyalty points found' }
    }
    
    if (pointsRecord.points_balance < input.points) {
      return { success: false, error: 'Insufficient points' }
    }
    
    if (input.points < config.minimum_redemption) {
      return { success: false, error: `Minimum redemption is ${config.minimum_redemption} points` }
    }
    
    const newBalance = pointsRecord.points_balance - input.points
    const newRedeemed = pointsRecord.redeemed_points + input.points
    const discountValue = input.points * config.points_value_cents
    
    // Update balance
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_points`)
      .update({
        points_balance: newBalance,
        redeemed_points: newRedeemed,
        last_redeemed_at: new Date().toISOString()
      })
      .eq('id', pointsRecord.id)
    
    if (updateError) throw updateError
    
    // Record transaction
    await supabase
      .from(`${TABLE_PREFIX}_loyalty_transactions`)
      .insert({
        site_id: siteId,
        customer_id: input.customer_id,
        type: 'redeem_order',
        points: -input.points,
        balance_after: newBalance,
        order_id: input.order_id
      })
    
    return { success: true, new_balance: newBalance, discount_value: discountValue }
  } catch (error) {
    console.error('Error redeeming points:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to redeem points' 
    }
  }
}

/**
 * Get loyalty transaction history for a customer
 */
export async function getCustomerLoyaltyHistory(
  siteId: string,
  customerId: string,
  limit: number = 50
): Promise<LoyaltyTransaction[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_loyalty_transactions`)
      .select('*')
      .eq('site_id', siteId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting loyalty history:', error)
    return []
  }
}
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Database migration runs without errors
- [ ] Test `createFlashSale()` creates sale with correct status
- [ ] Test `getActiveFlashSales()` returns current sales
- [ ] Test `createBundle()` creates bundle correctly
- [ ] Test bundle pricing calculates automatically
- [ ] Test `createGiftCard()` generates unique code
- [ ] Test `redeemGiftCard()` deducts balance correctly
- [ ] Test `earnPoints()` credits customer balance
- [ ] Test `redeemPoints()` applies discount correctly
- [ ] Verify RLS policies allow authorized access

---

## 🔄 Rollback Plan

If issues occur:

1. **Database Rollback**:
```sql
DROP TABLE IF EXISTS mod_ecommod01_loyalty_transactions CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_loyalty_points CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_loyalty_config CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_gift_card_transactions CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_gift_cards CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_bundle_items CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_bundles CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_flash_sale_products CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_flash_sales CASCADE;
DROP FUNCTION IF EXISTS generate_gift_card_code CASCADE;
DROP FUNCTION IF EXISTS update_flash_sale_status CASCADE;
DROP FUNCTION IF EXISTS update_bundle_pricing CASCADE;
```

2. **Code Rollback**:
```bash
git checkout HEAD~1 -- src/modules/ecommerce/actions/marketing-actions.ts
git checkout HEAD~1 -- src/modules/ecommerce/types/marketing-types.ts
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-42A completion note
- `progress.md`: Update Wave 5 section

---

## ✨ Success Criteria

- [ ] All 9 marketing tables created with proper indexes
- [ ] Flash sales CRUD with product associations works
- [ ] Bundles CRUD with automatic pricing calculation works
- [ ] Gift card creation with unique codes works
- [ ] Gift card redemption deducts balance correctly
- [ ] Loyalty program configuration works
- [ ] Points earning and redemption works
- [ ] All RLS policies in place
- [ ] Zero TypeScript errors

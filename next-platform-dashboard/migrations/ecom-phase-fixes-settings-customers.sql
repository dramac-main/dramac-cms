-- ==========================================
-- E-COMMERCE MODULE PHASE FIXES
-- Phase ECOM-03/05: Settings & Customer Management
-- 
-- This migration adds missing columns for:
-- 1. Settings JSON columns (general, currency, inventory, etc.)
-- 2. Customers table and related tables
-- ==========================================

-- ==========================================
-- PART 1: ADD SETTINGS JSON COLUMNS
-- ==========================================

-- Add JSON settings columns to mod_ecommod01_settings
ALTER TABLE mod_ecommod01_settings 
ADD COLUMN IF NOT EXISTS general_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS currency_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tax_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shipping_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS checkout_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS inventory_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS legal_settings JSONB DEFAULT '{}';

-- ==========================================
-- PART 2: CUSTOMERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Basic Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'guest')),
  
  -- Marketing
  accepts_marketing BOOLEAN DEFAULT false,
  marketing_opt_in_at TIMESTAMPTZ,
  
  -- Stats (denormalized for performance)
  orders_count INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0, -- In cents
  average_order_value INTEGER DEFAULT 0, -- In cents
  notes_count INTEGER DEFAULT 0,
  
  -- Tags & Groups (for filtering)
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_order_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  
  UNIQUE(site_id, email)
);

-- ==========================================
-- PART 3: CUSTOMER ADDRESSES
-- ==========================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  
  -- Address Type
  address_type TEXT DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing', 'both')),
  is_default_shipping BOOLEAN DEFAULT false,
  is_default_billing BOOLEAN DEFAULT false,
  
  -- Name (for recipient)
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  
  -- Address Fields
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  phone TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PART 4: CUSTOMER GROUPS
-- ==========================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Badge color
  
  -- Discount for group members
  discount_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Stats (denormalized)
  customer_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, name)
);

-- ==========================================
-- PART 5: CUSTOMER GROUP MEMBERS (Junction Table)
-- ==========================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mod_ecommod01_customer_groups(id) ON DELETE CASCADE,
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, group_id)
);

-- ==========================================
-- PART 6: CUSTOMER NOTES
-- ==========================================

CREATE TABLE IF NOT EXISTS mod_ecommod01_customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  author_id UUID, -- User ID from auth.users
  author_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PART 7: ORDER MANAGEMENT TABLES (ECOM-04)
-- ==========================================

-- Order Timeline Events
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'status_changed', 'payment_received', 'payment_failed',
    'shipped', 'delivered', 'note_added', 'refund_requested', 
    'refund_processed', 'cancelled', 'customer_email_sent', 
    'address_updated', 'item_added', 'item_removed', 'email_sent'
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID, -- User ID
  actor_name TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Notes
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- false = visible to customer
  author_id UUID,
  author_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Shipments
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  
  carrier TEXT NOT NULL,
  tracking_number TEXT,
  tracking_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'in_transit', 'delivered', 'failed')),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  
  -- Items included in this shipment (JSON array of order_item_ids)
  items JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Refunds
CREATE TABLE IF NOT EXISTS mod_ecommod01_order_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mod_ecommod01_orders(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL, -- In cents
  currency TEXT DEFAULT 'USD',
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'declined')),
  
  refund_type TEXT DEFAULT 'full' CHECK (refund_type IN ('full', 'partial', 'items')),
  
  -- Items refunded (if partial/items refund)
  items JSONB DEFAULT '[]',
  
  -- Processing info
  processor_id UUID, -- User who processed
  processor_name TEXT,
  processed_at TIMESTAMPTZ,
  payment_refund_id TEXT, -- External refund ID from payment provider
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_customers_site ON mod_ecommod01_customers(site_id);
CREATE INDEX IF NOT EXISTS idx_ecommod01_customers_email ON mod_ecommod01_customers(site_id, email);
CREATE INDEX IF NOT EXISTS idx_ecommod01_customers_status ON mod_ecommod01_customers(site_id, status);
CREATE INDEX IF NOT EXISTS idx_ecommod01_customers_created ON mod_ecommod01_customers(site_id, created_at DESC);

-- Customer addresses indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_customer_addresses_customer ON mod_ecommod01_customer_addresses(customer_id);

-- Customer groups indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_customer_groups_site ON mod_ecommod01_customer_groups(site_id);

-- Customer notes indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_customer_notes_customer ON mod_ecommod01_customer_notes(customer_id);

-- Order timeline indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_order_timeline_order ON mod_ecommod01_order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_ecommod01_order_timeline_created ON mod_ecommod01_order_timeline(order_id, created_at);

-- Order notes indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_order_notes_order ON mod_ecommod01_order_notes(order_id);

-- Order shipments indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_order_shipments_order ON mod_ecommod01_order_shipments(order_id);

-- Order refunds indexes
CREATE INDEX IF NOT EXISTS idx_ecommod01_order_refunds_order ON mod_ecommod01_order_refunds(order_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE mod_ecommod01_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_order_refunds ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "ecommod01_customers_site_isolation" ON mod_ecommod01_customers
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Customer addresses policies
CREATE POLICY "ecommod01_customer_addresses_access" ON mod_ecommod01_customer_addresses
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM mod_ecommod01_customers WHERE site_id IN (
        SELECT id FROM sites 
        WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Customer groups policies
CREATE POLICY "ecommod01_customer_groups_site_isolation" ON mod_ecommod01_customer_groups
  FOR ALL USING (
    site_id IN (
      SELECT id FROM sites 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

-- Customer group members policies
CREATE POLICY "ecommod01_customer_group_members_access" ON mod_ecommod01_customer_group_members
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM mod_ecommod01_customers WHERE site_id IN (
        SELECT id FROM sites 
        WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Customer notes policies
CREATE POLICY "ecommod01_customer_notes_access" ON mod_ecommod01_customer_notes
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM mod_ecommod01_customers WHERE site_id IN (
        SELECT id FROM sites 
        WHERE agency_id IN (
          SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Order timeline policies
CREATE POLICY "ecommod01_order_timeline_access" ON mod_ecommod01_order_timeline
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

-- Order notes policies
CREATE POLICY "ecommod01_order_notes_access" ON mod_ecommod01_order_notes
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

-- Order shipments policies
CREATE POLICY "ecommod01_order_shipments_access" ON mod_ecommod01_order_shipments
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

-- Order refunds policies
CREATE POLICY "ecommod01_order_refunds_access" ON mod_ecommod01_order_refunds
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

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE TRIGGER trigger_ecommod01_customers_updated_at
  BEFORE UPDATE ON mod_ecommod01_customers
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

CREATE TRIGGER trigger_ecommod01_customer_addresses_updated_at
  BEFORE UPDATE ON mod_ecommod01_customer_addresses
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

CREATE TRIGGER trigger_ecommod01_customer_groups_updated_at
  BEFORE UPDATE ON mod_ecommod01_customer_groups
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_updated_at();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to update customer stats after order changes
CREATE OR REPLACE FUNCTION mod_ecommod01_update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer stats when order is modified
  UPDATE mod_ecommod01_customers
  SET 
    orders_count = (
      SELECT COUNT(*) FROM mod_ecommod01_orders 
      WHERE customer_id = NEW.customer_id 
      AND status NOT IN ('cancelled', 'refunded')
    ),
    total_spent = COALESCE((
      SELECT SUM(total) FROM mod_ecommod01_orders 
      WHERE customer_id = NEW.customer_id 
      AND payment_status = 'paid'
    ), 0),
    last_order_at = (
      SELECT MAX(created_at) FROM mod_ecommod01_orders 
      WHERE customer_id = NEW.customer_id
    ),
    updated_at = NOW()
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats
DROP TRIGGER IF EXISTS trigger_ecommod01_order_customer_stats ON mod_ecommod01_orders;
CREATE TRIGGER trigger_ecommod01_order_customer_stats
  AFTER INSERT OR UPDATE ON mod_ecommod01_orders
  FOR EACH ROW 
  WHEN (NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION mod_ecommod01_update_customer_stats();

-- Function to update customer notes count
CREATE OR REPLACE FUNCTION mod_ecommod01_update_customer_notes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE mod_ecommod01_customers
    SET notes_count = notes_count + 1
    WHERE id = NEW.customer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE mod_ecommod01_customers
    SET notes_count = notes_count - 1
    WHERE id = OLD.customer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notes count
CREATE TRIGGER trigger_ecommod01_customer_notes_count
  AFTER INSERT OR DELETE ON mod_ecommod01_customer_notes
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_customer_notes_count();

-- Function to update group member count
CREATE OR REPLACE FUNCTION mod_ecommod01_update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE mod_ecommod01_customer_groups
    SET customer_count = customer_count + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE mod_ecommod01_customer_groups
    SET customer_count = customer_count - 1
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for group member count
CREATE TRIGGER trigger_ecommod01_group_member_count
  AFTER INSERT OR DELETE ON mod_ecommod01_customer_group_members
  FOR EACH ROW EXECUTE FUNCTION mod_ecommod01_update_group_member_count();

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE mod_ecommod01_customers IS 'E-Commerce customer records with stats and marketing preferences';
COMMENT ON TABLE mod_ecommod01_customer_addresses IS 'Customer shipping and billing addresses';
COMMENT ON TABLE mod_ecommod01_customer_groups IS 'Customer segmentation groups with optional discounts';
COMMENT ON TABLE mod_ecommod01_customer_notes IS 'Internal notes about customers';
COMMENT ON TABLE mod_ecommod01_order_timeline IS 'Audit log of order events and status changes';
COMMENT ON TABLE mod_ecommod01_order_notes IS 'Internal and customer-visible order notes';
COMMENT ON TABLE mod_ecommod01_order_shipments IS 'Shipment tracking for orders';
COMMENT ON TABLE mod_ecommod01_order_refunds IS 'Refund requests and processing records';

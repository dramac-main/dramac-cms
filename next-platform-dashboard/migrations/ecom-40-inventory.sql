-- ============================================================================
-- PHASE-ECOM-40A: Inventory Management Database Schema
-- ============================================================================
-- Description: Creates tables for inventory tracking, movement history, 
-- stock alerts, and multi-location inventory support.
-- ============================================================================

-- ============================================================================
-- INVENTORY MOVEMENTS TABLE
-- ============================================================================
-- Tracks all stock changes with full audit trail

CREATE TABLE IF NOT EXISTS mod_ecommod01_inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE SET NULL,
  
  -- Movement details
  type TEXT NOT NULL CHECK (type IN (
    'adjustment',   -- Manual stock correction
    'sale',         -- Sold (decreases stock)
    'return',       -- Customer return (increases stock)
    'restock',      -- Inventory received
    'transfer',     -- Between locations
    'damage',       -- Damaged/unsellable
    'expired',      -- Expired products
    'reserved',     -- Reserved for order
    'unreserved'    -- Released reservation
  )),
  
  -- Stock values
  quantity INTEGER NOT NULL,           -- positive for in, negative for out
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  
  -- Context
  reason TEXT,                         -- User-provided explanation
  reference_type TEXT,                 -- 'order', 'manual', 'import', 'return'
  reference_id UUID,                   -- Link to order, etc.
  location_id UUID,                    -- For multi-location (future)
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT valid_stock_change CHECK (
    (previous_stock + quantity) = new_stock
  )
);

-- Indexes for inventory movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_site 
  ON mod_ecommod01_inventory_movements(site_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product 
  ON mod_ecommod01_inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant 
  ON mod_ecommod01_inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type 
  ON mod_ecommod01_inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created 
  ON mod_ecommod01_inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference 
  ON mod_ecommod01_inventory_movements(reference_type, reference_id);

-- ============================================================================
-- STOCK ALERTS TABLE
-- ============================================================================
-- Configurable alert thresholds per product or globally

CREATE TABLE IF NOT EXISTS mod_ecommod01_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Target (null product_id = global default for site)
  product_id UUID REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE CASCADE,
  
  -- Thresholds
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  critical_stock_threshold INTEGER NOT NULL DEFAULT 3,
  out_of_stock_threshold INTEGER NOT NULL DEFAULT 0,
  
  -- Reorder settings
  reorder_point INTEGER,               -- When to reorder
  reorder_quantity INTEGER,            -- How much to reorder
  
  -- Alert settings
  is_active BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_dashboard BOOLEAN DEFAULT true,
  notify_webhook BOOLEAN DEFAULT false,
  
  -- Status tracking
  current_alert_level TEXT CHECK (current_alert_level IN ('ok', 'low', 'critical', 'out')),
  last_alerted_at TIMESTAMPTZ,
  alert_dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one alert config per product/variant
  UNIQUE(site_id, product_id, variant_id)
);

-- Indexes for stock alerts
CREATE INDEX IF NOT EXISTS idx_stock_alerts_site 
  ON mod_ecommod01_stock_alerts(site_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product 
  ON mod_ecommod01_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_level 
  ON mod_ecommod01_stock_alerts(current_alert_level);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_active 
  ON mod_ecommod01_stock_alerts(is_active) WHERE is_active = true;

-- ============================================================================
-- INVENTORY LOCATIONS TABLE
-- ============================================================================
-- For future multi-location inventory support

CREATE TABLE IF NOT EXISTS mod_ecommod01_inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Location details
  name TEXT NOT NULL,
  code TEXT,                           -- Short code (e.g., 'WH1', 'STORE2')
  type TEXT DEFAULT 'warehouse' CHECK (type IN ('warehouse', 'store', 'fulfillment_center', 'dropship')),
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  fulfillment_priority INTEGER DEFAULT 0, -- Lower = higher priority
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, code)
);

-- Indexes for inventory locations
CREATE INDEX IF NOT EXISTS idx_inventory_locations_site 
  ON mod_ecommod01_inventory_locations(site_id);
CREATE INDEX IF NOT EXISTS idx_inventory_locations_default 
  ON mod_ecommod01_inventory_locations(site_id, is_default) WHERE is_default = true;

-- ============================================================================
-- LOCATION STOCK TABLE (for multi-location)
-- ============================================================================
-- Stock levels per location (future use)

CREATE TABLE IF NOT EXISTS mod_ecommod01_location_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES mod_ecommod01_inventory_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE CASCADE,
  
  -- Stock levels
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,  -- Reserved for orders
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  
  -- Location-specific settings
  bin_location TEXT,                   -- Shelf/bin identifier
  reorder_point INTEGER,               -- Location-specific reorder
  
  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_id, product_id, variant_id)
);

-- Indexes for location stock
CREATE INDEX IF NOT EXISTS idx_location_stock_site 
  ON mod_ecommod01_location_stock(site_id);
CREATE INDEX IF NOT EXISTS idx_location_stock_location 
  ON mod_ecommod01_location_stock(location_id);
CREATE INDEX IF NOT EXISTS idx_location_stock_product 
  ON mod_ecommod01_location_stock(product_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE mod_ecommod01_inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_ecommod01_location_stock ENABLE ROW LEVEL SECURITY;

-- Inventory movements policies
CREATE POLICY "Users can view inventory movements for their agency sites"
  ON mod_ecommod01_inventory_movements FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert inventory movements for their agency sites"
  ON mod_ecommod01_inventory_movements FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Stock alerts policies
CREATE POLICY "Users can manage stock alerts for their agency sites"
  ON mod_ecommod01_stock_alerts FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Inventory locations policies
CREATE POLICY "Users can manage inventory locations for their agency sites"
  ON mod_ecommod01_inventory_locations FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON s.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Location stock policies
CREATE POLICY "Users can manage location stock for their agency sites"
  ON mod_ecommod01_location_stock FOR ALL
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

-- Auto-update updated_at for stock_alerts
CREATE OR REPLACE FUNCTION update_stock_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stock_alerts_updated_at ON mod_ecommod01_stock_alerts;
CREATE TRIGGER trigger_stock_alerts_updated_at
  BEFORE UPDATE ON mod_ecommod01_stock_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_alerts_updated_at();

-- Auto-update updated_at for inventory_locations
DROP TRIGGER IF EXISTS trigger_inventory_locations_updated_at ON mod_ecommod01_inventory_locations;
CREATE TRIGGER trigger_inventory_locations_updated_at
  BEFORE UPDATE ON mod_ecommod01_inventory_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_alerts_updated_at();

-- Auto-update updated_at for location_stock
DROP TRIGGER IF EXISTS trigger_location_stock_updated_at ON mod_ecommod01_location_stock;
CREATE TRIGGER trigger_location_stock_updated_at
  BEFORE UPDATE ON mod_ecommod01_location_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_alerts_updated_at();

-- ============================================================================
-- FUNCTION: Record inventory movement and update stock
-- ============================================================================

CREATE OR REPLACE FUNCTION record_inventory_movement(
  p_site_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- Get current stock
  IF p_variant_id IS NOT NULL THEN
    SELECT quantity INTO v_current_stock
    FROM mod_ecommod01_product_variants
    WHERE id = p_variant_id;
  ELSE
    SELECT quantity INTO v_current_stock
    FROM mod_ecommod01_products
    WHERE id = p_product_id;
  END IF;
  
  -- Calculate new stock (ensure non-negative)
  v_new_stock := GREATEST(0, COALESCE(v_current_stock, 0) + p_quantity);
  
  -- Insert movement record
  INSERT INTO mod_ecommod01_inventory_movements (
    site_id, product_id, variant_id, type, quantity,
    previous_stock, new_stock, reason, reference_type,
    reference_id, created_by
  ) VALUES (
    p_site_id, p_product_id, p_variant_id, p_type, p_quantity,
    COALESCE(v_current_stock, 0), v_new_stock, p_reason, p_reference_type,
    p_reference_id, p_user_id
  ) RETURNING id INTO v_movement_id;
  
  -- Update product/variant stock
  IF p_variant_id IS NOT NULL THEN
    UPDATE mod_ecommod01_product_variants
    SET quantity = v_new_stock
    WHERE id = p_variant_id;
  ELSE
    UPDATE mod_ecommod01_products
    SET quantity = v_new_stock
    WHERE id = p_product_id;
  END IF;
  
  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADD inventory_settings column to settings table if not exists
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mod_ecommod01_settings' 
    AND column_name = 'inventory_settings'
  ) THEN
    ALTER TABLE mod_ecommod01_settings 
    ADD COLUMN inventory_settings JSONB DEFAULT '{}';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_inventory_movements IS 'Tracks all inventory changes with full audit trail';
COMMENT ON TABLE mod_ecommod01_stock_alerts IS 'Configurable low stock alert thresholds per product';
COMMENT ON TABLE mod_ecommod01_inventory_locations IS 'Physical locations for multi-location inventory';
COMMENT ON TABLE mod_ecommod01_location_stock IS 'Stock levels per location for multi-location support';
COMMENT ON FUNCTION record_inventory_movement IS 'Atomically records movement and updates stock';

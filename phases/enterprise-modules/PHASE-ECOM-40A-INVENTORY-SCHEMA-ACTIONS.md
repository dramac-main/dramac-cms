# PHASE-ECOM-40A: Inventory Management - Schema & Server Actions

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 5-6 hours
> **Prerequisites**: Waves 1-4 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the database schema and server actions for comprehensive inventory management including stock tracking, movement history, alerts configuration, and inventory locations. This phase establishes the data foundation for inventory tracking and alerting.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code
- [ ] Verify Waves 1-4 are complete
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Inventory Management Architecture (Phase 40A)
├── Database Schema
│   ├── mod_ecommod01_inventory_movements  → Stock movement history
│   ├── mod_ecommod01_stock_alerts         → Alert configuration
│   └── mod_ecommod01_inventory_locations  → Multi-location support (future)
│
├── Server Actions (inventory-actions.ts)
│   ├── Stock Management
│   │   ├── adjustStock()           → Single product adjustment
│   │   ├── bulkAdjustStock()       → Multiple adjustments
│   │   └── getStockHistory()       → Movement history
│   │
│   ├── Alert Management
│   │   ├── getStockAlerts()        → Products needing attention
│   │   ├── configureAlert()        → Per-product thresholds
│   │   ├── dismissAlert()          → Mark alert as handled
│   │   └── getAlertSettings()      → Global settings
│   │
│   └── Inventory Reports
│       ├── getInventoryReport()    → Full inventory status
│       ├── getStockValuation()     → Total inventory value
│       ├── getLowStockProducts()   → Below threshold
│       └── getOutOfStockProducts() → Zero stock
│
└── Types (inventory-types.ts)
    ├── InventoryMovement
    ├── StockAlert
    ├── InventoryLocation
    └── InventoryReport
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `migrations/ecom-40-inventory.sql` | Create | Database schema for inventory |
| `src/modules/ecommerce/types/inventory-types.ts` | Create | TypeScript type definitions |
| `src/modules/ecommerce/actions/inventory-actions.ts` | Create | Server actions for inventory |
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Export inventory types |

---

## 🗃️ Database Migration

**File**: `next-platform-dashboard/migrations/ecom-40-inventory.sql`
**Action**: Create

```sql
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

CREATE TRIGGER trigger_stock_alerts_updated_at
  BEFORE UPDATE ON mod_ecommod01_stock_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_alerts_updated_at();

-- Auto-update updated_at for inventory_locations
CREATE TRIGGER trigger_inventory_locations_updated_at
  BEFORE UPDATE ON mod_ecommod01_inventory_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_alerts_updated_at();

-- Auto-update updated_at for location_stock
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
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mod_ecommod01_inventory_movements IS 'Tracks all inventory changes with full audit trail';
COMMENT ON TABLE mod_ecommod01_stock_alerts IS 'Configurable low stock alert thresholds per product';
COMMENT ON TABLE mod_ecommod01_inventory_locations IS 'Physical locations for multi-location inventory';
COMMENT ON TABLE mod_ecommod01_location_stock IS 'Stock levels per location for multi-location support';
COMMENT ON FUNCTION record_inventory_movement IS 'Atomically records movement and updates stock';
```

---

## 📋 Implementation Tasks

### Task 40A.1: Create Inventory Types

**File**: `src/modules/ecommerce/types/inventory-types.ts`
**Action**: Create

```typescript
/**
 * Inventory Management Types
 * 
 * Phase ECOM-40A: Inventory Management - Schema & Server Actions
 * 
 * Type definitions for inventory tracking, movements, alerts, and locations.
 */

// ============================================================================
// MOVEMENT TYPES
// ============================================================================

export type InventoryMovementType = 
  | 'adjustment'   // Manual stock correction
  | 'sale'         // Sold (decreases stock)
  | 'return'       // Customer return (increases stock)
  | 'restock'      // Inventory received
  | 'transfer'     // Between locations
  | 'damage'       // Damaged/unsellable
  | 'expired'      // Expired products
  | 'reserved'     // Reserved for order
  | 'unreserved'   // Released reservation

export type StockAlertLevel = 'ok' | 'low' | 'critical' | 'out'

export type InventoryLocationType = 'warehouse' | 'store' | 'fulfillment_center' | 'dropship'

// ============================================================================
// INVENTORY MOVEMENT
// ============================================================================

export interface InventoryMovement {
  id: string
  site_id: string
  product_id: string
  variant_id: string | null
  
  type: InventoryMovementType
  quantity: number              // positive for in, negative for out
  previous_stock: number
  new_stock: number
  
  reason: string | null
  reference_type: string | null
  reference_id: string | null
  location_id: string | null
  
  created_by: string | null
  created_at: string
  
  // Relations (when joined)
  product?: {
    name: string
    sku: string | null
    images: string[]
  }
  variant?: {
    options: Record<string, string>
    sku: string | null
  }
  user?: {
    email: string
    full_name: string | null
  }
}

export interface InventoryMovementInput {
  site_id: string
  product_id: string
  variant_id?: string | null
  type: InventoryMovementType
  quantity: number
  reason?: string
  reference_type?: string
  reference_id?: string
  location_id?: string
}

export interface BulkAdjustmentItem {
  product_id: string
  variant_id?: string | null
  quantity: number
  reason?: string
}

// ============================================================================
// STOCK ALERTS
// ============================================================================

export interface StockAlert {
  id: string
  site_id: string
  product_id: string | null     // null = global default
  variant_id: string | null
  
  low_stock_threshold: number
  critical_stock_threshold: number
  out_of_stock_threshold: number
  
  reorder_point: number | null
  reorder_quantity: number | null
  
  is_active: boolean
  notify_email: boolean
  notify_dashboard: boolean
  notify_webhook: boolean
  
  current_alert_level: StockAlertLevel | null
  last_alerted_at: string | null
  alert_dismissed_at: string | null
  dismissed_by: string | null
  
  created_at: string
  updated_at: string
  
  // Relations (when joined)
  product?: {
    id: string
    name: string
    sku: string | null
    quantity: number
    images: string[]
  }
  variant?: {
    id: string
    options: Record<string, string>
    sku: string | null
    quantity: number
  }
}

export interface StockAlertInput {
  site_id: string
  product_id?: string | null
  variant_id?: string | null
  low_stock_threshold?: number
  critical_stock_threshold?: number
  out_of_stock_threshold?: number
  reorder_point?: number
  reorder_quantity?: number
  is_active?: boolean
  notify_email?: boolean
  notify_dashboard?: boolean
  notify_webhook?: boolean
}

export interface StockAlertUpdate {
  low_stock_threshold?: number
  critical_stock_threshold?: number
  out_of_stock_threshold?: number
  reorder_point?: number | null
  reorder_quantity?: number | null
  is_active?: boolean
  notify_email?: boolean
  notify_dashboard?: boolean
  notify_webhook?: boolean
}

export interface AlertedProduct {
  product_id: string
  variant_id: string | null
  product_name: string
  sku: string | null
  current_stock: number
  alert_level: StockAlertLevel
  threshold: number
  image_url: string | null
  last_movement_at: string | null
  days_until_stockout?: number
}

// ============================================================================
// INVENTORY LOCATIONS
// ============================================================================

export interface InventoryLocation {
  id: string
  site_id: string
  
  name: string
  code: string | null
  type: InventoryLocationType
  
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  
  is_default: boolean
  is_active: boolean
  fulfillment_priority: number
  
  created_at: string
  updated_at: string
}

export interface InventoryLocationInput {
  site_id: string
  name: string
  code?: string
  type?: InventoryLocationType
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  is_default?: boolean
  is_active?: boolean
  fulfillment_priority?: number
}

export interface LocationStock {
  id: string
  site_id: string
  location_id: string
  product_id: string
  variant_id: string | null
  
  quantity: number
  reserved_quantity: number
  available_quantity: number
  
  bin_location: string | null
  reorder_point: number | null
  
  updated_at: string
}

// ============================================================================
// INVENTORY REPORTS
// ============================================================================

export interface InventoryReportFilters {
  category_id?: string
  status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  search?: string
  sort_by?: 'name' | 'sku' | 'quantity' | 'value' | 'last_movement'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface InventoryReportItem {
  product_id: string
  variant_id: string | null
  name: string
  sku: string | null
  category_name: string | null
  
  quantity: number
  reserved_quantity: number
  available_quantity: number
  
  unit_cost: number | null
  total_value: number | null
  
  low_stock_threshold: number
  alert_level: StockAlertLevel
  
  last_movement_at: string | null
  last_movement_type: InventoryMovementType | null
  
  image_url: string | null
}

export interface InventoryReport {
  items: InventoryReportItem[]
  summary: {
    total_products: number
    total_variants: number
    total_quantity: number
    total_value: number
    in_stock_count: number
    low_stock_count: number
    critical_stock_count: number
    out_of_stock_count: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface StockValuation {
  total_value: number
  total_cost: number
  potential_profit: number
  total_units: number
  by_category: Array<{
    category_id: string
    category_name: string
    quantity: number
    value: number
  }>
}

export interface StockMovementReport {
  period: {
    start: string
    end: string
  }
  movements_by_type: Record<InventoryMovementType, {
    count: number
    total_quantity: number
  }>
  daily_movements: Array<{
    date: string
    in_quantity: number
    out_quantity: number
    net_change: number
  }>
  top_movers: Array<{
    product_id: string
    product_name: string
    total_out: number
    total_in: number
  }>
}

// ============================================================================
// GLOBAL ALERT SETTINGS
// ============================================================================

export interface GlobalAlertSettings {
  default_low_threshold: number
  default_critical_threshold: number
  email_recipients: string[]
  email_frequency: 'instant' | 'daily' | 'weekly'
  dashboard_enabled: boolean
  webhook_url: string | null
  webhook_enabled: boolean
}
```

---

### Task 40A.2: Create Inventory Server Actions

**File**: `src/modules/ecommerce/actions/inventory-actions.ts`
**Action**: Create

```typescript
/**
 * Inventory Management Server Actions
 * 
 * Phase ECOM-40A: Inventory Management - Schema & Server Actions
 * 
 * Server actions for stock management, alerts, and inventory reporting.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  InventoryMovement,
  InventoryMovementInput,
  InventoryMovementType,
  BulkAdjustmentItem,
  StockAlert,
  StockAlertInput,
  StockAlertUpdate,
  StockAlertLevel,
  AlertedProduct,
  InventoryLocation,
  InventoryLocationInput,
  InventoryReport,
  InventoryReportFilters,
  StockValuation,
  StockMovementReport,
  GlobalAlertSettings
} from '../types/inventory-types'

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// HELPERS
// ============================================================================

async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

/**
 * Determine alert level based on stock quantity and thresholds
 */
function calculateAlertLevel(
  quantity: number,
  lowThreshold: number,
  criticalThreshold: number,
  outThreshold: number = 0
): StockAlertLevel {
  if (quantity <= outThreshold) return 'out'
  if (quantity <= criticalThreshold) return 'critical'
  if (quantity <= lowThreshold) return 'low'
  return 'ok'
}

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

/**
 * Adjust stock for a single product/variant
 * Records the movement and updates the stock level
 */
export async function adjustStock(
  siteId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
  type: InventoryMovementType,
  reason?: string,
  referenceType?: string,
  referenceId?: string
): Promise<{ success: boolean; movement?: InventoryMovement; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get current stock level
    let currentStock = 0
    if (variantId) {
      const { data: variant } = await supabase
        .from(`${TABLE_PREFIX}_product_variants`)
        .select('quantity')
        .eq('id', variantId)
        .single()
      currentStock = variant?.quantity ?? 0
    } else {
      const { data: product } = await supabase
        .from(`${TABLE_PREFIX}_products`)
        .select('quantity')
        .eq('id', productId)
        .single()
      currentStock = product?.quantity ?? 0
    }
    
    // Calculate new stock (prevent negative)
    const newStock = Math.max(0, currentStock + quantity)
    
    // Insert movement record
    const { data: movement, error: movementError } = await supabase
      .from(`${TABLE_PREFIX}_inventory_movements`)
      .insert({
        site_id: siteId,
        product_id: productId,
        variant_id: variantId,
        type,
        quantity,
        previous_stock: currentStock,
        new_stock: newStock,
        reason,
        reference_type: referenceType,
        reference_id: referenceId,
        created_by: user?.id
      })
      .select()
      .single()
    
    if (movementError) throw movementError
    
    // Update stock level
    if (variantId) {
      const { error: updateError } = await supabase
        .from(`${TABLE_PREFIX}_product_variants`)
        .update({ quantity: newStock })
        .eq('id', variantId)
      if (updateError) throw updateError
    } else {
      const { error: updateError } = await supabase
        .from(`${TABLE_PREFIX}_products`)
        .update({ quantity: newStock })
        .eq('id', productId)
      if (updateError) throw updateError
    }
    
    // Update alert level if alert exists
    await updateAlertLevel(siteId, productId, variantId, newStock)
    
    return { success: true, movement }
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to adjust stock' 
    }
  }
}

/**
 * Bulk adjust stock for multiple products
 */
export async function bulkAdjustStock(
  siteId: string,
  adjustments: BulkAdjustmentItem[],
  type: InventoryMovementType,
  globalReason?: string
): Promise<{ 
  success: boolean
  results: Array<{ 
    product_id: string
    variant_id: string | null
    success: boolean
    error?: string 
  }>
  error?: string 
}> {
  const results: Array<{ 
    product_id: string
    variant_id: string | null
    success: boolean
    error?: string 
  }> = []
  
  for (const adjustment of adjustments) {
    const result = await adjustStock(
      siteId,
      adjustment.product_id,
      adjustment.variant_id ?? null,
      adjustment.quantity,
      type,
      adjustment.reason || globalReason
    )
    
    results.push({
      product_id: adjustment.product_id,
      variant_id: adjustment.variant_id ?? null,
      success: result.success,
      error: result.error
    })
  }
  
  const allSuccess = results.every(r => r.success)
  
  return {
    success: allSuccess,
    results,
    error: allSuccess ? undefined : 'Some adjustments failed'
  }
}

/**
 * Get stock movement history for a product
 */
export async function getStockHistory(
  siteId: string,
  productId?: string,
  options?: {
    variantId?: string
    type?: InventoryMovementType
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }
): Promise<{ movements: InventoryMovement[]; total: number }> {
  try {
    const supabase = await getModuleClient()
    
    let query = supabase
      .from(`${TABLE_PREFIX}_inventory_movements`)
      .select(`
        *,
        product:${TABLE_PREFIX}_products(name, sku, images),
        variant:${TABLE_PREFIX}_product_variants(options, sku)
      `, { count: 'exact' })
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    if (options?.variantId) {
      query = query.eq('variant_id', options.variantId)
    }
    
    if (options?.type) {
      query = query.eq('type', options.type)
    }
    
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate)
    }
    
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate)
    }
    
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    query = query.range(offset, offset + limit - 1)
    
    const { data, count, error } = await query
    
    if (error) throw error
    
    return {
      movements: data ?? [],
      total: count ?? 0
    }
  } catch (error) {
    console.error('Error getting stock history:', error)
    return { movements: [], total: 0 }
  }
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

/**
 * Update alert level for a product after stock change
 */
async function updateAlertLevel(
  siteId: string,
  productId: string,
  variantId: string | null,
  currentStock: number
): Promise<void> {
  try {
    const supabase = await getModuleClient()
    
    // Get alert config for this product
    const { data: alert } = await supabase
      .from(`${TABLE_PREFIX}_stock_alerts`)
      .select('*')
      .eq('site_id', siteId)
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .single()
    
    if (!alert) return
    
    const newLevel = calculateAlertLevel(
      currentStock,
      alert.low_stock_threshold,
      alert.critical_stock_threshold,
      alert.out_of_stock_threshold
    )
    
    // Update if level changed
    if (newLevel !== alert.current_alert_level) {
      await supabase
        .from(`${TABLE_PREFIX}_stock_alerts`)
        .update({
          current_alert_level: newLevel,
          last_alerted_at: newLevel !== 'ok' ? new Date().toISOString() : alert.last_alerted_at,
          alert_dismissed_at: null // Reset dismissal on new alert
        })
        .eq('id', alert.id)
    }
  } catch (error) {
    console.error('Error updating alert level:', error)
  }
}

/**
 * Get products with active stock alerts
 */
export async function getStockAlerts(
  siteId: string,
  status?: 'all' | 'low' | 'critical' | 'out'
): Promise<AlertedProduct[]> {
  try {
    const supabase = await getModuleClient()
    
    // Build query based on status
    let query = supabase
      .from(`${TABLE_PREFIX}_products`)
      .select(`
        id,
        name,
        sku,
        quantity,
        low_stock_threshold,
        images,
        track_inventory
      `)
      .eq('site_id', siteId)
      .eq('track_inventory', true)
    
    // Filter by stock level
    if (status === 'out') {
      query = query.eq('quantity', 0)
    } else if (status === 'critical') {
      query = query.gt('quantity', 0).lte('quantity', 3)
    } else if (status === 'low') {
      query = query.gt('quantity', 3).lte('quantity', 10)
    } else if (status !== 'all') {
      // Default: show all alerts (low, critical, out)
      query = query.lte('quantity', 10)
    }
    
    const { data: products, error } = await query.order('quantity', { ascending: true })
    
    if (error) throw error
    
    // Get last movement for each product
    const alertedProducts: AlertedProduct[] = await Promise.all(
      (products ?? []).map(async (product) => {
        const { data: lastMovement } = await supabase
          .from(`${TABLE_PREFIX}_inventory_movements`)
          .select('created_at')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        const alertLevel = calculateAlertLevel(
          product.quantity,
          product.low_stock_threshold ?? 10,
          3,
          0
        )
        
        return {
          product_id: product.id,
          variant_id: null,
          product_name: product.name,
          sku: product.sku,
          current_stock: product.quantity,
          alert_level: alertLevel,
          threshold: product.low_stock_threshold ?? 10,
          image_url: product.images?.[0] ?? null,
          last_movement_at: lastMovement?.created_at ?? null
        }
      })
    )
    
    return alertedProducts
  } catch (error) {
    console.error('Error getting stock alerts:', error)
    return []
  }
}

/**
 * Configure alert settings for a product
 */
export async function configureAlert(
  siteId: string,
  productId: string,
  config: StockAlertInput
): Promise<{ success: boolean; alert?: StockAlert; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Upsert alert config
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_stock_alerts`)
      .upsert({
        site_id: siteId,
        product_id: productId,
        variant_id: config.variant_id ?? null,
        low_stock_threshold: config.low_stock_threshold ?? 10,
        critical_stock_threshold: config.critical_stock_threshold ?? 3,
        out_of_stock_threshold: config.out_of_stock_threshold ?? 0,
        reorder_point: config.reorder_point,
        reorder_quantity: config.reorder_quantity,
        is_active: config.is_active ?? true,
        notify_email: config.notify_email ?? true,
        notify_dashboard: config.notify_dashboard ?? true,
        notify_webhook: config.notify_webhook ?? false
      }, {
        onConflict: 'site_id,product_id,variant_id'
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, alert: data }
  } catch (error) {
    console.error('Error configuring alert:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to configure alert' 
    }
  }
}

/**
 * Dismiss an alert (mark as handled)
 */
export async function dismissAlert(
  alertId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_stock_alerts`)
      .update({
        alert_dismissed_at: new Date().toISOString(),
        dismissed_by: user?.id
      })
      .eq('id', alertId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error dismissing alert:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to dismiss alert' 
    }
  }
}

/**
 * Get global alert settings for a site
 */
export async function getAlertSettings(
  siteId: string
): Promise<GlobalAlertSettings> {
  try {
    const supabase = await getModuleClient()
    
    // Get site-level alert defaults (stored in settings table)
    const { data } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select('inventory_settings')
      .eq('site_id', siteId)
      .single()
    
    const settings = data?.inventory_settings ?? {}
    
    return {
      default_low_threshold: settings.default_low_threshold ?? 10,
      default_critical_threshold: settings.default_critical_threshold ?? 3,
      email_recipients: settings.alert_email_recipients ?? [],
      email_frequency: settings.alert_email_frequency ?? 'daily',
      dashboard_enabled: settings.alert_dashboard_enabled ?? true,
      webhook_url: settings.alert_webhook_url ?? null,
      webhook_enabled: settings.alert_webhook_enabled ?? false
    }
  } catch (error) {
    console.error('Error getting alert settings:', error)
    return {
      default_low_threshold: 10,
      default_critical_threshold: 3,
      email_recipients: [],
      email_frequency: 'daily',
      dashboard_enabled: true,
      webhook_url: null,
      webhook_enabled: false
    }
  }
}

/**
 * Update global alert settings
 */
export async function updateAlertSettings(
  siteId: string,
  settings: Partial<GlobalAlertSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    // Get current settings
    const { data: currentData } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select('inventory_settings')
      .eq('site_id', siteId)
      .single()
    
    const currentSettings = currentData?.inventory_settings ?? {}
    
    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      default_low_threshold: settings.default_low_threshold ?? currentSettings.default_low_threshold,
      default_critical_threshold: settings.default_critical_threshold ?? currentSettings.default_critical_threshold,
      alert_email_recipients: settings.email_recipients ?? currentSettings.alert_email_recipients,
      alert_email_frequency: settings.email_frequency ?? currentSettings.alert_email_frequency,
      alert_dashboard_enabled: settings.dashboard_enabled ?? currentSettings.alert_dashboard_enabled,
      alert_webhook_url: settings.webhook_url ?? currentSettings.alert_webhook_url,
      alert_webhook_enabled: settings.webhook_enabled ?? currentSettings.alert_webhook_enabled
    }
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .upsert({
        site_id: siteId,
        inventory_settings: updatedSettings
      }, {
        onConflict: 'site_id'
      })
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error updating alert settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update settings' 
    }
  }
}

// ============================================================================
// INVENTORY REPORTS
// ============================================================================

/**
 * Get comprehensive inventory report
 */
export async function getInventoryReport(
  siteId: string,
  filters?: InventoryReportFilters
): Promise<InventoryReport> {
  try {
    const supabase = await getModuleClient()
    
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 50
    const offset = (page - 1) * limit
    
    // Base query
    let query = supabase
      .from(`${TABLE_PREFIX}_products`)
      .select(`
        id,
        name,
        sku,
        quantity,
        cost_price,
        base_price,
        low_stock_threshold,
        images,
        track_inventory,
        categories:${TABLE_PREFIX}_product_category_links(
          category:${TABLE_PREFIX}_categories(name)
        )
      `, { count: 'exact' })
      .eq('site_id', siteId)
      .eq('track_inventory', true)
    
    // Apply filters
    if (filters?.status === 'in_stock') {
      query = query.gt('quantity', 10)
    } else if (filters?.status === 'low_stock') {
      query = query.gt('quantity', 0).lte('quantity', 10)
    } else if (filters?.status === 'out_of_stock') {
      query = query.eq('quantity', 0)
    }
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }
    
    // Sorting
    const sortBy = filters?.sort_by ?? 'name'
    const sortOrder = filters?.sort_order === 'desc'
    
    if (sortBy === 'value') {
      // Sort by total value (quantity * cost)
      query = query.order('quantity', { ascending: !sortOrder })
    } else {
      query = query.order(sortBy, { ascending: !sortOrder })
    }
    
    // Pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data: products, count, error } = await query
    
    if (error) throw error
    
    // Calculate summary
    const { data: summaryData } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select('quantity, cost_price')
      .eq('site_id', siteId)
      .eq('track_inventory', true)
    
    const summary = (summaryData ?? []).reduce((acc, p) => {
      const quantity = p.quantity ?? 0
      const value = quantity * (p.cost_price ?? 0)
      
      acc.total_quantity += quantity
      acc.total_value += value
      
      if (quantity === 0) {
        acc.out_of_stock_count++
      } else if (quantity <= 3) {
        acc.critical_stock_count++
      } else if (quantity <= 10) {
        acc.low_stock_count++
      } else {
        acc.in_stock_count++
      }
      
      return acc
    }, {
      total_quantity: 0,
      total_value: 0,
      in_stock_count: 0,
      low_stock_count: 0,
      critical_stock_count: 0,
      out_of_stock_count: 0
    })
    
    // Transform products to report items
    const items = (products ?? []).map(product => {
      const alertLevel = calculateAlertLevel(
        product.quantity ?? 0,
        product.low_stock_threshold ?? 10,
        3,
        0
      )
      
      return {
        product_id: product.id,
        variant_id: null,
        name: product.name,
        sku: product.sku,
        category_name: product.categories?.[0]?.category?.name ?? null,
        quantity: product.quantity ?? 0,
        reserved_quantity: 0, // TODO: implement reservation tracking
        available_quantity: product.quantity ?? 0,
        unit_cost: product.cost_price,
        total_value: (product.quantity ?? 0) * (product.cost_price ?? 0),
        low_stock_threshold: product.low_stock_threshold ?? 10,
        alert_level: alertLevel,
        last_movement_at: null, // Would need join
        last_movement_type: null,
        image_url: product.images?.[0] ?? null
      }
    })
    
    return {
      items,
      summary: {
        total_products: count ?? 0,
        total_variants: 0, // TODO: count variants
        ...summary
      },
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / limit)
      }
    }
  } catch (error) {
    console.error('Error getting inventory report:', error)
    return {
      items: [],
      summary: {
        total_products: 0,
        total_variants: 0,
        total_quantity: 0,
        total_value: 0,
        in_stock_count: 0,
        low_stock_count: 0,
        critical_stock_count: 0,
        out_of_stock_count: 0
      },
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        total_pages: 0
      }
    }
  }
}

/**
 * Get total inventory valuation
 */
export async function getStockValuation(
  siteId: string
): Promise<StockValuation> {
  try {
    const supabase = await getModuleClient()
    
    // Get all products with inventory
    const { data: products } = await supabase
      .from(`${TABLE_PREFIX}_products`)
      .select(`
        id,
        quantity,
        cost_price,
        base_price,
        categories:${TABLE_PREFIX}_product_category_links(
          category_id,
          category:${TABLE_PREFIX}_categories(name)
        )
      `)
      .eq('site_id', siteId)
      .eq('track_inventory', true)
    
    // Calculate totals and by-category breakdown
    const categoryTotals = new Map<string, { name: string; quantity: number; value: number }>()
    
    let totalValue = 0
    let totalCost = 0
    let totalUnits = 0
    
    for (const product of products ?? []) {
      const quantity = product.quantity ?? 0
      const cost = product.cost_price ?? 0
      const price = product.base_price ?? 0
      
      totalUnits += quantity
      totalCost += quantity * cost
      totalValue += quantity * price
      
      // Group by category
      const categoryId = product.categories?.[0]?.category_id ?? 'uncategorized'
      const categoryName = product.categories?.[0]?.category?.name ?? 'Uncategorized'
      
      const existing = categoryTotals.get(categoryId) ?? { name: categoryName, quantity: 0, value: 0 }
      categoryTotals.set(categoryId, {
        name: categoryName,
        quantity: existing.quantity + quantity,
        value: existing.value + (quantity * cost)
      })
    }
    
    return {
      total_value: totalValue,
      total_cost: totalCost,
      potential_profit: totalValue - totalCost,
      total_units: totalUnits,
      by_category: Array.from(categoryTotals.entries()).map(([id, data]) => ({
        category_id: id,
        category_name: data.name,
        quantity: data.quantity,
        value: data.value
      }))
    }
  } catch (error) {
    console.error('Error getting stock valuation:', error)
    return {
      total_value: 0,
      total_cost: 0,
      potential_profit: 0,
      total_units: 0,
      by_category: []
    }
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(
  siteId: string,
  threshold?: number
): Promise<AlertedProduct[]> {
  return getStockAlerts(siteId, 'low')
}

/**
 * Get out of stock products
 */
export async function getOutOfStockProducts(
  siteId: string
): Promise<AlertedProduct[]> {
  return getStockAlerts(siteId, 'out')
}

/**
 * Get stock movement report
 */
export async function getStockMovementReport(
  siteId: string,
  startDate: string,
  endDate: string
): Promise<StockMovementReport> {
  try {
    const supabase = await getModuleClient()
    
    // Get all movements in date range
    const { data: movements } = await supabase
      .from(`${TABLE_PREFIX}_inventory_movements`)
      .select(`
        *,
        product:${TABLE_PREFIX}_products(name)
      `)
      .eq('site_id', siteId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })
    
    // Group by type
    const byType: Record<string, { count: number; total_quantity: number }> = {}
    
    // Group by day
    const byDay = new Map<string, { in_quantity: number; out_quantity: number }>()
    
    // Track top movers
    const productMovements = new Map<string, { name: string; in: number; out: number }>()
    
    for (const movement of movements ?? []) {
      // By type
      const typeKey = movement.type
      if (!byType[typeKey]) {
        byType[typeKey] = { count: 0, total_quantity: 0 }
      }
      byType[typeKey].count++
      byType[typeKey].total_quantity += Math.abs(movement.quantity)
      
      // By day
      const day = movement.created_at.split('T')[0]
      const dayData = byDay.get(day) ?? { in_quantity: 0, out_quantity: 0 }
      if (movement.quantity > 0) {
        dayData.in_quantity += movement.quantity
      } else {
        dayData.out_quantity += Math.abs(movement.quantity)
      }
      byDay.set(day, dayData)
      
      // By product
      const productData = productMovements.get(movement.product_id) ?? {
        name: movement.product?.name ?? 'Unknown',
        in: 0,
        out: 0
      }
      if (movement.quantity > 0) {
        productData.in += movement.quantity
      } else {
        productData.out += Math.abs(movement.quantity)
      }
      productMovements.set(movement.product_id, productData)
    }
    
    // Sort products by total movement
    const topMovers = Array.from(productMovements.entries())
      .map(([id, data]) => ({
        product_id: id,
        product_name: data.name,
        total_in: data.in,
        total_out: data.out
      }))
      .sort((a, b) => (b.total_in + b.total_out) - (a.total_in + a.total_out))
      .slice(0, 10)
    
    return {
      period: { start: startDate, end: endDate },
      movements_by_type: byType as Record<InventoryMovementType, { count: number; total_quantity: number }>,
      daily_movements: Array.from(byDay.entries()).map(([date, data]) => ({
        date,
        in_quantity: data.in_quantity,
        out_quantity: data.out_quantity,
        net_change: data.in_quantity - data.out_quantity
      })),
      top_movers: topMovers
    }
  } catch (error) {
    console.error('Error getting movement report:', error)
    return {
      period: { start: startDate, end: endDate },
      movements_by_type: {} as Record<InventoryMovementType, { count: number; total_quantity: number }>,
      daily_movements: [],
      top_movers: []
    }
  }
}

// ============================================================================
// INVENTORY LOCATIONS (Future Multi-Location Support)
// ============================================================================

/**
 * Get all inventory locations for a site
 */
export async function getInventoryLocations(
  siteId: string
): Promise<InventoryLocation[]> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_inventory_locations`)
      .select('*')
      .eq('site_id', siteId)
      .order('fulfillment_priority', { ascending: true })
    
    if (error) throw error
    
    return data ?? []
  } catch (error) {
    console.error('Error getting inventory locations:', error)
    return []
  }
}

/**
 * Create a new inventory location
 */
export async function createInventoryLocation(
  data: InventoryLocationInput
): Promise<{ success: boolean; location?: InventoryLocation; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { data: location, error } = await supabase
      .from(`${TABLE_PREFIX}_inventory_locations`)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, location }
  } catch (error) {
    console.error('Error creating inventory location:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create location' 
    }
  }
}

/**
 * Update an inventory location
 */
export async function updateInventoryLocation(
  locationId: string,
  updates: Partial<InventoryLocationInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_inventory_locations`)
      .update(updates)
      .eq('id', locationId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error updating inventory location:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update location' 
    }
  }
}

/**
 * Delete an inventory location
 */
export async function deleteInventoryLocation(
  locationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(`${TABLE_PREFIX}_inventory_locations`)
      .delete()
      .eq('id', locationId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting inventory location:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete location' 
    }
  }
}
```

---

### Task 40A.3: Update Type Exports

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (add at end of file)

```typescript
// ============================================================================
// INVENTORY TYPES EXPORT
// ============================================================================

export * from './inventory-types'
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Database migration runs without errors in Supabase SQL Editor
- [ ] Test `adjustStock()` - single product adjustment
- [ ] Test `bulkAdjustStock()` - multiple products
- [ ] Test `getStockHistory()` - movement history retrieval
- [ ] Test `getStockAlerts()` - alert retrieval by status
- [ ] Test `configureAlert()` - alert configuration
- [ ] Test `getInventoryReport()` - full inventory report
- [ ] Test `getStockValuation()` - inventory value calculation
- [ ] Verify RLS policies allow only authorized access

---

## 🔄 Rollback Plan

If issues occur:

1. **Database Rollback**:
```sql
DROP TABLE IF EXISTS mod_ecommod01_location_stock CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_inventory_locations CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_stock_alerts CASCADE;
DROP TABLE IF EXISTS mod_ecommod01_inventory_movements CASCADE;
DROP FUNCTION IF EXISTS record_inventory_movement CASCADE;
```

2. **Code Rollback**:
```bash
git checkout HEAD~1 -- src/modules/ecommerce/actions/inventory-actions.ts
git checkout HEAD~1 -- src/modules/ecommerce/types/inventory-types.ts
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-40A completion note
- `progress.md`: Update Wave 5 section with inventory schema complete

---

## ✨ Success Criteria

- [ ] All 4 inventory tables created with proper indexes
- [ ] RLS policies enforce agency/site isolation
- [ ] Stock adjustments create movement records
- [ ] Alert levels calculate correctly
- [ ] Inventory reports return accurate data
- [ ] Stock valuation calculates correctly
- [ ] TypeScript types fully defined
- [ ] Zero TypeScript errors

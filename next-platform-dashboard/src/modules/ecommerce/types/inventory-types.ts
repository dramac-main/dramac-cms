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

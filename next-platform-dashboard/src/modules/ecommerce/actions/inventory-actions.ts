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
  InventoryMovementType,
  BulkAdjustmentItem,
  StockAlert,
  StockAlertInput,
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
    let query = supabase
      .from(`${TABLE_PREFIX}_stock_alerts`)
      .select('*')
      .eq('site_id', siteId)
      .eq('product_id', productId)
    
    if (variantId) {
      query = query.eq('variant_id', variantId)
    } else {
      query = query.is('variant_id', null)
    }
    
    const { data: alert } = await query.single()
    
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

      // Send low stock notification when level transitions to low, critical, or out
      if (newLevel !== 'ok' && alert.current_alert_level === 'ok') {
        // Fetch product name for the notification
        const { data: product } = await supabase
          .from(`${TABLE_PREFIX}_products`)
          .select('name, sku')
          .eq('id', productId)
          .single()

        if (product) {
          const { notifyLowStock } = await import('@/lib/services/business-notifications')
          notifyLowStock(
            siteId,
            product.name,
            currentStock,
            alert.low_stock_threshold ?? 10,
            product.sku || undefined,
          ).catch(err => console.error('[Inventory] Low stock notification error:', err))
        }
      }
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
    interface ProductRow {
      id: string
      name: string
      sku: string | null
      quantity: number
      low_stock_threshold: number | null
      images: string[] | null
    }
    
    const alertedProducts: AlertedProduct[] = await Promise.all(
      (products ?? []).map(async (product: ProductRow) => {
        const { data: lastMovement } = await supabase
          .from(`${TABLE_PREFIX}_inventory_movements`)
          .select('created_at')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        
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
      .maybeSingle()
    
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
      .maybeSingle()
    
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
    
    interface SummaryRow {
      quantity: number | null
      cost_price: number | null
    }
    
    const summary = (summaryData ?? []).reduce((acc: {
      total_quantity: number
      total_value: number
      in_stock_count: number
      low_stock_count: number
      critical_stock_count: number
      out_of_stock_count: number
    }, p: SummaryRow) => {
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
    interface ProductReportRow {
      id: string
      name: string
      sku: string | null
      quantity: number | null
      cost_price: number | null
      low_stock_threshold: number | null
      images: string[] | null
      categories: Array<{ category: { name: string } | null }> | null
    }
    
    const items = (products ?? []).map((product: ProductReportRow) => {
      const alertLevel = calculateAlertLevel(
        product.quantity ?? 0,
        product.low_stock_threshold ?? 10,
        3,
        0
      )
      
      // Extract category name safely
      const categoryLink = product.categories?.[0]
      const categoryName = categoryLink?.category?.name ?? null
      
      return {
        product_id: product.id,
        variant_id: null,
        name: product.name,
        sku: product.sku,
        category_name: categoryName,
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
      const categoryLink = product.categories?.[0]
      const categoryId = categoryLink?.category_id ?? 'uncategorized'
      const categoryName = categoryLink?.category?.name ?? 'Uncategorized'
      
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
  siteId: string
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

'use server'

/**
 * Analytics Server Actions
 * 
 * Phase ECOM-41A: Analytics & Reports
 * 
 * Server actions for fetching analytics data from the database.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  DateRange,
  GroupByPeriod,
  SalesOverview,
  SalesByPeriod,
  SalesByChannel,
  RevenueBreakdown,
  ProductPerformance,
  CategoryPerformance,
  CustomerInsights,
  CustomerLifetimeValue,
  CustomerSegmentation,
  CustomerSegment,
  ConversionFunnel,
  FunnelStage,
  CartAbandonment,
  SavedReport,
  SavedReportInput
} from '../types/analytics-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_PREFIX = 'mod_ecommod01'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get supabase client with any type to allow dynamic table names
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getModuleClient(): Promise<any> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

function getOrdersTable() { return `${TABLE_PREFIX}_orders` }
function getOrderItemsTable() { return `${TABLE_PREFIX}_order_items` }
function getProductsTable() { return `${TABLE_PREFIX}_products` }
function getCategoriesTable() { return `${TABLE_PREFIX}_categories` }
function getCustomersTable() { return `${TABLE_PREFIX}_customers` }
function getCartsTable() { return `${TABLE_PREFIX}_carts` }
function getSavedReportsTable() { return `${TABLE_PREFIX}_saved_reports` }

// Order type for internal use
interface OrderRow {
  id: string
  total_cents: number
  subtotal_cents?: number
  tax_cents?: number
  shipping_cents?: number
  discount_cents?: number
  status: string
  created_at: string
  customer_id?: string
  metadata?: Record<string, unknown>
}

interface OrderItemRow {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price_cents: number
  total_cents: number
}

// ============================================================================
// SALES ANALYTICS
// ============================================================================

/**
 * Get sales overview with key metrics
 */
export async function getSalesOverview(
  siteId: string,
  dateRange: DateRange
): Promise<{ data: SalesOverview | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from(getOrdersTable())
      .select('id, total_cents, subtotal_cents, tax_cents, shipping_cents, discount_cents, status, created_at')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
    
    if (ordersError) throw ordersError
    
    const typedOrders = (orders || []) as OrderRow[]
    
    // Calculate metrics
    const completedOrders = typedOrders.filter((o: OrderRow) => 
      ['completed', 'shipped', 'delivered'].includes(o.status)
    )
    
    const totalRevenue = completedOrders.reduce((sum: number, o: OrderRow) => sum + (o.total_cents || 0), 0)
    const totalOrders = completedOrders.length
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
    
    // Get items sold
    const orderIds = completedOrders.map((o: OrderRow) => o.id)
    let itemsSold = 0
    
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from(getOrderItemsTable())
        .select('quantity')
        .in('order_id', orderIds)
      
      itemsSold = (items || []).reduce((sum: number, i: { quantity: number }) => sum + (i.quantity || 0), 0)
    }
    
    // Calculate totals
    const grossRevenue = completedOrders.reduce((sum: number, o: OrderRow) => sum + (o.subtotal_cents || o.total_cents || 0), 0)
    const refunds = 0 // Would need refund tracking
    
    const overview: SalesOverview = {
      revenue: totalRevenue,
      orders: totalOrders,
      average_order_value: averageOrderValue,
      products_sold: itemsSold,
      revenue_change: 0,
      orders_change: 0,
      aov_change: 0,
      gross_profit: grossRevenue,
      gross_margin: grossRevenue > 0 ? (totalRevenue / grossRevenue) * 100 : 0,
      refunds,
      refund_count: 0,
      net_revenue: totalRevenue - refunds
    }
    
    return { data: overview, error: null }
  } catch (error) {
    console.error('Error getting sales overview:', error)
    return { data: null, error: 'Failed to fetch sales overview' }
  }
}

/**
 * Get sales by time period for charts
 */
export async function getSalesByPeriod(
  siteId: string,
  dateRange: DateRange,
  groupBy: GroupByPeriod = 'day'
): Promise<{ data: SalesByPeriod[] | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get orders with timestamps
    const { data: orders, error } = await supabase
      .from(getOrdersTable())
      .select('id, total_cents, created_at, status')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .in('status', ['completed', 'shipped', 'delivered'])
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    const typedOrders = (orders || []) as OrderRow[]
    
    // Get order items for product counts
    const orderIds = typedOrders.map((o: OrderRow) => o.id)
    const orderItemsMap = new Map<string, number>()
    
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from(getOrderItemsTable())
        .select('order_id, quantity')
        .in('order_id', orderIds)
      
      for (const item of (items || []) as { order_id: string; quantity: number }[]) {
        orderItemsMap.set(
          item.order_id, 
          (orderItemsMap.get(item.order_id) || 0) + item.quantity
        )
      }
    }
    
    // Group by period
    const grouped = new Map<string, { revenue: number; orders: number; products: number }>()
    
    for (const order of typedOrders) {
      const date = new Date(order.created_at)
      let periodKey: string
      
      switch (groupBy) {
        case 'hour':
          periodKey = `${date.toISOString().slice(0, 13)}:00:00`
          break
        case 'day':
          periodKey = date.toISOString().slice(0, 10)
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          periodKey = weekStart.toISOString().slice(0, 10)
          break
        case 'month':
          periodKey = date.toISOString().slice(0, 7) + '-01'
          break
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3)
          periodKey = `${date.getFullYear()}-Q${quarter + 1}`
          break
        case 'year':
          periodKey = `${date.getFullYear()}-01-01`
          break
        default:
          periodKey = date.toISOString().slice(0, 10)
      }
      
      const existing = grouped.get(periodKey) || { revenue: 0, orders: 0, products: 0 }
      grouped.set(periodKey, {
        revenue: existing.revenue + (order.total_cents || 0),
        orders: existing.orders + 1,
        products: existing.products + (orderItemsMap.get(order.id) || 0)
      })
    }
    
    // Convert to array
    const salesByPeriod: SalesByPeriod[] = Array.from(grouped.entries()).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orders: data.orders,
      average_order_value: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
      products_sold: data.products
    }))
    
    return { data: salesByPeriod, error: null }
  } catch (error) {
    console.error('Error getting sales by period:', error)
    return { data: null, error: 'Failed to fetch sales by period' }
  }
}

/**
 * Get sales by channel
 */
export async function getSalesByChannel(
  siteId: string,
  dateRange: DateRange
): Promise<{ data: SalesByChannel[] | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get orders with channel info
    const { data: orders, error } = await supabase
      .from(getOrdersTable())
      .select('total_cents, metadata, status')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .in('status', ['completed', 'shipped', 'delivered'])
    
    if (error) throw error
    
    const typedOrders = (orders || []) as OrderRow[]
    
    // Group by channel
    const channelMap = new Map<string, { revenue: number; orders: number }>()
    
    for (const order of typedOrders) {
      const metadata = order.metadata as Record<string, string> | undefined
      const channel = metadata?.channel || 'direct'
      const existing = channelMap.get(channel) || { revenue: 0, orders: 0 }
      channelMap.set(channel, {
        revenue: existing.revenue + (order.total_cents || 0),
        orders: existing.orders + 1
      })
    }
    
    const totalRevenue = Array.from(channelMap.values()).reduce((sum, c) => sum + c.revenue, 0)
    
    const salesByChannel: SalesByChannel[] = Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      revenue: data.revenue,
      orders: data.orders,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))
    
    return { data: salesByChannel.sort((a, b) => b.revenue - a.revenue), error: null }
  } catch (error) {
    console.error('Error getting sales by channel:', error)
    return { data: null, error: 'Failed to fetch sales by channel' }
  }
}

/**
 * Get revenue breakdown
 */
export async function getRevenueBreakdown(
  siteId: string,
  dateRange: DateRange
): Promise<{ data: RevenueBreakdown | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    const { data: orders, error } = await supabase
      .from(getOrdersTable())
      .select('subtotal_cents, tax_cents, shipping_cents, discount_cents, total_cents, status')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .in('status', ['completed', 'shipped', 'delivered'])
    
    if (error) throw error
    
    const typedOrders = (orders || []) as OrderRow[]
    
    const breakdown: RevenueBreakdown = {
      gross_revenue: typedOrders.reduce((sum: number, o: OrderRow) => sum + (o.subtotal_cents || 0), 0),
      discounts: typedOrders.reduce((sum: number, o: OrderRow) => sum + (o.discount_cents || 0), 0),
      shipping_collected: typedOrders.reduce((sum: number, o: OrderRow) => sum + (o.shipping_cents || 0), 0),
      tax_collected: typedOrders.reduce((sum: number, o: OrderRow) => sum + (o.tax_cents || 0), 0),
      refunds: 0,
      net_revenue: typedOrders.reduce((sum: number, o: OrderRow) => sum + (o.total_cents || 0), 0)
    }
    
    return { data: breakdown, error: null }
  } catch (error) {
    console.error('Error getting revenue breakdown:', error)
    return { data: null, error: 'Failed to fetch revenue breakdown' }
  }
}

// ============================================================================
// PRODUCT ANALYTICS
// ============================================================================

/**
 * Get product performance data
 */
export async function getProductPerformance(
  siteId: string,
  dateRange: DateRange,
  limit: number = 10
): Promise<{ data: ProductPerformance[] | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get completed order IDs in date range
    const { data: completedOrders, error: ordersError } = await supabase
      .from(getOrdersTable())
      .select('id')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .in('status', ['completed', 'shipped', 'delivered'])
    
    if (ordersError) throw ordersError
    
    const orderIds = (completedOrders || []).map((o: { id: string }) => o.id)
    
    if (orderIds.length === 0) {
      return { data: [], error: null }
    }
    
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from(getOrderItemsTable())
      .select('product_id, product_name, quantity, total_cents')
      .in('order_id', orderIds)
    
    if (itemsError) throw itemsError
    
    const typedItems = (orderItems || []) as OrderItemRow[]
    
    // Aggregate by product
    const productMap = new Map<string, {
      productName: string
      unitsSold: number
      revenue: number
      orders: number
    }>()
    
    for (const item of typedItems) {
      const existing = productMap.get(item.product_id) || {
        productName: item.product_name || 'Unknown',
        unitsSold: 0,
        revenue: 0,
        orders: 0
      }
      
      existing.unitsSold += item.quantity || 0
      existing.revenue += item.total_cents || 0
      existing.orders += 1
      
      productMap.set(item.product_id, existing)
    }
    
    // Get product details
    const productIds = Array.from(productMap.keys())
    const { data: products } = await supabase
      .from(getProductsTable())
      .select('id, sku, category_id, image_url, stock_quantity')
      .in('id', productIds)
    
    const productDetails = new Map(
      (products || []).map((p: { id: string; sku?: string; category_id?: string; image_url?: string; stock_quantity?: number }) => [p.id, p])
    )
    
    // Build result
    const performance: ProductPerformance[] = Array.from(productMap.entries())
      .map(([productId, data], index) => {
        const details = productDetails.get(productId) as { sku?: string; image_url?: string; stock_quantity?: number } | undefined
        return {
          product_id: productId,
          product_name: data.productName,
          sku: details?.sku || null,
          category_name: null,
          image_url: details?.image_url || null,
          quantity_sold: data.unitsSold,
          revenue: data.revenue,
          orders: data.orders,
          average_price: data.unitsSold > 0 ? Math.round(data.revenue / data.unitsSold) : 0,
          views: 0,
          conversion_rate: 0,
          return_rate: 0,
          current_stock: details?.stock_quantity || 0,
          days_of_stock: 0,
          revenue_rank: index + 1,
          quantity_rank: 0
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
    
    // Update quantity rank
    const byQuantity = [...performance].sort((a, b) => b.quantity_sold - a.quantity_sold)
    byQuantity.forEach((p, i) => {
      const found = performance.find(x => x.product_id === p.product_id)
      if (found) found.quantity_rank = i + 1
    })
    
    return { data: performance, error: null }
  } catch (error) {
    console.error('Error getting product performance:', error)
    return { data: null, error: 'Failed to fetch product performance' }
  }
}

/**
 * Get top performing products
 */
export async function getTopProducts(
  siteId: string,
  dateRange: DateRange,
  sortBy: 'revenue' | 'units' | 'orders' = 'revenue',
  limit: number = 5
): Promise<{ data: ProductPerformance[] | null; error: string | null }> {
  const result = await getProductPerformance(siteId, dateRange, limit * 2)
  
  if (result.data && sortBy !== 'revenue') {
    result.data.sort((a, b) => {
      switch (sortBy) {
        case 'units':
          return b.quantity_sold - a.quantity_sold
        case 'orders':
          return b.orders - a.orders
        default:
          return b.revenue - a.revenue
      }
    })
    result.data = result.data.slice(0, limit)
  } else if (result.data) {
    result.data = result.data.slice(0, limit)
  }
  
  return result
}

/**
 * Get category performance
 */
export async function getCategoryPerformance(
  siteId: string,
  dateRange: DateRange
): Promise<{ data: CategoryPerformance[] | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get products with categories
    const { data: products, error: productsError } = await supabase
      .from(getProductsTable())
      .select('id, name, category_id')
      .eq('site_id', siteId)
    
    if (productsError) throw productsError
    
    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from(getCategoriesTable())
      .select('id, name')
      .eq('site_id', siteId)
    
    if (categoriesError) throw categoriesError
    
    type ProductRow = { id: string; name: string; category_id: string | null }
    type CategoryRow = { id: string; name: string }
    
    const typedCategories = (categories || []) as CategoryRow[]
    const typedProducts = (products || []) as ProductRow[]
    
    const categoryMap = new Map<string, string>(typedCategories.map((c) => [c.id, c.name]))
    const productCategoryMap = new Map<string, string | null>(typedProducts.map((p) => [p.id, p.category_id]))
    
    // Get completed orders
    const { data: completedOrders, error: ordersError } = await supabase
      .from(getOrdersTable())
      .select('id')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .in('status', ['completed', 'shipped', 'delivered'])
    
    if (ordersError) throw ordersError
    
    const orderIds = (completedOrders || []).map((o: { id: string }) => o.id)
    
    if (orderIds.length === 0) {
      return { data: [], error: null }
    }
    
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from(getOrderItemsTable())
      .select('product_id, quantity, total_cents, unit_price_cents')
      .in('order_id', orderIds)
    
    if (itemsError) throw itemsError
    
    type OrderItemSimple = { product_id: string; quantity: number; total_cents: number; unit_price_cents: number }
    const typedItems = (orderItems || []) as OrderItemSimple[]
    
    // Aggregate by category
    const categoryStats = new Map<string, { 
      revenue: number
      units: number
      orders: number
      products: Set<string>
      prices: number[]
    }>()
    
    for (const item of typedItems) {
      const categoryId = productCategoryMap.get(item.product_id) || 'uncategorized'
      const existing = categoryStats.get(categoryId) || { 
        revenue: 0, 
        units: 0, 
        orders: 0, 
        products: new Set<string>(),
        prices: []
      }
      
      existing.revenue += item.total_cents || 0
      existing.units += item.quantity || 0
      existing.orders += 1
      existing.products.add(item.product_id)
      if (item.unit_price_cents) existing.prices.push(item.unit_price_cents)
      
      categoryStats.set(categoryId, existing)
    }
    
    const totalRevenue = Array.from(categoryStats.values()).reduce((sum, s) => sum + s.revenue, 0)
    
    const performance: CategoryPerformance[] = Array.from(categoryStats.entries())
      .map(([categoryId, stats]) => ({
        category_id: categoryId,
        category_name: categoryMap.get(categoryId) || 'Uncategorized',
        products_count: stats.products.size,
        quantity_sold: stats.units,
        revenue: stats.revenue,
        orders: stats.orders,
        percentage_of_revenue: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
        average_product_price: stats.prices.length > 0 
          ? Math.round(stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length) 
          : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
    
    return { data: performance, error: null }
  } catch (error) {
    console.error('Error getting category performance:', error)
    return { data: null, error: 'Failed to fetch category performance' }
  }
}

// ============================================================================
// CUSTOMER ANALYTICS
// ============================================================================

/**
 * Get customer insights
 */
export async function getCustomerInsights(
  siteId: string,
  dateRange: DateRange
): Promise<{ data: CustomerInsights | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get orders in date range with customer info
    const { data: orders, error: ordersError } = await supabase
      .from(getOrdersTable())
      .select('id, customer_id, total_cents, created_at, status')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .in('status', ['completed', 'shipped', 'delivered'])
    
    if (ordersError) throw ordersError
    
    type OrderWithCustomer = { id: string; customer_id: string | null; total_cents: number; created_at: string; status: string }
    const typedOrders = (orders || []) as OrderWithCustomer[]
    
    // Count unique customers
    const customerIds = new Set(typedOrders.map((o: OrderWithCustomer) => o.customer_id).filter(Boolean))
    const totalCustomers = customerIds.size
    
    // Get all-time customer order counts
    const { data: allOrders } = await supabase
      .from(getOrdersTable())
      .select('customer_id')
      .eq('site_id', siteId)
      .in('status', ['completed', 'shipped', 'delivered'])
    
    type CustomerOrder = { customer_id: string | null }
    const customerOrderCounts = new Map<string, number>()
    for (const order of (allOrders || []) as CustomerOrder[]) {
      if (order.customer_id) {
        customerOrderCounts.set(
          order.customer_id, 
          (customerOrderCounts.get(order.customer_id) || 0) + 1
        )
      }
    }
    
    // Calculate new vs returning in this period
    let newCustomers = 0
    let returningCustomers = 0
    
    for (const customerId of customerIds) {
      if (customerId && customerOrderCounts.get(customerId) === 1) {
        newCustomers++
      } else if (customerId) {
        returningCustomers++
      }
    }
    
    // Calculate total revenue in period
    const totalRevenue = typedOrders.reduce((sum: number, o: OrderWithCustomer) => sum + (o.total_cents || 0), 0)
    
    const insights: CustomerInsights = {
      total_customers: totalCustomers,
      new_customers: newCustomers,
      returning_customers: returningCustomers,
      repeat_customer_rate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
      average_orders_per_customer: totalCustomers > 0 ? typedOrders.length / totalCustomers : 0,
      average_lifetime_value: totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0,
      customer_growth_rate: 0,
      new_customers_change: 0
    }
    
    return { data: insights, error: null }
  } catch (error) {
    console.error('Error getting customer insights:', error)
    return { data: null, error: 'Failed to fetch customer insights' }
  }
}

/**
 * Get customer lifetime value data
 */
export async function getCustomerLifetimeValue(
  siteId: string,
  limit: number = 10
): Promise<{ data: CustomerLifetimeValue[] | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get all completed orders grouped by customer
    const { data: orders, error } = await supabase
      .from(getOrdersTable())
      .select('customer_id, total_cents, created_at')
      .eq('site_id', siteId)
      .in('status', ['completed', 'shipped', 'delivered'])
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    type OrderSimple = { customer_id: string | null; total_cents: number; created_at: string }
    const typedOrders = (orders || []) as OrderSimple[]
    
    // Aggregate by customer
    const customerMap = new Map<string, {
      totalSpent: number
      orders: { date: string; amount: number }[]
    }>()
    
    for (const order of typedOrders) {
      if (!order.customer_id) continue
      
      const existing = customerMap.get(order.customer_id) || { totalSpent: 0, orders: [] }
      existing.totalSpent += order.total_cents || 0
      existing.orders.push({ date: order.created_at, amount: order.total_cents || 0 })
      customerMap.set(order.customer_id, existing)
    }
    
    // Get customer details
    const customerIds = Array.from(customerMap.keys())
    type CustomerDetail = { id: string; email: string; first_name?: string; last_name?: string; created_at: string }
    const { data: customers } = await supabase
      .from(getCustomersTable())
      .select('id, email, first_name, last_name, created_at')
      .in('id', customerIds.slice(0, 100))
    
    const customerDetails = new Map((customers || []).map((c: CustomerDetail) => [c.id, c]))
    
    // Calculate CLV metrics
    const now = new Date()
    const clvData: CustomerLifetimeValue[] = Array.from(customerMap.entries())
      .map(([customerId, data]) => {
        const customer = customerDetails.get(customerId) as CustomerDetail | undefined
        const sortedOrders = data.orders.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        
        const firstOrderDate = sortedOrders[0]?.date || ''
        const lastOrderDate = sortedOrders[sortedOrders.length - 1]?.date || ''
        const daysSinceLastOrder = lastOrderDate 
          ? Math.floor((now.getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0
        const daysSinceFirst = firstOrderDate
          ? Math.floor((now.getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0
        
        // Determine segment
        let segment = 'active'
        if (daysSinceLastOrder > 180) segment = 'churned'
        else if (daysSinceLastOrder > 90) segment = 'at_risk'
        else if (data.totalSpent > 50000 && data.orders.length >= 5) segment = 'high_value'
        
        return {
          customer_id: customerId,
          customer_email: customer?.email || 'Unknown',
          customer_name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || null : null,
          total_orders: data.orders.length,
          total_revenue: data.totalSpent,
          total_items_purchased: 0,
          average_order_value: Math.round(data.totalSpent / data.orders.length),
          first_order_date: firstOrderDate,
          last_order_date: lastOrderDate,
          days_since_last_order: daysSinceLastOrder,
          customer_since_days: daysSinceFirst,
          predicted_ltv: Math.round(data.totalSpent * 1.5),
          segment
        }
      })
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit)
    
    return { data: clvData, error: null }
  } catch (error) {
    console.error('Error getting customer lifetime value:', error)
    return { data: null, error: 'Failed to fetch customer lifetime value' }
  }
}

/**
 * Get customer segmentation
 */
export async function getCustomerSegmentation(
  siteId: string
): Promise<{ data: CustomerSegmentation | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get all customer orders
    const { data: orders, error } = await supabase
      .from(getOrdersTable())
      .select('customer_id, total_cents, created_at')
      .eq('site_id', siteId)
      .in('status', ['completed', 'shipped', 'delivered'])
    
    if (error) throw error
    
    type OrderSimple = { customer_id: string | null; total_cents: number; created_at: string }
    const typedOrders = (orders || []) as OrderSimple[]
    
    // Aggregate by customer
    const customerStats = new Map<string, { total: number; count: number; lastOrder: string }>()
    
    for (const order of typedOrders) {
      if (!order.customer_id) continue
      const existing = customerStats.get(order.customer_id) || { total: 0, count: 0, lastOrder: '' }
      existing.total += order.total_cents || 0
      existing.count += 1
      if (order.created_at > existing.lastOrder) {
        existing.lastOrder = order.created_at
      }
      customerStats.set(order.customer_id, existing)
    }
    
    // Define segments
    const segments: Record<string, { customers: number; revenue: number; orders: number }> = {
      'high_value': { customers: 0, revenue: 0, orders: 0 },
      'active': { customers: 0, revenue: 0, orders: 0 },
      'at_risk': { customers: 0, revenue: 0, orders: 0 },
      'churned': { customers: 0, revenue: 0, orders: 0 }
    }
    
    const now = new Date()
    
    for (const [, stats] of customerStats) {
      const lastOrderDate = new Date(stats.lastOrder)
      const daysSince = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let segment: string
      if (stats.total >= 50000 && stats.count >= 5) {
        segment = 'high_value'
      } else if (daysSince <= 90) {
        segment = 'active'
      } else if (daysSince <= 180) {
        segment = 'at_risk'
      } else {
        segment = 'churned'
      }
      
      segments[segment].customers += 1
      segments[segment].revenue += stats.total
      segments[segment].orders += stats.count
    }
    
    const totalCustomers = Array.from(customerStats.values()).length
    
    const segmentArray: CustomerSegment[] = Object.entries(segments)
      .filter(([, data]) => data.customers > 0)
      .map(([segment, data]) => ({
        segment,
        label: segment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: getSegmentDescription(segment),
        customer_count: data.customers,
        percentage: totalCustomers > 0 ? (data.customers / totalCustomers) * 100 : 0,
        total_revenue: data.revenue,
        average_ltv: data.customers > 0 ? Math.round(data.revenue / data.customers) : 0
      }))
    
    const segmentation: CustomerSegmentation = {
      segments: segmentArray,
      definitions: {
        high_value: { min_orders: 5, min_revenue: 50000 },
        active: { last_order_days: 90 },
        at_risk: { last_order_days: 180 },
        churned: { last_order_days: 180 }
      }
    }
    
    return { data: segmentation, error: null }
  } catch (error) {
    console.error('Error getting customer segmentation:', error)
    return { data: null, error: 'Failed to fetch customer segmentation' }
  }
}

function getSegmentDescription(segment: string): string {
  switch (segment) {
    case 'high_value': return 'Customers with 5+ orders and $500+ total spend'
    case 'active': return 'Customers who ordered in the last 90 days'
    case 'at_risk': return 'Customers who last ordered 90-180 days ago'
    case 'churned': return 'Customers who haven\'t ordered in 180+ days'
    default: return ''
  }
}

// ============================================================================
// CONVERSION ANALYTICS
// ============================================================================

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(
  siteId: string,
  dateRange: DateRange
): Promise<{ data: ConversionFunnel | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get cart data
    const { count: cartsCreated } = await supabase
      .from(getCartsTable())
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
    
    // Get orders
    const { data: orders, error } = await supabase
      .from(getOrdersTable())
      .select('id, status')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
    
    if (error) throw error
    
    type OrderStatus = { id: string; status: string }
    const typedOrders = (orders || []) as OrderStatus[]
    
    const totalOrders = typedOrders.length
    const completedOrders = typedOrders.filter((o: OrderStatus) => 
      ['completed', 'shipped', 'delivered'].includes(o.status)
    ).length
    
    const estimatedViews = (cartsCreated || 0) * 5
    
    // Build funnel stages
    const stages: FunnelStage[] = [
      {
        stage: 'view',
        label: 'Product Views',
        count: estimatedViews,
        conversion_rate: 100,
        drop_off_rate: 0
      },
      {
        stage: 'add_to_cart',
        label: 'Add to Cart',
        count: cartsCreated || 0,
        conversion_rate: estimatedViews > 0 ? ((cartsCreated || 0) / estimatedViews) * 100 : 0,
        drop_off_rate: estimatedViews > 0 ? 100 - ((cartsCreated || 0) / estimatedViews) * 100 : 0
      },
      {
        stage: 'checkout_started',
        label: 'Checkout Started',
        count: totalOrders,
        conversion_rate: (cartsCreated || 0) > 0 ? (totalOrders / (cartsCreated || 1)) * 100 : 0,
        drop_off_rate: (cartsCreated || 0) > 0 ? 100 - (totalOrders / (cartsCreated || 1)) * 100 : 0
      },
      {
        stage: 'checkout_completed',
        label: 'Purchase Complete',
        count: completedOrders,
        conversion_rate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        drop_off_rate: totalOrders > 0 ? 100 - (completedOrders / totalOrders) * 100 : 0
      }
    ]
    
    const funnel: ConversionFunnel = {
      stages,
      overall_conversion_rate: estimatedViews > 0 
        ? (completedOrders / estimatedViews) * 100 
        : 0,
      period: dateRange
    }
    
    return { data: funnel, error: null }
  } catch (error) {
    console.error('Error getting conversion funnel:', error)
    return { data: null, error: 'Failed to fetch conversion funnel' }
  }
}

/**
 * Get cart abandonment data
 */
export async function getCartAbandonmentRate(
  siteId: string,
  dateRange: DateRange
): Promise<{ data: CartAbandonment | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get carts in date range
    const { data: carts, error: cartsError } = await supabase
      .from(getCartsTable())
      .select('id, status, total_cents, created_at')
      .eq('site_id', siteId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
    
    if (cartsError) throw cartsError
    
    type CartRow = { id: string; status: string; total_cents: number; created_at: string }
    const typedCarts = (carts || []) as CartRow[]
    
    const totalCarts = typedCarts.length
    const abandonedCarts = typedCarts.filter((c: CartRow) => c.status === 'abandoned').length
    const recoveredCarts = typedCarts.filter((c: CartRow) => c.status === 'converted').length
    
    const abandonedValue = typedCarts
      .filter((c: CartRow) => c.status === 'abandoned')
      .reduce((sum: number, c: CartRow) => sum + (c.total_cents || 0), 0)
    
    const recoveredValue = typedCarts
      .filter((c: CartRow) => c.status === 'converted')
      .reduce((sum: number, c: CartRow) => sum + (c.total_cents || 0), 0)
    
    const abandonment: CartAbandonment = {
      total_carts: totalCarts,
      abandoned_carts: abandonedCarts,
      abandonment_rate: totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0,
      recovered_carts: recoveredCarts,
      recovery_rate: abandonedCarts > 0 ? (recoveredCarts / abandonedCarts) * 100 : 0,
      abandoned_value: abandonedValue,
      recovered_value: recoveredValue,
      abandonment_by_stage: []
    }
    
    return { data: abandonment, error: null }
  } catch (error) {
    console.error('Error getting cart abandonment:', error)
    return { data: null, error: 'Failed to fetch cart abandonment data' }
  }
}

// ============================================================================
// SAVED REPORTS
// ============================================================================

/**
 * Get saved reports for a site
 */
export async function getSavedReports(
  siteId: string
): Promise<{ data: SavedReport[] | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(getSavedReportsTable())
      .select('*')
      .eq('site_id', siteId)
      .order('updated_at', { ascending: false })
    
    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return { data: [], error: null }
      }
      throw error
    }
    
    return { data: data as SavedReport[], error: null }
  } catch (error) {
    console.error('Error getting saved reports:', error)
    return { data: null, error: 'Failed to fetch saved reports' }
  }
}

/**
 * Create a saved report
 */
export async function createSavedReport(
  siteId: string,
  input: SavedReportInput
): Promise<{ data: SavedReport | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    const { data, error } = await supabase
      .from(getSavedReportsTable())
      .insert({
        site_id: siteId,
        name: input.name,
        description: input.description,
        type: input.type,
        config: input.config,
        is_favorite: input.is_favorite || false,
        is_active: true,
        recipients: input.recipients || []
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/modules/ecommerce')
    return { data: data as SavedReport, error: null }
  } catch (error) {
    console.error('Error creating saved report:', error)
    return { data: null, error: 'Failed to create saved report' }
  }
}

/**
 * Update a saved report
 */
export async function updateSavedReport(
  reportId: string,
  input: Partial<SavedReportInput>
): Promise<{ data: SavedReport | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.config !== undefined) updateData.config = input.config
    if (input.is_favorite !== undefined) updateData.is_favorite = input.is_favorite
    
    const { data, error } = await supabase
      .from(getSavedReportsTable())
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/modules/ecommerce')
    return { data: data as SavedReport, error: null }
  } catch (error) {
    console.error('Error updating saved report:', error)
    return { data: null, error: 'Failed to update saved report' }
  }
}

/**
 * Delete a saved report
 */
export async function deleteSavedReport(
  reportId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    const { error } = await supabase
      .from(getSavedReportsTable())
      .delete()
      .eq('id', reportId)
    
    if (error) throw error
    
    revalidatePath('/modules/ecommerce')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting saved report:', error)
    return { success: false, error: 'Failed to delete saved report' }
  }
}

/**
 * Toggle report favorite status
 */
export async function toggleReportFavorite(
  reportId: string
): Promise<{ data: SavedReport | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    
    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from(getSavedReportsTable())
      .select('is_favorite')
      .eq('id', reportId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Toggle
    const { data, error } = await supabase
      .from(getSavedReportsTable())
      .update({ 
        is_favorite: !current.is_favorite,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/modules/ecommerce')
    return { data: data as SavedReport, error: null }
  } catch (error) {
    console.error('Error toggling report favorite:', error)
    return { data: null, error: 'Failed to toggle favorite status' }
  }
}

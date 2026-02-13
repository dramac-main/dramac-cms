/**
 * Dashboard Data Actions
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Server actions for fetching dashboard statistics and widget data
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { 
  DashboardStats, 
  RecentOrderSummary, 
  LowStockProduct,
  ActivityItem,
  StatsPeriod 
} from '../types/ecommerce-types'

// Module table prefix
const TABLE_PREFIX = 'mod_ecommod01'

// Helper to get untyped Supabase client for dynamic module tables
async function getModuleClient() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any
}

/**
 * Get date range based on period
 */
function getDateRange(period: StatsPeriod): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  const start = new Date(now)

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
  }

  return { start, end }
}

/**
 * Get previous period date range for comparison
 */
function getPreviousPeriodRange(period: StatsPeriod): { start: Date; end: Date } {
  const current = getDateRange(period)
  const duration = current.end.getTime() - current.start.getTime()
  
  return {
    start: new Date(current.start.getTime() - duration),
    end: new Date(current.start.getTime())
  }
}

/**
 * Fetch dashboard statistics
 */
export async function getDashboardStats(
  siteId: string, 
  period: StatsPeriod = 'month'
): Promise<DashboardStats> {
  const supabase = await getModuleClient()
  const { start, end } = getDateRange(period)
  const prevPeriod = getPreviousPeriodRange(period)

  // Fetch current period orders
  const { data: currentOrders, error: ordersError } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id, total, status, payment_status, created_at')
    .eq('site_id', siteId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
  }

  // Fetch previous period orders for comparison
  const { data: prevOrders } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id, total')
    .eq('site_id', siteId)
    .gte('created_at', prevPeriod.start.toISOString())
    .lte('created_at', prevPeriod.end.toISOString())

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('id, status, quantity, low_stock_threshold, track_inventory')
    .eq('site_id', siteId)

  if (productsError) {
    console.error('Error fetching products:', productsError)
  }

  // Fetch customers (unique emails from orders)
  const { data: customers } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('customer_email, created_at')
    .eq('site_id', siteId)

  // Calculate stats
  const orders = currentOrders || []
  const prev = prevOrders || []
  const prods = products || []
  const custs = customers || []

  // Revenue
  const totalRevenue = orders
    .filter((o: { payment_status: string }) => o.payment_status === 'paid')
    .reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0)
  
  const prevRevenue = prev.reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0)
  const revenueChange = prevRevenue > 0 
    ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
    : 0

  // Orders
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o: { status: string }) => o.status === 'pending').length

  // Products
  const totalProducts = prods.length
  const activeProducts = prods.filter((p: { status: string }) => p.status === 'active').length
  const draftProducts = prods.filter((p: { status: string }) => p.status === 'draft').length
  const lowStockProducts = prods.filter((p: { track_inventory: boolean; quantity: number; low_stock_threshold: number }) => 
    p.track_inventory && p.quantity <= p.low_stock_threshold
  ).length

  // Customers - unique emails
  const uniqueEmails = new Set(custs.map((c: { customer_email: string }) => c.customer_email))
  const totalCustomers = uniqueEmails.size

  // New customers this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentCustomers = custs.filter((c: { created_at: string }) => new Date(c.created_at) >= weekAgo)
  const recentUniqueEmails = new Set(recentCustomers.map((c: { customer_email: string }) => c.customer_email))
  const newCustomersThisWeek = recentUniqueEmails.size

  return {
    totalRevenue,
    revenueChange: Math.round(revenueChange * 10) / 10,
    totalOrders,
    pendingOrders,
    totalProducts,
    activeProducts,
    draftProducts,
    lowStockProducts,
    totalCustomers,
    newCustomersThisWeek
  }
}

/**
 * Fetch recent orders for widget
 */
export async function getRecentOrders(
  siteId: string, 
  limit: number = 5
): Promise<RecentOrderSummary[]> {
  const supabase = await getModuleClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id, order_number, customer_email, total, currency, status, payment_status, created_at, shipping_address')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }

  return (data || []).map((order: {
    id: string
    order_number: string
    customer_email: string
    total: number
    currency: string
    status: string
    payment_status: string
    created_at: string
    shipping_address?: { first_name?: string; last_name?: string }
  }) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.shipping_address?.first_name 
      ? `${order.shipping_address.first_name} ${order.shipping_address.last_name || ''}`
      : 'Guest',
    customerEmail: order.customer_email,
    total: order.total,
    currency: order.currency || 'USD',  // US DOLLAR DEFAULT
    status: order.status as RecentOrderSummary['status'],
    paymentStatus: order.payment_status as RecentOrderSummary['paymentStatus'],
    createdAt: order.created_at
  }))
}

/**
 * Fetch low stock products for alerts widget
 */
export async function getLowStockProducts(
  siteId: string, 
  limit: number = 10
): Promise<LowStockProduct[]> {
  const supabase = await getModuleClient()

  const { data, error } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('id, name, sku, quantity, low_stock_threshold, images')
    .eq('site_id', siteId)
    .eq('track_inventory', true)
    .eq('status', 'active')
    .order('quantity', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching low stock products:', error)
    return []
  }

  // Filter to only low stock products
  const lowStock = (data || []).filter((p: { quantity: number; low_stock_threshold: number }) => 
    p.quantity <= p.low_stock_threshold
  )

  return lowStock.map((product: {
    id: string
    name: string
    sku: string | null
    quantity: number
    low_stock_threshold: number
    images?: string[]
  }) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    quantity: product.quantity,
    lowStockThreshold: product.low_stock_threshold,
    imageUrl: product.images?.[0] || null
  }))
}

/**
 * Fetch activity feed
 */
export async function getActivityFeed(
  siteId: string,
  limit: number = 20
): Promise<ActivityItem[]> {
  const supabase = await getModuleClient()
  const activities: ActivityItem[] = []

  // Fetch recent orders (created)
  const { data: recentOrders } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id, order_number, total, currency, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(5)

  for (const order of recentOrders || []) {
    activities.push({
      id: `order-${order.id}`,
      type: 'order',
      action: 'created',
      title: `New order ${order.order_number}`,
      description: `Order placed for ${order.currency} ${(order.total / 100).toFixed(2)}`,
      timestamp: order.created_at,
      metadata: { orderId: order.id }
    })
  }

  // Fetch recent products (created)
  const { data: recentProducts } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('id, name, status, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(5)

  for (const product of recentProducts || []) {
    activities.push({
      id: `product-${product.id}`,
      type: 'product',
      action: 'created',
      title: `Product added: ${product.name}`,
      description: `Status: ${product.status}`,
      timestamp: product.created_at,
      metadata: { productId: product.id }
    })
  }

  // Sort by timestamp and limit
  activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return activities.slice(0, limit)
}

/**
 * Get quick search results for command palette
 */
export async function quickSearch(
  siteId: string,
  query: string,
  limit: number = 10
): Promise<{
  products: Array<{ id: string; name: string; sku: string | null }>
  orders: Array<{ id: string; orderNumber: string; customerEmail: string }>
  categories: Array<{ id: string; name: string }>
}> {
  if (!query || query.length < 2) {
    return { products: [], orders: [], categories: [] }
  }

  const supabase = await getModuleClient()
  const searchTerm = `%${query}%`

  // Search products
  const { data: products } = await supabase
    .from(`${TABLE_PREFIX}_products`)
    .select('id, name, sku')
    .eq('site_id', siteId)
    .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
    .limit(limit)

  // Search orders
  const { data: orders } = await supabase
    .from(`${TABLE_PREFIX}_orders`)
    .select('id, order_number, customer_email')
    .eq('site_id', siteId)
    .or(`order_number.ilike.${searchTerm},customer_email.ilike.${searchTerm}`)
    .limit(limit)

  // Search categories
  const { data: categories } = await supabase
    .from(`${TABLE_PREFIX}_categories`)
    .select('id, name')
    .eq('site_id', siteId)
    .ilike('name', searchTerm)
    .limit(limit)

  return {
    products: products || [],
    orders: orders?.map((o: { id: string; order_number: string; customer_email: string }) => ({ 
      id: o.id, 
      orderNumber: o.order_number, 
      customerEmail: o.customer_email 
    })) || [],
    categories: categories || []
  }
}

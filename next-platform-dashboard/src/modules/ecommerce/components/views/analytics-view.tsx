/**
 * Analytics View Component
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * Displays sales analytics and reports
 */
'use client'

import { useMemo } from 'react'
import { useEcommerce, useCurrency } from '../../context/ecommerce-context'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Coins,
  ShoppingCart,
  Package,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

export function AnalyticsView() {
  const { orders, products, isLoading } = useEcommerce()
  const { formatPrice, formatAmount } = useCurrency()

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - today.getDay())
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Today's orders
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today)
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)

    // This week's orders
    const weekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart)
    const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total, 0)

    // This month's orders
    const monthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart)
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0)

    // Last month's orders (for comparison)
    const lastMonthOrders = orders.filter(o => {
      const date = new Date(o.created_at)
      return date >= lastMonthStart && date <= lastMonthEnd
    })
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0)

    // Growth calculation
    const monthGrowth = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0

    // Product stats
    const activeProducts = products.filter(p => p.status === 'active').length
    const lowStockProducts = products.filter(p => p.track_inventory && p.quantity <= p.low_stock_threshold).length

    // Average order value
    const avgOrderValue = monthOrders.length > 0 
      ? monthRevenue / monthOrders.length 
      : 0

    // Top selling products (simplified)
    const productSales = new Map<string, { name: string; count: number; revenue: number }>()
    orders.forEach(order => {
      order.items?.forEach(item => {
        const current = productSales.get(item.product_id || 'unknown') || { name: item.product_name, count: 0, revenue: 0 }
        productSales.set(item.product_id || 'unknown', {
          name: item.product_name,
          count: current.count + item.quantity,
          revenue: current.revenue + item.total_price
        })
      })
    })
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({ ...p, revenue: p.revenue / 100 })) // convert cents to display units

    // Daily revenue for last 30 days (for charts)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 29)

    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      dailyMap.set(key, { revenue: 0, orders: 0 })
    }

    orders.forEach(order => {
      const date = new Date(order.created_at)
      if (date >= thirtyDaysAgo) {
        const key = `${date.getMonth() + 1}/${date.getDate()}`
        const current = dailyMap.get(key)
        if (current) {
          current.revenue += order.total / 100 // cents → display
          current.orders += 1
        }
      }
    })

    const dailyRevenue = Array.from(dailyMap.entries()).map(([label, data]) => ({
      label,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }))

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      weekRevenue,
      weekOrders: weekOrders.length,
      monthRevenue,
      monthOrders: monthOrders.length,
      monthGrowth,
      avgOrderValue,
      activeProducts,
      lowStockProducts,
      totalOrders: orders.length,
      topProducts,
      dailyRevenue,
    }
  }, [orders, products])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today's Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(analytics.todayRevenue)}</p>
                <p className="text-sm text-muted-foreground">{analytics.todayOrders} orders</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Coins className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(analytics.weekRevenue)}</p>
                <p className="text-sm text-muted-foreground">{analytics.weekOrders} orders</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(analytics.monthRevenue)}</p>
                <div className="flex items-center gap-1">
                  {analytics.monthGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    analytics.monthGrowth >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {analytics.monthGrowth >= 0 ? '+' : ''}{analytics.monthGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Order Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(analytics.avgOrderValue)}</p>
                <p className="text-sm text-muted-foreground">{analytics.monthOrders} orders this month</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Products</span>
                <Badge variant="secondary">{analytics.activeProducts}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Low Stock Items</span>
                <Badge variant={analytics.lowStockProducts > 0 ? "destructive" : "secondary"}>
                  {analytics.lowStockProducts}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Orders</span>
                <Badge variant="secondary">{analytics.totalOrders}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">This Month</span>
                <Badge variant="secondary">{analytics.monthOrders}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales data yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.topProducts.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="truncate flex-1 mr-2">{product.name}</span>
                    <Badge variant="outline">{formatAmount(product.revenue)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Orders Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 30 Days)</CardTitle>
            <CardDescription>Daily revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No analytics data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics.dailyRevenue}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} tickFormatter={(v: number) => formatAmount(v)} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as { label: string; revenue: number; orders: number }
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{d.label}</p>
                          <p className="text-sm text-muted-foreground">Revenue: {formatAmount(d.revenue)}</p>
                          <p className="text-sm text-muted-foreground">Orders: {d.orders}</p>
                        </div>
                      )
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders (Last 30 Days)</CardTitle>
            <CardDescription>Daily order volume</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.dailyRevenue.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No analytics data available yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as { label: string; orders: number }
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{d.label}</p>
                          <p className="text-sm text-muted-foreground">Orders: {d.orders}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Bar Chart */}
      {analytics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
            <CardDescription>Best performing products</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, analytics.topProducts.length * 50)}>
              <BarChart data={analytics.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} tickFormatter={(v: number) => formatAmount(v)} />
                <YAxis type="category" dataKey="name" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} width={120} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as { name: string; revenue: number; count: number }
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-muted-foreground">Revenue: {formatAmount(d.revenue)}</p>
                        <p className="text-sm text-muted-foreground">Units: {d.count}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="revenue" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

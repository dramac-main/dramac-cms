"use client"

/**
 * E-Commerce Dashboard Enhanced
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * Enhanced dashboard integrating all new UI components
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Plus,
  FolderTree,
  Percent,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import new UI components
import {
  EcommerceMetricCard,
  RevenueMetricCard,
  OrdersMetricCard,
  InventoryMetricCard,
  ConversionMetricCard,
  LowStockMetricCard,
} from './ui/ecommerce-metric-card'
import { ProductCard, ProductCardSkeleton } from './ui/product-card'
import { OrderCard, OrderCardSkeleton } from './ui/order-card'
import { ProductFilterBar, OrderFilterBar } from './ui/ecommerce-filter-bar'
import { RevenueChart, type RevenueDataPoint } from './ui/revenue-chart'
import { EcommerceQuickActions, getDefaultEcommerceActions } from './ui/ecommerce-quick-actions'
import { InventoryAlert, InventoryAlertBanner } from './ui/inventory-alert'

// Import types
import type { Product, Order, Category, ProductStatus, OrderStatus } from '../types/ecommerce-types'

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export type EcommerceView = 'overview' | 'products' | 'orders' | 'analytics'

export interface EcommerceDashboardEnhancedProps {
  /** Site ID */
  siteId: string
  /** Agency ID */
  agencyId: string
  /** Initial active view */
  initialView?: EcommerceView
  /** Products data */
  products?: Product[]
  /** Orders data */
  orders?: Order[]
  /** Categories data */
  categories?: Category[]
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string | null
  /** Currency */
  currency?: string
  /** Handlers */
  onCreateProduct?: () => void
  onCreateCategory?: () => void
  onCreateDiscount?: () => void
  onOpenSettings?: () => void
  onEditProduct?: (product: Product) => void
  onViewProduct?: (product: Product) => void
  onDeleteProduct?: (productId: string) => void
  onViewOrder?: (order: Order) => void
  onFulfillOrder?: (orderId: string) => void
  onRefresh?: () => void
  /** Additional class names */
  className?: string
}

// =============================================================================
// MOCK DATA (for demonstration)
// =============================================================================

function generateMockRevenueData(): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = []
  const now = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 30) + 5,
      label: date.toLocaleDateString(DEFAULT_LOCALE, { month: 'short', day: 'numeric' }),
    })
  }
  
  return data
}

function generateMockSparkline(): number[] {
  return Array.from({ length: 14 }, () => Math.floor(Math.random() * 100) + 20)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EcommerceDashboardEnhanced({
  siteId,
  agencyId,
  initialView = 'overview',
  products = [],
  orders = [],
  categories = [],
  isLoading = false,
  error,
  currency = DEFAULT_CURRENCY,
  onCreateProduct,
  onCreateCategory,
  onCreateDiscount,
  onOpenSettings,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onViewOrder,
  onFulfillOrder,
  onRefresh,
  className,
}: EcommerceDashboardEnhancedProps) {
  const [activeView, setActiveView] = React.useState<EcommerceView>(initialView)
  const [productSearch, setProductSearch] = React.useState('')
  const [productStatus, setProductStatus] = React.useState<ProductStatus | 'all'>('all')
  const [productCategory, setProductCategory] = React.useState<string>('all')
  const [productSort, setProductSort] = React.useState('created_desc')
  const [productViewMode, setProductViewMode] = React.useState<'grid' | 'list'>('grid')
  
  const [orderSearch, setOrderSearch] = React.useState('')
  const [orderStatus, setOrderStatus] = React.useState<OrderStatus | 'all'>('all')
  const [orderSort, setOrderSort] = React.useState('created_desc')
  
  const [revenueTimeRange, setRevenueTimeRange] = React.useState<'7d' | '30d' | '90d' | 'all'>('30d')

  // Calculate stats
  const activeProducts = products.filter(p => p.status === 'active')
  const lowStockProducts = products.filter(p => 
    p.track_inventory && p.quantity > 0 && p.quantity <= p.low_stock_threshold
  )
  const outOfStockProducts = products.filter(p => 
    p.track_inventory && p.quantity <= 0
  )
  
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at)
    const today = new Date()
    return orderDate.toDateString() === today.toDateString()
  })
  
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0)
  
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      if (productStatus !== 'all' && product.status !== productStatus) return false
      if (productSearch) {
        const query = productSearch.toLowerCase()
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.sku?.toLowerCase().includes(query)
        ) return false
      }
      return true
    }).sort((a, b) => {
      switch (productSort) {
        case 'name_asc': return a.name.localeCompare(b.name)
        case 'name_desc': return b.name.localeCompare(a.name)
        case 'price_asc': return a.base_price - b.base_price
        case 'price_desc': return b.base_price - a.base_price
        case 'created_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [products, productStatus, productSearch, productSort])

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      if (orderStatus !== 'all' && order.status !== orderStatus) return false
      if (orderSearch) {
        const query = orderSearch.toLowerCase()
        if (
          !order.order_number.toLowerCase().includes(query) &&
          !order.customer_email.toLowerCase().includes(query)
        ) return false
      }
      return true
    }).sort((a, b) => {
      if (orderSort === 'created_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [orders, orderStatus, orderSearch, orderSort])

  // Mock data for charts (in real app, fetch from API)
  const revenueData = React.useMemo(() => generateMockRevenueData(), [])

  // Quick actions
  const quickActions = getDefaultEcommerceActions({
    onAddProduct: onCreateProduct,
    onViewOrders: () => setActiveView('orders'),
    onCreateDiscount,
    onViewAnalytics: () => setActiveView('analytics'),
    onManageCategories: onCreateCategory,
    onSettings: onOpenSettings,
  })

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={onRefresh}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Commerce</h1>
          <p className="text-muted-foreground">
            Manage products, orders, and your online store
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateProduct}>
                <Package className="h-4 w-4 mr-2" />
                New Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateCategory}>
                <FolderTree className="h-4 w-4 mr-2" />
                New Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateDiscount}>
                <Percent className="h-4 w-4 mr-2" />
                New Discount
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Store Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inventory Alert Banner */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <InventoryAlertBanner
          count={lowStockProducts.length + outOfStockProducts.length}
          onViewAll={() => setActiveView('products')}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as EcommerceView)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">
            Products
            {activeProducts.length > 0 && (
              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                {activeProducts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders
            {pendingOrders.length > 0 && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                {pendingOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <RevenueMetricCard
              title="Total Revenue"
              value={totalRevenue}
              currency={currency}
              change={{ value: 12.5, trend: 'up', period: 'vs last month' }}
              sparklineData={generateMockSparkline()}
              animationDelay={0}
            />
            <OrdersMetricCard
              title="Orders"
              value={orders.length}
              change={{ value: 8.2, trend: 'up', period: 'vs last month' }}
              sparklineData={generateMockSparkline()}
              animationDelay={0.05}
            />
            <EcommerceMetricCard
              title="Avg. Order Value"
              value={avgOrderValue}
              variant="conversion"
              isCurrency
              currency={currency}
              change={{ value: 3.1, trend: 'up' }}
              animationDelay={0.1}
            />
            <InventoryMetricCard
              title="Products"
              value={activeProducts.length}
              change={{ value: 5, trend: 'up' }}
              animationDelay={0.15}
            />
            <EcommerceMetricCard
              title="Customers"
              value={new Set(orders.map(o => o.customer_email)).size}
              icon={Users}
              variant="customers"
              change={{ value: 15, trend: 'up' }}
              animationDelay={0.2}
            />
            {lowStockProducts.length > 0 && (
              <LowStockMetricCard
                title="Low Stock"
                value={lowStockProducts.length}
                change={{ value: lowStockProducts.length, trend: 'down' }}
                animationDelay={0.25}
              />
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2">
              <RevenueChart
                data={revenueData}
                currency={currency}
                timeRange={revenueTimeRange}
                onTimeRangeChange={setRevenueTimeRange}
              />
            </div>

            {/* Quick Actions + Alerts */}
            <div className="space-y-6">
              <EcommerceQuickActions
                actions={quickActions.slice(0, 4)}
                columns={2}
              />
              
              {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <InventoryAlert
                  lowStockProducts={lowStockProducts}
                  outOfStockProducts={outOfStockProducts}
                  maxItems={3}
                  onProductClick={onViewProduct}
                  onViewAll={() => setActiveView('products')}
                  compact
                />
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('orders')}>
                View All
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <OrderCardSkeleton key={i} variant="compact" />
                ))
              ) : (
                orders.slice(0, 6).map((order, i) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    variant="compact"
                    currency={currency}
                    onClick={() => onViewOrder?.(order)}
                    animationDelay={i * 0.05}
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <ProductFilterBar
            searchQuery={productSearch}
            onSearchChange={setProductSearch}
            statusFilter={productStatus}
            onStatusChange={(s) => setProductStatus(s as ProductStatus | 'all')}
            categoryFilter={productCategory}
            onCategoryChange={setProductCategory}
            categories={categories.map(c => ({ id: c.id, name: c.name }))}
            sortBy={productSort}
            onSortChange={setProductSort}
            viewMode={productViewMode}
            onViewModeChange={setProductViewMode}
          />

          {isLoading ? (
            <div className={cn(
              "grid gap-4",
              productViewMode === 'grid' 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} variant={productViewMode} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {productSearch || productStatus !== 'all'
                  ? "Try adjusting your filters"
                  : "Create your first product to get started"}
              </p>
              {!productSearch && productStatus === 'all' && (
                <Button onClick={onCreateProduct}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              productViewMode === 'grid' 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            )}>
              {filteredProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={productViewMode}
                  currency={currency}
                  onClick={() => onViewProduct?.(product)}
                  onEdit={() => onEditProduct?.(product)}
                  onView={() => onViewProduct?.(product)}
                  onDelete={() => onDeleteProduct?.(product.id)}
                  animationDelay={i * 0.03}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <OrderFilterBar
            searchQuery={orderSearch}
            onSearchChange={setOrderSearch}
            statusFilter={orderStatus}
            onStatusChange={(s) => setOrderStatus(s as OrderStatus | 'all')}
            sortBy={orderSort}
            onSortChange={setOrderSort}
          />

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No orders found</h3>
              <p className="text-muted-foreground">
                {orderSearch || orderStatus !== 'all'
                  ? "Try adjusting your filters"
                  : "Orders will appear here when customers make purchases"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, i) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currency={currency}
                  onClick={() => onViewOrder?.(order)}
                  onView={() => onViewOrder?.(order)}
                  onFulfill={() => onFulfillOrder?.(order.id)}
                  animationDelay={i * 0.03}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <RevenueChart
            data={revenueData}
            currency={currency}
            timeRange={revenueTimeRange}
            onTimeRangeChange={setRevenueTimeRange}
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueMetricCard
              title="This Month"
              value={totalRevenue * 0.4}
              currency={currency}
              change={{ value: 18.2, trend: 'up', period: 'vs last month' }}
              sparklineData={generateMockSparkline()}
            />
            <OrdersMetricCard
              title="Conversion Rate"
              value="3.2"
              valueSuffix="%"
              change={{ value: 0.5, trend: 'up' }}
              sparklineData={generateMockSparkline()}
            />
            <EcommerceMetricCard
              title="Cart Abandonment"
              value="68"
              valueSuffix="%"
              variant="warning"
              icon={ShoppingCart}
              change={{ value: 2.1, trend: 'down' }}
            />
            <EcommerceMetricCard
              title="Returning Customers"
              value="24"
              valueSuffix="%"
              variant="customers"
              icon={Users}
              change={{ value: 5.3, trend: 'up' }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

# PHASE-ECOM-01: Dashboard Redesign & Navigation

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 8-10 hours
> **Prerequisites**: None (First phase in Wave 1)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Completely redesign the E-Commerce dashboard with a modern sidebar navigation, comprehensive quick stats cards, activity widgets, and a command palette for fast navigation. This phase transforms the current tab-based layout into a professional, enterprise-grade dashboard that matches industry leaders like Shopify and WooCommerce.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code (`src/modules/ecommerce/`)
- [ ] Review current dashboard: `src/modules/ecommerce/components/ecommerce-dashboard.tsx`
- [ ] Verify dependencies are complete
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        E-Commerce Dashboard                              │
├────────────┬────────────────────────────────────────────────────────────┤
│            │  Header (Breadcrumbs, Search/Command Palette, Actions)     │
│            ├────────────────────────────────────────────────────────────┤
│  Sidebar   │  Stats Cards Row (Revenue, Orders, Products, Low Stock)   │
│            ├────────────────────────────────────────────────────────────┤
│  - Home    │                                                            │
│  - Products│              Main Content Area                             │
│  - Orders  │    (View-specific content based on sidebar selection)      │
│  - Customers│                                                           │
│  - Categories│                                                          │
│  - Discounts│                                                           │
│  - Quotes  │                                                            │
│  - Analytics│                                                           │
│  - Settings│                                                            │
│            ├────────────────────────────────────────────────────────────┤
│            │  Footer Widgets (Recent Orders | Low Stock | Activity)     │
└────────────┴────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/ecommerce/components/layout/ecommerce-sidebar.tsx` | Create | Sidebar navigation component |
| `src/modules/ecommerce/components/layout/ecommerce-header.tsx` | Create | Header with breadcrumbs, search, actions |
| `src/modules/ecommerce/components/layout/ecommerce-layout.tsx` | Create | Main layout wrapper |
| `src/modules/ecommerce/components/layout/index.ts` | Create | Layout exports |
| `src/modules/ecommerce/components/widgets/stats-cards.tsx` | Create | Revenue, orders, products stats |
| `src/modules/ecommerce/components/widgets/recent-orders-widget.tsx` | Create | Last 5 orders widget |
| `src/modules/ecommerce/components/widgets/low-stock-alerts.tsx` | Create | Low stock products alert |
| `src/modules/ecommerce/components/widgets/activity-feed.tsx` | Create | Recent activity feed |
| `src/modules/ecommerce/components/widgets/index.ts` | Create | Widget exports |
| `src/modules/ecommerce/components/command-palette.tsx` | Create | Cmd+K command palette |
| `src/modules/ecommerce/components/ecommerce-dashboard.tsx` | Modify | Integrate new layout |
| `src/modules/ecommerce/types/ecommerce-types.ts` | Modify | Add navigation types |
| `src/modules/ecommerce/actions/dashboard-actions.ts` | Create | Dashboard-specific data fetching |

---

## 📋 Implementation Tasks

### Task 1.1: Create Navigation Types

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`
**Action**: Modify (Add to end of file)

**Description**: Add TypeScript types for navigation and dashboard widgets

```typescript
// ============================================================================
// NAVIGATION & DASHBOARD TYPES
// ============================================================================

export type EcommerceView = 
  | 'home'
  | 'products' 
  | 'orders' 
  | 'customers'
  | 'categories' 
  | 'discounts' 
  | 'quotes'
  | 'analytics'
  | 'settings'

export interface EcommerceNavItem {
  id: EcommerceView
  label: string
  icon: string
  badge?: number | string
  badgeVariant?: 'default' | 'destructive' | 'warning' | 'success'
  children?: EcommerceNavItem[]
}

export interface DashboardStats {
  totalRevenue: number
  revenueChange: number // percentage change from previous period
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  activeProducts: number
  draftProducts: number
  lowStockProducts: number
  totalCustomers: number
  newCustomersThisWeek: number
}

export interface RecentOrderSummary {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  currency: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string | null
  quantity: number
  lowStockThreshold: number
  imageUrl: string | null
}

export interface ActivityItem {
  id: string
  type: 'order' | 'product' | 'customer' | 'review' | 'discount'
  action: 'created' | 'updated' | 'deleted' | 'status_changed'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export type StatsPeriod = 'today' | 'week' | 'month' | 'year'
```

---

### Task 1.2: Create Dashboard Data Actions

**File**: `src/modules/ecommerce/actions/dashboard-actions.ts`
**Action**: Create

**Description**: Server actions for fetching dashboard-specific data

```typescript
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
  let start = new Date(now)

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
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0)
  
  const prevRevenue = prev.reduce((sum, o) => sum + (o.total || 0), 0)
  const revenueChange = prevRevenue > 0 
    ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
    : 0

  // Orders
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  // Products
  const totalProducts = prods.length
  const activeProducts = prods.filter(p => p.status === 'active').length
  const draftProducts = prods.filter(p => p.status === 'draft').length
  const lowStockProducts = prods.filter(p => 
    p.track_inventory && p.quantity <= p.low_stock_threshold
  ).length

  // Customers - unique emails
  const uniqueEmails = new Set(custs.map(c => c.customer_email))
  const totalCustomers = uniqueEmails.size

  // New customers this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentCustomers = custs.filter(c => new Date(c.created_at) >= weekAgo)
  const recentUniqueEmails = new Set(recentCustomers.map(c => c.customer_email))
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

  return (data || []).map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.shipping_address?.first_name 
      ? `${order.shipping_address.first_name} ${order.shipping_address.last_name || ''}`
      : 'Guest',
    customerEmail: order.customer_email,
    total: order.total,
    currency: order.currency || 'USD',
    status: order.status,
    paymentStatus: order.payment_status,
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
  const lowStock = (data || []).filter(p => p.quantity <= p.low_stock_threshold)

  return lowStock.map(product => ({
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
    orders: orders?.map(o => ({ 
      id: o.id, 
      orderNumber: o.order_number, 
      customerEmail: o.customer_email 
    })) || [],
    categories: categories || []
  }
}
```

---

### Task 1.3: Create Sidebar Navigation Component

**File**: `src/modules/ecommerce/components/layout/ecommerce-sidebar.tsx`
**Action**: Create

**Description**: Left sidebar navigation for the e-commerce dashboard

```typescript
/**
 * E-Commerce Sidebar Navigation
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Provides main navigation for the e-commerce dashboard
 */
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Percent,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react'
import type { EcommerceView } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface NavItemConfig {
  id: EcommerceView
  label: string
  icon: typeof Home
  badge?: number
  badgeVariant?: 'default' | 'destructive' | 'secondary'
}

interface EcommerceSidebarProps {
  activeView: EcommerceView
  onViewChange: (view: EcommerceView) => void
  pendingOrders?: number
  lowStockCount?: number
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

// ============================================================================
// NAV ITEMS CONFIG
// ============================================================================

function getNavItems(pendingOrders: number, lowStockCount: number): NavItemConfig[] {
  return [
    { id: 'home', label: 'Dashboard', icon: Home },
    { 
      id: 'products', 
      label: 'Products', 
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeVariant: 'destructive' as const
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: ShoppingCart,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
      badgeVariant: 'destructive' as const
    },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'quotes', label: 'Quotes', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EcommerceSidebar({
  activeView,
  onViewChange,
  pendingOrders = 0,
  lowStockCount = 0,
  isCollapsed = false,
  onCollapsedChange
}: EcommerceSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const navItems = getNavItems(pendingOrders, lowStockCount)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Store Header */}
        <div className="flex items-center h-14 px-4 border-b">
          <div className={cn(
            'flex items-center gap-3 overflow-hidden',
            isCollapsed && 'justify-center'
          )}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate">E-Commerce</span>
                <span className="text-xs text-muted-foreground truncate">Store Dashboard</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              const button = (
                <Button
                  key={item.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 h-10',
                    isCollapsed && 'justify-center px-2',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                  )}
                  onClick={() => onViewChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && (
                        <Badge 
                          variant={item.badgeVariant || 'secondary'}
                          className="ml-auto h-5 px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge !== undefined && (
                    <Badge 
                      variant={item.badgeVariant || 'secondary'}
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </Button>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div className="relative">{button}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.label}
                      {item.badge !== undefined && (
                        <Badge variant={item.badgeVariant || 'secondary'} className="h-5">
                          {item.badge}
                        </Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return button
            })}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full', isCollapsed && 'px-2')}
            onClick={() => onCollapsedChange?.(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
```

---

### Task 1.4: Create Header Component

**File**: `src/modules/ecommerce/components/layout/ecommerce-header.tsx`
**Action**: Create

**Description**: Header with breadcrumbs, search, and quick actions

```typescript
/**
 * E-Commerce Header
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Header with breadcrumbs, search command palette trigger, and quick actions
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { 
  Search, 
  Plus, 
  Package, 
  ShoppingCart, 
  FolderTree, 
  Percent,
  FileText,
  Settings,
  RefreshCw,
  Command
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EcommerceView } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface EcommerceHeaderProps {
  currentView: EcommerceView
  onOpenCommandPalette: () => void
  onCreateProduct: () => void
  onCreateCategory: () => void
  onCreateDiscount: () => void
  onCreateOrder?: () => void
  onCreateQuote?: () => void
  onOpenSettings: () => void
  onRefresh: () => void
  isRefreshing?: boolean
}

// ============================================================================
// VIEW LABELS
// ============================================================================

const viewLabels: Record<EcommerceView, string> = {
  home: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  categories: 'Categories',
  discounts: 'Discounts',
  quotes: 'Quotes',
  analytics: 'Analytics',
  settings: 'Settings'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EcommerceHeader({
  currentView,
  onOpenCommandPalette,
  onCreateProduct,
  onCreateCategory,
  onCreateDiscount,
  onCreateOrder,
  onCreateQuote,
  onOpenSettings,
  onRefresh,
  isRefreshing = false
}: EcommerceHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b bg-background">
      {/* Left: Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault() }}>
              E-Commerce
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{viewLabels[currentView]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search Trigger */}
        <Button
          variant="outline"
          className="w-64 justify-start text-muted-foreground"
          onClick={onOpenCommandPalette}
        >
          <Search className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Quick Create Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
            {onCreateOrder && (
              <DropdownMenuItem onClick={onCreateOrder}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Order
              </DropdownMenuItem>
            )}
            {onCreateQuote && (
              <DropdownMenuItem onClick={onCreateQuote}>
                <FileText className="h-4 w-4 mr-2" />
                New Quote
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Store Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        </Button>
      </div>
    </header>
  )
}
```

---

### Task 1.5: Create Stats Cards Widget

**File**: `src/modules/ecommerce/components/widgets/stats-cards.tsx`
**Action**: Create

**Description**: Dashboard quick stats cards showing key metrics

```typescript
/**
 * Stats Cards Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays key e-commerce metrics in card format
 */
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStats, StatsPeriod } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface StatsCardsProps {
  stats: DashboardStats
  period: StatsPeriod
  onPeriodChange: (period: StatsPeriod) => void
  currency?: string
  isLoading?: boolean
}

// ============================================================================
// PERIOD LABELS
// ============================================================================

const periodLabels: Record<StatsPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StatsCards({
  stats,
  period,
  onPeriodChange,
  currency = 'USD',
  isLoading = false
}: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount / 100) // Assuming amounts are in cents
  }

  const formatPercentage = (value: number) => {
    const absValue = Math.abs(value)
    return `${value >= 0 ? '+' : '-'}${absValue.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {periodLabels[period]}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(periodLabels).map(([key, label]) => (
              <DropdownMenuItem 
                key={key}
                onClick={() => onPeriodChange(key as StatsPeriod)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Revenue Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold truncate">
                    {formatCurrency(stats.totalRevenue)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {stats.revenueChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn(
                    'text-xs font-medium',
                    stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatPercentage(stats.revenueChange)}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Orders</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.totalOrders}</span>
                  {stats.pendingOrders > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.pendingOrders} pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Products</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.activeProducts}</span>
                  {stats.draftProducts > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{stats.draftProducts} draft
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-lg',
                stats.lowStockProducts > 0 ? 'bg-red-500/10' : 'bg-gray-500/10'
              )}>
                <AlertTriangle className={cn(
                  'h-5 w-5',
                  stats.lowStockProducts > 0 ? 'text-red-600' : 'text-gray-500'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-2xl font-bold',
                    stats.lowStockProducts > 0 && 'text-red-600'
                  )}>
                    {stats.lowStockProducts}
                  </span>
                  {stats.lowStockProducts > 0 && (
                    <span className="text-xs text-red-600">items need restock</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-orange-500/10">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Customers</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.totalCustomers}</span>
                  {stats.newCustomersThisWeek > 0 && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      +{stats.newCustomersThisWeek} new
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

### Task 1.6: Create Recent Orders Widget

**File**: `src/modules/ecommerce/components/widgets/recent-orders-widget.tsx`
**Action**: Create

**Description**: Widget showing the 5 most recent orders

```typescript
/**
 * Recent Orders Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays the most recent orders with quick actions
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ShoppingCart, 
  ArrowRight,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecentOrderSummary, OrderStatus, PaymentStatus } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface RecentOrdersWidgetProps {
  orders: RecentOrderSummary[]
  onViewOrder: (orderId: string) => void
  onViewAll: () => void
  isLoading?: boolean
}

// ============================================================================
// STATUS CONFIGS
// ============================================================================

const orderStatusConfig: Record<OrderStatus, { 
  label: string
  icon: typeof Clock
  className: string 
}> = {
  pending: { 
    label: 'Pending', 
    icon: Clock, 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  },
  confirmed: { 
    label: 'Confirmed', 
    icon: CheckCircle, 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  processing: { 
    label: 'Processing', 
    icon: Package, 
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
  },
  shipped: { 
    label: 'Shipped', 
    icon: Truck, 
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
  },
  delivered: { 
    label: 'Delivered', 
    icon: CheckCircle, 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' 
  },
  refunded: { 
    label: 'Refunded', 
    icon: XCircle, 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  }
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'Unpaid', className: 'text-yellow-600' },
  paid: { label: 'Paid', className: 'text-green-600' },
  partially_refunded: { label: 'Partial Refund', className: 'text-orange-600' },
  refunded: { label: 'Refunded', className: 'text-red-600' },
  failed: { label: 'Failed', className: 'text-red-600' }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RecentOrdersWidget({
  orders,
  onViewOrder,
  onViewAll,
  isLoading = false
}: RecentOrdersWidgetProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Orders will appear here when customers make purchases
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Recent Orders
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = orderStatusConfig[order.status]
            const paymentConfig = paymentStatusConfig[order.paymentStatus]
            const StatusIcon = statusConfig.icon

            return (
              <div 
                key={order.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onViewOrder(order.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">
                    {getInitials(order.customerName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {order.orderNumber}
                    </span>
                    <Badge className={cn('text-xs', statusConfig.className)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-muted-foreground truncate">
                      {order.customerName}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium text-sm">
                    {formatCurrency(order.total, order.currency)}
                  </div>
                  <div className={cn('text-xs', paymentConfig.className)}>
                    {paymentConfig.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Task 1.7: Create Low Stock Alerts Widget

**File**: `src/modules/ecommerce/components/widgets/low-stock-alerts.tsx`
**Action**: Create

**Description**: Widget showing products that are low on stock

```typescript
/**
 * Low Stock Alerts Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays products that are running low on inventory
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, ArrowRight, Package, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LowStockProduct } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface LowStockAlertsProps {
  products: LowStockProduct[]
  onViewProduct: (productId: string) => void
  onViewAll: () => void
  isLoading?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LowStockAlerts({
  products,
  onViewProduct,
  onViewAll,
  isLoading = false
}: LowStockAlertsProps) {
  const getStockPercentage = (quantity: number, threshold: number) => {
    // Calculate percentage based on threshold (100% when at threshold, 0% when at 0)
    const maxDisplay = threshold * 2 // Show full bar when at 2x threshold
    return Math.min((quantity / maxDisplay) * 100, 100)
  }

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    }
    if (quantity <= threshold / 2) {
      return { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    }
    return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">All products are well stocked!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Products running low will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Low Stock Alerts
            <Badge variant="destructive" className="ml-2">
              {products.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.quantity, product.lowStockThreshold)
            const stockPercentage = getStockPercentage(product.quantity, product.lowStockThreshold)

            return (
              <div 
                key={product.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onViewProduct(product.id)}
              >
                {/* Product Image */}
                <div className="relative h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{product.name}</span>
                    <Badge className={cn('text-xs flex-shrink-0', stockStatus.className)}>
                      {stockStatus.label}
                    </Badge>
                  </div>
                  
                  {product.sku && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SKU: {product.sku}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <Progress 
                      value={stockPercentage} 
                      className={cn(
                        'h-1.5 flex-1',
                        product.quantity === 0 ? '[&>div]:bg-red-500' : 
                        product.quantity <= product.lowStockThreshold / 2 ? '[&>div]:bg-red-500' :
                        '[&>div]:bg-yellow-500'
                      )}
                    />
                    <span className={cn(
                      'text-xs font-medium tabular-nums',
                      product.quantity === 0 ? 'text-red-600' : 'text-muted-foreground'
                    )}>
                      {product.quantity} left
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Task 1.8: Create Activity Feed Widget

**File**: `src/modules/ecommerce/components/widgets/activity-feed.tsx`
**Action**: Create

**Description**: Widget showing recent store activity

```typescript
/**
 * Activity Feed Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays recent activity in the store
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  ShoppingCart, 
  Package, 
  Users, 
  Star,
  Percent,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityItem } from '../../types/ecommerce-types'

// ============================================================================
// TYPES
// ============================================================================

interface ActivityFeedProps {
  activities: ActivityItem[]
  maxHeight?: number
  isLoading?: boolean
}

// ============================================================================
// ACTIVITY TYPE CONFIG
// ============================================================================

const activityTypeConfig: Record<ActivityItem['type'], {
  icon: typeof ShoppingCart
  bgColor: string
  iconColor: string
}> = {
  order: { 
    icon: ShoppingCart, 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  product: { 
    icon: Package, 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  customer: { 
    icon: Users, 
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  review: { 
    icon: Star, 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  },
  discount: { 
    icon: Percent, 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400'
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityFeed({
  activities,
  maxHeight = 400,
  isLoading = false
}: ActivityFeedProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start gap-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Store activity will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="px-6 pb-4 space-y-1">
            {activities.map((activity, index) => {
              const config = activityTypeConfig[activity.type]
              const Icon = config.icon

              return (
                <div 
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 py-3',
                    index < activities.length - 1 && 'border-b'
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-full flex-shrink-0',
                    config.bgColor
                  )}>
                    <Icon className={cn('h-4 w-4', config.iconColor)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
```

---

### Task 1.9: Create Widget Exports

**File**: `src/modules/ecommerce/components/widgets/index.ts`
**Action**: Create

**Description**: Export all widget components

```typescript
/**
 * E-Commerce Widgets
 * 
 * Phase ECOM-01: Dashboard Redesign
 */

export { StatsCards } from './stats-cards'
export { RecentOrdersWidget } from './recent-orders-widget'
export { LowStockAlerts } from './low-stock-alerts'
export { ActivityFeed } from './activity-feed'
```

---

### Task 1.10: Create Command Palette Component

**File**: `src/modules/ecommerce/components/command-palette.tsx`
**Action**: Create

**Description**: Cmd+K command palette for quick navigation and search

```typescript
/**
 * E-Commerce Command Palette
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Quick search and navigation using Cmd+K
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { 
  Home,
  Package, 
  ShoppingCart, 
  Users, 
  FolderTree, 
  Percent,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Search
} from 'lucide-react'
import type { EcommerceView } from '../types/ecommerce-types'
import { quickSearch } from '../actions/dashboard-actions'
import { useDebounce } from '@/lib/hooks/use-debounce'

// ============================================================================
// TYPES
// ============================================================================

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  onNavigate: (view: EcommerceView) => void
  onCreateProduct: () => void
  onCreateCategory: () => void
  onCreateDiscount: () => void
  onViewProduct: (productId: string) => void
  onViewOrder: (orderId: string) => void
}

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const navigationItems = [
  { id: 'home' as EcommerceView, label: 'Dashboard', icon: Home, keywords: ['home', 'overview'] },
  { id: 'products' as EcommerceView, label: 'Products', icon: Package, keywords: ['inventory', 'items'] },
  { id: 'orders' as EcommerceView, label: 'Orders', icon: ShoppingCart, keywords: ['sales', 'purchases'] },
  { id: 'customers' as EcommerceView, label: 'Customers', icon: Users, keywords: ['users', 'clients'] },
  { id: 'categories' as EcommerceView, label: 'Categories', icon: FolderTree, keywords: ['collections', 'groups'] },
  { id: 'discounts' as EcommerceView, label: 'Discounts', icon: Percent, keywords: ['coupons', 'promotions'] },
  { id: 'quotes' as EcommerceView, label: 'Quotes', icon: FileText, keywords: ['quotations', 'rfq'] },
  { id: 'analytics' as EcommerceView, label: 'Analytics', icon: BarChart3, keywords: ['reports', 'stats'] },
  { id: 'settings' as EcommerceView, label: 'Settings', icon: Settings, keywords: ['config', 'preferences'] },
]

const actionItems = [
  { id: 'create-product', label: 'New Product', icon: Plus, action: 'product' },
  { id: 'create-category', label: 'New Category', icon: Plus, action: 'category' },
  { id: 'create-discount', label: 'New Discount', icon: Plus, action: 'discount' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function CommandPalette({
  open,
  onOpenChange,
  siteId,
  onNavigate,
  onCreateProduct,
  onCreateCategory,
  onCreateDiscount,
  onViewProduct,
  onViewOrder
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{
    products: Array<{ id: string; name: string; sku: string | null }>
    orders: Array<{ id: string; orderNumber: string; customerEmail: string }>
    categories: Array<{ id: string; name: string }>
  }>({ products: [], orders: [], categories: [] })
  const [isSearching, setIsSearching] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  // Perform search when debounced value changes
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true)
      quickSearch(siteId, debouncedSearch)
        .then(setSearchResults)
        .finally(() => setIsSearching(false))
    } else {
      setSearchResults({ products: [], orders: [], categories: [] })
    }
  }, [debouncedSearch, siteId])

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const handleSelect = useCallback((callback: () => void) => {
    onOpenChange(false)
    setSearch('')
    callback()
  }, [onOpenChange])

  const hasSearchResults = 
    searchResults.products.length > 0 || 
    searchResults.orders.length > 0 || 
    searchResults.categories.length > 0

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search products, orders, or type a command..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? 'Searching...' : 'No results found.'}
        </CommandEmpty>

        {/* Search Results */}
        {hasSearchResults && (
          <>
            {searchResults.products.length > 0 && (
              <CommandGroup heading="Products">
                {searchResults.products.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleSelect(() => onViewProduct(product.id))}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    <span>{product.name}</span>
                    {product.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.orders.length > 0 && (
              <CommandGroup heading="Orders">
                {searchResults.orders.map((order) => (
                  <CommandItem
                    key={order.id}
                    onSelect={() => handleSelect(() => onViewOrder(order.id))}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>{order.orderNumber}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {order.customerEmail}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.categories.length > 0 && (
              <CommandGroup heading="Categories">
                {searchResults.categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    onSelect={() => handleSelect(() => onNavigate('categories'))}
                  >
                    <FolderTree className="mr-2 h-4 w-4" />
                    <span>{category.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(() => onNavigate(item.id))}
                keywords={item.keywords}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>Go to {item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {actionItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.id}
                onSelect={() => {
                  handleSelect(() => {
                    switch (item.action) {
                      case 'product':
                        onCreateProduct()
                        break
                      case 'category':
                        onCreateCategory()
                        break
                      case 'discount':
                        onCreateDiscount()
                        break
                    }
                  })
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

---

### Task 1.11: Create Layout Components Export

**File**: `src/modules/ecommerce/components/layout/index.ts`
**Action**: Create

**Description**: Export all layout components

```typescript
/**
 * E-Commerce Layout Components
 * 
 * Phase ECOM-01: Dashboard Redesign
 */

export { EcommerceSidebar } from './ecommerce-sidebar'
export { EcommerceHeader } from './ecommerce-header'
```

---

### Task 1.12: Create Home Dashboard View

**File**: `src/modules/ecommerce/components/views/home-view.tsx`
**Action**: Create

**Description**: The main dashboard home view with widgets

```typescript
/**
 * Home Dashboard View
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * The main home view with stats and widgets
 */
'use client'

import { useState, useEffect } from 'react'
import { StatsCards, RecentOrdersWidget, LowStockAlerts, ActivityFeed } from '../widgets'
import type { 
  DashboardStats, 
  RecentOrderSummary, 
  LowStockProduct,
  ActivityItem,
  StatsPeriod 
} from '../../types/ecommerce-types'
import {
  getDashboardStats,
  getRecentOrders,
  getLowStockProducts,
  getActivityFeed
} from '../../actions/dashboard-actions'

// ============================================================================
// TYPES
// ============================================================================

interface HomeViewProps {
  siteId: string
  onViewOrder: (orderId: string) => void
  onViewProduct: (productId: string) => void
  onNavigateToOrders: () => void
  onNavigateToProducts: () => void
  currency?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HomeView({
  siteId,
  onViewOrder,
  onViewProduct,
  onNavigateToOrders,
  onNavigateToProducts,
  currency = 'USD'
}: HomeViewProps) {
  const [period, setPeriod] = useState<StatsPeriod>('month')
  const [isLoading, setIsLoading] = useState(true)
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    draftProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    newCustomersThisWeek: 0
  })
  
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Load all dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      try {
        const [statsData, ordersData, lowStockData, activityData] = await Promise.all([
          getDashboardStats(siteId, period),
          getRecentOrders(siteId, 5),
          getLowStockProducts(siteId, 5),
          getActivityFeed(siteId, 20)
        ])

        setStats(statsData)
        setRecentOrders(ordersData)
        setLowStockProducts(lowStockData)
        setActivities(activityData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [siteId, period])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards
        stats={stats}
        period={period}
        onPeriodChange={setPeriod}
        currency={currency}
        isLoading={isLoading}
      />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentOrdersWidget
            orders={recentOrders}
            onViewOrder={onViewOrder}
            onViewAll={onNavigateToOrders}
            isLoading={isLoading}
          />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed
            activities={activities}
            maxHeight={400}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Low Stock Alerts - Full Width */}
      <LowStockAlerts
        products={lowStockProducts}
        onViewProduct={onViewProduct}
        onViewAll={onNavigateToProducts}
        isLoading={isLoading}
      />
    </div>
  )
}
```

---

### Task 1.13: Update Views Index Export

**File**: `src/modules/ecommerce/components/views/index.ts`
**Action**: Modify

**Description**: Add HomeView export

```typescript
/**
 * E-Commerce Views
 * 
 * Phase EM-52 + ECOM-01: E-Commerce Views
 */

export { ProductsView } from './products-view'
export { OrdersView } from './orders-view'
export { CategoriesView } from './categories-view'
export { DiscountsView } from './discounts-view'
export { AnalyticsView } from './analytics-view'
export { HomeView } from './home-view'
```

---

### Task 1.14: Redesign Main Dashboard Component

**File**: `src/modules/ecommerce/components/ecommerce-dashboard.tsx`
**Action**: Modify (Complete Rewrite)

**Description**: Integrate new sidebar layout and all widgets

```typescript
/**
 * E-Commerce Dashboard Main Component
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * The main dashboard shell with sidebar navigation
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { EcommerceSidebar, EcommerceHeader } from './layout'
import { HomeView } from './views/home-view'
import { ProductsView } from './views/products-view'
import { OrdersView } from './views/orders-view'
import { CategoriesView } from './views/categories-view'
import { DiscountsView } from './views/discounts-view'
import { AnalyticsView } from './views/analytics-view'
import { CommandPalette } from './command-palette'
import { EcommerceProvider, useEcommerce } from '../context/ecommerce-context'
import { CreateProductDialog } from './dialogs/create-product-dialog'
import { CreateCategoryDialog } from './dialogs/create-category-dialog'
import { CreateDiscountDialog } from './dialogs/create-discount-dialog'
import { EcommerceSettingsDialog } from './dialogs/ecommerce-settings-dialog'
import { ViewProductDialog } from './dialogs/view-product-dialog'
import { cn } from '@/lib/utils'
import type { EcommerceView, EcommerceSettings, Product } from '../types/ecommerce-types'

// ============================================================================
// DASHBOARD PROPS
// ============================================================================

interface EcommerceDashboardProps {
  siteId: string
  agencyId: string
  settings?: EcommerceSettings | null
  initialView?: string
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================

function EcommerceDashboardContent({ 
  siteId, 
  initialView 
}: { 
  siteId: string
  initialView?: string 
}) {
  const { 
    products,
    orders,
    error, 
    isLoading,
    refresh
  } = useEcommerce()

  // State
  const [activeView, setActiveView] = useState<EcommerceView>(() => {
    if (initialView) {
      const validViews: EcommerceView[] = [
        'home', 'products', 'orders', 'customers', 'categories', 
        'discounts', 'quotes', 'analytics', 'settings'
      ]
      if (validViews.includes(initialView as EcommerceView)) {
        return initialView as EcommerceView
      }
    }
    return 'home'
  })
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  
  // Dialog states
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateDiscount, setShowCreateDiscount] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [showViewProduct, setShowViewProduct] = useState(false)

  // Calculate stats for sidebar badges
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const lowStockProducts = products.filter(p => 
    p.track_inventory && p.quantity <= p.low_stock_threshold
  ).length

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }, [refresh])

  const handleViewProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setViewingProduct(product)
      setShowViewProduct(true)
    }
  }, [products])

  const handleViewOrder = useCallback((orderId: string) => {
    // Navigate to orders view and potentially open order detail
    setActiveView('orders')
    // TODO: Pass orderId to OrdersView to open detail dialog
  }, [])

  // Handle settings view navigation
  useEffect(() => {
    if (activeView === 'settings') {
      setShowSettings(true)
      setActiveView('home') // Return to home after opening settings
    }
  }, [activeView])

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <EcommerceSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        pendingOrders={pendingOrders}
        lowStockCount={lowStockProducts}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <EcommerceHeader
          currentView={activeView}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onCreateProduct={() => setShowCreateProduct(true)}
          onCreateCategory={() => setShowCreateCategory(true)}
          onCreateDiscount={() => setShowCreateDiscount(true)}
          onOpenSettings={() => setShowSettings(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing || isLoading}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {activeView === 'home' && (
            <HomeView
              siteId={siteId}
              onViewOrder={handleViewOrder}
              onViewProduct={handleViewProduct}
              onNavigateToOrders={() => setActiveView('orders')}
              onNavigateToProducts={() => setActiveView('products')}
            />
          )}

          {activeView === 'products' && (
            <ProductsView 
              onCreateProduct={() => setShowCreateProduct(true)}
            />
          )}

          {activeView === 'orders' && (
            <OrdersView />
          )}

          {activeView === 'customers' && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Customer Management - Coming in Phase ECOM-05</p>
            </div>
          )}

          {activeView === 'categories' && (
            <CategoriesView 
              onCreateCategory={() => setShowCreateCategory(true)}
            />
          )}

          {activeView === 'discounts' && (
            <DiscountsView 
              onCreateDiscount={() => setShowCreateDiscount(true)}
            />
          )}

          {activeView === 'quotes' && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Quotation System - Coming in Wave 2 (Phase ECOM-10+)</p>
            </div>
          )}

          {activeView === 'analytics' && (
            <AnalyticsView />
          )}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        siteId={siteId}
        onNavigate={setActiveView}
        onCreateProduct={() => setShowCreateProduct(true)}
        onCreateCategory={() => setShowCreateCategory(true)}
        onCreateDiscount={() => setShowCreateDiscount(true)}
        onViewProduct={handleViewProduct}
        onViewOrder={handleViewOrder}
      />

      {/* Dialogs */}
      <CreateProductDialog
        open={showCreateProduct}
        onOpenChange={setShowCreateProduct}
      />

      <CreateCategoryDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
      />

      <CreateDiscountDialog
        open={showCreateDiscount}
        onOpenChange={setShowCreateDiscount}
      />

      <EcommerceSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      {viewingProduct && (
        <ViewProductDialog
          open={showViewProduct}
          onOpenChange={setShowViewProduct}
          product={viewingProduct}
        />
      )}
    </div>
  )
}

// ============================================================================
// MAIN DASHBOARD WRAPPER
// ============================================================================

export function EcommerceDashboard({ 
  siteId, 
  agencyId, 
  settings: _settings, 
  initialView 
}: EcommerceDashboardProps) {
  return (
    <EcommerceProvider siteId={siteId} agencyId={agencyId}>
      <EcommerceDashboardContent 
        siteId={siteId} 
        initialView={initialView} 
      />
    </EcommerceProvider>
  )
}
```

---

## 🗄️ Database Migrations

No database migrations required for Phase ECOM-01. This phase focuses on frontend dashboard redesign.

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] Dashboard loads with new sidebar layout
- [ ] Sidebar navigation switches between views correctly
- [ ] Sidebar collapse/expand works
- [ ] Stats cards display correctly with period selector
- [ ] Recent orders widget shows latest orders
- [ ] Low stock alerts widget shows products needing restock
- [ ] Activity feed displays recent actions
- [ ] Command palette opens with Cmd+K / Ctrl+K
- [ ] Command palette search finds products and orders
- [ ] Quick navigation via command palette works
- [ ] Quick actions (Create dropdown) opens correct dialogs
- [ ] Mobile responsive: sidebar collapses on small screens
- [ ] All existing functionality preserved (product CRUD, etc.)

---

## 🔄 Rollback Plan

If issues occur:
1. Restore original `ecommerce-dashboard.tsx` from git
2. Remove new files in `components/layout/` and `components/widgets/`
3. Remove `actions/dashboard-actions.ts`
4. Revert type additions in `types/ecommerce-types.ts`
5. Run `npx tsc --noEmit` to verify clean state

```bash
git checkout -- src/modules/ecommerce/components/ecommerce-dashboard.tsx
git checkout -- src/modules/ecommerce/components/views/index.ts
rm -rf src/modules/ecommerce/components/layout/
rm -rf src/modules/ecommerce/components/widgets/
rm src/modules/ecommerce/components/command-palette.tsx
rm src/modules/ecommerce/components/views/home-view.tsx
rm src/modules/ecommerce/actions/dashboard-actions.ts
```

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add "✅ PHASE-ECOM-01: Dashboard Redesign Complete"
- `progress.md`: Update e-commerce section with dashboard redesign status

---

## ✨ Success Criteria

- [ ] Dashboard has a professional sidebar navigation
- [ ] Home view shows comprehensive stats and widgets
- [ ] Quick stats cards display revenue, orders, products, low stock, customers
- [ ] Recent orders widget shows last 5 orders with status badges
- [ ] Low stock alerts widget highlights products needing restock
- [ ] Activity feed shows recent store activity
- [ ] Command palette (Cmd+K) provides quick search and navigation
- [ ] All views are accessible via sidebar navigation
- [ ] Mobile responsive layout works correctly
- [ ] TypeScript compiles with zero errors

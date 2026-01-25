/**
 * E-Commerce Dashboard Main Component
 * 
 * Phase EM-52: E-Commerce Module
 * 
 * The main dashboard shell that provides navigation between E-Commerce views
 */
'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsView } from './views/products-view'
import { OrdersView } from './views/orders-view'
import { CategoriesView } from './views/categories-view'
import { DiscountsView } from './views/discounts-view'
import { AnalyticsView } from './views/analytics-view'
import { EcommerceProvider, useEcommerce } from '../context/ecommerce-context'
import { 
  Package, 
  ShoppingCart, 
  FolderTree,
  Percent,
  BarChart3,
  Search,
  Plus,
  RefreshCw,
  Settings,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CreateProductDialog } from './dialogs/create-product-dialog'
import { CreateCategoryDialog } from './dialogs/create-category-dialog'
import { CreateDiscountDialog } from './dialogs/create-discount-dialog'
import { EcommerceSettingsDialog } from './dialogs/ecommerce-settings-dialog'
import type { EcommerceSettings, Product, Order, Category, Discount } from '../types/ecommerce-types'

// ============================================================================
// VIEW TYPE
// ============================================================================

export type EcommerceView = 'products' | 'orders' | 'categories' | 'discounts' | 'analytics'

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

function EcommerceDashboardContent({ initialView }: { initialView?: string }) {
  const { 
    products,
    orders,
    categories,
    discounts,
    error, 
    isLoading,
    refresh
  } = useEcommerce()
  
  const [activeView, setActiveView] = useState<EcommerceView>('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateDiscount, setShowCreateDiscount] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Set initial view from URL
  useEffect(() => {
    if (initialView) {
      const view = initialView as EcommerceView
      if (['products', 'orders', 'categories', 'discounts', 'analytics'].includes(view)) {
        setActiveView(view)
      }
    }
  }, [initialView])

  // Calculate summary stats
  const activeProducts = products.filter(p => p.status === 'active')
  const draftProducts = products.filter(p => p.status === 'draft')
  const lowStockProducts = products.filter(p => p.track_inventory && p.quantity <= p.low_stock_threshold)
  
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const processingOrders = orders.filter(o => o.status === 'processing')
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayOrders = orders.filter(o => new Date(o.created_at) >= today)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  
  const activeDiscounts = discounts.filter(d => d.is_active)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">E-Commerce Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage products, orders, and your online store
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Quick Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowCreateProduct(true)}>
                  <Package className="h-4 w-4 mr-2" />
                  New Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateCategory(true)}>
                  <FolderTree className="h-4 w-4 mr-2" />
                  New Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateDiscount(true)}>
                  <Percent className="h-4 w-4 mr-2" />
                  New Discount
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Store Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Refresh */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", (isRefreshing || isLoading) && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{activeProducts.length}</span>
                    {draftProducts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{draftProducts.length} draft
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <ShoppingCart className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orders Today</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{todayOrders.length}</span>
                    {pendingOrders.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {pendingOrders.length} pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <span className="text-2xl font-bold">
                    ${(todayRevenue / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <span className="text-2xl font-bold">{lowStockProducts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Percent className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Discounts</p>
                  <span className="text-2xl font-bold">{activeDiscounts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs 
          value={activeView} 
          onValueChange={(v) => setActiveView(v as EcommerceView)}
          className="h-full flex flex-col"
        >
          <div className="border-b px-6">
            <TabsList className="h-12 bg-transparent border-none gap-4">
              <TabsTrigger value="products" className="data-[state=active]:bg-muted gap-2">
                <Package className="h-4 w-4" />
                Products
                <Badge variant="secondary" className="ml-1">{products.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-muted gap-2">
                <ShoppingCart className="h-4 w-4" />
                Orders
                {pendingOrders.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{pendingOrders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="categories" className="data-[state=active]:bg-muted gap-2">
                <FolderTree className="h-4 w-4" />
                Categories
                <Badge variant="secondary" className="ml-1">{categories.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="discounts" className="data-[state=active]:bg-muted gap-2">
                <Percent className="h-4 w-4" />
                Discounts
                <Badge variant="secondary" className="ml-1">{discounts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-muted gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="products" className="mt-0 h-full">
              <ProductsView 
                searchQuery={searchQuery} 
                onCreateProduct={() => setShowCreateProduct(true)}
              />
            </TabsContent>
            
            <TabsContent value="orders" className="mt-0 h-full">
              <OrdersView searchQuery={searchQuery} />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0 h-full">
              <CategoriesView 
                searchQuery={searchQuery}
                onCreateCategory={() => setShowCreateCategory(true)}
              />
            </TabsContent>
            
            <TabsContent value="discounts" className="mt-0 h-full">
              <DiscountsView 
                searchQuery={searchQuery}
                onCreateDiscount={() => setShowCreateDiscount(true)}
              />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0 h-full">
              <AnalyticsView />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
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
    </div>
  )
}

// ============================================================================
// MAIN DASHBOARD WRAPPER
// ============================================================================

export function EcommerceDashboard({ siteId, agencyId, settings, initialView }: EcommerceDashboardProps) {
  return (
    <EcommerceProvider siteId={siteId} agencyId={agencyId}>
      <EcommerceDashboardContent initialView={initialView} />
    </EcommerceProvider>
  )
}

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
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
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

  const handleViewOrder = useCallback((_orderId: string) => {
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
        <Button onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
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


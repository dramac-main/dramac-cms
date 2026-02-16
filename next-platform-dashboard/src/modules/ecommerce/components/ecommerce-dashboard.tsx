/**
 * E-Commerce Dashboard Main Component
 * 
 * Phase ECOM-01: Dashboard Redesign
 * Phase ECOM-53: Onboarding Wizard Integration
 * 
 * The main dashboard shell with sidebar navigation
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { EcommerceSidebar, EcommerceHeader } from './layout'
import { HomeView } from './views/home-view'
import { ProductsView } from './views/products-view'
import { OrdersView } from './views/orders-view'
import { CustomersView } from './views/customers-view'
import { CategoriesView } from './views/categories-view'
import { DiscountsView } from './views/discounts-view'
import { QuotesView } from './views/quotes-view'
import { InventoryView } from './views/inventory-view'
import { AnalyticsView } from './views/analytics-view'
import { MarketingView } from './views/marketing-view'
import { DeveloperSettingsView } from './views/developer-settings-view'
import { SettingsView } from './views/settings-view'
import { EmbedCodeGenerator } from './views/embed-code-view'
import { CommandPalette } from './command-palette'
import { EcommerceProvider, useEcommerce } from '../context/ecommerce-context'
import { CreateProductDialog } from './dialogs/create-product-dialog'
import { CreateCategoryDialog } from './dialogs/create-category-dialog'
import { CreateDiscountDialog } from './dialogs/create-discount-dialog'
import { ViewProductDialog } from './dialogs/view-product-dialog'
import { OnboardingWizard } from './onboarding/OnboardingWizard'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import type { EcommerceView, EcommerceSettings, Product } from '../types/ecommerce-types'

// ============================================================================
// DASHBOARD PROPS
// ============================================================================

interface EcommerceDashboardProps {
  siteId: string
  agencyId: string
  userId?: string
  userName?: string
  settings?: EcommerceSettings | null
  initialView?: string
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================

function EcommerceDashboardContent({ 
  siteId,
  agencyId,
  userId,
  userName = 'Store Manager',
  initialView,
  settings
}: { 
  siteId: string
  agencyId: string
  userId?: string
  userName?: string
  initialView?: string 
  settings?: EcommerceSettings | null
}) {
  const { 
    products,
    orders,
    error, 
    isLoading,
    refresh
  } = useEcommerce()

  // Onboarding state - initially null while loading
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)
  
  // Check onboarding status from site_module_installations on mount
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const { getOnboardingStatus } = await import('../actions/onboarding-actions')
        const result = await getOnboardingStatus(siteId)
        if (result.success && result.status) {
          setShowOnboarding(!result.status.completed)
        } else {
          // If we can't determine, default to showing onboarding
          setShowOnboarding(true)
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err)
        setShowOnboarding(true)
      }
    }
    checkOnboarding()
  }, [siteId])

  // State
  const [activeView, setActiveView] = useState<EcommerceView>(() => {
    if (initialView) {
      const validViews: EcommerceView[] = [
        'home', 'products', 'orders', 'customers', 'categories', 
        'discounts', 'quotes', 'inventory', 'analytics', 'marketing',
        'developer', 'settings', 'embed'
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
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null)
  
  // Dialog states
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateDiscount, setShowCreateDiscount] = useState(false)
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
    // Set the order to focus on, then navigate to orders view
    setFocusOrderId(orderId)
    setActiveView('orders')
  }, [])

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

  // Loading onboarding check
  if (showOnboarding === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show onboarding wizard if not completed
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingWizard
          siteId={siteId}
          onComplete={() => {
            setShowOnboarding(false)
            refresh() // Refresh data after onboarding
          }}
          onSkip={() => {
            setShowOnboarding(false)
          }}
        />
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
          onOpenSettings={() => setActiveView('settings')}
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
            <OrdersView
              userId={userId || ''}
              userName={userName}
              focusOrderId={focusOrderId}
              onFocusOrderHandled={() => setFocusOrderId(null)}
            />
          )}

          {activeView === 'customers' && (
            <CustomersView
              siteId={siteId}
              agencyId={agencyId}
              userId={userId || ''}
              userName={userName}
            />
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
            <QuotesView 
              siteId={siteId}
              agencyId={agencyId}
              userId={userId || ''}
              userName={userName}
            />
          )}

          {activeView === 'inventory' && (
            <InventoryView 
              siteId={siteId}
              agencyId={agencyId}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView />
          )}

          {activeView === 'marketing' && (
            <MarketingView 
              siteId={siteId}
            />
          )}

          {activeView === 'developer' && (
            <DeveloperSettingsView 
              siteId={siteId}
              agencyId={agencyId}
            />
          )}

          {activeView === 'embed' && (
            <EmbedCodeGenerator
              siteId={siteId}
              agencyId={agencyId}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView siteId={siteId} agencyId={agencyId} />
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
  userId,
  userName,
  settings, 
  initialView 
}: EcommerceDashboardProps) {
  return (
    <EcommerceProvider siteId={siteId} agencyId={agencyId}>
      <EcommerceDashboardContent 
        siteId={siteId}
        agencyId={agencyId}
        userId={userId}
        userName={userName}
        settings={settings}
        initialView={initialView} 
      />
    </EcommerceProvider>
  )
}


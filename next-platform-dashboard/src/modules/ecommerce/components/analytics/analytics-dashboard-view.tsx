'use client'

/**
 * Analytics Dashboard View
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Main analytics dashboard with tabs for different analytics sections.
 */

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Package, 
  Users, 
  TrendingUp,
  RefreshCw,
  FileText,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalytics } from '../../hooks/use-analytics'
import {
  AnalyticsToolbar,
  SalesOverviewCards,
  RevenueChart,
  OrdersChart,
  SalesByChannelChart,
  RevenueBreakdownCard,
  TopProductsChart,
  CategoryPerformanceChart,
  ProductPerformanceTable,
  CategoryPerformanceTable,
  CustomerInsightsCard,
  CustomerSegmentationChart,
  CustomerLTVTable,
  ConversionFunnelChart,
  CartAbandonmentCard
} from '../analytics'

// ============================================================================
// TYPES
// ============================================================================

type AnalyticsTab = 'sales' | 'products' | 'customers' | 'conversions'

interface AnalyticsDashboardViewProps {
  siteId: string
  className?: string
}

// ============================================================================
// SALES TAB
// ============================================================================

interface SalesTabProps {
  siteId: string
  analytics: ReturnType<typeof useAnalytics>
}

function SalesTab({ siteId, analytics }: SalesTabProps) {
  const { sales, dateRange } = analytics
  
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <SalesOverviewCards 
        data={sales.overview}
        isLoading={sales.isLoading}
      />
      
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart
          data={sales.salesByPeriod || []}
          groupBy={dateRange.groupBy}
          isLoading={sales.isLoading}
        />
        <OrdersChart
          data={sales.salesByPeriod || []}
          groupBy={dateRange.groupBy}
          isLoading={sales.isLoading}
        />
      </div>
      
      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesByChannelChart
          data={sales.salesByChannel || []}
          isLoading={sales.isLoading}
        />
        <RevenueBreakdownCard
          data={sales.revenueBreakdown}
          isLoading={sales.isLoading}
        />
      </div>
    </div>
  )
}

// ============================================================================
// PRODUCTS TAB
// ============================================================================

interface ProductsTabProps {
  siteId: string
  analytics: ReturnType<typeof useAnalytics>
}

function ProductsTab({ siteId, analytics }: ProductsTabProps) {
  const { products } = analytics
  
  return (
    <div className="space-y-6">
      {/* Top Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsChart
          data={products.topProducts || []}
          isLoading={products.isLoading}
        />
        <CategoryPerformanceChart
          data={products.categories || []}
          isLoading={products.isLoading}
        />
      </div>
      
      {/* Tables */}
      <ProductPerformanceTable
        data={products.products}
        isLoading={products.isLoading}
      />
      
      <CategoryPerformanceTable
        data={products.categories}
        isLoading={products.isLoading}
      />
    </div>
  )
}

// ============================================================================
// CUSTOMERS TAB
// ============================================================================

interface CustomersTabProps {
  siteId: string
  analytics: ReturnType<typeof useAnalytics>
}

function CustomersTab({ siteId, analytics }: CustomersTabProps) {
  const { customers } = analytics
  
  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CustomerInsightsCard
          data={customers.insights}
          isLoading={customers.isLoading}
        />
        <CustomerSegmentationChart
          data={customers.segmentation}
          isLoading={customers.isLoading}
        />
      </div>
      
      {/* CLV Table */}
      <CustomerLTVTable
        data={customers.lifetimeValue}
        isLoading={customers.isLoading}
      />
    </div>
  )
}

// ============================================================================
// CONVERSIONS TAB
// ============================================================================

interface ConversionsTabProps {
  siteId: string
  analytics: ReturnType<typeof useAnalytics>
}

function ConversionsTab({ siteId, analytics }: ConversionsTabProps) {
  const { conversions } = analytics
  
  return (
    <div className="space-y-6">
      {/* Funnel and Abandonment */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConversionFunnelChart
          data={conversions.funnel}
          isLoading={conversions.isLoading}
        />
        <CartAbandonmentCard
          data={conversions.cartAbandonment}
          isLoading={conversions.isLoading}
        />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN DASHBOARD VIEW
// ============================================================================

export function AnalyticsDashboardView({
  siteId,
  className
}: AnalyticsDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('sales')
  const analytics = useAnalytics(siteId)
  
  const isLoading = analytics.sales.isLoading || 
    analytics.products.isLoading || 
    analytics.customers.isLoading ||
    analytics.conversions.isLoading
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Track your store performance and customer insights
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => analytics.refreshAll()}
          disabled={isLoading}
        >
          <RefreshCw className={cn(
            'h-4 w-4 mr-2',
            isLoading && 'animate-spin'
          )} />
          Refresh
        </Button>
      </div>
      
      {/* Toolbar */}
      <AnalyticsToolbar
        preset={analytics.dateRange.preset}
        groupBy={analytics.dateRange.groupBy}
        onPresetChange={analytics.dateRange.setPreset}
        onCustomRangeChange={analytics.dateRange.setCustomRange}
        onGroupByChange={analytics.dateRange.setGroupBy}
      />
      
      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as AnalyticsTab)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="sales" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Customers</span>
          </TabsTrigger>
          <TabsTrigger value="conversions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Conversions</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="mt-6">
          <SalesTab siteId={siteId} analytics={analytics} />
        </TabsContent>
        
        <TabsContent value="products" className="mt-6">
          <ProductsTab siteId={siteId} analytics={analytics} />
        </TabsContent>
        
        <TabsContent value="customers" className="mt-6">
          <CustomersTab siteId={siteId} analytics={analytics} />
        </TabsContent>
        
        <TabsContent value="conversions" className="mt-6">
          <ConversionsTab siteId={siteId} analytics={analytics} />
        </TabsContent>
      </Tabs>
      
      {/* Saved Reports Quick Access */}
      {analytics.savedReports.favorites.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Favorite Reports
          </h3>
          <div className="flex flex-wrap gap-2">
            {analytics.savedReports.favorites.map((report) => (
              <Button
                key={report.id}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {report.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboardView

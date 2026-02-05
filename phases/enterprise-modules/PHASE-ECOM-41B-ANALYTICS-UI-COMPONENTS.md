# PHASE-ECOM-41B: Analytics & Reports - UI Components

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 6-7 hours
> **Prerequisites**: PHASE-ECOM-41A Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the dashboard UI components for analytics and reporting including interactive charts (Recharts), KPI widgets, data tables (TanStack Table), report builder dialog, and saved reports management. This phase delivers the visual business intelligence layer.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-41A complete (analytics-actions.ts exists)
- [ ] Verify Recharts installed: `pnpm list recharts`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Analytics UI Architecture (Phase 41B)
├── Dashboard Components
│   ├── AnalyticsDashboardView      → Main analytics page
│   ├── SalesOverviewCard           → KPI summary widget
│   ├── SalesChart                  → Revenue/orders chart
│   └── DateRangePicker             → Date selection component
│
├── Chart Components (Recharts)
│   ├── RevenueChart                → Line/area chart
│   ├── SalesByChannelChart         → Pie/donut chart
│   ├── ProductPerformanceChart     → Bar chart
│   ├── ConversionFunnelChart       → Funnel visualization
│   └── CustomerSegmentChart        → Pie chart
│
├── Data Tables (TanStack Table)
│   ├── ProductPerformanceTable     → Product metrics grid
│   ├── CategoryPerformanceTable    → Category breakdown
│   └── CustomerLifetimeTable       → CLV data grid
│
├── Report Components
│   ├── ReportBuilderDialog         → Create/edit reports
│   ├── SavedReportsView            → Manage saved reports
│   └── ReportExportButton          → Export functionality
│
└── Hooks
    ├── useAnalytics()              → Analytics data fetching
    ├── useSavedReports()           → Report management
    └── useChartData()              → Chart data transformation
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `components/ecommerce/views/analytics-dashboard-view.tsx` | Create | Main analytics dashboard |
| `components/ecommerce/widgets/sales-overview-card.tsx` | Create | KPI summary widget |
| `components/ecommerce/charts/revenue-chart.tsx` | Create | Revenue line/area chart |
| `components/ecommerce/charts/sales-by-channel-chart.tsx` | Create | Channel breakdown pie chart |
| `components/ecommerce/charts/product-performance-chart.tsx` | Create | Product bar chart |
| `components/ecommerce/charts/conversion-funnel-chart.tsx` | Create | Funnel visualization |
| `components/ecommerce/charts/customer-segment-chart.tsx` | Create | Customer pie chart |
| `components/ecommerce/tables/product-performance-table.tsx` | Create | Product metrics table |
| `components/ecommerce/dialogs/report-builder-dialog.tsx` | Create | Report builder |
| `components/ecommerce/views/saved-reports-view.tsx` | Create | Saved reports management |
| `hooks/ecommerce/use-analytics.ts` | Create | Analytics data hook |

---

## 📋 Implementation Tasks

### Task 41B.1: Create Analytics Hook

**File**: `src/hooks/ecommerce/use-analytics.ts`
**Action**: Create

```typescript
/**
 * Analytics Data Hook
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Hook for fetching and managing analytics data with caching.
 */
'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
import {
  getSalesOverview,
  getSalesByPeriod,
  getSalesByChannel,
  getRevenueBreakdown,
  getProductPerformance,
  getTopProducts,
  getCategoryPerformance,
  getCustomerInsights,
  getCustomerSegmentation,
  getConversionFunnel,
  getCartAbandonmentRate,
  getSavedReports,
  createSavedReport,
  updateSavedReport,
  deleteSavedReport,
  toggleReportFavorite
} from '@/modules/ecommerce/actions/analytics-actions'
import type {
  DateRange,
  DateRangePreset,
  GroupByPeriod,
  SalesOverview,
  SalesByPeriod,
  SalesByChannel,
  RevenueBreakdown,
  ProductPerformance,
  CategoryPerformance,
  CustomerInsights,
  CustomerSegmentation,
  ConversionFunnel,
  CartAbandonment,
  SavedReport,
  SavedReportInput,
  SavedReportUpdate
} from '@/modules/ecommerce/types/analytics-types'

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsState {
  salesOverview: SalesOverview | null
  salesByPeriod: SalesByPeriod[]
  salesByChannel: SalesByChannel[]
  revenueBreakdown: RevenueBreakdown | null
  productPerformance: ProductPerformance[]
  categoryPerformance: CategoryPerformance[]
  customerInsights: CustomerInsights | null
  customerSegmentation: CustomerSegmentation | null
  conversionFunnel: ConversionFunnel | null
  cartAbandonment: CartAbandonment | null
}

interface UseAnalyticsOptions {
  siteId: string
  dateRange?: DateRange | DateRangePreset
  groupBy?: GroupByPeriod
  autoFetch?: boolean
}

interface UseAnalyticsReturn extends AnalyticsState {
  isLoading: boolean
  isPending: boolean
  error: string | null
  dateRange: DateRange | DateRangePreset
  groupBy: GroupByPeriod
  
  // Actions
  setDateRange: (range: DateRange | DateRangePreset) => void
  setGroupBy: (period: GroupByPeriod) => void
  refresh: () => Promise<void>
  refreshSalesOverview: () => Promise<void>
  refreshProductPerformance: () => Promise<void>
  refreshCustomerInsights: () => Promise<void>
}

// ============================================================================
// HOOK: useAnalytics
// ============================================================================

export function useAnalytics(options: UseAnalyticsOptions): UseAnalyticsReturn {
  const {
    siteId,
    dateRange: initialDateRange = 'last_30_days',
    groupBy: initialGroupBy = 'day',
    autoFetch = true
  } = options
  
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [dateRange, setDateRange] = useState<DateRange | DateRangePreset>(initialDateRange)
  const [groupBy, setGroupBy] = useState<GroupByPeriod>(initialGroupBy)
  
  const [state, setState] = useState<AnalyticsState>({
    salesOverview: null,
    salesByPeriod: [],
    salesByChannel: [],
    revenueBreakdown: null,
    productPerformance: [],
    categoryPerformance: [],
    customerInsights: null,
    customerSegmentation: null,
    conversionFunnel: null,
    cartAbandonment: null
  })
  
  // Fetch all analytics data
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const [
        salesOverview,
        salesByPeriod,
        salesByChannel,
        revenueBreakdown,
        productPerformance,
        categoryPerformance,
        customerInsights,
        customerSegmentation,
        conversionFunnel,
        cartAbandonment
      ] = await Promise.all([
        getSalesOverview(siteId, dateRange),
        getSalesByPeriod(siteId, groupBy, dateRange),
        getSalesByChannel(siteId, dateRange),
        getRevenueBreakdown(siteId, dateRange),
        getProductPerformance(siteId, dateRange),
        getCategoryPerformance(siteId, dateRange),
        getCustomerInsights(siteId, dateRange),
        getCustomerSegmentation(siteId),
        getConversionFunnel(siteId, dateRange),
        getCartAbandonmentRate(siteId, dateRange)
      ])
      
      setState({
        salesOverview,
        salesByPeriod,
        salesByChannel,
        revenueBreakdown,
        productPerformance,
        categoryPerformance,
        customerInsights,
        customerSegmentation,
        conversionFunnel,
        cartAbandonment
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, dateRange, groupBy])
  
  // Individual refresh functions
  const refreshSalesOverview = useCallback(async () => {
    if (!siteId) return
    
    startTransition(async () => {
      const salesOverview = await getSalesOverview(siteId, dateRange)
      setState(prev => ({ ...prev, salesOverview }))
    })
  }, [siteId, dateRange])
  
  const refreshProductPerformance = useCallback(async () => {
    if (!siteId) return
    
    startTransition(async () => {
      const productPerformance = await getProductPerformance(siteId, dateRange)
      setState(prev => ({ ...prev, productPerformance }))
    })
  }, [siteId, dateRange])
  
  const refreshCustomerInsights = useCallback(async () => {
    if (!siteId) return
    
    startTransition(async () => {
      const customerInsights = await getCustomerInsights(siteId, dateRange)
      setState(prev => ({ ...prev, customerInsights }))
    })
  }, [siteId, dateRange])
  
  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRange | DateRangePreset) => {
    setDateRange(range)
  }, [])
  
  // Handle groupBy change
  const handleGroupByChange = useCallback((period: GroupByPeriod) => {
    setGroupBy(period)
  }, [])
  
  // Auto-fetch on mount and when parameters change
  useEffect(() => {
    if (autoFetch && siteId) {
      refresh()
    }
  }, [autoFetch, siteId, dateRange, groupBy, refresh])
  
  return {
    ...state,
    isLoading,
    isPending,
    error,
    dateRange,
    groupBy,
    setDateRange: handleDateRangeChange,
    setGroupBy: handleGroupByChange,
    refresh,
    refreshSalesOverview,
    refreshProductPerformance,
    refreshCustomerInsights
  }
}

// ============================================================================
// HOOK: useSavedReports
// ============================================================================

interface UseSavedReportsReturn {
  reports: SavedReport[]
  isLoading: boolean
  isPending: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: SavedReportInput) => Promise<SavedReport | null>
  update: (id: string, updates: SavedReportUpdate) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  toggleFavorite: (id: string) => Promise<boolean>
}

export function useSavedReports(siteId: string): UseSavedReportsReturn {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<SavedReport[]>([])
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getSavedReports(siteId)
      setReports(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const create = useCallback(async (input: SavedReportInput): Promise<SavedReport | null> => {
    const result = await createSavedReport(siteId, input)
    
    if (result.success && result.report) {
      setReports(prev => [result.report!, ...prev])
      return result.report
    }
    
    setError(result.error ?? 'Failed to create report')
    return null
  }, [siteId])
  
  const update = useCallback(async (id: string, updates: SavedReportUpdate): Promise<boolean> => {
    const result = await updateSavedReport(id, updates)
    
    if (result.success) {
      setReports(prev => prev.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ))
      return true
    }
    
    setError(result.error ?? 'Failed to update report')
    return false
  }, [])
  
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteSavedReport(id)
    
    if (result.success) {
      setReports(prev => prev.filter(r => r.id !== id))
      return true
    }
    
    setError(result.error ?? 'Failed to delete report')
    return false
  }, [])
  
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    const result = await toggleReportFavorite(id)
    
    if (result.success) {
      setReports(prev => prev.map(r =>
        r.id === id ? { ...r, is_favorite: result.is_favorite! } : r
      ))
      return true
    }
    
    setError(result.error ?? 'Failed to toggle favorite')
    return false
  }, [])
  
  // Initial fetch
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    reports,
    isLoading,
    isPending,
    error,
    refresh,
    create,
    update,
    remove,
    toggleFavorite
  }
}
```

---

### Task 41B.2: Create Sales Overview Card

**File**: `src/components/ecommerce/widgets/sales-overview-card.tsx`
**Action**: Create

```typescript
/**
 * Sales Overview Card
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * KPI summary widget showing key sales metrics with trend indicators.
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  ShoppingCart,
  Package,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SalesOverview } from '@/modules/ecommerce/types/analytics-types'
import { formatCurrency, formatNumber, formatPercentage } from '@/modules/ecommerce/lib/analytics-utils'

// ============================================================================
// TYPES
// ============================================================================

interface SalesOverviewCardProps {
  data: SalesOverview | null
  isLoading?: boolean
  className?: string
}

interface KPIMetricProps {
  label: string
  value: string
  change: number
  icon: React.ReactNode
  isLoading?: boolean
}

// ============================================================================
// COMPONENTS
// ============================================================================

function TrendIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs font-medium">+{change.toFixed(1)}%</span>
      </div>
    )
  }
  
  if (change < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs font-medium">{change.toFixed(1)}%</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3 w-3" />
      <span className="text-xs font-medium">0%</span>
    </div>
  )
}

function KPIMetric({ label, value, change, icon, isLoading }: KPIMetricProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
    )
  }
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <TrendIndicator change={change} />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SalesOverviewCard({ data, isLoading, className }: SalesOverviewCardProps) {
  const metrics = data ? [
    {
      label: 'Revenue',
      value: formatCurrency(data.revenue),
      change: data.revenue_change,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      label: 'Orders',
      value: formatNumber(data.orders),
      change: data.orders_change,
      icon: <ShoppingCart className="h-4 w-4" />
    },
    {
      label: 'Avg Order Value',
      value: formatCurrency(data.average_order_value),
      change: data.aov_change,
      icon: <Package className="h-4 w-4" />
    },
    {
      label: 'Products Sold',
      value: formatNumber(data.products_sold),
      change: 0, // No historical comparison for this metric by default
      icon: <Package className="h-4 w-4" />
    }
  ] : []
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Sales Overview</CardTitle>
          {data && (
            <Badge variant={data.gross_margin >= 30 ? 'default' : 'secondary'}>
              {data.gross_margin.toFixed(1)}% margin
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {isLoading || !data ? (
            <>
              <KPIMetric label="" value="" change={0} icon={null} isLoading />
              <KPIMetric label="" value="" change={0} icon={null} isLoading />
              <KPIMetric label="" value="" change={0} icon={null} isLoading />
              <KPIMetric label="" value="" change={0} icon={null} isLoading />
            </>
          ) : (
            metrics.map((metric) => (
              <KPIMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
                change={metric.change}
                icon={metric.icon}
              />
            ))
          )}
        </div>
        
        {/* Additional metrics row */}
        {data && (
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Gross Profit</p>
              <p className="font-semibold text-green-600">
                {formatCurrency(data.gross_profit)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Refunds</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(data.refunds)} ({data.refund_count})
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Net Revenue</p>
              <p className="font-semibold">
                {formatCurrency(data.net_revenue)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

### Task 41B.3: Create Revenue Chart

**File**: `src/components/ecommerce/charts/revenue-chart.tsx`
**Action**: Create

```typescript
/**
 * Revenue Chart
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Line/area chart for revenue and orders over time using Recharts.
 */
'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import type { SalesByPeriod, GroupByPeriod } from '@/modules/ecommerce/types/analytics-types'
import { formatCurrency, formatNumber, formatPeriodLabel } from '@/modules/ecommerce/lib/analytics-utils'

// ============================================================================
// TYPES
// ============================================================================

interface RevenueChartProps {
  data: SalesByPeriod[]
  isLoading?: boolean
  groupBy?: GroupByPeriod
  className?: string
}

type ChartType = 'area' | 'line'
type DataKey = 'revenue' | 'orders' | 'both'

// ============================================================================
// CHART CONFIG
// ============================================================================

const CHART_COLORS = {
  revenue: '#3B82F6',   // Blue
  orders: '#10B981',    // Green
  aov: '#F59E0B'        // Amber
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.dataKey === 'revenue' 
              ? formatCurrency(entry.value)
              : entry.dataKey === 'average_order_value'
                ? formatCurrency(entry.value)
                : formatNumber(entry.value)
            }
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RevenueChart({ 
  data, 
  isLoading, 
  groupBy = 'day',
  className 
}: RevenueChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area')
  const [dataKey, setDataKey] = useState<DataKey>('both')
  
  // Transform data for chart
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      name: formatPeriodLabel(item.period, groupBy),
      revenue: item.revenue / 100, // Convert to dollars for display
      average_order_value: item.average_order_value / 100
    }))
  }, [data, groupBy])
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }
  
  const ChartComponent = chartType === 'area' ? AreaChart : LineChart
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg">Revenue & Orders</CardTitle>
          <div className="flex items-center gap-2">
            <Tabs 
              value={dataKey} 
              onValueChange={(v) => setDataKey(v as DataKey)}
              className="h-8"
            >
              <TabsList className="h-8">
                <TabsTrigger value="both" className="text-xs h-7 px-2">Both</TabsTrigger>
                <TabsTrigger value="revenue" className="text-xs h-7 px-2">Revenue</TabsTrigger>
                <TabsTrigger value="orders" className="text-xs h-7 px-2">Orders</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs 
              value={chartType} 
              onValueChange={(v) => setChartType(v as ChartType)}
              className="h-8"
            >
              <TabsList className="h-8">
                <TabsTrigger value="area" className="text-xs h-7 px-2">Area</TabsTrigger>
                <TabsTrigger value="line" className="text-xs h-7 px-2">Line</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${formatNumber(value)}`}
              />
              {(dataKey === 'both' || dataKey === 'orders') && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {(dataKey === 'both' || dataKey === 'revenue') && (
                chartType === 'area' ? (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={CHART_COLORS.revenue}
                    fill={CHART_COLORS.revenue}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ) : (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={CHART_COLORS.revenue}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )
              )}
              
              {(dataKey === 'both' || dataKey === 'orders') && (
                chartType === 'area' ? (
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke={CHART_COLORS.orders}
                    fill={CHART_COLORS.orders}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ) : (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke={CHART_COLORS.orders}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Task 41B.4: Create Sales By Channel Chart

**File**: `src/components/ecommerce/charts/sales-by-channel-chart.tsx`
**Action**: Create

```typescript
/**
 * Sales By Channel Chart
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Pie/donut chart showing revenue breakdown by sales channel.
 */
'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { SalesByChannel } from '@/modules/ecommerce/types/analytics-types'
import { formatCurrency, getChartColors } from '@/modules/ecommerce/lib/analytics-utils'

// ============================================================================
// TYPES
// ============================================================================

interface SalesByChannelChartProps {
  data: SalesByChannel[]
  isLoading?: boolean
  className?: string
}

// ============================================================================
// CHART CONFIG
// ============================================================================

const CHANNEL_LABELS: Record<string, string> = {
  website: 'Website',
  quote: 'Quotes',
  manual: 'Manual Entry',
  api: 'API',
  import: 'Import',
  pos: 'Point of Sale'
}

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  
  const data = payload[0].payload
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium">{data.label}</p>
      <div className="mt-1 space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Revenue: </span>
          <span className="font-medium">{formatCurrency(data.revenue)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Orders: </span>
          <span className="font-medium">{data.orders}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Share: </span>
          <span className="font-medium">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    </div>
  )
}

// Custom legend
function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SalesByChannelChart({ data, isLoading, className }: SalesByChannelChartProps) {
  const chartData = useMemo(() => {
    const colors = getChartColors(data.length)
    
    return data.map((item, index) => ({
      ...item,
      label: CHANNEL_LABELS[item.channel] || item.channel,
      fill: colors[index]
    }))
  }, [data])
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-[250px] w-[250px] rounded-full" />
        </CardContent>
      </Card>
    )
  }
  
  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Sales by Channel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Sales by Channel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="revenue"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ label, percentage }) => 
                  percentage > 5 ? `${percentage.toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary table */}
        <div className="mt-4 space-y-2">
          {chartData.map((item) => (
            <div key={item.channel} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{item.orders} orders</span>
                <span className="font-medium">{formatCurrency(item.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Task 41B.5: Create Conversion Funnel Chart

**File**: `src/components/ecommerce/charts/conversion-funnel-chart.tsx`
**Action**: Create

```typescript
/**
 * Conversion Funnel Chart
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Funnel visualization showing conversion stages from cart to purchase.
 */
'use client'

import { useMemo } from 'react'
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowDown, TrendingDown } from 'lucide-react'
import type { ConversionFunnel, FunnelStage } from '@/modules/ecommerce/types/analytics-types'
import { formatNumber, getChartColors } from '@/modules/ecommerce/lib/analytics-utils'

// ============================================================================
// TYPES
// ============================================================================

interface ConversionFunnelChartProps {
  data: ConversionFunnel | null
  isLoading?: boolean
  className?: string
}

// ============================================================================
// CHART CONFIG
// ============================================================================

const FUNNEL_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981'  // Green
]

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  
  const data = payload[0].payload
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium">{data.label}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Count: </span>
          <span className="font-medium">{formatNumber(data.count)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Conversion: </span>
          <span className="font-medium">{data.conversion_rate.toFixed(1)}%</span>
        </p>
        <p>
          <span className="text-muted-foreground">Drop-off: </span>
          <span className="font-medium text-red-600">{data.drop_off_rate.toFixed(1)}%</span>
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// ALTERNATIVE: Horizontal Funnel Bars
// ============================================================================

function HorizontalFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxCount = stages[0]?.count ?? 1
  
  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const width = (stage.count / maxCount) * 100
        
        return (
          <div key={stage.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatNumber(stage.count)}
                </span>
                {index > 0 && (
                  <Badge 
                    variant={stage.drop_off_rate > 50 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    -{stage.drop_off_rate.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="h-10 bg-muted rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{ 
                  width: `${width}%`,
                  backgroundColor: FUNNEL_COLORS[index] ?? FUNNEL_COLORS[0]
                }}
              />
            </div>
            
            {index < stages.length - 1 && (
              <div className="flex items-center justify-center py-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversionFunnelChart({ data, isLoading, className }: ConversionFunnelChartProps) {
  const chartData = useMemo(() => {
    if (!data?.stages) return []
    
    return data.stages.map((stage, index) => ({
      ...stage,
      fill: FUNNEL_COLORS[index] ?? FUNNEL_COLORS[0],
      value: stage.count
    }))
  }, [data])
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }
  
  if (!data?.stages?.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No funnel data available</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
          <Badge variant="outline">
            {data.overall_conversion_rate.toFixed(1)}% overall
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Use horizontal bars for better readability */}
        <HorizontalFunnel stages={data.stages} />
        
        {/* Stats summary */}
        <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{formatNumber(data.stages[0]?.count ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Started</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {formatNumber(data.stages[data.stages.length - 1]?.count ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {data.overall_conversion_rate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Conversion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Task 41B.6: Create Product Performance Table

**File**: `src/components/ecommerce/tables/product-performance-table.tsx`
**Action**: Create

```typescript
/**
 * Product Performance Table
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * TanStack Table for product performance metrics with sorting and export.
 */
'use client'

import { useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle
} from 'lucide-react'
import Image from 'next/image'
import type { ProductPerformance } from '@/modules/ecommerce/types/analytics-types'
import { formatCurrency, formatNumber, toCSV, downloadCSV } from '@/modules/ecommerce/lib/analytics-utils'

// ============================================================================
// TYPES
// ============================================================================

interface ProductPerformanceTableProps {
  data: ProductPerformance[]
  isLoading?: boolean
  className?: string
}

// ============================================================================
// COLUMNS
// ============================================================================

const columns: ColumnDef<ProductPerformance>[] = [
  {
    id: 'rank',
    header: '#',
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-sm">
        {row.original.revenue_rank}
      </span>
    ),
    size: 50
  },
  {
    accessorKey: 'product_name',
    header: 'Product',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.image_url ? (
          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={row.original.image_url}
              alt={row.original.product_name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium truncate">{row.original.product_name}</p>
          <div className="flex items-center gap-2">
            {row.original.sku && (
              <span className="text-xs text-muted-foreground">
                {row.original.sku}
              </span>
            )}
            {row.original.category_name && (
              <Badge variant="secondary" className="text-xs">
                {row.original.category_name}
              </Badge>
            )}
          </div>
        </div>
      </div>
    ),
    size: 300
  },
  {
    accessorKey: 'revenue',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Revenue
        {column.getIsSorted() === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(row.original.revenue)}
      </span>
    ),
    sortingFn: 'basic'
  },
  {
    accessorKey: 'quantity_sold',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Units Sold
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.quantity_sold)}</span>
    ),
    sortingFn: 'basic'
  },
  {
    accessorKey: 'orders',
    header: 'Orders',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.orders)}</span>
    )
  },
  {
    accessorKey: 'average_price',
    header: 'Avg Price',
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatCurrency(row.original.average_price)}
      </span>
    )
  },
  {
    accessorKey: 'current_stock',
    header: 'Stock',
    cell: ({ row }) => {
      const stock = row.original.current_stock
      const daysOfStock = row.original.days_of_stock
      
      const isLow = daysOfStock < 14 && daysOfStock > 0
      const isOut = stock <= 0
      
      return (
        <div className="flex items-center gap-2">
          <span className={`tabular-nums ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : ''}`}>
            {formatNumber(stock)}
          </span>
          {isLow && !isOut && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          {isOut && (
            <Badge variant="destructive" className="text-xs">Out</Badge>
          )}
        </div>
      )
    }
  }
]

// ============================================================================
// LOADING SKELETON
// ============================================================================

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductPerformanceTable({ 
  data, 
  isLoading, 
  className 
}: ProductPerformanceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'revenue', desc: true }
  ])
  
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  })
  
  const handleExport = () => {
    const exportColumns = [
      { key: 'revenue_rank', label: 'Rank' },
      { key: 'product_name', label: 'Product' },
      { key: 'sku', label: 'SKU' },
      { key: 'category_name', label: 'Category' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'quantity_sold', label: 'Units Sold' },
      { key: 'orders', label: 'Orders' },
      { key: 'average_price', label: 'Avg Price' },
      { key: 'current_stock', label: 'Stock' }
    ]
    
    const csv = toCSV(
      data.map(p => ({
        ...p,
        revenue: p.revenue / 100,
        average_price: p.average_price / 100
      })),
      exportColumns
    )
    downloadCSV(csv, `product-performance-${new Date().toISOString().split('T')[0]}.csv`)
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Product Performance</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={isLoading || !data.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No product data available</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-4">
              <p className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  data.length
                )}{' '}
                of {data.length} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

---

### Task 41B.7: Create Analytics Dashboard View

**File**: `src/components/ecommerce/views/analytics-dashboard-view.tsx`
**Action**: Create

```typescript
/**
 * Analytics Dashboard View
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * Main analytics dashboard with KPIs, charts, and data tables.
 */
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Download, Calendar } from 'lucide-react'
import { useAnalytics } from '@/hooks/ecommerce/use-analytics'
import { SalesOverviewCard } from '../widgets/sales-overview-card'
import { RevenueChart } from '../charts/revenue-chart'
import { SalesByChannelChart } from '../charts/sales-by-channel-chart'
import { ConversionFunnelChart } from '../charts/conversion-funnel-chart'
import { ProductPerformanceTable } from '../tables/product-performance-table'
import type { DateRangePreset, GroupByPeriod } from '@/modules/ecommerce/types/analytics-types'
import { getPresetLabel } from '@/modules/ecommerce/lib/analytics-utils'

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsDashboardViewProps {
  siteId: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' }
]

const GROUP_BY_OPTIONS: { value: GroupByPeriod; label: string }[] = [
  { value: 'hour', label: 'Hourly' },
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AnalyticsDashboardView({ siteId }: AnalyticsDashboardViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  const {
    salesOverview,
    salesByPeriod,
    salesByChannel,
    productPerformance,
    conversionFunnel,
    customerInsights,
    customerSegmentation,
    isLoading,
    isPending,
    error,
    dateRange,
    groupBy,
    setDateRange,
    setGroupBy,
    refresh
  } = useAnalytics({
    siteId,
    dateRange: 'last_30_days',
    groupBy: 'day',
    autoFetch: true
  })
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Sales performance and business insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <Select
            value={typeof dateRange === 'string' ? dateRange : 'custom'}
            onValueChange={(value) => setDateRange(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Group By Selector (for charts) */}
          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as GroupByPeriod)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refresh()}
            disabled={isLoading || isPending}
          >
            <RefreshCcw className={`h-4 w-4 ${(isLoading || isPending) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <SalesOverviewCard 
            data={salesOverview} 
            isLoading={isLoading} 
          />
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart
              data={salesByPeriod}
              isLoading={isLoading}
              groupBy={groupBy}
            />
            <SalesByChannelChart
              data={salesByChannel}
              isLoading={isLoading}
            />
          </div>
          
          {/* Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConversionFunnelChart
              data={conversionFunnel}
              isLoading={isLoading}
            />
            
            {/* Quick Stats */}
            {customerInsights && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">New Customers</p>
                  <p className="text-2xl font-bold">{customerInsights.new_customers}</p>
                  <p className={`text-xs ${customerInsights.new_customers_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customerInsights.new_customers_change >= 0 ? '+' : ''}{customerInsights.new_customers_change.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Returning Customers</p>
                  <p className="text-2xl font-bold">{customerInsights.returning_customers}</p>
                  <p className="text-xs text-muted-foreground">
                    {customerInsights.repeat_customer_rate.toFixed(1)}% repeat rate
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Avg Orders/Customer</p>
                  <p className="text-2xl font-bold">
                    {customerInsights.average_orders_per_customer.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Avg Lifetime Value</p>
                  <p className="text-2xl font-bold">
                    ${(customerInsights.average_lifetime_value / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <SalesOverviewCard 
            data={salesOverview} 
            isLoading={isLoading} 
          />
          <RevenueChart
            data={salesByPeriod}
            isLoading={isLoading}
            groupBy={groupBy}
          />
          <SalesByChannelChart
            data={salesByChannel}
            isLoading={isLoading}
          />
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <ProductPerformanceTable
            data={productPerformance}
            isLoading={isLoading}
          />
        </TabsContent>
        
        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          {customerInsights && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customerInsights.total_customers}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">New This Period</p>
                <p className="text-2xl font-bold">{customerInsights.new_customers}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Repeat Rate</p>
                <p className="text-2xl font-bold">{customerInsights.repeat_customer_rate.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Avg LTV</p>
                <p className="text-2xl font-bold">${(customerInsights.average_lifetime_value / 100).toFixed(0)}</p>
              </div>
            </div>
          )}
          
          {customerSegmentation && (
            <div className="rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Customer Segments</h3>
              <div className="space-y-4">
                {customerSegmentation.segments.map((segment) => (
                  <div key={segment.segment} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{segment.label}</p>
                      <p className="text-sm text-muted-foreground">{segment.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{segment.customer_count}</p>
                      <p className="text-sm text-muted-foreground">{segment.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-6">
          <ConversionFunnelChart
            data={conversionFunnel}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsDashboardView
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] `useAnalytics` hook fetches all data correctly
- [ ] Date range selector updates data
- [ ] Group by selector changes chart granularity
- [ ] `SalesOverviewCard` displays KPIs with trends
- [ ] `RevenueChart` renders with area/line toggle
- [ ] `SalesByChannelChart` shows pie chart with legend
- [ ] `ConversionFunnelChart` displays funnel stages
- [ ] `ProductPerformanceTable` sorts and paginates
- [ ] CSV export downloads correct data
- [ ] Loading states display skeletons
- [ ] Empty states show appropriate messages
- [ ] Mobile responsive layout works

---

## 🔄 Rollback Plan

If issues occur:

```bash
# Remove new components
git checkout HEAD~1 -- src/components/ecommerce/views/analytics-dashboard-view.tsx
git checkout HEAD~1 -- src/components/ecommerce/widgets/sales-overview-card.tsx
git checkout HEAD~1 -- src/components/ecommerce/charts/
git checkout HEAD~1 -- src/components/ecommerce/tables/product-performance-table.tsx
git checkout HEAD~1 -- src/hooks/ecommerce/use-analytics.ts
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-41B completion note
- `progress.md`: Update Wave 5 section - Analytics UI complete

---

## ✨ Success Criteria

- [ ] All chart components render correctly
- [ ] Data tables paginate and sort
- [ ] Date range filtering works
- [ ] Export to CSV functional
- [ ] Responsive on mobile
- [ ] Loading states smooth
- [ ] Zero TypeScript errors
- [ ] Zero runtime errors

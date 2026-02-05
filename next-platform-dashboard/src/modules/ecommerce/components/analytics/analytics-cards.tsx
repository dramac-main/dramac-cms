'use client'

/**
 * Analytics Card Components
 * 
 * Phase ECOM-41B: Analytics & Reports - UI Components
 * 
 * KPI cards and summary widgets for analytics dashboard.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Percent,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import type { 
  SalesOverview, 
  RevenueBreakdown,
  CustomerInsights,
  CartAbandonment 
} from '../../types/analytics-types'
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/analytics-utils'

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  isLoading?: boolean
  className?: string
  valuePrefix?: string
  valueSuffix?: string
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs previous period',
  icon,
  isLoading = false,
  className,
  valuePrefix,
  valueSuffix
}: KPICardProps) {
  const changeType = change === undefined ? 'neutral' : change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {valuePrefix}{typeof value === 'number' ? formatNumber(value) : value}{valueSuffix}
            </div>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <Badge 
                  variant={changeType === 'increase' ? 'default' : changeType === 'decrease' ? 'destructive' : 'secondary'}
                  className="text-xs px-1.5 py-0"
                >
                  {changeType === 'increase' ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : changeType === 'decrease' ? (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <Minus className="h-3 w-3 mr-0.5" />
                  )}
                  {formatPercentage(Math.abs(change))}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SALES OVERVIEW CARDS
// ============================================================================

interface SalesOverviewCardsProps {
  data: SalesOverview | null
  isLoading?: boolean
  className?: string
}

export function SalesOverviewCards({
  data,
  isLoading = false,
  className
}: SalesOverviewCardsProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      <KPICard
        title="Total Revenue"
        value={data ? formatCurrency(data.revenue) : '$0.00'}
        change={data?.revenue_change}
        icon={<DollarSign className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <KPICard
        title="Total Orders"
        value={data?.orders ?? 0}
        change={data?.orders_change}
        icon={<ShoppingCart className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <KPICard
        title="Average Order Value"
        value={data ? formatCurrency(data.average_order_value) : '$0.00'}
        change={data?.aov_change}
        icon={<Package className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <KPICard
        title="Products Sold"
        value={data?.products_sold ?? 0}
        change={0}
        icon={<Users className="h-4 w-4" />}
        isLoading={isLoading}
      />
    </div>
  )
}

// ============================================================================
// REVENUE BREAKDOWN CARD
// ============================================================================

interface RevenueBreakdownCardProps {
  data: RevenueBreakdown | null
  isLoading?: boolean
  className?: string
}

export function RevenueBreakdownCard({
  data,
  isLoading = false,
  className
}: RevenueBreakdownCardProps) {
  const items = data ? [
    { label: 'Gross Revenue', value: data.gross_revenue, type: 'positive' as const },
    { label: 'Discounts', value: -data.discounts, type: 'negative' as const },
    { label: 'Refunds', value: -data.refunds, type: 'negative' as const },
    { label: 'Shipping', value: data.shipping_collected, type: 'neutral' as const },
    { label: 'Tax Collected', value: data.tax_collected, type: 'neutral' as const },
    { label: 'Net Revenue', value: data.net_revenue, type: 'total' as const }
  ] : []
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div 
                key={item.label}
                className={cn(
                  'flex justify-between items-center py-1',
                  item.type === 'total' && 'border-t pt-3 mt-2 font-semibold'
                )}
              >
                <span className={cn(
                  'text-sm',
                  item.type !== 'total' && 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
                <span className={cn(
                  'font-medium',
                  item.type === 'negative' && 'text-red-600 dark:text-red-400',
                  item.type === 'positive' && 'text-green-600 dark:text-green-400'
                )}>
                  {item.value < 0 ? '-' : ''}{formatCurrency(Math.abs(item.value))}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CUSTOMER INSIGHTS CARD
// ============================================================================

interface CustomerInsightsCardProps {
  data: CustomerInsights | null
  isLoading?: boolean
  className?: string
}

export function CustomerInsightsCard({
  data,
  isLoading = false,
  className
}: CustomerInsightsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Customer Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">New Customers</p>
              <p className="text-xl font-semibold">{data?.new_customers ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Returning</p>
              <p className="text-xl font-semibold">{data?.returning_customers ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Repeat Rate</p>
              <p className="text-xl font-semibold">
                {data?.repeat_customer_rate?.toFixed(1) ?? '0'}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Orders/Customer</p>
              <p className="text-xl font-semibold">
                {data?.average_orders_per_customer?.toFixed(1) ?? '0'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CART ABANDONMENT CARD
// ============================================================================

interface CartAbandonmentCardProps {
  data: CartAbandonment | null
  isLoading?: boolean
  className?: string
}

export function CartAbandonmentCard({
  data,
  isLoading = false,
  className
}: CartAbandonmentCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Cart Abandonment
          {data && (
            <Badge variant={data.abandonment_rate > 70 ? 'destructive' : data.abandonment_rate > 50 ? 'default' : 'secondary'}>
              {data.abandonment_rate.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Carts</span>
              <span className="font-medium">{data?.total_carts ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Abandoned</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {data?.abandoned_carts ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recovered</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {data?.recovered_carts ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm text-muted-foreground">Recovery Rate</span>
              <span className="font-medium">
                {data?.recovery_rate?.toFixed(1) ?? '0'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Abandoned Value</span>
              <span className="font-medium">
                {formatCurrency(data?.abandoned_value ?? 0)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// METRIC TREND INDICATOR
// ============================================================================

interface MetricTrendProps {
  value: number
  previousValue: number
  format?: 'currency' | 'number' | 'percentage'
  className?: string
}

export function MetricTrend({
  value,
  previousValue,
  format = 'number',
  className
}: MetricTrendProps) {
  const change = previousValue === 0 
    ? (value > 0 ? 100 : 0)
    : ((value - previousValue) / previousValue) * 100
  
  const isPositive = change > 0
  const isNegative = change < 0
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {isPositive ? (
        <TrendingUp className="h-4 w-4 text-green-600" />
      ) : isNegative ? (
        <TrendingDown className="h-4 w-4 text-red-600" />
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      )}
      <span className={cn(
        'text-sm font-medium',
        isPositive && 'text-green-600',
        isNegative && 'text-red-600'
      )}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  type KPICardProps,
  type SalesOverviewCardsProps,
  type RevenueBreakdownCardProps,
  type CustomerInsightsCardProps,
  type CartAbandonmentCardProps,
  type MetricTrendProps
}

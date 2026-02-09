/**
 * Stats Cards Widget
 * 
 * Phase ECOM-01: Dashboard Redesign
 * 
 * Displays key e-commerce metrics in card format
 */
'use client'

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

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
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
  currency = DEFAULT_CURRENCY,
  isLoading = false
}: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
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

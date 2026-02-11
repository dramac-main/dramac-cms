/**
 * CRM Metric Cards Component
 * 
 * PHASE-UI-10A: CRM Module UI Overhaul
 * 
 * Enhanced metric cards showing key CRM stats with sparklines, trends,
 * and click-to-filter functionality.
 */
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from '@/components/charts'
import { cn } from '@/lib/utils'
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import {
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Coins,
  Activity,
  Target,
  type LucideIcon,
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export interface CRMMetric {
  id: string
  label: string
  value: number
  previousValue?: number
  format?: 'number' | 'currency' | 'percent'
  currency?: string
  icon?: LucideIcon
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  sparklineData?: number[]
  onClick?: () => void
}

export interface CRMMetricCardsProps {
  metrics: CRMMetric[]
  loading?: boolean
  className?: string
  columns?: 2 | 3 | 4 | 5 | 6
}

// =============================================================================
// HELPERS
// =============================================================================

function formatValue(value: number, format: CRMMetric['format'] = 'number', currency = DEFAULT_CURRENCY): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
        notation: value >= 1000000 ? 'compact' : 'standard',
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    default:
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`
      }
      return value.toLocaleString()
  }
}

function calculateTrend(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) return { value: 0, direction: 'neutral' }
  const percentChange = ((current - previous) / previous) * 100
  return {
    value: Math.abs(percentChange),
    direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
  }
}

// =============================================================================
// COLOR MAPS
// =============================================================================

const colorMap = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: 'text-primary',
  },
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-400',
  },
}

const sparklineColors = {
  primary: '#8884d8',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
}

// =============================================================================
// SINGLE METRIC CARD
// =============================================================================

interface MetricCardProps {
  metric: CRMMetric
  index: number
}

function MetricCard({ metric, index }: MetricCardProps) {
  const color = metric.color || 'primary'
  const colors = colorMap[color]
  const Icon = metric.icon || Activity

  const trend = useMemo(() => {
    if (metric.previousValue === undefined) return null
    return calculateTrend(metric.value, metric.previousValue)
  }, [metric.value, metric.previousValue])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className={cn(
          "overflow-hidden transition-all hover:shadow-md",
          metric.onClick && "cursor-pointer hover:border-primary/50"
        )}
        onClick={metric.onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {/* Icon and Label */}
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", colors.bg)}>
                <Icon className={cn("h-4 w-4", colors.icon)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold">
                    {formatValue(metric.value, metric.format, metric.currency)}
                  </span>
                  {trend && trend.direction !== 'neutral' && (
                    <span className={cn(
                      "flex items-center text-xs font-medium",
                      trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {trend.direction === 'up' ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      )}
                      {trend.value.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sparkline */}
            {metric.sparklineData && metric.sparklineData.length > 0 && (
              <div className="w-20 h-10">
                <Sparkline
                  data={metric.sparklineData}
                  color={sparklineColors[color]}
                  height={40}
                  type="area"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            <div>
              <div className="w-16 h-4 bg-muted animate-pulse rounded" />
              <div className="w-24 h-7 bg-muted animate-pulse rounded mt-1" />
            </div>
          </div>
          <div className="w-20 h-10 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CRMMetricCards({
  metrics,
  loading = false,
  className,
  columns = 5,
}: CRMMetricCardsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }

  if (loading) {
    return (
      <div className={cn("grid gap-4", gridCols[columns], className)}>
        {Array.from({ length: columns }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {metrics.map((metric, index) => (
        <MetricCard key={metric.id} metric={metric} index={index} />
      ))}
    </div>
  )
}

// =============================================================================
// PRESET METRICS (for easy use)
// =============================================================================

export interface CRMMetricsData {
  contactsCount: number
  previousContactsCount?: number
  companiesCount: number
  previousCompaniesCount?: number
  openDealsCount: number
  previousOpenDealsCount?: number
  pipelineValue: number
  previousPipelineValue?: number
  activitiesCount: number
  previousActivitiesCount?: number
  wonDealsCount?: number
  lostDealsCount?: number
  conversionRate?: number
  averageDealSize?: number
}

export function useCRMMetrics(data: CRMMetricsData): CRMMetric[] {
  return useMemo(() => [
    {
      id: 'contacts',
      label: 'Contacts',
      value: data.contactsCount,
      previousValue: data.previousContactsCount,
      icon: Users,
      color: 'info',
    },
    {
      id: 'companies',
      label: 'Companies',
      value: data.companiesCount,
      previousValue: data.previousCompaniesCount,
      icon: Building2,
      color: 'primary',
    },
    {
      id: 'open-deals',
      label: 'Open Deals',
      value: data.openDealsCount,
      previousValue: data.previousOpenDealsCount,
      icon: Target,
      color: 'warning',
    },
    {
      id: 'pipeline-value',
      label: 'Pipeline Value',
      value: data.pipelineValue,
      previousValue: data.previousPipelineValue,
      format: 'currency',
      icon: Coins,
      color: 'success',
    },
    {
      id: 'activities',
      label: 'Activities',
      value: data.activitiesCount,
      previousValue: data.previousActivitiesCount,
      icon: Activity,
      color: 'info',
    },
  ], [data])
}

export default CRMMetricCards

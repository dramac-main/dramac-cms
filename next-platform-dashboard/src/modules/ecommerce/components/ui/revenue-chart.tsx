"use client"

/**
 * E-Commerce Revenue Chart Component
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * SVG-based revenue visualization with time range selection
 */

import * as React from "react"
import { motion } from "framer-motion"
import { 
  TrendingUp,
  TrendingDown,
  Coins,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useCurrency } from '../../context/ecommerce-context'
// =============================================================================
// TYPES
// =============================================================================

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
  label?: string
}

export interface RevenueChartProps {
  /** Chart data points */
  data: RevenueDataPoint[]
  /** Chart title */
  title?: string
  /** Currency code */
  currency?: string
  /** Selected time range */
  timeRange?: '7d' | '30d' | '90d' | 'all'
  /** Time range change handler */
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | 'all') => void
  /** Show time range selector */
  showTimeRangeSelector?: boolean
  /** Loading state */
  loading?: boolean
  /** Chart height */
  height?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// SKELETON
// =============================================================================

function RevenueChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-12" />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// CHART BAR
// =============================================================================

interface ChartBarProps {
  x: number
  y: number
  width: number
  height: number
  value: number
  label: string
  maxHeight: number
  index: number
  total: number
  isHighlighted?: boolean
  onHover?: (data: { value: number; label: string } | null) => void
}

function ChartBar({
  x,
  y,
  width,
  height,
  value,
  label,
  maxHeight,
  index,
  total,
  isHighlighted,
  onHover,
}: ChartBarProps) {
  const { formatPrice } = useCurrency()
  const [showTooltip, setShowTooltip] = React.useState(false)

  return (
    <g
      onMouseEnter={() => {
        setShowTooltip(true)
        onHover?.({ value, label })
      }}
      onMouseLeave={() => {
        setShowTooltip(false)
        onHover?.(null)
      }}
      className="cursor-pointer"
    >
      {/* Bar background (hover area) */}
      <rect
        x={x}
        y={0}
        width={width}
        height={maxHeight}
        fill="transparent"
      />
      
      {/* Actual bar */}
      <motion.rect
        x={x}
        y={y}
        width={width}
        rx={4}
        ry={4}
        className={cn(
          "transition-colors",
          isHighlighted 
            ? "fill-primary" 
            : showTooltip 
              ? "fill-primary/80"
              : "fill-primary/60"
        )}
        initial={{ height: 0, y: maxHeight }}
        animate={{ height, y }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.03,
          ease: "easeOut"
        }}
      />

      {/* Tooltip */}
      {showTooltip && (
        <g>
          <rect
            x={x + width / 2 - 50}
            y={y - 50}
            width={100}
            height={40}
            rx={6}
            className="fill-popover stroke-border"
          />
          <text
            x={x + width / 2}
            y={y - 35}
            textAnchor="middle"
            className="text-xs fill-foreground font-medium"
          >
            {formatPrice(value)}
          </text>
          <text
            x={x + width / 2}
            y={y - 20}
            textAnchor="middle"
            className="text-[10px] fill-muted-foreground"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RevenueChart({
  data,
  title = "Revenue",
  timeRange = "30d",
  onTimeRangeChange,
  showTimeRangeSelector = true,
  loading = false,
  height = 300,
  className,
}: RevenueChartProps) {
  const { formatPrice, currencySymbol } = useCurrency()
  const [hoveredData, setHoveredData] = React.useState<{ value: number; label: string } | null>(null)

  // Compact currency formatter for chart axis labels
  const formatCompactCurrency = (value: number): string => {
    const displayValue = value / 100
    if (displayValue >= 1000000) {
      return `${currencySymbol}${(displayValue / 1000000).toFixed(1)}M`
    }
    if (displayValue >= 1000) {
      return `${currencySymbol}${(displayValue / 1000).toFixed(1)}K`
    }
    return formatPrice(value)
  }

  if (loading) {
    return <RevenueChartSkeleton height={height} />
  }

  // Calculate statistics
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0
  const peakRevenue = Math.max(...data.map(d => d.revenue), 0)
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)
  
  // Calculate change (compare first half to second half)
  const midpoint = Math.floor(data.length / 2)
  const firstHalfTotal = data.slice(0, midpoint).reduce((sum, d) => sum + d.revenue, 0)
  const secondHalfTotal = data.slice(midpoint).reduce((sum, d) => sum + d.revenue, 0)
  const changePercent = firstHalfTotal > 0 
    ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100 
    : 0

  // Chart dimensions
  const chartWidth = 800
  const chartHeight = height - 60
  const padding = { top: 20, right: 20, bottom: 40, left: 60 }
  const innerWidth = chartWidth - padding.left - padding.right
  const innerHeight = chartHeight - padding.top - padding.bottom

  // Calculate scales
  const maxValue = Math.max(...data.map(d => d.revenue), 1)
  const barWidth = data.length > 0 ? Math.max((innerWidth / data.length) - 4, 8) : 20
  const barGap = 4

  // Generate Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    value: t * maxValue,
    y: padding.top + innerHeight * (1 - t),
  }))

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          
          {showTimeRangeSelector && onTimeRangeChange && (
            <div className="flex gap-1">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onTimeRangeChange(range)}
                >
                  {range === 'all' ? 'All' : range}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats Summary */}
        <div className="flex flex-wrap gap-8 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatPrice(totalRevenue)}
              </span>
              {changePercent !== 0 && (
                <span className={cn(
                  "flex items-center text-sm font-medium",
                  changePercent > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {changePercent > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-0.5" />
                  )}
                  {Math.abs(changePercent).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Avg. Daily</p>
            <p className="text-xl font-semibold">
              {formatPrice(avgRevenue)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Peak Day</p>
            <p className="text-xl font-semibold">
              {formatPrice(peakRevenue)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-xl font-semibold">
              {totalOrders.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          <div className="relative">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y Axis */}
              <g>
                {yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={tick.y}
                      x2={chartWidth - padding.right}
                      y2={tick.y}
                      className="stroke-border"
                      strokeDasharray={i === 0 ? "0" : "4,4"}
                    />
                    <text
                      x={padding.left - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-muted-foreground"
                    >
                      {formatCompactCurrency(tick.value)}
                    </text>
                  </g>
                ))}
              </g>

              {/* Bars */}
              <g transform={`translate(${padding.left}, 0)`}>
                {data.map((d, i) => {
                  const barHeight = (d.revenue / maxValue) * innerHeight
                  const x = i * (barWidth + barGap)
                  const y = padding.top + innerHeight - barHeight
                  
                  return (
                    <ChartBar
                      key={d.date}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      value={d.revenue}
                      label={d.label || d.date}
                      maxHeight={innerHeight}
                      index={i}
                      total={data.length}
                      isHighlighted={hoveredData?.label === (d.label || d.date)}
                      onHover={setHoveredData}
                    />
                  )
                })}
              </g>

              {/* X Axis Labels (show subset) */}
              <g transform={`translate(${padding.left}, ${padding.top + innerHeight + 10})`}>
                {data
                  .filter((_, i) => {
                    const step = Math.ceil(data.length / 7)
                    return i % step === 0 || i === data.length - 1
                  })
                  .map((d, i, arr) => {
                    const originalIndex = data.findIndex(item => item.date === d.date)
                    const x = originalIndex * (barWidth + barGap) + barWidth / 2
                    
                    return (
                      <text
                        key={d.date}
                        x={x}
                        y={15}
                        textAnchor="middle"
                        className="text-[10px] fill-muted-foreground"
                      >
                        {d.label || new Date(d.date).toLocaleDateString(DEFAULT_LOCALE, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </text>
                    )
                  })}
              </g>
            </svg>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2 opacity-50" />
            <p>No revenue data for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

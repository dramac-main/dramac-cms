"use client"

/**
 * E-Commerce Metric Card Component
 * 
 * PHASE-UI-14: E-Commerce Module UI Enhancement
 * Animated metric cards with trend indicators and optional sparklines
 */

import * as React from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  Coins,
  ShoppingCart,
  Package,
  Percent,
  Users,
  AlertTriangle,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// =============================================================================
// TYPES
// =============================================================================

export interface EcommerceMetricCardProps {
  /** Metric title */
  title: string
  /** Current metric value (number for animation, string for static) */
  value: string | number
  /** Change from previous period */
  change?: { 
    value: number
    trend: 'up' | 'down' | 'neutral'
    period?: string
  }
  /** Sparkline data points for mini chart */
  sparklineData?: number[]
  /** Icon to display */
  icon?: LucideIcon
  /** Description tooltip */
  description?: string
  /** Loading state */
  loading?: boolean
  /** Additional class names */
  className?: string
  /** Value prefix (e.g., "$") */
  valuePrefix?: string
  /** Value suffix (e.g., "%", "K") */
  valueSuffix?: string
  /** Color variant */
  variant?: 'default' | 'revenue' | 'orders' | 'inventory' | 'conversion' | 'customers' | 'warning'
  /** Animation delay for stagger effect */
  animationDelay?: number
  /** Format as currency */
  isCurrency?: boolean
  /** Currency code */
  currency?: string
}

// =============================================================================
// COLOR CONFIG
// =============================================================================

const variantConfig = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    sparkline: "#3b82f6",
  },
  revenue: {
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    sparkline: "#22c55e",
  },
  orders: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    sparkline: "#3b82f6",
  },
  inventory: {
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    sparkline: "#a855f7",
  },
  conversion: {
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    sparkline: "#f97316",
  },
  customers: {
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    sparkline: "#06b6d4",
  },
  warning: {
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    sparkline: "#eab308",
  },
}

// =============================================================================
// ANIMATED NUMBER
// =============================================================================

function AnimatedNumber({ 
  value, 
  isCurrency = false,
  currency = DEFAULT_CURRENCY
}: { 
  value: number
  isCurrency?: boolean
  currency?: string
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (v) => {
    if (isCurrency) {
      return new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(v))
    }
    return Math.round(v).toLocaleString()
  })

  React.useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

// =============================================================================
// SPARKLINE
// =============================================================================

function Sparkline({ 
  data, 
  color, 
  width = 80, 
  height = 24 
}: { 
  data: number[]
  color: string
  width?: number
  height?: number
}) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <motion.path
        d={`M0,${height} L${points} L${width},${height} Z`}
        fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {/* End dot */}
      <motion.circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={2}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, duration: 0.2 }}
      />
    </svg>
  )
}

// =============================================================================
// TREND BADGE
// =============================================================================

function TrendBadge({ 
  value, 
  trend, 
  period 
}: { 
  value: number
  trend: 'up' | 'down' | 'neutral'
  period?: string
}) {
  const config = {
    up: {
      icon: TrendingUp,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-700 dark:text-green-400",
    },
    down: {
      icon: TrendingDown,
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-700 dark:text-red-400",
    },
    neutral: {
      icon: Minus,
      bgColor: "bg-gray-100 dark:bg-gray-800",
      textColor: "text-gray-600 dark:text-gray-400",
    },
  }

  const { icon: Icon, bgColor, textColor } = config[trend]

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      bgColor,
      textColor
    )}>
      <Icon className="h-3 w-3" />
      <span>{trend === 'up' ? '+' : ''}{value}%</span>
      {period && (
        <span className="text-muted-foreground ml-1">{period}</span>
      )}
    </div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EcommerceMetricCard({
  title,
  value,
  change,
  sparklineData,
  icon,
  description,
  loading = false,
  className,
  valuePrefix = "",
  valueSuffix = "",
  variant = "default",
  animationDelay = 0,
  isCurrency = false,
  currency = DEFAULT_CURRENCY,
}: EcommerceMetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton />
  }

  const config = variantConfig[variant]
  const Icon = icon || Coins
  const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]+/g, ''))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
    >
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              {/* Title with tooltip */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-muted-foreground">
                  {title}
                </span>
                {description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">{description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Value */}
              <div className="text-3xl font-bold tracking-tight">
                {valuePrefix}
                {typeof value === 'number' ? (
                  <AnimatedNumber 
                    value={numericValue} 
                    isCurrency={isCurrency}
                    currency={currency}
                  />
                ) : (
                  value
                )}
                {valueSuffix}
              </div>

              {/* Trend badge */}
              {change && (
                <TrendBadge 
                  value={change.value} 
                  trend={change.trend} 
                  period={change.period}
                />
              )}
            </div>

            {/* Icon and Sparkline */}
            <div className="flex flex-col items-end gap-2">
              <div className={cn(
                "flex items-center justify-center h-12 w-12 rounded-full",
                config.iconBg
              )}>
                <Icon className={cn("h-6 w-6", config.iconColor)} />
              </div>
              {sparklineData && sparklineData.length > 1 && (
                <Sparkline 
                  data={sparklineData} 
                  color={config.sparkline} 
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// PRESET METRIC CARDS
// =============================================================================

export function RevenueMetricCard(props: Omit<EcommerceMetricCardProps, 'variant' | 'icon'>) {
  return (
    <EcommerceMetricCard
      {...props}
      variant="revenue"
      icon={Coins}
      isCurrency={true}
    />
  )
}

export function OrdersMetricCard(props: Omit<EcommerceMetricCardProps, 'variant' | 'icon'>) {
  return (
    <EcommerceMetricCard
      {...props}
      variant="orders"
      icon={ShoppingCart}
    />
  )
}

export function InventoryMetricCard(props: Omit<EcommerceMetricCardProps, 'variant' | 'icon'>) {
  return (
    <EcommerceMetricCard
      {...props}
      variant="inventory"
      icon={Package}
    />
  )
}

export function ConversionMetricCard(props: Omit<EcommerceMetricCardProps, 'variant' | 'icon'>) {
  return (
    <EcommerceMetricCard
      {...props}
      variant="conversion"
      icon={Percent}
      valueSuffix="%"
    />
  )
}

export function CustomersMetricCard(props: Omit<EcommerceMetricCardProps, 'variant' | 'icon'>) {
  return (
    <EcommerceMetricCard
      {...props}
      variant="customers"
      icon={Users}
    />
  )
}

export function LowStockMetricCard(props: Omit<EcommerceMetricCardProps, 'variant' | 'icon'>) {
  return (
    <EcommerceMetricCard
      {...props}
      variant="warning"
      icon={AlertTriangle}
    />
  )
}

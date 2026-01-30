"use client"

/**
 * Agent Metric Card Component
 * 
 * PHASE-UI-13A: AI Agents Dashboard UI Enhancement
 * Animated metric cards with trend indicators and optional sparklines
 */

import * as React from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// =============================================================================
// TYPES
// =============================================================================

export interface AgentMetricCardProps {
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
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  /** Animation delay for stagger effect */
  animationDelay?: number
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
  success: {
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    sparkline: "#22c55e",
  },
  warning: {
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    sparkline: "#eab308",
  },
  error: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    sparkline: "#ef4444",
  },
  info: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    sparkline: "#3b82f6",
  },
}

// =============================================================================
// ANIMATED NUMBER
// =============================================================================

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

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
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(" ")

  const fillPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.polygon
        fill={`url(#gradient-${color})`}
        points={fillPoints}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
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
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const colorClass = trend === 'up' 
    ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
    : trend === 'down' 
    ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    : 'text-muted-foreground bg-muted'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              colorClass
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Icon className="h-3 w-3" />
            {Math.abs(value).toFixed(1)}%
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{period || 'vs previous period'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentMetricCard({
  title,
  value,
  change,
  sparklineData,
  icon: Icon,
  description,
  loading = false,
  className,
  valuePrefix = '',
  valueSuffix = '',
  variant = 'default',
  animationDelay = 0,
}: AgentMetricCardProps) {
  const config = variantConfig[variant]

  if (loading) {
    return <MetricCardSkeleton className={className} />
  }

  const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''))
  const isNumeric = !isNaN(numericValue) && typeof value === 'number'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {/* Title with optional description */}
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">
                  {valuePrefix}
                  {isNumeric ? <AnimatedNumber value={numericValue} /> : value}
                  {valueSuffix}
                </span>
              </div>

              {/* Change indicator and sparkline */}
              <div className="flex items-center gap-4">
                {change && (
                  <TrendBadge 
                    value={change.value} 
                    trend={change.trend}
                    period={change.period}
                  />
                )}
                {sparklineData && sparklineData.length > 1 && (
                  <Sparkline 
                    data={sparklineData} 
                    color={config.sparkline}
                  />
                )}
              </div>
            </div>

            {/* Icon */}
            {Icon && (
              <motion.div
                className={cn(
                  "p-2.5 rounded-lg",
                  config.iconBg
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: animationDelay + 0.1, type: "spring" }}
              >
                <Icon className={cn("h-5 w-5", config.iconColor)} />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// PRESET VARIANTS
// =============================================================================

export function ExecutionsMetricCard(props: Omit<AgentMetricCardProps, 'title' | 'variant'> & { title?: string }) {
  return (
    <AgentMetricCard
      title="Total Executions"
      variant="default"
      {...props}
    />
  )
}

export function SuccessRateMetricCard(props: Omit<AgentMetricCardProps, 'title' | 'variant' | 'valueSuffix'> & { title?: string }) {
  return (
    <AgentMetricCard
      title="Success Rate"
      variant="success"
      valueSuffix="%"
      {...props}
    />
  )
}

export function TokensUsedMetricCard(props: Omit<AgentMetricCardProps, 'title' | 'variant'> & { title?: string }) {
  return (
    <AgentMetricCard
      title="Tokens Used"
      variant="info"
      {...props}
    />
  )
}

export function CostMetricCard(props: Omit<AgentMetricCardProps, 'title' | 'variant' | 'valuePrefix'> & { title?: string }) {
  return (
    <AgentMetricCard
      title="Total Cost"
      variant="warning"
      valuePrefix="$"
      {...props}
    />
  )
}

export function ActiveAgentsMetricCard(props: Omit<AgentMetricCardProps, 'title' | 'variant'> & { title?: string }) {
  return (
    <AgentMetricCard
      title="Active Agents"
      variant="success"
      {...props}
    />
  )
}

export function FailedExecutionsMetricCard(props: Omit<AgentMetricCardProps, 'title' | 'variant'> & { title?: string }) {
  return (
    <AgentMetricCard
      title="Failed Executions"
      variant="error"
      {...props}
    />
  )
}

export default AgentMetricCard

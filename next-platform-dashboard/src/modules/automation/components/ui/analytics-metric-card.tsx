"use client"

import * as React from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info
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

interface AnalyticsMetricCardProps {
  title: string
  value: string | number
  change?: { 
    value: number
    trend: 'up' | 'down' | 'neutral'
    period?: string
  }
  sparklineData?: number[]
  icon?: React.ReactNode
  description?: string
  loading?: boolean
  className?: string
  valuePrefix?: string
  valueSuffix?: string
  color?: 'default' | 'success' | 'warning' | 'error'
}

const colorConfig = {
  default: {
    text: "text-foreground",
    sparkline: "#3b82f6",
    trendUp: "text-green-600",
    trendDown: "text-red-600"
  },
  success: {
    text: "text-green-600",
    sparkline: "#22c55e",
    trendUp: "text-green-600",
    trendDown: "text-red-600"
  },
  warning: {
    text: "text-yellow-600",
    sparkline: "#eab308",
    trendUp: "text-green-600",
    trendDown: "text-red-600"
  },
  error: {
    text: "text-red-600",
    sparkline: "#ef4444",
    trendUp: "text-green-600", // Up is still good (less errors)
    trendDown: "text-red-600"
  }
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

  React.useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

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

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Fill area */}
      <motion.path
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        d={`M0,${height} L${points} L${width},${height} Z`}
        fill={color}
      />
      {/* Line */}
      <motion.polyline
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point */}
      <motion.circle
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="3"
        fill={color}
      />
    </svg>
  )
}

export function AnalyticsMetricCard({
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
  color = 'default'
}: AnalyticsMetricCardProps) {
  const config = colorConfig[color]

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    )
  }

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("overflow-hidden group hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="text-muted-foreground">
                  {icon}
                </div>
              )}
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="text-xs">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {sparklineData && sparklineData.length > 1 && (
              <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                <Sparkline data={sparklineData} color={config.sparkline} />
              </div>
            )}
          </div>

          {/* Value */}
          <div className="flex items-end gap-2">
            <div className={cn("text-3xl font-bold tracking-tight", config.text)}>
              {valuePrefix}
              {typeof value === 'number' ? (
                <AnimatedNumber value={numericValue} />
              ) : (
                value
              )}
              {valueSuffix}
            </div>
          </div>

          {/* Change indicator */}
          {change && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 mt-2"
            >
              {change.trend === 'up' && (
                <TrendingUp className={cn("w-4 h-4", config.trendUp)} />
              )}
              {change.trend === 'down' && (
                <TrendingDown className={cn("w-4 h-4", config.trendDown)} />
              )}
              {change.trend === 'neutral' && (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={cn(
                "text-sm font-medium",
                change.trend === 'up' && config.trendUp,
                change.trend === 'down' && config.trendDown,
                change.trend === 'neutral' && "text-muted-foreground"
              )}>
                {change.value > 0 && '+'}
                {change.value}%
              </span>
              {change.period && (
                <span className="text-xs text-muted-foreground">
                  vs {change.period}
                </span>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Preset variants for common metrics
export function ExecutionsMetricCard(props: Omit<AnalyticsMetricCardProps, 'title' | 'description'>) {
  return (
    <AnalyticsMetricCard
      title="Total Executions"
      description="Number of workflow executions in the selected period"
      {...props}
    />
  )
}

export function SuccessRateMetricCard(props: Omit<AnalyticsMetricCardProps, 'title' | 'description' | 'valueSuffix' | 'color'> & { value: number }) {
  return (
    <AnalyticsMetricCard
      title="Success Rate"
      description="Percentage of executions completed successfully"
      valueSuffix="%"
      color={props.value >= 90 ? 'success' : props.value >= 70 ? 'warning' : 'error'}
      {...props}
    />
  )
}

export function AvgDurationMetricCard(props: Omit<AnalyticsMetricCardProps, 'title' | 'description'>) {
  return (
    <AnalyticsMetricCard
      title="Avg Duration"
      description="Average execution duration"
      {...props}
    />
  )
}

export function ActiveWorkflowsMetricCard(props: Omit<AnalyticsMetricCardProps, 'title' | 'description'>) {
  return (
    <AnalyticsMetricCard
      title="Active Workflows"
      description="Number of workflows currently enabled"
      {...props}
    />
  )
}

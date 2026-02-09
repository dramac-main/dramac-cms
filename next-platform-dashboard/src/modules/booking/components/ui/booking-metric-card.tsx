"use client"

/**
 * Booking Metric Card
 * 
 * PHASE-UI-15: Booking Module UI Enhancement
 * Animated metric cards for booking statistics
 */

import * as React from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  UserCheck,
  AlertTriangle,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// =============================================================================
// TYPES
// =============================================================================

export type BookingMetricVariant = 
  | 'appointments' 
  | 'revenue' 
  | 'utilization' 
  | 'customers'
  | 'services'
  | 'staff'
  | 'pending'
  | 'warning'

export interface BookingMetricChange {
  value: number
  trend: 'up' | 'down' | 'neutral'
  period?: string
}

export interface BookingMetricCardProps {
  /** Card title */
  title: string
  /** Main value to display */
  value: number | string
  /** Optional value suffix (%, etc.) */
  valueSuffix?: string
  /** Visual variant */
  variant?: BookingMetricVariant
  /** Icon override */
  icon?: LucideIcon
  /** Whether value is currency */
  isCurrency?: boolean
  /** Currency code */
  currency?: string
  /** Change from previous period */
  change?: BookingMetricChange
  /** Sparkline data points */
  sparklineData?: number[]
  /** Loading state */
  isLoading?: boolean
  /** Animation delay for staggered appearance */
  animationDelay?: number
  /** Additional class names */
  className?: string
  /** Click handler */
  onClick?: () => void
}

// =============================================================================
// VARIANT CONFIG
// =============================================================================

const variantConfig: Record<BookingMetricVariant, { 
  icon: LucideIcon
  color: string
  bgColor: string
  gradient: string
}> = {
  appointments: {
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    gradient: 'from-blue-500 to-blue-600',
  },
  revenue: {
    icon: DollarSign,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950',
    gradient: 'from-green-500 to-green-600',
  },
  utilization: {
    icon: BarChart3,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
    gradient: 'from-purple-500 to-purple-600',
  },
  customers: {
    icon: Users,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-950',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  services: {
    icon: Clock,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  staff: {
    icon: UserCheck,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-950',
    gradient: 'from-teal-500 to-teal-600',
  },
  pending: {
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
    gradient: 'from-amber-500 to-amber-600',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950',
    gradient: 'from-red-500 to-red-600',
  },
}

// =============================================================================
// ANIMATED NUMBER
// =============================================================================

function AnimatedNumber({ 
  value, 
  isCurrency = false,
  currency = DEFAULT_CURRENCY,
  suffix = '',
}: { 
  value: number
  isCurrency?: boolean
  currency?: string
  suffix?: string
}) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) => {
    if (isCurrency) {
      return new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.floor(current))
    }
    return Math.floor(current).toLocaleString() + suffix
  })

  React.useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return <motion.span>{display}</motion.span>
}

// =============================================================================
// SPARKLINE
// =============================================================================

function Sparkline({ 
  data, 
  color = 'currentColor',
  height = 32,
  width = 80,
}: { 
  data: number[]
  color?: string
  height?: number
  width?: number
}) {
  if (!data.length) return null
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `0,${height} ${points} ${width},${height}`
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon
        points={areaPoints}
        fill="url(#sparklineGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BookingMetricCard({
  title,
  value,
  valueSuffix = '',
  variant = 'appointments',
  icon: IconOverride,
  isCurrency = false,
  currency = DEFAULT_CURRENCY,
  change,
  sparklineData,
  isLoading = false,
  animationDelay = 0,
  className,
  onClick,
}: BookingMetricCardProps) {
  const config = variantConfig[variant]
  const Icon = IconOverride || config.icon

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
    >
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-md",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight">
                  {typeof value === 'string' ? (
                    value + valueSuffix
                  ) : (
                    <AnimatedNumber 
                      value={numericValue} 
                      isCurrency={isCurrency}
                      currency={currency}
                      suffix={valueSuffix}
                    />
                  )}
                </span>
              </div>
              
              {change && (
                <div className="flex items-center gap-1 mt-2">
                  {change.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : change.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  ) : null}
                  <span className={cn(
                    "text-xs font-medium",
                    change.trend === 'up' && "text-green-600",
                    change.trend === 'down' && "text-red-600",
                    change.trend === 'neutral' && "text-muted-foreground"
                  )}>
                    {change.trend === 'up' ? '+' : ''}{change.value}%
                  </span>
                  {change.period && (
                    <span className="text-xs text-muted-foreground">
                      {change.period}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className={cn(
                "p-2 rounded-xl",
                config.bgColor
              )}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              
              {sparklineData && sparklineData.length > 0 && (
                <Sparkline 
                  data={sparklineData} 
                  color={config.color.includes('green') ? '#16a34a' : 
                         config.color.includes('blue') ? '#2563eb' :
                         config.color.includes('purple') ? '#9333ea' :
                         config.color.includes('amber') ? '#d97706' :
                         '#6366f1'
                  }
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
// PRESET COMPONENTS
// =============================================================================

export function AppointmentsMetricCard(props: Omit<BookingMetricCardProps, 'variant' | 'icon'>) {
  return <BookingMetricCard {...props} variant="appointments" icon={Calendar} />
}

export function BookingRevenueMetricCard(props: Omit<BookingMetricCardProps, 'variant' | 'icon' | 'isCurrency'>) {
  return <BookingMetricCard {...props} variant="revenue" icon={DollarSign} isCurrency />
}

export function UtilizationMetricCard(props: Omit<BookingMetricCardProps, 'variant' | 'icon'>) {
  return <BookingMetricCard {...props} variant="utilization" icon={BarChart3} valueSuffix="%" />
}

export function CustomersMetricCard(props: Omit<BookingMetricCardProps, 'variant' | 'icon'>) {
  return <BookingMetricCard {...props} variant="customers" icon={Users} />
}

export function ServicesMetricCard(props: Omit<BookingMetricCardProps, 'variant' | 'icon'>) {
  return <BookingMetricCard {...props} variant="services" icon={Clock} />
}

export function PendingMetricCard(props: Omit<BookingMetricCardProps, 'variant' | 'icon'>) {
  return <BookingMetricCard {...props} variant="pending" icon={Clock} />
}

// =============================================================================
// SKELETON
// =============================================================================

export function BookingMetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

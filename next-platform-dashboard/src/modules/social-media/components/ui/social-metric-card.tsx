'use client'

/**
 * Social Metric Card Component
 * 
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * Specialized metric cards for social media analytics with platform-aware styling
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowRight,
  LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkline } from '@/components/charts'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface SocialMetricCardProps {
  /** Metric title */
  title: string
  /** Current metric value */
  value: string | number
  /** Formatted display value (e.g., "12.5K") */
  displayValue?: string
  /** Change percentage from previous period */
  change?: number
  /** Comparison label (e.g., "vs last week") */
  comparisonLabel?: string
  /** Icon to display */
  icon?: LucideIcon
  /** Custom icon color */
  iconColor?: string
  /** Background color for icon container */
  iconBgColor?: string
  /** Sparkline data points */
  sparklineData?: number[]
  /** Sparkline color */
  sparklineColor?: string
  /** Click handler for view more action */
  onViewMore?: () => void
  /** View more button label */
  viewMoreLabel?: string
  /** Loading state */
  isLoading?: boolean
  /** Platform for color theming */
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest'
  /** Additional class names */
  className?: string
  /** Animation delay for stagger effect */
  animationDelay?: number
}

// =============================================================================
// PLATFORM COLORS
// =============================================================================

const PLATFORM_COLORS: Record<string, { primary: string; light: string; dark: string }> = {
  facebook: { primary: '#1877F2', light: '#E7F3FF', dark: 'rgba(24, 119, 242, 0.2)' },
  instagram: { primary: '#E4405F', light: '#FFE7EC', dark: 'rgba(228, 64, 95, 0.2)' },
  twitter: { primary: '#1DA1F2', light: '#E8F6FF', dark: 'rgba(29, 161, 242, 0.2)' },
  linkedin: { primary: '#0A66C2', light: '#E7F1FA', dark: 'rgba(10, 102, 194, 0.2)' },
  tiktok: { primary: '#000000', light: '#F5F5F5', dark: 'rgba(0, 0, 0, 0.15)' },
  youtube: { primary: '#FF0000', light: '#FFE5E5', dark: 'rgba(255, 0, 0, 0.15)' },
  pinterest: { primary: '#E60023', light: '#FFE5EA', dark: 'rgba(230, 0, 35, 0.15)' },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function getTrendInfo(change?: number) {
  if (change === undefined || change === 0) {
    return { icon: Minus, color: 'text-muted-foreground', bgColor: 'bg-muted' }
  }
  if (change > 0) {
    return { icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' }
  }
  return { icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' }
}

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

function MetricCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SocialMetricCard({
  title,
  value,
  displayValue,
  change,
  comparisonLabel = 'vs last period',
  icon: Icon,
  iconColor,
  iconBgColor,
  sparklineData,
  sparklineColor,
  onViewMore,
  viewMoreLabel = 'View details',
  isLoading,
  platform,
  className,
  animationDelay = 0,
}: SocialMetricCardProps) {
  // Loading state
  if (isLoading) {
    return <MetricCardSkeleton />
  }

  // Get platform colors if specified
  const platformColors = platform ? PLATFORM_COLORS[platform] : undefined
  const effectiveIconColor = iconColor || platformColors?.primary || 'hsl(var(--primary))'
  const effectiveIconBg = iconBgColor || platformColors?.light || 'hsl(var(--primary) / 0.1)'
  const effectiveSparklineColor = sparklineColor || platformColors?.primary || '#8884d8'

  // Get trend info
  const trend = getTrendInfo(change)
  const TrendIcon = trend.icon

  // Formatted display value
  const finalDisplayValue = displayValue || (typeof value === 'number' ? formatNumber(value) : value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <Card className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        'border-l-4',
        className
      )}
      style={{ borderLeftColor: effectiveIconColor }}
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header Row */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold tracking-tight">{finalDisplayValue}</p>
              </div>
              {Icon && (
                <div 
                  className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: effectiveIconBg }}
                >
                  <Icon className="h-6 w-6" style={{ color: effectiveIconColor }} />
                </div>
              )}
            </div>

            {/* Sparkline */}
            {sparklineData && sparklineData.length > 0 && (
              <div className="h-10 w-full">
                <Sparkline 
                  data={sparklineData} 
                  color={effectiveSparklineColor}
                  height={40}
                />
              </div>
            )}

            {/* Trend & Comparison */}
            <div className="flex items-center justify-between">
              {change !== undefined && (
                <div className={cn('flex items-center gap-1.5 text-sm', trend.color)}>
                  <div className={cn('p-1 rounded-full', trend.bgColor)}>
                    <TrendIcon className="h-3 w-3" />
                  </div>
                  <span className="font-medium">
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground font-normal">
                    {comparisonLabel}
                  </span>
                </div>
              )}
              
              {onViewMore && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2"
                  onClick={onViewMore}
                >
                  {viewMoreLabel}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

export interface SocialMetricCardCompactProps {
  title: string
  value: string | number
  change?: number
  icon?: LucideIcon
  platform?: SocialMetricCardProps['platform']
  className?: string
}

export function SocialMetricCardCompact({
  title,
  value,
  change,
  icon: Icon,
  platform,
  className,
}: SocialMetricCardCompactProps) {
  const platformColors = platform ? PLATFORM_COLORS[platform] : undefined
  const effectiveIconColor = platformColors?.primary || 'hsl(var(--primary))'
  const trend = getTrendInfo(change)
  const TrendIcon = trend.icon

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border bg-card',
      className
    )}>
      {Icon && (
        <div 
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: platformColors?.light || 'hsl(var(--muted))' }}
        >
          <Icon className="h-5 w-5" style={{ color: effectiveIconColor }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-lg font-semibold">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
      </div>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs', trend.color)}>
          <TrendIcon className="h-3 w-3" />
          <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}

export default SocialMetricCard

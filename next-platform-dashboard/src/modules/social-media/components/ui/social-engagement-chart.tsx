'use client'

/**
 * Social Engagement Chart Component
 * 
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * Area chart showing engagement trends over time with platform breakdown
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface EngagementDataPoint {
  date: string
  likes: number
  comments: number
  shares: number
  impressions: number
  clicks?: number
}

export interface SocialEngagementChartProps {
  /** Engagement data over time */
  data: EngagementDataPoint[]
  /** Date range selection */
  dateRange?: '7d' | '14d' | '30d' | '90d'
  /** Callback when date range changes */
  onDateRangeChange?: (range: '7d' | '14d' | '30d' | '90d') => void
  /** Total engagement compared to previous period */
  totalEngagement?: number
  /** Percentage change from previous period */
  change?: number
  /** Loading state */
  isLoading?: boolean
  /** Refresh callback */
  onRefresh?: () => void
  /** Show legend */
  showLegend?: boolean
  /** Chart height */
  height?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// CHART COLORS
// =============================================================================

const ENGAGEMENT_COLORS = {
  likes: { stroke: '#E4405F', fill: 'url(#likesGradient)' },
  comments: { stroke: '#1877F2', fill: 'url(#commentsGradient)' },
  shares: { stroke: '#00C49F', fill: 'url(#sharesGradient)' },
  impressions: { stroke: '#8884d8', fill: 'url(#impressionsGradient)' },
  clicks: { stroke: '#ffc658', fill: 'url(#clicksGradient)' },
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground capitalize">
                {entry.dataKey}
              </span>
            </div>
            <span className="text-sm font-medium">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full w-full bg-muted rounded-lg" />
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SocialEngagementChart({
  data,
  dateRange = '7d',
  onDateRangeChange,
  totalEngagement,
  change,
  isLoading,
  onRefresh,
  showLegend = true,
  height = 350,
  className,
}: SocialEngagementChartProps) {
  // Calculate totals
  const totals = useMemo(() => {
    return data.reduce(
      (acc, point) => ({
        likes: acc.likes + point.likes,
        comments: acc.comments + point.comments,
        shares: acc.shares + point.shares,
        impressions: acc.impressions + point.impressions,
        clicks: acc.clicks + (point.clicks || 0),
      }),
      { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 }
    )
  }, [data])

  const totalValue = totalEngagement ?? (totals.likes + totals.comments + totals.shares)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Engagement Overview</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {totalValue.toLocaleString()}
              </span>
              <span>total engagements</span>
              {change !== undefined && (
                <Badge 
                  variant={change >= 0 ? 'default' : 'destructive'}
                  className={cn(
                    'ml-2',
                    change >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''
                  )}
                >
                  {change >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onDateRangeChange && (
              <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as typeof dateRange)}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="14d">Last 14 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <ChartSkeleton height={height} />
          ) : data.length === 0 ? (
            <div 
              className="flex items-center justify-center text-muted-foreground"
              style={{ height }}
            >
              No engagement data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E4405F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E4405F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sharesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C49F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                {showLegend && (
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => <span className="text-sm capitalize">{value}</span>}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="likes"
                  stroke={ENGAGEMENT_COLORS.likes.stroke}
                  fill={ENGAGEMENT_COLORS.likes.fill}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="comments"
                  stroke={ENGAGEMENT_COLORS.comments.stroke}
                  fill={ENGAGEMENT_COLORS.comments.fill}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="shares"
                  stroke={ENGAGEMENT_COLORS.shares.stroke}
                  fill={ENGAGEMENT_COLORS.shares.fill}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Likes</p>
              <p className="text-lg font-semibold" style={{ color: ENGAGEMENT_COLORS.likes.stroke }}>
                {totals.likes.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Comments</p>
              <p className="text-lg font-semibold" style={{ color: ENGAGEMENT_COLORS.comments.stroke }}>
                {totals.comments.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Shares</p>
              <p className="text-lg font-semibold" style={{ color: ENGAGEMENT_COLORS.shares.stroke }}>
                {totals.shares.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Impressions</p>
              <p className="text-lg font-semibold" style={{ color: ENGAGEMENT_COLORS.impressions.stroke }}>
                {totals.impressions.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default SocialEngagementChart

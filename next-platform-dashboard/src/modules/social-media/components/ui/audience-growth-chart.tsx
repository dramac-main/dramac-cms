'use client'

/**
 * Audience Growth Chart Component
 * 
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * Line chart showing follower growth trends over time
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
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
import { TrendingUp, TrendingDown, Users, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialPlatform } from '../../types'

// =============================================================================
// TYPES
// =============================================================================

export interface AudienceDataPoint {
  date: string
  total: number
  facebook?: number
  instagram?: number
  twitter?: number
  linkedin?: number
  tiktok?: number
  youtube?: number
  pinterest?: number
}

export interface AudienceGrowthChartProps {
  /** Audience data over time */
  data: AudienceDataPoint[]
  /** Platforms to display */
  platforms?: SocialPlatform[]
  /** Date range selection */
  dateRange?: '7d' | '14d' | '30d' | '90d'
  /** Callback when date range changes */
  onDateRangeChange?: (range: '7d' | '14d' | '30d' | '90d') => void
  /** Current total followers */
  totalFollowers?: number
  /** Follower growth percentage */
  growthRate?: number
  /** New followers in period */
  newFollowers?: number
  /** Loading state */
  isLoading?: boolean
  /** Refresh callback */
  onRefresh?: () => void
  /** Chart height */
  height?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// PLATFORM COLORS
// =============================================================================

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  youtube: '#FF0000',
  pinterest: '#E60023',
  threads: '#000000',
  bluesky: '#0085FF',
  mastodon: '#6364FF',
}

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  threads: 'Threads',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
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
              <span className="text-sm text-muted-foreground">
                {entry.dataKey === 'total' ? 'Total' : PLATFORM_NAMES[entry.dataKey as SocialPlatform] || entry.dataKey}
              </span>
            </div>
            <span className="text-sm font-medium">
              {formatNumber(entry.value)}
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

export function AudienceGrowthChart({
  data,
  platforms,
  dateRange = '30d',
  onDateRangeChange,
  totalFollowers,
  growthRate,
  newFollowers,
  isLoading,
  onRefresh,
  height = 350,
  className,
}: AudienceGrowthChartProps) {
  // Determine which platform lines to show
  const activePlatforms = useMemo(() => {
    if (platforms && platforms.length > 0) return platforms
    
    // Auto-detect from data
    if (data.length === 0) return []
    const firstPoint = data[0]
    return Object.keys(firstPoint).filter(
      key => key !== 'date' && key !== 'total' && firstPoint[key as keyof typeof firstPoint] !== undefined
    ) as SocialPlatform[]
  }, [data, platforms])

  // Calculate total if not provided
  const finalTotalFollowers = totalFollowers ?? (data.length > 0 ? data[data.length - 1].total : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Audience Growth</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-2xl font-bold text-foreground">
                {formatNumber(finalTotalFollowers)}
              </span>
              <span>total followers</span>
              {growthRate !== undefined && (
                <Badge 
                  variant={growthRate >= 0 ? 'default' : 'destructive'}
                  className={cn(
                    'ml-2',
                    growthRate >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''
                  )}
                >
                  {growthRate >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
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
              No audience data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
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
                  tickFormatter={(value) => formatNumber(value)}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                {activePlatforms.length > 1 && (
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm">
                        {value === 'total' ? 'Total' : PLATFORM_NAMES[value as SocialPlatform] || value}
                      </span>
                    )}
                  />
                )}
                
                {/* Total line (always show) */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                />
                
                {/* Platform-specific lines */}
                {activePlatforms.map((platform) => (
                  <Line
                    key={platform}
                    type="monotone"
                    dataKey={platform}
                    stroke={PLATFORM_COLORS[platform]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    strokeDasharray={activePlatforms.length > 3 ? '5 5' : undefined}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {/* Summary Stats */}
          {newFollowers !== undefined && (
            <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">New Followers</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                  +{formatNumber(newFollowers)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg. Daily Growth</p>
                <p className="text-xl font-semibold">
                  +{formatNumber(Math.round(newFollowers / (dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 90)))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Connected Platforms</p>
                <p className="text-xl font-semibold">
                  {activePlatforms.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default AudienceGrowthChart

'use client'

/**
 * Platform Breakdown Component
 * 
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * Donut chart showing performance breakdown by social platform
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialPlatform } from '../../types'

// =============================================================================
// TYPES
// =============================================================================

export interface PlatformDataPoint {
  platform: SocialPlatform
  followers: number
  engagement: number
  posts: number
}

export interface PlatformBreakdownProps {
  /** Data for each platform */
  data: PlatformDataPoint[]
  /** Metric to display (followers, engagement, or posts) */
  metric?: 'followers' | 'engagement' | 'posts'
  /** Loading state */
  isLoading?: boolean
  /** View all callback */
  onViewAll?: () => void
  /** Chart height */
  height?: number
  /** Additional class names */
  className?: string
}

// =============================================================================
// PLATFORM COLORS & CONFIG
// =============================================================================

const PLATFORM_CONFIG: Record<SocialPlatform, { color: string; icon: string; name: string }> = {
  facebook: { color: '#1877F2', icon: 'Fb', name: 'Facebook' },
  instagram: { color: '#E4405F', icon: 'Ig', name: 'Instagram' },
  twitter: { color: '#1DA1F2', icon: 'Tw', name: 'Twitter/X' },
  linkedin: { color: '#0A66C2', icon: 'Li', name: 'LinkedIn' },
  tiktok: { color: '#000000', icon: 'Tt', name: 'TikTok' },
  youtube: { color: '#FF0000', icon: 'Yt', name: 'YouTube' },
  pinterest: { color: '#E60023', icon: 'Pi', name: 'Pinterest' },
  threads: { color: '#000000', icon: 'Th', name: 'Threads' },
  bluesky: { color: '#0085FF', icon: 'Bs', name: 'Bluesky' },
  mastodon: { color: '#6364FF', icon: 'Ms', name: 'Mastodon' },
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
    payload: {
      platform: SocialPlatform
      percentage: number
    }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0]
  const config = PLATFORM_CONFIG[data.payload.platform]

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <span>{config?.icon}</span>
        <span className="font-medium">{config?.name}</span>
      </div>
      <p className="text-2xl font-bold">
        {formatNumber(data.value)}
      </p>
      <p className="text-sm text-muted-foreground">
        {data.payload.percentage.toFixed(1)}% of total
      </p>
    </div>
  )
}

// =============================================================================
// SKELETON
// =============================================================================

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="w-48 h-48 rounded-full bg-muted animate-pulse" />
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PlatformBreakdown({
  data,
  metric = 'followers',
  isLoading,
  onViewAll,
  height = 280,
  className,
}: PlatformBreakdownProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d[metric], 0)
    return data
      .filter(d => d[metric] > 0)
      .map(d => ({
        platform: d.platform,
        value: d[metric],
        percentage: total > 0 ? (d[metric] / total) * 100 : 0,
        color: PLATFORM_CONFIG[d.platform]?.color || '#888888',
      }))
      .sort((a, b) => b.value - a.value)
  }, [data, metric])

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  // Metric label
  const metricLabels = {
    followers: 'Followers',
    engagement: 'Engagements',
    posts: 'Posts',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Platform Breakdown</CardTitle>
            <CardDescription>
              {metricLabels[metric]} distribution by platform
            </CardDescription>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton height={height} />
          ) : chartData.length === 0 ? (
            <div 
              className="flex items-center justify-center text-muted-foreground"
              style={{ height }}
            >
              No platform data available
            </div>
          ) : (
            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="relative" style={{ width: height, height }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="85%"
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-3xl font-bold">{formatNumber(total)}</p>
                  <p className="text-sm text-muted-foreground">{metricLabels[metric]}</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {chartData.slice(0, 5).map((item) => {
                  const config = PLATFORM_CONFIG[item.platform]
                  return (
                    <div key={item.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{config?.icon}</span>
                        <span className="text-sm font-medium">{config?.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {formatNumber(item.value)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
                {chartData.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{chartData.length - 5} more platforms
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default PlatformBreakdown

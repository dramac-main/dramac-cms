'use client'

/**
 * Social Analytics Page Component
 * 
 * Displays analytics overview, platform breakdown, top posts, and best times to post
 */

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MousePointer,
  Calendar,
  BarChart3,
  Clock,
  Download,
  RefreshCw,
  LucideIcon,
} from 'lucide-react'
import { PLATFORM_CONFIGS } from '../types'
import type { SocialAccount } from '../types'

interface SocialAnalyticsPageProps {
  siteId: string
  accounts: SocialAccount[]
  overview: {
    totalFollowers: number
    totalImpressions: number
    totalEngagements: number
    totalClicks: number
    avgEngagementRate: number
    followerGrowth: number
    impressionChange: number
    engagementChange: number
    topPosts: Array<{
      postId: string
      impressions: number
      engagements: number
    }>
    platformBreakdown: Record<string, {
      followers: number
      impressions: number
      engagements: number
    }>
  } | null
  topPosts: Array<{
    postId: string
    content: string
    publishedAt: string
    impressions: number
    engagement: number
    engagementRate: number
  }>
  bestTimes: Array<{
    dayOfWeek: number
    dayName: string
    hour: number
    timeLabel: string
    score: number
  }>
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  suffix = ''
}: { 
  title: string
  value: number | string
  change?: number
  icon: LucideIcon
  suffix?: string
}) {
  const isPositive = change && change >= 0
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        {change !== undefined && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{change}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function SocialAnalyticsPage({
  siteId,
  accounts,
  overview,
  topPosts,
  bestTimes,
}: SocialAnalyticsPageProps) {
  const [dateRange, setDateRange] = useState('7d')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  
  const hasData = overview && accounts.length > 0
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Generate mock data if no real data exists (for demo purposes)
  const mockOverview = overview || {
    totalFollowers: 12543,
    totalImpressions: 89234,
    totalEngagements: 4521,
    totalClicks: 1234,
    avgEngagementRate: 5.07,
    followerGrowth: 2.4,
    impressionChange: 12.5,
    engagementChange: 8.2,
    topPosts: [],
    platformBreakdown: {
      facebook: { followers: 5234, impressions: 34521, engagements: 1823 },
      instagram: { followers: 4321, impressions: 32145, engagements: 1654 },
      twitter: { followers: 2988, impressions: 22568, engagements: 1044 },
    }
  }
  
  const mockTopPosts = topPosts.length > 0 ? topPosts : [
    { postId: '1', content: 'Exciting news! We\'re launching our new product line next week...', publishedAt: new Date().toISOString(), impressions: 8234, engagement: 423, engagementRate: 5.14 },
    { postId: '2', content: 'Behind the scenes look at our team hard at work...', publishedAt: new Date().toISOString(), impressions: 6123, engagement: 312, engagementRate: 5.1 },
    { postId: '3', content: 'Customer spotlight: See how @customer used our product...', publishedAt: new Date().toISOString(), impressions: 5892, engagement: 287, engagementRate: 4.87 },
  ]
  
  const mockBestTimes = bestTimes.length > 0 ? bestTimes : [
    { dayOfWeek: 1, dayName: 'Monday', hour: 10, timeLabel: '10:00', score: 92 },
    { dayOfWeek: 3, dayName: 'Wednesday', hour: 14, timeLabel: '14:00', score: 89 },
    { dayOfWeek: 5, dayName: 'Friday', hour: 9, timeLabel: '09:00', score: 85 },
    { dayOfWeek: 2, dayName: 'Tuesday', hour: 13, timeLabel: '13:00', score: 82 },
    { dayOfWeek: 4, dayName: 'Thursday', hour: 19, timeLabel: '19:00', score: 78 },
  ]
  
  const displayOverview = hasData ? overview : mockOverview
  const displayTopPosts = topPosts.length > 0 ? topPosts : mockTopPosts
  const displayBestTimes = bestTimes.length > 0 ? bestTimes : mockBestTimes
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your social media performance across all platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Demo Notice */}
      {!hasData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> Connect social accounts to see real analytics. 
              The data shown below is sample data for demonstration purposes.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Followers" 
          value={displayOverview?.totalFollowers || 0}
          change={displayOverview?.followerGrowth}
          icon={Users}
        />
        <StatCard 
          title="Total Impressions" 
          value={displayOverview?.totalImpressions || 0}
          change={displayOverview?.impressionChange}
          icon={Eye}
        />
        <StatCard 
          title="Total Engagements" 
          value={displayOverview?.totalEngagements || 0}
          change={displayOverview?.engagementChange}
          icon={Heart}
        />
        <StatCard 
          title="Avg. Engagement Rate" 
          value={displayOverview?.avgEngagementRate?.toFixed(2) || '0'}
          suffix="%"
          icon={BarChart3}
        />
      </div>
      
      {/* Platform Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Breakdown
            </CardTitle>
            <CardDescription>
              Performance by social network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(displayOverview?.platformBreakdown || {}).map(([platform, stats]) => {
                const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]
                const totalImpressions = displayOverview?.totalImpressions || 1
                const percentage = Math.round((stats.impressions / totalImpressions) * 100)
                
                return (
                  <div key={platform} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span style={{ color: config?.color }}>{config?.icon}</span>
                        <span className="font-medium capitalize">{platform}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {stats.impressions.toLocaleString()} impressions
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: config?.color || '#3B82F6'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              
              {Object.keys(displayOverview?.platformBreakdown || {}).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No platform data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Best Times to Post */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Best Times to Post
            </CardTitle>
            <CardDescription>
              Optimal posting times based on engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayBestTimes.slice(0, 5).map((time, index) => (
                <div 
                  key={`${time.dayOfWeek}-${time.hour}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{time.dayName}</p>
                      <p className="text-sm text-muted-foreground">{time.timeLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${time.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10">{time.score}%</span>
                  </div>
                </div>
              ))}
              
              {displayBestTimes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Not enough data to determine optimal times
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Posts
          </CardTitle>
          <CardDescription>
            Your best content from the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayTopPosts.map((post, index) => (
              <div 
                key={post.postId}
                className="flex items-start gap-4 p-4 rounded-lg border"
              >
                <Badge variant={index === 0 ? 'default' : 'outline'} className="mt-1">
                  #{index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Published {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold">{post.impressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{post.engagement.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Engagements</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-600">{post.engagementRate}%</p>
                    <p className="text-xs text-muted-foreground">Eng. Rate</p>
                  </div>
                </div>
              </div>
            ))}
            
            {displayTopPosts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No published posts in this period
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Engagement Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Engagement Heatmap
          </CardTitle>
          <CardDescription>
            When your audience is most active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row */}
              <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 mb-2">
                <div />
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="text-xs text-center text-muted-foreground">
                    {i.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
              
              {/* Days */}
              {dayNames.map((day, dayIndex) => (
                <div key={day} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 mb-1">
                  <div className="text-xs font-medium flex items-center">{day}</div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    // Find matching best time
                    const matchingTime = displayBestTimes.find(
                      t => t.dayOfWeek === dayIndex && t.hour === hour
                    )
                    const score = matchingTime?.score || 0
                    const opacity = score / 100
                    
                    return (
                      <div
                        key={hour}
                        className="aspect-square rounded-sm cursor-pointer transition-all hover:scale-110"
                        style={{ 
                          backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                        }}
                        title={`${day} ${hour}:00 - ${score}% engagement`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
                <div
                  key={opacity}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

/**
 * Social Dashboard Component
 * 
 * Phase EM-54: Social Media Management Module
 * Main dashboard overview like Hootsuite/Sprout Social
 */

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MessageCircle,
  Heart,
  Share2,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { 
  SocialAccount, 
  SocialPost,
  SocialPlatform,
  AnalyticsOverview,
} from '../types'
import { PLATFORM_CONFIGS } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface SocialDashboardProps {
  accounts: SocialAccount[]
  scheduledPosts: SocialPost[]
  recentPosts: SocialPost[]
  analytics: AnalyticsOverview | null
  inboxCount: number
  pendingApprovals: number
  onCreatePost: () => void
  onViewCalendar: () => void
  onViewInbox: () => void
  onViewAnalytics: () => void
  onRefresh: () => void
  isLoading?: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-muted-foreground'
              )}>
                {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SocialDashboard({
  accounts,
  scheduledPosts,
  recentPosts,
  analytics,
  inboxCount,
  pendingApprovals,
  onCreatePost,
  onViewCalendar,
  onViewInbox,
  onViewAnalytics,
  onRefresh,
  isLoading = false,
}: SocialDashboardProps) {
  const [dateRange, setDateRange] = useState('7d')

  // Helper functions
  const getPlatformIcon = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.icon || '📱'
  }

  const getPlatformColor = (platform: SocialPlatform) => {
    return PLATFORM_CONFIGS[platform]?.color || '#6B7280'
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getStatusColor = (status: SocialAccount['status']) => {
    switch (status) {
      case 'active': return 'bg-success-500'
      case 'expired': return 'bg-warning-500'
      case 'error': return 'bg-danger-500'
      default: return 'bg-muted-foreground'
    }
  }

  // Calculate totals
  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followersCount || 0), 0)
  const activeAccounts = accounts.filter(a => a.status === 'active').length
  const upcomingPosts = scheduledPosts.filter(p => p.status === 'scheduled').length

  // Show onboarding if no accounts connected
  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Share2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Social Media Management!</CardTitle>
            <CardDescription className="text-base max-w-xl mx-auto">
              Connect your social accounts to start scheduling posts, tracking analytics, 
              and managing all your social media from one dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
              <div className="text-center p-4 rounded-lg bg-background/50">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-info" />
                <h3 className="font-medium">Schedule Posts</h3>
                <p className="text-sm text-muted-foreground">Plan content weeks in advance</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
                <h3 className="font-medium">Track Analytics</h3>
                <p className="text-sm text-muted-foreground">Monitor growth & engagement</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">Unified Inbox</h3>
                <p className="text-sm text-muted-foreground">Respond to all messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connect Accounts CTA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Connect Your First Account
            </CardTitle>
            <CardDescription>
              Choose a platform to get started. You can connect more accounts later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {[
                { name: 'Facebook', icon: '📘', color: '#1877F2', desc: 'Pages & Groups' },
                { name: 'Instagram', icon: '📷', color: '#E4405F', desc: 'Business & Creator' },
                { name: 'Twitter/X', icon: '🐦', color: '#1DA1F2', desc: 'Posts & Threads' },
                { name: 'LinkedIn', icon: '💼', color: '#0A66C2', desc: 'Profile & Company' },
                { name: 'TikTok', icon: '🎵', color: '#000000', desc: 'Videos & Analytics' },
              ].map((platform) => (
                <Button
                  key={platform.name}
                  variant="outline"
                  className="h-auto flex-col py-4 hover:border-primary/50"
                  onClick={() => {
                    toast.info(`Social media connection for ${platform.name} is coming soon! We're working on OAuth integration for all major platforms.`, {
                      duration: 5000,
                    })
                  }}
                >
                  <span className="text-2xl mb-1">{platform.icon}</span>
                  <span className="font-medium">{platform.name}</span>
                  <span className="text-xs text-muted-foreground">{platform.desc}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              More platforms: YouTube, Pinterest, Threads, Bluesky, Mastodon
            </p>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Connect social accounts</h4>
                  <p className="text-sm text-muted-foreground">
                    Click on a platform above to connect via OAuth. Your credentials are secure and never stored.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">Create your first post</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the post composer to create content for multiple platforms at once.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground">Schedule and publish</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the content calendar to plan posts ahead and publish at optimal times.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your social presence across {accounts.length} connected accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button onClick={onCreatePost}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Followers"
          value={formatNumber(totalFollowers)}
          change={analytics?.followerGrowth}
          icon={<Users className="h-6 w-6 text-primary" />}
          trend={analytics?.followerGrowth ? (analytics.followerGrowth > 0 ? 'up' : 'down') : undefined}
        />
        <StatCard
          title="Impressions"
          value={formatNumber(analytics?.totalImpressions || 0)}
          change={analytics?.impressionChange}
          icon={<Eye className="h-6 w-6 text-primary" />}
          trend={analytics?.impressionChange ? (analytics.impressionChange > 0 ? 'up' : 'down') : undefined}
        />
        <StatCard
          title="Engagements"
          value={formatNumber(analytics?.totalEngagements || 0)}
          change={analytics?.engagementChange}
          icon={<Heart className="h-6 w-6 text-primary" />}
          trend={analytics?.engagementChange ? (analytics.engagementChange > 0 ? 'up' : 'down') : undefined}
        />
        <StatCard
          title="Engagement Rate"
          value={`${(analytics?.avgEngagementRate || 0).toFixed(2)}%`}
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Pending Items */}
        <Card className={cn(inboxCount > 0 && 'border-primary/50')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-info-100 dark:bg-info-900/30 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-info-600 dark:text-info-400" />
                </div>
                <div>
                  <p className="font-medium">Inbox</p>
                  <p className="text-sm text-muted-foreground">
                    {inboxCount} unread message{inboxCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewInbox}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(pendingApprovals > 0 && 'border-warning/50')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                </div>
                <div>
                  <p className="font-medium">Pending Approval</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingApprovals} post{pendingApprovals !== 1 ? 's' : ''} awaiting review
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewCalendar}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Scheduled</p>
                  <p className="text-sm text-muted-foreground">
                    {upcomingPosts} upcoming post{upcomingPosts !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewCalendar}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts & Upcoming Posts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Accounts</CardTitle>
            <CardDescription>
              {activeAccounts} of {accounts.length} accounts active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.slice(0, 5).map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={account.accountAvatar || undefined} />
                        <AvatarFallback style={{ backgroundColor: getPlatformColor(account.platform) }}>
                          {getPlatformIcon(account.platform)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                        getStatusColor(account.status)
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {account.platform}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatNumber(account.followersCount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">followers</p>
                  </div>
                </div>
              ))}
              {accounts.length > 5 && (
                <Button variant="ghost" className="w-full">
                  View all {accounts.length} accounts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Upcoming Posts</CardTitle>
              <CardDescription>
                Next {Math.min(scheduledPosts.length, 5)} scheduled posts
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onViewCalendar}>
              View Calendar
            </Button>
          </CardHeader>
          <CardContent>
            {scheduledPosts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No scheduled posts</p>
                <Button variant="link" onClick={onCreatePost}>
                  Create your first post
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts.slice(0, 5).map(post => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-1">
                          {post.targetAccounts?.slice(0, 3).map((accountId, i) => {
                            const account = accounts.find(a => a.id === accountId)
                            if (!account) return null
                            return (
                              <div
                                key={i}
                                className="h-5 w-5 rounded-full border-2 border-background flex items-center justify-center text-xs"
                                style={{ backgroundColor: getPlatformColor(account.platform) }}
                              >
                                {getPlatformIcon(account.platform)}
                              </div>
                            )
                          })}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.scheduledAt 
                            ? new Date(post.scheduledAt).toLocaleString()
                            : 'Not scheduled'
                          }
                        </span>
                      </div>
                    </div>
                    {post.media && post.media.length > 0 && post.media[0].thumbnailUrl && (
                      <img
                        src={post.media[0].thumbnailUrl}
                        alt=""
                        className="h-16 w-16 rounded object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Posts Performance</CardTitle>
            <CardDescription>
              How your latest posts are performing
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onViewAnalytics}>
            View Analytics
          </Button>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No published posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.slice(0, 5).map(post => {
                const account = accounts.find(a => a.id === post.accountId)
                const impressions = (post as any).impressions || 0
                const engagements = (post as any).engagements || 0
                const engagementRate = impressions > 0 ? (engagements / impressions) * 100 : 0
                
                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                  >
                    {/* Platform */}
                    {account && (
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: getPlatformColor(account.platform) + '20' }}
                      >
                        {getPlatformIcon(account.platform)}
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{post.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.publishedAt 
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : 'Not published'
                        }
                      </p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{formatNumber(impressions)}</p>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatNumber(engagements)}</p>
                        <p className="text-xs text-muted-foreground">Engagements</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{engagementRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Eng. Rate</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SocialDashboard

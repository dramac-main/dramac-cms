'use client'

/**
 * Social Dashboard Component (Enhanced)
 * 
 * PHASE-UI-11A: Social Media Dashboard UI Overhaul
 * Enterprise-grade dashboard with advanced analytics visualizations
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  Share2,
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  Inbox,
  MessageCircle,
  BarChart3,
  Zap,
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
import type { 
  SocialAccount, 
  SocialPost,
  SocialPlatform,
  AnalyticsOverview,
} from '../types'
import { PLATFORM_CONFIGS } from '../types'

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// Import new UI components
import {
  SocialMetricCard,
  SocialEngagementChart,
  PlatformBreakdown,
  TopPostsWidget,
  AudienceGrowthChart,
  SocialQuickActions,
  getDefaultSocialActions,
  type EngagementDataPoint,
  type PlatformDataPoint,
  type AudienceDataPoint,
} from './ui'

// =============================================================================
// TYPES
// =============================================================================

interface SocialDashboardProps {
  siteId: string
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
  onViewAccounts?: () => void
  onViewApprovals?: () => void
  onViewCampaigns?: () => void
  onViewSettings?: () => void
  onRefresh: () => void
  isLoading?: boolean
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function generateMockEngagementData(days: number): EngagementDataPoint[] {
  const data: EngagementDataPoint[] = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString(DEFAULT_LOCALE, { month: 'short', day: 'numeric' }),
      likes: Math.floor(Math.random() * 500) + 100,
      comments: Math.floor(Math.random() * 100) + 20,
      shares: Math.floor(Math.random() * 50) + 10,
      impressions: Math.floor(Math.random() * 5000) + 1000,
    })
  }
  
  return data
}

function generateMockAudienceData(days: number, baseFollowers: number): AudienceDataPoint[] {
  const data: AudienceDataPoint[] = []
  const now = new Date()
  let total = baseFollowers - (days * 50)
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    total += Math.floor(Math.random() * 100) + 20
    data.push({
      date: date.toLocaleDateString(DEFAULT_LOCALE, { month: 'short', day: 'numeric' }),
      total,
    })
  }
  
  return data
}

// =============================================================================
// ONBOARDING COMPONENT
// =============================================================================

function SocialOnboarding({ onConnectAccount }: { onConnectAccount: (platform: string) => void }) {
  const platforms = [
    { name: 'Facebook', icon: '📘', color: '#1877F2', desc: 'Pages & Groups' },
    { name: 'Instagram', icon: '📷', color: '#E4405F', desc: 'Business & Creator' },
    { name: 'Twitter/X', icon: '🐦', color: '#1DA1F2', desc: 'Posts & Threads' },
    { name: 'LinkedIn', icon: '💼', color: '#0A66C2', desc: 'Profile & Company' },
    { name: 'TikTok', icon: '🎵', color: '#000000', desc: 'Videos & Analytics' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
          <CardHeader className="text-center pb-2">
            <motion.div 
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <Share2 className="h-10 w-10 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl">Welcome to Social Media Management!</CardTitle>
            <CardDescription className="text-base max-w-xl mx-auto">
              Connect your social accounts to start scheduling posts, tracking analytics, 
              and managing all your social media from one powerful dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
              {[
                { icon: Calendar, title: 'Schedule Posts', desc: 'Plan content weeks in advance', color: 'text-blue-500' },
                { icon: TrendingUp, title: 'Track Analytics', desc: 'Monitor growth & engagement', color: 'text-green-500' },
                { icon: MessageCircle, title: 'Unified Inbox', desc: 'Respond to all messages', color: 'text-purple-500' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center p-4 rounded-xl bg-background/80 border"
                >
                  <feature.icon className={cn('h-8 w-8 mx-auto mb-2', feature.color)} />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Connect Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
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
              {platforms.map((platform, i) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="h-auto w-full flex-col py-4 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => onConnectAccount(platform.name.toLowerCase())}
                  >
                    <span className="text-3xl mb-2">{platform.icon}</span>
                    <span className="font-semibold">{platform.name}</span>
                    <span className="text-xs text-muted-foreground">{platform.desc}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              More platforms: YouTube, Pinterest, Threads, Bluesky, Mastodon
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Start Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Connect social accounts', desc: 'Click on a platform above to connect via OAuth. Your credentials are secure and never stored.', active: true },
                { step: 2, title: 'Create your first post', desc: 'Use the post composer to create content for multiple platforms at once.', active: false },
                { step: 3, title: 'Schedule and publish', desc: 'Use the content calendar to plan posts ahead and publish at optimal times.', active: false },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    item.active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {item.step}
                  </div>
                  <div>
                    <h4 className={cn('font-medium', !item.active && 'text-muted-foreground')}>
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// =============================================================================
// CONNECTED ACCOUNTS WIDGET
// =============================================================================

interface ConnectedAccountsWidgetProps {
  accounts: SocialAccount[]
  onViewAll: () => void
}

function ConnectedAccountsWidget({ accounts, onViewAll }: ConnectedAccountsWidgetProps) {
  const getPlatformIcon = (platform: SocialPlatform) => PLATFORM_CONFIGS[platform]?.icon || '📱'
  const getPlatformColor = (platform: SocialPlatform) => PLATFORM_CONFIGS[platform]?.color || '#6B7280'
  
  const getStatusColor = (status: SocialAccount['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'expired': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Connected Accounts</CardTitle>
            <CardDescription>
              {accounts.filter(a => a.status === 'active').length} of {accounts.length} active
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.slice(0, 5).map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={account.accountAvatar || undefined} />
                      <AvatarFallback style={{ backgroundColor: getPlatformColor(account.platform) }}>
                        <span className="text-sm">{getPlatformIcon(account.platform)}</span>
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background',
                      getStatusColor(account.status)
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{account.accountName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatNumber(account.followersCount || 0)}</p>
                  <p className="text-xs text-muted-foreground">followers</p>
                </div>
              </div>
            ))}
            {accounts.length > 5 && (
              <Button variant="ghost" className="w-full" onClick={onViewAll}>
                View all {accounts.length} accounts
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// UPCOMING POSTS WIDGET
// =============================================================================

interface UpcomingPostsWidgetProps {
  posts: SocialPost[]
  accounts: SocialAccount[]
  onViewCalendar: () => void
  onCreatePost: () => void
}

function UpcomingPostsWidget({ posts, accounts, onViewCalendar, onCreatePost }: UpcomingPostsWidgetProps) {
  const getPlatformIcon = (platform: SocialPlatform) => PLATFORM_CONFIGS[platform]?.icon || '📱'
  const getPlatformColor = (platform: SocialPlatform) => PLATFORM_CONFIGS[platform]?.color || '#6B7280'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Upcoming Posts</CardTitle>
            <CardDescription>
              Next {Math.min(posts.length, 5)} scheduled posts
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onViewCalendar}>
            View Calendar
          </Button>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No scheduled posts</p>
              <Button variant="link" onClick={onCreatePost} className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Create your first post
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 5).map((post) => {
                const account = accounts.find(a => a.id === post.accountId)
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex -space-x-1">
                          {post.targetAccounts?.slice(0, 3).map((accountId, i) => {
                            const acc = accounts.find(a => a.id === accountId)
                            if (!acc) return null
                            return (
                              <div
                                key={i}
                                className="h-5 w-5 rounded-full border-2 border-background flex items-center justify-center text-xs"
                                style={{ backgroundColor: getPlatformColor(acc.platform) }}
                              >
                                {getPlatformIcon(acc.platform)}
                              </div>
                            )
                          })}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.scheduledAt 
                            ? new Date(post.scheduledAt).toLocaleDateString(DEFAULT_LOCALE, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : 'Not scheduled'
                          }
                        </span>
                      </div>
                    </div>
                    {post.media && post.media.length > 0 && post.media[0].thumbnailUrl && (
                      <img
                        src={post.media[0].thumbnailUrl}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover shrink-0"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SocialDashboard({
  siteId,
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
  onViewAccounts,
  onViewApprovals,
  onViewCampaigns,
  onViewSettings,
  onRefresh,
  isLoading = false,
}: SocialDashboardProps) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | '90d'>('7d')

  // Navigation helpers
  const navigateTo = (path: string) => router.push(`/dashboard/sites/${siteId}/social${path}`)

  // Calculate totals
  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followersCount || 0), 0)
  const activeAccounts = accounts.filter(a => a.status === 'active').length
  const upcomingPosts = scheduledPosts.filter(p => p.status === 'scheduled').length

  // Generate mock data for charts (in production, this would come from API)
  const engagementData = useMemo(() => 
    generateMockEngagementData(dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 90),
    [dateRange]
  )

  const audienceData = useMemo(() => 
    generateMockAudienceData(dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 90, totalFollowers),
    [dateRange, totalFollowers]
  )

  // Platform breakdown data
  const platformData: PlatformDataPoint[] = useMemo(() => 
    accounts.map(account => ({
      platform: account.platform,
      followers: account.followersCount || 0,
      engagement: Math.floor(Math.random() * 1000) + 100,
      posts: Math.floor(Math.random() * 50) + 5,
    })),
    [accounts]
  )

  // Quick actions
  const quickActions = useMemo(() => getDefaultSocialActions({
    onCreatePost,
    onViewCalendar,
    onViewInbox,
    onViewAnalytics,
    onViewAccounts: onViewAccounts || (() => navigateTo('/accounts')),
    onViewApprovals: onViewApprovals || (() => navigateTo('/approvals')),
    onViewCampaigns: onViewCampaigns || (() => navigateTo('/campaigns')),
    onViewSettings: onViewSettings || (() => navigateTo('/settings')),
    inboxCount,
    pendingApprovals,
    scheduledCount: upcomingPosts,
  }), [onCreatePost, onViewCalendar, onViewInbox, onViewAnalytics, onViewAccounts, onViewApprovals, onViewCampaigns, onViewSettings, inboxCount, pendingApprovals, upcomingPosts, navigateTo])

  // Show onboarding if no accounts connected
  if (accounts.length === 0) {
    return (
      <SocialOnboarding 
        onConnectAccount={(platform) => {
          // TODO: Implement OAuth connection
          alert(`Connect ${platform} - OAuth coming soon!`)
        }} 
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-bold">Social Media Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your social presence across {activeAccounts} connected {activeAccounts === 1 ? 'account' : 'accounts'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
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
      </motion.div>

      {/* Quick Actions */}
      <SocialQuickActions 
        actions={quickActions.slice(0, 4)} 
        columns={4}
        isLoading={isLoading}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SocialMetricCard
          title="Total Followers"
          value={totalFollowers}
          change={analytics?.followerGrowth}
          comparisonLabel="vs last period"
          icon={Users}
          sparklineData={audienceData.map(d => d.total)}
          animationDelay={0}
        />
        <SocialMetricCard
          title="Impressions"
          value={analytics?.totalImpressions || 0}
          change={analytics?.impressionChange}
          comparisonLabel="vs last period"
          icon={Eye}
          sparklineData={engagementData.map(d => d.impressions)}
          animationDelay={0.05}
        />
        <SocialMetricCard
          title="Engagements"
          value={analytics?.totalEngagements || 0}
          change={analytics?.engagementChange}
          comparisonLabel="vs last period"
          icon={Heart}
          sparklineData={engagementData.map(d => d.likes + d.comments + d.shares)}
          animationDelay={0.1}
        />
        <SocialMetricCard
          title="Engagement Rate"
          value={`${(analytics?.avgEngagementRate || 0).toFixed(2)}%`}
          icon={TrendingUp}
          animationDelay={0.15}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SocialEngagementChart
          data={engagementData}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          totalEngagement={analytics?.totalEngagements}
          change={analytics?.engagementChange}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
        <PlatformBreakdown
          data={platformData}
          metric="followers"
          isLoading={isLoading}
          onViewAll={onViewAccounts || (() => navigateTo('/accounts'))}
        />
      </div>

      {/* Audience Growth */}
      <AudienceGrowthChart
        data={audienceData}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        totalFollowers={totalFollowers}
        growthRate={analytics?.followerGrowth}
        newFollowers={Math.abs(audienceData[audienceData.length - 1]?.total - audienceData[0]?.total) || 0}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Posts */}
        <TopPostsWidget
          posts={recentPosts}
          accounts={accounts}
          maxPosts={5}
          onViewAll={onViewAnalytics}
          onPostClick={(post) => console.log('View post:', post.id)}
          isLoading={isLoading}
        />

        {/* Connected Accounts & Upcoming Posts */}
        <div className="space-y-6">
          <ConnectedAccountsWidget
            accounts={accounts}
            onViewAll={onViewAccounts || (() => navigateTo('/accounts'))}
          />
          <UpcomingPostsWidget
            posts={scheduledPosts}
            accounts={accounts}
            onViewCalendar={onViewCalendar}
            onCreatePost={onCreatePost}
          />
        </div>
      </div>

      {/* Alerts Section */}
      {(inboxCount > 0 || pendingApprovals > 0) && (
        <motion.div 
          className="grid gap-4 md:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {inboxCount > 0 && (
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Unread Messages</p>
                    <p className="text-sm text-muted-foreground">
                      {inboxCount} new {inboxCount === 1 ? 'message' : 'messages'} in your inbox
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onViewInbox}>
                  View Inbox
                </Button>
              </CardContent>
            </Card>
          )}
          {pendingApprovals > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Approval</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingApprovals} {pendingApprovals === 1 ? 'post' : 'posts'} awaiting review
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onViewApprovals || (() => navigateTo('/approvals'))}>
                  Review Posts
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Named export alias for index.ts compatibility
export { SocialDashboard as SocialDashboardEnhanced }

export default SocialDashboard

'use server'

/**
 * Social Media Module - Analytics Actions
 * 
 * Phase EM-54: Social Media Management Module
 * Server actions for analytics and reporting
 */

import { createClient } from '@/lib/supabase/server'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { 
  DailyAnalytics, 
  PostAnalytics,
  OptimalTime 
} from '../types'

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get analytics overview for a site
 */
export async function getAnalyticsOverview(
  siteId: string,
  options?: {
    accountIds?: string[]
    startDate?: string
    endDate?: string
  }
): Promise<{
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
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    // Get accounts for site
    let accountsQuery = (supabase as any)
      .from('social_accounts')
      .select('id, platform, followers_count, engagement_rate')
      .eq('site_id', siteId)
      .eq('status', 'active')
    
    if (options?.accountIds && options.accountIds.length > 0) {
      accountsQuery = accountsQuery.in('id', options.accountIds)
    }
    
    const { data: accounts } = await accountsQuery
    
    if (!accounts || accounts.length === 0) {
      return {
        overview: {
          totalFollowers: 0,
          totalImpressions: 0,
          totalEngagements: 0,
          totalClicks: 0,
          avgEngagementRate: 0,
          followerGrowth: 0,
          impressionChange: 0,
          engagementChange: 0,
          topPosts: [],
          platformBreakdown: {},
        },
        error: null,
      }
    }
    
    const accountIds = accounts.map((a: { id: string }) => a.id)
    
    // Get date range
    const endDate = options?.endDate || new Date().toISOString().split('T')[0]
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Get daily analytics
    const { data: dailyData } = await (supabase as any)
      .from('social_analytics_daily')
      .select('*')
      .in('account_id', accountIds)
      .gte('date', startDate)
      .lte('date', endDate)
    
    // Calculate totals
    const totalFollowers = accounts.reduce((sum: number, a: { followers_count: number }) => sum + (a.followers_count || 0), 0)
    const totalImpressions = (dailyData || []).reduce((sum: number, d: { impressions: number }) => sum + (d.impressions || 0), 0)
    const totalEngagements = (dailyData || []).reduce((sum: number, d: { engagement_total: number }) => sum + (d.engagement_total || 0), 0)
    const totalClicks = (dailyData || []).reduce((sum: number, d: { link_clicks: number }) => sum + (d.link_clicks || 0), 0)
    
    // Calculate followers change (compare first and last day)
    const sortedData = (dailyData || []).sort((a: { date: string }, b: { date: string }) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const firstDayFollowers = sortedData[0]?.followers_count || totalFollowers
    const followerGrowth = totalFollowers > 0 ? ((totalFollowers - firstDayFollowers) / totalFollowers) * 100 : 0
    
    // Calculate rates
    const avgEngagementRate = totalImpressions > 0 
      ? (totalEngagements / totalImpressions) * 100 
      : 0
    
    // Build platform breakdown
    const platformBreakdown: Record<string, { followers: number; impressions: number; engagements: number }> = {}
    for (const account of accounts) {
      const platform = account.platform
      if (!platformBreakdown[platform]) {
        platformBreakdown[platform] = { followers: 0, impressions: 0, engagements: 0 }
      }
      platformBreakdown[platform].followers += account.followers_count || 0
      
      const accountData = (dailyData || []).filter((d: { account_id: string }) => d.account_id === account.id)
      platformBreakdown[platform].impressions += accountData.reduce((sum: number, d: { impressions: number }) => sum + (d.impressions || 0), 0)
      platformBreakdown[platform].engagements += accountData.reduce((sum: number, d: { engagement_total: number }) => sum + (d.engagement_total || 0), 0)
    }
    
    return {
      overview: {
        totalFollowers,
        totalImpressions,
        totalEngagements,
        totalClicks,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
        followerGrowth: Math.round(followerGrowth * 100) / 100,
        impressionChange: 0, // Would need previous period data
        engagementChange: 0, // Would need previous period data
        topPosts: [],
        platformBreakdown,
      },
      error: null,
    }
  } catch (error) {
    console.error('[Social] Error getting analytics overview:', error)
    return {
      overview: {
        totalFollowers: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        totalClicks: 0,
        avgEngagementRate: 0,
        followerGrowth: 0,
        impressionChange: 0,
        engagementChange: 0,
        topPosts: [],
        platformBreakdown: {},
      },
      error: (error as Error).message,
    }
  }
}

/**
 * Get daily analytics for accounts
 */
export async function getDailyAnalytics(
  accountIds: string[],
  startDate: string,
  endDate: string
): Promise<{ data: DailyAnalytics[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_analytics_daily')
      .select('*')
      .in('account_id', accountIds)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    
    if (error) throw error
    
    return { data: mapRecords<DailyAnalytics>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting daily analytics:', error)
    return { data: [], error: (error as Error).message }
  }
}

/**
 * Get post analytics
 */
export async function getPostAnalytics(
  postId: string
): Promise<{ analytics: PostAnalytics[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_post_analytics')
      .select('*')
      .eq('post_id', postId)
    
    if (error) throw error
    
    return { analytics: mapRecords<PostAnalytics>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting post analytics:', error)
    return { analytics: [], error: (error as Error).message }
  }
}

/**
 * Get top performing posts
 */
export async function getTopPosts(
  siteId: string,
  options?: {
    accountIds?: string[]
    metric?: 'engagement' | 'impressions' | 'clicks'
    limit?: number
    startDate?: string
    endDate?: string
  }
): Promise<{
  posts: Array<{
    postId: string
    content: string
    publishedAt: string
    impressions: number
    engagement: number
    engagementRate: number
  }>
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    const metric = options?.metric || 'engagement'
    const limit = options?.limit || 10
    
    let query = (supabase as any)
      .from('social_posts')
      .select(`
        id,
        content,
        published_at,
        total_impressions,
        total_engagement,
        total_clicks
      `)
      .eq('site_id', siteId)
      .eq('status', 'published')
      .order(
        metric === 'engagement' ? 'total_engagement' : 
        metric === 'impressions' ? 'total_impressions' : 
        'total_clicks',
        { ascending: false }
      )
      .limit(limit)
    
    if (options?.accountIds && options.accountIds.length > 0) {
      query = query.overlaps('target_accounts', options.accountIds)
    }
    
    if (options?.startDate) {
      query = query.gte('published_at', options.startDate)
    }
    
    if (options?.endDate) {
      query = query.lte('published_at', options.endDate)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    const posts = (data || []).map((p: {
      id: string
      content: string
      published_at: string
      total_impressions: number
      total_engagement: number
    }) => ({
      postId: p.id,
      content: p.content.substring(0, 100) + (p.content.length > 100 ? '...' : ''),
      publishedAt: p.published_at,
      impressions: p.total_impressions,
      engagement: p.total_engagement,
      engagementRate: p.total_impressions > 0 
        ? Math.round((p.total_engagement / p.total_impressions) * 10000) / 100 
        : 0,
    }))
    
    return { posts, error: null }
  } catch (error) {
    console.error('[Social] Error getting top posts:', error)
    return { posts: [], error: (error as Error).message }
  }
}

/**
 * Get optimal posting times
 */
export async function getOptimalTimes(
  accountId: string
): Promise<{ times: OptimalTime[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_optimal_times')
      .select('*')
      .eq('account_id', accountId)
      .order('combined_score', { ascending: false })
    
    if (error) throw error
    
    return { times: mapRecords<OptimalTime>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting optimal times:', error)
    return { times: [], error: (error as Error).message }
  }
}

/**
 * Get best times to post (aggregated)
 */
export async function getBestTimesToPost(
  siteId: string,
  options?: {
    accountIds?: string[]
    platform?: string
  }
): Promise<{
  bestTimes: Array<{
    dayOfWeek: number
    dayName: string
    hour: number
    timeLabel: string
    score: number
  }>
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    // Get accounts
    let accountsQuery = (supabase as any)
      .from('social_accounts')
      .select('id')
      .eq('site_id', siteId)
      .eq('status', 'active')
    
    if (options?.accountIds && options.accountIds.length > 0) {
      accountsQuery = accountsQuery.in('id', options.accountIds)
    }
    
    if (options?.platform) {
      accountsQuery = accountsQuery.eq('platform', options.platform)
    }
    
    const { data: accounts } = await accountsQuery
    
    if (!accounts || accounts.length === 0) {
      return { bestTimes: [], error: null }
    }
    
    const accountIds = accounts.map((a: { id: string }) => a.id)
    
    // Get optimal times for all accounts
    const { data: times } = await (supabase as any)
      .from('social_optimal_times')
      .select('*')
      .in('account_id', accountIds)
    
    if (!times || times.length === 0) {
      return { bestTimes: [], error: null }
    }
    
    // Aggregate scores by day/hour
    const scoreMap: Record<string, { total: number; count: number }> = {}
    
    for (const time of times) {
      const key = `${time.day_of_week}-${time.hour}`
      if (!scoreMap[key]) {
        scoreMap[key] = { total: 0, count: 0 }
      }
      scoreMap[key].total += time.combined_score
      scoreMap[key].count++
    }
    
    // Convert to array and sort
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    const bestTimes = Object.entries(scoreMap)
      .map(([key, value]) => {
        const [dayStr, hourStr] = key.split('-')
        const day = parseInt(dayStr)
        const hour = parseInt(hourStr)
        const avgScore = Math.round(value.total / value.count)
        
        return {
          dayOfWeek: day,
          dayName: dayNames[day],
          hour,
          timeLabel: `${hour.toString().padStart(2, '0')}:00`,
          score: avgScore,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
    
    return { bestTimes, error: null }
  } catch (error) {
    console.error('[Social] Error getting best times:', error)
    return { bestTimes: [], error: (error as Error).message }
  }
}

/**
 * Recalculate optimal posting times for an account
 */
export async function recalculateOptimalTimes(
  accountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Call the database function
    const { error } = await (supabase as any)
      .rpc('calculate_social_optimal_times', { p_account_id: accountId })
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error recalculating optimal times:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate analytics report data
 */
export async function generateReportData(
  siteId: string,
  options: {
    reportType: 'performance' | 'engagement' | 'audience' | 'content'
    accountIds?: string[]
    startDate: string
    endDate: string
    metrics?: string[]
  }
): Promise<{
  reportData: Record<string, unknown>
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    // Get accounts
    let accountsQuery = (supabase as any)
      .from('social_accounts')
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'active')
    
    if (options.accountIds && options.accountIds.length > 0) {
      accountsQuery = accountsQuery.in('id', options.accountIds)
    }
    
    const { data: accounts } = await accountsQuery
    const accountIds = (accounts || []).map((a: { id: string }) => a.id)
    
    if (accountIds.length === 0) {
      return { reportData: {}, error: 'No accounts found' }
    }
    
    // Get daily analytics
    const { data: dailyData } = await (supabase as any)
      .from('social_analytics_daily')
      .select('*')
      .in('account_id', accountIds)
      .gte('date', options.startDate)
      .lte('date', options.endDate)
      .order('date', { ascending: true })
    
    // Get posts in date range
    const { data: posts } = await (supabase as any)
      .from('social_posts')
      .select('*')
      .eq('site_id', siteId)
      .eq('status', 'published')
      .gte('published_at', options.startDate)
      .lte('published_at', options.endDate)
    
    // Build report based on type
    const reportData: Record<string, unknown> = {
      period: {
        startDate: options.startDate,
        endDate: options.endDate,
      },
      accounts: accounts?.map((a: { id: string; platform: string; account_name: string }) => ({
        id: a.id,
        platform: a.platform,
        name: a.account_name,
      })),
    }
    
    switch (options.reportType) {
      case 'performance':
        reportData.metrics = {
          totalImpressions: (dailyData || []).reduce((s: number, d: { impressions: number }) => s + d.impressions, 0),
          totalReach: (dailyData || []).reduce((s: number, d: { reach: number }) => s + d.reach, 0),
          totalEngagement: (dailyData || []).reduce((s: number, d: { engagement_total: number }) => s + d.engagement_total, 0),
          totalClicks: (dailyData || []).reduce((s: number, d: { clicks: number }) => s + d.clicks, 0),
          postsPublished: posts?.length || 0,
        }
        reportData.dailyTrend = dailyData
        break
        
      case 'engagement':
        const totalEng = (dailyData || []).reduce((s: number, d: { engagement_total: number }) => s + d.engagement_total, 0)
        const totalLikes = (dailyData || []).reduce((s: number, d: { likes: number }) => s + d.likes, 0)
        const totalComments = (dailyData || []).reduce((s: number, d: { comments: number }) => s + d.comments, 0)
        const totalShares = (dailyData || []).reduce((s: number, d: { shares: number }) => s + d.shares, 0)
        
        reportData.engagement = {
          total: totalEng,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          breakdown: {
            likesPercentage: totalEng > 0 ? Math.round((totalLikes / totalEng) * 100) : 0,
            commentsPercentage: totalEng > 0 ? Math.round((totalComments / totalEng) * 100) : 0,
            sharesPercentage: totalEng > 0 ? Math.round((totalShares / totalEng) * 100) : 0,
          },
        }
        break
        
      case 'audience':
        const latestData = dailyData?.slice(-1)[0]
        const firstData = dailyData?.[0]
        
        reportData.audience = {
          currentFollowers: accounts?.reduce((s: number, a: { followers_count: number }) => s + a.followers_count, 0),
          followersGained: (dailyData || []).reduce((s: number, d: { followers_gained: number }) => s + d.followers_gained, 0),
          followersLost: (dailyData || []).reduce((s: number, d: { followers_lost: number }) => s + d.followers_lost, 0),
          netGrowth: latestData && firstData 
            ? (latestData.followers_count || 0) - (firstData.followers_count || 0)
            : 0,
        }
        break
        
      case 'content':
        reportData.content = {
          totalPosts: posts?.length || 0,
          byPlatform: accounts?.reduce((acc: Record<string, number>, a: { id: string; platform: string }) => {
            const platformPosts = posts?.filter((p: { target_accounts: string[] }) => p.target_accounts.includes(a.id))
            acc[a.platform] = (acc[a.platform] || 0) + (platformPosts?.length || 0)
            return acc
          }, {}),
          avgEngagementPerPost: posts?.length 
            ? Math.round((dailyData || []).reduce((s: number, d: { engagement_total: number }) => s + d.engagement_total, 0) / posts.length)
            : 0,
        }
        break
    }
    
    return { reportData, error: null }
  } catch (error) {
    console.error('[Social] Error generating report:', error)
    return { reportData: {}, error: (error as Error).message }
  }
}

/**
 * Sync analytics from platforms
 */
export async function syncAnalytics(
  accountId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get account
    const { data: account, error: fetchError } = await (supabase as any)
      .from('social_accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (fetchError) throw fetchError
    if (!account) throw new Error('Account not found')
    
    // Platform-specific API calls would go here to fetch analytics
    // For now, just update sync timestamp
    
    const today = new Date().toISOString().split('T')[0]
    
    // Upsert today's analytics with placeholder data
    await (supabase as any)
      .from('social_analytics_daily')
      .upsert({
        account_id: accountId,
        date: today,
        followers_count: account.followers_count,
        followers_gained: 0,
        followers_lost: 0,
        posts_published: 0,
        impressions: 0,
        reach: 0,
        engagement_total: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
      }, { onConflict: 'account_id,date' })
    
    // Update account sync timestamp
    await (supabase as any)
      .from('social_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', accountId)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error syncing analytics:', error)
    return { success: false, error: (error as Error).message }
  }
}

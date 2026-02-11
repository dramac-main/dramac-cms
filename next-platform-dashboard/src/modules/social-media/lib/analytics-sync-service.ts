/**
 * Analytics Sync Service
 *
 * PHASE-SM-03: Fetches analytics data from each platform's API
 * and writes it into social_analytics_daily and social_post_analytics.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { ensureValidToken } from './token-refresh'
import type { SocialPlatform } from '../types'

// ============================================================================
// MAIN SYNC ENTRY POINT
// ============================================================================

/**
 * Sync analytics for a single account. Called by the cron or on-demand.
 */
export async function syncAccountAnalytics(accountId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: account, error } = await (supabase as any)
    .from('social_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) {
    return { success: false, error: 'Account not found' }
  }

  const platform = account.platform as SocialPlatform
  const token = await ensureValidToken(accountId)
  if (!token && platform !== 'bluesky') {
    return { success: false, error: 'Unable to obtain valid token' }
  }

  try {
    switch (platform) {
      case 'facebook':
        await syncFacebookAnalytics(supabase, account, token!)
        break
      case 'instagram':
        await syncInstagramAnalytics(supabase, account, token!)
        break
      case 'twitter':
        await syncTwitterAnalytics(supabase, account, token!)
        break
      case 'linkedin':
        await syncLinkedinAnalytics(supabase, account, token!)
        break
      default:
        // For platforms without analytics API, just write the follower count
        await writeBasicAnalytics(supabase, account)
        break
    }

    // Update sync timestamp
    await (supabase as any)
      .from('social_accounts')
      .update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)

    return { success: true }
  } catch (err: any) {
    console.error(`[Analytics] Sync failed for ${platform} account ${accountId}:`, err)
    return { success: false, error: err.message?.slice(0, 200) }
  }
}

/**
 * Sync analytics for ALL active accounts of a site.
 */
export async function syncSiteAnalytics(siteId: string): Promise<{
  synced: number
  failed: number
}> {
  const supabase = await createClient()

  const { data: accounts } = await (supabase as any)
    .from('social_accounts')
    .select('id')
    .eq('site_id', siteId)
    .eq('status', 'active')

  if (!accounts || accounts.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  for (const acc of accounts) {
    const result = await syncAccountAnalytics(acc.id)
    if (result.success) synced++
    else failed++
  }

  return { synced, failed }
}

// ============================================================================
// FACEBOOK ANALYTICS
// ============================================================================

async function syncFacebookAnalytics(
  supabase: any,
  account: any,
  token: string,
) {
  const pageId = account.platform_account_id
  const since = daysAgo(30)
  const until = today()

  // Page insights
  const insightsRes = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/insights?` +
      `metric=page_impressions,page_engaged_users,page_post_engagements,page_fans` +
      `&period=day&since=${since}&until=${until}&access_token=${token}`,
  )
  const insights = await insightsRes.json()

  if (!insights.data) return

  // Organise by date
  const byDate: Record<string, any> = {}
  for (const metric of insights.data) {
    for (const val of metric.values || []) {
      const date = val.end_time?.split('T')[0]
      if (!date) continue
      if (!byDate[date]) byDate[date] = {}
      byDate[date][metric.name] = val.value
    }
  }

  // Upsert daily analytics
  for (const [date, metrics] of Object.entries(byDate) as [string, any][]) {
    await upsertDailyAnalytics(supabase, {
      accountId: account.id,
      siteId: account.site_id,
      platform: 'facebook',
      date,
      followers: metrics.page_fans || account.followers_count || 0,
      impressions: metrics.page_impressions || 0,
      engagements: metrics.page_post_engagements || 0,
      reach: metrics.page_engaged_users || 0,
      clicks: 0,
      shares: 0,
      likes: 0,
      comments: 0,
    })
  }
}

// ============================================================================
// INSTAGRAM ANALYTICS
// ============================================================================

async function syncInstagramAnalytics(
  supabase: any,
  account: any,
  token: string,
) {
  const igId = account.platform_account_id
  const since = Math.floor(Date.now() / 1000) - 30 * 86400
  const until = Math.floor(Date.now() / 1000)

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/insights?` +
      `metric=impressions,reach,follower_count,profile_views` +
      `&period=day&since=${since}&until=${until}&access_token=${token}`,
  )
  const insights = await res.json()

  if (!insights.data) return

  const byDate: Record<string, any> = {}
  for (const metric of insights.data) {
    for (const val of metric.values || []) {
      const date = val.end_time?.split('T')[0]
      if (!date) continue
      if (!byDate[date]) byDate[date] = {}
      byDate[date][metric.name] = val.value
    }
  }

  for (const [date, metrics] of Object.entries(byDate) as [string, any][]) {
    await upsertDailyAnalytics(supabase, {
      accountId: account.id,
      siteId: account.site_id,
      platform: 'instagram',
      date,
      followers: metrics.follower_count || account.followers_count || 0,
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      engagements: 0,
      clicks: metrics.profile_views || 0,
      shares: 0,
      likes: 0,
      comments: 0,
    })
  }
}

// ============================================================================
// TWITTER ANALYTICS
// ============================================================================

async function syncTwitterAnalytics(
  supabase: any,
  account: any,
  token: string,
) {
  // Twitter v2 API — get recent tweets with public_metrics
  const res = await fetch(
    `https://api.twitter.com/2/users/${account.platform_account_id}/tweets?` +
      `max_results=100&tweet.fields=public_metrics,created_at`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await res.json()

  if (!data.data) return

  // Aggregate by date
  const byDate: Record<string, any> = {}
  for (const tweet of data.data) {
    const date = tweet.created_at?.split('T')[0]
    if (!date) continue
    if (!byDate[date]) {
      byDate[date] = { impressions: 0, likes: 0, comments: 0, shares: 0 }
    }
    const pm = tweet.public_metrics || {}
    byDate[date].impressions += pm.impression_count || 0
    byDate[date].likes += pm.like_count || 0
    byDate[date].comments += pm.reply_count || 0
    byDate[date].shares += pm.retweet_count || 0
  }

  for (const [date, metrics] of Object.entries(byDate) as [string, any][]) {
    await upsertDailyAnalytics(supabase, {
      accountId: account.id,
      siteId: account.site_id,
      platform: 'twitter',
      date,
      followers: account.followers_count || 0,
      impressions: metrics.impressions,
      engagements: metrics.likes + metrics.comments + metrics.shares,
      reach: 0,
      clicks: 0,
      shares: metrics.shares,
      likes: metrics.likes,
      comments: metrics.comments,
    })
  }
}

// ============================================================================
// LINKEDIN ANALYTICS
// ============================================================================

async function syncLinkedinAnalytics(
  supabase: any,
  account: any,
  token: string,
) {
  // LinkedIn org stats (only for company pages)
  // For personal profiles, just write basic analytics
  await writeBasicAnalytics(supabase, account)
}

// ============================================================================
// HELPERS
// ============================================================================

async function writeBasicAnalytics(supabase: any, account: any) {
  const date = today()
  await upsertDailyAnalytics(supabase, {
    accountId: account.id,
    siteId: account.site_id,
    platform: account.platform,
    date,
    followers: account.followers_count || 0,
    impressions: 0,
    engagements: 0,
    reach: 0,
    clicks: 0,
    shares: 0,
    likes: 0,
    comments: 0,
  })
}

async function upsertDailyAnalytics(
  supabase: any,
  data: {
    accountId: string
    siteId: string
    platform: string
    date: string
    followers: number
    impressions: number
    engagements: number
    reach: number
    clicks: number
    shares: number
    likes: number
    comments: number
  },
) {
  await (supabase as any).from('social_analytics_daily').upsert(
    {
      account_id: data.accountId,
      site_id: data.siteId,
      platform: data.platform,
      date: data.date,
      followers: data.followers,
      impressions: data.impressions,
      engagements: data.engagements,
      reach: data.reach,
      clicks: data.clicks,
      shares: data.shares,
      likes: data.likes,
      comments: data.comments,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id,date', ignoreDuplicates: false },
  )
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

/**
 * Optimal Times Service
 *
 * PHASE-SM-03: Analyses post-level analytics to determine the best
 * posting times for each platform / account.
 *
 * Reads social_post_analytics + social_posts to build an engagement
 * heatmap, then stores the top slots in social_optimal_times.
 */

'use server'

import { createClient } from '@/lib/supabase/server'

interface TimeSlotScore {
  dayOfWeek: number // 0-6 (Sun-Sat)
  hour: number // 0-23
  totalEngagement: number
  postCount: number
  avgEngagement: number
}

/**
 * Recompute optimal posting times for a given account.
 */
export async function computeOptimalTimes(accountId: string): Promise<void> {
  const supabase = await createClient()

  // Pull the last 90 days of posts + their analytics
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: posts } = await (supabase as any)
    .from('social_posts')
    .select('id, published_at')
    .eq('status', 'published')
    .gte('published_at', ninetyDaysAgo.toISOString())
    .not('published_at', 'is', null)

  if (!posts || posts.length === 0) return

  // Fetch analytics for those posts
  const postIds = posts.map((p: any) => p.id)
  const { data: analytics } = await (supabase as any)
    .from('social_post_analytics')
    .select('post_id, likes, comments, shares, impressions')
    .in('post_id', postIds)

  if (!analytics || analytics.length === 0) return

  // Build a map post_id -> engagement
  const engagementByPost: Record<string, number> = {}
  for (const a of analytics) {
    engagementByPost[a.post_id] =
      (a.likes || 0) + (a.comments || 0) + (a.shares || 0)
  }

  // Build hour-of-week heatmap
  const slots: Record<string, TimeSlotScore> = {}

  for (const post of posts) {
    const eng = engagementByPost[post.id]
    if (eng === undefined) continue

    const dt = new Date(post.published_at)
    const day = dt.getUTCDay()
    const hour = dt.getUTCHours()
    const key = `${day}-${hour}`

    if (!slots[key]) {
      slots[key] = {
        dayOfWeek: day,
        hour,
        totalEngagement: 0,
        postCount: 0,
        avgEngagement: 0,
      }
    }
    slots[key].totalEngagement += eng
    slots[key].postCount += 1
  }

  // Compute averages and rank
  const ranked = Object.values(slots)
    .map((s) => ({ ...s, avgEngagement: s.totalEngagement / s.postCount }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 21) // top 21 slots (3 per day of week)

  // Get account meta
  const { data: account } = await (supabase as any)
    .from('social_accounts')
    .select('site_id, platform')
    .eq('id', accountId)
    .single()

  if (!account) return

  // Clear old entries for this account
  await (supabase as any)
    .from('social_optimal_times')
    .delete()
    .eq('account_id', accountId)

  // Insert new optimal times
  const rows = ranked.map((slot) => ({
    account_id: accountId,
    site_id: account.site_id,
    platform: account.platform,
    day_of_week: slot.dayOfWeek,
    hour: slot.hour,
    score: Math.round(slot.avgEngagement * 100) / 100,
    post_count: slot.postCount,
    updated_at: new Date().toISOString(),
  }))

  if (rows.length > 0) {
    await (supabase as any).from('social_optimal_times').insert(rows)
  }
}

/**
 * Compute optimal times for all active accounts of a site.
 */
export async function computeSiteOptimalTimes(siteId: string): Promise<void> {
  const supabase = await createClient()

  const { data: accounts } = await (supabase as any)
    .from('social_accounts')
    .select('id')
    .eq('site_id', siteId)
    .eq('status', 'active')

  if (!accounts) return

  for (const acc of accounts) {
    await computeOptimalTimes(acc.id)
  }
}

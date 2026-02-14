/**
 * Chat Cron Jobs
 *
 * PHASE LC-06: Periodic maintenance tasks:
 * - Check and route missed conversations
 * - Close stale conversations
 * - Reset offline agent statuses
 * - Aggregate daily analytics
 *
 * Called via Vercel Cron: GET /api/cron/chat?key=<CRON_SECRET>
 * Schedule: Daily at 2 AM (0 2 * * *)
 * 
 * NOTE: Vercel free plan only allows 1 cron invocation per day per endpoint.
 * For more frequent checks (e.g., every 5 minutes), upgrade to Vercel Pro
 * or implement client-side polling/webhooks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rebalanceConversations, checkMissedConversations } from '@/modules/live-chat/lib/routing-engine'

export const dynamic = 'force-dynamic'

const STALE_HOURS = 24
const AGENT_OFFLINE_MINUTES = 30

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient() as any
  const results: Record<string, unknown> = {}

  try {
    // 1. Get all active sites with live-chat
    const { data: sites } = await supabase
      .from('mod_chat_widget_settings')
      .select('site_id')

    const siteIds = (sites || []).map((s: Record<string, unknown>) => s.site_id as string)

    // 2. Rebalance & check missed conversations per site
    let totalReassigned = 0
    let totalMissed = 0
    for (const siteId of siteIds) {
      const rebalance = await rebalanceConversations(siteId)
      totalReassigned += rebalance.reassigned

      const missed = await checkMissedConversations(siteId)
      totalMissed += missed.missed
    }
    results.rebalanced = totalReassigned
    results.missedChecked = totalMissed

    // 3. Close stale conversations (no activity for 24h)
    const staleTime = new Date(
      Date.now() - STALE_HOURS * 60 * 60 * 1000
    ).toISOString()

    const { data: staleConvs } = await supabase
      .from('mod_chat_conversations')
      .update({
        status: 'closed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('status', ['active', 'waiting', 'new'])
      .lt('updated_at', staleTime)
      .select('id')

    results.staleClosed = staleConvs?.length || 0

    // 4. Set agents who haven't pinged in 30 min to offline
    const offlineTime = new Date(
      Date.now() - AGENT_OFFLINE_MINUTES * 60 * 1000
    ).toISOString()

    const { data: offlineAgents } = await supabase
      .from('mod_chat_agents')
      .update({
        status: 'offline',
        current_chat_count: 0,
      })
      .eq('status', 'online')
      .lt('last_seen_at', offlineTime)
      .select('id')

    results.agentsSetOffline = offlineAgents?.length || 0

    // 5. Aggregate daily analytics
    const today = new Date().toISOString().split('T')[0]
    let analyticsAggregated = 0

    for (const siteId of siteIds) {
      // Count today's conversations
      const { count: totalConvs } = await supabase
        .from('mod_chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)

      // Count resolved
      const { count: resolved } = await supabase
        .from('mod_chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'resolved')
        .gte('updated_at', `${today}T00:00:00`)
        .lt('updated_at', `${today}T23:59:59`)

      // Avg response time (first response)
      const { data: responseTimes } = await supabase
        .from('mod_chat_conversations')
        .select('first_response_at, created_at')
        .eq('site_id', siteId)
        .not('first_response_at', 'is', null)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)

      let avgResponseTime = 0
      if (responseTimes && responseTimes.length > 0) {
        const totalMs = responseTimes.reduce(
          (sum: number, c: Record<string, unknown>) => {
            const created = new Date(c.created_at as string).getTime()
            const firstResp = new Date(c.first_response_at as string).getTime()
            return sum + (firstResp - created)
          },
          0
        )
        avgResponseTime = Math.round(totalMs / responseTimes.length / 1000) // seconds
      }

      // Avg satisfaction — column is "rating" not "satisfaction_rating"
      const { data: ratings } = await supabase
        .from('mod_chat_conversations')
        .select('rating')
        .eq('site_id', siteId)
        .not('rating', 'is', null)
        .gte('updated_at', `${today}T00:00:00`)

      let avgRating = 0
      const totalRatings = ratings?.length || 0
      if (ratings && ratings.length > 0) {
        avgRating =
          ratings.reduce(
            (sum: number, r: Record<string, unknown>) =>
              sum + (r.rating as number),
            0
          ) / ratings.length
      }

      // Count actual messages instead of estimating
      const { count: totalMessages } = await supabase
        .from('mod_chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)

      // Count missed conversations
      const { count: missed } = await supabase
        .from('mod_chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('status', 'missed')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)

      // Avg resolution time
      const { data: resolvedConvs } = await supabase
        .from('mod_chat_conversations')
        .select('created_at, ended_at')
        .eq('site_id', siteId)
        .eq('status', 'resolved')
        .not('ended_at', 'is', null)
        .gte('updated_at', `${today}T00:00:00`)
        .lt('updated_at', `${today}T23:59:59`)

      let avgResolutionSeconds = 0
      if (resolvedConvs && resolvedConvs.length > 0) {
        const totalMs = resolvedConvs.reduce(
          (sum: number, c: Record<string, unknown>) => {
            const created = new Date(c.created_at as string).getTime()
            const ended = new Date(c.ended_at as string).getTime()
            return sum + (ended - created)
          },
          0
        )
        avgResolutionSeconds = Math.round(totalMs / resolvedConvs.length / 1000)
      }

      // Upsert analytics — use correct column names per schema
      await supabase.from('mod_chat_analytics').upsert(
        {
          site_id: siteId,
          date: today,
          total_conversations: totalConvs || 0,
          total_messages: totalMessages || 0,
          resolved_conversations: resolved || 0,
          missed_conversations: missed || 0,
          avg_first_response_seconds: avgResponseTime,
          avg_resolution_seconds: avgResolutionSeconds,
          avg_rating: Math.round(avgRating * 100) / 100,
          total_ratings: totalRatings,
        },
        { onConflict: 'site_id,date' }
      )

      analyticsAggregated++
    }

    results.analyticsAggregated = analyticsAggregated

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    })
  } catch (err) {
    console.error('[Chat Cron] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Cron job failed',
      },
      { status: 500 }
    )
  }
}

/**
 * Analytics Server Actions
 *
 * PHASE LC-07: Full analytics data retrieval for the analytics dashboard.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  ChatAnalytics,
  AgentPerformanceData,
  ConversationChannel,
} from '../types'
import { mapRecords, mapRecord } from '../lib/map-db-record'

// =============================================================================
// ANALYTICS OVERVIEW
// =============================================================================

export async function getAnalyticsOverview(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: {
    totalConversations: number
    totalMessages: number
    resolvedConversations: number
    missedConversations: number
    avgResponseTime: number
    avgSatisfaction: number
    totalRatings: number
    aiAutoResponses: number
    aiResolved: number
  } | null
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, data: null, error: 'Not authenticated' }

    const db = supabase as any

    const { data } = await db
      .from('mod_chat_analytics')
      .select('*')
      .eq('site_id', siteId)
      .gte('date', dateFrom)
      .lte('date', dateTo)

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          totalConversations: 0,
          totalMessages: 0,
          resolvedConversations: 0,
          missedConversations: 0,
          avgResponseTime: 0,
          avgSatisfaction: 0,
          totalRatings: 0,
          aiAutoResponses: 0,
          aiResolved: 0,
        },
      }
    }

    const records = mapRecords<ChatAnalytics>(data)

    const totals = records.reduce(
      (acc, r) => ({
        totalConversations: acc.totalConversations + r.totalConversations,
        totalMessages: acc.totalMessages + r.totalMessages,
        resolvedConversations: acc.resolvedConversations + r.resolvedConversations,
        missedConversations: acc.missedConversations + r.missedConversations,
        sumResponseTime: acc.sumResponseTime + r.avgFirstResponseSeconds * r.totalConversations,
        sumSatisfaction: acc.sumSatisfaction + r.avgRating * r.totalRatings,
        totalRatings: acc.totalRatings + r.totalRatings,
        aiAutoResponses: acc.aiAutoResponses + r.aiAutoResponses,
        aiResolved: acc.aiResolved + r.aiResolved,
      }),
      {
        totalConversations: 0,
        totalMessages: 0,
        resolvedConversations: 0,
        missedConversations: 0,
        sumResponseTime: 0,
        sumSatisfaction: 0,
        totalRatings: 0,
        aiAutoResponses: 0,
        aiResolved: 0,
      }
    )

    return {
      success: true,
      data: {
        totalConversations: totals.totalConversations,
        totalMessages: totals.totalMessages,
        resolvedConversations: totals.resolvedConversations,
        missedConversations: totals.missedConversations,
        avgResponseTime:
          totals.totalConversations > 0
            ? Math.round(totals.sumResponseTime / totals.totalConversations)
            : 0,
        avgSatisfaction:
          totals.totalRatings > 0
            ? Math.round((totals.sumSatisfaction / totals.totalRatings) * 100) / 100
            : 0,
        totalRatings: totals.totalRatings,
        aiAutoResponses: totals.aiAutoResponses,
        aiResolved: totals.aiResolved,
      },
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Failed to load analytics',
    }
  }
}

// =============================================================================
// CONVERSATIONS BY DAY
// =============================================================================

export async function getConversationsByDay(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: Array<{
    date: string
    total: number
    resolved: number
    missed: number
  }>
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    const { data } = await db
      .from('mod_chat_analytics')
      .select('date, total_conversations, resolved_conversations, missed_conversations')
      .eq('site_id', siteId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true })

    return {
      success: true,
      data: (data || []).map((d: Record<string, unknown>) => ({
        date: d.date as string,
        total: d.total_conversations as number || 0,
        resolved: d.resolved_conversations as number || 0,
        missed: d.missed_conversations as number || 0,
      })),
    }
  } catch {
    return { success: true, data: [] }
  }
}

// =============================================================================
// RESPONSE TIME BY DAY
// =============================================================================

export async function getResponseTimeByDay(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: Array<{
    date: string
    avgFirstResponse: number
    avgResolution: number
  }>
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    const { data } = await db
      .from('mod_chat_analytics')
      .select('date, avg_first_response_seconds, avg_resolution_seconds')
      .eq('site_id', siteId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true })

    return {
      success: true,
      data: (data || []).map((d: Record<string, unknown>) => ({
        date: d.date as string,
        avgFirstResponse: (d.avg_first_response_seconds as number) || 0,
        avgResolution: (d.avg_resolution_seconds as number) || 0,
      })),
    }
  } catch {
    return { success: true, data: [] }
  }
}

// =============================================================================
// AGENT PERFORMANCE
// =============================================================================

export async function getAgentPerformance(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: AgentPerformanceData[]
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    // Get agents
    const { data: agents } = await db
      .from('mod_chat_agents')
      .select('id, display_name, avatar_url, current_chat_count, max_concurrent_chats')
      .eq('site_id', siteId)
      .eq('is_active', true)

    if (!agents || agents.length === 0) {
      return { success: true, data: [] }
    }

    const performance: AgentPerformanceData[] = []

    for (const agent of agents) {
      // Count conversations handled in date range
      const { count: totalChats } = await db
        .from('mod_chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('assigned_agent_id', agent.id)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)

      const { count: resolved } = await db
        .from('mod_chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('assigned_agent_id', agent.id)
        .eq('status', 'resolved')
        .gte('updated_at', `${dateFrom}T00:00:00`)
        .lte('updated_at', `${dateTo}T23:59:59`)

      // Avg response time
      const { data: responseTimes } = await db
        .from('mod_chat_conversations')
        .select('first_response_at, created_at')
        .eq('assigned_agent_id', agent.id)
        .not('first_response_at', 'is', null)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)

      let avgResponseTime = 0
      if (responseTimes && responseTimes.length > 0) {
        const total = responseTimes.reduce((s: number, c: Record<string, unknown>) => {
          return s + (new Date(c.first_response_at as string).getTime() - new Date(c.created_at as string).getTime())
        }, 0)
        avgResponseTime = Math.round(total / responseTimes.length / 1000)
      }

      // Avg rating (column is "rating" not "satisfaction_rating")
      const { data: ratings } = await db
        .from('mod_chat_conversations')
        .select('rating')
        .eq('assigned_agent_id', agent.id)
        .not('rating', 'is', null)
        .gte('updated_at', `${dateFrom}T00:00:00`)

      let avgRating = 0
      let totalRatings = 0
      if (ratings && ratings.length > 0) {
        totalRatings = ratings.length
        avgRating =
          ratings.reduce((s: number, r: Record<string, unknown>) => s + (r.rating as number), 0) /
          ratings.length
      }

      performance.push({
        agentId: agent.id,
        agentName: agent.display_name,
        avatarUrl: agent.avatar_url,
        totalChats: totalChats || 0,
        resolvedChats: resolved || 0,
        avgResponseTime,
        avgRating: Math.round(avgRating * 100) / 100,
        totalRatings,
        currentLoad: agent.current_chat_count,
        maxLoad: agent.max_concurrent_chats,
      })
    }

    // Sort by total chats descending
    performance.sort((a, b) => b.totalChats - a.totalChats)

    return { success: true, data: performance }
  } catch {
    return { success: true, data: [] }
  }
}

// =============================================================================
// CHANNEL BREAKDOWN
// =============================================================================

export async function getChannelBreakdown(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: Array<{ channel: ConversationChannel; count: number; percentage: number }>
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    const channels: ConversationChannel[] = ['widget', 'whatsapp', 'api']
    const results: Array<{ channel: ConversationChannel; count: number; percentage: number }> = []
    let total = 0

    for (const channel of channels) {
      const { count } = await db
        .from('mod_chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('site_id', siteId)
        .eq('channel', channel)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)

      const c = count || 0
      total += c
      results.push({ channel, count: c, percentage: 0 })
    }

    // Calculate percentages
    for (const r of results) {
      r.percentage = total > 0 ? Math.round((r.count / total) * 100) : 0
    }

    return { success: true, data: results.filter((r) => r.count > 0) }
  } catch {
    return { success: true, data: [] }
  }
}

// =============================================================================
// SATISFACTION DISTRIBUTION
// =============================================================================

export async function getSatisfactionDistribution(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: Array<{ rating: number; count: number }>
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    // Column is "rating" not "satisfaction_rating" per schema
    const { data } = await db
      .from('mod_chat_conversations')
      .select('rating')
      .eq('site_id', siteId)
      .not('rating', 'is', null)
      .gte('updated_at', `${dateFrom}T00:00:00`)
      .lte('updated_at', `${dateTo}T23:59:59`)

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    for (const row of data || []) {
      const rating = Math.round(row.rating as number)
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++
      }
    }

    return {
      success: true,
      data: Object.entries(distribution).map(([rating, count]) => ({
        rating: Number(rating),
        count,
      })),
    }
  } catch {
    return { success: true, data: [] }
  }
}

// =============================================================================
// SATISFACTION TREND OVER TIME
// =============================================================================

export async function getSatisfactionTrend(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: Array<{ date: string; avgRating: number; count: number }>
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    const { data } = await db
      .from('mod_chat_conversations')
      .select('rating, rated_at')
      .eq('site_id', siteId)
      .not('rating', 'is', null)
      .not('rated_at', 'is', null)
      .gte('rated_at', `${dateFrom}T00:00:00`)
      .lte('rated_at', `${dateTo}T23:59:59`)
      .order('rated_at', { ascending: true })

    // Group by day
    const dayMap = new Map<string, { total: number; count: number }>()

    for (const row of data || []) {
      const day = new Date(row.rated_at as string).toISOString().split('T')[0]
      const existing = dayMap.get(day) || { total: 0, count: 0 }
      existing.total += row.rating as number
      existing.count += 1
      dayMap.set(day, existing)
    }

    // Fill missing days with null
    const result: Array<{ date: string; avgRating: number; count: number }> = []
    const start = new Date(dateFrom)
    const end = new Date(dateTo)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayData = dayMap.get(dateStr)
      result.push({
        date: dateStr,
        avgRating: dayData ? Math.round((dayData.total / dayData.count) * 10) / 10 : 0,
        count: dayData?.count ?? 0,
      })
    }

    return { success: true, data: result }
  } catch {
    return { success: true, data: [] }
  }
}

// =============================================================================
// BUSIEST HOURS
// =============================================================================

export async function getBusiestHours(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  data: Array<{ hour: number; count: number }>
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    const { data } = await db
      .from('mod_chat_conversations')
      .select('created_at')
      .eq('site_id', siteId)
      .gte('created_at', `${dateFrom}T00:00:00`)
      .lte('created_at', `${dateTo}T23:59:59`)

    const hours: Record<number, number> = {}
    for (let i = 0; i < 24; i++) hours[i] = 0

    for (const row of data || []) {
      const h = new Date(row.created_at as string).getHours()
      hours[h]++
    }

    return {
      success: true,
      data: Object.entries(hours).map(([hour, count]) => ({
        hour: Number(hour),
        count,
      })),
    }
  } catch {
    return { success: true, data: [] }
  }
}

// =============================================================================
// EXPORT CSV
// =============================================================================

export async function exportAnalyticsCsv(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  success: boolean
  csv: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    const db = supabase as any

    const { data } = await db
      .from('mod_chat_analytics')
      .select('*')
      .eq('site_id', siteId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true })

    if (!data || data.length === 0) {
      return { success: true, csv: 'No data for selected date range' }
    }

    const headers = [
      'Date',
      'Total Conversations',
      'Total Messages',
      'Resolved',
      'Missed',
      'Avg First Response (s)',
      'Avg Resolution (s)',
      'Avg Rating',
      'Total Ratings',
      'AI Responses',
      'AI Resolved',
    ]

    const rows = data.map((r: Record<string, unknown>) =>
      [
        r.date,
        r.total_conversations,
        r.total_messages,
        r.resolved_conversations,
        r.missed_conversations,
        r.avg_first_response_seconds,
        r.avg_resolution_seconds,
        r.avg_rating,
        r.total_ratings,
        r.ai_auto_responses,
        r.ai_resolved,
      ].join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')

    return { success: true, csv }
  } catch (err) {
    return {
      success: false,
      csv: '',
      error: err instanceof Error ? err.message : 'Export failed',
    }
  }
}

'use server'

/**
 * Social Media Module - Competitor Actions
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Server actions for competitor tracking and analysis
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { Competitor } from '../types'

// ============================================================================
// COMPETITOR CRUD
// ============================================================================

/**
 * Get all competitors for a site
 */
export async function getCompetitors(
  siteId: string
): Promise<{ competitors: Competitor[]; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_competitors')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { competitors: mapRecords<Competitor>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting competitors:', error)
    return { competitors: [], error: (error as Error).message }
  }
}

/**
 * Add a competitor
 */
export async function addCompetitor(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    name: string
    platform: string
    platformHandle: string
    avatarUrl?: string
    bio?: string
    websiteUrl?: string
  }
): Promise<{ competitor: Competitor | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: competitor, error } = await (supabase as any)
      .from('social_competitors')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        name: data.name,
        platform: data.platform,
        platform_handle: data.platformHandle,
        avatar_url: data.avatarUrl || null,
        bio: data.bio || null,
        website_url: data.websiteUrl || null,
        is_active: true,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        avg_engagement_rate: 0,
        posting_frequency: 0,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/competitors`)
    return { competitor: competitor ? mapRecord<Competitor>(competitor) : null, error: null }
  } catch (error) {
    console.error('[Social] Error adding competitor:', error)
    return { competitor: null, error: (error as Error).message }
  }
}

/**
 * Remove a competitor (soft delete)
 */
export async function removeCompetitor(
  competitorId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('social_competitors')
      .update({ is_active: false })
      .eq('id', competitorId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/competitors`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error removing competitor:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Sync competitor data (placeholder for platform API integration)
 */
export async function syncCompetitorData(
  competitorId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    // Update last synced timestamp
    // Real syncing requires platform API access (SM-01 accounts)
    const { error } = await (supabase as any)
      .from('social_competitors')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', competitorId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/competitors`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error syncing competitor data:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get competitor analytics over time
 */
export async function getCompetitorAnalytics(
  competitorId: string,
  dateRange?: string
): Promise<{
  analytics: Array<{
    date: string
    followers_count: number
    followers_change: number
    engagement_rate: number
    posts_count: number
  }>
  error: string | null
}> {
  try {
    const supabase = await createClient()

    let query = (supabase as any)
      .from('social_competitor_analytics')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('date', { ascending: true })

    if (dateRange) {
      const days = parseInt(dateRange.replace('d', ''))
      if (!isNaN(days)) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        query = query.gte('date', startDate.toISOString().split('T')[0])
      }
    }

    const { data, error } = await query

    if (error) throw error

    return { analytics: mapRecords<any>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting competitor analytics:', error)
    return { analytics: [], error: (error as Error).message }
  }
}

/**
 * Get competitor comparison (your stats vs competitors)
 */
export async function getCompetitorComparison(
  siteId: string
): Promise<{
  comparison: Array<{
    id: string
    name: string
    platform: string
    platformHandle: string
    avatarUrl: string | null
    followersCount: number
    followingCount: number
    postsCount: number
    avgEngagementRate: number
    postingFrequency: number
  }>
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_competitors')
      .select('id, name, platform, platform_handle, avatar_url, followers_count, following_count, posts_count, avg_engagement_rate, posting_frequency')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('followers_count', { ascending: false })

    if (error) throw error

    const comparison = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      platformHandle: c.platform_handle,
      avatarUrl: c.avatar_url,
      followersCount: c.followers_count,
      followingCount: c.following_count,
      postsCount: c.posts_count,
      avgEngagementRate: c.avg_engagement_rate,
      postingFrequency: c.posting_frequency,
    }))

    return { comparison, error: null }
  } catch (error) {
    console.error('[Social] Error getting competitor comparison:', error)
    return { comparison: [], error: (error as Error).message }
  }
}

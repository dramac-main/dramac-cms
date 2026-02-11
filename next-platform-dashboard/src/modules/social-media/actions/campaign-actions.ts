'use server'

/**
 * Social Media Module - Campaign Actions
 * 
 * Phase EM-54: Social Media Management Module
 * Server actions for managing social media campaigns
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { Campaign, CampaignStatus, CampaignGoals } from '../types'

// ============================================================================
// CAMPAIGN CRUD
// ============================================================================

/**
 * Get all campaigns for a site
 */
export async function getCampaigns(
  siteId: string,
  options?: {
    status?: CampaignStatus | CampaignStatus[]
    limit?: number
    offset?: number
  }
): Promise<{ campaigns: Campaign[]; total: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    let query = (supabase as any)
      .from('social_campaigns')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
    
    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status)
      } else {
        query = query.eq('status', options.status)
      }
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }
    
    const { data, count, error } = await query
    
    if (error) throw error
    
    return { campaigns: mapRecords<Campaign>(data || []), total: count || 0, error: null }
  } catch (error) {
    console.error('[Social] Error getting campaigns:', error)
    return { campaigns: [], total: 0, error: (error as Error).message }
  }
}

/**
 * Get a single campaign
 */
export async function getCampaign(
  campaignId: string
): Promise<{ campaign: Campaign | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await (supabase as any)
      .from('social_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    
    if (error) throw error
    
    return { campaign: data ? mapRecord<Campaign>(data) : null, error: null }
  } catch (error) {
    console.error('[Social] Error getting campaign:', error)
    return { campaign: null, error: (error as Error).message }
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    name: string
    description?: string
    color?: string
    startDate: string
    endDate?: string
    goals?: CampaignGoals
    budget?: number
    hashtags?: string[]
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
  }
): Promise<{ campaign: Campaign | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Determine status based on dates
    const now = new Date()
    const startDate = new Date(data.startDate)
    const endDate = data.endDate ? new Date(data.endDate) : null
    
    let status: CampaignStatus = 'draft'
    if (startDate > now) {
      status = 'scheduled'
    } else if (endDate && endDate < now) {
      status = 'completed'
    } else if (startDate <= now) {
      status = 'active'
    }
    
    const { data: campaign, error } = await (supabase as any)
      .from('social_campaigns')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        name: data.name,
        description: data.description || null,
        color: data.color || '#3B82F6',
        start_date: data.startDate,
        end_date: data.endDate || null,
        goals: data.goals || {},
        budget: data.budget || null,
        budget_spent: 0,
        hashtags: data.hashtags || [],
        utm_source: data.utmSource || data.name.toLowerCase().replace(/\s+/g, '-'),
        utm_medium: data.utmMedium || 'social',
        utm_campaign: data.utmCampaign || data.name.toLowerCase().replace(/\s+/g, '-'),
        total_posts: 0,
        total_impressions: 0,
        total_engagement: 0,
        total_clicks: 0,
        total_conversions: 0,
        status,
        created_by: userId,
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    return { campaign: campaign ? mapRecord<Campaign>(campaign) : null, error: null }
  } catch (error) {
    console.error('[Social] Error creating campaign:', error)
    return { campaign: null, error: (error as Error).message }
  }
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  campaignId: string,
  siteId: string,
  updates: Partial<{
    name: string
    description: string
    color: string
    startDate: string
    endDate: string
    goals: CampaignGoals
    budget: number
    hashtags: string[]
    utmSource: string
    utmMedium: string
    utmCampaign: string
    status: CampaignStatus
  }>
): Promise<{ campaign: Campaign | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate
    if (updates.goals !== undefined) updateData.goals = updates.goals
    if (updates.budget !== undefined) updateData.budget = updates.budget
    if (updates.hashtags !== undefined) updateData.hashtags = updates.hashtags
    if (updates.utmSource !== undefined) updateData.utm_source = updates.utmSource
    if (updates.utmMedium !== undefined) updateData.utm_medium = updates.utmMedium
    if (updates.utmCampaign !== undefined) updateData.utm_campaign = updates.utmCampaign
    if (updates.status !== undefined) updateData.status = updates.status
    
    const { data: campaign, error } = await (supabase as any)
      .from('social_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns/${campaignId}`)
    
    return { campaign: campaign ? mapRecord<Campaign>(campaign) : null, error: null }
  } catch (error) {
    console.error('[Social] Error updating campaign:', error)
    return { campaign: null, error: (error as Error).message }
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(
  campaignId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // First, unlink all posts from this campaign
    await (supabase as any)
      .from('social_posts')
      .update({ campaign_id: null })
      .eq('campaign_id', campaignId)
    
    // Delete the campaign
    const { error } = await (supabase as any)
      .from('social_campaigns')
      .delete()
      .eq('id', campaignId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting campaign:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Archive a campaign
 */
export async function archiveCampaign(
  campaignId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_campaigns')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error archiving campaign:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(
  campaignId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_campaigns')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error pausing campaign:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Resume a paused campaign
 */
export async function resumeCampaign(
  campaignId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('social_campaigns')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
    
    if (error) throw error
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error resuming campaign:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// CAMPAIGN POSTS
// ============================================================================

/**
 * Get posts for a campaign
 */
export async function getCampaignPosts(
  campaignId: string,
  options?: {
    status?: string
    limit?: number
  }
): Promise<{ posts: any[]; total: number; error: string | null }> {
  try {
    const supabase = await createClient()
    
    let query = (supabase as any)
      .from('social_posts')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('scheduled_at', { ascending: true })
    
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, count, error } = await query
    
    if (error) throw error
    
    return { posts: mapRecords<any>(data || []), total: count || 0, error: null }
  } catch (error) {
    console.error('[Social] Error getting campaign posts:', error)
    return { posts: [], total: 0, error: (error as Error).message }
  }
}

/**
 * Add post to campaign
 */
export async function addPostToCampaign(
  postId: string,
  campaignId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Update post with campaign ID
    const { error: postError } = await (supabase as any)
      .from('social_posts')
      .update({ campaign_id: campaignId })
      .eq('id', postId)
    
    if (postError) throw postError
    
    // Update campaign post count
    const { data: count } = await (supabase as any)
      .from('social_posts')
      .select('id', { count: 'exact' })
      .eq('campaign_id', campaignId)
    
    await (supabase as any)
      .from('social_campaigns')
      .update({ total_posts: count || 0 })
      .eq('id', campaignId)
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns/${campaignId}`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error adding post to campaign:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Remove post from campaign
 */
export async function removePostFromCampaign(
  postId: string,
  campaignId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Remove campaign ID from post
    const { error: postError } = await (supabase as any)
      .from('social_posts')
      .update({ campaign_id: null })
      .eq('id', postId)
      .eq('campaign_id', campaignId)
    
    if (postError) throw postError
    
    // Update campaign post count
    const { data: count } = await (supabase as any)
      .from('social_posts')
      .select('id', { count: 'exact' })
      .eq('campaign_id', campaignId)
    
    await (supabase as any)
      .from('social_campaigns')
      .update({ total_posts: count || 0 })
      .eq('id', campaignId)
    
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns`)
    revalidatePath(`/dashboard/sites/${siteId}/social/campaigns/${campaignId}`)
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error removing post from campaign:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// CAMPAIGN ANALYTICS
// ============================================================================

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(
  campaignId: string
): Promise<{
  analytics: {
    totalPosts: number
    publishedPosts: number
    scheduledPosts: number
    draftPosts: number
    totalImpressions: number
    totalEngagement: number
    totalClicks: number
    engagementRate: number
    goalProgress: Record<string, { target: number; current: number; percentage: number }>
  } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    // Get campaign with goals
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from('social_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    
    if (campaignError) throw campaignError
    if (!campaign) throw new Error('Campaign not found')
    
    // Get posts stats
    const { data: posts } = await (supabase as any)
      .from('social_posts')
      .select('status, total_impressions, total_engagement, total_clicks')
      .eq('campaign_id', campaignId)
    
    const totalPosts = posts?.length || 0
    const publishedPosts = posts?.filter((p: any) => p.status === 'published').length || 0
    const scheduledPosts = posts?.filter((p: any) => p.status === 'scheduled').length || 0
    const draftPosts = posts?.filter((p: any) => p.status === 'draft').length || 0
    
    const totalImpressions = posts?.reduce((sum: number, p: any) => sum + (p.total_impressions || 0), 0) || 0
    const totalEngagement = posts?.reduce((sum: number, p: any) => sum + (p.total_engagement || 0), 0) || 0
    const totalClicks = posts?.reduce((sum: number, p: any) => sum + (p.total_clicks || 0), 0) || 0
    
    const engagementRate = totalImpressions > 0 
      ? Math.round((totalEngagement / totalImpressions) * 10000) / 100 
      : 0
    
    // Calculate goal progress
    const goals = campaign.goals || {}
    const goalProgress: Record<string, { target: number; current: number; percentage: number }> = {}
    
    if (goals.impressions) {
      goalProgress.impressions = {
        target: goals.impressions,
        current: totalImpressions,
        percentage: Math.min(100, Math.round((totalImpressions / goals.impressions) * 100)),
      }
    }
    
    if (goals.engagement) {
      goalProgress.engagement = {
        target: goals.engagement,
        current: totalEngagement,
        percentage: Math.min(100, Math.round((totalEngagement / goals.engagement) * 100)),
      }
    }
    
    if (goals.clicks) {
      goalProgress.clicks = {
        target: goals.clicks,
        current: totalClicks,
        percentage: Math.min(100, Math.round((totalClicks / goals.clicks) * 100)),
      }
    }
    
    return {
      analytics: {
        totalPosts,
        publishedPosts,
        scheduledPosts,
        draftPosts,
        totalImpressions,
        totalEngagement,
        totalClicks,
        engagementRate,
        goalProgress,
      },
      error: null,
    }
  } catch (error) {
    console.error('[Social] Error getting campaign analytics:', error)
    return { analytics: null, error: (error as Error).message }
  }
}

/**
 * Update campaign stats (called after publishing)
 */
export async function updateCampaignStats(
  campaignId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get totals from posts
    const { data: stats } = await (supabase as any)
      .from('social_posts')
      .select('total_impressions, total_engagement, total_clicks')
      .eq('campaign_id', campaignId)
      .eq('status', 'published')
    
    const totalImpressions = stats?.reduce((sum: number, p: any) => sum + (p.total_impressions || 0), 0) || 0
    const totalEngagement = stats?.reduce((sum: number, p: any) => sum + (p.total_engagement || 0), 0) || 0
    const totalClicks = stats?.reduce((sum: number, p: any) => sum + (p.total_clicks || 0), 0) || 0
    
    const { error } = await (supabase as any)
      .from('social_campaigns')
      .update({
        total_impressions: totalImpressions,
        total_engagement: totalEngagement,
        total_clicks: totalClicks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
    
    if (error) throw error
    
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error updating campaign stats:', error)
    return { success: false, error: (error as Error).message }
  }
}

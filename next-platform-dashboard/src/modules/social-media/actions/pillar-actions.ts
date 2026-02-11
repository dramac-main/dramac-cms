'use server'

/**
 * Social Media Module - Content Pillar Actions
 * 
 * Phase SM-08: Campaigns, Reporting & Calendar Enhancement
 * Server actions for content pillars management
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { ContentPillar } from '../types'

/**
 * Get all content pillars for a site
 */
export async function getContentPillars(
  siteId: string
): Promise<{ pillars: ContentPillar[]; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_content_pillars')
      .select('*')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return { pillars: mapRecords<ContentPillar>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting content pillars:', error)
    return { pillars: [], error: (error as Error).message }
  }
}

/**
 * Create a content pillar
 */
export async function createContentPillar(
  siteId: string,
  tenantId: string,
  userId: string,
  data: {
    name: string
    color: string
    description?: string
    targetPercentage?: number
  }
): Promise<{ pillar: ContentPillar | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Get highest sort order
    const { data: existing } = await (supabase as any)
      .from('social_content_pillars')
      .select('sort_order')
      .eq('site_id', siteId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

    const { data: pillar, error } = await (supabase as any)
      .from('social_content_pillars')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        name: data.name,
        color: data.color,
        description: data.description || null,
        target_percentage: data.targetPercentage || 0,
        sort_order: nextOrder,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    return { pillar: pillar ? mapRecord<ContentPillar>(pillar) : null, error: null }
  } catch (error) {
    console.error('[Social] Error creating content pillar:', error)
    return { pillar: null, error: (error as Error).message }
  }
}

/**
 * Update a content pillar
 */
export async function updateContentPillar(
  pillarId: string,
  siteId: string,
  updates: Partial<{
    name: string
    color: string
    description: string
    targetPercentage: number
    sortOrder: number
  }>
): Promise<{ pillar: ContentPillar | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.targetPercentage !== undefined) updateData.target_percentage = updates.targetPercentage
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder

    const { data: pillar, error } = await (supabase as any)
      .from('social_content_pillars')
      .update(updateData)
      .eq('id', pillarId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    return { pillar: pillar ? mapRecord<ContentPillar>(pillar) : null, error: null }
  } catch (error) {
    console.error('[Social] Error updating content pillar:', error)
    return { pillar: null, error: (error as Error).message }
  }
}

/**
 * Delete a content pillar
 */
export async function deleteContentPillar(
  pillarId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('social_content_pillars')
      .delete()
      .eq('id', pillarId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/settings`)
    revalidatePath(`/dashboard/sites/${siteId}/social/calendar`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting content pillar:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get content pillar distribution for a site
 */
export async function getContentPillarDistribution(
  siteId: string,
  dateRange?: string
): Promise<{
  distribution: Array<{
    pillarId: string
    pillarName: string
    color: string
    count: number
    percentage: number
    target: number
  }>
  error: string | null
}> {
  try {
    const supabase = await createClient()

    // Get pillars
    const { data: pillars } = await (supabase as any)
      .from('social_content_pillars')
      .select('*')
      .eq('site_id', siteId)

    if (!pillars?.length) {
      return { distribution: [], error: null }
    }

    // Get posts with content pillars
    let postsQuery = (supabase as any)
      .from('social_posts')
      .select('content_pillars')
      .eq('site_id', siteId)

    if (dateRange) {
      const days = parseInt(dateRange.replace('d', ''))
      if (!isNaN(days)) {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        postsQuery = postsQuery.gte('created_at', startDate.toISOString())
      }
    }

    const { data: posts } = await postsQuery

    // Count posts per pillar
    const pillarCounts: Record<string, number> = {}
    let totalPosts = 0

    for (const post of (posts || [])) {
      const postPillars = post.content_pillars || []
      if (Array.isArray(postPillars)) {
        for (const pillarId of postPillars) {
          pillarCounts[pillarId] = (pillarCounts[pillarId] || 0) + 1
          totalPosts++
        }
      }
    }

    const distribution = pillars.map((p: any) => ({
      pillarId: p.id,
      pillarName: p.name,
      color: p.color,
      count: pillarCounts[p.id] || 0,
      percentage: totalPosts > 0 ? Math.round(((pillarCounts[p.id] || 0) / totalPosts) * 100) : 0,
      target: p.target_percentage || 0,
    }))

    return { distribution, error: null }
  } catch (error) {
    console.error('[Social] Error getting content pillar distribution:', error)
    return { distribution: [], error: (error as Error).message }
  }
}

'use server'

/**
 * Social Media Module - Listening Actions
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Server actions for social listening keywords and brand mentions
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { ListeningKeyword, BrandMention, KeywordType, MentionStatus } from '../types'

// ============================================================================
// KEYWORDS
// ============================================================================

/**
 * Get all listening keywords for a site
 */
export async function getListeningKeywords(
  siteId: string
): Promise<{ keywords: ListeningKeyword[]; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_listening_keywords')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { keywords: mapRecords<ListeningKeyword>(data || []), error: null }
  } catch (error) {
    console.error('[Social] Error getting listening keywords:', error)
    return { keywords: [], error: (error as Error).message }
  }
}

/**
 * Add a listening keyword
 */
export async function addListeningKeyword(
  siteId: string,
  tenantId: string,
  userId: string,
  keyword: string,
  type: KeywordType
): Promise<{ keyword: ListeningKeyword | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_listening_keywords')
      .insert({
        site_id: siteId,
        tenant_id: tenantId,
        keyword: keyword.trim(),
        keyword_type: type,
        is_active: true,
        mentions_count: 0,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/listening`)
    return { keyword: data ? mapRecord<ListeningKeyword>(data) : null, error: null }
  } catch (error) {
    console.error('[Social] Error adding listening keyword:', error)
    return { keyword: null, error: (error as Error).message }
  }
}

/**
 * Update keyword active status
 */
export async function updateKeywordStatus(
  keywordId: string,
  siteId: string,
  isActive: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('social_listening_keywords')
      .update({ is_active: isActive })
      .eq('id', keywordId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/listening`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error updating keyword status:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Delete a listening keyword
 */
export async function deleteListeningKeyword(
  keywordId: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('social_listening_keywords')
      .delete()
      .eq('id', keywordId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/listening`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error deleting listening keyword:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// MENTIONS
// ============================================================================

/**
 * Get brand mentions for a site
 */
export async function getBrandMentions(
  siteId: string,
  options?: {
    status?: MentionStatus
    sentiment?: string
    keyword?: string
    limit?: number
    offset?: number
  }
): Promise<{ mentions: BrandMention[]; total: number; error: string | null }> {
  try {
    const supabase = await createClient()

    let query = (supabase as any)
      .from('social_brand_mentions')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .order('mentioned_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.sentiment) {
      query = query.eq('sentiment', options.sentiment)
    }

    if (options?.keyword) {
      query = query.contains('matched_keywords', [options.keyword])
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, count, error } = await query

    if (error) throw error

    return { mentions: mapRecords<BrandMention>(data || []), total: count || 0, error: null }
  } catch (error) {
    console.error('[Social] Error getting brand mentions:', error)
    return { mentions: [], total: 0, error: (error as Error).message }
  }
}

/**
 * Update mention status
 */
export async function updateMentionStatus(
  mentionId: string,
  siteId: string,
  status: MentionStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()

    const { error } = await (supabase as any)
      .from('social_brand_mentions')
      .update({ status })
      .eq('id', mentionId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/social/listening`)
    return { success: true, error: null }
  } catch (error) {
    console.error('[Social] Error updating mention status:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get mention statistics
 */
export async function getMentionStats(
  siteId: string
): Promise<{
  stats: { positive: number; neutral: number; negative: number; total: number; newCount: number }
  error: string | null
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
      .from('social_brand_mentions')
      .select('sentiment, status')
      .eq('site_id', siteId)

    if (error) throw error

    const mentions = data || []
    const positive = mentions.filter((m: any) => m.sentiment === 'positive').length
    const neutral = mentions.filter((m: any) => m.sentiment === 'neutral').length
    const negative = mentions.filter((m: any) => m.sentiment === 'negative').length
    const newCount = mentions.filter((m: any) => m.status === 'new').length

    return {
      stats: { positive, neutral, negative, total: mentions.length, newCount },
      error: null,
    }
  } catch (error) {
    console.error('[Social] Error getting mention stats:', error)
    return {
      stats: { positive: 0, neutral: 0, negative: 0, total: 0, newCount: 0 },
      error: (error as Error).message,
    }
  }
}

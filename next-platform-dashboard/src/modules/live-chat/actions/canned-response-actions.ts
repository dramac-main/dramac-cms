'use server'

/**
 * Live Chat Module — Canned Response Actions
 *
 * Server actions for quick reply templates with shortcut triggers.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { CannedResponse } from '../types'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

function liveChatPath(siteId: string) {
  return `/dashboard/sites/${siteId}/live-chat`
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getCannedResponses(
  siteId: string,
  category?: string
): Promise<{ responses: CannedResponse[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    let query = supabase
      .from('mod_chat_canned_responses')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return { responses: mapRecords<CannedResponse>(data || []), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting canned responses:', error)
    return { responses: [], error: (error as Error).message }
  }
}

export async function searchCannedResponses(
  siteId: string,
  query: string
): Promise<{ responses: CannedResponse[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_canned_responses')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,shortcut.ilike.%${query}%`)
      .order('usage_count', { ascending: false })

    if (error) throw error

    return { responses: mapRecords<CannedResponse>(data || []), error: null }
  } catch (error) {
    console.error('[LiveChat] Error searching canned responses:', error)
    return { responses: [], error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createCannedResponse(data: {
  siteId: string
  title: string
  content: string
  shortcut?: string
  category?: string
  tags?: string[]
  isShared?: boolean
  createdBy?: string
}): Promise<{ response: CannedResponse | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const insertData: Record<string, unknown> = {
      site_id: data.siteId,
      title: data.title,
      content: data.content,
      is_shared: data.isShared ?? true,
    }

    if (data.shortcut) insertData.shortcut = data.shortcut
    if (data.category) insertData.category = data.category
    if (data.tags) insertData.tags = data.tags
    if (data.createdBy) insertData.created_by = data.createdBy

    const { data: responseData, error } = await supabase
      .from('mod_chat_canned_responses')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    revalidatePath(liveChatPath(data.siteId))
    return { response: mapRecord<CannedResponse>(responseData), error: null }
  } catch (error) {
    console.error('[LiveChat] Error creating canned response:', error)
    return { response: null, error: (error as Error).message }
  }
}

export async function updateCannedResponse(
  responseId: string,
  data: {
    title?: string
    content?: string
    shortcut?: string
    category?: string
    tags?: string[]
    isShared?: boolean
    isActive?: boolean
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const updates: Record<string, unknown> = {}

    if (data.title !== undefined) updates.title = data.title
    if (data.content !== undefined) updates.content = data.content
    if (data.shortcut !== undefined) updates.shortcut = data.shortcut
    if (data.category !== undefined) updates.category = data.category
    if (data.tags !== undefined) updates.tags = data.tags
    if (data.isShared !== undefined) updates.is_shared = data.isShared
    if (data.isActive !== undefined) updates.is_active = data.isActive

    const { error } = await supabase
      .from('mod_chat_canned_responses')
      .update(updates)
      .eq('id', responseId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating canned response:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteCannedResponse(
  responseId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from('mod_chat_canned_responses')
      .delete()
      .eq('id', responseId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error deleting canned response:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function incrementCannedResponseUsage(
  responseId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data: current } = await supabase
      .from('mod_chat_canned_responses')
      .select('usage_count')
      .eq('id', responseId)
      .single()

    const { error } = await supabase
      .from('mod_chat_canned_responses')
      .update({
        usage_count: ((current?.usage_count as number) || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', responseId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error incrementing canned response usage:', error)
    return { success: false, error: (error as Error).message }
  }
}

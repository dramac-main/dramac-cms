'use server'

/**
 * Live Chat Module — Knowledge Base Actions
 *
 * Server actions for knowledge base articles used by AI auto-responder.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { KnowledgeBaseArticle } from '../types'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

function liveChatPath(siteId: string) {
  return `/dashboard/sites/${siteId}/live-chat`
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getKnowledgeBaseArticles(
  siteId: string,
  category?: string
): Promise<{ articles: KnowledgeBaseArticle[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    let query = supabase
      .from('mod_chat_knowledge_base')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return { articles: mapRecords<KnowledgeBaseArticle>(data || []), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting knowledge base articles:', error)
    return { articles: [], error: (error as Error).message }
  }
}

export async function searchKnowledgeBase(
  siteId: string,
  query: string
): Promise<{ articles: KnowledgeBaseArticle[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_knowledge_base')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(10)

    if (error) throw error

    return { articles: mapRecords<KnowledgeBaseArticle>(data || []), error: null }
  } catch (error) {
    console.error('[LiveChat] Error searching knowledge base:', error)
    return { articles: [], error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createArticle(data: {
  siteId: string
  title: string
  content: string
  category?: string
  tags?: string[]
  createdBy?: string
}): Promise<{ article: KnowledgeBaseArticle | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const insertData: Record<string, unknown> = {
      site_id: data.siteId,
      title: data.title,
      content: data.content,
    }

    if (data.category) insertData.category = data.category
    if (data.tags) insertData.tags = data.tags
    if (data.createdBy) insertData.created_by = data.createdBy

    const { data: articleData, error } = await supabase
      .from('mod_chat_knowledge_base')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    revalidatePath(liveChatPath(data.siteId))
    return { article: mapRecord<KnowledgeBaseArticle>(articleData), error: null }
  } catch (error) {
    console.error('[LiveChat] Error creating article:', error)
    return { article: null, error: (error as Error).message }
  }
}

export async function updateArticle(
  articleId: string,
  data: {
    title?: string
    content?: string
    category?: string
    tags?: string[]
    isActive?: boolean
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const updates: Record<string, unknown> = {}

    if (data.title !== undefined) updates.title = data.title
    if (data.content !== undefined) updates.content = data.content
    if (data.category !== undefined) updates.category = data.category
    if (data.tags !== undefined) updates.tags = data.tags
    if (data.isActive !== undefined) updates.is_active = data.isActive

    const { error } = await supabase
      .from('mod_chat_knowledge_base')
      .update(updates)
      .eq('id', articleId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating article:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteArticle(
  articleId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from('mod_chat_knowledge_base')
      .delete()
      .eq('id', articleId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error deleting article:', error)
    return { success: false, error: (error as Error).message }
  }
}

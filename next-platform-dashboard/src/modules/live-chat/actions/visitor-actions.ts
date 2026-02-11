'use server'

/**
 * Live Chat Module — Visitor Actions
 *
 * Server actions for visitor tracking, identification, and CRM integration.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { ChatVisitor, ChatConversation } from '../types'

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getVisitors(
  siteId: string,
  page = 1,
  pageSize = 20
): Promise<{ visitors: ChatVisitor[]; total: number; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    const offset = (page - 1) * pageSize

    const { data, count, error } = await supabase
      .from('mod_chat_visitors')
      .select('*', { count: 'exact' })
      .eq('site_id', siteId)
      .order('last_seen_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return {
      visitors: mapRecords<ChatVisitor>(data || []),
      total: count || 0,
      error: null,
    }
  } catch (error) {
    console.error('[LiveChat] Error getting visitors:', error)
    return { visitors: [], total: 0, error: (error as Error).message }
  }
}

export async function getVisitor(
  visitorId: string
): Promise<{ visitor: ChatVisitor | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_visitors')
      .select('*')
      .eq('id', visitorId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return { visitor: null, error: null }
      throw error
    }

    return { visitor: mapRecord<ChatVisitor>(data), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting visitor:', error)
    return { visitor: null, error: (error as Error).message }
  }
}

export async function getVisitorConversations(
  visitorId: string
): Promise<{ conversations: ChatConversation[]; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { data, error } = await supabase
      .from('mod_chat_conversations')
      .select('*')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { conversations: mapRecords<ChatConversation>(data || []), error: null }
  } catch (error) {
    console.error('[LiveChat] Error getting visitor conversations:', error)
    return { conversations: [], error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createOrUpdateVisitor(data: {
  siteId: string
  name?: string
  email?: string
  phone?: string
  channel?: string
  browser?: string
  os?: string
  device?: string
  ipAddress?: string
  country?: string
  city?: string
  currentPageUrl?: string
  currentPageTitle?: string
  referrerUrl?: string
  landingPageUrl?: string
  whatsappPhone?: string
  externalId?: string
}): Promise<{ visitor: ChatVisitor | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    // Try to find existing visitor by email or WhatsApp phone
    let existingVisitor = null

    if (data.email) {
      const { data: found } = await supabase
        .from('mod_chat_visitors')
        .select('*')
        .eq('site_id', data.siteId)
        .eq('email', data.email)
        .single()

      if (found) existingVisitor = found
    }

    if (!existingVisitor && data.whatsappPhone) {
      const { data: found } = await supabase
        .from('mod_chat_visitors')
        .select('*')
        .eq('site_id', data.siteId)
        .eq('whatsapp_phone', data.whatsappPhone)
        .single()

      if (found) existingVisitor = found
    }

    if (existingVisitor) {
      // Update existing visitor
      const updates: Record<string, unknown> = {
        last_seen_at: new Date().toISOString(),
        total_visits: ((existingVisitor.total_visits as number) || 0) + 1,
      }

      if (data.name) updates.name = data.name
      if (data.phone) updates.phone = data.phone
      if (data.browser) updates.browser = data.browser
      if (data.os) updates.os = data.os
      if (data.device) updates.device = data.device
      if (data.currentPageUrl) updates.current_page_url = data.currentPageUrl
      if (data.currentPageTitle) updates.current_page_title = data.currentPageTitle

      const { data: updated, error } = await supabase
        .from('mod_chat_visitors')
        .update(updates)
        .eq('id', existingVisitor.id)
        .select()
        .single()

      if (error) throw error

      return { visitor: mapRecord<ChatVisitor>(updated), error: null }
    }

    // Create new visitor
    const insertData: Record<string, unknown> = {
      site_id: data.siteId,
      channel: data.channel || 'widget',
    }

    if (data.name) insertData.name = data.name
    if (data.email) insertData.email = data.email
    if (data.phone) insertData.phone = data.phone
    if (data.browser) insertData.browser = data.browser
    if (data.os) insertData.os = data.os
    if (data.device) insertData.device = data.device
    if (data.ipAddress) insertData.ip_address = data.ipAddress
    if (data.country) insertData.country = data.country
    if (data.city) insertData.city = data.city
    if (data.currentPageUrl) insertData.current_page_url = data.currentPageUrl
    if (data.currentPageTitle) insertData.current_page_title = data.currentPageTitle
    if (data.referrerUrl) insertData.referrer_url = data.referrerUrl
    if (data.landingPageUrl) insertData.landing_page_url = data.landingPageUrl
    if (data.whatsappPhone) insertData.whatsapp_phone = data.whatsappPhone
    if (data.externalId) insertData.external_id = data.externalId

    const { data: visitorData, error } = await supabase
      .from('mod_chat_visitors')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return { visitor: mapRecord<ChatVisitor>(visitorData), error: null }
  } catch (error) {
    console.error('[LiveChat] Error creating/updating visitor:', error)
    return { visitor: null, error: (error as Error).message }
  }
}

export async function updateVisitorInfo(
  visitorId: string,
  data: {
    name?: string
    email?: string
    phone?: string
    tags?: string[]
    notes?: string
    customData?: Record<string, unknown>
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const updates: Record<string, unknown> = {}

    if (data.name !== undefined) updates.name = data.name
    if (data.email !== undefined) updates.email = data.email
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.tags !== undefined) updates.tags = data.tags
    if (data.notes !== undefined) updates.notes = data.notes
    if (data.customData !== undefined) updates.custom_data = data.customData

    const { error } = await supabase
      .from('mod_chat_visitors')
      .update(updates)
      .eq('id', visitorId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating visitor info:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateVisitorPageTracking(
  visitorId: string,
  data: { currentPageUrl: string; currentPageTitle: string }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from('mod_chat_visitors')
      .update({
        current_page_url: data.currentPageUrl,
        current_page_title: data.currentPageTitle,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', visitorId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating visitor page tracking:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function linkVisitorToCrm(
  visitorId: string,
  crmContactId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from('mod_chat_visitors')
      .update({ crm_contact_id: crmContactId })
      .eq('id', visitorId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error linking visitor to CRM:', error)
    return { success: false, error: (error as Error).message }
  }
}

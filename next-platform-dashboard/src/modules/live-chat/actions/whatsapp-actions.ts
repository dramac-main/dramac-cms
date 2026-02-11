'use server'

/**
 * WhatsApp Server Actions
 *
 * PHASE LC-05: Actions for sending WhatsApp messages, managing settings,
 * and checking WhatsApp connection status.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord } from '../lib/map-db-record'
import {
  sendTextMessage,
  sendImageMessage,
  sendDocumentMessage,
  sendTemplateMessage as sendWATemplate,
  isWhatsAppConfigured,
  getPerSiteCredentials,
  getMessageTemplates,
} from '../lib/whatsapp-service'
import type {
  ChatMessage,
  WhatsAppTemplateMessage,
} from '../types'

// =============================================================================
// SEND MESSAGES
// =============================================================================

export async function sendWhatsAppMessage(
  conversationId: string,
  content: string,
  senderName: string,
  senderId: string
): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any

    // Get conversation with visitor info
    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('*, mod_chat_visitors!inner(whatsapp_phone)')
      .eq('id', conversationId)
      .single()

    if (!conv) return { message: null, error: 'Conversation not found' }

    const phone = conv.mod_chat_visitors?.whatsapp_phone
    if (!phone) return { message: null, error: 'No WhatsApp phone number' }

    // Check 24h window
    const windowExpiry = conv.whatsapp_window_expires_at
    if (windowExpiry && new Date(windowExpiry) < new Date()) {
      return {
        message: null,
        error: '24-hour service window expired. Use a template message instead.',
      }
    }

    // Get per-site credentials
    const creds = await getPerSiteCredentials(conv.site_id)

    // Send via WhatsApp
    const { messageId, error: sendError } = await sendTextMessage(
      phone,
      content,
      creds.phoneNumberId,
      creds.accessToken
    )

    if (sendError) return { message: null, error: sendError }

    // Insert message into DB
    const { data: msg, error: insertError } = await supabase
      .from('mod_chat_messages')
      .insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: 'agent',
        sender_id: senderId,
        sender_name: senderName,
        content,
        content_type: 'text',
        status: 'sent',
        is_internal_note: false,
        whatsapp_message_id: messageId,
        is_ai_generated: false,
      })
      .select('*')
      .single()

    if (insertError) return { message: null, error: insertError.message }

    // Update conversation
    await supabase
      .from('mod_chat_conversations')
      .update({
        last_message_text: content.slice(0, 500),
        last_message_at: new Date().toISOString(),
        last_message_by: 'agent',
        status: conv.status === 'pending' ? 'active' : conv.status,
      })
      .eq('id', conversationId)

    revalidatePath(`/dashboard/sites/${conv.site_id}/live-chat`)

    return { message: mapRecord<ChatMessage>(msg), error: null }
  } catch (err) {
    return {
      message: null,
      error: err instanceof Error ? err.message : 'Failed to send WhatsApp message',
    }
  }
}

export async function sendWhatsAppImage(
  conversationId: string,
  imageUrl: string,
  caption: string,
  senderName: string,
  senderId: string
): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('*, mod_chat_visitors!inner(whatsapp_phone)')
      .eq('id', conversationId)
      .single()

    if (!conv) return { message: null, error: 'Conversation not found' }

    const phone = conv.mod_chat_visitors?.whatsapp_phone
    if (!phone) return { message: null, error: 'No WhatsApp phone number' }

    if (conv.whatsapp_window_expires_at && new Date(conv.whatsapp_window_expires_at) < new Date()) {
      return { message: null, error: '24-hour service window expired.' }
    }

    const creds = await getPerSiteCredentials(conv.site_id)
    const { messageId, error: sendError } = await sendImageMessage(
      phone, imageUrl, caption, creds.phoneNumberId, creds.accessToken
    )
    if (sendError) return { message: null, error: sendError }

    const { data: msg } = await supabase
      .from('mod_chat_messages')
      .insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: 'agent',
        sender_id: senderId,
        sender_name: senderName,
        content: caption || 'Image',
        content_type: 'image',
        file_url: imageUrl,
        status: 'sent',
        is_internal_note: false,
        whatsapp_message_id: messageId,
        is_ai_generated: false,
      })
      .select('*')
      .single()

    return { message: msg ? mapRecord<ChatMessage>(msg) : null, error: null }
  } catch (err) {
    return { message: null, error: err instanceof Error ? err.message : 'Failed to send image' }
  }
}

export async function sendWhatsAppDocument(
  conversationId: string,
  documentUrl: string,
  filename: string,
  senderName: string,
  senderId: string
): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('*, mod_chat_visitors!inner(whatsapp_phone)')
      .eq('id', conversationId)
      .single()

    if (!conv) return { message: null, error: 'Conversation not found' }

    const phone = conv.mod_chat_visitors?.whatsapp_phone
    if (!phone) return { message: null, error: 'No WhatsApp phone number' }

    if (conv.whatsapp_window_expires_at && new Date(conv.whatsapp_window_expires_at) < new Date()) {
      return { message: null, error: '24-hour service window expired.' }
    }

    const creds = await getPerSiteCredentials(conv.site_id)
    const { messageId, error: sendError } = await sendDocumentMessage(
      phone, documentUrl, filename, undefined, creds.phoneNumberId, creds.accessToken
    )
    if (sendError) return { message: null, error: sendError }

    const { data: msg } = await supabase
      .from('mod_chat_messages')
      .insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: 'agent',
        sender_id: senderId,
        sender_name: senderName,
        content: filename,
        content_type: 'file',
        file_url: documentUrl,
        file_name: filename,
        status: 'sent',
        is_internal_note: false,
        whatsapp_message_id: messageId,
        is_ai_generated: false,
      })
      .select('*')
      .single()

    return { message: msg ? mapRecord<ChatMessage>(msg) : null, error: null }
  } catch (err) {
    return { message: null, error: err instanceof Error ? err.message : 'Failed to send document' }
  }
}

export async function sendWhatsAppTemplateMessage(
  conversationId: string,
  template: WhatsAppTemplateMessage,
  senderId: string
): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any

    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('*, mod_chat_visitors!inner(whatsapp_phone)')
      .eq('id', conversationId)
      .single()

    if (!conv) return { message: null, error: 'Conversation not found' }

    const phone = conv.mod_chat_visitors?.whatsapp_phone
    if (!phone) return { message: null, error: 'No WhatsApp phone number' }

    const creds = await getPerSiteCredentials(conv.site_id)
    const { messageId, error: sendError } = await sendWATemplate(
      phone, template, creds.phoneNumberId, creds.accessToken
    )
    if (sendError) return { message: null, error: sendError }

    const { data: msg } = await supabase
      .from('mod_chat_messages')
      .insert({
        conversation_id: conversationId,
        site_id: conv.site_id,
        sender_type: 'agent',
        sender_id: senderId,
        sender_name: 'System',
        content: `Template: ${template.name}`,
        content_type: 'whatsapp_template',
        status: 'sent',
        is_internal_note: false,
        whatsapp_message_id: messageId,
        is_ai_generated: false,
      })
      .select('*')
      .single()

    return { message: msg ? mapRecord<ChatMessage>(msg) : null, error: null }
  } catch (err) {
    return { message: null, error: err instanceof Error ? err.message : 'Failed to send template' }
  }
}

// =============================================================================
// STATUS & SETTINGS
// =============================================================================

export async function getWhatsAppStatus(
  siteId: string
): Promise<{ configured: boolean; phoneNumber: string | null; error: string | null }> {
  try {
    const supabase = (await createClient()) as any

    const { data } = await supabase
      .from('mod_chat_widget_settings')
      .select('whatsapp_enabled, whatsapp_phone_number, whatsapp_phone_number_id')
      .eq('site_id', siteId)
      .single()

    if (data?.whatsapp_enabled && data?.whatsapp_phone_number_id) {
      return {
        configured: true,
        phoneNumber: data.whatsapp_phone_number || null,
        error: null,
      }
    }

    // Check global env
    if (isWhatsAppConfigured()) {
      return {
        configured: true,
        phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || null,
        error: null,
      }
    }

    return { configured: false, phoneNumber: null, error: null }
  } catch (err) {
    return {
      configured: false,
      phoneNumber: null,
      error: err instanceof Error ? err.message : 'Failed to check WhatsApp status',
    }
  }
}

export async function saveWhatsAppSettings(
  siteId: string,
  data: {
    phoneNumber: string
    phoneNumberId: string
    businessAccountId: string
    welcomeTemplate?: string
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = (await createClient()) as any

    const { error } = await supabase
      .from('mod_chat_widget_settings')
      .update({
        whatsapp_enabled: true,
        whatsapp_phone_number: data.phoneNumber,
        whatsapp_phone_number_id: data.phoneNumberId,
        whatsapp_business_account_id: data.businessAccountId,
        whatsapp_welcome_template: data.welcomeTemplate || null,
      })
      .eq('site_id', siteId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/sites/${siteId}/live-chat/settings`)
    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save settings',
    }
  }
}

export async function getWhatsAppTemplates(
  siteId: string
): Promise<{
  templates: Array<{ name: string; language: string; status: string; components: unknown[] }>
  error: string | null
}> {
  try {
    const creds = await getPerSiteCredentials(siteId)
    return await getMessageTemplates(creds.businessAccountId, creds.accessToken)
  } catch (err) {
    return {
      templates: [],
      error: err instanceof Error ? err.message : 'Failed to fetch templates',
    }
  }
}

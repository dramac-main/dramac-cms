'use server'

/**
 * Live Chat Module — Message Actions
 *
 * Server actions for sending, retrieving, and managing chat messages.
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { mapRecord, mapRecords } from '../lib/map-db-record'
import type { ChatMessage, MessageStatus, MessageContentType, MessageSenderType } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient()
  return supabase as any
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getMessages(
  conversationId: string,
  page = 1,
  pageSize = 50
): Promise<{ messages: ChatMessage[]; total: number; error: string | null }> {
  try {
    const supabase = await getModuleClient()
    const offset = (page - 1) * pageSize

    const { data, count, error } = await supabase
      .from('mod_chat_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return {
      messages: mapRecords<ChatMessage>(data || []),
      total: count || 0,
      error: null,
    }
  } catch (error) {
    console.error('[LiveChat] Error getting messages:', error)
    return { messages: [], total: 0, error: (error as Error).message }
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function sendMessage(data: {
  conversationId: string
  siteId: string
  senderType: MessageSenderType
  senderId?: string
  senderName?: string
  senderAvatar?: string
  content: string
  contentType?: MessageContentType
  isInternalNote?: boolean
}): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const insertData: Record<string, unknown> = {
      conversation_id: data.conversationId,
      site_id: data.siteId,
      sender_type: data.senderType,
      content: data.content,
      content_type: data.contentType || 'text',
      status: 'sent',
      is_internal_note: data.isInternalNote || false,
    }

    if (data.senderId) insertData.sender_id = data.senderId
    if (data.senderName) insertData.sender_name = data.senderName
    if (data.senderAvatar) insertData.sender_avatar = data.senderAvatar
    if (data.isInternalNote) insertData.content_type = 'note'

    const { data: msgData, error } = await supabase
      .from('mod_chat_messages')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    // If first agent/AI message, calculate first_response_time
    if (data.senderType === 'agent' || data.senderType === 'ai') {
      const { data: conv } = await supabase
        .from('mod_chat_conversations')
        .select('first_response_time_seconds, status, created_at')
        .eq('id', data.conversationId)
        .single()

      if (conv) {
        const updates: Record<string, unknown> = {}

        if (conv.first_response_time_seconds === null) {
          updates.first_response_time_seconds = Math.floor(
            (Date.now() - new Date(conv.created_at).getTime()) / 1000
          )
        }

        if (conv.status === 'pending') {
          updates.status = 'active'
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('mod_chat_conversations')
            .update(updates)
            .eq('id', data.conversationId)
        }
      }
    }

    const message = mapRecord<ChatMessage>(msgData)
    return { message, error: null }
  } catch (error) {
    console.error('[LiveChat] Error sending message:', error)
    return { message: null, error: (error as Error).message }
  }
}

export async function sendFileMessage(data: {
  conversationId: string
  siteId: string
  senderType: MessageSenderType
  senderId?: string
  senderName?: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileMimeType: string
  contentType: MessageContentType
}): Promise<{ message: ChatMessage | null; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const insertData: Record<string, unknown> = {
      conversation_id: data.conversationId,
      site_id: data.siteId,
      sender_type: data.senderType,
      content_type: data.contentType,
      file_url: data.fileUrl,
      file_name: data.fileName,
      file_size: data.fileSize,
      file_mime_type: data.fileMimeType,
      status: 'sent',
    }

    if (data.senderId) insertData.sender_id = data.senderId
    if (data.senderName) insertData.sender_name = data.senderName

    const { data: msgData, error } = await supabase
      .from('mod_chat_messages')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error

    return { message: mapRecord<ChatMessage>(msgData), error: null }
  } catch (error) {
    console.error('[LiveChat] Error sending file message:', error)
    return { message: null, error: (error as Error).message }
  }
}

export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from('mod_chat_messages')
      .update({ status })
      .eq('id', messageId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error updating message status:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await getModuleClient()

    const { error } = await supabase
      .from('mod_chat_messages')
      .update({
        content: '[Message deleted]',
        file_url: null,
        file_name: null,
        file_size: null,
        file_mime_type: null,
      })
      .eq('id', messageId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('[LiveChat] Error deleting message:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Live Chat Messages API
 *
 * PHASE LC-04: Public endpoint for widget message sending/receiving
 *
 * POST — Send message from visitor
 * GET  — Fetch messages for a conversation (paginated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapRecord, mapRecords } from '@/modules/live-chat/lib/map-db-record'
import type { ChatMessage } from '@/modules/live-chat/types'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * POST /api/modules/live-chat/messages
 * Send a message from visitor in widget
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, visitorId, content, contentType, fileUrl, fileName, fileSize, fileMimeType } = body

    if (!conversationId || !visitorId || !content) {
      return NextResponse.json(
        { error: 'conversationId, visitorId, and content are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()

    // Validate visitor owns this conversation
    const { data: convData } = await (supabase as any)
      .from('mod_chat_conversations')
      .select('visitor_id, site_id')
      .eq('id', conversationId)
      .single()

    if (!convData || convData.visitor_id !== visitorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Get visitor name for message
    const { data: visitorData } = await (supabase as any)
      .from('mod_chat_visitors')
      .select('name')
      .eq('id', visitorId)
      .single()

    // Insert message
    const msgInsert: Record<string, unknown> = {
      conversation_id: conversationId,
      site_id: convData.site_id,
      sender_type: 'visitor',
      sender_id: visitorId,
      sender_name: visitorData?.name || 'Visitor',
      content,
      content_type: contentType || 'text',
      status: 'sent',
      is_internal_note: false,
    }

    if (fileUrl) msgInsert.file_url = fileUrl
    if (fileName) msgInsert.file_name = fileName
    if (fileSize) msgInsert.file_size = fileSize
    if (fileMimeType) msgInsert.file_mime_type = fileMimeType

    const { data: msgData, error: msgError } = await (supabase as any)
      .from('mod_chat_messages')
      .insert(msgInsert)
      .select()
      .single()

    if (msgError) throw msgError

    const message = mapRecord<ChatMessage>(msgData)

    // Update conversation
    await (supabase as any)
      .from('mod_chat_conversations')
      .update({
        last_message_text: content.substring(0, 255),
        last_message_at: new Date().toISOString(),
        last_message_by: 'visitor',
        unread_agent_count: (supabase as any).rpc
          ? undefined
          : 1,
      })
      .eq('id', conversationId)

    // Increment unread count via raw increment
    await (supabase as any).rpc('increment_field', {
      table_name: 'mod_chat_conversations',
      field_name: 'unread_agent_count',
      row_id: conversationId,
    }).catch(() => {
      // If RPC doesn't exist, use direct update (already handled above)
    })

    // Update message count
    const { data: countData } = await (supabase as any)
      .from('mod_chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (countData !== null) {
      await (supabase as any)
        .from('mod_chat_conversations')
        .update({ message_count: countData })
        .eq('id', conversationId)
    }

    return NextResponse.json(
      { message },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('[LiveChat Messages API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * GET /api/modules/live-chat/messages?conversationId=xxx&visitorId=xxx&page=1
 * Fetch messages for a conversation (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const visitorId = searchParams.get('visitorId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = 50

    if (!conversationId || !visitorId) {
      return NextResponse.json(
        { error: 'conversationId and visitorId are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()

    // Validate visitor owns this conversation
    const { data: convData } = await (supabase as any)
      .from('mod_chat_conversations')
      .select('visitor_id')
      .eq('id', conversationId)
      .single()

    if (!convData || convData.visitor_id !== visitorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403, headers: corsHeaders }
      )
    }

    const offset = (page - 1) * pageSize

    const { data: msgData, count, error } = await (supabase as any)
      .from('mod_chat_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const messages = mapRecords<ChatMessage>(msgData || [])

    return NextResponse.json(
      { messages, total: count || 0 },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[LiveChat Messages API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500, headers: corsHeaders }
    )
  }
}

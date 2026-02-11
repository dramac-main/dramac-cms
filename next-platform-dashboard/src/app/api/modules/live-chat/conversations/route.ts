/**
 * Live Chat Conversations API
 *
 * PHASE LC-04: Public endpoint for widget conversation management
 *
 * POST — Create new conversation + visitor from widget
 * GET  — Fetch conversation details + messages for widget display
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapRecord, mapRecords, toDbRecord } from '@/modules/live-chat/lib/map-db-record'
import type { ChatConversation, ChatMessage, ChatVisitor } from '@/modules/live-chat/types'

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
 * POST /api/modules/live-chat/conversations
 * Creates a new conversation + visitor from widget
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteId, visitorData, departmentId, initialMessage } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()

    // 1. Create or find existing visitor
    let visitorId: string

    // Check if visitor with this email already exists
    if (visitorData?.email) {
      const { data: existingVisitor } = await (supabase as any)
        .from('mod_chat_visitors')
        .select('id')
        .eq('site_id', siteId)
        .eq('email', visitorData.email)
        .eq('channel', 'widget')
        .maybeSingle()

      if (existingVisitor) {
        visitorId = existingVisitor.id

        // Update tracking data
        const updates: Record<string, unknown> = {
          last_seen_at: new Date().toISOString(),
          total_visits: (supabase as any).rpc ? undefined : 1, // increment handled below
        }
        if (visitorData.name) updates.name = visitorData.name
        if (visitorData.phone) updates.phone = visitorData.phone
        if (visitorData.browser) updates.browser = visitorData.browser
        if (visitorData.os) updates.os = visitorData.os
        if (visitorData.device) updates.device = visitorData.device
        if (visitorData.currentPageUrl) updates.current_page_url = visitorData.currentPageUrl
        if (visitorData.currentPageTitle) updates.current_page_title = visitorData.currentPageTitle
        if (visitorData.referrerUrl) updates.referrer_url = visitorData.referrerUrl

        await (supabase as any)
          .from('mod_chat_visitors')
          .update(updates)
          .eq('id', visitorId)
      } else {
        // Create new visitor
        const visitorInsert: Record<string, unknown> = {
          site_id: siteId,
          channel: 'widget',
          name: visitorData?.name || null,
          email: visitorData?.email || null,
          phone: visitorData?.phone || null,
          browser: visitorData?.browser || null,
          os: visitorData?.os || null,
          device: visitorData?.device || null,
          current_page_url: visitorData?.currentPageUrl || null,
          current_page_title: visitorData?.currentPageTitle || null,
          referrer_url: visitorData?.referrerUrl || null,
          landing_page_url: visitorData?.landingPageUrl || null,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          total_visits: 1,
          total_conversations: 0,
          total_messages: 0,
          tags: [],
          custom_data: {},
        }

        const { data: newVisitor, error: visitorError } = await (supabase as any)
          .from('mod_chat_visitors')
          .insert(visitorInsert)
          .select('id')
          .single()

        if (visitorError) throw visitorError
        visitorId = newVisitor.id
      }
    } else {
      // Create anonymous visitor
      const visitorInsert: Record<string, unknown> = {
        site_id: siteId,
        channel: 'widget',
        name: visitorData?.name || 'Visitor',
        browser: visitorData?.browser || null,
        os: visitorData?.os || null,
        device: visitorData?.device || null,
        current_page_url: visitorData?.currentPageUrl || null,
        current_page_title: visitorData?.currentPageTitle || null,
        referrer_url: visitorData?.referrerUrl || null,
        landing_page_url: visitorData?.landingPageUrl || null,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        total_visits: 1,
        total_conversations: 0,
        total_messages: 0,
        tags: [],
        custom_data: {},
      }

      const { data: newVisitor, error: visitorError } = await (supabase as any)
        .from('mod_chat_visitors')
        .insert(visitorInsert)
        .select('id')
        .single()

      if (visitorError) throw visitorError
      visitorId = newVisitor.id
    }

    // 2. Create conversation
    const convInsert: Record<string, unknown> = {
      site_id: siteId,
      visitor_id: visitorId,
      status: 'pending',
      channel: 'widget',
      priority: 'normal',
      message_count: 0,
      unread_agent_count: 0,
      unread_visitor_count: 0,
      tags: [],
      metadata: {},
    }

    if (departmentId) convInsert.department_id = departmentId

    // Auto-assign to available agent
    const { data: availableAgent } = await (supabase as any)
      .from('mod_chat_agents')
      .select('id')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .in('status', ['online', 'away'])
      .order('current_chat_count', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (availableAgent) {
      convInsert.assigned_agent_id = availableAgent.id
      convInsert.status = 'active'
    }

    const { data: convData, error: convError } = await (supabase as any)
      .from('mod_chat_conversations')
      .insert(convInsert)
      .select()
      .single()

    if (convError) throw convError

    const conversationId = convData.id

    // 3. Send initial message if provided
    if (initialMessage) {
      const msgInsert: Record<string, unknown> = {
        conversation_id: conversationId,
        site_id: siteId,
        sender_type: 'visitor',
        sender_id: visitorId,
        sender_name: visitorData?.name || 'Visitor',
        content: initialMessage,
        content_type: 'text',
        status: 'sent',
        is_internal_note: false,
      }

      await (supabase as any)
        .from('mod_chat_messages')
        .insert(msgInsert)

      // Update conversation last message
      await (supabase as any)
        .from('mod_chat_conversations')
        .update({
          last_message_text: initialMessage.substring(0, 255),
          last_message_at: new Date().toISOString(),
          last_message_by: 'visitor',
          message_count: 1,
          unread_agent_count: 1,
        })
        .eq('id', conversationId)

      // Update visitor stats
      await (supabase as any)
        .from('mod_chat_visitors')
        .update({
          total_conversations: 1,
          total_messages: 1,
        })
        .eq('id', visitorId)
    }

    return NextResponse.json(
      { conversationId, visitorId },
      { status: 201, headers: corsHeaders }
    )
  } catch (error) {
    console.error('[LiveChat Conversations API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * GET /api/modules/live-chat/conversations?conversationId=xxx&visitorId=xxx
 * Returns conversation details + messages for widget display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const visitorId = searchParams.get('visitorId')

    if (!conversationId || !visitorId) {
      return NextResponse.json(
        { error: 'conversationId and visitorId are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()

    // Fetch conversation and validate visitorId
    const { data: convData, error: convError } = await (supabase as any)
      .from('mod_chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError || !convData) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Security: validate visitor owns this conversation
    if (convData.visitor_id !== visitorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403, headers: corsHeaders }
      )
    }

    const conversation = mapRecord<ChatConversation>(convData)

    // Fetch messages
    const { data: msgData, count } = await (supabase as any)
      .from('mod_chat_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('is_internal_note', false) // Don't show internal notes to visitors
      .order('created_at', { ascending: true })

    const messages = mapRecords<ChatMessage>(msgData || [])

    // Mark visitor messages as read
    await (supabase as any)
      .from('mod_chat_conversations')
      .update({ unread_visitor_count: 0 })
      .eq('id', conversationId)

    return NextResponse.json(
      { conversation, messages, total: count || 0 },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[LiveChat Conversations API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500, headers: corsHeaders }
    )
  }
}

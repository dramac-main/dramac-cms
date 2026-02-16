/**
 * Live Chat Rating API
 *
 * PHASE LC-04: Public endpoint for visitor satisfaction rating
 * POST /api/modules/live-chat/rating
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyChatRating } from '@/modules/live-chat/lib/chat-notifications'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * POST /api/modules/live-chat/rating
 * Submit satisfaction rating from visitor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, visitorId, rating, comment } = body

    if (!conversationId || !visitorId || !rating) {
      return NextResponse.json(
        { error: 'conversationId, visitorId, and rating are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createAdminClient()

    // Fetch full conversation details for validation + notification
    const { data: convData } = await (supabase as any)
      .from('mod_chat_conversations')
      .select('visitor_id, site_id, assigned_agent_id')
      .eq('id', conversationId)
      .single()

    if (!convData || convData.visitor_id !== visitorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Update conversation with rating
    const { error } = await (supabase as any)
      .from('mod_chat_conversations')
      .update({
        rating,
        rating_comment: comment || null,
        rated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    if (error) throw error

    // Send notification to the assigned agent (and site owner for low ratings)
    try {
      // Fetch visitor name for the notification
      let visitorName: string | undefined
      const { data: visitor } = await (supabase as any)
        .from('mod_chat_visitors')
        .select('name')
        .eq('id', visitorId)
        .single()
      visitorName = visitor?.name || undefined

      // Fetch agent profile if assigned
      let agentName: string | undefined
      let agentUserId: string | undefined
      if (convData.assigned_agent_id) {
        const { data: agent } = await (supabase as any)
          .from('mod_chat_agents')
          .select('user_id, display_name')
          .eq('id', convData.assigned_agent_id)
          .single()
        if (agent) {
          agentUserId = agent.user_id
          agentName = agent.display_name || undefined
        }
      }

      await notifyChatRating({
        siteId: convData.site_id,
        conversationId,
        visitorName,
        agentName,
        agentUserId,
        rating,
        comment: comment || undefined,
      })
    } catch (notifyError) {
      // Notification failure should not fail the rating submission
      console.error('[LiveChat Rating API] Notification error:', notifyError)
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[LiveChat Rating API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500, headers: corsHeaders }
    )
  }
}

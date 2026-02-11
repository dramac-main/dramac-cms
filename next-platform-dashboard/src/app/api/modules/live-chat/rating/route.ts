/**
 * Live Chat Rating API
 *
 * PHASE LC-04: Public endpoint for visitor satisfaction rating
 * POST /api/modules/live-chat/rating
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

/**
 * AI Agent Approvals API Routes
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * GET /api/sites/[siteId]/ai-agents/approvals - List approvals
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // Cast to any since AI agent tables aren't in TypeScript types yet
    let query = (supabase as any)
      .from('ai_agent_approvals')
      .select(`
        id,
        agent_id,
        execution_id,
        tool_name,
        tool_input,
        reason,
        status,
        created_at,
        expires_at,
        reviewed_at,
        reviewed_by,
        agent:ai_agents(id, name)
      `, { count: 'exact' })
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      approvals: data || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

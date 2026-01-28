/**
 * AI Agent Executions API Route
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * GET /api/sites/[siteId]/ai-agents/[agentId]/executions - Get executions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAgentExecutions } from '@/lib/ai-agents/execution-actions'
import type { ExecutionStatus } from '@/lib/ai-agents/types'

const VALID_STATUSES = ['pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled', 'timed_out']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; agentId: string }> }
) {
  try {
    const { agentId } = await params
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const statusParam = searchParams.get('status')
    
    // Validate status is a valid ExecutionStatus
    const status = statusParam && VALID_STATUSES.includes(statusParam) 
      ? statusParam as ExecutionStatus 
      : undefined

    const result = await getAgentExecutions(agentId, {
      limit,
      offset,
      status,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    )
  }
}

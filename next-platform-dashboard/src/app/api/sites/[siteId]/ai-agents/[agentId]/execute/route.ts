/**
 * AI Agent Execution API Route
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * POST /api/sites/[siteId]/ai-agents/[agentId]/execute - Execute agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAgent } from '@/lib/ai-agents/actions'
import { startAgentExecution } from '@/lib/ai-agents/execution-actions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; agentId: string }> }
) {
  try {
    const { siteId, agentId } = await params
    const body = await request.json()

    // Validate agent exists
    const agent = await getAgent(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check if agent is active
    if (!agent.isActive) {
      return NextResponse.json(
        { error: 'Agent is not active' },
        { status: 400 }
      )
    }

    // Start execution
    const result = await startAgentExecution(agentId, {
      message: body.input || body.message || '',
      context: body.context || {},
      triggerData: body.triggerData || { triggerType: 'manual' },
    })

    return NextResponse.json(result, { status: 202 })
  } catch (error) {
    console.error('Error executing agent:', error)
    return NextResponse.json(
      { error: 'Failed to execute agent' },
      { status: 500 }
    )
  }
}

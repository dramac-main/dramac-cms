/**
 * AI Agent Detail API Routes
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * GET /api/sites/[siteId]/ai-agents/[agentId] - Get agent
 * PUT /api/sites/[siteId]/ai-agents/[agentId] - Update agent
 * DELETE /api/sites/[siteId]/ai-agents/[agentId] - Delete agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAgent, updateAgent, deleteAgent } from '@/lib/ai-agents/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; agentId: string }> }
) {
  try {
    const { agentId } = await params
    const agent = await getAgent(agentId)

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; agentId: string }> }
) {
  try {
    const { agentId } = await params
    const body = await request.json()

    const agent = await updateAgent(agentId, {
      name: body.name,
      description: body.description,
      systemPrompt: body.systemPrompt,
      modelProvider: body.modelProvider,
      modelId: body.modelId,
      allowedTools: body.allowedTools,
      deniedTools: body.deniedTools,
      constraints: body.constraints,
      maxTokensPerRun: body.maxTokensPerRun,
      maxActionsPerRun: body.maxActionsPerRun,
      isActive: body.isActive,
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string; agentId: string }> }
) {
  try {
    const { agentId } = await params
    await deleteAgent(agentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}

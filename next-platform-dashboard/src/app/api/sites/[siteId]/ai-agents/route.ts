/**
 * AI Agents API Routes
 * 
 * Phase EM-58C: AI Agents - Real-World Integration
 * 
 * GET /api/sites/[siteId]/ai-agents - List agents
 * POST /api/sites/[siteId]/ai-agents - Create agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAgents, createAgent } from '@/lib/ai-agents/actions'
import type { AgentType } from '@/lib/ai-agents/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') as AgentType | null
    const active = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getAgents(siteId, {
      type: type || undefined,
      active: active ? active === 'true' : undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.type || !body.systemPrompt) {
      return NextResponse.json(
        { error: 'Name, type, and systemPrompt are required' },
        { status: 400 }
      )
    }

    const agent = await createAgent(siteId, {
      name: body.name,
      type: body.type,
      description: body.description,
      systemPrompt: body.systemPrompt,
      modelProvider: body.modelProvider,
      modelId: body.modelId,
      goals: body.goals,
      allowedTools: body.allowedTools,
      deniedTools: body.deniedTools,
      constraints: body.constraints,
      maxTokensPerRun: body.maxTokensPerRun,
      maxActionsPerRun: body.maxActionsPerRun,
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}

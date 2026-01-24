/**
 * CRM Module API - Pipeline Stages
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStagesForPipeline, createPipelineStage } from '@/modules/crm/actions/crm-actions'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id: pipelineId } = await params
    
    const stages = await getStagesForPipeline(pipelineId)
    
    return NextResponse.json({ data: stages })
  } catch (error) {
    console.error('CRM API - Get stages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id: pipelineId } = await params
    const body = await request.json()
    const { site_id, ...stageData } = body
    
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    if (!stageData.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    
    const stage = await createPipelineStage(site_id, pipelineId, stageData)
    
    if (!stage) {
      return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 })
    }
    
    return NextResponse.json({ data: stage }, { status: 201 })
  } catch (error) {
    console.error('CRM API - Create stage error:', error)
    return NextResponse.json(
      { error: 'Failed to create stage' },
      { status: 500 }
    )
  }
}

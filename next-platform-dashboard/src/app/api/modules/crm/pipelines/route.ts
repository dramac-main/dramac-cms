/**
 * CRM Module API - Pipelines
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPipelines, createPipeline } from '@/modules/crm/actions/crm-actions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const siteId = request.nextUrl.searchParams.get('site_id')
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    const pipelines = await getPipelines(siteId)
    
    return NextResponse.json({ data: pipelines })
  } catch (error) {
    console.error('CRM API - Get pipelines error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { site_id, ...pipelineData } = body
    
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    if (!pipelineData.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    
    const pipeline = await createPipeline(site_id, pipelineData)
    
    if (!pipeline) {
      return NextResponse.json({ error: 'Failed to create pipeline' }, { status: 500 })
    }
    
    return NextResponse.json({ data: pipeline }, { status: 201 })
  } catch (error) {
    console.error('CRM API - Create pipeline error:', error)
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    )
  }
}

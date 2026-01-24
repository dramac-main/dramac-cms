/**
 * CRM Module API - Move Deal to Stage
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { moveDealToStage } from '@/modules/crm/actions/crm-actions'

interface RouteParams {
  params: Promise<{ id: string }>
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
    
    const { id } = await params
    const body = await request.json()
    const { stage_id, position } = body
    
    if (!stage_id) {
      return NextResponse.json({ error: 'stage_id is required' }, { status: 400 })
    }
    
    const deal = await moveDealToStage(id, stage_id, position)
    
    if (!deal) {
      return NextResponse.json({ error: 'Failed to move deal' }, { status: 500 })
    }
    
    return NextResponse.json({ data: deal })
  } catch (error) {
    console.error('CRM API - Move deal error:', error)
    return NextResponse.json(
      { error: 'Failed to move deal' },
      { status: 500 }
    )
  }
}

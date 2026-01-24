/**
 * CRM Module API - Deals
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * REST API endpoints for deal management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeals, createDeal } from '@/modules/crm/actions/crm-actions'

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
    
    const deals = await getDeals(siteId)
    
    return NextResponse.json({ data: deals })
  } catch (error) {
    console.error('CRM API - Get deals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
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
    const { site_id, ...dealData } = body
    
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    if (!dealData.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    
    if (!dealData.pipeline_id) {
      return NextResponse.json({ error: 'pipeline_id is required' }, { status: 400 })
    }
    
    if (!dealData.stage_id) {
      return NextResponse.json({ error: 'stage_id is required' }, { status: 400 })
    }
    
    const deal = await createDeal(site_id, dealData)
    
    if (!deal) {
      return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
    }
    
    return NextResponse.json({ data: deal }, { status: 201 })
  } catch (error) {
    console.error('CRM API - Create deal error:', error)
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    )
  }
}

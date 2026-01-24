/**
 * CRM Module API - Deal by ID
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDeal, updateDeal, deleteDeal } from '@/modules/crm/actions/crm-actions'

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
    
    const { id } = await params
    const siteId = request.nextUrl.searchParams.get('site_id')
    
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    const deal = await getDeal(siteId, id)
    
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }
    
    return NextResponse.json({ data: deal })
  } catch (error) {
    console.error('CRM API - Get deal error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { site_id, ...updateData } = body
    
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    const deal = await updateDeal(site_id, id, updateData)
    
    if (!deal) {
      return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
    }
    
    return NextResponse.json({ data: deal })
  } catch (error) {
    console.error('CRM API - Update deal error:', error)
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const siteId = request.nextUrl.searchParams.get('site_id')
    
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    await deleteDeal(siteId, id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM API - Delete deal error:', error)
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    )
  }
}

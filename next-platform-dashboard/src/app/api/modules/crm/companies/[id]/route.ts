/**
 * CRM Module API - Company by ID
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompany, updateCompany, deleteCompany } from '@/modules/crm/actions/crm-actions'

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
    
    const company = await getCompany(siteId, id)
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    return NextResponse.json({ data: company })
  } catch (error) {
    console.error('CRM API - Get company error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
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
    
    const company = await updateCompany(site_id, id, updateData)
    
    if (!company) {
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }
    
    return NextResponse.json({ data: company })
  } catch (error) {
    console.error('CRM API - Update company error:', error)
    return NextResponse.json(
      { error: 'Failed to update company' },
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
    
    await deleteCompany(siteId, id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM API - Delete company error:', error)
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}

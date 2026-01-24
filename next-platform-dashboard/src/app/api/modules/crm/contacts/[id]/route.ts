/**
 * CRM Module API - Contact by ID
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * REST API endpoints for individual contact operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getContact, updateContact, deleteContact } from '@/modules/crm/actions/crm-actions'

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
    
    const contact = await getContact(siteId, id)
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    
    return NextResponse.json({ data: contact })
  } catch (error) {
    console.error('CRM API - Get contact error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
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
    
    const contact = await updateContact(site_id, id, updateData)
    
    if (!contact) {
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }
    
    return NextResponse.json({ data: contact })
  } catch (error) {
    console.error('CRM API - Update contact error:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
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
    
    await deleteContact(siteId, id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CRM API - Delete contact error:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}

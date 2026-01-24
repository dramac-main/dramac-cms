/**
 * CRM Module API - Contacts
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * REST API endpoints for contact management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getContacts, createContact } from '@/modules/crm/actions/crm-actions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get site_id from query params
    const siteId = request.nextUrl.searchParams.get('site_id')
    if (!siteId) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    const contacts = await getContacts(siteId)
    
    return NextResponse.json({ data: contacts })
  } catch (error) {
    console.error('CRM API - Get contacts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
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
    const { site_id, ...contactData } = body
    
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    if (!contactData.first_name) {
      return NextResponse.json({ error: 'first_name is required' }, { status: 400 })
    }
    
    if (!contactData.email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }
    
    const contact = await createContact(site_id, contactData)
    
    if (!contact) {
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }
    
    return NextResponse.json({ data: contact }, { status: 201 })
  } catch (error) {
    console.error('CRM API - Create contact error:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}

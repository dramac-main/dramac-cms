/**
 * CRM Module API - Companies
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * REST API endpoints for company management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanies, createCompany } from '@/modules/crm/actions/crm-actions'

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
    
    const companies = await getCompanies(siteId)
    
    return NextResponse.json({ data: companies })
  } catch (error) {
    console.error('CRM API - Get companies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
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
    const { site_id, ...companyData } = body
    
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    if (!companyData.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    
    const company = await createCompany(site_id, companyData)
    
    if (!company) {
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }
    
    return NextResponse.json({ data: company }, { status: 201 })
  } catch (error) {
    console.error('CRM API - Create company error:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}

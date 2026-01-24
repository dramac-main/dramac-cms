/**
 * CRM Module API - Global Search
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { globalSearch } from '@/modules/crm/actions/crm-actions'

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
    
    const query = request.nextUrl.searchParams.get('q')
    if (!query) {
      return NextResponse.json({ error: 'q (search query) is required' }, { status: 400 })
    }
    
    const results = await globalSearch(siteId, query)
    
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('CRM API - Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}

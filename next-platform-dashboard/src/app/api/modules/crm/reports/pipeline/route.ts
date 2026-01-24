/**
 * CRM Module API - Pipeline Report
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPipelineReport } from '@/modules/crm/actions/crm-actions'

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
    
    const pipelineId = request.nextUrl.searchParams.get('pipeline_id')
    if (!pipelineId) {
      return NextResponse.json({ error: 'pipeline_id is required' }, { status: 400 })
    }
    
    const report = await getPipelineReport(siteId, pipelineId)
    
    return NextResponse.json({ data: report })
  } catch (error) {
    console.error('CRM API - Pipeline report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

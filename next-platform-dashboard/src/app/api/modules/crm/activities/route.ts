/**
 * CRM Module API - Activities
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActivities, createActivity } from '@/modules/crm/actions/crm-actions'

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
    
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100')
    
    const activities = await getActivities(siteId, limit)
    
    return NextResponse.json({ data: activities })
  } catch (error) {
    console.error('CRM API - Get activities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
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
    const { site_id, ...activityData } = body
    
    if (!site_id) {
      return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    }
    
    if (!activityData.activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 })
    }
    
    const activity = await createActivity(site_id, activityData)
    
    if (!activity) {
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }
    
    return NextResponse.json({ data: activity }, { status: 201 })
  } catch (error) {
    console.error('CRM API - Create activity error:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

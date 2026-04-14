/**
 * Paddle Usage API Route
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * GET - Get current usage and limits
 * 
 * GET /api/billing/paddle/usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageTracker } from '@/lib/paddle/usage-tracker';
import { isPaddleConfigured } from '@/lib/paddle/client';

/**
 * GET - Get current period usage
 */
export async function GET(request: NextRequest) {
  if (!isPaddleConfigured) {
    return NextResponse.json(
      { error: 'Paddle billing is not configured' },
      { status: 503 }
    );
  }
  
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get agency ID from query or user profile
    const { searchParams } = new URL(request.url);
    let agencyId: string | null = searchParams.get('agencyId');
    const includeHistory = searchParams.get('history') === 'true';
    const includeBySite = searchParams.get('bySite') === 'true';
    
    if (!agencyId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user.id)
        .maybeSingle();
      
      agencyId = profile?.agency_id ?? null;
    }
    
    if (!agencyId) {
      return NextResponse.json(
        { error: 'No agency found' },
        { status: 400 }
      );
    }
    
    // Verify user belongs to agency
    const { data: membership } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized for this agency' },
        { status: 403 }
      );
    }
    
    // Get current usage
    const usage = await usageTracker.getCurrentUsage(agencyId);
    
    if (!usage) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No active subscription',
      });
    }
    
    // Build response
    const response: any = {
      success: true,
      data: {
        current: usage,
        alerts: await usageTracker.getUsageAlerts(agencyId),
      },
    };
    
    // Include history if requested
    if (includeHistory) {
      response.data.history = await usageTracker.getUsageHistory(agencyId, 30);
    }
    
    // Include breakdown by site if requested
    if (includeBySite) {
      response.data.bySite = await usageTracker.getUsageBySite(agencyId);
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[Paddle Usage] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get usage' },
      { status: 500 }
    );
  }
}

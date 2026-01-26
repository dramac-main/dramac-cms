/**
 * Paddle Billing Overview API Route
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * GET - Get complete billing overview (subscription, usage, invoices, products)
 * 
 * GET /api/billing/paddle
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { isPaddleConfigured } from '@/lib/paddle/client';

/**
 * GET - Get complete billing overview
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
    
    // Get complete billing overview
    const overview = await subscriptionService.getBillingOverview(agencyId);
    
    return NextResponse.json({
      success: true,
      data: overview,
    });
    
  } catch (error) {
    console.error('[Paddle Overview] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get billing overview' },
      { status: 500 }
    );
  }
}

/**
 * Paddle Subscription API Route
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * GET - Get subscription details
 * POST - Manage subscription (cancel, pause, resume, change plan)
 * 
 * GET/POST /api/billing/paddle/subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { isPaddleConfigured } from '@/lib/paddle/client';

/**
 * GET - Get subscription details for current user's agency
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
      // Get from user profile
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
    
    // Get subscription
    const subscription = await subscriptionService.getSubscription(agencyId);
    
    return NextResponse.json({
      success: true,
      data: subscription,
    });
    
  } catch (error) {
    console.error('[Paddle Subscription GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST - Manage subscription
 * Actions: cancel, pause, resume, undoCancel, changePlan
 */
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { action, agencyId, ...params } = body;
    
    if (!action || !agencyId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, agencyId' },
        { status: 400 }
      );
    }
    
    // Verify user belongs to agency with admin/owner role
    const { data: membership } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin access required to manage subscription' },
        { status: 403 }
      );
    }
    
    // Handle actions
    switch (action) {
      case 'cancel':
        await subscriptionService.cancelSubscription(
          agencyId,
          params.immediately === true
        );
        break;
      
      case 'pause':
        await subscriptionService.pauseSubscription(agencyId);
        break;
      
      case 'resume':
        await subscriptionService.resumeSubscription(agencyId);
        break;
      
      case 'undoCancel':
        await subscriptionService.undoCancelSubscription(agencyId);
        break;
      
      case 'changePlan':
        if (!params.planType || !params.billingCycle) {
          return NextResponse.json(
            { error: 'Missing planType or billingCycle for plan change' },
            { status: 400 }
          );
        }
        await subscriptionService.changePlan(
          agencyId,
          params.planType,
          params.billingCycle,
          params.prorate !== false
        );
        break;
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    // Get updated subscription
    const subscription = await subscriptionService.getSubscription(agencyId);
    
    return NextResponse.json({
      success: true,
      message: `Subscription ${action} successful`,
      data: subscription,
    });
    
  } catch (error) {
    console.error('[Paddle Subscription POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

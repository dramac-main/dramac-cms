/**
 * Pause Subscription API Route
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * POST /api/billing/paddle/subscription/pause
 * 
 * Pauses the subscription at the end of the current billing period.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { isPaddleConfigured } from '@/lib/paddle/client';

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
    
    // Get agency ID
    const { data: member } = await supabase
      .from('agency_members')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .single();
    
    if (!member || member.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can pause subscriptions' },
        { status: 403 }
      );
    }
    
    // Pause subscription
    await subscriptionService.pauseSubscription(member.agency_id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error pausing subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to pause subscription' },
      { status: 500 }
    );
  }
}

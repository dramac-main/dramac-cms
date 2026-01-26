/**
 * Update Payment Method API Route
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * POST /api/billing/paddle/subscription/update-payment
 * 
 * Returns a URL to update the payment method via Paddle.
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
        { error: 'Only agency owners can update payment methods' },
        { status: 403 }
      );
    }
    
    // Get update payment URL
    const url = await subscriptionService.getUpdatePaymentUrl(member.agency_id);
    
    if (!url) {
      return NextResponse.json(
        { error: 'Unable to generate payment update URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[API] Error getting update payment URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get payment update URL' },
      { status: 500 }
    );
  }
}

/**
 * Paddle Checkout API Route
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * Creates checkout session data for Paddle.js frontend
 * 
 * POST /api/billing/paddle/checkout
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
    
    // Get request body
    const body = await request.json();
    const { planType, billingCycle, agencyId } = body;
    
    if (!planType || !billingCycle || !agencyId) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, billingCycle, agencyId' },
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
    
    // Check for existing active subscription
    const existingSub = await subscriptionService.getSubscription(agencyId);
    if (existingSub && existingSub.status === 'active') {
      return NextResponse.json(
        { error: 'Agency already has an active subscription. Use plan change instead.' },
        { status: 400 }
      );
    }
    
    // Get checkout data
    const checkoutData = await subscriptionService.getCheckoutData({
      agencyId,
      email: user.email!,
      planType,
      billingCycle,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        priceId: checkoutData.priceId,
        customerId: checkoutData.customerId,
        customerEmail: checkoutData.customerEmail,
        agencyId: checkoutData.agencyId,
        // Client token for Paddle.js is from env
        clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      },
    });
    
  } catch (error) {
    console.error('[Paddle Checkout] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout' },
      { status: 500 }
    );
  }
}

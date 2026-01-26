/**
 * Paddle Webhook API Route
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * Handles all incoming webhooks from Paddle:
 * - Verifies webhook signature
 * - Logs webhook for debugging/replay
 * - Processes event through handlers
 * 
 * Webhook URL to configure in Paddle: https://your-domain.com/api/webhooks/paddle
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { paddle, isPaddleConfigured } from '@/lib/paddle/client';
import { handlePaddleEvent } from '@/lib/paddle/webhook-handlers';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  // Check if Paddle is configured
  if (!isPaddleConfigured || !paddle) {
    console.error('[Paddle Webhook] Paddle is not configured');
    return NextResponse.json(
      { error: 'Paddle not configured' },
      { status: 500 }
    );
  }
  
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature');
    
    if (!signature) {
      console.error('[Paddle Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Paddle Webhook] PADDLE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    let event;
    try {
      // Parse and verify the webhook (unmarshal is async)
      event = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
    } catch (e) {
      console.error('[Paddle Webhook] Invalid signature:', e);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const supabase = createAdminClient();
    
    // Log webhook for debugging and potential replay
    // Note: paddle_webhooks table requires migration to be run first
    const { error: logError } = await (supabase as any)
      .from('paddle_webhooks')
      .insert({
        paddle_event_id: event.eventId,
        event_type: event.eventType,
        payload: event.data,
        occurred_at: event.occurredAt,
        received_at: new Date().toISOString(),
      });
    
    if (logError) {
      // Log but don't fail - might be duplicate
      console.warn('[Paddle Webhook] Error logging webhook:', logError);
    }
    
    // Process event
    try {
      await handlePaddleEvent(event);
      
      // Mark as processed
      await (supabase as any)
        .from('paddle_webhooks')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('paddle_event_id', event.eventId);
      
      console.log(`[Paddle Webhook] Successfully processed: ${event.eventType}`);
      
    } catch (processError) {
      console.error('[Paddle Webhook] Processing error:', processError);
      
      // Record error but still acknowledge receipt
      await (supabase as any)
        .from('paddle_webhooks')
        .update({
          error: processError instanceof Error ? processError.message : 'Unknown error',
        })
        .eq('paddle_event_id', event.eventId);
      
      // Still return 200 to acknowledge receipt
      // We can retry from our logs if needed
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('[Paddle Webhook] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

// Paddle sends GET requests to verify webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Paddle webhook endpoint is active',
    configured: isPaddleConfigured,
  });
}

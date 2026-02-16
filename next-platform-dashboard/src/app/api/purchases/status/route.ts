import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/purchases/status
 * 
 * Query params:
 *   - purchase_id: UUID of pending_purchases record
 *   - transaction_id: Paddle transaction ID
 * 
 * Returns purchase status from DM-12 pending_purchases table
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const purchaseId = searchParams.get('purchase_id');
    const transactionId = searchParams.get('transaction_id');

    if (!purchaseId && !transactionId) {
      return NextResponse.json(
        { error: 'Missing purchase_id or transaction_id parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Query pending_purchases table (DM-12 schema)
    let query = (supabase as any)
      .from('pending_purchases')
      .select('*');

    if (purchaseId) {
      query = query.eq('id', purchaseId);
    } else if (transactionId) {
      query = query.eq('paddle_transaction_id', transactionId);
    }

    const { data: purchase, error } = await query.maybeSingle();

    if (error) {
      console.error('[API] Purchase status query error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Parse purchase_data for additional details
    const p = purchase as Record<string, any>;

    // Build response with rich status information
    const response = {
      id: p.id,
      purchase_type: p.purchase_type,
      status: p.status,
      // Amounts — DB stores as dollars (not cents)
      wholesale_amount: parseFloat(p.wholesale_amount || '0'),
      retail_amount: parseFloat(p.retail_amount || '0'),
      currency: p.currency,
      // Transaction details
      paddle_transaction_id: p.paddle_transaction_id,
      paddle_checkout_url: p.paddle_checkout_url,
      // Provisioning details
      provisioned_resource_id: p.provisioned_resource_id,
      provisioned_at: p.provisioned_at,
      resellerclub_order_id: p.resellerclub_order_id,
      // Error details
      error_message: p.error_message,
      error_details: p.error_details,
      retry_count: p.retry_count,
      // Purchase-specific data
      purchase_data: p.purchase_data || {},
      // Timestamps
      created_at: p.created_at,
      updated_at: p.updated_at,
      expires_at: p.expires_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Purchase status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

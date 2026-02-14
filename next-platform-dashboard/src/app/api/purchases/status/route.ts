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
    let query = supabase
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
    const purchaseData = (purchase.purchase_data || {}) as Record<string, unknown>;

    // Build response with rich status information
    const response = {
      id: purchase.id,
      purchase_type: purchase.purchase_type,
      status: purchase.status,
      // Amounts in cents
      wholesale_amount: Math.round(parseFloat(purchase.wholesale_amount) * 100),
      retail_amount: Math.round(parseFloat(purchase.retail_amount) * 100),
      currency: purchase.currency,
      // Transaction details
      paddle_transaction_id: purchase.paddle_transaction_id,
      paddle_checkout_url: purchase.paddle_checkout_url,
      // Provisioning details
      provisioned_resource_id: purchase.provisioned_resource_id,
      provisioned_at: purchase.provisioned_at,
      resellerclub_order_id: purchase.resellerclub_order_id,
      // Error details
      error_message: purchase.error_message,
      error_details: purchase.error_details,
      retry_count: purchase.retry_count,
      // Purchase-specific data
      purchase_data: purchaseData,
      // Timestamps
      created_at: purchase.created_at,
      updated_at: purchase.updated_at,
      expires_at: purchase.expires_at,
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

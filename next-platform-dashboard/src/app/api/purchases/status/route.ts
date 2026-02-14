import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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

    // Query pending purchases table
    let query = supabase
      .from('paddle_pending_purchases')
      .select('*')
      .single();

    if (purchaseId) {
      query = query.eq('id', purchaseId);
    } else if (transactionId) {
      query = query.eq('transaction_id', transactionId);
    }

    const { data: purchase, error } = await query;

    if (error || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Parse metadata
    const metadata = purchase.metadata as Record<string, unknown>;

    // Build response
    const response = {
      id: purchase.id,
      type: purchase.item_type,
      status: purchase.status,
      domainName: metadata.domainName as string | undefined,
      years: metadata.years as number | undefined,
      amount: purchase.amount / 100, // Convert cents to dollars
      error: purchase.error_message,
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

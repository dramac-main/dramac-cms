import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/purchases/retry
 * 
 * Body: { purchase_id: string }
 * 
 * Re-triggers provisioning for a failed purchase.
 * Only the user who created the purchase (or an admin) can retry.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const purchaseId = body.purchase_id;

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Missing purchase_id' },
        { status: 400 }
      );
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get the pending purchase
    const { data: purchase, error: fetchError } = await (supabase as any)
      .from('pending_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (fetchError || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Verify ownership — user must be the one who made the purchase
    if (purchase.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to retry this purchase' },
        { status: 403 }
      );
    }

    // Can only retry failed purchases
    if (purchase.status !== 'failed') {
      return NextResponse.json(
        { error: `Cannot retry purchase with status: ${purchase.status}` },
        { status: 400 }
      );
    }

    // Check retry limit (max 5 retries)
    const retryCount = purchase.retry_count || 0;
    if (retryCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum retry attempts reached. Please contact support.' },
        { status: 400 }
      );
    }

    // Import provisioning functions
    const { updatePendingPurchaseStatus } = await import('@/lib/paddle/transactions');
    const { 
      provisionDomainRegistration, 
      provisionDomainRenewal, 
      provisionEmailOrder,
      provisionDomainTransfer,
    } = await import('@/lib/resellerclub/provisioning');

    // Reset status to 'paid' to allow re-provisioning
    await updatePendingPurchaseStatus(purchaseId, 'paid', {
      error_message: null,
      error_details: null,
    });

    // Provision based on purchase type
    let result;
    const purchaseType = purchase.purchase_type as string;

    if (purchaseType === 'domain_register') {
      result = await provisionDomainRegistration(purchaseId);
    } else if (purchaseType === 'domain_renew') {
      result = await provisionDomainRenewal(purchaseId);
    } else if (purchaseType === 'domain_transfer') {
      result = await provisionDomainTransfer(purchaseId);
    } else if (purchaseType === 'email_order') {
      result = await provisionEmailOrder(purchaseId);
    } else {
      return NextResponse.json(
        { error: `Unknown purchase type: ${purchaseType}` },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        resourceId: result.resourceId,
        message: 'Provisioning completed successfully',
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Provisioning failed. Please try again or contact support.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Purchase retry error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

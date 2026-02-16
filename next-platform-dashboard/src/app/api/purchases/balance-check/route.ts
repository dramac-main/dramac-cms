import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/purchases/balance-check
 * 
 * Pre-flight check: verifies the reseller has sufficient ResellerClub balance
 * to fulfill a domain/email order BEFORE showing the Paddle checkout.
 * 
 * Industry standard: WHMCS, cPanel Store, and other reseller platforms
 * check balance availability before accepting customer payment.
 * 
 * Request body:
 *   - wholesaleAmount: number (the RC cost of the order)
 *   - purchaseType: string (domain_register, domain_renew, email_order, etc.)
 *   - domainName: string (for logging)
 * 
 * Response:
 *   - available: boolean (whether the order can proceed)
 *   - message: string (user-friendly message)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { wholesaleAmount, purchaseType, domainName } = body;

    if (typeof wholesaleAmount !== 'number' || wholesaleAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid wholesaleAmount' },
        { status: 400 }
      );
    }

    // Perform the balance check
    const { checkResellerBalance } = await import('@/lib/paddle/transactions');
    const result = await checkResellerBalance(wholesaleAmount);

    if (!result.sufficient) {
      console.warn(
        `[Balance Check] Insufficient for ${purchaseType} ${domainName}: ` +
        `balance $${result.balance.toFixed(2)}, needed $${result.required.toFixed(2)}`
      );
    }

    return NextResponse.json({
      available: result.sufficient,
      message: result.sufficient
        ? 'Order can proceed'
        : 'This product is temporarily unavailable. Please try again later or contact support.',
      // Don't expose exact balance to end users — security risk
    });
  } catch (error) {
    console.error('[Balance Check API] Error:', error);
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 500 }
    );
  }
}

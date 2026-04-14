/**
 * Abandoned Cart Recovery Cron Endpoint
 * 
 * Phase ECOM-61: Abandoned Cart Recovery
 * 
 * Processes abandoned carts and sends recovery emails.
 * Called by the unified cron handler (/api/cron).
 */

import { NextRequest, NextResponse } from 'next/server'
import { runCartRecoveryAutomation } from '@/modules/ecommerce/lib/cart-recovery-automation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runCartRecoveryAutomation()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CartRecoveryCron] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

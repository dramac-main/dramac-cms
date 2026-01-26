/**
 * Paddle Products API Route
 * 
 * Phase EM-59: Paddle Billing Integration
 * 
 * GET - Get available products/pricing
 * 
 * GET /api/billing/paddle/products
 */

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { isPaddleConfigured, PLAN_CONFIGS } from '@/lib/paddle/client';

/**
 * GET - Get available products/pricing
 * Public endpoint - no auth required
 */
export async function GET(request: NextRequest) {
  try {
    // Get products from database
    const products = await subscriptionService.getProducts();
    
    // Also include client-side plan configs
    const planConfigs = Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
      slug: key,
      ...config,
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        products,
        planConfigs,
        paddleConfigured: isPaddleConfigured,
      },
    });
    
  } catch (error) {
    console.error('[Paddle Products] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get products' },
      { status: 500 }
    );
  }
}

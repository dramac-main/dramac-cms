/**
 * Paddle Price Verification API Route
 * 
 * Phase EM-59B: Paddle Billing Integration - Debugging
 * 
 * GET /api/billing/paddle/verify-price?priceId=xxx
 * 
 * Verifies a price ID exists in Paddle and returns its details.
 * Useful for debugging 400 errors during checkout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { paddle, isPaddleConfigured } from '@/lib/paddle/client';

export async function GET(request: NextRequest) {
  if (!isPaddleConfigured) {
    return NextResponse.json(
      { error: 'Paddle billing is not configured' },
      { status: 503 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const priceId = searchParams.get('priceId');
  
  if (!priceId) {
    return NextResponse.json(
      { error: 'priceId query parameter is required' },
      { status: 400 }
    );
  }
  
  if (!paddle) {
    return NextResponse.json(
      { error: 'Paddle client not initialized' },
      { status: 503 }
    );
  }
  
  try {
    // Try to get the price from Paddle
    const price = await paddle.prices.get(priceId);
    
    return NextResponse.json({
      success: true,
      message: 'Price found in Paddle',
      data: {
        id: price.id,
        productId: price.productId,
        description: price.description,
        status: price.status,
        billingCycle: price.billingCycle,
        unitPrice: price.unitPrice,
        trialPeriod: price.trialPeriod,
        taxMode: price.taxMode,
        createdAt: price.createdAt,
        updatedAt: price.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[Paddle Verify Price] Error:', error);
    
    // Check if it's a Paddle API error
    if (error?.code) {
      return NextResponse.json({
        success: false,
        error: 'Paddle API Error',
        details: {
          code: error.code,
          message: error.message,
          detail: error.detail,
          type: error.type,
        },
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to verify price',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Phase EM-31: Embed Verification API
 * Verifies if an origin is allowed to embed a module
 * 
 * POST /api/embed/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkOriginAllowed } from '@/lib/modules/external/domain-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, moduleId, origin } = body;

    if (!siteId || !moduleId || !origin) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, moduleId, origin' },
        { status: 400 }
      );
    }

    // Check if origin is allowed
    const result = await checkOriginAllowed(moduleId, origin);

    // Add CORS headers for the requesting origin
    const response = NextResponse.json({
      allowed: result.allowed,
      rateLimit: result.rateLimit
    });

    // Allow CORS from any origin for this verification endpoint
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
  } catch (error: any) {
    console.error('Embed verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', allowed: false },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

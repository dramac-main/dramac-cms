/**
 * Phase EM-31: OAuth Token Endpoint
 * Exchange authorization codes for tokens, refresh tokens
 * 
 * POST /api/modules/[moduleId]/external/oauth/token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OAuthService } from '@/lib/modules/external/oauth-service';
import { addCorsHeaders } from '@/lib/modules/external/cors-middleware';

interface RouteParams {
  params: Promise<{ moduleId: string }>;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest, { params }: RouteParams) {
  const origin = request.headers.get('origin');

  try {
    const { moduleId } = await params;

    // Get site context from module
    const { data: module, error: moduleError } = await supabase
      .from('site_modules')
      .select('site_id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      const response = NextResponse.json({ error: 'invalid_request', error_description: 'Module not found' }, { status: 404 });
      if (origin) addCorsHeaders(response, origin);
      return response;
    }

    // Parse body (support both JSON and form-urlencoded)
    let body: Record<string, string> = {};
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      body = await request.json().catch(() => ({}));
    }

    const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token, code_verifier } = body;

    if (!grant_type) {
      const response = NextResponse.json({ error: 'invalid_request', error_description: 'grant_type is required' }, { status: 400 });
      if (origin) addCorsHeaders(response, origin);
      return response;
    }

    if (!client_id || !client_secret) {
      const response = NextResponse.json({ error: 'invalid_client', error_description: 'client_id and client_secret are required' }, { status: 401 });
      if (origin) addCorsHeaders(response, origin);
      return response;
    }

    const oauthService = new OAuthService(module.site_id, moduleId);

    let tokens;

    switch (grant_type) {
      case 'authorization_code':
        if (!code || !redirect_uri) {
          const response = NextResponse.json({ error: 'invalid_request', error_description: 'code and redirect_uri are required' }, { status: 400 });
          if (origin) addCorsHeaders(response, origin);
          return response;
        }
        tokens = await oauthService.exchangeCode(code, client_id, client_secret, redirect_uri, code_verifier);
        break;

      case 'refresh_token':
        if (!refresh_token) {
          const response = NextResponse.json({ error: 'invalid_request', error_description: 'refresh_token is required' }, { status: 400 });
          if (origin) addCorsHeaders(response, origin);
          return response;
        }
        tokens = await oauthService.refreshToken(refresh_token, client_id, client_secret);
        break;

      default:
        const response = NextResponse.json({ error: 'unsupported_grant_type', error_description: 'Supported grant types: authorization_code, refresh_token' }, { status: 400 });
        if (origin) addCorsHeaders(response, origin);
        return response;
    }

    const response = NextResponse.json(tokens);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    if (origin) addCorsHeaders(response, origin);
    
    return response;
  } catch (error: any) {
    console.error('OAuth token error:', error);
    
    const errorResponse = {
      error: 'invalid_grant',
      error_description: error.message || 'Token exchange failed'
    };

    const response = NextResponse.json(errorResponse, { status: 400 });
    if (origin) addCorsHeaders(response, origin);
    return response;
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

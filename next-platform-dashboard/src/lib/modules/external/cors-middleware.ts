/**
 * Phase EM-31: CORS Middleware
 * Handles Cross-Origin Resource Sharing for external API requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkOriginAllowed, type AllowedDomain } from './domain-service';

export interface CorsConfig {
  siteId: string;
  moduleId: string;
}

export interface CorsResult {
  allowed: boolean;
  headers: Record<string, string>;
  domain?: AllowedDomain;
  error?: string;
}

/**
 * Get CORS headers for a given origin and domain
 */
function getCorsHeaders(origin: string, domain?: AllowedDomain): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Request-ID',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Expose-Headers': 'X-Request-ID, X-Rate-Limit-Remaining, X-Rate-Limit-Reset',
    'X-Rate-Limit': domain?.rate_limit?.toString() || '1000',
    'Vary': 'Origin'
  };
}

/**
 * Get error CORS headers (allow browser to read error response)
 */
function getErrorCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  };
}

/**
 * CORS middleware for external module API requests
 */
export async function corsMiddleware(
  request: NextRequest,
  config: CorsConfig
): Promise<CorsResult> {
  const origin = request.headers.get('origin');
  
  // No origin = same-origin request, allow it
  if (!origin) {
    return { allowed: true, headers: {} };
  }

  // Check if origin is allowed
  const { allowed, domain } = await checkOriginAllowed(config.moduleId, origin);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    if (!allowed) {
      return {
        allowed: false,
        headers: getErrorCorsHeaders(origin),
        error: 'CORS Not Allowed'
      };
    }

    return {
      allowed: true,
      headers: getCorsHeaders(origin, domain),
      domain
    };
  }

  // For actual requests
  if (!allowed) {
    return {
      allowed: false,
      headers: getErrorCorsHeaders(origin),
      error: 'Origin not allowed'
    };
  }

  return {
    allowed: true,
    headers: getCorsHeaders(origin, domain),
    domain
  };
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string,
  domain?: AllowedDomain
): NextResponse {
  const headers = getCorsHeaders(origin, domain);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create a preflight response
 */
export function createPreflightResponse(origin: string, domain?: AllowedDomain): NextResponse {
  const headers = getCorsHeaders(origin, domain);
  return new NextResponse(null, { status: 204, headers });
}

/**
 * Create a CORS error response
 */
export function createCorsErrorResponse(origin: string, message: string): NextResponse {
  const headers = getErrorCorsHeaders(origin);
  return NextResponse.json(
    { error: message },
    { status: 403, headers }
  );
}

// ============================================================
// RATE LIMITING
// ============================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: Date;
  limit: number;
}

// In-memory cache for rate limiting
// In production, use Redis for distributed rate limiting
const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for an external request
 */
export async function checkRateLimit(
  siteId: string,
  moduleId: string,
  identifier: string, // origin, IP, or token
  limit: number,
  windowMs: number = 60 * 60 * 1000 // 1 hour default
): Promise<RateLimitResult> {
  const key = `ratelimit:${siteId}:${moduleId}:${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const reset = new Date(windowStart + windowMs);

  let current = rateLimitCache.get(key);
  
  // Reset if new window
  if (!current || current.windowStart !== windowStart) {
    current = { count: 0, windowStart };
  }

  current.count++;
  rateLimitCache.set(key, current);

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitCache(windowMs);
  }

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    reset,
    limit
  };
}

/**
 * Check rate limit and add headers to response
 */
export async function applyRateLimit(
  response: NextResponse,
  siteId: string,
  moduleId: string,
  identifier: string,
  limit: number
): Promise<{ response: NextResponse; rateLimitResult: RateLimitResult }> {
  const result = await checkRateLimit(siteId, moduleId, identifier, limit);

  response.headers.set('X-Rate-Limit-Limit', String(result.limit));
  response.headers.set('X-Rate-Limit-Remaining', String(result.remaining));
  response.headers.set('X-Rate-Limit-Reset', result.reset.toISOString());

  if (!result.allowed) {
    return {
      response: NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.reset.getTime() - Date.now()) / 1000)),
            'X-Rate-Limit-Limit': String(result.limit),
            'X-Rate-Limit-Remaining': '0',
            'X-Rate-Limit-Reset': result.reset.toISOString()
          }
        }
      ),
      rateLimitResult: result
    };
  }

  return { response, rateLimitResult: result };
}

/**
 * Cleanup old rate limit entries
 */
function cleanupRateLimitCache(windowMs: number): void {
  const now = Date.now();
  const threshold = now - windowMs * 2;

  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.windowStart < threshold) {
      rateLimitCache.delete(key);
    }
  }
}

// ============================================================
// REQUEST LOGGING
// ============================================================

import { createClient } from '@supabase/supabase-js';

/**
 * Log an external API request
 */
export async function logExternalRequest(params: {
  siteId: string;
  moduleId: string;
  tokenId?: string;
  method: string;
  path: string;
  origin?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode: number;
  responseTimeMs: number;
  errorCode?: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.rpc('log_external_request', {
      p_site_id: params.siteId,
      p_module_id: params.moduleId,
      p_token_id: params.tokenId || null,
      p_method: params.method,
      p_path: params.path,
      p_origin: params.origin || null,
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
      p_status_code: params.statusCode,
      p_response_time_ms: params.responseTimeMs,
      p_error_code: params.errorCode || null,
      p_error_message: params.errorMessage || null
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log external request:', error);
  }
}

// ============================================================
// MIDDLEWARE WRAPPER
// ============================================================

export interface ExternalApiMiddlewareOptions {
  siteId: string;
  moduleId: string;
  requireAuth?: boolean;
  requiredScopes?: string[];
  rateLimit?: number;
}

/**
 * Complete middleware for external API endpoints
 * Handles CORS, authentication, rate limiting, and logging
 */
export async function externalApiMiddleware(
  request: NextRequest,
  options: ExternalApiMiddlewareOptions
): Promise<{
  proceed: boolean;
  response?: NextResponse;
  context?: {
    origin?: string;
    domain?: AllowedDomain;
    userId?: string;
    scopes?: string[];
  };
}> {
  const startTime = Date.now();
  const origin = request.headers.get('origin');

  // Handle CORS
  const corsResult = await corsMiddleware(request, {
    siteId: options.siteId,
    moduleId: options.moduleId
  });

  // Handle preflight
  if (request.method === 'OPTIONS') {
    if (corsResult.allowed) {
      return {
        proceed: false,
        response: createPreflightResponse(origin!, corsResult.domain)
      };
    } else {
      return {
        proceed: false,
        response: createCorsErrorResponse(origin || '*', corsResult.error || 'CORS not allowed')
      };
    }
  }

  // Check CORS for actual requests
  if (origin && !corsResult.allowed) {
    return {
      proceed: false,
      response: createCorsErrorResponse(origin, corsResult.error || 'Origin not allowed')
    };
  }

  // Check rate limit
  if (options.rateLimit || corsResult.domain?.rate_limit) {
    const limit = options.rateLimit || corsResult.domain?.rate_limit || 1000;
    const identifier = origin || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    const rateLimitResult = await checkRateLimit(
      options.siteId,
      options.moduleId,
      identifier,
      limit
    );

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)
        },
        { status: 429 }
      );

      if (origin) {
        addCorsHeaders(response, origin, corsResult.domain);
      }

      return { proceed: false, response };
    }
  }

  // Check authentication if required
  let userId: string | undefined;
  let scopes: string[] | undefined;

  if (options.requireAuth) {
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');

    if (!authHeader && !apiKey) {
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
      if (origin) addCorsHeaders(response, origin, corsResult.domain);
      return { proceed: false, response };
    }

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Import OAuth service dynamically to avoid circular dependency
      const { OAuthService } = await import('./oauth-service');
      const oauth = new OAuthService(options.siteId, options.moduleId);
      const validation = oauth.validateAccessToken(token);

      if (!validation.valid) {
        const response = NextResponse.json(
          { error: validation.error || 'Invalid token' },
          { status: 401 }
        );
        if (origin) addCorsHeaders(response, origin, corsResult.domain);
        return { proceed: false, response };
      }

      userId = validation.userId;
      scopes = validation.scopes;

      // Check required scopes
      if (options.requiredScopes && options.requiredScopes.length > 0) {
        const hasScopes = options.requiredScopes.every(s => scopes?.includes(s));
        if (!hasScopes) {
          const response = NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
          if (origin) addCorsHeaders(response, origin, corsResult.domain);
          return { proceed: false, response };
        }
      }
    }

    // TODO: Handle API key authentication
  }

  return {
    proceed: true,
    context: {
      origin: origin || undefined,
      domain: corsResult.domain,
      userId,
      scopes
    }
  };
}

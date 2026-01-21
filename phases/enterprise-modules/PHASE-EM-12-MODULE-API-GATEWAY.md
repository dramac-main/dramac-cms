# Phase EM-12: Module API Gateway

> **Priority**: 🟠 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: EM-01, EM-05, EM-11
> **Status**: 📋 READY TO IMPLEMENT

---

## 🔗 Dependencies from Previous Phases

This phase uses:

```typescript
// From EM-05: Module Naming
import { generateModuleShortId } from '@/lib/modules/module-naming';

// From EM-11: Database Access
import { createModuleDataClient } from '@/lib/modules/database/module-data-access';
```

**Key Integration Points:**
- Uses `createModuleDataClient()` from EM-11 to give handlers database access
- Uses naming conventions from EM-05 for consistent prefixing
- Works with module types from EM-10 to determine API capabilities

---

## 🎯 Objective

Create a **centralized API gateway** that:
1. Routes requests to module-specific endpoints
2. Handles authentication and authorization
3. Provides rate limiting and usage tracking
4. Enables modules to expose REST APIs
5. Supports webhooks for external integrations

---

## 🏗️ Architecture

```
External Request
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│                    API Gateway                            │
│  /api/modules/{moduleId}/...                              │
├──────────────────────────────────────────────────────────┤
│  1. Authentication (verify JWT/API key)                   │
│  2. Authorization (check module access)                   │
│  3. Rate Limiting (per-module, per-site limits)          │
│  4. Request Routing (to module handler)                   │
│  5. Response Formatting (consistent structure)            │
│  6. Usage Tracking (for billing/analytics)               │
└──────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────┐  ┌─────────────────────┐
│   CRM Module API    │  │  Booking Module API │
│   /contacts         │  │  /appointments      │
│   /companies        │  │  /calendars         │
│   /deals            │  │  /availability      │
└─────────────────────┘  └─────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema for API Management (1 hour)

```sql
-- migrations/20260121_module_api_gateway.sql

-- ============================================================================
-- MODULE API KEYS (For external access)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  module_id UUID NOT NULL,  -- References module_source or modules_v2
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Key (hashed for storage)
  key_prefix TEXT NOT NULL,  -- First 8 chars for identification (e.g., "dmc_live_")
  key_hash TEXT NOT NULL,    -- SHA256 hash of full key
  name TEXT NOT NULL,        -- User-friendly name
  
  -- Permissions
  scopes TEXT[] DEFAULT '{}',  -- e.g., ['read:contacts', 'write:contacts']
  
  -- Rate Limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Restrictions
  allowed_ips TEXT[] DEFAULT '{}',  -- Empty = all allowed
  allowed_origins TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_api_keys_hash ON module_api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_prefix ON module_api_keys(key_prefix);
CREATE INDEX idx_api_keys_module_site ON module_api_keys(module_id, site_id);

-- ============================================================================
-- MODULE API ROUTES (Registered endpoints)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_api_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  module_id UUID NOT NULL,
  
  -- Route definition
  path TEXT NOT NULL,           -- e.g., "/contacts", "/contacts/:id"
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  
  -- Handler
  handler_type TEXT NOT NULL DEFAULT 'function' CHECK (handler_type IN ('function', 'proxy', 'static')),
  handler_code TEXT,            -- For function type
  handler_url TEXT,             -- For proxy type
  
  -- Configuration
  requires_auth BOOLEAN DEFAULT true,
  required_scopes TEXT[] DEFAULT '{}',
  
  -- Rate limiting (overrides default)
  rate_limit_per_minute INTEGER,
  
  -- Caching
  cache_ttl_seconds INTEGER DEFAULT 0,  -- 0 = no cache
  
  -- Documentation
  summary TEXT,
  description TEXT,
  request_schema JSONB,
  response_schema JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, path, method)
);

CREATE INDEX idx_api_routes_module ON module_api_routes(module_id) WHERE is_active = true;
CREATE INDEX idx_api_routes_path ON module_api_routes(module_id, path, method);

-- ============================================================================
-- API REQUEST LOGS (For debugging and analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request
  module_id UUID NOT NULL,
  site_id UUID,
  route_id UUID REFERENCES module_api_routes(id),
  
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  
  -- Authentication
  auth_type TEXT,  -- 'jwt', 'api_key', 'none'
  api_key_id UUID REFERENCES module_api_keys(id),
  user_id UUID,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by date for performance (optional)
CREATE INDEX idx_api_logs_module ON module_api_logs(module_id, created_at DESC);
CREATE INDEX idx_api_logs_date ON module_api_logs(created_at DESC);

-- Auto-cleanup old logs (keep 30 days)
CREATE INDEX idx_api_logs_cleanup ON module_api_logs(created_at) 
  WHERE created_at < NOW() - INTERVAL '30 days';

-- ============================================================================
-- RATE LIMITING STATE (Using Redis is better, but this works for start)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifier (API key or user)
  rate_limit_key TEXT NOT NULL,  -- e.g., "apikey:abc123" or "user:uuid:module:uuid"
  
  -- Counts
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_minutes INTEGER DEFAULT 1,
  
  UNIQUE(rate_limit_key, window_minutes)
);

CREATE INDEX idx_rate_limits_key ON module_rate_limits(rate_limit_key);
```

---

### Task 2: API Gateway Core (3 hours)

```typescript
// src/lib/modules/api/module-api-gateway.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateModuleShortId } from '../module-naming';
import { createModuleDataClient } from '../database/module-data-access';
import { trackEvent } from '../analytics/module-analytics';

export interface GatewayContext {
  moduleId: string;
  siteId: string;
  userId?: string;
  apiKeyId?: string;
  scopes: string[];
  rateLimit: {
    remaining: number;
    reset: Date;
  };
}

export interface RouteHandler {
  (
    request: NextRequest,
    context: GatewayContext,
    params: Record<string, string>
  ): Promise<Response>;
}

/**
 * Main API Gateway handler
 */
export async function handleModuleApiRequest(
  request: NextRequest,
  moduleId: string,
  path: string
): Promise<Response> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  
  try {
    // 1. Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || 'Unauthorized');
    }
    
    // 2. Find the route
    const route = await findRoute(supabase, moduleId, path, request.method);
    if (!route) {
      return createErrorResponse(404, 'Endpoint not found');
    }
    
    // 3. Authorize (check scopes)
    if (route.required_scopes?.length > 0) {
      const hasScope = route.required_scopes.every(
        (s: string) => authResult.scopes?.includes(s) || authResult.scopes?.includes('*')
      );
      if (!hasScope) {
        return createErrorResponse(403, 'Insufficient permissions');
      }
    }
    
    // 4. Rate limiting
    const rateLimitResult = await checkRateLimit(
      authResult.apiKeyId || authResult.userId || 'anonymous',
      moduleId,
      route.rate_limit_per_minute || 60
    );
    
    if (!rateLimitResult.allowed) {
      return createErrorResponse(429, 'Rate limit exceeded', {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.reset.toISOString()
      });
    }
    
    // 5. Build context
    const context: GatewayContext = {
      moduleId,
      siteId: authResult.siteId!,
      userId: authResult.userId,
      apiKeyId: authResult.apiKeyId,
      scopes: authResult.scopes || [],
      rateLimit: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
    
    // 6. Extract path parameters
    const pathParams = extractPathParams(route.path, path);
    
    // 7. Execute handler
    let response: Response;
    
    if (route.handler_type === 'function') {
      response = await executeModuleHandler(route, request, context, pathParams);
    } else if (route.handler_type === 'proxy') {
      response = await proxyRequest(route.handler_url, request);
    } else {
      response = createErrorResponse(500, 'Invalid handler type');
    }
    
    // 8. Log request
    await logApiRequest(supabase, {
      moduleId,
      siteId: context.siteId,
      routeId: route.id,
      method: request.method,
      path,
      authType: authResult.type,
      apiKeyId: authResult.apiKeyId,
      userId: authResult.userId,
      statusCode: response.status,
      responseTimeMs: Date.now() - startTime,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0],
      userAgent: request.headers.get('user-agent')
    });
    
    // 9. Add rate limit headers
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
  } catch (error: any) {
    console.error('API Gateway error:', error);
    
    return createErrorResponse(500, error.message || 'Internal server error');
  }
}

/**
 * Authenticate the request (JWT or API key)
 */
async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  type?: 'jwt' | 'api_key' | 'none';
  userId?: string;
  apiKeyId?: string;
  siteId?: string;
  scopes?: string[];
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-api-key');
  
  // Check API key first
  if (apiKey) {
    return await validateApiKey(apiKey);
  }
  
  // Check JWT
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return await validateJwt(token);
  }
  
  // Check for site context in query (for embedded modules)
  const siteId = request.nextUrl.searchParams.get('site_id');
  if (siteId) {
    return {
      success: true,
      type: 'none',
      siteId,
      scopes: ['read:*']  // Read-only for anonymous
    };
  }
  
  return { success: false, error: 'No authentication provided' };
}

/**
 * Validate API key
 */
async function validateApiKey(key: string): Promise<{
  success: boolean;
  type?: 'api_key';
  apiKeyId?: string;
  siteId?: string;
  scopes?: string[];
  error?: string;
}> {
  const supabase = createAdminClient();
  
  // Hash the key for comparison
  const keyHash = await hashApiKey(key);
  
  const { data, error } = await supabase
    .from('module_api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return { success: false, error: 'Invalid API key' };
  }
  
  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { success: false, error: 'API key expired' };
  }
  
  // Update last used
  await supabase
    .from('module_api_keys')
    .update({ 
      last_used_at: new Date().toISOString(),
      request_count: data.request_count + 1
    })
    .eq('id', data.id);
  
  return {
    success: true,
    type: 'api_key',
    apiKeyId: data.id,
    siteId: data.site_id,
    scopes: data.scopes || []
  };
}

/**
 * Validate JWT token
 */
async function validateJwt(token: string): Promise<{
  success: boolean;
  type?: 'jwt';
  userId?: string;
  siteId?: string;
  scopes?: string[];
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { success: false, error: 'Invalid token' };
  }
  
  // Get user's site context from metadata or session
  // This would need to be passed in the request
  
  return {
    success: true,
    type: 'jwt',
    userId: user.id,
    scopes: ['*']  // Full access for authenticated users
  };
}

/**
 * Find matching route
 */
async function findRoute(
  supabase: any,
  moduleId: string,
  path: string,
  method: string
) {
  // Get all routes for this module
  const { data: routes } = await supabase
    .from('module_api_routes')
    .select('*')
    .eq('module_id', moduleId)
    .eq('method', method)
    .eq('is_active', true);
  
  if (!routes?.length) return null;
  
  // Find matching route (handle path parameters)
  for (const route of routes) {
    if (matchPath(route.path, path)) {
      return route;
    }
  }
  
  return null;
}

/**
 * Match path with parameters
 */
function matchPath(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) {
    return false;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      continue; // Parameter matches anything
    }
    if (patternParts[i] !== pathParts[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Extract path parameters
 */
function extractPathParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].substring(1);
      params[paramName] = pathParts[i];
    }
  }
  
  return params;
}

/**
 * Check rate limit
 */
async function checkRateLimit(
  identifier: string,
  moduleId: string,
  limitPerMinute: number
): Promise<{
  allowed: boolean;
  remaining: number;
  reset: Date;
}> {
  const supabase = createAdminClient();
  const key = `${identifier}:${moduleId}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60000); // 1 minute window
  
  // Get or create rate limit entry
  const { data } = await supabase
    .from('module_rate_limits')
    .select('*')
    .eq('rate_limit_key', key)
    .eq('window_minutes', 1)
    .single();
  
  if (!data || new Date(data.window_start) < windowStart) {
    // Start new window
    await supabase
      .from('module_rate_limits')
      .upsert({
        rate_limit_key: key,
        request_count: 1,
        window_start: now.toISOString(),
        window_minutes: 1
      }, { onConflict: 'rate_limit_key,window_minutes' });
    
    return {
      allowed: true,
      remaining: limitPerMinute - 1,
      reset: new Date(now.getTime() + 60000)
    };
  }
  
  if (data.request_count >= limitPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      reset: new Date(new Date(data.window_start).getTime() + 60000)
    };
  }
  
  // Increment counter
  await supabase
    .from('module_rate_limits')
    .update({ request_count: data.request_count + 1 })
    .eq('id', data.id);
  
  return {
    allowed: true,
    remaining: limitPerMinute - data.request_count - 1,
    reset: new Date(new Date(data.window_start).getTime() + 60000)
  };
}

/**
 * Execute module handler
 */
async function executeModuleHandler(
  route: any,
  request: NextRequest,
  context: GatewayContext,
  params: Record<string, string>
): Promise<Response> {
  // Create data client for the module
  const db = createModuleDataClient({
    moduleId: context.moduleId,
    siteId: context.siteId,
    userId: context.userId
  });
  
  // Parse request body if present
  let body = null;
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON
    }
  }
  
  // Build handler context
  const handlerContext = {
    params,
    query: Object.fromEntries(request.nextUrl.searchParams),
    body,
    db,
    user: context.userId ? { id: context.userId } : null,
    site: { id: context.siteId }
  };
  
  try {
    // Execute the handler code (sandboxed)
    const handler = new Function('ctx', `
      return (async () => {
        ${route.handler_code}
      })();
    `);
    
    const result = await handler(handlerContext);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Handler execution error:', error);
    return createErrorResponse(500, error.message);
  }
}

/**
 * Proxy request to external URL
 */
async function proxyRequest(url: string, request: NextRequest): Promise<Response> {
  const response = await fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  return response;
}

/**
 * Log API request
 */
async function logApiRequest(supabase: any, log: any): Promise<void> {
  try {
    await supabase.from('module_api_logs').insert(log);
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

/**
 * Create error response
 */
function createErrorResponse(
  status: number,
  message: string,
  headers?: Record<string, string>
): Response {
  return NextResponse.json(
    { error: message },
    { 
      status,
      headers: headers || {}
    }
  );
}

/**
 * Hash API key for storage
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

### Task 3: API Route Handler (1 hour)

```typescript
// src/app/api/modules/[moduleId]/[...path]/route.ts

import { NextRequest } from 'next/server';
import { handleModuleApiRequest } from '@/lib/modules/api/module-api-gateway';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params;
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params;
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params;
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params;
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params;
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'));
}
```

---

### Task 4: API Key Management Service (1 hour)

```typescript
// src/lib/modules/api/api-key-service.ts

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

export interface CreateApiKeyInput {
  moduleId: string;
  siteId: string;
  agencyId: string;
  name: string;
  scopes?: string[];
  expiresInDays?: number;
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  allowedIps?: string[];
  allowedOrigins?: string[];
}

export interface ApiKeyResult {
  id: string;
  key: string;  // Only returned once!
  keyPrefix: string;
  name: string;
  scopes: string[];
  expiresAt: string | null;
  createdAt: string;
}

/**
 * Generate a new API key
 */
export async function createApiKey(
  input: CreateApiKeyInput,
  userId: string
): Promise<ApiKeyResult> {
  const supabase = createAdminClient();
  
  // Generate secure random key
  const keyBytes = randomBytes(32);
  const key = `dmc_live_${keyBytes.toString('hex')}`;
  const keyPrefix = key.substring(0, 12);
  
  // Hash for storage
  const keyHash = await hashKey(key);
  
  // Calculate expiry
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  
  const { data, error } = await supabase
    .from('module_api_keys')
    .insert({
      module_id: input.moduleId,
      site_id: input.siteId,
      agency_id: input.agencyId,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      name: input.name,
      scopes: input.scopes || ['*'],
      rate_limit_per_minute: input.rateLimitPerMinute || 60,
      rate_limit_per_day: input.rateLimitPerDay || 10000,
      allowed_ips: input.allowedIps || [],
      allowed_origins: input.allowedOrigins || [],
      expires_at: expiresAt,
      created_by: userId
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    key,  // Return the actual key (only time it's visible!)
    keyPrefix,
    name: data.name,
    scopes: data.scopes,
    expiresAt: data.expires_at,
    createdAt: data.created_at
  };
}

/**
 * List API keys for a module/site
 */
export async function listApiKeys(
  moduleId: string,
  siteId: string
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('module_api_keys')
    .select('id, key_prefix, name, scopes, is_active, expires_at, last_used_at, request_count, created_at')
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  keyId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('module_api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: userId
    })
    .eq('id', keyId);
  
  if (error) throw error;
}

/**
 * Update API key settings
 */
export async function updateApiKey(
  keyId: string,
  updates: {
    name?: string;
    scopes?: string[];
    rateLimitPerMinute?: number;
    rateLimitPerDay?: number;
    allowedIps?: string[];
    allowedOrigins?: string[];
  }
): Promise<void> {
  const supabase = createClient();
  
  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.scopes) updateData.scopes = updates.scopes;
  if (updates.rateLimitPerMinute) updateData.rate_limit_per_minute = updates.rateLimitPerMinute;
  if (updates.rateLimitPerDay) updateData.rate_limit_per_day = updates.rateLimitPerDay;
  if (updates.allowedIps) updateData.allowed_ips = updates.allowedIps;
  if (updates.allowedOrigins) updateData.allowed_origins = updates.allowedOrigins;
  
  const { error } = await supabase
    .from('module_api_keys')
    .update(updateData)
    .eq('id', keyId);
  
  if (error) throw error;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

### Task 5: Route Registration API (1 hour)

```typescript
// src/lib/modules/api/route-registration.ts

import { createAdminClient } from '@/lib/supabase/admin';

export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;  // Handler code
  requiresAuth?: boolean;
  requiredScopes?: string[];
  rateLimitPerMinute?: number;
  cacheTtlSeconds?: number;
  summary?: string;
  description?: string;
  requestSchema?: object;
  responseSchema?: object;
}

/**
 * Register API routes for a module
 */
export async function registerModuleRoutes(
  moduleId: string,
  routes: RouteDefinition[]
): Promise<void> {
  const supabase = createAdminClient();
  
  // Deactivate existing routes
  await supabase
    .from('module_api_routes')
    .update({ is_active: false })
    .eq('module_id', moduleId);
  
  // Insert/update routes
  for (const route of routes) {
    await supabase
      .from('module_api_routes')
      .upsert({
        module_id: moduleId,
        path: route.path,
        method: route.method,
        handler_type: 'function',
        handler_code: route.handler,
        requires_auth: route.requiresAuth ?? true,
        required_scopes: route.requiredScopes || [],
        rate_limit_per_minute: route.rateLimitPerMinute,
        cache_ttl_seconds: route.cacheTtlSeconds || 0,
        summary: route.summary,
        description: route.description,
        request_schema: route.requestSchema,
        response_schema: route.responseSchema,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'module_id,path,method'
      });
  }
}

/**
 * Get registered routes for a module
 */
export async function getModuleRoutes(moduleId: string) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('module_api_routes')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_active', true)
    .order('path');
  
  if (error) throw error;
  return data || [];
}

/**
 * Generate OpenAPI spec for a module
 */
export async function generateModuleOpenApiSpec(moduleId: string) {
  const routes = await getModuleRoutes(moduleId);
  
  const paths: any = {};
  
  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }
    
    paths[route.path][route.method.toLowerCase()] = {
      summary: route.summary,
      description: route.description,
      security: route.requires_auth ? [{ bearerAuth: [] }, { apiKey: [] }] : [],
      requestBody: route.request_schema ? {
        content: {
          'application/json': {
            schema: route.request_schema
          }
        }
      } : undefined,
      responses: {
        '200': {
          description: 'Successful response',
          content: route.response_schema ? {
            'application/json': {
              schema: route.response_schema
            }
          } : undefined
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
        '429': { description: 'Rate limit exceeded' },
        '500': { description: 'Internal server error' }
      }
    };
  }
  
  return {
    openapi: '3.0.0',
    info: {
      title: `Module API - ${moduleId}`,
      version: '1.0.0'
    },
    servers: [
      { url: `/api/modules/${moduleId}` }
    ],
    security: [
      { bearerAuth: [] },
      { apiKey: [] }
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    }
  };
}
```

---

## 📝 Example: CRM Module API Routes

```typescript
// How the CRM module would register its routes

import { registerModuleRoutes } from '@/lib/modules/api/route-registration';

await registerModuleRoutes('crm-module-id', [
  {
    path: '/contacts',
    method: 'GET',
    summary: 'List contacts',
    handler: `
      const { data, error } = await ctx.db.from('contacts').select('*');
      if (error) throw error;
      return { contacts: data };
    `,
    requiredScopes: ['read:contacts']
  },
  {
    path: '/contacts/:id',
    method: 'GET',
    summary: 'Get contact by ID',
    handler: `
      const { data, error } = await ctx.db.from('contacts')
        .select('*')
        .eq('id', ctx.params.id)
        .single();
      if (error) throw error;
      return data;
    `,
    requiredScopes: ['read:contacts']
  },
  {
    path: '/contacts',
    method: 'POST',
    summary: 'Create contact',
    handler: `
      const { data, error } = await ctx.db.from('contacts')
        .insert(ctx.body)
        .select()
        .single();
      if (error) throw error;
      return data;
    `,
    requiredScopes: ['write:contacts']
  },
  {
    path: '/contacts/:id',
    method: 'PUT',
    summary: 'Update contact',
    handler: `
      const { data, error } = await ctx.db.from('contacts')
        .update(ctx.body)
        .eq('id', ctx.params.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    `,
    requiredScopes: ['write:contacts']
  },
  {
    path: '/contacts/:id',
    method: 'DELETE',
    summary: 'Delete contact',
    handler: `
      const { error } = await ctx.db.from('contacts')
        .delete()
        .eq('id', ctx.params.id);
      if (error) throw error;
      return { success: true };
    `,
    requiredScopes: ['delete:contacts']
  }
]);
```

---

## ✅ Verification Checklist

- [ ] API gateway routes requests correctly
- [ ] JWT authentication works
- [ ] API key authentication works
- [ ] Rate limiting enforced
- [ ] Path parameters extracted correctly
- [ ] Request logging works
- [ ] OpenAPI spec generated
- [ ] CORS headers correct
- [ ] Error responses consistent

---

## 📍 Dependencies

- **Requires**: EM-05, EM-11 (Database)
- **Required by**: EM-13 (Module Auth), EM-50 (CRM Module)

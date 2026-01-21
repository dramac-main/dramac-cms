/**
 * Module API Gateway
 * 
 * Phase EM-10 + EM-12: Complete API gateway for modules
 * 
 * This module handles:
 * - Routing requests to module APIs
 * - Authentication (JWT and API key)
 * - Authorization (scope-based)
 * - Rate limiting (per-module, per-site)
 * - Request logging for debugging and analytics
 * - Executing module handlers
 * 
 * @see phases/enterprise-modules/PHASE-EM-10-MODULE-TYPE-SYSTEM.md
 * @see phases/enterprise-modules/PHASE-EM-12-MODULE-API-GATEWAY.md
 */
'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserId } from '@/lib/auth/permissions'
import { createModuleDataClient } from '../database/module-data-access'
import type { EdgeFunction, ModuleCapabilities, DatabaseIsolation } from '../types/module-types-v2'

// =============================================================
// EM-12: Gateway Context Types
// =============================================================

export interface GatewayContext {
  moduleId: string
  siteId: string
  userId?: string
  apiKeyId?: string
  scopes: string[]
  rateLimit: {
    remaining: number
    reset: Date
  }
}

export interface AuthResult {
  success: boolean
  type?: 'jwt' | 'api_key' | 'none'
  userId?: string
  apiKeyId?: string
  siteId?: string
  scopes?: string[]
  error?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: Date
}

// =============================================================
// TYPES
// =============================================================

export interface ModuleAPIRequest {
  moduleId: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: Record<string, unknown>
  query?: Record<string, string>
  headers?: Record<string, string>
  siteId?: string
}

export interface ModuleAPIResponse {
  success: boolean
  status: number
  data?: unknown
  error?: string
  meta?: {
    executionTime?: number
    moduleVersion?: string
    rateLimit?: {
      remaining: number
      reset: string
    }
  }
}

interface ModuleInfo {
  id: string
  short_id: string
  capabilities: ModuleCapabilities
  resources: {
    edge_functions?: EdgeFunction[]
  }
  db_isolation: DatabaseIsolation
}

interface LimitedDB {
  from: (tableName: string) => unknown
  rpc: (fnName: string, params?: unknown) => unknown
}

// =============================================================
// EM-12: ENHANCED API GATEWAY FOR NEXT.JS APP ROUTER
// =============================================================

/**
 * Handle module API requests from Next.js App Router
 * This is the main entry point for /api/modules/[moduleId]/[...path]
 */
export async function handleModuleApiRequest(
  request: NextRequest,
  moduleId: string,
  path: string
): Promise<Response> {
  const startTime = Date.now()
  const supabase = createAdminClient()
  
  try {
    // 1. Authenticate the request
    const authResult = await authenticateNextRequest(request)
    if (!authResult.success) {
      return createJsonErrorResponse(401, authResult.error || 'Unauthorized')
    }
    
    // 2. Find the route in registered routes
    const route = await findRegisteredRoute(supabase, moduleId, path, request.method)
    
    // 3. If no registered route, fall back to module resources
    if (!route) {
      // Try the legacy routing system
      const legacyResponse = await routeModuleAPIFromRequest(request, moduleId, path)
      return legacyResponse
    }
    
    // 4. Check scopes if route requires them
    if (route.required_scopes && route.required_scopes.length > 0) {
      const hasScope = route.required_scopes.every(
        (s: string) => authResult.scopes?.includes(s) || authResult.scopes?.includes('*')
      )
      if (!hasScope) {
        return createJsonErrorResponse(403, 'Insufficient permissions')
      }
    }
    
    // 5. Rate limiting
    const rateLimitResult = await checkRateLimit(
      authResult.apiKeyId || authResult.userId || 'anonymous',
      moduleId,
      route.rate_limit_per_minute || 60
    )
    
    if (!rateLimitResult.allowed) {
      return createJsonErrorResponse(429, 'Rate limit exceeded', {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.reset.toISOString()
      })
    }
    
    // 6. Build gateway context
    const context: GatewayContext = {
      moduleId,
      siteId: authResult.siteId || '',
      userId: authResult.userId,
      apiKeyId: authResult.apiKeyId,
      scopes: authResult.scopes || [],
      rateLimit: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    }
    
    // 7. Extract path parameters
    const pathParams = extractPathParamsFromRoute(route.path, path)
    
    // 8. Execute the handler
    let response: Response
    
    if (route.handler_type === 'function' && route.handler_code) {
      response = await executeRegisteredHandler(
        { handler_code: route.handler_code ?? '', path: route.path },
        request,
        context,
        pathParams
      )
    } else if (route.handler_type === 'proxy' && route.handler_url) {
      response = await proxyRequest(route.handler_url, request)
    } else {
      response = createJsonErrorResponse(500, 'Invalid handler configuration')
    }
    
    // 9. Log the request
    await logApiRequest(supabase, {
      module_id: moduleId,
      site_id: context.siteId || null,
      route_id: route.id,
      method: request.method,
      path,
      query_params: Object.fromEntries(request.nextUrl.searchParams),
      auth_type: authResult.type || null,
      api_key_id: authResult.apiKeyId || null,
      user_id: authResult.userId || null,
      status_code: response.status,
      response_time_ms: Date.now() - startTime,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: request.headers.get('user-agent') || null
    })
    
    // 10. Add rate limit headers to response
    const headers = new Headers(response.headers)
    headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString())
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
    
  } catch (error) {
    console.error('[ModuleAPI] Gateway error:', error)
    return createJsonErrorResponse(500, error instanceof Error ? error.message : 'Internal server error')
  }
}

/**
 * Authenticate a Next.js request (JWT or API key)
 */
async function authenticateNextRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')
  const apiKey = request.headers.get('x-api-key')
  
  // Check API key first
  if (apiKey) {
    return await validateApiKey(apiKey)
  }
  
  // Check JWT Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return await validateJwtToken(token)
  }
  
  // Check for site context in query (for embedded modules)
  const siteId = request.nextUrl.searchParams.get('site_id')
  if (siteId) {
    return {
      success: true,
      type: 'none',
      siteId,
      scopes: ['read:*']  // Read-only for anonymous
    }
  }
  
  // No auth provided - might be okay for public routes
  return { 
    success: true,
    type: 'none',
    scopes: ['read:*']
  }
}

/**
 * Validate an API key
 */
async function validateApiKey(key: string): Promise<AuthResult> {
  // Cast to any until migration is run and types regenerated
  const supabase = createAdminClient()
  
  // Hash the key for comparison
  const keyHash = await hashApiKey(key)
  
  const { data, error } = await supabase
    .from('module_api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    return { success: false, error: 'Invalid API key' }
  }
  
  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { success: false, error: 'API key expired' }
  }
  
  // Check IP restrictions
  // Note: IP checking would require the request IP
  
  // Update last used (fire and forget)
  supabase
    .from('module_api_keys')
    .update({ 
      last_used_at: new Date().toISOString(),
      request_count: (data.request_count || 0) + 1
    })
    .eq('id', data.id)
    .then(() => {}) // Ignore result
  
  return {
    success: true,
    type: 'api_key',
    apiKeyId: data.id,
    siteId: data.site_id,
    scopes: data.scopes || []
  }
}

/**
 * Validate a JWT token
 */
async function validateJwtToken(token: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { success: false, error: 'Invalid token' }
    }
    
    return {
      success: true,
      type: 'jwt',
      userId: user.id,
      scopes: ['*']  // Full access for authenticated users
    }
  } catch {
    return { success: false, error: 'Token validation failed' }
  }
}

/**
 * Find a registered route in module_api_routes table
 */
async function findRegisteredRoute(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  moduleId: string,
  path: string,
  method: string
) {
  // Get all active routes for this module
  const { data: routes } = await supabase
    .from('module_api_routes')
    .select('*')
    .eq('module_id', moduleId)
    .eq('method', method)
    .eq('is_active', true)
  
  if (!routes?.length) return null
  
  // Find matching route (handle path parameters)
  for (const route of routes) {
    if (matchRoutePath(route.path, path)) {
      return route
    }
  }
  
  return null
}

/**
 * Match a route path pattern against an actual path
 */
function matchRoutePath(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  
  if (patternParts.length !== pathParts.length) {
    return false
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      continue // Parameter matches anything
    }
    if (patternParts[i] !== pathParts[i]) {
      return false
    }
  }
  
  return true
}

/**
 * Extract path parameters from a route
 */
function extractPathParamsFromRoute(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {}
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].substring(1)
      params[paramName] = pathParts[i]
    }
  }
  
  return params
}

/**
 * Check rate limit using database
 */
async function checkRateLimit(
  identifier: string,
  moduleId: string,
  limitPerMinute: number
): Promise<RateLimitResult> {
  // Cast to any until migration is run and types regenerated
  const supabase = createAdminClient()
  const key = `${identifier}:${moduleId}`
  const now = new Date()

  try {
    // Use the RPC function for atomic rate limiting
    const { data, error } = await supabase.rpc('check_and_update_rate_limit', {
      p_key: key,
      p_limit: limitPerMinute,
      p_window_minutes: 1
    })
    
    if (error || !data?.[0]) {
      // Fallback: allow request if rate limiting fails
      console.error('Rate limit check failed:', error)
      return {
        allowed: true,
        remaining: limitPerMinute,
        reset: new Date(now.getTime() + 60000)
      }
    }
    
    const result = data[0]
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      reset: new Date(result.reset_at)
    }
  } catch {
    // Fallback: allow request if rate limiting fails
    return {
      allowed: true,
      remaining: limitPerMinute,
      reset: new Date(now.getTime() + 60000)
    }
  }
}

/**
 * Execute a registered route handler
 */
async function executeRegisteredHandler(
  route: { handler_code: string; path: string },
  request: NextRequest,
  context: GatewayContext,
  params: Record<string, string>
): Promise<Response> {
  // Create data client for the module
  const db = createModuleDataClient({
    moduleId: context.moduleId,
    siteId: context.siteId,
    userId: context.userId
  })
  
  // Parse request body if present
  let body = null
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      body = await request.json()
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
  }
  
  try {
    // Execute the handler code
    // NOTE: In production, consider using a proper sandbox
    const handler = new Function('ctx', `
      return (async () => {
        ${route.handler_code}
      })();
    `)
    
    const result = await handler(handlerContext)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Handler execution error:', error)
    return createJsonErrorResponse(500, error instanceof Error ? error.message : 'Handler error')
  }
}

/**
 * Proxy a request to an external URL
 */
async function proxyRequest(url: string, request: NextRequest): Promise<Response> {
  const response = await fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  return response
}

/**
 * Log an API request
 */
async function logApiRequest(supabase: Awaited<ReturnType<typeof createAdminClient>>, log: Record<string, unknown>): Promise<void> {
  try {
    await supabase.from('module_api_logs').insert(log as never)
  } catch (error) {
    console.error('Failed to log API request:', error)
  }
}

/**
 * Create a JSON error response
 */
function createJsonErrorResponse(
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
  )
}

/**
 * Hash an API key for storage/comparison
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Helper to route from Next.js request to legacy API
 */
async function routeModuleAPIFromRequest(
  request: NextRequest,
  moduleId: string,
  path: string
): Promise<Response> {
  const body = ['POST', 'PUT', 'PATCH'].includes(request.method)
    ? await request.json().catch(() => undefined)
    : undefined
    
  const result = await routeModuleAPI({
    moduleId,
    path,
    method: request.method as ModuleAPIRequest['method'],
    body,
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers),
    siteId: request.nextUrl.searchParams.get('site_id') || undefined
  })
  
  return NextResponse.json(
    result.success ? result.data : { error: result.error },
    { 
      status: result.status,
      headers: result.meta?.rateLimit ? {
        'X-RateLimit-Remaining': String(result.meta.rateLimit.remaining),
        'X-RateLimit-Reset': result.meta.rateLimit.reset
      } : undefined
    }
  )
}

// =============================================================
// MAIN GATEWAY FUNCTION
// =============================================================

/**
 * Route a request to a module's API
 */
export async function routeModuleAPI(
  request: ModuleAPIRequest
): Promise<ModuleAPIResponse> {
  const startTime = Date.now()
  const supabase = await createClient()
  // Cast to untyped client for columns added by migration
  const db = supabase
  const userId = await getCurrentUserId()

  try {
    // 1. Get module configuration
    // First try modules_v2 (published modules), then module_source (studio modules)
    let module: ModuleInfo | null = null
    
    const { data: publishedModule } = await db
      .from('modules_v2')
      .select('id, short_id, capabilities, resources, db_isolation')
      .eq('id', request.moduleId)
      .eq('status', 'active')
      .single()

    if (publishedModule) {
      module = {
        ...publishedModule,
        capabilities: publishedModule.capabilities as unknown as ModuleCapabilities,
        resources: publishedModule.resources as unknown as { edge_functions?: EdgeFunction[] }
      } as ModuleInfo
    } else {
      const { data: sourceModule } = await db
        .from('module_source')
        .select('id, short_id, capabilities, resources, db_isolation')
        .eq('id', request.moduleId)
        .single()
      
      if (sourceModule) {
        module = {
          ...sourceModule,
          capabilities: sourceModule.capabilities as unknown as ModuleCapabilities,
          resources: sourceModule.resources as unknown as { edge_functions?: EdgeFunction[] }
        } as ModuleInfo
      }
    }

    if (!module) {
      return { 
        success: false, 
        status: 404, 
        error: 'Module not found' 
      }
    }

    // 2. Check if module has API capability
    if (!module.capabilities?.has_api) {
      return { 
        success: false, 
        status: 400, 
        error: 'Module does not support API' 
      }
    }

    // 3. Find matching route
    const routes = module.resources?.edge_functions || []
    const normalizedPath = request.path.startsWith('/') ? request.path : `/${request.path}`
    
    const matchedRoute = findMatchingRoute(routes, normalizedPath, request.method)

    if (!matchedRoute) {
      return { 
        success: false, 
        status: 404, 
        error: `Route not found: ${request.method} ${normalizedPath}` 
      }
    }

    // 4. Check authentication if required
    if (matchedRoute.auth_required && !userId) {
      return { 
        success: false, 
        status: 401, 
        error: 'Authentication required' 
      }
    }

    // 5. Execute the handler
    const result = await executeModuleHandler(
      module,
      matchedRoute,
      {
        body: request.body,
        query: request.query,
        userId,
        siteId: request.siteId,
        supabase
      }
    )

    const executionTime = Date.now() - startTime

    return { 
      success: true, 
      status: 200, 
      data: result,
      meta: {
        executionTime
      }
    }

  } catch (error) {
    console.error('[ModuleAPI] Gateway error:', error)
    return { 
      success: false, 
      status: 500, 
      error: error instanceof Error ? error.message : 'Internal server error'
    }
  }
}

// =============================================================
// ROUTE MATCHING
// =============================================================

/**
 * Find matching route with support for path parameters
 */
function findMatchingRoute(
  routes: EdgeFunction[],
  path: string,
  method: string
): EdgeFunction | undefined {
  // First try exact match
  const exactMatch = routes.find(
    r => r.path === path && r.method === method
  )
  
  if (exactMatch) return exactMatch

  // Try pattern matching (e.g., /items/:id)
  for (const route of routes) {
    if (route.method !== method) continue
    
    const pattern = route.path.replace(/:[^/]+/g, '[^/]+')
    const regex = new RegExp(`^${pattern}$`)
    
    if (regex.test(path)) {
      return route
    }
  }

  return undefined
}

/**
 * Extract path parameters from a matched route
 */
function extractPathParams(
  routePath: string,
  actualPath: string
): Record<string, string> {
  const params: Record<string, string> = {}
  
  const routeParts = routePath.split('/')
  const actualParts = actualPath.split('/')
  
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].substring(1)
      params[paramName] = actualParts[i]
    }
  }
  
  return params
}

// =============================================================
// HANDLER EXECUTION
// =============================================================

/**
 * Execute a module's API handler
 */
async function executeModuleHandler(
  module: ModuleInfo,
  route: EdgeFunction,
  context: {
    body?: Record<string, unknown>
    query?: Record<string, string>
    userId?: string | null
    siteId?: string
    supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
  }
): Promise<unknown> {
  // Check if handler is an edge function or inline code
  const handler = route.handler || ''
  
  if (handler.startsWith('edge:')) {
    // Call Supabase Edge Function
    return executeEdgeFunction(handler.replace('edge:', ''), module, context)
  }

  if (route.handlerCode) {
    // Execute inline handler code
    return executeInlineHandler(module, route.handlerCode, context)
  }

  // Check if there's a registered handler in api_routes
  const apiRoutesHandler = await findApiRouteHandler(module.id, route.name, context.supabase)
  
  if (apiRoutesHandler) {
    return executeInlineHandler(module, apiRoutesHandler, context)
  }

  throw new Error(`No handler found for route: ${route.name}`)
}

/**
 * Execute a Supabase Edge Function
 */
async function executeEdgeFunction(
  functionName: string,
  module: ModuleInfo,
  context: {
    body?: Record<string, unknown>
    query?: Record<string, string>
    userId?: string | null
    siteId?: string
    supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
  }
): Promise<unknown> {
  const { data, error } = await context.supabase.functions.invoke(functionName, {
    body: {
      moduleId: module.id,
      moduleShortId: module.short_id,
      body: context.body,
      query: context.query,
      userId: context.userId,
      siteId: context.siteId
    }
  })

  if (error) {
    throw new Error(`Edge function error: ${error.message}`)
  }

  return data
}

/**
 * Execute inline handler code in a sandboxed environment
 * 
 * WARNING: This is a simplified implementation.
 * For production, use a proper sandbox like isolated-vm, quickjs-emscripten, or a worker.
 */
async function executeInlineHandler(
  module: ModuleInfo,
  handlerCode: string,
  context: {
    body?: Record<string, unknown>
    query?: Record<string, string>
    userId?: string | null
    siteId?: string
    supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
  }
): Promise<unknown> {
  // Create limited database interface
  const db = createLimitedDBInterface(context.supabase, module)

  // Create handler context
  const handlerContext = {
    body: context.body || {},
    query: context.query || {},
    userId: context.userId,
    siteId: context.siteId,
    db
  }

  try {
    // Create and execute the handler function
    // NOTE: In production, this should use a proper sandbox
    const handlerFn = new Function(
      'ctx',
      `
      const { body, query, userId, siteId, db } = ctx;
      
      // Handler code starts here
      ${handlerCode}
      
      // Try to call the handler function if defined
      if (typeof handler === 'function') {
        return handler({ body, query, userId, siteId, db });
      }
      
      // Return undefined if no handler
      return undefined;
      `
    )

    return await handlerFn(handlerContext)
    
  } catch (error) {
    console.error('[ModuleAPI] Handler execution error:', error)
    throw new Error(
      `Handler execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Find handler code from module's api_routes
 */
async function findApiRouteHandler(
  moduleId: string,
  routeName: string,
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
): Promise<string | null> {
  const { data: module } = await supabase
    .from('module_source')
    .select('api_routes')
    .eq('id', moduleId)
    .single()

  if (!module?.api_routes) return null

  const routes = module.api_routes as Array<{
    name?: string
    handler?: string
    handlerCode?: string
  }>

  const route = routes.find(r => r.name === routeName || r.handler === routeName)
  
  return route?.handlerCode || null
}

// =============================================================
// LIMITED DATABASE INTERFACE
// =============================================================

/**
 * Create a limited database interface for modules
 * Modules can only access their own tables based on isolation level
 */
function createLimitedDBInterface(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  module: ModuleInfo
): LimitedDB {
  const shortId = module.short_id
  const isolation = module.db_isolation || 'none'
  // Cast to untyped for dynamic table access
  const db = supabase
  
  return {
    /**
     * Access a table with automatic prefixing
     */
    from: (tableName: string) => {
      let fullTableName = tableName
      
      // Apply table prefix based on isolation level
      if (isolation === 'tables') {
        const prefix = `mod_${shortId}_`
        if (!tableName.startsWith(prefix)) {
          fullTableName = prefix + tableName
        }
      } else if (isolation === 'schema') {
        const prefix = `mod_${shortId}.`
        if (!tableName.startsWith(prefix)) {
          fullTableName = prefix + tableName
        }
      }
      
      return db.from(fullTableName as never)
    },
    
    /**
     * Call an RPC function (restricted to module-specific functions)
     */
    rpc: (fnName: string, params?: unknown) => {
      // Only allow module-specific RPCs
      const allowedPrefix = `mod_${shortId}_`
      
      if (!fnName.startsWith(allowedPrefix)) {
        throw new Error(`Access denied: Cannot call function '${fnName}'. Only module-specific functions are allowed.`)
      }
      
      return db.rpc(fnName as never, params as never)
    }
  }
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

/**
 * List available API routes for a module
 */
export async function listModuleAPIRoutes(
  moduleId: string
): Promise<EdgeFunction[]> {
  const supabase = await createClient()
  const db = supabase
  
  // Try modules_v2 first
  const { data: publishedModule } = await db
    .from('modules_v2')
    .select('resources')
    .eq('id', moduleId)
    .single()

  if (publishedModule?.resources) {
    const resources = publishedModule.resources as { edge_functions?: EdgeFunction[] }
    if (resources.edge_functions) {
      return resources.edge_functions
    }
  }

  // Try module_source
  const { data: sourceModule } = await db
    .from('module_source')
    .select('resources')
    .eq('id', moduleId)
    .single()

  if (sourceModule?.resources) {
    const resources = sourceModule.resources as { edge_functions?: EdgeFunction[] }
    return resources.edge_functions || []
  }
  
  return []
}

/**
 * Check if a module has a specific API route
 */
export async function hasModuleAPIRoute(
  moduleId: string,
  path: string,
  method: string
): Promise<boolean> {
  const routes = await listModuleAPIRoutes(moduleId)
  return routes.some(r => r.path === path && r.method === method)
}

/**
 * Validate an API route configuration
 */
export async function validateAPIRoute(route: EdgeFunction): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  if (!route.name) {
    errors.push('Route name is required')
  }

  if (!route.path || !route.path.startsWith('/')) {
    errors.push('Route path must start with /')
  }

  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(route.method)) {
    errors.push('Invalid HTTP method')
  }

  // Check for handler
  if (!route.handler && !route.handlerCode) {
    errors.push('Route must have a handler or handlerCode')
  }

  return { valid: errors.length === 0, errors }
}

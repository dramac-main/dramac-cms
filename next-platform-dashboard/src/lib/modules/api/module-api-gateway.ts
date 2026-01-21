/**
 * Module API Gateway
 * 
 * Phase EM-10: API gateway for modules with API capabilities
 * 
 * This module handles:
 * - Routing requests to module APIs
 * - Authentication and authorization
 * - Rate limiting (delegated to EM-12)
 * - Executing module handlers
 * 
 * IMPORTANT: This file defines the gateway logic and types.
 * Full implementation details are in EM-12.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId, isSuperAdmin } from '@/lib/auth/permissions'
import type { EdgeFunction, ModuleCapabilities, DatabaseIsolation } from '../types/module-types-v2'

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
  const userId = await getCurrentUserId()

  try {
    // 1. Get module configuration
    // First try modules_v2 (published modules), then module_source (studio modules)
    let module: ModuleInfo | null = null
    
    const { data: publishedModule } = await supabase
      .from('modules_v2')
      .select('id, short_id, capabilities, resources, db_isolation')
      .eq('id', request.moduleId)
      .eq('status', 'active')
      .single()

    if (publishedModule) {
      module = publishedModule as ModuleInfo
    } else {
      const { data: sourceModule } = await supabase
        .from('module_source')
        .select('id, short_id, capabilities, resources, db_isolation')
        .eq('id', request.moduleId)
        .single()
      
      if (sourceModule) {
        module = sourceModule as ModuleInfo
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
      
      return supabase.from(fullTableName)
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
      
      return supabase.rpc(fnName, params as Record<string, unknown>)
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
  
  // Try modules_v2 first
  const { data: publishedModule } = await supabase
    .from('modules_v2')
    .select('resources')
    .eq('id', moduleId)
    .single()

  if (publishedModule?.resources?.edge_functions) {
    return publishedModule.resources.edge_functions
  }

  // Try module_source
  const { data: sourceModule } = await supabase
    .from('module_source')
    .select('resources')
    .eq('id', moduleId)
    .single()

  return sourceModule?.resources?.edge_functions || []
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
export function validateAPIRoute(route: EdgeFunction): { valid: boolean; errors: string[] } {
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

/**
 * Route Registration Service
 * 
 * Phase EM-12: Module API Gateway
 * 
 * Provides functionality for registering, managing, and documenting
 * API routes for modules.
 * 
 * @see phases/enterprise-modules/PHASE-EM-12-MODULE-API-GATEWAY.md
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/client'

// =============================================================
// TYPES
// =============================================================

export interface RouteDefinition {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  handler: string  // Handler code
  requiresAuth?: boolean
  requiredScopes?: string[]
  rateLimitPerMinute?: number
  cacheTtlSeconds?: number
  summary?: string
  description?: string
  requestSchema?: object
  responseSchema?: object
}

export interface RegisteredRoute {
  id: string
  moduleId: string
  path: string
  method: string
  handlerType: 'function' | 'proxy' | 'static'
  requiresAuth: boolean
  requiredScopes: string[]
  rateLimitPerMinute: number | null
  cacheTtlSeconds: number
  summary: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers: Array<{ url: string; description?: string }>
  security?: Array<Record<string, string[]>>
  paths: Record<string, Record<string, OpenAPIPathItem>>
  components?: {
    securitySchemes?: Record<string, OpenAPISecurityScheme>
    schemas?: Record<string, object>
  }
}

interface OpenAPIPathItem {
  summary?: string
  description?: string
  security?: Array<Record<string, string[]>>
  parameters?: Array<{
    name: string
    in: 'path' | 'query' | 'header'
    required?: boolean
    schema?: object
    description?: string
  }>
  requestBody?: {
    required?: boolean
    content: Record<string, { schema: object }>
  }
  responses: Record<string, {
    description: string
    content?: Record<string, { schema: object }>
  }>
}

interface OpenAPISecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: string
  bearerFormat?: string
  in?: 'header' | 'query' | 'cookie'
  name?: string
}

// =============================================================
// ROUTE REGISTRATION
// =============================================================

/**
 * Register API routes for a module
 * 
 * This will deactivate existing routes and register the new ones.
 * Useful for module updates/deployments.
 * 
 * @param moduleId - The module ID
 * @param routes - Array of route definitions
 */
export async function registerModuleRoutes(
  moduleId: string,
  routes: RouteDefinition[]
): Promise<void> {
  const supabase = createAdminClient()
  
  // Deactivate existing routes for this module
  await supabase
    .from('module_api_routes')
    .update({ is_active: false })
    .eq('module_id', moduleId)
  
  // Insert/update routes
  for (const route of routes) {
    const { error } = await supabase
      .from('module_api_routes')
      .upsert({
        module_id: moduleId,
        path: route.path,
        method: route.method,
        handler_type: 'function',
        handler_code: route.handler,
        requires_auth: route.requiresAuth ?? true,
        required_scopes: route.requiredScopes || [],
        rate_limit_per_minute: route.rateLimitPerMinute ?? null,
        cache_ttl_seconds: route.cacheTtlSeconds || 0,
        summary: route.summary || null,
        description: route.description || null,
        request_schema: route.requestSchema || null,
        response_schema: route.responseSchema || null,
        is_active: true,
        updated_at: new Date().toISOString()
      } as never, {
        onConflict: 'module_id,path,method'
      })
    
    if (error) {
      console.error('Failed to register route:', error)
      throw new Error(`Failed to register route ${route.method} ${route.path}: ${error.message}`)
    }
  }
}

/**
 * Register a single route for a module
 * 
 * @param moduleId - The module ID
 * @param route - The route definition
 */
export async function registerRoute(
  moduleId: string,
  route: RouteDefinition
): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('module_api_routes')
    .upsert({
      module_id: moduleId,
      path: route.path,
      method: route.method,
      handler_type: 'function',
      handler_code: route.handler,
      requires_auth: route.requiresAuth ?? true,
      required_scopes: route.requiredScopes || [],
      rate_limit_per_minute: route.rateLimitPerMinute ?? null,
      cache_ttl_seconds: route.cacheTtlSeconds || 0,
      summary: route.summary || null,
      description: route.description || null,
      request_schema: route.requestSchema || null,
      response_schema: route.responseSchema || null,
      is_active: true,
      updated_at: new Date().toISOString()
    } as never, {
      onConflict: 'module_id,path,method'
    })
  
  if (error) {
    throw new Error(`Failed to register route: ${error.message}`)
  }
}

/**
 * Register a proxy route (forwards to external URL)
 * 
 * @param moduleId - The module ID
 * @param path - The route path
 * @param method - HTTP method
 * @param targetUrl - The URL to proxy to
 * @param options - Optional settings
 */
export async function registerProxyRoute(
  moduleId: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  targetUrl: string,
  options?: {
    requiresAuth?: boolean
    requiredScopes?: string[]
    summary?: string
    description?: string
  }
): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('module_api_routes')
    .upsert({
      module_id: moduleId,
      path,
      method,
      handler_type: 'proxy',
      handler_url: targetUrl,
      requires_auth: options?.requiresAuth ?? true,
      required_scopes: options?.requiredScopes || [],
      summary: options?.summary || null,
      description: options?.description || null,
      is_active: true,
      updated_at: new Date().toISOString()
    } as never, {
      onConflict: 'module_id,path,method'
    })
  
  if (error) {
    throw new Error(`Failed to register proxy route: ${error.message}`)
  }
}

// =============================================================
// ROUTE MANAGEMENT
// =============================================================

/**
 * Get all registered routes for a module
 * 
 * @param moduleId - The module ID
 * @param includeInactive - Whether to include inactive routes
 * @returns Array of registered routes
 */
export async function getModuleRoutes(
  moduleId: string,
  includeInactive = false
): Promise<RegisteredRoute[]> {
  const supabase = createAdminClient()
  
  let query = supabase
    .from('module_api_routes')
    .select('*')
    .eq('module_id', moduleId)
    .order('path')
  
  if (!includeInactive) {
    query = query.eq('is_active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to get routes: ${error.message}`)
  }
  
  return (data || []).map(route => ({
    id: route.id,
    moduleId: route.module_id,
    path: route.path,
    method: route.method,
    handlerType: route.handler_type as 'function' | 'proxy' | 'static',
    requiresAuth: route.requires_auth ?? true,
    requiredScopes: route.required_scopes || [],
    rateLimitPerMinute: route.rate_limit_per_minute,
    cacheTtlSeconds: route.cache_ttl_seconds || 0,
    summary: route.summary,
    description: route.description,
    isActive: route.is_active ?? true,
    createdAt: route.created_at ?? new Date().toISOString(),
    updatedAt: route.updated_at ?? new Date().toISOString()
  }))
}

/**
 * Deactivate a route
 * 
 * @param routeId - The route ID
 */
export async function deactivateRoute(routeId: string): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('module_api_routes')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', routeId)
  
  if (error) {
    throw new Error(`Failed to deactivate route: ${error.message}`)
  }
}

/**
 * Activate a route
 * 
 * @param routeId - The route ID
 */
export async function activateRoute(routeId: string): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('module_api_routes')
    .update({ 
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', routeId)
  
  if (error) {
    throw new Error(`Failed to activate route: ${error.message}`)
  }
}

/**
 * Delete a route permanently
 * 
 * @param routeId - The route ID
 */
export async function deleteRoute(routeId: string): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('module_api_routes')
    .delete()
    .eq('id', routeId)
  
  if (error) {
    throw new Error(`Failed to delete route: ${error.message}`)
  }
}

/**
 * Deactivate all routes for a module
 * 
 * @param moduleId - The module ID
 */
export async function deactivateModuleRoutes(moduleId: string): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('module_api_routes')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('module_id', moduleId)
  
  if (error) {
    throw new Error(`Failed to deactivate routes: ${error.message}`)
  }
}

// =============================================================
// OPENAPI SPECIFICATION GENERATION
// =============================================================

/**
 * Generate OpenAPI 3.0 specification for a module
 * 
 * @param moduleId - The module ID
 * @param options - Optional customization
 * @returns OpenAPI specification object
 */
export async function generateModuleOpenApiSpec(
  moduleId: string,
  options?: {
    title?: string
    version?: string
    description?: string
    serverUrl?: string
  }
): Promise<OpenAPISpec> {
  const routes = await getModuleRoutes(moduleId)
  
  const paths: OpenAPISpec['paths'] = {}
  
  for (const route of routes) {
    if (!paths[route.path]) {
      paths[route.path] = {}
    }
    
    // Extract path parameters
    const pathParams = extractPathParameters(route.path)
    
    const pathItem: OpenAPIPathItem = {
      summary: route.summary || undefined,
      description: route.description || undefined,
      security: route.requiresAuth 
        ? [{ bearerAuth: [] }, { apiKey: [] }] 
        : [],
      parameters: pathParams.length > 0 
        ? pathParams.map(name => ({
            name,
            in: 'path' as const,
            required: true,
            schema: { type: 'string' }
          }))
        : undefined,
      responses: {
        '200': {
          description: 'Successful response'
        },
        '400': { description: 'Bad request' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - insufficient permissions' },
        '404': { description: 'Not found' },
        '429': { description: 'Rate limit exceeded' },
        '500': { description: 'Internal server error' }
      }
    }
    
    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      pathItem.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      }
    }
    
    paths[route.path][route.method.toLowerCase()] = pathItem
  }
  
  return {
    openapi: '3.0.0',
    info: {
      title: options?.title || `Module API - ${moduleId}`,
      version: options?.version || '1.0.0',
      description: options?.description
    },
    servers: [
      { 
        url: options?.serverUrl || `/api/modules/${moduleId}/api`,
        description: 'Module API endpoint'
      }
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
  }
}

/**
 * Generate OpenAPI spec as YAML string
 * 
 * @param moduleId - The module ID
 * @param options - Optional customization
 * @returns OpenAPI spec as YAML string
 */
export async function generateModuleOpenApiYaml(
  moduleId: string,
  options?: {
    title?: string
    version?: string
    description?: string
    serverUrl?: string
  }
): Promise<string> {
  const spec = await generateModuleOpenApiSpec(moduleId, options)
  
  // Simple YAML serialization (for a proper solution, use js-yaml)
  return jsonToYaml(spec)
}

// =============================================================
// ROUTE VALIDATION
// =============================================================

/**
 * Validate a route definition
 * 
 * @param route - The route to validate
 * @returns Validation result
 */
export function validateRouteDefinition(route: RouteDefinition): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Path validation
  if (!route.path) {
    errors.push('Route path is required')
  } else if (!route.path.startsWith('/')) {
    errors.push('Route path must start with /')
  } else if (!/^[a-zA-Z0-9/_:-]+$/.test(route.path)) {
    errors.push('Route path contains invalid characters')
  }
  
  // Method validation
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  if (!route.method) {
    errors.push('HTTP method is required')
  } else if (!validMethods.includes(route.method)) {
    errors.push(`Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`)
  }
  
  // Handler validation
  if (!route.handler || route.handler.trim().length === 0) {
    errors.push('Handler code is required')
  }
  
  // Scopes validation
  if (route.requiredScopes) {
    for (const scope of route.requiredScopes) {
      if (!/^[a-z_*]+:[a-z_*]+$/.test(scope) && scope !== '*') {
        errors.push(`Invalid scope format: ${scope}. Expected format: action:resource`)
      }
    }
  }
  
  // Rate limit validation
  if (route.rateLimitPerMinute !== undefined && route.rateLimitPerMinute < 1) {
    errors.push('Rate limit must be at least 1 request per minute')
  }
  
  // Cache TTL validation
  if (route.cacheTtlSeconds !== undefined && route.cacheTtlSeconds < 0) {
    errors.push('Cache TTL cannot be negative')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// =============================================================
// HELPERS
// =============================================================

/**
 * Extract path parameters from a route path
 */
function extractPathParameters(path: string): string[] {
  const params: string[] = []
  const parts = path.split('/')
  
  for (const part of parts) {
    if (part.startsWith(':')) {
      params.push(part.substring(1))
    }
  }
  
  return params
}

/**
 * Simple JSON to YAML conversion
 * For production use, consider using js-yaml library
 */
function jsonToYaml(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent)
  
  if (obj === null || obj === undefined) {
    return 'null'
  }
  
  if (typeof obj === 'string') {
    // Check if string needs quoting
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"')}"`
    }
    return obj
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj)
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj.map(item => {
      const itemYaml = jsonToYaml(item, indent + 1)
      if (typeof item === 'object' && item !== null) {
        return `\n${spaces}- ${itemYaml.trimStart()}`
      }
      return `\n${spaces}- ${itemYaml}`
    }).join('')
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj)
    if (entries.length === 0) return '{}'
    
    return entries.map(([key, value]) => {
      const valueYaml = jsonToYaml(value, indent + 1)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${spaces}${key}:\n${valueYaml}`
      } else if (Array.isArray(value)) {
        return `${spaces}${key}:${valueYaml}`
      }
      return `${spaces}${key}: ${valueYaml}`
    }).join('\n')
  }
  
  return String(obj)
}

// =============================================================
// EXAMPLE ROUTE DEFINITIONS
// =============================================================

/**
 * Example: Standard CRUD routes for a resource
 */
export function createCrudRoutes(
  resourceName: string,
  tableName: string,
  options?: {
    scopes?: {
      read?: string[]
      write?: string[]
      delete?: string[]
    }
  }
): RouteDefinition[] {
  const readScopes = options?.scopes?.read || [`read:${resourceName}`]
  const writeScopes = options?.scopes?.write || [`write:${resourceName}`]
  const deleteScopes = options?.scopes?.delete || [`delete:${resourceName}`]
  
  return [
    {
      path: `/${resourceName}`,
      method: 'GET',
      summary: `List all ${resourceName}`,
      requiredScopes: readScopes,
      handler: `
        const { data, error } = await ctx.db.from('${tableName}').select('*');
        if (error) throw error;
        return { ${resourceName}: data };
      `
    },
    {
      path: `/${resourceName}/:id`,
      method: 'GET',
      summary: `Get ${resourceName} by ID`,
      requiredScopes: readScopes,
      handler: `
        const { data, error } = await ctx.db.from('${tableName}')
          .select('*')
          .eq('id', ctx.params.id)
          .single();
        if (error) throw error;
        return data;
      `
    },
    {
      path: `/${resourceName}`,
      method: 'POST',
      summary: `Create ${resourceName}`,
      requiredScopes: writeScopes,
      handler: `
        const { data, error } = await ctx.db.from('${tableName}')
          .insert(ctx.body)
          .select()
          .single();
        if (error) throw error;
        return data;
      `
    },
    {
      path: `/${resourceName}/:id`,
      method: 'PUT',
      summary: `Update ${resourceName}`,
      requiredScopes: writeScopes,
      handler: `
        const { data, error } = await ctx.db.from('${tableName}')
          .update(ctx.body)
          .eq('id', ctx.params.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      `
    },
    {
      path: `/${resourceName}/:id`,
      method: 'DELETE',
      summary: `Delete ${resourceName}`,
      requiredScopes: deleteScopes,
      handler: `
        const { error } = await ctx.db.from('${tableName}')
          .delete()
          .eq('id', ctx.params.id);
        if (error) throw error;
        return { success: true };
      `
    }
  ]
}

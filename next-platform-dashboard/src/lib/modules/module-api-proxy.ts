/**
 * Module API Proxy
 * 
 * Handles routing and execution of module API routes with:
 * - Rate limiting
 * - Authentication
 * - Request validation
 * - Response handling
 * - Error management
 * 
 * @module module-api-proxy
 */

"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export interface ApiRouteConfig {
  id: string;
  moduleSourceId: string;
  routePath: string;
  methods: ("GET" | "POST" | "PUT" | "DELETE" | "PATCH")[];
  handlerCode: string;
  requiresAuth: boolean;
  rateLimitRequests: number;
  rateLimitWindowMs: number;
  allowedOrigins: string[];
  isEnabled: boolean;
  description?: string;
}

export interface ModuleApiContext {
  moduleId: string;
  siteId: string;
  clientId?: string;
  agencyId?: string;
  userId?: string;
  settings: Record<string, unknown>;
}

export interface ApiRequestInfo {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
  ip: string;
}

export interface ApiResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ============================================================================
// Rate Limiting
// ============================================================================

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitKey(moduleId: string, siteId: string, routePath: string, ip: string): string {
  return `${moduleId}:${siteId}:${routePath}:${ip}`;
}

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetTime) {
    // Start new window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: entry.resetTime - now 
    };
  }

  entry.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - entry.count, 
    resetIn: entry.resetTime - now 
  };
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Every minute

// ============================================================================
// API Route Management
// ============================================================================

/**
 * Type for API route row from Phase 81C table
 */
interface ModuleApiRouteRow {
  id: string;
  module_source_id: string;
  route_path: string;
  methods: string[];
  handler_code: string;
  requires_auth: boolean;
  rate_limit_requests: number;
  rate_limit_window_ms: number;
  allowed_origins: string[] | null;
  is_enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Helper to convert ModuleApiRouteRow to ApiRouteConfig
 */
function rowToConfig(row: ModuleApiRouteRow): ApiRouteConfig {
  return {
    id: row.id,
    moduleSourceId: row.module_source_id,
    routePath: row.route_path,
    methods: row.methods as ("GET" | "POST" | "PUT" | "DELETE" | "PATCH")[],
    handlerCode: row.handler_code,
    requiresAuth: row.requires_auth,
    rateLimitRequests: row.rate_limit_requests,
    rateLimitWindowMs: row.rate_limit_window_ms,
    allowedOrigins: row.allowed_origins || [],
    isEnabled: row.is_enabled,
    description: row.description || undefined,
  };
}

/**
 * Get an API route configuration
 */
export async function getApiRoute(
  moduleSourceId: string,
  routePath: string
): Promise<ApiRouteConfig | null> {
  const supabase = await createClient();

  // Use type assertion for Phase 81C table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("module_api_routes")
    .select("*")
    .eq("module_source_id", moduleSourceId)
    .eq("route_path", routePath)
    .eq("is_enabled", true)
    .single();

  if (!data) return null;

  return rowToConfig(data as ModuleApiRouteRow);
}

/**
 * Get all API routes for a module
 */
export async function getApiRoutes(moduleSourceId: string): Promise<ApiRouteConfig[]> {
  const supabase = await createClient();

  // Use type assertion for Phase 81C table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("module_api_routes")
    .select("*")
    .eq("module_source_id", moduleSourceId)
    .order("route_path");

  return ((data || []) as ModuleApiRouteRow[]).map(rowToConfig);
}

/**
 * Create or update an API route
 */
export async function upsertApiRoute(
  route: Omit<ApiRouteConfig, "id"> & { id?: string }
): Promise<{ success: boolean; route?: ApiRouteConfig; error?: string }> {
  const supabase = await createClient();

  // Validate route path
  if (!route.routePath.startsWith("/")) {
    return { success: false, error: "Route path must start with /" };
  }

  // Validate methods
  const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  if (!route.methods.every(m => validMethods.includes(m))) {
    return { success: false, error: "Invalid HTTP method(s)" };
  }

  // Validate handler code (basic check)
  if (!route.handlerCode || route.handlerCode.length < 10) {
    return { success: false, error: "Handler code is required" };
  }

  // Use type assertion for Phase 81C table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("module_api_routes")
    .upsert({
      id: route.id,
      module_source_id: route.moduleSourceId,
      route_path: route.routePath,
      methods: route.methods,
      handler_code: route.handlerCode,
      requires_auth: route.requiresAuth,
      rate_limit_requests: route.rateLimitRequests,
      rate_limit_window_ms: route.rateLimitWindowMs,
      allowed_origins: route.allowedOrigins,
      is_enabled: route.isEnabled,
      description: route.description,
      updated_at: new Date().toISOString(),
    }, { onConflict: "module_source_id,route_path" })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    route: rowToConfig(data as ModuleApiRouteRow),
  };
}

/**
 * Delete an API route
 */
export async function deleteApiRoute(
  moduleSourceId: string,
  routePath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Use type assertion for Phase 81C table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("module_api_routes")
    .delete()
    .eq("module_source_id", moduleSourceId)
    .eq("route_path", routePath);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================================================
// API Request Execution
// ============================================================================

/**
 * Execute a module API route
 */
export async function executeApiRoute(
  route: ApiRouteConfig,
  request: ApiRequestInfo,
  context: ModuleApiContext
): Promise<ApiResponse> {
  // Check if method is allowed
  if (!route.methods.includes(request.method as "GET" | "POST" | "PUT" | "DELETE" | "PATCH")) {
    return {
      status: 405,
      body: { error: "Method not allowed" },
      headers: { "Allow": route.methods.join(", ") },
    };
  }

  // Check rate limit
  const rateLimitKey = getRateLimitKey(
    context.moduleId,
    context.siteId,
    route.routePath,
    request.ip
  );
  
  const rateLimit = checkRateLimit(
    rateLimitKey,
    route.rateLimitRequests,
    route.rateLimitWindowMs
  );

  if (!rateLimit.allowed) {
    return {
      status: 429,
      body: { 
        error: "Too many requests",
        retryAfter: Math.ceil(rateLimit.resetIn / 1000),
      },
      headers: {
        "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Date.now() + rateLimit.resetIn),
      },
    };
  }

  // Check CORS if origins are specified
  if (route.allowedOrigins.length > 0) {
    const origin = request.headers["origin"] || "";
    if (origin && !route.allowedOrigins.includes(origin) && !route.allowedOrigins.includes("*")) {
      return {
        status: 403,
        body: { error: "Origin not allowed" },
      };
    }
  }

  try {
    // Execute handler in sandboxed environment
    const result = await executeHandler(route.handlerCode, request, context);

    return {
      status: result.status || 200,
      body: result.body,
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(Date.now() + rateLimit.resetIn),
        ...result.headers,
      },
    };
  } catch (error) {
    console.error(`[ModuleApiProxy] Handler error:`, error);
    
    return {
      status: 500,
      body: { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Execute handler code in a sandboxed environment
 * In production, use a proper sandbox like VM2 or isolated-vm
 */
async function executeHandler(
  handlerCode: string,
  request: ApiRequestInfo,
  context: ModuleApiContext
): Promise<{ status?: number; body: unknown; headers?: Record<string, string> }> {
  const supabase = await createClient();

  // Create a safe execution context
  const safeContext = {
    // Request info
    request: {
      method: request.method,
      path: request.path,
      query: request.query,
      headers: sanitizeHeaders(request.headers),
      body: request.body,
    },
    // Module context
    context: {
      moduleId: context.moduleId,
      siteId: context.siteId,
      clientId: context.clientId,
      agencyId: context.agencyId,
      settings: context.settings,
    },
    // Safe utilities
    utils: {
      json: (data: unknown, status: number = 200) => ({ status, body: data }),
      error: (message: string, status: number = 400) => ({ status, body: { error: message } }),
      redirect: (url: string) => ({ status: 302, body: null, headers: { Location: url } }),
    },
    // Limited database access (scoped to module's data)
    db: {
      async get(key: string) {
        const { data } = await supabase
          .from("module_data")
          .select("data_value")
          .eq("module_id", context.moduleId)
          .eq("site_id", context.siteId)
          .eq("data_key", key)
          .single();
        return data?.data_value;
      },
      async set(key: string, value: unknown) {
        // Convert value to JSON-compatible type
        const jsonValue = JSON.parse(JSON.stringify(value));
        await supabase
          .from("module_data")
          .upsert({
            module_id: context.moduleId,
            site_id: context.siteId,
            data_key: key,
            data_value: jsonValue,
            updated_at: new Date().toISOString(),
          }, { onConflict: "module_id,site_id,data_key" });
      },
      async delete(key: string) {
        await supabase
          .from("module_data")
          .delete()
          .eq("module_id", context.moduleId)
          .eq("site_id", context.siteId)
          .eq("data_key", key);
      },
      async list(prefix?: string) {
        let query = supabase
          .from("module_data")
          .select("data_key, data_value")
          .eq("module_id", context.moduleId)
          .eq("site_id", context.siteId);
        
        if (prefix) {
          query = query.like("data_key", `${prefix}%`);
        }
        
        const { data } = await query;
        return data || [];
      },
    },
    // Console (limited)
    console: {
      log: (...args: unknown[]) => console.log(`[Module:${context.moduleId}]`, ...args),
      error: (...args: unknown[]) => console.error(`[Module:${context.moduleId}]`, ...args),
      warn: (...args: unknown[]) => console.warn(`[Module:${context.moduleId}]`, ...args),
    },
    // Fetch (with restrictions)
    fetch: createRestrictedFetch(context.moduleId),
  };

  // Create async function from handler code
  // SECURITY: In production, use a proper sandbox!
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  
  try {
    // Wrap handler code
    const wrappedCode = `
      const { request, context, utils, db, console, fetch } = __ctx__;
      ${handlerCode}
      return typeof handler === "function" ? handler(request, context) : utils.error("No handler function found");
    `;

    const handler = new AsyncFunction("__ctx__", wrappedCode);
    const result = await handler(safeContext);

    // Normalize result
    if (result && typeof result === "object" && "status" in result) {
      return result;
    }

    // If result is a Response-like object
    if (result && typeof result.json === "function") {
      return { status: result.status || 200, body: await result.json() };
    }

    // Plain object/value
    return { status: 200, body: result };

  } catch (error) {
    console.error(`[ModuleApiProxy] Execution error:`, error);
    throw error;
  }
}

/**
 * Sanitize request headers (remove sensitive ones)
 */
function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sensitiveHeaders = [
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
  ];

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Create a restricted fetch function for modules
 */
function createRestrictedFetch(moduleId: string) {
  // Blocked domains for security
  const blockedDomains = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.", // Link-local
    "10.", // Private
    "172.16.", // Private
    "192.168.", // Private
  ];

  return async (url: string | URL, init?: RequestInit): Promise<Response> => {
    const urlObj = new URL(url);

    // Check for blocked domains
    const hostname = urlObj.hostname.toLowerCase();
    for (const blocked of blockedDomains) {
      if (hostname.includes(blocked)) {
        throw new Error(`Access to ${hostname} is not allowed`);
      }
    }

    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          ...init?.headers,
          "User-Agent": `ModuleRuntime/${moduleId}`,
        },
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };
}

// ============================================================================
// Route Matching
// ============================================================================

/**
 * Match a request path to a route pattern
 */
export function matchRoute(
  requestPath: string,
  routePath: string
): { match: boolean; params: Record<string, string> } {
  // Normalize paths
  const reqParts = requestPath.split("/").filter(Boolean);
  const routeParts = routePath.split("/").filter(Boolean);

  if (reqParts.length !== routeParts.length) {
    // Check for catch-all routes
    if (!routePath.includes("*")) {
      return { match: false, params: {} };
    }
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const reqPart = reqParts[i];

    // Catch-all
    if (routePart === "*") {
      params["*"] = reqParts.slice(i).join("/");
      return { match: true, params };
    }

    // Parameter
    if (routePart.startsWith(":")) {
      const paramName = routePart.slice(1);
      params[paramName] = reqPart;
      continue;
    }

    // Exact match
    if (routePart !== reqPart) {
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

/**
 * Find the best matching route for a request
 */
export async function findMatchingRoute(
  moduleSourceId: string,
  requestPath: string
): Promise<{ route: ApiRouteConfig; params: Record<string, string> } | null> {
  const routes = await getApiRoutes(moduleSourceId);
  
  // Sort routes: exact matches first, then parameterized, then catch-all
  const sortedRoutes = routes
    .filter(r => r.isEnabled)
    .sort((a, b) => {
      const aHasParam = a.routePath.includes(":");
      const bHasParam = b.routePath.includes(":");
      const aHasCatchAll = a.routePath.includes("*");
      const bHasCatchAll = b.routePath.includes("*");

      if (aHasCatchAll && !bHasCatchAll) return 1;
      if (bHasCatchAll && !aHasCatchAll) return -1;
      if (aHasParam && !bHasParam) return 1;
      if (bHasParam && !aHasParam) return -1;
      return 0;
    });

  for (const route of sortedRoutes) {
    const result = matchRoute(requestPath, route.routePath);
    if (result.match) {
      return { route, params: result.params };
    }
  }

  return null;
}

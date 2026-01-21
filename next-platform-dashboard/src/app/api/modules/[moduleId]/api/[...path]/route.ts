/**
 * Module API Route Handler
 * 
 * Phase EM-10: Dynamic API routing for module endpoints
 * 
 * Routes: /api/modules/[moduleId]/api/[...path]
 * 
 * Examples:
 * - GET /api/modules/abc123/api/items
 * - POST /api/modules/abc123/api/items
 * - GET /api/modules/abc123/api/items/123
 * - PUT /api/modules/abc123/api/items/123
 */

import { NextRequest, NextResponse } from 'next/server'
import { routeModuleAPI } from '@/lib/modules/api/module-api-gateway'

type RouteParams = {
  params: Promise<{ 
    moduleId: string
    path: string[] 
  }>
}

// =============================================================
// HTTP METHOD HANDLERS
// =============================================================

export async function GET(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleRequest(request, moduleId, path, 'GET')
}

export async function POST(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleRequest(request, moduleId, path, 'POST')
}

export async function PUT(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleRequest(request, moduleId, path, 'PUT')
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleRequest(request, moduleId, path, 'DELETE')
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleRequest(request, moduleId, path, 'PATCH')
}

// =============================================================
// REQUEST HANDLER
// =============================================================

async function handleModuleRequest(
  request: NextRequest,
  moduleId: string,
  pathSegments: string[],
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
): Promise<NextResponse> {
  try {
    // Build the path
    const path = '/' + pathSegments.join('/')

    // Parse query parameters
    const query: Record<string, string> = {}
    request.nextUrl.searchParams.forEach((value, key) => {
      query[key] = value
    })

    // Get site ID from header or query
    const siteId = request.headers.get('x-site-id') || query.siteId
    delete query.siteId // Remove from query after extracting

    // Parse request body for non-GET requests
    let body: Record<string, unknown> | undefined
    if (method !== 'GET') {
      try {
        const contentType = request.headers.get('content-type') || ''
        
        if (contentType.includes('application/json')) {
          body = await request.json()
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData()
          body = Object.fromEntries(formData.entries())
        }
      } catch {
        // No body or invalid format - continue without body
      }
    }

    // Parse headers that might be relevant for the module
    const headers: Record<string, string> = {}
    const relevantHeaders = ['authorization', 'x-api-key', 'x-webhook-signature', 'content-type']
    for (const header of relevantHeaders) {
      const value = request.headers.get(header)
      if (value) {
        headers[header] = value
      }
    }

    // Route to module API gateway
    const response = await routeModuleAPI({
      moduleId,
      path,
      method,
      body,
      query,
      headers,
      siteId: siteId || undefined
    })

    // Build response headers
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add execution time if available
    if (response.meta?.executionTime) {
      responseHeaders['X-Execution-Time'] = `${response.meta.executionTime}ms`
    }

    // Return response
    if (response.success) {
      return NextResponse.json(response.data || { success: true }, {
        status: response.status,
        headers: responseHeaders
      })
    }

    return NextResponse.json(
      { 
        error: response.error,
        success: false 
      }, 
      {
        status: response.status,
        headers: responseHeaders
      }
    )

  } catch (error) {
    console.error('[ModuleAPI Route] Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      }, 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// =============================================================
// OPTIONS HANDLER (CORS)
// =============================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Site-Id, X-API-Key',
      'Access-Control-Max-Age': '86400'
    }
  })
}

/**
 * Module API Route Handler
 * 
 * Phase EM-10 + EM-12: Dynamic API routing for module endpoints
 * 
 * Routes: /api/modules/[moduleId]/api/[...path]
 * 
 * Features (EM-12):
 * - API key authentication
 * - JWT authentication  
 * - Rate limiting
 * - Request logging
 * - Scope-based authorization
 * 
 * Examples:
 * - GET /api/modules/abc123/api/items
 * - POST /api/modules/abc123/api/items
 * - GET /api/modules/abc123/api/items/123
 * - PUT /api/modules/abc123/api/items/123
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleModuleApiRequest, routeModuleAPI } from '@/lib/modules/api/module-api-gateway'

type RouteParams = {
  params: Promise<{ 
    moduleId: string
    path: string[] 
  }>
}

// =============================================================
// HTTP METHOD HANDLERS (Using EM-12 Enhanced Gateway)
// =============================================================

export async function GET(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'))
}

export async function POST(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'))
}

export async function PUT(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'))
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'))
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const { moduleId, path } = await context.params
  return handleModuleApiRequest(request, moduleId, '/' + path.join('/'))
}

// =============================================================
// OPTIONS HANDLER (CORS)
// =============================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Site-Id, X-API-Key',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400'
    }
  })
}

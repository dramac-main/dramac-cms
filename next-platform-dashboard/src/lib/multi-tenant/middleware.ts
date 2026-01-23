/**
 * Tenant-Aware API Middleware
 * 
 * This middleware injects tenant context into API requests and validates access.
 * It should be used in the Next.js middleware chain for API route protection.
 * 
 * @module multi-tenant/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper type to bypass strict Supabase typing for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

/**
 * Routes that don't require tenant context
 */
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/public',
  '/api/webhook',
  '/api/health',
  '/api/cron'
];

/**
 * Routes that require admin access
 */
const ADMIN_ROUTES = [
  '/api/admin',
  '/api/agency/settings',
  '/api/agency/users',
  '/api/agency/billing'
];

/**
 * Middleware to inject tenant context into API requests
 */
export async function tenantMiddleware(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();
  
  // Skip non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response;
  }
  
  // Skip public routes
  if (PUBLIC_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))) {
    return response;
  }
  
  try {
    const supabase = await createClient() as AnySupabaseClient;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    
    // Get site ID from various sources (priority order)
    const siteId = 
      request.headers.get('x-site-id') ||
      request.nextUrl.searchParams.get('site_id') ||
      request.cookies.get('current_site_id')?.value;
    
    // Get user's agency membership
    const { data: membership, error: membershipError } = await supabase
      .from('agency_users')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'No agency membership found', code: 'NO_AGENCY' },
        { status: 403 }
      );
    }
    
    // Check admin routes
    if (ADMIN_ROUTES.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required', code: 'ADMIN_REQUIRED' },
          { status: 403 }
        );
      }
    }
    
    // If site specified, verify access
    if (siteId) {
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('agency_id')
        .eq('id', siteId)
        .single();
      
      if (siteError || !site) {
        return NextResponse.json(
          { error: 'Site not found', code: 'SITE_NOT_FOUND' },
          { status: 404 }
        );
      }
      
      if (site.agency_id !== membership.agency_id) {
        return NextResponse.json(
          { error: 'Access denied to this site', code: 'SITE_ACCESS_DENIED' },
          { status: 403 }
        );
      }
    }
    
    // Add context to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-agency-id', membership.agency_id);
    requestHeaders.set('x-tenant-user-id', user.id);
    requestHeaders.set('x-tenant-role', membership.role);
    if (siteId) {
      requestHeaders.set('x-tenant-site-id', siteId);
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
    
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Tenant context extracted from request headers
 */
export interface RequestTenantContext {
  agencyId: string | null;
  siteId: string | null;
  userId: string | null;
  role: string | null;
}

/**
 * Extract tenant context from request headers (in API routes)
 */
export function getTenantFromRequest(request: NextRequest): RequestTenantContext {
  return {
    agencyId: request.headers.get('x-tenant-agency-id'),
    siteId: request.headers.get('x-tenant-site-id'),
    userId: request.headers.get('x-tenant-user-id'),
    role: request.headers.get('x-tenant-role')
  };
}

/**
 * Validated tenant context with required fields
 */
export interface ValidatedTenantContext {
  agencyId: string;
  siteId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

/**
 * Get and validate tenant context from request
 * Throws an error if required context is missing
 */
export function requireTenantContext(
  request: NextRequest,
  options?: { requireSite?: boolean }
): ValidatedTenantContext {
  const context = getTenantFromRequest(request);
  
  if (!context.agencyId) {
    throw new TenantContextError('Agency context missing', 'AGENCY_REQUIRED');
  }
  
  if (!context.userId) {
    throw new TenantContextError('User context missing', 'USER_REQUIRED');
  }
  
  if (!context.role) {
    throw new TenantContextError('Role context missing', 'ROLE_REQUIRED');
  }
  
  if (options?.requireSite && !context.siteId) {
    throw new TenantContextError('Site context required', 'SITE_REQUIRED');
  }
  
  return {
    agencyId: context.agencyId,
    siteId: context.siteId || '',
    userId: context.userId,
    role: context.role as ValidatedTenantContext['role']
  };
}

/**
 * Custom error class for tenant context errors
 */
export class TenantContextError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TenantContextError';
    this.code = code;
  }
}

/**
 * Handle tenant context errors and return appropriate response
 */
export function handleTenantError(error: unknown): NextResponse {
  if (error instanceof TenantContextError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 403 }
    );
  }
  
  console.error('Unexpected tenant error:', error);
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

/**
 * Require admin role in request
 */
export function requireAdminRole(context: RequestTenantContext): void {
  if (context.role !== 'owner' && context.role !== 'admin') {
    throw new TenantContextError('Admin access required', 'ADMIN_REQUIRED');
  }
}

/**
 * Require owner role in request
 */
export function requireOwnerRole(context: RequestTenantContext): void {
  if (context.role !== 'owner') {
    throw new TenantContextError('Owner access required', 'OWNER_REQUIRED');
  }
}

/**
 * Check if user has a specific role or higher
 */
export function hasRole(
  context: RequestTenantContext,
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
  };
  
  const userLevel = roleHierarchy[context.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];
  
  return userLevel >= requiredLevel;
}

/**
 * Phase EM-32: Custom Domain Middleware
 * Handles routing and white-label for custom domain requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { EdgeRouter } from '@/lib/modules/domains';

/**
 * Check if request is for a custom domain module
 * Call this from the main middleware
 */
export async function handleCustomDomain(request: NextRequest): Promise<NextResponse | null> {
  const hostname = request.headers.get('host') || '';
  
  // Skip if it's the main domain
  const mainDomains = [
    'dramac.app',
    'www.dramac.app',
    'localhost',
    '127.0.0.1'
  ];
  
  // Check if any main domain matches
  const isMainDomain = mainDomains.some(domain => 
    hostname === domain || 
    hostname.startsWith(`${domain}:`) ||
    hostname.endsWith(`.dramac.app`)
  );

  if (isMainDomain) {
    return null; // Let normal routing handle it
  }

  // Try to route the custom domain
  const route = await EdgeRouter.route(hostname);
  
  if (!route) {
    // Domain not found - could return 404 or redirect to main site
    return null;
  }

  // Get protocol from request
  const protocol = request.headers.get('x-forwarded-proto') as 'http' | 'https' || 'https';
  
  // Check for redirects
  const redirect = EdgeRouter.getRedirect(
    hostname,
    request.nextUrl.pathname,
    protocol,
    route.config
  );
  
  if (redirect) {
    return NextResponse.redirect(redirect, { status: 301 });
  }

  // Rewrite to module endpoint with context
  const url = request.nextUrl.clone();
  url.pathname = `/module-render/${route.siteModuleInstallationId}${request.nextUrl.pathname}`;
  
  const response = NextResponse.rewrite(url);
  
  // Add custom headers
  const headers = EdgeRouter.getResponseHeaders(route.config);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  // Store route info for the page to use
  response.headers.set('x-custom-domain', hostname);
  response.headers.set('x-site-module-installation-id', route.siteModuleInstallationId);
  response.headers.set('x-module-id', route.moduleId);
  response.headers.set('x-site-id', route.siteId);
  
  // Store white-label config for injection
  if (Object.keys(route.whiteLabel).length > 0) {
    response.headers.set('x-white-label', JSON.stringify(route.whiteLabel));
  }

  // Log request asynchronously (fire and forget)
  const startTime = Date.now();
  const domainId = await getDomainId(hostname);
  
  if (domainId) {
    // We'll log after response - can't do it here in middleware
    // Instead, set a header for the API to handle
    response.headers.set('x-domain-id', domainId);
    response.headers.set('x-request-start', startTime.toString());
  }

  return response;
}

/**
 * Get domain ID for logging (cached lookup)
 */
async function getDomainId(hostname: string): Promise<string | null> {
  try {
    const route = await EdgeRouter.route(hostname);
    if (!route) return null;
    
    // We need to look up the actual domain ID
    // This is a simple implementation - in production use caching
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data } = await supabase
      .from('module_custom_domains')
      .select('id')
      .eq('domain', hostname)
      .single();
    
    return data?.id || null;
  } catch {
    return null;
  }
}

export default handleCustomDomain;

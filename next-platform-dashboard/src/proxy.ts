import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { DOMAINS, isAppDomain as checkIsAppDomain } from "@/lib/constants/domains";

const DEBUG = process.env.NODE_ENV !== "production";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ========================================
  // EARLY LOGGING - Debug only
  // ========================================
  if (DEBUG) {
    console.log("[proxy] ====== REQUEST START ======");
    console.log("[proxy] Hostname:", hostname);
    console.log("[proxy] Pathname:", pathname);
  }

  // ========================================
  // DETERMINE DOMAIN TYPE FIRST
  // ========================================
  
  // Use centralized domain constants
  const baseDomain = DOMAINS.SITES_BASE;
  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";

  // Parse the app domain host
  let appHost = appDomain;
  try {
    appHost = new URL(appDomain.includes("://") ? appDomain : `https://${appDomain}`).host;
  } catch {
    appHost = appDomain;
  }

  // Check domain type
  const isLocalhost = hostname.includes("localhost");
  const isAppDomain = checkIsAppDomain(hostname) || hostname === appHost;
  const isClientSite = !isLocalhost && hostname.endsWith(`.${baseDomain}`);
  const isCustomDomain = !isAppDomain && !isClientSite && !isLocalhost;

  if (DEBUG) {
    console.log("[proxy] Base domain:", baseDomain);
    console.log("[proxy] App host:", appHost);
    console.log("[proxy] Is localhost:", isLocalhost);
    console.log("[proxy] Is app domain:", isAppDomain);
    console.log("[proxy] Is client site:", isClientSite);
    console.log("[proxy] Is custom domain:", isCustomDomain);
  }

  // ========================================
  // SUBDOMAIN/CUSTOM DOMAIN ROUTING (FIRST!)
  // Must be checked BEFORE any other routes
  // ========================================
  
  // For client sites and custom domains, DON'T rewrite API routes
  // The API routes exist at the app level and should work directly
  if ((isClientSite || isCustomDomain) && pathname.startsWith("/api")) {
    if (DEBUG) console.log("[proxy] → API route on subdomain, passing through");
    return NextResponse.next();
  }
  
  // Route client site subdomains FIRST - before any auth checks
  if (isClientSite) {
    const subdomain = hostname.replace(`.${baseDomain}`, "");
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname}`;
    if (DEBUG) console.log("[proxy] ✅ Client site rewrite:", hostname, "→", url.pathname);
    return NextResponse.rewrite(url);
  }
  
  // Route custom domains FIRST - before any auth checks
  if (isCustomDomain) {
    // Check for 301 redirect from old domain (domain_redirects table)
    // NOTE: This uses a lightweight edge-compatible lookup
    // For production, consider caching redirects at the edge
    try {
      const redirectUrl = `${DOMAINS.PROTOCOL}://${new URL(DOMAINS.APP_DOMAIN).hostname}/api/domains/${encodeURIComponent(hostname)}/redirect`;
      const redirectCheck = await fetch(redirectUrl, {
        method: "HEAD",
        redirect: "manual",
      });
      if (redirectCheck.status === 301) {
        const location = redirectCheck.headers.get("location");
        if (location) {
          if (DEBUG) console.log("[proxy] ✅ 301 redirect:", hostname, "→", location);
          return NextResponse.redirect(location + pathname, { status: 301 });
        }
      }
    } catch {
      // Redirect lookup failed — fall through to normal custom domain handling
    }

    const url = request.nextUrl.clone();
    url.pathname = `/site/${hostname}${pathname}`;
    if (DEBUG) console.log("[proxy] ✅ Custom domain rewrite:", hostname, "→", url.pathname);
    return NextResponse.rewrite(url);
  }

  // ========================================
  // PUBLIC ROUTES - No Auth Required
  // ========================================
  
  // Portal login/verify - must be accessible without auth
  if (pathname === '/portal/login' || pathname === '/portal/verify') {
    return NextResponse.next();
  }

  // Embed routes - fully public (booking widget, ecommerce, etc.)
  if (pathname.startsWith('/embed/')) {
    return NextResponse.next();
  }

  // Block test/debug pages in production
  if (pathname.startsWith('/test-') || pathname.startsWith('/debug-')) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  // Preview routes - always accessible (for editor preview)
  if (pathname.startsWith("/preview")) {
    if (DEBUG) console.log("[proxy] → Preview route, passing through");
    return NextResponse.next();
  }

  // Studio routes - full-screen editor (needs auth but handled by layout)
  if (pathname.startsWith("/studio")) {
    if (DEBUG) console.log("[proxy] → Studio route, passing through to auth");
    return await updateSession(request);
  }

  // Site renderer routes - public facing sites
  if (pathname.startsWith("/site")) {
    if (DEBUG) console.log("[proxy] → Site route, passing through");
    return NextResponse.next();
  }

  // Public marketing pages
  if (pathname === "/pricing" || pathname.startsWith("/pricing/")) {
    if (DEBUG) console.log("[proxy] → Public pricing page, passing through");
    return NextResponse.next();
  }

  // Static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    if (DEBUG) console.log("[proxy] → Static/API route, passing through");
    return NextResponse.next();
  }

  // ========================================
  // DASHBOARD ROUTES - Session Required
  // ========================================
  
  // Only check session for app domain routes
  if (isAppDomain) {
    return await updateSession(request);
  }

  // Fallback - should never reach here
  return NextResponse.next();
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { DOMAINS, extractSubdomain, isAppDomain as checkIsAppDomain } from "@/lib/constants/domains";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ========================================
  // EARLY LOGGING - Debug all requests
  // ========================================
  console.log("[proxy] ====== REQUEST START ======");
  console.log("[proxy] Hostname:", hostname);
  console.log("[proxy] Pathname:", pathname);

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

  console.log("[proxy] Base domain:", baseDomain);
  console.log("[proxy] App host:", appHost);
  console.log("[proxy] Is localhost:", isLocalhost);
  console.log("[proxy] Is app domain:", isAppDomain);
  console.log("[proxy] Is client site:", isClientSite);
  console.log("[proxy] Is custom domain:", isCustomDomain);

  // ========================================
  // SUBDOMAIN/CUSTOM DOMAIN ROUTING (FIRST!)
  // Must be checked BEFORE any other routes
  // ========================================
  
  // For client sites and custom domains, DON'T rewrite API routes
  // The API routes exist at the app level and should work directly
  if ((isClientSite || isCustomDomain) && pathname.startsWith("/api")) {
    console.log("[proxy] → API route on subdomain, passing through");
    return NextResponse.next();
  }
  
  // Route client site subdomains FIRST - before any auth checks
  if (isClientSite) {
    const subdomain = hostname.replace(`.${baseDomain}`, "");
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname}`;
    console.log("[proxy] ✅ Client site rewrite:", hostname, "→", url.pathname);
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
          console.log("[proxy] ✅ 301 redirect:", hostname, "→", location);
          return NextResponse.redirect(location + pathname, { status: 301 });
        }
      }
    } catch {
      // Redirect lookup failed — fall through to normal custom domain handling
    }

    const url = request.nextUrl.clone();
    url.pathname = `/site/${hostname}${pathname}`;
    console.log("[proxy] ✅ Custom domain rewrite:", hostname, "→", url.pathname);
    return NextResponse.rewrite(url);
  }

  // ========================================
  // PUBLIC ROUTES - No Auth Required
  // ========================================
  
  // Preview routes - always accessible (for editor preview)
  if (pathname.startsWith("/preview")) {
    console.log("[proxy] → Preview route, passing through");
    return NextResponse.next();
  }

  // Studio routes - full-screen editor (needs auth but handled by layout)
  if (pathname.startsWith("/studio")) {
    console.log("[proxy] → Studio route, passing through to auth");
    return await updateSession(request);
  }

  // Site renderer routes - public facing sites
  if (pathname.startsWith("/site")) {
    console.log("[proxy] → Site route, passing through");
    return NextResponse.next();
  }

  // Public marketing pages
  if (pathname === "/pricing" || pathname.startsWith("/pricing/")) {
    console.log("[proxy] → Public pricing page, passing through");
    return NextResponse.next();
  }

  // Static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    console.log("[proxy] → Static/API route, passing through");
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

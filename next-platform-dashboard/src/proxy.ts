import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ========================================
  // PUBLIC ROUTES - No Auth Required
  // ========================================
  
  // Preview routes - always accessible (for editor preview)
  if (pathname.startsWith("/preview")) {
    return NextResponse.next();
  }

  // Site renderer routes - public facing sites
  if (pathname.startsWith("/site")) {
    return NextResponse.next();
  }

  // Static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ========================================
  // DASHBOARD ROUTES - Session Required
  // ========================================
  
  // Skip for app routes (dashboard, auth, editor, portal, etc)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/editor") ||
    pathname.startsWith("/sites") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/debug-marketplace") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/modules") ||
    pathname.startsWith("/test-components") ||
    pathname.startsWith("/test-safety") ||
    pathname === "/"
  ) {
    return await updateSession(request);
  }

  // ========================================
  // SUBDOMAIN/CUSTOM DOMAIN ROUTING
  // ========================================
  
  // Get configuration from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramacagency.com";
  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";

  // Parse the app domain host
  let appHost = appDomain;
  try {
    appHost = new URL(appDomain.includes("://") ? appDomain : `https://${appDomain}`).host;
  } catch {
    appHost = appDomain;
  }

  // Check if this is the main app domain
  const isAppDomain = hostname === appHost;
  
  // Check if this is the root domain (agency site)
  const isRootDomain = hostname === baseDomain || hostname === `www.${baseDomain}`;
  
  // Check if this is a subdomain of base domain (e.g., mysite.dramacagency.com)
  const isSubdomain = hostname.endsWith(`.${baseDomain}`) && !isAppDomain;

  // Check if this is a custom domain (not our domains)
  const isCustomDomain = !hostname.includes(baseDomain.replace('www.', '')) && !hostname.includes("localhost");

  // Log subdomain routing for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("[proxy.ts] Routing check:", {
      hostname,
      baseDomain,
      appHost,
      isAppDomain,
      isRootDomain,
      isSubdomain,
      isCustomDomain,
      pathname
    });
  }

  // Route custom domains to site renderer
  if (isCustomDomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${hostname}${pathname}`;
    console.log("[proxy.ts] Custom domain rewrite:", hostname, "→", url.pathname);
    return NextResponse.rewrite(url);
  }

  // Route subdomains to site renderer (e.g., mysite.dramacagency.com)
  // Skip app subdomain and root domain
  if (isSubdomain && !isRootDomain) {
    const subdomain = hostname.replace(`.${baseDomain}`, "");
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname}`;
    console.log("[proxy.ts] Subdomain rewrite:", hostname, "→", url.pathname, "(subdomain:", subdomain + ")");
    return NextResponse.rewrite(url);
  }

  // For main app routes, run session update
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

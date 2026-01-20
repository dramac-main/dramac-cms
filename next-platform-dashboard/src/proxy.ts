import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ========================================
  // DETERMINE DOMAIN TYPE FIRST
  // ========================================
  
  // Get configuration from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";
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
  const isAppDomain = hostname === appHost || hostname === "app.dramacagency.com" || isLocalhost;
  const isClientSite = !isLocalhost && hostname.endsWith(`.${baseDomain}`);
  const isCustomDomain = !isAppDomain && !isClientSite && !isLocalhost;

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
  // SUBDOMAIN/CUSTOM DOMAIN ROUTING (MUST BE CHECKED FIRST!)
  // ========================================
  
  console.log("[proxy] ====== REQUEST START ======");
  console.log("[proxy] Hostname:", hostname);
  console.log("[proxy] Pathname:", pathname);
  console.log("[proxy] Base domain:", baseDomain);
  console.log("[proxy] Is localhost:", isLocalhost);
  console.log("[proxy] Is app domain:", isAppDomain);
  console.log("[proxy] Is client site:", isClientSite);
  console.log("[proxy] Is custom domain:", isCustomDomain);

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
    const url = request.nextUrl.clone();
    url.pathname = `/site/${hostname}${pathname}`;
    console.log("[proxy] ✅ Custom domain rewrite:", hostname, "→", url.pathname);
    return NextResponse.rewrite(url);
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

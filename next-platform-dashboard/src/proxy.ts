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

  // Get base domain from env
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
  const appDomain = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";

  // Check if this is a custom domain or subdomain
  const isBaseDomain = hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
  const isAppDomain = hostname.includes(new URL(appDomain).host);

  // If custom domain (not our base domain), rewrite to renderer
  if (!isBaseDomain && !isAppDomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${hostname}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // If subdomain of base domain (e.g., mysite.platform.com)
  if (isBaseDomain && hostname !== baseDomain) {
    const subdomain = hostname.replace(`.${baseDomain}`, "");
    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname}`;
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

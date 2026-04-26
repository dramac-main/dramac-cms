import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  DOMAINS,
  isAppDomain as checkIsAppDomain,
} from "@/lib/constants/domains";

const DEBUG = process.env.NODE_ENV !== "production";

/**
 * Apply response headers that were previously in next.config.ts headers().
 * Moved here to reduce Vercel route count (headers in config each consume a route entry).
 */
function applyResponseHeaders(
  response: NextResponse,
  pathname: string,
): NextResponse {
  // Skip redirect responses — browser follows redirect, destination page gets its own headers
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  const isEmbed = pathname.startsWith("/embed/") || pathname === "/embed";
  const isEmbedJs = isEmbed && pathname.endsWith(".js");
  const isCheckout = /^\/(pricing|dashboard\/billing|settings\/billing)/.test(
    pathname,
  );

  // Pattern 1: Cache embed JS scripts at CDN edge
  if (isEmbedJs) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    );
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Content-Type",
      "application/javascript; charset=utf-8",
    );
  }

  // Pattern 2: Security headers for non-embed, non-checkout routes
  if (!isEmbed && !isCheckout) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "worker-src 'self' blob: https://cdn.jsdelivr.net;",
    );
  }

  // Pattern 3: Paddle checkout requires permissive CSP for overlay checkout
  if (isCheckout) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://*.paddle.com blob:",
        "style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://*.paddle.com",
        "img-src 'self' data: blob: https://*.paddle.com https://cdn.paddle.com https://*.supabase.co",
        "font-src 'self' data: https://cdn.paddle.com https://*.paddle.com",
        "frame-src 'self' https://*.paddle.com https://sandbox-buy.paddle.com https://buy.paddle.com",
        "connect-src 'self' https://*.paddle.com https://sandbox-api.paddle.com https://api.paddle.com https://*.supabase.co wss://*.supabase.co",
        "worker-src 'self' blob:",
      ].join("; "),
    );
  }

  // Pattern 4: CORS and permissive CSP for embed routes
  if (isEmbed) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set(
      "Content-Security-Policy",
      [
        "frame-ancestors *",
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
        "img-src * data: blob:",
        "font-src * data:",
        "connect-src 'self' https: wss:",
        "worker-src 'self' blob:",
      ].join("; "),
    );
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const response = await proxyCore(request);
  return applyResponseHeaders(response, request.nextUrl.pathname);
}

async function proxyCore(request: NextRequest) {
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
    appHost = new URL(
      appDomain.includes("://") ? appDomain : `https://${appDomain}`,
    ).host;
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
  // STATIC ASSET GUARD
  // Middleware matcher should exclude these, but as a safety net
  // never rewrite _next/static, _next/image, or common asset paths
  // ========================================
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    /\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico|map)$/i.test(
      pathname,
    )
  ) {
    if (DEBUG)
      console.log("[proxy] → Static asset, passing through:", pathname);
    return NextResponse.next();
  }

  // ========================================
  // SUBDOMAIN/CUSTOM DOMAIN ROUTING (FIRST!)
  // Must be checked BEFORE any other routes
  // ========================================

  // For client sites and custom domains, DON'T rewrite API, embed, or quote routes
  // The API routes, embed pages, and quote portal exist at the app level and should work directly
  if (
    (isClientSite || isCustomDomain) &&
    (pathname.startsWith("/api") ||
      pathname.startsWith("/embed") ||
      pathname.startsWith("/quote/"))
  ) {
    if (DEBUG)
      console.log("[proxy] → API/embed route on subdomain, passing through");
    return NextResponse.next();
  }

  // Route client site subdomains FIRST - before any auth checks
  if (isClientSite) {
    const subdomain = hostname.replace(`.${baseDomain}`, "");

    // Blog routes on client sites → rewrite through site renderer
    // The site renderer generates virtual blog pages with Navbar/Footer injection
    if (pathname === "/blog" || pathname.startsWith("/blog/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/site/${subdomain}${pathname}`;
      if (DEBUG)
        console.log(
          "[proxy] ✅ Client site blog rewrite:",
          hostname + pathname,
          "→",
          url.pathname,
        );
      return NextResponse.rewrite(url);
    }

    const url = request.nextUrl.clone();
    url.pathname = `/site/${subdomain}${pathname}`;
    if (DEBUG)
      console.log(
        "[proxy] ✅ Client site rewrite:",
        hostname,
        "→",
        url.pathname,
      );
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
          if (DEBUG)
            console.log("[proxy] ✅ 301 redirect:", hostname, "→", location);
          return NextResponse.redirect(location + pathname, { status: 301 });
        }
      }
    } catch {
      // Redirect lookup failed — fall through to normal custom domain handling
    }

    const url = request.nextUrl.clone();
    url.pathname = `/site/${hostname}${pathname}`;
    if (DEBUG)
      console.log(
        "[proxy] ✅ Custom domain rewrite:",
        hostname,
        "→",
        url.pathname,
      );
    return NextResponse.rewrite(url);
  }

  // ========================================
  // PUBLIC ROUTES - No Auth Required
  // ========================================

  // Portal login/verify - must be accessible without auth
  if (pathname === "/portal/login" || pathname === "/portal/verify") {
    return NextResponse.next();
  }

  // Quote portal - public, token-based access (no login required)
  if (pathname.startsWith("/quote/")) {
    return NextResponse.next();
  }

  // Embed routes - fully public (booking widget, ecommerce, etc.)
  if (pathname.startsWith("/embed/")) {
    return NextResponse.next();
  }

  // Legacy alias redirects (pages removed to reduce Vercel route count)
  if (pathname === "/dashboard/settings/branding") {
    return NextResponse.redirect(new URL("/settings/branding", request.url), 301);
  }
  if (pathname === "/dashboard/billing") {
    const qs = request.nextUrl.search || "";
    return NextResponse.redirect(new URL("/settings/billing" + qs, request.url), 301);
  }
  if (pathname === "/dashboard/clients/new") {
    return NextResponse.redirect(new URL("/dashboard/clients?create=true", request.url), 301);
  }
  if (pathname === "/marketplace/installed") {
    return NextResponse.redirect(new URL("/dashboard/modules/subscriptions", request.url), 301);
  }
  if (pathname === "/settings") {
    return NextResponse.redirect(new URL("/settings/profile", request.url), 301);
  }
  {
    const m1 = pathname.match(/^\/dashboard\/sites\/([^/]+)\/builder$/);
    if (m1) {
      return NextResponse.redirect(new URL("/dashboard/sites/" + m1[1] + "/ai-designer", request.url), 301);
    }
    const m2 = pathname.match(/^\/dashboard\/sites\/([^/]+)\/pages$/);
    if (m2) {
      return NextResponse.redirect(new URL("/dashboard/sites/" + m2[1] + "?tab=pages", request.url), 301);
    }
    const m3 = pathname.match(/^\/dashboard\/sites\/([^/]+)\/pages\/([^/]+)$/);
    if (m3) {
      return NextResponse.redirect(new URL("/studio/" + m3[1] + "/" + m3[2], request.url), 301);
    }
    // Legacy editor URL → site detail pages tab (page deleted to reduce route count)
    const m4 = pathname.match(/^\/dashboard\/sites\/([^/]+)\/editor$/);
    if (m4) {
      return NextResponse.redirect(new URL("/dashboard/sites/" + m4[1] + "?tab=pages", request.url), 301);
    }
  }
  // Legacy public blog redirects (subdomain) — pages deleted to reduce Vercel route count.
  // Old URL: app.dramacagency.com/blog/{subdomain}[/{slug}]
  // New URL: {subdomain}.{baseDomain}/blog[/{slug}]
  {
    const b1 = pathname.match(/^\/blog\/([^/]+)$/);
    if (b1) {
      return NextResponse.redirect(`https://${b1[1]}.${baseDomain}/blog`, 301);
    }
    const b2 = pathname.match(/^\/blog\/([^/]+)\/([^/]+)$/);
    if (b2) {
      return NextResponse.redirect(`https://${b2[1]}.${baseDomain}/blog/${b2[2]}`, 301);
    }
  }
  // Legacy portal products redirects (pages removed to reduce Vercel route count)
  // Portal product/order management now lives at /ecommerce (EcommerceDashboard).
  {
    const pp = pathname.match(/^\/portal\/sites\/([^/]+)\/products(\/.*)?$/);
    if (pp) {
      return NextResponse.redirect(
        new URL("/portal/sites/" + pp[1] + "/ecommerce", request.url),
        301,
      );
    }
  }
  // Legacy domain settings redirects (pages removed to reduce Vercel route count)
  if (pathname.startsWith("/dashboard/settings/domains")) {
    const newPath = pathname.replace(
      "/dashboard/settings/domains",
      "/dashboard/domains/settings",
    );
    return NextResponse.redirect(new URL(newPath, request.url), 301);
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

  // Public marketing/legal pages — no auth required
  const PUBLIC_PATHS = ["/blog", "/pricing", "/privacy", "/terms"];
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    if (DEBUG) console.log("[proxy] → Public page, passing through:", pathname);
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
    const response = await updateSession(request);
    // Set x-pathname header for server components that need the current path
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // Fallback - should never reach here
  return NextResponse.next();
}

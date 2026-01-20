import { NextResponse } from "next/server";

/**
 * Debug endpoint to check proxy routing
 * GET /api/debug/proxy-check
 */
export async function GET(request: Request) {
  const hostname = request.headers.get("host") || "";
  const url = new URL(request.url);
  
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";
  
  const isLocalhost = hostname.includes("localhost");
  const isAppDomain = hostname === "app.dramacagency.com" || isLocalhost;
  const isClientSite = !isLocalhost && hostname.endsWith(`.${baseDomain}`);
  
  return NextResponse.json({
    hostname,
    baseDomain,
    isLocalhost,
    isAppDomain,
    isClientSite,
    requestUrl: url.toString(),
    envVars: {
      NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN || "NOT SET",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
    },
    wouldRewriteTo: isClientSite ? `/site/${hostname.replace(`.${baseDomain}`, "")}` : "NO REWRITE",
  });
}

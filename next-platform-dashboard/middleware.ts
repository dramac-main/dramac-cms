import { type NextRequest } from "next/server";
import { proxy } from "@/proxy";

export async function middleware(request: NextRequest) {
  // Use the proxy routing which handles:
  // 1. Client site subdomains (*.sites.dramacagency.com) - rewrite to /site/[subdomain]
  // 2. Custom domains - rewrite to /site/[domain]
  // 3. Public routes (/site, /blog, /preview) - no auth required
  // 4. Dashboard routes - auth required via updateSession()
  return await proxy(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, scripts)
     */
    "/((?!_next/static|_next/image|favicon.ico|embed/.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

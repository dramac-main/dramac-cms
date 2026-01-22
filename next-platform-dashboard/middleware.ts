import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth for embed routes - CORS handled in next.config.ts
  if (pathname.startsWith('/embed/')) {
    return null;
  }

  // For all other routes, use the Supabase session middleware
  return await updateSession(request);
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

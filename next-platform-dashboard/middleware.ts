import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle embed routes - skip auth and add CORS headers
  if (pathname.startsWith('/embed/')) {
    const response = NextResponse.next();
    
    // Allow embedding from any origin
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Remove X-Frame-Options to allow embedding
    response.headers.delete('X-Frame-Options');
    
    // Set Content-Security-Policy to allow being framed
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors *; default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src * data: blob:; font-src * data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com;"
    );
    
    return response;
  }

  // Handle OPTIONS preflight requests for embed
  if (request.method === 'OPTIONS' && pathname.startsWith('/embed/')) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
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

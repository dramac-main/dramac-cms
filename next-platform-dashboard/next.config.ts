import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for catching potential issues
  reactStrictMode: true,

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        // Apply security headers to all routes except embed
        source: "/((?!embed).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: "worker-src 'self' blob: https://cdn.jsdelivr.net;",
          },
        ],
      },
      {
        // CORS and frame options for embed routes
        source: "/embed/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *; default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src * data: blob:; font-src * data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com;",
          },
        ],
      },
    ];
  },

  // NOTE: Do NOT add a global redirect from "/" to "/dashboard" here!
  // That would break subdomain routing. The proxy.ts handles routing
  // and auth redirects are handled in the middleware.
};

export default nextConfig;

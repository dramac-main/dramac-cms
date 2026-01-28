import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for catching potential issues
  reactStrictMode: true,

  // Turbopack configuration
  turbopack: {
    root: process.cwd(), // Use current working directory as root
  },

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
        // Apply security headers to all routes except embed and checkout-related
        source: "/((?!embed|pricing|dashboard/billing|settings/billing).*)",
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
        // Paddle checkout requires permissive CSP for overlay checkout
        // These routes load Paddle.js and open checkout modals
        source: "/(pricing|dashboard/billing|settings/billing)(.*)",
        headers: [
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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://*.paddle.com blob:",
              "style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://*.paddle.com",
              "img-src 'self' data: blob: https://*.paddle.com https://cdn.paddle.com https://*.supabase.co",
              "font-src 'self' data: https://cdn.paddle.com https://*.paddle.com",
              "frame-src 'self' https://*.paddle.com https://sandbox-buy.paddle.com https://buy.paddle.com",
              "connect-src 'self' https://*.paddle.com https://sandbox-api.paddle.com https://api.paddle.com https://*.supabase.co wss://*.supabase.co",
              "worker-src 'self' blob:",
            ].join("; "),
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

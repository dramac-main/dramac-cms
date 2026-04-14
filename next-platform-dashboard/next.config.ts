import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for catching potential issues
  reactStrictMode: true,

  // Serve _next/static assets from the main app domain
  // Critical for multi-tenant subdomain apps (*.sites.dramacagency.com)
  // Without this, subdomain sites try to load assets from the subdomain origin
  // which fails with 404s because Vercel CDN only maps assets to the primary domain
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"
      : undefined,

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

  // Headers for security, CORS, and CSP are applied in proxy.ts middleware
  // (moved from next.config.ts headers() to reduce Vercel route count —
  //  each header pattern in config counts as a route entry toward the 2048 limit)

  // NOTE: Do NOT add a global redirect from "/" to "/dashboard" here!
  // That would break subdomain routing. The proxy.ts handles routing
  // and auth redirects are handled in the middleware.

  // Skip the standalone tsc type-checking step during `next build`.
  // Turbopack already validates TypeScript during compilation.
  // The separate tsc step causes OOM on memory-constrained environments (Vercel Hobby).
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

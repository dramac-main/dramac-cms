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

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
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
        ],
      },
    ];
  },

  // NOTE: Do NOT add a global redirect from "/" to "/dashboard" here!
  // That would break subdomain routing. The proxy.ts handles routing
  // and auth redirects are handled in the middleware.
};

export default nextConfig;

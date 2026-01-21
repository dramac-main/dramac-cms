# Phase 44: Production - Performance

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md`

---

## 🎯 Objective

Optimize application performance with caching strategies, bundle analysis, image optimization, and monitoring.

---

## 📋 Prerequisites

- [ ] Phase 43 completed
- [ ] Error handling implemented
- [ ] Application tested

---

## ✅ Tasks

### Task 44.1: Next.js Configuration Optimization

**File: `next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Image optimization
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
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Bundle analyzer (enable with ANALYZE=true)
  ...(process.env.ANALYZE === "true" && {
    experimental: {
      bundlePagesRouterDependencies: true,
    },
  }),

  // Headers for caching
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
```

### Task 44.2: Bundle Analyzer Setup

**Install:**
```bash
npm install -D @next/bundle-analyzer
```

**File: `analyze.mjs`**

```javascript
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer;
```

**Update `package.json` scripts:**

```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "analyze:server": "ANALYZE=true BUNDLE_ANALYZE=server npm run build",
    "analyze:browser": "ANALYZE=true BUNDLE_ANALYZE=browser npm run build"
  }
}
```

### Task 44.3: Data Fetching with Caching

**File: `src/lib/cache.ts`**

```typescript
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Cache tags for invalidation
export const CACHE_TAGS = {
  clients: "clients",
  sites: "sites",
  pages: "pages",
  user: "user",
  modules: "modules",
  billing: "billing",
} as const;

// Cached data fetchers
export const getCachedClients = unstable_cache(
  async (agencyId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
  ["clients"],
  {
    tags: [CACHE_TAGS.clients],
    revalidate: 60, // 1 minute
  }
);

export const getCachedSites = unstable_cache(
  async (clientId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
  ["sites"],
  {
    tags: [CACHE_TAGS.sites],
    revalidate: 60,
  }
);

export const getCachedPages = unstable_cache(
  async (siteId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
  ["pages"],
  {
    tags: [CACHE_TAGS.pages],
    revalidate: 30,
  }
);

// Revalidation helpers
export async function revalidateClients() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(CACHE_TAGS.clients);
}

export async function revalidateSites() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(CACHE_TAGS.sites);
}

export async function revalidatePages() {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(CACHE_TAGS.pages);
}
```

### Task 44.4: React Query Configuration

**File: `src/lib/query-client.ts`**

```typescript
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 60 seconds
        staleTime: 60 * 1000,
        // Cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests 2 times
        retry: 2,
        // Don't refetch on window focus in development
        refetchOnWindowFocus: process.env.NODE_ENV === "production",
      },
      mutations: {
        // Show error for mutations
        onError: (error) => {
          console.error("Mutation error:", error);
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
```

### Task 44.5: Lazy Loading Components

**File: `src/components/lazy.tsx`**

```typescript
"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Loading placeholder
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

// Lazy load heavy components
export const LazyVisualEditor = dynamic(
  () => import("./visual-editor/visual-editor").then((mod) => mod.VisualEditor),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyAIBuilder = dynamic(
  () => import("./ai-builder/ai-builder").then((mod) => mod.AIBuilder),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyBillingDashboard = dynamic(
  () => import("./billing/billing-dashboard").then((mod) => mod.BillingDashboard),
  {
    loading: () => <LoadingSpinner />,
  }
);

export const LazyModuleMarketplace = dynamic(
  () => import("./modules/module-marketplace").then((mod) => mod.ModuleMarketplace),
  {
    loading: () => <LoadingSpinner />,
  }
);
```

### Task 44.6: Image Optimization Component

**File: `src/components/ui/optimized-image.tsx`**

```typescript
"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallback?: string;
}

export function OptimizedImage({
  className,
  fallback = "/images/placeholder.png",
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        {...props}
        alt={alt}
        src={hasError ? fallback : props.src}
        className={cn(
          "duration-300 ease-in-out",
          isLoading ? "scale-105 blur-sm" : "scale-100 blur-0"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
```

### Task 44.7: Performance Monitoring Hook

**File: `src/hooks/use-performance.ts`**

```typescript
"use client";

import { useEffect } from "react";

export function usePerformanceMonitor(pageName: string) {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Core Web Vitals
    const reportWebVitals = () => {
      if ("web-vital" in window) return;

      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        console.log(`LCP (${pageName}):`, lastEntry.startTime);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const fidEntry = entry as PerformanceEventTiming;
          console.log(`FID (${pageName}):`, fidEntry.processingStart - fidEntry.startTime);
        });
      });
      fidObserver.observe({ type: "first-input", buffered: true });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: PerformanceEntry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });
        console.log(`CLS (${pageName}):`, clsValue);
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    };

    const cleanup = reportWebVitals();
    return cleanup;
  }, [pageName]);
}

// Hook for measuring component render time
export function useRenderTime(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`${componentName} render time:`, endTime - startTime, "ms");
    };
  }, [componentName]);
}
```

### Task 44.8: Debounce and Throttle Utilities

**File: `src/lib/performance-utils.ts`**

```typescript
// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Memoize function results
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T;
}

// Request idle callback polyfill
export function requestIdleCallback(callback: () => void): void {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}
```

### Task 44.9: Prefetching Strategy

**File: `src/components/prefetch-link.tsx`**

```typescript
"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useState, useCallback } from "react";

interface PrefetchLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export function PrefetchLink({ 
  children, 
  href, 
  className,
  ...props 
}: PrefetchLinkProps) {
  const router = useRouter();
  const [isPrefetched, setIsPrefetched] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!isPrefetched) {
      router.prefetch(href.toString());
      setIsPrefetched(true);
    }
  }, [href, isPrefetched, router]);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}
```

### Task 44.10: Service Worker (Optional PWA)

**File: `public/sw.js`**

```javascript
const CACHE_NAME = "dramac-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/offline.html",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API requests
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone and cache the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Return offline page for navigation requests
      if (event.request.mode === "navigate") {
        return caches.match("/offline.html");
      }
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});
```

---

## 📐 Acceptance Criteria

- [ ] Next.js config optimized
- [ ] Bundle analyzer works with `npm run analyze`
- [ ] Server-side caching implemented
- [ ] React Query configured properly
- [ ] Heavy components lazy loaded
- [ ] Images optimized
- [ ] Performance monitoring active
- [ ] Utility functions implemented

---

## 📁 Files Created This Phase

```
next.config.ts (updated)
analyze.mjs

src/lib/
├── cache.ts
├── query-client.ts
└── performance-utils.ts

src/components/
├── lazy.tsx
├── prefetch-link.tsx
└── ui/
    └── optimized-image.tsx

src/hooks/
└── use-performance.ts

public/
└── sw.js
```

---

## ➡️ Next Phase

**Phase 45: Production - Launch Checklist** - Final review and deployment checklist.


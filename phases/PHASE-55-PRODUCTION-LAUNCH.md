# Phase 55: Production Polish & Launch Readiness

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Final production polish including comprehensive testing, error handling, performance optimization, security hardening, monitoring, and launch preparation.

---

## 📋 Prerequisites

- [ ] Phases 46-54 completed
- [ ] All core features functional
- [ ] Database migrations applied
- [ ] Payment integration tested

---

## ✅ Tasks

### Task 55.1: Global Error Boundary

**File: `src/components/error-boundary.tsx`**

```tsx
"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error("Error boundary caught:", error, errorInfo);
    
    // Send to error tracking (e.g., Sentry)
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorInfo,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We encountered an unexpected error. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="text-left p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-40">
                  {this.state.error.message}
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/dashboard"}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Task 55.2: App-Level Error Page

**File: `src/app/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error tracking service
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            We're sorry, but something unexpected happened. Don't worry, our
            team has been notified and is working on fixing this issue.
          </p>

          {error.digest && (
            <p className="text-center text-xs text-muted-foreground">
              Error ID: <code>{error.digest}</code>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button className="flex-1" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Still having issues?{" "}
              <a
                href="mailto:support@dramac.com"
                className="text-primary hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 55.3: Not Found Page

**File: `src/app/not-found.tsx`**

```tsx
import Link from "next/link";
import { FileQuestion, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-10 h-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <p className="text-xl text-muted-foreground mt-2">Page Not Found</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Looking for something specific?{" "}
              <Link
                href="/search"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                Search
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 55.4: Loading States

**File: `src/app/loading.tsx`**

```tsx
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

### Task 55.5: API Error Handler Utility

**File: `src/lib/utils/api-errors.ts`**

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const errorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export function handleApiError(error: unknown): {
  message: string;
  statusCode: number;
  code: string;
} {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code || errorCodes.INTERNAL_ERROR,
    };
  }

  if (error instanceof Error) {
    // Check for known error types
    if (error.message.includes("PGRST")) {
      // Supabase/PostgREST error
      return {
        message: "Database error occurred",
        statusCode: 500,
        code: errorCodes.INTERNAL_ERROR,
      };
    }

    return {
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred",
      statusCode: 500,
      code: errorCodes.INTERNAL_ERROR,
    };
  }

  return {
    message: "An unexpected error occurred",
    statusCode: 500,
    code: errorCodes.INTERNAL_ERROR,
  };
}

export function createApiResponse<T>(data: T, status: number = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function createApiErrorResponse(
  message: string,
  statusCode: number = 500,
  code: string = errorCodes.INTERNAL_ERROR
) {
  return Response.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status: statusCode }
  );
}
```

### Task 55.6: Rate Limiting Middleware

**File: `src/lib/rate-limit.ts`**

```typescript
import { LRUCache } from "lru-cache";

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  limit: number; // Max requests per interval
}

const rateLimiters = new Map<string, LRUCache<string, number[]>>();

export function createRateLimiter(name: string, options: RateLimitOptions) {
  const cache = new LRUCache<string, number[]>({
    max: 500, // Max unique IPs/keys to track
    ttl: options.interval,
  });

  rateLimiters.set(name, cache);

  return {
    check: (key: string): { success: boolean; remaining: number; reset: number } => {
      const now = Date.now();
      const windowStart = now - options.interval;

      // Get existing requests for this key
      const requests = cache.get(key) || [];

      // Filter to only requests within the window
      const recentRequests = requests.filter((time) => time > windowStart);

      if (recentRequests.length >= options.limit) {
        const oldestRequest = recentRequests[0];
        const reset = Math.ceil((oldestRequest + options.interval - now) / 1000);

        return {
          success: false,
          remaining: 0,
          reset,
        };
      }

      // Add current request
      recentRequests.push(now);
      cache.set(key, recentRequests);

      return {
        success: true,
        remaining: options.limit - recentRequests.length,
        reset: Math.ceil(options.interval / 1000),
      };
    },
  };
}

// Pre-configured rate limiters
export const apiRateLimiter = createRateLimiter("api", {
  interval: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute
});

export const authRateLimiter = createRateLimiter("auth", {
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
});

export const aiRateLimiter = createRateLimiter("ai", {
  interval: 60 * 60 * 1000, // 1 hour
  limit: 20, // 20 AI generations per hour
});
```

### Task 55.7: Security Headers Middleware

**File: `src/middleware.ts`** (update existing)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const response = await updateSession(request);

  // Add security headers
  const headers = new Headers(response.headers);
  
  // Content Security Policy
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.flutterwave.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.flutterwave.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://checkout.flutterwave.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // Other security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // HSTS (uncomment for production with HTTPS)
  // headers.set(
  //   "Strict-Transport-Security",
  //   "max-age=31536000; includeSubDomains; preload"
  // );

  return NextResponse.next({
    request: {
      headers: request.headers,
    },
    headers,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Task 55.8: Input Sanitization

**File: `src/lib/utils/sanitize.ts`**

```typescript
import DOMPurify from "isomorphic-dompurify";

// Sanitize HTML content
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

// Sanitize plain text (remove all HTML)
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

// Validate and sanitize URL
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

// Sanitize object keys (prevent prototype pollution)
export function sanitizeObject<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  const dangerous = ["__proto__", "constructor", "prototype"];
  const result: Partial<T> = {};

  for (const key of Object.keys(obj)) {
    if (!dangerous.includes(key)) {
      result[key as keyof T] = obj[key];
    }
  }

  return result;
}
```

### Task 55.9: Performance Monitoring

**File: `src/lib/monitoring/performance.ts`**

```typescript
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      logPerformance(name, duration);
    });
  }
  
  const duration = performance.now() - start;
  logPerformance(name, duration);
  return result;
}

function logPerformance(name: string, duration: number) {
  if (duration > 1000) {
    console.warn(`[SLOW] ${name}: ${duration.toFixed(2)}ms`);
  } else if (process.env.NODE_ENV === "development") {
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  }

  // Send to analytics (optional)
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "timing_complete", {
      name,
      value: Math.round(duration),
      event_category: "Performance",
    });
  }
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window === "undefined") return;

  // Track Core Web Vitals
  import("web-vitals").then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  });
}

function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
  });

  // Send to your analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/vitals", body);
  }
}
```

### Task 55.10: Health Check Endpoint

**File: `src/app/api/health/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: boolean;
    storage: boolean;
    auth: boolean;
  };
  latency: {
    database: number;
  };
}

export async function GET() {
  const startTime = Date.now();
  const checks = {
    database: false,
    storage: false,
    auth: false,
  };
  const latency = {
    database: 0,
  };

  try {
    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check database
    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    latency.database = Date.now() - dbStart;
    checks.database = !dbError;

    // Check storage
    const { error: storageError } = await supabase.storage.listBuckets();
    checks.storage = !storageError;

    // Check auth
    const { error: authError } = await supabase.auth.getSession();
    checks.auth = !authError;

    const allHealthy = Object.values(checks).every(Boolean);
    const someHealthy = Object.values(checks).some(Boolean);

    const status: HealthStatus = {
      status: allHealthy ? "healthy" : someHealthy ? "degraded" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      checks,
      latency,
    };

    return NextResponse.json(status, {
      status: allHealthy ? 200 : someHealthy ? 200 : 503,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        checks,
        latency,
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}
```

### Task 55.11: Environment Validation

**File: `src/lib/env.ts`**

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Payment (optional in dev)
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),

  // AI (optional)
  OPENAI_API_KEY: z.string().optional(),

  // Optional
  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();
```

### Task 55.12: Launch Checklist

**File: `docs/LAUNCH_CHECKLIST.md`**

```markdown
# DRAMAC CMS Launch Checklist

## Pre-Launch

### Security
- [ ] All environment variables set in production
- [ ] RLS policies enabled on all tables
- [ ] API rate limiting configured
- [ ] Security headers enabled
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted

### Performance
- [ ] Images optimized
- [ ] Static assets cached
- [ ] Database indexes created
- [ ] Edge caching configured
- [ ] Bundle size analyzed (<500KB initial)

### Testing
- [ ] All critical paths tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed
- [ ] Error tracking configured (Sentry)
- [ ] Smoke tests passing

### Infrastructure
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Health check endpoint working
- [ ] SSL certificates valid
- [ ] DNS configured

### Business
- [ ] Payment processing tested with real cards
- [ ] Email notifications working
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Support system ready

## Launch Day

- [ ] Enable production environment
- [ ] Verify all services healthy
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Standby for support tickets

## Post-Launch

- [ ] Monitor user signups
- [ ] Gather initial feedback
- [ ] Address critical issues
- [ ] Plan first update cycle
```

### Task 55.13: Production Scripts

**File: `scripts/production-check.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

async function runProductionChecks() {
  console.log("🔍 Running production checks...\n");

  const checks: { name: string; passed: boolean; message: string }[] = [];

  // Check environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    checks.push({
      name: `Environment: ${envVar}`,
      passed: !!value,
      message: value ? "Set" : "Missing",
    });
  }

  // Check Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("profiles").select("id").limit(1);
    checks.push({
      name: "Database connection",
      passed: !error,
      message: error ? error.message : "Connected",
    });
  } catch (error) {
    checks.push({
      name: "Database connection",
      passed: false,
      message: String(error),
    });
  }

  // Print results
  console.log("Results:");
  console.log("═".repeat(60));

  let allPassed = true;
  for (const check of checks) {
    const icon = check.passed ? "✅" : "❌";
    console.log(`${icon} ${check.name}: ${check.message}`);
    if (!check.passed) allPassed = false;
  }

  console.log("═".repeat(60));
  console.log(
    allPassed
      ? "✅ All checks passed!"
      : "❌ Some checks failed. Please fix before deploying."
  );

  process.exit(allPassed ? 0 : 1);
}

runProductionChecks();
```

### Task 55.14: Install Production Dependencies

```bash
pnpm add isomorphic-dompurify lru-cache web-vitals
pnpm add -D @types/dompurify
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] Error boundary catches and displays errors
- [ ] 404 page displays correctly
- [ ] Error page displays with retry option
- [ ] Loading states appear during data fetch
- [ ] Health check endpoint returns status
- [ ] Security headers present in responses
- [ ] Rate limiting blocks excessive requests
- [ ] Environment validation runs on startup
- [ ] Production check script passes
- [ ] Performance monitoring logs slow operations

---

## 📝 Final Notes

### Before Going Live:

1. **Run Production Checks**: `pnpm tsx scripts/production-check.ts`
2. **Test Critical Flows**:
   - User registration → login → dashboard
   - Create client → create site → edit in builder
   - Subscription purchase → access features
3. **Monitor First 24 Hours**: Watch error rates, performance, user feedback

### Emergency Procedures:

- **High Error Rate**: Check Sentry, rollback if needed
- **Performance Issues**: Check Supabase dashboard, scale if needed
- **Payment Issues**: Contact Flutterwave support

### Support Contacts:
- Supabase: support@supabase.io
- Flutterwave: support@flutterwave.com
- Vercel: enterprise-support@vercel.com

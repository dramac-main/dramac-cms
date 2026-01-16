# Phase 61: Rate Limiting System - ENHANCE Existing Implementation

> **AI Model**: Claude Opus 4.5 (2x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 2-3 hours

---

## 🎯 Objective

ENHANCE the existing rate limiting system to add Redis/Upstash support, multiple strategies, and middleware integration.

---

## 📋 Prerequisites

- [ ] Phase 60 Content Safety completed
- [ ] Redis or in-memory store available (Vercel KV or Upstash)
- [ ] Understanding of API route structure

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `src/lib/rate-limit.ts` (217 lines) with:
  - `RateLimitConfig` interface
  - `RateLimitResult` interface
  - `RATE_LIMITS` configurations (aiGeneration, aiRegeneration, siteCreation, pageCreation, export)
  - `checkRateLimit()` function using Supabase `rate_limits` table
  - `recordRateLimitedAction()` function

**What's Missing:**
- Redis/Upstash store (production-grade)
- Multiple rate limiting strategies (sliding window, token bucket)
- Middleware integration
- UI components for rate limit errors

---

## ⚠️ IMPORTANT: EXTEND EXISTING CODE

The rate limiting foundation exists. We will:
1. ✅ **KEEP** existing `src/lib/rate-limit.ts` as-is
2. ✅ **ADD** Redis store as alternative to Supabase table
3. ✅ **ADD** strategy implementations
4. ✅ **ADD** middleware integration

**DO NOT:**
- ❌ Recreate existing interfaces
- ❌ Duplicate `RATE_LIMITS` configuration
- ❌ Overwrite `checkRateLimit()` function

---

## 🚨 Why This Is Critical

1. **Cost Protection** - AI generation is expensive, prevent abuse
2. **DDoS Prevention** - Stop malicious request floods
3. **Fair Usage** - Ensure all agencies get fair access
4. **Stability** - Prevent server overload
5. **Compliance** - Meet API provider requirements

---

## 📁 Files to Create/Modify

```
src/lib/rate-limit.ts           # KEEP EXISTING - minor enhancements only
src/lib/rate-limit/             # NEW folder for advanced features
├── stores/
│   ├── redis-store.ts          # Redis/Upstash store (prod)
│   └── types.ts                # Store interface
├── strategies/
│   ├── sliding-window.ts       # Sliding window algorithm
│   └── token-bucket.ts         # Token bucket algorithm
├── middleware.ts               # Next.js middleware integration

src/components/ui/
├── rate-limit-error.tsx        # Rate limit error display
```

---

## ✅ Tasks

### Task 61.0: Verify Existing Implementation

**Check `src/lib/rate-limit.ts` is working before adding enhancements.**

The existing file has:
```typescript
// Already exists - DO NOT RECREATE
export const RATE_LIMITS = {
  aiGeneration: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  aiRegeneration: { maxRequests: 50, windowMs: 60 * 60 * 1000 },
  siteCreation: { maxRequests: 20, windowMs: 24 * 60 * 60 * 1000 },
  pageCreation: { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 },
  export: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
};

export async function checkRateLimit(userId: string, type: RateLimitType): Promise<RateLimitResult>
export async function recordRateLimitedAction(userId: string, type: RateLimitType, metadata?)
```

---

### Task 61.1: Redis Store (Optional Enhancement)

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds until retry is allowed
}

export interface RateLimitInfo {
  identifier: string;
  key: string;
  count: number;
  firstRequest: number;
  lastRequest: number;
}

export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
  "Retry-After"?: string;
}

export type RateLimitStrategy = "sliding-window" | "token-bucket" | "fixed-window";

export interface RateLimiterOptions {
  store: RateLimitStore;
  strategy?: RateLimitStrategy;
  keyGenerator?: (req: Request) => string;
  onRateLimited?: (key: string, info: RateLimitInfo) => void;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null>;
  set(key: string, info: RateLimitInfo, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
  reset(key: string): Promise<void>;
}
```

---

### Task 61.2: Rate Limit Configuration

**File: `src/lib/rate-limit/config.ts`**

```typescript
import type { RateLimitConfig } from "./types";

// Rate limit tiers by plan
export const PLAN_LIMITS = {
  starter: {
    apiRequestsPerMinute: 60,
    aiGenerationsPerHour: 10,
    aiGenerationsPerDay: 50,
    uploadsPerHour: 20,
  },
  professional: {
    apiRequestsPerMinute: 120,
    aiGenerationsPerHour: 30,
    aiGenerationsPerDay: 200,
    uploadsPerHour: 100,
  },
  enterprise: {
    apiRequestsPerMinute: 300,
    aiGenerationsPerHour: 100,
    aiGenerationsPerDay: 1000,
    uploadsPerHour: 500,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// Endpoint-specific rate limits
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // General API
  "api:general": {
    identifier: "api:general",
    limit: 100,
    window: 60, // 100 requests per minute
  },

  // Authentication
  "api:auth:login": {
    identifier: "api:auth:login",
    limit: 5,
    window: 60, // 5 login attempts per minute
  },
  "api:auth:signup": {
    identifier: "api:auth:signup",
    limit: 3,
    window: 60, // 3 signups per minute per IP
  },
  "api:auth:reset-password": {
    identifier: "api:auth:reset-password",
    limit: 3,
    window: 300, // 3 reset requests per 5 minutes
  },

  // AI Generation (expensive operations)
  "api:ai:generate": {
    identifier: "api:ai:generate",
    limit: 10,
    window: 3600, // 10 generations per hour
    cost: 10, // High cost
  },
  "api:ai:regenerate-section": {
    identifier: "api:ai:regenerate-section",
    limit: 30,
    window: 3600, // 30 section regenerations per hour
    cost: 3,
  },
  "api:ai:chat": {
    identifier: "api:ai:chat",
    limit: 50,
    window: 3600, // 50 chat messages per hour
    cost: 1,
  },

  // Content operations
  "api:sites:create": {
    identifier: "api:sites:create",
    limit: 10,
    window: 3600, // 10 sites per hour
  },
  "api:sites:publish": {
    identifier: "api:sites:publish",
    limit: 20,
    window: 3600, // 20 publishes per hour
  },
  "api:pages:save": {
    identifier: "api:pages:save",
    limit: 60,
    window: 60, // 60 saves per minute
  },

  // File uploads
  "api:upload:image": {
    identifier: "api:upload:image",
    limit: 20,
    window: 3600, // 20 uploads per hour
  },
  "api:upload:file": {
    identifier: "api:upload:file",
    limit: 10,
    window: 3600, // 10 file uploads per hour
  },

  // Billing operations
  "api:billing:checkout": {
    identifier: "api:billing:checkout",
    limit: 5,
    window: 3600, // 5 checkout attempts per hour
  },

  // Admin operations
  "api:admin": {
    identifier: "api:admin",
    limit: 200,
    window: 60, // Higher limit for admins
  },

  // Webhooks (external services)
  "api:webhooks": {
    identifier: "api:webhooks",
    limit: 1000,
    window: 60, // High limit for webhooks
  },
};

// Get rate limit config for an endpoint
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  // Try exact match
  if (RATE_LIMITS[endpoint]) {
    return RATE_LIMITS[endpoint];
  }

  // Try prefix match
  for (const [key, config] of Object.entries(RATE_LIMITS)) {
    if (endpoint.startsWith(key.replace(":*", ""))) {
      return config;
    }
  }

  // Default limit
  return RATE_LIMITS["api:general"];
}

// Get limits for a specific plan
export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}
```

---

### Task 61.3: Memory Store (Development)

**File: `src/lib/rate-limit/stores/memory-store.ts`**

```typescript
import type { RateLimitStore, RateLimitInfo } from "../types";

interface MemoryEntry {
  info: RateLimitInfo;
  expiresAt: number;
}

export class MemoryStore implements RateLimitStore {
  private store: Map<string, MemoryEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const entry = this.store.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.info;
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    this.store.set(key, {
      info,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async increment(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || now > entry.expiresAt) {
      // New entry
      const info: RateLimitInfo = {
        identifier: key,
        key,
        count: 1,
        firstRequest: now,
        lastRequest: now,
      };
      this.store.set(key, {
        info,
        expiresAt: now + ttl * 1000,
      });
      return 1;
    }

    // Increment existing
    entry.info.count += 1;
    entry.info.lastRequest = now;
    return entry.info.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instance
let memoryStore: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (!memoryStore) {
    memoryStore = new MemoryStore();
  }
  return memoryStore;
}
```

---

### Task 61.4: Redis Store (Production)

**File: `src/lib/rate-limit/stores/redis-store.ts`**

```typescript
import type { RateLimitStore, RateLimitInfo } from "../types";

// Using Upstash Redis REST API (works with Vercel Edge)
export class RedisStore implements RateLimitStore {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.UPSTASH_REDIS_REST_URL!;
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN!;

    if (!this.baseUrl || !this.token) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set");
    }
  }

  private async command<T>(...args: (string | number)[]): Promise<T> {
    const response = await fetch(`${this.baseUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`Redis error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result as T;
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const data = await this.command<string | null>("GET", `ratelimit:${key}`);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data) as RateLimitInfo;
    } catch {
      return null;
    }
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    await this.command(
      "SET",
      `ratelimit:${key}`,
      JSON.stringify(info),
      "EX",
      ttl
    );
  }

  async increment(key: string, ttl: number): Promise<number> {
    const fullKey = `ratelimit:${key}`;
    
    // Use Lua script for atomic increment with TTL
    const script = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return current
    `;

    // For REST API, use multi-command approach
    const exists = await this.command<number>("EXISTS", fullKey);
    
    if (exists === 0) {
      await this.command("SET", fullKey, "1", "EX", ttl);
      return 1;
    }

    const count = await this.command<number>("INCR", fullKey);
    return count;
  }

  async reset(key: string): Promise<void> {
    await this.command("DEL", `ratelimit:${key}`);
  }
}

// Singleton instance
let redisStore: RedisStore | null = null;

export function getRedisStore(): RedisStore {
  if (!redisStore) {
    redisStore = new RedisStore();
  }
  return redisStore;
}
```

---

### Task 61.5: Sliding Window Rate Limiter

**File: `src/lib/rate-limit/strategies/sliding-window.ts`**

```typescript
import type { RateLimitConfig, RateLimitResult, RateLimitStore } from "../types";

export async function slidingWindowRateLimit(
  store: RateLimitStore,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = config.window * 1000;
  const windowStart = now - windowMs;

  // Get current window data
  const info = await store.get(key);
  
  if (!info) {
    // First request in window
    await store.set(
      key,
      {
        identifier: config.identifier,
        key,
        count: 1,
        firstRequest: now,
        lastRequest: now,
      },
      config.window
    );

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  // Calculate effective count using sliding window
  const elapsed = now - info.firstRequest;
  const windowProgress = Math.min(elapsed / windowMs, 1);
  
  // Weighted count: older requests count less
  const effectiveCount = Math.ceil(info.count * (1 - windowProgress));
  
  if (effectiveCount >= config.limit) {
    // Rate limited
    const resetTime = info.firstRequest + windowMs;
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(resetTime / 1000),
      retryAfter: Math.ceil((resetTime - now) / 1000),
    };
  }

  // Allow request
  const newCount = await store.increment(key, config.window);
  
  return {
    success: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - newCount),
    reset: Math.ceil((info.firstRequest + windowMs) / 1000),
  };
}
```

---

### Task 61.6: Token Bucket Rate Limiter

**File: `src/lib/rate-limit/strategies/token-bucket.ts`**

```typescript
import type { RateLimitConfig, RateLimitResult, RateLimitStore } from "../types";

interface TokenBucketInfo {
  tokens: number;
  lastRefill: number;
}

export async function tokenBucketRateLimit(
  store: RateLimitStore,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const cost = config.cost || 1;
  const maxTokens = config.burst || config.limit;
  const refillRate = config.limit / config.window; // Tokens per second

  // Get current bucket state
  const bucketKey = `bucket:${key}`;
  const info = await store.get(bucketKey);

  let bucket: TokenBucketInfo;

  if (!info) {
    // Initialize bucket with max tokens
    bucket = {
      tokens: maxTokens,
      lastRefill: now,
    };
  } else {
    // Calculate refilled tokens
    const data = info as unknown as TokenBucketInfo;
    const elapsed = (now - data.lastRefill) / 1000;
    const refilled = Math.min(maxTokens, data.tokens + elapsed * refillRate);
    
    bucket = {
      tokens: refilled,
      lastRefill: now,
    };
  }

  // Check if we have enough tokens
  if (bucket.tokens < cost) {
    // Calculate wait time
    const tokensNeeded = cost - bucket.tokens;
    const waitTime = Math.ceil(tokensNeeded / refillRate);

    return {
      success: false,
      limit: maxTokens,
      remaining: Math.floor(bucket.tokens),
      reset: Math.ceil((now + waitTime * 1000) / 1000),
      retryAfter: waitTime,
    };
  }

  // Consume tokens
  bucket.tokens -= cost;

  // Save bucket state
  await store.set(bucketKey, bucket as any, config.window);

  return {
    success: true,
    limit: maxTokens,
    remaining: Math.floor(bucket.tokens),
    reset: Math.ceil((now + config.window * 1000) / 1000),
  };
}
```

---

### Task 61.7: Main Rate Limiter

**File: `src/lib/rate-limit/rate-limiter.ts`**

```typescript
import type {
  RateLimitConfig,
  RateLimitResult,
  RateLimitStore,
  RateLimiterOptions,
  RateLimitHeaders,
  RateLimitInfo,
} from "./types";
import { slidingWindowRateLimit } from "./strategies/sliding-window";
import { tokenBucketRateLimit } from "./strategies/token-bucket";
import { getMemoryStore } from "./stores/memory-store";
import { getRateLimitConfig, getPlanLimits, type PlanType } from "./config";

export class RateLimiter {
  private store: RateLimitStore;
  private strategy: "sliding-window" | "token-bucket" | "fixed-window";
  private keyGenerator: (req: Request) => string;
  private onRateLimited?: (key: string, info: RateLimitInfo) => void;

  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.store = options.store || getMemoryStore();
    this.strategy = options.strategy || "sliding-window";
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    this.onRateLimited = options.onRateLimited;
  }

  private defaultKeyGenerator(req: Request): string {
    // Extract IP from headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    
    // Extract path for endpoint-specific limits
    const url = new URL(req.url);
    const path = url.pathname;

    return `${ip}:${path}`;
  }

  async check(
    req: Request,
    config?: RateLimitConfig,
    userId?: string
  ): Promise<RateLimitResult> {
    // Generate key
    const baseKey = this.keyGenerator(req);
    const key = userId ? `${userId}:${baseKey}` : baseKey;

    // Get config for this endpoint
    const url = new URL(req.url);
    const endpoint = this.pathToEndpoint(url.pathname);
    const limitConfig = config || getRateLimitConfig(endpoint);

    // Apply rate limiting based on strategy
    let result: RateLimitResult;

    switch (this.strategy) {
      case "token-bucket":
        result = await tokenBucketRateLimit(this.store, key, limitConfig);
        break;
      case "sliding-window":
      default:
        result = await slidingWindowRateLimit(this.store, key, limitConfig);
    }

    // Callback on rate limit
    if (!result.success && this.onRateLimited) {
      const info = await this.store.get(key);
      if (info) {
        this.onRateLimited(key, info);
      }
    }

    return result;
  }

  async checkWithPlan(
    req: Request,
    plan: PlanType,
    userId: string,
    limitType: keyof ReturnType<typeof getPlanLimits>
  ): Promise<RateLimitResult> {
    const limits = getPlanLimits(plan);
    const limit = limits[limitType];

    // Determine window based on limit type
    let window: number;
    if (limitType.includes("PerMinute")) {
      window = 60;
    } else if (limitType.includes("PerHour")) {
      window = 3600;
    } else if (limitType.includes("PerDay")) {
      window = 86400;
    } else {
      window = 3600;
    }

    const config: RateLimitConfig = {
      identifier: `plan:${plan}:${limitType}`,
      limit,
      window,
    };

    return this.check(req, config, userId);
  }

  getHeaders(result: RateLimitResult): RateLimitHeaders {
    const headers: RateLimitHeaders = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.reset.toString(),
    };

    if (result.retryAfter) {
      headers["Retry-After"] = result.retryAfter.toString();
    }

    return headers;
  }

  private pathToEndpoint(path: string): string {
    // Convert path to endpoint identifier
    // /api/ai/generate -> api:ai:generate
    return path
      .replace(/^\//, "")
      .replace(/\//g, ":")
      .replace(/\[.*?\]/g, "*");
  }
}

// Singleton instance
let rateLimiter: RateLimiter | null = null;

export function getRateLimiter(options?: Partial<RateLimiterOptions>): RateLimiter {
  if (!rateLimiter || options) {
    rateLimiter = new RateLimiter(options);
  }
  return rateLimiter;
}
```

---

### Task 61.8: Rate Limit Export

**File: `src/lib/rate-limit/index.ts`**

```typescript
export { RateLimiter, getRateLimiter } from "./rate-limiter";
export { getRateLimitConfig, getPlanLimits, RATE_LIMITS, PLAN_LIMITS } from "./config";
export { getMemoryStore } from "./stores/memory-store";
export { getRedisStore } from "./stores/redis-store";
export type {
  RateLimitConfig,
  RateLimitResult,
  RateLimitStore,
  RateLimiterOptions,
  RateLimitHeaders,
} from "./types";

// Convenience function for API routes
import { getRateLimiter } from "./rate-limiter";
import type { RateLimitResult } from "./types";

export async function rateLimit(
  req: Request,
  userId?: string
): Promise<RateLimitResult> {
  const limiter = getRateLimiter();
  return limiter.check(req, undefined, userId);
}

export function isRateLimited(result: RateLimitResult): boolean {
  return !result.success;
}
```

---

### Task 61.9: API Route Middleware

**File: `src/app/api/_middleware/rate-limit.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRateLimiter } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type RateLimitedHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

// Wrapper for API routes with rate limiting
export function withRateLimit(
  handler: RateLimitedHandler,
  options?: {
    identifier?: string;
    limit?: number;
    window?: number;
  }
): RateLimitedHandler {
  return async (req: NextRequest, context) => {
    const limiter = getRateLimiter();

    // Get user ID if authenticated
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Not authenticated, use IP-based limiting
    }

    // Build config if options provided
    const config = options
      ? {
          identifier: options.identifier || "api:custom",
          limit: options.limit || 100,
          window: options.window || 60,
        }
      : undefined;

    // Check rate limit
    const result = await limiter.check(req, config, userId);

    // Add rate limit headers to response
    const headers = limiter.getHeaders(result);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: headers as HeadersInit,
        }
      );
    }

    // Call the handler
    const response = await handler(req, context);

    // Add rate limit headers to successful response
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }

    return response;
  };
}

// Higher-order function for AI routes (stricter limits)
export function withAIRateLimit(handler: RateLimitedHandler): RateLimitedHandler {
  return withRateLimit(handler, {
    identifier: "api:ai:generate",
    limit: 10,
    window: 3600, // 10 per hour
  });
}

// For auth routes
export function withAuthRateLimit(handler: RateLimitedHandler): RateLimitedHandler {
  return withRateLimit(handler, {
    identifier: "api:auth",
    limit: 10,
    window: 60, // 10 per minute
  });
}
```

---

### Task 61.10: Next.js Middleware Integration

**File: `src/lib/rate-limit/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRateLimiter } from "./rate-limiter";
import { getRateLimitConfig } from "./config";

// Paths that require rate limiting
const RATE_LIMITED_PATHS = [
  "/api/ai/",
  "/api/auth/",
  "/api/sites/",
  "/api/clients/",
  "/api/billing/",
  "/api/upload/",
];

// Paths to skip rate limiting
const SKIP_PATHS = [
  "/api/health",
  "/api/webhooks/", // Webhooks have their own limits
  "/_next/",
  "/favicon.ico",
];

export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname;

  // Skip non-rate-limited paths
  if (SKIP_PATHS.some((skip) => path.startsWith(skip))) {
    return null;
  }

  // Only rate limit API paths
  if (!RATE_LIMITED_PATHS.some((limited) => path.startsWith(limited))) {
    return null;
  }

  const limiter = getRateLimiter();

  // Extract user ID from cookie/header if available
  const authHeader = request.headers.get("authorization");
  const userId = authHeader?.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : undefined;

  // Check rate limit
  const result = await limiter.check(request, undefined, userId);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Please wait ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": result.retryAfter?.toString() || "60",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
        },
      }
    );
  }

  return null; // Continue to route handler
}
```

---

### Task 61.11: Rate Limit Error Component

**File: `src/components/ui/rate-limit-error.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";

interface RateLimitErrorProps {
  retryAfter: number;
  onRetry?: () => void;
  message?: string;
}

export function RateLimitError({ 
  retryAfter, 
  onRetry,
  message = "You've made too many requests. Please wait before trying again."
}: RateLimitErrorProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Alert variant="destructive" className="my-4">
      <Clock className="h-4 w-4" />
      <AlertTitle>Rate Limit Exceeded</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        <div className="flex items-center gap-4 mt-3">
          {countdown > 0 ? (
            <span className="text-sm font-medium">
              Try again in: {formatTime(countdown)}
            </span>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setCountdown(retryAfter);
                onRetry?.();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Now
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

---

### Task 61.12: Update Existing Rate Limit File

**File: `src/lib/rate-limit.ts`** (UPDATE)

```typescript
// Re-export from new module structure
export * from "./rate-limit/index";

// Backward compatibility
import { rateLimit as newRateLimit, isRateLimited } from "./rate-limit/index";

export const rateLimit = newRateLimit;
export { isRateLimited };
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Memory store operations work correctly
- [ ] Redis store operations work correctly
- [ ] Sliding window algorithm calculates correctly
- [ ] Token bucket refills correctly
- [ ] Key generation is consistent

### Integration Tests
- [ ] API routes return 429 when limited
- [ ] Rate limit headers are present
- [ ] Retry-After header is accurate
- [ ] User-specific limits work
- [ ] Plan-based limits work

### Load Tests
- [ ] System handles high request volume
- [ ] No race conditions in increment
- [ ] Store cleanup works properly
- [ ] Memory usage is stable

---

## ✅ Completion Checklist

- [ ] All rate limit modules created
- [ ] Memory store working (dev)
- [ ] Redis store working (prod)
- [ ] Sliding window algorithm implemented
- [ ] Token bucket algorithm implemented
- [ ] API middleware integrated
- [ ] Rate limit headers added
- [ ] Error component created
- [ ] Tests passing
- [ ] Documentation complete

---

## 📝 Configuration Notes

### Environment Variables

```env
# For production (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: Custom limits
RATE_LIMIT_AI_PER_HOUR=10
RATE_LIMIT_API_PER_MINUTE=100
```

### Vercel KV Alternative

```typescript
// If using Vercel KV instead of Upstash
import { kv } from "@vercel/kv";

// Replace Redis store with Vercel KV client
```

---

**Next Phase**: Phase 62 - Error Handling System

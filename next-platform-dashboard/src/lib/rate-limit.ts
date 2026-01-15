import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitConfig {
  maxRequests: number;  // Maximum requests allowed
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;  // Seconds until reset
}

// Rate limit configurations
export const RATE_LIMITS = {
  aiGeneration: { maxRequests: 10, windowMs: 60 * 60 * 1000 },    // 10/hour
  aiRegeneration: { maxRequests: 50, windowMs: 60 * 60 * 1000 },  // 50/hour
  siteCreation: { maxRequests: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20/day
  pageCreation: { maxRequests: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100/day
  export: { maxRequests: 10, windowMs: 60 * 60 * 1000 },          // 10/hour
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Check rate limit for a user and action type
 */
export async function checkRateLimit(
  userId: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const windowStart = new Date(Date.now() - config.windowMs);

  try {
    const supabase = createAdminClient();
    
    // Query using admin client with type assertion for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('rate_limits')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('action_type', type)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.warn('Rate limit check error (table may not exist):', error.message);
      // Fail open - allow request if check fails
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(Date.now() + config.windowMs),
      };
    }

    const requestCount = data?.length || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const resetAt = new Date(Date.now() + config.windowMs);

    if (requestCount >= config.maxRequests) {
      // Calculate retry time from oldest request
      const sortedData = [...(data || [])].sort((a: { created_at: string }, b: { created_at: string }) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const oldestRequest = sortedData[0];
      const retryAfter = oldestRequest
        ? Math.ceil((new Date(oldestRequest.created_at).getTime() + config.windowMs - Date.now()) / 1000)
        : Math.ceil(config.windowMs / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    return { allowed: true, remaining, resetAt };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Record a rate-limited action
 */
export async function recordRateLimitedAction(
  userId: string,
  type: RateLimitType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    
    // Use type assertion for untyped table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('rate_limits')
      .insert({
        user_id: userId,
        action_type: type,
        metadata: metadata || {},
      });

    if (error) {
      console.warn('Failed to record rate-limited action:', error.message);
    }
  } catch (error) {
    console.error('Failed to record rate-limited action:', error);
  }
}

/**
 * Clean up old rate limit records (run periodically)
 */
export async function cleanupRateLimits(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    const supabase = createAdminClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('rate_limits')
      .delete()
      .lt('created_at', cutoff.toISOString())
      .select('id');

    if (error) {
      console.error('Rate limit cleanup error:', error.message);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
    return 0;
  }
}

/**
 * Get rate limit status for display
 */
export async function getRateLimitStatus(
  userId: string,
  type: RateLimitType
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetsIn: string;
}> {
  const result = await checkRateLimit(userId, type);
  const config = RATE_LIMITS[type];

  const resetsInMs = result.resetAt.getTime() - Date.now();
  const resetsInMinutes = Math.ceil(resetsInMs / (60 * 1000));
  const resetsIn = resetsInMinutes > 60
    ? `${Math.ceil(resetsInMinutes / 60)} hours`
    : `${resetsInMinutes} minutes`;

  return {
    used: config.maxRequests - result.remaining,
    limit: config.maxRequests,
    remaining: result.remaining,
    resetsIn,
  };
}

/**
 * Format rate limit for API response headers
 */
export function formatRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}

/**
 * Check multiple rate limits at once
 */
export async function checkMultipleRateLimits(
  userId: string,
  types: RateLimitType[]
): Promise<Map<RateLimitType, RateLimitResult>> {
  const results = new Map<RateLimitType, RateLimitResult>();
  
  for (const type of types) {
    const result = await checkRateLimit(userId, type);
    results.set(type, result);
  }
  
  return results;
}

/**
 * Get human-readable description of rate limit
 */
export function getRateLimitDescription(type: RateLimitType): string {
  const config = RATE_LIMITS[type];
  const hours = config.windowMs / (60 * 60 * 1000);
  const timeUnit = hours >= 24 ? `${hours / 24} day(s)` : `${hours} hour(s)`;
  
  return `${config.maxRequests} requests per ${timeUnit}`;
}

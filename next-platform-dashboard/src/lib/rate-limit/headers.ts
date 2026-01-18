import type { RateLimitResult } from "@/lib/rate-limit";

/**
 * Generate standard rate limit headers for API responses
 * These follow the standard rate limiting headers convention
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Create a standard 429 Too Many Requests response
 */
export function rateLimitedResponse(
  result: RateLimitResult,
  customMessage?: string
): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: customMessage || "Too many requests. Please try again later.",
      retryAfter: result.retryAfter,
      resetAt: result.resetAt.toISOString(),
      remaining: result.remaining,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...getRateLimitHeaders(result),
      },
    }
  );
}

/**
 * Append rate limit headers to an existing Response
 */
export function withRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  const rateLimitHeaders = getRateLimitHeaders(result);

  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Parse rate limit headers from a response
 */
export function parseRateLimitHeaders(headers: Headers): {
  remaining: number | null;
  resetAt: Date | null;
  retryAfter: number | null;
} {
  const remaining = headers.get("X-RateLimit-Remaining");
  const resetAt = headers.get("X-RateLimit-Reset");
  const retryAfter = headers.get("Retry-After");

  return {
    remaining: remaining ? parseInt(remaining, 10) : null,
    resetAt: resetAt ? new Date(resetAt) : null,
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : null,
  };
}

/**
 * Check if a response indicates rate limiting
 */
export function isRateLimited(response: Response): boolean {
  return response.status === 429;
}

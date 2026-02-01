// =============================================================================
// CLIENT-SIDE RATE LIMITING UTILITIES
// =============================================================================
// Browser-based rate limiting for UI interactions and API calls
// Part of PHASE-EH-06: Offline & Rate Limiting

"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { showToast } from "@/lib/toast";

// =============================================================================
// TYPES
// =============================================================================

export interface ClientRateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique key for this rate limiter */
  key?: string;
  /** Callback when rate limit is reached */
  onLimit?: (retryAfter: number) => void;
  /** Show toast notification when limited */
  showToast?: boolean;
  /** Custom toast message */
  toastMessage?: string;
}

export interface ClientRateLimitState {
  /** Number of remaining requests */
  remaining: number;
  /** Total limit */
  limit: number;
  /** Time until reset (ms) */
  resetIn: number;
  /** Whether currently rate limited */
  isLimited: boolean;
  /** Percentage of limit used */
  usagePercent: number;
}

export interface ClientRateLimitRecord {
  count: number;
  resetAt: number;
  firstRequestAt: number;
}

// =============================================================================
// CLIENT RATE LIMITER CLASS
// =============================================================================

/**
 * Client-side rate limiter with sliding window for browser use.
 * 
 * @example
 * ```typescript
 * const limiter = new ClientRateLimiter();
 * 
 * if (limiter.check("api:users", 10, 60000)) {
 *   // Allowed - make request
 *   await fetchUsers();
 * } else {
 *   // Rate limited
 *   console.log("Please wait before trying again");
 * }
 * ```
 */
export class ClientRateLimiter {
  private records: Map<string, ClientRateLimitRecord> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired records periodically
    if (typeof window !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Check if action is allowed and increment counter.
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.records.get(key);

    // No existing record or window expired
    if (!record || now > record.resetAt) {
      this.records.set(key, {
        count: 1,
        resetAt: now + windowMs,
        firstRequestAt: now,
      });
      return true;
    }

    // Within window, check limit
    if (record.count >= limit) {
      return false;
    }

    // Increment and allow
    record.count++;
    return true;
  }

  /**
   * Get current state for a key.
   */
  getState(key: string, limit: number, windowMs: number): ClientRateLimitState {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetAt) {
      return {
        remaining: limit,
        limit,
        resetIn: 0,
        isLimited: false,
        usagePercent: 0,
      };
    }

    const remaining = Math.max(0, limit - record.count);
    const resetIn = Math.max(0, record.resetAt - now);

    return {
      remaining,
      limit,
      resetIn,
      isLimited: remaining === 0,
      usagePercent: Math.round((record.count / limit) * 100),
    };
  }

  /**
   * Reset a specific key.
   */
  reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Get time until reset for a key.
   */
  getResetTime(key: string): number {
    const record = this.records.get(key);
    if (!record) return 0;
    return Math.max(0, record.resetAt - Date.now());
  }

  /**
   * Cleanup expired records.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetAt) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Dispose of the rate limiter.
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.records.clear();
  }
}

// Global rate limiter instance
export const clientRateLimiter = new ClientRateLimiter();

// =============================================================================
// USE CLIENT RATE LIMITED ACTION HOOK
// =============================================================================

export interface UseClientRateLimitedActionOptions<T, R> extends ClientRateLimitConfig {
  /** The async action to rate limit */
  action: (args: T) => Promise<R>;
  /** Transform arguments for rate limit key */
  keyFromArgs?: (args: T) => string;
}

export interface UseClientRateLimitedActionResult<T, R> {
  /** Execute the rate-limited action */
  execute: (args: T) => Promise<R | undefined>;
  /** Current rate limit state */
  state: ClientRateLimitState;
  /** Whether currently executing */
  isExecuting: boolean;
  /** Reset the rate limit */
  reset: () => void;
  /** Time until rate limit resets (formatted) */
  resetTimeFormatted: string;
}

/**
 * Hook for rate-limiting async actions in the browser.
 * 
 * @example
 * ```typescript
 * const { execute, state, isExecuting } = useClientRateLimitedAction({
 *   action: async (id: string) => await api.deleteItem(id),
 *   limit: 5,
 *   windowMs: 60000,
 *   showToast: true,
 * });
 * 
 * // Usage
 * await execute("item-123");
 * 
 * // Check state
 * if (state.isLimited) {
 *   console.log(`Wait ${state.resetIn}ms`);
 * }
 * ```
 */
export function useClientRateLimitedAction<T = void, R = void>(
  options: UseClientRateLimitedActionOptions<T, R>
): UseClientRateLimitedActionResult<T, R> {
  const {
    action,
    limit,
    windowMs,
    key = "default",
    keyFromArgs,
    onLimit,
    showToast: showToastNotification = true,
    toastMessage = "Too many requests. Please slow down.",
  } = options;

  const [isExecuting, setIsExecuting] = useState(false);
  const [state, setState] = useState<ClientRateLimitState>(() =>
    clientRateLimiter.getState(key, limit, windowMs)
  );
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update state periodically when limited
  useEffect(() => {
    if (!state.isLimited) return;

    const interval = setInterval(() => {
      setState(clientRateLimiter.getState(key, limit, windowMs));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isLimited, key, limit, windowMs]);

  // Cleanup retry timeout
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const formatResetTime = useCallback((ms: number): string => {
    if (ms <= 0) return "";
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  }, []);

  const execute = useCallback(
    async (args: T): Promise<R | undefined> => {
      const effectiveKey = keyFromArgs ? `${key}:${keyFromArgs(args)}` : key;

      if (!clientRateLimiter.check(effectiveKey, limit, windowMs)) {
        const resetTime = clientRateLimiter.getResetTime(effectiveKey);
        
        if (showToastNotification) {
          showToast.warning(`${toastMessage} - Try again in ${formatResetTime(resetTime)}`);
        }

        onLimit?.(resetTime);
        setState(clientRateLimiter.getState(effectiveKey, limit, windowMs));
        return undefined;
      }

      setIsExecuting(true);
      try {
        const result = await action(args);
        setState(clientRateLimiter.getState(effectiveKey, limit, windowMs));
        return result;
      } finally {
        setIsExecuting(false);
      }
    },
    [action, key, keyFromArgs, limit, windowMs, onLimit, showToastNotification, toastMessage, formatResetTime]
  );

  const reset = useCallback(() => {
    clientRateLimiter.reset(key);
    setState(clientRateLimiter.getState(key, limit, windowMs));
  }, [key, limit, windowMs]);

  return {
    execute,
    state,
    isExecuting,
    reset,
    resetTimeFormatted: formatResetTime(state.resetIn),
  };
}

// =============================================================================
// USE CLIENT RATE LIMIT STATUS HOOK
// =============================================================================

export interface UseClientRateLimitStatusOptions {
  /** Rate limit key to monitor */
  key: string;
  /** Maximum requests allowed */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Warning threshold (0-1) */
  warningThreshold?: number;
}

export interface UseClientRateLimitStatusResult extends ClientRateLimitState {
  /** Whether approaching limit (above warning threshold) */
  isWarning: boolean;
  /** Formatted reset time */
  resetTimeFormatted: string;
  /** Progress bar value (0-100) */
  progressValue: number;
}

/**
 * Hook for monitoring rate limit status.
 * 
 * @example
 * ```typescript
 * const status = useClientRateLimitStatus({
 *   key: "api:search",
 *   limit: 100,
 *   windowMs: 60000,
 *   warningThreshold: 0.8,
 * });
 * 
 * // Show warning UI
 * {status.isWarning && (
 *   <Alert variant="warning">
 *     {status.remaining} requests remaining
 *   </Alert>
 * )}
 * ```
 */
export function useClientRateLimitStatus(
  options: UseClientRateLimitStatusOptions
): UseClientRateLimitStatusResult {
  const { key, limit, windowMs, warningThreshold = 0.8 } = options;

  const [state, setState] = useState<ClientRateLimitState>(() =>
    clientRateLimiter.getState(key, limit, windowMs)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setState(clientRateLimiter.getState(key, limit, windowMs));
    }, 1000);

    return () => clearInterval(interval);
  }, [key, limit, windowMs]);

  const formatResetTime = (ms: number): string => {
    if (ms <= 0) return "";
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return {
    ...state,
    isWarning: state.usagePercent >= warningThreshold * 100,
    resetTimeFormatted: formatResetTime(state.resetIn),
    progressValue: 100 - state.usagePercent,
  };
}

// =============================================================================
// CLIENT RATE LIMIT INDICATOR COMPONENT
// =============================================================================

export interface ClientRateLimitIndicatorProps {
  /** Rate limit status */
  status: UseClientRateLimitStatusResult;
  /** Show as compact indicator */
  compact?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Visual indicator for rate limit status.
 */
export function ClientRateLimitIndicator({ className, status, compact = false, showProgress = true }: ClientRateLimitIndicatorProps) {
  const { isLimited, isWarning, remaining, limit, resetTimeFormatted } = status;

  if (!isWarning && !isLimited) return null;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs",
          isLimited ? "text-destructive" : "text-amber-500",
          className
        )}
      >
        {isLimited ? (
          <Clock className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        <span>
          {isLimited
            ? `Wait ${resetTimeFormatted}`
            : `${remaining}/${limit} remaining`}
        </span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "rounded-lg border p-3",
          isLimited
            ? "border-destructive/20 bg-destructive/10"
            : "border-amber-500/20 bg-amber-500/10",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLimited ? (
              <Clock className="h-4 w-4 text-destructive" />
            ) : (
              <Zap className="h-4 w-4 text-amber-500" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isLimited ? "text-destructive" : "text-amber-600"
              )}
            >
              {isLimited ? "Rate Limited" : "Approaching Limit"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isLimited
              ? `Resets in ${resetTimeFormatted}`
              : `${remaining} of ${limit} remaining`}
          </span>
        </div>

        {showProgress && (
          <Progress
            value={status.progressValue}
            className={cn(
              "mt-2 h-1.5",
              isLimited ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"
            )}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// =============================================================================
// API RATE LIMIT HEADER PARSER
// =============================================================================

export interface ApiRateLimitHeaders {
  "x-ratelimit-limit"?: string;
  "x-ratelimit-remaining"?: string;
  "x-ratelimit-reset"?: string;
  "retry-after"?: string;
}

/**
 * Extract rate limit info from API response headers.
 */
export function parseApiRateLimitHeaders(
  headers: Headers | ApiRateLimitHeaders
): {
  limit: number | null;
  remaining: number | null;
  resetAt: Date | null;
  retryAfter: number | null;
} {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    return (headers as Record<string, string | undefined>)[name] ?? null;
  };

  const limit = getHeader("x-ratelimit-limit");
  const remaining = getHeader("x-ratelimit-remaining");
  const reset = getHeader("x-ratelimit-reset");
  const retryAfter = getHeader("retry-after");

  return {
    limit: limit ? parseInt(limit, 10) : null,
    remaining: remaining ? parseInt(remaining, 10) : null,
    resetAt: reset ? new Date(parseInt(reset, 10) * 1000) : null,
    retryAfter: retryAfter ? parseInt(retryAfter, 10) * 1000 : null,
  };
}

/**
 * Check if error is a rate limit error (429).
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Response) {
    return error.status === 429;
  }
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status: number }).status === 429;
  }
  return false;
}

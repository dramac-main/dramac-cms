// =============================================================================
// RETRY MECHANISMS
// =============================================================================
// Robust retry logic with exponential backoff and circuit breaker
// Part of PHASE-EH-06: Offline & Rate Limiting

"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, AlertCircle, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

// =============================================================================
// TYPES
// =============================================================================

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries (ms) */
  baseDelay: number;
  /** Maximum delay between retries (ms) */
  maxDelay: number;
  /** Backoff multiplier */
  backoffFactor: number;
  /** Add random jitter to delays */
  jitter?: boolean;
  /** Condition to check if retry should happen */
  retryCondition?: (error: Error, attempt: number) => boolean;
  /** Callback on each retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  /** Callback on final failure */
  onFinalFailure?: (error: Error, attempts: number) => void;
}

export interface RetryState {
  /** Current attempt number (0-indexed) */
  attempt: number;
  /** Maximum attempts */
  maxAttempts: number;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Last error encountered */
  lastError: Error | null;
  /** Time until next retry (ms) */
  nextRetryIn: number | null;
  /** Whether all retries exhausted */
  isExhausted: boolean;
}

export interface RetryResult<T> {
  /** Whether operation succeeded */
  success: boolean;
  /** Result data (if successful) */
  data?: T;
  /** Error (if failed) */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate delay for a given attempt with exponential backoff.
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Pick<RetryConfig, "baseDelay" | "maxDelay" | "backoffFactor" | "jitter">
): number {
  const { baseDelay, maxDelay, backoffFactor, jitter } = config;
  
  // Exponential backoff
  let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
  
  // Add jitter (±25%)
  if (jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5;
    delay = Math.floor(delay * jitterFactor);
  }
  
  return delay;
}

/**
 * Default retry condition - retry on network errors and 5xx status codes.
 */
export function defaultRetryCondition(error: Error): boolean {
  // Network errors
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return true;
  }
  
  // Check for HTTP status in error
  if ("status" in error) {
    const status = (error as { status: number }).status;
    // Retry on 5xx errors, 429 (rate limit), 408 (timeout)
    return status >= 500 || status === 429 || status === 408;
  }
  
  // Retry on specific error messages
  const retryableMessages = [
    "network",
    "timeout",
    "abort",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
  ];
  
  return retryableMessages.some((msg) =>
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Sleep for a given duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// RETRY FUNCTION
// =============================================================================

/**
 * Retry an async operation with exponential backoff.
 * 
 * @example
 * ```typescript
 * const result = await retry(
 *   async () => await fetch('/api/data'),
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     maxDelay: 10000,
 *     backoffFactor: 2,
 *   }
 * );
 * 
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts,
    baseDelay,
    maxDelay,
    backoffFactor,
    jitter,
    retryCondition = defaultRetryCondition,
    onRetry,
    onFinalFailure,
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: Error | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    attempts++;
    
    try {
      const data = await operation();
      return { success: true, data, attempts };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Check if we should retry
      if (attempt < maxAttempts - 1 && retryCondition(lastError, attempt)) {
        const delay = calculateBackoffDelay(attempt, {
          baseDelay,
          maxDelay,
          backoffFactor,
          jitter,
        });
        
        onRetry?.(lastError, attempt + 1, delay);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  if (lastError) {
    onFinalFailure?.(lastError, attempts);
  }

  return {
    success: false,
    error: lastError || new Error("Unknown error"),
    attempts,
  };
}

// =============================================================================
// USE RETRY HOOK
// =============================================================================

export interface UseRetryOptions<T> extends Partial<RetryConfig> {
  /** Whether to retry automatically on mount */
  autoRetry?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
}

export interface UseRetryResult<T> {
  /** Execute the operation with retry */
  execute: () => Promise<RetryResult<T>>;
  /** Manually trigger a retry */
  retry: () => void;
  /** Cancel ongoing operation */
  cancel: () => void;
  /** Reset state */
  reset: () => void;
  /** Current retry state */
  state: RetryState;
  /** Result data (if successful) */
  data: T | undefined;
  /** Whether operation is loading */
  isLoading: boolean;
  /** Whether operation succeeded */
  isSuccess: boolean;
  /** Whether operation failed */
  isError: boolean;
}

/**
 * Hook for retrying async operations with UI state management.
 * 
 * @example
 * ```typescript
 * const { execute, state, data, isLoading } = useRetry(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Failed');
 *     return response.json();
 *   },
 *   { maxAttempts: 3, showToasts: true }
 * );
 * 
 * // Execute
 * await execute();
 * 
 * // Check state
 * if (state.isRetrying) {
 *   console.log(`Retry ${state.attempt} of ${state.maxAttempts}`);
 * }
 * ```
 */
export function useRetry<T>(
  operation: () => Promise<T>,
  options: UseRetryOptions<T> = {}
): UseRetryResult<T> {
  const {
    autoRetry = false,
    showToasts = false,
    maxAttempts = DEFAULT_RETRY_CONFIG.maxAttempts,
    ...retryConfig
  } = options;

  const [state, setState] = useState<RetryState>({
    attempt: 0,
    maxAttempts,
    isRetrying: false,
    lastError: null,
    nextRetryIn: null,
    isExhausted: false,
  });

  const [data, setData] = useState<T | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      attempt: 0,
      maxAttempts,
      isRetrying: false,
      lastError: null,
      nextRetryIn: null,
      isExhausted: false,
    });
    setData(undefined);
    setStatus("idle");
    cancelledRef.current = false;
  }, [cancel, maxAttempts]);

  const execute = useCallback(async (): Promise<RetryResult<T>> => {
    cancelledRef.current = false;
    setStatus("loading");
    setState((prev) => ({
      ...prev,
      attempt: 0,
      isRetrying: false,
      lastError: null,
      isExhausted: false,
    }));

    const result = await retry(operation, {
      maxAttempts,
      ...retryConfig,
      onRetry: (error, attempt, delay) => {
        if (cancelledRef.current) return;
        
        setState((prev) => ({
          ...prev,
          attempt,
          isRetrying: true,
          lastError: error,
          nextRetryIn: delay,
        }));

        if (showToasts) {
          showToast.warning(
            `Retrying... Attempt ${attempt} of ${maxAttempts} - Next retry in ${Math.ceil(delay / 1000)}s`
          );
        }

        retryConfig.onRetry?.(error, attempt, delay);
      },
      onFinalFailure: (error, attempts) => {
        if (cancelledRef.current) return;
        
        setState((prev) => ({
          ...prev,
          isRetrying: false,
          isExhausted: true,
          lastError: error,
        }));

        if (showToasts) {
          showToast.error(
            `Operation failed after ${attempts} attempts: ${error.message}`
          );
        }

        retryConfig.onFinalFailure?.(error, attempts);
      },
    });

    if (cancelledRef.current) {
      return { success: false, error: new Error("Cancelled"), attempts: 0 };
    }

    if (result.success) {
      setData(result.data);
      setStatus("success");
      setState((prev) => ({
        ...prev,
        isRetrying: false,
        lastError: null,
      }));

      if (showToasts && state.attempt > 0) {
        showToast.success("Operation completed successfully");
      }
    } else {
      setStatus("error");
    }

    return result;
  }, [operation, maxAttempts, retryConfig, showToasts, state.attempt]);

  const retryManually = useCallback(() => {
    execute();
  }, [execute]);

  // Auto-retry on mount
  useEffect(() => {
    if (autoRetry) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRetry]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    execute,
    retry: retryManually,
    cancel,
    reset,
    state,
    data,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
  };
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time to wait before attempting half-open (ms) */
  resetTimeout: number;
  /** Number of successes in half-open to close circuit */
  successThreshold: number;
  /** Callback when circuit opens */
  onOpen?: () => void;
  /** Callback when circuit closes */
  onClose?: () => void;
  /** Callback when circuit enters half-open */
  onHalfOpen?: () => void;
}

export interface CircuitBreakerState {
  /** Current circuit state */
  state: CircuitState;
  /** Number of consecutive failures */
  failures: number;
  /** Number of consecutive successes (in half-open) */
  successes: number;
  /** Time when circuit will attempt half-open */
  nextAttemptAt: number | null;
}

/**
 * Circuit breaker implementation for preventing cascading failures.
 */
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private nextAttemptAt: number | null = null;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 30000,
      successThreshold: 2,
      ...config,
    };
  }

  /**
   * Execute an operation through the circuit breaker.
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() >= (this.nextAttemptAt || 0)) {
        this.state = "half-open";
        this.config.onHalfOpen?.();
      } else {
        throw new Error("Circuit is open");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if operation is allowed.
   */
  canExecute(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      return Date.now() >= (this.nextAttemptAt || 0);
    }
    return true; // half-open
  }

  /**
   * Get current state.
   */
  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttemptAt: this.nextAttemptAt,
    };
  }

  /**
   * Reset the circuit breaker.
   */
  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.successes = 0;
    this.nextAttemptAt = null;
  }

  private onSuccess(): void {
    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = "closed";
        this.failures = 0;
        this.successes = 0;
        this.nextAttemptAt = null;
        this.config.onClose?.();
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.successes = 0;

    if (this.state === "half-open" || this.failures >= this.config.failureThreshold) {
      this.state = "open";
      this.nextAttemptAt = Date.now() + this.config.resetTimeout;
      this.config.onOpen?.();
    }
  }
}

// =============================================================================
// RETRYABLE OPERATION COMPONENT
// =============================================================================

export interface RetryableOperationProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The async operation to execute */
  operation: () => Promise<T>;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Render function for success state */
  children: (data: T) => React.ReactNode;
  /** Loading component */
  loadingComponent?: React.ReactNode;
  /** Error component (receives retry function) */
  errorComponent?: (error: Error, retry: () => void, state: RetryState) => React.ReactNode;
  /** Auto-execute on mount */
  autoExecute?: boolean;
}

/**
 * Component wrapper for retryable operations.
 */
export function RetryableOperation<T>({
  className,
  operation,
  retryConfig,
  children,
  loadingComponent,
  errorComponent,
  autoExecute = true,
  ...props
}: RetryableOperationProps<T>) {
  const { execute, retry: retryFn, state, data, isLoading, isSuccess, isError } = useRetry(
    operation,
    { autoRetry: autoExecute, ...retryConfig }
  );

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)} {...props}>
        {loadingComponent || (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            {state.isRetrying && (
              <p className="text-sm text-muted-foreground">
                Retry {state.attempt} of {state.maxAttempts}...
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isError && state.lastError) {
    if (errorComponent) {
      return <>{errorComponent(state.lastError, retryFn, state)}</>;
    }

    return (
      <div className={cn("flex flex-col items-center gap-3 p-4", className)} {...props}>
        <CircleX className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{state.lastError.message}</p>
        {state.isExhausted ? (
          <Button variant="outline" size="sm" onClick={retryFn}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Retrying in {Math.ceil((state.nextRetryIn || 0) / 1000)}s...
          </p>
        )}
      </div>
    );
  }

  if (isSuccess && data !== undefined) {
    return <>{children(data)}</>;
  }

  if (!autoExecute) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)} {...props}>
        <Button onClick={() => execute()}>Load</Button>
      </div>
    );
  }

  return null;
}

// =============================================================================
// RETRY STATUS INDICATOR
// =============================================================================

export interface RetryStatusIndicatorProps {
  /** Retry state */
  state: RetryState;
  /** Show as compact */
  compact?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Visual indicator for retry status.
 */
export function RetryStatusIndicator({ className, state, compact = false }: RetryStatusIndicatorProps) {
    const { attempt, maxAttempts, isRetrying, lastError, nextRetryIn, isExhausted } = state;

    if (!isRetrying && !isExhausted) return null;

    const icon = isExhausted ? (
      <CircleX className={cn("text-destructive", compact ? "h-3 w-3" : "h-4 w-4")} />
    ) : (
      <RefreshCcw className={cn("animate-spin text-amber-500", compact ? "h-3 w-3" : "h-4 w-4")} />
    );

    if (compact) {
      return (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs",
            isExhausted ? "text-destructive" : "text-amber-500",
            className
          )}
        >
          {icon}
          <span>
            {isExhausted
              ? "Failed"
              : `Retry ${attempt}/${maxAttempts}`}
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
            isExhausted
              ? "border-destructive/20 bg-destructive/10"
              : "border-amber-500/20 bg-amber-500/10",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {icon}
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                isExhausted ? "text-destructive" : "text-amber-600"
              )}>
                {isExhausted
                  ? "All retries failed"
                  : `Retrying... (${attempt}/${maxAttempts})`}
              </p>
              {lastError && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lastError.message}
                </p>
              )}
            </div>
            {!isExhausted && nextRetryIn && (
              <span className="text-xs text-muted-foreground">
                {Math.ceil(nextRetryIn / 1000)}s
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

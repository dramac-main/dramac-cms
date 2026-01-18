import {
  isAppError,
  isValidationError,
  isRateLimitError,
} from "./error-types";

/**
 * Formatted error structure for API responses and UI display
 */
export interface FormattedError {
  message: string;
  code: string;
  statusCode: number;
  fields?: Record<string, string[]>;
  retryAfter?: number;
  timestamp?: string;
}

/**
 * Error severity levels for logging and monitoring
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

/**
 * Error logging context
 */
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

/**
 * Format error for API response or UI display
 */
export function formatError(error: unknown): FormattedError {
  // Handle our custom errors
  if (isAppError(error)) {
    const formatted: FormattedError = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: error.timestamp.toISOString(),
    };

    if (isValidationError(error)) {
      formatted.fields = error.fields;
    }

    if (isRateLimitError(error)) {
      formatted.retryAfter = error.retryAfter;
    }

    return formatted;
  }

  // Handle standard errors
  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      message: error,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };
  }

  // Handle unknown
  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error response for API routes
 */
export function errorResponse(error: unknown): Response {
  const formatted = formatError(error);
  
  const headers: HeadersInit = { 
    "Content-Type": "application/json" 
  };

  // Add retry-after header for rate limit errors
  if (formatted.retryAfter) {
    headers["Retry-After"] = String(formatted.retryAfter);
  }
  
  return new Response(JSON.stringify(formatted), {
    status: formatted.statusCode,
    headers,
  });
}

/**
 * Determine error severity for logging purposes
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isAppError(error)) {
    // Non-operational errors are critical
    if (!error.isOperational) {
      return "critical";
    }

    // Rate limits and validation are low priority
    if (error.statusCode === 429 || error.statusCode === 400) {
      return "low";
    }

    // Auth errors are medium
    if (error.statusCode === 401 || error.statusCode === 403) {
      return "medium";
    }

    // Server errors are high
    if (error.statusCode >= 500) {
      return "high";
    }

    return "medium";
  }

  // Unknown errors are high priority
  return "high";
}

/**
 * Log error with context
 */
export function logError(
  error: unknown, 
  context?: ErrorContext,
  severity?: ErrorSeverity
): void {
  const formatted = formatError(error);
  const errorSeverity = severity || getErrorSeverity(error);
  
  const logData = {
    severity: errorSeverity,
    error: formatted,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  };

  // In production, this would send to a logging service
  switch (errorSeverity) {
    case "critical":
      console.error("[CRITICAL]", JSON.stringify(logData, null, 2));
      break;
    case "high":
      console.error("[ERROR]", JSON.stringify(logData, null, 2));
      break;
    case "medium":
      console.warn("[WARN]", JSON.stringify(logData, null, 2));
      break;
    case "low":
      console.info("[INFO]", JSON.stringify(logData, null, 2));
      break;
  }
}

/**
 * Handle error with logging and formatting
 */
export function handleError(
  error: unknown, 
  context?: string | ErrorContext
): FormattedError {
  const formatted = formatError(error);
  
  // Determine context
  const errorContext: ErrorContext = typeof context === "string" 
    ? { path: context } 
    : context || {};
  
  // Log non-operational errors or server errors
  if (
    (isAppError(error) && !error.isOperational) ||
    formatted.statusCode >= 500
  ) {
    logError(error, errorContext);
  }
  
  return formatted;
}

/**
 * Create a safe error message for display (strips sensitive info)
 */
export function getSafeErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    // Always show operational error messages
    if (error.isOperational) {
      return error.message;
    }
  }

  // For non-operational errors, show generic message
  return "An unexpected error occurred. Please try again later.";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    // Rate limits are retryable
    if (isRateLimitError(error)) {
      return true;
    }

    // Network and timeout errors are retryable
    if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") {
      return true;
    }

    // Service unavailable is retryable
    if (error.statusCode === 503) {
      return true;
    }

    // Server errors may be retryable
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true;
    }
  }

  return false;
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(error: unknown, attempt: number = 1): number {
  // If rate limit error, use the retry-after value
  if (isRateLimitError(error)) {
    return error.retryAfter * 1000;
  }

  // Exponential backoff with jitter
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.random() * 0.1 * delay;
  
  return delay + jitter;
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  }) as T;
}

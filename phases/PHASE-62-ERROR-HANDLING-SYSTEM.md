# Phase 62: Error Handling System - Global Error Management

> **AI Model**: Claude Opus 4.5 (2x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Implement a comprehensive error handling system with global error boundaries, consistent error formatting, error logging, user-friendly error messages, and automatic error recovery where possible.

---

## 📋 Prerequisites

- [ ] Phase 61 Rate Limiting completed
- [ ] Error logging service (Sentry or similar) account ready
- [ ] Understanding of React error boundaries

---

## 🚨 Why This Is Critical

1. **User Experience** - Users see helpful error messages, not crashes
2. **Debugging** - Developers get detailed error context
3. **Reliability** - Automatic recovery from transient errors
4. **Monitoring** - Track error patterns and trends
5. **Security** - Don't leak sensitive information in errors

---

## 📁 Files to Create

```
src/lib/errors/
├── index.ts                    # Main exports
├── error-types.ts              # Custom error classes
├── error-handler.ts            # Global error handler
├── error-formatter.ts          # Format errors for display
├── error-logger.ts             # Log errors to service
└── error-recovery.ts           # Automatic recovery strategies

src/components/errors/
├── error-boundary.tsx          # React error boundary
├── global-error.tsx            # App-level error UI
├── api-error-handler.tsx       # API error display
├── inline-error.tsx            # Inline error messages
└── error-toast.tsx             # Toast notifications for errors

src/app/
├── error.tsx                   # App router error page
├── global-error.tsx            # Root error boundary
└── not-found.tsx               # 404 page

src/hooks/
├── use-error-handler.ts        # Hook for error handling
└── use-async-error.ts          # Hook for async operations
```

---

## ✅ Tasks

### Task 62.1: Custom Error Types

**File: `src/lib/errors/error-types.ts`**

```typescript
// Base application error
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      isOperational?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || "UNKNOWN_ERROR";
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    this.timestamp = new Date();

    if (options.cause) {
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(
    message: string = "Authentication required",
    options: { code?: string; context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      code: options.code || "AUTH_ERROR",
      statusCode: 401,
      isOperational: true,
      context: options.context,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "Access denied",
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      code: "FORBIDDEN",
      statusCode: 403,
      isOperational: true,
      context: options.context,
    });
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    fields: Record<string, string[]> = {},
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      isOperational: true,
      context: { ...options.context, fields },
    });
    this.fields = fields;
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(
    resource: string = "Resource",
    id?: string,
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(`${resource} not found${id ? `: ${id}` : ""}`, {
      code: "NOT_FOUND",
      statusCode: 404,
      isOperational: true,
      context: { resource, id, ...options.context },
    });
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource conflict",
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      code: "CONFLICT",
      statusCode: 409,
      isOperational: true,
      context: options.context,
    });
  }
}

// Rate limiting
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(
    retryAfter: number = 60,
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`, {
      code: "RATE_LIMIT_EXCEEDED",
      statusCode: 429,
      isOperational: true,
      context: { retryAfter, ...options.context },
    });
    this.retryAfter = retryAfter;
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string = "External service error",
    options: { cause?: Error; context?: Record<string, unknown> } = {}
  ) {
    super(`${service}: ${message}`, {
      code: "EXTERNAL_SERVICE_ERROR",
      statusCode: 502,
      isOperational: true,
      context: { service, ...options.context },
      cause: options.cause,
    });
    this.service = service;
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(
    message: string = "Database operation failed",
    options: { cause?: Error; context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      code: "DATABASE_ERROR",
      statusCode: 500,
      isOperational: false,
      context: options.context,
      cause: options.cause,
    });
  }
}

// AI service errors
export class AIServiceError extends AppError {
  constructor(
    message: string = "AI service error",
    options: { cause?: Error; context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      code: "AI_SERVICE_ERROR",
      statusCode: 503,
      isOperational: true,
      context: options.context,
      cause: options.cause,
    });
  }
}

// File upload errors
export class UploadError extends AppError {
  constructor(
    message: string = "File upload failed",
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(message, {
      code: "UPLOAD_ERROR",
      statusCode: 400,
      isOperational: true,
      context: options.context,
    });
  }
}
```

---

### Task 62.2: Error Formatter

**File: `src/lib/errors/error-formatter.ts`**

```typescript
import { AppError, ValidationError } from "./error-types";

export interface FormattedError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  retryable: boolean;
}

// User-friendly messages for error codes
const ERROR_MESSAGES: Record<string, UserFriendlyError> = {
  AUTH_ERROR: {
    title: "Authentication Required",
    message: "Please sign in to continue.",
    action: "/login",
    actionLabel: "Sign In",
    retryable: false,
  },
  FORBIDDEN: {
    title: "Access Denied",
    message: "You don't have permission to access this resource.",
    retryable: false,
  },
  NOT_FOUND: {
    title: "Not Found",
    message: "The page or resource you're looking for doesn't exist.",
    action: "/",
    actionLabel: "Go Home",
    retryable: false,
  },
  VALIDATION_ERROR: {
    title: "Invalid Input",
    message: "Please check your input and try again.",
    retryable: true,
  },
  RATE_LIMIT_EXCEEDED: {
    title: "Too Many Requests",
    message: "You've made too many requests. Please wait a moment.",
    retryable: true,
  },
  EXTERNAL_SERVICE_ERROR: {
    title: "Service Unavailable",
    message: "An external service is temporarily unavailable. Please try again.",
    retryable: true,
  },
  DATABASE_ERROR: {
    title: "Something Went Wrong",
    message: "We're having trouble processing your request. Please try again.",
    retryable: true,
  },
  AI_SERVICE_ERROR: {
    title: "AI Service Busy",
    message: "Our AI service is temporarily unavailable. Please try again in a moment.",
    retryable: true,
  },
  UPLOAD_ERROR: {
    title: "Upload Failed",
    message: "There was a problem uploading your file. Please try again.",
    retryable: true,
  },
  UNKNOWN_ERROR: {
    title: "Unexpected Error",
    message: "Something unexpected happened. Please try again.",
    retryable: true,
  },
};

export function formatErrorForAPI(
  error: unknown,
  requestId?: string
): FormattedError {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error instanceof ValidationError 
        ? { fields: error.fields } 
        : error.context,
      timestamp: error.timestamp.toISOString(),
      requestId,
    };
  }

  if (error instanceof Error) {
    return {
      message: process.env.NODE_ENV === "production" 
        ? "An unexpected error occurred" 
        : error.message,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function formatErrorForUser(error: unknown): UserFriendlyError {
  if (error instanceof AppError) {
    const template = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN_ERROR;
    
    // Override with specific message if operational error
    if (error.isOperational) {
      return {
        ...template,
        message: error.message,
      };
    }
    
    return template;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    const template = ERROR_MESSAGES[error.code];
    return template?.retryable ?? false;
  }
  return true; // Default to retryable for unknown errors
}
```

---

### Task 62.3: Error Logger

**File: `src/lib/errors/error-logger.ts`**

```typescript
import { AppError } from "./error-types";

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

interface ErrorLog {
  level: LogLevel;
  message: string;
  code: string;
  timestamp: string;
  stack?: string;
  context: LogContext;
  error: Record<string, unknown>;
}

class ErrorLogger {
  private sentryDsn?: string;
  private isProduction: boolean;

  constructor() {
    this.sentryDsn = process.env.SENTRY_DSN;
    this.isProduction = process.env.NODE_ENV === "production";
  }

  private getLogLevel(error: unknown): LogLevel {
    if (error instanceof AppError) {
      if (!error.isOperational) return "error";
      if (error.statusCode >= 500) return "error";
      if (error.statusCode >= 400) return "warn";
      return "info";
    }
    return "error";
  }

  private formatLog(error: unknown, context: LogContext = {}): ErrorLog {
    const timestamp = new Date().toISOString();
    const level = this.getLogLevel(error);

    if (error instanceof AppError) {
      return {
        level,
        message: error.message,
        code: error.code,
        timestamp,
        stack: error.stack,
        context,
        error: error.toJSON(),
      };
    }

    if (error instanceof Error) {
      return {
        level,
        message: error.message,
        code: "UNKNOWN_ERROR",
        timestamp,
        stack: error.stack,
        context,
        error: {
          name: error.name,
          message: error.message,
        },
      };
    }

    return {
      level,
      message: String(error),
      code: "UNKNOWN_ERROR",
      timestamp,
      context,
      error: { value: error },
    };
  }

  log(error: unknown, context: LogContext = {}): void {
    const log = this.formatLog(error, context);

    // Console logging (structured for JSON parsing)
    if (this.isProduction) {
      console.log(JSON.stringify(log));
    } else {
      // Pretty print in development
      console.error(`\n[${log.level.toUpperCase()}] ${log.code}: ${log.message}`);
      if (log.context && Object.keys(log.context).length > 0) {
        console.error("Context:", log.context);
      }
      if (log.stack) {
        console.error(log.stack);
      }
    }

    // Send to Sentry if available
    this.sendToSentry(error, context);
  }

  private async sendToSentry(error: unknown, context: LogContext): Promise<void> {
    if (!this.sentryDsn || !this.isProduction) return;

    try {
      // Dynamic import to avoid loading Sentry in development
      const Sentry = await import("@sentry/nextjs");

      Sentry.withScope((scope) => {
        // Set user context
        if (context.userId) {
          scope.setUser({ id: context.userId });
        }

        // Set request context
        if (context.requestId) {
          scope.setTag("request_id", context.requestId);
        }
        if (context.path) {
          scope.setTag("path", context.path);
        }
        if (context.method) {
          scope.setTag("method", context.method);
        }

        // Set extra context
        scope.setExtras(context);

        // Set error level
        if (error instanceof AppError) {
          scope.setLevel(error.isOperational ? "warning" : "error");
          scope.setTag("error_code", error.code);
        }

        // Capture the error
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(String(error));
        }
      });
    } catch (e) {
      console.error("Failed to send error to Sentry:", e);
    }
  }

  // Convenience methods
  debug(message: string, context: LogContext = {}): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context: LogContext = {}): void {
    console.info(`[INFO] ${message}`, context);
  }

  warn(error: unknown, context: LogContext = {}): void {
    this.log(error, context);
  }

  error(error: unknown, context: LogContext = {}): void {
    this.log(error, context);
  }

  fatal(error: unknown, context: LogContext = {}): void {
    this.log(error, { ...context, severity: "fatal" });
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Export for use in API routes
export function logError(error: unknown, context: LogContext = {}): void {
  errorLogger.log(error, context);
}
```

---

### Task 62.4: Error Handler

**File: `src/lib/errors/error-handler.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { AppError, DatabaseError, ExternalServiceError } from "./error-types";
import { formatErrorForAPI } from "./error-formatter";
import { logError } from "./error-logger";

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// Extract context from request
function getRequestContext(req: NextRequest): Record<string, unknown> {
  return {
    path: req.nextUrl.pathname,
    method: req.method,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  };
}

// Global error handler for API routes
export function handleAPIError(
  error: unknown,
  req?: NextRequest
): NextResponse {
  const requestId = generateRequestId();
  const context = req ? getRequestContext(req) : {};

  // Log the error
  logError(error, { ...context, requestId });

  // Format for response
  const formatted = formatErrorForAPI(error, requestId);

  // Determine if we should include detailed error info
  const isDev = process.env.NODE_ENV === "development";

  return NextResponse.json(
    {
      error: formatted.message,
      code: formatted.code,
      requestId,
      ...(isDev && error instanceof Error && { stack: error.stack }),
      ...(formatted.details && { details: formatted.details }),
    },
    {
      status: formatted.statusCode,
      headers: {
        "X-Request-ID": requestId,
      },
    }
  );
}

// Wrapper for API route handlers
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const req = args[0] as NextRequest;
      return handleAPIError(error, req);
    }
  }) as T;
}

// Handle async operations with error conversion
export async function handleAsync<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[T | null, AppError | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    if (error instanceof AppError) {
      return [null, error];
    }
    
    const appError = new AppError(
      errorMessage || (error instanceof Error ? error.message : "Operation failed"),
      { cause: error instanceof Error ? error : undefined }
    );
    
    return [null, appError];
  }
}

// Convert database errors
export function handleDatabaseError(error: unknown): DatabaseError {
  const message = error instanceof Error ? error.message : "Database operation failed";
  
  // Parse common database error patterns
  if (message.includes("violates unique constraint")) {
    return new DatabaseError("A record with these values already exists", {
      cause: error instanceof Error ? error : undefined,
    });
  }
  
  if (message.includes("violates foreign key constraint")) {
    return new DatabaseError("Referenced record not found", {
      cause: error instanceof Error ? error : undefined,
    });
  }
  
  if (message.includes("connection")) {
    return new DatabaseError("Database connection error. Please try again.", {
      cause: error instanceof Error ? error : undefined,
    });
  }

  return new DatabaseError(message, {
    cause: error instanceof Error ? error : undefined,
  });
}

// Convert external service errors
export function handleExternalError(
  service: string,
  error: unknown
): ExternalServiceError {
  const message = error instanceof Error ? error.message : "Service error";
  
  return new ExternalServiceError(service, message, {
    cause: error instanceof Error ? error : undefined,
  });
}
```

---

### Task 62.5: Error Recovery

**File: `src/lib/errors/error-recovery.ts`**

```typescript
import { AppError, RateLimitError, ExternalServiceError } from "./error-types";

interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryIf?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

// Determine if an error is retryable
export function isRetryable(error: unknown): boolean {
  if (error instanceof AppError) {
    // Don't retry auth or validation errors
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return error instanceof RateLimitError;
    }
    // Retry server errors
    return error.statusCode >= 500;
  }
  
  // Retry network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }
  
  return false;
}

// Calculate delay with exponential backoff
export function calculateDelay(
  attempt: number,
  options: RetryOptions
): number {
  const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt);
  // Add jitter to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.min(delay + jitter, options.maxDelay);
}

// Wait for specified milliseconds
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry an async operation with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = opts.retryIf 
        ? opts.retryIf(error) 
        : isRetryable(error);

      if (!shouldRetry || attempt === opts.maxAttempts - 1) {
        throw error;
      }

      // Handle rate limit errors specially
      if (error instanceof RateLimitError) {
        await wait(error.retryAfter * 1000);
      } else {
        const delay = calculateDelay(attempt, opts);
        await wait(delay);
      }
    }
  }

  throw lastError;
}

// Circuit breaker for external services
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
}

const DEFAULT_CIRCUIT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
};

export function withCircuitBreaker<T>(
  key: string,
  operation: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_CIRCUIT_OPTIONS, ...options };
  
  // Get or initialize circuit state
  let state = circuitBreakers.get(key);
  if (!state) {
    state = { failures: 0, lastFailure: 0, state: "closed" };
    circuitBreakers.set(key, state);
  }

  // Check circuit state
  const now = Date.now();
  
  if (state.state === "open") {
    if (now - state.lastFailure > opts.resetTimeout) {
      state.state = "half-open";
    } else {
      throw new ExternalServiceError(
        key,
        "Service temporarily unavailable (circuit breaker open)"
      );
    }
  }

  // Execute operation
  return operation()
    .then((result) => {
      // Success - reset failures
      state!.failures = 0;
      state!.state = "closed";
      return result;
    })
    .catch((error) => {
      // Failure - increment counter
      state!.failures++;
      state!.lastFailure = now;
      
      if (state!.failures >= opts.failureThreshold) {
        state!.state = "open";
      }
      
      throw error;
    });
}

// Reset circuit breaker (e.g., after manual intervention)
export function resetCircuitBreaker(key: string): void {
  circuitBreakers.delete(key);
}

// Get circuit breaker status
export function getCircuitBreakerStatus(key: string): CircuitBreakerState | undefined {
  return circuitBreakers.get(key);
}
```

---

### Task 62.6: Error Index Export

**File: `src/lib/errors/index.ts`**

```typescript
// Error types
export {
  AppError,
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  AIServiceError,
  UploadError,
} from "./error-types";

// Error handling
export {
  handleAPIError,
  withErrorHandling,
  handleAsync,
  handleDatabaseError,
  handleExternalError,
} from "./error-handler";

// Error formatting
export {
  formatErrorForAPI,
  formatErrorForUser,
  getErrorStatusCode,
  isRetryableError,
  type FormattedError,
  type UserFriendlyError,
} from "./error-formatter";

// Error logging
export { errorLogger, logError } from "./error-logger";

// Error recovery
export {
  isRetryable,
  withRetry,
  withCircuitBreaker,
  resetCircuitBreaker,
  getCircuitBreakerStatus,
} from "./error-recovery";
```

---

### Task 62.7: React Error Boundary

**File: `src/components/errors/error-boundary.tsx`**

```tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || "An unexpected error occurred."}
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[200px]">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details
                </summary>
                <pre className="whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap mt-4">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => window.location.href = "/"} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...options}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

---

### Task 62.8: Global Error Page

**File: `src/app/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, MessageSquare } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We apologize for the inconvenience. Our team has been notified and is working on a fix.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-muted rounded-lg p-4 text-left">
            <p className="text-sm font-medium mb-2">Error Details:</p>
            <pre className="text-xs overflow-auto whitespace-pre-wrap text-muted-foreground">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs mt-2 text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.href = "/"}
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Need help? Contact our support team.
          </p>
          <Button variant="ghost" size="sm" asChild>
            <a href="mailto:support@dramac.io">
              <MessageSquare className="h-4 w-4 mr-2" />
              support@dramac.io
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 62.9: Global Error Boundary (Root)

**File: `src/app/global-error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to error service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertOctagon className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Critical Error
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                The application has encountered a critical error and cannot continue.
              </p>
            </div>

            {error.digest && (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Error Reference: {error.digest}
              </p>
            )}

            <Button onClick={reset} size="lg" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

---

### Task 62.10: Not Found Page

**File: `src/app/not-found.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for something specific?
          </p>
          <div className="flex gap-2 justify-center flex-wrap text-sm">
            <Link href="/dashboard" className="text-primary hover:underline">
              Dashboard
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/clients" className="text-primary hover:underline">
              Clients
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/sites" className="text-primary hover:underline">
              Sites
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/help" className="text-primary hover:underline">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 62.11: Use Error Handler Hook

**File: `src/hooks/use-error-handler.ts`**

```typescript
"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { formatErrorForUser, AppError, isRetryableError } from "@/lib/errors";

interface UseErrorHandlerOptions {
  showToast?: boolean;
  onError?: (error: unknown) => void;
}

interface ErrorState {
  error: unknown | null;
  message: string | null;
  isRetryable: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, onError } = options;
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    message: null,
    isRetryable: false,
  });

  const handleError = useCallback(
    (error: unknown) => {
      const formatted = formatErrorForUser(error);
      
      setErrorState({
        error,
        message: formatted.message,
        isRetryable: formatted.retryable,
      });

      if (showToast) {
        toast.error(formatted.title, {
          description: formatted.message,
          action: formatted.action
            ? {
                label: formatted.actionLabel || "Action",
                onClick: () => window.location.href = formatted.action!,
              }
            : undefined,
        });
      }

      onError?.(error);

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error handled:", error);
      }
    },
    [showToast, onError]
  );

  const clearError = useCallback(() => {
    setErrorState({ error: null, message: null, isRetryable: false });
  }, []);

  return {
    error: errorState.error,
    errorMessage: errorState.message,
    isRetryable: errorState.isRetryable,
    handleError,
    clearError,
    hasError: errorState.error !== null,
  };
}
```

---

### Task 62.12: Use Async Error Hook

**File: `src/hooks/use-async-error.ts`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { useErrorHandler } from "./use-error-handler";
import { withRetry } from "@/lib/errors";

interface UseAsyncErrorOptions {
  showToast?: boolean;
  retry?: boolean;
  retryAttempts?: number;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown | null;
}

export function useAsyncError<T>(options: UseAsyncErrorOptions = {}) {
  const { 
    showToast = true, 
    retry = false, 
    retryAttempts = 3,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  });

  const { handleError, clearError } = useErrorHandler({ 
    showToast, 
    onError,
  });

  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, isError: false, error: null }));
      clearError();

      try {
        const operation = retry
          ? () => withRetry(asyncFn, { maxAttempts: retryAttempts })
          : asyncFn;

        const result = await operation();

        setState({
          data: result,
          isLoading: false,
          isError: false,
          error: null,
        });

        onSuccess?.();
        return result;
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          isError: true,
          error,
        });

        handleError(error);
        return null;
      }
    },
    [retry, retryAttempts, handleError, clearError, onSuccess]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });
    clearError();
  }, [clearError]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Convenience hook for mutations
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseAsyncErrorOptions = {}
) {
  const async = useAsyncError<TData>(options);

  const mutate = useCallback(
    (variables: TVariables) => async.execute(() => mutationFn(variables)),
    [async, mutationFn]
  );

  return {
    ...async,
    mutate,
  };
}
```

---

### Task 62.13: API Error Handler Component

**File: `src/components/errors/api-error-handler.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import { formatErrorForUser, type UserFriendlyError } from "@/lib/errors";

interface APIErrorHandlerProps {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

export function APIErrorHandler({
  error,
  onRetry,
  onDismiss,
  showDismiss = true,
  className,
}: APIErrorHandlerProps) {
  const [formatted, setFormatted] = useState<UserFriendlyError | null>(null);

  useEffect(() => {
    if (error) {
      setFormatted(formatErrorForUser(error));
    } else {
      setFormatted(null);
    }
  }, [error]);

  if (!formatted) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {formatted.title}
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>{formatted.message}</p>
        <div className="flex gap-2 mt-3">
          {formatted.retryable && onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {formatted.action && (
            <Button size="sm" variant="outline" asChild>
              <a href={formatted.action}>{formatted.actionLabel}</a>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

---

### Task 62.14: Inline Error Component

**File: `src/components/errors/inline-error.tsx`**

```tsx
"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineErrorProps {
  message?: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null;

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm text-destructive mt-1.5",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {message}
    </p>
  );
}

// For form field errors
interface FieldErrorProps {
  errors?: string[];
  className?: string;
}

export function FieldError({ errors, className }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={cn("space-y-1 mt-1.5", className)}>
      {errors.map((error, index) => (
        <InlineError key={index} message={error} />
      ))}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Custom error types serialize correctly
- [ ] Error formatter produces correct output
- [ ] Retry logic respects max attempts
- [ ] Circuit breaker opens/closes correctly
- [ ] Error boundary catches render errors

### Integration Tests
- [ ] API errors return correct status codes
- [ ] Error headers are set correctly
- [ ] Errors are logged to console/service
- [ ] Toast notifications appear for errors
- [ ] Error pages render correctly

### E2E Tests
- [ ] 404 page displays correctly
- [ ] Error boundary recovers with reset
- [ ] API errors show user-friendly messages
- [ ] Retry functionality works

---

## ✅ Completion Checklist

- [ ] All error type classes created
- [ ] Error formatter working
- [ ] Error logger integrated
- [ ] Error handler middleware created
- [ ] Error recovery (retry/circuit breaker) working
- [ ] React error boundary created
- [ ] App error page created
- [ ] Global error page created
- [ ] 404 page created
- [ ] Error hooks created
- [ ] Error components created
- [ ] Tests passing
- [ ] Sentry/logging integration (optional)

---

**Next Phase**: Phase 63 - Site Cloning

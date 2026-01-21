# Phase 43: Production - Error Handling

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md`

---

## 🎯 Objective

Implement comprehensive error handling with error boundaries, logging, and user-friendly error pages.

---

## 📋 Prerequisites

- [ ] Phase 42 completed
- [ ] Application functional
- [ ] Understanding of Next.js error handling

---

## ✅ Tasks

### Task 43.1: Global Error Boundary

**File: `src/components/error-boundary.tsx`**

```typescript
"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo);
    }
  }

  reportError(error: Error, errorInfo: ErrorInfo) {
    // Send to monitoring service (e.g., Sentry)
    // sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs bg-muted p-4 rounded-lg mb-6 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button asChild>
                <a href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </a>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Task 43.2: Next.js Error Pages

**File: `src/app/error.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Something went wrong!</h1>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**File: `src/app/not-found.tsx`**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**File: `src/app/global-error.tsx`**

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <AlertOctagon className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Critical Error</h1>
            <p className="text-muted-foreground mb-8">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### Task 43.3: API Error Handling

**File: `src/lib/errors.ts`**

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 400, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests", 429, "RATE_LIMIT");
  }
}

// Error response formatter
export function formatErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { errors: error.errors }),
      },
      status: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: {
        message: process.env.NODE_ENV === "production" 
          ? "An unexpected error occurred" 
          : error.message,
        code: "INTERNAL_ERROR",
      },
      status: 500,
    };
  }

  return {
    error: {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    status: 500,
  };
}
```

### Task 43.4: API Error Handler Wrapper

**File: `src/lib/api-handler.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { AppError, formatErrorResponse } from "./errors";

type Handler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: Handler): Handler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("API Error:", error);

      const { error: errorBody, status } = formatErrorResponse(error);
      
      return NextResponse.json(errorBody, { status });
    }
  };
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

### Task 43.5: Form Error Handling

**File: `src/components/ui/form-error.tsx`**

```typescript
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

interface FormSuccessProps {
  message?: string;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md",
        className
      )}
    >
      <span>✓</span>
      <span>{message}</span>
    </div>
  );
}
```

### Task 43.6: Toast Notifications for Errors

**File: `src/lib/toast.ts`**

```typescript
import { toast } from "sonner";

export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 5000,
  });
};

export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 4000,
  });
};

export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 3000,
  });
};

// Handle API errors
export const handleApiError = (error: unknown) => {
  if (error instanceof Response) {
    error.json().then((data) => {
      showError(data.error?.message || "An error occurred");
    });
    return;
  }

  if (error instanceof Error) {
    showError(error.message);
    return;
  }

  showError("An unexpected error occurred");
};
```

### Task 43.7: Logger Service

**File: `src/lib/logger.ts`**

```typescript
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private format(entry: LogEntry): string {
    const { level, message, data, timestamp, requestId } = entry;
    const prefix = requestId ? `[${requestId}]` : "";
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // In development, log to console
    if (this.isDev) {
      const formatted = this.format(entry);
      
      switch (level) {
        case "debug":
          console.debug(formatted);
          break;
        case "info":
          console.info(formatted);
          break;
        case "warn":
          console.warn(formatted);
          break;
        case "error":
          console.error(formatted);
          break;
      }
    } else {
      // In production, send to logging service
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    // Send to external logging service (e.g., Logtail, Datadog)
    // This is a placeholder - implement based on your logging provider
    console.log(JSON.stringify(entry));
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log("warn", message, data);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    const errorData = error instanceof Error 
      ? { 
          errorName: error.name, 
          errorMessage: error.message, 
          stack: error.stack,
          ...data 
        }
      : data;
    
    this.log("error", message, errorData);
  }
}

export const logger = new Logger();
```

### Task 43.8: Loading States

**File: `src/app/(dashboard)/loading.tsx`**

```typescript
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Error boundary catches React errors
- [ ] Custom error pages display correctly
- [ ] API errors handled consistently
- [ ] Form errors display properly
- [ ] Toast notifications work
- [ ] Logger captures errors
- [ ] Loading states show correctly

---

## 📁 Files Created This Phase

```
src/components/
├── error-boundary.tsx
└── ui/
    └── form-error.tsx

src/app/
├── error.tsx
├── not-found.tsx
├── global-error.tsx
└── (dashboard)/
    └── loading.tsx

src/lib/
├── errors.ts
├── api-handler.ts
├── toast.ts
└── logger.ts
```

---

## ➡️ Next Phase

**Phase 44: Production - Performance** - Optimization, caching, and performance monitoring.

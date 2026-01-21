# Phase 62: Error Handling System - Global Error Management

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 2-3 hours

---

## 🎯 Objective

Implement comprehensive error handling with global error boundaries, consistent error formatting, and user-friendly error messages.

---

## 📋 Prerequisites

- [ ] Phase 61 completed
- [ ] Next.js app router structure
- [ ] React error boundary understanding

---

## 📁 Files to Create

```
src/lib/errors/
├── index.ts                    # Main exports
├── error-types.ts              # Custom error classes
├── error-handler.ts            # Global error handler
├── error-formatter.ts          # Format errors for display

src/components/errors/
├── error-boundary.tsx          # React error boundary
├── inline-error.tsx            # Inline error messages
├── error-toast.tsx             # Toast notifications

src/app/
├── error.tsx                   # App router error page
├── not-found.tsx               # 404 page

src/hooks/
├── use-error-handler.ts        # Hook for error handling
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

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      isOperational?: boolean;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || "UNKNOWN_ERROR";
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational ?? true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, { code: "AUTH_ERROR", statusCode: 401 });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, { code: "FORBIDDEN", statusCode: 403 });
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(message = "Validation failed", fields: Record<string, string[]> = {}) {
    super(message, { code: "VALIDATION_ERROR", statusCode: 400 });
    this.fields = fields;
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(resource = "Resource", id?: string) {
    super(`${resource} not found${id ? `: ${id}` : ""}`, {
      code: "NOT_FOUND",
      statusCode: 404,
    });
  }
}

// Rate limiting
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super("Too many requests. Please try again later.", {
      code: "RATE_LIMITED",
      statusCode: 429,
    });
    this.retryAfter = retryAfter;
  }
}

// API errors
export class ApiError extends AppError {
  constructor(message: string, statusCode = 500) {
    super(message, { code: "API_ERROR", statusCode });
  }
}
```

---

### Task 62.2: Error Handler

**File: `src/lib/errors/error-handler.ts`**

```typescript
import { AppError, ValidationError } from "./error-types";

export interface FormattedError {
  message: string;
  code: string;
  statusCode: number;
  fields?: Record<string, string[]>;
  retryAfter?: number;
}

/**
 * Format error for API response
 */
export function formatError(error: unknown): FormattedError {
  // Handle our custom errors
  if (error instanceof AppError) {
    const formatted: FormattedError = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };

    if (error instanceof ValidationError) {
      formatted.fields = error.fields;
    }

    return formatted;
  }

  // Handle standard errors
  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
      statusCode: 500,
    };
  }

  // Handle unknown
  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Create error response for API routes
 */
export function errorResponse(error: unknown): Response {
  const formatted = formatError(error);
  
  return new Response(JSON.stringify(formatted), {
    status: formatted.statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Handle error with logging
 */
export function handleError(error: unknown, context?: string): FormattedError {
  const formatted = formatError(error);
  
  // Log non-operational errors
  if (error instanceof AppError && !error.isOperational) {
    console.error(`[${context || "ERROR"}]`, error);
  }
  
  return formatted;
}
```

---

### Task 62.3: Error Boundary Component

**File: `src/components/errors/error-boundary.tsx`**

```typescript
"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

---

### Task 62.4: App Router Error Pages

**File: `src/app/error.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="mt-4 text-2xl font-bold">Something went wrong!</h2>
      <p className="mt-2 text-muted-foreground">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="mt-6 flex gap-4">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

**File: `src/app/not-found.tsx`**

```typescript
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h1 className="mt-4 text-4xl font-bold">404</h1>
      <h2 className="mt-2 text-xl text-muted-foreground">Page not found</h2>
      <p className="mt-2 text-center text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6 flex gap-4">
        <Button variant="outline" asChild>
          <Link href="javascript:history.back()">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

---

### Task 62.5: Error Handler Hook

**File: `src/hooks/use-error-handler.ts`**

```typescript
"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { formatError } from "@/lib/errors/error-handler";

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, options?: { 
    title?: string;
    showToast?: boolean;
  }) => {
    const formatted = formatError(error);
    
    if (options?.showToast !== false) {
      toast.error(options?.title || "Error", {
        description: formatted.message,
      });
    }
    
    return formatted;
  }, []);

  return { handleError };
}
```

---

## ✅ Completion Checklist

- [ ] Custom error classes created
- [ ] Error formatting utility working
- [ ] Error boundary component working
- [ ] App-level error.tsx created
- [ ] 404 page created
- [ ] Error handler hook working
- [ ] Toast notifications for errors
- [ ] Tested error handling flow

---

## 📝 Notes for AI Agent

1. **DON'T OVER-ENGINEER** - Keep error types simple
2. **USER-FRIENDLY** - Show helpful messages, not stack traces
3. **LOG PROPERLY** - Log errors for debugging
4. **GRACEFUL RECOVERY** - Allow users to retry
5. **CONSISTENT FORMAT** - Use same format everywhere

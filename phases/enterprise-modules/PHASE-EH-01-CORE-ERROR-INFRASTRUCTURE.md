# PHASE-EH-01: Core Error Infrastructure

## Overview
- **Objective**: Establish enterprise-grade error handling foundation with standardized result types, error boundaries, and logging infrastructure
- **Scope**: Core error utilities, React error boundaries, error logging API
- **Dependencies**: None (foundational phase)
- **Estimated Effort**: ~4 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (Server Action pattern, component structure)
- [x] No conflicts detected

---

## Implementation Steps

### Step 1: Create Standardized Result Types
**File**: `src/lib/types/result.ts`
**Action**: Create new file
**Purpose**: Provide type-safe error handling for all server actions

```typescript
// src/lib/types/result.ts

/**
 * Standardized result type for all server actions
 * Usage: export async function myAction(): Promise<ActionResult<MyData>>
 */
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ActionError };

/**
 * Standardized error object structure
 */
export interface ActionError {
  /** Error category for programmatic handling */
  code: ErrorCode;
  /** User-friendly error message */
  message: string;
  /** Field-specific validation errors */
  details?: Record<string, string[]>;
  /** Specific field that caused the error */
  field?: string;
  /** Original error for debugging (not sent to client) */
  originalError?: unknown;
}

/**
 * All possible error codes in the platform
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'MODULE_NOT_ENABLED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'USAGE_LIMIT_EXCEEDED';

/**
 * Error factory functions for consistent error creation
 */
export const Errors = {
  /** Validation failed - use for form/input errors */
  validation: (message: string, details?: Record<string, string[]>): ActionError => ({
    code: 'VALIDATION_ERROR',
    message,
    details,
  }),

  /** Resource not found */
  notFound: (resource: string): ActionError => ({
    code: 'NOT_FOUND',
    message: `${resource} not found`,
  }),

  /** User not authenticated */
  unauthorized: (message?: string): ActionError => ({
    code: 'UNAUTHORIZED',
    message: message || 'You must be logged in to perform this action',
  }),

  /** User lacks permission */
  forbidden: (action?: string): ActionError => ({
    code: 'FORBIDDEN',
    message: action ? `You don't have permission to ${action}` : 'Access denied',
  }),

  /** Resource conflict (e.g., duplicate) */
  conflict: (message: string): ActionError => ({
    code: 'CONFLICT',
    message,
  }),

  /** Rate limit exceeded */
  rateLimited: (retryAfter?: number): ActionError => ({
    code: 'RATE_LIMITED',
    message: retryAfter 
      ? `Too many requests. Please try again in ${retryAfter} seconds`
      : 'Too many requests. Please slow down',
  }),

  /** Generic server error */
  server: (message = 'An unexpected error occurred. Please try again.'): ActionError => ({
    code: 'SERVER_ERROR',
    message,
  }),

  /** Network/connectivity error */
  network: (): ActionError => ({
    code: 'NETWORK_ERROR',
    message: 'Unable to connect. Please check your internet connection.',
  }),

  /** Request timeout */
  timeout: (): ActionError => ({
    code: 'TIMEOUT',
    message: 'Request timed out. Please try again.',
  }),

  /** Module not enabled for site */
  moduleNotEnabled: (moduleName: string): ActionError => ({
    code: 'MODULE_NOT_ENABLED',
    message: `The ${moduleName} module is not enabled for this site. Enable it in the Modules tab.`,
  }),

  /** Subscription required */
  subscriptionRequired: (feature: string): ActionError => ({
    code: 'SUBSCRIPTION_REQUIRED',
    message: `A subscription is required to access ${feature}.`,
  }),

  /** Usage limit exceeded */
  usageLimitExceeded: (limit: string): ActionError => ({
    code: 'USAGE_LIMIT_EXCEEDED',
    message: `You've reached your ${limit} limit. Please upgrade your plan.`,
  }),

  /** Create from unknown error */
  fromError: (error: unknown): ActionError => {
    if (error instanceof Error) {
      // Handle Supabase errors
      if ('code' in error && typeof (error as { code: string }).code === 'string') {
        const code = (error as { code: string }).code;
        if (code === '23505') {
          return Errors.conflict('A record with this value already exists');
        }
        if (code === '23503') {
          return Errors.notFound('Referenced record');
        }
        if (code === 'PGRST116') {
          return Errors.notFound('Resource');
        }
      }
      return {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        originalError: error,
      };
    }
    return Errors.server();
  },
};

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T>(result: ActionResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if result is an error
 */
export function isError<T>(result: ActionResult<T>): result is { success: false; error: ActionError } {
  return result.success === false;
}

/**
 * Helper to extract data from result or throw
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(result.error.message);
}
```

---

### Step 2: Create Global Error Boundary
**File**: `src/components/error-boundary/global-error-boundary.tsx`
**Action**: Create new file
**Purpose**: Catch and display top-level React errors gracefully

```typescript
// src/components/error-boundary/global-error-boundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  private async logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Only log in browser environment
    if (typeof window === 'undefined') return;

    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Silent fail for logging - don't cause additional errors
      console.error('Failed to log error:', error);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportBug = () => {
    // Open support with error details pre-filled
    const errorDetails = encodeURIComponent(
      `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack?.slice(0, 500)}`
    );
    window.location.href = `/dashboard/support?error=${errorDetails}`;
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-8">
              We&apos;re sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Report Bug Link */}
            <button
              onClick={this.handleReportBug}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Bug className="h-3 w-3" />
              Report this issue
            </button>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error Details (Development Only)
                </summary>
                <div className="mt-4 p-4 bg-muted rounded-lg overflow-auto max-h-64">
                  <p className="text-sm font-mono text-destructive mb-2">
                    {this.state.error.message}
                  </p>
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Step 3: Create Module-Level Error Boundary
**File**: `src/components/error-boundary/module-error-boundary.tsx`
**Action**: Create new file
**Purpose**: Isolate errors within modules so the rest of the dashboard remains functional

```typescript
// src/components/error-boundary/module-error-boundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  moduleName: string;
  moduleSlug?: string;
  siteId?: string;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log module-specific error
    console.error(`[${this.props.moduleName}] Error:`, error, errorInfo);
    
    // Send to logging service
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          module: this.props.moduleName,
          moduleSlug: this.props.moduleSlug,
          siteId: this.props.siteId,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoToSettings = () => {
    if (this.props.siteId && this.props.moduleSlug) {
      window.location.href = `/dashboard/sites/${this.props.siteId}/${this.props.moduleSlug}/settings`;
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default module error UI
      return (
        <div className={cn(
          "p-6 border border-destructive/20 rounded-lg bg-destructive/5",
          this.props.className
        )}>
          <div className="flex items-start gap-4">
            {/* Error Icon */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>

            {/* Error Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                Error in {this.props.moduleName}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This module encountered an error, but the rest of your dashboard is still working.
              </p>

              {/* Error message in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className="text-xs font-mono text-destructive mt-2 p-2 bg-destructive/10 rounded">
                  {this.state.error.message}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={this.handleRetry}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
                {this.props.siteId && this.props.moduleSlug && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={this.handleGoToSettings}
                    className="gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Module Settings
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### Step 4: Create Error Boundary Barrel Export
**File**: `src/components/error-boundary/index.ts`
**Action**: Create new file
**Purpose**: Clean exports for error boundary components

```typescript
// src/components/error-boundary/index.ts
export { GlobalErrorBoundary } from './global-error-boundary';
export { ModuleErrorBoundary } from './module-error-boundary';
```

---

### Step 5: Create Error Logging API Route
**File**: `src/app/api/log-error/route.ts`
**Action**: Create new file
**Purpose**: Server-side endpoint for collecting client errors

```typescript
// src/app/api/log-error/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ErrorLogPayload {
  message: string;
  stack?: string;
  componentStack?: string;
  module?: string;
  moduleSlug?: string;
  siteId?: string;
  url: string;
  userAgent?: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: ErrorLogPayload = await req.json();

    // Get user info if available
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Log structure
    const errorLog = {
      message: payload.message,
      stack: payload.stack?.slice(0, 5000), // Limit stack trace size
      component_stack: payload.componentStack?.slice(0, 2000),
      module_name: payload.module,
      module_slug: payload.moduleSlug,
      site_id: payload.siteId,
      url: payload.url,
      user_agent: payload.userAgent,
      user_id: user?.id,
      user_email: user?.email,
      timestamp: payload.timestamp,
      environment: process.env.NODE_ENV,
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    };

    // In production, send to monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with monitoring service
      // await sentry.captureException(errorLog);
      
      // For now, log to console which goes to Vercel logs
      console.error('[CLIENT_ERROR]', JSON.stringify(errorLog));
    } else {
      // In development, just log to console
      console.error('[CLIENT_ERROR]', errorLog);
    }

    // Optionally store in database for analysis
    // This can be enabled when an error_logs table is created
    /*
    await supabase.from('error_logs').insert({
      message: errorLog.message,
      stack: errorLog.stack,
      module_name: errorLog.module_name,
      site_id: errorLog.site_id,
      user_id: errorLog.user_id,
      url: errorLog.url,
      metadata: {
        component_stack: errorLog.component_stack,
        user_agent: errorLog.user_agent,
        app_version: errorLog.app_version,
      },
    });
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't fail if logging fails - this would cause recursive errors
    console.error('Error logging failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'error-logging' });
}
```

---

### Step 6: Create Error Logger Utility
**File**: `src/lib/error-logger.ts`
**Action**: Create new file
**Purpose**: Client-side utility for programmatic error logging

```typescript
// src/lib/error-logger.ts

interface ErrorLogEntry {
  message: string;
  stack?: string;
  componentStack?: string;
  module?: string;
  moduleSlug?: string;
  siteId?: string;
  url: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ErrorLoggerOptions {
  /** Maximum queue size before forcing flush */
  maxQueueSize?: number;
  /** Debounce time in ms before sending batch */
  debounceMs?: number;
}

class ErrorLogger {
  private queue: ErrorLogEntry[] = [];
  private isProcessing = false;
  private flushTimer: NodeJS.Timeout | null = null;
  private options: Required<ErrorLoggerOptions>;

  constructor(options: ErrorLoggerOptions = {}) {
    this.options = {
      maxQueueSize: options.maxQueueSize ?? 10,
      debounceMs: options.debounceMs ?? 1000,
    };
  }

  /**
   * Log an error to the service
   */
  log(
    error: Error,
    context?: {
      module?: string;
      moduleSlug?: string;
      siteId?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    // Only log in browser
    if (typeof window === 'undefined') return;

    const entry: ErrorLogEntry = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...context,
    };

    this.queue.push(entry);

    // Force flush if queue is full
    if (this.queue.length >= this.options.maxQueueSize) {
      this.flush();
    } else {
      // Otherwise debounce
      this.scheduleFlush();
    }
  }

  /**
   * Log a custom message (not an Error object)
   */
  logMessage(
    message: string,
    level: 'error' | 'warn' | 'info' = 'error',
    metadata?: Record<string, unknown>
  ) {
    const error = new Error(message);
    error.name = level.toUpperCase();
    this.log(error, { metadata: { ...metadata, level } });
  }

  private scheduleFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => this.flush(), this.options.debounceMs);
  }

  private async flush() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const logs = [...this.queue];
    this.queue = [];

    try {
      // Send batch to logging API
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs[0]), // API expects single log for now
      });

      // If we have more logs, send them too
      for (let i = 1; i < logs.length; i++) {
        await fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logs[i]),
        });
      }
    } catch (err) {
      // Re-queue failed logs for retry
      this.queue.push(...logs);
      console.error('Failed to send error logs:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Force immediate flush of all queued errors
   */
  forceFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    return this.flush();
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Convenience function for quick logging
export function logError(
  error: Error | string,
  context?: {
    module?: string;
    moduleSlug?: string;
    siteId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const err = typeof error === 'string' ? new Error(error) : error;
  errorLogger.log(err, context);
}
```

---

### Step 7: Update Root Layout with Global Error Boundary
**File**: `src/app/layout.tsx`
**Action**: Modify existing file
**Changes**: Wrap children with GlobalErrorBoundary

First, read the current layout to understand its structure:

```typescript
// In src/app/layout.tsx, wrap the children with GlobalErrorBoundary:

// Add import at top:
import { GlobalErrorBoundary } from '@/components/error-boundary';

// Then in the JSX, wrap children:
<GlobalErrorBoundary>
  {children}
</GlobalErrorBoundary>
```

---

### Step 8: Create Types Barrel Export Update
**File**: `src/lib/types/index.ts`
**Action**: Create or update barrel export

```typescript
// src/lib/types/index.ts
export * from './result';
// Add other type exports as needed
```

---

## Verification Steps

### 1. TypeScript Compilation
```bash
cd next-platform-dashboard
npx tsc --noEmit --skipLibCheck
```
Expected: Exit code 0, no errors

### 2. Build Test
```bash
pnpm build
```
Expected: Build succeeds

### 3. Manual Testing
1. Start dev server: `pnpm dev`
2. Navigate to dashboard
3. Open browser console - no errors
4. Test error boundary by temporarily adding `throw new Error('test')` in a component
5. Verify graceful error UI appears
6. Check `/api/log-error` receives POST requests (check Network tab)

### 4. Expected Outcomes
- [ ] New files created without errors
- [ ] TypeScript compiles clean
- [ ] Build passes
- [ ] Error boundaries catch errors gracefully
- [ ] Error logging API responds to requests
- [ ] Development mode shows error details
- [ ] Production mode hides sensitive details

---

## Rollback Plan

If issues arise:
1. Delete new files:
   - `src/lib/types/result.ts`
   - `src/components/error-boundary/` directory
   - `src/lib/error-logger.ts`
   - `src/app/api/log-error/route.ts`
2. Revert root layout changes
3. Clear `.next` cache: `rm -rf .next`
4. Restart dev server

---

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/types/result.ts` | Create | ActionResult type, Errors factory |
| `src/lib/types/index.ts` | Create | Types barrel export |
| `src/components/error-boundary/global-error-boundary.tsx` | Create | Top-level error boundary |
| `src/components/error-boundary/module-error-boundary.tsx` | Create | Module-scoped error boundary |
| `src/components/error-boundary/index.ts` | Create | Error boundary exports |
| `src/lib/error-logger.ts` | Create | Client error logging utility |
| `src/app/api/log-error/route.ts` | Create | Error logging API endpoint |
| `src/app/layout.tsx` | Modify | Add GlobalErrorBoundary wrapper |

---

## Next Phase

After PHASE-EH-01 is complete, proceed to:
**PHASE-EH-02: Toast/Notification System Enhancement**
- Enhance Sonner toast configuration
- Create `showToast` utility functions
- Implement undo pattern for destructive actions
- Add promise toasts for async operations

---

## Notes for Implementation

1. **Error Boundaries are React 19 compatible** - The class component pattern still works
2. **Don't forget 'use client'** - Error boundaries must be client components
3. **Keep error messages user-friendly** - Technical details only in dev mode
4. **Log rotation** - Consider implementing log rotation if storing in database
5. **Monitoring integration** - Ready for Sentry/LogRocket when configured

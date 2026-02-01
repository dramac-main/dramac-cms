// src/components/error-boundary/async-error-boundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  /** Custom loading fallback while Suspense is waiting */
  loadingFallback?: ReactNode;
  /** Custom error fallback */
  errorFallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback when user retries */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Variant for styling */
  variant?: 'default' | 'minimal' | 'card';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// =============================================================================
// DEFAULT LOADING FALLBACK
// =============================================================================

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// =============================================================================
// DEFAULT ERROR FALLBACK VARIANTS
// =============================================================================

interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
  variant: 'default' | 'minimal' | 'card';
  className?: string;
}

function DefaultErrorFallback({ error, onRetry, variant, className }: ErrorFallbackProps) {
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2 text-destructive", className)}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">Failed to load</span>
        <Button variant="ghost" size="sm" onClick={onRetry} className="h-auto p-1">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "p-6 border border-destructive/20 rounded-lg bg-destructive/5",
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1">
              An error occurred while loading this content.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs font-mono text-destructive mt-2 p-2 bg-destructive/10 rounded truncate">
                {error.message}
              </p>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRetry} 
              className="mt-4 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Failed to load</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        An error occurred while loading this content. Please try again.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs font-mono text-destructive mb-4 p-2 bg-destructive/10 rounded max-w-md truncate">
          {error.message}
        </p>
      )}
      <Button size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

// =============================================================================
// ASYNC ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * AsyncErrorBoundary - Combines Suspense and Error Boundary for async components
 * 
 * Features:
 * - Integrated Suspense for loading states
 * - Error boundary for error catching
 * - Retry functionality
 * - Multiple visual variants
 * - Custom fallbacks
 * 
 * @example
 * ```tsx
 * <AsyncErrorBoundary loadingFallback={<Skeleton />}>
 *   <AsyncComponent />
 * </AsyncErrorBoundary>
 * ```
 */
class ErrorBoundaryInner extends Component<
  Omit<AsyncErrorBoundaryProps, 'loadingFallback'>, 
  State
> {
  constructor(props: Omit<AsyncErrorBoundaryProps, 'loadingFallback'>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    console.error('[AsyncErrorBoundary] Error caught:', error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to service
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }

  handleRetry = () => {
    this.props.onRetry?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { children, errorFallback, variant = 'default', className } = this.props;
    const { hasError, error } = this.state;

    if (hasError && error) {
      // Custom error fallback function
      if (typeof errorFallback === 'function') {
        return errorFallback(error, this.handleRetry);
      }
      
      // Custom error fallback element
      if (errorFallback) {
        return errorFallback;
      }

      // Default error fallback
      return (
        <DefaultErrorFallback
          error={error}
          onRetry={this.handleRetry}
          variant={variant}
          className={className}
        />
      );
    }

    return children;
  }
}

/**
 * AsyncErrorBoundary wraps content with both Suspense and ErrorBoundary
 */
export function AsyncErrorBoundary({
  children,
  loadingFallback,
  ...errorBoundaryProps
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundaryInner {...errorBoundaryProps}>
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundaryInner>
  );
}

// Also export the inner component for cases where Suspense is handled separately
export { ErrorBoundaryInner as ErrorBoundary };

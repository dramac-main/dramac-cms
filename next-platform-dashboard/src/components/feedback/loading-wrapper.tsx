"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// =============================================================================
// LOADING WRAPPER
// =============================================================================

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface LoadingWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Error object or message
   */
  error?: Error | string | null;
  /**
   * Loading fallback UI
   */
  loadingFallback?: React.ReactNode;
  /**
   * Error fallback UI
   */
  errorFallback?: React.ReactNode;
  /**
   * Empty state fallback (when data is empty)
   */
  emptyFallback?: React.ReactNode;
  /**
   * Check if data is empty
   */
  isEmpty?: boolean;
  /**
   * Retry handler for errors
   */
  onRetry?: () => void;
  /**
   * Minimum loading time in ms (prevents flash)
   */
  minLoadingTime?: number;
  /**
   * Show loading overlay instead of replacing content
   */
  overlay?: boolean;
  /**
   * Blur content when loading (with overlay)
   */
  blur?: boolean;
  /**
   * Children to render
   */
  children: React.ReactNode;
}

/**
 * LoadingWrapper - Wrapper component for async data with loading/error states.
 * 
 * @example
 * ```tsx
 * <LoadingWrapper
 *   loading={isLoading}
 *   error={error}
 *   isEmpty={data.length === 0}
 *   emptyFallback={<EmptyState title="No items" />}
 *   onRetry={refetch}
 * >
 *   <DataTable data={data} />
 * </LoadingWrapper>
 * ```
 */
export function LoadingWrapper({
  loading = false,
  error = null,
  loadingFallback,
  errorFallback,
  emptyFallback,
  isEmpty = false,
  onRetry,
  minLoadingTime = 0,
  overlay = false,
  blur = true,
  children,
  className,
  ...props
}: LoadingWrapperProps) {
  const [isMinLoading, setIsMinLoading] = React.useState(false);
  const loadingStartRef = React.useRef<number | null>(null);

  // Track minimum loading time
  React.useEffect(() => {
    if (loading && minLoadingTime > 0) {
      loadingStartRef.current = Date.now();
      setIsMinLoading(true);
    } else if (!loading && loadingStartRef.current && minLoadingTime > 0) {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = minLoadingTime - elapsed;
      
      if (remaining > 0) {
        const timeout = setTimeout(() => {
          setIsMinLoading(false);
          loadingStartRef.current = null;
        }, remaining);
        return () => clearTimeout(timeout);
      } else {
        setIsMinLoading(false);
        loadingStartRef.current = null;
      }
    } else if (!loading) {
      setIsMinLoading(false);
    }
  }, [loading, minLoadingTime]);

  const isActuallyLoading = loading || isMinLoading;
  const errorMessage = error instanceof Error ? error.message : error;

  // Default loading fallback
  const defaultLoadingFallback = (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );

  // Default error fallback
  const defaultErrorFallback = (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-destructive">Something went wrong</p>
        {errorMessage && (
          <p className="text-sm text-muted-foreground max-w-md">{errorMessage}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );

  // Overlay mode
  if (overlay) {
    return (
      <div className={cn("relative", className)} {...props}>
        <div className={cn(
          "transition-all duration-200",
          isActuallyLoading && blur && "blur-sm pointer-events-none"
        )}>
          {children}
        </div>
        
        <AnimatePresence>
          {isActuallyLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]"
            >
              {loadingFallback || (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className} {...props}>
        {errorFallback || defaultErrorFallback}
      </div>
    );
  }

  // Loading state
  if (isActuallyLoading) {
    return (
      <div className={className} {...props}>
        {loadingFallback || defaultLoadingFallback}
      </div>
    );
  }

  // Empty state
  if (isEmpty && emptyFallback) {
    return (
      <div className={className} {...props}>
        {emptyFallback}
      </div>
    );
  }

  // Content
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// ASYNC BOUNDARY
// =============================================================================

export interface AsyncBoundaryProps {
  /**
   * Loading fallback
   */
  loadingFallback?: React.ReactNode;
  /**
   * Error fallback function
   */
  errorFallback?: (error: Error, reset: () => void) => React.ReactNode;
  /**
   * Children
   */
  children: React.ReactNode;
}

interface AsyncBoundaryState {
  error: Error | null;
}

/**
 * AsyncBoundary - Combines React Suspense with Error Boundary.
 * 
 * @example
 * ```tsx
 * <AsyncBoundary
 *   loadingFallback={<Skeleton className="h-40" />}
 *   errorFallback={(error, reset) => (
 *     <ErrorState error={error} action={{ label: "Retry", onClick: reset }} />
 *   )}
 * >
 *   <AsyncComponent />
 * </AsyncBoundary>
 * ```
 */
export class AsyncBoundary extends React.Component<AsyncBoundaryProps, AsyncBoundaryState> {
  constructor(props: AsyncBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): AsyncBoundaryState {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { children, loadingFallback, errorFallback } = this.props;
    const { error } = this.state;

    if (error) {
      return errorFallback ? (
        errorFallback(error, this.reset)
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button variant="outline" size="sm" onClick={this.reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return (
      <React.Suspense fallback={loadingFallback || (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}>
        {children}
      </React.Suspense>
    );
  }
}

// =============================================================================
// DATA LOADING STATE
// =============================================================================

export interface DataLoadingStateProps<T> {
  /**
   * Data to display
   */
  data: T | undefined | null;
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error state
   */
  error?: Error | null;
  /**
   * Check if data is empty
   */
  isEmpty?: (data: T) => boolean;
  /**
   * Loading skeleton
   */
  skeleton?: React.ReactNode;
  /**
   * Empty state
   */
  empty?: React.ReactNode;
  /**
   * Error state
   */
  errorState?: React.ReactNode;
  /**
   * Retry handler
   */
  onRetry?: () => void;
  /**
   * Render function for data
   */
  children: (data: T) => React.ReactNode;
}

/**
 * DataLoadingState - Generic component for handling data fetch states.
 * 
 * @example
 * ```tsx
 * <DataLoadingState
 *   data={contacts}
 *   isLoading={isLoading}
 *   error={error}
 *   isEmpty={(data) => data.length === 0}
 *   skeleton={<ContactListSkeleton />}
 *   empty={<EmptyState title="No contacts" />}
 *   onRetry={refetch}
 * >
 *   {(contacts) => <ContactList contacts={contacts} />}
 * </DataLoadingState>
 * ```
 */
export function DataLoadingState<T>({
  data,
  isLoading,
  error,
  isEmpty,
  skeleton,
  empty,
  errorState,
  onRetry,
  children,
}: DataLoadingStateProps<T>) {
  // Error state
  if (error) {
    if (errorState) return <>{errorState}</>;
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error.message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No data
  if (data === undefined || data === null) {
    if (empty) return <>{empty}</>;
    return null;
  }

  // Empty data
  if (isEmpty && isEmpty(data)) {
    if (empty) return <>{empty}</>;
    return null;
  }

  // Render content
  return <>{children(data)}</>;
}

// =============================================================================
// REFRESH BUTTON
// =============================================================================

export interface RefreshButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Last refreshed time
   */
  lastRefreshed?: Date | null;
  /**
   * Size variant
   */
  size?: "sm" | "default" | "lg" | "icon";
}

/**
 * RefreshButton - Button with loading state and optional last refreshed time.
 */
export const RefreshButton = React.forwardRef<HTMLButtonElement, RefreshButtonProps>(
  ({ loading, lastRefreshed, size = "sm", className, children, ...props }, ref) => {
    const [showTime, setShowTime] = React.useState(false);

    return (
      <div className="relative inline-flex items-center gap-2">
        <Button
          ref={ref}
          variant="ghost"
          size={size}
          disabled={loading}
          className={cn("gap-2", className)}
          onMouseEnter={() => setShowTime(true)}
          onMouseLeave={() => setShowTime(false)}
          {...props}
        >
          <RefreshCcw className={cn(
            "h-4 w-4",
            loading && "animate-spin"
          )} />
          {children}
        </Button>
        
        {lastRefreshed && showTime && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs text-muted-foreground whitespace-nowrap"
          >
            Last: {lastRefreshed.toLocaleTimeString()}
          </motion.span>
        )}
      </div>
    );
  }
);

RefreshButton.displayName = "RefreshButton";

// =============================================================================
// LOADING DOTS
// =============================================================================

export interface LoadingDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of dots
   */
  size?: "sm" | "default" | "lg";
  /**
   * Color variant
   */
  variant?: "default" | "primary" | "muted";
}

/**
 * LoadingDots - Animated loading dots indicator.
 */
export function LoadingDots({
  size = "default",
  variant = "default",
  className,
  ...props
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: "h-1 w-1",
    default: "h-2 w-2",
    lg: "h-3 w-3",
  };

  const colorClasses = {
    default: "bg-foreground",
    primary: "bg-primary",
    muted: "bg-muted-foreground",
  };

  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "rounded-full",
            sizeClasses[size],
            colorClasses[variant]
          )}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// LOADING TEXT
// =============================================================================

export interface LoadingTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Text to display
   */
  text?: string;
  /**
   * Animate dots
   */
  dots?: boolean;
}

/**
 * LoadingText - Text with animated loading dots.
 */
export function LoadingText({
  text = "Loading",
  dots = true,
  className,
  ...props
}: LoadingTextProps) {
  const [dotCount, setDotCount] = React.useState(0);

  React.useEffect(() => {
    if (!dots) return;
    
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);
    
    return () => clearInterval(interval);
  }, [dots]);

  return (
    <span className={cn("text-muted-foreground", className)} {...props}>
      {text}{dots && ".".repeat(dotCount)}
    </span>
  );
}

export {
  LoadingWrapper as default,
};

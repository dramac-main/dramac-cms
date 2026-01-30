"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// =============================================================================
// PAGE LOADER
// =============================================================================

export interface PageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Show progress indicator
   */
  showProgress?: boolean;
  /**
   * Progress value (0-100)
   */
  progress?: number;
  /**
   * Show branding/logo
   */
  showBranding?: boolean;
}

/**
 * PageLoader - Full-page loading indicator with optional progress.
 * 
 * @example
 * ```tsx
 * <PageLoader message="Loading dashboard..." />
 * 
 * <PageLoader 
 *   message="Uploading files..." 
 *   showProgress 
 *   progress={45} 
 * />
 * ```
 */
const PageLoader = React.forwardRef<HTMLDivElement, PageLoaderProps>(
  ({ className, message = "Loading...", showProgress, progress = 0, showBranding = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          {showBranding && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl font-bold text-primary"
            >
              DRAMAC
            </motion.div>
          )}
          
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          
          {message && (
            <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
          )}
          
          {showProgress && (
            <div className="w-48 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }
);

PageLoader.displayName = "PageLoader";

// =============================================================================
// CONTENT LOADER (Skeletons)
// =============================================================================

export type ContentLoaderVariant = "table" | "grid" | "list" | "card" | "form" | "stats";

export interface ContentLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Type of skeleton to display
   */
  variant: ContentLoaderVariant;
  /**
   * Number of skeleton items
   */
  count?: number;
  /**
   * Enable pulse animation
   */
  animated?: boolean;
}

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
);

const TableSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="w-full space-y-3">
    {/* Header */}
    <div className="flex gap-4 border-b pb-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-2">
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    ))}
  </div>
);

const GridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

const CardSkeleton = ({ count = 1 }: { count?: number }) => (
  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)` }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border p-4 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
);

const FormSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-2 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);

const StatsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

/**
 * ContentLoader - Section-level loading with skeleton previews.
 * 
 * @example
 * ```tsx
 * <ContentLoader variant="table" count={5} />
 * <ContentLoader variant="grid" count={6} />
 * <ContentLoader variant="stats" count={4} />
 * ```
 */
const ContentLoader = React.forwardRef<HTMLDivElement, ContentLoaderProps>(
  ({ className, variant, count = 5, animated = true, ...props }, ref) => {
    const skeletons: Record<ContentLoaderVariant, React.ReactNode> = {
      table: <TableSkeleton count={count} />,
      grid: <GridSkeleton count={count} />,
      list: <ListSkeleton count={count} />,
      card: <CardSkeleton count={count} />,
      form: <FormSkeleton count={count} />,
      stats: <StatsSkeleton count={count} />,
    };

    return (
      <div
        ref={ref}
        className={cn(animated && "animate-in fade-in duration-300", className)}
        {...props}
      >
        {skeletons[variant]}
      </div>
    );
  }
);

ContentLoader.displayName = "ContentLoader";

// =============================================================================
// INLINE LOADER
// =============================================================================

export interface InlineLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the loader
   */
  size?: "sm" | "md" | "lg";
  /**
   * Color of the loader
   */
  color?: string;
  /**
   * Loading label
   */
  label?: string;
  /**
   * Show spinner or dots
   */
  variant?: "spinner" | "dots";
}

/**
 * InlineLoader - Inline/button loading states.
 * 
 * @example
 * ```tsx
 * <Button disabled>
 *   <InlineLoader size="sm" />
 *   Saving...
 * </Button>
 * ```
 */
const InlineLoader = React.forwardRef<HTMLDivElement, InlineLoaderProps>(
  ({ className, size = "md", color, label, variant = "spinner", ...props }, ref) => {
    const sizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-1", className)}
          {...props}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={cn(
                "rounded-full bg-current",
                size === "sm" ? "h-1 w-1" : size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5"
              )}
              style={{ color }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
          {label && <span className="ml-2 text-sm">{label}</span>}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <Loader2 className={cn(sizes[size], "animate-spin")} style={{ color }} />
        {label && <span className="text-sm">{label}</span>}
      </div>
    );
  }
);

InlineLoader.displayName = "InlineLoader";

// =============================================================================
// LOADING OVERLAY
// =============================================================================

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether overlay is visible
   */
  visible: boolean;
  /**
   * Loading message
   */
  message?: string;
  /**
   * Blur background
   */
  blur?: boolean;
}

/**
 * LoadingOverlay - Overlay for sections during async operations.
 */
const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ className, visible, message, blur = true, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60",
              blur && "backdrop-blur-sm"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  }
);

LoadingOverlay.displayName = "LoadingOverlay";

export { PageLoader, ContentLoader, InlineLoader, LoadingOverlay, Skeleton };

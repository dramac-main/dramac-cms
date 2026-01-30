import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// =============================================================================
// SKELETON VARIANTS
// =============================================================================

const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    shape: {
      default: "rounded-md",
      circle: "rounded-full",
      square: "rounded-none",
      pill: "rounded-full",
    },
  },
  defaultVariants: {
    shape: "default",
  },
});

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/**
 * Skeleton - Loading placeholder with shape variants.
 * 
 * @example
 * ```tsx
 * // Default rectangle
 * <Skeleton className="h-4 w-full" />
 * 
 * // Circle (avatar placeholder)
 * <Skeleton shape="circle" className="h-10 w-10" />
 * 
 * // Pill shape (badge placeholder)
 * <Skeleton shape="pill" className="h-6 w-20" />
 * ```
 */
function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  );
}

// =============================================================================
// SKELETON PRESETS
// =============================================================================

/**
 * SkeletonText - Placeholder for text lines.
 */
function SkeletonText({ 
  lines = 3, 
  className,
  gap = "gap-2",
  ...props 
}: { 
  lines?: number; 
  gap?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", gap, className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            // Last line is shorter for natural text appearance
            i === lines - 1 ? "w-3/4" : "w-full"
          )} 
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Circular avatar placeholder.
 */
function SkeletonAvatar({ 
  size = "default",
  className,
  ...props 
}: { 
  size?: "sm" | "default" | "lg" | "xl"; 
} & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton 
      shape="circle" 
      className={cn(sizeClasses[size], className)} 
      {...props}
    />
  );
}

/**
 * SkeletonCard - Card placeholder with header, body, and optional footer.
 */
function SkeletonCard({ 
  showHeader = true,
  showFooter = false,
  lines = 2,
  className,
  ...props 
}: { 
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("rounded-xl border p-6 space-y-4", className)} 
      {...props}
    >
      {showHeader && (
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
      {showFooter && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </div>
  );
}

/**
 * SkeletonTable - Table placeholder with header and rows.
 */
function SkeletonTable({ 
  rows = 5,
  columns = 4,
  className,
  ...props 
}: { 
  rows?: number;
  columns?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonStats - Stats grid placeholder.
 */
function SkeletonStats({ 
  count = 4,
  className,
  ...props 
}: { 
  count?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "grid gap-4",
        count === 2 && "grid-cols-1 sm:grid-cols-2",
        count === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        count === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )} 
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-6 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonList - List item placeholders.
 */
function SkeletonList({ 
  count = 5,
  showAvatar = true,
  className,
  ...props 
}: { 
  count?: number;
  showAvatar?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <SkeletonAvatar size="sm" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonStats,
  SkeletonList,
  skeletonVariants,
};

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// =============================================================================
// SPINNER VARIANTS
// =============================================================================

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
        "2xl": "h-10 w-10",
      },
      variant: {
        default: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        success: "text-success",
        warning: "text-warning",
        danger: "text-danger",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Accessible label for screen readers
   * @default "Loading"
   */
  label?: string;
}

/**
 * Spinner - A standalone loading spinner component.
 * 
 * Features:
 * - Multiple sizes (xs to 2xl)
 * - Semantic color variants
 * - Accessible with aria-label
 * - Uses native SVG (no dependencies)
 * 
 * @example
 * ```tsx
 * // Default spinner
 * <Spinner />
 * 
 * // Large primary spinner
 * <Spinner size="lg" variant="primary" />
 * 
 * // In a button
 * <Button disabled>
 *   <Spinner size="sm" variant="white" className="mr-2" />
 *   Loading...
 * </Button>
 * 
 * // Full page loader
 * <div className="flex items-center justify-center h-screen">
 *   <Spinner size="2xl" variant="primary" />
 * </div>
 * ```
 */
const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, variant, label = "Loading", ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className={cn(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label={label}
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }
);

Spinner.displayName = "Spinner";

// =============================================================================
// SPINNER OVERLAY
// =============================================================================

export interface SpinnerOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Spinner size
   */
  size?: SpinnerProps["size"];
  /**
   * Spinner variant
   */
  variant?: SpinnerProps["variant"];
  /**
   * Optional loading text
   */
  text?: string;
  /**
   * Whether to blur the background
   * @default true
   */
  blur?: boolean;
}

/**
 * SpinnerOverlay - Full overlay with centered spinner.
 * 
 * @example
 * ```tsx
 * <div className="relative">
 *   <TableContent />
 *   {isLoading && (
 *     <SpinnerOverlay text="Loading data..." />
 *   )}
 * </div>
 * ```
 */
const SpinnerOverlay = React.forwardRef<HTMLDivElement, SpinnerOverlayProps>(
  (
    {
      className,
      size = "lg",
      variant = "primary",
      text,
      blur = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3",
          blur && "bg-background/80 backdrop-blur-sm",
          !blur && "bg-background/60",
          className
        )}
        {...props}
      >
        <Spinner size={size} variant={variant} />
        {text && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }
);

SpinnerOverlay.displayName = "SpinnerOverlay";

// =============================================================================
// LOADING DOTS
// =============================================================================

const dotsVariants = cva("flex items-center gap-1", {
  variants: {
    size: {
      sm: "gap-0.5",
      default: "gap-1",
      lg: "gap-1.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const dotVariants = cva("rounded-full bg-current animate-bounce", {
  variants: {
    size: {
      sm: "h-1 w-1",
      default: "h-1.5 w-1.5",
      lg: "h-2 w-2",
    },
    variant: {
      default: "text-muted-foreground",
      primary: "text-primary",
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

export interface LoadingDotsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dotVariants> {}

/**
 * LoadingDots - Three bouncing dots for subtle loading indication.
 * 
 * @example
 * ```tsx
 * <LoadingDots />
 * <span>Typing<LoadingDots /></span>
 * ```
 */
const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(dotsVariants({ size }), className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className={cn(dotVariants({ size, variant }))} style={{ animationDelay: "0ms" }} />
        <span className={cn(dotVariants({ size, variant }))} style={{ animationDelay: "150ms" }} />
        <span className={cn(dotVariants({ size, variant }))} style={{ animationDelay: "300ms" }} />
      </div>
    );
  }
);

LoadingDots.displayName = "LoadingDots";

export { Spinner, SpinnerOverlay, LoadingDots };

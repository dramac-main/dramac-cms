"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// =============================================================================
// PROGRESS VARIANTS
// =============================================================================

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      size: {
        xs: "h-1",
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
        xl: "h-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        danger: "bg-danger",
        info: "bg-info",
        gradient: "bg-gradient-to-r from-primary via-primary/80 to-primary",
      },
      animated: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
)

// =============================================================================
// PROGRESS COMPONENT
// =============================================================================

export interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof indicatorVariants> {
  /**
   * Progress value (0-100)
   */
  value?: number;
  /**
   * Maximum value
   * @default 100
   */
  max?: number;
  /**
   * Show percentage label
   */
  showLabel?: boolean;
  /**
   * Label position
   * @default "right"
   */
  labelPosition?: "left" | "right" | "inside" | "top";
  /**
   * Custom label formatter
   */
  formatLabel?: (value: number, max: number) => string;
  /**
   * Indeterminate state (no value, shows animated bar)
   */
  indeterminate?: boolean;
}

/**
 * Progress - An enhanced progress bar with variants, sizes, and labels.
 * 
 * @example
 * ```tsx
 * // Basic progress
 * <Progress value={45} />
 * 
 * // With label
 * <Progress value={75} showLabel labelPosition="right" />
 * 
 * // Success variant
 * <Progress value={100} variant="success" />
 * 
 * // Large with custom label
 * <Progress
 *   value={3}
 *   max={10}
 *   size="lg"
 *   showLabel
 *   formatLabel={(v, m) => `${v} of ${m} completed`}
 * />
 * 
 * // Indeterminate loading
 * <Progress indeterminate />
 * ```
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value = 0, 
  max = 100,
  size,
  variant,
  animated,
  showLabel,
  labelPosition = "right",
  formatLabel,
  indeterminate,
  ...props 
}, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const displayLabel = formatLabel 
    ? formatLabel(value, max) 
    : `${Math.round(percentage)}%`;

  // For indeterminate, we render a different animation
  if (indeterminate) {
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <div 
          className={cn(
            indicatorVariants({ variant }),
            "w-1/3 animate-[progress-indeterminate_1.5s_ease-in-out_infinite]"
          )}
        />
        <style jsx>{`
          @keyframes progress-indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </ProgressPrimitive.Root>
    );
  }

  const progressBar = (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ size }), className)}
      value={value}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(indicatorVariants({ variant, animated }))}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
      {showLabel && labelPosition === "inside" && size !== "xs" && size !== "sm" && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground mix-blend-difference">
          {displayLabel}
        </span>
      )}
    </ProgressPrimitive.Root>
  );

  // Return with external label
  if (showLabel && labelPosition !== "inside") {
    const labelElement = (
      <span className="text-sm text-muted-foreground tabular-nums">
        {displayLabel}
      </span>
    );

    if (labelPosition === "top") {
      return (
        <div className="space-y-1">
          <div className="flex justify-between">
            {labelElement}
          </div>
          {progressBar}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        {labelPosition === "left" && labelElement}
        <div className="flex-1">{progressBar}</div>
        {labelPosition === "right" && labelElement}
      </div>
    );
  }

  return progressBar;
})
Progress.displayName = ProgressPrimitive.Root.displayName

// =============================================================================
// PROGRESS WITH STAGES
// =============================================================================

export interface ProgressStage {
  label: string;
  value: number;
}

export interface StageProgressProps extends Omit<ProgressProps, 'value'> {
  /**
   * Array of stages with labels and values
   */
  stages: ProgressStage[];
  /**
   * Current stage index (0-based)
   */
  currentStage: number;
  /**
   * Show stage labels
   * @default true
   */
  showStageLabels?: boolean;
}

/**
 * StageProgress - Progress bar with labeled stages/steps.
 * 
 * @example
 * ```tsx
 * <StageProgress
 *   stages={[
 *     { label: 'Cart', value: 0 },
 *     { label: 'Shipping', value: 33 },
 *     { label: 'Payment', value: 66 },
 *     { label: 'Complete', value: 100 },
 *   ]}
 *   currentStage={2}
 * />
 * ```
 */
const StageProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  StageProgressProps
>(({ stages, currentStage, showStageLabels = true, className, ...props }, ref) => {
  const currentValue = stages[currentStage]?.value ?? 0;
  
  return (
    <div className={cn("space-y-2", className)}>
      <Progress ref={ref} value={currentValue} {...props} />
      {showStageLabels && (
        <div className="flex justify-between">
          {stages.map((stage, index) => (
            <span 
              key={stage.label}
              className={cn(
                "text-xs",
                index <= currentStage 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground"
              )}
            >
              {stage.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
StageProgress.displayName = "StageProgress";

export { Progress, StageProgress, progressVariants, indicatorVariants }

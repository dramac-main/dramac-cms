import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { mapToStatusType, getStatusClasses, type IntensityLevel } from "@/config/brand/semantic-colors";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-danger text-danger-foreground shadow hover:bg-danger/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground shadow hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80",
        info:
          "border-transparent bg-info text-info-foreground shadow hover:bg-info/80",
        muted:
          "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// =============================================================================
// STATUS BADGE
// =============================================================================

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 
   * Status string that will be auto-mapped to a semantic color.
   * Examples: 'active', 'pending', 'failed', 'completed', etc.
   */
  status: string;
  /** 
   * Color intensity level.
   * - subtle: Light background (default for badges)
   * - moderate: Medium background with border
   * - strong: Full color background
   */
  intensity?: IntensityLevel;
  /** Override the display text (defaults to the status) */
  label?: string;
}

/**
 * StatusBadge - Automatically styled badge based on status string.
 * 
 * Maps common status strings to semantic colors:
 * - Success: active, completed, confirmed, published, approved
 * - Warning: pending, scheduled, processing, draft, paused
 * - Danger: error, failed, cancelled, rejected, expired
 * - Info: new, updated, modified
 * - Neutral: everything else
 * 
 * @example
 * ```tsx
 * <StatusBadge status="active" />
 * <StatusBadge status="pending" intensity="subtle" />
 * <StatusBadge status="FAILED" label="Error" />
 * ```
 */
function StatusBadge({ 
  status, 
  intensity = 'subtle',
  label,
  className, 
  ...props 
}: StatusBadgeProps) {
  const statusType = mapToStatusType(status);
  const statusClasses = getStatusClasses(statusType, intensity);
  
  // Capitalize first letter for display
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ');
  
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusClasses,
        className
      )} 
      {...props}
    >
      {displayLabel}
    </div>
  );
}

export { Badge, StatusBadge, badgeVariants };

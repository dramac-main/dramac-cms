"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

// =============================================================================
// STAT VALUE VARIANTS
// =============================================================================

const statValueVariants = cva("font-bold tracking-tight", {
  variants: {
    size: {
      sm: "text-xl",
      default: "text-2xl",
      lg: "text-3xl",
      xl: "text-4xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const statLabelVariants = cva("text-muted-foreground", {
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
      xl: "text-lg",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// =============================================================================
// TREND INDICATOR
// =============================================================================

export type TrendDirection = "up" | "down" | "neutral";

export interface TrendProps {
  /**
   * Trend direction
   */
  direction: TrendDirection;
  /**
   * Percentage or value change
   */
  value: string | number;
  /**
   * Comparison period label (e.g., "vs last month")
   */
  label?: string;
  /**
   * Whether up is good (green) or bad (red)
   * @default true
   */
  upIsGood?: boolean;
}

const trendIconMap: Record<TrendDirection, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

/**
 * Trend - Inline trend indicator with direction and value.
 */
function Trend({ direction, value, label, upIsGood = true }: TrendProps) {
  const Icon = trendIconMap[direction];
  
  const colorClass = React.useMemo(() => {
    if (direction === "neutral") return "text-muted-foreground";
    const isPositive = direction === "up";
    const isGood = upIsGood ? isPositive : !isPositive;
    return isGood ? "text-success" : "text-danger";
  }, [direction, upIsGood]);

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", colorClass)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{typeof value === "number" ? `${value}%` : value}</span>
      {label && (
        <span className="text-muted-foreground font-normal">{label}</span>
      )}
    </span>
  );
}

// =============================================================================
// STAT COMPONENT (INLINE)
// =============================================================================

export interface StatProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statValueVariants> {
  /**
   * Label/title for the stat
   */
  label: string;
  /**
   * The main value to display
   */
  value: string | number;
  /**
   * Optional trend data
   */
  trend?: TrendProps;
  /**
   * Optional icon
   */
  icon?: LucideIcon;
  /**
   * Format function for the value
   */
  formatValue?: (value: string | number) => string;
}

/**
 * Stat - Inline stat display for embedding in layouts.
 * 
 * @example
 * ```tsx
 * <Stat
 *   label="Total Revenue"
 *   value={12450}
 *   formatValue={(v) => `K${v.toLocaleString()}`}
 *   trend={{ direction: "up", value: 12.5, label: "vs last month" }}
 * />
 * ```
 */
const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  (
    {
      className,
      size,
      label,
      value,
      trend,
      icon: Icon,
      formatValue,
      ...props
    },
    ref
  ) => {
    const displayValue = formatValue ? formatValue(value) : value;

    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          <span className={cn(statLabelVariants({ size }))}>{label}</span>
        </div>
        <div className={cn(statValueVariants({ size }))}>{displayValue}</div>
        {trend && <Trend {...trend} />}
      </div>
    );
  }
);

Stat.displayName = "Stat";

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

export interface StatCardProps extends StatProps {
  /**
   * Optional description below the value
   */
  description?: string;
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
  /**
   * Card hover effect
   */
  hover?: boolean;
}

/**
 * StatCard - A card-wrapped stat display.
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Active Users"
 *   value={1234}
 *   icon={Users}
 *   trend={{ direction: "up", value: 5.2 }}
 *   description="Users active in the last 30 days"
 *   hover
 * />
 * ```
 */
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      size,
      label,
      value,
      trend,
      icon: Icon,
      formatValue,
      description,
      footer,
      hover,
      ...props
    },
    ref
  ) => {
    const displayValue = formatValue ? formatValue(value) : value;

    return (
      <Card ref={ref} hover={hover} className={cn("", className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className={cn(statLabelVariants({ size }), "font-medium")}>
            {label}
          </CardTitle>
          {Icon && (
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className={cn(statValueVariants({ size }))}>{displayValue}</div>
          {trend && (
            <div className="mt-1">
              <Trend {...trend} />
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
          {footer && <div className="mt-4 pt-4 border-t">{footer}</div>}
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

// =============================================================================
// STAT GRID
// =============================================================================

export interface StatGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns
   * @default 4
   */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

const columnClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

/**
 * StatGrid - A responsive grid layout for stat cards.
 * 
 * @example
 * ```tsx
 * <StatGrid columns={4}>
 *   <StatCard label="Revenue" value="$12,450" />
 *   <StatCard label="Users" value={1234} />
 *   <StatCard label="Orders" value={89} />
 *   <StatCard label="Conversion" value="3.2%" />
 * </StatGrid>
 * ```
 */
const StatGrid = React.forwardRef<HTMLDivElement, StatGridProps>(
  ({ className, columns = 4, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("grid gap-4", columnClasses[columns], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

StatGrid.displayName = "StatGrid";

export { Stat, StatCard, StatGrid, Trend };

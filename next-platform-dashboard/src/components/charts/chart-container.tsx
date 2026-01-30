"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// CHART CONTAINER
// =============================================================================

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Height of the chart
   */
  height?: number | string;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Error state
   */
  error?: string | null;
  /**
   * No data state
   */
  noData?: boolean;
  /**
   * No data message
   */
  noDataMessage?: string;
}

/**
 * ChartContainer - Wrapper for responsive charts with loading/error/empty states.
 * 
 * @example
 * ```tsx
 * <ChartContainer height={300} loading={isLoading}>
 *   <AreaChart data={data}>...</AreaChart>
 * </ChartContainer>
 * ```
 */
const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({
    className,
    height = 300,
    loading = false,
    error = null,
    noData = false,
    noDataMessage = "No data available",
    children,
    ...props
  }, ref) => {
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn("relative", className)}
          style={{ height }}
          {...props}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-3 w-full px-4">
              <Skeleton className="h-full w-full absolute inset-0" />
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative flex items-center justify-center text-center",
            className
          )}
          style={{ height }}
          {...props}
        >
          <div className="text-muted-foreground">
            <p className="text-sm font-medium text-destructive">Failed to load chart</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (noData) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative flex items-center justify-center text-center",
            className
          )}
          style={{ height }}
          {...props}
        >
          <p className="text-sm text-muted-foreground">{noDataMessage}</p>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        style={{ height }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    );
  }
);

ChartContainer.displayName = "ChartContainer";

// =============================================================================
// CHART TOOLTIP
// =============================================================================

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number, name: string) => string;
}

/**
 * ChartTooltip - Consistent tooltip styling for charts.
 */
function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(String(label)) : label;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[120px]">
      {formattedLabel && (
        <p className="text-sm font-medium mb-2">{formattedLabel}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = valueFormatter
            ? valueFormatter(entry.value, entry.name)
            : entry.value.toLocaleString();
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {entry.color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                )}
                <span className="text-xs text-muted-foreground">{entry.name}</span>
              </div>
              <span className="text-xs font-medium tabular-nums">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// CHART LEGEND
// =============================================================================

export interface ChartLegendItem {
  name: string;
  color: string;
  value?: number | string;
}

export interface ChartLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ChartLegendItem[];
  direction?: "horizontal" | "vertical";
}

/**
 * ChartLegend - Consistent legend for charts.
 */
function ChartLegend({
  items,
  direction = "horizontal",
  className,
  ...props
}: ChartLegendProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-4",
        direction === "vertical" && "flex-col gap-2",
        className
      )}
      {...props}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">{item.name}</span>
          {item.value !== undefined && (
            <span className="text-xs font-medium">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartLegend };

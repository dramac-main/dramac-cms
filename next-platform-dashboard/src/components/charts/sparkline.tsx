"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// =============================================================================
// SPARKLINE
// =============================================================================

export interface SparklineDataPoint {
  value: number;
}

export interface SparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Data points (just values)
   */
  data: number[] | SparklineDataPoint[];
  /**
   * Chart type
   */
  type?: "line" | "area";
  /**
   * Chart height
   */
  height?: number;
  /**
   * Chart width
   */
  width?: number | string;
  /**
   * Line/fill color
   */
  color?: string;
  /**
   * Show trend arrow
   */
  showTrend?: boolean;
  /**
   * Trend direction override
   */
  trend?: "up" | "down" | "neutral";
}

/**
 * Sparkline - Inline mini chart for stats display.
 * 
 * @example
 * ```tsx
 * <Sparkline data={[10, 20, 15, 30, 25, 35]} color="#22c55e" showTrend />
 * ```
 */
const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  ({
    className,
    data,
    type = "line",
    height = 32,
    width = 80,
    color = "currentColor",
    showTrend = false,
    trend: trendOverride,
    ...props
  }, ref) => {
    // Normalize data to array of objects
    const normalizedData = data.map((d, i) => ({
      index: i,
      value: typeof d === "number" ? d : d.value,
    }));

    // Calculate trend if not overridden
    const calculatedTrend = React.useMemo(() => {
      if (trendOverride) return trendOverride;
      if (normalizedData.length < 2) return "neutral";
      const first = normalizedData[0].value;
      const last = normalizedData[normalizedData.length - 1].value;
      if (last > first) return "up";
      if (last < first) return "down";
      return "neutral";
    }, [normalizedData, trendOverride]);

    const trendColors = {
      up: "text-emerald-500",
      down: "text-red-500",
      neutral: "text-muted-foreground",
    };

    const TrendIcon = {
      up: TrendingUp,
      down: TrendingDown,
      neutral: Minus,
    }[calculatedTrend];

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div style={{ width, height }} className="shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            {type === "area" ? (
              <AreaChart data={normalizedData}>
                <defs>
                  <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#sparkline-gradient-${color})`}
                />
              </AreaChart>
            ) : (
              <LineChart data={normalizedData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {showTrend && (
          <TrendIcon className={cn("h-4 w-4", trendColors[calculatedTrend])} />
        )}
      </div>
    );
  }
);

Sparkline.displayName = "Sparkline";

// =============================================================================
// MINI AREA CHART
// =============================================================================

export interface MiniAreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[];
  color?: string;
  height?: number;
  gradient?: boolean;
}

/**
 * MiniAreaChart - Compact area chart for cards.
 */
const MiniAreaChart = React.forwardRef<HTMLDivElement, MiniAreaChartProps>(
  ({
    className,
    data,
    color = "#8884d8",
    height = 60,
    gradient = true,
    ...props
  }, ref) => {
    const chartData = data.map((value, index) => ({ index, value }));
    const gradientId = `mini-area-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        style={{ height }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            {gradient && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={gradient ? `url(#${gradientId})` : color}
              fillOpacity={gradient ? 1 : 0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

MiniAreaChart.displayName = "MiniAreaChart";

// =============================================================================
// TREND LINE
// =============================================================================

export interface TrendLineProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  previousValue?: number;
  label?: string;
  format?: (value: number) => string;
  reverseColors?: boolean;
}

/**
 * TrendLine - Trend indicator with value and direction.
 */
const TrendLine = React.forwardRef<HTMLDivElement, TrendLineProps>(
  ({
    className,
    value,
    previousValue,
    label,
    format = (v) => v.toLocaleString(),
    reverseColors = false,
    ...props
  }, ref) => {
    const change = previousValue !== undefined ? value - previousValue : 0;
    const percentChange = previousValue && previousValue !== 0
      ? ((change / previousValue) * 100).toFixed(1)
      : null;

    const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";
    
    const colors = reverseColors
      ? { up: "text-red-500", down: "text-emerald-500", neutral: "text-muted-foreground" }
      : { up: "text-emerald-500", down: "text-red-500", neutral: "text-muted-foreground" };

    const TrendIcon = {
      up: TrendingUp,
      down: TrendingDown,
      neutral: Minus,
    }[trend];

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <div className={cn("flex items-center gap-1", colors[trend])}>
          <TrendIcon className="h-4 w-4" />
          {percentChange !== null && (
            <span className="text-xs font-medium">
              {trend === "up" ? "+" : ""}{percentChange}%
            </span>
          )}
        </div>
      </div>
    );
  }
);

TrendLine.displayName = "TrendLine";

export { Sparkline, MiniAreaChart, TrendLine };

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Sparkline, MiniAreaChart } from "./sparkline";
import { motion } from "framer-motion";

// =============================================================================
// METRIC CARD
// =============================================================================

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Metric title/label
   */
  title: string;
  /**
   * Current value
   */
  value: string | number;
  /**
   * Previous period value for comparison
   */
  previousValue?: number;
  /**
   * Description or context
   */
  description?: string;
  /**
   * Icon to display
   */
  icon?: LucideIcon;
  /**
   * Icon background color
   */
  iconBg?: string;
  /**
   * Icon color
   */
  iconColor?: string;
  /**
   * Sparkline data
   */
  sparklineData?: number[];
  /**
   * Sparkline color
   */
  sparklineColor?: string;
  /**
   * Show as area chart instead of line
   */
  showAreaChart?: boolean;
  /**
   * Format for percentage change
   */
  changeFormat?: (change: number) => string;
  /**
   * Info tooltip content
   */
  info?: string;
  /**
   * Reverse trend colors (up = bad, down = good)
   */
  reverseTrend?: boolean;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Animate on mount
   */
  animated?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * MetricCard - Enhanced stat card with optional chart and trend.
 * 
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Revenue"
 *   value="$12,450"
 *   previousValue={10500}
 *   icon={DollarSign}
 *   iconBg="bg-emerald-100"
 *   iconColor="text-emerald-600"
 *   sparklineData={[100, 120, 115, 140, 150, 145, 160]}
 *   sparklineColor="#22c55e"
 * />
 * ```
 */
const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({
    className,
    title,
    value,
    previousValue,
    description,
    icon: Icon,
    iconBg = "bg-muted",
    iconColor = "text-muted-foreground",
    sparklineData,
    sparklineColor = "#8884d8",
    showAreaChart = false,
    changeFormat,
    info,
    reverseTrend = false,
    loading = false,
    animated = true,
    ...props
  }, ref) => {
    // Calculate trend
    const currentNumericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    const change = previousValue !== undefined && !isNaN(currentNumericValue)
      ? currentNumericValue - previousValue
      : null;
    const percentChange = change !== null && previousValue && previousValue !== 0
      ? (change / previousValue) * 100
      : null;

    const trend = change !== null
      ? change > 0 ? "up" : change < 0 ? "down" : "neutral"
      : null;

    const trendColors = reverseTrend
      ? { up: "text-red-500", down: "text-emerald-500", neutral: "text-muted-foreground" }
      : { up: "text-emerald-500", down: "text-red-500", neutral: "text-muted-foreground" };

    const TrendIcon = trend
      ? { up: TrendingUp, down: TrendingDown, neutral: Minus }[trend]
      : null;

    const Wrapper = animated ? motion.div : "div";
    const wrapperProps = animated ? { variants: itemVariants } : {};

    if (loading) {
      return (
        <Card className={cn("relative overflow-hidden", className)} ref={ref} {...props}>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Wrapper ref={ref as React.Ref<HTMLDivElement>} {...wrapperProps}>
        <Card 
          className={cn(
            "relative overflow-hidden transition-shadow duration-200 hover:shadow-md",
            className
          )} 
          {...props}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                {info && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="text-xs">{info}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {description && (
                <CardDescription className="text-xs">{description}</CardDescription>
              )}
            </div>
            {Icon && (
              <div className={cn("p-2 rounded-lg", iconBg)}>
                <Icon className={cn("h-4 w-4", iconColor)} />
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold tabular-nums">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </div>
                
                {trend && TrendIcon && percentChange !== null && (
                  <div className={cn("flex items-center gap-1 text-xs", trendColors[trend])}>
                    <TrendIcon className="h-3 w-3" />
                    <span className="font-medium">
                      {changeFormat
                        ? changeFormat(change!)
                        : `${trend === "up" ? "+" : ""}${percentChange.toFixed(1)}%`}
                    </span>
                    <span className="text-muted-foreground">vs prev</span>
                  </div>
                )}
              </div>

              {sparklineData && sparklineData.length > 0 && (
                <div className="shrink-0">
                  {showAreaChart ? (
                    <MiniAreaChart
                      data={sparklineData}
                      color={sparklineColor}
                      height={40}
                    />
                  ) : (
                    <Sparkline
                      data={sparklineData}
                      color={sparklineColor}
                      height={32}
                      width={80}
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }
);

MetricCard.displayName = "MetricCard";

// =============================================================================
// COMPARISON CARD
// =============================================================================

export interface ComparisonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  items: Array<{
    label: string;
    value: number | string;
    color?: string;
    icon?: LucideIcon;
  }>;
  description?: string;
  showPercentages?: boolean;
}

/**
 * ComparisonCard - Side-by-side metric comparison.
 */
const ComparisonCard = React.forwardRef<HTMLDivElement, ComparisonCardProps>(
  ({ className, title, items, description, showPercentages = true, ...props }, ref) => {
    const total = items.reduce((sum, item) => {
      const val = typeof item.value === "number" ? item.value : parseFloat(String(item.value));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return (
      <Card className={cn(className)} ref={ref} {...props}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => {
              const numValue = typeof item.value === "number" 
                ? item.value 
                : parseFloat(String(item.value));
              const percentage = total > 0 && !isNaN(numValue) 
                ? (numValue / total) * 100 
                : 0;
              const Icon = item.icon;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                      </span>
                      {showPercentages && (
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color || "#8884d8",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ComparisonCard.displayName = "ComparisonCard";

export { MetricCard, ComparisonCard };

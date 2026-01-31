"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  MousePointerClick,
  Clock,
  Percent,
  Target,
  Zap,
  BarChart3,
  LucideIcon,
} from "lucide-react";
import { StatWidgetData, ChartDataPoint } from "@/types/dashboard-widgets";

// Icon mapping for common metric types
const METRIC_ICONS: Record<string, LucideIcon> = {
  revenue: DollarSign,
  sales: ShoppingCart,
  users: Users,
  visitors: Eye,
  clicks: MousePointerClick,
  time: Clock,
  rate: Percent,
  goal: Target,
  performance: Zap,
  activity: Activity,
  chart: BarChart3,
};

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: keyof typeof METRIC_ICONS | LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendIsGood?: boolean;
  sparklineData?: number[];
  subtitle?: string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "outlined" | "minimal";
}

// Mini sparkline using SVG
function MiniSparkline({
  data,
  color = "currentColor",
  height = 24,
  width = 60,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor,
  trend,
  trendIsGood = true,
  sparklineData,
  subtitle,
  loading = false,
  className,
  onClick,
  size = "md",
  variant = "default",
}: MetricCardProps) {
  // Determine trend from change if not provided
  const actualTrend = trend || (change ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : undefined);
  
  // Determine if trend is positive visually
  const isPositiveTrend = trendIsGood ? actualTrend === "up" : actualTrend === "down";
  const isNegativeTrend = trendIsGood ? actualTrend === "down" : actualTrend === "up";

  // Get icon component
  const IconComponent = typeof icon === "string" ? METRIC_ICONS[icon] : icon;

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const valueSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const variantClasses = {
    default: "bg-card hover:bg-accent/50",
    gradient: "bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10",
    outlined: "bg-transparent border-2 hover:border-primary/50",
    minimal: "bg-transparent hover:bg-accent/30",
  };

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-lg border transition-all duration-200",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        "rounded-lg border transition-all duration-200",
        sizeClasses[size],
        variantClasses[variant],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>

          {/* Value */}
          <p className={cn("font-bold mt-1", valueSizeClasses[size])}>
            {value}
          </p>

          {/* Change indicator */}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {actualTrend === "up" && (
                <ArrowUpRight
                  className={cn(
                    "w-4 h-4",
                    isPositiveTrend ? "text-green-500" : "text-red-500"
                  )}
                />
              )}
              {actualTrend === "down" && (
                <ArrowDownRight
                  className={cn(
                    "w-4 h-4",
                    isNegativeTrend ? "text-red-500" : "text-green-500"
                  )}
                />
              )}
              {actualTrend === "neutral" && (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositiveTrend && "text-green-500",
                  isNegativeTrend && "text-red-500",
                  actualTrend === "neutral" && "text-muted-foreground"
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {/* Right side: Icon or Sparkline */}
        <div className="flex flex-col items-end gap-2">
          {IconComponent && (
            <div
              className={cn(
                "p-2 rounded-lg",
                iconColor || "bg-primary/10 text-primary"
              )}
            >
              <IconComponent className="w-5 h-5" />
            </div>
          )}
          {sparklineData && sparklineData.length > 1 && (
            <MiniSparkline
              data={sparklineData}
              color={
                isPositiveTrend
                  ? "rgb(34, 197, 94)"
                  : isNegativeTrend
                  ? "rgb(239, 68, 68)"
                  : "currentColor"
              }
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Metrics Grid Component
export interface MetricsGridProps {
  metrics: (MetricCardProps & { id: string })[];
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
}

export function MetricsGrid({
  metrics,
  columns = 4,
  gap = "md",
  loading = false,
  className,
}: MetricsGridProps) {
  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  if (loading) {
    return (
      <div className={cn("grid", columnClasses[columns], gapClasses[gap], className)}>
        {Array.from({ length: columns }).map((_, i) => (
          <MetricCard key={i} title="" value="" loading={true} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid", columnClasses[columns], gapClasses[gap], className)}>
      <AnimatePresence mode="popLayout">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Pre-configured metric cards for common use cases
export function RevenueMetric({
  value,
  change,
  sparklineData,
  ...props
}: Omit<MetricCardProps, "title" | "icon">) {
  return (
    <MetricCard
      title="Total Revenue"
      icon="revenue"
      iconColor="bg-green-500/10 text-green-500"
      value={value}
      change={change}
      sparklineData={sparklineData}
      {...props}
    />
  );
}

export function UsersMetric({
  value,
  change,
  sparklineData,
  ...props
}: Omit<MetricCardProps, "title" | "icon">) {
  return (
    <MetricCard
      title="Active Users"
      icon="users"
      iconColor="bg-blue-500/10 text-blue-500"
      value={value}
      change={change}
      sparklineData={sparklineData}
      {...props}
    />
  );
}

export function ConversionMetric({
  value,
  change,
  sparklineData,
  ...props
}: Omit<MetricCardProps, "title" | "icon">) {
  return (
    <MetricCard
      title="Conversion Rate"
      icon="rate"
      iconColor="bg-purple-500/10 text-purple-500"
      value={value}
      change={change}
      sparklineData={sparklineData}
      {...props}
    />
  );
}

export function OrdersMetric({
  value,
  change,
  sparklineData,
  ...props
}: Omit<MetricCardProps, "title" | "icon">) {
  return (
    <MetricCard
      title="Total Orders"
      icon="sales"
      iconColor="bg-orange-500/10 text-orange-500"
      value={value}
      change={change}
      sparklineData={sparklineData}
      {...props}
    />
  );
}

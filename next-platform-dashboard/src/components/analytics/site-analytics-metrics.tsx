"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Users,
  Timer,
  TrendingDown,
  FileText,
  UserPlus,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import type { SiteOverviewMetrics, AnalyticsMetric } from "@/types/site-analytics";

import { DEFAULT_LOCALE } from '@/lib/locale-config'
interface AnalyticsMetricCardProps {
  title: string;
  metric: AnalyticsMetric;
  format?: "number" | "percentage" | "duration" | "decimal";
  icon?: React.ReactNode;
  iconBg?: string;
  invertTrend?: boolean; // For metrics where down is good (bounce rate)
  loading?: boolean;
}

// Format duration in seconds to human readable
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

// Format number with commas
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(Math.round(value));
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Format decimal
function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function formatMetricValue(
  value: number,
  format: AnalyticsMetricCardProps["format"]
): string {
  switch (format) {
    case "percentage":
      return formatPercentage(value);
    case "duration":
      return formatDuration(value);
    case "decimal":
      return formatDecimal(value);
    case "number":
    default:
      return formatNumber(value);
  }
}

export function AnalyticsMetricCard({
  title,
  metric,
  format = "number",
  icon,
  iconBg = "bg-primary/10",
  invertTrend = false,
  loading = false,
}: AnalyticsMetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine if trend is positive (green) or negative (red)
  const isPositiveTrend = invertTrend
    ? metric.trend === "down"
    : metric.trend === "up";

  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">
              {formatMetricValue(metric.value, format)}
            </p>
            {metric.changePercent !== undefined && (
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                    isPositiveTrend
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : metric.trend === "neutral"
                        ? "bg-muted text-muted-foreground"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(metric.changePercent).toFixed(1)}%
                </div>
                <span className="text-xs text-muted-foreground">vs previous</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("rounded-lg p-3", iconBg)}>{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SiteAnalyticsMetricsProps {
  metrics: SiteOverviewMetrics | null;
  loading?: boolean;
  className?: string;
}

export function SiteAnalyticsMetrics({
  metrics,
  loading = false,
  className,
}: SiteAnalyticsMetricsProps) {
  const metricsConfig = [
    {
      key: "pageViews",
      title: "Page Views",
      icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      format: "number" as const,
    },
    {
      key: "uniqueVisitors",
      title: "Unique Visitors",
      icon: <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      format: "number" as const,
    },
    {
      key: "bounceRate",
      title: "Bounce Rate",
      icon: <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      format: "percentage" as const,
      invertTrend: true,
    },
    {
      key: "avgSessionDuration",
      title: "Avg. Session Duration",
      icon: <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      format: "duration" as const,
    },
    {
      key: "pagesPerSession",
      title: "Pages / Session",
      icon: <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      format: "decimal" as const,
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-5", className)}>
      {metricsConfig.map((config) => (
        <AnalyticsMetricCard
          key={config.key}
          title={config.title}
          metric={
            metrics
              ? (metrics[config.key as keyof SiteOverviewMetrics] as AnalyticsMetric)
              : { value: 0, trend: "neutral" }
          }
          format={config.format}
          icon={config.icon}
          iconBg={config.iconBg}
          invertTrend={config.invertTrend}
          loading={loading}
        />
      ))}
    </div>
  );
}

interface NewVsReturningCardProps {
  newVisitors: number;
  returningVisitors: number;
  loading?: boolean;
  className?: string;
}

export function NewVsReturningCard({
  newVisitors,
  returningVisitors,
  loading = false,
  className,
}: NewVsReturningCardProps) {
  const total = newVisitors + returningVisitors;
  const newPercent = total > 0 ? (newVisitors / total) * 100 : 50;
  const returningPercent = total > 0 ? (returningVisitors / total) * 100 : 50;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          New vs Returning Visitors
        </p>
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">New</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(newVisitors)}</p>
            <p className="text-sm text-muted-foreground">
              {newPercent.toFixed(1)}%
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">Returning</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(returningVisitors)}</p>
            <p className="text-sm text-muted-foreground">
              {returningPercent.toFixed(1)}%
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden flex">
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${newPercent}%` }}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${returningPercent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

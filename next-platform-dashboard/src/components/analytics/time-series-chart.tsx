"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaChartWidget, LineChartWidget } from "@/components/dashboard/widgets";
import type { TimeSeriesDataPoint, AnalyticsTimeRange } from "@/types/site-analytics";
import { formatNumber } from "./site-analytics-metrics";

type MetricKey = "visitors" | "pageViews" | "bounceRate" | "avgSessionDuration";

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  loading?: boolean;
  className?: string;
  title?: string;
  metric?: MetricKey;
  onMetricChange?: (metric: MetricKey) => void;
  timeRange?: AnalyticsTimeRange;
  onTimeRangeChange?: (range: AnalyticsTimeRange) => void;
  showComparison?: boolean;
  comparisonData?: TimeSeriesDataPoint[];
}

const metricLabels: Record<MetricKey, string> = {
  visitors: "Visitors",
  pageViews: "Page Views",
  bounceRate: "Bounce Rate",
  avgSessionDuration: "Avg. Session",
};

const metricColors: Record<MetricKey, string> = {
  visitors: "hsl(221, 83%, 53%)",
  pageViews: "hsl(142, 76%, 36%)",
  bounceRate: "hsl(0, 84%, 60%)",
  avgSessionDuration: "hsl(262, 83%, 58%)",
};

const timeRangeLabels: Record<AnalyticsTimeRange, string> = {
  "24h": "Last 24 Hours",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "12m": "Last 12 Months",
  "1y": "Last Year",
  "custom": "Custom Range",
};

export function TimeSeriesChart({
  data,
  loading = false,
  className,
  title = "Traffic Over Time",
  metric = "visitors",
  onMetricChange,
  timeRange = "7d",
  onTimeRangeChange,
  showComparison = false,
  comparisonData,
}: TimeSeriesChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[120px]" />
            <Skeleton className="h-9 w-[140px]" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    label: formatDateLabel(point.date, timeRange),
    value: getMetricValue(point, metric),
    [metric]: getMetricValue(point, metric),
  }));

  const formatValue = (v: number) => {
    if (metric === "bounceRate") return `${v.toFixed(1)}%`;
    if (metric === "avgSessionDuration") return formatDuration(v);
    return formatNumber(v);
  };

  // Calculate trend
  const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
  const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
  const firstAvg = firstHalf.reduce((sum, d) => sum + (d[metric] as number), 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((sum, d) => sum + (d[metric] as number), 0) / (secondHalf.length || 1);
  const trendPercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  const isPositive = metric === "bounceRate" ? trendPercent < 0 : trendPercent > 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge
            variant={isPositive ? "default" : "secondary"}
            className={cn(
              "text-xs",
              isPositive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            )}
          >
            {trendPercent > 0 ? "+" : ""}
            {trendPercent.toFixed(1)}%
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onMetricChange && (
            <Select value={metric} onValueChange={(v) => onMetricChange(v as MetricKey)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(metricLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onTimeRangeChange && (
            <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as AnalyticsTimeRange)}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeRangeLabels)
                  .filter(([key]) => key !== "custom" && key !== "1y")
                  .map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AreaChartWidget
          data={chartData}
          dataKeys={[metric]}
          height={300}
          colors={[metricColors[metric]]}
          formatTooltip={formatValue}
          gradients
          showLegend={false}
        />
      </CardContent>
    </Card>
  );
}

function formatDateLabel(dateStr: string, range: AnalyticsTimeRange): string {
  // The date is already formatted from the server
  return dateStr;
}

function getMetricValue(point: TimeSeriesDataPoint, metric: MetricKey): number {
  switch (metric) {
    case "visitors":
      return point.visitors;
    case "pageViews":
      return point.pageViews;
    case "bounceRate":
      return point.bounceRate;
    case "avgSessionDuration":
      return point.avgSessionDuration;
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

interface MultiMetricChartProps {
  data: TimeSeriesDataPoint[];
  loading?: boolean;
  className?: string;
  metrics?: MetricKey[];
}

export function MultiMetricChart({
  data,
  loading = false,
  className,
  metrics = ["visitors", "pageViews"],
}: MultiMetricChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for multi-line chart
  const chartData = data.map((point) => ({
    label: point.date,
    value: getMetricValue(point, metrics[0]),
    ...Object.fromEntries(metrics.map((m) => [m, getMetricValue(point, m)])),
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Metrics Comparison</CardTitle>
          <div className="flex items-center gap-3">
            {metrics.map((m) => (
              <div key={m} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: metricColors[m] }}
                />
                <span className="text-xs text-muted-foreground">{metricLabels[m]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <LineChartWidget
          data={chartData}
          dataKeys={metrics}
          height={300}
          colors={metrics.map((m) => metricColors[m])}
          formatTooltip={(v: number) => formatNumber(v)}
        />
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * CRM Revenue Metrics Component
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Displays revenue metrics, trends, forecasts, and owner performance
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type {
  RevenueMetrics,
  RevenueByMonth,
  RevenueByOwner,
  RevenueForecast,
} from "@/types/crm-analytics";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  const s = DEFAULT_CURRENCY_SYMBOL;
  if (value >= 1000000) {
    return `${s}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${s}${(value / 1000).toFixed(0)}K`;
  }
  return `${s}${value.toFixed(0)}`;
}

const CHART_COLORS = {
  won: "hsl(142.1 76.2% 36.3%)",
  lost: "hsl(0 84.2% 60.2%)",
  projected: "hsl(var(--chart-3))",
  target: "hsl(var(--chart-4))",
  committed: "hsl(var(--chart-1))",
  upside: "hsl(var(--chart-2))",
  pipeline: "hsl(var(--chart-5))",
};

// ============================================================================
// REVENUE METRICS CARDS
// ============================================================================

interface RevenueMetricsCardsProps {
  data: RevenueMetrics;
  className?: string;
}

export function RevenueMetricsCards({ data, className }: RevenueMetricsCardsProps) {
  const metrics = [
    {
      label: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      trend: data.revenueTrend,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Avg Deal Value",
      value: formatCurrency(data.avgDealValue),
      trend: data.avgDealValueTrend,
      icon: Wallet,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(data.pipeline),
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Projected",
      value: formatCurrency(data.projectedRevenue),
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", metric.bgColor)}>
              <metric.icon className={cn("h-4 w-4", metric.color)} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">{metric.value}</p>
                {metric.trend !== undefined && (
                  <Badge
                    variant={metric.trend >= 0 ? "default" : "destructive"}
                    className="text-xs h-5"
                  >
                    {metric.trend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metric.trend)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// REVENUE BY MONTH CHART
// ============================================================================

interface RevenueByMonthChartProps {
  data: RevenueByMonth[];
  className?: string;
}

export function RevenueByMonthChart({ data, className }: RevenueByMonthChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Revenue by Month</CardTitle>
        <p className="text-xs text-muted-foreground">
          Won vs lost revenue with targets
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)}
              />
              <Legend />
              <Bar
                dataKey="won"
                name="Won"
                fill={CHART_COLORS.won}
                radius={[4, 4, 0, 0]}
                stackId="revenue"
              />
              <Bar
                dataKey="lost"
                name="Lost"
                fill={CHART_COLORS.lost}
                radius={[4, 4, 0, 0]}
                stackId="lost"
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke={CHART_COLORS.target}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REVENUE TREND CHART
// ============================================================================

interface RevenueTrendChartProps {
  data: RevenueByMonth[];
  className?: string;
}

export function RevenueTrendChart({ data, className }: RevenueTrendChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWonRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.won} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.won} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)}
              />
              <Area
                type="monotone"
                dataKey="won"
                name="Revenue"
                stroke={CHART_COLORS.won}
                fill="url(#colorWonRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REVENUE BY OWNER
// ============================================================================

interface RevenueByOwnerChartProps {
  data: RevenueByOwner[];
  className?: string;
}

export function RevenueByOwnerChart({ data, className }: RevenueByOwnerChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Revenue by Owner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((owner, index) => (
            <div key={owner.ownerId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {owner.ownerAvatar || owner.ownerName.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{owner.ownerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {owner.deals} deals · {owner.winRate}% win rate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(owner.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(owner.avgDealSize)}
                  </p>
                </div>
              </div>
              <Progress
                value={(owner.revenue / maxRevenue) * 100}
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REVENUE FORECAST
// ============================================================================

interface RevenueForecastChartProps {
  data: RevenueForecast[];
  className?: string;
}

export function RevenueForecastChart({ data, className }: RevenueForecastChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Revenue Forecast</CardTitle>
        <p className="text-xs text-muted-foreground">
          Next 3 months projection
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)}
              />
              <Legend />
              <Bar
                dataKey="committed"
                name="Committed"
                fill={CHART_COLORS.committed}
                stackId="forecast"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="upside"
                name="Upside"
                fill={CHART_COLORS.upside}
                stackId="forecast"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="pipeline"
                name="Pipeline"
                fill={CHART_COLORS.pipeline}
                stackId="forecast"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          {data.map((month) => (
            <div key={month.month} className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium">{month.month}</p>
              <p className="text-lg font-bold">
                {formatCurrency(month.committed + month.upside + month.pipeline)}
              </p>
              <p className="text-xs text-muted-foreground">
                Target: {formatCurrency(month.target)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REVENUE SUMMARY CARD
// ============================================================================

interface RevenueSummaryCardProps {
  metrics: RevenueMetrics;
  className?: string;
}

export function RevenueSummaryCard({ metrics, className }: RevenueSummaryCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-green-500/10 rounded-xl">
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            <div className="flex items-center gap-2 mt-1">
              {metrics.revenueTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  metrics.revenueTrend >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {metrics.revenueTrend >= 0 ? "+" : ""}
                {metrics.revenueTrend}% vs last period
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.wonThisPeriod)}
            </p>
            <p className="text-xs text-muted-foreground">Won This Period</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.lostThisPeriod)}
            </p>
            <p className="text-xs text-muted-foreground">Lost This Period</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(metrics.pipeline)}
            </p>
            <p className="text-xs text-muted-foreground">Pipeline</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(metrics.projectedRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">Projected</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

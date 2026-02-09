"use client";

/**
 * Error Analytics Components
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Components for displaying error metrics and trends
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_LOCALE } from '@/lib/locale-config'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Bug,
  Shield,
} from "lucide-react";
import type {
  ErrorMetrics,
  ErrorsByType,
  ErrorTrend,
  RecentError,
} from "@/types/automation-analytics";

// ============================================================================
// ERROR METRICS CARDS
// ============================================================================

interface ErrorMetricsCardsProps {
  data: ErrorMetrics;
}

export function ErrorMetricsCards({ data }: ErrorMetricsCardsProps) {
  const cards = [
    {
      title: "Total Errors",
      value: data.totalErrors,
      change: data.totalErrorsChange,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      invertChange: true,
    },
    {
      title: "Unique Errors",
      value: data.uniqueErrors,
      change: data.uniqueErrorsChange,
      icon: Bug,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      invertChange: true,
    },
    {
      title: "Avg Errors/Day",
      value: data.avgErrorsPerDay.toFixed(1),
      change: data.avgErrorsPerDayChange,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      invertChange: true,
    },
    {
      title: "Resolution Rate",
      value: `${data.errorResolutionRate}%`,
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.invertChange
          ? (card.change ?? 0) < 0
          : (card.change ?? 0) >= 0;

        return (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold">{card.value}</p>
                  {card.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingDown className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={`text-xs ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// ERRORS BY TYPE PIE CHART
// ============================================================================

interface ErrorsByTypeChartProps {
  data: ErrorsByType[];
  title?: string;
  description?: string;
}

export function ErrorsByTypeChart({
  data,
  title = "Errors by Type",
  description = "Distribution of error types",
}: ErrorsByTypeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
              nameKey="errorType"
              label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [typeof value === 'number' ? value : 0, "Errors"]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ERRORS BY TYPE BAR CHART
// ============================================================================

interface ErrorsByTypeBarChartProps {
  data: ErrorsByType[];
  title?: string;
  description?: string;
}

export function ErrorsByTypeBarChart({
  data,
  title = "Error Distribution",
  description = "Number of errors by type",
}: ErrorsByTypeBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis
              dataKey="errorType"
              type="category"
              width={120}
              className="text-xs"
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" name="Errors" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ERROR TREND CHART
// ============================================================================

interface ErrorTrendChartProps {
  data: ErrorTrend[];
  title?: string;
  description?: string;
}

export function ErrorTrendChart({
  data,
  title = "Error Trend",
  description = "Errors over time",
}: ErrorTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(DEFAULT_LOCALE, {
                  month: "short",
                  day: "numeric",
                })
              }
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="errors"
              stroke="#EF4444"
              fill="url(#colorErrors)"
              name="Total Errors"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              stroke="#10B981"
              fill="url(#colorResolved)"
              name="Resolved"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// RECENT ERRORS LIST
// ============================================================================

interface RecentErrorsListProps {
  data: RecentError[];
  title?: string;
  description?: string;
}

export function RecentErrorsList({
  data,
  title = "Recent Errors",
  description = "Latest execution errors",
}: RecentErrorsListProps) {
  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((error) => (
            <div
              key={error.executionId}
              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="mt-0.5">
                {error.isResolved ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {error.workflowName}
                  </span>
                  <Badge
                    variant="secondary"
                    className={
                      error.isResolved
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {error.isResolved ? "Resolved" : "Unresolved"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {error.errorMessage}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{error.errorType}</Badge>
                  {error.stepName && (
                    <span>• Step: {error.stepName}</span>
                  )}
                  <span>• {getTimeSince(error.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AFFECTED WORKFLOWS LIST
// ============================================================================

interface AffectedWorkflowsListProps {
  data: ErrorsByType[];
  title?: string;
  description?: string;
}

export function AffectedWorkflowsList({
  data,
  title = "Affected Workflows",
  description = "Workflows affected by each error type",
}: AffectedWorkflowsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((error) => (
            <div
              key={error.errorType}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: error.color }}
                />
                <div>
                  <p className="font-medium text-sm">{error.errorType}</p>
                  <p className="text-xs text-muted-foreground">
                    {error.count} occurrences
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{error.affectedWorkflows}</p>
                <p className="text-xs text-muted-foreground">workflows affected</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ERROR SUMMARY COMPACT
// ============================================================================

interface ErrorSummaryCompactProps {
  data: ErrorMetrics;
}

export function ErrorSummaryCompact({ data }: ErrorSummaryCompactProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Summary</CardTitle>
        <CardDescription>Quick overview of error statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Total Errors</span>
            <span className="font-semibold text-red-600">{data.totalErrors}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Unique Types</span>
            <span className="font-semibold">{data.uniqueErrors}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Avg/Day</span>
            <span className="font-semibold">{data.avgErrorsPerDay.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Most Common</span>
            <span className="font-semibold text-amber-600 text-right truncate max-w-[120px]">
              {data.mostCommonError}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Most Affected</span>
            <span className="font-semibold text-red-600 text-right truncate max-w-[120px]">
              {data.mostAffectedWorkflow}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Resolution Rate</span>
            <span className="font-semibold text-green-600">
              {data.errorResolutionRate}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Execution Metrics Components
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Components for displaying execution overview and trends
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
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
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Timer,
} from "lucide-react";
import type { ExecutionOverview, ExecutionTrend, ExecutionsByStatus } from "@/types/automation-analytics";

// ============================================================================
// EXECUTION OVERVIEW CARDS
// ============================================================================

interface ExecutionOverviewCardsProps {
  data: ExecutionOverview;
}

export function ExecutionOverviewCards({ data }: ExecutionOverviewCardsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const cards = [
    {
      title: "Total Executions",
      value: formatNumber(data.totalExecutions),
      change: data.totalExecutionsChange,
      icon: PlayCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Successful",
      value: formatNumber(data.successfulExecutions),
      change: data.successfulExecutionsChange,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Failed",
      value: formatNumber(data.failedExecutions),
      change: data.failedExecutionsChange,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      invertChange: true,
    },
    {
      title: "Success Rate",
      value: `${data.successRate}%`,
      change: data.successRateChange,
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Avg Duration",
      value: formatDuration(data.avgExecutionTime),
      change: data.avgExecutionTimeChange,
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      invertChange: true,
    },
    {
      title: "Pending",
      value: formatNumber(data.pendingExecutions),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                  <p className="text-lg font-bold">{card.value}</p>
                  {card.change !== undefined && (
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
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
// EXECUTION TREND CHART
// ============================================================================

interface ExecutionTrendChartProps {
  data: ExecutionTrend[];
  title?: string;
  description?: string;
}

export function ExecutionTrendChart({
  data,
  title = "Execution Trend",
  description = "Executions over time by status",
}: ExecutionTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSuccessful" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
              dataKey="successful"
              stackId="1"
              stroke="#10B981"
              fill="url(#colorSuccessful)"
              name="Successful"
            />
            <Area
              type="monotone"
              dataKey="failed"
              stackId="1"
              stroke="#EF4444"
              fill="url(#colorFailed)"
              name="Failed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXECUTION LINE CHART
// ============================================================================

interface ExecutionLineChartProps {
  data: ExecutionTrend[];
  title?: string;
  description?: string;
}

export function ExecutionLineChart({
  data,
  title = "Daily Executions",
  description = "Total executions per day",
}: ExecutionLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Total"
            />
            <Line
              type="monotone"
              dataKey="successful"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Successful"
            />
            <Line
              type="monotone"
              dataKey="failed"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Failed"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXECUTIONS BY STATUS PIE CHART
// ============================================================================

interface ExecutionsByStatusChartProps {
  data: ExecutionsByStatus[];
  title?: string;
  description?: string;
}

export function ExecutionsByStatusChart({
  data,
  title = "Status Distribution",
  description = "Executions by status",
}: ExecutionsByStatusChartProps) {
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
              nameKey="status"
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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
              formatter={(value) => [
                typeof value === 'number' ? value.toLocaleString() : String(value),
                "Executions",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXECUTION DURATION BAR CHART
// ============================================================================

interface ExecutionDurationChartProps {
  data: ExecutionTrend[];
  title?: string;
  description?: string;
}

export function ExecutionDurationChart({
  data,
  title = "Average Duration",
  description = "Average execution duration per day",
}: ExecutionDurationChartProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              className="text-xs"
            />
            <YAxis
              className="text-xs"
              tickFormatter={formatDuration}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              formatter={(value) => [formatDuration(typeof value === 'number' ? value : 0), "Duration"]}
            />
            <Bar dataKey="avgDuration" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Avg Duration" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXECUTION SUMMARY COMPACT
// ============================================================================

interface ExecutionSummaryCompactProps {
  data: ExecutionOverview;
}

export function ExecutionSummaryCompact({ data }: ExecutionSummaryCompactProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Summary</CardTitle>
        <CardDescription>Quick overview of execution statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Total Executions</span>
            <span className="font-semibold">{formatNumber(data.totalExecutions)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Success Rate</span>
            <span className="font-semibold text-green-600">{data.successRate}%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Failed</span>
            <span className="font-semibold text-red-600">{formatNumber(data.failedExecutions)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Avg Duration</span>
            <span className="font-semibold">{formatDuration(data.avgExecutionTime)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Min Duration</span>
            <span className="font-semibold text-green-600">{formatDuration(data.minExecutionTime)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Max Duration</span>
            <span className="font-semibold text-amber-600">{formatDuration(data.maxExecutionTime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

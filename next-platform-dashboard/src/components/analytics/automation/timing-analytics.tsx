"use client";

/**
 * Timing Analytics Components
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Components for displaying execution timing and performance metrics
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
  Clock,
  Timer,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type {
  TimingMetrics,
  ExecutionsByHour,
  ExecutionsByDay,
  DurationDistribution,
} from "@/types/automation-analytics";

// ============================================================================
// TIMING METRICS CARDS
// ============================================================================

interface TimingMetricsCardsProps {
  data: TimingMetrics;
}

export function TimingMetricsCards({ data }: TimingMetricsCardsProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const cards = [
    {
      title: "Avg Duration",
      value: formatDuration(data.avgExecutionTime),
      change: data.avgExecutionTimeChange,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      invertChange: true,
    },
    {
      title: "P50 Duration",
      value: formatDuration(data.p50ExecutionTime),
      icon: Timer,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "P90 Duration",
      value: formatDuration(data.p90ExecutionTime),
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "P99 Duration",
      value: formatDuration(data.p99ExecutionTime),
      icon: Timer,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Fastest",
      value: formatDuration(data.fastestExecution),
      icon: Zap,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Timed Out",
      value: data.timedOutCount.toString(),
      change: data.timedOutChange,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      invertChange: true,
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
// EXECUTIONS BY HOUR CHART
// ============================================================================

interface ExecutionsByHourChartProps {
  data: ExecutionsByHour[];
  title?: string;
  description?: string;
}

export function ExecutionsByHourChart({
  data,
  title = "Executions by Hour",
  description = "Distribution of executions throughout the day",
}: ExecutionsByHourChartProps) {
  const formatHour = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
  };

  const chartData = data.map((d) => ({
    ...d,
    hourLabel: formatHour(d.hour),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="hourLabel" className="text-xs" interval={2} />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="executions"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              name="Executions"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXECUTIONS BY DAY CHART
// ============================================================================

interface ExecutionsByDayChartProps {
  data: ExecutionsByDay[];
  title?: string;
  description?: string;
}

export function ExecutionsByDayChart({
  data,
  title = "Executions by Day",
  description = "Distribution across days of the week",
}: ExecutionsByDayChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.dayName.slice(0, 3),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="shortName" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.dayName;
                }
                return "";
              }}
            />
            <Legend />
            <Bar
              dataKey="executions"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              name="Executions"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUCCESS RATE BY DAY CHART
// ============================================================================

interface SuccessRateByDayChartProps {
  data: ExecutionsByDay[];
  title?: string;
  description?: string;
}

export function SuccessRateByDayChart({
  data,
  title = "Success Rate by Day",
  description = "Performance across days of the week",
}: SuccessRateByDayChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.dayName.slice(0, 3),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="shortName" className="text-xs" />
            <YAxis className="text-xs" domain={[70, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [`${(typeof value === 'number' ? value : 0).toFixed(1)}%`, "Success Rate"]}
            />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Success Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DURATION DISTRIBUTION CHART
// ============================================================================

interface DurationDistributionChartProps {
  data: DurationDistribution[];
  title?: string;
  description?: string;
}

export function DurationDistributionChart({
  data,
  title = "Duration Distribution",
  description = "Execution time distribution",
}: DurationDistributionChartProps) {
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
            <XAxis dataKey="range" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : String(value), "Executions"]}
            />
            <Bar dataKey="count" name="Executions" radius={[4, 4, 0, 0]}>
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
// DURATION PIE CHART
// ============================================================================

interface DurationPieChartProps {
  data: DurationDistribution[];
  title?: string;
  description?: string;
}

export function DurationPieChart({
  data,
  title = "Duration Breakdown",
  description = "Percentage by duration range",
}: DurationPieChartProps) {
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
              nameKey="range"
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
              formatter={(value) => [
                typeof value === 'number' ? value.toLocaleString() : String(value),
                "Executions",
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// AVERAGE DURATION BY HOUR
// ============================================================================

interface AvgDurationByHourChartProps {
  data: ExecutionsByHour[];
  title?: string;
  description?: string;
}

export function AvgDurationByHourChart({
  data,
  title = "Avg Duration by Hour",
  description = "Average execution time throughout the day",
}: AvgDurationByHourChartProps) {
  const formatHour = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const chartData = data.map((d) => ({
    ...d,
    hourLabel: formatHour(d.hour),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="hourLabel" className="text-xs" interval={2} />
            <YAxis className="text-xs" tickFormatter={formatDuration} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [formatDuration(typeof value === 'number' ? value : 0), "Avg Duration"]}
            />
            <Line
              type="monotone"
              dataKey="avgDuration"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Avg Duration"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TIMING SUMMARY COMPACT
// ============================================================================

interface TimingSummaryCompactProps {
  data: TimingMetrics;
}

export function TimingSummaryCompact({ data }: TimingSummaryCompactProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timing Summary</CardTitle>
        <CardDescription>Quick overview of execution timing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Average</span>
            <span className="font-semibold">{formatDuration(data.avgExecutionTime)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">P50 (Median)</span>
            <span className="font-semibold text-green-600">{formatDuration(data.p50ExecutionTime)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">P90</span>
            <span className="font-semibold text-amber-600">{formatDuration(data.p90ExecutionTime)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">P99</span>
            <span className="font-semibold text-orange-600">{formatDuration(data.p99ExecutionTime)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Fastest</span>
            <span className="font-semibold text-emerald-600">{formatDuration(data.fastestExecution)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Slowest</span>
            <span className="font-semibold text-red-600">{formatDuration(data.slowestExecution)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

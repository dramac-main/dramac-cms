"use client";

/**
 * Trigger Analytics Components
 * 
 * PHASE-DS-03C: Automation Analytics Dashboard
 * Components for displaying trigger metrics and performance
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Zap,
  Calendar,
  Webhook,
  MousePointer,
  FileEdit,
  TrendingUp,
  TrendingDown,
  Radio,
  Activity,
} from "lucide-react";
import type {
  TriggerMetrics,
  TriggerTrend,
  TriggerPerformance,
  StepAnalytics,
  ActionsByType,
} from "@/types/automation-analytics";

// ============================================================================
// TRIGGER METRICS CARDS
// ============================================================================

interface TriggerMetricsCardsProps {
  data: TriggerMetrics;
}

export function TriggerMetricsCards({ data }: TriggerMetricsCardsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const cards = [
    {
      title: "Total Triggers",
      value: formatNumber(data.totalTriggers),
      change: data.totalTriggersChange,
      icon: Radio,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Event Triggers",
      value: formatNumber(data.eventTriggers),
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Scheduled",
      value: formatNumber(data.scheduleTriggers),
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Webhooks",
      value: formatNumber(data.webhookTriggers),
      icon: Webhook,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Manual",
      value: formatNumber(data.manualTriggers),
      icon: MousePointer,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      title: "Form Submissions",
      value: formatNumber(data.formTriggers),
      icon: FileEdit,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = (card.change ?? 0) >= 0;

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
// TRIGGER TREND CHART
// ============================================================================

interface TriggerTrendChartProps {
  data: TriggerTrend[];
  title?: string;
  description?: string;
}

export function TriggerTrendChart({
  data,
  title = "Trigger Trend",
  description = "Triggers over time by type",
}: TriggerTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEvent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSchedule" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWebhook" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
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
              dataKey="event"
              stackId="1"
              stroke="#3B82F6"
              fill="url(#colorEvent)"
              name="Event"
            />
            <Area
              type="monotone"
              dataKey="schedule"
              stackId="1"
              stroke="#10B981"
              fill="url(#colorSchedule)"
              name="Schedule"
            />
            <Area
              type="monotone"
              dataKey="webhook"
              stackId="1"
              stroke="#F59E0B"
              fill="url(#colorWebhook)"
              name="Webhook"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TRIGGER PERFORMANCE TABLE
// ============================================================================

interface TriggerPerformanceTableProps {
  data: TriggerPerformance[];
  title?: string;
  description?: string;
}

export function TriggerPerformanceTable({
  data,
  title = "Trigger Performance",
  description = "Performance metrics by trigger type",
}: TriggerPerformanceTableProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "event":
        return Zap;
      case "schedule":
        return Calendar;
      case "webhook":
        return Webhook;
      case "manual":
        return MousePointer;
      case "form_submission":
        return FileEdit;
      default:
        return Radio;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Trigger Type</th>
                <th className="pb-3 font-medium text-right">Total</th>
                <th className="pb-3 font-medium text-right">Successful</th>
                <th className="pb-3 font-medium text-right">Failed</th>
                <th className="pb-3 font-medium text-right">Success Rate</th>
                <th className="pb-3 font-medium text-right">Avg Response</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.map((trigger) => {
                const Icon = getTriggerIcon(trigger.triggerType);
                return (
                  <tr key={trigger.triggerType} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded"
                          style={{ backgroundColor: trigger.color + "20" }}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: trigger.color }}
                          />
                        </div>
                        <span className="capitalize">
                          {trigger.triggerType.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatNumber(trigger.totalTriggers)}
                    </td>
                    <td className="py-3 text-right text-green-600">
                      {formatNumber(trigger.successfulExecutions)}
                    </td>
                    <td className="py-3 text-right text-red-600">
                      {formatNumber(trigger.failedExecutions)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={
                          trigger.successRate >= 90
                            ? "text-green-600"
                            : trigger.successRate >= 75
                            ? "text-amber-600"
                            : "text-red-600"
                        }
                      >
                        {trigger.successRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {formatDuration(trigger.avgResponseTime)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TRIGGER DISTRIBUTION PIE CHART
// ============================================================================

interface TriggerDistributionChartProps {
  data: TriggerPerformance[];
  title?: string;
  description?: string;
}

export function TriggerDistributionChart({
  data,
  title = "Trigger Distribution",
  description = "Percentage by trigger type",
}: TriggerDistributionChartProps) {
  const totalTriggers = data.reduce((sum, d) => sum + d.totalTriggers, 0);
  const chartData = data.map((d) => ({
    name: d.triggerType.charAt(0).toUpperCase() + d.triggerType.slice(1).replace("_", " "),
    value: d.totalTriggers,
    percentage: ((d.totalTriggers / totalTriggers) * 100).toFixed(1),
    color: d.color,
  }));

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
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value) => [typeof value === 'number' ? value.toLocaleString() : String(value), "Triggers"]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STEP ANALYTICS CHART
// ============================================================================

interface StepAnalyticsChartProps {
  data: StepAnalytics[];
  title?: string;
  description?: string;
}

export function StepAnalyticsChart({
  data,
  title = "Step Performance",
  description = "Executions by step type",
}: StepAnalyticsChartProps) {
  const chartData = data.map((s) => ({
    name: s.stepType.charAt(0).toUpperCase() + s.stepType.slice(1),
    successful: s.successfulExecutions,
    failed: s.failedExecutions,
    fill: s.color,
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
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="successful" stackId="a" fill="#10B981" name="Successful" />
            <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ACTIONS BY TYPE CHART
// ============================================================================

interface ActionsByTypeChartProps {
  data: ActionsByType[];
  title?: string;
  description?: string;
}

export function ActionsByTypeChart({
  data,
  title = "Actions by Type",
  description = "Most used action types",
}: ActionsByTypeChartProps) {
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
              dataKey="actionType"
              type="category"
              width={100}
              className="text-xs"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="executions" name="Executions" radius={[0, 4, 4, 0]}>
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
// TRIGGER SUMMARY COMPACT
// ============================================================================

interface TriggerSummaryCompactProps {
  data: TriggerMetrics;
}

export function TriggerSummaryCompact({ data }: TriggerSummaryCompactProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const total = data.totalTriggers;
  const getPercentage = (value: number) => ((value / total) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trigger Summary</CardTitle>
        <CardDescription>Quick overview of trigger statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Total Triggers</span>
            <span className="font-semibold">{formatNumber(data.totalTriggers)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" /> Event
            </span>
            <span className="font-semibold">
              {formatNumber(data.eventTriggers)}{" "}
              <span className="text-muted-foreground text-xs">
                ({getPercentage(data.eventTriggers)}%)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" /> Schedule
            </span>
            <span className="font-semibold">
              {formatNumber(data.scheduleTriggers)}{" "}
              <span className="text-muted-foreground text-xs">
                ({getPercentage(data.scheduleTriggers)}%)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Webhook className="h-4 w-4 text-amber-600" /> Webhook
            </span>
            <span className="font-semibold">
              {formatNumber(data.webhookTriggers)}{" "}
              <span className="text-muted-foreground text-xs">
                ({getPercentage(data.webhookTriggers)}%)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-pink-600" /> Manual
            </span>
            <span className="font-semibold">
              {formatNumber(data.manualTriggers)}{" "}
              <span className="text-muted-foreground text-xs">
                ({getPercentage(data.manualTriggers)}%)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Avg/Day</span>
            <span className="font-semibold">{data.avgTriggersPerDay.toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

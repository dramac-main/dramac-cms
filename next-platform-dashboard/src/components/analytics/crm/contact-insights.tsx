"use client";

/**
 * CRM Contact Insights Component
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Displays contact metrics, lead scores, sources, and growth trends
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  UserPlus,
  UserCheck,
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import type {
  ContactMetrics,
  ContactsBySource,
  ContactsByStatus,
  LeadScoreDistribution,
  ContactGrowth,
} from "@/types/crm-analytics";

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(280 65% 60%)",
];

// ============================================================================
// CONTACT METRICS CARDS
// ============================================================================

interface ContactMetricsCardsProps {
  data: ContactMetrics;
  className?: string;
}

export function ContactMetricsCards({ data, className }: ContactMetricsCardsProps) {
  const metrics = [
    {
      label: "Total Contacts",
      value: formatNumber(data.totalContacts),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      trend: data.contactsTrend,
    },
    {
      label: "New Contacts",
      value: formatNumber(data.newContacts),
      icon: UserPlus,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Qualified Leads",
      value: formatNumber(data.qualifiedLeads),
      icon: UserCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Conversion Rate",
      value: `${data.conversionRate}%`,
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Avg Lead Score",
      value: data.avgLeadScore.toString(),
      icon: Sparkles,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-5 gap-4", className)}>
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", metric.bgColor)}>
              <metric.icon className={cn("h-4 w-4", metric.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{metric.value}</p>
                {metric.trend !== undefined && (
                  <Badge
                    variant={metric.trend >= 0 ? "default" : "destructive"}
                    className="text-xs h-5"
                  >
                    {metric.trend >= 0 ? "+" : ""}
                    {metric.trend}%
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
// CONTACTS BY SOURCE
// ============================================================================

interface ContactsBySourceChartProps {
  data: ContactsBySource[];
  className?: string;
}

export function ContactsBySourceChart({ data, className }: ContactsBySourceChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Contacts by Source</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((source, index) => (
            <div key={source.source} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="font-medium">{source.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    {source.count} ({source.percentage}%)
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {source.conversionRate}% conv.
                  </Badge>
                </div>
              </div>
              <Progress
                value={(source.count / maxCount) * 100}
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
// CONTACTS BY STATUS
// ============================================================================

interface ContactsByStatusChartProps {
  data: ContactsByStatus[];
  className?: string;
}

export function ContactsByStatusChart({ data, className }: ContactsByStatusChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Contacts by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [typeof value === 'number' ? value : 0, "Contacts"]}
              />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LEAD SCORE DISTRIBUTION
// ============================================================================

interface LeadScoreDistributionChartProps {
  data: LeadScoreDistribution[];
  className?: string;
}

export function LeadScoreDistributionChart({ data, className }: LeadScoreDistributionChartProps) {
  const getScoreColor = (range: string): string => {
    if (range.startsWith("81")) return "hsl(142.1 76.2% 36.3%)";
    if (range.startsWith("61")) return "hsl(var(--chart-2))";
    if (range.startsWith("41")) return "hsl(var(--chart-3))";
    if (range.startsWith("21")) return "hsl(var(--chart-4))";
    return "hsl(0 84.2% 60.2%)";
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Lead Score Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">
          Distribution of contacts by lead score
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value, _name, props) => {
                  const val = typeof value === 'number' ? value : 0;
                  const payload = props?.payload as { percentage?: number } | undefined;
                  return [`${val} contacts (${payload?.percentage ?? 0}%)`, "Count"];
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <React.Fragment key={`cell-${index}`}>
                    <rect fill={getScoreColor(entry.range)} />
                  </React.Fragment>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Low (0-40)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Medium (41-60)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">High (61-100)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONTACT GROWTH CHART
// ============================================================================

interface ContactGrowthChartProps {
  data: ContactGrowth[];
  className?: string;
}

export function ContactGrowthChart({ data, className }: ContactGrowthChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Contact Growth</CardTitle>
        <p className="text-xs text-muted-foreground">
          Total contacts over time with new and converted
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="hsl(var(--chart-1))"
                fill="url(#colorTotal)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="new"
                name="New"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.2}
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
// CONTACT INSIGHTS SUMMARY
// ============================================================================

interface ContactInsightsSummaryProps {
  metrics: ContactMetrics;
  className?: string;
}

export function ContactInsightsSummary({ metrics, className }: ContactInsightsSummaryProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatNumber(metrics.totalContacts)}</p>
            <p className="text-sm text-muted-foreground">Total Contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">
              +{metrics.newContacts}
            </p>
            <p className="text-xs text-muted-foreground">New</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">
              {metrics.activeContacts}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-purple-600">
              {metrics.qualifiedLeads}
            </p>
            <p className="text-xs text-muted-foreground">Qualified</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">
              {metrics.conversionRate}%
            </p>
            <p className="text-xs text-muted-foreground">Conversion</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

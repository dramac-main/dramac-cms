"use client";

/**
 * CRM Deal Velocity Chart Component
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Displays deal velocity trends, deal status distribution, and source analysis
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp,
  TrendingDown,
  Trophy,
  CircleX,
  Clock,
} from "lucide-react";
import type {
  DealVelocityData,
  DealsByStatus,
  DealsBySource,
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

// Chart colors
const COLORS = {
  new: "hsl(var(--chart-1))",
  won: "hsl(142.1 76.2% 36.3%)",
  lost: "hsl(0 84.2% 60.2%)",
  open: "hsl(var(--chart-3))",
};

const STATUS_COLORS = {
  open: "hsl(var(--chart-1))",
  won: "hsl(142.1 76.2% 36.3%)",
  lost: "hsl(0 84.2% 60.2%)",
};

// ============================================================================
// DEAL VELOCITY CHART
// ============================================================================

interface DealVelocityChartProps {
  data: DealVelocityData[];
  className?: string;
}

export function DealVelocityChart({ data, className }: DealVelocityChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Deal Velocity</CardTitle>
        <p className="text-xs text-muted-foreground">
          New vs Won vs Lost deals over time
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.new} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.new} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.won} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.won} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.lost} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.lost} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
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
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="newDeals"
                name="New"
                stroke={COLORS.new}
                fill="url(#colorNew)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="wonDeals"
                name="Won"
                stroke={COLORS.won}
                fill="url(#colorWon)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="lostDeals"
                name="Lost"
                stroke={COLORS.lost}
                fill="url(#colorLost)"
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
// DEAL VALUE CHART
// ============================================================================

interface DealValueChartProps {
  data: DealVelocityData[];
  className?: string;
}

export function DealValueChart({ data, className }: DealValueChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Deal Value Trend</CardTitle>
        <p className="text-xs text-muted-foreground">
          Total deal value vs won value
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
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
              <Bar dataKey="dealValue" name="Total Value" fill={COLORS.new} radius={[4, 4, 0, 0]} />
              <Bar dataKey="wonValue" name="Won Value" fill={COLORS.won} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DEALS BY STATUS
// ============================================================================

interface DealsByStatusChartProps {
  data: DealsByStatus[];
  className?: string;
}

export function DealsByStatusChart({ data, className }: DealsByStatusChartProps) {
  const pieData = data.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    fill: STATUS_COLORS[item.status],
  }));

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Deals by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-4">
            {data.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[item.status] }}
                  />
                  <div>
                    <p className="text-sm font-medium capitalize">{item.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} deals ({item.percentage}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(item.avgValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DEALS BY STATUS CARDS
// ============================================================================

interface DealStatusCardsProps {
  data: DealsByStatus[];
  className?: string;
}

export function DealStatusCards({ data, className }: DealStatusCardsProps) {
  const statusConfig = {
    open: { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    won: { icon: Trophy, color: "text-green-500", bgColor: "bg-green-500/10" },
    lost: { icon: CircleX, color: "text-red-500", bgColor: "bg-red-500/10" },
  };

  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      {data.map((item) => {
        const config = statusConfig[item.status];
        const Icon = config.icon;

        return (
          <Card key={item.status} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.status} Deals
                </p>
                <p className="text-2xl font-bold">{item.count}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Value</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Avg</span>
                <span className="font-medium">{formatCurrency(item.avgValue)}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// DEALS BY SOURCE
// ============================================================================

interface DealsBySourceChartProps {
  data: DealsBySource[];
  className?: string;
}

export function DealsBySourceChart({ data, className }: DealsBySourceChartProps) {
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(280 65% 60%)",
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Deals by Source</CardTitle>
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
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis
                type="category"
                dataKey="source"
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
                formatter={(value, name) => {
                  const val = typeof value === 'number' ? value : 0;
                  return [
                    name === "dealValue" ? formatCurrency(val) : val,
                    name === "dealValue" ? "Value" : "Deals",
                  ];
                }}
              />
              <Bar dataKey="dealValue" name="Value" fill={chartColors[0]} radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.slice(0, 4).map((source, index) => (
            <div key={source.source} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <span>{source.source}</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-xs">
                  {source.dealCount} deals
                </Badge>
                <span className="text-muted-foreground">{source.winRate}% win rate</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// VELOCITY SUMMARY
// ============================================================================

interface VelocitySummaryProps {
  data: DealVelocityData[];
  className?: string;
}

export function VelocitySummary({ data, className }: VelocitySummaryProps) {
  const totals = data.reduce(
    (acc, item) => ({
      newDeals: acc.newDeals + item.newDeals,
      wonDeals: acc.wonDeals + item.wonDeals,
      lostDeals: acc.lostDeals + item.lostDeals,
      dealValue: acc.dealValue + item.dealValue,
      wonValue: acc.wonValue + item.wonValue,
    }),
    { newDeals: 0, wonDeals: 0, lostDeals: 0, dealValue: 0, wonValue: 0 }
  );

  const winRate = Math.floor((totals.wonDeals / Math.max(totals.newDeals, 1)) * 100);

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">New Deals</p>
        <p className="text-2xl font-bold">{totals.newDeals}</p>
        <div className="flex items-center gap-1 mt-1 text-blue-500">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs">{formatCurrency(totals.dealValue)}</span>
        </div>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Won Deals</p>
        <p className="text-2xl font-bold text-green-600">{totals.wonDeals}</p>
        <div className="flex items-center gap-1 mt-1 text-green-500">
          <Trophy className="h-3 w-3" />
          <span className="text-xs">{formatCurrency(totals.wonValue)}</span>
        </div>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Lost Deals</p>
        <p className="text-2xl font-bold text-red-600">{totals.lostDeals}</p>
        <div className="flex items-center gap-1 mt-1 text-red-500">
          <CircleX className="h-3 w-3" />
          <span className="text-xs">{totals.lostDeals} deals</span>
        </div>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">Win Rate</p>
        <p className="text-2xl font-bold">{winRate}%</p>
        <div className="flex items-center gap-1 mt-1 text-purple-500">
          <Target className="h-3 w-3" />
          <span className="text-xs">of period</span>
        </div>
      </Card>
    </div>
  );
}

// Import Target from lucide-react at the top
import { Target } from "lucide-react";

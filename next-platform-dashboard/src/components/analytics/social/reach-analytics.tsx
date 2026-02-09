"use client";

/**
 * Reach & Impressions Components
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Components for displaying reach and impression metrics
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Users,
  Globe,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Line,
} from "recharts";
import type { ReachMetrics, ReachTrend, ReachByPlatform } from "@/types/social-analytics";

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function TrendIndicator({ value }: { value: number }) {
  const isPositive = value > 0;
  return (
    <span className={`text-xs flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

// ============================================================================
// REACH METRICS CARDS
// ============================================================================

export function ReachMetricsCards({ data }: { data: ReachMetrics }) {
  const metrics = [
    { title: "Total Reach", value: data.totalReach, change: data.totalReachChange, icon: Users },
    { title: "Total Impressions", value: data.totalImpressions, change: data.totalImpressionsChange, icon: Eye },
    { title: "Unique Reach", value: data.uniqueReach, change: data.uniqueReachChange, icon: Globe },
    { title: "Avg Reach/Post", value: data.avgReachPerPost, change: data.avgReachPerPostChange, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
            <TrendIndicator value={metric.change} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// REACH SOURCE BREAKDOWN
// ============================================================================

export function ReachSourceBreakdown({ data }: { data: ReachMetrics }) {
  const sources = [
    { name: "Organic", value: data.organicReach, change: data.organicReachChange, color: "#10B981", icon: Globe },
    { name: "Paid", value: data.paidReach, change: data.paidReachChange, color: "#3B82F6", icon: DollarSign },
    { name: "Viral", value: data.viralReach, change: data.viralReachChange, color: "#F59E0B", icon: Zap },
  ];

  const total = sources.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reach by Source</CardTitle>
        <CardDescription>Organic, paid, and viral reach breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sources.map((source) => (
            <div key={source.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <source.icon className="h-4 w-4" style={{ color: source.color }} />
                  <span className="font-medium">{source.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatNumber(source.value)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((source.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${(source.value / total) * 100}%`,
                    backgroundColor: source.color,
                  }}
                />
              </div>
              <TrendIndicator value={source.change} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REACH TREND CHART
// ============================================================================

export function ReachTrendChart({ data }: { data: ReachTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reach & Impressions Trend</CardTitle>
        <CardDescription>Daily reach and impressions over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString(DEFAULT_LOCALE, { month: "short", day: "numeric" })}
                className="text-xs"
              />
              <YAxis tickFormatter={formatNumber} className="text-xs" />
              <Tooltip 
                formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="impressions" 
                name="Impressions"
                fill="#3B82F6" 
                fillOpacity={0.2}
                stroke="#3B82F6"
              />
              <Line 
                type="monotone" 
                dataKey="reach" 
                name="Reach"
                stroke="#10B981" 
                strokeWidth={2}
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
// REACH BY SOURCE STACKED AREA CHART
// ============================================================================

export function ReachBySourceChart({ data }: { data: ReachTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reach by Source Over Time</CardTitle>
        <CardDescription>Organic, paid, and viral reach trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString(DEFAULT_LOCALE, { month: "short", day: "numeric" })}
                className="text-xs"
              />
              <YAxis tickFormatter={formatNumber} className="text-xs" />
              <Tooltip 
                formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Area type="monotone" dataKey="organic" name="Organic" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="paid" name="Paid" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="viral" name="Viral" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REACH BY PLATFORM
// ============================================================================

export function ReachByPlatformChart({ data }: { data: ReachByPlatform[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reach by Platform</CardTitle>
        <CardDescription>Distribution of reach across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis 
                type="category" 
                dataKey="platform" 
                width={80}
              />
              <Tooltip formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)} />
              <Legend />
              <Bar dataKey="reach" name="Reach" fill="#10B981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="impressions" name="Impressions" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REACH PIE CHART
// ============================================================================

export function ReachPieChart({ data }: { data: ReachByPlatform[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reach Distribution</CardTitle>
        <CardDescription>Percentage of reach by platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="reach"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// IMPRESSIONS VS REACH COMPARISON
// ============================================================================

export function ImpressionsReachComparison({ data }: { data: ReachMetrics }) {
  const ratio = data.totalImpressions / data.totalReach;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impressions vs Reach</CardTitle>
        <CardDescription>How many times your content is seen per person</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{formatNumber(data.totalImpressions)}</div>
              <div className="text-xs text-muted-foreground">Total Impressions</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{formatNumber(data.totalReach)}</div>
              <div className="text-xs text-muted-foreground">Total Reach</div>
            </div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-3xl font-bold text-primary">{ratio.toFixed(2)}x</div>
            <div className="text-sm text-muted-foreground">Avg impressions per person</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// REACH SUMMARY COMPACT
// ============================================================================

export function ReachSummaryCompact({ data }: { data: ReachMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Reach Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-bold text-lg">{formatNumber(data.totalReach)}</div>
            <div className="text-xs text-muted-foreground">Total Reach</div>
          </div>
          <div>
            <div className="font-bold text-lg">{formatNumber(data.avgReachPerPost)}</div>
            <div className="text-xs text-muted-foreground">Avg/Post</div>
          </div>
          <div>
            <div className="font-bold text-lg">{formatNumber(data.organicReach)}</div>
            <div className="text-xs text-muted-foreground">Organic</div>
          </div>
          <div>
            <div className="font-bold text-lg">{formatNumber(data.viralReach)}</div>
            <div className="text-xs text-muted-foreground">Viral</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

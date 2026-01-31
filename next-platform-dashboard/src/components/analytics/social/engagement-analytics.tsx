"use client";

/**
 * Engagement Analytics Components
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Components for displaying engagement metrics and trends
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MousePointer,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { EngagementMetrics, EngagementTrend, EngagementByType } from "@/types/social-analytics";

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
// ENGAGEMENT METRICS CARDS
// ============================================================================

export function EngagementMetricsCards({ data }: { data: EngagementMetrics }) {
  const metrics = [
    { title: "Total Engagements", value: data.totalEngagements, change: data.totalEngagementsChange, icon: Heart },
    { title: "Avg Engagement Rate", value: `${data.avgEngagementRate}%`, change: data.avgEngagementRateChange, icon: TrendingUp },
    { title: "Likes", value: data.likes, change: data.likesChange, icon: Heart },
    { title: "Comments", value: data.comments, change: data.commentsChange, icon: MessageCircle },
    { title: "Shares", value: data.shares, change: data.sharesChange, icon: Share2 },
    { title: "Saves", value: data.saves, change: data.savesChange, icon: Bookmark },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {typeof metric.value === "number" ? formatNumber(metric.value) : metric.value}
            </div>
            <TrendIndicator value={metric.change} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// ENGAGEMENT TREND AREA CHART
// ============================================================================

export function EngagementTrendChart({ data }: { data: EngagementTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Trend</CardTitle>
        <CardDescription>Daily engagement breakdown over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                className="text-xs"
              />
              <YAxis tickFormatter={formatNumber} className="text-xs" />
              <Tooltip 
                formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Area type="monotone" dataKey="likes" name="Likes" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              <Area type="monotone" dataKey="comments" name="Comments" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="shares" name="Shares" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="saves" name="Saves" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ENGAGEMENT LINE CHART
// ============================================================================

export function EngagementLineChart({ data }: { data: EngagementTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Engagement Over Time</CardTitle>
        <CardDescription>Daily total engagement trend</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                className="text-xs"
              />
              <YAxis tickFormatter={formatNumber} className="text-xs" />
              <Tooltip 
                formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Total Engagements"
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ENGAGEMENT BY TYPE PIE CHART
// ============================================================================

export function EngagementByTypeChart({ data }: { data: EngagementByType[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement by Type</CardTitle>
        <CardDescription>Distribution of engagement actions</CardDescription>
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
                dataKey="count"
                label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ENGAGEMENT BREAKDOWN LIST
// ============================================================================

export function EngagementBreakdownList({ data }: { data: EngagementMetrics }) {
  const items = [
    { name: "Likes", value: data.likes, change: data.likesChange, icon: Heart, color: "#EF4444" },
    { name: "Comments", value: data.comments, change: data.commentsChange, icon: MessageCircle, color: "#3B82F6" },
    { name: "Shares", value: data.shares, change: data.sharesChange, icon: Share2, color: "#10B981" },
    { name: "Saves", value: data.saves, change: data.savesChange, icon: Bookmark, color: "#F59E0B" },
    { name: "Clicks", value: data.clicks, change: data.clicksChange, icon: MousePointer, color: "#8B5CF6" },
    { name: "Replies", value: data.replies, change: data.repliesChange, icon: MessageSquare, color: "#EC4899" },
  ];

  const maxValue = Math.max(...items.map(i => i.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Breakdown</CardTitle>
        <CardDescription>Performance of each engagement type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatNumber(item.value)}</span>
                  <TrendIndicator value={item.change} />
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ENGAGEMENT RATE CARD
// ============================================================================

export function EngagementRateCard({ data }: { data: EngagementMetrics }) {
  const engagementLevel = 
    data.avgEngagementRate >= 5 ? "Excellent" :
    data.avgEngagementRate >= 3 ? "Good" :
    data.avgEngagementRate >= 1 ? "Average" : "Needs Improvement";
  
  const levelColor = 
    data.avgEngagementRate >= 5 ? "bg-green-500" :
    data.avgEngagementRate >= 3 ? "bg-blue-500" :
    data.avgEngagementRate >= 1 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Engagement Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-4xl font-bold">{data.avgEngagementRate}%</div>
          <Badge className={levelColor}>{engagementLevel}</Badge>
        </div>
        <TrendIndicator value={data.avgEngagementRateChange} />
        <p className="text-xs text-muted-foreground mt-2">
          Industry average: 1-3% for most platforms
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ENGAGEMENT SUMMARY COMPACT
// ============================================================================

export function EngagementSummaryCompact({ data }: { data: EngagementMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm">{formatNumber(data.likes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{formatNumber(data.comments)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">{formatNumber(data.shares)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">{formatNumber(data.saves)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * Platform Overview Components
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Components for displaying platform-level metrics
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Eye,
  Heart,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { PlatformOverview, PlatformMetrics } from "@/types/social-analytics";

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TrendIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.5) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Minus className="h-3 w-3" />
        No change
      </span>
    );
  }
  
  const isPositive = value > 0;
  return (
    <span className={`text-xs flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value.toFixed(1)}{suffix}
    </span>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// ============================================================================
// OVERVIEW METRICS CARDS
// ============================================================================

export function PlatformOverviewCards({ data }: { data: PlatformOverview }) {
  const metrics = [
    {
      title: "Total Followers",
      value: data.totalFollowers,
      change: data.totalFollowersChange,
      icon: Users,
    },
    {
      title: "Total Impressions",
      value: data.totalImpressions,
      change: data.totalImpressionsChange,
      icon: Eye,
    },
    {
      title: "Total Engagements",
      value: data.totalEngagements,
      change: data.totalEngagementsChange,
      icon: Heart,
    },
    {
      title: "Total Clicks",
      value: data.totalClicks,
      change: data.totalClicksChange,
      icon: MousePointer,
    },
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
// PLATFORM BREAKDOWN LIST
// ============================================================================

export function PlatformBreakdownList({ platforms }: { platforms: PlatformMetrics[] }) {
  const maxFollowers = Math.max(...platforms.map(p => p.followers));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Breakdown</CardTitle>
        <CardDescription>Performance by social network</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.platform} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="font-medium capitalize">{platform.platform}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {formatNumber(platform.followers)} followers
                  </span>
                  <TrendIndicator value={platform.followersChange} />
                </div>
              </div>
              <Progress 
                value={(platform.followers / maxFollowers) * 100} 
                className="h-2"
                style={{ 
                  // @ts-ignore - custom CSS variable
                  "--progress-background": platform.color 
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatNumber(platform.impressions)} impressions</span>
                <span>{formatNumber(platform.engagements)} engagements</span>
                <span>{platform.engagementRate}% eng. rate</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PLATFORM PIE CHART
// ============================================================================

export function PlatformFollowersPieChart({ platforms }: { platforms: PlatformMetrics[] }) {
  const data = platforms.map(p => ({
    name: p.platform,
    value: p.followers,
    color: p.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Followers by Platform</CardTitle>
        <CardDescription>Distribution of your audience</CardDescription>
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
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {platforms.map((p) => (
            <div key={p.platform} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="capitalize">{p.platform}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PLATFORM COMPARISON BAR CHART
// ============================================================================

export function PlatformComparisonChart({ platforms }: { platforms: PlatformMetrics[] }) {
  const data = platforms.map(p => ({
    platform: p.platform,
    impressions: p.impressions,
    engagements: p.engagements,
    clicks: p.clicks,
    color: p.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Comparison</CardTitle>
        <CardDescription>Impressions, engagements, and clicks by platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis 
                type="category" 
                dataKey="platform" 
                width={80}
              />
              <Tooltip formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)} />
              <Legend />
              <Bar dataKey="impressions" name="Impressions" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="engagements" name="Engagements" fill="#10B981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="clicks" name="Clicks" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ENGAGEMENT RATE COMPARISON
// ============================================================================

export function EngagementRateComparison({ platforms }: { platforms: PlatformMetrics[] }) {
  const sortedPlatforms = [...platforms].sort((a, b) => b.engagementRate - a.engagementRate);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Rate by Platform</CardTitle>
        <CardDescription>Higher engagement means better content resonance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPlatforms.map((platform, index) => (
            <div key={platform.platform} className="flex items-center gap-4">
              <Badge variant={index === 0 ? "default" : "outline"}>
                #{index + 1}
              </Badge>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              <span className="font-medium capitalize flex-1">{platform.platform}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{platform.engagementRate}%</span>
                <TrendIndicator value={platform.engagementsChange} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PLATFORM SUMMARY COMPACT
// ============================================================================

export function PlatformSummaryCompact({ data }: { data: PlatformOverview }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Platform Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{data.activePlatforms}</div>
            <div className="text-xs text-muted-foreground">Active platforms</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.avgEngagementRate}%</div>
            <div className="text-xs text-muted-foreground">Avg engagement</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatNumber(data.totalFollowers)}</div>
            <div className="text-xs text-muted-foreground">Total followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatNumber(data.totalImpressions)}</div>
            <div className="text-xs text-muted-foreground">Total impressions</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

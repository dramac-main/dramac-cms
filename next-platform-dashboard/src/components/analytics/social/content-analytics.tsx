"use client";

/**
 * Content Performance Components
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Components for displaying content and posting analytics
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_LOCALE } from '@/lib/locale-config'
import {
  Image,
  Video,
  Layers,
  FileText,
  Link,
  Clock,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  CircleCheck,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
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
  LineChart,
  Line,
} from "recharts";
import type { 
  ContentPerformance, 
  ContentTypeMetrics, 
  PostingMetrics, 
  PostingTrend, 
  PostingByPlatform 
} from "@/types/social-analytics";

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

function getContentTypeIcon(type: string) {
  switch (type) {
    case "image": return Image;
    case "video": return Video;
    case "carousel": return Layers;
    case "text": return FileText;
    case "link": return Link;
    case "story": return Clock;
    case "reel": return PlayCircle;
    default: return FileText;
  }
}

// ============================================================================
// TOP CONTENT LIST
// ============================================================================

export function TopContentList({ content }: { content: ContentPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Content</CardTitle>
        <CardDescription>Your best content by engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {content.slice(0, 5).map((post, index) => {
            const Icon = getContentTypeIcon(post.contentType);
            
            return (
              <div 
                key={post.postId}
                className="flex items-start gap-4 p-4 rounded-lg border"
              >
                <Badge variant={index === 0 ? "default" : "outline"}>
                  #{index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className="capitalize">{post.platform}</Badge>
                    <Badge variant="outline" className="capitalize">{post.contentType}</Badge>
                  </div>
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-4 text-sm text-right">
                  <div>
                    <div className="font-bold">{formatNumber(post.impressions)}</div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div>
                    <div className="font-bold">{formatNumber(post.engagements)}</div>
                    <div className="text-xs text-muted-foreground">Engagements</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">{post.engagementRate}%</div>
                    <div className="text-xs text-muted-foreground">Eng. Rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONTENT TYPE PERFORMANCE
// ============================================================================

export function ContentTypePerformanceChart({ data }: { data: ContentTypeMetrics[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance by Content Type</CardTitle>
        <CardDescription>Which content formats work best</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="type" className="text-xs" />
              <YAxis tickFormatter={formatNumber} className="text-xs" />
              <Tooltip formatter={(value) => formatNumber(typeof value === 'number' ? value : 0)} />
              <Legend />
              <Bar dataKey="avgImpressions" name="Avg Impressions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgEngagement" name="Avg Engagement" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONTENT TYPE DISTRIBUTION PIE
// ============================================================================

export function ContentTypeDistribution({ data }: { data: ContentTypeMetrics[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Type Distribution</CardTitle>
        <CardDescription>Mix of content formats published</CardDescription>
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
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((item) => {
            const Icon = getContentTypeIcon(item.type);
            return (
              <div key={item.type} className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4" style={{ color: item.color }} />
                <span className="capitalize">{item.type}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONTENT TYPE ENGAGEMENT RATES
// ============================================================================

export function ContentTypeEngagementRates({ data }: { data: ContentTypeMetrics[] }) {
  const sortedData = [...data].sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Rate by Content Type</CardTitle>
        <CardDescription>Best performing content formats</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((item, index) => {
            const Icon = getContentTypeIcon(item.type);
            return (
              <div key={item.type} className="flex items-center gap-4">
                <Badge variant={index === 0 ? "default" : "outline"}>
                  #{index + 1}
                </Badge>
                <Icon className="h-4 w-4" style={{ color: item.color }} />
                <span className="font-medium capitalize flex-1">{item.type}</span>
                <span className="text-lg font-bold">{item.avgEngagementRate}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// POSTING METRICS CARDS
// ============================================================================

export function PostingMetricsCards({ data }: { data: PostingMetrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalPosts}</div>
          <TrendIndicator value={data.totalPostsChange} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg Posts/Day</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.avgPostsPerDay}</div>
          <TrendIndicator value={data.avgPostsPerDayChange} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          <CircleCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.publishSuccessRate}%</div>
          <span className="text-xs text-muted-foreground">Publish success</span>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Most Active</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.mostActiveDay}</div>
          <span className="text-xs text-muted-foreground">at {data.mostActiveHour}:00</span>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// POST STATUS BREAKDOWN
// ============================================================================

export function PostStatusBreakdown({ data }: { data: PostingMetrics }) {
  const statuses = [
    { name: "Published", value: data.postsPublished, color: "#10B981", icon: CircleCheck },
    { name: "Scheduled", value: data.postsScheduled, color: "#3B82F6", icon: Clock },
    { name: "Draft", value: data.postsDraft, color: "#6B7280", icon: FileText },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Status</CardTitle>
        <CardDescription>Current state of your content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {statuses.map((status) => (
            <div 
              key={status.name}
              className="text-center p-4 rounded-lg"
              style={{ backgroundColor: `${status.color}10` }}
            >
              <status.icon className="h-6 w-6 mx-auto mb-2" style={{ color: status.color }} />
              <div className="text-2xl font-bold">{status.value}</div>
              <div className="text-xs text-muted-foreground">{status.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// POSTING TREND CHART
// ============================================================================

export function PostingTrendChart({ data }: { data: PostingTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posting Activity</CardTitle>
        <CardDescription>Daily posting trend over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString(DEFAULT_LOCALE, { month: "short", day: "numeric" })}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Bar dataKey="published" name="Published" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="scheduled" name="Scheduled" fill="#3B82F6" stackId="a" />
              <Bar dataKey="failed" name="Failed" fill="#EF4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// POSTING BY PLATFORM
// ============================================================================

export function PostingByPlatformChart({ data }: { data: PostingByPlatform[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts by Platform</CardTitle>
        <CardDescription>Where you're publishing the most</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((platform, index) => (
            <div key={platform.platform} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? "default" : "outline"}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium capitalize">{platform.platform}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold">{platform.posts} posts</span>
                  <span className="text-muted-foreground">({platform.percentage}%)</span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${platform.percentage}%`,
                    backgroundColor: platform.color,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Avg engagement: {formatNumber(platform.avgEngagement)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONTENT SUMMARY COMPACT
// ============================================================================

export function ContentSummaryCompact({ data }: { data: PostingMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Content Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-bold text-lg">{data.totalPosts}</div>
            <div className="text-xs text-muted-foreground">Total Posts</div>
          </div>
          <div>
            <div className="font-bold text-lg">{data.avgPostsPerDay}</div>
            <div className="text-xs text-muted-foreground">Per Day</div>
          </div>
          <div>
            <div className="font-bold text-lg">{data.postsScheduled}</div>
            <div className="text-xs text-muted-foreground">Scheduled</div>
          </div>
          <div>
            <div className="font-bold text-lg text-green-600">{data.publishSuccessRate}%</div>
            <div className="text-xs text-muted-foreground">Success</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * CRM Activity Analytics Component
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Displays activity metrics, type breakdown, timeline, and team performance
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
} from "lucide-react";
import type {
  ActivityMetrics,
  ActivitiesByType,
  ActivityTimeline,
  TeamActivityMetrics,
  ActivityType,
} from "@/types/crm-analytics";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${(value / 1000).toFixed(0)}K`;
  }
  return `${DEFAULT_CURRENCY_SYMBOL}${value.toFixed(0)}`;
}

const ACTIVITY_CONFIG: Record<ActivityType, { icon: typeof Phone; color: string; bgColor: string }> = {
  call: { icon: Phone, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  email: { icon: Mail, color: "text-green-500", bgColor: "bg-green-500/10" },
  meeting: { icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  note: { icon: FileText, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  task: { icon: CheckSquare, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
};

const CHART_COLORS = {
  calls: "hsl(221.2 83.2% 53.3%)",
  emails: "hsl(142.1 76.2% 36.3%)",
  meetings: "hsl(262.1 83.3% 57.8%)",
  notes: "hsl(47.9 95.8% 53.1%)",
  tasks: "hsl(189 94% 43%)",
};

// ============================================================================
// ACTIVITY METRICS CARDS
// ============================================================================

interface ActivityMetricsCardsProps {
  data: ActivityMetrics;
  className?: string;
}

export function ActivityMetricsCards({ data, className }: ActivityMetricsCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Activities</p>
            <p className="text-lg font-bold">{formatNumber(data.totalActivities)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">This Period</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">{formatNumber(data.activitiesThisPeriod)}</p>
              <Badge
                variant={data.activitiesTrend >= 0 ? "default" : "destructive"}
                className="text-xs h-5"
              >
                {data.activitiesTrend >= 0 ? "+" : ""}
                {data.activitiesTrend}%
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg per Deal</p>
            <p className="text-lg font-bold">{data.avgActivitiesPerDeal}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Mail className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Response Rate</p>
            <p className="text-lg font-bold">{data.responseRate}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// ACTIVITIES BY TYPE
// ============================================================================

interface ActivitiesByTypeChartProps {
  data: ActivitiesByType[];
  className?: string;
}

export function ActivitiesByTypeChart({ data, className }: ActivitiesByTypeChartProps) {
  const totalActivities = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Activities by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((activity) => {
            const config = ACTIVITY_CONFIG[activity.type];
            const Icon = config.icon;

            return (
              <div key={activity.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{activity.type}s</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.count} activities
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={activity.trend >= 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {activity.trend >= 0 ? "+" : ""}
                      {activity.trend}%
                    </Badge>
                    <span className="text-sm font-medium w-12 text-right">
                      {activity.percentage}%
                    </span>
                  </div>
                </div>
                <Progress value={activity.percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ACTIVITY TIMELINE CHART
// ============================================================================

interface ActivityTimelineChartProps {
  data: ActivityTimeline[];
  className?: string;
}

export function ActivityTimelineChart({ data, className }: ActivityTimelineChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
        <p className="text-xs text-muted-foreground">
          Activity breakdown over time
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.calls} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.calls} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.emails} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.emails} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.meetings} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.meetings} stopOpacity={0} />
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
              <Legend />
              <Area
                type="monotone"
                dataKey="calls"
                name="Calls"
                stroke={CHART_COLORS.calls}
                fill="url(#colorCalls)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="emails"
                name="Emails"
                stroke={CHART_COLORS.emails}
                fill="url(#colorEmails)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="meetings"
                name="Meetings"
                stroke={CHART_COLORS.meetings}
                fill="url(#colorMeetings)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ACTIVITY BAR CHART
// ============================================================================

interface ActivityBarChartProps {
  data: ActivityTimeline[];
  className?: string;
}

export function ActivityBarChart({ data, className }: ActivityBarChartProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Daily Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
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
              <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TEAM ACTIVITY LEADERBOARD
// ============================================================================

interface TeamActivityLeaderboardProps {
  data: TeamActivityMetrics[];
  className?: string;
}

export function TeamActivityLeaderboard({ data, className }: TeamActivityLeaderboardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Team Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((member, index) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 text-sm font-bold text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {member.userAvatar || member.userName.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.totalActivities} activities
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-medium">{member.deals}</p>
                  <p className="text-xs text-muted-foreground">Deals</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-green-600">{member.wonDeals}</p>
                  <p className="text-xs text-muted-foreground">Won</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{formatCurrency(member.revenue)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
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
// ACTIVITY SUMMARY COMPACT
// ============================================================================

interface ActivitySummaryCompactProps {
  data: ActivitiesByType[];
  className?: string;
}

export function ActivitySummaryCompact({ data, className }: ActivitySummaryCompactProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {data.slice(0, 5).map((activity) => {
        const config = ACTIVITY_CONFIG[activity.type];
        const Icon = config.icon;

        return (
          <div
            key={activity.type}
            className="flex items-center gap-2 text-sm"
          >
            <Icon className={cn("h-4 w-4", config.color)} />
            <span className="font-medium">{activity.count}</span>
            <span className="text-muted-foreground capitalize">{activity.type}s</span>
          </div>
        );
      })}
    </div>
  );
}

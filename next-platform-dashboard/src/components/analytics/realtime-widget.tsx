"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  Eye, 
  Clock, 
  RefreshCw, 
  Globe,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { RealtimeAnalytics } from "@/types/site-analytics";
import { formatNumber } from "./site-analytics-metrics";

interface RealtimeWidgetProps {
  data: RealtimeAnalytics | null;
  loading?: boolean;
  className?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function RealtimeWidget({
  data,
  loading = false,
  className,
  onRefresh,
  refreshing = false,
}: RealtimeWidgetProps) {
  if (loading || !data) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              Realtime
            </CardTitle>
            <CardDescription>Active visitors right now</CardDescription>
          </div>
          <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Realtime
          </CardTitle>
          <CardDescription>Active visitors right now</CardDescription>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Users Count */}
          <div className="flex items-center justify-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNumber(data.activeUsers)}
              </p>
              <p className="text-sm text-muted-foreground">active users</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1.5">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{formatNumber(data.pageViewsLastHour)}</span>
              </div>
              <p className="text-xs text-muted-foreground">views/hour</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{data.avgTimeOnSite.toFixed(0)}s</span>
              </div>
              <p className="text-xs text-muted-foreground">avg. time</p>
            </div>
          </div>

          {/* Active Sessions */}
          {data.activeSessions && data.activeSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Sessions</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {data.activeSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{session.currentPage}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {Math.floor(session.duration / 60)}m
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Pages Now */}
          {data.topPagesNow && data.topPagesNow.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Top Pages Now</p>
              <div className="space-y-1">
                {data.topPagesNow.slice(0, 3).map((page, index) => (
                  <div
                    key={page.path}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {page.path}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {page.activeUsers}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RealtimeCompactProps {
  activeUsers: number;
  pageViewsLastHour: number;
  className?: string;
}

export function RealtimeCompact({
  activeUsers,
  pageViewsLastHour,
  className,
}: RealtimeCompactProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-sm font-medium">{formatNumber(activeUsers)} active</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        <span className="text-sm">{formatNumber(pageViewsLastHour)}/hr</span>
      </div>
    </div>
  );
}

interface RealtimePulseProps {
  activeUsers: number;
  trend?: "up" | "down" | "stable";
  className?: string;
}

export function RealtimePulse({
  activeUsers,
  trend = "stable",
  className,
}: RealtimePulseProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-2xl font-bold">{formatNumber(activeUsers)}</span>
        {trend === "up" && <ArrowUp className="h-4 w-4 text-emerald-500" />}
        {trend === "down" && <ArrowDown className="h-4 w-4 text-rose-500" />}
      </div>
      <span className="text-sm text-muted-foreground">online now</span>
    </div>
  );
}

"use client";

// src/components/modules/analytics/module-analytics-dashboard.tsx
// Phase EM-03: Module Analytics Dashboard UI

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Eye,
  Users,
  Clock,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type { AnalyticsDashboardData, TopEvent, HealthStatus } from "@/lib/modules/analytics/module-analytics";

import { DEFAULT_LOCALE } from '@/lib/locale-config'
interface ModuleAnalyticsDashboardProps {
  moduleId: string;
  siteId?: string;
  moduleName?: string;
}

export function ModuleAnalyticsDashboard({
  moduleId,
  siteId,
  moduleName,
}: ModuleAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        days: timeRange,
        ...(siteId && { siteId }),
      });

      const response = await fetch(
        `/api/modules/analytics/${moduleId}?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [moduleId, siteId, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchAnalytics}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthColor: Record<HealthStatus["status"], string> = {
    healthy: "text-green-500",
    degraded: "text-yellow-500",
    unhealthy: "text-red-500",
    unknown: "text-gray-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          {moduleName && (
            <p className="text-muted-foreground">{moduleName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-3xl font-bold">{data.current.activeUsers}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Status</p>
                <p
                  className={`text-xl font-bold capitalize ${
                    healthColor[data.current.health.status]
                  }`}
                >
                  {data.current.health.status}
                </p>
              </div>
              <Zap
                className={`h-8 w-8 ${healthColor[data.current.health.status]}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Load Time</p>
                <p className="text-3xl font-bold">{data.averages.loadTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-3xl font-bold">
                  {data.totals.views > 0
                    ? ((data.totals.errors / data.totals.views) * 100).toFixed(2)
                    : "0"}
                  %
                </p>
              </div>
              <AlertCircle
                className={`h-8 w-8 ${
                  data.totals.errors > 0 ? "text-red-500" : "text-green-500"
                }`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value={formatNumber(data.totals.views)}
          icon={<Eye className="h-4 w-4" />}
          trend={10}
        />
        <MetricCard
          title="Unique Visitors"
          value={formatNumber(data.totals.uniqueVisitors)}
          icon={<Users className="h-4 w-4" />}
          trend={5}
        />
        <MetricCard
          title="Sessions"
          value={formatNumber(data.totals.sessions)}
          icon={<Activity className="h-4 w-4" />}
          trend={-2}
        />
        <MetricCard
          title="Revenue"
          value={formatCurrency(data.totals.revenue / 100)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={15}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="views">
        <TabsList>
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="views" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                {data.timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="stat_date"
                        tickFormatter={(v: string) =>
                          new Date(v).toLocaleDateString(DEFAULT_LOCALE, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(v) =>
                          new Date(String(v)).toLocaleDateString(DEFAULT_LOCALE, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#3b82f6"
                        fill="#3b82f680"
                        name="Views"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                {data.timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="stat_date"
                        tickFormatter={(v: string) =>
                          new Date(v).toLocaleDateString(DEFAULT_LOCALE, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(v) =>
                          new Date(String(v)).toLocaleDateString(DEFAULT_LOCALE, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="unique_visitors"
                        stroke="#10b981"
                        name="Unique Visitors"
                      />
                      <Line
                        type="monotone"
                        dataKey="active_users"
                        stroke="#8b5cf6"
                        name="Active Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-75">
                {data.timeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="stat_date"
                        tickFormatter={(v: string) =>
                          new Date(v).toLocaleDateString(DEFAULT_LOCALE, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip
                        labelFormatter={(v) =>
                          new Date(String(v)).toLocaleDateString(DEFAULT_LOCALE, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="avg_load_time_ms"
                        stroke="#f59e0b"
                        name="Load Time (ms)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="error_count"
                        stroke="#ef4444"
                        name="Errors"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topEvents.length > 0 ? (
                  data.topEvents.map((event: TopEvent, i: number) => (
                    <div
                      key={`${event.event_type}-${event.event_name}-${i}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{event.event_type}</Badge>
                        <span className="font-medium">{event.event_name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatNumber(event.count)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No events recorded for this period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
}

function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  const isPositive = trend >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          {icon}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          <span
            className={`text-sm flex items-center ${
              isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-36 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-100 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

export default ModuleAnalyticsDashboard;

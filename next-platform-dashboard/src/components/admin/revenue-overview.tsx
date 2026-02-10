/**
 * Revenue Overview Component
 * 
 * PHASE-DS-05: Billing & Revenue Dashboards
 * 
 * Displays key revenue metrics including MRR, ARR, and growth indicators.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  CreditCard,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getRevenueMetrics, getRevenueTrends, getRevenueByPlan } from "@/lib/actions/admin-analytics";
import type { RevenueMetrics, RevenueTrendData, RevenueByPlan, AdminTimeRange } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config'
// ============================================================================
// Types
// ============================================================================

interface RevenueOverviewProps {
  timeRange?: AdminTimeRange;
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function formatRevenue(cents: number, compact = false): string {
  const dollars = cents / 100;
  if (compact && dollars >= 1000000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${(dollars / 1000000).toFixed(1)}M`;
  }
  if (compact && dollars >= 1000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${(dollars / 1000).toFixed(1)}K`;
  }
  return `${DEFAULT_CURRENCY_SYMBOL}${dollars.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function RevenueMetricCard({
  title,
  value,
  growth,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  growth?: number;
  icon: LucideIcon;
  description?: string;
}) {
  const isPositive = growth !== undefined && growth >= 0;
  const isNegative = growth !== undefined && growth < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "rounded-lg p-2",
          growth === undefined && "bg-muted",
          isPositive && "bg-green-100 dark:bg-green-900/30",
          isNegative && "bg-red-100 dark:bg-red-900/30"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            growth === undefined && "text-muted-foreground",
            isPositive && "text-green-600",
            isNegative && "text-red-600"
          )} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {growth !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs mt-1",
            isPositive && "text-green-600",
            isNegative && "text-red-600"
          )}>
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(growth).toFixed(1)}% from last period
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueByPlanCard({ data }: { data: RevenueByPlan[] }) {
  const PLAN_COLORS: Record<string, string> = {
    starter: "#3b82f6",
    professional: "#8b5cf6",
    enterprise: "#22c55e",
    trial: "#f59e0b",
    free: "#6b7280",
  };

  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Revenue by Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => (
          <div key={item.plan} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: PLAN_COLORS[item.plan] || "#6b7280" }}
                />
                <span className="capitalize">{item.plan}</span>
              </div>
              <span className="font-medium">{formatRevenue(item.revenue, true)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: PLAN_COLORS[item.plan] || "#6b7280",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.count} subscriptions</span>
              <span>{item.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RevenueTrendChart({ data }: { data: RevenueTrendData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
        <CardDescription>Monthly recurring revenue over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value + "-01");
                  return date.toLocaleDateString(DEFAULT_LOCALE, { month: "short" });
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatRevenue(value, true)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const date = new Date(label + "-01");
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <p className="font-medium">
                        {date.toLocaleDateString(DEFAULT_LOCALE, { month: "long", year: "numeric" })}
                      </p>
                      <p className="text-sm">
                        MRR: <span className="font-medium">{formatRevenue(payload[0].payload.mrr)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatRevenue(payload[0].payload.revenue)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function RevenueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[350px] md:col-span-2" />
        <Skeleton className="h-[350px]" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RevenueOverviewComponent({
  timeRange = "12m",
  className,
}: RevenueOverviewProps) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [trends, setTrends] = useState<RevenueTrendData[]>([]);
  const [byPlan, setByPlan] = useState<RevenueByPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [metricsData, trendsData, planData] = await Promise.all([
          getRevenueMetrics(timeRange),
          getRevenueTrends(timeRange),
          getRevenueByPlan(timeRange),
        ]);
        setMetrics(metricsData);
        setTrends(trendsData);
        setByPlan(planData);
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading || !metrics) {
    return <RevenueSkeleton />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <RevenueMetricCard
          title="Monthly Recurring Revenue"
          value={formatRevenue(metrics.mrr)}
          growth={metrics.mrrGrowth}
          icon={DollarSign}
        />
        <RevenueMetricCard
          title="Annual Run Rate"
          value={formatRevenue(metrics.arr)}
          icon={TrendingUp}
          description="Projected based on current MRR"
        />
        <RevenueMetricCard
          title="Total Revenue"
          value={formatRevenue(metrics.totalRevenue)}
          growth={metrics.revenueGrowth}
          icon={CreditCard}
        />
        <RevenueMetricCard
          title="Avg Revenue Per Account"
          value={formatRevenue(metrics.avgRevenuePerAccount)}
          growth={metrics.arpaGrowth}
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RevenueTrendChart data={trends} />
        </div>
        <RevenueByPlanCard data={byPlan} />
      </div>
    </div>
  );
}

// ============================================================================
// Compact Version for Dashboard
// ============================================================================

export function RevenueOverviewCompact({
  timeRange = "12m",
  className,
}: RevenueOverviewProps) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const metricsData = await getRevenueMetrics(timeRange);
        setMetrics(metricsData);
      } catch (error) {
        console.error("Failed to fetch revenue metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading || !metrics) {
    return <Skeleton className="h-32" />;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <Badge variant={metrics.mrrGrowth >= 0 ? "default" : "destructive"}>
            {metrics.mrrGrowth >= 0 ? "+" : ""}{metrics.mrrGrowth.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatRevenue(metrics.mrr)}</div>
        <p className="text-xs text-muted-foreground">MRR</p>
        <div className="mt-2 text-sm text-muted-foreground">
          ARR: {formatRevenue(metrics.arr)}
        </div>
      </CardContent>
    </Card>
  );
}

export default RevenueOverviewComponent;

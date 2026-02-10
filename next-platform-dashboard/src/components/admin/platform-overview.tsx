/**
 * Platform Overview Component
 * 
 * PHASE-DS-04A: Admin Dashboard - Platform Overview
 * 
 * Displays comprehensive platform metrics including users, agencies, sites, and modules.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Building2,
  Globe,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  PieChart,
  Layers,
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
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import type {
  PlatformOverviewMetrics,
  PlatformTrendData,
  AdminTimeRange,
} from "@/types/admin-analytics";
import { getPlatformOverview, getPlatformTrends } from "@/lib/actions/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_CURRENCY_SYMBOL } from '@/lib/locale-config';

// ============================================================================
// Types
// ============================================================================

interface PlatformOverviewProps {
  initialMetrics?: PlatformOverviewMetrics;
  timeRange?: AdminTimeRange;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  muted: "hsl(var(--muted-foreground))",
};

const PLAN_COLORS = {
  free: "#94a3b8",
  starter: "#3b82f6",
  professional: "#8b5cf6",
  enterprise: "#f59e0b",
};

// ============================================================================
// Helper Components
// ============================================================================

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  description,
  variant = "default",
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">{value}</h3>
              {change !== undefined && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "gap-1",
                    isPositive && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    isNegative && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : isNegative ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                  {Math.abs(change)}%
                </Badge>
              )}
            </div>
            {(description || changeLabel) && (
              <p className="text-xs text-muted-foreground">
                {description || changeLabel}
              </p>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-3",
            variant === "default" && "bg-primary/10 text-primary",
            variant === "success" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
            variant === "warning" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
            variant === "danger" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionCard({
  title,
  data,
  total,
  colors,
}: {
  title: string;
  data: { name: string; value: number }[];
  total: number;
  colors: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.value} ({percentage}%)
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                style={{
                  // @ts-expect-error CSS variable
                  "--progress-foreground": colors[item.name.toLowerCase()] || COLORS.primary,
                }}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TopModulesCard({ modules }: { modules: PlatformOverviewMetrics["modules"]["topModules"] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top Modules</CardTitle>
        <CardDescription>By installation count</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {modules.slice(0, 5).map((module, i) => (
            <div key={module.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">{module.name}</p>
                <p className="text-xs text-muted-foreground">
                  {module.installations} installations
                </p>
              </div>
              <Badge variant="secondary">{module.activeUsage} active</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Charts
// ============================================================================

function PlatformTrendsChart({
  data,
  metric = "agencies",
}: {
  data: PlatformTrendData[];
  metric?: "users" | "agencies" | "sites" | "revenue";
}) {
  const formatValue = (value: number) => {
    if (metric === "revenue") {
      return `${DEFAULT_CURRENCY_SYMBOL}${(value / 100).toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatValue(payload[0].value as number)}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={COLORS.primary}
            strokeWidth={2}
            fill="url(#colorMetric)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlanDistributionPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={PLAN_COLORS[entry.name.toLowerCase() as keyof typeof PLAN_COLORS] || COLORS.muted}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <p className="font-medium capitalize">{payload[0].name}</p>
                  <p className="text-sm text-muted-foreground">
                    {payload[0].value} agencies
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm capitalize">{value}</span>
            )}
          />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function PlatformOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
      <Skeleton className="h-[350px]" />
    </div>
  );
}

// ============================================================================
// Compact Version for Dashboard
// ============================================================================

export function PlatformOverviewCompact({
  timeRange = "30d",
  className,
}: Omit<PlatformOverviewProps, "initialMetrics">) {
  const [metrics, setMetrics] = useState<PlatformOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const metricsData = await getPlatformOverview(timeRange);
        setMetrics(metricsData);
      } catch (error) {
        console.error("Failed to fetch platform overview:", error);
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
        <CardTitle className="text-sm font-medium">Platform Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Users</p>
            <p className="text-xl font-bold">{metrics.users.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Agencies</p>
            <p className="text-xl font-bold">{metrics.agencies.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sites</p>
            <p className="text-xl font-bold">{metrics.sites.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Modules</p>
            <p className="text-xl font-bold">{metrics.modules.totalInstallations.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PlatformOverview({
  initialMetrics,
  timeRange = "30d",
  className,
}: PlatformOverviewProps) {
  const [metrics, setMetrics] = useState<PlatformOverviewMetrics | null>(initialMetrics || null);
  const [trends, setTrends] = useState<PlatformTrendData[]>([]);
  const [loading, setLoading] = useState(!initialMetrics);
  const [selectedMetric, setSelectedMetric] = useState<"users" | "agencies" | "sites" | "revenue">("agencies");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [metricsData, trendsData] = await Promise.all([
          getPlatformOverview(timeRange),
          getPlatformTrends(timeRange),
        ]);
        setMetrics(metricsData);
        setTrends(trendsData);
      } catch (error) {
        console.error("Failed to fetch platform overview:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading || !metrics) {
    return <PlatformOverviewSkeleton />;
  }

  const planData = [
    { name: "Free", value: metrics.agencies.byPlan.free },
    { name: "Starter", value: metrics.agencies.byPlan.starter },
    { name: "Professional", value: metrics.agencies.byPlan.professional },
    { name: "Enterprise", value: metrics.agencies.byPlan.enterprise },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics.users.total.toLocaleString()}
          change={metrics.users.growthPercent}
          description={`${metrics.users.active.toLocaleString()} active`}
          icon={Users}
        />
        <MetricCard
          title="Total Agencies"
          value={metrics.agencies.total.toLocaleString()}
          change={metrics.agencies.growthPercent}
          description={`${metrics.agencies.newThisMonth} new this month`}
          icon={Building2}
        />
        <MetricCard
          title="Published Sites"
          value={metrics.sites.published.toLocaleString()}
          description={`${metrics.sites.publishedPercent}% of ${metrics.sites.total} total`}
          icon={Globe}
          variant="success"
        />
        <MetricCard
          title="Module Installations"
          value={metrics.modules.totalInstallations.toLocaleString()}
          description={`${metrics.modules.avgPerAgency} avg per agency`}
          icon={Package}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agency Distribution</CardTitle>
            <CardDescription>By subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanDistributionPie data={planData} />
          </CardContent>
        </Card>

        <DistributionCard
          title="User Roles"
          data={[
            { name: "Super Admin", value: metrics.users.byRole.superAdmin },
            { name: "Admin", value: metrics.users.byRole.admin },
            { name: "Member", value: metrics.users.byRole.member },
          ]}
          total={metrics.users.total}
          colors={{
            "super admin": COLORS.danger,
            admin: COLORS.warning,
            member: COLORS.info,
          }}
        />

        <TopModulesCard modules={metrics.modules.topModules} />
      </div>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Platform Growth</CardTitle>
              <CardDescription>Trends over time</CardDescription>
            </div>
            <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as typeof selectedMetric)}>
              <TabsList>
                <TabsTrigger value="agencies" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  Agencies
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-1">
                  <Users className="h-3 w-3" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="sites" className="gap-1">
                  <Globe className="h-3 w-3" />
                  Sites
                </TabsTrigger>
                <TabsTrigger value="revenue" className="gap-1">
                  <BarChart3 className="h-3 w-3" />
                  Revenue
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <PlatformTrendsChart data={trends} metric={selectedMetric} />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Today</span>
            </div>
            <p className="text-2xl font-bold mt-2">{metrics.users.newToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Pages</span>
            </div>
            <p className="text-2xl font-bold mt-2">{metrics.sites.totalPages.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Modules Available</span>
            </div>
            <p className="text-2xl font-bold mt-2">{metrics.modules.totalAvailable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Trial Agencies</span>
            </div>
            <p className="text-2xl font-bold mt-2">{metrics.agencies.trial}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PlatformOverview;

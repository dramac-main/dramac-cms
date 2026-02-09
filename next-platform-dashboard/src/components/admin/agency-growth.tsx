/**
 * Agency Growth Component
 * 
 * PHASE-DS-04B: Admin Dashboard - Agency Metrics
 * 
 * Charts showing agency growth trends, churn, and lifecycle metrics.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
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
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import { getAgencyGrowth } from "@/lib/actions/admin-analytics";
import type { AgencyGrowthData, AdminTimeRange } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

import { DEFAULT_LOCALE } from '@/lib/locale-config'
// ============================================================================
// Types
// ============================================================================

interface AgencyGrowthProps {
  timeRange?: AdminTimeRange;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  new: "#22c55e",
  churned: "#ef4444",
  net: "hsl(var(--primary))",
  conversion: "#3b82f6",
  ltv: "#8b5cf6",
};

// ============================================================================
// Helper Components
// ============================================================================

function GrowthSummaryCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  change?: number;
  isPositive?: boolean;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 mt-1 text-xs",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(change)}% from last period
              </div>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-2",
            isPositive === undefined && "bg-muted",
            isPositive === true && "bg-green-100 dark:bg-green-900/30",
            isPositive === false && "bg-red-100 dark:bg-red-900/30"
          )}>
            <Icon className={[
              "h-4 w-4",
              isPositive === undefined ? "text-muted-foreground" : "",
              isPositive === true ? "text-green-600" : "",
              isPositive === false ? "text-red-600" : ""
            ].filter(Boolean).join(" ")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Charts
// ============================================================================

function NewVsChurnedChart({ data }: { data: AgencyGrowthData[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
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
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const date = new Date(label + "-01");
              return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                  <p className="font-medium mb-2">
                    {date.toLocaleDateString(DEFAULT_LOCALE, { month: "long", year: "numeric" })}
                  </p>
                  {payload.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">{entry.name}:</span>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend />
          <Bar dataKey="newAgencies" name="New" fill={COLORS.new} radius={[4, 4, 0, 0]} />
          <Bar dataKey="churnedAgencies" name="Churned" fill={COLORS.churned} radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="netGrowth"
            name="Net Growth"
            stroke={COLORS.net}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ConversionRateChart({ data }: { data: AgencyGrowthData[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.conversion} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.conversion} stopOpacity={0} />
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
            tickFormatter={(value) => `${value}%`}
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
                  <p className="text-sm text-muted-foreground">
                    Conversion Rate: <span className="font-medium">{payload[0].value?.toFixed(1)}%</span>
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="conversionRate"
            stroke={COLORS.conversion}
            strokeWidth={2}
            fill="url(#colorConversion)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LTVChart({ data }: { data: AgencyGrowthData[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorLTV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.ltv} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.ltv} stopOpacity={0} />
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
            tickFormatter={(value) => `$${(value / 100).toLocaleString()}`}
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
                  <p className="text-sm text-muted-foreground">
                    Avg LTV: <span className="font-medium">${((payload[0].value as number) / 100).toLocaleString()}</span>
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="avgLifetimeValue"
            stroke={COLORS.ltv}
            strokeWidth={2}
            fill="url(#colorLTV)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function GrowthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[350px]" />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AgencyGrowthComponent({
  timeRange = "12m",
  className,
}: AgencyGrowthProps) {
  const [data, setData] = useState<AgencyGrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"growth" | "conversion" | "ltv">("growth");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const growthData = await getAgencyGrowth(timeRange);
        setData(growthData);
      } catch (error) {
        console.error("Failed to fetch agency growth:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading) {
    return <GrowthSkeleton />;
  }

  // Calculate summary metrics
  const totalNew = data.reduce((sum, d) => sum + d.newAgencies, 0);
  const totalChurned = data.reduce((sum, d) => sum + d.churnedAgencies, 0);
  const totalNet = data.reduce((sum, d) => sum + d.netGrowth, 0);
  const avgConversion = data.length > 0 
    ? data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length 
    : 0;
  const avgLTV = data.length > 0 
    ? data.reduce((sum, d) => sum + d.avgLifetimeValue, 0) / data.length 
    : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GrowthSummaryCard
          title="New Agencies"
          value={totalNew}
          isPositive={true}
          icon={TrendingUp}
        />
        <GrowthSummaryCard
          title="Churned"
          value={totalChurned}
          isPositive={false}
          icon={TrendingDown}
        />
        <GrowthSummaryCard
          title="Net Growth"
          value={totalNet > 0 ? `+${totalNet}` : totalNet}
          isPositive={totalNet > 0}
          icon={Users}
        />
        <GrowthSummaryCard
          title="Avg LTV"
          value={`$${Math.floor(avgLTV / 100).toLocaleString()}`}
          icon={BarChart3}
        />
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agency Growth Trends</CardTitle>
              <CardDescription>Historical growth metrics over time</CardDescription>
            </div>
            <Tabs value={activeChart} onValueChange={(v) => setActiveChart(v as typeof activeChart)}>
              <TabsList>
                <TabsTrigger value="growth">Growth</TabsTrigger>
                <TabsTrigger value="conversion">Conversion</TabsTrigger>
                <TabsTrigger value="ltv">LTV</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {activeChart === "growth" && <NewVsChurnedChart data={data} />}
          {activeChart === "conversion" && <ConversionRateChart data={data} />}
          {activeChart === "ltv" && <LTVChart data={data} />}
        </CardContent>
      </Card>

      {/* Period Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Period</th>
                  <th className="text-right py-2 font-medium">New</th>
                  <th className="text-right py-2 font-medium">Churned</th>
                  <th className="text-right py-2 font-medium">Net</th>
                  <th className="text-right py-2 font-medium">Conversion</th>
                  <th className="text-right py-2 font-medium">Avg LTV</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(-6).reverse().map((row) => {
                  const date = new Date(row.period + "-01");
                  return (
                    <tr key={row.period} className="border-b last:border-0">
                      <td className="py-2">
                        {date.toLocaleDateString(DEFAULT_LOCALE, { month: "short", year: "numeric" })}
                      </td>
                      <td className="text-right py-2 text-green-600">+{row.newAgencies}</td>
                      <td className="text-right py-2 text-red-600">-{row.churnedAgencies}</td>
                      <td className={cn(
                        "text-right py-2 font-medium",
                        row.netGrowth > 0 && "text-green-600",
                        row.netGrowth < 0 && "text-red-600"
                      )}>
                        {row.netGrowth > 0 ? `+${row.netGrowth}` : row.netGrowth}
                      </td>
                      <td className="text-right py-2">{row.conversionRate.toFixed(1)}%</td>
                      <td className="text-right py-2">${Math.floor(row.avgLifetimeValue / 100).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgencyGrowthComponent;

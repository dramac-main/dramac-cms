/**
 * Subscription Metrics Component
 * 
 * PHASE-DS-05: Billing & Revenue Dashboards
 * 
 * Displays subscription analytics including counts, churn, and conversion rates.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  UserPlus,
  UserMinus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
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
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { getSubscriptionMetrics, getPaymentMetrics, getCustomerMetrics } from "@/lib/actions/admin-analytics";
import type { SubscriptionMetrics, PaymentMetrics, CustomerMetrics, AdminTimeRange } from "@/types/admin-analytics";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// Types
// ============================================================================

interface SubscriptionMetricsProps {
  timeRange?: AdminTimeRange;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  neutral: "#3b82f6",
  muted: "#6b7280",
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ============================================================================
// Helper Components
// ============================================================================

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  subtitle,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isPositive && "text-green-600",
                isNegative && "text-red-600",
                !isPositive && !isNegative && "text-muted-foreground"
              )}>
                {isPositive && <ArrowUpRight className="h-3 w-3" />}
                {isNegative && <ArrowDownRight className="h-3 w-3" />}
                {change > 0 ? "+" : ""}{change.toFixed(1)}%
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-2",
            trend === "up" && "bg-green-100 dark:bg-green-900/30",
            trend === "down" && "bg-red-100 dark:bg-red-900/30",
            !trend && "bg-muted"
          )}>
            <Icon className={cn(
              "h-4 w-4",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              !trend && "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChurnRateGauge({ rate, threshold = 5 }: { rate: number; threshold?: number }) {
  const isHealthy = rate <= threshold;
  const color = isHealthy ? COLORS.success : rate <= threshold * 1.5 ? COLORS.warning : COLORS.danger;
  const percentage = Math.min(rate * 10, 100); // Scale to 100 for display

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-24 h-12 overflow-hidden">
        {/* Gauge background */}
        <div className="absolute inset-0 border-8 border-muted rounded-t-full" />
        {/* Gauge fill */}
        <div
          className="absolute inset-0 border-8 rounded-t-full origin-bottom transition-transform"
          style={{
            borderColor: color,
            transform: `rotate(${(percentage / 100) * 180 - 180}deg)`,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color }}>{rate.toFixed(1)}%</p>
        <p className="text-xs text-muted-foreground">Churn Rate</p>
      </div>
    </div>
  );
}

function ConversionFunnel({ trial, conversion }: { trial: number; conversion: number }) {
  const converted = Math.round(trial * (conversion / 100));
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Trial Conversion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Trials</span>
              <span className="font-medium">{trial}</span>
            </div>
            <div className="h-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Converted</span>
              <span className="font-medium">{converted}</span>
            </div>
            <div className="h-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${conversion}%` }}
              />
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <Badge variant={conversion >= 50 ? "default" : conversion >= 30 ? "secondary" : "destructive"}>
                {conversion.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentHealthCard({ data }: { data: PaymentMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Payment Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{data.successRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{data.failureRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Failure Rate</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Refund Rate</span>
              <span className="font-medium">{data.refundRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Refunded</span>
              <span className="font-medium">{formatCurrency(data.refundedAmount)}</span>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-green-600">{data.successfulPayments}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{data.pendingPayments}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{data.failedPayments}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerHealthCard({ data }: { data: CustomerMetrics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Customer Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-lg font-bold text-green-600">{data.healthy}</p>
              <p className="text-xs text-muted-foreground">Healthy</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-lg font-bold text-amber-600">{data.atRisk}</p>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-lg font-bold text-red-600">{data.churning}</p>
              <p className="text-xs text-muted-foreground">Churning</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg Customer Age</span>
              <span className="font-medium">{Math.floor(data.avgCustomerAge / 30)} months</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Health Score</span>
              <Badge variant={data.npsScore >= 50 ? "default" : data.npsScore >= 0 ? "secondary" : "destructive"}>
                NPS: {data.npsScore}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[280px]" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SubscriptionMetricsComponent({
  timeRange = "12m",
  className,
}: SubscriptionMetricsProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionMetrics | null>(null);
  const [payments, setPayments] = useState<PaymentMetrics | null>(null);
  const [customers, setCustomers] = useState<CustomerMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [subData, payData, custData] = await Promise.all([
          getSubscriptionMetrics(timeRange),
          getPaymentMetrics(timeRange),
          getCustomerMetrics(timeRange),
        ]);
        setSubscriptions(subData);
        setPayments(payData);
        setCustomers(custData);
      } catch (error) {
        console.error("Failed to fetch subscription metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading || !subscriptions || !payments || !customers) {
    return <SubscriptionSkeleton />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Subscriptions"
          value={subscriptions.totalActive.toLocaleString()}
          change={subscriptions.activeGrowth}
          icon={Users}
          trend={subscriptions.activeGrowth >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="New This Period"
          value={`+${subscriptions.newThisPeriod}`}
          icon={UserPlus}
          trend="up"
          subtitle="New subscriptions"
        />
        <MetricCard
          title="Churned"
          value={subscriptions.churnedThisPeriod}
          icon={UserMinus}
          trend="down"
          subtitle="Cancellations"
        />
        <MetricCard
          title="Avg Value"
          value={formatCurrency(subscriptions.avgSubscriptionValue)}
          icon={Activity}
          subtitle="Per subscription"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConversionFunnel
          trial={subscriptions.trialActive}
          conversion={subscriptions.trialConversionRate}
        />
        <PaymentHealthCard data={payments} />
        <CustomerHealthCard data={customers} />
      </div>

      {/* Churn Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Subscription Health Overview</CardTitle>
          <CardDescription>Key retention and churn metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
              <ChurnRateGauge rate={subscriptions.churnRate} />
            </div>
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Net Growth</p>
                <p className={cn(
                  "text-3xl font-bold",
                  subscriptions.newThisPeriod - subscriptions.churnedThisPeriod >= 0 
                    ? "text-green-600" 
                    : "text-red-600"
                )}>
                  {subscriptions.newThisPeriod - subscriptions.churnedThisPeriod >= 0 ? "+" : ""}
                  {subscriptions.newThisPeriod - subscriptions.churnedThisPeriod}
                </p>
                <p className="text-xs text-muted-foreground">This period</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {(100 - subscriptions.churnRate).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Monthly</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Trial Pool</p>
                <p className="text-3xl font-bold text-amber-600">
                  {subscriptions.trialActive}
                </p>
                <p className="text-xs text-muted-foreground">Active trials</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Compact Version for Dashboard
// ============================================================================

export function SubscriptionMetricsCompact({
  timeRange = "12m",
  className,
}: SubscriptionMetricsProps) {
  const [data, setData] = useState<SubscriptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const subData = await getSubscriptionMetrics(timeRange);
        setData(subData);
      } catch (error) {
        console.error("Failed to fetch subscription metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading || !data) {
    return <Skeleton className="h-32" />;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <Badge variant={data.churnRate < 5 ? "default" : "destructive"}>
            {data.churnRate.toFixed(1)}% churn
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data.totalActive.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">Active subscriptions</p>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="text-green-600">+{data.newThisPeriod} new</span>
          <span className="text-red-600">-{data.churnedThisPeriod} churned</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default SubscriptionMetricsComponent;

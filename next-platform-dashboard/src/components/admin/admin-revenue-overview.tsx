/**
 * Admin Revenue Overview Component
 *
 * Phase BIL-09: Super Admin Revenue Dashboard
 *
 * Comprehensive revenue overview with:
 * - 4 stat cards (MRR, ARR, Agencies, Churn)
 * - Revenue chart (12-month MRR history)
 * - Plan distribution chart
 * - Trial funnel
 * - Cancellation reasons
 * - Platform costs vs revenue
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getRevenueOverview,
  getMrrHistory,
  getPlanDistribution,
  getTrialFunnel,
  getCancellationReasons,
  getPlatformCostEstimate,
  type RevenueOverview,
  type MrrDataPoint,
  type PlanDistribution,
  type TrialFunnel,
  type CancellationReasonData,
  type CostEstimate,
} from "@/lib/paddle/billing-actions";

const PLAN_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  growth: "#8b5cf6",
  agency: "#f59e0b",
  free: "#6b7280",
  trial: "#10b981",
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function AdminRevenueOverview() {
  const [overview, setOverview] = useState<RevenueOverview | null>(null);
  const [mrrHistory, setMrrHistory] = useState<MrrDataPoint[]>([]);
  const [planDist, setPlanDist] = useState<PlanDistribution | null>(null);
  const [trialFunnel, setTrialFunnel] = useState<TrialFunnel | null>(null);
  const [cancelReasons, setCancelReasons] = useState<CancellationReasonData[]>(
    [],
  );
  const [costs, setCosts] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          overviewRes,
          historyRes,
          planRes,
          trialRes,
          reasonsRes,
          costsRes,
        ] = await Promise.all([
          getRevenueOverview(),
          getMrrHistory(12),
          getPlanDistribution(),
          getTrialFunnel(),
          getCancellationReasons(30),
          getPlatformCostEstimate(),
        ]);

        if (overviewRes.success && overviewRes.data) {
          setOverview(overviewRes.data);
        }
        if (historyRes.success && historyRes.data) {
          setMrrHistory(historyRes.data);
        }
        if (planRes.success && planRes.data) {
          setPlanDist(planRes.data);
        }
        if (trialRes.success && trialRes.data) {
          setTrialFunnel(trialRes.data);
        }
        if (reasonsRes.success && reasonsRes.data) {
          setCancelReasons(reasonsRes.data);
        }
        if (costsRes.success && costsRes.data) {
          setCosts(costsRes.data);
        }
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview - 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="MRR"
          value={overview ? formatCents(overview.mrr) : "$0"}
          change={overview?.mrrGrowth || 0}
          icon={Coins}
        />
        <StatCard
          title="ARR"
          value={overview ? formatCents(overview.arr) : "$0"}
          change={overview?.mrrGrowth || 0}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Agencies"
          value={String(overview?.totalAgencies || 0)}
          icon={Users}
        />
        <StatCard
          title="Churn Rate"
          value={`${overview?.churnRate || 0}%`}
          invertChange
          icon={Activity}
        />
      </div>

      {/* Revenue Chart + Plan Distribution */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (Last 12 Months)</CardTitle>
            <CardDescription>Monthly Recurring Revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis
                    fontSize={12}
                    tickFormatter={(v) => `$${(v / 100).toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={((value: number) => formatCents(value)) as any}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newMrr"
                    name="New MRR"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="churnedMrr"
                    name="Churned"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Agencies per plan</CardDescription>
          </CardHeader>
          <CardContent>
            {planDist && (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(planDist)
                          .filter(([, v]) => v > 0)
                          .map(([key, value]) => ({
                            name: key.charAt(0).toUpperCase() + key.slice(1),
                            value,
                          }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {Object.entries(planDist)
                          .filter(([, v]) => v > 0)
                          .map(([key]) => (
                            <Cell
                              key={key}
                              fill={PLAN_COLORS[key] || "#6b7280"}
                            />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  {Object.entries(planDist)
                    .filter(([, v]) => v > 0)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: PLAN_COLORS[key] || "#6b7280",
                            }}
                          />
                          <span className="capitalize">{key}</span>
                        </div>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trial Funnel + Cancellation Reasons */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Trial Funnel</CardTitle>
            <CardDescription>
              Conversion rate:{" "}
              <span className="font-bold text-green-600">
                {trialFunnel?.conversionRate || 0}%
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trialFunnel && (
              <div className="space-y-4">
                <FunnelBar
                  label="Started"
                  value={trialFunnel.started}
                  max={trialFunnel.started || 1}
                  color="bg-blue-500"
                />
                <FunnelBar
                  label="Active"
                  value={trialFunnel.active}
                  max={trialFunnel.started || 1}
                  color="bg-amber-500"
                />
                <FunnelBar
                  label="Converted"
                  value={trialFunnel.converted}
                  max={trialFunnel.started || 1}
                  color="bg-green-500"
                />
                <FunnelBar
                  label="Expired"
                  value={trialFunnel.expired}
                  max={trialFunnel.started || 1}
                  color="bg-red-500"
                />
              </div>
            )}
            {!trialFunnel && (
              <p className="text-sm text-muted-foreground">No trial data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellation Reasons</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {cancelReasons.length > 0 ? (
              <div className="space-y-3">
                {cancelReasons.map((r) => (
                  <div key={r.reason} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{r.reason}</span>
                      <span className="font-medium">
                        {r.count} ({r.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No cancellations in the last 30 days
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Costs vs Revenue */}
      {costs && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Costs vs Revenue</CardTitle>
            <CardDescription>
              Monthly breakdown — Net margin:{" "}
              <span
                className={cn(
                  "font-bold",
                  costs.netMarginPercent >= 70
                    ? "text-green-600"
                    : costs.netMarginPercent >= 50
                      ? "text-amber-600"
                      : "text-red-600",
                )}
              >
                {costs.netMarginPercent}%
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <CostItem
                label="Revenue"
                value={costs.revenue}
                color="text-green-600"
              />
              <CostItem
                label="Paddle Fees"
                value={costs.paddleFees}
                color="text-red-500"
                negative
              />
              <CostItem
                label="Variable Costs"
                value={costs.variableCosts}
                color="text-orange-500"
                negative
              />
              <CostItem
                label="Fixed Costs"
                value={costs.fixedCosts}
                color="text-orange-500"
                negative
              />
              <CostItem
                label="Net Revenue"
                value={costs.netRevenue}
                color="text-green-700"
                bold
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
  title,
  value,
  change,
  invertChange,
  icon: Icon,
}: {
  title: string;
  value: string;
  change?: number;
  invertChange?: boolean;
  icon: typeof Coins;
}) {
  const isPositive = invertChange ? (change || 0) <= 0 : (change || 0) >= 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                isPositive
                  ? "text-green-600 bg-green-100"
                  : "text-red-600 bg-red-100",
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CostItem({
  label,
  value,
  color,
  negative,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-lg", color, bold && "font-bold")}>
        {negative ? "-" : ""}
        {formatCents(Math.abs(value))}
      </p>
    </div>
  );
}

/**
 * LP Analytics Dashboard
 * Phase LPB-02 + LPB-08: Enhanced Analytics & Conversion Tracking
 *
 * Detailed analytics view for a single landing page.
 * Date range filtering, summary cards, daily trends, engagement metrics,
 * traffic sources, device breakdown, form submissions, CSV export.
 */
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Eye,
  Users,
  Target,
  Clock,
  DollarSign,
  Percent,
  FileEdit,
  ExternalLink,
  Download,
  MousePointerClick,
  ArrowDown,
  Timer,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { LP_STATUS_CONFIG } from "../../lib/lp-builder-constants";
import {
  getLPAnalytics,
  getLPFormSubmissions,
  exportLPFormSubmissions,
} from "../../actions/lp-builder-actions";
import type {
  LandingPageStudio,
  LPAnalyticsSummary,
  LPFormSubmission,
} from "../../types/lp-builder-types";

// ─── Types ─────────────────────────────────────────────────────

interface LPAnalyticsDashboardProps {
  landingPage: LandingPageStudio;
  analytics: LPAnalyticsSummary;
  recentSubmissions?: LPFormSubmission[];
  siteId: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
}

type DateRangePreset = "7d" | "30d" | "90d" | "all";

// ─── Chart Colors ──────────────────────────────────────────────

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 80% 60%))",
  "hsl(var(--chart-3, 280 80% 60%))",
  "hsl(var(--chart-4, 40 90% 55%))",
  "hsl(var(--chart-5, 160 80% 45%))",
];

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

// ─── Helpers ───────────────────────────────────────────────────

function getDateRange(preset: DateRangePreset):
  | {
      from: string;
      to: string;
    }
  | undefined {
  if (preset === "all") return undefined;
  const now = new Date();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const from = new Date(now.getTime() - days * 86400000);
  return { from: from.toISOString(), to: now.toISOString() };
}

function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
  }
  return `${Math.round(seconds)}s`;
}

// ─── Component ─────────────────────────────────────────────────

export function LPAnalyticsDashboard({
  landingPage,
  analytics: initialAnalytics,
  recentSubmissions: initialSubmissions = [],
  siteId,
  siteSubdomain,
  siteCustomDomain,
}: LPAnalyticsDashboardProps) {
  const [analytics, setAnalytics] =
    useState<LPAnalyticsSummary>(initialAnalytics);
  const [submissions, setSubmissions] =
    useState<LPFormSubmission[]>(initialSubmissions);
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const basePath = `/dashboard/sites/${siteId}/marketing/landing-pages`;
  const statusConfig =
    LP_STATUS_CONFIG[landingPage.status as keyof typeof LP_STATUS_CONFIG] ||
    LP_STATUS_CONFIG.draft;
  const domain =
    siteCustomDomain || (siteSubdomain ? `${siteSubdomain}.dramac.app` : null);
  const liveUrl = domain ? `https://${domain}/lp/${landingPage.slug}` : null;

  // Refresh analytics when date range changes
  const handleDateRangeChange = useCallback(
    async (preset: DateRangePreset) => {
      setDateRange(preset);
      setIsRefreshing(true);
      try {
        const range = getDateRange(preset);
        const [newAnalytics, newSubs] = await Promise.all([
          getLPAnalytics(landingPage.id, range),
          getLPFormSubmissions(landingPage.id, { pageSize: 10 }),
        ]);
        setAnalytics(newAnalytics);
        setSubmissions(newSubs.submissions);
      } catch (err) {
        console.error("[LP Analytics] Refresh error:", err);
        toast.error("Failed to refresh analytics");
      } finally {
        setIsRefreshing(false);
      }
    },
    [landingPage.id],
  );

  // Export submissions CSV
  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await exportLPFormSubmissions(landingPage.id, "csv");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.data) {
        toast.info("No submissions to export");
        return;
      }
      // Trigger download
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${landingPage.slug}-submissions.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [landingPage.id, landingPage.slug]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={basePath}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{landingPage.title}</h2>
              <Badge variant="secondary" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              /lp/{landingPage.slug}
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View live
                </a>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Filter */}
          <Select
            value={dateRange}
            onValueChange={(v) => handleDateRangeChange(v as DateRangePreset)}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Link href={`${basePath}/${landingPage.id}/edit`}>
            <Button size="sm">
              <FileEdit className="mr-2 h-4 w-4" />
              Edit Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${isRefreshing ? "opacity-60 pointer-events-none" : ""}`}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Total Visits</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {analytics.totalVisits.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.uniqueVisitors.toLocaleString()} unique
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Conversions</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {analytics.totalSubmissions.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs font-medium">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {analytics.conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Avg Time</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatTime(analytics.avgTimeOnPage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Revenue</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              ${analytics.revenueAttributed.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Timer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Avg Time on Page
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatTime(analytics.avgTimeOnPage)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <ArrowDown className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Avg Scroll Depth
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {analytics.avgScrollDepth}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <MousePointerClick className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
                <p className="text-lg font-semibold tabular-nums">
                  {analytics.bounceRate}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Visits & Conversions Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.dailyStats}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) =>
                      new Date(val).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={2}
                    dot={false}
                    name="Visits"
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={false}
                    name="Conversions"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.trafficSources.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.trafficSources}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="visits"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                    name="Visits"
                  />
                  <Bar
                    dataKey="conversions"
                    fill={CHART_COLORS[1]}
                    radius={[4, 4, 0, 0]}
                    name="Conversions"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown + Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.deviceBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="visits"
                      nameKey="device"
                    >
                      {analytics.deviceBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.deviceBreakdown.map((item, index) => {
                    const totalDeviceVisits = analytics.deviceBreakdown.reduce(
                      (s, d) => s + d.visits,
                      0,
                    );
                    const pct =
                      totalDeviceVisits > 0
                        ? Math.round((item.visits / totalDeviceVisits) * 100)
                        : 0;
                    return (
                      <div
                        key={item.device}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-sm capitalize">
                          {item.device}
                        </span>
                        <span className="text-sm text-muted-foreground ml-auto tabular-nums">
                          {pct}% ({item.visits})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Recent Submissions</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleExportCSV}
              disabled={isExporting || submissions.length === 0}
            >
              <Download className="mr-1.5 h-3 w-3" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </CardHeader>
          <CardContent>
            {submissions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.slice(0, 8).map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="text-xs truncate max-w-[100px]">
                          {sub.name || "—"}
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[150px]">
                          {sub.email || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sub.utmSource || "direct"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right">
                          {new Date(sub.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                No submissions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

/**
 * Admin Invoicing Dashboard (INV-12)
 *
 * Platform-wide invoicing stats dashboard for super admins.
 * Shows metric cards, top sites by revenue, and status distribution.
 */

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  DollarSign,
  Building2,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  getInvoicingPlatformStats,
  getInvoicingUsageTrends,
} from "../../actions/admin-actions";
import type { PlatformInvoicingStats, UsageTrend } from "../../types";

function formatCurrency(cents: number): string {
  return `K ${(cents / 100).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminInvoicingDashboard() {
  const [stats, setStats] = useState<PlatformInvoicingStats | null>(null);
  const [trends, setTrends] = useState<UsageTrend[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [statsData, trendsData] = await Promise.all([
        getInvoicingPlatformStats(),
        getInvoicingUsageTrends("monthly"),
      ]);
      setStats(statsData);
      setTrends(trendsData);
    });
  }, []);

  if (isPending && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    viewed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    partial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    void: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sites Using Invoicing
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSitesUsingInvoicing}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.round(stats.averageInvoicesPerSite)} invoices/site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalInvoicesCreated.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.monthlyGrowthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(stats.monthlyGrowthRate)}% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue Processed
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenueProcessed)}
            </div>
            <p className="text-xs text-muted-foreground">
              From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monthlyGrowthRate >= 0 ? "+" : ""}
              {stats.monthlyGrowthRate}%
            </div>
            <p className="text-xs text-muted-foreground">Monthly growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution + Top Sites */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>
              Across all sites on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.invoicesByStatus)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={statusColors[status] || ""}
                      >
                        {status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              {Object.keys(stats.invoicesByStatus).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No invoices yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Sites by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sites by Revenue</CardTitle>
            <CardDescription>Highest revenue-generating sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topSitesByRevenue.map((site, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{site.siteName}</p>
                    <p className="text-xs text-muted-foreground">
                      {site.agencyName}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(site.revenue)}
                  </span>
                </div>
              ))}
              {stats.topSitesByRevenue.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No revenue data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends (Monthly)</CardTitle>
            <CardDescription>
              Invoice creation and payment activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Period</th>
                    <th className="text-right py-2 font-medium">Invoices</th>
                    <th className="text-right py-2 font-medium">Revenue</th>
                    <th className="text-right py-2 font-medium">Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((trend) => (
                    <tr key={trend.period} className="border-b last:border-0">
                      <td className="py-2">{trend.period}</td>
                      <td className="py-2 text-right">
                        {trend.invoicesCreated}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(trend.revenueProcessed)}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(trend.paymentsReceived)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

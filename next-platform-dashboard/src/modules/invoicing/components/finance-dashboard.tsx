"use client";

/**
 * FinanceDashboard — Main landing page for the Invoicing Module
 *
 * Phase INV-07: Financial Dashboard
 *
 * Grid layout of metric cards + charts, replaces the old redirect-to-invoices page.
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  Calendar,
  Percent,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "./metric-card";
import { RevenueChart } from "./revenue-chart";
import { CashFlowChart } from "./cash-flow-chart";
import { InvoiceStatusChart } from "./invoice-status-chart";
import { PaymentMethodChart } from "./payment-method-chart";
import { RecentInvoicesWidget } from "./recent-invoices-widget";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import { getDashboardMetrics } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { DashboardMetrics, DateRange } from "../types/report-types";

export function FinanceDashboard() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getDashboardMetrics(siteId)
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your invoicing and financial performance
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Revenue"
            value={formatInvoiceAmount(metrics?.totalRevenue ?? 0, currency)}
            icon={DollarSign}
            trend={metrics?.revenueGrowthPercent}
            trendLabel="vs last month"
            variant="success"
          />
          <MetricCard
            label="Outstanding"
            value={formatInvoiceAmount(
              metrics?.totalOutstanding ?? 0,
              currency,
            )}
            subText={`${metrics?.invoicesSent ?? 0} invoices`}
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            label="Overdue"
            value={formatInvoiceAmount(metrics?.totalOverdue ?? 0, currency)}
            subText={`${metrics?.overdueCount ?? 0} overdue`}
            icon={AlertTriangle}
            variant="danger"
          />
          <MetricCard
            label="Net Profit"
            value={formatInvoiceAmount(metrics?.netProfit ?? 0, currency)}
            subText={`Collection rate: ${metrics?.collectionRate ?? 0}%`}
            icon={TrendingUp}
            variant={(metrics?.netProfit ?? 0) >= 0 ? "success" : "danger"}
          />
        </div>
      )}

      {/* Secondary Metrics */}
      {!loading && metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Total Expenses"
            value={formatInvoiceAmount(metrics.totalExpenses, currency)}
            icon={FileText}
          />
          <MetricCard
            label="Avg Payment Days"
            value={`${metrics.averagePaymentDays} days`}
            subText="Average time to collect"
            icon={Calendar}
          />
          <MetricCard
            label="Collection Rate"
            value={`${metrics.collectionRate}%`}
            subText="Of invoiced amount collected"
            icon={Percent}
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart
          siteId={siteId}
          dateRange={dateRange}
          currency={currency}
        />
        <CashFlowChart
          siteId={siteId}
          dateRange={dateRange}
          currency={currency}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <InvoiceStatusChart siteId={siteId} />
        <PaymentMethodChart
          siteId={siteId}
          dateRange={dateRange}
          currency={currency}
        />
        <RecentInvoicesWidget siteId={siteId} currency={currency} />
      </div>
    </div>
  );
}

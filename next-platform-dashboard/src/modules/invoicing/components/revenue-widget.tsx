"use client";

/**
 * RevenueWidget — Card widget: total revenue with period comparison
 *
 * Phase INV-07: Financial Dashboard
 */

import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "./metric-card";
import { getDashboardMetrics } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { DashboardMetrics } from "../types/report-types";

interface RevenueWidgetProps {
  siteId: string;
  currency?: string;
}

export function RevenueWidget({
  siteId,
  currency = "ZMW",
}: RevenueWidgetProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboardMetrics(siteId)
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <MetricCard
        label="Total Revenue"
        value={formatInvoiceAmount(0, currency)}
        icon={DollarSign}
      />
    );
  }

  return (
    <MetricCard
      label="Total Revenue"
      value={formatInvoiceAmount(metrics.totalRevenue, currency)}
      icon={DollarSign}
      trend={metrics.revenueGrowthPercent}
      trendLabel="vs last month"
      variant="success"
    />
  );
}

"use client";

/**
 * OverdueWidget — Card widget: total overdue amount with count, red styling
 *
 * Phase INV-07: Financial Dashboard
 */

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "./metric-card";
import { getDashboardMetrics } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { DashboardMetrics } from "../types/report-types";

interface OverdueWidgetProps {
  siteId: string;
  currency?: string;
}

export function OverdueWidget({
  siteId,
  currency = "ZMW",
}: OverdueWidgetProps) {
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
        label="Overdue"
        value={formatInvoiceAmount(0, currency)}
        icon={AlertTriangle}
      />
    );
  }

  return (
    <MetricCard
      label="Overdue"
      value={formatInvoiceAmount(metrics.totalOverdue, currency)}
      subText={`${metrics.overdueCount} overdue invoices`}
      icon={AlertTriangle}
      variant="danger"
    />
  );
}

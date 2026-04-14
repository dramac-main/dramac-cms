"use client";

/**
 * OutstandingWidget — Card widget: total outstanding amount with invoice count
 *
 * Phase INV-07: Financial Dashboard
 */

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "./metric-card";
import { getDashboardMetrics } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { DashboardMetrics } from "../types/report-types";

interface OutstandingWidgetProps {
  siteId: string;
  currency?: string;
}

export function OutstandingWidget({
  siteId,
  currency = "ZMW",
}: OutstandingWidgetProps) {
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
        label="Outstanding"
        value={formatInvoiceAmount(0, currency)}
        icon={Clock}
      />
    );
  }

  return (
    <MetricCard
      label="Outstanding"
      value={formatInvoiceAmount(metrics.totalOutstanding, currency)}
      subText={`${metrics.invoicesSent} invoices`}
      icon={Clock}
      variant="warning"
    />
  );
}

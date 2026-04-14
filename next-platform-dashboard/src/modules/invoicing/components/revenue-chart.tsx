"use client";

/**
 * RevenueChart — Line/area chart for revenue over time
 *
 * Phase INV-07: Financial Dashboard
 * Uses Recharts. Shows invoiced vs collected amounts by period.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { getRevenueByPeriod } from "../actions/report-actions";
import type { RevenueByPeriod, DateRange } from "../types/report-types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface RevenueChartProps {
  siteId: string;
  dateRange?: DateRange;
  currency?: string;
}

export function RevenueChart({ siteId, dateRange }: RevenueChartProps) {
  const [data, setData] = useState<RevenueByPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRevenueByPeriod(siteId, "monthly", dateRange)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    period: d.period,
    Invoiced: d.invoiced / 100,
    Collected: d.collected / 100,
    Expenses: d.expenses / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No revenue data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(v) => `K${v.toLocaleString()}`}
              />
              <Tooltip
                formatter={
                  ((value: number) =>
                    formatInvoiceAmount(Math.round(value * 100))) as any
                }
                labelFormatter={(label: any) => `Period: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Invoiced"
                stroke="#3b82f6"
                fill="#3b82f680"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Collected"
                stroke="#22c55e"
                fill="#22c55e80"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Expenses"
                stroke="#ef4444"
                fill="#ef444480"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

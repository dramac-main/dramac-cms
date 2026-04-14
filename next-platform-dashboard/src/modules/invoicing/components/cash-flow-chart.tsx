"use client";

/**
 * CashFlowChart — Bar chart: cash in vs cash out by period
 *
 * Phase INV-07: Financial Dashboard
 * Uses Recharts. Green bars for inflows, red for outflows.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { getCashFlowReport } from "../actions/report-actions";
import type { CashFlowReport, DateRange } from "../types/report-types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface CashFlowChartProps {
  siteId: string;
  dateRange?: DateRange;
  currency?: string;
}

export function CashFlowChart({ siteId, dateRange }: CashFlowChartProps) {
  const [data, setData] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCashFlowReport(siteId, dateRange)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.periods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No cash flow data for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.periods.map((p) => ({
    period: p.period,
    "Cash In": p.cashIn / 100,
    "Cash Out": p.cashOut / 100,
    Net: p.net / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cash Flow</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 font-medium">
              In: {formatInvoiceAmount(data.totalIn)}
            </span>
            <span className="text-red-600 font-medium">
              Out: {formatInvoiceAmount(data.totalOut)}
            </span>
            <span className="font-bold">
              Net: {formatInvoiceAmount(data.netCashFlow)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
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
            <Bar dataKey="Cash In" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cash Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

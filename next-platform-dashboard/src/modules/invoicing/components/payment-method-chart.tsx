"use client";

/**
 * PaymentMethodChart — Pie chart: payment distribution by method
 *
 * Phase INV-07: Financial Dashboard
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaymentMethodDistribution } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type {
  PaymentMethodDistribution,
  DateRange,
} from "../types/report-types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface PaymentMethodChartProps {
  siteId: string;
  dateRange?: DateRange;
  currency?: string;
}

export function PaymentMethodChart({
  siteId,
  dateRange,
  currency = "ZMW",
}: PaymentMethodChartProps) {
  const [data, setData] = useState<PaymentMethodDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPaymentMethodDistribution(siteId, dateRange)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No payment data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = data.reduce((s, d) => s + d.amount, 0);

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.amount / 100,
    count: d.count,
    color: d.color,
    pct: totalAmount > 0 ? (d.amount / totalAmount) * 100 : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, pct }: any) => `${name} ${pct.toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={
                ((value: number, name: string, props: any) => [
                  `${formatInvoiceAmount(Math.round(value * 100), currency)} (${props.payload.count} payments)`,
                  name,
                ]) as any
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

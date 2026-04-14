"use client";

/**
 * InvoiceStatusChart — Donut chart: invoice count by status
 *
 * Phase INV-07: Financial Dashboard
 * Uses Recharts PieChart with inner radius for donut effect.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvoiceStatusDistribution } from "../actions/report-actions";
import type { InvoiceStatusDistribution } from "../types/report-types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface InvoiceStatusChartProps {
  siteId: string;
}

export function InvoiceStatusChart({ siteId }: InvoiceStatusChartProps) {
  const [data, setData] = useState<InvoiceStatusDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getInvoiceStatusDistribution(siteId)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status</CardTitle>
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
          <CardTitle>Invoice Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No invoices found
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.count,
    color: d.color,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Status Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }: any) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={
                ((value: number, name: string) => [
                  `${value} invoice${value !== 1 ? "s" : ""}`,
                  name,
                ]) as any
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {total} total invoice{total !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}

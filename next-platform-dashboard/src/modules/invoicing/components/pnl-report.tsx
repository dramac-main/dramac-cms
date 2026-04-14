"use client";

/**
 * PnlReport — Profit & Loss statement with income/expense breakdown
 *
 * Phase INV-07: Financial Dashboard
 * Includes date picker, export CSV button, and bar chart visualization.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import { getProfitAndLoss, exportReportCSV } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { ProfitAndLoss, DateRange } from "../types/report-types";
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

export function PnlReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [data, setData] = useState<ProfitAndLoss | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getProfitAndLoss(siteId, dateRange)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  const handleExport = useCallback(async () => {
    if (!siteId) return;
    const csv = await exportReportCSV("pnl", siteId, dateRange);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pnl-report-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [siteId, dateRange]);

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground">
            Income versus expenses for the selected period
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-48" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No data available for the selected period
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatInvoiceAmount(data.income.total, currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatInvoiceAmount(data.expenses.total, currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    data.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatInvoiceAmount(data.netProfit, currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.netProfitMargin.toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={[
                    ...data.income.byCategory.map((c) => ({
                      name: c.category,
                      Income: c.amount / 100,
                      Expenses: 0,
                    })),
                    ...data.expenses.byCategory.map((c) => ({
                      name: c.category,
                      Income: 0,
                      Expenses: c.amount / 100,
                    })),
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={
                      ((value: number) =>
                        formatInvoiceAmount(
                          Math.round(value * 100),
                          currency,
                        )) as any
                    }
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="Expenses"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.income.byCategory.map((c) => (
                      <tr key={c.category} className="border-b last:border-0">
                        <td className="py-2">{c.category}</td>
                        <td className="text-right py-2">
                          {formatInvoiceAmount(c.amount, currency)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t">
                      <td className="py-2">Total Income</td>
                      <td className="text-right py-2">
                        {formatInvoiceAmount(data.income.total, currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.byCategory.map((c) => (
                      <tr key={c.category} className="border-b last:border-0">
                        <td className="py-2">{c.category}</td>
                        <td className="text-right py-2">
                          {formatInvoiceAmount(c.amount, currency)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t">
                      <td className="py-2">Total Expenses</td>
                      <td className="text-right py-2">
                        {formatInvoiceAmount(data.expenses.total, currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

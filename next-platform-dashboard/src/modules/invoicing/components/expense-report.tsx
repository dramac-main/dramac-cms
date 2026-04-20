"use client";

/**
 * ExpenseReportView — Expense breakdown with grouping selector + chart + table
 *
 * Phase INV-07: Financial Dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import { getExpenseReport, exportReportCSV } from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { ExpenseReport, DateRange } from "../types/report-types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type GroupBy = "category" | "vendor" | "month";

export function ExpenseReportView() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [data, setData] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getExpenseReport(siteId, dateRange, groupBy)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [siteId, dateRange, groupBy]);

  const handleExport = useCallback(async () => {
    if (!siteId) return;
    const csv = await exportReportCSV("expenses", siteId, dateRange);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-report-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [siteId, dateRange]);

  if (!siteId) return null;

  // Build chart data based on groupBy
  const chartData = !data
    ? []
    : groupBy === "category"
      ? data.byCategory.map((c) => ({
          name: c.categoryName,
          amount: c.amount / 100,
        }))
      : groupBy === "vendor"
        ? data.byVendor.map((v) => ({
            name: v.vendorName,
            amount: v.amount / 100,
          }))
        : data.byMonth.map((m) => ({
            name: m.month,
            amount: m.amount / 100,
          }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Expense Report</h1>
          <p className="text-muted-foreground">
            Expenses grouped by category, vendor, or time period
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as GroupBy)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="vendor">By Vendor</SelectItem>
              <SelectItem value="month">By Month</SelectItem>
            </SelectContent>
          </Select>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="no-print"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
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
            No expenses found for the selected period
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Total */}
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-lg font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatInvoiceAmount(data.totalExpenses, currency)}
              </p>
            </CardContent>
          </Card>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Expenses by{" "}
                  {groupBy === "category"
                    ? "Category"
                    : groupBy === "vendor"
                      ? "Vendor"
                      : "Month"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
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
                    <Bar
                      dataKey="amount"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">
                        {groupBy === "category"
                          ? "Category"
                          : groupBy === "vendor"
                            ? "Vendor"
                            : "Month"}
                      </th>
                      <th className="text-right py-2 px-3">Amount</th>
                      <th className="text-right py-2 px-3">Count</th>
                      <th className="text-right py-2 px-3">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupBy === "category" &&
                      data.byCategory.map((c) => (
                        <tr
                          key={c.categoryName}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="py-2 px-3 font-medium">
                            {c.categoryName}
                          </td>
                          <td className="text-right py-2 px-3">
                            {formatInvoiceAmount(c.amount, currency)}
                          </td>
                          <td className="text-right py-2 px-3">{c.count}</td>
                          <td className="text-right py-2 px-3">
                            {c.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    {groupBy === "vendor" &&
                      data.byVendor.map((v) => {
                        const pct =
                          data.totalExpenses > 0
                            ? (v.amount / data.totalExpenses) * 100
                            : 0;
                        return (
                          <tr
                            key={v.vendorName}
                            className="border-b last:border-0 hover:bg-muted/50"
                          >
                            <td className="py-2 px-3 font-medium">
                              {v.vendorName}
                            </td>
                            <td className="text-right py-2 px-3">
                              {formatInvoiceAmount(v.amount, currency)}
                            </td>
                            <td className="text-right py-2 px-3">{v.count}</td>
                            <td className="text-right py-2 px-3">
                              {pct.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    {groupBy === "month" &&
                      data.byMonth.map((m) => (
                        <tr
                          key={m.month}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="py-2 px-3 font-medium">{m.month}</td>
                          <td className="text-right py-2 px-3">
                            {formatInvoiceAmount(m.amount, currency)}
                          </td>
                          <td className="text-right py-2 px-3">{m.count}</td>
                          <td className="text-right py-2 px-3">—</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

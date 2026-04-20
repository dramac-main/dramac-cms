"use client";

/**
 * CrossModuleReport — Unified revenue + client activity across modules
 *
 * Phase INVFIX-08: Reports Overhaul
 * Shows revenue from invoicing, e-commerce, and bookings in one view.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter, getDefaultDateRange } from "./date-range-filter";
import {
  getCrossModuleRevenue,
  getCrossModuleClients,
  exportCrossModuleCSV,
} from "../actions/report-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type {
  CrossModuleRevenue,
  CrossModuleClientReport,
  DateRange,
} from "../types/report-types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function CrossModuleReport() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [revenueData, setRevenueData] = useState<CrossModuleRevenue | null>(
    null,
  );
  const [clientData, setClientData] = useState<CrossModuleClientReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [tab, setTab] = useState("revenue");
  const currency = "ZMW";

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    Promise.all([
      getCrossModuleRevenue(siteId, dateRange),
      getCrossModuleClients(siteId, dateRange),
    ])
      .then(([rev, clients]) => {
        setRevenueData(rev);
        setClientData(clients);
      })
      .catch(() => {
        setRevenueData(null);
        setClientData(null);
      })
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  const handleExport = useCallback(
    async (type: "revenue" | "clients") => {
      if (!siteId) return;
      const csv = await exportCrossModuleCSV(type, siteId, dateRange);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cross-module-${type}-${dateRange.start}-${dateRange.end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [siteId, dateRange],
  );

  if (!siteId) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cross-Module Revenue</h1>
          <p className="text-muted-foreground">
            Unified revenue from invoicing, e-commerce, and bookings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleExport(tab === "clients" ? "clients" : "revenue")
            }
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-[350px]" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="revenue">Revenue Overview</TabsTrigger>
            <TabsTrigger value="clients">Client Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6 mt-4">
            {revenueData && (
              <RevenueTab data={revenueData} currency={currency} />
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-6 mt-4">
            {clientData && <ClientTab data={clientData} currency={currency} />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ─── Revenue Tab ───────────────────────────────────────────────

function RevenueTab({
  data,
  currency,
}: {
  data: CrossModuleRevenue;
  currency: string;
}) {
  const activeSources = data.bySource.filter((s) => s.amount > 0);

  return (
    <>
      {/* Source KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">
              {formatInvoiceAmount(data.totalRevenue, currency)}
            </p>
          </CardContent>
        </Card>
        {data.bySource.map((source) => (
          <Card key={source.source}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <p className="text-sm text-muted-foreground">{source.label}</p>
              </div>
              <p className="text-xl font-bold">
                {formatInvoiceAmount(source.amount, currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {source.count} transaction{source.count !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pie Chart + Stacked Area Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSources.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No revenue data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={activeSources.map((s) => ({
                      name: s.label,
                      value: s.amount / 100,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }: any) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {activeSources.map((s) => (
                      <Cell key={s.source} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={
                      ((value: number) =>
                        formatInvoiceAmount(
                          Math.round(value * 100),
                          currency,
                        )) as any
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Stacked Area */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byPeriod.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                No data for this period
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={data.byPeriod.map((p) => ({
                    period: p.period,
                    Invoicing: p.invoicing / 100,
                    "E-Commerce": p.ecommerce / 100,
                    Bookings: p.booking / 100,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `K${v.toLocaleString()}`}
                  />
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
                  <Area
                    type="monotone"
                    dataKey="Invoicing"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f680"
                  />
                  <Area
                    type="monotone"
                    dataKey="E-Commerce"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e80"
                  />
                  <Area
                    type="monotone"
                    dataKey="Bookings"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b80"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Table */}
      {data.byPeriod.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Month</th>
                    <th className="text-right py-2 px-3">Invoicing</th>
                    <th className="text-right py-2 px-3">E-Commerce</th>
                    <th className="text-right py-2 px-3">Bookings</th>
                    <th className="text-right py-2 px-3 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPeriod.map((p) => (
                    <tr
                      key={p.period}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-2 px-3 font-medium">{p.period}</td>
                      <td className="text-right py-2 px-3">
                        {formatInvoiceAmount(p.invoicing, currency)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {formatInvoiceAmount(p.ecommerce, currency)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {formatInvoiceAmount(p.booking, currency)}
                      </td>
                      <td className="text-right py-2 px-3 font-bold">
                        {formatInvoiceAmount(p.total, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ─── Client Activity Tab ───────────────────────────────────────

function ClientTab({
  data,
  currency,
}: {
  data: CrossModuleClientReport;
  currency: string;
}) {
  // Top 10 for chart
  const chartClients = data.clients.slice(0, 10);

  return (
    <>
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{data.totalClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Combined Revenue</p>
            <p className="text-2xl font-bold">
              {formatInvoiceAmount(data.totalRevenue, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top clients bar chart */}
      {chartClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clients by Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartClients.map((c) => ({
                  name:
                    c.clientName.length > 18
                      ? c.clientName.substring(0, 16) + "…"
                      : c.clientName,
                  Invoicing: c.invoicingRevenue / 100,
                  "E-Commerce": c.ecommerceRevenue / 100,
                  Bookings: c.bookingRevenue / 100,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `K${v.toLocaleString()}`}
                />
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
                <Bar
                  dataKey="Invoicing"
                  stackId="1"
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="E-Commerce"
                  stackId="1"
                  fill="#22c55e"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Bookings"
                  stackId="1"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Full table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Activity Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {data.clients.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No client activity found for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">Client</th>
                    <th className="text-right py-2 px-3">Invoicing</th>
                    <th className="text-right py-2 px-3">E-Commerce</th>
                    <th className="text-right py-2 px-3">Bookings</th>
                    <th className="text-right py-2 px-3 font-bold">Total</th>
                    <th className="text-right py-2 px-3">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clients.map((client, i) => {
                    const activityParts: string[] = [];
                    if (client.invoiceCount > 0)
                      activityParts.push(`${client.invoiceCount} inv`);
                    if (client.orderCount > 0)
                      activityParts.push(`${client.orderCount} ord`);
                    if (client.bookingCount > 0)
                      activityParts.push(`${client.bookingCount} bk`);

                    return (
                      <tr
                        key={`${client.clientEmail}-${i}`}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-2 px-3 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="py-2 px-3">
                          <p className="font-medium">{client.clientName}</p>
                          {client.clientEmail && (
                            <p className="text-xs text-muted-foreground">
                              {client.clientEmail}
                            </p>
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(
                            client.invoicingRevenue,
                            currency,
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(
                            client.ecommerceRevenue,
                            currency,
                          )}
                        </td>
                        <td className="text-right py-2 px-3">
                          {formatInvoiceAmount(client.bookingRevenue, currency)}
                        </td>
                        <td className="text-right py-2 px-3 font-bold">
                          {formatInvoiceAmount(client.totalRevenue, currency)}
                        </td>
                        <td className="text-right py-2 px-3 text-xs text-muted-foreground">
                          {activityParts.join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

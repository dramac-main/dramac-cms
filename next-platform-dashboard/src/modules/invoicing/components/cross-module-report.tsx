"use client";

/**
 * CrossModuleReport — Unified revenue + client activity across modules
 *
 * Phase INVFIX-08: Reports Overhaul
 * Shows revenue from invoicing, e-commerce, and bookings in one view.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Printer, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
            <TabsTrigger value="health">Module Health</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6 mt-4">
            {revenueData && (
              <RevenueTab data={revenueData} currency={currency} />
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-6 mt-4">
            {clientData && <ClientTab data={clientData} currency={currency} />}
          </TabsContent>

          <TabsContent value="health" className="space-y-6 mt-4">
            {revenueData && clientData && (
              <HealthTab
                revenueData={revenueData}
                clientData={clientData}
                currency={currency}
              />
            )}
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

// ─── Module Health Tab ─────────────────────────────────────────

interface HealthTabProps {
  revenueData: CrossModuleRevenue;
  clientData: CrossModuleClientReport;
  currency: string;
}

function HealthTab({ revenueData, clientData, currency }: HealthTabProps) {
  // Derive health metrics from existing data
  const sources = revenueData.bySource;
  const invoicingSource = sources.find((s) => s.source === "invoicing");
  const ecommerceSource = sources.find((s) => s.source === "ecommerce");
  const bookingSource = sources.find((s) => s.source === "booking");

  const totalRevenue = revenueData.totalRevenue || 1; // avoid div/0

  // Client concentration: top client % of total
  const topClientRevenue = clientData.clients[0]?.totalRevenue ?? 0;
  const clientConcentration = Math.round(
    (topClientRevenue / (clientData.totalRevenue || 1)) * 100,
  );

  // Revenue diversity: how many sources contribute >10%
  const activeSources = sources.filter(
    (s) => s.amount / totalRevenue > 0.1,
  ).length;

  const modules = [
    {
      name: "Invoicing",
      color: "#3b82f6",
      revenue: invoicingSource?.amount ?? 0,
      transactions: invoicingSource?.count ?? 0,
      share: Math.round(((invoicingSource?.amount ?? 0) / totalRevenue) * 100),
      status: (invoicingSource?.amount ?? 0) > 0 ? "active" : "inactive",
    },
    {
      name: "E-Commerce",
      color: "#22c55e",
      revenue: ecommerceSource?.amount ?? 0,
      transactions: ecommerceSource?.count ?? 0,
      share: Math.round(((ecommerceSource?.amount ?? 0) / totalRevenue) * 100),
      status: (ecommerceSource?.amount ?? 0) > 0 ? "active" : "inactive",
    },
    {
      name: "Bookings",
      color: "#f59e0b",
      revenue: bookingSource?.amount ?? 0,
      transactions: bookingSource?.count ?? 0,
      share: Math.round(((bookingSource?.amount ?? 0) / totalRevenue) * 100),
      status: (bookingSource?.amount ?? 0) > 0 ? "active" : "inactive",
    },
  ];

  // Overall health score (0-100) based on diversity + activity
  const healthScore = Math.min(
    100,
    activeSources * 25 + // up to 75 for 3 active sources
      (clientConcentration < 30 ? 25 : clientConcentration < 50 ? 15 : 5), // diversified clients
  );

  const healthLabel =
    healthScore >= 70 ? "Healthy" : healthScore >= 40 ? "Fair" : "Needs Work";
  const healthColor =
    healthScore >= 70
      ? "text-green-600"
      : healthScore >= 40
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <>
      {/* Overall Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`text-4xl font-bold ${healthColor}`}>
                {healthScore}
              </p>
              <p className={`text-sm font-medium ${healthColor}`}>
                {healthLabel}
              </p>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Revenue Sources Active
                </span>
                <span className="font-medium">{activeSources} of 3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Client Concentration (Top Client)
                </span>
                <Badge
                  variant="outline"
                  className={
                    clientConcentration > 50
                      ? "border-red-500 text-red-700"
                      : clientConcentration > 30
                        ? "border-yellow-500 text-yellow-700"
                        : "border-green-500 text-green-700"
                  }
                >
                  {clientConcentration}%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Clients</span>
                <span className="font-medium">{clientData.totalClients}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Module Scorecards */}
      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((mod) => (
          <Card key={mod.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{mod.name}</CardTitle>
                <Badge
                  variant={mod.status === "active" ? "default" : "secondary"}
                >
                  {mod.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">
                  {formatInvoiceAmount(mod.revenue, currency)}
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-medium">{mod.transactions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue Share</span>
                <span className="font-medium">{mod.share}%</span>
              </div>
              {/* Revenue share bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${mod.share}%`,
                    backgroundColor: mod.color,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

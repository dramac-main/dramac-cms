"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MetricsGrid,
  MetricCard,
  RevenueMetric,
  UsersMetric,
  ConversionMetric,
  OrdersMetric,
  LineChartWidget,
  MiniLineChart,
  BarChartWidget,
  AreaChartWidget,
  PieChartWidget,
  DonutChart,
  TimeRangeSelector,
  TimeRangeButtons,
  StatCardWidget,
} from "@/components/dashboard/widgets";
import { TimeRange } from "@/types/dashboard-widgets";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
// Sample data for charts
const revenueData = [
  { label: "Jan", value: 4500 },
  { label: "Feb", value: 5200 },
  { label: "Mar", value: 4800 },
  { label: "Apr", value: 6100 },
  { label: "May", value: 5800 },
  { label: "Jun", value: 7200 },
  { label: "Jul", value: 7800 },
];

const multiSeriesData = [
  { label: "Jan", value: 4500, revenue: 4500, costs: 2500, profit: 2000 },
  { label: "Feb", value: 5200, revenue: 5200, costs: 2800, profit: 2400 },
  { label: "Mar", value: 4800, revenue: 4800, costs: 2600, profit: 2200 },
  { label: "Apr", value: 6100, revenue: 6100, costs: 3100, profit: 3000 },
  { label: "May", value: 5800, revenue: 5800, costs: 2900, profit: 2900 },
  { label: "Jun", value: 7200, revenue: 7200, costs: 3400, profit: 3800 },
];

const categoryData = [
  { label: "Electronics", value: 4500 },
  { label: "Clothing", value: 3200 },
  { label: "Food", value: 2100 },
  { label: "Books", value: 1800 },
  { label: "Other", value: 1200 },
];

const trafficSourceData = [
  { label: "Organic", value: 45 },
  { label: "Paid", value: 25 },
  { label: "Social", value: 15 },
  { label: "Direct", value: 10 },
  { label: "Email", value: 5 },
];

const sparklineData = [12, 15, 18, 14, 22, 25, 28, 24, 32, 35, 38];

interface AnalyticsWidgetsProps {
  className?: string;
}

export function AnalyticsWidgets({ className }: AnalyticsWidgetsProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("7d");
  const [activeTab, setActiveTab] = React.useState("overview");

  // Format functions
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${value}%`;

  // Sample metrics for the grid
  const metrics = [
    {
      id: "revenue",
      title: "Total Revenue",
      value: formatCurrency(42580),
      change: 12.5,
      icon: "revenue" as const,
      iconColor: "bg-green-500/10 text-green-500",
      sparklineData,
    },
    {
      id: "users",
      title: "Active Users",
      value: "2,847",
      change: 8.2,
      icon: "users" as const,
      iconColor: "bg-blue-500/10 text-blue-500",
      sparklineData: [45, 52, 48, 61, 55, 72, 68, 75, 82, 78, 85],
    },
    {
      id: "conversion",
      title: "Conversion Rate",
      value: "3.24%",
      change: -2.1,
      trendIsGood: true,
      icon: "rate" as const,
      iconColor: "bg-purple-500/10 text-purple-500",
    },
    {
      id: "orders",
      title: "Total Orders",
      value: "1,284",
      change: 15.3,
      icon: "sales" as const,
      iconColor: "bg-orange-500/10 text-orange-500",
      sparklineData: [22, 28, 32, 29, 38, 42, 45, 48, 52, 55, 62],
    },
  ];

  return (
    <div className={className}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <TimeRangeButtons value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={metrics} columns={4} gap="md" className="mb-6" />

      {/* Tabbed Charts Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChartWidget
                  data={revenueData}
                  dataKeys={["value"]}
                  xAxisKey="label"
                  height={250}
                  showGrid
                  showTooltip
                  gradients
                  formatTooltip={formatCurrency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartWidget
                  data={trafficSourceData}
                  donut
                  height={250}
                  centerValue={trafficSourceData.reduce((a, b) => a + b.value, 0)}
                  centerLabel="Total %"
                  formatValue={formatPercent}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Revenue, Costs & Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChartWidget
                data={multiSeriesData}
                dataKeys={["revenue", "costs", "profit"]}
                xAxisKey="label"
                height={300}
                stacked
                showGrid
                showLegend
                formatTooltip={formatCurrency}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sessions Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <AreaChartWidget
                  data={revenueData.map((d) => ({
                    ...d,
                    value: Math.round(d.value / 10),
                  }))}
                  dataKeys={["value"]}
                  xAxisKey="label"
                  height={250}
                  gradients
                  showGrid
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Traffic by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartWidget
                  data={trafficSourceData}
                  dataKeys={["value"]}
                  xAxisKey="label"
                  height={250}
                  showGrid
                  formatTooltip={formatPercent}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartWidget
                  data={categoryData}
                  dataKeys={["value"]}
                  xAxisKey="label"
                  height={250}
                  horizontal
                  showGrid
                  formatTooltip={formatCurrency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChartWidget
                  data={categoryData}
                  height={250}
                  showLabels
                  formatValue={formatCurrency}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mini Charts Row */}
      <div className="grid gap-4 lg:grid-cols-4 mt-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Page Views</span>
            <span className="text-xs text-green-500">+12%</span>
          </div>
          <div className="text-2xl font-bold mb-2">24.5K</div>
          <MiniLineChart
            data={sparklineData.map((v, i) => ({ label: `${i}`, value: v }))}
            dataKey="value"
            height={40}
            color="hsl(var(--chart-1))"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Bounce Rate</span>
            <span className="text-xs text-red-500">+3%</span>
          </div>
          <div className="text-2xl font-bold mb-2">42.3%</div>
          <MiniLineChart
            data={[42, 38, 45, 40, 48, 44, 50, 46, 52, 48].map((v, i) => ({ label: `${i}`, value: v }))}
            dataKey="value"
            height={40}
            color="hsl(var(--chart-4))"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Avg. Session</span>
            <span className="text-xs text-green-500">+8%</span>
          </div>
          <div className="text-2xl font-bold mb-2">3m 24s</div>
          <MiniLineChart
            data={[180, 195, 210, 200, 225, 215, 240, 230].map((v, i) => ({ label: `${i}`, value: v }))}
            dataKey="value"
            height={40}
            color="hsl(var(--chart-2))"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Goal Completion</span>
            <span className="text-xs text-green-500">+5%</span>
          </div>
          <div className="flex items-center gap-3">
            <DonutChart
              data={[
                { label: "Complete", value: 72 },
                { label: "Remaining", value: 28 },
              ]}
              size={60}
              strokeWidth={8}
              centerValue="72%"
            />
            <div className="text-xs text-muted-foreground">
              72 of 100 goals
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

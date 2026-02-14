"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  DashboardStats,
  QuickActions,
  RecentActivity,
  RecentSites,
  RecentClients,
  ModuleSubscriptions,
  WelcomeCard,
  GridItem,
  DashboardWidget,
  DashboardSection,
  MetricsGrid,
  LineChartWidget,
  BarChartWidget,
  PieChartWidget,
  DonutChart,
  TimeRangeButtons,
} from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, Package, Activity, BarChart3, TrendingUp, PieChart, FileText, Zap } from "lucide-react";
import type { DashboardData } from "@/lib/actions/dashboard";
import type { TimeRange, ChartDataPoint } from "@/types/dashboard-widgets";

/** Format a date string for chart labels based on the time range */
function formatDateLabel(dateStr: string, range: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (range === '24h') {
    return d.toLocaleDateString('en-US', { hour: 'numeric' });
  }
  if (range === '7d') {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (range === '90d') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // 30d default
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface DashboardClientProps {
  data: DashboardData;
}

export function DashboardClient({ data }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timeRange, setTimeRange] = React.useState<TimeRange>(
    (data.timeRange as TimeRange) || (searchParams.get("range") as TimeRange) || "30d"
  );

  // When user changes the time range, update the URL to trigger server-side re-fetch
  const handleTimeRangeChange = React.useCallback((newRange: TimeRange) => {
    setTimeRange(newRange);
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    router.push(`/dashboard?${params.toString()}`);
  }, [router, searchParams]);

  // Range label for display
  const rangeLabel = timeRange === '24h' ? 'today' : `last ${timeRange.replace('d', ' days')}`;

  // Transform real data into metrics for the grid — show range-filtered counts
  const realMetrics = [
    {
      id: "clients",
      title: "New Clients",
      value: data.rangeMetrics.newClients.toLocaleString(),
      icon: "users" as const,
      iconColor: "bg-blue-500/10 text-blue-500",
      subtitle: `${data.stats.totalClients} total`,
    },
    {
      id: "sites",
      title: "New Sites",
      value: data.rangeMetrics.newSites.toLocaleString(),
      icon: "chart" as const,
      iconColor: "bg-green-500/10 text-green-500",
      subtitle: `${data.stats.totalSites} total (${data.stats.publishedSites} published)`,
    },
    {
      id: "pages",
      title: "New Pages",
      value: data.rangeMetrics.newPages.toLocaleString(),
      icon: "activity" as const,
      iconColor: "bg-purple-500/10 text-purple-500",
      subtitle: `${data.stats.totalPages} total`,
    },
    {
      id: "forms",
      title: "Form Submissions",
      value: data.rangeMetrics.formSubmissions.toLocaleString(),
      icon: "performance" as const,
      iconColor: "bg-orange-500/10 text-orange-500",
      subtitle: `In ${rangeLabel}`,
    },
  ];

  // Transform data for pie chart - Site Status Distribution
  const siteStatusData: ChartDataPoint[] = [
    { label: "Published", value: data.stats.publishedSites },
    { label: "Draft", value: Math.max(0, data.stats.totalSites - data.stats.publishedSites) },
  ];

  // Transform data for bar chart - Content Overview
  const contentData: ChartDataPoint[] = [
    { label: "Pages", value: data.stats.totalPages },
    { label: "Blog Posts", value: data.enhancedMetrics.blogPosts },
    { label: "Assets", value: data.enhancedMetrics.totalAssets },
    { label: "Forms", value: data.enhancedMetrics.formSubmissions },
  ];

  // Activity breakdown for pie chart
  const activityBreakdown: ChartDataPoint[] = [
    { label: "Team Members", value: data.enhancedMetrics.teamMembers || 1 },
    { label: "Workflows", value: data.enhancedMetrics.activeWorkflows || 0 },
    { label: "Modules", value: data.enhancedMetrics.moduleInstallations || 0 },
  ].filter(item => item.value > 0);

  // Real time-series data from server, bucketed by date
  const siteTrendData: ChartDataPoint[] = (data.timeSeries || []).map(pt => ({
    label: formatDateLabel(pt.date, timeRange),
    value: pt.sites,
  }));
  const pageTrendData: ChartDataPoint[] = (data.timeSeries || []).map(pt => ({
    label: formatDateLabel(pt.date, timeRange),
    value: pt.pages,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Card with Agency Info */}
      <WelcomeCard 
        userName={data.user?.name || data.user?.email?.split("@")[0]}
        agencyName={data.agencyName}
        subscriptionPlan={data.subscriptionPlan}
      />

      {/* Interactive Metrics Grid - REAL DATA */}
      <DashboardSection
        title="Key Metrics"
        description="Real-time overview of your agency"
        icon={BarChart3}
        collapsible
        defaultCollapsed={false}
        actions={
          <TimeRangeButtons value={timeRange} onChange={handleTimeRangeChange} />
        }
      >
        <MetricsGrid metrics={realMetrics} columns={4} gap="md" />
      </DashboardSection>

      {/* Charts Row - REAL DATA */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Overview Bar Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Content Overview</CardTitle>
                <p className="text-xs text-muted-foreground">Real content counts</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BarChartWidget
              data={contentData}
              dataKeys={["value"]}
              xAxisKey="label"
              height={220}
              showGrid
              showTooltip
              gradients
            />
          </CardContent>
        </Card>

        {/* Site Status Pie Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <PieChart className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-base">Site Status</CardTitle>
                <p className="text-xs text-muted-foreground">Published vs Draft</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PieChartWidget
              data={siteStatusData}
              donut
              height={220}
              centerValue={data.stats.totalSites}
              centerLabel="Total Sites"
              colors={["hsl(142.1 76.2% 36.3%)", "hsl(220 14% 70%)"]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts - Based on Real Data */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sites Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base">Sites Created</CardTitle>
                <p className="text-xs text-muted-foreground">New sites {rangeLabel}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LineChartWidget
              data={siteTrendData}
              dataKeys={["value"]}
              xAxisKey="label"
              height={200}
              showGrid
              showTooltip
              gradients
              curved
            />
          </CardContent>
        </Card>

        {/* Pages Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Pages Created</CardTitle>
                <p className="text-xs text-muted-foreground">New pages {rangeLabel}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LineChartWidget
              data={pageTrendData}
              dataKeys={["value"]}
              xAxisKey="label"
              height={200}
              showGrid
              showTooltip
              gradients
              curved
              colors={["hsl(45 93% 47%)"]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row with Donut Charts */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Published Rate</span>
          </div>
          <div className="flex items-center gap-3">
            <DonutChart
              data={[
                { label: "Published", value: data.stats.publishedSites },
                { label: "Draft", value: Math.max(0, data.stats.totalSites - data.stats.publishedSites) },
              ]}
              size={60}
              strokeWidth={8}
              centerValue={data.stats.totalSites > 0 
                ? `${Math.round((data.stats.publishedSites / data.stats.totalSites) * 100)}%`
                : "0%"
              }
              colors={["hsl(142.1 76.2% 36.3%)", "hsl(220 14% 80%)"]}
            />
            <div className="text-xs text-muted-foreground">
              {data.stats.publishedSites} of {data.stats.totalSites} sites
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Team Size</span>
          </div>
          <div className="flex items-center gap-3">
            <DonutChart
              data={[
                { label: "Active", value: data.enhancedMetrics.teamMembers || 1 },
                { label: "Capacity", value: Math.max(0, 10 - (data.enhancedMetrics.teamMembers || 1)) },
              ]}
              size={60}
              strokeWidth={8}
              centerValue={`${data.enhancedMetrics.teamMembers || 1}`}
              colors={["hsl(221.2 83.2% 53.3%)", "hsl(220 14% 80%)"]}
            />
            <div className="text-xs text-muted-foreground">
              {data.enhancedMetrics.teamMembers || 1} member(s)
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Form Submissions</span>
          </div>
          <div className="text-2xl font-bold">{data.enhancedMetrics.formSubmissions}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Total submissions received
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active Workflows</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">{data.enhancedMetrics.activeWorkflows}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Automation workflows running
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions hasClients={data.stats.totalClients > 0} />

      {/* Two Column Grid for Sites and Modules */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sites - Takes 2 columns */}
        <GridItem span={{ lg: 2 }}>
          <DashboardWidget
            title="Recent Sites"
            description="Your recently updated websites"
            icon={Globe}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            action={{ label: "View All", href: "/dashboard/sites" }}
          >
            <RecentSites sites={data.recentSites} />
          </DashboardWidget>
        </GridItem>

        {/* Module Subscriptions */}
        <DashboardWidget
          title="Active Modules"
          description="Your subscribed modules"
          icon={Package}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
          action={{ label: "Manage", href: "/dashboard/modules/subscriptions" }}
        >
          <ModuleSubscriptions subscriptions={data.moduleSubscriptions} />
        </DashboardWidget>
      </div>

      {/* Two Column Grid for Clients and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <DashboardWidget
          title="Recent Clients"
          description="Your newest client accounts"
          icon={Users}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          action={{ label: "View All", href: "/dashboard/clients" }}
        >
          <RecentClients clients={data.recentClients} />
        </DashboardWidget>

        {/* Recent Activity */}
        <DashboardWidget
          title="Recent Activity"
          description="Latest actions in your workspace"
          icon={Activity}
          iconBg="bg-pink-100 dark:bg-pink-900/30"
          iconColor="text-pink-600 dark:text-pink-400"
        >
          <RecentActivity activities={data.recentActivity} />
        </DashboardWidget>
      </div>
    </div>
  );
}

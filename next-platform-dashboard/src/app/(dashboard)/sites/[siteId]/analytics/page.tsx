"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Download, BarChart3, Globe, Activity, Gauge } from "lucide-react";
import {
  SiteAnalyticsMetrics,
  TopPagesTable,
  TrafficSourcesChart,
  TrafficSourcesList,
  DeviceBreakdown,
  BrowserBreakdown,
  TimeSeriesChart,
  GeoBreakdown,
  GeoStatsCard,
  RealtimeWidget,
  PerformanceMetrics,
} from "@/components/analytics";
import {
  getSiteAnalytics,
  getTimeSeriesAnalytics,
  getRealtimeAnalytics,
  getPerformanceMetrics,
  getGeoAnalytics,
} from "@/lib/actions/site-analytics";
import type {
  SiteAnalyticsData,
  TimeSeriesDataPoint,
  RealtimeAnalytics,
  PerformanceMetrics as PerformanceData,
  GeoAnalytics,
  AnalyticsTimeRange,
  AnalyticsFilters,
} from "@/types/site-analytics";

type MetricKey = "visitors" | "pageViews" | "bounceRate" | "avgSessionDuration";

export default function SiteAnalyticsPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  // State
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<AnalyticsTimeRange>("7d");
  const [selectedMetric, setSelectedMetric] = React.useState<MetricKey>("visitors");
  const [activeTab, setActiveTab] = React.useState("overview");

  // Data state
  const [analyticsData, setAnalyticsData] = React.useState<SiteAnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = React.useState<TimeSeriesDataPoint[]>([]);
  const [realtimeData, setRealtimeData] = React.useState<RealtimeAnalytics | null>(null);
  const [performanceData, setPerformanceData] = React.useState<PerformanceData | null>(null);
  const [geoData, setGeoData] = React.useState<GeoAnalytics[]>([]);

  // Build filters object
  const filters: AnalyticsFilters = React.useMemo(() => ({
    timeRange,
  }), [timeRange]);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    try {
      const [analyticsResult, timeSeriesResult, realtimeResult, performanceResult, geoResult] = await Promise.all([
        getSiteAnalytics(siteId, filters),
        getTimeSeriesAnalytics(siteId, filters),
        getRealtimeAnalytics(siteId),
        getPerformanceMetrics(siteId),
        getGeoAnalytics(siteId, filters),
      ]);

      if (analyticsResult.data) setAnalyticsData(analyticsResult.data);
      if (timeSeriesResult.data) setTimeSeriesData(timeSeriesResult.data);
      if (realtimeResult.data) setRealtimeData(realtimeResult.data);
      if (performanceResult.data) setPerformanceData(performanceResult.data);
      if (geoResult.data) setGeoData(geoResult.data);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [siteId, filters]);

  // Initial load
  React.useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Auto-refresh realtime data
  React.useEffect(() => {
    if (activeTab !== "realtime") return;

    const interval = setInterval(async () => {
      const result = await getRealtimeAnalytics(siteId);
      if (result.data) setRealtimeData(result.data);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [siteId, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Site Analytics</h1>
          <p className="text-muted-foreground">
            Monitor traffic, engagement, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as AnalyticsTimeRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="audience" className="gap-2">
            <Globe className="h-4 w-4" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="realtime" className="gap-2">
            <Activity className="h-4 w-4" />
            Realtime
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Gauge className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <SiteAnalyticsMetrics
            metrics={analyticsData?.overview || null}
            loading={loading}
          />

          {/* Time Series Chart */}
          <TimeSeriesChart
            data={timeSeriesData}
            loading={loading}
            metric={selectedMetric}
            onMetricChange={setSelectedMetric}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <TopPagesTable
              pages={analyticsData?.topPages || []}
              loading={loading}
            />

            {/* Traffic Sources */}
            <TrafficSourcesList
              sources={analyticsData?.trafficSources || []}
              loading={loading}
            />
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          {/* Geographic Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GeoBreakdown
                geoData={geoData}
                loading={loading}
                limit={10}
              />
            </div>
            <GeoStatsCard geoData={geoData} loading={loading} />
          </div>

          {/* Device & Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeviceBreakdown
              devices={analyticsData?.devices || []}
              loading={loading}
            />
            <BrowserBreakdown
              browsers={analyticsData?.browsers || []}
              loading={loading}
            />
          </div>

          {/* Traffic Sources Chart */}
          <TrafficSourcesChart
            sources={analyticsData?.trafficSources || []}
            loading={loading}
          />
        </TabsContent>

        {/* Realtime Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RealtimeWidget
              data={realtimeData}
              loading={loading}
              onRefresh={async () => {
                const result = await getRealtimeAnalytics(siteId);
                if (result.data) setRealtimeData(result.data);
              }}
            />
            <div className="lg:col-span-2">
              <TopPagesTable
                pages={analyticsData?.topPages?.slice(0, 5) || []}
                loading={loading}
                title="Currently Popular Pages"
              />
            </div>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics
            metrics={performanceData}
            loading={loading}
          />

          {/* Additional Performance Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPagesTable
              pages={analyticsData?.topPages || []}
              loading={loading}
              title="Pages by Load Time"
            />
            <DeviceBreakdown
              devices={analyticsData?.devices || []}
              loading={loading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

/**
 * CRM Analytics Dashboard Client Component
 * 
 * PHASE-DS-03A: CRM Analytics Dashboard
 * Main dashboard with tabs for Pipeline, Deals, Contacts, Activities, and Revenue
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Activity,
  Coins,
  Download,
} from "lucide-react";

// CRM Analytics Actions
import {
  getPipelineOverview,
  getDealVelocity,
  getDealsByStatus,
  getDealsBySource,
  getContactMetrics,
  getContactsBySource,
  getLeadScoreDistribution,
  getContactGrowth,
  getActivityMetrics,
  getActivitiesByType,
  getActivityTimeline,
  getTeamActivityMetrics,
  getRevenueMetrics,
  getRevenueByMonth,
  getRevenueByOwner,
  getRevenueForecast,
} from "@/lib/actions/crm-analytics";

// CRM Analytics Components
import {
  PipelineOverviewCard,
  PipelineStageList,
  PipelineFunnel,
  PipelineMetricsGrid,
} from "@/components/analytics/crm/pipeline-metrics";

import {
  DealVelocityChart,
  DealValueChart,
  DealsByStatusChart,
  DealStatusCards,
  DealsBySourceChart,
  VelocitySummary,
} from "@/components/analytics/crm/deal-velocity-chart";

import {
  ContactMetricsCards,
  ContactsBySourceChart,
  ContactsByStatusChart,
  LeadScoreDistributionChart,
  ContactGrowthChart,
} from "@/components/analytics/crm/contact-insights";

import {
  ActivityMetricsCards,
  ActivitiesByTypeChart,
  ActivityTimelineChart,
  TeamActivityLeaderboard,
} from "@/components/analytics/crm/activity-analytics";

import {
  RevenueMetricsCards,
  RevenueByMonthChart,
  RevenueByOwnerChart,
  RevenueForecastChart,
  RevenueSummaryCard,
} from "@/components/analytics/crm/revenue-metrics";

import type { CRMTimeRange } from "@/types/crm-analytics";

// ============================================================================
// TYPES
// ============================================================================

interface CRMAnalyticsDashboardProps {
  siteId: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CRMAnalyticsDashboard({ siteId }: CRMAnalyticsDashboardProps) {
  const router = useRouter();
  const [timeRange, setTimeRange] = React.useState<CRMTimeRange>("30d");
  const [activeTab, setActiveTab] = React.useState("pipeline");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Data states
  const [pipelineData, setPipelineData] = React.useState<Awaited<ReturnType<typeof getPipelineOverview>> | null>(null);
  const [dealVelocityData, setDealVelocityData] = React.useState<Awaited<ReturnType<typeof getDealVelocity>> | null>(null);
  const [dealsByStatusData, setDealsByStatusData] = React.useState<Awaited<ReturnType<typeof getDealsByStatus>> | null>(null);
  const [dealsBySourceData, setDealsBySourceData] = React.useState<Awaited<ReturnType<typeof getDealsBySource>> | null>(null);
  const [contactMetricsData, setContactMetricsData] = React.useState<Awaited<ReturnType<typeof getContactMetrics>> | null>(null);
  const [contactsBySourceData, setContactsBySourceData] = React.useState<Awaited<ReturnType<typeof getContactsBySource>> | null>(null);
  const [leadScoreData, setLeadScoreData] = React.useState<Awaited<ReturnType<typeof getLeadScoreDistribution>> | null>(null);
  const [contactGrowthData, setContactGrowthData] = React.useState<Awaited<ReturnType<typeof getContactGrowth>> | null>(null);
  const [activityMetricsData, setActivityMetricsData] = React.useState<Awaited<ReturnType<typeof getActivityMetrics>> | null>(null);
  const [activitiesByTypeData, setActivitiesByTypeData] = React.useState<Awaited<ReturnType<typeof getActivitiesByType>> | null>(null);
  const [activityTimelineData, setActivityTimelineData] = React.useState<Awaited<ReturnType<typeof getActivityTimeline>> | null>(null);
  const [teamActivityData, setTeamActivityData] = React.useState<Awaited<ReturnType<typeof getTeamActivityMetrics>> | null>(null);
  const [revenueMetricsData, setRevenueMetricsData] = React.useState<Awaited<ReturnType<typeof getRevenueMetrics>> | null>(null);
  const [revenueByMonthData, setRevenueByMonthData] = React.useState<Awaited<ReturnType<typeof getRevenueByMonth>> | null>(null);
  const [revenueByOwnerData, setRevenueByOwnerData] = React.useState<Awaited<ReturnType<typeof getRevenueByOwner>> | null>(null);
  const [revenueForecastData, setRevenueForecastData] = React.useState<Awaited<ReturnType<typeof getRevenueForecast>> | null>(null);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    try {
      setIsRefreshing(true);

      // Fetch all data in parallel
      const [
        pipeline,
        velocity,
        byStatus,
        bySource,
        contacts,
        contactSources,
        leadScores,
        contactGrowth,
        activities,
        activityTypes,
        activityTimeline,
        teamActivity,
        revenue,
        revenueMonth,
        revenueOwner,
        forecast,
      ] = await Promise.all([
        getPipelineOverview(siteId, timeRange),
        getDealVelocity(siteId, timeRange),
        getDealsByStatus(siteId, timeRange),
        getDealsBySource(siteId, timeRange),
        getContactMetrics(siteId, timeRange),
        getContactsBySource(siteId, timeRange),
        getLeadScoreDistribution(siteId, timeRange),
        getContactGrowth(siteId, timeRange),
        getActivityMetrics(siteId, timeRange),
        getActivitiesByType(siteId, timeRange),
        getActivityTimeline(siteId, timeRange),
        getTeamActivityMetrics(siteId, timeRange),
        getRevenueMetrics(siteId, timeRange),
        getRevenueByMonth(siteId, "12m"),
        getRevenueByOwner(siteId, timeRange),
        getRevenueForecast(siteId, "90d"),
      ]);

      setPipelineData(pipeline);
      setDealVelocityData(velocity);
      setDealsByStatusData(byStatus);
      setDealsBySourceData(bySource);
      setContactMetricsData(contacts);
      setContactsBySourceData(contactSources);
      setLeadScoreData(leadScores);
      setContactGrowthData(contactGrowth);
      setActivityMetricsData(activities);
      setActivitiesByTypeData(activityTypes);
      setActivityTimelineData(activityTimeline);
      setTeamActivityData(teamActivity);
      setRevenueMetricsData(revenue);
      setRevenueByMonthData(revenueMonth);
      setRevenueByOwnerData(revenueOwner);
      setRevenueForecastData(forecast);
    } catch (error) {
      console.error("Failed to fetch CRM analytics:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId, timeRange]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as CRMTimeRange);
    setIsLoading(true);
  };

  // Loading skeleton
  if (isLoading && !pipelineData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM Analytics</h1>
          <p className="text-muted-foreground">
            Pipeline metrics, deal velocity, contact insights, and revenue tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Pipeline Overview Metrics */}
      {pipelineData && <PipelineMetricsGrid data={pipelineData} />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Revenue
          </TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          {pipelineData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PipelineStageList stages={pipelineData.stages} />
                <PipelineFunnel stages={pipelineData.stages} />
              </div>
              <PipelineOverviewCard data={pipelineData} />
            </>
          )}
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-6">
          {dealsByStatusData && <DealStatusCards data={dealsByStatusData} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dealVelocityData && <DealVelocityChart data={dealVelocityData} />}
            {dealVelocityData && <DealValueChart data={dealVelocityData} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dealsByStatusData && <DealsByStatusChart data={dealsByStatusData} />}
            {dealsBySourceData && <DealsBySourceChart data={dealsBySourceData} />}
          </div>

          {dealVelocityData && <VelocitySummary data={dealVelocityData} />}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          {contactMetricsData && <ContactMetricsCards data={contactMetricsData} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contactsBySourceData && <ContactsBySourceChart data={contactsBySourceData} />}
            {leadScoreData && <LeadScoreDistributionChart data={leadScoreData} />}
          </div>

          {contactGrowthData && <ContactGrowthChart data={contactGrowthData} />}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          {activityMetricsData && <ActivityMetricsCards data={activityMetricsData} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activitiesByTypeData && <ActivitiesByTypeChart data={activitiesByTypeData} />}
            {teamActivityData && <TeamActivityLeaderboard data={teamActivityData} />}
          </div>

          {activityTimelineData && <ActivityTimelineChart data={activityTimelineData} />}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {revenueMetricsData && <RevenueSummaryCard metrics={revenueMetricsData} />}
          {revenueMetricsData && <RevenueMetricsCards data={revenueMetricsData} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {revenueByMonthData && <RevenueByMonthChart data={revenueByMonthData} />}
            {revenueByOwnerData && <RevenueByOwnerChart data={revenueByOwnerData} />}
          </div>

          {revenueForecastData && <RevenueForecastChart data={revenueForecastData} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

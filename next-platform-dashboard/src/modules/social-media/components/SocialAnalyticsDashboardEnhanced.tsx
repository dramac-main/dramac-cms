"use client";

/**
 * Social Analytics Dashboard Client Component
 * 
 * PHASE-DS-03B: Social Analytics Dashboard
 * Enhanced dashboard with comprehensive social media analytics
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  BarChart3,
  Heart,
  Eye,
  FileText,
  Users,
  Download,
} from "lucide-react";

// Social Analytics Actions
import {
  getPlatformOverview,
  getTopContent,
  getContentTypeMetrics,
  getAudienceGrowth,
  getAudienceDemographics,
  getEngagementMetrics,
  getEngagementTrend,
  getEngagementByType,
  getReachMetrics,
  getReachTrend,
  getReachByPlatform,
  getPostingMetrics,
  getPostingTrend,
  getPostingByPlatform,
  getOptimalTimes,
  getHeatmapData,
  getHashtagMetrics,
  getStoryMetrics,
} from "@/lib/actions/social-analytics";

// Social Analytics Components
import {
  PlatformOverviewCards,
  PlatformBreakdownList,
  PlatformFollowersPieChart,
  PlatformComparisonChart,
  EngagementMetricsCards,
  EngagementTrendChart,
  EngagementByTypeChart,
  EngagementBreakdownList,
  EngagementRateCard,
  ReachMetricsCards,
  ReachSourceBreakdown,
  ReachTrendChart,
  ReachBySourceChart,
  ReachByPlatformChart,
  ImpressionsReachComparison,
  TopContentList,
  ContentTypePerformanceChart,
  ContentTypeDistribution,
  PostingMetricsCards,
  PostStatusBreakdown,
  PostingTrendChart,
  PostingByPlatformChart,
  AudienceGrowthChart,
  FollowerGainLossChart,
  AudienceGrowthStats,
  AgeDemographicsChart,
  GenderDemographicsChart,
  TopLocationsChart,
  ActivityHeatmap,
  OptimalTimesChart,
} from "@/components/analytics/social";

import type { SocialTimeRange } from "@/types/social-analytics";

// ============================================================================
// TYPES
// ============================================================================

interface SocialAnalyticsDashboardProps {
  siteId: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SocialAnalyticsDashboardEnhanced({ siteId }: SocialAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = React.useState<SocialTimeRange>("30d");
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Data states
  const [platformOverview, setPlatformOverview] = React.useState<Awaited<ReturnType<typeof getPlatformOverview>> | null>(null);
  const [topContent, setTopContent] = React.useState<Awaited<ReturnType<typeof getTopContent>> | null>(null);
  const [contentTypes, setContentTypes] = React.useState<Awaited<ReturnType<typeof getContentTypeMetrics>> | null>(null);
  const [audienceGrowth, setAudienceGrowth] = React.useState<Awaited<ReturnType<typeof getAudienceGrowth>> | null>(null);
  const [demographics, setDemographics] = React.useState<Awaited<ReturnType<typeof getAudienceDemographics>> | null>(null);
  const [engagementMetrics, setEngagementMetrics] = React.useState<Awaited<ReturnType<typeof getEngagementMetrics>> | null>(null);
  const [engagementTrend, setEngagementTrend] = React.useState<Awaited<ReturnType<typeof getEngagementTrend>> | null>(null);
  const [engagementByType, setEngagementByType] = React.useState<Awaited<ReturnType<typeof getEngagementByType>> | null>(null);
  const [reachMetrics, setReachMetrics] = React.useState<Awaited<ReturnType<typeof getReachMetrics>> | null>(null);
  const [reachTrend, setReachTrend] = React.useState<Awaited<ReturnType<typeof getReachTrend>> | null>(null);
  const [reachByPlatform, setReachByPlatform] = React.useState<Awaited<ReturnType<typeof getReachByPlatform>> | null>(null);
  const [postingMetrics, setPostingMetrics] = React.useState<Awaited<ReturnType<typeof getPostingMetrics>> | null>(null);
  const [postingTrend, setPostingTrend] = React.useState<Awaited<ReturnType<typeof getPostingTrend>> | null>(null);
  const [postingByPlatform, setPostingByPlatform] = React.useState<Awaited<ReturnType<typeof getPostingByPlatform>> | null>(null);
  const [optimalTimes, setOptimalTimes] = React.useState<Awaited<ReturnType<typeof getOptimalTimes>> | null>(null);
  const [heatmapData, setHeatmapData] = React.useState<Awaited<ReturnType<typeof getHeatmapData>> | null>(null);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    try {
      setIsRefreshing(true);

      const [
        overview,
        content,
        types,
        growth,
        demo,
        engagement,
        engTrend,
        engType,
        reach,
        rchTrend,
        rchPlatform,
        posting,
        postTrend,
        postPlatform,
        optimal,
        heatmap,
      ] = await Promise.all([
        getPlatformOverview(siteId, timeRange),
        getTopContent(siteId, timeRange),
        getContentTypeMetrics(siteId, timeRange),
        getAudienceGrowth(siteId, timeRange),
        getAudienceDemographics(siteId, timeRange),
        getEngagementMetrics(siteId, timeRange),
        getEngagementTrend(siteId, timeRange),
        getEngagementByType(siteId, timeRange),
        getReachMetrics(siteId, timeRange),
        getReachTrend(siteId, timeRange),
        getReachByPlatform(siteId, timeRange),
        getPostingMetrics(siteId, timeRange),
        getPostingTrend(siteId, timeRange),
        getPostingByPlatform(siteId, timeRange),
        getOptimalTimes(siteId, timeRange),
        getHeatmapData(siteId, timeRange),
      ]);

      setPlatformOverview(overview);
      setTopContent(content);
      setContentTypes(types);
      setAudienceGrowth(growth);
      setDemographics(demo);
      setEngagementMetrics(engagement);
      setEngagementTrend(engTrend);
      setEngagementByType(engType);
      setReachMetrics(reach);
      setReachTrend(rchTrend);
      setReachByPlatform(rchPlatform);
      setPostingMetrics(posting);
      setPostingTrend(postTrend);
      setPostingByPlatform(postPlatform);
      setOptimalTimes(optimal);
      setHeatmapData(heatmap);
    } catch (error) {
      console.error("Failed to fetch social analytics:", error);
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
    setTimeRange(value as SocialTimeRange);
    setIsLoading(true);
  };

  // Loading skeleton
  if (isLoading && !platformOverview) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-xl" />
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
          <h1 className="text-2xl font-bold">Social Media Analytics</h1>
          <p className="text-muted-foreground">
            Track performance across all your social platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
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

      {/* Overview Metrics */}
      {platformOverview && <PlatformOverviewCards data={platformOverview} />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="reach" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reach
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="audience" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Audience
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Timing
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {platformOverview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlatformBreakdownList platforms={platformOverview.platforms} />
              <PlatformFollowersPieChart platforms={platformOverview.platforms} />
            </div>
          )}
          
          {platformOverview && (
            <PlatformComparisonChart platforms={platformOverview.platforms} />
          )}

          {topContent && <TopContentList content={topContent} />}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {engagementMetrics && <EngagementMetricsCards data={engagementMetrics} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {engagementMetrics && <EngagementRateCard data={engagementMetrics} />}
            {engagementByType && <EngagementByTypeChart data={engagementByType} />}
            {engagementMetrics && <EngagementBreakdownList data={engagementMetrics} />}
          </div>

          {engagementTrend && <EngagementTrendChart data={engagementTrend} />}
        </TabsContent>

        {/* Reach Tab */}
        <TabsContent value="reach" className="space-y-6">
          {reachMetrics && <ReachMetricsCards data={reachMetrics} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reachMetrics && <ReachSourceBreakdown data={reachMetrics} />}
            {reachMetrics && <ImpressionsReachComparison data={reachMetrics} />}
          </div>

          {reachTrend && <ReachTrendChart data={reachTrend} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reachTrend && <ReachBySourceChart data={reachTrend} />}
            {reachByPlatform && <ReachByPlatformChart data={reachByPlatform} />}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {postingMetrics && <PostingMetricsCards data={postingMetrics} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {postingMetrics && <PostStatusBreakdown data={postingMetrics} />}
            {contentTypes && <ContentTypeDistribution data={contentTypes} />}
          </div>

          {contentTypes && <ContentTypePerformanceChart data={contentTypes} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {postingTrend && <PostingTrendChart data={postingTrend} />}
            {postingByPlatform && <PostingByPlatformChart data={postingByPlatform} />}
          </div>

          {topContent && <TopContentList content={topContent} />}
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          {audienceGrowth && <AudienceGrowthStats data={audienceGrowth} />}
          
          {audienceGrowth && <AudienceGrowthChart data={audienceGrowth} />}
          
          {audienceGrowth && <FollowerGainLossChart data={audienceGrowth} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {demographics && <AgeDemographicsChart data={demographics} />}
            {demographics && <GenderDemographicsChart data={demographics} />}
          </div>

          {demographics && <TopLocationsChart data={demographics} />}
        </TabsContent>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-6">
          {optimalTimes && <OptimalTimesChart data={optimalTimes} />}
          
          {heatmapData && <ActivityHeatmap data={heatmapData} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

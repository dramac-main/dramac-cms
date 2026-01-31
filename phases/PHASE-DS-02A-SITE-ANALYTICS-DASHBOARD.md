# PHASE-DS-02A: Site Analytics Dashboard

## Overview
- **Objective**: Build a comprehensive site analytics dashboard with real-time metrics, visitor statistics, and performance monitoring for individual sites
- **Scope**: Analytics types, server actions for data fetching, main dashboard layout, metric cards, and data overview components
- **Dependencies**: PHASE-DS-01A (Widget System), PHASE-DS-01B (Interactive Charts)
- **Estimated Effort**: ~8 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (widget system, server actions, module access)
- [x] No conflicts detected

## What We're Building

### Site Analytics Dashboard Features
1. **Overview Metrics Grid** - Page views, visitors, bounce rate, session duration
2. **Real-time Visitor Counter** - Live visitor tracking with sparkline
3. **Top Pages Table** - Most visited pages with view counts
4. **Traffic Sources Breakdown** - Where visitors come from
5. **Device/Browser Distribution** - User agent analytics
6. **Geographic Distribution** - Visitor locations
7. **Time-based Analytics** - Hourly/daily/weekly patterns
8. **Performance Metrics** - Page load times, Core Web Vitals

---

## Implementation Steps

### Step 1: Create Site Analytics Types

**File**: `src/types/site-analytics.ts`
**Action**: Create

```typescript
// Types for site analytics dashboard

export type AnalyticsTimeRange = '24h' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

// Core metric types
export interface AnalyticsMetric {
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface SiteOverviewMetrics {
  pageViews: AnalyticsMetric;
  uniqueVisitors: AnalyticsMetric;
  bounceRate: AnalyticsMetric;
  avgSessionDuration: AnalyticsMetric;
  pagesPerSession: AnalyticsMetric;
  newVsReturning: {
    new: number;
    returning: number;
  };
}

// Page analytics
export interface PageAnalytics {
  path: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  entrances: number;
  exits: number;
}

// Traffic source types
export type TrafficSourceType = 'organic' | 'direct' | 'referral' | 'social' | 'email' | 'paid' | 'other';

export interface TrafficSource {
  source: string;
  type: TrafficSourceType;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions?: number;
}

// Device and browser analytics
export interface DeviceAnalytics {
  device: 'desktop' | 'mobile' | 'tablet';
  visitors: number;
  percentage: number;
  pageViews: number;
  bounceRate: number;
}

export interface BrowserAnalytics {
  browser: string;
  version?: string;
  visitors: number;
  percentage: number;
}

export interface OSAnalytics {
  os: string;
  version?: string;
  visitors: number;
  percentage: number;
}

// Geographic analytics
export interface GeoAnalytics {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
}

// Time-based analytics
export interface TimeSeriesDataPoint {
  timestamp: Date;
  date: string; // formatted date string
  hour?: number;
  pageViews: number;
  visitors: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
}

// Real-time analytics
export interface RealtimeAnalytics {
  activeVisitors: number;
  activePages: {
    path: string;
    title: string;
    visitors: number;
  }[];
  recentEvents: {
    type: string;
    path: string;
    timestamp: Date;
    country?: string;
  }[];
}

// Performance metrics
export interface PerformanceMetrics {
  avgLoadTime: number;
  avgFirstContentfulPaint: number;
  avgLargestContentfulPaint: number;
  avgCumulativeLayoutShift: number;
  avgFirstInputDelay: number;
  avgTimeToInteractive: number;
}

// Full site analytics response
export interface SiteAnalyticsData {
  siteId: string;
  siteName: string;
  timeRange: AnalyticsTimeRange;
  dateRange: DateRange;
  overview: SiteOverviewMetrics;
  topPages: PageAnalytics[];
  trafficSources: TrafficSource[];
  devices: DeviceAnalytics[];
  browsers: BrowserAnalytics[];
  operatingSystems: OSAnalytics[];
  geographic: GeoAnalytics[];
  timeSeries: TimeSeriesDataPoint[];
  realtime?: RealtimeAnalytics;
  performance?: PerformanceMetrics;
}

// Chart data formatted types
export interface AnalyticsChartData {
  label: string;
  value: number;
  [key: string]: string | number;
}

// Filters for analytics
export interface AnalyticsFilters {
  timeRange: AnalyticsTimeRange;
  customDateRange?: DateRange;
  compareWithPrevious?: boolean;
  country?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  source?: TrafficSourceType;
}

// Component props types
export interface SiteAnalyticsDashboardProps {
  siteId: string;
  siteName: string;
  initialTimeRange?: AnalyticsTimeRange;
}

export interface AnalyticsMetricCardProps {
  title: string;
  metric: AnalyticsMetric;
  format?: 'number' | 'percentage' | 'duration' | 'compact';
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  sparklineData?: number[];
  loading?: boolean;
}
```

### Step 2: Create Analytics Server Actions

**File**: `src/lib/actions/site-analytics.ts`
**Action**: Create

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  SiteAnalyticsData,
  AnalyticsFilters,
  SiteOverviewMetrics,
  PageAnalytics,
  TrafficSource,
  DeviceAnalytics,
  BrowserAnalytics,
  GeoAnalytics,
  TimeSeriesDataPoint,
  RealtimeAnalytics,
  PerformanceMetrics,
  AnalyticsTimeRange,
  DateRange,
} from "@/types/site-analytics";
import { subDays, subHours, subMonths, startOfDay, endOfDay, format, differenceInDays } from "date-fns";

// Helper to calculate date range from time range
function getDateRange(timeRange: AnalyticsTimeRange, customRange?: DateRange): DateRange {
  const now = new Date();
  let start: Date;
  
  switch (timeRange) {
    case '24h':
      start = subHours(now, 24);
      break;
    case '7d':
      start = subDays(now, 7);
      break;
    case '30d':
      start = subDays(now, 30);
      break;
    case '90d':
      start = subDays(now, 90);
      break;
    case '1y':
      start = subMonths(now, 12);
      break;
    case 'custom':
      if (customRange) {
        return customRange;
      }
      start = subDays(now, 30);
      break;
    default:
      start = subDays(now, 7);
  }
  
  return { start: startOfDay(start), end: endOfDay(now) };
}

// Helper to calculate previous period for comparison
function getPreviousPeriod(dateRange: DateRange): DateRange {
  const daysDiff = differenceInDays(dateRange.end, dateRange.start);
  return {
    start: subDays(dateRange.start, daysDiff + 1),
    end: subDays(dateRange.start, 1),
  };
}

// Calculate change and trend
function calculateChange(current: number, previous: number): { change: number; changePercent: number; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return { change: current, changePercent: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
  }
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  return { change, changePercent, trend };
}

/**
 * Get site analytics overview metrics
 */
export async function getSiteOverviewMetrics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: SiteOverviewMetrics | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const dateRange = getDateRange(filters.timeRange, filters.customDateRange);
    const previousRange = getPreviousPeriod(dateRange);

    // For now, return mock data - in production, this would query analytics tables
    // This can be connected to module_analytics_events or a dedicated analytics service
    
    // Mock current period data
    const currentData = {
      pageViews: Math.floor(Math.random() * 50000) + 10000,
      uniqueVisitors: Math.floor(Math.random() * 20000) + 5000,
      bounceRate: Math.random() * 30 + 30, // 30-60%
      avgSessionDuration: Math.random() * 180 + 60, // 60-240 seconds
      pagesPerSession: Math.random() * 3 + 1.5, // 1.5-4.5
      newVisitors: Math.floor(Math.random() * 10000) + 3000,
      returningVisitors: Math.floor(Math.random() * 10000) + 2000,
    };

    // Mock previous period data (slightly different)
    const previousData = {
      pageViews: Math.floor(currentData.pageViews * (0.8 + Math.random() * 0.4)),
      uniqueVisitors: Math.floor(currentData.uniqueVisitors * (0.8 + Math.random() * 0.4)),
      bounceRate: currentData.bounceRate * (0.9 + Math.random() * 0.2),
      avgSessionDuration: currentData.avgSessionDuration * (0.85 + Math.random() * 0.3),
      pagesPerSession: currentData.pagesPerSession * (0.9 + Math.random() * 0.2),
    };

    const pageViewsChange = calculateChange(currentData.pageViews, previousData.pageViews);
    const visitorsChange = calculateChange(currentData.uniqueVisitors, previousData.uniqueVisitors);
    const bounceChange = calculateChange(currentData.bounceRate, previousData.bounceRate);
    const sessionChange = calculateChange(currentData.avgSessionDuration, previousData.avgSessionDuration);
    const pagesChange = calculateChange(currentData.pagesPerSession, previousData.pagesPerSession);

    const metrics: SiteOverviewMetrics = {
      pageViews: {
        value: currentData.pageViews,
        previousValue: previousData.pageViews,
        ...pageViewsChange,
      },
      uniqueVisitors: {
        value: currentData.uniqueVisitors,
        previousValue: previousData.uniqueVisitors,
        ...visitorsChange,
      },
      bounceRate: {
        value: currentData.bounceRate,
        previousValue: previousData.bounceRate,
        ...bounceChange,
        // For bounce rate, down is good
        trend: bounceChange.change < 0 ? 'up' : bounceChange.change > 0 ? 'down' : 'neutral',
      },
      avgSessionDuration: {
        value: currentData.avgSessionDuration,
        previousValue: previousData.avgSessionDuration,
        ...sessionChange,
      },
      pagesPerSession: {
        value: currentData.pagesPerSession,
        previousValue: previousData.pagesPerSession,
        ...pagesChange,
      },
      newVsReturning: {
        new: currentData.newVisitors,
        returning: currentData.returningVisitors,
      },
    };

    return { data: metrics, error: null };
  } catch (error) {
    console.error("Error fetching site overview metrics:", error);
    return { data: null, error: "Failed to fetch analytics data" };
  }
}

/**
 * Get top pages for a site
 */
export async function getTopPages(
  siteId: string,
  filters: AnalyticsFilters,
  limit: number = 10
): Promise<{ data: PageAnalytics[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Get actual pages from the site
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("id, title, slug, is_homepage")
      .eq("site_id", siteId)
      .limit(limit);

    if (pagesError) throw pagesError;

    // Generate mock analytics for each page
    const topPages: PageAnalytics[] = (pages || []).map((page, index) => ({
      path: page.is_homepage ? "/" : `/${page.slug}`,
      title: page.title || "Untitled Page",
      views: Math.floor(Math.random() * 5000) + 500 - index * 200,
      uniqueViews: Math.floor(Math.random() * 3000) + 300 - index * 100,
      avgTimeOnPage: Math.random() * 120 + 30,
      bounceRate: Math.random() * 40 + 20,
      entrances: Math.floor(Math.random() * 1000) + 100,
      exits: Math.floor(Math.random() * 800) + 80,
    })).sort((a, b) => b.views - a.views);

    return { data: topPages, error: null };
  } catch (error) {
    console.error("Error fetching top pages:", error);
    return { data: null, error: "Failed to fetch top pages" };
  }
}

/**
 * Get traffic sources breakdown
 */
export async function getTrafficSources(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: TrafficSource[] | null; error: string | null }> {
  try {
    // Mock traffic sources data
    const sources: TrafficSource[] = [
      {
        source: "Google",
        type: "organic",
        visitors: Math.floor(Math.random() * 5000) + 2000,
        pageViews: Math.floor(Math.random() * 15000) + 5000,
        bounceRate: Math.random() * 20 + 30,
        avgSessionDuration: Math.random() * 120 + 60,
        conversions: Math.floor(Math.random() * 100) + 20,
      },
      {
        source: "Direct",
        type: "direct",
        visitors: Math.floor(Math.random() * 3000) + 1000,
        pageViews: Math.floor(Math.random() * 10000) + 3000,
        bounceRate: Math.random() * 20 + 25,
        avgSessionDuration: Math.random() * 150 + 90,
        conversions: Math.floor(Math.random() * 80) + 15,
      },
      {
        source: "Facebook",
        type: "social",
        visitors: Math.floor(Math.random() * 2000) + 500,
        pageViews: Math.floor(Math.random() * 5000) + 1500,
        bounceRate: Math.random() * 25 + 40,
        avgSessionDuration: Math.random() * 90 + 45,
        conversions: Math.floor(Math.random() * 50) + 10,
      },
      {
        source: "Twitter",
        type: "social",
        visitors: Math.floor(Math.random() * 1500) + 300,
        pageViews: Math.floor(Math.random() * 4000) + 1000,
        bounceRate: Math.random() * 30 + 45,
        avgSessionDuration: Math.random() * 60 + 30,
        conversions: Math.floor(Math.random() * 30) + 5,
      },
      {
        source: "LinkedIn",
        type: "social",
        visitors: Math.floor(Math.random() * 1000) + 200,
        pageViews: Math.floor(Math.random() * 2500) + 500,
        bounceRate: Math.random() * 20 + 35,
        avgSessionDuration: Math.random() * 100 + 60,
        conversions: Math.floor(Math.random() * 40) + 8,
      },
      {
        source: "Newsletter",
        type: "email",
        visitors: Math.floor(Math.random() * 800) + 150,
        pageViews: Math.floor(Math.random() * 2000) + 400,
        bounceRate: Math.random() * 15 + 20,
        avgSessionDuration: Math.random() * 180 + 120,
        conversions: Math.floor(Math.random() * 60) + 20,
      },
      {
        source: "Partner Sites",
        type: "referral",
        visitors: Math.floor(Math.random() * 600) + 100,
        pageViews: Math.floor(Math.random() * 1500) + 300,
        bounceRate: Math.random() * 25 + 35,
        avgSessionDuration: Math.random() * 90 + 50,
        conversions: Math.floor(Math.random() * 25) + 5,
      },
    ].sort((a, b) => b.visitors - a.visitors);

    return { data: sources, error: null };
  } catch (error) {
    console.error("Error fetching traffic sources:", error);
    return { data: null, error: "Failed to fetch traffic sources" };
  }
}

/**
 * Get device breakdown
 */
export async function getDeviceAnalytics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: DeviceAnalytics[] | null; error: string | null }> {
  try {
    const totalVisitors = Math.floor(Math.random() * 20000) + 10000;
    const desktopPercent = Math.random() * 20 + 45; // 45-65%
    const mobilePercent = Math.random() * 15 + 30; // 30-45%
    const tabletPercent = 100 - desktopPercent - mobilePercent;

    const devices: DeviceAnalytics[] = [
      {
        device: "desktop",
        visitors: Math.floor(totalVisitors * (desktopPercent / 100)),
        percentage: desktopPercent,
        pageViews: Math.floor(totalVisitors * (desktopPercent / 100) * 2.5),
        bounceRate: Math.random() * 15 + 30,
      },
      {
        device: "mobile",
        visitors: Math.floor(totalVisitors * (mobilePercent / 100)),
        percentage: mobilePercent,
        pageViews: Math.floor(totalVisitors * (mobilePercent / 100) * 1.8),
        bounceRate: Math.random() * 20 + 45,
      },
      {
        device: "tablet",
        visitors: Math.floor(totalVisitors * (tabletPercent / 100)),
        percentage: tabletPercent,
        pageViews: Math.floor(totalVisitors * (tabletPercent / 100) * 2.2),
        bounceRate: Math.random() * 15 + 35,
      },
    ];

    return { data: devices, error: null };
  } catch (error) {
    console.error("Error fetching device analytics:", error);
    return { data: null, error: "Failed to fetch device analytics" };
  }
}

/**
 * Get browser distribution
 */
export async function getBrowserAnalytics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: BrowserAnalytics[] | null; error: string | null }> {
  try {
    const totalVisitors = Math.floor(Math.random() * 20000) + 10000;
    
    const browsers: BrowserAnalytics[] = [
      { browser: "Chrome", visitors: Math.floor(totalVisitors * 0.65), percentage: 65 },
      { browser: "Safari", visitors: Math.floor(totalVisitors * 0.18), percentage: 18 },
      { browser: "Firefox", visitors: Math.floor(totalVisitors * 0.08), percentage: 8 },
      { browser: "Edge", visitors: Math.floor(totalVisitors * 0.06), percentage: 6 },
      { browser: "Other", visitors: Math.floor(totalVisitors * 0.03), percentage: 3 },
    ];

    return { data: browsers, error: null };
  } catch (error) {
    console.error("Error fetching browser analytics:", error);
    return { data: null, error: "Failed to fetch browser analytics" };
  }
}

/**
 * Get geographic distribution
 */
export async function getGeoAnalytics(
  siteId: string,
  filters: AnalyticsFilters,
  limit: number = 10
): Promise<{ data: GeoAnalytics[] | null; error: string | null }> {
  try {
    const countries: GeoAnalytics[] = [
      { country: "United States", countryCode: "US", visitors: 8500, pageViews: 25000, bounceRate: 35 },
      { country: "United Kingdom", countryCode: "GB", visitors: 3200, pageViews: 9500, bounceRate: 38 },
      { country: "Germany", countryCode: "DE", visitors: 2100, pageViews: 6300, bounceRate: 42 },
      { country: "Canada", countryCode: "CA", visitors: 1800, pageViews: 5200, bounceRate: 36 },
      { country: "Australia", countryCode: "AU", visitors: 1500, pageViews: 4300, bounceRate: 40 },
      { country: "France", countryCode: "FR", visitors: 1200, pageViews: 3500, bounceRate: 44 },
      { country: "India", countryCode: "IN", visitors: 1100, pageViews: 2800, bounceRate: 52 },
      { country: "Brazil", countryCode: "BR", visitors: 800, pageViews: 2100, bounceRate: 48 },
      { country: "Japan", countryCode: "JP", visitors: 700, pageViews: 1900, bounceRate: 38 },
      { country: "Netherlands", countryCode: "NL", visitors: 600, pageViews: 1700, bounceRate: 35 },
    ].slice(0, limit);

    return { data: countries, error: null };
  } catch (error) {
    console.error("Error fetching geo analytics:", error);
    return { data: null, error: "Failed to fetch geographic data" };
  }
}

/**
 * Get time series analytics data
 */
export async function getTimeSeriesAnalytics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: TimeSeriesDataPoint[] | null; error: string | null }> {
  try {
    const dateRange = getDateRange(filters.timeRange, filters.customDateRange);
    const daysDiff = differenceInDays(dateRange.end, dateRange.start);
    
    // Generate data points based on time range
    const dataPoints: TimeSeriesDataPoint[] = [];
    const isHourly = filters.timeRange === '24h';
    const intervals = isHourly ? 24 : Math.min(daysDiff, 90);
    
    for (let i = 0; i < intervals; i++) {
      const timestamp = isHourly 
        ? subHours(dateRange.end, intervals - i - 1)
        : subDays(dateRange.end, intervals - i - 1);
      
      // Generate realistic traffic patterns (higher during business hours)
      const hourFactor = isHourly ? (Math.sin((timestamp.getHours() - 6) * Math.PI / 12) + 1) / 2 : 1;
      const dayFactor = timestamp.getDay() === 0 || timestamp.getDay() === 6 ? 0.6 : 1; // Weekend dip
      const baseFactor = hourFactor * dayFactor;
      
      dataPoints.push({
        timestamp,
        date: isHourly 
          ? format(timestamp, "HH:mm")
          : format(timestamp, "MMM d"),
        hour: isHourly ? timestamp.getHours() : undefined,
        pageViews: Math.floor((Math.random() * 500 + 200) * baseFactor),
        visitors: Math.floor((Math.random() * 200 + 80) * baseFactor),
        uniqueVisitors: Math.floor((Math.random() * 150 + 60) * baseFactor),
        bounceRate: Math.random() * 20 + 30,
        avgSessionDuration: Math.random() * 120 + 60,
      });
    }

    return { data: dataPoints, error: null };
  } catch (error) {
    console.error("Error fetching time series analytics:", error);
    return { data: null, error: "Failed to fetch time series data" };
  }
}

/**
 * Get real-time analytics
 */
export async function getRealtimeAnalytics(
  siteId: string
): Promise<{ data: RealtimeAnalytics | null; error: string | null }> {
  try {
    const realtime: RealtimeAnalytics = {
      activeVisitors: Math.floor(Math.random() * 50) + 5,
      activePages: [
        { path: "/", title: "Homepage", visitors: Math.floor(Math.random() * 20) + 3 },
        { path: "/about", title: "About Us", visitors: Math.floor(Math.random() * 10) + 1 },
        { path: "/products", title: "Products", visitors: Math.floor(Math.random() * 8) + 1 },
        { path: "/contact", title: "Contact", visitors: Math.floor(Math.random() * 5) + 1 },
      ],
      recentEvents: Array.from({ length: 10 }, (_, i) => ({
        type: ["pageview", "click", "scroll", "form_start"][Math.floor(Math.random() * 4)],
        path: ["/", "/about", "/products", "/contact", "/blog"][Math.floor(Math.random() * 5)],
        timestamp: subHours(new Date(), Math.random() * 0.5),
        country: ["US", "GB", "DE", "CA", "AU"][Math.floor(Math.random() * 5)],
      })),
    };

    return { data: realtime, error: null };
  } catch (error) {
    console.error("Error fetching realtime analytics:", error);
    return { data: null, error: "Failed to fetch realtime data" };
  }
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: PerformanceMetrics | null; error: string | null }> {
  try {
    const performance: PerformanceMetrics = {
      avgLoadTime: Math.random() * 2000 + 500, // 500-2500ms
      avgFirstContentfulPaint: Math.random() * 1500 + 300, // 300-1800ms
      avgLargestContentfulPaint: Math.random() * 2000 + 1000, // 1000-3000ms
      avgCumulativeLayoutShift: Math.random() * 0.1, // 0-0.1
      avgFirstInputDelay: Math.random() * 100 + 20, // 20-120ms
      avgTimeToInteractive: Math.random() * 3000 + 1500, // 1500-4500ms
    };

    return { data: performance, error: null };
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return { data: null, error: "Failed to fetch performance metrics" };
  }
}

/**
 * Get full site analytics data
 */
export async function getSiteAnalytics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: SiteAnalyticsData | null; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Get site info
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, name")
      .eq("id", siteId)
      .single();

    if (siteError) throw siteError;

    const dateRange = getDateRange(filters.timeRange, filters.customDateRange);

    // Fetch all analytics data in parallel
    const [
      overviewResult,
      topPagesResult,
      trafficResult,
      devicesResult,
      browsersResult,
      geoResult,
      timeSeriesResult,
      realtimeResult,
      performanceResult,
    ] = await Promise.all([
      getSiteOverviewMetrics(siteId, filters),
      getTopPages(siteId, filters),
      getTrafficSources(siteId, filters),
      getDeviceAnalytics(siteId, filters),
      getBrowserAnalytics(siteId, filters),
      getGeoAnalytics(siteId, filters),
      getTimeSeriesAnalytics(siteId, filters),
      getRealtimeAnalytics(siteId),
      getPerformanceMetrics(siteId, filters),
    ]);

    if (!overviewResult.data) throw new Error("Failed to fetch overview metrics");

    const analyticsData: SiteAnalyticsData = {
      siteId,
      siteName: site.name,
      timeRange: filters.timeRange,
      dateRange,
      overview: overviewResult.data,
      topPages: topPagesResult.data || [],
      trafficSources: trafficResult.data || [],
      devices: devicesResult.data || [],
      browsers: browsersResult.data || [],
      operatingSystems: [], // Not implemented yet
      geographic: geoResult.data || [],
      timeSeries: timeSeriesResult.data || [],
      realtime: realtimeResult.data || undefined,
      performance: performanceResult.data || undefined,
    };

    return { data: analyticsData, error: null };
  } catch (error) {
    console.error("Error fetching site analytics:", error);
    return { data: null, error: "Failed to fetch site analytics" };
  }
}
```

### Step 3: Create Analytics Overview Metrics Component

**File**: `src/components/analytics/site-analytics-metrics.tsx`
**Action**: Create

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Users,
  Timer,
  TrendingDown,
  FileText,
  UserPlus,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import type { SiteOverviewMetrics, AnalyticsMetric } from "@/types/site-analytics";

interface AnalyticsMetricCardProps {
  title: string;
  metric: AnalyticsMetric;
  format?: "number" | "percentage" | "duration" | "decimal";
  icon?: React.ReactNode;
  iconBg?: string;
  invertTrend?: boolean; // For metrics where down is good (bounce rate)
  loading?: boolean;
}

// Format duration in seconds to human readable
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

// Format number with commas
function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

// Format percentage
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Format decimal
function formatDecimal(value: number): string {
  return value.toFixed(2);
}

function formatMetricValue(
  value: number,
  format: AnalyticsMetricCardProps["format"]
): string {
  switch (format) {
    case "percentage":
      return formatPercentage(value);
    case "duration":
      return formatDuration(value);
    case "decimal":
      return formatDecimal(value);
    case "number":
    default:
      return formatNumber(value);
  }
}

function AnalyticsMetricCard({
  title,
  metric,
  format = "number",
  icon,
  iconBg = "bg-primary/10",
  invertTrend = false,
  loading = false,
}: AnalyticsMetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine if trend is positive (green) or negative (red)
  const isPositiveTrend = invertTrend
    ? metric.trend === "down"
    : metric.trend === "up";

  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">
              {formatMetricValue(metric.value, format)}
            </p>
            {metric.changePercent !== undefined && (
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                    isPositiveTrend
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : metric.trend === "neutral"
                        ? "bg-muted text-muted-foreground"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(metric.changePercent).toFixed(1)}%
                </div>
                <span className="text-xs text-muted-foreground">vs previous</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("rounded-lg p-3", iconBg)}>{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SiteAnalyticsMetricsProps {
  metrics: SiteOverviewMetrics | null;
  loading?: boolean;
  className?: string;
}

export function SiteAnalyticsMetrics({
  metrics,
  loading = false,
  className,
}: SiteAnalyticsMetricsProps) {
  const metricsConfig = [
    {
      key: "pageViews",
      title: "Page Views",
      icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      format: "number" as const,
    },
    {
      key: "uniqueVisitors",
      title: "Unique Visitors",
      icon: <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      format: "number" as const,
    },
    {
      key: "bounceRate",
      title: "Bounce Rate",
      icon: <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      format: "percentage" as const,
      invertTrend: true,
    },
    {
      key: "avgSessionDuration",
      title: "Avg. Session Duration",
      icon: <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      format: "duration" as const,
    },
    {
      key: "pagesPerSession",
      title: "Pages / Session",
      icon: <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      format: "decimal" as const,
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-5", className)}>
      {metricsConfig.map((config) => (
        <AnalyticsMetricCard
          key={config.key}
          title={config.title}
          metric={
            metrics
              ? (metrics[config.key as keyof SiteOverviewMetrics] as AnalyticsMetric)
              : { value: 0, trend: "neutral" }
          }
          format={config.format}
          icon={config.icon}
          iconBg={config.iconBg}
          invertTrend={config.invertTrend}
          loading={loading}
        />
      ))}
    </div>
  );
}

interface NewVsReturningCardProps {
  newVisitors: number;
  returningVisitors: number;
  loading?: boolean;
  className?: string;
}

export function NewVsReturningCard({
  newVisitors,
  returningVisitors,
  loading = false,
  className,
}: NewVsReturningCardProps) {
  const total = newVisitors + returningVisitors;
  const newPercent = total > 0 ? (newVisitors / total) * 100 : 50;
  const returningPercent = total > 0 ? (returningVisitors / total) * 100 : 50;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          New vs Returning Visitors
        </p>
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">New</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(newVisitors)}</p>
            <p className="text-sm text-muted-foreground">
              {newPercent.toFixed(1)}%
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">Returning</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(returningVisitors)}</p>
            <p className="text-sm text-muted-foreground">
              {returningPercent.toFixed(1)}%
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden flex">
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${newPercent}%` }}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${returningPercent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { AnalyticsMetricCard, formatDuration, formatNumber, formatPercentage };
```

### Step 4: Create Top Pages Table Component

**File**: `src/components/analytics/top-pages-table.tsx`
**Action**: Create

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { PageAnalytics } from "@/types/site-analytics";
import { formatDuration, formatNumber } from "./site-analytics-metrics";

interface TopPagesTableProps {
  pages: PageAnalytics[];
  loading?: boolean;
  showExternalLinks?: boolean;
  siteUrl?: string;
  className?: string;
  maxRows?: number;
}

export function TopPagesTable({
  pages,
  loading = false,
  showExternalLinks = false,
  siteUrl,
  className,
  maxRows = 10,
}: TopPagesTableProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayPages = pages.slice(0, maxRows);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Top Pages</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Unique</TableHead>
              <TableHead className="text-right">Avg. Time</TableHead>
              <TableHead className="text-right">Bounce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayPages.map((page, index) => (
              <TableRow key={page.path}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">
                        {page.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {page.path}
                      </span>
                    </div>
                    {showExternalLinks && siteUrl && (
                      <a
                        href={`${siteUrl}${page.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(page.views)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatNumber(page.uniqueViews)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDuration(page.avgTimeOnPage)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-normal",
                      page.bounceRate < 40
                        ? "border-emerald-500/50 text-emerald-600"
                        : page.bounceRate > 60
                          ? "border-rose-500/50 text-rose-600"
                          : "border-muted"
                    )}
                  >
                    {page.bounceRate.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pages.length > maxRows && (
          <div className="mt-4 text-center">
            <button className="text-sm text-muted-foreground hover:text-primary">
              View all {pages.length} pages
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TopPagesCompactProps {
  pages: PageAnalytics[];
  loading?: boolean;
  className?: string;
  maxRows?: number;
}

export function TopPagesCompact({
  pages,
  loading = false,
  className,
  maxRows = 5,
}: TopPagesCompactProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Pages</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {Array.from({ length: maxRows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxViews = Math.max(...pages.map((p) => p.views));

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Top Pages</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {pages.slice(0, maxRows).map((page, index) => (
            <div key={page.path} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[200px] font-medium">
                  {page.path === "/" ? "Homepage" : page.title}
                </span>
                <span className="text-muted-foreground ml-2">
                  {formatNumber(page.views)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${(page.views / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Create Traffic Sources Component

**File**: `src/components/analytics/traffic-sources.tsx`
**Action**: Create

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Globe,
  Share2,
  Mail,
  Link2,
  DollarSign,
  HelpCircle,
} from "lucide-react";
import { PieChartWidget } from "@/components/dashboard/widgets";
import type { TrafficSource, TrafficSourceType } from "@/types/site-analytics";
import { formatNumber, formatPercentage } from "./site-analytics-metrics";

const sourceIcons: Record<TrafficSourceType, React.ReactNode> = {
  organic: <Search className="h-4 w-4" />,
  direct: <Globe className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  referral: <Link2 className="h-4 w-4" />,
  paid: <DollarSign className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

const sourceColors: Record<TrafficSourceType, string> = {
  organic: "bg-emerald-500",
  direct: "bg-blue-500",
  social: "bg-purple-500",
  email: "bg-orange-500",
  referral: "bg-cyan-500",
  paid: "bg-rose-500",
  other: "bg-gray-500",
};

const sourceBgColors: Record<TrafficSourceType, string> = {
  organic: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  direct: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  social: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  email: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  referral: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  paid: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  other: "bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400",
};

interface TrafficSourcesChartProps {
  sources: TrafficSource[];
  loading?: boolean;
  className?: string;
}

export function TrafficSourcesChart({
  sources,
  loading = false,
  className,
}: TrafficSourcesChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px]">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Aggregate by source type
  const aggregated = sources.reduce(
    (acc, source) => {
      if (!acc[source.type]) {
        acc[source.type] = { visitors: 0, pageViews: 0 };
      }
      acc[source.type].visitors += source.visitors;
      acc[source.type].pageViews += source.pageViews;
      return acc;
    },
    {} as Record<TrafficSourceType, { visitors: number; pageViews: number }>
  );

  const chartData = Object.entries(aggregated)
    .map(([type, data]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: data.visitors,
    }))
    .sort((a, b) => b.value - a.value);

  const totalVisitors = chartData.reduce((sum, d) => sum + d.value, 0);

  const colors = [
    "hsl(142, 76%, 36%)", // emerald (organic)
    "hsl(221, 83%, 53%)", // blue (direct)
    "hsl(262, 83%, 58%)", // purple (social)
    "hsl(25, 95%, 53%)", // orange (email)
    "hsl(187, 85%, 43%)", // cyan (referral)
    "hsl(0, 84%, 60%)", // rose (paid)
    "hsl(220, 9%, 46%)", // gray (other)
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChartWidget
          data={chartData}
          donut
          height={250}
          centerValue={totalVisitors}
          centerLabel="Visitors"
          colors={colors}
          formatValue={(v) => formatNumber(v)}
        />
      </CardContent>
    </Card>
  );
}

interface TrafficSourcesListProps {
  sources: TrafficSource[];
  loading?: boolean;
  className?: string;
  showDetails?: boolean;
}

export function TrafficSourcesList({
  sources,
  loading = false,
  className,
  showDetails = true,
}: TrafficSourcesListProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Traffic Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisitors = sources.reduce((sum, s) => sum + s.visitors, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sources.map((source) => {
            const percentage = (source.visitors / totalVisitors) * 100;
            return (
              <div key={source.source} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded",
                      sourceBgColors[source.type]
                    )}
                  >
                    {sourceIcons[source.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{source.source}</span>
                      <span className="text-sm font-medium">
                        {formatNumber(source.visitors)}
                      </span>
                    </div>
                    {showDetails && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatPercentage(percentage)}</span>
                        <span>•</span>
                        <span>Bounce: {source.bounceRate.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      sourceColors[source.type]
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface TrafficSourcesBadgesProps {
  sources: TrafficSource[];
  className?: string;
}

export function TrafficSourcesBadges({
  sources,
  className,
}: TrafficSourcesBadgesProps) {
  const totalVisitors = sources.reduce((sum, s) => sum + s.visitors, 0);

  // Aggregate by type
  const byType = sources.reduce(
    (acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + source.visitors;
      return acc;
    },
    {} as Record<TrafficSourceType, number>
  );

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Object.entries(byType)
        .sort(([, a], [, b]) => b - a)
        .map(([type, visitors]) => (
          <Badge
            key={type}
            variant="outline"
            className={cn("gap-1.5", sourceBgColors[type as TrafficSourceType])}
          >
            {sourceIcons[type as TrafficSourceType]}
            <span className="capitalize">{type}</span>
            <span className="opacity-70">
              {((visitors / totalVisitors) * 100).toFixed(0)}%
            </span>
          </Badge>
        ))}
    </div>
  );
}
```

### Step 6: Create Device Analytics Component

**File**: `src/components/analytics/device-analytics.tsx`
**Action**: Create

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { PieChartWidget, DonutChart } from "@/components/dashboard/widgets";
import type { DeviceAnalytics, BrowserAnalytics } from "@/types/site-analytics";
import { formatNumber, formatPercentage } from "./site-analytics-metrics";

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const deviceColors = {
  desktop: "bg-blue-500",
  mobile: "bg-purple-500",
  tablet: "bg-cyan-500",
};

const deviceBgColors = {
  desktop: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  mobile: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  tablet: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
};

interface DeviceBreakdownProps {
  devices: DeviceAnalytics[];
  loading?: boolean;
  className?: string;
}

export function DeviceBreakdown({
  devices,
  loading = false,
  className,
}: DeviceBreakdownProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-6 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalVisitors = devices.reduce((sum, d) => sum + d.visitors, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Devices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {devices.map((device) => {
            const Icon = deviceIcons[device.device];
            const percentage = (device.visitors / totalVisitors) * 100;
            return (
              <div key={device.device} className="text-center space-y-2">
                <div
                  className={cn(
                    "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
                    deviceBgColors[device.device]
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium capitalize">{device.device}</p>
                <p className="text-2xl font-bold">{percentage.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(device.visitors)} visitors
                </p>
              </div>
            );
          })}
        </div>

        {/* Combined progress bar */}
        <div className="mt-6 h-3 rounded-full bg-muted overflow-hidden flex">
          {devices.map((device) => {
            const percentage = (device.visitors / totalVisitors) * 100;
            return (
              <div
                key={device.device}
                className={cn(
                  "transition-all duration-500",
                  deviceColors[device.device]
                )}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6">
          {devices.map((device) => (
            <div key={device.device} className="flex items-center gap-2 text-xs">
              <div
                className={cn("h-2.5 w-2.5 rounded-full", deviceColors[device.device])}
              />
              <span className="capitalize">{device.device}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DeviceChartProps {
  devices: DeviceAnalytics[];
  loading?: boolean;
  className?: string;
}

export function DeviceChart({
  devices,
  loading = false,
  className,
}: DeviceChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Device Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <Skeleton className="h-[180px] w-[180px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = devices.map((d) => ({
    label: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    value: d.visitors,
  }));

  const totalVisitors = devices.reduce((sum, d) => sum + d.visitors, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Device Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <PieChartWidget
          data={chartData}
          donut
          height={200}
          centerValue={totalVisitors}
          centerLabel="Total"
          colors={["hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(187, 85%, 43%)"]}
          formatValue={(v) => formatNumber(v)}
        />
      </CardContent>
    </Card>
  );
}

interface BrowserBreakdownProps {
  browsers: BrowserAnalytics[];
  loading?: boolean;
  className?: string;
  maxRows?: number;
}

export function BrowserBreakdown({
  browsers,
  loading = false,
  className,
  maxRows = 5,
}: BrowserBreakdownProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Browsers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: maxRows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxVisitors = Math.max(...browsers.map((b) => b.visitors));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Browsers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {browsers.slice(0, maxRows).map((browser) => (
            <div key={browser.browser} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{browser.browser}</span>
                <span className="text-muted-foreground">
                  {browser.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${(browser.visitors / maxVisitors) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 7: Create Analytics Index Export

**File**: `src/components/analytics/index.ts`
**Action**: Create

```typescript
// Site Analytics Components
export * from "./site-analytics-metrics";
export * from "./top-pages-table";
export * from "./traffic-sources";
export * from "./device-analytics";
```

---

## Verification Steps

1. **TypeScript Check**:
   ```bash
   cd next-platform-dashboard && npx tsc --noEmit --skipLibCheck
   ```

2. **Build Check**:
   ```bash
   pnpm build
   ```

3. **Manual Testing**:
   - Import components in a test page
   - Verify metrics display correctly
   - Check loading states
   - Verify dark mode compatibility

## Files Changed Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/types/site-analytics.ts` | Created | Analytics type definitions |
| `src/lib/actions/site-analytics.ts` | Created | Server actions for analytics data |
| `src/components/analytics/site-analytics-metrics.tsx` | Created | Overview metrics cards |
| `src/components/analytics/top-pages-table.tsx` | Created | Top pages table and compact view |
| `src/components/analytics/traffic-sources.tsx` | Created | Traffic sources chart and list |
| `src/components/analytics/device-analytics.tsx` | Created | Device and browser breakdown |
| `src/components/analytics/index.ts` | Created | Barrel export file |

---

## Next Phase: PHASE-DS-02B

Phase DS-02B will add:
- Time series charts (traffic over time)
- Geographic distribution map
- Real-time visitor widget
- Performance metrics cards
- Full analytics dashboard page
- Site detail page integration

---

## Rollback Plan

If issues arise:
1. Delete all files in `src/components/analytics/`
2. Delete `src/types/site-analytics.ts`
3. Delete `src/lib/actions/site-analytics.ts`
4. Run TypeScript check to verify no dependencies

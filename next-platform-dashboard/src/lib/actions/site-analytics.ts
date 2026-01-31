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
    case '12m':
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

// Seeded random for consistent mock data per site
function seededRandom(seed: string, index: number = 0): number {
  let hash = 0;
  const str = seed + index.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

/**
 * Get site analytics overview metrics
 */
export async function getSiteOverviewMetrics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: SiteOverviewMetrics | null; error: string | null }> {
  try {
    const dateRange = getDateRange(filters.timeRange, filters.customDateRange);

    // Generate consistent mock data based on siteId
    const rand = (i: number) => seededRandom(siteId, i);
    
    // Mock current period data
    const currentData = {
      pageViews: Math.floor(rand(1) * 50000) + 10000,
      uniqueVisitors: Math.floor(rand(2) * 20000) + 5000,
      bounceRate: rand(3) * 30 + 30, // 30-60%
      avgSessionDuration: rand(4) * 180 + 60, // 60-240 seconds
      pagesPerSession: rand(5) * 3 + 1.5, // 1.5-4.5
      newVisitors: Math.floor(rand(6) * 10000) + 3000,
      returningVisitors: Math.floor(rand(7) * 10000) + 2000,
    };

    // Mock previous period data (slightly different)
    const previousData = {
      pageViews: Math.floor(currentData.pageViews * (0.8 + rand(8) * 0.4)),
      uniqueVisitors: Math.floor(currentData.uniqueVisitors * (0.8 + rand(9) * 0.4)),
      bounceRate: currentData.bounceRate * (0.9 + rand(10) * 0.2),
      avgSessionDuration: currentData.avgSessionDuration * (0.85 + rand(11) * 0.3),
      pagesPerSession: currentData.pagesPerSession * (0.9 + rand(12) * 0.2),
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
      .select("id, name, slug, is_homepage")
      .eq("site_id", siteId)
      .limit(limit);

    if (pagesError) throw pagesError;

    const rand = (i: number) => seededRandom(siteId + 'pages', i);

    // Generate mock analytics for each page
    const topPages: PageAnalytics[] = (pages || []).map((page, index) => ({
      path: page.is_homepage ? "/" : `/${page.slug}`,
      title: page.name || "Untitled Page",
      views: Math.floor(rand(index * 6) * 5000) + 500 - index * 200,
      uniqueViews: Math.floor(rand(index * 6 + 1) * 3000) + 300 - index * 100,
      avgTimeOnPage: rand(index * 6 + 2) * 120 + 30,
      bounceRate: rand(index * 6 + 3) * 40 + 20,
      entrances: Math.floor(rand(index * 6 + 4) * 1000) + 100,
      exits: Math.floor(rand(index * 6 + 5) * 800) + 80,
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
    const rand = (i: number) => seededRandom(siteId + 'traffic', i);
    
    // Mock traffic sources data
    const sources: TrafficSource[] = [
      {
        source: "Google",
        type: "organic" as const,
        visitors: Math.floor(rand(0) * 5000) + 2000,
        pageViews: Math.floor(rand(1) * 15000) + 5000,
        bounceRate: rand(2) * 20 + 30,
        avgSessionDuration: rand(3) * 120 + 60,
        conversions: Math.floor(rand(4) * 100) + 20,
      },
      {
        source: "Direct",
        type: "direct" as const,
        visitors: Math.floor(rand(5) * 3000) + 1000,
        pageViews: Math.floor(rand(6) * 10000) + 3000,
        bounceRate: rand(7) * 20 + 25,
        avgSessionDuration: rand(8) * 150 + 90,
        conversions: Math.floor(rand(9) * 80) + 15,
      },
      {
        source: "Facebook",
        type: "social" as const,
        visitors: Math.floor(rand(10) * 2000) + 500,
        pageViews: Math.floor(rand(11) * 5000) + 1500,
        bounceRate: rand(12) * 25 + 40,
        avgSessionDuration: rand(13) * 90 + 45,
        conversions: Math.floor(rand(14) * 50) + 10,
      },
      {
        source: "Twitter",
        type: "social" as const,
        visitors: Math.floor(rand(15) * 1500) + 300,
        pageViews: Math.floor(rand(16) * 4000) + 1000,
        bounceRate: rand(17) * 30 + 45,
        avgSessionDuration: rand(18) * 60 + 30,
        conversions: Math.floor(rand(19) * 30) + 5,
      },
      {
        source: "LinkedIn",
        type: "social" as const,
        visitors: Math.floor(rand(20) * 1000) + 200,
        pageViews: Math.floor(rand(21) * 2500) + 500,
        bounceRate: rand(22) * 20 + 35,
        avgSessionDuration: rand(23) * 100 + 60,
        conversions: Math.floor(rand(24) * 40) + 8,
      },
      {
        source: "Newsletter",
        type: "email" as const,
        visitors: Math.floor(rand(25) * 800) + 150,
        pageViews: Math.floor(rand(26) * 2000) + 400,
        bounceRate: rand(27) * 15 + 20,
        avgSessionDuration: rand(28) * 180 + 120,
        conversions: Math.floor(rand(29) * 60) + 20,
      },
      {
        source: "Partner Sites",
        type: "referral" as const,
        visitors: Math.floor(rand(30) * 600) + 100,
        pageViews: Math.floor(rand(31) * 1500) + 300,
        bounceRate: rand(32) * 25 + 35,
        avgSessionDuration: rand(33) * 90 + 50,
        conversions: Math.floor(rand(34) * 25) + 5,
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
    const rand = (i: number) => seededRandom(siteId + 'devices', i);
    const totalVisitors = Math.floor(rand(0) * 20000) + 10000;
    const desktopPercent = rand(1) * 20 + 45; // 45-65%
    const mobilePercent = rand(2) * 15 + 30; // 30-45%
    const tabletPercent = 100 - desktopPercent - mobilePercent;

    const devices: DeviceAnalytics[] = [
      {
        device: "desktop",
        visitors: Math.floor(totalVisitors * (desktopPercent / 100)),
        percentage: desktopPercent,
        pageViews: Math.floor(totalVisitors * (desktopPercent / 100) * 2.5),
        bounceRate: rand(3) * 15 + 30,
        avgSessionDuration: rand(6) * 180 + 120,
      },
      {
        device: "mobile",
        visitors: Math.floor(totalVisitors * (mobilePercent / 100)),
        percentage: mobilePercent,
        pageViews: Math.floor(totalVisitors * (mobilePercent / 100) * 1.8),
        bounceRate: rand(4) * 20 + 45,
        avgSessionDuration: rand(7) * 90 + 60,
      },
      {
        device: "tablet",
        visitors: Math.floor(totalVisitors * (tabletPercent / 100)),
        percentage: tabletPercent,
        pageViews: Math.floor(totalVisitors * (tabletPercent / 100) * 2.2),
        bounceRate: rand(5) * 15 + 35,
        avgSessionDuration: rand(8) * 120 + 90,
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
    const rand = (i: number) => seededRandom(siteId + 'browsers', i);
    const totalVisitors = Math.floor(rand(0) * 20000) + 10000;
    
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
    const rand = (i: number) => seededRandom(siteId + 'geo', i);
    
    const countries: GeoAnalytics[] = [
      { country: "United States", countryCode: "US", visitors: Math.floor(rand(0) * 5000) + 5000, pageViews: Math.floor(rand(1) * 15000) + 15000, bounceRate: rand(2) * 10 + 30 },
      { country: "United Kingdom", countryCode: "GB", visitors: Math.floor(rand(3) * 2000) + 2000, pageViews: Math.floor(rand(4) * 6000) + 6000, bounceRate: rand(5) * 10 + 35 },
      { country: "Germany", countryCode: "DE", visitors: Math.floor(rand(6) * 1500) + 1500, pageViews: Math.floor(rand(7) * 4500) + 4500, bounceRate: rand(8) * 10 + 38 },
      { country: "Canada", countryCode: "CA", visitors: Math.floor(rand(9) * 1200) + 1200, pageViews: Math.floor(rand(10) * 3600) + 3600, bounceRate: rand(11) * 10 + 32 },
      { country: "Australia", countryCode: "AU", visitors: Math.floor(rand(12) * 1000) + 1000, pageViews: Math.floor(rand(13) * 3000) + 3000, bounceRate: rand(14) * 10 + 36 },
      { country: "France", countryCode: "FR", visitors: Math.floor(rand(15) * 800) + 800, pageViews: Math.floor(rand(16) * 2400) + 2400, bounceRate: rand(17) * 10 + 40 },
      { country: "India", countryCode: "IN", visitors: Math.floor(rand(18) * 700) + 700, pageViews: Math.floor(rand(19) * 1800) + 1800, bounceRate: rand(20) * 15 + 45 },
      { country: "Brazil", countryCode: "BR", visitors: Math.floor(rand(21) * 500) + 500, pageViews: Math.floor(rand(22) * 1400) + 1400, bounceRate: rand(23) * 10 + 42 },
      { country: "Japan", countryCode: "JP", visitors: Math.floor(rand(24) * 450) + 450, pageViews: Math.floor(rand(25) * 1200) + 1200, bounceRate: rand(26) * 8 + 34 },
      { country: "Netherlands", countryCode: "NL", visitors: Math.floor(rand(27) * 400) + 400, pageViews: Math.floor(rand(28) * 1100) + 1100, bounceRate: rand(29) * 8 + 32 },
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
    const rand = (i: number) => seededRandom(siteId + 'timeseries', i);
    
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
        pageViews: Math.floor((rand(i * 5) * 500 + 200) * baseFactor),
        visitors: Math.floor((rand(i * 5 + 1) * 200 + 80) * baseFactor),
        uniqueVisitors: Math.floor((rand(i * 5 + 2) * 150 + 60) * baseFactor),
        bounceRate: rand(i * 5 + 3) * 20 + 30,
        avgSessionDuration: rand(i * 5 + 4) * 120 + 60,
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
    const rand = (i: number) => seededRandom(siteId + 'realtime' + Date.now().toString().slice(-4), i);
    const activeUsers = Math.floor(rand(0) * 50) + 5;
    
    const realtime: RealtimeAnalytics = {
      activeVisitors: activeUsers,
      activeUsers,
      pageViewsLastHour: Math.floor(rand(100) * 500) + 100,
      avgTimeOnSite: rand(101) * 180 + 60,
      activePages: [
        { path: "/", title: "Homepage", visitors: Math.floor(rand(1) * 20) + 3 },
        { path: "/about", title: "About Us", visitors: Math.floor(rand(2) * 10) + 1 },
        { path: "/products", title: "Products", visitors: Math.floor(rand(3) * 8) + 1 },
        { path: "/contact", title: "Contact", visitors: Math.floor(rand(4) * 5) + 1 },
      ],
      activeSessions: Array.from({ length: 5 }, (_, i) => ({
        sessionId: `session-${i + 1}`,
        currentPage: ["/", "/about", "/products", "/contact", "/blog"][i % 5],
        duration: Math.floor(rand(50 + i) * 600) + 30,
      })),
      topPagesNow: [
        { path: "/", activeUsers: Math.floor(rand(60) * 15) + 5 },
        { path: "/products", activeUsers: Math.floor(rand(61) * 10) + 3 },
        { path: "/about", activeUsers: Math.floor(rand(62) * 8) + 2 },
      ],
      recentEvents: Array.from({ length: 10 }, (_, i) => ({
        type: ["pageview", "click", "scroll", "form_start"][Math.floor(rand(5 + i) * 4)],
        path: ["/", "/about", "/products", "/contact", "/blog"][Math.floor(rand(15 + i) * 5)],
        timestamp: subHours(new Date(), rand(25 + i) * 0.5),
        country: ["US", "GB", "DE", "CA", "AU"][Math.floor(rand(35 + i) * 5)],
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
  filters?: AnalyticsFilters
): Promise<{ data: PerformanceMetrics | null; error: string | null }> {
  try {
    const rand = (i: number) => seededRandom(siteId + 'perf', i);
    
    const lcp = rand(2) * 2 + 1; // 1-3s
    const fid = rand(4) * 100 + 20; // 20-120ms  
    const cls = rand(3) * 0.1; // 0-0.1
    const ttfb = rand(6) * 0.3 + 0.1; // 0.1-0.4s
    const loadTime = rand(0) * 2 + 0.5; // 0.5-2.5s
    
    // Calculate performance score based on web vitals
    const lcpScore = lcp <= 2.5 ? 100 : lcp <= 4 ? 50 : 0;
    const fidScore = fid <= 100 ? 100 : fid <= 300 ? 50 : 0;
    const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 50 : 0;
    const performanceScore = Math.floor((lcpScore + fidScore + clsScore) / 3);
    
    const performance: PerformanceMetrics = {
      avgLoadTime: loadTime * 1000, // ms
      avgFirstContentfulPaint: rand(1) * 1500 + 300, // 300-1800ms
      avgLargestContentfulPaint: lcp * 1000, // ms
      avgCumulativeLayoutShift: cls,
      avgFirstInputDelay: fid, // ms
      avgTimeToInteractive: rand(5) * 3000 + 1500, // 1500-4500ms
      performanceScore,
      lcp,
      fid,
      cls,
      ttfb,
      loadTime,
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

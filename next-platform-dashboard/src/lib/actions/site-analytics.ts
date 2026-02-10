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
import { subDays, subHours, subMonths, startOfDay, endOfDay, differenceInDays } from "date-fns";

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

// Seeded random — REMOVED: was generating fake analytics data
// Site analytics now uses real database queries where data is available
// and returns zeros/empty for metrics requiring external analytics integration

/**
 * Get site analytics overview metrics
 * Uses real database data where available; visitor tracking requires external analytics integration.
 */
export async function getSiteOverviewMetrics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: SiteOverviewMetrics | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const dateRange = getDateRange(filters.timeRange, filters.customDateRange);
    const prevRange = getPreviousPeriod(dateRange);

    // Query real data: pages count as a content metric
    const { count: pagesCount } = await supabase
      .from("pages")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId);

    // Query form submissions in current period
    const { count: currentSubmissions } = await supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString());

    // Query form submissions in previous period
    const { count: prevSubmissions } = await supabase
      .from("form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .gte("created_at", prevRange.start.toISOString())
      .lte("created_at", prevRange.end.toISOString());

    const submissionsCurrent = currentSubmissions || 0;
    const submissionsPrev = prevSubmissions || 0;
    const submissionsChange = calculateChange(submissionsCurrent, submissionsPrev);

    // Note: pageViews, uniqueVisitors, bounceRate, avgSessionDuration, pagesPerSession
    // require external analytics integration (e.g., Google Analytics, Plausible, Umami).
    // We return form submissions as a proxy for engagement, and zeros for visitor metrics.
    const metrics: SiteOverviewMetrics = {
      pageViews: {
        value: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral' as const,
      },
      uniqueVisitors: {
        value: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral' as const,
      },
      bounceRate: {
        value: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral' as const,
      },
      avgSessionDuration: {
        value: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral' as const,
      },
      pagesPerSession: {
        value: pagesCount || 0,
        previousValue: pagesCount || 0,
        change: 0,
        changePercent: 0,
        trend: 'neutral' as const,
      },
      newVsReturning: {
        new: submissionsCurrent,
        returning: 0,
      },
    };

    return { data: metrics, error: null };
  } catch (error) {
    console.error("Error fetching site overview metrics:", error);
    return { data: null, error: "Failed to fetch analytics data" };
  }
}

/**
 * Get top pages for a site (real page data, no visitor tracking yet)
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

    // Return real pages with zero view counts (visitor tracking not implemented)
    const topPages: PageAnalytics[] = (pages || []).map((page) => ({
      path: page.is_homepage ? "/" : `/${page.slug}`,
      title: page.name || "Untitled Page",
      views: 0,
      uniqueViews: 0,
      avgTimeOnPage: 0,
      bounceRate: 0,
      entrances: 0,
      exits: 0,
    }));

    return { data: topPages, error: null };
  } catch (error) {
    console.error("Error fetching top pages:", error);
    return { data: null, error: "Failed to fetch top pages" };
  }
}

/**
 * Get traffic sources — requires external analytics integration
 */
export async function getTrafficSources(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: TrafficSource[] | null; error: string | null }> {
  // Traffic source tracking requires external analytics (Google Analytics, Plausible, etc.)
  return { data: [], error: null };
}

/**
 * Get device breakdown — requires external analytics integration
 */
export async function getDeviceAnalytics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: DeviceAnalytics[] | null; error: string | null }> {
  return { data: [], error: null };
}

/**
 * Get browser distribution — requires external analytics integration
 */
export async function getBrowserAnalytics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: BrowserAnalytics[] | null; error: string | null }> {
  return { data: [], error: null };
}

/**
 * Get geographic distribution — requires external analytics integration
 */
export async function getGeoAnalytics(
  siteId: string,
  filters: AnalyticsFilters,
  limit: number = 10
): Promise<{ data: GeoAnalytics[] | null; error: string | null }> {
  return { data: [], error: null };
}

/**
 * Get time series analytics data — requires external analytics integration
 */
export async function getTimeSeriesAnalytics(
  siteId: string,
  filters: AnalyticsFilters
): Promise<{ data: TimeSeriesDataPoint[] | null; error: string | null }> {
  return { data: [], error: null };
}

/**
 * Get real-time analytics — requires external analytics integration
 */
export async function getRealtimeAnalytics(
  siteId: string
): Promise<{ data: RealtimeAnalytics | null; error: string | null }> {
  const realtime: RealtimeAnalytics = {
    activeVisitors: 0,
    activeUsers: 0,
    pageViewsLastHour: 0,
    avgTimeOnSite: 0,
    activePages: [],
    activeSessions: [],
    topPagesNow: [],
    recentEvents: [],
  };
  return { data: realtime, error: null };
}

/**
 * Get performance metrics — requires external monitoring integration
 */
export async function getPerformanceMetrics(
  siteId: string,
  filters?: AnalyticsFilters
): Promise<{ data: PerformanceMetrics | null; error: string | null }> {
  // Performance metrics require Core Web Vitals tracking (e.g., web-vitals library + reporting endpoint)
  const performance: PerformanceMetrics = {
    avgLoadTime: 0,
    avgFirstContentfulPaint: 0,
    avgLargestContentfulPaint: 0,
    avgCumulativeLayoutShift: 0,
    avgFirstInputDelay: 0,
    avgTimeToInteractive: 0,
    performanceScore: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    loadTime: 0,
  };
  return { data: performance, error: null };
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

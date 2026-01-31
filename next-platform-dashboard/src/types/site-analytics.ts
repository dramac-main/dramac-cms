// Types for site analytics dashboard

export type AnalyticsTimeRange = '24h' | '7d' | '30d' | '90d' | '12m' | '1y' | 'custom';

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
  avgSessionDuration: number;
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
  activeUsers: number;
  pageViewsLastHour: number;
  avgTimeOnSite: number;
  activePages: {
    path: string;
    title: string;
    visitors: number;
  }[];
  activeSessions?: {
    sessionId: string;
    currentPage: string;
    duration: number;
  }[];
  topPagesNow?: {
    path: string;
    activeUsers: number;
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
  performanceScore: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  loadTime: number;
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

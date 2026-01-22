// src/lib/modules/analytics/module-analytics.ts
// Phase EM-03: Module Analytics Service
// Note: After running migration 20260122_module_analytics.sql, regenerate types with:
// npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts

import { createClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsEvent {
  moduleId: string;
  eventType: string;
  eventName: string;
  siteId?: string;
  agencyId?: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsQuery {
  moduleId: string;
  siteId?: string;
  startDate: Date;
  endDate: Date;
  granularity?: "hour" | "day" | "week" | "month";
}

export interface AnalyticsTotals {
  views: number;
  uniqueVisitors: number;
  sessions: number;
  errors: number;
  revenue: number;
}

export interface AnalyticsAverages {
  loadTime: number;
  sessionDuration: number;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  response_time_ms: number | null;
  error_count_last_hour: number;
}

export interface TopEvent {
  event_type: string;
  event_name: string;
  count: number;
}

export interface AnalyticsDashboardData {
  totals: AnalyticsTotals;
  averages: AnalyticsAverages;
  current: {
    activeUsers: number;
    health: HealthStatus;
  };
  timeSeries: DailyAnalytics[];
  topEvents: TopEvent[];
}

export interface DailyAnalytics {
  stat_date: string;
  views: number;
  unique_visitors: number;
  sessions: number;
  active_users: number;
  avg_load_time_ms: number;
  error_count: number;
  revenue_cents: number;
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track an analytics event (client-side safe)
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const response = await fetch("/api/modules/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.warn("Failed to track event:", await response.text());
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn("Analytics tracking error:", error);
  }
}

/**
 * Batch track multiple events (more efficient for high-volume tracking)
 */
export async function trackEvents(events: AnalyticsEvent[]): Promise<void> {
  try {
    const response = await fetch("/api/modules/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch: events }),
    });

    if (!response.ok) {
      console.warn("Failed to track events:", await response.text());
    }
  } catch (error) {
    console.warn("Analytics tracking error:", error);
  }
}

/**
 * Track event server-side (with full context)
 */
export async function trackEventServer(
  event: AnalyticsEvent,
  context: {
    userAgent?: string;
    ip?: string;
    country?: string;
  }
): Promise<void> {
  const supabase = createAdminClient();

  // Hash IP for privacy
  const ipHash = context.ip ? await hashString(context.ip) : null;

  // Detect device type
  const deviceType = detectDeviceType(context.userAgent || "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("module_analytics_events").insert({
    module_id: event.moduleId,
    event_type: event.eventType,
    event_name: event.eventName,
    site_id: event.siteId || null,
    agency_id: event.agencyId || null,
    user_id: event.userId || null,
    session_id: event.sessionId || null,
    properties: event.properties || {},
    user_agent: context.userAgent || null,
    ip_hash: ipHash,
    country: context.country || null,
    device_type: deviceType,
  });

  if (error) {
    console.error("Failed to track event server-side:", error);
    throw error;
  }
}

/**
 * Batch track events server-side
 */
export async function trackEventsServer(
  events: AnalyticsEvent[],
  context: {
    userAgent?: string;
    ip?: string;
    country?: string;
  }
): Promise<void> {
  const supabase = createAdminClient();

  const ipHash = context.ip ? await hashString(context.ip) : null;
  const deviceType = detectDeviceType(context.userAgent || "");

  const records = events.map((event) => ({
    module_id: event.moduleId,
    event_type: event.eventType,
    event_name: event.eventName,
    site_id: event.siteId || null,
    agency_id: event.agencyId || null,
    user_id: event.userId || null,
    session_id: event.sessionId || null,
    properties: event.properties || {},
    user_agent: context.userAgent || null,
    ip_hash: ipHash,
    country: context.country || null,
    device_type: deviceType,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("module_analytics_events").insert(records);

  if (error) {
    console.error("Failed to batch track events server-side:", error);
    throw error;
  }
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get module analytics summary
 */
export async function getModuleAnalytics(query: AnalyticsQuery): Promise<DailyAnalytics[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbQuery = (supabase as any)
    .from("module_analytics_daily")
    .select("*")
    .eq("module_id", query.moduleId)
    .gte("stat_date", query.startDate.toISOString().split("T")[0])
    .lte("stat_date", query.endDate.toISOString().split("T")[0])
    .order("stat_date", { ascending: true });

  if (query.siteId) {
    dbQuery = dbQuery.eq("site_id", query.siteId);
  } else {
    dbQuery = dbQuery.is("site_id", null);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;

  return aggregateByGranularity((data || []) as DailyAnalytics[], query.granularity || "day");
}

/**
 * Get real-time active users
 */
export async function getActiveUsers(moduleId: string, siteId?: string): Promise<number> {
  const supabase = createClient();
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("module_analytics_events")
    .select("session_id", { count: "exact", head: true })
    .eq("module_id", moduleId)
    .gte("created_at", thirtyMinutesAgo.toISOString());

  if (siteId) {
    query = query.eq("site_id", siteId);
  }

  const { count } = await query;
  return count || 0;
}

/**
 * Get top events for a module
 */
export async function getTopEvents(
  moduleId: string,
  startDate: Date,
  endDate: Date,
  limit = 10
): Promise<TopEvent[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_top_module_events", {
    p_module_id: moduleId,
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
    p_limit: limit,
  });

  if (error) {
    // If the RPC doesn't exist, fall back to manual query
    console.warn("get_top_module_events RPC not found, using fallback");
    return getTopEventsFallback(moduleId, startDate, endDate, limit);
  }

  return (data || []) as TopEvent[];
}

/**
 * Fallback for top events if RPC isn't available
 */
async function getTopEventsFallback(
  moduleId: string,
  startDate: Date,
  endDate: Date,
  limit: number
): Promise<TopEvent[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("module_analytics_events")
    .select("event_type, event_name")
    .eq("module_id", moduleId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .limit(1000);

  if (error) {
    console.error("Failed to fetch top events:", error);
    return [];
  }

  // Aggregate client-side
  const counts = new Map<string, number>();
  for (const row of (data || []) as Array<{ event_type: string; event_name: string }>) {
    const key = `${row.event_type}:${row.event_name}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => {
      const [event_type, event_name] = key.split(":");
      return { event_type, event_name, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get module health status
 */
export async function getModuleHealth(moduleId: string, siteId?: string): Promise<HealthStatus> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from("module_health_checks").select("*").eq("module_id", moduleId);

  if (siteId) {
    query = query.eq("site_id", siteId);
  } else {
    query = query.is("site_id", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Failed to fetch module health:", error);
    return {
      status: "unknown",
      response_time_ms: null,
      error_count_last_hour: 0,
    };
  }

  if (!data) {
    return {
      status: "unknown",
      response_time_ms: null,
      error_count_last_hour: 0,
    };
  }

  return {
    status: data.status || "unknown",
    response_time_ms: data.response_time_ms ?? null,
    error_count_last_hour: data.error_count_last_hour ?? 0,
  };
}

/**
 * Update module health status (server-side only)
 */
export async function updateModuleHealth(
  moduleId: string,
  siteId: string | null,
  health: {
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
    responseTimeMs?: number;
    memoryUsageMb?: number;
    cpuUsagePercent?: number;
    lastError?: string;
    errorCountLastHour?: number;
  }
): Promise<void> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("module_health_checks").upsert(
    {
      module_id: moduleId,
      site_id: siteId,
      status: health.status,
      response_time_ms: health.responseTimeMs || null,
      memory_usage_mb: health.memoryUsageMb || null,
      cpu_usage_percent: health.cpuUsagePercent || null,
      last_error: health.lastError || null,
      error_count_last_hour: health.errorCountLastHour || 0,
      checked_at: new Date().toISOString(),
    },
    {
      onConflict: "module_id,site_id",
    }
  );

  if (error) {
    console.error("Failed to update module health:", error);
    throw error;
  }
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard(
  moduleId: string,
  siteId?: string,
  days = 30
): Promise<AnalyticsDashboardData> {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [timeSeries, activeUsers, health, topEvents] = await Promise.all([
    getModuleAnalytics({ moduleId, siteId, startDate, endDate }),
    getActiveUsers(moduleId, siteId),
    getModuleHealth(moduleId, siteId),
    getTopEvents(moduleId, startDate, endDate),
  ]);

  // Calculate totals
  const totals = timeSeries.reduce<AnalyticsTotals>(
    (acc, day) => ({
      views: acc.views + (day.views || 0),
      uniqueVisitors: acc.uniqueVisitors + (day.unique_visitors || 0),
      sessions: acc.sessions + (day.sessions || 0),
      errors: acc.errors + (day.error_count || 0),
      revenue: acc.revenue + (day.revenue_cents || 0),
    }),
    { views: 0, uniqueVisitors: 0, sessions: 0, errors: 0, revenue: 0 }
  );

  // Calculate averages
  const avgLoadTime =
    timeSeries.length > 0
      ? timeSeries.reduce((sum, d) => sum + (d.avg_load_time_ms || 0), 0) / timeSeries.length
      : 0;

  return {
    totals,
    averages: {
      loadTime: Math.round(avgLoadTime),
      sessionDuration: 0, // TODO: Calculate from time series
    },
    current: {
      activeUsers,
      health,
    },
    timeSeries,
    topEvents,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Hash a string using SHA-256 (truncated for privacy)
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 16);
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}

/**
 * Aggregate data by granularity
 */
function aggregateByGranularity(
  data: DailyAnalytics[],
  granularity: "hour" | "day" | "week" | "month"
): DailyAnalytics[] {
  if (granularity === "day" || granularity === "hour") return data;

  // Group by week/month as needed
  const grouped = new Map<string, DailyAnalytics>();

  for (const row of data) {
    const date = new Date(row.stat_date);
    let key: string;

    if (granularity === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, { ...row, stat_date: key });
    } else {
      const existing = grouped.get(key)!;
      existing.views += row.views || 0;
      existing.unique_visitors += row.unique_visitors || 0;
      existing.sessions += row.sessions || 0;
      existing.error_count += row.error_count || 0;
      existing.revenue_cents += row.revenue_cents || 0;
      // Average the averages (weighted would be better but this is simpler)
      existing.avg_load_time_ms = Math.round(
        (existing.avg_load_time_ms + (row.avg_load_time_ms || 0)) / 2
      );
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime()
  );
}

// ============================================================================
// CONVENIENCE TRACKING FUNCTIONS
// ============================================================================

/**
 * Track a module load event
 */
export function trackModuleLoaded(
  moduleId: string,
  loadTimeMs: number,
  siteId?: string
): Promise<void> {
  return trackEvent({
    moduleId,
    eventType: "lifecycle",
    eventName: "module_loaded",
    siteId,
    properties: { load_time_ms: loadTimeMs },
  });
}

/**
 * Track a module error
 */
export function trackModuleError(
  moduleId: string,
  error: Error | string,
  siteId?: string
): Promise<void> {
  return trackEvent({
    moduleId,
    eventType: "lifecycle",
    eventName: "module_error",
    siteId,
    properties: {
      error_message: typeof error === "string" ? error : error.message,
      error_stack: typeof error === "string" ? undefined : error.stack,
    },
  });
}

/**
 * Track a page view within a module
 */
export function trackPageView(moduleId: string, path: string, siteId?: string): Promise<void> {
  return trackEvent({
    moduleId,
    eventType: "user",
    eventName: "page_view",
    siteId,
    properties: { path },
  });
}

/**
 * Track a module install
 */
export function trackModuleInstall(moduleId: string, siteId: string): Promise<void> {
  return trackEvent({
    moduleId,
    eventType: "business",
    eventName: "install",
    siteId,
  });
}

/**
 * Track a module uninstall
 */
export function trackModuleUninstall(moduleId: string, siteId: string): Promise<void> {
  return trackEvent({
    moduleId,
    eventType: "business",
    eventName: "uninstall",
    siteId,
  });
}

/**
 * Generate a session ID for tracking
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

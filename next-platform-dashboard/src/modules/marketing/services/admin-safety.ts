/**
 * Marketing Module - Admin Safety Service
 *
 * Phase MKT-10: Super Admin Marketing View
 *
 * Platform-level safety controls for email sending reputation.
 * Auto-pause mechanisms, rate limit enforcement, health checks.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { MKT_TABLES } from "../lib/marketing-constants";
import type {
  PlatformEmailHealth,
  SiteSendingVolume,
  HealthStatus,
  AdminAlertThresholds,
  DEFAULT_ALERT_THRESHOLDS,
  HealthIncident,
  PlatformHealthReport,
  PlatformSendingLimits,
} from "../types/admin-types";

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Calculate platform-wide email health metrics from the last 7 days.
 */
export async function checkPlatformHealth(
  thresholds: AdminAlertThresholds = {
    bounceRateWarning: 2,
    bounceRateCritical: 5,
    complaintRateWarning: 0.1,
    complaintRateCritical: 0.3,
    autoPauseComplaintRate: 0.3,
    autoPauseBounceRate: 5,
  },
): Promise<PlatformHealthReport> {
  const supabase = createAdminClient() as any;

  // Get sending stats from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: stats } = await supabase
    .from(MKT_TABLES.sendingStats)
    .select("*")
    .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

  const allStats = stats || [];

  // Aggregate 7-day totals
  let totalSent = 0;
  let totalBounced = 0;
  let totalComplaints = 0;
  let totalDelivered = 0;

  for (const s of allStats) {
    totalSent += s.emails_sent || 0;
    totalBounced += s.emails_bounced || 0;
    totalComplaints += s.emails_complained || 0;
    totalDelivered += s.emails_delivered || 0;
  }

  const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
  const complaintRate = totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0;
  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const reputationScore = calculateReputationScore(
    deliveryRate,
    bounceRate,
    complaintRate,
  );

  // Determine status
  let status: HealthStatus = "healthy";
  if (
    complaintRate >= thresholds.autoPauseComplaintRate ||
    bounceRate >= thresholds.autoPauseBounceRate
  ) {
    status = "critical";
  } else if (
    complaintRate >= thresholds.complaintRateWarning ||
    bounceRate >= thresholds.bounceRateWarning
  ) {
    status = "warning";
  }

  const health: PlatformEmailHealth = {
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    bounceRate: Math.round(bounceRate * 100) / 100,
    complaintRate: Math.round(complaintRate * 1000) / 1000,
    reputationScore,
    totalEmailsSent7d: totalSent,
    totalBounced7d: totalBounced,
    totalComplaints7d: totalComplaints,
    status,
    lastCheckedAt: new Date().toISOString(),
  };

  // Get top sites by send volume (last 30 days)
  const topSites = await getTopSitesByVolume();

  // Get paused sites
  const pausedSites = await getPausedSiteIds();

  // Build report
  return {
    health,
    topSites,
    sendingLimits: {
      resendPlanTier: "Pro",
      monthlyLimit: 50000,
      monthlyUsed: totalSent,
      dailyRateLimit: 100,
    },
    thresholds,
    pausedSites,
    incidents: [],
  };
}

// ============================================================================
// PER-SITE VOLUME
// ============================================================================

/**
 * Get top sites by email send volume in the last 30 days.
 */
export async function getTopSitesByVolume(
  limit: number = 20,
): Promise<SiteSendingVolume[]> {
  const supabase = createAdminClient() as any;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get per-site stats
  const { data: stats } = await supabase
    .from(MKT_TABLES.sendingStats)
    .select("site_id, emails_sent, emails_bounced, emails_complained")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

  if (!stats || stats.length === 0) return [];

  // Aggregate by site
  const siteMap = new Map<
    string,
    { sent: number; bounced: number; complained: number }
  >();
  for (const s of stats) {
    const existing = siteMap.get(s.site_id) || {
      sent: 0,
      bounced: 0,
      complained: 0,
    };
    existing.sent += s.emails_sent || 0;
    existing.bounced += s.emails_bounced || 0;
    existing.complained += s.emails_complained || 0;
    siteMap.set(s.site_id, existing);
  }

  // Get site details
  const siteIds = Array.from(siteMap.keys());
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, agency_id")
    .in("id", siteIds);

  const { data: agencies } = await supabase
    .from("agencies")
    .select("id, name")
    .in(
      "id",
      (sites || []).map((s: any) => s.agency_id),
    );

  const agencyMap = new Map<string, string>(
    (agencies || []).map((a: any) => [a.id, a.name]),
  );
  const siteDetailsMap = new Map<string, { name: string; agencyId: string }>(
    (sites || []).map((s: any) => [
      s.id,
      { name: s.name, agencyId: s.agency_id },
    ]),
  );

  // Get paused site settings
  const { data: settingsData } = await supabase
    .from(MKT_TABLES.settings)
    .select("site_id, metadata")
    .in("site_id", siteIds);

  const pausedSet = new Set<string>();
  for (const setting of settingsData || []) {
    const meta = typeof setting.metadata === "object" ? setting.metadata : {};
    if ((meta as any)?.marketingPaused) {
      pausedSet.add(setting.site_id);
    }
  }

  // Build result
  const result: SiteSendingVolume[] = [];
  for (const [siteId, agg] of siteMap.entries()) {
    const details = siteDetailsMap.get(siteId);
    const bounceRate = agg.sent > 0 ? (agg.bounced / agg.sent) * 100 : 0;
    const complaintRate = agg.sent > 0 ? (agg.complained / agg.sent) * 100 : 0;

    let siteStatus: HealthStatus = "healthy";
    if (complaintRate >= 0.3 || bounceRate >= 5) siteStatus = "critical";
    else if (complaintRate >= 0.1 || bounceRate >= 2) siteStatus = "warning";

    result.push({
      siteId,
      siteName: details?.name || "Unknown Site",
      agencyName: agencyMap.get(details?.agencyId || "") || "Unknown Agency",
      emailsSent30d: agg.sent,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 1000) / 1000,
      status: siteStatus,
      isPaused: pausedSet.has(siteId),
    });
  }

  // Sort by volume descending
  result.sort((a, b) => b.emailsSent30d - a.emailsSent30d);
  return result.slice(0, limit);
}

// ============================================================================
// PAUSE / RESUME
// ============================================================================

/**
 * Pause marketing sends for a specific site.
 */
export async function pauseSiteMarketing(
  siteId: string,
  reason: string,
): Promise<{ success: boolean }> {
  const supabase = createAdminClient() as any;

  // Update settings metadata
  const { data: settings } = await supabase
    .from(MKT_TABLES.settings)
    .select("id, metadata")
    .eq("site_id", siteId)
    .single();

  if (!settings) {
    return { success: false };
  }

  const meta =
    typeof settings.metadata === "object" ? settings.metadata || {} : {};

  await supabase
    .from(MKT_TABLES.settings)
    .update({
      metadata: {
        ...meta,
        marketingPaused: true,
        pausedAt: new Date().toISOString(),
        pauseReason: reason,
      },
    })
    .eq("id", settings.id);

  return { success: true };
}

/**
 * Resume marketing sends for a specific site.
 */
export async function resumeSiteMarketing(
  siteId: string,
): Promise<{ success: boolean }> {
  const supabase = createAdminClient() as any;

  const { data: settings } = await supabase
    .from(MKT_TABLES.settings)
    .select("id, metadata")
    .eq("site_id", siteId)
    .single();

  if (!settings) {
    return { success: false };
  }

  const meta =
    typeof settings.metadata === "object" ? settings.metadata || {} : {};

  await supabase
    .from(MKT_TABLES.settings)
    .update({
      metadata: {
        ...meta,
        marketingPaused: false,
        resumedAt: new Date().toISOString(),
        pauseReason: null,
      },
    })
    .eq("id", settings.id);

  return { success: true };
}

/**
 * Get all paused site IDs.
 */
async function getPausedSiteIds(): Promise<string[]> {
  const supabase = createAdminClient() as any;

  const { data: allSettings } = await supabase
    .from(MKT_TABLES.settings)
    .select("site_id, metadata");

  const paused: string[] = [];
  for (const setting of allSettings || []) {
    const meta = typeof setting.metadata === "object" ? setting.metadata : {};
    if ((meta as any)?.marketingPaused) {
      paused.push(setting.site_id);
    }
  }
  return paused;
}

// ============================================================================
// AUTO-PAUSE LOGIC
// ============================================================================

/**
 * Check if auto-pause should be triggered and apply it.
 * Called by health check cron or admin dashboard.
 */
export async function enforceAutoSafety(
  thresholds: AdminAlertThresholds = {
    bounceRateWarning: 2,
    bounceRateCritical: 5,
    complaintRateWarning: 0.1,
    complaintRateCritical: 0.3,
    autoPauseComplaintRate: 0.3,
    autoPauseBounceRate: 5,
  },
): Promise<{ paused: string[]; reason: string }> {
  const supabase = createAdminClient() as any;
  const paused: string[] = [];

  // Check per-site rates (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: stats } = await supabase
    .from(MKT_TABLES.sendingStats)
    .select("site_id, emails_sent, emails_bounced, emails_complained")
    .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

  if (!stats || stats.length === 0)
    return { paused: [], reason: "No sending data" };

  // Aggregate per site
  const siteMap = new Map<
    string,
    { sent: number; bounced: number; complained: number }
  >();
  let totalSent = 0;
  let totalComplaints = 0;

  for (const s of stats) {
    const existing = siteMap.get(s.site_id) || {
      sent: 0,
      bounced: 0,
      complained: 0,
    };
    existing.sent += s.emails_sent || 0;
    existing.bounced += s.emails_bounced || 0;
    existing.complained += s.emails_complained || 0;
    siteMap.set(s.site_id, existing);
    totalSent += s.emails_sent || 0;
    totalComplaints += s.emails_complained || 0;
  }

  // Platform-wide complaint rate check
  const platformComplaintRate =
    totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0;
  if (platformComplaintRate >= thresholds.autoPauseComplaintRate) {
    // Auto-pause ALL sites
    for (const siteId of siteMap.keys()) {
      await pauseSiteMarketing(
        siteId,
        `Auto-paused: platform complaint rate ${platformComplaintRate.toFixed(3)}% exceeds ${thresholds.autoPauseComplaintRate}%`,
      );
      paused.push(siteId);
    }
    return {
      paused,
      reason: `Platform complaint rate ${platformComplaintRate.toFixed(3)}% exceeded threshold`,
    };
  }

  // Per-site bounce rate check
  for (const [siteId, agg] of siteMap.entries()) {
    const siteBounceRate = agg.sent > 0 ? (agg.bounced / agg.sent) * 100 : 0;
    if (siteBounceRate >= thresholds.autoPauseBounceRate) {
      await pauseSiteMarketing(
        siteId,
        `Auto-paused: bounce rate ${siteBounceRate.toFixed(2)}% exceeds ${thresholds.autoPauseBounceRate}%`,
      );
      paused.push(siteId);
    }
  }

  return {
    paused,
    reason:
      paused.length > 0
        ? `${paused.length} site(s) auto-paused for high bounce rates`
        : "All sites healthy",
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateReputationScore(
  deliveryRate: number,
  bounceRate: number,
  complaintRate: number,
): number {
  // Score 0-100 based on delivery metrics
  let score = 100;

  // Penalize bounce rate
  if (bounceRate > 1) score -= Math.min((bounceRate - 1) * 10, 30);
  // Penalize complaint rate heavily
  if (complaintRate > 0.05) score -= Math.min((complaintRate - 0.05) * 200, 40);
  // Reward high delivery rate
  if (deliveryRate < 95) score -= Math.min((95 - deliveryRate) * 2, 30);

  return Math.max(0, Math.min(100, Math.round(score)));
}

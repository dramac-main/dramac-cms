/**
 * Marketing Module - Admin Types
 *
 * Phase MKT-10: Super Admin Marketing View
 *
 * Types for platform-level marketing health monitoring and safety controls.
 */

// ============================================================================
// PLATFORM HEALTH
// ============================================================================

export type HealthStatus = "healthy" | "warning" | "critical" | "paused";

export interface PlatformEmailHealth {
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  reputationScore: number;
  totalEmailsSent7d: number;
  totalBounced7d: number;
  totalComplaints7d: number;
  status: HealthStatus;
  lastCheckedAt: string;
}

export interface SiteSendingVolume {
  siteId: string;
  siteName: string;
  agencyName: string;
  emailsSent30d: number;
  bounceRate: number;
  complaintRate: number;
  status: HealthStatus;
  isPaused: boolean;
}

export interface PlatformSendingLimits {
  resendPlanTier: string;
  monthlyLimit: number;
  monthlyUsed: number;
  dailyRateLimit: number;
}

export interface SiteSendingLimits {
  siteId: string;
  maxDailyEmails: number;
  maxMonthlyEmails: number;
  canSendMarketing: boolean;
  warmupMode: boolean;
}

// ============================================================================
// ADMIN ALERTS
// ============================================================================

export interface AdminAlertThresholds {
  bounceRateWarning: number;
  bounceRateCritical: number;
  complaintRateWarning: number;
  complaintRateCritical: number;
  autoPauseComplaintRate: number;
  autoPauseBounceRate: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AdminAlertThresholds = {
  bounceRateWarning: 2,
  bounceRateCritical: 5,
  complaintRateWarning: 0.1,
  complaintRateCritical: 0.3,
  autoPauseComplaintRate: 0.3,
  autoPauseBounceRate: 5,
};

// ============================================================================
// PLATFORM HEALTH RESPONSE
// ============================================================================

export interface PlatformHealthReport {
  health: PlatformEmailHealth;
  topSites: SiteSendingVolume[];
  sendingLimits: PlatformSendingLimits;
  thresholds: AdminAlertThresholds;
  pausedSites: string[];
  incidents: HealthIncident[];
}

export interface HealthIncident {
  id: string;
  type: "bounce_spike" | "complaint_spike" | "auto_pause" | "manual_pause";
  siteId?: string;
  siteName?: string;
  description: string;
  severity: "warning" | "critical";
  createdAt: string;
  resolvedAt?: string;
}

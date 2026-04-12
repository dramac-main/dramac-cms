/**
 * Marketing Module - Analytics Types
 *
 * Phase MKT-01: Database Foundation
 *
 * Types for settings, sending stats, and attribution.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type AttributionType = "first_touch" | "last_touch" | "linear";

// ============================================================================
// SETTINGS
// ============================================================================

export interface MarketingSettings {
  id: string;
  siteId: string;
  defaultFromName?: string | null;
  defaultFromEmail?: string | null;
  defaultReplyTo?: string | null;
  sendingQuotaDaily: number;
  sendingQuotaMonthly: number;
  doubleOptInEnabled: boolean;
  autoCleanBounces: boolean;
  autoCleanComplaints: boolean;
  unsubscribePageUrl?: string | null;
  physicalAddress?: string | null;
  companyName?: string | null;
  gdprEnabled: boolean;
  consentText?: string | null;
  timezone: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SENDING STATS
// ============================================================================

export interface SendingStats {
  id: string;
  siteId: string;
  date: string;
  emailsSent: number;
  emailsDelivered: number;
  emailsBounced: number;
  emailsComplained: number;
  smsSent: number;
  smsDelivered: number;
  smsFailed: number;
}

// ============================================================================
// ATTRIBUTION
// ============================================================================

export interface Attribution {
  id: string;
  siteId: string;
  campaignId?: string | null;
  sequenceId?: string | null;
  funnelId?: string | null;
  subscriberId?: string | null;
  attributionType: AttributionType;
  eventType: string;
  eventId?: string | null;
  revenue: number;
  attributedAt: string;
  touchpointWindowHours: number;
}

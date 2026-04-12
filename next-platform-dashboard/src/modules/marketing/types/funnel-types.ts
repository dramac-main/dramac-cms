/**
 * Marketing Module - Funnel Types
 *
 * Phase MKT-01: Database Foundation
 *
 * Types for funnels and funnel visits.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type FunnelStatus = "draft" | "active" | "paused" | "archived";

export type FunnelVisitStatus = "in_progress" | "completed" | "abandoned";

export type FunnelStepType =
  | "landing_page"
  | "opt_in"
  | "sales_page"
  | "checkout"
  | "upsell"
  | "downsell"
  | "thank_you"
  | "webinar"
  | "custom";

// ============================================================================
// FUNNELS
// ============================================================================

export interface FunnelStep {
  id: string;
  type: FunnelStepType;
  name: string;
  pageUrl?: string;
  config: Record<string, unknown>;
  position: number;
  nextStepId?: string;
  alternateStepId?: string;
}

export interface Funnel {
  id: string;
  siteId: string;
  name: string;
  description?: string | null;
  status: FunnelStatus;
  steps: FunnelStep[];
  conversionGoal?: Record<string, unknown> | null;
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  abTestEnabled: boolean;
  abTestConfig?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FUNNEL VISITS
// ============================================================================

export interface VisitedStep {
  stepId: string;
  visitedAt: string;
  duration?: number;
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface FunnelVisit {
  id: string;
  funnelId: string;
  visitorId: string;
  subscriberId?: string | null;
  currentStepId?: string | null;
  status: FunnelVisitStatus;
  stepsVisited: VisitedStep[];
  source?: string | null;
  utmParams?: UtmParams | null;
  enteredAt: string;
  convertedAt?: string | null;
  abandonedAt?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

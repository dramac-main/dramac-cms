/**
 * Paddle Billing Server Actions
 *
 * Phase EM-59: Paddle Billing Integration
 *
 * Server actions for billing management:
 * - Get subscription details
 * - Get billing overview
 * - Cancel/pause/resume subscription
 * - Change plans
 * - Get usage
 *
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionService } from "@/lib/paddle/subscription-service";
import { usageTracker } from "@/lib/paddle/usage-tracker";
import { isPaddleConfigured, type PlanType } from "@/lib/paddle/client";
import type {
  BillingOverview,
  PaddleProduct,
  UsageStats,
} from "@/types/paddle";

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserAgency(): Promise<{
  userId: string;
  agencyId: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.agency_id) return null;

  return { userId: user.id, agencyId: profile.agency_id };
}

async function verifyAgencyAccess(
  agencyId: string,
  requireAdmin: boolean = false,
): Promise<{ userId: string; role: string } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  if (requireAdmin && !["owner", "admin"].includes(membership.role)) {
    return null;
  }

  return { userId: user.id, role: membership.role };
}

// ============================================================================
// Subscription Actions
// ============================================================================

/**
 * Get subscription for current user's agency
 */
export async function getAgencySubscriptionPaddle() {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const userAgency = await getCurrentUserAgency();
  if (!userAgency) {
    return { success: false, error: "Not authenticated or no agency" };
  }

  try {
    const subscription = await subscriptionService.getSubscription(
      userAgency.agencyId,
    );
    return { success: true, data: subscription };
  } catch (error) {
    console.error("[Billing Action] getSubscription error:", error);
    return { success: false, error: "Failed to get subscription" };
  }
}

/**
 * Get complete billing overview
 */
export async function getBillingOverviewPaddle(agencyId?: string): Promise<{
  success: boolean;
  data?: BillingOverview;
  error?: string;
}> {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  // If no agencyId provided, get from current user
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: "Not authenticated or no agency" };
    }
    agencyId = userAgency.agencyId;
  } else {
    // Verify access
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: "Not authorized" };
    }
  }

  try {
    const overview = await subscriptionService.getBillingOverview(agencyId);
    return { success: true, data: overview };
  } catch (error) {
    console.error("[Billing Action] getBillingOverview error:", error);
    return { success: false, error: "Failed to get billing overview" };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscriptionPaddle(
  agencyId: string,
  immediately: boolean = false,
) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    await subscriptionService.cancelSubscription(agencyId, immediately);
    revalidatePath("/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("[Billing Action] cancelSubscription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel",
    };
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscriptionPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    await subscriptionService.pauseSubscription(agencyId);
    revalidatePath("/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("[Billing Action] pauseSubscription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pause",
    };
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscriptionPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    await subscriptionService.resumeSubscription(agencyId);
    revalidatePath("/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("[Billing Action] resumeSubscription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resume",
    };
  }
}

/**
 * Undo scheduled cancellation
 */
export async function undoCancelSubscriptionPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    await subscriptionService.undoCancelSubscription(agencyId);
    revalidatePath("/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("[Billing Action] undoCancelSubscription error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to undo cancellation",
    };
  }
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlanPaddle(
  agencyId: string,
  newPlanType: PlanType,
  newBillingCycle: "monthly" | "yearly",
  prorate: boolean = true,
) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    await subscriptionService.changePlan(
      agencyId,
      newPlanType,
      newBillingCycle,
      prorate,
    );
    revalidatePath("/settings/billing");
    return { success: true };
  } catch (error) {
    console.error("[Billing Action] changePlan error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change plan",
    };
  }
}

/**
 * Preview plan change with proration details
 * Phase BIL-06: Plan Upgrades & Downgrades
 */
export async function previewPlanChangePaddle(
  agencyId: string,
  newPlanType: PlanType,
  newBillingCycle: "monthly" | "yearly",
) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId);
  if (!access) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const preview = await subscriptionService.previewPlanChange(
      agencyId,
      newPlanType,
      newBillingCycle,
    );
    return { success: true, preview };
  } catch (error) {
    console.error("[Billing Action] previewPlanChange error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to preview plan change",
    };
  }
}

/**
 * Validate whether a downgrade is allowed
 * Phase BIL-06: Plan Upgrades & Downgrades
 */
export async function validateDowngradePaddle(
  agencyId: string,
  targetPlan: PlanType,
) {
  if (!isPaddleConfigured) {
    return {
      success: false,
      allowed: false,
      blockers: [],
      error: "Paddle billing not configured",
    };
  }

  const access = await verifyAgencyAccess(agencyId);
  if (!access) {
    return {
      success: false,
      allowed: false,
      blockers: [],
      error: "Not authorized",
    };
  }

  try {
    const result = await subscriptionService.validateDowngrade(
      agencyId,
      targetPlan,
    );
    return { success: true, ...result };
  } catch (error) {
    console.error("[Billing Action] validateDowngrade error:", error);
    return {
      success: false,
      allowed: false,
      blockers: [],
      error:
        error instanceof Error ? error.message : "Failed to validate downgrade",
    };
  }
}

// ============================================================================
// Usage Actions
// ============================================================================

/**
 * Get current usage for agency
 */
export async function getAgencyUsagePaddle(agencyId?: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  // If no agencyId provided, get from current user
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: "Not authenticated or no agency" };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: "Not authorized" };
    }
  }

  try {
    const usage = await usageTracker.getCurrentUsage(agencyId);
    return { success: true, data: usage };
  } catch (error) {
    console.error("[Billing Action] getUsage error:", error);
    return { success: false, error: "Failed to get usage" };
  }
}

/**
 * Get usage alerts
 */
export async function getUsageAlertsPaddle(agencyId?: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: "Not authenticated or no agency" };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: "Not authorized" };
    }
  }

  try {
    const alerts = await usageTracker.getUsageAlerts(agencyId);
    return { success: true, data: alerts };
  } catch (error) {
    console.error("[Billing Action] getUsageAlerts error:", error);
    return { success: false, error: "Failed to get usage alerts" };
  }
}

/**
 * Get usage history
 */
export async function getUsageHistoryPaddle(
  agencyId?: string,
  days: number = 30,
) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: "Not authenticated or no agency" };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: "Not authorized" };
    }
  }

  try {
    const history = await usageTracker.getUsageHistory(agencyId, days);
    return { success: true, data: history };
  } catch (error) {
    console.error("[Billing Action] getUsageHistory error:", error);
    return { success: false, error: "Failed to get usage history" };
  }
}

// ============================================================================
// Invoice Actions
// ============================================================================

/**
 * Get invoices for agency
 */
export async function getAgencyInvoicesPaddle(
  agencyId?: string,
  limit: number = 10,
) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: "Not authenticated or no agency" };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: "Not authorized" };
    }
  }

  try {
    const invoices = await subscriptionService.getInvoices(agencyId, limit);
    return { success: true, data: invoices };
  } catch (error) {
    console.error("[Billing Action] getInvoices error:", error);
    return { success: false, error: "Failed to get invoices" };
  }
}

// ============================================================================
// Product Actions
// ============================================================================

/**
 * Get available products/pricing
 */
export async function getProductsPaddle(): Promise<{
  success: boolean;
  data?: PaddleProduct[];
  error?: string;
}> {
  try {
    const products = await subscriptionService.getProducts();
    return { success: true, data: products };
  } catch (error) {
    console.error("[Billing Action] getProducts error:", error);
    return { success: false, error: "Failed to get products" };
  }
}

// ============================================================================
// Status Check Actions
// ============================================================================

/**
 * Check if agency has active subscription
 */
export async function hasActiveSubscriptionPaddle(
  agencyId?: string,
): Promise<boolean> {
  if (!isPaddleConfigured) return false;

  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) return false;
    agencyId = userAgency.agencyId;
  }

  try {
    return await subscriptionService.hasActiveSubscription(agencyId);
  } catch {
    return false;
  }
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatusPaddle(
  agencyId?: string,
): Promise<string> {
  if (!isPaddleConfigured) return "free";

  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) return "free";
    agencyId = userAgency.agencyId;
  }

  try {
    return await subscriptionService.getSubscriptionStatus(agencyId);
  } catch {
    return "free";
  }
}

/**
 * Check if Paddle is configured
 */
export async function isPaddleEnabledPaddle(): Promise<boolean> {
  return isPaddleConfigured;
}

// ============================================================================
// BIL-07: Payment Method & Cancellation Actions
// ============================================================================

/**
 * Get payment method update transaction for Paddle.js overlay
 * Phase BIL-07: Payment Methods & Cancellation
 */
export async function getPaymentUpdateTransactionPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const result =
      await subscriptionService.getPaymentUpdateTransaction(agencyId);
    return { success: true, data: result };
  } catch (error) {
    console.error("[Billing Action] getPaymentUpdateTransaction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get payment update transaction",
    };
  }
}

/**
 * Save cancellation feedback
 * Phase BIL-07: Payment Methods & Cancellation
 */
export async function saveCancellationFeedbackPaddle(
  agencyId: string,
  feedback: {
    reason: string;
    details?: string;
  },
) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const supabase = createClient();

    // Get current subscription info for context
    const { data: sub } = await (await supabase)
      .from("paddle_subscriptions")
      .select("plan_type, unit_price, created_at")
      .eq("agency_id", agencyId)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

    // Calculate months subscribed
    const monthsSubscribed = sub?.created_at
      ? Math.floor(
          (Date.now() - new Date(sub.created_at).getTime()) /
            (30 * 24 * 60 * 60 * 1000),
        )
      : 0;

    await (await supabase).from("cancellation_feedback").insert({
      agency_id: agencyId,
      plan_type: sub?.plan_type || "unknown",
      reason: feedback.reason,
      details: feedback.details || null,
      monthly_spend_cents: sub?.unit_price || 0,
      months_subscribed: monthsSubscribed,
    } as any);

    return { success: true };
  } catch (error) {
    console.error("[Billing Action] saveCancellationFeedback error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save cancellation feedback",
    };
  }
}

/**
 * Get subscription management details (URLs, status, etc.)
 * Phase BIL-07: Payment Methods & Cancellation
 */
export async function getSubscriptionDetailsPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId);
  if (!access) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const details = await subscriptionService.getSubscriptionDetails(agencyId);
    return { success: true, data: details };
  } catch (error) {
    console.error("[Billing Action] getSubscriptionDetails error:", error);
    return {
      success: false,
      error: "Failed to get subscription details",
    };
  }
}

/**
 * Save overage snapshot for current billing period
 * Phase BIL-08: Overage Billing Engine
 */
export async function saveOverageSnapshotPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: "Admin access required" };
  }

  try {
    const result = await usageTracker.saveOverageSnapshot(agencyId);
    return { success: true, data: result };
  } catch (error) {
    console.error("[Billing Action] saveOverageSnapshot error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save overage snapshot",
    };
  }
}

/**
 * Get overage charge history
 * Phase BIL-08: Overage Billing Engine
 */
export async function getOverageHistoryPaddle(
  agencyId: string,
  limit: number = 12,
) {
  if (!isPaddleConfigured) {
    return { success: false, error: "Paddle billing not configured" };
  }

  const access = await verifyAgencyAccess(agencyId);
  if (!access) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const history = await usageTracker.getOverageHistory(agencyId, limit);
    return { success: true, data: history };
  } catch (error) {
    console.error("[Billing Action] getOverageHistory error:", error);
    return {
      success: false,
      error: "Failed to get overage history",
    };
  }
}

// ============================================================================
// BIL-09: Super Admin Revenue Dashboard Actions
// ============================================================================

async function verifySuperAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") return null;
  return user.id;
}

// Types for BIL-09
export interface RevenueOverview {
  mrr: number;
  arr: number;
  totalAgencies: number;
  churnRate: number;
  mrrGrowth: number;
}

export interface MrrDataPoint {
  month: string;
  mrr: number;
  newMrr: number;
  churnedMrr: number;
}

export interface PlanDistribution {
  starter: number;
  growth: number;
  agency: number;
  free: number;
  trial: number;
}

export interface TrialFunnel {
  started: number;
  active: number;
  converted: number;
  expired: number;
  conversionRate: number;
}

export interface ChurnData {
  churnedCount: number;
  churnRate: number;
  avgLifetimeMonths: number;
}

export interface CancellationReasonData {
  reason: string;
  count: number;
  percentage: number;
}

export interface CostEstimate {
  revenue: number;
  paddleFees: number;
  variableCosts: number;
  fixedCosts: number;
  netRevenue: number;
  netMarginPercent: number;
}

/**
 * Get revenue overview metrics
 * Phase BIL-09: Super Admin Revenue Dashboard
 */
export async function getRevenueOverview(): Promise<{
  success: boolean;
  data?: RevenueOverview;
  error?: string;
}> {
  const adminId = await verifySuperAdmin();
  if (!adminId) return { success: false, error: "Super admin access required" };

  try {
    const admin = createAdminClient();

    // Get active subscriptions with prices
    const { data: subs } = await (admin as any)
      .from("paddle_subscriptions")
      .select("plan_type, unit_price, billing_cycle, status, created_at")
      .in("status", ["active", "trialing", "past_due"]);

    const activeSubs = subs || [];

    // Calculate MRR (normalize yearly to monthly)
    let mrr = 0;
    for (const sub of activeSubs) {
      if (sub.billing_cycle === "yearly") {
        mrr += Math.round((sub.unit_price || 0) / 12);
      } else {
        mrr += sub.unit_price || 0;
      }
    }

    // Get total agencies
    const { count: totalAgencies } = await (admin as any)
      .from("agencies")
      .select("id", { count: "exact", head: true });

    // Get churned in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: churnedCount } = await (admin as any)
      .from("paddle_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled")
      .gte("updated_at", thirtyDaysAgo.toISOString());

    // Get active count 30 days ago for churn rate
    const activeCount = activeSubs.length;
    const churnRate =
      activeCount + (churnedCount || 0) > 0
        ? ((churnedCount || 0) / (activeCount + (churnedCount || 0))) * 100
        : 0;

    // MoM growth: compare MRR to 30 days ago subscriptions
    const { data: prevSubs } = await (admin as any)
      .from("paddle_subscriptions")
      .select("unit_price, billing_cycle")
      .in("status", ["active", "trialing", "past_due"])
      .lte("created_at", thirtyDaysAgo.toISOString());

    let prevMrr = 0;
    for (const sub of prevSubs || []) {
      if (sub.billing_cycle === "yearly") {
        prevMrr += Math.round((sub.unit_price || 0) / 12);
      } else {
        prevMrr += sub.unit_price || 0;
      }
    }
    const mrrGrowth = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : 0;

    return {
      success: true,
      data: {
        mrr,
        arr: mrr * 12,
        totalAgencies: totalAgencies || 0,
        churnRate: Math.round(churnRate * 10) / 10,
        mrrGrowth: Math.round(mrrGrowth * 10) / 10,
      },
    };
  } catch (error) {
    console.error("[Billing Action] getRevenueOverview error:", error);
    return { success: false, error: "Failed to get revenue overview" };
  }
}

/**
 * Get MRR history data points for chart
 * Phase BIL-09: Super Admin Revenue Dashboard
 */
export async function getMrrHistory(
  months: number = 12,
): Promise<{ success: boolean; data?: MrrDataPoint[]; error?: string }> {
  const adminId = await verifySuperAdmin();
  if (!adminId) return { success: false, error: "Super admin access required" };

  try {
    const admin = createAdminClient();
    const dataPoints: MrrDataPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthLabel = monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      // Active subs at month end
      const { data: activeSubs } = await (admin as any)
        .from("paddle_subscriptions")
        .select("unit_price, billing_cycle")
        .in("status", ["active", "trialing", "past_due"])
        .lte("created_at", monthEnd.toISOString());

      let mrr = 0;
      for (const sub of activeSubs || []) {
        if (sub.billing_cycle === "yearly") {
          mrr += Math.round((sub.unit_price || 0) / 12);
        } else {
          mrr += sub.unit_price || 0;
        }
      }

      // New subs in month
      const { data: newSubs } = await (admin as any)
        .from("paddle_subscriptions")
        .select("unit_price, billing_cycle")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      let newMrr = 0;
      for (const sub of newSubs || []) {
        if (sub.billing_cycle === "yearly") {
          newMrr += Math.round((sub.unit_price || 0) / 12);
        } else {
          newMrr += sub.unit_price || 0;
        }
      }

      // Churned in month
      const { data: churnedSubs } = await (admin as any)
        .from("paddle_subscriptions")
        .select("unit_price, billing_cycle")
        .eq("status", "canceled")
        .gte("updated_at", monthStart.toISOString())
        .lte("updated_at", monthEnd.toISOString());

      let churnedMrr = 0;
      for (const sub of churnedSubs || []) {
        if (sub.billing_cycle === "yearly") {
          churnedMrr += Math.round((sub.unit_price || 0) / 12);
        } else {
          churnedMrr += sub.unit_price || 0;
        }
      }

      dataPoints.push({ month: monthLabel, mrr, newMrr, churnedMrr });
    }

    return { success: true, data: dataPoints };
  } catch (error) {
    console.error("[Billing Action] getMrrHistory error:", error);
    return { success: false, error: "Failed to get MRR history" };
  }
}

/**
 * Get plan distribution
 * Phase BIL-09: Super Admin Revenue Dashboard
 */
export async function getPlanDistribution(): Promise<{
  success: boolean;
  data?: PlanDistribution;
  error?: string;
}> {
  const adminId = await verifySuperAdmin();
  if (!adminId) return { success: false, error: "Super admin access required" };

  try {
    const admin = createAdminClient();

    const { data: subs } = await (admin as any)
      .from("paddle_subscriptions")
      .select("plan_type, status");

    const distribution: PlanDistribution = {
      starter: 0,
      growth: 0,
      agency: 0,
      free: 0,
      trial: 0,
    };

    // Count agencies with no subscription as free
    const { count: totalAgencies } = await (admin as any)
      .from("agencies")
      .select("id", { count: "exact", head: true });

    const subscribedAgencyCount = (subs || []).filter(
      (s: any) => s.status !== "canceled" && s.status !== "expired",
    ).length;
    distribution.free = Math.max(
      0,
      (totalAgencies || 0) - subscribedAgencyCount,
    );

    for (const sub of subs || []) {
      if (sub.status === "canceled" || sub.status === "expired") continue;
      if (sub.status === "trialing") {
        distribution.trial++;
        continue;
      }
      const plan = sub.plan_type as keyof typeof distribution;
      if (plan in distribution && plan !== "free" && plan !== "trial") {
        distribution[plan]++;
      }
    }

    return { success: true, data: distribution };
  } catch (error) {
    console.error("[Billing Action] getPlanDistribution error:", error);
    return { success: false, error: "Failed to get plan distribution" };
  }
}

/**
 * Get trial funnel metrics
 * Phase BIL-09: Super Admin Revenue Dashboard
 */
export async function getTrialFunnel(): Promise<{
  success: boolean;
  data?: TrialFunnel;
  error?: string;
}> {
  const adminId = await verifySuperAdmin();
  if (!adminId) return { success: false, error: "Super admin access required" };

  try {
    const admin = createAdminClient();

    const { data: trials } = await (admin as any)
      .from("trial_tracking")
      .select("status, converted_at, expired_at");

    const started = (trials || []).length;
    const active = (trials || []).filter(
      (t: any) => t.status === "active",
    ).length;
    const converted = (trials || []).filter(
      (t: any) => t.status === "converted" || t.converted_at,
    ).length;
    const expired = (trials || []).filter(
      (t: any) => t.status === "expired" || t.expired_at,
    ).length;
    const conversionRate =
      started > 0 ? Math.round((converted / started) * 100 * 10) / 10 : 0;

    return {
      success: true,
      data: { started, active, converted, expired, conversionRate },
    };
  } catch (error) {
    console.error("[Billing Action] getTrialFunnel error:", error);
    return { success: false, error: "Failed to get trial funnel" };
  }
}

/**
 * Get churn analysis
 * Phase BIL-09: Super Admin Revenue Dashboard
 */
export async function getChurnAnalysis(
  days: number = 30,
): Promise<{ success: boolean; data?: ChurnData; error?: string }> {
  const adminId = await verifySuperAdmin();
  if (!adminId) return { success: false, error: "Super admin access required" };

  try {
    const admin = createAdminClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Churned subscriptions
    const { data: churned } = await (admin as any)
      .from("paddle_subscriptions")
      .select("created_at, updated_at")
      .eq("status", "canceled")
      .gte("updated_at", cutoff.toISOString());

    const churnedCount = (churned || []).length;

    // Active + churned for rate
    const { count: activeCount } = await (admin as any)
      .from("paddle_subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "trialing", "past_due"]);

    const total = (activeCount || 0) + churnedCount;
    const churnRate = total > 0 ? (churnedCount / total) * 100 : 0;

    // Average lifetime
    let totalLifetime = 0;
    for (const sub of churned || []) {
      const created = new Date(sub.created_at);
      const canceled = new Date(sub.updated_at);
      totalLifetime +=
        (canceled.getTime() - created.getTime()) / (30 * 24 * 60 * 60 * 1000);
    }
    const avgLifetimeMonths =
      churnedCount > 0
        ? Math.round((totalLifetime / churnedCount) * 10) / 10
        : 0;

    return {
      success: true,
      data: {
        churnedCount,
        churnRate: Math.round(churnRate * 10) / 10,
        avgLifetimeMonths,
      },
    };
  } catch (error) {
    console.error("[Billing Action] getChurnAnalysis error:", error);
    return { success: false, error: "Failed to get churn analysis" };
  }
}

/**
 * Get cancellation reasons aggregated
 * Phase BIL-09: Super Admin Revenue Dashboard
 */
export async function getCancellationReasons(days: number = 30): Promise<{
  success: boolean;
  data?: CancellationReasonData[];
  error?: string;
}> {
  const adminId = await verifySuperAdmin();
  if (!adminId) return { success: false, error: "Super admin access required" };

  try {
    const admin = createAdminClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data: feedback } = await (admin as any)
      .from("cancellation_feedback")
      .select("reason")
      .gte("created_at", cutoff.toISOString());

    // Aggregate by reason
    const counts: Record<string, number> = {};
    let total = 0;
    for (const f of feedback || []) {
      counts[f.reason] = (counts[f.reason] || 0) + 1;
      total++;
    }

    const reasons: CancellationReasonData[] = Object.entries(counts)
      .map(([reason, count]) => ({
        reason: reason
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data: reasons };
  } catch (error) {
    console.error("[Billing Action] getCancellationReasons error:", error);
    return { success: false, error: "Failed to get cancellation reasons" };
  }
}

/**
 * Get platform cost vs revenue estimate
 * Phase BIL-09: Super Admin Revenue Dashboard
 *
 * Paddle fees: 5% + $0.50 per transaction
 * Variable costs estimated at ~5% of revenue
 * Fixed costs: ~$170/month (Vercel, Supabase, Resend, etc.)
 */
export async function getPlatformCostEstimate(): Promise<{
  success: boolean;
  data?: CostEstimate;
  error?: string;
}> {
  const adminId = await verifySuperAdmin();
  if (!adminId) return { success: false, error: "Super admin access required" };

  try {
    const admin = createAdminClient();

    // Current MRR from active subs
    const { data: subs } = await (admin as any)
      .from("paddle_subscriptions")
      .select("unit_price, billing_cycle")
      .in("status", ["active", "trialing", "past_due"]);

    let revenue = 0;
    const transactionCount = (subs || []).length;
    for (const sub of subs || []) {
      if (sub.billing_cycle === "yearly") {
        revenue += Math.round((sub.unit_price || 0) / 12);
      } else {
        revenue += sub.unit_price || 0;
      }
    }

    // Paddle fees: 5% of revenue + $0.50 per transaction (monthly)
    const paddleFees = Math.round(revenue * 0.05 + transactionCount * 50);
    // Variable costs: ~5% of revenue
    const variableCosts = Math.round(revenue * 0.05);
    // Fixed costs: ~$170/month = 17000 cents
    const fixedCosts = 17000;

    const netRevenue = revenue - paddleFees - variableCosts - fixedCosts;
    const netMarginPercent =
      revenue > 0 ? Math.round((netRevenue / revenue) * 100 * 10) / 10 : 0;

    return {
      success: true,
      data: {
        revenue,
        paddleFees,
        variableCosts,
        fixedCosts,
        netRevenue,
        netMarginPercent,
      },
    };
  } catch (error) {
    console.error("[Billing Action] getPlatformCostEstimate error:", error);
    return { success: false, error: "Failed to get cost estimate" };
  }
}

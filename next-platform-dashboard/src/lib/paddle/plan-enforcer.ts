/**
 * Plan Enforcer — Centralized Limit Checks
 *
 * Phase BIL-05: Usage Metering & Enforcement
 *
 * Provides centralized limit enforcement for:
 * - Site creation limits per plan
 * - Team member limits per plan
 * - White-label access per plan
 * - Full plan limits summary
 *
 * Call these functions before creating sites, inviting team members,
 * or rendering white-label features.
 *
 * @see phases/PHASE-BIL-MASTER-GUIDE.md
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanLimits, isWhiteLabelEnabled, type PlanType } from "./client";

// ============================================================================
// Types
// ============================================================================

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number;
}

export interface PlanLimitsInfo {
  planType: PlanType | null;
  sites: LimitCheckResult;
  teamMembers: LimitCheckResult;
  whiteLabel: boolean;
}

// ============================================================================
// Plan Enforcer Functions
// ============================================================================

/**
 * Get the current plan type for an agency.
 * Returns null if no active subscription.
 */
async function getAgencyPlanType(agencyId: string): Promise<PlanType | null> {
  const supabase = createAdminClient();

  // Check agency's subscription plan type
  const { data: agency } = await supabase
    .from("agencies")
    .select("subscription_plan_type")
    .eq("id", agencyId)
    .single();

  const planType = (agency as any)?.subscription_plan_type as PlanType | null;

  if (planType) return planType;

  // Fallback: check paddle_subscriptions table
  const { data: sub } = await supabase
    .from("paddle_subscriptions")
    .select("plan_type")
    .eq("agency_id", agencyId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  return ((sub as any)?.plan_type as PlanType) || null;
}

/**
 * Enforce site creation limit for an agency.
 * Call before allowing site creation.
 */
export async function enforceSiteLimit(
  agencyId: string,
): Promise<LimitCheckResult> {
  const supabase = createAdminClient();

  const planType = await getAgencyPlanType(agencyId);

  if (!planType) {
    // No plan — allow 1 site (free tier fallback)
    const { count } = await supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId);

    return {
      allowed: (count ?? 0) < 1,
      current: count ?? 0,
      max: 1,
    };
  }

  const limits = getPlanLimits(planType);

  // Count current active sites
  const { count } = await supabase
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  const current = count ?? 0;

  return {
    allowed: current < limits.sites,
    current,
    max: limits.sites,
  };
}

/**
 * Enforce team member limit for an agency.
 * Call before allowing team member invites.
 */
export async function enforceTeamMemberLimit(
  agencyId: string,
): Promise<LimitCheckResult> {
  const supabase = createAdminClient();

  const planType = await getAgencyPlanType(agencyId);

  if (!planType) {
    // No plan — allow 1 team member
    const { count } = await supabase
      .from("agency_members")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId);

    return {
      allowed: (count ?? 0) < 1,
      current: count ?? 0,
      max: 1,
    };
  }

  const limits = getPlanLimits(planType);

  // Count current team members
  const { count } = await supabase
    .from("agency_members")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  const current = count ?? 0;

  return {
    allowed: current < limits.teamMembers,
    current,
    max: limits.teamMembers,
  };
}

/**
 * Check if white-label is enabled for an agency.
 * Only Agency plan ($149/mo) has white-label.
 */
export async function enforceWhiteLabel(agencyId: string): Promise<boolean> {
  const planType = await getAgencyPlanType(agencyId);

  if (!planType) return false;

  return isWhiteLabelEnabled(planType);
}

/**
 * Get all plan limits for an agency in one call.
 * Useful for the billing dashboard and settings page.
 */
export async function getAgencyLimits(
  agencyId: string,
): Promise<PlanLimitsInfo> {
  const planType = await getAgencyPlanType(agencyId);

  const [sites, teamMembers] = await Promise.all([
    enforceSiteLimit(agencyId),
    enforceTeamMemberLimit(agencyId),
  ]);

  return {
    planType,
    sites,
    teamMembers,
    whiteLabel: planType ? isWhiteLabelEnabled(planType) : false,
  };
}

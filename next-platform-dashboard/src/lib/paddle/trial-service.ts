/**
 * Trial Service
 *
 * Phase BIL-03: Subscription Checkout & Trial Management
 *
 * Manages 14-day free trial for the Growth plan:
 * - Start trial (Growth plan only, one per agency)
 * - Check trial eligibility
 * - Get trial status
 * - Expire/convert/extend trials
 *
 * @see phases/billing/PHASE-BIL-MASTER-GUIDE.md
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getTrialEligiblePlans, type PlanType } from "./client";

// ============================================================================
// Constants
// ============================================================================

const TRIAL_DURATION_DAYS = 14;

// ============================================================================
// Types
// ============================================================================

export type TrialStatus = "active" | "expired" | "converted" | "canceled";

export interface TrialRecord {
  id: string;
  agencyId: string;
  planType: PlanType;
  startedAt: string;
  expiresAt: string;
  status: TrialStatus;
  conversionSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrialStatusInfo {
  isOnTrial: boolean;
  trialRecord: TrialRecord | null;
  daysRemaining: number;
  isExpiringSoon: boolean; // 3 days or less
  isLastDay: boolean; // 1 day or less
}

// ============================================================================
// Trial Service
// ============================================================================

export class TrialService {
  // Cast to any to avoid deep type instantiation errors from large generated Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any = createAdminClient();

  /**
   * Check if an agency is eligible for a trial
   * - Must not have an existing active/converted trial
   * - Must not have an active subscription
   */
  async isTrialEligible(agencyId: string): Promise<boolean> {
    // Check for existing trial (any status except canceled)
    const { data: existingTrial } = await this.supabase
      .from("trial_tracking")
      .select("id, status")
      .eq("agency_id", agencyId)
      .in("status", ["active", "converted"])
      .maybeSingle();

    if (existingTrial) {
      return false;
    }

    // Check for active subscription
    const { data: activeSub } = await this.supabase
      .from("paddle_subscriptions")
      .select("id")
      .eq("agency_id", agencyId)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

    if (activeSub) {
      return false;
    }

    return true;
  }

  /**
   * Start a trial for an agency
   * Only Growth plan is eligible for trials
   */
  async startTrial(
    agencyId: string,
    planType: PlanType = "growth",
  ): Promise<TrialRecord> {
    // Validate plan type
    const eligiblePlans = getTrialEligiblePlans();
    if (!eligiblePlans.includes(planType)) {
      throw new Error(
        `Plan "${planType}" is not eligible for a free trial. Only ${eligiblePlans.join(", ")} plans offer trials.`,
      );
    }

    // Check eligibility
    const eligible = await this.isTrialEligible(agencyId);
    if (!eligible) {
      throw new Error(
        "This agency is not eligible for a trial. A trial or subscription already exists.",
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DURATION_DAYS);

    const { data, error } = await this.supabase
      .from("trial_tracking")
      .insert({
        agency_id: agencyId,
        plan_type: planType,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
      } as any)
      .select()
      .single();

    if (error) {
      console.error("[Trial] Error starting trial:", error);
      throw new Error("Failed to start trial");
    }

    // Update agency subscription status to reflect trial
    await this.supabase
      .from("agencies")
      .update({
        subscription_status: "trialing",
        subscription_plan: planType,
        updated_at: now.toISOString(),
      } as any)
      .eq("id", agencyId);

    return this.mapRecord(data);
  }

  /**
   * Get trial status for an agency
   */
  async getTrialStatus(agencyId: string): Promise<TrialStatusInfo> {
    const { data } = await this.supabase
      .from("trial_tracking")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data || (data as any).status !== "active") {
      return {
        isOnTrial: false,
        trialRecord: data ? this.mapRecord(data) : null,
        daysRemaining: 0,
        isExpiringSoon: false,
        isLastDay: false,
      };
    }

    const now = new Date();
    const expiresAt = new Date((data as any).expires_at);
    const msRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil(msRemaining / (1000 * 60 * 60 * 24)),
    );

    return {
      isOnTrial: daysRemaining > 0,
      trialRecord: this.mapRecord(data),
      daysRemaining,
      isExpiringSoon: daysRemaining <= 3,
      isLastDay: daysRemaining <= 1,
    };
  }

  /**
   * Expire a trial (called by cron or webhook)
   */
  async expireTrial(agencyId: string): Promise<void> {
    const { error } = await this.supabase
      .from("trial_tracking")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      } as any)
      .eq("agency_id", agencyId)
      .eq("status", "active");

    if (error) {
      console.error("[Trial] Error expiring trial:", error);
      throw new Error("Failed to expire trial");
    }

    // Update agency status
    await this.supabase
      .from("agencies")
      .update({
        subscription_status: "expired",
        subscription_plan: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", agencyId);
  }

  /**
   * Convert a trial to a paid subscription
   * Called when a Paddle subscription is created during/after trial
   */
  async convertTrial(agencyId: string, subscriptionId: string): Promise<void> {
    const { error } = await this.supabase
      .from("trial_tracking")
      .update({
        status: "converted",
        conversion_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("agency_id", agencyId)
      .eq("status", "active");

    if (error) {
      console.error("[Trial] Error converting trial:", error);
      throw new Error("Failed to convert trial");
    }
  }

  /**
   * Extend a trial (admin operation)
   */
  async extendTrial(
    agencyId: string,
    additionalDays: number,
  ): Promise<TrialRecord> {
    // Get current trial
    const { data: current } = await this.supabase
      .from("trial_tracking")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("status", "active")
      .maybeSingle();

    if (!current) {
      throw new Error("No active trial found for this agency");
    }

    const currentExpiry = new Date((current as any).expires_at);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);

    const { data, error } = await this.supabase
      .from("trial_tracking")
      .update({
        expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", (current as any).id)
      .select()
      .single();

    if (error) {
      console.error("[Trial] Error extending trial:", error);
      throw new Error("Failed to extend trial");
    }

    return this.mapRecord(data);
  }

  /**
   * Expire all trials that have passed their expiry date
   * Called by a cron job or scheduled function
   */
  async expireOverdueTrials(): Promise<number> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("trial_tracking")
      .update({
        status: "expired",
        updated_at: now,
      } as any)
      .eq("status", "active")
      .lt("expires_at", now)
      .select("agency_id");

    if (error) {
      console.error("[Trial] Error expiring overdue trials:", error);
      return 0;
    }

    // Update all affected agencies
    if (data && data.length > 0) {
      const agencyIds = data.map((d: any) => d.agency_id);
      await this.supabase
        .from("agencies")
        .update({
          subscription_status: "expired",
          subscription_plan: null,
          updated_at: now,
        } as any)
        .in("id", agencyIds);
    }

    return data?.length ?? 0;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private mapRecord(data: any): TrialRecord {
    return {
      id: data.id,
      agencyId: data.agency_id,
      planType: data.plan_type,
      startedAt: data.started_at,
      expiresAt: data.expires_at,
      status: data.status,
      conversionSubscriptionId: data.conversion_subscription_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const trialService = new TrialService();

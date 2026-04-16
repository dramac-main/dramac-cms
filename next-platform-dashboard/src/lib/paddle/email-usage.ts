/**
 * Email Usage Tracking
 *
 * Phase BIL-05: Usage Metering & Enforcement
 *
 * Tracks email sends per agency for billing purposes.
 * Uses the same hourly bucket pattern as usage-tracker.ts.
 *
 * Soft limit model — emails are always allowed, but overage is tracked.
 *
 * @see phases/PHASE-BIL-MASTER-GUIDE.md
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { subscriptionService } from "./subscription-service";

// ============================================================================
// Email Usage Functions
// ============================================================================

/**
 * Track an email send for billing purposes.
 * Increments the email_sends count in usage_hourly bucket.
 *
 * @param agencyId - The agency that owns the email send
 * @param count - Number of emails sent (default 1)
 */
export async function trackEmailSend(
  agencyId: string,
  count: number = 1,
): Promise<void> {
  if (!agencyId || count <= 0) return;

  const supabase = createAdminClient();

  // Increment in usage_hourly table (same pattern as usage-tracker.ts)
  const now = new Date();
  const hourTimestamp = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
  ).toISOString();

  // Upsert into usage_hourly — increment email sends
  // We use api_calls column as the email_sends proxy until DB function is updated
  const { error } = await (supabase as any).rpc("increment_usage", {
    p_agency_id: agencyId,
    p_site_id: "platform", // platform-level tracking (not site-specific)
    p_automation_runs: 0,
    p_ai_actions: 0,
    p_api_calls: count, // Using api_calls as email_sends proxy
  });

  if (error) {
    console.error("[EmailUsage] Error tracking email send:", error);
    // Don't throw — email tracking shouldn't block the email from sending
  }

  // Also increment the period counter on the agencies table for quick lookups
  const { error: agencyError } = await (supabase as any).rpc(
    "increment_agency_email_sends",
    {
      p_agency_id: agencyId,
      p_count: count,
    },
  );

  // If the RPC doesn't exist yet, fall back to direct update
  if (agencyError) {
    await supabase
      .from("agencies")
      .update({
        email_sends_current_period: (supabase as any).rpc(
          "get_agency_email_sends",
          { p_agency_id: agencyId },
        ),
      } as any)
      .eq("id", agencyId);
  }
}

/**
 * Get current email usage for an agency in the current billing period.
 */
export async function getEmailUsage(
  agencyId: string,
): Promise<{ used: number; included: number; overage: number }> {
  const supabase = createAdminClient();

  // Get subscription to know period bounds and included limits
  const subscription = await subscriptionService.getSubscription(agencyId);

  if (!subscription) {
    return { used: 0, included: 0, overage: 0 };
  }

  const included = subscription.includedUsage.emailSends;

  // Query usage_hourly for email sends in current period
  // api_calls column is used as email_sends proxy
  const { data, error } = await supabase
    .from("usage_hourly")
    .select("api_calls")
    .eq("agency_id", agencyId)
    .gte("hour_timestamp", subscription.currentPeriodStart.toISOString())
    .lt("hour_timestamp", subscription.currentPeriodEnd.toISOString());

  if (error) {
    console.error("[EmailUsage] Error fetching email usage:", error);
    return { used: 0, included, overage: 0 };
  }

  const used = (data || []).reduce(
    (sum: number, row: any) => sum + (row.api_calls || 0),
    0,
  );
  const overage = Math.max(0, used - included);

  return { used, included, overage };
}

/**
 * Check if an agency can send more emails.
 * Soft limit — always returns allowed=true, but tracks overage.
 */
export async function checkEmailLimit(
  agencyId: string,
  requestedCount: number = 1,
): Promise<{ allowed: boolean; remaining: number }> {
  const { used, included } = await getEmailUsage(agencyId);
  const remaining = Math.max(0, included - used);

  // Soft limit model — always allow, overage is billed
  return {
    allowed: true,
    remaining,
  };
}

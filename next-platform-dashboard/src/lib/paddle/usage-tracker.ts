/**
 * Paddle Usage Tracker
 *
 * Phase EM-59: Paddle Billing Integration
 *
 * Tracks usage for:
 * - Automation runs
 * - AI actions
 * - API calls
 *
 * Handles:
 * - Real-time usage recording (hourly buckets)
 * - Usage aggregation (daily)
 * - Overage calculation
 * - Usage reporting to Paddle for metered billing
 *
 * NOTE: The usage tables (usage_hourly, usage_daily, usage_billing_period, paddle_subscriptions)
 * must be created by running the migration: migrations/em-59-paddle-billing.sql
 *
 * After running the migration, regenerate Supabase types with:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
 *
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 */

import { paddle, PADDLE_IDS, OVERAGE_RATES } from "./client";
import { subscriptionService } from "./subscription-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailUsage } from "./email-usage";
import { getStorageUsage } from "./storage-tracker";
import type { UsageStats } from "@/types/paddle";

// ============================================================================
// Types
// ============================================================================

export type UsageType =
  | "automation_runs"
  | "ai_actions"
  | "email_sends"
  | "file_storage";

export interface UsageReport {
  automationRuns: number;
  aiActions: number;
  emailSends: number;
  fileStorageMb: number;
  includedAutomationRuns: number;
  includedAiActions: number;
  includedEmailSends: number;
  includedFileStorageMb: number;
  overageAutomationRuns: number;
  overageAiActions: number;
  overageEmailSends: number;
  overageFileStorageMb: number;
  overageCostCents: number;
  periodStart: Date;
  periodEnd: Date;
  percentUsed: {
    automationRuns: number;
    aiActions: number;
    emailSends: number;
    fileStorageMb: number;
  };
}

export interface UsageLimitCheck {
  allowed: boolean;
  remaining: number;
  isOverage: boolean;
  currentUsage: number;
  included: number;
}

// ============================================================================
// Usage Tracker
// ============================================================================

export class UsageTracker {
  private supabase = createAdminClient();

  /**
   * Record usage (called after each action)
   * Uses database function for atomic increment
   */
  async recordUsage(
    agencyId: string,
    siteId: string,
    type: UsageType,
    count: number = 1,
  ): Promise<void> {
    const params: Record<string, unknown> = {
      p_agency_id: agencyId,
      p_site_id: siteId,
      p_automation_runs: 0,
      p_ai_actions: 0,
      p_api_calls: 0,
    };

    // Set the appropriate count
    switch (type) {
      case "automation_runs":
        params.p_automation_runs = count;
        break;
      case "ai_actions":
        params.p_ai_actions = count;
        break;
      case "email_sends":
        // Email sends are tracked via email-usage.ts trackEmailSend() which calls
        // increment_agency_email_sends RPC + usage_hourly via api_calls column.
        // This path is kept as a secondary entry point.
        params.p_api_calls = count;
        break;
      case "file_storage":
        // File storage is tracked via storage-tracker.ts trackFileUpload/trackFileDelete
        // which uses increment_file_storage/decrement_file_storage RPCs on agencies table.
        // No-op here as file storage is not tracked in usage_hourly buckets.
        return;
    }

    // Use any cast for RPC call to functions not in types yet
    const { error } = await (this.supabase as any).rpc(
      "increment_usage",
      params,
    );

    if (error) {
      console.error("[UsageTracker] Error recording usage:", error);
      // Don't throw - usage tracking shouldn't break the main operation
    }
  }

  /**
   * Record multiple usage types at once
   */
  async recordMultipleUsage(
    agencyId: string,
    siteId: string,
    usage: {
      automationRuns?: number;
      aiActions?: number;
      apiCalls?: number;
    },
  ): Promise<void> {
    // Use any cast for RPC call to functions not in types yet
    const { error } = await (this.supabase as any).rpc("increment_usage", {
      p_agency_id: agencyId,
      p_site_id: siteId,
      p_automation_runs: usage.automationRuns || 0,
      p_ai_actions: usage.aiActions || 0,
      p_api_calls: usage.apiCalls || 0,
    });

    if (error) {
      console.error("[UsageTracker] Error recording multiple usage:", error);
    }
  }

  /**
   * Get current period usage for an agency
   */
  async getCurrentUsage(agencyId: string): Promise<UsageReport | null> {
    // Get subscription using the service (includes Paddle API fallback)
    const subscription = await subscriptionService.getSubscription(agencyId);

    if (!subscription) {
      console.error("[UsageTracker] No active subscription found");
      return null;
    }

    // Get usage for current period (use any cast for RPC)
    const { data: usage, error: usageError } = await (this.supabase as any).rpc(
      "get_current_period_usage",
      { p_agency_id: agencyId },
    );

    const currentUsage = (usage?.[0] as any) || {
      automation_runs: 0,
      ai_actions: 0,
      api_calls: 0,
    };

    // Use subscription data for included limits
    const includedAutomation = subscription.includedUsage.automationRuns;
    const includedAi = subscription.includedUsage.aiActions;
    const includedEmail = subscription.includedUsage.emailSends;
    const includedStorage = subscription.includedUsage.fileStorageMb;

    // Calculate overages
    const overageAutomation = Math.max(
      0,
      currentUsage.automation_runs - includedAutomation,
    );
    const overageAi = Math.max(0, currentUsage.ai_actions - includedAi);
    // BIL-05: Use real email and storage tracking
    const emailUsage = await getEmailUsage(agencyId);
    const currentEmailSends = emailUsage.used;
    const storageUsage = await getStorageUsage(agencyId);
    const currentFileStorageMb = Math.round(
      storageUsage.usedBytes / (1024 * 1024),
    );
    const overageEmail = Math.max(0, currentEmailSends - includedEmail);
    const overageStorage = Math.max(0, currentFileStorageMb - includedStorage);

    // Get overage rates based on plan
    const rates =
      OVERAGE_RATES[subscription.planType as keyof typeof OVERAGE_RATES] ||
      OVERAGE_RATES.starter;

    // Calculate overage cost in cents
    const overageCost = Math.round(
      (overageAutomation * rates.automationRuns +
        overageAi * rates.aiActions +
        overageEmail * rates.emailSends +
        overageStorage * rates.fileStorageMb) *
        100,
    );

    return {
      automationRuns: currentUsage.automation_runs,
      aiActions: currentUsage.ai_actions,
      emailSends: currentEmailSends,
      fileStorageMb: currentFileStorageMb,
      includedAutomationRuns: includedAutomation,
      includedAiActions: includedAi,
      includedEmailSends: includedEmail,
      includedFileStorageMb: includedStorage,
      overageAutomationRuns: overageAutomation,
      overageAiActions: overageAi,
      overageEmailSends: overageEmail,
      overageFileStorageMb: overageStorage,
      overageCostCents: overageCost,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      percentUsed: {
        automationRuns:
          includedAutomation > 0
            ? (currentUsage.automation_runs / includedAutomation) * 100
            : 0,
        aiActions:
          includedAi > 0 ? (currentUsage.ai_actions / includedAi) * 100 : 0,
        emailSends:
          includedEmail > 0 ? (currentEmailSends / includedEmail) * 100 : 0,
        fileStorageMb:
          includedStorage > 0
            ? (currentFileStorageMb / includedStorage) * 100
            : 0,
      },
    };
  }

  /**
   * Check if usage limit is reached (for enforcement)
   */
  async checkUsageLimit(
    agencyId: string,
    type: UsageType,
    requestedCount: number = 1,
  ): Promise<UsageLimitCheck> {
    const usage = await this.getCurrentUsage(agencyId);

    if (!usage) {
      // No subscription - could allow limited free usage or block
      return {
        allowed: false,
        remaining: 0,
        isOverage: false,
        currentUsage: 0,
        included: 0,
      };
    }

    let current: number;
    let included: number;

    switch (type) {
      case "automation_runs":
        current = usage.automationRuns;
        included = usage.includedAutomationRuns;
        break;
      case "ai_actions":
        current = usage.aiActions;
        included = usage.includedAiActions;
        break;
      case "email_sends":
        current = usage.emailSends;
        included = usage.includedEmailSends;
        break;
      case "file_storage":
        current = usage.fileStorageMb;
        included = usage.includedFileStorageMb;
        break;
    }

    const remaining = Math.max(0, included - current);
    const isOverage = current >= included;

    // Currently allow overage (will be billed)
    // Change to false to enforce hard limits
    const allowed = true;

    return {
      allowed,
      remaining,
      isOverage,
      currentUsage: current,
      included,
    };
  }

  /**
   * Get usage history (daily aggregates)
   */
  async getUsageHistory(
    agencyId: string,
    days: number = 30,
  ): Promise<
    Array<{
      date: string;
      automationRuns: number;
      aiActions: number;
      apiCalls: number;
    }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from("usage_daily")
      .select("date, automation_runs, ai_actions, api_calls")
      .eq("agency_id", agencyId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) {
      console.error("[UsageTracker] Error fetching usage history:", error);
      return [];
    }

    return (data || []).map((d: any) => ({
      date: d.date,
      automationRuns: d.automation_runs,
      aiActions: d.ai_actions,
      apiCalls: d.api_calls,
    }));
  }

  /**
   * Get usage breakdown by site
   */
  async getUsageBySite(agencyId: string): Promise<
    Record<
      string,
      {
        siteId: string;
        siteName?: string;
        automationRuns: number;
        aiActions: number;
        apiCalls: number;
      }
    >
  > {
    // Get subscription period
    const { data: sub } = await this.supabase
      .from("paddle_subscriptions")
      .select("current_period_start, current_period_end")
      .eq("agency_id", agencyId)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

    if (!sub) {
      return {};
    }

    // Get hourly usage grouped by site
    const { data, error } = await this.supabase
      .from("usage_hourly")
      .select(
        `
        site_id,
        automation_runs,
        ai_actions,
        api_calls
      `,
      )
      .eq("agency_id", agencyId)
      .gte("hour_timestamp", sub.current_period_start)
      .lt("hour_timestamp", sub.current_period_end);

    if (error || !data) {
      console.error("[UsageTracker] Error fetching usage by site:", error);
      return {};
    }

    // Aggregate by site
    const bySite: Record<
      string,
      {
        siteId: string;
        automationRuns: number;
        aiActions: number;
        apiCalls: number;
      }
    > = {};

    for (const row of data) {
      if (!bySite[row.site_id]) {
        bySite[row.site_id] = {
          siteId: row.site_id,
          automationRuns: 0,
          aiActions: 0,
          apiCalls: 0,
        };
      }
      bySite[row.site_id].automationRuns += row.automation_runs ?? 0;
      bySite[row.site_id].aiActions += row.ai_actions ?? 0;
      bySite[row.site_id].apiCalls += row.api_calls ?? 0;
    }

    return bySite;
  }

  /**
   * Report usage to Paddle (for metered billing)
   * Called at end of billing period or on demand
   */
  async reportUsageToPaddle(agencyId: string): Promise<boolean> {
    // Get subscription
    const { data: sub } = await this.supabase
      .from("paddle_subscriptions")
      .select("*")
      .eq("agency_id", agencyId)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

    if (!sub) {
      console.log("[UsageTracker] No subscription to report usage for");
      return false;
    }

    // Get usage report
    const usage = await this.getCurrentUsage(agencyId);

    if (!usage) {
      console.log("[UsageTracker] No usage to report");
      return false;
    }

    // Only report if there's overage
    if (
      usage.overageAutomationRuns <= 0 &&
      usage.overageAiActions <= 0 &&
      usage.overageEmailSends <= 0 &&
      usage.overageFileStorageMb <= 0
    ) {
      console.log("[UsageTracker] No overage to report");
      return false;
    }

    if (!paddle) {
      console.error("[UsageTracker] Paddle not configured");
      return false;
    }

    // Build line items for overage charges
    const items: Array<{ priceId: string; quantity: number }> = [];

    if (
      usage.overageAutomationRuns > 0 &&
      PADDLE_IDS.prices.automation_overage
    ) {
      items.push({
        priceId: PADDLE_IDS.prices.automation_overage,
        quantity: usage.overageAutomationRuns,
      });
    }

    if (usage.overageAiActions > 0 && PADDLE_IDS.prices.ai_overage) {
      items.push({
        priceId: PADDLE_IDS.prices.ai_overage,
        quantity: usage.overageAiActions,
      });
    }

    if (usage.overageEmailSends > 0 && PADDLE_IDS.prices.email_overage) {
      items.push({
        priceId: PADDLE_IDS.prices.email_overage,
        quantity: usage.overageEmailSends,
      });
    }

    if (usage.overageFileStorageMb > 0 && PADDLE_IDS.prices.storage_overage) {
      items.push({
        priceId: PADDLE_IDS.prices.storage_overage,
        quantity: usage.overageFileStorageMb,
      });
    }

    if (items.length > 0) {
      // Get customer
      const { data: customer } = await this.supabase
        .from("paddle_customers")
        .select("paddle_customer_id")
        .eq("agency_id", agencyId)
        .maybeSingle();

      if (customer) {
        try {
          // Create transaction for overage
          await paddle.transactions.create({
            customerId: customer.paddle_customer_id,
            items,
            collectionMode: "automatic",
          });

          console.log("[UsageTracker] Overage transaction created");
        } catch (error) {
          console.error(
            "[UsageTracker] Error creating overage transaction:",
            error,
          );
          return false;
        }
      }
    }

    // Record that we reported this period
    await this.supabase.from("usage_billing_period").upsert(
      {
        agency_id: agencyId,
        subscription_id: sub.id,
        period_start: sub.current_period_start ?? new Date().toISOString(),
        period_end: sub.current_period_end ?? new Date().toISOString(),
        automation_runs: usage.automationRuns,
        ai_actions: usage.aiActions,
        api_calls: 0, // Deprecated — kept for DB compat
        email_sends: usage.emailSends,
        file_storage_mb: usage.fileStorageMb,
        included_automation_runs: usage.includedAutomationRuns,
        included_ai_actions: usage.includedAiActions,
        included_api_calls: 0, // Deprecated
        included_email_sends: usage.includedEmailSends,
        included_file_storage_mb: usage.includedFileStorageMb,
        overage_automation_runs: usage.overageAutomationRuns,
        overage_ai_actions: usage.overageAiActions,
        overage_api_calls: 0, // Deprecated
        overage_email_sends: usage.overageEmailSends,
        overage_file_storage_mb: usage.overageFileStorageMb,
        overage_cost: usage.overageCostCents,
        reported_to_paddle: true,
        reported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "subscription_id,period_start",
      },
    );

    return true;
  }

  /**
   * Save overage snapshot to overage_charges table (BIL-08)
   * Called at end of billing period or on demand for reporting
   */
  async saveOverageSnapshot(agencyId: string): Promise<{ id: string } | null> {
    const usage = await this.getCurrentUsage(agencyId);
    if (!usage) return null;

    // Skip if no overages
    if (
      usage.overageAutomationRuns <= 0 &&
      usage.overageAiActions <= 0 &&
      usage.overageEmailSends <= 0 &&
      usage.overageFileStorageMb <= 0
    ) {
      return null;
    }

    // Get per-metric overage rates
    const subscription = await subscriptionService.getSubscription(agencyId);
    const rates =
      OVERAGE_RATES[
        (subscription?.planType as keyof typeof OVERAGE_RATES) ?? "starter"
      ] || OVERAGE_RATES.starter;

    const aiCostCents = Math.round(
      usage.overageAiActions * rates.aiActions * 100,
    );
    const emailCostCents = Math.round(
      usage.overageEmailSends * rates.emailSends * 100,
    );
    const automationCostCents = Math.round(
      usage.overageAutomationRuns * rates.automationRuns * 100,
    );
    const storageCostCents = Math.round(
      usage.overageFileStorageMb * rates.fileStorageMb * 100,
    );
    const totalCostCents =
      aiCostCents + emailCostCents + automationCostCents + storageCostCents;

    const { data, error } = await (this.supabase as any)
      .from("overage_charges")
      .upsert(
        {
          agency_id: agencyId,
          period_start: usage.periodStart.toISOString(),
          period_end: usage.periodEnd.toISOString(),
          ai_actions_overage: usage.overageAiActions,
          ai_actions_cost_cents: aiCostCents,
          email_sends_overage: usage.overageEmailSends,
          email_sends_cost_cents: emailCostCents,
          automation_runs_overage: usage.overageAutomationRuns,
          automation_runs_cost_cents: automationCostCents,
          file_storage_overage_mb: usage.overageFileStorageMb,
          file_storage_cost_cents: storageCostCents,
          total_cost_cents: totalCostCents,
        },
        { onConflict: "agency_id,period_start" },
      )
      .select("id")
      .single();

    if (error) {
      console.error("[UsageTracker] Error saving overage snapshot:", error);
      return null;
    }

    return data;
  }

  /**
   * Get overage charge history for an agency (BIL-08)
   */
  async getOverageHistory(
    agencyId: string,
    limit: number = 12,
  ): Promise<
    Array<{
      id: string;
      periodStart: string;
      periodEnd: string;
      aiActionsOverage: number;
      aiActionsCostCents: number;
      emailSendsOverage: number;
      emailSendsCostCents: number;
      automationRunsOverage: number;
      automationRunsCostCents: number;
      fileStorageOverageMb: number;
      fileStorageCostCents: number;
      totalCostCents: number;
      reportedToPaddle: boolean;
      createdAt: string;
    }>
  > {
    const { data, error } = await (this.supabase as any)
      .from("overage_charges")
      .select("*")
      .eq("agency_id", agencyId)
      .order("period_start", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[UsageTracker] Error fetching overage history:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      aiActionsOverage: row.ai_actions_overage,
      aiActionsCostCents: row.ai_actions_cost_cents,
      emailSendsOverage: row.email_sends_overage,
      emailSendsCostCents: row.email_sends_cost_cents,
      automationRunsOverage: row.automation_runs_overage,
      automationRunsCostCents: row.automation_runs_cost_cents,
      fileStorageOverageMb: row.file_storage_overage_mb,
      fileStorageCostCents: row.file_storage_cost_cents,
      totalCostCents: row.total_cost_cents,
      reportedToPaddle: row.reported_to_paddle,
      createdAt: row.created_at,
    }));
  }

  /**
   * Mark overage as reported to Paddle (BIL-08)
   */
  async markOverageReported(
    overageId: string,
    paddleTransactionId: string,
  ): Promise<boolean> {
    const { error } = await (this.supabase as any)
      .from("overage_charges")
      .update({
        reported_to_paddle: true,
        paddle_transaction_id: paddleTransactionId,
      })
      .eq("id", overageId);

    if (error) {
      console.error("[UsageTracker] Error marking overage reported:", error);
      return false;
    }
    return true;
  }

  /**
   * Get usage alerts (when approaching limits)
   */
  async getUsageAlerts(agencyId: string): Promise<
    Array<{
      type: UsageType;
      severity: "warning" | "critical";
      message: string;
      percentUsed: number;
    }>
  > {
    const usage = await this.getCurrentUsage(agencyId);

    if (!usage) return [];

    const alerts: Array<{
      type: UsageType;
      severity: "warning" | "critical";
      message: string;
      percentUsed: number;
    }> = [];

    const checkType = (type: UsageType, name: string, percent: number) => {
      if (percent >= 100) {
        alerts.push({
          type,
          severity: "critical",
          message: `${name} limit exceeded - overage charges will apply`,
          percentUsed: percent,
        });
      } else if (percent >= 80) {
        alerts.push({
          type,
          severity: "warning",
          message: `${name} at ${Math.round(percent)}% of limit`,
          percentUsed: percent,
        });
      }
    };

    checkType(
      "automation_runs",
      "Automation runs",
      usage.percentUsed.automationRuns,
    );
    checkType("ai_actions", "AI actions", usage.percentUsed.aiActions);
    checkType("email_sends", "Email sends", usage.percentUsed.emailSends);
    checkType("file_storage", "File storage", usage.percentUsed.fileStorageMb);

    return alerts;
  }
}

// Export singleton instance
export const usageTracker = new UsageTracker();

// ============================================================================
// Convenience Functions for Direct Use
// ============================================================================

/**
 * Record an automation run
 */
export async function recordAutomationRun(
  agencyId: string,
  siteId: string,
  count: number = 1,
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, "automation_runs", count);
}

/**
 * Record an AI action
 */
export async function recordAiAction(
  agencyId: string,
  siteId: string,
  count: number = 1,
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, "ai_actions", count);
}

/**
 * Record API calls
 * @deprecated Use recordEmailSend or recordFileStorage instead (v5 pricing)
 */
export async function recordApiCall(
  agencyId: string,
  siteId: string,
  count: number = 1,
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, "email_sends", count);
}

/**
 * Record email sends
 */
export async function recordEmailSend(
  agencyId: string,
  siteId: string,
  count: number = 1,
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, "email_sends", count);
}

/**
 * Record file storage usage (in MB)
 */
export async function recordFileStorage(
  agencyId: string,
  siteId: string,
  megabytes: number,
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, "file_storage", megabytes);
}

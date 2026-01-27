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

import { paddle, PADDLE_IDS, OVERAGE_RATES } from './client';
import { subscriptionService } from './subscription-service';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UsageStats } from '@/types/paddle';

// ============================================================================
// Types
// ============================================================================

export type UsageType = 'automation_runs' | 'ai_actions' | 'api_calls';

export interface UsageReport {
  automationRuns: number;
  aiActions: number;
  apiCalls: number;
  includedAutomationRuns: number;
  includedAiActions: number;
  includedApiCalls: number;
  overageAutomationRuns: number;
  overageAiActions: number;
  overageApiCalls: number;
  overageCostCents: number;
  periodStart: Date;
  periodEnd: Date;
  percentUsed: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
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
    count: number = 1
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
      case 'automation_runs':
        params.p_automation_runs = count;
        break;
      case 'ai_actions':
        params.p_ai_actions = count;
        break;
      case 'api_calls':
        params.p_api_calls = count;
        break;
    }
    
    // Use any cast for RPC call to functions not in types yet
    const { error } = await (this.supabase as any).rpc('increment_usage', params);
    
    if (error) {
      console.error('[UsageTracker] Error recording usage:', error);
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
    }
  ): Promise<void> {
    // Use any cast for RPC call to functions not in types yet
    const { error } = await (this.supabase as any).rpc('increment_usage', {
      p_agency_id: agencyId,
      p_site_id: siteId,
      p_automation_runs: usage.automationRuns || 0,
      p_ai_actions: usage.aiActions || 0,
      p_api_calls: usage.apiCalls || 0,
    });
    
    if (error) {
      console.error('[UsageTracker] Error recording multiple usage:', error);
    }
  }

  /**
   * Get current period usage for an agency
   */
  async getCurrentUsage(agencyId: string): Promise<UsageReport | null> {
    // Get subscription using the service (includes Paddle API fallback)
    const subscription = await subscriptionService.getSubscription(agencyId);
    
    if (!subscription) {
      console.error('[UsageTracker] No active subscription found');
      return null;
    }
    
    // Get usage for current period (use any cast for RPC)
    const { data: usage, error: usageError } = await (this.supabase as any)
      .rpc('get_current_period_usage', { p_agency_id: agencyId });
    
    const currentUsage = (usage?.[0] as any) || {
      automation_runs: 0,
      ai_actions: 0,
      api_calls: 0,
    };
    
    // Use subscription data for included limits
    const includedAutomation = subscription.includedUsage.automationRuns;
    const includedAi = subscription.includedUsage.aiActions;
    const includedApi = subscription.includedUsage.apiCalls;
    
    // Calculate overages
    const overageAutomation = Math.max(0,
      currentUsage.automation_runs - includedAutomation);
    const overageAi = Math.max(0,
      currentUsage.ai_actions - includedAi);
    const overageApi = Math.max(0,
      currentUsage.api_calls - includedApi);
    
    // Get overage rates based on plan
    const rates = OVERAGE_RATES[subscription.planType as keyof typeof OVERAGE_RATES] || OVERAGE_RATES.starter;
    
    // Calculate overage cost in cents
    const overageCost = Math.round((
      (overageAutomation * rates.automationRuns) +
      (overageAi * rates.aiActions) +
      (overageApi * rates.apiCalls)
    ) * 100);
    
    return {
      automationRuns: currentUsage.automation_runs,
      aiActions: currentUsage.ai_actions,
      apiCalls: currentUsage.api_calls,
      includedAutomationRuns: includedAutomation,
      includedAiActions: includedAi,
      includedApiCalls: includedApi,
      overageAutomationRuns: overageAutomation,
      overageAiActions: overageAi,
      overageApiCalls: overageApi,
      overageCostCents: overageCost,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      percentUsed: {
        automationRuns: includedAutomation > 0
          ? (currentUsage.automation_runs / includedAutomation) * 100
          : 0,
        aiActions: includedAi > 0
          ? (currentUsage.ai_actions / includedAi) * 100
          : 0,
        apiCalls: includedApi > 0
          ? (currentUsage.api_calls / includedApi) * 100
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
    requestedCount: number = 1
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
      case 'automation_runs':
        current = usage.automationRuns;
        included = usage.includedAutomationRuns;
        break;
      case 'ai_actions':
        current = usage.aiActions;
        included = usage.includedAiActions;
        break;
      case 'api_calls':
        current = usage.apiCalls;
        included = usage.includedApiCalls;
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
    days: number = 30
  ): Promise<Array<{
    date: string;
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await this.supabase.from('usage_daily')
      .select('date, automation_runs, ai_actions, api_calls')
      .eq('agency_id', agencyId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (error) {
      console.error('[UsageTracker] Error fetching usage history:', error);
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
  async getUsageBySite(agencyId: string): Promise<Record<string, {
    siteId: string;
    siteName?: string;
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  }>> {
    // Get subscription period
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('current_period_start, current_period_end')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();
    
    if (!sub) {
      return {};
    }
    
    // Get hourly usage grouped by site
    const { data, error } = await this.supabase.from('usage_hourly')
      .select(`
        site_id,
        automation_runs,
        ai_actions,
        api_calls
      `)
      .eq('agency_id', agencyId)
      .gte('hour_timestamp', sub.current_period_start)
      .lt('hour_timestamp', sub.current_period_end);
    
    if (error || !data) {
      console.error('[UsageTracker] Error fetching usage by site:', error);
      return {};
    }
    
    // Aggregate by site
    const bySite: Record<string, {
      siteId: string;
      automationRuns: number;
      aiActions: number;
      apiCalls: number;
    }> = {};
    
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
    const { data: sub } = await this.supabase.from('paddle_subscriptions')
      .select('*')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();
    
    if (!sub) {
      console.log('[UsageTracker] No subscription to report usage for');
      return false;
    }
    
    // Get usage report
    const usage = await this.getCurrentUsage(agencyId);
    
    if (!usage) {
      console.log('[UsageTracker] No usage to report');
      return false;
    }
    
    // Only report if there's overage
    if (
      usage.overageAutomationRuns <= 0 &&
      usage.overageAiActions <= 0 &&
      usage.overageApiCalls <= 0
    ) {
      console.log('[UsageTracker] No overage to report');
      return false;
    }
    
    if (!paddle) {
      console.error('[UsageTracker] Paddle not configured');
      return false;
    }
    
    // Build line items for overage charges
    const items: Array<{ priceId: string; quantity: number }> = [];
    
    if (usage.overageAutomationRuns > 0 && PADDLE_IDS.prices.automation_overage) {
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
    
    if (usage.overageApiCalls > 0 && PADDLE_IDS.prices.api_overage) {
      items.push({
        priceId: PADDLE_IDS.prices.api_overage,
        quantity: usage.overageApiCalls,
      });
    }
    
    if (items.length > 0) {
      // Get customer
      const { data: customer } = await this.supabase.from('paddle_customers')
        .select('paddle_customer_id')
        .eq('agency_id', agencyId)
        .maybeSingle();
      
      if (customer) {
        try {
          // Create transaction for overage
          await paddle.transactions.create({
            customerId: customer.paddle_customer_id,
            items,
            collectionMode: 'automatic',
          });
          
          console.log('[UsageTracker] Overage transaction created');
        } catch (error) {
          console.error('[UsageTracker] Error creating overage transaction:', error);
          return false;
        }
      }
    }
    
    // Record that we reported this period
    await this.supabase.from('usage_billing_period')
      .upsert({
        agency_id: agencyId,
        subscription_id: sub.id,
        period_start: sub.current_period_start ?? new Date().toISOString(),
        period_end: sub.current_period_end ?? new Date().toISOString(),
        automation_runs: usage.automationRuns,
        ai_actions: usage.aiActions,
        api_calls: usage.apiCalls,
        included_automation_runs: usage.includedAutomationRuns,
        included_ai_actions: usage.includedAiActions,
        included_api_calls: usage.includedApiCalls,
        overage_automation_runs: usage.overageAutomationRuns,
        overage_ai_actions: usage.overageAiActions,
        overage_api_calls: usage.overageApiCalls,
        overage_cost: usage.overageCostCents,
        reported_to_paddle: true,
        reported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'subscription_id,period_start',
      });
    
    return true;
  }

  /**
   * Get usage alerts (when approaching limits)
   */
  async getUsageAlerts(agencyId: string): Promise<Array<{
    type: UsageType;
    severity: 'warning' | 'critical';
    message: string;
    percentUsed: number;
  }>> {
    const usage = await this.getCurrentUsage(agencyId);
    
    if (!usage) return [];
    
    const alerts: Array<{
      type: UsageType;
      severity: 'warning' | 'critical';
      message: string;
      percentUsed: number;
    }> = [];
    
    const checkType = (
      type: UsageType,
      name: string,
      percent: number
    ) => {
      if (percent >= 100) {
        alerts.push({
          type,
          severity: 'critical',
          message: `${name} limit exceeded - overage charges will apply`,
          percentUsed: percent,
        });
      } else if (percent >= 80) {
        alerts.push({
          type,
          severity: 'warning',
          message: `${name} at ${Math.round(percent)}% of limit`,
          percentUsed: percent,
        });
      }
    };
    
    checkType('automation_runs', 'Automation runs', usage.percentUsed.automationRuns);
    checkType('ai_actions', 'AI actions', usage.percentUsed.aiActions);
    checkType('api_calls', 'API calls', usage.percentUsed.apiCalls);
    
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
  count: number = 1
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, 'automation_runs', count);
}

/**
 * Record an AI action
 */
export async function recordAiAction(
  agencyId: string,
  siteId: string,
  count: number = 1
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, 'ai_actions', count);
}

/**
 * Record API calls
 */
export async function recordApiCall(
  agencyId: string,
  siteId: string,
  count: number = 1
): Promise<void> {
  await usageTracker.recordUsage(agencyId, siteId, 'api_calls', count);
}


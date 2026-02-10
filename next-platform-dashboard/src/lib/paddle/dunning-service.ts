/**
 * Paddle Dunning Service
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * Handles failed payment recovery:
 * - Payment failure notification emails
 * - Retry tracking
 * - Account suspension after max retries
 * - Payment recovery handling
 * 
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { PLATFORM } from '@/lib/constants/platform';
import { sendEmail } from '@/lib/email';

// ============================================================================
// Types
// ============================================================================

export interface DunningConfig {
  maxRetries: number;
  retryIntervals: number[]; // days between retries
  gracePeriod: number;      // days before downgrade
  downgradeAction: 'cancel' | 'downgrade' | 'pause';
}

interface AgencyInfo {
  id: string;
  name: string;
  owner_email: string;
  owner_id?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: DunningConfig = {
  maxRetries: 4,
  retryIntervals: [1, 3, 5, 7], // retry after 1, 3, 5, 7 days
  gracePeriod: 14,
  downgradeAction: 'pause',
};

// ============================================================================
// Dunning Service
// ============================================================================

// Use type cast for inserting into activity_log with custom data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export class DunningService {
  private config: DunningConfig;
  private supabase: AnySupabase = createAdminClient();
  
  constructor(config: Partial<DunningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Log billing event to activity_log
   * (Billing events don't use the automation event system as they're not site-scoped)
   */
  private async logBillingEvent(
    agencyId: string,
    userId: string | undefined,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase
        .from('activity_log')
        .insert({
          agency_id: agencyId,
          user_id: userId || '00000000-0000-0000-0000-000000000000', // System user for automated events
          action,
          resource_type: 'subscription',
          resource_id: details.subscription_id as string,
          details: details as any,
        });
    } catch (error) {
      console.error('[Dunning] Failed to log billing event:', error);
    }
  }

  /**
   * Handle payment failure
   * Called when a Paddle payment fails
   */
  async handlePaymentFailed(subscriptionId: string, transactionId: string): Promise<void> {
    // Get subscription details
    const { data: sub, error } = await this.supabase
      .from('paddle_subscriptions')
      .select(`
        *,
        paddle_customers!inner(email, name),
        agencies!inner(id, name, owner_id)
      `)
      .eq('paddle_subscription_id', subscriptionId)
      .single();
    
    if (error || !sub) {
      console.error('[Dunning] Error fetching subscription:', error);
      return;
    }
    
    // Get retry count from metadata
    const metadata = (sub.metadata as Record<string, unknown>) || {};
    const retryCount = ((metadata.dunning_retry_count as number) || 0) + 1;
    
    // Update subscription metadata
    const { error: updateError } = await this.supabase
      .from('paddle_subscriptions')
      .update({
        status: 'past_due',
        metadata: {
          ...metadata,
          dunning_retry_count: retryCount,
          last_failed_at: new Date().toISOString(),
          last_failed_transaction: transactionId,
        }
      })
      .eq('id', sub.id);
    
    if (updateError) {
      console.error('[Dunning] Error updating subscription:', updateError);
    }
    
    const agency: AgencyInfo = {
      id: sub.agencies.id,
      name: sub.agencies.name,
      owner_email: sub.paddle_customers.email,
      owner_id: sub.agencies.owner_id,
    };
    
    // Send appropriate email based on retry count
    if (retryCount === 1) {
      await this.sendPaymentFailedEmail(agency.owner_email, agency.name, 'first');
    } else if (retryCount === 2) {
      await this.sendPaymentFailedEmail(agency.owner_email, agency.name, 'second');
    } else if (retryCount === 3) {
      await this.sendPaymentFailedEmail(agency.owner_email, agency.name, 'urgent');
    } else if (retryCount >= this.config.maxRetries) {
      await this.handleMaxRetriesReached(sub.id, agency);
    }
    
    // Create notification for agency owner
    if (agency.owner_id) {
      await this.supabase
        .from('notifications')
        .insert({
          user_id: agency.owner_id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `We couldn't process your payment. Please update your payment method.`,
          link: '/dashboard/settings/billing',
          metadata: {
            agency_id: agency.id,
            priority: retryCount >= 3 ? 'high' : 'medium',
          }
        });
    }
    
    // Log billing event
    await this.logBillingEvent(agency.id, agency.owner_id, 'billing.payment.failed', {
      subscription_id: sub.id,
      retry_count: retryCount,
      transaction_id: transactionId,
    });
  }

  /**
   * Handle payment success (recovery)
   * Called when a previously failed payment succeeds
   */
  async handlePaymentRecovered(subscriptionId: string): Promise<void> {
    const { data: sub, error } = await this.supabase
      .from('paddle_subscriptions')
      .select(`
        *,
        paddle_customers!inner(email, name),
        agencies!inner(id, name, owner_id)
      `)
      .eq('paddle_subscription_id', subscriptionId)
      .single();
    
    if (error || !sub) {
      console.error('[Dunning] Error fetching subscription for recovery:', error);
      return;
    }
    
    const metadata = (sub.metadata as Record<string, unknown>) || {};
    
    // Check if this was a recovery (had failed payments)
    if (!metadata.dunning_retry_count) {
      return; // Not a recovery situation
    }
    
    // Clear dunning state
    const { error: updateError } = await this.supabase
      .from('paddle_subscriptions')
      .update({
        status: 'active',
        metadata: {
          ...metadata,
          dunning_retry_count: 0,
          last_failed_at: null,
          recovered_at: new Date().toISOString(),
        }
      })
      .eq('id', sub.id);
    
    if (updateError) {
      console.error('[Dunning] Error updating subscription recovery:', updateError);
    }
    
    // Send recovery email
    await sendEmail({
      to: { email: sub.paddle_customers.email, name: sub.paddle_customers.name || undefined },
      type: 'payment_success' as any,
      data: {
        agencyName: sub.agencies.name,
        subject: 'Payment Successful - Your subscription is active!',
      }
    });
    
    // Log billing event
    await this.logBillingEvent(sub.agencies.id, sub.agencies.owner_id, 'billing.payment.recovered', {
      subscription_id: sub.id,
    });
  }

  /**
   * Handle max retries reached
   * Applies the configured downgrade action
   */
  private async handleMaxRetriesReached(
    subscriptionId: string,
    agency: AgencyInfo
  ): Promise<void> {
    switch (this.config.downgradeAction) {
      case 'cancel':
        await this.supabase
          .from('paddle_subscriptions')
          .update({ status: 'canceled' })
          .eq('id', subscriptionId);
        break;
        
      case 'downgrade':
        // Downgrade to free tier or starter
        await this.supabase
          .from('paddle_subscriptions')
          .update({ 
            status: 'active',
            plan_type: 'free',
            included_automation_runs: 100,
            included_ai_actions: 50,
            included_api_calls: 1000,
          })
          .eq('id', subscriptionId);
        break;
        
      case 'pause':
        await this.supabase
          .from('paddle_subscriptions')
          .update({ 
            status: 'paused',
            paused_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);
        break;
    }
    
    await this.sendFinalNoticeEmail(agency.owner_email, agency.name);
    
    // Log billing event
    await this.logBillingEvent(agency.id, agency.owner_id, 'billing.subscription.suspended', {
      subscription_id: subscriptionId,
      action: this.config.downgradeAction,
    });
  }

  /**
   * Send payment failed emails
   */
  private async sendPaymentFailedEmail(
    email: string,
    agencyName: string,
    severity: 'first' | 'second' | 'urgent'
  ): Promise<void> {
    const subjects = {
      first: 'Action Required: Payment Failed',
      second: 'Reminder: Please Update Your Payment Method',
      urgent: 'URGENT: Your account will be suspended',
    };
    
    await sendEmail({
      to: { email },
      type: 'payment_failed' as any,
      data: {
        agencyName,
        subject: subjects[severity],
        severity,
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
        supportEmail: PLATFORM.supportEmail,
      }
    });
  }

  /**
   * Send final notice email
   */
  private async sendFinalNoticeEmail(email: string, agencyName: string): Promise<void> {
    await sendEmail({
      to: { email },
      type: 'subscription_paused' as any,
      data: {
        agencyName,
        subject: 'Your DRAMAC subscription has been paused',
        reactivateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
      }
    });
  }
  
  /**
   * Get dunning status for a subscription
   */
  async getDunningStatus(subscriptionId: string): Promise<{
    retryCount: number;
    lastFailedAt: string | null;
    status: 'none' | 'active' | 'max_reached';
  }> {
    const { data, error } = await this.supabase
      .from('paddle_subscriptions')
      .select('metadata, status')
      .eq('paddle_subscription_id', subscriptionId)
      .single();
    
    if (error || !data) {
      return { retryCount: 0, lastFailedAt: null, status: 'none' };
    }
    
    const metadata = (data.metadata as Record<string, unknown>) || {};
    const retryCount = (metadata.dunning_retry_count as number) || 0;
    const lastFailedAt = (metadata.last_failed_at as string) || null;
    
    let status: 'none' | 'active' | 'max_reached' = 'none';
    if (retryCount > 0 && retryCount < this.config.maxRetries) {
      status = 'active';
    } else if (retryCount >= this.config.maxRetries) {
      status = 'max_reached';
    }
    
    return { retryCount, lastFailedAt, status };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const dunningService = new DunningService();

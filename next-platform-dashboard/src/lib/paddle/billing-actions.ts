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

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/paddle/subscription-service';
import { usageTracker } from '@/lib/paddle/usage-tracker';
import { isPaddleConfigured } from '@/lib/paddle/client';
import type { BillingOverview, PaddleProduct, UsageStats } from '@/types/paddle';

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserAgency(): Promise<{ userId: string; agencyId: string } | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .maybeSingle();
  
  if (!profile?.agency_id) return null;
  
  return { userId: user.id, agencyId: profile.agency_id };
}

async function verifyAgencyAccess(
  agencyId: string,
  requireAdmin: boolean = false
): Promise<{ userId: string; role: string } | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: membership } = await supabase
    .from('agency_members')
    .select('role')
    .eq('agency_id', agencyId)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (!membership) return null;
  
  if (requireAdmin && !['owner', 'admin'].includes(membership.role)) {
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
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  const userAgency = await getCurrentUserAgency();
  if (!userAgency) {
    return { success: false, error: 'Not authenticated or no agency' };
  }
  
  try {
    const subscription = await subscriptionService.getSubscription(userAgency.agencyId);
    return { success: true, data: subscription };
  } catch (error) {
    console.error('[Billing Action] getSubscription error:', error);
    return { success: false, error: 'Failed to get subscription' };
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
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  // If no agencyId provided, get from current user
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: 'Not authenticated or no agency' };
    }
    agencyId = userAgency.agencyId;
  } else {
    // Verify access
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: 'Not authorized' };
    }
  }
  
  try {
    const overview = await subscriptionService.getBillingOverview(agencyId);
    return { success: true, data: overview };
  } catch (error) {
    console.error('[Billing Action] getBillingOverview error:', error);
    return { success: false, error: 'Failed to get billing overview' };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscriptionPaddle(
  agencyId: string,
  immediately: boolean = false
) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: 'Admin access required' };
  }
  
  try {
    await subscriptionService.cancelSubscription(agencyId, immediately);
    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (error) {
    console.error('[Billing Action] cancelSubscription error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel' };
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscriptionPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: 'Admin access required' };
  }
  
  try {
    await subscriptionService.pauseSubscription(agencyId);
    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (error) {
    console.error('[Billing Action] pauseSubscription error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to pause' };
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscriptionPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: 'Admin access required' };
  }
  
  try {
    await subscriptionService.resumeSubscription(agencyId);
    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (error) {
    console.error('[Billing Action] resumeSubscription error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to resume' };
  }
}

/**
 * Undo scheduled cancellation
 */
export async function undoCancelSubscriptionPaddle(agencyId: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: 'Admin access required' };
  }
  
  try {
    await subscriptionService.undoCancelSubscription(agencyId);
    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (error) {
    console.error('[Billing Action] undoCancelSubscription error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to undo cancellation' };
  }
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlanPaddle(
  agencyId: string,
  newPlanType: 'starter' | 'pro',
  newBillingCycle: 'monthly' | 'yearly',
  prorate: boolean = true
) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  const access = await verifyAgencyAccess(agencyId, true);
  if (!access) {
    return { success: false, error: 'Admin access required' };
  }
  
  try {
    await subscriptionService.changePlan(agencyId, newPlanType, newBillingCycle, prorate);
    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (error) {
    console.error('[Billing Action] changePlan error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to change plan' };
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
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  // If no agencyId provided, get from current user
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: 'Not authenticated or no agency' };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: 'Not authorized' };
    }
  }
  
  try {
    const usage = await usageTracker.getCurrentUsage(agencyId);
    return { success: true, data: usage };
  } catch (error) {
    console.error('[Billing Action] getUsage error:', error);
    return { success: false, error: 'Failed to get usage' };
  }
}

/**
 * Get usage alerts
 */
export async function getUsageAlertsPaddle(agencyId?: string) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: 'Not authenticated or no agency' };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: 'Not authorized' };
    }
  }
  
  try {
    const alerts = await usageTracker.getUsageAlerts(agencyId);
    return { success: true, data: alerts };
  } catch (error) {
    console.error('[Billing Action] getUsageAlerts error:', error);
    return { success: false, error: 'Failed to get usage alerts' };
  }
}

/**
 * Get usage history
 */
export async function getUsageHistoryPaddle(agencyId?: string, days: number = 30) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: 'Not authenticated or no agency' };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: 'Not authorized' };
    }
  }
  
  try {
    const history = await usageTracker.getUsageHistory(agencyId, days);
    return { success: true, data: history };
  } catch (error) {
    console.error('[Billing Action] getUsageHistory error:', error);
    return { success: false, error: 'Failed to get usage history' };
  }
}

// ============================================================================
// Invoice Actions
// ============================================================================

/**
 * Get invoices for agency
 */
export async function getAgencyInvoicesPaddle(agencyId?: string, limit: number = 10) {
  if (!isPaddleConfigured) {
    return { success: false, error: 'Paddle billing not configured' };
  }
  
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) {
      return { success: false, error: 'Not authenticated or no agency' };
    }
    agencyId = userAgency.agencyId;
  } else {
    const access = await verifyAgencyAccess(agencyId);
    if (!access) {
      return { success: false, error: 'Not authorized' };
    }
  }
  
  try {
    const invoices = await subscriptionService.getInvoices(agencyId, limit);
    return { success: true, data: invoices };
  } catch (error) {
    console.error('[Billing Action] getInvoices error:', error);
    return { success: false, error: 'Failed to get invoices' };
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
    console.error('[Billing Action] getProducts error:', error);
    return { success: false, error: 'Failed to get products' };
  }
}

// ============================================================================
// Status Check Actions
// ============================================================================

/**
 * Check if agency has active subscription
 */
export async function hasActiveSubscriptionPaddle(agencyId?: string): Promise<boolean> {
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
export async function getSubscriptionStatusPaddle(agencyId?: string): Promise<string> {
  if (!isPaddleConfigured) return 'free';
  
  if (!agencyId) {
    const userAgency = await getCurrentUserAgency();
    if (!userAgency) return 'free';
    agencyId = userAgency.agencyId;
  }
  
  try {
    return await subscriptionService.getSubscriptionStatus(agencyId);
  } catch {
    return 'free';
  }
}

/**
 * Check if Paddle is configured
 */
export async function isPaddleEnabledPaddle(): Promise<boolean> {
  return isPaddleConfigured;
}

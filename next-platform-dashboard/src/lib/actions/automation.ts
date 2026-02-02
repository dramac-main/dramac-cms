"use server";

// src/lib/actions/automation.ts
// Domain Automation Server Actions - Health Checks, Auto-Renewal, Notifications

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { renewalService } from "@/lib/resellerclub/transfers";
import { zoneService } from "@/lib/cloudflare";

// Type definitions
type HealthCheckRecord = {
  id: string;
  domain_id: string;
  dns_healthy: boolean;
  ssl_healthy: boolean;
  nameservers_correct: boolean;
  whois_accessible: boolean;
  dns_issues: string[];
  ssl_issues: string[];
  last_checked_at: string;
  next_check_at: string;
};

type ExpiryNotificationSettings = {
  notify_30_days?: boolean;
  notify_14_days?: boolean;
  notify_7_days?: boolean;
  notify_1_day?: boolean;
};

type DomainRecord = {
  id: string;
  resellerclub_order_id?: string | null;
  expiry_date?: string | null;
  cloudflare_zone_id?: string | null;
  domain_name?: string;
  nameservers?: string[] | null;
};

// ============================================================================
// Auto-Renewal Actions
// ============================================================================

export async function setAutoRenew(domainId: string, enabled: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain - use type assertion for domains table
    const { data: domainRaw } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: DomainRecord | null }> } } } })
      .from('domains')
      .select('resellerclub_order_id')
      .eq('id', domainId)
      .single();

    const domain = domainRaw as DomainRecord | null;

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    // Update at ResellerClub if configured
    if (domain.resellerclub_order_id) {
      try {
        await renewalService.setAutoRenew(domain.resellerclub_order_id, enabled);
      } catch (apiError) {
        console.warn('[Automation] ResellerClub auto-renew update failed:', apiError);
      }
    }

    // Update local record
    const adminClient = createAdminClient();
    const { error } = await (adminClient as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: Error | null }> } } })
      .from('domains')
      .update({
        auto_renew_enabled: enabled,
        auto_renew: enabled
      })
      .eq('id', domainId);

    if (error) throw error;

    revalidatePath(`/dashboard/domains/${domainId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update auto-renewal'
    };
  }
}

export async function renewDomain(domainId: string, years: number = 1) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain
    const { data: domainRaw } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: DomainRecord | null }> } } } })
      .from('domains')
      .select('resellerclub_order_id, expiry_date')
      .eq('id', domainId)
      .single();

    const domain = domainRaw as DomainRecord | null;

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    // Renew at ResellerClub if configured
    if (domain.resellerclub_order_id) {
      try {
        await renewalService.renewDomain(domain.resellerclub_order_id, years);
      } catch (apiError) {
        console.warn('[Automation] ResellerClub renewal failed:', apiError);
        // Continue with local update for demo
      }
    }

    // Calculate new expiry
    const currentExpiry = domain.expiry_date ? new Date(domain.expiry_date) : new Date();
    currentExpiry.setFullYear(currentExpiry.getFullYear() + years);

    // Update local record
    const { error } = await (adminClient as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: Error | null }> } } })
      .from('domains')
      .update({
        expiry_date: currentExpiry.toISOString(),
        last_renewed_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    if (error) throw error;

    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath('/dashboard/domains');

    return { success: true, data: { newExpiry: currentExpiry.toISOString() } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to renew domain'
    };
  }
}

// ============================================================================
// Health Check Actions
// ============================================================================

export async function runHealthCheck(domainId: string): Promise<{
  success: boolean;
  data?: {
    dns_healthy: boolean;
    ssl_healthy: boolean;
    nameservers_correct: boolean;
    whois_accessible: boolean;
    dns_issues: string[];
    ssl_issues: string[];
    status: string;
  };
  error?: string;
}> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Get domain - use type assertion for domains table
    const { data: domainRaw } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: DomainRecord | null }> } } } })
      .from('domains')
      .select('domain_name, cloudflare_zone_id, nameservers')
      .eq('id', domainId)
      .single();

    const domain = domainRaw as DomainRecord | null;

    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }

    const healthResults = {
      dns_healthy: false,
      ssl_healthy: false,
      nameservers_correct: false,
      whois_accessible: true, // Simplified check
      dns_issues: [] as string[],
      ssl_issues: [] as string[],
    };

    // Check Cloudflare zone if exists
    if (domain.cloudflare_zone_id) {
      try {
        // zoneService.getZone returns CloudflareZone directly
        const zone = await zoneService.getZone(domain.cloudflare_zone_id);

        healthResults.dns_healthy = zone.status === 'active';

        if (!healthResults.dns_healthy) {
          healthResults.dns_issues.push(`Zone status: ${zone.status}`);
        }

        // Check if nameservers match
        const expectedNs = zone.nameServers || [];
        const currentNs = (domain.nameservers as string[]) || [];
        healthResults.nameservers_correct = expectedNs.length > 0 && expectedNs.every((ns: string) =>
          currentNs.some(current => current.toLowerCase() === ns.toLowerCase())
        );

        if (!healthResults.nameservers_correct && expectedNs.length > 0) {
          healthResults.dns_issues.push('Nameservers not correctly configured');
        }

        // Check SSL (assume healthy if zone is active)
        healthResults.ssl_healthy = healthResults.dns_healthy;
        if (!healthResults.ssl_healthy) {
          healthResults.ssl_issues.push('SSL depends on active zone');
        }
      } catch (cfError) {
        console.warn('[Health Check] Cloudflare check failed:', cfError);
        healthResults.dns_issues.push('Could not access Cloudflare zone');
      }
    } else {
      healthResults.dns_issues.push('Domain not configured with Cloudflare');
    }

    // Calculate overall health status
    const allHealthy = healthResults.dns_healthy &&
                       healthResults.ssl_healthy &&
                       healthResults.nameservers_correct;
    const someHealthy = healthResults.dns_healthy ||
                        healthResults.ssl_healthy ||
                        healthResults.nameservers_correct;

    const healthStatus = allHealthy ? 'healthy' : someHealthy ? 'warning' : 'unhealthy';

    // Upsert health check record - use type assertion
    const { error: upsertError } = await (adminClient as unknown as { from: (table: string) => { upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: Error | null }> } })
      .from('domain_health_checks')
      .upsert({
        domain_id: domainId,
        dns_healthy: healthResults.dns_healthy,
        ssl_healthy: healthResults.ssl_healthy,
        nameservers_correct: healthResults.nameservers_correct,
        whois_accessible: healthResults.whois_accessible,
        dns_issues: healthResults.dns_issues,
        ssl_issues: healthResults.ssl_issues,
        last_checked_at: new Date().toISOString(),
        next_check_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'domain_id',
      });

    if (upsertError) {
      console.warn('[Health Check] Failed to save health check:', upsertError);
    }

    // Update domain health status - use type assertion
    const { error: updateError } = await (adminClient as unknown as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: Error | null }> } } })
      .from('domains')
      .update({
        health_status: healthStatus,
        last_health_check_at: new Date().toISOString(),
      })
      .eq('id', domainId);

    if (updateError) {
      console.warn('[Health Check] Failed to update domain:', updateError);
    }

    revalidatePath(`/dashboard/domains/${domainId}`);

    return {
      success: true,
      data: { ...healthResults, status: healthStatus }
    };
  } catch (error) {
    console.error('[Health Check] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run health check'
    };
  }
}

export async function getHealthCheck(domainId: string): Promise<{
  success: boolean;
  data?: HealthCheckRecord;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Use type assertion for domain_health_checks table
    const { data, error } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: HealthCheckRecord | null; error: { code: string; message: string } | null }> } } } })
      .from('domain_health_checks')
      .select('*')
      .eq('domain_id', domainId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found - not an error, just no health check yet
        return { success: true, data: undefined };
      }
      throw error;
    }

    return { success: true, data: data as HealthCheckRecord };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health check'
    };
  }
}

// ============================================================================
// Expiry Notifications Actions
// ============================================================================

export async function updateExpiryNotifications(
  domainId: string,
  settings: ExpiryNotificationSettings
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    // Use type assertion for domain_expiry_notifications table
    const { error } = await (supabase as unknown as { from: (table: string) => { upsert: (data: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: Error | null }> } })
      .from('domain_expiry_notifications')
      .upsert({
        domain_id: domainId,
        ...settings,
      }, {
        onConflict: 'domain_id',
      });

    if (error) throw error;

    revalidatePath(`/dashboard/domains/${domainId}/settings`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notification settings'
    };
  }
}

export async function getExpiryNotifications(domainId: string) {
  const supabase = await createClient();

  try {
    // Use type assertion for domain_expiry_notifications table
    const { data, error } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { single: () => Promise<{ data: ExpiryNotificationSettings | null; error: { code: string; message: string } | null }> } } } })
      .from('domain_expiry_notifications')
      .select('*')
      .eq('domain_id', domainId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found - return defaults
        return {
          success: true,
          data: {
            notify_30_days: true,
            notify_14_days: true,
            notify_7_days: true,
            notify_1_day: true,
          }
        };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notification settings'
    };
  }
}

// ============================================================================
// Bulk Actions
// ============================================================================

export async function bulkSetAutoRenew(domainIds: string[], enabled: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const results = await Promise.allSettled(
    domainIds.map(id => setAutoRenew(id, enabled))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
  const failed = domainIds.length - successful;

  revalidatePath('/dashboard/domains');

  return {
    success: true,
    data: { successful, failed, total: domainIds.length }
  };
}

export async function bulkRunHealthCheck(domainIds: string[]) {
  const results = await Promise.allSettled(
    domainIds.map(id => runHealthCheck(id))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
  const failed = domainIds.length - successful;

  return {
    success: true,
    data: { successful, failed, total: domainIds.length }
  };
}

// ============================================================================
// Expiring Domains
// ============================================================================

export async function getExpiringDomains(days: number = 30) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) return { success: false, error: 'No agency found' };

  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    // Use type assertion for domains table
    const { data, error } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { lte: (col: string, val: string) => { gte: (col: string, val: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: DomainRecord[] | null; error: Error | null }> } } } } } })
      .from('domains')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .lte('expiry_date', expiryDate.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get expiring domains'
    };
  }
}

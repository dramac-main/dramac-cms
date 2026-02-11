// src/app/api/cron/domains/route.ts
// Automated domain tasks: health checks, expiry notifications, auto-renewal
// 
// Triggered by Vercel Cron or external scheduler
// Schedule: Daily at 06:00 UTC (08:00 Lusaka time)
//
// vercel.json cron config:
// { "crons": [{ "path": "/api/cron/domains", "schedule": "0 6 * * *" }] }

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isConfigured } from "@/lib/resellerclub/config";
import { sendEmail } from "@/lib/email/send-email";

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  // If no CRON_SECRET set, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const results = {
    expiryNotifications: { sent: 0, errors: 0 },
    healthChecks: { checked: 0, errors: 0 },
    timestamp: new Date().toISOString(),
  };
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    
    // ====================================================================
    // 1. Send expiry notifications for domains expiring in 30, 14, 7, 1 days
    // ====================================================================
    const now = new Date();
    const notificationWindows = [
      { days: 30, label: '30 days' },
      { days: 14, label: '14 days' },
      { days: 7, label: '7 days' },
      { days: 1, label: '1 day' },
    ];
    
    for (const window of notificationWindows) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + window.days);
      
      // Find domains expiring on this exact day (±12 hours window)
      const rangeStart = new Date(targetDate);
      rangeStart.setHours(rangeStart.getHours() - 12);
      const rangeEnd = new Date(targetDate);
      rangeEnd.setHours(rangeEnd.getHours() + 12);
      
      const { data: expiringDomains } = await admin
        .from('domains')
        .select('id, domain_name, expiry_date, auto_renew, agency_id')
        .eq('status', 'active')
        .gte('expiry_date', rangeStart.toISOString())
        .lte('expiry_date', rangeEnd.toISOString());
      
      if (expiringDomains && expiringDomains.length > 0) {
        for (const domain of expiringDomains) {
          try {
            // Check if notification was already sent
            const notificationField = `notify_${window.days}_days`;
            const { data: notifSettings } = await admin
              .from('domain_expiry_notifications')
              .select('*')
              .eq('domain_id', domain.id)
              .maybeSingle();
            
            // Skip if notifications disabled for this window
            if (notifSettings && notifSettings[notificationField] === false) {
              continue;
            }
            
            // Check if already sent today
            const sentField = `last_${window.days}_day_sent`;
            if (notifSettings?.[sentField]) {
              const lastSent = new Date(notifSettings[sentField]);
              if (now.getTime() - lastSent.getTime() < 20 * 60 * 60 * 1000) {
                continue; // Sent less than 20 hours ago
              }
            }
            
            // Get agency owner email
            const { data: agency } = await admin
              .from('agencies')
              .select('name')
              .eq('id', domain.agency_id)
              .single();
            
            const { data: owner } = await admin
              .from('profiles')
              .select('email')
              .eq('agency_id', domain.agency_id)
              .limit(1)
              .single();
            
            if (owner?.email) {
              try {
                await sendEmail({
                  to: { email: owner.email },
                  type: 'domain_expiring',
                  data: {
                    domainName: domain.domain_name,
                    expiryDate: new Date(domain.expiry_date).toLocaleDateString('en-ZM', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    }),
                    daysUntilExpiry: window.days,
                    autoRenew: domain.auto_renew,
                    agencyName: agency?.name || 'Your Agency',
                    renewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/domains/${domain.id}/renew`,
                  },
                });
                results.expiryNotifications.sent++;
              } catch {
                results.expiryNotifications.errors++;
              }
            }
            
            // Mark notification as sent
            await admin
              .from('domain_expiry_notifications')
              .upsert({
                domain_id: domain.id,
                [`last_${window.days}_day_sent`]: now.toISOString(),
              }, { onConflict: 'domain_id' });
            
          } catch {
            results.expiryNotifications.errors++;
          }
        }
      }
    }
    
    // ====================================================================
    // 2. Run health checks on domains that haven't been checked in 24h
    // ====================================================================
    if (isConfigured()) {
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { data: domainsToCheck } = await admin
        .from('domains')
        .select('id, domain_name, cloudflare_zone_id')
        .eq('status', 'active')
        .not('cloudflare_zone_id', 'is', null)
        .or(`last_health_check_at.is.null,last_health_check_at.lt.${twentyFourHoursAgo.toISOString()}`)
        .limit(50); // Process max 50 per run to stay within limits
      
      if (domainsToCheck && domainsToCheck.length > 0) {
        // Import health check dynamically to avoid circular deps
        const { runHealthCheck } = await import('@/lib/actions/automation');
        
        for (const domain of domainsToCheck) {
          try {
            await runHealthCheck(domain.id);
            results.healthChecks.checked++;
          } catch {
            results.healthChecks.errors++;
          }
        }
      }
    }
    
    // ====================================================================
    // 3. Update expired domain statuses
    // ====================================================================
    await admin
      .from('domains')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expiry_date', now.toISOString());
    
    return NextResponse.json({
      success: true,
      ...results,
    });
    
  } catch (error) {
    console.error('[Cron/Domains] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cron job failed',
      ...results,
    }, { status: 500 });
  }
}

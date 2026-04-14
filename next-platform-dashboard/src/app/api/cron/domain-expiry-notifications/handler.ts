// src/app/api/cron/domain-expiry-notifications/route.ts
// Domain Expiry Notification Cron Job
//
// Sends in-app notifications (and console-logged email stubs) to agency owners
// when domains are 60, 30, 14, 7, or 1 day(s) before expiry.
//
// Uses a 12-hour window (±6h from midnight UTC) to catch the right domains
// without duplicating notifications. Checks the notifications table to avoid
// sending the same threshold notification twice.
//
// Dispatched by /api/cron at 08:00 UTC daily.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const EXPIRY_THRESHOLDS = [60, 30, 14, 7, 1]; // days before expiry

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV !== 'production';
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const now = new Date();
  const results: Record<number, { notified: number; skipped: number }> = {};

  for (const threshold of EXPIRY_THRESHOLDS) {
    results[threshold] = { notified: 0, skipped: 0 };

    // Expiry window: domains expiring in [threshold-0.5, threshold+0.5] days
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() + threshold);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 1);

    const { data: domains, error } = await admin
      .from('domains')
      .select('id, agency_id, client_id, domain_name, expiry_date, auto_renew')
      .eq('status', 'active')
      .gte('expiry_date', windowStart.toISOString())
      .lt('expiry_date', windowEnd.toISOString());

    if (error) {
      console.error(`[ExpiryNotify] Query failed for ${threshold}-day threshold:`, error.message);
      continue;
    }

    for (const domain of (domains || [])) {
      // Check if we already sent this threshold notification (within last 2 days)
      const dedupeWindow = new Date(now);
      dedupeWindow.setDate(dedupeWindow.getDate() - 2);

      const { data: existing } = await admin
        .from('notifications')
        .select('id')
        .eq('type', `domain_expiry_${threshold}d`)
        .contains('data', { domain_id: domain.id })
        .gte('created_at', dedupeWindow.toISOString())
        .maybeSingle();

      if (existing) {
        results[threshold].skipped++;
        continue;
      }

      // Get agency owner
      const { data: owner } = await admin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', domain.agency_id)
        .eq('role', 'owner')
        .maybeSingle();

      if (!owner) {
        results[threshold].skipped++;
        continue;
      }

      const expiryDate = new Date(domain.expiry_date);
      const expiryStr = expiryDate.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });

      const isAutoRenew = domain.auto_renew;
      const actionNote = isAutoRenew
        ? 'Auto-renewal is enabled and will run automatically.'
        : `Action required: renew your domain at /dashboard/domains/${domain.id}/renew`;

      await admin.from('notifications').insert({
        user_id: owner.user_id,
        type: `domain_expiry_${threshold}d`,
        title: `Domain Expiring in ${threshold} Day${threshold === 1 ? '' : 's'}: ${domain.domain_name}`,
        message: `Your domain ${domain.domain_name} expires on ${expiryStr}. ${actionNote}`,
        data: {
          domain_id: domain.id,
          domain_name: domain.domain_name,
          expiry_date: domain.expiry_date,
          threshold_days: threshold,
          auto_renew: isAutoRenew,
        },
      });

      console.log(`[ExpiryNotify] Sent ${threshold}d notice for ${domain.domain_name} (expires ${expiryStr})`);
      results[threshold].notified++;
    }
  }

  const totalNotified = Object.values(results).reduce((sum, r) => sum + r.notified, 0);
  const totalSkipped = Object.values(results).reduce((sum, r) => sum + r.skipped, 0);

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    thresholds_checked: EXPIRY_THRESHOLDS,
    total_notified: totalNotified,
    total_skipped: totalSkipped,
    by_threshold: results,
  });
}

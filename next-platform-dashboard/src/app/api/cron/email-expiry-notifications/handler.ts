// Email Expiry Notification Cron Job
// Sends in-app notifications when email orders are 60, 30, 14, 7, or 1 day(s) before expiry.
// Dispatched by /api/cron daily.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const EXPIRY_THRESHOLDS = [60, 30, 14, 7, 1];

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

    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() + threshold);
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 1);

    const { data: orders, error } = await admin
      .from('email_orders')
      .select('id, agency_id, domain_name, expiry_date, auto_renew')
      .eq('status', 'Active')
      .gte('expiry_date', windowStart.toISOString())
      .lt('expiry_date', windowEnd.toISOString());

    if (error) continue;

    for (const order of (orders || [])) {
      // Dedupe: check if already sent this threshold within 2 days
      const dedupeWindow = new Date(now);
      dedupeWindow.setDate(dedupeWindow.getDate() - 2);

      const { data: existing } = await admin
        .from('notifications')
        .select('id')
        .eq('type', `email_expiry_${threshold}d`)
        .contains('metadata', { email_order_id: order.id })
        .gte('created_at', dedupeWindow.toISOString())
        .maybeSingle();

      if (existing) { results[threshold].skipped++; continue; }

      const { data: owner } = await admin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', order.agency_id)
        .eq('role', 'owner')
        .maybeSingle();

      if (!owner) { results[threshold].skipped++; continue; }

      const expiryStr = new Date(order.expiry_date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });

      const actionNote = order.auto_renew
        ? 'Auto-renewal is enabled and will run automatically.'
        : 'Please renew your email service to avoid interruption.';

      await admin.from('notifications').insert({
        user_id: owner.user_id,
        type: `email_expiry_${threshold}d`,
        title: `Email Expiring in ${threshold} Day${threshold === 1 ? '' : 's'}: ${order.domain_name}`,
        message: `Business email for ${order.domain_name} expires on ${expiryStr}. ${actionNote}`,
        metadata: {
          email_order_id: order.id,
          domain_name: order.domain_name,
          expiry_date: order.expiry_date,
          threshold_days: threshold,
          auto_renew: order.auto_renew,
        },
      });

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

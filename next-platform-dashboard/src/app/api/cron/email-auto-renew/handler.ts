// Email Auto-Renewal Cron Job
// Finds email orders with auto_renew=true that are within their renewal window,
// calls ResellerClub to renew them, updates expiry, and notifies owners.
// Dispatched by /api/cron daily.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { emailOrderService } from '@/lib/resellerclub/email';
import { isConfigured } from '@/lib/resellerclub/config';

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

  if (!isConfigured()) {
    return NextResponse.json({ skipped: true, reason: 'ResellerClub not configured' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const now = new Date();

  // Look ahead 30 days for expiring email orders
  const lookAheadDate = new Date(now);
  lookAheadDate.setDate(lookAheadDate.getDate() + 30);

  const { data: candidates, error } = await admin
    .from('email_orders')
    .select('id, agency_id, domain_name, expiry_date, resellerclub_order_id, auto_renew, auto_renew_months, product_key, number_of_accounts')
    .eq('auto_renew', true)
    .eq('status', 'Active')
    .not('resellerclub_order_id', 'is', null)
    .lte('expiry_date', lookAheadDate.toISOString())
    .gt('expiry_date', now.toISOString());

  if (error) {
    console.error('[EmailAutoRenew] Failed to query email orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = { renewed: 0, skipped: 0, failed: 0, errors: [] as string[] };
  const RENEW_WINDOW_DAYS = 14; // Renew 14 days before expiry

  for (const order of (candidates || [])) {
    const expiryDate = new Date(order.expiry_date);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry > RENEW_WINDOW_DAYS) {
      results.skipped++;
      continue;
    }

    // Dedupe: check if renewed in last 7 days (prevent double-renew on retry)
    const dedupeWindow = new Date(now);
    dedupeWindow.setDate(dedupeWindow.getDate() - 7);
    const { data: recentLog } = await admin
      .from('notifications')
      .select('id')
      .eq('type', 'email_auto_renewed')
      .contains('metadata', { email_order_id: order.id })
      .gte('created_at', dedupeWindow.toISOString())
      .maybeSingle();

    if (recentLog) {
      results.skipped++;
      continue;
    }

    const months = order.auto_renew_months || 12; // Default to annual renewal

    try {
      await emailOrderService.renewOrder(order.id, months);

      // Find agency owner for notification
      const { data: owner } = await admin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', order.agency_id)
        .eq('role', 'owner')
        .maybeSingle();

      const newExpiry = new Date(expiryDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      if (owner) {
        await admin.from('notifications').insert({
          user_id: owner.user_id,
          type: 'email_auto_renewed',
          title: `Email Auto-Renewed: ${order.domain_name}`,
          message: `Business email for ${order.domain_name} was automatically renewed for ${months} month${months > 1 ? 's' : ''}. New expiry: ${newExpiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          metadata: { email_order_id: order.id, domain_name: order.domain_name, new_expiry: newExpiry.toISOString() },
        });
      }

      results.renewed++;
      console.log(`[EmailAutoRenew] Renewed ${order.domain_name} for ${months} months`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      results.failed++;
      results.errors.push(`${order.domain_name}: ${msg}`);

      // Notify owner of failure
      const { data: owner } = await admin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', order.agency_id)
        .eq('role', 'owner')
        .maybeSingle();

      if (owner) {
        await admin.from('notifications').insert({
          user_id: owner.user_id,
          type: 'email_auto_renew_failed',
          title: `Email Auto-Renewal Failed: ${order.domain_name}`,
          message: `Automatic renewal of email for ${order.domain_name} failed. Please renew manually before ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Error: ${msg}`,
          metadata: { email_order_id: order.id, domain_name: order.domain_name, error: msg },
        });
      }

      console.error(`[EmailAutoRenew] Failed to renew ${order.domain_name}:`, msg);
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    orders_checked: candidates?.length ?? 0,
    ...results,
  });
}

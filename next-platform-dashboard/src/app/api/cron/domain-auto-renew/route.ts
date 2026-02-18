// src/app/api/cron/domain-auto-renew/route.ts
// Auto-Renewal Cron Job
//
// Finds domains with auto_renew=true that are within their renewal window,
// calls the ResellerClub API to renew them, updates expiry, and notifies owners.
//
// Dispatched by /api/cron at 03:00 UTC daily.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { renewalService } from '@/lib/resellerclub/transfers';
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

  // Find all active domains with auto-renew enabled that have a RC order ID
  // We look ahead 30 days and filter by each domain's auto_renew_days_before below
  const lookAheadDate = new Date(now);
  lookAheadDate.setDate(lookAheadDate.getDate() + 30);

  const { data: candidates, error } = await admin
    .from('domains')
    .select('id, agency_id, domain_name, expiry_date, resellerclub_order_id, auto_renew_days_before')
    .eq('auto_renew', true)
    .eq('status', 'active')
    .not('resellerclub_order_id', 'is', null)
    .lte('expiry_date', lookAheadDate.toISOString())
    .gt('expiry_date', now.toISOString()); // not already expired

  if (error) {
    console.error('[AutoRenew] Failed to query domains:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = { renewed: 0, skipped: 0, failed: 0, errors: [] as string[] };

  for (const domain of (candidates || [])) {
    const expiryDate = new Date(domain.expiry_date);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const renewWindow = domain.auto_renew_days_before ?? 14;

    // Only renew if within the renewal window
    if (daysUntilExpiry > renewWindow) {
      results.skipped++;
      continue;
    }

    // Check if already renewed in the last 7 days to avoid double-billing
    const { data: recentRenewal } = await admin
      .from('domain_orders')
      .select('id')
      .eq('domain_id', domain.id)
      .eq('order_type', 'renewal')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (recentRenewal) {
      console.log(`[AutoRenew] Skipping ${domain.domain_name} — renewed in last 7 days`);
      results.skipped++;
      continue;
    }

    try {
      await renewalService.renewDomain(domain.resellerclub_order_id, 1);

      // Extend expiry by 1 year
      const newExpiry = new Date(expiryDate);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      await admin
        .from('domains')
        .update({ expiry_date: newExpiry.toISOString(), updated_at: now.toISOString() })
        .eq('id', domain.id);

      // Record renewal order
      await admin.from('domain_orders').insert({
        agency_id: domain.agency_id,
        domain_id: domain.id,
        order_type: 'renewal',
        domain_name: domain.domain_name,
        years: 1,
        resellerclub_order_id: domain.resellerclub_order_id,
        status: 'completed',
        payment_status: 'paid',
        completed_at: now.toISOString(),
      });

      // Notify agency owner
      const { data: owner } = await admin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', domain.agency_id)
        .eq('role', 'owner')
        .maybeSingle();

      if (owner) {
        await admin.from('notifications').insert({
          user_id: owner.user_id,
          type: 'domain_auto_renewed',
          title: `Domain Auto-Renewed: ${domain.domain_name}`,
          message: `Your domain ${domain.domain_name} was automatically renewed for 1 year. New expiry: ${newExpiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          data: { domain_id: domain.id, domain_name: domain.domain_name, new_expiry: newExpiry.toISOString() },
        });
      }

      console.log(`[AutoRenew] Renewed ${domain.domain_name} → ${newExpiry.toISOString()}`);
      results.renewed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[AutoRenew] Failed to renew ${domain.domain_name}:`, msg);
      results.failed++;
      results.errors.push(`${domain.domain_name}: ${msg}`);

      // Alert owner of failure
      const { data: owner } = await admin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', domain.agency_id)
        .eq('role', 'owner')
        .maybeSingle();

      if (owner) {
        await admin.from('notifications').insert({
          user_id: owner.user_id,
          type: 'domain_auto_renew_failed',
          title: `Auto-Renewal Failed: ${domain.domain_name}`,
          message: `Automatic renewal of ${domain.domain_name} failed. Please renew manually before ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Error: ${msg}`,
          data: { domain_id: domain.id, domain_name: domain.domain_name, error: msg },
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    domains_checked: candidates?.length ?? 0,
    ...results,
  });
}

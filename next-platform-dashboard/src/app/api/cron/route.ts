/**
 * Unified Cron Handler
 *
 * Vercel Hobby plan: 1 cron job maximum, daily frequency only.
 * This single endpoint dispatches ALL daily cron tasks in sequence.
 *
 * Schedule: Daily at midnight UTC (0 0 * * *)
 *
 * Tasks dispatched (all run once per day):
 * - Auto-close stale chats
 * - Chat maintenance
 * - Domain health checks
 * - Domain auto-renewal
 * - Domain expiry notifications
 * - ResellerClub sync + pricing cache
 * - Social media publish queue
 * - Social media sync
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, unknown> = { timestamp: now.toISOString() };
  const errors: string[] = [];
  const baseUrl = getBaseUrl(request);
  const headers: Record<string, string> = cronSecret ? { authorization: `Bearer ${cronSecret}` } : {};

  // Helper to call a sub-route and capture result/error
  async function dispatch(key: string, path: string) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { headers });
      results[key] = await res.json();
    } catch (err) {
      errors.push(`${key}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  // Run all daily tasks
  await dispatch('autoCloseChats',          '/api/cron/auto-close-chats');
  await dispatch('chatMaintenance',          '/api/cron/chat');
  await dispatch('domainHealth',             '/api/cron/domain-health');
  await dispatch('domainAutoRenew',          '/api/cron/domain-auto-renew');
  await dispatch('domainExpiryNotifications','/api/cron/domain-expiry-notifications');
  await dispatch('resellerclubSync',         '/api/cron/resellerclub-sync');
  await dispatch('socialPublish',            '/api/social/publish');
  await dispatch('socialSync',               '/api/social/sync');

  if (errors.length > 0) {
    results.errors = errors;
  }

  return NextResponse.json(results);
}

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL || 'https://dramac.com';
}

/**
 * Unified Cron Handler
 * 
 * Vercel Hobby plan only allows 1 cron job.
 * This single endpoint dispatches to ALL cron tasks based on time-of-day logic.
 * 
 * Schedule: Every hour (0 * * * *)
 * 
 * Tasks dispatched:
 * - Auto-close stale chats (every run)
 * - Chat maintenance (daily at 2 AM)
 * - Domain health checks (daily at midnight)
 * - Social media publish (daily at noon)
 * - Social media sync (daily at 6 AM)
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
  const hour = now.getUTCHours();
  const results: Record<string, unknown> = { timestamp: now.toISOString(), hour };
  const errors: string[] = [];

  // ── Auto-close stale chats (every run) ─────────────────────────────────
  try {
    const baseUrl = getBaseUrl(request);
    const chatCloseRes = await fetch(`${baseUrl}/api/cron/auto-close-chats`, {
      headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
    });
    results.autoCloseChats = await chatCloseRes.json();
  } catch (err) {
    errors.push(`auto-close-chats: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  // ── Chat maintenance (daily at 2 AM UTC) ───────────────────────────────
  if (hour === 2) {
    try {
      const baseUrl = getBaseUrl(request);
      const chatRes = await fetch(`${baseUrl}/api/cron/chat`, {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
      });
      results.chatMaintenance = await chatRes.json();
    } catch (err) {
      errors.push(`chat: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  // ── Domain health checks (daily at midnight UTC) ───────────────────────
  if (hour === 0) {
    try {
      const baseUrl = getBaseUrl(request);
      const domainRes = await fetch(`${baseUrl}/api/cron/domain-health`, {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
      });
      results.domainHealth = await domainRes.json();
    } catch (err) {
      errors.push(`domain-health: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  // ── Social media publish (daily at noon UTC) ───────────────────────────
  if (hour === 12) {
    try {
      const baseUrl = getBaseUrl(request);
      const pubRes = await fetch(`${baseUrl}/api/social/publish`, {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
      });
      results.socialPublish = await pubRes.json();
    } catch (err) {
      errors.push(`social-publish: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  // ── Social media sync (daily at 6 AM UTC) ──────────────────────────────
  if (hour === 6) {
    try {
      const baseUrl = getBaseUrl(request);
      const syncRes = await fetch(`${baseUrl}/api/social/sync`, {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
      });
      results.socialSync = await syncRes.json();
    } catch (err) {
      errors.push(`social-sync: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

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

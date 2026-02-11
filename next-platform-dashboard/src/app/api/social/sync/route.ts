/**
 * Social Analytics Sync Cron Route
 *
 * PHASE-SM-03: Runs every hour via Vercel cron.
 * Iterates all active social accounts and syncs analytics.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all active accounts
  const { data: accounts, error } = await (supabase as any)
    .from('social_accounts')
    .select('id, platform, site_id')
    .eq('status', 'active')

  if (error || !accounts || accounts.length === 0) {
    return NextResponse.json({ synced: 0, message: 'No active accounts' })
  }

  let synced = 0
  let failed = 0
  const errors: string[] = []

  // ---------- Phase SM-03: Analytics Sync ----------
  for (const account of accounts) {
    try {
      // Dynamic import to keep the cron route lean
      const { syncAccountAnalytics } = await import(
        '@/modules/social-media/lib/analytics-sync-service'
      )

      const result = await syncAccountAnalytics(account.id)
      if (result.success) {
        synced++
      } else {
        failed++
        errors.push(`analytics/${account.platform}/${account.id}: ${result.error}`)
      }
    } catch (err: any) {
      failed++
      errors.push(`analytics/${account.platform}/${account.id}: ${err.message?.slice(0, 100)}`)
    }
  }

  // ---------- Phase SM-04: Inbox Sync ----------
  let inboxSynced = 0
  let inboxFailed = 0

  for (const account of accounts) {
    try {
      const { syncAccountInbox } = await import(
        '@/modules/social-media/lib/inbox-sync-service'
      )

      const result = await syncAccountInbox(account.id)
      if (result.newItems >= 0 && result.errors.length === 0) {
        inboxSynced++
      } else if (result.errors.length > 0) {
        inboxFailed++
        errors.push(`inbox/${account.platform}/${account.id}: ${result.errors[0]}`)
      }
    } catch (err: any) {
      inboxFailed++
      errors.push(`inbox/${account.platform}/${account.id}: ${err.message?.slice(0, 100)}`)
    }
  }

  console.log(`[Sync Cron] Analytics: ${synced} synced, ${failed} failed | Inbox: ${inboxSynced} synced, ${inboxFailed} failed`)

  return NextResponse.json({
    analytics: { synced, failed },
    inbox: { synced: inboxSynced, failed: inboxFailed },
    total: accounts.length,
    errors: errors.slice(0, 10),
    timestamp: new Date().toISOString(),
  })
}

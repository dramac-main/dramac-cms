/**
 * Scheduled Post Publisher — Cron Route
 *
 * PHASE-SM-02: Runs every minute via Vercel Cron.
 * Finds posts with status='scheduled' whose scheduled_at ≤ now(),
 * then publishes them.
 *
 * Vercel cron config: /api/social/publish  —  every 1 minute
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishToAccount } from '@/modules/social-media/lib/publish-service'
import type { PublishResult } from '@/modules/social-media/types'

export const maxDuration = 60 // allow up to 60s on Vercel

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Get posts due for publishing
  const { data: duePosts, error } = await (supabase as any)
    .from('social_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(20)

  if (error) {
    console.error('[Cron:Publish] Error fetching due posts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ published: 0 })
  }

  let successCount = 0
  let failCount = 0

  for (const post of duePosts) {
    // Mark as publishing
    await (supabase as any)
      .from('social_posts')
      .update({ status: 'publishing' })
      .eq('id', post.id)

    const targetAccounts: string[] = post.target_accounts || []
    const results: Record<string, any> = {}
    let allSuccess = true
    let anySuccess = false

    for (const accountId of targetAccounts) {
      try {
        const result: PublishResult = await publishToAccount(accountId, {
          content: post.content,
          media: post.media || [],
          platformContent: post.platform_content,
          firstComment: post.first_comment,
        })

        results[accountId] = {
          platformPostId: result.platformPostId || '',
          url: result.postUrl || '',
          status: result.success ? 'success' : 'failed',
          error: result.error,
          publishedAt: new Date().toISOString(),
        }

        if (result.success) {
          anySuccess = true
        } else {
          allSuccess = false
        }

        // Log
        await (supabase as any).from('social_publish_log').insert({
          post_id: post.id,
          account_id: accountId,
          status: result.success ? 'success' : 'failed',
          platform_post_id: result.platformPostId || null,
          platform_url: result.postUrl || null,
          error_message: result.error || null,
          completed_at: new Date().toISOString(),
        })
      } catch (err: any) {
        allSuccess = false
        results[accountId] = {
          status: 'failed',
          error: err.message,
        }
      }
    }

    // Update final status
    const finalStatus = allSuccess
      ? 'published'
      : anySuccess
        ? 'partially_published'
        : 'failed'

    await (supabase as any)
      .from('social_posts')
      .update({
        status: finalStatus,
        published_at: anySuccess ? new Date().toISOString() : null,
        publish_results: results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    if (anySuccess) successCount++
    else failCount++
  }

  return NextResponse.json({
    total: duePosts.length,
    published: successCount,
    failed: failCount,
  })
}

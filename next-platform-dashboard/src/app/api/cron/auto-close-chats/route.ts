// Cron: Auto-close stale chat conversations
// Runs every 5 minutes via Vercel Cron.
// Closes conversations with no activity past each site's configured threshold.
// Vercel Cron config: see vercel.json crons array

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Get all sites with auto-close enabled
    const { data: settings } = await admin
      .from('mod_chat_widget_settings')
      .select('site_id, auto_close_minutes, auto_close_message')
      .eq('auto_close_enabled', true)
      .gt('auto_close_minutes', 0)

    if (!settings || settings.length === 0) {
      return NextResponse.json({ closed: 0, message: 'No sites with auto-close enabled' })
    }

    let totalClosed = 0

    for (const site of settings) {
      const cutoffTime = new Date(Date.now() - site.auto_close_minutes * 60 * 1000).toISOString()

      // Find stale active conversations
      const { data: staleConvos } = await admin
        .from('mod_chat_conversations')
        .select('id')
        .eq('site_id', site.site_id)
        .eq('status', 'active')
        .lt('updated_at', cutoffTime)

      if (!staleConvos || staleConvos.length === 0) continue

      const staleIds = staleConvos.map((c: { id: string }) => c.id)

      // Verify no recent messages
      const conversationsToClose: string[] = []
      for (const convId of staleIds) {
        const { data: recentMsg } = await admin
          .from('mod_chat_messages')
          .select('id')
          .eq('conversation_id', convId)
          .gte('created_at', cutoffTime)
          .limit(1)

        if (!recentMsg || recentMsg.length === 0) {
          conversationsToClose.push(convId)
        }
      }

      if (conversationsToClose.length === 0) continue

      // Close them
      await admin
        .from('mod_chat_conversations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in('id', conversationsToClose)

      // Insert system close message
      const systemMessages = conversationsToClose.map((convId) => ({
        conversation_id: convId,
        site_id: site.site_id,
        sender_type: 'system',
        content: site.auto_close_message || 'This conversation was automatically closed due to inactivity. Feel free to start a new chat anytime!',
        content_type: 'text',
        is_internal_note: false,
      }))

      await admin.from('mod_chat_messages').insert(systemMessages)

      totalClosed += conversationsToClose.length
    }

    return NextResponse.json({
      closed: totalClosed,
      message: `Auto-closed ${totalClosed} stale conversations`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Auto-close error:', error)
    return NextResponse.json(
      { error: 'Failed to run auto-close' },
      { status: 500 }
    )
  }
}

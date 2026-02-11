/**
 * Social Media Platform Webhook Handler
 *
 * PHASE SM-04: Receives real-time notifications from platforms.
 * - Facebook/Instagram: Webhooks for comments, messages
 * - Twitter: Account Activity API
 * - YouTube: Push notifications via PubSubHubbub
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSentiment, determinePriority } from '@/modules/social-media/lib/sentiment-analysis'
import type { InboxItemType } from '@/modules/social-media/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ============================================================================
// GET — Webhook Verification
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params
  const url = new URL(request.url)

  switch (platform) {
    case 'facebook':
    case 'instagram': {
      // Meta webhook verification
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 })
      }
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }

    case 'twitter': {
      // Twitter CRC challenge
      const crcToken = url.searchParams.get('crc_token')
      if (!crcToken || !process.env.TWITTER_API_SECRET) {
        return NextResponse.json({ error: 'Missing CRC token' }, { status: 400 })
      }

      // Generate CRC response using HMAC-SHA256
      const crypto = await import('crypto')
      const hmac = crypto.createHmac('sha256', process.env.TWITTER_API_SECRET)
      hmac.update(crcToken)
      const responseToken = `sha256=${hmac.digest('base64')}`

      return NextResponse.json({ response_token: responseToken })
    }

    default:
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
  }
}

// ============================================================================
// POST — Webhook Events
// ============================================================================

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params

  try {
    switch (platform) {
      case 'facebook':
      case 'instagram':
        return await handleMetaWebhook(request, platform)
      case 'twitter':
        return await handleTwitterWebhook(request)
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }
  } catch (err: any) {
    console.error(`[Webhook] ${platform} error:`, err.message)
    // Always return 200 to prevent webhook retries
    return NextResponse.json({ received: true })
  }
}

// ============================================================================
// META (Facebook / Instagram) WEBHOOK
// ============================================================================

async function handleMetaWebhook(request: Request, platform: string) {
  // Verify signature
  const signature = request.headers.get('x-hub-signature-256')
  const body = await request.text()

  if (process.env.META_APP_SECRET && signature) {
    const crypto = await import('crypto')
    const expectedSig = `sha256=${crypto
      .createHmac('sha256', process.env.META_APP_SECRET)
      .update(body)
      .digest('hex')}`

    if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }
  }

  const payload = JSON.parse(body)
  const supabase = await createClient()

  if (payload.entry) {
    for (const entry of payload.entry) {
      // Process changes (comments, messages)
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'feed' && change.value) {
            await processMetaFeedChange(supabase, entry.id, change.value)
          }
          if (change.field === 'messages' && change.value) {
            await processMetaMessage(supabase, entry.id, change.value)
          }
        }
      }

      // Process messaging (Instagram DMs)
      if (entry.messaging) {
        for (const msg of entry.messaging) {
          await processMetaMessage(supabase, entry.id, msg)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}

async function processMetaFeedChange(supabase: any, pageId: string, value: any) {
  if (value.item !== 'comment' || !value.comment_id) return

  // Find the account by platform_account_id
  const { data: account } = await (supabase as any)
    .from('social_accounts')
    .select('id, site_id, tenant_id')
    .eq('platform_account_id', pageId)
    .single()

  if (!account) return

  const sentimentResult = analyzeSentiment(value.message || '')
  const priority = determinePriority({
    content: value.message || '',
    sentiment: sentimentResult,
    authorFollowers: null,
    itemType: 'comment',
  })

  await (supabase as any)
    .from('social_inbox_items')
    .upsert({
      account_id: account.id,
      site_id: account.site_id,
      tenant_id: account.tenant_id,
      platform_item_id: value.comment_id,
      platform_parent_id: value.post_id || null,
      item_type: 'comment' as InboxItemType,
      content: value.message,
      author_id: value.from?.id,
      author_name: value.from?.name,
      sentiment: sentimentResult.sentiment,
      sentiment_score: sentimentResult.score,
      priority,
      platform_created_at: value.created_time ? new Date(value.created_time * 1000).toISOString() : new Date().toISOString(),
      status: 'new',
      tags: [],
    }, { onConflict: 'platform_item_id,account_id' })
}

async function processMetaMessage(supabase: any, pageId: string, value: any) {
  const { data: account } = await (supabase as any)
    .from('social_accounts')
    .select('id, site_id, tenant_id')
    .eq('platform_account_id', pageId)
    .single()

  if (!account) return

  const messageText = value.message?.text || value.message || ''
  const sentimentResult = analyzeSentiment(messageText)
  const priority = determinePriority({
    content: messageText,
    sentiment: sentimentResult,
    authorFollowers: null,
    itemType: 'dm',
  })

  const platformItemId = value.mid || value.message_id || `meta-msg-${Date.now()}`

  await (supabase as any)
    .from('social_inbox_items')
    .upsert({
      account_id: account.id,
      site_id: account.site_id,
      tenant_id: account.tenant_id,
      platform_item_id: platformItemId,
      item_type: 'dm' as InboxItemType,
      content: messageText,
      author_id: value.sender?.id,
      author_name: value.sender?.name,
      sentiment: sentimentResult.sentiment,
      sentiment_score: sentimentResult.score,
      priority,
      platform_created_at: value.timestamp ? new Date(value.timestamp * 1000).toISOString() : new Date().toISOString(),
      status: 'new',
      tags: [],
    }, { onConflict: 'platform_item_id,account_id' })
}

// ============================================================================
// TWITTER WEBHOOK
// ============================================================================

async function handleTwitterWebhook(request: Request) {
  const body = await request.json()
  const supabase = await createClient()

  // Process tweet create events (mentions)
  if (body.tweet_create_events) {
    for (const tweet of body.tweet_create_events) {
      const forUserId = body.for_user_id

      const { data: account } = await (supabase as any)
        .from('social_accounts')
        .select('id, site_id, tenant_id')
        .eq('platform_account_id', forUserId)
        .single()

      if (!account) continue

      const sentimentResult = analyzeSentiment(tweet.text || '')
      const priority = determinePriority({
        content: tweet.text || '',
        sentiment: sentimentResult,
        authorFollowers: tweet.user?.followers_count ?? null,
        itemType: 'mention',
      })

      await (supabase as any)
        .from('social_inbox_items')
        .upsert({
          account_id: account.id,
          site_id: account.site_id,
          tenant_id: account.tenant_id,
          platform_item_id: tweet.id_str,
          item_type: 'mention' as InboxItemType,
          content: tweet.text,
          author_id: tweet.user?.id_str,
          author_name: tweet.user?.name,
          author_handle: tweet.user?.screen_name,
          author_avatar: tweet.user?.profile_image_url_https,
          author_followers: tweet.user?.followers_count ?? null,
          sentiment: sentimentResult.sentiment,
          sentiment_score: sentimentResult.score,
          priority,
          platform_created_at: tweet.created_at ? new Date(tweet.created_at).toISOString() : new Date().toISOString(),
          status: 'new',
          tags: [],
        }, { onConflict: 'platform_item_id,account_id' })
    }
  }

  return NextResponse.json({ received: true })
}

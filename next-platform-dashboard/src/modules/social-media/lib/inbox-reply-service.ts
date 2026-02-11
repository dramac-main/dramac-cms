'use server'

/**
 * Inbox Reply Service
 *
 * PHASE SM-04: Sends replies through platform APIs
 * when users respond to inbox items.
 */

import { platformFetch } from './token-refresh'
import {
  metaGraphRequest,
  twitterRequest,
  linkedinRequest,
  youtubeRequest,
  threadsRequest,
} from './platform-api'
import type { SocialPlatform } from '../types'

// ============================================================================
// MAIN REPLY ROUTER
// ============================================================================

/**
 * Send a reply to an inbox item on the platform
 */
export async function sendPlatformReply(params: {
  accountId: string
  platform: SocialPlatform
  platformItemId: string
  platformParentId?: string | null
  content: string
  itemType: string
}): Promise<{ success: boolean; replyId?: string; error?: string }> {
  const { accountId, platform, platformItemId, platformParentId, content, itemType } = params

  try {
    switch (platform) {
      case 'facebook':
        return await replyOnFacebook(accountId, platformItemId, content, itemType)
      case 'instagram':
        return await replyOnInstagram(accountId, platformItemId, content, itemType)
      case 'twitter':
        return await replyOnTwitter(accountId, platformItemId, content)
      case 'linkedin':
        return await replyOnLinkedin(accountId, platformItemId, content, platformParentId)
      case 'bluesky':
        return await replyOnBluesky(accountId, platformItemId, content)
      case 'mastodon':
        return await replyOnMastodon(accountId, platformItemId, content)
      case 'youtube':
        return await replyOnYoutube(accountId, platformItemId, content, platformParentId)
      case 'threads':
        return await replyOnThreads(accountId, platformItemId, content)
      case 'tiktok':
        return await replyOnTiktok(accountId, platformItemId, content, platformParentId)
      case 'pinterest':
        return { success: false, error: 'Pinterest does not support reply API' }
      default:
        return { success: false, error: `Unsupported platform: ${platform}` }
    }
  } catch (err: any) {
    return { success: false, error: err.message?.slice(0, 300) }
  }
}

// ============================================================================
// PLATFORM-SPECIFIC REPLY FUNCTIONS
// ============================================================================

/**
 * Reply to a Facebook comment or DM
 */
async function replyOnFacebook(
  accountId: string,
  platformItemId: string,
  content: string,
  itemType: string,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    if (itemType === 'dm') {
      // Reply to a conversation message
      const data = await metaGraphRequest(
        accountId,
        `/${platformItemId}/messages`,
        undefined,
        'POST',
        { message: content },
      )
      return { success: true, replyId: data?.id }
    } else {
      // Reply to a comment
      const data = await metaGraphRequest(
        accountId,
        `/${platformItemId}/comments`,
        undefined,
        'POST',
        { message: content },
      )
      return { success: true, replyId: data?.id }
    }
  } catch (err: any) {
    return { success: false, error: `Facebook reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply to an Instagram comment
 */
async function replyOnInstagram(
  accountId: string,
  platformItemId: string,
  content: string,
  itemType: string,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    if (itemType === 'dm') {
      // Instagram DM API is limited, requires Instagram Messaging API
      return { success: false, error: 'Instagram DM replies require Messaging API access' }
    }

    // Reply to a comment
    const data = await metaGraphRequest(
      accountId,
      `/${platformItemId}/replies`,
      undefined,
      'POST',
      { message: content },
    )
    return { success: true, replyId: data?.id }
  } catch (err: any) {
    return { success: false, error: `Instagram reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply on Twitter
 */
async function replyOnTwitter(
  accountId: string,
  platformItemId: string,
  content: string,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const data = await twitterRequest(
      accountId,
      '/tweets',
      'POST',
      {
        text: content,
        reply: { in_reply_to_tweet_id: platformItemId },
      },
    )
    return { success: true, replyId: data?.data?.id }
  } catch (err: any) {
    return { success: false, error: `Twitter reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply on LinkedIn
 */
async function replyOnLinkedin(
  accountId: string,
  platformItemId: string,
  content: string,
  platformParentId?: string | null,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const activityUrn = platformParentId || platformItemId
    const data = await linkedinRequest(
      accountId,
      `/socialActions/${encodeURIComponent(activityUrn)}/comments`,
      'POST',
      {
        message: { text: content },
        parentComment: platformParentId ? platformItemId : undefined,
      },
    )
    return { success: true, replyId: data?.id || data?.['$URN'] }
  } catch (err: any) {
    return { success: false, error: `LinkedIn reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply on Bluesky
 */
async function replyOnBluesky(
  accountId: string,
  platformItemId: string,
  content: string,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    // Parse the AT Protocol URI to get repo and CID
    // platformItemId is the URI: at://did:plc:xxx/app.bsky.feed.post/xxx
    const parts = platformItemId.split('/')
    const repo = parts[2] // did:plc:xxx
    const collection = parts.slice(3, -1).join('/') // app.bsky.feed.post
    const rkey = parts[parts.length - 1]

    // Get the post thread to get CID for reply reference
    const threadRes = await platformFetch(
      accountId,
      `https://bsky.social/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(platformItemId)}&depth=0`,
    )

    if (!threadRes.ok) {
      return { success: false, error: 'Could not fetch parent post for reply' }
    }

    const threadData = await threadRes.json()
    const parentCid = threadData?.thread?.post?.cid
    const parentUri = threadData?.thread?.post?.uri

    if (!parentCid || !parentUri) {
      return { success: false, error: 'Could not resolve parent post CID' }
    }

    // Determine root (for thread replies)
    const root = threadData?.thread?.post?.record?.reply?.root || { uri: parentUri, cid: parentCid }

    // Get the authenticated user's DID
    const sessionRes = await platformFetch(
      accountId,
      'https://bsky.social/xrpc/com.atproto.server.getSession',
    )
    if (!sessionRes.ok) {
      return { success: false, error: 'Could not get Bluesky session' }
    }
    const session = await sessionRes.json()

    // Create reply post
    const createRes = await platformFetch(
      accountId,
      'https://bsky.social/xrpc/com.atproto.repo.createRecord',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: session.did,
          collection: 'app.bsky.feed.post',
          record: {
            $type: 'app.bsky.feed.post',
            text: content,
            reply: {
              root: { uri: root.uri, cid: root.cid },
              parent: { uri: parentUri, cid: parentCid },
            },
            createdAt: new Date().toISOString(),
          },
        }),
      },
    )

    if (!createRes.ok) {
      const errText = await createRes.text()
      return { success: false, error: `Bluesky reply failed: ${errText.slice(0, 200)}` }
    }

    const result = await createRes.json()
    return { success: true, replyId: result?.uri }
  } catch (err: any) {
    return { success: false, error: `Bluesky reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply on Mastodon
 */
async function replyOnMastodon(
  accountId: string,
  platformItemId: string,
  content: string,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    // Get instance URL from account settings
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: account } = await (supabase as any)
      .from('social_accounts')
      .select('settings')
      .eq('id', accountId)
      .single()

    const instanceUrl = account?.settings?.instanceUrl || 'https://mastodon.social'

    const res = await platformFetch(
      accountId,
      `${instanceUrl}/api/v1/statuses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: content,
          in_reply_to_id: platformItemId,
        }),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `Mastodon reply failed: ${errText.slice(0, 200)}` }
    }

    const data = await res.json()
    return { success: true, replyId: data?.id }
  } catch (err: any) {
    return { success: false, error: `Mastodon reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply on YouTube (comment reply)
 */
async function replyOnYoutube(
  accountId: string,
  platformItemId: string,
  content: string,
  platformParentId?: string | null,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const data = await youtubeRequest(
      accountId,
      '/comments',
      { part: 'snippet' },
      'POST',
      {
        snippet: {
          parentId: platformItemId,
          textOriginal: content,
        },
      },
    )
    return { success: true, replyId: data?.id }
  } catch (err: any) {
    return { success: false, error: `YouTube reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply on Threads
 */
async function replyOnThreads(
  accountId: string,
  platformItemId: string,
  content: string,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const data = await threadsRequest(
      accountId,
      `/${platformItemId}/replies`,
      'POST',
      { text: content },
    )
    return { success: true, replyId: data?.id }
  } catch (err: any) {
    return { success: false, error: `Threads reply failed: ${err.message?.slice(0, 200)}` }
  }
}

/**
 * Reply on TikTok (limited comment reply)
 */
async function replyOnTiktok(
  accountId: string,
  platformItemId: string,
  content: string,
  platformParentId?: string | null,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    if (!platformParentId) {
      return { success: false, error: 'TikTok replies require a parent video ID' }
    }

    const res = await platformFetch(
      accountId,
      'https://open.tiktokapis.com/v2/comment/reply/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: platformParentId,
          comment_id: platformItemId,
          text: content,
        }),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: `TikTok reply failed: ${errText.slice(0, 200)}` }
    }

    const data = await res.json()
    return { success: true, replyId: data?.data?.comment_id }
  } catch (err: any) {
    return { success: false, error: `TikTok reply failed: ${err.message?.slice(0, 200)}` }
  }
}

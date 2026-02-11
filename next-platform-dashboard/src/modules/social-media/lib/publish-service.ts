/**
 * Publishing Service
 *
 * PHASE-SM-02: Real platform-specific publishing.
 * Dispatches posts to each social platform's API.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { ensureValidToken } from './token-refresh'
import type { SocialPlatform, PostMedia, PublishResult } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface PublishPayload {
  content: string
  media?: PostMedia[]
  platformContent?: Record<string, { content: string; media?: PostMedia[] }>
  firstComment?: string
  threadContent?: string[]
}

// ============================================================================
// MAIN DISPATCHER
// ============================================================================

/**
 * Publish a post to a specific account's platform.
 * Returns a PublishResult with the platform post ID and URL.
 */
export async function publishToAccount(
  accountId: string,
  payload: PublishPayload,
): Promise<PublishResult> {
  const supabase = await createClient()

  // Get account
  const { data: account, error } = await (supabase as any)
    .from('social_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !account) {
    return {
      accountId,
      platform: 'facebook' as SocialPlatform,
      success: false,
      error: 'Account not found',
    }
  }

  const platform = account.platform as SocialPlatform
  const token = await ensureValidToken(accountId)

  if (!token) {
    return {
      accountId,
      platform,
      success: false,
      error: 'Unable to obtain valid access token',
    }
  }

  // Use platform-specific content if provided
  const content =
    payload.platformContent?.[platform]?.content || payload.content
  const media =
    payload.platformContent?.[platform]?.media || payload.media || []

  try {
    switch (platform) {
      case 'facebook':
        return await publishToFacebook(accountId, account, token, content, media)
      case 'instagram':
        return await publishToInstagram(accountId, account, token, content, media)
      case 'twitter':
        return await publishToTwitter(accountId, account, token, content, media, payload.threadContent)
      case 'linkedin':
        return await publishToLinkedin(accountId, account, token, content, media)
      case 'tiktok':
        return await publishToTiktok(accountId, account, token, content, media)
      case 'pinterest':
        return await publishToPinterest(accountId, account, token, content, media)
      case 'youtube':
        return await publishToYoutube(accountId, account, token, content, media)
      case 'threads':
        return await publishToThreads(accountId, account, token, content, media)
      case 'bluesky':
        return await publishToBluesky(accountId, account, content, media)
      case 'mastodon':
        return await publishToMastodon(accountId, account, token, content, media)
      default:
        return { accountId, platform, success: false, error: `Unsupported platform: ${platform}` }
    }
  } catch (err: any) {
    return {
      accountId,
      platform,
      success: false,
      error: err.message?.slice(0, 300) || 'Unknown publishing error',
    }
  }
}

// ============================================================================
// FACEBOOK
// ============================================================================

async function publishToFacebook(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const pageId = account.platform_account_id
  const platform = 'facebook' as SocialPlatform

  if (media.length > 0 && media[0].type === 'image') {
    // Photo post
    const photoRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: media[0].url,
          message: content,
          access_token: token,
        }),
      },
    )
    const photo = await photoRes.json()
    if (photo.error) throw new Error(photo.error.message)

    return {
      accountId,
      platform,
      success: true,
      platformPostId: photo.id,
      postUrl: `https://facebook.com/${photo.id}`,
    }
  }

  // Text post
  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, access_token: token }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  return {
    accountId,
    platform,
    success: true,
    platformPostId: data.id,
    postUrl: `https://facebook.com/${data.id}`,
  }
}

// ============================================================================
// INSTAGRAM
// ============================================================================

async function publishToInstagram(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const igId = account.platform_account_id
  const platform = 'instagram' as SocialPlatform

  if (media.length === 0) {
    return { accountId, platform, success: false, error: 'Instagram requires at least one image or video' }
  }

  if (media.length === 1) {
    // Single media container
    const containerType = media[0].type === 'video' ? 'VIDEO' : 'IMAGE'
    const containerBody: any = {
      caption: content,
      access_token: token,
    }
    if (containerType === 'VIDEO') {
      containerBody.video_url = media[0].url
      containerBody.media_type = 'VIDEO'
    } else {
      containerBody.image_url = media[0].url
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${igId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody),
      },
    )
    const container = await containerRes.json()
    if (container.error) throw new Error(container.error.message)

    // Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: token,
        }),
      },
    )
    const published = await publishRes.json()
    if (published.error) throw new Error(published.error.message)

    return {
      accountId,
      platform,
      success: true,
      platformPostId: published.id,
      postUrl: `https://instagram.com/p/${published.id}`,
    }
  }

  // Carousel — create children first
  const childIds: string[] = []
  for (const m of media.slice(0, 10)) {
    const childBody: any = {
      is_carousel_item: true,
      access_token: token,
    }
    if (m.type === 'video') {
      childBody.video_url = m.url
      childBody.media_type = 'VIDEO'
    } else {
      childBody.image_url = m.url
    }

    const childRes = await fetch(
      `https://graph.facebook.com/v21.0/${igId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(childBody),
      },
    )
    const child = await childRes.json()
    if (child.error) throw new Error(child.error.message)
    childIds.push(child.id)
  }

  // Create carousel container
  const carouselRes = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        caption: content,
        children: childIds,
        access_token: token,
      }),
    },
  )
  const carousel = await carouselRes.json()
  if (carousel.error) throw new Error(carousel.error.message)

  const pubRes = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: carousel.id, access_token: token }),
    },
  )
  const pub = await pubRes.json()
  if (pub.error) throw new Error(pub.error.message)

  return {
    accountId,
    platform,
    success: true,
    platformPostId: pub.id,
    postUrl: `https://instagram.com/p/${pub.id}`,
  }
}

// ============================================================================
// TWITTER
// ============================================================================

async function publishToTwitter(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
  threadContent?: string[],
): Promise<PublishResult> {
  const platform = 'twitter' as SocialPlatform
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Single tweet
  const tweetBody: any = { text: content }

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers,
    body: JSON.stringify(tweetBody),
  })
  const data = await res.json()
  if (data.errors) throw new Error(data.errors[0]?.message || 'Tweet failed')

  const tweetId = data.data?.id
  return {
    accountId,
    platform,
    success: true,
    platformPostId: tweetId,
    postUrl: `https://x.com/i/status/${tweetId}`,
  }
}

// ============================================================================
// LINKEDIN
// ============================================================================

async function publishToLinkedin(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const platform = 'linkedin' as SocialPlatform
  const authorUrn = `urn:li:person:${account.platform_account_id}`

  const postBody: any = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: media.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 300))

  const postId = data.id || (res.headers.get('x-restli-id') || `li_${Date.now()}`)
  return {
    accountId,
    platform,
    success: true,
    platformPostId: postId,
    postUrl: `https://linkedin.com/feed/update/${postId}`,
  }
}

// ============================================================================
// TIKTOK
// ============================================================================

async function publishToTiktok(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const platform = 'tiktok' as SocialPlatform

  if (media.length === 0 || media[0].type !== 'video') {
    return { accountId, platform, success: false, error: 'TikTok requires a video to publish' }
  }

  // Init upload
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: content.slice(0, 150),
        privacy_level: 'SELF_ONLY', // Start with SELF_ONLY for safety
        disable_comment: false,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: media[0].url,
      },
    }),
  })
  const initData = await initRes.json()
  if (initData.error?.code) throw new Error(initData.error.message || 'TikTok upload init failed')

  return {
    accountId,
    platform,
    success: true,
    platformPostId: initData.data?.publish_id || `tt_${Date.now()}`,
  }
}

// ============================================================================
// PINTEREST
// ============================================================================

async function publishToPinterest(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const platform = 'pinterest' as SocialPlatform

  if (media.length === 0) {
    return { accountId, platform, success: false, error: 'Pinterest requires an image' }
  }

  const res = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: content.slice(0, 100),
      description: content,
      media_source: {
        source_type: 'image_url',
        url: media[0].url,
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 300))

  return {
    accountId,
    platform,
    success: true,
    platformPostId: data.id,
    postUrl: `https://pinterest.com/pin/${data.id}`,
  }
}

// ============================================================================
// YOUTUBE (community post — video upload requires multipart)
// ============================================================================

async function publishToYoutube(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const platform = 'youtube' as SocialPlatform

  // For now support text-based community posts (video upload is complex)
  // Return a descriptive result
  return {
    accountId,
    platform,
    success: false,
    error: 'YouTube video upload requires multipart upload — use YouTube Studio directly for now',
  }
}

// ============================================================================
// THREADS
// ============================================================================

async function publishToThreads(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const platform = 'threads' as SocialPlatform
  const userId = account.platform_account_id

  const containerBody: any = {
    text: content,
    media_type: 'TEXT',
    access_token: token,
  }

  if (media.length > 0 && media[0].type === 'image') {
    containerBody.media_type = 'IMAGE'
    containerBody.image_url = media[0].url
  } else if (media.length > 0 && media[0].type === 'video') {
    containerBody.media_type = 'VIDEO'
    containerBody.video_url = media[0].url
  }

  const containerRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    },
  )
  const container = await containerRes.json()
  if (container.error) throw new Error(container.error.message)

  // Publish
  const publishRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    },
  )
  const pub = await publishRes.json()
  if (pub.error) throw new Error(pub.error.message)

  return {
    accountId,
    platform,
    success: true,
    platformPostId: pub.id,
    postUrl: `https://threads.net/post/${pub.id}`,
  }
}

// ============================================================================
// BLUESKY
// ============================================================================

async function publishToBluesky(
  accountId: string,
  account: any,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const platform = 'bluesky' as SocialPlatform

  // Re-authenticate to get fresh session
  const sessionRes = await fetch(
    'https://bsky.social/xrpc/com.atproto.server.refreshSession',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${account.refresh_token}` },
    },
  )

  let accessJwt = account.access_token
  if (sessionRes.ok) {
    const session = await sessionRes.json()
    accessJwt = session.accessJwt
  }

  const record: any = {
    $type: 'app.bsky.feed.post',
    text: content,
    createdAt: new Date().toISOString(),
  }

  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: account.platform_account_id,
      collection: 'app.bsky.feed.post',
      record,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 300))

  const rkey = data.uri?.split('/').pop() || ''
  return {
    accountId,
    platform,
    success: true,
    platformPostId: data.uri,
    postUrl: `https://bsky.app/profile/${account.account_handle}/post/${rkey}`,
  }
}

// ============================================================================
// MASTODON
// ============================================================================

async function publishToMastodon(
  accountId: string,
  account: any,
  token: string,
  content: string,
  media: PostMedia[],
): Promise<PublishResult> {
  const platform = 'mastodon' as SocialPlatform
  const instanceUrl = account.account_url
    ? new URL(account.account_url).origin
    : 'https://mastodon.social'

  const statusBody: any = { status: content }

  const res = await fetch(`${instanceUrl}/api/v1/statuses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statusBody),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data).slice(0, 300))

  return {
    accountId,
    platform,
    success: true,
    platformPostId: data.id,
    postUrl: data.url || data.uri,
  }
}

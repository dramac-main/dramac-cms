'use server'

/**
 * Inbox Sync Service
 *
 * PHASE SM-04: Fetches comments, DMs, mentions from platform APIs
 * and writes them to the social_inbox_items table.
 */

import { createClient } from '@/lib/supabase/server'
import { platformFetch } from './token-refresh'
import {
  metaGraphRequest,
  twitterRequest,
  linkedinRequest,
  youtubeRequest,
  threadsRequest,
} from './platform-api'
import { analyzeSentiment, determinePriority } from './sentiment-analysis'
import type { SocialPlatform, InboxItemType } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface InboxSyncResult {
  newItems: number
  errors: string[]
}

interface NormalizedInboxItem {
  account_id: string
  site_id: string
  tenant_id: string
  platform_item_id: string
  platform_parent_id: string | null
  related_post_id: string | null
  item_type: InboxItemType
  content: string | null
  media_url: string | null
  author_id: string | null
  author_name: string | null
  author_handle: string | null
  author_avatar: string | null
  author_followers: number | null
  author_verified: boolean
  sentiment: 'positive' | 'neutral' | 'negative' | null
  sentiment_score: number | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  platform_created_at: string
  status: 'new'
  tags: string[]
}

// ============================================================================
// MAIN SYNC
// ============================================================================

/**
 * Sync inbox items for a single account
 * Fetches latest comments, DMs, and mentions since last sync
 */
export async function syncAccountInbox(accountId: string): Promise<InboxSyncResult> {
  const supabase = await createClient()

  // 1. Fetch account info
  const { data: account, error: accountError } = await (supabase as any)
    .from('social_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (accountError || !account) {
    return { newItems: 0, errors: [`Account not found: ${accountId}`] }
  }

  if (account.status !== 'active') {
    return { newItems: 0, errors: [`Account ${accountId} is not active (status: ${account.status})`] }
  }

  // 2. Determine "since" timestamp (last sync or 24h ago for first sync)
  const lastSynced = account.last_synced_at
    ? new Date(account.last_synced_at).toISOString()
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const platform = account.platform as SocialPlatform
  const platformAccountId = account.platform_account_id as string

  // 3. Route to platform-specific fetcher
  let rawItems: NormalizedInboxItem[] = []
  const errors: string[] = []

  try {
    switch (platform) {
      case 'facebook':
        rawItems = await syncFacebookInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'instagram':
        rawItems = await syncInstagramInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'twitter':
        rawItems = await syncTwitterInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'linkedin':
        rawItems = await syncLinkedinInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'bluesky':
        rawItems = await syncBlueskyInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'mastodon':
        rawItems = await syncMastodonInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'youtube':
        rawItems = await syncYoutubeInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'tiktok':
        rawItems = await syncTiktokInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'threads':
        rawItems = await syncThreadsInbox(accountId, platformAccountId, account.site_id, account.tenant_id, lastSynced)
        break
      case 'pinterest':
        // Pinterest has no real inbox API
        rawItems = []
        break
      default:
        errors.push(`Unsupported platform: ${platform}`)
    }
  } catch (err: any) {
    errors.push(`${platform} sync error: ${err.message?.slice(0, 200)}`)
  }

  // 4. Insert new items (skip existing by platform_item_id)
  let newItems = 0

  for (const item of rawItems) {
    try {
      // Check if already exists
      const { data: existing } = await (supabase as any)
        .from('social_inbox_items')
        .select('id')
        .eq('platform_item_id', item.platform_item_id)
        .eq('account_id', item.account_id)
        .maybeSingle()

      if (existing) continue

      // Apply sentiment analysis
      const sentimentResult = analyzeSentiment(item.content || '')
      item.sentiment = sentimentResult.sentiment
      item.sentiment_score = sentimentResult.score

      // Determine priority
      item.priority = determinePriority({
        content: item.content || '',
        sentiment: sentimentResult,
        authorFollowers: item.author_followers,
        itemType: item.item_type,
      })

      const { error: insertError } = await (supabase as any)
        .from('social_inbox_items')
        .insert(item)

      if (insertError) {
        errors.push(`Insert error: ${insertError.message?.slice(0, 100)}`)
      } else {
        newItems++
      }
    } catch (err: any) {
      errors.push(`Item insert error: ${err.message?.slice(0, 100)}`)
    }
  }

  // 5. Update account's last sync timestamp
  await (supabase as any)
    .from('social_accounts')
    .update({
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)

  return { newItems, errors }
}

// ============================================================================
// PLATFORM-SPECIFIC SYNC FUNCTIONS
// ============================================================================

/**
 * Facebook inbox sync — page comments, conversations, mentions
 */
async function syncFacebookInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []
  const sinceUnix = Math.floor(new Date(since).getTime() / 1000)

  try {
    // 1. Page post comments
    const feedData = await metaGraphRequest(
      accountId,
      `/${platformAccountId}/feed`,
      { fields: 'id,comments{from,message,created_time,id}', since: sinceUnix.toString(), limit: '25' },
    )

    if (feedData?.data) {
      for (const post of feedData.data) {
        if (post.comments?.data) {
          for (const comment of post.comments.data) {
            items.push(buildNormalizedItem({
              accountId, siteId, tenantId,
              platformItemId: comment.id,
              platformParentId: post.id,
              itemType: 'comment',
              content: comment.message,
              authorId: comment.from?.id,
              authorName: comment.from?.name,
              platformCreatedAt: comment.created_time,
            }))
          }
        }
      }
    }

    // 2. Page conversations (DMs)
    try {
      const conversationsData = await metaGraphRequest(
        accountId,
        `/${platformAccountId}/conversations`,
        { fields: 'messages{from,message,created_time,id}', limit: '25' },
      )

      if (conversationsData?.data) {
        for (const conv of conversationsData.data) {
          if (conv.messages?.data) {
            for (const msg of conv.messages.data) {
              // Skip messages from the page itself
              if (msg.from?.id === platformAccountId) continue
              const createdAt = new Date(msg.created_time)
              if (createdAt < new Date(since)) continue

              items.push(buildNormalizedItem({
                accountId, siteId, tenantId,
                platformItemId: msg.id,
                platformParentId: conv.id,
                itemType: 'dm',
                content: msg.message,
                authorId: msg.from?.id,
                authorName: msg.from?.name,
                platformCreatedAt: msg.created_time,
              }))
            }
          }
        }
      }
    } catch {
      // DM access may require additional permissions
    }
  } catch (err: any) {
    console.error('[InboxSync] Facebook sync error:', err.message)
  }

  return items
}

/**
 * Instagram inbox sync — media comments, mentions
 */
async function syncInstagramInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    // 1. Media comments
    const mediaData = await metaGraphRequest(
      accountId,
      `/${platformAccountId}/media`,
      { fields: 'id,comments{from,text,timestamp,id,username}', limit: '25' },
    )

    if (mediaData?.data) {
      for (const media of mediaData.data) {
        if (media.comments?.data) {
          for (const comment of media.comments.data) {
            const createdAt = new Date(comment.timestamp)
            if (createdAt < new Date(since)) continue

            items.push(buildNormalizedItem({
              accountId, siteId, tenantId,
              platformItemId: comment.id,
              platformParentId: media.id,
              itemType: 'comment',
              content: comment.text,
              authorId: comment.from?.id,
              authorName: comment.from?.username || comment.username,
              authorHandle: comment.username,
              platformCreatedAt: comment.timestamp,
            }))
          }
        }
      }
    }

    // 2. Mentions via tagged media
    try {
      const taggedData = await metaGraphRequest(
        accountId,
        `/${platformAccountId}/tags`,
        { fields: 'id,caption,timestamp,username,permalink', limit: '10' },
      )

      if (taggedData?.data) {
        for (const tagged of taggedData.data) {
          const createdAt = new Date(tagged.timestamp)
          if (createdAt < new Date(since)) continue

          items.push(buildNormalizedItem({
            accountId, siteId, tenantId,
            platformItemId: tagged.id,
            itemType: 'mention',
            content: tagged.caption,
            authorHandle: tagged.username,
            authorName: tagged.username,
            platformCreatedAt: tagged.timestamp,
          }))
        }
      }
    } catch {
      // Tagged media may not be available
    }
  } catch (err: any) {
    console.error('[InboxSync] Instagram sync error:', err.message)
  }

  return items
}

/**
 * Twitter inbox sync — mentions, DMs
 */
async function syncTwitterInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    // 1. Mentions timeline
    const mentionsData = await twitterRequest(
      accountId,
      `/users/${platformAccountId}/mentions`,
      'GET',
    )

    if (mentionsData?.data) {
      for (const tweet of mentionsData.data) {
        const createdAt = new Date(tweet.created_at)
        if (createdAt < new Date(since)) continue

        // Fetch author info
        let authorName: string | null = null
        let authorHandle: string | null = null
        let authorAvatar: string | null = null
        let authorFollowers: number | null = null

        if (tweet.author_id) {
          try {
            const userData = await twitterRequest(
              accountId,
              `/users/${tweet.author_id}`,
              'GET',
            )
            if (userData?.data) {
              authorName = userData.data.name
              authorHandle = userData.data.username
              authorAvatar = userData.data.profile_image_url
              authorFollowers = userData.data.public_metrics?.followers_count ?? null
            }
          } catch {
            // Skip author enrichment on error
          }
        }

        items.push(buildNormalizedItem({
          accountId, siteId, tenantId,
          platformItemId: tweet.id,
          itemType: 'mention',
          content: tweet.text,
          authorId: tweet.author_id,
          authorName,
          authorHandle,
          authorAvatar,
          authorFollowers,
          platformCreatedAt: tweet.created_at,
        }))
      }
    }

    // 2. DMs (if scope granted)
    try {
      const dmData = await twitterRequest(
        accountId,
        '/dm_events',
        'GET',
      )

      if (dmData?.data) {
        for (const dm of dmData.data) {
          const createdAt = new Date(dm.created_at)
          if (createdAt < new Date(since)) continue
          // Skip DMs sent by the account itself
          if (dm.sender_id === platformAccountId) continue

          items.push(buildNormalizedItem({
            accountId, siteId, tenantId,
            platformItemId: dm.id,
            itemType: 'dm',
            content: dm.text,
            authorId: dm.sender_id,
            platformCreatedAt: dm.created_at,
          }))
        }
      }
    } catch {
      // DM scope may not be granted
    }
  } catch (err: any) {
    console.error('[InboxSync] Twitter sync error:', err.message)
  }

  return items
}

/**
 * LinkedIn inbox sync — post comments
 */
async function syncLinkedinInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    // Get recent posts to fetch their comments
    const postsData = await linkedinRequest(
      accountId,
      `/ugcPosts?q=authors&authors=List(urn:li:person:${platformAccountId})&count=10`,
    )

    if (postsData?.elements) {
      for (const post of postsData.elements) {
        const postUrn = post.id || post['$URN']
        if (!postUrn) continue

        try {
          const commentsData = await linkedinRequest(
            accountId,
            `/socialActions/${encodeURIComponent(postUrn)}/comments?count=50`,
          )

          if (commentsData?.elements) {
            for (const comment of commentsData.elements) {
              const createdAt = new Date(comment.created?.time || 0)
              if (createdAt < new Date(since)) continue
              // Skip own comments
              if (comment.actor === `urn:li:person:${platformAccountId}`) continue

              items.push(buildNormalizedItem({
                accountId, siteId, tenantId,
                platformItemId: comment['$URN'] || comment.id || `li-${Date.now()}`,
                platformParentId: postUrn,
                itemType: 'comment',
                content: comment.message?.text,
                authorId: comment.actor,
                authorName: comment.actor, // LinkedIn doesn't return names in comment API
                platformCreatedAt: createdAt.toISOString(),
              }))
            }
          }
        } catch {
          // Individual post comment fetch may fail
        }
      }
    }
  } catch (err: any) {
    console.error('[InboxSync] LinkedIn sync error:', err.message)
  }

  return items
}

/**
 * Bluesky inbox sync — notifications (replies, mentions, quotes)
 */
async function syncBlueskyInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    const res = await platformFetch(
      accountId,
      'https://bsky.social/xrpc/app.bsky.notification.listNotifications?limit=50',
    )

    if (!res.ok) return items
    const data = await res.json()

    if (data?.notifications) {
      for (const notif of data.notifications) {
        // Only process replies, mentions, and quotes
        if (!['reply', 'mention', 'quote'].includes(notif.reason)) continue

        const createdAt = new Date(notif.indexedAt)
        if (createdAt < new Date(since)) continue

        const itemType: InboxItemType =
          notif.reason === 'reply' ? 'comment' :
          notif.reason === 'mention' ? 'mention' :
          'mention'

        items.push(buildNormalizedItem({
          accountId, siteId, tenantId,
          platformItemId: notif.uri || notif.cid || `bsky-${Date.now()}`,
          platformParentId: notif.reasonSubject || null,
          itemType,
          content: notif.record?.text,
          authorId: notif.author?.did,
          authorName: notif.author?.displayName,
          authorHandle: notif.author?.handle,
          authorAvatar: notif.author?.avatar,
          platformCreatedAt: notif.indexedAt,
        }))
      }
    }
  } catch (err: any) {
    console.error('[InboxSync] Bluesky sync error:', err.message)
  }

  return items
}

/**
 * Mastodon inbox sync — notifications (mentions, favourites, reblogs)
 */
async function syncMastodonInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    // Get Mastodon instance URL from account settings
    const supabase = await createClient()
    const { data: account } = await (supabase as any)
      .from('social_accounts')
      .select('settings')
      .eq('id', accountId)
      .single()

    const instanceUrl = account?.settings?.instanceUrl || 'https://mastodon.social'

    // 1. Notifications
    const res = await platformFetch(
      accountId,
      `${instanceUrl}/api/v1/notifications?types[]=mention&types[]=favourite&types[]=reblog&limit=40`,
    )

    if (res.ok) {
      const notifications = await res.json()

      for (const notif of notifications) {
        const createdAt = new Date(notif.created_at)
        if (createdAt < new Date(since)) continue

        const itemType: InboxItemType =
          notif.type === 'mention' ? 'mention' :
          notif.type === 'favourite' ? 'reaction' :
          'mention'

        items.push(buildNormalizedItem({
          accountId, siteId, tenantId,
          platformItemId: notif.id,
          platformParentId: notif.status?.in_reply_to_id || null,
          itemType,
          content: notif.status?.content?.replace(/<[^>]+>/g, '') || null, // Strip HTML
          authorId: notif.account?.id,
          authorName: notif.account?.display_name || notif.account?.username,
          authorHandle: notif.account?.acct,
          authorAvatar: notif.account?.avatar,
          authorFollowers: notif.account?.followers_count ?? null,
          platformCreatedAt: notif.created_at,
        }))
      }
    }

    // 2. Conversations (DMs)
    try {
      const convRes = await platformFetch(
        accountId,
        `${instanceUrl}/api/v1/conversations?limit=20`,
      )

      if (convRes.ok) {
        const conversations = await convRes.json()
        for (const conv of conversations) {
          if (!conv.last_status) continue
          const createdAt = new Date(conv.last_status.created_at)
          if (createdAt < new Date(since)) continue

          items.push(buildNormalizedItem({
            accountId, siteId, tenantId,
            platformItemId: conv.id,
            itemType: 'dm',
            content: conv.last_status.content?.replace(/<[^>]+>/g, '') || null,
            authorId: conv.last_status.account?.id,
            authorName: conv.last_status.account?.display_name,
            authorHandle: conv.last_status.account?.acct,
            authorAvatar: conv.last_status.account?.avatar,
            platformCreatedAt: conv.last_status.created_at,
          }))
        }
      }
    } catch {
      // DM access may not be available
    }
  } catch (err: any) {
    console.error('[InboxSync] Mastodon sync error:', err.message)
  }

  return items
}

/**
 * YouTube inbox sync — video comments
 */
async function syncYoutubeInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    // Get channel's recent videos
    const videosData = await youtubeRequest(
      accountId,
      '/search',
      {
        part: 'id',
        channelId: platformAccountId,
        type: 'video',
        order: 'date',
        maxResults: '10',
        publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    )

    if (videosData?.items) {
      for (const video of videosData.items) {
        const videoId = video.id?.videoId
        if (!videoId) continue

        try {
          const commentsData = await youtubeRequest(
            accountId,
            '/commentThreads',
            { part: 'snippet', videoId, maxResults: '50', order: 'time' },
          )

          if (commentsData?.items) {
            for (const thread of commentsData.items) {
              const snippet = thread.snippet?.topLevelComment?.snippet
              if (!snippet) continue

              const createdAt = new Date(snippet.publishedAt)
              if (createdAt < new Date(since)) continue
              // Skip own comments
              if (snippet.authorChannelId?.value === platformAccountId) continue

              items.push(buildNormalizedItem({
                accountId, siteId, tenantId,
                platformItemId: thread.id,
                platformParentId: videoId,
                itemType: 'comment',
                content: snippet.textDisplay,
                authorId: snippet.authorChannelId?.value,
                authorName: snippet.authorDisplayName,
                authorAvatar: snippet.authorProfileImageUrl,
                platformCreatedAt: snippet.publishedAt,
              }))
            }
          }
        } catch {
          // Individual video comment fetch may fail
        }
      }
    }
  } catch (err: any) {
    console.error('[InboxSync] YouTube sync error:', err.message)
  }

  return items
}

/**
 * TikTok inbox sync — comments on own videos (limited API)
 */
async function syncTiktokInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    // TikTok comment API is limited — fetch comments on recent videos
    const res = await platformFetch(
      accountId,
      `https://open.tiktokapis.com/v2/video/list/?fields=id`,
    )

    if (res.ok) {
      const videoData = await res.json()
      if (videoData?.data?.videos) {
        for (const video of videoData.data.videos.slice(0, 5)) {
          try {
            const commentRes = await platformFetch(
              accountId,
              `https://open.tiktokapis.com/v2/comment/list/?video_id=${video.id}&max_count=50`,
            )

            if (commentRes.ok) {
              const commentData = await commentRes.json()
              if (commentData?.data?.comments) {
                for (const comment of commentData.data.comments) {
                  const createdAt = new Date(comment.create_time * 1000)
                  if (createdAt < new Date(since)) continue

                  items.push(buildNormalizedItem({
                    accountId, siteId, tenantId,
                    platformItemId: comment.id,
                    platformParentId: video.id,
                    itemType: 'comment',
                    content: comment.text,
                    authorName: comment.user?.display_name,
                    authorHandle: comment.user?.unique_id,
                    authorAvatar: comment.user?.avatar_url,
                    platformCreatedAt: createdAt.toISOString(),
                  }))
                }
              }
            }
          } catch {
            // Individual video comment fetch may fail
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[InboxSync] TikTok sync error:', err.message)
  }

  return items
}

/**
 * Threads inbox sync — reply threads
 */
async function syncThreadsInbox(
  accountId: string,
  platformAccountId: string,
  siteId: string,
  tenantId: string,
  since: string,
): Promise<NormalizedInboxItem[]> {
  const items: NormalizedInboxItem[] = []

  try {
    // Get recent threads and their replies
    const threadsData = await threadsRequest(
      accountId,
      `/${platformAccountId}/threads`,
      'GET',
    )

    if (threadsData?.data) {
      for (const thread of threadsData.data.slice(0, 10)) {
        try {
          const repliesData = await threadsRequest(
            accountId,
            `/${thread.id}/replies`,
            'GET',
          )

          if (repliesData?.data) {
            for (const reply of repliesData.data) {
              const createdAt = new Date(reply.timestamp)
              if (createdAt < new Date(since)) continue
              // Skip own replies
              if (reply.id === platformAccountId) continue

              items.push(buildNormalizedItem({
                accountId, siteId, tenantId,
                platformItemId: reply.id,
                platformParentId: thread.id,
                itemType: 'comment',
                content: reply.text,
                authorName: reply.username,
                authorHandle: reply.username,
                platformCreatedAt: reply.timestamp,
              }))
            }
          }
        } catch {
          // Individual thread reply fetch may fail
        }
      }
    }
  } catch (err: any) {
    console.error('[InboxSync] Threads sync error:', err.message)
  }

  return items
}

// ============================================================================
// HELPERS
// ============================================================================

function buildNormalizedItem(params: {
  accountId: string
  siteId: string
  tenantId: string
  platformItemId: string
  platformParentId?: string | null
  relatedPostId?: string | null
  itemType: InboxItemType
  content: string | null
  mediaUrl?: string | null
  authorId?: string | null
  authorName?: string | null
  authorHandle?: string | null
  authorAvatar?: string | null
  authorFollowers?: number | null
  authorVerified?: boolean
  platformCreatedAt: string
}): NormalizedInboxItem {
  return {
    account_id: params.accountId,
    site_id: params.siteId,
    tenant_id: params.tenantId,
    platform_item_id: params.platformItemId,
    platform_parent_id: params.platformParentId ?? null,
    related_post_id: params.relatedPostId ?? null,
    item_type: params.itemType,
    content: params.content,
    media_url: params.mediaUrl ?? null,
    author_id: params.authorId ?? null,
    author_name: params.authorName ?? null,
    author_handle: params.authorHandle ?? null,
    author_avatar: params.authorAvatar ?? null,
    author_followers: params.authorFollowers ?? null,
    author_verified: params.authorVerified ?? false,
    sentiment: null, // Will be set during insert
    sentiment_score: null,
    priority: 'normal', // Will be determined during insert
    platform_created_at: params.platformCreatedAt,
    status: 'new',
    tags: [],
  }
}

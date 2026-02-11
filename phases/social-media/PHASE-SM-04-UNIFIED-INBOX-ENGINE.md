# PHASE SM-04: Unified Inbox Engine

**Phase**: SM-04  
**Name**: Unified Inbox Engine — Real Comment/DM/Mention Sync  
**Independence**: Requires SM-01 (connected accounts with valid tokens)  
**Connection Points**: Reads accounts from SM-01; writes to `social_inbox_items` table; inbox UI already exists  
**Estimated Files**: ~10 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/types/index.ts (InboxItem, InboxItemType, SavedReply types)
src/modules/social-media/actions/inbox-actions.ts
src/modules/social-media/components/SocialInbox.tsx
src/modules/social-media/components/SocialInboxWrapper.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/inbox/page.tsx
src/modules/social-media/lib/token-refresh.ts (created in SM-01)
src/modules/social-media/lib/platform-api.ts (created in SM-01)
```

---

## Context

The inbox UI exists as a polished split-panel interface with filters, search, reply box, bulk actions, and saved replies. However, `replyToItem()` only updates the DB with a comment "Platform-specific reply logic would go here". There's no mechanism to fetch incoming comments, DMs, or mentions from platform APIs. This phase builds the real inbox sync and reply pipeline.

### Current State
- `SocialInbox` component: Full UI with conversation view, filters, saved replies
- `inbox-actions.ts`: CRUD operations on `social_inbox_items` table
- `replyToItem()`: Updates DB only — does NOT send reply to platform
- `social_inbox_items` table exists with columns for type, author, content, sentiment, status
- `social_saved_replies` table exists
- No ingestion mechanism — inbox items must be manually inserted
- No webhook handlers for receiving real-time notifications

### Target State
- Cron job fetches comments, DMs, mentions from each platform API
- Replies sent through inbox actually post to the platform
- Real-time webhook support for instant notifications (optional per platform)
- Sentiment analysis on incoming items
- Author context (follower count, verification status)
- Conversation threading (link parent→child items)

---

## Task 1: Create Inbox Sync Service

### Create `src/modules/social-media/lib/inbox-sync-service.ts`

```typescript
'use server'

/**
 * Inbox Sync Service
 * 
 * PHASE SM-04: Fetches comments, DMs, mentions from platform APIs
 * and writes them to the social_inbox_items table.
 */

import { createClient } from '@/lib/supabase/server'
import { platformFetch } from './token-refresh'
import type { SocialPlatform, InboxItemType } from '../types'

interface InboxSyncResult {
  newItems: number
  errors: string[]
}

/**
 * Sync inbox items for a single account
 * Fetches latest comments, DMs, and mentions since last sync
 */
export async function syncAccountInbox(accountId: string): Promise<InboxSyncResult> {
  // Implementation:
  // 1. Fetch account from social_accounts (platform, access_token, last_synced_at)
  // 2. Determine the "since" timestamp (last_synced_at or 24h ago for first sync)
  // 3. Route to platform-specific fetcher
  // 4. For each fetched item:
  //    a. Check if already exists (by platform_item_id) — skip if exists
  //    b. Detect sentiment using simple keyword analysis (or AI if configured)
  //    c. Set priority based on: author follower count, sentiment, @mention
  //    d. Insert into social_inbox_items
  // 5. Update account's last_synced_at
  // 6. Return count of new items
}

/**
 * Facebook inbox sync
 * Fetches: Page comments, Page messages, mentions
 */
async function syncFacebookInbox(accountId: string, platformAccountId: string, accessToken: string, since: string): Promise<any[]> {
  // Implementation:
  // 1. Page post comments: GET /{pageId}/feed?fields=comments{from,message,created_time,id}
  //    → item_type: 'comment'
  // 2. Page conversations (DMs): GET /{pageId}/conversations?fields=messages{from,message,created_time}
  //    → item_type: 'dm'
  // 3. Page mentions: GET /{pageId}/tagged?fields=from,message,created_time
  //    → item_type: 'mention'
  // 4. Return normalized items
}

/**
 * Instagram inbox sync
 * Fetches: Media comments, story mentions, story replies
 */
async function syncInstagramInbox(accountId: string, platformAccountId: string, accessToken: string, since: string): Promise<any[]> {
  // Implementation:
  // 1. Media comments: GET /{igUserId}/media?fields=comments{from,text,timestamp,id,username}
  //    → item_type: 'comment'
  // 2. Story mentions: GET /{igUserId}/stories?fields=mentioned_user (limited API)
  //    → item_type: 'story_mention'
  // 3. @mentions in comments: filter comments containing @handle
  //    → item_type: 'mention'
}

/**
 * Twitter inbox sync
 * Fetches: Mentions, DMs, quote tweets, replies
 */
async function syncTwitterInbox(accountId: string, platformAccountId: string, accessToken: string, since: string): Promise<any[]> {
  // Implementation:
  // 1. Mentions: GET /users/{id}/mentions?tweet.fields=created_at,author_id,text
  //    → item_type: 'mention'
  // 2. DMs: GET /dm_events?dm_event.fields=text,created_at,sender_id (if DM scope granted)
  //    → item_type: 'dm'
  // 3. For author info: GET /users/{authorId}?user.fields=name,username,profile_image_url,public_metrics
}

/**
 * LinkedIn inbox sync
 * Fetches: Post comments, share comments
 */
async function syncLinkedinInbox(accountId: string, platformAccountId: string, accessToken: string, since: string): Promise<any[]> {
  // Implementation:
  // 1. Comments: GET /socialActions/{activityUrn}/comments
  //    → item_type: 'comment'
  // 2. Organization mentions: GET /organizationalEntityFollowerStatistics (limited)
}

/**
 * Bluesky inbox sync
 * Fetches: Notifications (likes, replies, mentions, reposts, follows)
 */
async function syncBlueskyInbox(accountId: string, platformAccountId: string, accessToken: string, since: string): Promise<any[]> {
  // Implementation:
  // 1. Notifications: GET app.bsky.notification.listNotifications
  //    Filter for reason: 'reply', 'mention', 'quote'
  //    → item_type based on reason
  // 2. For each notification, get the post content via app.bsky.feed.getPostThread
}

/**
 * Mastodon inbox sync
 * Fetches: Notifications (mentions, favourites, reblogs, follows)
 */
async function syncMastodonInbox(accountId: string, platformAccountId: string, accessToken: string, since: string): Promise<any[]> {
  // Implementation:
  // 1. Notifications: GET /api/v1/notifications?types[]=mention&types[]=favourite&types[]=reblog
  //    since_id parameter for pagination
  //    → item_type based on notification type
  // 2. DMs: GET /api/v1/conversations
  //    → item_type: 'dm'
}

// Similar functions for TikTok, YouTube, Pinterest, Threads
// Each platform has different API capabilities for inbox:
// - TikTok: Limited — comments on own videos (GET /comment/list/)
// - YouTube: Comments on own videos (GET /commentThreads?videoId={id}&part=snippet)
// - Pinterest: No inbox API (comments on pins are limited)
// - Threads: GET /{threadId}/replies (reply threads)
```

---

## Task 2: Create Inbox Reply Service

### Create `src/modules/social-media/lib/inbox-reply-service.ts`

```typescript
'use server'

/**
 * Inbox Reply Service
 * 
 * PHASE SM-04: Sends replies through platform APIs
 * when users respond to inbox items.
 */

import { platformFetch } from './token-refresh'
import type { SocialPlatform } from '../types'

/**
 * Send a reply to an inbox item on the platform
 */
export async function sendPlatformReply(params: {
  accountId: string
  platform: SocialPlatform
  platformItemId: string  // The comment/message ID to reply to
  platformParentId?: string | null  // Parent post ID (for comments)
  content: string
  itemType: string  // 'comment', 'dm', 'mention'
}): Promise<{ success: boolean; replyId?: string; error?: string }> {
  // Route to platform-specific reply function
}

/**
 * Reply to a Facebook comment
 * API: POST /{comment-id}/comments { message }
 * Or for DMs: POST /{conversation-id}/messages { message }
 */
async function replyOnFacebook(accountId: string, platformItemId: string, content: string, itemType: string): Promise<{ success: boolean; replyId?: string; error?: string }> {
  // Implementation:
  // If comment → POST /{commentId}/comments { message: content }
  // If DM → POST /{conversationId}/messages { message: content }
}

/**
 * Reply to an Instagram comment
 * API: POST /{comment-id}/replies { message }
 */
async function replyOnInstagram(accountId: string, platformItemId: string, content: string, itemType: string): Promise<{ success: boolean; replyId?: string; error?: string }> {
  // POST /{commentId}/replies { message: content }
}

/**
 * Reply on Twitter
 * API: POST /2/tweets { text, reply: { in_reply_to_tweet_id } }
 */
async function replyOnTwitter(accountId: string, platformItemId: string, content: string): Promise<{ success: boolean; replyId?: string; error?: string }> {
  // POST /2/tweets { text: content, reply: { in_reply_to_tweet_id: platformItemId } }
}

/**
 * Reply on LinkedIn
 * API: POST /socialActions/{activityUrn}/comments
 */
async function replyOnLinkedin(accountId: string, platformItemId: string, content: string): Promise<{ success: boolean; replyId?: string; error?: string }> {
  // POST /socialActions/{activityUrn}/comments { actor, message }
}

/**
 * Reply on Bluesky
 * API: com.atproto.repo.createRecord (reply post)
 */
async function replyOnBluesky(accountId: string, platformItemId: string, content: string): Promise<{ success: boolean; replyId?: string; error?: string }> {
  // Get the parent post's CID and URI
  // POST com.atproto.repo.createRecord with reply: { root, parent }
}

/**
 * Reply on Mastodon
 * API: POST /api/v1/statuses { status, in_reply_to_id }
 */
async function replyOnMastodon(accountId: string, platformItemId: string, content: string): Promise<{ success: boolean; replyId?: string; error?: string }> {
  // POST /api/v1/statuses { status: content, in_reply_to_id: platformItemId }
}

// Similar for YouTube (POST /commentThreads), TikTok (limited), Pinterest (no reply API)
```

---

## Task 3: Update Inbox Actions — Real Platform Replies

### Modify `src/modules/social-media/actions/inbox-actions.ts`

**Update `replyToItem()`:**

Replace the stub comment "Platform-specific reply logic would go here" with:

```typescript
export async function replyToItem(
  itemId: string,
  content: string,
  siteId: string
): Promise<{ success: boolean; error: string | null }> {
  // Implementation:
  // 1. Fetch the inbox item (get accountId, platform, platformItemId, itemType, platformParentId)
  // 2. Fetch the account (get platform)
  // 3. Call sendPlatformReply() with the correct params
  // 4. If platform reply succeeds:
  //    a. Update inbox item: status → 'replied', response_text, response_at, response_time_seconds
  //    b. Calculate response time = now - created_at (in seconds)
  // 5. If platform reply fails:
  //    a. Still save the reply text in DB (for audit)
  //    b. Return error message
  // 6. Revalidate path
}
```

**Add new action for inbox sync:**

```typescript
/**
 * Trigger inbox sync for all accounts of a site
 */
export async function syncInbox(siteId: string): Promise<{ newItems: number; error: string | null }> {
  // Import and call syncAccountInbox() for each active account
}
```

---

## Task 4: Create Inbox Sync Cron Route

### Modify `src/app/api/social/sync/route.ts` (created in SM-03)

Add inbox sync to the existing analytics sync cron:

```typescript
// In the existing sync route handler:
// 1. Sync daily analytics (SM-03)
// 2. Sync post analytics (SM-03)
// 3. Sync inbox items (SM-04) ← ADD THIS
//    For each site, for each active account, call syncAccountInbox()
```

If SM-03 hasn't been implemented yet, create this route independently with just inbox sync, designed to be merged later.

---

## Task 5: Add Simple Sentiment Analysis

### Create `src/modules/social-media/lib/sentiment-analysis.ts`

```typescript
/**
 * Simple Sentiment Analysis
 * 
 * PHASE SM-04: Basic keyword-based sentiment detection
 * for incoming inbox items. Can be enhanced with AI later (SM-06).
 */

export type SentimentResult = {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // -1.0 to 1.0
}

/**
 * Analyze sentiment of text content
 * Uses keyword matching for basic sentiment detection.
 * Returns a score from -1.0 (very negative) to 1.0 (very positive)
 */
export function analyzeSentiment(text: string): SentimentResult {
  // Implementation:
  // Define positive keywords: love, great, amazing, awesome, excellent, thank, perfect, wonderful, happy, beautiful, best
  // Define negative keywords: hate, terrible, awful, worst, horrible, bad, disappointed, angry, disgusting, scam, fraud, broken
  // Define urgency keywords: urgent, help, asap, emergency, immediately, problem, issue, broken, not working
  //
  // Count positive vs negative keywords
  // Score = (positive - negative) / (positive + negative + 1)
  // If score > 0.2 → positive
  // If score < -0.2 → negative
  // Otherwise → neutral
  //
  // Also flag urgency keywords for priority detection
}

/**
 * Determine inbox item priority based on content and author
 */
export function determinePriority(params: {
  content: string
  sentiment: SentimentResult
  authorFollowers: number | null
  itemType: string
}): 'low' | 'normal' | 'high' | 'urgent' {
  // Implementation:
  // urgent: negative sentiment + urgency keywords
  // high: DM from high-follower author (>10k), or very negative sentiment
  // normal: regular comments and mentions
  // low: reactions, story views
}
```

---

## Task 6: Update Inbox UI — Sync Button & Enhancements

### Modify `src/modules/social-media/components/SocialInbox.tsx`

1. **Add "Sync Inbox" button** in the header that calls `syncInbox(siteId)` action
2. **Show sync status**: "Last synced: 5 minutes ago" indicator
3. **Add sentiment indicators** to inbox items:
   - Green dot for positive sentiment
   - Yellow dot for neutral
   - Red dot for negative
4. **Add author context**:
   - Show follower count badge for high-follower authors
   - Show verified badge if `author_verified` is true
5. **Reply confirmation**: After sending a reply, show "Reply sent to [platform]" toast
6. **Error handling**: If platform reply fails, show error and allow retry from DB copy

### Modify `src/modules/social-media/components/SocialInboxWrapper.tsx`

1. **Wire the `syncInbox` action** to the onSync callback
2. **Add `onReply` callback** that calls the updated `replyToItem` with platform sending

---

## Task 7: Create Webhook Handlers (Optional Enhancement)

### Create `src/app/api/social/webhooks/[platform]/route.ts`

For platforms that support webhooks, handle real-time notifications:

```typescript
/**
 * Social Media Platform Webhook Handler
 * 
 * Receives real-time notifications from platforms:
 * - Facebook/Instagram: Webhooks for comments, messages
 * - Twitter: Account Activity API
 * - YouTube: Push notifications via PubSubHubbub
 */

// Implementation per platform:
// 1. Verify webhook signature (platform-specific HMAC verification)
// 2. Parse the event payload
// 3. Normalize to InboxItem format
// 4. Insert into social_inbox_items
// 5. Return 200 OK quickly (webhook timeout is short)

// Facebook webhook verification:
// GET handler: return hub.challenge when hub.verify_token matches
// POST handler: verify X-Hub-Signature-256 header, parse entries

// Twitter Account Activity:
// GET handler: return CRC response token
// POST handler: parse direct_message_events, tweet_create_events, etc.
```

**Note**: Webhooks require a publicly accessible URL. For local development, use polling (cron sync). For production, webhooks provide near-instant inbox updates.

---

## Verification Checklist

```
□ npx tsc --noEmit passes with zero errors
□ "Sync Inbox" button fetches real comments/mentions from connected accounts
□ Inbox items show real author names, avatars, and content
□ Replying to a Facebook comment actually posts the reply on Facebook
□ Replying to a Twitter mention creates a real reply tweet
□ Replying to a Bluesky notification creates a real reply post
□ Reply confirmation shows success message with platform name
□ Failed replies show error and preserve the reply text
□ Sentiment indicators appear on inbox items (green/yellow/red)
□ High-follower authors show follower count badge
□ Priority assignment works (urgent for negative + urgency keywords)
□ Saved replies still work and insert correctly
□ Bulk actions (archive, mark read) still work
□ Sync cron runs and fetches new items periodically
□ "Last synced" timestamp shows correctly
□ No "Platform-specific reply logic would go here" comment remains
□ No mock inbox data anywhere
□ Conversation threading links parent-child items where possible
□ Commit: git commit -m "feat(social-media): PHASE-SM-04: Unified Inbox Engine"
```

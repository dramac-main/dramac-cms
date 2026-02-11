# PHASE SM-02: Publishing Engine

**Phase**: SM-02  
**Name**: Publishing Engine — Real Platform Publishing  
**Independence**: Requires SM-01 (accounts must exist with valid tokens)  
**Connection Points**: Uses accounts from SM-01; writes to `social_posts`, `social_publish_log` tables; provides published posts for SM-03 (Analytics)  
**Estimated Files**: ~12 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
memory-bank/techContext.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
phases/social-media/PHASE-SM-01-OAUTH-ACCOUNT-INTEGRATION.md
src/modules/social-media/types/index.ts
src/modules/social-media/actions/post-actions.ts
src/modules/social-media/components/PostComposerEnhanced.tsx
src/modules/social-media/components/PostComposerWrapper.tsx
src/modules/social-media/lib/token-refresh.ts (created in SM-01)
src/modules/social-media/lib/platform-api.ts (created in SM-01)
migrations/em-54-social-media-flat-tables.sql
```

---

## Context

The post composer UI exists with a polished 3-step flow (Compose → Preview → Schedule), but `publishPostNow()` in `post-actions.ts` generates fake `simulated_${Date.now()}_${platform}` IDs instead of actually publishing to platforms. This phase builds the real publishing pipeline.

### Current State
- `PostComposerEnhanced` and `PostComposer` components exist with full UI
- `post-actions.ts` has `createPost`, `updatePost`, `schedulePost`, `publishPostNow`, `addToQueue`
- `publishPostNow` generates simulated platform post IDs — zero real API calls
- `social_posts` and `social_publish_log` tables exist
- Media in the composer creates blob URLs (no real upload — SM-05 handles storage)
- Types for `SocialPost`, `PostMedia`, `PublishResult`, `PublishLog` exist

### Target State
- `publishPostNow()` actually publishes content to each target platform via their APIs
- Each platform's publish result (post URL, platform post ID) saved to `social_publish_log`
- Scheduled posts are published by a background API route/cron
- Queue system with configurable time slots works
- First Comment feature works for Instagram/Facebook
- Multi-platform publishing handles partial failures gracefully
- Platform-specific content variations (e.g., Twitter threads) work

---

## Task 1: Create Platform Publishing Service

### Create `src/modules/social-media/lib/publish-service.ts`

This is the core publishing engine that knows how to publish to each platform.

**Implementation Requirements:**

```typescript
'use server'

/**
 * Platform Publishing Service
 * 
 * PHASE SM-02: Handles actual content publishing to each social media platform
 * Each platform has different APIs, content formats, and media handling.
 */

import { platformFetch, ensureValidToken } from './token-refresh'
import { createClient } from '@/lib/supabase/server'
import type { SocialPost, SocialPlatform, PublishResult, PostMedia } from '../types'

export interface PublishRequest {
  postId: string
  accountId: string
  platform: SocialPlatform
  content: string
  media: PostMedia[]
  platformContent?: {
    content?: string
    thread?: string[]
    firstComment?: string
  }
  linkUrl?: string | null
}

export interface PublishResponse {
  success: boolean
  platformPostId?: string
  platformUrl?: string
  error?: string
}

/**
 * Publish a post to a specific platform account
 */
export async function publishToAccount(request: PublishRequest): Promise<PublishResponse> {
  // 1. Ensure valid token
  // 2. Route to platform-specific publisher
  // 3. Return result with platformPostId and platformUrl
}

/**
 * Publish to Facebook Page
 * API: POST /{page-id}/feed (text posts)
 * API: POST /{page-id}/photos (single image)
 * API: POST /{page-id}/videos (video)
 * 
 * For multi-image: Create unpublished photos, then create post with attached_media[]
 */
async function publishToFacebook(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. If no media → POST /{pageId}/feed with { message: content, link: linkUrl }
  // 2. If single image → POST /{pageId}/photos with { message: content, url: imageUrl }
  // 3. If multiple images → Upload each as unpublished photo, then POST /{pageId}/feed with attached_media
  // 4. If video → POST /{pageId}/videos with { description: content, file_url: videoUrl }
  // 5. Response includes { id, post_id } → platform post ID
  // 6. Construct URL: https://facebook.com/{pageId}/posts/{postId}
}

/**
 * Publish to Instagram
 * API: POST /{ig-user-id}/media → creates media container
 * API: POST /{ig-user-id}/media_publish → publishes the container
 * 
 * Instagram requires a 2-step process: create container, then publish
 * For carousel: create child containers first, then create carousel container
 */
async function publishToInstagram(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. Single image: POST /{igUserId}/media { image_url, caption } → POST /{igUserId}/media_publish { creation_id }
  // 2. Carousel: POST /{igUserId}/media { image_url, is_carousel_item: true } for each → 
  //    POST /{igUserId}/media { media_type: 'CAROUSEL', children: [ids], caption }
  //    POST /{igUserId}/media_publish { creation_id }
  // 3. Video/Reel: POST /{igUserId}/media { video_url, caption, media_type: 'REELS' }
  //    Poll for status until FINISHED → POST /{igUserId}/media_publish
  // 4. First Comment: If firstComment, wait 30s then POST /{mediaId}/comments { message }
}

/**
 * Publish to Twitter/X
 * API: POST /2/tweets
 * 
 * For threads: publish each tweet, replying to the previous one
 * For media: upload via v1.1 media/upload endpoint first
 */
async function publishToTwitter(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. If media → Upload each via POST https://upload.twitter.com/1.1/media/upload.json
  //    (chunked upload for videos)
  // 2. POST /2/tweets { text: content, media: { media_ids: [...] } }
  // 3. For threads → publish first tweet, then reply chain with in_reply_to_tweet_id
  // 4. URL: https://twitter.com/i/web/status/{tweetId}
}

/**
 * Publish to LinkedIn
 * API: POST /ugcPosts (for personal profiles)
 * API: POST /shares (for company pages)
 * 
 * LinkedIn requires registering media assets first for images/videos
 */
async function publishToLinkedin(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. If media → POST /assets?action=registerUpload → upload binary to upload URL
  // 2. POST /ugcPosts with { author, lifecycleState: 'PUBLISHED', specificContent: { shareCommentary, media } }
  // 3. For company pages: author = "urn:li:organization:{orgId}"
  // 4. URL: https://www.linkedin.com/feed/update/{activityUrn}
}

/**
 * Publish to TikTok
 * API: POST /post/publish/inbox/video/init/ → creates a publish request
 * 
 * TikTok uses "publish to inbox" flow — content goes to TikTok app for final publishing
 * Direct publish requires additional TikTok approval
 */
async function publishToTiktok(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. POST /post/publish/inbox/video/init/ with { source_info: { source: 'PULL_FROM_URL', video_url } }
  // 2. TikTok downloads the video and puts it in the user's TikTok inbox
  // 3. User opens TikTok app to finalize & publish
  // 4. For direct publish (if approved): POST /post/publish/video/init/
}

/**
 * Publish to YouTube
 * API: POST /videos?part=snippet,status (upload video)
 * API: POST /commentThreads (community posts — limited access)
 */
async function publishToYoutube(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. Upload video: POST /upload/youtube/v3/videos with multipart body
  //    { snippet: { title, description, tags }, status: { privacyStatus: 'public' } }
  // 2. Community posts: POST /youtube/v3/commentThreads (very limited API)
  // 3. URL: https://youtube.com/watch?v={videoId}
}

/**
 * Publish to Pinterest
 * API: POST /pins
 */
async function publishToPinterest(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. POST /v5/pins { board_id, title, description, link, media_source: { source_type: 'image_url', url } }
  // 2. URL: https://pinterest.com/pin/{pinId}
}

/**
 * Publish to Threads
 * API: POST /{threads-user-id}/threads → create container
 * API: POST /{threads-user-id}/threads_publish → publish container
 */
async function publishToThreads(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. Text only: POST /{userId}/threads { media_type: 'TEXT', text: content }
  // 2. Image: POST /{userId}/threads { media_type: 'IMAGE', image_url, text }
  // 3. Video: POST /{userId}/threads { media_type: 'VIDEO', video_url, text }
  // 4. Then: POST /{userId}/threads_publish { creation_id }
}

/**
 * Publish to Bluesky
 * API: com.atproto.repo.createRecord (AT Protocol)
 */
async function publishToBluesky(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. If media → Upload each via com.atproto.repo.uploadBlob
  // 2. Create post record:
  //    POST com.atproto.repo.createRecord {
  //      repo: did, collection: 'app.bsky.feed.post',
  //      record: { text, createdAt, embed: { images: [...] or external: { uri, title, description } } }
  //    }
  // 3. Parse facets for mentions (@handle) and links
  // 4. URL: https://bsky.app/profile/{handle}/post/{rkey}
}

/**
 * Publish to Mastodon
 * API: POST /api/v1/statuses
 */
async function publishToMastodon(request: PublishRequest, accessToken: string): Promise<PublishResponse> {
  // Implementation:
  // 1. If media → Upload each via POST /api/v2/media → { id }
  // 2. POST /api/v1/statuses { status: content, media_ids: [...], visibility: 'public' }
  // 3. URL: response.url (instance-specific)
}
```

---

## Task 2: Update Post Actions — Real Publishing

### Modify `src/modules/social-media/actions/post-actions.ts`

**Replace `publishPostNow()` implementation:**

```typescript
/**
 * Publish a post to all target accounts immediately
 * Replaces the simulated publishing with real platform API calls
 */
export async function publishPostNow(
  postId: string,
  siteId: string
): Promise<{ success: boolean; results: Record<string, PublishResult>; error: string | null }> {
  // Implementation:
  // 1. Fetch the post from social_posts by ID
  // 2. Validate post exists and belongs to siteId
  // 3. Update post status to 'publishing'
  // 4. For each account in target_accounts:
  //    a. Fetch the account from social_accounts
  //    b. Get platform-specific content (from platform_content or fallback to main content)
  //    c. Call publishToAccount() from publish-service.ts
  //    d. Write result to social_publish_log table
  //    e. Collect results
  // 5. Determine overall status:
  //    - All succeed → 'published'
  //    - All fail → 'failed'
  //    - Mixed → 'partially_published'
  // 6. Update social_posts with:
  //    - status (published/failed/partially_published)
  //    - published_at (if any succeeded)
  //    - publish_results (JSON of all results)
  // 7. Revalidate path
  // 8. Return results
}
```

---

## Task 3: Create Scheduled Post Processor

### Create `src/app/api/social/publish/route.ts`

A cron-triggered API route that finds and publishes scheduled posts.

**Implementation Requirements:**
1. This route is called by Vercel Cron or an external cron service every minute
2. Verify the request with a `CRON_SECRET` header (or Vercel's `Authorization` header)
3. Query `social_posts` for posts where:
   - `status = 'scheduled'`
   - `scheduled_at <= NOW()`
   - `scheduled_at > NOW() - interval '5 minutes'` (don't publish very old missed posts)
4. For each post found:
   - Call `publishPostNow(postId, siteId)` 
   - Log the result
5. Return summary: `{ processed: N, published: N, failed: N }`

### Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/social/publish",
      "schedule": "* * * * *"
    }
  ]
}
```

**Note:** Check existing `vercel.json` for existing cron config and merge — do NOT overwrite.

---

## Task 4: Create Queue Processing System

### Create `src/modules/social-media/lib/queue-service.ts`

```typescript
'use server'

/**
 * Content Queue Service
 * 
 * PHASE SM-02: Manages the content queue with time slots.
 * When a user adds a post to the queue, it gets the next available time slot.
 */

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'

/**
 * Get the next available queue slot for an account
 * Based on the account's configured posting schedule
 */
export async function getNextQueueSlot(
  siteId: string,
  accountId: string
): Promise<{ nextSlot: string | null; error?: string }> {
  // Implementation:
  // 1. Fetch the account's queue settings (postsPerDay, timeSlots)
  //    from social_accounts.settings.queue or a default schedule
  // 2. Get all posts already scheduled for this account (status='scheduled')
  // 3. Find the next time slot that doesn't conflict with existing scheduled posts
  // 4. Default schedule if none configured:
  //    - Mon-Fri: 9:00, 12:00, 17:00 (Africa/Lusaka timezone)
  //    - Sat-Sun: 10:00, 15:00
  // 5. Return the next available slot as ISO datetime string
}

/**
 * Add a post to the queue
 * Finds the next available slot and schedules the post for that time
 */
export async function addPostToQueue(
  postId: string,
  siteId: string,
  accountIds?: string[]
): Promise<{ scheduledAt: string | null; error?: string }> {
  // Implementation:
  // 1. If accountIds not specified, get from post's target_accounts
  // 2. Find earliest next slot across all target accounts
  // 3. Update post: status → 'scheduled', scheduled_at → nextSlot
  // 4. Return the scheduled time
}
```

---

## Task 5: Update Post Composer — Wire Real Publishing

### Modify `src/modules/social-media/components/PostComposerWrapper.tsx`

Ensure the wrapper's `onPublish` callback calls the real `publishPostNow` action and shows appropriate success/error states.

### Modify `src/modules/social-media/components/PostComposerEnhanced.tsx`

1. **Publish flow**: After calling `createPost()`, if user chose "Publish Now", call `publishPostNow(postId, siteId)`
2. **Schedule flow**: After calling `createPost()`, if user chose "Schedule", call `schedulePost(postId, scheduledAt)`
3. **Queue flow**: After calling `createPost()`, if user chose "Add to Queue", call `addPostToQueue(postId, siteId)`
4. **Show real results**: After publishing, show which platforms succeeded/failed with platform post URLs
5. **Handle partial failures**: If some platforms fail, show a mixed status with retry option for failed ones
6. **Character count validation**: Enforce per-platform character limits from `PLATFORM_CONFIGS`
7. **Remove** any comments like "In a real app, upload to storage and get URLs" — the media URLs will come from SM-05

---

## Task 6: Create Publish Results View

### Create `src/modules/social-media/components/ui/publish-results.tsx`

A component that shows the results of publishing a post:

```typescript
/**
 * Publish Results Component
 * 
 * Shows a list of platforms with their publish status
 * (success with link, pending, failed with error)
 */
interface PublishResultsProps {
  results: Record<string, {
    status: 'success' | 'pending' | 'failed'
    platformPostId?: string
    platformUrl?: string
    error?: string
  }>
  onRetry?: (platform: string) => void
}
```

**UI Requirements:**
- Each platform shown as a row with: platform icon, platform name, status badge
- Success: Green badge + "View Post" link opening the platform URL in new tab
- Pending: Yellow badge + spinner
- Failed: Red badge + error message + "Retry" button
- Use Lucide icons, semantic Tailwind tokens

---

## Task 7: Create Post Retry Logic

### Add to `src/modules/social-media/actions/post-actions.ts`

```typescript
/**
 * Retry publishing a post to a specific failed account
 */
export async function retryPublish(
  postId: string,
  accountId: string,
  siteId: string
): Promise<{ success: boolean; result: PublishResult | null; error: string | null }> {
  // Implementation:
  // 1. Fetch the post and verify it's in 'failed' or 'partially_published' status
  // 2. Fetch the account
  // 3. Call publishToAccount() for just this account
  // 4. Update social_publish_log with new attempt (increment retry_count)
  // 5. If all accounts now published → update post status to 'published'
  // 6. Return result
}
```

---

## Task 8: Create First Comment Service

### Add to `src/modules/social-media/lib/publish-service.ts`

```typescript
/**
 * Post a first comment on a published post
 * Used for Instagram (hashtag comments) and Facebook
 * Waits for the configured delay before posting
 */
export async function postFirstComment(
  accountId: string,
  platform: SocialPlatform,
  platformPostId: string,
  comment: string,
  delayMinutes: number = 1
): Promise<{ success: boolean; error?: string }> {
  // Implementation:
  // 1. Wait for delayMinutes (if called from cron, check if enough time has passed)
  // 2. For Instagram: POST /{mediaId}/comments { message: comment }
  // 3. For Facebook: POST /{postId}/comments { message: comment }
  // 4. Return success/error
}
```

### Create First Comment Processor

Add to the scheduled post cron route (`/api/social/publish/route.ts`):
- After publishing a post with `first_comment` set and `first_comment_delay_minutes > 0`
- Insert a record into a new `social_first_comment_queue` or use existing publish_log
- The cron picks up first comments that are due and posts them

---

## Verification Checklist

```
□ npx tsc --noEmit passes with zero errors
□ Publishing a post to a connected Facebook Page creates a real Facebook post
□ Publishing to Instagram creates a real Instagram post (requires business account)
□ Publishing to Twitter creates a real tweet
□ Publishing to Bluesky creates a real Bluesky post
□ Publishing to Mastodon creates a real Mastodon status
□ Multi-platform publish works (post to 3+ platforms at once)
□ Partial failure shows correct mixed status
□ Retry button works for failed platforms
□ Scheduled posts publish automatically at the scheduled time
□ Queue system assigns correct next time slot
□ "Add to Queue" flow works end-to-end
□ First Comment posts after configured delay
□ Publish results show clickable links to platform posts
□ No simulated_* fake IDs anywhere
□ No mock data in any publish flow
□ Publish log table records all attempts with correct status
□ Post status transitions correctly: draft → scheduled → publishing → published
□ Failed publishes show meaningful error messages
□ Commit: git commit -m "feat(social-media): PHASE-SM-02: Publishing Engine"
```

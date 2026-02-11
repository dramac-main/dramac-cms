# PHASE SM-03: Analytics Sync Engine

**Phase**: SM-03  
**Name**: Analytics Sync Engine — Real Platform Analytics  
**Independence**: Requires SM-01 (connected accounts with valid tokens)  
**Connection Points**: Reads accounts from SM-01; writes to `social_analytics_daily`, `social_post_analytics`, `social_optimal_times` tables; feeds data to analytics UI components  
**Estimated Files**: ~10 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
memory-bank/techContext.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/types/index.ts
src/modules/social-media/actions/analytics-actions.ts
src/modules/social-media/components/SocialAnalyticsDashboardEnhanced.tsx
src/modules/social-media/components/SocialAnalyticsPage.tsx
src/modules/social-media/components/ui/ (all analytics UI components)
src/components/analytics/social/ (external analytics components)
src/lib/actions/social-analytics.ts (external analytics actions)
src/types/social-analytics.ts
src/modules/social-media/lib/token-refresh.ts (created in SM-01)
src/modules/social-media/lib/platform-api.ts (created in SM-01)
```

---

## Context

The analytics UI has two versions: the original `SocialAnalyticsPage` (EM-54, has hardcoded mock data) and the enhanced `SocialAnalyticsDashboardEnhanced` (DS-03B, calls server actions that return zeros). Additionally, there are external analytics components in `src/components/analytics/social/` with Recharts visualizations, and external actions in `src/lib/actions/social-analytics.ts` that ALL return empty/zero data. This phase builds the real analytics sync pipeline.

### Current State
- `SocialAnalyticsPage` has `mockOverview` with hardcoded: followers: 12543, impressions: 89234, etc.
- `analytics-actions.ts` (module): `getAnalyticsOverview` returns data from DB (zeros), `syncAnalytics` inserts zeros
- `social-analytics.ts` (external): All 18 functions return empty arrays / zero values with comment "Returns empty state until social account integration is built"
- `social_analytics_daily` table exists for daily snapshots
- `social_post_analytics` table exists for per-post analytics
- `social_optimal_times` table exists
- Analytics page currently shows the DS-03B version, which displays zeros

### Target State
- Daily cron syncs follower counts, engagement metrics from each platform
- Post-level analytics sync (impressions, likes, comments, shares per post)
- Optimal posting times calculated from real historical data
- All analytics components display real data
- `SocialAnalyticsPage` mock data removed
- External analytics actions return real data from DB
- Analytics overview on the dashboard shows real metrics with real trends

---

## Task 1: Create Analytics Sync Service

### Create `src/modules/social-media/lib/analytics-sync-service.ts`

```typescript
'use server'

/**
 * Analytics Sync Service
 * 
 * PHASE SM-03: Fetches real analytics from each platform API
 * and writes to social_analytics_daily and social_post_analytics tables.
 */

import { createClient } from '@/lib/supabase/server'
import { platformFetch, ensureValidToken } from './token-refresh'
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'
import type { SocialPlatform, DailyAnalytics, PostAnalytics } from '../types'

/**
 * Sync daily analytics for a single account
 * Fetches platform-specific insights for today (or specified date)
 */
export async function syncDailyAnalytics(
  accountId: string,
  date?: string // YYYY-MM-DD, defaults to today
): Promise<{ success: boolean; error?: string }> {
  // Implementation:
  // 1. Fetch account from social_accounts (platform, platform_account_id, access_token)
  // 2. Ensure valid token
  // 3. Call platform-specific analytics fetcher:
  //    - Facebook Page: GET /{pageId}/insights with metrics:
  //      page_impressions, page_engaged_users, page_fans, page_fan_adds, page_fan_removes,
  //      page_views_total, page_actions_post_reactions_total, page_post_engagements
  //    - Instagram: GET /{igUserId}/insights with metrics:
  //      impressions, reach, follower_count, profile_views, website_clicks
  //    - Twitter: GET /users/{id}?user.fields=public_metrics (compare with yesterday for changes)
  //    - LinkedIn: GET /organizationalEntityShareStatistics with metrics
  //    - YouTube: Use YouTube Analytics API: GET /reports with metrics:
  //      views,estimatedMinutesWatched,subscribersGained,subscribersLost,likes,comments,shares
  //    - TikTok: GET /user/info/?fields=follower_count,following_count,likes_count,video_count
  //    - Pinterest: GET /user_account/analytics with metrics
  //    - Bluesky: No insights API — track follower count changes only
  //    - Mastodon: GET /api/v1/accounts/verify_credentials for counts only
  // 4. Upsert into social_analytics_daily with:
  //    - followers_count, followers_change (calculated: today - yesterday)
  //    - impressions, reach, engagement, likes, comments, shares, clicks
  //    - video_views, watch_time_seconds
  //    - profile_views, website_clicks
  // 5. Update social_accounts with latest followers_count, following_count
  // 6. Return success/error
}

/**
 * Sync analytics for all accounts of a site
 */
export async function syncSiteAnalytics(siteId: string): Promise<{
  synced: number
  errors: Array<{ accountId: string; error: string }>
}> {
  // Implementation:
  // 1. Fetch all active accounts for the site
  // 2. For each account, call syncDailyAnalytics()
  // 3. Return count of synced + any errors
}

/**
 * Sync analytics for a specific published post
 */
export async function syncPostAnalytics(
  postId: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  // Implementation:
  // 1. Fetch the publish_log entry for this post+account to get platformPostId
  // 2. If no platformPostId → skip (post wasn't published to this account)
  // 3. Fetch platform-specific post analytics:
  //    - Facebook: GET /{postId}/insights with metrics:
  //      post_impressions, post_engaged_users, post_clicks, post_reactions_by_type_total
  //    - Instagram: GET /{mediaId}/insights with metrics:
  //      impressions, reach, engagement, saved, likes, comments, shares
  //    - Twitter: GET /tweets/{tweetId}?tweet.fields=public_metrics →
  //      { retweet_count, reply_count, like_count, quote_count, impression_count }
  //    - LinkedIn: GET /socialActions/{activityUrn}/statistics
  //    - YouTube: YouTube Analytics API for specific video
  //    - TikTok: GET /video/query/?fields=like_count,comment_count,share_count,view_count
  //    - Bluesky: GET app.bsky.feed.getPostThread → { likeCount, replyCount, repostCount }
  //    - Mastodon: GET /api/v1/statuses/{id} → { favourites_count, reblogs_count, replies_count }
  // 4. Upsert into social_post_analytics
  // 5. Update social_posts aggregated totals (total_impressions, total_engagement, total_clicks)
}

/**
 * Sync analytics for all recent published posts of a site
 */
export async function syncAllPostAnalytics(siteId: string): Promise<{
  synced: number
  errors: Array<{ postId: string; error: string }>
}> {
  // Implementation:
  // 1. Fetch published posts from last 30 days with their publish_log entries
  // 2. For each post+account combination, call syncPostAnalytics()
  // 3. Return results
}
```

---

## Task 2: Create Analytics Cron Route

### Create `src/app/api/social/sync/route.ts`

```typescript
/**
 * Analytics Sync Cron Route
 * 
 * PHASE SM-03: Called every hour by Vercel Cron to sync analytics
 * Syncs daily analytics for all active accounts across all sites
 */

// Implementation:
// 1. Verify cron authentication (CRON_SECRET or Vercel Authorization header)
// 2. Fetch all sites with active social accounts
// 3. For each site:
//    a. Call syncSiteAnalytics(siteId) for daily account metrics
//    b. Call syncAllPostAnalytics(siteId) for post-level metrics
// 4. Return summary: { sites: N, accounts: N, posts: N, errors: [...] }
```

### Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/social/sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Merge with existing vercel.json crons — do NOT overwrite.**

---

## Task 3: Calculate Optimal Posting Times

### Create `src/modules/social-media/lib/optimal-times-service.ts`

```typescript
'use server'

/**
 * Optimal Posting Times Calculator
 * 
 * PHASE SM-03: Analyzes historical post performance data
 * to determine the best times to post for each account.
 */

import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TIMEZONE } from '@/lib/locale-config'

/**
 * Calculate optimal posting times for an account
 * Based on historical post_analytics data
 */
export async function calculateOptimalTimes(accountId: string): Promise<{ success: boolean; error?: string }> {
  // Implementation:
  // 1. Fetch all post_analytics for this account from last 90 days
  // 2. Get the published_at time for each post
  // 3. Group by day_of_week (0-6) and hour (0-23)
  // 4. For each time slot, calculate:
  //    - Average engagement_rate across posts published at that time
  //    - Average reach
  //    - Combined score = (engagement_weight * engagement) + (reach_weight * reach)
  //    - Sample size = number of posts
  //    - Confidence = min(sample_size / 10, 1.0) → need at least 10 posts for full confidence
  // 5. Normalize scores to 0-100 range
  // 6. Upsert into social_optimal_times
  // 7. If not enough data (< 5 posts), use platform-specific defaults:
  //    - General: Weekdays 9-11am, 1-3pm local time
  //    - Instagram: Tue, Wed, Fri 11am
  //    - Twitter: Mon-Fri 8am, 12pm, 5pm
  //    - LinkedIn: Tue-Thu 9am-12pm
  //    - Facebook: Wed 11am, Fri 10-11am
}

/**
 * Get the best times to post for an account
 * Returns top 5 time slots sorted by combined_score
 */
export async function getBestPostingTimes(accountId: string): Promise<{
  times: Array<{
    dayOfWeek: number
    hour: number
    combinedScore: number
    confidence: number
  }>
  error?: string
}> {
  // Implementation:
  // 1. Fetch from social_optimal_times for this account
  // 2. Sort by combined_score desc
  // 3. Return top 5 (or top N)
  // 4. If no data, calculate first with calculateOptimalTimes()
}
```

---

## Task 4: Update Module Analytics Actions — Real Data

### Modify `src/modules/social-media/actions/analytics-actions.ts`

**Replace ALL stub implementations with real data queries:**

1. **`getAnalyticsOverview(siteId)`** — Replace hardcoded `impressionChange: 0, engagementChange: 0`:
   - Query `social_analytics_daily` for last 30 days, sum by metric
   - Compare with previous 30 days for % change
   - Query `social_accounts` for total followers
   - Query `social_post_analytics` for top posts
   - Build platform breakdown from per-account data

2. **`getDailyAnalytics(siteId, options)`** — Replace empty return:
   - Query `social_analytics_daily` grouped by date
   - Support date range filter
   - Support platform/account filter

3. **`getPostAnalytics(postId)`** — Already queries DB, should work with real data

4. **`getTopPosts(siteId, options)`** — Already queries DB, should work with real data

5. **`getOptimalTimes(siteId)`** — Replace stub:
   - Query `social_optimal_times` for all accounts
   - Aggregate across accounts for combined heatmap data

6. **`syncAnalytics(siteId)`** — Replace zeros:
   - Import and call `syncSiteAnalytics(siteId)` from analytics-sync-service
   - Import and call `syncAllPostAnalytics(siteId)` from analytics-sync-service

7. **`recalculateOptimalTimes(siteId)`** — Replace RPC stub:
   - Get all accounts for site
   - Call `calculateOptimalTimes(accountId)` for each

8. **`generateReportData(siteId, options)`** — Build real report:
   - Query analytics_daily for date range
   - Query post_analytics for top performers
   - Return structured report data

---

## Task 5: Update External Analytics Actions — Real Data

### Modify `src/lib/actions/social-analytics.ts`

**This file has 18 functions that ALL return empty/zero data.** Replace every function:

1. **`getPlatformOverview(siteId, timeRange)`** → Query `social_analytics_daily` grouped by platform
2. **`getTopContent(siteId, timeRange)`** → Query `social_post_analytics` joined with `social_posts`
3. **`getEngagementMetrics(siteId, timeRange)`** → Query `social_analytics_daily` summing engagement fields
4. **`getReachMetrics(siteId, timeRange)`** → Query `social_analytics_daily` summing reach/impressions
5. **`getAudienceGrowth(siteId, timeRange)`** → Query `social_analytics_daily` for follower changes over time
6. **`getOptimalTimes(siteId)`** → Query `social_optimal_times` table
7. **All other functions** → Same pattern: query real tables, aggregate, return typed data

**Key patterns:**
- Use `createClient()` from `@/lib/supabase/server`
- Cast supabase as any for table access: `(supabase as any).from('social_analytics_daily')`
- Convert `timeRange` ('7d', '30d', '90d') to date filter
- Return typed data matching `src/types/social-analytics.ts` interfaces
- Return empty arrays (not zeros/mocks) when no data exists
- Never generate random data or hardcode numbers

---

## Task 6: Remove Mock Data from SocialAnalyticsPage

### Modify `src/modules/social-media/components/SocialAnalyticsPage.tsx`

**Remove these hardcoded mock objects entirely:**
- `mockOverview` with followers: 12543, impressions: 89234, engagements: 4567, etc.
- `mockTopPosts` array
- `mockBestTimes` array

**Replace with:**
- Accept real data as props (from the server component page)
- Or fetch data using the module's analytics actions
- Show proper empty states when no data exists
- Remove the entire component if it's not used (the analytics page currently uses `SocialAnalyticsDashboardEnhanced`)

**Check which component the analytics page actually renders** — if it's always `SocialAnalyticsDashboardEnhanced`, then `SocialAnalyticsPage` can have its mock data deleted and replaced with a simple re-export or redirect.

---

## Task 7: Remove "Demo Data" Banner from Analytics Page

### Modify `src/app/(dashboard)/dashboard/sites/[siteId]/social/analytics/page.tsx`

Remove this banner:
```tsx
<div className="mb-4">
  <p className="text-sm text-muted-foreground">
    <strong>Note:</strong> Analytics currently display demo data for testing purposes.
  </p>
</div>
```

Replace with a conditional banner that only shows when no accounts are connected:
```tsx
// Show "Connect accounts to see analytics" when no accounts exist
// Show nothing when accounts are connected and data is flowing
```

---

## Task 8: Update Dashboard Analytics Cards

### Modify `src/modules/social-media/components/SocialDashboardEnhanced.tsx`

Ensure the dashboard overview cards show real analytics data:
- The `generateMockEngagementData` and `generateMockAudienceData` functions already return `[]` (correctly no mock data)
- Verify the metric cards (`SocialMetricCard`) show data from the `analytics` prop
- Ensure the engagement chart shows data from `social_analytics_daily` 
- Ensure the platform breakdown shows real platform-level metrics
- Verify trend indicators use real calculated % change (current period vs previous period)

---

## Task 9: Add "Sync Now" Button to Analytics Dashboard

### Modify `src/modules/social-media/components/SocialAnalyticsDashboardEnhanced.tsx`

Add a "Sync Analytics" button that:
1. Calls `syncAnalytics(siteId)` server action
2. Shows loading state during sync
3. On success, refreshes the page data (router.refresh or revalidation)
4. On failure, shows error toast

---

## Verification Checklist

```
□ npx tsc --noEmit passes with zero errors
□ All mock/hardcoded data removed from SocialAnalyticsPage
□ "Demo data" banner removed from analytics page
□ Sync cron route exists and is registered in vercel.json
□ Clicking "Sync Analytics" fetches real data from platform APIs
□ Daily analytics show real follower counts (for accounts with API access)
□ Engagement metrics show real likes/comments/shares
□ Post analytics show real per-post metrics
□ Optimal times calculated from real historical data
□ Analytics overview cards on dashboard show real numbers
□ Trend % changes are calculated (current vs previous period), not hardcoded
□ Platform breakdown shows correct per-platform metrics
□ External analytics components display real data
□ All 18 functions in social-analytics.ts return real DB data
□ Empty state shows "Connect accounts to see analytics" (not zeros pretending to be data)
□ Top posts section shows real top-performing posts with engagement metrics
□ No Math.random(), no mockOverview, no hardcoded numbers anywhere
□ Commit: git commit -m "feat(social-media): PHASE-SM-03: Analytics Sync Engine"
```

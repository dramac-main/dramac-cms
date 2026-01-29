# Social Media Module - Real-World User Journey

> **Reference Platforms**: Hootsuite, Sprout Social, Buffer  
> **Last Updated**: January 29, 2026  
> **Module**: EM-54 Social Media Management

---

## 🎯 Overview

This document walks through the **complete user journey** for DRAMAC's Social Media Management module, modeled after industry leaders Hootsuite and Sprout Social. Each step shows exactly what the user experiences and how the module connects with other DRAMAC systems.

---

## �️ FILE LOCATIONS QUICK REFERENCE

### Key Routes (Browser URLs)
| Feature | URL | Notes |
|---------|-----|-------|
| Marketplace | `/marketplace` | Browse/subscribe to modules |
| Site Dashboard | `/dashboard/sites/{siteId}` | Main site control |
| Modules Tab | `/dashboard/sites/{siteId}?tab=modules` | Enable/disable modules |
| Social Dashboard | `/dashboard/sites/{siteId}/social` | Main social home |
| Content Calendar | `/dashboard/sites/{siteId}/social/calendar` | Schedule posts |
| Post Composer | `/dashboard/sites/{siteId}/social/compose` | Create new post |
| Social Inbox | `/dashboard/sites/{siteId}/social/inbox` | Messages/comments |
| Account Management | `/dashboard/sites/{siteId}/social/accounts` | Connect/manage accounts |
| Site Settings | `/dashboard/sites/{siteId}/settings` | Site config |

### Key Source Files
| File | Purpose |
|------|---------|
| `src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx` | Social nav & auth |
| `src/app/(dashboard)/dashboard/sites/[siteId]/social/page.tsx` | Dashboard page |
| `src/app/(dashboard)/dashboard/sites/[siteId]/social/calendar/page.tsx` | Calendar page |
| `src/app/(dashboard)/dashboard/sites/[siteId]/social/compose/page.tsx` | Composer page |
| `src/app/(dashboard)/dashboard/sites/[siteId]/social/inbox/page.tsx` | Inbox page |
| `src/app/(dashboard)/dashboard/sites/[siteId]/social/accounts/page.tsx` | Accounts page |
| `src/modules/social-media/components/SocialDashboard.tsx` | Dashboard UI |
| `src/modules/social-media/components/SocialDashboardWrapper.tsx` | Dashboard client wrapper |
| `src/modules/social-media/components/ContentCalendar.tsx` | Calendar UI |
| `src/modules/social-media/components/ContentCalendarWrapper.tsx` | Calendar client wrapper |
| `src/modules/social-media/components/PostComposer.tsx` | Composer UI |
| `src/modules/social-media/components/PostComposerWrapper.tsx` | Composer client wrapper |
| `src/modules/social-media/components/SocialInbox.tsx` | Inbox UI |
| `src/modules/social-media/components/SocialInboxWrapper.tsx` | Inbox client wrapper |
| `src/modules/social-media/actions/account-actions.ts` | Account CRUD |
| `src/modules/social-media/actions/post-actions.ts` | Post CRUD |
| `src/modules/social-media/actions/analytics-actions.ts` | Analytics data |
| `src/modules/social-media/actions/inbox-actions.ts` | Inbox data |
| `src/components/sites/site-modules-tab.tsx` | Module toggle UI |
| `src/lib/actions/sites.ts` | `getSiteEnabledModules()` |

---

## �📋 Table of Contents

1. [Module Installation](#1-module-installation)
2. [First-Time Setup](#2-first-time-setup)
3. [Connecting Social Accounts](#3-connecting-social-accounts)
4. [Creating Your First Post](#4-creating-your-first-post)
5. [Using the Content Calendar](#5-using-the-content-calendar)
6. [Managing the Social Inbox](#6-managing-the-social-inbox)
7. [Viewing Analytics](#7-viewing-analytics)
8. [Campaign Management](#8-campaign-management)
9. [Team Collaboration](#9-team-collaboration)
10. [Integration with Other Modules](#10-integration-with-other-modules)

---

## 1. Module Installation

### User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENCY OWNER/ADMIN                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Navigate to /marketplace                                            │
│     └── Browse module categories                                        │
│     └── Find "Social Media Management" module                           │
│                                                                         │
│  2. Click "Subscribe" (free) or "Purchase" (paid)                       │
│     └── Subscription goes to `agency_module_subscriptions` table        │
│     └── Agency can now enable this module on any site                   │
│                                                                         │
│  3. Go to Site Dashboard → Modules tab                                  │
│     └── Toggle ON "Social Media Management"                             │
│     └── Creates record in `site_module_installations`                   │
│     └── Module is now ACTIVE for this site                              │
│                                                                         │
│  4. "Social" tab appears in site navigation                             │
│     └── Click "Open" to enter Social Media module                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Flow

```sql
-- Step 1: Agency subscribes to module
INSERT INTO agency_module_subscriptions (agency_id, module_id, status)
VALUES ('agency-uuid', 'social-media-module-uuid', 'active');

-- Step 2: Agency enables on specific site
INSERT INTO site_module_installations (site_id, module_id, is_enabled, enabled_at)
VALUES ('site-uuid', 'social-media-module-uuid', true, NOW());
```

### URL Navigation

| Step | URL | Description |
|------|-----|-------------|
| Browse Marketplace | `/marketplace` | Find Social Media module |
| Subscribe | `/marketplace/v2?module=social-media` | Subscribe to module |
| Site Modules | `/dashboard/sites/{siteId}?tab=modules` | Enable for site |
| Enter Module | `/dashboard/sites/{siteId}/social` | Social dashboard |

### 📍 WHERE TO FIND IT (Source Code)

| Feature | File Location |
|---------|---------------|
| **Marketplace Page** | `src/app/(dashboard)/marketplace/page.tsx` |
| **Module Subscribe Logic** | `src/hooks/use-site-modules.ts` → `useEnableSiteModule()` |
| **Site Modules Tab** | `src/components/sites/site-modules-tab.tsx` |
| **Module Toggle Switch** | `site-modules-tab.tsx` line ~65 → `handleToggle()` |
| **Module Access Check** | `src/lib/actions/sites.ts` → `isModuleEnabledForSite()` |
| **Social Button on Site Page** | `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` line ~85-100 |

**To make module FREE for testing**, run in Supabase SQL Editor:
```sql
UPDATE modules_v2 SET pricing_type = 'free', base_price = 0 WHERE slug = 'social-media';
```

---

## 2. First-Time Setup

### 📍 WHERE TO FIND IT

| Feature | File Location |
|---------|---------------|
| **Social Layout (Nav + Auth)** | `src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx` |
| **Dashboard Page** | `src/app/(dashboard)/dashboard/sites/[siteId]/social/page.tsx` |
| **Dashboard Component** | `src/modules/social-media/components/SocialDashboard.tsx` |
| **Onboarding UI (no accounts)** | `SocialDashboard.tsx` lines 135-200 |

### What the User Sees

When entering the Social Media module for the first time, the user lands on the **Dashboard** page with:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Site    SOCIAL MEDIA                          [+ New Post]   │
├─────────────────────────────────────────────────────────────────────────┤
│ [Dashboard] [Calendar] [Compose] [Inbox]                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  🎉 Welcome to Social Media Management!                          │ │
│  │                                                                   │ │
│  │  Get started by connecting your first social account.            │ │
│  │                                                                   │ │
│  │  [Connect Facebook] [Connect Instagram] [Connect Twitter/X]      │ │
│  │  [Connect LinkedIn] [Connect TikTok]    [Connect YouTube]        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Why Connect Accounts?                                                  │
│  • Post to multiple platforms from one place                           │
│  • Schedule content weeks in advance                                   │
│  • Track analytics across all platforms                                │
│  • Manage comments, DMs, and mentions in one inbox                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Onboarding Checklist

The module tracks onboarding progress:

- [ ] Connect at least 1 social account
- [ ] Create your first post
- [ ] Schedule a post for the future
- [ ] Explore the content calendar
- [ ] Set up team permissions (optional)

---

## 3. Connecting Social Accounts

### 📍 WHERE TO FIND IT

| Feature | File Location |
|---------|---------------|
| **Account Actions (CRUD)** | `src/modules/social-media/actions/account-actions.ts` |
| **Create Account** | `account-actions.ts` → `createSocialAccount()` |
| **Get All Accounts** | `account-actions.ts` → `getSocialAccounts()` |
| **Update Account Status** | `account-actions.ts` → `updateAccountStatus()` |
| **Disconnect Account** | `account-actions.ts` → `disconnectSocialAccount()` |
| **Refresh Token** | `account-actions.ts` → `refreshAccountToken()` |
| **Account Types/Platforms** | `src/modules/social-media/types/index.ts` |
| **Platform Config (icons/colors)** | `types/index.ts` → `PLATFORM_CONFIGS` |

**Database Table**: `social_accounts`

### OAuth Flow (Platform-by-Platform)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONNECT ACCOUNT FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User clicks "Connect Facebook"                                         │
│      │                                                                  │
│      ▼                                                                  │
│  Redirect to Facebook OAuth                                             │
│  - User logs in to Facebook                                             │
│  - Grants permissions (pages_manage_posts, instagram_basic, etc.)       │
│      │                                                                  │
│      ▼                                                                  │
│  Facebook redirects back with auth code                                 │
│  → /api/social/oauth/callback?code=xxx&state=xxx                        │
│      │                                                                  │
│      ▼                                                                  │
│  DRAMAC exchanges code for access token                                 │
│  - Stores in `social_accounts` table                                    │
│  - Fetches account info (name, avatar, followers)                       │
│      │                                                                  │
│      ▼                                                                  │
│  Account appears in dashboard with status "Active ✓"                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supported Platforms

| Platform | Account Types | Features |
|----------|--------------|----------|
| **Facebook** | Pages, Groups, Profiles | Posts, Stories, Reels, Insights |
| **Instagram** | Business, Creator | Feed, Stories, Reels, Carousels |
| **Twitter/X** | Profiles | Tweets, Threads, Analytics |
| **LinkedIn** | Personal, Company Pages | Posts, Articles, Analytics |
| **TikTok** | Business | Videos, Analytics |
| **YouTube** | Channels | Videos, Shorts, Comments |
| **Pinterest** | Business | Pins, Boards, Analytics |
| **Threads** | Profiles | Posts, Replies |
| **Bluesky** | Profiles | Posts |
| **Mastodon** | Profiles | Posts |

### Connected Accounts View

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONNECTED ACCOUNTS                                    [+ Add Account]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📘 My Business Page              Facebook Page     ✓ Active    │   │
│  │    @mybusinesspage               12.5K followers              │   │
│  │                                  Last synced: 2 mins ago       │   │
│  │                                  [Refresh] [Disconnect]        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📷 @mycompany_official          Instagram Business  ✓ Active   │   │
│  │    mycompany_official            8.2K followers                │   │
│  │                                  Last synced: 5 mins ago       │   │
│  │                                  [Refresh] [Disconnect]        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🐦 @mycompany                   Twitter/X          ⚠️ Expiring │   │
│  │    mycompany                     5.1K followers                │   │
│  │                                  Token expires in 3 days       │   │
│  │                                  [Reconnect] [Disconnect]      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Creating Your First Post

### 📍 WHERE TO FIND IT

| Feature | File Location |
|---------|---------------|
| **Compose Page Route** | `src/app/(dashboard)/dashboard/sites/[siteId]/social/compose/page.tsx` |
| **Post Composer Component** | `src/modules/social-media/components/PostComposer.tsx` |
| **Post Composer Wrapper** | `src/modules/social-media/components/PostComposerWrapper.tsx` |
| **Post Actions (CRUD)** | `src/modules/social-media/actions/post-actions.ts` |
| **Create Post** | `post-actions.ts` → `createPost()` |
| **Update Post** | `post-actions.ts` → `updatePost()` |
| **Delete Post** | `post-actions.ts` → `deletePost()` |
| **Publish Post** | `post-actions.ts` → `publishPost()` |
| **Schedule Post** | `post-actions.ts` → `schedulePost()` |
| **Character Limits** | `PostComposer.tsx` → `PLATFORM_LIMITS` constant |

**Database Table**: `social_posts`

**URL**: `/dashboard/sites/{siteId}/social/compose`

### Post Composer (Like Hootsuite/Sprout Social)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CREATE POST                                                [× Close]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SELECT ACCOUNTS TO POST TO:                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [✓] 📘 My Business Page    [✓] 📷 @mycompany_official          │   │
│  │ [✓] 🐦 @mycompany          [ ] 💼 My Company - LinkedIn         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  COMPOSE YOUR MESSAGE:                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Exciting news! 🎉 We're launching our new product line        │   │
│  │  next week. Stay tuned for exclusive previews and special      │   │
│  │  early-bird pricing!                                           │   │
│  │                                                                 │   │
│  │  #newproduct #launch #excited                                  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📊 Character Count: Twitter 142/280 ✓ | Instagram 156/2200 ✓         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [📷 Add Image] [🎬 Add Video] [😊 Emoji] [# Hashtags] [🔗 Link]│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  MEDIA ATTACHMENTS:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [product-image.jpg] ×    [promo-video.mp4] ×                   │   │
│  │  Preview: 🖼️              Preview: 🎬                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  PLATFORM-SPECIFIC CONTENT (Optional):                                  │
│  [Facebook ▼] [Instagram ▼] [Twitter ▼]                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Twitter Version (shorter):                                      │   │
│  │                                                                 │   │
│  │ 🎉 New product line launching next week! Early-bird pricing    │   │
│  │ for followers. #newproduct #launch                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  SCHEDULING:                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ( ) Post Now                                                    │   │
│  │ (•) Schedule for Later                                          │   │
│  │     📅 February 5, 2026    🕐 10:00 AM EST                     │   │
│  │     💡 Best time to post: 10:00 AM (highest engagement)        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  FIRST COMMENT (Instagram only):                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Add additional hashtags in first comment...                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Save as Draft]                   [Schedule Post] [Publish Now]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Features (Like Hootsuite/Sprout Social)

1. **Multi-Platform Posting** - Select multiple accounts, post to all at once
2. **Platform-Specific Content** - Customize content per platform (shorter for Twitter)
3. **Character Count Validation** - Real-time limits per platform
4. **Media Attachments** - Images, videos, GIFs with preview
5. **Scheduling** - Pick date/time or use AI-suggested best times
6. **First Comment** - Add hashtags as first comment (Instagram best practice)
7. **Draft Saving** - Save and edit later

### Post Statuses

| Status | Description | Color |
|--------|-------------|-------|
| `draft` | Saved but not scheduled | Gray |
| `scheduled` | Scheduled for future | Blue |
| `pending_approval` | Awaiting team approval | Yellow |
| `publishing` | Currently being published | Orange |
| `published` | Successfully posted | Green |
| `failed` | Failed to publish | Red |
| `deleted` | Removed | - |

---

## 5. Using the Content Calendar

### 📍 WHERE TO FIND IT

| Feature | File Location |
|---------|---------------|
| **Calendar Page Route** | `src/app/(dashboard)/dashboard/sites/[siteId]/social/calendar/page.tsx` |
| **Calendar Component** | `src/modules/social-media/components/ContentCalendar.tsx` |
| **Calendar Wrapper** | `src/modules/social-media/components/ContentCalendarWrapper.tsx` |
| **Get Posts for Calendar** | `post-actions.ts` → `getPosts(siteId, { limit: 500 })` |
| **Reschedule Post** | `post-actions.ts` → `updatePost()` with new `scheduled_at` |

**Database Table**: `social_posts` (uses `scheduled_at` field)

**URL**: `/dashboard/sites/{siteId}/social/calendar`

### Calendar View (Like Hootsuite)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTENT CALENDAR                              [Month ▼] [+ New Post]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ◀ January 2026                                          February 2026 ▶│
├─────────────────────────────────────────────────────────────────────────┤
│ FILTERS: [All Platforms ▼] [All Statuses ▼] [All Labels ▼]            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Sun      Mon      Tue      Wed      Thu      Fri      Sat             │
│ ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐       │
│ │   26   │   27   │   28   │   29   │ TODAY  │   31   │    1   │       │
│ │        │        │ 📘2    │        │ 📷1    │        │ 📘1    │       │
│ │        │        │ 📷1    │        │ 🐦1    │        │        │       │
│ ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤       │
│ │    2   │    3   │    4   │    5   │    6   │    7   │    8   │       │
│ │ 📘1    │ 💼1    │        │ 🎯     │ 📷1    │        │        │       │
│ │        │        │        │ LAUNCH │ 🐦1    │        │        │       │
│ ├────────┼────────┼────────┼────────┼────────┼────────┼────────┤       │
│ │    9   │   10   │   11   │   12   │   13   │   14   │   15   │       │
│ │        │ ❤️     │        │        │        │        │        │       │
│ │        │ V-DAY  │        │        │        │        │        │       │
│ └────────┴────────┴────────┴────────┴────────┴────────┴────────┘       │
│                                                                         │
│ LEGEND: 📘 Facebook  📷 Instagram  🐦 Twitter  💼 LinkedIn  🎯 Campaign│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Calendar Features

1. **View Modes**: Month, Week, Day, List
2. **Drag-and-Drop**: Reschedule posts by dragging
3. **Color Coding**: Posts colored by platform or status
4. **Quick Create**: Click on a day to create a post for that date
5. **Filtering**: Filter by platform, status, campaign, or label
6. **Calendar Events**: Add campaigns, holidays, special events
7. **Gap Detection**: Highlight days with no scheduled content

### Day Detail View

Clicking a day shows all scheduled posts:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FEBRUARY 5, 2026                                                [×]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  10:00 AM                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📘📷🐦 Product Launch Announcement                             │   │
│  │                                                                 │   │
│  │ "Exciting news! 🎉 We're launching our new product..."        │   │
│  │                                                                 │   │
│  │ Status: ⏰ Scheduled                                           │   │
│  │ Campaign: Product Launch 2026                                   │   │
│  │                                                                 │   │
│  │ [Edit] [Duplicate] [Delete] [Publish Now]                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  2:00 PM                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📷 Behind-the-scenes Story                                     │   │
│  │                                                                 │   │
│  │ "Take a peek at our team getting ready for the big launch..."  │   │
│  │                                                                 │   │
│  │ Status: 📝 Draft (needs scheduling)                            │   │
│  │                                                                 │   │
│  │ [Edit] [Schedule] [Delete]                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [+ Add Post for This Day]                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Managing the Social Inbox

### 📍 WHERE TO FIND IT

| Feature | File Location |
|---------|---------------|
| **Inbox Page Route** | `src/app/(dashboard)/dashboard/sites/[siteId]/social/inbox/page.tsx` |
| **Inbox Component** | `src/modules/social-media/components/SocialInbox.tsx` |
| **Inbox Actions** | `src/modules/social-media/actions/inbox-actions.ts` |
| **Get Inbox Items** | `inbox-actions.ts` → `getInboxItems()` |
| **Get Inbox Counts** | `inbox-actions.ts` → `getInboxCounts()` |
| **Get Saved Replies** | `inbox-actions.ts` → `getSavedReplies()` |
| **Reply to Message** | `inbox-actions.ts` → `replyToInboxItem()` |
| **Mark as Read** | `inbox-actions.ts` → `markInboxItemRead()` |
| **Archive Item** | `inbox-actions.ts` → `archiveInboxItem()` |

**Database Tables**: `social_inbox_items`, `social_saved_replies`

**URL**: `/dashboard/sites/{siteId}/social/inbox`

### Unified Inbox (Like Sprout Social Smart Inbox)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SOCIAL INBOX                                   [All Accounts ▼] 🔔 12  │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┬─────────────────────────────────────┐ │
│ │ MESSAGES                     │ CONVERSATION                        │ │
│ ├─────────────────────────────┼─────────────────────────────────────┤ │
│ │ [All] [Unread] [Starred]    │                                     │ │
│ │                              │  📘 John Smith                      │ │
│ │ ┌───────────────────────┐   │  @johnsmith · Facebook              │ │
│ │ │ 🔵 📘 John Smith      │◀──│                                     │ │
│ │ │ "Love your product!"  │   │  ─────────────────────────────────  │ │
│ │ │ Comment · 5m ago      │   │                                     │ │
│ │ └───────────────────────┘   │  💬 "Love your new product! When    │ │
│ │                              │      will it be available in the    │ │
│ │ ┌───────────────────────┐   │      UK?"                           │ │
│ │ │ ○ 📷 Sarah Lee        │   │                                     │ │
│ │ │ "Where can I buy..."  │   │  5 minutes ago · ❤️ 12 likes        │ │
│ │ │ DM · 12m ago          │   │                                     │ │
│ │ └───────────────────────┘   │  ─────────────────────────────────  │ │
│ │                              │                                     │ │
│ │ ┌───────────────────────┐   │  YOUR REPLY:                        │ │
│ │ │ ○ 🐦 @techreview       │   │  ┌───────────────────────────────┐ │ │
│ │ │ "@mycompany Check..."  │   │  │ Thanks John! We're launching  │ │ │
│ │ │ Mention · 1h ago       │   │  │ in the UK next month. Sign up │ │ │
│ │ └───────────────────────┘   │  │ for early access at...         │ │ │
│ │                              │  └───────────────────────────────┘ │ │
│ │ ┌───────────────────────┐   │                                     │ │
│ │ │ ○ 💼 Mike Business    │   │  [💾 Saved Replies ▼] [😊] [📎]   │ │
│ │ │ "Partnership inquiry" │   │                                     │ │
│ │ │ DM · 3h ago           │   │  [Mark as Read] [Archive] [Reply]  │ │
│ │ └───────────────────────┘   │                                     │ │
│ │                              │                                     │ │
│ │ Load more...                │                                     │ │
│ └─────────────────────────────┴─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Inbox Features

1. **Unified View**: All platforms in one inbox
2. **Message Types**:
   - Comments on posts
   - Direct messages (DMs)
   - @Mentions
   - Reviews (Facebook, Google)
3. **Quick Actions**:
   - Reply directly
   - Mark as read
   - Archive
   - Assign to team member
   - Flag for follow-up
   - Mark as spam
4. **Saved Replies**: Pre-written response templates
5. **Filters**: By platform, type, read status, assigned user
6. **Keyboard Shortcuts**: For power users

### Saved Replies

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SAVED REPLIES                                        [+ New Reply]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📁 Customer Support                                                   │
│  ├── "Thank you for reaching out! We'll respond within 24 hours."     │
│  ├── "Sorry to hear about this issue. Please DM us your order #."     │
│  └── "Great question! You can find more info at [link]."              │
│                                                                         │
│  📁 Sales Inquiries                                                    │
│  ├── "Thanks for your interest! Here's our pricing: [link]"           │
│  └── "Let's schedule a demo! Book here: [calendar-link]"              │
│                                                                         │
│  📁 General                                                            │
│  ├── "Thanks for the love! 💙"                                        │
│  └── "We appreciate your feedback!"                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Viewing Analytics

### 📍 WHERE TO FIND IT

| Feature | File Location |
|---------|---------------|
| **Analytics Actions** | `src/modules/social-media/actions/analytics-actions.ts` |
| **Get Analytics Overview** | `analytics-actions.ts` → `getAnalyticsOverview()` |
| **Get Account Analytics** | `analytics-actions.ts` → `getAccountAnalytics()` |
| **Get Post Analytics** | `analytics-actions.ts` → `getPostAnalytics()` |
| **Get Best Times** | `analytics-actions.ts` → `getBestTimes()` |
| **Analytics Display** | `SocialDashboard.tsx` → stats cards at top |
| **StatCard Component** | `SocialDashboard.tsx` → `StatCard` function |

**Database Tables**: `social_analytics_daily`, `social_post_analytics`, `social_best_times`

**Note**: Analytics are displayed on the main Dashboard page (`/dashboard/sites/{siteId}/social`)

### Analytics Dashboard (Like Sprout Social)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ANALYTICS                         Last 7 Days ▼    [Export Report]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  OVERVIEW                                                               │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐        │
│  │ Followers    │ Impressions  │ Engagements  │ Eng. Rate    │        │
│  │   25,823     │   142,567    │    8,234     │    5.8%      │        │
│  │   ▲ 2.4%     │    ▲ 15%     │    ▲ 8.2%    │   ▲ 0.3%     │        │
│  └──────────────┴──────────────┴──────────────┴──────────────┘        │
│                                                                         │
│  ENGAGEMENT BREAKDOWN                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ❤️ Likes: 5,432    💬 Comments: 1,234    🔄 Shares: 892       │   │
│  │  💾 Saves: 456      🔗 Clicks: 1,234      📺 Views: 12,345     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ENGAGEMENT OVER TIME                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                            ▄    │   │
│  │                              ▄▄   ▄▄                     ▄██    │   │
│  │           ▄▄   ▄▄          ████  ███   ▄▄▄            ▄████    │   │
│  │  ▄▄▄    ████  ████   ▄▄▄  █████ █████  ███   ▄▄▄   ▄██████    │   │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│  │  Mon     Tue    Wed    Thu    Fri    Sat    Sun               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  BY PLATFORM                                                            │
│  ┌──────────────────────────────────┐                                  │
│  │ 📘 Facebook     ████████████ 45% │                                  │
│  │ 📷 Instagram    █████████    35% │                                  │
│  │ 🐦 Twitter      ████         15% │                                  │
│  │ 💼 LinkedIn     ██            5% │                                  │
│  └──────────────────────────────────┘                                  │
│                                                                         │
│  TOP PERFORMING POSTS                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. "Exciting news! 🎉..."     📷  8.2K impressions  12% eng    │   │
│  │ 2. "Behind the scenes..."      📷  6.1K impressions   9% eng    │   │
│  │ 3. "Customer spotlight..."     📘  5.8K impressions   7% eng    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  BEST TIMES TO POST                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Based on your audience engagement patterns:                     │   │
│  │                                                                 │   │
│  │ Monday:   10:00 AM, 2:00 PM, 7:00 PM                           │   │
│  │ Tuesday:  9:00 AM, 1:00 PM, 6:00 PM                            │   │
│  │ Wednesday: 11:00 AM, 3:00 PM, 8:00 PM (Best day!)              │   │
│  │ ...                                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Analytics Features

1. **Overview Metrics**: Followers, impressions, engagements, engagement rate
2. **Trend Analysis**: Compare to previous period
3. **Platform Breakdown**: See which platforms perform best
4. **Top Posts**: Identify your best content
5. **Best Times**: AI-suggested optimal posting times
6. **Growth Tracking**: Follower growth over time
7. **Export Reports**: PDF/CSV for stakeholders

---

## 8. Campaign Management

### Campaign Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CAMPAIGNS                                              [+ New Campaign] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ACTIVE CAMPAIGNS                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎯 Product Launch 2026                                         │   │
│  │    Feb 1 - Feb 28, 2026                      Status: Active    │   │
│  │                                                                 │   │
│  │    Goals:                    Progress:                          │   │
│  │    • 50K impressions        ████████░░ 78% (39K)              │   │
│  │    • 2K engagements         █████░░░░░ 52% (1.04K)            │   │
│  │    • 500 clicks             ███░░░░░░░ 34% (170)              │   │
│  │                                                                 │   │
│  │    Posts: 12 scheduled, 8 published                            │   │
│  │    Hashtags: #productlaunch #newproduct #2026                  │   │
│  │                                                                 │   │
│  │    [View Details] [Edit] [Pause]                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💚 Valentine's Day Sale                                        │   │
│  │    Feb 8 - Feb 14, 2026                      Status: Upcoming  │   │
│  │    Posts: 6 scheduled                                           │   │
│  │    [View Details] [Edit]                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  PAST CAMPAIGNS                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎄 Holiday Sale 2025          Dec 15 - Dec 31    ✓ Completed   │   │
│  │    Results: 120K impressions, 8K engagements, 2.1K clicks      │   │
│  │    [View Report]                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Campaign Features

1. **Goal Setting**: Define impressions, engagements, clicks targets
2. **Progress Tracking**: Visual progress toward goals
3. **Post Grouping**: All campaign posts in one view
4. **Hashtag Tracking**: Monitor campaign hashtag performance
5. **UTM Parameters**: Automatic UTM tagging for links
6. **Campaign Reports**: Exportable performance reports

### 📍 WHERE TO FIND IT (Campaigns)

| Feature | File Location |
|---------|---------------|
| **Campaign Types** | `src/modules/social-media/types/index.ts` → `Campaign` |
| **Campaign Status** | `types/index.ts` → `CampaignStatus` type |
| **Campaign Goals** | `types/index.ts` → `CampaignGoals` type |

**Database Table**: `social_campaigns`

**Note**: Campaign UI is partially implemented. Posts can be assigned to campaigns via the `campaign_id` field.

---

## 9. Team Collaboration

### 📍 WHERE TO FIND IT (Team/Approvals)

| Feature | File Location |
|---------|---------------|
| **Team Permissions Types** | `src/modules/social-media/types/index.ts` → `TeamPermissions` |
| **Pending Approvals Count** | `post-actions.ts` → `getPosts(siteId, { status: 'pending_approval' })` |
| **Approve Post** | `post-actions.ts` → `approvePost()` |
| **Reject Post** | `post-actions.ts` → `rejectPost()` |
| **Post Status** | `types/index.ts` → `PostStatus` includes `pending_approval` |

**Database Table**: `social_team_permissions`

**Note**: Team permissions are database-ready but UI not fully implemented yet.

### Approval Workflows (Like Sprout Social)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PENDING APPROVALS                                    3 posts waiting   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ POST PENDING APPROVAL                                           │   │
│  │                                                                 │   │
│  │ Submitted by: Sarah (Content Creator)                           │   │
│  │ Submitted at: Jan 29, 2026 at 2:34 PM                          │   │
│  │                                                                 │   │
│  │ Target: 📘 Facebook, 📷 Instagram                              │   │
│  │ Scheduled: Feb 5, 2026 at 10:00 AM                             │   │
│  │                                                                 │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ "Exciting news! 🎉 We're launching our new product line..." │ │   │
│  │ │                                                             │ │   │
│  │ │ [product-image.jpg]                                         │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  │                                                                 │   │
│  │ [✓ Approve]  [✗ Reject]  [💬 Request Changes]                 │   │
│  │                                                                 │   │
│  │ Add note (optional):                                            │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ Great post! Approved for publishing.                        │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Team Permissions

| Role | Can Create | Can Schedule | Can Publish | Can Approve | Can Manage Accounts |
|------|------------|--------------|-------------|-------------|---------------------|
| Viewer | ❌ | ❌ | ❌ | ❌ | ❌ |
| Content Creator | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publisher | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manager | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 10. Integration with Other Modules

### 📍 WHERE TO FIND IT (Integrations)

| Integration | Related Module Routes |
|-------------|----------------------|
| **CRM Module** | `/dashboard/sites/{siteId}/crm-module` |
| **Automation Module** | `/dashboard/sites/{siteId}/automation` |
| **AI Agents Module** | `/dashboard/sites/{siteId}/ai-agents` |
| **Booking Module** | `/dashboard/sites/{siteId}/booking` |
| **Blog** | `/dashboard/sites/{siteId}?tab=blog` |

| Feature | File Location |
|---------|---------------|
| **Module Events (Triggers)** | `src/modules/social-media/manifest.ts` → `MODULE_EVENTS` |
| **Module Actions** | `manifest.ts` → `MODULE_ACTIONS` |
| **Module Navigation** | `manifest.ts` → `MODULE_NAVIGATION` |
| **Module Permissions** | `manifest.ts` → `MODULE_PERMISSIONS` |
| **Module Metadata** | `manifest.ts` → `moduleMetadata` |

**Note**: Cross-module integrations are defined but require both modules to be enabled on the site.

### CRM Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SOCIAL → CRM INTEGRATION                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  When a social interaction occurs:                                      │
│                                                                         │
│  1. User comments on your post or DMs you                              │
│     ↓                                                                   │
│  2. Social Inbox receives the message                                  │
│     ↓                                                                   │
│  3. [Create CRM Contact] button appears                                │
│     ↓                                                                   │
│  4. Contact created in CRM with:                                       │
│     • Name from social profile                                         │
│     • Social handle as contact method                                  │
│     • Tag: "From Social Media"                                         │
│     • Note: Original message attached                                  │
│     ↓                                                                   │
│  5. Contact can be added to deals/pipeline                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Automation Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SOCIAL → AUTOMATION TRIGGERS                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Available Triggers:                                                    │
│  • social.post.published - When a post goes live                       │
│  • social.post.failed - When publishing fails                          │
│  • social.inbox.message - New message received                         │
│  • social.inbox.mention - Someone mentioned you                        │
│  • social.analytics.milestone - Reached follower milestone             │
│                                                                         │
│  Example Automations:                                                   │
│                                                                         │
│  1. "Notify team on Slack when post fails"                             │
│     Trigger: social.post.failed                                         │
│     Action: Send Slack message to #social-team                         │
│                                                                         │
│  2. "Create CRM task for DM inquiries"                                 │
│     Trigger: social.inbox.message (DM type)                            │
│     Action: Create CRM task "Follow up on social inquiry"              │
│                                                                         │
│  3. "Celebrate follower milestones"                                    │
│     Trigger: social.analytics.milestone (10K, 50K, 100K)               │
│     Action: Send team email + create celebratory post draft            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI Agents Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SOCIAL → AI AGENTS                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Available AI Agents:                                                   │
│                                                                         │
│  🤖 Content Writer Agent                                               │
│     • Generate post captions from prompts                              │
│     • Create platform-specific variations                              │
│     • Suggest hashtags based on content                                │
│                                                                         │
│  🤖 Reply Assistant Agent                                              │
│     • Suggest replies to common questions                              │
│     • Draft responses to negative feedback                             │
│     • Auto-categorize inbox messages                                   │
│                                                                         │
│  🤖 Analytics Insights Agent                                           │
│     • Summarize weekly performance                                     │
│     • Identify trends and patterns                                     │
│     • Recommend content strategy adjustments                           │
│                                                                         │
│  🤖 Scheduling Optimizer Agent                                         │
│     • Suggest best posting times                                       │
│     • Identify content gaps in calendar                                │
│     • Recommend post frequency adjustments                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Booking Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SOCIAL → BOOKING                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Scenario: Service Business Promotion                                  │
│                                                                         │
│  1. Create social post promoting a service                             │
│     "Book your consultation today! Link in bio."                       │
│     ↓                                                                   │
│  2. Add booking link to post                                           │
│     Links to: /book/{siteId}/consultation                              │
│     ↓                                                                   │
│  3. User clicks link and books appointment                             │
│     ↓                                                                   │
│  4. Booking creates notification                                       │
│     ↓                                                                   │
│  5. Automation sends thank-you DM via social                           │
│     "Thanks for booking! See you on Feb 10 at 2pm."                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Complete User Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│                          DRAMAC SOCIAL MEDIA MODULE                            │
│                          Complete User Journey Map                             │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐             │
│  │ INSTALL   │───▶│  CONNECT  │───▶│  CREATE   │───▶│ SCHEDULE  │             │
│  │ Module    │    │ Accounts  │    │  Content  │    │  Posts    │             │
│  └───────────┘    └───────────┘    └───────────┘    └─────┬─────┘             │
│                                                          │                    │
│       ┌──────────────────────────────────────────────────┘                    │
│       │                                                                       │
│       ▼                                                                       │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐             │
│  │ CALENDAR  │◀──▶│  PUBLISH  │───▶│  ENGAGE   │───▶│ ANALYZE   │             │
│  │ View/Edit │    │ to Social │    │   Inbox   │    │ Results   │             │
│  └───────────┘    └───────────┘    └───────────┘    └───────────┘             │
│       │                                    │               │                  │
│       │                                    │               │                  │
│       └──────────────┬─────────────────────┴───────────────┘                  │
│                      │                                                        │
│                      ▼                                                        │
│                ┌─────────────┐                                                │
│                │  OPTIMIZE   │                                                │
│                │  & Repeat   │                                                │
│                └─────────────┘                                                │
│                                                                                │
│  INTEGRATIONS:                                                                 │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐          │
│  │   CRM   │   │AUTOMATE │   │AI AGENTS│   │ BOOKING │   │  BLOG   │          │
│  │ Contacts│   │ Triggers│   │ Content │   │ Links   │   │ Promote │          │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘          │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Status

| Feature | Status | Source File | Notes |
|---------|--------|-------------|-------|
| Dashboard | ✅ Complete | `components/SocialDashboard.tsx` | With analytics overview + wrapper |
| Account Management | ✅ Complete | `social/accounts/page.tsx` | View, connect, manage accounts |
| Post Composer | ✅ Complete | `components/PostComposer.tsx` | Multi-platform support + wrapper |
| Content Calendar | ✅ Complete | `components/ContentCalendar.tsx` | Month/week/list views + wrapper |
| Social Inbox | ✅ Complete | `components/SocialInbox.tsx` | With saved replies + wrapper |
| Layout Navigation | ✅ Complete | `social/layout.tsx` | With active tab highlighting |
| Analytics | ✅ Complete | `actions/analytics-actions.ts` | With charts and trends |
| Account Connection | ⚠️ Mock Only | `actions/account-actions.ts` | OAuth flow not implemented |
| Campaigns | 🔄 Partial | `types/index.ts` | Basic structure only |
| Team Permissions | 🔄 Partial | `types/index.ts` | Database tables ready |
| CRM Integration | 📋 Planned | - | Hooks available |
| Automation Integration | 📋 Planned | `manifest.ts` | Triggers defined |
| AI Agents Integration | 📋 Planned | - | Agent types defined |

---

## 🔧 Known Issues & Next Steps

### Current Issues
1. **OAuth Not Implemented**: Account connection uses mock data (buttons show "coming soon" alert)
2. **Publishing Not Live**: Posts saved to DB but not sent to platforms
3. **Analytics Mock Data**: Real API integration needed
4. **Inbox Mock Data**: Not receiving real messages from platforms

### Next Steps
1. Implement real OAuth flows for each platform
2. Set up platform API integrations for publishing
3. Create webhook endpoints for receiving messages
4. Build analytics data sync jobs
5. Add real-time notifications

---

## 📁 Complete File Structure

```
src/modules/social-media/
├── index.ts                    # Module exports
├── manifest.ts                 # Module metadata, events, actions
├── actions/
│   ├── account-actions.ts      # Account CRUD operations
│   ├── post-actions.ts         # Post CRUD operations
│   ├── analytics-actions.ts    # Analytics data fetching
│   └── inbox-actions.ts        # Inbox/messaging operations
├── components/
│   ├── index.ts                # Component exports
│   ├── SocialDashboard.tsx     # Main dashboard UI
│   ├── SocialDashboardWrapper.tsx # Client wrapper
│   ├── ContentCalendar.tsx     # Calendar UI
│   ├── ContentCalendarWrapper.tsx # Client wrapper
│   ├── PostComposer.tsx        # Post creation UI
│   ├── PostComposerWrapper.tsx # Client wrapper
│   ├── SocialInbox.tsx         # Unified inbox UI
│   └── SocialInboxWrapper.tsx  # Client wrapper (NEW)
└── types/
    └── index.ts                # TypeScript types

src/app/(dashboard)/dashboard/sites/[siteId]/social/
├── layout.tsx                  # Social nav + auth check (with active states)
├── page.tsx                    # Dashboard route
├── accounts/
│   └── page.tsx               # Account management route (NEW)
├── calendar/
│   └── page.tsx               # Calendar route
├── compose/
│   └── page.tsx               # Composer route
└── inbox/
    └── page.tsx               # Inbox route
```

---

## 📞 Support & Documentation

| Resource | Location |
|----------|----------|
| **Phase Doc** | `phases/enterprise-modules/PHASE-EM-54-SOCIAL-MEDIA-MODULE.md` |
| **Database Schema** | `migrations/em-54-social-media-flat-tables.sql` |
| **Module Source** | `src/modules/social-media/` |
| **Route Pages** | `src/app/(dashboard)/dashboard/sites/[siteId]/social/` |
| **Module Types** | `src/modules/social-media/types/index.ts` |
| **Module Manifest** | `src/modules/social-media/manifest.ts` |

---

*Document created for DRAMAC CMS - Enterprise Module Marketplace Platform*

# PHASE SM-00: Social Media Module — Master Plan

**Module**: Social Media Management  
**Goal**: Transform the existing Supabase CRUD shell into a fully functional, production-ready social media management platform rivaling Sprout Social / Hootsuite  
**Status**: Planning Complete  
**Last Updated**: February 2026

---

## Current State Assessment

### What Exists (25% Complete)
- ✅ 13 database tables with RLS policies (flat `social_*` in public schema)
- ✅ ~877 lines of TypeScript types covering all entities
- ✅ 6 server action files (account, post, analytics, inbox, campaign, settings) — DB CRUD only
- ✅ 42 component files with polished UI shells
- ✅ 9 route pages with server→client wrapper pattern
- ✅ Module manifest with navigation, permissions, events, actions
- ✅ Platform configs for 10 social networks

### What's Missing (75% of the work)
- ❌ **Zero OAuth integration** — no account connection flow
- ❌ **Zero real publishing** — `publishPostNow()` generates fake IDs
- ❌ **Zero analytics sync** — `syncAnalytics()` writes zeros
- ❌ **Zero inbox sync** — no platform message/comment ingestion
- ❌ **Zero media storage** — composers create blob URLs only
- ❌ **Zero AI content** — no caption/hashtag/idea generation
- ❌ **4 missing route pages** (Posts, Media, Listening, Competitors)
- ❌ **Zero API routes** — manifest declares 8 groups, none exist
- ❌ **Mock data** in `SocialAnalyticsPage` (hardcoded followers: 12543, etc.)
- ❌ **No background jobs** — no scheduled post processor, no sync workers
- ❌ **No error boundaries** or retry logic
- ❌ **No tests**

---

## Phase Breakdown (9 Phases)

| Phase | Name | Independence | Connection Points | Est. Files |
|-------|------|-------------|-------------------|------------|
| **SM-01** | OAuth & Account Integration | Fully independent | Provides accounts for all other phases | ~15 |
| **SM-02** | Publishing Engine | Requires SM-01 accounts | Uses accounts, provides published posts | ~12 |
| **SM-03** | Analytics Sync Engine | Requires SM-01 accounts | Reads from accounts, writes analytics tables | ~10 |
| **SM-04** | Unified Inbox Engine | Requires SM-01 accounts | Reads from accounts, updates inbox tables | ~10 |
| **SM-05** | Media Library & Storage | Fully independent | Provides media URLs for SM-02 publishing | ~10 |
| **SM-06** | AI Content Engine | Fully independent | Used by composer UI for content generation | ~8 |
| **SM-07** | Missing Pages & Full Navigation | Independent (uses existing data) | Completes all 13 nav routes | ~12 |
| **SM-08** | Campaigns, Reporting & Calendar Enhancement | Independent (uses existing data) | Enhanced campaign analytics | ~10 |
| **SM-09** | Production Hardening & Cleanup | Run last | Final sweep, error boundaries, cleanup | ~15 |

### Dependency Graph
```
SM-01 (OAuth/Accounts) ──┬──> SM-02 (Publishing)
                         ├──> SM-03 (Analytics Sync)
                         └──> SM-04 (Inbox Sync)

SM-05 (Media Library)  ──────> Independent (used by composer)
SM-06 (AI Content)     ──────> Independent (used by composer)
SM-07 (Missing Pages)  ──────> Independent (renders existing DB data)
SM-08 (Campaigns)      ──────> Independent (renders existing DB data)
SM-09 (Hardening)      ──────> Run LAST (cleanup + error boundaries)
```

### Execution Order Recommendation
1. **SM-01** first (all platform integration depends on accounts)
2. **SM-05** + **SM-06** + **SM-07** (fully independent, can run in parallel)
3. **SM-02** (needs SM-01 accounts to exist)
4. **SM-03** + **SM-04** (need SM-01 accounts to exist)
5. **SM-08** (uses existing campaign data)
6. **SM-09** last (final cleanup)

---

## API Keys Required

Users will need to obtain these API credentials for full functionality:

| Platform | API/Developer Portal | Required Keys | Free Tier |
|----------|---------------------|---------------|-----------|
| **Facebook/Instagram** | [Meta for Developers](https://developers.facebook.com) | App ID, App Secret | ✅ Yes |
| **Twitter/X** | [Twitter Developer](https://developer.twitter.com) | API Key, API Secret, Bearer Token | ✅ Free (Basic) |
| **LinkedIn** | [LinkedIn Developer](https://developer.linkedin.com) | Client ID, Client Secret | ✅ Yes |
| **TikTok** | [TikTok for Developers](https://developers.tiktok.com) | Client Key, Client Secret | ✅ Yes |
| **YouTube** | [Google Cloud Console](https://console.cloud.google.com) | OAuth Client ID, Client Secret | ✅ Yes |
| **Pinterest** | [Pinterest Developer](https://developers.pinterest.com) | App ID, App Secret | ✅ Yes |
| **Threads** | [Meta for Developers](https://developers.facebook.com) | Same as Instagram (Meta API) | ✅ Yes |
| **Bluesky** | No developer portal needed | App Password (user-generated) | ✅ Yes |
| **Mastodon** | Instance-specific `/api/v1/apps` | Client ID, Client Secret | ✅ Yes |

### Environment Variables (to add to `.env.local`)
```env
# Facebook/Instagram (Meta)
META_APP_ID=
META_APP_SECRET=

# Twitter/X
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# YouTube (Google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Pinterest
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=

# Bluesky (no env vars needed — uses app passwords per-user)

# Mastodon (instance-specific, registered per-account)
```

---

## Global Rules for All Phases

### Code Patterns
1. **Server Actions** — All data mutations use `'use server'` directive, import `createClient` from `@/lib/supabase/server`
2. **Locale** — Import `DEFAULT_TIMEZONE`, `formatCurrency`, etc. from `@/lib/locale-config`
3. **Icons** — Use Lucide React icons, never emoji. Import from `lucide-react`
4. **Theming** — Use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`). No hardcoded hex colors
5. **Currency** — Always use `formatCurrency()` for money. Symbol is `K` (ZMW)
6. **Supabase** — Tables are in public schema prefixed with `social_*`. Use `(supabase as any).from('social_...')` pattern
7. **Types** — All types live in `src/modules/social-media/types/index.ts`. Import from `../types` or `@/modules/social-media/types`
8. **Components** — Use shadcn/ui (Card, Button, Badge, Dialog, etc.) from `@/components/ui/*`
9. **Toast** — Use `sonner`'s `toast` for notifications
10. **Animation** — Use `framer-motion` for transitions
11. **Charts** — Use `recharts` for all data visualization
12. **Error handling** — Try/catch in all server actions, return `{ data, error }` pattern
13. **No mock data** — Zero hardcoded numbers, zero `Math.random()`, zero placeholder text
14. **No `as any` on return types** — Type everything properly

### Verification After Each Phase
```bash
# Must pass with zero errors before committing
cd next-platform-dashboard
npx tsc --noEmit

# Then commit
git add -A
git commit -m "feat(social-media): PHASE-SM-XX: [description]"
git push
```

### File Organization
```
src/modules/social-media/
├── index.ts                    # Barrel export
├── manifest.ts                 # Module metadata
├── types/index.ts              # All TypeScript types
├── actions/                    # Server actions
│   ├── account-actions.ts
│   ├── post-actions.ts
│   ├── analytics-actions.ts
│   ├── inbox-actions.ts
│   ├── campaign-actions.ts
│   ├── settings-actions.ts
│   └── (new files per phase)
├── components/                 # UI components
│   ├── ui/                     # Sub-components
│   └── (page-level components)
├── lib/                        # Utilities
│   ├── team-utils.ts
│   └── (new files per phase)
└── studio/                     # Studio integration
    └── index.ts

src/app/(dashboard)/dashboard/sites/[siteId]/social/
├── layout.tsx                  # Social module layout + nav
├── page.tsx                    # Dashboard
├── accounts/page.tsx           # Account management
├── analytics/page.tsx          # Analytics
├── calendar/page.tsx           # Content calendar
├── campaigns/page.tsx          # Campaigns
├── compose/page.tsx            # Post composer
├── inbox/page.tsx              # Unified inbox
├── approvals/page.tsx          # Approval workflows
├── settings/page.tsx           # Settings
├── posts/page.tsx              # (SM-07: NEW)
├── media/page.tsx              # (SM-07: NEW)
├── listening/page.tsx          # (SM-07: NEW)
└── competitors/page.tsx        # (SM-07: NEW)

src/app/api/social/              # API routes (SM-01, SM-02, SM-03, SM-04)
├── oauth/[platform]/route.ts
├── oauth/callback/route.ts
├── webhooks/[platform]/route.ts
├── publish/route.ts
└── sync/route.ts
```

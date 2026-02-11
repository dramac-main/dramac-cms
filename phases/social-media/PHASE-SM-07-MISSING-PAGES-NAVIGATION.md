# PHASE SM-07: Missing Pages & Full Navigation

**Phase**: SM-07  
**Name**: Missing Route Pages, Posts List, Listening, Competitors  
**Independence**: Fully independent — renders existing DB data  
**Connection Points**: Completes all 13 navigation routes declared in the manifest  
**Estimated Files**: ~12 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/manifest.ts (MODULE_NAVIGATION section)
src/modules/social-media/types/index.ts (Competitor, BrandMention, ListeningKeyword, Report types)
src/modules/social-media/actions/post-actions.ts
src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/page.tsx (pattern reference)
migrations/em-54-social-media-flat-tables.sql
```

---

## Context

The manifest declares 13 navigation items but only 9 route pages exist. Four pages are missing: Posts, Listening, Competitors, and Reports. Additionally, the navigation in `layout.tsx` only shows 9 items. This phase creates all missing pages and ensures the navigation is complete.

### Missing Routes
| Route | Manifest Label | Status |
|-------|---------------|--------|
| `/social/posts` | Posts | ❌ Missing |
| `/social/listening` | Listening | ❌ Missing |
| `/social/competitors` | Competitors | ❌ Missing |
| `/social/media` | Media | Created in SM-05, or create here |

### Missing Tables (May Need Migration)
- `social_competitors` — competitor tracking
- `social_competitor_analytics` — competitor metrics over time
- `social_brand_mentions` — brand mention tracking
- `social_listening_keywords` — tracked keywords
- `social_reports` — saved report configurations

---

## Task 1: Create Database Migration for Missing Tables

### Create `migrations/sm-07-missing-tables.sql`

```sql
-- ============================================================================
-- PHASE SM-07: Missing Social Media Tables
-- Competitors, Brand Mentions, Listening Keywords, Reports
-- ============================================================================

-- Competitors tracking
CREATE TABLE IF NOT EXISTS public.social_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_handle TEXT NOT NULL,
  platform_id TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  
  -- Cached stats
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  posting_frequency DECIMAL(5,2) DEFAULT 0, -- posts per day
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor analytics snapshots (daily)
CREATE TABLE IF NOT EXISTS public.social_competitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.social_competitors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  followers_count INTEGER DEFAULT 0,
  followers_change INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,
  
  top_post_url TEXT,
  top_post_engagement INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(competitor_id, date)
);

-- Brand mentions
CREATE TABLE IF NOT EXISTS public.social_brand_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  platform TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  post_url TEXT,
  
  content TEXT,
  author_handle TEXT,
  author_name TEXT,
  author_followers INTEGER,
  author_avatar TEXT,
  
  matched_keywords TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2),
  
  engagement INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'engaged', 'archived', 'irrelevant')),
  
  mentioned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, platform_post_id)
);

-- Listening keywords
CREATE TABLE IF NOT EXISTS public.social_listening_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  keyword TEXT NOT NULL,
  keyword_type TEXT DEFAULT 'brand' CHECK (keyword_type IN (
    'brand', 'product', 'competitor', 'industry', 'hashtag'
  )),
  is_active BOOLEAN DEFAULT true,
  
  mentions_count INTEGER DEFAULT 0,
  last_mention_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (saved configurations)
CREATE TABLE IF NOT EXISTS public.social_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'performance', 'engagement', 'audience', 'competitor', 'campaign', 'team', 'custom'
  )),
  
  metrics TEXT[],
  filters JSONB DEFAULT '{}'::jsonb,
  date_range_type TEXT DEFAULT '30d',
  account_ids UUID[],
  
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day INTEGER,
  schedule_time TIME,
  schedule_recipients TEXT[],
  
  last_generated_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_competitors_site ON public.social_competitors(site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_social_competitor_analytics ON public.social_competitor_analytics(competitor_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_social_brand_mentions_site ON public.social_brand_mentions(site_id, status);
CREATE INDEX IF NOT EXISTS idx_social_listening_keywords_site ON public.social_listening_keywords(site_id, is_active);
CREATE INDEX IF NOT EXISTS idx_social_reports_site ON public.social_reports(site_id);

-- RLS
ALTER TABLE public.social_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_competitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_listening_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other social tables)
CREATE POLICY social_competitors_policy ON public.social_competitors
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_competitor_analytics_policy ON public.social_competitor_analytics
  FOR ALL USING (
    competitor_id IN (
      SELECT sc.id FROM social_competitors sc
      JOIN sites s ON sc.site_id = s.id
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_brand_mentions_policy ON public.social_brand_mentions
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_listening_keywords_policy ON public.social_listening_keywords
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY social_reports_policy ON public.social_reports
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER social_competitors_updated_at
  BEFORE UPDATE ON public.social_competitors
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();

CREATE TRIGGER social_reports_updated_at
  BEFORE UPDATE ON public.social_reports
  FOR EACH ROW EXECUTE FUNCTION public.social_update_updated_at();
```

---

## Task 2: Create Posts List Page

### Create `src/app/(dashboard)/dashboard/sites/[siteId]/social/posts/page.tsx`

A comprehensive posts management page showing all posts across all statuses.

**Server Component:**
```typescript
// Fetch posts with all statuses, pass to client wrapper
const [allPosts, accounts] = await Promise.all([
  getPosts(siteId, { limit: 100 }),
  getSocialAccounts(siteId),
])
```

### Create `src/modules/social-media/components/PostsList.tsx`

**Features:**
1. **Tab filter**: All | Draft | Scheduled | Published | Failed | Pending Approval
2. **Table/Grid view toggle**
3. **Table columns**: Content preview, Platform(s), Status badge, Scheduled/Published date, Engagement (impressions, likes), Actions
4. **Grid view**: Card per post with content preview, platform icons, status badge
5. **Search**: Filter by content text
6. **Platform filter**: Show posts for specific platform
7. **Date range filter**: Filter by created/scheduled date
8. **Bulk actions**: Select multiple → delete, reschedule, move to draft
9. **Quick actions per post**: Edit, Duplicate, Delete, View on Platform (if published)
10. **Click post**: Opens edit in composer or detail view

### Create `src/modules/social-media/components/PostsListWrapper.tsx`

Client wrapper with server action callbacks.

---

## Task 3: Create Listening Page

### Create `src/app/(dashboard)/dashboard/sites/[siteId]/social/listening/page.tsx`

Social listening dashboard for tracking brand mentions and keywords.

### Create `src/modules/social-media/components/SocialListening.tsx`

**Features:**
1. **Keywords Management Section**:
   - Add tracked keyword (input + type selector: brand, product, competitor, industry, hashtag)
   - List of tracked keywords with: keyword, type badge, mentions count, last mention, active toggle, delete
2. **Mentions Feed**:
   - Real-time-ish feed of brand mentions
   - Each mention shows: platform icon, author, content, sentiment badge, engagement metrics, date
   - Actions: Mark as reviewed, Engage (reply), Archive, Mark as irrelevant
3. **Sentiment Overview**: 
   - Pie chart of positive/neutral/negative mentions
   - Trend line showing sentiment over time
4. **Top Mentions**: Most-engaged mentions by reach/engagement
5. **Alert indicator**: Badge showing count of new unreviewed mentions

### Create `src/modules/social-media/actions/listening-actions.ts`

```typescript
'use server'

// Keywords
export async function getListeningKeywords(siteId: string): Promise<...>
export async function addListeningKeyword(siteId: string, keyword: string, type: string): Promise<...>
export async function updateKeywordStatus(keywordId: string, isActive: boolean): Promise<...>
export async function deleteListeningKeyword(keywordId: string): Promise<...>

// Mentions
export async function getBrandMentions(siteId: string, options?: { status?: string; keyword?: string; sentiment?: string; limit?: number }): Promise<...>
export async function updateMentionStatus(mentionId: string, status: string): Promise<...>
export async function getMentionStats(siteId: string): Promise<{ positive: number; neutral: number; negative: number; total: number }>
```

**Note**: Actual mention fetching from platforms requires SM-01 accounts and is handled by the sync cron (SM-04 or a separate listener). This page renders whatever mentions exist in the DB. The listening sync service can be added as enhancement — for now, show empty state "Configure listening keywords to start tracking mentions".

---

## Task 4: Create Competitors Page

### Create `src/app/(dashboard)/dashboard/sites/[siteId]/social/competitors/page.tsx`

Competitor analysis dashboard.

### Create `src/modules/social-media/components/CompetitorsPage.tsx`

**Features:**
1. **Add Competitor**: Dialog with platform selector, handle input, verify account exists
2. **Competitor Cards**: Grid of tracked competitors showing:
   - Platform icon, avatar, handle, name
   - Followers count, posts count, engagement rate
   - Posting frequency (posts per day)
   - Last synced time
   - Actions: Sync, Remove, View Profile
3. **Comparison Table**: Side-by-side comparison of you vs competitors:
   - Followers, Growth rate, Engagement rate, Posting frequency
   - Highlighted cells (green if you're winning, red if losing)
4. **Growth Chart**: Line chart comparing follower growth over time
5. **Engagement Comparison**: Bar chart of avg engagement rates

### Create `src/modules/social-media/actions/competitor-actions.ts`

```typescript
'use server'

export async function getCompetitors(siteId: string): Promise<...>
export async function addCompetitor(siteId: string, data: { name: string; platform: string; platformHandle: string }): Promise<...>
export async function removeCompetitor(competitorId: string): Promise<...>
export async function syncCompetitorData(competitorId: string): Promise<...>
export async function getCompetitorAnalytics(competitorId: string, dateRange?: string): Promise<...>
export async function getCompetitorComparison(siteId: string): Promise<...>
```

**Note**: Syncing competitor public data is possible for some platforms:
- Twitter: Public user metrics via API
- Instagram: Business Discovery API (with connected Instagram account)
- YouTube: Public channel statistics
- Bluesky: Public profile info
- Mastodon: Public profile info
- Others: Limited — show "Data unavailable" for platforms without public API

---

## Task 5: Update Layout Navigation — Complete All Routes

### Modify `src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx`

Update the `navItems` array to include ALL routes from the manifest:

```typescript
const navItems = [
  { href: `.../social`, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: `.../social/calendar`, label: 'Calendar', icon: Calendar },
  { href: `.../social/compose`, label: 'Compose', icon: Send },
  { href: `.../social/posts`, label: 'Posts', icon: FileText },       // NEW
  { href: `.../social/inbox`, label: 'Inbox', icon: Inbox },
  { href: `.../social/accounts`, label: 'Accounts', icon: Users },
  { href: `.../social/analytics`, label: 'Analytics', icon: BarChart3 },
  { href: `.../social/campaigns`, label: 'Campaigns', icon: Megaphone },
  { href: `.../social/media`, label: 'Media', icon: ImageIcon },      // NEW (if SM-05 not done)
  { href: `.../social/listening`, label: 'Listening', icon: Ear },     // NEW
  { href: `.../social/competitors`, label: 'Competitors', icon: UsersRound }, // NEW
  { href: `.../social/approvals`, label: 'Approvals', icon: CircleCheck },
  { href: `.../social/settings`, label: 'Settings', icon: Settings },
]
```

Import new icons from `lucide-react`: `FileText`, `Ear` (or `Radio`), `UsersRound` (or `UserSearch`), `Image as ImageIcon`.

**Navigation overflow**: With 13+ items, the nav may overflow on smaller screens. Add horizontal scroll:
```tsx
<div className="overflow-x-auto scrollbar-hide">
  <nav className="flex items-center gap-1 min-w-max pb-2">
    {navItems.map(...)}
  </nav>
</div>
```

---

## Task 6: Ensure Consistent Page Patterns

All new pages MUST follow the existing pattern:
1. **Server component** (page.tsx) — does auth check (or relies on layout), fetches data
2. **Suspense boundary** with skeleton fallback
3. **Client wrapper** — receives data as props, handles callbacks via server actions
4. **Client component** — pure UI with no direct server action imports

Example:
```tsx
// page.tsx
export default async function PostsPage({ params }: PageProps) {
  const { siteId } = await params
  return (
    <div className="container py-6">
      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent siteId={siteId} />
      </Suspense>
    </div>
  )
}

async function PostsContent({ siteId }: { siteId: string }) {
  const [posts, accounts] = await Promise.all([
    getPosts(siteId, { limit: 100 }),
    getSocialAccounts(siteId),
  ])
  return (
    <PostsListWrapper
      siteId={siteId}
      posts={posts.posts || []}
      accounts={accounts.accounts || []}
    />
  )
}
```

---

## Verification Checklist

```
□ npx tsc --noEmit passes with zero errors
□ Migration SQL runs successfully (5 new tables)
□ Posts page renders with tab filters (All, Draft, Scheduled, Published, Failed)
□ Posts page table/grid view toggle works
□ Posts page search filters posts by content
□ Listening page renders with keyword management
□ Adding a keyword inserts into social_listening_keywords
□ Mentions feed shows items from social_brand_mentions (or empty state)
□ Competitors page renders with add competitor dialog
□ Adding a competitor inserts into social_competitors
□ Competitor comparison table shows side-by-side metrics
□ Navigation shows all 13 items
□ Navigation handles horizontal overflow on small screens
□ Each new page follows server→client wrapper pattern
□ Each new page has proper Suspense + skeleton fallback
□ Empty states are professional with helpful guidance text
□ No mock data in any new page
□ All new pages accessible and render without errors
□ Back to Site button works from all pages
□ Commit: git commit -m "feat(social-media): PHASE-SM-07: Missing Pages & Full Navigation"
```

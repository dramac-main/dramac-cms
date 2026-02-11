# PHASE SM-08: Campaigns, Reporting & Calendar Enhancement

**Phase**: SM-08  
**Name**: Campaign Management, Reports Engine, Calendar Enhancement  
**Independence**: Fully independent — extends existing calendar and campaign UI  
**Connection Points**: Reads from `social_posts`, `social_accounts`, `social_analytics`; creates/manages `social_campaigns`, `social_reports`  
**Estimated Files**: ~15 new/modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/manifest.ts
src/modules/social-media/types/index.ts (Campaign, Report types)
src/modules/social-media/actions/campaign-actions.ts
src/modules/social-media/components/SocialCampaignsPage.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/campaigns/page.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/calendar/page.tsx
src/modules/social-media/components/SocialCalendar.tsx
migrations/em-54-social-media-flat-tables.sql (social_campaigns table)
```

---

## Context

The social_campaigns table already exists (from EM-54 migration). The campaigns page has a basic UI. This phase enhances campaigns with full lifecycle management, adds a reports engine, and improves the calendar with drag-and-drop rescheduling and content pillars/color coding.

### Current State
- `social_campaigns` table exists with: name, description, status, dates, goals, content_pillars, tags
- `campaign-actions.ts` has CRUD operations but they're basic
- Calendar exists but is basic (month view with post dots)
- No reports page or engine

---

## Task 1: Enhance Campaign Management

### Modify `src/modules/social-media/components/SocialCampaignsPage.tsx`

Replace the existing campaigns page with a comprehensive campaign management interface.

**Features:**
1. **Campaign List View**:
   - Status filters: All | Active | Scheduled | Completed | Paused | Draft
   - Grid cards showing: name, date range, status badge, post count, progress bar
   - Each card: % of scheduled posts published, engagement summary
2. **Create Campaign Dialog** (enhanced):
   - Name, description
   - Date range picker (start/end)
   - Goal type selector: awareness, engagement, traffic, conversions, brand
   - Target metrics: impressions goal, engagement goal, click goal
   - Content pillars: multi-select tags for categorizing content themes
   - Color: assign a color for calendar visualization
   - Hashtag groups: campaign-specific hashtags
3. **Campaign Detail View**:
   - Header: name, date range, status, progress indicator
   - Tabs: Overview | Posts | Analytics | Settings
   - **Overview tab**: Key metrics (impressions, engagement, clicks, conversions vs goals), progress bars for each goal
   - **Posts tab**: All posts assigned to this campaign (from social_posts where campaign_id matches), with status breakdown
   - **Analytics tab**: Campaign-period performance charts — daily impressions, engagement rate over campaign dates, platform breakdown, best performing posts
   - **Settings tab**: Edit campaign details, pause/resume, archive, delete

### Update `src/modules/social-media/actions/campaign-actions.ts`

Enhance existing actions:
```typescript
'use server'

// Existing — keep and enhance
export async function getCampaigns(siteId: string, options?: { status?: string }): Promise<...>
export async function getCampaign(campaignId: string): Promise<...>
export async function createCampaign(siteId: string, data: CreateCampaignData): Promise<...>
export async function updateCampaign(campaignId: string, data: Partial<CreateCampaignData>): Promise<...>
export async function deleteCampaign(campaignId: string): Promise<...>

// New additions
export async function getCampaignPosts(campaignId: string): Promise<...>
export async function getCampaignAnalytics(campaignId: string): Promise<{
  impressions: { total: number; goal: number; daily: { date: string; value: number }[] }
  engagement: { total: number; goal: number; rate: number; daily: { date: string; value: number }[] }
  clicks: { total: number; goal: number; daily: { date: string; value: number }[] }
  topPosts: SocialPost[]
  platformBreakdown: { platform: string; impressions: number; engagement: number }[]
}>
export async function pauseCampaign(campaignId: string): Promise<...>
export async function resumeCampaign(campaignId: string): Promise<...>
export async function archiveCampaign(campaignId: string): Promise<...>
export async function duplicateCampaign(campaignId: string): Promise<...>
```

**Analytics Logic**: Query `social_analytics` for all posts with matching `campaign_id` within the campaign date range. Aggregate by day and platform.

---

## Task 2: Reports Engine

### Create `src/app/(dashboard)/dashboard/sites/[siteId]/social/reports/page.tsx`

Add the Reports route page.

### Create `src/modules/social-media/components/ReportsPage.tsx`

**Features:**
1. **Saved Reports List**:
   - Grid/List of saved report configurations
   - Each shows: name, type badge, date range, last generated date
   - Actions: Generate, Edit, Duplicate, Schedule, Delete
2. **Create Report Dialog**:
   - Report name
   - Report type: performance, engagement, audience, competitor, campaign, team, custom
   - Date range: Last 7d, 30d, 90d, custom range
   - Account selection: multi-select which accounts to include
   - Metrics selection: checkboxes for which metrics to include
3. **Report Viewer**:
   - Full-page report with sections based on selected metrics
   - **Performance section**: Followers growth, impressions, reach
   - **Engagement section**: Likes, comments, shares, engagement rate, best times
   - **Content section**: Top performing posts, content type breakdown
   - **Audience section**: Growth chart, demographics (if available from analytics)
   - **Platform comparison**: Side-by-side platform metrics
4. **Export**: Download as PDF or CSV
   - CSV: Flat data export of all metrics
   - PDF: Use `@react-pdf/renderer` or browser print (preferred — simpler, no extra dep)
   - Add print-friendly CSS: `@media print { ... }` styles
5. **Schedule Reports** (configuration only — actual sending needs email service):
   - Frequency: daily, weekly, monthly
   - Day of week/month
   - Time (Africa/Lusaka)
   - Recipients (email list)
   - Store schedule in social_reports table
   - Show toast: "Report scheduling saved. Email delivery coming soon."

### Create `src/modules/social-media/actions/report-actions.ts`

```typescript
'use server'

export async function getReports(siteId: string): Promise<...>
export async function getReport(reportId: string): Promise<...>
export async function createReport(siteId: string, data: CreateReportData): Promise<...>
export async function updateReport(reportId: string, data: Partial<CreateReportData>): Promise<...>
export async function deleteReport(reportId: string): Promise<...>
export async function duplicateReport(reportId: string): Promise<...>

// Generate report data based on report configuration
export async function generateReportData(reportId: string): Promise<{
  report: SocialReport
  data: {
    summary: { metric: string; value: number; change: number }[]
    dailyMetrics: { date: string; [metric: string]: number | string }[]
    topPosts: SocialPost[]
    platformBreakdown: { platform: string; [metric: string]: number | string }[]
    accountBreakdown: { accountId: string; accountName: string; [metric: string]: number | string }[]
  }
}>
```

**Data Fetching Logic**: Based on `report.metrics` and `report.filters`, query `social_analytics`, `social_posts`, and `social_accounts` for the specified date range and accounts. Aggregate and return structured data.

---

## Task 3: Calendar Enhancement

### Modify `src/modules/social-media/components/SocialCalendar.tsx`

Enhance the existing calendar with these features:

1. **View Modes**: Month | Week | Day toggle
   - **Month view**: Grid with post dots/pills showing content previews
   - **Week view**: 7-column layout with time slots, posts shown as blocks at their scheduled time
   - **Day view**: Full-day timeline with detailed post cards at scheduled times

2. **Post Colors**: Color-code by campaign or content pillar
   - Each campaign has an assigned color
   - Posts without campaigns use platform colors
   - Legend showing color meanings

3. **Drag and Drop**: Use `@dnd-kit/core` and `@dnd-kit/sortable` (already in project deps, or use native HTML drag-and-drop to avoid new deps)
   - Drag a post from one day to another → triggers reschedule
   - Confirm dialog: "Reschedule [post preview] from [old date] to [new date]?"
   - Calls `updatePost(postId, { scheduledAt: newDate })` on confirm

4. **Quick Create**: Click on a date cell → opens compose with that date pre-set
   - Pass `?date=YYYY-MM-DD` query param to compose page, or show inline quick composer

5. **Filter Sidebar** (collapsible):
   - Filter by account/platform
   - Filter by status (scheduled, published, draft)
   - Filter by campaign
   - Filter by content pillar

6. **Post Preview Popover**: Hover/click on a post pill → shows popover with:
   - Full content preview
   - Platform icons
   - Status badge
   - Scheduled time
   - Quick actions: Edit, Delete, Publish Now

### Check for drag-and-drop dependency
Before using `@dnd-kit`, check `package.json` for existing deps. If not available, use native HTML Drag and Drop API instead:
```typescript
onDragStart={(e) => e.dataTransfer.setData('postId', post.id)}
onDrop={(e) => {
  const postId = e.dataTransfer.getData('postId')
  handleReschedule(postId, targetDate)
}}
onDragOver={(e) => e.preventDefault()}
```

---

## Task 4: Content Pillars System

### Add content pillars management to Settings page

Modify `src/app/(dashboard)/dashboard/sites/[siteId]/social/settings/page.tsx` or the settings component to add a "Content Pillars" section.

**Features:**
1. **Manage Pillars**: Add, edit, delete content categories
   - Name: e.g., "Educational", "Behind the Scenes", "Product", "User Generated", "Promotional"
   - Color: Assign color for calendar visualization
   - Description: Brief description of pillar purpose
2. **Pillar Assignment**: When composing posts, select one or more content pillars
3. **Distribution Chart**: Pie chart showing post distribution across pillars for the current month
4. **Ideal Mix**: Set target percentages for each pillar (e.g., 40% educational, 20% promotional, etc.)

### Storage
Content pillars can be stored in `social_campaigns` with type='pillar' or as a JSONB column on a site settings record. Simplest approach: use a `social_content_pillars` JSON stored in the existing site configuration.

**Actually, add to migration:**
```sql
CREATE TABLE IF NOT EXISTS public.social_content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  target_percentage INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_content_pillars_site ON public.social_content_pillars(site_id);
ALTER TABLE public.social_content_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_content_pillars_policy ON public.social_content_pillars
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );
```

### Create `src/modules/social-media/actions/pillar-actions.ts`

```typescript
'use server'

export async function getContentPillars(siteId: string): Promise<...>
export async function createContentPillar(siteId: string, data: { name: string; color: string; description?: string; targetPercentage?: number }): Promise<...>
export async function updateContentPillar(pillarId: string, data: Partial<...>): Promise<...>
export async function deleteContentPillar(pillarId: string): Promise<...>
export async function getContentPillarDistribution(siteId: string, dateRange?: string): Promise<{ pillarId: string; pillarName: string; color: string; count: number; percentage: number; target: number }[]>
```

---

## Task 5: Add Reports to Navigation

### Modify `src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx`

Add the Reports nav item:
```typescript
{ href: `.../social/reports`, label: 'Reports', icon: FileBarChart },
```

Import `FileBarChart` from `lucide-react`.

---

## Task 6: Enhance Composer with Campaign & Pillar Selection

### Modify `src/modules/social-media/components/SocialComposer.tsx`

Add to the compose form:
1. **Campaign selector**: Dropdown of active campaigns → sets `campaign_id` on the post
2. **Content pillar selector**: Multi-select of content pillars → sets `content_pillars` on the post (store as JSONB or tags)
3. Both are optional — can compose without campaign or pillar

---

## Verification Checklist

```
□ npx tsc --noEmit passes with zero errors
□ Migration SQL runs (social_content_pillars + migration from SM-07 if not already run)
□ Campaigns page shows status filters (Active, Scheduled, Completed, etc.)
□ Create campaign dialog captures goals, pillars, color, hashtags
□ Campaign detail view has Overview, Posts, Analytics, Settings tabs
□ Campaign analytics aggregates real data from social_analytics
□ Reports page shows saved reports list
□ Create report dialog captures type, date range, accounts, metrics
□ Report viewer renders performance/engagement/content sections
□ Export button generates print-friendly view
□ Calendar has Month/Week/Day view toggle
□ Calendar posts are color-coded by campaign
□ Drag and drop reschedules posts with confirmation
□ Click on empty date opens compose with date pre-set
□ Content pillars CRUD works in settings
□ Pillar distribution chart shows real data
□ Composer has campaign and pillar selectors
□ Reports nav item shows in sidebar
□ No mock data anywhere
□ All components use semantic Tailwind tokens (no hex colors)
□ All currency displays use K symbol from locale-config
□ Commit: git commit -m "feat(social-media): PHASE-SM-08: Campaigns, Reporting & Calendar Enhancement"
```

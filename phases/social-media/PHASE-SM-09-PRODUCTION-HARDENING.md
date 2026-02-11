# PHASE SM-09: Production Hardening & Final Cleanup

**Phase**: SM-09  
**Name**: Error Boundaries, Loading States, Accessibility, Mock Data Purge, Final QA  
**Independence**: MUST run LAST — after SM-01 through SM-08 are complete  
**Connection Points**: Touches all social media files for final polish  
**Estimated Files**: ~30+ modified files

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md
memory-bank/techContext.md
phases/social-media/PHASE-SM-00-MASTER-PLAN.md
src/modules/social-media/ (entire directory tree)
src/app/(dashboard)/dashboard/sites/[siteId]/social/ (all route pages)
src/lib/locale-config.ts
src/components/analytics/social/ (all 6 files)
```

---

## Context

This is the final phase. It assumes all other SM phases (01–08) have been implemented. The goal is to sweep every file in the social media module for:
- Remaining mock/placeholder data
- Missing error boundaries
- Missing loading/skeleton states
- Accessibility gaps
- "Coming soon" toasts that should now be real features
- Type safety gaps
- Performance issues
- Final verification of zero `tsc` errors

---

## Task 1: Systematic Mock Data Purge

### Search and Destroy All Mock Data

Run a comprehensive search across the entire social media module for any remaining mock/fake/placeholder data.

**Search patterns** (use grep across all `.ts`, `.tsx` files in the module):
```
mock
Mock
MOCK
fake
Fake
placeholder
Placeholder
demo
Demo
simulated
hardcoded
TODO
FIXME
HACK
"coming soon"
"Coming soon"
"Coming Soon"
sample
Sample
Lorem
lorem
```

**Known mock data locations** (from deep scan — verify these are fixed by earlier phases):
1. `src/modules/social-media/components/SocialAnalyticsPage.tsx` — `mockOverview` with hardcoded followers: 12543
2. `src/lib/actions/social-analytics.ts` — ALL 18 functions return empty/zero data
3. `src/modules/social-media/actions/post-actions.ts` — `simulated_${Date.now()}_${platform}` fake post IDs
4. `src/modules/social-media/actions/account-actions.ts` — `refreshAccountToken()` just marks expired, `syncAccountStats()` only updates timestamp
5. `src/modules/social-media/actions/analytics-actions.ts` — `syncAnalytics()` inserts zeros only
6. `src/modules/social-media/actions/inbox-actions.ts` — `replyToItem()` has "Platform-specific reply logic would go here"
7. `src/app/(dashboard)/dashboard/sites/[siteId]/social/analytics/page.tsx` — "demo data" banner
8. `src/components/analytics/social/` — 6 external analytics components may have mock data

**For each found instance:**
- If the feature has been implemented by SM-01 through SM-08 → Remove the mock data, ensure real implementation is in place
- If the feature is genuinely not yet implementable → Replace with professional empty state: "No data available yet. [Action to fix]"
- Never leave `// TODO` comments — either implement or document limitation clearly

---

## Task 2: Error Boundaries for Every Route

### Create `src/modules/social-media/components/SocialErrorBoundary.tsx`

A reusable error boundary component for social media pages:

```typescript
'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  context?: string // e.g., "analytics", "posts", "calendar"
}

interface State {
  hasError: boolean
  error: Error | null
}

export class SocialErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Social ${this.props.context || 'Module'}] Error:`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
              Something went wrong
            </CardTitle>
            <CardDescription>
              {this.props.context
                ? `An error occurred in the ${this.props.context} section.`
                : 'An unexpected error occurred.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="rounded-md bg-muted p-4 text-xs overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Try again
            </Button>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}
```

### Add `error.tsx` to every social route

Create Next.js error boundary files for each social route:

```
src/app/(dashboard)/dashboard/sites/[siteId]/social/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/calendar/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/compose/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/posts/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/inbox/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/accounts/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/analytics/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/campaigns/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/media/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/listening/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/competitors/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/approvals/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/settings/error.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/reports/error.tsx
```

Each follows the Next.js 14+ pattern:
```typescript
'use client'

import { SocialErrorBoundary } from '@/modules/social-media/components/SocialErrorBoundary'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container py-6">
      <SocialErrorBoundary context="[page name]" onReset={reset}>
        {/* Force error display */}
        <ErrorDisplay error={error} reset={reset} />
      </SocialErrorBoundary>
    </div>
  )
}

function ErrorDisplay({ error, reset }: { error: Error; reset: () => void }) {
  // Re-use the error boundary UI directly
  return (
    <Card className="border-destructive/50">
      {/* ... same pattern ... */}
    </Card>
  )
}
```

---

## Task 3: Loading States & Skeleton Screens

### Create `src/modules/social-media/components/skeletons/`

Create skeleton components for every page:

1. **`PostsListSkeleton.tsx`** — Table rows with shimmer
2. **`AnalyticsSkeleton.tsx`** — Stat cards + chart placeholder
3. **`CalendarSkeleton.tsx`** — Month grid with shimmer dots
4. **`InboxSkeleton.tsx`** — Conversation list + message area
5. **`AccountsSkeleton.tsx`** — Account cards grid
6. **`CampaignsSkeleton.tsx`** — Campaign cards grid
7. **`MediaSkeleton.tsx`** — Image grid with shimmer
8. **`ListeningSkeleton.tsx`** — Keywords list + mentions feed
9. **`CompetitorsSkeleton.tsx`** — Competitor cards grid
10. **`ReportsSkeleton.tsx`** — Report cards list
11. **`ComposerSkeleton.tsx`** — Text area + platform selectors
12. **`DashboardSkeleton.tsx`** — Stats row + charts

Each skeleton should use the `Skeleton` component from shadcn/ui:
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function PostsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Add `loading.tsx` to every social route

Create Next.js loading files for each social route:

```
src/app/(dashboard)/dashboard/sites/[siteId]/social/loading.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/posts/loading.tsx
src/app/(dashboard)/dashboard/sites/[siteId]/social/calendar/loading.tsx
... (all 14 routes)
```

Each loading file:
```typescript
import { [PageName]Skeleton } from '@/modules/social-media/components/skeletons/[PageName]Skeleton'

export default function Loading() {
  return (
    <div className="container py-6">
      <[PageName]Skeleton />
    </div>
  )
}
```

---

## Task 4: Empty States

### Create `src/modules/social-media/components/SocialEmptyState.tsx`

A reusable empty state component:

```typescript
interface SocialEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}
```

### Apply empty states to every page

When no data exists, show professional empty states instead of blank pages:

| Page | Empty State | Action |
|------|-------------|--------|
| Dashboard | "No social accounts connected" | "Connect your first account" → Accounts page |
| Posts | "No posts yet" | "Create your first post" → Compose page |
| Calendar | "No scheduled posts" | "Schedule a post" → Compose page |
| Inbox | "No messages yet" | "Connect accounts to start receiving messages" |
| Accounts | "No accounts connected" | "Connect Account" button |
| Analytics | "No analytics data" | "Connect accounts and publish posts to see analytics" |
| Campaigns | "No campaigns yet" | "Create Campaign" button |
| Media | "No media files" | "Upload your first media file" |
| Listening | "No keywords tracked" | "Add your first keyword" |
| Competitors | "No competitors tracked" | "Add a competitor" |
| Reports | "No saved reports" | "Create your first report" |
| Approvals | "No pending approvals" | "Posts requiring approval will appear here" |

---

## Task 5: Accessibility Audit

### Check and fix accessibility across all social media components

1. **Keyboard navigation**: Every interactive element must be reachable via Tab
2. **ARIA labels**: All icon-only buttons need `aria-label`
3. **Focus management**: After dialogs close, focus returns to trigger
4. **Color contrast**: All text meets WCAG 2.1 AA (4.5:1 ratio) — use semantic tokens which handle this
5. **Screen reader text**: Platform icons need `sr-only` labels
6. **Form labels**: All inputs have associated labels
7. **Error announcements**: Form errors are announced via `aria-live="polite"`
8. **Skip links**: Not needed within module (layout already handles)
9. **Alt text**: All images have descriptive alt text
10. **Status badges**: Use `aria-label` on status badges (not just color)

### Specific fixes to apply:

```typescript
// Every icon-only button
<Button variant="ghost" size="icon" aria-label="Delete post">
  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
</Button>

// Platform icons
<Facebook className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
<span className="sr-only">Facebook</span>

// Status badges
<Badge variant="outline" aria-label={`Status: ${status}`}>{status}</Badge>

// Tabs
<Tabs defaultValue="overview" aria-label="Campaign sections">

// Data tables
<table role="table" aria-label="Posts list">
<thead><tr><th scope="col">Content</th>...</tr></thead>
```

---

## Task 6: Performance Optimization

### Apply performance best practices:

1. **Dynamic imports** for heavy components:
   ```typescript
   const SocialCalendar = dynamic(
     () => import('@/modules/social-media/components/SocialCalendar'),
     { loading: () => <CalendarSkeleton /> }
   )
   ```

2. **Image optimization**: All avatars and media thumbnails use `next/image`:
   ```typescript
   <Image
     src={account.avatar_url}
     alt={`${account.display_name} avatar`}
     width={40}
     height={40}
     className="rounded-full"
   />
   ```

3. **Recharts lazy loading**: Charts should only load when visible:
   ```typescript
   const LazyChart = dynamic(() => import('./AnalyticsChart'), {
     ssr: false,
     loading: () => <Skeleton className="h-64 w-full" />,
   })
   ```

4. **List virtualization**: For posts list with 100+ items, consider `react-window` or pagination
   - Simplest: Server-side pagination with limit/offset
   - Add "Load more" button or page numbers

5. **Debounced search**: All search inputs use `useDebouncedCallback` (300ms):
   ```typescript
   import { useDebouncedCallback } from 'use-debounce'
   const debouncedSearch = useDebouncedCallback((value: string) => {
     setSearchQuery(value)
   }, 300)
   ```

6. **Memoized computations**: Use `useMemo` for filtered/sorted lists:
   ```typescript
   const filteredPosts = useMemo(
     () => posts.filter(p => p.status === activeTab && p.content.includes(searchQuery)),
     [posts, activeTab, searchQuery]
   )
   ```

---

## Task 7: Remove "Coming Soon" Toasts

Search for all toast notifications with "coming soon" text and either:
- **Remove the toast** and implement the feature (if the feature is now available)
- **Replace with proper disabled state**: Grey out button + tooltip "Requires [feature]" instead of triggering an action that toasts

Search patterns:
```
"coming soon"
"Coming soon"
"not yet available"
"not yet implemented"
"Not yet"
```

---

## Task 8: Final Type Safety Pass

### Verify all types are correct

1. **No `any` casts** except the documented `(supabase as any).from('social_...')` pattern for untyped tables
2. **All server actions** return typed `{ data: T, error: string | null }` or `{ data: null, error: string }`
3. **All component props** have proper TypeScript interfaces
4. **No implicit `any`** — strict mode must pass
5. **Proper null checks** — all optional chaining is correct
6. **Date handling**: All dates use `new Date()` and format with `Intl.DateTimeFormat('en-ZM', { timeZone: 'Africa/Lusaka' })`

### Run final TypeScript check:
```bash
npx tsc --noEmit
```

Fix ALL errors. Zero tolerance.

---

## Task 9: Final Integration Verification

### End-to-end flow verification

Walk through each critical flow and verify it works:

1. **Account Connection Flow**:
   - Settings → Connect Account → OAuth redirect → Callback → Account appears in Accounts page
   - Account stats sync on connection
   - Account appears in Composer platform selector

2. **Post Creation & Publishing Flow**:
   - Compose → Write content → Select platforms → Attach media → Preview → Publish Now
   - Post appears in Posts list with Published status
   - Post appears on Calendar at correct date
   - Analytics start appearing after sync

3. **Scheduled Post Flow**:
   - Compose → Write content → Set schedule date → Save
   - Post appears in Calendar on scheduled date
   - Post appears in Posts list with Scheduled status
   - When time arrives → Cron publishes → Status changes to Published

4. **Inbox Flow**:
   - Inbox syncs messages from connected accounts
   - Click message → See conversation thread
   - Reply → Reply appears in platform

5. **Analytics Flow**:
   - Analytics page shows real data from connected accounts
   - Date range filter changes data
   - Platform filter shows per-platform breakdown
   - All charts render with real data

6. **Campaign Flow**:
   - Create campaign with goals
   - Assign posts to campaign
   - Campaign detail shows aggregated analytics
   - Campaign progress bar reflects actual vs goal

---

## Task 10: Update Module Manifest

### Verify `src/modules/social-media/manifest.ts`

Ensure the manifest accurately reflects the current state:
1. All navigation items point to real routes
2. All permissions are used by actual features
3. All events are emitted by real actions
4. All API routes listed are implemented (or remove unimplemented ones)
5. Module version should be updated if needed

---

## Task 11: Documentation Update

### Update `src/modules/social-media/README.md`

Create or update the module README with:
1. Module overview and features
2. Architecture diagram (text-based)
3. Database tables list
4. API routes list
5. Environment variables required (platform API keys)
6. Setup instructions
7. Testing guide
8. Known limitations

---

## Verification Checklist

```
□ npx tsc --noEmit passes with ZERO errors
□ Grep for "mock|Mock|MOCK" returns zero hits in social module
□ Grep for "fake|Fake|placeholder|Placeholder" returns zero hits
□ Grep for "simulated_" returns zero hits
□ Grep for "TODO|FIXME|HACK" returns zero relevant hits
□ Grep for "coming soon|Coming soon" returns zero hits
□ Every route has error.tsx file
□ Every route has loading.tsx file with skeleton
□ Every page has proper empty state when no data
□ All icon-only buttons have aria-label
□ All images have alt text
□ All form inputs have labels
□ Charts load lazily with skeleton fallback
□ Posts list handles 100+ items without performance issues
□ Search inputs are debounced
□ All dates display in Africa/Lusaka timezone
□ All currency shows K symbol
□ Module manifest is accurate
□ Module README is complete
□ Account connection flow works end-to-end
□ Post creation and publishing flow works
□ Scheduled post flow works
□ Inbox and reply flow works
□ Analytics show real data
□ Campaign flow works with goals tracking
□ Reports generate with real data
□ Calendar displays posts correctly
□ Media library stores to Supabase Storage
□ AI content generation produces real suggestions
□ Competitor tracking displays real data
□ Listening page tracks keywords and mentions
□ Commit: git commit -m "feat(social-media): PHASE-SM-09: Production Hardening & Final Cleanup"
□ Push: git push
```

---

## Final Commit Message

After all verification passes:
```bash
git add -A
npx tsc --noEmit
git commit -m "feat(social-media): PHASE-SM-09: Production Hardening & Final Cleanup

- Error boundaries on all 14 routes
- Loading skeletons for all pages
- Professional empty states everywhere
- Mock/placeholder data completely removed
- Accessibility audit complete (WCAG 2.1 AA)
- Performance optimized (lazy loading, memoization, pagination)
- All 'coming soon' toasts replaced with real features
- Type safety verified (zero tsc errors)
- End-to-end flows verified
- Module manifest updated
- Module README documented"
git push
```

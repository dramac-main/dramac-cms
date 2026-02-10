# PHASE-FIX-03: Navigation, Routing & Platform Polish

**Priority:** 🟡 MEDIUM — Addresses orphaned pages, duplicate routes, error boundaries, and overall platform quality  
**Estimated Scope:** ~20 files modified, 10+ files deleted  
**Dependencies:** Task 3 (Settings nav "Regional") depends on Phase FIX-01 Task 5 creating the Regional page. All other tasks are independent.  
**Runs Independently:** YES — skip the "Regional" nav entry in Task 3 if Phase FIX-01 hasn't run yet

---

## ⚠️ AI IMPLEMENTATION INSTRUCTIONS

> **READ BEFORE IMPLEMENTING.** This phase is designed to run in a NEW session where the AI has no prior context. Follow these rules strictly:

### Session Setup
1. **Read ALL memory bank files first** (`/memory-bank/*.md`)
2. **Run `npx tsc --noEmit`** before AND after implementation
3. **Check git status** — if Phase FIX-01 or FIX-02 have been committed, their changes are already in the codebase

### Critical Technical Context
- **Route groups**: `(dashboard)` is a Next.js route group — URLs do NOT include `(dashboard)`. So `src/app/(dashboard)/dashboard/sites/` → URL `/dashboard/sites/`.
- **The `/sites/*` tree** under `src/app/(dashboard)/sites/` are all redirect stubs EXCEPT `sites/[siteId]/analytics/page.tsx` which is a FULL 290-line independent implementation. This analytics page is a real duplicate that should be deleted.
- **`src/proxy.ts`** handles subdomain routing. The `middleware.ts` imports and calls `handleRequest()` from proxy. Public route exclusions must be added in `proxy.ts`.
- **Settings navigation** (`src/config/settings-navigation.ts`): Check what's already there before adding. Phase FIX-01 may have already added "Regional".
- **Admin navigation** (`src/config/admin-navigation.ts`): Check the actual structure before adding items — it may use sections/groups.
- **Error boundaries**: Use `'use client'` directive. Must accept `{ error, reset }` props. Import only from `@/components/ui/` for consistency.

### Conflict Prevention
- **DO NOT modify `branding-provider.tsx`**, `globals.css`, `tailwind.config.ts` — those belong to Phase FIX-01.
- **DO NOT modify server action files** (social-analytics, admin-analytics, etc.) — those belong to Phase FIX-02.
- **DO NOT modify currency formatting** — Phase FIX-01.
- This phase's scope is: navigation configs, route file deletion/creation, middleware/proxy, error boundary files, and module catalog cleanup.
- **Before adding to settings-navigation.ts**: Read the file first. If Phase FIX-01 already added entries, don't duplicate them.
- **Before deleting `/sites/*` tree**: Verify ALL navigation/links point to `/dashboard/sites/` — use `grep_search` for `/sites/` links.

### Verification Gate
After completing ALL tasks, run:
```bash
cd next-platform-dashboard
npx tsc --noEmit
```
If zero errors: `git add -A && git commit -m "feat: Phase FIX-03 — navigation, routing, and platform polish" && git push`

---

## Problem Statement

The platform has accumulated routing debt: duplicate route trees (`/sites/*` mirrors `/dashboard/sites/*`), orphaned settings pages (Activity, Billing, Modules not in nav), 13+ admin pages not accessible from navigation, almost no error boundaries, and middleware gaps that could cause auth issues on portal and embed pages.

---

## Task 1: Remove Duplicate `/sites/*` Route Tree

**Location:** `src/app/(dashboard)/sites/`

**Issue:** There are TWO route trees for site management:
- `/dashboard/sites/[siteId]/*` — the ACTIVE one (linked from navigation)
- `/sites/[siteId]/*` — the ORPHANED duplicate (15 pages reachable at wrong URL)

Both are inside the `(dashboard)` route group, so both share the same layout. The navigation links to `/dashboard/sites`, making the `/sites/*` tree entirely orphaned.

**Fix:**
1. Verify ALL navigation links point to `/dashboard/sites/[siteId]/*`
2. Delete the entire `src/app/(dashboard)/sites/` directory (15 orphaned pages):
   - `sites/[siteId]/page.tsx`
   - `sites/[siteId]/blog/*` (4 pages)
   - `sites/[siteId]/builder/page.tsx`
   - `sites/[siteId]/seo/*` (4 pages)
   - `sites/[siteId]/submissions/page.tsx`
   - `sites/[siteId]/settings/domain/page.tsx`
   - `sites/[siteId]/analytics/page.tsx`
3. Add redirects for any bookmarked URLs:
   ```typescript
   // src/app/(dashboard)/sites/[siteId]/page.tsx (keep as redirect)
   import { redirect } from 'next/navigation'
   export default function Page({ params }: { params: { siteId: string } }) {
     redirect(`/dashboard/sites/${params.siteId}`)
   }
   ```

---

## Task 2: Clean Up Duplicate `/dashboard/settings/*` Route Tree

**Location:** `src/app/(dashboard)/dashboard/settings/`

**Issue:** Settings live in TWO places:
- `/settings/*` — the ACTIVE tree (linked from nav, has sidebar layout)
- `/dashboard/settings/*` — partial duplicate (branding, domains, plus sub-pages)

The `/settings/branding` page already imports from `/dashboard/settings/branding/page.tsx` (fixed last session). But the entire `/dashboard/settings/` tree is confusing.

**Fix:**
1. Move any unique pages from `/dashboard/settings/*` to `/settings/*`
2. Ensure the branding component is a standalone shared component (not a page importing another page)
3. Create `src/components/settings/branding-settings-form.tsx` — extract the 556-line branding form
4. Both `/settings/branding/page.tsx` and any other consumers import the shared component
5. Delete orphaned pages in `/dashboard/settings/` that are now served from `/settings/`

---

## Task 3: Fix Settings Navigation — Add Missing Pages

**File:** `src/config/settings-navigation.ts`

**Current State:** 3 settings pages exist but aren't in navigation:
| Page | Route | Status |
|------|-------|--------|
| Activity Log | `/settings/activity` | ❌ Not in nav |
| Billing | `/settings/billing` | ❌ Not in nav |
| Modules | `/settings/modules` | ❌ Not in nav |
| Regional (NEW) | `/settings/regional` | ❌ Doesn't exist yet (Phase FIX-01) |

**Fix:**
```typescript
// settings-navigation.ts
export const settingsNavigation = {
  account: [
    { name: "Profile", href: "/settings/profile", icon: User },
    { name: "Security", href: "/settings/security", icon: Shield },
    { name: "Notifications", href: "/settings/notifications", icon: Bell },
  ],
  agency: [
    { name: "General", href: "/settings/agency", icon: Building },
    { name: "Team", href: "/settings/team", icon: Users },
    { name: "Branding", href: "/settings/branding", icon: Paintbrush },
    { name: "Regional", href: "/settings/regional", icon: Globe2 },  // NEW
    { name: "Domains", href: "/settings/domains", icon: Globe },
    { name: "Modules", href: "/settings/modules", icon: Puzzle },     // ADDED
  ],
  billing: [
    { name: "Subscription", href: "/settings/subscription", icon: CreditCard },
    { name: "Billing", href: "/settings/billing", icon: Receipt },    // ADDED
  ],
  system: [
    { name: "Activity Log", href: "/settings/activity", icon: Activity }, // ADDED
  ],
}
```

---

## Task 4: Fix Admin Navigation — Add Missing Pages

**File:** `src/config/admin-navigation.ts`

**Current State:** 13+ admin pages exist but aren't in navigation. Users can only reach them via direct URL.

**Fix — Add to admin navigation:**
```typescript
// Under "Modules" section:
{ name: "Module Pricing", href: "/admin/modules/pricing", icon: DollarSign },
{ name: "Module Requests", href: "/admin/modules/requests", icon: Inbox },
{ name: "Module Analytics", href: "/admin/modules/analytics", icon: BarChart3 },

// Under "System" section:
{ name: "Audit Log", href: "/admin/audit", icon: FileSearch },

// Developer/Studio section (optional — only show to dev role):
{ name: "Studio Testing", href: "/admin/modules/testing", icon: FlaskConical },
```

---

## Task 5: Add Error Boundaries Across the Platform

**Current State:** Only 3 `error.tsx` files and 4 `not-found.tsx` files for 150+ pages.

**Fix — Create error boundaries for major route segments:**

```
src/app/(dashboard)/
├── error.tsx                    ← ALREADY EXISTS
├── dashboard/
│   ├── error.tsx                ← NEW (catches all dashboard sub-page errors)
│   ├── sites/[siteId]/error.tsx ← NEW (per-site errors, most critical)
│   └── billing/error.tsx        ← NEW
├── settings/
│   └── error.tsx                ← NEW
├── admin/
│   └── error.tsx                ← NEW
├── marketplace/
│   └── error.tsx                ← NEW
src/app/portal/
├── error.tsx                    ← NEW (portal-wide error boundary)
├── not-found.tsx                ← NEW
```

**Template for error.tsx:**
```tsx
'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Route Error]', error)
    // TODO: Report to Sentry/LogRocket when integrated
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-danger" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} variant="outline">Try Again</Button>
    </div>
  )
}
```

---

## Task 6: Fix Middleware Gaps

**File:** `middleware.ts` + `src/proxy.ts`

### 6a: Portal Login Route
**Issue:** Portal routes (`/portal/*`) fall through to the catch-all `updateSession()` check. The `/portal/login` page needs to be accessible WITHOUT auth.

**Fix — Add portal login exclusion:**
```typescript
// In proxy.ts or middleware.ts:
if (pathname === '/portal/login' || pathname === '/portal/verify') {
  return NextResponse.next()
}
```

### 6b: Embed Routes
**Issue:** `/embed/*` pages (booking widget, ecommerce) may trigger auth checks. They should be fully public.

**Fix — Add embed exclusion:**
```typescript
if (pathname.startsWith('/embed/')) {
  return NextResponse.next()
}
```

### 6c: Test/Debug Pages
**Issue:** `/test-components`, `/test-safety`, `/debug-marketplace` exist in production.

**Fix:** Delete these pages or gate behind `NODE_ENV === 'development'`:
```typescript
if (pathname.startsWith('/test-') || pathname.startsWith('/debug-')) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.rewrite(new URL('/404', request.url))
  }
}
```

---

## Task 7: Remove Duplicate Zapier Module Registration

**File:** `src/lib/modules/module-catalog.ts`

**Issue:** `mod_integration_zapier` appears TWICE in the static catalog (lines ~602 and ~755) with different slugs (`zapier` vs `zapier-integration`).

**Fix:** Remove the duplicate entry. Keep `zapier-integration` as the canonical slug.

---

## Task 8: Portal Navigation — Add Missing Items

**File:** `src/config/portal-navigation.ts`

**Current State:** Portal has pages that aren't in navigation:
| Page | Route | Status |
|------|-------|--------|
| Notifications | `/portal/notifications` | ❌ Not in nav |
| Apps | `/portal/apps` | ❌ Not in nav |

**Fix:**
```typescript
// Add to portal navigation:
{ name: "Notifications", href: "/portal/notifications", icon: Bell },
```

---

## Task 9: Clean Up Test/Debug Pages

**Files to delete (or move to dev-only):**
- `src/app/test-components/page.tsx`
- `src/app/test-safety/page.tsx`  
- `src/app/debug-marketplace/page.tsx`
- `src/app/marketplace/v2/*` (if v1 is the production version)

**Fix:** Either delete or wrap in environment check:
```typescript
if (process.env.NODE_ENV !== 'development') {
  redirect('/dashboard')
}
```

---

## Task 10: Site Analytics Empty State Improvement

**Files:** `src/lib/actions/site-analytics.ts`

**Current State:** 8 analytics functions return empty arrays / zeros:
- `getTrafficSources()` → `[]`
- `getDeviceAnalytics()` → `[]`
- `getBrowserAnalytics()` → `[]`
- `getGeoAnalytics()` → `[]`
- `getTimeSeriesAnalytics()` → `[]`
- `getRealtimeAnalytics()` → `{ visitors: 0 }`
- `getPerformanceMetrics()` → all zeros
- `getTopPages()` → pages with 0 views

**Fix:** The UI components consuming this data should show proper empty states:
```tsx
// Instead of empty charts, show:
<div className="flex flex-col items-center justify-center h-64 text-center">
  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
  <h3 className="font-medium text-muted-foreground">No Analytics Data Yet</h3>
  <p className="text-sm text-muted-foreground/70 max-w-sm mt-1">
    Visitor tracking requires integration with an analytics provider 
    (Plausible, PostHog, or Google Analytics). Set this up in Settings → Integrations.
  </p>
</div>
```

---

## Task 11: Client Module Management API

**File:** `src/app/api/clients/[id]/modules/[id]/route.ts`

**Current State:** DELETE, GET, PATCH all return `"coming soon"` JSON. `installed: false` hardcoded.

**Fix:** Wire to actual `module_subscriptions` table:
```typescript
// GET — check if client has module enabled
const { data } = await supabase
  .from('module_subscriptions')
  .select('*')
  .eq('agency_id', agencyId)
  .eq('module_id', moduleId)
  .single()

return Response.json({ installed: !!data, subscription: data })
```

---

## Verification Checklist

- [ ] No duplicate routes — `/sites/*` orphaned tree removed
- [ ] `/dashboard/settings/*` cleaned up — branding component extracted
- [ ] Settings nav shows: Profile, Security, Notifications, General, Team, Branding, Regional, Domains, Modules, Subscription, Billing, Activity Log
- [ ] Admin nav shows all admin pages
- [ ] Error boundaries exist for all major route segments
- [ ] Portal login accessible without auth
- [ ] Embed pages accessible without auth
- [ ] No test/debug pages accessible in production
- [ ] No duplicate Zapier module in catalog
- [ ] Portal notifications in nav
- [ ] Site analytics shows proper empty state (not empty charts)
- [ ] Client module API returns real data
- [ ] `tsc --noEmit` returns zero errors

---

## Files Affected Summary

| Action | Count |
|--------|-------|
| **Delete** | ~15 files (orphaned `/sites/*` tree, test pages) |
| **Create** | ~10 files (error boundaries, not-found pages) |
| **Modify** | ~20 files (nav configs, middleware, module catalog, analytics UI, API routes) |
| **Extract** | 1 file (branding form → shared component) |
| **Total** | ~46 file operations |

---

## Priority Order

1. **Settings navigation fix** (quick win — users can't find pages)
2. **Middleware auth gaps** (security — portal/embed could break)
3. **Error boundaries** (prevents white-screen crashes)
4. **Duplicate route cleanup** (prevents confusion)
5. **Admin navigation fix** (admin pages are hidden)
6. **Portal navigation fix** (quick win)
7. **Test page cleanup** (security hygiene)
8. **Analytics empty states** (cosmetic but professional)
9. **Client module API** (feature completion)
10. **Duplicate Zapier removal** (housekeeping)

---

## Cross-Phase Dependencies

| This Phase | Depends On |
|------------|-----------|
| Task 3 (Settings nav — Regional) | Phase FIX-01 Task 5 (Regional settings page must exist first) |
| Task 5 (Error boundaries) | Independent — can do anytime |
| Task 6 (Middleware) | Independent — can do anytime |
| All other tasks | Independent |

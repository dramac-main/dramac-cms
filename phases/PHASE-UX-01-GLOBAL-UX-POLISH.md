# PHASE-UX-01: Global UX Polish & Navigation Excellence

**Priority**: 🔴 P0 (Critical Foundation)  
**Estimated Effort**: 2-3 days  
**Dependencies**: None  
**Goal**: Bring every dashboard page, portal page, and auth page to Vercel/Linear/Notion UX standards

---

## Context

DRAMAC CMS has an excellent foundation (Grade A sidebar, mobile responsive, command palette, empty states, dark mode). This phase fills the **targeted gaps** that prevent it from feeling like a premium SaaS product.

---

## Task 1: Global Route Progress Bar (NProgress)

**Problem**: No visual feedback during route transitions. Users click a link and see a blank/stale screen until the new page loads.  
**Solution**: Add a thin animated progress bar at the top of the viewport (like Vercel, GitHub, YouTube).

### Implementation

1. Install `nprogress` or build a custom one using Next.js `useRouter` events
2. Create `src/components/layout/route-progress.tsx`:
   - Thin 2px bar at `position: fixed; top: 0; z-index: 9999`
   - Uses primary brand color
   - Animated with CSS transitions
   - Shows on `routeChangeStart`, hides on `routeChangeComplete`
3. Mount in the root `layout.tsx` (or Providers component)
4. Support both App Router navigation and `router.push()` calls
5. **Alternative**: Use Next.js built-in `loading.tsx` files + a custom `<NavigationProgress>` component that intercepts `<Link>` clicks

### Acceptance Criteria
- [ ] Progress bar appears within 100ms of any navigation
- [ ] Bar animates smoothly from 0% → ~80% (trickle), then completes on load
- [ ] Works on desktop and mobile
- [ ] Respects `prefers-reduced-motion` (instant instead of animated)
- [ ] Uses brand primary color, visible in both light and dark mode

---

## Task 2: loading.tsx Files for All Major Routes

**Problem**: Only 8 of ~40+ dashboard routes have `loading.tsx`. Navigation to routes without it shows blank white/dark screens.  
**Solution**: Add skeleton-based loading states to every major route.

### Routes That Need loading.tsx

**Dashboard (top-level):**
- `src/app/(dashboard)/dashboard/page.tsx` — Dashboard overview skeleton
- `src/app/(dashboard)/dashboard/settings/page.tsx` — Settings skeleton
- `src/app/(dashboard)/dashboard/notifications/page.tsx` — Notification list skeleton
- `src/app/(dashboard)/dashboard/support/page.tsx` — Support skeleton

**Per-Site Dashboard:**
- `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` — Site overview skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/booking/page.tsx` — Booking skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/ecommerce/page.tsx` — Ecommerce skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/crm-module/page.tsx` — CRM skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/blog/page.tsx` — Blog list skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/pages/page.tsx` — Pages list skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/seo/page.tsx` — SEO skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/social/page.tsx` — Social skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/automation/page.tsx` — Automation skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/ai-agents/page.tsx` — AI Agents skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/ai-designer/page.tsx` — AI Designer skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/submissions/page.tsx` — Submissions skeleton
- `src/app/(dashboard)/dashboard/sites/[siteId]/settings/page.tsx` — Site settings skeleton

**Settings:**
- All `/settings/*` routes — Use `SkeletonComposer` with `type="settings"` variant

**Admin:**
- `src/app/(dashboard)/admin/page.tsx` — Admin overview skeleton
- `src/app/(dashboard)/admin/agencies/page.tsx` — Agency list skeleton  
- `src/app/(dashboard)/admin/users/page.tsx` — User list skeleton
- `src/app/(dashboard)/admin/modules/page.tsx` — Module list skeleton
- `src/app/(dashboard)/admin/billing/page.tsx` — Billing skeleton
- `src/app/(dashboard)/admin/analytics/page.tsx` — Analytics skeleton
- `src/app/(dashboard)/admin/health/page.tsx` — Health skeleton

**Portal:**
- All `/portal/*` routes — Use appropriate skeleton type

**Marketplace:**
- `src/app/(dashboard)/marketplace/page.tsx` — Grid skeleton
- `src/app/(dashboard)/marketplace/[moduleId]/page.tsx` — Detail skeleton

### Implementation Pattern
```typescript
// Example: src/app/(dashboard)/dashboard/sites/[siteId]/booking/loading.tsx
import { SkeletonComposer } from "@/components/ui/skeleton-composer";
export default function Loading() {
  return <SkeletonComposer type="dashboard" />;
}
```

Use the existing `SkeletonComposer` component with appropriate type variants: `dashboard`, `list`, `grid`, `detail`, `form`, `table`, `cards`, `settings`, `editor`.

### Acceptance Criteria
- [ ] Every dashboard route has a `loading.tsx` file
- [ ] Skeletons match the actual page layout (not generic placeholders)
- [ ] Skeletons use the correct variant from `SkeletonComposer`
- [ ] Loading states appear instantly on navigation (no blank screens)

---

## Task 3: Mobile-Responsive Dialogs (Full-Screen on Small Screens)

**Problem**: All 64+ dialogs use centered modal pattern. On mobile, they're tiny centered boxes that are hard to interact with.  
**Solution**: Make `DialogContent` responsive — centered on desktop, full-screen drawer on mobile.

### Implementation

1. Modify `src/components/ui/dialog.tsx` `DialogContent`:
   - Add responsive classes: full-width on mobile, centered on `sm:` and up
   - Mobile: `fixed inset-0 w-full h-full rounded-none` (full screen)
   - Tablet+: Current centered behavior `sm:max-w-lg sm:rounded-lg`
   - Add optional `mobileFullScreen` prop (default: `true`) so individual dialogs can opt out
2. Add swipe-to-dismiss gesture on mobile (drag down to close)
3. Ensure scroll works within full-screen dialog on mobile

### Acceptance Criteria
- [ ] All dialogs automatically go full-screen on mobile (< 640px)
- [ ] Close button is always accessible (top-right, 44px touch target)
- [ ] Content scrolls properly within full-screen dialog
- [ ] Desktop behavior is unchanged
- [ ] Swipe down gesture closes the dialog on mobile

---

## Task 4: Shared DataTable Component with Mobile Card View

**Problem**: 21+ tables built manually with no shared sorting, filtering, pagination, or mobile responsiveness.  
**Solution**: Build a reusable `DataTable` component that all tables can adopt.

### Implementation

1. Create `src/components/ui/data-table.tsx`:
   - Uses TanStack Table (@tanstack/react-table) — already in the project
   - Props: `columns`, `data`, `searchKey`, `filterableColumns`, `pageSize`
   - Built-in features:
     - **Sorting** (click column headers)
     - **Filtering** (search input + column-specific filters)
     - **Pagination** (prev/next, page size selector)
     - **Column visibility** toggle
     - **Row selection** (optional, with bulk actions toolbar)
     - **Mobile card view** — below `md` breakpoint, table converts to stacked cards
2. Create `src/components/ui/data-table-card.tsx` — mobile card layout for table rows
3. Create `src/components/ui/data-table-toolbar.tsx` — search, filters, column toggle, bulk actions
4. Create `src/components/ui/data-table-pagination.tsx` — pagination controls

### Mobile Card View Pattern
```
Desktop: Standard table with columns
Mobile:  Each row becomes a card:
         ┌────────────────────────────┐
         │ Primary field (bold)       │
         │ Secondary field (muted)    │
         │ Badge/status      Actions ▶│
         └────────────────────────────┘
```

### Migration Priority (adopt DataTable in these tables first)
1. `/dashboard/clients` — Client list
2. `/dashboard/sites` — Site list
3. `/dashboard/sites/[siteId]/submissions` — Form submissions
4. `/admin/agencies` — Agency list
5. `/admin/users` — User list

### Acceptance Criteria
- [ ] DataTable component with sorting, filtering, pagination
- [ ] Automatic card view on mobile (< 768px)
- [ ] Column visibility toggle (hide less important columns)
- [ ] Optional row selection with bulk actions
- [ ] 5 existing tables migrated to DataTable

---

## Task 5: Default Theme to "system"

**Problem**: Default theme is hardcoded to `"light"`. Users with OS dark mode see a bright flash.  
**Solution**: Change default to `"system"` to respect OS preference.

### Implementation
1. In `src/components/providers/index.tsx` (or wherever ThemeProvider is configured):
   - Change `defaultTheme="light"` to `defaultTheme="system"`
2. Add `color-scheme: light dark` to `<html>` element to prevent white flash before JS loads

### Acceptance Criteria
- [ ] New users see the theme matching their OS preference
- [ ] Existing users who manually chose a theme are unaffected
- [ ] No white flash on initial load for dark mode users

---

## Task 6: Skip-to-Content & Accessibility Fixes

**Problem**: Skip-to-content link is configured in brand/accessibility.ts but never rendered. Breadcrumbs hidden on mobile.

### Implementation
1. Add `<a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to content</a>` as first element in dashboard layout
2. Add `id="main-content"` to the main content area
3. Show breadcrumbs on mobile (remove `hidden sm:flex`, use horizontal scroll if too wide)
4. Add `aria-live="polite"` to toast container for screen reader announcements

### Acceptance Criteria
- [ ] Skip-to-content link works when Tab is pressed on page load
- [ ] Breadcrumbs visible on mobile with horizontal scroll
- [ ] Toast notifications announced to screen readers

---

## Task 7: Keyboard Shortcuts Help Dialog

**Problem**: Keyboard shortcuts menu item exists but is disabled. No way for users to discover shortcuts.

### Implementation
1. Create `src/components/layout/keyboard-shortcuts-dialog.tsx`
2. Trigger on `?` key press (when not in an input)
3. Show categorized shortcuts:
   - **Navigation**: `G then D` (Dashboard), `G then S` (Sites), `G then C` (Clients)
   - **Actions**: `⌘K` (Command palette), `⌘S` (Save), `⌘Z` (Undo)
   - **Editor**: Listed editor shortcuts
4. Enable the disabled menu item to open this dialog

### Acceptance Criteria
- [ ] `?` key opens shortcuts dialog
- [ ] All existing shortcuts are documented
- [ ] Dialog is searchable
- [ ] Menu item in user dropdown opens the same dialog

---

## Task 8: Onboarding Completion Celebration

**Problem**: Onboarding ends with a plain redirect. No celebration moment.

### Implementation
1. Add confetti animation on final onboarding step completion (use `canvas-confetti` or CSS animation)
2. Show a "You're all set!" success card with:
   - Confetti animation (1-2 seconds)
   - "Welcome to [Agency Name]!" heading
   - Quick action buttons: "Create your first site", "Explore the marketplace", "Invite your team"
3. Redirect to dashboard after 3 seconds or on button click

### Acceptance Criteria
- [ ] Confetti animation plays on onboarding completion
- [ ] Success card shows with quick action buttons
- [ ] Respects `prefers-reduced-motion` (no confetti, instant redirect)

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `src/components/layout/route-progress.tsx` | Global navigation progress bar |
| CREATE | ~25 `loading.tsx` files across routes | Skeleton loading states |
| MODIFY | `src/components/ui/dialog.tsx` | Mobile full-screen dialogs |
| CREATE | `src/components/ui/data-table.tsx` | Shared table component |
| CREATE | `src/components/ui/data-table-card.tsx` | Mobile card view |
| CREATE | `src/components/ui/data-table-toolbar.tsx` | Table toolbar |
| CREATE | `src/components/ui/data-table-pagination.tsx` | Pagination |
| MODIFY | `src/components/providers/index.tsx` | Default theme to "system" |
| MODIFY | Dashboard layout | Skip-to-content link |
| CREATE | `src/components/layout/keyboard-shortcuts-dialog.tsx` | Shortcuts help |
| MODIFY | Onboarding page | Confetti celebration |

---

## Testing Checklist

- [ ] Navigate every dashboard route — loading skeleton appears, no blank screens
- [ ] Progress bar visible on slow connections (throttle to 3G in DevTools)
- [ ] Open 5 different dialogs on mobile (375px) — all are full-screen
- [ ] DataTable: sort, filter, paginate on desktop; cards on mobile
- [ ] Fresh user sees system theme (matches OS)
- [ ] Tab key shows skip-to-content, Enter skips to main content
- [ ] `?` key opens shortcuts dialog
- [ ] Complete onboarding — confetti plays
- [ ] All interactions work on mobile Safari, Chrome Android
- [ ] Screen reader (NVDA/VoiceOver) can navigate all major flows

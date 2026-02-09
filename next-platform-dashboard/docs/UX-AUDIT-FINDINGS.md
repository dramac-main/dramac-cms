# UX Audit Findings — DRAMAC CMS Dashboard

**Date:** February 9, 2026  
**Scope:** All 155 `page.tsx` files under `(dashboard)/` route group  
**Methodology:** Full file reads of every major page, navigation config, and sidebar

---

## 🔴 CRITICAL Issues (Fix First)

### 1. Site Detail Page — 11-Button Header Explosion

**File:** `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` (Lines 62–132)

**What exists:** The `<PageHeader>` children contain up to **11 separate buttons** in a single horizontal row:
1. View Live
2. SEO
3. AI Designer (gradient-styled primary)
4. Analytics
5. Automation (conditional)
6. AI Agents (conditional)
7. Social (conditional)
8. CRM (conditional)
9. Settings
10. Edit Pages
11. Clone
12. Export (via `ExportSiteButton`)
13. Publish/Unpublish (via `SitePublishButton`)

**Problem:** This is the most-visited page per site, yet it has an overwhelming toolbar with 11-13 buttons of near-equal visual weight. On smaller screens this wraps chaotically. Several buttons (`Analytics`, `Social`, `CRM`) **also exist as tabs** on the same page, creating duplicated access.

**Fix:**
- Keep only **3 primary actions** visible: `Edit Pages` (primary CTA), `View Live`, `Publish/Unpublish`
- Move SEO, Analytics, Automation, AI Agents, Social, CRM into a **"More Actions" dropdown** or rely on the existing tab navigation below
- Move Clone, Export, Settings into a **kebab/three-dot overflow menu**
- Make "AI Designer" a contextual entry point inside the pages tab, not a top-level header button

---

### 2. Duplicate Route Trees — `/sites/` and `/dashboard/sites/`

**Files:**
- `src/app/(dashboard)/sites/page.tsx` → redirects to `/dashboard/sites`
- `src/app/(dashboard)/sites/[siteId]/page.tsx` → redirects to `/dashboard/sites/[siteId]`
- `src/app/(dashboard)/sites/[siteId]/seo/page.tsx` → exists independently
- `src/app/(dashboard)/sites/[siteId]/analytics/page.tsx` → exists independently
- `src/app/(dashboard)/sites/[siteId]/blog/page.tsx` → exists independently
- `src/app/(dashboard)/sites/[siteId]/submissions/page.tsx` → exists independently
- PLUS full route tree under `src/app/(dashboard)/dashboard/sites/[siteId]/...`

**Problem:** There are **two parallel route trees** for sites:
- `/sites/[siteId]/seo` — has its own full SEO page
- `/dashboard/sites/[siteId]/seo` — has ANOTHER full SEO page

Both are real pages (not just redirects). This means:
- Users may bookmark different URLs for the same feature
- Link references are inconsistent across the codebase (some link to `/sites/`, some to `/dashboard/sites/`)
- Double maintenance burden

**Fix:**
- Pick ONE canonical route tree (`/dashboard/sites/...`) and make ALL others redirect
- The `/sites/` top-level pages should ONLY contain `redirect()` calls
- Audit all `<Link>` components for path consistency

---

### 3. Three Separate Billing/Subscription Pages

**Files:**
- `src/app/(dashboard)/settings/billing/page.tsx` — Full billing with subscription card, usage, module subscriptions, invoice history
- `src/app/(dashboard)/settings/subscription/page.tsx` — Separate "Subscription" page with `SubscriptionDetails` component
- `src/app/(dashboard)/dashboard/billing/page.tsx` — THIRD billing page with tabs for overview/invoices

**Problem:** Three different pages for essentially the same information. The sidebar nav links to `/dashboard/billing`, settings has both `/settings/billing` and `/settings/subscription`, and they show overlapping but not identical information.

**Fix:**
- Consolidate into ONE billing page at `/settings/billing` (or `/dashboard/billing`)
- Make `/settings/subscription` redirect to the billing page
- Remove the standalone subscription page entirely
- Use tabs within the single billing page for Overview, Invoices, Module Subscriptions

---

### 4. Three "My Modules" / "Installed Modules" Pages

**Files:**
- `src/app/(dashboard)/settings/modules/page.tsx` — "My Modules" page with table, cancel subscription
- `src/app/(dashboard)/marketplace/installed/page.tsx` — "Installed Modules" page (hardcoded empty state)
- `src/app/(dashboard)/dashboard/modules/subscriptions/page.tsx` — "My Modules" with stats, subscription list, markup CTA

**Problem:**
- Three different pages to see "what modules do I have"
- The sidebar links to `/dashboard/modules/subscriptions`
- `/settings/modules` shows a similar but different view
- `/marketplace/installed` is a dead stub (hardcoded empty array)
- They use different components and show different information

**Fix:**
- Single source of truth at `/dashboard/modules/subscriptions`
- `/settings/modules` → redirect to the above
- `/marketplace/installed` → redirect to the above
- Merge the best UX elements from all three into one page

---

## 🟠 HIGH Issues

### 5. Domain Settings Scattered Across 3 Locations

**Files:**
- `src/app/(dashboard)/settings/domains/page.tsx` — Simple card with `DomainsManager` component
- `src/app/(dashboard)/dashboard/domains/page.tsx` — Full domain portfolio page with stats, domain list
- `src/app/(dashboard)/dashboard/settings/domains/page.tsx` — Domain business settings (pricing, branding, billing)

**Problem:** "Domains" means different things on different pages. A user looking for domain settings could end up in 3 completely different places:
- Settings → Domains (custom domain for white-labeling)
- Dashboard → Domains (domain portfolio management)
- Dashboard → Settings → Domains (domain pricing/markup for reselling)

The sidebar links to `/dashboard/domains` but the settings sidebar links to `/settings/domains`.

**Fix:**
- `/settings/domains` = your agency's own custom domain (keep, rename to "Custom Domain")
- `/dashboard/domains` = domain portfolio management (keep as is)
- `/dashboard/settings/domains/` = domain pricing (move under `/dashboard/domains/settings/` as a sub-route)
- Make navigation labels explicit: "My Domain" vs "Domain Portfolio" vs "Domain Pricing"

---

### 6. Domains Page — Duplicate Header Buttons

**File:** `src/app/(dashboard)/dashboard/domains/page.tsx` (Lines 105-117)

**What exists:**
```
[Search Domains] [Register Domain]
```

**Problem:** Both buttons link to the **exact same URL** (`/dashboard/domains/search`). "Search Domains" and "Register Domain" look like different features but go to the same place.

**Fix:** Keep only one button: "Register Domain" (primary). The search functionality is a step within registration, not a separate action.

---

### 7. SEO Page — 5-Tab Settings + 4-Card Navigation

**File:** `src/app/(dashboard)/dashboard/sites/[siteId]/seo/page.tsx` (Lines 1-300+)

**What exists:**
- 4 stat/navigation cards (Score, Pages, Sitemap link, Robots.txt link)
- 5 tabs: General, Social, Verification, Analytics, Pages
- Within each tab, multiple form fields with save functionality

**Problem:** This is a dense page that tries to be both a dashboard (score overview) and a settings page (form fields). The Sitemap and Robots.txt cards are clickable navigation links disguised as stat cards — unclear affordance. The "Pages" tab is a full page list that could be its own route.

**Fix:**
- Split into: SEO Overview (dashboard with scores, quick actions) and SEO Settings (form tabs)
- Make Sitemap/Robots.txt links explicit ("Configure Sitemap →" text link, not a card)
- Move the Pages tab content to `/dashboard/sites/[siteId]/seo/pages` (which already exists!)

---

### 8. Site Settings — 6 Tabs Including "Danger Zone"

**File:** `src/app/(dashboard)/dashboard/sites/[siteId]/settings/page.tsx` (Lines 52-90)

**What exists:** 6 tabs: General, Domains, SEO, Modules, Backups, Danger Zone

**Problem:**
- "SEO" tab here duplicates the full SEO page at `/dashboard/sites/[siteId]/seo`
- "Modules" tab here uses the same `SiteModulesTab` component as the site detail page's Modules tab
- "Danger Zone" as a visible tab is alarming — users accidentally clicking it see delete options
- That's 3 places where "modules" appears for the same site (site detail tabs, site settings tabs, standalone modules page)

**Fix:**
- Remove SEO and Modules tabs from site settings (they have dedicated pages)
- Keep: General, Domains, Backups
- Move "Danger Zone" into a collapsible section at the bottom of General, not its own tab
- Add destructive actions behind a confirmation step (already done) but reduce visibility

---

### 9. Email Page — Non-Functional Filter Button

**File:** `src/app/(dashboard)/dashboard/email/page.tsx` (Lines 57-66)

**What exists:**
```jsx
<Input placeholder="Search by domain..." className="pl-9" />
<Button variant="outline">
  <Filter className="h-4 w-4 mr-2" />
  Filter
</Button>
```

**Problem:** The search input and the Filter button are **completely non-functional** — they aren't connected to any state or query. The input has no `value` or `onChange`, the button has no `onClick`. They're pure visual decoration.

**Fix:** Either wire up the filter functionality or remove the non-functional UI elements entirely. Users clicking these and seeing nothing happen erodes trust.

---

### 10. "Marketplace" Navigation Confusion

**Files:**
- `src/app/(dashboard)/marketplace/page.tsx` — Main marketplace
- `src/app/(dashboard)/marketplace/v2/page.tsx` — Redirects to `/marketplace`
- `src/app/(dashboard)/marketplace/installed/page.tsx` — Dead stub
- `src/app/(dashboard)/marketplace/success/page.tsx` — Post-checkout
- Sidebar links: "Browse Modules" → `/marketplace`, "My Subscriptions" → `/dashboard/modules/subscriptions`
- Various pages link to `/marketplace/v2`, `/marketplace`, or just `/marketplace`

**Problem:**
- Marketplace V2 redirects exist but old links still point there
- "Browse Marketplace" button on `/settings/modules` links to `/marketplace` (no dashboard prefix)
- "Browse Marketplace" on `/dashboard/modules/subscriptions` links to `/marketplace/v2`
- Installed modules page is a non-functional stub

**Fix:**
- Canonical URL: `/marketplace` (already the redirect target)
- Search-and-replace all `/marketplace/v2` references to `/marketplace`
- Delete the `/marketplace/v2/` route (keep only the redirect temporarily)
- Delete `/marketplace/installed/` page

---

## 🟡 MEDIUM Issues

### 11. Dashboard Home — Delegates Everything to Client Component

**File:** `src/app/(dashboard)/dashboard/page.tsx` (Lines 1-14)

The page is just:
```tsx
const data = await getDashboardData();
return <DashboardClient data={data} />;
```

**Problem:** Without seeing `DashboardClient`, the page structure is opaque. But the bigger issue is that the dashboard root (`/`) redirects to `/dashboard`, and `/dashboard` is a server page that loads a massive client component. This pattern prevents granular loading states.

**Fix:** Break `DashboardClient` into server-rendered sections with individual `<Suspense>` boundaries, matching the pattern used by the admin dashboard which is well-structured.

---

### 12. Inconsistent Page Header Patterns

**Across all pages:**
- Some pages use `<PageHeader>` component: Sites, Clients, Settings pages
- Some pages use custom `<div>` headers: Domains, Email, Media Library, Support
- Some pages use `<DashboardShell>` wrapper: CRM, Notifications, Clients, Support
- Some pages use neither: SEO, Blog, Submissions, AI Designer

**Problem:** No consistent layout pattern. Some pages have `<DashboardShell>` wrapping (adds consistent padding/max-width), others are raw `<div>`. The visual spacing, header sizing, and action button placement varies page-to-page.

**Fix:**
- Every page should use `<DashboardShell>` for consistent spacing
- Every page should use `<PageHeader>` for the title/description/actions bar
- Create a lint rule or convention guide

---

### 13. AI Designer vs AI Builder — Two Separate AI Features

**Files:**
- `src/app/(dashboard)/dashboard/sites/[siteId]/ai-designer/page.tsx` — 891-line client component, full AI page generator
- `src/app/(dashboard)/dashboard/sites/[siteId]/builder/page.tsx` — `AIBuilderWizard` component, different AI flow

**Problem:** Two separate AI-powered site generation features with different names, different UIs, and different capabilities. The site detail header has "AI Designer" button. There's also a "builder" page. Users don't know which to use.

**Fix:**
- Consolidate into ONE AI feature with a clear name ("AI Designer")
- The builder page should redirect to the AI designer, or be removed if superseded
- Have one clear entry point from the site detail page

---

### 14. Module Request vs Marketplace — Confusing Discovery

**Files:**
- `src/app/(dashboard)/dashboard/modules/requests/page.tsx` — Request custom modules
- `src/app/(dashboard)/marketplace/page.tsx` — Header has "Request a Module" button

**Problem:** "Request a Module" button on the marketplace links to `/dashboard/modules/requests/new` — a path that's deeply nested and not obviously accessible from the sidebar. The sidebar only has "Browse Modules" and "My Subscriptions".

**Fix:**
- Add "Module Requests" to the sidebar under the Marketplace section
- Or move the request flow into a dialog/sheet triggered from the marketplace page itself

---

### 15. Media Library — `prompt()` for Folder Creation

**File:** `src/app/(dashboard)/dashboard/media/page.tsx` (Lines 308-312)

```tsx
onClick={() => {
  const name = prompt("Folder name:");
  if (name) handleCreateFolder(name, currentFolderId || undefined);
}}
```

**Problem:** Using `window.prompt()` for folder creation is jarring and looks broken on mobile. It also can't validate input or show errors inline.

**Fix:** Replace with a small dialog/popover with an input field, validation, and proper create button.

---

### 16. Module Pricing Uses `$` Hardcoded, Not `formatCurrency()`

**File:** `src/app/(dashboard)/settings/modules/page.tsx` (Lines 123-127)

```tsx
<p className="font-medium">
  ${sub.billing_cycle === "yearly"
    ? sub.module?.price_yearly
    : sub.module?.price_monthly}
</p>
```

**Problem:** Hardcoded `$` symbol instead of using `formatCurrency()` from locale-config. This violates the Zambia-first locale pattern documented in systemPatterns.md.

**Fix:** Import and use `formatCurrency()` from `@/lib/locale-config`.

---

### 17. E-Commerce/Booking/CRM Module Pages — Identical "Back to Site" Pattern

**Files:**
- `src/app/(dashboard)/dashboard/sites/[siteId]/ecommerce/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/booking/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/crm-module/page.tsx`

All three have identical boilerplate:
```tsx
<div className="border-b px-6 py-3">
  <Link href={`/dashboard/sites/${siteId}?tab=modules`}>
    <Button variant="ghost" size="sm">
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Site
    </Button>
  </Link>
</div>
```

**Problem:** Copy-pasted navigation pattern that should be a shared layout component. Each module page reimplements the back button differently (some link to `?tab=modules`, some to `?tab=crm`, inconsistently).

**Fix:** Create a shared `ModulePageLayout` wrapper component or use the Next.js layout mechanism at `sites/[siteId]/layout.tsx` to provide consistent back navigation for all module sub-pages.

---

### 18. Submissions Page — 536 Lines of Client-Side Everything

**File:** `src/app/(dashboard)/dashboard/sites/[siteId]/submissions/page.tsx` (380 lines)

**Problem:** Entire page is `"use client"` with all data fetching in `useEffect`. This means:
- No SSR, no loading.tsx integration
- Search engines can't index
- Full-page spinner on every load
- User sees blank page until JS executes

Same issue with Media Library (536 lines of client code) and Blog posts page (239 lines).

**Fix:** Convert data fetching to server component pattern with `<Suspense>`. Keep interactive parts (filters, selection) as client islands.

---

## 🔵 LOW Issues

### 19. Support Page — Links to Non-Existent Routes

**File:** `src/app/(dashboard)/dashboard/support/page.tsx` (Lines 29-46)

Links to `/docs`, `/docs/faq`, `/docs/getting-started`, etc. — these routes likely don't exist in the dashboard app.

**Fix:** Update links to point to actual documentation URLs (external docs site or create the routes).

---

### 20. Settings Page — Just a Redirect

**File:** `src/app/(dashboard)/settings/page.tsx`

```tsx
export default function SettingsPage() {
  redirect("/settings/profile");
}
```

**Problem:** Minor — the settings landing page is just a redirect. This is fine if the sidebar highlights the correct item, but could be improved with a settings overview page.

---

### 21. Admin Dashboard — Well-Structured (Use as Reference)

**File:** `src/app/(dashboard)/admin/page.tsx`

This is the **best-structured page** in the project. Clean server component, proper Suspense, stat cards + activity feed. Other pages should follow this pattern.

---

## 📊 Summary Matrix

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 4 | Button clutter, duplicate routes, duplicate pages |
| 🟠 High | 6 | Scattered settings, dead UI, navigation confusion |
| 🟡 Medium | 8 | Inconsistency, copy-paste patterns, client-heavy pages |
| 🔵 Low | 3 | Dead links, minor polish |
| **Total** | **21** | |

## 🎯 Recommended Fix Order

1. **Site detail button explosion** (#1) — Highest-traffic page, worst UX
2. **Consolidate billing pages** (#3) — Easy win, delete 2 pages
3. **Consolidate modules pages** (#4) — Easy win, delete 2 pages
4. **Fix duplicate domains buttons** (#6) — 5-minute fix
5. **Remove dead email filter UI** (#9) — 5-minute fix
6. **Fix currency hardcoding** (#16) — 5-minute fix
7. **Standardize page headers** (#12) — Systematic but high impact
8. **Deduplicate site route trees** (#2) — Requires link audit
9. **Consolidate domain settings** (#5) — Needs UX decision
10. **Fix media library prompt()** (#15) — Small but jarring

---

## 📁 Files That Need the Most Work

| File | Issues | Lines |
|------|--------|-------|
| `dashboard/sites/[siteId]/page.tsx` | #1, #2, #8 | 173 |
| `settings/modules/page.tsx` | #4, #16 | 200 |
| `dashboard/domains/page.tsx` | #5, #6 | 148 |
| `dashboard/email/page.tsx` | #9 | 100 |
| `dashboard/media/page.tsx` | #15, #18 | 536 |
| `settings/billing/page.tsx` + `subscription/page.tsx` + `dashboard/billing/page.tsx` | #3 | 200+ total |

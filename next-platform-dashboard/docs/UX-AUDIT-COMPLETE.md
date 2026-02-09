# Comprehensive UX Audit — DRAMAC CMS Platform

**Date:** February 9, 2026  
**Scope:** All portal, admin, auth, and settings pages  
**Total Pages Audited:** 50+ page files, 17 layout/navigation components  

---

## Executive Summary

| Category | Issues Found | Severity |
|----------|-------------|----------|
| Duplicate / Redundant Pages | 6 | 🔴 High |
| Button Clutter / Confusing CTAs | 8 | 🟠 Medium |
| Over-complicated Layouts | 7 | 🟠 Medium |
| Inconsistent Patterns | 12 | 🟡 Medium |
| Navigation Bloat | 4 | 🟠 Medium |
| Form UX Issues | 5 | 🟡 Low-Medium |
| **Total** | **42** | |

---

## 🔴 1. DUPLICATE / REDUNDANT PAGES

### 1.1 — Admin: THREE separate billing/revenue/subscriptions pages showing overlapping data

| Page | Route | What it shows |
|------|-------|---------------|
| `src/app/(dashboard)/admin/billing/page.tsx` | `/admin/billing` | MRR/ARR metrics, revenue overview via `<AdminBillingOverview>` |
| `src/app/(dashboard)/admin/billing/revenue/page.tsx` | `/admin/billing/revenue` | Revenue tab, Subscriptions tab, Activity tab (all via Tabs) |
| `src/app/(dashboard)/admin/subscriptions/page.tsx` | `/admin/subscriptions` | Subscriber count, MRR, plan breakdown table, recent transactions |

**Problem:** All three pages show MRR, subscription counts, and revenue. A super admin sees "Subscriptions" and "Billing & Revenue" as separate sidebar items pointing to near-identical dashboards.

**Fix:** Merge into a SINGLE `/admin/billing` page with tabs: Overview | Subscriptions | Revenue Analytics | Activity. Remove `/admin/subscriptions` entirely. Remove the separate `/admin/billing/revenue` route — put its tab content into the main billing page.

---

### 1.2 — Admin: Activity Log vs Audit Logs — two pages for the same concept

| Page | Route | What it shows |
|------|-------|---------------|
| `src/app/(dashboard)/admin/activity/page.tsx` | `/admin/activity` | Activity log with filters, export button |
| `src/app/(dashboard)/admin/audit/page.tsx` | `/admin/audit` | Audit logs (delegated to `audit-client.tsx`) |

**Problem:** Both are audit trail / activity log pages. The Activity page even has an info card saying "This page displays a **mock activity log**." The Audit page delegates to a client component. Two sidebar entries for the same concept.

**Fix:** Merge into a single `/admin/audit` page. Remove `/admin/activity` entirely. Combine the filter UI from the Activity page into the Audit page.

---

### 1.3 — Admin: Analytics page has System Health + Activity tabs, duplicating standalone pages

| Page | Route | Duplicate of |
|------|-------|--------------|
| `src/app/(dashboard)/admin/analytics/page.tsx` tab | `/admin/analytics` → "System Health" tab | `/admin/health` standalone page |
| `src/app/(dashboard)/admin/analytics/page.tsx` tab | `/admin/analytics` → "Activity" tab | `/admin/activity` standalone page |

**Problem:** The Analytics page has 3 tabs: Overview, **System Health**, **Activity**. But System Health and Activity both have their own full standalone pages at `/admin/health` and `/admin/activity`. Triple redundancy.

**Fix:** The Analytics page should ONLY contain the Overview tab. Remove the "System Health" and "Activity" tabs from it. Keep `/admin/health` and `/admin/audit` (merged) as the canonical pages.

---

### 1.4 — Admin: Agency Analytics as both a standalone page AND sidebar entry

| Page | Route |
|------|-------|
| `src/app/(dashboard)/admin/agencies/analytics/page.tsx` | `/admin/agencies/analytics` |

**Problem:** This is its own sidebar entry ("Agency Analytics") AND reachable from the agencies list. Having its own top-level sidebar entry inflates the admin nav from 9 to 11 items.

**Fix:** Remove "Agency Analytics" from the top-level sidebar nav. Make it accessible only from a tab or link within the `/admin/agencies` page.

---

### 1.5 — Portal Notifications: "Notification Types Legend" card wastes space

**File:** `src/app/portal/notifications/page.tsx` — Lines 120-140

**Problem:** At the bottom of the notifications list there's a decorative "Notification Types" legend card explaining the icon colors. This adds visual noise and no one reads it.

**Fix:** Remove the legend card entirely. The icon colors are self-explanatory.

---

### 1.6 — Portal SEO: Static "SEO Tips" card clutters the page

**File:** `src/app/portal/seo/page.tsx` — bottom section

**Problem:** A large "SEO Tips" card with generic HTML best-practices is permanently displayed below the SEO scores. This is filler content that most portal clients won't read.

**Fix:** Move SEO tips into a collapsible `<details>` or an info tooltip. Don't show it by default.

---

## 🟠 2. BUTTON CLUTTER / CONFUSING CTAs

### 2.1 — Admin Modules page: 6+ navigation targets on one screen

**File:** `src/app/(dashboard)/admin/modules/page.tsx`

**Current buttons/actions:**
1. PageHeader: "Requests" button (with badge)
2. PageHeader: "Create Module" button
3. Quick Action card → Module Studio
4. Quick Action card → Module Testing
5. Quick Action card → Wholesale Pricing
6. Quick Action card → Module Analytics
7. Tabs: All / Active / Drafts / Deprecated

**Problem:** The "Create Module" button AND the "Module Studio" card both go to `/admin/modules/studio`. The "Requests" button in the header AND a sidebar entry compete for attention. Too many equally-weighted cards.

**Fix:**
- Remove the 4 Quick Action cards — they duplicate sidebar links and the header buttons
- Keep only the header actions (Requests + Create Module) + the tabbed module list

---

### 2.2 — Portal Submissions page: Header takes ~50% of viewport

**File:** `src/app/portal/submissions/page.tsx`

**Current header stack (vertical):**
1. Title + Refresh + Export CSV buttons
2. Site selector dropdown (if multi-site)
3. Single-site info bar (if single site)
4. 4 stat cards (Total, New, Today, This Week)
5. 2 filter dropdowns (status + form)
6. Then the actual submission table

**Problem:** The header takes up ~50% of viewport height before any submissions are visible. On mobile, users must scroll past 6 UI elements to see data.

**Fix:**
- Collapse the stat cards into a single summary line: "42 total · 5 new · 3 today"
- Move site selector into the filter row, not its own section
- Put Export CSV into a dropdown menu (⋯) instead of a prominent button

---

### 2.3 — Portal Email page: 3 redundant "Contact Support" buttons

**File:** `src/app/portal/email/page.tsx`

**Buttons:**
1. Empty state → "Contact Support" button
2. Help Section → "Contact Support" button  
3. Security Tips card → implicit support reference

**Fix:** Keep only ONE "Contact Support" CTA — in the empty state OR in the help section, not both.

---

### 2.4 — Portal Domains page: 2 "Contact Support" buttons

**File:** `src/app/portal/domains/page.tsx`

1. Empty state → "Contact Support"
2. Help card at bottom → "Contact Support"

**Fix:** Same — only show the CTA relevant to the current state. Remove the help card when domains exist.

---

### 2.5 — Admin Settings page: 3 "Save" buttons, none functional

**File:** `src/app/(dashboard)/admin/settings/page.tsx`

**Problem:** "Save Changes" (General), "Save Domain Settings" (Domains) — neither button has an onClick handler or form action. The Switch toggles also appear interactive but aren't wired up. The entire page is a non-functional UI shell.

**Fix:** Wire up save actions OR mark non-functional sections as "Coming Soon." Currently it gives a false impression of configurability.

---

### 2.6 — Admin Health page: Refresh button broken in server component

**File:** `src/app/(dashboard)/admin/health/page.tsx` — Line 149

**Code:** `<Button variant="outline" onClick={() => window.location.reload()}>`

**Problem:** This is a server component that uses `onClick` — this will either throw a hydration error or silently do nothing. Server components cannot have event handlers.

**Fix:** Extract the refresh button into a client component wrapper, or use a `<form>` with `action` for server-side revalidation.

---

### 2.7 — Portal Invoices: "View" + "Receipt" buttons per row

**File:** `src/app/portal/invoices/page.tsx` — Lines 260-290

**Problem:** Each invoice row has TWO buttons ("View" and "Receipt") that both open external URLs. On mobile, these create a cramped 2-button layout in every table row.

**Fix:** Merge into a single "View Invoice" link. Show receipt as a secondary option in a dropdown.

---

### 2.8 — Dashboard Settings > Domains: Quick Actions card duplicates page links

**File:** `src/app/(dashboard)/dashboard/settings/domains/page.tsx`

**Quick Actions buttons:**
1. "View All Domains" → `/dashboard/domains` (already in main sidebar)
2. "Register New Domain" → `/dashboard/domains/search` (already accessible from sidebar)
3. "Edit Pricing" → `/dashboard/settings/domains/pricing` (config card above already links there)

**Fix:** Remove the "Quick Actions" card entirely. The 3 settings config cards provide all needed navigation.

---

## 🟠 3. OVER-COMPLICATED LAYOUTS

### 3.1 — Portal Settings: 3 unrelated sections in one vertical scroll

**File:** `src/app/portal/settings/page.tsx` — 381 lines

**Problem:** Profile, Password, and Notification sections stacked vertically with no tabs or sectioning. Form data initialized with hardcoded placeholder data — never actually loaded from server. Uses `useState(() => { setFormData(...) })` which is a misuse of the API.

**Fix:**
- Use tabs: Profile | Security | Notifications
- Load real user data via `useEffect` 
- Fix the `useState` misuse on line 58

---

### 3.2 — Admin Settings: 6 cards, 20+ items, all non-functional

**File:** `src/app/(dashboard)/admin/settings/page.tsx` — 250+ lines

**Sections:** General, Email, Notifications, Security, Database & Maintenance, Domains

**Problem:** 6 stacked cards with no functional save actions. Database section (backup/cache/maintenance mode) are devops concerns that don't belong in an admin UI. Everything is a cosmetic mockup.

**Fix:**
- Use tabs: General | Email | Security | System
- Wire up actual save actions or mark as "Coming Soon"
- Remove Database section — these are infrastructure operations

---

### 3.3 — Onboarding: 6-step wizard is excessive

**File:** `src/app/(auth)/onboarding/page.tsx` — 656 lines

**Steps:** Profile → Agency → Goals → Industry → First Client → Complete

**Problem:** 6 steps causes drop-off. Goals and Industry could be one step. First Client should be prompted after onboarding, not during it.

**Fix:** Consolidate to 3 steps: Profile → Agency Details (goals + industry combined) → All Set!

---

### 3.4 — Portal Analytics: Hardcoded growth percentages are misleading

**File:** `src/app/portal/analytics/page.tsx` — Lines 66-120

**Problem:** Growth indicators like "12% from last month", "8% from last month" are **hardcoded strings**, not calculated from data. Users may make business decisions based on fake growth numbers.

**Fix:** Calculate real growth from analytics data, or remove the growth indicators entirely.

---

### 3.5 — Admin Subscriptions: Mock data presented as real

**File:** `src/app/(dashboard)/admin/subscriptions/page.tsx` — Lines 37-42

**Problem:** Plan distribution (Free: 40%, Starter: 35%, Professional: 20%, Enterprise: 5%) is fabricated from `Math.floor((totalAgencies) * 0.4)` etc. The "Recent Transactions" section says "Payment integration not configured."

**Fix:** Query real billing data, or show a placeholder: "Connect billing to view subscription data."

---

### 3.6 — Domain Settings Overview: Triple-layered navigation

**File:** `src/app/(dashboard)/dashboard/settings/domains/page.tsx`

**Layers:** 4 stat cards → 3 config cards → Quick Actions section

**Problem:** Three sections all compete for attention. Quick Actions duplicates the config cards above it.

**Fix:** Remove Quick Actions. Stats + Config Cards is sufficient.

---

### 3.7 — Portal Media page: Separate filter card adds unnecessary chrome

**File:** `src/app/portal/media/page.tsx` — Lines 155-195

**Problem:** The site selector, search bar, and file type filter are wrapped in a `<Card>` with padding, creating a heavy visual block between the header and the grid. Filters should feel lightweight, not like a separate section.

**Fix:** Move filters into a simple toolbar row without card wrapper.

---

## 🟡 4. INCONSISTENT PATTERNS

### 4.1 — Header patterns: 4 different styles across pages

| Pattern | Used By |
|---------|---------|
| `<PageHeader>` component | Portal Dashboard, Support, Domains, Email; Admin Dashboard, Modules, Activity, Health, Billing |
| Manual `<h1>` + `<p>` | Portal Media, Submissions, SEO, Blog, Analytics, Invoices, Notifications |
| `<h1 className="text-3xl font-bold">` (larger variant) | Portal Analytics, Notifications, Domain Settings |
| Icon inline in `<h1>` | Portal Media, Submissions, SEO, Invoices, Blog |

**Fix:** Use `<PageHeader>` on ALL pages. Add optional `icon` prop to PageHeader.

---

### 4.2 — Empty states: 5 different implementations

| Pattern | Example Pages |
|---------|---------------|
| Centered card with icon + CTA button | Portal Sites, Support, Media |
| Centered div (no card) | Portal Media (no sites), Submissions (no sites) |
| Table cell "No data" text | Admin Subscriptions |
| `py-12 text-center` card | Portal SEO, Blog |
| Full-page centered with description | Submissions (no access) |

**Fix:** Create a shared `<EmptyState>` component with props: `icon`, `title`, `description`, `action`.

---

### 4.3 — Loading states: 3 incompatible patterns

| Pattern | Example Pages |
|---------|---------------|
| Full-page `<Loader2>` spinner | Portal Media, Submissions, SEO, Invoices |
| `<Suspense fallback={<Skeleton>}>` | Admin Billing, Analytics, Agency Analytics |
| No loading state (server component) | Portal Support, Email, Domains, Blog, Notifications |

**Fix:** Client pages should use skeleton loaders. Server pages should have `loading.tsx` files.

---

### 4.4 — Refresh buttons: 3 different implementations

| Implementation | Pages |
|---------------|-------|
| `<RefreshCcw>` with spin animation | Portal Media, Submissions, Invoices |
| `<RefreshCw>` with text label | Admin Health |
| `window.location.reload()` (broken) | Admin Health |

**Fix:** Standardize on one pattern. Use `router.refresh()` in client components.

---

### 4.5 — Admin sidebar: 11 ungrouped items

**File:** `src/config/admin-navigation.ts`

**Items:** Overview, Agencies, Agency Analytics, Users, Modules, Subscriptions, Billing & Revenue, Platform Analytics, Activity Log, System Health, Settings

**Fix after deduplication (7 items, grouped):**
```
Overview
── People ──
  Agencies
  Users
── Platform ──
  Modules
  Billing & Revenue
── System ──
  Audit Log
  System Health
  Settings
```

---

### 4.6 — Portal sidebar: 13 items for client-facing UI

**File:** `src/config/portal-navigation.ts`

**Problem:** 13 nav items is overwhelming for a CLIENT portal. Most clients need Sites + Support. Features like SEO, Blog, Media are advanced.

**Fix:** Show only core items (Dashboard, Sites, Support, Settings). Conditionally show advanced items based on what features the client's site uses.

---

### 4.7 — Portal Login vs Auth Login: Separate implementations

| Page | Route | Implementation |
|------|-------|---------------|
| `portal/login/page.tsx` | `/portal/login` | 314-line inline component with tabs, magic link, forgot password |
| `(auth)/login/page.tsx` | `/login` | Clean 40-line page delegating to `<LoginForm>` |

**Finding:** The portal login handles 3 flows (magic link, password, forgot password) inline. The auth login cleanly delegates. Portal login should extract forgot-password to `/portal/forgot-password` for consistency.

---

### 4.8 — Metadata titles: Inconsistent branding format

| Pattern | Example |
|---------|---------|
| `"Title \| DRAMAC"` | Login, Signup, Forgot Password |
| `"Title \| Admin \| DRAMAC"` | Admin Users, Activity, Health |
| `"Title \| Client Portal"` | Portal Dashboard, Sites |
| `"Title - Admin"` | Admin Billing (no "DRAMAC") |

**Fix:** Standardize all page titles.

---

### 4.9 — Date formatting: 4 different approaches

| Method | Pages |
|--------|-------|
| `formatDistanceToNow()` | Portal Dashboard, Sites, Support, Domains, Notifications |
| `format(date, 'PPpp')` | Admin Activity |
| `new Date().toLocaleDateString()` | Portal Invoices, Domains |
| Custom `formatDate()` | Portal Invoices |

**Fix:** Create shared `formatDate()` and `formatRelativeTime()` utilities.

---

### 4.10 — Currency formatting: Multiple ad-hoc functions

**Files with local formatCurrency:**
- `portal/invoices/page.tsx` (divides by 100)
- `admin/subscriptions/page.tsx` (inline `$${value}`)
- `admin/page.tsx` (divides by 100)
- `settings/domains/page.tsx` (local `formatPrice`)

**Fix:** Create a single shared `formatCurrency()` utility. The project already has `DEFAULT_LOCALE` and `DEFAULT_CURRENCY`.

---

### 4.11 — Portal Apps page bypasses portal layout

**File:** `src/app/portal/apps/page.tsx`

**Problem:** Renders its own `<PortalHeader>` and `<main className="container">`, ignoring the portal layout shell. Looks visually different from all other portal pages.

**Fix:** Remove inline header/main wrapper. Let the portal layout provide the shell.

---

### 4.12 — Portal Apps: Only works for impersonation, not real portal users

**File:** `src/app/portal/apps/page.tsx` — Lines 26-28

**Problem:** Checks `cookies().get("impersonating_client_id")` and redirects to `/dashboard` if missing. Real portal clients can't access their installed apps.

**Fix:** Support `requirePortalAuth()` as the primary auth method, with impersonation as fallback.

---

## 🟡 5. FORM UX ISSUES

### 5.1 — Portal Settings: `useState` misused as side effect

**File:** `src/app/portal/settings/page.tsx` — Line 58

```tsx
useState(() => {
  setFormData({ name: "Client User", email: "client@example.com", ... });
});
```

**Problem:** `useState()` with a function is for lazy initialization of state value, not side effects. This may cause unexpected behavior and the data is hardcoded.

**Fix:** Use `useEffect()` to fetch real user data on mount.

---

### 5.2 — Portal Settings: Password change doesn't verify current password

**File:** `src/app/portal/settings/page.tsx` — `handlePasswordSubmit`

**Problem:** The "Current Password" field exists in the UI but is never sent to the server. `changePortalPassword(passwords.newPassword)` only sends the new password.

**Fix:** Verify current password server-side before allowing the change.

---

### 5.3 — Auth Reset Password: No visual password strength indicator

**File:** `src/app/(auth)/reset-password/page.tsx` — Lines 32-39

**Problem:** Password requirements (uppercase, lowercase, number, 8+ chars) are only shown as error messages after failed submission. No real-time feedback.

**Fix:** Add a password strength meter showing which requirements are met as the user types.

---

### 5.4 — Onboarding: Goals and Industry steps redundantly save full agency data

**File:** `src/app/(auth)/onboarding/page.tsx` — Lines 234-285

**Problem:** Both `handleGoalsNext()` and `handleIndustryNext()` call `updateAgencyAction()` with ALL fields (name, description, website, industry, teamSize, goals). Each step re-saves everything.

**Fix:** Create granular update functions that only save the relevant fields for each step.

---

### 5.5 — Admin Settings: Inputs have `defaultValue` but no state management

**File:** `src/app/(dashboard)/admin/settings/page.tsx`

**Problem:** Every input uses `defaultValue` with hardcoded strings ("DRAMAC", "support@dramac.app"). No `onChange`, no form submission. Buttons labeled "Save Changes" do nothing.

**Fix:** Wire up form state + server actions, or clearly mark as placeholder.

---

## 📋 Priority Action Plan

### P0 — Must Fix (Broken / Misleading)
| # | Issue | Files |
|---|-------|-------|
| 1 | Admin Health refresh button broken (server component onClick) | `admin/health/page.tsx` L149 |
| 2 | Portal Settings loads fake data, useState misuse | `portal/settings/page.tsx` L58 |
| 3 | Portal Apps page only works for impersonation | `portal/apps/page.tsx` L26 |
| 4 | Admin Settings buttons non-functional | `admin/settings/page.tsx` |
| 5 | Portal Analytics shows hardcoded growth % | `portal/analytics/page.tsx` L66-120 |
| 6 | Admin Subscriptions shows fabricated data | `admin/subscriptions/page.tsx` L37-42 |

### P1 — Should Fix (Redundancy / Clutter)
| # | Issue | Action |
|---|-------|--------|
| 7 | 3 admin billing pages | Merge to 1 with tabs |
| 8 | Activity + Audit duplicate | Merge to 1 |
| 9 | Analytics page duplicates health + activity | Remove duplicate tabs |
| 10 | Admin Modules Quick Actions | Remove 4 cards |
| 11 | Domain Settings Quick Actions | Remove card |
| 12 | Portal Submissions header too tall | Collapse stats + filters |
| 13 | Onboarding 6 steps | Reduce to 3 |
| 14 | Admin sidebar 11 items | Group + dedupe to 7 |

### P2 — Should Fix (Consistency)
| # | Issue | Action |
|---|-------|--------|
| 15 | PageHeader not used everywhere | Adopt on all pages |
| 16 | Multiple empty state patterns | Create shared EmptyState |
| 17 | Inconsistent loading states | Skeletons for client, loading.tsx for server |
| 18 | Multiple currency formatters | Create shared utility |
| 19 | Multiple date formatters | Create shared utility |
| 20 | Inconsistent metadata titles | Standardize format |
| 21 | Portal Apps bypasses layout | Remove inline header |

### P3 — Nice to Have (Polish)
| # | Issue | Action |
|---|-------|--------|
| 22 | Portal sidebar 13 items | Reduce for simpler clients |
| 23 | Portal Login inline forgot-password | Extract to route |
| 24 | Notification legend card | Remove |
| 25 | SEO tips card | Make collapsible |
| 26 | Password strength indicator | Add real-time checklist |
| 27 | Duplicate Contact Support buttons | Keep only contextual one |

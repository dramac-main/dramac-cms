# PHASE-UX-00: Page-by-Page UX Simplification & Dead Code Cleanup

**Priority**: 🔴 P0 (Critical — Must Run FIRST Before All Other Phases)  
**Estimated Effort**: 3-4 days  
**Dependencies**: None — this phase is the foundation  
**Goal**: Clean every page to industry-standard simplicity. Remove dead buttons, fake data, duplicate routes, and button clutter. Every page should have ONE clear primary action.

---

## ⚠️ IMPORTANT: Run This Phase FIRST

This phase MUST be implemented before PHASE-UX-01, PHASE-WL-01, PHASE-WL-02, PHASE-DM-01, PHASE-WL-03, PHASE-UX-02, or PHASE-UX-03. It cleans up the existing codebase so the other phases build on a solid foundation instead of broken/stubbed pages.

---

## Context

### Platform Audit Results (63 Issues Found)

| Severity | Count | Examples |
|----------|-------|---------|
| 🔴 Critical (broken at runtime) | 6 | Dead buttons, server component with onClick, fake data displayed as real |
| 🟠 High (confusing UX) | 10 | 13-button toolbar, duplicate routes, non-functional search |
| 🟡 Medium (inconsistency) | 12 | 4 different header styles, mixed date formatters |
| 🟢 Low (polish) | ~35 | Icon duplicates, label inconsistencies |

### The #1 Rule: Every Page Gets ONE Primary Action
Industry leaders (Linear, Vercel, Notion, Stripe Dashboard) follow this pattern:
- **ONE** primary CTA button (solid/filled)
- **0-2** secondary actions (outline/ghost)
- **Overflow menu** (⋯) for everything else
- **ZERO** dead/non-functional buttons

---

## Task 1: Fix the Site Detail Page — Button Explosion 🔴

**File**: `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx`

**Current State: 13 buttons in the header**

| # | Button | Problem |
|---|--------|---------|
| 1 | View Live | ✅ Keep — important |
| 2 | SEO | ❌ Duplicates SEO in site settings tabs |
| 3 | AI Designer | ⚠️ Styled as primary but not the main action |
| 4 | Analytics | ❌ Duplicates Analytics tab below |
| 5 | Automation | ❌ Deep module link, not a primary action |
| 6 | AI Agents | ❌ Deep module link, not a primary action |
| 7 | Social | ❌ Duplicates Social tab AND sidebar |
| 8 | CRM | ❌ Duplicates CRM tab AND sidebar |
| 9 | Settings | ❌ Duplicates Settings tab below |
| 10 | Edit Pages | ✅ Keep — core action |
| 11 | Clone | ⚠️ Rare action, put in overflow |
| 12 | Export | ⚠️ Rare action, put in overflow |
| 13 | Publish/Unpublish | ✅ Keep — THE primary action |

**Fix: Reduce to 3 visible buttons + overflow menu**

```
BEFORE: [View Live] [SEO] [AI Designer] [Analytics] [Automation] [AI Agents] 
        [Social] [CRM] [Settings] [Edit Pages] [Clone] [Export] [Publish]

AFTER:  [Edit Pages]  [View Live ↗]  [•••]  [██ Publish ██]
                                        │
                                        ├─ AI Designer
                                        ├─ Clone Site
                                        ├─ Export Site
                                        └─ Site Settings
```

### Implementation

1. Keep 3 visible buttons:
   - `Edit Pages` (outline) — the main daily action
   - `View Live` (outline, external link icon) — only when published
   - `Publish / Unpublish` (primary/solid) — THE primary CTA, right-aligned
2. Create an overflow `DropdownMenu` with trigger `<Button variant="ghost" size="icon"><MoreHorizontal /></Button>`:
   - AI Designer (with sparkle icon)
   - Clone Site
   - Export Site  
   - Site Settings
3. Remove header buttons for: SEO, Analytics, Automation, AI Agents, Social, CRM — these are ALL accessible via tabs below or the sidebar
4. The tab bar below already provides navigation to all module-specific pages

### Acceptance Criteria
- [ ] Header has exactly 3 visible buttons + 1 overflow menu
- [ ] Overflow menu contains 4 items
- [ ] No duplicate navigation between header buttons and tabs
- [ ] `Publish` button is visually the most prominent (primary variant)
- [ ] Mobile: buttons stack sensibly (no horizontal overflow)

---

## Task 2: Fix Admin Settings — 5 Dead Buttons 🔴

**File**: `src/app/(dashboard)/admin/settings/page.tsx`

**Current State**: Entire page is a static mockup. 5 buttons with no `onClick` handlers, 9 switches with no persistence, all form values hardcoded.

**Fix: Either make it real or mark it as "Coming Soon"**

### Option A: Implement Real Functionality (Recommended)

1. Convert to a `"use client"` component (or split into client components)
2. Create `src/lib/actions/admin-settings.ts`:
   ```typescript
   export async function getPlatformSettings() { ... }
   export async function updatePlatformSettings(data: PlatformSettings) { ... }
   export async function clearPlatformCache() { ... }
   export async function createPlatformBackup() { ... }
   export async function toggleMaintenanceMode(enabled: boolean) { ... }
   ```
3. Create database table `platform_settings` (single-row config table)
4. Wire all 5 buttons to real server actions
5. Wire all 9 switches to persist via `updatePlatformSettings()`
6. Replace hardcoded `defaultValue` strings with real data from `getPlatformSettings()`

### Option B: Show "Coming Soon" State (Quick Fix)

1. Wrap each section in a card with opacity-50 and a "Coming Soon" badge
2. Disable all buttons and switches
3. Add a banner at top: "Platform settings are being developed. Configuration changes are not yet available."
4. This is honest and doesn't confuse admins into thinking things work

### Acceptance Criteria
- [ ] No dead buttons (every button either works or is clearly disabled with explanation)
- [ ] No hardcoded form values displayed as if they're real settings
- [ ] Page is either fully functional OR clearly marked as coming soon

---

## Task 3: Fix Admin Health — Broken Refresh Button + Fake Metrics 🔴

**File**: `src/app/(dashboard)/admin/health/page.tsx`

**Current State**:
- `Refresh` button has `onClick` but the page is a server component — **will crash at runtime**
- CPU Usage (23%), Memory (45%), Storage (12%), Uptime (99.9%) are all hardcoded

**Fix**:

1. **Refresh button**: Convert the header area to a client component, or replace with a `<Link href="/admin/health">` that triggers a page reload via navigation:
   ```tsx
   // Instead of onClick={window.location.reload}
   <Link href="/admin/health" prefetch={false}>
     <Button variant="outline" size="sm">
       <RefreshCw className="h-4 w-4 mr-2" />
       Refresh
     </Button>
   </Link>
   ```

2. **Fake metrics**: Either:
   - **Remove** the System Resources section entirely (if real monitoring isn't available)
   - **Replace** with real data from Vercel Analytics API or Supabase usage API
   - **Label clearly** as "Estimated" or "Sample Data" if keeping as placeholder

3. **Uptime**: Either integrate with a real monitoring service (UptimeRobot, Vercel) or remove the stat

### Acceptance Criteria
- [ ] Refresh button works (no runtime crash)
- [ ] No hardcoded metrics presented as real data
- [ ] System resources section either uses real data or is removed

---

## Task 4: Fix Domains Page — Duplicate Buttons 🔴

**File**: `src/app/(dashboard)/dashboard/domains/page.tsx`

**Current State**: Two buttons in the header — "Search Domains" and "Register Domain" — both link to the EXACT same URL (`/dashboard/domains/search`).

**Fix**:

1. Remove "Search Domains" button
2. Keep only "Register Domain" as the primary CTA
3. Add search functionality inline (a search input in the domain list header that filters existing domains)

```
BEFORE: [Search Domains]  [Register Domain]  ← Both go to /domains/search

AFTER:  [+ Register Domain]
        ┌─────────────────────────────────────────┐
        │ 🔍 Search your domains...               │
        │─────────────────────────────────────────│
        │  mybusiness.com    ✅ Active    [Manage]│
        │  example.com       ⏳ Pending   [Manage]│
        └─────────────────────────────────────────┘
```

### Acceptance Criteria
- [ ] Only ONE button in the header (Register Domain)
- [ ] Search is an inline filter on the existing domain list
- [ ] No two buttons link to the same destination

---

## Task 5: Fix Email Page — Non-Functional Search & Filter 🔴

**File**: `src/app/(dashboard)/dashboard/email/page.tsx`

**Current State**: 
- Search input exists but has no `onChange`, no `value`, no state — it's cosmetic HTML
- Filter button exists but has no `onClick` handler

**Fix**:

1. Convert relevant parts to a client component or use server-side search params
2. Wire search input to filter the email list:
   ```tsx
   // Option A: Client-side filtering
   const [search, setSearch] = useState("");
   const filtered = emails.filter(e => 
     e.address.toLowerCase().includes(search.toLowerCase())
   );
   
   // Option B: Server-side via URL params
   // In page.tsx: const { searchParams } = props;
   // Pass search to the database query
   ```
3. Wire filter button to a dropdown with filter options (status: active/pending/expired)
4. If filtering isn't needed (small data set), remove the filter button entirely

### Acceptance Criteria
- [ ] Search input actually filters the email list
- [ ] Filter button either works or is removed
- [ ] No non-functional UI elements

---

## Task 6: Fix Portal Settings — Fake Data + useState Misuse 🟠

**File**: `src/app/(portal)/portal/settings/page.tsx`

**Current State**:
- Profile form initializes with hardcoded: `name: "Client User"`, `email: "client@example.com"`
- Comment says "In a real app, this would fetch from the server"
- `useState` is misused as an effect (side effects in the initializer)
- Notification preferences show toast but don't persist

**Fix**:

1. Fetch real user profile data on mount:
   ```tsx
   useEffect(() => {
     async function loadProfile() {
       const profile = await getClientProfile();
       setFormData({ name: profile.name, email: profile.email, ... });
     }
     loadProfile();
   }, []);
   ```
2. Remove hardcoded mock data
3. Wire notification preferences to persist (save to `notification_preferences` table — will be created in PHASE-WL-02)
4. Show loading skeleton while profile data loads

### Acceptance Criteria
- [ ] Profile form loads real user data (not "Client User" / "client@example.com")
- [ ] Notification preference changes persist (not just toast)
- [ ] No `useState` with side effects

---

## Task 7: Fix Portal Analytics — Hardcoded Trend Percentages 🟠

**File**: `src/app/(portal)/portal/analytics/page.tsx`

**Current State**: Core analytics data is real (from `getPortalAnalytics()`), but trend percentages are hardcoded:
- "12% from last month" (Total Visits)
- "8% from last month" (Unique Visitors)
- "15% from last month" (Page Views)
- "3% from last month" (Avg Session)

**Fix**:

1. Calculate real trends by comparing current period vs previous period:
   ```typescript
   const currentPeriod = await getPortalAnalytics(siteId, 'last_30_days');
   const previousPeriod = await getPortalAnalytics(siteId, 'prev_30_days');
   const visitsTrend = ((current.visits - previous.visits) / previous.visits * 100).toFixed(1);
   ```
2. If historical data isn't available, show "—" instead of a fake percentage
3. Color code: green for positive, red for negative, gray for "—"

### Acceptance Criteria
- [ ] Trend percentages are calculated from real data OR show "—"
- [ ] No hardcoded growth numbers
- [ ] Trend direction (up/down) matches the actual data

---

## Task 8: Fix Admin Subscriptions — Fabricated Data 🟠

**File**: `src/app/(dashboard)/admin/subscriptions/page.tsx`

**Current State**: Plan distribution data is hardcoded mock data presented as real.

**Fix**:

1. Query actual subscription data from Supabase:
   ```typescript
   const planDistribution = await supabase
     .from('subscriptions')
     .select('plan_name, count(*)')
     .group('plan_name');
   ```
2. If table doesn't exist or has no data, show empty state: "No subscription data yet"

### Acceptance Criteria
- [ ] Subscription data comes from real database queries
- [ ] No fabricated statistics

---

## Task 9: Consolidate Duplicate Billing Pages 🟠

**Current State**: 3 separate pages show overlapping billing information:
- `/settings/billing` — Paddle subscription, usage, invoices, module subs
- `/settings/subscription` — Subscription details (overlap with billing)
- `/dashboard/billing` — Another billing view

**Fix**:

1. Make `/settings/billing` the SINGLE billing page (it already has the most comprehensive view)
2. Make `/settings/subscription` redirect to `/settings/billing`:
   ```typescript
   // settings/subscription/page.tsx
   import { redirect } from "next/navigation";
   export default function Page() { redirect("/settings/billing"); }
   ```
3. Make `/dashboard/billing` redirect to `/settings/billing`:
   ```typescript
   // dashboard/billing/page.tsx
   import { redirect } from "next/navigation";
   export default function Page() { redirect("/settings/billing"); }
   ```
4. Update sidebar navigation: Remove "Billing" from dashboard sidebar (under Account group), keep it only in Settings sidebar

### Acceptance Criteria
- [ ] ONE billing page at `/settings/billing`
- [ ] Old routes redirect (no 404s)
- [ ] Sidebar has no duplicate billing links

---

## Task 10: Consolidate Duplicate Module Pages 🟠

**Current State**: 3 separate pages for "my modules":
- `/settings/modules` — Module settings
- `/marketplace/installed` — Installed modules (dead stub)
- `/dashboard/modules/subscriptions` — Module subscriptions

**Fix**:

1. Make `/dashboard/modules/subscriptions` the SINGLE "my modules" page (it has the real subscription data)
2. Redirect `/marketplace/installed` → `/dashboard/modules/subscriptions`
3. Redirect `/settings/modules` → `/dashboard/modules/subscriptions` (or merge content)
4. Update sidebar "My Subscriptions" label to "My Modules" (clearer)

### Acceptance Criteria
- [ ] ONE "my modules" page
- [ ] Old routes redirect
- [ ] Sidebar label is clear

---

## Task 11: Admin Sidebar Deduplication & Grouping 🟡

**Current State**: 11 flat ungrouped items. Duplicate icons (CreditCard used twice, BarChart3 used twice).

**Fix: Group into 3 sections**

```
BEFORE (flat list of 11):                AFTER (grouped into 3 sections):
  Overview                                 ── Overview ──
  Agencies                                 Overview
  Agency Analytics                         
  Users                                    ── Management ──
  Modules                                  Agencies
  Subscriptions                            Users
  Billing & Revenue                        Modules
  Platform Analytics                       
  Activity Log                             ── Platform ──
  System Health                            Analytics        (merge Agency + Platform)
  Settings                                 Billing          (merge Subscriptions + Revenue)
                                           Activity Log     (merge with Audit if exists)
                                           System Health
                                           Settings
```

### Changes:
1. Group items with section headers
2. Merge "Agency Analytics" into "Agencies" page (as a tab)
3. Merge "Subscriptions" + "Billing & Revenue" into one "Billing" page with tabs
4. Fix duplicate icons: Use `Wallet` for Billing, `BarChart3` only for Analytics
5. Result: **11 items → 9 items in 3 groups**

### Acceptance Criteria
- [ ] Admin sidebar has clear section headers
- [ ] No duplicate icons
- [ ] Merged pages redirect old routes
- [ ] 9 or fewer items total

---

## Task 12: Standardize Page Headers 🟡

**Current State**: 4 different page header patterns across the app:
1. Custom JSX headers (inconsistent spacing, button placement)
2. `<PageHeader>` component (used on ~60% of pages)
3. Raw `<h1>` + `<p>` tags
4. No header at all

**Fix**:

1. Ensure `<PageHeader>` component supports all needed variants:
   ```tsx
   interface PageHeaderProps {
     title: string;
     description?: string;
     badge?: React.ReactNode;        // e.g., count badges
     actions?: React.ReactNode;       // right-aligned buttons
     breadcrumbs?: Breadcrumb[];
     backLink?: { href: string; label: string };
   }
   ```

2. Replace ALL custom headers with `<PageHeader>`:
   - Dashboard pages → `<PageHeader title="Sites" description="Manage your websites" actions={<Button>Create Site</Button>} />`
   - Admin pages → Same pattern
   - Portal pages → Same pattern

3. `<PageHeader>` enforces:
   - Consistent spacing (py-6, mb-6)
   - Title as `h1` with consistent typography
   - Actions right-aligned, max 2 visible + overflow
   - Responsive: actions stack below title on mobile

### Acceptance Criteria
- [ ] Every page uses `<PageHeader>` (no custom header JSX)
- [ ] Headers look identical across dashboard, admin, and portal
- [ ] Actions are consistently right-aligned
- [ ] Mobile headers don't overflow

---

## Task 13: Standardize Empty States 🟡

**Current State**: 5 different empty state patterns:
1. Custom inline JSX with different styles
2. Some use an `<EmptyState>` component
3. Some show nothing (blank area)
4. Some show a message but no CTA
5. Some show a CTA but no illustration

**Fix**:

1. Create or enhance `<EmptyState>` component:
   ```tsx
   interface EmptyStateProps {
     icon: LucideIcon;
     title: string;
     description: string;
     action?: {
       label: string;
       href?: string;
       onClick?: () => void;
     };
   }
   ```

2. Replace ALL empty states with `<EmptyState>`:
   ```tsx
   <EmptyState
     icon={Globe}
     title="No sites yet"
     description="Create your first website to get started"
     action={{ label: "Create Site", href: "/dashboard/sites/new" }}
   />
   ```

3. Every empty state MUST have:
   - An icon (from Lucide)
   - A friendly title (not "No data")
   - A helpful description
   - A CTA button when appropriate

### Acceptance Criteria
- [ ] Every empty state uses `<EmptyState>` component
- [ ] All empty states have icon + title + description
- [ ] Actionable empty states have a CTA button
- [ ] Consistent styling across all empty states

---

## Task 14: Remove `window.prompt()` Usage 🟡

**Problem**: Some pages use `window.prompt()` for input (e.g., folder creation in Media Library). This is:
- Ugly and unprofessional
- Unstyled (browser native dialog)
- Not accessible
- Impossible to validate

**Fix**: Replace every `window.prompt()` with a proper dialog:
1. Search codebase: `grep -r "window.prompt" src/`
2. Replace each with a small dialog using the existing `<Dialog>` component
3. Include proper input validation in the dialog

### Acceptance Criteria
- [ ] Zero `window.prompt()` calls in the codebase
- [ ] All user inputs use styled dialog components

---

## Task 15: Consistent Date & Currency Formatting 🟡

**Current State**: 4 different date formatters and 4 different currency formatters scattered across pages.

**Fix**:

1. Ensure ALL date formatting uses the centralized formatter:
   ```typescript
   import { formatDate, formatRelativeTime } from "@/lib/utils/date";
   ```
2. Ensure ALL currency formatting uses the centralized formatter:
   ```typescript
   import { formatCurrency } from "@/lib/utils/currency";
   ```
3. Search and replace any inline formatting:
   - `new Date().toLocaleDateString()` → `formatDate()`
   - `toLocaleString('en-US', { style: 'currency' })` → `formatCurrency()`
   - `$` + amount → `formatCurrency(amount)`
   - `.toFixed(2)` for money → `formatCurrency()`

### Acceptance Criteria
- [ ] All dates use centralized `formatDate()` or `formatRelativeTime()`
- [ ] All currency uses centralized `formatCurrency()`
- [ ] No inline date/currency formatting
- [ ] Locale-aware (Zambia: ZMW/en-ZM)

---

## Task 16: Consistent Loading Patterns 🟡

**Current State**: 3 incompatible loading patterns:
1. Spinner (`<Loader2 className="animate-spin" />`) — used on some pages
2. Skeleton (`<Skeleton>`) — used on others
3. Nothing (blank screen) — on many pages

**Fix**:

1. Establish pattern:
   - **Page-level loading** → Skeleton (via `loading.tsx` — covered in PHASE-UX-01)
   - **Component-level loading** → Skeleton pulse placeholders
   - **Button loading** → Spinner inside the button + disabled state
   - **Inline data loading** → Skeleton for text, shimmer for images
2. Remove raw spinners from page-level loading (replace with skeletons)
3. Buttons should use `isLoading` prop pattern:
   ```tsx
   <Button disabled={isLoading}>
     {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
     Save Changes
   </Button>
   ```

### Acceptance Criteria
- [ ] No raw spinners for page-level loading (use skeletons)
- [ ] All async buttons show spinner + disabled state
- [ ] Consistent pattern across all pages

---

## E-Commerce Module Note (13-Item Sidebar)

The E-Commerce module has its own 13-item sidebar. While dense, this is acceptable for a complex commerce tool — Shopify has a similar density. However:

1. Group items with section dividers:
   - **Sales**: Dashboard, Orders, Customers
   - **Catalog**: Products, Categories, Inventory
   - **Marketing**: Discounts, Quotes, Marketing
   - **Insights**: Analytics
   - **Setup**: Embed, Developer, Settings
2. Collapse less-used sections by default

This is a **recommendation**, not a requirement for this phase.

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` | Reduce to 3 buttons + overflow |
| MODIFY | `src/app/(dashboard)/admin/settings/page.tsx` | Make functional or mark Coming Soon |
| MODIFY | `src/app/(dashboard)/admin/health/page.tsx` | Fix refresh button, remove fake metrics |
| MODIFY | `src/app/(dashboard)/dashboard/domains/page.tsx` | Remove duplicate button |
| MODIFY | `src/app/(dashboard)/dashboard/email/page.tsx` | Wire search & filter or remove |
| MODIFY | `src/app/(portal)/portal/settings/page.tsx` | Real data, fix useState |
| MODIFY | `src/app/(portal)/portal/analytics/page.tsx` | Real or no trend percentages |
| MODIFY | `src/app/(dashboard)/admin/subscriptions/page.tsx` | Real subscription data |
| MODIFY | `src/app/(dashboard)/dashboard/settings/subscription/page.tsx` | Redirect to billing |
| MODIFY | `src/app/(dashboard)/dashboard/billing/page.tsx` | Redirect to settings/billing |
| MODIFY | `src/config/admin-navigation.ts` | Group and deduplicate items |
| MODIFY | All pages with custom headers | Use `<PageHeader>` |
| MODIFY | All pages with empty states | Use `<EmptyState>` |
| MODIFY | All pages with `window.prompt()` | Replace with dialogs |
| MODIFY | All pages with inline date/currency formatting | Use centralized formatters |

---

## Testing Checklist

- [ ] Site detail page: exactly 3 header buttons + overflow menu
- [ ] Click every button on admin settings → all either work or are clearly disabled
- [ ] Admin health refresh → no runtime crash
- [ ] Admin health → no fake CPU/Memory/Storage percentages
- [ ] Domains page → only 1 header button (Register Domain)
- [ ] Email page → search actually filters, or is removed
- [ ] Portal settings → loads real user data (not "Client User")
- [ ] Portal analytics → trends are real or show "—"
- [ ] `/settings/subscription` → redirects to `/settings/billing`
- [ ] `/dashboard/billing` → redirects to `/settings/billing`
- [ ] Admin sidebar → grouped with section headers, no duplicate icons
- [ ] Every page uses `<PageHeader>` (visual consistency)
- [ ] Every empty state has icon + title + description + CTA
- [ ] Zero `window.prompt()` calls (`grep -r "window.prompt" src/` returns nothing)
- [ ] All dates/currency use centralized formatters
- [ ] All page-level loading uses skeletons (not spinners)
- [ ] Mobile: no horizontal overflow on any page
- [ ] `grep -r "coming soon" src/` — any "coming soon" features are clearly labeled

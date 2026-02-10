# PHASE-FIX-04: Platform Integrity — Deep Cleanup, Deduplication & Hardening

**Priority:** 🟠 HIGH — Addresses dead code, duplicate files, security gaps, broken URLs, inconsistent patterns  
**Estimated Scope:** ~60 files deleted, ~40 files modified, ~5 files created  
**Dependencies:** None — fully independent from FIX-01, FIX-02, FIX-03  
**Runs Independently:** YES — this phase ONLY deletes dead code, fixes inconsistencies, and hardens security. It does not touch any files owned by other phases.

---

## ⚠️ AI IMPLEMENTATION INSTRUCTIONS

> **READ BEFORE IMPLEMENTING.** This phase is designed to run in a NEW session where the AI has no prior context. Follow these rules strictly:

### Session Setup
1. **Read ALL memory bank files first** (`/memory-bank/*.md`)
2. **Run `npx tsc --noEmit`** before AND after implementation
3. **Check git log** — if Phases FIX-01/02/03 have been committed, their changes are already in the codebase

### Critical Technical Context
- **CSS vars**: Tailwind uses `--color-*` prefix (HSL). The `--primary` vars are OKLCH (shadcn defaults). See `systemPatterns.md`.
- **Supabase clients**: Dashboard = `createClient()` (cookie-auth), Public/Webhook = `createAdminClient()` (service role). NEVER inline `createClient(URL, SERVICE_ROLE_KEY)`.
- **Email**: `sendEmail()` from `@/lib/email/send-email`. `createNotification()` is in-app only.
- **Locale**: `locale-config.ts` is the canonical source. NEVER hardcode `en-US`, `USD`, `$`, `UTC`.
- **Platform constants**: `src/lib/constants/platform.ts` defines `PLATFORM.name`, `PLATFORM.domain`, `PLATFORM.supportEmail`. NEVER hardcode `DRAMAC` or `dramacagency.com` directly.

### Conflict Prevention
- **DO NOT modify `branding-provider.tsx`, `globals.css`, `tailwind.config.ts`** — Phase FIX-01 owns these
- **DO NOT modify server action data functions** (social-analytics, admin-analytics, etc.) — Phase FIX-02 owns these
- **DO NOT modify navigation configs or route structures** — Phase FIX-03 owns these
- **DO NOT modify currency formatting** — Phase FIX-01 owns this
- This phase's scope is: **dead code deletion, duplicate file removal, domain/URL fixes, env var cleanup, type cleanup, CSS cleanup, security patches, null safety fixes, and pattern consolidation**

### Before Deleting ANY File
1. Run `grep_search` for the component/file name across ALL of `src/`
2. Check `src/app/` pages for dynamic imports (`import()` or `lazy()`)
3. Check barrel files (`index.ts`) in the same directory
4. If ANY import exists outside the file's own directory, DO NOT DELETE — fix the import instead

### Verification Gate
After completing ALL tasks, run:
```bash
cd next-platform-dashboard
npx tsc --noEmit
```
If zero errors: `git add -A && git commit -m "feat: Phase FIX-04 — platform integrity, deduplication, deep cleanup" && git push`

---

## Problem Statement

A comprehensive deep scan using 4 parallel audit agents found **100+ issues** beyond what Phases FIX-01/02/03 cover. The platform has accumulated significant technical debt: ~60 dead component files, a 660KB duplicate type file, competing domain identities (`dramac.io` vs `dramacagency.com`), 7 callsites using an undefined env var (`NEXT_PUBLIC_BASE_URL`), hardcoded `DRAMAC` strings that break white-labeling, null-safety gaps, CSS conflicts, inconsistent Supabase client usage, and security vulnerabilities in debug API endpoints.

---

## Task 1: Delete Duplicate `database.types.ts` File

**Files:** 
- `src/types/database.ts` (10,129 lines — **KEEP**)
- `src/types/database.types.ts` (10,129 lines — **DELETE**)

**Issue:** Byte-for-byte identical files (660KB each). The barrel `src/types/index.ts` exports from `./database`. Only ONE file imports from `database.types`:
- `src/app/api/pages/[pageId]/content/route.ts` line 11: `import type { Json } from "@/types/database.types"`

**Fix:**
1. In `src/app/api/pages/[pageId]/content/route.ts`, change:
   ```typescript
   // BEFORE:
   import type { Json } from "@/types/database.types"
   // AFTER:
   import type { Json } from "@/types/database"
   ```
2. Delete `src/types/database.types.ts`

**Saves:** 660KB of duplicate type definitions. Eliminates drift risk.

---

## Task 2: Delete Dead Component Directories

### 2a: `src/components/feedback/` — 11 dead files

**Files to delete:** `confirm-dialog.tsx`, `destructive-confirm.tsx`, `empty-state-presets.tsx`, `empty-state.tsx`, `error-state.tsx`, `form-validation.tsx`, `index.ts`, `loading-wrapper.tsx`, `offline-handler.tsx`, `page-loader.tsx`, `session-timeout.tsx`

**Verification:** Zero imports from outside this directory. Run: `grep_search("@/components/feedback", { isRegexp: false })`

### 2b: `src/components/publishing/` — 6 dead files

**Files to delete:** `dns-instructions.tsx`, `domain-settings.tsx`, `index.ts`, `publish-dialog.tsx`, `publish-status-badge.tsx`, `view-site-button.tsx`

**Verification:** Zero imports. Run: `grep_search("@/components/publishing", { isRegexp: false })`

### 2c: `src/components/seo/` — 6 dead files

**Files to delete:** `index.ts`, `page-seo-list.tsx`, `seo-form.tsx`, `seo-preview.tsx`, `seo-score.tsx`, `sitemap-preview.tsx`

**Verification:** Zero imports. Run: `grep_search("@/components/seo", { isRegexp: false })`

### 2d: `src/components/renderer/` — 4 dead files (keep 1)

**Files to delete:** `published-site-renderer.tsx`, `puck-site-renderer.tsx`, `site-head.tsx`, `site-styles.tsx`

**File to KEEP:** `module-injector.tsx` — imported by `src/app/site/[domain]/[[...slug]]/page.tsx`

**Verification:** Run grep for each individual file before deleting.

### 2e: `src/components/editor/` — Entire directory (~25+ files)

**Context:** This is the legacy Puck-based editor that was replaced by DRAMAC Studio in February 2026. Contains `canvas.tsx`, `toolbox.tsx`, `settings-panel.tsx`, `preview-frame.tsx`, `resolver.ts`, `template-library.tsx`, `theme-settings.tsx`, `user-components/` subdirectory, etc.

**Verification REQUIRED:** Before deleting:
1. Search for `@/components/editor` across ALL of `src/`
2. Search for `components/editor` in any dynamic import
3. Check if any route page loads editor components
4. If the old editor route (`/editor/[siteId]`) still loads from this directory, keep the entry point but add a redirect

**If confirmed zero external imports:** Delete the entire directory.
**If any imports found:** Keep the imported files, delete the rest.

---

## Task 3: Delete Individual Dead Components

Before deleting each file, verify with `grep_search` that it has zero imports outside its own directory.

### Dead Module Components
| File | Reason |
|------|--------|
| `components/modules/module-card.tsx` | Zero imports — superseded by `marketplace/ModuleCard.tsx` |
| `components/modules/marketplace-module-card.tsx` | Zero imports — superseded by `marketplace/enhanced-module-card.tsx` |
| `components/modules/module-detail-sheet.tsx` | Zero imports |
| `components/modules/module-injector.tsx` | Zero imports |
| `components/modules/studio-module-injector.tsx` | Zero imports |
| `components/modules/category-filter.tsx` | Zero imports |
| `components/modules/subscribe-module-button.tsx` | Zero imports |
| `components/modules/module-settings-dialog.tsx` | Zero imports |
| `components/modules/TemplateBrowser.tsx` | Zero imports |
| `components/modules/TemplatePicker.tsx` | Zero imports |
| `components/modules/UpgradeFlow.tsx` | Zero imports |
| `components/modules/RollbackUI.tsx` | Zero imports |

### Dead Billing Components
| File | Reason |
|------|--------|
| `components/billing/invoice-history.tsx` | Zero imports — replaced by paddle/lemonsqueezy versions |
| `components/billing/lemonsqueezy-invoice-history.tsx` | Zero imports |
| `components/billing/subscription-banner.tsx` | Zero imports |
| `components/billing/subscription-card.tsx` | Zero imports |
| `components/billing/usage-card.tsx` | Zero imports |
| `components/billing/payment-methods.tsx` | Zero imports |
| `components/billing/pricing-plans.tsx` | Zero imports |

### Dead Admin Components
| File | Reason |
|------|--------|
| `components/admin/agencies-table.tsx` | Zero imports — replaced by `agency-management-table.tsx` |
| `components/admin/users-table.tsx` | Zero imports — replaced by `user-management-table.tsx` |

### Dead UI Components
| File | Reason |
|------|--------|
| `components/ui/stat.tsx` | Zero imports (`Stat`, `StatCard`, `StatGrid` never used) |
| `components/ui/empty-state.tsx` | Zero imports |
| `components/ui/inline-error.tsx` | Zero imports |
| `components/ui/form-error-summary.tsx` | Zero imports |
| `components/ui/form-field-group.tsx` | Zero imports |
| `components/ui/form-section.tsx` | Zero imports |
| `components/ui/standalone-form-field.tsx` | Zero imports |
| `components/ui/input-with-icon.tsx` | Zero imports |
| `components/ui/date-input.tsx` | Zero imports |
| `components/ui/rate-limit-error.tsx` | Zero imports |
| `components/ui/divider.tsx` | Zero imports |
| `components/ui/password-input.tsx` | Zero imports |

### Dead Chart Components
| File | Reason |
|------|--------|
| `components/charts/metric-card.tsx` | Zero imports (336 lines) |
| `components/charts/sparkline.tsx` | Only imported by dead metric-card |

### Other Dead Components
| File | Reason |
|------|--------|
| `components/layout/quick-actions.tsx` | Zero imports (admin has its own) |
| `components/onboarding/product-tour.tsx` | Zero imports |
| `components/marketplace/ReviewForm.tsx` | Zero imports |
| `components/marketplace/ReviewList.tsx` | Zero imports |
| `components/marketplace/marketplace-client.tsx` | Zero imports from pages |
| `components/analytics/realtime-widget.tsx` | Zero imports |
| `components/analytics/performance-metrics.tsx` | Zero imports |
| `components/errors/inline-error.tsx` | Zero imports (duplicates ui/inline-error) |
| `components/errors/error-boundary.tsx` | Zero imports |

**Total estimated dead files: ~60+**

---

## Task 4: Clean Up Dead Barrel Exports

After deleting dead components, their barrel `index.ts` files will have dangling exports. Update these barrels:

| Barrel File | Remove exports for deleted components |
|-------------|--------------------------------------|
| `components/admin/index.ts` | Remove `AgenciesTable`, `UsersTable`, `SystemAlerts`, `RecentActivity` if dead |
| `components/billing/index.ts` | Remove all dead billing exports |
| `components/modules/index.ts` | Remove all dead module exports |
| `components/charts/index.ts` | Remove dead metric-card, sparkline exports |
| `components/editor/index.ts` | Delete entire barrel if editor directory is deleted |
| `components/feedback/index.ts` | Delete with directory |
| `components/publishing/index.ts` | Delete with directory |
| `components/seo/index.ts` | Delete with directory |

---

## Task 5: Fix Domain Identity Split — `dramac.io` vs `dramacagency.com`

**Issue:** The platform has two competing domain identities. `PLATFORM.domain` in `src/lib/constants/platform.ts` defines `dramacagency.com`, but 20+ files hardcode `dramac.io`.

**The canonical domain is `dramacagency.com`.**

### 5a: Fix `src/lib/constants/brand.ts`

```typescript
// BEFORE (lines 45-54):
domain: 'dramac.io',
url: 'https://dramac.io',
supportEmail: 'support@dramac.io',
docsUrl: 'https://docs.dramac.io',

// AFTER:
domain: PLATFORM.domain,  // 'dramacagency.com'
url: PLATFORM.url,
supportEmail: PLATFORM.supportEmail,
docsUrl: `https://docs.${PLATFORM.domain}`,
```

### 5b: Fix all `dramac.io` occurrences

| File | Line | Current | Fix |
|------|------|---------|-----|
| `lib/actions/reseller-club.ts` | 112 | `'https://dramac.io'` | `PLATFORM.url` or `process.env.NEXT_PUBLIC_APP_URL` |
| `lib/modules/module-sdk.ts` | 308 | `support@dramac.io` | `PLATFORM.supportEmail` |
| `lib/modules/module-permissions.ts` | 126, 132 | `community.dramac.io`, `support@dramac.io` | `PLATFORM.supportEmail`, `PLATFORM.communityUrl` |
| `lib/modules/embed-sdk-generator.ts` | 6, 69 | CDN + embed URLs with `dramac.io` | Use `PLATFORM.domain` |
| `app/dashboard/support/page.tsx` | 165 | `mailto:support@dramac.io` | `mailto:${PLATFORM.supportEmail}` |
| `components/studio/panels/header.tsx` | 180 | `.dramac.io` subdomain suffix | `PLATFORM.domain` |
| `modules/social-media/components/SocialConnectFlow.tsx` | 285 | `.dramac.io` subdomain | `PLATFORM.domain` |
| `app/portal/sites/[siteId]/page.tsx` | 197 | `dramac.app` | `PLATFORM.domain` |

### 5c: Add missing constants to platform.ts

```typescript
// Add to PLATFORM object in src/lib/constants/platform.ts:
communityUrl: `https://community.${PLATFORM.domain}`,
docsUrl: `https://docs.${PLATFORM.domain}`,
cdnUrl: `https://cdn.${PLATFORM.domain}`,
embedUrl: `https://embed.${PLATFORM.domain}`,
```

---

## Task 6: Fix `NEXT_PUBLIC_BASE_URL` → `NEXT_PUBLIC_APP_URL`

**Issue:** 7 callsites use `NEXT_PUBLIC_BASE_URL` which is **never defined** in any `.env` file. They all fall back to `''` (empty string), producing broken relative URLs in quote emails and portal links.

**The correct env var is `NEXT_PUBLIC_APP_URL`** (set to `https://app.dramacagency.com`).

### Files to fix:

| File | Current | Fix |
|------|---------|-----|
| `lib/modules/module-sdk.ts` | `process.env.NEXT_PUBLIC_BASE_URL \|\| 'http://localhost:3000'` | `process.env.NEXT_PUBLIC_APP_URL \|\| 'http://localhost:3000'` |
| `lib/actions/publishing-actions.ts` | `process.env.NEXT_PUBLIC_BASE_URL \|\| ''` | `process.env.NEXT_PUBLIC_APP_URL \|\| ''` |
| `modules/ecommerce/actions/quote-workflow-actions.ts` | 5x `process.env.NEXT_PUBLIC_BASE_URL \|\| ''` | `process.env.NEXT_PUBLIC_APP_URL \|\| ''` |

---

## Task 7: Fix Hardcoded "DRAMAC" Strings for White-Label

**Issue:** 15+ files hardcode "DRAMAC" in user-facing text instead of using `PLATFORM.name`. This breaks white-labeling.

### Files to fix:

| File | Line | Current | Fix |
|------|------|---------|-----|
| `app/(auth)/page.tsx` | 6 | `<h1>DRAMAC</h1>` | `<h1>{PLATFORM.name}</h1>` |
| `app/onboarding/page.tsx` | 365 | `"Welcome to DRAMAC CMS!"` | `"Welcome to ${PLATFORM.name}!"` |
| `app/dashboard/support/page.tsx` | 26, 32, 63, 93 | Multiple "DRAMAC CMS" strings | Use `PLATFORM.name` |
| `app/dashboard/billing/success/page.tsx` | 22 | `"Welcome to DRAMAC Pro!"` | `"Welcome to ${PLATFORM.name} Pro!"` |
| `app/admin/settings/page.tsx` | 68 | `defaultValue="DRAMAC"` | `defaultValue={PLATFORM.name}` |
| `app/admin/settings/page.tsx` | 77 | `"support@dramac.app"` | `PLATFORM.supportEmail` |
| `app/dashboard/domains/[domainId]/email/page.tsx` | 34-35 | `"DRAMAC CMS"` | `PLATFORM.name` |
| `app/dashboard/domains/[domainId]/dns/page.tsx` | 36-37 | `"DRAMAC CMS"` | `PLATFORM.name` |
| `app/dashboard/domains/[domainId]/page.tsx` | 35-36 | `"DRAMAC CMS"` | `PLATFORM.name` |
| `app/dashboard/domains/[domainId]/renew/page.tsx` | 28-29 | `"DRAMAC CMS"` | `PLATFORM.name` |
| `app/dashboard/domains/[domainId]/settings/page.tsx` | 23-24 | `"DRAMAC CMS"` | `PLATFORM.name` |
| `app/embed/booking/[siteId]/page.tsx` | 276 | `"Powered by DRAMAC"` | `"Powered by ${PLATFORM.name}"` |

### Pattern:
```typescript
import { PLATFORM } from '@/lib/constants/platform'
// Then use PLATFORM.name, PLATFORM.supportEmail, etc.
```

---

## Task 8: Fix Inline Supabase Client Creation

**Issue:** 3 files create their own admin Supabase client inline instead of using `createAdminClient()`. This bypasses security checks and misses `autoRefreshToken: false` / `persistSession: false` settings.

### Files to fix:

| File | Current Pattern | Fix |
|------|----------------|-----|
| `app/api/webhooks/lemonsqueezy/route.ts` | `import { createClient } from '@supabase/supabase-js'` then `createClient(URL, KEY)` | `import { createAdminClient } from '@/lib/supabase/admin'` then `createAdminClient()` |
| `app/api/sites/[siteId]/robots.txt/route.ts` | Raw `createClient(URL, KEY)` | `createAdminClient()` |
| `app/api/sites/[siteId]/sitemap.xml/route.ts` | Raw `createClient(URL, KEY)` | `createAdminClient()` |

---

## Task 9: Security — Remove/Protect Debug API Endpoints

**Issue:** 2 debug API routes are accessible without authentication and expose sensitive data.

### 9a: `src/app/api/debug/site-lookup/route.ts`
- Uses `createAdminClient()` (service role) but accepts ANY request with no auth check
- Exposes site IDs, subdomains, custom domains, publishing status
- **Fix:** Either delete or add auth check:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
// Also check if user is admin
```

### 9b: `src/app/api/debug/proxy-check/route.ts`
- Exposes `NEXT_PUBLIC_BASE_DOMAIN`, `NEXT_PUBLIC_APP_URL` environment variables
- **Fix:** Either delete or add admin auth check

### 9c: Delete empty `src/app/api/make-admin/` directory
- Empty directory with no files — clean up

---

## Task 10: Fix CSS Conflicts in `globals.css`

### 10a: Remove duplicate `@layer base` block
**File:** `src/app/globals.css`

The file has TWO `@layer base` blocks:
- First one (early in file): `* { @apply border-border; } body { @apply bg-background... }`
- Second one (~line 491): `* { @apply border-border outline-ring/50; } body { @apply bg-background... }`

**Fix:** Remove the first `@layer base` block — keep only the second (more complete) one.

### 10b: Remove duplicate `@keyframes shimmer`
Two identical `@keyframes shimmer` definitions exist. Remove the duplicate.

### 10c: Remove dead `:root` radius values
The `:root` block defines `--radius-sm: 0.125rem`, `--radius-md: 0.375rem`, `--radius-lg: 0.5rem`. These are overridden by the `@theme inline` block's `calc(var(--radius) ± N)` expressions. Tailwind v4 uses the `@theme inline` values.

**Fix:** Remove the dead `:root` radius definitions to prevent confusion.

### 10d: Fix OKLCH-in-HSL Puck dark mode colors
The `.puck-editor.dark` overrides at ~line 280 wrap OKLCH values in `hsl()`:
```css
/* BEFORE (broken): */
--primary: 0.7 0.2 270; /* OKLCH value */
/* Used as: hsl(var(--primary)) → hsl(0.7 0.2 270) → GARBAGE COLOR */
```

**Fix:** Either:
- Convert to HSL values: `--primary: 270 60% 50%;`
- Or use `oklch()` wrapper: `oklch(var(--primary))`

---

## Task 11: Fix Duplicate `generateId()` Implementations

**Issue:** 7+ files have their own `generateId()` using `Math.random().toString(36).substring(...)`. The codebase also has `uuid` installed as a dependency.

### Files with duplicate `generateId()`:
| File |
|------|
| `lib/studio/store.ts` |
| `lib/studio/utils/id-utils.ts` |
| `lib/studio/utils/component-registry.ts` |
| `lib/studio/utils/clipboard-utils.ts` |
| `lib/studio/utils/template-utils.ts` |
| Multiple other studio files |

**Fix:**
1. Keep ONE canonical `generateId()` in `src/lib/studio/utils/id-utils.ts`
2. Export from there: `export function generateId(prefix = 'comp'): string`
3. Replace all other inline implementations with imports from `id-utils`

---

## Task 12: Fix Null Safety Issues

### 12a: `.split(" ").map(n => n[0])` pattern — 6 files

This pattern crashes or produces `"undefined"` when the string is empty or has leading spaces.

| File | Fix |
|------|-----|
| `components/layout/sidebar-modern.tsx` | Add guard: `name?.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)` |
| `components/portal/portal-header.tsx` | Same fix |
| `modules/support/components/ticket-detail.tsx` | Same fix |
| `components/clients/client-overview.tsx` | Same fix |
| `components/clients/clients-table.tsx` | Same fix |
| `components/layout/header-modern.tsx` | Same fix |

### 12b: `.toLowerCase()` / `.charAt(0)` on nullable props

| File | Issue | Fix |
|------|-------|-----|
| `components/studio/panels/right/testimonials-settings.tsx` | `t.description.toLowerCase()` — description could be null | `(t.description ?? '').toLowerCase()` |
| `components/studio/preview/blocks/testimonial-block.tsx` | `testimonial.author.charAt(0)` — author could be empty | `(testimonial.author ?? 'A').charAt(0)` |

---

## Task 13: Consolidate Duplicate `formatPrice` Functions

**Issue:** 8+ files define their own inline `formatPrice` function. There's already a canonical `formatCurrency()` in `locale-config.ts`.

> **NOTE:** Phase FIX-01 handles replacing the hardcoded `$` symbol. This task handles **consolidating the duplicate function definitions** in `lib/` files.

### Files with duplicate `formatPrice` in `src/lib/`:
| File | Line | Current |
|------|------|---------|
| `lib/paddle/client.ts` | 288 | `formatPrice(cents, currency='USD')` — wrong default |
| `lib/services/portal-service.ts` | 78 | `formatPrice(amount, currency=DEFAULT_CURRENCY)` |
| `lib/actions/module-marketplace.ts` | 193 | `formatPrice(cents, currency='ZMW', locale='en-ZM')` |
| `lib/actions/admin-analytics.ts` | 87 | Private `formatCurrency(cents)` with its own `Intl.NumberFormat` |

**Fix:** Delete all duplicate `formatPrice`/`formatCurrency` in lib files. Import and use the canonical `formatCurrency()` from `@/lib/locale-config`.

---

## Task 14: Fix Duplicate Type Definitions

### 14a: Duplicate `HistoryEntry` interface
| Location | Used By |
|----------|---------|
| `types/studio.ts` | Studio components |
| `lib/studio/store.ts` | Studio store |

**Fix:** Keep the one in `types/studio.ts` (canonical types location). Update `store.ts` to import from `@/types/studio`.

### 14b: Dead `NavItem` in `types/index.ts`
`src/types/index.ts` exports a `NavItem` with `icon?: string` that conflicts with the Lucide-based version from `src/config/`. Zero consumers.

**Fix:** Remove the dead `NavItem` export from `types/index.ts`.

### 14c: Dead `PLANS` in `lib/constants/plans.ts`
`PLANS` object has different pricing than `SUBSCRIPTION_PLANS` in the same or different file. Only `SUBSCRIPTION_PLANS` is imported.

**Fix:** If `PLANS` has zero imports, delete it.

---

## Task 15: Fix Env Var Validation (`src/lib/env.ts`)

**Issue:** `env.ts` only validates Supabase + Stripe env vars. It knows nothing about the ~30+ other env vars actually used (Paddle, Resend, OpenAI, ResellerClub, etc.).

**Fix:** Update the validation schema to include all required env vars:

```typescript
const serverSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Paddle (billing)
  PADDLE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
  
  // Resend (email)
  RESEND_API_KEY: z.string().optional(),
  
  // AI
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_BASE_DOMAIN: z.string().optional(),
  
  // Domain management
  RESELLERCLUB_API_KEY: z.string().optional(),
  RESELLERCLUB_RESELLER_ID: z.string().optional(),
})
```

Also: Replace `!` (non-null assertion) on env vars with proper runtime checks:
```typescript
// BEFORE:
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

// AFTER:
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
```

Files with `!` assertions to fix:
- `lib/supabase/admin.ts`
- `app/api/webhooks/lemonsqueezy/route.ts`
- `app/api/webhooks/stripe/route.ts`

---

## Task 16: Remove Console.log Pollution from Proxy

**File:** `src/proxy.ts`

**Issue:** 9 `console.log` calls execute on every single request, including in production.

**Fix:** Either remove or guard with `NODE_ENV`:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[Proxy]', pathname, '→', destination)
}
```

---

## Task 17: Remove Unused 3D Library Dependencies

**File:** `next-platform-dashboard/package.json`

**Issue:** These packages are installed but have ZERO imports in the codebase:
- `@react-three/drei`
- `@react-three/fiber`  
- `three`
- `@splinetool/react-spline`
- `@splinetool/runtime`

**Also potentially unused:**
- `@types/handlebars` (handlebars ships its own types)

**Fix:**
```bash
pnpm remove @react-three/drei @react-three/fiber three @splinetool/react-spline @splinetool/runtime @types/handlebars
```

> **CAUTION:** Before removing, do one final `grep_search` for each package name to confirm zero usage.

---

## Task 18: Fix `publishPage()` / `unpublishPage()` No-Ops

**File:** `src/lib/actions/publishing-actions.ts`

**Issue:** Both functions query the database but never call `.update()` — they return `{ success: true }` without actually changing anything.

**Fix:**
```typescript
// publishPage should:
const { error } = await supabase
  .from('pages')
  .update({ is_published: true, published_at: new Date().toISOString() })
  .eq('id', pageId)

// unpublishPage should:
const { error } = await supabase
  .from('pages')
  .update({ is_published: false })
  .eq('id', pageId)
```

---

## Task 19: Fix Dead `NAV_ITEMS` and Duplicate Plan Config

### 19a: Dead `NAV_ITEMS` in `src/config/index.ts`
Uses string icon names (e.g., `icon: "LayoutDashboard"`) instead of Lucide components. Never imported. The real navigation is `mainNavigation` in `src/config/navigation.ts`.

**Fix:** Remove the dead `NAV_ITEMS` export.

### 19b: Dead `config.matcher` in `src/proxy.ts`
Both `middleware.ts` and `proxy.ts` export `config.matcher`. Only middleware's is used by Next.js.

**Fix:** Remove the dead `config` export from `proxy.ts`.

---

## Task 20: Fix `useSitePages()` Mock Fallback

**File:** `src/lib/studio/hooks/use-site-pages.ts`

**Issue:** When no `siteId` is provided or on API error, the hook returns hardcoded mock pages (Home, About, Services, Contact, Blog) instead of an empty array.

**Fix:** Return empty array with a `loading` state on error, not fake pages:
```typescript
// BEFORE:
catch (e) { return [{ title: 'Home', ... }, { title: 'About', ... }] }

// AFTER:
catch (e) { console.error('Failed to load pages:', e); return [] }
```

---

## Verification Checklist

- [ ] `database.types.ts` deleted — single `database.ts` remains
- [ ] All dead component directories deleted (feedback, publishing, seo, editor if confirmed dead)
- [ ] 40+ individual dead components deleted
- [ ] Barrel files cleaned up (no dangling exports)
- [ ] Zero `dramac.io` references remain — all use `PLATFORM.*` constants
- [ ] Zero `NEXT_PUBLIC_BASE_URL` references — all use `NEXT_PUBLIC_APP_URL`
- [ ] Zero hardcoded "DRAMAC" in user-facing text — all use `PLATFORM.name`
- [ ] All 3 inline Supabase clients → `createAdminClient()`
- [ ] Debug API endpoints require auth or deleted
- [ ] CSS duplicate blocks removed from `globals.css`
- [ ] `generateId()` consolidated to single source
- [ ] Null safety guards added (6 initials patterns, 2 toLowerCase/charAt)
- [ ] Duplicate `formatPrice` in lib files consolidated
- [ ] Duplicate type definitions resolved
- [ ] Env validation updated
- [ ] Console.log removed from proxy
- [ ] 3D libraries removed from dependencies
- [ ] `publishPage()`/`unpublishPage()` actually update the database
- [ ] Dead nav config removed
- [ ] `useSitePages()` mock fallback removed
- [ ] `npx tsc --noEmit` returns zero errors
- [ ] `pnpm build` succeeds (if time permits)

---

## Files Affected Summary

| Action | Count | Examples |
|--------|-------|---------|
| **Delete** | ~60 files | Dead components, directories, duplicate types |
| **Modify** | ~40 files | Domain fixes, env var fixes, DRAMAC→PLATFORM, null safety, CSS cleanup |
| **Create** | 0 files | No new files needed |
| **Remove deps** | ~6 packages | 3D libs, duplicate types |
| **Total** | ~100 file operations |

---

## Priority Order

1. **Security patches** (Tasks 9, 8) — debug endpoints exposed, inline Supabase clients
2. **Broken URLs** (Task 6) — `NEXT_PUBLIC_BASE_URL` producing broken quote links
3. **Domain identity** (Task 5) — `dramac.io` vs `dramacagency.com` confusion
4. **White-label strings** (Task 7) — hardcoded "DRAMAC" breaks rebranding
5. **CSS conflicts** (Task 10) — duplicate blocks, broken Puck dark mode
6. **Dead code deletion** (Tasks 1-4) — reduce codebase noise by ~60 files
7. **Type cleanup** (Task 14) — eliminate drift risk
8. **Null safety** (Task 12) — prevent potential crashes
9. **Pattern consolidation** (Tasks 11, 13) — reduce duplication
10. **No-ops & stubs** (Tasks 18, 20) — functions that pretend to work
11. **Env validation** (Task 15) — prevent silent production failures
12. **Cleanup** (Tasks 16, 17, 19) — polish

---

## Cross-Phase Independence Matrix

| Phase | Touches These Files | NEVER Touches |
|-------|--------------------|----|
| **FIX-01** (Branding/Currency) | `branding-provider.tsx`, `globals.css`, `tailwind.config.ts`, `locale-config.ts`, all `$`-formatting files, `settings-navigation.ts` | Dead code, domain fixes, debug endpoints |
| **FIX-02** (Stubs/Mocks) | `social-analytics.ts`, `admin-analytics.ts`, `admin/settings/page.tsx`, automation, PDF, ecommerce, CRM, studio, AI actions | CSS, navigation, dead code, domain fixes |
| **FIX-03** (Navigation/Routing) | Nav configs, route files (delete/create), middleware/proxy, error boundaries, module catalog | Server actions, CSS, branding, currency |
| **FIX-04** (This Phase) | Dead files, domain strings, env vars, types, CSS duplicates, null safety, debug endpoints | Branding provider, server action data, navigation configs, currency formatting |

**Result:** All 4 phases can run in ANY order without conflicts. Each phase has clear file ownership boundaries.

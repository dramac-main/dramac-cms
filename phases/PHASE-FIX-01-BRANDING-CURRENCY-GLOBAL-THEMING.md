# PHASE-FIX-01: Global Branding, Smart Currency & Complete Theming

**Priority:** 🔴 CRITICAL — Addresses the #1 and #2 most-reported user complaints  
**Estimated Scope:** ~25 files modified, 2 new files created, 1 migration  
**Dependencies:** None — can be implemented immediately  
**Runs Independently:** YES — this phase has ZERO dependencies on other FIX phases

---

## ⚠️ AI IMPLEMENTATION INSTRUCTIONS

> **READ BEFORE IMPLEMENTING.** This phase is designed to run in a NEW session where the AI has no prior context. Follow these rules strictly:

### Session Setup
1. **Read ALL memory bank files first** (`/memory-bank/*.md`) — they contain architecture decisions, patterns, and known gotchas
2. **Read `/memory-bank/systemPatterns.md`** — it documents the CSS variable naming convention (`--color-*` prefix = Tailwind HSL, `--primary` = OKLCH shadcn defaults)
3. **Run `npx tsc --noEmit`** before AND after implementation to verify zero errors

### Critical Technical Context
- **CSS vars use `--color-` prefix** for Tailwind (e.g., `--color-primary`). The `--primary` vars are OKLCH (shadcn defaults) and are NOT used by Tailwind
- **BrandingProvider** (`src/components/providers/branding-provider.tsx`) injects `--color-primary` and `--color-accent` with HSL shade scales. This is CORRECT. Do NOT change the prefix.
- **`globals.css`** has a `@theme inline` block that maps `--color-sidebar: var(--sidebar)`. Sidebar vars are OKLCH and independent from BrandingProvider. This is the ROOT CAUSE of sidebar not following branding.
- **`tailwind.config.ts`** uses `generateColorScale(name)` → `hsl(var(--color-${name}))`. Any new color must follow this pattern.
- **`locale-config.ts`** is the canonical source for `DEFAULT_CURRENCY` (`ZMW`), `DEFAULT_CURRENCY_SYMBOL` (`K`), `DEFAULT_LOCALE` (`en-ZM`), `DEFAULT_TIMEZONE` (`Africa/Lusaka`). NEVER hardcode these values.
- **Supabase clients**: Use `createClient()` for dashboard (cookie-auth) and `createAdminClient()` for public/webhook routes (service role)
- **Email**: Use `sendEmail()` from `@/lib/email/send-email` — do NOT call `createNotification()` for email (that's in-app only)

### Conflict Prevention
- This phase modifies `branding-provider.tsx`, `sidebar-modern.tsx`, `globals.css`, `tailwind.config.ts`, `settings-navigation.ts`. If other phases also touch these files, implement THIS phase first.
- Phase FIX-03 Task 3 adds "Regional" to settings nav — that depends on THIS phase's Task 5 (Regional page). The nav entry can be added here.
- Phase FIX-02 mentions "currency $ fixes handled in Phase FIX-01" — this phase owns ALL currency formatting changes. Phase FIX-02 should NOT touch currency.
- The 40+ hardcoded `$` occurrences include files in `components/modules/`, `components/admin/`, `components/billing/`, marketplace pages, and ecommerce views. Fix ALL of them in this phase.

### Verification Gate
After completing ALL tasks, run:
```bash
cd next-platform-dashboard
npx tsc --noEmit
```
If zero errors: `git add -A && git commit -m "feat: Phase FIX-01 — global branding, smart currency, complete theming" && git push`

---

## Problem Statement

The branding system only changes `--color-primary` and `--color-accent` buttons. The sidebar, cards, page headers, navigation highlights, and all other chrome remain hardcoded gray/blue/purple. The user sees "two logos overlapping" due to a purple `bg-primary` box behind transparent logos. Currency still shows `$` (USD) in 13+ locations despite the platform targeting Zambia (ZMW/K). There is NO settings page for an admin to change currency — it's hardcoded as a compile-time constant.

---

## Task 1: Fix Double Logo (bg-primary box behind logo)

**File:** `src/components/layout/sidebar-modern.tsx`

**Root Cause:** The `SidebarLogo` component always renders a `h-9 w-9 rounded-lg bg-primary` box. When a logo image is provided, the image renders inside this box. If the logo has transparent background or isn't perfectly square, the purple `bg-primary` box shows through, creating a "two logos overlapping" effect.

**Fix:**
```tsx
// BEFORE:
<motion.div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0 overflow-hidden">
  {logoUrl ? (
    <img src={logoUrl} alt={displayName} className="h-full w-full object-contain" />
  ) : (
    <span className="text-lg font-bold text-primary-foreground">{initial}</span>
  )}
</motion.div>

// AFTER:
<motion.div className={cn(
  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
  logoUrl ? "bg-transparent" : "bg-primary"
)}>
  {logoUrl ? (
    <img src={logoUrl} alt={displayName} className="h-full w-full object-contain" />
  ) : (
    <span className="text-lg font-bold text-primary-foreground">{initial}</span>
  )}
</motion.div>
```

---

## Task 2: Inject Sidebar CSS Variables from BrandingProvider

**File:** `src/components/providers/branding-provider.tsx`

**Root Cause:** BrandingProvider injects `--color-primary` and `--color-accent` but NEVER injects:
- `--sidebar`, `--sidebar-foreground`
- `--sidebar-primary`, `--sidebar-primary-foreground`
- `--sidebar-accent`, `--sidebar-accent-foreground`
- `--sidebar-border`, `--sidebar-ring`

These are defined in `globals.css` as OKLCH values and never overridden. The sidebar always shows the default gray/white theme regardless of branding.

**Fix — Add to the `style.textContent` block in BrandingProvider:**

The sidebar vars use OKLCH format in `globals.css`, but they're mapped through `@theme inline` in globals.css via `--color-sidebar: var(--sidebar)`. The cleanest approach is to also inject `--color-secondary`, `--color-ring`, `--color-border` alongside the sidebar vars, all derived from the brand primary color.

```tsx
// Add these CSS var injections alongside existing --color-primary/--color-accent:
// Sidebar vars — derive from primary brand color
--sidebar: hsl(${primaryHSL});              // sidebar background tint (light)
--sidebar-foreground: hsl(${primaryFgHSL}); // or keep as default foreground
--sidebar-primary: hsl(${primaryHSL});
--sidebar-primary-foreground: hsl(${primaryFgHSL});
--sidebar-accent: hsl(${accentHSL});
--sidebar-accent-foreground: hsl(${accentFgHSL});
--sidebar-border: hsl(${primaryHSL} / 0.15);
--sidebar-ring: hsl(${primaryHSL});

// Also inject ring color to match primary
--color-ring: ${primaryHSL};
--color-secondary: ${accentHSL};
--color-secondary-foreground: ${accentFgHSL};
```

**IMPORTANT:** The `@theme inline` block in `globals.css` maps `--color-sidebar: var(--sidebar)` etc. So we need to inject both the raw `--sidebar` var (used by `@theme inline`) AND/OR update `@theme inline` to use `--color-sidebar-primary: hsl(var(--color-primary))` so sidebar automatically follows primary branding.

**Alternative (simpler) — Update globals.css `@theme inline` block:**
```css
/* Instead of sidebar having its own independent color system,
   make sidebar colors DERIVE from primary brand colors: */
--color-sidebar-primary: hsl(var(--color-primary));
--color-sidebar-primary-foreground: hsl(var(--color-primary-foreground));
--color-sidebar-accent: hsl(var(--color-accent));
--color-sidebar-accent-foreground: hsl(var(--color-accent-foreground));
```

This approach requires ZERO changes to BrandingProvider — the sidebar will automatically follow branding.

---

## Task 3: Remove Hardcoded Purple Values from Tailwind Config

**File:** `tailwind.config.ts`

**Issue:** 8+ hardcoded purple hex values (`#7c3aed`, `rgba(139,92,246,...)`) in gradients, shadows, and keyframes. These should reference CSS variables.

**Fix — Replace hardcoded purples:**

| Current | Replace With |
|---------|-------------|
| `rgba(139, 92, 246, 0.3)` in `boxShadow.glow` | `hsl(var(--color-primary) / 0.3)` |
| `rgba(139, 92, 246, 0.15)` in `boxShadow.glow-light` | `hsl(var(--color-primary) / 0.15)` |
| `#7c3aed, #a78bfa, #c4b5fd` in `gradient-primary` | `hsl(var(--color-primary)), hsl(var(--color-primary-400)), hsl(var(--color-primary-300))` |
| `#1e1b4b, #312e81, #4c1d95` in `gradient-premium` | Dark versions using `hsl(var(--color-primary-950)), hsl(var(--color-primary-900)), hsl(var(--color-primary-800))` |
| `#5b21b6, #7c3aed` in `gradient-stat` | `hsl(var(--color-primary-700)), hsl(var(--color-primary))` |
| `rgba(139,92,246,0.2)` in `gradient-sidebar-active` | `hsl(var(--color-primary) / 0.2)` |
| `glowPulse` keyframe purples | Reference CSS vars via `hsl(var(--color-primary) / 0.4)` |

---

## Task 4: Database Migration — Agency Regional Preferences

**File:** `migrations/20250210_agency_regional_preferences.sql`

**Why:** There is NO database column for currency/locale/timezone. Everything is a compile-time constant. Admins need to save their preference per agency.

```sql
-- Add regional preference columns to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'ZMW';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS default_locale TEXT NOT NULL DEFAULT 'en-ZM';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS default_timezone TEXT NOT NULL DEFAULT 'Africa/Lusaka';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 16.00;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS weight_unit TEXT NOT NULL DEFAULT 'kg';
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS dimension_unit TEXT NOT NULL DEFAULT 'cm';

-- Update database.types.ts after running this migration
-- Then regenerate types: npx supabase gen types typescript --project-id <id>
```

---

## Task 5: Create Smart Currency / Regional Settings Page

**New File:** `src/app/(dashboard)/settings/regional/page.tsx`

**Purpose:** A settings page where the agency admin can configure:
- Default Currency (dropdown of 20+ currencies from `CURRENCY_SYMBOLS` map)
- Default Locale (dropdown)
- Default Timezone (dropdown with Africa/Lusaka highlighted)
- Date Format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Tax Rate (%)
- Tax Inclusive (toggle)
- Weight Unit (kg/lb)
- Dimension Unit (cm/in)

**UI Layout:**
```
┌─ Regional Settings ──────────────────────────────┐
│ Configure currency, timezone, and locale for      │
│ your agency. These settings apply globally.       │
│                                                   │
│ Currency ──────────────────────────────────────── │
│ [ZMW - Zambian Kwacha (K)     ▼]                 │
│ Preview: K 1,250.00                               │
│                                                   │
│ Locale ──────────────────────────────────────────│
│ [en-ZM - English (Zambia)     ▼]                 │
│                                                   │
│ Timezone ────────────────────────────────────────│
│ [Africa/Lusaka (UTC+2)        ▼]                 │
│                                                   │
│ Date Format ─────────────────────────────────────│
│ ○ DD/MM/YYYY (10/02/2026)                        │
│ ○ MM/DD/YYYY (02/10/2026)                        │
│ ○ YYYY-MM-DD (2026-02-10)                        │
│                                                   │
│ Tax ─────────────────────────────────────────────│
│ Default Tax Rate: [16.00] %                       │
│ ☑ Prices include tax                              │
│                                                   │
│ Units ───────────────────────────────────────────│
│ Weight: [kg ▼]   Dimensions: [cm ▼]             │
│                                                   │
│                              [💾 Save Settings]   │
└───────────────────────────────────────────────────┘
```

**Data Flow:**
1. Page loads → fetches `agencies` row for current agency
2. Populates form from `default_currency`, `default_locale`, `default_timezone`, etc.
3. On save → updates `agencies` table via server action
4. Toast confirmation with preview of formatted values

---

## Task 6: Add "Regional" to Settings Navigation

**File:** `src/config/settings-navigation.ts`

**Add under "Agency" section:**
```ts
{ name: "Regional", href: "/settings/regional", icon: Globe2 },
```

**Also add missing pages:**
```ts
// Under "Agency"
{ name: "Activity Log", href: "/settings/activity", icon: Activity },
{ name: "Modules", href: "/settings/modules", icon: Puzzle },
```

---

## Task 7: Create Agency Currency Context Provider

**New File:** `src/components/providers/currency-provider.tsx`

**Purpose:** React context that provides the agency's currency/locale/timezone to ALL components. Replaces the static `DEFAULT_CURRENCY` import pattern.

```tsx
interface CurrencyContextType {
  currency: string;       // 'ZMW'
  currencySymbol: string; // 'K'
  locale: string;         // 'en-ZM'
  timezone: string;       // 'Africa/Lusaka'
  dateFormat: string;     // 'DD/MM/YYYY'
  taxRate: number;        // 16
  taxInclusive: boolean;  // true
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}
```

**Mount in:** `src/app/(dashboard)/layout.tsx` — wraps children alongside BrandingProvider

**Server-side fetch:** Layout fetches agency's regional preferences from DB, passes as `initialPreferences` prop (SSR, no loading flash).

---

## Task 8: Fix ALL Hardcoded Currency (`$` / USD) — 40+ Occurrences

> **DEEP SCAN UPDATE (Feb 2026):** A full platform scan found **40 occurrences** of hardcoded `$` formatting across the codebase (not just 13). The pattern is `` `$${(cents / 100).toFixed(2)}` `` — every one must be replaced.

### Files with hardcoded `$` symbol (renders wrong currency RIGHT NOW):

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 1 | `ecommerce/views/gift-cards-view.tsx` | 150 | `` `$${(cents/100).toFixed(2)}` `` | Use `useAgencyCurrency().formatCurrency(cents/100)` |
| 2 | `ecommerce/views/marketing-view.tsx` | 52 | `` `$${(cents/100).toFixed(2)}` `` | Same |
| 3 | `ecommerce/views/loyalty-view.tsx` | 111 | `` `$${(cents/100).toFixed(2)}` `` | Same |
| 4 | `ecommerce/views/loyalty-view.tsx` | 220 | `"points per $1 spent"` | `"points per {symbol}1 spent"` |
| 5 | `ecommerce/views/loyalty-view.tsx` | 225 | `"points = $1 discount"` | `"points = {symbol}1 discount"` |
| 6 | `ecommerce/views/discounts-view.tsx` | 93 | `` `$${(discount.value/100).toFixed(2)}` `` | Use `formatCurrency` |
| 7 | `ecommerce/views/orders-view.tsx` | 241 | `$${(order.total/100).toFixed(2)}` | Use `formatCurrency` |
| 8 | `ecommerce/dialogs/edit-discount-dialog.tsx` | 184 | `'Amount ($)'` | `'Amount ({symbol})'` |
| 9 | `ecommerce/dialogs/edit-discount-dialog.tsx` | 217 | `'Minimum Purchase Amount ($)'` | Same pattern |
| 10 | `ecommerce/dialogs/flash-sale-dialog.tsx` | 237 | `'Amount ($)'` | Same pattern |
| 11 | `domains/settings/domain-pricing-config.tsx` | 137 | `'Fixed Amount ($)'` | `'Fixed Amount ({symbol})'` |
| 12 | `domains/settings/domain-pricing-config.tsx` | 138 | `'Custom Price ($)'` | Same |
| 13 | `lib/paddle/client.ts` | 288 | `currency: string = 'USD'` | `currency: string = DEFAULT_CURRENCY` |

### Additional files found in deep scan (same `$${(cents/100).toFixed(2)}` pattern):

| # | File | Context |
|---|------|---------|
| 14 | `components/modules/ModuleCard.tsx` | Module pricing display |
| 15 | `components/modules/marketplace-module-card.tsx` | Marketplace card pricing |
| 16 | `components/modules/module-install-dialog.tsx` | Install dialog pricing |
| 17 | `components/modules/module-detail-view.tsx` | Module detail pricing |
| 18 | `components/modules/marketplace/enhanced-module-card.tsx` | Enhanced card pricing |
| 19 | `components/billing/subscription-management.tsx` | Subscription amounts |
| 20 | `components/billing/subscription-management-paddle.tsx` | Paddle subscription pricing |
| 21 | `components/billing/paddle-pricing-cards.tsx` | Pricing card amounts |
| 22 | `components/admin/module-management-table.tsx` | Admin module pricing |
| 23 | `components/admin/agency-management-table.tsx` | Agency revenue display |
| 24 | `components/admin/admin-revenue-overview.tsx` | Revenue charts `valuePrefix="$"` |
| 25 | `components/admin/admin-subscriptions.tsx` | Subscription amounts |
| 26 | `components/admin/admin-module-analytics.tsx` | Module revenue display |
| 27 | `app/(dashboard)/marketplace/v2/[slug]/page.tsx` | V2 module detail pricing |
| 28 | `app/(dashboard)/admin/modules/[moduleId]/page.tsx` | Admin module detail |
| 29 | `app/(dashboard)/developer/revenue/page.tsx` | Developer revenue display |
| 30 | `app/(dashboard)/checkout/module/page.tsx` | Module checkout pricing |

### Pattern for each fix:
```tsx
// BEFORE (broken):
const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

// AFTER — Option A (if in client component with CurrencyProvider from Task 7):
const { formatCurrency } = useAgencyCurrency()
// Usage: formatCurrency(cents / 100)

// AFTER — Option B (if CurrencyProvider not yet available):
import { formatCurrency } from '@/lib/locale-config'
// Usage: formatCurrency(cents / 100)
```

> **IMPORTANT:** Use `grep_search` for `\$\$\{` and `valuePrefix="$"` to find ANY remaining occurrences not listed above. The goal is ZERO hardcoded `$` in the entire codebase.

---

## Task 9: Update Existing Components Using Static DEFAULT_CURRENCY

25+ files currently import `DEFAULT_CURRENCY` from `locale-config.ts`. These work today (they show ZMW) but won't respect per-agency settings. Each needs to be updated to use `useAgencyCurrency()` context instead.

**Server Actions** (cannot use hooks — pass currency from caller or read from DB):
- `business-notifications.ts` — accepts `currency` param ✅ already
- `admin-analytics.ts` — server context, use `getAgencyCurrency(agencyId)` helper
- `quote-automation.ts` — uses `quote.currency` ✅ already

**Client Components** (use the hook):
- All booking components (`booking-metric-card`, `ServiceSelectorBlock`, `BookingWidgetBlock`, etc.)
- All CRM components (`pipeline-board`, `pipeline-stage`, `deal-card`, `deal-quick-view`, etc.)
- All ecommerce components (`inventory-view`, `product-columns`, `reports-view`, etc.)
- Portal billing service

---

## Verification Checklist

- [ ] No purple `bg-primary` box behind transparent logos
- [ ] Sidebar colors change when branding is configured (primary color → sidebar highlight)
- [ ] All gradients, glows, shadows use CSS vars instead of hardcoded `#7c3aed`
- [ ] Settings → Regional page exists and saves to DB
- [ ] Currency dropdown shows 20+ currencies with correct symbols
- [ ] Changing currency in settings immediately updates all views
- [ ] No `$` symbol visible anywhere in the dashboard when currency is ZMW
- [ ] Booking service creation shows "Price (K)" not "Price ($)"
- [ ] Ecommerce orders show "K 1,250.00" not "$12.50"
- [ ] Portal invoices show correct currency
- [ ] `tsc --noEmit` returns zero errors
- [ ] Settings navigation includes Regional, Activity Log, Modules

---

## Files Affected Summary

| Action | Files |
|--------|-------|
| **Modify** | `branding-provider.tsx`, `sidebar-modern.tsx`, `globals.css`, `tailwind.config.ts`, `settings-navigation.ts`, `(dashboard)/layout.tsx`, `locale-config.ts`, `paddle/client.ts` + 40 hardcoded `$` files + 25 DEFAULT_CURRENCY files |
| **Create** | `settings/regional/page.tsx`, `providers/currency-provider.tsx`, `migrations/20250210_agency_regional_preferences.sql` |
| **Total** | ~70 files |

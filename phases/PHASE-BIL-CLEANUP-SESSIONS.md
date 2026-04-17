# Billing System Cleanup — Two-Session Implementation Guide

**Document Type**: Cleanup & Bugfix Sessions  
**Created**: July 2026  
**Context**: Post Billing V5 (BIL-01 through BIL-10 complete)  
**Purpose**: Fix console errors, remove dead pages, fix branding leaks, ensure billing works cleanly across all platform levels  

---

## Pre-Session Checklist (Both Sessions)

1. Read ALL memory bank files (`/memory-bank/*.md`)
2. Read `/phases/PHASE-BIL-MASTER-GUIDE.md` for billing architecture context
3. Run `npx tsc --noEmit --skipLibCheck` with `NODE_OPTIONS="--max-old-space-size=8192"` — note baseline errors
4. After all changes: re-run tsc + `npx next build` — zero new errors

---

## Session 1: Console Errors, Dead Pages & Price ID Fixes

**Goal**: Eliminate all billing-related console errors, remove the dead `/settings/subscription` page, fix the 404 API route, and guard against NaN in usage metrics.

### Task 1.1 — Remove Dead `/settings/subscription` Page

**Problem**: `/settings/subscription` uses `SubscriptionDetails` component that calls `/api/billing/paddle/overview` — a route that **does not exist**. It also uses wrong plan names (`enterprise`/`pro` instead of `starter`/`growth`/`agency`) and wrong feature limits. The real billing page is `/settings/billing` which has proper components (`CurrentPlanCard`, `UsageDashboard`, `PaymentMethod`, etc.).

**Files to delete**:
- `src/app/(dashboard)/settings/subscription/page.tsx`
- `src/components/settings/subscription-details.tsx`

**Verification**:
- Search codebase for any links/references to `/settings/subscription` and update them to `/settings/billing`
- Search for any imports of `subscription-details` — should be zero after deletion
- Check `src/components/layout/` sidebar/nav components for subscription links

### Task 1.2 — Trim `\r\n` from Paddle Price IDs

**Problem**: Environment variables can contain trailing `\r\n` (Windows line endings from `.env` files). This causes Paddle API 400 errors with malformed price IDs like `"pri_01kp9b2eqyrczr5fbx6zb3wfn3\r\n"`.

**File**: `src/lib/paddle/client.ts`

**Fix**: Add `.trim()` to every `process.env.*` read in the `PADDLE_IDS` object (lines ~53-63):

```typescript
// Before
starter_monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || "",

// After
starter_monthly: (process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY || "").trim(),
```

Apply `.trim()` to ALL price and product ID env var reads in `PADDLE_IDS.products` and `PADDLE_IDS.prices`.

### Task 1.3 — Fix NaN in Usage Dashboard Progress Bars

**Problem**: `usage-dashboard.tsx` computes `percentUsed` and passes it to `<Progress value={Math.min(percent, 100)} />`. If upstream data has `NaN` (e.g., division by zero when `included` is 0), `Math.min(NaN, 100)` returns `NaN`, causing React warnings.

**File**: `src/components/billing/usage-dashboard.tsx`

**Fix**: In the `UsageCard` component, guard the percent value:

```typescript
// Before
<Progress value={Math.min(percent, 100)} />

// After  
<Progress value={Number.isFinite(percent) ? Math.min(percent, 100) : 0} />
```

Also guard the text display:
```typescript
// Before
{percent.toFixed(1)}% used

// After
{Number.isFinite(percent) ? percent.toFixed(1) : "0.0"}% used
```

### Task 1.4 — Suppress `PADDLE_API_KEY not set` Warning in Dev

**Problem**: `src/lib/paddle/client.ts` line 19 always fires `console.warn("[Paddle] PADDLE_API_KEY not set")` even during build/lint when env vars aren't loaded.

**File**: `src/lib/paddle/client.ts`

**Fix**: Only warn at runtime, not during build:

```typescript
// Before
if (!process.env.PADDLE_API_KEY) {
  console.warn("[Paddle] PADDLE_API_KEY not set - billing features will be disabled");
}

// After
if (typeof window === "undefined" && !process.env.PADDLE_API_KEY && process.env.NODE_ENV !== "production") {
  // Only warn in development server runtime, not during build
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    console.warn("[Paddle] PADDLE_API_KEY not set - billing features will be disabled");
  }
}
```

### Task 1.5 — Verify & Commit

1. Search for any remaining references to the deleted subscription page/component
2. Run `npx tsc --noEmit --skipLibCheck` — zero new errors
3. Run `npx next build` — must succeed
4. Test in browser: `/settings/billing` loads correctly, no console errors for NaN or 404
5. Commit: `git add -A && git commit -m "fix: Session 1 — remove dead subscription page, fix price ID trimming, NaN guards" && git push`
6. Update `memory-bank/activeContext.md` and `memory-bank/progress.md`

---

## Session 2: Branding Fixes & Cross-Level Billing Consistency

**Goal**: Replace all hardcoded branding strings with dynamic platform/agency branding. Ensure billing pages work correctly at every platform level (super admin, agency owner, team member, client portal).

### Task 2.1 — Fix Billing Success Page Branding

**Problem**: `src/app/(dashboard)/dashboard/billing/success/page.tsx` line 14 has hardcoded `"Welcome to DRAMAC Pro!"`.

**File**: `src/app/(dashboard)/dashboard/billing/success/page.tsx`

**Fix**: The page already imports `PLATFORM` from constants. Use it:

```typescript
// Before
<h1 className="text-2xl font-bold mb-2">Welcome to DRAMAC Pro!</h1>

// After
<h1 className="text-2xl font-bold mb-2">Welcome to {PLATFORM.name}!</h1>
```

Also update the description text to be plan-aware if possible (check if we can read the plan from URL search params like `?plan=growth`).

### Task 2.2 — Fix Plan Comparison Table Branding

**Problem**: `src/components/billing/plan-comparison-table.tsx` has hardcoded strings:
- Line ~111: `"DRAMAC Studio"` in feature list
- Line ~135: `"Remove DRAMAC branding"` in feature list

**File**: `src/components/billing/plan-comparison-table.tsx`

**Fix**: Import `PLATFORM` from `@/lib/constants/platform` and use dynamic strings:

```typescript
// Before
{ label: "DRAMAC Studio", starter: true, growth: true, agency: true },
// After
{ label: `${PLATFORM.name} Studio`, starter: true, growth: true, agency: true },

// Before
{ label: "Remove DRAMAC branding", starter: false, growth: false, agency: true },
// After
{ label: `Remove ${PLATFORM.name} branding`, starter: false, growth: false, agency: true },
```

### Task 2.3 — Fix Plan Change Dialog Labels

**Problem**: `src/components/billing/plan-change-dialog.tsx` uses generic `"White-label branding"` text at lines ~486 and ~528. This should reference the platform name for clarity.

**File**: `src/components/billing/plan-change-dialog.tsx`

**Fix**: Review the context of these strings. If they're feature descriptions shown to agency-level users, they should read something like `"White-label your dashboard"` or `"Custom branding (remove ${PLATFORM.name})"`. Update to be specific and brand-aware.

### Task 2.4 — Audit Billing Page Access by Role

Verify that each billing page correctly restricts access by role:

| Page | Who Can Access | Guard |
|------|---------------|-------|
| `/settings/billing` | Agency owner only | `member.role !== "owner"` → redirect `/settings` |
| `/dashboard/billing/success` | Any authenticated user | Auth check only (post-checkout) |
| `/dashboard/billing/cancel` | Agency owner only | Needs owner check |
| `/admin/billing` | Super admin only | Admin layout guard |
| `/pricing` | Public | No guard needed |
| Client portal billing | Client portal users | Portal auth guard |

**Action**: Read each billing page file and verify the auth guard is correct. Fix any missing guards.

### Task 2.5 — Ensure Agency-Level Branding Flows to Billing

**Context**: The `BrandingProvider` injects CSS variables from `agency_branding` table. When an agency has custom branding, their billing pages should reflect those colors (buttons, accents, etc.) through CSS variables — NOT through hardcoded color values.

**Check**: Verify that billing components use semantic Tailwind classes (`bg-primary`, `text-primary-foreground`, etc.) rather than hardcoded colors. The BrandingProvider handles the rest via CSS variable overrides.

**Files to scan**:
- `src/components/billing/current-plan-card.tsx`
- `src/components/billing/plan-comparison-table.tsx`
- `src/components/billing/plan-change-dialog.tsx`
- `src/components/billing/trial-banner.tsx`

Flag any hardcoded hex colors or `bg-blue-*`/`bg-indigo-*` that should be `bg-primary` etc.

### Task 2.6 — Verify & Commit

1. Search the entire `src/` directory for remaining hardcoded "DRAMAC" strings in billing components
2. Run `npx tsc --noEmit --skipLibCheck` — zero new errors
3. Run `npx next build` — must succeed
4. Spot-check in browser:
   - `/pricing` — plan comparison table shows platform name dynamically
   - `/settings/billing` — loads cleanly for agency owner
   - `/dashboard/billing/success` — shows correct platform name
5. Commit: `git add -A && git commit -m "fix: Session 2 — billing branding cleanup, role audit" && git push`
6. Update `memory-bank/activeContext.md` and `memory-bank/progress.md`

---

## Summary of All Changes

### Files to DELETE (Session 1)
| File | Reason |
|------|--------|
| `src/app/(dashboard)/settings/subscription/page.tsx` | Dead page — duplicates `/settings/billing`, calls non-existent API |
| `src/components/settings/subscription-details.tsx` | Component for dead page — wrong plans, wrong API endpoint |

### Files to MODIFY (Session 1)
| File | Change |
|------|--------|
| `src/lib/paddle/client.ts` | `.trim()` all env var reads in PADDLE_IDS; improve PADDLE_API_KEY warning |
| `src/components/billing/usage-dashboard.tsx` | NaN guard on Progress value and percent display |

### Files to MODIFY (Session 2)
| File | Change |
|------|--------|
| `src/app/(dashboard)/dashboard/billing/success/page.tsx` | `"DRAMAC Pro"` → `PLATFORM.name` |
| `src/components/billing/plan-comparison-table.tsx` | `"DRAMAC Studio"` and `"Remove DRAMAC branding"` → dynamic |
| `src/components/billing/plan-change-dialog.tsx` | Generic branding labels → platform-aware |

### Console Errors Resolved
| Error | Root Cause | Fix |
|-------|-----------|-----|
| 404 `/api/billing/paddle/overview` | Dead subscription page calling non-existent route | Delete the page |
| NaN in `<Progress>` | Division by zero in usage calculation | `Number.isFinite()` guard |
| `\r\n` in Paddle price IDs | Untrimmed env vars | `.trim()` on all reads |
| `PADDLE_API_KEY not set` | Warning fires during build | Conditional warning |

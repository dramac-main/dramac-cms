# DRAMAC CMS — Master Implementation Plan: White-Label, UX & Domain Excellence

**Created**: Based on deep platform scan and gap analysis  
**Reference**: `docs/USER-JOURNEYS.md` (7 user types, 25+ journeys)  
**Goal**: Transform DRAMAC into an industry-standard white-label SaaS platform

---

## ⚠️ CRITICAL: Read Before Implementing ANY Phase

1. **Read [PHASE-IMPLEMENTATION-CONTRACT.md](PHASE-IMPLEMENTATION-CONTRACT.md) FIRST** — Contains rules that ALL phases must follow to prevent conflicts, breaking changes, and misimplementation.
2. **Read ALL memory bank files** (`/memory-bank/*.md`) — Contains project context, tech stack, and patterns.
3. **Follow the execution order below** — Phases have dependencies. Implementing out of order WILL cause failures.

---

## Executive Summary

DRAMAC CMS has a strong technical foundation (Next.js 16, React 19, Supabase, excellent mobile responsive sidebar, command palette, dark mode). However, two critical problems exist:

**Problem 1: White-Label Branding (Score: 0%)**  
Every customer-facing touchpoint says "Dramac" — emails, portal, page titles, widgets — making it impossible for agencies to present the platform as their own product.

**Problem 2: UX Clutter & Dead Code (63 Issues Found)**  
Pages have up to 13 buttons in a single toolbar, 5 completely non-functional buttons, fake data displayed as real, duplicate routes for the same feature, and inconsistent patterns across pages.

This plan consists of **8 implementation phases** that address every gap:

| # | Phase | Priority | Effort | Description |
|---|-------|----------|--------|-------------|
| 0 | [PHASE-UX-00](PHASE-UX-00-PAGE-SIMPLIFICATION.md) | 🔴 P0 | 3-4 days | **START HERE**: Fix dead buttons, remove fake data, reduce button clutter, standardize patterns |
| 1 | [PHASE-UX-01](PHASE-UX-01-GLOBAL-UX-POLISH.md) | 🔴 P0 | 2-3 days | Global UX polish: progress bar, loading states, mobile dialogs, DataTable |
| 2 | [PHASE-WL-01](PHASE-WL-01-BRANDING-FOUNDATION.md) | 🔴 P0 | 3-4 days | White-label foundation: DB schema, BrandingProvider, remove hardcoded "DRAMAC" |
| 3 | [PHASE-WL-02](PHASE-WL-02-EMAIL-SYSTEM-OVERHAUL.md) | 🔴 P0 | 3-4 days | Email overhaul: 18 branded templates, notification preferences, delivery tracking |
| 4 | [PHASE-DM-01](PHASE-DM-01-DOMAIN-MANAGEMENT-OVERHAUL.md) | 🔴 P0 | 3-4 days | Domain management: cascade service, real domains-manager, health monitoring |
| 5 | [PHASE-WL-03](PHASE-WL-03-PORTAL-WHITE-LABEL.md) | 🔴 P0 | 2-3 days | Portal white-label: branded login, sidebar, theme, PDFs |
| 6 | [PHASE-UX-02](PHASE-UX-02-NOTIFICATION-CENTER.md) | 🟡 P1 | 2-3 days | Notification center: real-time in-app, bell icon, notification service |
| 7 | [PHASE-UX-03](PHASE-UX-03-E2E-JOURNEY-VERIFICATION.md) | 🟡 P1 | 2-3 days | E2E journey verification: test all 25+ journeys, fix issues, polish |

**Total Estimated Effort**: 20-28 days  
**Total Tasks**: 61 tasks across 8 phases  
**Total Files**: ~120 files created/modified

---

## Execution Order

```
   ┌───────────────────┐
   │   PHASE-UX-00     │  ← START HERE (no dependencies)
   │   Page Cleanup     │  Fix dead buttons, fake data, clutter
   │   & Simplification │  
   └────────┬──────────┘
            │
   ┌────────┴──────────┐
   │   PHASE-UX-01     │  ← Then this (depends on UX-00)
   │   UX Polish       │  Progress bar, loading states, DataTable
   └────────┬──────────┘
            │
   ┌────────┼───────────────┐
   │        │               │
   ▼        ▼               ▼
┌──────┐ ┌──────┐    ┌──────────┐
│WL-01 │ │DM-01 │    │ These 3   │
│Brand │ │Domain│    │ can run   │
│Found.│ │Overh.│    │ in        │
└──┬───┘ └──┬───┘    │ parallel  │
   │        │        └──────────┘
   ▼        │
┌──────┐    │
│WL-02 │    │
│Email │    │
└──┬───┘    │
   │        │
   ▼        │
┌──────┐    │
│WL-03 │    │
│Portal│    │
└──┬───┘    │
   │        │
   ▼        │
┌──────┐    │
│UX-02 │    │
│Notif.│    │
└──┬───┘    │
   │        │
   └────┬───┘
        │
   ┌────┴──────────┐
   │   PHASE-UX-03  │  ← LAST: E2E verification
   │   Journey Test  │
   └────────────────┘
```

### Execution Rules
1. **PHASE-UX-00 MUST be first** — It fixes broken pages that other phases would build on top of
2. **PHASE-UX-01 MUST come after UX-00** — Loading states and DataTable are for pages cleaned in UX-00
3. **WL-01 and DM-01 can run in parallel** after UX-01
4. **WL-02 requires WL-01** (needs BrandingProvider and agency_branding table)
5. **WL-03 requires WL-01** (needs BrandingProvider)
6. **UX-02 requires WL-02** (needs notification_preferences table)
7. **PHASE-UX-03 MUST be LAST** (it verifies everything else)

---

## Key Decisions & Principles

### 0. No Conflicts, No Breakage
Every phase is designed to be implemented independently in a **new AI session**. The [PHASE-IMPLEMENTATION-CONTRACT.md](PHASE-IMPLEMENTATION-CONTRACT.md) contains rules that prevent:
- Changing function signatures that break other files
- Installing duplicate libraries
- Creating components that already exist
- Using wrong Supabase client patterns
- Putting onClick handlers in server components

### 1. Agency-First Branding
Every customer-facing surface defaults to the agency's brand. "Dramac" only appears in:
- Super Admin dashboard
- `src/lib/constants/platform.ts`
- Platform-level legal/infrastructure

### 2. Graceful Degradation
If an agency hasn't configured branding:
- Use the agency's name (from `agencies` table) as display name
- Use default professional colors (slate/blue)
- Emails use agency name, not "Dramac"
- Never show a broken/empty state

### 3. Performance Budget
- Initial page load: < 2s
- Route transition: < 500ms
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

### 4. Mobile-First
- All new components designed mobile-first
- Dialogs → full-screen on mobile
- Tables → card view on mobile
- Touch targets ≥ 44px
- Swipe gestures for navigation

### 5. Accessibility
- WCAG AA compliance minimum
- Keyboard navigation for all features
- Screen reader support
- `prefers-reduced-motion` respected
- Skip-to-content link

---

## Gap Analysis Summary (Before Implementation)

| Area | Before | After (Target) |
|------|--------|----------------|
| Dead Buttons / Fake Data | 6 broken pages | 0 |
| Button Clutter (site detail) | 13 buttons | 3 + overflow |
| Duplicate Routes | 6+ duplicates | 0 (redirects in place) |
| Client Portal Branding | 0% | 100% |
| Email Branding | 0% | 100% |
| Dashboard Branding | 5% | 95% |
| Published Site Branding | 60% | 100% |
| Embed Widget Branding | 0% | 100% |
| Domain Cascade on Change | 0% | 100% |
| Domain Health Monitoring | 0% | 100% |
| Loading States Coverage | 20% (8/40 routes) | 100% |
| Mobile Dialog Responsiveness | 0% | 100% |
| Notification System | 30% (basic) | 95% (real-time + email) |
| Notification Preferences | 0% | 100% |
| Email Delivery Tracking | 0% | 100% |
| Data Table Consistency | 0% | 60% (5 tables migrated) |
| PDF Generation | 0% (stubs) | 100% |
| Page Header Consistency | 60% | 100% |
| Empty State Consistency | 40% | 100% |

---

## ⚠️ Shared File Conflict Matrix

These files are touched by multiple phases. The execution order prevents conflicts, but AI agents should be aware:

| File | Phases That Touch It | Resolution |
|------|---------------------|------------|
| `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` | UX-00 (buttons), UX-01 (loading), WL-01 (branding) | UX-00 simplifies buttons FIRST → UX-01 adds loading → WL-01 changes title only |
| `src/components/layout/sidebar.tsx` | UX-00 (standardize), WL-01 (branding), WL-03 (portal) | UX-00 cleans up → WL-01 adds logo → WL-03 adds portal variant |
| `src/lib/email/send-email.ts` | WL-02 only | No conflict — only one phase modifies this |
| `src/lib/email/resend-client.ts` | WL-02 only | No conflict |
| `src/middleware.ts` | DM-01 only | No conflict — only one phase modifies middleware |
| `src/app/(dashboard)/layout.tsx` | UX-01 (progress bar), WL-01 (BrandingProvider) | UX-01 adds progress bar → WL-01 wraps children with provider (additive, no conflict) |
| `src/app/(portal)/layout.tsx` | WL-01 (BrandingProvider), WL-03 (portal branding) | WL-01 adds provider → WL-03 adds theme injection (both additive) |
| `src/app/(dashboard)/admin/settings/page.tsx` | UX-00 only | No conflict — only UX-00 fixes this |
| `src/app/(dashboard)/admin/health/page.tsx` | UX-00 only | No conflict |
| `src/app/(dashboard)/dashboard/domains/page.tsx` | UX-00 (duplicate button), DM-01 (real domain manager) | UX-00 removes duplicate → DM-01 rebuilds component (sequential, no conflict) |
| `src/config/admin-navigation.ts` | UX-00 (grouping) | No conflict — only UX-00 |
| `src/components/ui/dialog.tsx` | UX-01 (mobile full-screen) | No conflict — only UX-01 |
| Notification-related files | UX-02, WL-02 (preferences) | WL-02 creates preferences table → UX-02 uses it (dependency enforced) |

### Why This Order Prevents Conflicts
1. **UX-00 goes first**: Cleans up broken pages. No other phase depends on the broken state.
2. **UX-01 goes second**: Adds NEW components (progress bar, DataTable, loading files). Doesn't modify existing logic.
3. **WL-01 after UX-01**: Adds BrandingProvider (wraps existing components, doesn't change them).
4. **WL-02 after WL-01**: Extends email system (adds new parameter to sendEmail, backward compatible).
5. **DM-01 parallel with WL**: Touches completely different files (domains, middleware, DNS).
6. **WL-03 after WL-01**: Uses BrandingProvider that WL-01 created.
7. **UX-02 after WL-02**: Uses notification_preferences table that WL-02 created.
8. **UX-03 last**: Read-only verification pass, only creates a report doc.

---

## Database Migrations Required

| Migration | Phase | Tables |
|-----------|-------|--------|
| `create_agency_branding` | WL-01 | `agency_branding` |
| `notification_preferences` | WL-02 | `notification_preferences` |
| `email_logs` | WL-02 | `email_logs` |
| `domain_redirects` | DM-01 | `domain_redirects` |
| `notifications_enhanced` | UX-02 | `notifications` (enhanced) |

---

## Environment Variables Required

```env
# Domain Configuration (PHASE-DM-01)
NEXT_PUBLIC_PLATFORM_DOMAIN=dramac.app
NEXT_PUBLIC_SITES_DOMAIN=sites.dramac.app

# Email (PHASE-WL-02)
EMAIL_DOMAIN=app.dramacagency.com

# Vercel Domain API (PHASE-DM-01)
VERCEL_API_TOKEN=xxx
VERCEL_PROJECT_ID=xxx

# Resend Webhook (PHASE-WL-02)
RESEND_WEBHOOK_SECRET=xxx
```

---

## How to Use These Phases (Instructions for AI Agents)

Each phase document is designed to be **self-contained and actionable** in an independent AI session. Follow this EXACT process:

### Step 1: Setup (EVERY session)
```
1. Read /memory-bank/projectbrief.md
2. Read /memory-bank/productContext.md
3. Read /memory-bank/systemPatterns.md
4. Read /memory-bank/techContext.md
5. Read /memory-bank/activeContext.md
6. Read /memory-bank/progress.md
7. Read /phases/white-label-ux-domains/PHASE-IMPLEMENTATION-CONTRACT.md
8. Read your assigned phase document
```

### Step 2: Verify Dependencies
- Check the `Dependencies:` line in your phase document
- If it lists other phases, verify they've been implemented:
  - Check if the files/tables/components they create exist
  - If they don't exist → **STOP** and tell the user

### Step 3: Implement Tasks In Order
- Tasks within a phase are numbered and MUST be done in order
- Complete one task fully before starting the next
- After each task, run `pnpm tsc --noEmit` to verify compilation

### Step 4: Test
- Run the Testing Checklist at the bottom of your phase document
- Every checkbox must pass

### Step 5: Update Memory Bank
- Update `memory-bank/activeContext.md` with what was done
- Update `memory-bank/progress.md` with completion status
- Commit: `feat: implement PHASE-XX-YY — [description]`

### What NOT to Do
- ❌ Do NOT implement tasks from OTHER phase documents
- ❌ Do NOT "improve" things not mentioned in your phase — you will create conflicts
- ❌ Do NOT change function signatures without updating all callers
- ❌ Do NOT install new npm packages unless your phase explicitly requires them
- ❌ Do NOT modify `middleware.ts`, `next.config.ts`, or `tailwind.config.ts` unless your phase says to
- ❌ Do NOT assume what other phases will do — only use what currently exists in the codebase

---

## Success Criteria (Post-Implementation)

After all 8 phases are complete:

1. **UX Simplification Test**: Every page has ≤3 visible header buttons + overflow menu. Zero dead buttons. Zero fake data.
2. **White-Label Test**: Create a new agency, configure full branding → login to portal as a client → **zero** "Dramac" references visible
3. **Email Test**: Trigger all 18 email types → every email shows agency branding, every email has unsubscribe link
4. **Domain Test**: Add custom domain → verify DNS → SSL works → change domain → old domain 301 redirects → sitemap/canonical/OG tags all updated
5. **UX Test**: Navigate every route → progress bar shows, loading skeleton appears, no blank screens
6. **Mobile Test**: Complete a full booking flow on 375px screen → everything works, dialogs are full-screen, tables are cards
7. **Notification Test**: Receive a booking → in-app notification appears in real-time → bell icon increments → email arrives (branded)
8. **E2E Test**: Walk all 25+ journeys from USER-JOURNEYS.md → zero failures
9. **No Regression Test**: `pnpm build` passes, zero TypeScript errors, no runtime crashes

# PHASE LAUNCH-00: Master Launch Plan

**Version**: 1.0  
**Created**: February 11, 2026  
**Purpose**: Ensure every user journey works end-to-end with zero mock data, real analytics, and production-ready quality.

---

## Launch Phase Overview

Each phase maps to user journeys from `docs/USER-JOURNEYS.md`. Every phase is **fully independent** and can be run by a different AI in a separate session. Phases that depend on shared infrastructure note the connection points.

### Phase Execution Order (Independent — Can Run In Parallel Where Noted)

| Phase | Name | User Journey Coverage | Dependencies |
|-------|------|----------------------|--------------|
| LAUNCH-01 | Anonymous Visitor & Published Sites | Journey 2.1–2.6 | None |
| LAUNCH-02 | Portal Client Complete Journey | Journey 3.1–3.10 | None |
| LAUNCH-03 | Agency Member & Content Management | Journey 4.1–4.8 | None |
| LAUNCH-04 | Agency Admin & Site Management | Journey 5.1–5.9 | None |
| LAUNCH-05 | Agency Owner & Full Platform | Journey 6.1–6.13 | None |
| LAUNCH-06 | Module Developer Journey | Journey 7.1–7.7 | None |
| LAUNCH-07 | Super Admin & Platform Operations | Journey 8.1–8.9 | None |

### Cross-Journey Lifecycle Phases (Run After Main Phases)

| Phase | Name | User Journey Coverage | Dependencies |
|-------|------|----------------------|--------------|
| LAUNCH-08 | Booking Module E2E Lifecycle | Journey 9.1 + 10.1 | After LAUNCH-01 |
| LAUNCH-09 | E-Commerce Order E2E Lifecycle | Journey 9.2 + 10.3 | After LAUNCH-01 |
| LAUNCH-10 | Module Marketplace E2E Lifecycle | Journey 9.3 | After LAUNCH-06 |
| LAUNCH-11 | Website Creation E2E Lifecycle | Journey 9.4 | After LAUNCH-05 |
| LAUNCH-12 | CRM Module E2E Lifecycle | Journey 6.12 + 10.2 | After LAUNCH-04 |
| LAUNCH-13 | Final Integration & Smoke Test | Journey 9.5–9.6 + All | After ALL |

---

## Shared Rules For All Phases

### 1. TypeScript First
```bash
cd next-platform-dashboard
npx tsc --noEmit --skipLibCheck
# Must be ZERO errors before commit
```

### 2. Zero Mock Data Policy
- **NEVER** use `seededRandom()`, `Math.random()`, or hardcoded fake data
- **ALWAYS** query from Supabase tables
- Show "No data yet" empty states when tables are empty
- Demo/mock data ONLY in Studio editor preview (when `!siteId`)

### 3. Real Analytics Policy
- All charts/metrics must query real database tables
- Use `COUNT(*)`, `SUM()`, `AVG()` aggregations on actual data
- Empty state = show zero values with "No data yet" message
- Never generate fake trends or random numbers

### 4. Currency & Locale
- Import from `@/lib/locale-config` — NEVER hardcode `$`, `USD`, `en-US`
- Use `formatCurrency()` for all money displays
- Use `DEFAULT_TIMEZONE` for all date/time calculations

### 5. Auth Client Pattern
| Context | Client | Why |
|---------|--------|-----|
| Dashboard (logged-in) | `createClient()` | Cookie-auth, RLS enforced |
| Public/subdomain | `createAdminClient()` | No cookies, bypass RLS |
| Webhooks | `createAdminClient()` | Server-to-server, no cookies |
| Forms | `createAdminClient()` | Anonymous visitors |

### 6. Notification Pattern
- In-app: `createNotification()` from `@/lib/services/notifications`
- Email: `sendEmail()` from `@/lib/email/send-email`
- Orchestrator: `business-notifications.ts` handles both
- **NEVER** send email from `createNotification()` (in-app only)

### 7. Commit Protocol
```bash
# After EVERY phase completion:
cd next-platform-dashboard
npx tsc --noEmit --skipLibCheck
# If zero errors:
cd ..
git add -A
git commit -m "feat(LAUNCH-XX): [descriptive message]"
git push
```

### 8. Icon Pattern
- Use `resolveIconName()` from `@/lib/utils/icon-map` for dynamic icons
- Use `strokeWidth={1.5}` for all dynamically rendered Lucide icons
- Never use emoji strings for icons in UI

### 9. No Breaking Changes
- Do NOT rename existing database columns
- Do NOT change existing API response shapes
- Do NOT remove existing exported functions
- Add new functionality alongside existing code

### 10. Independence Protocol
- Each phase reads its own file first
- Each phase lists exact files it will create/modify
- Each phase has its own verification checklist
- Shared connection points are documented at the top of each phase

---

## File Organization

```
phases/launch/
├── PHASE-LAUNCH-00-MASTER-PLAN.md          ← This file
├── PHASE-LAUNCH-01-ANONYMOUS-VISITOR.md     ← Published sites E2E
├── PHASE-LAUNCH-02-PORTAL-CLIENT.md         ← Portal E2E
├── PHASE-LAUNCH-03-AGENCY-MEMBER.md         ← Content management E2E
├── PHASE-LAUNCH-04-AGENCY-ADMIN.md          ← Site & client management E2E
├── PHASE-LAUNCH-05-AGENCY-OWNER.md          ← Full platform owner E2E
├── PHASE-LAUNCH-06-MODULE-DEVELOPER.md      ← Developer journey E2E
├── PHASE-LAUNCH-07-SUPER-ADMIN.md           ← Platform admin E2E
├── PHASE-LAUNCH-08-BOOKING-LIFECYCLE.md     ← Booking cross-journey
├── PHASE-LAUNCH-09-ECOMMERCE-LIFECYCLE.md   ← E-Commerce cross-journey
├── PHASE-LAUNCH-10-MODULE-LIFECYCLE.md      ← Module marketplace cross-journey
├── PHASE-LAUNCH-11-WEBSITE-CREATION.md      ← Website creation cross-journey
├── PHASE-LAUNCH-12-CRM-LIFECYCLE.md         ← CRM cross-journey
└── PHASE-LAUNCH-13-FINAL-INTEGRATION.md     ← Final smoke test
```

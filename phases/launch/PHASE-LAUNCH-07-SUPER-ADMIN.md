# PHASE LAUNCH-07: Super Admin & Platform Operations E2E

**User Journeys Covered**: 8.1 (Platform Overview), 8.2 (Manage Agencies), 8.3 (Manage Users), 8.4 (Manage Modules), 8.5 (Platform Health), 8.6 (Revenue & Billing), 8.7 (Platform Analytics), 8.8 (Audit & Security), 8.9 (Platform Settings)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Admin module management connects with LAUNCH-06 (Developer modules)

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md (Implementation Phases — all completed waves)
memory-bank/systemPatterns.md (Multi-Tenant Hierarchy)
memory-bank/activeContext.md (FIX-02: Admin analytics de-mocked, FIX-03: Admin navigation)
docs/USER-JOURNEYS.md (Section 8 — Super Admin)
```

---

## Context

Super admins (`profiles.role = "super_admin"`) have unrestricted access to the entire DRAMAC platform. They manage agencies, users, modules, billing, analytics, and system health. Entry point: `/admin`.

**Auth**: Standard Supabase login, role checked in admin layout.  
**Data access**: Can see all agencies, all users, all modules — no agency-level RLS filtering.

---

## Task 1: Admin Dashboard (Platform Overview)

### Files to Audit
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/admin/layout.tsx`
- `src/app/(dashboard)/admin/loading.tsx`
- `src/components/admin/admin-sidebar.tsx`
- `src/lib/actions/admin.ts`
- `src/lib/actions/admin-analytics.ts`

### Requirements
1. **Platform statistics**: Total agencies, total users, total modules, total revenue — all from real DB
2. **System health indicators**: Supabase connection status, API response times
3. **Recent activity**: Real recent actions from `activity_log` table (not 3 hardcoded entries)
4. **Alerts & issues**: Real alerts from system logs
5. **Navigation**: All admin sidebar items link correctly (verified in FIX-03)
6. **Role guard**: Only `super_admin` can access `/admin/*` routes
7. **No mock data**: All stats query real tables

### What to Fix
- If platform stats are hardcoded — query real counts from `agencies`, `profiles`, `modules_v2`, subscriptions
- If recent activity shows fake data — query from real `activity_log` (was fixed in deep audit session — verify)
- If health indicators are mocked — implement basic health checks or show real Supabase status
- If role guard is missing — add `profiles.role === 'super_admin'` check in layout
- If sidebar items link to wrong pages — verify all routes

### Verification
```
□ Admin dashboard loads (super_admin only)
□ Agency count is real number from DB
□ User count is real number from DB
□ Module count is real number from DB
□ Recent activity shows real data
□ Non-super-admin gets redirected away
□ All sidebar links work
```

---

## Task 2: Agency Management

### Files to Audit
- `src/app/(dashboard)/admin/agencies/page.tsx`
- `src/app/(dashboard)/admin/agencies/agencies-client.tsx`
- `src/app/(dashboard)/admin/agencies/[agencyId]/page.tsx`
- `src/app/(dashboard)/admin/agencies/analytics/page.tsx`
- Admin agency actions

### Requirements
1. **Agency list**: All agencies with search, filter, sort — from `agencies` table
2. **Agency detail**: Name, owner, plan, sites count, clients count, module installations, billing status
3. **Agency analytics**: Growth metrics (new agencies over time)
4. **Impersonate**: Ability to impersonate agency owner (for debugging)
5. **Suspend/activate**: Toggle agency active status
6. **All data real**: Counts and metrics from real DB queries

### What to Fix
- If agency list is mocked — query from `agencies` table
- If agency detail shows hardcoded info — query real data with joins
- If analytics uses mock trends — query real time-series data
- If impersonation is stubbed — implement or show clear path
- If site/client counts are fake — COUNT from real tables

### Verification
```
□ Agency list shows all real agencies
□ Search/filter works
□ Agency detail shows real data (owner, plan, sites, clients)
□ Agency analytics shows real growth data
□ Impersonation works (or clear status)
□ No mock data anywhere
```

---

## Task 3: User Management

### Files to Audit
- `src/app/(dashboard)/admin/users/page.tsx`
- `src/app/(dashboard)/admin/users/users-client.tsx`
- `src/app/(dashboard)/admin/users/[userId]/page.tsx`
- `src/app/api/make-admin/route.ts`

### Requirements
1. **User list**: All platform users with search by email, name, role
2. **User detail**: Profile info, role, agency membership, login history
3. **Edit role**: Promote/demote user roles
4. **Disable/enable account**: Toggle account active status
5. **Promote to super_admin**: Via `/api/make-admin` endpoint
6. **All data real**: From `profiles` + `agency_members` tables

### What to Fix
- If user list is mocked — query from `profiles` table
- If user detail is incomplete — add joins for agency membership
- If role changes don't save — wire to real DB update
- If login history is mocked — query from auth logs or show "not tracked"
- If disable/enable is stubbed — implement via `profiles` status field

### Verification
```
□ User list shows all real users
□ Search by email/name works
□ User detail shows real profile + agency membership
□ Role change persists
□ Disable/enable account works
□ Promote to super_admin works
```

---

## Task 4: Module Management (Platform-Wide)

### Files to Audit
- `src/app/(dashboard)/admin/modules/page.tsx`
- `src/app/(dashboard)/admin/modules/analytics/page.tsx`
- `src/app/(dashboard)/admin/modules/pricing/page.tsx`
- `src/app/(dashboard)/admin/modules/requests/page.tsx`
- `src/app/(dashboard)/admin/modules/studio/*`
- `src/app/(dashboard)/admin/modules/testing/*`
- `src/app/(dashboard)/admin/modules/[moduleId]/page.tsx`
- `src/components/admin/modules/*`
- Admin module actions

### Requirements
1. **Module list**: All published modules from `modules_v2` table
2. **Module detail**: Install stats, revenue, version history, error logs
3. **Module analytics**: Performance metrics across all modules
4. **Module pricing**: Set wholesale/retail prices, revenue share
5. **Module requests**: View and respond to agency module requests
6. **Module Studio**: Build/edit modules (same as developer studio)
7. **Module testing**: Test management, beta enrollment, test sites
8. **Approve/reject**: Moderate modules for marketplace
9. **Feature/delist**: Highlight or remove modules from marketplace
10. **Module icons**: Lucide via `resolveIconName()` (not emoji)

### What to Fix
- If module list shows mock modules — query from `modules_v2`
- If install stats are fake — COUNT from `agency_module_subscriptions`
- If revenue is mocked — query from real payment data
- If pricing management doesn't save — wire to real DB update
- If requests page is stubbed — wire to `module_requests` table
- If testing page is mocked — wire to `module_test_runs` table
- If icons show emoji — use `resolveIconName()`

### Verification
```
□ Module list shows real modules
□ Module detail shows real stats
□ Analytics shows real metrics
□ Pricing changes save to DB
□ Module requests visible and actionable
□ Module Studio works
□ Icons are Lucide SVGs
□ No mock data anywhere
```

---

## Task 5: Platform Health Monitoring

### Files to Audit
- `src/app/(dashboard)/admin/health/page.tsx`
- `src/app/api/health/route.ts`
- Health check components

### Requirements
1. **Supabase connection**: Check if database is reachable
2. **API response times**: Basic latency measurement
3. **Error rates**: Recent errors from `module_error_logs` or application logs
4. **Database size**: From Supabase or estimated
5. **External services**: Paddle, Resend, Anthropic — basic ping/status
6. **Real-time indicators**: Green/yellow/red status badges
7. **No mock health data**: All checks are real

### What to Fix
- If health page is fully mocked — implement basic health checks
- If Supabase check doesn't work — test basic query
- If external service checks are fake — implement basic HTTP pings or show "not monitored"
- If error rates are mocked — count from real error tables

### Verification
```
□ Health page loads with real status indicators
□ Supabase connection check works
□ Error count shows real numbers
□ Status badges are meaningful (not all green when there are issues)
```

---

## Task 6: Revenue & Billing (Platform-Level)

### Files to Audit
- `src/app/(dashboard)/admin/billing/page.tsx`
- `src/app/(dashboard)/admin/billing/revenue/page.tsx`
- `src/app/(dashboard)/admin/subscriptions/page.tsx`
- Admin billing actions

### Requirements
1. **Revenue dashboard**: MRR, ARR, churn rate — from real subscription data
2. **Revenue by plan**: Breakdown by subscription tier
3. **Revenue by module**: Module marketplace revenue share
4. **Payment provider breakdown**: Revenue per payment provider
5. **Subscription management**: Active subscriptions, trials, churned
6. **Revenue forecasts**: Based on current MRR trend (real calculation, not mock)
7. **All amounts in ZMW**: `formatCurrency()` from locale-config

### What to Fix
- If revenue metrics are mocked — query from `subscriptions` and payment tables
- If MRR/ARR calculations are fake — calculate from real active subscriptions
- If churn is hardcoded — calculate from cancellation data
- If amounts show `$` — change to `formatCurrency()`
- If subscription list is mocked — query from `subscriptions` table

### Verification
```
□ Revenue dashboard shows real calculations
□ MRR from real subscription data
□ Subscription list shows real subscriptions
□ All amounts in ZMW
□ Churn rate calculated correctly
□ No mock revenue data
```

---

## Task 7: Platform Analytics

### Files to Audit
- `src/app/(dashboard)/admin/analytics/page.tsx`
- `src/lib/actions/admin-analytics.ts`
- Analytics chart components

### Requirements
1. **User growth**: Signups over time from `profiles` table
2. **Agency growth**: New agencies over time from `agencies` table
3. **Module adoption**: Install trends from `agency_module_subscriptions`
4. **Site creation**: New sites over time from `sites` table
5. **Geographic distribution**: If captured, from user/agency data
6. **Charts**: All use Recharts with real data
7. **Date range filtering**: Works with real queries

### What to Fix
- If any analytics use `seededRandom()` — replace with real DB queries
- If growth trends are mocked — query with date grouping
- If charts show hardcoded data — wire to real queries
- If date range doesn't work — implement date filtering

### Verification
```
□ User growth chart shows real signup trend
□ Agency growth chart shows real data
□ Module adoption shows real install trends
□ Site creation trend is real
□ Date range filtering works
□ All charts render (even with zero data)
□ No seededRandom anywhere
```

---

## Task 8: Audit & Activity

### Files to Audit
- `src/app/(dashboard)/admin/audit/page.tsx`
- `src/app/(dashboard)/admin/activity/page.tsx`
- `src/lib/actions/admin.ts`
- `src/lib/services/activity.ts`

### Requirements
1. **Audit log**: All platform actions from `activity_log` table
2. **Filter**: By user, action type, date range
3. **Activity feed**: Real-time platform activity
4. **Export**: Export audit data to CSV
5. **All data real**: No hardcoded fake entries

### What to Fix
- If audit log shows fake entries — query from real `activity_log`
- If filtering doesn't work — implement date/user/type filtering
- If export is stubbed — implement CSV generation
- If activity feed is mocked — query real recent activities

### Verification
```
□ Audit log shows real actions
□ Filtering works (date, user, type)
□ Activity feed shows real recent activity
□ Export produces real CSV
□ No fake audit entries
```

---

## Task 9: Platform Settings

### Files to Audit
- `src/app/(dashboard)/admin/settings/page.tsx`
- `src/app/(dashboard)/admin/settings/settings-client.tsx`
- `src/app/(dashboard)/admin/settings/actions.ts`

### Requirements
1. **Default settings**: Platform-wide defaults (configured in FIX-02 → informational cards)
2. **Feature flags**: If implemented, toggle features on/off
3. **Email templates**: View/manage email template settings
4. **Module submission rules**: Configure rules for module submissions
5. **Pricing tiers**: Configure plan tiers and pricing
6. **Settings save**: All changes persist to `admin_settings` table
7. **Clear UI**: If a setting isn't controllable here, show informational card with link to appropriate service (Supabase, Paddle, etc.)

### What to Fix
- If settings page is blank — populate with real admin settings
- If settings don't save — wire to real DB operations (migration: `20260210_admin_settings.sql`)
- If grayed-out sections remain — replace with informational cards (was done in FIX-02/FIX-05)

### Verification
```
□ Admin settings page loads without errors
□ Settings that save → Persist to DB
□ Informational cards link to correct external services
□ No grayed-out/disabled controls
□ No mock settings
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 9 tasks verified
□ Admin dashboard shows real platform stats
□ Agency management fully works
□ User management fully works
□ Module management fully works
□ Health monitoring shows real status
□ Revenue shows real financial data
□ Platform analytics shows real trends
□ Audit log shows real actions
□ Settings work correctly
□ Only super_admin can access admin pages
□ All currency in ZMW format
□ No mock/seededRandom data anywhere
```

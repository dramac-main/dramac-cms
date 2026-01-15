# Phase 46: CRITICAL REMEDIATION - Master Plan

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **Purpose**: This document identifies all gaps, broken features, and missing functionality discovered after completing Phases 1-40. It serves as the roadmap for the remediation phases that follow.

---

## 🚨 CRITICAL ISSUES SUMMARY

After thorough analysis of the codebase, the following **critical issues** were identified:

### Category A: Show-Stoppers (Platform Unusable)

| # | Issue | Impact | Root Cause |
|---|-------|--------|------------|
| A1 | RLS disabled for auth to work | Security vulnerability | Misconfigured RLS policies conflicting with auth flow |
| A2 | Cannot view/delete created sites | Core feature broken | Missing site detail page routes, RLS blocking queries |
| A3 | Create site shows "already exists" | User experience broken | Error handling not resetting state, stale form data |
| A4 | Visual Editor barely functional | Core feature broken | Incomplete Craft.js integration, missing component settings |
| A5 | AI Builder has no working UI | Core feature missing | Only API exists, no connected frontend builder flow |

### Category B: Major Missing Features

| # | Issue | Impact | Status |
|---|-------|--------|--------|
| B1 | No Billing/Payment system UI | Cannot monetize | Components exist but no pages |
| B2 | No Marketplace UI visible | Cannot sell modules | Page exists but not linked properly |
| B3 | No Settings page | Cannot configure | Only .gitkeep placeholder |
| B4 | No Help/Support system | No user assistance | Not implemented |
| B5 | No Profile/Account settings | Cannot manage account | Not implemented |
| B6 | No Notifications system | No user communication | Not implemented |
| B7 | No Team/User management | Multi-user broken | Basic structure only |
| B8 | No Super Admin functionality | Cannot manage platform | Role exists, no UI/permissions |
| B9 | No Client Impersonation | Cannot assist clients | Not implemented |
| B10 | No Agency portal distinction | Confusing UX | Single signup flow, no role selection |

### Category C: Integration Issues

| # | Issue | Impact | Notes |
|---|-------|--------|-------|
| C1 | Stripe not suitable for Zambia | Cannot accept payments | Need Flutterwave/DPO/LemonSqueezy |
| C2 | Module subscription flow incomplete | Modules don't work | Database tables exist, no end-to-end flow |
| C3 | Site publishing doesn't work | Core feature broken | Missing revalidation, domain setup |
| C4 | AI generation not connected | AI useless | API works, no UI flow to use it |

---

## 📊 DETAILED ANALYSIS

### 1. Database & RLS Issues

**Current State:**
- RLS was disabled to make auth work (MAJOR SECURITY ISSUE)
- Profiles table RLS conflicts with signup flow
- Agency creation during signup fails silently with RLS enabled

**Root Cause:**
The RLS policies were written incorrectly. The `profiles` table requires the user to exist before applying policies, but signup creates the profile record during the auth flow when the user doesn't have a session yet.

**Solution:**
```sql
-- Service role should create profile, not anon
-- Use Supabase Edge Function or API route with service_role key
```

### 2. Site Management Issues

**What's Missing:**
- `/dashboard/sites` page - only `.gitkeep` exists
- `/dashboard/sites/[siteId]` pages - only builder subfolder
- Sites grid exists but no parent page renders it
- Delete action exists but UI doesn't work

**Files That Exist but Aren't Used:**
- `src/components/sites/sites-grid.tsx` ✅
- `src/components/sites/site-danger-zone.tsx` ✅
- `src/components/sites/create-site-dialog.tsx` ✅
- `src/lib/actions/sites.ts` ✅ (has delete, update, publish)

**What's Needed:**
- Create `/dashboard/sites/page.tsx`
- Create `/dashboard/sites/[siteId]/page.tsx`
- Fix routing and navigation

### 3. Visual Editor Issues

**Current State:**
The editor has:
- Basic wrapper component ✅
- Craft.js integration ✅
- Toolbox ✅
- Canvas ✅
- Settings panel ✅

**What's Broken:**
- User components incomplete
- Settings panels for components missing/broken
- Drag-drop not working properly
- Save not persisting correctly
- Component resolver missing many components

### 4. Missing Pages Analysis

| Route | Expected | Actual |
|-------|----------|--------|
| `/dashboard/sites` | Sites list | `.gitkeep` only |
| `/dashboard/sites/[siteId]` | Site detail | Only `/builder` subfolder |
| `/dashboard/clients` | Client list | `.gitkeep` only |
| `/dashboard/clients/[clientId]` | Client detail | Not exists |
| `/dashboard/billing` | Billing page | `.gitkeep` only |
| `/dashboard/settings` | Settings | `.gitkeep` only |
| `/dashboard/settings/modules` | My modules | `.gitkeep` only |
| `/dashboard/settings/billing` | Billing settings | `.gitkeep` only |
| `/marketplace` | Module marketplace | Page exists ✅ |
| `/profile` | User profile | Not exists |
| `/admin` | Super admin | Not exists |

### 5. User Roles Analysis

**Defined Roles:**
- `super_admin` - Platform owner (site-wide admin)
- `admin` - Agency admin
- `member` - Agency team member
- `owner` - Agency owner (in agency_members)

**What Each Role Should Do:**

| Role | Capabilities |
|------|-------------|
| `super_admin` | Manage ALL agencies, view platform analytics, manage modules, manage billing plans, impersonate users |
| `owner` | Full agency control, billing, team management, client management |
| `admin` | Client management, site management, editor access |
| `member` | View-only or limited edit (configurable) |

**Current State:**
- Roles are stored but never checked
- No role-based UI rendering
- No admin panel
- No permission middleware

### 6. Billing/Payment Analysis

**What Was Planned (Stripe):**
- Seat-based billing ($19-29/client/month)
- Module subscriptions
- Usage tracking

**Problem:**
Stripe is not available in Zambia. Alternative payment processors needed:
- **LemonSqueezy** - Modern, Stripe-like, Africa support
- **Flutterwave** - African payments specialist
- **DPO Group** - Zambia-specific processor

**What Exists:**
- Database tables for billing ✅
- API routes for Stripe webhooks (useless)
- Components for displaying billing info ✅
- No actual payment flow UI

### 7. AI Builder Analysis

**What Exists:**
- `POST /api/ai/generate` - Generates website JSON
- `POST /api/ai/regenerate-section` - Regenerates sections
- `src/lib/ai/` - Converters, templates, generators
- `src/components/ai-builder/` - UI components

**What's Missing:**
- Page to USE the AI builder (`/sites/[siteId]/builder` doesn't exist properly)
- Flow: Business description → AI generates → User reviews → Apply to site
- Template selection UI
- Industry picker UI
- Progress indication

---

## 🛠️ REMEDIATION PHASES

The following NEW phases will fix all identified issues:

### Phase 46: Database & RLS Fix (This Document + Implementation)
- Fix RLS policies properly
- Create service role functions for auth
- Test all CRUD operations with RLS enabled

### Phase 47: Site Management Complete
- Create all missing site pages
- Fix site CRUD operations
- Add site detail tabs (Overview, Pages, Settings, Modules, Danger Zone)
- Fix create site flow
- Implement site delete functionality

### Phase 48: Client Management Complete
- Create all missing client pages
- Client detail page with tabs
- Client impersonation
- Client portal access toggle

### Phase 49: Visual Editor Overhaul
- Fix all component settings panels
- Add missing components
- Fix drag-drop functionality
- Proper save/load flow
- Undo/redo working
- Preview mode

### Phase 50: AI Builder Integration
- Create builder page flow
- Connect API to UI
- Industry/template selection
- Progress tracking
- Apply generated content to editor

### Phase 51: Settings & Profile
- Agency settings page
- User profile page
- Account settings
- Team management
- Notification preferences

### Phase 52: Admin & Roles
- Super admin dashboard
- Role-based permissions
- User impersonation
- Platform analytics
- Module management (admin)

### Phase 53: Alternative Payment Integration
- Remove Stripe dependency
- Implement LemonSqueezy OR Flutterwave
- Seat-based billing flow
- Module purchase flow
- Invoice management

### Phase 54: Notifications & Communication
- Email notification system
- In-app notifications
- Activity feed
- Client communication portal

### Phase 55: Production Polish & Launch
- Comprehensive testing
- Error handling audit
- Performance optimization
- Security audit
- Launch checklist completion

---

## 📁 FILES TO CREATE/MODIFY

### New Files Needed:
```
src/app/(dashboard)/sites/page.tsx
src/app/(dashboard)/sites/[siteId]/page.tsx
src/app/(dashboard)/sites/[siteId]/pages/page.tsx
src/app/(dashboard)/sites/[siteId]/settings/page.tsx
src/app/(dashboard)/sites/[siteId]/modules/page.tsx
src/app/(dashboard)/clients/page.tsx
src/app/(dashboard)/clients/[clientId]/page.tsx
src/app/(dashboard)/clients/[clientId]/edit/page.tsx
src/app/(dashboard)/settings/page.tsx
src/app/(dashboard)/settings/profile/page.tsx
src/app/(dashboard)/settings/team/page.tsx
src/app/(dashboard)/settings/billing/page.tsx
src/app/(dashboard)/settings/notifications/page.tsx
src/app/(dashboard)/billing/page.tsx
src/app/(dashboard)/support/page.tsx
src/app/(admin)/layout.tsx
src/app/(admin)/page.tsx
src/app/(admin)/users/page.tsx
src/app/(admin)/agencies/page.tsx
src/app/(admin)/modules/page.tsx
src/app/(admin)/analytics/page.tsx
src/components/settings/*
src/components/admin/*
src/components/notifications/*
src/lib/payments/lemonsqueezy.ts (or flutterwave.ts)
src/lib/permissions.ts
src/middleware/role-guard.ts
```

### Files to Modify:
```
src/middleware.ts - Add role checks
src/config/navigation.ts - Fix navigation links
src/components/layout/sidebar.tsx - Role-based menu items
src/lib/supabase/server.ts - Add service role client
All RLS policies in migrations/
```

---

## ⏰ ESTIMATED EFFORT

| Phase | Effort | Priority |
|-------|--------|----------|
| 46 - Database Fix | 2 hours | 🔴 CRITICAL |
| 47 - Site Management | 4 hours | 🔴 CRITICAL |
| 48 - Client Management | 3 hours | 🔴 CRITICAL |
| 49 - Editor Overhaul | 8 hours | 🔴 CRITICAL |
| 50 - AI Builder | 4 hours | 🟡 HIGH |
| 51 - Settings/Profile | 4 hours | 🟡 HIGH |
| 52 - Admin/Roles | 4 hours | 🟡 HIGH |
| 53 - Payments | 6 hours | 🔴 CRITICAL |
| 54 - Notifications | 4 hours | 🟢 MEDIUM |
| 55 - Launch Polish | 4 hours | 🟡 HIGH |

**Total: ~43 hours of implementation**

---

## ✅ SUCCESS CRITERIA

The platform will be considered "complete" when:

1. [ ] User can sign up as Agency owner
2. [ ] RLS is ENABLED and all operations work
3. [ ] User can create, view, edit, delete Clients
4. [ ] User can create, view, edit, delete Sites
5. [ ] User can access Visual Editor and build pages
6. [ ] User can use AI to generate website content
7. [ ] User can publish sites and view them on subdomain
8. [ ] User can manage their profile and settings
9. [ ] User can manage team members
10. [ ] User can purchase and manage modules
11. [ ] User can manage billing (with African payment processor)
12. [ ] Super admin can manage the platform
13. [ ] Notifications work for key events
14. [ ] All pages load without errors
15. [ ] Mobile responsive throughout

---

**Next Step**: Proceed to Phase 47 for Site Management implementation.

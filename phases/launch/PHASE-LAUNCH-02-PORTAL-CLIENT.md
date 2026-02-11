# PHASE LAUNCH-02: Portal Client Complete Journey E2E

**User Journeys Covered**: 3.1 (Login & Dashboard), 3.2 (Sites), 3.3 (Analytics), 3.4 (Blog), 3.5 (Apps), 3.6 (Invoices), 3.7 (Support), 3.8 (Media), 3.9 (SEO), 3.10 (Notifications & Settings)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Portal branding shares SSR pattern with LAUNCH-05 (Agency Owner branding settings)

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md (Email & Notification Pattern, Auth Client Pattern)
memory-bank/activeContext.md (FIX-08: Portal Branding Flash section)
docs/USER-JOURNEYS.md (Section 3 — Portal Client)
```

---

## Context

Portal clients are customers of agencies who have been granted portal access (`has_portal_access = true`). They login at `/portal/login` and access their assigned sites, analytics, blog, support, and invoices.

**Auth**: Separate from dashboard login. Linked via `clients.portal_user_id` → `auth.users`.  
**Permissions**: Controlled per-client: `can_edit_content`, `can_view_analytics`, `can_view_invoices`, `has_portal_access`.  
**Per-site permissions**: `client_site_permissions` table: `can_view`, `can_edit_content`, `can_publish`, `can_view_analytics`.  
**Branding**: Portal uses agency branding (SSR injection via `ServerBrandingStyle` — fixed in FIX-08).

---

## Task 1: Portal Login & Authentication

### Files to Audit
- `src/app/portal/login/page.tsx`
- `src/app/portal/layout.tsx`
- `src/app/portal/verify/page.tsx`
- `src/middleware.ts` (portal route handling)

### Requirements
1. **Login page**: Email + password login, styled with agency branding
2. **Magic link option**: Portal clients can login via magic link email
3. **Session management**: Supabase session created, portal routes protected
4. **Redirect after login**: Goes to `/portal` dashboard
5. **Branding on login**: `ServerBrandingStyle` renders agency colors from SSR (no flash)
6. **Failed login**: Shows clear error message (not generic "Something went wrong")
7. **Middleware**: Portal routes (`/portal/*`) are protected — unauthenticated users redirected to `/portal/login`

### What to Fix
- If login error messages are generic — make them user-friendly ("Invalid email or password")
- If magic link email is not sent — wire to Resend via Supabase SMTP
- If session doesn't persist — check Supabase SSR cookie handling
- If middleware doesn't protect portal routes — add portal route check
- Ensure portal login page has proper meta tags (title: "Client Portal Login")

### Verification
```
□ Visit /portal/login → Login page with agency branding (no flash)
□ Login with valid credentials → Redirected to /portal
□ Login with invalid credentials → Error message shown
□ Visit /portal without login → Redirected to /portal/login
□ Logout → Session cleared, redirected to /portal/login
```

---

## Task 2: Portal Dashboard

### Files to Audit
- `src/app/portal/page.tsx`
- `src/components/portal/portal-layout-client.tsx`
- Portal dashboard components

### Requirements
1. **Site overview cards**: Shows sites assigned to this client (filtered by `client_site_permissions`)
2. **Recent notifications**: Shows in-app notifications for this client
3. **Quick stats**: If `can_view_analytics`, show page views, visitors
4. **Action shortcuts**: Quick links to common tasks
5. **Welcome message**: Personalized with client name
6. **Empty state**: If no sites assigned, show helpful message
7. **All data real**: Query from DB, no mock/random data

### What to Fix
- If dashboard shows hardcoded/mock stats — replace with real DB queries
- If sites aren't filtered by client permissions — add permission filter
- If notifications are mocked — query from `notifications` table
- If welcome doesn't show real name — fetch from `clients` table

### Verification
```
□ Portal dashboard shows real assigned sites
□ Stats show real data (or zeros with empty state)
□ Notifications are real (or "No notifications" empty state)
□ Client name appears in welcome
□ No mock/random data anywhere
```

---

## Task 3: Portal Sites Management

### Files to Audit
- `src/app/portal/sites/page.tsx`
- `src/app/portal/sites/[siteId]/page.tsx`
- Portal site permission checks

### Requirements
1. **Site list**: Only shows sites with `can_view = true` in `client_site_permissions`
2. **Site detail**: Shows site info, status, domain
3. **Content editing**: If `can_edit_content = true`, allow editing
4. **Analytics tab**: If `can_view_analytics = true`, show analytics
5. **Publish**: If `can_publish = true`, allow publishing
6. **Permission-gated UI**: Hide tabs/buttons client doesn't have access to

### What to Fix
- If all sites show regardless of permissions — add permission filter
- If analytics tab shows without permission — add permission check
- If editing allowed without permission — add permission guard
- If site status is hardcoded — fetch from real `sites` table

### Verification
```
□ Only permitted sites appear in list
□ Site detail shows real data
□ Tabs/buttons hidden based on permissions
□ Analytics only shows if can_view_analytics
□ Edit only available if can_edit_content
```

---

## Task 4: Portal Analytics

### Files to Audit
- `src/app/portal/analytics/page.tsx`
- `src/lib/actions/site-analytics.ts`
- `src/lib/portal/portal-service.ts` (or equivalent)

### Requirements
1. **Permission check**: Only accessible if `can_view_analytics = true`
2. **Real data**: Page views, unique visitors, traffic sources — all from real DB
3. **Date range filtering**: Works with real data
4. **Per-site filtering**: Shows analytics for assigned sites only
5. **Charts**: Use Recharts with real data (no mock/seededRandom)
6. **Empty state**: "No analytics data yet" when empty

### What to Fix
- If analytics uses `seededRandom()` or hash-based fake data — replace with real queries
- If portal analytics service returns mock data — rewrite with real Supabase queries
- If date range filter doesn't work — implement real date filtering
- If charts show hardcoded trends — use real time-series data

### Verification
```
□ Portal analytics shows real data (or zeros)
□ Date range filter works
□ Only shows data for permitted sites
□ No seededRandom or mock data
□ Charts render correctly (even with zero data)
```

---

## Task 5: Portal Blog Management

### Files to Audit
- `src/app/portal/blog/page.tsx`
- `src/app/portal/blog/[siteId]/page.tsx`
- Blog editing components used in portal

### Requirements
1. **Permission check**: Only if `can_edit_content = true`
2. **Blog list**: Shows posts for assigned sites
3. **Create post**: TipTap editor, featured image, category, SEO fields
4. **Edit post**: Same editor with existing data
5. **Draft/Publish**: Save as draft or publish immediately
6. **Categories**: Manage categories for the site
7. **Real data**: All posts from `blog_posts` table

### What to Fix
- If blog page shows mock posts — query real `blog_posts`
- If create/edit doesn't save — wire to real server action
- If categories are hardcoded — query from `blog_categories`
- If TipTap content doesn't save — ensure JSON is stored correctly
- Add permission check at page level

### Verification
```
□ Blog page shows real posts (or "No posts" empty state)
□ Create new post → Saved to DB
□ Edit post → Changes persisted
□ Categories work
□ Permission check blocks unauthorized access
```

---

## Task 6: Portal Apps / Modules

### Files to Audit
- `src/app/portal/apps/page.tsx`
- `src/app/portal/apps/browse/page.tsx`
- `src/app/portal/apps/[slug]/page.tsx`
- `src/components/portal/apps/app-launcher.tsx`
- `src/components/portal/apps/app-card.tsx`
- `src/components/portal/apps/available-apps-grid.tsx`
- `src/components/portal/apps/request-app-dialog.tsx`
- `src/app/api/portal/modules/request/route.ts` (or equivalent)

### Requirements
1. **Installed apps**: Shows modules installed on client's sites
2. **Browse apps**: Shows available modules from marketplace
3. **App detail**: Module description, screenshots, features
4. **Request app**: Client can request a module from agency
5. **Module icons**: Use Lucide icons via `resolveIconName()`, not emoji
6. **Real data**: From `site_module_installations` and `modules_v2` tables

### What to Fix
- If app list is hardcoded — query from DB
- If request doesn't save — wire to server action that creates module request
- If icons show emoji — use `resolveIconName()` pattern
- If browse page shows all modules regardless of availability — filter properly

### Verification
```
□ Installed apps show real installed modules
□ Browse shows available modules from marketplace
□ Request dialog saves to DB
□ Icons render as Lucide SVGs (not emoji)
□ Empty state shows when no apps installed
```

---

## Task 7: Portal Invoices

### Files to Audit
- `src/app/portal/invoices/page.tsx`
- Invoice-related server actions

### Requirements
1. **Permission check**: Only if `can_view_invoices = true`
2. **Invoice list**: Real invoices from billing tables
3. **Invoice detail**: Amount, date, status, line items
4. **Download PDF**: PDF generation works (or link to external invoice)
5. **Payment status**: Shows paid/unpaid/overdue
6. **Currency**: All amounts in `formatCurrency()` from locale-config

### What to Fix
- If invoices are mocked — query from real billing/invoice tables
- If amounts show `$` — change to `formatCurrency()`
- If PDF download is stubbed — implement or link to payment provider invoice
- Add permission check at page level

### Verification
```
□ Invoice list shows real data (or "No invoices" empty state)
□ Amounts in ZMW format
□ Permission check works
□ PDF download works (or helpful message)
```

---

## Task 8: Portal Support Tickets

### Files to Audit
- `src/app/portal/support/page.tsx`
- `src/app/portal/support/new/page.tsx`
- `src/app/portal/support/[ticketId]/page.tsx`
- Support ticket server actions

### Requirements
1. **Ticket list**: Shows client's support tickets from DB
2. **Create ticket**: Subject, description, priority, attachments
3. **Ticket thread**: Client and agency replies in conversation view
4. **Status tracking**: Open, in-progress, resolved, closed
5. **File attachments**: Upload files to ticket
6. **Real data**: All from `support_tickets` table (or equivalent)
7. **Empty state**: "No support tickets" when empty

### What to Fix
- If ticket creation doesn't save — wire to real server action with DB insert
- If ticket thread is mocked — query real replies
- If status updates don't work — wire to real update action
- If file upload is stubbed — implement via Supabase Storage or skip gracefully
- If support_tickets table doesn't exist — create migration

### Verification
```
□ Create ticket → Saved to DB
□ View ticket → Shows conversation thread
□ Reply to ticket → Reply saved
□ Status shows correctly
□ Empty state shows when no tickets
```

---

## Task 9: Portal Media, SEO, Domains, Submissions, Email

### Files to Audit
- `src/app/portal/media/page.tsx`
- `src/app/portal/seo/page.tsx`
- `src/app/portal/seo/[siteId]/page.tsx`
- `src/app/portal/domains/page.tsx`
- `src/app/portal/submissions/page.tsx`
- `src/app/portal/email/page.tsx`

### Requirements
1. **Media**: View/upload media for assigned sites (permission-gated)
2. **SEO**: View/edit SEO settings if `can_edit_content` (per-page meta tags, OG settings)
3. **Domains**: View domain information for assigned sites (read-only for clients)
4. **Submissions**: View form submissions for assigned sites
5. **Email**: Email settings/preferences
6. **All data real**: No mock data anywhere

### What to Fix
- If any of these pages show mock data — replace with real queries
- If media upload doesn't work — wire to Supabase Storage
- If SEO changes don't save — wire to real server action
- If submissions are mocked — query from `form_submissions` table
- Add permission checks where needed

### Verification
```
□ Media library shows real files (or empty state)
□ SEO settings save correctly
□ Domains show real domain info
□ Submissions show real form data
□ Email preferences save correctly
```

---

## Task 10: Portal Notifications & Settings

### Files to Audit
- `src/app/portal/notifications/page.tsx`
- `src/app/portal/settings/page.tsx`
- `src/components/notifications/notification-bell.tsx` (portal variant)
- `src/components/notifications/notification-center.tsx`

### Requirements
1. **Notification feed**: Shows real in-app notifications from `notifications` table
2. **Mark as read**: Clicking notification marks it as read
3. **Settings**: Profile (name, email), password change, notification preferences
4. **Password change**: Works via Supabase Auth
5. **Notification preferences**: Saved to DB (not just localStorage)
6. **No hardcoded notifications**: All from real DB

### What to Fix
- If notifications are mocked — query from `notifications` table
- If mark-as-read doesn't work — update notification record in DB
- If password change is stubbed — wire to Supabase `updateUser()`
- If notification preferences don't persist — save to DB

### Verification
```
□ Notifications show real data (or "No notifications")
□ Mark as read works
□ Profile edit saves correctly
□ Password change works
□ Notification preferences persist across sessions
```

---

## Summary: Files to Create/Modify

### Potential New Files
- `migrations/20260211_support_tickets.sql` — If support_tickets table doesn't exist

### Files to Modify (potential)
- All portal page files listed above
- Portal service/action files
- Portal component files

### Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 10 tasks verified
□ Portal login works with branding (no flash)
□ All permissions enforced correctly
□ All data is real (no mock/random)
□ All currency in ZMW format
□ Empty states show correctly
□ Notifications work
□ Support tickets work
```

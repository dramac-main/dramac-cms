# PHASE LAUNCH-03: Agency Member & Content Management E2E

**User Journeys Covered**: 4.1 (Signup & Onboarding), 4.2 (Dashboard), 4.3 (Edit Site), 4.4 (Blog Posts), 4.5 (View Clients), 4.6 (Form Submissions), 4.7 (Notifications), 4.8 (Personal Settings)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Dashboard layout shared with LAUNCH-04 and LAUNCH-05

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md (Code Patterns section, Multi-Tenant Hierarchy)
memory-bank/activeContext.md (FIX-05: Branding SSR section)
docs/USER-JOURNEYS.md (Section 4 — Agency Member)
```

---

## Context

Agency members are team members invited by an agency owner/admin with `role = "member"`. They have limited permissions: can view clients (read-only), edit assigned sites/content, view analytics, and manage blog posts. Cannot manage billing, team, modules, or delete anything.

**Auth**: Standard Supabase login at `/login`.  
**Permission derivation**: `profiles.role` + `agency_members.role = "member"`.  
**Data access**: All through `createClient()` (cookie-auth) with RLS enforcing agency isolation.

---

## Task 1: Signup & Onboarding Flow

### Files to Audit
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/onboarding/page.tsx`
- `src/lib/actions/auth.ts`
- `src/lib/actions/onboarding.ts`
- `src/middleware.ts` (onboarding redirect)

### Requirements
1. **Team invite flow**: Member receives invite email → clicks link → signup/login page
2. **Account creation**: Email + password via Supabase Auth
3. **Onboarding wizard**: Profile setup (name, avatar), goal selection, industry selection
4. **Onboarding persistence**: Saves to `profiles` table, marks onboarding complete
5. **Redirect logic**: Middleware redirects to `/onboarding` if not completed, then to `/dashboard`
6. **No mock onboarding data**: All saves are real DB operations

### What to Fix
- If invite link doesn't work — verify email template and link format
- If onboarding doesn't save — wire to real Supabase insert/update
- If middleware doesn't redirect properly — check onboarding completion flag
- If avatar upload doesn't work — wire to Supabase Storage
- Ensure onboarding data is saved atomically (not partial)

### Verification
```
□ Signup creates account in Supabase Auth
□ Onboarding wizard steps all work
□ Profile data saved to DB
□ After onboarding → redirected to /dashboard
□ Revisiting /onboarding after completion → redirected to /dashboard
```

---

## Task 2: Dashboard Home

### Files to Audit
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/dashboard/dashboard-client.tsx`
- `src/components/dashboard/welcome-card.tsx`
- `src/components/activity/activity-feed.tsx`
- `src/lib/actions/dashboard.ts`

### Requirements
1. **Welcome card**: Shows real user name, time-of-day greeting with Lucide icons (not emoji)
2. **Assigned sites**: Shows sites the member has access to
3. **Activity feed**: Real recent activity from `activity_log` table (not mock)
4. **Notifications**: Real notification count from `notifications` table
5. **Quick stats**: Real numbers (sites count, pages count, recent submissions)
6. **Quick actions**: Links to common tasks (edit site, view blog, etc.)

### What to Fix
- If welcome card shows "User" — fetch real profile name
- If activity feed is mocked — query real `activity_log` table
- If stats are hardcoded — query real counts
- If quick actions link to wrong routes — fix paths
- Ensure all icons are Lucide (not emoji)

### Verification
```
□ Dashboard loads with real user name
□ Activity feed shows real activities (or "No recent activity")
□ Stats show real numbers (or zeros)
□ Quick action links work
□ Time-of-day icon correct (Sunrise/Sun/Sunset/Moon)
```

---

## Task 3: Site Editing & Studio

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/pages/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/pages/[pageId]/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/pages/new/page.tsx`
- `src/app/studio/[siteId]/[pageId]/page.tsx`
- `src/lib/actions/pages.ts`
- `src/lib/actions/sites.ts`

### Requirements
1. **Site overview**: Shows site details, stats, installed modules
2. **Page list**: All pages for the site from `pages` table
3. **Create page**: New page with title, slug, template selection
4. **Edit page settings**: Title, slug, SEO metadata
5. **Studio editor**: Full-screen visual editor works (drag & drop components)
6. **Studio save**: Saves page content as JSON to `pages` table
7. **Studio preview**: Mobile/tablet/desktop preview modes work
8. **Studio AI**: Per-component AI suggestions work
9. **Undo/Redo**: Works in Studio
10. **Member permission**: Members CAN edit sites but CANNOT delete them

### What to Fix
- If page list shows mock data — query from `pages` table
- If create page doesn't save — wire to real server action
- If Studio doesn't save — verify save action writes JSON to DB
- If Studio preview is broken — check StudioRenderer light-mode isolation
- If member can delete site — add permission check
- Ensure page slugs are unique per site

### Verification
```
□ Site overview shows real data
□ Page list shows real pages (or "No pages" empty state)
□ Create new page → Saved to DB
□ Studio editor opens in full-screen
□ Drag & drop components works
□ Save in Studio → JSON persisted to DB
□ Preview modes (mobile/tablet/desktop) work
□ Member cannot delete site
```

---

## Task 4: Blog Post Management

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/blog/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/blog/new/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/blog/[postId]/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/blog/categories/page.tsx`
- `src/components/blog/*`
- Blog server actions

### Requirements
1. **Post list**: Shows all blog posts for the site from `blog_posts` table
2. **Create post**: TipTap editor with title, content, featured image, excerpt, category, SEO fields
3. **Edit post**: Same editor pre-filled with existing data
4. **Draft/Publish**: Toggle between draft and published status
5. **Schedule**: Set future publish date
6. **Categories**: Create/edit/delete categories from `blog_categories` table
7. **Featured post**: Toggle featured flag
8. **Reading time**: Auto-calculated from content length
9. **SEO fields**: Meta title, description, OG image per post
10. **All data real**: No mock posts or categories

### What to Fix
- If post list shows mock data — query from `blog_posts`
- If TipTap content doesn't save — verify JSON serialization to DB
- If categories are hardcoded — query from `blog_categories`
- If scheduling doesn't work — ensure `scheduled_at` field is used
- If reading time is fake — calculate: `Math.ceil(wordCount / 200)`
- If SEO fields don't save — wire to real DB update

### Verification
```
□ Blog post list shows real posts (or "No posts" empty state)
□ Create post → TipTap editor works, saves to DB
□ Edit post → Pre-fills existing content, saves changes
□ Draft/Publish toggle works
□ Categories CRUD works
□ Scheduled post → Shows scheduled date
□ Reading time calculated correctly
□ SEO fields save correctly
```

---

## Task 5: Client Viewing (Read-Only)

### Files to Audit
- `src/app/(dashboard)/dashboard/clients/page.tsx`
- `src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx`
- `src/lib/actions/clients.ts`

### Requirements
1. **Client list**: Shows all agency clients (member sees them read-only)
2. **Client detail**: Name, email, company, phone, notes, tags
3. **Assigned sites**: Shows sites linked to client
4. **Activity history**: Client-related activity log
5. **Read-only**: Member CANNOT edit, create, or delete clients
6. **All data real**: From `clients` table with RLS

### What to Fix
- If client list shows mock data — query from `clients` table
- If member can edit clients — add permission guard
- If activity history is mocked — query from `activity_log`
- If client detail has editable fields for members — make read-only

### Verification
```
□ Client list shows real clients (or "No clients" empty state)
□ Client detail shows real data
□ Member cannot edit/create/delete clients
□ Activity history shows real activities
```

---

## Task 6: Form Submissions

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/submissions/page.tsx`
- `src/app/api/forms/export/route.ts`
- Form submission server actions

### Requirements
1. **Submission list**: Real submissions from `form_submissions` table
2. **Submission detail**: View individual submission data (name, email, message, etc.)
3. **Export**: CSV export works via `/api/forms/export`
4. **Mark read/unread**: Toggle read status
5. **Date filtering**: Filter by date range
6. **Empty state**: "No form submissions yet"

### What to Fix
- If submissions are mocked — query from `form_submissions`
- If export is stubbed — implement real CSV generation
- If mark read doesn't work — update DB record
- If date filtering doesn't work — add date range query

### Verification
```
□ Submissions list shows real data (or empty state)
□ Individual submission detail works
□ CSV export downloads correctly
□ Mark as read/unread persists
□ Date filtering works
```

---

## Task 7: Notifications

### Files to Audit
- `src/app/(dashboard)/dashboard/notifications/page.tsx`
- `src/components/notifications/notification-bell.tsx`
- `src/components/notifications/notification-center.tsx`
- `src/components/notifications/notifications-list.tsx`
- `src/lib/actions/notifications.ts`
- `src/lib/services/notifications.ts`

### Requirements
1. **Notification bell**: Shows unread count badge in header
2. **Notification dropdown**: Quick view of recent notifications
3. **Full notification page**: All notifications with filtering
4. **Mark as read**: Individual and bulk mark-as-read
5. **Notification types**: New bookings, orders, form submissions, system alerts
6. **Notification icons**: Lucide via `NotificationIcon` component (not emoji)
7. **Real data**: All from `notifications` table

### What to Fix
- If notification count is hardcoded — query real unread count
- If notifications are mocked — query from `notifications` table
- If mark-as-read doesn't work — update DB
- If icons show emoji — use `NotificationIcon` component
- If notification click doesn't navigate — add proper href links

### Verification
```
□ Bell shows real unread count
□ Dropdown shows real recent notifications
□ Full page shows all notifications with filtering
□ Mark as read works (individual and bulk)
□ Icons are Lucide (not emoji)
□ Click notification → navigates to relevant page
```

---

## Task 8: Personal Settings

### Files to Audit
- `src/app/(dashboard)/settings/profile/page.tsx`
- `src/app/(dashboard)/settings/security/page.tsx`
- `src/app/(dashboard)/settings/notifications/page.tsx`
- `src/lib/actions/profile.ts`
- `src/lib/actions/security.ts`

### Requirements
1. **Profile**: Edit name, avatar, email — saves to `profiles` table
2. **Security**: Change password via Supabase Auth, view active sessions
3. **Notification preferences**: Toggle which notifications to receive — saves to DB
4. **Avatar upload**: Uploads to Supabase Storage, URL saved to profile
5. **All saves persist**: No localStorage-only saves

### What to Fix
- If profile edit doesn't save — wire to real DB update
- If password change doesn't work — wire to Supabase `updateUser()`
- If avatar upload is mocked — implement Supabase Storage upload
- If notification preferences use localStorage — migrate to DB
- If sessions view is mocked — show real session info or hide

### Verification
```
□ Profile name change persists after page reload
□ Avatar upload works and shows in sidebar
□ Password change works
□ Notification preferences persist
□ No mock data in settings
```

---

## Summary: Files to Create/Modify

### Potential New Files
- None expected — this phase is mostly audit and fix

### Files to Modify (potential)
- Dashboard page components
- Blog management pages
- Client pages (read-only enforcement)
- Submission pages
- Notification components
- Settings pages

### Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 8 tasks verified
□ All data is real (no mock/random)
□ Member permissions enforced (read-only clients, no delete)
□ All currency in ZMW format
□ All notifications use real data
□ Blog CRUD works end-to-end
□ Form submissions show real data
□ Settings persist correctly
```

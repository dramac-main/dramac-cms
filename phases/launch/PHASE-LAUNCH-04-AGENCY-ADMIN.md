# PHASE LAUNCH-04: Agency Admin & Site Management E2E

**User Journeys Covered**: 5.1 (Inherited from Member), 5.2 (Manage Clients), 5.3 (Create & Manage Sites), 5.4 (Invite Team), 5.5 (Manage Modules), 5.6 (View Billing), 5.7 (Manage SEO), 5.8 (Domain Management), 5.9 (Email Management)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Client management connects with LAUNCH-02 (Portal Client access). Module installation connects with LAUNCH-10 (Module Lifecycle).

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md (Module Architecture, Multi-Tenant Hierarchy, API Patterns)
memory-bank/activeContext.md (FIX-03: Navigation section)
docs/USER-JOURNEYS.md (Section 5 — Agency Admin)
```

---

## Context

Agency admins have `agency_members.role = "admin"`. They inherit all member capabilities PLUS: manage clients, create/delete sites, invite team members, install modules, view billing, manage SEO, manage domains.

---

## Task 1: Client Management (Full CRUD)

### Files to Audit
- `src/app/(dashboard)/dashboard/clients/page.tsx`
- `src/app/(dashboard)/dashboard/clients/new/page.tsx`
- `src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx`
- `src/lib/actions/clients.ts`
- `src/components/clients/*`

### Requirements
1. **Client list**: All agency clients with search, filter, sort
2. **Create client**: Name, email, company, phone, tags, notes, portal access toggle
3. **Edit client**: All fields editable, save persists to DB
4. **Delete client**: With confirmation dialog, cascades properly
5. **Portal access**: Toggle `has_portal_access`, set permissions (`can_edit_content`, `can_view_analytics`, `can_view_invoices`)
6. **Per-site permissions**: Set `can_view`, `can_edit_content`, `can_publish`, `can_view_analytics` per site
7. **Client portal password**: Generate/reset portal login credentials
8. **Tags**: Add/remove tags for organization
9. **Activity history**: Real activity log per client
10. **Impersonation button**: "View as Client" link for owners (Journey 6.13)

### What to Fix
- If create client doesn't save all fields — verify all columns mapped
- If portal access toggle doesn't work — update `clients.has_portal_access` + create auth user
- If per-site permissions don't save — update `client_site_permissions` table
- If delete doesn't cascade — add proper cascade logic
- If tags don't persist — save to `clients.tags` JSONB column
- If activity log is mocked — query from real `activity_log`

### Verification
```
□ Create client → All fields saved to DB
□ Edit client → Changes persist
□ Delete client → Removes with proper cascade
□ Portal access toggle → Creates/updates portal user
□ Per-site permissions → Saved to client_site_permissions
□ Tags → Persist correctly
□ Activity → Shows real history
```

---

## Task 2: Site Creation & Management

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/settings/page.tsx`
- `src/lib/actions/sites.ts`
- `src/components/sites/*`

### Requirements
1. **Create site**: Name, subdomain (auto-validated for uniqueness), assign to client, optional template
2. **Site overview**: Status, domain, page count, module count, analytics summary
3. **Site settings**: Subdomain, custom domain, tracking codes (GA/FB Pixel), favicon, branding
4. **Publish/Unpublish**: Toggle site live status
5. **Delete site**: With confirmation, cascade deletes pages/modules/blog
6. **Site tabs**: Pages, Blog, Modules, SEO, Submissions, Booking, E-Commerce, CRM, Social, Automation, AI Agents
7. **Module tabs conditional**: Only show tabs for installed modules (use `getSiteEnabledModules()`)
8. **Real stats**: Page count, post count, submission count from DB

### What to Fix
- If site creation doesn't validate subdomain uniqueness — add validation
- If site stats are mocked — query real counts
- If module tabs show regardless of installation — use `getSiteEnabledModules()`
- If publish doesn't work — wire to real site publish action
- If tracking codes don't save — ensure they're stored in `sites` table
- If favicon upload doesn't work — wire to Supabase Storage

### Verification
```
□ Create site → Saves with unique subdomain
□ Site overview shows real stats
□ Site settings save correctly (domain, tracking, favicon)
□ Publish/unpublish works
□ Module tabs only show for installed modules
□ Delete site cascades properly
□ Custom domain configuration works
```

---

## Task 3: Team Member Invitation

### Files to Audit
- `src/app/(dashboard)/settings/team/page.tsx`
- `src/lib/actions/team.ts`
- `src/components/settings/team-members-list.tsx`
- Team invitation email templates

### Requirements
1. **Team member list**: All agency members with roles
2. **Invite member**: Email address + role selection (admin or member)
3. **Invitation email**: Sent via Resend with proper template
4. **Accept invitation**: Invited user creates account → auto-linked to agency
5. **Role display**: Shows role badges correctly
6. **Deactivate member**: Admin can deactivate (not delete) members
7. **Role changes**: Only owner can change roles (admin ↔ member)

### What to Fix
- If invite doesn't send email — wire to `sendEmail()` with invitation template
- If invited user doesn't get linked to agency — verify `agency_members` insert on signup
- If role badges show undefined — add null checks
- If deactivation doesn't work — update `agency_members.status`
- If admin can change roles — restrict to owner only

### Verification
```
□ Team member list shows real members
□ Invite → Email sent with valid link
□ Invited user signs up → Auto-linked to agency
□ Role badges display correctly
□ Deactivation works
□ Only owner can change roles
```

---

## Task 4: Module Installation & Configuration

### Files to Audit
- `src/app/(dashboard)/dashboard/modules/subscriptions/page.tsx`
- `src/app/(dashboard)/dashboard/modules/pricing/page.tsx`
- `src/components/modules/agency/subscription-list.tsx`
- `src/components/modules/marketplace/marketplace-grid.tsx`
- `src/components/modules/marketplace/enhanced-module-card.tsx`
- `src/components/modules/marketplace/module-detail-view.tsx`
- `src/lib/actions/sites.ts` (`getSiteEnabledModules`, `isModuleEnabledForSite`)
- `src/app/api/modules/subscribe/route.ts`
- Module checkout flow

### Requirements
1. **Marketplace browse**: Shows all available modules from `modules_v2` table
2. **Module detail**: Screenshots, description, pricing, reviews, install button
3. **Subscribe (free)**: One-click install for free modules → creates `agency_module_subscriptions` record
4. **Subscribe (paid)**: Checkout flow via Paddle → creates subscription
5. **Enable on site**: Toggle module on/off per site → creates `site_module_installations` record
6. **Module settings**: Per-site configuration saves to installation settings
7. **Client pricing**: Set markup (percentage, fixed, or custom) for reselling to clients
8. **Subscription management**: View active subscriptions, cancel, upgrade
9. **Module icons**: Lucide via `resolveIconName()` (not emoji)
10. **Pricing display**: All in `formatCurrency()` from locale-config

### What to Fix
- If marketplace shows mock modules — query from `modules_v2` table
- If subscribe doesn't create record — wire to real DB insert
- If enable/disable on site doesn't work — manage `site_module_installations`
- If pricing shows `$` — change to `formatCurrency()`
- If module icons are emoji — use `resolveIconName()`
- If subscription list is empty when modules are subscribed — check query

### Verification
```
□ Marketplace shows real modules (or "No modules" empty state)
□ Free module install → Creates subscription + installation records
□ Enable on site → Module appears in site tabs
□ Disable on site → Module tab hidden
□ Pricing in ZMW format
□ Module icons are Lucide SVGs
□ Subscription list shows active subscriptions
```

---

## Task 5: SEO Management

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/seo/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/seo/pages/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/seo/robots/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/seo/sitemap/page.tsx`
- `src/components/studio/features/seo-settings-panel.tsx`
- SEO server actions

### Requirements
1. **SEO dashboard**: Overall site SEO health
2. **Per-page SEO**: Meta title, description, OG image per page
3. **Robots.txt**: Editor for custom robots.txt rules
4. **Sitemap**: Configuration for sitemap generation
5. **Google preview**: Shows how pages appear in Google search results (with real data)
6. **Social preview**: Shows how pages appear when shared on social media
7. **Real data**: All from `pages` table and `sites` table SEO fields

### What to Fix
- If SEO data is mocked — query from real DB fields
- If per-page SEO changes don't save — wire to real update action
- If robots.txt editor doesn't save — write to `sites.robots_txt` field
- If Google/Social preview shows mock data — use real page SEO fields
- If sitemap config doesn't persist — save to DB

### Verification
```
□ SEO dashboard shows real data
□ Per-page meta editing saves correctly
□ robots.txt saves and serves correctly
□ Sitemap reflects real pages
□ Google preview uses real meta data
□ Social preview uses real OG data
```

---

## Task 6: Domain Management

### Files to Audit
- `src/app/(dashboard)/dashboard/domains/page.tsx`
- `src/app/(dashboard)/dashboard/domains/search/page.tsx`
- `src/app/(dashboard)/dashboard/domains/cart/page.tsx`
- `src/app/(dashboard)/dashboard/domains/transfer/page.tsx`
- `src/app/(dashboard)/dashboard/domains/[domainId]/page.tsx`
- `src/components/settings/domains-manager.tsx`
- `src/lib/actions/domains.ts`
- `src/lib/actions/dns.ts`

### Requirements
1. **Domain list**: All domains for the agency from DB
2. **Domain search**: Search available domains (API integration or placeholder)
3. **Domain purchase cart**: Add domains and proceed to purchase
4. **Domain transfer**: Initiate and track domain transfers
5. **Domain detail**: DNS records, email hosting, renewal, settings
6. **DNS management**: Add/edit/delete DNS records
7. **Custom domain connection**: Connect domain to site with verification
8. **Real data**: From `site_domains` and related tables

### What to Fix
- If domain list is mocked — query from real tables
- If DNS management is stubbed — implement or show clear "coming soon" with explanation
- If domain verification doesn't work — implement DNS check via `dns.google/resolve`
- If domain purchase is fully mocked — show clear UI indicating external domain registrar integration
- If domain detail pages are empty — populate with real data from DB

### Verification
```
□ Domain list shows real domains (or empty state)
□ Custom domain connection works
□ Domain verification checks DNS correctly
□ DNS record management works (or clear status shown)
□ Domain detail shows real info
```

---

## Task 7: Email Management

### Files to Audit
- `src/app/(dashboard)/dashboard/email/page.tsx`
- `src/app/(dashboard)/dashboard/email/purchase/page.tsx`
- `src/app/(dashboard)/dashboard/email/[orderId]/page.tsx`
- `src/lib/actions/business-email.ts`

### Requirements
1. **Email dashboard**: Email hosting overview
2. **Purchase**: Buy email hosting for domains
3. **Email accounts**: Create/manage email accounts
4. **Configuration**: Email settings (forwarding, aliases)
5. **Real integration or clear status**: If email hosting isn't fully integrated, show clear messaging

### What to Fix
- If email management is fully mocked — either implement or show clear "Email hosting integration coming soon"
- If purchase flow doesn't work — show external provider link or coming soon
- If email accounts are mocked — show real data or empty state

### Verification
```
□ Email dashboard loads without errors
□ Purchase flow works or shows clear status message
□ Email accounts manageable or clear empty state
□ No broken pages or actions
```

---

## Task 8: Billing (View-Only for Admin)

### Files to Audit
- `src/app/(dashboard)/settings/billing/page.tsx`
- `src/app/(dashboard)/settings/subscription/page.tsx`
- `src/app/(dashboard)/dashboard/billing/page.tsx`
- `src/lib/actions/billing.ts`

### Requirements
1. **Billing page**: Shows payment methods, invoice history
2. **Subscription page**: Current plan details, usage
3. **Billing dashboard**: Overview of costs
4. **All pricing in ZMW**: `formatCurrency()` from locale-config
5. **Read-only for admin**: Admin can view but not change payment methods (owner-only)
6. **Real data or clear empty state**: No fake invoices or plans

### What to Fix
- If billing shows mock invoices — query from real billing tables or show empty state
- If pricing shows `$` — change to `formatCurrency()`
- If admin can edit payment methods — restrict to owner role
- If subscription details are hardcoded — pull from real subscription data

### Verification
```
□ Billing page shows real data or empty state
□ Subscription shows current plan (or "No active plan")
□ All amounts in ZMW format
□ Admin cannot modify payment methods
□ No mock/fake invoice data
```

---

## Summary: Files to Create/Modify

### Potential New Files
- None expected — this phase is mostly audit and fix

### Files to Modify (potential)
- Client management pages and actions
- Site management pages and actions
- Team management pages and actions
- Module installation components
- SEO pages
- Domain management components
- Billing/subscription pages

### Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 8 tasks verified
□ Client CRUD works end-to-end
□ Site creation/management works
□ Team invitation flow works
□ Module installation flow works
□ SEO management saves correctly
□ Domain management works (or clear status)
□ Billing shows real data
□ All currency in ZMW format
□ No mock data anywhere
□ Admin permissions enforced correctly
```

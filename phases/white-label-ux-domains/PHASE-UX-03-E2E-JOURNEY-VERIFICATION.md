# PHASE-UX-03: End-to-End Journey Verification & Polish

**Priority**: 🟡 P1 (High — Quality Assurance)  
**Estimated Effort**: 2-3 days  
**Dependencies**: PHASE-UX-01, PHASE-WL-01, PHASE-WL-02, PHASE-WL-03, PHASE-DM-01, PHASE-UX-02  
**Goal**: Walk every user journey end-to-end, fix broken flows, and polish the final experience

---

## Context

After implementing the branding, email, domain, and UX infrastructure phases, this final phase ensures **every user journey from the USER-JOURNEYS.md document works perfectly end-to-end**. This is the verification and polish pass.

Reference: `docs/USER-JOURNEYS.md` — 7 user types, 25+ journeys

---

## Task 1: Anonymous Visitor Journeys

### J1: Landing → Registration
1. Visit published site
2. Browse pages (navigation works)
3. Click "Sign Up" / CTA
4. Registration form works (validation, submission)
5. Email verification sent (WITH AGENCY BRANDING)
6. Email link → verify → redirect to onboarding
7. Onboarding flow completes (WITH CONFETTI from PHASE-UX-01)

### J2: Public Booking Flow
1. Visit published site with booking module
2. Browse services
3. Select date/time slot
4. Fill booking form
5. Payment (if required)
6. Confirmation page (branded)
7. Confirmation email (agency-branded from PHASE-WL-02)
8. Customer can view booking status

### J3: Public E-Commerce Flow
1. Visit published site with e-commerce
2. Browse products (grid, filters, search)
3. Add to cart
4. Cart management (quantity, remove)
5. Checkout (address, payment)
6. Order confirmation page (branded)
7. Order confirmation email (agency-branded)
8. Order tracking updates

### Verification Checklist
- [ ] Published site loads with correct domain
- [ ] Navigation between pages works (no 404s)
- [ ] All forms submit successfully
- [ ] All confirmation emails are agency-branded
- [ ] Payment flows complete (Paddle/Flutterwave/etc.)
- [ ] Mobile responsive at 375px, 768px, 1024px
- [ ] No "Dramac" visible to anonymous visitors
- [ ] SEO meta tags render correctly
- [ ] Page speed < 3s on mobile (test with Lighthouse)

---

## Task 2: Portal Client Journeys

### J4: Portal Login → Dashboard
1. Navigate to portal login URL
2. See agency-branded login page (from PHASE-WL-03)
3. Enter credentials
4. Redirect to portal dashboard
5. See agency-branded dashboard with sites/bookings/orders

### J5: Client Site Management
1. View assigned sites
2. Click into a site
3. View site analytics/status
4. Basic content editing (if permitted)
5. View booking list (filter, search)
6. View order list (filter, search)
7. View form submissions

### J6: Client Communication
1. Receive in-app notification (real-time)
2. Bell icon shows unread count
3. Click notification → navigates to correct page
4. Email notifications arrive (agency-branded)
5. Unsubscribe from notification category
6. Verify unsubscribed category stops

### Verification Checklist
- [ ] Portal login shows agency branding
- [ ] Dashboard loads with loading skeleton (from PHASE-UX-01)
- [ ] Sites list shows correctly
- [ ] Site detail pages all work
- [ ] Booking/order lists paginate, sort, and filter
- [ ] Notifications appear in real-time
- [ ] All page titles show "[Page] | [Agency Name]"
- [ ] Mobile portal fully functional
- [ ] No "Dramac" visible anywhere in portal

---

## Task 3: Agency Member Journeys

### J7: Team Member Onboarding
1. Receive invitation email (agency-branded)
2. Click invite link → registration form (pre-filled email)
3. Set password
4. Redirect to dashboard
5. See agency-branded dashboard
6. Access only permitted sections (role-based)

### J8: Daily Dashboard Workflow
1. Login → dashboard overview loads (skeleton → content)
2. Review notifications (bell icon, notification center)
3. Navigate to sites (progress bar shows during navigation)
4. Open a site → booking module
5. View today's bookings
6. Click into a booking → view details
7. Confirm/cancel booking
8. Customer receives notification + email (branded)

### J9: Site Building & Publishing
1. Create a new site
2. Choose template
3. Edit pages (editor loads with skeleton)
4. Configure site settings
5. Setup domain (PHASE-DM-01 — new domains-manager works)
6. Publish site
7. Visit published URL → site loads correctly
8. SEO verification (canonical URLs, sitemap, robots.txt)

### J10: CRM Workflow
1. Navigate to CRM module
2. View contacts list (DataTable from PHASE-UX-01)
3. Search/filter contacts
4. Click contact → view detail
5. Add note/task
6. View activity timeline
7. Segment contacts

### Verification Checklist
- [ ] Invitation → onboarding → dashboard is seamless
- [ ] Role-based access controls work (member can't access admin pages)
- [ ] Site creation → publishing → visiting works end-to-end
- [ ] Domain setup works (DNS instructions, verification, SSL)
- [ ] Booking management workflow is complete
- [ ] CRM data tables sort, filter, and paginate correctly
- [ ] All dialogs go full-screen on mobile (from PHASE-UX-01)
- [ ] All loading states show skeletons (no blank screens)
- [ ] Progress bar shows on every navigation

---

## Task 4: Agency Admin/Owner Journeys

### J11: Team Management
1. Navigate to team settings
2. Invite new member (sends agency-branded email)
3. Set member role/permissions
4. View member list
5. Change member role
6. Remove member (they receive notification)

### J12: Branding Configuration
1. Navigate to Settings → Branding (from PHASE-WL-01)
2. Upload logo (preview shows immediately)
3. Set colors (live preview panel)
4. Configure email branding
5. Send test email (preview is accurate)
6. Save → all branding updates immediately
7. Portal login reflects new branding
8. Next email sent reflects new branding

### J13: Billing Management
1. View current plan
2. See billing history
3. Payment method management
4. Upgrade/downgrade plan
5. Payment failure → notification + email
6. Trial ending → warning notification + email

### J14: Domain Management
1. Navigate to site settings → Domains
2. Add custom domain (clear DNS instructions)
3. "Verify DNS" → shows propagation status
4. DNS propagates → SSL auto-provisioned
5. Visit custom domain → site loads
6. Change domain → cascade runs:
   - Sitemap updated
   - Canonical URLs updated
   - Old domain 301 redirects
7. Domain health monitoring detects issues

### Verification Checklist
- [ ] Full team lifecycle: invite → join → role change → remove
- [ ] Branding settings save and propagate everywhere
- [ ] Email preview matches actual sent emails
- [ ] Billing flows work (check with Paddle sandbox)
- [ ] Domain lifecycle: add → verify → SSL → change → redirect → health check
- [ ] Admin can see all agency activity in notifications

---

## Task 5: Super Admin Journeys

### J15: Platform Overview
1. Login as super admin
2. Dashboard shows platform metrics (active agencies, total sites, revenue)
3. Navigate to agencies list (DataTable with search/filter)
4. Click into an agency → view details
5. Impersonate agency (if feature exists)

### J16: User Management
1. View all users (DataTable)
2. Search by email/name
3. View user details
4. Change user role
5. Suspend/reactivate user
6. View user's activity

### J17: Module Management
1. View marketplace modules
2. Install/uninstall module
3. View module analytics
4. Manage module permissions

### J18: System Health
1. View system health dashboard
2. Email delivery stats (from PHASE-WL-02 email logs)
3. Domain health overview (from PHASE-DM-01)
4. Error rates and performance

### Verification Checklist
- [ ] Super Admin dashboard loads with all metrics
- [ ] Agency list with search/filter/pagination
- [ ] User management CRUD works
- [ ] Module marketplace functional
- [ ] System health shows accurate data
- [ ] Super Admin UI shows "Dramac" platform branding (correct — this IS the platform admin)

---

## Task 6: Cross-Cutting Concerns (All User Types)

### Responsive Design Verification

Test every page at these breakpoints:
- **375px** (iPhone SE / small phone)
- **390px** (iPhone 14)
- **768px** (iPad portrait)
- **1024px** (iPad landscape)
- **1280px** (Laptop)
- **1920px** (Desktop)

For each breakpoint verify:
- [ ] No horizontal scroll
- [ ] No overlapping elements
- [ ] Touch targets ≥ 44px
- [ ] Text readable without zooming
- [ ] Navigation accessible
- [ ] Dialogs render correctly (full-screen on mobile)
- [ ] Tables switch to card view on mobile
- [ ] Forms usable on small screens

### Dark Mode Verification

- [ ] Every page renders correctly in dark mode
- [ ] No white flashes during navigation
- [ ] Brand colors remain visible/accessible
- [ ] Images/logos have dark mode variants
- [ ] Code blocks and embeds respect dark mode
- [ ] Email previews show both light/dark rendering

### Performance Verification

- [ ] Dashboard initial load < 2s (on broadband)
- [ ] Route transitions < 500ms (with progress bar)
- [ ] No layout shift during loading (CLS < 0.1)
- [ ] Images lazy-loaded below the fold
- [ ] API responses cached where appropriate
- [ ] No N+1 queries (check Supabase query logs)

### Accessibility Verification

- [ ] All pages navigable with keyboard only
- [ ] Skip-to-content works (from PHASE-UX-01)
- [ ] All interactive elements have ARIA labels
- [ ] Color contrast passes WCAG AA
- [ ] Screen reader can read all content
- [ ] Focus management on modal open/close
- [ ] Error messages associated with form fields

### Error Handling Verification

- [ ] 404 page renders for invalid routes
- [ ] API errors show user-friendly toast messages
- [ ] Network failure shows offline indicator
- [ ] Form validation errors are inline and descriptive
- [ ] Rate limiting returns appropriate 429 response
- [ ] Session expiry redirects to login gracefully

---

## Task 7: Fix List (Track Issues Found During Verification)

As you walk through each journey, document every issue found here:

### Issue Template
```
### Issue #XX: [Title]
**Journey**: [Which journey/task]
**Severity**: 🔴 Critical / 🟡 Medium / 🟢 Low
**Steps to Reproduce**:
1. ...
2. ...
**Expected**: ...
**Actual**: ...
**Fix**: [Description of fix]
**Files Changed**: [List files]
**Status**: ❌ Open / ✅ Fixed
```

### Known Issues to Verify/Fix
1. Onboarding completion redirect — Does it use the correct URL?
2. Site creation — Does the subdomain generate correctly?
3. Published site 404 — Do all page routes resolve?
4. Booking date picker — Does it respect agency timezone?
5. E-commerce checkout — Does currency show correctly (ZMW)?
6. Team invitation — Does the invite link expire properly?
7. Domain change — Does the cascade actually run (or is it still stubbed)?
8. Email preview — Does it render the correct template?
9. Notification count — Does it update in real-time across tabs?
10. Mobile sidebar — Does swipe-to-close work?

---

## Task 8: Final Polish Items

### Micro-Interactions
- [ ] Button press animations (subtle scale on click)
- [ ] Page entry animations (fade-in, not slide-in to avoid motion sickness)
- [ ] Toast enter/exit animations (slide from top-right)
- [ ] Skeleton pulse animation is smooth (not jarring)
- [ ] Confetti respects `prefers-reduced-motion`

### Copy & Microcopy
- [ ] All error messages are human-friendly (not technical jargon)
- [ ] Empty states have helpful CTAs ("No bookings yet. Create your first booking →")
- [ ] Loading states have context ("Loading your sites..." not just a spinner)
- [ ] Success messages are specific ("Site published successfully" not just "Success")
- [ ] Confirmation dialogs explain consequences ("This will permanently delete...")

### Consistency
- [ ] All dates formatted consistently (locale-aware, from `dateConfig`)
- [ ] All currency formatted consistently (ZMW for Zambia, from `currencyConfig`)
- [ ] All times include timezone
- [ ] Pluralization correct ("1 booking" vs "3 bookings")
- [ ] Capitalization consistent across all headings
- [ ] Icon style consistent (all Lucide, same size/weight)

---

## Files to Create/Modify

This phase primarily modifies existing files to fix issues found during verification. No major new files, but expect:

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | Multiple route pages | Fix issues found during testing |
| MODIFY | Multiple components | Polish micro-interactions |
| MODIFY | Error/empty state components | Improve copy |
| MODIFY | Date/currency formatters | Ensure consistency |
| CREATE | `docs/JOURNEY-VERIFICATION-REPORT.md` | Document test results |

---

## Testing Checklist Summary

- [ ] All 18+ user journeys verified end-to-end
- [ ] All journeys work on mobile (375px)
- [ ] All journeys work in dark mode
- [ ] All journeys show agency branding (not "Dramac")
- [ ] All emails agency-branded and delivered
- [ ] All domain operations cascade correctly
- [ ] All notifications delivered (in-app + email)
- [ ] All tables use DataTable with mobile card view
- [ ] All routes have loading skeletons
- [ ] All dialogs go full-screen on mobile
- [ ] Progress bar shows on every navigation
- [ ] Performance meets targets
- [ ] Accessibility passes WCAG AA
- [ ] Error handling covers all edge cases
- [ ] A verification report is documented

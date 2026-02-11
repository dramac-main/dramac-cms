# PHASE LAUNCH-13: Final Integration & Smoke Test

**User Journeys Covered**: Journey 9.5 (Support Ticket Lifecycle), Journey 9.6 (Payment Failure & Recovery), Journey 10.4 (Social Media Module Roles), Journey 10.5 (Automation Module Roles), Final Cross-Journey Smoke Test  
**Independence**: Should run LAST after all other phases  
**Connection Points**: ALL previous phases — this is the final verification

---

## Pre-Implementation: Read These Files First

```
memory-bank/systemPatterns.md (All patterns)
memory-bank/activeContext.md (Latest context)
memory-bank/progress.md (All completed work)
docs/USER-JOURNEYS.md (Journeys 9.5, 9.6, 10.4, 10.5, full document)
```

---

## Context

This is the FINAL phase. It covers:
1. Support ticket lifecycle (Journey 9.5)
2. Payment failure & recovery (Journey 9.6)
3. Social media module roles (Journey 10.4)
4. Automation module roles (Journey 10.5)
5. Cross-journey smoke test of ALL user journeys together

---

## Task 1: Support Ticket Lifecycle (Journey 9.5)

### Files to Audit
- `src/app/(portal)/portal/support/page.tsx`
- `src/app/(portal)/portal/support/[ticketId]/page.tsx`
- `src/app/(dashboard)/dashboard/*/support/*` (or wherever support tickets are managed)
- `src/lib/actions/support-actions.ts`
- Support ticket components

### Requirements
1. **Client creates ticket**: From portal → title, description, priority, category
2. **Ticket saved**: In `support_tickets` table
3. **Notification**: Agency team notified of new ticket
4. **Agent assigns**: Team member picks up ticket
5. **Communication**: Thread-based replies between client and agent
6. **Status flow**: open → in_progress → waiting_on_client → resolved → closed
7. **Priority levels**: low, medium, high, urgent
8. **Attachments**: Upload screenshots/files
9. **Resolution**: Mark as resolved with resolution notes
10. **Client satisfaction**: Optional rating after resolution
11. **All real data**: No mock tickets

### What to Fix
- If ticket creation is stubbed → wire to real DB
- If replies don't save → implement thread actions
- If notifications don't fire → add notification hooks
- If status transitions don't save → wire to real updates
- If portal support page doesn't load → verify routing

### Verification
```
□ Client can create support ticket from portal
□ Ticket saved to DB
□ Agency team receives notification
□ Agent can assign ticket
□ Thread replies work (client ↔ agent)
□ Status transitions save
□ Attachments upload
□ Resolution with notes
□ All real data, no mocks
```

---

## Task 2: Payment Failure & Recovery (Journey 9.6)

### Files to Audit
- `src/app/api/webhooks/paddle/route.ts`
- `src/lib/actions/billing-actions.ts`
- `src/lib/actions/subscription-actions.ts`
- `src/app/(dashboard)/dashboard/settings/billing/page.tsx`
- Dunning/retry logic

### Requirements
1. **Payment failure webhook**: Paddle sends `subscription.payment_failed` webhook
2. **Webhook processing**: Using `createAdminClient()`, update subscription status
3. **User notification**: Email + in-app notification about failed payment
4. **Grace period**: X days before service interruption
5. **Retry**: Automatic retry by Paddle, manual retry option in billing
6. **Update payment**: Link to update payment method in Paddle portal
7. **Recovery**: On successful retry → restore full access
8. **Downgrade**: After grace period → downgrade or restrict features
9. **All real**: No simulated payment flows

### What to Fix
- If webhook doesn't handle `payment_failed` → add handler
- If notification doesn't send on failure → add notification trigger
- If no grace period logic → implement access check with grace period
- If update payment link broken → verify Paddle portal URL
- If recovery doesn't restore access → handle `payment_succeeded` after failure

### Verification
```
□ Payment failure webhook handled
□ Subscription status updated
□ User notified (email + in-app)
□ Grace period before restriction
□ Update payment method link works
□ Recovery restores access
□ All using createAdminClient() for webhooks
```

---

## Task 3: Social Media Module Roles (Journey 10.4)

### Files to Audit
- `src/modules/social-media/components/*`
- `src/modules/social-media/actions/*`
- Social media role checks

### Requirements
1. **Admin (100)**: Full social media management
2. **Social Manager (75)**: Create/schedule posts, analytics
3. **Content Creator (50)**: Create posts, submit for approval
4. **Analyst (25)**: View analytics only
5. **Viewer (10)**: Read-only

### What to Fix
- If roles not enforced → add role-based access checks
- If content creators can publish directly → require approval workflow

### Verification
```
□ Admin has full access
□ Social Manager can schedule and publish
□ Content Creator submits for approval
□ Analyst sees analytics only
□ Viewer is read-only
```

---

## Task 4: Automation Module Roles (Journey 10.5)

### Files to Audit
- `src/modules/automation/components/*`
- `src/modules/automation/actions/*`
- Automation role checks

### Requirements
1. **Admin (100)**: Full automation management
2. **Workflow Manager (75)**: Create/edit workflows, triggers
3. **Operator (50)**: Run/pause workflows, view logs
4. **Viewer (10)**: Read-only view of workflows

### What to Fix
- If roles not enforced → add role-based access checks
- If operators can edit workflows → restrict to run/pause

### Verification
```
□ Admin has full access
□ Workflow Manager can create/edit workflows
□ Operator can run/pause only
□ Viewer is read-only
```

---

## Task 5: Cross-Journey Smoke Test

**This is the most critical task.** Run through every major user flow to verify nothing is broken.

### Smoke Test Checklist

#### A. Authentication & Onboarding
```
□ Sign up → Verify email → Complete onboarding
□ Login → Dashboard loads
□ Password reset flow works
□ Session persistence works
□ Logout clears session
```

#### B. Agency Dashboard (Owner)
```
□ Dashboard overview loads with real metrics
□ All sidebar navigation items work
□ Create site works
□ Site list shows real sites
□ Activity feed shows real activities
□ Notifications load (in-app)
```

#### C. Site Management
```
□ Site settings save
□ Team management works
□ Module installation works
□ Each module page loads without errors
□ Settings pages all save correctly (13 pages)
```

#### D. Published Sites
```
□ Published site loads on subdomain
□ All pages render correctly
□ Module blocks work (booking form, product grid)
□ SEO meta tags present
□ Contact form submissions work
□ Mobile responsive
```

#### E. Portal
```
□ Portal login works
□ Portal dashboard loads
□ All 17 portal sections accessible
□ Client can view sites
□ Client can view analytics
□ Client can manage settings
□ Client can submit support tickets
```

#### F. Admin Panel
```
□ Admin login works (super admin only)
□ Admin dashboard loads
□ All 11 admin sections accessible
□ Agency management works
□ User management works
□ Module management works
□ System health displays correctly
```

#### G. E-Commerce Flow
```
□ Store setup → Products → Published storefront → Cart → Checkout → Order → Fulfill
□ All pricing in ZMW
□ Order notifications sent
```

#### H. Booking Flow
```
□ Service setup → Calendar → Public booking page → Book → Confirm → Manage
□ All pricing in ZMW
□ Booking notifications sent
```

#### I. CRM Flow
```
□ Contacts → Companies → Deals → Pipeline → Analytics
□ Cross-module contact creation (submissions → CRM)
```

#### J. AI & Studio
```
□ AI Designer generates pages
□ Studio editor opens and works
□ Save and publish from Studio
```

#### K. Billing
```
□ Subscription page loads
□ Plan selection works
□ Paddle checkout opens
□ Billing history shows real invoices
```

#### L. Branding Consistency
```
□ No `$` currency symbols (all ZMW / K)
□ No "Acme" or "Your Company" defaults
□ Agency branding applied (logo, colors, name)
□ Dark mode works without bleed
□ No branding flash on page load
```

#### M. Error States
```
□ 404 page works for invalid routes
□ Empty states show (no data yet)
□ Error boundaries catch component errors
□ Loading states display during data fetch
□ Unauthorized redirects to login
```

---

## Task 6: Final Data Integrity Checks

### Requirements
1. **No mock data anywhere**: Search codebase for remaining mock/demo patterns
2. **No hardcoded IDs**: Search for literal UUIDs or user IDs
3. **No `$` in user-facing text**: All should be ZMW
4. **No console.log in production**: Remove debug logs
5. **No TODO/FIXME/HACK**: Address or document remaining items
6. **Environment variables**: All required env vars documented

### How to Check
```bash
# Search for mock data patterns
grep -r "mock\|Mock\|MOCK\|demo\|Demo\|placeholder" src/ --include="*.tsx" --include="*.ts" -l

# Search for hardcoded IDs
grep -r "'user-id'\|'agency-id'\|'site-id'\|'uuid'" src/ --include="*.tsx" --include="*.ts"

# Search for dollar signs in user-facing text (careful - also matches template literals)
grep -r '\\$[0-9]' src/ --include="*.tsx" -l

# Search for console.log
grep -r "console\.log" src/ --include="*.tsx" --include="*.ts" -l

# Search for TODO/FIXME
grep -r "TODO\|FIXME\|HACK\|XXX" src/ --include="*.tsx" --include="*.ts" -l
```

### Verification
```
□ No mock data patterns in production code
□ No hardcoded IDs
□ No $ currency in user-facing text
□ Console.logs removed (or guarded with NODE_ENV)
□ TODOs addressed or documented
```

---

## Task 7: Update Memory Bank

After ALL phases are complete:

### Files to Update
- `memory-bank/activeContext.md` — Current state is launch-ready
- `memory-bank/progress.md` — All launch phases complete
- `memory-bank/systemPatterns.md` — Any new patterns discovered
- `memory-bank/techContext.md` — Any tech changes

### Required Updates
1. Mark all launch phases as complete
2. Document any issues found and resolved
3. Update next steps (deployment, monitoring, etc.)
4. Record final state of platform

---

## Summary: Final Verification Checklist (Complete Before Final Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ ALL tasks in ALL phases verified
□ Support ticket lifecycle works
□ Payment failure/recovery works
□ All module roles enforced (Booking, E-Commerce, CRM, Social, Automation)
□ Cross-journey smoke test PASSED:
  □ Auth works
  □ Dashboard works
  □ Sites work
  □ Published sites work
  □ Portal works
  □ Admin works
  □ E-Commerce flow works
  □ Booking flow works
  □ CRM flow works
  □ AI Designer works
  □ Studio works
  □ Billing works
  □ Branding consistent
  □ Error states handled
□ No mock data in production
□ No hardcoded IDs
□ All pricing in ZMW
□ Memory bank updated
□ Platform is launch-ready
```

---

## Final Commit Message
```
feat: complete launch preparation — all 13 phases verified

- Anonymous visitor & published sites verified
- Portal client flow verified
- Agency member flow verified
- Agency admin flow verified
- Agency owner flow verified
- Module developer flow verified
- Super admin flow verified
- Booking lifecycle verified
- E-Commerce lifecycle verified
- Module marketplace verified
- Website creation lifecycle verified
- CRM lifecycle verified
- Final integration & smoke test passed
- All pricing in ZMW, no mock data, no hardcoded IDs
- Platform launch-ready
```

# PHASE LAUNCH-10: Module Marketplace E2E Lifecycle

**User Journeys Covered**: Journey 9.3 (Module Marketplace Lifecycle — All Users)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Module Developer (LAUNCH-06), Super Admin module approval (LAUNCH-07), Agency Owner module install (LAUNCH-05)

---

## Pre-Implementation: Read These Files First

```
memory-bank/systemPatterns.md (Module Architecture, Auth patterns)
memory-bank/progress.md (Module system status)
docs/USER-JOURNEYS.md (Journey 9.3, Journey 7.1-7.7)
```

---

## Context

The module marketplace lifecycle spans 4 user types:
1. **Module Developer** → Build module → Submit for review
2. **Super Admin** → Review → Approve/Reject module
3. **Agency Owner** → Browse marketplace → Subscribe → Install on site
4. **Site Users** → Use installed module on site

This lifecycle connects the module SDK (`packages/sdk/`), the marketplace UI, and the module installation/activation flow.

---

## Task 1: Module Submission Pipeline

### Files to Audit
- `src/app/(dashboard)/dashboard/modules/page.tsx`
- `src/app/(dashboard)/dashboard/modules/submit/page.tsx`
- `src/lib/actions/module-actions.ts`
- `src/components/modules/*`

### Requirements
1. **Developer dashboard**: Shows developer's submitted modules
2. **Submit module**: Form → name, description, version, icon, category, pricing
3. **Module validation**: Check required fields, valid pricing
4. **Status tracking**: draft → submitted → in_review → approved / rejected
5. **Version management**: Upload new versions of existing modules
6. **Module metadata**: Store all metadata in `modules` table
7. **Module icon**: Upload and display correctly (use `resolveIconName()` for dynamic icons)

### What to Fix
- If submission form doesn't save → wire to real DB
- If status doesn't update → implement status transition actions
- If icons use hardcoded Lucide names → use `resolveIconName()`
- If developer can't see their modules → query with developer user filter

### Verification
```
□ Developer can submit a module with all metadata
□ Module saved to DB with draft status
□ Developer can submit for review (status → submitted)
□ Version management works
□ Module icon displays correctly
```

---

## Task 2: Super Admin Module Review

### Files to Audit
- `src/app/(admin)/admin/modules/page.tsx`
- `src/app/(admin)/admin/modules/[moduleId]/page.tsx`
- `src/lib/actions/admin-actions.ts` (module review functions)

### Requirements
1. **Review queue**: List submitted modules pending review
2. **Module detail**: Full module info, code review, metadata
3. **Approve**: Set status to approved → module appears in marketplace
4. **Reject**: Set status to rejected with reason → developer notified
5. **Suspend**: Can suspend an approved module
6. **Real data only**: No mock review queue

### What to Fix
- If review queue is mocked → query real submitted modules
- If approve/reject doesn't update DB → wire actions
- If developer isn't notified → add notification on status change

### Verification
```
□ Review queue shows real submitted modules
□ Approve → Module status = approved
□ Reject → Module status = rejected + reason saved
□ Developer gets notification on approve/reject
□ Approved modules appear in marketplace
```

---

## Task 3: Marketplace Browse & Subscribe

### Files to Audit
- `src/app/(dashboard)/dashboard/modules/marketplace/page.tsx`
- `src/app/(dashboard)/dashboard/modules/marketplace/[moduleId]/page.tsx`
- `src/modules/*/components/onboarding/*`
- `src/lib/actions/module-actions.ts` (subscribe/install functions)
- Module subscription/billing integration

### Requirements
1. **Marketplace listing**: All approved modules with search, filter, category
2. **Module detail page**: Description, screenshots, pricing, reviews, install count
3. **Subscribe**: Link to payment (Paddle) → activate subscription
4. **Install on site**: Select site → install module
5. **Module activation**: Run module onboarding wizard on first install
6. **Pricing display**: All in ZMW using `formatCurrency()`
7. **Installed indicator**: Show which modules are already installed

### What to Fix
- If marketplace shows mock modules → query real approved modules
- If subscribe doesn't work → wire to Paddle billing
- If install doesn't activate → implement activation flow
- If onboarding wizard doesn't run → trigger on first install
- If pricing shows `$` → use `formatCurrency()`

### Verification
```
□ Marketplace shows real approved modules
□ Module detail page shows all info
□ Subscribe flow connects to billing
□ Install on site activates module
□ Onboarding wizard runs on first install
□ Pricing in ZMW
□ Already installed modules show indicator
```

---

## Task 4: Module Installation & Data Isolation

### Files to Audit
- `src/lib/actions/module-actions.ts` (installation functions)
- `src/modules/*/context/*` (module context providers)
- Module RLS policies

### Requirements
1. **Install creates module tables**: If module requires tables, they exist
2. **Data isolation**: Module data scoped to site (RLS on `site_id`)
3. **Module context**: Each module has context provider with real data
4. **Uninstall cleanup**: Remove module data when uninstalled (with confirmation)
5. **Module settings**: Per-site module settings saved

### What to Fix
- If module data leaks across sites → verify RLS
- If module context uses demo data → query real tables
- If uninstall doesn't clean up → implement cleanup action

### Verification
```
□ Module installed with proper tables
□ Data isolated per site
□ Module context loads real data
□ Uninstall cleans up data (with confirmation)
□ Module settings save per site
```

---

## Task 5: Module Revenue & Analytics

### Files to Audit
- Developer revenue dashboard components
- `src/lib/actions/module-actions.ts` (revenue/analytics)
- Admin module analytics

### Requirements
1. **Developer revenue**: Real subscription revenue from their modules
2. **Install analytics**: Real install counts, active installs
3. **Admin module analytics**: Overall module metrics
4. **Revenue split**: Developer share calculated correctly
5. **All amounts in ZMW**: Using `formatCurrency()`

### What to Fix
- If revenue is mocked → query real billing data
- If install counts are hardcoded → count from installations table
- If revenue split is wrong → verify percentage calculation

### Verification
```
□ Developer sees real revenue
□ Install counts are real
□ Admin analytics show real module metrics
□ Revenue split calculated correctly
□ All amounts in ZMW
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 5 tasks verified
□ Complete module marketplace lifecycle works:
  □ Developer submits module
  □ Super Admin reviews and approves
  □ Module appears in marketplace
  □ Agency Owner subscribes and installs
  □ Module activates on site with onboarding
  □ Module data isolated per site
  □ Developer sees real revenue
  □ Admin sees real analytics
□ All pricing in ZMW
□ No mock data in marketplace
□ Module icons display correctly
```

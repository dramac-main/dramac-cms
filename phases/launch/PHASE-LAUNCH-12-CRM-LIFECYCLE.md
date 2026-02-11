# PHASE LAUNCH-12: CRM E2E Lifecycle

**User Journeys Covered**: Journey 6.12 (Agency Owner CRM), Journey 10.2 (CRM Module Roles)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Agency Owner dashboard (LAUNCH-05), Portal submissions (LAUNCH-02)

---

## Pre-Implementation: Read These Files First

```
memory-bank/systemPatterns.md (Module Architecture, Auth patterns)
memory-bank/progress.md (CRM Module phases status)
docs/USER-JOURNEYS.md (Journey 6.12, Journey 10.2)
```

---

## Context

The CRM module provides contact management, company tracking, deal pipeline, and analytics. Data flows from:
- **Form submissions** → Auto-create contacts
- **Booking customers** → Auto-create contacts
- **E-commerce customers** → Auto-create contacts
- **Manual entry** → Dashboard CRUD

All CRM data in `mod_crm_*` tables, scoped by `site_id` with RLS.

---

## Task 1: Contact Management

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/crm-module/page.tsx`
- `src/modules/crm/components/contacts/*`
- `src/modules/crm/actions/crm-actions.ts`
- `src/modules/crm/hooks/*`
- `src/modules/crm/context/*`

### Requirements
1. **Contact list**: All contacts from `mod_crm_contacts` with search, filter, sort
2. **Contact detail**: Full contact info, activity timeline, associated deals
3. **Create contact**: Manual contact creation with validation
4. **Edit contact**: Update contact fields
5. **Delete contact**: Soft delete with confirmation
6. **Import contacts**: Bulk import from CSV
7. **Export contacts**: Export to CSV
8. **Contact tags**: Tag contacts for segmentation
9. **Activity tracking**: Log calls, emails, meetings, notes
10. **Auto-creation**: Contacts created from form submissions, bookings, orders
11. **No mock data**: All from real DB queries

### What to Fix
- If contact list shows mock data → query real `mod_crm_contacts`
- If CRUD doesn't save → wire to real DB actions
- If import is stubbed → implement CSV parsing
- If activity log is mocked → query real activity
- If auto-creation from submissions doesn't work → verify trigger

### Verification
```
□ Contact list shows real contacts
□ Create contact → saved to DB
□ Edit contact → updated in DB
□ Delete contact → soft deleted
□ Import from CSV works
□ Export to CSV works
□ Contact tags work
□ Activity timeline shows real activities
□ Auto-created from form submissions
```

---

## Task 2: Company Management

### Files to Audit
- `src/modules/crm/components/companies/*`
- `src/modules/crm/actions/crm-actions.ts` (company functions)

### Requirements
1. **Company list**: All companies from `mod_crm_companies` with search
2. **Company detail**: Company info, associated contacts, deals
3. **Create company**: Manual creation with industry, size, website
4. **Edit company**: Update company fields
5. **Link contacts**: Associate contacts with companies
6. **Company analytics**: Revenue, deal count per company
7. **No mock data**: All from real DB

### What to Fix
- If company list is mocked → query real table
- If linking contacts doesn't work → wire association action
- If analytics are hardcoded → query real aggregations

### Verification
```
□ Company list shows real companies
□ CRUD works for companies
□ Contacts linked to companies
□ Company analytics show real data
```

---

## Task 3: Deal Pipeline

### Files to Audit
- `src/modules/crm/components/deals/*`
- `src/modules/crm/components/pipeline/*`
- `src/modules/crm/actions/crm-actions.ts` (deal/pipeline functions)

### Requirements
1. **Pipeline view**: Kanban board with stages (Lead → Qualified → Proposal → Won/Lost)
2. **Deal cards**: Show deal value, contact, stage, expected close date
3. **Drag to move**: Drag deal card between stages
4. **Create deal**: Name, value, contact, company, expected close, probability
5. **Edit deal**: Update deal fields
6. **Deal detail**: Full deal info, activity, notes
7. **Won/Lost tracking**: Mark deals as won or lost with reason
8. **Deal value in ZMW**: All amounts use `formatCurrency()`
9. **Pipeline customization**: Agency can customize pipeline stages
10. **No mock data**: Real deals from DB

### What to Fix
- If pipeline shows mock deals → query real `mod_crm_deals`
- If drag doesn't update stage → wire to real DB update
- If deal values show `$` → use `formatCurrency()`
- If pipeline stages are hardcoded → load from DB settings
- If won/lost doesn't track → implement status transition

### Verification
```
□ Pipeline shows real deals in Kanban view
□ Drag deal between stages → updates DB
□ Create deal → saved to DB
□ Deal values in ZMW
□ Won/Lost tracking works
□ Pipeline stages customizable
□ No mock data
```

---

## Task 4: CRM Analytics

### Files to Audit
- `src/modules/crm/components/analytics/*`
- `src/modules/crm/actions/crm-actions.ts` (analytics functions)
- Dashboard CRM analytics widgets

### Requirements
1. **Contact metrics**: Total contacts, new this month, growth rate
2. **Deal metrics**: Total deals, won deals, lost deals, win rate
3. **Revenue metrics**: Total pipeline value, won revenue, average deal size
4. **Pipeline analytics**: Conversion rates between stages
5. **Activity metrics**: Calls, emails, meetings logged
6. **Charts**: Real data visualizations (Recharts)
7. **Date filtering**: Filter by date range
8. **All real data**: No mock analytics — query real aggregations
9. **All amounts in ZMW**: Using `formatCurrency()`

### What to Fix
- If analytics show hardcoded numbers → query real aggregations
- If charts render with demo data → pass real data props
- If date filtering doesn't work → implement date range query
- If amounts show `$` → use `formatCurrency()`

### Verification
```
□ Contact metrics show real numbers
□ Deal metrics show real numbers
□ Revenue metrics show real amounts in ZMW
□ Pipeline conversion rates calculated from real data
□ Charts render with real data
□ Date filtering works
□ No mock/demo analytics
```

---

## Task 5: CRM Module Roles

### Requirements
1. **Admin (100)**: Full CRM access
2. **Sales Manager (75)**: Contacts, companies, deals, pipeline, analytics
3. **Sales Rep (50)**: Own contacts, own deals, limited analytics
4. **Support Agent (25)**: View contacts, add notes/activities
5. **Viewer (10)**: Read-only access

### What to Fix
- If all users see everything → implement role-based filtering
- If sales reps see all deals → filter to own deals
- If support agents can edit → enforce read + notes only

### Verification
```
□ Admin has full access
□ Sales Manager manages all contacts/deals
□ Sales Rep sees only own contacts/deals
□ Support Agent can view + add notes only
□ Viewer is read-only
```

---

## Task 6: CRM Cross-Module Integration

### Requirements
1. **Form submissions → CRM**: New submission auto-creates contact
2. **Booking customers → CRM**: New booking creates/updates contact
3. **E-commerce customers → CRM**: New order creates/updates contact
4. **CRM → Notifications**: Deal won triggers notification
5. **CRM → Email**: Contact actions can trigger emails

### What to Fix
- If submissions don't create contacts → verify trigger/webhook
- If bookings don't update CRM → add after-booking hook
- If orders don't update CRM → add after-order hook

### Verification
```
□ Form submission → Contact created in CRM
□ Booking → Contact created/updated in CRM
□ Order → Contact created/updated in CRM
□ Deal won → Notification triggered
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 6 tasks verified
□ Complete CRM lifecycle works:
  □ Contact management (CRUD, import, export, tags)
  □ Company management (CRUD, link contacts)
  □ Deal pipeline (Kanban, drag, stages)
  □ CRM analytics (real data, charts)
  □ Module roles enforced
  □ Cross-module integration (submissions, bookings, orders → contacts)
□ All amounts in ZMW
□ No mock data in any CRM view
□ Activity tracking works
□ Pipeline customizable
```

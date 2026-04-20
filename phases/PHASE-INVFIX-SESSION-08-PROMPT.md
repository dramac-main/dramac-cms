# DRAMAC CMS — Invoice Overhaul Session 8

## Scope: INVFIX-07 Only — Expense Workflow Closure

> This is the authoritative prompt for Session 8.
> Do not start INVFIX-08 in this session.
> The expense subsystem already exists in the repo, so this is an audit-and-completion session, not a greenfield build.

---

## Your Job

Continue the invoicing overhaul by closing INVFIX-07 properly.

Preserve valid expense work already in the tree, finish the missing pieces, verify them, and update the memory bank at the end.

Do not stop at analysis.

---

## Mandatory Read Order

Read these first:

1. `/memory-bank/projectbrief.md`
2. `/memory-bank/productContext.md`
3. `/memory-bank/systemPatterns.md`
4. `/memory-bank/techContext.md`
5. `/memory-bank/activeContext.md`
6. `/memory-bank/progress.md`
7. `/phases/PHASE-INVFIX-MASTER-GUIDE.md`
8. `/phases/PHASE-INVFIX-SESSION-BRIEF.md`
9. `/phases/PHASE-INVFIX-SESSION-08-PROMPT.md`

Then inspect the current working tree before editing anything:

1. Run `git status --short`
2. Review existing expense- and report-related diffs already present in the repo
3. Treat the working tree as partially advanced, not as a clean baseline

Before changing code, run the TypeScript baseline from `next-platform-dashboard`:

```powershell
Set-Location "d:\dramac-cms\next-platform-dashboard"
$env:NODE_OPTIONS="--max-old-space-size=8192"
pnpm exec tsc --noEmit
```

Important:

- Global TSC is known to have unrelated baseline errors in other modules.
- Your goal is: no new invoicing-specific regressions, and touched files stay clean.
- Do not chase unrelated marketing, portal, automation, live-chat, or support failures.

---

## Current Verified Reality

1. INVFIX-04, INVFIX-05, and INVFIX-06 are now verified complete.
2. A substantial expense baseline already exists in the repo:
   - `expense-actions.ts`
   - `expense-form.tsx`
   - `expense-detail.tsx`
   - `expense-list.tsx`
   - `expense-category-manager.tsx`
   - `expense-report.tsx`
   - `expense-stats-card.tsx`
   - billable expense integration
3. Existing approve/reject buttons and existing expense/report screens do **not** mean INVFIX-07 is closed.

### What is still missing for INVFIX-07 closure

1. No configurable approval threshold / auto-approve path is visible in settings or enforced in expense submission.
2. No expense-submission / approval / rejection email notification flow is verified.
3. No dedicated `expense-receipt-viewer.tsx` exists with zoom/rotate/PDF inline/side-by-side behavior.
4. No monthly budget / overspend alert path is visible on expense categories.
5. Mileage / per-diem support is not visibly complete.

Do not pretend the phase is done just because expense CRUD already exists.

---

## Required Outcomes

### 1. Close the Approval Workflow Properly

Required outcome:

1. Expenses above a configurable threshold require approval.
2. Expenses below the threshold can auto-approve when the setting allows it.
3. The submitter can see the approval state clearly.
4. Authorized users can approve or reject with a recorded reason.
5. Email notification goes to the approver on submission when approval is required.
6. Email notification goes to the submitter on approval or rejection.

Implementation notes:

1. Audit the current status model first. If the existing `pending` / `approved` / `rejected` states need to expand to match the guide more accurately, do it cleanly with the required schema updates.
2. Do not overwrite general notes destructively if a distinct rejection-reason field or metadata path is more correct.
3. Keep permissions and actor logging coherent.

### 2. Finish the Receipt Viewer

Required outcome:

1. Create `src/modules/invoicing/components/expense-receipt-viewer.tsx`.
2. Images support a usable full-size viewer with at least zoom and rotate.
3. PDF receipts render inline rather than only as external links.
4. Expense detail cleanly links into this viewer.
5. Include the extraction hint from the phase guide instead of leaving receipt UX as a raw file link.

### 3. Finish Category Budgets and Overspend Alerts

Required outcome:

1. Expense categories support a real icon-selection path, not color only.
2. Monthly budget values can be stored per category.
3. Overspend state is surfaced in UI when actual spend exceeds budget.
4. The implementation stays within INVFIX-07 and does not expand into the broader INVFIX-08 reports overhaul.

### 4. Resolve the Mileage / Per-Diem Gap Honestly

Required outcome:

1. Audit whether mileage / per-diem support already exists anywhere in schema or code.
2. If it is partially implemented, finish it.
3. If it is not implemented and requires a broader schema expansion than the rest of this phase, document that explicitly in memory-bank files and do **not** falsely mark INVFIX-07 complete.

Do not silently ignore the mileage/per-diem part of the phase title.

---

## Files Most Likely In Scope

- `src/modules/invoicing/actions/expense-actions.ts`
- `src/modules/invoicing/actions/settings-actions.ts`
- `src/modules/invoicing/components/expense-form.tsx`
- `src/modules/invoicing/components/expense-detail.tsx`
- `src/modules/invoicing/components/expense-list.tsx`
- `src/modules/invoicing/components/expense-category-manager.tsx`
- `src/modules/invoicing/components/expense-stats-card.tsx`
- `src/modules/invoicing/components/expense-report.tsx`
- `src/modules/invoicing/components/invoicing-settings-form.tsx`
- `src/modules/invoicing/components/receipt-upload.tsx`
- `src/modules/invoicing/types/expense-types.ts`
- new migration(s) if approval/budget/settings schema is missing
- relevant dashboard pages under `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/expenses/`

---

## Hard Rules

1. Do not start INVFIX-08 in this session.
2. Do not broaden into cross-module reports except for the minimum reads needed to support expense budgets or overspend indicators.
3. Do not regress billable-expense-to-invoice-item behavior.
4. Keep amounts in cents.
5. Verify any schema additions directly.
6. Update the memory bank at the end.

---

## Verification Before Finishing

Run and check:

1. `git status --short` before and after changes.
2. Diagnostics / TypeScript for every touched invoicing file.
3. Full `next-platform-dashboard` baseline and confirm no new invoicing-specific regressions.
4. Manual checks for:
   - expense below threshold
   - expense above threshold
   - approval and rejection behavior
   - approval/rejection email notifications
   - image receipt viewer behavior
   - PDF receipt viewer behavior
   - category budget overspend UI
5. Direct live-schema verification for any new settings columns, tables, indexes, or policies.

If approval workflow, receipt viewer, and budgeting remain partial, do **not** claim INVFIX-07 is closed.

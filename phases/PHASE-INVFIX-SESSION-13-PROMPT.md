# DRAMAC CMS — INVFIX Session 13 Prompt

## Read First

1. Read all files in `/memory-bank/` first:
   - `projectbrief.md`
   - `productContext.md`
   - `systemPatterns.md`
   - `techContext.md`
   - `activeContext.md`
   - `progress.md`
2. Read `phases/PHASE-INVFIX-MASTER-GUIDE.md`.
3. Read `phases/PHASE-INVFIX-SESSION-BRIEF.md`.
4. Read this file fully before making any edits.

## Session Reality

Session 12 appears to have closed the remaining INVFIX-08 report carryover, but the Session 12 verification audit found that **INVFIX-09 is only partially implemented**.

There is real work in the repo already:

- `email-template-service.ts`
- `email-template-editor.tsx`
- `email-autosend-service.ts`
- `dunning-timeline.tsx`
- new dunning logic in `overdue-service.ts`
- credit-note and recurring-invoice hooks into the new email layer

Do **not** treat those files as proof of completion.

This session is a **closure pass**, not another broad implementation sprint.

## Hard Scope

This session is **INVFIX-09 only**.

Do **not** begin INVFIX-10, INVFIX-11, or INVFIX-12 in this session.

Do **not** reopen INVFIX-08 report work unless a small supporting fix is strictly required for INVFIX-09 wiring.

## Verified Remaining Gaps From Audit

### 1. Normalize the new template rendering pipeline

The current template system is not yet trustworthy.

Audit findings to fix:

- default templates use placeholder keys like `{{invoice_number}}`, `{{client_name}}`, `{{amount_due}}`
- auto-send callers currently pass camelCase variable keys like `invoiceNumber`, `clientName`, `amount`
- the render path must be normalized so previews and real sends use the **same** variable contract
- verify the `renderTemplate()` API and its callers agree on argument order and override-loading behavior

Required result:

- one consistent placeholder format
- one consistent render contract
- no raw placeholders leaking into sent emails
- preview output and real sent output must match the same data model

### 2. Mount the Email Template Editor in real product UI

The editor component exists, but it is not yet reachable from invoicing settings.

Required result:

- wire `EmailTemplateEditor` into the invoicing settings experience
- preserve the existing settings form and structure cleanly
- do not create a dead-end route or admin-only hidden surface unless that is already the established pattern

### 3. Complete lifecycle-triggered email coverage

INVFIX-09 is not done while the product is still split between the old hardcoded email service and the new template system.

The next pass must reconcile that split.

Required real event coverage:

1. invoice sent
2. payment received / receipt
3. overdue reminder flow
4. late fee notice
5. credit note issued
6. recurring invoice generated
7. account statement

Requirements:

- use the new template system for the final supported lifecycle paths
- remove duplicate customer sends from recurring generation
- do not leave the old and new systems both actively sending for the same event
- if a legacy path must remain temporarily for a truly separate use case, document the boundary clearly in code and memory bank

### 4. Add the missing per-event settings/toggles

The Session 12 prompt required event-level control, and the audit found no typed settings/UI for it.

Required controls:

- `onInvoiceSent`
- `onPaymentReceived`
- `onOverdueReminder`
- `onCreditIssued`
- `onRecurringGenerated`

Implementation rules:

- prefer extending the existing settings model cleanly
- if the current schema does not have dedicated columns, use existing settings `metadata` in a typed, well-documented way rather than inventing a new table
- the UI must expose the toggles in a real settings surface
- the send paths must actually respect them

### 5. Finish the dunning flow to the guide’s quality bar

The audit found real staged-dunning work, but it still does not satisfy the full requested behavior.

Required behavior:

- day 1 overdue: gentle reminder
- day 7 overdue: reminder
- day 14 overdue: urgent reminder
- day 21 overdue: final notice
- day 30 overdue: late fee if enabled
- day 45 overdue: admin follow-up flag
- day 60 overdue: write-off candidate flag

Each stage must:

- be idempotent
- log activity
- respect settings
- avoid duplicate sends
- fire the right automation event or equivalent platform event

Do not leave the current reminder schedule and staged dunning logic half-overlapping in a way that makes the actual lifecycle ambiguous.

### 6. Wire the dunning timeline into invoice detail and add the missing controls

The current timeline component exists but is not wired into invoice detail, and the required manual actions were not implemented.

Required UX:

- show dunning history on invoice detail
- show current stage / write-off state clearly
- add manual `Send Reminder Now`
- add per-invoice `Pause Dunning`

Implementation rules:

- reuse the existing activity-log and overdue-service patterns
- if there is no dedicated DB column for pause state, use existing invoice/settings metadata or another already-supported storage pattern
- do not invent a new table just to store one pause flag

### 7. Make the account-statement template real or remove the false completion claim

The template definition exists, but the audit found no real statement email send path.

Required result:

- either implement a real account-statement send flow using existing statement surfaces
- or explicitly document why it cannot be treated as complete and stop claiming INVFIX-09 closure

For this session, the goal is to make it real.

## Quality Bar

This session is only done if all of the following are true:

- the template renderer uses one correct variable contract end-to-end
- no duplicate recurring invoice emails are possible
- invoice sent, payment received/receipt, overdue reminders, late-fee notices, credit notes, recurring invoices, and account statements all route through the intended final email system
- event toggles exist in a real settings surface and are respected by the send paths
- the email template editor is reachable in the invoicing UI
- the dunning timeline is mounted in invoice detail
- manual `Send Reminder Now` and `Pause Dunning` are implemented
- dunning staging is coherent, idempotent, and guide-aligned
- no new invoicing TypeScript regressions are introduced

If any one of those is false, do **not** claim INVFIX-09 is complete.

## Files Likely In Scope

- `next-platform-dashboard/src/modules/invoicing/services/email-template-service.ts`
- `next-platform-dashboard/src/modules/invoicing/services/email-autosend-service.ts`
- `next-platform-dashboard/src/modules/invoicing/services/email-service.ts`
- `next-platform-dashboard/src/modules/invoicing/services/overdue-service.ts`
- `next-platform-dashboard/src/modules/invoicing/components/email-template-editor.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/dunning-timeline.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/invoicing-settings-form.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/invoice-detail.tsx`
- `next-platform-dashboard/src/modules/invoicing/actions/invoice-actions.ts`
- `next-platform-dashboard/src/modules/invoicing/actions/payment-actions.ts`
- `next-platform-dashboard/src/modules/invoicing/actions/credit-actions.ts`
- `next-platform-dashboard/src/modules/invoicing/actions/recurring-actions.ts`
- `next-platform-dashboard/src/modules/invoicing/actions/settings-actions.ts`
- `next-platform-dashboard/src/modules/invoicing/actions/statement-actions.ts` if statement email wiring is done there
- relevant invoicing route files for settings and invoice detail if UI wiring requires it

## Constraints

- Keep changes additive and focused.
- All money stays in cents internally.
- Do not invent new tables for this session.
- Prefer existing settings/invoice `metadata` over schema sprawl if a small state flag is needed.
- Preserve the current report-side INVFIX-08 work unless a tiny supporting fix is unavoidable.
- Do not leave two competing email systems partially active for the same lifecycle event.
- The repo may still contain unrelated local changes. Do not disturb them.

## Required Process

1. Run `git status --short` and inspect current invoicing-related diffs first.
2. Capture a TypeScript baseline from `next-platform-dashboard`.
3. Audit the existing Session 12 email/dunning files before editing.
4. Normalize the render/template contract first.
5. Complete lifecycle wiring and remove duplicate/legacy overlap.
6. Mount the template editor and dunning timeline in real UI surfaces.
7. Add manual dunning controls and event toggles.
8. Re-run targeted diagnostics for every touched invoicing file.
9. Re-run the invoicing-focused TypeScript check.
10. Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the true state.
11. Commit only if INVFIX-09 is actually complete.

## Done Criteria

This session is only fully done if:

- INVFIX-09 is genuinely complete by the quality bar above
- the product UI exposes the new email/dunning surfaces in reachable places
- lifecycle email behavior is coherent and non-duplicative
- no new invoicing TypeScript errors were introduced
- memory bank reflects the true post-session state

If the work remains partial, document the exact carryover instead of rolling into INVFIX-10.

## Final Output Required From The Agent

At the end of the session, provide:

1. A concise summary of what INVFIX-09 gaps were closed.
2. Any remaining gaps, if any.
3. Exact files changed.
4. TypeScript validation result.
5. A clear statement of whether INVFIX-09 is now truly complete.
6. A clear statement that INVFIX-10 was intentionally not started unless INVFIX-09 was fully closed and the user explicitly redirected scope.

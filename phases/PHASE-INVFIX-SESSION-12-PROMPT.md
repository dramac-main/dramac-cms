# DRAMAC CMS — INVFIX Session 12 Prompt

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

This is now a **combined Session 12**.

User direction is clear: compress the remaining roadmap aggressively, but do it without another shallow or misleading “done” pass.

That means this session must be run as a **gated two-part implementation**:

- **Part A — finish the remaining INVFIX-08 report-spec gaps**
- **Part B — immediately continue into INVFIX-09** only if Part A is genuinely complete, re-validated, and TypeScript-clean relative to baseline

Do **not** start the email-system work while report closure is still questionable.

If Part A is not truly closed, stop there and document the exact carryover rather than pretending the combined session finished both phases.

## Hard Scope

This session covers **INVFIX-08 final spec closure + INVFIX-09**.

However, the scope is **sequential, not parallel**:

1. Finish the remaining INVFIX-08 report gaps first.
2. Re-validate the report stack.
3. Only then begin INVFIX-09.

## Part A — Remaining Verified INVFIX-08 Gaps

### 1. AR Aging — Collection Probability

The master guide still requires collection probability based on AI risk scores.

What exists already:

- `getClientRiskScore()` in `src/modules/invoicing/actions/ai-actions.ts`
- `client-risk-badge.tsx` as a reusable risk UI surface

What is still missing:

- no collection-probability data in the AR aging report types/actions
- no risk/probability surface in `ar-aging-report.tsx`

Close this by integrating the existing AI risk hook in a lightweight, safe way. If a full per-row live risk lookup is too expensive, implement a defensible fallback pattern and document it clearly in code/UI and memory bank.

### 2. Cash Flow Report — Projected Forecast

The master guide still calls for projected cash flow in the report surface.

What exists already:

- `CashFlowForecastChart` in the invoicing insights module
- `getCashFlowReport()` already carries `hasProjectedData`, but currently returns `false`

What is still missing:

- the cash flow report does not surface forecast data
- the report action still disables projected data

Integrate the existing forecast surface into the report experience, or implement a clearly documented fallback if the synchronous report surface cannot safely call the AI forecast path directly.

### 3. Tax Summary — Filing-Oriented Export

What exists already:

- `getTaxSummary()` returns `byFilingPeriod`
- `tax-summary-report.tsx` renders the filing-period table

What is still missing:

- `exportReportCSV("tax")` still exports only by-rate data + totals
- the export does not yet reflect filing-period structure for tax filing use

Close this by making the tax export actually useful for filing workflows.

### 4. Cross-Module Report — Module Health Scorecards

The master guide still calls for module health scorecards in the unified cross-module report.

What exists already:

- revenue overview tab
- client activity tab

What is still missing:

- no module health scorecards or equivalent cross-module health summary in `cross-module-report.tsx`

Implement a compact, defensible scorecard surface using the data already available in the report stack. Do not invent new tables for this.

### Part A success gate

You may only move to Part B if all of the following are true:

- AR aging includes a defensible collection-probability surface or clearly documented fallback
- projected cash flow is surfaced or explicitly resolved with a clear, honest fallback
- tax export includes filing-oriented structure
- cross-module report includes module health scorecards or equivalent guide-aligned health summary
- no new invoicing TypeScript errors were introduced by the report work

If any one of those is false, stop after Part A and document the exact carryover.

## Part B — INVFIX-09 Email System

Once Part A is closed and re-validated, implement INVFIX-09 comprehensively.

### 1. Email Template System

Create the professional template system described in the master guide.

Primary deliverables:

- `src/modules/invoicing/services/email-template-service.ts`
- `src/modules/invoicing/components/email-template-editor.tsx`

Required template coverage:

1. Invoice Created / Sent
2. Invoice Reminder
3. Invoice Overdue (Gentle)
4. Invoice Overdue (Urgent)
5. Invoice Overdue (Final)
6. Payment Received
7. Payment Receipt
8. Credit Note Issued
9. Recurring Invoice Generated
10. Statement

Each template must:

- use site branding from invoicing settings
- support preview with mock data
- support subject/body customization
- fall back to professional defaults
- persist in `mod_invmod01_settings.email_templates`

### 2. Auto-Send on Status Change

Update the invoicing lifecycle so email dispatch is tied to real business events.

Required event coverage:

- invoice status becomes `sent`
- invoice becomes `overdue`
- payment recorded
- credit note issued
- recurring invoice generated (when enabled)

Also add per-event settings toggles consistent with the master guide:

- `onInvoiceSent`
- `onPaymentReceived`
- `onOverdueReminder`
- `onCreditIssued`
- `onRecurringGenerated`

### 3. Dunning Escalation

Replace the simple overdue reminder behavior with a real staged dunning flow in `overdue-service.ts`.

Required stages:

- Day 1 overdue: gentle reminder
- Day 7 overdue: reminder
- Day 14 overdue: urgent reminder
- Day 21 overdue: final notice
- Day 30 overdue: late fee if enabled
- Day 45 overdue: admin follow-up flag
- Day 60 overdue: write-off candidate flag

Each stage must:

- log activity
- fire automation events
- respect settings
- avoid duplicate sends/stage repeats

### 4. Dunning Timeline UI

Create `src/modules/invoicing/components/dunning-timeline.tsx` and wire it into invoice detail.

Required UX:

- visible dunning history
- stage and timestamp visibility
- manual “Send Reminder Now” action
- per-invoice “Pause Dunning” control

### 5. Quality bar for Part B

Do not ship placeholders.

This phase is only done if:

- all 10 template types exist with real defaults
- the editor previews branded output with mock data
- lifecycle-triggered emails actually hook into real invoicing actions/services
- dunning escalation is staged, idempotent, and settings-aware
- the invoice detail surface shows dunning history/actions
- no new invoicing TypeScript regressions are introduced

## Files Likely In Scope

- `next-platform-dashboard/src/modules/invoicing/actions/report-actions.ts`
- `next-platform-dashboard/src/modules/invoicing/types/report-types.ts`
- `next-platform-dashboard/src/modules/invoicing/components/cash-flow-chart.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/cash-flow-forecast-chart.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/ar-aging-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/client-risk-badge.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/tax-summary-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/cross-module-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/actions/ai-actions.ts` only if integration requires it
- `next-platform-dashboard/src/modules/invoicing/services/email-template-service.ts`
- `next-platform-dashboard/src/modules/invoicing/components/email-template-editor.tsx`
- `next-platform-dashboard/src/modules/invoicing/services/overdue-service.ts`
- `next-platform-dashboard/src/modules/invoicing/components/dunning-timeline.tsx`
- `next-platform-dashboard/src/modules/invoicing/actions/invoice-actions.ts`
- any existing invoicing email/receipt services needed to integrate real lifecycle emails

## Constraints

- Follow existing invoicing patterns and keep changes additive.
- All money stays in cents internally.
- Use real module tables and existing AI/report surfaces only.
- Do not invent new tables for this session.
- Use `mapRecord()` / `mapRecords()` when returning raw Supabase data to typed consumers.
- Keep dashboard routes aligned to `/dashboard/sites/[siteId]/invoicing/...`.
- Preserve the existing CSV escaping/serialization helpers and the live report-hub routes.
- The repo already has unrelated local modifications. Do not disturb them.
- Do not rely on the combined scope as an excuse for half-finished email infrastructure. If Part B starts, it must be implemented comprehensively.

## Required Process

1. Run `git status --short` and inspect existing diffs before editing.
2. Capture a TypeScript baseline from `next-platform-dashboard`.
3. Audit the current report implementation against the INVFIX-08 section of the master guide.
4. Implement Part A only: the remaining report gaps above.
5. Re-run targeted diagnostics for the report files you touched.
6. Re-run the invoicing-focused TypeScript check for Part A.
7. If Part A is genuinely closed, continue into Part B and implement INVFIX-09.
8. Re-run targeted diagnostics for the email/dunning files you touched.
9. Re-run the invoicing-focused TypeScript check for the combined session.
10. Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the true post-session status.
11. Commit only if the combined scoped work that was actually attempted is genuinely complete.

## Done Criteria

This session is only fully done if all of the following are true:

- Part A closes the remaining INVFIX-08 report-spec gaps with defensible implementations or explicit honest fallbacks
- Part B implements INVFIX-09 comprehensively: templates, editor, event-driven auto-send, staged dunning, and dunning timeline/actions
- no new invoicing TypeScript errors were introduced
- memory bank reflects the true state

If Part A closes but Part B remains partial, report that clearly. If Part A does not close, do **not** claim INVFIX-09 work as complete.

## Final Output Required From The Agent

At the end of the session, provide:

1. A concise summary of what remaining INVFIX-08 gaps were closed.
2. A concise summary of what INVFIX-09 work was completed, if Part B was reached.
3. Any remaining gaps, if any.
4. Exact files changed.
5. TypeScript validation result.
6. A clear statement of whether INVFIX-08 is now truly closed and whether INVFIX-09 was fully completed.

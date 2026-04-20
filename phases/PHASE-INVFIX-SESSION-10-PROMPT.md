# DRAMAC CMS — INVFIX Session 10 Prompt

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

Do **not** assume INVFIX-08 is fully complete.

The prior session landed useful work for cross-module reports, report hub categorization, print CSS, and export/print buttons, but a post-implementation audit found real carryover. Some correctness fixes were already applied after audit and must be preserved:

- `report-hub.tsx` links were corrected to the live dashboard route shape.
- `getCrossModuleClients()` now computes combined revenue before slicing to the visible top-N rows.
- report CSV exports now use centralized escaping/serialization in `report-actions.ts`.

Your job in this session is to **close the remaining INVFIX-08 carryover properly**.

## Hard Scope

This session is **INVFIX-08 carryover closure only**.

Do **not** begin INVFIX-09 unless all carryover below is fully implemented, validated, and TypeScript-clean relative to baseline. If carryover is larger than expected, stop after INVFIX-08 closure work and document what remains. Do not force progress into email-system work.

## Mission

Finish the report overhaul to the level described in the master guide, using the existing Session 9 code as the baseline instead of rewriting it.

## Required Carryover To Close

### 1. Cash Flow Report Completion

Close the missing INVFIX-08 work in `report-actions.ts` and `cash-flow-chart.tsx`:

- include e-commerce revenue in cash-in
- include booking revenue in cash-in
- show net cash position per period
- add projected cash flow using existing AI/insights data if a reliable source already exists in the repo
- if no trustworthy AI forecast source exists, implement the structural hook and document the exact blocker instead of faking forecast data

### 2. Revenue Trends Completion

Finish `revenue-trends-report.tsx` so it includes:

- compare periods (current vs previous equivalent period)
- growth rate indicators
- revenue by client segment (top 10 vs other, or equivalent defensible segmentation based on available data)

### 3. P&L Completion

Finish `pnl-report.tsx` and supporting actions/types:

- operating expense breakdown
- gross margin calculation if it can be derived defensibly from current data
- YTD comparison
- export with proper headers suitable for spreadsheet use

Do not invent COGS data if the platform does not store it. If gross margin requires assumptions, make those assumptions explicit in code/comments/UI and keep them conservative.

### 4. AR Aging Completion

Finish `ar-aging-report.tsx` and supporting actions/types:

- click-through or drilldown to filtered invoice lists per aging bucket
- collection probability if a real AI/client-risk input already exists and can be safely reused
- weighted average days outstanding

If AI risk data is not reliably available, do not fabricate it. Degrade gracefully and document the fallback.

### 5. Tax Summary Completion

Finish `tax-summary-report.tsx` and supporting actions/types:

- filing-period breakdown (monthly / quarterly)
- export oriented toward tax filing use
- make liability vs collected comparison clear in UI and exported data

### 6. Expense Report Completion

Finish `expense-report.tsx` and supporting actions/types:

- budget vs actual comparison
- YoY expense trends where data exists
- top vendors by spend surfaced clearly

### 7. Report Export Completion

Current report surfaces expose CSV + print only. Close the remaining export requirement from INVFIX-08:

- add a real PDF export path for reports, or
- if the established platform pattern is browser-print-to-PDF only, standardize the report surfaces and document that decision clearly in code and memory bank instead of pretending a separate PDF pipeline exists

Do not implement a brittle fake-PDF button that only calls `window.print()` under a misleading label.

## Files Likely In Scope

- `next-platform-dashboard/src/modules/invoicing/actions/report-actions.ts`
- `next-platform-dashboard/src/modules/invoicing/types/report-types.ts`
- `next-platform-dashboard/src/modules/invoicing/components/cash-flow-chart.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/revenue-trends-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/pnl-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/ar-aging-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/tax-summary-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/expense-report.tsx`
- `next-platform-dashboard/src/modules/invoicing/components/cross-module-report.tsx` if needed for consistency
- `next-platform-dashboard/src/app/globals.css` only if print/export polish genuinely requires it

## Constraints

- Follow existing invoicing patterns and keep changes additive.
- All money stays in cents internally.
- Use real module tables only; do not invent new tables for this session unless the master guide explicitly requires one here.
- Use `mapRecord()` / `mapRecords()` when returning raw Supabase data to typed consumers.
- Keep dashboard routes aligned to `/dashboard/sites/[siteId]/invoicing/...`.
- Do not revert the existing post-audit fixes in `report-actions.ts` and `report-hub.tsx`.
- The repo may already have unrelated uncommitted changes. Do not disturb them.

## Required Process

1. Run `git status --short` and inspect existing diffs before editing.
2. Capture a TypeScript baseline from `next-platform-dashboard`.
3. Audit the current report implementation against the INVFIX-08 section of the master guide.
4. Implement only the remaining carryover.
5. Re-run targeted diagnostics for touched files.
6. Re-run the invoicing-focused TypeScript check.
7. Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the true post-session status.
8. Commit only if INVFIX-08 carryover is genuinely closed.

## Done Criteria

This session is only done if all of the following are true:

- the remaining INVFIX-08 report requirements above are implemented or explicitly resolved with defensible fallbacks
- report routing works from the report hub and drilldowns
- exports are robust and not broken by commas/quotes in data
- no new invoicing TypeScript errors were introduced
- memory bank reflects the true state

If all of that is not true, do **not** declare INVFIX-08 complete and do **not** move to INVFIX-09.

## Final Output Required From The Agent

At the end of the session, provide:

1. A concise summary of what carryover was closed.
2. Any remaining gaps, if any.
3. Exact files changed.
4. TypeScript validation result.
5. A clear statement of whether INVFIX-08 is now truly closed.

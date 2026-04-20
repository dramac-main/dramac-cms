# DRAMAC CMS — Invoice Overhaul Session 7

## Scope: Finish Verified INVFIX-04/05 Production Blockers, Then Start INVFIX-06 Only If Clean

> This is the authoritative prompt for Session 7.
> Do not start INVFIX-07 in this session.
> Do not assume Session 6 was fully closed just because code was pushed.

---

## Your Job

You are continuing the invoicing overhaul after a post-session audit found that Session 6 made strong code progress but did **not** fully close INVFIX-04 and INVFIX-05 for production.

Your job is to:

1. Verify and fix the remaining INVFIX-04/05 production blockers first.
2. Re-validate schema, runtime behavior, and TypeScript for those fixes.
3. Only if the blockers are actually closed, begin INVFIX-06.

This is a controlled continuation session. Do not skip the preflight closure work.

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
9. `/phases/PHASE-INVFIX-SESSION-07-PROMPT.md`

Then inspect the current working tree before editing anything:

1. Run `git status --short`
2. Review existing invoicing-related diffs already present in the repo
3. Treat the working tree as partially advanced, not as a clean baseline

---

## Current Verified Reality

The invoicing module is still on the correct **manual-collection-only** direction.

That part is not in question.

What is in question is whether the Session 6 closure was production-safe.

### Verified audit findings you must treat as real

1. Live Supabase still has old Stripe settings columns in `mod_invmod01_settings`.
2. Live Supabase is still missing:
   - `mod_invmod01_payments.receipt_number`
   - `mod_invmod01_recurring_invoices.processing_started_at`
   - `mod_invmod01_recurring_invoices.notify_before_generation`
3. The current migration file no longer adds Stripe columns, but it also does not drop the live Stripe columns that still exist.
4. Payment and receipt numbering still use a `MAX(...)` / highest-value lookup followed by insert, with no unique constraint or locking guarantee.
5. `getPaymentReceipt()` still falls back to deriving an `RCT-*` identifier from `payment_number` if `receipt_number` is absent.
6. `notifyBeforeGeneration` is persisted, but the recurring engine does not yet consume it to send a pre-generation notification.
7. `recurring-engine-service.ts` currently hardcodes a sender (`DRAMAC CMS <noreply@dramac.net>`) instead of using the shared platform email helper.

### Architecture rules that still stand

1. Do **not** reintroduce Stripe into the invoicing module.
2. Paddle remains the platform billing provider.
3. The invoice module remains manual-collection only: bank transfer, mobile money, cash, cheque, other.
4. Do **not** move into INVFIX-07 or later phases in this session.

---

## Phase 0: Production-Closure Preflight for INVFIX-04/05

Before starting INVFIX-06, close these issues first.

### 0.1 — Reconcile Repo Migrations With Live Schema

Required outcome:

1. The repo migration story must match the actual desired architecture.
2. Add or correct migration SQL so live schema ends up with:
   - manual-payment settings columns present
   - `receipt_number` present
   - `processing_started_at` present
   - `notify_before_generation` present
   - Stripe invoice-module settings columns removed if they are no longer part of the supported architecture
3. Verify the schema directly after the migration work.

### 0.2 — Make Payment and Receipt Numbering Defensible Under Concurrency

Required outcome:

1. Replace the current `MAX(...) + 1` pattern with a truly production-defensible approach.
2. Add the needed DB guarantees, for example:
   - unique constraints or indexes
   - sequence-backed or locked number generation
   - transactional safety against duplicate issuance
3. Ensure both public payment submission and dashboard-recorded payment flows use the same hardened strategy.

### 0.3 — Finish Receipt Identifier Persistence Properly

Required outcome:

1. `getPaymentReceipt()` should not rely on a derived fallback for newly created records.
2. Decide how to handle legacy records without `receipt_number`:
   - backfill them, or
   - clearly separate legacy fallback behavior from the main persisted path
3. Receipt rendering must be truthful about whether the identifier is persisted or legacy-derived.

### 0.4 — Finish Recurring Notification Closure Properly

Required outcome:

1. The `notifyBeforeGeneration` toggle must drive actual pre-generation notification behavior, or be explicitly deferred and documented.
2. If implemented now, it should send a clear pre-generation notice based on the configured preference.
3. Failure alert email in `recurring-engine-service.ts` must use the shared sender helper rather than a hardcoded sender.

### 0.5 — Re-Verify Session 6 Claims After Fixes

Required outcome:

1. Re-run TypeScript checks for all touched invoicing files.
2. Re-run the `next-platform-dashboard` baseline and confirm no new invoicing-specific regressions.
3. Re-verify the live schema directly.
4. Re-test public payment submission, receipt generation, and recurring cron behavior.

If any of the above remains partial, do **not** claim INVFIX-04 and INVFIX-05 are closed.

---

## Phase 1: Start INVFIX-06 Only If Phase 0 Is Actually Clean

If and only if the production-closure preflight is complete, start INVFIX-06.

### INVFIX-06 Scope

Focus only on:

1. Purchase order receive tracking
2. Bill payment wiring from bill detail
3. Three-way match (PO ↔ bill ↔ receipt)
4. Vendor enhancement fields and metrics

### INVFIX-06 Minimum Required Outcomes

1. Purchase order line-item receipt tracking exists and updates PO state cleanly.
2. Bill detail page actually wires the bill payment dialog and shows payment history/balance.
3. A usable three-way match tool highlights discrepancies and offers resolution actions.
4. Vendor records support payment terms, preferred payment method, bank details, and basic vendor metrics.

Do **not** broaden into INVFIX-07.

---

## Files Most Likely In Scope

Preflight closure work:

- `next-platform-dashboard/migrations/*`
- `src/app/api/invoicing/pay/[token]/route.ts`
- `src/modules/invoicing/actions/payment-actions.ts`
- `src/modules/invoicing/actions/recurring-actions.ts`
- `src/modules/invoicing/services/recurring-engine-service.ts`
- `src/modules/invoicing/components/public-payment-form.tsx`
- `src/modules/invoicing/components/payment-receipt-pdf.tsx`

INVFIX-06 work:

- `src/modules/invoicing/actions/purchase-order-actions.ts`
- `src/modules/invoicing/actions/bill-actions.ts`
- `src/modules/invoicing/components/bill-detail.tsx`
- `src/modules/invoicing/components/bill-payment-dialog.tsx`
- `src/modules/invoicing/components/po-receive-form.tsx`
- `src/modules/invoicing/components/three-way-match.tsx`
- `src/modules/invoicing/components/vendor-form.tsx`
- `src/modules/invoicing/components/vendor-detail.tsx`
- relevant dashboard pages under `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/`

---

## Hard Rules

1. Do not assume Session 6 was fully closed.
2. Do not reintroduce Stripe into invoicing.
3. Do not start INVFIX-07.
4. Do not ignore live-schema verification.
5. Do not keep count-based or MAX-based document numbering if it is still race-prone.
6. Do not overwrite existing working-tree changes blindly.
7. Do not mark INVFIX-04 or INVFIX-05 complete unless schema, runtime behavior, and receipt numbering are actually production-safe.

---

## Verification Before Finishing

Run and check:

1. `git status --short` before and after your changes.
2. TypeScript / diagnostics for all touched invoicing files.
3. Full `next-platform-dashboard` baseline and confirm no new invoicing-specific breakage.
4. Direct live-schema verification for the required invoicing columns and Stripe-column cleanup.
5. Payment number and receipt number generation under a concurrency-safe design.
6. Public payment behavior with `onlinePaymentEnabled` disabled and enabled.
7. Receipt rendering for both newly created and legacy payment records.
8. Recurring engine lock behavior, structured history, failure alerting, and pre-generation notification behavior if implemented.
9. If Phase 1 was reached, verify PO receiving, bill payment wiring, and three-way match flows manually.

---

## End-of-Session Requirements

If the session actually closes the production blockers and makes good INVFIX-06 progress:

1. Update `/memory-bank/activeContext.md`
2. Update `/memory-bank/progress.md`
3. Commit all intended changes with a precise message
4. Push only after verification is complete

If Phase 0 is not fully closed, do **not** pretend Session 7 completed INVFIX-06. Document the exact remaining blockers.
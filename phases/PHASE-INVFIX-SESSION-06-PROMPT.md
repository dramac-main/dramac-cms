# DRAMAC CMS — Invoice Overhaul Session 6

## Scope: INVFIX-04 + INVFIX-05 Carryover Closure Only

> This is the authoritative detailed execution prompt for Session 6.
> The session brief has been updated to reflect this carryover-only session.
> Do not start INVFIX-06 in this session.

---

## Your Job

You are continuing the invoicing overhaul in a repo that already contains partially completed carryover work and a recent hotfix.

Do not stop at analysis. Build the missing pieces, verify them, then commit and push at the end if the touched invoicing work is clean.

This is a **closure session**, not a new phase.

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
9. `/phases/PHASE-INVFIX-SESSION-06-PROMPT.md`

Then inspect the current working tree before editing anything:

1. Run `git status --short`
2. Review existing invoicing-related diffs already present in the repo
3. Treat the current working tree as partially advanced, not as a clean baseline

---

## Current Verified Reality

The previous prompt is stale in one critical way: it still assumes the invoice module should finish a Stripe card-payment path.

That is no longer the correct direction.

### What is already true now

1. Stripe has been removed from the active invoicing module surface.
2. Paddle remains the platform billing provider.
3. The invoice module is now aligned to manual collection flows: bank transfer, mobile money, cash, cheque, and other.
4. The invoicing hotfix already fixed:
   - broken settings saves caused by a nonexistent `stripe_secret_key` column mapping
   - broken invoice list/detail/public rendering caused by raw snake_case action returns
   - wrong decimal-place behavior in the item catalog price editor
   - wrong public invoice totals mapping in `view/[token]/route.ts`

### What this means for this session

1. Do **not** reintroduce Stripe into invoicing settings, invoicing payment types, or the public invoice payment flow.
2. Finish INVFIX-04 using the corrected **manual-only invoice payment** direction.
3. Finish INVFIX-05 carryover on recurring UX, current linked-client resolution, and cron robustness.

---

## First Actions

Before writing code:

1. Confirm the current invoicing-related diffs already in the working tree.
2. Identify which of those changes are valid, partial, stale, or contradictory to the new manual-payment direction.
3. Run a TypeScript baseline from `next-platform-dashboard` with enough memory:

```powershell
Set-Location "d:\dramac-cms\next-platform-dashboard"
$env:NODE_OPTIONS="--max-old-space-size=8192"
pnpm exec tsc --noEmit
```

Important:

- Global TSC is known to have unrelated errors in other modules.
- Your goal is: no new invoicing-specific regressions, and touched files should stay clean.
- Do not chase unrelated portal, automation, live-chat, or support failures.

---

## Required Outcomes

### 1. Make Public Invoice Payment Behavior Coherent Under the Manual-Only Direction

Required outcome:

1. The public payment flow must be coherent for manual collection only.
2. `onlinePaymentEnabled` must have a real effect on public invoice payment behavior.
3. If online/manual submission is disabled, the public payment flow must not silently behave as enabled.
4. Bank transfer and mobile money instructions must be surfaced correctly when enabled.
5. No Stripe UI, settings path, or Stripe-specific API behavior should be reintroduced.

Minimum bar:

1. The public payment page cleanly supports bank transfer and mobile money instructions.
2. Manual payment submission creates a pending payment record only when the site is actually configured to accept that submission flow.
3. Disabled or incomplete payment configuration is handled explicitly in UI and server behavior.

### 2. Finish Receipt Numbering Properly

Current risk:

- There is partial receipt-number work in the repo, but it may still be using a weak count-based strategy and/or receipt fallback logic.

Required outcome:

1. Receipt numbering must be real, persisted, and stable.
2. Receipt rendering must use the real stored receipt identifier, not derive it from `payment_number`.
3. The approach should be production-defensible under concurrency.
4. Any schema needed for this must be represented by repo migration(s).

### 3. Reconciliation and Payment Surfaces Must Actually Close Cleanly

Required outcome:

1. Audit the current payment detail, receipt, reconciliation, and export work already in the tree.
2. Preserve valid work, fix partial work, and remove anything misleading.
3. Ensure payment reads use the correct snake_case to camelCase mapping discipline.
4. Ensure reconciliation updates invoice/payment state coherently.
5. Ensure routes and navigation point to the right payment screens.

### 4. Reconcile Migrations With the Correct Architecture

Current risk:

- There may already be local migration work in the repo that still assumes Stripe fields or other stale schema.

Required outcome:

1. The repo migration story must match the actual desired invoicing architecture.
2. Do not leave a migration that reintroduces Stripe invoice-module schema if the code no longer uses that direction.
3. Ensure required schema for manual payment settings, receipt numbering, recurring lock/history, and any new recurring fields exists in migrations.
4. If an existing local migration is stale, replace or correct it rather than layering confusion on top.

### 5. Finish the Recurring Template UX

Required outcome:

1. `recurring-form.tsx` must include the missing recurring UX improvements from INVFIX-05.
2. Preview the next **12** occurrences in the form, not only on the detail page.
3. Include amounts in that preview.
4. Add the missing client notification option(s) in a way that is saved and coherent.
5. Audit any already-started local work here instead of duplicating it.

### 6. Generate Recurring Invoices From Current Linked Data

Required outcome:

1. At generation time, resolve current linked client data instead of blindly using the old snapshot fields.
2. Support all relevant linked sources where applicable:
   - CRM contact
   - CRM company
   - storefront customer if the template is linked that way
3. Fall back safely when linked records are unavailable.
4. Generated invoices should remain accurate if contact/company/customer data changes after the recurring template was created.

### 7. Finish Cron Robustness Properly

Current risk:

- There may already be partial retry, lock, and alerting work in the tree, but it must be audited rather than assumed complete.

Required outcome:

1. Add or validate real duplicate-protection / claim-lock behavior.
2. Release locks safely on success and failure.
3. Persist structured generation history in a queryable form, not just vague text notes.
4. Send a clear failure alert to the correct owner source when generation fails.
5. Keep the implementation production-defensible and minimal.

---

## Files Most Likely In Scope

- `src/app/api/invoicing/pay/[token]/route.ts`
- `src/app/api/invoicing/view/[token]/route.ts`
- `src/modules/invoicing/actions/payment-actions.ts`
- `src/modules/invoicing/actions/reconciliation-actions.ts`
- `src/modules/invoicing/actions/settings-actions.ts`
- `src/modules/invoicing/actions/recurring-actions.ts`
- `src/modules/invoicing/actions/invoice-actions.ts`
- `src/modules/invoicing/components/public-payment-form.tsx`
- `src/modules/invoicing/components/invoicing-settings-form.tsx`
- `src/modules/invoicing/components/payment-detail.tsx`
- `src/modules/invoicing/components/payment-list.tsx`
- `src/modules/invoicing/components/payment-receipt-pdf.tsx`
- `src/modules/invoicing/components/reconciliation-tool.tsx`
- `src/modules/invoicing/components/recurring-form.tsx`
- `src/modules/invoicing/components/recurring-schedule-preview.tsx`
- `src/modules/invoicing/components/recurring-detail.tsx`
- `src/modules/invoicing/components/recurring-list.tsx`
- `src/modules/invoicing/services/recurring-engine-service.ts`
- `next-platform-dashboard/migrations/*`

---

## Hard Rules

1. Do not start INVFIX-06.
2. Do not broaden scope into vendors, bills, purchase orders, or other later phases.
3. Do not reintroduce Stripe into the invoicing module.
4. Do not confuse Paddle platform billing with invoice-module payment collection.
5. Do not overwrite or revert existing working-tree changes blindly. Audit them first.
6. Do not leave schema changes untracked in repo migrations.
7. Do not claim completion if receipt numbering, recurring generation accuracy, or cron history are still partial.
8. Do not refactor unrelated invoicing areas just because they are nearby.

---

## Done Criteria

You are done only when all of the following are true:

1. Public invoice payment behavior is coherent under the manual-only direction.
2. `onlinePaymentEnabled` materially affects public payment behavior.
3. Receipt numbering is real, persisted, and stable.
4. Reconciliation and payment detail/receipt flows are coherent and mapped correctly.
5. Repo migrations match the actual desired manual-payment and recurring schema.
6. Recurring form includes next 12 occurrences with amounts and the missing notification UX.
7. Generated recurring invoices use current linked data when available.
8. Cron robustness includes real duplicate protection, failure alerting, and structured history.
9. Touched invoicing files have no new TypeScript regressions.

---

## Verification Before Finishing

Run and check:

1. `git status --short` before and after your changes.
2. TypeScript / diagnostics for all touched invoicing files.
3. Full TSC baseline from `next-platform-dashboard` and confirm no new invoicing-specific breakage.
4. Public payment behavior for:
   - online/manual payment disabled
   - bank transfer enabled
   - mobile money enabled
5. Receipt generation and receipt-number behavior.
6. Reconciliation flow from pending payment to matched invoice.
7. Recurring form preview and saved-template behavior.
8. Manual recurring generation after changing linked client/company/customer data.
9. Cron failure path: lock behavior, history persistence, and alerting.

If anything remains partial, document exactly what remains and why. Do not falsely mark INVFIX-04 or INVFIX-05 complete.

---

## End-of-Session Requirements

If and only if the session is actually complete:

1. Update `/memory-bank/activeContext.md`
2. Update `/memory-bank/progress.md`
3. Commit all intended changes with a precise message, for example:

```bash
git add -A
git commit -m "feat(invfix): close INVFIX-04/05 carryover"
git push origin main
```

If the work is not actually closed, do **not** force a completion commit. Document the remaining carryover clearly instead.

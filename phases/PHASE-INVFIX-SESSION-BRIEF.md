# INVFIX — Invoice Module Overhaul Session Brief

> **Module**: Invoicing & Financial Management (overhaul)  
> **Guide**: `phases/PHASE-INVFIX-MASTER-GUIDE.md`  
> **Total Phases**: 12 (INVFIX-01 through INVFIX-12)  
> **Current Execution Plan**: 15 sessions  
> **Why the plan changed**: INVFIX-04 and INVFIX-05 required a dedicated carryover closure session, INVFIX-07 needed its own session, Session 10 verification confirmed INVFIX-08 needed a dedicated carryover-closure session, the user then explicitly requested an aggressive endgame compression, and the Session 12 verification later showed that INVFIX-08 closed but INVFIX-09 only landed partially. The next pass must therefore finish INVFIX-09 before the roadmap can safely compress again.

---

## Current Execution Note

The original 10-session estimate is no longer the active execution plan.

As of April 20, 2026:

1. INVFIX-01 through INVFIX-07 are verified complete.
2. Session 9 landed the initial INVFIX-08 cross-module report work.
3. Session 10 verification found that the remaining INVFIX-08 carryover is still open.
4. Session 11 landed real report improvements, but the master-guide audit still found a few remaining INVFIX-08 gaps.
5. Session 12 appears to have closed the remaining INVFIX-08 report-spec gaps.
6. Session 12 also landed substantial INVFIX-09 work, but the verification audit found it incomplete: the new email/dunning system is only partially wired into the product and still has lifecycle, UI-mounting, and control-surface gaps.
7. The active execution plan is therefore now a **dedicated Session 13 closure pass for INVFIX-09**.
8. The safest remaining merge after that is still INVFIX-10 + INVFIX-11 because both are portal-facing and share site-scoped UX and permission testing.
9. A 2-session finish is still possible in theory, but not the operating plan, because combining unfinished email-system carryover with portal and cleanup work would likely reduce verification quality.
10. If a session has a dedicated prompt file, follow that prompt over the generic phase mapping.

---

## Session-to-Phase Mapping

| Session        | Phases                | Focus                                                                                       | Priority    |
| -------------- | --------------------- | ------------------------------------------------------------------------------------------- | ----------- |
| **Session 1**  | INVFIX-01             | Settings auto-populate from site branding + invoice form UX                                 | 🔴 Critical |
| **Session 2**  | INVFIX-02             | Calculation engine fix, line item validation, live preview                                  | 🔴 Critical |
| **Session 3**  | INVFIX-03             | CRM deep integration, e-commerce item import, catalog picker                                | 🔴 Critical |
| **Session 4**  | INVFIX-04             | Payments foundation work landed, but closure still pending                                  | 🟠 High     |
| **Session 5**  | INVFIX-05             | Recurring lifecycle work landed, but closure still pending                                  | 🟠 High     |
| **Session 6**  | INVFIX-04 + INVFIX-05 | Carryover closure only: manual payment flow, receipts, reconciliation, recurring robustness | 🔴 Critical |
| **Session 7**  | INVFIX-06             | Vendors, bills, purchase orders, receive tracking, 3-way match                              | 🟠 High     |
| **Session 8**  | INVFIX-07             | Expenses closure: approval workflow, receipt viewer, budgets, mileage/per-diem audit        | 🟠 High     |
| **Session 9**  | INVFIX-08             | Reports overhaul — central hub, cross-module data, export polish                            | 🟡 Medium   |
| **Session 10** | INVFIX-08             | Verification audit only; reports carryover remained open                                    | 🔴 Critical |
| **Session 11** | INVFIX-08             | Major carryover closure landed, but verification still found a few remaining spec gaps         | 🔴 Critical |
| **Session 12** | INVFIX-08 + INVFIX-09 | Reports appear closed; email-system work landed partially and must be re-verified as carryover | 🔴 Critical |
| **Session 13** | INVFIX-09             | Finish email templates, lifecycle auto-send, dunning controls, and settings wiring             | 🔴 Critical |
| **Session 14** | INVFIX-10 + INVFIX-11 | Client portal invoicing experience + Ask Chiko portal expansion                                | 🟠 High     |
| **Session 15** | INVFIX-12             | Delivery notes, route cleanup, admin dashboard, quote-to-invoice, final polish                 | 🟡 Medium   |

---

## Compressed Remaining Plan (Recommended)

From the current audited state, the active remaining roadmap is now **3 focused sessions**.

| Remaining Session | Phases                | Focus                                                                                                     | Why This Merge Is Safe                                                                 |
| ----------------- | --------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Session 13**    | INVFIX-09             | Finish email templates, lifecycle auto-send coverage, dunning controls, UI mounting, and settings wiring | Session 12 proved the new subsystem is real, but not yet product-complete              |
| **Session 14**    | INVFIX-10 + INVFIX-11 | Client portal invoicing experience + Ask Chiko portal expansion and scoped assistant UX                   | Both are portal-facing and share site-scoped data, permissions, and user-flow testing  |
| **Session 15**    | INVFIX-12             | Delivery notes, route cleanup, admin dashboard, quote-to-invoice, final polish                            | Final cleanup and delivery-note work still deserve a concentrated validation pass       |

### Why This Is The Active Compression

1. **Session 13 must close the partial email-system landing before anything else.** The template editor, auto-send layer, and dunning timeline exist, but they are not yet wired into a complete, trustworthy product flow.
2. **INVFIX-10 + INVFIX-11 remain the safest downstream merge.** Both phases are portal-facing, both depend on site-scoped permissions, and both benefit from one integrated QA pass.
3. **INVFIX-12 still stands alone.** Delivery notes, route cleanup, admin controls, and final polish are too easy to shortchange if bundled into the same pass as portal and assistant work.

### Ultra-Aggressive Compression (Still Not Recommended)

It is technically possible to force the remaining work into **2 sessions**, but that raises delivery risk and weakens verification.

If forced, the least-bad aggressive option would now be:

- Session 13: INVFIX-09
- Session 14: INVFIX-10 + INVFIX-11 + INVFIX-12

That plan is **not** the operating plan because it would compress portal invoicing, Ask Chiko portal expansion, delivery notes, admin cleanup, and final polish into one final pass immediately after an email-system carryover session.

---

## Dedicated Prompt Override

Use a dedicated session prompt whenever one exists.

- Session 6 authoritative prompt: `phases/PHASE-INVFIX-SESSION-06-PROMPT.md`
- Session 6 quick handoff version: `phases/PHASE-INVFIX-SESSION-06-QUICK-PROMPT.md`
- Session 7 authoritative prompt: `phases/PHASE-INVFIX-SESSION-07-PROMPT.md`
- Session 8 authoritative prompt: `phases/PHASE-INVFIX-SESSION-08-PROMPT.md`
- Session 10 authoritative prompt: `phases/PHASE-INVFIX-SESSION-10-PROMPT.md`
- Session 11 authoritative prompt: `phases/PHASE-INVFIX-SESSION-11-PROMPT.md`
- Session 12 authoritative prompt: `phases/PHASE-INVFIX-SESSION-12-PROMPT.md`
- Session 13 authoritative prompt: `phases/PHASE-INVFIX-SESSION-13-PROMPT.md`

Rules:

1. Read the dedicated prompt after the memory bank and master guide.
2. Treat dedicated prompt instructions as the source of truth for that session's scope and done criteria.
3. Do not rely on the generic historical mapping if the dedicated prompt says the session must begin with a carryover or production-closure pass.

---

## Universal Session Prompt

Copy-paste this at the start of any general INVFIX session:

```
Read all memory bank files in /memory-bank/ first. Then read phases/PHASE-INVFIX-MASTER-GUIDE.md and phases/PHASE-INVFIX-SESSION-BRIEF.md. If the current session has a dedicated prompt file, read and follow that prompt next. Audit git status before editing, capture a TypeScript baseline from next-platform-dashboard, keep scope limited to the assigned phase or carryover, and update memory bank at the end.
```

---

## Context Loss Recovery Prompts

### "I don't know what this project is"

```
Read ALL files in /memory-bank/ — start with projectbrief.md, then productContext.md, systemPatterns.md, techContext.md, activeContext.md, and progress.md. This is the DRAMAC CMS platform — an enterprise multi-tenant CMS. The invoicing module is being overhauled. Then read phases/PHASE-INVFIX-MASTER-GUIDE.md and phases/PHASE-INVFIX-SESSION-BRIEF.md.
```

### "What was I working on?"

```
Read /memory-bank/activeContext.md and /memory-bank/progress.md to see the current state. Then read phases/PHASE-INVFIX-SESSION-BRIEF.md to find the current execution mapping. If the active session has a dedicated prompt file, read that file before making assumptions about scope.
```

### "What should I do next?"

```
Read /memory-bank/progress.md to see what is actually complete. Then read phases/PHASE-INVFIX-SESSION-BRIEF.md for the current execution plan. If the active session has a dedicated prompt, use that file instead of the old generic mapping. For the next invoicing session, use phases/PHASE-INVFIX-SESSION-13-PROMPT.md.
```

### "I hit an error / something broke"

```
Capture the current TypeScript baseline from next-platform-dashboard, read /memory-bank/activeContext.md for recent decisions, then read the relevant phase in phases/PHASE-INVFIX-MASTER-GUIDE.md plus any dedicated session prompt. Fix the error without refactoring unrelated code or ignoring the carryover instructions.
```

---

## Pre-Session Checklist

Before every session:

- [ ] Read all 6 memory bank files
- [ ] Read the relevant phase(s) from the master guide
- [ ] Read the dedicated session prompt if one exists
- [ ] Run `git status --short` and inspect existing invoicing-related diffs
- [ ] Run the TypeScript baseline from `next-platform-dashboard`
- [ ] Note the baseline and any pre-existing carryover in the session

## Post-Session Checklist

After every session:

- [ ] Re-run TypeScript for touched invoicing files and compare with baseline
- [ ] Re-run the full `next-platform-dashboard` baseline and confirm no new invoicing-specific regressions
- [ ] Test the implemented features manually
- [ ] Update `/memory-bank/activeContext.md` with current state
- [ ] Update `/memory-bank/progress.md` with completed or remaining phases
- [ ] Commit and push only if the scoped work is actually complete
- [ ] If the work remains partial, document the exact carryover instead of forcing a completion commit

---

## Key Files Quick Reference

| Category         | Path                                                           |
| ---------------- | -------------------------------------------------------------- |
| Master Guide     | `phases/PHASE-INVFIX-MASTER-GUIDE.md`                          |
| Session Brief    | `phases/PHASE-INVFIX-SESSION-BRIEF.md`                         |
| Session 6 Prompt | `phases/PHASE-INVFIX-SESSION-06-PROMPT.md`                     |
| Module Root      | `next-platform-dashboard/src/modules/invoicing/`               |
| Types            | `src/modules/invoicing/types/`                                 |
| Actions          | `src/modules/invoicing/actions/`                               |
| Components       | `src/modules/invoicing/components/`                            |
| Services         | `src/modules/invoicing/services/`                              |
| Utils            | `src/modules/invoicing/lib/invoicing-utils.ts`                 |
| Constants        | `src/modules/invoicing/lib/invoicing-constants.ts`             |
| Bootstrap        | `src/modules/invoicing/lib/invoicing-bootstrap.ts`             |
| Settings Form    | `src/modules/invoicing/components/invoicing-settings-form.tsx` |
| Invoice Form     | `src/modules/invoicing/components/invoice-form.tsx`            |
| Dashboard Pages  | `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/`      |
| Portal Pages     | `src/app/portal/sites/[siteId]/invoicing/`                     |
| API Routes       | `src/app/api/invoicing/`                                       |

---

## Dependencies Between Sessions

```
Session 1 (INVFIX-01: Settings + Form UX)
  ↓ Settings and defaults must be reliable first
Session 2 (INVFIX-02: Calculations + Preview)
  ↓ Totals and validation must be trustworthy
Session 3 (INVFIX-03: CRM + Catalog Import)
  ↓ Cross-module invoice creation and catalog data must be in place
Session 4-5 (INVFIX-04 / INVFIX-05 initial implementation)
  ↓ Useful progress landed, but closure was not achieved
Session 6 (INVFIX-04 + INVFIX-05 carryover closure)
  ↓ Payments and recurring must be clean before new downstream phases
Session 7 (INVFIX-06: Vendors / Bills / POs)
  ↓ Procurement work starts only after payments + recurring are re-audited clean
Session 8 (INVFIX-07: Expenses)
  ↓ Expense workflows should be closed before broader reporting polish
Session 9 (INVFIX-08: Reports)
  ↓ Reporting should consume stabilized expense and invoicing data
Session 10 (INVFIX-08 verification audit)
  ↓ Reports were re-audited and the carryover remained open
Session 11 (INVFIX-08 major carryover closure)
  ↓ Reports improved, but a few guide-level gaps still remain
Session 12 (INVFIX-08 final closure + INVFIX-09 partial landing)
  ↓ Email-system carryover must be closed before portal work begins
Session 13 (INVFIX-09 closure)
  ↓ Portal work begins only after the email/dunning stack is coherent
Session 14 (INVFIX-10 + INVFIX-11: Client Portal + Ask Chiko)
  ↓ Final cleanup only after portal and assistant surfaces are coherent
Session 15 (INVFIX-12: Delivery Notes + Cleanup)
  ↓ Final cleanup only after the module is otherwise coherent
```

Sessions 1-3 remain foundation work and must stay complete.  
Session 6 is now a hard gate for the rest of the roadmap.  
Do not advance into INVFIX-07 or later phases while INVFIX-04/05 carryover is still open.

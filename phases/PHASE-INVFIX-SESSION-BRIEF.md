# INVFIX — Invoice Module Overhaul Session Brief

> **Module**: Invoicing & Financial Management (overhaul)  
> **Guide**: `phases/PHASE-INVFIX-MASTER-GUIDE.md`  
> **Total Phases**: 12 (INVFIX-01 through INVFIX-12)  
> **Current Execution Plan**: 12 sessions  
> **Why the plan changed**: INVFIX-04 and INVFIX-05 were started but not actually closed, so Session 6 is now reserved for carryover closure before INVFIX-06 begins.

---

## Current Execution Note

The original 10-session estimate is no longer the active execution plan.

As of April 17, 2026:

1. INVFIX-01, INVFIX-02, and INVFIX-03 are complete.
2. INVFIX-04 and INVFIX-05 remain carryover.
3. Session 6 is a dedicated carryover closure session for INVFIX-04 and INVFIX-05.
4. Later sessions shift by one so INVFIX-06 does not start until Session 7.
5. If a session has a dedicated prompt file, follow that prompt over the generic phase mapping.

---

## Session-to-Phase Mapping

| Session        | Phases                      | Focus                                                                      | Priority    |
| -------------- | --------------------------- | -------------------------------------------------------------------------- | ----------- |
| **Session 1**  | INVFIX-01                   | Settings auto-populate from site branding + invoice form UX                | 🔴 Critical |
| **Session 2**  | INVFIX-02                   | Calculation engine fix, line item validation, live preview                 | 🔴 Critical |
| **Session 3**  | INVFIX-03                   | CRM deep integration, e-commerce item import, catalog picker               | 🔴 Critical |
| **Session 4**  | INVFIX-04                   | Payments foundation work landed, but closure still pending                 | 🟠 High     |
| **Session 5**  | INVFIX-05                   | Recurring lifecycle work landed, but closure still pending                 | 🟠 High     |
| **Session 6**  | INVFIX-04 + INVFIX-05       | Carryover closure only: manual payment flow, receipts, reconciliation, recurring robustness | 🔴 Critical |
| **Session 7**  | INVFIX-06                   | Vendors, bills, purchase orders, receive tracking, 3-way match             | 🟠 High     |
| **Session 8**  | INVFIX-07 + INVFIX-08       | Expenses approval + reports overhaul                                       | 🟡 Medium   |
| **Session 9**  | INVFIX-09                   | Email templates, auto-send, dunning escalation                             | 🟠 High     |
| **Session 10** | INVFIX-10                   | Client portal — full invoice experience, pay, statements                   | 🟠 High     |
| **Session 11** | INVFIX-11                   | Ask Chiko — portal expansion, sticky widget, data scoping                  | 🟡 Medium   |
| **Session 12** | INVFIX-12                   | Delivery notes, route cleanup, admin dashboard, final polish               | 🟡 Medium   |

---

## Dedicated Prompt Override

Use a dedicated session prompt whenever one exists.

- Session 6 authoritative prompt: `phases/PHASE-INVFIX-SESSION-06-PROMPT.md`
- Session 6 quick handoff version: `phases/PHASE-INVFIX-SESSION-06-QUICK-PROMPT.md`

Rules:

1. Read the dedicated prompt after the memory bank and master guide.
2. Treat dedicated prompt instructions as the source of truth for that session's scope and done criteria.
3. Do not rely on the generic historical mapping if the dedicated prompt says the session is carryover-only.

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
Read /memory-bank/progress.md to see what is actually complete. Then read phases/PHASE-INVFIX-SESSION-BRIEF.md for the current execution plan. If Session 6 is active, use phases/PHASE-INVFIX-SESSION-06-PROMPT.md instead of the old generic session mapping.
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

| Category        | Path                                                           |
| --------------- | -------------------------------------------------------------- |
| Master Guide    | `phases/PHASE-INVFIX-MASTER-GUIDE.md`                          |
| Session Brief   | `phases/PHASE-INVFIX-SESSION-BRIEF.md`                         |
| Session 6 Prompt| `phases/PHASE-INVFIX-SESSION-06-PROMPT.md`                     |
| Module Root     | `next-platform-dashboard/src/modules/invoicing/`               |
| Types           | `src/modules/invoicing/types/`                                 |
| Actions         | `src/modules/invoicing/actions/`                               |
| Components      | `src/modules/invoicing/components/`                            |
| Services        | `src/modules/invoicing/services/`                              |
| Utils           | `src/modules/invoicing/lib/invoicing-utils.ts`                 |
| Constants       | `src/modules/invoicing/lib/invoicing-constants.ts`             |
| Bootstrap       | `src/modules/invoicing/lib/invoicing-bootstrap.ts`             |
| Settings Form   | `src/modules/invoicing/components/invoicing-settings-form.tsx` |
| Invoice Form    | `src/modules/invoicing/components/invoice-form.tsx`            |
| Dashboard Pages | `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/`      |
| Portal Pages    | `src/app/portal/sites/[siteId]/invoicing/`                     |
| API Routes      | `src/app/api/invoicing/`                                       |

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
Session 8 (INVFIX-07 + INVFIX-08: Expenses + Reports)
  ↓ Reporting should consume stabilized invoicing data
Session 9 (INVFIX-09: Email System)
  ↓ Email automation depends on reliable invoice/payment state changes
Session 10 (INVFIX-10: Client Portal)
  ↓ Portal experience depends on invoice/payment correctness
Session 11 (INVFIX-11: Ask Chiko)
  ↓ AI portal work depends on stable invoice and portal data surfaces
Session 12 (INVFIX-12: Delivery Notes + Cleanup)
  ↓ Final cleanup only after the module is otherwise coherent
```

Sessions 1-3 remain foundation work and must stay complete.  
Session 6 is now a hard gate for the rest of the roadmap.  
Do not advance into INVFIX-06 or later phases while INVFIX-04/05 carryover is still open.

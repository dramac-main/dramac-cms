# INVFIX — Invoice Module Overhaul Session Brief

> **Module**: Invoicing & Financial Management (overhaul)  
> **Guide**: `phases/PHASE-INVFIX-MASTER-GUIDE.md`  
> **Total Phases**: 12 (INVFIX-01 through INVFIX-12)  
> **Estimated Sessions**: 8–10

---

## Session-to-Phase Mapping

| Session        | Phases                | Focus                                                        | Priority    |
| -------------- | --------------------- | ------------------------------------------------------------ | ----------- |
| **Session 1**  | INVFIX-01             | Settings auto-populate from site branding + invoice form UX  | 🔴 Critical |
| **Session 2**  | INVFIX-02             | Calculation engine fix, line item validation, live preview   | 🔴 Critical |
| **Session 3**  | INVFIX-03             | CRM deep integration, e-commerce item import, catalog picker | 🔴 Critical |
| **Session 4**  | INVFIX-04             | Payments — online processing, reconciliation, receipts       | 🟠 High     |
| **Session 5**  | INVFIX-05 + INVFIX-06 | Recurring lifecycle + Vendors/Bills/POs completion           | 🟠 High     |
| **Session 6**  | INVFIX-07 + INVFIX-08 | Expenses approval + Reports overhaul                         | 🟡 Medium   |
| **Session 7**  | INVFIX-09             | Email templates, auto-send, dunning escalation               | 🟠 High     |
| **Session 8**  | INVFIX-10             | Client portal — full invoice experience, pay, statements     | 🟠 High     |
| **Session 9**  | INVFIX-11             | Ask Chiko — portal expansion, sticky widget, data scoping    | 🟡 Medium   |
| **Session 10** | INVFIX-12             | Delivery notes, route cleanup, admin dashboard, final polish | 🟡 Medium   |

---

## Universal Session Prompt

Copy-paste this at the START of every session:

```
Read all memory bank files in /memory-bank/ first. Then read the master guide at phases/PHASE-INVFIX-MASTER-GUIDE.md. I'm working on Session [N] — Phase INVFIX-[XX]. Implement exactly what the guide specifies for this phase. Run tsc baseline before starting, and verify tsc after completion. Update memory bank when done.
```

---

## Context Loss Recovery Prompts

### "I don't know what this project is"

```
Read ALL files in /memory-bank/ — start with projectbrief.md, then productContext.md, systemPatterns.md, techContext.md, activeContext.md, and progress.md. This is the DRAMAC CMS platform — an enterprise multi-tenant CMS. The invoicing module is being overhauled. Read phases/PHASE-INVFIX-MASTER-GUIDE.md for the complete implementation plan.
```

### "What was I working on?"

```
Read /memory-bank/activeContext.md and /memory-bank/progress.md to see the current state. Then read phases/PHASE-INVFIX-MASTER-GUIDE.md and find the phase that corresponds to the most recent work. The Session Brief at phases/PHASE-INVFIX-SESSION-BRIEF.md has the session-to-phase mapping.
```

### "What should I do next?"

```
Read /memory-bank/progress.md to see what's completed. Check the session-to-phase mapping in phases/PHASE-INVFIX-SESSION-BRIEF.md. Start the next uncompleted session. Each session maps to specific phases in phases/PHASE-INVFIX-MASTER-GUIDE.md.
```

### "I hit an error / something broke"

```
Run `npx tsc --noEmit --skipLibCheck 2>&1 | head -50` to see current errors. Read /memory-bank/activeContext.md for recent decisions. Check the specific phase in phases/PHASE-INVFIX-MASTER-GUIDE.md — it specifies which files to modify and how. Fix the error without refactoring unrelated code.
```

---

## Pre-Session Checklist

Before every session:

- [ ] Read ALL 6 memory bank files
- [ ] Read the relevant phase(s) from the Master Guide
- [ ] Run `npx tsc --noEmit --skipLibCheck` to get baseline error count
- [ ] Note the baseline in the session

## Post-Session Checklist

After every session:

- [ ] Run `npx tsc --noEmit --skipLibCheck` — errors ≤ baseline
- [ ] Test the implemented features manually
- [ ] Commit: `git add -A && git commit -m "feat(invfix): INVFIX-XX description"`
- [ ] Push: `git push origin main`
- [ ] Update `/memory-bank/activeContext.md` with current state
- [ ] Update `/memory-bank/progress.md` with completed phases

---

## Key Files Quick Reference

| Category        | Path                                                           |
| --------------- | -------------------------------------------------------------- |
| Master Guide    | `phases/PHASE-INVFIX-MASTER-GUIDE.md`                          |
| Session Brief   | `phases/PHASE-INVFIX-SESSION-BRIEF.md`                         |
| Module Root     | `next-platform-dashboard/src/modules/invoicing/`               |
| Types           | `src/modules/invoicing/types/` (12 files)                      |
| Actions         | `src/modules/invoicing/actions/` (18 files)                    |
| Components      | `src/modules/invoicing/components/` (~60 files)                |
| Services        | `src/modules/invoicing/services/` (6 files)                    |
| Utils           | `src/modules/invoicing/lib/invoicing-utils.ts`                 |
| Constants       | `src/modules/invoicing/lib/invoicing-constants.ts`             |
| Bootstrap       | `src/modules/invoicing/lib/invoicing-bootstrap.ts`             |
| Settings Form   | `src/modules/invoicing/components/invoicing-settings-form.tsx` |
| Invoice Form    | `src/modules/invoicing/components/invoice-form.tsx`            |
| Nav             | `src/modules/invoicing/components/invoicing-nav.tsx`           |
| Dashboard Pages | `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/`      |
| Portal Pages    | `src/app/portal/sites/[siteId]/invoicing/`                     |
| API Routes      | `src/app/api/invoicing/`                                       |
| Chiko AI        | `src/components/chiko/`                                        |
| Navigation      | `src/config/navigation.ts`                                     |
| Portal Nav      | `src/config/portal-navigation.ts`                              |
| Brand Colors    | `src/lib/brand-colors.ts`                                      |
| Site Branding   | `src/modules/studio/components/site-branding-settings.tsx`     |

---

## Dependencies Between Sessions

```
Session 1 (INVFIX-01: Settings + Form UX)
  ↓ Settings auto-populate must work first
Session 2 (INVFIX-02: Calculations + Preview)
  ↓ Line items must validate correctly
Session 3 (INVFIX-03: CRM + Catalog Import)
  ↓ Items catalog populated
Session 4 (INVFIX-04: Payments)
  ↓ Payment processing works
Session 5 (INVFIX-05+06: Recurring + P2P)
  ↓ Recurring + bills complete
Session 6 (INVFIX-07+08: Expenses + Reports)
  ↓ Reports pull from all sources
Session 7 (INVFIX-09: Email System)
  ↓ Emails work for all events
Session 8 (INVFIX-10: Client Portal)
  ↓ Portal fully functional
Session 9 (INVFIX-11: Ask Chiko)
  ↓ AI in portal
Session 10 (INVFIX-12: Delivery Notes + Cleanup)
  ↓ Final module completion
```

Sessions 1-3 are **foundation** — they MUST be done in order.  
Sessions 4-8 have **soft dependencies** — small reordering possible.  
Sessions 9-10 are **independent** — can be done in any order after Session 8.

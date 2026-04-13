# Invoicing & Financial Management Module — Session Brief

> **Copy everything below the line into each new AI agent session.**
> **Replace `[PHASES]` with the phase numbers from the session plan below.**

---

## Session Plan

| Session | Phases          | Focus                                                                |
| ------- | --------------- | -------------------------------------------------------------------- |
| 1       | INV-01          | Database foundation — 18 tables, module registration (MUST be first) |
| 2       | INV-02          | Invoice CRUD, PDF generation, number sequencing                      |
| 3       | INV-03 + INV-04 | Payment recording + recurring invoices engine                        |
| 4       | INV-05 + INV-06 | Credit notes + expense tracking & receipt upload                     |
| 5       | INV-07          | Financial dashboard & reports (chart-heavy)                          |
| 6       | INV-08 + INV-09 | Tax management, multi-currency + client portal                       |
| 7       | INV-10 + INV-11 | Overdue management, email reminders + AI intelligence                |
| 8       | INV-12 + INV-13 | Super admin controls + cross-module deep integration                 |
| 9       | INV-14          | Vendor management, purchase orders & bills                           |

---

## Universal Prompt (copy into each session)

```
You are implementing the Invoicing & Financial Management Module for DRAMAC CMS.

STEP 1 — READ CONTEXT (mandatory, do this first):
- Read ALL files in /memory-bank/ (projectbrief.md, productContext.md, systemPatterns.md, techContext.md, activeContext.md, progress.md)
- Read /phases/PHASE-INV-MASTER-GUIDE.md — focus on:
  • Section 1: Architecture overview, access control & file structure
  • Phase [PHASES] (your implementation target)
  • Section 5: Implementation Notes & Quality Standards
  • The Relationship Diagrams section (understand Invoicing vs E-Commerce vs Paddle boundaries)

STEP 2 — VERIFY PREREQUISITES:
- Check that prior phase database tables exist (if not Session 1)
- Run tsc --noEmit to confirm clean baseline
- Note any existing invoicing files from previous sessions

STEP 3 — IMPLEMENT:
- Implement Phase [PHASES] exactly as specified in the guide
- Follow existing platform patterns (check systemPatterns.md)
- Use snake_case DB column mapping pattern used throughout the codebase
- ALL money amounts in CENTS (integers) — never floating point
- Fire automation events where the guide specifies
- Enforce permissions on all routes and server actions (use can_manage_invoices)
- Create all files listed in the guide's file structure for your phase(s)
- Modify existing files listed in the guide (additive only)
- Use Zambia-first defaults: ZMW currency, K symbol, 16% VAT, Africa/Lusaka timezone

STEP 4 — VERIFY:
- Run tsc --noEmit — must be zero errors
- Run next build — must succeed
- Manually confirm navigation items render
- Confirm key server actions work (create, read, update, delete)

STEP 5 — UPDATE MEMORY BANK:
- Update /memory-bank/activeContext.md with what was completed and what's next
- Update /memory-bank/progress.md with invoicing module status
- If session runs long: document exactly where you stopped so the next session can continue

RULES:
- Do NOT skip features or defer anything. Implement everything in the guide.
- Do NOT refactor or reorganize existing code. Changes are additive only.
- Do NOT invent patterns. Match the codebase's existing patterns.
- Do NOT touch E-Commerce order invoices or Paddle billing — those are separate systems.
- If you hit a blocker, document it in activeContext.md and move on to the next component.
- Use MCP tools (Supabase, Vercel) directly — don't ask me to do things manually.
- Module prefix is mod_invmod01_ for all database tables.
- Module slug is "invoicing" in module-catalog.ts and navigation.
```

---

## If a Session Runs Long

Paste this mid-session:

```
We're running out of context. Please:
1. Finish the component you're currently working on
2. Update /memory-bank/activeContext.md with exactly where you stopped (which phase, which file, what's left)
3. Update /memory-bank/progress.md
4. List what remains so I can continue in a new session
```

## Starting a Continuation Session

If a previous session didn't finish, use:

```
You are continuing the Invoicing & Financial Management Module implementation for DRAMAC CMS.

STEP 1 — Read ALL /memory-bank/ files. Check activeContext.md for where the previous session stopped.
STEP 2 — Read /phases/PHASE-INV-MASTER-GUIDE.md — the relevant phase section.
STEP 3 — Pick up exactly where the previous session left off. Do NOT redo completed work.
STEP 4 — When done, verify (tsc --noEmit, next build) and update memory bank.
```

---

## Session-Specific Notes

### Session 1 (INV-01) — Critical First Session

- Creates ALL 18 database tables via Supabase migration
- Registers module in module-catalog.ts, sites.ts, navigation.ts, portal-navigation.ts
- Adds permissions, types, RLS policies
- Runs bootstrap function (default settings, 16% VAT rate, expense categories)
- After this session, ALL subsequent sessions have database + registration ready

### Session 2 (INV-02) — Core Invoice Engine

- Heaviest phase: 11 server actions, 14 components, 4 pages, 2 API routes
- Invoice number generation uses ATOMIC database sequence (prevent duplicates)
- PDF generation uses browser print-to-PDF pattern (same as E-Commerce)
- Email sending via Resend (same pattern as other modules)

### Session 3 (INV-03 + INV-04) — Payments + Recurring

- Payment recording must handle partial payments correctly (amount_due recalculation)
- Recurring invoice engine uses Vercel Cron (daily at 06:00 UTC)
- Both phases fire automation events — ensure event-types.ts stubs are activated

### Session 4 (INV-05 + INV-06) — Credits + Expenses

- Credit note application must reverse invoice amounts accurately
- Expense receipt upload uses Supabase Storage bucket
- Billable expense → invoice line item conversion

### Session 5 (INV-07) — Reports Dashboard

- Chart-heavy: uses Recharts library
- Profit & Loss, AR Aging, Cash Flow, Tax Summary reports
- This IS the invoicing module landing page

### Session 6 (INV-08 + INV-09) — Tax + Portal

- Tax calculation service handles inclusive, exclusive, and compound taxes
- Multi-currency with exchange rate caching
- Client portal pages under /portal/sites/[siteId]/invoicing/
- Public invoice view via token-based URLs (no auth required)

### Session 7 (INV-10 + INV-11) — Overdue + AI

- Overdue cron runs daily at 07:00 UTC (after recurring at 06:00)
- Late fee application logic
- AI features use Claude Sonnet 4.6 (complex) and Haiku 4.5 (fast)
- Rate-limit AI calls (50/day/site)

### Session 8 (INV-12 + INV-13) — Admin + Integration

- Replace ALL EM-55 automation event stubs with real implementations
- CRM contact finance tab, deal→invoice conversion
- E-Commerce order→invoice, refund→credit note pipelines
- Booking→invoice pipeline
- Marketing audience financial filter fields

### Session 9 (INV-14) — Vendors & Bills

- Purchase order + bill CRUD mirrors invoice patterns
- PO→Bill conversion
- Bill payment mirrors invoice payment logic
- Dashboard metrics extended with accounts payable data

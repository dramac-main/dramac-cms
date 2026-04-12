# Marketing Module — Session Brief

> **Copy everything below the line into each new AI agent session.**
> **Replace `[PHASES]` with the phase numbers from the session plan below.**

---

## Session Plan

| Session | Phases | Focus |
|---------|--------|-------|
| 1 | MKT-01 | Database foundation (MUST be first) |
| 2 | MKT-02 + MKT-03 | Campaign engine + email analytics |
| 3 | MKT-04 + MKT-05 | Drip sequences + marketing hub dashboard |
| 4 | MKT-06 + MKT-07 | Landing pages, forms + blog enhancements |
| 5 | MKT-08 + MKT-09 | SMS/WhatsApp channels + AI intelligence |
| 6 | MKT-10 + MKT-11 + MKT-12 | Super admin + client portal + social media |

---

## Universal Prompt (copy into each session)

```
You are implementing the Marketing Module for DRAMAC CMS.

STEP 1 — READ CONTEXT (mandatory, do this first):
- Read ALL files in /memory-bank/ (projectbrief.md, productContext.md, systemPatterns.md, techContext.md, activeContext.md, progress.md)
- Read /phases/PHASE-MKT-MASTER-GUIDE.md — focus on:
  • Section 0: Architecture overview & file structure
  • Phase [PHASES] (your implementation target)
  • Cross-Module Integration Reference (end of guide)
  • Testing Requirements for your phases

STEP 2 — VERIFY PREREQUISITES:
- Check that prior phase database tables exist (if not Session 1)
- Run tsc --noEmit to confirm clean baseline
- Note any existing marketing files from previous sessions

STEP 3 — IMPLEMENT:
- Implement Phase [PHASES] exactly as specified in the guide
- Follow existing platform patterns (check systemPatterns.md)
- Use snake_case DB column mapping pattern used throughout the codebase
- Fire automation events where the guide specifies
- Enforce permissions on all routes and server actions
- Create all files listed in the guide's file structure for your phase(s)
- Modify existing files listed in the Cross-Module Integration section (additive only)

STEP 4 — VERIFY:
- Run tsc --noEmit — must be zero errors
- Run next build — must succeed
- Manually confirm navigation items render
- Confirm key server actions work (create, read, update, delete)

STEP 5 — UPDATE MEMORY BANK:
- Update /memory-bank/activeContext.md with what was completed and what's next
- Update /memory-bank/progress.md with marketing module status
- If session runs long: document exactly where you stopped so the next session can continue

RULES:
- Do NOT skip features or defer anything. Implement everything in the guide.
- Do NOT refactor or reorganize existing code. Changes are additive only.
- Do NOT invent patterns. Match the codebase's existing patterns.
- If you hit a blocker, document it in activeContext.md and move on to the next component.
- Use MCP tools (Supabase, Vercel) directly — don't ask me to do things manually.
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
You are continuing the Marketing Module implementation for DRAMAC CMS.

STEP 1 — Read ALL /memory-bank/ files. Check activeContext.md for where the previous session stopped.
STEP 2 — Read /phases/PHASE-MKT-MASTER-GUIDE.md — the relevant phase section.
STEP 3 — Pick up exactly where the previous session left off. Do NOT redo completed work.
STEP 4 — When done, verify (tsc --noEmit, next build) and update memory bank.
```

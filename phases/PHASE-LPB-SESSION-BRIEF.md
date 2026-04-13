# Landing Page Builder Pro — Session Brief

> **Copy everything below the line into each new AI agent session.**
> **Replace `[PHASES]` with the phase numbers from the session plan below.**

---

## Session Plan

| Session | Phases          | Focus                                               |
| ------- | --------------- | --------------------------------------------------- |
| 1       | LPB-01          | Database migration, type system, component registry |
| 2       | LPB-02          | Studio LP Editor — dedicated LP builder mode        |
| 3       | LPB-03          | URL routing, site integration, header/footer toggle |
| 4       | LPB-04 + LPB-05 | Hero components + advanced form system              |
| 5       | LPB-06 + LPB-07 | Conversion components + template library            |
| 6       | LPB-08 + LPB-09 | Analytics/conversion tracking + AI LP generator     |
| 7       | LPB-10 + LPB-11 | Super admin + client portal + migration tooling     |

### Session Notes

- **Session 1** is the heaviest — database schema, types, component registry, automation event/action registration. Must be done first.
- **Session 2** is a single phase but critical — integrating Studio Builder with LP mode is the architectural foundation everything else builds on.
- **Session 3** is also a single phase — the URL routing + branding + header/footer system is fundamental to the rest.
- **Sessions 4-5** build the LP-specific components — heroes, forms, conversion elements, and templates.
- **Session 6** adds intelligence — analytics tracking and AI-powered LP generation.
- **Session 7** is the final session — admin/portal views and the migration engine for existing LPs.

---

## Universal Prompt (copy into each session)

```
You are implementing the Landing Page Builder Pro overhaul for DRAMAC CMS.

This is NOT a new module — it overhauls the existing Landing Page feature within the Marketing module (mod_mktmod01_). The goal is to replace the limited vertical-block editor with a Studio Builder-powered LP editor that supports split layouts, floating forms, video backgrounds, site branding inheritance, and high-converting templates.

STEP 1 — READ CONTEXT (mandatory, do this first):
- Read ALL files in /memory-bank/ (projectbrief.md, productContext.md, systemPatterns.md, techContext.md, activeContext.md, progress.md)
- Read /phases/PHASE-LPB-MASTER-GUIDE.md — focus on:
  • Critical Platform Rules section
  • Architecture Context section
  • Existing Code Integration Points section
  • Phase [PHASES] (your implementation target)
  • Automation Integration section
  • Cross-Module Integration Reference section
  • Testing Requirements for your phases

STEP 2 — VERIFY PREREQUISITES:
- Check that prior phase database tables/columns exist (if not Session 1)
- Run: NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit — to confirm clean baseline
- Note any existing marketing/studio files from previous sessions
- Verify the Studio Builder infrastructure exists (src/components/studio/, src/lib/studio/)

STEP 3 — IMPLEMENT:
- Implement Phase [PHASES] exactly as specified in the guide
- Follow existing platform patterns (check systemPatterns.md)
- Use mapRecord()/mapRecords() for all Supabase snake_case to camelCase mapping
- Fire automation events where the guide specifies (use emitModuleEvent pattern)
- Enforce permissions on all routes and server actions
- Create all files listed in the guide for your phase(s)
- Modify existing files listed in the Integration Points section (additive only)
- LP components MUST register in component-registry.ts and render via ComponentRenderer pipeline
- Site branding MUST use resolveBrandColors() from src/lib/studio/engine/brand-colors.ts
- All LP public pages MUST NOT use dark: Tailwind variants

STEP 4 — VERIFY:
- Run: NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit — must be zero new errors
- Run: npx next build — must succeed
- Manually confirm:
  • Navigation items render correctly
  • Key server actions work (create, read, update, delete)
  • LP components render in Studio preview canvas
  • Published LPs serve at /lp/[slug] URL (if LPB-03+ is done)
  • Auth guards redirect unauthorized users

STEP 5 — UPDATE MEMORY BANK:
- Update /memory-bank/activeContext.md with what was completed and what's next
- Update /memory-bank/progress.md with LP Builder overhaul status
- If session runs long: document exactly where you stopped so the next session can continue

RULES:
- Do NOT skip features or defer anything. Implement everything in the guide for your phase(s).
- Do NOT refactor or reorganize existing code. Changes are additive only.
- Do NOT invent patterns. Match the codebase's existing patterns exactly.
- Do NOT modify the Studio Builder core — only extend it with LP-mode support.
- Use (supabase as any) for module table queries (standard platform pattern).
- Use sonner for toasts, never useToast.
- Import server actions from separate files — never inline 'use server' in client components.
- If you hit a blocker, document it in activeContext.md and move on to the next component.
- Use MCP tools (Supabase, Vercel) directly — don't ask me to do things manually.
```

---

## If a Session Runs Long

Paste this mid-session:

```
We're running out of context. Please:
1. Finish the component you're currently working on
2. Update /memory-bank/activeContext.md with exactly where you stopped:
   - Which phase (LPB-XX)
   - Which file you were working on
   - What's completed in the current phase
   - What remains in the current phase
3. Update /memory-bank/progress.md with LP Builder overhaul status
4. List exactly what remains so I can continue in a new session
```

---

## Starting a Continuation Session

If a previous session didn't finish, use:

```
You are continuing the Landing Page Builder Pro overhaul for DRAMAC CMS.

This is NOT a new module — it overhauls the existing Landing Page feature within the Marketing module.

STEP 1 — Read ALL /memory-bank/ files. Check activeContext.md for where the previous session stopped.
STEP 2 — Read /phases/PHASE-LPB-MASTER-GUIDE.md — the relevant phase section.
STEP 3 — Pick up exactly where the previous session left off. Do NOT redo completed work.
STEP 4 — When done, verify (NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit, npx next build) and update memory bank.

RULES: Same as the universal prompt above — additive only, match patterns, no dark: variants, use mapRecord, fire automation events.
```

---

## Phase Dependencies Quick Reference

```
LPB-01 (DB + Types + Registry)
    ├─→ LPB-02 (Studio LP Editor)
    │       └─→ LPB-03 (URL Routing + Branding)
    │               ├─→ LPB-04 (Hero Components)
    │               ├─→ LPB-05 (Form System)
    │               ├─→ LPB-06 (Conversion Components)
    │               │       └─→ LPB-07 (Templates — uses all components)
    │               ├─→ LPB-08 (Analytics)
    │               └─→ LPB-09 (AI Generator — needs components + templates)
    └─→ LPB-10 (Admin + Portal — needs LP data)
        └─→ LPB-11 (Migration — needs both old + new systems working)
```

Phases 04-06 can be done in any order after 03. Phase 07 must come after 06 (templates use conversion components). Phase 09 should come after 07 (AI references templates). Phase 11 must be last (needs both rendering systems operational).

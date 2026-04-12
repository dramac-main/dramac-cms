# DRAMAC CMS — Module Creation Playbook

> **Purpose**: This is a reusable prompt you paste into an AI session when you have a new idea for a module, feature, or major component on the DRAMAC platform. It instructs the AI to produce a comprehensive Master Implementation Guide + Session Brief — the same pattern used to build the Marketing, Automation, E-Commerce, Booking, Live Chat, and CRM modules.
>
> **When to use**: Any time you want to build something new — a full module, a major platform feature, a new admin tool, a new integration, etc.
>
> **Output**: Two documents that let you execute the build across multiple focused AI sessions.

---

## The Prompt (Copy everything below into a new AI session)

```
You are a senior architect for DRAMAC CMS, an enterprise multi-tenant SaaS platform. I have an idea for a new [module / feature / system] and I need you to produce TWO documents:

1. A **Master Implementation Guide** — the single source of truth for building this across multiple AI sessions
2. A **Session Brief** — a reusable prompt I paste into each implementation session

BEFORE YOU DO ANYTHING, complete these mandatory steps:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 0 — UNDERSTAND THE PLATFORM (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read ALL memory bank files to deeply understand the platform before designing anything:

  /memory-bank/projectbrief.md    → Core requirements, module types, business model
  /memory-bank/productContext.md  → User hierarchy, problems solved, UX goals
  /memory-bank/systemPatterns.md  → Architecture patterns, code conventions, AI patterns
  /memory-bank/techContext.md     → Tech stack, constraints, MCP tools, dev workflow
  /memory-bank/activeContext.md   → Current state, recent changes, active work
  /memory-bank/progress.md        → What's built, what's pending, known issues

Then read these to understand how existing modules are structured:

  /phases/PHASE-MKT-MASTER-GUIDE.md  → Reference: how the Marketing module guide was structured
  /phases/PHASE-MKT-SESSION-BRIEF.md → Reference: how session briefs are structured

Look at the existing codebase to understand real patterns (don't assume — verify):

  src/modules/                      → How existing modules are organized (actions/, components/, services/, types/, lib/)
  src/lib/modules/module-catalog.ts → How modules are registered in the marketplace catalog
  src/lib/actions/sites.ts          → How core modules auto-install (CORE_MODULE_SLUGS)
  src/config/navigation.ts          → How dashboard navigation works
  src/config/portal-navigation.ts   → How client portal navigation works
  src/modules/automation/lib/event-types.ts → How automation events are defined
  src/modules/automation/lib/action-types.ts → How automation actions are defined

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — DEEP DOMAIN RESEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing a single line of the guide:

1. Research the domain deeply — what do the best platforms in this space do?
2. What are the core entities, workflows, and user journeys?
3. What data needs to be stored? What are the relationships?
4. How does this integrate with existing DRAMAC modules (CRM, Automation, E-Commerce, Booking, Live Chat, Marketing, Social Media)?
5. What does each user persona need from this?
   - Super Admin: platform-wide oversight, abuse prevention, health monitoring
   - Agency Owner/Admin: full management for their clients' sites
   - Agency Member: scoped by permissions
   - Client (Portal): read-only or limited management based on permissions
   - Storefront Visitor: public-facing features (if applicable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — PRODUCE THE MASTER IMPLEMENTATION GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a file: /phases/PHASE-[PREFIX]-MASTER-GUIDE.md

The guide MUST follow this exact structure (matching the proven Marketing module pattern):

### Header Block
  - Document type, date, platform name, production URL
  - Module prefix (e.g., mod_[slug]_), module slug
  - "How to Use This Guide" section with the 10-step workflow per session

### Critical Platform Rules
  Copy these EXACTLY (they apply to ALL modules):
  - All prices in CENTS (integers) — K250.00 = 25000
  - Supabase returns snake_case — always use mapRecord()/mapRecords()
  - Every server page needs auth guard: if (!user) redirect('/login')
  - AI Zod schemas: No .int(), .min(), .max() — Claude rejects these
  - Vercel function timeout: maxDuration = 60 on all AI API routes
  - Locale: Zambia-first — ZMW currency, K symbol, Africa/Lusaka timezone, 16% VAT
  - Email sender: Dramac <noreply@app.dramacagency.com> via Resend
  - Module DB prefix: All tables MUST be mod_[prefix]_*
  - No dark: Tailwind variants in storefront/public components
  - Use semantic Tailwind: bg-card, text-foreground, bg-primary
  - 'use client' components must NOT contain inline 'use server' annotations
  - Import server actions as functions from separate files
  - Toast notifications: Use sonner (not useToast)
  - Font inline styles: Always use fontFamily: value || undefined

### Table of Contents
  Group phases into logical categories (Foundation, Core, Channels, Intelligence, Administration)

### Platform Architecture Context
  - Multi-tenant hierarchy diagram (Super Admin → Agency → Client → Site → Modules)
  - Where this module lives in the hierarchy (site-scoped? agency-scoped?)
  - Existing module dependencies — how does this module interact with CRM, Automation, E-Commerce, etc.?

### Relationship Clarifications
  - If this module overlaps with an existing one (like Marketing vs Automation), draw a clear boundary diagram showing what each owns

### Access Control Design
  For EACH user persona, document:
  - Who they are
  - What they can do
  - Full route list with path patterns
  Include sections for: Agency Dashboard, Client Portal, Super Admin, Public/Storefront

### Existing Code Integration Points
  Two categories:
  1. Files that will be MODIFIED (additive only) — list each file, what changes, and risk level
  2. Files that will be CREATED — full directory tree for:
     - src/modules/[slug]/ (types/, actions/, services/, components/, lib/)
     - Dashboard pages: src/app/(dashboard)/dashboard/sites/[siteId]/[slug]/
     - Portal pages: src/app/portal/sites/[siteId]/[slug]/
     - Admin pages: src/app/(dashboard)/admin/[slug]/
     - API routes: src/app/api/[slug]/

### Phase Definitions (THE CORE OF THE GUIDE)
  Break the implementation into 8-15 phases. Each phase MUST include:
  
  **Phase [PREFIX]-XX: [Name]**
  - Purpose: What this phase achieves
  - Database Tables: Full schema with columns, types, constraints, defaults, descriptions, indexes, RLS rules
  - TypeScript Types: All interfaces with JSDoc descriptions
  - Server Actions: Each action with name, parameters, return type, description, and which automation events to fire
  - Components: Each component with name, props, description, and which actions it calls
  - Pages/Routes: Each page with path, auth requirements, and what components it renders
  - API Routes: If applicable — endpoint, method, auth, request/response schemas
  - Testing Notes: What to manually verify

  Phase ordering rules:
  - Phase 1 is ALWAYS database foundation + module registration + type system
  - Phase 2-3: Core CRUD and primary UI
  - Middle phases: Feature depth, analytics, integrations
  - Final phases: Super admin controls, client portal views, cross-module deep integration

### Automation Integration Section
  - List ALL automation event types this module will add (following marketing.* pattern)
  - List ALL automation action types this module will add
  - List system workflow templates (pre-built automations)

### Cross-Module Integration Reference
  For each existing module, document exactly:
  - What data this module reads from it
  - What data this module writes to it
  - What events flow between them
  - Which files get modified

### Testing Requirements
  Per-phase testing checklist covering:
  - TypeScript compilation (tsc --noEmit)
  - Build success (next build)
  - Manual verification steps
  - Key user journeys to walk through

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — PRODUCE THE SESSION BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a file: /phases/PHASE-[PREFIX]-SESSION-BRIEF.md

This file contains:

1. **Session Plan Table** — Maps sessions to phases:
   | Session | Phases | Focus |
   |---------|--------|-------|
   | 1 | [PREFIX]-01 | Database foundation (MUST be first) |
   | 2 | [PREFIX]-02 + [PREFIX]-03 | [Core feature + related feature] |
   | ... | ... | ... |

   Rules for session planning:
   - Session 1 is ALWAYS the database foundation alone (it's the heaviest)
   - Group 2-3 related phases per session (don't overload)
   - Keep dependent phases in sequence
   - Final session handles admin + portal + cross-module integration

2. **Universal Prompt** — The exact text to paste into each implementation session (see format below)

3. **Context Loss Recovery** — Prompts for when a session runs long or needs continuation

The Universal Prompt must include these steps:
  - STEP 1: Read ALL /memory-bank/ files + the master guide (focus on target phases)
  - STEP 2: Verify prerequisites (prior DB tables exist, clean tsc baseline, note existing files)
  - STEP 3: Implement (follow guide exactly, match codebase patterns, use snake_case mapping, fire automation events, enforce permissions)
  - STEP 4: Verify (tsc --noEmit zero errors, next build success, navigation renders, CRUD works)
  - STEP 5: Update memory bank (activeContext.md + progress.md)

  And these rules:
  - Do NOT skip features or defer anything
  - Do NOT refactor existing code (additive only)
  - Do NOT invent patterns (match existing)
  - Use MCP tools directly (Supabase, Vercel) — don't ask the user
  - Document blockers in activeContext.md and move on

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — MODULE REGISTRATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Include a "Module Registration" section in Phase 1 of the master guide that covers ALL touchpoints a module needs to be fully integrated:

□ Database: modules_v2 record (slug, name, description, features, tags, manifest, settings_schema, is_featured, pricing_type)
□ Migration file: migrations/em-XX-register-[slug]-module.sql with ON CONFLICT upsert
□ Code catalog: src/lib/modules/module-catalog.ts entry
□ Core module auto-install: Add to CORE_MODULE_SLUGS in src/lib/actions/sites.ts (if core)
□ Bootstrap function: Seed default settings on site creation (if needed)
□ Dashboard navigation: src/config/navigation.ts entry
□ Portal navigation: src/config/portal-navigation.ts entry (gated by hasModule + permissions)
□ Portal module registry: Register with moduleSlug and permissionKey
□ Admin navigation: Admin nav entry for super admin health/oversight page
□ Permissions: Add permission key to PortalUserPermissions interface
□ Site detail page: Add hasModule check, TabsTrigger, and TabsContent in sites/[siteId]/page.tsx
□ Site modules tab: Add slug to Open button whitelist in site-modules-tab.tsx
□ AI Designer types: Add to ModuleType union in website-designer/modules/types.ts
□ AI Designer analyzer: Add to Zod enum in website-designer/modules/analyzer.ts
□ AI Designer configurator: Add case to configureModule switch + config method
□ AI Designer defaults: Add getDefault[Module]Config in default-configs.ts
□ Auto-install route: Add to FEATURE_MODULE_MAP and COMPONENT_MODULE_MAP
□ Industry mapping: Add to INDUSTRY_MODULE_MAPPING recommended arrays
□ Automation events: Add module event types to event-types.ts
□ Automation actions: Add module action types to action-types.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The master guide must be:
- EXHAUSTIVE: Every database column, every TypeScript type, every component, every route
- SPECIFIC: No hand-waving. Column types, default values, constraints, RLS policies — all specified
- CONSISTENT: Follow the exact naming patterns from existing modules
- SELF-CONTAINED: An AI agent with no prior context should be able to build from this guide alone
- REALISTIC: Phase sizes should be completable in a single AI session (2-4 hours of work each)

The session brief must be:
- COPY-PASTEABLE: No customization needed beyond replacing [PHASES] with phase numbers
- COMPLETE: Includes recovery prompts for context loss and continuation sessions
- STRUCTURED: Clear session-to-phase mapping table

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now, here is my idea:

[DESCRIBE YOUR IDEA HERE]

Please begin with Step 0 — read the memory bank and codebase, then proceed through all steps to produce the two documents.
```

---

## Quick Reference: What the Output Looks Like

After running the prompt above, you get:

### 1. Master Implementation Guide (`/phases/PHASE-[PREFIX]-MASTER-GUIDE.md`)
A 3,000–8,000 line document containing:
- Full architecture design
- Complete database schemas (every column, type, constraint)
- All TypeScript interfaces
- Every server action, component, page, and API route
- Phase-by-phase implementation plan (8-15 phases)
- Cross-module integration map
- Automation event/action definitions
- Testing requirements

### 2. Session Brief (`/phases/PHASE-[PREFIX]-SESSION-BRIEF.md`)
A short document containing:
- Session-to-phase mapping table
- Universal prompt to paste into each implementation session
- Context loss recovery prompts
- Continuation session prompts

### 3. Implementation Flow
```
Session 1: Paste session brief prompt → AI reads guide → Implements Phase 1 (DB + types)
Session 2: Paste session brief prompt → AI reads guide → Implements Phases 2-3
Session 3: Paste session brief prompt → AI reads guide → Implements Phases 4-5
...
Final Session: QA agent verifies everything, fixes gaps, commits
```

---

## Tips for Best Results

1. **Be detailed with your idea** — The more context you give about what you want, the better the guide. Include examples, competitor references, user stories.

2. **Let the AI research first** — Don't rush it. The domain research step produces a much better guide than skipping straight to writing.

3. **Review before implementing** — Read through the master guide before starting implementation sessions. Flag anything that doesn't match your vision.

4. **One session = one focus** — Don't try to implement more than 2-3 phases per session. Quality drops with scope.

5. **Always start with Phase 1** — Database foundation MUST be first. Everything else builds on it.

6. **Use the QA session** — After all implementation sessions, run one final QA session to verify module registration, fix TypeScript errors, and ensure everything is properly wired up.

---

## Example Ideas This Works For

- **Invoicing & Quoting Module** — Generate invoices, track payments, create quotes
- **HR & Payroll Module** — Employee management, timesheets, payroll
- **Project Management Module** — Tasks, boards, timelines, collaboration
- **Inventory Management Module** — Stock tracking, suppliers, purchase orders
- **Learning Management (LMS) Module** — Courses, lessons, quizzes, certificates
- **Helpdesk & Ticketing Module** — Support tickets, SLAs, knowledge base
- **Event Management Module** — Events, registrations, tickets, check-in
- **Loyalty & Rewards Module** — Points, tiers, referrals, rewards catalog
- **Any new platform feature** — Dashboard redesign, new AI tool, reporting system, etc.

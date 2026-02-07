# 🔧 DRAMAC CMS — AI Website Designer: Complete System Overhaul Prompt

> **PURPOSE:** This is a comprehensive, self-contained prompt for an AI assistant to systematically review and fix EVERY issue in the AI Website Designer generation pipeline. Read this entire document before making any changes. Work through each section methodically, testing changes as you go.

---

## 📋 TABLE OF CONTENTS

### Phase 1: Listed Fixes (Work Through Systematically)
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [How To Start](#2-how-to-start)
3. [Complete File Inventory](#3-complete-file-inventory)
4. [Generation Pipeline Flow](#4-generation-pipeline-flow)
5. [🔴 CRITICAL BUGS — Fix Immediately](#5--critical-bugs--fix-immediately)
6. [🟡 MEDIUM ISSUES — Fix Next](#6--medium-issues--fix-next)
7. [🟢 MINOR ISSUES — Polish](#7--minor-issues--polish)
8. [Component-by-Component Enhancement Guide](#8-component-by-component-enhancement-guide)
9. [Prompt Engineering Improvements](#9-prompt-engineering-improvements)
10. [Dead Code Audit & Cleanup](#10-dead-code-audit--cleanup)
11. [Quality Validation Checklist](#11-quality-validation-checklist)
12. [Memory Bank Update Instructions](#12-memory-bank-update-instructions)

### Phase 2: Full Self-Review & Autonomous Improvement Pass (MANDATORY)
13. [Re-Read Every Modified File End-to-End](#step-1-re-read-every-modified-file-end-to-end)
14. [Cross-File Consistency Audit](#step-2-cross-file-consistency-audit)
15. [Prop Name Alignment Audit](#step-3-prop-name-alignment-audit)
16. [Edge Case Hunting](#step-4-edge-case-hunting)
17. [Prompt Quality Review](#step-5-prompt-quality-review)
18. [Find NEW Issues Not Listed in Phase 1](#step-6-find-new-issues-not-listed-in-phase-1)
19. [Generate Test Website (Mental Simulation)](#step-7-generate-a-test-website-mental-simulation)
20. [Second Business Type Trace](#step-8-second-business-type-trace)
21. [Fix Everything Found](#step-9-fix-everything-you-found)

### Phase 3: Final Polish Pass
22. [Code Quality Polish](#polish-checklist)

---

## 1. Project Overview & Architecture

### What This System Does
The AI Website Designer generates complete, multi-page websites from a single text prompt (e.g., "Create a barbershop website for Besto in Lusaka"). It uses Claude Sonnet 4 via Vercel AI SDK's `generateObject()` to produce structured JSON that gets converted into DRAMAC Studio's visual editor format.

### Tech Stack
- **Framework:** Next.js 16, React 19, TypeScript
- **AI:** Vercel AI SDK v6.0.33, `@ai-sdk/anthropic` 3.0.12
- **Model:** `claude-sonnet-4-20250514` for ALL tasks (architecture, pages, navbar, footer)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel (300s function timeout)
- **Package Manager:** pnpm monorepo

### Key Directory
All website designer code lives in:
```
src/lib/ai/website-designer/
├── engine.ts              # Main orchestrator (1034 lines)
├── prompts.ts             # AI system prompts (781 lines)
├── schemas.ts             # Zod schemas for structured output (254 lines)
├── converter.ts           # AI output → Studio format (638 lines)
├── types.ts               # TypeScript types
├── config/
│   ├── ai-provider.ts     # Model configuration (203 lines)
│   ├── design-references.ts # Curated design patterns (1051 lines) — DEAD CODE
│   └── industry-blueprints.ts # Industry templates (1626 lines)
├── data-context/
│   ├── builder.ts         # Supabase data fetcher (803 lines)
│   ├── formatter.ts       # Data → AI markdown (716 lines)
│   ├── checker.ts         # Data completeness scoring (697 lines)
│   └── types.ts           # Data context types (399 lines)
├── design/
│   └── inspiration-engine.ts # Design tokens generator (disabled by default)
├── intelligence/
│   ├── industry-templates.ts  # Industry patterns (480 lines) — DEAD CODE
│   ├── page-planner.ts        # Smart page planning (380 lines) — DEAD CODE
│   └── component-scorer.ts    # Component scoring (348 lines) — DEAD CODE
├── content/
│   └── section-generators.ts  # Per-section AI content (704 lines) — DEAD CODE
├── refinement/
│   └── multi-pass-engine.ts   # Quality refinement (666 lines) — disabled
└── modules/
    ├── orchestrator.ts        # Module integration
    └── types.ts               # Module types
```

### API Routes
```
src/app/api/ai/website-designer/
├── route.ts               # POST /api/ai/website-designer (sync, 187 lines)
└── stream/
    └── route.ts           # POST /api/ai/website-designer/stream (SSE, 183 lines)
```

### Studio Component Registry
The Studio editor's component definitions live in:
```
src/lib/studio/registry/
├── core-components.ts     # Hero, Features, CTA, etc.
├── premium-components.ts  # Advanced components
├── component-registry.ts  # Registry class
└── index.ts               # Exports
```

---

## 2. How To Start

### Step 1: Read the Memory Bank
Before doing ANYTHING, read these files to understand the project:
1. `/memory-bank/projectbrief.md`
2. `/memory-bank/productContext.md`
3. `/memory-bank/systemPatterns.md`
4. `/memory-bank/techContext.md`
5. `/memory-bank/activeContext.md`
6. `/memory-bank/progress.md`

### Step 2: Read the Core Files
Read these files IN ORDER to understand the generation pipeline:
1. `src/lib/ai/website-designer/engine.ts` — The orchestrator
2. `src/lib/ai/website-designer/prompts.ts` — What the AI sees
3. `src/lib/ai/website-designer/schemas.ts` — Output validation
4. `src/lib/ai/website-designer/converter.ts` — Output transformation
5. `src/lib/ai/website-designer/config/ai-provider.ts` — Model config
6. `src/lib/ai/website-designer/config/industry-blueprints.ts` — Industry templates

### Step 3: Read the Studio Registry
Understand what props each component ACTUALLY accepts:
1. `src/lib/studio/registry/core-components.ts`
2. `src/lib/studio/registry/premium-components.ts`

### Step 4: Work Through This Document Section by Section
Fix bugs in priority order (Critical → Medium → Minor), then enhance each component.

---

## 3. Complete File Inventory

### Files You WILL Modify (in priority order):
| # | File | Lines | Priority | What to Fix |
|---|------|-------|----------|-------------|
| 1 | `converter.ts` | 638 | 🔴 CRITICAL | Navbar prop mismatch, missing handlers, thread safety |
| 2 | `engine.ts` | 1034 | 🔴 CRITICAL | Footer copyright encoding, API config passthrough |
| 3 | `prompts.ts` | 781 | 🟡 HIGH | Default descriptions leaking, footer prompt too weak |
| 4 | `config/ai-provider.ts` | 203 | 🟡 MEDIUM | Wrong cost estimation, same model all tiers |
| 5 | `schemas.ts` | 254 | 🟡 MEDIUM | Footer schema missing fields, better descriptions |
| 6 | `route.ts` (API) | 187 | 🔴 CRITICAL | EngineConfig not passed from request |
| 7 | `stream/route.ts` (API) | 183 | 🔴 CRITICAL | EngineConfig not passed from request |

### Files That Are DEAD CODE (decide: wire in or delete):
| File | Lines | Status |
|------|-------|--------|
| `config/design-references.ts` | 1051 | Imported but never called |
| `intelligence/industry-templates.ts` | 480 | Exported but not used by engine |
| `intelligence/page-planner.ts` | 380 | Exported but not used by engine |
| `intelligence/component-scorer.ts` | 348 | Exported but not used by engine |
| `content/section-generators.ts` | 704 | Not imported anywhere |

---

## 4. Generation Pipeline Flow

Understanding this flow is ESSENTIAL before making changes:

```
User Prompt ("Create a barbershop website for Besto in Lusaka")
  │
  ▼
API Route (route.ts or stream/route.ts)
  │ Creates WebsiteDesignerEngine(siteId)
  │ ⚠️ BUG: Does NOT pass EngineConfig — features permanently disabled
  │
  ▼
Step 1: Build Data Context (data-context/builder.ts)
  │ Fetches from Supabase: branding, services, team, testimonials, etc.
  │ Formats as markdown (formatter.ts)
  │
  ▼
Step 1.5: Design Tokens (design/inspiration-engine.ts)
  │ Quick tokens (no AI call) or full AI analysis (disabled)
  │
  ▼
Step 1.6: Blueprint Lookup (config/industry-blueprints.ts)
  │ Finds proven industry template (e.g., "barbershop" → no match currently!)
  │ ⚠️ NOTE: Blueprints exist for restaurant, law-firm, ecommerce, saas,
  │         healthcare, portfolio, fitness, construction, real-estate, education
  │         But NOT for: barbershop, salon, spa, photography, wedding, etc.
  │
  ▼
Step 2: Architecture Generation (AI Call #1)
  │ System: SITE_ARCHITECT_PROMPT
  │ Prompt: buildArchitecturePrompt(userPrompt, context, prefs, components)
  │ Schema: SiteArchitectureSchema
  │ Output: { intent, tone, pages[], sharedElements, designTokens }
  │
  ▼
Step 3: Page Generation (AI Calls #2 through #N, one per page)
  │ System: PAGE_GENERATOR_PROMPT
  │ Prompt: buildPagePrompt(pagePlan, context, designTokens, componentDetails)
  │ Schema: PageComponentsOutputSchema → array of GeneratedComponentSchema
  │ Output: { components: [{ id, type, props }] } per page
  │
  ▼
Step 4: Navbar Generation (AI Call #N+1)
  │ System: NAVBAR_GENERATOR_PROMPT
  │ Schema: NavbarComponentSchema
  │ ⚠️ Schema outputs `navItems` but converter expects `links`
  │
  ▼
Step 5: Footer Generation (AI Call #N+2)
  │ System: FOOTER_GENERATOR_PROMPT ← Very weak prompt!
  │ Schema: FooterComponentSchema
  │ ⚠️ engine.ts hardcodes copyright with broken encoding: "┬⌐"
  │
  ▼
Step 6: Apply Shared Elements (engine.ts)
  │ Prepends navbar, appends footer to every page
  │ Filters any duplicate navbar/footer from page content
  │
  ▼
Step 7: Converter (converter.ts)
  │ convertOutputToStudioPages() → Map<slug, StudioPageData>
  │ For each component: typeMap lookup → transformPropsForStudio()
  │ ⚠️ Navbar handler reads `props.links` but AI outputs `props.navItems`
  │ ⚠️ Missing handlers for Gallery, Newsletter, LogoCloud, etc.
  │
  ▼
Studio Rendering (StudioPageData → Visual Website)
```

### Total AI Calls Per Generation
For a typical 4-page website: **7 AI calls** (1 architecture + 4 pages + 1 navbar + 1 footer)

---

## 5. 🔴 CRITICAL BUGS — Fix Immediately

### Bug #1: API Routes Don't Pass EngineConfig
**Impact:** Design inspiration, refinement, and module integration are PERMANENTLY DISABLED regardless of what the user requests. The `EngineConfig` parameter is never forwarded from the API request body.

**Files:** 
- `src/app/api/ai/website-designer/route.ts` (line ~119)
- `src/app/api/ai/website-designer/stream/route.ts` (line ~137)

**Current Code (route.ts):**
```typescript
const engine = new WebsiteDesignerEngine(input.siteId);
```

**Fix:**
1. Add `engineConfig` to the `RequestSchema` as optional:
```typescript
engineConfig: z.object({
  enableDesignInspiration: z.boolean().optional(),
  useQuickDesignTokens: z.boolean().optional(),
  enableRefinement: z.boolean().optional(),
  refinementPasses: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  enableModuleIntegration: z.boolean().optional(),
}).optional(),
```
2. Pass it to the engine:
```typescript
const engine = new WebsiteDesignerEngine(input.siteId, undefined, input.engineConfig);
```
3. Do the same for `stream/route.ts`:
```typescript
const engine = new WebsiteDesignerEngine(input.siteId, onProgress, input.engineConfig);
```

---

### Bug #2: Navbar Prop Name Mismatch
**Impact:** Navigation links are EMPTY on the rendered website. The AI outputs `navItems` (as defined in `NavbarComponentSchema`) but `converter.ts` reads `props.links || props.navLinks || props.navigation`.

**File:** `src/lib/ai/website-designer/converter.ts` (line ~310)

**Current Code:**
```typescript
const links = props.links || props.navLinks || props.navigation || [];
```

**Fix:**
```typescript
const links = props.links || props.navItems || props.navLinks || props.navigation || [];
```

**ALSO:** In `engine.ts` `generateNavbar()` method (around line 630), after the AI generates navbar props, the engine manually adds `navItems`:
```typescript
props: {
  ...object,
  navItems: [{ label: "Home", href: "/" }, ...navItems],
},
```
This is set as `navItems` but the converter looks for `links`. Either:
- Change engine.ts to use `links` instead of `navItems`, OR
- Change converter.ts to also check `navItems` (as shown above)

**Recommended:** Do BOTH — add `navItems` to converter's check AND change engine.ts to output `links` for consistency:
```typescript
// engine.ts generateNavbar()
props: {
  ...object,
  links: [{ label: "Home", href: "/" }, ...navItems],
  navItems: [{ label: "Home", href: "/" }, ...navItems], // backward compat
},
```

---

### Bug #3: Platform Description Leaking Into Generated Content
**Impact:** Generated websites show DRAMAC's own tagline instead of business-specific content. Screenshot shows: *"Create beautiful, responsive websites with our powerful drag-and-drop builder. No coding required."* on a barbershop website.

**Root Cause:** The Hero component's `defaultProps` in the Studio registry (`core-components.ts`) has this as the default `description`. When the AI doesn't explicitly set a `description` prop (or sets an empty one), the Studio falls back to the default.

**Files to fix:**
1. `src/lib/studio/registry/core-components.ts` — Change Hero default description
2. `src/lib/ai/website-designer/prompts.ts` — Add explicit instruction to ALWAYS generate a description
3. `src/lib/ai/website-designer/converter.ts` — Add fallback in Hero handler

**Fix in converter.ts Hero handler:**
```typescript
if (type === "Hero") {
  // ...existing code...
  return {
    title: props.headline || props.title || "Welcome",
    subtitle: props.subheadline || props.subtitle || "",
    description: props.description || props.subheadline || props.subtitle || "", // NEVER let it fall to registry default
    // ...rest
  };
}
```

**Fix in prompts.ts PAGE_GENERATOR_PROMPT** — Add explicit rule:
```
### RULE #4: ALWAYS PROVIDE DESCRIPTION TEXT
- Every Hero component MUST have a custom "description" prop with business-specific text
- NEVER leave description empty or undefined — the system will fill in generic platform text
- The description should be 1-2 sentences about THIS specific business
- Example for a barbershop: "Experience premium grooming services at Besto. Our master barbers deliver precision cuts and styling in the heart of Lusaka."
```

**Fix in core-components.ts** — Change the Hero defaultProps description:
```typescript
// Change from:
description: "Create beautiful, responsive websites with our powerful drag-and-drop builder. No coding required."
// Change to:
description: ""
```

---

### Bug #4: Footer Shows Generic Services Instead of Business Services
**Impact:** Footer displays "Premium Consulting, Strategic Planning, Business Development, Quality Assurance" for a BARBERSHOP website. The AI generates completely wrong column content.

**Root Cause:** The `FOOTER_GENERATOR_PROMPT` in `prompts.ts` is extremely weak (only 8 lines!). It provides no guidance about what content to put in footer columns. The AI hallucinates generic corporate services.

**File:** `src/lib/ai/website-designer/prompts.ts` (line ~471)

**Current (BAD) prompt:**
```typescript
export const FOOTER_GENERATOR_PROMPT = `You are designing a comprehensive footer.

Create a professional footer that:
1. Includes logo and tagline
2. Provides navigation links organized by category
3. Shows contact information
4. Displays social media links
5. Includes newsletter signup if requested
6. Has proper copyright notice
7. Works well on all screen sizes

Configure ALL footer props for a complete, professional result.`;
```

**Fix — Replace with comprehensive prompt:**
```typescript
export const FOOTER_GENERATOR_PROMPT = `You are designing a premium footer for a specific business website.

## ⚠️ CRITICAL RULES

### RULE #1: USE REAL BUSINESS DATA
- The tagline/description MUST describe THIS specific business (e.g., "Premium barbershop in Lusaka" NOT "Building the future of web design")
- Footer column link labels must be REAL pages of THIS website
- NEVER use generic corporate text like "Premium Consulting" or "Strategic Planning"

### RULE #2: COLUMN CONTENT MUST MATCH THE BUSINESS
Column titles and links should be relevant to the business type:

**For Service Businesses (barbershop, salon, spa, clinic):**
- Column 1: "Services" → links to actual services (Haircuts, Beard Trims, Hot Towel Shave, etc.)
- Column 2: "Quick Links" → Home, About, Gallery, Contact
- Column 3: "Visit Us" → Address, Hours, Directions

**For Restaurants/Cafés:**
- Column 1: "Menu" → Appetizers, Main Course, Desserts, Drinks
- Column 2: "Visit" → Reservations, Location, Hours, Catering
- Column 3: "About" → Our Story, Chef, Events, Careers

**For Professional Services:**
- Column 1: "Services" → relevant service categories
- Column 2: "Company" → About, Team, Careers, Blog
- Column 3: "Support" → Contact, FAQ, Consultation

**For E-commerce:**
- Column 1: "Shop" → Categories, New Arrivals, Best Sellers, Sale
- Column 2: "Help" → Shipping, Returns, FAQ, Size Guide
- Column 3: "Company" → About, Blog, Contact, Careers

### RULE #3: SOCIAL LINKS
- Only include social platforms the business actually uses
- If no social data is provided, include common defaults (Facebook, Instagram) with "#" URLs

### RULE #4: COPYRIGHT
- Format: "© {year} {Business Name}. All rights reserved."
- Use the EXACT business name from context

### RULE #5: TAGLINE/DESCRIPTION
- Must be specific to this business, 1 sentence
- Examples:
  - Barbershop: "Premium grooming services in Lusaka since 2016"
  - Restaurant: "Authentic Italian cuisine in the heart of downtown"
  - Law Firm: "Trusted legal counsel for families and businesses"
- NEVER use generic taglines about web design, technology, or platforms

Configure ALL footer props for a complete, polished result.`;
```

**ALSO fix in engine.ts `generateFooter()` method** — The prompt passed to the AI is also too minimal. Add business industry context:
```typescript
// In engine.ts generateFooter() method, enhance the prompt:
prompt: `Generate a premium footer configuration.

Business: ${this.getBusinessName()}
Industry: ${this.context?.client.industry || "general"}
Business Description: ${this.context?.client.description || ""}
Services: ${JSON.stringify(this.context?.services?.map(s => s.name) || [])}
...rest of existing prompt
```

---

### Bug #5: Copyright Symbol Encoding Error
**Impact:** Footer shows `┬⌐` instead of `©` in the copyright text.

**File:** `src/lib/ai/website-designer/engine.ts` (line ~672)

**Current Code:**
```typescript
copyrightText: `┬⌐ ${new Date().getFullYear()} ${this.getBusinessName()}. All rights reserved.`,
```

**Fix:**
```typescript
copyrightText: `© ${new Date().getFullYear()} ${this.getBusinessName()}. All rights reserved.`,
```

---

### Bug #6: Global Mutable State — Thread Safety Issue
**Impact:** Concurrent website generations can corrupt each other's page slug data, causing broken links.

**File:** `src/lib/ai/website-designer/converter.ts` (lines 26-36)

**Current Code:**
```typescript
let generatedPageSlugs: string[] = [];

export function setGeneratedPageSlugs(slugs: string[]): void {
  generatedPageSlugs = slugs.map(s => s.startsWith('/') ? s : `/${s}`);
}
```

**Fix — Make it parameter-based instead of global:**
```typescript
// Remove the global variable and setGeneratedPageSlugs function
// Instead, pass slugs as a parameter through the converter functions

export function convertPageToStudioFormat(
  page: GeneratedPage, 
  allPageSlugs: string[] = []  // NEW parameter
): StudioPageData {
  // Use allPageSlugs locally instead of global generatedPageSlugs
}

export function convertOutputToStudioPages(
  output: WebsiteDesignerOutput
): Map<string, { page: GeneratedPage; studioData: StudioPageData }> {
  const allSlugs = output.pages.map(p => p.slug.startsWith('/') ? p.slug : `/${p.slug}`);
  
  const result = new Map();
  for (const page of output.pages) {
    const studioData = convertPageToStudioFormat(page, allSlugs);
    result.set(page.slug, { page, studioData });
  }
  return result;
}
```

This requires threading the `allPageSlugs` parameter down through `convertComponentToStudio()`, `transformPropsForStudio()`, `fixLink()`, etc. — or create a converter class that holds state per-conversion rather than globally.

---

## 6. 🟡 MEDIUM ISSUES — Fix Next

### Issue #7: Features Component Icons Render as Text
**Impact:** Screenshot shows "map-pin", "phone", "clock" as visible text instead of rendered icons.

**Root Cause:** The Features component in the Studio registry uses `iconStyle: "emoji"` by default. When the AI generates Lucide icon names (like "map-pin", "phone", "clock"), the component renders them as text strings instead of icons.

**Files:**
- `src/lib/ai/website-designer/converter.ts` — Features handler
- `src/lib/ai/website-designer/prompts.ts` — Icon generation instructions

**Fix in converter.ts Features handler:**
```typescript
if (type === "Features") {
  const features = props.features || props.items || [];
  return {
    // ...existing props...
    iconStyle: "icon", // Force icon rendering mode, not emoji
    features: Array.isArray(features) ? features.map((f, i) => ({
      id: String(i + 1),
      title: f.title || f.name || `Feature ${i + 1}`,
      description: f.description || f.content || "",
      icon: f.icon || "star",
      iconColor: f.iconColor || props.iconColor || "",
      iconBackgroundColor: f.iconBackgroundColor || "",
    })) : [],
    // ...rest
  };
}
```

**Fix in prompts.ts** — Update icon instructions in PAGE_GENERATOR_PROMPT:
```
### FEATURE ICONS
- Use EMOJI icons (🏆, ⭐, 💈, ✂️, 🎯) NOT Lucide icon names
- Emojis render correctly across all browsers
- Match icons to the business type:
  - Barbershop: ✂️ 💈 🪒 👔 💇‍♂️ ⭐
  - Restaurant: 🍽️ 👨‍🍳 🍷 🌿 ⭐ 🏆
  - Fitness: 💪 🏋️ 🧘 🏃 ❤️ ⭐
  - Professional: 📊 🎯 💼 🏆 ⚖️ 🔒
```

---

### Issue #8: CTA Text Not Industry-Appropriate
**Impact:** Barbershop website shows "Get Started Free" and "Get Started" instead of "Book Appointment" or "Visit Us".

**Root Cause:** The CTA component's `defaultProps` have `buttonText: "Get Started Free"` and the AI doesn't always override these.

**Fix in prompts.ts** — Add CTA text guidance per industry:
```
### CTA BUTTON TEXT RULES
- NEVER use generic text like "Get Started" or "Get Started Free" unless it's a SaaS product
- Match the CTA to the business type:
  - Barbershop/Salon: "Book Appointment", "Schedule Visit", "Book Now"
  - Restaurant: "Reserve a Table", "Order Now", "View Menu"
  - Fitness/Gym: "Start Free Trial", "Join Now", "Book a Class"
  - Professional Services: "Schedule Consultation", "Get a Quote", "Contact Us"
  - E-commerce: "Shop Now", "Browse Collection", "View Products"
  - Real Estate: "Browse Listings", "Schedule Viewing", "Contact Agent"
  - Construction: "Get Free Estimate", "Request Quote"
  - Healthcare: "Book Appointment", "Schedule Visit"
```

**Fix in converter.ts CTA handler** — Smart default based on context:
```typescript
if (type === "CTA") {
  const ctaText = String(props.ctaText || props.buttonText || "Contact Us"); // Better default than "Get Started"
  // ...
}
```

---

### Issue #9: Footer Generator Doesn't Receive Industry/Services Context
**Impact:** AI can't generate industry-appropriate footer content because it doesn't know what services the business offers.

**File:** `src/lib/ai/website-designer/engine.ts` — `generateFooter()` method (line ~650)

**Current footer prompt is missing:**
- Industry type
- Business description  
- Services list
- Page names being generated

**Fix — Enhance the footer generation prompt:**
```typescript
private async generateFooter(): Promise<GeneratedComponent> {
  // Build context about what pages exist
  const pageLinks = this.architecture?.pages.map(p => ({
    label: p.name,
    href: p.slug,
  })) || [];

  // Get services for footer columns
  const services = this.context?.services?.slice(0, 6).map(s => s.name) || [];
  
  const { object } = await generateObject({
    model: getAIModel("footer"),
    schema: FooterComponentSchema,
    system: FOOTER_GENERATOR_PROMPT,
    prompt: `Generate a premium footer configuration.

Business: ${this.getBusinessName()}
Industry: ${this.context?.client.industry || "general"}
Business Description: ${this.context?.client.description || `A ${this.context?.client.industry || "professional"} business`}
Services Offered: ${services.length > 0 ? services.join(", ") : "Not specified"}
Pages on This Website: ${JSON.stringify(pageLinks)}
Contact Email: ${this.context?.contact.email || ""}
Contact Phone: ${this.context?.contact.phone || ""}
Address: ${JSON.stringify(this.context?.contact.address || {})}
Social Links: ${JSON.stringify(this.context?.social || [])}
Business Hours: ${JSON.stringify(this.context?.hours || [])}
Style: ${this.architecture?.sharedElements.footer.style || "comprehensive"}
Columns: ${this.architecture?.sharedElements.footer.columns || 3}
Show Newsletter: ${this.architecture?.sharedElements.footer.newsletter}
Design Tokens: ${JSON.stringify(this.architecture?.designTokens || {})}

CRITICAL: Footer columns must contain links relevant to "${this.context?.client.industry || "this"}" business.
Use the ACTUAL services and pages listed above, NOT generic corporate services.
The tagline must describe this specific business, not a generic company.

Configure ALL footer props for a complete, professional result.`,
  });

  return {
    id: "shared-footer",
    type: "Footer",
    props: {
      ...object,
      companyName: this.getBusinessName(), // Use correct prop name
      copyright: `© ${new Date().getFullYear()} ${this.getBusinessName()}. All rights reserved.`,
    },
  };
}
```

---

### Issue #10: Footer Schema Missing Key Fields
**Impact:** The `FooterComponentSchema` in schemas.ts doesn't include `companyName` or `description` which the Studio Footer component expects.

**File:** `src/lib/ai/website-designer/schemas.ts` (line ~210)

**Current Schema Missing:**
- `companyName` (Studio expects this, NOT `businessName`)
- `description` (tagline/description for footer)
- `legalLinks` (Privacy Policy, Terms of Service)

**Fix — Add missing fields:**
```typescript
export const FooterComponentSchema = z.object({
  variant: z.string().optional(),
  companyName: z.string().optional().describe("The business name"),
  description: z.string().optional().describe("A one-line tagline describing this specific business"),
  columns: z.array(/* existing */).optional(),
  // ...rest of existing fields...
  legalLinks: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    })
  ).optional().describe("Legal links like Privacy Policy, Terms of Service"),
});
```

---

### Issue #11: Converter Footer Handler Uses Wrong Prop Names
**Impact:** The Studio Footer component expects `companyName` but the converter outputs `logoText` as the primary business name field.

**File:** `src/lib/ai/website-designer/converter.ts` — Footer handler (line ~450)

**Fix — Align converter output with Studio Footer's actual fields:**
```typescript
if (type === "Footer") {
  const linkColumns = props.columns || props.sections || props.linkColumns || [];
  const socialLinks = props.socialLinks || props.social || [];
  
  return {
    // Branding — use Studio's actual field names
    companyName: props.companyName || props.businessName || props.logoText || "Brand",
    logo: typeof props.logo === "string" && props.logo.includes("/") ? props.logo : "",
    logoText: props.logoText || props.companyName || props.businessName || "",
    description: props.description || props.tagline || "",
    
    // Link columns
    columns: Array.isArray(linkColumns) ? linkColumns.map((col, i) => ({
      title: col.title || col.heading || `Column ${i + 1}`,
      links: Array.isArray(col.links) ? col.links.map((link) => ({
        label: String(link.label || link.text || ""),
        href: fixLink(String(link.href || link.url || ""), String(link.label || "")),
      })) : [],
    })) : [],
    
    // Social links
    showSocialLinks: Array.isArray(socialLinks) && socialLinks.length > 0,
    socialLinks: Array.isArray(socialLinks) ? socialLinks.map((s) => ({
      platform: s.platform || s.name || "facebook",
      url: s.url || s.href || "#",
    })) : [],
    
    // Contact
    contactEmail: props.email || props.contactEmail || "",
    contactPhone: props.phone || props.contactPhone || "",
    contactAddress: props.address || props.contactAddress || "",
    showContactInfo: !!(props.email || props.phone || props.address),
    
    // Copyright & Legal
    copyright: props.copyrightText || props.copyright || `© ${new Date().getFullYear()} All rights reserved.`,
    legalLinks: props.legalLinks || [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
    
    // Newsletter
    showNewsletter: props.showNewsletter ?? false,
    newsletterTitle: props.newsletterTitle || "Stay Updated",
    
    // Styling
    variant: props.variant || "standard",
    backgroundColor: props.backgroundColor || "#111827",
    textColor: props.textColor || "#f9fafb",
    linkColor: props.linkColor || "#9ca3af",
    linkHoverColor: props.linkHoverColor || "#ffffff",
  };
}
```

---

### Issue #12: Cost Estimation Uses Wrong Pricing
**Impact:** `estimateCost()` in `ai-provider.ts` uses GPT-4o pricing but the engine uses Claude.

**File:** `src/lib/ai/website-designer/config/ai-provider.ts` (lines 167-180)

**Fix:**
```typescript
// Claude Sonnet pricing (as of 2025)
const inputCostPer1M = 3;    // $3 per 1M input tokens
const outputCostPer1M = 15;   // $15 per 1M output tokens
```

---

### Issue #13: All Model Tiers Use Same Claude Model
**Impact:** Simple tasks (navbar, footer) cost the same as complex tasks (architecture, page content). Wasted money.

**File:** `src/lib/ai/website-designer/config/ai-provider.ts`

**Current:** All three tiers (premium, standard, fast) use `claude-sonnet-4-20250514`.

**Fix — Use Haiku for simple tasks:**
```typescript
anthropic: {
  premium: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    description: "Best quality for architecture and page content",
  },
  standard: {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    description: "Good quality for navbar and footer",
  },
  fast: {
    provider: "anthropic",
    model: "claude-haiku-3-20240307", // or claude-3-5-haiku-20241022
    description: "Fast and cheap for simple tasks",
  },
},
```

**NOTE:** Test this carefully! If Haiku produces bad navbars/footers, revert to Sonnet for those. The architecture and page content should ALWAYS use Sonnet.

---

## 7. 🟢 MINOR ISSUES — Polish

### Issue #14: Hardcoded Zambia Timezone
**File:** `engine.ts` — `generateSiteSettings()` and `getDefaultSiteSettings()`

**Current:** `timezone: "Africa/Lusaka"` hardcoded.

**Fix:** Make it configurable or derive from business data:
```typescript
timezone: this.context?.site?.timezone || "UTC",
```

---

### Issue #15: `getModelInfo()` Ignores Provider Override
**File:** `ai-provider.ts` — `getModelInfo()` always uses `DEFAULT_PROVIDER`.

**Fix:** Accept and use provider parameter:
```typescript
export function getModelInfo(task: string, provider?: AIProvider) {
  const actualProvider = provider || DEFAULT_PROVIDER;
  // ...use actualProvider
}
```

---

### Issue #16: Missing Converter Handlers
**File:** `converter.ts` — `transformPropsForStudio()`

Components that pass through with RAW AI props (no transformation):
- **Gallery** — needs image array handling
- **Newsletter** — needs field mapping
- **LogoCloud** — needs logo array handling
- **TrustBadges** — needs badge array handling
- **Quote** — needs prop mapping

**Fix — Add handlers for each:**
```typescript
// Gallery handler
if (type === "Gallery") {
  const images = props.images || props.items || props.gallery || [];
  return {
    title: props.title || props.headline || "Gallery",
    description: props.description || "",
    images: Array.isArray(images) ? images.map((img, i) => ({
      id: String(i + 1),
      src: img.src || img.url || img.image || "",
      alt: img.alt || img.caption || img.title || `Image ${i + 1}`,
      caption: img.caption || "",
    })) : [],
    columns: props.columns || 3,
    variant: props.variant || "grid",
    gap: props.gap || "md",
  };
}

// Newsletter handler
if (type === "Newsletter") {
  return {
    title: props.title || props.headline || "Stay Updated",
    description: props.description || "Subscribe to our newsletter for the latest updates.",
    buttonText: props.buttonText || props.ctaText || "Subscribe",
    placeholder: props.placeholder || "Enter your email",
    backgroundColor: props.backgroundColor || "",
  };
}
```

---

### Issue #17: `parseUserPrompt()` Regex Fragility
**File:** `prompts.ts` — `parseUserPrompt()` function

The business name extraction regex fails for many common patterns like:
- "Build me a barbershop website called Besto"
- "I want a website for my barbershop Besto"
- "Besto barbershop website"

**Fix — Improve the regex and add more patterns:**
```typescript
function parseUserPrompt(userPrompt: string) {
  // Try multiple patterns for business name extraction
  const patterns = [
    /(?:for|called|named)\s+["']?([^"'\n,]+?)["']?\s*(?:in|located|based|that|which|with|$|,)/i,
    /^(?:create|build|make|design)\s+(?:a\s+)?(?:website\s+)?(?:for\s+)?["']?([^"'\n,]+?)["']?\s+/i,
    /["']([^"']+)["']/i,  // Anything in quotes
    /(?:called|named)\s+(\w+(?:\s+\w+)?)/i,  // "called X" or "named X"
  ];
  
  let businessName: string | null = null;
  for (const pattern of patterns) {
    const match = userPrompt.match(pattern);
    if (match) {
      businessName = match[1].trim();
      // Filter out common false positives
      const falsePositives = ["a", "the", "my", "our", "this", "website", "site", "page"];
      if (!falsePositives.includes(businessName.toLowerCase())) {
        break;
      }
      businessName = null;
    }
  }
  
  // ...rest of function
}
```

---

## 8. Component-by-Component Enhancement Guide

### For EACH component type, go through this checklist:

#### A. Check the Studio Registry Fields
Read `core-components.ts` and find the component's field definitions. Note:
- Every field name the component accepts
- Default values for each field
- Field types (text, color, select, array, toggle, etc.)

#### B. Check the Converter Handler
Read `converter.ts`'s `transformPropsForStudio()` for this component type. Verify:
- ✅ All critical Studio fields are being set
- ✅ AI output prop names are mapped to Studio prop names correctly
- ✅ Array items have all required sub-fields
- ✅ Default values are sensible for the industry
- ✅ Colors from design tokens are applied

#### C. Check the AI Prompt
Read `prompts.ts` for any instructions about this component. Verify:
- ✅ The AI is told what fields to generate
- ✅ Industry-specific guidance is provided
- ✅ Content quality rules are clear

#### D. Check the Zod Schema
Read `schemas.ts` for the output schema. Verify:
- ✅ All important fields are in the schema
- ✅ Field descriptions guide the AI correctly
- ✅ Types match what the converter expects

### Component Enhancement Specifics:

#### 🔷 Hero Component
**Converter handler status:** Good, but missing fields
**Missing from converter:**
- `titleSize`, `titleWeight`, `titleAlign`
- `badge`, `badgeColor`, `badgeTextColor`, `badgeStyle`
- `descriptionMaxWidth`
- `primaryButtonIcon`, `primaryButtonRadius`
- `image`, `imageAlt` (for split variants)
- `paddingTop`, `paddingBottom`
- Animation fields

**Enhancement:** Add these to the Hero handler:
```typescript
if (type === "Hero") {
  return {
    // ...existing fields...
    titleSize: props.titleSize || "xl",
    titleWeight: props.titleWeight || "bold",
    titleAlign: props.titleAlign || "center",
    subtitleSize: props.subtitleSize || "lg",
    descriptionSize: props.descriptionSize || "md",
    descriptionMaxWidth: props.descriptionMaxWidth || "lg",
    badge: props.badge || "",
    badgeColor: props.badgeColor || "",
    badgeTextColor: props.badgeTextColor || "",
    primaryButtonIcon: props.primaryButtonIcon || "arrow",
    primaryButtonRadius: props.primaryButtonRadius || "lg",
    // Split variant image
    image: props.image || props.heroImage || "",
    imageAlt: props.imageAlt || "",
    imagePosition: props.imagePosition || "right",
    // Sizing
    minHeight: props.minHeight || "100dvh",
    maxWidth: props.maxWidth || "7xl",
    paddingTop: props.paddingTop || "xl",
    paddingBottom: props.paddingBottom || "xl",
  };
}
```

#### 🔷 Features Component
**Converter handler status:** Basic, missing many styling fields
**Missing from converter:**
- `variant` (10 options: cards, minimal, centered, etc.)
- `iconStyle` — CRITICAL (must be "emoji" or "icon")
- `showBorder`, `showShadow`
- `cardBackgroundColor`, `cardBorderRadius`, `cardPadding`
- `gap`, `sectionGap`
- Per-feature `iconColor`, `iconBackgroundColor`
- `hoverEffect`

**Enhancement:** The AI should specify the variant and card styling.

#### 🔷 CTA Component
**Converter handler status:** Missing key fields
**Missing:**
- `variant` (10 options)
- `buttonStyle`, `buttonSize`, `buttonRadius`, `buttonIcon`
- `badge`, `badgeColor`
- `textColor` (Studio default is "#ffffff")
- `trustBadges` array
- Gradient background fields

**Key Fix:** CTA converter currently maps `ctaText` → `ctaText` but Studio uses `buttonText`:
```typescript
// Current converter:
ctaText, ctaLink  // WRONG field names for Studio
// Should be:
buttonText: ctaText,
buttonLink: fixLink(...),
```

#### 🔷 Testimonials Component
**Converter handler status:** Missing key fields
**Missing:**
- `variant` (10 options)
- `rating` per testimonial
- `company` per testimonial
- `showAvatar`, `avatarSize`, `avatarShape`
- `showRating`, `ratingStyle`, `ratingColor`
- `showQuoteIcon`
- `cardBackgroundColor`, `cardBorderRadius`

#### 🔷 Stats Component
**Converter handler status:** Basic
**Missing:**
- `variant` (10 options)
- `animateNumbers`, `animationDuration` — stats should count up!
- `valueSize`, `valueColor`, `valueFont`
- Per-stat `icon`, `suffix`, `prefix`
- `showIcons`
- Background colors

#### 🔷 Team Component
**Converter handler status:** Basic
**Missing:**
- `variant` (10 options)
- Social links per member (linkedin, twitter, etc.)
- `showSocial`
- `imageShape`, `imageBorder`
- `showBio`, `bioMaxLines`

#### 🔷 Navbar Component
**Converter handler status:** Has the prop name mismatch bug (see Critical Bug #2)
**Missing:**
- `layout` (standard, centered, split, minimal)
- `linkAlignment`, `linkSpacing`, `linkFontSize`
- `ctaIcon`, `secondaryCtaText`
- `stickyOffset`
- Scroll progress fields
- Dropdown support

#### 🔷 Footer Component
**Converter handler status:** Wrong prop names (see Medium Issue #11)
**Missing:**
- `variant` (standard, centered, simple, extended)
- `companyName` (uses `logoText` instead)
- `showContactInfo`, `contactEmail`, `contactPhone`, `contactAddress`
- `legalLinks` array
- `showMadeWith`
- `columnsLayout`

---

## 9. Prompt Engineering Improvements

### A. SITE_ARCHITECT_PROMPT Enhancements

**Problem:** The prompt has inline industry architectures that OVERLAP with `industry-blueprints.ts`. This causes confusion — the AI sees two potentially conflicting sets of industry guidance.

**Fix Options:**
1. **Remove inline industry architectures from SITE_ARCHITECT_PROMPT** and rely entirely on blueprints (recommended if blueprints are comprehensive)
2. **Keep both** but clearly state blueprints take priority (current approach, works but messy)

**Additional Enhancement — Add barbershop/salon/spa:**
The inline industry architectures don't include barbershop/salon/spa! Add:
```
### 💈 BARBERSHOP / SALON / SPA / BEAUTY
**Required Pages**: Home, Services, Gallery, About, Contact
**Hero Must Include**:
- Stylish interior or service photo with overlay
- "Book Appointment" or "Reserve Your Spot" CTA
- Operating hours visible

**Page Structure**:
1. **Home**:
   - Hero: Stylish service/interior photo, "Premium Grooming Experience", "Book Now" CTA
   - Services Overview: 3-6 signature services with prices
   - Gallery Preview: 4-6 best work photos
   - Testimonials: 3 client reviews with ratings
   - Stats: Years in business, happy clients, barbers/stylists, rating
   - CTA: "Book Your Appointment Today"

2. **Services**:
   - Service categories with descriptions and prices
   - Duration for each service
   - "Book This Service" buttons

3. **Gallery**:
   - Before/after photos
   - Salon/shop interior
   - Team at work

4. **About**:
   - Shop story and founding
   - Team members with specialties
   - Philosophy/approach

5. **Contact**:
   - Booking form
   - Map with location
   - Hours, phone, walk-in policy
```

### B. PAGE_GENERATOR_PROMPT Enhancements

**Add these critical rules:**

```
### RULE #5: DESCRIPTION IS MANDATORY FOR HERO
- EVERY Hero MUST have a "description" prop with 1-2 sentences about this business
- This description will appear below the title on the hero section
- NEVER leave it empty — the system fills empty descriptions with generic platform text
- Example: "Experience premium grooming services at Besto. Our master barbers deliver precision cuts and styling in the heart of Lusaka."

### RULE #6: CTA TEXT MUST BE INDUSTRY-APPROPRIATE
- Never use "Get Started" or "Get Started Free" for service businesses
- Barbershop/Salon: "Book Appointment", "Book Now", "Schedule Visit"
- Restaurant: "Reserve a Table", "View Menu", "Order Now"  
- Professional: "Schedule Consultation", "Get a Quote"
- E-commerce: "Shop Now", "Browse Collection"

### RULE #7: USE EMOJI ICONS FOR FEATURES
- For the Features component, use EMOJI icons, not text icon names
- ✂️ not "scissors", 💈 not "barbershop", 📞 not "phone"
- The system renders emojis directly but cannot render text icon names

### RULE #8: EVERY COMPONENT MUST HAVE A VARIANT
- Specify the "variant" prop for every component
- Available variants differ per component type:
  - Hero: centered, split, splitReverse, fullscreen, video, minimal
  - Features: cards, minimal, centered, icons-left, icons-top, bento
  - CTA: centered, left, split, banner, floating, gradient, glass
  - Testimonials: cards, minimal, quote, carousel, masonry, grid
  - Stats: simple, cards, bordered, icons, minimal, gradient
  - Team: cards, minimal, detailed, grid, modern, hover-reveal
```

### C. NAVBAR_GENERATOR_PROMPT Enhancement

**Add CTA text guidance:**
```
### CTA TEXT RULES
- The CTA button text must match the business type:
  - Barbershop/Salon: "Book Now" → link to /contact or /book
  - Restaurant: "Reserve" → link to /reserve or /contact
  - E-commerce: "Shop Now" → link to /shop or /products
  - Professional: "Free Consultation" → link to /contact
- NEVER use generic "Get Started" for service businesses
```

### D. FOOTER_GENERATOR_PROMPT 
Already addressed in Critical Bug #4 above.

---

## 10. Dead Code Audit & Cleanup

### Decision Required for Each Dead Code System:

#### 1. `config/design-references.ts` (1051 lines)
**Status:** Imported in engine.ts but `findDesignReference()` and `formatReferenceForAI()` are NEVER CALLED.
**Recommendation:** Either wire it into the engine as a fallback when blueprints aren't found, OR delete it. It overlaps with blueprints.
**Wire-in approach:** In engine.ts after blueprint lookup, if no blueprint found:
```typescript
if (!this.activeBlueprint) {
  const designRef = findDesignReference(industry, input.prompt);
  if (designRef) {
    // Use design reference as fallback
  }
}
```

#### 2. `intelligence/` directory (1208 lines total)
**Files:** `industry-templates.ts`, `page-planner.ts`, `component-scorer.ts`
**Status:** Exported but not used by engine.ts
**Recommendation:** These could improve quality significantly. Wire them in:
- `component-scorer.ts` → Score generated components and reject low-quality ones
- `page-planner.ts` → Better page planning before AI generation
- `industry-templates.ts` → Overlaps with blueprints, likely can be deleted

#### 3. `content/section-generators.ts` (704 lines)
**Status:** Not imported anywhere
**Recommendation:** Could be used for per-section content generation (13 specialized generators). Would improve content quality but adds AI calls. Decision: keep for future use or delete.

### Clean-up Action:
At minimum, remove dead imports from engine.ts:
```typescript
// Currently imported but never used:
import { findDesignReference, formatReferenceForAI } from "./config/design-references";
```

---

## 11. Quality Validation Checklist

After making all changes, generate a test website and verify:

### Content Quality
- [ ] Hero title uses the EXACT business name from the prompt
- [ ] Hero description is specific to the business (NOT "Create beautiful websites...")
- [ ] CTA button text is industry-appropriate (NOT "Get Started" for barbershops)
- [ ] Footer columns have relevant services (NOT "Premium Consulting" for barbershops)
- [ ] Footer tagline describes this specific business
- [ ] Copyright symbol renders correctly (© not ┬⌐)
- [ ] All testimonials feel authentic and specific to the business
- [ ] Stats are realistic for the business type

### Navigation
- [ ] All navbar links point to actual generated pages
- [ ] Navbar links render correctly (not empty)
- [ ] Mobile menu works with close button
- [ ] CTA button in navbar has correct text and link

### Visual Quality
- [ ] Hero has proper overlay when background image is present
- [ ] Text is readable over all backgrounds (contrast ratio ≥ 4.5:1)
- [ ] Feature icons render as emojis (not text strings)
- [ ] Consistent color scheme across all components
- [ ] Design tokens applied to every component

### Technical
- [ ] No console errors in browser
- [ ] All links navigate to valid pages
- [ ] No duplicate navbar/footer on any page
- [ ] All components render without errors

---

## 12. Memory Bank Update Instructions

After completing all fixes, update these memory bank files:

### `/memory-bank/activeContext.md`
Update with:
- List of all bugs fixed
- Current state of each component handler
- Any remaining issues
- Next steps for further improvement

### `/memory-bank/progress.md`
Update with:
- Mark completed: "AI Website Designer system overhaul"
- List all specific changes made
- Note what was tested and verified
- Note any known remaining issues

### `/memory-bank/systemPatterns.md`
Update with:
- Converter prop mapping patterns
- Studio component field reference
- AI prompt engineering patterns discovered
- Blueprint vs design reference priority chain

---

## 🏁 EXECUTION ORDER — PHASE 1: LISTED FIXES

Work through fixes in this exact order:

1. **Bug #5:** Fix copyright encoding (`┬⌐` → `©`) — 1 line change
2. **Bug #2:** Fix navbar prop mismatch (`navItems` not being read) — 1 line change
3. **Bug #3:** Fix platform description leaking — 3 files
4. **Bug #4:** Fix footer prompt + add industry context — 2 files
5. **Bug #1:** Add EngineConfig to API routes — 2 files
6. **Issue #7:** Fix feature icons (emoji vs text) — 2 files
7. **Issue #8:** Fix CTA text for industries — 2 files
8. **Issue #9:** Enhance footer generation with business context — 1 file
9. **Issue #10:** Add missing Footer schema fields — 1 file
10. **Issue #11:** Fix converter Footer handler prop names — 1 file
11. **Bug #6:** Fix global mutable state (thread safety) — 1 file (careful refactor)
12. **Issue #12:** Fix cost estimation pricing — 1 file
13. **Issue #16:** Add missing converter handlers (Gallery, Newsletter) — 1 file
14. **Issue #17:** Improve parseUserPrompt regex — 1 file
15. **Component enhancements:** Enhance all converter handlers (Hero, Features, CTA, etc.) — 1 file
16. **Prompt enhancements:** Add industry-specific guidance — 1 file
17. **Dead code cleanup** — multiple files
18. **Test and validate** — generate a test website
19. **Update memory bank** — 3 files

**Estimated total for Phase 1: ~500-800 lines of changes across 8-10 files.**

---

## 🔁 PHASE 2: FULL SELF-REVIEW & AUTONOMOUS IMPROVEMENT PASS

> **THIS IS MANDATORY.** After completing ALL Phase 1 fixes, you MUST perform a full, independent self-review of the ENTIRE generation system. Do NOT skip this. Do NOT just say "everything looks good." Actually re-read every file, find issues, and fix them.

### Step 1: Re-Read Every Modified File End-to-End

Re-read the COMPLETE contents of every file you modified. Not a skim — read every single line. For each file, ask yourself:

- Are there any typos, syntax errors, or logic bugs I introduced?
- Are there any inconsistencies between this file and other files I changed?
- Did I miss any prop mappings, field names, or edge cases?
- Are all the default values sensible for ALL industries (not just barbershop)?
- Are there any TODO comments I left behind?
- Is the code clean, well-commented, and following the existing patterns?

**Files to re-read (minimum):**
1. `src/lib/ai/website-designer/converter.ts` — Every handler, every prop mapping
2. `src/lib/ai/website-designer/engine.ts` — generateNavbar, generateFooter, createArchitecture
3. `src/lib/ai/website-designer/prompts.ts` — Every system prompt, every rule
4. `src/lib/ai/website-designer/schemas.ts` — Every schema field and description
5. `src/lib/ai/website-designer/config/ai-provider.ts` — Pricing, model configs
6. `src/app/api/ai/website-designer/route.ts` — Request validation
7. `src/app/api/ai/website-designer/stream/route.ts` — Request validation
8. `src/lib/studio/registry/core-components.ts` — Default props you changed

### Step 2: Cross-File Consistency Audit

Go through this cross-file consistency checklist. Every "YES" means there's a bug to fix:

| # | Check | Files Involved | Issue if YES |
|---|-------|----------------|--------------|
| 1 | Does the Navbar schema output field names that the converter doesn't read? | schemas.ts vs converter.ts | Prop mismatch |
| 2 | Does the Footer schema output field names that the converter doesn't read? | schemas.ts vs converter.ts | Prop mismatch |
| 3 | Does engine.ts set props that the converter then overwrites/ignores? | engine.ts vs converter.ts | Wasted computation |
| 4 | Do the prompts tell the AI to generate fields that the schema doesn't accept? | prompts.ts vs schemas.ts | AI output silently dropped |
| 5 | Do the prompts tell the AI to use prop names different from what the converter expects? | prompts.ts vs converter.ts | Wrong output |
| 6 | Does the converter output prop names that the Studio components don't recognize? | converter.ts vs core-components.ts | Props ignored |
| 7 | Are there any imports that are now unused after dead code cleanup? | All modified files | Lint errors |
| 8 | Does the EngineConfig schema in route.ts match the EngineConfig interface in engine.ts? | route.ts vs engine.ts | Validation mismatch |
| 9 | Do all `fixLink()` calls pass appropriate context strings? | converter.ts | Bad link resolution |
| 10 | Are all AI prompt rules consistent (no contradictions between prompts)? | prompts.ts | Confused AI output |

### Step 3: Prop Name Alignment Audit

For EACH component type, verify this chain is aligned end-to-end:

```
Schema field name → AI outputs that name → Converter reads that name → Studio renders that name
```

Do this for ALL 8 major components:

**Navbar:**
- Schema says `navItems` → Does AI output `navItems`? → Does converter read `navItems`? → Does Studio expect `links`?
- Schema says `ctaText` → Does converter pass `ctaText`? → Does Studio expect `ctaText`?
- Check EVERY field in NavbarComponentSchema against the converter Navbar handler against the Studio Navbar fields

**Footer:**
- Schema says `columns` → Converter reads `columns`? → Studio expects `columns`?
- Schema says `businessName` or `companyName`? → Converter outputs which? → Studio expects which?
- Check EVERY field

**Hero:**
- Schema uses `GeneratedComponentSchema` (generic `props: z.record`) → AI output prop names → Converter maps them → Studio expects what?
- Does AI output `headline` or `title`? Converter handles both?
- Does AI output `ctaText` or `primaryButtonText`? Converter handles both?

**Repeat for: Features, CTA, Testimonials, Stats, Team, ContactForm, FAQ, Pricing, Gallery**

### Step 4: Edge Case Hunting

Think through these edge cases and verify the system handles them:

1. **What if the user prompt has NO business name?** Does `parseUserPrompt()` gracefully return null? Does the rest of the pipeline handle null business names?
2. **What if Supabase returns empty data?** (no services, no team, no testimonials) Does the AI still generate good content? Does the footer still work?
3. **What if the AI generates a component type not in the typeMap?** Does it gracefully pass through or crash?
4. **What if the AI generates empty arrays?** (empty features, empty testimonials, empty stats) Does the converter handle `[]` gracefully?
5. **What if a link is a full URL (https://...) instead of a path?** Does `fixLink()` handle it correctly or break it?
6. **What if the AI generates 0 pages?** Does the architecture schema's `.min(1)` catch it? What about the navbar generation that depends on pages?
7. **What if design tokens are partially undefined?** (primaryColor set but accentColor missing) Does every component handle missing colors?
8. **What happens with non-English business names or prompts?** Unicode handling correct?

For each edge case: trace the code path, find the handling, and fix if broken.

### Step 5: Prompt Quality Review

Re-read every system prompt (`SITE_ARCHITECT_PROMPT`, `PAGE_GENERATOR_PROMPT`, `NAVBAR_GENERATOR_PROMPT`, `FOOTER_GENERATOR_PROMPT`) with FRESH EYES and ask:

1. **Contradictions:** Do any two rules contradict each other?
2. **Missing industries:** Are there common business types not covered? (car wash, pet store, dentist, veterinarian, tattoo parlor, music school, daycare, florist, bakery, brewery, car dealership, insurance, accounting, etc.)
3. **Ambiguity:** Are any instructions vague enough that the AI might misinterpret them?
4. **Completeness:** Does the prompt cover EVERY field the AI needs to fill out?
5. **Priority conflicts:** If the blueprint says one thing and the prompt rules say another, which wins? Is this clear?
6. **Token efficiency:** Are any prompt sections unnecessarily verbose? (longer prompts = higher cost = slower generation)
7. **Examples:** Would adding 1-2 concrete JSON output examples improve AI output quality? Consider adding a "GOOD OUTPUT" example for the most critical components (Hero, Features, Footer).

### Step 6: Find NEW Issues Not Listed in Phase 1

After re-reading everything, look specifically for issues I did NOT list in this document. Things like:

- **Performance bottlenecks:** Are there unnecessary awaits, redundant data fetches, or inefficient loops?
- **Error handling gaps:** What happens if an AI call fails? Is there retry logic? Graceful degradation?
- **Missing validation:** Are there places where AI output could crash the converter? (e.g., `props.features.map()` when features is a string instead of an array)
- **Logging improvements:** Are console.log messages helpful for debugging? Should more be added?
- **Type safety:** Are there `as` casts or `any` types that could be improved?
- **Security:** Could malicious prompt input cause issues? (prompt injection, XSS in generated content)
- **Accessibility:** Do generated websites have proper ARIA labels, alt text, heading hierarchy?

**For EVERY new issue you find: FIX IT IMMEDIATELY. Do not just note it — fix it right there.**

### Step 7: Generate a Test Website (Mental Simulation)

Mentally trace through the ENTIRE pipeline for this exact prompt:
```
"Create a barbershop website for Besto in Lusaka"
```

Walk through every function call:
1. `parseUserPrompt("Create a barbershop website for Besto in Lusaka")` → What does it return?
2. `findBlueprint("barbershop", ...)` → Does it find anything? If not, what happens?
3. `createArchitecture(...)` → What does SITE_ARCHITECT_PROMPT produce?
4. For each page: `generatePage(...)` → What does PAGE_GENERATOR_PROMPT produce?
5. `generateNavbar(...)` → Are nav links correct? CTA text appropriate?
6. `generateFooter(...)` → Are columns relevant? Tagline specific?
7. `convertOutputToStudioPages(...)` → Does every component convert correctly?

At each step, verify the output would be high-quality and industry-appropriate.

### Step 8: Second Business Type Trace

Repeat Step 7 with a DIFFERENT business type to catch any barbershop-specific assumptions:
```
"Build an Italian restaurant website called La Bella Cucina in Cape Town"
```

Verify:
- Menu page is generated
- "Reserve a Table" CTA (not "Book Appointment")
- Footer has restaurant-relevant columns
- Blueprint match works for restaurant industry

### Step 9: Fix Everything You Found

Go back and fix EVERY issue you discovered in Steps 1-8. No exceptions. No "this is minor, skip it." Fix everything.

### Step 10: Final Commit & Memory Bank

After all Phase 2 fixes:
1. Commit with message: `fix: complete self-review pass — [N] additional issues found and fixed`
2. Update memory bank files with:
   - Phase 2 findings and fixes
   - Any patterns or learnings discovered
   - Final state of the system
   - Remaining known limitations (if any)

---

## 🔁 PHASE 3: FINAL POLISH PASS

> After Phase 2, do ONE MORE quick pass focused purely on polish and professional quality.

### Polish Checklist:

1. **Code Comments:** Are all functions and complex logic blocks well-commented? Add JSDoc comments to any public functions missing them.

2. **Console Logging:** Review all `console.log` and `console.warn` statements. Are they:
   - Prefixed with `[WebsiteDesignerEngine]` or similar for easy filtering?
   - Logging useful information (not sensitive data)?
   - Using appropriate levels (log vs warn vs error)?

3. **Error Messages:** Are error messages user-friendly and actionable? Or are they cryptic developer messages?

4. **Default Values:** Go through EVERY default value in every converter handler. Ask: "If this default is used, will the generated website look broken or weird?" If yes, change it to something better.

5. **Prompt Spelling & Grammar:** Re-read all AI system prompts for typos, grammatical errors, or unclear phrasing. The AI follows these literally — a typo in a rule could cause bad output.

6. **Unused Imports:** Check every modified file for imports that are no longer used. Remove them.

7. **TypeScript Strictness:** Run the TypeScript compiler. Fix any type errors introduced by your changes.

8. **Consistent Formatting:** Ensure code style is consistent with the rest of the codebase (indentation, spacing, quotes, semicolons).

### Final Commit:
```
git add -A
git commit -m "polish: final quality pass on AI website designer system"
git push
```

---

> **REMEMBER:** The goal is websites that look like they cost $50,000 from a premium agency. Every change should move toward that goal. After all 3 phases, the system should be generating STUNNING, professional, industry-appropriate websites with ZERO manual editing required. Test after each major change. Commit frequently with descriptive messages.

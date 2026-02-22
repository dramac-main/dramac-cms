# PHASE AWD-10: AI-First Redesign — Unleash the Designer

## Executive Summary

The AI Website Designer currently fights the AI at every step — overwriting its color choices with hardcoded palettes, replacing its prop decisions in the converter, ignoring user preferences, and drowning it in 4,000+ words of rigid instructions. The result: robotic, cookie-cutter sites that all look the same regardless of industry or user intent.

**The fix:** Stop treating the AI like a code generator that needs hand-holding. Treat it like what it is — a world-class designer with deep knowledge of color theory, typography, layout, conversion optimization, and industry aesthetics. Our job is to give it context and get out of its way.

**The shift:** From "we tell the AI what to do" → "the AI tells us what's best."

---

## Current State — What's Broken and Why

### Problem 1: We Override Every AI Decision

```
User describes their restaurant → AI carefully picks warm terracotta & olive colors
→ Engine overwrites with Blueprint palette #1 (always the same one)
→ Every restaurant gets identical colors
```

**Files involved:**
- `engine.ts` L762-800: Blueprint/QuickTokens/Inspiration systems overwrite ALL AI-chosen colors
- `converter.ts` L641-1100: Every component handler replaces AI props with hardcoded values
- `variety-engine.ts`: `getDesignPersonality()` ignores user style, picks randomly by industry

### Problem 2: User Preferences Are Cosmetic

The Design Style dropdown ("Modern", "Elegant", etc.) and Color Palette dropdown ("Warm", "Cool", etc.) exist in the UI but are ~95% ignored:
- `getDesignPersonality()` only accepts `industry`, not user style
- `getQuickDesignTokens()` only accepts `industry`, not color preference
- Preferences are serialized as raw JSON but never interpreted
- Blueprint system overwrites everything anyway

**Result:** User picks "Elegant" + "Warm Colors" → gets the same output as "Bold" + "Cool Colors."

### Problem 3: The Converter is a Second Designer

The converter was built to "help" the AI, but it actually replaces the AI:
- AI sets `buttonColor: "#e07c4f"` (warm terracotta) → Converter sets `buttonColor: themePrimary()` (blueprint's blue)
- AI sets `paddingY: "xl"` → Converter doesn't pass it through, render gets default
- AI sets `cardBackgroundColor: "#fdf6f0"` → Converter sets `palette().cardBg` (hardcoded)
- ~70% of what the AI outputs is thrown away

### Problem 4: Design Personality Dies at Architecture

The architecture step generates a rich design personality (hero style, card style, animation level, density). But individual pages are generated **without knowing any of this**. The personality context never reaches `buildPagePrompt()`.

### Problem 5: Prompts Over-Instruct

4,000+ words of rigid rules: "8px grid spacing", "min 14px font", "44px touch targets", "EXACTLY 3, 4, or 6 features", "CTA background must be #1f2937". Claude Sonnet 4 knows all of this already. We're wasting tokens telling it things it knows, while constraining its creative potential.

### Problem 6: The AI is Blind to Its Own Toolkit

**This is a critical discovery.** The current `summarizeComponents()` method tells the AI:

```
- Hero (sections): Premium hero section [87 fields]
- Features (sections): Feature grid [45 fields]
- CTA (marketing): Call to action [38 fields]
```

The AI is told "87 fields exist" but **not what they are**. It has no idea it can set `backgroundAttachment: "fixed"` for parallax, or `imageAnimation: "zoom"`, or `paddingX: "xl"`, or `cardBorderRadius: "2xl"`. It's like giving a painter a palette of 87 colors but covering the labels — the painter can't use what they can't see.

Meanwhile, the component registry has **rich field definitions** for every component — field names, types (color, select, toggle, number), allowed options, labels, default values — everything the AI needs. This data exists. It's just not being shown to the AI.

Additionally, `componentDetails` (the second data source) only sends field definitions for components the architecture step already suggested. The AI can't discover components on its own — it can only use what the architecture step pre-picked. If a new component gets added to the registry, the AI will never know about it unless the architecture prompt is manually updated to mention it.

### Problem 7: Actual Bugs

- "About" component type not registered → About sections render as nothing
- Pricing converter uses `monthlyPrice`, PricingRender reads `price` → Prices show as $0
- FAQ converter sets `expandFirst: true`, FAQRender expects `defaultOpen: 0` → Never auto-opens
- Dynamic Tailwind classes (`grid-cols-${n}`) get purged in production → Layouts break

---

## The New Philosophy

### The Golden Rule

> **The AI is the designer. We are the translator.**

The AI decides colors, spacing, typography, layout, animations, content tone — everything creative. Our code only does three things:

1. **Inform** — Give the AI rich context about the business, industry, and what every component can do (every field, every option, every knob)
2. **Translate** — Normalize AI output field names to match component prop names
3. **Guard** — Prevent actual bugs (broken links, missing overlays on images, duplicate navbars)

### What This Means in Practice

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| Colors | Hardcoded from 10 blueprint palettes | AI chooses based on business description, industry psychology, brand identity |
| Spacing | Converter hardcodes or omits | AI decides every padding, gap, margin |
| Typography | Blueprint overwrites fonts | AI selects fonts that match the brand personality |
| Layout | Rigid section ordering from blueprints | AI determines optimal flow for this specific business |
| Animations | Hardcoded "fade-up" everywhere | AI chooses animation style and intensity per section |
| Content tone | Same professional tone for everything | AI matches tone to business: playful for a toy store, luxurious for a spa, authoritative for a law firm |
| Buttons | `themePrimary()` hardcoded | AI picks button colors that convert for this specific design |
| User preferences | Dropdowns → ignored | Eliminated. AI reads the user's full context and decides |
| Post-generation | What you see is what you get | User can tweak colors globally after seeing AI's vision |
| Component discovery | AI told "87 fields" but not what they are | AI sees every field name, type, options, and defaults — full toolkit |
| New components | Must manually update prompts | Automatically discovered from registry at generation time |

---

## Phase 1: Fix Actual Bugs

**Priority:** Immediate — these are code errors, not philosophy.

### 1.1 — Register "About" Component

**Problem:** The converter maps `AboutBlock` → `About`, but no `AboutRender` exists in the component registry. About sections silently disappear.

**Fix:** Map `About` → `Features` in the converter's typeMap. About sections are effectively "values/pillars" content — Features handles this well with its card layout, icons, and rich descriptions. The AI will naturally generate about-appropriate content (values, mission, story) in the Features format.

**Files:** `converter.ts` (typeMap)

### 1.2 — Fix Pricing Field Mismatch

**Problem:** Converter outputs `monthlyPrice` but PricingRender reads `plan.price`. All pricing shows $0.

**Fix:** Change converter to output `price` instead of `monthlyPrice`.

**Files:** `converter.ts` (Pricing handler)

### 1.3 — Fix FAQ Prop Mismatch

**Problem:** Converter sets `expandFirst: true` but FAQRender expects `defaultOpen: 0` (number).

**Fix:** Change to `defaultOpen: 0`. Remove `expandFirst` and `enableSchema` (non-existent render props).

**Files:** `converter.ts` (FAQ handler)

### 1.4 — Tailwind Dynamic Class Safelist

**Problem:** Components use `grid-cols-${columns}` template literals. Tailwind purges these in production because they're not in source files.

**Fix:** Add a safelist to `tailwind.config.ts` covering `grid-cols-1` through `grid-cols-6` with `sm:`, `md:`, `lg:` responsive variants.

**Files:** `tailwind.config.ts`

---

## Phase 2: Liberate the Converter

**Priority:** Critical — This is the biggest single improvement.

### The Transformation

The converter changes from an **override engine** to a **pass-through translator**.

**Current pattern (every component handler):**
```typescript
// CURRENT: Converter replaces AI decisions with hardcoded values
if (type === "Features") {
  return {
    title: props.headline || props.title || "Features",
    // ...AI's color choices are IGNORED:
    cardBackgroundColor: palette().cardBg,        // HARDCODED from blueprint
    backgroundColor: isDarkTheme() ? themeBackground() : "",  // HARDCODED
    textColor: palette().textPrimary,              // HARDCODED
    accentColor: themePrimary(),                   // HARDCODED
    // ...50+ more props the AI set are DISCARDED
  };
}
```

**New pattern:**
```typescript
// NEW: AI's decisions flow through. Converter only translates field names.
if (type === "Features") {
  const features = props.features || props.items || [];
  return {
    ...props,  // ← ALL AI props flow through untouched
    // Normalize field names (AI might use "headline", component needs "title")
    title: props.headline || props.title,
    subtitle: props.subtitle,
    description: props.description,
    // Structure arrays (AI format → component format)
    features: Array.isArray(features) ? features.map((f, i) => ({
      id: String(i + 1),
      title: f.title || f.name,
      description: f.description || f.content,
      icon: f.icon,
      iconColor: f.iconColor,
      iconBackgroundColor: f.iconBackgroundColor,
    })) : [],
  };
}
```

### What the Converter Keeps Doing

1. **Field name normalization** — AI says `headline`, component needs `title`. AI says `ctaText`, component needs `buttonText`. These translations stay.
2. **Array structuring** — AI outputs features/testimonials/team members in various shapes. Converter normalizes them into the array format components expect.
3. **Link validation** — `fixLink()` prevents `"#"` placeholders. Keep this — it fixes a real bug.
4. **Placeholder filtering** — Removing `"hello@company.com"`, `"123 Main Street"` fake data from footers. Keep this.
5. **Background overlay enforcement** — When there's a background image, ensure overlay exists for text readability. Keep this — it's accessibility.
6. **Navbar scroll behavior** — `position: "sticky"`, `hideOnScroll: true`. Keep this — it's UX.

### What the Converter Stops Doing

1. ~~Replacing AI color choices with `themePrimary()`, `palette().cardBg`, etc.~~
2. ~~Hardcoding background colors based on `isDarkTheme()`~~
3. ~~Setting default spacing values that override AI decisions~~
4. ~~Choosing animation types for the AI~~
5. ~~Deciding button styles, sizes, and border radius~~
6. ~~Setting card styling (border, shadow, hover effects)~~
7. ~~Choosing component variants~~

### Component-by-Component Changes

Every handler (Hero, Navbar, Features, CTA, Testimonials, Team, ContactForm, Footer, FAQ, Stats, Pricing, Gallery, Newsletter, LogoCloud, TrustBadges, Quote) gets the same treatment:

1. Start with `...props` (pass everything through)
2. Add field name normalizations on top
3. Add array structuring on top
4. Remove all `palette()`, `themePrimary()`, `themeBackground()`, `isDarkTheme()` calls
5. Keep `fixLink()` calls and placeholder filtering

### Helper Functions to Remove/Deprecate

- `themePrimary()` — No longer needed. AI chooses primary color directly.
- `themeSecondary()` — Same.
- `themeBackground()` — Same.
- `isDarkTheme()` — The AI knows if it's designing a dark theme. It will set appropriate colors.
- `palette()` — No longer needed. AI sets all colors.

These can remain as dead code initially and be cleaned up later, or removed outright.

---

## Phase 3: Remove Override Systems

### 3.1 — Stop Overwriting AI Design Tokens

**Current flow:**
```
AI generates architecture with designTokens →
  Blueprint OVERWRITES all colors/fonts →
    OR QuickDesignTokens OVERWRITES all colors/fonts →
      OR DesignInspiration OVERWRITES all colors/fonts
```

**New flow:**
```
AI generates architecture with designTokens →
  designTokens flow through to pages UNCHANGED
```

**What changes in `engine.ts`:**

The `createArchitecture()` method currently has a "Priority: Blueprint > Design Inspiration > Quick Tokens" section (L758-800) that overwrites `architecture.designTokens`. This entire override block gets removed.

**But blueprints don't disappear entirely.** Blueprints are actually valuable as **context** — they tell the AI about industry best practices, proven section layouts, and conversion patterns. We keep passing blueprint information in the prompt so the AI is informed, but we stop using them to overwrite the AI's output.

**Changes:**
- `engine.ts`: Remove the designToken override block (L758-800)
- `engine.ts`: Keep `formatBlueprintForAI()` in the prompt context — it's helpful information
- `engine.ts`: Remove `useDesignInspiration` and `useQuickDesignTokens` flags and their associated overrides

### 3.2 — Remove/Simplify Color Infrastructure

These systems were built to compensate for the AI not choosing good colors. With the AI in control, they're unnecessary:

- `inspiration-engine.ts` → `DesignInspirationEngine` class — remove from pipeline (keep file for reference)
- `variety-engine.ts` → `getDesignPersonality()` — simplify. Instead of looking up hardcoded personalities, pass the concept of personality to the AI in the prompt
- `variety-engine.ts` → `getSectionBackgrounds()` — already dead code, leave as-is
- `industry-blueprints.ts` → Keep as context reference, stop using for color overrides

### 3.3 — Remove the Palette/Token Helper System in Converter

The converter has a chain of helpers that form a "shadow design system":
- `designTokensRef` — stores a reference to design tokens
- `palette()` — derives card bg, borders, input colors from tokens
- `themePrimary()`, `themeSecondary()`, `themeBackground()` — shortcuts
- `isDarkTheme()` — dark mode detection

With the AI in control of all colors, these become unnecessary. The AI will set `cardBackgroundColor`, `inputBorderColor`, `textColor` etc. directly on each component. Remove the helper chain and the `setDesignTokens()` initialization.

---

## Phase 4: Rewrite Prompts + Dynamic Component Discovery

### 4.1 — Dynamic Component Reference Cards (THE KEY INNOVATION)

**The Problem We Discovered:**

The current system tells the AI about components in two ways, both inadequate:

1. **`summarizeComponents()`** — Runs at architecture time. Output:
   ```
   - Hero (sections): Premium hero section [87 fields]
   - Features (sections): Feature grid [45 fields]
   ```
   The AI knows 87 fields exist but has **zero idea what they are**. It can't set `backgroundAttachment: "fixed"` for parallax if it doesn't know that prop exists. It can't use `imageAnimation: "zoom"` if nobody told it. This is like giving a chef a kitchen full of ingredients but covering all the labels.

2. **`componentDetails`** — Runs at page-gen time. Sends full field definitions, BUT only for components that the architecture step already suggested. The AI can't discover components it wasn't told about. If you add a new component to the registry, the AI will never pick it unless you manually update the prompts.

**The Solution: Build Reference Cards Dynamically from the Registry**

The component registry already stores everything the AI needs:
```typescript
// From core-components.ts — THIS DATA ALREADY EXISTS:
{
  type: "Hero",
  fields: {
    title: { type: "text", label: "Title", defaultValue: "Build Something Amazing" },
    titleSize: { type: "select", label: "Title Size", options: [
      { label: "Small", value: "sm" }, { label: "Medium", value: "md" },
      { label: "Large", value: "lg" }, { label: "XL", value: "xl" },
      { label: "2XL", value: "2xl" }
    ], defaultValue: "xl" },
    titleColor: { type: "color", label: "Title Color" },
    primaryButtonColor: { type: "color", label: "Primary Button Color", defaultValue: "#3b82f6" },
    variant: { type: "select", options: [
      { value: "centered" }, { value: "split" }, { value: "fullscreen" }, ...
    ] },
    paddingTop: { type: "select", options: [...], defaultValue: "xl" },
    backgroundAttachment: { type: "select", options: [
      { value: "scroll" }, { value: "fixed" }  // ← Parallax!
    ] },
    // ... 80+ more fields, ALL with types, options, defaults
  }
}
```

**New `generateComponentReference()` function:**

A new function reads the live component registry and builds a comprehensive reference card for the AI. This runs at generation time — so it always reflects the current state of the registry:

```typescript
function generateComponentReference(
  filter?: "all" | "sections-only" | string[]
): string {
  const components = componentRegistry.getAll();

  // Filter to AI-relevant categories (skip layout primitives)
  const aiCategories = [
    "sections", "marketing", "content", "forms",
    "interactive", "media", "navigation", "ecommerce"
  ];

  let filtered = components.filter(c => aiCategories.includes(c.category));

  // If specific types requested, filter further
  if (Array.isArray(filter)) {
    filtered = components.filter(c => filter.includes(c.type));
  }

  return filtered.map(comp => {
    const fieldLines = Object.entries(comp.fields).map(([key, field]) => {
      let desc = `${key}`;

      if (field.type === "select" && field.options) {
        desc += `: ${field.options.map(o => o.value).join(" | ")}`;
      } else if (field.type === "color") {
        desc += `: color (hex)`;
      } else if (field.type === "toggle") {
        desc += `: boolean`;
      } else if (field.type === "number") {
        desc += `: number${field.min !== undefined ? ` (${field.min}-${field.max})` : ""}`;
      } else if (field.type === "text" || field.type === "textarea") {
        desc += `: string`;
      } else if (field.type === "image") {
        desc += `: image URL`;
      } else if (field.type === "link") {
        desc += `: URL path`;
      } else if (field.type === "array") {
        desc += `: array`;
        if (field.itemFields) {
          const subFields = Object.keys(field.itemFields).join(", ");
          desc += ` of { ${subFields} }`;
        }
      }

      if (field.defaultValue !== undefined) {
        desc += ` [default: ${JSON.stringify(field.defaultValue)}]`;
      }

      return `  ${desc}`;
    });

    return `### ${comp.type} (${comp.category})
${comp.description || comp.label}
Props:
${fieldLines.join("\n")}`;
  }).join("\n\n");
}
```

**What the AI sees (example for Hero):**

```
### Hero (sections)
Premium hero section with all variants - Wix Studio quality
Props:
  title: string [default: "Build Something Amazing"]
  titleSize: sm | md | lg | xl | 2xl [default: "xl"]
  titleColor: color (hex)
  titleWeight: normal | medium | semibold | bold | extrabold [default: "bold"]
  titleAlign: left | center | right [default: "center"]
  subtitle: string
  subtitleSize: sm | md | lg [default: "lg"]
  subtitleColor: color (hex)
  description: string
  descriptionSize: sm | md | lg [default: "md"]
  descriptionColor: color (hex)
  descriptionMaxWidth: sm | md | lg | xl | full [default: "lg"]
  badge: string
  badgeColor: color (hex) [default: "#3b82f6"]
  badgeTextColor: color (hex) [default: "#ffffff"]
  badgeStyle: solid | outline | pill [default: "pill"]
  primaryButtonText: string [default: "Get Started"]
  primaryButtonLink: URL path
  primaryButtonColor: color (hex) [default: "#3b82f6"]
  primaryButtonTextColor: color (hex) [default: "#ffffff"]
  primaryButtonStyle: solid | outline | gradient [default: "solid"]
  primaryButtonSize: sm | md | lg | xl [default: "lg"]
  primaryButtonRadius: none | sm | md | lg | full [default: "lg"]
  primaryButtonIcon: none | arrow | chevron | play [default: "arrow"]
  secondaryButtonText: string
  secondaryButtonLink: URL path
  secondaryButtonStyle: solid | outline | ghost | text [default: "outline"]
  secondaryButtonColor: color (hex)
  variant: centered | split | splitReverse | fullscreen | video | minimal [default: "centered"]
  contentAlign: left | center | right [default: "center"]
  verticalAlign: top | center | bottom [default: "center"]
  backgroundColor: color (hex) [default: "#ffffff"]
  backgroundImage: image URL
  backgroundPosition: center | top | bottom | left | right [default: "center"]
  backgroundSize: cover | contain | auto [default: "cover"]
  backgroundAttachment: scroll | fixed [default: "scroll"]
  backgroundOverlay: boolean [default: false]
  backgroundOverlayColor: color (hex) [default: "#000000"]
  backgroundOverlayOpacity: number (0-100) [default: 50]
  backgroundGradient: string
  image: image URL
  imageAlt: string
  imagePosition: left | right [default: "right"]
  imageFit: cover | contain | fill [default: "cover"]
  imageRounded: none | sm | md | lg | xl | 2xl | full [default: "lg"]
  imageShadow: none | sm | md | lg | xl | 2xl [default: "lg"]
  imageAnimation: none | fadeIn | slideUp | slideIn | zoom [default: "fadeIn"]
  minHeight: auto | 50vh | 75vh | 100vh | 100dvh | fullscreen [default: "75vh"]
  maxWidth: sm | md | lg | xl | 2xl | 7xl | full [default: "7xl"]
  paddingTop: sm | md | lg | xl [default: "xl"]
  paddingBottom: sm | md | lg | xl [default: "xl"]
  paddingX: sm | md | lg | xl [default: "md"]
  showScrollIndicator: boolean [default: false]
  animateOnLoad: boolean [default: true]
  ...
```

**This is the game-changer.** The AI now sees every single prop it can set, what values are valid, and what the defaults are. It can make informed creative decisions about parallax, image animations, badge styles, button sizes, padding scales — EVERYTHING.

### 4.2 — Why Dynamic Generation Solves the "New Component" Problem

**The question:** "If I add new components, does the AI automatically know about them?"

**Answer with dynamic reference cards: YES.**

Because `generateComponentReference()` reads from the live `componentRegistry` at generation time, any component registered before the AI runs will appear in the reference. The flow:

```
You add a new component → Register it in core-components.ts →
  Next time AI Designer runs → generateComponentReference() reads registry →
    New component appears in the AI's reference card →
      AI can choose to use it if it fits the business
```

**No prompt updates needed. No hardcoded lists to maintain.** The registry IS the source of truth, and the AI reads it fresh every time.

For the converter side, the new pass-through architecture handles this automatically too:
```
AI outputs { type: "NewComponent", props: { ... } } →
  Converter typeMap doesn't have "NewComponent" →
    Falls through as-is (type pass-through) →
      Registry finds and renders it
```

If the new component's type name matches the registry exactly (which it will if the AI reads the reference card), it renders perfectly with zero converter changes.

### 4.3 — Token Budget Strategy for Component Reference Cards

Full prop cards for all 60+ components could be massive (10,000+ words). Smart approach:

**Architecture Prompt (component SELECTION):**
- Include **medium-detail** reference for ALL section-level components
  - Component name, category, description, and KEY props (variant, layout mode, column count — the "what can this component DO?" props)
  - Skip cosmetic props (colors, sizes, radius) — the AI doesn't need these to decide which component to use
  - ~50-80 words per component, ~2,000-3,000 words total — very manageable

**Page Generation Prompt (component CONFIGURATION):**
- Include **full-detail** reference for components being used on THIS page
  - Every single prop, every option, every default — the "how do I configure this component?" card
  - ~100-200 words per component, 6-8 components per page = ~800-1,600 words — perfectly fine
  - AI also gets a brief list of OTHER available components it could swap in, with medium-detail cards

This two-tier approach keeps token usage reasonable while giving the AI full information at every step.

### 4.4 — New System Prompt Philosophy

**Old philosophy:** "Follow these 50 rigid rules or VIOLATION = FAILURE"
**New philosophy:** "You are a world-class designer. Here's your toolkit. Create something amazing."

### 4.5 — New SITE_ARCHITECT_PROMPT

Replace the current ~320 line system prompt with a focused, empowering prompt:

**What it includes:**
1. **Role definition** — "You are a world-class web designer. Every site you create is unique to the business."
2. **Context awareness** — "Read the user's description carefully. Every design decision should serve THIS specific business."
3. **Creative mandate** — "Choose colors, typography, spacing, animations, and layout that perfectly match the business's identity, audience, and goals."
4. **Quality bar** — "The site should look like it was custom-designed by a premium agency. No two sites should look alike."
5. **Structural guidance** (light) — Minimum section counts per page type. Not rigid — just "Home pages should be rich (6-8 sections), inner pages should be complete (4+ sections)."
6. **Industry awareness** (light) — Brief notes on what converts per industry. Not rigid blueprints — just "Restaurants benefit from prominent menus and reservation CTAs" level guidance.
7. **Full component catalog** — Dynamically generated from registry with medium-detail reference cards (see 4.3)

**What it removes:**
- ~~Rigid "VIOLATION = FAILURE" language~~
- ~~Hardcoded color rules~~
- ~~8px grid mandates~~
- ~~Exact pixel specifications~~
- ~~"Follow blueprint EXACTLY" instructions~~
- ~~Prescriptive section orders~~

### 4.6 — New PAGE_GENERATOR_PROMPT

Replace the ~470 line page prompt with:

**What it includes:**
1. **Full component reference cards** — Dynamically generated from the registry. For components on this page: every field, every option. For other available components: brief reference in case the AI wants to add/swap.

2. **Essential rules only** (the ones that prevent actual bugs):
   - "Do NOT generate Navbar or Footer — they are created separately"
   - "All links must point to real pages (/, /about, /services) — never use '#'"
   - "Use the exact business name from context"
   - "When using a background image, set backgroundOverlay: true with 60-80% opacity for text readability"
   - "Use emoji for feature icons (✂️ not 'scissors') — the renderer displays them directly"

3. **Creative encouragement:**
   - "You have full creative control over every visual decision"
   - "Make this site unique to this business — avoid generic, template-like designs"
   - "Use the full range of component props to achieve your vision"
   - "Consider the emotional tone: luxury brands feel different from playful startups"
   - "You can use ANY component from the reference — you are not limited to the section plan's suggestions"

**What it removes:**
- ~~4,000+ words of rigid rules~~
- ~~"Use 8px grid spacing"~~
- ~~"EXACTLY 3, 4, or 6 items"~~
- ~~"titleSize must be xl"~~
- ~~"CTA bg must be #1f2937"~~
- ~~Prescriptive color application rules~~
- ~~Dark theme micro-management~~
- ~~"VIOLATION = FAILURE" threats~~

### 4.7 — Architecture: AI Scans All Components and Decides What to Use

**The question:** "Does the AI scan all available components and choose what the user's site needs based on their industry/niche?"

**Current answer: Partially.** The AI sees a list of component names during architecture, but:
- It only sees `"- Hero (sections): Premium hero section [87 fields]"` — no detail
- It can suggest components for sections, but it's not informed enough to make creative choices about WHICH components would serve this specific business best
- The architecture prompt has hardcoded industry recipes that tell it what to use

**New answer: YES — full autonomous component selection.**

With dynamic reference cards, the architecture prompt includes the full component catalog. The AI can:
1. Read the user's description ("I run a dental clinic in Nairobi called Bright Smiles")
2. Scan all available components and their capabilities
3. Decide: "This clinic needs Hero, Features (for services), Team (for dentists), Testimonials, FAQ, ContactForm, Stats, Gallery — and I'll use CTA sections between key pages"
4. If you've added an `AppointmentBooking` component to the registry, the AI will see it and use it if it makes sense for a dental clinic
5. If you've added a `PricingTable` component, the AI will use it for a SaaS site but skip it for a restaurant

**The AI becomes self-updating.** New components = new capabilities the AI discovers automatically.

### 4.8 — New `buildPagePrompt()` Function

The function that assembles the per-page prompt gets simplified:

**What it includes:**
1. Page name, slug, purpose, and type classification
2. The section plan from architecture (as starting guidance, not rigid mandate — the AI can add/swap components)
3. The full design tokens the AI chose at architecture stage
4. The design personality context (hero style, card style, animation approach)
5. Business context (description, industry, location, features)
6. The original user prompt
7. All pages list (for valid internal linking)
8. Full component reference cards (dynamically generated)

**What it removes:**
- ~~"COLOR APPLICATION RULES (MANDATORY)" with explicit prop-to-color mapping~~
- ~~"DARK THEME AWARENESS" with 20 lines of dark mode rules~~
- ~~Blueprint page-specific override instructions~~
- ~~"Every component MUST have its color props explicitly set"~~
- ~~Rigid minimum section enforcement~~

The AI chose the colors at architecture time. It knows they're dark or light. It will apply them consistently because it's a reasoning model that understands design coherence.

### 4.9 — New `buildArchitecturePrompt()` Function

Simplified to provide rich context without constraints:

1. The user's full description (highest priority — this IS what the site should be)
2. Business context from dashboard (what modules are enabled, existing content)
3. Full component catalog — AI sees ALL components and picks the ones that serve this business
4. Light industry guidance (not blueprints — just "dental clinics typically need: services, team, testimonials, booking")
5. Full creative mandate

---

## Phase 5: Eliminate Pre-Generation Dropdowns, Enable Post-Generation Customization

### 5.1 — Remove Design Style Dropdown

**Current state:** User picks from 8 styles (Modern, Elegant, Bold, Minimal, etc.) → value is serialized as JSON → ignored by every downstream system.

**New state:** Dropdown removed entirely. The AI determines the design style from:
- The user's website description
- The business type and industry
- The tone of the content
- The target audience (inferred from context)

A dental clinic gets a clean, trustworthy design. A nightclub gets bold, dark, vibrant design. A luxury spa gets elegant, serene design. Not because we told the AI to — because the AI understands these businesses.

### 5.2 — Remove Color Palette Dropdown

**Current state:** User picks from palettes (Warm, Cool, Vibrant, Monochrome, etc.) → value is serialized as JSON → ignored.

**New state:** Dropdown removed entirely. The AI selects colors that:
- Match the business's identity and industry
- Are psychologically appropriate for the audience
- Convert well for the target market
- Create proper contrast and hierarchy
- Feel unique and intentional

The AI knows color psychology. It knows warm earth tones work for organic food brands. It knows deep navy + gold feels premium for law firms. It knows bright, playful colors work for children's brands. **We don't need to pre-select — the AI already knows.**

### 5.3 — What Replaces the Dropdowns

Nothing replaces them pre-generation. The AI designer page becomes cleaner and more honest:

**Before:**
```
[Website Description textarea]
[Design Style dropdown]     ← REMOVED
[Color Palette dropdown]    ← REMOVED
[Generate button]
```

**After:**
```
[Website Description textarea]
[Generate button]
```

The description is everything. If a user writes "I want a modern, minimalist dental clinic website with blue and white colors", the AI will deliver exactly that. If they write "I own a BBQ restaurant in Texas called Smokey Joe's", the AI knows to go warm, rustic, and bold. If they write "luxury jewelry brand with black and gold aesthetic", the AI delivers that exact vision.

**Users who want specific colors say so in their description.** Users who don't care get the AI's expert color choices. Either way, the outcome is better than picking from a dropdown of 8 presets that don't actually work.

### 5.4 — Post-Generation Color Customization (Future Enhancement)

After the AI generates the site, the user already has full control via the Studio editor — they can change any prop on any component. But there's an opportunity for a smoother experience:

**Future enhancement:** After generation, show a "Customize Your Palette" step:
- Display the AI's chosen colors (primary, secondary, accent, background, text)
- Let the user swap any color with a color picker
- Apply the change globally across all pages instantly
- User sees the result in real-time before confirming

This is MORE powerful than a pre-generation dropdown because:
1. The user sees the AI's complete design vision first — they might love it
2. Color changes are applied to a real design, not a blank slate
3. They can make precise adjustments with visual feedback
4. They're refining an expert's work, not constraining it before it starts

**Not in this phase** — but documented here as a planned follow-up.

---

## Phase 6: Wire Design Personality End-to-End

### 6.1 — Pass Personality to Page Generation

**Current:** Architecture step generates personality → it's used in the architecture prompt → it's discarded → pages are generated blind.

**Fix:** Include the personality context in every `buildPagePrompt()` call:

```typescript
// In stepSinglePage() or generatePage():
const personalityContext = this.architecture?.personalityContext || "";
const pagePrompt = buildPagePrompt(
  pagePlan, context, designTokens, componentDetails,
  userPrompt, blueprintContext, allPages,
  personalityContext  // ← NEW: personality flows to every page
);
```

This ensures that if the architecture step decided on "split hero with glass cards and staggered animations", every page knows this and maintains consistency.

### 6.2 — Let the AI Determine Personality in Architecture

Instead of the current `getDesignPersonality()` which randomly picks from 8 hardcoded presets based on industry keyword, let the AI determine personality as part of architecture generation.

The architecture schema already has `designTokens` — we extend it so the AI also outputs its design personality decisions:
- Overall design approach and mood
- Preferred hero style for the site
- Card treatment approach
- Animation intensity and style
- Typography personality
- Layout density

This gets stored in the architecture and passed to every page. But it's the AI's decision based on the business — not a random lookup from a hardcoded table.

### 6.3 — Simplify Personality Formatting

Instead of formatting hardcoded personality presets via `formatPersonalityForAI()`, we simply pass the AI's own architecture-level design decisions to page generation. This becomes a "here's what you decided at the architecture level — stay consistent" message.

---

## Files Changed — Complete Inventory

| File | Changes | Phase |
|------|---------|-------|
| `converter.ts` | Rewrite all component handlers to pass-through mode. Remove `palette()`, `themePrimary()`, `isDarkTheme()` helper chain. Fix About/Pricing/FAQ bugs. | Phase 1 + 2 + 3 |
| `engine.ts` | Remove design token override block. Remove `useDesignInspiration`/`useQuickDesignTokens`. Add `generateComponentReference()`. Update `summarizeComponents()` to use it. Pass personality to pages. | Phase 3 + 4 + 6 |
| `prompts.ts` | Rewrite `SITE_ARCHITECT_PROMPT` and `PAGE_GENERATOR_PROMPT`. Simplify `buildPagePrompt()` and `buildArchitecturePrompt()`. Remove rigid rules. | Phase 4 |
| `schemas.ts` | Extend architecture schema with personality/design-approach fields. | Phase 6 |
| `tailwind.config.ts` | Add safelist for dynamic grid classes. | Phase 1 |
| `page.tsx` (AI designer) | Remove Design Style and Color Palette dropdowns. Simplify UI. Remove related state variables. | Phase 5 |
| `variety-engine.ts` | Deprecate/simplify. AI handles personality directly. | Phase 3 + 6 |
| `inspiration-engine.ts` | Remove from pipeline. | Phase 3 |
| `industry-blueprints.ts` | Keep as context reference (read-only), stop using for overrides. | Phase 3 |

---

## What We Keep — Safety Rails

These are not restrictions on the AI — they prevent actual technical bugs:

| Safety Rail | Why It Stays |
|------------|-------------|
| "Don't generate Navbar/Footer" | They're created separately. Including them causes duplicates. |
| `fixLink()` validation | Prevents "#" placeholder links that break navigation. |
| Placeholder data filtering | Removes "hello@company.com" and "123 Main Street" fabrications. |
| Background image overlay enforcement | Text is unreadable on unprocessed background images. |
| Navbar sticky/scroll behavior | UX requirement — not a design choice. |
| Field name normalization | AI says "headline", component needs "title". Pure translation. |
| Array structuring | Features, testimonials, team members need consistent shape for rendering. |
| Component type mapping | AI says "HeroBlock", registry uses "Hero". Pure translation. |
| Emoji icon instruction | Renderer can display emojis but not text icon names like "scissors". Technical limitation. |

---

## Expected Outcomes

### Quality Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Design uniqueness** | All sites look the same per industry | Every site is unique to the business |
| **Color harmony** | 10 hardcoded palettes | AI-curated colors per business identity |
| **Button visibility** | Often invisible (hardcoded colors on wrong backgrounds) | AI ensures contrast as part of its design |
| **Spacing** | Generic or missing | AI-tailored spacing per section and page |
| **Typography** | Blueprint-forced fonts | AI-selected fonts matching brand personality |
| **Content tone** | Same professional tone everywhere | Matched to business: playful, luxurious, authoritative, friendly |
| **Responsive design** | Components handle it (already working) | Same — components have good responsive defaults |
| **Pre-gen UX** | Ignored dropdowns that mislead users | Clean single-input that's honest about what matters |
| **Industry fit** | Same template for all restaurants | Unique design per restaurant based on cuisine, location, vibe |
| **New components** | Must manually update prompts | Auto-discovered from registry — AI uses them if relevant |
| **Prop coverage** | AI told "87 fields" but not what they are | AI sees every field, type, option, and default |

### Token Efficiency

| Aspect | Before | After |
|--------|--------|-------|
| System prompt | ~4,000 words of rigid rules | ~500 words of guidance + dynamic reference |
| Per-page prompt | ~2,000 words of color/dark-theme rules | ~300 words of context + personality + reference |
| Converter processing | Parse → discard → rebuild from hardcoded | Parse → normalize names → pass through |
| Override computation | Blueprint + Inspiration + QuickTokens + Palette | None — AI output flows through |

> **Note on prompt length:** The dynamic component reference cards will be longer than the current summary (since they include full prop details), but they replace the rigid rules. Net token usage may increase slightly for architecture prompts but decrease for page prompts (no more color rules, dark theme rules, blueprint rules). The tradeoff is correct: we're spending tokens on **useful information** (what the AI can control) instead of **useless constraints** (rules the AI already knows). For page generation, we include only the reference cards for components the AI is actually using on that page to keep things focused.

### User Experience

| Aspect | Before | After |
|--------|--------|-------|
| Pre-generation UI | Description + 2 ignored dropdowns | Description only (simpler, honest) |
| Generation time | Same (model calls unchanged) | Same or slightly faster (shorter prompts) |
| Output quality | Template-like, same colors per industry | Custom, unique, professional |
| Post-generation editing | Full Studio editor | Full Studio editor (unchanged) |
| User satisfaction | "These all look the same" | "This actually matches my business" |

---

## Implementation Order

```
Phase 1: Fix Bugs (30 min)
  ├── 1.1 Map "About" → "Features" in typeMap
  ├── 1.2 Fix Pricing: monthlyPrice → price
  ├── 1.3 Fix FAQ: expandFirst → defaultOpen: 0
  └── 1.4 Tailwind safelist for dynamic grid classes

Phase 2: Liberate Converter (60 min)
  ├── Rewrite Hero handler → pass-through with field normalization
  ├── Rewrite Features handler → pass-through with array structuring
  ├── Rewrite CTA handler → pass-through with field normalization
  ├── Rewrite Testimonials handler → pass-through with array structuring
  ├── Rewrite Team handler → pass-through with array structuring
  ├── Rewrite ContactForm handler → pass-through with field normalization
  ├── Rewrite Footer handler → pass-through (keep placeholder filtering)
  ├── Rewrite FAQ handler → pass-through with array structuring
  ├── Rewrite Stats handler → pass-through with array structuring
  ├── Rewrite Pricing handler → pass-through with array structuring
  ├── Rewrite Gallery handler → pass-through with array structuring
  ├── Rewrite Newsletter handler → pass-through
  ├── Rewrite LogoCloud handler → pass-through
  ├── Rewrite TrustBadges handler → pass-through
  └── Rewrite Quote handler → pass-through

Phase 3: Remove Override Systems (30 min)
  ├── 3.1 Remove designToken override block in engine.ts
  ├── 3.2 Remove DesignInspiration/QuickTokens from pipeline
  └── 3.3 Remove palette()/themePrimary()/isDarkTheme() chain from converter

Phase 4: Rewrite Prompts + Dynamic Component Discovery (60 min)
  ├── 4.1 Build generateComponentReference() — reads registry, outputs full prop reference
  ├── 4.2 New SITE_ARCHITECT_PROMPT — concise, empowering, with full component catalog
  ├── 4.3 New PAGE_GENERATOR_PROMPT — concise, with full component reference cards
  ├── 4.4 Simplify buildPagePrompt() — context + personality + reference, no rigid rules
  └── 4.5 Simplify buildArchitecturePrompt() — context + reference, no rigid rules

Phase 5: Eliminate Pre-Generation Dropdowns (20 min)
  ├── 5.1 Remove Design Style dropdown from page.tsx
  ├── 5.2 Remove Color Palette dropdown from page.tsx
  └── 5.3 Clean up related state/preferences variables

Phase 6: Wire Personality End-to-End (20 min)
  ├── 6.1 Extend architecture schema with designApproach/personality fields
  ├── 6.2 Pass personality context to generatePage() → buildPagePrompt()
  └── 6.3 Remove hardcoded getDesignPersonality() from pipeline

--- VALIDATION GATE ---
  ├── Generate 5+ sites across industries
  ├── Verify unique designs, correct rendering, no errors
  ├── Build locally, deploy to Vercel, confirm production works
  └── Only proceed to Phase 7 after ALL checks pass

Phase 7: Cleanup — Delete Dead Code (30 min)
  ├── 7.1 Delete 5 files: inspiration-engine, variety-engine, industry-blueprints,
  │       design-references, generator (~4,100 lines)
  ├── 7.2 Remove dead helpers from converter.ts (~350 lines)
  ├── 7.3 Remove dead imports/config from engine.ts (~120 lines)
  ├── 7.4 Verify prompts.ts has no leftover old constants
  ├── 7.5 Remove dead state/constants from page.tsx (~40 lines)
  ├── 7.6 Remove dead schema fields from 5 API routes (~60 lines)
  ├── 7.7 Clean barrel exports (3 index files)
  ├── 7.8 Remove orphaned types (~7 types)
  ├── 7.9 Grep for any remaining references to deleted code
  ├── 7.10 Final build + deploy + verify
  └── 7.11 Commit: "chore: remove ~5,500 lines of dead override code"
```

**Total estimated implementation time: ~4-4.5 hours**

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| AI generates invalid colors (e.g., "red" instead of "#ff0000") | Add a lightweight hex color validator as post-processing. If invalid, component's own default handles it gracefully. |
| AI forgets to set critical props | Component renderers already have sensible defaults for every prop. AI's omission is a decision — the default is professional. |
| AI generates inconsistent design across pages | Design personality flows from architecture to every page (Phase 6). AI maintains consistency because it has the full picture. |
| AI generates a component type that doesn't exist | Reference cards only show registered components. Converter typeMap has fallthrough. Unknown types render a placeholder in dev. |
| Removal of dropdowns feels like feature regression | Description is more powerful. Post-generation editing provides full control. Future: post-generation palette picker. |
| AI makes poor design choices | Extremely unlikely — Claude Sonnet 4 is trained on millions of websites. Studio editor provides full manual control as safety net. |
| Component reference cards are too long | Two-tier strategy: medium-detail for architecture (selection), full-detail for page gen (configuration). Per-page filtering keeps token count manageable. |
| New component added without proper field definitions | The reference card shows exactly what's defined. If fields are missing, the card will be sparse — a natural prompt to add proper definitions. The system is self-documenting. |

---

## Future Enhancements (Not in This Phase)

1. **Post-generation color palette picker** — After generation, show a "Customize Colors" modal. User sees AI's choices, can swap any color, sees changes applied globally in real-time.
2. **Regenerate single section** — "Don't like this hero? Regenerate just this section while keeping everything else."
3. **A/B generation** — Generate two design variants, let the user pick.
4. **Style transfer** — "Make it look like [reference URL]" — AI analyzes the reference and applies similar aesthetic.
5. **Progressive model enhancement** — As newer models release (Claude Opus, next-gen Sonnet, etc.), output quality improves automatically because we're not constraining the model. Every model upgrade = free quality boost.
6. **Component prop auto-documentation** — Since reference cards are generated from the registry, adding a `description` field to each field definition automatically enriches what the AI sees. Over time, the AI gets better context with zero prompt changes.

---

## Phase 7: Cleanup — Remove Dead Code (AFTER Everything Works)

> ⚠️ **IMPORTANT:** This phase runs ONLY after Phases 1-6 are implemented, deployed, and validated with real site generations. Do NOT delete anything until we've confirmed the new system produces quality output. This is the "prove it works first, then clean house" step.

### Why Cleanup Matters

Dead code isn't just ugly — it's a liability:
- **Confusion** — Future developers (or future us) see `palette()`, `themePrimary()`, `getDesignPersonality()` and think they're still active
- **Bundle size** — 5,500+ lines of dead code inflate the build, slow cold starts on Vercel
- **Import chains** — Dead barrel exports create phantom dependency trees that make the codebase harder to navigate
- **Maintenance burden** — TypeScript errors in dead code still break builds. Dead code still needs to satisfy the compiler.

After proving Phases 1-6 work, we strip it all out and ship a clean, lightweight AI designer.

---

### 7.1 — Files to Delete Entirely (~4,100 lines)

These files exist solely for override systems being removed. After Phases 1-6, nothing imports them.

| # | File | Lines | What It Was | Safe to Delete? |
|---|------|-------|-------------|-----------------|
| 1 | `src/lib/ai/website-designer/design/inspiration-engine.ts` | ~533 | `DesignInspirationEngine` class, `AWARD_WINNING_PATTERNS`, `getQuickDesignTokens()` — the design token override system | ✅ Yes — removed from pipeline in Phase 3 |
| 2 | `src/lib/ai/website-designer/design/variety-engine.ts` | ~472 | 8 `PERSONALITIES` presets, `INDUSTRY_PERSONALITY_MAP`, `getDesignPersonality()`, `formatPersonalityForAI()`, `getSectionBackgrounds()` | ✅ Yes — AI determines personality in Phase 6 |
| 3 | `src/lib/ai/website-designer/config/industry-blueprints.ts` | ~1,644 | 10 industry blueprints with hardcoded palettes, page structures, SEO data. `findBlueprint()`, `formatBlueprintForAI()` | ✅ Yes — AI creates its own architecture. Light industry context baked into new prompts. |
| 4 | `src/lib/ai/website-designer/config/design-references.ts` | ~1,051 | `DESIGN_REFERENCES` array (~900 lines of Dribbble/Awwwards data), `findDesignReference()`, `getIndustryReferences()` | ✅ Yes — **already dead** — exported from barrel but never imported at runtime |
| 5 | `src/lib/ai/website-designer/design/generator.ts` | ~400 | `DesignSystemGenerator` class, `generateDesignSystemForIndustry()`, `generateDesignTokens()` | ✅ Yes — **already dead** — exported via barrel only, never imported by engine.ts or any API route |

**Total: ~4,100 lines deleted across 5 files**

---

### 7.2 — Dead Code in `converter.ts` (~350 lines)

After Phase 2 (pass-through rewrite) and Phase 3 (palette removal), these become dead:

**Helper functions to remove:**
| Function | Lines (approx) | What It Did |
|----------|---------------|-------------|
| `DesignTokens` interface | ~15 | Type for the override chain |
| `let activeDesignTokens` module state | ~3 | Stored reference to design tokens |
| `let cachedColorPalette` module state | ~3 | Cached generated palette |
| `setDesignTokens()` export | ~10 | Initialized the override chain — called from page.tsx |
| `hexToRgb()` | ~8 | Color math for palette generation |
| `rgbToHex()` | ~8 | Color math for palette generation |
| `rgbToHsl()` | ~12 | Color math for palette generation |
| `hslToRgb()` | ~15 | Color math for palette generation |
| `getContrastRatio()` | ~8 | Contrast checking for palette |
| `ensureContrast()` | ~10 | Auto-adjusting colors for contrast |
| `lightenColor()` | ~8 | Palette derivation |
| `darkenColor()` | ~8 | Palette derivation |
| `withAlpha()` | ~5 | Palette derivation |
| `ColorPalette` interface | ~20 | Type for generated palette |
| `generateColorPalette()` | ~80 | Creates full palette from tokens — the heart of the override system |
| `palette()` accessor | ~10 | Returns cached or generated palette — ~50+ call sites become dead |
| `themePrimary()` | ~3 | Shorthand into palette |
| `themeAccent()` | ~3 | Shorthand into palette |
| `themeBackground()` | ~3 | Shorthand into palette |
| `themeText()` | ~3 | Shorthand into palette |
| `isDarkTheme()` | ~5 | Dark mode detection for overrides |

**~250 lines of helper functions + ~100 lines of call sites within component handlers = ~350 lines**

**⚠️ Keep:** `fixLink()`, `setGeneratedPageSlugs()`, placeholder filtering logic, background overlay enforcement — these are safety rails, not overrides.

---

### 7.3 — Dead Code in `engine.ts` (~120 lines)

After Phases 3 and 6:

| Code Block | What It Did |
|------------|-------------|
| `EngineConfig.enableDesignInspiration` field + default | Feature flag for deleted inspiration engine |
| `EngineConfig.useQuickDesignTokens` field + default | Feature flag for deleted quick tokens |
| `import { DesignInspirationEngine }` | Import of deleted file |
| `import { findBlueprint, formatBlueprintForAI, formatBlueprintPageForAI }` | Import of deleted file |
| `import { getDesignPersonality, formatPersonalityForAI }` | Import of deleted file |
| In `stepArchitecture()`: `DesignInspirationEngine` instantiation, `findBlueprint()` call, `getDesignPersonality()` + `formatPersonalityForAI()` calls, inspiration conditional blocks, quick token conditional blocks | All override injection code |
| In `createArchitecture()`: blueprint/inspiration/quickTokens priority chain for designTokens | The ~40-line block that overwrites AI-chosen tokens |
| In `stepSinglePage()`: `findBlueprint()` call, `formatBlueprintPageForAI()` | Blueprint injection per page |
| In `generatePage()`: `blueprintPageContext` building | Blueprint page context injection |

---

### 7.4 — Dead Code in `prompts.ts` (~800 lines replaced)

After Phase 4 rewrites the prompts, the OLD versions of these are gone. But since we're replacing them (not just deleting), this happens during Phase 4 implementation, not cleanup. Listed here for completeness:

| Constant | Approx Lines | Replaced By |
|----------|-------------|-------------|
| Old `SITE_ARCHITECT_PROMPT` | ~350 | New ~100-word empowering prompt + dynamic component catalog |
| Old `PAGE_GENERATOR_PROMPT` | ~230 | New streamlined prompt + dynamic reference cards |
| `INDUSTRY_CONTENT_PROMPTS` object | ~120 | AI handles industry context natively — deleted entirely |
| Blueprint injection in `buildArchitecturePrompt()` | ~50 | Simplified to user context + component catalog |
| Blueprint injection in `buildPagePrompt()` | ~50 | Simplified to context + personality + reference |

---

### 7.5 — Dead UI State in `page.tsx` (AI Designer) (~40 lines)

After Phase 5 removes the dropdowns:

| Code | What It Was |
|------|-------------|
| `STYLE_OPTIONS` constant (~8 lines) | 6 design style options (minimal, bold, elegant, playful, corporate, creative) |
| `COLOR_OPTIONS` constant (~7 lines) | 5 color palette options (brand, warm, cool, monochrome, vibrant) |
| `const [style, setStyle] = useState(...)` | State for deleted Design Style dropdown |
| `const [colorPreference, setColorPreference] = useState(...)` | State for deleted Color Palette dropdown |
| `preferences: { style, colorPreference }` in `basePayload` | Sent dead values to API |
| `<Select>` JSX for "Design Style" (~18 lines) | Entire dropdown component |
| `<Select>` JSX for "Color Palette" (~14 lines) | Entire dropdown component |
| `setDesignTokens(tokens)` call | Initializes removed override chain |

**Also check:** After removing both `<Select>` dropdowns, verify whether `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` imports are still needed by other UI on the page. If not, remove the import line too.

---

### 7.6 — API Route Schema Dead Code (~60 lines across 5 routes)

Every API route has schema fields for the removed systems:

| Route File | Dead Schema Fields |
|------------|-------------------|
| `api/ai/website-designer/steps/architecture/route.ts` | `preferences: z.object({ style: z.enum(...), colorPreference: z.enum(...) })`, `engineConfig: { enableDesignInspiration, useQuickDesignTokens }` |
| `api/ai/website-designer/steps/page/route.ts` | Same `preferences` and `engineConfig` fields |
| `api/ai/website-designer/steps/shared/route.ts` | Same |
| `api/ai/website-designer/steps/finalize/route.ts` | Same `engineConfig` fields |
| `api/ai/website-designer/generate/route.ts` (if exists) | Same |

Also remove all `input.preferences` pass-through references where routes forward preferences to the engine, and all `input.engineConfig.enableDesignInspiration` / `input.engineConfig.useQuickDesignTokens` references.

---

### 7.7 — Barrel Export Cleanup

After deleting files, barrel re-exports will cause build failures if not cleaned up.

**`design/index.ts`** — Remove re-exports of:
- `DesignSystemGenerator`, `generateDesignSystemForIndustry`, `generateDesignSystemFromColor`, `generateDesignTokens` (from `./generator`)
- `DesignInspirationEngine`, `AWARD_WINNING_PATTERNS`, `DesignRecommendation` (from `./inspiration-engine`)
- `getDesignPersonality`, `formatPersonalityForAI`, `getSectionBackgrounds`, `getVariantForComponent`, `DesignPersonality` (from `./variety-engine`)

**`config/index.ts`** — Remove re-exports of:
- `findDesignReference`, `getIndustryReferences`, `formatReferenceForAI`, `DesignReference`, `SectionReference`, `ContentPattern` (from `./design-references`)
- `findBlueprint`, `formatBlueprintForAI`, `formatBlueprintPageForAI`, `IndustryBlueprint` (from `./industry-blueprints`)

**Main barrel `index.ts`** — Remove re-exports of:
- `setDesignTokens`, `setGeneratedPageSlugs` (if link fixing moves inline)
- `WebsiteStyle`, `ColorPreference` type exports
- Any re-exports pointing to deleted design/config files

---

### 7.8 — Orphaned Types (~20 lines)

Types that lose all consumers after cleanup:

| Type | File | Why Orphaned |
|------|------|-------------|
| `WebsiteStyle` (union type) | types file | Powered the deleted Design Style dropdown |
| `ColorPreference` (union type) | types file | Powered the deleted Color Palette dropdown |
| `WebsiteDesignerPreferences.style` field | types file | Dropdown preferences no longer exist |
| `WebsiteDesignerPreferences.colorPreference` field | types file | Dropdown preferences no longer exist |
| `DesignTokens` interface (in converter) | converter.ts | Override system removed |
| `ColorPalette` interface | converter.ts | Palette system removed |
| `ScoringContext.userPreferences` field | scoring types | References dead preferences shape |

**Note:** If `WebsiteDesignerPreferences` interface still has other fields that are used (like `description`, `industry`), keep the interface but remove the dead fields. If the entire interface becomes empty, delete it.

---

### 7.9 — What We Confirmed Does NOT Need Cleanup

| Item | Why It Stays |
|------|-------------|
| `fixLink()` in converter | Prevents "#" placeholder links — safety rail |
| `setGeneratedPageSlugs()` | Used by `fixLink()` for valid internal link references |
| Placeholder filtering (fake emails, addresses) | Prevents fabricated contact info — safety rail |
| Background overlay enforcement | Accessibility — text must be readable over images |
| Navbar sticky/scroll behavior | UX requirement |
| `@anthropic-ai/sdk` package | Still used by surviving AI calls |
| `zod` package | Still used by API route validation |
| shadcn/ui `Select` component library | Used elsewhere in the dashboard — only the AI designer dropdowns are removed |
| Component registry files | The source of truth for dynamic reference cards — core infrastructure |
| Renderer files (`renders.tsx`, `premium-components.tsx`) | Still render everything — no changes needed |

---

### 7.10 — Cleanup Checklist (Run After Phases 1-6 Pass Validation)

```
Pre-Cleanup Validation:
  □ Generate 5+ sites across different industries (restaurant, dental, SaaS, law firm, boutique)
  □ Verify each site has unique colors, spacing, typography
  □ Verify all component types render correctly (Hero, Features, CTA, Testimonials, etc.)
  □ Verify no console errors or missing components
  □ Verify About sections now render (mapped to Features)
  □ Verify Pricing shows correct prices (not $0)
  □ Verify FAQ auto-opens first item
  □ Verify dynamic grid classes work in production (Tailwind safelist)
  □ Verify AI uses variety of component props (parallax, animations, badges, etc.)
  □ Build succeeds locally: `npx next build`
  □ Deploy to Vercel, verify production works

Cleanup Execution:
  □ 7.1: Delete 5 files (inspiration-engine, variety-engine, industry-blueprints, design-references, generator)
  □ 7.2: Remove dead helpers from converter.ts (~350 lines)
  □ 7.3: Remove dead imports/config from engine.ts (~120 lines)
  □ 7.4: Verify prompts.ts has no leftover old constants
  □ 7.5: Remove dead state/constants from page.tsx (~40 lines)
  □ 7.6: Remove dead schema fields from API routes (~60 lines)
  □ 7.7: Clean barrel exports (design/index.ts, config/index.ts, main index.ts)
  □ 7.8: Remove orphaned types
  □ Run `npx next build` — verify zero errors
  □ Search for any remaining references to deleted functions:
      grep for: palette(), themePrimary(), themeAccent(), themeBackground(),
               isDarkTheme(), setDesignTokens, generateColorPalette,
               DesignInspirationEngine, getDesignPersonality, findBlueprint,
               INDUSTRY_CONTENT_PROMPTS, enableDesignInspiration, useQuickDesignTokens,
               STYLE_OPTIONS, COLOR_OPTIONS, getQuickDesignTokens
  □ If any hits remain, fix or remove them
  □ Final build: `npx next build` — clean
  □ Commit: "chore: remove ~5,500 lines of dead AI designer override code"
  □ Deploy and verify production

Post-Cleanup Verification:
  □ Generate a site — same quality as before cleanup
  □ Build time is same or faster
  □ No console errors
  □ No TypeScript errors
  □ Vercel deployment succeeds
```

---

### 7.11 — Impact Summary

| Metric | Before Cleanup | After Cleanup |
|--------|---------------|---------------|
| **Dead files** | 5 files (~4,100 lines) | 0 |
| **Dead code in surviving files** | ~1,400 lines | 0 |
| **Total lines removed** | — | **~5,500 lines** |
| **Files affected** | ~22 | Cleaned |
| **Barrel exports cleaned** | 3 index files | Clean |
| **Orphaned types** | ~7 types | 0 |
| **Dead API schema fields** | ~60 lines across 5 routes | 0 |
| **Dead UI state** | 2 dropdowns + 4 state vars + 2 constants | 0 |
| **Build confidence** | "Is palette() still used? Is this import safe to touch?" | Every import is live. Every function is called. Every type has consumers. |

The codebase goes from "here be dragons — don't touch the design systems" to "every line has a purpose." Future you opens `converter.ts` and sees a clean pass-through translator, not 300 lines of color math that may or may not be active. Future you opens `engine.ts` and sees a clear pipeline, not 5 conditional override branches. **Clean code is fast code, safe code, and maintainable code.**

---

## Summary

This phase represents a fundamental shift in philosophy: **stop trying to be smarter than the AI**.

We built elaborate systems (blueprints, design inspiration, quick tokens, personality engine, palette helpers, 4,000 words of rigid rules) to compensate for what we assumed were AI limitations. But the AI is Claude Sonnet 4 — it knows color theory, typography, layout, conversion optimization, and industry aesthetics better than any hardcoded system we can build.

The key innovation is **dynamic component discovery via registry-generated reference cards**. The AI doesn't need a hardcoded list of what it can use — it reads the live component registry every time it runs. Add a new component? The AI sees it next generation. Add new props to an existing component? The AI sees those too. The system is self-maintaining.

Our job is simple:
1. **Give it context** — What business, what industry, what the user described
2. **Give it tools** — Every component, every prop, every option (dynamically generated from the registry)
3. **Let it design** — Full creative control. Every decision is the AI's.
4. **Translate the output** — Normalize field names, structure arrays, validate links

The converter translates. The prompts inform. The components render. **The AI designs.**

The result: every website is unique, every design matches its business, and the user gets a custom-designed site that actually reflects their vision — not a template with their name swapped in.

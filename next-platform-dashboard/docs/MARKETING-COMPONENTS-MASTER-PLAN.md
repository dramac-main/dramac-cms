# DRAMAC CMS — Marketing Components Master Plan

## Executive Vision

Transform DRAMAC's **5 marketing components** from a partially connected, render-registry misaligned set into a **conversion-optimised, trust-building, AI-driven marketing component library** capable of producing Unbounce-quality announcement bars, Trustpilot-grade social proof widgets, and SaaS-calibre comparison tables — all controlled by the AI Designer with **zero human adjustment**.

Marketing components are the **conversion engine of every website**. They create urgency (AnnouncementBar countdown), establish credibility (SocialProof ratings, TrustBadges certifications), build confidence (LogoCloud partner display), and drive purchase decisions (ComparisonTable feature comparison). When a visitor sees "Trusted by 10,000+ customers", scans a row of security badges, compares pricing tiers, or notices an animated sale banner — those moments of trust and urgency convert browsers into buyers. This plan treats all 5 marketing components as the unified conversion layer that makes every DRAMAC site sell.

**Current reality:** The 5 marketing components have the richest registries in the platform (50–70+ fields each) but the simplest render functions (14–24 props each). This creates a **massive render-registry gap** where the AI Designer can configure dozens of options that silently do nothing. Three components have no converter normalizer, meaning AI-generated prop names pass through without translation. Two components (AnnouncementBar, SocialProof) have **breaking field name mismatches** that guarantee data loss. This plan fixes every gap.

---

## Table of Contents

0. [Implementation Blueprint](#section-0--implementation-blueprint)
1. [Current State Audit](#1-current-state-audit)
2. [Industry Benchmark Analysis](#2-industry-benchmark-analysis)
3. [Architecture Principles](#3-architecture-principles)
4. [AnnouncementBar — Deep Dive](#4-announcementbar--deep-dive)
5. [SocialProof — Deep Dive](#5-socialproof--deep-dive)
6. [TrustBadges — Deep Dive](#6-trustbadges--deep-dive)
7. [LogoCloud — Deep Dive](#7-logocloud--deep-dive)
8. [ComparisonTable — Deep Dive](#8-comparisontable--deep-dive)
9. [Dark Mode & Theming](#9-dark-mode--theming)
10. [Accessibility & WCAG Compliance](#10-accessibility--wcag-compliance)
11. [CSS Variable & Design Token System](#11-css-variable--design-token-system)
12. [AI Designer Integration](#12-ai-designer-integration)
13. [Registry & Converter Alignment](#13-registry--converter-alignment)
14. [Implementation Phases](#14-implementation-phases)
15. [Testing & Quality Gates](#15-testing--quality-gates)
16. [CRITICAL FOR AI AGENT — Implementation Guard Rails](#16-critical-for-ai-agent--implementation-guard-rails)

---

## Section 0 — Implementation Blueprint

> **For the AI agent implementing this plan.** Read this section FIRST. It contains every file path, every line number, and every registration point you need. Do NOT guess — use these exact references.

### 0.1 File Map

| File                      | Path                                            | Purpose                                                                           |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| **renders.tsx**           | `src/lib/studio/blocks/renders.tsx`             | Render functions for all 5 marketing components                                   |
| **core-components.ts**    | `src/lib/studio/registry/core-components.ts`    | `defineComponent()` registrations with fields, defaultProps, AI hints             |
| **component-metadata.ts** | `src/lib/studio/registry/component-metadata.ts` | AI discovery metadata (keywords, usageGuidelines, category)                       |
| **converter.ts**          | `src/lib/ai/website-designer/converter.ts`      | `typeMap` aliases + `KNOWN_REGISTRY_TYPES` + `transformPropsForStudio()` handlers |
| **renderer.tsx**          | `src/lib/studio/engine/renderer.tsx`            | Dispatches render functions via `componentRegistry.get(type)`, injects `{...component.props, siteId}` + brand colours/fonts |
| **layout-utils.ts**       | `src/lib/studio/blocks/layout-utils.ts`         | Shared sizing/spacing utility maps (`getResponsiveClasses`, `isDarkBackground`, etc.) |

### 0.2 Exact Line Numbers (Verified via codebase audit — 2026-07)

#### renders.tsx — All 5 Marketing Components

| #  | Component           | Interface Start | Export Function | Props Count | Variants                                                     |
| -- | ------------------- | --------------- | --------------- | ----------- | ------------------------------------------------------------ |
| 1  | **AnnouncementBar** | L24367          | L24394          | 17          | default, success, warning, error, info, gradient, custom (7) |
| 2  | **SocialProof**     | L24510          | L24534          | 19          | stars, score, compact, detailed (4)                          |
| 3  | **TrustBadges**     | L24747          | L24764          | 13          | row, grid (2 layouts)                                        |
| 4  | **LogoCloud**       | L24874          | L24900          | 22          | simple, cards, marquee (3)                                   |
| 5  | **ComparisonTable** | L25135          | L25159          | 20          | simple, cards, striped (3)                                   |

> **Nested element:** `TrustBadgesElement` at L9144 is a nested function inside CTARender — NOT the standalone TrustBadgesRender. The standalone export is at L24764.

#### core-components.ts — All 5 Marketing Registrations

| #  | Component           | `type:` Line | Category  | Fields | fieldGroups | defaultProps |
| -- | ------------------- | ------------ | --------- | ------ | ----------- | ------------ |
| 1  | **AnnouncementBar** | L21197       | marketing | 50+    | 10 groups   | ✅           |
| 2  | **SocialProof**     | L21757       | marketing | 50+    | 12 groups   | ✅           |
| 3  | **TrustBadges**     | L22387       | marketing | 50+    | 12 groups   | ✅           |
| 4  | **LogoCloud**       | L22999       | marketing | 60+    | 15 groups   | ✅           |
| 5  | **ComparisonTable** | L23750       | marketing | 70+    | 17 groups   | ✅           |

#### component-metadata.ts — All 5 Have Entries

| #  | Component           | `type:` Line | Keywords                                          |
| -- | ------------------- | ------------ | ------------------------------------------------- |
| 1  | **AnnouncementBar** | L959         | announcement, banner, promo, alert                |
| 2  | **SocialProof**     | L971         | social proof, users, customers, trust             |
| 3  | **TrustBadges**     | L982         | trust, badges, security, certifications           |
| 4  | **LogoCloud**       | L994         | logos, clients, partners, brands                  |
| 5  | **ComparisonTable** | L1006        | comparison, table, pricing, features              |

#### converter.ts — Alias & Normalizer Map

| #  | Component           | typeMap Aliases                                                                                   | KNOWN_REGISTRY | Normalizer    | Status       |
| -- | ------------------- | ------------------------------------------------------------------------------------------------- | -------------- | ------------- | ------------ |
| 1  | **AnnouncementBar** | AnnouncementBlock L446, AnnouncementBarBlock L447, Banner L448, BannerBlock L449                  | L823 ✅        | ❌ None       | ⚠️ No norm   |
| 2  | **SocialProof**     | SocialProofBlock L426, SocialProofSection L427                                                    | L821 ✅        | ❌ None       | ⚠️ No norm   |
| 3  | **TrustBadges**     | TrustBadgesBlock L419, TrustBadgesSection L420, Badges L421, Accreditations L422, Credentials L423, Certifications L424 | L820 ✅ | L2204 ✅ | ✅ Complete |
| 4  | **LogoCloud**       | LogoCloudBlock L414, LogoCloudSection L415, PartnerLogos L416, Partners L417, TrustedBy L418      | L819 ✅        | L2131 ✅      | ✅ Complete  |
| 5  | **ComparisonTable** | ComparisonBlock L442, ComparisonSection L443, ComparisonTableBlock L444                           | L822 ✅        | ❌ None       | ⚠️ No norm   |

### 0.3 Props Pipeline

```
AI Designer generates component JSON
  ↓
converter.ts typeMap resolves alias → registered type name
  (e.g., "Banner" → "AnnouncementBar", "TrustedBy" → "LogoCloud")
  ↓
converter.ts transformPropsForStudio() normalises prop names
  ⚠️ Only LogoCloud and TrustBadges have normalizers — other 3 pass through raw
  ↓
Component JSON stored in site content (Supabase JSONB)
  ↓
renderer.tsx reads component.type → looks up render function from registry
  ↓
renderer.tsx injects props: { ...component.props, siteId }
  ↓
renderer.tsx also injects brand colours via injectBrandColors()
  and brand fonts via injectBrandFonts() into ALL component props
  ↓
Render function receives props via destructuring
  ⚠️ If registry field name ≠ render prop name, the value is SILENTLY LOST
```

**Critical rules:**
- Render function parameter names MUST match registry field names EXACTLY. There is NO mapping layer.
- If registry says `closable` and render expects `dismissible`, the prop is silently lost. **This affects AnnouncementBar** — registry uses `closable`, render uses `dismissible`.
- If registry says `highlighted` and render expects `highlight`, the prop is silently lost. **This affects ComparisonTable** — registry columns use `highlighted`, render uses `highlight`.
- If registry rows use `description` and render expects `tooltip`, the prop is silently lost. **This affects ComparisonTable.**
- If registry rows use `category` and render expects `group`, the prop is silently lost. **This affects ComparisonTable.**
- If registry says `message` and render expects `text`, the prop is silently lost. **This affects AnnouncementBar** — registry uses `message`, render uses `text`.
- If registry says `linkUrl` and render expects `link`, the prop is silently lost. **This affects AnnouncementBar** — registry uses `linkUrl`, render uses `link`.
- The renderer uses `componentRegistry.get(type)` — NO hardcoded dispatch table.
- Brand colours and fonts are injected into ALL component props automatically.

### 0.4 Render Pattern Analysis

All 5 marketing components follow **Pattern A: Static HTML (SSR-safe, no JS)**:

```tsx
export function ComponentRender({ variant = "default", ...props }: ComponentProps) {
  // Pure HTML — no useState, no useEffect
  // Variant selection via object map or conditional classes
  // All colours applied via style={{}} with resolved values
  return <section>{/* Static SSR-safe output */}</section>;
}
```

**Key observation:** Zero marketing components use `useState`, `useEffect`, or Framer Motion. All are pure render functions. This is correct for SSR/canvas rendering but means features like "animated counter", "auto-hide after delay", "marquee animation", and "countdown timer" defined in the registry cannot work without adding client-side state.

### 0.5 Build Checklist — Use for EVERY Change

```
□ renders.tsx      — render function compiles with zero TS errors
□ renders.tsx      — every prop in interface is consumed in function body
□ renders.tsx      — ALL colours via style={{}} (no Tailwind colour classes)
□ renders.tsx      — semantic HTML used (role="banner", role="status", etc.)
□ renders.tsx      — keyboard navigation works where applicable
□ core-components.ts — every field name matches a render prop EXACTLY
□ core-components.ts — defaultProps keys exist in fields
□ core-components.ts — ai.canModify keys exist in fields
□ core-components.ts — category = "marketing" for all 5 components
□ component-metadata.ts — entry exists with type, category, keywords
□ converter.ts     — typeMap alias(es) exist for the component
□ converter.ts     — type is in KNOWN_REGISTRY_TYPES set
□ converter.ts     — normalizer handler exists in transformPropsForStudio()
□ npx tsc --noEmit — zero new errors introduced
```

### 0.6 DO / DON'T Rules

| ✅ DO                                                                      | ❌ DON'T                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Use `style={{}}` for ALL colours                                           | Use Tailwind colour classes (bg-red-600, text-blue-500)                 |
| Use `isDarkBackground()` for dark mode detection                           | Hardcode dark/light colour assumptions                                  |
| Use `getResponsiveClasses()` for breakpoint-aware values                   | Write manual breakpoint media queries                                   |
| Match render prop names to registry field names EXACTLY                    | Assume a mapping layer exists — it does NOT                             |
| Add `role`, `aria-label`, `aria-live` for marketing banners                | Skip accessibility on "decorative" marketing elements                   |
| Use CSS variables with fallbacks: `var(--brand-primary, #3b82f6)`          | Hardcode brand colours                                                  |
| Test with `npx tsc --noEmit` after every change                           | Assume TypeScript will catch runtime prop mismatches                    |
| Add converter normalizer for every component                               | Rely on AI generating exact field names                                 |

---

## Section 1 — Current State Audit

### 1.1 Component Inventory

| #  | Component           | Category  | renders.tsx | core-components.ts | metadata.ts | converter aliases | Normalizer | Health  |
| -- | ------------------- | --------- | ----------- | ------------------ | ----------- | ----------------- | ---------- | ------- |
| 1  | AnnouncementBar     | marketing | ✅ L24367   | ✅ L21197          | ✅ L959     | 4 aliases         | ❌ Missing | 🔴 40% |
| 2  | SocialProof         | marketing | ✅ L24510   | ✅ L21757          | ✅ L971     | 2 aliases         | ❌ Missing | 🔴 20% |
| 3  | TrustBadges         | marketing | ✅ L24747   | ✅ L22387          | ✅ L982     | 6 aliases         | ✅ L2204   | 🟡 55% |
| 4  | LogoCloud           | marketing | ✅ L24874   | ✅ L22999          | ✅ L994     | 5 aliases         | ✅ L2131   | 🟡 65% |
| 5  | ComparisonTable     | marketing | ✅ L25135   | ✅ L23750          | ✅ L1006    | 3 aliases         | ❌ Missing | 🔴 35% |

**Overall Marketing Category Health: 43% — WORST of all 10 component categories.**

### 1.2 Critical Issues Summary

#### 🔴 Severity 1 — SILENTLY BROKEN (props lost, user sees nothing)

| #  | Component       | Issue                                           | Impact                                               |
| -- | --------------- | ----------------------------------------------- | ---------------------------------------------------- |
| 1  | AnnouncementBar | `closable` (registry) ≠ `dismissible` (render)  | Dismiss button never renders — users cannot close bar |
| 2  | SocialProof     | Entire registry design ≠ render design          | ~80% of registry fields have no render equivalents    |
| 3  | ComparisonTable | `highlighted` ≠ `highlight`                     | Column highlight styling never applied                |
| 4  | ComparisonTable | `priceNote` ≠ `priceSubtext`                    | Price subtitle text never renders                     |
| 5  | ComparisonTable | `description` ≠ `tooltip`                       | Row tooltips never render                             |
| 6  | ComparisonTable | `category` ≠ `group`                            | Row grouping never works                              |

#### 🟠 Severity 2 — PARTIAL BREAKAGE (feature degraded)

| #  | Component       | Issue                                                    | Impact                                               |
| -- | --------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| 7  | AnnouncementBar | Variant mismatch — registry: glass/outlined/minimal/animated; render: success/warning/error/info/custom | Only "default" and "gradient" work — user picks "glass" but gets "default" |
| 8  | TrustBadges     | Badges array: render expects `{image, alt, link}`, registry provides `{icon, text, description, image, link, featured, badgeColor}` | icon, text, description, featured, badgeColor are all silently ignored |
| 9  | LogoCloud       | Render variant "simple" vs registry variant "inline"     | Name mismatch — minor, but AI must know the mapping   |
| 10 | SocialProof     | "detailed" variant declared in render type but NOT implemented | Selecting "detailed" shows nothing                    |

#### 🟡 Severity 3 — FEATURE GAPS (registry defines it, render doesn't support it)

| #  | Component       | Missing in Render                                                            |
| -- | --------------- | ---------------------------------------------------------------------------- |
| 11 | AnnouncementBar | countdown timer, animation, border controls, responsive overrides            |
| 12 | SocialProof     | avatars array, live counter, animated count-up, badges, card styling         |
| 13 | TrustBadges     | tooltip display, icon rendering, stacked/pills/icons-only variants           |
| 14 | LogoCloud       | carousel/infinite/stacked/scattered variants, tooltip display                |
| 15 | ComparisonTable | bordered/minimal variants, footnote support, CTA buttons in columns          |

### 1.3 Category Consistency Check

All 5 marketing components correctly use:
- `category: "marketing"` in metadata ✅
- `category: "marketing"` in registry `defineComponent()` ✅
- All 5 in `KNOWN_REGISTRY_TYPES` set ✅
- All 5 have `acceptsChildren: false` in metadata ✅

**SocialProof is missing `usageGuidelines` in metadata** — the only one of the 5.

### 1.4 Render Props vs Registry Fields Coverage

| Component       | Render Props | Registry Fields | Coverage | Gap   |
| --------------- | ------------ | --------------- | -------- | ----- |
| AnnouncementBar | 19           | 50+             | ~35%     | 31+   |
| SocialProof     | 22           | 50+             | ~15%     | 35+   |
| TrustBadges     | 14           | 50+             | ~25%     | 36+   |
| LogoCloud       | 24           | 60+             | ~40%     | 36+   |
| ComparisonTable | 18           | 70+             | ~25%     | 52+   |

> **Interpretation:** Registries were designed aspirationally with rich field sets. Renders were built pragmatically with minimal props. The gap must be closed **from the render side** — extend renders to consume more registry fields. Do NOT remove fields from registries; they represent the target feature set.

---

## Section 2 — Industry Benchmark

### 2.1 What Best-in-Class Marketing Components Look Like

| Component Type      | Industry Standard                                                                                              | Our Status                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Announcement Bar    | Dismissible, countdown timer, smart scheduling, A/B variants, sticky with scroll-aware behaviour               | Basic dismiss broken, no timer/scheduling |
| Social Proof        | Real-time counters, avatar stacks, platform logos (G2, Trustpilot), animated number tickers, Schema.org markup | Schema.org present ✅, everything else missing or mismatched |
| Trust Badges        | Icon + text + tooltip, responsive grid/row, featured badge highlighting, hover effects, grayscale toggle        | Grayscale + stagger animation ✅, icon/text/tooltip lost from props |
| Logo Cloud          | Marquee with pause, responsive grid, grayscale-to-colour hover, tooltip on logos, lazy-load images             | Marquee ✅, grayscale ✅, responsive ✅ — best implemented of the 5 |
| Comparison Table    | Sticky header, mobile-responsive, row grouping, tooltips, highlight recommended column, CTA buttons            | Sticky ✅, mobile stack ✅, grouping/tooltips broken by field mismatches |

### 2.2 Competitive Gaps

1. **No countdown timer** — AnnouncementBar registry defines `countdown*` fields but render has zero timer logic
2. **No animated counters** — SocialProof registry defines `animateCount` but render doesn't implement it
3. **No carousel/infinite scroll** — LogoCloud registry defines 4 additional variants beyond what render supports
4. **No CTA buttons in comparison columns** — ComparisonTable registry defines `ctaText`/`ctaLink` per column but render ignores them
5. **No A/B variant testing** — None of the 5 components support variant testing; this is a platform-level gap

### 2.3 Priority Ranking (Business Impact)

1. **ComparisonTable** — Directly drives purchasing decisions. Field mismatches break the most critical marketing UX.
2. **AnnouncementBar** — Site-wide visibility. Broken dismiss = frustrated users. Missing countdown = lost urgency.
3. **SocialProof** — Trust signal. Complete redesign needed to match registry intent.
4. **TrustBadges** — Trust signal. Icon/text rendering lost means badges show as image-only.
5. **LogoCloud** — Best implemented. Needs variant expansion, not fundamental fixes.

---

## Section 3 — Architecture Overview

### 3.1 Marketing Components in the Render Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    AI Website Designer                    │
│  Generates JSON: { type: "Banner", props: { ... } }     │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                   converter.ts                           │
│  1. typeMap["Banner"] → "AnnouncementBar"               │
│  2. KNOWN_REGISTRY_TYPES.has("AnnouncementBar") → true  │
│  3. transformPropsForStudio("AnnouncementBar", props)    │
│     ⚠️ No normalizer for AnnouncementBar — passthrough  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                 Supabase JSONB storage                    │
│  { type: "AnnouncementBar", props: { closable: true } } │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                    renderer.tsx                           │
│  const renderFn = componentRegistry.get("AnnouncementBar")│
│  renderFn({ ...component.props, siteId,                 │
│             ...brandColors, ...brandFonts })             │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              AnnouncementBarRender()                      │
│  destructures: { dismissible, ... }                      │
│  ⚠️ receives closable: true                              │
│  ⚠️ dismissible = undefined (SILENT FAILURE)             │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Shared Utilities Used by Marketing Components

| Utility                  | File             | Used By                          | Purpose                                            |
| ------------------------ | ---------------- | -------------------------------- | -------------------------------------------------- |
| `isDarkBackground()`     | layout-utils.ts  | AnnouncementBar, LogoCloud       | Detects dark bg → returns boolean for text contrast |
| `getResponsiveClasses()` | layout-utils.ts  | SocialProof, TrustBadges         | Maps "sm"/"md"/"lg" → Tailwind spacing classes     |
| CSS variable injection   | renderer.tsx     | All 5                            | `--brand-primary`, `--brand-secondary`, etc.       |
| Brand colour injection   | renderer.tsx     | All 5                            | `injectBrandColors()` merges into props            |
| Brand font injection     | renderer.tsx     | All 5                            | `injectBrandFonts()` merges into props             |

### 3.3 Colour Handling Pattern

All 5 marketing components follow the same pattern:

```tsx
// ✅ CORRECT — all colours via style={{}}
<div style={{
  backgroundColor: background || 'var(--brand-primary, #3b82f6)',
  color: textColor || 'var(--brand-text, #ffffff)',
  borderColor: borderColor || 'transparent'
}}>
```

No marketing component uses Tailwind colour classes (bg-red-600, text-white, etc.). This is correct and must be maintained.

### 3.4 Component Relationships

```
Marketing Components (category: "marketing")
├── AnnouncementBar  — Top-of-page banner, typically full-width
│   └── Usually placed as first child of page layout
├── SocialProof      — Trust metric display
│   └── Often placed near CTAs or hero sections
├── TrustBadges      — Credential/certification display
│   └── Often placed in footer or near checkout
├── LogoCloud        — Client/partner logo display
│   └── Often placed below hero or in social proof sections
└── ComparisonTable  — Feature/pricing comparison
    └── Often placed on pricing pages or product pages
```

None of these components accept children (`acceptsChildren: false`). They are all leaf components — they render their own content from props, not from nested components.

---

## Section 4 — AnnouncementBar Deep Dive

### 4.1 Current Render Implementation

**File:** `renders.tsx` L24367–L24503  
**Export:** `AnnouncementBarRender(props: AnnouncementBarProps)`

#### Props Interface (17 props)

| Prop                | Type                                                                       | Default       | Used In Render |
| ------------------- | -------------------------------------------------------------------------- | ------------- | -------------- |
| `text`              | string                                                                     | "📢 Big announcement! Check out our latest updates." | ✅ Main text   |
| `link`              | string                                                                     | —             | ✅ CTA href    |
| `linkText`          | string                                                                     | "Learn more →"| ✅ CTA link    |
| `dismissible`       | boolean                                                                    | true          | ✅ Close button |
| `position`          | "top" \| "bottom"                                                          | "top"         | ✅ Position    |
| `variant`           | "default" \| "success" \| "warning" \| "error" \| "info" \| "gradient" \| "custom" | "default"  | ✅ Style switch |
| `icon`              | React.ReactNode                                                           | —             | ✅ Emoji/icon  |
| `textAlign`         | "left" \| "center" \| "right"                                              | "center"      | ✅ Alignment   |
| `size`              | "sm" \| "md" \| "lg"                                                       | "md"          | ✅ Padding/font |
| `sticky`            | boolean                                                                    | true          | ✅ Sticky top  |
| `backgroundColor`   | string                                                                     | —             | ✅ BG colour   |
| `textColor`         | string                                                                     | —             | ✅ Text colour |
| `linkColor`         | string                                                                     | —             | ✅ Link colour |
| `backgroundGradient`| GradientConfig                                                             | —             | ✅ Gradient    |
| `fontWeight`        | "normal" \| "medium" \| "semibold" \| "bold"                               | "normal"      | ✅ Typography  |
| `id`                | string                                                                     | —             | ✅ HTML id     |
| `className`         | string                                                                     | ""            | ✅ CSS class   |

#### Variant Styling

```
variant === "default"  → bg: var(--brand-primary, #3b82f6), text: white
variant === "success"  → bg: #059669, text: white
variant === "warning"  → bg: #d97706, text: white
variant === "error"    → bg: #dc2626, text: white
variant === "info"     → bg: #0891b2, text: white
variant === "gradient" → bg: linear-gradient(angle, gradientFrom, gradientTo)
variant === "custom"   → bg: background prop, text: textColor prop
```

#### Key Render Behaviours

- `sticky` → adds `position: sticky; top: 0; z-index: 50`
- `dismissible` → renders `×` close button (client-side dismiss NOT implemented — just renders the button visually)
- `isDarkBackground()` → adjusts link colour for contrast on dark backgrounds
- `icon` → rendered before message text as plain emoji or text
- Size controls padding: sm = `py-2 px-4`, md = `py-3 px-6`, lg = `py-4 px-8`

### 4.2 Registry Definition

**File:** `core-components.ts` L21197–L21756  
**Variants (6):** default, gradient, glass, outlined, minimal, animated

#### Field Groups (10)

| Group          | Key Fields                                                                              |
| -------------- | --------------------------------------------------------------------------------------- |
| content        | message, linkText, linkUrl, icon, secondaryMessage, secondaryLinkText, secondaryLinkUrl |
| countdown      | showCountdown, countdownDate, countdownLabel, countdownStyle                            |
| style          | background, textColor, linkColor, gradientFrom, gradientTo, gradientAngle, glassBlur    |
| typography     | fontSize, fontWeight, fontFamily, textAlign, letterSpacing, textTransform               |
| animation      | animation, animationDuration, animationDelay, pulseEffect                               |
| behavior       | **closable**, sticky, autoHide, autoHideDelay, showOnScroll                             |
| border         | borderColor, borderWidth, borderRadius, borderStyle                                     |
| spacing        | paddingX, paddingY, marginBottom                                                        |
| responsive     | mobileSize, mobileHideLink, mobileHideIcon                                             |
| accessibility  | ariaLabel, role                                                                          |

### 4.3 Field Mismatches

| Registry Field Name | Render Prop Name | Status                                    |
| ------------------- | ---------------- | ----------------------------------------- |
| `closable`          | `dismissible`    | 🔴 BREAKING — dismiss button never renders |
| `glass` (variant)   | —                | 🟡 Not implemented in render              |
| `outlined` (variant)| —                | 🟡 Not implemented in render              |
| `minimal` (variant) | —                | 🟡 Not implemented in render              |
| `animated` (variant)| —                | 🟡 Not implemented in render              |
| `showCountdown`     | —                | 🟡 No countdown logic in render           |
| `autoHide`          | —                | 🟡 No auto-hide logic in render           |
| `showOnScroll`      | —                | 🟡 No scroll-aware logic in render        |
| `secondaryMessage`  | —                | 🟡 Not rendered                           |
| `animation`         | —                | 🟡 No animation logic in render           |
| `pulseEffect`       | —                | 🟡 No pulse logic in render               |
| `glassBlur`         | —                | 🟡 Not applied in render                  |

### 4.4 Converter Aliases

```
typeMap: Banner → AnnouncementBar        (L448)
         BannerBlock → AnnouncementBar   (L449)
         AnnouncementBlock → AnnouncementBar (L446)
         AnnouncementBarBlock → AnnouncementBar (L447)
```

**Normalizer:** ❌ MISSING — must be added.

### 4.5 Recommended Fixes (Priority Order)

1. **CRITICAL:** Rename `dismissible` → `closable` in render function (or add normalizer mapping `closable → dismissible`)
2. **CRITICAL:** Add `glass`, `outlined`, `minimal`, `animated` variant cases to render function
3. **HIGH:** Add converter normalizer mapping `closable → closable` (identity) + `dismissible → closable` (backward compat)
4. **MEDIUM:** Implement countdown timer display (static countdown for SSR, client hydration for live countdown)
5. **MEDIUM:** Add aria-label and role="banner" for accessibility
6. **LOW:** Implement autoHide, showOnScroll, animation, pulseEffect (all require client-side JS)

---

## Section 5 — SocialProof Deep Dive

> ⚠️ **CRITICAL WARNING:** This component has the WORST render-registry alignment in the entire platform. The render function and registry define fundamentally different components sharing the same name. A full reconciliation is required.

### 5.1 Current Render Implementation

**File:** `renders.tsx` L24261–L24474  
**Export:** `SocialProofRender(props: SocialProofProps)`

#### Props Interface (22 props)

| Prop                | Type                                          | Default    | Used In Render |
| ------------------- | --------------------------------------------- | ---------- | -------------- |
| `variant`           | "stars" \| "score" \| "compact" \| "detailed" | "stars"    | ✅ Switch      |
| `rating`            | number                                        | 4.5        | ✅ Star render |
| `maxRating`         | number                                        | 5          | ✅ Star count  |
| `reviewCount`       | number                                        | —          | ✅ Count text  |
| `platform`          | string                                        | —          | ✅ Label       |
| `platformLogo`      | string                                        | —          | ✅ Logo image  |
| `title`             | string                                        | —          | ✅ Heading     |
| `subtitle`          | string                                        | —          | ✅ Sub text    |
| `size`              | "sm" \| "md" \| "lg"                          | "md"       | ✅ Size class  |
| `background`        | string                                        | —          | ✅ BG colour   |
| `textColor`         | string                                        | —          | ✅ Text colour |
| `starColor`         | string                                        | "#fbbf24"  | ✅ Star fill   |
| `starEmptyColor`    | string                                        | "#d1d5db"  | ✅ Star empty  |
| `accentColor`       | string                                        | —          | ✅ Score badge |
| `borderColor`       | string                                        | —          | ✅ Border      |
| `borderWidth`       | number                                        | —          | ✅ Border      |
| `borderRadius`      | number                                        | —          | ✅ Border      |
| `showPlatformLogo`  | boolean                                       | true       | ✅ Logo toggle |
| `schemaType`        | string                                        | "Product"  | ✅ JSON-LD     |
| `schemaName`        | string                                        | —          | ✅ JSON-LD     |
| `fontWeight`        | string                                        | —          | ✅ Typography  |
| `textAlign`         | string                                        | "center"   | ✅ Alignment   |

#### What the Render Actually Does

The render is a **rating/review display widget**:
- "stars" variant → renders N filled stars + empty stars using SVG with `starColor`/`starEmptyColor`
- "score" variant → renders a large numeric score badge (e.g., "4.5/5") with an accent colour background
- "compact" variant → renders a single-line "★ 4.5 (123 reviews)" format
- "detailed" variant → declared in type union but **NOT IMPLEMENTED** — falls through to default
- Half-star rendering using SVG `<defs><linearGradient>` for precise partial fills
- Schema.org JSON-LD `<script type="application/ld+json">` with AggregateRating schema
- Platform logo (e.g., Google, Trustpilot) rendered as `<img>` beside rating

### 5.2 Registry Definition

**File:** `core-components.ts` L21757–L22386  
**Variants (6):** inline, stacked, card, minimal, floating, banner

#### Field Groups (12)

| Group          | Key Fields                                                                        |
| -------------- | --------------------------------------------------------------------------------- |
| content        | **count**, **countSuffix**, **label**, description                                |
| avatars        | **showAvatars**, **avatars** (array: image, alt, name), **maxVisible**, overlap    |
| rating         | showRating, rating, maxRating, starColor, starEmptyColor, ratingLabel             |
| counter        | **animateCount**, **countDuration**, **countStart**, **showPlus**                  |
| layout         | alignment, direction, gap, reverseOrder                                           |
| style          | background, textColor, accentColor, borderColor, borderWidth, borderRadius        |
| typography     | fontSize, fontWeight, fontFamily, countFontSize, labelFontSize                    |
| card           | cardBackground, cardShadow, cardPadding, cardBorderRadius                         |
| badges         | **showBadge**, **badgeText**, **badgeColor**, **badgePosition**                    |
| animation      | animation, animationDuration, animationDelay, hoverScale                          |
| responsive     | mobileLayout, mobileHideAvatars, mobileCountSize                                 |
| accessibility  | ariaLabel, role                                                                    |

### 5.3 The Fundamental Mismatch

The registry defines a **social proof counter widget** ("10,000+ happy customers" with avatar stack):

```
┌──────────────────────────────────────┐
│  👤👤👤 10,000+ Happy Customers      │
│  ★★★★★  4.8/5 average rating        │
│  [Trusted by Fortune 500]            │
└──────────────────────────────────────┘
```

The render function implements a **rating/review display** ("4.5 stars on Google"):

```
┌──────────────────────────────────────┐
│  [Google Logo]                        │
│  ★★★★☆  4.5 out of 5                │
│  Based on 1,234 reviews              │
└──────────────────────────────────────┘
```

**These are complementary features, not contradictory.** The fix is to MERGE both designs — the render should support BOTH the rating display (current) AND the counter/avatar display (registry) as different variants.

### 5.4 Field Mismatch Table

| Registry Field    | Render Equivalent    | Status                             |
| ----------------- | -------------------- | ---------------------------------- |
| `count`           | —                    | 🔴 Not in render                   |
| `countSuffix`     | —                    | 🔴 Not in render                   |
| `label`           | —                    | 🔴 Not in render                   |
| `showAvatars`     | —                    | 🔴 Not in render                   |
| `avatars`         | —                    | 🔴 Not in render (array type)      |
| `animateCount`    | —                    | 🔴 Not in render                   |
| `showBadge`       | —                    | 🔴 Not in render                   |
| `badgeText`       | —                    | 🔴 Not in render                   |
| `rating`          | `rating`             | ✅ Match                           |
| `maxRating`       | `maxRating`          | ✅ Match                           |
| `starColor`       | `starColor`          | ✅ Match                           |
| `starEmptyColor`  | `starEmptyColor`     | ✅ Match                           |
| —                 | `reviewCount`        | 🟡 Only in render, not in registry |
| —                 | `platform`           | 🟡 Only in render, not in registry |
| —                 | `platformLogo`       | 🟡 Only in render, not in registry |
| —                 | `schemaType`         | 🟡 Only in render, not in registry |
| —                 | `schemaName`         | 🟡 Only in render, not in registry |

**Variant mismatch:**

| Registry Variant | Render Variant | Overlap |
| ---------------- | -------------- | ------- |
| inline           | compact        | Partial (similar layout) |
| stacked          | stars          | Partial (similar layout) |
| card             | score          | Partial (card-like)      |
| minimal          | —              | ❌ Not implemented       |
| floating         | —              | ❌ Not implemented       |
| banner           | —              | ❌ Not implemented       |
| —                | detailed       | ❌ Declared but not built |

### 5.5 Converter Aliases

```
typeMap: SocialProofBlock → SocialProof    (L426)
         SocialProofSection → SocialProof  (L427)
```

**Normalizer:** ❌ MISSING — CRITICALLY needed given the massive prop mismatches.

### 5.6 Recommended Fixes (Priority Order)

1. **CRITICAL:** Design a unified SocialProof component that handles BOTH use cases:
   - Rating-focused variants: `stars`, `score`, `compact` (current render)
   - Counter-focused variants: `inline`, `stacked`, `card`, `minimal`, `floating`, `banner` (from registry)
2. **CRITICAL:** Add ALL registry fields to the render props interface (count, countSuffix, label, avatars, animateCount, showBadge, etc.)
3. **CRITICAL:** Add converter normalizer to handle both AI-generated styles
4. **HIGH:** Implement the "detailed" variant (already declared in render type but never built)
5. **HIGH:** Add `reviewCount`, `platform`, `platformLogo`, `schemaType`, `schemaName` to registry fields
6. **MEDIUM:** Add `usageGuidelines` to metadata entry (currently missing)

---

## Section 6 — TrustBadges Deep Dive

### 6.1 Current Render Implementation

**File:** `renders.tsx` L24498–L24609  
**Export:** `TrustBadgesRender(props: TrustBadgesProps)`

> **Important:** There is also a `TrustBadgesElement` at L9144 inside `CTARender`. That is a NESTED sub-component for CTA blocks — NOT the standalone marketing component. This section documents the standalone export at L24516.

#### Props Interface (14 props)

| Prop              | Type                  | Default   | Used In Render |
| ----------------- | --------------------- | --------- | -------------- |
| `badges`          | Array<{image, alt, link}> | []    | ✅ Badge list  |
| `layout`          | "row" \| "grid"       | "row"     | ✅ Flex/grid   |
| `columns`         | number                | 4         | ✅ Grid cols   |
| `gap`             | number                | 16        | ✅ Gap px      |
| `size`            | "sm" \| "md" \| "lg"  | "md"      | ✅ Badge size  |
| `grayscale`       | boolean               | false     | ✅ CSS filter  |
| `hoverColor`      | boolean               | true      | ✅ Hover effect|
| `title`           | string                | —         | ✅ Section heading |
| `subtitle`        | string                | —         | ✅ Sub heading |
| `background`      | string                | —         | ✅ BG colour   |
| `textColor`       | string                | —         | ✅ Text colour |
| `borderRadius`    | number                | —         | ✅ Badge radius|
| `staggerAnimation`| boolean               | false     | ✅ Inline style delay |
| `maxWidth`        | string                | —         | ✅ Container width |

#### Key Render Behaviours

- `layout === "row"` → flex row with wrapping
- `layout === "grid"` → CSS grid with `columns` count
- `grayscale` → `filter: grayscale(100%)` on badge images
- `hoverColor` + `grayscale` → removes grayscale on hover (`filter: grayscale(0)`)
- `staggerAnimation` → each badge gets `animationDelay: ${index * 0.1}s` inline style
- Badge structure: `<a href={link}><img src={image} alt={alt} /></a>` or just `<img>` without link
- Size maps: sm = 40px, md = 60px, lg = 80px

### 6.2 Registry Definition

**File:** `core-components.ts` L22387–L22998  
**Variants (7):** inline, grid, cards, minimal, stacked, pills, icons-only

#### Field Groups (12)

| Group          | Key Fields                                                                          |
| -------------- | ----------------------------------------------------------------------------------- |
| header         | title, subtitle, titleColor, subtitleColor, titleSize, titleWeight                  |
| badges         | **badges** (array: **icon**, **text**, **description**, image, link, **featured**, **badgeColor**) |
| layout         | layout, columns, gap, alignment, reverseOrder                                       |
| badgeStyle     | badgeBackground, badgeBorderColor, badgeBorderWidth, badgeBorderRadius, badgeShadow |
| iconStyle      | **iconSize**, **iconColor**, **iconBackground**, **iconBorderRadius**               |
| hover          | hoverEffect, hoverScale, hoverShadow, hoverBorderColor, grayscale, hoverColor      |
| background     | background, backgroundImage, backgroundOverlay, backgroundBlur                      |
| spacing        | paddingX, paddingY, badgePadding, maxWidth                                          |
| animation      | staggerAnimation, animationType, animationDuration, animationDelay                  |
| tooltip        | **showTooltip**, **tooltipPosition**, **tooltipBackground**, **tooltipColor**       |
| responsive     | mobileColumns, mobileLayout, mobileSize, mobileBadgeSize                           |
| accessibility  | ariaLabel, role, badgeAriaLabel                                                      |

### 6.3 Field Mismatch Table

| Registry Field (badges array) | Render Prop (badges array) | Status                          |
| ----------------------------- | -------------------------- | ------------------------------- |
| `image`                       | `image`                    | ✅ Match                        |
| `link`                        | `link`                     | ✅ Match                        |
| `icon`                        | —                          | 🟠 Silently ignored by render   |
| `text`                        | —                          | 🟠 Silently ignored by render   |
| `description`                 | —                          | 🟠 Silently ignored by render   |
| `featured`                    | —                          | 🟠 Silently ignored by render   |
| `badgeColor`                  | —                          | 🟠 Silently ignored by render   |
| —                             | `alt`                      | 🟡 Only in render, not in registry — render uses `alt` but registry doesn't define it |

**Top-level field mismatches:**

| Registry Field   | Render Prop | Status                                |
| ---------------- | ----------- | ------------------------------------- |
| `showTooltip`    | —           | 🟡 Not in render                      |
| `iconSize`       | —           | 🟡 Not in render                      |
| `iconColor`      | —           | 🟡 Not in render                      |
| `hoverEffect`    | —           | 🟡 Not in render                      |
| `hoverScale`     | —           | 🟡 Not in render                      |
| `badgeShadow`    | —           | 🟡 Not in render                      |
| `variant`        | `layout`    | 🟠 Different field names and different value sets |

### 6.4 Converter Normalizer (EXISTS ✅)

**File:** `converter.ts` L2161–L2193

```
TrustBadges normalizer:
- Iterates badges array
- Separates emoji icons from URL-based images
- If icon starts with http/https → moves to image field
- If icon is emoji → keeps as icon, adds 🛡️ shield emoji as default
- Maps `alt` from `text` field if not present
```

This normalizer bridges SOME of the gap, but does not handle: `featured`, `badgeColor`, `description`, icon rendering in the render function.

### 6.5 Converter Aliases

```
typeMap: TrustBadgesBlock → TrustBadges       (L419)
         TrustBadgesSection → TrustBadges     (L420)
         Badges → TrustBadges                 (L421)
         Accreditations → TrustBadges         (L422)
         Credentials → TrustBadges            (L423)
         Certifications → TrustBadges         (L424)
```

### 6.6 Recommended Fixes (Priority Order)

1. **HIGH:** Extend render badges array to consume `icon`, `text`, `description`, `featured`, `badgeColor` fields
2. **HIGH:** Implement icon rendering — show icon when no image exists (icon + text layout)
3. **HIGH:** Add `alt` field to registry badges array definition for accessibility
4. **MEDIUM:** Implement `pills` and `icons-only` variants (most useful marketing patterns)
5. **MEDIUM:** Add tooltip rendering using `showTooltip`, `tooltipPosition`, `tooltipBackground`, `tooltipColor`
6. **LOW:** Implement `featured` badge highlighting (larger size, border, or glow effect)

---

## Section 7 — LogoCloud Deep Dive

> ✅ **BEST IMPLEMENTED** of the 5 marketing components. LogoCloud has the highest render-registry alignment at ~40% coverage, an existing normalizer, and 3 working variants.

### 7.1 Current Render Implementation

**File:** `renders.tsx` L24625–L24860  
**Export:** `LogoCloudRender(props: LogoCloudProps)`

#### Props Interface (24 props)

| Prop              | Type                              | Default    | Used In Render |
| ----------------- | --------------------------------- | ---------- | -------------- |
| `variant`         | "simple" \| "cards" \| "marquee" | "simple"   | ✅ Layout switch |
| `logos`           | Array<{src, alt, url, width, height}> | []     | ✅ Logo list   |
| `columns`         | number                            | 4          | ✅ Grid cols   |
| `gap`             | number                            | 32         | ✅ Gap px      |
| `logoHeight`      | number                            | 48         | ✅ Img height  |
| `grayscale`       | boolean                           | false      | ✅ CSS filter  |
| `hoverColor`      | boolean                           | true       | ✅ Hover effect|
| `title`           | string                            | —          | ✅ Section heading |
| `subtitle`        | string                            | —          | ✅ Sub heading |
| `badge`           | string                            | —          | ✅ Header badge |
| `background`      | string                            | —          | ✅ BG colour   |
| `textColor`       | string                            | —          | ✅ Text colour |
| `cardBackground`  | string                            | —          | ✅ Card BG     |
| `cardBorderColor` | string                            | —          | ✅ Card border |
| `cardBorderRadius`| number                            | —          | ✅ Card radius |
| `cardShadow`      | boolean                           | false      | ✅ Card shadow |
| `borderRadius`    | number                            | —          | ✅ Logo radius |
| `maxWidth`        | string                            | —          | ✅ Container   |
| `marqueeSpeed`    | number                            | 30         | ✅ Animation   |
| `marqueeDirection`| "left" \| "right"                 | "left"     | ✅ Scroll dir  |
| `pauseOnHover`    | boolean                           | true       | ✅ Hover pause |
| `paddingX`        | number                            | —          | ✅ Spacing     |
| `paddingY`        | number                            | —          | ✅ Spacing     |
| `legacyPadding`   | boolean                           | false      | ✅ Compat      |

#### Variant Details

**"simple" (default):** Responsive CSS grid with column count, logos centred. Grayscale toggle with hover colour restore.

**"cards":** Each logo wrapped in a card with background, border, shadow, and border-radius. Grid layout with same responsive columns.

**"marquee":** CSS animation-based horizontal scroll:
- Duplicates logos array for seamless loop
- `animation: marquee ${duration}s linear infinite`
- `marqueeDirection === "right"` → `animation-direction: reverse`
- `pauseOnHover` → `animation-play-state: paused` on `:hover`

**Header section:** All 3 variants render `badge` → `title` → `subtitle` above the logo grid when present.

#### Key Render Behaviours

- `isDarkBackground()` → adjusts text colours for contrast
- Legacy padding support via `legacyPadding` prop
- Logos with `url` → wrapped in `<a>`, logos without → plain `<img>`
- Logo `width`/`height` applied to `<img>` for layout stability

### 7.2 Registry Definition

**File:** `core-components.ts` L22999–L23749  
**Variants (7):** grid, inline, carousel, infinite, marquee, stacked, scattered

#### Field Groups (15)

| Group          | Key Fields                                                                          |
| -------------- | ----------------------------------------------------------------------------------- |
| header         | title, subtitle, badge, headerAlignment, titleColor, subtitleColor, badgeColor      |
| logos          | logos (array: src, alt, url, width, height, **tooltip**, **grayscale**), maxLogos   |
| layout         | columns, gap, alignment, verticalAlignment, itemSpacing                             |
| marquee        | marqueeSpeed, marqueeDirection, pauseOnHover, marqueeGap, marqueeRows              |
| logoStyle      | logoHeight, logoPadding, logoBackground, logoBorderColor, logoBorderRadius          |
| card           | cardBackground, cardBorderColor, cardBorderRadius, cardShadow, cardPadding          |
| hover          | hoverEffect, hoverScale, hoverShadow, hoverBorderColor, grayscale, hoverColor      |
| background     | background, backgroundImage, backgroundOverlay, backgroundGradient                  |
| divider        | **showDivider**, **dividerColor**, **dividerStyle**                                 |
| counter        | **showCount**, **countLabel**, **countColor**                                       |
| filter         | **filterByCategory**, **categories**                                                |
| spacing        | paddingX, paddingY, maxWidth, containerWidth                                        |
| animation      | staggerAnimation, animationType, animationDuration, animationDelay                  |
| responsive     | mobileColumns, mobileLogoHeight, mobileHideSubtitle, mobileMarqueeSpeed            |
| accessibility  | ariaLabel, role, logoAriaLabel                                                       |

### 7.3 Field Mismatch Table

| Registry Field       | Render Prop         | Status                          |
| -------------------- | ------------------- | ------------------------------- |
| `variant: "grid"`    | `variant: "simple"` | 🟠 Name mismatch (same concept)|
| `variant: "inline"`  | —                   | 🟡 Not implemented              |
| `variant: "carousel"`| —                   | 🟡 Not implemented              |
| `variant: "infinite"`| —                   | 🟡 Not implemented              |
| `variant: "stacked"` | —                   | 🟡 Not implemented              |
| `variant: "scattered"`| —                  | 🟡 Not implemented              |
| `logo.tooltip`       | —                   | 🟡 Not consumed by render       |
| `logo.grayscale`     | —                   | 🟡 Per-logo control not implemented (only global grayscale) |
| `showDivider`        | —                   | 🟡 Not in render                |
| `showCount`          | —                   | 🟡 Not in render                |
| `filterByCategory`   | —                   | 🟡 Not in render                |
| `hoverScale`         | —                   | 🟡 Not in render                |
| `marqueeRows`        | —                   | 🟡 Not in render (single row only) |

### 7.4 Converter Normalizer (EXISTS ✅)

**File:** `converter.ts` L2082–L2159

```
LogoCloud normalizer:
- Validates logo image URLs (must be http/https or start with /)
- Fallback: if no valid logos, converts to Features component with __convertedToFeatures flag
- Maps responsive columns: mobileColumns → columns for small screens
- Maps logoGrayscale → grayscale (prop name normalisation)
- Maps backgroundColor → background (prop name normalisation)
```

This is the most complete normalizer of any marketing component. The `__convertedToFeatures` fallback is a smart degradation strategy for when AI generates logos without valid image URLs.

### 7.5 Converter Aliases

```
typeMap: LogoCloudBlock → LogoCloud       (L414)
         LogoCloudSection → LogoCloud     (L415)
         PartnerLogos → LogoCloud         (L416)
         Partners → LogoCloud             (L417)
         TrustedBy → LogoCloud            (L418)
```

### 7.6 Recommended Fixes (Priority Order)

1. **MEDIUM:** Add registry variant "grid" → render variant "simple" aliasing in normalizer (or rename render variant to "grid")
2. **MEDIUM:** Implement per-logo `tooltip` as `title` attribute on logo images
3. **MEDIUM:** Implement per-logo `grayscale` override (currently only global toggle)
4. **LOW:** Implement `stacked` variant (logos vertically stacked with text descriptions)
5. **LOW:** Implement `carousel` variant (arrow-navigated horizontal scroll)
6. **LOW:** Implement `showCount` counter (e.g., "200+ partners worldwide")
7. **LOW:** Implement `marqueeRows` for multi-row marquee

---

## Section 8 — ComparisonTable Deep Dive

### 8.1 Current Render Implementation

**File:** `renders.tsx` L24869–L25301  
**Export:** `ComparisonTableRender(props: ComparisonTableProps)`

#### Props Interface (18 props)

| Prop                | Type                                     | Default    | Used In Render |
| ------------------- | ---------------------------------------- | ---------- | -------------- |
| `variant`           | "simple" \| "cards" \| "striped"         | "simple"   | ✅ Layout switch |
| `columns`           | Array<{name, **highlight**, price, priceLabel, **priceSubtext**, buttonText, buttonLink}> | [] | ✅ Headers |
| `rows`              | Array<{label, **tooltip**, **group**, values: (boolean\|string)[]}> | [] | ✅ Data rows |
| `title`             | string                                   | —          | ✅ Table heading |
| `subtitle`          | string                                   | —          | ✅ Sub heading |
| `stickyHeader`      | boolean                                  | false      | ✅ Sticky      |
| `stickyFirstColumn` | boolean                                  | false      | ✅ Sticky col  |
| `mobileStack`       | boolean                                  | true       | ✅ Mobile view |
| `background`        | string                                   | —          | ✅ BG colour   |
| `textColor`         | string                                   | —          | ✅ Text colour |
| `headerBackground`  | string                                   | —          | ✅ Header BG   |
| `headerTextColor`   | string                                   | —          | ✅ Header text |
| `highlightColor`    | string                                   | —          | ✅ Highlight BG|
| `borderColor`       | string                                   | —          | ✅ Table border|
| `checkColor`        | string                                   | "#059669"  | ✅ SVG check   |
| `crossColor`        | string                                   | "#dc2626"  | ✅ SVG cross   |
| `stripeColor`       | string                                   | —          | ✅ Odd rows    |
| `maxWidth`          | string                                   | —          | ✅ Container   |

#### What the Render Actually Does

**Table rendering:**
- Generates a `<table>` element with responsive behaviour
- Header row: renders `columns` array with name, price, priceLabel, priceSubtext, buttonText/buttonLink
- Data rows: renders `rows` array, maps each `values[i]` to the corresponding column
- Boolean values → SVG check (✓) or cross (✗) with `checkColor`/`crossColor`
- String values → rendered as text

**Row grouping:**
- `rows` with `group` property → inserts a group header row spanning all columns
- Groups are separated visually with a darker background

**Tooltip:**
- `rows` with `tooltip` → added as `title` attribute on the row label cell

**Sticky behaviour:**
- `stickyHeader` → `position: sticky; top: 0` on header row
- `stickyFirstColumn` → `position: sticky; left: 0` on first column cells

**Mobile stack:**
- `mobileStack` → at narrow viewports, each column becomes a card with its own row values listed vertically

**Variant styling:**
- "simple" → Clean table with minimal borders
- "cards" → Each column rendered as a separate card with shadow
- "striped" → Alternating row background with `stripeColor`

### 8.2 Registry Definition

**File:** `core-components.ts` L23750–L24500+  
**Variants (5):** default, cards, minimal, bordered, striped

#### Field Groups (17)

| Group          | Key Fields                                                                            |
| -------------- | ------------------------------------------------------------------------------------- |
| header         | title, subtitle, titleColor, subtitleColor, titleSize, headerAlignment                |
| columns        | columns (array: name, **highlighted**, price, priceLabel, **priceNote**, buttonText, buttonLink, **ctaText**, **ctaLink**, **ctaColor**, **columnColor**, **featureList**) |
| rows           | rows (array: label, **description**, **category**, values, **icon**, **helpText**)    |
| highlights     | highlightColor, highlightBorderColor, highlightBadgeText, highlightBadgeColor         |
| booleans       | checkColor, crossColor, checkIcon, crossIcon, booleanSize                             |
| sticky         | stickyHeader, stickyFirstColumn, stickyBackground, stickyZIndex                       |
| mobile         | mobileStack, mobileCardStyle, mobileBreakpoint, mobileShowAll                        |
| style          | background, textColor, headerBackground, headerTextColor, borderColor, stripeColor    |
| typography     | fontSize, headerFontSize, fontWeight, fontFamily, cellFontSize                        |
| card           | cardBackground, cardBorderColor, cardBorderRadius, cardShadow, cardPadding            |
| footnote       | **showFootnote**, **footnoteText**, **footnoteColor**, **footnoteSize**               |
| badge          | **showBadge**, **badgeText**, **badgeColor**, **badgePosition**                       |
| divider        | **showRowDivider**, **dividerColor**, **dividerStyle**                                |
| filter         | **showFilter**, **filterCategories**, **activeFilter**                                |
| animation      | animation, animationDuration, hoverHighlight, hoverScale                              |
| responsive     | responsiveBreakpoint, mobileColumns, tabletColumns                                    |
| accessibility  | ariaLabel, role, captionText, captionPosition                                          |

### 8.3 Field Mismatch Table (BREAKING)

| Registry Field (columns array) | Render Prop (columns array) | Status                             |
| ------------------------------ | --------------------------- | ---------------------------------- |
| `highlighted`                  | `highlight`                 | 🔴 BREAKING — highlight never applied |
| `priceNote`                    | `priceSubtext`              | 🔴 BREAKING — price subtitle never shows |
| `ctaText`                      | —                           | 🟡 Not in render                   |
| `ctaLink`                      | —                           | 🟡 Not in render                   |
| `ctaColor`                     | —                           | 🟡 Not in render                   |
| `columnColor`                  | —                           | 🟡 Not in render                   |
| `featureList`                  | —                           | 🟡 Not in render                   |

| Registry Field (rows array) | Render Prop (rows array) | Status                                |
| --------------------------- | ------------------------ | ------------------------------------- |
| `description`               | `tooltip`                | 🔴 BREAKING — tooltips never show     |
| `category`                  | `group`                  | 🔴 BREAKING — row grouping never works |
| `icon`                      | —                        | 🟡 Not in render                      |
| `helpText`                  | —                        | 🟡 Not in render                      |

| Registry Variant | Render Variant | Status                          |
| ---------------- | -------------- | ------------------------------- |
| `default`        | `simple`       | 🟠 Name mismatch (same concept)|
| `cards`          | `cards`        | ✅ Match                        |
| `minimal`        | —              | 🟡 Not implemented              |
| `bordered`       | —              | 🟡 Not implemented              |
| `striped`        | `striped`      | ✅ Match                        |

### 8.4 Converter Aliases

```
typeMap: ComparisonBlock → ComparisonTable       (L442)
         ComparisonSection → ComparisonTable     (L443)
         ComparisonTableBlock → ComparisonTable  (L444)
```

**Normalizer:** ❌ MISSING — CRITICALLY needed given the 4 breaking field mismatches.

### 8.5 Recommended Fixes (Priority Order)

1. **CRITICAL:** Add converter normalizer mapping:
   - `columns[].highlighted → columns[].highlight`
   - `columns[].priceNote → columns[].priceSubtext`
   - `rows[].description → rows[].tooltip`
   - `rows[].category → rows[].group`
   - `variant: "default" → variant: "simple"`
2. **CRITICAL:** Alternatively, rename render props to match registry names (preferred — reduces converter complexity)
3. **HIGH:** Add `ctaText`/`ctaLink` rendering in column headers (CTA buttons in comparison columns)
4. **HIGH:** Implement `bordered` variant (useful for dense comparison tables)
5. **MEDIUM:** Add `showFootnote`, `footnoteText` rendering below table
6. **MEDIUM:** Add `showBadge` rendering on highlighted column (e.g., "Most Popular")
7. **LOW:** Implement `showFilter` for category-based row filtering

---

## Section 9 — Dark Mode & Colour Handling

### 9.1 Current Dark Mode Support

| Component       | Uses `isDarkBackground()` | CSS Variable Fallbacks | Hardcoded Colours | Dark Mode Status |
| --------------- | ------------------------- | ---------------------- | ----------------- | ---------------- |
| AnnouncementBar | ✅ Yes (link contrast)    | ✅ `var(--brand-primary, #3b82f6)` | 5 variant colours (success, warning, error, info + gradient) | 🟡 Partial |
| SocialProof     | ❌ No                     | ✅ `var(--brand-text, ...)` | `#fbbf24` star, `#d1d5db` empty star | 🟠 Weak |
| TrustBadges     | ❌ No                     | ❌ None found           | No hardcoded colours | 🟡 Relies on props |
| LogoCloud       | ✅ Yes (text contrast)    | ✅ `var(--brand-primary, ...)` | No hardcoded colours | ✅ Good |
| ComparisonTable | ❌ No                     | ✅ `var(--brand-primary, ...)` | `#059669` check, `#dc2626` cross | 🟡 Partial |

### 9.2 Colour Application Rules

All marketing components correctly use `style={{}}` for colours. None use Tailwind colour classes. This is the correct pattern and must be maintained.

**Colour resolution order:**
1. Explicit prop value (user-set colour)
2. CSS variable with fallback: `var(--brand-primary, #3b82f6)`
3. Component-level hardcoded defaults (e.g., star colours)

### 9.3 Recommended Dark Mode Improvements

1. **SocialProof:** Add `isDarkBackground()` check for text contrast
2. **TrustBadges:** Add `isDarkBackground()` check — currently relies entirely on user-provided colours
3. **ComparisonTable:** Add `isDarkBackground()` check for header and cell text contrast
4. **All 5:** Ensure all hardcoded colours (check/cross, star colours, variant colours) have CSS variable overrides

---

## Section 10 — Accessibility Audit

### 10.1 Current Accessibility Status

| Component       | `role` | `aria-label` | `aria-live` | Keyboard Nav | Screen Reader | Status |
| --------------- | ------ | ------------ | ----------- | ------------ | ------------- | ------ |
| AnnouncementBar | ❌     | ❌           | ❌          | ❌ Dismiss   | ❌            | 🔴 Poor |
| SocialProof     | ❌     | ❌           | N/A         | N/A          | ✅ JSON-LD    | 🟡 Partial |
| TrustBadges     | ❌     | ❌           | N/A         | ❌ Badge links | ❌          | 🔴 Poor |
| LogoCloud       | ❌     | ❌           | N/A         | ❌ Logo links | ❌           | 🔴 Poor |
| ComparisonTable | ❌     | ❌           | N/A         | N/A          | ❌ No caption | 🔴 Poor |

### 10.2 Required Accessibility Fixes

**AnnouncementBar:**
- Add `role="banner"` or `role="alert"` based on variant
- Add `aria-label="Announcement"` or user-provided label
- Add `aria-live="polite"` for dynamic content
- Dismiss button needs `aria-label="Close announcement"`
- Dismiss button needs keyboard focus (`tabIndex={0}`, `onKeyDown` for Enter/Space)

**SocialProof:**
- Add `role="status"` for rating display
- Star rendering needs `aria-label="Rated {rating} out of {maxRating}"`
- Schema.org JSON-LD is good for SEO ✅ — but visible elements still need ARIA

**TrustBadges:**
- Add `role="list"` on badge container, `role="listitem"` on each badge
- Badge links need descriptive `aria-label` (not just image alt)
- Add keyboard focus indicators on linked badges

**LogoCloud:**
- Add `role="list"` on logo container, `role="listitem"` on each logo
- Marquee: add `aria-label="Partner logos"` and consider reduced-motion preference
- Logo links need `aria-label` combining company name + "Visit website"

**ComparisonTable:**
- Add `<caption>` element with table title for screen readers
- Add `scope="col"` on header cells, `scope="row"` on row labels
- Boolean check/cross icons need `aria-label="Included"` / `aria-label="Not included"`
- Sticky header needs `aria-hidden` on duplicated decorative elements if any

---

## Section 11 — CSS Variables & Theming

### 11.1 CSS Variables Used by Marketing Components

| Variable                  | Used By                          | Fallback    | Purpose              |
| ------------------------- | -------------------------------- | ----------- | -------------------- |
| `--brand-primary`         | AnnouncementBar, LogoCloud, ComparisonTable | `#3b82f6`  | Primary brand colour |
| `--brand-secondary`       | —                                | `#6366f1`   | Available but unused |
| `--brand-text`            | SocialProof                      | `#111827`   | Text colour          |
| `--brand-background`      | —                                | `#ffffff`   | Available but unused |

### 11.2 Brand Injection Flow

```
renderer.tsx
  → injectBrandColors(props, siteConfig.branding)
    → Merges: { primaryColor, secondaryColor, accentColor, ... }
    → Sets CSS variables on wrapper: --brand-primary, --brand-secondary, etc.
  → injectBrandFonts(props, siteConfig.branding)
    → Merges: { headingFont, bodyFont }
    → Sets CSS variables: --brand-heading-font, --brand-body-font
```

All 5 marketing components receive these injected props automatically. However, most marketing renders do NOT use the brand font variables — they rely on explicit `fontWeight`/`fontFamily` props or Tailwind utility classes.

### 11.3 Component-Level CSS Variables

**ComparisonTable** is the only marketing component that defines its own CSS variables inline:

```tsx
style={{
  '--check-color': checkColor || '#059669',
  '--cross-color': crossColor || '#dc2626',
  '--stripe-color': stripeColor || 'rgba(0,0,0,0.02)',
  '--highlight-color': highlightColor || 'rgba(59,130,246,0.05)',
}}
```

This is a good pattern and should be adopted by other marketing components for their repeated colour values.

---

## Section 12 — AI Integration Points

### 12.1 AI Discovery (component-metadata.ts)

| Component       | Keywords                                      | `usageGuidelines`         | `acceptsChildren` |
| --------------- | --------------------------------------------- | ------------------------- | ------------------ |
| AnnouncementBar | announcement, banner, promo, alert            | ✅ Present                | false              |
| SocialProof     | social proof, users, customers, trust         | ❌ **Missing**            | false              |
| TrustBadges     | trust, badges, security, certifications       | ✅ Present                | false              |
| LogoCloud       | logos, clients, partners, brands              | ✅ Present                | false              |
| ComparisonTable | comparison, table, pricing, features          | ✅ Present                | false              |

**Action:** Add `usageGuidelines` to SocialProof metadata.

### 12.2 AI Prop Generation (Registry `ai` Section)

All 5 marketing components have `ai.canModify` lists in their registry definitions. These lists control which props the AI can generate values for:

- AnnouncementBar: message, linkText, linkUrl, variant, background, textColor, icon
- SocialProof: count, countSuffix, label, rating, variant, background, textColor
- TrustBadges: title, badges, layout, variant, grayscale, background
- LogoCloud: title, subtitle, badge, logos, variant, columns, grayscale
- ComparisonTable: title, columns, rows, variant, highlightColor

> **SocialProof `ai.canModify` references `count`/`countSuffix`/`label`** — fields that DON'T EXIST in the render function. This means AI generates these props, they get stored, and they are silently lost during render.

### 12.3 Converter Intelligence

The converter's `transformPropsForStudio()` function is the AI's safety net. When the AI generates non-standard prop names, the normalizer corrects them.

**Current normalizer coverage:**
- LogoCloud: ✅ Comprehensive (URL validation, prop mapping, fallback component)
- TrustBadges: ✅ Partial (emoji/URL separation, shield default)
- AnnouncementBar: ❌ None
- SocialProof: ❌ None
- ComparisonTable: ❌ None

The 3 missing normalizers mean AI-generated content for these components goes through WITHOUT validation or correction. This is a critical gap.

---

## Section 13 — Registry & Converter Alignment

> This section is the core of what must change. Every mismatch listed here causes **silent data loss** — the AI configures something, the user sees nothing, and there's no error message.

### 13.1 AnnouncementBar Alignment

#### Field Name Mismatches

| Registry Field  | Render Prop    | Impact                                      | Fix                                       |
| --------------- | -------------- | ------------------------------------------- | ----------------------------------------- |
| `closable`      | `dismissible`  | Close button never responds to registry     | Rename render prop to `closable`          |
| `iconName`      | `icon`         | Icons from registry don't display            | Rename render prop to `iconName`          |
| `linkUrl`       | `link`         | Link URL from registry is never used         | Rename render prop to `linkUrl`           |
| `message`       | `text`         | Announcement text doesn't render             | Rename render prop to `message`           |

#### Variant Mismatches

| Registry Variants                                    | Render Variants                                            |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| default, gradient, glass, outlined, minimal, animated | default, success, warning, error, info, gradient, custom  |

**Fix strategy:** The registry variants represent *visual styles* (glass=frosted, outlined=border-only, minimal=text-only, animated=marquee). The render variants represent *semantic types* (success=green, warning=yellow, error=red). These serve different purposes. **Keep both** — add registry variants to the render function AND keep semantic variants as colour presets within each visual style.

#### Missing from Render (Registry Has, Render Ignores)

| Registry Field             | Purpose                                  | Priority |
| -------------------------- | ---------------------------------------- | -------- |
| `countdown`                | Target date for countdown display        | P1       |
| `countdownLabel`           | Text before countdown                    | P1       |
| `showCountdownDays/Hours/Min/Sec` | Toggle countdown segments        | P2       |
| `marquee`                  | Enable scrolling text mode               | P1       |
| `marqueeSpeed`             | Scroll speed                             | P2       |
| `secondaryAction`          | Second CTA button                        | P2       |
| `autoHide`                 | Automatically dismiss after N seconds    | P2       |
| `cookieDuration`           | Remember dismissal (days)                | P1       |
| `animateOnLoad`            | Entrance animation                       | P2       |
| `borderRadius`             | Configurable rounding                    | P3       |
| `boxShadow`                | Shadow style                             | P3       |

#### Normalizer Required

```
AnnouncementBar normalizer in transformPropsForStudio():
  - Map "text"/"content"/"headline" → "message"
  - Map "url"/"href"/"clickUrl" → "linkUrl"  
  - Map "dismissible"/"hideable" → "closable"
  - Validate countdown date format (ISO 8601)
  - Default variant → "default" if invalid value supplied
  - Strip HTML from message text (XSS prevention)
```

### 13.2 SocialProof Alignment

> ⚠️ **This component requires a complete re-architecture.** The registry defines a count+avatars+badge component. The render implements a star-rating/review widget. They share almost no props.

#### Current State Comparison

| Aspect        | Registry (core-components.ts L21757)                        | Render (renders.tsx L24261)                              |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| **Purpose**   | "1,500+ customers trust us" with avatar stack               | "4.8/5 from 2,000 reviews on Trustpilot" with stars     |
| **Key props** | count, countSuffix, label, avatarImages, badge, badgeIcon   | rating, maxRating, reviewCount, platform, platformLogo   |
| **Variants**  | inline, stacked, card, minimal, floating, banner            | stars, score, compact, detailed                          |
| **Display**   | Number + text + avatar cluster + optional badge             | Star icons + score text + platform branding              |
| **Schema**    | None                                                        | AggregateRating JSON-LD                                  |

#### Fix Strategy: Unified SocialProof Component

Both use cases are valid. The render should support BOTH modes:

**Mode 1: Count Display** (matches registry)
```
"1,500+ customers trust us" [avatar] [avatar] [avatar] +50
```

**Mode 2: Rating Display** (matches current render)
```
★★★★½  4.8/5 · 2,000 reviews on Trustpilot
```

**Implementation approach:**
1. Add a `mode` field to registry: `"count"` or `"rating"` (default: `"count"`)
2. Keep ALL existing registry fields (count, countSuffix, label, avatars)
3. Add rating-specific fields (rating, maxRating, reviewCount, platform, platformLogo, enableSchema)
4. Render function uses `mode` to switch between count display and rating display
5. Both modes share: variant, colours, animation props

#### Normalizer Required

```
SocialProof normalizer in transformPropsForStudio():
  - Detect mode from props: if "rating" present → mode="rating", if "count" present → mode="count"
  - Map "stars"/"score" → "rating" (number, clamp 0–5)
  - Map "reviews"/"reviewCount"/"totalReviews" → "reviewCount"
  - Map "users"/"customers"/"signups" → "count" (number)
  - Map "suffix"/"unit" → "countSuffix"
  - Validate rating range (0–maxRating)
  - Validate count is positive integer
  - Default platform → null if not a known platform name
```

### 13.3 TrustBadges Alignment

#### Badge Array Mismatch

| Field       | Registry Badge Item                                       | Render Badge Item            |
| ----------- | --------------------------------------------------------- | ---------------------------- |
| `icon`      | ✅ (text string, e.g., "🛡️")                             | ❌ Not consumed              |
| `text`      | ✅ (label text)                                           | ❌ Not consumed              |
| `description`| ✅ (longer text)                                          | ❌ Not consumed              |
| `image`     | ✅ (image URL)                                            | ✅ Consumed                  |
| `alt`       | ❌ Not in registry                                        | ✅ Consumed                  |
| `link`      | ✅ (click URL)                                            | ✅ Consumed                  |
| `featured`  | ✅ (boolean highlight)                                    | ❌ Not consumed              |
| `badgeColor`| ✅ (individual badge tint)                                | ❌ Not consumed              |

**Fix:** Expand render to accept ALL registry fields. When `image` is present, render as image badge. When only `icon` + `text` is present, render as icon+text badge. This makes TrustBadges work for both image-based badges (SSL seals, certification logos) and text-based badges (custom icons + labels).

#### Variant Gap

| Registry Variants                                          | Render Layouts         |
| ---------------------------------------------------------- | ---------------------- |
| inline, grid, cards, minimal, stacked, pills, icons-only  | row, grid              |

**Fix:** Map render `layout` prop to accept all variant names. `row` = `inline`. `grid` = `grid`. Add rendering for `cards`, `pills`, `icons-only`, `minimal`, and `stacked`.

#### Normalizer Enhancement

The existing normalizer at L2161 handles emoji/URL separation. Enhancements needed:
```
Enhanced TrustBadges normalizer:
  - Existing: separate emoji icons from real image URLs ✅
  - Existing: default shield emoji 🛡️ when no icon/image ✅
  - Add: map "name"/"label"/"title" → "text" per badge
  - Add: map "tooltip"/"detail" → "description" per badge  
  - Add: ensure "alt" field exists (fall back to "text" or "icon")
  - Add: validate badge URLs (reject non-https in production)
```

### 13.4 LogoCloud Alignment

LogoCloud has the **best alignment** of all 5 marketing components. Its normalizer at L2082 is comprehensive.

#### Current Normalizer Capabilities (L2082–L2159)

1. **Image URL validation** — filters out non-URL strings, keeps only valid image URLs
2. **Responsive columns mapping** — maps number to responsive layout string
3. **Property migration** — `grayscale` → `logoGrayscale`
4. **`__convertedToFeatures` fallback** — if NO valid images after normalisation, converts the entire component to a `Features` component with text items instead. This is the ONLY component with a fallback strategy.
5. **Logo array normalisation** — handles `logos`, `items`, `brands`, `partners` prop names

#### Minor Improvements Needed

| Issue                                     | Fix                                              | Priority |
| ----------------------------------------- | ------------------------------------------------ | -------- |
| `badge` prop not normalised               | Map "tag"/"chip"/"label" → "badge"               | P3       |
| `marqueeSpeed` units not validated         | Clamp to 10–120 (seconds), default 30            | P3       |
| No alt text fallback for logos             | Generate from filename if missing                 | P2       |
| `variant` "carousel" → "marquee" mapping  | Registry says "carousel", consider normalising    | P3       |

### 13.5 ComparisonTable Alignment

#### 4 Field Name Mismatches (All Breaking)

| #  | Location    | Registry Name  | Render Name    | Impact                           | Fix                        |
| -- | ----------- | -------------- | -------------- | -------------------------------- | -------------------------- |
| 1  | column item | `highlighted`  | `highlight`    | "Most Popular" never activates   | Rename render → `highlighted` |
| 2  | column item | `priceNote`    | `priceSubtext` | Price footnote never renders     | Rename render → `priceNote`   |
| 3  | row item    | `description`  | `tooltip`      | Row tooltips never appear        | Rename render → `description` |
| 4  | row item    | `category`     | `group`        | Row grouping never works         | Rename render → `category`    |

> These 4 fixes are trivial — rename the destructured prop names in the render function. No logic changes needed.

#### Normalizer Required

```
ComparisonTable normalizer in transformPropsForStudio():
  - columns array:
    - Map "highlight"/"isHighlighted"/"featured" → "highlighted"
    - Map "priceSubtext"/"priceCaption"/"priceDetail" → "priceNote"
    - Map "cta"/"ctaText"/"action" → "buttonText"
    - Map "ctaUrl"/"ctaLink"/"actionUrl" → "buttonLink"
  - rows array:
    - Map "tooltip"/"hint"/"help" → "description"
    - Map "group"/"section"/"groupName" → "category"
    - Ensure "values" array length matches columns count (pad with null)
  - Global:
    - Default variant → "default" if unrecognised
    - Validate stickyHeader/stickyColumn are boolean
```

### 13.6 Alignment Summary

| Component       | Field Fixes | Variant Fixes | Normalizer Needed | Effort  |
| --------------- | ----------- | ------------- | ----------------- | ------- |
| AnnouncementBar | 4 renames   | Merge sets    | ✅ Write new      | Medium  |
| SocialProof     | Full rewrite| Full rewrite  | ✅ Write new      | Large   |
| TrustBadges     | 4 additions | 5 additions   | ✅ Enhance L2161  | Medium  |
| LogoCloud       | 0           | 0             | ✅ Minor L2082    | Small   |
| ComparisonTable | 4 renames   | 0             | ✅ Write new      | Medium  |

---

## Section 14 — Implementation Phases

### Phase 1: Critical Fixes (P0 — Do First)

> **Goal:** Stop silent data loss. Every prop the AI sets must reach the render function.

| Task                                              | Component       | Files Changed          | Estimated Lines |
| ------------------------------------------------- | --------------- | ---------------------- | --------------- |
| Rename `dismissible` → `closable` in render       | AnnouncementBar | renders.tsx            | ~3              |
| Rename `text` → `message`, `link` → `linkUrl`     | AnnouncementBar | renders.tsx            | ~5              |
| Rename `highlight` → `highlighted` etc. (4 props)  | ComparisonTable | renders.tsx            | ~8              |
| Add `mode` prop + count display to SocialProof    | SocialProof     | renders.tsx            | ~80             |
| Add missing registry fields to SocialProof        | SocialProof     | core-components.ts     | ~30             |

**Validation:** After Phase 1, each component's render function props match its registry field names.

### Phase 2: Normalizers (P1 — Safety Net)

> **Goal:** AI-generated content is normalised before storage. Misspelled, aliases, and variant prop names are corrected.

| Task                                              | Component       | Files Changed          | Estimated Lines |
| ------------------------------------------------- | --------------- | ---------------------- | --------------- |
| Write AnnouncementBar normalizer                   | AnnouncementBar | converter.ts           | ~35             |
| Write SocialProof normalizer                       | SocialProof     | converter.ts           | ~45             |
| Write ComparisonTable normalizer                   | ComparisonTable | converter.ts           | ~50             |
| Enhance TrustBadges normalizer                     | TrustBadges     | converter.ts           | ~15             |
| Minor LogoCloud normalizer improvements             | LogoCloud       | converter.ts           | ~10             |

**Validation:** After Phase 2, AI can generate any reasonable prop name variant and it maps correctly.

### Phase 3: Render Enrichment (P1 — Feature Parity)

> **Goal:** Render functions support ALL registered variants and features.

| Task                                              | Component       | Files Changed          | Estimated Lines |
| ------------------------------------------------- | --------------- | ---------------------- | --------------- |
| Add glass/outlined/minimal/animated variants       | AnnouncementBar | renders.tsx            | ~60             |
| Add countdown display                              | AnnouncementBar | renders.tsx            | ~40             |
| Add marquee scrolling mode                         | AnnouncementBar | renders.tsx            | ~30             |
| Expand badge item fields (icon, text, description) | TrustBadges     | renders.tsx            | ~40             |
| Add cards/pills/icons-only/minimal/stacked variants| TrustBadges     | renders.tsx            | ~80             |
| Add inline/stacked/card/floating/banner variants   | SocialProof     | renders.tsx            | ~60             |

**Validation:** Every registry variant renders a visually distinct output.

### Phase 4: Metadata & AI Enhancement (P2)

> **Goal:** AI Designer places marketing components intelligently.

| Task                                              | Component       | Files Changed              | Estimated Lines |
| ------------------------------------------------- | --------------- | -------------------------- | --------------- |
| Add `usageGuidelines` to SocialProof               | SocialProof     | component-metadata.ts      | ~3              |
| Add `suggestedWith` relationships for all 5        | All             | component-metadata.ts      | ~15             |
| Expand keywords (8+ per component)                 | All             | component-metadata.ts      | ~10             |
| Add `suggestedPlacement` hints                     | All             | component-metadata.ts      | ~10             |

**Suggested `suggestedWith` relationships:**
```
AnnouncementBar → [ ] (standalone, always at top of page)
SocialProof     → ["CTA", "Hero", "Pricing"]
TrustBadges     → ["CTA", "Footer", "Checkout", "ContactForm"]
LogoCloud       → ["Hero", "SocialProof", "CTA"]
ComparisonTable → ["Pricing", "CTA", "FAQ"]
```

### Phase 5: Dark Mode & Accessibility (P2)

> **Goal:** All 5 components pass WCAG AA contrast in both light and dark modes.

| Task                                               | Component       | Files Changed          |
| -------------------------------------------------- | --------------- | ---------------------- |
| Add `isDarkBackground()` to SocialProof             | SocialProof     | renders.tsx            |
| Add `isDarkBackground()` to ComparisonTable         | ComparisonTable | renders.tsx            |
| Add `isDarkBackground()` to TrustBadges             | TrustBadges     | renders.tsx            |
| Add `aria-label` to AnnouncementBar close button    | AnnouncementBar | renders.tsx            |
| Add `role="table"` to ComparisonTable               | ComparisonTable | renders.tsx            |
| Add `role="img"` to star SVGs in SocialProof        | SocialProof     | renders.tsx            |
| Add keyboard navigation for dismiss/close actions   | AnnouncementBar | renders.tsx            |

---

## Section 15 — Testing & Quality Gates

### 15.1 TypeScript Compilation

After EVERY change to any of the 4 source files:
```bash
cd next-platform-dashboard && npx tsc --noEmit
```
Zero new errors. If the baseline has existing errors, ensure the count does NOT increase.

### 15.2 Visual Testing Matrix

Test each component with these configurations:

#### AnnouncementBar
| Test Case                  | Props                                               | Expected                              |
| -------------------------- | --------------------------------------------------- | ------------------------------------- |
| Default banner             | `message: "Sale ends today!"`                        | Blue bar, white text                  |
| Gradient variant           | `variant: "gradient", backgroundGradient: "..."`     | Gradient background                   |
| With link                  | `message: "...", linkText: "Shop now", linkUrl: "#"` | Text + underlined link                |
| Dismissible                | `closable: true`                                     | X button visible, removes bar on click|
| Sticky                     | `sticky: true`                                       | Stays fixed at top on scroll          |
| Dark background            | `backgroundColor: "#1a1a1a"`                         | Auto light text via isDarkBackground()|

#### SocialProof
| Test Case                  | Props                                               | Expected                              |
| -------------------------- | --------------------------------------------------- | ------------------------------------- |
| Count mode                 | `mode: "count", count: 1500, countSuffix: "+"…`     | "1,500+ customers trust us" + avatars |
| Rating mode                | `mode: "rating", rating: 4.8, reviewCount: 2000`    | Stars + score + review count          |
| With platform              | `mode: "rating", platform: "Trustpilot"`             | Platform logo + branded colours       |
| Schema enabled             | `enableSchema: true, rating: 4.8`                    | JSON-LD script tag in head            |
| Compact variant            | `variant: "compact"`                                 | Single-line inline display            |

#### TrustBadges
| Test Case                  | Props                                               | Expected                              |
| -------------------------- | --------------------------------------------------- | ------------------------------------- |
| Image badges               | `badges: [{image: "ssl.png", alt: "SSL"}]`           | Badge images in grid                  |
| Icon+text badges           | `badges: [{icon: "🛡️", text: "Secure"}]`            | Emoji + label                         |
| Grid layout                | `layout: "grid", columns: 4`                         | 4-column grid                         |
| Grayscale                  | `grayscale: true`                                    | Greyed badges, colour on hover        |
| Row layout                 | `layout: "row"`                                      | Horizontal flex                       |

#### LogoCloud
| Test Case                  | Props                                               | Expected                              |
| -------------------------- | --------------------------------------------------- | ------------------------------------- |
| Simple grid                | `variant: "simple", columns: 4`                      | Logo grid, no cards                   |
| Cards variant              | `variant: "cards"`                                   | Each logo in a card                   |
| Marquee                    | `variant: "marquee", marqueeSpeed: 30`               | Infinite scrolling logos              |
| Marquee pause              | Hover over marquee                                   | Animation pauses                      |
| Grayscale + hover colour   | `grayscale: true, hoverColor: true`                  | Grey logos, colour on hover           |
| With badge                 | `badge: "Trusted by 500+ companies"`                 | Badge pill above title                |

#### ComparisonTable
| Test Case                  | Props                                               | Expected                              |
| -------------------------- | --------------------------------------------------- | ------------------------------------- |
| Simple table               | `variant: "simple", columns: [...], rows: [...]`     | Basic table                           |
| Highlighted column         | `columns: [{highlighted: true, ...}]`                | Column has highlight background       |
| Row grouping               | `rows: [{category: "Security", ...}]`                | Group header row spanning all columns |
| Sticky header              | `stickyHeader: true`                                 | Header stays fixed on scroll          |
| Boolean values             | `rows: [{values: [true, false, true]}]`              | ✓ check / ✗ cross SVG icons          |
| Mobile stack               | Viewport < 768px                                     | Table → card stack layout             |
| Striped variant            | `variant: "striped"`                                 | Alternating row backgrounds           |

### 15.3 Converter Testing

For each normalizer, test with intentionally malformed AI output:

```typescript
// AnnouncementBar — AI sends "text" instead of "message"
transformPropsForStudio("AnnouncementBar", {
  text: "Big Sale!",
  url: "/shop",
  dismissible: true,  // Should map to "closable"
  style: "gradient"   // Should map to "variant"
});
// Expected: { message: "Big Sale!", linkUrl: "/shop", closable: true, variant: "gradient" }

// SocialProof — AI sends rating data
transformPropsForStudio("SocialProof", {
  stars: 4.5,
  reviews: 1000,
  source: "Google"
});
// Expected: { mode: "rating", rating: 4.5, reviewCount: 1000, platform: "Google" }

// ComparisonTable — AI sends mismatched column fields
transformPropsForStudio("ComparisonTable", {
  columns: [{ name: "Basic", highlight: true, priceSubtext: "/mo" }],
  rows: [{ label: "SSL", tooltip: "Included", group: "Security" }]
});
// Expected: columns[0].highlighted = true, columns[0].priceNote = "/mo"
//           rows[0].description = "Included", rows[0].category = "Security"
```

### 15.4 Regression Checklist

After completing each phase, verify ALL previously working features still function:

```
□ LogoCloud marquee still animates and pauses on hover
□ LogoCloud __convertedToFeatures fallback still works when no valid images
□ TrustBadges normalizer still separates emojis from image URLs
□ TrustBadges default shield 🛡️ still applies when no icon/image
□ SocialProof Schema.org JSON-LD still renders valid structured data
□ ComparisonTable sticky header/column still works
□ ComparisonTable mobile stack layout still activates below breakpoint
□ AnnouncementBar gradient variant still renders
□ AnnouncementBar isDarkBackground() auto-colour still works
□ All 5 components still render with zero props (defaultProps coverage)
```

---

## Section 16 — CRITICAL FOR AI AGENT — Implementation Guard Rails

> **Read this section before touching ANY code.** These rules prevent the most common mistakes.

### 16.1 Golden Rules

1. **NEVER add `"use client"` to renders.tsx.** All 5 marketing components are Pattern A (Static HTML). They must remain SSR-safe. If you need client state (e.g., countdown timer, dismiss persistence), create a SEPARATE client component and import it.

2. **NEVER use Tailwind colour classes.** All colours go through `style={{}}`. This is because Tailwind purges dynamic class names at build time. `bg-${colour}-600` will NEVER work.

3. **ALWAYS use `isDarkBackground()` for auto dark/light text.** Import from the same file. Pattern:
   ```tsx
   const dark = isDarkBackground(backgroundColor);
   const textColour = textColor || (dark ? "#ffffff" : "#1f2937");
   ```

4. **ALWAYS match render props to registry field names.** There is NO mapping layer. If registry says `closable`, render MUST destructure `closable`. Not `dismissible`. Not `canClose`. Not `showCloseButton`.

5. **ALWAYS add a normalizer when creating/modifying a component.** The normalizer in `transformPropsForStudio()` is the ONLY safety net between AI-generated content and the render function.

6. **NEVER modify the `componentRegistry.get()` dispatch in renderer.tsx.** Components register themselves via `defineComponent()`. The renderer is generic.

7. **ALWAYS test with `npx tsc --noEmit` after EVERY file save.** Marketing components interact with shared types. A rename in one component can break type checks across the file.

### 16.2 File-Specific Rules

#### renders.tsx Rules
```
DO:
  ✅ Destructure props with defaults: { message = "", variant = "default", ...props }
  ✅ Use fallback chains: const bg = backgroundColor || "#3b82f6";
  ✅ Use computed classes: const classes = `base-class ${variant === "x" ? "x-class" : ""}`;
  ✅ Use style={{}} for ALL colour values
  ✅ Export functions with the EXACT name: export function AnnouncementBarRender(...)

DON'T:
  ❌ Import React hooks (useState, useEffect) in marketing components
  ❌ Use template literal Tailwind classes: `bg-${color}-500` 
  ❌ Access window/document (SSR will break)
  ❌ Use dangerouslySetInnerHTML for user content (only for Schema.org JSON-LD)
```

#### core-components.ts Rules
```
DO:
  ✅ Use defineComponent() with type, label, category, fields, fieldGroups, defaultProps, ai
  ✅ Keep category: "marketing" for all 5 components
  ✅ Ensure every field in defaultProps exists in fields[]
  ✅ Ensure every field in ai.canModify exists in fields[]
  ✅ Group related fields in fieldGroups

DON'T:
  ❌ Add fields that the render function doesn't consume
  ❌ Use field names that don't match render prop names
  ❌ Remove existing fields that may have stored data in Supabase
```

#### converter.ts Rules
```
DO:
  ✅ Add typeMap aliases for common AI-generated type names
  ✅ Add component type to KNOWN_REGISTRY_TYPES set
  ✅ Write normalizer in transformPropsForStudio() switch/case
  ✅ Handle both snake_case and camelCase prop names from AI
  ✅ Validate array structures (badges[], logos[], columns[], rows[])
  ✅ Return {...props} spread at the end to preserve unknown props

DON'T:
  ❌ Throw errors in normalizers (silently fix instead)
  ❌ Delete props you don't recognise (spread them through)
  ❌ Assume AI sends correct types (always coerce/validate)
```

### 16.3 Component-Specific Guard Rails

#### AnnouncementBar
- The dismiss button has NO state management. Currently it just renders a close icon. To make it functional, you need either: (a) a client component wrapper with `useState`, or (b) CSS-only `:target` or `<details>` hack.
- The `isDarkBackground()` call determines white vs dark text. Don't override with hardcoded colours.
- Gradient backgrounds use `buildGradientCSS()` — don't manually write `linear-gradient()`.

#### SocialProof
- The Schema.org JSON-LD uses `dangerouslySetInnerHTML`. This is intentional and correct for `<script type="application/ld+json">`. Do NOT refactor this to use React props.
- Star rendering uses half-star SVG clipping. Test with values like 4.3, 4.5, 4.7 to ensure partial stars render correctly.
- The `platform` prop expects known platform names. Unknown platforms should render without a logo (not crash).

#### TrustBadges
- Two implementations exist: (1) `TrustBadgesElement` nested inside CTA render at ~L9144, and (2) standalone `TrustBadgesRender` at L24498. Only modify the standalone version. The CTA-embedded version is a simplified inline display.
- The normalizer separates emojis from image URLs. An emoji like 🛡️ → `icon` field. A URL like `https://example.com/badge.svg` → `image` field. Don't break this logic.

#### LogoCloud
- The `__convertedToFeatures` fallback is the ONLY fail-safe in the entire marketing component set. If AI sends text items instead of logo URLs, the normalizer converts the component to `Features` type. Do NOT remove this.
- `marqueeSpeed` is in seconds for one full loop. Lower = faster. Validate range 10–120.
- `pauseOnHover` uses CSS `animation-play-state: paused` on hover. This is pure CSS, no JS.

#### ComparisonTable
- The table uses `<table>` semantic HTML, not CSS grid. This is correct for accessibility — screen readers understand table structure.
- Boolean cell values render as SVG check/cross icons. The `checkColor` and `crossColor` props control their colours via `style={{}}`.
- Row grouping uses `colspan` spanning all columns. The group header text comes from the `category` field (not `group` — this is one of the 4 renames needed).
- Mobile stack layout (`mobileLayout: "stack"`) switches from `<table>` to stacked `<div>` cards below a breakpoint. Both views must render the same data.

### 16.4 Implementation Order

```
MUST DO FIRST (before any feature work):
1. Rename the 4 ComparisonTable props (highlight→highlighted, etc.)
2. Rename the 4 AnnouncementBar props (dismissible→closable, etc.)
3. Add mode prop to SocialProof for count+rating dual mode

THEN (safety net):
4. Write AnnouncementBar normalizer
5. Write SocialProof normalizer  
6. Write ComparisonTable normalizer
7. Enhance TrustBadges normalizer

THEN (feature parity):
8. Add missing AnnouncementBar variants (glass, outlined, minimal, animated)
9. Add missing TrustBadges variants (cards, pills, icons-only, etc.)
10. Add missing SocialProof variants (inline, stacked, card, etc.)
11. Add countdown display to AnnouncementBar
12. Expand TrustBadges badge item rendering (icon + text + description)

FINALLY (polish):
13. Add usageGuidelines to SocialProof metadata
14. Add suggestedWith to all 5 metadata entries
15. Expand keywords to 8+ per component
16. Dark mode audit — isDarkBackground() in all 5
17. Accessibility audit — roles, aria-labels, keyboard nav
```

### 16.5 What NOT to Change

These work correctly and must NOT be modified:

- LogoCloud normalizer L2082–L2159 (it's comprehensive, just minor additions)
- LogoCloud `__convertedToFeatures` fallback pattern
- TrustBadges normalizer L2161–L2193 (emoji/URL separation logic)
- SocialProof Schema.org JSON-LD rendering pattern
- ComparisonTable `<table>` semantic structure
- ComparisonTable mobile stack detection logic
- AnnouncementBar `isDarkBackground()` colour resolution
- All `typeMap` aliases (only ADD new ones, never remove/rename)
- All `KNOWN_REGISTRY_TYPES` entries (only ADD, never remove)

---

*End of MARKETING COMPONENTS MASTER PLAN v1.0 — March 2026*

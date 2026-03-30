# DRAMAC CMS — Typography Components Master Plan

## Executive Vision

Transform DRAMAC's typography system from a set of 4 basic text renderers into a **world-class typographic engine** capable of producing websites with the typographic sophistication of Stripe, Apple, Linear, and Awwwards winners — all controlled by the AI Designer with **zero human adjustment**.

Typography is the **single most impactful design element** on any website. 95% of web content is text. If typography is perfect — the hierarchy is clear, the rhythm is consistent, the fonts are well-paired, the sizes flow naturally — the entire site feels professional. If typography is wrong, no amount of imagery or animation can save it. This plan treats typography as the highest-leverage component category in the entire system.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Industry Benchmark Analysis](#2-industry-benchmark-analysis)
3. [Architecture Principles](#3-architecture-principles)
4. [Component-by-Component Overhaul](#4-component-by-component-overhaul)
5. [New Typography Components](#5-new-typography-components)
6. [Type Scale & Rhythm System](#6-type-scale--rhythm-system)
7. [Font Management System](#7-font-management-system)
8. [Fluid Typography System](#8-fluid-typography-system)
9. [OpenType & Advanced Features](#9-opentype--advanced-features)
10. [Responsive Typography Strategy](#10-responsive-typography-strategy)
11. [Dark Mode Typography Adaptation](#11-dark-mode-typography-adaptation)
12. [AI Designer Integration](#12-ai-designer-integration)
13. [Registry & Registration Requirements](#13-registry--registration-requirements)
14. [Accessibility & WCAG Compliance](#14-accessibility--wcag-compliance)
15. [Performance & Font Loading](#15-performance--font-loading)
16. [Implementation Phases](#16-implementation-phases)
17. [Testing & Quality Gates](#17-testing--quality-gates)

---

## 1. Current State Audit

### Existing Typography Components (4 total)

| Component    | Location                     | Lines      | Quality    | Key Issues                                                                                                                                                                                                                                                       |
| ------------ | ---------------------------- | ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Heading**  | `renders.tsx` HeadingRender  | L3101–3210 | ⚠️ Limited | No `fontFamily`, `fontSize`, `letterSpacing`, `lineHeight` overrides. Locked to level-based scale. No `textShadow`. Gradient only left-to-right. Leading hardcoded to `leading-tight`.                                                                           |
| **Text**     | `renders.tsx` TextRender     | L3212–3492 | ✅ Decent  | Most complete of the four. Has `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textTransform`, `textDecoration`, `textShadow`. Supports `htmlTag` override (p/h1-h6/span/div).                                                           |
| **RichText** | `renders.tsx` RichTextRender | L3494–3695 | ⚠️ Basic   | Section-level component with title/subtitle/pullQuote. Hardcoded fallback `#1c2b2a` for text color. Basic `markdownToHtml` converter (bold, italic, bullets only — no links, headings, code, images). 5 props exist in render but NOT in registry.               |
| **Quote**    | `renders.tsx` QuoteRender    | L3697–3860 | 🔴 Broken  | `modern` variant listed in type but NOT implemented (falls through to `simple`). Registry uses `style` but render uses `variant`. Registry uses `source` but render uses `authorTitle`. 5 render props not exposed in registry. Hardcoded `textColor="#374151"`. |

### Registry vs Render Mismatches (Critical)

These mismatches mean the Studio editor shows fields that don't work, or hides fields that exist:

| Component | Registry Field | Render Prop                                                                             | Status                                        |
| --------- | -------------- | --------------------------------------------------------------------------------------- | --------------------------------------------- |
| Heading   | `alignment`    | `align`                                                                                 | 🔴 Name mismatch — may fail silently          |
| Heading   | —              | `fontWeight`                                                                            | 🔴 Not in registry — users can't set weight   |
| Heading   | —              | `uppercase`                                                                             | 🔴 Not in registry                            |
| Heading   | —              | `gradient`, `gradientFrom`, `gradientTo`                                                | 🔴 Not in registry                            |
| Heading   | —              | `marginBottom`                                                                          | 🔴 Not in registry                            |
| Quote     | `style`        | `variant`                                                                               | 🔴 Name mismatch — value never reaches render |
| Quote     | `source`       | `authorTitle`                                                                           | 🔴 Name mismatch                              |
| Quote     | —              | `size`, `textColor`, `backgroundColor`, `borderColor`, `authorImage`                    | 🔴 Not in registry                            |
| RichText  | —              | `proseSize`, `subtitleColor`, `pullQuoteColor`, `highlightColor`, `cardBackgroundColor` | 🔴 Not in registry                            |

### Hardcoded Values (Must Be Theme-Aware)

| Component            | Value                                                           | Issue                                                      |
| -------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| RichText             | `textColor` fallback `#1c2b2a`                                  | Hard dark green — breaks on dark backgrounds               |
| Quote                | `textColor` default `"#374151"`                                 | Hard gray-700 — invisible on dark backgrounds              |
| Quote `card` variant | `backgroundColor: "#ffffff"`                                    | Hard white — breaks in dark mode                           |
| RichText title       | `text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4` | Hardcoded sizes — not configurable                         |
| RichText subtitle    | `opacity: 0.85`                                                 | Hardcoded opacity — not configurable                       |
| HeadingRender        | `leading-tight` on all levels                                   | Same line-height for h1 and h6 — wrong for body-sized text |

### Font System Gaps

| System               | Current State                                 | Gap                                                                                               |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Google Fonts loading | Loads weights `300;400;500;600;700` only      | Fonts with weight 100, 200, 800, 900 won't render correctly                                       |
| Font injection       | `injectBrandFonts()` fills unset props only   | No per-component font override in Studio UI for Headings                                          |
| CSS variables        | `--font-sans` and `--font-display` generated  | No `--font-mono`, no `--font-accent`, no per-level heading vars                                   |
| Type scale           | `typography-intelligence.ts` generates scales | Scale is computed but NEVER injected as CSS variables — components use hardcoded Tailwind classes |
| Font pairings        | 8 curated pairings exist                      | Pairings are used for AI generation but NOT surfaced to users in the Studio editor                |
| Variable fonts       | Not supported                                 | All fonts loaded as static. No `font-variation-settings`, no axis control                         |

### AI Designer Integration Gaps

| Area                    | Current                                                          | Gap                                                                                         |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Typography intelligence | `typography-intelligence.ts` has full type scale generation      | Scale is GENERATED but never APPLIED — components use hardcoded Tailwind class maps instead |
| Font pairing selection  | AI picks pairings by industry/mood                               | Pairing only sets `font_heading`/`font_body` in site settings — no per-section font control |
| Heading level rules     | Component metadata says "Use H1 for page title, H2 for sections" | No enforcement — AI can generate multiple H1s, skip levels, or use wrong hierarchy          |
| Text styling rules      | No AI rules for body text                                        | AI has no guidance on font size, line height, or max-width for readability                  |
| RichText usage          | No AI rules                                                      | AI doesn't know when to use RichText vs Heading+Text combinations                           |

---

## 2. Industry Benchmark Analysis

### What World-Class Platforms Offer

| Feature                  | Webflow           | Framer           | Squarespace         | Wix Studio      | **DRAMAC (Current)**      | **DRAMAC (Target)**            |
| ------------------------ | ----------------- | ---------------- | ------------------- | --------------- | ------------------------- | ------------------------------ |
| Type scale system        | ✅ Full           | ✅ Fluid         | ✅ Preset scales    | ✅ CSS var      | 🔴 Hardcoded Tailwind     | ✅ Fluid + configurable        |
| Fluid typography (clamp) | ✅ Native         | ✅ Native        | ❌ Breakpoints      | ✅ Via code     | 🔴 Breakpoints only       | ✅ Auto-generated clamp()      |
| Variable font support    | ✅ Full axis      | ✅ Full axis     | ❌ Static only      | ✅ Limited      | 🔴 Not supported          | ✅ Full axis control           |
| OpenType features        | ✅ UI toggle      | ❌ Manual        | ❌ None             | ❌ None         | 🔴 None                   | ✅ Ligatures, numerics, caps   |
| Font pairing presets     | ✅ Marketplace    | ✅ Built-in      | ✅ Curated          | ✅ Curated      | ⚠️ AI-only (not in UI)    | ✅ UI + AI unified             |
| Vertical rhythm          | ✅ Spacing system | ✅ Auto          | ⚠️ Approximate      | ⚠️ Approximate  | 🔴 None                   | ✅ Rhythm-based spacing        |
| Text balance/pretty      | ❌ Manual         | ✅ Auto          | ❌ None             | ❌ None         | 🔴 None                   | ✅ Auto by element type        |
| Drop caps                | ✅ CSS class      | ✅ Component     | ✅ Toggle           | ❌ None         | 🔴 None                   | ✅ Component                   |
| Multi-column text        | ✅ CSS columns    | ❌ Manual        | ❌ None             | ❌ None         | 🔴 None                   | ✅ RichText option             |
| Gradient text            | ✅ Full control   | ✅ Full control  | ❌ None             | ✅ Limited      | ⚠️ Heading only, L→R only | ✅ All text, any direction     |
| Text animation           | ✅ Interactions   | ✅ Built-in      | ⚠️ Basic            | ✅ Full         | 🔴 None                   | ✅ Typewriter, split, reveal   |
| Responsive font sizing   | ✅ Per-breakpoint | ✅ Fluid         | ✅ Per-breakpoint   | ✅ Fluid        | ⚠️ Level-based only       | ✅ Fluid + per-breakpoint      |
| WCAG compliance tools    | ⚠️ Third-party    | ⚠️ Plugin        | ✅ Built-in checker | ⚠️ Warning only | 🔴 None                   | ✅ Contrast checker, min sizes |
| Custom font upload       | ✅ WOFF2          | ✅ OTF/TTF/WOFF2 | ❌ Preset only      | ✅ Full         | 🔴 Google Fonts only      | ✅ Upload + Google + system    |
| `text-box-trim`          | ❌ Not yet        | ❌ Not yet       | ❌ Not yet          | ❌ Not yet      | 🔴 Not yet                | ✅ Progressive enhancement     |

### Key Insight: The Gap Between AI Intelligence and Component Capability

DRAMAC has a sophisticated `typography-intelligence.ts` module that generates type scales with mathematical ratios, auto line-heights, auto letter-spacing, and industry-specific font pairings. But **none of this intelligence flows through to the actual components**:

```
typography-intelligence.ts   →   generates { xs: "0.694rem", base: "1rem", xl: "1.44rem", ... }
                                           ↓
                            ❌ NOT INJECTED as CSS variables
                            ❌ NOT USED by HeadingRender (uses hardcoded Tailwind classes)
                            ❌ NOT USED by TextRender (uses static fontSizeMap)
```

**The fix:** The type scale must become the **single source of truth** — generated once, injected as CSS custom properties, and consumed by every typography component via `var(--type-*)` references.

---

## 3. Architecture Principles

### 3.1 Single Source of Truth: CSS Custom Properties

Every typographic value flows through a CSS variable hierarchy:

```
Site Settings (font_heading, font_body, type_scale_ratio)
        ↓
typography-intelligence.ts (generateTypeScale, getFontPairing)
        ↓
generateTypographyCSSVars() → {
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --type-xs: clamp(0.694rem, 0.66rem + 0.17vw, 0.8rem);
  --type-sm: clamp(0.833rem, 0.78rem + 0.26vw, 1rem);
  --type-base: clamp(1rem, 0.93rem + 0.36vw, 1.25rem);
  --type-lg: clamp(1.2rem, 1.09rem + 0.53vw, 1.563rem);
  --type-xl: clamp(1.44rem, 1.28rem + 0.78vw, 1.953rem);
  --type-2xl: clamp(1.728rem, 1.5rem + 1.14vw, 2.441rem);
  --type-3xl: clamp(2.074rem, 1.75rem + 1.62vw, 3.052rem);
  --type-4xl: clamp(2.488rem, 2.03rem + 2.29vw, 3.815rem);
  --type-5xl: clamp(2.986rem, 2.35rem + 3.18vw, 4.768rem);
  --leading-tight: 1.15;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --rhythm: calc(var(--type-base) * var(--leading-normal));
}
        ↓
StudioRenderer injects <style> with these variables on .studio-renderer
        ↓
Components consume: font-size: var(--type-xl);
```

### 3.2 Composition Over Inheritance

Typography components are composable primitives, not monolithic blocks:

```
Heading     — Semantic heading (h1-h6) with level-appropriate defaults
Text        — Body text with full typographic control
RichText    — Prose content block with title/body/pullquote (composes Heading + Text internally)
Quote       — Blockquote with attribution and variants
Label       — NEW: Small-text utility (captions, badges, meta text)
List        — NEW: Semantic ordered/unordered list with typographic control
CodeBlock   — NEW: Syntax-highlighted code with copy button
```

### 3.3 Smart Defaults, Full Override

Every component has intelligent defaults that produce good typography with zero configuration, but every value can be overridden:

```typescript
// HeadingRender — smart defaults by level
level: 1 → fontSize: var(--type-5xl), lineHeight: var(--leading-tight), fontWeight: 700
level: 2 → fontSize: var(--type-3xl), lineHeight: var(--leading-tight), fontWeight: 700
level: 3 → fontSize: var(--type-2xl), lineHeight: var(--leading-snug), fontWeight: 600
level: 4 → fontSize: var(--type-xl),  lineHeight: var(--leading-snug), fontWeight: 600
level: 5 → fontSize: var(--type-lg),  lineHeight: var(--leading-normal), fontWeight: 500
level: 6 → fontSize: var(--type-base), lineHeight: var(--leading-normal), fontWeight: 500

// But ALL can be overridden:
<HeadingRender level={2} fontSize="var(--type-4xl)" lineHeight="1.1" fontWeight="300" />
```

### 3.4 Theme-Aware, Never Hardcoded

No typography component ever hardcodes a color, font, or size:

```typescript
// ❌ WRONG — breaks on dark backgrounds, ignores brand fonts
<h2 className="text-3xl font-bold" style={{ color: "#374151" }}>

// ✅ RIGHT — adapts to theme, brand, and dark mode
<h2 className="font-bold text-foreground" style={{ fontSize: "var(--type-3xl)", fontFamily: "var(--font-heading)" }}>
```

### 3.5 Fluid-First, Breakpoint-Optional

All font sizes use CSS `clamp()` by default for continuous scaling. Breakpoint-based sizing is available as an override but is never the default:

```css
/* Default (fluid): smooth scaling from 320px to 1440px */
font-size: clamp(1.728rem, 1.5rem + 1.14vw, 2.441rem);

/* Override (breakpoint): explicit sizes per breakpoint */
font-size: 1.5rem;
@media (min-width: 768px) {
  font-size: 2rem;
}
@media (min-width: 1024px) {
  font-size: 2.5rem;
}
```

### 3.6 Accessibility-by-Default

Typography components enforce WCAG compliance automatically:

- Body text never renders below 16px (1rem)
- Line height defaults to 1.5 for body text, 1.15-1.3 for headings
- Maximum line width defaults to `max-w-prose` (65ch) for body text
- Color contrast is validated at render time when both text and background colors are known
- `text-wrap: balance` applied automatically to headings (≤6 lines)
- `text-wrap: pretty` applied automatically to body paragraphs
- `lang` attribute required for hyphenation support

### 3.7 Performance Budget

- Maximum 2 font families loaded per page (heading + body)
- Maximum 4 font weights loaded per family
- All fonts loaded via `font-display: swap` with metric-matched fallbacks
- Variable fonts preferred when available (single file replaces multiple weights)
- Total font payload target: < 100KB (WOFF2 compressed)
- CLS from font loading: < 0.05 (via `size-adjust` fallbacks)

---

## 4. Component-by-Component Overhaul

### 4.1 HeadingRender — Complete Upgrade

**Current location:** `src/lib/studio/blocks/renders.tsx` lines 3101–3210

#### 4.1.1 Current Props (HeadingProps)

```typescript
interface HeadingProps {
  text: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
  align?: "left" | "center" | "right";
  fontWeight?:
    | "light"
    | "normal"
    | "medium"
    | "semibold"
    | "bold"
    | "extrabold";
  uppercase?: boolean;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  marginBottom?: "none" | "small" | "medium" | "large";
  id?: string;
  className?: string;
}
```

#### 4.1.2 Current Behavior

| Feature            | Implementation                                                       | Issue                                      |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------ |
| Font size          | Hardcoded per level: `{ 1: "text-4xl md:text-5xl lg:text-6xl" ... }` | Not connected to type scale system         |
| Line height        | `leading-tight` for all levels                                       | Wrong for h5/h6 which are body-sized       |
| Font family        | None — inherits from parent                                          | No way to use heading font via Studio      |
| Letter spacing     | None                                                                 | Large headings need negative tracking      |
| Gradient direction | Always `bg-gradient-to-r`                                            | Only left-to-right — no angle control      |
| Weight             | String map `"bold" → "font-bold"`                                    | Doesn't support numeric weights (100-900)  |
| Registry           | Only 4 fields: `text`, `level`, `alignment`, `color`                 | 9 functional props are INVISIBLE in Studio |

#### 4.1.3 Target Props (HeadingPropsV2)

```typescript
interface HeadingProps {
  // Content
  text: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
  className?: string;

  // Typography
  fontFamily?: string; // NEW — "inherit" | "heading" | "body" | specific font name
  fontSize?: string; // NEW — "auto" (from type scale) | CSS value | scale token (xs-9xl)
  fontWeight?: number | string; // CHANGED — numeric 100-900 or string name
  lineHeight?: string; // NEW — "auto" (level-appropriate) | number | CSS value
  letterSpacing?: string; // NEW — "auto" (level-appropriate) | CSS value
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"; // CHANGED — was boolean `uppercase`
  fontStyle?: "normal" | "italic"; // NEW

  // Visual
  color?: string;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl"; // NEW
  textShadow?: string; // NEW
  textDecoration?: "none" | "underline" | "line-through"; // NEW
  textDecorationColor?: string; // NEW
  textDecorationStyle?: "solid" | "wavy" | "dotted" | "dashed"; // NEW

  // Layout
  align?: "left" | "center" | "right";
  marginBottom?: "none" | "small" | "medium" | "large" | "xlarge"; // ADDED xlarge
  maxWidth?: string; // NEW — "none" | "sm" | "md" | "lg" | "xl" | "prose" | CSS value
  textWrap?: "auto" | "balance" | "pretty" | "nowrap"; // NEW — defaults to "balance"
}
```

#### 4.1.4 Smart Defaults by Level

```typescript
const HEADING_DEFAULTS: Record<number, Partial<HeadingProps>> = {
  1: {
    fontSize: "var(--type-5xl)",
    lineHeight: "var(--leading-tight)", // 1.15
    letterSpacing: "var(--tracking-tight)", // -0.02em
    fontWeight: 700,
    fontFamily: "var(--font-heading)",
    textWrap: "balance",
    marginBottom: "large",
  },
  2: {
    fontSize: "var(--type-3xl)",
    lineHeight: "var(--leading-tight)",
    letterSpacing: "var(--tracking-tight)",
    fontWeight: 700,
    fontFamily: "var(--font-heading)",
    textWrap: "balance",
    marginBottom: "medium",
  },
  3: {
    fontSize: "var(--type-2xl)",
    lineHeight: "var(--leading-snug)", // 1.3
    letterSpacing: "normal",
    fontWeight: 600,
    fontFamily: "var(--font-heading)",
    textWrap: "balance",
    marginBottom: "medium",
  },
  4: {
    fontSize: "var(--type-xl)",
    lineHeight: "var(--leading-snug)",
    letterSpacing: "normal",
    fontWeight: 600,
    fontFamily: "var(--font-heading)",
    textWrap: "balance",
    marginBottom: "small",
  },
  5: {
    fontSize: "var(--type-lg)",
    lineHeight: "var(--leading-normal)", // 1.5
    letterSpacing: "normal",
    fontWeight: 500,
    fontFamily: "var(--font-heading)",
    textWrap: "balance",
    marginBottom: "small",
  },
  6: {
    fontSize: "var(--type-base)",
    lineHeight: "var(--leading-normal)",
    letterSpacing: "var(--tracking-wide)", // 0.025em (small text → wider)
    fontWeight: 500,
    fontFamily: "var(--font-heading)",
    textWrap: "balance",
    marginBottom: "small",
  },
};
```

#### 4.1.5 Gradient System Upgrade

```typescript
// Current: only bg-gradient-to-r
// Target: full directional control + via color support

const gradientStyle = gradient
  ? {
      backgroundImage: `linear-gradient(${directionToDeg(gradientDirection)}, ${gradientFrom || "var(--color-primary)"}, ${gradientVia ? gradientVia + "," : ""} ${gradientTo || "var(--color-accent)"})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }
  : {};
```

#### 4.1.6 Implementation Steps

1. **Add new props** to `HeadingProps` interface — preserve all existing props for backward compatibility
2. **Replace hardcoded size classes** with CSS variable consumption (`var(--type-*)`)
3. **Add `fontFamily`** — default to `var(--font-heading)`, support "inherit", "heading", "body", or specific name
4. **Add `lineHeight`** — use level-appropriate defaults from `HEADING_DEFAULTS`
5. **Add `letterSpacing`** — auto negative tracking for large headings
6. **Upgrade `fontWeight`** — accept numeric 100-900. Map string names to numbers for backward compat
7. **Replace `uppercase` boolean** with `textTransform` enum
8. **Add `gradientDirection`** — map to `linear-gradient()` angle
9. **Add `textShadow`** support
10. **Add `textDecoration`** with color and style control
11. **Add `textWrap: balance`** as default for all headings
12. **Add `maxWidth`** — default "none" for headings
13. **Update registry** to expose ALL props (currently only 4 of 13+ are registered)
14. **Fix `alignment` → `align`** mismatch between registry and render

---

### 4.2 TextRender — Enhancement & Standardization

**Current location:** `src/lib/studio/blocks/renders.tsx` lines 3212–3492

#### 4.2.1 Current Props (TextProps)

```typescript
interface TextProps {
  text: string;
  color?: string;
  align?: string;
  alignment?: string; // Duplicate of `align` — inconsistent
  fontSize?: string; // xs through 8xl via class map
  fontWeight?: string; // "100" through "900" as strings
  lineHeight?: string; // "tight" | "snug" | "normal" | "relaxed" | "loose"
  italic?: boolean;
  underline?: boolean;
  maxWidth?: string;
  marginBottom?: string;
  htmlTag?: string; // p | h1-h6 | span | div
  fontFamily?: string;
  letterSpacing?: string;
  textTransform?: string;
  textDecoration?: string;
  textShadow?: string;
  className?: string;
}
```

#### 4.2.2 What Works Well

TextRender is the **most complete** typography component. It already supports:

- Full font size range (xs through 8xl) via `fontSizeMap`
- Full font weight range (100-900) via `fontWeightMap`
- Line height presets (tight/snug/normal/relaxed/loose)
- Letter spacing presets (tighter/tight/normal/wide/wider/widest)
- Text transform (uppercase/lowercase/capitalize)
- Text decoration (underline/line-through/overline)
- Text shadow support
- Font family override
- HTML tag override (semantic element control)
- Max width constraint

#### 4.2.3 What Needs Improvement

| Issue                          | Current State                                                      | Target                                                      |
| ------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Font sizes hardcoded           | `fontSizeMap` uses Tailwind classes `"text-xs"`, `"text-sm"`, etc. | Use `var(--type-xs)`, `var(--type-sm)` CSS variables        |
| `align`/`alignment` dual props | Both accepted, creates confusion                                   | Standardize to `align`, map `alignment` for backward compat |
| `fontWeight` as string         | `"100"`, `"400"`, etc.                                             | Accept both number and string                               |
| `lineHeight` named only        | `"tight"`, `"normal"` etc.                                         | Also accept numeric values and CSS values                   |
| No `textWrap` support          | Not implemented                                                    | Default `pretty` for body text                              |
| No `hyphens` support           | Not implemented                                                    | Auto-hyphenation for narrow containers                      |
| No `columns` support           | Not implemented                                                    | Multi-column text layout                                    |
| Tag rendering                  | Giant switch statement (p, h1, h2, ..., span, div)                 | Use `as` prop pattern with `createElement`                  |
| Default body font              | Inherits from parent                                               | Explicit `var(--font-body)`                                 |
| No `firstLineIndent`           | Not implemented                                                    | Paragraph first-line indentation                            |
| No `dropCap`                   | Not implemented                                                    | Drop capital for opening paragraphs                         |

#### 4.2.4 Target Props (TextPropsV2)

```typescript
interface TextProps {
  // Content
  text: string;
  htmlTag?:
    | "p"
    | "span"
    | "div"
    | "figcaption"
    | "blockquote"
    | "address"
    | "time"; // EXPANDED
  className?: string;

  // Typography
  fontFamily?: string; // "inherit" | "body" | "heading" | "mono" | specific name
  fontSize?: string; // "auto" | scale token (xs-9xl) | CSS value
  fontWeight?: number | string; // Numeric 100-900 or string name
  lineHeight?: string | number; // Named preset | number | CSS value
  letterSpacing?: string; // Named preset | CSS value
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  fontStyle?: "normal" | "italic"; // RENAMED from `italic` boolean
  fontVariant?: string; // NEW — "normal" | "small-caps" | "all-small-caps" | "petite-caps"

  // Visual
  color?: string;
  textDecoration?: "none" | "underline" | "line-through" | "overline";
  textDecorationColor?: string; // NEW
  textDecorationStyle?: "solid" | "wavy" | "dotted" | "dashed"; // NEW
  textDecorationThickness?: string; // NEW — CSS value
  textUnderlineOffset?: string; // NEW — CSS value
  textShadow?: string;

  // Layout
  align?: "left" | "center" | "right" | "justify"; // ADDED justify
  maxWidth?: string; // "none" | "sm" | "md" | "lg" | "xl" | "prose" | CSS value
  marginBottom?: string;
  textWrap?: "auto" | "balance" | "pretty" | "nowrap" | "stable"; // NEW — default "pretty"
  hyphens?: "none" | "auto" | "manual"; // NEW
  columns?: 1 | 2 | 3 | 4; // NEW — CSS multi-column
  columnGap?: string; // NEW
  textIndent?: string; // NEW — first-line indent

  // Special Effects
  dropCap?: boolean; // NEW — decorative drop capital
  truncate?: boolean | number; // NEW — line-clamp (true = 1 line, number = N lines)
  highlight?: boolean; // NEW — text highlight/mark styling
  highlightColor?: string; // NEW
}
```

#### 4.2.5 Drop Cap Implementation

```typescript
// Drop cap — decorative initial capital letter
const dropCapStyles = dropCap
  ? `
  .drop-cap::first-letter {
    font-size: 3.5em;
    font-weight: 700;
    float: left;
    line-height: 0.8;
    margin-right: 0.1em;
    margin-top: 0.05em;
    font-family: var(--font-heading);
    color: var(--color-primary, currentColor);
  }
`
  : "";
```

#### 4.2.6 Implementation Steps

1. **Connect font sizes to type scale** — Replace `fontSizeMap` Tailwind classes with `var(--type-*)` CSS variables
2. **Standardize `align`** — Keep `align`, map `alignment` to it internally
3. **Accept numeric `fontWeight`** — Support both `400` and `"400"` and `"normal"`
4. **Add `textWrap: pretty`** as default for paragraph text
5. **Add `hyphens` control** — auto-hyphenation for narrow columns
6. **Add `columns` support** — CSS multi-column layout
7. **Add `dropCap`** — first-letter styling via inline `<style>` block
8. **Add `truncate`** — line-clamp support with `-webkit-line-clamp`
9. **Add text decoration upgrades** — color, style, thickness, underline-offset
10. **Add `fontVariant`** — small-caps, petite-caps
11. **Expand `htmlTag`** — add figcaption, address, time
12. **Replace switch statement** — use `React.createElement(htmlTag, props, children)`
13. **Default `fontFamily`** to `var(--font-body)` when unset

---

### 4.3 RichTextRender — Restructure as Prose Engine

**Current location:** `src/lib/studio/blocks/renders.tsx` lines 3494–3695

#### 4.3.1 Current Props (RichTextProps)

```typescript
interface RichTextProps {
  content?: string;
  title?: string;
  subtitle?: string;
  pullQuote?: string;
  pullQuoteAuthor?: string;
  layout?: "centered" | "left" | "two-column" | "wide";
  textColor?: string;
  titleColor?: string;
  accentColor?: string;
  subtitleColor?: string;
  pullQuoteColor?: string;
  highlightColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  showDivider?: boolean;
  dividerColor?: string;
  maxWidth?: string;
  proseSize?: "sm" | "base" | "lg" | "xl";
  className?: string;
}
```

#### 4.3.2 Current Issues (Critical)

| Issue                      | Detail                                                                                                  | Impact                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Hardcoded text color       | Default `textColor = "#1c2b2a"`                                                                         | Invisible on dark backgrounds                 |
| Hardcoded title sizes      | `text-3xl md:text-4xl lg:text-5xl font-bold leading-tight`                                              | Not connected to type scale                   |
| Hardcoded subtitle opacity | `opacity: 0.85`                                                                                         | Not configurable                              |
| Basic markdown parser      | Only supports `**bold**`, `*italic*`, `- lists`                                                         | No links, headings, code, images, tables      |
| 5 hidden props             | `proseSize`, `subtitleColor`, `pullQuoteColor`, `highlightColor`, `cardBackgroundColor` not in registry | Users can't configure in Studio               |
| Pull quote hardcoded       | `text-lg md:text-xl` and `opacity: 0.9`                                                                 | Not connected to type scale, not configurable |
| No heading control         | Title is always `<h2>`                                                                                  | Can't control heading level                   |
| Two-column hardcoded gap   | `gap-8 md:gap-12` only                                                                                  | Not configurable                              |
| No footnotes               | Not supported                                                                                           | Long-form content needs footnotes             |
| No code blocks in content  | Not supported                                                                                           | Technical content can't show code             |

#### 4.3.3 Target Props (RichTextPropsV2)

```typescript
interface RichTextProps {
  // Content
  content?: string; // Markdown body content
  title?: string;
  titleLevel?: 1 | 2 | 3 | 4; // NEW — heading level for title (default: 2)
  subtitle?: string;
  pullQuote?: string;
  pullQuoteAuthor?: string;

  // Layout
  layout?: "centered" | "left" | "two-column" | "wide" | "asymmetric"; // ADDED asymmetric
  maxWidth?: string;
  columnGap?: string; // NEW — configurable gap for two-column
  contentPadding?: string; // NEW

  // Typography
  proseSize?: "sm" | "base" | "lg" | "xl"; // EXPOSE in registry
  titleFontFamily?: string; // NEW — "heading" | "body" | specific
  bodyFontFamily?: string; // NEW
  titleFontSize?: string; // NEW — override auto-calculated title size
  titleFontWeight?: number; // NEW

  // Colors (all theme-aware)
  textColor?: string; // DEFAULT CHANGED to "inherit" instead of "#1c2b2a"
  titleColor?: string;
  subtitleColor?: string; // EXPOSE in registry
  accentColor?: string;
  pullQuoteColor?: string; // EXPOSE in registry
  highlightColor?: string; // EXPOSE in registry
  backgroundColor?: string;
  cardBackgroundColor?: string; // EXPOSE in registry

  // Divider
  showDivider?: boolean;
  dividerColor?: string;
  dividerStyle?: "solid" | "dashed" | "dotted" | "gradient"; // NEW

  // Enhanced Markdown Features
  enableLinks?: boolean; // NEW — default true
  enableCodeBlocks?: boolean; // NEW — default true
  enableTables?: boolean; // NEW — default true
  enableFootnotes?: boolean; // NEW — default false
  enableHeadings?: boolean; // NEW — default true (render ## as <h3>, ### as <h4>, etc.)

  className?: string;
}
```

#### 4.3.4 Markdown Parser Upgrade

Current `markdownToHtml` is minimal. Target: full markdown-to-HTML pipeline.

```typescript
// Current (renders.tsx ~L3510):
function markdownToHtml(md: string): string {
  return md
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.*)/gm, "<li>$1</li>");
}

// Target: Use a proper markdown parser (remark + rehype) or expand inline:
function markdownToHtml(md: string, options: MarkdownOptions): string {
  let html = md
    // Headings (## → h3, ### → h4, limited to h3-h6 inside RichText)
    .replace(/^#### (.*)/gm, "<h6>$1</h6>")
    .replace(/^### (.*)/gm, "<h5>$1</h5>")
    .replace(/^## (.*)/gm, "<h4>$1</h4>")
    .replace(/^# (.*)/gm, "<h3>$1</h3>")
    // Bold/italic
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Code
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // Links
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    // Lists
    .replace(/^- (.*)/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.*)/gm, "<li>$2</li>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr />")
    // Paragraphs (wrap lines not already in block elements)
    .replace(/^(?!<[h|l|u|o|b|h])(.*\S.*)$/gm, "<p>$1</p>");
  return html;
}
```

> **Note:** For a full Markdown parser, we should evaluate integrating `marked` (lightweight, 32KB) or `remark-html` (extensible, larger) as a dependency rather than expanding the regex parser indefinitely. The regex approach works for the common subset but breaks on edge cases (nested lists, multi-line code blocks, tables).

#### 4.3.5 Theme-Aware Color Defaults

```typescript
// All color props default to "inherit" or CSS variable:
const defaults = {
  textColor: "inherit", // Was "#1c2b2a"
  titleColor: "inherit",
  subtitleColor: "var(--muted-foreground)", // Was hardcoded opacity
  accentColor: "var(--color-primary)",
  pullQuoteColor: "inherit",
  highlightColor: "var(--color-primary-light, #fef3c7)",
  backgroundColor: "transparent",
  cardBackgroundColor: "var(--card-background, transparent)",
  dividerColor: "var(--border-color, #e5e7eb)",
};
```

#### 4.3.6 Implementation Steps

1. **Remove all hardcoded colors** — Replace `#1c2b2a`, `opacity: 0.85`, hardcoded grays with CSS variables or `inherit`
2. **Connect title to type scale** — Replace `text-3xl md:text-4xl lg:text-5xl` with `var(--type-3xl)` or level-based defaults
3. **Add `titleLevel` prop** — Allow the title to be h1-h4 (default h2)
4. **Expose hidden props in registry** — `proseSize`, `subtitleColor`, `pullQuoteColor`, `highlightColor`, `cardBackgroundColor`
5. **Upgrade markdown parser** — Add headings, links, code, horizontal rules, ordered lists
6. **Add `asymmetric` layout** — 1/3 + 2/3 column split
7. **Add configurable `columnGap`** — Replace hardcoded `gap-8 md:gap-12`
8. **Add `dividerStyle`** — solid, dashed, dotted, gradient
9. **Add title font controls** — `titleFontFamily`, `titleFontSize`, `titleFontWeight`
10. **Add `bodyFontFamily`** — Allow different body font per RichText block
11. **Apply `text-wrap: pretty`** to prose paragraphs automatically
12. **Connect prose content to type scale** — Body text, list items, headings within content

---

### 4.4 QuoteRender — Fix and Expand

**Current location:** `src/lib/studio/blocks/renders.tsx` lines 3697–3860

#### 4.4.1 Current Props (QuoteProps)

```typescript
interface QuoteProps {
  text: string;
  author?: string;
  authorTitle?: string; // Note: registry calls this `source`
  authorImage?: string;
  variant?: "simple" | "bordered" | "card" | "modern"; // Note: registry calls this `style`
  size?: "sm" | "md" | "lg";
  textColor?: string; // Default "#374151" — hardcoded
  accentColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  align?: "left" | "center" | "right";
  className?: string;
}
```

#### 4.4.2 Current Issues (Critical)

| Issue                                             | Impact                                                                         | Fix                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| `modern` variant NOT implemented                  | Falls through to `simple` — user sees "modern" option that does nothing        | Implement or remove                 |
| Registry uses `style`, render uses `variant`      | Selecting a style in Studio never reaches the component                        | Rename to `variant` in registry     |
| Registry uses `source`, render uses `authorTitle` | Author title entered in Studio never displays                                  | Rename to `authorTitle` in registry |
| Default `textColor: "#374151"`                    | Hardcoded gray-700 — invisible on dark backgrounds                             | Change to `inherit`                 |
| Card `backgroundColor: "#ffffff"` hardcoded       | White card on dark background                                                  | Use `var(--card-background)`        |
| No `fontSize` control                             | Text size locked to variant                                                    | Add fontSize override               |
| No `fontFamily` control                           | Quote always inherits from parent                                              | Add explicit italic serif option    |
| No quotation mark styling                         | Basic blockquote, no decorative marks                                          | Add decorative " " styles           |
| 5 render props not in registry                    | `size`, `textColor`, `backgroundColor`, `borderColor`, `authorImage` invisible | Expose in registry                  |

#### 4.4.3 Target Props (QuotePropsV2)

```typescript
interface QuoteProps {
  // Content
  text: string;
  author?: string;
  authorTitle?: string; // STANDARDIZED — registry MUST use this name
  authorImage?: string;

  // Style
  variant?:
    | "simple"
    | "bordered"
    | "card"
    | "modern"
    | "pullquote"
    | "testimonial"; // ADDED variants
  size?: "sm" | "md" | "lg";

  // Typography
  fontFamily?: string; // NEW — "inherit" | "body" | "heading" | "serif-italic" | specific
  fontSize?: string; // NEW — override variant default
  fontWeight?: number; // NEW
  fontStyle?: "normal" | "italic"; // NEW — default "italic" for quotes
  lineHeight?: string; // NEW

  // Visual
  textColor?: string; // DEFAULT CHANGED to "inherit"
  accentColor?: string;
  backgroundColor?: string; // DEFAULT CHANGED to "var(--card-background)"
  borderColor?: string;
  quotationMarkColor?: string; // NEW — color of decorative " " marks
  quotationMarkStyle?: "none" | "decorative" | "large" | "serif"; // NEW

  // Layout
  align?: "left" | "center" | "right";
  maxWidth?: string; // NEW
  marginBottom?: string; // NEW

  className?: string;
}
```

#### 4.4.4 New Variants

```typescript
// MODERN — what the "modern" option should actually render:
// Clean, minimal, large text with left accent bar and modern font
modern: {
  borderLeft: `3px solid ${accentColor || 'var(--color-primary)'}`,
  paddingLeft: '1.5rem',
  fontFamily: 'var(--font-body)',
  fontStyle: 'normal',        // Modern quotes are NOT italic
  fontWeight: 500,
  fontSize: 'var(--type-lg)',
  letterSpacing: '-0.01em',
  color: 'inherit',
}

// PULLQUOTE — large, centered, decorative
pullquote: {
  textAlign: 'center',
  fontSize: 'var(--type-2xl)',
  fontFamily: 'var(--font-heading)',
  fontStyle: 'italic',
  fontWeight: 400,
  borderTop: `2px solid ${accentColor || 'var(--color-primary)'}`,
  borderBottom: `2px solid ${accentColor || 'var(--color-primary)'}`,
  paddingBlock: '1.5rem',
  marginBlock: '2rem',
  color: 'inherit',
}

// TESTIMONIAL — card-style with large quotation mark, avatar-friendly
testimonial: {
  backgroundColor: 'var(--card-background)',
  borderRadius: '0.75rem',
  padding: '2rem',
  position: 'relative',
  // Large decorative opening quote mark
  '::before': {
    content: '"\\201C"',
    fontSize: '4rem',
    fontFamily: 'Georgia, serif',
    color: accentColor || 'var(--color-primary)',
    position: 'absolute',
    top: '-0.5rem',
    left: '1rem',
    lineHeight: 1,
    opacity: 0.3,
  }
}
```

#### 4.4.5 Implementation Steps

1. **Fix registry mismatches FIRST** — Rename `style` → `variant`, `source` → `authorTitle` in `core-components.ts`
2. **Implement `modern` variant** — Clean, minimal left-bar design
3. **Add `pullquote` variant** — Large centered decorative quote
4. **Add `testimonial` variant** — Card with decorative mark and avatar support
5. **Remove all hardcoded colors** — `#374151` → `inherit`, `#ffffff` → `var(--card-background)`
6. **Expose hidden props in registry** — `size`, `textColor`, `backgroundColor`, `borderColor`, `authorImage`
7. **Add typography controls** — `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `lineHeight`
8. **Add decorative quotation marks** — `quotationMarkStyle` and `quotationMarkColor`
9. **Add `maxWidth`** — Default `max-w-2xl` for readability
10. **Default `fontStyle`** to "italic" for `simple`, `bordered`, `pullquote`; "normal" for `modern`, `card`, `testimonial`

---

## 5. New Typography Components

### 5.1 LabelRender — Small Text Utility

**Purpose:** Captions, metadata, badges, tags, overlines, timestamps — all the "small text" that doesn't fit Heading or Text.

#### 5.1.1 Props

```typescript
interface LabelProps {
  // Content
  text: string;
  htmlTag?: "span" | "small" | "time" | "abbr" | "label" | "figcaption"; // Default: "span"

  // Variant
  variant?:
    | "default"
    | "overline"
    | "caption"
    | "badge"
    | "eyebrow"
    | "kicker"
    | "meta";

  // Typography
  fontFamily?: string; // Default: "var(--font-body)"
  fontSize?: string; // Default: "var(--type-xs)" for most, "var(--type-sm)" for overline
  fontWeight?: number; // Default: 500 for overline/eyebrow/kicker, 400 for others
  letterSpacing?: string; // Default: "var(--tracking-wide)" for overline/eyebrow, "normal" for others
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"; // Default: "uppercase" for overline/eyebrow
  lineHeight?: string;

  // Visual
  color?: string; // Default: "var(--muted-foreground)"
  backgroundColor?: string; // For badge variant
  borderRadius?: string; // For badge variant
  padding?: string; // For badge variant

  // Layout
  align?: "left" | "center" | "right";
  marginBottom?: string;

  className?: string;
}
```

#### 5.1.2 Variant Defaults

| Variant  | fontSize    | fontWeight | letterSpacing | textTransform | color                |
| -------- | ----------- | ---------- | ------------- | ------------- | -------------------- |
| default  | `--type-xs` | 400        | normal        | none          | `--muted-foreground` |
| overline | `--type-xs` | 600        | `0.1em`       | uppercase     | `--color-primary`    |
| caption  | `--type-xs` | 400        | normal        | none          | `--muted-foreground` |
| badge    | `--type-xs` | 600        | `0.02em`      | uppercase     | `--color-primary`    |
| eyebrow  | `--type-sm` | 600        | `0.08em`      | uppercase     | `--color-primary`    |
| kicker   | `--type-sm` | 500        | `0.05em`      | uppercase     | `--color-accent`     |
| meta     | `--type-xs` | 400        | normal        | none          | `--muted-foreground` |

#### 5.1.3 Use Cases

```
OVERLINE/EYEBROW: "CASE STUDY" above a title → signals category
KICKER: "NEW" or "FEATURED" → attention-grabber
CAPTION: "Photo by John Doe" → image attribution
BADGE: "PRO" | "BETA" | "NEW" → status indicator
META: "5 min read • Jan 2026" → article metadata
```

---

### 5.2 ListRender — Semantic List with Typography Control

**Purpose:** Ordered and unordered lists with consistent typographic styling, custom markers, and layout control.

#### 5.2.1 Props

```typescript
interface ListProps {
  // Content
  items: string[]; // Array of text items (support inline markdown)
  ordered?: boolean; // Default: false (ul). True = ol.

  // Variants
  variant?:
    | "default"
    | "check"
    | "arrow"
    | "dash"
    | "numbered"
    | "icon"
    | "timeline";
  icon?: string; // Custom icon for "icon" variant

  // Typography
  fontFamily?: string;
  fontSize?: string; // Default: "var(--type-base)"
  fontWeight?: number;
  lineHeight?: string; // Default: "var(--leading-relaxed)"
  color?: string;

  // Marker Styling
  markerColor?: string; // Default: "var(--color-primary)"
  markerSize?: string;

  // Layout
  columns?: 1 | 2 | 3; // Multi-column list layout
  gap?: string; // Space between items. Default: "0.75em"
  indent?: string; // Left indent. Default: "1.5em"
  align?: "left" | "center";
  maxWidth?: string;
  marginBottom?: string;

  className?: string;
}
```

#### 5.2.2 Variant Details

| Variant  | Marker                            | Typical Use                  |
| -------- | --------------------------------- | ---------------------------- |
| default  | Standard bullet (`•`)             | General lists                |
| check    | Checkmark (`✓`) in primary color  | Feature lists, benefit lists |
| arrow    | Right arrow (`→`)                 | Navigation, steps            |
| dash     | Em dash (`—`)                     | Minimal, editorial           |
| numbered | Decimal numbers with accent color | Ordered steps, rankings      |
| icon     | Custom icon per list              | Feature comparison           |
| timeline | Dot + connector line              | Process steps, history       |

---

### 5.3 CodeBlockRender — Syntax-Highlighted Code

**Purpose:** Display code snippets with syntax highlighting, copy button, and language label.

#### 5.3.1 Props

```typescript
interface CodeBlockProps {
  // Content
  code: string;
  language?: string; // "javascript" | "typescript" | "html" | "css" | "python" | "bash" | "json" | "text"

  // Display
  variant?: "default" | "minimal" | "terminal" | "card";
  showLineNumbers?: boolean; // Default: false
  showCopyButton?: boolean; // Default: true
  showLanguageLabel?: boolean; // Default: true
  highlightLines?: number[]; // Lines to highlight

  // Typography
  fontFamily?: string; // Default: "var(--font-mono)"
  fontSize?: string; // Default: "var(--type-sm)"
  lineHeight?: string; // Default: "1.6"
  tabSize?: number; // Default: 2

  // Visual
  backgroundColor?: string; // Default: "var(--code-background)"
  textColor?: string; // Default: "var(--code-foreground)"
  borderColor?: string;
  borderRadius?: string;
  maxHeight?: string; // Scroll after this height

  // Layout
  maxWidth?: string;
  marginBottom?: string;

  className?: string;
}
```

#### 5.3.2 Syntax Highlighting Strategy

For the AI-generated website context, full syntax highlighting (Prism/Shiki) would add significant bundle size. Instead:

1. **Phase 1:** Simple token-based highlighting — keywords, strings, comments, numbers in 4 colors
2. **Phase 2 (optional):** Lazy-load Shiki for sites that use 3+ code blocks

```typescript
// Lightweight token highlighter (~2KB)
const TOKEN_PATTERNS = [
  { pattern: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, class: "comment" },
  { pattern: /(".*?"|'.*?'|`.*?`)/g, class: "string" },
  {
    pattern:
      /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|new)\b/g,
    class: "keyword",
  },
  { pattern: /\b(\d+\.?\d*)\b/g, class: "number" },
];
```

---

### 5.4 DisplayTextRender — Hero & Display Typography

**Purpose:** Oversized, decorative text for hero sections, banners, and marketing pages. Not semantically a heading — purely visual.

#### 5.4.1 Props

```typescript
interface DisplayTextProps {
  // Content
  text: string;

  // Typography
  fontFamily?: string; // Default: "var(--font-heading)"
  fontSize?: string; // Default: "var(--type-5xl)" — meant to be LARGE
  fontWeight?: number; // Default: 800
  lineHeight?: string; // Default: "1" (tight for display)
  letterSpacing?: string; // Default: "-0.03em" (tight tracking for large text)
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";

  // Visual Effects
  color?: string;
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientVia?: string; // Mid-point color for 3-stop gradients
  gradientDirection?: string; // Angle in degrees or directional keyword
  textShadow?: string;
  textStroke?: boolean; // Outline text (hollow letters)
  textStrokeColor?: string;
  textStrokeWidth?: string;
  opacity?: number;

  // Animation
  animation?:
    | "none"
    | "fade-up"
    | "typewriter"
    | "split-reveal"
    | "slide-in"
    | "blur-in";
  animationDelay?: number;
  animationDuration?: number;

  // Layout
  align?: "left" | "center" | "right";
  maxWidth?: string;
  marginBottom?: string;
  textWrap?: "auto" | "balance" | "nowrap";

  className?: string;
}
```

#### 5.4.2 Text Stroke (Outline Text) Implementation

```css
/* Text stroke for hollow/outline effect — popular in hero sections */
.display-text-stroke {
  -webkit-text-stroke: 2px var(--color-primary);
  -webkit-text-fill-color: transparent;
  /* Fallback for non-webkit */
  color: var(--color-primary);
  paint-order: stroke fill;
}
```

#### 5.4.3 Split Reveal Animation

```typescript
// Split text into individual characters/words, animate each with staggered delay
const SplitReveal = ({ text, by = "word" }: { text: string; by?: "word" | "char" }) => {
  const parts = by === "word" ? text.split(" ") : text.split("");
  return parts.map((part, i) => (
    <motion.span
      key={i}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
      style={{ display: "inline-block", whiteSpace: by === "word" ? "pre" : undefined }}
    >
      {by === "word" ? part + " " : part}
    </motion.span>
  ));
};
```

---

### 5.5 DividerTextRender — Decorative Separator with Text

**Purpose:** Section dividers with optional centered text, icons, or ornaments.

#### 5.5.1 Props

```typescript
interface DividerTextProps {
  // Content
  text?: string; // Optional — centered text in divider
  icon?: string; // Optional — icon instead of text

  // Style
  variant?: "line" | "dashed" | "dotted" | "gradient" | "ornament" | "fade";
  thickness?: "thin" | "medium" | "thick"; // 1px, 2px, 3px
  color?: string; // Default: "var(--border-color)"

  // Typography (when text provided)
  fontFamily?: string;
  fontSize?: string; // Default: "var(--type-xs)"
  fontWeight?: number;
  textTransform?: "none" | "uppercase";
  letterSpacing?: string;
  textColor?: string;

  // Layout
  maxWidth?: string; // Default: "100%"
  marginBlock?: string; // Default: "2rem"
  spacing?: string; // Gap between line and text

  className?: string;
}
```

---

### 5.6 StatNumberRender — Animated Statistics Display

**Purpose:** Large numbers with labels for statistics sections (e.g., "500+ Clients", "99.9% Uptime").

#### 5.6.1 Props

```typescript
interface StatNumberProps {
  // Content
  value: string | number; // The statistic value
  prefix?: string; // E.g., "$", "€"
  suffix?: string; // E.g., "+", "%", "K"
  label?: string; // Description below number

  // Typography
  valueFontFamily?: string; // Default: "var(--font-heading)"
  valueFontSize?: string; // Default: "var(--type-4xl)"
  valueFontWeight?: number; // Default: 700
  labelFontFamily?: string;
  labelFontSize?: string; // Default: "var(--type-sm)"
  labelFontWeight?: number;

  // Visual
  valueColor?: string; // Default: "inherit"
  labelColor?: string; // Default: "var(--muted-foreground)"
  gradient?: boolean; // Gradient on the number

  // Animation
  animate?: boolean; // Count-up animation. Default: true
  animationDuration?: number; // ms. Default: 2000
  animationDelay?: number;

  // Layout
  align?: "left" | "center" | "right";
  marginBottom?: string;

  className?: string;
}
```

---

### 5.7 Component Registration Summary

| Component                | Type Key      | Category   | Priority | Phase |
| ------------------------ | ------------- | ---------- | -------- | ----- |
| Heading (upgraded)       | `Heading`     | typography | Critical | 1     |
| Text (upgraded)          | `Text`        | typography | Critical | 1     |
| RichText (upgraded)      | `RichText`    | content    | Critical | 1     |
| Quote (fixed + expanded) | `Quote`       | content    | Critical | 1     |
| Label                    | `Label`       | typography | High     | 2     |
| List                     | `List`        | content    | High     | 2     |
| CodeBlock                | `CodeBlock`   | content    | Medium   | 3     |
| DisplayText              | `DisplayText` | typography | Medium   | 2     |
| DividerText              | `DividerText` | decoration | Low      | 3     |
| StatNumber               | `StatNumber`  | content    | Medium   | 3     |

---

## 6. Type Scale & Rhythm System

### 6.1 Mathematical Type Scale

The type scale uses a **modular ratio** to generate harmonically related sizes. The ratio is configurable per-site via the AI Designer or site settings.

#### 6.1.1 Scale Ratios (from typography-intelligence.ts)

| Name             | Ratio | Character              | Best For                         |
| ---------------- | ----- | ---------------------- | -------------------------------- |
| Minor Second     | 1.067 | Very subtle            | Dense UI, dashboards             |
| Major Second     | 1.125 | Gentle                 | Long-form reading, documentation |
| Minor Third      | 1.200 | **Default** — balanced | General websites, blogs          |
| Major Third      | 1.250 | Noticeable             | Marketing, editorial             |
| Perfect Fourth   | 1.333 | Strong                 | Bold marketing, portfolios       |
| Augmented Fourth | 1.414 | Dramatic               | Fashion, luxury, creative        |
| Perfect Fifth    | 1.500 | Very dramatic          | Hero-heavy landing pages         |
| Golden Ratio     | 1.618 | Maximum drama          | Single-page artistic sites       |

#### 6.1.2 Scale Generation

```typescript
// Enhanced generateTypeScale() with fluid clamp() values
function generateFluidTypeScale(
  baseSize: number = 1, // rem — base font size
  ratio: number = 1.2, // modular ratio
  minViewport: number = 320, // px — mobile min
  maxViewport: number = 1440, // px — desktop max
  fluidRange: number = 0.25, // how much size varies (0.25 = ±25%)
): TypeScale {
  const steps = [
    { name: "xs", power: -2 },
    { name: "sm", power: -1 },
    { name: "base", power: 0 },
    { name: "lg", power: 1 },
    { name: "xl", power: 2 },
    { name: "2xl", power: 3 },
    { name: "3xl", power: 4 },
    { name: "4xl", power: 5 },
    { name: "5xl", power: 6 },
    { name: "6xl", power: 7 },
    { name: "7xl", power: 8 },
    { name: "8xl", power: 9 },
    { name: "9xl", power: 10 },
  ];

  return steps.map((step) => {
    const idealSize = baseSize * Math.pow(ratio, step.power);
    const minSize = idealSize * (1 - fluidRange);
    const maxSize = idealSize * (1 + fluidRange);

    // Calculate the vw slope for fluid interpolation
    const slope = (maxSize - minSize) / ((maxViewport - minViewport) / 16);
    const intercept = minSize - slope * (minViewport / 16);

    return {
      name: step.name,
      value: `clamp(${minSize.toFixed(3)}rem, ${intercept.toFixed(3)}rem + ${(slope * 100).toFixed(2)}vw, ${maxSize.toFixed(3)}rem)`,
      static: `${idealSize.toFixed(3)}rem`, // Fallback for older browsers
      lineHeight: getAutoLineHeight(idealSize),
      letterSpacing: getAutoLetterSpacing(idealSize),
    };
  });
}

function getAutoLineHeight(sizeRem: number): number {
  // Larger text needs tighter leading, smaller text needs more
  if (sizeRem >= 3) return 1.1; // 3xl+ — very tight
  if (sizeRem >= 2) return 1.15; // 2xl-3xl — tight
  if (sizeRem >= 1.5) return 1.25; // xl-2xl — snug
  if (sizeRem >= 1.2) return 1.3; // lg — slightly snug
  if (sizeRem >= 1) return 1.5; // base — comfortable
  return 1.6; // sm, xs — generous
}

function getAutoLetterSpacing(sizeRem: number): string {
  // Large text needs tighter tracking, small text needs wider
  if (sizeRem >= 3) return "-0.025em";
  if (sizeRem >= 2) return "-0.02em";
  if (sizeRem >= 1.5) return "-0.015em";
  if (sizeRem >= 1) return "0";
  return "0.01em";
}
```

#### 6.1.3 CSS Variable Injection

```typescript
// Generated and injected on .studio-renderer by the StudioRenderer
function generateTypographyCSSVars(
  scale: TypeScale,
  fonts: FontPairing,
): string {
  const vars: string[] = [];

  // Font families
  vars.push(
    `--font-heading: ${fonts.heading.family}, ${fonts.heading.fallback};`,
  );
  vars.push(`--font-body: ${fonts.body.family}, ${fonts.body.fallback};`);
  vars.push(`--font-mono: 'JetBrains Mono', 'Fira Code', monospace;`);

  // Type scale (fluid values)
  for (const step of scale) {
    vars.push(`--type-${step.name}: ${step.value};`);
    vars.push(`--leading-${step.name}: ${step.lineHeight};`);
    vars.push(`--tracking-${step.name}: ${step.letterSpacing};`);
  }

  // Named line heights
  vars.push(`--leading-tight: 1.15;`);
  vars.push(`--leading-snug: 1.3;`);
  vars.push(`--leading-normal: 1.5;`);
  vars.push(`--leading-relaxed: 1.625;`);
  vars.push(`--leading-loose: 2;`);

  // Named letter spacings
  vars.push(`--tracking-tighter: -0.05em;`);
  vars.push(`--tracking-tight: -0.025em;`);
  vars.push(`--tracking-normal: 0;`);
  vars.push(`--tracking-wide: 0.025em;`);
  vars.push(`--tracking-wider: 0.05em;`);
  vars.push(`--tracking-widest: 0.1em;`);

  // Rhythm unit
  vars.push(`--rhythm: calc(var(--type-base) * var(--leading-normal));`);

  return vars.join("\n  ");
}
```

### 6.2 Vertical Rhythm System

Vertical rhythm ensures consistent spacing throughout the page, creating a visual "grid" that guides the eye.

#### 6.2.1 Rhythm Unit

```
--rhythm = base font size × base line height = 1rem × 1.5 = 1.5rem (24px at 16px base)
```

All vertical spacing is a multiple of this unit:

| Multiple | Value (at 1.5rem rhythm) | Use Case                      |
| -------- | ------------------------ | ----------------------------- |
| 0.25×    | 0.375rem (6px)           | Tight optical adjustment      |
| 0.5×     | 0.75rem (12px)           | Within components, list items |
| 1×       | 1.5rem (24px)            | Default paragraph spacing     |
| 1.5×     | 2.25rem (36px)           | Between groups                |
| 2×       | 3rem (48px)              | Section gaps                  |
| 3×       | 4.5rem (72px)            | Major section separators      |
| 4×       | 6rem (96px)              | Hero-to-content gap           |

#### 6.2.2 Component Margin Mapping

```typescript
const RHYTHM_MARGINS = {
  // Headings — more space above (content separator), less below (group with content)
  h1: {
    marginTop: "calc(var(--rhythm) * 3)",
    marginBottom: "calc(var(--rhythm) * 1)",
  },
  h2: {
    marginTop: "calc(var(--rhythm) * 2.5)",
    marginBottom: "calc(var(--rhythm) * 0.75)",
  },
  h3: {
    marginTop: "calc(var(--rhythm) * 2)",
    marginBottom: "calc(var(--rhythm) * 0.5)",
  },
  h4: {
    marginTop: "calc(var(--rhythm) * 1.5)",
    marginBottom: "calc(var(--rhythm) * 0.5)",
  },
  h5: {
    marginTop: "calc(var(--rhythm) * 1)",
    marginBottom: "calc(var(--rhythm) * 0.25)",
  },
  h6: {
    marginTop: "calc(var(--rhythm) * 1)",
    marginBottom: "calc(var(--rhythm) * 0.25)",
  },

  // Body elements — consistent rhythm spacing
  p: { marginTop: "0", marginBottom: "var(--rhythm)" },
  ul: { marginTop: "0", marginBottom: "var(--rhythm)", paddingLeft: "1.5em" },
  ol: { marginTop: "0", marginBottom: "var(--rhythm)", paddingLeft: "1.5em" },
  li: { marginBottom: "calc(var(--rhythm) * 0.25)" },
  blockquote: { marginTop: "var(--rhythm)", marginBottom: "var(--rhythm)" },
  pre: { marginTop: "var(--rhythm)", marginBottom: "var(--rhythm)" },
  hr: {
    marginTop: "calc(var(--rhythm) * 2)",
    marginBottom: "calc(var(--rhythm) * 2)",
  },
};
```

### 6.3 Measure (Line Length) Standards

Optimal line length for readability:

| Content Type                 | Optimal | Min  | Max         | CSS                  |
| ---------------------------- | ------- | ---- | ----------- | -------------------- |
| Body text (prose)            | 65ch    | 45ch | 75ch        | `max-width: 65ch`    |
| Short-form (cards, captions) | 35ch    | 20ch | 45ch        | `max-width: 35ch`    |
| Wide layout body             | 75ch    | 60ch | 85ch        | `max-width: 75ch`    |
| Code blocks                  | 80ch    | 60ch | 120ch       | `max-width: 80ch`    |
| Headings                     | None    | —    | 25-30 words | `text-wrap: balance` |

### 6.4 Whitespace Scale

A consistent spacing scale derived from the rhythm unit:

```css
--space-3xs: calc(var(--rhythm) * 0.125); /* 3px  */
--space-2xs: calc(var(--rhythm) * 0.25); /* 6px  */
--space-xs: calc(var(--rhythm) * 0.5); /* 12px */
--space-sm: calc(var(--rhythm) * 0.75); /* 18px */
--space-md: var(--rhythm); /* 24px */
--space-lg: calc(var(--rhythm) * 1.5); /* 36px */
--space-xl: calc(var(--rhythm) * 2); /* 48px */
--space-2xl: calc(var(--rhythm) * 3); /* 72px */
--space-3xl: calc(var(--rhythm) * 4); /* 96px */
```

---

## 7. Font Management System

### 7.1 Font Sources (Priority Order)

| Source                  | Current Support             | Target Support | Loading Strategy                          |
| ----------------------- | --------------------------- | -------------- | ----------------------------------------- |
| Google Fonts            | ✅ Supported                | ✅ Enhanced    | `<link>` preconnect + stylesheet          |
| Variable Fonts (Google) | 🔴 Not supported            | ✅ New         | `<link>` with axis ranges                 |
| Custom uploaded fonts   | 🔴 Not supported            | ✅ New         | WOFF2 via Supabase storage + `@font-face` |
| System font stacks      | ⚠️ Partial (system-ui only) | ✅ Full stacks | No loading needed — zero CLS              |
| Bunny Fonts (privacy)   | 🔴 Not supported            | ✅ New         | GDPR-compliant Google Fonts mirror        |

### 7.2 Current Font Loading (brand-colors.ts + renderer.tsx)

```typescript
// Current: hardcoded weight range
const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700&display=swap`;

// Problems:
// 1. Weights 100, 200, 800, 900 not loaded — components that set these weights get fallback font
// 2. Italic variants not loaded — <em> inside heading font gets synthesized italic (bad)
// 3. No variable font support — loads 5 separate static files instead of 1 variable file
// 4. No subsetting — full character set loaded even for English-only sites
// 5. No preconnect hint — first request waits for DNS resolution
```

### 7.3 Target Font Loading

```typescript
// Smart font loading based on font capabilities
function generateFontLoadingStrategy(font: FontDefinition): FontLoadConfig {
  // Check if variable font version available
  if (font.hasVariableVersion) {
    return {
      url: `https://fonts.googleapis.com/css2?family=${font.name}:ital,wght@0,100..900;1,100..900&display=swap`,
      type: "variable",
      preconnect: true,
      fallback: generateFallbackStack(font),
    };
  }

  // Static font — load only the weights components actually use
  const usedWeights = detectUsedWeights(font.name); // Scan site components
  return {
    url: `https://fonts.googleapis.com/css2?family=${font.name}:ital,wght@${formatWeights(usedWeights)}&display=swap`,
    type: "static",
    preconnect: true,
    fallback: generateFallbackStack(font),
  };
}
```

### 7.4 Font Fallback Stack System

Every brand font gets a metrically-matched fallback to minimize layout shift (CLS):

```typescript
const FONT_FALLBACK_STACKS: Record<string, string> = {
  // Sans-serif
  Inter: "InterFallback, system-ui, -apple-system, sans-serif",
  Poppins: "PoppinsFallback, system-ui, -apple-system, sans-serif",
  "DM Sans": "DMSansFallback, system-ui, -apple-system, sans-serif",
  Manrope: "ManropeFallback, system-ui, -apple-system, sans-serif",
  "Space Grotesk": "SpaceGroteskFallback, system-ui, sans-serif",

  // Serif
  "Playfair Display": 'PlayfairFallback, Georgia, "Times New Roman", serif',
  Lora: "LoraFallback, Georgia, serif",
  "Source Serif 4": "SourceSerifFallback, Georgia, serif",
  Fraunces: "FrauncesFallback, Georgia, serif",

  // Display
  Syne: "SyneFallback, system-ui, sans-serif",
  Outfit: "OutfitFallback, system-ui, sans-serif",

  // Monospace
  "JetBrains Mono":
    'JetBrainsFallback, "Cascadia Code", "Fira Code", monospace',
  "Fira Code": 'FiraCodeFallback, "Cascadia Code", monospace',
};

// Generate @font-face with size-adjust for CLS prevention
function generateFallbackFontFace(fontName: string): string {
  const metrics = FONT_METRICS[fontName]; // Pre-computed per-font
  if (!metrics) return "";

  return `
    @font-face {
      font-family: '${fontName}Fallback';
      src: local('${metrics.localFallback}');
      size-adjust: ${metrics.sizeAdjust}%;
      ascent-override: ${metrics.ascentOverride}%;
      descent-override: ${metrics.descentOverride}%;
      line-gap-override: ${metrics.lineGapOverride}%;
    }
  `;
}
```

### 7.5 Custom Font Upload Pipeline

```
User uploads .woff2/.ttf/.otf in Site Settings
        ↓
Upload to Supabase storage (font-assets bucket)
        ↓
Generate @font-face with font-display: swap
        ↓
Extract font metadata (weight range, italic support, variable axes)
        ↓
Store metadata in sites.settings.fonts[]
        ↓
Inject at render time via generateCustomFontFaces()
```

### 7.6 System Font Stacks (Zero-Load Performance)

```css
/* System Sans */
--font-system-sans:
  system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;

/* System Serif */
--font-system-serif:
  "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman",
  serif;

/* System Mono */
--font-system-mono:
  "Cascadia Code", "SF Mono", "Fira Code", Consolas, "DejaVu Sans Mono",
  monospace;

/* System Rounded */
--font-system-rounded:
  ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari,
  "Arial Rounded MT Bold", sans-serif;
```

### 7.7 Font Loading Performance Rules

| Rule                                                                   | Implementation                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| `font-display: swap` on all @font-face                                 | Ensures text is visible immediately with fallback |
| `<link rel="preconnect" href="https://fonts.googleapis.com">`          | Resolve DNS early                                 |
| `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` | Resolve DNS for font files                        |
| Maximum 2 families per page                                            | AI Designer enforces this limit                   |
| Maximum 4 weights per family (static)                                  | Smart weight detection                            |
| Variable fonts preferred                                               | Single file replaces multiple weight files        |
| `size-adjust` fallbacks for all families                               | Prevents CLS during font swap                     |
| Subset to `latin` for non-CJK sites                                    | Reduces file size by 60-80%                       |
| Self-host option for GDPR                                              | Bunny Fonts mirror or direct hosting              |

---

## 8. Fluid Typography System

### 8.1 What Is Fluid Typography

Traditional responsive typography uses breakpoints — fixed sizes that jump at `sm`, `md`, `lg`. Fluid typography uses CSS `clamp()` to create a **smooth, continuous scale** between a minimum and maximum size:

```css
/* Breakpoint approach: jumpy */
h1 {
  font-size: 2rem;
}
@media (min-width: 768px) {
  h1 {
    font-size: 3rem;
  }
}
@media (min-width: 1024px) {
  h1 {
    font-size: 4rem;
  }
}

/* Fluid approach: smooth */
h1 {
  font-size: clamp(2rem, 1.5rem + 2.5vw, 4rem);
}
```

### 8.2 Fluid clamp() Formula

```
clamp(min, preferred, max)

where preferred = intercept + slope × 100vw

slope = (maxSize - minSize) / (maxViewport - minViewport)
intercept = minSize - slope × minViewport

All values in rem (viewport values converted: px ÷ 16)
```

### 8.3 Generated Fluid Scale Example (Minor Third — 1.200 ratio)

Base size: 1rem (16px). Viewport range: 320px–1440px.

| Token         | Minimum (320px) | Maximum (1440px) | clamp() Value                                  |
| ------------- | --------------- | ---------------- | ---------------------------------------------- |
| `--type-xs`   | 0.579rem        | 0.694rem         | `clamp(0.579rem, 0.543rem + 0.18vw, 0.694rem)` |
| `--type-sm`   | 0.694rem        | 0.833rem         | `clamp(0.694rem, 0.651rem + 0.22vw, 0.833rem)` |
| `--type-base` | 0.833rem        | 1.000rem         | `clamp(0.833rem, 0.781rem + 0.26vw, 1.000rem)` |
| `--type-lg`   | 1.000rem        | 1.200rem         | `clamp(1.000rem, 0.938rem + 0.31vw, 1.200rem)` |
| `--type-xl`   | 1.200rem        | 1.440rem         | `clamp(1.200rem, 1.126rem + 0.37vw, 1.440rem)` |
| `--type-2xl`  | 1.440rem        | 1.728rem         | `clamp(1.440rem, 1.351rem + 0.45vw, 1.728rem)` |
| `--type-3xl`  | 1.728rem        | 2.074rem         | `clamp(1.728rem, 1.621rem + 0.54vw, 2.074rem)` |
| `--type-4xl`  | 2.074rem        | 2.488rem         | `clamp(2.074rem, 1.945rem + 0.64vw, 2.488rem)` |
| `--type-5xl`  | 2.488rem        | 2.986rem         | `clamp(2.488rem, 2.334rem + 0.77vw, 2.986rem)` |
| `--type-6xl`  | 2.986rem        | 3.583rem         | `clamp(2.986rem, 2.801rem + 0.93vw, 3.583rem)` |
| `--type-7xl`  | 3.583rem        | 4.300rem         | `clamp(3.583rem, 3.361rem + 1.11vw, 4.300rem)` |
| `--type-8xl`  | 4.300rem        | 5.160rem         | `clamp(4.300rem, 4.033rem + 1.34vw, 5.160rem)` |
| `--type-9xl`  | 5.160rem        | 6.192rem         | `clamp(5.160rem, 4.840rem + 1.60vw, 6.192rem)` |

### 8.4 Fluid Scale Configuration in AI Designer

The AI Designer configures the fluid scale per-site based on industry and content:

```typescript
// In typography-intelligence.ts — enhanced site configuration
interface TypographyConfig {
  baseSize: number; // Default: 1 (rem)
  scaleRatio: number; // From TYPE_SCALE_RATIOS — default 1.2
  minViewport: number; // Default: 320 (px)
  maxViewport: number; // Default: 1440 (px)
  fluidRange: number; // How much sizes scale — default 0.25
  fontPairing: string; // Key from FONT_PAIRINGS
}

// Example: Luxury brand (dramatic, serif, wide range)
const luxuryConfig: TypographyConfig = {
  baseSize: 1.125, // 18px — slightly larger base for luxury feel
  scaleRatio: 1.414, // Augmented fourth — dramatic hierarchy
  minViewport: 375,
  maxViewport: 1920,
  fluidRange: 0.35, // More variation for dramatic effect
  fontPairing: "playfairDmSans",
};

// Example: SaaS dashboard (subtle, sans-serif, tight range)
const saasConfig: TypographyConfig = {
  baseSize: 0.875, // 14px — compact for data-dense UI
  scaleRatio: 1.125, // Major second — subtle hierarchy
  minViewport: 768, // Dashboards start at tablet
  maxViewport: 1440,
  fluidRange: 0.15, // Minimal variation — UI needs stability
  fontPairing: "interSystem",
};
```

### 8.5 Browser Support & Fallback

```css
/* Modern browsers: fluid */
font-size: clamp(1.728rem, 1.5rem + 1.14vw, 2.441rem);

/* clamp() is supported by 95%+ of browsers (all modern browsers since 2020)
   For the remaining <5%, the fallback is the static value: */
@supports not (font-size: clamp(1rem, 1rem, 1rem)) {
  /* Static fallback using the ideal (midpoint) value */
  font-size: 2.074rem;
}
```

---

## 9. OpenType & Advanced Features

### 9.1 OpenType Feature Toggles

Many professional fonts include OpenType features that dramatically improve typography quality. These should be exposed in the Studio editor:

| Feature                 | CSS Property             | Value                     | Effect                              |
| ----------------------- | ------------------------ | ------------------------- | ----------------------------------- |
| Standard Ligatures      | `font-variant-ligatures` | `common-ligatures`        | fi, fl, ff → joined forms           |
| Discretionary Ligatures | `font-variant-ligatures` | `discretionary-ligatures` | Decorative joinings (st, ct, etc.)  |
| Contextual Alternates   | `font-variant-ligatures` | `contextual`              | Context-sensitive letter shapes     |
| Small Caps              | `font-variant-caps`      | `small-caps`              | Lowercase → small capital forms     |
| All Small Caps          | `font-variant-caps`      | `all-small-caps`          | Both cases → small capitals         |
| Petite Caps             | `font-variant-caps`      | `petite-caps`             | Even smaller small caps             |
| Lining Numerals         | `font-variant-numeric`   | `lining-nums`             | Numbers aligned to baseline (1234)  |
| Old-Style Numerals      | `font-variant-numeric`   | `oldstyle-nums`           | Numbers with descenders (like text) |
| Tabular Numerals        | `font-variant-numeric`   | `tabular-nums`            | Fixed-width numbers (for columns)   |
| Proportional Numerals   | `font-variant-numeric`   | `proportional-nums`       | Variable-width numbers (for text)   |
| Fractions               | `font-variant-numeric`   | `diagonal-fractions`      | 1/2 → proper fraction glyph         |
| Ordinals                | `font-variant-numeric`   | `ordinal`                 | 1st, 2nd → superscript ordinals     |
| Stylistic Sets          | `font-feature-settings`  | `"ss01"` – `"ss20"`       | Alternate character designs         |
| Swashes                 | `font-feature-settings`  | `"swsh"`                  | Decorative extensions               |
| Superscript             | `font-variant-position`  | `super`                   | Proper superscript glyphs           |
| Subscript               | `font-variant-position`  | `sub`                     | Proper subscript glyphs             |

### 9.2 Universal Typography Options Interface

Add an `opentype` prop to all typography components:

```typescript
interface OpenTypeOptions {
  ligatures?: "normal" | "none" | "common" | "discretionary" | "all";
  numericFigure?: "default" | "lining" | "oldstyle";
  numericSpacing?: "default" | "tabular" | "proportional";
  numericFractions?: boolean;
  caps?: "normal" | "small-caps" | "all-small-caps" | "petite-caps";
  ordinals?: boolean;
  stylisticSet?: number; // 1-20
}

// Usage: <Text opentype={{ ligatures: "all", caps: "small-caps", numericSpacing: "tabular" }} />
```

### 9.3 CSS Generation from OpenType Options

```typescript
function openTypeToCss(options: OpenTypeOptions): React.CSSProperties {
  const css: React.CSSProperties = {};

  // Ligatures
  if (options.ligatures) {
    const ligatureMap = {
      normal: "normal",
      none: "none",
      common: "common-ligatures",
      discretionary: "common-ligatures discretionary-ligatures",
      all: "common-ligatures discretionary-ligatures contextual",
    };
    css.fontVariantLigatures = ligatureMap[options.ligatures];
  }

  // Numeric features
  const numericParts: string[] = [];
  if (options.numericFigure === "lining") numericParts.push("lining-nums");
  if (options.numericFigure === "oldstyle") numericParts.push("oldstyle-nums");
  if (options.numericSpacing === "tabular") numericParts.push("tabular-nums");
  if (options.numericSpacing === "proportional")
    numericParts.push("proportional-nums");
  if (options.numericFractions) numericParts.push("diagonal-fractions");
  if (options.ordinals) numericParts.push("ordinal");
  if (numericParts.length > 0)
    css.fontVariantNumeric = numericParts.join(" ") as any;

  // Caps
  if (options.caps && options.caps !== "normal") {
    css.fontVariantCaps = options.caps as any;
  }

  // Stylistic sets (must use font-feature-settings)
  if (options.stylisticSet) {
    css.fontFeatureSettings = `"ss${String(options.stylisticSet).padStart(2, "0")}"`;
  }

  return css;
}
```

### 9.4 Which Fonts Support What

Not all fonts support all features. The font library metadata should track available features:

```typescript
// Enhanced font definition in typography-intelligence.ts
interface FontDefinition {
  name: string;
  category: "sans-serif" | "serif" | "display" | "monospace";
  weights: number[];
  hasItalic: boolean;
  hasVariableVersion: boolean;
  variableAxes?: string[]; // e.g., ['wght', 'wdth', 'opsz', 'GRAD']
  openTypeFeatures: {
    ligatures: boolean;
    discretionaryLigatures: boolean;
    smallCaps: boolean;
    oldstyleNumerals: boolean;
    tabularNumerals: boolean;
    fractions: boolean;
    stylisticSets: number[]; // Which ss01-ss20 are available
    swashes: boolean;
  };
}

// Example: Inter supports many OpenType features
const interDefinition: FontDefinition = {
  name: "Inter",
  category: "sans-serif",
  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  hasItalic: true,
  hasVariableVersion: true,
  variableAxes: ["wght", "opsz", "slnt"],
  openTypeFeatures: {
    ligatures: true,
    discretionaryLigatures: true,
    smallCaps: false,
    oldstyleNumerals: false,
    tabularNumerals: true,
    fractions: true,
    stylisticSets: [1, 2, 3],
    swashes: false,
  },
};
```

### 9.5 Variable Font Axis Control

Variable fonts allow continuous control over weight, width, optical size, and custom axes:

```typescript
interface VariableFontControls {
  // Standard registered axes
  fontWeight?: number; // wght: 100-900 (continuous, not just 100 steps)
  fontWidth?: number; // wdth: 75-125 (condensed to expanded)
  fontSlant?: number; // slnt: -12 to 0 (degrees of slant)
  fontOpticalSize?: number; // opsz: 8-144 (auto-adjusts for size)

  // Custom axes (font-specific)
  fontGrade?: number; // GRAD: thickness without width change
  fontCasual?: number; // CASL: 0 (formal) to 1 (casual)
  fontCursive?: number; // CRSV: 0 (upright) to 1 (cursive)
  fontMonospace?: number; // MONO: 0 (proportional) to 1 (monospace)
  fontSoftness?: number; // SOFT: 0 (sharp) to 100 (round)
}

// CSS generation
function variableFontToCss(controls: VariableFontControls): string {
  const settings: string[] = [];
  if (controls.fontWeight !== undefined)
    settings.push(`'wght' ${controls.fontWeight}`);
  if (controls.fontWidth !== undefined)
    settings.push(`'wdth' ${controls.fontWidth}`);
  if (controls.fontSlant !== undefined)
    settings.push(`'slnt' ${controls.fontSlant}`);
  if (controls.fontOpticalSize !== undefined)
    settings.push(`'opsz' ${controls.fontOpticalSize}`);
  if (controls.fontGrade !== undefined)
    settings.push(`'GRAD' ${controls.fontGrade}`);
  return `font-variation-settings: ${settings.join(", ")};`;
}
```

### 9.6 Modern CSS Text Features

| Feature                     | CSS                   | Support                   | Use Case                                     |
| --------------------------- | --------------------- | ------------------------- | -------------------------------------------- |
| `text-wrap: balance`        | Applied to headings   | Chrome 114+, Firefox 121+ | Even line lengths in headings                |
| `text-wrap: pretty`         | Applied to body text  | Chrome 117+               | Prevents orphans & widows                    |
| `text-decoration-thickness` | `2px`, `from-font`    | All modern                | Thicker, more visible underlines             |
| `text-decoration-skip-ink`  | `auto`                | All modern                | Underlines skip descenders                   |
| `text-underline-offset`     | `3px`                 | All modern                | Space between text and underline             |
| `initial-letter`            | `initial-letter: 3`   | Safari 9+, Chrome 110+    | Drop caps without float hacks                |
| `text-box-trim`             | `text-box-trim: both` | Chrome 133+               | Remove leading/trailing whitespace from text |
| `hyphenate-limit-chars`     | `6 3 3`               | Firefox, Safari           | Control minimum chars before/after hyphen    |
| `hanging-punctuation`       | `first`               | Safari only               | Quotation marks hang in margin               |

---

## 10. Responsive Typography Strategy

### 10.1 Three-Tier Approach

| Tier                   | Mechanism                               | When to Use                                                   |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------- |
| **Fluid (default)**    | CSS `clamp()` via `--type-*` variables  | All body text, headings, standard content                     |
| **Breakpoint overlay** | `@media` queries on specific components | Hero text that needs extreme sizing changes                   |
| **Container query**    | `@container` on component wrappers      | Cards, sidebars — text sizes based on container, not viewport |

### 10.2 Viewport Breakpoints

```css
/* Standard breakpoints (matching Tailwind) */
--bp-sm: 640px; /* Small phones → large phones */
--bp-md: 768px; /* Large phones → tablets */
--bp-lg: 1024px; /* Tablets → laptops */
--bp-xl: 1280px; /* Laptops → desktops */
--bp-2xl: 1536px; /* Desktops → large screens */
```

### 10.3 Container Query Typography

For components inside varying-width containers (cards, sidebars, modals):

```css
/* Container context on parent */
.component-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* Typography adapts to container width, not viewport */
@container card (max-width: 300px) {
  .heading {
    font-size: var(--type-lg);
  }
  .body {
    font-size: var(--type-sm);
  }
}

@container card (min-width: 301px) and (max-width: 600px) {
  .heading {
    font-size: var(--type-xl);
  }
  .body {
    font-size: var(--type-base);
  }
}

@container card (min-width: 601px) {
  .heading {
    font-size: var(--type-2xl);
  }
  .body {
    font-size: var(--type-base);
  }
}
```

### 10.4 Mobile-Specific Typography Rules

| Rule                            | Rationale                                        | Implementation                                        |
| ------------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| Minimum body size: 16px         | Prevents auto-zoom on iOS, ensures readability   | `min(var(--type-base), 1rem)` — never below 1rem      |
| Minimum tap target: 44×44px     | WCAG 2.5.8 Target Size                           | Links in body text get `min-height: 44px` via padding |
| Reduce heading scale on mobile  | 5xl heading is too large on 320px screen         | Fluid `clamp()` handles this automatically            |
| Increase line height on mobile  | Small screens benefit from more generous leading | Base `--leading-normal` already 1.5                   |
| Reduce letter-spacing on mobile | Tight tracking on small text reduces readability | Fluid tracking adjusts with size                      |
| Stack multi-column to single    | Two-column text unreadable on mobile             | `@media (max-width: 640px) { columns: 1 }`            |
| Larger quote text on mobile     | Quotes need impact even on small screens         | Quote `sm` variant minimum: `var(--type-base)`        |

### 10.5 Print Typography

For sites that may be printed (invoices, articles, reports):

```css
@media print {
  body {
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
  }

  h1 {
    font-size: 24pt;
  }
  h2 {
    font-size: 18pt;
  }
  h3 {
    font-size: 14pt;
  }
  h4,
  h5,
  h6 {
    font-size: 12pt;
  }

  /* Remove web-only decorations */
  .gradient-text {
    -webkit-text-fill-color: initial;
    background: none;
    color: #000;
  }

  /* Avoid orphans and widows */
  p {
    orphans: 3;
    widows: 3;
  }
  h1,
  h2,
  h3,
  h4 {
    page-break-after: avoid;
  }
}
```

---

## 11. Dark Mode Typography Adaptation

### 11.1 Core Principles

Typography in dark mode requires more than just inverting colors. Perceptual differences demand specific adjustments:

| Principle                               | Explanation                                                           | Implementation                                                       |
| --------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Reduced weight**                      | Light text on dark backgrounds appears heavier due to halation effect | Reduce `fontWeight` by 100 in dark mode (700→600, 500→400)           |
| **Increased letter-spacing**            | Light text on dark needs slightly more space                          | Add +0.01em to `letterSpacing` in dark mode                          |
| **Softer whites**                       | Pure `#FFFFFF` on pure `#000000` causes eye strain                    | Max text brightness: `#E8E8E8` to `#F0F0F0`                          |
| **Reduced contrast for secondary text** | Secondary text should be more muted in dark mode                      | Use `#9CA3AF` instead of scaling from light mode                     |
| **Warm or cool bias**                   | Match the dark mode surface temperature                               | Warm dark (`#1A1614`) → warm text. Cool dark (`#0F172A`) → cool text |

### 11.2 Dark Mode Typography Variables

```css
:root {
  /* Light mode */
  --text-primary: #111827; /* gray-900 */
  --text-secondary: #4b5563; /* gray-600 */
  --text-tertiary: #9ca3af; /* gray-400 */
  --text-muted: #d1d5db; /* gray-300 */
  --text-on-primary: #ffffff; /* text on colored backgrounds */
}

[data-theme="dark"] {
  /* Dark mode — NOT just inverted */
  --text-primary: #f0f0f0; /* Soft white — not pure #FFF */
  --text-secondary: #a1a1aa; /* zinc-400 — sufficient contrast on dark */
  --text-tertiary: #71717a; /* zinc-500 */
  --text-muted: #52525b; /* zinc-600 */
  --text-on-primary: #ffffff; /* Still white on colored backgrounds */
}
```

### 11.3 Dark Mode Font Weight Adjustment

```typescript
// In the renderer, when dark mode is detected:
function adjustWeightForDarkMode(weight: number, isDarkMode: boolean): number {
  if (!isDarkMode) return weight;
  // Reduce by one step (100) but never below 300
  return Math.max(weight - 100, 300);
}

// Applied in HeadingRender, TextRender, etc.:
const effectiveWeight = adjustWeightForDarkMode(fontWeight, isDarkMode);
```

### 11.4 Dark Mode Gradient Text

Gradients need different stops in dark mode to remain visible:

```typescript
// Light mode gradient: dark to medium (on light background)
gradientFrom: "#1E40AF"; // blue-800
gradientTo: "#7C3AED"; // violet-600

// Dark mode: medium to light (on dark background)
gradientFrom: "#60A5FA"; // blue-400
gradientTo: "#A78BFA"; // violet-400
```

### 11.5 Dark Mode Code Block Adaptation

```css
[data-theme="dark"] .code-block {
  --code-background: #1e1e2e; /* Dark surface */
  --code-foreground: #cdd6f4; /* Soft lavender text */
  --code-keyword: #cba6f7; /* Mauve */
  --code-string: #a6e3a1; /* Green */
  --code-comment: #6c7086; /* Overlay0 */
  --code-number: #fab387; /* Peach */
}
```

---

## 12. AI Designer Integration

### 12.1 Typography Intelligence Module Enhancement

Current `typography-intelligence.ts` generates scales and pairings but doesn't produce actionable component configurations. The enhanced version should output complete, ready-to-inject typography configurations.

#### 12.1.1 Enhanced Output Interface

```typescript
interface AITypographyOutput {
  // CSS Variables (inject on .studio-renderer)
  cssVariables: Record<string, string>;

  // Font Loading
  fontLoading: {
    families: Array<{
      name: string;
      weights: number[];
      italic: boolean;
      variable: boolean;
      url: string;
    }>;
    preconnectUrls: string[];
    fallbackFontFaces: string;
  };

  // Per-Component Defaults (AI-recommended values for this site)
  componentDefaults: {
    heading: Partial<HeadingProps>;
    text: Partial<TextProps>;
    richText: Partial<RichTextProps>;
    quote: Partial<QuoteProps>;
    label: Partial<LabelProps>;
    displayText: Partial<DisplayTextProps>;
  };

  // Scale Configuration
  scaleConfig: {
    ratio: number;
    ratioName: string;
    baseSize: number;
    minViewport: number;
    maxViewport: number;
  };
}
```

#### 12.1.2 Industry-Specific Typography Rules

Extended from existing `INDUSTRY_TYPOGRAPHY` mapping:

```typescript
const INDUSTRY_TYPOGRAPHY_RULES: Record<string, TypographyRules> = {
  technology: {
    fontPairing: "interSystem",
    scaleRatio: 1.2, // Minor Third — balanced
    baseSize: 1,
    headingWeight: 700,
    bodyWeight: 400,
    headingStyle: "normal", // No italic for tech
    opentype: { ligatures: "common", numericSpacing: "tabular" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "70ch",
    mood: "clean, precise, modern",
  },
  luxury: {
    fontPairing: "playfairDmSans",
    scaleRatio: 1.414, // Augmented Fourth — dramatic
    baseSize: 1.125,
    headingWeight: 400, // Light weight for elegance
    bodyWeight: 300,
    headingStyle: "normal",
    opentype: { ligatures: "all", caps: "small-caps" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "60ch", // Narrow for premium feel
    mood: "elegant, refined, exclusive",
  },
  legal: {
    fontPairing: "frauncesLora",
    scaleRatio: 1.125, // Major Second — subtle
    baseSize: 1,
    headingWeight: 600,
    bodyWeight: 400,
    headingStyle: "normal",
    opentype: { ligatures: "common", numericFigure: "oldstyle" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "75ch", // Wide for dense legal text
    mood: "authoritative, traditional, trustworthy",
  },
  creative: {
    fontPairing: "syneInter",
    scaleRatio: 1.333, // Perfect Fourth — bold
    baseSize: 1,
    headingWeight: 800,
    bodyWeight: 400,
    headingStyle: "normal",
    opentype: { ligatures: "all" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "65ch",
    mood: "expressive, bold, dynamic",
  },
  ecommerce: {
    fontPairing: "poppinsInter",
    scaleRatio: 1.25, // Major Third — noticeable
    baseSize: 1,
    headingWeight: 600,
    bodyWeight: 400,
    headingStyle: "normal",
    opentype: { ligatures: "common", numericSpacing: "tabular" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "65ch",
    mood: "friendly, approachable, clear",
  },
  healthcare: {
    fontPairing: "manropeMono",
    scaleRatio: 1.2,
    baseSize: 1.0625, // Slightly larger for accessibility
    headingWeight: 600,
    bodyWeight: 400,
    headingStyle: "normal",
    opentype: { ligatures: "common" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "65ch",
    mood: "calm, trustworthy, accessible",
  },
  education: {
    fontPairing: "outfitDmSans",
    scaleRatio: 1.2,
    baseSize: 1.0625,
    headingWeight: 700,
    bodyWeight: 400,
    headingStyle: "normal",
    opentype: { ligatures: "common" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "65ch",
    mood: "clear, organized, approachable",
  },
  restaurant: {
    fontPairing: "playfairDmSans",
    scaleRatio: 1.333,
    baseSize: 1,
    headingWeight: 700,
    bodyWeight: 400,
    headingStyle: "italic", // Italic headings for restaurant menus
    opentype: { ligatures: "all", caps: "small-caps" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "50ch", // Short for menu items
    mood: "warm, inviting, appetizing",
  },
  finance: {
    fontPairing: "spaceGrotesk",
    scaleRatio: 1.125,
    baseSize: 0.9375,
    headingWeight: 600,
    bodyWeight: 400,
    headingStyle: "normal",
    opentype: {
      ligatures: "common",
      numericSpacing: "tabular",
      numericFigure: "lining",
    },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "70ch",
    mood: "professional, precise, trustworthy",
  },
  nonprofit: {
    fontPairing: "outfitDmSans",
    scaleRatio: 1.25,
    baseSize: 1.0625,
    headingWeight: 700,
    bodyWeight: 400,
    headingStyle: "normal",
    opentype: { ligatures: "common" },
    textWrap: { heading: "balance", body: "pretty" },
    maxProse: "65ch",
    mood: "warm, compassionate, clear",
  },
};
```

### 12.2 AI Heading Level Enforcement

The AI Designer must enforce proper heading hierarchy to avoid accessibility violations:

```typescript
// Rules for AI-generated heading levels
const HEADING_RULES = {
  // 1. Only ONE h1 per page — the page title
  maxH1PerPage: 1,

  // 2. Never skip levels (h1 → h3 without h2)
  enforceSequential: true,

  // 3. Section hierarchy mapping
  pageTitle: 1, // h1 — one per page
  sectionTitle: 2, // h2 — major sections
  subsectionTitle: 3, // h3 — within a major section
  cardTitle: 3, // h3 — cards are typically subsection-level
  featureTitle: 3, // h3
  footerHeading: 4, // h4 — footer column headings
  sidebarHeading: 4, // h4 — sidebar section headings
  widgetTitle: 5, // h5 — small widget headings

  // 4. Context rules
  heroSection: { heading: 1, subheading: "p" }, // Hero subtitle is NOT a heading
  featureGrid: { heading: 2, items: 3 },
  testimonialSection: { heading: 2, quotes: null }, // Quotes don't need headings
  ctaSection: { heading: 2, subtext: "p" }, // CTA subtext is paragraph
};
```

### 12.3 AI Typography Quality Scoring

The AI should score its own typography output before finalizing:

```typescript
interface TypographyQualityScore {
  hierarchy: number; // 0-100 — heading level sequence, size differentiation
  readability: number; // 0-100 — line length, line height, font size, contrast
  rhythm: number; // 0-100 — consistent spacing, vertical rhythm alignment
  pairing: number; // 0-100 — heading/body font compatibility
  performance: number; // 0-100 — font count, weight count, total payload
  accessibility: number; // 0-100 — WCAG contrast, minimum sizes, semantic headings
  overall: number; // Weighted average
}

function scoreTypography(
  config: AITypographyOutput,
  site: SiteData,
): TypographyQualityScore {
  const hierarchy = scoreHierarchy(config); // Check level sequence, size ratios
  const readability = scoreReadability(config); // Check measure, leading, sizing
  const rhythm = scoreRhythm(config); // Check spacing consistency
  const pairing = scorePairing(config); // Check font compatibility
  const performance = scorePerformance(config); // Check payload, family count
  const accessibility = scoreAccessibility(config); // Check WCAG compliance

  return {
    hierarchy,
    readability,
    rhythm,
    pairing,
    performance,
    accessibility,
    overall:
      hierarchy * 0.2 +
      readability * 0.25 +
      rhythm * 0.15 +
      pairing * 0.15 +
      performance * 0.1 +
      accessibility * 0.15,
  };
}
```

### 12.4 Converter Integration

The converter (`converter.ts`) must be updated to pass all new props through:

```typescript
// Current type mappings (already working):
// Heading → Heading, Text → Text, RichText → RichText, Quote → Quote
// ContentBlock → RichText, QuoteBlock → Quote, etc.

// NEW mappings needed:
// Label → Label, List → List, CodeBlock → CodeBlock
// DisplayText → DisplayText, DividerText → DividerText
// StatNumber → StatNumber, Stat → StatNumber, Statistic → StatNumber

// Ensure ALL typography props pass through (not just basic ones):
// fontFamily, fontSize, fontWeight, lineHeight, letterSpacing,
// textTransform, textDecoration, textShadow, textWrap, opentype, etc.
```

### 12.5 AI Prompt Enhancement for Typography

The AI Designer prompts must be updated to include typography-specific instructions:

```markdown
## Typography Rules for AI Website Designer

1. **Type Scale:** Use the configured scale ratio. Never hardcode font sizes — use scale tokens (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl).

2. **Font Families:** Only use the configured heading and body fonts. Never introduce a third font unless explicitly requested.

3. **Heading Hierarchy:**
   - One H1 per page (page title only)
   - Sections start with H2
   - Subsections use H3
   - Never skip levels (H2 → H4)
   - Use Label component for eyebrows/kickers above headings, not small headings

4. **Body Text:**
   - Minimum size: `base` (never use `xs` for body paragraphs)
   - Maximum width: `65ch` (prose measure) for readable paragraphs
   - Line height: `normal` (1.5) for body, `tight` (1.15) for headings

5. **Color:**
   - Never hardcode text colors — use `inherit` or theme variables
   - Ensure 4.5:1 contrast ratio for body text (WCAG AA)
   - Ensure 3:1 contrast ratio for large text (≥24px or ≥19px bold)

6. **Spacing:**
   - Use rhythm-based spacing between text elements
   - Headings: more space above (separates from previous section), less below (groups with content)

7. **Quote Usage:**
   - Select variant by context: `bordered` for editorial, `testimonial` for social proof, `pullquote` for long-form articles
   - Always include attribution when available

8. **RichText Usage:**
   - Use for long-form content blocks (articles, about sections, documentation)
   - Use Heading+Text for short-form (hero, CTA, feature descriptions)

9. **Label Usage:**
   - `eyebrow` for category indicators above headings
   - `kicker` for attention-grabbing labels (NEW, FEATURED)
   - `caption` for image attributions
   - `meta` for article metadata (date, read time)
```

---

## 13. Registry & Registration Requirements

### 13.1 Registration Pattern

Every typography component must be registered in `core-components.ts` following the standard pattern:

```typescript
// Template for typography component registration
{
  type: 'ComponentName',
  name: 'Component Name',
  description: 'Clear description for AI and users',
  category: 'typography' | 'content',
  icon: 'Type' | 'AlignLeft' | 'Quote' | 'Code' | 'Hash',
  fieldGroups: [
    {
      name: 'Content',
      fields: [ /* content fields */ ],
    },
    {
      name: 'Typography',
      fields: [ /* font, size, weight, line height, etc. */ ],
    },
    {
      name: 'Style',
      fields: [ /* colors, decorations, effects */ ],
    },
    {
      name: 'Layout',
      fields: [ /* alignment, max-width, margins */ ],
    },
    {
      name: 'Advanced',
      fields: [ /* OpenType, animation, special effects */ ],
    },
  ],
}
```

### 13.2 HeadingRender Registration (Complete)

```typescript
{
  type: 'Heading',
  name: 'Heading',
  description: 'Semantic heading (H1-H6) with type scale sizing, gradient text, and full typographic control. Use H1 for page title (one per page), H2 for sections, H3+ for subsections.',
  category: 'typography',
  icon: 'Type',
  fieldGroups: [
    {
      name: 'Content',
      fields: [
        { name: 'text', type: 'text', label: 'Text', required: true, description: 'Heading content' },
        { name: 'level', type: 'select', label: 'Level', options: ['1','2','3','4','5','6'], defaultValue: '2', description: 'Semantic heading level (H1-H6)' },
        { name: 'id', type: 'text', label: 'Anchor ID', description: 'For in-page navigation links' },
      ],
    },
    {
      name: 'Typography',
      fields: [
        { name: 'fontFamily', type: 'select', label: 'Font Family', options: ['Inherit from Brand', 'heading', 'body', 'Inter', 'Poppins', 'Playfair Display', ...], defaultValue: 'heading' },
        { name: 'fontSize', type: 'select', label: 'Font Size', options: ['auto', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'], defaultValue: 'auto' },
        { name: 'fontWeight', type: 'select', label: 'Font Weight', options: ['100','200','300','400','500','600','700','800','900'], defaultValue: '700' },
        { name: 'lineHeight', type: 'select', label: 'Line Height', options: ['auto', 'tight', 'snug', 'normal', 'relaxed', 'loose'], defaultValue: 'auto' },
        { name: 'letterSpacing', type: 'select', label: 'Letter Spacing', options: ['auto', 'tighter', 'tight', 'normal', 'wide', 'wider', 'widest'], defaultValue: 'auto' },
        { name: 'textTransform', type: 'select', label: 'Transform', options: ['none', 'uppercase', 'lowercase', 'capitalize'], defaultValue: 'none' },
      ],
    },
    {
      name: 'Style',
      fields: [
        { name: 'color', type: 'color', label: 'Text Color', defaultValue: 'inherit' },
        { name: 'gradient', type: 'boolean', label: 'Gradient Text', defaultValue: false },
        { name: 'gradientFrom', type: 'color', label: 'Gradient From', showWhen: { gradient: true } },
        { name: 'gradientTo', type: 'color', label: 'Gradient To', showWhen: { gradient: true } },
        { name: 'gradientDirection', type: 'select', label: 'Gradient Direction', options: ['to-r','to-l','to-t','to-b','to-br','to-bl','to-tr','to-tl'], defaultValue: 'to-r', showWhen: { gradient: true } },
        { name: 'textShadow', type: 'text', label: 'Text Shadow' },
        { name: 'textDecoration', type: 'select', label: 'Decoration', options: ['none','underline','line-through'], defaultValue: 'none' },
      ],
    },
    {
      name: 'Layout',
      fields: [
        { name: 'align', type: 'select', label: 'Alignment', options: ['left','center','right'], defaultValue: 'left' },
        { name: 'marginBottom', type: 'select', label: 'Bottom Margin', options: ['none','small','medium','large','xlarge'], defaultValue: 'medium' },
        { name: 'maxWidth', type: 'select', label: 'Max Width', options: ['none','sm','md','lg','xl','prose'], defaultValue: 'none' },
        { name: 'textWrap', type: 'select', label: 'Text Wrap', options: ['auto','balance','nowrap'], defaultValue: 'balance' },
      ],
    },
  ],
}
```

### 13.3 Critical Registry Fixes (Existing Components)

| Component | Fix Type               | Before                                                                                | After                                                       |
| --------- | ---------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Heading   | **Add missing fields** | 4 fields (text, level, alignment, color)                                              | 20+ fields (all typography, style, layout fields)           |
| Heading   | **Fix field name**     | `alignment`                                                                           | `align` (matches render prop)                               |
| Quote     | **Fix field name**     | `style`                                                                               | `variant` (matches render prop)                             |
| Quote     | **Fix field name**     | `source`                                                                              | `authorTitle` (matches render prop)                         |
| Quote     | **Add missing fields** | 4 fields (text, author, style, source)                                                | 15+ fields (all variant, typography, visual, layout fields) |
| RichText  | **Add missing fields** | Missing proseSize, subtitleColor, pullQuoteColor, highlightColor, cardBackgroundColor | All props exposed                                           |

### 13.4 New Component Registrations Needed

| Component   | Type Key      | Category   | Priority |
| ----------- | ------------- | ---------- | -------- |
| Label       | `Label`       | typography | Phase 2  |
| List        | `List`        | content    | Phase 2  |
| DisplayText | `DisplayText` | typography | Phase 2  |
| CodeBlock   | `CodeBlock`   | content    | Phase 3  |
| DividerText | `DividerText` | decoration | Phase 3  |
| StatNumber  | `StatNumber`  | content    | Phase 3  |

### 13.5 Component Metadata Enhancement

Update `component-metadata.ts` with detailed AI descriptions:

```typescript
const TYPOGRAPHY_METADATA = {
  Heading: {
    description:
      "Semantic heading (H1-H6) with type scale sizing, gradient text, and full typographic control.",
    category: "typography",
    usageGuidelines:
      "Use H1 for page title (one per page). H2 for sections. H3 for subsections. Never skip levels. Use level-appropriate font sizing from the type scale.",
    pairsWellWith: ["Text", "Label", "DividerText"],
    avoidWith: ["DisplayText"], // Don't mix semantic headings and display text
  },
  Text: {
    description:
      "Body text paragraph with full typographic control including font family, size, weight, line height, decorations, and multi-column layout.",
    category: "typography",
    usageGuidelines:
      'Use for body paragraphs, descriptions, and any running text. Set maxWidth to "prose" for readable line lengths. Default font size is "base" (1rem).',
    pairsWellWith: ["Heading", "Label", "Quote"],
  },
  RichText: {
    description:
      "Long-form content block with title, subtitle, pull quote, and markdown body. Supports multiple layouts including centered, left-aligned, two-column, and asymmetric.",
    category: "content",
    usageGuidelines:
      "Use for article-style content, about sections, and documentation blocks. For short text (1-2 paragraphs), prefer Heading+Text combination instead.",
    pairsWellWith: ["DividerText", "Quote"],
  },
  Quote: {
    description:
      "Blockquote with attribution, author image, and multiple variants (simple, bordered, card, modern, pullquote, testimonial).",
    category: "content",
    usageGuidelines:
      'Select variant by context: "bordered" for editorial, "testimonial" for social proof with avatar, "pullquote" for emphasis in long-form articles, "modern" for clean minimal style.',
    pairsWellWith: ["RichText", "Text"],
  },
  Label: {
    description:
      "Small text utility for captions, eyebrows, badges, and metadata. Not for body text — use Text component for that.",
    category: "typography",
    usageGuidelines:
      'Use "eyebrow" variant above headings to indicate category. "kicker" for attention labels. "caption" under images. "meta" for timestamps and read times. "badge" for status indicators.',
    pairsWellWith: ["Heading", "Image"],
  },
  DisplayText: {
    description:
      "Oversized decorative text for heroes and banners. NOT semantically a heading — purely visual. Use Heading component for semantic headings.",
    category: "typography",
    usageGuidelines:
      "Use for maximum visual impact in hero sections. Supports text stroke (outline), gradient, and split-reveal animation. Pair with a semantic Heading (visually hidden if needed) for accessibility.",
    pairsWellWith: ["Label", "Text"],
    avoidWith: ["Heading"], // Use one or the other, not both visible
  },
};
```

---

## 14. Accessibility & WCAG Compliance

### 14.1 WCAG 2.1 AA Requirements for Typography

| Criterion                      | Requirement                                                                                       | How We Enforce                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **1.3.1** Headings             | Heading hierarchy must be sequential (no skipping)                                                | AI Designer enforces; validate at render time          |
| **1.4.1** Color                | Color must not be only visual cue                                                                 | Never use color alone for meaning; pair with text/icon |
| **1.4.3** Contrast (minimum)   | 4.5:1 for normal text, 3:1 for large text (≥24px or ≥19px bold)                                   | Validate at render time when both colors known         |
| **1.4.4** Resize               | Text must scale to 200% without loss                                                              | Fluid typography + rem units handles this              |
| **1.4.8** Visual Presentation  | Line length ≤80ch, line spacing ≥1.5×, paragraph spacing ≥2×, no justify without hyphenation      | Defaults enforce all four                              |
| **1.4.10** Reflow              | Content reflows at 320px width                                                                    | Fluid typography + single-column mobile                |
| **1.4.12** Text Spacing        | Must tolerate: line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em | No overflow or clipping at these spacings              |
| **2.4.2** Page Titled          | Page has descriptive title                                                                        | Site settings require page title                       |
| **2.4.6** Headings Descriptive | Headings describe topic or purpose                                                                | AI quality scoring evaluates heading text              |

### 14.2 Contrast Checking at Render Time

```typescript
// Utility function to check WCAG contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(hexToRgb(color1));
  const lum2 = getRelativeLuminance(hexToRgb(color2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkTypographyContrast(
  textColor: string,
  backgroundColor: string,
  fontSize: number, // in px
  fontWeight: number,
): { passes: boolean; ratio: number; required: number; level: string } {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const isLargeText =
    fontSize >= 24 || (fontSize >= 18.67 && fontWeight >= 700);
  const required = isLargeText ? 3.0 : 4.5;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
    level: isLargeText ? "AA Large" : "AA Normal",
  };
}
```

### 14.3 Semantic HTML Requirements

| Component   | Semantic Element                           | ARIA Considerations                                                                             |
| ----------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Heading     | `<h1>` – `<h6>`                            | Must use correct level; `role="heading"` + `aria-level` only when semantic heading not possible |
| Text        | `<p>`, `<span>`, `<div>`                   | `<p>` for paragraphs; `<span>` for inline; use `<time datetime="">` for dates                   |
| RichText    | `<article>` wrapper                        | `<article>` when standalone; `<section>` when part of larger content                            |
| Quote       | `<blockquote>` + `<figcaption>`            | Wrap in `<figure>` when attribution present; `cite` attribute for source URL                    |
| Label       | `<span>`, `<small>`, `<figcaption>`        | Use `<small>` for fine print; `<figcaption>` for image captions; `aria-label` when cryptic      |
| List        | `<ul>`, `<ol>`                             | Maintain semantic list structure; `aria-label` for navigation lists                             |
| CodeBlock   | `<pre><code>`                              | `aria-label="Code example in [language]"`                                                       |
| DisplayText | `<div aria-hidden="true">` + hidden `<h1>` | Decorative — screen readers should read the semantic heading, not the display text              |
| StatNumber  | `<div>` with `aria-label`                  | `aria-label="500 plus clients"` for "500+" display                                              |

### 14.4 Screen Reader Considerations

```typescript
// For DisplayText — provide accessible alternative
const DisplayText = ({ text, accessibleLabel, ...props }: DisplayTextProps) => (
  <>
    {/* Screen reader only */}
    <span className="sr-only">{accessibleLabel || text}</span>
    {/* Visual only */}
    <div aria-hidden="true" {...displayStyles}>
      {text}
    </div>
  </>
);

// For StatNumber — read value naturally
const StatNumber = ({ value, prefix, suffix, label }: StatNumberProps) => (
  <div aria-label={`${prefix || ''}${value}${suffix || ''} ${label || ''}`}>
    <span aria-hidden="true" className="stat-value">
      {prefix}{value}{suffix}
    </span>
    {label && <span aria-hidden="true" className="stat-label">{label}</span>}
  </div>
);
```

### 14.5 Focus Visible Styles for Text Links

```css
/* Links within typography blocks must have visible focus indicators */
.prose a:focus-visible,
.rich-text a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
  text-decoration: none; /* Remove underline when focus ring visible */
}
```

---

## 15. Performance & Font Loading

### 15.1 Performance Budget

| Metric                   | Target                       | Current                       | Impact                                        |
| ------------------------ | ---------------------------- | ----------------------------- | --------------------------------------------- |
| Total font payload       | < 100KB (WOFF2)              | ~150-300KB (5 static weights) | Variable fonts: ~50-80KB single file          |
| Font families loaded     | ≤ 2                          | 2 (heading + body)            | Already on target ✅                          |
| Font weights per family  | ≤ 4 (static) or 1 (variable) | 5 static (300-700)            | Smart weight detection reduces to 3-4         |
| CLS from fonts           | < 0.05                       | Unknown (no size-adjust)      | size-adjust fallbacks → near-zero CLS         |
| Time to first text paint | < 1s                         | Dependent on network          | `font-display: swap` ensures immediate render |
| Time to correct font     | < 3s                         | Dependent on network          | Preconnect + variable fonts speed this up     |

### 15.2 Font Loading Strategy (Priority Order)

```
1. Preconnect to font servers (in <head>)
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

2. Generate metric-matched fallback @font-face (in <style>)
   @font-face { font-family: 'InterFallback'; src: local('Arial'); size-adjust: 107%; ... }

3. Set CSS variables with fallback stack
   --font-body: 'Inter', 'InterFallback', system-ui, sans-serif;

4. Load actual font file (in <link>)
   <link href="https://fonts.googleapis.com/.../Inter:wght@400;600;700&display=swap" rel="stylesheet">

5. font-display: swap → text visible immediately in fallback → swaps when loaded
```

### 15.3 Google Fonts Optimization

```typescript
// Current (wasteful):
`https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap`
// ↑ Loads 5 static weights = ~150KB

// Target — Variable font (if available):
`https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap`
// ↑ Single variable file with full range = ~80KB (includes italic!)

// Target — Static font (when variable not available):
`https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap`;
// ↑ Only the weights actually used on the site
```

### 15.4 Self-Hosting Option (GDPR Compliance)

For EU customers who need GDPR compliance (Google Fonts sends user IP to Google):

```typescript
// Option 1: Bunny Fonts (privacy-respecting Google Fonts mirror)
const bunnyFontsUrl = googleFontsUrl.replace(
  "https://fonts.googleapis.com",
  "https://fonts.bunny.net",
);

// Option 2: Download and self-host via Supabase Storage
// - Download WOFF2 files during site setup
// - Upload to Supabase storage (font-assets bucket)
// - Generate @font-face pointing to Supabase CDN URLs
```

### 15.5 Font Subsetting

```typescript
// For Latin-only sites, use &subset=latin to reduce payload by 60-80%
const subset = site.language === "en" ? "&subset=latin" : "";
const url = `https://fonts.googleapis.com/css2?family=Inter:wght@400;700${subset}&display=swap`;

// For multi-language sites, Google automatically serves appropriate subsets
// via unicode-range in the CSS response
```

### 15.6 Monitoring & Diagnostics

```typescript
// Font loading performance monitoring (optional, in development)
if (typeof document !== "undefined" && document.fonts) {
  document.fonts.ready.then(() => {
    const fontLoadTime = performance.now();
    console.debug(
      `[Typography] All fonts loaded in ${fontLoadTime.toFixed(0)}ms`,
    );

    // Check which fonts actually loaded
    const families = ["Inter", "Playfair Display"];
    families.forEach((family) => {
      const loaded = document.fonts.check(`16px "${family}"`);
      if (!loaded)
        console.warn(
          `[Typography] Font "${family}" failed to load — using fallback`,
        );
    });
  });
}
```

---

## 16. Implementation Phases

### 16.1 Phase Overview

| Phase       | Name                   | Duration | Key Deliverables                                              |
| ----------- | ---------------------- | -------- | ------------------------------------------------------------- |
| **Phase 1** | Foundation             | 2 weeks  | CSS variable system, type scale injection, registry fixes     |
| **Phase 2** | Component Upgrades     | 3 weeks  | Heading V2, Text V2, RichText V2, Quote V2, Label, List       |
| **Phase 3** | New Components         | 2 weeks  | DisplayText, CodeBlock, DividerText, StatNumber               |
| **Phase 4** | Advanced Typography    | 2 weeks  | Fluid typography, variable fonts, OpenType features           |
| **Phase 5** | AI Intelligence Bridge | 2 weeks  | Typography intelligence → component defaults, quality scoring |
| **Phase 6** | Performance & Polish   | 1 week   | Font loading optimization, CLS prevention, print styles       |

### 16.2 Phase 1 — Foundation

**Goal:** Establish the CSS variable type system that all components consume.

#### 16.2.1 Step-by-Step Plan

| Step | Task                            | Description                                                          | Files                        |
| ---- | ------------------------------- | -------------------------------------------------------------------- | ---------------------------- |
| 1.1  | Define CSS variable schema      | Create the full set of `--type-*` CSS variables                      | `globals.css`                |
| 1.2  | Type scale generator function   | Build function that produces CSS variables from config               | `typography-intelligence.ts` |
| 1.3  | Inject type scale into renderer | Add type scale CSS variables to `renderer.tsx`                       | `renderer.tsx`               |
| 1.4  | Fix Heading registry            | Expand fields from 4 → 20+, rename `alignment` → `align`             | `core-components.ts`         |
| 1.5  | Fix Quote registry              | Rename `style` → `variant`, `source` → `authorTitle`, add new fields | `core-components.ts`         |
| 1.6  | Fix RichText registry           | Add missing props (proseSize, colors, etc.)                          | `core-components.ts`         |
| 1.7  | Update converter aliases        | Add new component aliases and field mappings                         | `converter.ts`               |

#### 16.2.2 CSS Variable Schema

```css
/* Type Scale (injected per-site from typography-intelligence config) */
:root {
  /* Scale sizes — values set by type scale generator */
  --type-xs: clamp(0.64rem, 0.17vi + 0.6rem, 0.75rem);
  --type-sm: clamp(0.8rem, 0.25vi + 0.74rem, 0.96rem);
  --type-base: clamp(1rem, 0.35vi + 0.91rem, 1.22rem);
  --type-lg: clamp(1.25rem, 0.49vi + 1.12rem, 1.56rem);
  --type-xl: clamp(1.56rem, 0.69vi + 1.37rem, 2rem);
  --type-2xl: clamp(1.95rem, 0.98vi + 1.66rem, 2.56rem);
  --type-3xl: clamp(2.44rem, 1.38vi + 2.01rem, 3.28rem);
  --type-4xl: clamp(3.05rem, 1.93vi + 2.42rem, 4.21rem);
  --type-5xl: clamp(3.81rem, 2.69vi + 2.91rem, 5.39rem);

  /* Line heights per scale step */
  --type-leading-xs: 1.6;
  --type-leading-sm: 1.5;
  --type-leading-base: 1.6;
  --type-leading-lg: 1.4;
  --type-leading-xl: 1.3;
  --type-leading-2xl: 1.2;
  --type-leading-3xl: 1.15;
  --type-leading-4xl: 1.1;
  --type-leading-5xl: 1.05;

  /* Letter spacing per scale step (tighter for larger sizes) */
  --type-tracking-xs: 0.01em;
  --type-tracking-sm: 0;
  --type-tracking-base: 0;
  --type-tracking-lg: -0.01em;
  --type-tracking-xl: -0.015em;
  --type-tracking-2xl: -0.02em;
  --type-tracking-3xl: -0.025em;
  --type-tracking-4xl: -0.03em;
  --type-tracking-5xl: -0.035em;

  /* Heading level → scale step mapping */
  --type-h1: var(--type-4xl);
  --type-h2: var(--type-3xl);
  --type-h3: var(--type-2xl);
  --type-h4: var(--type-xl);
  --type-h5: var(--type-lg);
  --type-h6: var(--type-base);

  /* Spacing rhythm */
  --type-space-xs: 0.25rem;
  --type-space-sm: 0.5rem;
  --type-space-md: 1rem;
  --type-space-lg: 1.5rem;
  --type-space-xl: 2rem;
  --type-space-2xl: 3rem;
  --type-space-3xl: 4rem;

  /* Prose defaults */
  --type-measure: 65ch;
  --type-indent: 0;
  --type-paragraph-spacing: var(--type-space-md);
}
```

#### 16.2.3 Completion Criteria

- [ ] All 9 `--type-*` size variables produce correct `clamp()` values
- [ ] Type scale CSS variables injected into every rendered page
- [ ] Heading registry: 20+ fields, `alignment` renamed to `align`
- [ ] Quote registry: `style` → `variant`, `source` → `authorTitle`, 15+ fields
- [ ] RichText registry: all missing color/size props exposed
- [ ] Converter handles all new field names and aliases
- [ ] No breaking changes — existing sites render identically

### 16.3 Phase 2 — Component Upgrades + Label & List

**Goal:** Upgrade all 4 existing typography components and add Label + List.

#### 16.3.1 Step-by-Step Plan

| Step | Task                                                                                                       | Files                                |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 2.1  | HeadingRender V2 — consume CSS variables, add all new props                                                | `renders.tsx`                        |
| 2.2  | HeadingRender V2 — smart defaults per level (fontSize, lineHeight, letterSpacing, fontWeight)              | `renders.tsx`                        |
| 2.3  | HeadingRender V2 — gradient refactor (configurable direction, via/to colors)                               | `renders.tsx`                        |
| 2.4  | HeadingRender V2 — textWrap: balance, maxWidth, marginBottom                                               | `renders.tsx`                        |
| 2.5  | TextRender V2 — add drop cap, multi-column, text-wrap support                                              | `renders.tsx`                        |
| 2.6  | TextRender V2 — consume type scale CSS variables for font sizes                                            | `renders.tsx`                        |
| 2.7  | RichTextRender V2 — replace hardcoded #1c2b2a with theme-aware colors                                      | `renders.tsx`                        |
| 2.8  | RichTextRender V2 — upgrade markdown parser for headings, code blocks, images                              | `renders.tsx`                        |
| 2.9  | RichTextRender V2 — add title level control (h2-h4 configurable)                                           | `renders.tsx`                        |
| 2.10 | QuoteRender V2 — implement "modern" variant (currently listed but not rendered)                            | `renders.tsx`                        |
| 2.11 | QuoteRender V2 — add "pullquote" and "testimonial" variants                                                | `renders.tsx`                        |
| 2.12 | QuoteRender V2 — fix prop mismatches (variant/authorTitle)                                                 | `renders.tsx`                        |
| 2.13 | LabelRender — new component with 7 variants                                                                | `renders.tsx`                        |
| 2.14 | Label — registry registration + converter alias                                                            | `core-components.ts`, `converter.ts` |
| 2.15 | ListRender — new component with 7 variants (ordered, unordered, icon, check, timeline, definition, inline) | `renders.tsx`                        |
| 2.16 | List — registry registration + converter alias                                                             | `core-components.ts`, `converter.ts` |

#### 16.3.2 Completion Criteria

- [ ] HeadingRender uses `var(--type-h1)` through `var(--type-h6)` when `fontSize: 'auto'`
- [ ] HeadingRender `text-wrap: balance` applied by default
- [ ] TextRender drop cap works with first-letter pseudo-element
- [ ] RichTextRender has zero hardcoded color values
- [ ] QuoteRender "modern" variant renders correctly
- [ ] QuoteRender "pullquote" and "testimonial" variants render correctly
- [ ] LabelRender all 7 variants render and are accessible
- [ ] ListRender all 7 variants render with semantic `<ul>`/`<ol>` elements
- [ ] All components registered in registry with full field definitions
- [ ] Converter maps all new types and field names
- [ ] Existing sites render identically (backward compatible)

### 16.4 Phase 3 — New Components

**Goal:** Add DisplayText, CodeBlock, DividerText, StatNumber.

#### 16.4.1 Step-by-Step Plan

| Step | Task                                                                                     | Files                                |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| 3.1  | DisplayTextRender — oversized decorative text with stroke/gradient/animation             | `renders.tsx`                        |
| 3.2  | DisplayText — full props interface, accessibility (aria-hidden + sr-only)                | `renders.tsx`                        |
| 3.3  | DisplayText — registry + converter                                                       | `core-components.ts`, `converter.ts` |
| 3.4  | CodeBlockRender — syntax highlighted code with copy button                               | `renders.tsx`                        |
| 3.5  | CodeBlock — theme-aware (dark mode colors), language detection                           | `renders.tsx`                        |
| 3.6  | CodeBlock — registry + converter                                                         | `core-components.ts`, `converter.ts` |
| 3.7  | DividerTextRender — horizontal rule with centered/offset text                            | `renders.tsx`                        |
| 3.8  | DividerText — 5 styles (line, dots, gradient, fade, double)                              | `renders.tsx`                        |
| 3.9  | DividerText — registry + converter                                                       | `core-components.ts`, `converter.ts` |
| 3.10 | StatNumberRender — animated counting number with label                                   | `renders.tsx`                        |
| 3.11 | StatNumber — intersection observer trigger, formatting (comma, percentage, abbreviation) | `renders.tsx`                        |
| 3.12 | StatNumber — registry + converter                                                        | `core-components.ts`, `converter.ts` |

#### 16.4.2 Completion Criteria

- [ ] DisplayText renders with text-stroke, gradient, and split-reveal animation
- [ ] DisplayText has accessible sr-only alternative text
- [ ] CodeBlock renders with syntax highlighting for at least 10 languages
- [ ] CodeBlock copy button copies to clipboard with feedback
- [ ] DividerText renders all 5 line styles
- [ ] StatNumber animates from 0 to target value on scroll into view
- [ ] All 4 new components registered in registry with full field definitions
- [ ] All 4 new components have converter aliases
- [ ] `prefers-reduced-motion` disables all text animations

### 16.5 Phase 4 — Advanced Typography Features

**Goal:** Implement fluid typography, variable font support, and OpenType features.

#### 16.5.1 Step-by-Step Plan

| Step | Task                                                                                               | Files                        |
| ---- | -------------------------------------------------------------------------------------------------- | ---------------------------- |
| 4.1  | Fluid type scale generator — produce `clamp()` values from ratio + viewport range                  | `typography-intelligence.ts` |
| 4.2  | Variable font detection — check if selected font has variable version                              | `brand-colors.ts`            |
| 4.3  | Variable font URL generation — produce `wght@100..900` syntax for Google Fonts                     | `brand-colors.ts`            |
| 4.4  | OpenType feature interface — `OpenTypeOptions` type with feature toggles                           | `renders.tsx`                |
| 4.5  | OpenType CSS generation — convert feature options to `font-feature-settings`                       | `renders.tsx`                |
| 4.6  | Dark mode typography tweaks — lighter weights, increased tracking, soft whites                     | `renders.tsx`                |
| 4.7  | Font fallback generation — `size-adjust`, `ascent-override`, `descent-override` for fallback stack | `brand-colors.ts`            |
| 4.8  | Container query typography — type scale responds to container width, not viewport                  | `renders.tsx`                |

#### 16.5.2 Completion Criteria

- [ ] Fluid `clamp()` values generated correctly for all 8 supported ratios
- [ ] Variable fonts loaded when available (single file vs 5 statics)
- [ ] OpenType features togglable per-component via `openType` prop
- [ ] Dark mode applies `font-weight` reduction and `letter-spacing` increase automatically
- [ ] Font fallback metrics produce CLS < 0.05
- [ ] Container query typography works in components with explicit container context

### 16.6 Phase 5 — AI Intelligence Bridge

**Goal:** Connect typography-intelligence.ts output to component defaults.

#### 16.6.1 Step-by-Step Plan

| Step | Task                                                                                     | Files                        |
| ---- | ---------------------------------------------------------------------------------------- | ---------------------------- |
| 5.1  | Enhanced AI output interface — add all new typography fields to generated output         | `typography-intelligence.ts` |
| 5.2  | Industry-specific rules — implement full rule sets for all 10 industries                 | `typography-intelligence.ts` |
| 5.3  | Heading level enforcement — AI validates proper H1-H6 structure per page                 | `converter.ts`               |
| 5.4  | Typography quality scoring — score and warn on poor typography choices                   | `typography-intelligence.ts` |
| 5.5  | Converter typography defaults — apply AI typography config as defaults during conversion | `converter.ts`               |
| 5.6  | Prompt enhancement — add typography context to AI prompts for better generation          | AI prompt files              |

#### 16.6.2 Completion Criteria

- [ ] AI Designer output includes `fontSizeFluid`, `lineHeight`, `letterSpacing`, `textWrap`, `openType`
- [ ] All 10 industry rule sets produce appropriate typography configurations
- [ ] AI never generates pages with skipped heading levels
- [ ] Quality score flags: contrast issues, missing font fallbacks, >80ch line length, wrong heading order
- [ ] Converter applies AI typography config as component defaults

### 16.7 Phase 6 — Performance & Polish

**Goal:** Optimize font loading, prevent CLS, add print typography.

#### 16.7.1 Step-by-Step Plan

| Step | Task                                                              | Files                          |
| ---- | ----------------------------------------------------------------- | ------------------------------ |
| 6.1  | Implement font subsetting for Latin-only sites                    | `brand-colors.ts`              |
| 6.2  | Add `<link rel="preconnect">` for Google Fonts                    | `renderer.tsx`                 |
| 6.3  | Generate metric-matched `@font-face` fallbacks with `size-adjust` | `brand-colors.ts`              |
| 6.4  | Implement smart weight detection — only load weights used on site | `brand-colors.ts`              |
| 6.5  | Add print stylesheet for typography                               | `globals.css`                  |
| 6.6  | GDPR-compliant font hosting option (Bunny Fonts / self-host)      | Settings UI, `brand-colors.ts` |
| 6.7  | Font loading monitoring and diagnostics (dev mode only)           | `renderer.tsx`                 |

#### 16.7.2 Completion Criteria

- [ ] Font payload < 100KB for typical 2-family site
- [ ] CLS from font loading < 0.05
- [ ] Print styles: black on white, no gradients, expanded abbreviations, visible URLs
- [ ] GDPR option available in site settings
- [ ] Dev mode shows font loading timing and fallback usage

---

## 17. Testing & Quality Gates

### 17.1 Testing Strategy Overview

| Layer             | Tools                        | Coverage Target                                          |
| ----------------- | ---------------------------- | -------------------------------------------------------- |
| Unit Tests        | Vitest                       | 100% of props, defaults, and edge cases                  |
| Visual Regression | Playwright + Percy/Chromatic | All component variants × dark/light × mobile/desktop     |
| Accessibility     | axe-core (via Playwright)    | Zero violations on all components                        |
| Performance       | Lighthouse CI                | Font loading < 3s, CLS < 0.05                            |
| Integration       | Playwright E2E               | Full render pipeline: AI → converter → renderer → screen |

### 17.2 Unit Tests — Per Component

#### 17.2.1 HeadingRender Tests

```typescript
describe('HeadingRender', () => {
  // Semantic levels
  test.each([1, 2, 3, 4, 5, 6])('renders <h%i> for level %i', (level) => {
    const { container } = render(<HeadingRender text="Test" level={level} />);
    expect(container.querySelector(`h${level}`)).toBeTruthy();
  });

  // Smart defaults
  test('applies font-size from type scale when fontSize is "auto"', () => {
    // level 1 → var(--type-h1), level 2 → var(--type-h2), etc.
  });
  test('applies text-wrap: balance by default', () => {});
  test('applies tighter letter-spacing for higher levels', () => {});

  // Gradient text
  test('renders gradient when gradient=true', () => {});
  test('applies bg-clip-text with transparent text color for gradient', () => {});
  test('uses gradientFrom, gradientTo, gradientDirection props', () => {});

  // Typography props
  test('applies custom fontFamily', () => {});
  test('applies custom fontWeight', () => {});
  test('applies textTransform: uppercase', () => {});
  test('applies textDecoration: underline', () => {});

  // Layout
  test('applies text alignment: center', () => {});
  test('applies maxWidth constraint', () => {});
  test('generates anchor ID for in-page navigation', () => {});

  // Edge cases
  test('renders empty string without crashing', () => {});
  test('sanitizes HTML in text prop (XSS prevention)', () => {});
  test('defaults to level 2 when level is undefined', () => {});
});
```

#### 17.2.2 TextRender Tests

```typescript
describe("TextRender", () => {
  // Basic rendering
  test("renders <p> by default", () => {});
  test("renders text content", () => {});

  // Typography
  test("applies fontFamily from props", () => {});
  test("applies fontSize, fontWeight, lineHeight, letterSpacing", () => {});
  test("applies textTransform", () => {});
  test("applies textDecoration", () => {});
  test("applies textShadow", () => {});

  // Advanced features
  test("renders drop cap when dropCap=true", () => {});
  test("applies multi-column layout when columns > 1", () => {});
  test("truncates text with line-clamp when truncateLines specified", () => {});
  test("applies maxWidth: prose (65ch) by default", () => {});

  // Colors
  test("uses theme color when color prop is a theme key", () => {});
  test("uses raw color value for hex/rgb/hsl", () => {});
});
```

#### 17.2.3 RichTextRender Tests

```typescript
describe("RichTextRender", () => {
  // Layout variants
  test.each(["centered", "left", "two-column", "asymmetric"])(
    "renders %s layout correctly",
    (layout) => {},
  );

  // Markdown parsing
  test("parses **bold** text", () => {});
  test("parses _italic_ text", () => {});
  test("parses [links](url)", () => {});
  test("parses inline `code`", () => {});
  test("parses headings (## h2, ### h3)", () => {});
  test("parses blockquotes (> text)", () => {});
  test("parses unordered lists (- item)", () => {});
  test("parses ordered lists (1. item)", () => {});

  // Theme integration
  test("uses theme colors for title (no hardcoded #1c2b2a)", () => {});
  test("uses theme colors for subtitle", () => {});
  test("uses theme colors for pull quote", () => {});

  // Title levels
  test("title renders as <h2> by default", () => {});
  test("title renders as configured level (h2-h4)", () => {});
});
```

#### 17.2.4 QuoteRender Tests

```typescript
describe("QuoteRender", () => {
  // Variants
  test.each([
    "simple",
    "bordered",
    "card",
    "modern",
    "pullquote",
    "testimonial",
  ])("renders %s variant", (variant) => {});

  // Semantic HTML
  test("renders <blockquote> element", () => {});
  test("renders <figure> + <figcaption> when author present", () => {});
  test("renders cite attribute when sourceUrl provided", () => {});

  // Author display
  test("displays author name", () => {});
  test("displays author title/role", () => {});
  test("displays author image in testimonial variant", () => {});

  // Prop name compatibility
  test('accepts variant prop (not "style")', () => {});
  test('accepts authorTitle prop (not "source")', () => {});
});
```

#### 17.2.5 New Components Tests

```typescript
// Label
describe("LabelRender", () => {
  test.each([
    "default",
    "eyebrow",
    "kicker",
    "caption",
    "overline",
    "meta",
    "badge",
  ])("renders %s variant", (variant) => {});
  test("uses <small> for caption variant", () => {});
  test("uses <figcaption> for image-caption variant", () => {});
});

// DisplayText
describe("DisplayTextRender", () => {
  test("renders decorative text with aria-hidden", () => {});
  test("renders sr-only accessible alternative", () => {});
  test("renders text-stroke when textStroke=true", () => {});
  test("no animation when prefers-reduced-motion", () => {});
});

// CodeBlock
describe("CodeBlockRender", () => {
  test("renders <pre><code> elements", () => {});
  test("applies syntax highlighting", () => {});
  test("shows copy button", () => {});
  test("shows filename when provided", () => {});
  test("adapts colors for dark mode", () => {});
});

// StatNumber
describe("StatNumberRender", () => {
  test("renders formatted number", () => {});
  test("includes aria-label with full text", () => {});
  test("no count animation when prefers-reduced-motion", () => {});
});
```

### 17.3 Visual Regression Tests

#### 17.3.1 Test Matrix

Every typography component must be tested across this matrix:

| Dimension      | Values                                            |
| -------------- | ------------------------------------------------- |
| Theme          | Light, Dark                                       |
| Viewport       | Mobile (375px), Tablet (768px), Desktop (1280px)  |
| Font state     | Loaded, Fallback (with size-adjust)               |
| Content length | Short (1 word), Medium (1 line), Long (paragraph) |
| Language       | Latin, CJK (if supported)                         |

**Total screenshots per component:** 2 themes × 3 viewports × 2 font states × 3 lengths = **36**

#### 17.3.2 Visual Test Setup

```typescript
// playwright visual regression test
test.describe("Typography Visual Regression", () => {
  for (const theme of ["light", "dark"]) {
    for (const viewport of [375, 768, 1280]) {
      test(`HeadingRender H1 - ${theme} - ${viewport}px`, async ({ page }) => {
        await page.setViewportSize({ width: viewport, height: 900 });
        await page.emulateMedia({
          colorScheme: theme === "dark" ? "dark" : "light",
        });
        await page.goto("/test/typography/heading?level=1");
        await page.waitForLoadState("networkidle"); // Wait for fonts
        await expect(page).toHaveScreenshot(
          `heading-h1-${theme}-${viewport}.png`,
        );
      });
    }
  }
});
```

### 17.4 Accessibility Tests

```typescript
// Automated accessibility testing with axe-core
import AxeBuilder from "@axe-core/playwright";

test.describe("Typography Accessibility", () => {
  test("HeadingRender passes axe audit", async ({ page }) => {
    await page.goto("/test/typography/heading");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("heading hierarchy is sequential", async ({ page }) => {
    await page.goto("/test/full-page");
    const headings = await page.$$eval("h1,h2,h3,h4,h5,h6", (els) =>
      els.map((el) => parseInt(el.tagName[1])),
    );
    // Verify no levels skipped
    for (let i = 1; i < headings.length; i++) {
      expect(headings[i] - headings[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test("contrast ratios meet WCAG AA", async ({ page }) => {
    await page.goto("/test/typography/all");
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("text spacing override does not cause overflow", async ({ page }) => {
    await page.goto("/test/typography/all");
    // Apply WCAG 1.4.12 text spacing overrides
    await page.addStyleTag({
      content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`,
    });
    // Check no content is clipped
    const clippedElements = await page.$$eval(
      '[style*="overflow: hidden"]',
      (els) => els.filter((el) => el.scrollHeight > el.clientHeight).length,
    );
    expect(clippedElements).toBe(0);
  });

  test("DisplayText has accessible alternative", async ({ page }) => {
    await page.goto("/test/typography/display-text");
    const srOnly = await page.$(".sr-only");
    expect(srOnly).toBeTruthy();
    const ariaHidden = await page.$('[aria-hidden="true"]');
    expect(ariaHidden).toBeTruthy();
  });
});
```

### 17.5 Performance Tests

```typescript
test.describe("Typography Performance", () => {
  test("fonts load within 3 seconds", async ({ page }) => {
    await page.goto("/test/typography/all");
    const fontLoadTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        document.fonts.ready.then(() => resolve(performance.now() - start));
      });
    });
    expect(fontLoadTime).toBeLessThan(3000);
  });

  test("CLS from font loading is less than 0.05", async ({ page }) => {
    await page.goto("/test/typography/all");
    // Wait for fonts to load (triggers layout shift)
    await page.waitForFunction(() => document.fonts.status === "loaded");
    // Measure CLS via Performance Observer
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) clsValue += entry.value;
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        // Give it a short window to collect shifts
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });
    expect(cls).toBeLessThan(0.05);
  });

  test("total font payload is under 100KB", async ({ page }) => {
    const fontRequests: number[] = [];
    page.on("response", (response) => {
      if (
        response.url().includes("fonts.g") &&
        response.headers()["content-type"]?.includes("font")
      ) {
        const size = parseInt(response.headers()["content-length"] || "0");
        fontRequests.push(size);
      }
    });
    await page.goto("/test/typography/all");
    const total = fontRequests.reduce((a, b) => a + b, 0);
    expect(total).toBeLessThan(100 * 1024); // 100KB
  });
});
```

### 17.6 Dark Mode Typography Tests

```typescript
test.describe("Dark Mode Typography", () => {
  test("heading font-weight reduces in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/test/typography/heading?level=1");
    const weight = await page.$eval(
      "h1",
      (el) => getComputedStyle(el).fontWeight,
    );
    // Dark mode: 700 → 600 for better readability
    expect(parseInt(weight)).toBeLessThan(700);
  });

  test("body text uses soft white (not #ffffff) in dark mode", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/test/typography/text");
    const color = await page.$eval("p", (el) => getComputedStyle(el).color);
    // Should NOT be pure white rgb(255,255,255)
    expect(color).not.toBe("rgb(255, 255, 255)");
  });

  test("gradient text remains visible in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/test/typography/heading?gradient=true");
    // Gradient heading should still be visible (not blend into dark background)
    const opacity = await page.$eval(
      "h1",
      (el) => getComputedStyle(el).opacity,
    );
    expect(parseFloat(opacity)).toBeGreaterThan(0.5);
  });

  test("code block uses dark-optimized syntax colors", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/test/typography/code-block");
    const bgColor = await page.$eval(
      "pre",
      (el) => getComputedStyle(el).backgroundColor,
    );
    // Dark mode code block should have dark background
    const rgb = bgColor.match(/\d+/g)?.map(Number) || [255, 255, 255];
    expect(rgb[0]).toBeLessThan(50); // R < 50 = dark background
  });
});
```

### 17.7 AI Output Validation Tests

```typescript
test.describe("AI Typography Output Validation", () => {
  test("AI never generates skipped heading levels", () => {
    // Simulate AI output and validate heading structure
    const aiOutput = generateTypographyOutput({ industry: "technology" });
    const headingLevels = aiOutput.sections
      .flatMap((s) => s.blocks.filter((b) => b.type === "Heading"))
      .map((b) => b.props.level);

    for (let i = 1; i < headingLevels.length; i++) {
      expect(headingLevels[i] - headingLevels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test("AI generates proper font pairings for all industries", () => {
    const industries = [
      "technology",
      "luxury",
      "legal",
      "creative",
      "ecommerce",
      "healthcare",
      "education",
      "restaurant",
      "finance",
      "nonprofit",
    ];
    for (const industry of industries) {
      const config = generateTypographyConfig(industry);
      expect(config.headingFont).toBeDefined();
      expect(config.bodyFont).toBeDefined();
      expect(config.headingFont).not.toBe(config.bodyFont); // Different fonts for contrast
      expect(config.scale).toBeDefined();
      expect(config.ratio).toBeGreaterThanOrEqual(1.125); // Min: Major Second
      expect(config.ratio).toBeLessThanOrEqual(1.414); // Max: Augmented Fourth
    }
  });

  test("AI quality score flags bad typography", () => {
    const badConfig = {
      headingFont: "Comic Sans MS",
      bodyFont: "Comic Sans MS", // Same as heading — bad
      bodyFontSize: "10px", // Too small — bad
      lineHeight: 1.0, // Too tight — bad
      maxWidth: "120ch", // Too wide — bad
    };
    const score = calculateTypographyQualityScore(badConfig);
    expect(score.total).toBeLessThan(50); // Should score poorly
    expect(score.warnings.length).toBeGreaterThan(0);
  });

  test("converter applies AI typography defaults", () => {
    const aiConfig = {
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      scale: "majorThird",
    };
    const input = { type: "Heading", props: { text: "Hello", level: 1 } };
    const output = convertWithTypography(input, aiConfig);
    expect(output.props.fontFamily).toBe("Playfair Display");
    expect(output.props.fontSize).toBe("auto"); // Auto = use type scale
  });
});
```

### 17.8 Cross-Browser Compatibility

| Feature                   | Chrome 100+ | Firefox 100+ | Safari 16+      | Edge 100+ |
| ------------------------- | ----------- | ------------ | --------------- | --------- |
| `clamp()` for fluid type  | ✅          | ✅           | ✅              | ✅        |
| `text-wrap: balance`      | ✅ (114+)   | ✅ (121+)    | ❌ (no support) | ✅ (114+) |
| `text-wrap: pretty`       | ✅ (117+)   | ❌           | ❌              | ✅ (117+) |
| `font-feature-settings`   | ✅          | ✅           | ✅              | ✅        |
| `font-variation-settings` | ✅          | ✅           | ✅              | ✅        |
| `-webkit-text-stroke`     | ✅          | ✅           | ✅              | ✅        |
| `container` queries       | ✅ (105+)   | ✅ (110+)    | ✅ (16+)        | ✅ (105+) |
| `hanging-punctuation`     | ❌          | ❌           | ✅ (only!)      | ❌        |
| `initial-letter`          | ✅ (110+)   | ❌           | ✅ (9+)         | ✅ (110+) |
| `@font-face size-adjust`  | ✅ (92+)    | ✅ (92+)     | ✅ (17+)        | ✅ (92+)  |

**Progressive Enhancement Rule:** Use `@supports` to detect advanced features:

```css
/* Only apply text-balance where supported */
@supports (text-wrap: balance) {
  h1,
  h2,
  h3 {
    text-wrap: balance;
  }
}
/* Fallback for initial-letter */
@supports not (initial-letter: 2) {
  .drop-cap::first-letter {
    float: left;
    font-size: 3em;
    line-height: 1;
  }
}
```

### 17.9 Quality Gates Summary

| Gate                  | When          | Criteria                                    | Blocks Deploy? |
| --------------------- | ------------- | ------------------------------------------- | -------------- |
| **Type Check**        | Every commit  | Zero TypeScript errors                      | ✅ Yes         |
| **Unit Tests**        | Every commit  | 100% pass, ≥90% coverage on new code        | ✅ Yes         |
| **Lint**              | Every commit  | Zero ESLint errors                          | ✅ Yes         |
| **Accessibility**     | Every PR      | Zero axe violations                         | ✅ Yes         |
| **Visual Regression** | Every PR      | Zero unexpected pixel diffs                 | ✅ Yes         |
| **Performance**       | Weekly        | Font payload < 100KB, CLS < 0.05            | ⚠️ Warning     |
| **Cross-Browser**     | Per phase     | Works in Chrome, Firefox, Safari, Edge      | ✅ Yes         |
| **AI Output**         | Per AI change | Heading hierarchy valid, quality score ≥ 70 | ✅ Yes         |

---

## 18. Key Rules Summary

> These rules are derived from the complete analysis above. Developers should reference this section as quick guidance during implementation.

### 18.1 CSS Variable Rules

1. **ALWAYS** use `var(--type-*)` CSS variables for font sizes — never hardcode `px`, `rem`, or Tailwind classes for type scale sizes
2. **ALWAYS** inject type scale variables from `typography-intelligence.ts` config — the AI config is the single source of truth
3. **NEVER** hardcode colors in typography components — use `var(--color-*)` theme variables or `inherit`
4. **ALWAYS** provide CSS variable fallbacks: `var(--type-h1, 3.052rem)`

### 18.2 Component Rules

5. **USE** semantic HTML elements (`<h1>`-`<h6>`, `<p>`, `<blockquote>`, `<pre><code>`, `<ul>`, `<ol>`)
6. **NEVER** skip heading levels — H1 → H2 → H3, never H1 → H3
7. **ALWAYS** default HeadingRender `fontSize` to `'auto'` which maps to the type scale level
8. **ALWAYS** apply `text-wrap: balance` on headings (progressive enhancement)
9. **FIX** registry prop mismatches before adding new features (alignment→align, style→variant, source→authorTitle)

### 18.3 Font Loading Rules

10. **ALWAYS** use `font-display: swap` — never block text rendering for font loading
11. **ALWAYS** specify fallback font stacks — never use a single font without fallbacks
12. **PREFER** variable fonts (single file) over multiple static weight files
13. **ALWAYS** add `<link rel="preconnect">` for external font servers
14. **TARGET** < 100KB total font payload per site

### 18.4 Accessibility Rules

15. **ALWAYS** meet WCAG 2.1 AA contrast ratios: 4.5:1 normal text, 3:1 large text
16. **ALWAYS** set body text to minimum `1rem` (16px) — never smaller for running text
17. **ALWAYS** set max line length to `65ch` for body text (≤80ch per WCAG)
18. **ALWAYS** provide `sr-only` alternatives for decorative text (DisplayText)
19. **RESPECT** `prefers-reduced-motion` — disable all text animations and transitions

### 18.5 Dark Mode Rules

20. **REDUCE** font-weight by 100 in dark mode (700 → 600) for optical consistency
21. **INCREASE** letter-spacing by 0.01em in dark mode to counteract glow effect
22. **USE** soft whites (`#E5E7EB`, `#F3F4F6`) instead of pure `#FFFFFF` for body text
23. **ADAPT** gradient colors for dark backgrounds — maintain contrast ratio

### 18.6 AI Integration Rules

24. **ALWAYS** validate AI-generated heading hierarchy before rendering
25. **ALWAYS** apply industry-specific typography rules from the 10 defined industry configs
26. **SCORE** typography quality on every AI generation — reject if score < 50

---

_Document Version: 1.0_
_Created: Session 9 of DRAMAC CMS development_
_Scope: Complete typography system overhaul specification for the DRAMAC CMS platform_
_Related: [LAYOUT-COMPONENTS-MASTER-PLAN.md](./LAYOUT-COMPONENTS-MASTER-PLAN.md)_
_Author: GitHub Copilot with comprehensive platform analysis_

# DRAMAC CMS — Navigation Components Master Plan

## Executive Vision

DRAMAC's navigation component library is the **structural skeleton of every AI-generated website**. Every page begins with a Navbar and ends with a Footer. Between them, Breadcrumbs orient users, Tabs organise content, Pagination controls data flow, and Links thread everything together. With **6 navigation-grade components**, **200+ customisable props**, **25+ design variants**, **20+ converter aliases**, and **full mobile responsiveness**, DRAMAC already has a solid navigation foundation.

Unlike Sections (which needed cross-component consistency work) or Buttons (which needed critical colour fixes), navigation components face a **different challenge: cohesion under interaction**. A Navbar isn't just a styled box — it must respond to scrolling, collapse into a mobile drawer, show scroll progress, manage dropdown depth, and coordinate focus traps. A Footer isn't just links — it's a trust layer with newsletter capture, social presence, legal compliance, and contact accessibility.

This plan focuses on **desktop dropdown rendering** (the biggest gap — registered but under-implemented), **missing component metadata** (Tabs has no metadata entry), **category mismatches** (Link/Breadcrumb/Pagination appear as "buttons" in metadata but "navigation"/"interactive" in registry), **scroll behaviour coordination**, **mobile-first navigation patterns**, **accessibility upgrades** (ARIA landmarks, focus traps, skip-to-content), and **registry/render prop synchronisation** — transforming 6 individual navigation primitives into a **unified, accessibility-first navigation system** that rivals Framer, Webflow, and Squarespace.

---

## Table of Contents

0. [Implementation Blueprint for AI Agents](#0-implementation-blueprint-for-ai-agents)
1. [Current State Audit](#1-current-state-audit)
2. [Industry Benchmark Analysis](#2-industry-benchmark-analysis)
3. [Architecture Principles](#3-architecture-principles)
4. [NavbarRender — Deep Dive & Enhancement Plan](#4-navbarrender--deep-dive--enhancement-plan)
5. [FooterRender — Deep Dive & Enhancement Plan](#5-footerrender--deep-dive--enhancement-plan)
6. [TabsRender — Deep Dive & Enhancement Plan](#6-tabsrender--deep-dive--enhancement-plan)
7. [LinkRender — Deep Dive & Enhancement Plan](#7-linkrender--deep-dive--enhancement-plan)
8. [BreadcrumbRender — Deep Dive & Enhancement Plan](#8-breadcrumbrender--deep-dive--enhancement-plan)
9. [PaginationRender — Deep Dive & Enhancement Plan](#9-paginationrender--deep-dive--enhancement-plan)
10. [New Navigation Components](#10-new-navigation-components)
11. [Mobile Navigation Strategy](#11-mobile-navigation-strategy)
12. [Scroll Behaviour System](#12-scroll-behaviour-system)
13. [Accessibility & ARIA Patterns](#13-accessibility--aria-patterns)
14. [Dark Mode & Theming Strategy](#14-dark-mode--theming-strategy)
15. [Registry & Converter Alignment](#15-registry--converter-alignment)
16. [Implementation Phases](#16-implementation-phases)
17. [Testing & Quality Gates](#17-testing--quality-gates)

---

## 0. Implementation Blueprint for AI Agents

> **This section is the single most important reference.** Before creating or modifying ANY navigation component, read this section in full. It contains the exact file paths, import patterns, function signatures, field definitions, and step-by-step registration checklist that every navigation component must follow.

### 0.1 Critical File Map

| File | Path | Purpose | Key Locations |
|------|------|---------|--------------|
| **Render Functions** | `src/lib/studio/blocks/renders.tsx` | All 6 navigation render functions live here | Navbar L14397, Footer L14438, Tabs L17083, Link L17551, Breadcrumb L17938, Pagination L18147 |
| **Shared Utilities** | `src/lib/studio/blocks/layout-utils.ts` | ALL shared class maps, dark-mode utilities, responsive helpers, shape dividers, gradient builder | `paddingYMap` L121, `isDarkBackground()` L454, `getDarkAwareDefaults()` L542 |
| **Converter typeMap** | `src/lib/ai/website-designer/converter.ts` | Maps AI-generated type names → registry types | `typeMap` at L361, `KNOWN_REGISTRY_TYPES` at L728, `navLinkKeys` at L247 |
| **Component Registry** | `src/lib/studio/registry/core-components.ts` | `defineComponent()` calls with field definitions | Navbar L10737, Footer L11402, Link L12034, Breadcrumb L12161, Tabs L16798, Pagination L17626 |
| **Component Metadata** | `src/lib/studio/registry/component-metadata.ts` | Labels, categories, keywords, AI descriptions | Navbar L526, Footer L538, Link L900, Breadcrumb L945, Pagination L960, **Tabs MISSING** |

### 0.2 The Props Pipeline (How Data Flows)

```
AI Designer generates JSON → converter.ts typeMap resolves type name
    → core-components.ts defineComponent fields validate props
        → renders.tsx render function receives props via {...injectedProps}
```

**CRITICAL RULE:** Prop names MUST match EXACTLY across all three files. If `defineComponent` defines a field called `linkHoverEffect`, the render function MUST destructure `linkHoverEffect` (not `hoverStyle` or `linkHover`).

**NAVIGATION-SPECIFIC:** The converter has special `navLinkKeys` handling (L247) and `isNavLink` detection (L282-287) that auto-fixes navigation link arrays (ensuring `{ label, href }` structure). When adding new link-like array fields, check if they need to be added to `navLinkKeys`.

### 0.3 Shared Utilities — ALREADY EXIST in `layout-utils.ts`

**DO NOT create new utility files for these.** They already exist and are imported by all render functions:

#### Class Maps (Tailwind-safe lookups)

```typescript
// Import from: "@/lib/studio/blocks/layout-utils"
import {
  getResponsiveClasses,    // Resolves responsive props to Tailwind classes
  paddingYMap,              // "none"|"xs"|"sm"|"md"|"lg"|"xl" → py-* / sm:py-* / lg:py-*
  paddingXMap,              // "none"|"xs"|"sm"|"md"|"lg" → px-* / sm:px-* / lg:px-*
  gapMap,                   // "none"|"xs"|"sm"|"md"|"lg"|"xl" → gap-* / sm:gap-* / lg:gap-*
  maxWidthMap,              // "xs".."7xl"|"full"|"none"|"screen-*" → max-w-*
  shadowMap,                // "none"|"sm"|"md"|"lg"|"xl"|"2xl"|"inner" → shadow-*
  borderRadiusMap,          // "none"|"sm"|"md"|"lg"|"xl"|"2xl"|"3xl"|"full" → rounded-*
} from "@/lib/studio/blocks/layout-utils";
```

**NAVIGATION NOTE:** The Navbar and Footer currently use inline class maps (e.g., `const heightClasses = { sm: "h-14", md: "h-16", lg: "h-20" }[height]`) rather than shared layout-utils maps. This is acceptable for navigation-specific sizing like header height, CTA padding, and link spacing that don't share semantics with section components. Only use layout-utils maps for properties that ARE shared (like `paddingY`, `maxWidth`, `shadow`).

#### Dark-Mode Utilities

```typescript
import {
  isDarkBackground,       // (hex?: string) => boolean — ITU-R BT.601 luminance, threshold 0.45
  getDarkAwareDefaults,   // (isDarkBg: boolean) => { borderColor, textColor, mutedTextColor, ... }
  resolveShadow,          // (shadow, isDarkBg) => CSS box-shadow string
  resolveGlassmorphism,   // (isDarkBg) => { background, backdropFilter, ... }
} from "@/lib/studio/blocks/layout-utils";
```

**Usage pattern for navigation:**
```typescript
// ✅ CORRECT — detect dark bg for Footer/Navbar
const darkBg = isDarkBackground(backgroundColor);
const darkDefaults = getDarkAwareDefaults(darkBg);
const resolvedLinkColor = linkColor || darkDefaults.mutedTextColor;
```

### 0.4 Navigation Render Function Skeleton

Navigation components follow a slightly different pattern from sections — they are **interactive** (Navbar, Tabs, Pagination use `useState`) and **persistent** (Navbar/Footer appear on every page):

```tsx
// NavbarWithMenu pattern — stateful inner + clean export
function NavbarWithMenu(props: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  // ... full implementation
  return (
    <>
      <nav>...</nav>
      {/* Mobile menu overlay */}
      {/* Mobile menu panel */}
    </>
  );
}

export function NavbarRender(props: NavbarProps) {
  return <NavbarWithMenu {...props} />;
}
```

```tsx
// Non-stateful navigation — direct export (Footer, Breadcrumb, Link)
export function FooterRender({
  companyName,
  columns = [],
  variant = "columns",
  backgroundColor = "#111827",
  textColor = "#ffffff",
  // ...
}: FooterProps) {
  return <footer>...</footer>;
}
```

```tsx
// Stateful non-nav — direct export with useState (Tabs, Pagination)
export function TabsRender({ tabs = [], defaultTab = 0, ... }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  return <section>...</section>;
}
```

### 0.5 `defineComponent()` Field Types Reference

When registering a navigation component in `core-components.ts`, use `defineComponent()`:

```typescript
defineComponent({
  type: "Navbar",              // Must match KNOWN_REGISTRY_TYPES entry
  label: "Navigation Bar",    // Editor display name
  description: "Short desc",  // Tooltip description
  category: "navigation",     // Category: "navigation" | "interactive"
  icon: "Menu",               // Lucide icon name
  render: NavbarRender,        // The render function from renders.tsx
  fields: {
    // TEXT — single-line string input
    logoText: { type: "text", label: "Logo Text", defaultValue: "Your Brand" },
    // ARRAY with nested arrays — for nav links with dropdowns
    links: {
      type: "array", label: "Nav Links",
      itemFields: {
        label: { type: "text", label: "Label" },
        href: { type: "link", label: "Link" },
        hasDropdown: { type: "toggle", label: "Has Dropdown" },
        dropdownLinks: {
          type: "array", label: "Dropdown Links",
          itemFields: {
            label: { type: "text", label: "Label" },
            href: { type: "link", label: "Link" },
            description: { type: "text", label: "Description" },
          },
        },
      },
    },
    // SELECT — dropdown with fixed options
    mobileMenuStyle: {
      type: "select", label: "Mobile Menu Style",
      options: [
        { label: "Fullscreen", value: "fullscreen" },
        { label: "Slide Right", value: "slideRight" },
      ],
      defaultValue: "fullscreen",
    },
    // TOGGLE — boolean switch
    hideOnScroll: { type: "toggle", label: "Hide on Scroll", defaultValue: false },
    // NUMBER — numeric input with min/max
    scrollThreshold: { type: "number", label: "Scroll Threshold", min: 0, max: 500, defaultValue: 100 },
  },
  fieldGroups: [...],      // Groups fields into collapsible sections in the editor
  defaultProps: {...},      // Default values for initial render
  ai: {
    description: "...",
    canModify: [...],
    suggestions: [...],
  },
});
```

### 0.6 Component Metadata Entry

Every navigation component MUST also be registered in `component-metadata.ts`:

```typescript
{
  type: "Navbar",                       // Must match defineComponent type exactly
  label: "Navigation Bar",             // Human-readable label
  category: "navigation",              // For editor grouping — MUST match registry category
  description: "Site navigation header",
  acceptsChildren: false,
  keywords: ["navbar", "header", "menu", "navigation"],
  ai: {
    description: "Site header with logo and navigation links",
    usageGuidelines: "Place at the top of every page",
    suggestedWith: ["Hero", "Footer"],
  },
},
```

### 0.7 Converter Registration (2 Steps + navLinkKeys)

**Step 1:** Add aliases to `typeMap` in `converter.ts` (~L361):
```typescript
const typeMap: Record<string, string> = {
  NavbarBlock: "Navbar",    // Already exists at L384
  Navbar: "Navbar",         // Already exists at L519
  // Add any new natural language aliases
};
```

**Step 2:** Add type name to `KNOWN_REGISTRY_TYPES` set (~L728):
```typescript
const KNOWN_REGISTRY_TYPES = new Set([
  "Navbar",       // Already exists
  "Footer",       // Already exists
  "Tabs",         // Already exists
  "Link",         // Already exists
  "Breadcrumb",   // Already exists
  "Pagination",   // Already exists
]);
```

**Step 3 (navigation-specific):** If component has link arrays, check `navLinkKeys` (~L247):
```typescript
const navLinkKeys = [
  "links",          // Navbar links
  "bottomLinks",    // Footer bottom links
  "dropdownLinks",  // Navbar dropdown links
  // Add new link-bearing fields here if they contain { label, href } arrays
];
```

### 0.8 Build Checklist — Navigation Component

When building or modifying a navigation component, modify these 4 files **in this order**:

```
FILE 1: src/lib/studio/blocks/renders.tsx
  □ Create/update the render function
  □ Import shared utilities from layout-utils.ts where applicable
  □ For stateful components, use inner function + clean export wrapper
  □ Add proper ARIA attributes (role, aria-label, aria-expanded, aria-current)
  □ Handle mobile breakpoint visibility (hidden md:flex / md:hidden)
  □ Export the function

FILE 2: src/lib/studio/registry/core-components.ts
  □ Import the render function
  □ Add defineComponent({ type, label, fields, fieldGroups, render, defaultProps, ai })
  □ Field names must EXACTLY match destructured props in the render function
  □ Group fields into logical fieldGroups for editor UX
  □ Provide comprehensive defaultProps so component renders with zero configuration

FILE 3: src/lib/studio/registry/component-metadata.ts
  □ Add entry to COMPONENT_METADATA array
  □ Include type, label, category, description, keywords, ai properties
  □ category MUST match the registry category (avoid "buttons" for nav components)

FILE 4: src/lib/ai/website-designer/converter.ts
  □ Add 2-5 aliases to typeMap (e.g., "NavbarBlock": "Navbar")
  □ Verify type is in KNOWN_REGISTRY_TYPES set
  □ If component has link arrays, verify navLinkKeys includes them
```

### 0.9 DO / DON'T Rules

```
✅ DO:
- Use React.useState for interactive navigation (Navbar mobile menu, Tabs active state)
- Add ARIA attributes: role="navigation", aria-label, aria-expanded, aria-current="page"
- Handle keyboard navigation (Tab, Enter, Escape, Arrow keys) for menus and tabs
- Use CSS transitions for menu open/close animations (no JS setTimeout)
- Provide a skip-to-content link in Navbar for accessibility
- Make all navigation links keyboard-focusable with visible focus indicators
- Use semantic HTML: <nav>, <footer>, <ol> (breadcrumbs), <button> (not <div onClick>)
- Match category across registry AND metadata ("navigation" for site-level, "interactive" for content-level)

❌ DON'T:
- Create new utility files for scroll handling or mobile menus (keep logic inline in the component)
- Use <div> with onClick handlers where <button> or <a> should be used
- Forget to close mobile menu on backdrop click and Escape key
- Hard-code breakpoints — use mobileBreakpoint prop (sm/md/lg)
- Use template literal Tailwind classes like `gap-${gap}` (Tailwind can't scan them)
- Add props that don't exist in defineComponent fields (they won't be passed through)
- Mix up prop names across files (e.g., "ctaLink" in registry vs "ctaHref" in render)
- Forget aria-expanded on hamburger button or aria-current="page" on active breadcrumb
```

---

## 1. Current State Audit

### 1.1 All 6 Navigation Components

| # | Component | Render Location | Registry Location | Props | Variants | Registry Category | Metadata Category | Quality |
|---|-----------|-----------------|-------------------|-------|----------|-------------------|-------------------|---------|
| 1 | **NavbarRender** | `renders.tsx` L14397 | `core-components.ts` L10737 | ~56 | 4 (standard/centered/split/minimal) | `navigation` | `navigation` | ✅ Strong |
| 2 | **FooterRender** | `renders.tsx` L14438 | `core-components.ts` L11402 | ~50 | 4 (standard/centered/simple/extended) | `navigation` | `navigation` | ✅ Good |
| 3 | **TabsRender** | `renders.tsx` L17083 | `core-components.ts` L16798 | 50+ | 7 (underline/pills/boxed/enclosed/soft/minimal/lifted) | `interactive` | **MISSING** | ⚠️ Limited (render has 3 variants, registry has 7) |
| 4 | **LinkRender** | `renders.tsx` L17551 | `core-components.ts` L12034 | ~10 | 6 (default/underline/hover-underline/subtle/bold/nav) | `navigation` | `buttons` ⚠️ | ✅ Good |
| 5 | **BreadcrumbRender** | `renders.tsx` L17938 | `core-components.ts` L12161 | ~13 | 3 (default/contained/pills) | `navigation` | `buttons` ⚠️ | ✅ Good |
| 6 | **PaginationRender** | `renders.tsx` L18147 | `core-components.ts` L17626 | ~18 | 4 (default/simple/minimal/dots) | `interactive` | `buttons` ⚠️ | ✅ Good |

### 1.2 Quality Tier Summary

| Tier | Components | Total Props | Status |
|------|-----------|-------------|--------|
| **Tier A — Feature-Rich** (50+ fields, 4+ variants, scroll/mobile behaviour) | Navbar, Tabs | 106+ | Production-ready, Tabs render needs variant parity |
| **Tier B — Solid** (10-50 fields, 3-6 variants) | Footer, Link, Breadcrumb, Pagination | 91+ | Production-ready, minor alignment gaps |

### 1.3 Gaps & Inconsistencies Found

| # | Issue | Component | Detail | Severity |
|---|-------|-----------|--------|----------|
| 1 | **Missing metadata entry** | Tabs | No entry in `component-metadata.ts` — AI can't discover it for editor grouping | 🔴 Critical |
| 2 | **Category mismatch** | Link | Registry says `"navigation"`, metadata says `"buttons"` | 🟡 Medium |
| 3 | **Category mismatch** | Breadcrumb | Registry says `"navigation"`, metadata says `"buttons"` | 🟡 Medium |
| 4 | **Category mismatch** | Pagination | Registry says `"interactive"`, metadata says `"buttons"` | 🟡 Medium |
| 5 | **Missing converter alias** | Breadcrumb | No direct `Breadcrumb` → `"Breadcrumb"` mapping in typeMap | 🟡 Medium |
| 6 | **Render/registry variant gap** | Tabs | Registry defines 7 variants (underline/pills/boxed/enclosed/soft/minimal/lifted), render only implements 3 (underline/pills/boxed) | 🔴 Critical |
| 7 | **Missing render props** | Pagination | `shape` and `boundaryCount` exist in render Props interface but NOT in registry fields — unreachable from editor | 🟡 Medium |
| 8 | **Navbar inline class maps** | Navbar | Uses inline `{ sm: "h-14", md: "h-16" }` maps instead of layout-utils (acceptable for nav-specific sizing) | 🟢 Low |
| 9 | **Registry/render prop mismatch** | Navbar | Registry defines `linkFontSize`, `linkFontWeight`, `linkHoverEffect`, `linkActiveIndicator`, `ctaStyle` but render destructures `linkSize`, `linkWeight`, `linkHoverStyle`, `ctaVariant` — **props won't pass through** | 🔴 Critical |
| 10 | **No desktop dropdown rendering** | Navbar | `hasDropdown` + `dropdownLinks` fields exist in registry but the render only shows flat link list — dropdowns don't render | 🔴 Critical |
| 11 | **Footer render/registry mismatch** | Footer | Registry has `showNewsletter`, `showSocialLinks`, `showContactInfo`, `contactEmail`, `contactPhone`, `contactAddress`, `showAppBadges`, `legalLinks`, `showMadeWith`, `columnsLayout`, etc. but render uses a simpler prop set: `newsletter`, `columns`, `socialLinks`, `copyright`, `bottomLinks` | 🔴 Critical |
| 12 | **Tabs `dangerouslySetInnerHTML`** | Tabs | Tab content rendered via `dangerouslySetInnerHTML` — XSS risk if content is user-supplied | 🟡 Medium |

### 1.4 Props Count Detail

| Component | Render Props | Registry Fields | Matched | Unmatched in Registry | Unmatched in Render |
|-----------|-------------|-----------------|---------|----------------------|-------------------|
| **Navbar** | ~28 destructured | ~70 fields | ~20 | ~50 (not consumed by render) | ~8 (not in registry) |
| **Footer** | ~18 destructured | ~50+ fields | ~12 | ~38 (not consumed by render) | ~6 (not in registry) |
| **Tabs** | ~23 destructured | ~50+ fields | ~12 | ~38 (not consumed by render) | ~11 (not in registry) |
| **Link** | ~12 destructured | ~10 fields | ~10 | 0 | ~2 |
| **Breadcrumb** | ~13 destructured | ~10 fields | ~10 | 0 | ~3 (hoverColor, separatorColor, backgroundColor) |
| **Pagination** | ~18 destructured | ~10 fields | ~8 | 0 | ~10 (shape, activeTextColor, color, hoverColor, boundaryCount, prevLabel, nextLabel, onPageChange) |

**KEY INSIGHT:** Navbar, Footer, and Tabs all have a **registry-render gap** — the registry has been expanded to 50+ fields each, but the render functions haven't been updated to consume all those fields. This means many editor controls exist but do nothing. This is the #1 priority for this plan.

---

## 2. Industry Benchmark Analysis

### 2.1 Navigation Feature Comparison

| Feature | **DRAMAC** | **Framer** | **Webflow** | **Squarespace** |
|---------|-----------|-----------|------------|----------------|
| Desktop sticky header | ✅ position: sticky/fixed | ✅ | ✅ | ✅ |
| Hide on scroll / Show on scroll up | ✅ hideOnScroll + showOnScrollUp | ✅ | ✅ | ❌ |
| Transparent-to-solid scroll | ✅ transparentUntilScroll | ✅ | ✅ | ✅ |
| Scroll progress bar | ✅ showScrollProgress | ❌ | ❌ | ❌ |
| Glass/blur effect | ✅ glassEffect + glassBlur | ✅ | ❌ | ❌ |
| Desktop dropdowns | ⚠️ Fields exist, rendering incomplete | ✅ Full dropdown/mega-menu | ✅ Full | ✅ |
| Mega menu | ❌ Not supported | ✅ | ✅ | ❌ |
| Mobile hamburger menu | ✅ 4 styles (fullscreen/slideR/slideL/dropdown) | ✅ | ✅ | ✅ |
| Mobile breakpoint control | ✅ sm/md/lg | ❌ Fixed | ✅ | ❌ Fixed |
| Skip to content | ✅ Field exists in registry (skipToContent) | ❌ | ❌ | ❌ |
| Logo + dual CTAs | ✅ Primary + secondary | ✅ | ✅ | ✅ |
| Footer multi-column | ✅ Array of columns | ✅ | ✅ | ✅ |
| Footer newsletter | ✅ Built-in | ❌ (separate block) | ❌ (separate block) | ✅ |
| Footer app store badges | ⚠️ Registry fields, not rendered | ❌ | ❌ | ❌ |
| Breadcrumb truncation | ✅ maxItems with ellipsis | ✅ | ✅ | ❌ |
| Tab vertical layout | ⚠️ Registry has tabsPosition, render doesn't | ✅ | ✅ | ❌ |
| Tab animations | ⚠️ Registry has animationType, render doesn't | ✅ | ✅ | ❌ |
| Pagination smart algorithm | ✅ siblings + boundary | ✅ | ✅ | ❌ |

### 2.2 DRAMAC Competitive Position

**Strengths (ahead of market):**
- Scroll progress indicator (unique — neither Framer nor Webflow offer this natively)
- Glass/blur effect on navbar (Framer-level feature)
- Mobile breakpoint control (sm/md/lg — more flexible than competitors)
- Built-in newsletter in footer (saves a separate block)
- Skip-to-content field in registry (strong accessibility commitment)

**Gaps (behind market):**
- Desktop dropdowns not rendering despite field support (critical gap)
- No mega-menu option (Framer/Webflow both offer this)
- Footer registry expanded but render never updated (50+ fields doing nothing)
- Tabs registry has 50+ fields but render only uses ~23 (~50% waste)
- No sidebar/drawer component (standalone, outside navbar)

---

## 3. Architecture Principles

### 3.1 Navigation Component Philosophy

```
                          ┌─────────────────────────────┐
                          │     Page-Level (Global)      │
                          │  Every page, every visit     │
                          │                              │
                          │  ┌────────┐    ┌────────┐   │
                          │  │ Navbar │    │ Footer │   │
                          │  └────────┘    └────────┘   │
                          └─────────────────────────────┘
                                        │
                          ┌─────────────────────────────┐
                          │    Content-Level (Local)     │
                          │  Within specific sections    │
                          │                              │
                          │ ┌──────┐ ┌────┐ ┌──────────┐│
                          │ │Tabs  │ │Link│ │Breadcrumb ││
                          │ └──────┘ └────┘ └──────────┘│
                          │          ┌──────────┐       │
                          │          │Pagination│       │
                          │          └──────────┘       │
                          └─────────────────────────────┘
```

**Page-Level Components** (Navbar, Footer):
- Appear once per page, typically top/bottom
- Often sticky or fixed positioned
- Must handle scroll behaviour
- Need global keyboard accessibility (skip-to-content)
- Category: `"navigation"`

**Content-Level Components** (Tabs, Breadcrumb, Pagination, Link):
- Appear within sections, potentially multiple times per page
- Interactive state management (active tab, current page)
- Need local ARIA patterns (tablist, nav landmark)
- Category: `"navigation"` (Breadcrumb, Link) or `"interactive"` (Tabs, Pagination)

### 3.2 Render/Registry Sync Rules

The **#1 architectural rule** for navigation components:

> Every field in `defineComponent` MUST have a matching prop in the render function. Every prop destructured in the render function SHOULD have a matching field in `defineComponent`.

Current violations of this rule are documented in Section 1.3. Any enhancement work MUST start by syncing the existing registry fields with the render function before adding new ones.

### 3.3 Interaction Patterns

| Pattern | Components | Implementation |
|---------|-----------|---------------|
| **Click toggle** | Navbar (hamburger), Accordion | `useState(false)` + `onClick` handler |
| **Hover reveal** | Navbar (dropdowns) | CSS `group-hover` or `onMouseEnter/Leave` |
| **Scroll-driven** | Navbar (hide/show/transparent) | `useEffect` + `window.addEventListener('scroll')` |
| **Active state** | Tabs, Pagination | `useState(index)` + conditional styling |
| **Keyboard** | All | Tab key focus, Enter/Space activation, Escape to close, Arrow keys for tabs |

---

## 4. NavbarRender — Deep Dive & Enhancement Plan

### 4.1 Current Implementation

**Location:** `renders.tsx` L14025 (props interface) → L14093 (NavbarWithMenu) → L14397 (export)

**Render Props Interface (~28 props):**
```typescript
export interface NavbarProps {
  logo?: string | ImageValue; logoText?: string; logoLink?: string; logoHeight?: number; logoPosition?: "left" | "center";
  links?: Array<{ label?: string; text?: string; href?: string; icon?: string }>;
  linkAlignment?: "left" | "center" | "right";
  linkSpacing?: "sm" | "md" | "lg"; linkSize?: "sm" | "md" | "lg";
  linkWeight?: "normal" | "medium" | "semibold" | "bold";
  linkHoverStyle?: "opacity" | "underline" | "color";
  ctaText?: string; ctaLink?: string; ctaVariant?: "solid" | "outline" | "ghost";
  ctaColor?: string; ctaSize?: "sm" | "md" | "lg"; ctaRadius?: "none" | "sm" | "md" | "lg" | "full";
  showCtaOnMobile?: boolean;
  secondaryCtaText?: string; secondaryCtaLink?: string; secondaryCtaVariant?: "solid" | "outline" | "ghost";
  layout?: "standard" | "centered" | "split";
  maxWidth?: "full" | "container" | "narrow"; height?: "sm" | "md" | "lg"; paddingX?: "sm" | "md" | "lg";
  backgroundColor?: string; textColor?: string; borderBottom?: boolean; borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  sticky?: boolean; transparent?: boolean; blurBackground?: boolean; hideOnScroll?: boolean;
  mobileBreakpoint?: "sm" | "md" | "lg";
  mobileMenuPosition?: "left" | "right" | "full"; mobileMenuAnimation?: "slide" | "fade" | "scale";
  showOverlay?: boolean;
}
```

**Registry Fields (~70 fields in 9 fieldGroups):**
- branding: logo, logoText, logoLink, logoHeight, logoPosition
- navigation: links (with hasDropdown + dropdownLinks), linkAlignment, linkSpacing, linkFontSize, linkFontWeight, linkTextTransform, linkHoverEffect, linkActiveIndicator
- cta: ctaText, ctaLink, ctaStyle, ctaColor, ctaTextColor, ctaSize, ctaBorderRadius, ctaIcon, secondaryCtaText, secondaryCtaLink, secondaryCtaStyle
- layout: layout (standard/centered/split/minimal), maxWidth (full/7xl/6xl/5xl), height (sm/md/lg/xl), paddingX (sm/md/lg/xl)
- appearance: backgroundColor, backgroundOpacity, textColor, borderBottom, borderColor, borderWidth, shadow (none/sm/md/lg/xl), glassEffect, glassBlur
- behavior: position (relative/sticky/absolute/fixed), stickyOffset, hideOnScroll, showOnScrollUp, transparentUntilScroll, scrollThreshold
- mobile: mobileBreakpoint, mobileMenuStyle (fullscreen/slideRight/slideLeft/dropdown), mobileMenuBackground, mobileMenuTextColor, mobileMenuAnimation, mobileMenuDuration, showMobileMenuOverlay, mobileMenuOverlayColor, mobileMenuOverlayOpacity, hamburgerSize, hamburgerColor, showCtaInMobileMenu, mobileMenuLinkSpacing
- scrollProgress: showScrollProgress, scrollProgressPosition, scrollProgressHeight, scrollProgressColor, scrollProgressBackground, scrollProgressStyle
- accessibility: ariaLabel, skipToContent

### 4.2 Critical Prop Name Mismatches

These registry fields are NOT consumed by the current render function because the prop names don't match:

| Registry Field | Render Prop | Fix Required |
|---------------|-------------|-------------|
| `linkFontSize` | `linkSize` | Rename render prop to `linkFontSize` OR rename registry field |
| `linkFontWeight` | `linkWeight` | Rename render prop to `linkFontWeight` OR rename registry field |
| `linkHoverEffect` | `linkHoverStyle` | Rename render prop to `linkHoverEffect` OR rename registry field |
| `ctaStyle` | `ctaVariant` | Rename render prop to `ctaStyle` OR rename registry field |
| `ctaBorderRadius` | `ctaRadius` | Rename render prop to `ctaBorderRadius` OR rename registry field |
| `position` | `sticky` (boolean) | Render uses `sticky?: boolean`, registry uses `position: select` with 4 options |

**RECOMMENDED FIX:** Update the render function to use the registry field names, since the registry is the source of truth and drives the editor UI.

### 4.3 Missing Desktop Dropdown Rendering

The registry supports `hasDropdown` (toggle) and `dropdownLinks` (nested array) on each navigation link item. The link interface in the render function only has:
```typescript
links?: Array<{ label?: string; text?: string; href?: string; icon?: string }>;
```

It's missing `hasDropdown` and `dropdownLinks` entirely. The mobile menu also doesn't render dropdowns.

**Enhancement Required:**
1. Expand the link interface to include `hasDropdown` and `dropdownLinks`
2. Render desktop dropdown on `hover` (or `click` for accessibility) using `group/group-hover` pattern or `onMouseEnter`/`onMouseLeave`
3. Render mobile dropdown as an expandable sub-list inside the mobile menu
4. Add transition animation for dropdown appearance

### 4.4 Missing Scroll Behaviour (Registry Fields Exist)

The registry defines `hideOnScroll`, `showOnScrollUp`, `transparentUntilScroll`, and `scrollThreshold` with a full behaviour group. The render function accepts `hideOnScroll` and `transparent` as simple booleans but does NOT implement actual scroll event handling.

**Enhancement Required:**
1. Add `useEffect` with `scroll` event listener
2. Track `lastScrollY` in ref, compare with current `window.scrollY`
3. Apply/remove CSS classes for hide/show/transparent based on scroll position
4. Respect `scrollThreshold` for transparentUntilScroll

### 4.5 Missing Scroll Progress Indicator

The registry has an entire `scrollProgress` fieldGroup (6 fields) but the render doesn't implement it.

**Enhancement Required:**
1. Add a `<div>` progress bar positioned at top/bottom of the navbar
2. Use `scroll` event to calculate `scrollY / (documentHeight - viewportHeight) * 100`
3. Apply width as percentage, using configured colour and height

### 4.6 Enhancement Priority

| Priority | Enhancement | Impact | Effort |
|----------|------------|--------|--------|
| **P0** | Fix prop name mismatches (Section 4.2) | Editor controls start working | Low |
| **P0** | Implement desktop dropdowns (Section 4.3) | Core UX gap closed | Medium |
| **P1** | Implement scroll behaviour (Section 4.4) | Premium feel, matches competitors | Medium |
| **P1** | Implement scroll progress (Section 4.5) | Unique differentiator | Low |
| **P2** | Consume remaining registry fields (backgroundOpacity, borderWidth, glassBlur, stickyOffset, etc.) | Full editor parity | Medium |
| **P3** | Add mega-menu variant | Competitive parity with Framer/Webflow | High |

---

## 5. FooterRender — Deep Dive & Enhancement Plan

### 5.1 Current Implementation

**Location:** `renders.tsx` L14406 (props interface) → L14438 (render function) → ~L14694 (end)

**Render Props Interface (~18 props + 2 extra):**
```typescript
export interface FooterProps {
  logo?: string | ImageValue; logoText?: string; description?: string;
  columns?: Array<{ title?: string; links?: Array<{ label?: string; href?: string }> }>;
  socialLinks?: Array<{ platform?: "facebook"|"twitter"|"instagram"|"linkedin"|"youtube"|"github"; url?: string }>;
  copyright?: string; bottomLinks?: Array<{ label?: string; href?: string }>;
  newsletter?: boolean; newsletterTitle?: string; newsletterPlaceholder?: string; newsletterButtonText?: string;
  backgroundColor?: string; textColor?: string; accentColor?: string;
  variant?: "simple" | "columns" | "centered";
  paddingY?: "sm" | "md" | "lg";
}
// Also uses: linkColor, linkHoverColor (destructured outside interface)
```

**Registry Fields (~50+ fields in 9 fieldGroups):**
- branding: logo, logoText, logoHeight, companyName, description
- columns: columns (nested array with isNew badge), columnsLayout (2/3/4/auto)
- newsletter: showNewsletter, newsletterTitle, newsletterDescription, newsletterPlaceholder, newsletterButtonText, newsletterButtonColor
- social: showSocialLinks, socialLinksTitle, socialLinks (8 platforms), socialIconSize, socialIconStyle
- contact: showContactInfo, contactEmail, contactPhone, contactAddress
- appStores: showAppBadges, appStoreUrl, playStoreUrl
- legal: copyright, legalLinks, showMadeWith, madeWithText
- layout: variant (standard/centered/simple/extended — 4 variants), maxWidth, paddingTop, paddingBottom, paddingX
- appearance: backgroundColor, textColor, linkColor, linkHoverColor, borderTop, borderColor, dividerColor

### 5.2 Registry/Render Gap

The Footer has the **largest registry-render gap** of any navigation component. The registry has been significantly expanded (9 fieldGroups, 50+ fields, 4 variants) but the render function still uses the original ~18 props.

**Major features in registry but NOT in render:**
- `companyName` (separate from `logoText`)
- `columnsLayout` (2/3/4/auto column control)
- `newsletterDescription` and `newsletterButtonColor`
- `showSocialLinks` toggle, `socialLinksTitle`, `socialIconSize`, `socialIconStyle`
- `showContactInfo`, `contactEmail`, `contactPhone`, `contactAddress`
- `showAppBadges`, `appStoreUrl`, `playStoreUrl`
- `legalLinks` (separate from `bottomLinks`)
- `showMadeWith`, `madeWithText`
- `maxWidth`, separate `paddingTop`/`paddingBottom`/`paddingX`
- `borderTop`, `borderColor`, `dividerColor`
- `"extended"` variant (4th variant)
- Social platforms: 8 in registry (including tiktok, pinterest) vs 6 in render

### 5.3 Variant Descriptions

| Variant | Description | Status |
|---------|-----------|--------|
| `standard` | Full-width footer with logo on left, columns, social, newsletter, bottom bar with legal | Registry: defined, Render: maps to "columns" |
| `centered` | Centred layout, logo + description, horizontal links, social icons, copyright | Registry: defined, Render: partially implemented |
| `simple` | Minimal footer: text + inline links + copyright on one line | Registry: defined, Render: partially implemented |
| `extended` | Full footer with ALL sections: contact info, app badges, newsletter, columns, social, legal bar | Registry: defined, Render: **NOT implemented** |

### 5.4 Enhancement Priority

| Priority | Enhancement | Impact | Effort |
|----------|------------|--------|--------|
| **P0** | Sync render with registry props (add companyName, columnsLayout, contact/social control toggles) | Editor controls start working | Medium |
| **P0** | Implement `"extended"` variant | 4th variant available | Medium |
| **P1** | Add contact info section rendering | Business footer completeness | Low |
| **P1** | Add app store badges rendering | Modern app footer support | Low |
| **P1** | Add `legalLinks` separate from `bottomLinks` | Proper legal section | Low |
| **P2** | Add `showMadeWith` / `madeWithText` badge | Brand attribution | Low |
| **P2** | Expand social icons to 8 platforms (add tiktok, pinterest) | Platform parity | Low |
| **P3** | Add back-to-top button option | UX enhancement | Low |

---

## 6. TabsRender — Deep Dive & Enhancement Plan

### 6.1 Current Implementation

**Location:** `renders.tsx` L17060 (props interface) → L17083 (render function) → ~L17200 (end)

**Render Props Interface (~23 props):**
```typescript
tabs?: Array<{ label?: string; content?: string; icon?: string }>;
title?: string; subtitle?: string; defaultTab?: number;
variant?: "underline" | "pills" | "boxed";
size?: "sm" | "md" | "lg"; fullWidth?: boolean; centered?: boolean;
backgroundColor?: string; activeColor?: string; activeTabColor?: string;
activeTabTextColor?: string; inactiveTabColor?: string; inactiveTabTextColor?: string;
tabBorderColor?: string; contentBackgroundColor?: string; accentColor?: string;
textColor?: string; titleColor?: string; subtitleColor?: string;
```

**Registry Fields (~50+ fields in 12 fieldGroups):**
- tabs: tabs array (with icon, badge, badgeColor, disabled, hidden)
- behavior: defaultTab, keepAlive, lazyLoad
- style: variant (7 options), backgroundColor, activeColor, inactiveColor, activeBackgroundColor, hoverColor
- size: size, fullWidth, centered, gap, tabsPosition (top/bottom/left/right)
- border: showBorder, borderColor, borderWidth, borderRadius, indicatorStyle (underline/background/pill/none), indicatorColor, indicatorHeight
- content: contentPadding, contentBackgroundColor, contentBorderRadius, contentMinHeight
- animation: animationType (none/fade/slide/scale), animationDuration, slideDirection
- icons: showIcons, iconPosition (left/right/top), iconSize
- badges: showBadges, badgeStyle (dot/count/text)
- overflow: overflowBehavior (scroll/dropdown/wrap), showScrollButtons, scrollButtonStyle
- responsive: mobileVariant (same/pills/dropdown), collapseOnMobile, mobileDropdown
- accessibility: ariaLabel, enableKeyboard

### 6.2 Critical Gaps

1. **Missing Metadata Entry:** Tabs has NO entry in `component-metadata.ts`. This means:
   - AI designer can't get metadata about when/where to use Tabs
   - Editor search won't find it via keywords
   - Category grouping in component palette is broken

2. **Variant Gap:** Registry defines 7 variants (`underline`, `pills`, `boxed`, `enclosed`, `soft`, `minimal`, `lifted`) but render only implements 3 (`underline`, `pills`, `boxed`). Four variants are dead.

3. **dangerouslySetInnerHTML:** Tab content is rendered with `dangerouslySetInnerHTML`. If tab content comes from user input (not just AI generation), this is an XSS risk. Consider sanitising or using a markdown renderer.

4. **Missing Features (Registry Fields Not Consumed):**
   - `tabsPosition` (top/bottom/left/right) — no vertical tab layout
   - `animationType`/`animationDuration` — no content transition
   - `showIcons`/`iconPosition` — icon alongside tab label exists but no icon rendering beyond emoji
   - `badge`/`badgeColor` per tab — no badge rendering
   - `keepAlive`/`lazyLoad` — no conditional mounting
   - `overflowBehavior` — no scroll/dropdown for overflow tabs
   - `mobileVariant`/`collapseOnMobile`/`mobileDropdown` — no mobile adaptation
   - `enableKeyboard` — no arrow key navigation
   - `indicatorStyle`/`indicatorColor`/`indicatorHeight` — no customisable indicator

### 6.3 Enhancement Priority

| Priority | Enhancement | Impact | Effort |
|----------|------------|--------|--------|
| **P0** | Add metadata entry to component-metadata.ts | AI discoverability | Low |
| **P0** | Implement 4 missing variants (enclosed/soft/minimal/lifted) | Variant parity | Medium |
| **P1** | Add keyboard navigation (arrow keys) | Accessibility | Medium |
| **P1** | Add ARIA tablist pattern (role="tablist", role="tab", role="tabpanel") | Accessibility | Medium |
| **P1** | Implement vertical tab layout (tabsPosition left/right) | Feature parity with Framer | Medium |
| **P2** | Add tab content animations (fade/slide) | Premium feel | Medium |
| **P2** | Add badge rendering on tabs | Visual indicator support | Low |
| **P2** | Add mobile collapse to dropdown | Responsive UX | Medium |
| **P2** | Add overflow scroll with buttons | UX for many tabs | Medium |
| **P3** | Replace dangerouslySetInnerHTML with safe rendering | Security hardening | Medium |

---

## 7. LinkRender — Deep Dive & Enhancement Plan

### 7.1 Current Implementation

**Location:** `renders.tsx` L17521 (props interface) → L17551 (render function) → ~L17660 (end)

**Render Props Interface (~16 props):**
```typescript
text?: string; href?: string; target?: "_self" | "_blank"; rel?: string;
variant?: "default" | "underline" | "hover-underline" | "subtle" | "bold" | "nav";
color?: string; hoverColor?: string;
iconName?: string; iconPosition?: "left" | "right"; showExternalIcon?: boolean;
fontSize?: string; fontWeight?: "normal" | "medium" | "semibold" | "bold";
underlineAnimation?: "none" | "slide-in" | "expand-center" | "expand-left";
ariaLabel?: string;
```

**Registry Fields (~10 fields in 4 fieldGroups):**
- content: text, href, target
- style: variant (6), color, fontSize (sm/base/lg/xl), fontWeight (4)
- effects: underlineAnimation (4), showExternalIcon
- accessibility: ariaLabel

### 7.2 Assessment

LinkRender is the **most well-aligned** navigation component — render and registry are mostly in sync. The CSS pseudo-element underline animations (slide-in, expand-center, expand-left) are well-implemented.

**Minor Gaps:**
- `hoverColor` prop exists in render but not in registry (unreachable from editor)
- `iconName` and `iconPosition` in render but not in registry (icon support exists but can't be configured)
- `rel` prop in render but not in registry
- Metadata category is `"buttons"` but registry is `"navigation"` — should be consistent

### 7.3 Enhancement Priority

| Priority | Enhancement | Impact | Effort |
|----------|------------|--------|--------|
| **P0** | Fix metadata category from `"buttons"` to `"navigation"` | Category consistency | Low |
| **P1** | Add `hoverColor`, `iconName`, `iconPosition`, `rel` to registry fields | Full editor control | Low |
| **P2** | Add `"button"` variant (styled as button but semantically a link) | Useful for nav CTAs | Low |

---

## 8. BreadcrumbRender — Deep Dive & Enhancement Plan

### 8.1 Current Implementation

**Location:** `renders.tsx` L17920 (props interface) → L17938 (render function) → ~L18146 (end)

**Render Props Interface (~13 props):**
```typescript
items?: BreadcrumbItem[];
separator?: "/" | ">" | "→" | "•" | "chevron" | "slash" | "arrow" | "dot";
variant?: "default" | "contained" | "pills";
size?: "sm" | "md" | "lg";
color?: string; activeColor?: string; hoverColor?: string; separatorColor?: string; backgroundColor?: string;
maxItems?: number; showHome?: boolean;
ariaLabel?: string;
```

**Registry Fields (~10 fields in 5 fieldGroups):**
- items: items array (label + href)
- style: variant (3), size (3), separator (4)
- display: maxItems (0/3/5/7), showHome
- colors: color, activeColor
- accessibility: ariaLabel

### 8.2 Assessment

BreadcrumbRender is well-implemented with proper accessibility (`<nav>`, `<ol>`, `aria-label`, `aria-current="page"`), ellipsis truncation, and home icon support.

**Gaps:**
- `hoverColor`, `separatorColor`, `backgroundColor` exist in render but not in registry
- Registry `separator` has 4 options (chevron/slash/arrow/dot) but render supports 8 (including literal characters `/`, `>`, `→`, `•`)
- Missing converter alias: No direct `Breadcrumb` → `"Breadcrumb"` mapping (only `NavBreadcrumb`, `BreadcrumbTrail`, `BreadcrumbNav`, `PageBreadcrumb`)
- Metadata category is `"buttons"` but registry is `"navigation"`

### 8.3 Enhancement Priority

| Priority | Enhancement | Impact | Effort |
|----------|------------|--------|--------|
| **P0** | Fix metadata category from `"buttons"` to `"navigation"` | Category consistency | Low |
| **P0** | Add `Breadcrumb` → `"Breadcrumb"` to converter typeMap | AI discoverability | Low |
| **P1** | Add `hoverColor`, `separatorColor`, `backgroundColor` to registry | Full editor control | Low |
| **P2** | Add structured data (Schema.org BreadcrumbList) JSON-LD | SEO improvement | Medium |

---

## 9. PaginationRender — Deep Dive & Enhancement Plan

### 9.1 Current Implementation

**Location:** `renders.tsx` L18147 (props interface + render function) → ~L18400 (end)

**Render Props Interface (~18 props):**
```typescript
currentPage?: number; totalPages?: number;
variant?: "default" | "simple" | "minimal" | "dots";
size?: "sm" | "md" | "lg"; shape?: "rounded" | "circle" | "square";
activeColor?: string; activeTextColor?: string; color?: string; hoverColor?: string;
showFirstLast?: boolean; showPrevNext?: boolean;
siblingsCount?: number; boundaryCount?: number;
prevLabel?: string; nextLabel?: string;
onPageChange?: (page: number) => void;
ariaLabel?: string;
```

**Registry Fields (~10 fields in 4 fieldGroups):**
- pages: currentPage (select), totalPages (select)
- style: variant (4), size (3), activeColor
- display: showFirstLast, showPrevNext, siblingsCount (select)
- accessibility: ariaLabel

### 9.2 Assessment

PaginationRender has a solid smart page generation algorithm (`generatePages()`) with sibling and boundary logic. The 4 variants (default with full controls, simple with prev/next + page info, minimal with just numbers, dots with dot indicators) are all well-implemented.

**Gaps:**
- `shape` (3 options), `boundaryCount`, `activeTextColor`, `color`, `hoverColor`, `prevLabel`, `nextLabel` exist in render but NOT in registry fields
- `currentPage` and `totalPages` are `select` fields in registry (dropdown with fixed values) — should be `number` for flexibility
- Metadata category is `"buttons"` but registry is `"interactive"`

### 9.3 Enhancement Priority

| Priority | Enhancement | Impact | Effort |
|----------|------------|--------|--------|
| **P0** | Fix metadata category from `"buttons"` to `"interactive"` | Category consistency | Low |
| **P1** | Add `shape`, `boundaryCount`, `prevLabel`, `nextLabel`, `activeTextColor`, `color`, `hoverColor` to registry | Full render feature access | Low |
| **P1** | Change `currentPage` and `totalPages` from `select` to `number` fields | More flexible | Low |
| **P2** | Add `"compact"` variant (show count only: "Page 3 of 10") | Common pattern | Low |

---

## 10. New Navigation Components

### 10.1 Proposed New Components

| Component | Purpose | Priority | Complexity |
|-----------|---------|----------|-----------|
| **TableOfContents** | Auto-generated TOC from page headings, sticky sidebar | P2 | Medium |
| **BackToTop** | Floating button that appears on scroll, smooth scroll to top | P2 | Low |

**NOT proposed (handled by existing components):**
- Sidebar navigation → Handled by Navbar mobile menu panels (slideRight/slideLeft)
- Skip-to-content → Already a field in Navbar registry (`skipToContent`)
- Mobile drawer → Handled by Navbar mobile menu (4 styles)
- Social links → Already a standalone `SocialLinks` component + built into Footer

### 10.2 TableOfContents Component

**Purpose:** Auto-generates a nested list of links from page heading elements. Common on documentation, blog, and long-form content pages. Optionally sticky-positioned in a sidebar.

**Proposed Props:**
```typescript
interface TableOfContentsProps {
  items?: Array<{ label: string; href: string; level: number }>;
  title?: string;
  variant?: "default" | "compact" | "bordered" | "floating";
  showNumbers?: boolean;
  maxDepth?: number;           // 2 = h2+h3 only, 3 = h2+h3+h4
  highlightActive?: boolean;   // Scroll-spy to highlight current section
  sticky?: boolean;
  activeColor?: string;
  textColor?: string;
  backgroundColor?: string;
  ariaLabel?: string;
}
```

**Converter Aliases:** `TableOfContents`, `TOC`, `PageNav`, `SectionNav`, `ContentNav`

### 10.3 BackToTop Component

**Purpose:** A floating button (typically bottom-right corner) that appears after scrolling past a threshold and smooth-scrolls to page top on click.

**Proposed Props:**
```typescript
interface BackToTopProps {
  showAfter?: number;           // Pixels scrolled before button appears (default: 300)
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  variant?: "circle" | "rounded" | "pill";
  size?: "sm" | "md" | "lg";
  color?: string;
  textColor?: string;
  icon?: "arrow" | "chevron" | "double-arrow";
  showLabel?: boolean;
  label?: string;               // Default: "Back to top"
  ariaLabel?: string;
}
```

**Converter Aliases:** `BackToTop`, `ScrollToTop`, `TopButton`

---

## 11. Mobile Navigation Strategy

### 11.1 Current Mobile Implementation

The Navbar has the most comprehensive mobile handling of any component:

| Feature | Implementation | Location |
|---------|---------------|----------|
| Hamburger button | SVG toggle (3 bars ↔ X icon) | NavbarWithMenu ~L14320 |
| Mobile menu overlay | Fixed backdrop with `bg-black/50` | L14360 |
| Menu panel | Fixed panel with configurable position (left/right/full) | L14370 |
| Link rendering | Block-level links with padding | Mobile panel inner loop |
| CTA in mobile | Optional CTA button at bottom of panel | `showCtaOnMobile` prop |

**Registry Mobile Fields (14 fields in `mobile` fieldGroup):**
- `mobileBreakpoint` (sm/md/lg)
- `mobileMenuStyle` (fullscreen/slideRight/slideLeft/dropdown)
- `mobileMenuBackground`, `mobileMenuTextColor`
- `mobileMenuAnimation` (slide/fade/scale/none), `mobileMenuDuration`
- `showMobileMenuOverlay`, `mobileMenuOverlayColor`, `mobileMenuOverlayOpacity`
- `hamburgerSize`, `hamburgerColor`
- `showCtaInMobileMenu`, `mobileMenuLinkSpacing`

### 11.2 Mobile Gaps

| Gap | Description | Fix |
|-----|-------------|-----|
| **Dropdown links in mobile** | Mobile menu renders flat links only — `dropdownLinks` sub-items not shown | Add expandable sub-lists with chevron toggle per dropdown link |
| **Focus trap** | When mobile menu is open, Tab key can escape to elements behind the menu | Add focus trap (first/last focusable element wrapping) |
| **Escape key** | Mobile menu doesn't close on `Escape` keypress | Add `useEffect` keydown listener for Escape |
| **Body scroll lock** | When mobile menu is open, background page still scrolls | Add `document.body.style.overflow = 'hidden'` toggle |
| **Animation not implemented** | `mobileMenuAnimation` field exists but only slide is implemented (via CSS transform) | Add fade (opacity transition) and scale (transform: scale) options |
| **Breakpoint not dynamic** | `mobileBreakpoint` field exists but hamburger uses hardcoded `md:hidden` | Use dynamic breakpoint class or CSS variable |

### 11.3 Mobile Navigation Best Practices

```
✅ DO:
- Lock body scroll when mobile menu is open
- Trap focus within mobile menu (Tab wraps around)
- Close menu on Escape key
- Close menu when a link is clicked (already implemented)
- Show CTA prominently at bottom of mobile menu
- Preserve scroll position when menu opens/closes
- Support swipe-to-close gesture (future enhancement)

❌ DON'T:
- Let Tab key reach elements behind the open menu
- Leave body scrollable when overlay is active
- Forget aria-expanded on hamburger button (already implemented ✅)
- Use transform animations without will-change for smooth 60fps
```

---

## 12. Scroll Behaviour System

### 12.1 Navbar Scroll Features (Registry Fields)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `position` | select | "sticky" | Positioning mode: relative/sticky/absolute/fixed |
| `stickyOffset` | number | 0 | Top offset for sticky/fixed positioning |
| `hideOnScroll` | toggle | false | Hide navbar when scrolling down |
| `showOnScrollUp` | toggle | false | Show navbar when scrolling up (only works if hideOnScroll=true) |
| `transparentUntilScroll` | toggle | false | Start with transparent background, add solid background after scrolling past threshold |
| `scrollThreshold` | number | 100 | Pixel scroll distance before transparent → solid transition |
| `showScrollProgress` | toggle | false | Show page scroll progress bar |
| `scrollProgressPosition` | select | "top" | Progress bar position: top/bottom of navbar |
| `scrollProgressHeight` | number | 3 | Height in pixels |
| `scrollProgressColor` | color | "" | Progress bar fill colour (uses accent/CTA colour if empty) |
| `scrollProgressBackground` | color | "transparent" | Progress bar track colour |
| `scrollProgressStyle` | select | "bar" | Style: bar/line/gradient |

### 12.2 Implementation Pattern

The render function needs a scroll handler. Recommended pattern using refs and effects:

```typescript
function NavbarWithMenu(props: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrollState, setScrollState] = React.useState({
    hidden: false,
    transparent: props.transparentUntilScroll ?? false,
    progress: 0,
  });
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    if (!props.hideOnScroll && !props.transparentUntilScroll && !props.showScrollProgress) return;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (currentY / docHeight) * 100 : 0;
      const scrollingDown = currentY > lastScrollY.current;

      setScrollState({
        hidden: props.hideOnScroll && scrollingDown && currentY > (props.scrollThreshold ?? 100),
        transparent: props.transparentUntilScroll && currentY < (props.scrollThreshold ?? 100),
        progress,
      });

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [props.hideOnScroll, props.transparentUntilScroll, props.showScrollProgress, props.scrollThreshold]);

  // Use scrollState in JSX...
}
```

### 12.3 Performance Considerations

```
✅ DO:
- Use { passive: true } on scroll listener (already noted above)
- Debounce or use requestAnimationFrame for scroll calculations
- Use CSS transform: translateY(-100%) for hiding (GPU-accelerated, avoids layout)
- Use will-change: transform on the nav element
- Use CSS transition for smooth hide/show (transition: transform 0.3s ease)

❌ DON'T:
- Use setTimeout inside scroll handlers
- Trigger React re-renders on every scroll pixel (batch state updates)
- Use top: -100px for hiding (causes layout shifts)
- Add scroll listeners in components that don't need scroll features
```

---

## 13. Accessibility & ARIA Patterns

### 13.1 Component-Level ARIA Requirements

| Component | ARIA Pattern | Required Attributes |
|-----------|-------------|-------------------|
| **Navbar** | Navigation landmark | `<nav role="navigation" aria-label="Main navigation">` |
| **Footer** | Contentinfo landmark | `<footer role="contentinfo">` (implicit with `<footer>`) |
| **Tabs** | Tabs pattern | `role="tablist"` on container, `role="tab"` + `aria-selected` on buttons, `role="tabpanel"` + `aria-labelledby` on content |
| **Link** | Link | `<a>` with visible text, `aria-label` for icon-only, `rel="noopener noreferrer"` for external |
| **Breadcrumb** | Breadcrumb | `<nav aria-label="Breadcrumb">` + `<ol>` + `aria-current="page"` on last item |
| **Pagination** | Navigation | `<nav aria-label="Pagination">` + `aria-current="page"` on active |

### 13.2 Current Accessibility Status

| Component | Semantic HTML | ARIA Attributes | Keyboard Nav | Focus Indicators | Status |
|-----------|-------------|----------------|-------------|-----------------|--------|
| Navbar | ✅ `<nav>` | ✅ `aria-label`, `aria-expanded` on hamburger | ⚠️ No Escape close, no focus trap | ⚠️ Default only | Good |
| Footer | ✅ `<footer>` (implicit) | ❌ No `aria-label` | ✅ Links are focusable | ⚠️ Default only | Decent |
| Tabs | ❌ `<section>`, `<div>`, `<button>` | ❌ No `role="tablist"`, no `role="tab"` | ❌ No arrow key nav | ⚠️ Default only | Poor |
| Link | ✅ `<a>` | ✅ `aria-label`, auto `rel` for _blank | ✅ Native | ✅ Via underline animations | Good |
| Breadcrumb | ✅ `<nav>`, `<ol>` | ✅ `aria-label`, `aria-current="page"` | ✅ Native | ⚠️ Default only | Excellent |
| Pagination | ✅ `<nav>` | ✅ `aria-label`, `aria-current="page"` | ✅ Native | ⚠️ Default only | Good |

### 13.3 Tabs ARIA Fix (Critical)

The current Tabs implementation uses `<button>` elements for tabs and `<div>` for content but is missing the complete ARIA tabs pattern:

**Required Fix:**
```tsx
// Tab list container
<div role="tablist" aria-label={ariaLabel || "Tabs"}>
  {tabs.map((tab, i) => (
    <button
      key={i}
      role="tab"
      id={`tab-${id}-${i}`}
      aria-selected={i === activeTab}
      aria-controls={`tabpanel-${id}-${i}`}
      tabIndex={i === activeTab ? 0 : -1}
      onClick={() => setActiveTab(i)}
      onKeyDown={(e) => handleKeyDown(e, i)}
    >
      {tab.label}
    </button>
  ))}
</div>

// Tab panel
<div
  role="tabpanel"
  id={`tabpanel-${id}-${activeTab}`}
  aria-labelledby={`tab-${id}-${activeTab}`}
  tabIndex={0}
>
  {tabs[activeTab]?.content}
</div>
```

**Keyboard handler:**
```typescript
const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
  if (e.key === "ArrowRight") setActiveTab((index + 1) % tabs.length);
  if (e.key === "ArrowLeft") setActiveTab((index - 1 + tabs.length) % tabs.length);
  if (e.key === "Home") setActiveTab(0);
  if (e.key === "End") setActiveTab(tabs.length - 1);
};
```

### 13.4 Skip-to-Content

The Navbar registry already has a `skipToContent` field. Implementation:

```tsx
{skipToContent && (
  <a
    href={skipToContent}
    className="sr-only focus:not-sr-only focus:absolute focus:z-[999] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:underline"
  >
    Skip to main content
  </a>
)}
```

This should be the **first element** inside `<nav>`, visible only on keyboard focus.

---

## 14. Dark Mode & Theming Strategy

### 14.1 Navigation Dark Mode Requirements

| Component | Dark BG Default | Dark Mode Behaviour |
|-----------|----------------|-------------------|
| **Navbar** | `#ffffff` (light) | When `backgroundColor` is dark, text/links/hamburger auto-adjust via explicit `textColor` prop |
| **Footer** | `#111827` (dark by default) | Already dark — link colours use `linkColor`/`linkHoverColor` props |
| **Tabs** | Transparent | Inherits from parent section's background |
| **Link** | Inherits | Uses CSS variables `var(--primary)`, auto-adapts |
| **Breadcrumb** | Transparent | Uses CSS variables `var(--foreground)`, `var(--muted-foreground)` |
| **Pagination** | Transparent | Uses CSS variables |

### 14.2 Current Dark Mode Implementation

- **Navbar:** No `isDarkBackground()` usage. Relies on explicit `textColor` prop. Works but not automatic.
- **Footer:** No `isDarkBackground()` usage, but defaults are already dark-friendly (`bg: #111827`, `text: #f9fafb`, `links: #9ca3af`).
- **Tabs:** No dark-mode awareness. Hard-codes some colours.
- **Breadcrumb/Link/Pagination:** Use CSS custom properties — naturally adapts to theme context.

### 14.3 Enhancement Recommendations

For **Navbar** and **Footer**, adding `isDarkBackground()` detection would auto-derive sensible text/link colours when users pick a custom background:

```typescript
// In NavbarWithMenu
const darkBg = isDarkBackground(backgroundColor);
const resolvedTextColor = textColor || (darkBg ? "#f9fafb" : "#1f2937");
const resolvedBorderColor = borderColor || (darkBg ? "#374151" : "#e5e7eb");
```

For **Tabs**, when used inside a dark section, inherit the section's dark-mode context or detect own `backgroundColor`.

---

## 15. Registry & Converter Alignment

### 15.1 Current Converter Aliases

| Registry Type | Aliases | Count | Missing? |
|--------------|---------|-------|----------|
| **Navbar** | `NavbarBlock`, `Navbar` | 2 | — |
| **Footer** | `FooterBlock`, `Footer` | 2 | — |
| **Tabs** | `TabsBlock`, `TabsSection`, `Tabs` | 3 | — |
| **Link** | `Link`, `TextLink`, `InlineLink`, `NavLink` | 4 | — |
| **Breadcrumb** | `NavBreadcrumb`, `BreadcrumbTrail`, `BreadcrumbNav`, `PageBreadcrumb` | 4 | ⚠️ Missing direct `Breadcrumb` → `"Breadcrumb"` |
| **Pagination** | `Pagination`, `Pager`, `PageNav`, `PageNumbers` | 4 | — |

### 15.2 KNOWN_REGISTRY_TYPES Verification

All 6 navigation types are present in `KNOWN_REGISTRY_TYPES` (L728):
- ✅ `"Navbar"`, `"Footer"`, `"Tabs"`, `"Link"`, `"Breadcrumb"`, `"Pagination"`

### 15.3 navLinkKeys Special Handling

The converter has navigation-specific link handling at L247-287:

```typescript
const navLinkKeys = [
  "links", "bottomLinks", "dropdownLinks", "socialLinks",
  "legalLinks", "footerLinks", "navLinks", "menuLinks",
  "columns", // Footer columns contain nested links
];
```

This auto-normalises link arrays to `{ label, href }` format. When adding new navigation components with link arrays, verify the field name is in `navLinkKeys`.

### 15.4 Fixes Required

| Fix | File | Detail |
|-----|------|--------|
| Add `Breadcrumb` alias | `converter.ts` typeMap | Add `Breadcrumb: "Breadcrumb"` alongside existing aliases |
| Add Tabs metadata | `component-metadata.ts` | Add complete metadata entry for Tabs |
| Fix Link category | `component-metadata.ts` | Change from `"buttons"` to `"navigation"` |
| Fix Breadcrumb category | `component-metadata.ts` | Change from `"buttons"` to `"navigation"` |
| Fix Pagination category | `component-metadata.ts` | Change from `"buttons"` to `"interactive"` (match registry) |

---

## 16. Implementation Phases

### Phase 1 — Critical Alignment (No New Features)

**Goal:** Make existing registry fields actually work. Fix all prop mismatches, missing metadata, and category inconsistencies.

| Task | Component | Files Changed | Effort |
|------|-----------|---------------|--------|
| Fix Navbar prop name mismatches (Section 4.2) | Navbar | `renders.tsx` | Medium |
| Sync Footer render with registry props | Footer | `renders.tsx` | Medium |
| Add Tabs metadata entry | Tabs | `component-metadata.ts` | Low |
| Fix Link/Breadcrumb/Pagination metadata categories | Link, Breadcrumb, Pagination | `component-metadata.ts` | Low |
| Add `Breadcrumb` converter alias | Breadcrumb | `converter.ts` | Low |
| Add missing Pagination registry fields (shape, boundaryCount, etc.) | Pagination | `core-components.ts` | Low |
| Add missing Link registry fields (hoverColor, iconName, etc.) | Link | `core-components.ts` | Low |
| Add missing Breadcrumb registry fields (hoverColor, separatorColor, backgroundColor) | Breadcrumb | `core-components.ts` | Low |

### Phase 2 — Desktop Dropdown & Scroll (Navbar Feature Completion)

**Goal:** Close the two biggest Navbar gaps — desktop dropdowns and scroll behaviour.

| Task | Component | Files Changed | Effort |
|------|-----------|---------------|--------|
| Implement desktop dropdown rendering (hover/click) | Navbar | `renders.tsx` | Medium |
| Implement mobile dropdown sub-lists | Navbar | `renders.tsx` | Medium |
| Implement scroll hide/show/transparent behaviour | Navbar | `renders.tsx` | Medium |
| Implement scroll progress bar | Navbar | `renders.tsx` | Low |
| Add skip-to-content rendering | Navbar | `renders.tsx` | Low |
| Add Escape key + focus trap to mobile menu | Navbar | `renders.tsx` | Medium |
| Add body scroll lock when mobile menu open | Navbar | `renders.tsx` | Low |

### Phase 3 — Tabs Variant Parity & Accessibility

**Goal:** Implement missing tab variants and add full ARIA tabs pattern.

| Task | Component | Files Changed | Effort |
|------|-----------|---------------|--------|
| Implement 4 missing variants (enclosed/soft/minimal/lifted) | Tabs | `renders.tsx` | Medium |
| Add ARIA tablist pattern (role, aria-selected, aria-controls) | Tabs | `renders.tsx` | Medium |
| Add keyboard navigation (arrow keys, Home, End) | Tabs | `renders.tsx` | Medium |
| Implement vertical tab layout (tabsPosition left/right) | Tabs | `renders.tsx` | Medium |
| Add tab content transition animations | Tabs | `renders.tsx` | Medium |

### Phase 4 — Footer Extended Variant & New Components

**Goal:** Complete the Footer and add optional new components.

| Task | Component | Files Changed | Effort |
|------|-----------|---------------|--------|
| Implement `"extended"` Footer variant | Footer | `renders.tsx` | Medium |
| Render contact info section in Footer | Footer | `renders.tsx` | Low |
| Render app store badges in Footer | Footer | `renders.tsx` | Low |
| Expand social icons to 8 platforms | Footer | `renders.tsx` | Low |
| Create TableOfContents component (optional) | New | All 4 files | Medium |
| Create BackToTop component (optional) | New | All 4 files | Low |

---

## 17. Testing & Quality Gates

### 17.1 Component Test Matrix

| Test | Navbar | Footer | Tabs | Link | Breadcrumb | Pagination |
|------|--------|--------|------|------|------------|------------|
| Renders with zero props | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| All variants render | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ✅ |
| Dark background detection | ⬜ | ⬜ | ⬜ | N/A | N/A | N/A |
| Mobile menu opens/closes | ⬜ | N/A | N/A | N/A | N/A | N/A |
| Keyboard navigation | ⬜ | N/A | ⬜ | ✅ | ✅ | ✅ |
| ARIA attributes present | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ✅ |
| Registry ↔ render prop parity | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Converter aliases resolve | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ |

### 17.2 Visual Regression Tests

For navigation components, visual regression matters because they appear on **every page**. Key scenarios:

1. **Navbar at different scroll positions** — at top (transparent), mid-scroll (solid), scrolling down (hidden), scrolling up (revealed)
2. **Navbar mobile menu** — all 4 styles (fullscreen, slideRight, slideLeft, dropdown)
3. **Footer variants** — standard, centered, simple, extended
4. **Tabs variants** — all 7 variants × 3 sizes
5. **Breadcrumb truncation** — 3, 5, 7 items with maxItems applied
6. **Pagination states** — page 1 (prev disabled), mid-page, last page (next disabled)

### 17.3 Accessibility Audit Checklist

```
□ Lighthouse Accessibility score ≥ 95 for pages with all navigation components
□ axe-core reports zero "critical" or "serious" violations
□ All navigation components are keyboard-navigable (Tab, Enter, Escape, Arrow)
□ Screen reader announces all interactive elements correctly
□ Focus indicators are visible on all interactive elements
□ Colour contrast ratio ≥ 4.5:1 for all text/background combinations
□ Skip-to-content link appears on Tab focus before navbar
□ Mobile menu has focus trap and Escape close
□ Breadcrumb last item has aria-current="page"
□ Pagination active page has aria-current="page"
□ Tabs follow WAI-ARIA Tabs pattern with role/aria-selected/aria-controls
```

---

## Appendix A — Field Count Summary

| Component | Render Props | Registry Fields | Metadata Entry | Converter Aliases | KNOWN_REGISTRY |
|-----------|-------------|-----------------|----------------|-------------------|----------------|
| Navbar | ~28 | ~70 | ✅ | 2 | ✅ |
| Footer | ~18 | ~50+ | ✅ | 2 | ✅ |
| Tabs | ~23 | ~50+ | ❌ Missing | 3 | ✅ |
| Link | ~16 | ~10 | ✅ (wrong category) | 4 | ✅ |
| Breadcrumb | ~13 | ~10 | ✅ (wrong category) | 4 (missing direct) | ✅ |
| Pagination | ~18 | ~10 | ✅ (wrong category) | 4 | ✅ |
| **Totals** | **~116** | **~200+** | **5/6** | **19** | **6/6** |

## Appendix B — Quick Reference: Where Things Are

```
NAVBAR
  Render:   src/lib/studio/blocks/renders.tsx          L14025 (interface) → L14093 (NavbarWithMenu) → L14397 (export)
  Registry: src/lib/studio/registry/core-components.ts L10737 (defineComponent) → ~L11400 (end) — 9 fieldGroups
  Metadata: src/lib/studio/registry/component-metadata.ts L526
  Converter: src/lib/ai/website-designer/converter.ts  L384 (NavbarBlock), L519 (Navbar)

FOOTER
  Render:   src/lib/studio/blocks/renders.tsx          L14406 (interface) → L14438 (render) → ~L14694 (end)
  Registry: src/lib/studio/registry/core-components.ts L11402 (defineComponent) → ~L11850 (end) — 9 fieldGroups
  Metadata: src/lib/studio/registry/component-metadata.ts L538
  Converter: src/lib/ai/website-designer/converter.ts  L385 (FooterBlock), L520 (Footer)

TABS
  Render:   src/lib/studio/blocks/renders.tsx          L17060 (interface) → L17083 (render) → ~L17200 (end)
  Registry: src/lib/studio/registry/core-components.ts L16798 (defineComponent) → ~L17200 (end) — 12 fieldGroups
  Metadata: MISSING — needs to be added to component-metadata.ts
  Converter: src/lib/ai/website-designer/converter.ts  L435 (TabsBlock), L436 (TabsSection), L531 (Tabs)

LINK
  Render:   src/lib/studio/blocks/renders.tsx          L17521 (interface) → L17551 (render) → ~L17660 (end)
  Registry: src/lib/studio/registry/core-components.ts L12034 (defineComponent) → L12160 (end) — 4 fieldGroups
  Metadata: src/lib/studio/registry/component-metadata.ts L900 (category: "buttons" ← should be "navigation")
  Converter: src/lib/ai/website-designer/converter.ts  L569-573 (Link, TextLink, InlineLink, NavLink)

BREADCRUMB
  Render:   src/lib/studio/blocks/renders.tsx          L17920 (interface) → L17938 (render) → ~L18146 (end)
  Registry: src/lib/studio/registry/core-components.ts L12161 (defineComponent) → L12299 (end) — 5 fieldGroups
  Metadata: src/lib/studio/registry/component-metadata.ts L945 (category: "buttons" ← should be "navigation")
  Converter: src/lib/ai/website-designer/converter.ts  L581-584 (NavBreadcrumb, BreadcrumbTrail, BreadcrumbNav, PageBreadcrumb) — MISSING direct "Breadcrumb"

PAGINATION
  Render:   src/lib/studio/blocks/renders.tsx          L18147 (interface + render) → ~L18400 (end)
  Registry: src/lib/studio/registry/core-components.ts L17626 (defineComponent) → L17780 (end) — 4 fieldGroups
  Metadata: src/lib/studio/registry/component-metadata.ts L960 (category: "buttons" ← should be "interactive")
  Converter: src/lib/ai/website-designer/converter.ts  L585-588 (Pagination, Pager, PageNav, PageNumbers)
```

---

*Navigation Components Master Plan v1.0 — DRAMAC CMS*
*Document covers 6 existing components, 2 proposed, 200+ props, 25+ variants, 19 converter aliases*
*Primary focus: Registry/Render sync, Desktop Dropdowns, Scroll Behaviour, ARIA Accessibility*

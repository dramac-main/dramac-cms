# Implementation Prompt — DRAMAC Layout Components

> **Paste this prompt into a new AI session, followed by the full contents of `LAYOUT-COMPONENTS-MASTER-PLAN.md`.**

---

## PROMPT START

You are implementing a comprehensive layout component overhaul for **DRAMAC CMS**, an enterprise modular CMS platform. Below this prompt is the **LAYOUT-COMPONENTS-MASTER-PLAN.md** — a ~2000-line specification that defines EVERY component, prop, type, render strategy, and implementation detail you need to build. Your job is to implement it **phase by phase, section by section**, exactly as specified.

### Platform Context

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 — **CRITICAL: No template literal class names.** Tailwind only detects classes at build time. Every dynamic class MUST come from a pre-built lookup map (e.g., `const gapMap = { "0": "gap-0", "1": "gap-1", ... }`). Never write `` `gap-${value}` ``.
- **Animation:** Framer Motion 12 — Use `motion.div`, `useScroll`, `useTransform`, `useInView`, `AnimatePresence`. Tree-shake by importing only what's needed.
- **Database:** Supabase (PostgreSQL) — Component data is JSON stored in page/section rows.
- **Drag & Drop:** dnd-kit — Layout components are drop targets for child blocks.
- **Monorepo:** pnpm workspace. Dashboard is in `/next-platform-dashboard/`.
- **Brand Colors:** 5 core colors resolved via `resolveBrandColors()` → 40+ semantic CSS variables on `.studio-renderer`. Always support `"brand-primary"`, `"brand-secondary"`, etc. as color values.
- **Color Pipeline:** Published sites use **inline hex styles** (not Tailwind color classes) for explicit AI-set colors. Dark/light adaptation happens at render-time: each layout render calls `isDarkBackground(bgColor)` and adapts shadows, borders, glassmorphism, and child defaults. The existing `resolveBrandColors()` already detects `isDarkBg` and derives appropriate surface colors. ~11 of the 60+ built-in palettes are dark-themed.
- **System Dark Mode:** The platform supports `prefers-color-scheme` dark/light switching via dual CSS variable injection. `resolveDualPalettes()` produces light + dark palettes. StudioRenderer injects a `<style>` tag with `@media (prefers-color-scheme: dark)` CSS var overrides scoped to `.studio-renderer`. **New sites default to `"auto"` (set at creation time); existing sites without the setting default to `"light"` (zero regression).** Premium components adapt via CSS variable injection mode in `injectBrandColors()` — injecting `var(--brand-*)` references instead of hex when `colorScheme !== "light"`. **CRITICAL:** Because the AI always sets explicit `backgroundColor` on every section (inline styles), a `remapNeutralColor()` utility detects near-white/near-black neutral colors (low saturation < 0.15, appropriate luminance) and replaces them with CSS variable references at render time — ensuring ALL content sections adapt to dark mode, not just premium components. The system also handles: smooth color transitions (0.3s ease), browser chrome adaptation (`<meta name="theme-color">`), dark logo variants (`<picture>` + media query), dark favicon variants (`<link>` + media attribute), image dimming in dark mode (`filter: brightness(0.85)`), print stylesheet (forces light for printing), an optional visitor manual toggle (DarkModeToggle component with localStorage persistence), a Studio preview toggle for site owner dark/light preview, **CSS variable-based elevation/shadow system** (`--elevation-sm` through `--elevation-2xl` + glow variants) so shadows adapt instead of disappearing on dark backgrounds, **scrollbar & native control adaptation** via `color-scheme: light dark` on auto sites (replacing the conflicting `color-scheme: light !important`), and **gradient background remapping** via `remapNeutralGradient()` which remaps neutral color stops in gradient strings while preserving branded stops. See **Section 12.7** of the master plan for full specification (33 subsections, 12.7.1–12.7.33).

### Critical Files You'll Modify

All paths relative to `/next-platform-dashboard/src/`:

| File | Purpose | What to do |
|------|---------|------------|
| `lib/studio/blocks/renders.tsx` | Render functions for all components (~4000 lines) | Rewrite all 6 layout renders + add 8 new ones |
| `lib/studio/registry/core-components.ts` | Component registrations (~11,650 lines) | Update 6 layout registrations + add 8 new ones with full prop definitions |
| `lib/studio/blocks/render-wrapper.tsx` | Universal props wrapper (~200 lines) | Upgrade from CSS-class animations to conditional Framer Motion wrapping |
| `lib/ai/website-designer/converter.ts` | AI output → component props mapper | Add type mappings for all new layout types + responsive value handling |
| `lib/ai/website-designer/prompts.ts` | System prompts for AI Designer | Add layout selection rules, responsive rules, animation guidance |
| `lib/ai/website-designer/engine.ts` | AI generation orchestrator | Update to handle new component types in generation pipeline |
| `lib/studio/registry/component-metadata.ts` | Rich metadata for AI context (~50 entries) | Add/update metadata for all 14 layout components with whenToUse, avoidWith, exampleProps |

### Responsive Value Pattern (MUST follow everywhere)

```typescript
type ResponsiveValue<T> = {
  mobile: T;       // Required — mobile-first base
  tablet?: T;      // Optional — 640px+ override
  desktop?: T;     // Optional — 1024px+ override
};

// Resolution function — outputs Tailwind classes for each breakpoint
function resolveResponsive<T>(value: ResponsiveValue<T> | T, classMap: Record<string, string>, smPrefix = "sm:", lgPrefix = "lg:"): string {
  if (typeof value !== "object" || !("mobile" in value)) {
    return classMap[String(value)] || "";
  }
  const classes: string[] = [];
  if (value.mobile != null) classes.push(classMap[String(value.mobile)] || "");
  if (value.tablet != null) classes.push(`${smPrefix}${classMap[String(value.tablet)] || ""}`);
  if (value.desktop != null) classes.push(`${lgPrefix}${classMap[String(value.desktop)] || ""}`);
  return classes.filter(Boolean).join(" ");
}
```

### Class Map Pattern (MUST follow for every dynamic Tailwind class)

```typescript
// CORRECT — build-time safe
const paddingMap: Record<string, string> = {
  "0": "p-0", "1": "p-1", "2": "p-2", "3": "p-3", "4": "p-4",
  "5": "p-5", "6": "p-6", "8": "p-8", "10": "p-10", "12": "p-12",
  "16": "p-16", "20": "p-20", "24": "p-24",
};

// WRONG — will not work in production
const padding = `p-${value}`; // ❌ NEVER DO THIS
```

### Implementation Order

Follow the **4-phase order** defined in Section 15 of the master plan:

**Phase 1 — Foundation (Fix & Upgrade Existing):**
1. Create the `resolveResponsive()` utility and comprehensive Tailwind class maps (padding, margin, gap, width, height, columns, border-radius, font-size, opacity, etc.)
2. Fix Columns render — replace broken template literals with class maps
3. Fix Spacer render — handle ResponsiveValue objects
4. **Create `isDarkBackground()` utility** — detects if a hex color is dark (luminance ≤ 0.45). Used by ALL layout renders.
5. **Create `resolveShadow()` utility** — on dark bg: returns glow-style `box-shadow` (white/light rgba). On light bg: returns empty string (use Tailwind shadow classes).
6. **Create `resolveGlassmorphism()` utility** — dark bg: `rgba(255,255,255,0.05)` + blur(16px). Light bg: `rgba(255,255,255,0.7)` + blur(12px).
7. Upgrade Section render — gradient backgrounds, video backgrounds, shape dividers, Background Effects Engine (animated gradients, patterns, particles, gradient mesh, scroll backgrounds, SVG backgrounds, glow/spotlight), responsive height, scroll-snap, **dark-aware overlay/particle/glow defaults**
8. Upgrade Container render — glassmorphism (dark/light-aware), gradient borders, aspect ratios, container queries, **dark-aware border color defaults**
9. Upgrade Card render — variant presets, 3D tilt hover, glassmorphism, gradient borders, **dark-aware: card bg = lighter shade of section bg, shadow→glow on dark, border = rgba white on dark**
10. Upgrade Divider render — gradient, fade, icon, vertical, animated draw, **dark-aware color defaults**

**Phase 2 — New Components:**
8. Build Stack component (vertical/horizontal, the AI's default inner layout)
9. Build FlexBox component (dedicated flexbox with all flex props top-level)
10. Build Grid component (CSS Grid, areas, auto-flow, presets)
11. Build Wrapper component (invisible layout helper)
12. Build AspectRatioBox component (ratio-preserving container)
13. Build Overlay component (layer for overlaid content, hover-reveal)

**Phase 3 — Advanced Experiences:**
14. Build ScrollSection (full-page scroll-snap, progress indicators)
15. Build StickyContainer (scroll storytelling — pinned side + scrolling content)
16. Upgrade render-wrapper.tsx universal animation system (Framer Motion, scroll-driven, stagger, 3D tilt, cursor effects)
17. Implement shape divider SVG library (10+ shapes)

**Phase 4 — AI Integration & Polish:**
18. Update component-metadata.ts with rich AI context for all 14 components
19. Update prompts.ts with layout selection rules and responsive generation rules
20. Update converter.ts with new type mappings and responsive value preservation
21. Register all 14 components in core-components.ts with full editor field definitions
22. **Dark/light audit** — Verify every layout render calls `isDarkBackground()` and adapts correctly. Test with a dark-themed site (e.g., luxury-black-gold palette) and a light-themed site. Cards, shadows, borders, glassmorphism, dividers, overlays must all look correct on both.

**Phase 5 — System Dark Mode (5A-5N):**
23. Create `deriveDarkComplement()` utility — dark palette derivation with inverted luminance and preserved brand hues (Section 12.7.1)
24. Create `resolveDualPalettes()` utility — produces `{ light, dark }` palette pair (Section 12.7.1)
25. Create `generateDarkModeCSSOverrides()` utility — produces dark CSS vars + smooth transition CSS + image dimming filter inside `@media (prefers-color-scheme: dark)` (Sections 12.7.2, 12.7.10, 12.7.14)
26. Add `colorScheme` site setting — "Auto" (default for new sites), "Light", "Dark". Set `"auto"` in `createSite()`. Show "Dark Mode Logo" + "Dark Mode Favicon" uploads when applicable. (Sections 12.7.3, 12.7.13, 12.7.18)
27. Update `generateBrandCSSVars()` — expand with `--brand-{fieldKey}` vars for every BRAND_COLOR_MAP entry (Section 12.7.7)
28. Update `injectBrandColors()` — add `colorScheme` parameter. `"light"` = hex (current). `"auto"/"dark"` = `var(--brand-*)` references (Section 12.7.7)
29. Create `remapNeutralColor()` utility — In `lib/studio/engine/color-remap.ts`. Luminance + saturation detection replaces neutral hex with CSS var refs for `colorScheme !== "light"` sites. **CRITICAL for content section dark mode.** (Section 12.7.16)
30. Update ALL layout component renders to call `remapNeutralColor()` — Section/Card/Container/Columns renders pass AI-set colors through remapping when `colorScheme !== "light"`. Near-white → `var(--color-background)`, near-black text → `var(--color-foreground)`, branded colors stay as hex. (Section 12.7.16)
31. Update StudioRenderer — inject `<style>` tag with dark overrides, FOUC-prevention `no-transitions` class, pass `colorScheme` to `injectBrandColors()` (Sections 12.7.4, 12.7.10)
32. Update ThemeProvider + `app/site/[domain]/layout.tsx` — honor `colorScheme`, inject dual `<meta name="theme-color">`, add `color-scheme` on `<html>`, add localStorage FOUC-prevention `<script>`, add favicon `<link>` tags with media attribute for dark variant (Sections 12.7.4, 12.7.11, 12.7.12, 12.7.18)
33. Update print stylesheet — expand `@media print` to force light colors on ALL `.studio-renderer` sections/cards, remove image dimming, override `print-color-adjust` (Section 12.7.17)
34. Update Navbar/Header renders — `<picture>` logo swap for dark mode (Section 12.7.13)
35. Add `data-no-dim` to hero/key image blocks, add "Dark Mode Image" field to Image blocks (Section 12.7.14)
36. Build DarkModeToggle component — three-state toggle (Light/Dark/Auto), localStorage persistence, `data-theme` attribute, register in core-components.ts (Section 12.7.12)
37. Build Studio dark mode preview toggle — three-state toolbar button, `postMessage` to canvas iframe (Section 12.7.15)
38. Comprehensive dark mode end-to-end testing — all layout + premium components, neutral color remapping, logos, images, print, favicon, visitor toggle, Studio preview, FOUC, WCAG AA contrast, browser chrome (Section 17.4)

### Key Rules

1. **Every component render is a pure function** — `(props, children, brandColors) => JSX`
2. **Framer Motion is conditional** — Only wrap in `motion.div` when animation/motion props are set. Otherwise render plain `<div>` / `<section>` for zero overhead.
3. **Mobile-first always** — `mobile` value generates base classes, `tablet` gets `sm:` prefix, `desktop` gets `lg:` prefix.
4. **No horizontal overflow** — Every layout MUST `max-w-full overflow-x-hidden` on mobile unless explicitly set otherwise.
5. **Touch-friendly** — Minimum 44px tap targets, minimum 8px gap between interactive elements.
6. **Performance budget** — Layout JS bundle < 50KB gzipped. Lazy-load heavy features (particles, 3D tilt, video).
7. **All colors support brand tokens** — Anywhere a color is accepted, support `"brand-primary"`, `"brand-secondary"`, `"brand-accent"`, `"brand-dark"`, `"brand-light"` alongside hex/rgb/named colors.
8. **Background effect layers are pointer-events: none** — Only the content layer receives pointer events.
9. **Shape dividers are inline SVG** — Not images. Render as `<svg>` elements positioned absolute at top/bottom of sections.
10. **Particles use lightweight canvas** — Not a library. Simple dot/line animation on `<canvas>` element, lazy-loaded, paused when off-screen.
11. **Dark/light background awareness** — Every layout component with a `backgroundColor` MUST call `isDarkBackground()` and adapt shadows (use glow on dark), borders (use `rgba(255,255,255,0.1)` on dark), glassmorphism tint, card background defaults, and text contrast accordingly. Never hardcode `#ffffff` for cards on dark sections. See **Section 12** of the master plan for full specification.
12. **System dark mode dual-default pattern** — Every layout render MUST use Tailwind semantic classes as defaults (`bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`) and ONLY use inline `style` for explicit custom colors set by the user/AI. This enables `prefers-color-scheme` dark mode switching via CSS variable overrides. When `props.backgroundColor` is empty/undefined, use `className="bg-background"`. When set, use `style={{ backgroundColor: props.backgroundColor }}`. See **Section 12.7.5** of the master plan.
13. **Premium component dark mode** — In Phase 5, `injectBrandColors()` MUST be updated to inject `var(--brand-*)` CSS variable references instead of hex values when `colorScheme !== "light"`. This makes all 45 premium components auto-adapt with zero modifications to their individual render functions. See **Section 12.7.7**.
14. **Dark mode completeness** — The dark mode implementation must be COMPLETE: every visual element on the page (layout components, premium components, logos, images, browser chrome) must adapt. Half-dark sites (where the navbar switches but content sections stay light) are unacceptable. See **Sections 12.7.7–12.7.18**.
15. **Neutral color remapping (CRITICAL)** — Because the AI always sets explicit `backgroundColor` on every section, inline styles defeat CSS variable overrides. The `remapNeutralColor()` utility (Section 12.7.16) MUST be called in every layout render when `colorScheme !== "light"`. It detects neutral colors (low saturation < 0.15) by luminance and replaces them with CSS variable references (`var(--color-background)`, `var(--color-muted)`, `var(--color-foreground)`). Branded/accent colors (high saturation) stay as inline hex. Without this, dark mode only affects premium components — content sections stay light.
16. **Elevation & scrollbar adaptation** — All `boxShadow` values in layout renders MUST use CSS variable-based elevation tokens (`var(--elevation-sm)` through `var(--elevation-2xl)`) instead of hardcoded `rgba(0,0,0,...)`. The elevation vars resolve to appropriate shadows in light mode and higher-contrast shadows + glow variants in dark mode (Section 12.7.19). Published sites with `colorScheme: "auto"` MUST set `color-scheme: light dark` on `<html>` via `data-color-scheme="auto"` — NOT `color-scheme: light !important` (Section 12.7.20). Gradient backgrounds MUST be remapped via `remapNeutralGradient()` so neutral color stops adapt to dark mode while branded stops stay as hex (Section 12.7.21).
17. **Error pages & residual hardcoded colors** — Published site 404/500 pages (`src/app/site/[domain]/`) MUST use Tailwind semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`) — NOT hardcoded `bg-white`, `text-gray-*`, or inline `color: '#666'` (Section 12.7.22). Additionally, ~25 render functions in `renders.tsx` still use `text-gray-*` / `bg-white` instead of semantic tokens — these must be batch-replaced during Phase 5K (Section 12.7.23). Exception list: Toast "light" variant, payment brand colors, image overlay controls, and color swatch names are intentionally hardcoded and must NOT be changed.
18. **Blog & prose dark mode** — Public blog pages (`/blog/[subdomain]/`) are published-site routes visible to visitors. ALL `text-gray-*` / `bg-gray-*` hardcoded classes MUST be replaced with semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-muted`). The Tailwind prose wrapper MUST include `dark:prose-invert` so typography adapts. User-pasted HTML with inline `style="color: #333"` MUST be handled via a `.prose-blog-content` CSS override that strips inline colors in dark mode. Blog routes MUST have a layout that sets `data-color-scheme` on `<html>` (same as `PublishedSiteLayout`) so CSS variable overrides activate. See Section 12.7.24, Phase 5L (steps 41-43).
19. **Portal, form feedback & StorefrontWidget dark mode** — The customer portal (`/portal/`) has ~50+ hardcoded status badge/stat classes (`bg-yellow-100 text-yellow-800`, `text-blue-600`, etc.) across ~12 files that MUST have `dark:` Tailwind variants added (Section 12.7.25). FormRender success/error states (`bg-green-50 text-green-700`) MUST have `dark:` variants; ContactFormRender MUST replace hardcoded hex with CSS variable references (`var(--color-background)`, `var(--color-foreground)`, etc.) so it adapts to system dark mode, not just section background darkness (Section 12.7.26). StorefrontWidget MUST support `theme: "auto"` that uses `@media (prefers-color-scheme: dark)` + add dark variants for error/sale/discount colors (Section 12.7.27). See Phase 5M (steps 44-48).
20. **Embed, quote portal, live chat widget, mobile & canvas dark mode** — Embed error states (`/embed/booking/`, `/embed/[moduleId]/`, `module-embed-renderer.tsx`) MUST use `@media (prefers-color-scheme: dark)` CSS blocks for their error/loading UI since they render standalone (Section 12.7.28). The quote portal (`/quote/[token]/`) MUST NOT force `className="light"` — remove it and replace hardcoded icon colors (`text-blue-500`, `text-green-600`, `text-red-600`) with semantic tokens; the signature canvas stroke and `text-red-600` in reject dialog need `dark:` variants (Section 12.7.29). The live chat widget (`src/components/live-chat/widget/`) renders in an **iframe** that the dashboard's `dark` class does NOT penetrate — it MUST have a self-contained CSS variable dark mode system using `--widget-*` variables scoped to the iframe `<html>` with a `.widget-dark` gating class; the embed script route (`api/modules/live-chat/embed/`) must inject these variables and wire the `darkMode` parameter from the site's `colorScheme` setting; ~80+ hardcoded color instances across 7 widget components must be replaced (Section 12.7.30). Ecommerce mobile components: `CollapsibleProductDetails` prose wrapper MUST include `dark:prose-invert`, `MobilePaymentSelector` brand labels need `dark:` variants (Section 12.7.31). Platform pages: `global-error.tsx` MUST use semantic tokens, `pricing/page.tsx` and billing components (`billing-cycle-toggle.tsx`, `pricing-card.tsx`) MUST add `dark:` variants, developer statements API MUST emit dark-aware inline styles (Section 12.7.32). Canvas-rendered elements (`particle-background.tsx`) MUST use `window.matchMedia('(prefers-color-scheme: dark)')` listener for runtime color adaptation (Section 12.7.33). See Phase 5N (steps 49-56).

### How to Work Through This

1. Read the **entire master plan** below before starting any code.
2. Implement one phase at a time. Complete all items in a phase before moving to the next.
3. After each component, verify it renders correctly at 320px, 768px, 1024px, and 1440px widths.
4. When updating `core-components.ts`, define every prop with its type, label, options, defaultValue, and section grouping.
5. When updating AI files (metadata, prompts, converter), ensure the AI will choose the RIGHT layout component for each design scenario as specified in Section 11 (AI Designer Integration) of the plan.
6. **Dark/light testing** — After each component, test with BOTH a light-themed palette AND a dark-themed palette (e.g., "luxury-black-gold"). Validate shadows become glows, card backgrounds adapt, borders are visible, and glassmorphism tints are correct. See **Section 12** of the master plan. Also verify every layout render follows the **dual-default pattern (Section 12.7.5):** Tailwind semantic classes for defaults, inline style only for explicit custom colors.
7. Ask me to review after each phase before proceeding to the next.

### The Master Plan

Everything below is the complete specification. Implement it precisely.

---

[PASTE THE FULL CONTENTS OF LAYOUT-COMPONENTS-MASTER-PLAN.md BELOW THIS LINE]

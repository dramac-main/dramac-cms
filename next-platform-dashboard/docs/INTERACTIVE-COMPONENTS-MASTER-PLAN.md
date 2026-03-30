# DRAMAC CMS — Interactive Components Master Plan

## Executive Vision

Transform DRAMAC's **31 interactive components** from a functionally rich but unevenly registered set into a **cohesive, theme-aware, accessibility-first interactive component library** capable of producing Framer-quality animations, Webflow-grade sliders, and SaaS-calibre data displays — all controlled by the AI Designer with **zero human adjustment**.

Interactive components are the **heartbeat of every website**. They create movement, reveal content, invite exploration, and transform static pages into dynamic experiences. When a visitor opens an accordion, swipes a carousel, watches a countdown tick, or hovers over a 3D card — those moments of interaction build trust, sustain engagement, and drive conversion. This plan treats all 31 interactive components as the unified interaction layer that makes every DRAMAC site feel alive.

---

## Table of Contents

0. [Implementation Blueprint](#section-0--implementation-blueprint)
1. [Current State Audit](#1-current-state-audit)
2. [Industry Benchmark Analysis](#2-industry-benchmark-analysis)
3. [Architecture Principles](#3-architecture-principles)
4. [Core Interactive Components](#4-core-interactive-components)
5. [Animation & Motion Components](#5-animation--motion-components)
6. [Rich Display & Section Components](#6-rich-display--section-components)
7. [Marketing & Trust Components](#7-marketing--trust-components)
8. [Media Components](#8-media-components)
9. [Experimental Components](#9-experimental-components)
10. [Dark Mode & Theming](#10-dark-mode--theming)
11. [Accessibility & WCAG Compliance](#11-accessibility--wcag-compliance)
12. [CSS Variable & Design Token System](#12-css-variable--design-token-system)
13. [AI Designer Integration](#13-ai-designer-integration)
14. [Registry & Converter Alignment](#14-registry--converter-alignment)
15. [Implementation Phases](#15-implementation-phases)
16. [Testing & Quality Gates](#16-testing--quality-gates)
17. [CRITICAL FOR AI AGENT — Implementation Guard Rails](#17-critical-for-ai-agent--implementation-guard-rails)

---

## Section 0 — Implementation Blueprint

> **For the AI agent implementing this plan.** Read this section FIRST. It contains every file path, every line number, and every registration point you need. Do NOT guess — use these exact references.

### 0.1 File Map

| File                      | Path                                            | Purpose                                                                           |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| **renders.tsx**           | `src/lib/studio/blocks/renders.tsx`             | Render functions for all 31 interactive components                                |
| **core-components.ts**    | `src/lib/studio/registry/core-components.ts`    | `defineComponent()` registrations with fields, defaultProps, AI hints             |
| **component-metadata.ts** | `src/lib/studio/registry/component-metadata.ts` | AI discovery metadata (keywords, usageGuidelines, category)                       |
| **converter.ts**          | `src/lib/ai/website-designer/converter.ts`      | `typeMap` aliases + `KNOWN_REGISTRY_TYPES` + `transformPropsForStudio()` handlers |
| **renderer.tsx**          | `src/lib/studio/engine/renderer.tsx`            | Dispatches render functions, injects props via `{...injectedProps}`               |
| **layout-utils.ts**       | `src/lib/studio/blocks/layout-utils.ts`         | Shared sizing/spacing utility maps (`getResponsiveClasses`, etc.)                 |

### 0.2 Exact Line Numbers (Verified via grep — 2026-07)

#### renders.tsx — All 31 Components

| #  | Component              | Interface Start | Export Function | Props Count | Category     |
| -- | ---------------------- | --------------- | --------------- | ----------- | ------------ |
| 1  | **Animate**            | L2599           | L2609           | 7+configs   | animation    |
| 2  | **Tilt3DContainer**    | L2819           | L2832           | 10          | animation    |
| 3  | **ShapeDivider**       | L2913           | L2937           | 10          | animation    |
| 4  | **CursorEffect**       | L2999           | L3008           | 6           | animation    |
| 5  | **Testimonials**       | L9663           | L9805           | 60+         | sections     |
| 6  | **FAQ**                | L10367          | L10574          | 80+         | sections     |
| 7  | **Stats**              | L11482          | L11639          | 80+         | sections     |
| 8  | **BeforeAfter**        | L12790          | L12826          | 20          | media        |
| 9  | **Audio**              | L13288          | L13324          | 20          | media        |
| 10 | **Embed**              | L13661          | L13698          | 18          | media        |
| 11 | **AvatarGroup**        | L13855          | L13870          | 10          | media        |
| 12 | **Carousel**           | L20204          | L20265          | 40+         | interactive  |
| 13 | **Countdown**          | L20801          | L20838          | 28          | interactive  |
| 14 | **Accordion**          | L21473          | L21504          | 22          | interactive  |
| 15 | **Tabs**               | L21670          | L21755          | 50+         | interactive  |
| 16 | **Modal**              | L22204          | L22220          | 13          | interactive  |
| 17 | **Progress**           | L23671          | L23686          | 12          | content      |
| 18 | **Alert**              | L23741          | L23754          | 10          | content      |
| 19 | **Typewriter**         | L23944          | L23963          | 15          | interactive  |
| 20 | **Parallax**           | L24019          | L24033          | 12          | interactive  |
| 21 | **AnnouncementBar**    | L24102          | L24129          | 19          | marketing    |
| 22 | **SocialProof**        | L24245          | L24269          | 22          | marketing    |
| 23 | **TrustBadges**        | L24482          | L24499          | 14          | marketing    |
| 24 | **LogoCloud**          | L24609          | L24635          | 24          | marketing    |
| 25 | **ComparisonTable**    | L24870          | L24894          | 18          | marketing    |
| 26 | **CardFlip3D**         | L25423          | L25444          | varies      | experimental |
| 27 | **TiltCard**           | L25559          | L25576          | varies      | experimental |
| 28 | **GlassCard**          | L25669          | L25684          | varies      | experimental |
| 29 | **ParticleBackground** | L25739          | L25753          | varies      | experimental |
| 30 | **ScrollAnimate**      | L25889          | L25914          | varies      | experimental |
| 31 | **BlogPreview**        | L26040          | L26074          | 28          | sections     |

> Sub-interfaces: `AccordionItem` at L21466, `CarouselItem` at L20191.
> 4 animation wrappers (L2599–L3008) sit early in the file. Core interactive cluster (L20204–L22220). Marketing cluster (L24102–L24894). Experimental cluster (L25423–L25914). Section components are distributed throughout.

#### core-components.ts — All 31 Registrations

| #  | Component              | `type:` Line | Category      | Fields | defaultProps |
| -- | ---------------------- | ------------ | ------------- | ------ | ------------ |
| 1  | **Animate**            | L997         | layout        | ~6     | ✅           |
| 2  | **Tilt3DContainer**    | L1066        | layout        | 6      | ✅           |
| 3  | **ShapeDivider**       | L1136        | layout        | 8      | ✅           |
| 4  | **CursorEffect**       | L1216        | layout        | 3      | ✅           |
| 5  | **Testimonials**       | L6762        | sections      | 50+    | ✅           |
| 6  | **FAQ**                | L7391        | sections      | 50+    | ✅           |
| 7  | **Stats**              | L8471        | sections      | 50+    | ✅           |
| 8  | **BeforeAfter**        | L3599        | media         | 18     | ✅           |
| 9  | **Audio**              | L3831        | media         | 20     | ✅           |
| 10 | **Embed**              | L3955        | media         | 18     | ✅           |
| 11 | **AvatarGroup**        | L4065        | media         | 10     | ✅           |
| 12 | **Carousel**           | L15334       | interactive   | 65+    | ✅           |
| 13 | **Countdown**          | L15950       | interactive   | 50+    | ✅           |
| 14 | **Accordion**          | L17787       | interactive   | 40+    | ✅           |
| 15 | **Tabs**               | L18169       | interactive   | 50+    | ✅           |
| 16 | **Modal**              | L18590       | interactive   | 50+    | ✅           |
| 17 | **Progress**           | L19916       | content       | 50+    | ✅           |
| 18 | **Alert**              | L20387       | content       | 50+    | ✅           |
| 19 | **Typewriter**         | L16395       | interactive   | 50+    | ✅           |
| 20 | **Parallax**           | L16780       | interactive   | 50+    | ✅           |
| 21 | **AnnouncementBar**    | L21197       | marketing     | 50+    | ✅           |
| 22 | **SocialProof**        | L21757       | marketing     | 50+    | ✅           |
| 23 | **TrustBadges**        | L22387       | marketing     | 50+    | ✅           |
| 24 | **LogoCloud**          | L22999       | marketing     | 50+    | ✅           |
| 25 | **ComparisonTable**    | L23750       | marketing     | 70+    | ✅           |
| 26 | **CardFlip3D**         | L24539       | experimental  | varies | ✅           |
| 27 | **TiltCard**           | L25097       | experimental  | varies | ✅           |
| 28 | **GlassCard**          | L25598       | experimental  | varies | ✅           |
| 29 | **ParticleBackground** | L26075       | experimental  | varies | ✅           |
| 30 | **ScrollAnimate**      | L26639       | experimental  | varies | ✅           |
| 31 | **BlogPreview**        | L27127       | sections      | 30+    | ✅           |

#### component-metadata.ts — 23 of 31 Have Entries

| #  | Component              | `type:` Line | Category    |
| -- | ---------------------- | ------------ | ----------- |
| 1  | **Animate**            | L267         | layout      |
| 2  | **Tilt3DContainer**    | L290         | layout      |
| 3  | **ShapeDivider**       | L305         | layout      |
| 4  | **CursorEffect**       | L320         | layout      |
| 5  | **Testimonials**       | L461         | sections    |
| 6  | **FAQ**                | L473         | sections    |
| 7  | **Stats**              | L520         | sections    |
| 8  | **Tabs**               | L597         | interactive |
| 9  | **Carousel**           | L910         | interactive |
| 10 | **Countdown**          | L921         | interactive |
| 11 | **Typewriter**         | L933         | interactive |
| 12 | **Parallax**           | L945         | interactive |
| 13 | **AnnouncementBar**    | L960         | marketing   |
| 14 | **SocialProof**        | L972         | marketing   |
| 15 | **TrustBadges**        | L983         | marketing   |
| 16 | **LogoCloud**          | L995         | marketing   |
| 17 | **ComparisonTable**    | L1007        | marketing   |
| 18 | **BlogPreview**        | L1213        | sections    |
| 19 | **BeforeAfter**        | L1262        | media       |
| 20 | **Audio**              | L1305        | media       |
| 21 | **Embed**              | L1331        | media       |
| 22 | **AvatarGroup**        | L1357        | media       |
| 23 | **Accordion**          | L485         | interactive |

> ⚠️ **8 components MISSING from component-metadata.ts:** Modal, Progress, Alert, CardFlip3D, TiltCard, GlassCard, ParticleBackground, ScrollAnimate. These components cannot be discovered by the AI Designer for intelligent placement.

#### converter.ts — Alias & Normalizer Map

| #  | Component              | typeMap Aliases (Line #s)                                                          | KNOWN_REGISTRY line | Normalizer Line | Status       |
| -- | ---------------------- | ---------------------------------------------------------------------------------- | ------------------- | --------------- | ------------ |
| 1  | **Accordion**          | AccordionBlock L433, AccordionSection L434, Accordion L551                         | L807                | L1762           | ✅ Complete  |
| 2  | **Tabs**               | TabsBlock L435, TabsSection L436, Tabs L552                                       | L808                | L1780           | ✅ Complete  |
| 3  | **Modal**              | Modal L554                                                                         | L811                | ❌              | ⚠️ No norm   |
| 4  | **Carousel**           | CarouselBlock L437, CarouselSection L438, Carousel L553                            | L809                | ❌              | ⚠️ No norm   |
| 5  | **Countdown**          | CountdownBlock L439, CountdownSection L440, Countdown L553                         | L810                | ❌              | ⚠️ No norm   |
| 6  | **BeforeAfter**        | BeforeAfterBlock L466, BeforeAfterSection, ImageComparisonBlock, ImageComparison L469, CompareImages L470, BeforeAfter L567 | ❌                  | ❌              | 🔴 Missing   |
| 7  | **Progress**           | ❌ None                                                                            | ❌                  | ❌              | 🔴 Absent    |
| 8  | **Alert**              | ❌ None                                                                            | ❌                  | ❌              | 🔴 Absent    |
| 9  | **Animate**            | Animate L682, AnimateBlock L683, AnimationWrapper, MotionWrapper L685              | L834                | L1930           | ✅ Complete  |
| 10 | **Tilt3DContainer**    | Tilt3DContainer L686, Tilt3DContainerBlock, TiltCard L688, Tilt3D L689             | L835                | L2005           | ✅ Complete  |
| 11 | **ShapeDivider**       | ShapeDivider L690, ShapeDividerBlock, WaveDivider L692, SectionDivider L693        | L836                | L2021           | ✅ Complete  |
| 12 | **CursorEffect**       | CursorEffect L694, CursorEffectBlock, CustomCursor L696                            | L837                | L2036           | ✅ Complete  |
| 13 | **Typewriter**         | Typewriter L631, TypewriterText L632, TypingEffect L633, AnimatedText L634         | L812                | ❌              | ⚠️ No norm   |
| 14 | **Parallax**           | Parallax L635, ParallaxSection L636, ParallaxScroll L637                           | L813                | ❌              | ⚠️ No norm   |
| 15 | **Testimonials**       | TestimonialsBlock L377, TestimonialBlock, Reviews L428, ReviewsBlock, ReviewsSection, ClientReviews L431, Testimonials L540 | L781 | L1247 | ✅ Complete |
| 16 | **FAQ**                | FAQBlock L381, FAQ L543                                                            | L782                | L1459           | ✅ Complete  |
| 17 | **Stats**              | StatsBlock L383, Stats L545                                                        | L783                | L1485           | ✅ Complete  |
| 18 | **SocialProof**        | SocialProofBlock L426, SocialProofSection L427, SocialProof L561                   | L789                | ❌              | ⚠️ No norm   |
| 19 | **TrustBadges**        | TrustBadgesBlock L419, TrustBadgesSection, Badges, Accreditations, Credentials, Certifications L424, TrustBadges L560 | L788 | L2157 | ✅ Complete |
| 20 | **LogoCloud**          | LogoCloudBlock L414, LogoCloudSection, PartnerLogos, Partners L417, TrustedBy L418, LogoCloud L559 | L787 | L2084 | ✅ Complete |
| 21 | **ComparisonTable**    | ComparisonBlock L442, ComparisonSection, ComparisonTableBlock L444, ComparisonTable L562 | L790 | ❌ | ⚠️ No norm |
| 22 | **AnnouncementBar**    | AnnouncementBlock L446, AnnouncementBarBlock, Banner L448, BannerBlock L449, AnnouncementBar L563 | L791 | ❌ | ⚠️ No norm |
| 23 | **BlogPreview**        | BlogPreview L759, BlogGrid L760, BlogCards, BlogList, LatestPosts L763, RecentPosts L764 | L876 | ❌ | ⚠️ No norm |
| 24 | **Audio**              | Audio L570, AudioBlock L571, AudioSection, AudioPlayer, MusicPlayer L574, PodcastPlayer L575 | ❌ | ❌ | 🔴 Missing |
| 25 | **Embed**              | Embed L576, EmbedBlock L577, EmbedSection, IframeBlock L579, IframeEmbed L580, ExternalEmbed | ❌ | ❌ | 🔴 Missing |
| 26 | **AvatarGroup**        | AvatarGroup L582, AvatarGroupBlock, AvatarGroupSection, AvatarStack L585, UserGroup L586 | ❌ | ❌ | 🔴 Missing |
| 27 | **CardFlip3D**         | ❌ None                                                                            | ❌                  | ❌              | 🔴 Absent    |
| 28 | **TiltCard**           | → Tilt3DContainer (alias L688)                                                     | —                   | —               | ↪ Redirect   |
| 29 | **GlassCard**          | ❌ None                                                                            | ❌                  | ❌              | 🔴 Absent    |
| 30 | **ParticleBackground** | ❌ None                                                                            | ❌                  | ❌              | 🔴 Absent    |
| 31 | **ScrollAnimate**      | ❌ None                                                                            | ❌                  | ❌              | 🔴 Absent    |

### 0.3 Props Pipeline

```
AI Designer generates component JSON
  ↓
converter.ts typeMap resolves alias → registered type name
  (e.g., "AccordionBlock" → "Accordion", "CarouselSection" → "Carousel")
  ↓
converter.ts transformPropsForStudio() normalises prop names
  (e.g., items/sections → items array with correct shape)
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
```

**Critical rules:**
- Render function parameter names MUST match registry field names EXACTLY. There is NO mapping layer. If registry says `slides` and render expects `items`, the prop is silently lost. **This affects Carousel** — registry uses `slides`, render uses `items`.
- Renderer injects `siteId`, brand colours, and brand fonts into EVERY component's props automatically. Even components with hardcoded colour defaults may get brand overrides at render time.
- The renderer uses `componentRegistry.get(type)` — there is NO hardcoded dispatch table. If a component isn't registered via `defineComponent()` in core-components.ts, it renders a fallback (dev: amber dashed border; production: silent section or `null`).

### 0.4 Render Pattern Analysis

Interactive components follow three distinct patterns:

#### Pattern A: Static HTML (SSR-safe, no JS)
Used by: Accordion (`<details>`/`<summary>`), Progress (`<div role="progressbar">`), Alert, ShapeDivider, AnnouncementBar, LogoCloud, TrustBadges, ComparisonTable, BlogPreview
```tsx
export function ComponentRender({ variant = "default", ...props }: ComponentProps) {
  return <div>{/* Pure HTML — no useState, no useEffect */}</div>;
}
```

#### Pattern B: Client Stateful (useState + event handlers)
Used by: Tabs (keyboard nav), Carousel (slide state + autoplay), Countdown (timer), BeforeAfter (drag), Audio (playback), Modal (open/close)
```tsx
export function ComponentRender({ ...props }: ComponentProps) {
  const [state, setState] = React.useState(initialValue);
  // Mouse/touch/keyboard handlers
  return <div>{/* Interactive stateful output */}</div>;
}
```

#### Pattern C: Animation Wrapper (IntersectionObserver + CSS)
Used by: Animate, Tilt3DContainer, CursorEffect, Parallax, Typewriter, ScrollAnimate
```tsx
export function ComponentRender({ children, ...config }: ComponentProps) {
  // IntersectionObserver or mousemove listeners
  // CSS transforms + transitions
  return <div>{children}</div>;
}
```

**Key observation:** Zero components use Framer Motion at render-time. All animations are CSS transitions, CSS keyframes (`@keyframes`), IntersectionObserver + CSS transforms, or JS mouse/touch event handlers with inline styles.

### 0.5 Build Checklist — Use for EVERY Change

```
□ renders.tsx      — render function compiles with zero TS errors
□ renders.tsx      — every prop in interface is consumed in function body
□ renders.tsx      — ALL colours via style={{}} (no Tailwind colour classes)
□ renders.tsx      — semantic HTML used (details/summary, role=tablist, role=dialog, etc.)
□ renders.tsx      — keyboard navigation works (Tab, Enter, Escape, Arrow keys)
□ core-components.ts — every field name matches a render prop EXACTLY
□ core-components.ts — defaultProps keys exist in fields
□ core-components.ts — ai.canModify keys exist in fields
□ core-components.ts — category matches component-metadata.ts
□ component-metadata.ts — entry exists with type, category, keywords
□ converter.ts     — typeMap alias(es) exist for the component
□ converter.ts     — type is in KNOWN_REGISTRY_TYPES set
□ converter.ts     — normalizer handler exists in transformPropsForStudio()
□ npx tsc --noEmit — zero new errors introduced
```

### 0.6 DO / DON'T Rules

| ✅ DO                                                                      | ❌ DON'T                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Use `style={{}}` for ALL colours                                           | Use Tailwind colour classes (bg-red-600, text-blue-500)            |
| Use CSS variables with fallbacks: `var(--color-primary, inherit)`          | Hardcode hex/rgb without CSS variable wrapper                      |
| Use native HTML5 elements (`<details>`, `<dialog>`, `role="tablist"`)      | Build custom ARIA from scratch when native elements exist          |
| Terminate colour chains with `\|\| undefined` to enable inheritance        | Hardcode a colour as the final fallback (e.g., `\|\| "#000"`)     |
| Match field names in registry EXACTLY to prop names in render              | Use `slides` in registry and `items` in render                     |
| Support `prefers-reduced-motion: reduce` for all animations                | Force animations on all users regardless of motion preference      |
| Add converter normalizer for EVERY component                               | Skip normalizer — AI-generated props pass through unnormalized     |
| Use `IntersectionObserver` for scroll-triggered effects                    | Use scroll event listeners without throttling                      |
| Put ALL render functions in `renders.tsx` only                             | Create separate files for individual renders                       |
| Use `getResponsiveClasses()` from `layout-utils.ts`                       | Reimplement responsive logic in each component                     |
| Set `isContainer: true` + `acceptsChildren: true` for wrapper components   | Forget container flags on Animate, Parallax, Modal, CursorEffect  |

---

## 1. Current State Audit

### 1.1 Interactive Components Inventory (31 total, 6 categories)

#### Core Interactive (6 components)

| #  | Component      | renders.tsx | Props  | Quality             | Key Strength                                                              |
| -- | -------------- | ----------- | ------ | ------------------- | ------------------------------------------------------------------------- |
| 1  | **Accordion**  | L21504      | 22     | ✅ Strong           | 4 variants, native `<details>/<summary>`, `isDarkBackground()`, markdown  |
| 2  | **Tabs**       | L21755      | 50+    | ✅ Excellent        | 7 variants, full ARIA keyboard nav, vertical layout, keepAlive, badges    |
| 3  | **Modal**      | L22220      | 13     | ⚠️ Basic            | Overlay, close button, ARIA dialog — but no footer, no animation variants |
| 4  | **Carousel**   | L20265      | 40+    | ✅ Strong           | 3 transitions, touch/swipe, autoplay, keyboard, lazy load, per-slide CTA  |
| 5  | **Countdown**  | L20838      | 28     | ⚠️ Static render   | 3 variants, CTA, section header — but shows "00" statically (no JS timer) |
| 6  | **Progress**   | L23686      | 12     | ⚠️ Basic            | 3 variants, ARIA progressbar — but no circular, no milestones, no segments |

#### Animation & Motion (6 components)

| #  | Component           | renders.tsx | Props  | Quality           | Key Strength                                                  |
| -- | ------------------- | ----------- | ------ | ----------------- | ------------------------------------------------------------- |
| 7  | **Animate**         | L2609       | 7+cfg  | ✅ Excellent      | 12 entrance types, loop/scroll/stagger, `prefers-reduced-motion` |
| 8  | **Tilt3DContainer** | L2832       | 10     | ✅ Strong         | Cursor-tracking 3D perspective, glare overlay, touch-safe     |
| 9  | **ShapeDivider**    | L2937       | 10     | ✅ Strong         | 11 SVG shapes, animated breathing, `aria-hidden`              |
| 10 | **CursorEffect**    | L3008       | 6      | ✅ Strong         | 6 effect types (spotlight/glow/trail/magnetic/tilt), touch-safe |
| 11 | **Typewriter**      | L23963      | 15     | ⚠️ SSR-only      | Responsive text, CSS cursor animation — no live typing in SSR |
| 12 | **Parallax**        | L24033      | 12     | ⚠️ Basic CSS     | `background-attachment: fixed`, overlay — not scroll-driven   |

#### Rich Display & Sections (4 components)

| #  | Component          | renders.tsx | Props  | Quality           | Key Strength                                                       |
| -- | ------------------ | ----------- | ------ | ----------------- | ------------------------------------------------------------------ |
| 13 | **Testimonials**   | L9805       | 60+    | ✅ Excellent      | 10 variants, carousel mode, avatars, ratings, `isDarkBackground()` |
| 14 | **FAQ**            | L10574      | 80+    | ✅ Excellent      | 10 variants, Schema.org (FAQPage/HowTo/QAPage), categories, search |
| 15 | **Stats**          | L11639      | 80+    | ✅ Excellent      | 10 variants, counter animation, trends, `isDarkBackground()`      |
| 16 | **BlogPreview**    | L26074      | 28     | ✅ Strong         | 4 variants, author avatars, `isDarkBackground()`, image hover      |

#### Marketing & Trust (5 components)

| #  | Component           | renders.tsx | Props  | Quality           | Key Strength                                                     |
| -- | ------------------- | ----------- | ------ | ----------------- | ---------------------------------------------------------------- |
| 17 | **AnnouncementBar** | L24129      | 19     | ✅ Strong         | 7 variants, sticky, gradient bg, `isDarkBackground()`, dismiss   |
| 18 | **SocialProof**     | L24269      | 22     | ✅ Strong         | Star ratings, Schema.org AggregateRating, CSS variable colours   |
| 19 | **TrustBadges**     | L24499      | 14     | ⚠️ Basic         | Grayscale-to-colour hover, stagger animation — no dark mode      |
| 20 | **LogoCloud**       | L24635      | 24     | ✅ Strong         | 3 variants (simple/cards/marquee), `isDarkBackground()`, marquee |
| 21 | **ComparisonTable** | L24894      | 18     | ✅ Strong         | Sticky header, grouped rows, mobile stack, CSS variable colours  |

#### Media (4 components)

| #  | Component       | renders.tsx | Props  | Quality           | Key Strength                                                    |
| -- | --------------- | ----------- | ------ | ----------------- | --------------------------------------------------------------- |
| 22 | **BeforeAfter** | L12826      | 20     | ✅ Excellent      | Drag + touch + keyboard, ARIA slider, clip-path, accessibility  |
| 23 | **Audio**       | L13324      | 20     | ✅ Strong         | 3 variants, waveform viz, speed control, native `<audio>`       |
| 24 | **Embed**       | L13698      | 18     | ✅ Strong         | Sandbox security, lazy loading, aspect ratio, loading spinner   |
| 25 | **AvatarGroup** | L13870      | 10     | ✅ Strong         | Stacked overlap, overflow badge, initials fallback, `role=group` |

#### Experimental (6 components)

| #  | Component              | renders.tsx | Quality           | Key Strength                                    |
| -- | ---------------------- | ----------- | ----------------- | ----------------------------------------------- |
| 26 | **Alert**              | L23754      | ⚠️ Basic         | 4 semantic variants, ARIA role, closable         |
| 27 | **CardFlip3D**         | L25444      | 🧪 Experimental  | 3D flip, front/back content                      |
| 28 | **TiltCard**           | L25576      | 🧪 Experimental  | Perspective tilt on hover                         |
| 29 | **GlassCard**          | L25669      | 🧪 Experimental  | Frosted glass morphism                            |
| 30 | **ParticleBackground** | L25753      | 🧪 Experimental  | Particle animation system                         |
| 31 | **ScrollAnimate**      | L25914      | 🧪 Experimental  | Scroll-based animation trigger                    |

### 1.2 Critical Issues Found

| #  | Issue                                                        | Severity    | Component(s)                                                 | Impact                                                                                                  |
| -- | ------------------------------------------------------------ | ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1  | **8 components missing from component-metadata.ts**          | 🔴 Critical | Modal, Progress, Alert, CardFlip3D, TiltCard, GlassCard, ParticleBackground, ScrollAnimate | AI Designer cannot discover these components for intelligent placement.                                 |
| 2  | **6 components completely absent from converter.ts**          | 🔴 Critical | Progress, Alert, CardFlip3D, GlassCard, ParticleBackground, ScrollAnimate                   | No typeMap aliases, no KNOWN_REGISTRY entry. AI cannot generate or resolve these at all.                |
| 3  | **5 components missing from KNOWN_REGISTRY_TYPES**            | 🔴 Critical | BeforeAfter, Audio, Embed, AvatarGroup, BlogPreview          | Have typeMap aliases but type validation fails — converter may reject these as unknown types.            |
| 4  | **9 components have no converter normalizer**                 | ⚠️ Medium  | Modal, Carousel, Countdown, Typewriter, Parallax, SocialProof, ComparisonTable, AnnouncementBar, BlogPreview | AI-generated props pass through unnormalized — non-standard prop names silently lost.                   |
| 5  | **Carousel field name mismatch: `slides` vs `items`**         | 🔴 Critical | Carousel                                                     | Registry uses `slides`, render expects `items`. Props silently lost — carousel renders empty.           |
| 6  | **Modal: 13 render props vs 50+ registry fields**             | ⚠️ Medium  | Modal                                                        | Registry defines footer, draggable, focus trap, animations — none implemented in render.                |
| 7  | **Progress: 12 render props vs 50+ registry fields**          | ⚠️ Medium  | Progress                                                     | Registry defines circular, milestones, segments, status colours — none in render.                       |
| 8  | **Alert: 10 render props vs 50+ registry fields**             | ⚠️ Medium  | Alert                                                        | Registry defines actions, auto-close, progress bar, link, rich animation — none in render.              |
| 9  | **Accordion: missing 2 registry variants**                    | ⚠️ Low     | Accordion                                                    | Registry has 6 variants (incl. minimal, cards), render implements 4.                                    |
| 10 | **Countdown: missing 3 registry variants**                    | ⚠️ Low     | Countdown                                                    | Registry has 6 variants (incl. minimal, flip, digital), render has 3.                                   |
| 10b| **Countdown: variant name mismatch `simple` vs `default`**    | 🔴 Critical | Countdown                                                    | Render uses `"simple"` variant, registry sends `"default"`. New countdowns get `variant: "default"` which may not match render's switch statement. |
| 10c| **Carousel: defaultProps compounds `slides/items` bug**       | 🔴 Critical | Carousel                                                     | Registry defaultProps use `slides: []` key. Render reads `items = []`. Newly created carousels start with `{ slides: [] }` — render sees no items. |
| 11 | **5+ components lack isDarkBackground() support**             | ⚠️ Medium  | Modal, BeforeAfter, Progress, Alert, TrustBadges, Typewriter | Hardcoded Tailwind colours → invisible text on dark backgrounds.                                        |
| 12 | **Zero Framer Motion usage across all 31 components**         | ℹ️ Info     | All                                                          | All animations are CSS-based. Not a bug — but Framer Motion is in the stack and unused by interactives. |

### 1.3 Registry Category Consistency

| Component           | core-components.ts | component-metadata.ts | Consistent? |
| ------------------- | ------------------ | --------------------- | ----------- |
| Accordion           | interactive        | interactive           | ✅          |
| Tabs                | interactive        | interactive           | ✅          |
| Modal               | interactive        | ❌ MISSING            | ❌          |
| Carousel            | interactive        | interactive           | ✅          |
| Countdown           | interactive        | interactive           | ✅          |
| Typewriter          | interactive        | interactive           | ✅          |
| Parallax            | interactive        | interactive           | ✅          |
| BeforeAfter         | media              | media                 | ✅          |
| Audio               | media              | media                 | ✅          |
| Embed               | media              | media                 | ✅          |
| AvatarGroup         | media              | media                 | ✅          |
| Testimonials        | sections           | sections              | ✅          |
| FAQ                 | sections           | sections              | ✅          |
| Stats               | sections           | sections              | ✅          |
| BlogPreview         | sections           | sections              | ✅          |
| AnnouncementBar     | marketing          | marketing             | ✅          |
| SocialProof         | marketing          | marketing             | ✅          |
| TrustBadges         | marketing          | marketing             | ✅          |
| LogoCloud           | marketing          | marketing             | ✅          |
| ComparisonTable     | marketing          | marketing             | ✅          |
| Animate             | layout             | layout                | ✅          |
| Tilt3DContainer     | layout             | layout                | ✅          |
| ShapeDivider        | layout             | layout                | ✅          |
| CursorEffect        | layout             | layout                | ✅          |
| Progress            | content            | ❌ MISSING            | ❌          |
| Alert               | content            | ❌ MISSING            | ❌          |
| CardFlip3D          | experimental       | ❌ MISSING            | ❌          |
| TiltCard            | experimental       | ❌ MISSING            | ❌          |
| GlassCard           | experimental       | ❌ MISSING            | ❌          |
| ParticleBackground  | experimental       | ❌ MISSING            | ❌          |
| ScrollAnimate       | experimental       | ❌ MISSING            | ❌          |

> **23 of 31 consistent**, 8 missing metadata entirely. No cross-category mismatches detected in the 23 that exist.

### 1.4 Prop Pipeline Coverage Matrix

| Component           | Aliases | KNOWN_REG | Normalizer | Registry Fields | Render Props | Coverage | Gaps                                       |
| ------------------- | ------- | --------- | ---------- | --------------- | ------------ | -------- | ------------------------------------------ |
| Accordion           | 3       | ✅        | ✅         | 40+             | 22           | 55%      | Search, icon styles, extra animations      |
| Tabs                | 3       | ✅        | ✅         | 50+             | 50+          | ~95%     | Well aligned                               |
| Modal               | 1       | ✅        | ❌         | 50+             | 13           | **26%**  | Footer, draggable, focus, anim variants    |
| Carousel            | 3       | ✅        | ❌         | 65+             | 40+          | ~60%     | Thumbnails, progress bar, flip/cube        |
| Countdown           | 3       | ✅        | ❌         | 50+             | 28           | ~55%     | Flip anim, urgency, confetti               |
| BeforeAfter         | 6       | ❌        | ❌         | 18              | 20           | **100%** | Perfectly aligned                          |
| Progress            | ❌      | ❌        | ❌         | 50+             | 12           | **24%**  | Circular, milestones, segments, status     |
| Alert               | ❌      | ❌        | ❌         | 50+             | 10           | **20%**  | Actions, auto-close, progress, animations  |
| Animate             | 4       | ✅        | ✅         | ~6              | 7+cfg        | ~85%     | loop/scroll/stagger not in registry fields |
| Tilt3DContainer     | 4       | ✅        | ✅         | 6               | 10           | 100%     | Perfect                                    |
| ShapeDivider        | 4       | ✅        | ✅         | 8               | 10           | 100%     | Perfect                                    |
| CursorEffect        | 3       | ✅        | ✅         | 3               | 6            | 100%     | Perfect                                    |
| Typewriter          | 4       | ✅        | ❌         | 50+             | 15           | ~30%     | Cursor styles, error effect, multiline     |
| Parallax            | 3       | ✅        | ❌         | 50+             | 12           | ~24%     | Layers, blur, rotate, fade                 |
| Testimonials        | 7       | ✅        | ✅         | 50+             | 60+          | ~90%     | Well aligned                               |
| FAQ                 | 2       | ✅        | ✅         | 50+             | 80+          | ~90%     | Well aligned                               |
| Stats               | 2       | ✅        | ✅         | 50+             | 80+          | ~90%     | Well aligned                               |
| SocialProof         | 3       | ✅        | ❌         | 50+             | 22           | ~44%     | Avatars, live counter, card styling        |
| TrustBadges         | 7       | ✅        | ✅         | 50+             | 14           | ~28%     | Tooltip, icon style, badge backgrounds     |
| LogoCloud           | 6       | ✅        | ✅         | 50+             | 24           | ~48%     | Scrolling, filtering, tooltip              |
| ComparisonTable     | 4       | ✅        | ❌         | 70+             | 18           | ~25%     | Cell styles, icons, tooltips               |
| AnnouncementBar     | 5       | ✅        | ❌         | 50+             | 19           | ~38%     | Countdown, marquee, auto-hide, cookie      |
| BlogPreview         | 6       | ✅        | ❌         | 30+             | 28           | ~90%     | Nearly aligned                             |
| Audio               | 6       | ❌        | ❌         | 20              | 20           | 100%     | Aligned but missing KNOWN_REG              |
| Embed               | 6       | ❌        | ❌         | 18              | 18           | 100%     | Aligned but missing KNOWN_REG              |
| AvatarGroup         | 5       | ❌        | ❌         | 10              | 10           | 100%     | Aligned but missing KNOWN_REG              |
| CardFlip3D          | ❌      | ❌        | ❌         | varies          | varies       | 🧪       | Experimental — no converter at all         |
| GlassCard           | ❌      | ❌        | ❌         | varies          | varies       | 🧪       | Experimental — no converter at all         |
| ParticleBackground  | ❌      | ❌        | ❌         | varies          | varies       | 🧪       | Experimental — no converter at all         |
| ScrollAnimate       | ❌      | ❌        | ❌         | varies          | varies       | 🧪       | Experimental — no converter at all         |

---

## 2. Industry Benchmark Analysis

### 2.1 How World-Class Platforms Handle Interactive Components

| Feature                       | Webflow         | Framer           | Squarespace      | WordPress/Gutenberg | DRAMAC Current                    | Gap          |
| ----------------------------- | --------------- | ---------------- | ---------------- | ------------------- | --------------------------------- | ------------ |
| Accordion/FAQ                 | ✅ 2 variants   | ✅ 3 variants    | ✅ 1 variant     | ✅ Plugin            | **10 variants** (FAQ+Accordion)   | ✅ Far ahead |
| Tabs                          | ✅ 3 variants   | ✅ 4 variants    | ❌               | ✅ Plugin            | **7 variants** + vertical layout  | ✅ Far ahead |
| Modal/Dialog                  | ✅ Full modal   | ✅ Overlay       | ✅ Lightbox      | ✅ Plugin            | ⚠️ Basic (13 props)               | 🔴 Behind    |
| Carousel/Slider               | ✅ Full         | ✅ 3 types       | ✅ Gallery       | ✅ Plugin            | ✅ 3 transitions + touch          | ✅ On par    |
| Countdown timer               | ❌ Plugin       | ✅ Timer         | ❌               | ✅ Plugin            | ✅ 3 variants                     | ✅ On par    |
| Before/After slider           | ❌ Plugin       | ❌               | ❌               | ❌                   | ✅ Full drag+keyboard             | ✅ Unique    |
| Progress bar                  | ✅ Basic        | ✅ Linear        | ❌               | ❌                   | ⚠️ 3 variants (no circular)      | 🔴 Behind    |
| Scroll animations             | ✅ Full IX2     | ✅ Smart Effects | ❌               | ❌                   | ✅ 12 entrance types + scroll     | ✅ On par    |
| 3D tilt effects               | ❌              | ✅ Tilt          | ❌               | ❌                   | ✅ Tilt3D + CursorEffect          | ✅ Ahead     |
| Shape dividers                | ❌              | ❌               | ❌               | ✅ Plugin            | ✅ 11 SVG shapes                  | ✅ Ahead     |
| Typewriter text               | ❌              | ✅ Type effect   | ❌               | ❌                   | ✅ SSR-safe setup                 | ✅ On par    |
| Parallax                      | ✅ Full IX2     | ✅ Smart         | ✅ Basic         | ❌                   | ⚠️ CSS only (not scroll-driven)  | 🔴 Behind    |
| Testimonials                  | ✅ 3 layouts    | ✅ 4 layouts     | ✅ 2 layouts     | ✅ Plugin            | **10 variants**                   | ✅ Far ahead |
| Stats/Counters                | ❌              | ✅ Counter       | ❌               | ✅ Plugin            | **10 variants** + counter anim    | ✅ Far ahead |
| Comparison table              | ❌              | ❌               | ❌               | ✅ Plugin            | ✅ Sticky + grouped + mobile      | ✅ Unique    |
| Audio player                  | ✅ HTML5 audio  | ❌               | ❌               | ✅ Plugin            | ✅ 3 variants + waveform          | ✅ Ahead     |
| Announcement bar              | ❌              | ❌               | ✅ Basic         | ✅ Plugin            | ✅ 7 variants + gradient          | ✅ Ahead     |
| Logo cloud / marquee          | ✅ Grid         | ✅ Marquee       | ✅ Logo bar      | ✅ Plugin            | ✅ 3 variants incl marquee        | ✅ On par    |
| Social proof / ratings        | ❌              | ❌               | ❌               | ✅ Plugin            | ✅ Schema.org + stars             | ✅ Unique    |
| Trust badges                  | ❌              | ❌               | ❌               | ❌                   | ✅ Grayscale hover effect         | ✅ Unique    |
| Schema.org structured data    | ❌              | ❌               | ❌               | ✅ Manual            | ✅ FAQ + SocialProof auto-inject  | ✅ Ahead     |
| Dark mode for all interactives | ✅ Full        | ✅ Full          | ⚠️ Partial      | ❌                   | ⚠️ 12/31 have isDarkBackground() | 🔴 Gap       |

### 2.2 Key Takeaways

1. **DRAMAC leads on variant richness** — Testimonials (10), FAQ (10), Stats (10), Tabs (7), AnnouncementBar (7) exceed all competitors.
2. **Modal is the biggest functional gap** — 13 render props vs competitors' full feature set (footer actions, animation variants, focus trap, draggable).
3. **Progress needs circular mode** — Every competitor with a progress component supports both linear and circular. DRAMAC only has linear.
4. **Parallax needs true scroll-driven animation** — Current CSS `background-attachment: fixed` doesn't match Webflow/Framer scroll effects.
5. **Dark mode coverage is the systemic gap** — Only 12 of 31 components use `isDarkBackground()`. The other 19 risk invisible text on dark backgrounds.
6. **Schema.org is a DRAMAC differentiator** — FAQ and SocialProof auto-inject structured data. No competitor does this automatically.
7. **Before/After and ComparisonTable are unique** — No major competitor has these as native components.

---

## 3. Architecture Principles

### 3.1 Inline Styles for All Colours (No Hardcoded Tailwind)

```typescript
// ❌ WRONG — Hardcoded Tailwind colour class
"bg-sky-50 border-sky-200 text-sky-800"   // Alert info variant

// ✅ CORRECT — Inline style with CSS variable fallback
style={{
  backgroundColor: backgroundColor || 'var(--color-info-bg, #f0f9ff)',
  borderColor: borderColor || 'var(--color-info-border, #bae6fd)',
  color: textColor || 'var(--color-info-text, #0c4a6e)',
}}
```

**Rule:** Every user-facing colour must be applied via `style={{}}` with CSS variable fallbacks. Tailwind classes are **only for structural** properties (padding, flex, grid, transitions, opacity).

### 3.2 Native HTML5 Elements for Accessibility

Interactive components should use the most semantic HTML element available:

| Component  | Native Element              | ARIA Pattern             | Keyboard               |
| ---------- | --------------------------- | ------------------------ | ---------------------- |
| Accordion  | `<details>` / `<summary>`  | Disclosure               | Enter/Space to toggle  |
| Tabs       | `role="tablist/tab/tabpanel"` | Tabs                   | Arrow keys, Home/End   |
| Modal      | `<dialog>` or `role="dialog"` | Dialog                 | Escape to close        |
| Carousel   | `role="region"` + live      | Carousel                 | Arrow keys             |
| Progress   | `<progress>` or `role="progressbar"` | Progressbar     | N/A (read-only)        |
| Alert      | `role="alert"`              | Alert                    | N/A (announcement)     |
| BeforeAfter | `role="slider"`            | Slider                   | Arrow keys (step=5)    |
| Audio      | `<audio>`                   | Media player             | Space play/pause       |

### 3.3 Animation Architecture

All interactive animations follow a **pure CSS** strategy:

```
1. Entrance animations    → IntersectionObserver + CSS class toggle
2. Loop animations        → CSS @keyframes injected via <style>
3. Scroll animations      → scroll event + requestAnimationFrame + CSS transform
4. Hover effects          → CSS :hover / :focus-visible pseudo-classes
5. State transitions      → CSS transition-property with timing functions
6. Page load animations   → CSS animate-in keyframes
```

**Framer Motion is NOT used** in any of the 31 render functions. All animation is CSS-native for maximum performance and zero JS bundle cost.

**Reduced motion respect:**
```typescript
// Animate component checks:
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) return; // Skip animations
```

### 3.4 Container Component Pattern

Wrapper components (Animate, Tilt3DContainer, CursorEffect, Parallax, Modal) accept `children`:

```typescript
export function AnimateRender({ children, entrance, loop, scroll, stagger, ...props }: AnimateProps) {
  return (
    <div className="relative" style={computedStyles}>
      {children}
    </div>
  );
}
```

Registry flags: `isContainer: true`, `acceptsChildren: true`.

---

## 4. Core Interactive Components

### 4.1 Accordion

**Location:** `renders.tsx` L21473 (interface) → L21504 (render)
**Registry:** `core-components.ts` L17787 | **Metadata:** `component-metadata.ts` L485

**Variants (4 implemented, 6 registered):**

| Variant      | Render | Registry | Description                                     |
| ------------ | ------ | -------- | ----------------------------------------------- |
| `simple`     | ✅     | ✅       | Border-bottom dividers between items            |
| `bordered`   | ✅     | ✅       | Unified border container with divide-y          |
| `separated`  | ✅     | ✅       | Space-y-3 between individual bordered items     |
| `filled`     | ✅     | ✅       | Background fill per item (active colour)        |
| `minimal`    | ❌     | ✅       | Ultra-clean, no borders                         |
| `cards`      | ❌     | ✅       | Card-style with shadow per item                 |

**Props pipeline:** 22 render props, 40+ registry fields. ~55% coverage.

**Key render features:**
- Native `<details>/<summary>` HTML5 elements (accessible by default)
- `isDarkBackground()` for adaptive colours on dark containers
- Markdown-to-HTML content via `contentToHtml()`
- Section header with badge, title, subtitle
- CSS `group-open:rotate-180` for chevron animation

**Registry fields NOT in render (selection):**
- `showSearch`, `searchPlaceholder`, `highlightMatch` — filterable accordion
- `iconStyle` (chevron/plus-minus/arrow/caret) — render only has chevron
- `animationType` (slide/fade/none), `animationDuration`, `animateContent`
- `headerFontSize`, `headerFontWeight`, `headerHoverEffect`
- `contentPadding`, `contentBackgroundColor`, `contentBorderTop`

**Converter:** Aliases L433–L434, L551 | KNOWN_REG L807 | Normalizer L1762

**Fix priorities:**
1. 🔴 Implement `minimal` and `cards` variants
2. ⚠️ Add `iconStyle` support (plus-minus, arrow, caret)
3. ⚠️ Add `animationType` with CSS transitions
4. ⬜ Add search/filter capability

---

### 4.2 Tabs

**Location:** `renders.tsx` L21670 (interface) → L21755 (render)
**Registry:** `core-components.ts` L18169 | **Metadata:** `component-metadata.ts` L597

**Variants (7 implemented, 7 registered):**

| Variant     | Render | Registry | Description                                |
| ----------- | ------ | -------- | ------------------------------------------ |
| `underline` | ✅     | ✅       | Bottom border indicator (default)          |
| `pills`     | ✅     | ✅       | Rounded background pills                   |
| `boxed`     | ✅     | ✅       | Bordered rectangles                        |
| `enclosed`  | ✅     | ✅       | Browser-tab connected borders              |
| `soft`      | ✅     | ✅       | Translucent background                     |
| `minimal`   | ✅     | ✅       | Just font weight change                    |
| `lifted`    | ✅     | ✅       | Shadow + translateY on active              |

**Props pipeline:** 50+ render props, 50+ registry fields. ~95% coverage — **best aligned interactive component**.

**Key render features:**
- Full keyboard navigation (ArrowLeft/Right/Up/Down, Home, End)
- ARIA roles: `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `keepAlive` mode (mounts all visited tabs in DOM)
- Vertical layout support (left/right tab positions)
- Badge rendering (dot or count styles)
- Icon rendering (left/right/top positions)
- CSS keyframe animations (fade, scale) via injected `<style>` tag
- Backwards-compatible legacy colour props

**Converter:** Aliases L435–L436, L552 | KNOWN_REG L808 | Normalizer L1780

**Status:** ✅ **Best-in-class.** No critical gaps. Minor improvements only.

---

### 4.3 Modal

**Location:** `renders.tsx` L22204 (interface) → L22220 (render)
**Registry:** `core-components.ts` L18590 | **Metadata:** ❌ MISSING

**Render — current state (minimal):**

| Props implemented | Description                              |
| ----------------- | ---------------------------------------- |
| `title`           | Modal header title                       |
| `description`     | Body text below title                    |
| `isOpen`          | Show/hide state (default: true)          |
| `size`            | sm/md/lg/xl/full (5 sizes)               |
| `showCloseButton` | Toggle close X button                    |
| `closeOnOverlay`  | Click overlay to close                   |
| `centered`        | Vertical centering                       |
| `backgroundColor` | Modal panel background                   |
| `overlayOpacity`  | Overlay darkness 0–100                   |
| `children`        | Content pass-through (container)         |

**Registry fields NOT in render (massive gap — 37+ fields):**

- **Footer:** `showFooter`, `footerAlign`, `primaryButtonText/Action`, `secondaryButtonText/Action`
- **Animation:** `animationType` (fade/scale/slide/zoom/none), `animationDuration`, `animationDirection`
- **Draggable:** `draggable`, `dragHandle`, `dragBounds`
- **Focus:** `trapFocus`, `autoFocus`, `returnFocus`
- **Overlay:** `overlayColor`, `overlayBlur`
- **Responsive:** `mobileFullScreen`, `mobilePosition`, `mobileAnimation`
- **Size:** `xs` size option, `customWidth`, `customHeight`, `fullScreen`
- **State:** `closeOnEscape`, `preventScroll`, `defaultOpen`
- **Accessibility:** `ariaLabel`, `ariaDescribedBy`, `role` (dialog/alertdialog)
- **Header:** `showHeader`, `headerAlign`, `closeButtonPosition`, `closeButtonStyle`

**Converter:** Only 1 alias (L554) | KNOWN_REG L811 | Normalizer ❌

**Fix priorities:**
1. 🔴 Add component-metadata.ts entry
2. 🔴 Add converter normalizer
3. 🔴 Implement `showFooter` with primary/secondary actions
4. 🔴 Implement `closeOnEscape` + `trapFocus`
5. ⚠️ Add animation variants (fade/scale/slide)
6. ⚠️ Add `mobileFullScreen` responsive behaviour
7. ⬜ Add draggable support

---

### 4.4 Carousel

**Location:** `renders.tsx` L20204 (interface) → L20265 (render) | Sub-interface: `CarouselItem` L20191
**Registry:** `core-components.ts` L15334 | **Metadata:** `component-metadata.ts` L910

**Transitions (3 implemented, 5 registered):**

| Transition | Render | Registry | Description                              |
| ---------- | ------ | -------- | ---------------------------------------- |
| `slide`    | ✅     | ✅       | TranslateX horizontal slide              |
| `fade`     | ✅     | ✅       | Absolute-positioned opacity crossfade    |
| `zoom`     | ✅     | ✅       | Scale + opacity combination              |
| `flip`     | ❌     | ✅       | 3D flip rotation                         |
| `cube`     | ❌     | ✅       | 3D cube perspective rotation             |

**Key render features:**
- Touch/swipe support (`onTouchStart/End` with 50px threshold)
- Keyboard navigation (ArrowLeft/ArrowRight)
- Autoplay with `setInterval` + `pauseOnHover`
- Lazy loading (`shouldLoadSlide` proximity check)
- 3 dot styles (circle/bar/number) + 3 arrow shapes (circle/square/minimal)
- Per-slide overlay colour/opacity, tags, CTA buttons (3 styles)
- Multi-slide: `slidesToShow` 1/2/3

**🔴 Critical bug:** Registry field name is `slides`, render prop is `items`. This mismatch means carousel data from registry never reaches the render function.

**Registry fields NOT in render (selection):**
- Thumbnails: `showThumbnails`, `thumbnailPosition/Size/Gap/BorderRadius`, `activeThumbnailBorder`
- Progress: `showProgress`, `progressPosition/Color/Height`
- Captions: `showCaptions`, `captionPosition/Animation/Background/TextColor`
- Advanced: `centerMode`, `variableWidth`, `draggable`, `transitionEasing`

**Converter:** Aliases L437–L438, L553 | KNOWN_REG L809 | Normalizer ❌

**Fix priorities:**
1. 🔴 **Rename render prop `items` → `slides`** to match registry (or add normalizer that maps `slides` → `items`)
2. 🔴 Add converter normalizer
3. ⚠️ Implement `flip` and `cube` transitions
4. ⚠️ Add thumbnail navigation strip
5. ⚠️ Add progress bar indicator

---

### 4.5 Countdown

**Location:** `renders.tsx` L20801 (interface) → L20838 (render)
**Registry:** `core-components.ts` L15950 | **Metadata:** `component-metadata.ts` L921

**Variants (3 implemented, 6 registered):**

| Variant   | Render | Registry | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `simple`  | ✅     | ✅       | Bare numbers with labels                 |
| `cards`   | ✅     | ✅       | Background card panels per unit          |
| `circles` | ✅     | ✅       | Circular rendering (same as simple)      |
| `minimal` | ❌     | ✅       | Ultra-clean minimalist                   |
| `flip`    | ❌     | ✅       | Classic flip clock animation             |
| `digital` | ❌     | ✅       | LED/digital display style                |

> **🔴 Variant Name Mismatch Bug:** The render uses `"simple"` as a variant name, but the registry's defaultProps use `variant: "default"`. When a new Countdown is created from the registry editor, it gets `variant: "default"` — this may not match the render's switch statement, which handles `"simple" | "cards" | "circles"`. Fix: either rename render's `"simple"` to `"default"` or change registry's defaultProps to `variant: "simple"`.

**Key render features:**
- **Static "00" values** — SSR render shows placeholder; no live JS timer
- `isDarkBackground()` for adaptive colours
- Badge/title/subtitle/description section header
- CTA button below countdown
- `tabular-nums` for stable number widths
- Separator between units (:/·/•)

**Registry fields NOT in render:**
- `targetTime`, `timezone` — full date+time targeting
- `urgencyThreshold`, `urgencyColor`, `urgencyPulse`, `urgencySound` — urgency visual
- `showConfetti`, `hideOnComplete`, `redirectUrl` — completion actions
- `flipAnimation`, `pulseOnChange`, `glowEffect`, `animateOnMount` — animations
- `showMilliseconds` — sub-second precision

**Converter:** Aliases L439–L440, L553 | KNOWN_REG L810 | Normalizer ❌

**Fix priorities:**
1. ⚠️ Note: Static "00" display is intentional for SSR. Client hydration activates the timer.
2. ⚠️ Implement `minimal`, `flip`, `digital` variants
3. ⚠️ Add urgency theming (colour change as deadline approaches)
4. ⚠️ Add converter normalizer
5. ⬜ Add flip clock animation for `flip` variant

---

### 4.6 Progress

**Location:** `renders.tsx` L23671 (interface) → L23686 (render)
**Registry:** `core-components.ts` L19916 | **Metadata:** ❌ MISSING

**Variants (3 implemented, 4 registered):**

| Variant     | Render | Registry | Description                              |
| ----------- | ------ | -------- | ---------------------------------------- |
| `default`   | ✅     | ✅       | Solid colour fill bar                    |
| `gradient`  | ✅     | ✅       | Linear gradient fill                     |
| `striped`   | ✅     | ✅       | Diagonal stripe pattern                  |
| `segmented` | ❌     | ✅       | Divided into equal segments              |

**Key render features:**
- `role="progressbar"` with `aria-valuenow/min/max`
- Percentage clamped to 0–100
- 3 height sizes (sm: 1.5, md: 2.5, lg: 4)
- `animate-pulse` when `animate=true`
- Optional label + value display

**Massive registry gap (38+ fields not in render):**
- Circular: `circular`, `circularSize`, `circularStrokeWidth`, `circularShowCenter`
- Milestones: `showMilestones`, `milestones[]`, `milestoneStyle/Color`
- Segments: `segmented`, `segmentCount`, `segmentGap`
- Status: `useStatusColors`, `successThreshold/warningThreshold`, success/warning/error colours
- Stripes: `stripeAngle/Width/Color`, `animatedStripes`
- Glow: `glowEffect/Color`, `shadow`, `innerShadow`
- `indeterminate` mode (loading spinner bar)

**Converter:** ❌ Completely absent — no aliases, no KNOWN_REG, no normalizer

**Fix priorities:**
1. 🔴 Add to converter.ts (typeMap aliases, KNOWN_REGISTRY_TYPES, normalizer)
2. 🔴 Add component-metadata.ts entry
3. 🔴 Implement circular progress mode
4. ⚠️ Implement `segmented` variant
5. ⚠️ Add `indeterminate` mode
6. ⚠️ Add status colour thresholds
7. ⚠️ Fix dark mode (hardcoded `text-gray-700`/`text-gray-500`)

---

## 5. Animation & Motion Components

### 5.1 Animate

**Location:** `renders.tsx` L2599 (interface) → L2609 (render)
**Registry:** `core-components.ts` L997 | **Metadata:** `component-metadata.ts` L267

**Entrance types (12):** none, fadeIn, slideUp, slideDown, slideLeft, slideRight, scaleUp, scaleDown, rotateIn, blurIn, bounceIn, flipIn

**Sub-configuration objects:**

| Config      | Props                                              | In Registry? |
| ----------- | -------------------------------------------------- | ------------ |
| `entrance`  | type, duration, delay, easing, once, threshold     | ✅ Partial   |
| `loop`      | type (8 animations), duration, delay               | ❌ Missing   |
| `scroll`    | type (6 effects), speed, direction, range          | ❌ Missing   |
| `stagger`   | enabled, delay, direction                          | ❌ Missing   |

**Loop types (8):** pulse, bounce, spin, ping, float, shimmer, breathe, wiggle, swing

**Scroll types (6):** parallax, fade-on-scroll, scale-on-scroll, rotate-on-scroll, slide-on-scroll, progress-reveal

**Key features:**
- Pure CSS animations — no Framer Motion
- `IntersectionObserver` for entrance trigger with configurable threshold
- `prefers-reduced-motion` respected
- Custom easing map (easeOut, easeIn, easeInOut, spring, bounce)
- Stagger children with configurable delay and direction
- Container component (`acceptsChildren: true`)

**Converter:** Aliases L682–L685 | KNOWN_REG L834 | Normalizer L1930 (builds nested config objects from flat AI props)

**Fix priorities:**
1. ⚠️ Expose `loop`, `scroll`, and `stagger` in registry fields for editor UI control
2. ⬜ Consider adding Framer Motion integration for smoother scroll-driven animation

---

### 5.2 Tilt3DContainer

**Location:** `renders.tsx` L2819 (interface) → L2832 (render)
**Registry:** `core-components.ts` L1066 | **Metadata:** `component-metadata.ts` L290

**Props (10):** `enabled` (true), `maxAngle` (10°), `speed` (400ms), `glare` (false), `glareMaxOpacity` (0.3), `scale` (1.02×), `perspective` (1000px), `children`, `id`, `className`

**Key features:**
- Cursor-tracking perspective transform: `rotateX(N) rotateY(N)`
- Glare overlay with radial gradient following cursor
- Touch detection — auto-disables on touch devices
- Smooth CSS `transition` with cubic-bezier easing
- Reset to flat on mouse leave

**Status:** ✅ **Perfect alignment.** All 6 core fields in registry. Normalizer at L2005. No gaps.

---

### 5.3 ShapeDivider

**Location:** `renders.tsx` L2913 (interface) → L2937 (render)
**Registry:** `core-components.ts` L1136 | **Metadata:** `component-metadata.ts` L305

**Shapes (11):** wave, wave-smooth, curve, tilt, triangle, arrow, zigzag, clouds, mountains, drops, pyramids

**Key features:**
- SVG `<path>` from `shapeDividerPaths` lookup map
- Absolute positioning at section top or bottom
- CSS breathing animation when `animated: true`
- `aria-hidden="true"` (decorative only)

**Status:** ✅ **Perfect alignment.** All 8 fields in registry. Normalizer at L2021.

---

### 5.4 CursorEffect

**Location:** `renders.tsx` L2999 (interface) → L3008 (render)
**Registry:** `core-components.ts` L1216 | **Metadata:** `component-metadata.ts` L320

**Effect types (6):** none, spotlight, glow, trail, magnetic, tilt

**Key features:**
- Spotlight: radial gradient follows cursor position
- Glow: inset box-shadow tracks cursor
- Magnetic: element translates toward cursor
- Tilt: perspective rotateX/Y from cursor position
- Touch detection — auto-disables on touch devices
- All overlays use `aria-hidden="true"`

**Status:** ✅ **Perfect alignment.** 3 fields (type, color, intensity). Normalizer at L2036.

---

### 5.5 Typewriter

**Location:** `renders.tsx` L23944 (interface) → L23963 (render)
**Registry:** `core-components.ts` L16395 | **Metadata:** `component-metadata.ts` L933

**Key features:**
- SSR-safe: shows first text statically; cursor animates with CSS `animate-pulse`
- Client-side hydration activates typing/deleting cycle
- Responsive text sizing via `getResponsiveClasses()`
- Configurable prefix/suffix text around animated word
- `tabindex="0"` + `aria-label` for accessibility

**Registry gap:** 50+ fields registered but only 15 in render. Extra registry fields include: cursor colour/blink speed/style, typing animation effects, error simulation, multiline mode, highlight colour.

**Fix priorities:**
1. ⚠️ Add converter normalizer
2. ⚠️ Fix dark mode (hardcoded `text-gray-900` default)
3. ⬜ Implement cursor style options from registry

---

### 5.6 Parallax

**Location:** `renders.tsx` L24019 (interface) → L24033 (render)
**Registry:** `core-components.ts` L16780 | **Metadata:** `component-metadata.ts` L945

**Current implementation:** Simple CSS `background-attachment: fixed` with configurable overlay and min-height. Not true scroll-driven parallax.

**Registry gap:** 50+ fields registered but render uses only 12. Missing: layers, blur, rotate, fade-on-scroll, speed curves, disable-on-mobile.

**Fix priorities:**
1. ⚠️ Add converter normalizer
2. ⚠️ Implement true scroll-driven parallax (IntersectionObserver + translateY)
3. ⬜ Add `disableOnMobile` (CSS `background-attachment: fixed` breaks on iOS)

---

## 6. Rich Display & Section Components

### 6.1 Testimonials

**Location:** `renders.tsx` L9663 (interface) → L9805 (render)
**Registry:** `core-components.ts` L6762 | **Metadata:** `component-metadata.ts` L461

**Variants (10):** cards, minimal, quote, carousel, masonry, slider, grid, featured, bubble, timeline

**Key features:**
- 60+ props with full colour customisation
- Star rating system (full/half/empty)
- Avatar display with multiple sizes and shapes
- Carousel mode with autoplay, arrows, dots
- Quote icons with configurable colour/size/position
- Company logos
- `isDarkBackground()` adaptive colours
- CSS hover effects on cards

**Converter:** 7 aliases | KNOWN_REG L781 | Normalizer L1247 (reshapes items array)

**Status:** ✅ **Excellent.** ~90% registry coverage. Minor gap: some advanced card hover effects in registry not in render.

---

### 6.2 FAQ

**Location:** `renders.tsx` L10367 (interface) → L10574 (render)
**Registry:** `core-components.ts` L7391 | **Metadata:** `component-metadata.ts` L473

**Variants (10):** accordion, cards, two-column, minimal, tabs, timeline, bubble, modern, grid, floating

**Key features:**
- 80+ props — most feature-rich component in the system
- Schema.org structured data: FAQPage, HowTo, QAPage types
- Category filtering and search
- Popular/featured items highlighting
- Helpful votes counter
- Contact CTA section
- Numbering system
- Native `<details>` element for accordion behaviour

**Converter:** 2 aliases | KNOWN_REG L782 | Normalizer L1459 (normalises item shape)

**Status:** ✅ **Excellent.** ~90% registry coverage. Schema.org support is a platform differentiator.

---

### 6.3 Stats

**Location:** `renders.tsx` L11482 (interface) → L11639 (render)
**Registry:** `core-components.ts` L8471 | **Metadata:** `component-metadata.ts` L520

**Variants (10):** simple, cards, bordered, icons, minimal, gradient, glass, outline, split, circular

**Key features:**
- 80+ props with full customisation
- Counter animation (animateNumbers with duration/delay/stagger)
- Trend indicators (up/down arrows with values)
- Prefix/suffix support ("$", "%", "k+")
- Icon display per stat
- `isDarkBackground()` — default dark background (#111827)
- `tabular-nums` for stable number widths
- Responsive columns (1–6)

**Converter:** 2 aliases | KNOWN_REG L783 | Normalizer L1485

**Status:** ✅ **Excellent.** ~90% registry coverage.

---

### 6.4 BlogPreview

**Location:** `renders.tsx` L26040 (interface) → L26074 (render)
**Registry:** `core-components.ts` L27127 | **Metadata:** `component-metadata.ts` L1213

**Variants (4):** grid, list, featured, cards

**Key features:**
- Posts array with title, excerpt, image, author, date, category, readTime
- Author avatar with initials fallback
- Image hover scale transition
- `isDarkBackground()` for adaptive colours
- Responsive grid columns (2/3/4)
- Category colour customisation
- CTA link below grid

**Converter:** 6 aliases | KNOWN_REG L876 | Normalizer ❌

**Fix priorities:**
1. ⚠️ Add converter normalizer for blog post data shape
2. ⬜ Consider pagination for large post sets

---

## 7. Marketing & Trust Components

### 7.1 AnnouncementBar

**Location:** `renders.tsx` L24102 (interface) → L24129 (render)
**Registry:** `core-components.ts` L21197 | **Metadata:** `component-metadata.ts` L960

**Variants (7):** default, success, warning, error, info, gradient, custom

**Key features:**
- `isDarkBackground()` for automatic text colour
- `buildGradientCSS()` for gradient backgrounds
- Sticky positioning with z-50
- Dismissible with close button
- Link with configurable text

**Registry fields NOT in render (selection):**
- Countdown integration, marquee scrolling, auto-hide timer
- Cookie-based dismiss persistence
- Typography controls

**Converter:** 5 aliases | KNOWN_REG L791 | Normalizer ❌

**Fix priorities:**
1. ⚠️ Add converter normalizer
2. ⬜ Implement marquee scrolling for long text
3. ⬜ Add cookie-based dismiss persistence

---

### 7.2 SocialProof

**Location:** `renders.tsx` L24245 (interface) → L24269 (render)
**Registry:** `core-components.ts` L21757 | **Metadata:** `component-metadata.ts` L972

**Variants (4):** stars, score, compact, detailed

**Key features:**
- Full/half/empty star rendering with configurable colours
- Schema.org `AggregateRating` JSON-LD auto-injection
- Platform logo display
- CSS variable colour fallbacks
- Responsive sizing

**Converter:** 3 aliases | KNOWN_REG L789 | Normalizer ❌

**Fix priorities:**
1. ⚠️ Add converter normalizer
2. ⚠️ Implement avatar stack display from registry

---

### 7.3 TrustBadges

**Location:** `renders.tsx` L24482 (interface) → L24499 (render)
**Registry:** `core-components.ts` L22387 | **Metadata:** `component-metadata.ts` L983

**Key features:**
- Image-based badge display
- Grayscale-to-colour hover effect (CSS `filter: grayscale()`)
- CSS `fadeInUp` animation with stagger delay
- Responsive grid/flex layout

**Dark mode issue:** Title uses hardcoded `text-gray-500` — needs `isDarkBackground()`.

**Converter:** 7 aliases | KNOWN_REG L788 | Normalizer L2157

**Fix priorities:**
1. ⚠️ Add `isDarkBackground()` for title colour
2. ⬜ Implement tooltip from registry

---

### 7.4 LogoCloud

**Location:** `renders.tsx` L24609 (interface) → L24635 (render)
**Registry:** `core-components.ts` L22999 | **Metadata:** `component-metadata.ts` L995

**Variants (3):** simple, cards, marquee

**Key features:**
- `isDarkBackground()` for adaptive colours
- Cards variant with shadow and hover scale
- Marquee variant with CSS animation + duplicated logos for infinite scroll
- Grayscale-to-colour hover effect
- `pauseOnHover` for marquee

**Converter:** 6 aliases | KNOWN_REG L787 | Normalizer L2084 (smart image filtering + auto-convert)

> **⚠️ AI Agent Warning:** The LogoCloud normalizer has a `__convertedToFeatures` fallback. When no logo images have valid URLs, the normalizer converts the entire component into a Features-shaped component with this signal flag. The calling code must handle this, or the component type stays `LogoCloud` but the props become Features-shaped — causing a render mismatch.

**Status:** ✅ **Good.** Well-implemented with marquee being a standout feature.

---

### 7.5 ComparisonTable

**Location:** `renders.tsx` L24870 (interface) → L24894 (render)
**Registry:** `core-components.ts` L23750 | **Metadata:** `component-metadata.ts` L1007

**Variants (3):** simple, cards, striped

**Key features:**
- Grouped rows with group labels
- Sticky header and sticky first column
- Mobile: stacked card layout OR horizontal scroll
- Check/cross SVG icons for boolean features
- Highlighted column with badge
- CSS variable colour fallbacks
- Tooltip support for feature descriptions

**Converter:** 4 aliases | KNOWN_REG L790 | Normalizer ❌

**Fix priorities:**
1. ⚠️ Add converter normalizer for complex data shape (columns[] + rows[])

---

## 8. Media Components

### 8.1 BeforeAfter

**Location:** `renders.tsx` L12790 (interface) → L12826 (render)
**Registry:** `core-components.ts` L3599 | **Metadata:** `component-metadata.ts` L1262

**Handle styles (3):** line, circle, arrows

**Key features:**
- Full drag implementation (mouse + touch events)
- Keyboard support: Arrow keys with step=5, horizontal and vertical
- CSS `clip-path: inset()` for image masking
- `role="slider"` with `aria-valuenow/min/max`
- Horizontal and vertical orientation
- 5 aspect ratios (square/video/portrait/wide/auto)
- Label positions (top/bottom/overlay)
- Caption with `<figure>` semantic wrapper

**Status:** ✅ **Excellent — perfectly aligned.** 18 registry fields match 20 render props 1:1.

**Converter issue:** Has typeMap aliases (L466–L470, L567) but missing from KNOWN_REGISTRY_TYPES. Needs to be added.

---

### 8.2 Audio

**Location:** `renders.tsx` L13288 (interface) → L13324 (render)
**Registry:** `core-components.ts` L3831 | **Metadata:** `component-metadata.ts` L1305

**Variants (3):** full, compact, minimal

**Key features:**
- Native `<audio>` element with React state management
- Visual waveform bars (randomized height, progress tracking via click)
- Speed control cycle (0.75×, 1×, 1.25×, 1.5×, 2×)
- Play/pause, seek, volume implied
- CSS variable colour fallbacks

**Converter issue:** Has typeMap aliases (L570–L575) but missing from KNOWN_REGISTRY_TYPES.

**Fix priorities:**
1. 🔴 Add to KNOWN_REGISTRY_TYPES in converter.ts

---

### 8.3 Embed

**Location:** `renders.tsx` L13661 (interface) → L13698 (render)
**Registry:** `core-components.ts` L3955 | **Metadata:** `component-metadata.ts` L1331

**Key features:**
- Secure `<iframe>` with `sandbox` attribute
- Loading placeholder with spinner
- Multiple aspect ratios (1:1, 4:3, 16:9, 21:9, auto)
- Caption with alignment
- `loading="lazy"` for performance

**Converter issue:** Has typeMap aliases (L576–L581) but missing from KNOWN_REGISTRY_TYPES.

**Fix priorities:**
1. 🔴 Add to KNOWN_REGISTRY_TYPES in converter.ts

---

### 8.4 AvatarGroup

**Location:** `renders.tsx` L13855 (interface) → L13870 (render)
**Registry:** `core-components.ts` L4065 | **Metadata:** `component-metadata.ts` L1357

**Key features:**
- Negative margin stacking with z-index ordering
- Overflow badge ("+N") when exceeding `max`
- Initials fallback from name/alt
- 5 sizes (xs–xl), 3 overlap amounts (sm/md/lg)
- `role="group"` with `aria-label`
- CSS variable colour fallbacks

**Converter issue:** Has typeMap aliases (L582–L586) but missing from KNOWN_REGISTRY_TYPES.

**Fix priorities:**
1. 🔴 Add to KNOWN_REGISTRY_TYPES in converter.ts

---

## 9. Experimental Components

These 5 components (+ Alert) have render functions and registry entries but are not fully integrated into the converter or metadata systems. They are functional but not AI-discoverable.

### 9.1 Alert

**Location:** `renders.tsx` L23741 (interface) → L23754 (render)
**Registry:** `core-components.ts` L20387 | **Metadata:** ❌ MISSING

**Variants (4 rendered, 6 registered):** info, success, warning, error — plus `neutral` and `custom` in registry only

**Key features:**
- `role="alert"` for screen reader announcements
- Variant-specific SVG icons (info circle, check, triangle, X)
- Closable with X button + `aria-label="Close"`
- Action button (underlined link)
- 3 sizes (sm/md/lg padding)

**Dark mode issue:** Hardcoded Tailwind classes (`bg-sky-50`, `border-sky-200`, `text-sky-800`) — does not use `style={{}}` or `isDarkBackground()`.

**Massive registry gap (40+ fields not in render):**
- `description`, custom colours, icon position/size
- Actions: `showActions`, `primaryActionText/Link`, `secondaryActionText/Link`
- Auto-close: timer with configurable delay
- Progress bar inside alert
- Animation: fade/slide-down/slide-up/scale
- Link section, border position, shadow

**Converter:** ❌ Completely absent

**Fix priorities:**
1. 🔴 Add to converter.ts (aliases, KNOWN_REG, normalizer)
2. 🔴 Add component-metadata.ts entry
3. 🔴 Replace hardcoded Tailwind colours with `style={{}}`
4. ⚠️ Implement `neutral` and `custom` variants
5. ⚠️ Add auto-close timer
6. ⚠️ Add action buttons from registry

---

### 9.2 CardFlip3D

**Location:** `renders.tsx` L25423 → L25444 | **Registry:** L24539 | **Metadata:** ❌ MISSING
**Converter:** ❌ Completely absent

3D flip card with front and back content. Triggers on hover or click. Uses CSS `transform: rotateY(180deg)` with `perspective` and `backface-visibility: hidden`.

---

### 9.3 TiltCard

**Location:** `renders.tsx` L25559 → L25576 | **Registry:** L25097 | **Metadata:** ❌ MISSING
**Converter:** ↪ Maps to Tilt3DContainer via alias L688

Perspective tilt on hover. Similar to Tilt3DContainer but as a standalone card rather than wrapper.

---

### 9.4 GlassCard

**Location:** `renders.tsx` L25669 → L25684 | **Registry:** L25598 | **Metadata:** ❌ MISSING
**Converter:** ❌ Completely absent

Glass morphism card with `backdrop-filter: blur()` and translucent background. Frosted glass visual effect.

---

### 9.5 ParticleBackground

**Location:** `renders.tsx` L25739 → L25753 | **Registry:** L26075 | **Metadata:** ❌ MISSING
**Converter:** ❌ Completely absent

Canvas-based particle animation system. Interactive particles respond to cursor position.

---

### 9.6 ScrollAnimate

**Location:** `renders.tsx` L25889 → L25914 | **Registry:** L26639 | **Metadata:** ❌ MISSING
**Converter:** ❌ Completely absent

Scroll-position based animation trigger. Combines parallax + entrance animation based on scroll offset.

---

## 10. Dark Mode & Theming

### 10.1 Current Dark Mode Coverage

| Component           | `isDarkBackground()` | CSS Variables | Hardcoded Colours | Status      |
| ------------------- | -------------------- | ------------- | ----------------- | ----------- |
| Accordion           | ✅                   | ✅            | —                 | ✅ Good     |
| Tabs                | —                    | ✅            | —                 | ⚠️ CSS only |
| Modal               | —                    | —             | Fixed bg prop     | ❌ None     |
| Carousel            | ✅                   | ✅            | —                 | ✅ Good     |
| Countdown           | ✅                   | ✅            | —                 | ✅ Good     |
| BeforeAfter         | —                    | ✅            | —                 | ⚠️ CSS only |
| Progress            | —                    | —             | `text-gray-700`   | ❌ Hardcoded |
| Alert               | —                    | —             | `bg-sky-50` etc.  | ❌ Hardcoded |
| Animate             | N/A                  | N/A           | N/A               | ✅ Wrapper  |
| Tilt3DContainer     | N/A                  | N/A           | N/A               | ✅ Wrapper  |
| ShapeDivider        | N/A                  | ✅            | —                 | ✅ Good     |
| CursorEffect        | N/A                  | N/A           | N/A               | ✅ Wrapper  |
| Typewriter          | —                    | —             | `text-gray-900`   | ❌ Hardcoded |
| Parallax            | —                    | ✅            | —                 | ⚠️ CSS only |
| Testimonials        | ✅                   | ✅            | `#f9fafb` default | ✅ Good     |
| FAQ                 | —                    | ✅            | —                 | ⚠️ CSS only |
| Stats               | ✅                   | ✅            | Dark by default   | ✅ Good     |
| SocialProof         | —                    | ✅            | —                 | ⚠️ CSS only |
| TrustBadges         | —                    | —             | `text-gray-500`   | ❌ Hardcoded |
| LogoCloud           | ✅                   | ✅            | —                 | ✅ Good     |
| ComparisonTable     | —                    | ✅            | —                 | ⚠️ CSS only |
| AnnouncementBar     | ✅                   | ✅            | —                 | ✅ Good     |
| BlogPreview         | ✅                   | ✅            | —                 | ✅ Good     |
| Audio               | —                    | ✅            | —                 | ⚠️ CSS only |
| Embed               | —                    | ✅            | —                 | ⚠️ CSS only |
| AvatarGroup         | —                    | ✅            | —                 | ⚠️ CSS only |

**Summary:** 9/31 use `isDarkBackground()`, 6/31 use only CSS variables, 4/31 have hardcoded Tailwind colours, 5/31 are transparent wrappers (N/A), 5/31 are experimental (not assessed).

### 10.2 Required Dark Mode Fixes

**Priority 1 — Replace hardcoded colours:**
- **Alert:** All 4 variant colours (`bg-sky-50`, `bg-green-50`, etc.) → `style={{}}` with CSS var fallbacks
- **Progress:** `text-gray-700`/`text-gray-500` → `style={{ color: color || 'var(--color-foreground)' }}`
- **Typewriter:** `text-gray-900` default → `textColor || 'var(--color-foreground)'`
- **TrustBadges:** `text-gray-500` title → `isDarkBackground()` resolution

**Priority 2 — Add `isDarkBackground()` to CSS-only components:**
- Tabs, FAQ, SocialProof, ComparisonTable

---

## 11. Accessibility & WCAG Compliance

### 11.1 Current ARIA Implementation

| Component       | ARIA Pattern       | Keyboard Nav        | Landmarks                    | Status      |
| --------------- | ------------------ | ------------------- | ---------------------------- | ----------- |
| Accordion       | Disclosure         | Enter/Space (native) | `<details>/<summary>`       | ✅ Good     |
| Tabs            | Tabs               | Arrow/Home/End       | `role=tablist/tab/tabpanel`  | ✅ Excellent |
| Modal           | Dialog             | —                    | `role=dialog, aria-modal`    | ⚠️ No Escape |
| Carousel        | —                  | Arrow Left/Right     | —                            | ⚠️ No ARIA  |
| Countdown       | —                  | —                    | —                            | ⚠️ No ARIA  |
| BeforeAfter     | Slider             | Arrow keys (step=5)  | `role=slider, aria-valuenow` | ✅ Excellent |
| Progress        | Progressbar        | N/A                  | `role=progressbar`           | ✅ Good     |
| Alert           | Alert              | N/A                  | `role=alert`                 | ✅ Good     |
| Audio           | Media              | —                    | `<audio>` native             | ✅ Good     |
| AvatarGroup     | Group              | —                    | `role=group, aria-label`     | ✅ Good     |
| ShapeDivider    | Decorative         | N/A                  | `aria-hidden=true`           | ✅ Good     |
| CursorEffect    | Decorative         | N/A                  | `aria-hidden=true` overlays  | ✅ Good     |
| FAQ             | Disclosure         | Enter/Space (native) | `<details>`, Schema.org      | ✅ Excellent |
| SocialProof     | —                  | —                    | Schema.org                   | ✅ Good     |

### 11.2 Required Accessibility Fixes

1. **Modal:** Add `Escape` key to close, implement focus trap (`trapFocus`), add `aria-labelledby` linking to title
2. **Carousel:** Add `role="region"` with `aria-roledescription="carousel"`, `aria-label` for slide navigation, live region for slide announcements
3. **Countdown:** Add `aria-live="polite"` for timer updates (client-side), `role="timer"`
4. **Animate:** Already respects `prefers-reduced-motion` ✅

---

## 12. CSS Variable & Design Token System

### 12.1 Variables Used by Interactive Components

```css
/* Colour tokens (used across all interactive components) */
--color-primary         /* Accent/active colours */
--color-background      /* Component background */
--color-foreground      /* Primary text */
--color-muted           /* Subtle backgrounds */
--color-muted-foreground /* Secondary text */
--color-card            /* Card backgrounds */
--color-border          /* Border colours */
--color-input           /* Input field borders */
--brand-primary         /* Brand accent (Tabs uses this) */
--brand-secondary       /* Secondary accent (Progress gradient) */

/* Status colours */
--color-info-bg, --color-info-border, --color-info-text
--color-success-bg, --color-success-border, --color-success-text
--color-warning-bg, --color-warning-border, --color-warning-text
--color-error-bg, --color-error-border, --color-error-text

/* Typography tokens */
--font-body             /* Body text font */
--font-heading          /* Heading font */

/* Star rating */
--color-star            /* Filled star colour (#facc15) */
--color-star-empty      /* Empty star colour (#d1d5db) */
```

### 12.2 Components Needing CSS Variable Migration

- **Alert:** Replace 4 hardcoded colour sets with `--color-{status}-{bg|border|text}` tokens
- **Progress:** Replace `#e5e7eb` track colour with `--color-muted`
- **TrustBadges:** Replace `text-gray-500` with `var(--color-muted-foreground)`
- **Typewriter:** Replace `text-gray-900` with `var(--color-foreground)`

---

## 13. AI Designer Integration

### 13.1 Components with AI Configuration

All 31 components have `aiConfig` in their `defineComponent` registration:

```typescript
ai: {
  canModify: ["field1", "field2", ...],  // Fields AI can change
  suggestions: [
    { title: "...", changes: { /* preset changes */ } },
  ],
}
```

### 13.2 AI Discovery Gaps

**8 components missing from component-metadata.ts** cannot be discovered by the AI for automatic placement:

| Component          | Impact                                                        |
| ------------------ | ------------------------------------------------------------- |
| Modal              | AI cannot suggest modal dialogs for CTAs or forms             |
| Progress           | AI cannot add progress indicators to dashboards/onboarding    |
| Alert              | AI cannot add notifications/warnings to pages                 |
| CardFlip3D         | AI cannot create interactive reveal cards                     |
| TiltCard           | AI cannot add hover effect cards                              |
| GlassCard          | AI cannot use glass morphism effects                          |
| ParticleBackground | AI cannot add particle animations                             |
| ScrollAnimate      | AI cannot add scroll-triggered animations                     |

**Fix:** Add `COMPONENT_METADATA` entries for all 8 components, including `keywords`, `usageGuidelines`, `category`, `relatedComponents`, and `designGuidelines`.

### 13.3 Converter Normalizer Coverage

**Components with normalizers (12 — AI props cleaned up):**
Accordion, Tabs, Animate, Tilt3DContainer, ShapeDivider, CursorEffect, Testimonials, FAQ, Stats, TrustBadges, LogoCloud

**Components without normalizers (13 — AI props pass through raw):**
Modal, Carousel, Countdown, Typewriter, Parallax, SocialProof, ComparisonTable, AnnouncementBar, BlogPreview, Audio, Embed, AvatarGroup + all 5 experimental

**Risk:** AI-generated prop names that don't match render prop names are silently lost.

---

## 14. Registry & Converter Alignment

### 14.1 Complete Converter Alias Map (All 31 Components)

| Component           | Aliases → Maps To                                                                    |
| ------------------- | ------------------------------------------------------------------------------------ |
| **Accordion**       | AccordionBlock, AccordionSection → Accordion                                         |
| **Tabs**            | TabsBlock, TabsSection → Tabs                                                        |
| **Modal**           | Modal (direct only)                                                                   |
| **Carousel**        | CarouselBlock, CarouselSection → Carousel                                             |
| **Countdown**       | CountdownBlock, CountdownSection → Countdown                                          |
| **BeforeAfter**     | BeforeAfterBlock, BeforeAfterSection, ImageComparisonBlock, ImageComparison, CompareImages → BeforeAfter |
| **Progress**        | ❌ No aliases — AI cannot generate this component                                     |
| **Alert**           | ❌ No aliases — AI cannot generate this component                                     |
| **Animate**         | AnimateBlock, AnimationWrapper, MotionWrapper → Animate                               |
| **Tilt3DContainer** | Tilt3DContainerBlock, TiltCard, Tilt3D → Tilt3DContainer                              |
| **ShapeDivider**    | ShapeDividerBlock, WaveDivider, SectionDivider → ShapeDivider                         |
| **CursorEffect**    | CursorEffectBlock, CustomCursor → CursorEffect                                       |
| **Typewriter**      | TypewriterText, TypingEffect, AnimatedText → Typewriter                               |
| **Parallax**        | ParallaxSection, ParallaxScroll → Parallax                                             |
| **Testimonials**    | TestimonialsBlock, TestimonialBlock, Reviews, ReviewsBlock, ReviewsSection, ClientReviews → Testimonials |
| **FAQ**             | FAQBlock → FAQ                                                                         |
| **Stats**           | StatsBlock → Stats                                                                     |
| **SocialProof**     | SocialProofBlock, SocialProofSection → SocialProof                                     |
| **TrustBadges**     | TrustBadgesBlock, TrustBadgesSection, Badges, Accreditations, Credentials, Certifications → TrustBadges |
| **LogoCloud**       | LogoCloudBlock, LogoCloudSection, PartnerLogos, Partners, TrustedBy → LogoCloud        |
| **ComparisonTable** | ComparisonBlock, ComparisonSection, ComparisonTableBlock → ComparisonTable              |
| **AnnouncementBar** | AnnouncementBlock, AnnouncementBarBlock, Banner, BannerBlock → AnnouncementBar          |
| **BlogPreview**     | BlogGrid, BlogCards, BlogList, LatestPosts, RecentPosts → BlogPreview                  |
| **Audio**           | AudioBlock, AudioSection, AudioPlayer, MusicPlayer, PodcastPlayer → Audio               |
| **Embed**           | EmbedBlock, EmbedSection, IframeBlock, IframeEmbed, ExternalEmbed → Embed               |
| **AvatarGroup**     | AvatarGroupBlock, AvatarGroupSection, AvatarStack, UserGroup → AvatarGroup              |
| **CardFlip3D**      | ❌ No aliases                                                                          |
| **TiltCard**        | ↪ Redirects to Tilt3DContainer                                                         |
| **GlassCard**       | ❌ No aliases                                                                          |
| **ParticleBackground** | ❌ No aliases                                                                       |
| **ScrollAnimate**   | ❌ No aliases                                                                          |

### 14.2 KNOWN_REGISTRY_TYPES Status

**Missing from KNOWN_REGISTRY_TYPES (must be added):**

| Component          | Has typeMap Aliases | KNOWN_REG_TYPES | Action Required                                    |
| ------------------ | ------------------- | --------------- | -------------------------------------------------- |
| BeforeAfter        | ✅ 6 aliases        | ❌              | Add `"BeforeAfter"` to KNOWN_REGISTRY_TYPES        |
| Audio              | ✅ 6 aliases        | ❌              | Add `"Audio"` to KNOWN_REGISTRY_TYPES              |
| Embed              | ✅ 6 aliases        | ❌              | Add `"Embed"` to KNOWN_REGISTRY_TYPES              |
| AvatarGroup        | ✅ 5 aliases        | ❌              | Add `"AvatarGroup"` to KNOWN_REGISTRY_TYPES        |
| BlogPreview        | ✅ 6 aliases        | ❌              | Add `"BlogPreview"` to KNOWN_REGISTRY_TYPES        |
| Progress           | ❌                  | ❌              | Add aliases + KNOWN_REG + normalizer               |
| Alert              | ❌                  | ❌              | Add aliases + KNOWN_REG + normalizer               |
| CardFlip3D         | ❌                  | ❌              | Add aliases + KNOWN_REG (experimental)             |
| GlassCard          | ❌                  | ❌              | Add aliases + KNOWN_REG (experimental)             |
| ParticleBackground | ❌                  | ❌              | Add aliases + KNOWN_REG (experimental)             |
| ScrollAnimate      | ❌                  | ❌              | Add aliases + KNOWN_REG (experimental)             |

---

## 15. Implementation Phases

### Phase 1: Critical Pipeline Fixes (Unblocks AI generation)

| Task                                                        | Component(s)                          | Files                  | Impact  |
| ----------------------------------------------------------- | ------------------------------------- | ---------------------- | ------- |
| Add 4 types to KNOWN_REGISTRY_TYPES                         | BeforeAfter, Audio, Embed, AvatarGroup | converter.ts           | 🔴 High |
| Add Progress to converter (aliases + KNOWN_REG + normalizer) | Progress                              | converter.ts           | 🔴 High |
| Add Alert to converter (aliases + KNOWN_REG + normalizer)    | Alert                                 | converter.ts           | 🔴 High |
| Add 8 component-metadata.ts entries                          | Modal, Progress, Alert + 5 experimental | component-metadata.ts | 🔴 High |
| Fix Carousel `slides`/`items` field name mismatch            | Carousel                              | renders.tsx or registry | 🔴 High |
| Add BlogPreview to KNOWN_REGISTRY_TYPES                      | BlogPreview                           | converter.ts           | 🔴 High |
| Fix Countdown `simple`/`default` variant name mismatch       | Countdown                             | renders.tsx or registry | 🔴 High |

### Phase 2: Normalizer Coverage (Improves AI output quality)

| Task                                      | Component(s)                                      | Files        |
| ----------------------------------------- | ------------------------------------------------- | ------------ |
| Add normalizers for 9 components          | Modal, Carousel, Countdown, Typewriter, Parallax, SocialProof, ComparisonTable, AnnouncementBar, BlogPreview | converter.ts |

### Phase 3: Dark Mode & Theming (Visual consistency)

| Task                                            | Component(s)                     | Files        |
| ----------------------------------------------- | -------------------------------- | ------------ |
| Replace hardcoded Tailwind colours with style={{}} | Alert, Progress, Typewriter, TrustBadges | renders.tsx |
| Add `isDarkBackground()` to CSS-only components    | Tabs, FAQ, SocialProof, ComparisonTable | renders.tsx |

### Phase 4: Missing Variants (Feature parity with registry)

| Task                              | Component(s)                | Variants to add            |
| --------------------------------- | --------------------------- | -------------------------- |
| Accordion missing variants        | Accordion                   | minimal, cards             |
| Countdown missing variants        | Countdown                   | minimal, flip, digital     |
| Carousel missing transitions      | Carousel                    | flip, cube                 |
| Alert missing variants            | Alert                       | neutral, custom            |
| Progress missing variant          | Progress                    | segmented                  |

### Phase 5: Major Feature Gaps (Competitive parity)

| Task                              | Component(s)                | Details                          |
| --------------------------------- | --------------------------- | -------------------------------- |
| Modal footer + actions            | Modal                       | Primary/secondary buttons        |
| Modal focus trap + Escape         | Modal                       | trapFocus, closeOnEscape         |
| Modal animation variants          | Modal                       | fade, scale, slide, zoom         |
| Progress circular mode            | Progress                    | SVG circle with stroke-dasharray |
| Progress milestones               | Progress                    | Marker points on bar             |
| Parallax scroll-driven            | Parallax                    | True IntersectionObserver + translateY |
| Carousel thumbnails               | Carousel                    | Thumbnail navigation strip       |
| Carousel progress bar             | Carousel                    | Slide progress indicator         |

### Phase 6: Experimental → Production

| Task                              | Component(s)                          | Details                         |
| --------------------------------- | ------------------------------------- | ------------------------------- |
| Add converter support             | CardFlip3D, GlassCard, ParticleBackground, ScrollAnimate | Aliases, KNOWN_REG, metadata |
| Dark mode audit                   | All 5 experimental                    | Verify style={{}} usage         |
| Accessibility audit               | All 5 experimental                    | ARIA roles, keyboard nav        |

---

## 16. Testing & Quality Gates

### 16.1 Test Checklist — Per Component

```
□ TypeScript — npx tsc --noEmit passes with zero new errors
□ Visual — Component renders correctly in light mode
□ Visual — Component renders correctly on dark background
□ ARIA — Screen reader announces component role correctly
□ Keyboard — All interactive elements reachable via Tab
□ Keyboard — Primary action works with Enter/Space
□ Keyboard — Escape closes modal/overlay components
□ Mobile — Touch interactions work (swipe, drag, tap)
□ Responsive — Component adapts to mobile/tablet/desktop
□ Motion — Respects prefers-reduced-motion: reduce
□ Pipeline — AI Designer can generate the component via converter alias
□ Pipeline — Component appears in palette UI via metadata
□ Pipeline — Props survive full pipeline: AI → converter → registry → render
```

### 16.2 Integration Tests

```
□ Carousel renders with slides data from registry (not items)
□ Accordion opens/closes with keyboard only
□ Tabs navigates with arrow keys + Home/End
□ Modal traps focus within dialog
□ BeforeAfter slider works with keyboard arrows
□ Countdown shows live timer after client hydration
□ Audio player play/pause cycle works
□ Typewriter animates after client hydration
□ Animate respects prefers-reduced-motion
□ FAQ Schema.org JSON-LD validates in structured data testing tool
□ SocialProof AggregateRating JSON-LD validates
```

### 16.3 Regression Tests

```
□ All 31 components render without console errors
□ No Tailwind colour classes in new/modified render functions
□ All converter aliases resolve to correct component types
□ All KNOWN_REGISTRY_TYPES entries are valid
□ All normalizers produce props that match render interfaces
□ All component-metadata.ts entries have keywords and usageGuidelines
```

---

## 17. CRITICAL FOR AI AGENT — Implementation Guard Rails

> **This section is the single most important reference for any AI agent implementing changes.** Read this BEFORE touching any code.

### 17.1 Silent Data Loss Bugs (Fix FIRST)

| Bug | Component | What Happens | Fix |
| --- | --------- | ------------ | --- |
| **Carousel `items` vs `slides`** | Carousel | Registry stores data in `slides` key. Render destructures `items`. Result: empty carousel. `defaultProps` also uses `slides: []`, compounding the issue. | Either rename render param from `items` to `slides`, OR add a Carousel normalizer in converter.ts that maps `slides` → `items`. |
| **Countdown `simple` vs `default`** | Countdown | Registry sends `variant: "default"`. Render switch handles `"simple" \| "cards" \| "circles"`. New countdowns may not match any case. | Rename render's `"simple"` → `"default"`, OR change registry defaultProps to `variant: "simple"`. |

### 17.2 Render Props Are the Only Truth

When generating component JSON, **only the props destructured in the render function are functional:**
- **Modal:** Only 13 props work (isOpen, title, content, size, variant, etc.). The 50+ registry fields (draggable, trapFocus, footer, animations) are Studio UI-only and are **silently ignored** by the render.
- **Progress:** Only 12 props work. Registry-only fields (circular, milestones, segments, statusColors) render nothing.
- **Alert:** Only 10 props work. Registry-only fields (actions, autoClose, progressBar, link, richAnimation) render nothing.
- **All other components:** Render props are documented per-component in Sections 4–9.

### 17.3 Colour Rules

- **All colours MUST use `style={{}}` inline styles** for dark mode compatibility.
- **Alert currently uses hardcoded Tailwind classes** (`bg-sky-50`, `text-green-800`, etc.) — dark mode will NOT work for Alert until refactored.
- **Brand colours and fonts are injected automatically** by `renderer.tsx` into ALL component props via `injectBrandColors()` and `injectBrandFonts()`. Components with hardcoded colour defaults may get brand overrides at render time.

### 17.4 File Size Warning

All 31 interactive component render functions live in a **single 27,000+ line file** (`renders.tsx`). When editing:
- Line numbers shift with every edit — always search for function names, not line numbers
- Make targeted edits (avoid reformatting unrelated code)
- Test each component individually after changes

### 17.5 Normalizer Function Name

The actual normalizer function is **`transformPropsForStudio()`** (converter.ts L1028), NOT `normalizeComponentProps()`. All normalizer handlers are case branches inside this function's switch statement.

### 17.6 Renderer Dispatch

- **No hardcoded dispatch table.** Renderer uses `componentRegistry.get(type)` from the live registry.
- If a component isn't registered via `defineComponent()` in core-components.ts, it renders:
  - **Dev mode:** Amber dashed border fallback with component type label
  - **Production:** Silent section with title/subtitle if available, or `null`
- All 31 interactive components ARE currently registered — this warning applies when adding new components.

---

## Appendix: Component Quick Reference

### By Category

| Category     | Components                                                               | Count |
| ------------ | ------------------------------------------------------------------------ | ----- |
| Interactive  | Accordion, Tabs, Modal, Carousel, Countdown, Typewriter, Parallax        | 7     |
| Animation    | Animate, Tilt3DContainer, ShapeDivider, CursorEffect                     | 4     |
| Sections     | Testimonials, FAQ, Stats, BlogPreview                                    | 4     |
| Marketing    | AnnouncementBar, SocialProof, TrustBadges, LogoCloud, ComparisonTable    | 5     |
| Media        | BeforeAfter, Audio, Embed, AvatarGroup                                   | 4     |
| Content      | Progress, Alert                                                          | 2     |
| Experimental | CardFlip3D, TiltCard, GlassCard, ParticleBackground, ScrollAnimate       | 5     |
| **Total**    |                                                                          | **31** |

### By Health Status

| Status                 | Components                                                                | Count |
| ---------------------- | ------------------------------------------------------------------------- | ----- |
| ✅ Excellent (>90%)    | Tabs, BeforeAfter, Tilt3DContainer, ShapeDivider, CursorEffect, Testimonials, FAQ, Stats, Audio, Embed, AvatarGroup | 11    |
| ✅ Good (70–90%)       | Accordion, Carousel, Countdown, Animate, LogoCloud, AnnouncementBar, BlogPreview | 7     |
| ⚠️ Gaps (30–70%)       | Typewriter, Parallax, SocialProof, TrustBadges, ComparisonTable          | 5     |
| 🔴 Critical (<30%)    | Modal, Progress, Alert                                                   | 3     |
| 🧪 Experimental       | CardFlip3D, TiltCard, GlassCard, ParticleBackground, ScrollAnimate       | 5     |

---

*Document version: 1.1 — July 2026 (verified against live codebase)*
*Covers: 31 interactive components across 4 source files*
*Line numbers verified via grep against current codebase*
*Section 17 added: Critical guard rails for AI implementation agents*

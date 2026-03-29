# DRAMAC CMS — Section Components Master Plan

## Executive Vision

DRAMAC's section component library is the **backbone of every AI-generated page**. Each website is a sequence of sections — Hero at the top, content sections in the middle, CTA and Footer at the bottom. With **17 section-level components**, **800+ customisable props**, **75+ design variants**, and **150+ AI converter aliases**, DRAMAC already has one of the most comprehensive section libraries of any AI-powered CMS on the market.

Unlike Buttons (which needed critical hardcoded colour fixes) and Media (which needed major prop expansion), sections are **largely production-ready**. The opportunity here is not remediation — it's **elevation**. This plan focuses on cross-section consistency, missing section types, AI page-composition intelligence, section-transition effects, structured data enrichment, and industry-specific section selection — transforming a strong set of individual components into a **cohesive, intelligent page-composition system** that rivals Framer, Webflow, and Squarespace.

When sections work together as a system rather than isolated blocks, the AI Designer can generate entire multi-section pages that feel professionally designed — with consistent spacing, harmonious colour flow, intelligent ordering, and semantic HTML that search engines love.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Industry Benchmark Analysis](#2-industry-benchmark-analysis)
3. [Architecture Principles](#3-architecture-principles)
4. [Tier 1 — High-Impact Sections (Detailed Overhaul)](#4-tier-1--high-impact-sections-detailed-overhaul)
5. [Tier 2 — Content & Social Proof Sections](#5-tier-2--content--social-proof-sections)
6. [Tier 3 — Navigation & Utility Sections](#6-tier-3--navigation--utility-sections)
7. [Tier 4 — Interactive & Data Sections](#7-tier-4--interactive--data-sections)
8. [New Section Components](#8-new-section-components)
9. [Cross-Section Consistency Standards](#9-cross-section-consistency-standards)
10. [AI Page Composition Intelligence](#10-ai-page-composition-intelligence)
11. [Section Transition & Divider System](#11-section-transition--divider-system)
12. [Structured Data & SEO Integration](#12-structured-data--seo-integration)
13. [Dark Mode & Theming Strategy](#13-dark-mode--theming-strategy)
14. [Animation & Scroll Performance](#14-animation--scroll-performance)
15. [Registry & Converter Alignment](#15-registry--converter-alignment)
16. [Implementation Phases](#16-implementation-phases)
17. [Testing & Quality Gates](#17-testing--quality-gates)

---

## 1. Current State Audit

### All 17 Section Components

| # | Component | Location | Props | Variants | Quality | Key Strengths |
|---|-----------|----------|-------|----------|---------|---------------|
| 1 | **HeroRender** | `renders.tsx` L6837 | 22 | 5 (centered/split/fullscreen/minimal/video) | ✅ Strong | Video support, badge, dual buttons, image position, content alignment |
| 2 | **FeaturesRender** | `renders.tsx` L7243 | 70+ | 10 (cards/minimal/centered/icons-left/icons-top/alternating/bento/list/timeline/masonry) | ✅ Excellent | Most variant-rich section, 4 icon types, CTA built-in, decorator system |
| 3 | **CTARender** | `renders.tsx` L8132 | 80+ | 10 (centered/left/right/split/splitReverse/banner/floating/minimal/gradient/glass) | ✅ Excellent | Largest prop surface, trust badges, countdown timer, glass effects, 6 background patterns |
| 4 | **TestimonialsRender** | `renders.tsx` L9450 | 60+ | 10 (cards/minimal/quote/carousel/masonry/slider/grid/featured/bubble/timeline) | ✅ Strong | Carousel settings, rating system (4 styles), quote styling, company logos, video URLs |
| 5 | **FAQRender** | `renders.tsx` L10154 | 150+ | 10 (accordion/cards/two-column/minimal/tabs/timeline/bubble/modern/grid/floating) | ✅ Excellent | Most props of any section, Schema.org SEO, categories + search, helpful voting, contact CTA |
| 6 | **StatsRender** | `renders.tsx` L11269 | 80+ | 10 (simple/cards/bordered/icons/minimal/gradient/glass/outline/split/circular) | ✅ Excellent | Counter animation (3 easing types), trend indicators, divider styles, icon backgrounds |
| 7 | **TeamRender** | `renders.tsx` L12173 | 120+ | 10 (cards/minimal/detailed/grid/list/magazine/overlap/circular/modern/hover-reveal) | ✅ Excellent | Second-largest prop count, 7 social platforms, skills/location, department filtering, leadership highlighting |
| 8 | **GalleryRender** | `renders.tsx` L13356 | 90+ | 8 (grid/masonry/carousel/justified/spotlight/collage/pinterest/slider) | ✅ Strong | Lightbox, filtering, load-more/pagination, 9 hover effects, caption system |
| 9 | **NavbarRender** | `renders.tsx` L14272 | 28 | 3 (standard/centered/split) | ⚠️ Good | Sticky, transparent, blur, hide-on-scroll, dual CTAs, mobile menu with 3 animations |
| 10 | **FooterRender** | `renders.tsx` L14656 | 18 | 3 (simple/columns/centered) | ⚠️ Basic | Newsletter built-in, 6 social platforms, bottom links, copyright |
| 11 | **NewsletterRender** | `renders.tsx` L16480 | 14 | 3 (inline/stacked/card) | ⚠️ Basic | Dark-background-aware input styling, auto colour detection |
| 12 | **ContactFormRender** | `renders.tsx` L16139 | 25 | 1 | ⚠️ Limited | Honeypot spam protection, dark-aware styling, form submission with status states |
| 13 | **PricingRender** | `renders.tsx` L16965 | 16 | 3 (cards/comparison/simple) | ⚠️ Limited | Popular plan highlighting, feature lists (string + object formats), responsive columns |
| 14 | **AccordionRender** | `renders.tsx` L17194 | 17 | 4 (simple/bordered/separated/filled) | ⚠️ Decent | HTML `<details>` for native accessibility, markdown-to-HTML conversion, icon position |
| 15 | **CarouselRender** | `renders.tsx` L16683 | 12 | 1 | ⚠️ Basic | Arrow/dot navigation, overlay, aspect ratio options |
| 16 | **CountdownRender** | `renders.tsx` L16859 | 15 | 3 (simple/cards/circles) | ⚠️ Basic | Live countdown, customisable labels, size options |
| 17 | **FormRender** | `renders.tsx` L15225 | 40+ | 5 layouts (vertical/horizontal/inline/grid-2/grid-3) | ✅ Good | Submit/reset buttons, loading states, success/error feedback, dividers, animation |

### Quality Tier Summary

| Tier | Components | Total Props | Status |
|------|-----------|-------------|--------|
| **Tier A — Excellent** (70+ props, 10 variants, full animation/responsive) | Features, CTA, FAQ, Stats, Team | 500+ | Production-ready, minor defaults only |
| **Tier B — Strong** (20-90 props, 5-10 variants) | Hero, Testimonials, Gallery, Form | 220+ | Production-ready, some enhancement opportunities |
| **Tier C — Basic** (12-28 props, 1-4 variants) | Navbar, Footer, Newsletter, ContactForm, Pricing, Accordion, Carousel, Countdown | 145+ | Functional but underpowered compared to Tier A |

### Hardcoded Colour Defaults (7 Issues — All Non-Blocking)

| # | Component | Default | Value | Impact | Fix Priority |
|---|-----------|---------|-------|--------|-------------|
| 1 | Navbar | `backgroundColor` | `#ffffff` | Light-only default, overridable | Low — prop exists |
| 2 | Navbar | `textColor` | `#1f2937` | Dark text assumes light bg | Low — prop exists |
| 3 | Navbar | `borderColor` | `#e5e7eb` | Light-only border colour | Low — prop exists |
| 4 | Footer | `backgroundColor` | `#111827` | Dark default, overridable | Low — prop exists |
| 5 | Footer | `textColor` | `#ffffff` | White text assumes dark bg | Low — prop exists |
| 6 | Features | `badgeTextColor` | `#ffffff` | White badge text default | Low — prop exists |
| 7 | CTA | `textColor` | `#ffffff` | Contrast-aware default | Low — smart default |

> **Key Finding:** Unlike Buttons (hardcoded Tailwind classes) and Media (hardcoded colours without override props), every section default is **overridable via its corresponding prop**. The AI converter already sets these correctly per-site. The only improvement is changing defaults from hex values to CSS custom properties for automatic dark mode adaptation.

### Prop Pipeline Verification

```
converter.ts typeMap → core-components.ts fields → renders.tsx props
```

| Component | Converter Aliases | Registry Fields | Render Props | Alignment |
|-----------|------------------|-----------------|-------------|-----------|
| Hero | `HeroSection`, `Hero`, `HeroBanner` | 22+ fields | 22 props | ✅ Aligned |
| Features | `FeaturesSection`, `Features`, `KeyFeatures`, `Benefits`, `Services` | 70+ fields | 70+ props | ✅ Aligned |
| CTA | `CTABlock`, `CTASection`, `BookNow`, `Reservation` | 80+ fields | 80+ props | ✅ Aligned |
| Testimonials | `TestimonialsSection`, `Testimonials`, `Reviews` | 60+ fields | 60+ props | ✅ Aligned |
| FAQ | `FAQSection`, `FAQ`, `FrequentlyAskedQuestions` | 150+ fields | 150+ props | ✅ Aligned |
| Stats | `StatsSection`, `Stats`, `Numbers`, `Counters` | 80+ fields | 80+ props | ✅ Aligned |
| Team | `TeamSection`, `Team`, `OurTeam`, `Staff` | 120+ fields | 120+ props | ✅ Aligned |
| Gallery | `GallerySection`, `Gallery`, `Portfolio`, `ImageGrid` | 90+ fields | 90+ props | ✅ Aligned |
| Navbar | `Navbar`, `Navigation`, `Header` | 28 fields | 28 props | ✅ Aligned |
| Footer | `Footer`, `SiteFooter` | 18 fields | 18 props | ✅ Aligned |
| Newsletter | `Newsletter`, `NewsletterSection` | 14 fields | 14 props | ✅ Aligned |
| ContactForm | `ContactForm`, `ContactSection` | 25 fields | 25 props | ✅ Aligned |
| Pricing | `PricingSection`, `Pricing`, `Plans` | 16 fields | 16 props | ✅ Aligned |
| Accordion | `Accordion`, `AccordionSection` | 17 fields | 17 props | ✅ Aligned |
| Carousel | `Carousel`, `ImageCarousel` | 12 fields | 12 props | ✅ Aligned |
| Countdown | `Countdown`, `CountdownTimer` | 15 fields | 15 props | ✅ Aligned |
| Form | `Form`, `FormSection` | 40+ fields | 40+ props | ✅ Aligned |

---

## 2. Industry Benchmark Analysis

### How World-Class Platforms Handle Sections

| Feature | Framer | Webflow | Squarespace | Wix | DRAMAC Current | Gap |
|---------|--------|---------|-------------|-----|----------------|-----|
| Section types | ~25 | ~30 | ~20 | ~35 | 17 | ⚠️ Missing 8-10 types |
| Variants per section | 3-5 avg | 4-8 avg | 2-4 avg | 5-10 avg | 1-10 (avg 5.6) | ✅ Good for Tier A, weak for Tier C |
| Section transitions | Shape dividers, parallax | Wave/angle/curve dividers | Minimal | Strips, shape dividers | ❌ None | 🔴 Missing |
| Page composition rules | AI-suggested flow | DnD with templates | Template-locked | AI-suggested | ❌ No ordering intelligence | 🔴 Missing |
| Schema.org integration | Manual | Via plugins | Limited | Partial | FAQ only | ⚠️ Needs expansion |
| Section spacing system | Design tokens | Custom CSS | Fixed presets | Adjustable | Tailwind classes per-section | ⚠️ Inconsistent naming |
| Dark/light section alternation | Auto | Manual | Template-based | Auto | Manual via props | ⚠️ Could be automatic |
| Responsive preview | 3 breakpoints | Full responsive | 2 breakpoints | Full responsive | 3 breakpoints (mobile/tablet/desktop) | ✅ Good |

### Missing Section Types vs. Competitors

| Section Type | Framer | Webflow | Squarespace | Wix | DRAMAC | Priority |
|-------------|--------|---------|-------------|-----|--------|----------|
| **Logo Cloud / Client Bar** | ✅ | ✅ | ✅ | ✅ | ❌ | 🔴 High |
| **Blog / Article Preview** | ✅ | ✅ | ✅ | ✅ | ❌ | 🔴 High |
| **Banner / Announcement Bar** | ✅ | ✅ | ✅ | ✅ | ❌ | 🔴 High |
| **Comparison Table** | ✅ | ✅ | ❌ | ✅ | ❌ | ⚠️ Medium |
| **Timeline / History** | ✅ | ✅ | ❌ | ✅ | ❌ (variant in Features/FAQ) | ⚠️ Medium |
| **Process / How It Works** | ✅ | ✅ | ✅ | ✅ | ❌ (variant in Features) | ⚠️ Medium |
| **Map / Location** | ❌ | ✅ | ✅ | ✅ | ❌ | ⚠️ Medium |
| **Content / Rich Text** | ✅ | ✅ | ✅ | ✅ | ❌ | 🔴 High |
| **404 / Error Page** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Low |
| **Breadcrumb Section** | ❌ | ✅ | ❌ | ❌ | ❌ | ⚠️ Low |

---

## 3. Architecture Principles

### 3.1 Section Component Anatomy

Every section component MUST follow this standardised anatomy:

```
┌─────────────────────────────────────────────────────────┐
│ <section>  — Root container                              │
│   backgroundColor via inline style                       │
│   paddingY / paddingX via Tailwind classes               │
│   id / className / aria-label                            │
│                                                          │
│   ┌───────────────────────────────────────────────┐      │
│   │ Background Layer                               │      │
│   │   gradient / pattern / image / overlay          │      │
│   └───────────────────────────────────────────────┘      │
│                                                          │
│   ┌───────────────────────────────────────────────┐      │
│   │ Content Container (max-width + mx-auto)         │      │
│   │                                                  │      │
│   │   ┌─────────────────────────────────────┐       │      │
│   │   │ Section Header (Standard Pattern)     │       │      │
│   │   │   badge → subtitle → title → desc     │       │      │
│   │   └─────────────────────────────────────┘       │      │
│   │                                                  │      │
│   │   ┌─────────────────────────────────────┐       │      │
│   │   │ Section Body (Variant-specific)       │       │      │
│   │   │   grid/list/carousel/masonry/etc.     │       │      │
│   │   └─────────────────────────────────────┘       │      │
│   │                                                  │      │
│   │   ┌─────────────────────────────────────┐       │      │
│   │   │ Section CTA/Footer (Optional)         │       │      │
│   │   │   button / link / "View all" action   │       │      │
│   │   └─────────────────────────────────────┘       │      │
│   │                                                  │      │
│   └───────────────────────────────────────────────┘      │
│                                                          │
│   ┌───────────────────────────────────────────────┐      │
│   │ Decorative Layer                                │      │
│   │   dots / circles / blur / gradient overlays     │      │
│   └───────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Standard Section Header Props

Every section that displays a header MUST implement this exact prop interface:

```typescript
// Standard Header Props — identical naming across ALL section components
title?: string;
subtitle?: string;
description?: string;
badge?: string;
badgeIcon?: string;
headerAlign?: "left" | "center" | "right";
titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
titleColor?: string;
titleFont?: string;
subtitleColor?: string;
descriptionColor?: string;
badgeStyle?: "pill" | "outlined" | "solid" | "gradient";
badgeColor?: string;
badgeTextColor?: string;
```

**Current Compliance:**

| Component | Has Standard Header | Missing Props | Action |
|-----------|-------------------|---------------|--------|
| Features | ✅ Full | — | None |
| CTA | ⚠️ Partial | `titleFont`, `subtitleColor`, `badgeIcon` different | Align naming |
| FAQ | ✅ Full | — | None |
| Stats | ✅ Full | — | None |
| Team | ✅ Full | — | None |
| Gallery | ✅ Full | — | None |
| Testimonials | ⚠️ Partial | No `badge`, no `badgeIcon`, no `headerAlign`, no `titleFont` | Add missing |
| Hero | ⚠️ Different pattern | Different naming (badgeText vs badge) | Align with alias |
| Navbar | N/A — Navigation, not content | — | Skip |
| Footer | N/A — Structural | — | Skip |
| Newsletter | ⚠️ Minimal | No badge, no headerAlign, no titleSize/Color | Add missing |
| ContactForm | ⚠️ Minimal | No badge, no headerAlign, no titleSize | Add missing |
| Pricing | ⚠️ Minimal | No badge, no headerAlign, no titleFont | Add missing |
| Accordion | ⚠️ Partial | No badge, different naming | Add missing |
| Carousel | ❌ None | No header at all | Add header |
| Countdown | ⚠️ Minimal | No badge, no headerAlign | Add missing |
| Form | ⚠️ Partial | No badge, different naming | Align |

### 3.3 Standard Section Sizing Props

```typescript
// Standard Sizing Props — identical across ALL section components
paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
paddingX?: "none" | "sm" | "md" | "lg" | "xl";
maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
```

**Padding Value Mapping (standardised):**

```typescript
const paddingYClasses = {
  none: "",
  sm: "py-8 md:py-12",
  md: "py-12 md:py-16",
  lg: "py-16 md:py-24",
  xl: "py-20 md:py-32",
  "2xl": "py-24 md:py-40",
};

const paddingXClasses = {
  none: "",
  sm: "px-4",
  md: "px-4 md:px-6",
  lg: "px-4 md:px-8",
  xl: "px-4 md:px-12",
};
```

### 3.4 Standard Background Props

```typescript
// Standard Background Props — identical across ALL section components
backgroundColor?: string;
backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
backgroundGradientFrom?: string;
backgroundGradientTo?: string;
backgroundGradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl" | "to-tr" | "to-tl";
backgroundPattern?: "dots" | "grid" | "lines" | "waves";
backgroundPatternOpacity?: number;
backgroundImage?: string | ImageValue;
backgroundOverlay?: boolean;
backgroundOverlayColor?: string;
backgroundOverlayOpacity?: number;
```

**Current Compliance:**

| Component | Has Standard Background | Missing | Action |
|-----------|------------------------|---------|--------|
| Features | ✅ Full | — | None |
| CTA | ⚠️ Different naming | Uses separate props not grouped under `backgroundStyle` | Alias |
| FAQ | ✅ Full | — | None |
| Stats | ✅ Full | — | None |
| Team | ✅ Full | — | None |
| Gallery | ✅ Full | — | None |
| Testimonials | ⚠️ Slightly different | Uses `backgroundGradient` boolean instead of `backgroundStyle` | Migrate |
| Hero | ⚠️ Simple | Only `backgroundColor` | Add full background system |
| Navbar | ⚠️ Simple | Only `backgroundColor` | Keep simple (intentional) |
| Footer | ⚠️ Simple | Only `backgroundColor` | Add gradient option |
| Newsletter | ⚠️ Simple | Only `backgroundColor` | Add gradient option |
| ContactForm | ⚠️ Simple | Only `backgroundColor` | Keep simple (intentional) |
| Pricing | ⚠️ Simple | Only `backgroundColor` | Add background system |
| Accordion | ⚠️ Simple | Only `backgroundColor` | Add background system |
| Carousel | ❌ None | No background props | Add section wrapper |
| Countdown | ⚠️ Simple | Only `backgroundColor` | Add background system |
| Form | ⚠️ Simple | Only `backgroundColor` | Keep simple (form container) |

### 3.5 Standard Animation Props

```typescript
// Standard Animation Props — identical across ALL section components
animateOnScroll?: boolean;
animationType?: "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "stagger";
animationDelay?: number;
staggerDelay?: number;
```

### 3.6 Standard Responsive Props

```typescript
// Each section defines its own mobile-specific overrides
mobileColumns?: number;
compactOnMobile?: boolean;
hideDescriptionOnMobile?: boolean;
```

---

## 4. Tier 1 — High-Impact Sections (Detailed Overhaul)

### 4.1 HeroRender — The First Impression

**Current State:** 22 props, 5 variants — the simplest of the major sections, yet the most important for first impressions.

**Interface (from source):**
```typescript
export interface HeroProps {
  variant?: "centered" | "split" | "fullscreen" | "minimal" | "video";
  title?: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  primaryButtonColor?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  image?: string | ImageValue;
  imagePosition?: "left" | "right";
  videoSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  paddingY?: "sm" | "md" | "lg" | "xl";
  minHeight?: "auto" | "screen" | "half";
  contentAlign?: "left" | "center" | "right";
  id?: string;
  className?: string;
  _breakpoint?: "mobile" | "tablet" | "desktop";
  _isEditor?: boolean;
}
```

**Enhancement Opportunities:**

| Enhancement | Current | Target | Priority |
|------------|---------|--------|----------|
| Background system | `backgroundColor` only | Full gradient/pattern/image/overlay system | 🔴 High |
| Animation | None | `animateOnScroll`, title typewriter, counter, fade reveal | 🔴 High |
| Additional variants | 5 | 8 (add `gradient`, `glass`, `parallax`) | ⚠️ Medium |
| Standard header props | Partial (`badgeText` not `badge`) | Align to standard naming | ⚠️ Medium |
| Decorative elements | None | Dot/circle/blur decorators (same as other sections) | ⚠️ Medium |
| Trust badges | None | Logo bar below hero (common pattern) | ⚠️ Medium |
| `paddingY` values | Missing `none` and `2xl` | Add `none` and `2xl` to match standard | Low |
| Typed text effect | None | Rotating words in title (e.g., "Build _websites_ / _apps_ / _brands_") | ⚠️ Medium |

**Proposed Enhanced Interface Additions:**
```typescript
// ADD to HeroProps
// Background system (standard)
backgroundStyle?: "solid" | "gradient" | "pattern" | "image";
backgroundGradientFrom?: string;
backgroundGradientTo?: string;
backgroundGradientDirection?: "to-r" | "to-l" | "to-b" | "to-t" | "to-br" | "to-bl";
backgroundPattern?: "dots" | "grid" | "diagonal" | "waves";
backgroundImage?: string | ImageValue;
backgroundOverlay?: boolean;
backgroundOverlayColor?: string;
backgroundOverlayOpacity?: number;

// Animation
animateOnScroll?: boolean;
animationType?: "fade" | "slide-up" | "zoom" | "typewriter";
titleAnimation?: "none" | "typewriter" | "fade-words" | "slide-up";

// Decorative
showDecorator?: boolean;
decoratorType?: "dots" | "circles" | "blur" | "gradient-blur";
decoratorColor?: string;

// Trust / Logo bar
showTrustBar?: boolean;
trustBarTitle?: string;
trustBarLogos?: Array<{ image: string | ImageValue; alt?: string }>;
```

### 4.2 FeaturesRender — The Versatility Champion

**Current State:** 70+ props, 10 variants — the most versatile section component, already near world-class.

**Key Strengths (keep as-is):**
- 10 layout variants including `bento` and `masonry`
- 4 icon types (emoji/icon/image/number) with shape/size/position/background
- Card hover effects (lift/scale/glow/border)
- Built-in CTA section
- Decorative dot/circle/blur system
- Full responsive controls (mobileColumns/stackOnMobile/compactOnMobile)
- Animation with stagger support

**Enhancement Opportunities:**

| Enhancement | Priority |
|------------|----------|
| Feature item links (each feature as a clickable card) | ⚠️ Medium |
| Feature item badges (e.g., "New", "Popular", "Beta") | ⚠️ Medium |
| Feature comparison mode (side-by-side before/after) | Low |
| Feature item expandable descriptions (click to read more) | Low |

### 4.3 CTARender — The Conversion Engine

**Current State:** 80+ props, 10 variants — the most prop-rich section after FAQ.

**Key Strengths (keep as-is):**
- 10 layout variants including `glass` and `floating`
- Primary button with 17 props (colour, gradient, icon, shadow, hover effects, animation)
- 6 background patterns (dots/grid/diagonal/waves/circuit)
- Trust badge array
- Countdown timer integration
- Glass effect support

**Enhancement Opportunities:**

| Enhancement | Priority |
|------------|----------|
| Compose `ButtonRender` instead of duplicating button logic | ⚠️ Medium (see Buttons Master Plan) |
| Exit-intent variant (shown when user moves to leave) | Low |
| A/B test variant toggle (show variant A or B based on config) | Low |
| Urgency indicators (limited stock, expiring offer) | ⚠️ Medium |

---

## 5. Tier 2 — Content & Social Proof Sections

### 5.1 TestimonialsRender

**Current State:** 60+ props, 10 variants — comprehensive social proof.

**Key Strengths:**
- 10 layout variants (cards, carousel, masonry, bubble, timeline, featured)
- Full avatar system (size/shape/border/position)
- Rating system with 4 styles (stars/hearts/numeric/thumbs)
- Quote icon customisation (3 positions)
- Company logo integration
- Carousel settings (autoplay, arrows, dots, infinite loop)
- Featured testimonial scaling

**Enhancement Opportunities:**

| Enhancement | Current | Target | Priority |
|------------|---------|--------|----------|
| Standard header props | Missing `badge`, `badgeIcon`, `headerAlign`, `titleFont` | Add full standard header | ⚠️ Medium |
| Video testimonials | `videoUrl` in data but no player | Embed video player for video testimonials | ⚠️ Medium |
| Schema.org Review markup | None | `Review`, `AggregateRating` structured data | ⚠️ Medium |
| Source platform badges | None | "Google Review", "Trustpilot", "Yelp" source indicators | Low |

### 5.2 FAQRender — The Prop King

**Current State:** 150+ props, 10 variants — the most feature-rich section in the entire system.

**Key Strengths:**
- Schema.org SEO support (FAQPage / HowTo / QAPage)
- Category filtering with 4 styles (pills/buttons/underline/minimal)
- Search functionality
- Popular/featured highlighting
- Helpful voting (yes/no)
- Contact CTA section
- Numbering system

**Assessment:** This component is **feature-complete**. No significant enhancements needed. The only improvements are:

| Enhancement | Priority |
|------------|----------|
| Ensure Schema.org output is valid (test with Google Rich Results) | Low (validation) |
| Add `enableSearch` as default true when items > 10 | Low (UX polish) |

### 5.3 StatsRender

**Current State:** 80+ props, 10 variants — strong counter/metrics section.

**Key Strengths:**
- Counter animation with 3 easing types (linear/easeOut/easeInOut)
- Trend indicators (up/down/neutral)
- Divider styles (solid/dashed/dotted/gradient)
- Highlighted card backgrounds

**Enhancement Opportunities:**

| Enhancement | Priority |
|------------|----------|
| Animated number counting actually implemented (currently props exist but animation may need Framer Motion) | ⚠️ Medium |
| Progress bar variant (percentage-based stats) | Low |
| Comparison mode (this year vs last year) | Low |

### 5.4 TeamRender — The People Showcase

**Current State:** 120+ props, 10 variants — comprehensive team section.

**Key Strengths:**
- 7 social platforms (LinkedIn, Twitter, Instagram, GitHub, Website, Email, Phone)
- Skills display (tags/pills/list)
- Department filtering (pills/dropdown/tabs)
- Leadership highlighting with scale effect
- Bio display with line clamping
- Image grayscale with hover reveal
- Location display

**Assessment:** Near-complete. Only minor gaps:

| Enhancement | Priority |
|------------|----------|
| Add TikTok, YouTube social platforms | Low |
| Team member detail modal (click to expand) | Low |

---

## 6. Tier 3 — Navigation & Utility Sections

### 6.1 NavbarRender

**Current State:** 28 props, 3 variants — functional navigation.

**Key Strengths:**
- Sticky + transparent + blur background combination
- Hide on scroll behaviour
- Dual CTA buttons (primary + secondary)
- Mobile menu with 3 positions (left/right/full) and 3 animations (slide/fade/scale)
- Logo image or text fallback

**Enhancement Opportunities:**

| Enhancement | Current | Target | Priority |
|------------|---------|--------|----------|
| Mega menu / dropdown support | No dropdowns | Dropdown sub-menus with optional mega menu | 🔴 High |
| Active link highlighting | None | Current page indicator | ⚠️ Medium |
| Search integration | None | Optional search icon/bar | ⚠️ Medium |
| Dark mode toggle | None | Optional dark/light mode switch | Low |
| Notification badge on CTA | None | Badge count on CTA button | Low |
| Additional variants | 3 | 5 (add `minimal`, `sidebar`) | ⚠️ Medium |

### 6.2 FooterRender

**Current State:** 18 props, 3 variants — the most basic Tier A-eligible section.

**Key Strengths:**
- Column-based link groups
- 6 social platforms
- Built-in newsletter
- Copyright with auto-year

**Enhancement Opportunities:**

| Enhancement | Current | Target | Priority |
|------------|---------|--------|----------|
| Standard sizing props | Only `paddingY` (3 values) | Full paddingY/paddingX with standard values | ⚠️ Medium |
| Background system | `backgroundColor` only | Add gradient support | ⚠️ Medium |
| Contact info section | None | Phone, email, address | ⚠️ Medium |
| Payment badges | None | Visa/MC/Amex/PayPal icons | Low |
| App store links | None | iOS/Android download buttons | Low |
| Additional variants | 3 | 5 (add `minimal`, `modern`) | ⚠️ Medium |
| Back-to-top button | None | Optional floating scroll-to-top | Low |

### 6.3 NewsletterRender

**Current State:** 14 props, 3 variants — minimal but functional.

**Enhancement Opportunities:**

| Enhancement | Priority |
|------------|----------|
| Standard header props (badge, headerAlign, titleSize) | ⚠️ Medium |
| Standard sizing props (paddingY with full range) | ⚠️ Medium |
| Background system (gradient/pattern) | ⚠️ Medium |
| Privacy notice text (GDPR compliance) | ⚠️ Medium |
| Success state animation | Low |
| Double opt-in indicator text | Low |

### 6.4 ContactFormRender

**Current State:** 25 props, 1 variant — functional form.

**Key Strengths:**
- Honeypot spam protection
- Dark-aware input styling (auto-detects bg darkness)
- Form submission with status states (idle/submitting/success/error)

**Enhancement Opportunities:**

| Enhancement | Current | Target | Priority |
|------------|---------|--------|----------|
| Variants | 1 | 3 (card/side-by-side/minimal) | ⚠️ Medium |
| Standard header props | Partial | Full standard header with badge, titleSize | ⚠️ Medium |
| Additional fields | Name, email, phone, subject, message | Add company, select dropdown, file upload | ⚠️ Medium |
| Map integration | None | Optional map alongside form | Low |
| reCAPTCHA/Turnstile | Honeypot only | Add Cloudflare Turnstile option | ⚠️ Medium |

---

## 7. Tier 4 — Interactive & Data Sections

### 7.1 PricingRender

**Current State:** 16 props, 3 variants — functional but basic compared to Tier A sections.

**Enhancement Opportunities:**

| Enhancement | Current | Target | Priority |
|------------|---------|--------|----------|
| Standard header props | Partial (title/subtitle/description only) | Full standard header with badge, headerAlign | ⚠️ Medium |
| Standard background system | `backgroundColor` only | Full gradient/pattern system | ⚠️ Medium |
| Toggle (monthly/annual) | None | Price period toggle with savings display | 🔴 High |
| Feature comparison table | `comparison` variant exists but basic | Full feature matrix with checkmarks/crosses | ⚠️ Medium |
| Currency formatting | Plain text | Locale-aware currency display | Low |
| Animation | None | Standard animateOnScroll/stagger | ⚠️ Medium |
| Card hover effects | Basic shadow only | Standard cardHoverEffect system | Low |
| Enterprise/custom plan CTA | None | "Contact Sales" option for enterprise tier | ⚠️ Medium |

### 7.2 AccordionRender

**Current State:** 17 props, 4 variants — decent standalone accordion.

**Distinction from FAQ:** Accordion is a generic expandable content container. FAQ is a specialised section with search, categories, voting, schema.org, and contact CTA. Both use accordion-style UI but serve different purposes.

**Enhancement Opportunities:**

| Enhancement | Priority |
|------------|----------|
| Standard header props (badge, headerAlign, titleSize, titleFont) | ⚠️ Medium |
| Standard background system | ⚠️ Medium |
| Standard animation props | ⚠️ Medium |
| Nested accordions (sub-items) | Low |
| Side-by-side icon/image + content layout | Low |

### 7.3 CarouselRender

**Current State:** 12 props, 1 variant — the most basic section in the system.

> **Note:** This component is also covered in the **Media Components Master Plan** which proposes expanding it from 12 → 45+ props. The Media plan takes priority for Carousel implementation details. This section covers the section-level wrapper concerns only.

**Section-Level Needs:**
- Wrap in standard `<section>` container with header, padding, background
- Currently renders as a bare `<div>` — no section structure
- Add standard header props (title, subtitle, badge)
- Add standard sizing props (paddingY, paddingX)
- Add background system

### 7.4 CountdownRender

**Current State:** 15 props, 3 variants — event timer section.

**Enhancement Opportunities:**

| Enhancement | Priority |
|------------|----------|
| Standard header props (badge, headerAlign, badgeStyle) | ⚠️ Medium |
| Standard background system | ⚠️ Medium |
| Expiry action (show different content when countdown ends) | ⚠️ Medium |
| CTA button (below countdown) | ⚠️ Medium |
| Animated digit transitions (flip animation) | Low |

### 7.5 FormRender

**Current State:** 40+ props, 5 layouts — form container.

**Key Strengths:**
- 5 layout modes (vertical/horizontal/inline/grid-2/grid-3)
- Submit + reset buttons with full styling
- Loading + disabled states
- Success/error feedback with icons
- Divider support

**Assessment:** FormRender is a **container component** that wraps child form fields. It's well-designed for its purpose. Enhancement should focus on the child field components (input, select, textarea, etc.) rather than the container. This falls under a future "Forms & Inputs Master Plan".

---

## 8. New Section Components

### 8.1 LogoCloudRender (Priority: 🔴 High)

**Purpose:** Display client/partner/press logos in a horizontal scrolling or grid layout. This is one of the most common trust-building sections on B2B and SaaS websites.

**Proposed Interface:**
```typescript
export interface LogoCloudProps {
  // Standard Header
  title?: string;
  subtitle?: string;
  badge?: string;
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl";
  titleColor?: string;
  subtitleColor?: string;
  badgeStyle?: "pill" | "outlined" | "solid" | "gradient";
  badgeColor?: string;

  // Logos
  logos?: Array<{
    image: string | ImageValue;
    alt?: string;
    link?: string;
  }>;

  // Layout
  variant?: "grid" | "scroll" | "marquee" | "stacked" | "minimal";
  columns?: 3 | 4 | 5 | 6 | 8;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "full";
  gap?: "sm" | "md" | "lg" | "xl";
  logoMaxHeight?: number;

  // Styling
  grayscale?: boolean;
  grayscaleHover?: boolean;
  opacity?: number;
  hoverOpacity?: number;
  alignment?: "left" | "center" | "right";

  // Marquee Settings (for scroll/marquee variants)
  scrollSpeed?: "slow" | "normal" | "fast";
  scrollDirection?: "left" | "right";
  pauseOnHover?: boolean;

  // Standard Section
  backgroundColor?: string;
  backgroundStyle?: "solid" | "gradient";
  backgroundGradientFrom?: string;
  backgroundGradientTo?: string;
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";

  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "stagger";
  staggerDelay?: number;

  id?: string;
  className?: string;
}
```

**Estimated Props:** ~35  
**Estimated Variants:** 5  
**Converter Aliases:** `LogoCloud`, `ClientLogos`, `TrustedBy`, `Partners`, `AsSeenIn`, `PressLogos`

### 8.2 BannerRender (Priority: 🔴 High)

**Purpose:** Top-of-page announcement bar for promotions, alerts, or important notices. Sticky, dismissible, with optional CTA.

**Proposed Interface:**
```typescript
export interface BannerProps {
  // Content
  text?: string;
  linkText?: string;
  linkUrl?: string;
  icon?: string;

  // Style
  variant?: "info" | "success" | "warning" | "error" | "promo" | "custom";
  size?: "sm" | "md" | "lg";
  position?: "top" | "bottom" | "inline";
  sticky?: boolean;
  dismissible?: boolean;
  dismissDuration?: number; // hours before showing again

  // Colours
  backgroundColor?: string;
  textColor?: string;
  linkColor?: string;
  iconColor?: string;

  // Animation
  animateIn?: "slide-down" | "fade" | "none";
  animateOut?: "slide-up" | "fade" | "none";

  // Behaviour
  autoHide?: boolean;
  autoHideDelay?: number;
  showOnPages?: string[]; // URL patterns

  id?: string;
  className?: string;
}
```

**Estimated Props:** ~25  
**Estimated Variants:** 6  
**Converter Aliases:** `Banner`, `AnnouncementBar`, `TopBar`, `PromoBanner`, `AlertBar`

### 8.3 ContentRender (Priority: 🔴 High)

**Purpose:** Generic rich-text content section for long-form content, about pages, policy pages, and blog content. This is the most versatile missing section — every website needs at least one content block.

**Proposed Interface:**
```typescript
export interface ContentProps {
  // Standard Header
  title?: string;
  subtitle?: string;
  badge?: string;
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  titleColor?: string;
  subtitleColor?: string;

  // Content
  content?: string; // Markdown or HTML
  contentAlign?: "left" | "center" | "right" | "justify";
  contentSize?: "sm" | "md" | "lg";
  contentColor?: string;
  contentMaxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";

  // Media
  image?: string | ImageValue;
  imagePosition?: "left" | "right" | "top" | "bottom" | "background";
  imageWidth?: "sm" | "md" | "lg" | "half";
  imageRadius?: "none" | "sm" | "md" | "lg" | "xl";
  imageShadow?: "none" | "sm" | "md" | "lg";

  // Layout
  variant?: "simple" | "two-column" | "image-left" | "image-right" | "card" | "feature";
  columns?: 1 | 2;

  // CTA
  showCta?: boolean;
  ctaText?: string;
  ctaLink?: string;
  ctaStyle?: "primary" | "secondary" | "outline" | "link";

  // Standard Section
  backgroundColor?: string;
  backgroundStyle?: "solid" | "gradient" | "pattern";
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "slide-left" | "slide-right";

  id?: string;
  className?: string;
}
```

**Estimated Props:** ~40  
**Estimated Variants:** 6  
**Converter Aliases:** `Content`, `RichText`, `TextBlock`, `AboutSection`, `ContentSection`, `TextSection`

### 8.4 BlogPreviewRender (Priority: 🔴 High)

**Purpose:** Display recent blog posts / articles in grid or list format as a section. Common on homepages and landing pages.

**Proposed Interface:**
```typescript
export interface BlogPreviewProps {
  // Standard Header
  title?: string;
  subtitle?: string;
  badge?: string;
  headerAlign?: "left" | "center" | "right";
  titleSize?: "sm" | "md" | "lg" | "xl";
  titleColor?: string;
  subtitleColor?: string;

  // Posts
  posts?: Array<{
    title?: string;
    excerpt?: string;
    image?: string | ImageValue;
    date?: string;
    author?: string;
    authorImage?: string | ImageValue;
    category?: string;
    readTime?: string;
    link?: string;
  }>;

  // Layout
  variant?: "grid" | "list" | "featured" | "magazine" | "minimal" | "cards";
  columns?: 2 | 3 | 4;
  maxWidth?: "lg" | "xl" | "2xl" | "full";

  // Card Styling
  cardBackgroundColor?: string;
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  cardShadow?: "none" | "sm" | "md" | "lg";
  cardHoverEffect?: "none" | "lift" | "scale" | "shadow";
  showImage?: boolean;
  imageAspectRatio?: "video" | "square" | "wide" | "portrait";

  // Content Display
  showExcerpt?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  showCategory?: boolean;
  showReadTime?: boolean;
  excerptLines?: 2 | 3 | 4;

  // CTA
  showViewAll?: boolean;
  viewAllText?: string;
  viewAllLink?: string;

  // Standard Section
  backgroundColor?: string;
  backgroundStyle?: "solid" | "gradient";
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  paddingX?: "none" | "sm" | "md" | "lg" | "xl";

  // Animation
  animateOnScroll?: boolean;
  animationType?: "fade" | "slide-up" | "stagger";
  staggerDelay?: number;

  textColor?: string;
  accentColor?: string;
  id?: string;
  className?: string;
}
```

**Estimated Props:** ~50  
**Estimated Variants:** 6  
**Converter Aliases:** `BlogPreview`, `Blog`, `LatestPosts`, `RecentArticles`, `News`, `BlogSection`

### 8.5 ComparisonTableRender (Priority: ⚠️ Medium)

**Purpose:** Side-by-side feature comparison table for pricing, products, or services.

**Proposed Interface (abbreviated):**
```typescript
export interface ComparisonTableProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  headerAlign?: "left" | "center" | "right";

  columns?: Array<{
    name?: string;
    price?: string;
    description?: string;
    highlighted?: boolean;
    buttonText?: string;
    buttonLink?: string;
  }>;
  features?: Array<{
    category?: string;
    name?: string;
    values?: Array<boolean | string>;
    tooltip?: string;
  }>;

  variant?: "standard" | "compact" | "cards";
  stickyHeader?: boolean;
  highlightDifferences?: boolean;

  backgroundColor?: string;
  cardBackgroundColor?: string;
  highlightColor?: string;
  textColor?: string;
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";

  animateOnScroll?: boolean;
  id?: string;
  className?: string;
}
```

**Estimated Props:** ~30  
**Estimated Variants:** 3  
**Converter Aliases:** `ComparisonTable`, `FeatureComparison`, `PlanComparison`, `ProductComparison`

### 8.6 MapRender (Priority: ⚠️ Medium)

**Purpose:** Embedded map section for location-based businesses (restaurants, shops, offices).

**Proposed Interface (abbreviated):**
```typescript
export interface MapProps {
  title?: string;
  subtitle?: string;
  badge?: string;

  // Map
  embedUrl?: string; // Google Maps embed URL
  latitude?: number;
  longitude?: number;
  zoom?: number;
  mapStyle?: "standard" | "silver" | "dark" | "satellite";
  height?: "sm" | "md" | "lg" | "xl";

  // Marker
  markerTitle?: string;
  markerDescription?: string;

  // Layout
  variant?: "full-width" | "card" | "split" | "with-info";

  // Contact Info (for split variant)
  address?: string;
  phone?: string;
  email?: string;
  hours?: Array<{ day?: string; time?: string }>;

  // Standard Section
  backgroundColor?: string;
  paddingY?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";

  id?: string;
  className?: string;
}
```

**Estimated Props:** ~30  
**Estimated Variants:** 4  
**Converter Aliases:** `Map`, `Location`, `FindUs`, `MapSection`, `Directions`

### 8.7 Additional Future Sections (Lower Priority)

| Section | Purpose | Est. Props | Priority |
|---------|---------|-----------|----------|
| **ProcessRender** | Step-by-step process (currently Features timeline variant) | ~30 | Low (variant exists) |
| **TimelineRender** | History/milestones (currently FAQ timeline variant) | ~30 | Low (variant exists) |
| **ErrorPageRender** | 404/500 error pages | ~15 | Low |
| **BreadcrumbRender** | Page breadcrumb navigation | ~10 | Low |
| **DividerSectionRender** | Decorative divider between sections | ~15 | Low |
| **VideoSectionRender** | Full-width video background/embed | ~25 | ⚠️ Medium |

---

## 9. Cross-Section Consistency Standards

### 9.1 Prop Naming Conventions

All section components MUST follow these naming rules:

| Category | Pattern | Example | Anti-Pattern |
|----------|---------|---------|--------------|
| Colours | `[element]Color` | `titleColor`, `cardBackgroundColor` | `titleCol`, `bgColor` |
| Sizes | `[element]Size` with `"sm" \| "md" \| "lg"` | `titleSize`, `iconSize` | `titleScale`, `iconDim` |
| Toggles | `show[Feature]` | `showAvatar`, `showBio` | `hasAvatar`, `bioVisible` |
| Positions | `[element]Position` | `iconPosition`, `captionPosition` | `iconPlace`, `captionAt` |
| Hover | `[element]HoverEffect` / `[element]HoverColor` | `cardHoverEffect`, `cardHoverShadow` | `hoverCard`, `cardOnHover` |
| Spacing | `paddingY` / `paddingX` / `gap` / `sectionGap` | `paddingY="lg"` | `verticalPadding`, `yPad` |
| Borders | `[element]Border` (boolean), `[element]BorderColor`, `[element]BorderRadius` | `cardBorder`, `cardBorderColor` | `hasBorder`, `borderStyle` |

### 9.2 Value Union Standardisation

All sizing/spacing values MUST use these exact unions:

```typescript
// Padding Y (vertical)
type PaddingY = "none" | "sm" | "md" | "lg" | "xl" | "2xl";

// Padding X (horizontal)  
type PaddingX = "none" | "sm" | "md" | "lg" | "xl";

// Max Width
type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

// Gap
type Gap = "sm" | "md" | "lg" | "xl";

// Shadow
type Shadow = "none" | "sm" | "md" | "lg" | "xl" | "2xl";

// Border Radius
type BorderRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

// Title Size
type TitleSize = "sm" | "md" | "lg" | "xl" | "2xl";
```

### 9.3 Tailwind Class Mapping (Canonical Values)

Every section MUST use the exact same Tailwind mappings:

```typescript
// paddingY — CANONICAL (copy this into every section)
const paddingYClasses: Record<string, string> = {
  none: "",
  sm: "py-8 md:py-12",
  md: "py-12 md:py-16",
  lg: "py-16 md:py-24",
  xl: "py-20 md:py-32",
  "2xl": "py-24 md:py-40",
};

// paddingX — CANONICAL
const paddingXClasses: Record<string, string> = {
  none: "",
  sm: "px-4",
  md: "px-4 md:px-6",
  lg: "px-4 md:px-8",
  xl: "px-4 md:px-12",
};

// maxWidth — CANONICAL
const maxWidthClasses: Record<string, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};
```

### 9.4 Current Inconsistencies to Resolve

| Component | Issue | Current | Standard | Priority |
|-----------|-------|---------|----------|----------|
| Hero | `paddingY` missing `none` and `2xl` | `"sm" \| "md" \| "lg" \| "xl"` | `"none" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl"` | Low |
| Hero | `badgeText` instead of `badge` | `badgeText` | `badge` (add alias) | ⚠️ Medium |
| Testimonials | `backgroundColor` is flat prop | Direct prop | `backgroundStyle` system | ⚠️ Medium |
| Testimonials | Header uses different naming | `titleSize`/`titleColor` ✅ but no `badge`/`headerAlign` | Standard header | ⚠️ Medium |
| Footer | `paddingY` only 3 values | `"sm" \| "md" \| "lg"` | Standard 6 values | Low |
| Pricing | `paddingY` only 4 values | `"sm" \| "md" \| "lg" \| "xl"` | Standard 6 values | Low |
| Carousel | No section wrapper | Bare `<div>` | Standard `<section>` wrapper | ⚠️ Medium |
| Newsletter | `size` prop covers everything | `size="sm" \| "md" \| "lg"` | Standard individual props | Low |

---

## 10. AI Page Composition Intelligence

### 10.1 Section Ordering Rules

When the AI Designer generates a multi-section page, it MUST follow these composition rules:

```
POSITION RULES:
1. Navbar  → ALWAYS position 0 (first)
2. Banner  → Position 1 (if present, immediately after Navbar)
3. Hero    → Position 2 (always first content section)
4. LogoCloud → Position 3 (trust signal, immediately after Hero)
5. Features/Content → Positions 4-6 (primary content)
6. Testimonials/Stats → Positions 5-8 (social proof)
7. Pricing → Position 7-9 (conversion-adjacent)
8. FAQ → Near bottom (address remaining objections)
9. CTA → Second-to-last (final conversion push)
10. Newsletter → Last content section (catch leads)
11. Footer → ALWAYS last

PROHIBITED SEQUENCES:
- CTA immediately after CTA (fatigue)
- Two Pricing sections (confusion)
- Hero after any other content section
- Footer before any content section
- Stats before Hero (no context)

RECOMMENDED SEQUENCES:
- Hero → LogoCloud → Features (trust then value)
- Features → Testimonials → CTA (value → proof → convert)
- Pricing → FAQ → CTA (price → answer objections → convert)
- Team → Gallery → ContactForm (people → work → reach out)
```

### 10.2 Industry-Specific Section Selection

```
SaaS / Tech:
  Navbar → Hero → LogoCloud → Features → Stats → Pricing → Testimonials → FAQ → CTA → Footer

Restaurant / F&B:
  Navbar → Hero → Gallery → Features(Menu) → Testimonials → Map → ContactForm → Footer

Professional Services (Law/Accounting/Consulting):
  Navbar → Hero → Stats → Features → Team → Testimonials → FAQ → CTA → ContactForm → Footer

E-Commerce:
  Navbar → Hero → Features(Categories) → Gallery(Products) → Testimonials → CTA → Newsletter → Footer

Portfolio / Creative:
  Navbar → Hero → Gallery → Features(Services) → Testimonials → Team → CTA → ContactForm → Footer

Real Estate:
  Navbar → Hero → Stats → Gallery → Features → Testimonials → Map → ContactForm → Footer

Education:
  Navbar → Hero → Stats → Features(Courses) → Team → Testimonials → Pricing → FAQ → CTA → Footer

Healthcare:
  Navbar → Hero → Features(Services) → Team → Stats → Testimonials → FAQ → ContactForm → Map → Footer

Events:
  Navbar → Banner → Hero → Countdown → Features → Gallery → Pricing → FAQ → CTA → Footer
```

### 10.3 Section Colour Flow

The AI designer should generate section colours that create visual rhythm:

```
COLOUR ALTERNATION PATTERNS:

Pattern A — Light/Dark Alternation:
  Hero(dark) → Features(light) → Testimonials(dark) → Pricing(light) → CTA(accent)

Pattern B — Subtle Drift:
  Hero(brand) → Content(white) → Features(gray-50) → Testimonials(white) → CTA(brand)

Pattern C — Consistent Light with Accent Pop:
  Hero(brand) → Everything(white/gray-50) → CTA(accent/brand)

RULES:
- Never 3+ consecutive sections with same background colour
- Hero and CTA should use brand/accent colours
- Content-heavy sections (FAQ, Features) should use light backgrounds for readability
- Dark sections create visual "breaks" — use sparingly (1-2 per page)
- Gradient sections add sophistication — maximum 1 per page
```

### 10.4 Section Spacing Harmony

```
DEFAULT SPACING GUIDE:

Hero:           paddingY="xl" (generous — it's the first impression)
LogoCloud:      paddingY="sm" (compact — trust signal, not content)
Features:       paddingY="lg" (standard content section)
Stats:          paddingY="md" (compact — numbers speak fast)
Testimonials:   paddingY="lg" (standard content section)
Pricing:        paddingY="lg" (needs room for cards)
FAQ:            paddingY="lg" (needs room for accordion items)
CTA:            paddingY="lg" (standard — not too aggressive)
Newsletter:     paddingY="md" (compact — single input)
ContactForm:    paddingY="lg" (needs room for fields)
Footer:         paddingY="lg" (standard structural section)
```

---

## 11. Section Transition & Divider System

### 11.1 Shape Dividers

A new shared utility component that renders SVG dividers between sections:

```typescript
export interface SectionDividerProps {
  shape?: "wave" | "curve" | "angle" | "triangle" | "zigzag" | "arrow" | "cloud" | "none";
  position?: "top" | "bottom";
  color?: string; // Matches next section's background
  height?: "sm" | "md" | "lg";
  flip?: boolean;
  animate?: boolean;
}
```

**Implementation approach:** Each section optionally renders a top/bottom divider via props:

```typescript
// Add to every section's props
dividerTop?: "wave" | "curve" | "angle" | "triangle" | "none";
dividerTopColor?: string;
dividerBottom?: "wave" | "curve" | "angle" | "triangle" | "none";
dividerBottomColor?: string;
```

### 11.2 Scroll-Based Transitions

```typescript
// Section-level scroll props (optional, performance-conscious)
parallaxBackground?: boolean;     // Background scrolls at different speed
parallaxIntensity?: "subtle" | "medium" | "strong";
revealOnScroll?: boolean;         // Entire section fades in on scroll
scrollSnapAlign?: "start" | "center" | "none";
```

---

## 12. Structured Data & SEO Integration

### 12.1 Current Schema.org Support

| Component | Schema Type | Status |
|-----------|------------|--------|
| FAQ | `FAQPage`, `HowTo`, `QAPage` | ✅ Implemented |
| All others | — | ❌ None |

### 12.2 Planned Schema.org Expansion

| Component | Schema Type | Priority | SEO Impact |
|-----------|------------|----------|------------|
| **FAQ** | `FAQPage` | ✅ Done | Rich results (expandable Q&A in Google) |
| **Pricing** | `Product`, `Offer` | 🔴 High | Rich product snippets with prices |
| **Testimonials** | `Review`, `AggregateRating` | 🔴 High | Star ratings in search results |
| **ContactForm** | `ContactPoint`, `LocalBusiness` | ⚠️ Medium | Local business information |
| **Team** | `Person`, `Organization` | ⚠️ Medium | People/knowledge panel |
| **Map** (new) | `Place`, `LocalBusiness` | ⚠️ Medium | Local SEO map pack |
| **BlogPreview** (new) | `BlogPosting`, `Article` | ⚠️ Medium | Article rich results |
| **Navbar** | `SiteNavigationElement` | Low | Navigation breadcrumb |
| **Footer** | `Organization` | Low | Organization details |

**Implementation:** Each section renders a `<script type="application/ld+json">` block when `enableSchema` is true:

```typescript
// Add to relevant section interfaces
enableSchema?: boolean;
schemaType?: string; // Component-specific options
```

---

## 13. Dark Mode & Theming Strategy

### 13.1 Current Approach

All 17 section components use **inline styles** for colours (via `backgroundColor`, `textColor`, etc.). This is correct and works well because:

1. The AI converter sets explicit colours per component per site
2. Colours are stored in Supabase as JSON data
3. No reliance on Tailwind dark: classes (which would require page-level dark mode toggle)

### 13.2 Recommended Improvements

| Improvement | Current | Target | Priority |
|------------|---------|--------|----------|
| Default colours use CSS vars | `backgroundColor="#ffffff"` | `backgroundColor="var(--section-bg, #ffffff)"` | ⚠️ Medium |
| Dark-aware smart defaults | Static hex defaults | `isDark()` utility (ContactForm/Newsletter already have this) | ⚠️ Medium |
| Colour contrast validation | None | Warn in editor when text/bg contrast < 4.5:1 | Low |

### 13.3 Dark-Aware Utility (Reference Implementation)

ContactFormRender and NewsletterRender already implement dark-aware logic:

```typescript
// From ContactFormRender — EXCELLENT pattern to replicate
const isDark = backgroundColor
  ? parseInt(backgroundColor.replace("#", "").substring(0, 2), 16) < 100
  : false;
const resolvedTextColor = textColor || (isDark ? "#f9fafb" : "#1f2937");
const resolvedInputBg = inputBackgroundColor || (isDark ? "#374151" : "#ffffff");
```

**Recommendation:** Extract this into a shared utility:

```typescript
// utils/section-theme.ts
export function isDarkBackground(hex?: string): boolean {
  if (!hex) return false;
  const clean = hex.replace("#", "");
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function resolveTextColor(textColor?: string, bgColor?: string): string {
  if (textColor) return textColor;
  return isDarkBackground(bgColor) ? "#f9fafb" : "#1f2937";
}

export function resolveSubtitleColor(color?: string, bgColor?: string): string {
  if (color) return color;
  return isDarkBackground(bgColor) ? "#9ca3af" : "#6b7280";
}
```

---

## 14. Animation & Scroll Performance

### 14.1 Current Animation Support

| Component | animateOnScroll | animationType Options | Stagger | Framer Motion |
|-----------|----------------|----------------------|---------|---------------|
| Features | ✅ | fade, slide-up, slide-in, zoom, stagger, flip | ✅ staggerDelay | ✅ |
| CTA | ✅ | fadeIn, slideUp, slideLeft, zoom, bounce, pulse, typewriter | ❌ | ✅ |
| Testimonials | ✅ | fadeIn, slideUp, slideIn, zoom, stagger | ✅ staggerDelay | ✅ |
| FAQ | ✅ | fade, slide-up, slide-left, slide-right, scale, stagger | ✅ staggerDelay | ✅ |
| Stats | ✅ | fade, slide-up, slide-left, slide-right, scale, stagger | ✅ staggerDelay | ✅ |
| Team | ✅ | fade, slide-up, slide-left, slide-right, scale, stagger | ✅ staggerDelay | ✅ |
| Gallery | ✅ | fade, slide-up, scale, stagger, flip | ✅ staggerDelay | ✅ |
| Hero | ❌ | — | — | ❌ |
| Navbar | ❌ | — | — | ❌ |
| Footer | ❌ | — | — | ❌ |
| Newsletter | ❌ | — | — | ❌ |
| ContactForm | ❌ | — | — | ❌ |
| Pricing | ❌ | — | — | ❌ |
| Accordion | ❌ | — | — | ❌ |
| Carousel | ❌ | — | — | ❌ |
| Countdown | ❌ | — | — | ❌ |
| Form | ✅ | fade, slide, scale | ❌ | ❌ (CSS only) |

### 14.2 Animation Standardisation

All Tier A and B sections SHOULD support:

```typescript
animateOnScroll?: boolean;
animationType?: "fade" | "slide-up" | "slide-left" | "slide-right" | "scale" | "stagger";
animationDelay?: number;       // ms delay before animation starts
staggerDelay?: number;         // ms between each child animation
animationDuration?: "fast" | "normal" | "slow";
```

**Priority for adding animation:**

| Component | Current | Priority to Add |
|-----------|---------|----------------|
| Hero | None | 🔴 High (hero animations are high-impact) |
| Pricing | None | ⚠️ Medium |
| Accordion | None | Low |
| Newsletter | None | Low |
| ContactForm | None | Low |
| Navbar | None | Low (navigation should be instant) |
| Footer | None | Skip (footer is structural) |

### 14.3 Performance Guidelines

```
RULES:
1. Use Intersection Observer for scroll-triggered animations (not scroll listeners)
2. Only animate elements currently in viewport
3. Use transform/opacity for animations (GPU-accelerated, no layout thrashing)
4. Limit stagger to max 8 items (avoid long sequential animations)
5. Disable animations when prefers-reduced-motion is set
6. Lazy-load Framer Motion for sections not in initial viewport
7. Never animate Navbar or Footer (structural elements)
8. Hero animation should play immediately (no scroll trigger)
```

---

## 15. Registry & Converter Alignment

### 15.1 Converter typeMap Aliases

Every new section component MUST be registered in `converter.ts` typeMap with multiple natural-language aliases:

```typescript
// Existing aliases (verified complete)
"HeroSection": "hero",
"Hero": "hero",
"HeroBanner": "hero",
"FeaturesSection": "features",
"Features": "features",
"KeyFeatures": "features",
"Benefits": "features",
"Services": "features",
// ... 150+ total aliases

// NEW aliases to add for new components
"LogoCloud": "logoCloud",
"ClientLogos": "logoCloud",
"TrustedBy": "logoCloud",
"Partners": "logoCloud",
"AsSeenIn": "logoCloud",
"Banner": "banner",
"AnnouncementBar": "banner",
"TopBar": "banner",
"Content": "content",
"RichText": "content",
"TextBlock": "content",
"AboutSection": "content",
"BlogPreview": "blogPreview",
"Blog": "blogPreview",
"LatestPosts": "blogPreview",
"ComparisonTable": "comparisonTable",
"FeatureComparison": "comparisonTable",
"Map": "map",
"Location": "map",
"FindUs": "map",
```

### 15.2 Component Metadata

Every new component MUST be registered in `component-metadata.ts` with:

```typescript
{
  type: "logoCloud",
  label: "Logo Cloud",
  category: "trust",
  description: "Display client, partner, or press logos",
  icon: "building",
  defaultProps: { /* sensible defaults */ },
  propGroups: [ /* organised prop groups for editor */ ],
}
```

### 15.3 Core Components Registry

Every new component MUST be registered in `core-components.ts` with field definitions that exactly match the render props interface.

---

## 16. Implementation Phases

### Phase 1 — Cross-Section Consistency (Priority: 🔴 High)

**Scope:** Standardise existing 17 components without adding features.

| Task | Components | Effort |
|------|-----------|--------|
| Add standard `paddingY` values (`none`, `2xl`) to Hero, Footer, Pricing | 3 | Small |
| Add `badge`/`badgeIcon` alias to Hero (`badgeText` → `badge` alias) | 1 | Tiny |
| Add standard header props to Newsletter, ContactForm, Pricing, Accordion, Countdown | 5 | Medium |
| Add standard background system to Testimonials, Pricing, Accordion, Countdown | 4 | Medium |
| Wrap CarouselRender in standard `<section>` container with header | 1 | Small |
| Extract `isDarkBackground()` utility from ContactForm/Newsletter into shared module | — | Small |

**Estimated total:** 15-20 discrete changes, no API-breaking changes (additive only).

### Phase 2 — New High-Priority Sections (Priority: 🔴 High)

| Task | New Component | Est. Props | Effort |
|------|--------------|-----------|--------|
| Build LogoCloudRender | LogoCloud | 35 | Medium |
| Build BannerRender | Banner | 25 | Small |
| Build ContentRender | Content | 40 | Medium |
| Build BlogPreviewRender | BlogPreview | 50 | Medium |
| Register all in converter.ts, core-components.ts, component-metadata.ts | — | — | Medium |

### Phase 3 — Hero Enhancement (Priority: 🔴 High)

| Task | Effort |
|------|--------|
| Add full background system (gradient/pattern/image/overlay) to HeroRender | Medium |
| Add animation support (Framer Motion entrance animations) | Medium |
| Add decorative elements (dots/circles/blur) | Small |
| Add trust bar (logo cloud below hero content) | Small |
| Add 3 new variants (gradient, glass, parallax) | Medium |

### Phase 4 — Tier C Enhancement (Priority: ⚠️ Medium)

| Task | Components | Effort |
|------|-----------|--------|
| Add animation to Pricing, Countdown | 2 | Small |
| Expand Navbar with dropdown/mega-menu support | 1 | Large |
| Expand Footer with contact info, payment badges, more variants | 1 | Medium |
| Expand Newsletter with GDPR notice, background system | 1 | Small |
| Expand ContactForm with variants, additional fields | 1 | Medium |
| Add monthly/annual toggle to Pricing | 1 | Medium |

### Phase 5 — Advanced Features (Priority: Low)

| Task | Effort |
|------|--------|
| Build ComparisonTableRender | Medium |
| Build MapRender | Medium |
| Implement section divider system (shape dividers) | Medium |
| Add Schema.org to Pricing, Testimonials, Team | Medium |
| Implement AI page composition rules in converter | Large |
| Build colour flow automation in converter | Large |

---

## 17. Testing & Quality Gates

### 17.1 Section Component Checklist

Every section (existing and new) MUST pass this 15-point checklist:

```
RENDER QUALITY:
□ 1. Renders without error with zero props (sensible defaults)
□ 2. Renders correctly with all props set to edge values
□ 3. All text colours have sufficient contrast (≥4.5:1)
□ 4. No hardcoded Tailwind colour classes in render body

RESPONSIVE:
□ 5. Correct layout at mobile (375px)
□ 6. Correct layout at tablet (768px)
□ 7. Correct layout at desktop (1440px)
□ 8. No horizontal scroll at any breakpoint

ACCESSIBILITY:
□ 9. Semantic HTML (<section>, <h2>, <nav>, <footer>)
□ 10. All images have alt text
□ 11. All interactive elements are keyboard-accessible
□ 12. prefers-reduced-motion respected for animations

REGISTRY:
□ 13. Props interface matches core-components.ts fields exactly
□ 14. Converter typeMap has ≥3 natural aliases
□ 15. Component metadata category, icon, and description set
```

### 17.2 Page Composition Tests

```
□ Generate full page with 8+ sections — verify no visual conflicts
□ Verify dark section → light section transitions look clean
□ Verify section spacing consistency (no double padding)
□ Verify mobile page scroll performance (<16ms per frame)
□ Test with 50+ simultaneous animation sections (performance)
□ Validate Schema.org output with Google Rich Results Test
```

### 17.3 Visual Regression Tests

```
□ Screenshot comparison for each section with default props
□ Screenshot comparison for each section variant
□ Screenshot comparison at 3 breakpoints (mobile/tablet/desktop)
□ Dark background + light text readability check
```

---

## Appendix A — Section Component Size Rankings

| Rank | Component | Props | Variants | Lines (est.) | Complexity |
|------|-----------|-------|----------|-------------|------------|
| 1 | FAQ | 150+ | 10 | ~800 | 🔴 Very High |
| 2 | Team | 120+ | 10 | ~700 | 🔴 High |
| 3 | Gallery | 90+ | 8 | ~600 | 🔴 High |
| 4 | CTA | 80+ | 10 | ~500 | 🔴 High |
| 5 | Stats | 80+ | 10 | ~500 | 🔴 High |
| 6 | Features | 70+ | 10 | ~500 | 🔴 High |
| 7 | Testimonials | 60+ | 10 | ~500 | ⚠️ Medium-High |
| 8 | Form | 40+ | 5 | ~300 | ⚠️ Medium |
| 9 | Navbar | 28 | 3 | ~300 | ⚠️ Medium |
| 10 | ContactForm | 25 | 1 | ~200 | ⚠️ Medium |
| 11 | Hero | 22 | 5 | ~150 | ⚠️ Medium |
| 12 | Footer | 18 | 3 | ~250 | ⚠️ Medium |
| 13 | Accordion | 17 | 4 | ~150 | Low |
| 14 | Pricing | 16 | 3 | ~200 | Low |
| 15 | Countdown | 15 | 3 | ~100 | Low |
| 16 | Newsletter | 14 | 3 | ~120 | Low |
| 17 | Carousel | 12 | 1 | ~100 | Low |

## Appendix B — Cross-Reference to Other Master Plans

| Master Plan | Sections Covered | Relationship |
|------------|------------------|-------------|
| **Layout Components** | SpacerRender, ContainerRender, GridRender, ColumnsRender | Layout wraps sections; sections use internal layout |
| **Typography Components** | HeadingRender, ParagraphRender, BlockquoteRender | Typography used inside section headers and content |
| **Buttons Components** | ButtonRender, BadgeRender | CTA composes ButtonRender; badges used in section headers |
| **Media Components** | ImageRender, VideoRender, CarouselRender, GalleryRender | CarouselRender + GalleryRender are BOTH section and media components. Media plan handles the core render; this plan handles the section wrapper. |
| **Forms & Inputs** (future) | FormRender, InputRender, SelectRender | FormRender is a section container; inputs are a separate domain |

---

*Document version: 1.0*  
*Created: Session 11*  
*Covers: 17 existing section components + 6 proposed new sections*  
*Total existing props: 800+ | Total existing variants: 75+ | Total converter aliases: 150+*

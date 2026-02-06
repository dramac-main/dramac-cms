# AI Website Designer - Master Implementation Prompt

> **Priority**: 🔴 CRITICAL
> **Estimated Total Time**: 80-100 hours
> **Prerequisites**: Studio Phases Complete, Memory Bank Updated
> **Status**: 📋 PLANNING

---

## ⚠️ FOR AI AGENTS - READ FIRST

**CRITICAL**: Before implementing ANY phase:

1. **READ [PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Contains project structure, tech stack, database schema, coding patterns
2. **READ Memory Bank**: `/memory-bank/systemPatterns.md`, `/memory-bank/techContext.md`
3. **SCAN existing code**: `src/lib/studio/registry/core-components.ts` to understand patterns

Each phase document is **SELF-CONTAINED** and can be given to a different AI agent for implementation.

---

## 📊 Phase Dependency Graph

```
                    ┌─────────────────┐
                    │   AWD-CONTEXT   │ ← READ FIRST (all phases)
                    │  (Reference)    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     AWD-01      │ ← START HERE
                    │   Components    │   (No dependencies)
                    │   Enhancement   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   AWD-02    │  │   AWD-05    │  │   AWD-07    │
     │ Data Context│  │Design System│  │ Responsive  │
     │   System    │  │Intelligence │  │Mobile-First │
     └──────┬──────┘  └──────┬──────┘  └─────────────┘
            │                │
            └────────┬───────┘
                     │
                     ▼
            ┌─────────────────┐
            │     AWD-03      │ ← CORE ENGINE
            │   AI Designer   │   (Central Hub)
            │   Core Engine   │
            └────────┬────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   AWD-04    │ │   AWD-06    │ │   AWD-08    │
│ Component   │ │  Content    │ │  Preview &  │
│ Selection   │ │ Generation  │ │  Iteration  │
└─────────────┘ └─────────────┘ └─────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │     AWD-09      │ ← OPTIONAL
            │    Module       │   (If modules exist)
            │  Integration    │
            └─────────────────┘
```

### Implementation Order (Recommended)

| Order | Phase | Can Start When | Parallel With |
|-------|-------|----------------|---------------|
| 1 | AWD-01 | Immediately | - |
| 2 | AWD-02 | After AWD-01 | AWD-05, AWD-07 |
| 3 | AWD-05 | After AWD-01 | AWD-02, AWD-07 |
| 4 | AWD-07 | After AWD-01 | AWD-02, AWD-05 |
| 5 | AWD-03 | After AWD-02 | - |
| 6 | AWD-04 | After AWD-03 | AWD-06, AWD-08 |
| 7 | AWD-06 | After AWD-03 | AWD-04, AWD-08 |
| 8 | AWD-08 | After AWD-03 | AWD-04, AWD-06 |
| 9 | AWD-09 | After AWD-03 | - |

---

## 🎯 Vision Statement

Build an **AI-powered Website Designer** that creates complete, award-winning, production-ready websites from natural language prompts. The AI should be capable of building any website imaginable - from simple landing pages to complex multi-page applications with eCommerce, booking systems, and dynamic content.

**Core Principle:** *"The AI selects and configures. It NEVER defines."*
- Uses existing 53+ components with their 50-150+ fields
- Creates pages by arranging and configuring components
- Binds data from client dashboards automatically
- NEVER modifies core component definitions (site isolation)

---

## 📋 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI WEBSITE DESIGNER IMPLEMENTATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE AWD-01: Component Enhancement (15-20 hours)                         │
│  └── Upgrade ALL 53 components to maximum customization                     │
│                                                                             │
│  PHASE AWD-02: Data Context System (8-10 hours)                            │
│  └── Auto-pull business data from client dashboard                          │
│                                                                             │
│  PHASE AWD-03: AI Website Designer Core (12-15 hours)                      │
│  └── Multi-page generation engine with Claude integration                   │
│                                                                             │
│  PHASE AWD-04: Component Selection Intelligence (10-12 hours)              │
│  └── AI reasoning for component selection based on context                  │
│                                                                             │
│  PHASE AWD-05: Design System & Brand Intelligence (8-10 hours)             │
│  └── AI-driven color palettes, typography, and brand consistency            │
│                                                                             │
│  PHASE AWD-06: Content Generation Engine (10-12 hours)                     │
│  └── AI-generated copy, imagery suggestions, and content strategy           │
│                                                                             │
│  PHASE AWD-07: Responsive & Mobile-First System (6-8 hours)                │
│  └── Automatic responsive optimization and mobile-first defaults            │
│                                                                             │
│  PHASE AWD-08: Preview & Iteration System (8-10 hours)                     │
│  └── Real-time preview, AI chat refinement, and version history             │
│                                                                             │
│  PHASE AWD-09: Module Integration Intelligence (8-10 hours)                │
│  └── Smart module detection and automatic configuration                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI WEBSITE DESIGNER ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER INPUT                           DATA CONTEXT                          │
│  ┌─────────────────┐                  ┌─────────────────┐                  │
│  │ "Build me a     │                  │ • business_name │                  │
│  │  modern gym     │                  │ • logo_url      │                  │
│  │  website with   │                  │ • contact_info  │                  │
│  │  class booking" │                  │ • services[]    │                  │
│  └────────┬────────┘                  │ • products[]    │                  │
│           │                           │ • team[]        │                  │
│           ▼                           │ • testimonials[]│                  │
│  ┌─────────────────────────────────┐  └────────┬────────┘                  │
│  │      AI REASONING ENGINE         │           │                          │
│  │  ┌─────────────────────────────┐ │           │                          │
│  │  │ 1. Analyze user intent      │ │◄──────────┘                          │
│  │  │ 2. Detect required modules  │ │                                      │
│  │  │ 3. Plan page structure      │ │                                      │
│  │  │ 4. Select components        │ │                                      │
│  │  │ 5. Configure all props      │ │                                      │
│  │  │ 6. Generate content         │ │                                      │
│  │  │ 7. Apply design system      │ │                                      │
│  │  └─────────────────────────────┘ │                                      │
│  └────────────────┬─────────────────┘                                      │
│                   │                                                         │
│                   ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     COMPONENT REGISTRY                               │   │
│  │  53 Components × 50-150 Fields = ∞ Combinations                      │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │   │
│  │  │ Navbar │ │ Hero   │ │Features│ │ CTA    │ │ Footer │            │   │
│  │  │ 80+    │ │ 100+   │ │ 90+    │ │ 80+    │ │ 70+    │            │   │
│  │  │ fields │ │ fields │ │ fields │ │ fields │ │ fields │            │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                         │
│                   ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      GENERATED WEBSITE                               │   │
│  │  pages: [                                                            │   │
│  │    { slug: "/", name: "Home", content: {...} },                      │   │
│  │    { slug: "/about", name: "About", content: {...} },                │   │
│  │    { slug: "/classes", name: "Classes", content: {...} },            │   │
│  │    { slug: "/trainers", name: "Trainers", content: {...} },          │   │
│  │    { slug: "/contact", name: "Contact", content: {...} }             │   │
│  │  ]                                                                   │   │
│  │  settings: { theme, colors, fonts, branding }                        │   │
│  │  modules: ["booking", "ecommerce"]                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Site Isolation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SITE ISOLATION MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PLATFORM LEVEL (Read-Only by AI)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  core-components.ts    →  Component definitions (53 components)      │   │
│  │  field-registry.ts     →  Field type definitions                     │   │
│  │  Base modules          →  ecommerce, booking, crm, automation        │   │
│  │                                                                      │   │
│  │  ⛔ AI NEVER MODIFIES THIS LAYER                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SITE LEVEL (AI Writes Here)                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  pages.content        →  Component props (JSON per page)             │   │
│  │  site_modules.settings →  Module configuration per site              │   │
│  │  site_branding        →  Logo, business name, colors                 │   │
│  │  site_settings        →  Theme, fonts, global styles                 │   │
│  │                                                                      │   │
│  │  ✅ FULLY ISOLATED - Changes affect ONLY this site                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  RESULT: Client with 20 sites → Each site is independent                   │
│  • Site A changes → Sites B-T unaffected                                   │
│  • AI generates → Only affects target site                                 │
│  • Data updates → Only bound site refreshes                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Enhancement Priority

### 🔴 Critical (Needs Major Enhancement)
1. **LogoCloud** - Needs 50+ fields (animation, styling, infinite scroll)
2. **ComparisonTable** - Needs 60+ fields (styling, highlighting, responsive)
3. **TrustBadges** - Needs 40+ fields (layouts, animations, hover effects)
4. **SocialProof** - Needs 50+ fields (variants, animations, testimonial link)
5. **AnnouncementBar** - Needs 40+ fields (animations, countdown, targeting)

### 🟡 Medium (Needs Enhancement)
6. **Divider** - Needs 30+ fields (decorative styles, icons, text)
7. **Spacer** - Needs 20+ fields (responsive, decorative, line options)
8. **Badge** - Needs 35+ fields (variants, animations, icons)
9. **Avatar** - Needs 35+ fields (status, ring, group display)
10. **Alert** - Needs 40+ fields (variants, icons, animations, dismissible)
11. **Tooltip** - Needs 25+ fields (triggers, positions, animations)
12. **Progress** - Needs 35+ fields (variants, labels, animations)
13. **Accordion** - Needs 60+ fields (styling per FAQ component level)
14. **Tabs** - Needs 50+ fields (variants, animations, icons)
15. **Modal** - Needs 50+ fields (sizes, animations, overlays)
16. **Countdown** - Needs 45+ fields (styles, actions, formats)
17. **Typewriter** - Needs 30+ fields (cursor, speed, loop)
18. **Parallax** - Needs 35+ fields (intensity, direction, layers)
19. **Quote** - Needs 40+ fields (variants, author, decorations)
20. **CodeBlock** - Needs 35+ fields (themes, languages, copy button)
21. **RichText** - Needs 40+ fields (typography, spacing, prose styles)

### 🟢 Good (Minor Tweaks)
22-53. All other components - Fine-tuning, ensure no missing fields

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Component Fields | 50+ per component minimum | Field count audit |
| Generation Time | < 30 seconds for full site | Performance benchmarks |
| User Satisfaction | > 90% approve first generation | User feedback |
| Mobile Score | > 95 Google PageSpeed | Lighthouse tests |
| Iteration Rounds | < 3 to final approval | User interaction tracking |
| Data Binding | 100% auto-populated | Completeness check |

---

## 🚀 Implementation Order

```
Week 1: AWD-01 (Component Enhancement)
        └── All 53 components upgraded to maximum fields

Week 2: AWD-02 + AWD-03 (Data Context + Core Engine)
        └── Data binding + Multi-page generation

Week 3: AWD-04 + AWD-05 (Intelligence + Design System)
        └── Smart component selection + Brand consistency

Week 4: AWD-06 + AWD-07 (Content + Responsive)
        └── AI copywriting + Mobile optimization

Week 5: AWD-08 + AWD-09 (Preview + Modules)
        └── Iteration system + Smart module integration
```

---

## 🔗 Related Phases

- **PHASE-STUDIO-11**: AI Page Generator (Single page - keep as-is)
- **PHASE-EM-23**: AI Module Builder (Module creation - keep as-is)
- **Memory Bank**: Update activeContext.md with AWD progress

---

## ✅ Deliverables

1. **53 Enhanced Components** with maximum customization fields
2. **Data Context API** for auto-pulling business data
3. **AI Website Designer UI** with chat interface
4. **Multi-page Generation Engine** with Claude integration
5. **Design System Intelligence** for consistent branding
6. **Content Generation System** for AI copywriting
7. **Preview & Iteration System** with version history
8. **Module Integration System** for smart module setup
9. **Documentation** for each phase
10. **Testing Guide** for validation

---

**LET'S BUILD THE MOST POWERFUL AI WEBSITE BUILDER ON THE PLANET! 🚀**

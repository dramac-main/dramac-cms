# DRAMAC Landing Page Builder Pro — Complete Implementation Master Guide

**Document Type**: Master Implementation Guide (AI Agent Reference)
**Created**: April 13, 2026
**Platform**: DRAMAC CMS — Enterprise Module Marketplace
**Production URL**: https://app.dramacagency.com
**Existing Module Prefix**: `mod_mktmod01_` (Landing pages live within the Marketing module)
**Phase Prefix**: `LPB` (Landing Page Builder)

---

## How to Use This Guide

This document is the **single source of truth** for overhauling the DRAMAC Landing Page Builder from a limited block-stacking system into a Studio-powered, high-converting page builder. It is designed to be consumed by AI agents across multiple sessions.

### What This Is NOT

This is NOT a new module. Landing pages already exist within the Marketing module (`mod_mktmod01_landing_pages`). This guide describes an **architectural overhaul** that:

1. Replaces the vertical-block-only editor with a Studio Builder integration
2. Moves landing pages from API routes to proper site URLs
3. Adds LP-specific components (split heroes, floating forms, logo bars, etc.)
4. Inherits site branding by default with full override capability
5. Adds header/footer toggle for each landing page
6. Upgrades the form system with advanced field types and conditional logic
7. Provides high-converting templates matching industry-leading platforms (Unbounce, Leadpages, Instapage)

### Workflow Per Session

1. **Read this entire guide** to understand the full vision
2. **Read ALL memory bank files** (`/memory-bank/*.md`) to understand current platform state
3. **Pick the next unimplemented phase** from the phase list below
4. **Implement that phase completely** — all code, migrations, types, components
5. **Verify**: Run `npx tsc --noEmit` with `NODE_OPTIONS="--max-old-space-size=8192"` — zero new errors required
6. **Build**: Run `npx next build` — must succeed
7. **Commit**: `git add -A && git commit -m "feat: Phase LPB-XX — [description]" && git push`
8. **Update memory bank**: Update `activeContext.md` and `progress.md` with what was actually built
9. **Do NOT modify this master guide** — it stays as the north star vision

---

## Critical Platform Rules (MUST Follow)

- **All prices in CENTS** (integers) — K250.00 = 25000
- **Supabase returns snake_case** — always use `mapRecord()`/`mapRecords()` from `@/lib/map-db-record`
- **Every server page needs auth guard**: `if (!user) redirect('/login')`
- **AI Zod schemas**: No `.int()`, `.min()`, `.max()` — Claude rejects these
- **Vercel function timeout**: `maxDuration = 60` on all AI API routes
- **Locale**: Zambia-first — `ZMW` currency, `K` symbol, `Africa/Lusaka` timezone, 16% VAT
- **Email sender**: `Dramac <noreply@app.dramacagency.com>` via Resend
- **Module DB prefix**: All tables MUST be `mod_mktmod01_*` (stays within Marketing module)
- **No `dark:` Tailwind variants** in storefront/public components
- **Use semantic Tailwind**: `bg-card`, `text-foreground`, `bg-primary` — never hardcoded colors
- **`'use client'` components** must NOT contain inline `'use server'` annotations
- **Import server actions** as functions from separate files
- **Toast notifications**: Use `sonner` (not `useToast`)
- **Font inline styles**: Always use `fontFamily: value || undefined` (never empty string)
- **Studio components**: Follow existing registry pattern in `src/lib/studio/engine/component-registry.ts`
- **Public rendering**: All LP components MUST work through the existing `StudioRenderer` → `ComponentRenderer` pipeline
- **Site branding**: Use `resolveBrandColors()` from `src/lib/studio/engine/brand-colors.ts` for CSS variable injection

---

## Table of Contents

### Foundation

- **Phase LPB-01**: Database Migration, Type System & Component Registry Foundation
- **Phase LPB-02**: Studio LP Editor — Dedicated Landing Page Builder Mode
- **Phase LPB-03**: URL Routing & Site Integration (Site URL serving, header/footer toggle, branding)

### Core LP Components

- **Phase LPB-04**: Hero Components (Split hero, full-bleed, video background, gradient overlays)
- **Phase LPB-05**: Advanced Form System (Multi-field forms, conditional logic, CRM integration)
- **Phase LPB-06**: Conversion Components (Logo bars, trust badges, countdown, social proof, pricing tables)

### Templates & Intelligence

- **Phase LPB-07**: Template Library (15+ high-converting templates in Studio format)
- **Phase LPB-08**: Analytics & Conversion Tracking (Visit tracking, goal completions, heatmap data)
- **Phase LPB-09**: AI Landing Page Generator (Claude-powered LP creation from description)

### Administration & Migration

- **Phase LPB-10**: Super Admin Health View + Client Portal LP Management
- **Phase LPB-11**: Migration — Convert Existing LPs from Block Format to Studio Format

---

## Platform Architecture Context

### Multi-Tenant Hierarchy

```
Super Admin (Platform operator — DRAMAC)
    └── Agency (Organization)
            ├── Team Members (owner, admin, member + manage_marketing permission)
            ├── Clients (can_manage_marketing permission for portal access)
            └── Sites
                    ├── Installed Modules (marketing is CORE — auto-installed)
                    ├── Pages (DRAMAC Studio visual builder)
                    ├── Landing Pages ← THIS OVERHAUL
                    │   ├── Built with Studio Builder (LP Mode)
                    │   ├── Served on site URL: site.com/lp/[slug]
                    │   ├── Inherit site branding by default
                    │   ├── Optional site header/footer
                    │   └── LP-specific components (heroes, forms, logo bars)
                    ├── Blog, SEO, Forms, Media
                    └── Storefront (ecommerce, cart, orders)
```

### Where Landing Pages Live

- Landing pages are **SITE-SCOPED** — each LP belongs to a specific site
- Data stored in `mod_mktmod01_landing_pages` (existing table, enhanced)
- Content stored as **Studio component tree format** (same JSON as regular pages)
- Rendered through the **existing StudioRenderer pipeline** — not a separate rendering engine
- Served on the **actual site URL** at `/lp/[slug]` (NOT via API routes)
- Agency manages LPs for their clients' sites
- Clients can view/manage LPs via Client Portal (permission-gated)
- Super Admin sees platform-wide LP health metrics

### Key Architecture Decision: Studio Builder Lite (Not a New Engine)

```
┌─────────────────────────────────────────────────────────────────┐
│  CURRENT: Limited Block Stacker                                  │
│                                                                  │
│  • 13 block types, all vertically stacked                        │
│  • Separate HTML string renderer (landing-page-renderer.ts)      │
│  • Served via API route: /api/marketing/lp/[siteId]/[slug]      │
│  • NO split layouts, NO floating forms, NO logo bars             │
│  • Separate StyleConfig (not site branding)                      │
│  • Separate codebase from Studio builder                         │
│                                                                  │
│  ❌ Cannot produce ANY of the user's reference screenshots       │
└────────────────────────┬────────────────────────────────────────┘
                         │ REPLACED BY
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  NEW: Studio-Powered LP Builder                                  │
│                                                                  │
│  • Reuses existing Studio Builder with LP-specific configuration │
│  • LP-specific component palette (heroes, forms, trust badges)   │
│  • Full Studio capabilities: Columns, drag-and-drop, properties  │
│  • Rendered through StudioRenderer (same as regular site pages)  │
│  • Served on site URL: /lp/[slug]                                │
│  • Inherits site branding via CSS custom properties              │
│  • Optional site header/footer wrapping                          │
│  • All existing Studio components available PLUS LP-specific ones│
│                                                                  │
│  ✅ Can produce EVERY layout from user's reference screenshots   │
└─────────────────────────────────────────────────────────────────┘
```

### Why Studio Builder (Not Craft.js, Not Patch)

| Criteria                  | Patch Current                  | Craft.js              | Studio Builder           |
| ------------------------- | ------------------------------ | --------------------- | ------------------------ |
| Split hero + form layouts | ❌ Fundamental redesign needed | ✅ Possible           | ✅ Already has Columns   |
| Drag-and-drop             | ❌ No DnD                      | ✅ Built-in           | ✅ Already works         |
| Property panels           | ❌ None                        | ✅ Build from scratch | ✅ 9 field types working |
| Brand color inheritance   | ❌ Separate StyleConfig        | ❌ Build from scratch | ✅ 146 color mappings    |
| Component registry        | ❌ None                        | ✅ Framework provided | ✅ 70+ components        |
| Learning curve            | Low                            | High (new framework)  | Zero (we own the code)   |
| Maintenance burden        | N/A                            | New dependency        | Zero (same codebase)     |
| Time to production        | Weeks                          | Months                | Sessions                 |

### Existing Module Dependencies

| Module                                                           | How LP Builder Uses It                                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Studio Builder** (`src/components/studio/`, `src/lib/studio/`) | Core editor, renderer, component registry, DnD, property panels, brand color injection |
| **CRM** (`mod_crmmod01_*`)                                       | Form submissions create/update contacts. Segment targeting for personalized LPs.       |
| **Automation** (`automation_*`)                                  | LP form submissions fire events. LP visit events trigger workflows.                    |
| **E-Commerce** (`mod_ecommod01_*`)                               | Product showcase on LPs, checkout button integration, abandoned cart LPs.              |
| **Marketing** (`mod_mktmod01_*`)                                 | LP is part of Marketing module. Subscriber creation from forms. Campaign links to LPs. |
| **Live Chat** (`mod_chat_*`)                                     | Chat widget can be embedded on LPs.                                                    |
| **Site System** (`sites`, `pages`, `page_content`)               | Branding inheritance, domain routing, header/footer rendering.                         |

### Tech Stack Reference (LP-Specific)

- **Editor**: DRAMAC Studio (iframe-based canvas, Zustand state, @dnd-kit + HTML5 DnD)
- **Renderer**: StudioRenderer → ComponentRenderer pipeline with CSS custom properties
- **Brand Colors**: `resolveBrandColors()` → 146+ CSS variable mappings from 5 core colors
- **Canvas**: `EditorCanvas` + `CanvasIframe` with brand color injection
- **Component Library**: `ComponentLibrary` panel with categorized component cards
- **Properties**: `PropertiesPanel` with 9 field types (text, number, boolean, select, color, image, richtext, padding, align)
- **State**: Zustand stores: `useEditorStore`, `useUIStore`, `useSelectionStore`, `useHistoryStore`, `useAIStore`

---

## Relationship: LP Builder vs Studio Builder vs Marketing Module

### Clear Ownership Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│  STUDIO BUILDER (Core Platform — shared infrastructure)          │
│                                                                  │
│  "HOW components are edited, rendered, and managed"              │
│                                                                  │
│  • Drag-and-drop editor with iframe canvas                       │
│  • Component registry and render pipeline                        │
│  • Property editing panels                                       │
│  • Brand color injection system                                  │
│  • Responsive breakpoints (mobile/tablet/desktop)                │
│  • Version history (Zundo)                                       │
│  • Layout components: Section, Container, Columns                │
│  • Generic components: Heading, Text, Button, Image, Video, etc. │
│                                                                  │
│  OWNS: Editor UI, renderer, DnD, property panels, registry       │
│  DOES NOT OWN: Any business logic, form submissions, analytics   │
└────────────────────────┬────────────────────────────────────────┘
                         │ USES (adds LP-specific components to)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LP BUILDER (Marketing Module — conversion-focused components)   │
│                                                                  │
│  "WHAT conversion components are available + LP business logic"  │
│                                                                  │
│  • LP-specific hero variants (split, full-bleed, video, gradient)│
│  • Advanced form components (multi-field, conditional, CRM sync) │
│  • Trust/conversion components (logo bar, badges, countdown)     │
│  • LP data model (lp metadata, analytics, A/B tests)             │
│  • LP URL routing (/lp/[slug] on site domain)                    │
│  • LP templates (high-converting, Studio format)                 │
│  • Form submission pipeline → subscribers + CRM contacts         │
│  • Conversion analytics and tracking                             │
│                                                                  │
│  OWNS: LP components, LP pages, LP analytics, form processing    │
│  DOES NOT OWN: Editor, renderer, DnD, property panels            │
└────────────────────────┬────────────────────────────────────────┘
                         │ IS PART OF
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  MARKETING MODULE (Business Module — campaigns, subscribers)     │
│                                                                  │
│  "Email campaigns, sequences, subscribers, all marketing ops"    │
│                                                                  │
│  OWNS: Campaigns, sequences, subscribers, templates, analytics   │
│  LP Builder is one feature within Marketing (alongside campaigns)│
└─────────────────────────────────────────────────────────────────┘
```

---

## Access Control Design

### Agency Dashboard (`/dashboard/sites/[siteId]/marketing/landing-pages/`)

**Who**: Agency owners, admins, members with `manage_marketing` permission
**What they can do**:

- Create, edit, publish, archive, delete landing pages
- Use the Studio LP Editor with full component palette
- Manage LP templates (create custom, use built-in)
- View LP analytics (visits, conversions, conversion rate)
- Configure A/B tests (variant pages, traffic split)
- Set LP header/footer toggle per page
- Override site branding per LP
- Duplicate LPs across sites
- Import/export LP designs

**Routes**:

```
/dashboard/sites/[siteId]/marketing/landing-pages/                  — LP list with analytics overview
/dashboard/sites/[siteId]/marketing/landing-pages/new/              — Create new LP (template picker → studio editor)
/dashboard/sites/[siteId]/marketing/landing-pages/[lpId]/           — LP detail (analytics + settings)
/dashboard/sites/[siteId]/marketing/landing-pages/[lpId]/edit/      — Studio LP Editor (full builder)
/dashboard/sites/[siteId]/marketing/landing-pages/templates/        — Template library (built-in + custom)
```

### Client Portal (`/portal/sites/[siteId]/marketing/landing-pages/`)

**Who**: Clients with `can_manage_marketing` permission
**What they can do**:

- View list of landing pages with status and analytics
- View LP analytics (visits, conversions, conversion rate)
- Create and edit LPs (if specifically permitted — new permission: `can_edit_landing_pages`)
- Publish/unpublish LPs (if permitted)
- Cannot delete LPs (agency-only)
- Cannot access A/B testing configuration

**Routes**:

```
/portal/sites/[siteId]/marketing/landing-pages/                     — LP list (read-only or full based on permissions)
/portal/sites/[siteId]/marketing/landing-pages/[lpId]/              — LP detail with analytics
/portal/sites/[siteId]/marketing/landing-pages/[lpId]/edit/         — LP editor (if can_edit_landing_pages)
```

### Super Admin (`/admin/marketing/landing-pages/`)

**Who**: Super admin only (`profiles.role === 'super_admin'`)
**What they can do**:

- Platform-wide LP metrics (total LPs, total visits, conversion rates)
- Per-agency LP usage (who's creating the most, which convert best)
- Flag/disable suspicious LPs (spam, phishing)
- Manage global LP templates
- View conversion benchmarks across all agencies

**Routes**:

```
/admin/marketing/landing-pages/                                     — Platform LP health dashboard
```

### Public/Storefront (No Auth Required)

**What visitors see**:

- Published landing page at `https://site-domain.com/lp/[slug]`
- Optional site header/footer (configurable per LP)
- LP content rendered through StudioRenderer
- Forms with validation, submit, success/redirect behavior
- Conversion tracking (visit counted, form submissions tracked)

---

## Existing Code Integration Points

### Files That Will Be MODIFIED (Additive Only)

#### 1. Site Public Route — Catch-All Page

**File**: `src/app/site/[domain]/[[...slug]]/page.tsx`
**Change**: Add LP routing — when slug starts with `lp/`, fetch LP data instead of regular page data
**Risk**: Low — new conditional branch, existing page logic untouched

#### 2. Craft Renderer for LPs

**File**: `src/app/site/[domain]/[[...slug]]/craft-renderer.tsx`
**Change**: Accept optional `showHeader`/`showFooter` props for LP mode
**Risk**: Low — additive props with defaults

#### 3. Studio Component Registry

**File**: `src/lib/studio/engine/component-registry.ts`
**Change**: Register LP-specific components (LPHero, LPForm, LPLogoBar, LPCountdown, LPTestimonialWall, LPPricingTable, LPTrustBadges)
**Risk**: Zero — additive registry entries

#### 4. Studio Component Library Panel

**File**: `src/components/studio/panels/component-library.tsx`
**Change**: Add "Landing Page" category with LP components. Support filtering by context (LP mode shows LP components prominently)
**Risk**: Low — additive category

#### 5. Studio Premium Components

**File**: `src/lib/studio/blocks/premium-components.tsx`
**Change**: Add render functions for LP components
**Risk**: Low — additive functions

#### 6. Studio Component Definitions

**File**: `src/lib/studio/engine/component-definitions.ts`
**Change**: Add component definitions (props, defaults, metadata) for all LP components
**Risk**: Zero — additive definitions

#### 7. Studio Component Converter

**File**: `src/lib/studio/engine/component-converter.ts`
**Change**: Add converter entries for LP component types
**Risk**: Zero — additive converter mappings

#### 8. Studio Component Metadata

**File**: `src/lib/studio/engine/component-metadata.ts`
**Change**: Add metadata (display names, icons, categories) for LP components
**Risk**: Zero — additive metadata entries

#### 9. Automation Event Registry

**File**: `src/modules/automation/lib/event-types.ts`
**Change**: Add `marketing.landing_page.*` events (published, visited, form_submitted, conversion)
**Risk**: Zero — additive array entries

#### 10. Automation Action Types

**File**: `src/modules/automation/lib/action-types.ts`
**Change**: Add LP-related actions (create_lp, publish_lp)
**Risk**: Zero — additive array entries

#### 11. Landing Page Actions

**File**: `src/modules/marketing/actions/landing-page-actions.ts`
**Change**: Update to support Studio format content, branding override, header/footer config
**Risk**: Medium — function signatures change but backward-compatible

#### 12. Landing Page Types

**File**: `src/modules/marketing/types/landing-page-types.ts`
**Change**: Add new interfaces for Studio content, LP settings, branding override
**Risk**: Low — additive types, existing types preserved for migration

#### 13. Dashboard Navigation

**File**: `src/config/navigation.ts`
**Change**: Ensure marketing nav includes landing-pages sub-route
**Risk**: Zero — verify existing entry

#### 14. Client Portal Permissions

**DB Migration**: Add `can_edit_landing_pages` boolean column to `client_site_permissions` (or equivalent)
**Risk**: Zero — nullable column with default false

### Files That Will Be CREATED (New)

All new LP builder code lives in these locations:

```
src/modules/marketing/
├── types/
│   └── lp-builder-types.ts                — LP builder-specific types (LPSettings, LPBranding, LPTemplate)
├── actions/
│   └── lp-builder-actions.ts              — LP builder actions (template CRUD, analytics, A/B tests)
├── components/
│   └── landing-pages/
│       ├── lp-editor-page.tsx             — Full-page LP editor wrapper (Studio instance with LP config)
│       ├── lp-template-picker.tsx         — Template selection dialog for new LPs
│       ├── lp-settings-panel.tsx          — LP settings sidebar (URL, branding, header/footer, SEO)
│       ├── lp-analytics-dashboard.tsx     — LP conversion analytics
│       └── lp-list-enhanced.tsx           — Enhanced LP list with analytics columns
├── lib/
│   ├── lp-builder-constants.ts            — LP component categories, template data
│   ├── lp-form-processor.ts              — Form submission → subscriber + CRM contact pipeline
│   └── lp-analytics-service.ts           — Visit/conversion tracking service
└── data/
    └── lp-studio-templates.ts             — Template definitions in Studio component tree format

src/components/studio/
├── blocks/
│   └── landing-page/
│       ├── index.ts                       — Barrel export
│       ├── lp-hero-render.tsx             — LP Hero component renders (4 variants)
│       ├── lp-form-render.tsx             — LP Form component render
│       ├── lp-logo-bar-render.tsx         — Logo bar / "As Seen On" render
│       ├── lp-trust-badges-render.tsx     — Trust badges render
│       ├── lp-countdown-render.tsx        — Countdown timer render
│       ├── lp-testimonial-wall-render.tsx — Testimonial wall/grid render
│       ├── lp-pricing-table-render.tsx    — Pricing comparison table render
│       └── lp-floating-cta-render.tsx     — Floating/sticky CTA bar render
└── panels/
    └── lp-component-library.tsx           — LP-specific component palette (extends main library)

src/app/(dashboard)/dashboard/sites/[siteId]/marketing/landing-pages/
├── page.tsx                               — LP list page (server component)
├── new/
│   └── page.tsx                           — New LP page (template picker)
├── templates/
│   └── page.tsx                           — Template library page
└── [lpId]/
    ├── page.tsx                           — LP detail/analytics page
    └── edit/
        └── page.tsx                       — LP Studio editor page

src/app/api/marketing/lp/
├── submit/route.ts                        — Public form submission endpoint
├── track/route.ts                         — Visit/conversion tracking pixel
└── ai-generate/route.ts                   — AI LP generation endpoint
```

**Portal Pages** (new/updated):

```
src/app/portal/sites/[siteId]/marketing/landing-pages/
├── page.tsx                               — LP list (portal view)
└── [lpId]/
    ├── page.tsx                           — LP detail (portal view)
    └── edit/
        └── page.tsx                       — LP editor (portal, if permitted)
```

**Admin Pages** (new):

```
src/app/(dashboard)/admin/marketing/landing-pages/
└── page.tsx                               — Platform LP health dashboard
```

---

## Phase LPB-01: Database Migration, Type System & Component Registry Foundation

### Purpose

Establish the enhanced database schema, new TypeScript types for the Studio-based LP builder, and register all LP-specific components in the Studio component registry. This phase creates the skeleton that all subsequent phases build on.

### Database Changes

#### Table Enhancement: `mod_mktmod01_landing_pages` (ALTER TABLE)

Add new columns to support Studio format and site integration:

| Column                 | Type        | Constraints   | Description                                                        |
| ---------------------- | ----------- | ------------- | ------------------------------------------------------------------ |
| `content_studio`       | jsonb       |               | Studio component tree format (replaces `content_json` for new LPs) |
| `use_studio_format`    | boolean     | DEFAULT false | Flag: true = Studio format, false = legacy block format            |
| `show_header`          | boolean     | DEFAULT false | Show site header on this LP                                        |
| `show_footer`          | boolean     | DEFAULT false | Show site footer on this LP                                        |
| `branding_override`    | jsonb       |               | Override site branding (null = inherit site branding)              |
| `custom_scripts`       | text        |               | Custom tracking scripts (Google Tag Manager, Facebook Pixel, etc.) |
| `ab_test_enabled`      | boolean     | DEFAULT false | A/B testing active                                                 |
| `ab_test_config`       | jsonb       |               | Variant configuration { variants: [...], trafficSplit: number }    |
| `primary_variant_id`   | uuid        |               | FK to self — the control variant (null = this IS the primary)      |
| `analytics_snapshot`   | jsonb       |               | Cached analytics for fast dashboard loading                        |
| `utm_tracking`         | jsonb       |               | UTM parameter tracking config                                      |
| `redirect_url`         | text        |               | Optional redirect after conversion                                 |
| `conversion_value`     | integer     | DEFAULT 0     | Monetary value of conversion in CENTS                              |
| `max_conversions`      | integer     |               | Optional cap on form submissions                                   |
| `is_evergreen`         | boolean     | DEFAULT true  | Always available (vs. time-limited)                                |
| `starts_at`            | timestamptz |               | When LP becomes active (if not evergreen)                          |
| `ends_at`              | timestamptz |               | When LP expires (if not evergreen)                                 |
| `expired_redirect_url` | text        |               | Where to redirect after LP expires                                 |

**Migration SQL**:

```sql
-- LPB-01: Enhance landing pages table for Studio builder integration
ALTER TABLE mod_mktmod01_landing_pages
  ADD COLUMN IF NOT EXISTS content_studio jsonb,
  ADD COLUMN IF NOT EXISTS use_studio_format boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_header boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_footer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS branding_override jsonb,
  ADD COLUMN IF NOT EXISTS custom_scripts text,
  ADD COLUMN IF NOT EXISTS ab_test_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ab_test_config jsonb,
  ADD COLUMN IF NOT EXISTS primary_variant_id uuid REFERENCES mod_mktmod01_landing_pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS analytics_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS utm_tracking jsonb,
  ADD COLUMN IF NOT EXISTS redirect_url text,
  ADD COLUMN IF NOT EXISTS conversion_value integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_conversions integer,
  ADD COLUMN IF NOT EXISTS is_evergreen boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_redirect_url text;

-- Index for A/B test variant lookup
CREATE INDEX IF NOT EXISTS idx_mktmod01_lp_primary_variant
  ON mod_mktmod01_landing_pages(primary_variant_id)
  WHERE primary_variant_id IS NOT NULL;

-- Index for time-limited LP lookup
CREATE INDEX IF NOT EXISTS idx_mktmod01_lp_schedule
  ON mod_mktmod01_landing_pages(starts_at, ends_at)
  WHERE NOT is_evergreen;
```

#### New Table: `mod_mktmod01_lp_form_submissions`

Enhanced form submission tracking (replaces generic form_submissions for LPs):

| Column              | Type        | Constraints                                | Description                              |
| ------------------- | ----------- | ------------------------------------------ | ---------------------------------------- |
| `id`                | uuid        | PK, default gen_random_uuid()              | Submission ID                            |
| `site_id`           | uuid        | FK sites.id, NOT NULL                      | Site scope                               |
| `landing_page_id`   | uuid        | FK mod_mktmod01_landing_pages.id, NOT NULL | Which LP                                 |
| `form_component_id` | text        | NOT NULL                                   | Component ID within the LP's Studio tree |
| `data`              | jsonb       | NOT NULL                                   | Form field values { field_name: value }  |
| `email`             | text        |                                            | Extracted email (indexed for dedup)      |
| `name`              | text        |                                            | Extracted name                           |
| `phone`             | text        |                                            | Extracted phone                          |
| `subscriber_id`     | uuid        | FK mod_mktmod01_subscribers.id             | Created/matched subscriber               |
| `crm_contact_id`    | uuid        |                                            | Created/matched CRM contact              |
| `utm_source`        | text        |                                            | UTM source                               |
| `utm_medium`        | text        |                                            | UTM medium                               |
| `utm_campaign`      | text        |                                            | UTM campaign                             |
| `utm_term`          | text        |                                            | UTM term                                 |
| `utm_content`       | text        |                                            | UTM content                              |
| `referrer`          | text        |                                            | HTTP referrer                            |
| `ip_address`        | text        |                                            | Visitor IP (for geo, consent)            |
| `user_agent`        | text        |                                            | Browser user agent                       |
| `device_type`       | text        | CHECK (desktop, tablet, mobile)            | Detected device                          |
| `page_variant`      | text        |                                            | A/B test variant identifier              |
| `time_on_page`      | integer     |                                            | Seconds on page before submission        |
| `scroll_depth`      | integer     |                                            | Percentage scrolled before submission    |
| `is_duplicate`      | boolean     | DEFAULT false                              | Duplicate email/phone submission         |
| `created_at`        | timestamptz | DEFAULT now()                              | Submission time                          |

**Indexes**: `site_id + landing_page_id`, `email`, `created_at`, `utm_source`

**Migration SQL**:

```sql
-- LPB-01: LP form submissions table
CREATE TABLE IF NOT EXISTS mod_mktmod01_lp_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  landing_page_id uuid NOT NULL REFERENCES mod_mktmod01_landing_pages(id) ON DELETE CASCADE,
  form_component_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  email text,
  name text,
  phone text,
  subscriber_id uuid REFERENCES mod_mktmod01_subscribers(id) ON DELETE SET NULL,
  crm_contact_id uuid,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  ip_address text,
  user_agent text,
  device_type text CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  page_variant text,
  time_on_page integer,
  scroll_depth integer,
  is_duplicate boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mktmod01_lp_submissions_site_lp ON mod_mktmod01_lp_form_submissions(site_id, landing_page_id);
CREATE INDEX idx_mktmod01_lp_submissions_email ON mod_mktmod01_lp_form_submissions(email) WHERE email IS NOT NULL;
CREATE INDEX idx_mktmod01_lp_submissions_created ON mod_mktmod01_lp_form_submissions(created_at);
CREATE INDEX idx_mktmod01_lp_submissions_utm ON mod_mktmod01_lp_form_submissions(utm_source) WHERE utm_source IS NOT NULL;

-- RLS policies
ALTER TABLE mod_mktmod01_lp_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view LP submissions for their sites"
  ON mod_mktmod01_lp_form_submissions FOR SELECT
  USING (site_id IN (
    SELECT s.id FROM sites s
    JOIN agency_members am ON am.agency_id = s.agency_id
    WHERE am.user_id = auth.uid()
  ));

CREATE POLICY "Public can insert LP submissions"
  ON mod_mktmod01_lp_form_submissions FOR INSERT
  WITH CHECK (true);
```

#### New Table: `mod_mktmod01_lp_visits`

Visit tracking for conversion rate calculation:

| Column            | Type        | Constraints                                | Description                                            |
| ----------------- | ----------- | ------------------------------------------ | ------------------------------------------------------ |
| `id`              | uuid        | PK, default gen_random_uuid()              | Visit ID                                               |
| `site_id`         | uuid        | FK sites.id, NOT NULL                      | Site scope                                             |
| `landing_page_id` | uuid        | FK mod_mktmod01_landing_pages.id, NOT NULL | Which LP                                               |
| `visitor_id`      | text        |                                            | Anonymous visitor fingerprint (cookie/localStorage ID) |
| `session_id`      | text        |                                            | Session identifier                                     |
| `is_unique`       | boolean     | DEFAULT true                               | First visit from this visitor                          |
| `utm_source`      | text        |                                            | UTM source                                             |
| `utm_medium`      | text        |                                            | UTM medium                                             |
| `utm_campaign`    | text        |                                            | UTM campaign                                           |
| `referrer`        | text        |                                            | HTTP referrer                                          |
| `device_type`     | text        | CHECK (desktop, tablet, mobile)            | Detected device                                        |
| `country`         | text        |                                            | GeoIP country                                          |
| `page_variant`    | text        |                                            | A/B test variant served                                |
| `converted`       | boolean     | DEFAULT false                              | Did this visit result in conversion                    |
| `time_on_page`    | integer     |                                            | Seconds on page                                        |
| `scroll_depth`    | integer     |                                            | Max scroll percentage                                  |
| `created_at`      | timestamptz | DEFAULT now()                              | Visit time                                             |

**Indexes**: `site_id + landing_page_id`, `visitor_id`, `created_at`, `utm_source`

**Migration SQL**:

```sql
-- LPB-01: LP visit tracking table
CREATE TABLE IF NOT EXISTS mod_mktmod01_lp_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  landing_page_id uuid NOT NULL REFERENCES mod_mktmod01_landing_pages(id) ON DELETE CASCADE,
  visitor_id text,
  session_id text,
  is_unique boolean DEFAULT true,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  device_type text CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  country text,
  page_variant text,
  converted boolean DEFAULT false,
  time_on_page integer,
  scroll_depth integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mktmod01_lp_visits_site_lp ON mod_mktmod01_lp_visits(site_id, landing_page_id);
CREATE INDEX idx_mktmod01_lp_visits_visitor ON mod_mktmod01_lp_visits(visitor_id) WHERE visitor_id IS NOT NULL;
CREATE INDEX idx_mktmod01_lp_visits_created ON mod_mktmod01_lp_visits(created_at);

-- RLS policies
ALTER TABLE mod_mktmod01_lp_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view LP visits for their sites"
  ON mod_mktmod01_lp_visits FOR SELECT
  USING (site_id IN (
    SELECT s.id FROM sites s
    JOIN agency_members am ON am.agency_id = s.agency_id
    WHERE am.user_id = auth.uid()
  ));

CREATE POLICY "Public can insert LP visits"
  ON mod_mktmod01_lp_visits FOR INSERT
  WITH CHECK (true);
```

#### New Table: `mod_mktmod01_lp_templates`

Custom LP templates saved by agencies (built-in templates are in code):

| Column           | Type        | Constraints                   | Description                                       |
| ---------------- | ----------- | ----------------------------- | ------------------------------------------------- |
| `id`             | uuid        | PK, default gen_random_uuid() | Template ID                                       |
| `site_id`        | uuid        | FK sites.id                   | Site scope (null = global)                        |
| `agency_id`      | uuid        | FK agencies.id                | Agency scope (for agency-wide templates)          |
| `name`           | text        | NOT NULL                      | Template name                                     |
| `description`    | text        |                               | Template description                              |
| `category`       | text        | NOT NULL                      | lead-gen, webinar, product-launch, etc.           |
| `thumbnail_url`  | text        |                               | Preview image                                     |
| `content_studio` | jsonb       | NOT NULL                      | Studio component tree                             |
| `settings`       | jsonb       | DEFAULT '{}'                  | Default LP settings (show_header, branding, etc.) |
| `is_system`      | boolean     | DEFAULT false                 | Platform-provided template                        |
| `is_public`      | boolean     | DEFAULT false                 | Available in marketplace                          |
| `usage_count`    | integer     | DEFAULT 0                     | Times used                                        |
| `created_by`     | uuid        |                               | Creator                                           |
| `created_at`     | timestamptz | DEFAULT now()                 |                                                   |
| `updated_at`     | timestamptz | DEFAULT now()                 |                                                   |

**Indexes**: `site_id`, `agency_id`, `category`, `is_system`

**Migration SQL**:

```sql
-- LPB-01: LP templates table
CREATE TABLE IF NOT EXISTS mod_mktmod01_lp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
  agency_id uuid,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  thumbnail_url text,
  content_studio jsonb NOT NULL DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  is_system boolean DEFAULT false,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_mktmod01_lp_templates_site ON mod_mktmod01_lp_templates(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX idx_mktmod01_lp_templates_agency ON mod_mktmod01_lp_templates(agency_id) WHERE agency_id IS NOT NULL;
CREATE INDEX idx_mktmod01_lp_templates_category ON mod_mktmod01_lp_templates(category);
CREATE INDEX idx_mktmod01_lp_templates_system ON mod_mktmod01_lp_templates(is_system) WHERE is_system = true;

-- RLS policies
ALTER TABLE mod_mktmod01_lp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage LP templates for their sites"
  ON mod_mktmod01_lp_templates FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN agency_members am ON am.agency_id = s.agency_id
      WHERE am.user_id = auth.uid()
    )
    OR agency_id IN (
      SELECT am.agency_id FROM agency_members am
      WHERE am.user_id = auth.uid()
    )
    OR is_system = true
  );

CREATE POLICY "Public can read system LP templates"
  ON mod_mktmod01_lp_templates FOR SELECT
  USING (is_system = true);
```

### TypeScript Types

#### New File: `src/modules/marketing/types/lp-builder-types.ts`

```typescript
/**
 * Landing Page Builder Pro — Type Definitions
 *
 * Types for the Studio-powered LP builder, extending the existing
 * landing page types with Studio format support.
 */

/** LP branding override — when null, inherits site branding */
export interface LPBrandingOverride {
  /** Override primary color (hex) */
  primaryColor?: string;
  /** Override secondary color (hex) */
  secondaryColor?: string;
  /** Override accent color (hex) */
  accentColor?: string;
  /** Override background color (hex) */
  backgroundColor?: string;
  /** Override text color (hex) */
  textColor?: string;
  /** Override heading font family */
  fontHeading?: string;
  /** Override body font family */
  fontBody?: string;
  /** Override border radius token */
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  /** Custom logo URL for this LP */
  logoUrl?: string;
}

/** LP display settings */
export interface LPSettings {
  /** Show site header on this LP */
  showHeader: boolean;
  /** Show site footer on this LP */
  showFooter: boolean;
  /** Branding override (null = inherit site) */
  brandingOverride: LPBrandingOverride | null;
  /** Custom scripts (GTM, FB Pixel, etc.) */
  customScripts: string;
  /** Redirect URL after conversion */
  redirectUrl: string;
  /** Conversion value in CENTS */
  conversionValue: number;
  /** Max conversions (null = unlimited) */
  maxConversions: number | null;
  /** LP is always active */
  isEvergreen: boolean;
  /** Active start time (if not evergreen) */
  startsAt: string | null;
  /** Active end time (if not evergreen) */
  endsAt: string | null;
  /** Redirect URL after LP expires */
  expiredRedirectUrl: string;
}

/** Default LP settings */
export const DEFAULT_LP_SETTINGS: LPSettings = {
  showHeader: false,
  showFooter: false,
  brandingOverride: null,
  customScripts: "",
  redirectUrl: "",
  conversionValue: 0,
  maxConversions: null,
  isEvergreen: true,
  startsAt: null,
  endsAt: null,
  expiredRedirectUrl: "",
};

/** A/B test variant */
export interface LPVariant {
  /** Variant ID (the LP id of the variant) */
  id: string;
  /** Variant name (e.g., "Control", "Variant A") */
  name: string;
  /** Traffic weight (0-100, all variants should sum to 100) */
  weight: number;
}

/** A/B test configuration */
export interface LPABTestConfig {
  /** Variant definitions */
  variants: LPVariant[];
  /** Test start date */
  startedAt: string | null;
  /** Test end date (null = run until manual stop) */
  endsAt: string | null;
  /** Winning metric */
  winningMetric: "conversion_rate" | "form_submissions" | "time_on_page";
  /** Minimum sample size per variant before declaring winner */
  minSampleSize: number;
  /** Statistical confidence threshold (0-100) */
  confidenceThreshold: number;
}

/** UTM tracking configuration */
export interface LPUtmConfig {
  /** Auto-append UTM params to outbound links */
  autoAppendUtm: boolean;
  /** Default UTM source for this LP */
  defaultSource: string;
  /** Default UTM medium */
  defaultMedium: string;
  /** Default UTM campaign */
  defaultCampaign: string;
}

/** Enhanced landing page with Studio support */
export interface LandingPageStudio {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  description?: string;
  status: "draft" | "published" | "archived";

  /** Legacy block-based content (for backward compatibility) */
  contentJson?: unknown;
  /** Studio component tree content (new format) */
  contentStudio?: unknown;
  /** Whether this LP uses Studio format */
  useStudioFormat: boolean;

  /** LP display settings */
  showHeader: boolean;
  showFooter: boolean;
  brandingOverride?: LPBrandingOverride | null;
  customScripts?: string;

  /** SEO */
  seoConfig?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    noIndex?: boolean;
    canonicalUrl?: string;
  };

  /** Conversion */
  conversionGoal: "form_submit" | "button_click" | "page_scroll";
  conversionValue: number;
  redirectUrl?: string;
  maxConversions?: number | null;

  /** Time constraints */
  isEvergreen: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  expiredRedirectUrl?: string;

  /** A/B Testing */
  abTestEnabled: boolean;
  abTestConfig?: LPABTestConfig | null;
  primaryVariantId?: string | null;

  /** Analytics */
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  analyticsSnapshot?: unknown;

  /** UTM */
  utmTracking?: LPUtmConfig | null;

  /** Legacy style config (for non-studio LPs) */
  styleConfig?: unknown;
  formConfig?: unknown;
  templateId?: string | null;

  /** Audit */
  createdBy?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** LP form field definition */
export interface LPFormField {
  /** Unique field ID */
  id: string;
  /** Field type */
  type:
    | "text"
    | "email"
    | "phone"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
    | "file"
    | "hidden";
  /** Field label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Is this field required? */
  required: boolean;
  /** Validation regex pattern */
  pattern?: string;
  /** Validation error message */
  errorMessage?: string;
  /** Options for select/radio/checkbox */
  options?: { label: string; value: string }[];
  /** Default value */
  defaultValue?: string;
  /** Column width (1-12 grid) */
  width?: number;
  /** Conditional visibility rules */
  showWhen?: {
    fieldId: string;
    operator: "equals" | "not_equals" | "contains" | "not_empty";
    value?: string;
  };
  /** CRM field mapping */
  crmMapping?:
    | "first_name"
    | "last_name"
    | "email"
    | "phone"
    | "company"
    | "custom";
  /** Custom CRM field key (if crmMapping = 'custom') */
  crmCustomField?: string;
}

/** LP form component settings */
export interface LPFormSettings {
  /** Form fields */
  fields: LPFormField[];
  /** Submit button text */
  submitButtonText: string;
  /** Submit button color (CSS value) */
  submitButtonColor?: string;
  /** Success message */
  successMessage: string;
  /** Success action */
  successAction: "message" | "redirect" | "close";
  /** Redirect URL (if successAction = 'redirect') */
  successRedirectUrl?: string;
  /** Create subscriber on submit */
  createSubscriber: boolean;
  /** Tags to add to subscriber */
  subscriberTags: string[];
  /** Mailing list to add subscriber to */
  mailingListId?: string;
  /** Sequence to enroll subscriber in */
  sequenceId?: string;
  /** Create CRM contact on submit */
  createCrmContact: boolean;
  /** Double opt-in required */
  doubleOptIn: boolean;
  /** GDPR consent checkbox text */
  gdprConsentText?: string;
  /** Honeypot anti-spam */
  enableHoneypot: boolean;
  /** Rate limit (max submissions per IP per hour) */
  rateLimitPerHour: number;
  /** Send notification email to agency on submission */
  notifyOnSubmission: boolean;
  /** Notification email addresses */
  notificationEmails: string[];
}

/** Default form settings */
export const DEFAULT_LP_FORM_SETTINGS: LPFormSettings = {
  fields: [
    {
      id: "email",
      type: "email",
      label: "Email",
      placeholder: "Enter your email",
      required: true,
      crmMapping: "email",
    },
  ],
  submitButtonText: "Get Started",
  successMessage: "Thank you! We'll be in touch soon.",
  successAction: "message",
  createSubscriber: true,
  subscriberTags: [],
  createCrmContact: true,
  doubleOptIn: false,
  enableHoneypot: true,
  rateLimitPerHour: 10,
  notifyOnSubmission: false,
  notificationEmails: [],
};

/** LP template definition */
export interface LPTemplate {
  id: string;
  name: string;
  description: string;
  category: LPTemplateCategory;
  thumbnailUrl?: string;
  /** Studio component tree */
  contentStudio: unknown;
  /** Default settings */
  settings: Partial<LPSettings>;
  /** Is platform-provided */
  isSystem: boolean;
  /** Usage count */
  usageCount?: number;
}

/** LP template categories */
export type LPTemplateCategory =
  | "lead-gen"
  | "webinar"
  | "product-launch"
  | "coming-soon"
  | "sale-promo"
  | "ebook-download"
  | "free-trial"
  | "consultation"
  | "saas-signup"
  | "app-download"
  | "agency-services"
  | "newsletter"
  | "event-registration"
  | "course-enrollment"
  | "real-estate"
  | "fitness-health";

/** LP analytics summary */
export interface LPAnalyticsSummary {
  /** Total visits (all time) */
  totalVisits: number;
  /** Unique visitors */
  uniqueVisitors: number;
  /** Total form submissions */
  totalSubmissions: number;
  /** Conversion rate (0-100) */
  conversionRate: number;
  /** Average time on page (seconds) */
  avgTimeOnPage: number;
  /** Average scroll depth (0-100) */
  avgScrollDepth: number;
  /** Bounce rate (0-100) */
  bounceRate: number;
  /** Revenue attributed (CENTS) */
  revenueAttributed: number;
  /** Daily stats for chart */
  dailyStats: {
    date: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }[];
  /** Traffic sources breakdown */
  trafficSources: {
    source: string;
    visits: number;
    conversions: number;
  }[];
  /** Device breakdown */
  deviceBreakdown: {
    device: string;
    visits: number;
    conversions: number;
  }[];
}

/** LP hero variant types */
export type LPHeroVariant =
  | "split-left"
  | "split-right"
  | "full-bleed"
  | "video-bg"
  | "gradient-overlay"
  | "minimal";

/** LP component type identifiers (for Studio registry) */
export const LP_COMPONENT_TYPES = {
  HERO: "LPHero",
  FORM: "LPForm",
  LOGO_BAR: "LPLogoBar",
  TRUST_BADGES: "LPTrustBadges",
  COUNTDOWN: "LPCountdown",
  TESTIMONIAL_WALL: "LPTestimonialWall",
  PRICING_TABLE: "LPPricingTable",
  FLOATING_CTA: "LPFloatingCTA",
} as const;

/** LP component category for the Studio component library */
export const LP_COMPONENT_CATEGORY = "landing-page";
export const LP_COMPONENT_CATEGORY_LABEL = "Landing Page";
```

### Component Registry Additions

Add to `src/lib/studio/engine/component-registry.ts` — register all LP component types:

```typescript
// LP-specific components (added by LPB-01)
registry.register("LPHero", {
  type: "LPHero",
  category: "landing-page",
  displayName: "LP Hero Section",
  description:
    "High-converting hero with split layouts, forms, and CTA buttons",
  icon: "Rocket",
  render: LPHeroRender,
  defaultProps: {
    /* defined in component-definitions.ts */
  },
  propertyFields: [
    /* defined in component-definitions.ts */
  ],
  isContainer: true,
});

// ... similar for LPForm, LPLogoBar, LPTrustBadges, LPCountdown,
//     LPTestimonialWall, LPPricingTable, LPFloatingCTA
```

### Component Metadata Additions

Add to `src/lib/studio/engine/component-metadata.ts`:

```typescript
LPHero: {
  displayName: 'LP Hero Section',
  category: 'landing-page',
  icon: 'Rocket',
  description: 'Conversion-focused hero with 6 layout variants',
  tags: ['hero', 'landing-page', 'conversion', 'split-layout'],
},
LPForm: {
  displayName: 'LP Lead Form',
  category: 'landing-page',
  icon: 'FormInput',
  description: 'Advanced form with conditional fields and CRM integration',
  tags: ['form', 'landing-page', 'lead-capture', 'conversion'],
},
LPLogoBar: {
  displayName: 'Logo Bar',
  category: 'landing-page',
  icon: 'Building2',
  description: '"As Seen On" / partner logo display bar',
  tags: ['logos', 'trust', 'social-proof', 'partners'],
},
LPTrustBadges: {
  displayName: 'Trust Badges',
  category: 'landing-page',
  icon: 'ShieldCheck',
  description: 'Security, guarantee, and certification badges',
  tags: ['trust', 'security', 'badges', 'conversion'],
},
LPCountdown: {
  displayName: 'Countdown Timer',
  category: 'landing-page',
  icon: 'Timer',
  description: 'Urgency countdown with evergreen or fixed date modes',
  tags: ['countdown', 'urgency', 'timer', 'conversion'],
},
LPTestimonialWall: {
  displayName: 'Testimonial Wall',
  category: 'landing-page',
  icon: 'MessageSquareQuote',
  description: 'Grid/carousel of testimonials with photos and ratings',
  tags: ['testimonials', 'social-proof', 'reviews'],
},
LPPricingTable: {
  displayName: 'Pricing Table',
  category: 'landing-page',
  icon: 'CreditCard',
  description: 'Side-by-side pricing comparison with highlighted plan',
  tags: ['pricing', 'plans', 'comparison'],
},
LPFloatingCTA: {
  displayName: 'Floating CTA Bar',
  category: 'landing-page',
  icon: 'PanelBottom',
  description: 'Sticky bottom bar with CTA button and urgency text',
  tags: ['cta', 'sticky', 'floating', 'conversion'],
},
```

### Component Definition Additions

Add to `src/lib/studio/engine/component-definitions.ts`:

Each LP component needs full property field definitions. Here are the key ones:

**LPHero Properties**:

- `variant`: select — 'split-left' | 'split-right' | 'full-bleed' | 'video-bg' | 'gradient-overlay' | 'minimal'
- `headline`: text — Main headline
- `subheadline`: text — Supporting text
- `ctaText`: text — CTA button text
- `ctaUrl`: text — CTA button link
- `ctaSecondaryText`: text — Secondary CTA text
- `ctaSecondaryUrl`: text — Secondary CTA link
- `backgroundImage`: image — Background image URL
- `videoUrl`: text — Background video URL (for video-bg variant)
- `overlayColor`: color — Overlay color
- `overlayOpacity`: number — Overlay opacity (0-100)
- `showForm`: boolean — Show embedded form in hero
- `formPosition`: select — 'right' | 'left' | 'overlay' | 'below'
- `minHeight`: select — 'auto' | 'screen' | '80vh' | '60vh'
- `verticalAlign`: select — 'top' | 'center' | 'bottom'
- `textAlign`: select — 'left' | 'center' | 'right'

**LPForm Properties**:

- `formSettings`: (complex) — Full LPFormSettings object
- `variant`: select — 'inline' | 'card' | 'floating' | 'slide-in' | 'minimal'
- `title`: text — Form heading
- `subtitle`: text — Form description
- `cardBackground`: color — Form card background
- `cardBorderRadius`: select — 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `cardShadow`: select — 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `direction`: select — 'vertical' | 'horizontal' — Field layout direction
- `columns`: number — Number of grid columns (1-4)

**LPLogoBar Properties**:

- `title`: text — Section title (e.g., "As Seen On", "Trusted By")
- `logos`: (array) — Array of { imageUrl, altText, link }
- `variant`: select — 'scroll' | 'grid' | 'carousel'
- `grayscale`: boolean — Show logos in grayscale
- `maxHeight`: number — Max logo height in px
- `backgroundColor`: color — Section background
- `spacing`: select — 'tight' | 'normal' | 'wide'

**LPTrustBadges Properties**:

- `badges`: (array) — Array of { icon, title, description }
- `variant`: select — 'horizontal' | 'grid' | 'inline'
- `iconColor`: color — Badge icon color
- `showDescriptions`: boolean — Show badge descriptions

**LPCountdown Properties**:

- `targetDate`: text — Countdown target date (ISO string)
- `mode`: select — 'fixed' | 'evergreen'
- `evergreenDays`: number — Days from first visit (for evergreen mode)
- `evergreenHours`: number — Hours from first visit
- `expiredAction`: select — 'hide' | 'redirect' | 'show-message'
- `expiredMessage`: text — Message to show when expired
- `expiredRedirectUrl`: text — URL to redirect to when expired
- `variant`: select — 'boxes' | 'inline' | 'minimal' | 'circular'
- `showLabels`: boolean — Show "Days", "Hours", etc.
- `labelStyle`: select — 'full' | 'short' | 'single-letter'
- `urgencyText`: text — Text above/below countdown (e.g., "Offer ends in:")

**LPTestimonialWall Properties**:

- `testimonials`: (array) — Array of { name, role, company, text, imageUrl, rating }
- `variant`: select — 'grid' | 'carousel' | 'masonry' | 'single-featured'
- `columns`: number — Grid columns (1-4)
- `showRatings`: boolean — Show star ratings
- `showImages`: boolean — Show avatar images
- `maxVisible`: number — Max testimonials to display
- `backgroundColor`: color — Section background

**LPPricingTable Properties**:

- `plans`: (array) — Array of { name, price, period, features, ctaText, ctaUrl, isPopular, badgeText }
- `variant`: select — 'cards' | 'table' | 'minimal'
- `columns`: number — Number of plan columns (1-4)
- `highlightPopular`: boolean — Highlight the popular plan
- `showAnnualToggle`: boolean — Monthly/annual toggle
- `annualDiscount`: number — Discount percentage for annual

**LPFloatingCTA Properties**:

- `text`: text — CTA text
- `ctaText`: text — Button text
- `ctaUrl`: text — Button URL
- `showAfterScroll`: number — Percentage scrolled before showing (0-100)
- `backgroundColor`: color — Bar background
- `position`: select — 'bottom' | 'top'
- `showCountdown`: boolean — Show inline countdown
- `countdownDate`: text — Countdown date

### Server Actions Updates

#### Updated: `src/modules/marketing/actions/landing-page-actions.ts`

Add new parameters to existing actions:

```typescript
// Enhanced createLandingPage params
export async function createLandingPage(input: {
  siteId: string;
  title: string;
  slug: string;
  description?: string;
  // Existing
  contentJson?: unknown;
  styleConfig?: unknown;
  formConfig?: unknown;
  seoConfig?: unknown;
  conversionGoal?: string;
  templateId?: string;
  // NEW — Studio format
  contentStudio?: unknown;
  useStudioFormat?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  brandingOverride?: LPBrandingOverride | null;
  customScripts?: string;
  // NEW — Conversion
  redirectUrl?: string;
  conversionValue?: number;
  maxConversions?: number | null;
  // NEW — Time constraints
  isEvergreen?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  expiredRedirectUrl?: string;
});

// Enhanced updateLandingPage params
export async function updateLandingPage(
  landingPageId: string,
  updates: {
    title?: string;
    slug?: string;
    description?: string;
    // Existing
    contentJson?: unknown;
    styleConfig?: unknown;
    formConfig?: unknown;
    seoConfig?: unknown;
    conversionGoal?: string;
    // NEW — Studio format
    contentStudio?: unknown;
    useStudioFormat?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
    brandingOverride?: LPBrandingOverride | null;
    customScripts?: string;
    // NEW — Conversion
    redirectUrl?: string;
    conversionValue?: number;
    maxConversions?: number | null;
    // NEW — Time constraints
    isEvergreen?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    expiredRedirectUrl?: string;
  },
);
```

#### New: `src/modules/marketing/actions/lp-builder-actions.ts`

```typescript
"use server";

// LP Template actions
export async function getLPTemplates(siteId: string, category?: string)
export async function getLPTemplate(templateId: string)
export async function createLPTemplate(input: { siteId: string; name: string; ... })
export async function updateLPTemplate(templateId: string, updates: { ... })
export async function deleteLPTemplate(templateId: string)
export async function duplicateLPAsTemplate(landingPageId: string, name: string)

// LP Analytics actions
export async function getLPAnalytics(landingPageId: string, dateRange?: { from: string; to: string })
export async function getLPAnalyticsSummary(siteId: string) // All LPs for a site
export async function trackLPVisit(input: { siteId: string; landingPageId: string; ... })
export async function trackLPConversion(input: { siteId: string; landingPageId: string; ... })

// LP Form submission actions
export async function submitLPForm(input: { siteId: string; landingPageId: string; formComponentId: string; data: Record<string, unknown>; ... })
export async function getLPFormSubmissions(landingPageId: string, filters?: { ... })
export async function exportLPFormSubmissions(landingPageId: string, format: 'csv' | 'json')

// LP A/B Test actions
export async function createLPVariant(primaryLpId: string, name: string)
export async function updateLPABTestConfig(primaryLpId: string, config: LPABTestConfig)
export async function getLPABTestResults(primaryLpId: string)
export async function endLPABTest(primaryLpId: string, winnerId: string)
```

### Testing Notes for LPB-01

1. **Run migration** — Verify new columns appear on `mod_mktmod01_landing_pages`
2. **Run migration** — Verify `mod_mktmod01_lp_form_submissions`, `mod_mktmod01_lp_visits`, `mod_mktmod01_lp_templates` tables created
3. **TypeScript** — `npx tsc --noEmit` with zero new errors
4. **Component registry** — Verify LP components appear in registry (check with `console.log`)
5. **Backward compatibility** — Existing LPs should still load and render (they use `content_json` + `use_studio_format = false`)
6. **RLS** — Verify agency members can query new tables for their sites
7. **Create/update actions** — Verify new params are passed through to DB

---

## Phase LPB-02: Studio LP Editor — Dedicated Landing Page Builder Mode

### Purpose

Create a dedicated LP editing experience that wraps the existing Studio builder with LP-specific configuration: filtered component palette emphasizing conversion components, LP settings sidebar (URL slug, branding, header/footer, SEO, conversion goals), and template picker for new LPs.

### Key Architecture: LP Mode for Studio

The LP editor is NOT a separate builder — it's the Studio builder with:

1. **Filtered component palette** — LP components shown first, all others available
2. **LP settings sidebar** — Replaces the standard page settings with LP-specific settings
3. **LP-specific toolbar** — Preview on site URL, publish controls, analytics shortcut
4. **Template initialization** — New LPs start from a template, not blank canvas

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LP Editor Page (lp-editor-page.tsx)                                     │
│                                                                          │
│  ┌──────────┐  ┌──────────────────────────────┐  ┌───────────────────┐  │
│  │ Component │  │                               │  │  LP Settings      │  │
│  │ Library   │  │    Studio Canvas (iframe)     │  │  Panel            │  │
│  │           │  │                               │  │                   │  │
│  │ ┌───────┐ │  │  ┌─────────────────────────┐  │  │  □ URL & Slug    │  │
│  │ │LP Hero│ │  │  │  [Site Header - optional]│  │  │  □ Branding     │  │
│  │ │LP Form│ │  │  │                          │  │  │  □ Header/Footer│  │
│  │ │Logo   │ │  │  │  LANDING PAGE CONTENT    │  │  │  □ SEO          │  │
│  │ │Bar    │ │  │  │  (drag & drop here)      │  │  │  □ Conversion   │  │
│  │ │Trust  │ │  │  │                          │  │  │  □ UTM          │  │
│  │ │Badges │ │  │  │  [Site Footer - optional]│  │  │  □ A/B Test     │  │
│  │ │Count  │ │  │  └─────────────────────────┘  │  │  □ Custom Scripts│  │
│  │ │down   │ │  │                               │  │                   │  │
│  │ └───────┘ │  └──────────────────────────────┘  └───────────────────┘  │
│  │           │                                                            │
│  │ ─ All ── │  ┌──────────────────────────────────────────────────────┐  │
│  │ Section  │  │  Toolbar: Save | Preview | Publish | Analytics       │  │
│  │ Columns  │  └──────────────────────────────────────────────────────┘  │
│  │ Heading  │                                                            │
│  │ Text     │                                                            │
│  │ Button   │                                                            │
│  │ Image    │                                                            │
│  │ Video    │                                                            │
│  │ etc...   │                                                            │
│  └──────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Components

#### `src/modules/marketing/components/landing-pages/lp-editor-page.tsx`

**Purpose**: Full-page LP editor wrapping the Studio builder

**Props**:

```typescript
interface LPEditorPageProps {
  landingPage: LandingPageStudio;
  siteId: string;
  siteName: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
  siteSettings?: Record<string, unknown> | null;
}
```

**Behavior**:

1. Initializes Studio editor with `landingPage.contentStudio` as initial data
2. Passes site settings for brand color injection
3. Renders LP settings panel on the right (instead of standard properties panel when no component selected)
4. Adds LP-specific toolbar at top: Save, Preview on site URL, Publish/Unpublish, Back to LP list
5. On save: calls `updateLandingPage()` with `contentStudio` from editor store + settings from LP settings panel
6. On publish: calls `updateLandingPage({ status: 'published', publishedAt: new Date().toISOString() })`
7. Unsaved changes warning via `beforeunload`

**Key Implementation**:

```typescript
// The LP editor reuses Studio components directly:
import { ComponentLibrary } from "@/components/studio/panels/component-library";
import { EditorCanvas } from "@/components/studio/canvas/editor-canvas";
import { PropertiesPanel } from "@/components/studio/properties/properties-panel";
import { useEditorStore } from "@/lib/studio/stores/editor-store";

// When no component is selected, show LP settings panel instead of empty properties panel
// When a component IS selected, show the standard properties panel

// Component palette: Show "Landing Page" category first, then all other categories
// No components are hidden — the full Studio palette is available
```

#### `src/modules/marketing/components/landing-pages/lp-settings-panel.tsx`

**Purpose**: Right sidebar panel for LP-specific settings

**Props**:

```typescript
interface LPSettingsPanelProps {
  landingPage: LandingPageStudio;
  siteSettings?: Record<string, unknown> | null;
  onChange: (settings: Partial<LPSettings>) => void;
}
```

**Sections** (collapsible accordion):

1. **URL & Slug** — Slug editor with preview: `https://site-domain.com/lp/[slug]`
2. **Branding** — Toggle "Inherit site branding" (default), or override with color pickers / font selectors
3. **Header & Footer** — Toggle show/hide site header and footer
4. **SEO** — Meta title, description, OG image, noIndex toggle, canonical URL
5. **Conversion** — Goal type, conversion value, redirect URL, max conversions
6. **UTM Tracking** — Auto-append UTM config
7. **Schedule** — Evergreen toggle, start/end dates, expired redirect
8. **Custom Scripts** — Textarea for GTM/pixel code (with XSS note)

#### `src/modules/marketing/components/landing-pages/lp-template-picker.tsx`

**Purpose**: Template selection dialog shown when creating a new LP

**Props**:

```typescript
interface LPTemplatePickerProps {
  siteId: string;
  onSelect: (template: LPTemplate) => void;
  onBlank: () => void;
  onCancel: () => void;
}
```

**Behavior**:

1. Shows grid of template thumbnails, grouped by category
2. Category filter tabs: All, Lead Gen, Webinar, Product Launch, etc.
3. Each template shows: thumbnail, name, description, "Use Template" button
4. "Start from Scratch" option loads blank LP with a default Section + Heading
5. Loading built-in templates from code + custom templates from DB

#### `src/modules/marketing/components/landing-pages/lp-list-enhanced.tsx`

**Purpose**: Enhanced LP list view replacing the basic list with analytics columns

**Props**:

```typescript
interface LPListEnhancedProps {
  landingPages: LandingPageStudio[];
  siteId: string;
  siteName: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
}
```

**Features**:

- Table columns: Title, Status (badge), URL, Visits, Conversions, Rate, Last Updated
- Quick actions: Edit, Publish/Unpublish, Duplicate, View Analytics, Delete
- Create new button → template picker → editor
- Filter by status, sort by any column
- Bulk actions: publish, unpublish, archive

#### `src/modules/marketing/components/landing-pages/lp-analytics-dashboard.tsx`

**Purpose**: Detailed analytics for a single LP

**Props**:

```typescript
interface LPAnalyticsDashboardProps {
  landingPage: LandingPageStudio;
  analytics: LPAnalyticsSummary;
}
```

**Sections**:

- Summary cards: Visits, Conversions, Rate, Avg Time, Revenue
- Daily trend chart (Recharts line chart)
- Traffic sources breakdown (bar chart)
- Device breakdown (pie chart)
- Recent form submissions table
- A/B test results (if enabled)

### Pages

#### `src/app/(dashboard)/dashboard/sites/[siteId]/marketing/landing-pages/page.tsx`

**Server component** that fetches LPs + summary analytics, renders `<LPListEnhanced>`

#### `src/app/(dashboard)/dashboard/sites/[siteId]/marketing/landing-pages/new/page.tsx`

**Server component** that renders template picker + initializes new LP creation flow

#### `src/app/(dashboard)/dashboard/sites/[siteId]/marketing/landing-pages/[lpId]/page.tsx`

**Server component** that fetches LP + analytics, renders `<LPAnalyticsDashboard>`

#### `src/app/(dashboard)/dashboard/sites/[siteId]/marketing/landing-pages/[lpId]/edit/page.tsx`

**Server component** that fetches LP + site settings, renders `<LPEditorPage>`

### Testing Notes for LPB-02

1. **Template picker** — Opens when creating new LP, shows categories, loads templates
2. **Studio editor** — LP opens in Studio editor with content loaded
3. **Component palette** — LP components shown in "Landing Page" category
4. **Properties panel** — LP settings panel shows when no component selected
5. **Save** — Content saved to `content_studio`, settings saved to respective columns
6. **Publish** — Status changes to 'published', publishedAt set
7. **Preview** — Opens LP on site URL in new tab
8. **Back navigation** — Returns to LP list without losing data
9. **Unsaved changes** — Warning dialog on navigate away

---

## Phase LPB-03: URL Routing & Site Integration

### Purpose

Serve landing pages on the actual site URL (`/lp/[slug]`), integrate site header/footer toggling, and inherit site branding through the existing CSS custom property pipeline.

### Key Architecture: LP Routing Through Existing Catch-All

Rather than creating a separate route, we intercept the existing catch-all page at `src/app/site/[domain]/[[...slug]]/page.tsx`:

```
Visitor requests: https://mysite.com/lp/free-ebook-guide

[[...slug]]/page.tsx receives slug = ['lp', 'free-ebook-guide']
  ↓
Detects slug[0] === 'lp' → LP routing branch
  ↓
Queries mod_mktmod01_landing_pages WHERE site_id = site.id AND slug = 'free-ebook-guide'
  ↓
Returns LP data with content_studio (Studio format)
  ↓
Passes to CraftRenderer with LP-specific config:
  - themeSettings = LP branding override || site branding
  - showHeader = LP.show_header
  - showFooter = LP.show_footer
  - content = LP.content_studio
  ↓
StudioRenderer renders LP through normal component pipeline
  ↓
If show_header/show_footer: renders actual site Navbar/Footer components wrapping LP
```

### Files Changed

#### Modified: `src/app/site/[domain]/[[...slug]]/page.tsx`

Add LP routing branch in the `getSiteData` function:

```typescript
// After resolving the site, check if slug starts with 'lp/'
const normalizedSlug = slug?.join("/") || "";

if (normalizedSlug.startsWith("lp/")) {
  const lpSlug = normalizedSlug.replace("lp/", "");
  return getLandingPageData(site, lpSlug);
}

// ... existing page routing continues
```

New function `getLandingPageData`:

```typescript
async function getLandingPageData(site: SiteData, lpSlug: string) {
  const supabase = createAdminClient();

  const { data: lp } = await (supabase as any)
    .from("mod_mktmod01_landing_pages")
    .select("*")
    .eq("site_id", site.id)
    .eq("slug", lpSlug)
    .eq("status", "published")
    .single();

  if (!lp) return null;

  // Check time constraints
  if (!lp.is_evergreen) {
    const now = new Date();
    if (lp.starts_at && new Date(lp.starts_at) > now) return null;
    if (lp.ends_at && new Date(lp.ends_at) < now) {
      // LP expired — redirect if configured
      if (lp.expired_redirect_url) {
        redirect(lp.expired_redirect_url);
      }
      return null;
    }
  }

  // Check max conversions
  if (lp.max_conversions && lp.total_conversions >= lp.max_conversions) {
    if (lp.expired_redirect_url) {
      redirect(lp.expired_redirect_url);
    }
    return null;
  }

  return {
    type: "landing-page" as const,
    site,
    landingPage: mapRecord(lp),
  };
}
```

**SEO metadata for LP**:

```typescript
// In generateMetadata, add LP branch:
if (normalizedSlug.startsWith("lp/")) {
  const lpSlug = normalizedSlug.replace("lp/", "");
  // Query LP seo_config
  // Return metadata from seo_config fields
  // Set noindex if lp.seo_config.noIndex
}
```

#### Modified: `src/app/site/[domain]/[[...slug]]/craft-renderer.tsx`

Add LP-specific props:

```typescript
interface CraftRendererProps {
  content: string;
  themeSettings: Record<string, unknown> | null;
  siteSettings?: Record<string, unknown> | null;
  siteId?: string;
  pageId?: string;
  modules?: InstalledModuleInfo[];
  // NEW — LP mode props
  isLandingPage?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  landingPageId?: string;
  brandingOverride?: LPBrandingOverride | null;
}
```

**Behavior changes in LP mode**:

1. If `brandingOverride` is provided, merge it over `siteSettings` before passing to StudioRenderer
2. If `showHeader` is true, render the site's Navbar component above the LP content
3. If `showFooter` is true, render the site's Footer component below the LP content
4. Track visit on mount (fire tracking pixel or API call)

#### Header/Footer Rendering

When `showHeader`/`showFooter` is true, we need to render the site's actual Navbar/Footer components:

```typescript
// In CraftRenderer, when isLandingPage && showHeader:
// 1. Find the Navbar component from the site's homepage page_content
// 2. Render it above the LP content using ComponentRenderer
// OR
// 3. Render a simple header with site logo + minimal nav based on site.settings.navigation

// The simpler approach: Use the smart navigation system
// Import getModuleNavigation from smart-navigation.ts
// Build a simple header with logo + utility icons (cart, account)
```

### Branding Inheritance Flow

```
Site Settings (DB: sites.settings)
  ├── primary_color: "#2563eb"
  ├── secondary_color: "#7c3aed"
  ├── font_heading: "Inter"
  ├── font_body: "DM Sans"
  └── ...
        │
        ▼
LP Branding Override (DB: mod_mktmod01_landing_pages.branding_override)
  ├── If NULL → use site settings as-is
  └── If set  → merge over site settings (only override non-null fields)
        │
        ▼
Merged Branding Object
        │
        ▼
resolveBrandColors(themeSettings) → 146+ CSS custom properties
        │
        ▼
StudioRenderer injects CSS custom properties into iframe
        │
        ▼
LP components use var(--primary), var(--text-foreground), etc.
```

### Implementation:

```typescript
// In page.tsx, when rendering an LP:
function mergeLPBranding(
  siteSettings: Record<string, unknown> | null,
  brandingOverride?: LPBrandingOverride | null,
): Record<string, unknown> {
  if (!brandingOverride) return siteSettings || {};

  const merged = { ...(siteSettings || {}) };

  if (brandingOverride.primaryColor)
    merged.primary_color = brandingOverride.primaryColor;
  if (brandingOverride.secondaryColor)
    merged.secondary_color = brandingOverride.secondaryColor;
  if (brandingOverride.accentColor)
    merged.accent_color = brandingOverride.accentColor;
  if (brandingOverride.backgroundColor)
    merged.background_color = brandingOverride.backgroundColor;
  if (brandingOverride.textColor)
    merged.text_color = brandingOverride.textColor;
  if (brandingOverride.fontHeading)
    merged.font_heading = brandingOverride.fontHeading;
  if (brandingOverride.fontBody) merged.font_body = brandingOverride.fontBody;
  if (brandingOverride.borderRadius)
    merged.border_radius = brandingOverride.borderRadius;

  return merged;
}
```

### Visit Tracking

Add a client-side tracking script that fires on LP load:

```typescript
// In CraftRenderer, when isLandingPage:
useEffect(() => {
  if (!landingPageId || !siteId) return;

  // Generate or retrieve visitor ID from localStorage
  const visitorId = getOrCreateVisitorId();

  // Fire visit tracking
  fetch("/api/marketing/lp/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      siteId,
      landingPageId,
      visitorId,
      sessionId: getSessionId(),
      referrer: document.referrer,
      utmParams: getUtmParams(),
      deviceType: getDeviceType(),
    }),
  }).catch(() => {}); // Best-effort, don't block rendering
}, [landingPageId, siteId]);
```

### API Route for Tracking

#### New: `src/app/api/marketing/lp/track/route.ts`

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const {
    siteId,
    landingPageId,
    visitorId,
    sessionId,
    referrer,
    utmParams,
    deviceType,
  } = body;

  // Validate required fields
  if (!siteId || !landingPageId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Check if this visitor already visited this LP
  const { data: existing } = await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .select("id")
    .eq("landing_page_id", landingPageId)
    .eq("visitor_id", visitorId)
    .limit(1);

  const isUnique = !existing || existing.length === 0;

  // Insert visit record
  await (supabase as any).from("mod_mktmod01_lp_visits").insert({
    site_id: siteId,
    landing_page_id: landingPageId,
    visitor_id: visitorId,
    session_id: sessionId,
    is_unique: isUnique,
    utm_source: utmParams?.utm_source || null,
    utm_medium: utmParams?.utm_medium || null,
    utm_campaign: utmParams?.utm_campaign || null,
    referrer: referrer || null,
    device_type: deviceType || null,
  });

  // Increment landing page visit counter
  await (supabase as any).rpc("increment_lp_visit", {
    lp_id: landingPageId,
  });

  return NextResponse.json({ success: true, isUnique });
}
```

### Database Function for Atomic Visit Counter

```sql
-- LPB-03: Atomic visit counter
CREATE OR REPLACE FUNCTION increment_lp_visit(lp_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE mod_mktmod01_landing_pages
  SET total_visits = total_visits + 1,
      updated_at = now()
  WHERE id = lp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Testing Notes for LPB-03

1. **URL routing** — Visit `https://site-domain.com/lp/[slug]` → renders LP content
2. **404 handling** — Non-existent LP slug → shows site 404 page
3. **Branding inheritance** — LP uses site colors when no override set
4. **Branding override** — LP uses override colors when set
5. **Header toggle** — Show/hide site header based on LP setting
6. **Footer toggle** — Show/hide site footer based on LP setting
7. **Time constraints** — Expired LP shows redirect or 404
8. **Max conversions** — LP with max conversions reached shows redirect or 404
9. **Visit tracking** — Visit record created in `mod_mktmod01_lp_visits`
10. **SEO metadata** — LP has proper meta tags from seo_config
11. **Old API route** — Existing `/api/marketing/lp/[siteId]/[slug]` still works (backward compat)

---

## Phase LPB-04: Hero Components (Split Hero, Full-Bleed, Video Background, Gradient Overlays)

### Purpose

Build the most impactful LP component — the Hero section — with 6 layout variants that match industry-leading landing page designs. This is the component that creates the "above the fold" experience visitors see first, and it MUST support the split hero+form layouts shown in the user's reference screenshots.

### Hero Variants (6 Types)

#### Variant 1: `split-left` — Text Left, Image/Form Right

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
│  │  Pre-headline tag         │  │                              │   │
│  │                           │  │   [Image/Video/Form]         │   │
│  │  Main Headline            │  │                              │   │
│  │  Goes Here                │  │   OR                         │   │
│  │                           │  │                              │   │
│  │  Supporting paragraph     │  │   ┌──────────────────────┐  │   │
│  │  text with value prop     │  │   │  Form Title           │  │   │
│  │                           │  │   │  [Email           ]   │  │   │
│  │  [CTA Button]  [Learn ▸] │  │   │  [Name            ]   │  │   │
│  │                           │  │   │  [Get Started  ▸]     │  │   │
│  │  ✓ Benefit 1  ✓ Benefit 2│  │   └──────────────────────┘  │   │
│  └──────────────────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

Uses the existing **Columns** studio component internally (2 columns, 60/40 or 50/50 split).

#### Variant 2: `split-right` — Image/Form Left, Text Right

Mirror of split-left (Columns reversed).

#### Variant 3: `full-bleed` — Full Background Image with Text Overlay

```
┌────────────────────────────────────────────────────────────────────┐
│                    ◤ Background Image Fills ◥                      │
│                    ◤ Full Width Edge to Edge ◥                      │
│                                                                    │
│            ┌──────────────────────────────────┐                    │
│            │                                   │                    │
│            │     Main Headline Goes Here        │                    │
│            │     Supporting paragraph           │                    │
│            │                                   │                    │
│            │     [CTA Button]   [Secondary ▸]  │                    │
│            │                                   │                    │
│            └──────────────────────────────────┘                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

#### Variant 4: `video-bg` — Video Background with Text Overlay

Same layout as full-bleed but with auto-playing muted video in background. Falls back to poster image on mobile.

#### Variant 5: `gradient-overlay` — Gradient Over Image with Centered Content

Like full-bleed but with a smooth gradient overlay (configurable direction and colors).

#### Variant 6: `minimal` — Clean, No Background, Just Text and CTA

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                                                                    │
│                  Pre-headline tag                                   │
│                                                                    │
│            The Main Headline Goes Here                              │
│            Clean and Focused                                        │
│                                                                    │
│            Supporting paragraph with clear value proposition.       │
│            This variant is best for focused PPC campaigns.         │
│                                                                    │
│            [Get Started Free ▸]                                    │
│                                                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Component File: `src/components/studio/blocks/landing-page/lp-hero-render.tsx`

**This file renders the LPHero component for BOTH the editor preview and the published page.**

```typescript
interface LPHeroProps {
  variant: LPHeroVariant;
  headline: string;
  subheadline?: string;
  preheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  backgroundImage?: string;
  videoUrl?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  showForm?: boolean;
  formPosition?: "right" | "left" | "overlay" | "below";
  formSettings?: LPFormSettings;
  heroImage?: string;
  minHeight?: "auto" | "screen" | "80vh" | "60vh";
  verticalAlign?: "top" | "center" | "bottom";
  textAlign?: "left" | "center" | "right";
  contentMaxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  // Benefit list (optional)
  benefits?: string[];
  // Visual options
  animate?: boolean;
  parallax?: boolean;
  // Padding
  paddingTop?: number;
  paddingBottom?: number;
}
```

**Render Logic**:

```typescript
export function LPHeroRender(props: LPHeroProps) {
  const {
    variant = 'split-left',
    headline = 'Build Something Amazing',
    subheadline = '',
    preheadline = '',
    ...rest
  } = props;

  switch (variant) {
    case 'split-left':
    case 'split-right':
      return <SplitHero {...props} />;
    case 'full-bleed':
      return <FullBleedHero {...props} />;
    case 'video-bg':
      return <VideoBackgroundHero {...props} />;
    case 'gradient-overlay':
      return <GradientOverlayHero {...props} />;
    case 'minimal':
      return <MinimalHero {...props} />;
    default:
      return <SplitHero {...props} />;
  }
}
```

**SplitHero sub-component**:

```typescript
function SplitHero(props: LPHeroProps) {
  const isReversed = props.variant === 'split-right';

  return (
    <section
      className="w-full"
      style={{
        minHeight: getMinHeight(props.minHeight),
        paddingTop: props.paddingTop ?? 80,
        paddingBottom: props.paddingBottom ?? 80,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center",
          isReversed && "lg:[direction:rtl]"
        )}>
          {/* Text Column */}
          <div className={cn("lg:[direction:ltr]", props.textAlign === 'center' && 'text-center')}>
            {props.preheadline && (
              <span className="inline-block text-sm font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--primary)' }}>
                {props.preheadline}
              </span>
            )}
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
              {props.headline}
            </h1>
            {props.subheadline && (
              <p className="mt-6 text-lg leading-8"
                 style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-body)' }}>
                {props.subheadline}
              </p>
            )}
            {/* Benefits list */}
            {props.benefits && props.benefits.length > 0 && (
              <ul className="mt-6 space-y-2">
                {props.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--primary)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" />
                    </svg>
                    <span style={{ color: 'var(--foreground)' }}>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}
            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              {props.ctaText && (
                <a href={props.ctaUrl || '#'}
                   className="inline-flex items-center rounded-lg px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                   style={{ backgroundColor: 'var(--primary)' }}>
                  {props.ctaText}
                </a>
              )}
              {props.ctaSecondaryText && (
                <a href={props.ctaSecondaryUrl || '#'}
                   className="inline-flex items-center rounded-lg px-6 py-3 text-base font-semibold border-2 hover:opacity-90 transition-all"
                   style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                  {props.ctaSecondaryText}
                </a>
              )}
            </div>
          </div>

          {/* Visual Column */}
          <div className="lg:[direction:ltr]">
            {props.showForm ? (
              <LPFormInline formSettings={props.formSettings} />
            ) : props.heroImage ? (
              <img src={props.heroImage} alt="" className="rounded-2xl shadow-2xl w-full" />
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Important rendering rules**:

- All colors use CSS custom properties (`var(--primary)`, `var(--foreground)`, etc.)
- Fonts use CSS custom properties (`var(--font-heading)`, `var(--font-body)`)
- This ensures the hero automatically inherits site branding
- No `dark:` Tailwind variants — storefront is always light mode
- Responsive with `grid-cols-1 lg:grid-cols-2` for mobile-first layout

### Default Props per Variant

```typescript
export const LP_HERO_DEFAULTS: Record<LPHeroVariant, Partial<LPHeroProps>> = {
  "split-left": {
    headline: "Grow Your Business with Our Platform",
    subheadline:
      "Join thousands of successful businesses that use our tools to increase revenue and streamline operations.",
    preheadline: "The #1 Platform for Growth",
    ctaText: "Start Free Trial",
    ctaUrl: "#",
    ctaSecondaryText: "Watch Demo",
    ctaSecondaryUrl: "#",
    showForm: false,
    minHeight: "auto",
    textAlign: "left",
    contentMaxWidth: "xl",
    benefits: [
      "Free 14-day trial",
      "No credit card required",
      "Cancel anytime",
    ],
  },
  "split-right": {
    headline: "Grow Your Business with Our Platform",
    subheadline: "Join thousands of successful businesses.",
    ctaText: "Get Started",
    showForm: true,
    formPosition: "left",
    minHeight: "auto",
    textAlign: "left",
  },
  "full-bleed": {
    headline: "Transform Your Business Today",
    subheadline: "Everything you need to succeed, in one powerful platform.",
    ctaText: "Get Started Free",
    ctaSecondaryText: "Learn More",
    minHeight: "screen",
    textAlign: "center",
    overlayColor: "#000000",
    overlayOpacity: 50,
  },
  "video-bg": {
    headline: "See the Difference",
    subheadline: "Watch how our platform works and start your journey today.",
    ctaText: "Start Now",
    minHeight: "screen",
    textAlign: "center",
    overlayColor: "#000000",
    overlayOpacity: 40,
  },
  "gradient-overlay": {
    headline: "The Smart Way to Grow",
    subheadline: "Powerful tools, beautiful results.",
    ctaText: "Join Now",
    minHeight: "80vh",
    textAlign: "center",
    overlayColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    overlayOpacity: 80,
  },
  minimal: {
    headline: "Simple. Powerful. Effective.",
    subheadline: "The tools you need without the complexity you don't.",
    ctaText: "Get Started",
    minHeight: "auto",
    textAlign: "center",
    contentMaxWidth: "md",
  },
};
```

### Testing Notes for LPB-04

1. **All 6 variants render** — Each variant type produces correct layout
2. **Split hero** — Text on one side, image/form on the other, responsive collapse on mobile
3. **Full-bleed** — Background image fills section, text is centered with overlay
4. **Video background** — Video auto-plays muted, poster fallback on mobile
5. **Gradient overlay** — Gradient renders over image with configurable direction/colors
6. **Minimal** — Clean centered text with no background
7. **Form integration** — When `showForm: true`, inline form renders in the hero
8. **CSS variables** — All colors/fonts use CSS custom properties (branding inheritance works)
9. **Responsive** — All variants collapse to single column on mobile
10. **Benefits list** — Check marks render with benefit text
11. **CTA buttons** — Primary and secondary CTAs render with correct styles
12. **Property editing** — All props editable in Studio properties panel
13. **Editor preview** — Hero renders correctly in Studio editor iframe

---

## Phase LPB-05: Advanced Form System (Multi-Field Forms, Conditional Logic, CRM Integration)

### Purpose

Build a powerful LP form component that goes far beyond the current 5 hardcoded fields. This is the primary conversion mechanism — every form submission captures leads, creates subscribers, optionally creates CRM contacts, and fires automation events.

### Key Architecture: Form as Studio Component

The LP Form is a Studio component (registered in the component registry). It stores its entire configuration in Studio component props. When rendered on the public site, it:

1. Renders all configured fields with validation
2. Submits to `/api/marketing/lp/submit` endpoint
3. Server-side: validates, stores submission, creates subscriber, creates CRM contact
4. Fires automation event: `marketing.landing_page.form_submitted`
5. Shows success message or redirects

### Form Component: `src/components/studio/blocks/landing-page/lp-form-render.tsx`

**Props** (Studio component props):

```typescript
interface LPFormRenderProps {
  /** Form display variant */
  variant: "inline" | "card" | "floating" | "slide-in" | "minimal";
  /** Form heading */
  title?: string;
  /** Form subtitle/description */
  subtitle?: string;

  /** Form fields configuration */
  fields: LPFormField[];
  /** Submit button text */
  submitButtonText: string;
  /** Submit button variant */
  submitButtonStyle?: "solid" | "gradient" | "outline";
  /** Submit button full width */
  submitButtonFullWidth?: boolean;

  /** Success behavior */
  successAction: "message" | "redirect" | "close";
  successMessage?: string;
  successRedirectUrl?: string;

  /** Subscriber integration */
  createSubscriber?: boolean;
  subscriberTags?: string[];
  mailingListId?: string;
  sequenceId?: string;

  /** CRM integration */
  createCrmContact?: boolean;

  /** Double opt-in */
  doubleOptIn?: boolean;

  /** GDPR consent */
  gdprConsentText?: string;
  showGdprConsent?: boolean;

  /** Anti-spam */
  enableHoneypot?: boolean;

  /** Visual options */
  cardBackground?: string;
  cardBorder?: boolean;
  cardBorderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  cardShadow?: "none" | "sm" | "md" | "lg" | "xl";
  fieldStyle?: "default" | "floating-label" | "underline";
  direction?: "vertical" | "horizontal";
  columns?: number;
  maxWidth?: string;
  padding?: string;

  /** Notification */
  notifyOnSubmission?: boolean;
  notificationEmails?: string[];

  /** Rate limiting */
  rateLimitPerHour?: number;

  /** Hidden — set by LP container */
  _siteId?: string;
  _landingPageId?: string;
  _componentId?: string;
}
```

### Form Variants

#### Variant 1: `card` — Most Common LP Form

```
┌──────────────────────────────────┐
│                                  │
│  📋 Get Your Free Ebook          │
│  Fill out the form to download    │
│                                  │
│  ┌──────────────────────────┐   │
│  │ First Name               │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ Email Address *           │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ Company                   │   │
│  └──────────────────────────┘   │
│                                  │
│  ┌──────────────────────────┐   │
│  │    Download Now ▸         │   │
│  └──────────────────────────┘   │
│                                  │
│  🔒 We respect your privacy.     │
│                                  │
└──────────────────────────────────┘
```

#### Variant 2: `inline` — Embedded Within Content (No Card)

Fields and button render directly within the page content, no card wrapper.

#### Variant 3: `floating` — Floating Card with Shadow

Like `card` but with absolute positioning capability and deeper shadow/elevation.

#### Variant 4: `slide-in` — Slide-in from Side (Trigger-Based)

Slides in from the right edge when triggered (scroll threshold, time delay, or exit intent).

#### Variant 5: `minimal` — Single Line (Email + Button)

```
┌──────────────────────────────────────────────────────────────┐
│  [  Enter your email address     ]  [ Get Started ▸ ]        │
└──────────────────────────────────────────────────────────────┘
```

### Conditional Field Visibility

Fields can be shown/hidden based on other field values:

```typescript
// Example: Show "Company Size" only when "I'm a business" is selected
const fields: LPFormField[] = [
  {
    id: "type",
    type: "select",
    label: "I am...",
    required: true,
    options: [
      { label: "An individual", value: "individual" },
      { label: "A business", value: "business" },
    ],
  },
  {
    id: "company_size",
    type: "select",
    label: "Company Size",
    required: true,
    options: [
      { label: "1-10", value: "small" },
      { label: "11-50", value: "medium" },
      { label: "50+", value: "large" },
    ],
    showWhen: {
      fieldId: "type",
      operator: "equals",
      value: "business",
    },
  },
];
```

**Implementation**: In the render function:

```typescript
function shouldShowField(
  field: LPFormField,
  formData: Record<string, string>,
): boolean {
  if (!field.showWhen) return true;
  const { fieldId, operator, value } = field.showWhen;
  const currentValue = formData[fieldId] || "";

  switch (operator) {
    case "equals":
      return currentValue === value;
    case "not_equals":
      return currentValue !== value;
    case "contains":
      return currentValue.includes(value || "");
    case "not_empty":
      return currentValue.trim() !== "";
    default:
      return true;
  }
}
```

### Field Types Supported

| Type       | Input Element             | Notes                                    |
| ---------- | ------------------------- | ---------------------------------------- |
| `text`     | `<input type="text">`     | General text input                       |
| `email`    | `<input type="email">`    | Email validation built-in                |
| `phone`    | `<input type="tel">`      | Phone format validation                  |
| `number`   | `<input type="number">`   | Numeric only                             |
| `textarea` | `<textarea>`              | Multi-line text                          |
| `select`   | `<select>`                | Dropdown with options                    |
| `checkbox` | `<input type="checkbox">` | Single or group (with options)           |
| `radio`    | `<input type="radio">`    | Radio group with options                 |
| `date`     | `<input type="date">`     | Date picker                              |
| `file`     | `<input type="file">`     | File upload (stored in Supabase Storage) |
| `hidden`   | `<input type="hidden">`   | Hidden field (for UTM passthrough, etc.) |

### Client-Side Form Handler

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  // 1. Client-side validation
  const errors = validateFields(fields, formData);
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }

  // 2. Check honeypot
  if (enableHoneypot && formData["_hp_field"]) {
    // Bot detected — silently succeed (don't reveal the trap)
    setSubmitted(true);
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await fetch("/api/marketing/lp/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: _siteId,
        landingPageId: _landingPageId,
        formComponentId: _componentId,
        data: formData,
        utm: getUtmParams(),
        referrer: document.referrer,
        timeOnPage: getTimeOnPage(),
        scrollDepth: getScrollDepth(),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Submission failed");
    }

    // 3. Handle success
    switch (successAction) {
      case "redirect":
        window.location.href = successRedirectUrl || "/";
        break;
      case "message":
        setSubmitted(true);
        break;
      case "close":
        setSubmitted(true);
        // If slide-in or floating, trigger close animation
        break;
    }
  } catch (error) {
    setSubmitError(
      error instanceof Error ? error.message : "Something went wrong",
    );
  } finally {
    setIsSubmitting(false);
  }
}
```

### Server-Side Submission API Route

#### `src/app/api/marketing/lp/submit/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapRecord } from "@/lib/map-db-record";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();

  const {
    siteId,
    landingPageId,
    formComponentId,
    data,
    utm,
    referrer,
    timeOnPage,
    scrollDepth,
  } = body;

  // 1. Validate required fields
  if (!siteId || !landingPageId || !formComponentId || !data) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // 2. Fetch the LP to get form settings
  const { data: lp } = await (supabase as any)
    .from("mod_mktmod01_landing_pages")
    .select("*, content_studio")
    .eq("id", landingPageId)
    .single();

  if (!lp) {
    return NextResponse.json(
      { error: "Landing page not found" },
      { status: 404 },
    );
  }

  // 3. Find the form component in the Studio tree to get its settings
  const formComponent = findComponentInTree(lp.content_studio, formComponentId);
  if (!formComponent) {
    return NextResponse.json(
      { error: "Form component not found" },
      { status: 404 },
    );
  }

  const formSettings = formComponent.props as LPFormRenderProps;

  // 4. Server-side field validation
  const validationErrors = validateSubmission(formSettings.fields, data);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", details: validationErrors },
      { status: 400 },
    );
  }

  // 5. Rate limiting check
  if (formSettings.rateLimitPerHour) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const isRateLimited = await checkRateLimit(
      supabase,
      landingPageId,
      ip,
      formSettings.rateLimitPerHour,
    );
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 },
      );
    }
  }

  // 6. Extract known fields
  const email = data.email || data.Email || null;
  const name =
    data.name || data.Name || data.first_name || data.firstName || null;
  const phone = data.phone || data.Phone || data.telephone || null;

  // 7. Check for duplicate (by email for this LP)
  let isDuplicate = false;
  if (email) {
    const { data: existing } = await (supabase as any)
      .from("mod_mktmod01_lp_form_submissions")
      .select("id")
      .eq("landing_page_id", landingPageId)
      .eq("email", email)
      .limit(1);
    isDuplicate = existing && existing.length > 0;
  }

  // 8. Detect device type
  const userAgent = request.headers.get("user-agent") || "";
  const deviceType = detectDeviceType(userAgent);

  // 9. Store submission
  const { data: submission, error: subError } = await (supabase as any)
    .from("mod_mktmod01_lp_form_submissions")
    .insert({
      site_id: siteId,
      landing_page_id: landingPageId,
      form_component_id: formComponentId,
      data: data,
      email,
      name,
      phone,
      utm_source: utm?.utm_source || null,
      utm_medium: utm?.utm_medium || null,
      utm_campaign: utm?.utm_campaign || null,
      utm_term: utm?.utm_term || null,
      utm_content: utm?.utm_content || null,
      referrer: referrer || null,
      ip_address: request.headers.get("x-forwarded-for") || null,
      user_agent: userAgent,
      device_type: deviceType,
      time_on_page: timeOnPage || null,
      scroll_depth: scrollDepth || null,
      is_duplicate: isDuplicate,
    })
    .select()
    .single();

  if (subError) {
    console.error("LP form submission error:", subError);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 },
    );
  }

  // 10. Create subscriber if configured
  let subscriberId: string | null = null;
  if (formSettings.createSubscriber && email) {
    subscriberId = await createOrUpdateSubscriber(supabase, {
      siteId,
      email,
      name,
      phone,
      tags: formSettings.subscriberTags,
      mailingListId: formSettings.mailingListId,
      sequenceId: formSettings.sequenceId,
      doubleOptIn: formSettings.doubleOptIn,
      source: `landing-page:${lp.slug}`,
    });

    // Update submission with subscriber ID
    if (subscriberId) {
      await (supabase as any)
        .from("mod_mktmod01_lp_form_submissions")
        .update({ subscriber_id: subscriberId })
        .eq("id", submission.id);
    }
  }

  // 11. Create CRM contact if configured
  let crmContactId: string | null = null;
  if (formSettings.createCrmContact && email) {
    crmContactId = await createOrUpdateCrmContact(supabase, {
      siteId,
      email,
      name,
      phone,
      data, // All form data for custom field mapping
      source: `landing-page:${lp.slug}`,
    });

    if (crmContactId) {
      await (supabase as any)
        .from("mod_mktmod01_lp_form_submissions")
        .update({ crm_contact_id: crmContactId })
        .eq("id", submission.id);
    }
  }

  // 12. Increment conversion counter
  await (supabase as any).rpc("increment_lp_conversion", {
    lp_id: landingPageId,
  });

  // 13. Update visit as converted (if visitor tracking is available)
  // Uses the visitor_id from the client to mark the visit as converted

  // 14. Fire automation event
  await fireAutomationEvent(supabase, {
    siteId,
    eventType: "marketing.landing_page.form_submitted",
    data: {
      landingPageId,
      landingPageSlug: lp.slug,
      landingPageTitle: lp.title,
      formComponentId,
      submissionId: submission.id,
      email,
      name,
      phone,
      subscriberId,
      crmContactId,
      utmSource: utm?.utm_source,
      utmMedium: utm?.utm_medium,
      utmCampaign: utm?.utm_campaign,
    },
  });

  // 15. Send notification email if configured
  if (
    formSettings.notifyOnSubmission &&
    formSettings.notificationEmails?.length
  ) {
    await sendSubmissionNotification({
      emails: formSettings.notificationEmails,
      landingPageTitle: lp.title,
      submissionData: data,
      submittedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    submissionId: submission.id,
  });
}
```

### Helper Functions Needed

```typescript
// Find a component by ID in the Studio component tree
function findComponentInTree(
  tree: unknown,
  componentId: string,
): unknown | null {
  // Recursively traverse the Studio tree to find the component with matching ID
  // Studio tree format: { type, props, children: [] }
}

// Create or update subscriber from form data
async function createOrUpdateSubscriber(
  supabase: any,
  input: {
    siteId: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    tags?: string[];
    mailingListId?: string;
    sequenceId?: string;
    doubleOptIn?: boolean;
    source: string;
  },
): Promise<string | null> {
  // Check if subscriber exists (by email + siteId)
  // If exists: update, add tags, enroll in sequence
  // If not: create new subscriber, add to list, enroll in sequence
  // Return subscriber ID
}

// Create or update CRM contact
async function createOrUpdateCrmContact(
  supabase: any,
  input: {
    siteId: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    data: Record<string, unknown>;
    source: string;
  },
): Promise<string | null> {
  // Check if CRM contact exists (by email)
  // If exists: update fields
  // If not: create new contact
  // Return contact ID
}

// Rate limiting check
async function checkRateLimit(
  supabase: any,
  landingPageId: string,
  ip: string,
  maxPerHour: number,
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("mod_mktmod01_lp_form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("landing_page_id", landingPageId)
    .eq("ip_address", ip)
    .gte("created_at", oneHourAgo);
  return (count || 0) >= maxPerHour;
}

// Detect device type from user agent
function detectDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone/i.test(userAgent)) return "mobile";
  if (/iPad|Tablet/i.test(userAgent)) return "tablet";
  return "desktop";
}
```

### Database Function for Atomic Conversion Counter

```sql
-- LPB-05: Atomic conversion counter
CREATE OR REPLACE FUNCTION increment_lp_conversion(lp_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE mod_mktmod01_landing_pages
  SET total_conversions = total_conversions + 1,
      conversion_rate = CASE
        WHEN total_visits > 0
        THEN ROUND((total_conversions + 1)::numeric / total_visits * 100, 2)
        ELSE 0
      END,
      updated_at = now()
  WHERE id = lp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Automation Events (New)

Add to `src/modules/automation/lib/event-types.ts`:

```typescript
{
  type: 'marketing.landing_page.form_submitted',
  label: 'LP Form Submitted',
  description: 'A visitor submitted a form on a landing page',
  category: 'marketing',
  properties: [
    'landingPageId', 'landingPageSlug', 'landingPageTitle',
    'formComponentId', 'submissionId',
    'email', 'name', 'phone',
    'subscriberId', 'crmContactId',
    'utmSource', 'utmMedium', 'utmCampaign',
  ],
},
{
  type: 'marketing.landing_page.visited',
  label: 'LP Page Visited',
  description: 'A visitor landed on a landing page',
  category: 'marketing',
  properties: [
    'landingPageId', 'landingPageSlug', 'landingPageTitle',
    'visitorId', 'isUnique', 'utmSource', 'referrer', 'deviceType',
  ],
},
{
  type: 'marketing.landing_page.published',
  label: 'LP Published',
  description: 'A landing page was published',
  category: 'marketing',
  properties: ['landingPageId', 'landingPageSlug', 'landingPageTitle', 'publishedBy'],
},
```

### Testing Notes for LPB-05

1. **Form renders** — All 5 variants produce correct visual output
2. **Field types** — All 11 field types render correctly
3. **Validation** — Required fields show errors, email/phone patterns validated
4. **Conditional fields** — Fields show/hide based on conditions
5. **Submission** — Form data POSTed to `/api/marketing/lp/submit` successfully
6. **Subscriber creation** — Email submissions create subscribers in `mod_mktmod01_subscribers`
7. **CRM contact** — Form data creates/updates CRM contacts
8. **Duplicate detection** — Same email on same LP flagged as duplicate
9. **Rate limiting** — Excessive submissions from same IP blocked (429)
10. **Honeypot** — Bot submissions silently accepted but not processed
11. **Success message** — Shows configured success message after submit
12. **Redirect** — Redirects to configured URL after submit
13. **GDPR consent** — Consent checkbox renders when configured
14. **Notification email** — Agency receives email on new submission
15. **Automation event** — `marketing.landing_page.form_submitted` fires
16. **Conversion counter** — LP total_conversions incremented

---

## Phase LPB-06: Conversion Components (Logo Bars, Trust Badges, Countdown, Social Proof, Pricing Tables)

### Purpose

Build the supporting conversion components that surround the hero and form. These are the elements that build trust, create urgency, and provide social proof — all critical for high-converting landing pages.

### Component 1: `LPLogoBar` — "As Seen On" / "Trusted By" Logo Display

#### `src/components/studio/blocks/landing-page/lp-logo-bar-render.tsx`

```typescript
interface LPLogoBarProps {
  /** Section title */
  title?: string;
  /** Logo items */
  logos: Array<{
    imageUrl: string;
    altText: string;
    link?: string;
  }>;
  /** Display variant */
  variant: "scroll" | "grid" | "carousel";
  /** Show logos in grayscale */
  grayscale?: boolean;
  /** Max logo height in px */
  maxHeight?: number;
  /** Background color */
  backgroundColor?: string;
  /** Logo spacing */
  spacing?: "tight" | "normal" | "wide";
  /** Full width (edge to edge) */
  fullWidth?: boolean;
  /** Padding */
  paddingY?: number;
}
```

**Variants**:

- `grid`: Static grid layout, wrapping on mobile (logos shown in a flexbox row)
- `scroll`: Infinite horizontal auto-scroll (CSS animation, no JS dependencies)
- `carousel`: Controlled carousel with prev/next buttons

**Default Props**:

```typescript
export const LP_LOGO_BAR_DEFAULTS: LPLogoBarProps = {
  title: "Trusted by leading companies",
  logos: [
    { imageUrl: "/placeholder-logo-1.svg", altText: "Company 1" },
    { imageUrl: "/placeholder-logo-2.svg", altText: "Company 2" },
    { imageUrl: "/placeholder-logo-3.svg", altText: "Company 3" },
    { imageUrl: "/placeholder-logo-4.svg", altText: "Company 4" },
    { imageUrl: "/placeholder-logo-5.svg", altText: "Company 5" },
  ],
  variant: "grid",
  grayscale: true,
  maxHeight: 40,
  spacing: "normal",
  fullWidth: false,
  paddingY: 48,
};
```

**Scroll variant implementation** (CSS-only infinite scroll):

```css
@keyframes lp-logo-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.lp-logo-scroll-track {
  animation: lp-logo-scroll 30s linear infinite;
}
```

The logos array is duplicated in the DOM so the scroll appears infinite.

### Component 2: `LPTrustBadges` — Security, Guarantee, and Certification Badges

#### `src/components/studio/blocks/landing-page/lp-trust-badges-render.tsx`

```typescript
interface LPTrustBadgesProps {
  /** Badge items */
  badges: Array<{
    /** Lucide icon name */
    icon: string;
    /** Badge title */
    title: string;
    /** Badge description */
    description?: string;
  }>;
  /** Display variant */
  variant: "horizontal" | "grid" | "inline";
  /** Icon color */
  iconColor?: string;
  /** Show descriptions */
  showDescriptions?: boolean;
  /** Icon size */
  iconSize?: "sm" | "md" | "lg";
  /** Background color */
  backgroundColor?: string;
  /** Padding */
  paddingY?: number;
}
```

**Default Props**:

```typescript
export const LP_TRUST_BADGES_DEFAULTS: LPTrustBadgesProps = {
  badges: [
    {
      icon: "ShieldCheck",
      title: "Secure Payment",
      description: "Your data is encrypted and protected",
    },
    {
      icon: "BadgeCheck",
      title: "30-Day Guarantee",
      description: "Full refund if you're not satisfied",
    },
    {
      icon: "Clock",
      title: "24/7 Support",
      description: "Our team is always here to help",
    },
    {
      icon: "Award",
      title: "Award Winning",
      description: "Recognized by industry leaders",
    },
  ],
  variant: "horizontal",
  showDescriptions: true,
  iconSize: "md",
  paddingY: 48,
};
```

**Variants**:

- `horizontal`: Badges in a row (wraps on mobile)
- `grid`: 2x2 or 4-column grid with larger icons
- `inline`: Small inline badges (like payment method icons)

### Component 3: `LPCountdown` — Urgency Countdown Timer

#### `src/components/studio/blocks/landing-page/lp-countdown-render.tsx`

```typescript
interface LPCountdownProps {
  /** Target date (ISO string) for fixed mode */
  targetDate?: string;
  /** Countdown mode */
  mode: "fixed" | "evergreen";
  /** Days for evergreen mode (from first visit) */
  evergreenDays?: number;
  /** Hours for evergreen mode */
  evergreenHours?: number;
  /** Minutes for evergreen mode */
  evergreenMinutes?: number;
  /** What happens when countdown expires */
  expiredAction: "hide" | "redirect" | "show-message";
  /** Message when expired */
  expiredMessage?: string;
  /** Redirect URL when expired */
  expiredRedirectUrl?: string;
  /** Display variant */
  variant: "boxes" | "inline" | "minimal" | "circular";
  /** Show labels (Days, Hours, Minutes, Seconds) */
  showLabels?: boolean;
  /** Label style */
  labelStyle?: "full" | "short" | "single-letter";
  /** Urgency text */
  urgencyText?: string;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Accent color */
  accentColor?: string;
  /** Show seconds */
  showSeconds?: boolean;
  /** Padding */
  paddingY?: number;
}
```

**Key Implementation Details**:

- **Fixed mode**: Classic countdown to a specific date/time
- **Evergreen mode**: Each visitor gets their own countdown starting from their first visit
  - Stored in `localStorage` with key `lp_countdown_[componentId]`
  - Each new visitor sees the full countdown
  - Returning visitors continue from where they left off
  - This is essential for "limited time offer" LPs that aren't actually time-limited

**Countdown logic**:

```typescript
function useCountdown(props: LPCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    let targetMs: number;

    if (props.mode === "fixed" && props.targetDate) {
      targetMs = new Date(props.targetDate).getTime();
    } else if (props.mode === "evergreen") {
      // Get or set first visit timestamp in localStorage
      const key = `lp_countdown_${props._componentId || "default"}`;
      let firstVisit = localStorage.getItem(key);
      if (!firstVisit) {
        firstVisit = Date.now().toString();
        localStorage.setItem(key, firstVisit);
      }
      const durationMs =
        (props.evergreenDays || 0) * 86400000 +
        (props.evergreenHours || 0) * 3600000 +
        (props.evergreenMinutes || 0) * 60000;
      targetMs = parseInt(firstVisit) + durationMs;
    } else {
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = targetMs - now;

      if (diff <= 0) {
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [
    props.mode,
    props.targetDate,
    props.evergreenDays,
    props.evergreenHours,
    props.evergreenMinutes,
  ]);

  return { timeLeft, isExpired };
}
```

**Variant: `boxes`**:

```
  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
  │  02 │  │  14 │  │  37 │  │  59 │
  │ Days│  │Hours│  │ Min │  │ Sec │
  └─────┘  └─────┘  └─────┘  └─────┘
```

**Variant: `circular`**:
SVG circles with stroke-dasharray animation representing time remaining.

### Component 4: `LPTestimonialWall` — Testimonial Grid/Carousel

#### `src/components/studio/blocks/landing-page/lp-testimonial-wall-render.tsx`

```typescript
interface LPTestimonialWallProps {
  /** Testimonial items */
  testimonials: Array<{
    /** Person name */
    name: string;
    /** Person role/title */
    role?: string;
    /** Company name */
    company?: string;
    /** Testimonial text */
    text: string;
    /** Avatar image URL */
    imageUrl?: string;
    /** Star rating (1-5) */
    rating?: number;
  }>;
  /** Display variant */
  variant: "grid" | "carousel" | "masonry" | "single-featured";
  /** Grid columns */
  columns?: number;
  /** Show star ratings */
  showRatings?: boolean;
  /** Show avatar images */
  showImages?: boolean;
  /** Max testimonials to display */
  maxVisible?: number;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Background color */
  backgroundColor?: string;
  /** Card style */
  cardStyle?: "default" | "bordered" | "shadow" | "flat";
  /** Quote icon */
  showQuoteIcon?: boolean;
  /** Padding */
  paddingY?: number;
}
```

**Default Props**:

```typescript
export const LP_TESTIMONIAL_WALL_DEFAULTS: LPTestimonialWallProps = {
  testimonials: [
    {
      name: "Sarah Johnson",
      role: "CEO",
      company: "TechStart",
      text: "This platform transformed our business. We saw a 300% increase in conversions within the first month.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Marketing Director",
      company: "GrowthCo",
      text: "The best tool we've ever used for landing pages. Simple yet incredibly powerful.",
      rating: 5,
    },
    {
      name: "Emily Davis",
      role: "Founder",
      company: "DesignLab",
      text: "I was skeptical at first, but the results speak for themselves. Highly recommended!",
      rating: 5,
    },
  ],
  variant: "grid",
  columns: 3,
  showRatings: true,
  showImages: true,
  heading: "What Our Customers Say",
  cardStyle: "shadow",
  showQuoteIcon: true,
  paddingY: 64,
};
```

**Variants**:

- `grid`: Equal-height cards in a responsive grid
- `carousel`: Horizontal carousel with auto-play and nav dots
- `masonry`: Pinterest-style staggered layout (CSS columns)
- `single-featured`: One large testimonial with photo, rotating through items

### Component 5: `LPPricingTable` — Pricing Comparison Table

#### `src/components/studio/blocks/landing-page/lp-pricing-table-render.tsx`

```typescript
interface LPPricingTableProps {
  /** Pricing plans */
  plans: Array<{
    /** Plan name */
    name: string;
    /** Price (display string, e.g., "K99" or "$29") */
    price: string;
    /** Price period (e.g., "/month", "/year") */
    period?: string;
    /** Plan description */
    description?: string;
    /** Feature list */
    features: Array<{
      text: string;
      included: boolean;
    }>;
    /** CTA button text */
    ctaText: string;
    /** CTA button URL */
    ctaUrl: string;
    /** Is this the popular/recommended plan? */
    isPopular?: boolean;
    /** Badge text for popular plan */
    badgeText?: string;
  }>;
  /** Display variant */
  variant: "cards" | "table" | "minimal";
  /** Number of columns */
  columns?: number;
  /** Highlight the popular plan */
  highlightPopular?: boolean;
  /** Show monthly/annual toggle */
  showAnnualToggle?: boolean;
  /** Annual discount percentage */
  annualDiscount?: number;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Background color */
  backgroundColor?: string;
  /** Padding */
  paddingY?: number;
}
```

**Default Props**:

```typescript
export const LP_PRICING_TABLE_DEFAULTS: LPPricingTableProps = {
  plans: [
    {
      name: "Starter",
      price: "K250",
      period: "/month",
      description: "Perfect for individuals",
      features: [
        { text: "5 Landing Pages", included: true },
        { text: "1,000 Visitors/mo", included: true },
        { text: "Basic Analytics", included: true },
        { text: "Email Support", included: true },
        { text: "A/B Testing", included: false },
        { text: "Custom Domain", included: false },
      ],
      ctaText: "Start Free",
      ctaUrl: "#",
    },
    {
      name: "Professional",
      price: "K750",
      period: "/month",
      description: "For growing businesses",
      features: [
        { text: "Unlimited Landing Pages", included: true },
        { text: "50,000 Visitors/mo", included: true },
        { text: "Advanced Analytics", included: true },
        { text: "Priority Support", included: true },
        { text: "A/B Testing", included: true },
        { text: "Custom Domain", included: true },
      ],
      ctaText: "Start Free Trial",
      ctaUrl: "#",
      isPopular: true,
      badgeText: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "K2,500",
      period: "/month",
      description: "For large organizations",
      features: [
        { text: "Unlimited Everything", included: true },
        { text: "Unlimited Visitors", included: true },
        { text: "Full Analytics Suite", included: true },
        { text: "Dedicated Support", included: true },
        { text: "A/B Testing", included: true },
        { text: "Custom Domain + SSL", included: true },
      ],
      ctaText: "Contact Sales",
      ctaUrl: "#",
    },
  ],
  variant: "cards",
  columns: 3,
  highlightPopular: true,
  heading: "Simple, Transparent Pricing",
  subheading: "Choose the plan that's right for you.",
  paddingY: 64,
};
```

### Component 6: `LPFloatingCTA` — Sticky Bottom/Top CTA Bar

#### `src/components/studio/blocks/landing-page/lp-floating-cta-render.tsx`

```typescript
interface LPFloatingCTAProps {
  /** CTA text (e.g., "Limited time offer!") */
  text?: string;
  /** Button text */
  ctaText: string;
  /** Button URL or form scroll target */
  ctaUrl?: string;
  /** Scroll to element ID instead of navigating */
  scrollToId?: string;
  /** Show after scrolling this percentage */
  showAfterScroll?: number;
  /** Background color */
  backgroundColor?: string;
  /** Position */
  position?: "bottom" | "top";
  /** Show inline countdown */
  showCountdown?: boolean;
  /** Countdown target date */
  countdownDate?: string;
  /** Dismissible */
  dismissible?: boolean;
  /** Show on mobile */
  showOnMobile?: boolean;
  /** Animation */
  animation?: "slide" | "fade" | "none";
}
```

**Behavior**:

- Hidden by default, appears after user scrolls past `showAfterScroll` percentage
- Sticks to bottom (or top) of viewport
- Can include inline countdown timer for extra urgency
- Can scroll to a form element instead of navigating to URL
- Dismissible with X button (optional)
- Can be hidden on mobile for better UX

```typescript
function LPFloatingCTARender(props: LPFloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!props.showAfterScroll) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercent >= (props.showAfterScroll || 0));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [props.showAfterScroll]);

  if (isDismissed || !isVisible) return null;

  const handleClick = () => {
    if (props.scrollToId) {
      document.getElementById(props.scrollToId)?.scrollIntoView({ behavior: 'smooth' });
    } else if (props.ctaUrl) {
      window.location.href = props.ctaUrl;
    }
  };

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 px-4 py-3',
        props.position === 'top' ? 'top-0' : 'bottom-0',
        props.animation === 'slide' && 'animate-in slide-in-from-bottom duration-300',
        !props.showOnMobile && 'hidden sm:flex',
        'flex items-center justify-center gap-4',
      )}
      style={{ backgroundColor: props.backgroundColor || 'var(--primary)' }}
    >
      {props.text && (
        <span className="text-sm font-medium text-white">{props.text}</span>
      )}
      <button
        onClick={handleClick}
        className="rounded-lg bg-white px-6 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
        style={{ color: props.backgroundColor || 'var(--primary)' }}
      >
        {props.ctaText}
      </button>
      {props.dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute right-4 text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

### Testing Notes for LPB-06

1. **Logo bar** — All 3 variants render correctly (grid, scroll, carousel)
2. **Logo scroll** — Infinite CSS animation without JS, smooth, no jumps
3. **Logo grayscale** — Grayscale filter applied when enabled
4. **Trust badges** — All 3 variants render correctly (horizontal, grid, inline)
5. **Trust badge icons** — Lucide icons render correctly
6. **Countdown** — Fixed mode counts down to target date
7. **Countdown evergreen** — Evergreen mode uses localStorage, starts fresh for new visitors
8. **Countdown expired** — Shows message/hides/redirects when expired
9. **Countdown variants** — All 4 variants render correctly (boxes, inline, minimal, circular)
10. **Testimonial wall** — All 4 variants render correctly (grid, carousel, masonry, single-featured)
11. **Testimonial ratings** — Star ratings display correctly
12. **Pricing table** — All 3 variants render correctly (cards, table, minimal)
13. **Pricing popular** — Popular plan highlighted with badge
14. **Floating CTA** — Appears after scroll threshold, sticks to viewport
15. **Floating CTA scroll-to** — Scrolls to form element when configured
16. **Floating CTA dismissible** — Can be dismissed with X button
17. **All components use CSS variables** — Colors inherit from site/LP branding
18. **All components responsive** — Mobile-first layouts, proper touch targets
19. **All components work in Studio editor** — Render in editor preview iframe

---

## Phase LPB-07: Template Library (15+ High-Converting Templates in Studio Format)

### Purpose

Provide a library of professionally designed, high-converting landing page templates in Studio component tree format. Templates are THE fastest way for users to get started — they should be able to pick a template, swap their content, and publish in minutes.

### Template Architecture

Templates are stored as Studio component tree JSON — the exact same format used by regular pages. When a user selects a template:

1. Template's `contentStudio` is deep-cloned
2. Cloned data is set as the new LP's `contentStudio`
3. Template's `settings` are applied as LP defaults
4. User opens the LP in Studio editor and customizes

**Template sources**:

- **System templates**: Defined in code (`src/modules/marketing/data/lp-studio-templates.ts`), `is_system = true`
- **Agency templates**: Saved by agencies from existing LPs, stored in `mod_mktmod01_lp_templates`
- **Marketplace templates**: Agency-shared templates flagged `is_public = true` (future)

### Template Categories (16)

| Category           | Slug                 | Description                                | Template Count |
| ------------------ | -------------------- | ------------------------------------------ | -------------- |
| Lead Generation    | `lead-gen`           | Email capture, lead magnets, gated content | 2              |
| Webinar            | `webinar`            | Webinar/workshop registration              | 1              |
| Product Launch     | `product-launch`     | New product/feature announcement           | 1              |
| Coming Soon        | `coming-soon`        | Pre-launch, waitlist, early access         | 1              |
| Sale/Promo         | `sale-promo`         | Seasonal sale, flash deal, coupon          | 1              |
| Ebook Download     | `ebook-download`     | Free resource, whitepaper, guide download  | 1              |
| Free Trial         | `free-trial`         | SaaS free trial signup                     | 1              |
| Consultation       | `consultation`       | Book a call, schedule consultation         | 1              |
| SaaS Signup        | `saas-signup`        | SaaS product signup, onboarding            | 1              |
| App Download       | `app-download`       | Mobile app install promotion               | 1              |
| Agency Services    | `agency-services`    | Service offering, packages, portfolio      | 1              |
| Newsletter         | `newsletter`         | Newsletter signup, content subscription    | 1              |
| Event Registration | `event-registration` | Conference, meetup, event RSVP             | 1              |
| Course Enrollment  | `course-enrollment`  | Online course, training signup             | 1              |
| Real Estate        | `real-estate`        | Property listing, open house RSVP          | 1              |
| Fitness/Health     | `fitness-health`     | Gym membership, health program signup      | 1              |

### Template File: `src/modules/marketing/data/lp-studio-templates.ts`

**This is a large file** containing all system template definitions. Each template is a full Studio component tree.

```typescript
import { LPTemplate, LPTemplateCategory } from "../types/lp-builder-types";

/**
 * System LP templates — high-converting designs in Studio component tree format.
 *
 * Each template uses LP components (LPHero, LPForm, LPLogoBar, etc.) and standard
 * Studio components (Section, Container, Columns, Heading, Text, Button, Image, etc.)
 * combined to create professional landing page layouts.
 *
 * Template component tree follows Studio format:
 * {
 *   root: {
 *     type: 'root',
 *     props: {},
 *     children: ['section-1', 'section-2', ...],
 *   },
 *   zones: {
 *     'section-1': {
 *       type: 'LPHero',
 *       props: { variant: 'split-left', ... },
 *     },
 *     'section-2': {
 *       type: 'LPLogoBar',
 *       props: { ... },
 *     },
 *     // ...
 *   }
 * }
 */

export const SYSTEM_LP_TEMPLATES: LPTemplate[] = [
  // Each template definition below
];
```

### Template 1: "Lead Magnet Pro" (lead-gen)

**Layout**: Split hero (form right) → Logo bar → 3-column benefits → Testimonials → CTA section

```
┌────────────────────────────────────────────────────────────────────┐
│  [LPHero variant="split-left"]                                     │
│  ┌───────────────────────┐ ┌─────────────────────────────────┐    │
│  │ Get Your Free [X]     │ │ ┌─────────────────────────────┐ │    │
│  │                       │ │ │ Download Your Free Guide     │ │    │
│  │ Discover how to...    │ │ │ [Name                     ] │ │    │
│  │                       │ │ │ [Email                    ] │ │    │
│  │ ✓ Benefit 1           │ │ │ [Company                  ] │ │    │
│  │ ✓ Benefit 2           │ │ │                             │ │    │
│  │ ✓ Benefit 3           │ │ │ [Download Now ▸]            │ │    │
│  │                       │ │ │ 🔒 We respect your privacy  │ │    │
│  └───────────────────────┘ │ └─────────────────────────────┘ │    │
│                             └─────────────────────────────────┘    │
├────────────────────────────────────────────────────────────────────┤
│  [LPLogoBar] "Trusted by 10,000+ businesses"                      │
│  [ Logo ] [ Logo ] [ Logo ] [ Logo ] [ Logo ]                     │
├────────────────────────────────────────────────────────────────────┤
│  [Section] "What You'll Learn"                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │ 📖       │  │ 📊       │  │ 🚀       │                         │
│  │ Chapter 1│  │ Chapter 2│  │ Chapter 3│                         │
│  │ Desc...  │  │ Desc...  │  │ Desc...  │                         │
│  └──────────┘  └──────────┘  └──────────┘                         │
├────────────────────────────────────────────────────────────────────┤
│  [LPTestimonialWall] "What Readers Are Saying"                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ ★★★★★        │ │ ★★★★★        │ │ ★★★★★        │               │
│  │ "Amazing..."  │ │ "Changed..." │ │ "Must read." │               │
│  │ — Sarah J.   │ │ — Mike C.    │ │ — Emily D.   │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
├────────────────────────────────────────────────────────────────────┤
│  [Section] CTA Banner                                              │
│  "Ready to transform your [X]?"                                    │
│  [Get Your Free Copy ▸]                                            │
└────────────────────────────────────────────────────────────────────┘
```

### Template 2: "High-Ticket Consultation" (consultation)

**Layout**: Full-bleed hero → Trust badges → Split (testimonial + form) → FAQ → Floating CTA

### Template 3: "Webinar Registration" (webinar)

**Layout**: Split hero (countdown + form) → Speaker bios → What you'll learn → Testimonials → Countdown CTA

### Template 4: "SaaS Product Launch" (product-launch)

**Layout**: Gradient hero → Logo bar → Feature grid → Pricing table → Testimonials → CTA

### Template 5: "Coming Soon / Waitlist" (coming-soon)

**Layout**: Minimal hero (centered) → Countdown → Email-only form → Trust badges

### Template 6: "Flash Sale" (sale-promo)

**Layout**: Full-bleed hero with countdown → Product showcase → Trust badges → Floating CTA

### Template 7: "Ebook Download" (ebook-download)

**Layout**: Split hero (book cover + form) → Table of contents → Author bio → Testimonials

### Template 8: "Free Trial Signup" (free-trial)

**Layout**: Split hero (screenshot + CTA) → Logo bar → Feature comparison → Pricing → FAQ

### Template 9: "Newsletter Signup" (newsletter)

**Layout**: Minimal hero → Preview of past newsletters → Testimonials → Inline form

### Template 10: "Event Registration" (event-registration)

**Layout**: Full-bleed hero (event photo) → Speakers grid → Schedule → Early bird pricing → Registration form

### Template 11: "Course Enrollment" (course-enrollment)

**Layout**: Video-bg hero → Curriculum outline → Instructor bio → Student testimonials → Pricing → FAQ

### Template 12: "Agency Services" (agency-services)

**Layout**: Gradient hero → Logo bar → Services grid → Case studies → Testimonials → Contact form

### Template 13: "App Download" (app-download)

**Layout**: Split hero (phone mockup + CTA) → Feature carousel → Ratings → App store badges

### Template 14: "Real Estate" (real-estate)

**Layout**: Full-bleed hero (property photo) → Property details grid → Virtual tour CTA → Contact form → Trust badges

### Template 15: "Fitness/Health" (fitness-health)

**Layout**: Video-bg hero → Transformation testimonials → Program features → Pricing → Countdown CTA

### Template 16: "Lead Gen Multi-Step" (lead-gen)

**Layout**: Minimal hero → Multi-step form (3 steps with progress bar) → Testimonials → Trust badges

### Template Implementation Pattern

Each template is defined as a function that returns the Studio component tree:

```typescript
function createLeadMagnetProTemplate(): LPTemplate {
  return {
    id: "system-lead-magnet-pro",
    name: "Lead Magnet Pro",
    description:
      "High-converting lead generation page with split hero, embedded form, logo bar, benefits, and testimonials.",
    category: "lead-gen",
    thumbnailUrl: "/templates/lp/lead-magnet-pro.webp",
    isSystem: true,
    settings: {
      showHeader: false,
      showFooter: false,
      brandingOverride: null,
      conversionValue: 0,
      isEvergreen: true,
    },
    contentStudio: {
      root: {
        type: "root",
        props: {},
        children: [
          "hero-1",
          "logos-1",
          "benefits-1",
          "testimonials-1",
          "cta-1",
        ],
      },
      zones: {
        "hero-1": {
          type: "LPHero",
          props: {
            variant: "split-left",
            headline: "Get Your Free [Resource Name]",
            subheadline:
              "Discover proven strategies to [achieve outcome]. Download our comprehensive guide today.",
            preheadline: "FREE DOWNLOAD",
            showForm: true,
            formPosition: "right",
            benefits: [
              "Learn the exact framework used by top performers",
              "Actionable templates you can use immediately",
              "Real case studies with measurable results",
            ],
            formSettings: {
              fields: [
                {
                  id: "name",
                  type: "text",
                  label: "Full Name",
                  placeholder: "Enter your name",
                  required: true,
                  crmMapping: "first_name",
                },
                {
                  id: "email",
                  type: "email",
                  label: "Email Address",
                  placeholder: "you@company.com",
                  required: true,
                  crmMapping: "email",
                },
                {
                  id: "company",
                  type: "text",
                  label: "Company",
                  placeholder: "Your company name",
                  required: false,
                  crmMapping: "company",
                },
              ],
              submitButtonText: "Download Free Guide",
              successMessage: "Check your email! Your guide is on its way.",
              successAction: "message",
              createSubscriber: true,
              subscriberTags: ["lead-magnet", "free-guide"],
              createCrmContact: true,
              doubleOptIn: false,
              enableHoneypot: true,
              rateLimitPerHour: 10,
              notifyOnSubmission: true,
              notificationEmails: [],
            },
          },
        },
        "logos-1": {
          type: "LPLogoBar",
          props: {
            title: "Trusted by 10,000+ professionals",
            variant: "grid",
            grayscale: true,
            logos: [
              { imageUrl: "/placeholder-logo.svg", altText: "Company 1" },
              { imageUrl: "/placeholder-logo.svg", altText: "Company 2" },
              { imageUrl: "/placeholder-logo.svg", altText: "Company 3" },
              { imageUrl: "/placeholder-logo.svg", altText: "Company 4" },
              { imageUrl: "/placeholder-logo.svg", altText: "Company 5" },
            ],
          },
        },
        "benefits-1": {
          type: "Section",
          props: { paddingTop: 64, paddingBottom: 64 },
          children: ["benefits-heading", "benefits-grid"],
        },
        // ... nested children for benefits grid
        "testimonials-1": {
          type: "LPTestimonialWall",
          props: {
            heading: "What Readers Are Saying",
            variant: "grid",
            columns: 3,
            showRatings: true,
            testimonials: [
              {
                name: "Sarah J.",
                role: "CEO",
                company: "TechStart",
                text: "This guide transformed our approach. Highly recommended!",
                rating: 5,
              },
              {
                name: "Mike C.",
                role: "Marketing Director",
                company: "GrowthCo",
                text: "Practical, actionable, and immediately useful.",
                rating: 5,
              },
              {
                name: "Emily D.",
                role: "Founder",
                company: "DesignLab",
                text: "The best resource I've found on this topic.",
                rating: 5,
              },
            ],
          },
        },
        "cta-1": {
          type: "Section",
          props: {
            paddingTop: 64,
            paddingBottom: 64,
            backgroundColor: "var(--primary)",
          },
          children: ["cta-heading", "cta-button"],
        },
        // ... CTA section children
      },
    },
  };
}
```

### Template Picker UI: `src/modules/marketing/components/landing-pages/lp-template-picker.tsx`

**Visual Design**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Choose a Template                                                [✕]  │
│                                                                         │
│  [All] [Lead Gen] [Webinar] [SaaS] [Events] [Commerce] [Healthcare] ▸ │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │              │  │              │  │              │  │            │ │
│  │  [Preview]   │  │  [Preview]   │  │  [Preview]   │  │  [Preview] │ │
│  │              │  │              │  │              │  │            │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├────────────┤ │
│  │ Lead Magnet  │  │ Consultation │  │ Webinar      │  │ SaaS       │ │
│  │ Pro          │  │ Booking      │  │ Registration │  │ Launch     │ │
│  │              │  │              │  │              │  │            │ │
│  │ [Use This ▸] │  │ [Use This ▸] │  │ [Use This ▸] │  │[Use This▸] │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                         │
│  ─── Or ────────────────────────────────────────────────────────────── │
│  [ Start from Scratch ]                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key behaviors**:

- Grid of template cards with thumbnail, name, description
- Category filter tabs (horizontal scroll on mobile)
- "Use This" button deep-clones template data and creates new LP
- "Start from Scratch" creates blank LP with default Section + Heading
- Hover on template card shows "Preview" overlay (opens template in modal with desktop/mobile toggle)
- Search/filter by name
- System templates + agency custom templates combined

### Template Actions

Add to `src/modules/marketing/actions/lp-builder-actions.ts`:

```typescript
// Get all available templates for a site
export async function getAvailableLPTemplates(
  siteId: string,
  category?: string,
) {
  // Returns system templates + agency templates + site-specific templates
  // Filtered by category if provided
}

// Create LP from template
export async function createLPFromTemplate(input: {
  siteId: string;
  templateId: string;
  title: string;
  slug: string;
}) {
  // 1. Fetch template (system or DB)
  // 2. Deep-clone contentStudio
  // 3. Generate new component IDs (to avoid ID collisions)
  // 4. Create LP with cloned content + template settings
  // 5. Increment template usage_count
  // Return new LP
}

// Save existing LP as template
export async function saveLPAsTemplate(input: {
  landingPageId: string;
  name: string;
  description: string;
  category: LPTemplateCategory;
}) {
  // 1. Fetch LP content
  // 2. Create template record in mod_mktmod01_lp_templates
  // 3. Return template
}
```

### Testing Notes for LPB-07

1. **Template picker renders** — Shows grid of templates with thumbnails
2. **Category filtering** — Filter tabs show correct templates per category
3. **Template preview** — Can preview template in modal
4. **Create from template** — Creates new LP with deep-cloned template content
5. **Unique IDs** — New LP component IDs don't collide with template IDs
6. **Start from scratch** — Creates blank LP with Section + Heading
7. **Save as template** — Can save existing LP as agency template
8. **Custom templates** — Agency templates appear in picker alongside system templates
9. **Template settings** — LP inherits template's default settings (showHeader, etc.)
10. **All 16 templates** — Each renders a professional, mobile-responsive layout

---

## Phase LPB-08: Analytics & Conversion Tracking

### Purpose

Build the analytics system that tracks visits, conversions, and engagement metrics. This data drives the LP list dashboard, individual LP analytics views, and A/B test results.

### Architecture: Tracking Flow

```
Visitor → LP Page Load
  │
  ├─[Client] → POST /api/marketing/lp/track (visit)
  │              ├─ Insert into mod_mktmod01_lp_visits
  │              └─ Increment LP total_visits
  │
  ├─[Client] → Scroll tracking (throttled, stored in memory)
  │
  ├─[Client] → Time-on-page tracking (interval, stored in memory)
  │
  └─[Client] → Form Submit
       │
       ├─ POST /api/marketing/lp/submit
       │    ├─ Insert into mod_mktmod01_lp_form_submissions
       │    ├─ Update mod_mktmod01_lp_visits SET converted = true
       │    ├─ Increment LP total_conversions + recalculate conversion_rate
       │    └─ Fire automation event
       │
       └─[Client] → PATCH /api/marketing/lp/track (engagement update)
                      └─ Update visit with time_on_page + scroll_depth
```

### Client-Side Tracking Service

#### `src/modules/marketing/lib/lp-tracking-client.ts`

This is a lightweight client-side tracking module that measures engagement without external dependencies:

```typescript
/**
 * LP Client-Side Tracking Service
 *
 * Injected into the LP page via CraftRenderer in LP mode.
 * Tracks: visit, scroll depth, time on page, conversions.
 *
 * Design principles:
 * - Zero impact on page load performance
 * - All tracking is best-effort (fire and forget)
 * - No cookies required (uses localStorage for visitor ID)
 * - Minimal data transmission (single beacon on exit)
 */

class LPTracker {
  private siteId: string;
  private landingPageId: string;
  private visitorId: string;
  private sessionId: string;
  private startTime: number;
  private maxScrollDepth: number = 0;
  private hasTrackedVisit: boolean = false;

  constructor(siteId: string, landingPageId: string) {
    this.siteId = siteId;
    this.landingPageId = landingPageId;
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  /** Initialize tracking on page load */
  init() {
    this.trackVisit();
    this.trackScroll();
    this.trackExit();
  }

  /** Track initial page visit */
  private async trackVisit() {
    if (this.hasTrackedVisit) return;
    this.hasTrackedVisit = true;

    try {
      await fetch("/api/marketing/lp/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: this.siteId,
          landingPageId: this.landingPageId,
          visitorId: this.visitorId,
          sessionId: this.sessionId,
          referrer: document.referrer,
          utmParams: this.getUtmParams(),
          deviceType: this.getDeviceType(),
        }),
      });
    } catch {
      // Best-effort, don't block the page
    }
  }

  /** Track scroll depth (max reached) */
  private trackScroll() {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent =
        docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
    };

    window.addEventListener("scroll", handler, { passive: true });
  }

  /** Send engagement data when leaving page */
  private trackExit() {
    const sendEngagement = () => {
      const timeOnPage = Math.round((Date.now() - this.startTime) / 1000);

      // Use sendBeacon for reliable delivery during page unload
      navigator.sendBeacon(
        "/api/marketing/lp/track",
        JSON.stringify({
          type: "engagement",
          siteId: this.siteId,
          landingPageId: this.landingPageId,
          visitorId: this.visitorId,
          sessionId: this.sessionId,
          timeOnPage,
          scrollDepth: this.maxScrollDepth,
        }),
      );
    };

    // visibilitychange is more reliable than beforeunload on mobile
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendEngagement();
    });

    // Fallback for desktop
    window.addEventListener("beforeunload", sendEngagement);
  }

  /** Get time on page in seconds */
  getTimeOnPage(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /** Get max scroll depth (0-100) */
  getScrollDepth(): number {
    return this.maxScrollDepth;
  }

  private getOrCreateVisitorId(): string {
    const key = "dramac_visitor_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private getUtmParams(): Record<string, string | null> {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
    };
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone/i.test(ua)) return "mobile";
    if (/iPad|Tablet/i.test(ua)) return "tablet";
    return "desktop";
  }
}

export function initLPTracking(siteId: string, landingPageId: string) {
  const tracker = new LPTracker(siteId, landingPageId);
  tracker.init();
  // Expose on window for form component to access
  (window as any).__lpTracker = tracker;
  return tracker;
}
```

### Updated Tracking API Route

Update `src/app/api/marketing/lp/track/route.ts` to handle both visit and engagement types:

```typescript
export async function POST(request: Request) {
  try {
    // Handle both JSON and sendBeacon (which sends as text)
    const contentType = request.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      // sendBeacon sends as text/plain
      const text = await request.text();
      body = JSON.parse(text);
    }

    if (body.type === "engagement") {
      return handleEngagementUpdate(body);
    }

    return handleVisitTrack(body, request);
  } catch (error) {
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}

async function handleEngagementUpdate(body: any) {
  const supabase = createAdminClient();

  // Update the visit record with engagement data
  await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .update({
      time_on_page: body.timeOnPage,
      scroll_depth: body.scrollDepth,
    })
    .eq("landing_page_id", body.landingPageId)
    .eq("session_id", body.sessionId);

  return NextResponse.json({ success: true });
}
```

### Analytics Dashboard Component

#### `src/modules/marketing/components/landing-pages/lp-analytics-dashboard.tsx`

**Layout**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Landing Pages              "My LP Title" Analytics           │
│                                                                          │
│  Date Range: [Last 7 Days ▾]   [Last 30 Days] [Last 90 Days] [Custom]  │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  1,247   │  │  847     │  │  143     │  │  16.9%   │  │  K35,750 │ │
│  │ Visits   │  │ Unique   │  │ Converts │  │ Rate     │  │ Revenue  │ │
│  │ ↑24%     │  │ ↑18%     │  │ ↑31%     │  │ ↑2.1%   │  │ ↑45%    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │     Visits & Conversions Over Time (Recharts Line/Bar)              │ │
│  │     ───── Visits  ▬▬▬▬▬ Conversions                                 │ │
│  │     📈                                                                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌───────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Traffic Sources       │  │  Device Breakdown                        │ │
│  │                        │  │                                          │ │
│  │  Google    60%  ████  │  │  Desktop  68%  ████████████████          │ │
│  │  Facebook  25%  ██    │  │  Mobile   27%  ██████████                │ │
│  │  Email     10%  █     │  │  Tablet    5%  ██                        │ │
│  │  Direct     5%  ▌     │  │                                          │ │
│  └───────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Recent Submissions                                    [Export CSV] │ │
│  │                                                                     │ │
│  │  Name          Email              Date         Status               │ │
│  │  Sarah J.      sarah@co.cc        2 min ago    New                 │ │
│  │  Mike C.       mike@growthco.cc   1 hour ago   New                 │ │
│  │  Emily D.      emily@lab.cc       3 hours ago  Subscribed          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Engagement Metrics                                                 │ │
│  │  Avg Time on Page: 2m 34s  |  Avg Scroll Depth: 78%  |  Bounce: 32%│ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Analytics Query Actions

Add to `src/modules/marketing/actions/lp-builder-actions.ts`:

```typescript
export async function getLPAnalytics(
  landingPageId: string,
  dateRange?: { from: string; to: string },
): Promise<LPAnalyticsSummary> {
  const supabase = await getAuthenticatedClient();

  const from =
    dateRange?.from || new Date(Date.now() - 30 * 86400000).toISOString();
  const to = dateRange?.to || new Date().toISOString();

  // Total visits in range
  const { count: totalVisits } = await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .select("id", { count: "exact", head: true })
    .eq("landing_page_id", landingPageId)
    .gte("created_at", from)
    .lte("created_at", to);

  // Unique visitors
  const { count: uniqueVisitors } = await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .select("id", { count: "exact", head: true })
    .eq("landing_page_id", landingPageId)
    .eq("is_unique", true)
    .gte("created_at", from)
    .lte("created_at", to);

  // Total submissions
  const { count: totalSubmissions } = await (supabase as any)
    .from("mod_mktmod01_lp_form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("landing_page_id", landingPageId)
    .gte("created_at", from)
    .lte("created_at", to);

  // Avg time on page
  const { data: engagementData } = await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .select("time_on_page, scroll_depth")
    .eq("landing_page_id", landingPageId)
    .gte("created_at", from)
    .lte("created_at", to)
    .not("time_on_page", "is", null);

  const avgTimeOnPage = engagementData?.length
    ? Math.round(
        engagementData.reduce(
          (s: number, v: any) => s + (v.time_on_page || 0),
          0,
        ) / engagementData.length,
      )
    : 0;

  const avgScrollDepth = engagementData?.length
    ? Math.round(
        engagementData.reduce(
          (s: number, v: any) => s + (v.scroll_depth || 0),
          0,
        ) / engagementData.length,
      )
    : 0;

  // Traffic sources
  const { data: trafficData } = await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .select("utm_source")
    .eq("landing_page_id", landingPageId)
    .gte("created_at", from)
    .lte("created_at", to);

  // Group traffic sources
  const trafficSources = groupBy(trafficData || [], "utm_source");

  // Device breakdown
  const { data: deviceData } = await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .select("device_type")
    .eq("landing_page_id", landingPageId)
    .gte("created_at", from)
    .lte("created_at", to);

  // Daily stats
  const { data: dailyVisits } = await (supabase as any)
    .from("mod_mktmod01_lp_visits")
    .select("created_at, converted")
    .eq("landing_page_id", landingPageId)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at");

  // ... aggregate daily data

  const conversionRate = totalVisits
    ? Math.round((totalSubmissions / totalVisits) * 10000) / 100
    : 0;
  const bounceRate = engagementData?.length
    ? Math.round(
        (engagementData.filter((v: any) => (v.time_on_page || 0) < 10).length /
          engagementData.length) *
          100,
      )
    : 0;

  return {
    totalVisits: totalVisits || 0,
    uniqueVisitors: uniqueVisitors || 0,
    totalSubmissions: totalSubmissions || 0,
    conversionRate,
    avgTimeOnPage,
    avgScrollDepth,
    bounceRate,
    revenueAttributed: 0, // Calculated from conversion_value * totalSubmissions
    dailyStats: [], // Aggregated from dailyVisits
    trafficSources: Object.entries(trafficSources).map(([source, items]) => ({
      source: source || "Direct",
      visits: (items as any[]).length,
      conversions: (items as any[]).filter((i: any) => i.converted).length,
    })),
    deviceBreakdown: [], // Aggregated from deviceData
  };
}
```

### A/B Testing System

A/B testing uses the existing LP infrastructure:

1. **Creating a variant**: Duplicates the LP, sets `primary_variant_id` to point to the original
2. **Traffic splitting**: The catch-all page route randomly assigns visitors to a variant (using cookie for consistency)
3. **Results comparison**: Analytics query both the primary LP and all variants
4. **Ending a test**: Winner's content replaces the primary LP's content, variants are archived

**Traffic splitting in the catch-all route**:

```typescript
// In page.tsx LP routing:
if (lp.ab_test_enabled && lp.ab_test_config) {
  const variantId = getOrAssignVariant(lp, cookies());
  if (variantId !== lp.id) {
    // Fetch the variant LP instead
    const variant = await fetchLP(siteId, variantId);
    if (variant) {
      lp = variant;
    }
  }
}

function getOrAssignVariant(lp: LandingPageStudio, cookies: any): string {
  const cookieKey = `lp_variant_${lp.id}`;
  const existingVariant = cookies.get(cookieKey);
  if (existingVariant) return existingVariant.value;

  // Random assignment based on weights
  const random = Math.random() * 100;
  let cumulative = 0;
  for (const variant of lp.abTestConfig!.variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      cookies.set(cookieKey, variant.id, { maxAge: 86400 * 30 });
      return variant.id;
    }
  }

  return lp.id; // Fallback to primary
}
```

### Testing Notes for LPB-08

1. **Visit tracking** — Each LP view creates a visit record
2. **Unique visitor detection** — localStorage-based visitor ID, first visit flagged
3. **Scroll tracking** — Max scroll depth recorded on page exit
4. **Time on page** — Duration tracked and sent via beacon on exit
5. **Analytics dashboard** — Summary cards show correct totals
6. **Date range filter** — Changing date range updates all metrics
7. **Traffic sources** — UTM params captured and grouped correctly
8. **Device breakdown** — Desktop/mobile/tablet correctly detected
9. **Daily trend chart** — Recharts line chart renders with correct data
10. **Submissions table** — Recent forms shown with name/email/date
11. **Export CSV** — Submissions exportable as CSV
12. **A/B test creation** — Can create variant from existing LP
13. **A/B traffic split** — Visitors randomly assigned, cookie persists choice
14. **A/B results** — Both variants' metrics shown side-by-side
15. **A/B winner** — Can declare winner, content replaces primary, variant archived
16. **Bounce rate** — Visits with <10s time_on_page counted as bounces

---

## Phase LPB-09: AI Landing Page Generator

### Purpose

Enable users to generate complete, high-converting landing pages from a simple text description using Claude AI. This leverages the existing AI generation infrastructure (used by the AI page generator in Studio) adapted for LP-specific outputs.

### Architecture: AI Generation Flow

```
User types: "Create a landing page for my upcoming yoga retreat in Livingstone, Zambia"
  │
  ├─ Client sends to POST /api/marketing/lp/ai-generate
  │
  ├─ Server builds prompt with:
  │     • User description
  │     • Site branding context (colors, fonts, logo)
  │     • Available LP components (LPHero, LPForm, etc.)
  │     • Best practices context (from LP domain knowledge)
  │     • Template structure examples
  │
  ├─ Claude AI generates:
  │     • LP title + slug
  │     • SEO config (meta title, description, OG image prompt)
  │     • Complete Studio component tree
  │     • Form field configuration
  │     • Suggested conversion settings
  │
  └─ Server returns structured LP data
       │
       └─ Client creates LP and opens in Studio editor for refinement
```

### AI Generation API Route

#### `src/app/api/marketing/lp/ai-generate/route.ts`

```typescript
import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { siteId, description, category, preferences } = await request.json();

  // 1. Fetch site branding
  const branding = await getSiteBranding(siteId);

  // 2. Build the AI prompt
  const systemPrompt = buildLPGenerationSystemPrompt(branding);
  const userPrompt = buildLPGenerationUserPrompt(
    description,
    category,
    preferences,
  );

  // 3. Generate LP structure using Claude
  const result = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    prompt: userPrompt,
    schema: lpGenerationSchema,
    temperature: 0.7,
  });

  // 4. Post-process: inject site-specific values
  const lpData = postProcessGeneratedLP(result.object, branding);

  return NextResponse.json({
    success: true,
    landingPage: lpData,
  });
}
```

### AI System Prompt

```typescript
function buildLPGenerationSystemPrompt(branding: SiteBrandingData): string {
  return `You are an expert landing page designer and copywriter. You create high-converting 
landing pages using a component-based builder system.

AVAILABLE COMPONENTS:
- LPHero: Hero section with variants: split-left, split-right, full-bleed, video-bg, gradient-overlay, minimal
- LPForm: Lead capture form with fields: text, email, phone, number, textarea, select, checkbox, radio, date
- LPLogoBar: "Trusted By" logo display (grid, scroll, carousel)
- LPTrustBadges: Security/guarantee badges
- LPCountdown: Urgency countdown timer (fixed or evergreen)
- LPTestimonialWall: Social proof testimonials (grid, carousel, masonry)
- LPPricingTable: Pricing plan comparison
- LPFloatingCTA: Sticky CTA bar
- Section: Generic content section (can contain any components)
- Columns: Multi-column layout
- Heading: Text heading (h1-h6)
- Text: Paragraph text
- Button: CTA button
- Image: Image display

SITE BRANDING:
- Primary Color: ${branding.primaryColor || "#2563eb"}
- Secondary Color: ${branding.secondaryColor || "#7c3aed"}
- Heading Font: ${branding.fontHeading || "Inter"}
- Body Font: ${branding.fontBody || "DM Sans"}

HIGH-CONVERTING LP BEST PRACTICES:
1. Hero section should be compelling with clear value proposition
2. Lead with the benefit, not the feature
3. Include social proof (testimonials, logo bar) above the fold or just below
4. Form should be visible early (hero or immediately after)
5. Use urgency elements (countdown, limited spots) when appropriate
6. Trust badges near the form reduce anxiety
7. Single clear CTA — don't give multiple competing choices
8. Write copy for the target audience's pain points
9. Use specific numbers and outcomes when possible
10. End with a strong CTA section that mirrors the hero's offer

RULES:
- Generate realistic but placeholder content (not lorem ipsum)
- Form must always include an email field
- All text should sound professional and persuasive
- Content should be appropriate for Zambian/African market context
- Use specific, concrete value propositions
- Include at least 3 testimonials with realistic names
- Include at least 3 benefit bullet points in the hero`;
}
```

### AI User Prompt Builder

```typescript
function buildLPGenerationUserPrompt(
  description: string,
  category?: LPTemplateCategory,
  preferences?: {
    heroVariant?: LPHeroVariant;
    includeForm?: boolean;
    includeCountdown?: boolean;
    includeTestimonials?: boolean;
    includePricing?: boolean;
    includeLogoBar?: boolean;
    tone?: "professional" | "casual" | "urgent" | "luxury";
  },
): string {
  let prompt = `Create a complete landing page for the following:

DESCRIPTION: ${description}
${category ? `CATEGORY: ${category}` : ""}
${preferences?.tone ? `TONE: ${preferences.tone}` : ""}

PREFERENCES:
- Hero variant: ${preferences?.heroVariant || "choose the best fit"}
- Include form: ${preferences?.includeForm ?? true}
- Include countdown: ${preferences?.includeCountdown ?? false}
- Include testimonials: ${preferences?.includeTestimonials ?? true}
- Include pricing: ${preferences?.includePricing ?? false}
- Include logo bar: ${preferences?.includeLogoBar ?? true}

Generate the complete page structure with all content filled in.`;

  return prompt;
}
```

### AI Output Schema (Zod)

```typescript
// NOTE: Per platform rules, Zod schemas for AI must NOT use .int(), .min(), .max()
const lpGenerationSchema = z.object({
  title: z.string().describe("Landing page title"),
  slug: z.string().describe("URL slug (lowercase, hyphens only)"),
  description: z.string().describe("Brief page description"),
  seo: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
  }),
  conversionGoal: z.enum(["form_submit", "button_click", "page_scroll"]),
  // Component tree
  components: z.array(
    z.object({
      type: z.string().describe("Component type name"),
      props: z.record(z.unknown()).describe("Component properties"),
    }),
  ),
  // Form settings (if a form is included)
  formFields: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum([
          "text",
          "email",
          "phone",
          "number",
          "textarea",
          "select",
          "checkbox",
          "radio",
          "date",
        ]),
        label: z.string(),
        placeholder: z.string().optional(),
        required: z.boolean(),
        options: z
          .array(
            z.object({
              label: z.string(),
              value: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  // Suggested settings
  suggestedSettings: z.object({
    showHeader: z.boolean(),
    showFooter: z.boolean(),
    isEvergreen: z.boolean(),
  }),
});
```

### Post-Processing

```typescript
function postProcessGeneratedLP(
  generated: z.infer<typeof lpGenerationSchema>,
  branding: SiteBrandingData,
): Partial<LandingPageStudio> {
  // 1. Convert component array to Studio tree format
  const contentStudio = convertToStudioTree(generated.components);

  // 2. Inject form settings into LPForm components
  if (generated.formFields) {
    injectFormFields(contentStudio, generated.formFields);
  }

  // 3. Generate unique component IDs
  assignUniqueIds(contentStudio);

  return {
    title: generated.title,
    slug: generated.slug,
    description: generated.description,
    contentStudio,
    useStudioFormat: true,
    seoConfig: generated.seo,
    conversionGoal: generated.conversionGoal,
    showHeader: generated.suggestedSettings.showHeader,
    showFooter: generated.suggestedSettings.showFooter,
    isEvergreen: generated.suggestedSettings.isEvergreen,
    status: "draft",
  };
}
```

### AI Generation UI

Integrate into the template picker dialog:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Create a Landing Page                                          [✕]    │
│                                                                         │
│  ┌──── AI Generate ────┐  ┌──── Choose Template ────┐                 │
│  │                      │  │                          │                 │
│  │  🤖 Describe your    │  │  Browse templates...     │                 │
│  │  landing page and    │  │                          │                 │
│  │  AI will create it   │  │  (existing template      │                 │
│  │  for you.            │  │   picker content)        │                 │
│  │                      │  │                          │                 │
│  │  ┌────────────────┐  │  └──────────────────────────┘                 │
│  │  │ Describe your  │  │                                               │
│  │  │ landing page.. │  │                                               │
│  │  │                │  │                                               │
│  │  └────────────────┘  │                                               │
│  │                      │                                               │
│  │  Category: [Auto ▾]  │                                               │
│  │                      │                                               │
│  │  ☑ Include form      │                                               │
│  │  ☐ Include countdown │                                               │
│  │  ☑ Include testi...  │                                               │
│  │  ☑ Include logo bar  │                                               │
│  │                      │                                               │
│  │  [✨ Generate LP]    │                                               │
│  │                      │                                               │
│  └──────────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Flow**:

1. User selects "AI Generate" tab in the creation dialog
2. Types description of the landing page they want
3. Optionally selects category, preferences
4. Clicks "Generate LP"
5. Loading state with progress indicator
6. AI generates complete LP with content
7. LP created in draft status
8. User redirected to Studio LP editor to refine and customize
9. User publishes when ready

### Testing Notes for LPB-09

1. **AI generation** — Generates valid Studio component tree from description
2. **Component tree validity** — Generated tree renders in StudioRenderer without errors
3. **Form generation** — AI includes relevant form fields for the use case
4. **Content quality** — Generated copy is professional, specific, and persuasive
5. **Branding** — Generated LP respects site branding context
6. **Slug generation** — AI produces valid URL slugs
7. **SEO** — Generated meta title/description are relevant
8. **Category detection** — AI correctly determines LP category from description
9. **Editor integration** — Generated LP opens correctly in Studio LP editor
10. **Error handling** — AI failures show user-friendly error messages
11. **Timeout** — Request completes within 60s maxDuration
12. **Zod schema** — No .int()/.min()/.max() in AI schema

---

## Phase LPB-10: Super Admin Health View + Client Portal LP Management

### Purpose

Provide platform-wide landing page oversight for super admins (abuse detection, performance metrics, health monitoring) and give portal clients visibility into their landing pages with appropriate permission gates.

### Database Tables

No new tables. This phase queries existing `mod_mktmod01_landing_pages`, `mod_mktmod01_lp_visits`, `mod_mktmod01_lp_conversions` tables added in prior phases. One new view is created for admin aggregation.

**Migration File**: `migrations/lpb-10-admin-portal-views.sql`

```sql
-- ============================================================
-- LPB-10: Admin aggregation view + portal permission additions
-- ============================================================

-- Materialized view for admin dashboard performance (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mod_mktmod01_lp_admin_stats AS
SELECT
  lp.site_id,
  s.name AS site_name,
  a.id AS agency_id,
  a.name AS agency_name,
  COUNT(lp.id) AS total_lps,
  COUNT(lp.id) FILTER (WHERE lp.status = 'published') AS published_lps,
  COUNT(lp.id) FILTER (WHERE lp.status = 'draft') AS draft_lps,
  COUNT(lp.id) FILTER (WHERE lp.status = 'archived') AS archived_lps,
  COUNT(lp.id) FILTER (WHERE lp.use_studio_format = true) AS studio_lps,
  COUNT(lp.id) FILTER (WHERE lp.use_studio_format = false OR lp.use_studio_format IS NULL) AS legacy_lps,
  COALESCE(SUM(lp.total_visits), 0) AS total_visits,
  COALESCE(SUM(lp.total_conversions), 0) AS total_conversions,
  CASE
    WHEN SUM(lp.total_visits) > 0
    THEN ROUND((SUM(lp.total_conversions)::numeric / SUM(lp.total_visits)::numeric) * 100, 2)
    ELSE 0
  END AS avg_conversion_rate,
  MAX(lp.created_at) AS last_lp_created_at,
  MAX(lp.updated_at) AS last_lp_updated_at
FROM mod_mktmod01_landing_pages lp
JOIN sites s ON s.id = lp.site_id
JOIN agencies a ON a.id = s.agency_id
GROUP BY lp.site_id, s.name, a.id, a.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lp_admin_stats_site
ON mod_mktmod01_lp_admin_stats(site_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_lp_admin_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mod_mktmod01_lp_admin_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add portal permission column for landing pages if not exists
-- (Permissions for portal users are stored in JSONB on client_portal_users)
-- No schema change needed — permissions are in JSONB, we just need to handle
-- 'can_manage_marketing' which already exists. LP access piggybacks on this.
```

### TypeScript Types

```typescript
// src/modules/marketing/types/landing-page-types.ts — ADD these types

/** Admin-level stats aggregation per site */
export interface LPAdminSiteStats {
  siteId: string;
  siteName: string;
  agencyId: string;
  agencyName: string;
  totalLps: number;
  publishedLps: number;
  draftLps: number;
  archivedLps: number;
  studioLps: number;
  legacyLps: number;
  totalVisits: number;
  totalConversions: number;
  avgConversionRate: number;
  lastLpCreatedAt: string | null;
  lastLpUpdatedAt: string | null;
}

/** Platform-wide aggregation for admin dashboard header */
export interface LPPlatformStats {
  totalLps: number;
  totalPublished: number;
  totalDraft: number;
  totalArchived: number;
  totalStudio: number;
  totalLegacy: number;
  totalVisits: number;
  totalConversions: number;
  platformConversionRate: number;
  activeSites: number;
  topPerformers: LPAdminSiteStats[];
}

/** Portal landing page view — limited fields for client access */
export interface PortalLandingPage {
  id: string;
  title: string;
  slug: string;
  status: LandingPageStatus;
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  publicUrl: string;
}
```

### Server Actions

#### Admin Actions

**File**: `src/modules/marketing/actions/admin-landing-pages.ts`

```typescript
"use server";

/**
 * getLPPlatformStats()
 * - Auth: super_admin only
 * - Returns: LPPlatformStats
 * - Queries materialized view + raw aggregates
 */

/**
 * getLPAdminSiteStats(filters: { agencyId?: string, search?: string, sortBy?: string, page?: number })
 * - Auth: super_admin only
 * - Returns: { stats: LPAdminSiteStats[], total: number }
 * - Paginated list of per-site stats
 */

/**
 * refreshLPAdminStats()
 * - Auth: super_admin only
 * - Returns: { success: boolean }
 * - Calls refresh_lp_admin_stats() function
 */

/**
 * getAdminLPList(filters: { siteId?: string, status?: string, search?: string, page?: number })
 * - Auth: super_admin only
 * - Returns: { pages: LandingPage[], total: number }
 * - Browse all LPs across all sites with filtering
 */

/**
 * adminArchiveLP(lpId: string)
 * - Auth: super_admin only
 * - Returns: { success: boolean }
 * - Force-archive a landing page (abuse prevention)
 */
```

#### Portal Actions

**File**: `src/modules/marketing/actions/portal-landing-pages.ts`

```typescript
"use server";

/**
 * getPortalLandingPages(siteId: string)
 * - Auth: requirePortalAuth() + can_manage_marketing permission check
 * - Returns: PortalLandingPage[]
 * - Maps DB records, appends publicUrl for each LP
 */

/**
 * getPortalLPStats(siteId: string)
 * - Auth: requirePortalAuth() + can_manage_marketing permission check
 * - Returns: { totalPages: number, published: number, totalVisits: number, totalConversions: number, avgConversionRate: number }
 */
```

### Components

#### Admin Components

**File**: `src/modules/marketing/components/admin/lp-admin-dashboard.tsx`

```typescript
"use client";

/**
 * LPAdminDashboard
 * - Stat cards: Total LPs, Published, Studio vs Legacy, Total Visits, Total Conversions, Platform CVR
 * - Table: Per-site stats with columns: Site, Agency, LPs, Published, Visits, Conversions, CVR, Last Activity
 * - Filters: Search by site/agency name, sort by visits/conversions/CVR
 * - Actions: View site LPs, Force archive
 * - Migration progress: Studio format adoption percentage bar
 * - Refresh button to trigger materialized view refresh
 */
```

**File**: `src/modules/marketing/components/admin/lp-admin-table.tsx`

```typescript
"use client";

/**
 * LPAdminTable
 * - Props: { stats: LPAdminSiteStats[] }
 * - DataTable with columns: Site, Agency, Total LPs, Published, Visits, Conversions, CVR, Studio %, Actions
 * - Row click → expands to show individual LPs for that site
 * - Action menu: View LPs, Open site dashboard, Force archive LP
 */
```

#### Portal Components

**File**: `src/modules/marketing/components/portal/portal-lp-list.tsx`

```typescript
"use client";

/**
 * PortalLPList
 * - Props: { siteId: string }
 * - Fetches portal landing pages on mount
 * - Shows stat cards: Total, Published, Visits, Conversions
 * - Card grid or table of LPs with: title, status badge, visits, conversions, CVR, published date
 * - Each card has "View Live" link pointing to public URL
 * - No edit capability (portal users view-only for LPs)
 * - Empty state with explanation: "Your team is building landing pages for this site"
 */
```

### Pages / Routes

#### Admin Page

**File**: `src/app/(dashboard)/admin/landing-pages/page.tsx`

```typescript
// Server component
// Auth: super_admin check (redirect to /dashboard if not)
// Metadata: { title: "Landing Pages Health — Admin" }
// Fetches: getLPPlatformStats()
// Renders: <LPAdminDashboard stats={stats} />

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLPPlatformStats } from "@/modules/marketing/actions/admin-landing-pages";
import { LPAdminDashboard } from "@/modules/marketing/components/admin/lp-admin-dashboard";

export const metadata: Metadata = {
  title: "Landing Pages Health — Admin",
};

export default async function AdminLandingPagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") redirect("/dashboard");

  const stats = await getLPPlatformStats();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Pages — Platform Health</h1>
        <p className="text-muted-foreground">
          Monitor landing page usage, performance, and migration status across all sites.
        </p>
      </div>
      <LPAdminDashboard stats={stats} />
    </div>
  );
}
```

#### Portal Page

**File**: `src/app/portal/landing-pages/page.tsx`

```typescript
// Server component
// Auth: requirePortalAuth()
// Permission: can_manage_marketing (from client portal permissions)
// Renders: <PortalLPList /> for each site the client has marketing access to

import { Metadata } from "next";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { PortalLPList } from "@/modules/marketing/components/portal/portal-lp-list";

export const metadata: Metadata = {
  title: "Landing Pages — Portal",
};

export default async function PortalLandingPagesPage() {
  await requirePortalAuth();
  // Component handles data fetching internally per site
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        <p className="text-muted-foreground">
          View your landing page performance and published pages.
        </p>
      </div>
      <PortalLPList />
    </div>
  );
}
```

### Navigation Entries

**Admin navigation** — Add to admin nav in `src/config/navigation.ts`:

```typescript
{
  title: "Landing Pages",
  href: "/admin/landing-pages",
  icon: LayoutTemplate,  // from lucide-react
}
```

**Portal navigation** — Add to portal nav in `src/config/portal-navigation.ts`:

```typescript
{
  title: "Landing Pages",
  href: "/portal/landing-pages",
  icon: LayoutTemplate,
  moduleSlug: "marketing",
  permissionKey: "can_manage_marketing",
}
```

### Testing Notes for LPB-10

1. **Admin auth guard** — Non-super-admin users redirected to /dashboard
2. **Platform stats** — All aggregate numbers match manual spot-check
3. **Per-site stats table** — Shows all sites with landing pages, sortable
4. **Studio migration tracker** — Shows correct % of studio-format vs legacy LPs
5. **Force archive** — Super admin can archive any LP regardless of site
6. **Materialized view refresh** — Button triggers refresh, stats update
7. **Portal auth** — requirePortalAuth() blocks unauthenticated access
8. **Portal permissions** — Only clients with can_manage_marketing see LP data
9. **Portal LP list** — Shows correct LPs for the client's sites
10. **Portal stats** — Aggregate numbers match dashboard views
11. **Public URL** — "View Live" links in portal point to correct `/lp/[slug]` URL
12. **Empty states** — Both admin and portal show meaningful empty states

---

## Phase LPB-11: Migration — Convert Existing LPs from Block Format to Studio Format

### Purpose

Provide a migration path for existing landing pages that use the old `contentJson` (block-array) format. This phase creates migration tooling that converts legacy blocks into Studio component trees, enabling existing LPs to use the new editor and render through the Studio pipeline. It also adds backward-compatible rendering so legacy LPs continue to work during the migration period.

### Database Changes

No new tables. This phase modifies existing `mod_mktmod01_landing_pages` rows by populating `content_studio` and setting `use_studio_format = true` for migrated pages.

**Migration File**: `migrations/lpb-11-migration-utilities.sql`

```sql
-- ============================================================
-- LPB-11: Add migration tracking columns
-- ============================================================

ALTER TABLE mod_mktmod01_landing_pages
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS migration_source TEXT DEFAULT NULL;
-- migration_source: 'auto' | 'manual' | null

-- Index for finding unmigrated pages
CREATE INDEX IF NOT EXISTS idx_lp_migration_status
ON mod_mktmod01_landing_pages(use_studio_format, migrated_at)
WHERE use_studio_format = false OR use_studio_format IS NULL;
```

### TypeScript Types

```typescript
// src/modules/marketing/types/landing-page-types.ts — ADD these types

/** Block-to-Studio migration mapping */
export interface BlockMigrationResult {
  success: boolean;
  lpId: string;
  lpTitle: string;
  originalBlockCount: number;
  convertedComponentCount: number;
  warnings: string[];
  /** Set if migration failed */
  error?: string;
}

/** Batch migration progress */
export interface MigrationProgress {
  total: number;
  migrated: number;
  failed: number;
  inProgress: boolean;
  results: BlockMigrationResult[];
}

/** Legacy block to studio component mapping config */
export interface BlockToStudioMap {
  blockType: LandingPageBlockType;
  studioComponentType: string;
  transformContent: (
    blockContent: Record<string, unknown>,
  ) => Record<string, unknown>;
}
```

### Server Actions

**File**: `src/modules/marketing/actions/lp-migration.ts`

```typescript
"use server";

/**
 * getMigrationStatus(siteId: string)
 * - Auth: agency member with manage_marketing + marketing module installed
 * - Returns: { total: number, migrated: number, legacy: number, percentage: number }
 * - Quick stats on migration progress for a site
 */

/**
 * previewBlockMigration(lpId: string)
 * - Auth: agency member with manage_marketing
 * - Returns: { originalBlocks: LandingPageBlock[], convertedTree: StudioComponentNode[], warnings: string[] }
 * - Dry-run conversion — shows what the migrated version would look like without saving
 * - Does NOT modify the database
 */

/**
 * migrateLP(lpId: string)
 * - Auth: agency member with manage_marketing
 * - Returns: BlockMigrationResult
 * - Converts a single LP from block format to studio format
 * - Sets content_studio, use_studio_format = true, migrated_at = now(), migration_source = 'manual'
 * - Preserves original contentJson as backup
 * - Fires automation event: marketing.landing_page.migrated
 */

/**
 * migrateSiteLPs(siteId: string)
 * - Auth: agency member with manage_marketing
 * - Returns: MigrationProgress
 * - Batch converts ALL legacy LPs for a site
 * - Each LP converted individually (failure of one doesn't block others)
 * - Sets migration_source = 'auto' for batch migrations
 * - Fires automation events per LP
 */

/**
 * revertMigration(lpId: string)
 * - Auth: agency member with manage_marketing
 * - Returns: { success: boolean }
 * - Reverts a migrated LP back to legacy format
 * - Sets use_studio_format = false, clears content_studio
 * - Only works if contentJson still contains original blocks
 */
```

### Migration Engine

**File**: `src/modules/marketing/lib/lp-migration-engine.ts`

```typescript
/**
 * Core migration engine that converts legacy block arrays to Studio component trees.
 *
 * BLOCK TYPE → STUDIO COMPONENT MAPPING:
 *
 *   hero          → LPHeroSplitLeft (with single-column layout if no form detected)
 *                    Fields: heading, subheading, ctaText, ctaUrl, backgroundImage, overlay
 *
 *   features      → Section > Columns (3-col grid)
 *                    Each feature → Container with heading + text + optional icon
 *
 *   testimonials  → Section > LPTestimonialGrid
 *                    Maps name, role, company, quote, avatar from block content
 *
 *   pricing       → Section > Columns (2 or 3-col based on plan count)
 *                    Each plan → Container with title, price, features list, CTA
 *
 *   faq           → Section > LPFAQ
 *                    Maps question/answer pairs directly
 *
 *   countdown     → Section > LPCountdown
 *                    Maps target date, labels, expired message
 *
 *   video         → Section > LPVideoBackground (or Container + video embed)
 *                    Maps video URL, autoplay setting
 *
 *   gallery       → Section > Gallery grid
 *                    Maps image URLs, captions
 *
 *   optin_form    → Section > LPForm
 *                    Creates form with original fields mapped to new field system
 *                    Legacy: email, name, phone, company, message (5 hardcoded)
 *                    Studio: Creates matching LPFormField[] entries
 *
 *   cta           → Section > Container with heading + button
 *                    Maps heading, subheading, buttonText, buttonUrl
 *
 *   social_proof  → Section > LPLogoBar
 *                    Maps logos array, or falls back to text-based trust badges
 *
 *   text          → Section > Text (rich text component)
 *                    Maps content HTML directly
 *
 *   image         → Section > Image
 *                    Maps src, alt, caption
 *
 * Each conversion wraps the output in a Section component with padding/margin
 * to approximate the visual layout of the original block renderer.
 *
 * StyleConfig → Brand overrides:
 *   If the legacy LP has a StyleConfig, extract values and apply as
 *   component-level style overrides in the studio tree.
 */

export function convertBlocksToStudioTree(
  blocks: LandingPageBlock[],
  styleConfig?: StyleConfig | null,
): { tree: StudioComponentNode[]; warnings: string[] };

export function convertSingleBlock(
  block: LandingPageBlock,
  styleConfig?: StyleConfig | null,
): { node: StudioComponentNode; warnings: string[] };
```

### Components

**File**: `src/modules/marketing/components/landing-pages/lp-migration-panel.tsx`

```typescript
"use client";

/**
 * LPMigrationPanel
 * - Props: { siteId: string }
 * - Shows migration status: X of Y pages migrated, progress bar
 * - "Migrate All" button for batch migration
 * - Table of legacy LPs with individual "Preview Migration" and "Migrate" buttons
 * - Each row shows: title, block count, status, last edited
 * - Preview opens a side-by-side comparison dialog:
 *   Left: current legacy render (iframe)
 *   Right: studio render preview (iframe)
 *   Bottom: list of warnings
 * - Migration in progress shows per-LP progress
 * - Completed migrations show success/failure stats
 * - "Revert" button on migrated LPs (safety net)
 */
```

**File**: `src/modules/marketing/components/landing-pages/lp-migration-preview-dialog.tsx`

```typescript
"use client";

/**
 * LPMigrationPreviewDialog
 * - Props: { lpId: string, open: boolean, onClose: () => void }
 * - Side-by-side comparison view
 * - Left iframe: renders legacy format via existing shared renderer
 * - Right iframe: renders converted studio format via StudioRenderer
 * - Warning list at bottom highlighting any conversion issues
 * - "Looks Good — Migrate" and "Cancel" buttons
 */
```

### Pages / Routes

**Migration panel is embedded in the existing landing pages management page** — No new page route.

Add a "Migration" tab to the existing landing pages index page at:
`src/app/(dashboard)/dashboard/sites/[siteId]/marketing/landing-pages/page.tsx`

The tab renders `<LPMigrationPanel siteId={siteId} />` and only appears when there are legacy-format LPs (i.e., at least one LP with `use_studio_format = false`).

### API Routes

**File**: `src/app/api/marketing/lp/migration-preview/route.ts`

```typescript
/**
 * POST /api/marketing/lp/migration-preview
 *
 * Request: { lpId: string }
 * Response: {
 *   legacyHtml: string,   // Rendered via shared renderer (as before)
 *   studioHtml: string,   // Rendered via StudioRenderer with converted tree
 *   warnings: string[]
 * }
 *
 * Auth: Session-based, agency member with manage_marketing
 * Used by the migration preview dialog to render side-by-side comparison
 */
```

### Backward Compatibility

During the migration period, the public LP route (`/lp/[slug]`) MUST support both formats:

```typescript
// In the LP page component (from LPB-03):
if (landingPage.useStudioFormat && landingPage.contentStudio) {
  // Render via StudioRenderer pipeline
  return <StudioRenderer tree={landingPage.contentStudio} brandColors={brandColors} />;
} else {
  // Render via legacy shared HTML renderer (landing-page-renderer.ts)
  return <LegacyLPRenderer contentJson={landingPage.contentJson} styleConfig={landingPage.styleConfig} />;
}
```

This dual-renderer approach ensures:

1. Existing published LPs continue working without migration
2. Users can migrate at their own pace
3. Reverted LPs still render correctly
4. No downtime or broken pages during the transition

### Testing Notes for LPB-11

1. **Migration status** — Correct count of legacy vs studio format LPs
2. **Preview conversion** — Each block type converts to valid studio component
3. **Side-by-side preview** — Both iframes render without errors
4. **Single LP migration** — Successfully converts and saves studio format
5. **Batch migration** — All legacy LPs for a site convert; failures don't block others
6. **Revert migration** — Reverted LP renders correctly in legacy format
7. **Backward compat** — Legacy LPs render via old renderer; Studio LPs via StudioRenderer
8. **StyleConfig migration** — Legacy style overrides carry over to studio format
9. **Form migration** — optin_form blocks convert to LPForm with correct fields
10. **Content preservation** — Original contentJson preserved after migration (backup)
11. **Warning accuracy** — Conversion warnings are meaningful and actionable
12. **Automation events** — marketing.landing_page.migrated fires on each successful migration
13. **Published LP stability** — Published legacy LPs continue serving correctly during/after migration
14. **Migration tracking** — migrated_at and migration_source columns populated correctly

---

## Automation Integration

### New Event Types

Add to `src/modules/automation/lib/event-types.ts` under the `marketing` namespace:

```typescript
marketing: {
  // ... existing events ...

  landing_page: {
    created: "marketing.landing_page.created",
    updated: "marketing.landing_page.updated",
    published: "marketing.landing_page.published",
    unpublished: "marketing.landing_page.unpublished",
    archived: "marketing.landing_page.archived",
    visited: "marketing.landing_page.visited",
    converted: "marketing.landing_page.converted",
    migrated: "marketing.landing_page.migrated",
  },
  lp_form: {
    submitted: "marketing.lp_form.submitted",
  },
}
```

**Event Payloads**:

| Event                      | Payload Fields                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `landing_page.created`     | `lpId`, `siteId`, `title`, `slug`, `createdBy`, `useStudioFormat`                          |
| `landing_page.updated`     | `lpId`, `siteId`, `title`, `slug`, `changeType` (content/settings/seo)                     |
| `landing_page.published`   | `lpId`, `siteId`, `title`, `slug`, `publicUrl`                                             |
| `landing_page.unpublished` | `lpId`, `siteId`, `title`, `slug`                                                          |
| `landing_page.archived`    | `lpId`, `siteId`, `title`, `slug`, `archivedBy`                                            |
| `landing_page.visited`     | `lpId`, `siteId`, `visitorId`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign`         |
| `landing_page.converted`   | `lpId`, `siteId`, `visitorId`, `conversionGoal`, `formData` (if form submit)               |
| `landing_page.migrated`    | `lpId`, `siteId`, `title`, `migrationSource` (auto/manual), `blockCount`, `componentCount` |
| `lp_form.submitted`        | `lpId`, `siteId`, `formName`, `formFields`, `submitterEmail`, `submitterName`              |

### New Action Types

Add to `src/modules/automation/lib/action-types.ts`:

```typescript
// Marketing — Landing Page Actions

"marketing.create_landing_page": {
  id: "marketing.create_landing_page",
  name: "Create Landing Page",
  description: "Create a new landing page from a template",
  category: "marketing",
  icon: "LayoutTemplate",
  inputs: {
    site_id: { type: "string", required: true, description: "Target site ID" },
    template_id: { type: "string", required: true, description: "Template to use" },
    title: { type: "string", required: true, description: "Page title" },
    slug: { type: "string", required: false, description: "URL slug (auto-generated if empty)" },
  },
  outputs: {
    lp_id: { type: "string", description: "Created landing page ID" },
    success: { type: "boolean", description: "Whether creation succeeded" },
  },
},

"marketing.publish_landing_page": {
  id: "marketing.publish_landing_page",
  name: "Publish Landing Page",
  description: "Publish a draft landing page",
  category: "marketing",
  icon: "Globe",
  inputs: {
    lp_id: { type: "string", required: true, description: "Landing page ID" },
  },
  outputs: {
    public_url: { type: "string", description: "Published page URL" },
    success: { type: "boolean", description: "Whether publish succeeded" },
  },
},

"marketing.archive_landing_page": {
  id: "marketing.archive_landing_page",
  name: "Archive Landing Page",
  description: "Archive a landing page",
  category: "marketing",
  icon: "Archive",
  inputs: {
    lp_id: { type: "string", required: true, description: "Landing page ID" },
  },
  outputs: {
    success: { type: "boolean", description: "Whether archive succeeded" },
  },
},
```

### System Workflow Templates

Pre-built automation workflows that leverage LP events:

1. **LP Form → CRM Contact**
   - Trigger: `marketing.lp_form.submitted`
   - Action: `crm.create_contact` with form fields mapped
   - Action: `crm.add_to_pipeline` with default pipeline

2. **LP Form → Email Notification**
   - Trigger: `marketing.lp_form.submitted`
   - Action: `marketing.send_email` to site admin with form data

3. **LP Published → Team Notification**
   - Trigger: `marketing.landing_page.published`
   - Action: Internal notification to agency team

4. **LP High-Traffic Alert**
   - Trigger: `marketing.landing_page.visited` (with visit threshold condition)
   - Action: Internal notification when LP exceeds visit threshold

---

## Cross-Module Integration Reference

### CRM Module (`mod_crmmod01_`)

| Direction      | What                                         | How                                                             |
| -------------- | -------------------------------------------- | --------------------------------------------------------------- |
| LP → CRM       | Form submissions create/update contacts      | `marketing.lp_form.submitted` → `crm.create_contact` automation |
| LP → CRM       | Conversion data enriches contact timeline    | Write conversion event to CRM activity log                      |
| CRM → LP       | Contact data pre-fills forms (if logged in)  | Read from CRM contacts API                                      |
| Files Modified | `src/modules/automation/lib/event-types.ts`  | Add LP events                                                   |
| Files Modified | `src/modules/automation/lib/action-types.ts` | Add LP actions                                                  |

### Automation Module (`mod_automod01_`)

| Direction       | What                                         | How                                                         |
| --------------- | -------------------------------------------- | ----------------------------------------------------------- |
| LP → Automation | LP events trigger workflows                  | All LP events registered in event-types.ts                  |
| Automation → LP | Workflow actions create/publish/archive LPs  | LP actions registered in action-types.ts                    |
| Files Modified  | `src/modules/automation/lib/event-types.ts`  | Add marketing.landing_page._ and marketing.lp_form._ events |
| Files Modified  | `src/modules/automation/lib/action-types.ts` | Add marketing.create_landing_page, publish, archive actions |

### E-Commerce Module (`mod_ecommod01_`)

| Direction         | What                               | How                                                     |
| ----------------- | ---------------------------------- | ------------------------------------------------------- |
| LP → E-Commerce   | LPs link to products/checkout      | Studio Product/Pricing components reference product IDs |
| E-Commerce → LP   | Product data displayed on LP       | API fetch product details for pricing components        |
| No Files Modified | Integration is via component props | Product ID passed to pricing/CTA components             |

### Marketing Module (same module — `mod_mktmod01_`)

| Direction        | What                                                | How                                                  |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------- |
| LP ↔ Email       | LP URL included in email campaigns                  | Existing campaign builder links to LP public URL     |
| LP ↔ Subscribers | Form submissions can subscribe to lists             | Form action includes "Add to subscriber list" option |
| LP ↔ SMS         | LP URL in SMS campaigns                             | Existing SMS sender uses LP URL                      |
| Files Modified   | `src/modules/marketing/types/landing-page-types.ts` | Extend with all new types                            |
| Files Modified   | `src/modules/marketing/actions/landing-pages.ts`    | Extend with studio-format actions                    |

### Studio Builder (core platform — not a module)

| Direction      | What                                               | How                                                |
| -------------- | -------------------------------------------------- | -------------------------------------------------- |
| Studio → LP    | LP editor uses Studio infrastructure               | StudioEditor component, Zustand stores, DnD system |
| Studio → LP    | LP components use ComponentRenderer pipeline       | Register LP components in component-registry.ts    |
| LP → Studio    | LP-specific components only appear in LP mode      | Component registry filtered by `category: 'lp-*'`  |
| Files Modified | `src/lib/studio/engine/component-registry.ts`      | Register new LP component types                    |
| Files Modified | `src/components/studio/studio-editor.tsx`          | Add LP mode support (modified in LPB-02)           |
| Files Modified | `src/components/studio/panels/component-panel.tsx` | LP-specific palette filtering                      |

### Sites (core platform)

| Direction      | What                                                | How                                                       |
| -------------- | --------------------------------------------------- | --------------------------------------------------------- |
| Sites → LP     | Site branding (colors, fonts, logo) applied to LP   | Read from `sites.settings` JSONB, inject as CSS variables |
| Sites → LP     | Header/footer HTML provided to LP                   | Storefront layout components render conditionally         |
| Files Modified | Storefront `[slug]` catch-all or LP-specific route. | New route intercepts `/lp/[slug]` paths                   |
| Files Modified | `src/config/navigation.ts`                          | Ensure LP nav item exists under marketing                 |

---

## Testing Requirements

### Per-Phase Testing Checklist

#### Every Phase (Mandatory)

- [ ] `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit` — zero new errors
- [ ] `npx next build` — build succeeds
- [ ] Navigation renders correctly (no broken links)
- [ ] Auth guards work (unauthorized users redirected)

#### LPB-01: Database Foundation

- [ ] Migration runs without errors via MCP Supabase
- [ ] All tables created with correct columns, types, defaults
- [ ] All indexes created
- [ ] RLS policies function correctly (tested via Supabase dashboard)
- [ ] TypeScript types compile without errors
- [ ] Module registration: slug appears in module catalog
- [ ] LP component types registered in component-registry.ts

#### LPB-02: Studio LP Editor

- [ ] "New Landing Page" opens Studio in LP mode
- [ ] Component palette shows only LP-relevant components
- [ ] Drag-and-drop works for LP components
- [ ] Save/publish/autosave works
- [ ] LP-specific toolbar items appear (branding, header/footer toggle)
- [ ] Back button returns to LP list

#### LPB-03: URL Routing & Site Integration

- [ ] Published LP serves at `https://[site-domain]/lp/[slug]`
- [ ] Header/footer toggle works correctly
- [ ] Site branding (colors, fonts) applied to LP
- [ ] Custom branding overrides work
- [ ] Non-existent slugs return 404
- [ ] Draft LPs not accessible publicly
- [ ] SEO meta tags rendered correctly
- [ ] OG/Twitter cards render correctly

#### LPB-04: Hero Components

- [ ] All hero variants render correctly (split left/right, centered, full-bleed, video)
- [ ] Background images load and display
- [ ] Video backgrounds auto-play (muted)
- [ ] Gradient overlays render
- [ ] Form can be embedded in split hero layout
- [ ] Responsive design works (mobile/tablet/desktop)
- [ ] CTA buttons link correctly

#### LPB-05: Advanced Form System

- [ ] All field types render: text, email, phone, select, radio, checkbox, textarea, number, date, hidden
- [ ] Required field validation works
- [ ] Conditional logic shows/hides fields correctly
- [ ] Form submissions saved to database
- [ ] CRM integration: submissions create contacts
- [ ] Thank-you redirect works
- [ ] Inline success message displays
- [ ] Automation event fires on submission
- [ ] Honeypot/time-based spam prevention works

#### LPB-06: Conversion Components

- [ ] Logo bar renders logos with optional grayscale
- [ ] Trust badges display correctly
- [ ] Countdown timer works (counts down to target date)
- [ ] Countdown shows expired message after deadline
- [ ] Social proof notifications render
- [ ] Pricing tables render with feature comparisons
- [ ] Stat counters animate on scroll

#### LPB-07: Template Library

- [ ] All 15+ templates load in template picker
- [ ] Template preview shows accurate representation
- [ ] "Use Template" creates LP with template content
- [ ] Template categories filter correctly
- [ ] Templates render in Studio format without errors
- [ ] Template content is editable after creation

#### LPB-08: Analytics & Conversion Tracking

- [ ] Visit tracking records page views
- [ ] UTM parameters captured correctly
- [ ] Conversion tracking fires on goal completion
- [ ] Analytics dashboard shows accurate metrics
- [ ] Date range filtering works
- [ ] Referrer breakdown displays correctly
- [ ] Device breakdown displays correctly
- [ ] A/B testing variant tracking works (if implemented)

#### LPB-09: AI Landing Page Generator

- [ ] AI generates valid Studio component tree
- [ ] Generated LP renders without errors
- [ ] Form fields are relevant to the use case
- [ ] Generated copy is professional
- [ ] Slug is valid and unique
- [ ] SEO meta generated correctly
- [ ] Request completes within 60s
- [ ] Error handling shows user-friendly messages
- [ ] No .int()/.min()/.max() in AI Zod schema

#### LPB-10: Admin & Portal

- [ ] Admin dashboard loads with correct platform-wide stats
- [ ] Admin can browse LPs across all sites
- [ ] Admin can force-archive LPs
- [ ] Materialized view refreshes correctly
- [ ] Portal shows LPs only for client's sites
- [ ] Portal permission check works (can_manage_marketing)
- [ ] Portal "View Live" links work

#### LPB-11: Migration

- [ ] Migration status shows correct legacy vs studio counts
- [ ] Single LP conversion produces valid studio tree
- [ ] Side-by-side preview renders both versions
- [ ] Batch migration handles all LPs; failures don't block
- [ ] Revert restores legacy rendering
- [ ] Published LPs remain accessible during migration
- [ ] Both render paths (legacy + studio) work simultaneously

### Key User Journeys to Verify

1. **Create LP from Template**: Dashboard → Marketing → Landing Pages → New → Pick template → Customize in Studio → Preview → Publish → Visit public URL
2. **Create LP from Scratch**: Dashboard → Marketing → Landing Pages → New → Blank → Add hero + form + testimonials + CTA → Publish → Visit URL
3. **AI Generate LP**: Dashboard → Marketing → Landing Pages → New → AI Generate → Describe LP → Review → Edit in Studio → Publish
4. **Form Submission Flow**: Visitor lands on LP → fills form → submits → success message → CRM contact created → automation fires → agency notified
5. **Migration Flow**: Dashboard → LP list → Migration tab → Preview migration → Approve → Verify studio render → Confirm
6. **Client Portal View**: Client logs in → Portal → Landing Pages → Sees list → Views stats → Clicks "View Live"
7. **Super Admin Oversight**: Admin → Landing Pages health → Reviews platform stats → Identifies low-performing sites → Force-archives abusive LP

---

## Module Registration Checklist

Since this is an overhaul of an existing feature (Landing Pages within Marketing module), not a new module, the registration checklist is modified:

### Already Done (Marketing module is registered)

- [x] Database: modules_v2 record for marketing exists
- [x] Code catalog: marketing entry in module-catalog.ts
- [x] Core module auto-install: marketing in CORE_MODULE_SLUGS
- [x] Dashboard navigation: marketing entry exists
- [x] Portal navigation: marketing entry exists
- [x] Permissions: can_manage_marketing exists
- [x] Site detail page: marketing tab exists
- [x] AI Designer: marketing module type exists

### New Registration Items for LP Builder Overhaul

- [ ] **Component registry**: Register all LP component types in `component-registry.ts` (LPB-01)
- [ ] **Studio LP mode**: Add mode switching logic to StudioEditor (LPB-02)
- [ ] **Storefront route**: Add `/lp/[slug]` route handling (LPB-03)
- [ ] **Admin navigation**: Add "Landing Pages" entry under admin nav (LPB-10)
- [ ] **Portal navigation**: Add "Landing Pages" entry under portal nav (LPB-10)
- [ ] **Automation events**: Add `marketing.landing_page.*` and `marketing.lp_form.*` events (LPB-01)
- [ ] **Automation actions**: Add `marketing.create_landing_page`, `publish`, `archive` actions (LPB-01)
- [ ] **Template seeding**: Insert template records in database (LPB-07)
- [ ] **Migration tooling**: Block→Studio conversion engine (LPB-11)

---

## Appendix: Component Registry Entries Quick Reference

All LP components to register in `src/lib/studio/engine/component-registry.ts`:

| Component Type      | Category        | Display Name       | Description                              |
| ------------------- | --------------- | ------------------ | ---------------------------------------- |
| `LPHeroSplitLeft`   | `lp-heroes`     | Split Hero (Left)  | Hero with content left, media/form right |
| `LPHeroSplitRight`  | `lp-heroes`     | Split Hero (Right) | Hero with media/form left, content right |
| `LPHeroCentered`    | `lp-heroes`     | Centered Hero      | Full-width centered hero with CTA        |
| `LPHeroFullBleed`   | `lp-heroes`     | Full-Bleed Hero    | Edge-to-edge background image hero       |
| `LPHeroVideo`       | `lp-heroes`     | Video Hero         | Hero with video background               |
| `LPForm`            | `lp-forms`      | Lead Capture Form  | Multi-field form with validation         |
| `LPFormInline`      | `lp-forms`      | Inline Form        | Horizontal single-line form              |
| `LPFormFloating`    | `lp-forms`      | Floating Form      | Sticky/floating form panel               |
| `LPLogoBar`         | `lp-conversion` | Logo Bar           | Scrolling client/partner logos           |
| `LPTrustBadges`     | `lp-conversion` | Trust Badges       | Security and trust indicators            |
| `LPCountdown`       | `lp-conversion` | Countdown Timer    | Urgency countdown                        |
| `LPSocialProof`     | `lp-conversion` | Social Proof       | Recent activity notifications            |
| `LPPricingTable`    | `lp-conversion` | Pricing Table      | Feature comparison pricing               |
| `LPStatCounter`     | `lp-conversion` | Stat Counter       | Animated statistics                      |
| `LPTestimonialGrid` | `lp-conversion` | Testimonials       | Grid/carousel testimonials               |
| `LPFAQ`             | `lp-conversion` | FAQ Accordion      | Question and answer section              |
| `LPFeatureGrid`     | `lp-content`    | Feature Grid       | Icon + text feature cards                |
| `LPSteps`           | `lp-content`    | How It Works       | Numbered step-by-step process            |
| `LPComparison`      | `lp-content`    | Before/After       | Comparison table or slider               |

---

_End of PHASE-LPB-MASTER-GUIDE.md — This document is the single source of truth for the Landing Page Builder Pro overhaul. Do not modify unless a fundamental architecture decision changes._

# DRAMAC Marketing Module — Complete Implementation Master Guide

**Document Type**: Master Implementation Guide (AI Agent Reference)  
**Created**: April 11, 2026  
**Platform**: DRAMAC CMS — Enterprise Module Marketplace  
**Production URL**: https://app.dramacagency.com  
**Module Prefix**: `mod_mktmod01_`  
**Module Slug**: `marketing`

---

## How to Use This Guide

This document is the **single source of truth** for building the DRAMAC Marketing Module. It is designed to be consumed by AI agents across multiple sessions.

### Workflow Per Session

1. **Read this entire guide** to understand the full vision
2. **Read ALL memory bank files** (`/memory-bank/*.md`) to understand current platform state
3. **Pick the next unimplemented phase** from the phase list below
4. **Create a detailed phase document** (e.g., `PHASE-MKT-01-DATABASE-FOUNDATION.md`) with step-by-step implementation plan
5. **Implement that phase completely** — all code, migrations, types, tests
6. **Verify**: Run `npx tsc --noEmit --skipLibCheck` with `NODE_OPTIONS="--max-old-space-size=8192"` — zero errors required
7. **Build**: Run `npx next build` — must succeed
8. **Commit**: `git add -A && git commit -m "feat: Phase MKT-XX — [description]" && git push`
9. **Update memory bank**: Update `activeContext.md` and `progress.md` with what was actually built
10. **Do NOT modify this master guide** — it stays as the north star vision

### Critical Platform Rules (MUST Follow)

- **All prices in CENTS** (integers) — K250.00 = 25000
- **Supabase returns snake_case** — always use `mapRecord()`/`mapRecords()` from `@/lib/map-db-record`
- **Every server page needs auth guard**: `if (!user) redirect('/login')`
- **AI Zod schemas**: No `.int()`, `.min()`, `.max()` — Claude rejects these
- **Vercel function timeout**: `maxDuration = 60` on all AI API routes
- **Locale**: Zambia-first — `ZMW` currency, `K` symbol, `Africa/Lusaka` timezone, 16% VAT
- **Email sender**: `Dramac <noreply@app.dramacagency.com>` via Resend
- **Module DB prefix**: All tables MUST be `mod_mktmod01_*`
- **No `dark:` Tailwind variants** in storefront/public components
- **Use semantic Tailwind**: `bg-card`, `text-foreground`, `bg-primary` — never hardcoded colors
- **`'use client'` components** must NOT contain inline `'use server'` annotations
- **Import server actions** as functions from separate files
- **Toast notifications**: Use `sonner` (not `useToast`)
- **Font inline styles**: Always use `fontFamily: value || undefined` (never empty string)

---

## Table of Contents

### Foundation

- **Phase MKT-01**: Database Foundation, Module Registration & Type System
- **Phase MKT-02**: Email Campaign Engine (Builder, Sending, Templates)
- **Phase MKT-03**: Email Analytics & Tracking (Opens, Clicks, Bounces)

### Core Marketing

- **Phase MKT-04**: Drip Sequences & Marketing Automation Templates
- **Phase MKT-05**: Marketing Hub Dashboard (Unified Analytics)
- **Phase MKT-06**: Landing Pages & Conversion Funnels

### Content & Channels

- **Phase MKT-07**: Blog Marketing Enhancement (CTAs, Lead Capture, RSS, Content-to-Email)
- **Phase MKT-08**: SMS & WhatsApp Marketing (Multi-Channel Campaigns)

### Intelligence & Administration

- **Phase MKT-09**: AI Marketing Intelligence (Subject Lines, Send Times, Personalization)
- **Phase MKT-10**: Super Admin Platform Controls (Quotas, Deliverability, Abuse)
- **Phase MKT-11**: Client Portal Marketing Views (Permission-Gated)
- **Phase MKT-12**: Cross-Module Deep Integration (Chat AI, E-Commerce, Booking, CRM, Social)

---

## Platform Architecture Context

### Multi-Tenant Hierarchy

```
Super Admin (Platform operator — DRAMAC)
    └── Agency (Organization that manages client businesses)
            ├── Team Members (roles: owner, admin, member)
            │   └── 21+ granular permissions across 5 categories
            ├── Clients (businesses the agency manages)
            │   └── Client Portal Access (12 permission columns)
            ├── Sites (websites/storefronts per client)
            │   ├── Installed Modules (from marketplace)
            │   ├── Pages (DRAMAC Studio visual builder)
            │   ├── Blog, SEO, Forms, Media
            │   └── Storefront (customer auth, cart, orders)
            └── Module Subscriptions (agency pays via Paddle)
```

### Where Marketing Lives in This Hierarchy

- **Marketing data is SITE-SCOPED** — campaigns belong to a site, not an agency
- **Agency manages marketing** for their clients' sites (same as e-commerce, CRM, etc.)
- **Client portal** shows marketing data for their site(s) based on permissions
- **Super admin** sees platform-wide email health and sending metrics
- **Storefront visitors** see: opt-in forms, landing pages, email preference center

### Existing Module Dependencies

The Marketing Module DEPENDS ON and INTEGRATES WITH:

| Module                                 | How Marketing Uses It                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **CRM** (`mod_crmmod01_*`)             | Contacts are the audience. Segments become targeting criteria. Tags used for personalization. Lead scores updated by engagement. |
| **Automation** (`automation_*`)        | Workflow engine processes drip sequences. Marketing events trigger workflows. Marketing actions available in workflow builder.   |
| **E-Commerce** (`mod_ecommod01_*`)     | Abandoned cart data, purchase history for segmentation. Flash sales auto-create campaigns. Product recommendations in emails.    |
| **Live Chat** (`mod_chat_*`)           | AI responder reads email engagement data. Chat events trigger marketing sequences.                                               |
| **Social Media** (social media module) | Campaign calendar syncs. Attribution tracking. Social posts can promote email campaigns.                                         |
| **Blog** (blog tables)                 | Content-to-email pipeline. Blog CTAs capture subscribers. RSS auto-newsletters.                                                  |
| **Email System** (`src/lib/email/`)    | Reuses Resend client, branding system, template rendering. Marketing adds bulk sending + tracking on top.                        |

### Tech Stack Reference

- **Framework**: Next.js 16.1.1, React 19, TypeScript strict
- **Database**: Supabase PostgreSQL with RLS
- **UI**: Radix UI + Tailwind CSS 4 + Framer Motion
- **State**: Zustand + TanStack Query + React Hook Form + Zod
- **Email Provider**: Resend (REST API)
- **AI**: Claude Sonnet 4.6 (primary), Haiku 4.5 (fast tasks)
- **Charts**: Recharts
- **Workflow Canvas**: ReactFlow (used by Automation module)
- **Rich Text**: TipTap
- **Billing**: Paddle (Merchant of Record)
- **Auth**: Supabase Auth (dashboard/portal) + bcrypt custom (storefront)

---

## Relationship: Marketing Module vs Automation Module

### They Are DIFFERENT Layers

```
┌─────────────────────────────────────────────────────────┐
│  MARKETING MODULE (Campaign Management Layer)            │
│                                                          │
│  "WHAT to send, to WHOM, WHEN, and measure RESULTS"     │
│                                                          │
│  • Campaign builder & scheduler                          │
│  • Visual email template designer                        │
│  • Audience builder (wraps CRM segments)                 │
│  • A/B testing framework                                 │
│  • Email analytics (opens, clicks, bounces, revenue)     │
│  • Marketing hub dashboard                               │
│  • Landing page funnels                                  │
│  • Blog-to-email pipeline                                │
│  • Multi-channel (email + SMS + WhatsApp)                │
│  • Attribution & ROI tracking                            │
│                                                          │
│  PRODUCES: marketing.* events                            │
│  CONSUMES: automation workflows for drip execution       │
└────────────────────┬────────────────────────────────────┘
                     │ USES (not replaces)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  AUTOMATION MODULE (Universal Workflow Engine)            │
│                                                          │
│  "WHEN event X occurs, DO actions Y in sequence Z"       │
│                                                          │
│  • ReactFlow visual workflow canvas                      │
│  • 47+ event triggers from ALL modules                   │
│  • 20+ cross-module actions                              │
│  • Conditional branching, delays, loops                  │
│  • Webhook & schedule triggers                           │
│  • Execution history & error handling                    │
│                                                          │
│  CONSUMES: marketing.* events (15+ new types)            │
│  PROVIDES: Execution engine for drip sequences           │
└─────────────────────────────────────────────────────────┘
```

### Example: Welcome Email Series

1. **Marketing Module UI**: Agent creates "Welcome Series" campaign — designs 5 emails, sets delays between them, targets "New Subscribers" audience
2. **Under the hood**: Marketing module creates an automation workflow with the email steps + delay nodes
3. **Trigger**: When `marketing.subscriber.added` event fires → automation engine picks up the workflow
4. **Execution**: Automation engine runs each step (send email → wait 2 days → send email → wait 3 days → ...)
5. **Tracking**: Each email send fires `marketing.email.sent` → tracking pixel fires `marketing.email.opened` → link click fires `marketing.email.clicked`
6. **Dashboard**: Marketing hub shows open rates, click rates, conversion attribution

### What Gets Added to Automation (NOT Replaced)

**New event types** added to `src/modules/automation/lib/event-types.ts`:

```
marketing.campaign.created
marketing.campaign.started
marketing.campaign.paused
marketing.campaign.completed
marketing.email.sent
marketing.email.opened
marketing.email.clicked
marketing.email.bounced
marketing.email.unsubscribed
marketing.email.complained
marketing.subscriber.added
marketing.subscriber.removed
marketing.list.created
marketing.sms.sent
marketing.sms.delivered
marketing.sms.failed
marketing.funnel.step_completed
marketing.funnel.converted
```

**New action types** added to `src/modules/automation/lib/action-types.ts`:

```
marketing.send_campaign        — Trigger a campaign send to an audience
marketing.add_to_list          — Add contact to marketing list
marketing.remove_from_list     — Remove contact from marketing list
marketing.add_to_drip          — Enroll contact in drip sequence
marketing.remove_from_drip     — Remove contact from drip sequence
marketing.update_subscriber    — Update subscriber preferences
marketing.create_campaign      — Programmatically create a campaign
marketing.send_sms             — Send SMS to contact
```

---

## Access Control Design

### Agency Dashboard (`/dashboard/sites/[siteId]/marketing/`)

**Who**: Agency owners, admins, members with `manage_marketing` permission  
**What they can do**:

- Full campaign management (create, edit, send, schedule, pause, cancel)
- Email template design and management
- Audience/list management
- A/B testing configuration
- View all analytics and reports
- Configure drip sequences
- Manage landing pages and funnels
- Blog marketing tools (CTAs, lead capture)
- SMS/WhatsApp campaigns
- Marketing settings (sending limits, default sender info, compliance)

**Routes**:

```
/dashboard/sites/[siteId]/marketing/                    — Overview dashboard
/dashboard/sites/[siteId]/marketing/campaigns/          — Campaign list
/dashboard/sites/[siteId]/marketing/campaigns/new/      — Create campaign
/dashboard/sites/[siteId]/marketing/campaigns/[id]/     — Campaign detail + analytics
/dashboard/sites/[siteId]/marketing/templates/          — Email template library
/dashboard/sites/[siteId]/marketing/templates/[id]/     — Template editor
/dashboard/sites/[siteId]/marketing/audiences/          — Audience/list management
/dashboard/sites/[siteId]/marketing/audiences/[id]/     — Audience detail
/dashboard/sites/[siteId]/marketing/sequences/          — Drip sequences
/dashboard/sites/[siteId]/marketing/sequences/[id]/     — Sequence editor
/dashboard/sites/[siteId]/marketing/funnels/            — Landing page funnels
/dashboard/sites/[siteId]/marketing/funnels/[id]/       — Funnel editor
/dashboard/sites/[siteId]/marketing/analytics/          — Marketing analytics hub
/dashboard/sites/[siteId]/marketing/settings/           — Marketing settings
```

### Client Portal (`/portal/sites/[siteId]/marketing/`)

**Who**: Clients with `can_manage_marketing` permission  
**What they can do** (configurable per client):

- View campaign performance (read-only by default)
- View subscriber growth and list sizes
- Create simple campaigns (if permitted)
- Manage their own email lists
- View marketing calendar
- View conversion funnel reports

**Routes**:

```
/portal/sites/[siteId]/marketing/                       — Marketing overview
/portal/sites/[siteId]/marketing/campaigns/             — Campaign list (view or full)
/portal/sites/[siteId]/marketing/campaigns/[id]/        — Campaign detail
/portal/sites/[siteId]/marketing/subscribers/           — Subscriber management
/portal/sites/[siteId]/marketing/analytics/             — Analytics view
```

### Super Admin (`/admin/marketing/`)

**Who**: Super admin only (`profiles.role === 'super_admin'`)  
**What they can do**:

- Platform-wide email sending dashboard
- Per-agency sending quotas and throttle controls
- Deliverability monitoring (bounce rates, spam complaints across all agencies)
- Abuse detection and auto-suspension
- Global email template library (shared across all agencies)
- Sending domain management and verification status
- Resend account health metrics

**Routes**:

```
/admin/marketing/                                       — Platform email health dashboard
/admin/marketing/sending/                               — Sending metrics & quotas
/admin/marketing/deliverability/                        — Bounce/complaint monitoring
/admin/marketing/templates/                             — Global template library
/admin/marketing/domains/                               — Sending domain management
```

### Public/Storefront (No Auth Required)

**What visitors see**:

- Email opt-in forms (embedded in pages, blog posts, popups)
- Landing pages (funnel entry points)
- Email preference center (`/unsubscribe?uid=...` — already exists, will be enhanced)
- Tracking pixel (invisible 1x1 image for open tracking)
- Click redirect (link tracking through `/api/marketing/track/click/[id]`)

---

## Existing Code Integration Points

### Files That Will Be MODIFIED (Not Replaced)

These existing files get NEW entries added. No existing functionality is removed or changed.

#### 1. Automation Event Registry

**File**: `src/modules/automation/lib/event-types.ts`  
**Change**: Add `marketing` category with 18 new event types  
**Risk**: Zero — additive array entries

#### 2. Automation Action Types

**File**: `src/modules/automation/lib/action-types.ts`  
**Change**: Add `marketing` category with 8 new action types  
**Risk**: Zero — additive array entries

#### 3. Automation System Templates

**File**: `src/modules/automation/lib/system-templates.ts`  
**Change**: Add 15+ pre-built marketing workflow templates  
**Risk**: Zero — additive array entries

#### 4. Email Types

**File**: `src/lib/email/email-types.ts`  
**Change**: Add marketing email types (campaign_email, drip_email, sms_notification, etc.)  
**Risk**: Zero — additive type union + interface additions

#### 5. Email Templates

**File**: `src/lib/email/templates.ts`  
**Change**: Add marketing email template renderers  
**Risk**: Zero — additive registry entries

#### 6. Dashboard Navigation

**File**: `src/config/navigation.ts`  
**Change**: Add "Marketing" nav section under sites  
**Risk**: Zero — additive nav items

#### 7. Portal Navigation

**File**: `src/config/portal-navigation.ts`  
**Change**: Add marketing portal nav items, gated by `hasModule("marketing") && permissions.canManageMarketing`  
**Risk**: Zero — follows exact same pattern as other modules

#### 8. Roles & Permissions

**File**: `src/types/roles.ts`  
**Change**: Add `manage_marketing` permission  
**Risk**: Zero — additive permission entry

#### 9. Client Permissions

**DB Migration**: Add `can_manage_marketing` boolean column to `clients` table  
**Risk**: Zero — nullable column with default false

#### 10. Module Catalog

**File**: `src/lib/modules/module-catalog.ts`  
**Change**: Add marketing module definition  
**Risk**: Zero — additive catalog entry

#### 11. Core Module Installation

**File**: `src/lib/actions/sites.ts`  
**Change**: Add `"marketing"` to `CORE_MODULE_SLUGS` array  
**Risk**: Zero — marketing auto-installs alongside CRM, Automation, Live Chat

#### 12. CRM Contacts Table

**DB Migration**: Add 4 columns: `email_opt_in`, `sms_opt_in`, `marketing_consent_date`, `consent_source`  
**Risk**: Zero — nullable columns, no existing data affected

#### 13. Customer Context Bridge

**File**: `src/modules/live-chat/lib/customer-context-bridge.ts`  
**Change**: Add email engagement data to AI context object  
**Risk**: Low — additive data enrichment

#### 14. Blog Post Editor

**File**: `src/components/blog/post-editor.tsx`  
**Change**: Add CTA block and lead capture TipTap extensions to toolbar  
**Risk**: Low — new toolbar buttons, existing functionality untouched

### Files That Will Be CREATED (New)

All new marketing module code lives in these locations:

```
src/modules/marketing/
├── types/
│   ├── campaign-types.ts              — Campaign, template, audience types
│   ├── analytics-types.ts             — Tracking, metrics, attribution types
│   ├── sequence-types.ts              — Drip sequence types
│   ├── funnel-types.ts                — Landing page & funnel types
│   └── sms-types.ts                   — SMS/WhatsApp types
├── actions/
│   ├── campaign-actions.ts            — Campaign CRUD + send/schedule
│   ├── template-actions.ts            — Email template CRUD
│   ├── audience-actions.ts            — Audience/list management
│   ├── analytics-actions.ts           — Analytics queries
│   ├── sequence-actions.ts            — Drip sequence CRUD
│   ├── funnel-actions.ts              — Funnel CRUD
│   ├── subscriber-actions.ts          — Subscriber opt-in/out management
│   ├── sms-actions.ts                 — SMS campaign actions
│   └── settings-actions.ts            — Marketing settings
├── services/
│   ├── email-campaign-service.ts      — Bulk email sending with throttling
│   ├── tracking-service.ts            — Open/click pixel tracking
│   ├── bounce-handler.ts              — Resend webhook bounce/complaint handler
│   ├── audience-resolver.ts           — Resolves audiences to contact lists
│   ├── template-renderer.ts           — Renders campaign emails with merge vars
│   ├── attribution-service.ts         — Campaign attribution tracking
│   ├── sms-service.ts                 — Twilio SMS integration
│   └── ai-marketing-service.ts        — AI subject lines, send times, content
├── components/
│   ├── campaigns/
│   │   ├── campaign-list.tsx
│   │   ├── campaign-detail.tsx
│   │   ├── campaign-wizard.tsx        — Multi-step campaign creation
│   │   ├── campaign-analytics.tsx
│   │   └── ab-test-panel.tsx
│   ├── templates/
│   │   ├── template-list.tsx
│   │   ├── template-editor.tsx        — Drag-and-drop email builder
│   │   ├── template-preview.tsx
│   │   └── block-library.tsx          — Email builder blocks
│   ├── audiences/
│   │   ├── audience-list.tsx
│   │   ├── audience-builder.tsx       — Visual audience criteria builder
│   │   └── audience-detail.tsx
│   ├── sequences/
│   │   ├── sequence-list.tsx
│   │   ├── sequence-editor.tsx        — Visual drip sequence builder
│   │   └── sequence-analytics.tsx
│   ├── funnels/
│   │   ├── funnel-list.tsx
│   │   ├── funnel-editor.tsx
│   │   └── funnel-analytics.tsx
│   ├── analytics/
│   │   ├── marketing-dashboard.tsx    — Unified marketing hub
│   │   ├── campaign-metrics.tsx
│   │   ├── subscriber-growth.tsx
│   │   ├── channel-attribution.tsx
│   │   └── roi-calculator.tsx
│   ├── shared/
│   │   ├── merge-variable-picker.tsx  — Insert {{variables}} into templates
│   │   ├── send-time-picker.tsx       — Schedule with timezone support
│   │   ├── audience-selector.tsx      — Reusable audience picker
│   │   └── campaign-calendar.tsx      — Calendar view across all channels
│   └── blog/
│       ├── cta-block-extension.ts     — TipTap CTA block
│       ├── lead-capture-extension.ts  — TipTap lead capture form
│       └── content-to-email.tsx       — Blog post → newsletter converter
└── lib/
    ├── marketing-constants.ts         — Module constants, defaults
    ├── merge-variables.ts             — Available merge variables per context
    └── marketing-utils.ts             — Shared utilities
```

**Dashboard Pages** (new):

```
src/app/(dashboard)/dashboard/sites/[siteId]/marketing/
├── page.tsx                           — Marketing overview
├── campaigns/
│   ├── page.tsx                       — Campaign list
│   ├── new/page.tsx                   — Create campaign wizard
│   └── [campaignId]/page.tsx          — Campaign detail + analytics
├── templates/
│   ├── page.tsx                       — Template library
│   └── [templateId]/page.tsx          — Template editor
├── audiences/
│   ├── page.tsx                       — Audience list
│   └── [audienceId]/page.tsx          — Audience detail
├── sequences/
│   ├── page.tsx                       — Drip sequence list
│   └── [sequenceId]/page.tsx          — Sequence editor
├── funnels/
│   ├── page.tsx                       — Funnel list
│   └── [funnelId]/page.tsx            — Funnel editor
├── analytics/page.tsx                 — Marketing analytics hub
└── settings/page.tsx                  — Marketing settings
```

**Portal Pages** (new):

```
src/app/portal/sites/[siteId]/marketing/
├── page.tsx                           — Marketing overview
├── campaigns/
│   ├── page.tsx                       — Campaign list
│   └── [campaignId]/page.tsx          — Campaign detail
├── subscribers/page.tsx               — Subscriber management
└── analytics/page.tsx                 — Analytics view
```

**Admin Pages** (new):

```
src/app/(dashboard)/admin/marketing/
├── page.tsx                           — Platform email health
├── sending/page.tsx                   — Sending metrics & quotas
├── deliverability/page.tsx            — Bounce/complaint monitoring
├── templates/page.tsx                 — Global template library
└── domains/page.tsx                   — Sending domain management
```

**API Routes** (new):

```
src/app/api/marketing/
├── track/
│   ├── open/[trackingId]/route.ts     — 1x1 pixel open tracking
│   └── click/[trackingId]/route.ts    — Link click redirect tracking
├── webhooks/
│   └── resend/route.ts                — Resend bounce/complaint webhooks
├── subscribe/route.ts                 — Public subscriber opt-in endpoint
├── unsubscribe/route.ts               — Public unsubscribe endpoint
└── campaigns/
    └── send/route.ts                  — Campaign send execution (called by automation)
```

---

## Phase MKT-01: Database Foundation, Module Registration & Type System

### Purpose

Establish all database tables, RLS policies, TypeScript types, module registration, and permission wiring. This phase creates the skeleton that all subsequent phases build on.

### Database Tables (15 tables, all prefixed `mod_mktmod01_`)

#### Table 1: `mod_mktmod01_campaigns`

The core campaign entity. Supports email, SMS, and multi-channel campaigns.

| Column               | Type        | Constraints                                                                                     | Description                                     |
| -------------------- | ----------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `id`                 | uuid        | PK, default gen_random_uuid()                                                                   | Campaign ID                                     |
| `site_id`            | uuid        | FK sites.id, NOT NULL                                                                           | Site this campaign belongs to                   |
| `name`               | text        | NOT NULL                                                                                        | Campaign name                                   |
| `description`        | text        |                                                                                                 | Campaign description                            |
| `type`               | text        | NOT NULL, CHECK (email, sms, whatsapp, multi_channel)                                           | Campaign channel type                           |
| `status`             | text        | NOT NULL, DEFAULT 'draft', CHECK (draft, scheduled, sending, sent, paused, cancelled, archived) | Campaign lifecycle                              |
| `subject_line`       | text        |                                                                                                 | Email subject line                              |
| `preview_text`       | text        |                                                                                                 | Email preview/preheader text                    |
| `from_name`          | text        |                                                                                                 | Sender name override                            |
| `from_email`         | text        |                                                                                                 | Sender email override                           |
| `reply_to`           | text        |                                                                                                 | Reply-to address                                |
| `template_id`        | uuid        | FK mod_mktmod01_email_templates.id                                                              | Email template used                             |
| `content_html`       | text        |                                                                                                 | Rendered HTML content                           |
| `content_text`       | text        |                                                                                                 | Plain text fallback                             |
| `content_json`       | jsonb       |                                                                                                 | Structured content (blocks for builder)         |
| `audience_id`        | uuid        | FK mod_mktmod01_audiences.id                                                                    | Target audience                                 |
| `segment_id`         | uuid        |                                                                                                 | CRM segment ID (alternative to audience)        |
| `ab_test_enabled`    | boolean     | DEFAULT false                                                                                   | A/B testing active                              |
| `ab_test_config`     | jsonb       |                                                                                                 | A/B test variants (subject, content, send_time) |
| `scheduled_at`       | timestamptz |                                                                                                 | When to send (null = manual)                    |
| `started_at`         | timestamptz |                                                                                                 | When sending actually started                   |
| `completed_at`       | timestamptz |                                                                                                 | When sending finished                           |
| `total_recipients`   | integer     | DEFAULT 0                                                                                       | Total contacts targeted                         |
| `total_sent`         | integer     | DEFAULT 0                                                                                       | Emails actually sent                            |
| `total_delivered`    | integer     | DEFAULT 0                                                                                       | Confirmed delivered                             |
| `total_opened`       | integer     | DEFAULT 0                                                                                       | Unique opens                                    |
| `total_clicked`      | integer     | DEFAULT 0                                                                                       | Unique clicks                                   |
| `total_bounced`      | integer     | DEFAULT 0                                                                                       | Hard + soft bounces                             |
| `total_unsubscribed` | integer     | DEFAULT 0                                                                                       | Unsubscribes from this campaign                 |
| `total_complained`   | integer     | DEFAULT 0                                                                                       | Spam complaints                                 |
| `revenue_attributed` | integer     | DEFAULT 0                                                                                       | Revenue in CENTS attributed to this campaign    |
| `tags`               | text[]      | DEFAULT '{}'                                                                                    | Campaign tags for filtering                     |
| `metadata`           | jsonb       | DEFAULT '{}'                                                                                    | Extensible metadata                             |
| `created_by`         | uuid        | FK auth.users.id                                                                                | User who created                                |
| `created_at`         | timestamptz | DEFAULT now()                                                                                   |                                                 |
| `updated_at`         | timestamptz | DEFAULT now()                                                                                   |                                                 |

**Indexes**: `site_id`, `status`, `type`, `scheduled_at`, `created_at`  
**RLS**: Agency members can CRUD for their sites. Clients read-only (if `can_manage_marketing`).

#### Table 2: `mod_mktmod01_email_templates`

Reusable email templates with drag-and-drop block structure.

| Column            | Type        | Constraints                                                                                                        | Description                                  |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `id`              | uuid        | PK                                                                                                                 | Template ID                                  |
| `site_id`         | uuid        | FK sites.id                                                                                                        | Site scope (NULL = global/platform template) |
| `name`            | text        | NOT NULL                                                                                                           | Template name                                |
| `description`     | text        |                                                                                                                    | Template description                         |
| `category`        | text        | DEFAULT 'custom', CHECK (welcome, promotional, newsletter, transactional, announcement, winback, seasonal, custom) | Template category                            |
| `thumbnail_url`   | text        |                                                                                                                    | Preview image URL                            |
| `content_json`    | jsonb       | NOT NULL                                                                                                           | Block-based template structure               |
| `content_html`    | text        |                                                                                                                    | Pre-rendered HTML                            |
| `content_text`    | text        |                                                                                                                    | Plain text version                           |
| `subject_line`    | text        |                                                                                                                    | Default subject line                         |
| `preview_text`    | text        |                                                                                                                    | Default preview text                         |
| `merge_variables` | text[]      | DEFAULT '{}'                                                                                                       | Available merge vars (for UI hints)          |
| `is_system`       | boolean     | DEFAULT false                                                                                                      | Platform-provided template                   |
| `is_active`       | boolean     | DEFAULT true                                                                                                       | Available for use                            |
| `usage_count`     | integer     | DEFAULT 0                                                                                                          | Times used in campaigns                      |
| `created_by`      | uuid        |                                                                                                                    | Creator                                      |
| `created_at`      | timestamptz | DEFAULT now()                                                                                                      |                                              |
| `updated_at`      | timestamptz | DEFAULT now()                                                                                                      |                                              |

**Indexes**: `site_id`, `category`, `is_system`, `is_active`

#### Table 3: `mod_mktmod01_audiences`

Reusable audience definitions for targeting. Can wrap CRM segments or define custom criteria.

| Column              | Type        | Constraints                                                            | Description                                              |
| ------------------- | ----------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `id`                | uuid        | PK                                                                     | Audience ID                                              |
| `site_id`           | uuid        | FK sites.id, NOT NULL                                                  | Site scope                                               |
| `name`              | text        | NOT NULL                                                               | Audience name                                            |
| `description`       | text        |                                                                        | Audience description                                     |
| `type`              | text        | NOT NULL, CHECK (segment, list, all_subscribers, all_contacts, custom) | Audience source                                          |
| `crm_segment_id`    | uuid        |                                                                        | CRM segment ID (if type=segment)                         |
| `filter_criteria`   | jsonb       |                                                                        | Custom filter rules (same format as CRM segment filters) |
| `filter_logic`      | text        | DEFAULT 'and', CHECK (and, or)                                         | How to combine filters                                   |
| `exclude_criteria`  | jsonb       |                                                                        | Exclusion rules                                          |
| `contact_count`     | integer     | DEFAULT 0                                                              | Cached count                                             |
| `last_evaluated_at` | timestamptz |                                                                        | Last count refresh                                       |
| `is_active`         | boolean     | DEFAULT true                                                           | Available for use                                        |
| `created_by`        | uuid        |                                                                        |                                                          |
| `created_at`        | timestamptz | DEFAULT now()                                                          |                                                          |
| `updated_at`        | timestamptz | DEFAULT now()                                                          |                                                          |

**Indexes**: `site_id`, `type`, `crm_segment_id`

#### Table 4: `mod_mktmod01_subscribers`

Marketing email subscribers. Links to CRM contacts when possible.

| Column                  | Type        | Constraints                                                                            | Description                                                        |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `id`                    | uuid        | PK                                                                                     | Subscriber ID                                                      |
| `site_id`               | uuid        | FK sites.id, NOT NULL                                                                  | Site scope                                                         |
| `email`                 | text        | NOT NULL                                                                               | Email address                                                      |
| `first_name`            | text        |                                                                                        |                                                                    |
| `last_name`             | text        |                                                                                        |                                                                    |
| `phone`                 | text        |                                                                                        | Phone for SMS                                                      |
| `crm_contact_id`        | uuid        |                                                                                        | Linked CRM contact                                                 |
| `status`                | text        | NOT NULL, DEFAULT 'active', CHECK (active, unsubscribed, bounced, complained, cleaned) | Subscriber health                                                  |
| `email_opt_in`          | boolean     | DEFAULT true                                                                           | Email marketing consent                                            |
| `sms_opt_in`            | boolean     | DEFAULT false                                                                          | SMS marketing consent                                              |
| `consent_source`        | text        |                                                                                        | How they subscribed (form, import, api, manual, checkout, booking) |
| `consent_date`          | timestamptz |                                                                                        | When they consented                                                |
| `consent_ip`            | text        |                                                                                        | IP at consent time                                                 |
| `tags`                  | text[]      | DEFAULT '{}'                                                                           | Subscriber tags                                                    |
| `custom_fields`         | jsonb       | DEFAULT '{}'                                                                           | Extensible custom data                                             |
| `engagement_score`      | integer     | DEFAULT 0                                                                              | 0-100, based on open/click history                                 |
| `last_email_sent_at`    | timestamptz |                                                                                        | Last campaign email sent                                           |
| `last_email_opened_at`  | timestamptz |                                                                                        | Last email opened                                                  |
| `last_email_clicked_at` | timestamptz |                                                                                        | Last link clicked                                                  |
| `total_emails_sent`     | integer     | DEFAULT 0                                                                              |                                                                    |
| `total_emails_opened`   | integer     | DEFAULT 0                                                                              |                                                                    |
| `total_emails_clicked`  | integer     | DEFAULT 0                                                                              |                                                                    |
| `bounce_count`          | integer     | DEFAULT 0                                                                              |                                                                    |
| `unsubscribed_at`       | timestamptz |                                                                                        | When they unsubscribed (if applicable)                             |
| `unsubscribe_reason`    | text        |                                                                                        | Reason for unsubscribing                                           |
| `created_at`            | timestamptz | DEFAULT now()                                                                          |                                                                    |
| `updated_at`            | timestamptz | DEFAULT now()                                                                          |                                                                    |

**Indexes**: `site_id + email` (UNIQUE), `status`, `crm_contact_id`, `engagement_score`  
**CRITICAL**: UNIQUE constraint on `(site_id, email)` — one subscriber per email per site

#### Table 5: `mod_mktmod01_lists`

Marketing lists (manual subscriber groupings).

| Column                      | Type        | Constraints                                                 | Description                 |
| --------------------------- | ----------- | ----------------------------------------------------------- | --------------------------- |
| `id`                        | uuid        | PK                                                          | List ID                     |
| `site_id`                   | uuid        | FK sites.id, NOT NULL                                       | Site scope                  |
| `name`                      | text        | NOT NULL                                                    | List name                   |
| `description`               | text        |                                                             |                             |
| `type`                      | text        | DEFAULT 'manual', CHECK (manual, import, form_capture, api) | How list was created        |
| `subscriber_count`          | integer     | DEFAULT 0                                                   | Cached count                |
| `is_double_opt_in`          | boolean     | DEFAULT false                                               | Requires email confirmation |
| `welcome_email_template_id` | uuid        |                                                             | Auto-send on subscribe      |
| `tags`                      | text[]      | DEFAULT '{}'                                                |                             |
| `is_active`                 | boolean     | DEFAULT true                                                |                             |
| `created_by`                | uuid        |                                                             |                             |
| `created_at`                | timestamptz | DEFAULT now()                                               |                             |
| `updated_at`                | timestamptz | DEFAULT now()                                               |                             |

**Indexes**: `site_id`, `is_active`

#### Table 6: `mod_mktmod01_list_subscribers`

Junction table linking subscribers to lists.

| Column          | Type        | Constraints                              | Description                                     |
| --------------- | ----------- | ---------------------------------------- | ----------------------------------------------- |
| `id`            | uuid        | PK                                       |                                                 |
| `list_id`       | uuid        | FK mod_mktmod01_lists.id, NOT NULL       |                                                 |
| `subscriber_id` | uuid        | FK mod_mktmod01_subscribers.id, NOT NULL |                                                 |
| `added_at`      | timestamptz | DEFAULT now()                            |                                                 |
| `source`        | text        |                                          | How they were added (import, form, manual, api) |

**Indexes**: `list_id + subscriber_id` (UNIQUE), `subscriber_id`

#### Table 7: `mod_mktmod01_campaign_sends`

Individual send records for each email in a campaign. For tracking open/click per recipient.

| Column              | Type        | Constraints                                                                                                             | Description                               |
| ------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `id`                | uuid        | PK                                                                                                                      | Send record ID (also used as tracking ID) |
| `campaign_id`       | uuid        | FK mod_mktmod01_campaigns.id, NOT NULL                                                                                  |                                           |
| `subscriber_id`     | uuid        | FK mod_mktmod01_subscribers.id, NOT NULL                                                                                |                                           |
| `email`             | text        | NOT NULL                                                                                                                | Email sent to (denormalized for speed)    |
| `status`            | text        | NOT NULL, DEFAULT 'queued', CHECK (queued, sent, delivered, opened, clicked, bounced, complained, unsubscribed, failed) |                                           |
| `resend_message_id` | text        |                                                                                                                         | Resend API message ID for tracking        |
| `sent_at`           | timestamptz |                                                                                                                         | When actually sent                        |
| `delivered_at`      | timestamptz |                                                                                                                         | When confirmed delivered                  |
| `first_opened_at`   | timestamptz |                                                                                                                         | First open time                           |
| `last_opened_at`    | timestamptz |                                                                                                                         | Most recent open                          |
| `open_count`        | integer     | DEFAULT 0                                                                                                               | Total opens (including re-opens)          |
| `first_clicked_at`  | timestamptz |                                                                                                                         | First click time                          |
| `last_clicked_at`   | timestamptz |                                                                                                                         | Most recent click                         |
| `click_count`       | integer     | DEFAULT 0                                                                                                               | Total clicks                              |
| `clicked_links`     | jsonb       | DEFAULT '[]'                                                                                                            | Array of {url, clicked_at}                |
| `bounced_at`        | timestamptz |                                                                                                                         |                                           |
| `bounce_type`       | text        |                                                                                                                         | hard, soft                                |
| `bounce_reason`     | text        |                                                                                                                         |                                           |
| `unsubscribed_at`   | timestamptz |                                                                                                                         |                                           |
| `complained_at`     | timestamptz |                                                                                                                         |                                           |
| `ab_variant`        | text        |                                                                                                                         | A/B test variant identifier (A, B, etc.)  |
| `metadata`          | jsonb       | DEFAULT '{}'                                                                                                            |                                           |
| `created_at`        | timestamptz | DEFAULT now()                                                                                                           |                                           |

**Indexes**: `campaign_id`, `subscriber_id`, `email`, `status`, `resend_message_id`  
**CRITICAL**: This table can grow VERY large. Partition by month or add cleanup policy.

#### Table 8: `mod_mktmod01_sequences`

Drip email sequences (multi-step automated campaigns).

| Column                   | Type        | Constraints                                                                  | Description                                                      |
| ------------------------ | ----------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `id`                     | uuid        | PK                                                                           | Sequence ID                                                      |
| `site_id`                | uuid        | FK sites.id, NOT NULL                                                        |                                                                  |
| `name`                   | text        | NOT NULL                                                                     | Sequence name                                                    |
| `description`            | text        |                                                                              |                                                                  |
| `trigger_type`           | text        | NOT NULL, CHECK (subscriber_added, tag_added, form_submitted, event, manual) | What starts the sequence                                         |
| `trigger_config`         | jsonb       | DEFAULT '{}'                                                                 | Trigger-specific config (list_id, tag_name, form_id, event_type) |
| `status`                 | text        | DEFAULT 'draft', CHECK (draft, active, paused, archived)                     |                                                                  |
| `steps`                  | jsonb       | NOT NULL, DEFAULT '[]'                                                       | Array of sequence steps (email, delay, condition, action)        |
| `automation_workflow_id` | uuid        |                                                                              | Linked automation workflow (generated)                           |
| `total_enrolled`         | integer     | DEFAULT 0                                                                    | Total contacts that entered                                      |
| `total_completed`        | integer     | DEFAULT 0                                                                    | Completed all steps                                              |
| `total_converted`        | integer     | DEFAULT 0                                                                    | Hit conversion goal                                              |
| `conversion_goal`        | jsonb       |                                                                              | {event_type, conditions} defining success                        |
| `enrollment_limit`       | integer     |                                                                              | Max contacts in sequence at once                                 |
| `re_enrollment`          | boolean     | DEFAULT false                                                                | Can contacts re-enter                                            |
| `created_by`             | uuid        |                                                                              |                                                                  |
| `created_at`             | timestamptz | DEFAULT now()                                                                |                                                                  |
| `updated_at`             | timestamptz | DEFAULT now()                                                                |                                                                  |

**Step Structure** (in `steps` JSONB):

```json
[
  {
    "step_id": "uuid",
    "type": "email",
    "delay_amount": 0,
    "delay_unit": "immediately",
    "template_id": "uuid",
    "subject_line": "Welcome!",
    "ab_test": null
  },
  {
    "step_id": "uuid",
    "type": "delay",
    "delay_amount": 2,
    "delay_unit": "days"
  },
  {
    "step_id": "uuid",
    "type": "condition",
    "condition": { "field": "last_email_opened", "operator": "is_true" },
    "if_true_step": "uuid",
    "if_false_step": "uuid"
  },
  {
    "step_id": "uuid",
    "type": "email",
    "delay_amount": 0,
    "delay_unit": "immediately",
    "template_id": "uuid",
    "subject_line": "Did you see our offer?"
  }
]
```

#### Table 9: `mod_mktmod01_sequence_enrollments`

Tracks contacts currently enrolled in a drip sequence.

| Column            | Type        | Constraints                                                                    | Description                              |
| ----------------- | ----------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `id`              | uuid        | PK                                                                             |                                          |
| `sequence_id`     | uuid        | FK mod_mktmod01_sequences.id, NOT NULL                                         |                                          |
| `subscriber_id`   | uuid        | FK mod_mktmod01_subscribers.id, NOT NULL                                       |                                          |
| `current_step_id` | text        |                                                                                | Which step they're on                    |
| `status`          | text        | DEFAULT 'active', CHECK (active, paused, completed, converted, exited, failed) |                                          |
| `enrolled_at`     | timestamptz | DEFAULT now()                                                                  |                                          |
| `next_step_at`    | timestamptz |                                                                                | When next step should execute            |
| `completed_at`    | timestamptz |                                                                                |                                          |
| `exit_reason`     | text        |                                                                                | Why they left early                      |
| `steps_completed` | jsonb       | DEFAULT '[]'                                                                   | Array of {step_id, completed_at, status} |
| `metadata`        | jsonb       | DEFAULT '{}'                                                                   |                                          |

**Indexes**: `sequence_id`, `subscriber_id`, `status`, `next_step_at`  
**UNIQUE**: `(sequence_id, subscriber_id)` when `re_enrollment = false`

#### Table 10: `mod_mktmod01_funnels`

Landing page conversion funnels.

| Column              | Type         | Constraints                                              | Description               |
| ------------------- | ------------ | -------------------------------------------------------- | ------------------------- |
| `id`                | uuid         | PK                                                       |                           |
| `site_id`           | uuid         | FK sites.id, NOT NULL                                    |                           |
| `name`              | text         | NOT NULL                                                 | Funnel name               |
| `description`       | text         |                                                          |                           |
| `status`            | text         | DEFAULT 'draft', CHECK (draft, active, paused, archived) |                           |
| `steps`             | jsonb        | NOT NULL, DEFAULT '[]'                                   | Array of funnel steps     |
| `conversion_goal`   | jsonb        |                                                          | What counts as conversion |
| `total_visitors`    | integer      | DEFAULT 0                                                |                           |
| `total_conversions` | integer      | DEFAULT 0                                                |                           |
| `conversion_rate`   | numeric(5,2) | DEFAULT 0                                                | Percentage                |
| `ab_test_enabled`   | boolean      | DEFAULT false                                            |                           |
| `ab_test_config`    | jsonb        |                                                          | Variant configurations    |
| `created_by`        | uuid         |                                                          |                           |
| `created_at`        | timestamptz  | DEFAULT now()                                            |                           |
| `updated_at`        | timestamptz  | DEFAULT now()                                            |                           |

**Funnel Step Structure**:

```json
[
  {
    "step_id": "uuid",
    "type": "landing_page",
    "page_id": "uuid",
    "name": "Offer Page"
  },
  {
    "step_id": "uuid",
    "type": "form",
    "form_config": { "fields": [...] },
    "name": "Sign Up Form"
  },
  {
    "step_id": "uuid",
    "type": "thank_you",
    "page_id": "uuid",
    "name": "Thank You Page"
  }
]
```

#### Table 11: `mod_mktmod01_funnel_visits`

Tracking visitor progress through funnels.

| Column            | Type        | Constraints                                                      | Description                                        |
| ----------------- | ----------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| `id`              | uuid        | PK                                                               |                                                    |
| `funnel_id`       | uuid        | FK mod_mktmod01_funnels.id, NOT NULL                             |                                                    |
| `visitor_id`      | text        | NOT NULL                                                         | Anonymous visitor ID or subscriber ID              |
| `subscriber_id`   | uuid        |                                                                  | Linked subscriber (after identification)           |
| `current_step_id` | text        |                                                                  | Current funnel step                                |
| `status`          | text        | DEFAULT 'in_progress', CHECK (in_progress, completed, abandoned) |                                                    |
| `steps_visited`   | jsonb       | DEFAULT '[]'                                                     | Array of {step_id, visited_at, time_spent_seconds} |
| `source`          | text        |                                                                  | Traffic source (utm_source or referrer)            |
| `utm_params`      | jsonb       |                                                                  | Full UTM parameters                                |
| `entered_at`      | timestamptz | DEFAULT now()                                                    |                                                    |
| `converted_at`    | timestamptz |                                                                  |                                                    |
| `abandoned_at`    | timestamptz |                                                                  |                                                    |
| `ip_address`      | text        |                                                                  | For geographic analytics                           |
| `user_agent`      | text        |                                                                  | Device/browser info                                |

**Indexes**: `funnel_id`, `visitor_id`, `status`, `entered_at`

#### Table 12: `mod_mktmod01_campaign_links`

Tracked links within campaign emails.

| Column          | Type        | Constraints                            | Description                     |
| --------------- | ----------- | -------------------------------------- | ------------------------------- |
| `id`            | uuid        | PK                                     | Link tracking ID                |
| `campaign_id`   | uuid        | FK mod_mktmod01_campaigns.id, NOT NULL |                                 |
| `original_url`  | text        | NOT NULL                               | Original destination URL        |
| `tracking_url`  | text        | NOT NULL                               | Decorated tracking URL          |
| `display_text`  | text        |                                        | Link text in email              |
| `position`      | integer     |                                        | Position in email (for heatmap) |
| `total_clicks`  | integer     | DEFAULT 0                              |                                 |
| `unique_clicks` | integer     | DEFAULT 0                              |                                 |
| `created_at`    | timestamptz | DEFAULT now()                          |                                 |

**Indexes**: `campaign_id`, `tracking_url`

#### Table 13: `mod_mktmod01_settings`

Per-site marketing settings.

| Column                  | Type        | Constraints                   | Description                                    |
| ----------------------- | ----------- | ----------------------------- | ---------------------------------------------- |
| `id`                    | uuid        | PK                            |                                                |
| `site_id`               | uuid        | FK sites.id, UNIQUE, NOT NULL | One settings row per site                      |
| `default_from_name`     | text        |                               | Default sender name                            |
| `default_from_email`    | text        |                               | Default sender email                           |
| `default_reply_to`      | text        |                               | Default reply-to                               |
| `sending_quota_daily`   | integer     | DEFAULT 1000                  | Max emails per day                             |
| `sending_quota_monthly` | integer     | DEFAULT 25000                 | Max emails per month                           |
| `double_opt_in_enabled` | boolean     | DEFAULT false                 | Require email confirmation for new subscribers |
| `auto_clean_bounces`    | boolean     | DEFAULT true                  | Auto-remove hard bounced emails                |
| `auto_clean_complaints` | boolean     | DEFAULT true                  | Auto-remove spam complainers                   |
| `unsubscribe_page_url`  | text        |                               | Custom unsubscribe page                        |
| `physical_address`      | text        |                               | Required by CAN-SPAM                           |
| `company_name`          | text        |                               | Footer company name                            |
| `gdpr_enabled`          | boolean     | DEFAULT false                 | Enable GDPR compliance features                |
| `consent_text`          | text        |                               | Custom consent message for forms               |
| `timezone`              | text        | DEFAULT 'Africa/Lusaka'       | For scheduling                                 |
| `metadata`              | jsonb       | DEFAULT '{}'                  |                                                |
| `created_at`            | timestamptz | DEFAULT now()                 |                                                |
| `updated_at`            | timestamptz | DEFAULT now()                 |                                                |

#### Table 14: `mod_mktmod01_sending_stats`

Daily sending statistics for quota tracking and platform monitoring.

| Column              | Type    | Constraints           | Description   |
| ------------------- | ------- | --------------------- | ------------- |
| `id`                | uuid    | PK                    |               |
| `site_id`           | uuid    | FK sites.id, NOT NULL |               |
| `date`              | date    | NOT NULL              | Calendar date |
| `emails_sent`       | integer | DEFAULT 0             |               |
| `emails_delivered`  | integer | DEFAULT 0             |               |
| `emails_bounced`    | integer | DEFAULT 0             |               |
| `emails_complained` | integer | DEFAULT 0             |               |
| `sms_sent`          | integer | DEFAULT 0             |               |
| `sms_delivered`     | integer | DEFAULT 0             |               |
| `sms_failed`        | integer | DEFAULT 0             |               |

**Indexes**: `site_id + date` (UNIQUE), `date`

#### Table 15: `mod_mktmod01_attribution`

Campaign-to-revenue attribution tracking.

| Column                    | Type        | Constraints                                       | Description                                                              |
| ------------------------- | ----------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| `id`                      | uuid        | PK                                                |                                                                          |
| `site_id`                 | uuid        | FK sites.id, NOT NULL                             |                                                                          |
| `campaign_id`             | uuid        | FK mod_mktmod01_campaigns.id                      | Source campaign                                                          |
| `sequence_id`             | uuid        | FK mod_mktmod01_sequences.id                      | Source sequence                                                          |
| `funnel_id`               | uuid        | FK mod_mktmod01_funnels.id                        | Source funnel                                                            |
| `subscriber_id`           | uuid        | FK mod_mktmod01_subscribers.id                    | Contact who converted                                                    |
| `attribution_type`        | text        | NOT NULL, CHECK (first_touch, last_touch, linear) | Attribution model                                                        |
| `event_type`              | text        | NOT NULL                                          | What happened (order_created, booking_created, deal_won, form_submitted) |
| `event_id`                | text        |                                                   | ID of the attributed event                                               |
| `revenue`                 | integer     | DEFAULT 0                                         | Revenue in CENTS                                                         |
| `attributed_at`           | timestamptz | DEFAULT now()                                     |                                                                          |
| `touchpoint_window_hours` | integer     | DEFAULT 168                                       | Hours between campaign interaction and conversion (default 7 days)       |

**Indexes**: `site_id`, `campaign_id`, `sequence_id`, `subscriber_id`, `attributed_at`

### Module Registration

**Add to `modules_v2` table**:

```sql
INSERT INTO modules_v2 (id, slug, name, description, category, ...) VALUES (
  gen_random_uuid(),
  'marketing',
  'Marketing',
  'Email campaigns, drip sequences, audiences, landing pages & funnels, multi-channel marketing with full analytics',
  'marketing',
  ...
);
```

**Add to CORE_MODULE_SLUGS** in `src/lib/actions/sites.ts`:

```typescript
const CORE_MODULE_SLUGS = ["crm", "automation", "live-chat", "marketing"];
```

### Permission Changes

**Agency permissions** — add to `src/types/roles.ts`:

```typescript
manage_marketing; // Full marketing module access
```

**Client portal** — add column to `clients` table:

```sql
ALTER TABLE clients ADD COLUMN can_manage_marketing boolean DEFAULT false;
```

**Client site permissions** — add column to `client_site_permissions` table:

```sql
ALTER TABLE client_site_permissions ADD COLUMN can_manage_marketing boolean;
```

### CRM Contact Enhancements

Add marketing consent columns to CRM contacts:

```sql
ALTER TABLE mod_crmmod01_contacts ADD COLUMN email_opt_in boolean DEFAULT false;
ALTER TABLE mod_crmmod01_contacts ADD COLUMN sms_opt_in boolean DEFAULT false;
ALTER TABLE mod_crmmod01_contacts ADD COLUMN marketing_consent_date timestamptz;
ALTER TABLE mod_crmmod01_contacts ADD COLUMN consent_source text;
```

### Type System

Create comprehensive TypeScript interfaces in `src/modules/marketing/types/`. Every column above must have a corresponding camelCase TypeScript interface property. Follow exact patterns from existing modules (e.g., `src/modules/ecommerce/types/`).

### RLS Policies

Every table needs row-level security policies following the exact same pattern used by other modules:

- Agency members: CRUD access for their agency's sites
- Clients: Read-only (or based on `can_manage_marketing`)
- Service role: Full access (for automation engine)

### MKT-01 Deliverables Checklist

- [ ] Migration SQL file with all 15 tables + indexes + RLS
- [ ] `mod_mktmod01_settings` auto-seed on marketing module installation (like `seedDefaultDepartments` does for live-chat)
- [ ] TypeScript types for all entities (`campaign-types.ts`, `analytics-types.ts`, `sequence-types.ts`, `funnel-types.ts`)
- [ ] Module registered in `modules_v2` table and module catalog
- [ ] `"marketing"` added to `CORE_MODULE_SLUGS`
- [ ] `manage_marketing` permission added to roles
- [ ] `can_manage_marketing` added to client permissions
- [ ] CRM contact marketing columns migration
- [ ] Dashboard navigation updated with Marketing section
- [ ] Portal navigation updated with Marketing section (gated)
- [ ] Admin navigation updated with Marketing section
- [ ] Bootstrap function created (seeds settings on install)
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase MKT-02: Email Campaign Engine

**Priority:** CRITICAL — Core of the marketing module
**Estimated Complexity:** High
**Dependencies:** Phase MKT-01 complete (all tables exist)
**Files Created:** ~25 new files
**Files Modified:** 2-3 existing files

### 2.1 Overview

This phase builds the complete email campaign creation, management, and sending system. It includes:

- Campaign builder with audience selection
- Visual email template designer (drag-and-drop block editor)
- Template library with pre-built industry templates
- Sending engine with Resend bulk API integration
- A/B testing framework for subject lines and content
- Bounce/complaint webhook handlers
- Campaign scheduling and throttling

### 2.2 Campaign Builder UI

**Location:** `src/app/dashboard/sites/[siteId]/marketing/campaigns/`

#### Campaign List Page (`page.tsx`)

```
Route: /dashboard/sites/[siteId]/marketing/campaigns
```

**Component Structure:**

```tsx
// page.tsx - Server component
// Fetches campaigns with stats summary

// Key features:
// - Tab filter: All | Draft | Scheduled | Sending | Sent | Paused
// - Search by campaign name
// - Sort by: created_at, scheduled_at, open_rate, click_rate
// - Bulk actions: Delete, Archive, Duplicate
// - Each row shows: name, status badge, audience count, open rate, click rate, sent date
// - "New Campaign" button → /campaigns/new

// Data fetch pattern (follows existing platform pattern):
const { data: campaigns } = await supabase
  .from("mod_mktmod01_campaigns")
  .select(
    `
    *,
    mod_mktmod01_campaign_stats(*)
  `,
  )
  .eq("site_id", siteId)
  .order("created_at", { ascending: false });
```

**Status Badge Colors (follow existing design system):**

- `draft` → gray
- `scheduled` → blue
- `sending` → yellow/amber (animated pulse)
- `sent` → green
- `paused` → orange
- `cancelled` → red

#### Campaign Creation Wizard (`new/page.tsx`)

```
Route: /dashboard/sites/[siteId]/marketing/campaigns/new
```

**Multi-step wizard (follows existing platform wizard patterns):**

**Step 1: Campaign Details**

```tsx
// Fields:
// - name: string (required) — internal campaign name
// - subject_line: string (required) — email subject
// - preview_text: string (optional) — preview/preheader text
// - from_name: string (default: site name from settings)
// - from_email: string (default: site email from settings)
// - reply_to: string (optional)
// - campaign_type: 'regular' | 'ab_test' (radio toggle)
//
// AI Enhancement:
// - "Generate Subject Lines" button → calls Claude Haiku
// - Input: campaign name + target audience description
// - Output: 5 subject line suggestions with predicted engagement
// - User picks one or edits
```

**Step 2: Audience Selection**

```tsx
// Audience source options:
// 1. "All Subscribers" — all contacts with email_subscribed = true
// 2. "CRM Segment" — select from existing CRM segments (dropdown)
// 3. "Contact Tag" — select tags to include/exclude
// 4. "Custom Filter" — build filter with conditions:
//    - Field (email, name, company, created_at, last_order_date, total_spent, etc.)
//    - Operator (equals, contains, greater_than, less_than, between, is_empty)
//    - Value
//    - AND/OR combiner for multiple conditions
//
// Live count preview: "This audience contains approximately X contacts"
// Exclude list: contacts who unsubscribed, bounced, or complained
//
// Data model: saves to campaign.audience_filter as JSONB:
// {
//   "type": "segment" | "all" | "tags" | "custom",
//   "segment_id": "uuid" | null,
//   "tags": { "include": ["tag1"], "exclude": ["tag2"] },
//   "conditions": [
//     { "field": "total_spent", "operator": "greater_than", "value": 100, "combiner": "AND" }
//   ]
// }
```

**Step 3: Email Content**

```tsx
// Two options:
// 1. "Design from scratch" → opens visual email editor
// 2. "Use template" → opens template library picker
//
// Visual Email Editor (see Section 2.3 below)
// Template selected → loads into editor for customization
```

**Step 4: Review & Schedule**

```tsx
// Summary of all settings
// Send options:
// 1. "Send Now" — immediate send
// 2. "Schedule" — date/time picker (site timezone from settings)
// 3. "Save as Draft" — save without scheduling
//
// "Send Test Email" button — sends to current user's email
// Estimated delivery time based on audience size and throttle settings
//
// On submit:
// - Creates campaign record with status 'scheduled' or 'draft'
// - If 'Send Now': triggers server action to begin sending
// - If 'Schedule': creates scheduled job entry
// - Fires automation event: marketing.campaign.created
```

#### Campaign Edit Page (`[campaignId]/page.tsx`)

```
Route: /dashboard/sites/[siteId]/marketing/campaigns/[campaignId]
```

**Behavior by status:**

- `draft` → full edit, same wizard UI
- `scheduled` → edit allowed, can reschedule or cancel
- `sending` → read-only, live progress display
- `sent` → read-only, redirects to stats/report view
- `paused` → can resume or cancel

### 2.3 Visual Email Template Editor

**Location:** `src/modules/marketing/components/email-editor/`

This is a drag-and-drop block-based email editor. It generates clean, responsive HTML email markup.

#### Editor Architecture

```
email-editor/
├── EmailEditor.tsx              — Main editor wrapper
├── EditorCanvas.tsx             — Drop zone / preview area
├── EditorSidebar.tsx            — Block palette + settings panel
├── EditorToolbar.tsx            — Undo/redo, preview, save, device toggle
├── blocks/
│   ├── BlockRenderer.tsx        — Routes block type to component
│   ├── HeaderBlock.tsx          — Logo + navigation text
│   ├── TextBlock.tsx            — Rich text (heading, paragraph, list)
│   ├── ImageBlock.tsx           — Single image with alt text + link
│   ├── ButtonBlock.tsx          — CTA button (text, URL, style)
│   ├── DividerBlock.tsx         — Horizontal rule / spacer
│   ├── ColumnsBlock.tsx         — 2 or 3 column layout
│   ├── ProductBlock.tsx         — E-commerce product card(s)
│   ├── SocialBlock.tsx          — Social media icon links
│   ├── FooterBlock.tsx          — Unsubscribe link + address
│   ├── SpacerBlock.tsx          — Vertical spacing
│   ├── VideoBlock.tsx           — Video thumbnail with play button link
│   └── CodeBlock.tsx            — Raw HTML insertion (advanced)
├── properties/
│   ├── BlockProperties.tsx      — Settings panel for selected block
│   ├── TextProperties.tsx       — Font, size, color, alignment
│   ├── ImageProperties.tsx      — Upload, alt, link, border
│   ├── ButtonProperties.tsx     — Text, URL, bg color, border radius
│   └── LayoutProperties.tsx     — Padding, background, border
├── utils/
│   ├── block-types.ts           — TypeScript types for all blocks
│   ├── default-blocks.ts        — Default content for new blocks
│   ├── html-renderer.ts         — Converts block JSON → email HTML
│   ├── mjml-renderer.ts         — Optional: block JSON → MJML → HTML
│   └── sanitize.ts              — HTML sanitization for code blocks
└── hooks/
    ├── useEditorState.ts        — Block array state management
    ├── useDragDrop.ts           — Drag and drop logic
    └── useUndoRedo.ts           — Undo/redo stack
```

#### Block Data Model

```typescript
// block-types.ts
interface EmailBlock {
  id: string; // nanoid
  type: BlockType;
  properties: Record<string, unknown>;
  children?: EmailBlock[]; // for ColumnsBlock
}

type BlockType =
  | "header"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "columns"
  | "product"
  | "social"
  | "footer"
  | "spacer"
  | "video"
  | "code";

// Campaign content_json structure:
interface EmailContent {
  version: 1;
  globalStyles: {
    backgroundColor: string;
    fontFamily: string;
    contentWidth: number; // px, default 600
  };
  blocks: EmailBlock[];
}

// Example TextBlock properties:
interface TextBlockProps {
  content: string; // HTML string (sanitized)
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string;
  alignment: "left" | "center" | "right";
  padding: { top: number; right: number; bottom: number; left: number };
}

// Example ButtonBlock properties:
interface ButtonBlockProps {
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  alignment: "left" | "center" | "right";
  fullWidth: boolean;
  padding: { top: number; right: number; bottom: number; left: number };
}
```

#### HTML Email Rendering (`html-renderer.ts`)

```typescript
// Converts EmailContent → valid email HTML
// CRITICAL: Must produce email-client-compatible HTML:
// - Inline CSS only (no <style> blocks — many clients strip them)
// - Table-based layout for Outlook compatibility
// - All images with explicit width/height
// - Fallback fonts
// - Max width 600px centered
// - Background colors via bgcolor attribute + CSS
// - Border radius via CSS only (Outlook ignores, degrades gracefully)
//
// MUST include:
// - {{unsubscribe_url}} placeholder in footer
// - {{tracking_pixel}} placeholder at bottom (for open tracking)
// - All links wrapped with {{track_click:ORIGINAL_URL}} placeholder
//
// These placeholders are replaced at send time with actual URLs
//
// Function signature:
export function renderEmailHtml(
  content: EmailContent,
  brandColors?: BrandColors,
): string;
```

#### Editor Features

```
1. Drag-and-drop blocks from sidebar palette to canvas
2. Click block to select → shows properties panel on right
3. Reorder blocks by dragging within canvas
4. Delete block (X button or Delete key)
5. Duplicate block
6. Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
7. Device preview toggle: Desktop (600px) | Mobile (375px)
8. "Preview in Browser" — opens rendered HTML in new tab
9. "Send Test" — sends to entered email address
10. Global styles: background color, font family, content width
11. Brand color integration — loads site's brand colors for quick access
12. Image upload via existing Supabase storage pattern
13. AI content generation — "Write this section" button on text blocks
```

### 2.4 Email Template Library

**Location:** `src/modules/marketing/data/email-templates/`

#### Pre-Built Templates (15 minimum)

```typescript
// template-library.ts
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string; // path to preview image
  content: EmailContent; // block JSON
  tags: string[];
}

type TemplateCategory =
  | "welcome" // Welcome & onboarding
  | "newsletter" // Regular newsletters
  | "promotion" // Sales & promotions
  | "announcement" // Product/feature announcements
  | "event" // Event invitations
  | "ecommerce" // Order-related marketing
  | "reengagement" // Win-back campaigns
  | "seasonal"; // Holiday/seasonal

// REQUIRED templates (minimum 15):
// 1.  welcome-simple          — Clean welcome email
// 2.  welcome-onboarding      — Multi-step onboarding kickoff
// 3.  newsletter-standard     — Header + 3 articles + footer
// 4.  newsletter-minimal      — Simple text-focused newsletter
// 5.  promotion-sale          — Big hero image + CTA
// 6.  promotion-coupon        — Coupon/discount code highlight
// 7.  promotion-flash-sale    — Urgency-driven with countdown language
// 8.  announcement-product    — New product/feature showcase
// 9.  announcement-update     — Company/service update
// 10. event-invitation        — Event details with RSVP button
// 11. event-reminder          — Event reminder with countdown
// 12. ecommerce-abandoned     — Abandoned cart recovery
// 13. ecommerce-review        — Post-purchase review request
// 14. reengagement-winback    — "We miss you" re-engagement
// 15. seasonal-holiday        — Customizable holiday greeting
```

#### Custom Template Saving

```typescript
// Users can save any campaign design as a reusable template
// Saved to mod_mktmod01_templates table
// Available in template picker for future campaigns
//
// API route: POST /api/sites/[siteId]/marketing/templates
// Body: { name, description, category, content_json }
```

### 2.5 Sending Engine

**Location:** `src/modules/marketing/lib/sending-engine.ts`

#### Architecture

```typescript
// The sending engine handles bulk email delivery through Resend API.
// It processes campaigns in batches to respect rate limits and
// provide progress tracking.

// IMPORTANT: Uses existing Resend client from src/lib/email.ts
// Do NOT create a new Resend instance — import the existing one

import { resend } from "@/lib/email";

interface SendingConfig {
  batchSize: number; // emails per batch (default: 100)
  batchDelayMs: number; // delay between batches (default: 1000ms)
  maxConcurrent: number; // concurrent API calls per batch (default: 10)
  retryAttempts: number; // retry failed sends (default: 3)
  retryDelayMs: number; // delay between retries (default: 5000ms)
}

// Sending flow:
// 1. Resolve audience → list of contact emails
// 2. Filter out unsubscribed, bounced, complained contacts
// 3. Render email HTML from content_json
// 4. Replace personalization tokens ({{first_name}}, {{company}}, etc.)
// 5. Replace tracking placeholders (pixel, click URLs)
// 6. Split into batches
// 7. Send batches sequentially with delay
// 8. Update campaign stats in real-time
// 9. Log each send to mod_mktmod01_email_sends table
// 10. Fire automation event on completion
```

#### Audience Resolution

```typescript
// audience-resolver.ts
export async function resolveAudience(
  supabase: SupabaseClient,
  siteId: string,
  audienceFilter: AudienceFilter,
): Promise<Contact[]> {
  // Base query: contacts for this site with email_subscribed = true
  let query = supabase
    .from("mod_crm01_contacts")
    .select("id, email, first_name, last_name, company, tags")
    .eq("site_id", siteId)
    .eq("email_subscribed", true)
    .is("email_bounced_at", null); // exclude bounced

  switch (audienceFilter.type) {
    case "all":
      // No additional filters
      break;
    case "segment":
      // Resolve segment conditions from CRM
      // Apply segment filter logic
      break;
    case "tags":
      if (audienceFilter.tags?.include?.length) {
        query = query.overlaps("tags", audienceFilter.tags.include);
      }
      if (audienceFilter.tags?.exclude?.length) {
        // Filter out contacts with excluded tags
        // Use .not() with overlaps
      }
      break;
    case "custom":
      // Apply custom conditions dynamically
      // Each condition maps to a Supabase filter
      break;
  }

  const { data } = await query;
  return data ?? [];
}
```

#### Personalization Engine

```typescript
// personalization.ts
// Replaces tokens in email HTML with contact data
//
// Supported tokens:
// {{first_name}}      — contact.first_name or "there" fallback
// {{last_name}}       — contact.last_name or "" fallback
// {{full_name}}       — first + last or "there" fallback
// {{email}}           — contact.email
// {{company}}         — contact.company or "" fallback
// {{unsubscribe_url}} — generated unsubscribe link with token
// {{tracking_pixel}}  — 1x1 transparent gif with tracking URL
// {{site_name}}       — site name from settings
// {{current_year}}    — current year
//
// Implementation:
export function personalizeEmail(
  html: string,
  contact: Contact,
  campaign: Campaign,
  siteSettings: SiteSettings,
): string {
  const tokens: Record<string, string> = {
    first_name: contact.first_name || "there",
    last_name: contact.last_name || "",
    full_name: contact.first_name
      ? `${contact.first_name} ${contact.last_name || ""}`.trim()
      : "there",
    email: contact.email,
    company: contact.company || "",
    unsubscribe_url: generateUnsubscribeUrl(contact.id, campaign.id),
    tracking_pixel: generateTrackingPixelUrl(contact.id, campaign.id),
    site_name: siteSettings.site_name,
    current_year: new Date().getFullYear().toString(),
  };

  let result = html;
  for (const [key, value] of Object.entries(tokens)) {
    // Use global replace — token may appear multiple times
    // Sanitize value to prevent HTML injection
    const safeValue = escapeHtml(value);
    result = result.replaceAll(`{{${key}}}`, safeValue);
  }

  // Replace click tracking: {{track_click:https://example.com}}
  result = result.replace(/\{\{track_click:(.*?)\}\}/g, (_, url) =>
    generateClickTrackingUrl(contact.id, campaign.id, url),
  );

  return result;
}
```

#### Batch Sending Process

```typescript
// sending-engine.ts
export async function sendCampaign(
  campaignId: string,
  siteId: string,
): Promise<void> {
  const supabase = createServiceClient(); // Service role for bulk ops

  // 1. Load campaign
  const campaign = await getCampaign(supabase, campaignId);
  if (campaign.status !== "scheduled" && campaign.status !== "sending") {
    throw new Error(`Cannot send campaign in ${campaign.status} status`);
  }

  // 2. Update status to sending
  await updateCampaignStatus(supabase, campaignId, "sending");

  // 3. Fire automation event
  await logAutomationEvent({
    event_type: "marketing.campaign.sending",
    site_id: siteId,
    metadata: { campaign_id: campaignId, campaign_name: campaign.name },
  });

  // 4. Resolve audience
  const contacts = await resolveAudience(
    supabase,
    siteId,
    campaign.audience_filter,
  );

  // 5. Initialize stats
  await initializeCampaignStats(supabase, campaignId, contacts.length);

  // 6. Render base HTML
  const baseHtml = renderEmailHtml(
    campaign.content_json,
    campaign.brand_colors,
  );

  // 7. Load site settings for personalization
  const siteSettings = await getSiteSettings(supabase, siteId);

  // 8. Process in batches
  const config = getSendingConfig();
  const batches = chunkArray(contacts, config.batchSize);

  let totalSent = 0;
  let totalFailed = 0;

  for (const batch of batches) {
    // Check if campaign was paused/cancelled
    const currentStatus = await getCampaignStatus(supabase, campaignId);
    if (currentStatus === "paused" || currentStatus === "cancelled") {
      break;
    }

    const results = await Promise.allSettled(
      batch.map(async (contact) => {
        const personalizedHtml = personalizeEmail(
          baseHtml,
          contact,
          campaign,
          siteSettings,
        );

        // A/B test: select variant if applicable
        const subject =
          campaign.campaign_type === "ab_test"
            ? selectABVariant(campaign, contact)
            : campaign.subject_line;

        try {
          const result = await resend.emails.send({
            from: `${campaign.from_name} <${campaign.from_email}>`,
            to: contact.email,
            subject: subject,
            html: personalizedHtml,
            replyTo: campaign.reply_to || undefined,
            headers: {
              "X-Campaign-Id": campaignId,
              "X-Contact-Id": contact.id,
              "List-Unsubscribe": `<${generateUnsubscribeUrl(contact.id, campaignId)}>`,
            },
          });

          // Log successful send
          await logEmailSend(supabase, {
            campaign_id: campaignId,
            contact_id: contact.id,
            email: contact.email,
            resend_id: result.data?.id,
            status: "sent",
            variant:
              campaign.campaign_type === "ab_test"
                ? getVariantLabel(contact)
                : null,
          });

          totalSent++;
          return { success: true, contactId: contact.id };
        } catch (error) {
          // Log failed send
          await logEmailSend(supabase, {
            campaign_id: campaignId,
            contact_id: contact.id,
            email: contact.email,
            status: "failed",
            error_message:
              error instanceof Error ? error.message : "Unknown error",
          });

          totalFailed++;
          return { success: false, contactId: contact.id, error };
        }
      }),
    );

    // Update running stats
    await updateCampaignProgress(supabase, campaignId, totalSent, totalFailed);

    // Throttle between batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await delay(config.batchDelayMs);
    }
  }

  // 9. Finalize campaign
  const finalStatus = totalFailed === contacts.length ? "failed" : "sent";
  await finalizeCampaign(
    supabase,
    campaignId,
    finalStatus,
    totalSent,
    totalFailed,
  );

  // 10. Fire completion event
  await logAutomationEvent({
    event_type: "marketing.campaign.sent",
    site_id: siteId,
    metadata: {
      campaign_id: campaignId,
      total_sent: totalSent,
      total_failed: totalFailed,
      audience_size: contacts.length,
    },
  });
}
```

### 2.6 A/B Testing Framework

```typescript
// ab-testing.ts
// When campaign_type is 'ab_test', the campaign has:
// - subject_line: variant A subject
// - ab_test_config: {
//     variant_b_subject: string,
//     split_percentage: number,    // 50 = 50/50 split (default)
//     winner_criteria: 'open_rate' | 'click_rate',
//     auto_send_winner: boolean,
//     test_duration_hours: number, // hours to wait before picking winner
//     test_sample_percentage: number // % of audience for test (rest gets winner)
//   }
//
// A/B test flow:
// 1. Split audience into test group (e.g., 20%) and remaining (80%)
// 2. Split test group 50/50 into variant A and variant B
// 3. Send variant A subject to half, variant B to other half
// 4. Wait test_duration_hours
// 5. Evaluate winner based on winner_criteria
// 6. If auto_send_winner: send winning variant to remaining 80%
// 7. If not auto: notify user, let them choose
//
// Variant assignment:
// - Deterministic based on contact.id hash (consistent assignment)
// - Or sequential: first half = A, second half = B
// - Stored in email_sends.variant column ('A' or 'B')

export function selectABVariant(campaign: Campaign, contact: Contact): string {
  // Simple hash-based split
  const hash = simpleHash(contact.id);
  const isVariantB =
    hash % 100 < (campaign.ab_test_config?.split_percentage ?? 50);
  return isVariantB
    ? campaign.ab_test_config!.variant_b_subject
    : campaign.subject_line;
}
```

### 2.7 API Routes

**Location:** `src/app/api/sites/[siteId]/marketing/campaigns/`

```
API Routes to create:

POST   /api/sites/[siteId]/marketing/campaigns
  → Create new campaign
  → Body: { name, subject_line, preview_text, from_name, from_email,
            reply_to, campaign_type, audience_filter, content_json,
            ab_test_config?, scheduled_at? }
  → Returns: campaign object

GET    /api/sites/[siteId]/marketing/campaigns
  → List campaigns with pagination
  → Query: ?status=draft&page=1&limit=20&search=keyword
  → Returns: { campaigns, total, page, limit }

GET    /api/sites/[siteId]/marketing/campaigns/[campaignId]
  → Get single campaign with stats
  → Returns: campaign object with stats joined

PATCH  /api/sites/[siteId]/marketing/campaigns/[campaignId]
  → Update campaign (only if draft/scheduled)
  → Body: partial campaign fields
  → Returns: updated campaign

DELETE /api/sites/[siteId]/marketing/campaigns/[campaignId]
  → Delete campaign (only if draft)
  → Soft delete: sets deleted_at timestamp

POST   /api/sites/[siteId]/marketing/campaigns/[campaignId]/send
  → Trigger campaign send
  → Validates campaign is ready (has content, audience, subject)
  → Starts sending engine
  → Returns: { status: 'sending', estimated_completion }

POST   /api/sites/[siteId]/marketing/campaigns/[campaignId]/pause
  → Pause sending campaign
  → Sets status to 'paused'

POST   /api/sites/[siteId]/marketing/campaigns/[campaignId]/resume
  → Resume paused campaign
  → Continues from where it stopped

POST   /api/sites/[siteId]/marketing/campaigns/[campaignId]/test
  → Send test email
  → Body: { email: "test@example.com" }
  → Sends single email with sample personalization

POST   /api/sites/[siteId]/marketing/campaigns/[campaignId]/duplicate
  → Duplicate campaign as new draft
  → Copies all settings except schedule

POST   /api/sites/[siteId]/marketing/templates
  → Save campaign design as reusable template
  → Body: { name, description, category, content_json }

GET    /api/sites/[siteId]/marketing/templates
  → List saved templates + built-in templates
  → Query: ?category=welcome&search=keyword

// Auth: All routes use existing withSiteAuth middleware
// All routes verify manage_marketing permission
```

### 2.8 Server Actions

**Location:** `src/modules/marketing/actions/campaign-actions.ts`

```typescript
// Server actions for campaign operations (used by UI forms)
// Follow existing platform pattern: 'use server' + revalidatePath

"use server";

export async function createCampaignAction(
  siteId: string,
  data: CreateCampaignInput,
): Promise<ActionResult<Campaign>> {
  // 1. Verify auth + permission
  // 2. Validate input (zod schema)
  // 3. Insert campaign record
  // 4. If scheduled_at provided, create schedule entry
  // 5. Fire automation event: marketing.campaign.created
  // 6. revalidatePath for campaigns list
  // 7. Return campaign
}

export async function updateCampaignAction(
  campaignId: string,
  siteId: string,
  data: UpdateCampaignInput,
): Promise<ActionResult<Campaign>> {
  // 1. Verify auth + permission
  // 2. Verify campaign is editable (draft or scheduled)
  // 3. Validate input
  // 4. Update campaign record
  // 5. revalidatePath
  // 6. Return updated campaign
}

export async function sendCampaignAction(
  campaignId: string,
  siteId: string,
): Promise<ActionResult<{ status: string }>> {
  // 1. Verify auth + permission
  // 2. Validate campaign is ready:
  //    - Has subject_line
  //    - Has content_json with at least 1 block
  //    - Has audience_filter
  //    - Audience resolves to > 0 contacts
  // 3. Call sendCampaign() from sending engine
  // 4. Return status
}

export async function sendTestEmailAction(
  campaignId: string,
  siteId: string,
  testEmail: string,
): Promise<ActionResult<{ sent: boolean }>> {
  // 1. Verify auth
  // 2. Load campaign
  // 3. Render HTML with mock contact data
  // 4. Send via Resend to testEmail
  // 5. Return result
}

export async function duplicateCampaignAction(
  campaignId: string,
  siteId: string,
): Promise<ActionResult<Campaign>> {
  // 1. Verify auth
  // 2. Load source campaign
  // 3. Create copy with status 'draft', null scheduled_at
  // 4. Name: "Copy of {original_name}"
  // 5. Return new campaign
}
```

### 2.9 Webhook Handlers (Resend Events)

**Location:** `src/app/api/webhooks/resend/route.ts`

```typescript
// Resend sends webhook events for:
// - email.delivered
// - email.opened
// - email.clicked
// - email.bounced
// - email.complained (spam report)
//
// Webhook URL: https://app.dramacagency.com/api/webhooks/resend
// Must verify webhook signature using Resend webhook secret
//
// NOTE: This route may already exist for transactional emails.
// If so, ADD marketing campaign handling to the existing handler.
// Check for X-Campaign-Id header to distinguish marketing vs transactional.

export async function POST(request: Request) {
  // 1. Verify Resend webhook signature
  const signature = request.headers.get("svix-signature");
  // ... verify with svix library or manual HMAC

  const event = await request.json();

  // 2. Check if this is a marketing email (has campaign headers)
  const campaignId = event.data?.headers?.["X-Campaign-Id"];
  if (!campaignId) {
    // Handle as transactional email event (existing logic)
    return handleTransactionalEvent(event);
  }

  // 3. Handle marketing email event
  const contactId = event.data?.headers?.["X-Contact-Id"];

  switch (event.type) {
    case "email.delivered":
      await updateEmailSendStatus(campaignId, contactId, "delivered");
      await incrementCampaignStat(campaignId, "delivered_count");
      break;

    case "email.opened":
      // Note: may fire multiple times per contact
      await recordEmailOpen(campaignId, contactId);
      break;

    case "email.clicked":
      await recordEmailClick(campaignId, contactId, event.data.click.link);
      break;

    case "email.bounced":
      await handleBounce(campaignId, contactId, event.data.bounce);
      // Mark contact as bounced in CRM
      await markContactBounced(contactId);
      break;

    case "email.complained":
      await handleComplaint(campaignId, contactId);
      // Auto-unsubscribe contact
      await unsubscribeContact(contactId);
      // Fire automation event
      await logAutomationEvent({
        event_type: "marketing.contact.complained",
        metadata: { campaign_id: campaignId, contact_id: contactId },
      });
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### 2.10 Unsubscribe Handling

**Location:** `src/app/api/unsubscribe/[token]/route.ts`

```typescript
// Public route — no auth required
// Token is a signed JWT containing: { contactId, campaignId }
//
// GET  /api/unsubscribe/[token] → renders unsubscribe confirmation page
// POST /api/unsubscribe/[token] → processes unsubscribe
//
// On unsubscribe:
// 1. Verify token signature (prevent abuse)
// 2. Set contact.email_subscribed = false
// 3. Set contact.email_unsubscribed_at = now()
// 4. Log to mod_mktmod01_unsubscribes table
// 5. Fire automation event: marketing.contact.unsubscribed
// 6. Show confirmation page with optional feedback form
//    (Why did you unsubscribe? Too many emails / Not relevant / Other)
//
// ALSO create a storefront-facing unsubscribe page:
// Location: src/app/unsubscribe/[token]/page.tsx
// This renders a branded page (loads site theme) with:
// - "You've been unsubscribed" message
// - Optional "Resubscribe" button
// - Feedback form
```

### 2.11 Campaign Scheduling

```typescript
// scheduling.ts
// Two approaches (implement the simpler one first):
//
// APPROACH 1 (Recommended): Vercel Cron Job
// Add to vercel.json crons array:
// { "path": "/api/cron/marketing-scheduler", "schedule": "*/5 * * * *" }
//
// The cron job checks every 5 minutes for campaigns where:
// - status = 'scheduled'
// - scheduled_at <= now()
// Then triggers sendCampaign() for each
//
// APPROACH 2: Supabase pg_cron (if cron already used in platform)
// Create a PostgreSQL function that checks scheduled campaigns
//
// Implementation:
export async function checkScheduledCampaigns() {
  const supabase = createServiceClient();

  const { data: readyCampaigns } = await supabase
    .from("mod_mktmod01_campaigns")
    .select("id, site_id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());

  for (const campaign of readyCampaigns ?? []) {
    try {
      await sendCampaign(campaign.id, campaign.site_id);
    } catch (error) {
      console.error(`Failed to send scheduled campaign ${campaign.id}:`, error);
      // Update status to 'failed' with error
      await updateCampaignStatus(supabase, campaign.id, "failed");
    }
  }
}
```

### 2.12 Phase MKT-02 Deliverables Checklist

```
- [ ] Campaign list page with filters and search
- [ ] Campaign creation wizard (4 steps)
- [ ] Campaign edit page (status-aware)
- [ ] Visual email editor with all 12 block types
- [ ] Block properties panels for each block type
- [ ] Drag-and-drop reordering
- [ ] Undo/redo functionality
- [ ] Desktop/mobile preview toggle
- [ ] HTML email renderer (email-client compatible)
- [ ] 15 pre-built email templates
- [ ] Custom template save/load
- [ ] Audience resolver (all, segment, tags, custom)
- [ ] Personalization engine with token replacement
- [ ] Batch sending engine with throttling
- [ ] A/B testing framework (subject line variants)
- [ ] All campaign API routes (CRUD + send/pause/resume/test/duplicate)
- [ ] All server actions
- [ ] Resend webhook handler (delivered/opened/clicked/bounced/complained)
- [ ] Unsubscribe flow (token-based, branded page, feedback)
- [ ] Campaign scheduling via Vercel cron
- [ ] Test email functionality
- [ ] Automation events fired: campaign.created, campaign.sending, campaign.sent
- [ ] Permission checks on all routes
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-03: Email Analytics & Tracking

**Priority:** CRITICAL — Provides ROI visibility for all campaigns
**Estimated Complexity:** Medium-High
**Dependencies:** Phase MKT-02 complete (campaigns can be sent)
**Files Created:** ~15 new files
**Files Modified:** 1-2 existing files

### 3.1 Overview

This phase builds the complete analytics and tracking system for email campaigns. It includes:

- Open tracking via invisible pixel
- Click tracking via redirect proxy
- Real-time campaign dashboard with live stats
- Individual campaign report pages
- Contact-level engagement history
- Aggregate analytics across all campaigns
- Exportable reports (CSV)
- Engagement scoring that feeds back into CRM

### 3.2 Open Tracking

**Location:** `src/app/api/tracking/open/[token]/route.ts`

```typescript
// Public route — no auth required
// Returns a 1x1 transparent GIF pixel
// Token is a signed, compact identifier: base64(campaignId:contactId:sendId)
//
// When email client loads this image, it registers as an "open"
//
// IMPORTANT: Open tracking is inherently unreliable:
// - Some clients block images (Apple Mail Privacy Protection, etc.)
// - Some clients pre-fetch images (inflating opens)
// - Use as directional signal, not absolute truth
//
// Implementation:

export async function GET(
  request: Request,
  { params }: { params: { token: string } },
) {
  try {
    const { campaignId, contactId, sendId } = decodeTrackingToken(params.token);

    // Record open asynchronously (don't block pixel response)
    // Use waitUntil if available (Vercel Edge), otherwise fire-and-forget
    const recordPromise = recordOpen(campaignId, contactId, sendId, {
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for"),
      timestamp: new Date(),
    });

    // Edge runtime: use waitUntil
    // Node runtime: fire and forget (or use after() from next/server)
    if (typeof globalThis.waitUntil === "function") {
      globalThis.waitUntil(recordPromise);
    }
  } catch (e) {
    // Silently fail — never break pixel response
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  );

  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function recordOpen(
  campaignId: string,
  contactId: string,
  sendId: string,
  metadata: OpenMetadata,
) {
  const supabase = createServiceClient();

  // Check if first open (for unique open tracking)
  const { data: existingSend } = await supabase
    .from("mod_mktmod01_email_sends")
    .select("id, opened_at")
    .eq("campaign_id", campaignId)
    .eq("contact_id", contactId)
    .single();

  if (!existingSend) return;

  // Record open event
  await supabase.from("mod_mktmod01_email_events").insert({
    campaign_id: campaignId,
    contact_id: contactId,
    send_id: existingSend.id,
    event_type: "open",
    metadata: {
      user_agent: metadata.userAgent,
      ip: metadata.ip,
    },
  });

  // Update first open time if not already set (unique open)
  if (!existingSend.opened_at) {
    await supabase
      .from("mod_mktmod01_email_sends")
      .update({ opened_at: metadata.timestamp.toISOString() })
      .eq("id", existingSend.id);

    // Increment unique open count in campaign stats
    await supabase.rpc("increment_campaign_stat", {
      p_campaign_id: campaignId,
      p_stat: "unique_opens",
    });

    // Fire automation event for first open
    await logAutomationEvent({
      event_type: "marketing.email.opened",
      metadata: { campaign_id: campaignId, contact_id: contactId },
    });
  }

  // Always increment total opens
  await supabase.rpc("increment_campaign_stat", {
    p_campaign_id: campaignId,
    p_stat: "total_opens",
  });
}
```

#### Database Function for Atomic Increment

```sql
-- Migration: increment_campaign_stat RPC function
-- This ensures atomic counter updates even under concurrent webhook load

CREATE OR REPLACE FUNCTION increment_campaign_stat(
  p_campaign_id UUID,
  p_stat TEXT
) RETURNS VOID AS $$
BEGIN
  -- Dynamic column update based on stat name
  -- Only allow known stat columns to prevent SQL injection
  IF p_stat NOT IN ('unique_opens', 'total_opens', 'unique_clicks', 'total_clicks',
                     'bounces', 'complaints', 'unsubscribes', 'delivered_count') THEN
    RAISE EXCEPTION 'Invalid stat column: %', p_stat;
  END IF;

  EXECUTE format(
    'UPDATE mod_mktmod01_campaign_stats SET %I = COALESCE(%I, 0) + 1 WHERE campaign_id = $1',
    p_stat, p_stat
  ) USING p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.3 Click Tracking

**Location:** `src/app/api/tracking/click/[token]/route.ts`

```typescript
// Public route — no auth required
// Redirects to the original URL after recording the click
// Token: base64(campaignId:contactId:sendId:encodedUrl)
//
// Security considerations:
// - Validate destination URL (no javascript:, data:, or internal routes)
// - Rate limit to prevent abuse
// - Log but don't block on failures

export async function GET(
  request: Request,
  { params }: { params: { token: string } },
) {
  try {
    const { campaignId, contactId, sendId, originalUrl } = decodeClickToken(
      params.token,
    );

    // Validate URL is safe to redirect to
    if (!isValidRedirectUrl(originalUrl)) {
      return new Response("Invalid URL", { status: 400 });
    }

    // Record click asynchronously
    const recordPromise = recordClick(
      campaignId,
      contactId,
      sendId,
      originalUrl,
      {
        userAgent: request.headers.get("user-agent"),
        ip: request.headers.get("x-forwarded-for"),
        referer: request.headers.get("referer"),
        timestamp: new Date(),
      },
    );

    if (typeof globalThis.waitUntil === "function") {
      globalThis.waitUntil(recordPromise);
    }

    // Redirect to original URL
    return Response.redirect(originalUrl, 302);
  } catch (e) {
    // On any error, try to redirect to site homepage or return error
    return new Response("Tracking error", { status: 500 });
  }
}

function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Block dangerous protocols
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    // Block internal/localhost URLs
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname))
      return false;
    return true;
  } catch {
    return false;
  }
}

async function recordClick(
  campaignId: string,
  contactId: string,
  sendId: string,
  url: string,
  metadata: ClickMetadata,
) {
  const supabase = createServiceClient();

  // Record click event
  await supabase.from("mod_mktmod01_email_events").insert({
    campaign_id: campaignId,
    contact_id: contactId,
    send_id: sendId,
    event_type: "click",
    metadata: {
      url,
      user_agent: metadata.userAgent,
      ip: metadata.ip,
    },
  });

  // Update link stats
  await supabase.from("mod_mktmod01_link_tracking").upsert(
    {
      campaign_id: campaignId,
      url: url,
      total_clicks: 1,
      unique_clicks: 1,
    },
    {
      onConflict: "campaign_id,url",
      // On conflict, increment counters
    },
  );
  // Note: Supabase upsert doesn't support increment on conflict directly
  // Use RPC or do read-then-update for link tracking
  // Or use a separate increment_link_stat RPC function

  // Check if first click by this contact (unique click)
  const { data: existingSend } = await supabase
    .from("mod_mktmod01_email_sends")
    .select("clicked_at")
    .eq("campaign_id", campaignId)
    .eq("contact_id", contactId)
    .single();

  if (existingSend && !existingSend.clicked_at) {
    // First click — update send record and increment unique clicks
    await supabase
      .from("mod_mktmod01_email_sends")
      .update({ clicked_at: metadata.timestamp.toISOString() })
      .eq("campaign_id", campaignId)
      .eq("contact_id", contactId);

    await supabase.rpc("increment_campaign_stat", {
      p_campaign_id: campaignId,
      p_stat: "unique_clicks",
    });

    // Fire automation event for first click
    await logAutomationEvent({
      event_type: "marketing.email.clicked",
      metadata: { campaign_id: campaignId, contact_id: contactId, url },
    });
  }

  // Always increment total clicks
  await supabase.rpc("increment_campaign_stat", {
    p_campaign_id: campaignId,
    p_stat: "total_clicks",
  });
}
```

### 3.4 Campaign Report Dashboard

**Location:** `src/app/dashboard/sites/[siteId]/marketing/campaigns/[campaignId]/report/page.tsx`

```
Route: /dashboard/sites/[siteId]/marketing/campaigns/[campaignId]/report
```

#### Report Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Campaign: "Summer Sale Announcement"                         │
│ Sent: June 15, 2026 at 2:00 PM · Audience: 2,450 contacts  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Delivered │  │  Opened  │  │ Clicked  │  │ Bounced  │   │
│  │  2,438   │  │  1,205   │  │   342    │  │    12    │   │
│  │  99.5%   │  │  49.4%   │  │  14.0%   │  │   0.5%   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Unsubs   │  │Complaints│  │ Failed   │                  │
│  │    8     │  │    1     │  │    0     │                  │
│  │   0.3%   │  │   0.0%   │  │   0.0%   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  [Opens Over Time - Line Chart]                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         ╱╲                                           │   │
│  │        ╱  ╲         ╱╲                               │   │
│  │       ╱    ╲       ╱  ╲                              │   │
│  │      ╱      ╲     ╱    ╲____                         │   │
│  │─────╱        ╲___╱          ╲_______                 │   │
│  │  Day 1  Day 2  Day 3  Day 4  Day 5  Day 6  Day 7   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Top Clicked Links]                                        │
│  ┌─────────────────────────────┬────────┬───────────┐      │
│  │ URL                         │ Clicks │ Unique    │      │
│  ├─────────────────────────────┼────────┼───────────┤      │
│  │ example.com/sale            │   203  │    178    │      │
│  │ example.com/products/new    │    89  │     74    │      │
│  │ example.com/about           │    50  │     42    │      │
│  └─────────────────────────────┴────────┴───────────┘      │
│                                                              │
│  [A/B Test Results] (if applicable)                         │
│  ┌───────────────────────────────────────────────┐         │
│  │ Variant A: "Summer Sale - 50% Off!"           │         │
│  │   Opens: 52.1%  Clicks: 15.3%  ★ WINNER      │         │
│  │                                                │         │
│  │ Variant B: "Don't Miss Our Biggest Sale"      │         │
│  │   Opens: 46.8%  Clicks: 12.7%                 │         │
│  └───────────────────────────────────────────────┘         │
│                                                              │
│  [Recipient Activity Table]                                 │
│  ┌──────────────────┬──────────┬────────┬─────────┐        │
│  │ Contact          │ Opened   │ Clicked│ Status  │        │
│  ├──────────────────┼──────────┼────────┼─────────┤        │
│  │ john@example.com │ Yes (2x) │ Yes    │ Active  │        │
│  │ jane@example.com │ Yes (1x) │ No     │ Active  │        │
│  │ bob@example.com  │ No       │ No     │ Bounced │        │
│  └──────────────────┴──────────┴────────┴─────────┘        │
│  [Show More] [Export CSV]                                   │
│                                                              │
│  [Actions] [Duplicate Campaign] [Export Report]             │
└─────────────────────────────────────────────────────────────┘
```

#### Component Structure

```
report/
├── page.tsx                    — Server component, data fetching
├── CampaignReportHeader.tsx    — Campaign info + status
├── StatCards.tsx                — KPI cards row (delivered, opens, clicks, etc.)
├── OpensTimeChart.tsx           — Line chart of opens over time
├── ClicksTable.tsx              — Top clicked links table
├── ABTestResults.tsx            — A/B test comparison (conditional)
├── RecipientTable.tsx           — Paginated recipient activity
├── DeviceBreakdown.tsx          — Pie chart: desktop vs mobile (from user-agent)
└── ExportButton.tsx             — CSV export functionality
```

#### Charts Library

```
Use Recharts (already likely in project) or shadcn charts.
Check existing dependencies first — use whatever charting
library the platform already uses. Do NOT add a new one.
```

### 3.5 Marketing Analytics Overview

**Location:** `src/app/dashboard/sites/[siteId]/marketing/analytics/page.tsx`

```
Route: /dashboard/sites/[siteId]/marketing/analytics
```

This is the aggregate view across ALL campaigns for a site.

#### Key Metrics

```typescript
// Metrics to display:
// - Total emails sent (all time)
// - Average open rate (across all campaigns)
// - Average click rate
// - Total subscribers
// - Subscriber growth (chart: new subs per week/month)
// - Unsubscribe rate
// - Bounce rate
// - Best performing campaign (highest open rate)
// - Best performing day of week (when opens are highest)
// - Best performing hour of day
//
// Date range filter: Last 7 days | 30 days | 90 days | Year | Custom
// Compare to previous period toggle

interface MarketingAnalytics {
  totalSent: number;
  totalDelivered: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalSubscribers: number;
  newSubscribers: number; // in date range
  totalUnsubscribes: number;
  bounceRate: number;
  complaintRate: number;
  campaigns: {
    total: number;
    sent: number;
    draft: number;
    scheduled: number;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    openRate: number;
    clickRate: number;
    sentAt: string;
  }>;
  engagementOverTime: Array<{
    date: string;
    sent: number;
    opens: number;
    clicks: number;
  }>;
}
```

#### Data Fetching

```typescript
// analytics-queries.ts
// Aggregate queries for the analytics dashboard.
// These should be efficient — consider creating database views
// or materialized summaries if queries become slow.

export async function getMarketingAnalytics(
  supabase: SupabaseClient,
  siteId: string,
  dateRange: { from: Date; to: Date },
): Promise<MarketingAnalytics> {
  // Parallel queries for efficiency
  const [
    campaignStats,
    subscriberCount,
    subscriberGrowth,
    topCampaigns,
    engagementTimeline,
  ] = await Promise.all([
    getAggregateCampaignStats(supabase, siteId, dateRange),
    getSubscriberCount(supabase, siteId),
    getSubscriberGrowth(supabase, siteId, dateRange),
    getTopCampaigns(supabase, siteId, dateRange),
    getEngagementTimeline(supabase, siteId, dateRange),
  ]);

  return {
    ...campaignStats,
    totalSubscribers: subscriberCount,
    newSubscribers: subscriberGrowth,
    topCampaigns,
    engagementOverTime: engagementTimeline,
  };
}
```

### 3.6 Contact Engagement Profile

**Enhancement to CRM contact detail page.**

**Location:** Add tab/section to existing contact detail page

```typescript
// When viewing a CRM contact, add a "Marketing" tab showing:
// - Email subscription status (subscribed/unsubscribed with date)
// - Engagement score (calculated from opens/clicks across campaigns)
// - Campaigns received: list with open/click status for each
// - Last email opened date
// - Last email clicked date
// - Total emails received, opened, clicked
// - Click-through rate for this contact
//
// This helps sales/support see contact engagement at a glance.
//
// Data query:
const { data: contactEngagement } = await supabase
  .from("mod_mktmod01_email_sends")
  .select(
    `
    *,
    mod_mktmod01_campaigns (name, subject_line, sent_at)
  `,
  )
  .eq("contact_id", contactId)
  .order("sent_at", { ascending: false })
  .limit(50);
```

### 3.7 Engagement Scoring

```typescript
// engagement-scoring.ts
// Calculate an engagement score for each contact based on their
// interaction with marketing emails. This score feeds into CRM
// and can be used for audience segmentation.

// Score calculation (out of 100):
// - Base: 0
// - Each email opened in last 30 days: +5 (max 25)
// - Each link clicked in last 30 days: +10 (max 30)
// - Opened last campaign: +15
// - Clicked last campaign: +20
// - No opens in 90 days: -30
// - Bounced: -50
// - Complained: score = 0 (permanently cold)
//
// Engagement levels:
// 0-19:   Cold (gray)
// 20-39:  Cool (blue)
// 40-59:  Warm (yellow)
// 60-79:  Hot (orange)
// 80-100: On Fire (red)
//
// Score is stored on mod_crm01_contacts.marketing_engagement_score
// Updated after each campaign send completes and after each open/click event
// Can also be recalculated in bulk via admin action

export async function calculateEngagementScore(
  supabase: SupabaseClient,
  contactId: string,
): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Get recent email interactions
  const { data: recentSends } = await supabase
    .from("mod_mktmod01_email_sends")
    .select("opened_at, clicked_at, status, sent_at")
    .eq("contact_id", contactId)
    .gte("sent_at", ninetyDaysAgo.toISOString())
    .order("sent_at", { ascending: false });

  if (!recentSends || recentSends.length === 0) return 0;

  let score = 0;

  // Recent opens (last 30 days)
  const recentOpens = recentSends.filter(
    (s) => s.opened_at && new Date(s.opened_at) >= thirtyDaysAgo,
  );
  score += Math.min(recentOpens.length * 5, 25);

  // Recent clicks (last 30 days)
  const recentClicks = recentSends.filter(
    (s) => s.clicked_at && new Date(s.clicked_at) >= thirtyDaysAgo,
  );
  score += Math.min(recentClicks.length * 10, 30);

  // Last campaign engagement
  const lastSend = recentSends[0];
  if (lastSend?.opened_at) score += 15;
  if (lastSend?.clicked_at) score += 20;

  // Inactivity penalty
  const hasRecentOpen = recentSends.some((s) => s.opened_at);
  if (!hasRecentOpen) score -= 30;

  // Bounce/complaint check
  if (recentSends.some((s) => s.status === "bounced")) score -= 50;
  if (recentSends.some((s) => s.status === "complained")) return 0;

  return Math.max(0, Math.min(100, score));
}
```

### 3.8 CSV Export

```typescript
// export-utils.ts
// Export campaign report data as CSV

export async function exportCampaignReport(
  supabase: SupabaseClient,
  campaignId: string,
): Promise<string> {
  const { data: sends } = await supabase
    .from("mod_mktmod01_email_sends")
    .select(
      `
      email,
      status,
      sent_at,
      delivered_at,
      opened_at,
      clicked_at,
      bounced_at,
      variant,
      mod_crm01_contacts (first_name, last_name, company)
    `,
    )
    .eq("campaign_id", campaignId);

  // Generate CSV with columns:
  // Email, First Name, Last Name, Company, Status, Sent At,
  // Delivered At, Opened At, Clicked At, Bounced At, Variant

  const headers = [
    "Email",
    "First Name",
    "Last Name",
    "Company",
    "Status",
    "Sent At",
    "Delivered At",
    "Opened At",
    "Clicked At",
    "Bounced At",
    "Variant",
  ];

  const rows = (sends ?? []).map((s) => [
    s.email,
    s.mod_crm01_contacts?.first_name ?? "",
    s.mod_crm01_contacts?.last_name ?? "",
    s.mod_crm01_contacts?.company ?? "",
    s.status,
    s.sent_at ?? "",
    s.delivered_at ?? "",
    s.opened_at ?? "",
    s.clicked_at ?? "",
    s.bounced_at ?? "",
    s.variant ?? "",
  ]);

  return [
    headers.join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

### 3.9 Phase MKT-03 Deliverables Checklist

```
- [ ] Open tracking pixel API route
- [ ] Click tracking redirect API route
- [ ] URL validation for click redirects (security)
- [ ] increment_campaign_stat RPC function (database migration)
- [ ] Campaign report page with all sections
- [ ] Stat cards component (delivered, opens, clicks, bounces, unsubs, complaints)
- [ ] Opens-over-time line chart
- [ ] Top clicked links table
- [ ] A/B test results comparison panel
- [ ] Recipient activity table with pagination
- [ ] Device breakdown chart (desktop vs mobile)
- [ ] Marketing analytics overview page (aggregate metrics)
- [ ] Date range filter for analytics
- [ ] Contact engagement profile (CRM tab/section enhancement)
- [ ] Engagement scoring algorithm
- [ ] Score stored on CRM contact record
- [ ] CSV export for campaign reports
- [ ] Automation events: marketing.email.opened, marketing.email.clicked
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-04: Drip Sequences & Marketing Automation Templates

**Priority:** HIGH — Enables automated marketing workflows
**Estimated Complexity:** High
**Dependencies:** Phase MKT-02 (campaigns), Phase MKT-03 (tracking)
**Files Created:** ~20 new files
**Files Modified:** 3-5 existing automation files

### 4.1 Overview

This phase bridges the marketing module with the existing automation engine. It creates:

- Drip sequence builder (multi-email automated sequences)
- Pre-built marketing automation workflow templates
- New marketing-specific automation triggers and actions
- Visual sequence timeline editor
- Sequence performance tracking
- Smart timing (send time optimization)

**Critical Integration Point:** This phase does NOT rebuild the automation engine. It EXTENDS it with marketing-specific triggers, actions, and pre-built templates. All drip sequences run ON TOP of the existing automation workflow system.

### 4.2 Drip Sequence Architecture

```
A drip sequence is a series of automated emails sent to contacts
based on a trigger event, with configurable delays between steps.

Example: "Welcome Onboarding Sequence"
  Trigger: contact.created (new CRM contact)
  ├── Day 0: Welcome email (immediate)
  ├── Day 2: "Getting Started" guide
  ├── Day 5: Feature highlight
  ├── Day 10: "How's it going?" check-in
  └── Day 14: Upgrade offer / CTA

Each step can have:
- Delay (hours/days after previous step or trigger)
- Email content (campaign-like content with template)
- Conditions (only send if contact opened previous email, etc.)
- Branch logic (if opened → path A, if not → path B)
- Exit conditions (stop sequence if contact converts, unsubscribes, etc.)
```

### 4.3 Drip Sequence Data Model

**Uses existing tables:** `mod_mktmod01_sequences` + `mod_mktmod01_sequence_steps` + `mod_mktmod01_sequence_enrollments` (created in Phase MKT-01)

```typescript
// Sequence step types and their configuration:

interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  step_type: "email" | "delay" | "condition" | "action";
  config:
    | EmailStepConfig
    | DelayStepConfig
    | ConditionStepConfig
    | ActionStepConfig;
}

interface EmailStepConfig {
  subject_line: string;
  preview_text?: string;
  content_json: EmailContent; // Same format as campaigns
  from_name?: string; // Override default
  from_email?: string; // Override default
}

interface DelayStepConfig {
  delay_amount: number;
  delay_unit: "minutes" | "hours" | "days" | "weeks";
  // Smart timing: if true, sends at optimal time for contact's timezone
  smart_timing: boolean;
}

interface ConditionStepConfig {
  condition_type:
    | "opened_previous"
    | "clicked_previous"
    | "tag_has"
    | "tag_missing"
    | "field_equals"
    | "engagement_score";
  condition_value?: string;
  // Branch: contacts meeting condition continue, others skip to next matching step
  true_next_step?: number; // step_order to jump to
  false_next_step?: number; // step_order if condition fails
}

interface ActionStepConfig {
  action_type:
    | "add_tag"
    | "remove_tag"
    | "update_field"
    | "move_to_segment"
    | "notify_team"
    | "webhook";
  action_params: Record<string, unknown>;
}
```

### 4.4 Drip Sequence Builder UI

**Location:** `src/app/dashboard/sites/[siteId]/marketing/sequences/`

#### Sequence List Page

```
Route: /dashboard/sites/[siteId]/marketing/sequences
```

```
Features:
- List all sequences with: name, status (draft/active/paused),
  enrolled contacts, completion rate, created date
- Status filter tabs: All | Active | Draft | Paused
- Create new sequence button
- Duplicate sequence
- View sequence performance
```

#### Sequence Builder Page

```
Route: /dashboard/sites/[siteId]/marketing/sequences/new
Route: /dashboard/sites/[siteId]/marketing/sequences/[sequenceId]/edit
```

```
Visual vertical timeline builder:

┌─────────────────────────────────────────────┐
│ Sequence: Welcome Onboarding               │
│ Trigger: [Contact Created ▼]                │
│ Audience: [All New Contacts ▼]              │
├─────────────────────────────────────────────┤
│                                             │
│  ⬇ TRIGGER: Contact Created                │
│  │                                          │
│  ⬇ 📧 EMAIL: Welcome! (immediate)          │
│  │   Subject: "Welcome to {{site_name}}"    │
│  │   [Edit Email] [Preview]                 │
│  │                                          │
│  ⬇ ⏱ WAIT: 2 days                         │
│  │                                          │
│  ⬇ ❓ CONDITION: Opened previous email?    │
│  │   ├─ YES ──→                             │
│  │   │  ⬇ 📧 EMAIL: Getting Started Guide  │
│  │   │                                      │
│  │   └─ NO ───→                             │
│  │      ⬇ 📧 EMAIL: Did you see our email? │
│  │                                          │
│  ⬇ ⏱ WAIT: 3 days                         │
│  │                                          │
│  ⬇ 📧 EMAIL: Feature Spotlight             │
│  │                                          │
│  ⬇ 🏁 SEQUENCE COMPLETE                    │
│                                             │
│  [+ Add Step]                               │
│                                             │
│  Exit Conditions:                           │
│  ☑ Contact unsubscribes                     │
│  ☑ Contact makes a purchase                 │
│  ☐ Contact replies to an email              │
│                                             │
│  [Save Draft] [Activate Sequence]           │
└─────────────────────────────────────────────┘
```

#### Component Structure

```
sequences/
├── page.tsx                     — Sequence list
├── new/page.tsx                 — Create (renders builder)
├── [sequenceId]/
│   ├── page.tsx                 — View/stats
│   └── edit/page.tsx            — Edit (renders builder)
└── components/
    ├── SequenceBuilder.tsx       — Main builder component
    ├── SequenceTimeline.tsx      — Visual timeline renderer
    ├── StepCard.tsx              — Individual step card
    ├── EmailStepEditor.tsx       — Email step config (opens email editor)
    ├── DelayStepEditor.tsx       — Delay config (amount + unit picker)
    ├── ConditionStepEditor.tsx   — Condition config with branching
    ├── ActionStepEditor.tsx      — Action config (tag, field, etc.)
    ├── TriggerSelector.tsx       — Dropdown of available triggers
    ├── ExitConditions.tsx        — Exit condition checkboxes
    └── SequenceStats.tsx         — Per-step completion funnel
```

### 4.5 Sequence Execution Engine

```typescript
// sequence-engine.ts
// Processes drip sequences by checking enrolled contacts
// against their current step and advancing them when delays complete.
//
// Execution approach: Cron-based step processor
// Runs every 5 minutes via Vercel cron (or same cron as campaign scheduler)
// Checks all active enrollments where next_step_at <= now()

export async function processSequenceSteps() {
  const supabase = createServiceClient();

  // Find enrollments ready for next step
  const { data: readyEnrollments } = await supabase
    .from("mod_mktmod01_sequence_enrollments")
    .select(
      `
      *,
      mod_mktmod01_sequences (*),
      mod_mktmod01_sequence_steps (*)
    `,
    )
    .eq("status", "active")
    .lte("next_step_at", new Date().toISOString())
    .limit(100); // Process in batches

  for (const enrollment of readyEnrollments ?? []) {
    try {
      await processEnrollmentStep(supabase, enrollment);
    } catch (error) {
      console.error(`Failed to process enrollment ${enrollment.id}:`, error);
      // Don't stop processing other enrollments
    }
  }
}

async function processEnrollmentStep(
  supabase: SupabaseClient,
  enrollment: SequenceEnrollment,
) {
  const steps = enrollment.mod_mktmod01_sequence_steps.sort(
    (a, b) => a.step_order - b.step_order,
  );

  const currentStep = steps.find(
    (s) => s.step_order === enrollment.current_step,
  );
  if (!currentStep) {
    // No more steps — complete the enrollment
    await completeEnrollment(supabase, enrollment.id);
    return;
  }

  // Check exit conditions first
  if (await shouldExitSequence(supabase, enrollment)) {
    await exitEnrollment(supabase, enrollment.id, "exit_condition_met");
    return;
  }

  switch (currentStep.step_type) {
    case "email":
      await sendSequenceEmail(supabase, enrollment, currentStep);
      break;
    case "delay":
      // Delay step — just advance (the delay was already waited)
      break;
    case "condition":
      await evaluateCondition(supabase, enrollment, currentStep);
      return; // evaluateCondition handles its own step advancement
    case "action":
      await executeAction(supabase, enrollment, currentStep);
      break;
  }

  // Advance to next step
  const nextStep = steps.find(
    (s) => s.step_order === enrollment.current_step + 1,
  );
  if (nextStep) {
    const nextStepAt = calculateNextStepTime(nextStep);
    await supabase
      .from("mod_mktmod01_sequence_enrollments")
      .update({
        current_step: nextStep.step_order,
        next_step_at: nextStepAt.toISOString(),
        last_step_at: new Date().toISOString(),
      })
      .eq("id", enrollment.id);
  } else {
    await completeEnrollment(supabase, enrollment.id);
  }
}

function calculateNextStepTime(step: SequenceStep): Date {
  const now = new Date();
  if (step.step_type === "delay") {
    const config = step.config as DelayStepConfig;
    const ms = {
      minutes: 60_000,
      hours: 3_600_000,
      days: 86_400_000,
      weeks: 604_800_000,
    }[config.delay_unit];
    return new Date(now.getTime() + config.delay_amount * ms);
  }
  // Non-delay steps execute immediately
  return now;
}
```

### 4.6 Enrollment Management

```typescript
// enrollment.ts
// Enrolls contacts into sequences based on trigger events

// Enrollment triggers (integrated with automation engine):
// 1. contact.created → enroll in welcome sequence
// 2. marketing.contact.subscribed → enroll in subscriber sequence
// 3. ecommerce.order.completed → enroll in post-purchase sequence
// 4. ecommerce.cart.abandoned → enroll in abandoned cart sequence
// 5. marketing.campaign.opened → enroll in follow-up sequence
// 6. Manual enrollment → user selects contacts to enroll
// 7. Segment membership → auto-enroll when contact enters segment

export async function enrollContact(
  supabase: SupabaseClient,
  sequenceId: string,
  contactId: string,
  siteId: string,
  triggerEvent?: string,
): Promise<void> {
  // 1. Check if already enrolled (prevent duplicates)
  const { data: existing } = await supabase
    .from("mod_mktmod01_sequence_enrollments")
    .select("id, status")
    .eq("sequence_id", sequenceId)
    .eq("contact_id", contactId)
    .in("status", ["active", "paused"]);

  if (existing && existing.length > 0) {
    return; // Already enrolled
  }

  // 2. Get first step
  const { data: firstStep } = await supabase
    .from("mod_mktmod01_sequence_steps")
    .select("step_order")
    .eq("sequence_id", sequenceId)
    .order("step_order", { ascending: true })
    .limit(1)
    .single();

  // 3. Create enrollment
  await supabase.from("mod_mktmod01_sequence_enrollments").insert({
    sequence_id: sequenceId,
    contact_id: contactId,
    site_id: siteId,
    status: "active",
    current_step: firstStep?.step_order ?? 1,
    next_step_at: new Date().toISOString(), // Process immediately
    enrolled_at: new Date().toISOString(),
    trigger_event: triggerEvent,
  });

  // 4. Fire automation event
  await logAutomationEvent({
    event_type: "marketing.sequence.enrolled",
    site_id: siteId,
    metadata: {
      sequence_id: sequenceId,
      contact_id: contactId,
      trigger: triggerEvent,
    },
  });
}
```

### 4.7 New Automation Triggers & Actions

**Modifications to existing automation files:**

#### New Event Types (add to `event-types.ts`)

```typescript
// Add these to the EVENT_REGISTRY:

// Marketing Events:
"marketing.campaign.created"; // When a campaign is created
"marketing.campaign.scheduled"; // When a campaign is scheduled
"marketing.campaign.sending"; // When sending begins
"marketing.campaign.sent"; // When sending completes
"marketing.campaign.paused"; // When sending is paused
"marketing.email.opened"; // When a contact opens an email (first time)
"marketing.email.clicked"; // When a contact clicks a link (first time)
"marketing.email.bounced"; // When an email bounces
"marketing.contact.subscribed"; // When a contact subscribes
"marketing.contact.unsubscribed"; // When a contact unsubscribes
"marketing.contact.complained"; // When a contact marks as spam
"marketing.sequence.enrolled"; // When contact enters a sequence
"marketing.sequence.completed"; // When contact completes a sequence
"marketing.sequence.exited"; // When contact exits early
"marketing.form.submitted"; // When a marketing form is submitted
"marketing.landing.visited"; // When a landing page is visited
"marketing.landing.converted"; // When a landing page conversion happens
"marketing.engagement.cold"; // When engagement score drops to cold
```

#### New Action Types (add to `action-types.ts`)

```typescript
// Add these to ACTION_TYPES:

"marketing.send_campaign"; // Send a specific campaign to trigger contact
"marketing.enroll_sequence"; // Enroll contact in a drip sequence
"marketing.remove_from_sequence"; // Remove contact from a sequence
"marketing.add_to_audience"; // Add contact to a campaign audience
"marketing.update_engagement"; // Recalculate engagement score
"marketing.subscribe"; // Set contact as subscribed
"marketing.unsubscribe"; // Set contact as unsubscribed
"marketing.send_sequence_email"; // Send a specific sequence step email
```

### 4.8 Pre-Built Marketing Automation Templates

**Location:** `src/modules/marketing/data/automation-templates.ts`

These are added to the existing automation template system (system-templates.ts pattern). Each template creates a complete workflow when selected.

```typescript
export const MARKETING_AUTOMATION_TEMPLATES = [
  // 1. Welcome Sequence
  {
    id: "mkt-welcome-sequence",
    name: "Welcome Email Sequence",
    description: "Automated 5-email onboarding sequence for new contacts",
    category: "marketing",
    icon: "Sparkles",
    trigger: "contact.created",
    steps: [
      { type: "email", delay: 0, subject: "Welcome to {{site_name}}!" },
      { type: "delay", days: 2 },
      { type: "email", subject: "Getting Started Guide" },
      { type: "delay", days: 3 },
      { type: "condition", check: "opened_previous" },
      { type: "email", subject: "Top Features You Should Try" },
      { type: "delay", days: 5 },
      { type: "email", subject: "How Can We Help?" },
      { type: "delay", days: 4 },
      { type: "email", subject: "Special Offer Just for You" },
    ],
  },

  // 2. Abandoned Cart Recovery
  {
    id: "mkt-abandoned-cart",
    name: "Abandoned Cart Recovery",
    description: "3-email sequence to recover abandoned shopping carts",
    category: "marketing",
    trigger: "ecommerce.cart.abandoned",
    steps: [
      { type: "delay", hours: 1 },
      { type: "email", subject: "You left something behind!" },
      { type: "delay", days: 1 },
      { type: "condition", check: "converted", exitIfTrue: true },
      { type: "email", subject: "Your cart is waiting" },
      { type: "delay", days: 2 },
      { type: "condition", check: "converted", exitIfTrue: true },
      { type: "email", subject: "Last chance: 10% off your cart" },
    ],
  },

  // 3. Post-Purchase Follow-Up
  {
    id: "mkt-post-purchase",
    name: "Post-Purchase Follow-Up",
    description: "Thank customers, request reviews, suggest related products",
    category: "marketing",
    trigger: "ecommerce.order.completed",
    steps: [
      { type: "delay", days: 1 },
      { type: "email", subject: "Thank you for your order!" },
      { type: "delay", days: 7 },
      { type: "email", subject: "How was your experience?" },
      { type: "delay", days: 14 },
      { type: "email", subject: "You might also like..." },
    ],
  },

  // 4. Re-Engagement Campaign
  {
    id: "mkt-reengagement",
    name: "Re-Engagement / Win-Back",
    description: "Re-engage contacts who haven't opened emails in 60+ days",
    category: "marketing",
    trigger: "marketing.engagement.cold",
    steps: [
      { type: "email", subject: "We miss you, {{first_name}}!" },
      { type: "delay", days: 5 },
      { type: "condition", check: "opened_previous" },
      { type: "email", subject: "Here's what you've been missing" },
      { type: "delay", days: 7 },
      { type: "condition", check: "no_opens_after_sequence" },
      { type: "action", action: "add_tag", tag: "inactive" },
    ],
  },

  // 5. Lead Nurture
  {
    id: "mkt-lead-nurture",
    name: "Lead Nurture Sequence",
    description: "Educate and warm up leads over 3 weeks",
    category: "marketing",
    trigger: "marketing.form.submitted",
    steps: [
      { type: "email", subject: "Thanks for your interest!" },
      { type: "delay", days: 3 },
      { type: "email", subject: "Understanding {{site_name}}" },
      { type: "delay", days: 4 },
      { type: "email", subject: "Customer Success Story" },
      { type: "delay", days: 5 },
      { type: "email", subject: "Ready to Take the Next Step?" },
    ],
  },

  // 6. Birthday / Anniversary
  {
    id: "mkt-birthday",
    name: "Birthday / Anniversary Email",
    description: "Automated birthday or signup anniversary greeting",
    category: "marketing",
    trigger: "contact.anniversary", // Custom trigger: fires on contact created_at anniversary
    steps: [{ type: "email", subject: "Happy Birthday, {{first_name}}! 🎉" }],
  },

  // 7. Newsletter Subscriber Double Opt-In
  {
    id: "mkt-double-optin",
    name: "Double Opt-In Confirmation",
    description: "Confirm subscription and welcome new subscribers",
    category: "marketing",
    trigger: "marketing.contact.subscribed",
    steps: [
      { type: "email", subject: "Confirm your subscription" },
      { type: "delay", days: 1 },
      { type: "condition", check: "confirmed_subscription" },
      { type: "email", subject: "You're in! Welcome to our newsletter" },
    ],
  },

  // 8. Event Registration Follow-Up
  {
    id: "mkt-event-followup",
    name: "Event Registration Follow-Up",
    description: "Confirmation, reminders, and post-event follow-up",
    category: "marketing",
    trigger: "booking.confirmed",
    steps: [
      { type: "email", subject: "Your registration is confirmed!" },
      { type: "delay", days_before_event: 1 },
      { type: "email", subject: "Reminder: Event Tomorrow!" },
      { type: "delay", days_after_event: 1 },
      { type: "email", subject: "Thanks for attending!" },
    ],
  },

  // 9. Feedback Request
  {
    id: "mkt-feedback",
    name: "Feedback/NPS Survey",
    description:
      "Request feedback after interaction (service, purchase, support)",
    category: "marketing",
    trigger: "custom", // Manually triggered or linked to various events
    steps: [
      { type: "delay", days: 2 },
      { type: "email", subject: "We'd love your feedback" },
      { type: "delay", days: 5 },
      { type: "condition", check: "opened_previous", exitIfTrue: true },
      { type: "email", subject: "Quick reminder: share your thoughts" },
    ],
  },

  // 10. Upsell / Cross-Sell
  {
    id: "mkt-upsell",
    name: "Upsell / Cross-Sell",
    description:
      "Recommend upgrades or related products based on purchase history",
    category: "marketing",
    trigger: "ecommerce.order.completed",
    steps: [
      { type: "delay", days: 14 },
      { type: "email", subject: "Upgrade your experience" },
      { type: "delay", days: 7 },
      { type: "condition", check: "clicked_previous" },
      { type: "email", subject: "Exclusive offer for loyal customers" },
    ],
  },

  // 11. Subscription Renewal Reminder
  {
    id: "mkt-renewal-reminder",
    name: "Subscription Renewal Reminder",
    description: "Remind customers before subscription expires",
    category: "marketing",
    trigger: "ecommerce.subscription.expiring",
    steps: [
      { type: "email", subject: "Your subscription expires in 30 days" },
      { type: "delay", days: 15 },
      { type: "email", subject: "Don't lose access — renew now" },
      { type: "delay", days: 12 },
      { type: "email", subject: "Last chance to renew!" },
    ],
  },

  // 12. Course/Content Drip
  {
    id: "mkt-content-drip",
    name: "Content / Course Drip",
    description:
      "Deliver educational content over time (lessons, tips, guides)",
    category: "marketing",
    trigger: "marketing.form.submitted",
    steps: [
      { type: "email", subject: "Lesson 1: Getting Started" },
      { type: "delay", days: 3 },
      { type: "email", subject: "Lesson 2: Intermediate Concepts" },
      { type: "delay", days: 3 },
      { type: "email", subject: "Lesson 3: Advanced Techniques" },
      { type: "delay", days: 3 },
      { type: "email", subject: "Lesson 4: Putting It All Together" },
      { type: "delay", days: 3 },
      { type: "email", subject: "Course Complete — What's Next?" },
    ],
  },

  // 13. Referral Program
  {
    id: "mkt-referral",
    name: "Referral Program Invitation",
    description: "Invite happy customers to refer friends",
    category: "marketing",
    trigger: "ecommerce.order.completed",
    steps: [
      { type: "delay", days: 21 },
      { type: "condition", check: "engagement_score_above", value: 60 },
      { type: "email", subject: "Share the love — refer a friend!" },
    ],
  },

  // 14. Support Ticket Follow-Up
  {
    id: "mkt-support-followup",
    name: "Support Ticket Satisfaction",
    description: "Follow up after support ticket resolution",
    category: "marketing",
    trigger: "support.ticket.resolved",
    steps: [
      { type: "delay", days: 1 },
      { type: "email", subject: "Was your issue resolved?" },
    ],
  },

  // 15. Seasonal Campaign Planner
  {
    id: "mkt-seasonal",
    name: "Seasonal / Holiday Campaign",
    description: "Template for seasonal marketing pushes",
    category: "marketing",
    trigger: "manual",
    steps: [
      { type: "email", subject: "Our Holiday Sale is Here!" },
      { type: "delay", days: 3 },
      { type: "email", subject: "Sale Extended — Last Chance!" },
      { type: "delay", days: 2 },
      { type: "email", subject: "Final Hours: Don't Miss Out" },
    ],
  },
];
```

### 4.9 Sequence Performance Tracking

```
Route: /dashboard/sites/[siteId]/marketing/sequences/[sequenceId]
```

```
Sequence Performance View:

┌──────────────────────────────────────────────────────────┐
│ Sequence: Welcome Onboarding                              │
│ Status: Active · Enrolled: 324 · Completed: 198 · 61%    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Step Funnel:                                             │
│  ┌─────────────────────────────────────────────────┐     │
│  │ Step 1: Welcome Email          324 sent  89% open│     │
│  │ ████████████████████████████████████████████████ │     │
│  │                                                  │     │
│  │ Step 2: Getting Started        312 sent  72% open│     │
│  │ ████████████████████████████████████████        │     │
│  │                                                  │     │
│  │ Step 3: Feature Highlight      298 sent  65% open│     │
│  │ ██████████████████████████████████             │     │
│  │                                                  │     │
│  │ Step 4: Check-In               280 sent  58% open│     │
│  │ ████████████████████████████████               │     │
│  │                                                  │     │
│  │ Step 5: Special Offer          265 sent  45% open│     │
│  │ ████████████████████████                       │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
│  Drop-off points · Exit reasons · Per-step click rates    │
│                                                           │
│  [Enrolled Contacts] [Export Data] [Edit Sequence]        │
└──────────────────────────────────────────────────────────┘
```

### 4.10 Cron Job Updates

```typescript
// Update the marketing cron job to also process sequences:
// /api/cron/marketing-scheduler

export async function GET() {
  // 1. Check scheduled campaigns (existing from MKT-02)
  await checkScheduledCampaigns();

  // 2. Process drip sequence steps (new)
  await processSequenceSteps();

  // 3. Process A/B test winners (from MKT-02)
  await checkABTestResults();

  return new Response("OK");
}

// vercel.json cron entry (already added, just confirm):
// { "path": "/api/cron/marketing-scheduler", "schedule": "*/5 * * * *" }
```

### 4.11 Phase MKT-04 Deliverables Checklist

```
- [ ] Sequence list page with status filters
- [ ] Sequence builder with visual timeline
- [ ] Email step editor (reuses email editor from MKT-02)
- [ ] Delay step editor (amount + unit)
- [ ] Condition step editor (branching logic)
- [ ] Action step editor (tag, field, segment)
- [ ] Exit conditions configuration
- [ ] Sequence execution engine (processSequenceSteps)
- [ ] Contact enrollment logic (prevents duplicates)
- [ ] Smart timing implementation
- [ ] 15 pre-built marketing automation templates
- [ ] New automation event types added to EVENT_REGISTRY (18 events)
- [ ] New automation action types added to ACTION_TYPES (8 actions)
- [ ] Sequence performance page with step funnel
- [ ] Cron job updated for sequence processing
- [ ] Manual enrollment UI (select contacts → enroll in sequence)
- [ ] Sequence pause/resume/stop functionality
- [ ] Automation events: sequence.enrolled, sequence.completed, sequence.exited
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-05: Marketing Hub Dashboard

**Priority:** HIGH — Central command center for all marketing activity
**Estimated Complexity:** Medium
**Dependencies:** Phases MKT-01 through MKT-04 (needs data to display)
**Files Created:** ~12 new files
**Files Modified:** 1-2 files

### 5.1 Overview

The Marketing Hub is the main landing page when users navigate to the Marketing section. It provides a unified overview of all marketing activity, quick actions, and performance insights. Think of it as the "Marketing Home" — the first thing users see.

### 5.2 Hub Layout

```
Route: /dashboard/sites/[siteId]/marketing
```

```
┌─────────────────────────────────────────────────────────────┐
│ Marketing Hub                                   [+ Quick Actions ▼]│
│                                                              │
│  ┌─── Overview Stats ────────────────────────────────────┐  │
│  │ Total Subscribers │ Emails Sent (30d) │ Avg Open Rate │  │
│  │      2,450       │      12,340       │    42.3%      │  │
│  │   +127 this month│   +3,200 vs prev  │  +2.1% vs prev│  │
│  │                  │                    │               │  │
│  │ Avg Click Rate   │ Active Sequences  │ Revenue Attr. │  │
│  │     8.7%        │       4           │   $12,450     │  │
│  │  +0.5% vs prev  │   324 enrolled    │  +$3,200      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Recent Campaigns ─────────────────────────────────┐  │
│  │ Campaign              Status    Open%  Click%  Sent   │  │
│  │ Summer Sale Blast     ● Sent    49.4%  14.0%  Jun 15 │  │
│  │ Weekly Newsletter #12 ● Sent    38.2%  9.1%   Jun 12 │  │
│  │ Product Launch        ⬤ Sched  --     --     Jun 20 │  │
│  │ Flash Sale            ○ Draft   --     --     --     │  │
│  │                                    [View All Campaigns]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Active Sequences ──────┐ ┌─── Quick Actions ───────┐ │
│  │ Welcome Onboarding  324 ✓ │ │ 📧 Create Campaign       │ │
│  │ Cart Recovery       89 ↻  │ │ 📋 View Subscribers      │ │
│  │ Post-Purchase       156 ✓ │ │ 🔄 Create Sequence       │ │
│  │ Re-Engagement       45 ↻  │ │ 📊 View Analytics        │ │
│  │         [View All]        │ │ 📝 Create Landing Page   │ │
│  └───────────────────────────┘ │ 🤖 AI Campaign Ideas     │ │
│                                 └───────────────────────────┘ │
│                                                              │
│  ┌─── Engagement Over Time (30 days) ───────────────────┐  │
│  │ [Line chart: sends, opens, clicks over time]          │  │
│  │ Toggle: 7d | 30d | 90d                                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Subscriber Growth ────┐ ┌─── Top Content ──────────┐ │
│  │ [Area chart: new subs    │ │ Most clicked links       │ │
│  │  per week over 90 days]  │ │ Most opened campaigns    │ │
│  │                          │ │ Best performing templates │ │
│  └──────────────────────────┘ └───────────────────────────┘ │
│                                                              │
│  ┌─── AI Insights ──────────────────────────────────────┐  │
│  │ 💡 Your open rates are 15% above industry average     │  │
│  │ 💡 Tuesday 10AM is your best send time                │  │
│  │ 💡 "Personalized" subject lines get 23% more opens    │  │
│  │ 💡 45 contacts haven't engaged in 60+ days            │  │
│  │                            [View All Insights]         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Component Structure

```
marketing/
├── page.tsx                          — Marketing Hub (server component)
├── components/
│   ├── MarketingHubStats.tsx         — Overview stat cards with trends
│   ├── RecentCampaigns.tsx           — Last 5 campaigns table
│   ├── ActiveSequences.tsx           — Active sequence summary cards
│   ├── QuickActions.tsx              — Action buttons grid
│   ├── EngagementChart.tsx           — Engagement line chart with toggle
│   ├── SubscriberGrowthChart.tsx     — Subscriber growth area chart
│   ├── TopContentPanel.tsx           — Best performing content
│   ├── AIInsightsPanel.tsx           — AI-generated marketing insights
│   └── MarketingHubSkeleton.tsx      — Loading skeleton
```

### 5.4 AI Insights Engine

```typescript
// ai-insights.ts
// Analyzes marketing data and generates actionable insights
// Called periodically (daily) or on-demand from the hub
//
// Uses Claude Haiku for fast, cost-effective insight generation

import { generateWithAI } from "@/lib/ai"; // Existing AI helper

export async function generateMarketingInsights(
  siteId: string,
): Promise<MarketingInsight[]> {
  const supabase = createServiceClient();

  // Gather data points
  const [stats, recentCampaigns, subscriberTrend, engagementDistribution] =
    await Promise.all([
      getAggregateCampaignStats(supabase, siteId, { days: 90 }),
      getRecentCampaigns(supabase, siteId, 20),
      getSubscriberTrend(supabase, siteId, 90),
      getEngagementDistribution(supabase, siteId),
    ]);

  // Build analysis prompt
  const prompt = `Analyze this email marketing data and provide 3-5 actionable insights.
Data:
- Average open rate: ${stats.averageOpenRate}%
- Average click rate: ${stats.averageClickRate}%
- Subscriber count: ${stats.totalSubscribers}
- New subscribers (90d): ${subscriberTrend.newCount}
- Unsubscribes (90d): ${subscriberTrend.unsubCount}
- Best campaign: "${recentCampaigns[0]?.name}" (${recentCampaigns[0]?.openRate}% opens)
- Worst campaign: "${recentCampaigns[recentCampaigns.length - 1]?.name}" (${recentCampaigns[recentCampaigns.length - 1]?.openRate}% opens)
- Engagement distribution: Cold ${engagementDistribution.cold}%, Warm ${engagementDistribution.warm}%, Hot ${engagementDistribution.hot}%
- Best send day: ${stats.bestSendDay}
- Best send hour: ${stats.bestSendHour}

Provide insights as JSON array: [{ "type": "positive|warning|suggestion", "text": "..." }]
Keep each insight under 100 characters. Be specific and actionable.`;

  const result = await generateWithAI({
    model: "haiku", // Fast model for insights
    prompt,
    maxTokens: 500,
  });

  return JSON.parse(result);
}

interface MarketingInsight {
  type: "positive" | "warning" | "suggestion";
  text: string;
}
```

### 5.5 Navigation Structure

The marketing section uses a sub-navigation pattern consistent with other modules:

```typescript
// Marketing sub-navigation items (added to dashboard navigation):
const marketingNavItems = [
  { label: "Hub", href: "/marketing", icon: "LayoutDashboard" },
  { label: "Campaigns", href: "/marketing/campaigns", icon: "Mail" },
  { label: "Sequences", href: "/marketing/sequences", icon: "GitBranch" },
  { label: "Templates", href: "/marketing/templates", icon: "FileText" },
  { label: "Landing Pages", href: "/marketing/landing-pages", icon: "Globe" },
  { label: "Forms", href: "/marketing/forms", icon: "FormInput" },
  { label: "Analytics", href: "/marketing/analytics", icon: "BarChart3" },
  { label: "Settings", href: "/marketing/settings", icon: "Settings" },
];

// All routes are relative to /dashboard/sites/[siteId]/
```

### 5.6 Quick Actions Implementation

```typescript
// Quick Actions should:
// 1. "Create Campaign" → navigates to /marketing/campaigns/new
// 2. "View Subscribers" → navigates to CRM contacts filtered by email_subscribed=true
// 3. "Create Sequence" → navigates to /marketing/sequences/new
// 4. "View Analytics" → navigates to /marketing/analytics
// 5. "Create Landing Page" → navigates to /marketing/landing-pages/new (Phase MKT-06)
// 6. "AI Campaign Ideas" → opens dialog with AI-generated campaign suggestions
//
// AI Campaign Ideas dialog:
// - Takes optional topic/goal input
// - Generates 5 campaign ideas with subject lines
// - User can "Create" any suggestion → pre-fills campaign wizard
```

### 5.7 Revenue Attribution

```typescript
// revenue-attribution.ts
// Tracks revenue attributed to marketing campaigns.
// Attribution model: Last-touch within 7-day window
//
// When an e-commerce order is placed:
// 1. Check if the ordering contact clicked a marketing email in last 7 days
// 2. If yes, attribute the order revenue to that campaign
// 3. Store in mod_mktmod01_campaign_stats.revenue_attributed
//
// This requires a hook in the e-commerce order completion flow:
// After order.completed → check for recent marketing click → attribute

export async function attributeRevenue(
  supabase: SupabaseClient,
  contactId: string,
  orderId: string,
  orderTotal: number,
  siteId: string,
): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Find most recent campaign click within attribution window
  const { data: recentClick } = await supabase
    .from("mod_mktmod01_email_sends")
    .select("campaign_id, clicked_at")
    .eq("contact_id", contactId)
    .not("clicked_at", "is", null)
    .gte("clicked_at", sevenDaysAgo.toISOString())
    .order("clicked_at", { ascending: false })
    .limit(1)
    .single();

  if (recentClick) {
    // Attribute revenue to campaign
    await supabase.rpc("add_campaign_revenue", {
      p_campaign_id: recentClick.campaign_id,
      p_amount: orderTotal,
    });

    // Log attribution
    await supabase.from("mod_mktmod01_campaign_stats").update({
      // RPC function handles atomic increment
    });

    // Fire event for tracking
    await logAutomationEvent({
      event_type: "marketing.revenue.attributed",
      site_id: siteId,
      metadata: {
        campaign_id: recentClick.campaign_id,
        order_id: orderId,
        amount: orderTotal,
        contact_id: contactId,
      },
    });
  }
}
```

### 5.8 Marketing Settings Page

```
Route: /dashboard/sites/[siteId]/marketing/settings
```

```typescript
// Settings sections:
//
// 1. Email Defaults
//    - Default from name
//    - Default from email
//    - Default reply-to
//    - Email footer text (company address for CAN-SPAM compliance)
//    - Default unsubscribe message
//
// 2. Sending Configuration
//    - Daily send limit (protect deliverability)
//    - Batch size
//    - Throttle delay between batches
//    - Send time optimization (on/off)
//
// 3. Tracking
//    - Open tracking enabled (default: true)
//    - Click tracking enabled (default: true)
//    - UTM parameters auto-append (on/off)
//    - Default UTM source (e.g., "email")
//    - Default UTM medium (e.g., "marketing")
//
// 4. Compliance
//    - Double opt-in required (on/off)
//    - Unsubscribe page message (customizable)
//    - Physical mailing address (CAN-SPAM)
//    - GDPR consent message
//
// 5. Integrations
//    - Resend API key status (connected/not connected)
//    - Webhook URL display (for manual configuration if needed)
//    - Social media accounts connected (for future social features)
//
// All settings saved to mod_mktmod01_settings table
```

### 5.9 Phase MKT-05 Deliverables Checklist

```
- [ ] Marketing Hub main page with all sections
- [ ] Overview stat cards with trend comparisons
- [ ] Recent campaigns table
- [ ] Active sequences summary
- [ ] Quick actions grid
- [ ] Engagement over time chart (7d/30d/90d toggle)
- [ ] Subscriber growth chart
- [ ] Top content panel
- [ ] AI Insights panel with generated insights
- [ ] AI Campaign Ideas dialog
- [ ] Revenue attribution logic
- [ ] Marketing sub-navigation structure
- [ ] Marketing Settings page with all sections
- [ ] Loading skeleton for hub
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-06: Landing Pages & Opt-In Forms

**Priority:** HIGH — Primary lead capture mechanism
**Estimated Complexity:** High
**Dependencies:** Phase MKT-01 (tables), Phase MKT-04 (sequence enrollment)
**Files Created:** ~20 new files
**Files Modified:** 2-3 existing files (storefront routing)

### 6.1 Overview

Landing pages and opt-in forms are the primary lead capture tools. This phase builds:

- Landing page builder with visual editor
- Opt-in/signup form builder
- Pop-up and embedded form widgets
- Form submission handling with CRM integration
- Landing page analytics (visits, conversions)
- UTM tracking for traffic source attribution

### 6.2 Landing Page Builder

**Location:** `src/app/dashboard/sites/[siteId]/marketing/landing-pages/`

```
Routes:
  /marketing/landing-pages              — List all landing pages
  /marketing/landing-pages/new          — Create new
  /marketing/landing-pages/[id]/edit    — Edit existing
  /marketing/landing-pages/[id]/stats   — View analytics
```

#### Landing Page Data Model

```typescript
// Uses mod_mktmod01_landing_pages table from Phase MKT-01
// Key fields:
// - title: page title
// - slug: URL path (e.g., "summer-sale" → site.com/lp/summer-sale)
// - content_json: page blocks (similar to email editor but for web pages)
// - form_config: opt-in form configuration embedded in page
// - seo_config: { meta_title, meta_description, og_image }
// - published: boolean
// - conversion_goal: 'form_submit' | 'button_click' | 'page_scroll'
```

#### Landing Page Builder Components

```
landing-pages/
├── components/
│   ├── LandingPageEditor.tsx       — Main editor (similar to studio builder but simplified)
│   ├── LandingPagePreview.tsx      — Live preview
│   ├── PageBlocks/
│   │   ├── HeroSection.tsx         — Full-width hero with CTA
│   │   ├── FeatureGrid.tsx         — Feature/benefit cards
│   │   ├── TestimonialSection.tsx  — Customer testimonials
│   │   ├── PricingTable.tsx        — Pricing comparison
│   │   ├── FAQSection.tsx          — Accordion FAQ
│   │   ├── CountdownTimer.tsx      — Urgency timer
│   │   ├── VideoEmbed.tsx          — YouTube/Vimeo embed
│   │   ├── ImageGallery.tsx        — Image showcase
│   │   ├── OptInFormBlock.tsx      — Embedded opt-in form
│   │   ├── CTASection.tsx          — Call to action strip
│   │   └── SocialProof.tsx         — Logos, stats, trust badges
│   ├── PageSettings.tsx            — SEO, slug, conversion goal
│   └── PageTemplates.tsx           — Pre-built landing page templates
```

#### Pre-Built Landing Page Templates (8 minimum)

```
1. lead-magnet       — Download/resource opt-in
2. webinar           — Event/webinar registration
3. product-launch    — New product announcement
4. coming-soon       — Pre-launch with email capture
5. sale-promo        — Sale/promotion with countdown
6. ebook-download    — E-book/whitepaper download
7. free-trial        — SaaS/service free trial signup
8. consultation      — Book a consultation/demo
```

#### Public Landing Page Rendering

```
Public URL: https://{site-domain}/lp/{slug}
```

```typescript
// Storefront route: src/app/(storefront)/lp/[slug]/page.tsx
// This is a PUBLIC page — no auth required
// Renders the landing page content with:
// - Full page layout from content_json
// - Opt-in form (if configured)
// - Tracking pixel for visit counting
// - UTM parameter capture from URL
// - Conversion tracking script
// - SEO meta tags from seo_config
// - Open Graph tags for social sharing

// On page load:
// 1. Increment visit counter
// 2. Capture UTM params from URL (utm_source, utm_medium, utm_campaign, etc.)
// 3. Store visit in mod_mktmod01_landing_page_visits (or inline in landing_pages stats)
// 4. Fire: marketing.landing.visited event

export default async function LandingPage({
  params,
}: {
  params: { slug: string };
}) {
  // Look up landing page by slug
  // Must also resolve which site this belongs to (from domain or subdomain)
  // Render page blocks
  // Include conversion tracking
}
```

### 6.3 Opt-In Form Builder

**Location:** `src/app/dashboard/sites/[siteId]/marketing/forms/`

```
Routes:
  /marketing/forms              — List all forms
  /marketing/forms/new          — Create new form
  /marketing/forms/[id]/edit    — Edit form
  /marketing/forms/[id]/stats   — Form analytics
```

#### Form Types

```typescript
// Uses mod_mktmod01_forms table from Phase MKT-01

type FormType =
  | "inline" // Embedded in page content
  | "popup" // Modal popup (trigger: time delay, scroll %, exit intent)
  | "slide_in" // Slide-in from bottom/side
  | "top_bar" // Sticky banner at top of page
  | "full_page"; // Full-page overlay

interface FormConfig {
  type: FormType;
  fields: FormField[];
  style: FormStyle;
  trigger: FormTrigger; // When popup/slide-in appears
  success_action: SuccessAction; // What happens after submit
  tags_to_add: string[]; // Tags added to contact on submit
  sequence_to_enroll?: string; // Auto-enroll in drip sequence
  double_optin: boolean; // Require email confirmation
}

interface FormField {
  name: string;
  label: string;
  type: "email" | "text" | "phone" | "select" | "checkbox" | "hidden";
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
}

interface FormTrigger {
  type: "immediate" | "time_delay" | "scroll_percent" | "exit_intent" | "click";
  delay_seconds?: number; // For time_delay
  scroll_percent?: number; // For scroll_percent (e.g., 50)
  element_selector?: string; // For click trigger
  show_once_per_session: boolean;
  show_once_per_visitor: boolean;
}

interface SuccessAction {
  type: "message" | "redirect" | "close";
  message?: string; // Thank you message
  redirect_url?: string; // Redirect URL
}
```

#### Form Builder UI

```
┌──────────────────────────────────────────────────────┐
│ Form Builder                                          │
├──────────────┬───────────────────────────────────────┤
│              │                                        │
│ Form Type:   │  PREVIEW:                              │
│ ○ Inline     │  ┌────────────────────────────────┐   │
│ ● Popup      │  │                                │   │
│ ○ Slide-in   │  │  Get Our Free Guide! 📚        │   │
│ ○ Top Bar    │  │                                │   │
│ ○ Full Page  │  │  Name: [_______________]       │   │
│              │  │  Email: [______________]       │   │
│ Fields:      │  │                                │   │
│ [+] Add Field│  │  [Download Now →]              │   │
│ · Email (req)│  │                                │   │
│ · Name       │  │  We respect your privacy.      │   │
│ · Company    │  │                                │   │
│              │  └────────────────────────────────┘   │
│ Trigger:     │                                        │
│ After 5 sec  │                                        │
│ Show once    │                                        │
│              │                                        │
│ On Submit:   │                                        │
│ ● Message    │                                        │
│ ○ Redirect   │                                        │
│              │                                        │
│ Auto-actions:│                                        │
│ Tag: lead    │                                        │
│ Sequence:    │                                        │
│ [Welcome ▼]  │                                        │
│              │                                        │
│ [Save] [Get Embed Code]                               │
├──────────────┴───────────────────────────────────────┤
```

#### Embed Code Generation

```typescript
// When user clicks "Get Embed Code", generate:

// Option 1: JavaScript embed (recommended)
// <script src="https://app.dramacagency.com/api/forms/embed/{formId}.js"></script>

// Option 2: iframe embed
// <iframe src="https://app.dramacagency.com/api/forms/embed/{formId}" ...></iframe>

// Option 3: HTML + API (for developers)
// Raw HTML form that POSTs to /api/forms/submit/{formId}

// The JavaScript embed:
// - Injects form HTML into page
// - Handles popup/slide-in/top-bar triggers
// - Handles submission via fetch() API
// - Shows success message or redirect
// - Respects show_once settings via localStorage
// - Minimal footprint (~5KB gzipped)
```

#### Form Submission Handler

```typescript
// API: POST /api/forms/submit/[formId]
// Public route — no auth (used from external websites)
// MUST have CORS headers for cross-origin embeds
// MUST have rate limiting to prevent abuse

export async function POST(
  request: Request,
  { params }: { params: { formId: string } },
) {
  // 1. Load form config
  // 2. Validate submission against form fields
  // 3. Rate limit check (IP-based, max 10 submissions per minute)
  // 4. Create or update CRM contact:
  //    - If email exists → update existing contact
  //    - If new → create contact with email_subscribed = true
  // 5. Add configured tags
  // 6. If double_optin → send confirmation email, don't subscribe yet
  // 7. If sequence configured → enroll in sequence
  // 8. Log form submission to mod_mktmod01_form_submissions
  // 9. Increment form stats (total_submissions, unique conversions)
  // 10. Fire automation event: marketing.form.submitted
  // 11. Return success response

  // CORS headers:
  return new Response(
    JSON.stringify({ success: true, message: form.success_action.message }),
    {
      headers: {
        "Access-Control-Allow-Origin": "*", // Or restrict to site domain
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
    },
  );
}
```

### 6.4 UTM Tracking

```typescript
// utm-tracking.ts
// Captures UTM parameters from URLs and stores them on:
// - Form submissions (which source led to the signup)
// - Landing page visits
// - CRM contact records (first_touch_utm, last_touch_utm)

interface UTMParams {
  utm_source?: string; // e.g., "google", "facebook", "newsletter"
  utm_medium?: string; // e.g., "cpc", "email", "social"
  utm_campaign?: string; // e.g., "summer-sale-2026"
  utm_term?: string; // e.g., search keyword
  utm_content?: string; // e.g., "header-banner" vs "footer-link"
}

// Auto-append UTM params to all marketing email links:
// utm_source=email&utm_medium=marketing&utm_campaign={campaign_name}
// This is configured in Marketing Settings (MKT-05)
```

### 6.5 Phase MKT-06 Deliverables Checklist

```
- [ ] Landing page list page
- [ ] Landing page builder with visual editor
- [ ] 8 pre-built landing page templates
- [ ] Public landing page rendering (storefront route)
- [ ] Landing page SEO/meta tag configuration
- [ ] Form builder UI with live preview
- [ ] 5 form types (inline, popup, slide-in, top bar, full page)
- [ ] Form field configuration (email, text, phone, select, checkbox)
- [ ] Form trigger configuration (time delay, scroll, exit intent)
- [ ] Embed code generation (JS, iframe, raw HTML)
- [ ] Form submission API (public, CORS, rate-limited)
- [ ] CRM integration (create/update contact on form submit)
- [ ] Auto-tag and auto-sequence-enroll on form submit
- [ ] Double opt-in flow
- [ ] UTM parameter tracking and storage
- [ ] Landing page visit tracking
- [ ] Form submission analytics
- [ ] Automation events: form.submitted, landing.visited, landing.converted
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-07: Blog Marketing Enhancement

**Priority:** MEDIUM-HIGH — Maximizes existing blog investment
**Estimated Complexity:** Medium
**Dependencies:** Phase MKT-02 (email templates), Phase MKT-06 (forms)
**Files Created:** ~10 new files
**Files Modified:** 5-8 existing blog files

### 7.1 Overview

This phase enhances the existing blog system with marketing capabilities. It does NOT rebuild the blog — it adds marketing layers on top of what exists:

- In-post CTA blocks (call-to-action embedded in blog posts)
- Blog subscriber opt-in (newsletter signup on blog pages)
- Content-to-email conversion (turn blog post into email campaign)
- Exit-intent popup configuration for blog pages
- RSS feed for email newsletter automation
- Blog post performance tracking (reads → engagement → conversion)
- SEO content scoring with AI suggestions

### 7.2 In-Post CTA Blocks

**Enhancement to existing blog editor**

```typescript
// Add new block type to the blog post editor (Studio Builder / rich text editor)
// Blog CTA Block: a styled card within blog content that drives action

interface BlogCTABlock {
  type: "marketing_cta";
  style: "banner" | "card" | "inline" | "sidebar";
  heading: string;
  body: string;
  button_text: string;
  button_url: string; // Link to landing page, form, or external URL
  form_id?: string; // Optional: embed an opt-in form instead of link
  background_color?: string; // Uses brand colors by default
  image_url?: string;
  position:
    | "after_paragraph_2"
    | "after_paragraph_5"
    | "end_of_post"
    | "custom";
}

// Predefined CTA templates:
// - "Subscribe to Newsletter" banner
// - "Download Free Guide" card
// - "Book a Consultation" card
// - "Related Product" card (pulls from e-commerce)
// - "Share This Post" social buttons
```

### 7.3 Blog Subscriber Widget

```typescript
// Add newsletter opt-in component to blog layout
// Appears: below posts, in sidebar, or as floating widget

// Component: BlogSubscribeWidget.tsx
// Location: Added to blog layout/template

// Features:
// - Simple email input + subscribe button
// - Customizable heading and description
// - Connects to marketing form system (creates form automatically)
// - Auto-tags contact as "blog-subscriber"
// - Auto-enrolls in blog subscriber drip sequence
// - Shows on all blog pages (configurable to specific posts/categories)
```

### 7.4 Content-to-Email Conversion

```typescript
// One-click: turn a blog post into an email campaign
// "Share as Email" button on blog post editor/detail page

export async function convertBlogToEmail(
  blogPostId: string,
  siteId: string,
): Promise<Campaign> {
  const post = await getBlogPost(blogPostId);

  // Convert blog HTML content to email blocks:
  // - Title → Header block
  // - Featured image → Image block
  // - Content paragraphs → Text blocks
  // - Embedded images → Image blocks
  // - End → "Read full post on our blog" CTA button
  // - Footer → Standard email footer with unsubscribe

  const emailContent = blogHtmlToEmailBlocks(post.content, post.featured_image);

  const campaign = await createCampaign({
    site_id: siteId,
    name: `Blog: ${post.title}`,
    subject_line: post.title,
    preview_text: post.excerpt || post.meta_description,
    content_json: emailContent,
    campaign_type: "regular",
    status: "draft",
  });

  return campaign;
}
```

### 7.5 Blog SEO Content Scoring

```typescript
// AI-powered content scoring for blog posts
// Analyzes post and provides marketing-focused SEO recommendations

interface ContentScore {
  overall: number; // 0-100
  readability: number; // Flesch-Kincaid
  seo_score: number; // Keyword density, meta tags, headings
  engagement_potential: number; // Predicted shareability
  recommendations: string[];
}

// Scoring criteria:
// - Title length (50-60 chars optimal)
// - Meta description present and optimal length
// - H2/H3 heading structure
// - Image alt text present
// - Internal links count
// - Word count (1,000+ recommended)
// - Keyword usage (if target keyword set)
// - CTA present in post
// - Readability level
//
// AI enhancement: Claude Haiku analyzes content and suggests:
// - Better title options
// - Missing keywords to add
// - Sections to expand
// - CTA placement recommendations
// - Social media post suggestions for sharing
```

### 7.6 RSS Feed for Email

```typescript
// Generate RSS feed for the blog that can be consumed by:
// - Email newsletter automation (send latest posts weekly)
// - External subscribers
// - Social media auto-posting tools

// Route: /api/sites/[siteId]/blog/rss.xml
// Public route — returns XML RSS feed

// Marketing integration:
// Create automated workflow template:
// Trigger: "New blog post published"
// Action: "Send blog digest email to blog-subscriber segment"
// Schedule: Weekly digest or per-post notification
```

### 7.7 Phase MKT-07 Deliverables Checklist

```
- [ ] Blog CTA block type added to editor (4 styles)
- [ ] Pre-built CTA templates (5 templates)
- [ ] Blog subscriber widget component
- [ ] Blog subscribe form auto-creation
- [ ] Content-to-email conversion function
- [ ] "Share as Email" button on blog post editor
- [ ] Blog HTML to email blocks converter
- [ ] SEO content scoring engine
- [ ] AI content recommendations
- [ ] RSS feed API route
- [ ] Blog digest automation template
- [ ] Blog post engagement tracking (read time, scroll depth)
- [ ] Exit-intent popup config for blog pages
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-08: SMS & WhatsApp Channel (Foundation)

**Priority:** MEDIUM — Channel expansion for higher engagement
**Estimated Complexity:** Medium
**Dependencies:** Phase MKT-01 (settings), Phase MKT-04 (sequences)
**Files Created:** ~12 new files
**Files Modified:** 2-3 existing files

### 8.1 Overview

This phase adds SMS and WhatsApp as marketing channels. Rather than building full-featured SMS/WhatsApp campaign builders (which mirror email), this phase focuses on:

- SMS/WhatsApp as steps within existing sequences and automations
- SMS campaign sending (text-only, simpler than email)
- WhatsApp template message sending (Meta Business API)
- Contact phone number collection and opt-in
- SMS/WhatsApp delivery tracking
- Provider abstraction (Twilio for SMS, Meta API for WhatsApp — configurable)

**Provider Note:** Use a provider abstraction layer so SMS provider can be swapped (Twilio, Vonage, MessageBird, etc.).

### 8.2 SMS Architecture

```typescript
// sms-provider.ts
// Abstract interface for SMS providers

interface SMSProvider {
  sendSMS(
    to: string,
    message: string,
    options?: SMSOptions,
  ): Promise<SMSSendResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
  getBalance(): Promise<number>;
}

interface SMSOptions {
  from?: string; // Sender ID or phone number
  campaign_id?: string; // For tracking
  contact_id?: string; // For tracking
}

interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Twilio implementation:
class TwilioSMSProvider implements SMSProvider {
  async sendSMS(to: string, message: string, options?: SMSOptions) {
    // Uses Twilio REST API
    // Credentials from mod_mktmod01_settings: twilio_account_sid, twilio_auth_token, twilio_phone_number
  }
}

// Future: VonageSMSProvider, MessageBirdSMSProvider, etc.
```

### 8.3 WhatsApp Architecture

```typescript
// whatsapp-provider.ts
// Uses Meta Business API (Cloud API) for WhatsApp Business

interface WhatsAppProvider {
  sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    components: TemplateComponent[],
  ): Promise<WhatsAppSendResult>;

  sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult>;
}

// Important: WhatsApp Business API requires:
// 1. Approved business account
// 2. Pre-approved message templates (for marketing messages)
// 3. 24-hour window for freeform messages (only after user initiates)
//
// For marketing: ONLY template messages are allowed
// Templates must be pre-approved by Meta before use
```

### 8.4 SMS/WhatsApp as Sequence Steps

```typescript
// Extend sequence step types to support SMS and WhatsApp:

interface SMSStepConfig {
  message: string; // SMS text (max 160 chars for single, or multi-segment)
  personalization: boolean; // Replace {{first_name}} etc.
}

interface WhatsAppStepConfig {
  template_name: string; // Pre-approved template
  template_language: string;
  template_components: TemplateComponent[];
}

// In SequenceBuilder, add:
// - "SMS" step type with text input
// - "WhatsApp" step type with template selector
// These appear alongside Email, Delay, Condition, Action steps
```

### 8.5 SMS Campaign Builder

```
Route: /dashboard/sites/[siteId]/marketing/sms
```

```typescript
// Simplified campaign builder for SMS:
// - Campaign name
// - Message text (with character counter: X/160)
// - Personalization token insertion
// - Audience selection (reuses same audience resolver, but filters for contacts with phone_number)
// - Schedule or send now
// - Test SMS button

// SMS campaigns use the same mod_mktmod01_campaigns table
// with channel = 'sms' instead of 'email'
```

### 8.6 Contact Phone Opt-In

```typescript
// Extend opt-in forms to collect phone numbers:
// - Add phone field type with country code selector
// - SMS opt-in checkbox: "I agree to receive SMS messages"
// - WhatsApp opt-in checkbox: "I agree to receive WhatsApp messages"
// - Store on CRM contact: phone_number, sms_subscribed, whatsapp_subscribed
//
// Compliance:
// - TCPA compliance for US SMS
// - Opt-in language clearly visible
// - Easy opt-out (reply STOP for SMS)
```

### 8.7 Settings

```
Marketing Settings → SMS/WhatsApp section:

SMS:
- Provider: [Twilio ▼]
- Account SID: [****]
- Auth Token: [****]
- Phone Number: [+1234567890]
- Daily SMS limit: [500]

WhatsApp:
- Business Account ID: [****]
- Phone Number ID: [****]
- Access Token: [****]
- Approved Templates: [list with sync button]
```

### 8.8 Phase MKT-08 Deliverables Checklist

```
- [ ] SMS provider abstraction layer
- [ ] Twilio SMS provider implementation
- [ ] WhatsApp provider (Meta Cloud API) implementation
- [ ] SMS step type in sequence builder
- [ ] WhatsApp step type in sequence builder
- [ ] SMS campaign builder (simplified)
- [ ] Phone number collection in form builder
- [ ] SMS/WhatsApp opt-in fields on forms
- [ ] Delivery tracking for SMS/WhatsApp
- [ ] SMS/WhatsApp settings in marketing settings
- [ ] Contact phone opt-in management
- [ ] Automation actions: sms.send, whatsapp.send_template
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-09: AI Marketing Intelligence

**Priority:** MEDIUM — Differentiating feature for the platform
**Estimated Complexity:** Medium
**Dependencies:** Phases MKT-02 through MKT-05 (needs campaign data for analysis)
**Files Created:** ~10 new files
**Files Modified:** 2-3 existing files

### 9.1 Overview

This phase adds AI-powered intelligence across the marketing module:

- AI subject line generator (with A/B score prediction)
- AI content writer for email campaigns
- AI audience suggestion ("who should receive this?")
- Send time optimization (predict best time per contact)
- Campaign performance predictor
- Smart segmentation suggestions
- Competitor-aware content suggestions
- AI-powered campaign briefing (natural language → campaign setup)

### 9.2 AI Subject Line Generator

```typescript
// subject-line-ai.ts
// Generates subject line options with predicted performance

export async function generateSubjectLines(
  input: SubjectLineInput,
): Promise<SubjectLineSuggestion[]> {
  const prompt = `Generate 5 email subject lines for a marketing campaign.

Campaign context:
- Campaign goal: ${input.goal}
- Target audience: ${input.audienceDescription}
- Key message: ${input.keyMessage}
- Brand voice: ${input.brandVoice || "professional and friendly"}
- Industry: ${input.industry || "general"}

For each subject line, provide:
1. The subject line (max 60 characters)
2. A preview text suggestion (max 100 characters)
3. Predicted open rate category: "high", "medium", or "low"
4. Why this subject line works (max 30 words)

Techniques to use across suggestions:
- Curiosity gap
- Personalization (use {{first_name}})
- Numbers/statistics
- Questions
- Urgency (without being spammy)

Return as JSON array.`;

  const result = await generateWithAI({
    model: "haiku",
    prompt,
    maxTokens: 800,
  });

  return JSON.parse(result);
}
```

### 9.3 AI Email Content Writer

```typescript
// email-content-ai.ts
// Generates email body content given a brief

export async function generateEmailContent(
  input: EmailContentInput,
): Promise<EmailContent> {
  // Takes:
  // - Campaign goal/purpose
  // - Key message/offer
  // - Target audience description
  // - Desired tone
  // - CTA (what should reader do)
  // - Brand voice from site settings
  //
  // Returns: Complete EmailContent (block JSON) that can be
  // loaded directly into the email editor
  //
  // AI generates the content text, but structures it into
  // the email block format (header, paragraphs, images, CTA button, footer)
  //
  // Uses Claude Sonnet for higher quality content generation
}

// Also: "Improve this section" — user selects a text block,
// clicks "AI Improve", and gets a rewritten version
export async function improveEmailText(
  currentText: string,
  instruction: string, // e.g., "make it more persuasive", "shorten", "add urgency"
): Promise<string> {
  // Returns improved text
}
```

### 9.4 Send Time Optimization

```typescript
// send-time-optimizer.ts
// Predicts the best time to send emails for maximum engagement
// Uses historical open data to find patterns

export async function getOptimalSendTime(
  supabase: SupabaseClient,
  siteId: string,
  contactId?: string, // Optional: optimize for specific contact
): Promise<{ day: number; hour: number; confidence: number }> {
  // If contact-specific: analyze their personal open times
  // If general: analyze site-wide open patterns
  // Query: email_events where event_type = 'open'
  // Group by: day_of_week, hour_of_day
  // Find: peak engagement windows
  // Returns: recommended day (0=Sun, 6=Sat) and hour (0-23)
  // With confidence score (based on data volume)
  // If insufficient data (< 100 opens): return industry defaults
  // Default: Tuesday/Wednesday at 10 AM local time
}

// Integration: Campaign scheduler can auto-select optimal send time
// UI: "Send at optimal time" checkbox in schedule step
```

### 9.5 Smart Audience Suggestions

```typescript
// audience-ai.ts
// Suggests the best audience for a campaign based on content and goal

export async function suggestAudience(
  campaignContent: EmailContent,
  campaignGoal: string,
  siteId: string,
): Promise<AudienceSuggestion[]> {
  // 1. Analyze campaign content to understand topic/offer
  // 2. Look at CRM segments and contact attributes
  // 3. Suggest segments or filters that match
  //
  // Example suggestions:
  // - "Engaged subscribers (opened email in last 30 days)" - 1,200 contacts
  // - "Customers who purchased in Product Category X" - 340 contacts
  // - "New subscribers this month (not yet sent campaign)" - 89 contacts
  //
  // Each suggestion includes estimated size and reasoning
}
```

### 9.6 AI Campaign Briefing

```typescript
// campaign-briefing-ai.ts
// Natural language → campaign setup
// User describes what they want in plain text, AI creates the campaign

export async function createCampaignFromBrief(
  brief: string, // e.g., "Send a sale announcement to all customers,
  //  20% off everything this weekend, urgent tone"
  siteId: string,
): Promise<CampaignDraft> {
  // AI parses the brief and generates:
  // - Campaign name
  // - Subject line (+ variants for A/B)
  // - Preview text
  // - Audience filter suggestion
  // - Email content (full block JSON)
  // - Schedule suggestion (if timing mentioned)
  //
  // Returns as draft campaign — user reviews and adjusts before sending
}
```

### 9.7 Phase MKT-09 Deliverables Checklist

```
- [ ] AI subject line generator (5 suggestions with predictions)
- [ ] AI preview text generator
- [ ] AI email content writer (full campaign content from brief)
- [ ] "AI Improve" button on text blocks in editor
- [ ] Send time optimization algorithm
- [ ] "Send at optimal time" option in campaign scheduler
- [ ] Smart audience suggestions
- [ ] AI campaign briefing (natural language → campaign setup)
- [ ] AI marketing insights (enhanced from MKT-05 hub)
- [ ] Social media post suggestions from email content
- [ ] All AI features use existing AI infrastructure (generateWithAI)
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-10: Super Admin Marketing View

**Priority:** MEDIUM — Platform-wide health monitoring
**Estimated Complexity:** Low-Medium
**Dependencies:** Phases MKT-01 through MKT-05
**Files Created:** ~8 new files
**Files Modified:** 1-2 existing admin files

### 10.1 Overview

Super admins need platform-wide visibility into email marketing health:

- Email sending reputation monitoring
- Cross-site marketing activity overview
- Deliverability health dashboard
- Abuse/spam complaint monitoring
- Platform-wide sending limits
- Resend API usage and quotas

### 10.2 Admin Marketing Dashboard

```
Route: /admin/marketing
```

```
┌───────────────────────────────────────────────────────────────┐
│ Platform Marketing Overview       [Super Admin]                │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Platform Email Health                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Delivery │ │ Bounce  │ │Complaint│ │ Rep     │            │
│  │  Rate   │ │  Rate   │ │  Rate   │ │ Score   │            │
│  │  98.7%  │ │  0.8%   │ │  0.02%  │ │ 95/100  │            │
│  │  ✅ Good │ │ ✅ Good  │ │ ✅ Good  │ │ ✅ Good  │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                │
│  Thresholds:                                                   │
│  ⚠️  Bounce rate > 2% triggers warning                        │
│  🔴 Complaint rate > 0.1% triggers alert                      │
│  🔴 Complaint rate > 0.3% auto-pauses all marketing sends     │
│                                                                │
│  Top Sites by Send Volume (last 30 days):                      │
│  ┌──────────────────┬──────────┬────────┬──────────┐          │
│  │ Site             │ Emails   │ Bounce │ Complaint│          │
│  ├──────────────────┼──────────┼────────┼──────────┤          │
│  │ Client A Site    │ 15,200   │ 0.5%   │ 0.01%   │          │
│  │ Client B Store   │ 8,400    │ 1.2%   │ 0.03%   │          │
│  │ Client C Blog    │ 3,100    │ 0.3%   │ 0.00%   │          │
│  └──────────────────┴──────────┴────────┴──────────┘          │
│                                                                │
│  Platform Sending Limits:                                      │
│  - Resend plan: [Pro / Enterprise]                             │
│  - Monthly limit: 50,000 | Used: 26,700 (53.4%)               │
│  - Rate limit: 100/sec                                         │
│                                                                │
│  [View Full Logs] [Manage Sending Limits] [Configure Alerts]  │
└───────────────────────────────────────────────────────────────┘
```

### 10.3 Platform Safety Controls

```typescript
// admin-safety.ts
// Auto-protection mechanisms for platform email reputation

export async function checkPlatformHealth(): Promise<PlatformHealth> {
  // Run by admin cron or triggered by webhook events
  // 1. Calculate rolling bounce rate (last 7 days)
  // 2. Calculate rolling complaint rate (last 7 days)
  // 3. If complaint rate > 0.3%:
  //    - Auto-pause ALL marketing sends across ALL sites
  //    - Notify super admin via email
  //    - Log incident
  // 4. If bounce rate > 5%:
  //    - Auto-pause site-specific sends (the offending site)
  //    - Notify super admin
  // 5. If single site sends > daily limit:
  //    - Queue remaining emails for next day
  //    - Notify site owner
}

// Per-site sending limits (set by super admin):
// - max_daily_emails: number (default: 5000)
// - max_monthly_emails: number (default: 50000)
// - can_send_marketing: boolean (admin can disable marketing for a site)
// - warmup_mode: boolean (gradually increase sending limits for new sites)
```

### 10.4 Phase MKT-10 Deliverables Checklist

```
- [ ] Admin marketing dashboard page
- [ ] Platform email health metrics
- [ ] Per-site sending volume table
- [ ] Resend API usage display
- [ ] Auto-pause on high complaint rate
- [ ] Per-site sending limits
- [ ] Admin alerts configuration
- [ ] Health check cron job
- [ ] "Pause/resume marketing for site" admin action
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-11: Client Portal Marketing Views

**Priority:** MEDIUM — Client self-service marketing
**Estimated Complexity:** Medium
**Dependencies:** Phases MKT-01 through MKT-05
**Files Created:** ~15 new files
**Files Modified:** 2-3 existing portal files

### 11.1 Overview

Client portal users (site owners/managers) get a permission-gated view of marketing features. They can:

- View campaign reports (if `can_manage_marketing` permission)
- Create and send campaigns (if `can_manage_marketing` permission)
- View subscriber list
- See marketing analytics
- Manage sequences (view, pause, resume)
- Access form embed codes

### 11.2 Portal Routes

```
/portal/sites/[siteId]/marketing              — Marketing hub (simplified)
/portal/sites/[siteId]/marketing/campaigns     — Campaign list + create
/portal/sites/[siteId]/marketing/campaigns/new — Create campaign
/portal/sites/[siteId]/marketing/campaigns/[id]— Campaign report
/portal/sites/[siteId]/marketing/sequences     — Sequence list
/portal/sites/[siteId]/marketing/subscribers   — Subscriber list
/portal/sites/[siteId]/marketing/analytics     — Analytics overview
/portal/sites/[siteId]/marketing/forms         — Forms + embed codes
```

### 11.3 Permission Gating

```typescript
// Portal marketing pages check:
// 1. Site membership (user has access to this site)
// 2. can_manage_marketing permission (from portal_permissions)
//
// Pattern (follows existing portal permission checks):

export default async function PortalMarketingPage({ params }) {
  const { siteId } = params;
  const user = await getPortalUser();

  // Check site access
  const siteAccess = await checkSiteAccess(user.id, siteId);
  if (!siteAccess) redirect('/portal');

  // Check marketing permission
  const canManageMarketing = await checkPortalPermission(
    user.id, siteId, 'can_manage_marketing'
  );
  if (!canManageMarketing) {
    return <PermissionDenied feature="Marketing" />;
  }

  // Render marketing content...
}
```

### 11.4 Portal vs Dashboard Differences

```
Portal marketing views are SIMPLIFIED versions of dashboard views:

Dashboard (Agency)              → Portal (Client)
─────────────────────────────────────────────────
Full campaign builder           → Same builder (if permitted)
All analytics with raw data     → Simplified analytics (key metrics only)
Sequence builder (full)         → Sequence list (view/pause only, no build)
Landing page builder            → Landing page list + embed codes
Form builder                    → Form list + embed codes
AI insights (full)              → AI insights (read-only)
Marketing settings              → Limited settings (from name, footer text)
Admin safety controls           → NOT VISIBLE
Revenue attribution detailed    → Revenue attribution summary
```

### 11.5 Portal Navigation Addition

```typescript
// Add to portal-navigation.ts (existing file):
// Under the site section, add:

{
  label: 'Marketing',
  href: '/portal/sites/[siteId]/marketing',
  icon: 'Megaphone',
  permission: 'can_manage_marketing',
  children: [
    { label: 'Overview', href: '/marketing' },
    { label: 'Campaigns', href: '/marketing/campaigns' },
    { label: 'Sequences', href: '/marketing/sequences' },
    { label: 'Subscribers', href: '/marketing/subscribers' },
    { label: 'Analytics', href: '/marketing/analytics' },
    { label: 'Forms', href: '/marketing/forms' },
  ],
}
```

### 11.6 Phase MKT-11 Deliverables Checklist

```
- [ ] Portal marketing hub page (simplified)
- [ ] Portal campaign list and create pages
- [ ] Portal campaign report page
- [ ] Portal sequence list page (view/pause only)
- [ ] Portal subscriber list page
- [ ] Portal analytics overview page
- [ ] Portal forms page with embed codes
- [ ] Permission gating on all portal marketing routes
- [ ] Portal navigation updated with marketing section
- [ ] Simplified settings page (from name, footer text)
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Phase MKT-12: Social Media Integration

**Priority:** MEDIUM — Cross-channel marketing coordination
**Estimated Complexity:** Medium
**Dependencies:** Phase MKT-05 (hub), Phase MKT-07 (blog enhancement)
**Files Created:** ~15 new files
**Files Modified:** 2-3 existing files

### 12.1 Overview

Social media integration adds:

- Social media account connections (Facebook, Instagram, Twitter/X, LinkedIn)
- Post scheduling from the marketing dashboard
- Blog post auto-sharing to social channels
- Social media content calendar
- Basic social analytics (click-throughs from social links)
- Social sharing widgets for storefront/blog pages

**Scope Note:** This is NOT a full social media management tool (like Hootsuite). It focuses on marketing coordination — scheduling posts that support email campaigns and blog content.

### 12.2 Social Account Connections

```typescript
// social-connections.ts
// OAuth-based connection to social media platforms

interface SocialConnection {
  id: string;
  site_id: string;
  platform: "facebook" | "instagram" | "twitter" | "linkedin";
  account_name: string;
  access_token: string; // Encrypted in database
  refresh_token?: string;
  token_expires_at?: string;
  page_id?: string; // Facebook Page ID
  connected_at: string;
  status: "active" | "expired" | "disconnected";
}

// Connection flow:
// 1. User clicks "Connect Facebook" in marketing settings
// 2. OAuth redirect to platform's authorization page
// 3. User grants permissions
// 4. Callback stores tokens in social_connections table
// 5. Account appears as connected
//
// Token refresh: cron job checks for expiring tokens and refreshes
```

### 12.3 Social Post Scheduling

```
Route: /dashboard/sites/[siteId]/marketing/social
```

```typescript
// Social post creation:
interface SocialPost {
  id: string;
  site_id: string;
  content: string; // Post text
  media_urls?: string[]; // Attached images/videos
  platforms: SocialPlatform[]; // Which platforms to post to
  scheduled_at?: string; // When to post (null = draft)
  published_at?: string; // When actually posted
  status: "draft" | "scheduled" | "published" | "failed";
  link_url?: string; // Link to include
  utm_params?: UTMParams; // Auto-appended to links
  campaign_id?: string; // Associated email campaign (for coordination)
  blog_post_id?: string; // Associated blog post (for auto-sharing)
}

// Features:
// - Character count per platform (280 for Twitter, 2200 for Instagram, etc.)
// - Platform-specific preview
// - Multi-platform posting (same content, adjusted per platform)
// - Image/media attachment via existing upload system
// - Schedule with date/time picker
// - Auto-append UTM parameters to links
// - "Share this campaign" — generates social post from email campaign content
// - "Share this blog post" — generates social post from blog post
```

### 12.4 Content Calendar

```
Route: /dashboard/sites/[siteId]/marketing/calendar
```

```
Unified marketing calendar showing:
- Email campaigns (scheduled)
- Drip sequence emails
- Social media posts
- Blog posts (scheduled)
- Landing page launches

Calendar view: Month | Week | Day
Color coding by channel:
  📧 Blue = Email campaign
  📱 Green = Social post
  📝 Purple = Blog post
  🔄 Orange = Sequence email
  📄 Gray = Landing page

Drag to reschedule social posts.
Click to view/edit any item.
```

### 12.5 Auto-Share Blog Posts

```typescript
// blog-auto-share.ts
// When a blog post is published, automatically create/schedule social posts

export async function autoShareBlogPost(
  blogPostId: string,
  siteId: string,
): Promise<void> {
  const post = await getBlogPost(blogPostId);
  const connections = await getActiveSocialConnections(siteId);

  for (const connection of connections) {
    // Generate platform-specific content
    const content = await generateSocialContent(post, connection.platform);

    await createSocialPost({
      site_id: siteId,
      content,
      platforms: [connection.platform],
      link_url: post.url,
      utm_params: {
        utm_source: connection.platform,
        utm_medium: "social",
        utm_campaign: "blog-auto-share",
      },
      blog_post_id: blogPostId,
      status: "scheduled",
      scheduled_at: new Date().toISOString(), // Post immediately, or stagger
    });
  }
}

// AI generates platform-appropriate captions:
async function generateSocialContent(
  post: BlogPost,
  platform: SocialPlatform,
): Promise<string> {
  const constraints = {
    twitter: { maxLength: 280, style: "concise with hashtags" },
    facebook: { maxLength: 500, style: "engaging and conversational" },
    instagram: { maxLength: 2200, style: "descriptive with hashtags" },
    linkedin: { maxLength: 1300, style: "professional and insightful" },
  };

  return generateWithAI({
    model: "haiku",
    prompt: `Write a ${platform} post promoting this blog article.
      Title: ${post.title}
      Summary: ${post.excerpt}
      Style: ${constraints[platform].style}
      Max length: ${constraints[platform].maxLength} characters.
      Include relevant hashtags.`,
    maxTokens: 300,
  });
}
```

### 12.6 Social Sharing Widgets

```typescript
// Storefront/Blog components:
// - ShareButtons.tsx — Social share buttons on blog posts and products
// - SocialFollow.tsx — "Follow us" icons linking to social profiles
//
// These pull connected social account URLs from marketing settings
// and render branded share/follow buttons
```

### 12.7 Phase MKT-12 Deliverables Checklist

```
- [ ] Social connection OAuth flows (Facebook, Twitter, LinkedIn, Instagram)
- [ ] Social connections settings page
- [ ] Token storage (encrypted) and refresh logic
- [ ] Social post creation UI
- [ ] Multi-platform posting with per-platform preview
- [ ] Social post scheduling
- [ ] Content calendar page (unified view)
- [ ] Calendar view with month/week/day modes
- [ ] Blog auto-share to connected social accounts
- [ ] AI social caption generation per platform
- [ ] Social sharing widgets for storefront
- [ ] UTM auto-append on social links
- [ ] Campaign-to-social content generation
- [ ] Basic social click-through tracking
- [ ] Zero TypeScript errors
- [ ] Successful build
```

---

## Cross-Module Integration Reference

This section documents every integration point between the marketing module and existing platform modules. Implementing agents MUST read this before modifying any existing file.

### Existing Files to Modify (Complete List)

The following existing files require modifications. Changes are ADDITIVE only — never remove existing code.

#### 1. Module Registry

**File:** `src/modules/core/module-registry.ts` (or wherever `CORE_MODULE_SLUGS` is defined)

```
Change: Add "marketing" to CORE_MODULE_SLUGS array
Impact: Marketing module auto-installs when a new site is created
Pattern: Follow exactly how other modules (crm, ecommerce, blog, etc.) are registered
```

#### 2. Roles & Permissions

**File:** `src/lib/roles.ts`

```
Change: Add 'manage_marketing' to agency role permissions array
Impact: Agency users can access marketing features
Pattern: Copy how 'manage_crm' or 'manage_ecommerce' is added
```

#### 3. Portal Permissions

**File:** `src/lib/portal-permissions.ts`

```
Change: Add 'can_manage_marketing' to available portal permissions
Impact: Client portal users can be granted marketing access
Pattern: Copy how 'can_manage_ecommerce' is added
```

#### 4. Dashboard Navigation

**File:** `src/config/navigation.ts` (or wherever dashboard nav is configured)

```
Change: Add marketing nav section with sub-items
Impact: Marketing appears in dashboard sidebar
Items: Hub, Campaigns, Sequences, Templates, Landing Pages, Forms, Analytics, Settings
Pattern: Copy how CRM or E-Commerce nav section is structured
```

#### 5. Portal Navigation

**File:** `src/config/portal-navigation.ts`

```
Change: Add marketing nav section (gated by can_manage_marketing)
Impact: Marketing appears in portal sidebar for permitted users
Items: Overview, Campaigns, Sequences, Subscribers, Analytics, Forms
Pattern: Copy how other gated portal sections work
```

#### 6. Admin Navigation

**File:** `src/config/admin-navigation.ts` (or admin layout)

```
Change: Add marketing health/overview link
Impact: Super admins see platform marketing health
```

#### 7. Automation Event Registry

**File:** `src/modules/automation/data/event-types.ts`

```
Change: Add 18 new marketing.* event types to EVENT_REGISTRY
Impact: Automation workflows can trigger on marketing events
Events listed in Phase MKT-04, Section 4.7
```

#### 8. Automation Action Types

**File:** `src/modules/automation/data/action-types.ts`

```
Change: Add 8 new marketing.* action types to ACTION_TYPES
Impact: Automation workflows can perform marketing actions
Actions listed in Phase MKT-04, Section 4.7
```

#### 9. Automation System Templates

**File:** `src/modules/automation/data/system-templates.ts`

```
Change: Add 15 marketing automation workflow templates
Impact: Users see marketing templates in automation template picker
Templates listed in Phase MKT-04, Section 4.8
```

#### 10. CRM Contact Model

**Database migration — new columns on mod_crm01_contacts:**

```sql
ALTER TABLE mod_crm01_contacts ADD COLUMN email_subscribed BOOLEAN DEFAULT true;
ALTER TABLE mod_crm01_contacts ADD COLUMN email_subscribed_at TIMESTAMPTZ;
ALTER TABLE mod_crm01_contacts ADD COLUMN email_unsubscribed_at TIMESTAMPTZ;
ALTER TABLE mod_crm01_contacts ADD COLUMN email_bounced_at TIMESTAMPTZ;
ALTER TABLE mod_crm01_contacts ADD COLUMN marketing_engagement_score INTEGER DEFAULT 0;
ALTER TABLE mod_crm01_contacts ADD COLUMN first_touch_utm JSONB;
ALTER TABLE mod_crm01_contacts ADD COLUMN last_touch_utm JSONB;
ALTER TABLE mod_crm01_contacts ADD COLUMN phone_number TEXT;
ALTER TABLE mod_crm01_contacts ADD COLUMN sms_subscribed BOOLEAN DEFAULT false;
ALTER TABLE mod_crm01_contacts ADD COLUMN whatsapp_subscribed BOOLEAN DEFAULT false;
```

#### 11. Resend Webhook Handler

**File:** `src/app/api/webhooks/resend/route.ts` (if it exists)

```
Change: Add marketing email event handling alongside transactional
Impact: Opens, clicks, bounces, complaints tracked for marketing emails
Detection: Check for X-Campaign-Id header to distinguish marketing vs transactional
If this file doesn't exist: Create it fresh with both marketing and transactional handling
```

#### 12. Vercel Config

**File:** `next-platform-dashboard/vercel.json`

```
Change: Add cron job entry for marketing scheduler
Addition: { "path": "/api/cron/marketing-scheduler", "schedule": "*/5 * * * *" }
Impact: Scheduled campaigns, sequence steps, and A/B tests process every 5 minutes
```

#### 13. E-Commerce Order Hook

**File:** Where e-commerce order completion is processed

```
Change: After order completes, call attributeRevenue() to check for marketing attribution
Impact: Revenue from marketing-driven sales is tracked
Pattern: Fire-and-forget — don't block order process on attribution
```

#### 14. Blog Post Publishing Hook

**File:** Where blog post status changes to "published"

```
Change: After publish, optionally trigger social auto-share
Impact: Blog posts auto-shared to connected social accounts
Condition: Only if auto-share is enabled in marketing settings
```

---

## Testing Requirements

### Unit Tests

```
For each phase, create unit tests covering:

Phase MKT-01:
- Module registration includes 'marketing'
- Permission checks pass/fail correctly
- Settings CRUD operations

Phase MKT-02:
- Campaign CRUD operations
- Audience resolver (all 4 types: all, segment, tags, custom)
- Personalization token replacement (all tokens)
- HTML safety (XSS prevention in personalization)
- A/B variant selection (consistent for same contact)
- Batch splitting logic
- Unsubscribe token generation and verification

Phase MKT-03:
- Tracking token encode/decode
- URL validation for click tracking (block javascript:, data:, localhost)
- Engagement score calculation (all scenarios)
- CSV export formatting
- Campaign stat increment atomicity

Phase MKT-04:
- Sequence step execution order
- Delay calculation (minutes, hours, days, weeks)
- Condition evaluation (opened, clicked, tag, field)
- Enrollment deduplication
- Exit condition checking

Phase MKT-05:
- Analytics date range filtering
- Revenue attribution (within/outside window)
- AI insights prompt construction

Phase MKT-06:
- Form submission validation
- Rate limiting
- CORS headers
- UTM parameter extraction
- Landing page slug resolution

Phase MKT-07:
- Blog to email content conversion
- SEO score calculation

Phase MKT-08:
- SMS character counting
- Phone number validation
- Provider abstraction interface compliance

Phase MKT-09:
- AI prompt construction (all generators)
- Response parsing (JSON from AI)

Phase MKT-10:
- Platform health calculation
- Auto-pause triggers
- Sending limit enforcement

Phase MKT-11:
- Portal permission gating
- Simplified view data filtering

Phase MKT-12:
- Social post character limits per platform
- UTM parameter appending
- OAuth token refresh logic
```

### Integration Tests

```
Test flows that span multiple modules:

1. Full Campaign Flow:
   Create campaign → set audience → design email → send →
   verify emails sent → verify tracking works → verify stats update

2. Sequence Enrollment Flow:
   Create sequence → activate → trigger event →
   verify enrollment → verify step execution → verify completion

3. Form to Sequence Flow:
   Submit opt-in form → verify CRM contact created →
   verify tags added → verify sequence enrollment →
   verify first email sent

4. Revenue Attribution Flow:
   Send campaign → contact clicks link → contact makes purchase →
   verify revenue attributed to campaign

5. Blog to Email Flow:
   Create blog post → convert to email → send campaign →
   verify content matches

6. Unsubscribe Flow:
   Contact receives email → clicks unsubscribe → confirms →
   verify contact unsubscribed → verify no more emails sent to contact

7. Bounce/Complaint Flow:
   Send email → webhook fires bounce → verify contact marked bounced →
   verify excluded from future sends

8. Portal Permission Flow:
   Client user without marketing permission → verify cannot access →
   Grant permission → verify can access → verify sees simplified views
```

### E2E Tests (Playwright)

```
Key user journeys to test:

1. Agency creates and sends email campaign
2. Agency sets up drip sequence
3. Agency views campaign analytics
4. Client portal user views marketing dashboard
5. Visitor submits opt-in form on landing page
6. Visitor clicks tracking link and gets redirected
7. User unsubscribes via email link
8. Agency creates landing page and publishes it
9. Agency connects social account and schedules post
```

---

## Implementation Sequence Summary

```
Phase MKT-01  → Database & Registration (FOUNDATION — do first)
     ↓
Phase MKT-02  → Email Campaign Engine (CORE — most code)
     ↓
Phase MKT-03  → Analytics & Tracking (depends on MKT-02)
     ↓
Phase MKT-04  → Drip Sequences & Automation (depends on MKT-02 + 03)
     ↓
Phase MKT-05  → Marketing Hub Dashboard (needs data from MKT-02-04)
     ↓
Phase MKT-06  → Landing Pages & Forms (independent, needs MKT-01)
     ↓
Phase MKT-07  → Blog Enhancement (needs MKT-02 + 06)
     ↓
Phase MKT-08  → SMS & WhatsApp (extends MKT-04 sequences)
     ↓
Phase MKT-09  → AI Intelligence (needs data from MKT-02-05)
     ↓
Phase MKT-10  → Super Admin Views (needs MKT-02-03 data)
     ↓
Phase MKT-11  → Client Portal Views (mirrors MKT-05 + 02)
     ↓
Phase MKT-12  → Social Media Integration (needs MKT-05 + 07)
```

**Phases that can be parallelized:**

- MKT-06 can start alongside MKT-03 (both need only MKT-01)
- MKT-10 and MKT-11 can be done in parallel (both read, don't overlap)
- MKT-08 and MKT-09 can be done in parallel (different feature areas)

---

## Session Handoff Protocol

When starting a new session to implement a phase:

1. **Read memory bank files** (required):
   - `/memory-bank/projectbrief.md`
   - `/memory-bank/systemPatterns.md`
   - `/memory-bank/techContext.md`
   - `/memory-bank/activeContext.md`
   - `/memory-bank/progress.md`

2. **Read this guide** — at minimum, read:
   - The architecture overview (Section 0)
   - The specific phase section you're implementing
   - The cross-module integration section
   - The testing requirements for your phase

3. **Check previous phase completion:**
   - Look for completed phase deliverables
   - Verify database tables exist (if needed)
   - Run TypeScript check to ensure clean baseline

4. **Implement the phase:**
   - Follow the specification exactly
   - Use existing platform patterns (snake_case mapping, auth guards, etc.)
   - Fire automation events where specified
   - Check permissions on all routes

5. **After completion:**
   - Run `tsc --noEmit` — zero errors required
   - Run `next build` — must succeed
   - Update `/memory-bank/activeContext.md` with completed phase
   - Update `/memory-bank/progress.md` with marketing module status

---

_End of PHASE-MKT-MASTER-GUIDE.md_
_Total Phases: 12 | Estimated New Files: ~160 | Estimated Modified Files: ~14_

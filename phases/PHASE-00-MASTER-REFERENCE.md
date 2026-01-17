# 🎯 DRAMAC V2 - Master Reference Document

> **IMPORTANT**: This document must be referenced at the START of every phase to maintain consistency.
> 
> **Last Updated**: January 17, 2026

---

## 📋 Project Overview

**DRAMAC** is a B2B SaaS platform that enables agencies to build and manage websites for their clients using a visual editor and AI-powered tools.

### Business Model
- **Agencies** sign up FREE
- **Pay per client seat** ($19-29/month per active client)
- **Module marketplace** with wholesale + markup pricing model
- **Multi-level modules**: Platform, Agency, Client, and Site levels
- **Custom modules** can be requested by agencies

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 APPLICATION                       │
│  ┌──────────────┬─────────────────┬──────────────────────────┐  │
│  │  Dashboard   │  Visual Editor  │    Site Renderer         │  │
│  │  /dashboard  │  /editor        │    /site/[domain]        │  │
│  ├──────────────┼─────────────────┼──────────────────────────┤  │
│  │  Admin       │  Marketplace    │    Client Portal         │  │
│  │  /admin      │  /marketplace   │    /portal               │  │
│  └──────────────┴─────────────────┴──────────────────────────┘  │
│                              │                                   │
│                    Server Actions & API Routes                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                         SUPABASE
              (Database + Auth + Storage + Realtime)
                               │
                      EXTERNAL SERVICES
         (LemonSqueezy + Stripe + Claude AI + Resend + Vercel)
```

---

## 🗂️ Folder Structure

```
next-platform-dashboard/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth pages (login, signup)
│   │   ├── (dashboard)/          # Protected dashboard pages
│   │   │   ├── admin/            # Super Admin dashboard
│   │   │   │   ├── modules/      # Module management
│   │   │   │   ├── users/        # User management
│   │   │   │   ├── agencies/     # Agency management
│   │   │   │   ├── analytics/    # Platform analytics
│   │   │   │   ├── health/       # System health
│   │   │   │   └── settings/     # Platform settings
│   │   │   ├── clients/          # Client management
│   │   │   │   └── [clientId]/   # Client detail & modules
│   │   │   ├── sites/            # Sites management
│   │   │   │   ├── new/          # Create new site
│   │   │   │   └── [siteId]/     # Site detail & settings
│   │   │   ├── marketplace/      # Module marketplace
│   │   │   │   ├── installed/    # Installed modules
│   │   │   │   └── [moduleId]/   # Module detail
│   │   │   ├── modules/          # Agency module management
│   │   │   ├── settings/         # Agency settings
│   │   │   │   ├── profile/      # Profile settings
│   │   │   │   ├── agency/       # Agency settings
│   │   │   │   ├── billing/      # Billing settings
│   │   │   │   ├── team/         # Team management
│   │   │   │   ├── branding/     # White-label branding
│   │   │   │   ├── notifications/# Notification prefs
│   │   │   │   ├── security/     # Security settings
│   │   │   │   └── subscription/ # Subscription details
│   │   │   └── dashboard/        # Agency dashboard
│   │   ├── portal/               # Client Portal
│   │   │   ├── apps/             # Client's installed apps
│   │   │   ├── sites/            # Client's sites
│   │   │   └── support/          # Client support
│   │   ├── editor/               # Visual editor
│   │   │   └── [siteId]/         # Edit specific site
│   │   ├── preview/              # Site preview
│   │   ├── site/                 # Public site renderer
│   │   │   └── [domain]/         # Render by domain
│   │   ├── api/                  # API routes
│   │   │   ├── admin/            # Admin APIs
│   │   │   ├── modules/          # Module APIs
│   │   │   ├── ai/               # AI generation APIs
│   │   │   ├── billing/          # Billing APIs
│   │   │   ├── clients/          # Client APIs
│   │   │   ├── sites/            # Site APIs
│   │   │   └── webhooks/         # Webhook handlers
│   │   └── auth/                 # Auth callbacks
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI (shadcn/ui)
│   │   ├── admin/                # Super Admin components
│   │   ├── ai-builder/           # AI site builder
│   │   ├── billing/              # Billing components
│   │   ├── clients/              # Client management
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── editor/               # Visual editor
│   │   │   ├── settings/         # Component settings panels
│   │   │   ├── toolbar/          # Editor toolbar
│   │   │   └── user-components/  # Draggable components
│   │   ├── layout/               # Layout components
│   │   ├── modules/              # Module system UI
│   │   │   ├── admin/            # Admin module management
│   │   │   ├── agency/           # Agency module tools
│   │   │   ├── client/           # Client module views
│   │   │   ├── portal/           # Client portal module UI
│   │   │   ├── shared/           # Shared module components
│   │   │   └── site/             # Site module integration
│   │   ├── notifications/        # Notification system
│   │   ├── onboarding/           # Onboarding wizard
│   │   ├── pages/                # Page management
│   │   ├── portal/               # Client portal
│   │   ├── publishing/           # Site publishing
│   │   ├── renderer/             # Site renderer
│   │   ├── settings/             # Settings components
│   │   ├── shared/               # Shared components
│   │   └── sites/                # Site management
│   │
│   ├── lib/                      # Utilities & Services
│   │   ├── admin/                # Admin services
│   │   │   ├── admin-service.ts
│   │   │   ├── audit-service.ts
│   │   │   └── stats-service.ts
│   │   ├── ai/                   # AI generation
│   │   │   ├── config.ts
│   │   │   ├── converter.ts
│   │   │   ├── generate.ts
│   │   │   ├── prompts.ts
│   │   │   └── safety.ts
│   │   ├── auth/                 # Authentication utils
│   │   ├── modules/              # Module System V2
│   │   │   ├── v2.ts             # Central exports
│   │   │   ├── types/            # Module types
│   │   │   ├── context/          # React context
│   │   │   ├── hooks/            # Module hooks
│   │   │   ├── runtime/          # Module runtime
│   │   │   └── services/         # Module services
│   │   ├── payments/             # Payment providers
│   │   │   └── lemonsqueezy.ts   # LemonSqueezy integration
│   │   ├── publishing/           # Site publishing
│   │   ├── renderer/             # Site renderer utils
│   │   ├── stripe/               # Stripe utilities
│   │   ├── supabase/             # Supabase client & queries
│   │   └── utils.ts              # General utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-debounce.ts
│   │   ├── use-current-agency.ts
│   │   ├── use-modules.ts
│   │   ├── use-module-subscriptions.ts
│   │   ├── use-site-modules.ts
│   │   ├── use-ai-generation.ts
│   │   ├── use-editor-shortcuts.ts
│   │   └── use-auto-save.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── database.ts           # Database schema types
│   │   ├── modules.ts            # Module types
│   │   ├── roles.ts              # User roles & permissions
│   │   ├── billing.ts            # Billing types
│   │   ├── editor.ts             # Editor types
│   │   └── renderer.ts           # Renderer types
│   │
│   └── config/                   # Configuration
│       ├── constants.ts
│       ├── navigation.ts
│       └── plans.ts
│
├── migrations/                   # SQL migrations
├── scripts/                      # Utility scripts
│   ├── create-super-admin.ts
│   └── verify-deploy.ts
├── public/                       # Static assets
└── phases/                       # Phase documents
```

---

## 🎨 Design System

### Color Tokens (CSS Variables)

```css
:root {
  /* Brand Colors */
  --color-primary: 238 76% 68%;        /* Main brand purple */
  --color-secondary: 258 90% 66%;      /* Secondary purple */
  --color-accent: 330 81% 60%;         /* Pink accent */
  
  /* Semantic Colors */
  --color-success: 142 71% 45%;        /* Green */
  --color-warning: 38 92% 50%;         /* Orange */
  --color-danger: 0 84% 60%;           /* Red */
  
  /* Neutral Colors */
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-muted: 210 40% 96.1%;
  --color-muted-foreground: 215.4 16.3% 46.9%;
  --color-border: 214.3 31.8% 91.4%;
  
  /* Spacing Scale */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Typography Scale

```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
```

---

## 📊 Database Schema

### Core Tables

```sql
-- Profiles (Users)
profiles: id, email, name, full_name, avatar_url, role, agency_id, 
          job_title, onboarding_completed, created_at, updated_at

-- Agencies
agencies: id, name, slug, owner_id, plan, stripe_customer_id, 
          stripe_subscription_id, billing_email, white_label_enabled, 
          custom_branding, description, website, created_at, updated_at

-- Agency Members
agency_members: id, agency_id, user_id, role, permissions, 
                invited_at, accepted_at

-- Clients (Billable Seats)
clients: id, agency_id, name, email, company, phone, status, 
         seat_activated_at, seat_paused_at, stripe_subscription_item_id, 
         has_portal_access, portal_user_id, notes, tags, created_at, updated_at

-- Sites
sites: id, client_id, agency_id, name, subdomain, custom_domain, 
       published, published_at, settings, seo_title, seo_description, 
       seo_image, created_at, updated_at

-- Pages
pages: id, site_id, name, slug, is_homepage, seo_title, seo_description, 
       seo_image, sort_order, created_at, updated_at

-- Page Content (Craft.js JSON)
page_content: id, page_id, content, version, updated_at

-- Assets
assets: id, site_id, agency_id, name, file_name, url, storage_path, 
        mime_type, size, width, height, folder, alt_text, created_at

-- Templates
templates: id, name, description, thumbnail_url, content, category, 
           is_public, agency_id, created_by, created_at, updated_at
```

### Module System Tables (V2)

```sql
-- Modules V2 (Master definition - Super Admin controlled)
modules_v2: id, slug, name, description, long_description, icon, banner_image,
            category, tags, install_level ('platform'|'agency'|'client'|'site'),
            current_version, min_platform_version,
            -- Pricing (Wholesale)
            pricing_type ('free'|'one_time'|'monthly'|'yearly'),
            wholesale_price_monthly, wholesale_price_yearly, wholesale_price_one_time,
            suggested_retail_monthly, suggested_retail_yearly,
            -- LemonSqueezy Integration
            lemon_product_id, lemon_variant_monthly_id, lemon_variant_yearly_id,
            -- Stripe Integration (Legacy)
            stripe_product_id, stripe_price_monthly_id, stripe_price_yearly_id,
            -- Capabilities
            required_permissions[], provided_hooks[], package_url, package_hash,
            manifest, settings_schema, default_settings,
            -- Metadata
            author_name, author_verified, screenshots[], features[], requirements[],
            changelog, documentation_url, support_url,
            -- Stats
            install_count, rating_average, rating_count,
            -- Status
            status ('draft'|'review'|'active'|'deprecated'|'disabled'),
            is_featured, is_premium, created_by, created_at, updated_at, published_at

-- Agency Module Subscriptions (Agency subscribes at wholesale)
agency_module_subscriptions: id, agency_id, module_id, status, billing_cycle,
                             lemon_subscription_id, lemon_order_id, lemon_customer_id,
                             current_period_start, current_period_end, cancel_at_period_end,
                             stripe_subscription_id, stripe_subscription_item_id,
                             -- Markup Pricing
                             markup_type ('percentage'|'fixed'|'custom'|'passthrough'),
                             markup_percentage, markup_fixed_amount,
                             custom_price_monthly, custom_price_yearly,
                             retail_price_monthly_cached, retail_price_yearly_cached,
                             max_installations, current_installations,
                             created_at, updated_at

-- Agency Level Module Installations
agency_module_installations: id, agency_id, module_id, subscription_id,
                             is_enabled, settings, installed_at, installed_by, enabled_at

-- Client Level Module Installations (Client apps)
client_module_installations: id, client_id, module_id, agency_subscription_id,
                             billing_status, stripe_subscription_id, lemon_subscription_id,
                             price_paid, billing_cycle, current_period_start, current_period_end,
                             is_enabled, settings, installed_at, installed_by, enabled_at

-- Site Level Module Installations
site_module_installations: id, site_id, module_id, client_installation_id,
                          agency_subscription_id, is_enabled, settings,
                          installed_at, installed_by, enabled_at

-- Module Requests
module_requests: id, agency_id, title, description, use_case, target_audience,
                 suggested_install_level, suggested_category, priority, budget_range,
                 willing_to_fund, status, admin_notes, assigned_to,
                 resulting_module_id, upvotes, created_at, updated_at
```

### Legacy Module Tables (Still in use)

```sql
-- Modules (Legacy - being migrated to modules_v2)
modules: id, slug, name, description, long_description, icon, category,
         price_monthly, price_yearly, is_active, is_featured, features,
         screenshots, requirements, version, stripe_product_id,
         stripe_price_monthly, stripe_price_yearly, created_at, updated_at

-- Module Subscriptions (Legacy)
module_subscriptions: id, agency_id, module_id, status, billing_cycle,
                      current_period_start, current_period_end,
                      stripe_subscription_id, cancel_at_period_end,
                      created_at, updated_at

-- Site Modules (Legacy)
site_modules: id, site_id, module_id, settings, is_enabled, enabled_at
```

---

## 🔧 Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 16.x |
| Language | TypeScript | 5.x |
| React | React | 19.x |
| Styling | TailwindCSS | 4.x |
| UI Components | shadcn/ui | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Latest |
| Visual Editor | Craft.js | 0.2.x |
| Payments (Primary) | LemonSqueezy | 4.x |
| Payments (Legacy) | Stripe | 20.x |
| AI | Claude API (Anthropic) | Latest |
| AI SDK | Vercel AI SDK | 6.x |
| Email | Resend | Latest |
| State Management | Zustand | 5.x |
| Animations | Framer Motion | 12.x |
| Form Handling | React Hook Form | 7.x |
| Validation | Zod | 4.x |
| Date Handling | date-fns | 4.x |
| Hosting | Vercel | Latest |

---

## 👤 User Roles & Permissions

### Roles

```typescript
type UserRole = "super_admin" | "agency_owner" | "agency_admin" | "agency_member" | "client";

// Profile roles (simplified)
type ProfileRole = "super_admin" | "admin" | "member";

// Agency member roles
type AgencyRole = "owner" | "admin" | "member";
```

### Key Permissions

```typescript
const PERMISSIONS = {
  // Platform level (super_admin only)
  MANAGE_PLATFORM: "manage_platform",
  VIEW_ALL_AGENCIES: "view_all_agencies",
  IMPERSONATE_USERS: "impersonate_users",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  VIEW_PLATFORM_ANALYTICS: "view_platform_analytics",
  
  // Agency level
  MANAGE_AGENCY: "manage_agency",
  INVITE_TEAM_MEMBERS: "invite_team_members",
  MANAGE_TEAM_ROLES: "manage_team_roles",
  VIEW_BILLING: "view_billing",
  MANAGE_BILLING: "manage_billing",
  
  // Client level
  MANAGE_CLIENTS: "manage_clients",
  VIEW_CLIENTS: "view_clients",
  DELETE_CLIENTS: "delete_clients",
  
  // Site level
  CREATE_SITES: "create_sites",
  EDIT_SITES: "edit_sites",
  DELETE_SITES: "delete_sites",
  PUBLISH_SITES: "publish_sites",
  
  // Content level
  EDIT_CONTENT: "edit_content",
  VIEW_ANALYTICS: "view_analytics",
};
```

---

## 🔌 Module System V2

### Install Levels

```typescript
type ModuleInstallLevel = "platform" | "agency" | "client" | "site";

// Platform: Platform-wide tools (super admin only)
// Agency: Agency dashboard tools (CRM, invoicing, etc.)
// Client: Client apps (appear in client portal)
// Site: Website enhancements (SEO, analytics, forms)
```

### Pricing Model

```typescript
type PricingType = "free" | "one_time" | "monthly" | "yearly";
type MarkupType = "percentage" | "fixed" | "custom" | "passthrough";

// Flow: Platform sets wholesale → Agency sets markup → Client pays retail
// Example: $10 wholesale + 100% markup = $20 retail
```

### Key Module Types

```typescript
interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  install_level: ModuleInstallLevel;
  pricing_type: PricingType;
  wholesale_price_monthly: number; // in cents
  suggested_retail_monthly: number;
  status: "draft" | "review" | "active" | "deprecated" | "disabled";
  // ... more fields
}

interface AgencyModuleSubscription {
  id: string;
  agency_id: string;
  module_id: string;
  markup_type: MarkupType;
  markup_percentage: number;
  custom_price_monthly?: number;
  // ... more fields
}
```

---

## ⚠️ Development Rules

### MUST DO:
1. ✅ Use CSS variables for ALL colors (never hardcode)
2. ✅ Use TypeScript strict mode
3. ✅ Create reusable components in `/components/ui/`
4. ✅ Use server actions for mutations
5. ✅ Handle loading and error states
6. ✅ Write accessible HTML (ARIA labels, semantic tags)
7. ✅ Use the established folder structure
8. ✅ Reference this document at the start of each phase
9. ✅ Use LemonSqueezy for new billing integrations
10. ✅ Check user roles before admin operations

### MUST NOT:
1. ❌ Hardcode colors, spacing, or sizes
2. ❌ Skip TypeScript types
3. ❌ Create duplicate components
4. ❌ Use `any` type
5. ❌ Skip error handling
6. ❌ Ignore accessibility
7. ❌ Deviate from folder structure
8. ❌ Skip role verification for protected routes

---

## 🧩 Component Naming Convention

```
Button          → button.tsx
SiteCard        → site-card.tsx
ClientList      → client-list.tsx
EditorSidebar   → editor-sidebar.tsx
ModuleCard      → module-card.tsx
```

---

## 📝 File Naming Convention

```
Components:     kebab-case.tsx     (site-card.tsx)
Hooks:          use-kebab-case.ts  (use-sites.ts)
Utils:          kebab-case.ts      (format-date.ts)
Types:          kebab-case.ts      (database.ts)
API Routes:     route.ts           (app/api/sites/route.ts)
Server Actions: actions.ts         (lib/actions/sites.ts)
Services:       kebab-service.ts   (module-service.ts)
```

---

## 🔐 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LemonSqueezy (Primary billing)
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=

# Stripe (Legacy/backup)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 🛠️ npm Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm admin:create     # Create super admin user
pnpm admin:promote    # Promote user to super admin
```

---

## 📚 Phase Overview

### ✅ Completed Phases (1-57, 74-76A)

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Project Setup & Architecture | ✅ |
| 2 | Supabase Schema & Setup | ✅ |
| 3 | Design System & Tokens | ✅ |
| 4-6 | Core UI Components | ✅ |
| 7 | Authentication System | ✅ |
| 8 | First Deployment | ✅ |
| 9 | Dashboard Layout | ✅ |
| 10 | Foundation Checkpoint | ✅ |
| 11-12 | Client Management | ✅ |
| 13-14 | Site Management | ✅ |
| 15 | Page Management | ✅ |
| 16 | Dashboard Analytics | ✅ |
| 17-20 | Visual Editor Foundation | ✅ |
| 21-24 | Advanced Components & Settings | ✅ |
| 25-28 | AI Builder System | ✅ |
| 29-32 | Module Foundation | ✅ |
| 33-36 | Billing System | ✅ |
| 37-40 | Site Renderer | ✅ |
| 41-45 | Production & Launch | ✅ |
| 46-50 | Remediation & Overhaul | ✅ |
| 51-57 | Settings & Production Readiness | ✅ |
| 74 | Onboarding Wizard Complete | ✅ |
| 75 | Visual Editor Preview Fix | ✅ |
| 76 | Module Marketplace Complete | ✅ |
| 76A | Module System Architecture Overhaul | ✅ |

### ⬜ Not Implemented (58-73)

| Phase | Title | Status |
|-------|-------|--------|
| 58 | Client Management Pages | ⬜ Not Implemented |
| 59 | RLS Security Audit | ⬜ Not Implemented |
| 60 | Content Safety Filter | ⬜ Not Implemented |
| 61 | Rate Limiting System | ⬜ Not Implemented |
| 62 | Error Handling System | ⬜ Not Implemented |
| 63 | Site Cloning | ⬜ Not Implemented |
| 64 | Backup System | ⬜ Not Implemented |
| 65 | Export/Import | ⬜ Not Implemented |
| 66 | Mobile Editor Fix | ⬜ Not Implemented |
| 67 | AI Regeneration | ⬜ Not Implemented |
| 68 | Industry Templates UI | ⬜ Not Implemented |
| 69 | Activity Logging | ⬜ Not Implemented |
| 70 | Sitemap Generation | ⬜ Not Implemented |
| 71 | Email Notifications | ⬜ Not Implemented |
| 72 | Help Center | ⬜ Not Implemented |
| 73 | Keyboard Shortcuts | ⬜ Not Implemented |

### 🔄 In Progress / Pending Phases (76B1+)

| Phase | Title | Status | Priority |
|-------|-------|--------|----------|
| **76B1** | Module Admin Management UI | ⬜ Pending | 🔴 CRITICAL |
| **76B2** | Agency Marketplace & Pricing UI | ⬜ Pending | 🔴 CRITICAL |
| **76B3** | Client Portal Apps UI | ⬜ Pending | 🔴 CRITICAL |
| 77 | Site Publishing Complete | ⬜ Pending | 🟡 High |
| **78** | Super Admin Dashboard Complete | ⬜ Pending | 🔴 CRITICAL |
| 79 | Agency Module Markup Pricing | ⬜ Pending | 🟡 High |
| 80 | Module Development Studio | ⬜ Pending | 🟢 Medium |
| 81 | Media Library System | ⬜ Pending | 🟡 High |
| 82 | Form Submissions System | ⬜ Pending | 🟡 High |
| 83 | Blog System | ⬜ Pending | 🟢 Medium |
| 84 | SEO Dashboard | ⬜ Pending | 🟢 Medium |
| 85 | Client Portal Complete | ⬜ Pending | 🟡 High |

### Phase Dependencies

```
76A (Architecture) → 76B1 (Admin UI) → 76B2 (Agency UI) → 76B3 (Client Portal)
                                    ↘
                                      78 (Super Admin Dashboard)
                                    ↘
                                      79 (Agency Markup Pricing)
                                                    ↘
                                                      80 (Module Studio)
```

---

## 🔗 Key File Locations

### Module System V2
- Types: `src/lib/modules/types/`
- Services: `src/lib/modules/services/`
- Hooks: `src/lib/modules/hooks/`
- Runtime: `src/lib/modules/runtime/`
- Central Exports: `src/lib/modules/v2.ts`

### Admin System
- Services: `src/lib/admin/`
- Components: `src/components/admin/`
- Pages: `src/app/(dashboard)/admin/`

### Editor System
- Components: `src/components/editor/`
- User Components: `src/components/editor/user-components/`
- Settings Panels: `src/components/editor/settings/`

### Billing System
- LemonSqueezy: `src/lib/payments/lemonsqueezy.ts`
- Components: `src/components/billing/`

---

## 📋 Quick Reference

### Creating a Super Admin

```bash
pnpm admin:create your-email@example.com
```

### Module Installation Levels

| Level | Who Uses | Examples |
|-------|----------|----------|
| Platform | Super Admin | Platform analytics, system tools |
| Agency | Agency Team | CRM, invoicing, project management |
| Client | Client Portal | Booking apps, helpdesk, reporting |
| Site | Website | SEO, forms, analytics, chat widgets |

### Markup Pricing Examples

| Wholesale | Markup Type | Value | Retail Price |
|-----------|-------------|-------|--------------|
| $10/mo | percentage | 100% | $20/mo |
| $10/mo | fixed | $5 | $15/mo |
| $10/mo | custom | - | $25/mo (override) |
| $10/mo | passthrough | - | $10/mo (no markup) |

---

**Last Updated**: January 17, 2026


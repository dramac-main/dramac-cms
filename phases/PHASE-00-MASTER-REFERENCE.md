# 🎯 DRAMAC V2 - Master Reference Document

> **IMPORTANT**: This document must be referenced at the START of every phase to maintain consistency.

---

## 📋 Project Overview

**DRAMAC** is a B2B SaaS platform that enables agencies to build and manage websites for their clients using a visual editor and AI-powered tools.

### Business Model
- **Agencies** sign up FREE
- **Pay per client seat** ($19-29/month per active client)
- **Module marketplace** for additional features
- **Custom modules** can be built for specific clients

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 15 APPLICATION                       │
│  ┌──────────────┬─────────────────┬──────────────────────────┐  │
│  │  Dashboard   │  Visual Editor  │    Site Renderer         │  │
│  │  /dashboard  │  /editor        │    /sites/[domain]       │  │
│  └──────────────┴─────────────────┴──────────────────────────┘  │
│                              │                                   │
│                    Server Actions & API Routes                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                         SUPABASE
              (Database + Auth + Storage + Realtime)
                               │
                      EXTERNAL SERVICES
            (Stripe + Claude AI + Resend + Vercel)
```

---

## 🗂️ Folder Structure

```
dramac-v2/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth pages (login, signup)
│   │   ├── (dashboard)/          # Dashboard pages
│   │   │   ├── clients/          # Client management
│   │   │   ├── sites/            # Sites list
│   │   │   ├── modules/          # Module marketplace
│   │   │   ├── billing/          # Billing & invoices
│   │   │   └── settings/         # Agency settings
│   │   ├── editor/               # Visual editor
│   │   │   └── [siteId]/         # Edit specific site
│   │   ├── sites/                # Public site renderer
│   │   │   └── [domain]/         # Render by domain
│   │   ├── api/                  # API routes
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components (shadcn)
│   │   ├── dashboard/            # Dashboard-specific
│   │   ├── editor/               # Editor-specific
│   │   ├── renderer/             # Site renderer components
│   │   └── shared/               # Shared components
│   │
│   ├── modules/                  # Module system
│   │   ├── _registry.ts          # Module loader
│   │   ├── _types.ts             # Module types
│   │   ├── seo-optimizer/        # SEO module
│   │   ├── blog-writer/          # Blog module
│   │   └── [module-name]/        # Other modules
│   │
│   ├── lib/                      # Utilities
│   │   ├── supabase/             # Supabase client & queries
│   │   ├── stripe/               # Stripe utilities
│   │   ├── ai/                   # AI utilities
│   │   └── utils.ts              # General utilities
│   │
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   └── config/                   # Configuration
│
├── public/                       # Static assets
├── supabase/                     # Supabase migrations
│   └── migrations/               # SQL migrations
├── phases/                       # Phase documents (this folder)
└── package.json
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
-- Agencys (Agencies)
agencies: id, name, slug, owner_id, plan, stripe_customer_id, ...

-- Clients (Billable Seats)
clients: id, agency_id, name, email, status, seat_activated_at, ...

-- Sites
sites: id, client_id, agency_id, name, subdomain, custom_domain, ...

-- Pages
pages: id, site_id, name, slug, is_homepage, ...

-- Page Content (Craft.js JSON)
page_content: id, page_id, content, version, ...

-- Modules
modules: id, slug, name, price_monthly, is_public, ...

-- Agency Modules
organization_modules: id, agency_id, module_id, status, ...

-- Site Modules
site_modules: id, site_id, module_id, enabled, settings, ...
```

---

## 🔧 Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 15.x |
| Language | TypeScript | 5.x |
| Styling | TailwindCSS | 4.x |
| UI Components | shadcn/ui | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Latest |
| Visual Editor | Craft.js | Latest |
| Payments | Stripe | Latest |
| AI | Claude API (Anthropic) | Latest |
| Email | Resend | Latest |
| Hosting | Vercel | Latest |

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

### MUST NOT:
1. ❌ Hardcode colors, spacing, or sizes
2. ❌ Skip TypeScript types
3. ❌ Create duplicate components
4. ❌ Use `any` type
5. ❌ Skip error handling
6. ❌ Ignore accessibility
7. ❌ Deviate from folder structure

---

## 🧩 Component Naming Convention

```
Button          → button.tsx
SiteCard        → site-card.tsx
ClientList      → client-list.tsx
EditorSidebar   → editor-sidebar.tsx
```

---

## 📝 File Naming Convention

```
Components:     kebab-case.tsx     (site-card.tsx)
Hooks:          use-kebab-case.ts  (use-sites.ts)
Utils:          kebab-case.ts      (format-date.ts)
Types:          kebab-case.ts      (database.ts)
API Routes:     route.ts           (app/api/sites/route.ts)
Server Actions: actions.ts         (app/actions/sites.ts)
```

---

## 🔐 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
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

## 📚 Phase Overview

| Phase | Title | Model | Status |
|-------|-------|-------|--------|
| 1 | Project Setup & Architecture | Opus 4.5 | ⬜ |
| 2 | Supabase Schema & Setup | Opus 4.5 | ⬜ |
| 3 | Design System & Tokens | Sonnet 4.5 | ⬜ |
| 4-6 | Core UI Components | Sonnet 4.5 | ⬜ |
| 7 | Authentication System | Opus 4.5 | ⬜ |
| 8 | First Deployment | Sonnet 4.5 | ⬜ |
| 9-16 | Dashboard Features | Sonnet 4.5 | ⬜ |
| 17-24 | Visual Editor | Mixed | ⬜ |
| 25-32 | AI & Modules | Mixed | ⬜ |
| 33-38 | Site Renderer | Mixed | ⬜ |
| 39-42 | Billing System | Mixed | ⬜ |
| 43-45 | Production & Launch | Mixed | ⬜ |

---

**Last Updated**: January 13, 2026


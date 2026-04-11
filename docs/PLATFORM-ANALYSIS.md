# DRAMAC CMS Platform Analysis

**Last Updated**: April 11, 2026  
**Based On**: Codebase analysis (500+ components, 200+ lib files, 6 business modules)

---

## What Is DRAMAC CMS?

DRAMAC is an **enterprise-grade, multi-tenant SaaS platform** for digital agencies. It combines a visual website builder, module marketplace, and 6 built-in business modules into a single platform deployed at https://app.dramacagency.com.

### Core Value Proposition

- **For Agencies**: Manage clients, build AI-generated websites, install business modules, white-label everything
- **For Clients**: White-labeled portal to manage orders, bookings, contacts, support tickets
- **For Developers**: Build and sell modules via SDK, CLI, VS Code extension

---

## Technology Stack

| Category      | Technology                              | Version      |
| ------------- | --------------------------------------- | ------------ |
| Framework     | Next.js (App Router)                    | 16.1.1       |
| UI Library    | React                                   | 19.2.3       |
| Language      | TypeScript                              | 5.x (strict) |
| Database      | Supabase (PostgreSQL)                   | —            |
| Auth          | Supabase Auth + bcrypt (storefront)     | —            |
| Billing       | Paddle (Merchant of Record)             | —            |
| AI            | Claude Sonnet 4-6 / Haiku 4-5           | —            |
| UI Components | Radix UI + Tailwind CSS 4.x             | —            |
| State         | Zustand 5.0.10 + TanStack Query 5.90.16 | —            |
| Forms         | React Hook Form 7.71.0 + Zod 4.3.5      | —            |
| Rich Text     | TipTap 3.15.3                           | —            |
| Email         | Resend 6.7.0                            | —            |
| Animations    | Framer Motion 12.26.2                   | —            |
| Hosting       | Vercel (app) + Supabase (data)          | —            |

---

## Architecture

### Multi-Tenant Hierarchy

```
Platform (Super Admin)
  └── Agency (Organization)
        ├── Team Members (owner, admin, member + 32 permissions)
        ├── Clients → Client Portal (9 permission columns)
        ├── Sites → Pages, Blog, SEO, Forms, Modules, Storefront
        └── Module Subscriptions (via Paddle)
```

### Route Structure

```
src/app/
├── (auth)/           # Login, signup, forgot-password, onboarding
├── (dashboard)/      # Agency dashboard (all management)
├── portal/           # Client-facing business portal
├── (public)/         # Public site rendering, storefronts
├── studio/           # DRAMAC Studio visual editor
└── api/              # Webhooks, AI, modules, forms, public APIs
```

### Module Architecture

- **Per-module DB schemas** (`mod_<short_id>`) with isolated tables
- **Module API routes** with key management & rate limiting
- **3-tier auto-install**: CRM + Automation + Live Chat on every new site
- **Cross-module integration**: Automation engine receives 25+ event types from all modules
- **Customer context bridge**: AI responder enriched with CRM/ecommerce/booking data

---

## The 6 Business Modules

| Module           | Files | DB Tables | Key Features                                                    |
| ---------------- | ----- | --------- | --------------------------------------------------------------- |
| **CRM**          | 60+   | 13        | Contacts, companies, deals pipeline, activities, segmentation   |
| **Booking**      | 47    | 8         | Services, staff, calendar, 5-step wizard, reminders             |
| **E-Commerce**   | 130+  | 41+       | Products, cart, checkout, orders, quotes, inventory, marketing  |
| **Live Chat**    | 60+   | 9         | Conversations, AI auto-responder, canned responses, departments |
| **Social Media** | 45+   | —         | 5 platforms, scheduling, analytics, inbox, listening            |
| **Automation**   | 32    | —         | 27 workflows, ReactFlow canvas, 20 cross-module actions         |

---

## Key Systems

### DRAMAC Studio (Visual Page Builder)

- Custom iframe-based canvas (replaced Puck Feb 2026)
- @dnd-kit drag-and-drop, Zustand stores, zundo undo/redo
- 59+ premium components with mobile-first responsive system
- AI integration (per-component AI chat via Claude)
- Brand color inheritance (30+ semantic colors from 5 core brand colors)

### AI Website Designer

- Multi-step architecture (3 API endpoints, 60s each)
- Claude Sonnet 4-6 for architecture + page generation
- Industry detection → automatic module enablement
- Design token flow from user prompt to rendered components

### Client Portal

- 15 phases complete, 11+ route pages
- Module-aware navigation adapts to installed modules
- Orders, bookings, contacts, CRM, support tickets, analytics
- 9 DB permission columns for granular access control

### Billing (Paddle)

- Merchant of Record — handles tax, compliance
- Zambia payouts via Payoneer/Wise
- Hybrid pricing (subscription + usage overage)
- Dunning & recovery system
- LemonSqueezy deprecated (doesn't support Zambia)

---

## Codebase Scale

| Category              | Count                     |
| --------------------- | ------------------------- |
| React Components      | 500+ across 37 categories |
| Lib Files             | 200+ across 39 subsystems |
| Business Module Files | 300+ total                |
| Database Tables       | 76+                       |
| Server Actions        | 50+                       |
| API Routes            | 30+                       |
| Client Portal Routes  | 11+                       |
| Studio Components     | 59+ premium blocks        |

# 🎯 DRAMAC CMS Platform Analysis

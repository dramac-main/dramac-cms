# Project Brief: DRAMAC Enterprise Module Marketplace

**Project Name**: DRAMAC CMS  
**Vision**: Enterprise Module Marketplace Platform — Beyond GoHighLevel  
**Repository**: https://github.com/dramac-main/dramac-cms  
**Production URL**: https://app.dramacagency.com  
**Status**: Production-Ready (All Core Phases Complete)  
**Last Updated**: April 11, 2026

## Core Mission

DRAMAC is an **Enterprise Module Marketplace Platform** where:

1. Developers build ANY complex business application as a module
2. Agencies use modules to run their operations and manage clients
3. Modules can be purchased, white-labeled, and resold to clients
4. Clients access their sites and modules via a dedicated portal
5. Modules work seamlessly on ANY website (on or off platform via embeds)

## The Competitive Edge

### vs. GoHighLevel

- **GoHighLevel**: Fixed set of tools (CRM, Email, SMS, Funnels)
- **DRAMAC**: Infinite module possibilities — build ANY business application

### Our Advantages

- ✅ True marketplace with third-party developer ecosystem
- ✅ Custom module requests convert to marketplace products
- ✅ Universal connectivity — embed modules anywhere (iframe, SDK, API)
- ✅ Code ownership — build in VS Code with SDK, upload to platform
- ✅ White-label everything — agencies rebrand for their clients
- ✅ 6 built-in business modules (CRM, Booking, E-Commerce, Live Chat, Social Media, Automation)
- ✅ AI-powered website builder (DRAMAC Studio) with Claude integration
- ✅ Multi-tenant architecture with granular permissions

## Module Types

1. **Widgets** (Tier 1) — Simple embeddable UI components (chat widget, analytics badge)
2. **Apps** (Tier 2) — Multi-page applications with database (CRM, booking)
3. **Integrations** (Tier 3) — Third-party API connectors (Stripe, QuickBooks)
4. **Full Systems** (Tier 4) — Enterprise applications (Hotel POS, Restaurant)
5. **Custom Solutions** (Tier 5) — Client-specific bespoke builds

## Implementation Status — ALL CORE WAVES COMPLETE ✅

### Wave 1: Core Platform Infrastructure ✅ 100%

- EM-01: Module Lifecycle Management ✅
- EM-05: Naming Conventions ✅
- EM-10: Type System ✅
- EM-11: Database Per Module ✅
- EM-12: API Gateway ✅
- EM-13: Authentication ✅

### Wave 2: Developer Tools ✅ 100%

- EM-20: VS Code SDK & Extension ✅
- EM-21: CLI Tools (`dramac-cli`) ✅
- EM-22: Module Templates ✅
- EM-23: AI Module Builder ✅

### Wave 3: Distribution ✅ Complete

- EM-02: Marketplace Enhancement ✅
- EM-03: Analytics Foundation ✅
- EM-30: Universal Embed ✅
- EM-31: External Integration ✅
- EM-32: Custom Domains (deferred — optional)
- EM-33: API-Only Mode (deferred — optional)

### Wave 4: Enterprise ✅ Core Complete

- EM-40: Multi-Tenant ✅
- EM-41: Versioning & Rollback (DB schema ready)
- EM-42: Marketplace V2 ✅
- EM-43: Revenue Dashboard (DB schema ready)

### Wave 5: Business Modules ✅ ALL 6 COMPLETE

- EM-50: CRM Module ✅
- EM-51: Booking Module ✅
- EM-52: E-Commerce Module ✅ (22 sub-phases)
- EM-53: Live Chat Module ✅
- EM-54: Social Media Module ✅
- EM-57: Automation Module ✅ (27 system workflows, ReactFlow canvas)
- EM-58: AI Agents System ✅

### Additional Completed Systems

- EM-59: Paddle Billing ✅
- Domain & Email Registration (ResellerClub + Cloudflare DNS) ✅
- Client Portal (15 phases, full business operations center) ✅
- DRAMAC Studio Visual Builder (31 phases) ✅
- Blog CMS System ✅
- Agency Support Ticket System ✅
- Storefront Customer Auth (bcrypt-based, multi-tenant) ✅
- Quote Portal with Email Verification Gate ✅

### Wave 6: Industry Verticals — Planned (DB schemas ready)

- EM-60 through EM-65: Hotel, Restaurant, Healthcare, Real Estate, Gym, Salon

## Key Architecture Decisions

1. **Database**: PostgreSQL via Supabase — schema-per-module isolation, RLS policies
2. **API Style**: Server Actions (primary) + API Routes (webhooks, external APIs)
3. **Auth**: Supabase Auth (dashboard) + bcrypt custom auth (storefront, multi-tenant safe)
4. **Billing**: Paddle (Merchant of Record) — supports Zambia payouts via Payoneer/Wise
5. **Hosting**: Vercel (frontend) + Supabase (database, auth, storage)
6. **AI**: Claude Sonnet 4-6 (primary), Claude Haiku 4-5 (fast tasks) via Anthropic SDK
7. **Email**: Resend (transactional + Supabase Auth SMTP)
8. **Locale**: Zambia-first (ZMW currency, Africa/Lusaka timezone, 16% VAT)
9. **Embedding**: iframe + SDK + API; universal embed tokens with CORS
10. **Editor**: DRAMAC Studio — custom iframe-based canvas, Zustand state, @dnd-kit drag-and-drop

## Constraints

- **Budget**: Self-funded, optimize for efficiency
- **Timeline**: Iterative delivery, revenue-generating features first
- **Resources**: Solo/small team development
- **Technology**: Next.js 16 / React 19 / Supabase / TypeScript strict
- **Scalability**: Architecture supports 1000+ modules
- **Deployment**: Vercel with 60s function timeout; multi-step AI pattern for long operations

## Project Structure

```
dramac-cms/
├── memory-bank/                    # AI context files (this directory)
├── docs/                           # Platform reference documentation
├── phases/                         # Phase planning documents (historical reference)
├── packages/                       # Developer ecosystem
│   ├── dramac-cli/                # CLI tool (npm: dramac-cli)
│   ├── sdk/                       # Module SDK (npm: @dramac/sdk)
│   ├── vscode-extension/          # VS Code extension (dramac.dramac-modules)
│   └── test-modules/              # Test harness with sample CRM module
└── next-platform-dashboard/        # Main application
    └── src/
        ├── app/                   # Next.js 16 App Router
        ├── components/            # 500+ React components
        ├── lib/                   # Services, actions, hooks, utilities
        ├── modules/               # 6 business module implementations
        ├── types/                 # TypeScript type definitions
        └── config/                # App configuration constants
```

# Project Brief: DRAMAC Enterprise Module Marketplace

**Project Name**: DRAMAC CMS  
**Vision**: Enterprise Module Marketplace Platform - Beyond GoHighLevel  
**Repository**: https://github.com/dramac-main/dramac-cms  
**Status**: Active Development  
**Last Updated**: January 23, 2026

## Core Mission

Transform DRAMAC from a website builder into an **Enterprise Module Marketplace Platform** where:

1. Developers build ANY complex business application as a module
2. Agencies use modules to run their operations
3. Modules can be purchased, white-labeled, and resold
4. Clients can request custom modules that become products
5. Modules work seamlessly on ANY website (on or off platform)

## The Competitive Edge

### vs. GoHighLevel

- **GoHighLevel**: Fixed set of tools (CRM, Email, SMS, Funnels)
- **DRAMAC**: Infinite module possibilities - build ANY business application

### Our Advantages

- ✅ True marketplace with third-party developers
- ✅ Custom module requests convert to products
- ✅ Universal connectivity - embed anywhere
- ✅ Code ownership - build in VS Code, upload to platform
- ✅ White-label everything

## Module Types

1. **Widgets** (Tier 1) - Simple embeddable UI components (chat, analytics)
2. **Apps** (Tier 2) - Multi-page applications with database (CRM, booking)
3. **Integrations** (Tier 3) - Third-party API connectors (Stripe, QuickBooks)
4. **Full Systems** (Tier 4) - Enterprise applications (Hotel POS, Restaurant)
5. **Custom Solutions** (Tier 5) - Client-specific builds

## Core Requirements

### Technical Foundation

- Multi-tenant architecture (Agency → Client → Site → User)
- Database-per-module isolation
- Module lifecycle: Create → Deploy → Install → Render
- Universal embedding system (iframe, SDK, API-only)
- Role-based access control
- Module versioning and rollback

### Business Requirements

- Marketplace with discovery, search, and ratings
- Revenue sharing model (70/30 Developer/Platform)
- White-label capabilities
- Module analytics and monitoring
- Developer tools (VS Code SDK, CLI)

### User Experience Goals

- Drag-and-drop module installation
- Visual website builder integration
- One-click module deployment
- Seamless embedding on external sites
- Client portal for end-users

## Success Metrics

1. **Module Creation Time** - How fast can developers build?
2. **Time to First Install** - How quickly can agencies adopt?
3. **Module Reliability** - Uptime and error rates
4. **Revenue per Module** - Average monthly revenue
5. **Agency Adoption** - Percentage using modules
6. **Client Satisfaction** - NPS scores

## Implementation Phases

### Wave 1: Core Platform (6 phases) - ✅ COMPLETE

- EM-01: Module Lifecycle ✅ **COMPLETE**
- EM-02: Marketplace Enhancement ✅ **COMPLETE**
- EM-05: Naming Conventions ✅ **COMPLETE**
- EM-10: Type System ✅ **COMPLETE**
- EM-11: Database Per Module ✅ **COMPLETE**
- EM-12: API Gateway ✅ **COMPLETE**
- EM-13: Authentication ✅ **COMPLETE**

### Wave 2: Developer Tools (4 phases) - ✅ 100% COMPLETE

- EM-20: VS Code SDK ✅ **COMPLETE**
- EM-21: CLI Tools ✅ **COMPLETE**
- EM-22: Module Templates ✅ **COMPLETE**
- EM-23: AI Module Builder ✅ **COMPLETE**

### Wave 3: Distribution (6 phases) - ✅ 67% COMPLETE

- EM-02: Marketplace Enhancement ✅ **COMPLETE**
- EM-03: Analytics Foundation ✅ **COMPLETE**
- EM-30: Universal Embed ✅ **COMPLETE**
- EM-31: External Integration ✅ **COMPLETE**
- EM-32: Custom Domains ⬜ OPTIONAL
- EM-33: API-Only Mode ⬜ OPTIONAL

### Wave 4: Enterprise (4 phases) - Medium Priority

- EM-40: Multi-Tenant
- EM-41: Versioning & Rollback
- EM-42: Marketplace V2
- EM-43: Revenue Dashboard

### Wave 5: Business Modules (7 phases) - MONEY MAKERS

- EM-50: CRM Module
- EM-51: Booking Module
- EM-52: E-Commerce Module
- EM-53: Live Chat Module
- EM-54: Social Media Module
- EM-55: Accounting Module
- EM-56: HR/Team Module

### Wave 6: Industry Verticals (6 phases) - Niche Markets

- EM-60: Hotel Management
- EM-61: Restaurant POS
- EM-62: Healthcare
- EM-63: Real Estate
- EM-64: Gym/Fitness
- EM-65: Salon/Spa

## Constraints

- **Budget**: Self-funded, optimize for efficiency
- **Timeline**: Iterative delivery, prioritize revenue-generating features
- **Resources**: Solo/small team development
- **Technology**: Must work within Next.js/React/Supabase ecosystem
- **Scalability**: Architecture must support 1000+ modules

## Out of Scope

- Mobile native apps (web-first approach)
- Blockchain/crypto integrations (for now)
- AI code generation (in EM-23, optional)
- Real-time collaboration (unless module-specific)

## Key Decisions

1. **Database Architecture**: Schema-per-module for isolation
2. **API Style**: REST + Server Actions (Next.js 15)
3. **Auth System**: Supabase Auth with RLS policies
4. **Billing**: LemonSqueezy integration
5. **Hosting**: Vercel for platform, Supabase for data
6. **Module Format**: JSON/ZIP packages with TypeScript
7. **Embedding**: iframe + SDK approach

## References

### Phase Documentation

- Master Vision: `phases/enterprise-modules/PHASE-EM-00-MASTER-VISION.md`
- Implementation Order: `phases/enterprise-modules/IMPLEMENTATION-ORDER.md`
- All Phase Documents: `phases/enterprise-modules/PHASE-EM-*.md`

### Platform Documentation

- Status: `STATUS.md` (root level for quick access)
- Architecture: `docs/PLATFORM-ANALYSIS.md`
- Implementation Summary: `docs/IMPLEMENTATION-COMPLETE.md`
- Quick Reference: `docs/QUICK-REFERENCE.md`
- Documentation Index: `docs/README.md`

### Dashboard Documentation

- Deployment Guide: `next-platform-dashboard/docs/HOW-TO-DEPLOY-MODULE-TO-BETA.md`
- Testing Guides: `next-platform-dashboard/docs/PHASE-*-TESTING-*.md`
- Setup Guides: `next-platform-dashboard/docs/*-SETUP.md`

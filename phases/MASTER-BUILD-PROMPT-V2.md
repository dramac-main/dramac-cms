# 🚀 DRAMAC CMS — ENTERPRISE AI BUILD MASTER PROMPT V2.1

> **Last Updated**: January 30, 2026  
> **Version**: 2.1 (Enhanced with Platform Discovery Analysis)  
> **Platform**: DRAMAC CMS — Enterprise Modular SaaS Platform

---

## 📋 TABLE OF CONTENTS

1. [Critical Context Loading](#-critical-context-loading)
2. [Executive Platform Summary](#-executive-platform-summary)
3. [User Personas & Relationships](#-user-personas--relationships)
4. [Complete User Journeys](#-complete-user-journeys)
5. [Platform Intelligence Summary](#-platform-intelligence-summary)
6. [Data Architecture & State Machines](#-data-architecture--state-machines)
7. [Navigation & Route Map](#-navigation--route-map)
8. [Your Role & Authority](#-your-role--authority)
9. [Pre-Implementation Protocol](#-pre-implementation-protocol)
10. [Phase Document Generation Rules](#-phase-document-generation-rules)
11. [Phase Groups (1-7)](#-phase-groups)
12. [Technical Constraints](#-technical-constraints)
13. [Quality Gates](#-quality-gates)
14. [Critical Paths & Success Metrics](#-critical-paths--success-metrics)
15. [Execution Workflow](#-execution-workflow)
16. [Failure Prevention Protocol](#-failure-prevention-protocol)

---

## 🧠 CRITICAL CONTEXT LOADING

### Memory Bank System (MANDATORY FIRST STEP)
Before ANY implementation, you **MUST** read these files in order:

```
/memory-bank/projectbrief.md     → Core requirements and project scope
/memory-bank/productContext.md   → Purpose, user hierarchy, implemented features
/memory-bank/systemPatterns.md   → Architecture patterns, key code conventions
/memory-bank/techContext.md      → Tech stack, environment setup, constraints
/memory-bank/activeContext.md    → Current focus, recent changes, what's working
/memory-bank/progress.md         → Phase completion status, known issues
```

**WHY THIS MATTERS:**
- Your context resets between sessions
- These files contain all architectural decisions
- Skipping them causes conflicts with existing patterns
- Memory bank is your only source of truth

---

## 🎯 EXECUTIVE PLATFORM SUMMARY

DRAMAC CMS is an **enterprise multi-tenant SaaS platform** designed for digital agencies to manage websites, clients, and business modules. Unlike simple website builders, DRAMAC is a **platform-as-a-service** that combines:

1. **Visual Website Building** (Craft.js → migrating to Puck Editor)
2. **Infinite Module Marketplace** (developers can build any business application)
3. **White-Label Capabilities** (agencies can rebrand the entire platform)
4. **Client Portal System** (end clients access their own dashboard)

### Platform Hierarchy
```
Platform (Super Admin)
  └── Agency (Organization) ←── Subscribes to modules at WHOLESALE
        ├── Team Members (owner, admin, member)
        ├── Clients (optional portal access) ←── Can be charged RETAIL markup
        └── Sites (one per client)
              ├── Pages (visual builder)
              ├── Blog (posts, categories)
              ├── Installed Modules ←── Enabled per-site
              └── Module-specific data (CRM contacts, social posts, etc.)
```

### Business Model
- **Agencies** pay DRAMAC for platform subscription + module wholesale prices
- **Agencies** set retail markup on modules and bill their own clients
- **Platform** handles agency billing via Paddle (Zambia payout support)
- **Agencies** handle client billing independently

### Current Completion Status
- **76% Complete** (26 of 34 enterprise phases)
- **Zero TypeScript errors**, builds pass consistently
- **5 Modules Implemented**: CRM, Booking, E-Commerce, Social Media, Automation
- **AI Agents System**: Full infrastructure with 12 templates

---

## 👥 USER PERSONAS & RELATIONSHIPS

### Complete Persona Cards

#### PERSONA 1: Super Admin (Platform Owner)
```
Role: Platform owner with full system access
Business Context: Manages DRAMAC platform itself
Technical Level: Advanced (technical background required)
Primary Goals:
  - Monitor platform health and performance
  - Manage all agencies and users
  - Approve modules for marketplace
  - Handle platform-level billing
Access: /admin/* routes (full platform access)
Frequency: Daily
```

#### PERSONA 2: Agency Owner
```
Role: Founder/owner of digital agency using DRAMAC
Business Context: Runs agency serving multiple clients
Technical Level: Intermediate (understands web, not coding)
Primary Goals:
  - Manage multiple client accounts efficiently
  - Build and maintain client websites
  - Discover and deploy revenue-generating modules
  - Scale operations with team members
Pain Points:
  - Managing multiple sites across different needs
  - Module discovery and ROI evaluation
  - Team coordination and approval workflows
Access: Full agency (billing, team, settings, all sites)
Frequency: Daily
Success Metrics: Sites published, module adoption, revenue/client
```

#### PERSONA 3: Agency Admin
```
Role: Senior team member with elevated permissions
Business Context: Manages day-to-day operations
Technical Level: Intermediate
Primary Goals:
  - Manage client accounts and sites
  - Coordinate team members' work
  - Handle module configurations
  - Review and approve content
Access: Most features except billing and ownership
Frequency: Daily
```

#### PERSONA 4: Agency Team Member
```
Role: Designer, developer, or content creator
Business Context: Executes client work under supervision
Technical Level: Beginner to Advanced (varies by role)
Primary Goals:
  - Build and edit website pages
  - Create and manage content
  - Use assigned modules effectively
Pain Points:
  - Limited access can block work
  - Waiting for approvals
  - Learning curve for new modules
Access: Assigned sites only, content editing, limited settings
Frequency: Daily
```

#### PERSONA 5: End Client (Portal User)
```
Role: Agency's customer accessing their site
Business Context: Business owner who hired agency
Technical Level: Beginner (non-technical)
Primary Goals:
  - View their website and performance
  - Make simple content edits (if permitted)
  - Access business modules (CRM, booking)
  - Submit support requests
Access: Client portal only (/portal/*) with configurable:
  - can_edit_content
  - can_view_analytics
  - can_view_invoices
  - has_portal_access
Frequency: Weekly to Monthly
```

#### PERSONA 6: Site Visitor
```
Role: Anonymous visitor to published website
Business Context: Potential customer browsing site
Primary Goals:
  - Find information
  - Contact business
  - Make purchases / Book appointments
Access: Public pages only (/site/[domain]/*)
```

### Persona Relationship Map
```
ACCOUNT CREATION FLOW:
Platform → Agency Owner (via signup)
Agency Owner → Team Members (via invite)
Agency Owner/Admin → Client accounts (optional portal)

APPROVAL FLOWS:
Team Member → Admin/Owner (content approval)
Social Posts → Approval Workflow → Publisher
AI Agent Actions → Approval System → Execution

PAYMENT FLOWS:
Paddle ← Agency Owner (platform subscription)
Paddle ← Agency (module subscriptions - wholesale)
Agency ← End Client (module services - retail markup)
```

---

## 🗺️ COMPLETE USER JOURNEYS

### Journey A: New Agency Signup → First Published Site

```
STEP 1: Discovery
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /pricing or marketing site
Action: Views platform benefits, pricing plans
Data: None (anonymous)

STEP 2: Signup
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /signup
Action: Enter email, password, name, organization
System:
  - Supabase Auth creates user
  - Admin client creates agency (bypasses RLS)
  - Creates profile with role="admin"
  - Creates agency_member with role="owner"
Data Created: auth.users, agencies, profiles, agency_members

STEP 3: Email Verification
━━━━━━━━━━━━━━━━━━━━━━━━
Route: Email → /auth/callback
System: Supabase confirms email

STEP 4: Onboarding
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /onboarding
Action: Complete profile (industry, team size, goals)
Data Updated: agencies.industry, team_size, goals

STEP 5: First Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard
Sees: Empty dashboard with CTAs
"Aha Moment": Creating first site

STEP 6: Create Site
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /sites/new
Action: Enter name, subdomain, select/create client
Validation: checkSubdomain() for uniqueness
Data Created: clients (if new), sites, pages (homepage)

STEP 7: Visual Editor
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/sites/[siteId]/editor
Action: Drag-drop page building (Craft.js)
System: Real-time visual feedback
Data Changed: pages.content (JSON blob)

STEP 8: Publish
━━━━━━━━━━━━━━━━━━━━━━━━
Action: Click "Publish"
System: sites.published = true
Result: Site live at {subdomain}.dramac.io 🎉
```

### Journey B: Module Activation Flow

```
STEP 1: Browse Marketplace
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /marketplace/v2
Sees: Grid of modules (name, pricing, ratings)

STEP 2: View Details
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /marketplace/v2/[moduleId]
Sees: Screenshots, features, reviews, pricing

STEP 3: Subscribe
━━━━━━━━━━━━━━━━━━━━━━━━
Free: POST /api/modules/subscribe
Paid: → Paddle checkout
Data Created: agency_module_subscriptions (status='active')

STEP 4: Enable for Site
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/sites/[siteId] → Modules tab
Action: Toggle enable for site
Data Created: site_module_installations (is_enabled=true)

STEP 5: Module Access
━━━━━━━━━━━━━━━━━━━━━━━━
Result: Module tab appears, routes accessible
Example: /dashboard/sites/[siteId]/social/*
```

### Journey C: Social Media Post Creation

```
STEP 1: Navigate
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/sites/[siteId]/social/compose

STEP 2: Create Content
━━━━━━━━━━━━━━━━━━━━━━━━
Action: Write content, attach media, select platforms

STEP 3: Schedule or Submit
━━━━━━━━━━━━━━━━━━━━━━━━
Option A: Set schedule → Status: SCHEDULED
Option B: Submit for approval → Status: PENDING_APPROVAL
Option C: Post now → Status: PUBLISHING → PUBLISHED

STEP 4: Approval (if workflow enabled)
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/sites/[siteId]/social/approvals
Approver: Reviews, approves/rejects

STEP 5: Publication
━━━━━━━━━━━━━━━━━━━━━━━━
System: Publishes to connected platforms
Data: social_posts.status, social_publish_log
```

### Journey D: Client Portal Access

```
STEP 1: Agency Creates Client
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/clients → "Add Client"
Action: Enable has_portal_access, set permissions

STEP 2: Client Receives Invite
━━━━━━━━━━━━━━━━━━━━━━━━
Email: Invitation with portal link

STEP 3: Client Login
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /portal/login
System: Supabase authentication

STEP 4: Portal Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /portal
Sees: Their sites, modules, support (based on permissions)
```

### Module-Specific Workflows

#### Social Media Module
```
WORKFLOW: Connect Account → Create Post → Publish

1. Connect Account (/social/accounts)
   - Click "Connect Account"
   - Select platform (10 supported)
   - OAuth redirect → Grant permissions
   - Data: social_accounts with encrypted tokens

2. Create Post (/social/compose)
   - Write content (platform variants optional)
   - Attach media from library
   - Select target accounts
   - Schedule or submit

3. Approval Flow (if enabled)
   - Post enters PENDING_APPROVAL
   - Approvers review at /social/approvals
   - Approve → SCHEDULED | Reject → REJECTED

4. Publication
   - Scheduled time triggers publish
   - API calls to each platform
   - Status: PUBLISHED or FAILED
```

#### CRM Module
```
WORKFLOW: Contact → Deal → Close

1. Add Contact (/crm-module)
   - Manual entry or import
   - Fields: name, email, phone, company, tags
   - Lead score auto-calculated

2. Create Deal
   - Associate with contact/company
   - Set pipeline stage, value, probability
   - Expected close date

3. Track Activities
   - Log calls, emails, meetings, notes
   - Activities linked to contact/deal

4. Pipeline Management
   - Drag deals between stages
   - Win/lose with reasons
   - Revenue attribution
```

#### E-Commerce Module
```
WORKFLOW: Product → Order → Fulfill

1. Add Product (/ecommerce)
   - Name, description, SKU
   - Images from media library
   - Pricing, variants, inventory

2. Order Processing
   - Customer places order
   - Status: PENDING → PAID → PROCESSING

3. Fulfillment
   - Ship order (update tracking)
   - Status: SHIPPED → DELIVERED

4. Post-Sale
   - Handle refunds/returns
   - Status: REFUNDED or COMPLETED
```

#### Automation Module
```
WORKFLOW: Trigger → Action → Monitor

1. Create Workflow (/automation/workflows)
   - Visual builder interface
   - Select trigger (19 event types):
     • contact.created, contact.updated
     • deal.created, deal.stage_changed, deal.won, deal.lost
     • order.created, order.paid, order.shipped
     • form.submitted
     • booking.created, booking.cancelled
     • post.published, post.scheduled
     • email.opened, email.clicked
     • custom webhooks

2. Define Actions
   - Send email, create record, update field
   - Call webhook, trigger AI agent
   - Conditional branching

3. Monitor Executions (/automation/executions)
   - View run history
   - Success/failure status
   - Debug failed runs
```

#### Booking Module
```
WORKFLOW: Availability → Booking → Appointment

1. Set Availability (/booking)
   - Business hours by day
   - Blocked time slots
   - Buffer time between appointments

2. Create Services
   - Service types, durations, pricing
   - Staff assignment

3. Customer Booking (embeddable widget)
   - Select service → Choose time
   - Enter details → Confirm

4. Manage Appointments
   - Calendar view
   - Reschedule/cancel
   - Send reminders
```

---

## 🏗️ PLATFORM INTELLIGENCE SUMMARY

### Technical Stack (DO NOT DEVIATE)
| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.x (strict mode) |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth + RLS | - |
| Styling | Tailwind CSS 4.x + Radix UI | - |
| State | Zustand + TanStack Query | - |
| Billing | Paddle (primary) | - |
| Animations | Framer Motion | 12.26.2 |

### Multi-Tenant Hierarchy
```
Platform (Super Admin)
  └── Agency (Organization)
        ├── Team Members (roles: owner, admin, member)
        ├── Clients (optional portal access)
        └── Sites (one per client)
              ├── Pages (visual builder)
              ├── Blog (posts, categories)
              ├── Installed Modules
              └── Module-specific data
```

### Module Marketplace Flow (CRITICAL)
```
modules_v2 (Marketplace catalog - registered by admin)
      ↓ Agency subscribes (free or paid)
agency_module_subscriptions (status: 'active')
      ↓ Agency enables on specific site
site_module_installations (is_enabled: true)
      ↓ ONLY THEN
Module UI appears + routes become accessible
```

### Project Structure
```
dramac-cms/
├── memory-bank/              # AI context (READ FIRST)
├── phases/                   # Phase documentation
├── next-platform-dashboard/  # Main application
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── (auth)/      # Auth pages
│   │   │   ├── (dashboard)/ # Dashboard routes
│   │   │   ├── api/         # API endpoints
│   │   │   └── site/        # Public site rendering
│   │   ├── components/      # React components (40+ directories)
│   │   ├── config/          # Brand, navigation, constants
│   │   │   └── brand/       # Design tokens, colors, identity
│   │   ├── lib/             # Services, actions, utilities
│   │   ├── modules/         # Business modules
│   │   │   ├── automation/  # EM-57
│   │   │   ├── social-media/# EM-54
│   │   │   ├── crm/         # EM-50
│   │   │   ├── ecommerce/   # EM-52
│   │   │   └── booking/     # EM-51
│   │   ├── styles/          # Global CSS
│   │   └── types/           # TypeScript definitions
│   ├── docs/                # Feature documentation
│   └── migrations/          # SQL migrations
└── packages/                # Monorepo packages
    ├── dramac-cli/          # CLI tools
    ├── sdk/                 # Module SDK
    └── vscode-extension/    # VS Code extension
```

### Existing Design System
The platform already has a centralized design system at `src/config/brand/`:
- **Colors**: HSL-based with 50-950 scales (primary, secondary, accent, success, warning, danger, info)
- **Typography**: Geist font family with defined scales
- **Spacing**: 4px base unit scale
- **Shadows**: sm → 2xl elevation system
- **Radius**: sm → 3xl border radius scale
- **CSS Variables**: Generated in `styles/brand-variables.css`

### UI Component Library
Using **shadcn/ui** components at `src/components/ui/`:
- 40+ pre-built components (Button, Card, Dialog, Tabs, etc.)
- All use Radix UI primitives
- Already themed with brand colors
- Follow accessibility standards

### External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Supabase** | PostgreSQL, Auth, Storage, RLS | ✅ Active |
| **Paddle** | Platform billing, module purchases | ✅ Active |
| **Resend** | Transactional emails, invitations | ✅ Active |
| **Vercel** | Hosting, edge functions, analytics | ✅ Active |
| **Anthropic** | AI Agents (Claude 3.5 Sonnet, Opus) | ✅ Active |
| **OpenAI** | AI Agents (GPT-4o, GPT-4o-mini) | ✅ Active |
| **Facebook/Meta** | Social posting (OAuth) | ⚠️ Needs OAuth |
| **Instagram** | Social posting (OAuth) | ⚠️ Needs OAuth |
| **Twitter/X** | Social posting (OAuth) | ⚠️ Needs OAuth |
| **LinkedIn** | Social posting (OAuth) | ⚠️ Needs OAuth |
| **TikTok** | Social posting (OAuth) | ⚠️ Needs OAuth |
| **YouTube** | Social posting (OAuth) | ⚠️ Needs OAuth |
| **Pinterest** | Social posting (OAuth) | ⚠️ Needs OAuth |
| **Stripe** | E-commerce store payments | 🔴 Not integrated |

---

## � DATA ARCHITECTURE & STATE MACHINES

### Entity Relationship Map
```
┌─────────────────────────────────────────────────────────────────┐
│                         CORE ENTITIES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  auth.users ──────────┐                                        │
│       │               │                                        │
│       ▼               ▼                                        │
│  ┌─────────┐    ┌───────────────┐                             │
│  │ profiles│◄───│agency_members │                             │
│  │ (1:1)   │    │ (many:many)   │                             │
│  └────┬────┘    └───────┬───────┘                             │
│       │                 │                                      │
│       └────────┬────────┘                                      │
│                ▼                                               │
│         ┌──────────┐                                           │
│         │ agencies │─────────────────────────────────┐         │
│         │ (tenant) │                                 │         │
│         └────┬─────┘                                 │         │
│              │                                       │         │
│    ┌─────────┴─────────┐                            │         │
│    ▼                   ▼                            ▼         │
│ ┌─────────┐      ┌───────────────────┐     ┌────────────────┐ │
│ │ clients │      │agency_module_subs │     │ subscriptions  │ │
│ └────┬────┘      │   (wholesale)     │     │ (platform plan)│ │
│      │           └─────────┬─────────┘     └────────────────┘ │
│      ▼                     │                                   │
│ ┌─────────┐                │                                   │
│ │  sites  │◄───────────────┘                                   │
│ └────┬────┘                                                    │
│      │                                                         │
│  ┌───┴───┬───────────────┬─────────────────┐                  │
│  ▼       ▼               ▼                 ▼                  │
│┌─────┐┌──────┐  ┌─────────────────┐  ┌──────────┐            │
││pages││assets│  │site_module_inst │  │blog_posts│            │
│└─────┘└──────┘  │(site-level)     │  └──────────┘            │
│                 └────────┬────────┘                           │
│                          │                                     │
│                          ▼                                     │
│                   ┌────────────┐                               │
│                   │ modules_v2 │ ← Marketplace catalog         │
│                   │  (global)  │                               │
│                   └────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Data Creation Points
| Entity | Created By | Trigger | Lifecycle |
|--------|-----------|---------|-----------|
| `agencies` | Admin client | User signup | Active → (no delete) |
| `profiles` | Admin client | Signup/invite | Active → Deactivated |
| `agency_members` | Owner/Admin | Team invite | Pending → Accepted → Removed |
| `clients` | Owner/Admin | Manual creation | Active → Archived |
| `sites` | Owner/Admin/Member | "New Site" action | Draft → Published → Archived |
| `pages` | System/User | Site creation (homepage) | Draft → Published |
| `modules_v2` | Super Admin | Module registration | Draft → Published → Deprecated |
| `agency_module_subscriptions` | System | Paddle/free subscribe | Active → Cancelled |
| `site_module_installations` | Owner/Admin | Enable toggle | Enabled → Disabled |
| `social_posts` | Team | Compose action | Draft → Scheduled → Published/Failed |
| `crm_contacts` | Team/Form | Manual/Import | Active → Archived |

### Permission Matrix
```
Action                    | Super Admin | Agency Owner | Admin | Member | Client
--------------------------|-------------|--------------|-------|--------|--------
Platform Admin Access     |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
Create/Delete Agency      |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
View All Agencies         |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
Approve Modules           |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Agency Billing            |     ✓       |      ✓       |   ✗   |   ✗    |   ✗
Team Management           |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Module Subscriptions      |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
White-Label Config        |     ✓       |      ✓       |   ✗   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Create Client/Site        |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Delete Site               |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Edit Site                 |     ✓       |      ✓       |   ✓   |   ✓    |   ✗*
Publish Site              |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Enable Module for Site    |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Edit Pages/Content        |     ✓       |      ✓       |   ✓   |   ✓    |   ✗*
Upload Media              |     ✓       |      ✓       |   ✓   |   ✓    |   ✓*
Create Blog Posts         |     ✓       |      ✓       |   ✓   |   ✓    |   ✗*
CRM/Social Access         |     ✓       |      ✓       |   ✓   |   ✓    |   ✗
Approve Social Posts      |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Client Portal Access      |     ✗       |      ✗       |   ✗   |   ✗    |   ✓
Submit Support Ticket     |     ✗       |      ✗       |   ✗   |   ✗    |   ✓
View Own Analytics        |     ✗       |      ✗       |   ✗   |   ✗    |   ✓*

*Client permissions configurable per-client
```

### State Machines

#### Site States
```
         ┌──────────────┐
  (new)  │    DRAFT     │◄──────────┐
         │ published=F  │           │
         └──────┬───────┘           │
                │ publish()         │
                ▼                   │ unpublish()
         ┌──────────────┐           │
         │  PUBLISHED   │───────────┘
         │ published=T  │
         └──────────────┘
```

#### Social Post States
```
           ┌───────┐
    (new)  │ DRAFT │
           └───┬───┘
               │ schedule() or submit_for_approval()
               ▼
           ┌──────────┐     reject()     ┌──────────┐
           │ PENDING  │◄────────────────▶│ REJECTED │
           │ APPROVAL │                  └──────────┘
           └────┬─────┘
                │ approve()
                ▼
           ┌───────────┐
           │ SCHEDULED │◄───────┐
           └─────┬─────┘        │
   (time due)    │              │ reschedule()
                 ▼              │
           ┌────────────┐       │
           │ PUBLISHING │───────┘
           └─────┬──────┘
       ┌─────────┴─────────┐
       ▼                   ▼
┌───────────┐        ┌──────────┐
│ PUBLISHED │        │  FAILED  │
└───────────┘        └──────────┘
```

#### E-Commerce Order States
```
┌─────────┐
│ PENDING │ → payment_received()
└────┬────┘
     ▼
┌─────────┐
│  PAID   │ → start_processing()
└────┬────┘
     ▼
┌────────────┐     cancel()     ┌───────────┐
│ PROCESSING │─────────────────▶│ CANCELLED │
└─────┬──────┘                  └───────────┘
      │ ship()
      ▼
┌──────────┐
│ SHIPPED  │ → delivered()
└────┬─────┘
     ▼
┌───────────┐     refund()     ┌──────────┐
│ DELIVERED │─────────────────▶│ REFUNDED │
└─────┬─────┘                  └──────────┘
      │ complete()
      ▼
┌───────────┐
│ COMPLETED │
└───────────┘
```

### Feature Dependencies
```
Page Editor
├── requires: Media Library (for images)
├── requires: Sites system (context)
└── uses: Craft.js components (→ Puck migration planned)

Social Media Module
├── requires: Module subscription + site installation
├── requires: OAuth tokens (platform auth)
├── uses: Media Library
└── integrates with: Automation (triggers)

CRM Module
├── requires: Module subscription + site installation
├── integrates with: E-Commerce (customers)
├── integrates with: Automation (triggers)
└── integrates with: Email (Resend)

Automation Module
├── requires: Trigger sources (CRM, E-Commerce, Social, Forms)
├── supports: 19 event types
└── integrates with: AI Agents

AI Agents
├── requires: LLM provider (Anthropic API key)
├── requires: Approval system (for risky actions)
└── uses: Tool system (12 built-in tools)
```

---

## 🧭 NAVIGATION & ROUTE MAP

### Complete Route Structure

#### Auth Routes
```
/login                    - User login
/signup                   - Agency registration
/forgot-password          - Password reset request
/reset-password           - Password completion
/onboarding               - Post-signup setup
/auth/callback            - OAuth callback
```

#### Dashboard Routes
```
/dashboard                           - Main dashboard
├── /sites                           - Sites list
│   ├── /new                         - Create site
│   └── /[siteId]                    - Site detail
│       ├── /pages                   - Page list
│       ├── /editor                  - Visual builder
│       ├── /blog                    - Blog management
│       ├── /seo                     - SEO settings
│       ├── /settings                - Site settings
│       ├── /submissions             - Form submissions
│       │
│       ├── /social/*                - Social Media Module ⭐
│       │   ├── /accounts            - Connected accounts
│       │   ├── /analytics           - Performance
│       │   ├── /approvals           - Pending approvals
│       │   ├── /calendar            - Content calendar
│       │   ├── /campaigns           - Campaigns
│       │   ├── /compose             - Create post
│       │   ├── /inbox               - Social inbox
│       │   └── /settings            - Module settings
│       │
│       ├── /automation/*            - Automation Module ⭐
│       │   ├── /workflows           - Builder
│       │   ├── /templates           - Templates
│       │   ├── /executions          - Run history
│       │   └── /analytics           - Performance
│       │
│       ├── /ai-agents/*             - AI Agents ⭐
│       │   ├── /marketplace         - Templates
│       │   ├── /analytics           - Usage
│       │   ├── /approvals           - Pending
│       │   └── /[agentId]           - Agent detail
│       │
│       ├── /crm-module              - CRM Module ⭐
│       ├── /booking                 - Booking Module ⭐
│       └── /ecommerce               - E-Commerce Module ⭐
│
├── /clients                         - Client management
├── /media                           - Media library
├── /billing                         - Billing
├── /notifications                   - Notifications
└── /support                         - Support
```

#### Marketplace Routes
```
/marketplace
├── /v2                              - Module catalog
│   └── /[moduleId]                  - Module details
├── /collections                     - Collections
├── /installed                       - My modules
└── /success                         - Post-purchase
```

#### Settings Routes
```
/settings
├── /profile                         - User profile
├── /security                        - Password, 2FA
├── /agency                          - Agency settings
├── /branding                        - Custom branding
├── /billing                         - Payment methods
├── /subscription                    - Plan management
├── /team                            - Team members
├── /domains                         - Custom domains
├── /modules                         - Module settings
└── /notifications                   - Notification prefs
```

#### Admin Routes (Super Admin Only)
```
/admin
├── /agencies                        - All agencies
├── /users                           - All users
├── /modules                         - Module management
├── /analytics                       - Platform analytics
├── /billing                         - Platform billing
├── /audit                           - Audit trail
└── /health                          - System health
```

#### Client Portal Routes
```
/portal
├── /login                           - Client login
├── /sites                           - Client's sites
│   └── /[siteId]/apps               - Module access
├── /apps                            - Installed modules
├── /media                           - Media library
├── /analytics                       - Site analytics
├── /invoices                        - Billing history
├── /settings                        - Account settings
└── /support                         - Support tickets
```

#### Public Routes
```
/site/[domain]/[...slug]             - Published pages
/blog/[subdomain]/[slug]             - Blog posts
/preview/[siteId]/[pageId]           - Preview
/pricing                             - Public pricing
```

### Navigation UI Structure
```
MAIN DASHBOARD:
┌─────────────────────────────────────────────────────┐
│ DRAMAC (Logo)                    [Notifications] [👤]│
├─────────────────────────────────────────────────────┤
│  SIDEBAR               │       CONTENT AREA         │
│  ────────              │       ────────────         │
│  ▶ Dashboard           │                            │
│  ▶ Sites               │       Current view         │
│  ▶ Clients             │                            │
│  ▶ Media Library       │                            │
│  ▶ Marketplace         │                            │
│  ─────────             │                            │
│  ▶ Settings            │                            │
│  ▶ Billing             │                            │
│  [Admin] (if super)    │                            │
└─────────────────────────────────────────────────────┘

SITE DETAIL PAGE:
┌─────────────────────────────────────────────────────┐
│ ← Back    Site Name    [Settings] [Editor] [Publish]│
├─────────────────────────────────────────────────────┤
│ Tabs: Overview│Pages│Blog│Modules│[CRM*]│[Social*] │
├─────────────────────────────────────────────────────┤
│                   Tab Content                       │
└─────────────────────────────────────────────────────┘
*Module tabs only appear if enabled for site
```

---

## �👤 YOUR ROLE & AUTHORITY

You are operating as a **combined expert team**:

### 1. Senior Product Architect
- Define feature scope and boundaries
- Ensure business logic integrity
- Map user journeys and flows

### 2. Principal UI/UX Designer
- Modern, accessible interface design
- Industry-standard interaction patterns
- Mobile-first responsive approach
- Reference: Stripe, Linear, Notion, HubSpot

### 3. Enterprise Full-Stack Engineer
- TypeScript-first implementation
- Server/Client component architecture
- RLS-compliant database operations
- Performance-optimized code

### Quality Bar
Your output must match or exceed:
- **Stripe** — Clean, professional UI
- **Linear** — Fast, responsive interactions
- **Notion** — Intuitive information hierarchy
- **HubSpot** — Enterprise-grade dashboards
- **TradingView** — Data visualization excellence

---

## 🔒 PRE-IMPLEMENTATION PROTOCOL

### Step 1: Memory Bank Review (MANDATORY)
```
□ Read all 6 memory bank files
□ Note current phase status (76% complete)
□ Identify completed vs pending modules
□ Review known issues and technical debt
```

### Step 2: Affected Area Analysis
For EACH change, you must identify:
```
□ Which modules are affected?
□ Which shared components are used?
□ What API routes/server actions exist?
□ What database tables are involved?
□ What TypeScript types need updating?
```

### Step 3: Pattern Verification
Verify alignment with existing patterns:
```
□ Server→Client wrapper pattern for event handlers
□ Module access control pattern (getSiteEnabledModules)
□ Navigation pattern (mainNavigation in config/navigation.ts)
□ RLS pattern (agency_id filtering)
□ Server Action pattern ('use server' directive)
```

### Step 4: Impact Assessment
```
□ List all files that will be modified
□ List all new files that will be created
□ Identify potential breaking changes
□ Document rollback strategy
```

---

## 📑 PHASE DOCUMENT GENERATION RULES

### Format Requirements
Each phase document must include:

```markdown
# PHASE [NUMBER][LETTER?]: [TITLE]

## Overview
- **Objective**: Clear goal statement
- **Scope**: What's included/excluded
- **Dependencies**: Required prior phases
- **Estimated Effort**: Hours

## Pre-Implementation Checklist
□ Memory bank reviewed
□ Affected files identified
□ Patterns verified
□ No conflicts detected

## Implementation Steps
### Step 1: [Description]
**File**: `path/to/file.tsx`
**Action**: Create | Modify | Delete
**Changes**:
- Specific change 1
- Specific change 2

[Include ACTUAL code snippets, not pseudocode]

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing steps
4. Expected outcomes

## Rollback Plan
If issues arise:
1. Revert files: [list]
2. Rollback migrations: [if any]
3. Clear caches: [steps]

## Files Changed Summary
| File | Action | Purpose |
|------|--------|---------|
| path/file.tsx | Modified | Description |
```

### Size Constraints
- **Maximum**: 2000 lines per phase document
- **If exceeded**: Split into `PHASE-XX-A`, `PHASE-XX-B`, etc.
- Each sub-phase must be independently implementable
- Include clear handoff notes between sub-phases

### Naming Convention
```
PHASE-UI-01-DESIGN-SYSTEM-AUDIT.md
PHASE-UI-02A-NAVIGATION-OVERHAUL.md
PHASE-UI-02B-NAVIGATION-MOBILE.md
PHASE-WZ-01-ONBOARDING-WIZARD.md
PHASE-DS-01-DASHBOARD-ANALYTICS.md
```

---

## 🎨 PHASE GROUP 1: COMPLETE UI/UX OVERHAUL

### Objective
Transform DRAMAC CMS UI to **enterprise-grade SaaS standard** while:
- ✅ Preserving ALL business logic
- ✅ Maintaining ALL existing functionality
- ✅ Enhancing presentation and usability only

### Scope Analysis Required

Before creating UI phases, analyze:

```
1. LAYOUT SYSTEM
   - Current: Sidebar + Header + Main content
   - File: src/components/layout/sidebar.tsx
   - File: src/components/layout/header.tsx
   - File: src/app/(dashboard)/layout.tsx

2. NAVIGATION PATTERNS
   - Current: mainNavigation in config/navigation.ts
   - Patterns: Group titles, icons, badges
   - Mobile: Sheet-based sidebar

3. COMPONENT LIBRARY
   - Location: src/components/ui/
   - Count: 40+ components
   - Style: shadcn/ui + Tailwind

4. DESIGN TOKENS
   - Location: src/config/brand/
   - Colors: HSL-based, 50-950 scales
   - Typography: Geist font family
   - CSS: src/styles/brand-variables.css

5. PAGE PATTERNS
   - Dashboard: Stats cards + Quick actions + Activity
   - List pages: Search + Filters + Table/Grid
   - Detail pages: Header + Tabs + Content sections
   - Forms: React Hook Form + Zod validation

6. MODULE UIs
   - Social Media: Calendar, Composer, Inbox, Dashboard
   - CRM: Contacts, Deals, Pipeline
   - Automation: Workflows, Triggers, Logs
   - AI Agents: Builder, Marketplace, Analytics
```

### Phase Requirements

Each UI phase document MUST include:

```markdown
## Affected Modules
- [List all modules touched]

## Before vs After UX
| Aspect | Current | Proposed |
|--------|---------|----------|
| Layout | ... | ... |
| Navigation | ... | ... |
| Interactions | ... | ... |

## Components to Refactor
| Component | Location | Change Type |
|-----------|----------|-------------|
| Name | path | Wrap / Enhance / Replace |

## Global Design Token Updates
| Token | Current | New | Affected Components |
|-------|---------|-----|---------------------|

## Risk Mitigation
- How to prevent feature loss
- How to test for regressions
- Rollback procedure
```

### UI/UX Standards to Apply

```yaml
LAYOUT:
  - Consistent padding: 1rem mobile, 1.5rem desktop
  - Max content width: 1400px
  - Breathing room between sections
  - Clear visual hierarchy

NAVIGATION:
  - Active state clearly visible
  - Keyboard accessible (Tab, Enter, Escape)
  - Breadcrumbs for deep pages
  - Mobile: Bottom navigation or hamburger

COMPONENTS:
  - Loading states for all async operations
  - Empty states with helpful guidance
  - Error states with recovery actions
  - Hover/focus states visible

TYPOGRAPHY:
  - Page title: text-3xl font-bold
  - Section title: text-xl font-semibold
  - Body: text-base
  - Caption: text-sm text-muted-foreground

SPACING:
  - Cards: gap-4 to gap-6
  - Sections: space-y-6 to space-y-8
  - Form fields: space-y-4

COLORS:
  - Use semantic colors (primary, success, warning, danger)
  - Dark mode: Use gray-900, gray-800 backgrounds
  - Avoid hardcoded colors
```

### Non-Negotiable Constraints

```
❌ DO NOT change business logic in server actions
❌ DO NOT remove or rename existing API routes
❌ DO NOT alter database queries or RLS policies
❌ DO NOT change module installation/subscription logic
❌ DO NOT modify authentication flows
❌ DO NOT delete existing components (wrap instead)

✅ DO enhance visual presentation
✅ DO improve usability and accessibility
✅ DO add loading/error/empty states
✅ DO improve responsiveness
✅ DO optimize performance (lazy loading, code splitting)
```

---

## 🧭 PHASE GROUP 2: SMART SETUP WIZARDS

### Objective
Implement **intelligent, contextual onboarding** across the platform that:
- Guides users through initial setup
- Appears only when relevant
- Never overwrites existing data
- Remembers completion state

### Wizard Inventory Required

Analyze and document setup needs for:

```
1. PLATFORM ONBOARDING
   - First login experience
   - Agency profile completion
   - Team invitation flow

2. MODULE ONBOARDING
   - Post-installation setup for each module
   - Feature discovery tours
   - Configuration wizards

3. FEATURE ONBOARDING
   - First site creation
   - First page built
   - First post published
   - First module installed

4. CONTEXTUAL HELP
   - Empty state guidance
   - Feature tooltips
   - Progress indicators
```

### Wizard Architecture

```typescript
// Wizard state management pattern
interface WizardState {
  wizardId: string;
  userId: string;
  agencyId: string;
  currentStep: number;
  completedSteps: number[];
  dismissed: boolean;
  completedAt: Date | null;
  metadata: Record<string, any>;
}

// Storage: user_preferences or dedicated wizard_progress table
// Trigger: Check on route load or feature access
// Dismiss: User can skip, remembers choice
// Resume: Can continue from last step
```

### Data Safety Rules

```
⚠️ CRITICAL: Wizards must NEVER:

1. Override existing user settings
   - Check if setting exists before suggesting default
   - Show current value if already configured
   - Offer to keep or change, never auto-change

2. Reset configurations
   - Read-only access to existing configs
   - Only write new values user explicitly confirms
   - Log all wizard-initiated changes

3. Make destructive changes
   - No delete operations
   - No overwrite operations
   - Always additive or opt-in changes

4. Run without user awareness
   - Clear visual indication wizard is active
   - User can exit at any time
   - No background operations
```

### Phase Requirements

Each wizard phase document MUST include:

```markdown
## Wizard Specification

### Trigger Conditions
- When does wizard appear?
- What state checks are required?
- How to prevent repeat appearances?

### Step Definitions
| Step | Title | Description | Required Fields | Validation |
|------|-------|-------------|-----------------|------------|

### Completion Rules
- When is wizard marked complete?
- What data is persisted?
- How to handle partial completion?

### Skip/Resume Behavior
- Can user skip? Consequences?
- How to resume after navigation?
- State persistence mechanism

### Failure Recovery
- What if API call fails?
- What if user closes browser?
- Data consistency guarantees

### UX Fallback States
- Wizard disabled scenario
- Already configured scenario
- Error state display
```

---

## 📊 PHASE GROUP 3: HIGH-END ENTERPRISE DASHBOARDS

### Objective
Build **world-class analytics dashboards** comparable to:
- Stripe Analytics — Clean metrics display
- Datadog — Real-time monitoring
- Google Analytics — Data exploration
- TradingView — Interactive charts
- HubSpot — CRM dashboards

### Dashboard Inventory

```
1. MAIN DASHBOARD (Enhanced)
   - Current: Basic stats cards + recent activity
   - Target: Interactive metrics, trends, quick insights

2. SITE ANALYTICS
   - Page views, visitor stats
   - Content performance
   - SEO metrics

3. MODULE DASHBOARDS
   - CRM: Pipeline metrics, deal velocity
   - Social: Engagement, posting performance
   - Automation: Workflow stats, trigger logs
   - AI Agents: Execution metrics, cost tracking

4. BILLING DASHBOARD
   - Revenue metrics, MRR/ARR
   - Usage tracking
   - Customer health

5. ADMIN DASHBOARD
   - Platform-wide metrics
   - Agency performance
   - System health
```

### Dashboard Architecture

```typescript
// Widget-based dashboard pattern
interface DashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'list' | 'custom';
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: { row: number; col: number };
  config: WidgetConfig;
  refreshInterval?: number;
}

interface WidgetConfig {
  dataSource: string;        // API endpoint or server action
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'heatmap';
  timeRange?: '24h' | '7d' | '30d' | '90d' | 'custom';
  filters?: Record<string, any>;
  thresholds?: { warning: number; danger: number };
}
```

### Visualization Requirements

```yaml
CHARTS (using recharts):
  Line Charts:
    - Smooth animations
    - Tooltips with formatted values
    - Responsive resize
    - Dark mode support
  
  Bar Charts:
    - Horizontal and vertical
    - Stacked variations
    - Gradient fills
  
  Pie/Donut:
    - Labels or legend
    - Interactive hover
    - Center stat for donut

TABLES:
  - Sortable columns
  - Column resizing (optional)
  - Row hover states
  - Pagination or virtual scroll
  - Empty state handling

STAT CARDS:
  - Clear label and value
  - Trend indicator (+/- with color)
  - Comparison period
  - Icon or mini sparkline
```

### Performance Requirements

```
RENDERING:
  - Charts lazy-loaded below fold
  - Virtual scroll for large tables
  - Debounced filter updates
  - Skeleton loaders during fetch

DATA FETCHING:
  - Server Components where possible
  - TanStack Query for client caching
  - Stale-while-revalidate pattern
  - Background refresh for live data

BUNDLE:
  - Dynamic import for chart libraries
  - Split dashboard by route
  - Preload critical widgets
```

### Phase Requirements

Each dashboard phase document MUST include:

```markdown
## Dashboard Specification

### Widget Architecture
| Widget ID | Type | Size | Data Source | Refresh |
|-----------|------|------|-------------|---------|

### Data Layer
- Server Actions for data fetching
- Caching strategy
- Error handling

### State Management
- Filter state location
- Time range persistence
- Widget configuration storage

### Performance Strategy
- Lazy loading plan
- Bundle split points
- Skeleton UI specification

### UX Fallback Behavior
- No data available
- Partial data loaded
- API error states
- Loading indicators

### Customization Limits
- Which widgets are movable?
- Which are configurable?
- User preference storage
```

---

## 🔧 TECHNICAL CONSTRAINTS

### Code Patterns (MUST FOLLOW)

#### Server→Client Wrapper Pattern
```typescript
// ❌ WRONG: Server page passing handlers
export default async function Page() {
  return <ClientComponent onSubmit={handleSubmit} /> // Error!
}

// ✅ CORRECT: Use client wrapper
'use client'
export function ClientWrapper({ data, siteId }) {
  const router = useRouter()
  const handleSubmit = async (values) => {
    await serverAction(siteId, values)
    router.refresh()
  }
  return <ClientComponent data={data} onSubmit={handleSubmit} />
}
```

#### Module Access Control
```typescript
// Always check module access before rendering UI
const enabledModules = await getSiteEnabledModules(siteId);
const hasCRM = enabledModules.has('crm');
{hasCRM && <TabsTrigger value="crm">CRM</TabsTrigger>}

// Route guards in module pages
const hasAccess = await isModuleEnabledForSite(siteId, 'social-media');
if (!hasAccess) redirect(`/dashboard/sites/${siteId}?tab=modules`);
```

#### Server Actions
```typescript
// src/lib/actions/example.ts
'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createItem(agencyId: string, data: ItemData) {
  const supabase = await createClient();
  const { data: result, error } = await supabase
    .from('items')
    .insert({ ...data, agency_id: agencyId })
    .select()
    .single();
  
  if (error) return { error: error.message };
  revalidatePath('/dashboard/items');
  return { data: result };
}
```

### File Naming Conventions
```
Components:    kebab-case.tsx       (dashboard-stats.tsx)
Actions:       kebab-case.ts        (site-actions.ts)
Types:         kebab-case.ts        (module-types.ts)
Utilities:     kebab-case.ts        (format-date.ts)
Config:        kebab-case.ts        (navigation.ts)
Pages:         page.tsx (Next.js convention)
Layouts:       layout.tsx
```

### Import Conventions
```typescript
// Use path aliases
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { getSites } from '@/lib/actions/sites';

// Module imports from barrel files
import { type SocialPost, PostComposer } from '@/modules/social-media';
```

---

## ✅ QUALITY GATES

### Pre-Merge Checklist (EVERY PHASE)

```
□ TypeScript: Zero errors
  Command: npx tsc --noEmit --skipLibCheck
  
□ Build: Passes
  Command: pnpm build
  
□ No Console Errors: In browser dev tools

□ Mobile Responsive: Test at 375px width

□ Dark Mode: All components render correctly

□ Loading States: Present for async operations

□ Error States: User-friendly messages

□ Empty States: Helpful guidance shown

□ Accessibility: Keyboard navigable, proper ARIA
```

### Regression Prevention

```
□ Existing routes still work
□ Module subscription flow unchanged
□ Site publishing still works
□ Client portal accessible
□ API endpoints respond correctly
□ Webhooks still fire
□ Auth flows work (login, signup, logout)
```

---

## 🚀 EXECUTION WORKFLOW

### Complete Phase Generation Order

```
═══════════════════════════════════════════════════════════════════
PHASE GROUP 1: UI/UX FOUNDATION
═══════════════════════════════════════════════════════════════════
├── PHASE-UI-01: Design System Audit & Token Consolidation
├── PHASE-UI-02A: Layout System Modernization
├── PHASE-UI-02B: Layout Mobile Responsiveness
├── PHASE-UI-03A: Navigation Enhancement (Desktop)
├── PHASE-UI-03B: Navigation Enhancement (Mobile)
├── PHASE-UI-04A: Component Polish (Core UI)
├── PHASE-UI-04B: Component Polish (Dashboard)
├── PHASE-UI-04C: Component Polish (Forms & Inputs)
├── PHASE-UI-05A: Dashboard Page Overhaul
├── PHASE-UI-05B: Dashboard Analytics & Charts
└── PHASE-UI-06: Loading, Empty & Error States

═══════════════════════════════════════════════════════════════════
PHASE GROUP 2: MODULE-SPECIFIC UI
═══════════════════════════════════════════════════════════════════
├── PHASE-UI-10A: CRM Module UI Overhaul
├── PHASE-UI-10B: CRM Pipeline & Deals View
├── PHASE-UI-11A: Social Media Dashboard UI
├── PHASE-UI-11B: Social Calendar & Composer UI
├── PHASE-UI-12A: Automation Workflow Builder UI
├── PHASE-UI-12B: Automation Logs & Analytics UI
├── PHASE-UI-13A: AI Agents Dashboard UI
├── PHASE-UI-13B: AI Agent Builder UI
├── PHASE-UI-14: E-Commerce Module UI
└── PHASE-UI-15: Booking Module UI

═══════════════════════════════════════════════════════════════════
PHASE GROUP 3: WEBSITE EDITOR/BUILDER OVERHAUL
═══════════════════════════════════════════════════════════════════
├── PHASE-ED-01A: Puck Editor Core Integration
├── PHASE-ED-01B: Craft.js to Puck Data Migration
├── PHASE-ED-02A: Component Library Migration (Layout)
├── PHASE-ED-02B: Component Library Migration (Content)
├── PHASE-ED-02C: Component Library Migration (Forms)
├── PHASE-ED-03A: New Components - Interactive
├── PHASE-ED-03B: New Components - Marketing
├── PHASE-ED-03C: New Components - E-Commerce
├── PHASE-ED-04A: 3D Components - React Three Fiber
├── PHASE-ED-04B: 3D Components - Spline Integration
├── PHASE-ED-05A: AI Editor - Puck AI Plugin
├── PHASE-ED-05B: AI Editor - Custom Generation
├── PHASE-ED-05C: AI Editor - Content Optimization
├── PHASE-ED-06A: Settings Panel - Style Controls
├── PHASE-ED-06B: Settings Panel - Animation Controls
├── PHASE-ED-06C: Settings Panel - Responsive Controls
├── PHASE-ED-07A: Template System - Categories
├── PHASE-ED-07B: Template System - Premium Templates
└── PHASE-ED-08: Editor UI Polish & Performance

═══════════════════════════════════════════════════════════════════
PHASE GROUP 4: SETUP WIZARDS
═══════════════════════════════════════════════════════════════════
├── PHASE-WZ-01A: Platform Onboarding - New Agency
├── PHASE-WZ-01B: Platform Onboarding - First Site
├── PHASE-WZ-02A: Module Setup - CRM Wizard
├── PHASE-WZ-02B: Module Setup - Social Media Wizard
├── PHASE-WZ-02C: Module Setup - E-Commerce Wizard
├── PHASE-WZ-02D: Module Setup - Automation Wizard
├── PHASE-WZ-03A: Feature Tours - Editor
├── PHASE-WZ-03B: Feature Tours - Dashboard
├── PHASE-WZ-04A: Contextual Help - Empty States
└── PHASE-WZ-04B: Contextual Help - Tooltips

═══════════════════════════════════════════════════════════════════
PHASE GROUP 5: ENTERPRISE DASHBOARDS
═══════════════════════════════════════════════════════════════════
├── PHASE-DS-01A: Main Dashboard - Widget System
├── PHASE-DS-01B: Main Dashboard - Interactive Metrics
├── PHASE-DS-02A: Site Analytics Dashboard
├── PHASE-DS-02B: Site Analytics - Charts & Trends
├── PHASE-DS-03A: Module Dashboards - CRM Analytics
├── PHASE-DS-03B: Module Dashboards - Social Analytics
├── PHASE-DS-03C: Module Dashboards - Automation Analytics
├── PHASE-DS-04A: Admin Dashboard - Platform Overview
├── PHASE-DS-04B: Admin Dashboard - Agency Metrics
└── PHASE-DS-05: Billing & Revenue Dashboards

═══════════════════════════════════════════════════════════════════
PHASE GROUP 6: SETTINGS SYSTEM
═══════════════════════════════════════════════════════════════════
├── PHASE-ST-01A: Settings Framework - Schema & Storage
├── PHASE-ST-01B: Settings Framework - UI Components
├── PHASE-ST-02A: Account Settings - Profile & Security
├── PHASE-ST-02B: Account Settings - Notifications
├── PHASE-ST-03A: Agency Settings - Branding
├── PHASE-ST-03B: Agency Settings - White Label
├── PHASE-ST-03C: Agency Settings - Team Management
├── PHASE-ST-04A: Site Settings - General & Domain
├── PHASE-ST-04B: Site Settings - SEO
├── PHASE-ST-04C: Site Settings - Performance
├── PHASE-ST-05A: Editor Settings - Preferences
└── PHASE-ST-05B: Editor Settings - Shortcuts

═══════════════════════════════════════════════════════════════════
PHASE GROUP 7: ERROR HANDLING & USER FEEDBACK
═══════════════════════════════════════════════════════════════════
├── PHASE-EH-01: Core Error Infrastructure
├── PHASE-EH-02: Toast/Notification System
├── PHASE-EH-03: Form Validation UI
├── PHASE-EH-04: Loading & Empty States
├── PHASE-EH-05: Dialogs & Warnings
└── PHASE-EH-06: Offline & Rate Limiting

═══════════════════════════════════════════════════════════════════
TOTAL: 78 PHASE DOCUMENTS
═══════════════════════════════════════════════════════════════════
```

### Phase Size Estimates

| Phase Group | Phases | Est. Hours | Priority |
|-------------|--------|------------|----------|
| UI/UX Foundation | 11 | ~40 hours | 🔴 HIGH |
| Module-Specific UI | 10 | ~35 hours | 🔴 HIGH |
| Editor/Builder | 19 | ~80 hours | 🔴 HIGH |
| Setup Wizards | 10 | ~30 hours | 🟡 MEDIUM |
| Enterprise Dashboards | 10 | ~40 hours | 🟡 MEDIUM |
| Settings System | 12 | ~35 hours | 🟡 MEDIUM |
| Error Handling | 6 | ~20 hours | 🔴 HIGH |
| **TOTAL** | **78** | **~280 hours** | - |

### Per-Phase Execution

```
1. READ phase document completely
2. VERIFY memory bank is current
3. IDENTIFY all affected files
4. CHECK for conflicts with recent changes
5. IMPLEMENT changes incrementally
6. TEST after each significant change
7. VERIFY TypeScript compilation
8. RUN build command
9. DOCUMENT any deviations
10. UPDATE memory bank if needed
```

---

## 🎯 CRITICAL PATHS & SUCCESS METRICS

### Critical User Journeys (MUST Work Perfectly)

These are the most important flows that drive business success:

| Priority | Journey | Impact | Status |
|----------|---------|--------|--------|
| 🔴 1 | Signup → First Site Published | Adoption | ✅ Works |
| 🔴 2 | Module Subscribe → Enable → Use | Revenue | ✅ Works |
| 🔴 3 | Social Post Creation → Publish | Core Feature | ⚠️ Needs OAuth |
| 🔴 4 | Client Portal Access | Client Satisfaction | ✅ Works |
| 🔴 5 | Payment Processing | Business Operation | ✅ Works |

### Success Metrics by Persona

#### Agency Success Metrics
| Metric | Good | Great | Excellent |
|--------|------|-------|-----------|
| Time to First Site | < 1 hour | < 30 min | < 15 min |
| Time to First Publish | < 1 week | < 3 days | < 1 day |
| Sites per Agency | 3 | 8 | 15+ |
| Module Adoption Rate | 30% | 50% | 70% |
| Team Members Invited | 1 | 3 | 5+ |

#### Platform Health Metrics
| Metric | Target | Notes |
|--------|--------|-------|
| Active Agencies (MAU) | Growth | Key business metric |
| Revenue per Agency | > $100/mo | Including modules |
| Churn Rate | < 5%/mo | Agency retention |
| Module Attach Rate | > 2/agency | Average modules |
| Uptime | 99.9% | Vercel + Supabase |
| Page Load Time | < 3s | LCP metric |
| Error Rate | < 0.1% | 5xx errors |

### Business Logic Rules

#### Pricing & Billing
```
PLATFORM SUBSCRIPTIONS:
| Tier         | Price    | Sites | Clients | Team | Features          |
|--------------|----------|-------|---------|------|-------------------|
| Free         | $0       | 1     | 2       | 1    | Basic builder     |
| Starter      | $29/mo   | 5     | 10      | 3    | + Modules access  |
| Professional | $99/mo   | 20    | 50      | 10   | + White-label     |
| Enterprise   | Custom   | ∞     | ∞       | ∞    | + Custom dev      |

MODULE PRICING:
- Agency pays WHOLESALE to platform (via Paddle)
- Agency sets RETAIL markup for clients
- Markup types: percentage, fixed, custom
- Client billing handled by agency (not platform)

AI USAGE LIMITS (per tier):
- Free: 50K tokens/mo, 100 executions
- Starter: 500K tokens/mo, 1,000 executions
- Professional: 2M tokens/mo, 5,000 executions
- Business: 10M tokens/mo, 25,000 executions
- Enterprise: Unlimited
```

#### Validation Rules
```
SITE CREATION:
- Name: Required, max 100 chars
- Subdomain: Required, unique, lowercase alphanumeric + hyphens
- Client: Required (select or create)
- Check: Agency has not exceeded max_sites

SITE PUBLISHING:
- At least one page exists
- Homepage designated (is_homepage = true)
- Subdomain or custom domain configured
- Custom domain must be verified (if used)

MODULE INSTALLATION:
- Agency must have active subscription
- Module must be compatible with plan tier
- Site must not already have module installed

USER INVITATION:
- Email: Valid format, not already in agency
- Role: Must be valid (admin, member)
- Agency: Must not exceed max_users
```

### Improvement Priorities

| Priority | Opportunity | Impact | Effort | Notes |
|----------|-------------|--------|--------|-------|
| 1 | Social OAuth Integration | High | High | Required for real functionality |
| 2 | UI/UX Modernization | High | High | This Master Prompt |
| 3 | Puck Editor Migration | High | High | Better page building |
| 4 | Mobile Responsiveness | Medium | Medium | Dashboard usability |
| 5 | 2FA Implementation | Medium | Low | Security feature |
| 6 | Real-time Notifications | Medium | Medium | Better UX |
| 7 | Bulk Operations | Low | Low | Power user feature |
| 8 | API Documentation | Low | Low | Developer experience |

### Current State Assessment

**What Works Well ✅:**
- Multi-tenant architecture with RLS
- Module access control system
- Social Media module (internal features)
- AI Agents system with 12 templates
- Automation engine with 19 events
- TypeScript strictness (zero errors)

**Needs Improvement ⚠️:**
- Page Builder (Craft.js) → Puck migration needed
- UI/UX inconsistency across modules
- External API integrations (OAuth)
- Mobile responsiveness
- Error handling UX
- Onboarding flow

**Missing Features 🔴:**
- Two-factor authentication (2FA)
- Real-time collaboration
- Version history for pages
- A/B testing
- Advanced analytics dashboards

---

## 🛡️ FAILURE PREVENTION PROTOCOL

### When to STOP

```
🛑 STOP immediately if:

1. Memory bank files are missing or outdated
2. TypeScript errors cannot be resolved
3. Build fails with unclear error
4. Existing functionality stops working
5. Database schema changes required (need migration)
6. Changes affect authentication/authorization
7. Changes affect billing/payments
8. Uncertainty about correct approach

📝 When stopped:
- Document the blocker clearly
- List what was attempted
- Propose resolution options
- Wait for clarification
```

### Conflict Resolution

```
If a change conflicts with existing code:

1. DO NOT force the change
2. Document the conflict precisely
3. Show both versions (existing vs proposed)
4. Explain why conflict exists
5. Propose resolution strategy
6. Wait for approval before proceeding
```

### Rollback Procedure

```
If something breaks:

1. Identify broken functionality
2. Locate changed files
3. Revert to previous version
4. Verify functionality restored
5. Document what went wrong
6. Propose alternative approach
```

---

## 📦 FINAL OUTPUT EXPECTATION

You must output:

1. **Complete sequence of PHASE documents** following the format specified
2. **Each phase ready for direct AI implementation** with explicit code examples
3. **Clean A/B phase splitting** when size limits exceeded
4. **Enterprise-grade precision** in all instructions
5. **Zero ambiguity** in implementation steps

### Phase Document Quality Criteria

```
✅ Self-contained: No external references required
✅ Sequential: Clear order of operations
✅ Safe: Rollback plan included
✅ Explicit: Actual code, not pseudocode
✅ Tested: Verification steps provided
✅ Documented: Purpose clear for each change
```

---

## 🚫 ABSOLUTE PROHIBITIONS

```
❌ NEVER guess when uncertain — ask
❌ NEVER skip memory bank review
❌ NEVER change business logic in UI phases
❌ NEVER remove existing features
❌ NEVER create breaking changes
❌ NEVER ignore TypeScript errors
❌ NEVER use hardcoded values for colors/spacing
❌ NEVER bypass module access controls
❌ NEVER alter authentication flows
❌ NEVER proceed without understanding impact
```

---

## ✅ EXECUTION AUTHORIZATION

You may BEGIN creating phase documents ONLY after:

```
□ All 6 memory bank files read and understood
□ Current platform state documented
□ Affected areas identified
□ Patterns verified
□ Conflicts checked
□ This prompt fully understood
```

**When ready, respond with:**
1. Summary of platform understanding (key points)
2. Identified areas for enhancement
3. Proposed phase sequence
4. First phase document

---

---

# 📋 APPENDIX A: COMPLETE PAGE & COMPONENT INVENTORY

This appendix provides an exhaustive inventory of every page, component, module, and route in DRAMAC CMS. AI implementers MUST reference this when making changes.

---

## 🗂️ ROUTE STRUCTURE (Complete)

### Authentication Routes (`/src/app/(auth)/`)
```
/login                    - User login
/signup                   - New user registration
/forgot-password          - Password recovery
/reset-password           - Password reset flow
/verify-email             - Email verification
```

### Dashboard Routes (`/src/app/(dashboard)/`)
```
/dashboard                     - Main agency dashboard
/dashboard/clients             - Client management list
/dashboard/clients/[clientId]  - Client detail page
/dashboard/clients/new         - Create new client

/dashboard/sites               - Sites list
/dashboard/sites/[siteId]      - Site detail (tabs: overview, pages, blog, modules, crm, social)
/dashboard/sites/[siteId]/editor      - Visual page editor (Craft.js)
/dashboard/sites/[siteId]/pages       - Page management
/dashboard/sites/[siteId]/blog        - Blog management
/dashboard/sites/[siteId]/settings    - Site settings
/dashboard/sites/[siteId]/seo         - SEO configuration
/dashboard/sites/[siteId]/submissions - Form submissions

/dashboard/sites/[siteId]/social          - Social media dashboard
/dashboard/sites/[siteId]/social/calendar - Content calendar
/dashboard/sites/[siteId]/social/compose  - Post composer
/dashboard/sites/[siteId]/social/inbox    - Unified inbox
/dashboard/sites/[siteId]/social/analytics - Social analytics
/dashboard/sites/[siteId]/social/campaigns - Campaign management
/dashboard/sites/[siteId]/social/approvals - Approval workflows
/dashboard/sites/[siteId]/social/settings  - Social settings

/dashboard/sites/[siteId]/crm-module     - CRM module
/dashboard/sites/[siteId]/automation     - Automation workflows
/dashboard/sites/[siteId]/ai-agents      - AI agents dashboard
/dashboard/sites/[siteId]/ai-agents/marketplace - Agent marketplace
/dashboard/sites/[siteId]/ai-agents/analytics   - Agent analytics
/dashboard/sites/[siteId]/ai-agents/testing     - Agent testing
/dashboard/sites/[siteId]/ai-agents/usage       - Usage & billing
/dashboard/sites/[siteId]/ai-agents/approvals   - Pending approvals
/dashboard/sites/[siteId]/ai-agents/new         - Create agent
/dashboard/sites/[siteId]/ai-agents/[agentId]   - Agent detail

/dashboard/sites/[siteId]/ecommerce        - E-commerce module
/dashboard/sites/[siteId]/booking          - Booking module

/dashboard/modules/subscriptions    - Module subscriptions
/dashboard/billing                  - Billing & invoices
/dashboard/media                    - Media library
/dashboard/crm                      - Agency-level CRM

/settings                           - Account settings
/settings/profile                   - Profile settings
/settings/team                      - Team management
/settings/branding                  - White-label branding
```

### Marketplace Routes (`/src/app/(dashboard)/marketplace/`)
```
/marketplace              - Browse modules
/marketplace/[moduleId]   - Module detail page
/marketplace/v2           - V2 marketplace (enhanced)
```

### Admin Routes (`/src/app/(dashboard)/admin/`)
```
/admin                    - Admin dashboard
/admin/users              - User management
/admin/agencies           - Agency management
/admin/modules            - Module management
/admin/analytics          - Platform analytics
/admin/billing            - Platform billing
/admin/settings           - Platform settings
```

### Developer Routes (`/src/app/(dashboard)/developer/`)
```
/developer                - Developer dashboard
/developer/modules        - My modules
/developer/studio         - Module studio (Monaco editor)
/developer/api-keys       - API key management
```

### Public Routes
```
/                         - Landing page
/pricing                  - Pricing page
/site/[domain]           - Published site rendering
/portal/[clientId]       - Client portal
/embed/[moduleId]        - Module embedding
/preview/[siteId]        - Site preview
```

---

## 🧩 COMPONENT INVENTORY

### Layout Components (`/src/components/layout/`)
```
sidebar.tsx              - Main navigation sidebar
header.tsx               - Top header bar
page-header.tsx          - Page title + actions
footer.tsx               - Dashboard footer
breadcrumbs.tsx          - Navigation breadcrumbs
```

### UI Components (`/src/components/ui/`) - 40+ shadcn/ui components
```
accordion.tsx, alert-dialog.tsx, alert.tsx, avatar.tsx,
badge.tsx, button.tsx, calendar.tsx, card.tsx, checkbox.tsx,
collapsible.tsx, command.tsx, context-menu.tsx, dialog.tsx,
dropdown-menu.tsx, form.tsx, input.tsx, label.tsx, pagination.tsx,
popover.tsx, progress.tsx, radio-group.tsx, resizable.tsx,
scroll-area.tsx, select.tsx, separator.tsx, sheet.tsx, skeleton.tsx,
slider.tsx, switch.tsx, table.tsx, tabs.tsx, textarea.tsx,
toggle.tsx, toggle-group.tsx, tooltip.tsx, sonner.tsx (toasts)
```

### Dashboard Components (`/src/components/dashboard/`)
```
dashboard-stats.tsx       - Stats cards grid
enhanced-metrics.tsx      - Enhanced metrics display
module-subscriptions.tsx  - Module subscription cards
quick-actions.tsx         - Quick action buttons
recent-activity.tsx       - Activity feed
recent-clients.tsx        - Recent clients list
recent-sites.tsx          - Recent sites list
welcome-card.tsx          - Welcome/onboarding card
```

### Editor Components (`/src/components/editor/`)
```
canvas.tsx                - Main editor canvas
editor-context.tsx        - Editor context provider
editor-header.tsx         - Editor top bar
editor-provider.tsx       - Craft.js provider wrapper
editor-wrapper.tsx        - Editor layout wrapper
page-selector.tsx         - Page selection dropdown
preview-device-switcher.tsx - Device preview switcher
preview-frame.tsx         - Preview iframe
preview-panel.tsx         - Preview panel container
preview-toolbar.tsx       - Preview controls
resolver.ts               - Component resolver for Craft.js
save-template-dialog.tsx  - Template save modal
settings-panel.tsx        - Component settings panel
template-library.tsx      - Template browser
theme-settings.tsx        - Theme customization
toolbox.tsx               - Component toolbox sidebar
```

### Editor User Components (`/src/components/editor/user-components/`)
**Current Components (35 total):**
```
BASIC:
button.tsx, button-component.tsx, heading.tsx, text.tsx,
image.tsx, image-component.tsx, video.tsx, divider.tsx, spacer.tsx

LAYOUT:
container.tsx, section.tsx, column.tsx, columns.tsx, root.tsx

NAVIGATION:
navbar.tsx, navigation.tsx, footer.tsx, social-links.tsx

CONTENT:
hero.tsx, hero-section.tsx, cta.tsx, cta-section.tsx,
card.tsx, features.tsx, feature-grid.tsx, gallery.tsx,
testimonials.tsx, team.tsx, stats.tsx, faq.tsx

FORMS:
form.tsx, form-field.tsx, contact-form.tsx, newsletter.tsx

INTERACTIVE:
map.tsx

E-COMMERCE:
ecommerce/ (folder with product components)
```

### Site Components (`/src/components/sites/`)
```
site-overview.tsx         - Site overview tab
site-pages-list.tsx       - Pages listing
site-blog-tab.tsx         - Blog management tab
site-modules-tab.tsx      - Modules management tab
site-crm-tab.tsx          - CRM integration tab
site-social-tab.tsx       - Social media tab
site-publish-button.tsx   - Publish/unpublish toggle
clone-site-dialog.tsx     - Site cloning modal
export-site-button.tsx    - Export site data
```

### Module Components (`/src/components/modules/`)
```
module-card.tsx           - Module display card
module-settings.tsx       - Module configuration
module-preview.tsx        - Module preview
```

### Client Components (`/src/components/clients/`)
```
client-card.tsx           - Client card display
client-form.tsx           - Client create/edit form
client-portal-settings.tsx - Portal configuration
```

### Billing Components (`/src/components/billing/`)
```
pricing-card.tsx          - Pricing tier card
billing-cycle-toggle.tsx  - Monthly/yearly toggle
usage-dashboard.tsx       - Usage visualization
paddle-invoice-history.tsx - Invoice list
paddle-subscription-card.tsx - Subscription status
billing-overview.tsx      - Billing summary
```

### AI Components (`/src/components/ai-agents/`)
```
agent-builder/            - Agent creation wizard (10 components)
marketplace/              - Agent marketplace (3 components)
analytics/                - Agent analytics dashboard
billing/                  - Usage tracking dashboard
testing/                  - Agent test runner
AIAgentsPage.tsx          - Main agents page
```

### CRM Components (`/src/components/crm/`)
```
contact-list.tsx          - Contacts table
contact-detail.tsx        - Contact profile
deal-pipeline.tsx         - Sales pipeline
activity-timeline.tsx     - Activity feed
```

---

## 🗄️ MODULE STRUCTURE

### Automation Module (`/src/modules/automation/`)
```
actions/                  - Server actions
components/               - UI components
hooks/                    - Custom hooks
lib/                      - Utilities
services/                 - Business logic
types/                    - TypeScript types
manifest.ts               - Module metadata
```

### Social Media Module (`/src/modules/social-media/`)
```
actions/
  account-actions.ts      - OAuth, account CRUD
  post-actions.ts         - Post CRUD, scheduling
  analytics-actions.ts    - Analytics fetching
  inbox-actions.ts        - Social inbox
  campaign-actions.ts     - Campaign management
  team-actions.ts         - Team permissions
components/
  PostComposer.tsx        - Multi-platform composer
  SocialDashboard.tsx     - Main dashboard
  ContentCalendar.tsx     - Calendar view
  SocialInbox.tsx         - Unified inbox
  + Wrappers (client components)
lib/
  team-utils.ts           - Role utilities
types/
  index.ts                - All type definitions
manifest.ts               - Module events/actions
```

### CRM Module (`/src/modules/crm/`)
```
actions/                  - Contact, deal, activity actions
components/               - CRM UI components
context/                  - CRM state context
types/                    - CRM types
manifest.ts               - Module metadata
```

### E-Commerce Module (`/src/modules/ecommerce/`)
```
(Similar structure)
```

### Booking Module (`/src/modules/booking/`)
```
(Similar structure)
```

---

## ⚙️ CONFIGURATION FILES

### Brand Configuration (`/src/config/brand/`)
```
types.ts                  - Type definitions
colors/                   - Color system
  utils.ts                - Color manipulation
  index.ts                - Color configuration
identity.ts               - Brand identity, SEO
tokens.ts                 - Design tokens
css-generator.ts          - CSS variable generation
hooks.ts                  - React hooks
index.ts                  - Main exports
```

### Other Configuration (`/src/config/`)
```
constants.ts              - App constants
navigation.ts             - Navigation items
plans.ts                  - Pricing plans
```

---

## 🔧 LIB STRUCTURE (`/src/lib/`)

### Actions (Server Actions)
```
actions/
  agencies.ts             - Agency CRUD
  sites.ts                - Site CRUD + module access
  clients.ts              - Client CRUD
  pages.ts                - Page CRUD
  profile.ts              - User profile
  dashboard.ts            - Dashboard data
  modules.ts              - Module operations
  billing.ts              - Billing operations
```

### Services
```
ai-agents/                - AI agent system (42+ files)
paddle/                   - Paddle billing integration
supabase/                 - Database clients
multi-tenant/             - Tenant context
modules/                  - Module rendering
email/                    - Resend integration
```

---

# 📐 APPENDIX B: WEBSITE EDITOR/BUILDER OVERHAUL

## Current State Analysis

The current editor uses **Craft.js 0.2.12** with:
- Basic drag-and-drop functionality
- 35 user components (see inventory above)
- Simple settings panel
- Device preview switching
- Template library

**Limitations:**
- Limited component library
- Basic styling options
- No responsive design controls
- No animation capabilities
- No 3D support
- Simple toolbox UI
- No AI-powered editing

---

## 🎯 Target State: Industry-Standard Editor

Reference implementations to match:
- **Wix Studio** - Professional-grade flexibility
- **Framer** - Animation-first design
- **Webflow** - CSS-level control
- **Squarespace** - Beautiful templates
- **Spline** - 3D integration

---

## 🔧 RECOMMENDED APPROACH: Adopt Puck Editor

### Why Puck Editor?
Based on research, **Puck Editor** (`@puckeditor/core`) is the ideal choice:

| Feature | Puck | Craft.js (Current) |
|---------|------|-------------------|
| GitHub Stars | 11.8k | 8.5k |
| Active Development | ✅ Very Active | ⚠️ Slower |
| Next.js 16 Support | ✅ Native | ⚠️ Requires patches |
| AI Integration | ✅ Official plugin | ❌ None |
| TypeScript | ✅ First-class | ✅ Good |
| Custom Components | ✅ Easy | ✅ Good |
| Nested Layouts | ✅ DropZone API | ✅ Similar |
| Server Components | ✅ Supported | ❌ Client only |
| License | MIT | MIT |

### GitHub Repository
```
https://github.com/puckeditor/puck
```

### Installation
```bash
npm i @puckeditor/core @puckeditor/plugin-ai --save
```

### Integration Pattern
```typescript
// src/components/editor/puck-editor.tsx
import { Puck } from "@puckeditor/core";
import { createAiPlugin } from "@puckeditor/plugin-ai";
import "@puckeditor/core/puck.css";
import "@puckeditor/plugin-ai/styles.css";

const aiPlugin = createAiPlugin();

export function PuckEditor({ config, data, onPublish }) {
  return (
    <Puck
      plugins={[aiPlugin]}
      config={config}
      data={data}
      onPublish={onPublish}
    />
  );
}
```

---

## 📦 PHASE GROUP 5: EDITOR/BUILDER OVERHAUL

### PHASE-ED-01: Puck Editor Migration Foundation
**Scope:** Replace Craft.js with Puck Editor core
**Effort:** ~16 hours

**Steps:**
1. Install Puck packages
2. Create Puck configuration
3. Migrate existing data format
4. Update editor routes
5. Preserve existing component logic

**Data Migration Strategy:**
```typescript
// Craft.js format → Puck format converter
function migrateCraftToPuck(craftData: CraftState): PuckData {
  // Transform nodes to Puck content structure
}
```

### PHASE-ED-02: Component Library Migration
**Scope:** Migrate 35 existing components to Puck format
**Effort:** ~12 hours

**Puck Component Format:**
```typescript
const config: Config = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        image: { type: "external", fetchList: async () => [...] },
        alignment: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ]
        },
        showCTA: { type: "toggle" },
      },
      defaultProps: {
        title: "Welcome",
        alignment: "center",
        showCTA: true,
      },
      render: ({ title, subtitle, image, alignment, showCTA }) => (
        <section className={`text-${alignment}`}>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {showCTA && <Button>Get Started</Button>}
        </section>
      ),
    },
    // ... 34 more components
  },
  categories: {
    layout: { components: ["Container", "Section", "Columns"] },
    content: { components: ["Hero", "Features", "Testimonials"] },
    forms: { components: ["ContactForm", "Newsletter"] },
    ecommerce: { components: ["ProductGrid", "Cart"] },
    advanced: { components: ["Video", "Map", "3DScene"] },
  },
};
```

### PHASE-ED-03: Modern Component Expansion (100+ Components)
**Scope:** Build comprehensive component library
**Effort:** ~24 hours

**New Component Categories:**

#### Basic Elements (20 components)
```
Heading, Text, RichText, Button, Link, Icon,
Image, Video, Audio, Embed, Code, Quote,
List, Table, Divider, Spacer, Badge, Tag,
Avatar, Tooltip
```

#### Layout Components (15 components)
```
Container, Section, Grid, Flexbox, Columns,
Row, Stack, Masonry, Sidebar, Split,
Accordion, Tabs, Collapse, Modal, Drawer
```

#### Navigation (10 components)
```
Navbar, MegaMenu, Sidebar, Footer, Breadcrumbs,
Pagination, ScrollSpy, BackToTop, MobileMenu, TabBar
```

#### Content Blocks (25 components)
```
Hero, HeroVideo, HeroSlider, HeroAnimated,
Features, FeatureCards, FeatureIcons,
Testimonials, TestimonialSlider, Reviews,
Team, TeamGrid, TeamCarousel,
Stats, Counter, ProgressBar,
Timeline, Process, Steps,
FAQ, Accordion, Pricing, PricingTable,
Blog, BlogGrid, BlogList
```

#### Forms & Input (15 components)
```
Form, Input, Textarea, Select, Checkbox,
Radio, Switch, DatePicker, TimePicker,
FileUpload, RangeSlider, Rating,
SearchBox, AutoComplete, MultiSelect
```

#### E-Commerce (10 components)
```
ProductCard, ProductGrid, ProductDetail,
AddToCart, CartSummary, Checkout,
CategoryNav, Filters, Wishlist, QuickView
```

#### Interactive (10 components)
```
Carousel, Slider, Gallery, Lightbox,
Parallax, Reveal, Counter, TypeWriter,
Map, VideoBackground
```

### PHASE-ED-04: 3D & Advanced Components
**Scope:** Add 3D capabilities using React Three Fiber
**Effort:** ~16 hours

**Dependencies:**
```bash
npm i @react-three/fiber @react-three/drei three @splinetool/react-spline
```

**3D Components:**
```typescript
// 3D Scene Component
const Scene3D = {
  fields: {
    modelUrl: { type: "text", label: "3D Model URL (.glb)" },
    autoRotate: { type: "toggle" },
    enableZoom: { type: "toggle" },
    backgroundColor: { type: "color" },
    lighting: {
      type: "select",
      options: ["ambient", "directional", "studio"],
    },
  },
  render: ({ modelUrl, autoRotate, enableZoom, backgroundColor }) => (
    <Canvas style={{ height: 400, background: backgroundColor }}>
      <OrbitControls autoRotate={autoRotate} enableZoom={enableZoom} />
      <Environment preset="studio" />
      <Suspense fallback={<Loader />}>
        <Model url={modelUrl} />
      </Suspense>
    </Canvas>
  ),
};

// Spline Integration
const SplineScene = {
  fields: {
    sceneUrl: { type: "text", label: "Spline Scene URL" },
    height: { type: "number", label: "Height (px)" },
  },
  render: ({ sceneUrl, height }) => (
    <Spline scene={sceneUrl} style={{ height }} />
  ),
};
```

**3D Component Library:**
```
Scene3D               - Custom 3D model viewer
SplineScene           - Spline.design embed
ParticleBackground    - Animated particles
GlobeVisualization    - Interactive globe
ProductViewer3D       - 360° product view
AnimatedText3D        - 3D typography
FloatingCards         - Parallax card effects
MorphingShapes        - Animated blob shapes
WaveBackground        - Animated wave effects
IsometricIllustration - Isometric graphics
```

### PHASE-ED-05: AI-Powered Editor Enhancement
**Scope:** Integrate Puck AI plugin + custom AI features
**Effort:** ~12 hours

**Puck AI Plugin Integration:**
```typescript
import { createAiPlugin } from "@puckeditor/plugin-ai";

const aiPlugin = createAiPlugin({
  // Custom AI prompts
  prompts: {
    improve: "Improve this content for better conversion",
    simplify: "Simplify this content for readability",
    expand: "Expand this content with more details",
    translate: "Translate this to {{language}}",
  },
});
```

**Custom AI Features:**
```typescript
// AI Component Suggestions
const suggestComponents = async (pageContext: string) => {
  const response = await ai.complete({
    prompt: `Given this page context: "${pageContext}", 
             suggest 5 components that would enhance the page.
             Return as JSON array with component names and reasons.`,
  });
  return JSON.parse(response);
};

// AI Layout Generation
const generateLayout = async (description: string) => {
  const response = await ai.complete({
    prompt: `Create a page layout for: "${description}".
             Return as Puck Data JSON structure.`,
  });
  return JSON.parse(response);
};

// AI Content Writing
const generateContent = async (componentType: string, context: string) => {
  const response = await ai.complete({
    prompt: `Write content for a ${componentType} component.
             Context: ${context}
             Return as JSON with all required props.`,
  });
  return JSON.parse(response);
};

// AI Image Suggestions
const suggestImages = async (content: string) => {
  // Integration with Unsplash/Pexels API
  const keywords = await ai.extractKeywords(content);
  return fetchStockImages(keywords);
};
```

### PHASE-ED-06: Advanced Settings Panel
**Scope:** Build comprehensive component settings UI
**Effort:** ~10 hours

**Settings Panel Features:**
```typescript
// Settings panel structure
interface ComponentSettings {
  // Content Tab
  content: {
    text: TextFields;
    media: MediaFields;
    links: LinkFields;
  };
  
  // Style Tab
  style: {
    typography: {
      fontFamily: string;
      fontSize: ResponsiveValue;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textTransform: TextTransform;
      textDecoration: TextDecoration;
      color: Color;
    };
    spacing: {
      margin: SpacingValue;
      padding: SpacingValue;
    };
    background: {
      type: 'none' | 'color' | 'gradient' | 'image' | 'video';
      value: BackgroundValue;
    };
    border: {
      width: number;
      style: BorderStyle;
      color: Color;
      radius: ResponsiveValue;
    };
    shadow: BoxShadow[];
    effects: {
      opacity: number;
      blur: number;
      brightness: number;
      contrast: number;
    };
  };
  
  // Layout Tab
  layout: {
    display: 'block' | 'flex' | 'grid';
    flexDirection: FlexDirection;
    justifyContent: JustifyContent;
    alignItems: AlignItems;
    gap: ResponsiveValue;
    width: ResponsiveValue;
    height: ResponsiveValue;
    minWidth: ResponsiveValue;
    maxWidth: ResponsiveValue;
    position: Position;
    zIndex: number;
  };
  
  // Animation Tab
  animation: {
    entrance: {
      type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'rotate';
      duration: number;
      delay: number;
      easing: Easing;
      trigger: 'load' | 'scroll' | 'hover' | 'click';
    };
    hover: HoverAnimation;
    scroll: ScrollAnimation;
  };
  
  // Responsive Tab
  responsive: {
    visibility: {
      mobile: boolean;
      tablet: boolean;
      desktop: boolean;
    };
    overrides: {
      mobile: Partial<StyleSettings>;
      tablet: Partial<StyleSettings>;
    };
  };
  
  // Advanced Tab
  advanced: {
    customCSS: string;
    customClasses: string;
    htmlId: string;
    dataAttributes: Record<string, string>;
    ariaLabel: string;
  };
}
```

### PHASE-ED-07: Template System Overhaul
**Scope:** Professional template library
**Effort:** ~12 hours

**Template Categories:**
```
LANDING PAGES:
- SaaS Landing
- Agency Portfolio
- Product Launch
- Coming Soon
- App Download
- Waitlist

BUSINESS:
- Corporate
- Consulting
- Law Firm
- Real Estate
- Restaurant
- Hotel

E-COMMERCE:
- Product Showcase
- Fashion Store
- Electronics
- Marketplace
- Single Product

PORTFOLIO:
- Designer
- Photographer
- Developer
- Artist
- Freelancer

CONTENT:
- Blog
- Magazine
- Documentation
- Knowledge Base
- Case Studies

SPECIAL:
- Event/Conference
- Wedding
- Resume/CV
- Nonprofit
- Education
```

---

# 🔧 APPENDIX C: SETTINGS SYSTEM OVERHAUL

## Current Settings Analysis

Settings are scattered across:
- `/settings` - Account settings
- `/dashboard/sites/[siteId]/settings` - Site settings
- Module-specific settings pages

**Issues:**
- Inconsistent UI patterns
- Missing granular controls
- No global preferences
- Limited customization options

---

## 🎯 Comprehensive Settings Architecture

### PHASE-ST-01: Global Settings Framework
**Scope:** Unified settings system
**Effort:** ~8 hours

```typescript
// Settings schema
interface PlatformSettings {
  // Account Settings
  account: {
    profile: ProfileSettings;
    security: SecuritySettings;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
  };
  
  // Agency Settings
  agency: {
    branding: BrandingSettings;
    whiteLabel: WhiteLabelSettings;
    team: TeamSettings;
    billing: BillingSettings;
    integrations: IntegrationSettings;
  };
  
  // Site Settings
  site: {
    general: GeneralSiteSettings;
    domain: DomainSettings;
    seo: SEOSettings;
    analytics: AnalyticsSettings;
    performance: PerformanceSettings;
    security: SiteSecuritySettings;
    publishing: PublishingSettings;
  };
  
  // Editor Settings
  editor: {
    preferences: EditorPreferences;
    shortcuts: ShortcutSettings;
    autosave: AutosaveSettings;
    history: HistorySettings;
    preview: PreviewSettings;
  };
  
  // Module Settings
  modules: {
    [moduleId: string]: ModuleSettings;
  };
}
```

### Detailed Settings Panels

#### Profile Settings
```
- Display name
- Email address
- Avatar upload
- Timezone selection
- Language preference
- Date/time format
- Number format
```

#### Security Settings
```
- Change password
- Two-factor authentication
- Session management
- Login history
- API keys
- Connected apps (OAuth)
- Account deletion
```

#### Notification Settings
```
- Email notifications
  - New client signup
  - Site published
  - Form submissions
  - Module updates
  - Billing alerts
  - Team mentions
- Push notifications
- Slack integration
- Discord webhooks
- Digest frequency (real-time, daily, weekly)
```

#### Branding Settings
```
- Agency name
- Logo (light/dark modes)
- Favicon
- Brand colors (primary, secondary, accent)
- Custom fonts
- Email templates
- Default signatures
```

#### White Label Settings
```
- Custom domain for dashboard
- Remove DRAMAC branding
- Custom login page
- Custom email domain
- Custom support email
- Terms & privacy URLs
- Client portal branding
```

#### Site SEO Settings
```
- Site title template
- Default meta description
- Social sharing defaults (OG/Twitter)
- Favicon set
- robots.txt editor
- sitemap configuration
- Schema.org markup
- Google Search Console verification
- Bing Webmaster verification
- Analytics integration (GA, GTM, etc.)
- Facebook Pixel
- Hotjar/Clarity
```

#### Performance Settings
```
- Image optimization (WebP, AVIF)
- Lazy loading
- Code minification
- Critical CSS extraction
- Font loading strategy
- Cache policies
- CDN configuration
- Preloading rules
```

#### Publishing Settings
```
- Default publish state
- Scheduled publishing
- Require approval
- Version history depth
- Auto-backup frequency
- Preview password protection
- Staging environment
```

---

# 🤖 APPENDIX D: AI BUILDER ENHANCEMENT

## Current AI Builder Analysis

Location: `/src/components/editor/ai/`

**Current Capabilities:**
- Basic content generation
- Simple suggestions

**Gaps:**
- No full page generation
- No design suggestions
- No conversion optimization
- No SEO suggestions
- No image generation
- No multi-modal input

---

## 🎯 Enhanced AI Builder Architecture

### PHASE-AI-01: AI Builder Core Enhancement
**Scope:** Advanced AI generation capabilities
**Effort:** ~16 hours

```typescript
interface AIBuilderCapabilities {
  // Page Generation
  generatePage: {
    fromDescription: (description: string) => PuckData;
    fromUrl: (url: string) => PuckData;  // Clone/inspire from URL
    fromImage: (image: File) => PuckData; // Design-to-code
    fromWireframe: (wireframe: File) => PuckData;
  };
  
  // Component Generation
  generateComponent: {
    fromDescription: (type: string, context: string) => ComponentProps;
    suggest: (pageContext: PuckData) => ComponentSuggestion[];
  };
  
  // Content Generation
  generateContent: {
    headline: (context: string, tone: string) => string[];
    body: (topic: string, length: number) => string;
    cta: (goal: string) => string[];
    seo: (content: string) => SEOMetadata;
  };
  
  // Design Assistance
  design: {
    suggestColors: (industry: string, mood: string) => ColorPalette;
    suggestFonts: (style: string) => FontPair;
    suggestLayout: (content: string) => LayoutSuggestion;
    improveContrast: (colors: Color[]) => Color[];
    checkAccessibility: (page: PuckData) => AccessibilityReport;
  };
  
  // Image Generation
  images: {
    generate: (prompt: string, style: string) => string; // DALL-E/Midjourney
    suggest: (content: string) => StockImage[];
    enhance: (image: File) => File;
    removeBackground: (image: File) => File;
  };
  
  // Optimization
  optimize: {
    forConversion: (page: PuckData) => OptimizationSuggestion[];
    forSEO: (page: PuckData) => SEOSuggestion[];
    forSpeed: (page: PuckData) => PerformanceSuggestion[];
    forMobile: (page: PuckData) => MobileSuggestion[];
  };
  
  // Analysis
  analyze: {
    competitors: (urls: string[]) => CompetitorAnalysis;
    industry: (industry: string) => IndustryBestPractices;
    audience: (demographics: Demographics) => AudienceInsights;
  };
}
```

### AI Prompts Library
```typescript
const AI_PROMPTS = {
  pageGeneration: {
    landing: `Create a high-converting landing page for {product}.
              Include: Hero with CTA, Features (3-4), Social proof, 
              Pricing, FAQ, Final CTA. Modern, clean design.`,
    
    portfolio: `Create a portfolio page for a {profession}.
                Include: Hero intro, Featured work (6), About section,
                Skills, Testimonials, Contact form.`,
    
    saas: `Create a SaaS product page for {product}.
           Include: Hero with demo video, Problem/Solution, 
           Features with icons, Pricing table, Integration logos,
           Customer testimonials, FAQ, CTA footer.`,
  },
  
  contentGeneration: {
    headline: `Write 5 compelling headlines for {context}.
               Style: {tone}. Focus on: {benefit}.
               Format: JSON array of strings.`,
    
    cta: `Write 5 call-to-action buttons for {goal}.
          Make them action-oriented and urgent.
          Format: JSON array of strings.`,
  },
  
  optimization: {
    conversion: `Analyze this page structure and suggest 
                 conversion improvements. Focus on:
                 - CTA placement and copy
                 - Social proof positioning
                 - Form simplification
                 - Trust signals
                 Return JSON with suggestions.`,
  },
};
```

### AI Interface Components
```typescript
// AI Chat Panel
const AIChatPanel = () => (
  <div className="ai-panel">
    <ChatHistory messages={messages} />
    <ChatInput 
      onSend={handleAIRequest}
      suggestions={contextualSuggestions}
    />
    <QuickActions actions={['Generate Page', 'Improve Copy', 'Add Section']} />
  </div>
);

// AI Suggestion Popover
const AISuggestionPopover = ({ component, position }) => (
  <Popover position={position}>
    <SuggestionList>
      <Suggestion icon="✨" label="Improve copy" onClick={improveContent} />
      <Suggestion icon="🎨" label="Enhance design" onClick={enhanceDesign} />
      <Suggestion icon="📈" label="Optimize for conversion" onClick={optimize} />
      <Suggestion icon="🔍" label="Improve SEO" onClick={improveSEO} />
    </SuggestionList>
  </Popover>
);

// AI Generation Wizard
const AIGenerationWizard = () => (
  <Wizard steps={['Describe', 'Choose Style', 'Select Components', 'Generate']}>
    <Step1_Description />
    <Step2_StyleSelection />
    <Step3_ComponentSelection />
    <Step4_Preview />
  </Wizard>
);
```

---

# 🔗 APPENDIX E: OPEN SOURCE RECOMMENDATIONS

## Recommended Open Source Projects to Leverage

### Page Builder Core
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **Puck Editor** | `puckeditor/puck` (11.8k ⭐) | Replace Craft.js, AI plugin, Next.js native |
| GrapesJS | `GrapesJS/grapesjs` (22k ⭐) | Alternative, more mature but heavier |

### 3D Graphics
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **React Three Fiber** | `pmndrs/react-three-fiber` (27k ⭐) | React wrapper for Three.js |
| **Drei** | `pmndrs/drei` (8k ⭐) | Helper components for R3F |
| **Spline** | `splinetool/react-spline` | No-code 3D scenes |
| Leva | `pmndrs/leva` (5k ⭐) | GUI controls for 3D |

### Animation
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **Framer Motion** | Already installed | Advanced animations |
| GSAP | `greensock/GSAP` | Professional animations |
| Auto Animate | `formkit/auto-animate` | Simple transitions |

### Rich Text
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **TipTap** | Already installed | Rich text editing |
| Plate | `udecode/plate` (11k ⭐) | Alternative, more features |

### Charts & Data
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **Recharts** | Already installed | React charts |
| Tremor | `tremorlabs/tremor` (16k ⭐) | Dashboard components |
| Nivo | `plouc/nivo` (13k ⭐) | Advanced data viz |

### UI Components
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **Radix UI** | Already installed | Primitives |
| **shadcn/ui** | Already installed | Components |
| Ark UI | `chakra-ui/ark` | Alternative primitives |

### Form Building
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **React Hook Form** | Already installed | Form state |
| Formik | `jaredpalmer/formik` | Alternative |

### Image Handling
| Project | GitHub | Why Use It |
|---------|--------|------------|
| React Dropzone | `react-dropzone/react-dropzone` | File uploads |
| React Image Crop | `DominicTobias/react-image-crop` | Image cropping |
| Browser Image Compression | - | Client-side compression |

### Code Editor
| Project | GitHub | Why Use It |
|---------|--------|------------|
| **Monaco Editor** | Already installed | Code editing |
| Sandpack | `codesandbox/sandpack` | Live code preview |

---

## Integration Strategy

### Phase 1: Core Migration (Puck)
1. Install Puck Editor
2. Create data migration script (Craft.js → Puck)
3. Update editor routes
4. Test with existing content

### Phase 2: Component Library
1. Migrate existing 35 components to Puck format
2. Add 65+ new components
3. Organize into categories
4. Create component documentation

### Phase 3: 3D Capabilities
1. Install React Three Fiber + Drei
2. Create 3D component primitives
3. Add Spline integration
4. Create 3D template examples

### Phase 4: AI Enhancement
1. Integrate Puck AI plugin
2. Build custom AI prompts
3. Add generation wizards
4. Implement optimization suggestions

### Phase 5: Settings Overhaul
1. Create settings schema
2. Build unified settings UI
3. Migrate existing settings
4. Add new capabilities

---

# APPENDIX F: Error Handling & User Feedback System

## Overview

Enterprise-grade error handling requires a multi-layered approach covering:
- Client-side error boundaries
- Server action error handling
- API response standardization
- User-friendly error messages
- Toast/notification system
- Form validation feedback
- Loading & empty states
- Offline handling
- Error logging & monitoring

---

## 1. Error Boundary Architecture

### Global Error Boundary
```typescript
// src/components/error-boundary/global-error-boundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Send to Sentry, LogRocket, etc.
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {}); // Silent fail for logging
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-8">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Module-Level Error Boundary
```typescript
// src/components/error-boundary/module-error-boundary.tsx
'use client';

export function ModuleErrorBoundary({ 
  children, 
  moduleName 
}: { 
  children: ReactNode; 
  moduleName: string;
}) {
  return (
    <GlobalErrorBoundary
      fallback={
        <div className="p-8 border border-destructive/20 rounded-lg bg-destructive/5">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <h3 className="font-semibold">Error in {moduleName}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This module encountered an error. The rest of the dashboard is still functional.
          </p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reload Module
          </Button>
        </div>
      }
    >
      {children}
    </GlobalErrorBoundary>
  );
}
```

---

## 2. Server Action Error Handling

### Standardized Result Type
```typescript
// src/lib/types/result.ts
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ActionError };

export interface ActionError {
  code: ErrorCode;
  message: string;
  details?: Record<string, string[]>; // For validation errors
  field?: string; // For field-specific errors
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';

// Error factory functions
export const Errors = {
  validation: (message: string, details?: Record<string, string[]>): ActionError => ({
    code: 'VALIDATION_ERROR',
    message,
    details,
  }),
  notFound: (resource: string): ActionError => ({
    code: 'NOT_FOUND',
    message: `${resource} not found`,
  }),
  unauthorized: (): ActionError => ({
    code: 'UNAUTHORIZED',
    message: 'You must be logged in to perform this action',
  }),
  forbidden: (action?: string): ActionError => ({
    code: 'FORBIDDEN',
    message: action ? `You don't have permission to ${action}` : 'Access denied',
  }),
  conflict: (message: string): ActionError => ({
    code: 'CONFLICT',
    message,
  }),
  rateLimited: (retryAfter?: number): ActionError => ({
    code: 'RATE_LIMITED',
    message: retryAfter 
      ? `Too many requests. Please try again in ${retryAfter} seconds`
      : 'Too many requests. Please slow down',
  }),
  server: (message = 'An unexpected error occurred'): ActionError => ({
    code: 'SERVER_ERROR',
    message,
  }),
};
```

### Server Action Pattern
```typescript
// src/lib/actions/example-actions.ts
'use server';

import { ActionResult, Errors } from '@/lib/types/result';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  siteId: z.string().uuid('Invalid site ID'),
});

export async function createPost(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    // 1. Authentication check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: Errors.unauthorized() };
    }

    // 2. Input validation
    const rawData = Object.fromEntries(formData);
    const parsed = createPostSchema.safeParse(rawData);
    
    if (!parsed.success) {
      return {
        success: false,
        error: Errors.validation(
          'Please fix the errors below',
          parsed.error.flatten().fieldErrors
        ),
      };
    }

    // 3. Authorization check
    const hasAccess = await checkSiteAccess(user.id, parsed.data.siteId);
    if (!hasAccess) {
      return { success: false, error: Errors.forbidden('create posts for this site') };
    }

    // 4. Business logic
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...parsed.data, user_id: user.id })
      .select('id')
      .single();

    if (error) {
      // Handle specific DB errors
      if (error.code === '23505') {
        return { success: false, error: Errors.conflict('A post with this title already exists') };
      }
      throw error; // Let catch block handle unknown errors
    }

    return { success: true, data: { id: data.id } };

  } catch (error) {
    console.error('createPost error:', error);
    return { success: false, error: Errors.server() };
  }
}
```

---

## 3. Toast/Notification System

### Toast Provider
```typescript
// src/components/ui/toast-provider.tsx
'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: 'group border-border bg-background text-foreground',
          title: 'text-foreground font-semibold',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error: 'border-destructive/50 bg-destructive/10',
          success: 'border-green-500/50 bg-green-500/10',
          warning: 'border-yellow-500/50 bg-yellow-500/10',
          info: 'border-blue-500/50 bg-blue-500/10',
        },
      }}
      expand={false}
      richColors
      closeButton
    />
  );
}
```

### Toast Utility Functions
```typescript
// src/lib/toast.ts
import { toast } from 'sonner';
import { ActionError } from '@/lib/types/result';

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },

  error: (error: ActionError | string) => {
    const message = typeof error === 'string' ? error : error.message;
    toast.error('Error', { 
      description: message,
      duration: 6000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  action: (
    message: string,
    action: { label: string; onClick: () => void },
    description?: string
  ) => {
    toast(message, {
      description,
      action: {
        label: action.label,
        onClick: action.onClick,
      },
    });
  },

  // Undo pattern for destructive actions
  undo: (
    message: string,
    onUndo: () => void,
    duration = 5000
  ) => {
    toast(message, {
      duration,
      action: {
        label: 'Undo',
        onClick: onUndo,
      },
    });
  },
};
```

### Usage in Components
```typescript
// Example: Delete with undo
async function handleDelete(postId: string) {
  // Optimistically update UI
  setDeletedPostId(postId);
  
  // Show undo toast
  showToast.undo('Post deleted', () => {
    setDeletedPostId(null);
    // Optionally cancel the delete
  });
  
  // Execute delete after toast duration
  setTimeout(async () => {
    if (deletedPostId === postId) {
      const result = await deletePost(postId);
      if (!result.success) {
        setDeletedPostId(null);
        showToast.error(result.error);
      }
    }
  }, 5000);
}
```

---

## 4. Form Validation & Error Display

### Field-Level Error Display
```typescript
// src/components/ui/form-field.tsx
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  name,
  error,
  required,
  description,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className={cn(
          'text-sm font-medium',
          error && 'text-destructive'
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {children}
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
```

### Form-Level Error Summary
```typescript
// src/components/ui/form-error-summary.tsx
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormErrorSummaryProps {
  errors: Record<string, string[]>;
  onDismiss?: () => void;
}

export function FormErrorSummary({ errors, onDismiss }: FormErrorSummaryProps) {
  const errorList = Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((msg) => ({ field, message: msg }))
  );

  if (errorList.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-destructive">
            Please fix {errorList.length} error{errorList.length > 1 ? 's' : ''} below
          </h3>
          <ul className="mt-2 text-sm text-destructive/90 list-disc list-inside space-y-1">
            {errorList.map((err, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById(err.field)?.focus();
                  }}
                  className="hover:underline"
                >
                  {err.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## 5. Loading States

### Skeleton Components
```typescript
// src/components/ui/skeletons.tsx
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ))}
    </div>
  );
}
```

### Loading Button States
```typescript
// src/components/ui/loading-button.tsx
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  loading,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

---

## 6. Empty States

### Empty State Component
```typescript
// src/components/ui/empty-state.tsx
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <div className="flex gap-3">
          <Button onClick={action.onClick}>
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Contextual Empty States
```typescript
// Usage examples
<EmptyState
  icon={FileText}
  title="No posts yet"
  description="Create your first blog post to get started with your content strategy."
  action={{
    label: 'Create Post',
    onClick: () => router.push('/posts/new'),
    icon: Plus,
  }}
  secondaryAction={{
    label: 'Import Content',
    onClick: () => setShowImport(true),
  }}
/>

<EmptyState
  icon={Search}
  title="No results found"
  description="We couldn't find anything matching your search. Try different keywords."
  action={{
    label: 'Clear Search',
    onClick: () => setSearch(''),
  }}
/>

<EmptyState
  icon={Filter}
  title="No matching items"
  description="No items match your current filters. Try adjusting or clearing them."
  action={{
    label: 'Clear Filters',
    onClick: () => clearFilters(),
  }}
/>
```

---

## 7. Warning & Confirmation Dialogs

### Confirmation Dialog
```typescript
// src/components/ui/confirm-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading,
}: ConfirmDialogProps) {
  const Icon = variant === 'destructive' ? Trash2 : 
               variant === 'warning' ? AlertTriangle : 
               AlertCircle;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn(
              'rounded-full p-2',
              variant === 'destructive' && 'bg-destructive/10',
              variant === 'warning' && 'bg-yellow-500/10',
              variant === 'default' && 'bg-muted'
            )}>
              <Icon className={cn(
                'h-5 w-5',
                variant === 'destructive' && 'text-destructive',
                variant === 'warning' && 'text-yellow-600',
                variant === 'default' && 'text-muted-foreground'
              )} />
            </div>
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              variant === 'destructive' && 'bg-destructive hover:bg-destructive/90'
            )}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Unsaved Changes Warning
```typescript
// src/hooks/use-unsaved-changes.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useBeforeUnload } from 'react-use';

export function useUnsavedChanges(hasChanges: boolean, message?: string) {
  const defaultMessage = 'You have unsaved changes. Are you sure you want to leave?';

  // Browser navigation warning
  useBeforeUnload(hasChanges, message || defaultMessage);

  // Next.js navigation warning
  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message || defaultMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, message]);
}
```

---

## 8. Offline Handling

### Offline Indicator
```typescript
// src/components/ui/offline-indicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className={cn(
      'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all',
      isOnline 
        ? 'bg-green-500/10 border border-green-500/20 text-green-600' 
        : 'bg-destructive/10 border border-destructive/20 text-destructive'
    )}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline</span>
        </>
      )}
    </div>
  );
}
```

---

## 9. Rate Limiting Feedback

### Rate Limit Handler
```typescript
// src/lib/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Usage in client
export function useRateLimitedAction(
  action: () => Promise<void>,
  limit: number = 5,
  windowMs: number = 60000
) {
  const [remaining, setRemaining] = useState(limit);
  const [resetAt, setResetAt] = useState<Date | null>(null);

  const execute = useCallback(async () => {
    if (remaining <= 0) {
      showToast.warning(
        'Slow down',
        `Please wait ${Math.ceil((resetAt!.getTime() - Date.now()) / 1000)} seconds`
      );
      return;
    }

    setRemaining((r) => r - 1);
    await action();
  }, [action, remaining, resetAt]);

  return { execute, remaining, isLimited: remaining <= 0 };
}
```

---

## 10. Error Logging & Monitoring

### Client Error Logger
```typescript
// src/lib/error-logger.ts
interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class ErrorLogger {
  private queue: ErrorLog[] = [];
  private isProcessing = false;

  log(error: Error, metadata?: Record<string, unknown>) {
    const log: ErrorLog = {
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.queue.push(log);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const logs = [...this.queue];
    this.queue = [];

    try {
      await fetch('/api/log-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: logs }),
      });
    } catch {
      // Re-queue failed logs
      this.queue.push(...logs);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const errorLogger = new ErrorLogger();
```

### API Error Logging Endpoint
```typescript
// src/app/api/log-errors/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { errors } = await req.json();

    // Log to your monitoring service
    // Examples: Sentry, LogRocket, Datadog, etc.
    
    // For now, log to console in production
    if (process.env.NODE_ENV === 'production') {
      errors.forEach((error: unknown) => {
        console.error('[CLIENT ERROR]', JSON.stringify(error));
      });
    }

    // Optionally store in database for analysis
    // await supabase.from('error_logs').insert(errors);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging failed:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

---

## Implementation Phases

### PHASE-EH-01: Core Error Infrastructure
```
Implement:
- ActionResult type and Errors factory
- GlobalErrorBoundary component
- ModuleErrorBoundary component
- Error logging API endpoint
```

### PHASE-EH-02: Toast/Notification System
```
Implement:
- ToastProvider with Sonner
- showToast utility functions
- Undo pattern for destructive actions
- Promise toasts for async operations
```

### PHASE-EH-03: Form Validation UI
```
Implement:
- FormField component with error states
- FormErrorSummary component
- Field-level validation display
- Accessible error announcements
```

### PHASE-EH-04: Loading & Empty States
```
Implement:
- Skeleton component library
- LoadingButton component
- EmptyState component variations
- Page-level loading states
```

### PHASE-EH-05: Dialogs & Warnings
```
Implement:
- ConfirmDialog component
- Unsaved changes hook
- Destructive action confirmations
- Session timeout warning
```

### PHASE-EH-06: Offline & Rate Limiting
```
Implement:
- OfflineIndicator component
- Rate limit feedback
- Retry mechanisms
- Optimistic updates with rollback
```

---

**END OF MASTER BUILD PROMPT V2.0**

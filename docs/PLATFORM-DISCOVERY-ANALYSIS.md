# DRAMAC CMS - Platform Discovery Analysis

**Generated**: January 30, 2026  
**Based On**: Comprehensive codebase analysis and memory bank review  
**Purpose**: Complete platform understanding for UI/UX implementation planning

---

## EXECUTIVE SUMMARY

DRAMAC CMS is an **enterprise multi-tenant SaaS platform** designed for digital agencies to manage websites, clients, and business modules. Unlike simple website builders, DRAMAC is a **platform-as-a-service** that combines visual website building (Craft.js), a module marketplace, and white-label capabilities into a cohesive product. The platform follows a strict hierarchy: Platform → Agencies → Clients → Sites → Pages → Modules.

The platform differentiates itself from competitors like GoHighLevel by offering an **infinite module marketplace** where developers can build any business application as a module. Agencies subscribe to modules at wholesale prices and can resell to clients with markup. The current codebase shows 76% completion of enterprise phases (26 of 34), with core infrastructure, 5 business modules (CRM, Booking, E-Commerce, Social Media, Automation), and an AI Agents system fully implemented.

Key technical decisions include Next.js 16 with App Router, Supabase (PostgreSQL + Auth), Paddle for billing (replacing LemonSqueezy for Zambia payout support), and a schema-per-module database architecture. The platform is TypeScript-strict with zero compilation errors and passing builds.

---

## SECTION 1: USER PERSONAS

### 1.1 Complete Persona Cards

```
PERSONA: Super Admin (Platform Owner)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Description: Platform owner with full system access for administration
Business Context: Manages the DRAMAC platform itself, not individual agencies
Technical Skill Level: Advanced (technical background required)
Primary Goals: 
  - Monitor platform health and performance
  - Manage all agencies and users
  - Approve modules for marketplace
  - Handle billing and subscriptions at platform level
Secondary Goals:
  - Analyze platform-wide analytics
  - Manage audit logs and security
  - Configure system settings
Pain Points: 
  - Need visibility into all agency operations
  - Module approval workflow management
Success Metrics:
  - Active agencies count
  - Platform revenue
  - Module marketplace health
  - Error rates and uptime
Frequency of Use: Daily
Access Level: Full platform access via /admin/* routes
```

```
PERSONA: Agency Owner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Description: Founder/owner of a digital agency using DRAMAC
Business Context: Runs an agency serving multiple clients with websites and business tools
Technical Skill Level: Intermediate (understands web concepts, not necessarily coding)
Primary Goals:
  - Manage multiple client accounts efficiently
  - Build and maintain client websites
  - Discover and deploy revenue-generating modules
  - Scale operations with team members
Secondary Goals:
  - White-label platform for brand consistency
  - Maximize module margins (wholesale→retail markup)
  - Track agency performance and client satisfaction
Pain Points:
  - Managing multiple client sites across different needs
  - Module discovery and ROI evaluation
  - Team coordination and approval workflows
Success Metrics:
  - Sites published
  - Module adoption rate
  - Revenue per client
  - Client retention
Frequency of Use: Daily
Access Level: Full agency access including billing, team, settings, all sites/clients
```

```
PERSONA: Agency Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Description: Senior team member with elevated permissions
Business Context: Manages day-to-day agency operations on behalf of owner
Technical Skill Level: Intermediate
Primary Goals:
  - Manage client accounts and sites
  - Coordinate team members' work
  - Handle module configurations
  - Review and approve content
Secondary Goals:
  - Monitor agency analytics
  - Manage team permissions
Pain Points:
  - Limited visibility compared to owner
  - Approval bottlenecks
Success Metrics:
  - Sites delivered on time
  - Content approval turnaround
Frequency of Use: Daily
Access Level: Most agency features except billing and ownership transfer
```

```
PERSONA: Agency Team Member
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Description: Designer, developer, or content creator at an agency
Business Context: Executes client work under supervision of admins/owner
Technical Skill Level: Varies (Beginner to Advanced depending on role)
Primary Goals:
  - Build and edit website pages
  - Create and manage content (blog, social)
  - Use assigned modules effectively
Secondary Goals:
  - Learn new modules and features
  - Collaborate with team
Pain Points:
  - Limited access can block work
  - Waiting for approvals
  - Learning curve for new modules
Success Metrics:
  - Tasks completed
  - Content quality
  - Page build efficiency
Frequency of Use: Daily
Access Level: Assigned sites only, content editing, limited settings
```

```
PERSONA: End Client (Client Portal User)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Description: Agency's customer who accesses their site via client portal
Business Context: Business owner who hired agency for website/marketing
Technical Skill Level: Beginner (non-technical)
Primary Goals:
  - View their website and performance
  - Make simple content edits (if permitted)
  - Access business modules (CRM, booking, etc.)
  - Submit support requests
Secondary Goals:
  - View analytics and reports
  - Review invoices
Pain Points:
  - Complex interface (simplified portal helps)
  - Limited understanding of features
  - Dependency on agency for changes
Success Metrics:
  - Business goals achieved (leads, sales)
  - Ease of use satisfaction
Frequency of Use: Weekly to Monthly
Access Level: Client portal only (/portal/*) with configurable permissions:
  - can_edit_content
  - can_view_analytics
  - can_view_invoices
  - has_portal_access
```

```
PERSONA: Site Visitor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Description: Anonymous visitor to a published website
Business Context: Potential customer browsing client's website
Technical Skill Level: N/A
Primary Goals:
  - Find information
  - Contact business
  - Make purchases (if e-commerce)
  - Book appointments (if booking module)
Secondary Goals:
  - Share content
  - Subscribe to updates
Pain Points:
  - Slow page loads
  - Confusing navigation
  - Broken features
Success Metrics:
  - Conversion rate
  - Time on site
  - Bounce rate
Frequency of Use: Variable
Access Level: Public pages only (/site/[domain]/* routes)
```

### 1.2 Persona Relationships

```
RELATIONSHIP MAP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCOUNT CREATION:
Super Admin → Creates platform (initial setup)
Platform → Creates Agency Owner (via signup)
Agency Owner → Creates Team Members (via invite)
Agency Owner/Admin → Creates Client accounts (optional portal access)

APPROVAL FLOWS:
Team Member → Admin/Owner (content approval, social posts)
Social Posts → Approval Workflow → Publisher
AI Agent Actions → Approval System → Execution

PAYMENT FLOWS:
Paddle ← Agency Owner (platform subscription)
Paddle ← Agency (module subscriptions - wholesale)
Agency ← End Client (module services - retail markup)

COMMUNICATION:
Client → Support Ticket → Agency (via portal)
Agency → Notifications → Client
Team Member → Comments → Admin (content review)
```

---

## SECTION 2: COMPLETE USER JOURNEYS

### 2.1 Onboarding Journeys

#### Journey A: New Agency Signup

```
STEP 1: Discovery
━━━━━━━━━━━━━━━━━━━━━━━━
Action: User lands on marketing site or /pricing
What Happens: Views platform benefits, pricing plans
What User Sees: Pricing comparison (Starter/Pro/Business), feature lists
Data Created: None (anonymous)

STEP 2: Signup Initiation
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /signup
Action: Enters email, password, name, organization name
What Happens: 
  - Supabase Auth creates user
  - Admin client creates agency record (bypasses RLS)
  - Admin client creates profile with role="admin"
  - Admin client creates agency_member with role="owner"
Data Created:
  - auth.users record
  - agencies record (with slug auto-generated)
  - profiles record (linked to agency)
  - agency_members record (ownership tracking)

STEP 3: Email Verification (if required)
━━━━━━━━━━━━━━━━━━━━━━━━
Route: Email → /auth/callback
What Happens: Supabase confirms email
What User Sees: Success message, redirect to onboarding

STEP 4: Onboarding Flow
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /onboarding
Action: Complete agency profile:
  - Industry selection
  - Team size
  - Goals (website building, CRM, marketing, etc.)
What Happens: Agency record updated with onboarding data
Data Updated: agencies.industry, agencies.team_size, agencies.goals

STEP 5: First Dashboard Access
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard
What User Sees: Empty dashboard with:
  - "Create your first site" CTA
  - "Browse modules" CTA
  - Quick stats (all zeros)
"Aha Moment": Creating first site and seeing visual editor
```

#### Journey B: Creating First Site

```
STEP 1: Initiate Site Creation
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard → "New Site" button → /sites/new
Action: Enter site details:
  - Name (required)
  - Subdomain (auto-suggested, must be unique)
  - Client selection (can create new or select existing)
  - Optional custom domain
Validation: Subdomain uniqueness check via checkSubdomain()

STEP 2: Site Record Creation
━━━━━━━━━━━━━━━━━━━━━━━━
What Happens: createSiteAction() executes:
  - Validates form data
  - Creates client if needed
  - Creates site record with agency_id, client_id
  - Creates default homepage (page record)
  - Redirects to site detail
Data Created:
  - clients record (if new client)
  - sites record (subdomain, published=false)
  - pages record (homepage, is_homepage=true)

STEP 3: Site Overview
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/sites/[siteId]
What User Sees: Site detail page with tabs:
  - Overview (stats, quick actions)
  - Pages (list with homepage)
  - Blog (empty)
  - Modules (available modules to enable)

STEP 4: Open Editor
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/sites/[siteId]/editor
What Happens: Craft.js visual editor loads
What User Sees: Drag-and-drop page builder with:
  - Component palette (left)
  - Canvas (center)
  - Properties panel (right)
Actions: Add sections, text, images, buttons

STEP 5: Save and Preview
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /preview/[siteId]/[pageId]
What Happens: Page content (JSON) saved to pages.content
What User Sees: Live preview of built page

STEP 6: Publish Site
━━━━━━━━━━━━━━━━━━━━━━━━
Action: Click "Publish" button
What Happens: 
  - sites.published = true
  - Site becomes accessible at {subdomain}.dramac.io
Data Updated: sites.published, sites.published_at
```

#### Journey C: Adding a Client

```
STEP 1: Navigate to Clients
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/clients
What User Sees: Client list (empty or populated)

STEP 2: Create Client
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard/clients → "Add Client" button
Action: Fill client form:
  - Name (required)
  - Email
  - Company name
  - Phone
  - Notes, tags
Data Created: clients record with agency_id

STEP 3: Enable Portal Access (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━
Action: Toggle portal settings:
  - has_portal_access = true
  - Set permissions (can_edit_content, can_view_analytics, can_view_invoices)
What Happens: Client receives invitation email
Data Updated: clients.has_portal_access, clients.portal_permissions

STEP 4: Client Portal Login
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /portal/login
What Happens: Client authenticates via Supabase
What Client Sees: Client portal dashboard with their sites, modules, support
```

#### Journey D: Team Member Onboarding

```
STEP 1: Navigate to Team Settings
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /settings/team
Who: Agency Owner or Admin

STEP 2: Send Invite
━━━━━━━━━━━━━━━━━━━━━━━━
Action: Enter email, select role (admin or member)
What Happens:
  - agency_members record created with status="pending"
  - Invitation email sent via Resend
Data Created: agency_members (user_id null until accepted)

STEP 3: Invite Acceptance
━━━━━━━━━━━━━━━━━━━━━━━━
Route: Email link → /auth/callback?invite=...
What Happens:
  - User creates account (if new) or logs in
  - agency_members.user_id updated
  - agency_members.status = "accepted"
  - profiles record created if new user

STEP 4: First Login
━━━━━━━━━━━━━━━━━━━━━━━━
Route: /dashboard
What Team Member Sees: Dashboard with access based on role:
  - Admin: Most features
  - Member: Assigned sites and limited settings
```

### 2.2 Core Daily Workflows

#### Workflow 1: Building a Website Page

```
WORKFLOW: Page Building
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: Need to create/edit content for a site
Actors: Agency Owner, Admin, Member (with site access)

Steps:
  1. Navigate to: /dashboard/sites/[siteId]
     Action: View site overview
     System Response: Site detail page loads with tabs
     
  2. Navigate to: /dashboard/sites/[siteId]/pages
     Action: Click "Add Page" or select existing page
     System Response: New page created or page selected
     Data Changed: pages record created (if new)
     
  3. Navigate to: /dashboard/sites/[siteId]/editor?pageId=[pageId]
     Action: Visual page building with Craft.js
     - Drag components from palette
     - Configure component properties
     - Arrange layout
     System Response: Real-time visual feedback
     
  4. Action: Click "Save"
     System Response: Page content (JSON) saved
     Data Changed: pages.content (JSON blob)
     
  5. Action: Click "Preview"
     Navigate to: /preview/[siteId]/[pageId]
     System Response: Rendered preview in new tab

End State: Page saved with visual content
Success Criteria: Preview shows expected layout
Error Scenarios:
  - Save fails (network error) → Toast notification
  - Invalid component config → Validation error
Time Estimate: 15-60 minutes per page
```

#### Workflow 2: Publishing a Site

```
WORKFLOW: Site Publishing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: Site ready for public access
Actors: Agency Owner, Admin

Steps:
  1. Navigate to: /dashboard/sites/[siteId]
     Prerequisite: At least one page exists
     
  2. Action: Review site settings
     Navigate to: /dashboard/sites/[siteId]/settings
     Check: Subdomain/custom domain configured
     Check: SEO settings complete
     
  3. Navigate to: /dashboard/sites/[siteId]/seo
     Action: Configure meta tags, OG images, sitemap
     
  4. Action: Click "Publish" button
     System Response: 
     - Confirmation dialog shown
     - sites.published = true
     - sites.published_at = now()
     - Cache revalidated
     
  5. Access: Site live at {subdomain}.dramac.io
     Or: Custom domain if configured

End State: Site publicly accessible
Success Criteria: Site loads correctly at public URL
Error Scenarios:
  - Domain not verified → Error message
  - No pages → Cannot publish
Time Estimate: 5 minutes
```

#### Workflow 3: Managing Media/Assets

```
WORKFLOW: Media Library Management
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: Need to upload, organize, or use images/files
Actors: All dashboard users

Steps:
  1. Navigate to: /dashboard/media
     System Response: Media library grid with folders
     
  2. Action: Upload files
     - Click "Upload" or drag-drop
     - Select files from computer
     System Response: Files uploaded to Supabase Storage
     Data Created: assets records with URLs, dimensions, size
     
  3. Action: Organize
     - Create folders
     - Move files between folders
     - Add tags for searchability
     
  4. Action: Use in editor
     - In page editor, select image component
     - Browse media library
     - Select asset
     System Response: Image URL inserted into page content

End State: Media organized and usable
Time Estimate: 5-15 minutes
```

#### Workflow 4: Module Management

```
WORKFLOW: Module Discovery → Installation → Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: Agency wants new functionality for sites
Actors: Agency Owner, Admin

Steps:
  1. Navigate to: /marketplace/v2
     Action: Browse module catalog
     System Response: Grid of available modules with:
       - Name, description, icon
       - Pricing (free, monthly, yearly)
       - Ratings, install count
       
  2. Action: View module details
     Navigate to: /marketplace/v2/[moduleId]
     System Response: Full module info:
       - Screenshots, features
       - Reviews, documentation
       - Pricing options
       
  3. Action: Subscribe to module
     - Free: POST /api/modules/subscribe
     - Paid: POST /api/modules/{moduleId}/purchase → Paddle checkout
     System Response: Checkout flow or immediate subscription
     Data Created: agency_module_subscriptions (status='active')
     
  4. Navigate to: /dashboard/sites/[siteId]
     Tab: Modules
     Action: Enable module for specific site
     System Response: site_module_installations record created
     Data Created: site_module_installations (is_enabled=true)
     
  5. Action: Configure module
     Navigate to: Module-specific settings page
     Example: /dashboard/sites/[siteId]/social/settings
     System Response: Module configuration UI

End State: Module active and usable on site
Success Criteria: Module tab/features appear in site dashboard
```

### 2.3 Module-Specific Workflows

#### Social Media Module Workflows

**1. Connecting a Social Account**
```
Route: /dashboard/sites/[siteId]/social/accounts
Steps:
1. Click "Connect Account"
2. Select platform (Facebook, Instagram, Twitter, etc.)
3. OAuth redirect to platform
4. Grant permissions
5. Callback with auth tokens
Data: social_accounts record with encrypted tokens
```

**2. Creating and Scheduling a Post**
```
Route: /dashboard/sites/[siteId]/social/compose
Steps:
1. Write content (platform-specific variants optional)
2. Attach media (from library or upload)
3. Select target platforms/accounts
4. Set schedule or "Post Now"
5. Submit for approval (if workflow enabled) or direct publish
Data: social_posts, social_publish_log
```

**3. Managing Content Calendar**
```
Route: /dashboard/sites/[siteId]/social/calendar
Features:
- Month/week/list views
- Drag-drop rescheduling
- Filter by platform, status
- Optimal time suggestions
```

**4. Responding to Messages (Inbox)**
```
Route: /dashboard/sites/[siteId]/social/inbox
Features:
- Unified view: comments, DMs, mentions
- Saved reply templates
- Bulk actions
- Read/unread tracking
```

**5. Campaigns**
```
Route: /dashboard/sites/[siteId]/social/campaigns
Features:
- Create campaign with goals, dates, budget
- Link posts to campaigns
- Track hashtag performance
- Goal progress visualization
```

**6. Analytics**
```
Route: /dashboard/sites/[siteId]/social/analytics
Features:
- Platform breakdown
- Best times to post
- Top performing posts
- Engagement heatmap
```

**7. Approval Workflows**
```
Route: /dashboard/sites/[siteId]/social/settings (Workflows tab)
Features:
- Define approval stages
- Assign approvers by role
- Pending approvals at /social/approvals
```

#### CRM Module Workflows

**1. Adding a Contact**
```
Route: /dashboard/sites/[siteId]/crm-module
Data Model: crm_contacts with:
- Personal info (name, email, phone)
- Company association
- Custom fields, tags
- Lead score, status
```

**2. Creating a Deal/Pipeline**
```
Features:
- Pipeline stages (customizable)
- Deal value, probability
- Expected close date
- Activity tracking
```

**3. Logging Interactions**
```
Data: crm_activities (calls, emails, meetings, notes)
Association: Contact, Company, or Deal
```

**4. Email Integration**
```
Integration: Resend for transactional emails
Templates: Handlebars-based
Tracking: Open rates, click tracking
```

#### E-Commerce Module Workflows

**1. Adding a Product**
```
Data Model: ecommerce_products with:
- Name, description, SKU
- Images (from media library)
- Pricing, variants
- Inventory tracking
```

**2. Order Processing**
```
States: pending → paid → processing → shipped → delivered
Actions: Update status, send notifications, handle refunds
```

#### Automation Module Workflows

**1. Creating an Automation**
```
Route: /dashboard/sites/[siteId]/automation/workflows
Features:
- Visual workflow builder
- Trigger selection (event-based, scheduled)
- Action configuration
- Conditional branching
```

**2. Available Triggers (19 events)**
- contact.created, contact.updated
- deal.created, deal.stage_changed, deal.won, deal.lost
- order.created, order.paid, order.shipped
- form.submitted
- booking.created, booking.cancelled
- post.published, post.scheduled
- email.opened, email.clicked
- custom webhooks

**3. Monitoring Runs**
```
Route: /dashboard/sites/[siteId]/automation/executions
Features: Execution history, success/failure status, logs
```

#### Booking Module Workflows

**1. Setting Availability**
```
Route: /dashboard/sites/[siteId]/booking
Features:
- Business hours by day
- Blocked time slots
- Buffer time between appointments
```

**2. Customer Booking Flow**
```
Widget: Embeddable booking form
Steps: Select service → Choose time → Enter details → Confirm
```

### 2.4 Administrative Workflows

#### Billing & Subscriptions

```
Agency Billing Routes:
- /settings/billing - Overview
- /settings/subscription - Plan management
- Paddle checkout for upgrades

Module Billing:
- agency_module_subscriptions tracks wholesale price
- Markup: percentage, fixed, or custom
- Client billing separate (agency manages)
```

#### Team Management

```
Route: /settings/team
Actions:
- Invite members (email + role)
- Modify roles (owner, admin, member)
- Remove access
- View activity log
```

---

## SECTION 3: DATA ARCHITECTURE & FLOWS

### 3.1 Entity Relationship Map

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

┌─────────────────────────────────────────────────────────────────┐
│                      MODULE DATA (per-module schema)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Schema: mod_crm         Schema: mod_social      Schema: mod_...│
│  ├─ contacts             ├─ social_accounts     ├─ ...         │
│  ├─ companies            ├─ social_posts                       │
│  ├─ deals                ├─ social_inbox_items                 │
│  ├─ pipelines            ├─ social_campaigns                   │
│  ├─ activities           ├─ social_analytics_daily             │
│  └─ custom_fields        └─ ...                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Creation Points

| Entity | Created By | Trigger | Lifecycle |
|--------|-----------|---------|-----------|
| `agencies` | Admin client | User signup | Active → (no delete UI) |
| `profiles` | Admin client | User signup/invite | Active → Deactivated |
| `agency_members` | Owner/Admin | Team invite | Pending → Accepted → Removed |
| `clients` | Owner/Admin | Manual creation | Active → Archived |
| `sites` | Owner/Admin/Member | "New Site" action | Draft → Published → Archived |
| `pages` | System/User | Site creation (homepage) or user | Draft → Published |
| `modules_v2` | Super Admin | Module registration | Draft → Published → Deprecated |
| `agency_module_subscriptions` | System | Paddle checkout/free subscribe | Active → Cancelled |
| `site_module_installations` | Owner/Admin | Module enable toggle | Enabled → Disabled |
| `social_posts` | Team | Compose action | Draft → Scheduled → Published/Failed |
| `crm_contacts` | Team/Form | Manual/Import/Webhook | Active → Archived |

### 3.3 Permission Model

```
PERMISSION MATRIX:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Action                    | Super Admin | Agency Owner | Admin | Member | Client
--------------------------|-------------|--------------|-------|--------|--------
Platform Admin Access     |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
Create Agency             |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
Delete Agency             |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
View All Agencies         |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
Approve Modules           |     ✓       |      ✗       |   ✗   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Agency Billing            |     ✓       |      ✓       |   ✗   |   ✗    |   ✗
Team Management           |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Module Subscriptions      |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Agency Settings           |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
White-Label Config        |     ✓       |      ✓       |   ✗   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Create Client             |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Create Site               |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Delete Site               |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Edit Site                 |     ✓       |      ✓       |   ✓   |   ✓    |   ✗*
Publish Site              |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
Enable Module for Site    |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Edit Pages                |     ✓       |      ✓       |   ✓   |   ✓    |   ✗*
Upload Media              |     ✓       |      ✓       |   ✓   |   ✓    |   ✓*
Create Blog Posts         |     ✓       |      ✓       |   ✓   |   ✓    |   ✗*
--------------------------|-------------|--------------|-------|--------|--------
CRM Access                |     ✓       |      ✓       |   ✓   |   ✓    |   ✗
Social Media Access       |     ✓       |      ✓       |   ✓   |   ✓    |   ✗
Approve Social Posts      |     ✓       |      ✓       |   ✓   |   ✗    |   ✗
--------------------------|-------------|--------------|-------|--------|--------
Client Portal Access      |     ✗       |      ✗       |   ✗   |   ✗    |   ✓
Submit Support Ticket     |     ✗       |      ✗       |   ✗   |   ✗    |   ✓
View Own Site Analytics   |     ✗       |      ✗       |   ✗   |   ✗    |   ✓*

*Client permissions are configurable per-client (can_edit_content, can_view_analytics, etc.)
```

### 3.4 State Machines

```
SITE STATES:
━━━━━━━━━━━━━━━━━━━━━━━━
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

POST STATES (Social Media):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

ORDER STATES (E-Commerce):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────┐
│ PENDING │
└────┬────┘
     │ payment_received()
     ▼
┌─────────┐
│  PAID   │
└────┬────┘
     │ start_processing()
     ▼
┌────────────┐     cancel()     ┌───────────┐
│ PROCESSING │─────────────────▶│ CANCELLED │
└─────┬──────┘                  └───────────┘
      │ ship()
      ▼
┌──────────┐
│ SHIPPED  │
└────┬─────┘
     │ delivered()
     ▼
┌───────────┐     refund()     ┌──────────┐
│ DELIVERED │─────────────────▶│ REFUNDED │
└─────┬─────┘                  └──────────┘
      │ complete()
      ▼
┌───────────┐
│ COMPLETED │
└───────────┘

AI AGENT EXECUTION STATES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────┐
│ PENDING │
└────┬────┘
     │ start()
     ▼
┌─────────┐
│ RUNNING │
└────┬────┘
     │
┌────┴────────────────────┐
▼                         ▼
┌──────────────┐    ┌──────────┐
│AWAITING_APPR │    │ (direct) │
│    OVAL      │    │          │
└──────┬───────┘    └────┬─────┘
       │ approve/deny    │
       ▼                 │
  ┌─────────┬────────────┘
  │         │
  ▼         ▼
┌─────────┐ ┌────────┐ ┌─────────┐
│COMPLETED│ │ FAILED │ │CANCELLED│
└─────────┘ └────────┘ └─────────┘
```

---

## SECTION 4: FEATURE INTERACTION MAP

### 4.1 Feature Dependencies

```
DEPENDENCY TREE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Page Editor
├── requires: Media Library (for images)
├── requires: Sites system (context)
└── uses: Craft.js components

Blog System
├── requires: Sites system
├── requires: TipTap editor
└── optional: Media Library

Social Media Module
├── requires: Module subscription system
├── requires: Site-level installation
├── requires: OAuth tokens (platform auth)
├── uses: Media Library (for post images)
└── integrates with: Automation (triggers)

CRM Module
├── requires: Module subscription system
├── requires: Site-level installation
├── integrates with: E-Commerce (customers)
├── integrates with: Automation (triggers)
└── integrates with: Email (Resend)

E-Commerce Module
├── requires: Module subscription system
├── requires: Payment integration (Stripe for stores)
├── integrates with: CRM (customer records)
└── integrates with: Automation (order events)

Automation Module
├── requires: Trigger sources (CRM, E-Commerce, Social, Forms)
├── requires: Action handlers
└── integrates with: AI Agents (optional)

AI Agents
├── requires: LLM provider (Anthropic API key)
├── requires: Automation events (triggers)
├── uses: Tool system (built-in tools)
└── requires: Approval system (for risky actions)

Booking Module
├── requires: Module subscription
├── requires: Calendar component
├── integrates with: CRM (customer records)
└── integrates with: Automation (events)
```

### 4.2 Cross-Module Interactions

```
CROSS-MODULE DATA FLOWS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRM ↔ E-Commerce:
  - E-commerce customer → Creates/updates CRM contact
  - CRM contact can be linked to orders
  - Shared customer data (name, email, history)

Social ↔ CRM:
  - Social mentions → Create CRM activity
  - Social leads → Create CRM contact
  - Contact social profiles in CRM

Automation ↔ All Modules:
  - Listen for events from any module
  - Trigger actions in any module
  - Cross-module workflow orchestration

AI Agents ↔ Automation:
  - Agent execution triggered by automation events
  - Agent actions can trigger automation workflows
  - Event types supported: 19 events

Forms ↔ CRM:
  - Form submission → Create contact
  - Lead capture integration

Booking ↔ CRM:
  - Booking creates/links to contact
  - Appointment history on contact record

Booking ↔ E-Commerce:
  - Paid booking services
  - Service as product type
```

### 4.3 Integration Points

```
EXTERNAL SERVICES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Supabase (Core Infrastructure):
  - PostgreSQL database
  - Authentication (email, OAuth)
  - Row Level Security (RLS)
  - Storage (media library)
  - Realtime (future)

Paddle (Primary Billing):
  - Platform subscriptions
  - Module purchases
  - Invoicing
  - Webhook events (subscription changes)
  - Zambia payouts via Payoneer/Wise

Resend (Email):
  - Transactional emails
  - Team invitations
  - Password reset
  - Notifications
  - Template: Handlebars

Social Platforms (OAuth):
  - Facebook/Meta
  - Instagram
  - Twitter/X
  - LinkedIn
  - TikTok
  - YouTube
  - Pinterest
  - Threads
  - Bluesky
  - Mastodon

AI Providers:
  - Anthropic (Claude 3.5 Sonnet, Claude Opus)
  - OpenAI (GPT-4o, GPT-4o-mini)

Vercel (Hosting):
  - Platform deployment
  - Edge functions
  - Analytics
```

---

## SECTION 5: NAVIGATION & INFORMATION ARCHITECTURE

### 5.1 Complete Route Map

#### Auth Routes (`/login`, `/signup`, etc.)
```
/login                     - User login form
/signup                    - New agency registration
/forgot-password          - Password reset request
/reset-password           - Password reset completion
/onboarding              - Post-signup agency setup
/auth/callback           - OAuth callback handler
```

#### Dashboard Routes (`/dashboard/*`)
```
/dashboard                           - Main dashboard (stats, quick actions)
├── /dashboard/sites                 - Sites list
│   ├── /dashboard/sites/new         - Create new site
│   └── /dashboard/sites/[siteId]    - Site detail
│       ├── /pages                   - Page list
│       ├── /editor                  - Visual page builder
│       ├── /blog                    - Blog management
│       ├── /seo                     - SEO settings
│       ├── /settings                - Site settings
│       ├── /builder                 - Page builder
│       ├── /submissions             - Form submissions
│       │
│       ├── /social                  - Social Media Module ⭐
│       │   ├── /accounts            - Connected accounts
│       │   ├── /analytics           - Performance analytics
│       │   ├── /approvals           - Pending approvals
│       │   ├── /calendar            - Content calendar
│       │   ├── /campaigns           - Campaign management
│       │   ├── /compose             - Create post
│       │   ├── /inbox               - Social inbox
│       │   └── /settings            - Module settings
│       │
│       ├── /automation              - Automation Module ⭐
│       │   ├── /workflows           - Workflow builder
│       │   ├── /templates           - Workflow templates
│       │   ├── /executions          - Run history
│       │   ├── /analytics           - Performance
│       │   └── /connections         - External connections
│       │
│       ├── /ai-agents               - AI Agents ⭐
│       │   ├── /marketplace         - Agent templates
│       │   ├── /analytics           - Agent analytics
│       │   ├── /testing             - Test agents
│       │   ├── /usage               - Usage & billing
│       │   ├── /approvals           - Pending approvals
│       │   ├── /new                 - Create agent
│       │   └── /[agentId]           - Agent detail
│       │
│       ├── /crm-module              - CRM Module ⭐
│       ├── /booking                 - Booking Module ⭐
│       └── /ecommerce               - E-Commerce Module ⭐
│
├── /dashboard/clients               - Client management
├── /dashboard/media                 - Media library
├── /dashboard/billing               - Billing overview
├── /dashboard/notifications         - User notifications
├── /dashboard/support               - Support tickets
│
├── /dashboard/crm                   - Agency-level CRM (?)
└── /dashboard/modules               - Installed modules list
```

#### Marketplace Routes (`/marketplace/*`)
```
/marketplace                         - Marketplace home
├── /marketplace/v2                  - Module catalog (enhanced)
│   └── /marketplace/v2/[moduleId]   - Module details
├── /marketplace/collections         - Module collections
├── /marketplace/developers          - Developer info
├── /marketplace/installed           - My installed modules
└── /marketplace/success             - Post-purchase confirmation
```

#### Settings Routes (`/settings/*`)
```
/settings                            - Settings overview
├── /settings/profile                - User profile
├── /settings/security               - Password, 2FA
├── /settings/agency                 - Agency settings
├── /settings/branding               - Custom branding
├── /settings/billing                - Payment methods
├── /settings/subscription           - Plan management
├── /settings/team                   - Team members
├── /settings/domains                - Custom domains
├── /settings/modules                - Module settings
├── /settings/notifications          - Notification prefs
└── /settings/activity               - Activity log
```

#### Admin Routes (`/admin/*`) - Super Admin Only
```
/admin                               - Admin dashboard
├── /admin/agencies                  - All agencies
├── /admin/users                     - All users
├── /admin/modules                   - Module management
├── /admin/analytics                 - Platform analytics
├── /admin/billing                   - Platform billing
├── /admin/subscriptions             - Subscription management
├── /admin/activity                  - Activity logs
├── /admin/audit                     - Audit trail
├── /admin/health                    - System health
└── /admin/settings                  - Platform settings
```

#### Client Portal Routes (`/portal/*`)
```
/portal                              - Portal dashboard
├── /portal/login                    - Client login
├── /portal/verify                   - Email verification
├── /portal/sites                    - Client's sites
│   └── /portal/sites/[siteId]       
│       └── /portal/sites/[siteId]/apps - Module access
├── /portal/apps                     - Installed modules
├── /portal/media                    - Media library
├── /portal/blog                     - Blog management
├── /portal/seo                      - SEO settings
├── /portal/analytics                - Site analytics
├── /portal/submissions              - Form submissions
├── /portal/invoices                 - Billing history
├── /portal/notifications            - Notifications
├── /portal/settings                 - Account settings
└── /portal/support                  - Support tickets
```

#### Public Routes
```
/site/[domain]/[...slug]             - Published site pages
/blog/[subdomain]/[slug]             - Published blog posts
/preview/[siteId]/[pageId]           - Page preview
/embed/module.js                     - Module embed script
/pricing                             - Public pricing page
```

### 5.2 Navigation Structure

```
MAIN DASHBOARD NAVIGATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────┐
│ DRAMAC (Logo)                    [Notifications] [👤]│
├─────────────────────────────────────────────────────┤
│                                                     │
│  MAIN NAV (Sidebar)          CONTENT AREA          │
│  ─────────────────           ────────────          │
│  ▶ Dashboard                 Current page content   │
│  ▶ Sites                                           │
│  ▶ Clients                                         │
│  ▶ Media Library                                   │
│  ▶ Marketplace                                     │
│  ─────────────                                     │
│  ▶ Settings                                        │
│  ▶ Billing                                         │
│  ─────────────                                     │
│  [Admin] (if super_admin)                          │
│                                                     │
└─────────────────────────────────────────────────────┘

SITE DETAIL PAGE NAVIGATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────┐
│ ← Back to Sites    Site Name    [SEO] [Settings]   │
│                                 [Automation*][AI*]  │
│                                 [Social*][CRM*]     │
│                                 [Editor] [Publish]  │
├─────────────────────────────────────────────────────┤
│ Tabs: Overview | Pages | Blog | Modules | [CRM*] | [Social*] │
├─────────────────────────────────────────────────────┤
│                                                     │
│              Tab Content Area                       │
│                                                     │
└─────────────────────────────────────────────────────┘

*Conditional - only shown if module is enabled for site

SOCIAL MODULE NAVIGATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────┐
│ Social Media Management          [Back to Site]     │
├─────────────────────────────────────────────────────┤
│  NAV (Sidebar)            │    CONTENT AREA        │
│  ─────────────            │    ────────────        │
│  ▶ Dashboard              │                        │
│  ▶ Calendar               │    Current view        │
│  ▶ Compose                │                        │
│  ▶ Inbox                  │                        │
│  ▶ Accounts               │                        │
│  ▶ Analytics              │                        │
│  ▶ Campaigns              │                        │
│  ▶ Approvals              │                        │
│  ▶ Settings               │                        │
└─────────────────────────────────────────────────────┘
```

### 5.3 User Flow Diagrams

#### New User → First Published Site
```
[Landing Page] → [Signup Form] → [Email Verify]* → [Onboarding]
        │                                               │
        │                                               ▼
        │                                    [Dashboard (empty)]
        │                                               │
        │                                               ▼
        │                                      [Create Site]
        │                                               │
        │                                               ▼
        └────────────────────────────────────► [Site Detail]
                                                       │
                                                       ▼
                                                [Open Editor]
                                                       │
                                                       ▼
                                                [Build Pages]
                                                       │
                                                       ▼
                                              [Preview] ──► [Publish]
                                                               │
                                                               ▼
                                                      [Site is LIVE! 🎉]
```

#### Module Activation Flow
```
[Marketplace] → [Module Detail] → [Subscribe/Purchase]
       │                                    │
       │              ┌─────────────────────┘
       │              │
       │    ┌─────────┴─────────┐
       │    ▼                   ▼
       │ [Free Module]     [Paid Module]
       │    │                   │
       │    │                   ▼
       │    │           [Paddle Checkout]
       │    │                   │
       │    │                   ▼
       │    └────────┬──────────┘
       │             │
       │             ▼
       │    [Subscription Created]
       │             │
       │             ▼
       │    [Site Detail → Modules Tab]
       │             │
       │             ▼
       │    [Enable Module for Site]
       │             │
       │             ▼
       └────► [Module Tab Appears + Routes Accessible]
```

---

## SECTION 6: CURRENT STATE ANALYSIS

### 6.1 What Works Well

**1. Multi-Tenant Architecture** ✅
- RLS policies enforce data isolation
- Agency → Client → Site hierarchy is solid
- Works: All queries respect tenant boundaries

**2. Module Access Control System** ✅
- `getSiteEnabledModules()` properly gates UI
- Route guards prevent unauthorized access
- Flow: Subscribe → Enable → Access

**3. Social Media Module** ✅
- Complete feature set (compose, calendar, inbox, analytics, campaigns, approvals)
- 10 platforms supported
- Proper state management

**4. AI Agents System** ✅
- Full infrastructure (LLM, memory, tools, runtime)
- 12 pre-built templates
- Usage tracking and billing tiers

**5. Automation Engine** ✅
- 19 event types supported
- Visual workflow builder
- Cross-module triggers

**6. TypeScript Strictness** ✅
- Zero compilation errors
- Builds pass consistently
- Types for all major entities

### 6.2 What Needs Improvement

| Issue | Impact | Complexity | Notes |
|-------|--------|------------|-------|
| Page Builder (Craft.js) limitations | High | High | Planning Puck Editor migration |
| UI/UX inconsistency | Medium | Medium | Master Build Prompt V2 addresses this |
| Module external API integrations | High | High | OAuth for social platforms not implemented |
| E-Commerce payment gateway | High | Medium | Stripe integration for client stores |
| Real-time features | Low | Medium | Supabase realtime not utilized |
| Mobile responsiveness | Medium | Medium | Dashboard needs responsive work |
| Error handling UX | Medium | Low | Need better toast/error UI |
| Onboarding flow | Medium | Low | Could be more guided |

### 6.3 Missing Features

**Industry Standard (Expected):**
- Two-factor authentication (2FA)
- Comprehensive audit logging UI
- Export/import for all entities
- Bulk operations UI
- Advanced search/filtering

**User-Requested (Inferred):**
- Dashboard customization
- Custom module fields
- API documentation portal
- Webhook testing UI
- Dark mode toggle

**Competitor Parity:**
- Real-time collaboration (Figma-style)
- Version history for pages
- A/B testing
- Advanced analytics dashboards
- White-label mobile app

### 6.4 Technical Debt

**1. Inconsistent Patterns:**
- Some modules use schema-qualified tables, others flat
- Mix of Server Actions and API routes for similar operations
- Component organization varies by module

**2. Code Quality:**
- `// eslint-disable-next-line @typescript-eslint/no-explicit-any` casts
- Some long files (database.ts is 10,000+ lines)
- Missing tests

**3. Architecture:**
- LemonSqueezy code still present (deprecated)
- Some duplicate type definitions
- No GraphQL layer (might benefit scale)

---

## SECTION 7: BUSINESS LOGIC DOCUMENTATION

### 7.1 Pricing & Billing Logic

```
PLATFORM SUBSCRIPTION TIERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Tier         | Price    | Sites | Clients | Team | Features              |
|--------------|----------|-------|---------|------|-----------------------|
| Free         | $0       | 1     | 2       | 1    | Basic page builder    |
| Starter      | $29/mo   | 5     | 10      | 3    | + Modules access      |
| Professional | $99/mo   | 20    | 50      | 10   | + White-label         |
| Enterprise   | Custom   | ∞     | ∞       | ∞    | + Custom development  |

MODULE PRICING MODEL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Agency pays WHOLESALE price to platform
   - Monthly or yearly subscription
   - Managed via Paddle

2. Agency sets RETAIL price for clients
   - Markup types: percentage, fixed, custom
   - markup_type: 'percentage' | 'fixed' | 'custom'
   - markup_value: number (percentage) or amount

3. Client billing handled by agency
   - Platform doesn't handle agency→client billing
   - Agency responsible for client payments

BILLING TRIGGERS:
- Platform subscription: Monthly/yearly renewal via Paddle
- Module subscription: On subscribe + renewal
- Overage: Usage-based (AI agents)
```

### 7.2 Access Control Logic

```
BEYOND ROLES - BUSINESS RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PLAN-BASED RESTRICTIONS:
   - Free plan: Limited to 1 site, 2 clients
   - Check: agencies.max_sites, agencies.max_users
   - Enforced at: Site creation, team invite

2. MODULE-BASED RESTRICTIONS:
   - Module must be subscribed (agency_module_subscriptions)
   - Module must be enabled for site (site_module_installations)
   - Check: getSiteEnabledModules() before rendering

3. FEATURE FLAGS:
   - agencies.features JSON field
   - Can enable/disable features per agency
   - Example: { "ai_agents": true, "advanced_analytics": false }

4. AI USAGE LIMITS (per tier):
   - Free: 50K tokens/mo, 100 executions
   - Starter: 500K tokens/mo, 1,000 executions
   - Professional: 2M tokens/mo, 5,000 executions
   - Business: 10M tokens/mo, 25,000 executions
   - Enterprise: Unlimited

5. CLIENT PORTAL PERMISSIONS:
   - Individually configurable per client
   - can_edit_content, can_view_analytics, can_view_invoices
   - Checked at page/component level
```

### 7.3 Validation Rules

```
SITE CREATION:
- Name: Required, max 100 chars
- Subdomain: Required, unique, lowercase alphanumeric + hyphens
- Client: Required (select or create)
- Check: Agency has not exceeded max_sites

PUBLISHING REQUIREMENTS:
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
- Role: Must be valid role (admin, member)
- Agency: Must not exceed max_users

SOCIAL POST:
- Content: Required, within platform character limits
- Accounts: At least one account selected
- Schedule: Future date if scheduling
- Media: Valid file types, size limits
```

---

## SECTION 8: SUCCESS METRICS & KPIs

### 8.1 User Success Metrics

```
AGENCY SUCCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Metric                    | Good      | Great     | Excellent |
|---------------------------|-----------|-----------|-----------|
| Time to First Site        | < 1 hour  | < 30 min  | < 15 min  |
| Time to First Publish     | < 1 week  | < 3 days  | < 1 day   |
| Sites per Agency (avg)    | 3         | 8         | 15+       |
| Module Adoption Rate      | 30%       | 50%       | 70%       |
| Team Members Invited      | 1         | 3         | 5+        |
| Client Portal Enabled     | 20%       | 40%       | 60%       |

END CLIENT SUCCESS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Metric                    | Good      | Great     | Excellent |
|---------------------------|-----------|-----------|-----------|
| Portal Login Rate         | Weekly    | 2x/week   | Daily     |
| Support Response Time     | < 24 hrs  | < 4 hrs   | < 1 hr    |
| NPS Score                 | 30        | 50        | 70+       |
```

### 8.2 Platform Success Metrics

```
PLATFORM HEALTH:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Metric                    | Target    | Notes                    |
|---------------------------|-----------|--------------------------|
| Active Agencies (MAU)     | Growth    | Key business metric      |
| Revenue per Agency        | > $100/mo | Including modules        |
| Churn Rate                | < 5%/mo   | Agency retention         |
| Module Attach Rate        | > 2/agency| Modules per agency       |
| Uptime                    | 99.9%     | Vercel + Supabase        |
| Page Load Time            | < 3s      | LCP metric               |
| Error Rate                | < 0.1%    | 5xx errors               |
| Build Time                | < 5 min   | Vercel builds            |
```

---

## SECTION 9: EDGE CASES & ERROR SCENARIOS

### 9.1 Common Error Scenarios

```
WORKFLOW: SITE PUBLISHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Error                          | Cause                    | Recovery                  |
|--------------------------------|--------------------------|---------------------------|
| "No pages found"               | Site has no pages        | Create at least one page  |
| "Domain not verified"          | Custom domain DNS wrong  | Check DNS settings        |
| "Exceeded site limit"          | Plan restriction         | Upgrade plan              |
| "Publishing failed"            | System error             | Retry, contact support    |

WORKFLOW: MODULE SUBSCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Error                          | Cause                    | Recovery                  |
|--------------------------------|--------------------------|---------------------------|
| "Payment failed"               | Card declined            | Update payment method     |
| "Module not available"         | Deprecated/removed       | Choose alternative        |
| "Subscription exists"          | Already subscribed       | Go to module settings     |

WORKFLOW: SOCIAL POSTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Error                          | Cause                    | Recovery                  |
|--------------------------------|--------------------------|---------------------------|
| "Token expired"                | OAuth session expired    | Reconnect account         |
| "Rate limited"                 | Too many API calls       | Wait and retry            |
| "Content rejected"             | Platform policy          | Modify content            |
| "Post failed"                  | API error                | Retry or manual post      |
```

### 9.2 Boundary Conditions

```
LIMITS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Entity              | Limit                | Plan-Based?    |
|---------------------|----------------------|----------------|
| Sites per Agency    | 1-∞                  | Yes            |
| Pages per Site      | No hard limit        | No             |
| Media Storage       | 1GB-100GB            | Yes            |
| Team Members        | 1-∞                  | Yes            |
| Clients             | 2-∞                  | Yes            |
| Blog Posts          | No limit             | No             |
| Form Submissions    | Tracked, no limit    | No             |
| AI Tokens/Month     | 50K-Unlimited        | Yes            |
| API Requests        | Rate limited         | Per endpoint   |
```

---

## SECTION 10: FUTURE CONSIDERATIONS

### 10.1 Scalability Concerns

```
POTENTIAL BOTTLENECKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DATABASE QUERIES:
   - Large agency with 1000+ contacts
   - Solution: Pagination, proper indexing, query optimization
   
2. FILE STORAGE:
   - Media library with thousands of assets
   - Solution: CDN caching, lazy loading, thumbnail optimization
   
3. REAL-TIME FEATURES:
   - Social inbox with high volume
   - Solution: Supabase realtime with filtering
   
4. AI AGENT EXECUTIONS:
   - High concurrent agent runs
   - Solution: Queue system, rate limiting
   
5. MODULE RENDERING:
   - Many modules on single page
   - Solution: Code splitting, lazy loading
```

### 10.2 Planned Features (from Master Build Prompt V2)

```
UI/UX OVERHAUL (72 phases planned):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Editor Technology: Puck Editor migration
   - Replace Craft.js
   - Native Next.js 16 support
   - AI plugin for content generation

2. 100+ New Components:
   - 3D capabilities (React Three Fiber)
   - Advanced animations (Framer Motion)
   - Interactive data visualizations

3. Settings System Overhaul:
   - Multi-layer architecture
   - White-label improvements
   - Advanced configuration UI

4. Industry Vertical Modules:
   - Hotel Management (EM-60)
   - Restaurant POS (EM-61)
   - Healthcare (EM-62)
   - Real Estate (EM-63)
   - Gym/Fitness (EM-64)
   - Salon/Spa (EM-65)

ESTIMATED EFFORT: ~260 hours
```

---

## CRITICAL PATHS

The most important user journeys that must work perfectly:

1. **Signup → First Site Published** (Critical for adoption)
2. **Module Subscribe → Enable → Use** (Critical for revenue)
3. **Social Post Creation → Publish** (Core module functionality)
4. **Client Portal Access** (Client satisfaction)
5. **Payment Processing** (Business operation)

---

## IMPROVEMENT OPPORTUNITIES (Prioritized)

| Priority | Opportunity | Impact | Effort | Notes |
|----------|-------------|--------|--------|-------|
| 1 | Social OAuth Integration | High | High | Required for real functionality |
| 2 | UI/UX Modernization | High | High | Master Build Prompt V2 |
| 3 | Puck Editor Migration | High | High | Better page building |
| 4 | Mobile Responsiveness | Medium | Medium | Dashboard usability |
| 5 | 2FA Implementation | Medium | Low | Security feature |
| 6 | Real-time Notifications | Medium | Medium | Better UX |
| 7 | Bulk Operations | Low | Low | Power user feature |
| 8 | API Documentation | Low | Low | Developer experience |

---

## QUESTIONS & CLARIFICATIONS

1. **Social OAuth**: Are OAuth credentials available for testing? Which platforms are priority?

2. **E-Commerce Stripe**: Should client stores use their own Stripe accounts, or does the agency manage payment processing?

3. **White-Label Depth**: How extensive should white-labeling be? (Logo only? Full theming? Custom domains for portal?)

4. **Module Marketplace**: Are third-party developers planned? Or only internal modules?

5. **Analytics**: What level of analytics is needed? Basic counts or full GA-style tracking?

6. **Realtime**: Which features should prioritize real-time updates? (Inbox? Notifications? Collaboration?)

---

*This Platform Discovery document provides a complete map of DRAMAC CMS as of January 30, 2026. Use this as the foundation for all implementation decisions.*

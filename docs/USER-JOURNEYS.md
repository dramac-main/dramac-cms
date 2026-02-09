# DRAMAC CMS — Complete User Journeys

**Version**: 1.0  
**Last Updated**: February 9, 2026  
**Platform**: DRAMAC Enterprise Module Marketplace  
**URL**: `app.dramacagency.com`

---

## Table of Contents

1. [User Type Hierarchy](#1-user-type-hierarchy)
2. [User Type 1: Anonymous Visitor / End Customer](#2-anonymous-visitor--end-customer)
3. [User Type 2: Portal Client](#3-portal-client)
4. [User Type 3: Agency Member](#4-agency-member)
5. [User Type 4: Agency Admin](#5-agency-admin)
6. [User Type 5: Agency Owner](#6-agency-owner)
7. [User Type 6: Module Developer](#7-module-developer)
8. [User Type 7: Super Admin (Platform Admin)](#8-super-admin-platform-admin)
9. [Cross-User Journey Maps](#9-cross-user-journey-maps)
10. [Module-Specific User Journeys](#10-module-specific-user-journeys)
11. [Permission Matrix](#11-permission-matrix)

---

## 1. User Type Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    DRAMAC PLATFORM                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Super Admin (Platform)                │    │
│  │  Manages all agencies, billing, modules, health  │    │
│  └────────────────────┬────────────────────────────┘    │
│                       │                                  │
│  ┌────────────────────▼────────────────────────────┐    │
│  │              Agency (Tenant)                     │    │
│  │                                                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐    │    │
│  │  │  Owner   │ │  Admin   │ │   Member     │    │    │
│  │  │ (full)   │ │ (manage) │ │ (edit only)  │    │    │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘    │    │
│  │       │             │              │             │    │
│  │  ┌────▼─────────────▼──────────────▼──────┐     │    │
│  │  │             Clients                     │     │    │
│  │  │  ┌──────────┐  ┌──────────────────┐    │     │    │
│  │  │  │  Record  │  │  Portal Client   │    │     │    │
│  │  │  │ (no login│  │  (self-service   │    │     │    │
│  │  │  │  managed │  │   login, limited │    │     │    │
│  │  │  │  by team)│  │   access)        │    │     │    │
│  │  │  └──────────┘  └──────────────────┘    │     │    │
│  │  └────────────────────────────────────────┘     │    │
│  │                                                  │    │
│  │  ┌────────────────────────────────────────┐     │    │
│  │  │              Sites                      │     │    │
│  │  │  ┌───────┐ ┌──────┐ ┌──────────────┐  │     │    │
│  │  │  │ Pages │ │ Blog │ │   Modules    │  │     │    │
│  │  │  └───────┘ └──────┘ │ (Booking,    │  │     │    │
│  │  │                      │  E-Commerce, │  │     │    │
│  │  │                      │  CRM, Social,│  │     │    │
│  │  │                      │  Automation) │  │     │    │
│  │  │                      └──────────────┘  │     │    │
│  │  └────────────────────────────────────────┘     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────────┐  ┌─────────────────────────┐  │
│  │   Module Developer   │  │   Anonymous Visitor      │  │
│  │  (builds & publishes │  │  (browses published      │  │
│  │   modules to market) │  │   sites, books, shops)   │  │
│  └──────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Role Derivation

| `profiles.role` | `agency_members.role` | → Effective Role |
|---|---|---|
| `super_admin` | *(any)* | **Super Admin** |
| `admin`/`member` | `owner` | **Agency Owner** |
| `admin`/`member` | `admin` | **Agency Admin** |
| `admin`/`member` | `member` | **Agency Member** |
| *(N/A — portal auth)* | *(N/A)* | **Portal Client** |
| *(has `developer_profiles`)* | *(any agency role)* | **Module Developer** |
| *(no auth)* | *(N/A)* | **Anonymous Visitor** |

---

## 2. Anonymous Visitor / End Customer

**Who**: Anyone visiting a published client site (e.g., `sisto.sites.dramacagency.com`, `www.barbershop.com`).  
**Auth**: None required. All data fetched via `createAdminClient()` (service-role, bypasses RLS).  
**Entry Points**: Subdomain URLs, custom domains, embed widgets, shared links.

### Journey 2.1 — Browse a Published Website

```
Visitor enters URL (subdomain or custom domain)
    │
    ▼
Middleware detects subdomain/custom domain
    │ Rewrites to /site/[domain]/[[...slug]]
    ▼
Homepage renders (Studio-built pages)
    │
    ├── Browse pages (About, Contact, Services, etc.)
    ├── Read blog posts (/blog/[subdomain]/[slug])
    ├── View media & galleries
    └── Navigate via header/footer links
```

**Touchpoints**: Homepage, inner pages, blog listing, blog post, footer links, navbar.

### Journey 2.2 — Make a Booking (Booking Module)

```
Visitor lands on site
    │
    ▼
Clicks "Book Now" (CTA button / booking page)
    │
    ▼
Booking Widget loads (ServiceSelectorBlock)
    │ Fetches services via getPublicServices()
    ▼
Selects a service
    │
    ▼
Staff selection (StaffGridBlock) — optional if multiple staff
    │ Fetches staff via getPublicStaff()
    ▼
Calendar view (BookingCalendarBlock)
    │ Fetches slots via getPublicAvailableSlots()
    ▼
Selects date & time slot
    │
    ▼
Booking form (BookingFormBlock)
    │ Enters: name, email, phone, notes
    ▼
Submits booking → createPublicAppointment()
    │
    ├── If require_confirmation OFF → "Booking Confirmed!" (green ✓)
    └── If require_confirmation ON  → "Booking Submitted!" (amber ⏳)
    │
    ▼
Notifications triggered:
    ├── Owner: in-app notification + email (booking_confirmation_owner)
    └── Customer: email (booking_confirmation_customer)
```

**Alternative Entry**: Embeddable widget (`/embed/booking/[siteId]`) on external sites.

### Journey 2.3 — Shop & Checkout (E-Commerce Module)

```
Visitor lands on storefront
    │
    ▼
Browse products (product-grid-block)
    │ Fetches via getPublicProducts()
    ├── Filter by category
    ├── Search products (useStorefrontSearch)
    └── Sort by price/popularity
    │
    ▼
View product detail (product-card-block)
    │ Fetches via getPublicProductBySlug()
    ├── View variants, images, description
    ├── Check stock availability
    └── Add to wishlist (useStorefrontWishlist)
    │
    ▼
Add to cart → addToPublicCart()
    │ Cart persists in cookies/localStorage
    ▼
View cart → getPublicCart()
    │ Update quantities, remove items
    ├── Apply discount code → validatePublicDiscount()
    └── View subtotal, tax, shipping estimate
    │
    ▼
Proceed to checkout (/checkout/module)
    │ Enters: shipping info, billing info
    ▼
Select payment method
    │ ┌──────────────────────────────┐
    │ │  Paddle  │ Flutterwave      │
    │ │  Pesapal │ DPO Pay │ Manual │
    │ └──────────────────────────────┘
    ▼
Payment processing → createPublicOrderFromCart()
    │
    ▼
Order created → Notifications:
    ├── Owner: in-app notification + email (order_confirmation_owner)
    └── Customer: email (order_confirmation_customer)
    │
    ▼
Order confirmation page with order number
    │
    ▼
[Later] Fulfillment → Owner ships → updateOrderFulfillment()
    │
    └── Customer: email (order_shipped_customer)
```

### Journey 2.4 — Submit a Form

```
Visitor navigates to a page with a form
    │
    ▼
Fills in form fields (name, email, message, etc.)
    │
    ▼
Submits → POST /api/forms/submit (uses createAdminClient)
    │
    ▼
Submission saved to database
    │
    ▼
Owner: email notification (form_submission_owner)
```

### Journey 2.5 — View a Public Quote

```
Client/prospect receives a quote link (email or message)
    │
    ▼
Opens /quote/[token]
    │
    ▼
Views quote details:
    ├── Line items with pricing
    ├── Total with tax
    ├── Terms & conditions
    └── Accept/Decline options
```

### Journey 2.6 — Read a Blog

```
Visitor lands on blog (/blog/[subdomain])
    │
    ▼
Browse blog listing
    │ ├── Filter by category
    │ └── Paginate through posts
    │
    ▼
Click on a post → /blog/[subdomain]/[slug]
    │
    ▼
Read full post (TipTap-rendered content)
    ├── View featured image, author, reading time
    ├── See related posts
    └── Share post (social sharing)
```

---

## 3. Portal Client

**Who**: A client (customer) of an agency who has been granted portal access (`has_portal_access = true`).  
**Auth**: Separate login at `/portal/login` (password or magic link). Linked via `clients.portal_user_id` → `auth.users`.  
**Entry Point**: `app.dramacagency.com/portal/login`

### Journey 3.1 — Portal Login & Dashboard

```
Client receives portal invite email from agency
    │
    ▼
Visits /portal/login
    │ Enters email + password (or magic link)
    ▼
Authenticated → redirected to /portal
    │
    ▼
Portal Dashboard:
    ├── Site overview cards (sites assigned to this client)
    ├── Recent notifications
    ├── Quick stats (if can_view_analytics)
    └── Action shortcuts
```

### Journey 3.2 — View & Manage Sites

```
Portal Client → /portal/sites
    │
    ▼
List of sites assigned to this client
    │ (filtered by client_site_permissions)
    ▼
Click site → /portal/sites/[siteId]
    │
    ├── View site details & status
    ├── [If can_edit_content] Edit page content
    ├── [If can_view_analytics] View site analytics
    └── [If can_publish] Publish changes
```

**Permission-Gated Features:**

| Permission | Portal Sections Unlocked |
|---|---|
| `can_view_analytics` | `/portal/analytics`, `/portal/sites/[siteId]` analytics tab |
| `can_edit_content` | Blog editing, content changes |
| `can_view_invoices` | `/portal/invoices` |
| `has_portal_access` | Entire portal (must be `true`) |

### Journey 3.3 — View Analytics (if permitted)

```
Portal Client → /portal/analytics
    │
    ▼
View analytics for assigned sites:
    ├── Page views & unique visitors
    ├── Traffic sources
    ├── Popular pages
    └── Date range filtering
```

### Journey 3.4 — Manage Blog Content (if permitted)

```
Portal Client → /portal/blog
    │
    ▼
Select site → /portal/blog/[siteId]
    │
    ├── View existing blog posts
    ├── [If can_edit_content] Create new post
    ├── [If can_edit_content] Edit existing post
    └── View categories
```

### Journey 3.5 — Browse & Request Apps

```
Portal Client → /portal/apps
    │
    ▼
View installed apps for their sites
    │
    ├── /portal/apps/browse → Browse available apps/modules
    ├── /portal/apps/[slug] → App detail page
    └── Request new app → /api/portal/modules/request
```

### Journey 3.6 — View Invoices (if permitted)

```
Portal Client → /portal/invoices
    │
    ▼
List of invoices from the agency
    ├── Invoice amount, date, status
    ├── Download invoice PDF
    └── Payment status
```

### Journey 3.7 — Submit Support Ticket

```
Portal Client → /portal/support
    │
    ▼
View existing tickets
    │
    ├── /portal/support/new → Create new support ticket
    │   ├── Subject, description, priority
    │   └── Attach files
    │
    └── /portal/support/[ticketId] → View ticket thread
        ├── Read agency replies
        └── Add follow-up messages
```

### Journey 3.8 — Manage Media

```
Portal Client → /portal/media
    │
    ▼
View & manage media library for assigned sites
    ├── Upload images/documents
    ├── Organize in folders
    ├── Search & filter
    └── View asset usage
```

### Journey 3.9 — SEO Management (if permitted)

```
Portal Client → /portal/seo
    │
    ▼
Select site → /portal/seo/[siteId]
    │
    ├── View SEO scores
    ├── Edit meta tags (title, description)
    ├── Open Graph settings
    └── View recommendations
```

### Journey 3.10 — View Notifications & Settings

```
/portal/notifications → In-app notification feed
/portal/settings → Portal preferences (name, email, password)
/portal/domains → View domain information
/portal/email → Email settings
/portal/submissions → View form submissions for assigned sites
```

---

## 4. Agency Member

**Who**: A team member invited to an agency with `role = "member"` in `agency_members`.  
**Auth**: Standard Supabase login → `app.dramacagency.com/login`.  
**Permissions**: View clients, edit assigned sites/content, view analytics. Cannot manage billing, team, or delete anything.

### Journey 4.1 — Signup & Onboarding

```
Receives team invite email from agency owner/admin
    │
    ▼
Clicks invite link → /signup (or /login if existing account)
    │
    ▼
Creates account (if new)
    │
    ▼
Redirected to /onboarding
    │ ├── Profile setup (name, avatar)
    │ ├── Goal selection (build websites, manage clients, etc.)
    │ └── Industry selection
    ▼
Onboarding complete → /dashboard
```

### Journey 4.2 — Daily Dashboard

```
Agency Member → /dashboard
    │
    ▼
Dashboard overview:
    ├── Assigned sites & their status
    ├── Recent activity feed
    ├── Notifications
    └── Quick actions (edit site, view client)
```

### Journey 4.3 — Edit a Client's Site

```
/dashboard/sites → Site list (filtered by assigned sites)
    │
    ▼
Click site → /dashboard/sites/[siteId]
    │
    ├── View site overview & stats
    │
    ▼
Edit pages:
    ├── /dashboard/sites/[siteId]/pages → Page list
    ├── /dashboard/sites/[siteId]/pages/[pageId] → Page settings
    └── /studio/[siteId]/[pageId] → Visual page editor (DRAMAC Studio)
        │
        ├── Drag & drop components
        ├── Edit text, images, links
        ├── Use AI assistant for content
        ├── Preview on mobile/tablet/desktop
        └── Save changes
```

### Journey 4.4 — Manage Blog Posts

```
/dashboard/sites/[siteId]/blog → Blog post list
    │
    ├── /dashboard/sites/[siteId]/blog/new → Create new post
    │   ├── TipTap rich text editor
    │   ├── Featured image, excerpt
    │   ├── Category assignment
    │   ├── SEO meta (title, description, OG)
    │   ├── Schedule for future publish
    │   └── Save as draft or publish
    │
    ├── /dashboard/sites/[siteId]/blog/[postId] → Edit post
    │
    └── /dashboard/sites/[siteId]/blog/categories → Manage categories
```

### Journey 4.5 — View Clients (Read-Only)

```
/dashboard/clients → Client list (view only)
    │
    ▼
/dashboard/clients/[clientId] → Client detail
    ├── View client info, notes, tags
    ├── View assigned sites
    └── View activity history
```

### Journey 4.6 — Handle Form Submissions

```
/dashboard/sites/[siteId]/submissions → Form submission list
    │
    ├── View individual submissions
    ├── Export submissions (/api/forms/export)
    └── Mark as read/unread
```

### Journey 4.7 — View Notifications

```
/dashboard/notifications → Notification feed
    ├── New bookings, orders, form submissions
    ├── System alerts
    └── Mark as read/dismiss
```

### Journey 4.8 — Personal Settings

```
/settings/profile → Edit name, avatar, email
/settings/security → Password change, sessions
/settings/notifications → Notification preferences
```

---

## 5. Agency Admin

**Who**: A team member with `role = "admin"` in `agency_members`.  
**Auth**: Standard Supabase login.  
**Permissions**: Everything Agency Member can do, PLUS: manage clients, create/delete sites, invite team, view billing, manage modules.

### Journey 5.1 — All Agency Member Journeys (Inherited)

Agency Admin has all capabilities of [Agency Member (Section 4)](#4-agency-member), plus the following:

### Journey 5.2 — Manage Clients

```
/dashboard/clients → Full client management
    │
    ├── /dashboard/clients/new → Create new client
    │   ├── Name, email, company, phone
    │   ├── Tags & notes
    │   └── Portal access toggle
    │
    ├── /dashboard/clients/[clientId] → Full client detail
    │   ├── Edit client info
    │   ├── Enable/disable portal access
    │   ├── Set portal permissions (can_edit_content, can_view_analytics, can_view_invoices)
    │   ├── Assign sites
    │   ├── Set per-site permissions (can_view, can_edit_content, can_publish, can_view_analytics)
    │   └── View activity history
    │
    └── /clients/[clientId]/modules → Manage modules for client
        ├── Install modules on client's sites
        ├── Configure module settings
        └── Set module pricing/markup
```

### Journey 5.3 — Create & Manage Sites

```
/dashboard/sites → Full site management
    │
    ├── /dashboard/sites/new → Create new site
    │   ├── Site name, subdomain
    │   ├── Assign to client
    │   ├── Choose template (optional)
    │   └── Configure initial settings
    │
    ├── /dashboard/sites/[siteId]/settings → Site settings
    │   ├── Subdomain & custom domain configuration
    │   ├── Tracking (Google Analytics, Facebook Pixel)
    │   ├── Favicon & branding
    │   └── Danger zone (delete site)
    │
    └── Publish site → /api/sites/[siteId]/publish
```

### Journey 5.4 — Invite Team Members

```
/settings/team → Team management
    │
    ├── View current team members & roles
    ├── Invite new member (email invite)
    │   ├── Set role: admin or member
    │   └── Send invitation email
    └── Deactivate/remove members (admin only)
```

### Journey 5.5 — Manage Modules (Install & Configure)

```
/marketplace → Browse module marketplace
    │
    ├── Search & filter modules
    ├── View module detail → /marketplace/[moduleId]
    │   ├── Screenshots, description, reviews
    │   ├── Pricing (free/monthly/yearly/one-time)
    │   └── Install button
    │
    ▼
Subscribe to module → /checkout/module
    │ Payment via Paddle/LemonSqueezy
    ▼
Module installed at agency level
    │
    ▼
Enable for sites → /dashboard/sites/[siteId]
    │ ├── Configure module settings per site
    │ ├── Set client pricing markup
    │ └── Module appears on published site
    │
    ▼
/dashboard/modules/subscriptions → Manage active subscriptions
/dashboard/modules/pricing → View module pricing
```

### Journey 5.6 — View Billing (Read-Only)

```
/settings/billing → View payment methods & invoices
/settings/subscription → View current plan details
/dashboard/billing → Billing overview
```

### Journey 5.7 — Manage SEO

```
/dashboard/sites/[siteId]/seo → SEO dashboard
    ├── /seo/pages → Per-page meta tags
    ├── /seo/robots → robots.txt editor
    └── /seo/sitemap → Sitemap configuration
```

### Journey 5.8 — Domain Management

```
/dashboard/domains → Domain management
    │
    ├── /dashboard/domains/search → Search & register domains
    ├── /dashboard/domains/cart → Domain purchase cart
    ├── /dashboard/domains/transfer → Domain transfer
    │   ├── /transfer/new → Initiate transfer
    │   └── /transfer/[transferId] → Track transfer
    │
    └── /dashboard/domains/[domainId] → Domain detail
        ├── /dns → DNS record management
        ├── /email → Email hosting setup
        ├── /renew → Domain renewal
        └── /settings → Nameservers, auto-renew, WHOIS
```

### Journey 5.9 — Email Management

```
/dashboard/email → Email service dashboard
    │
    ├── /dashboard/email/purchase → Purchase email hosting
    └── /dashboard/email/[orderId]
        ├── /accounts → Manage email accounts
        └── /settings → Email configuration
```

---

## 6. Agency Owner

**Who**: The creator/owner of an agency (`agencies.owner_id` or `agency_members.role = "owner"`).  
**Auth**: Standard Supabase login.  
**Permissions**: Everything Agency Admin can do, PLUS: full billing management, delete agency, manage team roles, white-label, branding, module requests.

### Journey 6.1 — All Agency Admin Journeys (Inherited)

Agency Owner has all capabilities of [Agency Admin (Section 5)](#5-agency-admin), plus the following:

### Journey 6.2 — Full Onboarding (First-Time)

```
Visit app.dramacagency.com/signup
    │
    ▼
Create account (email + password)
    │
    ▼
/onboarding (multi-step wizard):
    │
    ├── Step 1: Agency name & details
    ├── Step 2: Industry selection
    ├── Step 3: Goals (build sites, manage clients, sell modules)
    ├── Step 4: First site creation (optional)
    └── Step 5: Product tour
    │
    ▼
/dashboard → Full dashboard access
```

### Journey 6.3 — Manage Billing & Subscription

```
/settings/billing → Full billing management
    │
    ├── View & update payment method
    ├── View invoices & payment history
    ├── Download invoices
    └── Manage auto-pay settings
    │
    ▼
/settings/subscription → Plan management
    │
    ├── View current plan & usage
    ├── Upgrade/downgrade plan
    ├── View plan features
    └── Cancel subscription
    │
    ▼
/dashboard/billing → Billing dashboard
    ├── Revenue overview
    ├── Module subscription costs
    └── /dashboard/billing/success → Payment confirmation
```

### Journey 6.4 — White-Label & Branding

```
/settings/branding → Custom branding setup
    │
    ├── Upload logo (light/dark variants)
    ├── Brand colors (primary, secondary, accent)
    ├── Custom favicon
    ├── Email branding
    └── White-label toggle (remove DRAMAC branding)
        │
        ├── Custom login page branding
        ├── Client portal branded
        └── Email headers/footers branded
```

### Journey 6.5 — Manage Team Roles

```
/settings/team → Full team management
    │
    ├── View all team members
    ├── Change member roles (member ↔ admin)
    ├── Transfer ownership
    ├── Remove members
    └── View team activity log
```

### Journey 6.6 — Request Custom Modules

```
/dashboard/modules/requests → Module request system
    │
    ├── /dashboard/modules/requests/new → Submit new request
    │   ├── Module description & requirements
    │   ├── Priority level
    │   ├── Budget range
    │   └── Timeline
    │
    └── Track request status
```

### Journey 6.7 — AI Website Designer

```
/dashboard/sites/[siteId]/ai-designer → AI Website Designer
    │
    ▼
Enter business details:
    ├── Business name, industry, description
    ├── Services offered
    ├── Brand preferences (colors, style)
    └── Target audience
    │
    ▼
AI generates full website (streaming):
    ├── Homepage with hero, services, testimonials, CTA
    ├── About page
    ├── Services/Products page
    ├── Contact page
    ├── Blog page
    └── Industry-specific pages (booking, menu, etc.)
    │
    ▼
Preview generated website
    │
    ├── Edit individual sections
    ├── Regenerate sections with AI
    ├── Adjust colors & fonts
    └── Swap components
    │
    ▼
Save & Apply → Pages created in Studio
    │
    ├── Auto-installs required modules (booking, ecommerce)
    └── Site ready to publish
```

### Journey 6.8 — Studio: Visual Page Builder

```
/studio/[siteId]/[pageId] → Full-screen editor
    │
    ▼
Left Panel — Component Library:
    ├── Layout: Section, Container, Columns, Spacer
    ├── Typography: Heading, Text, RichText
    ├── Media: Image, Video, Icon
    ├── Interactive: Button, Link, Accordion, Tabs
    ├── Marketing: Hero, CTA, Testimonial, Pricing, FAQ
    ├── Module: Booking Widget, Product Grid, Cart, etc.
    └── Templates: Pre-built section templates
    │
    ▼
Canvas — Drag & drop components:
    ├── Mobile/Tablet/Desktop preview modes
    ├── Grid guides & snap-to
    ├── Component selection & nesting
    └── Undo/Redo (Ctrl+Z/Y)
    │
    ▼
Right Panel — Component Properties:
    ├── Content fields (text, images, links)
    ├── Styling (colors, spacing, typography)
    ├── Responsive overrides per breakpoint
    ├── Animation presets
    └── AI Assistant (per-component suggestions)
    │
    ▼
Top Bar:
    ├── Device preview toggle (mobile/tablet/desktop)
    ├── Zoom controls
    ├── Preview mode
    ├── Save / Publish
    └── Page settings (title, slug, SEO)
```

### Journey 6.9 — Manage AI Agents

```
/dashboard/sites/[siteId]/ai-agents → AI Agent management
    │
    ├── View agent list & status
    ├── /ai-agents/new → Create new AI agent
    │   ├── Agent name, description, personality
    │   ├── Assign tools & capabilities
    │   ├── Set goals & constraints
    │   └── Configure triggers
    │
    ├── /ai-agents/[agentId] → Agent detail
    │   ├── Edit configuration
    │   ├── Test agent
    │   └── View execution logs
    │
    ├── /ai-agents/marketplace → Browse pre-built agents
    ├── /ai-agents/approvals → Review agent actions
    ├── /ai-agents/analytics → Agent performance metrics
    ├── /ai-agents/testing → Agent testing sandbox
    └── /ai-agents/usage → Usage & cost tracking
```

### Journey 6.10 — Manage Automation Workflows

```
/dashboard/sites/[siteId]/automation → Automation hub
    │
    ├── /automation/workflows → Active workflows
    │   ├── /workflows/new → Create workflow (visual builder)
    │   │   ├── Select trigger (form submit, order placed, etc.)
    │   │   ├── Add conditions (if/else)
    │   │   ├── Add actions (send email, update record, etc.)
    │   │   ├── AI-powered action suggestions
    │   │   └── Test & activate
    │   │
    │   └── /workflows/[workflowId] → Edit workflow
    │
    ├── /automation/templates → Pre-built templates
    ├── /automation/connections → Connected services
    ├── /automation/executions → Execution log
    │   └── /executions/[executionId] → Execution detail
    └── /automation/analytics → Workflow performance
```

### Journey 6.11 — Manage Social Media

```
/dashboard/sites/[siteId]/social → Social media hub
    │
    ├── /social/compose → Create & schedule posts
    ├── /social/calendar → Content calendar view
    ├── /social/inbox → Unified social inbox
    ├── /social/campaigns → Campaign management
    ├── /social/approvals → Content approval queue
    ├── /social/accounts → Connected social accounts
    ├── /social/analytics → Engagement & performance
    └── /social/settings → Social preferences
```

### Journey 6.12 — CRM Management

```
/dashboard/sites/[siteId]/crm-module → CRM dashboard
    │
    ├── Contact management (create/edit/search)
    ├── Company management
    ├── Deal pipeline (drag & drop stages)
    ├── Activity tracking
    ├── /crm-module/analytics → Revenue, pipeline, velocity
    └── Reports & exports
    │
    ▼
/dashboard/crm → Agency-wide CRM (multi-site)
```

### Journey 6.13 — Impersonate Client Portal

```
/dashboard/clients/[clientId] → Client detail
    │
    ▼
Click "View as Client" → Sets impersonating_client_id cookie
    │
    ▼
Redirected to /portal → See exactly what the client sees
    │
    ▼
Click "Exit Impersonation" → Return to agency dashboard
```

---

## 7. Module Developer

**Who**: A user with a `developer_profiles` record. Can be an agency owner who also develops modules, or a standalone developer.  
**Auth**: Standard Supabase login.  
**Entry Points**: Module Studio, Developer Revenue Dashboard, VS Code SDK, CLI tools.

### Journey 7.1 — Set Up Developer Profile

```
Existing agency user → /settings/profile or developer page
    │
    ▼
Create developer profile:
    ├── Developer name & slug
    ├── Avatar & bio
    ├── Website & social links
    ├── Payout account setup → /api/developer/payout-account
    │   └── Stripe Connect onboarding → /api/developer/stripe-connect
    └── Verification request (optional)
```

### Journey 7.2 — Build a Module (In-Browser Studio)

```
/admin/modules/studio → Module Studio (or developer studio)
    │
    ├── /studio/new → Create new module
    │   ├── Module name, description, icon
    │   ├── Category & tags
    │   ├── Module type (widget/app/integration/system/custom)
    │   ├── Install level (agency/client/site)
    │   └── Pricing model (free/one-time/monthly/yearly)
    │
    ▼
/admin/modules/studio/[moduleId] → Module Editor
    │
    ├── Monaco code editor (in-browser VS Code)
    │   ├── render_code (React component)
    │   ├── styles (CSS/Tailwind)
    │   ├── settings_schema (configuration options)
    │   ├── api_routes (custom endpoints)
    │   └── default_settings
    │
    ├── Module manifest editor
    │   ├── render_mode, permissions
    │   ├── Dependencies
    │   └── Version info
    │
    └── Test module → /admin/modules/studio/[moduleId]/test
        ├── Preview rendering
        ├── Test API endpoints
        └── View test results
```

### Journey 7.3 — Build a Module (AI Builder)

```
/admin/modules/studio/ai-builder → AI Module Builder
    │
    ▼
Chat with AI to describe module:
    ├── /api/modules/ai-builder/chat → Conversational design
    ├── /api/modules/ai-builder/generate-spec → Generate specification
    ├── /api/modules/ai-builder/generate-code → Generate code
    ├── /api/modules/ai-builder/refine → Refine code iteratively
    └── /api/modules/ai-builder/finalize → Finalize for publishing
    │
    ▼
Review generated code in Studio editor
    │
    ▼
Test → Publish to marketplace
```

### Journey 7.4 — Build a Module (VS Code + CLI)

```
Terminal: dramac-cli init my-module
    │
    ├── Scaffolds module project locally
    ├── TypeScript types from SDK
    └── Dev server for local testing
    │
    ▼
Develop in VS Code:
    ├── DRAMAC VS Code extension for IntelliSense
    ├── Module SDK for API integration
    ├── Local preview & testing
    └── Upload to platform
    │
    ▼
Terminal: dramac-cli publish
    │
    └── Module deployed to marketplace
```

### Journey 7.5 — Publish & Manage Versions

```
Module → Module Studio → Publish
    │
    ├── Set version number
    ├── Write changelog
    ├── Submit for review (if required)
    │
    ▼
Version management:
    ├── /api/modules/[moduleId]/versions → Version list
    ├── /api/modules/[moduleId]/versions/[versionId] → Version detail
    ├── /api/modules/[moduleId]/versions/rollback → Rollback to previous
    ├── /api/modules/[moduleId]/versions/backup → Create backup
    ├── /api/modules/[moduleId]/versions/migrate → Data migration
    └── /api/modules/[moduleId]/versions/verify → Verify integrity
```

### Journey 7.6 — Track Revenue & Payouts

```
/developer/revenue → Revenue dashboard
    │
    ├── Total earnings, monthly trend
    ├── Revenue per module
    ├── Install counts & conversion rates
    ├── Geographic breakdown
    │
    ├── /api/developer/payouts → Payout history
    ├── /api/developer/statements → Financial statements
    └── /api/developer/revenue/export → Export revenue data
```

### Journey 7.7 — Monitor Module Performance

```
/api/modules/analytics/[moduleId] → Module analytics
    │
    ├── Install count, active installs
    ├── Load times, error rates
    ├── Usage events (loads, actions, errors)
    ├── User engagement metrics
    └── Revenue per install
    │
    ▼
/api/modules/[moduleId]/reviews → Module reviews
    ├── Average rating
    ├── Review list
    └── Respond to reviews
```

---

## 8. Super Admin (Platform Admin)

**Who**: User with `profiles.role = "super_admin"`. Has unrestricted access to the entire platform.  
**Auth**: Standard Supabase login (same as agency users).  
**Entry Point**: `app.dramacagency.com/admin`

### Journey 8.1 — Platform Overview

```
/admin → Admin dashboard
    │
    ├── Platform statistics (agencies, users, modules, revenue)
    ├── System health indicators
    ├── Recent activity
    └── Alerts & issues
```

### Journey 8.2 — Manage Agencies

```
/admin/agencies → Agency list
    │
    ├── Search, filter, sort agencies
    ├── View agency details → /admin/agencies/[agencyId]
    │   ├── Agency info, owner, plan
    │   ├── Sites & clients count
    │   ├── Module installations
    │   ├── Billing status
    │   └── Impersonate agency owner
    │
    └── /admin/agencies/analytics → Agency growth metrics
```

### Journey 8.3 — Manage Users

```
/admin/users → User list
    │
    ├── Search by email, name, role
    ├── View user detail → /admin/users/[userId]
    │   ├── Profile info
    │   ├── Role & agency membership
    │   ├── Login history
    │   ├── Edit role (promote to admin, etc.)
    │   └── Disable/enable account
    │
    └── /api/make-admin → Promote user to super_admin
```

### Journey 8.4 — Manage Modules (Platform-Wide)

```
/admin/modules → Module management
    │
    ├── All published modules
    ├── /admin/modules/analytics → Module performance metrics
    ├── /admin/modules/pricing → Platform-wide pricing management
    │   └── Set wholesale/retail prices, revenue share
    │
    ├── /admin/modules/requests → Module requests from agencies
    │   └── /admin/modules/requests/[requestId] → Review & respond
    │
    ├── /admin/modules/studio → Module Studio (build/edit modules)
    │   ├── /studio/new → Create module
    │   ├── /studio/ai-builder → AI module builder
    │   ├── /studio/sync → Sync modules
    │   ├── /studio/integration-test → Integration testing
    │   └── /studio/[moduleId] → Edit module
    │       └── /studio/[moduleId]/test → Test module
    │
    ├── /admin/modules/testing → Test management
    │   ├── /testing/beta → Beta program management
    │   └── /testing/sites → Test sites
    │
    └── /admin/modules/[moduleId] → Module detail
        ├── Install stats, revenue
        ├── Version history
        ├── Error logs
        └── Approve/reject/feature module
```

### Journey 8.5 — Monitor Platform Health

```
/admin/health → System health dashboard
    │
    ├── Supabase connection status
    ├── API response times
    ├── Error rates & trends
    ├── Database size & performance
    └── External service status (Paddle, Resend, etc.)
```

### Journey 8.6 — Revenue & Billing

```
/admin/billing → Platform billing overview
    │
    ├── /admin/billing/revenue → Revenue dashboard
    │   ├── MRR, ARR, churn rate
    │   ├── Revenue by plan tier
    │   ├── Revenue by module
    │   └── Payment provider breakdown
    │
    └── /admin/subscriptions → Subscription management
        ├── Active subscriptions list
        ├── Trial users
        ├── Churned users
        └── Revenue forecasts
```

### Journey 8.7 — Platform Analytics

```
/admin/analytics → Platform-wide analytics
    │
    ├── User growth (signups, DAU, MAU)
    ├── Agency growth
    ├── Module adoption rates
    ├── Site creation trends
    ├── Geographic distribution
    └── Feature usage heatmap
```

### Journey 8.8 — Audit & Security

```
/admin/audit → Audit log
    │
    ├── All platform actions logged
    ├── Filter by user, action, date
    ├── Suspicious activity detection
    └── Export audit data
    │
    ▼
/admin/activity → Activity feed
    ├── Real-time platform activity
    └── Filter by type
```

### Journey 8.9 — Platform Settings

```
/admin/settings → Platform configuration
    │
    ├── Default settings
    ├── Feature flags
    ├── Email templates
    ├── Module submission rules
    └── Pricing tier configuration
```

---

## 9. Cross-User Journey Maps

### Journey 9.1 — Booking Lifecycle (All Users)

```
AGENCY OWNER:
  Enable booking module on site → Configure services/staff/hours

ANONYMOUS VISITOR:
  Browse site → Book appointment → Receive confirmation email

AGENCY OWNER/ADMIN:
  Receive in-app notification + email → View in /dashboard/sites/[siteId]/booking
  → Confirm/reschedule/cancel appointment

PORTAL CLIENT (if permitted):
  View bookings in portal → See analytics

VISITOR (if cancelled):
  Receive cancellation email (booking_cancelled_customer)
```

### Journey 9.2 — E-Commerce Order Lifecycle (All Users)

```
AGENCY OWNER:
  Set up store → Add products/categories → Configure payment providers
  → Set shipping zones & tax rates

ANONYMOUS VISITOR:
  Browse products → Add to cart → Checkout → Pay → Receive order confirmation

AGENCY OWNER/ADMIN:
  Receive in-app notification + email → View order in /dashboard/sites/[siteId]/ecommerce
  → Process order → Ship → Mark as fulfilled

VISITOR:
  Receive shipping notification email (order_shipped_customer)

PORTAL CLIENT (if permitted):
  View orders → Track shipment → View invoices
```

### Journey 9.3 — Module Lifecycle (Developer → Agency → Client)

```
DEVELOPER:
  Build module → Test → Publish to marketplace → Set pricing

AGENCY OWNER:
  Browse marketplace → Subscribe to module → Install on site
  → Configure → Enable for client

PORTAL CLIENT:
  Browse apps in portal → Request new module from agency

ANONYMOUS VISITOR:
  Interacts with module on published site (e.g., booking widget, product grid)

SUPER ADMIN:
  Monitor module performance → Feature/delist modules → Manage pricing
```

### Journey 9.4 — Website Creation Lifecycle

```
AGENCY OWNER:
  Create new site → Choose template OR use AI Designer
  │
  ├── AI DESIGNER PATH:
  │   Enter business details → AI generates full site → Review → Save & Apply
  │
  └── MANUAL PATH:
      Open Studio → Drag & drop components → Edit content → Style & brand
  │
  ▼
Configure modules (booking, ecommerce, etc.)
  │
  ▼
SEO setup (meta tags, sitemap, robots.txt)
  │
  ▼
Set domain (subdomain or custom domain)
  │
  ▼
Publish site → Live on web

AGENCY MEMBER:
  Edit pages → Update content → Add blog posts

PORTAL CLIENT:
  Edit content (if permitted) → View analytics → Submit support tickets

ANONYMOUS VISITOR:
  Browse the final published site
```

### Journey 9.5 — Support Ticket Lifecycle

```
PORTAL CLIENT:
  /portal/support/new → Create ticket (subject, description, priority)
  │
  ▼
AGENCY ADMIN/OWNER:
  View ticket in dashboard → Reply → Resolve
  │
  ▼
PORTAL CLIENT:
  /portal/support/[ticketId] → View response → Reply → Close
```

### Journey 9.6 — Payment Failure & Recovery

```
SYSTEM (Paddle/Stripe Webhook):
  Payment fails → Webhook fires → /api/webhooks/paddle or /api/webhooks/stripe
  │
  ▼
AGENCY OWNER:
  In-app notification (payment_failed) + email
  │
  ▼
AGENCY OWNER:
  /settings/billing → Update payment method → Retry
  │
  ▼
SYSTEM:
  Payment recovered → In-app notification (payment_success) + email
```

---

## 10. Module-Specific User Journeys

### 10.1 — Booking Module Roles (Per-Site)

| Role | Hierarchy | Key Permissions |
|---|---|---|
| **Admin** | 100 | Full access: services, staff, bookings, settings |
| **Manager** | 75 | Manage bookings, reschedule, view all calendars |
| **Staff** | 50 | View own bookings, mark complete, view schedule |
| **Viewer** | 10 | Read-only access to booking calendar |

### 10.2 — CRM Module Roles (Per-Site)

| Role | Hierarchy | Key Permissions |
|---|---|---|
| **Admin** | 100 | Full access: contacts, deals, pipelines, reports |
| **Sales Manager** | 75 | Manage team deals, reassign, view pipeline |
| **Sales Rep** | 50 | Own contacts/deals only, create new |
| **Viewer** | 10 | Read-only access to CRM data |

### 10.3 — E-Commerce Module Roles (Per-Site)

| Role | Hierarchy | Key Permissions |
|---|---|---|
| **Admin** | 100 | Full access: products, orders, settings, analytics |
| **Store Manager** | 75 | Products, orders, inventory, discounts |
| **Order Manager** | 50 | Order processing, fulfillment, refunds |
| **Inventory Manager** | 50 | Stock management, product updates |
| **Viewer** | 10 | Read-only access to store data |

---

## 11. Permission Matrix

### Platform-Level Permissions

| Permission | Super Admin | Agency Owner | Agency Admin | Agency Member | Portal Client |
|---|:---:|:---:|:---:|:---:|:---:|
| **Platform** | | | | | |
| Manage platform settings | ✅ | — | — | — | — |
| View all agencies | ✅ | — | — | — | — |
| Impersonate users | ✅ | — | — | — | — |
| Manage subscriptions | ✅ | — | — | — | — |
| View platform analytics | ✅ | — | — | — | — |
| **Agency** | | | | | |
| Manage agency settings | ✅ | ✅ | — | — | — |
| Delete agency | ✅ | ✅ | — | — | — |
| Manage team roles | ✅ | ✅ | — | — | — |
| Invite team members | ✅ | ✅ | ✅ | — | — |
| View billing | ✅ | ✅ | ✅ | — | — |
| Manage billing/payments | ✅ | ✅ | — | — | — |
| White-label/branding | ✅ | ✅ | — | — | — |
| **Clients** | | | | | |
| Create/edit clients | ✅ | ✅ | ✅ | — | — |
| View clients | ✅ | ✅ | ✅ | ✅ | — |
| Delete clients | ✅ | ✅ | — | — | — |
| **Sites** | | | | | |
| Create sites | ✅ | ✅ | ✅ | — | — |
| Edit sites | ✅ | ✅ | ✅ | ✅ | — |
| Delete sites | ✅ | ✅ | ✅ | — | — |
| Publish sites | ✅ | ✅ | ✅ | — | — |
| **Content** | | | | | |
| Edit content | ✅ | ✅ | ✅ | ✅ | ⚙️* |
| View analytics | ✅ | ✅ | ✅ | ✅ | ⚙️* |
| View invoices | — | — | — | — | ⚙️* |
| **Modules** | | | | | |
| Install modules | ✅ | ✅ | ✅ | — | — |
| Configure modules | ✅ | ✅ | ✅ | — | — |
| Use module features | ✅ | ✅ | ✅ | ✅ | ⚙️* |
| **Developer** | | | | | |
| Publish modules | ✅ | ✅** | ✅** | — | — |
| View developer revenue | ✅ | ✅** | ✅** | — | — |

> ⚙️* = Configurable per-client by agency (`can_edit_content`, `can_view_analytics`, `can_view_invoices`)  
> ✅** = Only if user has a `developer_profiles` record

### Portal Client Per-Site Permissions

| Permission | Controls |
|---|---|
| `can_view` | Can see the site in portal |
| `can_edit_content` | Can edit pages & blog posts |
| `can_publish` | Can publish changes live |
| `can_view_analytics` | Can see site analytics |

---

## Appendix A: Auth Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     REQUEST ARRIVES                           │
│  (app.dramacagency.com, *.sites.dramacagency.com, custom)    │
└────────────────────────────┬─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Is subdomain?  │
                    │  (*.sites.*)    │
                    └──┬──────────┬───┘
                   YES │          │ NO
                       │          │
              ┌────────▼──┐  ┌───▼──────────┐
              │ Rewrite to│  │ Custom domain?│
              │ /site/    │  └──┬────────┬──┘
              │ [subdomain│  YES│        │NO
              └───────────┘     │        │
                          ┌─────▼──┐  ┌──▼──────────────────┐
                          │Rewrite │  │ Is public route?    │
                          │/site/  │  │ (/login, /signup,   │
                          │[domain]│  │  /site/*, /blog/*,  │
                          └────────┘  │  /preview/*, /api/*,│
                                      │  /embed/*, /pricing)│
                                      └──┬──────────┬───────┘
                                      YES│          │NO
                                         │          │
                                    ┌────▼──┐  ┌───▼───────────────┐
                                    │ Allow │  │ Check Supabase    │
                                    │ pass  │  │ session cookie    │
                                    └───────┘  └──┬────────────┬───┘
                                              AUTH│            │NO AUTH
                                                  │            │
                                          ┌───────▼──┐   ┌────▼──────────┐
                                          │Onboarding│   │ Redirect to   │
                                          │complete? │   │ /login?redirect│
                                          └──┬────┬──┘   └───────────────┘
                                          YES│    │NO
                                             │    │
                                      ┌──────▼┐ ┌▼──────────┐
                                      │Proceed│ │ Redirect to│
                                      │to page│ │ /onboarding│
                                      └───────┘ └────────────┘
```

## Appendix B: Notification Touchpoints Per User

| User Type | In-App Notifications | Email Notifications |
|---|---|---|
| **Agency Owner** | New booking, new order, payment failed, payment recovered, trial ending, form submission | All of the above |
| **Agency Admin** | New booking, new order | — |
| **Agency Member** | — | — |
| **Portal Client** | — | — |
| **Anonymous Visitor** | — | Booking confirmation, booking cancelled, order confirmation, order shipped |
| **Super Admin** | System alerts | System alerts |

## Appendix C: Entry Points Summary

| User Type | Primary URL | Login Page |
|---|---|---|
| **Anonymous Visitor** | `{subdomain}.sites.dramacagency.com` or custom domain | N/A (no login) |
| **Portal Client** | `app.dramacagency.com/portal` | `/portal/login` |
| **Agency Member** | `app.dramacagency.com/dashboard` | `/login` |
| **Agency Admin** | `app.dramacagency.com/dashboard` | `/login` |
| **Agency Owner** | `app.dramacagency.com/dashboard` | `/login` or `/signup` |
| **Module Developer** | `app.dramacagency.com/developer` | `/login` |
| **Super Admin** | `app.dramacagency.com/admin` | `/login` |

## Appendix D: E-Commerce Payment Providers

| Provider | Region | Checkout | Webhooks | Status |
|---|---|---|---|---|
| **Paddle** | Global | ✅ | ✅ (subdomain-safe) | Primary |
| **Flutterwave** | Africa | ✅ | ✅ (subdomain-safe) | Active |
| **Pesapal** | East Africa | ✅ | ✅ (subdomain-safe) | Active |
| **DPO Pay** | Africa | ✅ | ✅ (subdomain-safe) | Active |
| **Stripe** | Global | ⚠️ Legacy | ⚠️ Legacy | Optional |
| **Manual** | — | ✅ (offline) | N/A | Active |

---

*This document maps every user type and their complete journey through the DRAMAC CMS platform. It should be updated whenever new features, roles, or user flows are added.*

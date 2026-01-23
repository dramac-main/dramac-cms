# 🎯 DRAMAC CMS Platform Analysis

I've deeply scanned your platform line by line. Here's what you've built:

---

## 📋 **WHAT IS DRAMAC CMS?**

**DRAMAC** is an **enterprise-grade, multi-tenant SaaS platform** that allows **digital agencies** to build, manage, and monetize websites for their clients. Think of it as a **white-label website builder + CMS** with an **extensible module marketplace**.

### **Core Value Proposition**
- 🏢 **For Agencies**: Manage multiple clients, build websites quickly, install premium modules
- 👥 **For Clients**: Get a branded portal to view their website, analytics, submit support tickets
- 🔌 **For Developers**: Build and sell modules on the marketplace (like Shopify apps)

---

## 🏗️ **PLATFORM ARCHITECTURE**

### **Technology Stack**
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Payment**: Stripe & LemonSqueezy integration
- **AI**: Claude Anthropic for AI-powered site generation
- **Email**: Resend for transactional emails
- **Editor**: Craft.js drag-and-drop page builder

### **Key Architectural Components**

1. **Multi-Tenant System**
   - Each agency has isolated data
   - Agency → Clients → Sites hierarchy
   - Row-level security (RLS) in Supabase

2. **Modular Plugin System** (34 planned modules)
   - Install modules at Agency or Client level
   - Each module can have its own database schema
   - Module marketplace with beta testing tiers
   - Subscription-based pricing per module

3. **4 Main Areas**
   - **Agency Dashboard** - Site management, clients, billing
   - **Editor** - Drag-drop visual website builder
   - **Client Portal** - View-only access for clients
   - **Admin Panel** - Super admin controls

---

## 👥 **USER TYPES & WORKFLOWS**

Now let me give you detailed step-by-step workflows for each user:

---

## 1️⃣ **SUPER ADMIN WORKFLOW**

**Who**: Platform owner with god-mode access

### **Daily Tasks**

**Step 1: Monitor Platform Health**
1. Log in to `/admin` dashboard
2. View platform-wide analytics:
   - Total agencies, users, sites
   - Revenue metrics
   - System errors and issues
3. Check recent activity feed

**Step 2: Manage Agencies**
1. Navigate to "Agencies" tab
2. View all agencies with:
   - Plan type (Free, Starter, Pro, Enterprise)
   - Subscription status
   - Usage metrics
3. Actions:
   - Impersonate agency users (for support)
   - Upgrade/downgrade plans manually
   - Suspend or delete agencies
   - View billing history

**Step 3: Manage Modules**
1. Go to "Modules" section
2. Review module requests from agencies
3. Approve modules for marketplace
4. Set beta testing tiers:
   - Alpha (internal only)
   - Beta (selected agencies)
   - Production (public)
5. Monitor module installation stats

**Step 4: Handle Support Issues**
1. View support ticket queue
2. Impersonate users to debug issues
3. Access audit logs for troubleshooting
4. Manage rate limits and API quotas

---

## 2️⃣ **AGENCY OWNER WORKFLOW**

**Who**: Owner of a digital agency, pays for the platform

### **Onboarding (First Time)**

**Step 1: Sign Up**
1. Visit signup page
2. Enter: Name, Email, Password
3. Choose agency name and slug
4. Select industry and goals
5. Email verification

**Step 2: Complete Profile**
1. Add agency details:
   - Company name, website
   - Logo and branding
   - Billing email
2. Select subscription plan:
   - Free (1 site, 1 client)
   - Starter ($29/mo - 5 sites, 10 clients)
   - Pro ($79/mo - 20 sites, 50 clients)
   - Enterprise ($199/mo - unlimited)
3. Enter payment method (Stripe)

**Step 3: Team Setup**
1. Navigate to "Settings" → "Team"
2. Invite team members:
   - Agency Admin (can manage clients/sites)
   - Agency Member (can edit sites)
3. Team members receive email invite

### **Daily Operations**

**Step 1: Client Management**
1. Go to "Clients" section
2. Click "Add Client"
3. Enter: Name, Email, Company, Industry
4. Assign tags for organization
5. Toggle client portal access
6. Actions:
   - View all client sites
   - Pause/activate client seat (affects billing)
   - Delete client
   - Send portal invite

**Step 2: Build a Website**
1. Navigate to "Sites"
2. Click "Create Site"
3. Choose:
   - Client (from dropdown)
   - Template (blank or pre-built)
   - Site name and subdomain
4. Option: Use AI to generate site
   - Describe the business
   - AI generates homepage layout
5. Click "Open Editor"

**Step 3: Website Editor**
1. **Canvas**: Drag-drop components
   - Sections, containers, text, images, buttons
   - Pre-built blocks (hero, features, testimonials)
2. **Left Sidebar**: Component library
3. **Right Sidebar**: Properties panel
   - Styling (colors, spacing, typography)
   - Settings (links, animations)
   - Responsive breakpoints
4. **Top Toolbar**:
   - Undo/Redo
   - Device preview (desktop/tablet/mobile)
   - Publish button
5. **Pages Management**:
   - Create new pages
   - Set SEO (title, description, keywords)
   - Custom slugs

**Step 4: Install Modules**
1. Go to "Marketplace"
2. Browse categories:
   - Analytics (Google Analytics, Plausible)
   - SEO (schema markup, sitemaps)
   - Forms (contact forms, file uploads)
   - E-commerce (products, checkout)
   - Content (blog, galleries)
   - And 29 more planned modules...
3. Click module → "Subscribe"
4. Choose billing cycle (monthly/yearly)
5. Authorize payment
6. Module appears in "My Modules"
7. Install to specific site(s)
8. Configure module settings

**Step 5: Publish Website**
1. In editor, click "Publish"
2. Choose domain:
   - Subdomain: `clientname.dramac.com`
   - Custom domain: `www.clientwebsite.com`
3. For custom domains:
   - Add DNS records (shown in UI)
   - Verify domain ownership
4. Site goes live!

**Step 6: Billing Management**
1. Navigate to "Settings" → "Billing"
2. View:
   - Current plan and usage
   - Client seat utilization
   - Module subscriptions
   - Upcoming invoices
3. Actions:
   - Upgrade/downgrade plan
   - Cancel module subscriptions
   - Download invoices
   - Update payment method

---

## 3️⃣ **AGENCY ADMIN WORKFLOW**

**Who**: Senior team member with most agency permissions (but not billing)

### **Daily Tasks**

**Step 1: Log In**
1. Receive invite email from Agency Owner
2. Accept invitation
3. Set password
4. Log in to dashboard

**Step 2: Manage Clients**
1. View "Clients" dashboard
2. Add new clients
3. Edit client details
4. Cannot: Delete clients, manage billing

**Step 3: Build Sites**
1. Access editor for any client site
2. Full editing permissions
3. Publish changes
4. Manage pages and content

**Step 4: Install Modules**
1. Browse marketplace
2. Can request module installations
3. Cannot: Subscribe to new modules (owner only)

**Step 5: Team Collaboration**
1. Invite new team members
2. Cannot: Change owner role, delete agency

---

## 4️⃣ **AGENCY MEMBER WORKFLOW**

**Who**: Junior designer/developer, limited permissions

### **Daily Tasks**

**Step 1: Log In**
1. Accept team invitation
2. Access dashboard

**Step 2: Assigned Sites Only**
1. View only sites assigned to them
2. Edit content in visual editor
3. Cannot: Create/delete sites

**Step 3: Limited Actions**
1. Edit pages and components
2. Upload media to assigned sites
3. View analytics (read-only)
4. Cannot: Publish, manage clients, billing

---

## 5️⃣ **CLIENT WORKFLOW** (End User - The Agency's Customer)

**Who**: Business owner receiving website services from agency

### **Portal Access**

**Step 1: Receive Invitation**
1. Agency sends portal invite email
2. Click "Access Portal"
3. Set password (first time only)

**Step 2: Portal Dashboard** (`/portal`)
1. View their site(s):
   - Site status (live/draft)
   - Domain and URL
   - Last updated date
2. Quick actions:
   - View live site
   - Request changes
   - View analytics

**Step 3: Analytics** (`/portal/analytics`)
1. View site traffic:
   - Page views, unique visitors
   - Top pages, referrers
   - Geographic data
2. Time range filters
3. Export reports

**Step 4: Media Library** (`/portal/media`)
1. View all site images/files
2. Upload new media
3. Download assets

**Step 5: Blog Management** (`/portal/blog`)
1. If blog module installed:
   - Write new posts
   - Edit drafts
   - Publish posts
   - Manage categories
2. Rich text editor
3. SEO fields per post

**Step 6: Form Submissions** (`/portal/submissions`)
1. View contact form entries
2. Filter by date, form type
3. Export to CSV
4. Mark as read/archived

**Step 7: Support Tickets** (`/portal/support`)
1. Submit new ticket:
   - Subject, description
   - Category (bug, feature request, question)
   - Priority
2. View ticket status
3. Reply to agency responses
4. Upload attachments

**Step 8: Invoices** (`/portal/invoices`)
1. View all invoices
2. Download PDF receipts
3. View payment history
4. See subscription details

**Step 9: Site Settings** (`/portal/settings`)
1. Update company info
2. Manage notification preferences:
   - Email alerts for form submissions
   - Weekly analytics digest
   - Support ticket updates

---

## 🔄 **COMPLETE USER JOURNEYS**

### **Journey 1: Agency Builds Client Website**

```
Agency Owner → Creates Client → Creates Site → Opens Editor
  → Uses AI or Template → Customizes Design → Adds Pages
  → Installs Modules (Forms, SEO, Blog) → Configures Modules
  → Adds Custom Domain → Publishes Site
  → Sends Portal Invite to Client

Client → Receives Email → Sets Password → Logs into Portal
  → Views Site Analytics → Submits Support Ticket
  → Uploads Blog Post
```

### **Journey 2: Module Marketplace Purchase**

```
Agency Owner → Browses Marketplace → Finds "CRM Module"
  → Clicks "Subscribe" → Chooses Monthly Plan ($49/mo)
  → Enters Payment → Module Added to "My Modules"
  → Goes to Client Site → Installs CRM Module
  → Configures Settings (API keys, fields)
  → CRM Widget Appears in Editor → Adds to Page
  → Publishes → Client Can Now Use CRM on Their Site
```

### **Journey 3: Team Collaboration**

```
Agency Owner → Invites Agency Admin (Sarah)
Sarah → Accepts Invite → Creates 3 New Client Sites
Sarah → Assigns Junior Member (Tom) to 1 Site
Tom → Logs In → Sees Only Assigned Site
Tom → Edits Content → Cannot Publish
Tom → Clicks "Request Publish" → Notification to Sarah
Sarah → Reviews Changes → Clicks "Publish"
```

---

## 📊 **KEY METRICS BY USER**

### **Super Admin Sees**
- Total Agencies: 247
- Active Subscriptions: $12,350 MRR
- Total Sites: 1,523
- Module Installs: 3,890
- Support Tickets: 23 open

### **Agency Owner Sees**
- Plan: Professional ($79/mo)
- Sites Used: 12 of 20
- Clients: 30 of 50
- Storage: 8.5 GB of 25 GB
- Active Modules: 5 subscriptions

### **Client Sees**
- Site Views: 2,340 this month
- Form Submissions: 18 new
- Blog Posts: 7 published
- Support Tickets: 1 open

---

## 🎨 **MODULE ECOSYSTEM** (34 Planned Modules)

### **WAVE 1: Core Infrastructure** (Must Build First)
1. Module Lifecycle ✅ DONE
2. Naming Conventions
3. Type System
4. Database Isolation
5. API Gateway
6. Authentication

### **WAVE 5: Business Modules** (The Money Makers)
1. **CRM Module** - Contacts, deals, pipeline
2. **Booking Module** - Appointments, calendars
3. **E-commerce Module** - Products, checkout, orders
4. **Live Chat Module** - Real-time support
5. **Social Media Module** - Post scheduling
6. **Accounting Module** - Invoices, payments
7. **HR Module** - Team management, time tracking

### **WAVE 6: Industry Verticals**
1. Hotel Management
2. Restaurant POS
3. Healthcare Patient Portal
4. Real Estate Listings
5. Gym/Fitness Memberships
6. Salon/Spa Bookings

---

## 🚀 **CURRENT STATUS**

### **Completed**
- ✅ Module Lifecycle (EM-01)
- ✅ Marketplace Enhancement (EM-02)
- ✅ Multi-tenant agency system
- ✅ Visual editor with Craft.js
- ✅ Client portal
- ✅ Billing integration (Stripe/LemonSqueezy)
- ✅ Blog system
- ✅ Form handling
- ✅ Media management
- ✅ SEO tools
- ✅ External integration (webhooks, OAuth, custom domains)

### **In Progress**
- 🚧 32 enterprise modules to build
- 🚧 Module marketplace expansion
- 🚧 Advanced analytics

---

## 💡 **SUMMARY**

Your platform is a **comprehensive agency SaaS solution** that combines:
1. **Website Builder** (like Webflow/Wix)
2. **CMS** (like WordPress)
3. **Module Marketplace** (like Shopify App Store)
4. **Agency Management** (like HighLevel/GoHighLevel)
5. **Client Portal** (for end-user access)

The unique value is the **modular architecture** where agencies can extend functionality by subscribing to modules, and developers can build/sell custom modules on the marketplace.

---

Would you like me to:
1. Create a detailed database schema diagram?
2. Document specific API endpoints?
3. Create user journey flowcharts?
4. Write implementation guides for new features?

Let me know how else I can help document your platform! 🚀
# DRAMAC CMS — Full Platform Testing Walkthrough

**Base URL**: https://app.dramacagency.com  
**Date**: April 14, 2026  
**Purpose**: Step-by-step verification of every feature in production order.

Use checkboxes to track progress. Each section is self-contained but builds on the previous one.

---

## PRE-FLIGHT

Before you start, have these ready:
- Agency owner login credentials
- A second email address (for a test client account)
- A test phone number (for SMS/WhatsApp tests)
- Payment card details (Paddle test card: 4242 4242 4242 4242 / any future date / any CVC)

---

## SECTION 1: Authentication

### 1.1 Sign Up
- [ ] Go to `/signup`
- [ ] Fill in name, agency name, email, password
- [ ] Click **Create Account**
- [ ] Check email for verification link → click it
- [ ] Confirm you land on `/onboarding`

### 1.2 Onboarding
- [ ] Complete the onboarding wizard (agency details, timezone, currency)
- [ ] Confirm you land on `/dashboard` after completing it

### 1.3 Login / Logout
- [ ] Click your avatar (top-right) → **Sign out**
- [ ] Go to `/login` — enter credentials → confirm redirect to `/dashboard`
- [ ] Go to `/forgot-password` — enter email → check for reset email
- [ ] (Optional) Complete password reset via email link → confirm `/reset-password` works

---

## SECTION 2: Agency Dashboard — Core

### 2.1 Dashboard Home
- [ ] Navigate to `/dashboard`
- [ ] Verify metric cards load (Sites, Clients, Modules, Support Tickets)
- [ ] Verify recent activity feed appears

### 2.2 Sites — Create a Site
- [ ] Go to `/dashboard/sites`
- [ ] Click **New Site**
- [ ] Enter site name, subdomain (e.g., `test-agency`)
- [ ] Select a template or blank
- [ ] Click **Create** → confirm you land on `/dashboard/sites/[siteId]`
- [ ] Note this `siteId` — you will use it throughout the walkthrough

### 2.3 Site Overview
- [ ] On `/dashboard/sites/[siteId]`:
  - [ ] See site name, subdomain, stats
  - [ ] Verify the module nav sidebar appears (Builder, Blog, Pages, SEO, etc.)

---

## SECTION 3: DRAMAC Studio (Visual Page Builder)

### 3.1 Open the Builder
- [ ] From site overview, click **Builder** (or navigate to `/dashboard/sites/[siteId]/builder`)
- [ ] Confirm the iframe canvas loads
- [ ] Confirm the component panel appears on the left

### 3.2 Add Components
- [ ] Drag a **Hero** component onto the canvas
- [ ] Click it → edit the headline text in the right panel
- [ ] Drag a **Features** component below it
- [ ] Drag a **CTA** component below that
- [ ] Confirm all three render in the canvas

### 3.3 Responsive Preview
- [ ] Click the Mobile icon (top toolbar) → canvas resizes
- [ ] Click Tablet → canvas resizes
- [ ] Click Desktop → back to full width

### 3.4 Undo / Redo
- [ ] Delete the CTA component
- [ ] Press Ctrl+Z → CTA reappears
- [ ] Press Ctrl+Y → CTA removed again

### 3.5 Save & Publish
- [ ] Click **Save** → confirm success toast
- [ ] Click **Publish** → confirm success toast
- [ ] Open the live site URL (`https://[subdomain].sites.dramacagency.com`) in a new tab
- [ ] Confirm the published page appears

### 3.6 AI Page Generation (DRAMAC Studio AI)
- [ ] In the builder, click the **AI** button (or go to `/dashboard/sites/[siteId]/ai-designer`)
- [ ] Enter a prompt: "Create a landing page for a modern SaaS company"
- [ ] Click Generate → wait for it to complete
- [ ] Confirm components are populated by the AI

---

## SECTION 4: Pages & Blog

### 4.1 Pages
- [ ] Go to `/dashboard/sites/[siteId]/pages`
- [ ] Click **New Page**
- [ ] Enter title: "About Us", slug: `about`
- [ ] Click **Create** → confirm redirect to page detail
- [ ] Click **Open in Builder** → confirm Studio opens for this page
- [ ] Go back → verify the page appears in the pages list

### 4.2 Blog — Create Post
- [ ] Go to `/dashboard/sites/[siteId]/blog`
- [ ] Click **New Post**
- [ ] Enter title: "Welcome to our blog"
- [ ] Add body text using the TipTap editor
- [ ] Set a category (create one if none exist via `/dashboard/sites/[siteId]/blog/categories`)
- [ ] Set featured image (upload from media library)
- [ ] Click **Publish**
- [ ] Open `/blog/[subdomain]/[post-slug]` in a new tab → verify it renders

### 4.3 Blog — Edit & Schedule
- [ ] Back in the blog list, click the post → **Edit**
- [ ] Change the title
- [ ] Set status to **Scheduled** and pick a future date
- [ ] Click **Save** → confirm the status shows as "Scheduled"

---

## SECTION 5: SEO

- [ ] Go to `/dashboard/sites/[siteId]/seo`
- [ ] Set Site Title, Meta Description, OG Image
- [ ] Go to **Sitemap** tab → verify sitemap.xml is accessible at `https://[subdomain].sites.dramacagency.com/sitemap.xml`
- [ ] Go to **Robots** tab → edit robots.txt → save
- [ ] Go to `/dashboard/sites/[siteId]/seo/pages` → verify per-page SEO overrides

---

## SECTION 6: Media Library

- [ ] Go to `/dashboard/media`
- [ ] Click **Upload** → drag a PNG/JPG file
- [ ] Confirm thumbnail appears in the library
- [ ] Click the image → verify the URL is a valid Supabase storage URL
- [ ] Try deleting the image → confirm it disappears

---

## SECTION 7: Clients

### 7.1 Create a Client
- [ ] Go to `/dashboard/clients`
- [ ] Click **New Client**
- [ ] Fill in: name, email (use your second email), company
- [ ] Click **Create** → confirm client appears in list

### 7.2 Client Permissions
- [ ] Click the client → go to **Permissions** tab
- [ ] Toggle on: Can Manage Sites, Can Manage Invoices
- [ ] Save → confirm success

### 7.3 Client Portal Invite
- [ ] In the client detail, click **Send Portal Invite**
- [ ] Check the second email for invitation
- [ ] Open invitation link → create a client portal account
- [ ] Login to client portal at `/portal/login`
- [ ] Confirm client sees their permitted sections only

---

## SECTION 8: Team Management

- [ ] Go to `/settings/team`
- [ ] Click **Invite Member** → enter an email, assign role: **Member**
- [ ] Click **Send Invite** → confirm invite shows as pending
- [ ] (Optional) Accept the invite → log in as the new member → confirm limited permissions

---

## SECTION 9: Module Marketplace

### 9.1 Browse
- [ ] Go to `/marketplace`
- [ ] Browse modules by category
- [ ] Search for "booking" → confirm results appear
- [ ] Click a module card → verify `/marketplace/[moduleId]` shows details, version, reviews

### 9.2 Install a Free Module
- [ ] Find a free module → click **Install** (or **Install on Site**)
- [ ] Select your test site → confirm
- [ ] Go to `/dashboard/sites/[siteId]` → confirm the module appears in the sidebar

### 9.3 Purchase a Paid Module (if available)
- [ ] Find a paid module → click **Purchase**
- [ ] Use Paddle test card: `4242 4242 4242 4242`
- [ ] Complete checkout → go to `/marketplace/success`
- [ ] Go to `/dashboard/billing` → verify the subscription appears

---

## SECTION 10: CRM Module

### 10.1 Contacts
- [ ] Go to `/dashboard/sites/[siteId]/crm-module` (ensure CRM is installed)
- [ ] Click **Contacts** → click **New Contact**
- [ ] Fill in: First Name, Last Name, Email, Phone
- [ ] Click **Create** → verify contact appears in list
- [ ] Click contact → view detail sheet with tabs (Overview, Activities, Deals, Finance)

### 10.2 Deals & Pipeline
- [ ] Go to **Deals** → click **New Deal**
- [ ] Set deal name, value, contact, pipeline stage
- [ ] Click **Create** → drag deal card to next stage
- [ ] Click **Won** state → confirm "Create Invoice" button appears (INV-13 integration)

### 10.3 Companies
- [ ] Go to **Companies** → create a company
- [ ] Link the contact to the company
- [ ] Verify contact shows company in their profile

### 10.4 CRM Analytics
- [ ] Go to `/dashboard/sites/[siteId]/crm-module/analytics`
- [ ] Verify pipeline value, win rate, and top contacts load

---

## SECTION 11: Booking Module

- [ ] Go to `/dashboard/sites/[siteId]/booking` (ensure Booking is installed)
- [ ] Create a **Service**: name, duration (60 min), price ($50)
- [ ] Create an **Availability Rule**: Monday–Friday, 9am–5pm
- [ ] Open the public booking embed: `/embed/booking/[siteId]`
- [ ] Select the service, pick a date/time, fill in test details → confirm booking
- [ ] Back in `/dashboard/sites/[siteId]/booking` → verify booking appears in the list
- [ ] Change booking status to **Confirmed** → verify

---

## SECTION 12: E-Commerce Module

### 12.1 Products
- [ ] Go to `/dashboard/sites/[siteId]/ecommerce` (ensure E-Commerce is installed)
- [ ] Create a **Category**: "Electronics"
- [ ] Create a **Product**: name "Test Laptop", price $999, stock 10, category "Electronics"
- [ ] Add a product image
- [ ] Click **Publish** → verify product is live

### 12.2 Storefront
- [ ] Open the storefront at `https://[subdomain].sites.dramacagency.com`
- [ ] Navigate to the products page → find "Test Laptop"
- [ ] Add to cart → go to cart → checkout
- [ ] Fill in test customer details
- [ ] Use test card `4242 4242 4242 4242` → complete payment
- [ ] Confirm order success page

### 12.3 Order Management
- [ ] Back in `/dashboard/sites/[siteId]/ecommerce` → go to **Orders**
- [ ] Confirm the order appears with status "Paid"
- [ ] Change status to "Shipped" → verify

---

## SECTION 13: Live Chat Module

### 13.1 Setup
- [ ] Go to `/dashboard/sites/[siteId]/live-chat` (ensure Live Chat is installed)
- [ ] Go to **Settings** → configure widget color, greeting message
- [ ] Go to **Agents** → verify your account is listed as an agent

### 13.2 Widget Test
- [ ] Open the live site: `https://[subdomain].sites.dramacagency.com`
- [ ] Confirm the chat widget appears (bottom-right corner)
- [ ] Type a message in the widget → send
- [ ] Go back to `/dashboard/sites/[siteId]/live-chat/conversations`
- [ ] Confirm the conversation appears
- [ ] Reply from the dashboard side → verify the widget updates

### 13.3 Canned Responses
- [ ] Go to **Canned Responses** → click **New**
- [ ] Add a shortcut: `/greeting`, text: "Hello! How can I help you today?"
- [ ] Save → verify it appears in the list

### 13.4 Chat Analytics
- [ ] Go to `/dashboard/sites/[siteId]/live-chat/analytics`
- [ ] Verify charts for total conversations, avg response time, ratings load

---

## SECTION 14: Marketing Module

### 14.1 Subscribers
- [ ] Go to `/dashboard/sites/[siteId]/marketing` (ensure Marketing is installed)
- [ ] Go to **Subscribers** → click **Import** or manually add test subscriber with email
- [ ] Verify subscriber appears with status "Subscribed"

### 14.2 Email Campaign
- [ ] Go to **Campaigns** → click **New Campaign**
- [ ] Set name, subject line, select subscribers
- [ ] Use the email editor to design the email body
- [ ] Click **Send Test** → check your inbox
- [ ] Schedule or send immediately → verify status changes to "Sent"

### 14.3 Drip Sequences
- [ ] Go to **Sequences** → click **New Sequence**
- [ ] Add Step 1: Email after 0 days — welcome email
- [ ] Add Step 2: Email after 3 days — follow-up
- [ ] Activate the sequence → enroll a subscriber

### 14.4 Landing Pages
- [ ] Go to **Landing Pages** → click **New**
- [ ] Use a template (e.g., Lead Capture)
- [ ] Customize headline and CTA
- [ ] Publish → open the landing page URL in a new tab → verify it renders

### 14.5 Forms
- [ ] Go to **Forms** → click **New Form**
- [ ] Add fields: Name, Email
- [ ] Add a submit action: subscribe to list
- [ ] Save → copy embed code → test submission
- [ ] Verify new subscriber appears in the list

### 14.6 SMS/WhatsApp (if configured)
- [ ] Go to **SMS** → click **New SMS**
- [ ] Enter test phone number, message text
- [ ] Click **Send** → verify delivery

### 14.7 Social Media
- [ ] Go to **Social** → click **Connect Account**
- [ ] Connect a test Facebook or LinkedIn account (OAuth flow)
- [ ] Click **Compose** → write a post → schedule for 1 hour from now
- [ ] Verify it appears in the **Calendar** view

### 14.8 Marketing Analytics
- [ ] Go to `/dashboard/sites/[siteId]/marketing/calendar`
- [ ] Confirm scheduled posts/campaigns are visible on the calendar

---

## SECTION 15: Social Media Module

- [ ] Go to `/dashboard/sites/[siteId]/social` (separate social module, if installed)
- [ ] Go to **Accounts** → connect a social platform
- [ ] Go to **Compose** → write a post with image → schedule
- [ ] Go to **Calendar** → verify scheduled post
- [ ] Go to **Analytics** → verify reach/engagement metrics load (may show zeros if new)

---

## SECTION 16: Automation Module

### 16.1 Create a Workflow
- [ ] Go to `/dashboard/sites/[siteId]/automation` (ensure Automation is installed)
- [ ] Click **New Workflow**
- [ ] Name it: "New Contact Welcome"
- [ ] Set Trigger: `crm.contact.created`
- [ ] Add Action: Send Email (select a template)
- [ ] Activate the workflow

### 16.2 Trigger the Workflow
- [ ] Go to CRM → create a new contact
- [ ] Go back to Automation → **Executions** → verify a new execution appears with status "Completed"

### 16.3 Automation Templates
- [ ] Go to **Templates** → browse pre-built templates
- [ ] Install one (e.g., "Welcome Drip" or "Overdue Invoice Reminder") → verify it appears in workflows

---

## SECTION 17: AI Agents

- [ ] Go to `/dashboard/sites/[siteId]/ai-agents`
- [ ] Click **New Agent**
- [ ] Name: "Support Bot", assign a prompt/role
- [ ] Go to **Marketplace** tab → browse available agent templates
- [ ] Go to **Testing** tab → send a test message → verify the agent responds
- [ ] Go to **Analytics** tab → verify execution stats load

---

## SECTION 18: Invoicing Module

### 18.1 Settings
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/settings`
- [ ] Set company name, invoice prefix, next invoice number, default due days
- [ ] Add a tax rate (e.g., "VAT 15%")
- [ ] Save → verify success

### 18.2 Create & Send Invoice
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/invoices`
- [ ] Click **New Invoice**
- [ ] Select a client (one you created in Section 7)
- [ ] Add line items with quantities and prices
- [ ] Apply the tax rate
- [ ] Click **Save as Draft** → verify invoice number is auto-assigned
- [ ] Click **Send Invoice** → confirm email is sent to the client

### 18.3 Payment Recording
- [ ] On the invoice detail, click **Record Payment**
- [ ] Enter amount, method (Bank Transfer), reference number
- [ ] Click **Save** → verify invoice status changes to "Paid" (or "Partial")

### 18.4 Recurring Invoices
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/recurring`
- [ ] Click **New Recurring**
- [ ] Select client, frequency: Monthly, start date: today
- [ ] Save → verify status is "Active"
- [ ] Click **Generate Now** → confirm a new invoice is created

### 18.5 Credit Note
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/credits`
- [ ] Click **New Credit Note**
- [ ] Link to the paid invoice → enter a reason and amount
- [ ] Issue the credit note → verify it appears with status "Issued"

### 18.6 Expenses
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/expenses`
- [ ] Click **New Expense**
- [ ] Category: Office Supplies, Amount: $45, Date: today
- [ ] Upload a receipt image
- [ ] Save → verify it appears in the list

### 18.7 Financial Reports
- [ ] Go to `/dashboard/sites/[siteId]/invoicing` (dashboard)
- [ ] Verify: Revenue, Outstanding, Overdue metric cards load
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/reports/pnl` → verify P&L statement
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/reports/aging` → verify aging report
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/reports/tax` → verify tax summary
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/reports/expenses` → verify expense breakdown

### 18.8 Vendor Management
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/vendors`
- [ ] Click **New Vendor** → fill in company, contact, email
- [ ] Save → click vendor → view detail with tabs

### 18.9 Purchase Orders
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/purchase-orders`
- [ ] Click **New Purchase Order** → select vendor → add line items
- [ ] Save as Draft → click **Send** → confirm email sent
- [ ] Mark as **Received** when goods arrive → verify status changes

### 18.10 Bills
- [ ] Go to `/dashboard/sites/[siteId]/invoicing/bills`
- [ ] Click **New Bill** → select vendor → add line items
- [ ] Approve the bill → click **Record Payment** → verify status changes to "Paid"

---

## SECTION 19: Client Portal (as Client)

Log in to the client portal with the client account you created in Section 7.3.

- [ ] `/portal` — Dashboard loads with site overview
- [ ] `/portal/sites` — Site list appears
- [ ] `/portal/sites/[siteId]/invoicing` — Client can see invoices sent to them
- [ ] `/portal/sites/[siteId]/invoicing/invoices/[invoiceId]` — Full invoice view with **Pay Now** button
- [ ] `/portal/sites/[siteId]/orders` — E-commerce orders visible (if applicable)
- [ ] `/portal/sites/[siteId]/bookings` — Bookings visible (if applicable)
- [ ] `/portal/sites/[siteId]/crm` — CRM view (if permitted)
- [ ] `/portal/support` — Submit a support ticket: subject, description, priority
- [ ] Verify ticket confirmation email arrives
- [ ] `/portal/settings` — Client can update their own profile
- [ ] `/portal/media` — Client media library (files they've uploaded)

---

## SECTION 20: Domains

- [ ] Go to `/dashboard/domains`
- [ ] Click **Search** → search for `testdomain-xyz.com`
- [ ] Verify availability check returns results (available / taken)
- [ ] If available, add to cart → proceed to checkout
- [ ] Go to `/dashboard/domains/settings` → verify domain settings page loads
- [ ] Go to `/dashboard/domains/settings/billing` → verify billing info
- [ ] Go to `/dashboard/domains/settings/pricing` → verify pricing config

---

## SECTION 21: Email Hosting

- [ ] Go to `/dashboard/email`
- [ ] Click **Purchase Email** → go to `/dashboard/email/purchase`
- [ ] Select a domain → choose a plan
- [ ] Complete purchase (test card)
- [ ] Go back to `/dashboard/email` → verify order appears
- [ ] Click order → `/dashboard/email/[orderId]/accounts` → create email account (e.g., `info@yourdomain.com`)
- [ ] Go to `/dashboard/email/[orderId]/settings` → verify settings load

---

## SECTION 22: Billing & Subscriptions

- [ ] Go to `/dashboard/billing` → verify subscription plan, next billing date, payment method
- [ ] Go to `/settings/billing` → verify same
- [ ] Go to `/settings/subscription` → verify plan details
- [ ] If on a paid plan: click **Manage Subscription** → Paddle portal opens

---

## SECTION 23: Agency Settings (Full Audit)

Go through each settings page and confirm every form loads and saves:

- [ ] `/settings/profile` — Name, email, avatar → save
- [ ] `/settings/agency` — Agency name, address, timezone → save
- [ ] `/settings/branding` — Logo, primary color, font → save; verify live preview updates
- [ ] `/settings/regional` — Currency, date format, language → save
- [ ] `/settings/notifications` — Toggle email notifications → save
- [ ] `/settings/security` — Change password, 2FA setup (if available)
- [ ] `/settings/team` — Verified in Section 8
- [ ] `/settings/activity` — Activity log loads (recent actions visible)
- [ ] `/settings/modules` — Installed modules list, enable/disable toggles
- [ ] `/settings/domains` — Custom domain config

---

## SECTION 24: Developer / Marketplace Features

### 24.1 Module Builder
- [ ] Go to `/dashboard` → look for **AI Module Builder** or `/dashboard/sites/[siteId]/builder`
- [ ] Open the AI chat → type: "Create a feedback form module"
- [ ] Verify multi-step generation process runs

### 24.2 Module Reviews
- [ ] Go to `/marketplace/[any-moduleId]`
- [ ] Scroll to Reviews — verify reviews load
- [ ] Submit a review (rating + text) → verify it appears

### 24.3 Module Requests
- [ ] Go to `/dashboard/modules/requests`
- [ ] Click **New Request** → describe a module idea
- [ ] Submit → verify it appears in the listing with vote count

### 24.4 Developer Revenue (if developer account)
- [ ] Go to `/developer/revenue`
- [ ] Verify earnings dashboard loads (may show $0 for new accounts)

---

## SECTION 25: Support Tickets

### 25.1 Agency Support
- [ ] Go to `/dashboard/support` → click **New Ticket**
- [ ] Fill in subject, description, priority, category
- [ ] Submit → confirm email notification
- [ ] Go to `/dashboard/tickets` → find the ticket
- [ ] Click → add a reply → verify conversation thread

---

## SECTION 26: Quote System

- [ ] Navigate to `/quote/[token]` (use a token from a previously sent quote, or check Supabase for a test quote)
- [ ] Verify the quote renders with line items, totals, expiry date
- [ ] Click **Accept** → verify acceptance confirmation
- [ ] (Alternative: go to CRM deals → create quote from deal)

---

## SECTION 27: Public-Facing Pages

These should be accessible without login:

- [ ] `/pricing` — Pricing page loads with plan comparison
- [ ] `/privacy` — Privacy policy loads
- [ ] `/terms` — Terms of service loads
- [ ] `/marketplace` — Public marketplace (unauthenticated) loads
- [ ] `/templates` — Template gallery loads
- [ ] `/unsubscribe` — Unsubscribe page loads (email marketing unsubscribe)
- [ ] `https://[subdomain].sites.dramacagency.com` — Published site renders correctly
- [ ] `https://[subdomain].sites.dramacagency.com/sitemap.xml` — Sitemap accessible
- [ ] `https://[subdomain].sites.dramacagency.com/robots.txt` — Robots.txt accessible

---

## SECTION 28: Admin Panel (Super Admin Only)

If you have super admin access:

- [ ] Go to `/admin` → verify platform overview dashboard
- [ ] Go to `/admin/modules/invoicing` → verify platform-wide invoicing health
- [ ] Review flagged sites, auto-paused campaigns

---

## POST-TESTING CHECKLIST

After completing all sections:

- [ ] No console errors in browser DevTools on any major page
- [ ] No 404 pages encountered (all routes resolved)
- [ ] No 500 errors (all server actions returned data)
- [ ] Emails were received for: signup, invoice, support ticket, booking confirmation
- [ ] Live site renders correctly on mobile (check in browser DevTools device simulator)
- [ ] Vercel deployment is READY at https://vercel.com/drake-machikos-projects/dramac-cms

---

## QUICK SMOKE TEST (5 minutes)

If you just need to confirm the deployment is healthy without full walkthrough:

1. `/login` — can log in ✓
2. `/dashboard` — dashboard loads ✓
3. `/dashboard/sites` — site list loads ✓
4. `/dashboard/sites/[siteId]/builder` — Studio loads ✓
5. `/dashboard/sites/[siteId]/invoicing` — Invoicing dashboard loads ✓
6. `/portal/login` + portal dashboard — client portal loads ✓
7. `/marketplace` — marketplace loads ✓
8. `https://[subdomain].sites.dramacagency.com` — live site renders ✓

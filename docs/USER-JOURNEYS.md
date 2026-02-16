# DRAMAC CMS — Complete User Journeys

**Version**: 2.0  
**Last Updated**: February 16, 2026  
**Platform**: DRAMAC Enterprise Module Marketplace  
**URL**: `app.dramacagency.com`

---

## Table of Contents

1. [Roles & Permissions](#roles--permissions)
2. [Super Admin Journeys](#1-super-admin-journeys)
3. [Agency Owner Journeys](#2-agency-owner-journeys)
4. [Business Owner / Client Journeys](#3-business-owner--client-journeys)
5. [Site User / Visitor Journeys](#4-site-user--visitor-journeys)
6. [Domain & Email Journeys](#5-domain--email-journeys)
7. [Live Chat Journeys](#6-live-chat-journeys)
8. [Billing & Subscription Journeys](#7-billing--subscription-journeys)
9. [CRM Journeys](#8-crm-journeys)
10. [Module Marketplace Journeys](#9-module-marketplace-journeys)
11. [Verification Checklist](#verification-checklist)
12. [Environment Requirements](#environment-requirements)

---

## Roles & Permissions

| Role | Description | Dashboard Access |
|------|-------------|-----------------|
| **Super Admin** | Platform owner. Full access to all agencies, billing, analytics, modules | `/admin/*` |
| **Agency Owner** | Runs an agency. Manages sites, team, billing, domains, modules for their agency | `/dashboard/*` |
| **Agency Member** | Team member within an agency. Access based on role (admin/editor/viewer) | `/dashboard/*` (limited) |
| **Business Owner / Client** | Uses the client portal. Manages their site, support tickets | `/portal/*` |
| **Site Visitor / End User** | Interacts with published sites. Uses chat widgets, forms, ecommerce | Public site pages |

---

## 1. Super Admin Journeys

### J-SA-01: Platform Overview
1. Login → `/login`
2. Redirect → `/admin` (admin dashboard)
3. View: Total agencies, active sites, revenue, module installs
4. Click "Agencies" → `/admin/agencies` — list of all agencies
5. Click agency → `/admin/agencies/[id]` — agency detail
6. Actions: Suspend, delete, impersonate, manage billing

### J-SA-02: Module Management
1. `/admin/modules` → List all published modules
2. Click module → review, approve/reject
3. `/admin/modules/create` → Create new platform module
4. Set: Name, description, category, pricing tier, permissions
5. Submit → Module available in marketplace

### J-SA-03: Pricing & Cache Management
1. `/admin/pricing` → View live pricing cache status
2. See: Cache age, TLD count, last refresh time
3. Click "Refresh Cache" → Re-fetches from ResellerClub
4. Verify: .com, .net, .org prices match RC panel

### J-SA-04: Platform Settings
1. `/admin/settings` → General platform configuration
2. Tabs: General, Billing, Email, Security, Advanced
3. Configure: Platform name, support email, default locale
4. Save → Settings applied globally

---

## 2. Agency Owner Journeys

### J-AO-01: Agency Onboarding
1. Sign up → `/signup`
2. Enter: Name, email, password
3. Email verification → click link
4. Create agency → Agency name, logo
5. Redirect → `/dashboard` (main dashboard)
6. See: Welcome wizard / empty state with "Create First Site"

### J-AO-02: Site Creation
1. `/dashboard` → Click "New Site" or "Create Site"
2. Enter: Site name, subdomain
3. Submit → Site created
4. Redirect → `/dashboard/sites/[siteId]` — site overview
5. Actions: Edit, preview, publish, manage modules

### J-AO-03: Team Management
1. `/dashboard/settings/team` → Team members list
2. Click "Invite Member" → Enter email, select role (admin/editor/viewer)
3. Submit → Invitation sent via email
4. Invitee clicks link → Creates account → Joins agency
5. Owner can: Change role, remove member

### J-AO-04: Module Installation
1. `/dashboard/marketplace` → Browse available modules
2. Search/filter by category
3. Click module → View details, screenshots, pricing
4. Click "Install" → Select target site
5. Module appears in site's modules list
6. Configure module settings → Module active on site

### J-AO-05: Custom Domain Setup
1. `/dashboard/sites/[siteId]/settings` → Domains section
2. Click "Add Custom Domain"
3. Enter domain name (e.g., `mybusiness.com`)
4. Get: DNS records to configure (CNAME/A records)
5. Verify → Domain connected → SSL auto-provisioned

### J-AO-06: Dashboard Navigation
1. `/dashboard` → Overview (stats, recent activity)
2. Sidebar navigation:
   - **Sites** → `/dashboard/sites` (all sites)
   - **Domains & Email** → `/dashboard/domains` (domain reselling)
   - **Domain Settings** → `/dashboard/domains/settings` (pricing, billing)
   - **Email** → `/dashboard/email` (business email orders)
   - **CRM** → `/dashboard/crm` (contacts, deals, pipeline)
   - **Marketplace** → `/dashboard/marketplace` (modules)
   - **Settings** → `/dashboard/settings` (team, billing, custom domains)
   - **Admin** → `/admin` (super admins only)

---

## 3. Business Owner / Client Journeys

### J-BO-01: Client Portal Access
1. Login → `/login`
2. Redirect → `/portal` (client portal)
3. View: Their site(s), modules, support

### J-BO-02: Support Tickets
1. `/portal/support` → List existing tickets
2. Click "New Ticket" → `/portal/support/new`
3. Enter: Subject, description, priority
4. Submit → Ticket created
5. Agency receives notification
6. View replies, add comments, upload attachments

### J-BO-03: Site Management (Limited)
1. `/portal/sites/[siteId]` → Site overview
2. Actions available depend on agency permissions:
   - Edit content (if granted)
   - View analytics
   - Manage module settings

---

## 4. Site User / Visitor Journeys

### J-SU-01: Live Chat Widget Interaction
1. Visit published site
2. Chat widget appears (bottom-right, configurable)
3. Click launcher → Widget opens
4. If pre-chat form enabled:
   - Enter: Name, email (phone optional)
   - Click "Start Chat"
5. Conversation created → Status: `pending`
6. Type message → Send
7. Wait for agent response (see typing indicator)
8. Agent responds → Message appears in real-time
9. If no agent available → AI auto-response (if configured)
10. Conversation ends → Rating widget appears (1-5 stars + comment)
11. Submit rating → Agent notified

### J-SU-02: Offline Form
1. Visit site outside business hours (if configured)
2. Widget shows offline state with custom message
3. Click launcher → Offline form appears
4. Enter: Name, email, message
5. Submit → Message stored for agent review
6. Agent responds when online → Visitor notified

### J-SU-03: WhatsApp Chat
1. Click WhatsApp button on site
2. Opens WhatsApp with pre-filled message
3. Message arrives via webhook → Conversation created in dashboard
4. Agent responds from dashboard → Message sent via WhatsApp API

---

## 5. Domain & Email Journeys

### J-DE-01: Domain Search & Registration
1. `/dashboard/domains` → Domain list (existing domains)
2. Click "Register Domain" → `/dashboard/domains/search`
3. Enter domain name → Click "Search"
4. Results appear with availability + pricing (from ResellerClub)
5. Click "Add to Cart" for desired domains
6. Floating cart appears → Click "Checkout"
7. → `/dashboard/domains/cart` (3-step checkout wizard)
8. **Step 1 — Review Cart**: domains, years selector, privacy toggle, price totals
9. **Step 2 — Contact Info**: registrant name, email, phone, address
10. **Step 3 — Confirm & Pay**: review summary → Click "Complete"
11. Server: `createDomainCartCheckout()` → `createDomainPurchase()` → Paddle transaction
12. Client: `openPaddleTransactionCheckout({transactionId, successUrl})`
13. Paddle overlay opens → Enter payment details → Complete payment
14. → `/dashboard/domains/success?purchase_id=...`
15. Page polls `/api/purchases/status` every 5 seconds
16. Paddle webhook fires → `handleTransactionCompleted()` → `provisionDomainRegistration()`
17. ResellerClub API registers domain → Status: `completed`
18. Domain appears in `/dashboard/domains` list

### J-DE-02: Domain Management
1. `/dashboard/domains` → Click "Manage" on a domain
2. → `/dashboard/domains/[domainId]` — Domain detail page
3. **Overview**: Status, expiry date, nameservers, WHOIS privacy, auto-renew toggles
4. **Connected Site**: If linked to a DRAMAC site, shows link
5. **Quick Actions**:
   - **DNS** button → `/dashboard/domains/[domainId]/dns`
   - **Email** button → `/dashboard/domains/[domainId]/email`
   - **Settings** button → `/dashboard/domains/[domainId]/settings`
   - **Renew** button → `/dashboard/domains/[domainId]/renew`

### J-DE-03: DNS Management
1. `/dashboard/domains/[domainId]/dns`
2. View existing DNS records in table (type, host, value, TTL, proxy status)
3. **Add Record**: Click "Add Record" → Fill: Type (A/CNAME/MX/TXT/etc), Host, Value, TTL → Save
4. **Edit Record**: Click edit icon → Modify → Save
5. **Delete Record**: Click delete → Confirm → Deleted
6. **Sync**: Click "Sync" → Syncs with DNS provider
7. **Quick Setup**: Click dropdown → Select template (e.g., "Cloudflare", "Email MX") → Auto-adds records
8. **Propagation Checker**: Enter hostname → Check DNS propagation globally

### J-DE-04: Domain Renewal
1. **From detail page**: `/dashboard/domains/[domainId]/renew`
   - Select years (1/2/3/5)
   - View pricing per year
   - Click "Renew Domain" → Paddle checkout overlay → Payment → Renewed
2. **From domain list dialog**: `/dashboard/domains` → Click "Renew"
   - Select years → Click "Renew Domain" → Paddle checkout → Payment → Renewed

### J-DE-05: Domain Transfer
1. `/dashboard/domains/transfer` → Transfer overview page
2. **Transfer In**: Click "Transfer In" → `/dashboard/domains/transfer/new`
   - Enter: Domain name, auth/EPP code
   - Submit → Transfer initiated with ResellerClub
3. Track status: `/dashboard/domains/transfer/[transferId]`
4. Transfer completes → Domain appears in domain list
5. **Transfer Out**: From domain settings, get auth code → Provide to new registrar

### J-DE-06: Business Email Purchase
1. `/dashboard/email` → Email orders list
2. Click "Purchase Email" → `/dashboard/email/purchase`
3. **Email Purchase Wizard**:
   - Step 1: Select/enter domain
   - Step 2: Choose plan (number of accounts, storage tier)
   - Step 3: Review & Pay → Paddle transaction checkout
4. Webhook → Provisions email with Titan Email
5. `/dashboard/email/[orderId]` — Order detail page
6. `/dashboard/email/[orderId]/accounts` — Manage email accounts
   - Create new accounts, delete accounts
   - Open Webmail → `https://app.titan.email`
7. `/dashboard/email/[orderId]/settings` — Order settings

### J-DE-07: Domain Settings (Agency-Level Config)
1. `/dashboard/domains/settings` → Settings overview with 3 cards
2. **Pricing Configuration** → `/dashboard/domains/settings/pricing`
   - View TLD pricing table (register, renew, transfer prices)
   - Configure markup percentages
   - Pricing calculator
3. **White-Label Branding** → `/dashboard/domains/settings/branding`
   - Configure domain service branding
4. **Billing Integration** → `/dashboard/domains/settings/billing`
   - Paddle billing integration settings

---

## 6. Live Chat Journeys

### J-LC-01: Module Setup (First Time)
1. `/dashboard/sites/[siteId]` → Modules tab
2. Find "Live Chat" → Click "Install"
3. → `/dashboard/sites/[siteId]/live-chat` — Overview page (empty state)
4. Click "Add Agents" → Navigates to Agents page
5. Click "Add Agent" → Dialog opens
6. Select team member from dropdown (includes agency owner + team members)
7. Fill: Display name, email, role, max concurrent chats, department
8. Click "Add Agent" → Agent created
9. Navigate to Settings → Embed tab
10. Copy embed script → Add to website `<head>` tag
11. Widget appears on the live site → Ready for conversations

### J-LC-02: Agent Daily Workflow
1. Login → Navigate to site's live chat
2. `/dashboard/sites/[siteId]/live-chat` — **Overview Dashboard**
   - Stats cards: Active conversations, pending, online agents, avg response time, today's count, resolved today, missed today, satisfaction score
   - Recent conversations list (clickable)
   - Agent status panel
3. Click conversation → `/dashboard/sites/[siteId]/live-chat/conversations/[id]`
4. **Chat Interface (Two-Panel)**:
   - **Center panel — Chat**:
     - Message history with visitor
     - Header: Visitor name, back button, priority dropdown, assign dropdown, resolve button, more menu
     - Transfer bar (when transferring): Select target agent
     - Load older messages (pagination)
     - Typing indicator when visitor is typing
     - Message input: Text area with send button
   - **Right panel — Info**:
     - Visitor Details: Name, email, phone, location, browser, OS, current URL
     - Conversation Info: Status, priority, channel, message count, created date, assigned agent
     - Tags: View, add (type + Enter), remove (click X)
     - CRM Contact link (if matched)
     - Keyboard Shortcuts reference card

### J-LC-03: Message Sending
1. Type message in input area
2. **Send**: Press `Enter` or `Ctrl+Enter` or click Send button
3. **New line**: Press `Shift+Enter`
4. **Canned Response**: Type `/` → dropdown appears → select response → content inserted
5. **Internal Note**: Press `Ctrl+/` → switches to note mode (yellow indicator) → notes visible only to agents
6. **@Mention**: In note mode, type `@` → select agent → creates notification for that agent
7. **File Upload**: Click 📎 → select file → uploaded and sent

### J-LC-04: Conversation Management
1. **Assign**: Use assign dropdown in header → Select agent → Agent receives notification
2. **Transfer**: Click ⋮ menu → "Transfer Conversation" → Select target agent → Transferred
3. **Resolve**: Click "Resolve" button or press `Ctrl+R` → Visitor gets rating prompt
4. **Close**: Click ⋮ → "Close Conversation" or press `Ctrl+Shift+C`
5. **Reopen**: Click ⋮ → "Reopen Conversation" or press `Ctrl+Shift+O`
6. **Priority**: Use priority dropdown → Set low/normal/high/urgent
7. **Tags**: In right panel, type tag name → press Enter → tag added. Click X to remove.

### J-LC-05: Agent Management
1. `/dashboard/sites/[siteId]/live-chat/agents`
2. **View**: Agent cards showing name, email, role, status (online/away/offline), department, current chats
3. **Add Agent**: Click "Add Agent" → Select team member → Fill details → Submit
4. **Edit Agent**: Click "Edit" on card → Edit dialog → Modify details → Save
5. **Remove Agent**: Click "Remove" → Agent deactivated (soft delete)
6. **Departments**: Bottom section — Add department, set default, delete

### J-LC-06: Canned Responses
1. `/dashboard/sites/[siteId]/live-chat/canned-responses`
2. View: Grid of response cards (title, shortcut, category, usage count)
3. **Create**: Click "New Response" → Title, content, shortcut (e.g., `/greeting`), category → Create
4. **Edit**: Hover card → Click ✏️ → Edit dialog → Save
5. **Delete**: Hover card → Click 🗑️ → Confirm → Deleted
6. **Use**: In chat, type `/` → Select from popup → Content inserted, usage count incremented

### J-LC-07: Knowledge Base
1. `/dashboard/sites/[siteId]/live-chat/knowledge-base`
2. View: Grid of article cards (title, category, content preview)
3. **Create**: Click "New Article" → Title, content, category → Create
4. **Edit**: Hover → ✏️ → Edit → Save
5. **Delete**: Hover → 🗑️ → Confirm → Deleted
6. **Purpose**: AI auto-response uses articles as context for intelligent responses

### J-LC-08: Analytics
1. `/dashboard/sites/[siteId]/live-chat/analytics`
2. Select date range: 7d / 14d / 30d / 90d
3. **Charts**:
   - Conversations Over Time (area chart)
   - Response Time Trend (area chart)
   - Channel Breakdown (pie: widget/WhatsApp/API)
   - Satisfaction Distribution (bar: 1-5 stars)
   - Busiest Hours (bar chart)
   - Agent Leaderboard (table: conversations, response time, satisfaction)
4. Click "Export CSV" → Download analytics data

### J-LC-09: Settings
1. `/dashboard/sites/[siteId]/live-chat/settings` — 8 tabs
2. **Appearance**: Primary color, text color, position (left/right), icon, size, border radius, z-index, preview
3. **Branding**: Company name, logo URL, welcome message, away message, offline message, language
4. **Pre-Chat Form**: Enable, required fields (name, email, phone, message), department selector
5. **Business Hours**: Enable, timezone, per-day toggle + start/end times
6. **Behavior**: Auto-open delay, show avatar, show agent name, typing indicator, file uploads, emoji, sound, satisfaction rating, auto-close (enable, timeout, message)
7. **Embed**: Script tag embed code (copy button), iframe alternative, platform guides
8. **WhatsApp**: Enable, phone number, phone number ID, business account ID, welcome template
9. **Advanced**: Allowed domains, blocked IPs, max file size, allowed file types

### J-LC-10: Notification Flow (Complete)
1. **Visitor sends message** →
2. **Layer 1 — Realtime (instant)**: `useChatRealtime` hook → Audio plays + Toast popup with "View" action
3. **Layer 2 — In-app notification (DB)**: `notifyNewChatMessage()` → Creates `notifications` record → NotificationBell animates + shows count
4. **Layer 3 — Web push**: `sendPushToUser()` → Browser push notification (works even in background)
5. **On assignment**: `notifyChatAssigned()` → "Chat assigned to you" in-app notification
6. **On low rating**: `notifyChatRating()` → Notification to agent + site owner
7. **On missed chat**: `notifyChatMissed()` → Notification to site owner

### J-LC-11: Keyboard Shortcuts Reference
| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Send message | Message input |
| `Shift+Enter` | New line | Message input |
| `Ctrl+Enter` | Send message | Message input |
| `/` | Open canned responses | Message input |
| `@` | Mention agent (in notes) | Message input (note mode) |
| `Ctrl+/` | Toggle note mode | Message input |
| `Escape` | Clear input / close panels | Message input |
| `Ctrl+R` | Resolve conversation | Global (not in input) |
| `Ctrl+Shift+C` | Close conversation | Global (not in input) |
| `Ctrl+Shift+O` | Reopen conversation | Global (not in input) |
| `Escape` | Back to conversations list | Global (not in input) |

---

## 7. Billing & Subscription Journeys

### J-BI-01: Agency Subscription (Paddle)
1. `/dashboard/settings/billing` → Current plan, usage
2. Click "Upgrade" → Pricing page
3. Select plan: Starter / Pro → Monthly / Annual
4. Click "Subscribe" → `openPaddleCheckout({priceId, agencyId, email})`
5. Paddle overlay → Enter payment details → Complete
6. Webhook: `handleSubscriptionCreated()` → Update agency plan
7. Features unlocked based on plan tier

### J-BI-02: Domain/Email Purchase (Paddle Transaction)
1. User adds domain/email to cart → Proceeds to checkout
2. Server: `createDomainPurchase()` or `createEmailPurchase()` → Creates Paddle transaction (non-catalog, inline items)
3. Client: `openPaddleTransactionCheckout({transactionId, successUrl})`
4. Paddle overlay → Payment
5. Webhook: `handleTransactionCompleted()` → Provisions resource
6. Success page polls until status: `completed`

**CRITICAL — Two Paddle Checkout Patterns:**
| Pattern | Function | Use Case | Params |
|---------|----------|----------|--------|
| **Subscription** | `openPaddleCheckout()` | Monthly/annual plans | `{priceId, agencyId, email}` |
| **Transaction** | `openPaddleTransactionCheckout()` | One-time purchases (domains, email) | `{transactionId, successUrl}` |

**CRITICAL — No pre-configured Paddle products needed for domains/emails.** Domain and email purchases use non-catalog inline items — prices are created dynamically at transaction time.

---

## 8. CRM Journeys

### J-CR-01: Contact Management
1. `/dashboard/crm` → Contacts list
2. Click "Add Contact" → Fill details → Save
3. Click contact → Contact detail page
4. View: History, deals, communications, notes
5. Link to live chat conversations (if visitor matched)

### J-CR-02: Deal Pipeline
1. `/dashboard/crm/deals` → Kanban board
2. Drag deals between stages
3. Click deal → Deal detail, linked contacts, activities
4. Add/edit deals, close won/lost

---

## 9. Module Marketplace Journeys

### J-MM-01: Browse & Install
1. `/dashboard/marketplace` → Grid of available modules
2. Filter by category, search by name
3. Click module → Detail page with description, screenshots, pricing
4. Click "Install" → Select target site → Confirm
5. Module installed → Configure in site's modules section

### J-MM-02: Module Configuration
1. `/dashboard/sites/[siteId]` → Modules tab
2. Click installed module → Module settings page
3. Configure module-specific settings
4. Enable/disable module → Changes reflected on live site

---

## Verification Checklist

### Domain Checkout Flow
- [x] Domain search returns results with correct pricing
- [x] "Add to Cart" adds to client-side cart
- [x] Checkout navigates to cart page
- [x] Cart shows correct items and totals
- [x] Contact form collects registrant details
- [x] `createDomainCartCheckout()` creates Paddle transaction — TS errors fixed
- [x] `openPaddleTransactionCheckout()` opens Paddle overlay
- [x] Success page polls for status updates — API types fixed
- [x] Webhook provisions domain via ResellerClub
- [x] Renew from detail page → Paddle checkout redirect
- [x] Renew from list dialog → Paddle checkout redirect (was silently broken, now fixed)
- [ ] **REQUIRES**: `PADDLE_API_KEY` and related env vars in Vercel production

### Live Chat Agent Flow
- [x] Agency owner appears in team member dropdown
- [x] Add Agent button enables when member selected + name filled
- [x] Soft-deleted agents filtered from agent list (fixed: `is_active` filter)
- [x] Soft-deleted agents filtered from assignment dropdowns
- [x] Edit agent dialog works
- [x] Remove agent soft-deletes correctly
- [x] Can re-add a previously deleted agent

### Live Chat Conversation Flow
- [x] Widget creates conversation correctly
- [x] Auto-assign to online agent with capacity (column comparison fixed)
- [x] Away agents excluded from auto-assignment
- [x] Messages sent/received in real-time
- [x] Typing indicators work
- [x] Canned responses work + usage tracking
- [x] Internal notes work
- [x] Agent assignment notifications sent (notifyChatAssigned wired)
- [x] Transfer conversation works (UI added)
- [x] Tags can be added/removed (UI added)
- [x] Keyboard shortcuts work
- [x] Rating submitted and notified
- [x] AI auto-response triggered for unassigned conversations
- [x] Unread count incremented correctly

### Notification Flow
- [x] Realtime toast + sound on new message
- [x] In-app notification created in DB
- [x] NotificationBell shows count + animates
- [x] Web push sent to agent
- [x] Assignment notification sent on manual assign
- [x] x-pathname header set for nav active state

---

## Environment Requirements

### Paddle (CRITICAL — Must be set in Vercel)
```
PADDLE_API_KEY=pdl_...                          # Server-side API key
PADDLE_WEBHOOK_SECRET=pdl_ntf...                # Webhook verification
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_... or live_... # Client-side token
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox           # or "production"
```

**Paddle Dashboard Setup Required:**
1. Create webhook notification → `https://app.dramacagency.com/api/webhooks/paddle`
2. Subscribe to events: `transaction.completed`, `subscription.created`, `subscription.updated`, `subscription.canceled`

### ResellerClub
```
RESELLERCLUB_RESELLER_ID=...
RESELLERCLUB_API_KEY=...
```

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Resend (Email)
```
RESEND_API_KEY=...
```

### AI (Claude — Primary Provider)
```
ANTHROPIC_API_KEY=...
```

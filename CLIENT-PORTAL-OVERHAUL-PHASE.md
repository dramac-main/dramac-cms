# Client Portal Overhaul — Complete Phase Document

## Executive Summary

The DRAMAC CMS client portal at `/portal/` is currently a passive viewing dashboard where clients can see their sites, browse media, view form submissions, and submit support tickets. It was built before the platform evolved into a full enterprise module marketplace with Live Chat, E-Commerce, Booking, CRM, Automation, and more.

The portal must be transformed into a full business operations center. Clients are the actual business owners — the salon owner who needs to see today's bookings, the shop owner who needs to ship orders, the service company that needs to respond to live chat. The agency builds and configures their platform, but the client runs day-to-day operations.

This document specifies every detail needed to implement the overhaul. The guiding principles are absolute: zero code duplication, permission-gated access controlled by the agency, data pulled from existing module sources (never hard-coded), and a future-proof module registration pattern so any module built in the future automatically integrates.

---

## Platform Hierarchy (Context)

```
Super Admin (DRAMAC platform team — manages agencies, platform settings)
    └── Agency (reseller/builder — sets up sites, installs modules, manages clients)
            └── Client (the actual business owner — runs daily operations via portal)
```

The client portal is the third level. Agencies create clients, assign them sites, install modules on those sites, and grant portal permissions. Clients then use the portal to operate their business through those modules.

---

## Current State of the Client Portal

### What Exists Today

The portal is located at `src/app/portal/` with routes under `(portal)/portal/`. The portal layout is at `src/app/portal/layout.tsx`. It uses `getPortalSession()` and `requirePortalAuth()` from `src/lib/portal/portal-auth.ts` for authentication, supporting both real auth (Supabase Auth linked via `clients.portal_user_id`) and agency impersonation (via `impersonating_client_id` cookie).

Current portal pages:
- `/portal` — Dashboard (site list, ticket stats, basic analytics)
- `/portal/sites` — Site list and site detail
- `/portal/analytics` — Analytics (proxied from form submissions, not real metrics)
- `/portal/media` — Media library (read-only)
- `/portal/submissions` — Form submissions viewer
- `/portal/blog` — Blog posts (read-only)
- `/portal/seo` — SEO audit page
- `/portal/domains` — Domain status
- `/portal/email` — Business email accounts
- `/portal/apps` — Installed modules catalog
- `/portal/apps/browse` — Browse marketplace
- `/portal/support` — Support tickets to agency
- `/portal/support/new` — Create ticket
- `/portal/support/[ticketId]` — Ticket detail
- `/portal/invoices` — Billing history (Paddle)
- `/portal/notifications` — Notification list
- `/portal/settings` — Profile and password

Portal services at `src/lib/portal/`:
- `portal-auth.ts` — Authentication, session management, impersonation
- `portal-service.ts` — Site data, analytics, permissions
- `support-service.ts` — Tickets
- `notification-service.ts` — Notifications
- `portal-billing-service.ts` — Billing via Paddle
- `portal-media-service.ts` — Media browsing

### What Is Missing

The portal has zero integration with any of the major operational modules:
- No Live Chat (cannot respond to customers)
- No E-Commerce (cannot manage orders, products, quotes, customers, inventory)
- No Booking (cannot view appointments, calendar, services)
- No CRM (cannot manage contacts, deals, pipeline)
- No Automation (cannot view or manage workflows)
- No Chat Agent Management (cannot add agents for their live chat)

### Current Permission Model

The `clients` table has these portal-relevant columns:
- `has_portal_access` (boolean) — master switch for portal access
- `portal_user_id` (UUID, FK to auth.users) — links to auth
- `can_view_analytics` (boolean, default true)
- `can_edit_content` (boolean, default false)
- `can_view_invoices` (boolean, default true)

The `client_site_permissions` table has per-site overrides:
- `client_id` + `site_id` (unique composite)
- `can_view` (boolean, default true)
- `can_edit_content` (boolean, default false)
- `can_view_analytics` (boolean, default true)
- `can_publish` (boolean, default false)

The `PortalUser` interface in `portal-auth.ts`:
```typescript
interface PortalUser {
  userId: string;       // auth.users.id
  clientId: string;     // clients.id
  email: string;
  fullName: string;
  companyName: string;
  agencyId: string;
  canViewAnalytics: boolean;
  canEditContent: boolean;
  canViewInvoices: boolean;
}
```

The `PortalUserPermissions` interface in `portal-navigation.ts`:
```typescript
interface PortalUserPermissions {
  canViewAnalytics: boolean;
  canViewInvoices: boolean;
}
```

The portal sidebar is generated dynamically by `getPortalNavigationGroups()` in `src/config/portal-navigation.ts`, consuming `PortalUserPermissions` and rendering conditional nav items.

---

## Architecture Principles (Non-Negotiable)

### 1. Zero Code Duplication

Every portal page must mount existing module components. The `EcommerceDashboard`, `BookingDashboard`, `ConversationViewWrapper`, CRM views, and automation views already exist as self-contained client components that take `siteId` as a prop. The portal must reuse these exact components. Never recreate any module UI. If a bug is fixed in the dashboard version, it must automatically be fixed in the portal version because they are the same component.

### 2. Permission-Gated by the Agency

The agency controls exactly what each client can access. Not every client needs to see everything — a client running a simple blog does not need the CRM pipeline or automation workflows. A client running an online store needs orders and products but might not need the booking calendar. The agency decides what to enable per-client and per-site through granular permissions.

### 3. Module-Aware Dynamic Navigation

The portal sidebar must only show navigation items for modules that are actually installed and enabled on the client's site(s). If a site has no booking module installed, the Bookings nav item must not appear. If ecommerce is installed, Orders, Products, and Quotes nav items must appear (subject to permissions). This detection uses the existing `site_module_installations` table and `getInstalledModulesForSite()` from `src/lib/studio/registry/module-discovery.ts`.

### 4. Pull From Source, Never Duplicate Data

Every piece of data shown in the portal must be pulled from the actual module's database tables and through the actual module's server actions. Live chat conversations come from `mod_chat_conversations`. Orders come from `mod_ecommod01_orders`. Appointments come from `mod_bookmod01_appointments`. The portal is a different entry point to the same data.

### 5. Future-Proof Module Registration

Any module built in the future must be able to register itself into the client portal without modifying portal core code. This requires a portal module registry pattern where each module declares its portal capabilities (nav items, permissions, components) and the portal framework discovers and renders them dynamically.

### 6. Respect the Existing Codebase Patterns

- All server actions use `createClient()` from `@/lib/supabase/server`
- All database records are mapped with `mapRecord()`/`mapRecords()` from `src/lib/map-db-record.ts` (snake_case to camelCase)
- All monetary values are stored as integers (cents) and displayed with `/ 100`
- Default locale is `en-ZM`, default currency `ZMW` from `src/lib/locale-config.ts`
- Auth guard pattern: check user, redirect if not authenticated, user guaranteed non-null after guard
- Server pages use `requirePortalAuth()` for the portal
- `'use client'` components do not contain `'use server'` annotations
- TypeScript strict mode, zero errors required before committing

---

## Phase 1: Extended Permission Model and Database Migration

### 1A: Add Module Permission Columns to the clients Table

Add new boolean columns to the `clients` table in the database. Each column controls whether the client can access a specific module area in the portal. All default to `false` so that existing clients gain no new access until explicitly granted by their agency.

New columns to add to `clients`:
- `can_manage_live_chat` (boolean, default false) — Access to live chat conversations, responding to customers
- `can_manage_orders` (boolean, default false) — Access to view and fulfill orders
- `can_manage_products` (boolean, default false) — Access to manage product catalog, categories, inventory
- `can_manage_bookings` (boolean, default false) — Access to booking calendar, appointments, services
- `can_manage_crm` (boolean, default false) — Access to CRM contacts, companies, deals
- `can_manage_automation` (boolean, default false) — Access to view and manage automation workflows
- `can_manage_quotes` (boolean, default false) — Access to create and manage price quotes
- `can_manage_agents` (boolean, default false) — Access to add and manage live chat agents
- `can_manage_customers` (boolean, default false) — Access to ecommerce customer list

Run this as a Supabase migration using `mcp_supabase_apply_migration`. The migration must use `ALTER TABLE` with `ADD COLUMN IF NOT EXISTS` for safety.

### 1B: Extend client_site_permissions Table

Add per-site module permission overrides to `client_site_permissions`. These allow the agency to give a client access to live chat on Site A but not Site B, for example.

New columns:
- `can_manage_live_chat` (boolean, default null) — null means inherit from client-level, true/false means override
- `can_manage_orders` (boolean, default null)
- `can_manage_products` (boolean, default null)
- `can_manage_bookings` (boolean, default null)
- `can_manage_crm` (boolean, default null)
- `can_manage_automation` (boolean, default null)
- `can_manage_quotes` (boolean, default null)
- `can_manage_agents` (boolean, default null)
- `can_manage_customers` (boolean, default null)

The resolution logic: site-level permission takes priority if not null, else fall back to client-level permission.

### 1C: Update PortalUser Interface

Extend `PortalUser` in `src/lib/portal/portal-auth.ts` to include all new permission fields. Update `getPortalUser()` and `getPortalSession()` to select and return these new columns.

Add to the `PortalUser` interface:
```typescript
canManageLiveChat: boolean;
canManageOrders: boolean;
canManageProducts: boolean;
canManageBookings: boolean;
canManageCrm: boolean;
canManageAutomation: boolean;
canManageQuotes: boolean;
canManageAgents: boolean;
canManageCustomers: boolean;
```

### 1D: Update PortalUserPermissions

Extend `PortalUserPermissions` in `src/config/portal-navigation.ts` to include all new permission fields. The navigation generator must use these to conditionally render module nav items.

### 1E: Create Portal Permission Resolution Helper

Create a helper function (in `portal-auth.ts` or a new file `src/lib/portal/portal-permissions.ts`) that resolves effective permissions for a client for a specific site. It takes the client-level permissions and the site-level overrides and returns the effective permission set.

```typescript
export interface EffectivePortalPermissions {
  canViewAnalytics: boolean;
  canEditContent: boolean;
  canViewInvoices: boolean;
  canPublish: boolean;
  canManageLiveChat: boolean;
  canManageOrders: boolean;
  canManageProducts: boolean;
  canManageBookings: boolean;
  canManageCrm: boolean;
  canManageAutomation: boolean;
  canManageQuotes: boolean;
  canManageAgents: boolean;
  canManageCustomers: boolean;
}

export async function getEffectivePermissions(
  clientId: string,
  siteId: string
): Promise<EffectivePortalPermissions>
```

Logic: Query `client_site_permissions` for the given client + site. For each permission, if the site-level value is not null, use it. Otherwise fall back to the client-level value from the `clients` table.

### 1F: Update Agency Dashboard Client Management UI

The agency dashboard where agencies manage their clients (at `/dashboard/clients/[id]`) must have UI to toggle all the new permission flags. There is likely already a client edit form or client detail page there. Add toggle switches for each module permission, grouped by category, with clear labels explaining what each one enables in the portal.

Group the toggles as:

General Permissions:
- View Analytics
- Edit Content
- View Invoices
- Publish Sites

Module Permissions:
- Manage Live Chat
- Manage Chat Agents
- Manage Orders
- Manage Products
- Manage Bookings
- Manage CRM
- Manage Automation
- Manage Quotes
- Manage Customers

Each toggle must have a brief description below it so the agency understands what they are enabling. For example, under "Manage Live Chat": "Client can view and respond to live chat conversations on their site."

Also add a per-site permissions override section in the site detail view. When an agency views a specific site for a specific client, they can override any client-level permission for that specific site.

---

## Phase 2: Module-Aware Portal Navigation System

### 2A: Detect Installed Modules Per Client

The portal navigation must be aware of which modules are installed on each of the client's sites. Create a portal service function that fetches installed modules across all sites a client has access to.

Create `getClientInstalledModules()` in `src/lib/portal/portal-service.ts`:
- Query `site_module_installations` joined with `modules_v2` for all sites where the client has `can_view = true`
- Return a deduplicated list of installed module slugs across all client sites
- Cache-friendly: this only needs to run once per portal session load

The module slugs to match against for navigation purposes (these are the existing slugs in the system):
- `live-chat` — enables Live Chat nav items
- `ecommerce` — enables Orders, Products, Quotes, Customers nav items
- `booking` — enables Bookings nav item
- `crm` — enables CRM nav item (Note: CRM may be at the agency level at `/dashboard/crm`, so check if it has a site-level install or is available agency-wide; if agency-wide, always show it)
- `automation` — enables Automation nav item

### 2B: Rewrite Portal Navigation Generator

Rewrite `getPortalNavigationGroups()` in `src/config/portal-navigation.ts` to accept both permissions AND installed modules. The function signature should become:

```typescript
function getPortalNavigationGroups(
  permissions: PortalUserPermissions,
  installedModules: string[],
  openTicketCount: number,
  siteId?: string  // if client has only one site, nav items link directly to that site
): NavGroup[]
```

Navigation structure should become:

Main Group:
- Dashboard (`/portal`) — always visible
- My Sites (`/portal/sites`) — always visible
- Domains (`/portal/domains`) — always visible
- Email (`/portal/email`) — always visible

Operations Group (conditional — only if at least one operational module is installed and permitted):
- Live Chat (`/portal/sites/[siteId]/live-chat`) — if `live-chat` installed AND `canManageLiveChat`
- Orders (`/portal/sites/[siteId]/orders`) — if `ecommerce` installed AND `canManageOrders`
- Bookings (`/portal/sites/[siteId]/bookings`) — if `booking` installed AND `canManageBookings`
- Products (`/portal/sites/[siteId]/products`) — if `ecommerce` installed AND `canManageProducts`
- Quotes (`/portal/sites/[siteId]/quotes`) — if `ecommerce` installed AND `canManageQuotes`
- CRM (`/portal/sites/[siteId]/crm`) — if `crm` installed AND `canManageCrm`
- Customers (`/portal/sites/[siteId]/customers`) — if `ecommerce` installed AND `canManageCustomers`
- Automation (`/portal/sites/[siteId]/automation`) — if `automation` installed AND `canManageAutomation`
- Chat Agents (`/portal/sites/[siteId]/chat-agents`) — if `live-chat` installed AND `canManageAgents`

Content Group:
- Analytics (`/portal/analytics`) — if `canViewAnalytics`
- Media (`/portal/media`) — always visible
- Form Submissions (`/portal/submissions`) — always visible
- Blog Posts (`/portal/blog`) — always visible
- SEO (`/portal/seo`) — always visible

Support Group:
- Support (`/portal/support`) — always visible, with open ticket badge
- Notifications (`/portal/notifications`) — always visible
- Invoices (`/portal/invoices`) — if `canViewInvoices`
- Settings (`/portal/settings`) — always visible

Important UX detail for single-site clients: If the client has exactly one site, all site-scoped nav links should point directly to that site (e.g., `/portal/sites/abc123/live-chat`). If the client has multiple sites, the nav links should go to a site selector page first (e.g., `/portal/live-chat` which shows a "Select a site" grid, then routes to `/portal/sites/[selected]/live-chat`).

### 2C: Update Portal Layout

Update `src/app/portal/layout.tsx` to fetch installed modules for the client and pass them to the sidebar navigation generator. The layout already fetches client info and permissions. Add the installed modules query alongside the existing parallel fetches.

---

## Phase 3: Portal Route Framework

### 3A: Site-Scoped Module Route Pattern

Create the route structure for site-scoped module pages within the portal. Each module gets its own route group under `/portal/sites/[siteId]/`.

New route files to create:

```
src/app/portal/sites/[siteId]/live-chat/page.tsx
src/app/portal/sites/[siteId]/live-chat/conversations/page.tsx
src/app/portal/sites/[siteId]/live-chat/conversations/[conversationId]/page.tsx
src/app/portal/sites/[siteId]/orders/page.tsx
src/app/portal/sites/[siteId]/products/page.tsx
src/app/portal/sites/[siteId]/bookings/page.tsx
src/app/portal/sites/[siteId]/quotes/page.tsx
src/app/portal/sites/[siteId]/crm/page.tsx
src/app/portal/sites/[siteId]/customers/page.tsx
src/app/portal/sites/[siteId]/automation/page.tsx
src/app/portal/sites/[siteId]/chat-agents/page.tsx
```

### 3B: Standard Portal Module Page Pattern

Every portal module page must follow this exact pattern:

```typescript
// src/app/portal/sites/[siteId]/[module]/page.tsx
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getEffectivePermissions } from "@/lib/portal/portal-permissions";
import { isModuleInstalled } from "@/lib/studio/registry/module-discovery";
import { redirect, notFound } from "next/navigation";

export default async function PortalModulePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  // 1. Verify the site belongs to this client
  // Query sites table to confirm client_id matches user.clientId
  // If not, return notFound()

  // 2. Check module is installed on this site
  const installed = await isModuleInstalled(siteId, "MODULE_ID_HERE");
  if (!installed) notFound();

  // 3. Check client has permission for this module
  const perms = await getEffectivePermissions(user.clientId, siteId);
  if (!perms.canManageXxx) redirect("/portal");

  // 4. Fetch any server-side data needed by the module component
  // Use existing module server actions (same ones the dashboard uses)

  // 5. Render the existing module component with portal context
  return (
    <div>
      <ExistingModuleComponent siteId={siteId} /* ...other props */ />
    </div>
  );
}
```

### 3C: Portal Context Provider

Some module components may check whether they are in a dashboard context or portal context. Create a `PortalContext` provider that wraps portal module pages. This context provides:
- `isPortalView: true` — so components can conditionally hide dashboard-only actions (like deleting the entire site, or managing billing)
- `portalUser: PortalUser` — the current portal user
- `effectivePermissions: EffectivePortalPermissions` — resolved permissions for the current site
- `siteId: string` — the current site

Wrap the portal layout with this provider. Module components can optionally consume it to adjust their behavior (e.g., hide an "Install Module" button that only makes sense for agency users, or hide a "Delete All Data" button).

### 3D: Portal Module Access Verification Middleware

Create a reusable verification function that every portal module page calls. This function:
1. Confirms the site belongs to the client (prevents a client from manipulating the URL to access another client's site)
2. Confirms the module is installed and enabled on that site
3. Confirms the client has the required permission
4. Returns the site data and effective permissions

```typescript
export async function verifyPortalModuleAccess(
  user: PortalUser,
  siteId: string,
  moduleSlug: string,
  requiredPermission: keyof EffectivePortalPermissions
): Promise<{
  site: { id: string; name: string; agencyId: string };
  permissions: EffectivePortalPermissions;
}>
```

This function throws `notFound()` if the site is not found or module not installed, and `redirect("/portal")` if the permission is denied.

---

## Phase 4: Live Chat in Portal

### Priority: Critical — This is the highest impact module for the client portal.

### 4A: Live Chat Conversations Page

Route: `/portal/sites/[siteId]/live-chat/page.tsx`

This page mounts the live chat conversations list. The agency dashboard uses a `ConversationsPageWrapper` component in `src/modules/live-chat/components/wrappers/`. The portal page should mount this same wrapper component, passing `siteId`.

The existing live chat already works via `siteId`-scoped queries. The conversation list shows all conversations for that site. The portal user acts as an agent for their own site.

Important: When a portal client accesses live chat, they need to be treated as an agent within the live chat system. The portal page setup must:
1. Look up or create a `mod_chat_agents` record for this portal user (using their `userId` or `clientId`)
2. Set their agent status to "online" when they are on the live chat page
3. Set their status to "offline" when they leave

This identity mapping is essential. The existing live chat system routes conversations to agents. A portal client IS an agent for their own site. Use their auth user ID to link them to an agent record. If no agent record exists yet for this user on this site, create one automatically with default permissions when they first access the live chat page.

### 4B: Conversation Detail Page

Route: `/portal/sites/[siteId]/live-chat/conversations/[conversationId]/page.tsx`

This mounts the `ConversationViewWrapper` from `src/modules/live-chat/components/wrappers/ConversationViewWrapper.tsx`. This component handles the two-panel layout: chat area with real-time messages on the left, visitor info on the right.

The portal page passes `siteId` and `conversationId`. The wrapper component fetches conversation data via existing server actions.

### 4C: Live Chat Real-Time Considerations

The live chat uses Supabase Realtime subscriptions for instant message delivery. These subscriptions filter by `site_id`. The portal client's browser will subscribe to the same channels. No changes needed to the real-time infrastructure — it already works per-site.

### 4D: Chat Features Available to Portal Clients

Based on permissions, portal clients should be able to:
- View all conversations for their site
- Respond to customer messages in real-time
- View visitor info and page tracking data
- Use canned responses
- Upload files in chat
- View and interact with order/booking/quote context panels in conversations
- Approve or reject payment proofs (for orders and bookings)
- Resolve and close conversations
- Transfer conversations to other agents (if multiple agents exist)

Features that should NOT be available to portal clients (agency-level only):
- Widget appearance customization (color, position, avatar) — this is agency/builder territory
- WhatsApp integration configuration
- AI responder configuration (the agency sets this up)
- Knowledge base management (agency territory)

### 4E: Live Chat Dashboard Overview

Route: `/portal/sites/[siteId]/live-chat` (the main live-chat page, not conversations sub-page)

Mount the `LiveChatOverviewWrapper` component if it exists, or use the existing live chat overview/stats dashboard. This shows aggregate stats: total conversations, response time, satisfaction rating, active conversations, etc.

Use the live chat sub-navigation pattern from the dashboard. The portal live chat section should have tabs or sub-nav for: Overview, Conversations, and optionally Analytics (if the component supports it).

---

## Phase 5: Chat Agent Management in Portal

### 5A: Chat Agents Page

Route: `/portal/sites/[siteId]/chat-agents/page.tsx`

Permission required: `canManageAgents`

This page lets the client add team members as live chat agents for their site. The client may have their own staff who need to respond to chats.

The existing agent management uses `getAgencyMembersForSite()` from `src/modules/live-chat/actions/agent-actions.ts`, which queries agency members. For portal clients, the model is different: they need to invite their OWN team members, not agency members.

This requires extending the agent system to support portal-level agents. Options:

Option A (Recommended): Create a concept of "portal agents" — people the client invites who get agent access to chat for that specific site. These are stored in the existing `mod_chat_agents` table with a `source` field (`agency` vs `portal`). Portal agents are linked to a portal user account and scoped to the specific site.

Option B: Use the existing `mod_chat_agents` table as-is. The portal client add agents by email. The agent receives an invite, creates a portal account, and gets linked. The agency can see all agents (both agency-added and client-added) in their dashboard.

Regardless of approach, the agent must have:
- Name, email, avatar
- Status (online/offline/away)
- Department assignments
- Permission level (using the existing 34-key `AgentPermissions` system from `src/modules/live-chat/lib/agent-permissions.ts`)

The portal client manages their agents through the same facilities the agency dashboard uses, but scoped to their site only. They cannot see or manage agents on other sites.

### 5B: Agent Permission Scoping

The existing `AgentPermissions` system has 9 categories with 34 keys including chat, quotes, orders, customers, products, bookings, analytics, agents, and settings. This system should be used as-is for portal agents. The portal client (site owner) can customize what each of their agents can do.

However, the portal client themselves should be treated as an "owner" agent with all permissions. Their agents can have restricted permissions.

---

## Phase 6: E-Commerce in Portal

### 6A: Orders Page

Route: `/portal/sites/[siteId]/orders/page.tsx`

Permission required: `canManageOrders`

Mount the existing orders view from the `EcommerceDashboard` component. The ecommerce dashboard in the agency view uses an internal view state pattern — when `activeView === "orders"`, it renders the orders list with full management capabilities.

The approach: either mount the `EcommerceDashboard` component directly with an `initialView="orders"` prop (this prop already exists on the component), or extract the orders sub-view into its own component that can be mounted independently.

The preferred approach is to mount `EcommerceDashboard` with `initialView` because this component already manages its own state, context (`EcommerceProvider`), and data fetching. It takes `siteId` and `agencyId` as props.

```tsx
<EcommerceProvider siteId={siteId} agencyId={agencyId}>
  <EcommerceDashboard
    siteId={siteId}
    agencyId={agencyId}
    initialView="orders"
  />
</EcommerceProvider>
```

For the portal, wrap it with `EcommerceProvider` the same way the dashboard page does. The `agencyId` comes from `user.agencyId` on the `PortalUser`.

If the `EcommerceDashboard` has its own internal navigation (tabs for products, orders, etc.), the portal version should either:
- Respect the portal permissions to show/hide internal tabs (if the client has `canManageOrders` but not `canManageProducts`, the Products tab should be hidden)
- Or, each portal route mounts the dashboard with the appropriate `initialView` and the internal navigation is hidden in portal mode

The cleanest approach: pass a `portalMode` prop or use the `PortalContext` to control which internal tabs are visible based on the portal user's permissions.

### 6B: Products Page

Route: `/portal/sites/[siteId]/products/page.tsx`

Permission required: `canManageProducts`

Mount `EcommerceDashboard` with `initialView="products"`. This gives the client access to:
- Product listing with search and filters
- Product creation and editing
- Category management
- Variant management
- Inventory management (stock levels, low-stock alerts)
- Discount/coupon management
- Bulk import/export

### 6C: Quotes Page

Route: `/portal/sites/[siteId]/quotes/page.tsx`

Permission required: `canManageQuotes`

Mount `EcommerceDashboard` with `initialView="quotes"`. This gives the client access to quote creation, sending, tracking, amendment management, and quote-to-order conversion.

### 6D: Customers Page

Route: `/portal/sites/[siteId]/customers/page.tsx`

Permission required: `canManageCustomers`

Mount `EcommerceDashboard` with `initialView="customers"`. Shows the storefront customer list with order history, contact info, and purchase metrics.

### 6E: Ecommerce Portal Mode Adaptations

When `EcommerceDashboard` is running within the portal context:
- Hide any "Module Settings" that are agency-level (payment gateway config, tax settings, shipping rules — these are set up by the agency). Show read-only versions if needed.
- Hide "Onboarding Wizard" — the agency already set up the store
- Show full order management: view, update status, add notes, process refunds, manage shipping
- Show full product management: CRUD products, manage inventory
- Show sales analytics and reports

The mechanism to detect portal mode: check for `PortalContext` presence or accept a `mode: "portal" | "dashboard"` prop.

---

## Phase 7: Booking in Portal

### 7A: Bookings Page

Route: `/portal/sites/[siteId]/bookings/page.tsx`

Permission required: `canManageBookings`

Mount the existing `BookingDashboard` component from `src/modules/booking/components/booking-dashboard.tsx`. This component manages its own internal views: calendar, appointments list, services, staff, settings.

The `BookingDashboard` takes `siteId` as a prop. Pass it from the portal route. Wrap with any required providers.

In portal mode:
- Calendar view: Show all appointments, allow confirm/cancel/reschedule
- Appointments list: Full management
- Services: View and edit service offerings (name, price, duration)
- Staff: Manage staff members and their availability
- Settings: Booking-specific settings (timezone, buffer time, require payment)

Hide in portal mode:
- Module installation/uninstallation controls
- Any agency-level configuration that the client should not change

### 7B: Booking Sub-Navigation

If the `BookingDashboard` has internal navigation (calendar, appointments, services, staff, settings views), all views should be accessible in the portal unless specifically restricted by the portal mode context.

---

## Phase 8: CRM in Portal

### 8A: CRM Page

Route: `/portal/sites/[siteId]/crm/page.tsx`

Permission required: `canManageCrm`

Important context: The CRM module in the agency dashboard exists at `/dashboard/crm/*` (not under a specific site). CRM contacts are scoped to the agency level, not site level. However, contacts are linked to sites through orders, bookings, and form submissions. For the portal, the CRM view should be filtered to only show contacts associated with the client's site(s).

Mount the CRM dashboard components from `src/modules/crm/`. The CRM has:
- Contacts list and detail
- Companies list and detail
- Deals pipeline (kanban)
- Activities log
- Email sending

Filter everything by: contacts whose source records (orders, bookings, form submissions) belong to the client's site(s). The portal CRM acts as a site-scoped view of the agency's CRM data.

If CRM data is agency-level (not site-scoped), create a portal-specific wrapper that applies site filtering using the CRM's existing filtering capabilities. CRM contacts have metadata that links them to sites through `source_site_id` or through linked orders/bookings.

### 8B: CRM Features in Portal

Available to portal clients:
- View contacts and their full history (orders, bookings, form submissions, chat conversations)
- Add notes and activities to contacts
- Manage custom fields
- View and manage deals pipeline
- Send emails to contacts (using the agency's email configuration)
- Tag and segment contacts

Not available (agency-level):
- CRM form builder (the agency builds these)
- Email configuration (SMTP settings)
- Pipeline structure management (stage creation/deletion — the agency designs the pipeline)
- Bulk email campaigns (these should be agency-controlled to prevent spam)

---

## Phase 9: Automation in Portal

### 9A: Automation Page

Route: `/portal/sites/[siteId]/automation/page.tsx`

Permission required: `canManageAutomation`

The automation module is at `src/modules/automation/`. The workflow builder is a visual ReactFlow canvas. Workflows are scoped to `site_id`.

In portal mode, mount the automation components with the client's site context.

### 9B: Automation Features in Portal

Available to portal clients:
- View all workflows for their site
- View workflow execution history and logs
- Activate/deactivate workflows
- Test run workflows with real entity data (using the existing TestRunDialog)
- View workflow analytics (success rate, execution counts)
- Browse and install starter pack templates

Potentially available (depending on agency preference):
- Edit existing workflows (modify steps, conditions)
- Create new workflows from templates
- Configure trigger conditions

Not available:
- System workflow editing (templates that came from the platform)
- Webhook endpoint management (security consideration)

The agency should be able to control whether a client can edit workflows or just view/activate them. This could be a sub-permission: `can_edit_workflows` vs `can_view_workflows`. For simplicity in the first implementation, `canManageAutomation` grants full read and activate/deactivate access. Editing workflows can be a follow-up enhancement.

---

## Phase 10: Unified Portal Dashboard

### 10A: Redesign the Portal Dashboard

The portal dashboard at `/portal/page.tsx` should be redesigned to show real operational KPIs, not just site listings.

The dashboard should show cards/widgets for:

If Live Chat enabled:
- Open Conversations count
- Average Response Time
- Unread Messages badge

If Orders enabled:
- New Orders Today count
- Pending Fulfillment count
- Revenue This Week

If Bookings enabled:
- Today's Appointments count
- Upcoming Bookings count
- Pending Confirmations

If CRM enabled:
- New Contacts This Week
- Open Deals count
- Pipeline Value

Quick Actions:
- "View Open Chats" button (links to live chat)
- "Pending Orders" button (links to orders)
- "Today's Bookings" button (links to bookings)

Each card must pull real data from existing module server actions. Use the same data-fetching functions the module dashboards use. Only show cards for modules the client has access to.

### 10B: Dashboard Data Fetching

Create `src/lib/portal/portal-dashboard-service.ts` that aggregates KPIs across modules:

```typescript
export async function getPortalDashboardData(
  clientId: string,
  siteIds: string[],
  permissions: EffectivePortalPermissions
): Promise<PortalDashboardData>
```

This function conditionally fetches data only for permitted modules, in parallel:
- If `canManageLiveChat`: fetch open conversation count, unread count
- If `canManageOrders`: fetch new order count, pending fulfillment count, recent revenue
- If `canManageBookings`: fetch today's appointment count, pending confirmations
- If `canManageCrm`: fetch new contacts this week, open deals

All fetches use existing module server actions or direct Supabase queries against the existing module tables.

---

## Phase 11: Portal Site Detail Enhancement

### 11A: Site Detail Page with Module Access

The existing portal site detail at `/portal/sites/[siteId]/page.tsx` should be enhanced to serve as a hub for the client's module operations on that specific site.

Show a grid of module cards for each installed and permitted module:
- Live Chat — "X open conversations" → link to `/portal/sites/[siteId]/live-chat`
- Orders — "X pending orders" → link to `/portal/sites/[siteId]/orders`
- Bookings — "X upcoming bookings" → link to `/portal/sites/[siteId]/bookings`
- Products — "X products" → link to `/portal/sites/[siteId]/products`
- Quotes — "X active quotes" → link to `/portal/sites/[siteId]/quotes`
- CRM — "X contacts" → link to `/portal/sites/[siteId]/crm`
- Automation — "X active workflows" → link to `/portal/sites/[siteId]/automation`

Each card shows a live count fetched from the module's data. Only show cards for installed and permitted modules.

---

## Phase 12: Future Module Registration Pattern

### 12A: Portal Module Registry

This is the most important architectural piece for future-proofing. Create a portal module registry at `src/lib/portal/portal-module-registry.ts`.

Each module that wants to appear in the client portal registers itself with:

```typescript
interface PortalModuleRegistration {
  moduleSlug: string;                    // matches modules_v2.slug
  displayName: string;                    // shown in nav and dashboard
  icon: LucideIcon;                       // nav icon
  permissionKey: keyof EffectivePortalPermissions; // which permission gates access
  navItems: PortalModuleNavItem[];        // nav items to add to sidebar
  dashboardWidget?: {
    component: React.ComponentType<{ siteId: string }>;
    priority: number;                      // ordering on dashboard
  };
  siteDetailCard?: {
    component: React.ComponentType<{ siteId: string }>;
  };
}

interface PortalModuleNavItem {
  label: string;
  href: (siteId: string) => string;       // generates the URL
  icon: LucideIcon;
  subItems?: PortalModuleNavItem[];
}
```

Example registration for ecommerce:

```typescript
registerPortalModule({
  moduleSlug: "ecommerce",
  displayName: "Store",
  icon: ShoppingCart,
  permissionKey: "canManageOrders",
  navItems: [
    { label: "Orders", href: (siteId) => `/portal/sites/${siteId}/orders`, icon: Package },
    { label: "Products", href: (siteId) => `/portal/sites/${siteId}/products`, icon: Tags },
    { label: "Quotes", href: (siteId) => `/portal/sites/${siteId}/quotes`, icon: FileText },
    { label: "Customers", href: (siteId) => `/portal/sites/${siteId}/customers`, icon: Users },
  ],
});
```

### 12B: How Future Modules Auto-Integrate

When a developer builds a new module in the future (say, a "Restaurant POS" module):

1. They add a portal registration in their module's index or config file
2. They create their portal page at `/portal/sites/[siteId]/restaurant-pos/page.tsx`
3. They register the new permission key (e.g., `canManageRestaurantPos`)
4. The database migration adds the new permission column
5. The navigation system automatically picks up the new module

No changes to portal core code needed. The registry pattern discovers all registered modules and builds the navigation and dashboard dynamically.

### 12C: Database Permission Extensibility

For future modules, the permission system must be extensible. Rather than continuously adding columns to the `clients` table, consider a supplementary approach: a `client_module_permissions` table that stores per-client, per-module permissions as key-value pairs.

```sql
CREATE TABLE client_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,   -- null = client-level
  module_slug TEXT NOT NULL,
  permission_key TEXT NOT NULL,      -- e.g., "can_manage", "can_view_only"
  granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, COALESCE(site_id, '00000000-0000-0000-0000-000000000000'), module_slug, permission_key)
);
```

The existing boolean columns on `clients` remain for the core modules (live chat, orders, etc.) for performance and simplicity. The `client_module_permissions` table is for future modules that register dynamically.

The `getEffectivePermissions()` function checks the `clients` table columns first, then falls back to `client_module_permissions` for any module slug not in the core set.

---

## Phase 13: Portal-Mode Adaptations for Existing Components

### 13A: Create Portal Context

Create `src/lib/portal/portal-context.tsx`:

```typescript
"use client";

import { createContext, useContext } from "react";

interface PortalContextValue {
  isPortalView: boolean;
  portalUser: {
    clientId: string;
    fullName: string;
    email: string;
    agencyId: string;
  };
  permissions: {
    canManageLiveChat: boolean;
    canManageOrders: boolean;
    canManageProducts: boolean;
    canManageBookings: boolean;
    canManageCrm: boolean;
    canManageAutomation: boolean;
    canManageQuotes: boolean;
    canManageAgents: boolean;
    canManageCustomers: boolean;
  };
  siteId: string;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PortalContextValue;
}) {
  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal(): PortalContextValue | null {
  return useContext(PortalContext);
}

export function useIsPortalView(): boolean {
  const ctx = useContext(PortalContext);
  return ctx?.isPortalView ?? false;
}
```

### 13B: Adapt Module Components for Portal Mode

Existing module components should check for portal mode using `useIsPortalView()` and conditionally hide features that are agency-only. This is a lightweight adaptation — not a rewrite. Add the check only where necessary.

Places where portal-mode checks are needed:

EcommerceDashboard:
- Hide the "Settings" tab content that shows payment gateway configuration, tax rules, shipping settings (agency territory)
- Hide "Module Install/Uninstall" controls if any
- Hide the "Onboarding" wizard
- Keep full access to products, orders, quotes, customers, analytics, discounts, inventory

BookingDashboard:
- Hide "Module Settings" that configure the booking widget appearance
- Hide "Integration" settings
- Keep full access to calendar, appointments, services, staff, booking settings (timezone, currency, buffer time)

Live Chat:
- Hide "Widget Settings" (appearance, color, position, avatar)
- Hide "AI Responder Configuration"
- Hide "WhatsApp Setup"
- Hide "Knowledge Base Management"
- Keep full access to conversations, messaging, canned responses, file uploads, agent management

CRM:
- Hide "Pipeline Structure" editing (stage creation/deletion)
- Hide "Email Configuration" (SMTP settings)
- Hide "Bulk Email Campaigns" (agency-controlled)
- Keep full access to contacts, companies, deals (view/move/edit), activities, email sending to individual contacts

Automation:
- Potentially hide "Create Workflow" (show only if agency allows)
- Hide "Webhook Endpoint Management"
- Keep full access to view workflows, execution history, activate/deactivate, test runs

### 13C: Implementation Strategy for Portal-Mode Checks

Do NOT add `if (isPortal) {...}` blocks throughout every component. Instead:

1. At the route level (portal page.tsx), pass a `hiddenFeatures` or `disabledTabs` array as a prop
2. The module component hides tabs/sections based on this array
3. This keeps the module component clean and the portal-specific logic in the portal page

Example:
```tsx
// Portal orders page
<EcommerceDashboard
  siteId={siteId}
  agencyId={agencyId}
  initialView="orders"
  hiddenViews={["settings", "onboarding"]}
/>
```

The `EcommerceDashboard` already manages views via state. Adding a `hiddenViews` prop that filters the view options is minimal and clean. The same pattern applies to all module dashboards.

---

## Phase 14: Security Considerations

### 14A: RLS Policies

All Supabase Row Level Security policies on module tables already filter by `site_id`. Since portal clients access data through `siteId` and can only access sites that belong to them (verified in step 3D), the existing RLS policies protect against cross-tenant access.

However, verify that:
1. `mod_chat_conversations` RLS allows access based on agent identity OR site ownership
2. `mod_ecommod01_orders` RLS allows access via site ownership
3. `mod_bookmod01_appointments` RLS allows access via site ownership
4. `mod_crmmod01_contacts` RLS allows access via agency ownership (CRM is agency-scoped)

If any RLS policy is missing for portal access patterns, create new policies that use the `clients.portal_user_id` → `sites.client_id` chain.

### 14B: Server Action Authorization

Every server action called from the portal must verify the caller has access. Two approaches:

Option A (Preferred): The portal route page calls `verifyPortalModuleAccess()` and only then calls the module's server actions, passing the valid `siteId`. Since server actions already filter by `siteId`, this is secure if the siteId is verified.

Option B: Add portal-awareness to module server actions themselves. This is more invasive and should only be done if Option A is insufficient.

### 14C: Impersonation Support

Impersonation already works in the portal. When an agency member impersonates a client, they see the portal exactly as the client would, including all the new module pages. The impersonation state comes from a cookie and `getPortalSession()` handles it. No changes needed for impersonation — it automatically works with the new pages because they all go through `requirePortalAuth()` which calls `getPortalSession()`.

### 14D: Rate Limiting

Portal clients have the same rate limits as any authenticated user. No special rate limiting needed beyond what exists.

---

## Phase 15: Testing and Verification

### 15A: Permission Matrix Testing

Test every combination of permission flags:

| Permission | Enabled | Disabled |
|---|---|---|
| `canManageLiveChat` | Live Chat nav appears, page loads, conversations visible | Nav hidden, direct URL redirects to /portal |
| `canManageOrders` | Orders nav appears, order list loads | Nav hidden, redirect |
| `canManageProducts` | Products nav appears, product CRUD works | Nav hidden, redirect |
| `canManageBookings` | Bookings nav appears, calendar loads | Nav hidden, redirect |
| `canManageCrm` | CRM nav appears, contacts/deals visible | Nav hidden, redirect |
| `canManageAutomation` | Automation nav appears, workflows visible | Nav hidden, redirect |
| `canManageQuotes` | Quotes nav appears, quote management works | Nav hidden, redirect |
| `canManageAgents` | Chat Agents nav appears, agent CRUD works | Nav hidden, redirect |
| `canManageCustomers` | Customers nav appears, customer list loads | Nav hidden, redirect |

### 15B: Multi-Site Permission Testing

Test that a client with access to Site A (live chat enabled) and Site B (live chat disabled) sees live chat only for Site A. The site-level override must work correctly.

### 15C: Data Isolation Testing

Verify that a portal client CANNOT access data from:
- Sites they do not own
- Other agencies' data
- Other clients' data (even within the same agency)

### 15D: Real-Time Testing

Verify that live chat in the portal receives messages in real-time when a customer sends a message on the storefront. The Supabase Realtime subscription must work within the portal layout.

### 15E: TypeScript Verification

After all implementations, run `npx tsc --noEmit` and verify zero errors. Do not commit with any TypeScript errors.

---

## Implementation Order

The recommended implementation order is:

1. Phase 1 (Permission Model) — Foundation for everything else
2. Phase 12A-12C (Module Registry Pattern) — Architecture for dynamic navigation
3. Phase 2 (Navigation) — Portal sidebar shows module items
4. Phase 3 (Route Framework) — Portal page shell and verification pattern
5. Phase 13 (Portal Context + Mode Adaptations) — Components ready for portal mounting
6. Phase 10 (Dashboard Redesign) — Quick win, shows value immediately
7. Phase 4 (Live Chat) — Highest operational impact
8. Phase 5 (Chat Agents) — Complements Live Chat
9. Phase 6 (E-Commerce) — Second highest impact
10. Phase 7 (Booking) — Third highest impact
11. Phase 8 (CRM) — Completes the operational picture
12. Phase 9 (Automation) — Advanced feature, lowest priority
13. Phase 11 (Site Detail Enhancement) — Polish
14. Phase 14 (Security Audit) — Final verification
15. Phase 15 (Testing) — Comprehensive testing

---

## Key Technical References

### Files to Read Before Starting

- `src/lib/portal/portal-auth.ts` — Current auth system, PortalUser interface
- `src/lib/portal/portal-service.ts` — Current portal data fetching
- `src/config/portal-navigation.ts` — Current navigation generator
- `src/app/portal/layout.tsx` — Portal layout with branding
- `src/components/portal/portal-sidebar.tsx` — Sidebar component
- `src/lib/studio/registry/module-discovery.ts` — Module installation detection
- `src/modules/ecommerce/components/ecommerce-dashboard.tsx` — Ecommerce component to mount
- `src/modules/ecommerce/context/ecommerce-context.tsx` — EcommerceProvider
- `src/modules/booking/components/booking-dashboard.tsx` — Booking component to mount
- `src/modules/live-chat/components/wrappers/ConversationViewWrapper.tsx` — Chat conversation component
- `src/modules/live-chat/components/wrappers/ConversationsPageWrapper.tsx` — Chat list component
- `src/modules/live-chat/actions/agent-actions.ts` — Agent management
- `src/modules/live-chat/lib/agent-permissions.ts` — Agent permission system
- `src/modules/crm/` — CRM module components and actions
- `src/modules/automation/` — Automation module components and actions
- `src/lib/map-db-record.ts` — Database record mapping utility
- `src/lib/locale-config.ts` — Locale constants (never hardcode currency/locale)
- `memory-bank/systemPatterns.md` — Architecture patterns and conventions
- `memory-bank/techContext.md` — Tech stack and critical conventions

### Database Tables Changed

- `clients` — Add 9 new boolean permission columns
- `client_site_permissions` — Add 9 new nullable boolean columns
- `client_module_permissions` — New table for future module extensibility
- `mod_chat_agents` — May need a `source` column (`agency` | `portal`) for portal agents

### Component Props Quick Reference

EcommerceDashboard:
```typescript
interface EcommerceDashboardProps {
  siteId: string;
  agencyId: string;
  userId?: string;
  userName?: string;
  settings?: EcommerceSettings | null;
  initialView?: string;
}
```

EcommerceProvider:
```typescript
interface EcommerceProviderProps {
  children: ReactNode;
  siteId: string;
  agencyId: string;
}
```

BookingDashboard: Takes `siteId` prop, wraps with BookingProvider internally.

ConversationViewWrapper: Takes `siteId`, `conversationId`, `agentId` plus other props.

ConversationsPageWrapper: Takes `siteId` plus other props.

### Existing Sidebar Component Specification

The portal sidebar uses the unified `Sidebar` component with `variant="portal"`. Nav items are passed via `customNavigation` as `NavGroup[]`. The `NavGroup` interface:

```typescript
interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavItem[];
}
```

---

## Summary of What The Client Portal Becomes

Before: A passive website status viewer with support tickets.

After: A full business operations center where clients can:
- Respond to customers in real-time via live chat
- Fulfill and manage orders end-to-end
- Manage their product catalog and inventory
- Handle bookings, appointments, and scheduling
- Create and track quotes and proposals
- Manage customer relationships via CRM
- View and control automation workflows
- Add and manage their own chat agents
- See real operational KPIs on their dashboard

All of this without any code duplication, with full permission control by the agency, with dynamic module-aware navigation, and with a future-proof registry pattern that makes any new module portal-ready without touching the portal core code.

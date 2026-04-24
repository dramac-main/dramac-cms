# DRAMAC Client Portal — Master Overhaul Brief

**Document type:** Long-lived planning document and source of truth for a multi-session rebuild.
**Audience:** Any AI agent or engineer picking up the portal rebuild in a fresh session.
**Constraint:** This is a planning document. No code, SQL, pseudo-code, schema diffs, or implementation snippets appear anywhere in this file. It is prose, lists, and tables only.
**Working rule:** Before changing any code, read this document end to end, then read the session brief for the session being executed, then read the memory bank (`memory-bank/activeContext.md`, `memory-bank/systemPatterns.md`, `memory-bank/progress.md`). If anything in this document conflicts with code reality discovered in the repo, update this document first and then proceed.

---

## 1. Executive Summary

DRAMAC today is a production multi-tenant SaaS platform. Agencies run their operations from a mature dashboard. Clients reach DRAMAC through a portal that was originally built in fifteen phases, then partially rolled back in March and April 2026 when a round of portal-specific services and views turned out to be premature. What survived the rollback is a working authentication layer, a working permission model, a set of route pages, and a large collection of shallow wrappers that reuse agency dashboard components inside a portal layout. What did not survive the rollback is a dedicated data access layer for portal users, a set of portal-specific views for orders, bookings, and live chat, several database functions, and approximately one hundred row-level security policies that had scoped data to portal users.

The result is a portal that looks like a portal but largely behaves like a narrowed version of the agency dashboard. Clients can log in, be routed to site-scoped pages, and see most of their business. They cannot, in a consistent way, act on that business with the same confidence an agency admin can. Many surfaces fail silently when something goes wrong. Several critical reliability concerns, especially around email delivery, web push, AI fallback, and observability, are already documented but still partially open.

This master brief defines what a proper client portal must be for DRAMAC going forward, treats everything currently on disk as non-authoritative, classifies each existing piece as verified reusable, partially reusable, misleading or shallow, or rebuild required, and defines a multi-session plan to deliver a new portal that is mobile-first, industry-standard, white-labeled, permission-safe, observable, and suitable as a business operations center for real businesses running on DRAMAC.

The first session, defined in full in Section 13, is foundation work. It does not ship any new module surface by itself. It delivers the authenticated, permission-scoped, mobile-first, observable shell on top of which every subsequent module surface will be built. Sessions two through six, defined at high level in Section 14, deliver the module surfaces in dependency order, closing with a dedicated polish, white-label, mobile, and acceptance session.

Each session is designed to be handed to a separate AI agent. After each session ships, the user returns to this file and requests the next session brief in full detail. The master brief, by design, stays stable across that entire journey.

---

## 2. Platform Understanding Summary

DRAMAC is built on Next.js with the App Router, React Server Components, and server actions, TypeScript in strict mode, Supabase Postgres with row-level security, Tailwind, Radix primitives, Zustand, TanStack Query, TipTap, Resend, Paddle, and Claude models from Anthropic for anything AI related. Payments for the platform flow through Paddle because Paddle supports payouts to Zambia through Payoneer or Wise. LemonSqueezy is deprecated for that reason and must not reappear in any portal surface. Stripe is not used for platform billing and must not reappear in the invoicing module. Zambia-first locale is centralized in a single locale configuration and must always be read from there rather than hardcoded. All monetary values in the ecommerce and invoicing modules are stored as integer minor units, not decimals, and every display and calculation path must respect that.

The tenancy model is Platform, then Agency, then Client, then Site, with team members on agencies, portal users and permissions on clients, and storefront customers on sites. An agency can have many clients. A client can have many sites. A site hosts pages, blog, media, SEO, forms, modules, storefront, domain, email, analytics, and the customer-facing surfaces those modules render.

Six business modules are live: CRM, Booking, E-Commerce, Live Chat, Social Media, Automation. Three additional platform systems that portal clients depend on are live: Marketing, Invoicing, and Billing. CRM, Automation, and Live Chat are auto-installed on new sites. E-Commerce and Booking are auto-installed when the AI designer detects the relevant industry.

A visual page builder, DRAMAC Studio, replaced an earlier builder and owns a mobile-first responsive system, a brand color and font inheritance system built on CSS variables, a smart navigation system that merges module-contributed nav items at render time, and a set of around sixty premium components. The portal does not render studio pages, but the portal navigation, branding, and mobile patterns must be consistent with the studio-rendered public surfaces that clients live on.

Email has two pipelines. The legacy platform pipeline carries platform communication and always shows the DRAMAC name. The branded pipeline carries customer-facing communication and must always be sent with the site identifier so that the branding overlay resolves correctly from agency base branding plus site overlay. Any portal action that generates a customer-facing email must go through the branded pipeline and must pass the site identifier.

Notifications have a three-layer model. In-app bell notifications sit in the notifications table, are scoped to the user identifier, and today are delivered to agency owners. Emails are sent through the branded pipeline. Web push goes through a dedicated service which must use the admin Supabase client because it runs in fire-and-forget contexts. All three layers are documented as wired across nineteen business-critical events. In-app client-side notifications for portal users remain explicitly future work.

Automation is event driven. Modules emit events into an events log. A synchronous event processor matches workflows to events and executes them. Failures do not block subsequent steps, but there is no retry. Portal actions do not currently emit events, which is a material gap.

AI usage in the platform is built around a multi-step pattern. Each Vercel function has a sixty second budget. Long operations are split into multiple endpoints that the client calls sequentially. Zod schemas shared with Claude must avoid unsupported constraints.

---

## 3. Current-State Reality Check

This section classifies the present state of every meaningful portal-related surface. The classification is not a dismissal of past work. It is an honest read of what a rebuild can and should take forward, and what should be treated as reference only.

### Verified reusable

The portal authentication layer is verified reusable. Magic link entry, password entry, session handling on top of Supabase Auth, the binding between the authenticated user and a client record, and the resolution of a typed portal user object from the clients table all work today and do not need to be rewritten.

The client-level and site-level permission model is verified reusable. The clients table carries a set of portal-oriented boolean permissions. A separate site permissions table carries optional per-site overrides. The resolution order is site override if set, otherwise client-level, otherwise false. The shape of this model is industry-appropriate. The schema is correct.

The portal route layout at the file system level is verified reusable as a skeleton. The set of top-level routes, the site-scoped nested routes, and the shared layout, sidebar, and mobile bottom navigation files are well organized and reflect a sensible information architecture.

The portal sidebar and navigation configuration is partially verified reusable. The grouping into Overview, Your Websites, Site Management, Team and Support, and Settings reads naturally. The mechanism that filters navigation items by permissions and installed modules is sound. The underlying shared sidebar component is the same used by the agency dashboard in a portal variant, which is a healthy reuse.

The portal module registry pattern, in which modules self-register their portal navigation entries, is partially verified reusable as a concept. It is elegant. It needs more discipline around fallbacks and module-to-portal feature mapping, but the base idea is worth keeping.

Support ticket, team management, settings, forms submissions, media library browsing, SEO reporting, blog browsing, domain status display, and business email status display are substantially complete today and are verified reusable for the rebuild. They do not need to be rewritten; they need to be made consistent with the new shell and polished.

### Partially reusable

The portal analytics surface, the portal invoices surface, and the portal notifications inbox are partially reusable. They render, but each one has obvious gaps. Analytics is incomplete. Invoices are Paddle-scoped for the platform and do not yet show invoicing-module invoices to clients in a full way. The in-app notifications center presents agency-owner-centric data and is not yet a client-first inbox.

The bookings portal wrapper, the orders portal wrapper, and the quotes portal wrapper are partially reusable. The underlying module data flows are correct and well tested from agency-side work, but the wrappers route clients through components that were never designed for client-first workflows. They work, but they are not the portal experience DRAMAC should expose.

The live chat portal surface is partially reusable. Clients can see conversations, reply, and manage agents. They cannot manage canned responses, internal notes privacy, routing rules, or departments from the portal. Internal notes visibility for portal users is a documented security concern. AI fallback messaging is silent on failure. These need rebuild-level attention inside an otherwise partially reusable surface.

The business notifications orchestrator is partially reusable. The event list and three-layer delivery are sound. Retry, observability, and the inclusion of portal users as real notification recipients are not sound.

The automation event pipeline is partially reusable. The emitter and processor are solid. Portal action coverage is zero. That gap is part of this overhaul.

### Misleading or shallow

The CRM portal route, the products portal route, the automation portal route, the marketing portal route, and the per-site apps route are shallow. They exist, but they are essentially empty wrappers or read-only glances over agency surfaces. They should not be taken forward as-is. The new portal must either remove them, replace them with focused, client-first views, or gate them clearly behind permission visibility.

The per-site analytics, blog, pages, seo, submissions, and media routes under a site identifier are shallow variants of the top-level portal surfaces. Rebuild should decide, per module, whether the per-site variant is needed at all or whether the top-level surface with site switching is enough.

The quick site switching experience is shallow. It requires returning to the sites list. An industry-standard portal has a header site switcher always available.

The AI fallback behavior in live chat is shallow from a client perspective. Silent failure is not acceptable in a business operations center.

### Rebuild required

A portal-specific data access layer is rebuild required. What existed before the April 2026 rollback was removed for good reasons. What remains today reads data through the admin client and scopes by client in application code. This is fragile. It must be replaced with a portal data service that is tenant-aware, permission-aware, site-aware, logged, and testable.

Row-level security policies that scope data access for portal users are rebuild required. The policies that previously existed were dropped. New policies must be designed together with the data access layer, not after it.

A portal audit log is rebuild required. Today no record is kept of which portal user viewed or changed what. For a business operations center, this is not optional.

A client-facing in-app notifications experience is rebuild required. The current in-app bell is wired to agency owners only. Portal clients need their own notification timeline, preferences, and read state, fed from a portal-first notification dispatcher that can deliver to client users in addition to agency owners.

A portal observability layer is rebuild required. Email sends, web push sends, AI calls, and workflow executions currently fail silently or log to console. At minimum, each must produce a structured event that a future dashboard can query.

A portal-first invoicing surface is rebuild required. The invoicing module exists with fourteen complete phases. The portal has not been connected to it meaningfully.

A portal-first marketing surface is rebuild required for the client-permitted slice only. MKT-11 shipped a permission-gated client portal view, but it still sits inside wrappers and must be reframed against the new shell.

Mobile-optimized portal workflows are rebuild required. The portal is responsive, which is not the same as mobile-first. Real mobile workflows for quick payment proof upload, chat reply, booking confirmation, quote acceptance, and invoice payment must be designed and tested.

Portal action event emission is rebuild required. Ticket creation, team invites, settings changes, notification preference changes, portal-initiated quote or booking actions, and payment proof approvals must all emit events so automation workflows can trigger off them.

White-label verification across the portal is rebuild required. Branding inheritance works in theory. It has not been systematically verified across every portal surface. Any residual DRAMAC brand or ResellerClub or Titan or Paddle supplier brand leaking through to clients must be eliminated as part of the rebuild.

---

## 4. Overhaul Principles

These principles bind every session. If a pull request violates one of them, it does not ship, regardless of how much work went into it.

Portal first, not agency second. Every portal view must be designed for the client user journey. A wrapper around an agency component is a last resort, never a default.

Permission safe at the server, not only at the UI. Every portal route must verify permissions on the server before rendering, every server action must verify permissions before mutating, and every database read must be scoped by row-level security, not only by application-level filters.

Tenant isolation is sacred. No portal query may ever return a row outside the client's agency, and no portal query may ever return a row for a site the client does not have access to. This must be enforced at least twice: in the data access layer and in the database policy layer.

Observability over silence. Every send, every fetch, every AI call, every workflow step, every permission denial must either succeed visibly or fail visibly. Silent failures are a rebuild defect.

Branded communication is always site-scoped. Any email, any push, any in-app message generated on behalf of a client or their customer must flow through the branded pipeline with the correct site identifier. Platform communication uses the platform pipeline and is clearly labeled as platform.

Mobile first, not merely responsive. Layouts, components, and workflows must be designed from the smallest viewport up. The portal is where business owners approve quotes from a phone between meetings.

White-label everywhere. No supplier brand may leak to the client surface. No DRAMAC mark may appear on an agency's white-labeled client portal. Branding overlay, fonts, colors, logo, and copy must all resolve through the existing brand inheritance system without exception.

Zambia-first locale respected. Currency, tax rate, timezone, date format, and number format must flow from the central locale configuration. Domain pricing, which is in US dollars, flows from its separate domain currency constant.

Cents are cents. Every price field in ecommerce and invoicing is an integer minor unit. No portal surface may convert values incorrectly and no portal form may store user-entered display values as minor units directly.

Reuse before rebuild, but classify honestly. If a surface is verified reusable, take it forward. If it is shallow or misleading, rebuild it. Do not polish a shallow surface and call it done.

Session gates are real gates. A session does not close until every completion gate listed in its brief has been demonstrated, and the acceptance standard in Section 16 has been reviewed against the work.

---

## 5. Module-by-Module Portal Requirements

This section defines what the rebuilt portal must expose for each module. It does not prescribe implementation. It defines scope, permission alignment, and the client-first behavior each surface must produce.

### Dashboard

The portal dashboard is the landing after login. It must show, across all sites the client can access, a prioritized list of items that need attention, including overdue invoices, pending orders awaiting the client's action, unapproved payment proofs, pending bookings, open support tickets, and chats waiting for the client's input. Secondary panels show key business metrics, most recent activity, and a quick site switcher. Every panel must gracefully show loading, empty, and error states. The dashboard must never show data from outside the tenant or from sites the client cannot access.

### Sites

The sites surface is the directory of sites the client can reach. For each site, the client sees the site identity, branding preview, domain status, module installation list, and per-site action shortcuts. From here the client can enter any site-scoped surface. The sites surface also exposes the quick site switcher that the shell header will also render.

### E-Commerce: Orders, Products, Customers

Orders must be client-first. The list shows status, payment status, fulfillment status, and any flags that require client action, such as payment proof awaiting approval. The detail view exposes the order lifecycle, customer, items, totals, payments, shipments, and linked conversations. Clients with the orders permission can update fulfillment state and approve or reject payment proofs. Inventory side effects and refund flows are reserved for clients with the right permission level.

Products are view-and-edit only for clients with the products permission. The client must be able to browse the catalog, edit descriptions, prices, inventory, and images, toggle publish state, and manage categories, but all writes flow through the ecommerce module's existing actions with portal-scoped permission checks and event emission.

Customers are read mostly. Clients see the customer list, can open a customer, and see their orders, bookings, quotes, and chat history. Writes on customers are limited to note additions and segmentation tags, subject to permission.

### E-Commerce: Quotes

Quotes in the portal must expose the full quote lifecycle from the client's side: the queue of incoming requests, the ability to build and send a quote using the cart-based builder reused from the agency surface, the amendment workflow, and the accept or reject decisions when the customer responds. Email verification gate and HMAC-backed quote portal for end customers remain unchanged. Portal users see the internal quote inbox, not the customer-facing portal. All prices must be shown correctly in main currency, not in minor units.

### Booking

Bookings in the portal show the calendar of appointments, the incoming request queue, and per-appointment detail with customer, service, staff, price, and status. Clients with the booking permission can confirm, complete, reschedule, cancel, and record payment. Cancellation routes through the cancelled-by-staff path. Per-appointment chats are linked from the detail view. Service catalog, staff profiles, and availability rules may be edited from the portal by clients with the appropriate permission.

### Live Chat

Live chat in the portal gives the client team a unified inbox scoped to the sites they can access. Conversations can be filtered by status, department, assigned agent, and linked entity such as order, booking, or quote. Clients with the chat permission can reply, assign, tag, close, and archive conversations. Canned responses, departments, and routing rules must be manageable from the portal, not only from the agency dashboard. Internal notes must be server-enforced as agent-only content and must never be exposed to the customer side of any conversation. Client team members with the chat permission can read and write internal notes; portal users without the chat permission must never see them.

Chiko AI behavior must be transparent. When AI is answering, the UI must indicate it. When confidence drops below the handoff threshold, the UI must indicate handoff. When the AI call fails, a visible fallback message must replace silent failure both on the visitor side and on the portal agent side. A per-site toggle to disable AI auto-response must be available to clients with the chat permission.

### CRM

The portal CRM surface must stop being a placeholder. Clients with the CRM permission must be able to manage contacts, companies, deals in the pipeline, and activities. Custom fields and segments are managed from the portal by clients with elevated CRM permission. Where an agency admin can do something in the agency dashboard, the portal CRM must either allow the equivalent or hide it consistently behind permission.

### Invoicing

The portal invoicing surface must deliver the client experience the invoicing module already supports from the back end. Clients with the invoices permission must be able to issue invoices, record payments, issue credit notes, manage recurring invoices, view expenses, record vendor bills, and drill into reports. Clients without the manage permission but with the view permission see a read-only financial surface. Clients with no invoicing permission do not see the invoicing navigation at all. All currency display must respect the invoicing module's own currency handling, not the platform default, and minor units must be handled consistently.

### Marketing

The portal marketing surface must reuse the existing permission-gated slice delivered in MKT-11 but must be reframed inside the new shell. Subscribers, campaigns, landing pages, drip sequences, and social scheduling all carry their own permission keys. What the client sees must match the permission they have.

### Automation

The portal automation surface is sensitive. Clients should see the list of workflows operating on their sites, the execution history, and the pass or fail state of recent runs. Editing and creating workflows from the portal is reserved for clients with an elevated automation permission. Where editing is allowed, the ReactFlow canvas is reused from the agency dashboard inside a portal shell. Portal-initiated workflow runs must emit events so they appear in the event log and can trigger downstream automation.

### Blog, Media, SEO, Forms

Blog in the portal exposes authoring, scheduling, and publish workflows for clients with the content permission, and a read-only view for clients without it. Media is manageable for clients with content permission and browse-only otherwise. SEO is read-mostly, with a health score, per-page and site-wide audit issues, and a subset of settings editable under content permission. Forms expose submissions, filtering, export, and basic lifecycle such as marking as read or archived.

### Domains, Business Email

Domains in the portal expose the list of domains, their status, DNS verification, expiry dates, and transfer state. Management actions that purchase, transfer, or renew are reserved for clients with the billing-adjacent permission and route through the existing domain service with white-label discipline, meaning no supplier name leaks into client UI. Business email exposes mailbox list, plan, status, and webmail access, again with supplier names hidden, again respecting white-label.

### Support

Support tickets in the portal remain substantially as today: create, view, reply, close. Inline chat within a ticket is not required. Status transitions and notifications are unchanged. The surface must be consistent with the new shell and the new notification system, and portal ticket creation must emit an automation event.

### Team

Team management lets the client administrator invite, edit, and remove team members who share access to the portal, and lets them set permission overrides per team member per site where site-level overrides are supported. Team changes must emit events.

### Settings and Notifications

Portal settings cover the user profile, password and authentication, notification preferences per channel and per event type, and per-site overrides for notification delivery. The notifications center becomes a client-first inbox, not an agency-owner mirror, with unread counts, filtering, and bulk actions.

### Apps

The apps surface shows what modules are installed per site, what their status is, and permitted configuration shortcuts. It is a navigation hub, not a settings dump.

---

## 6. Live Chat Deep Dive

Live chat is the busiest two-way communication surface between an agency's client and their customers. It is also the one where silent failure is most damaging to brand trust. The overhaul treats live chat as a first-class citizen of the portal.

The conversation model remains as designed: conversations belong to a site, optionally link to an order, quote, booking, or CRM entity, and carry messages, internal notes, and files. Per-order, per-quote, and per-booking conversation isolation is already in place and must be preserved. The portal inbox respects that isolation while still allowing a single combined view across linked entities.

Internal notes carry a four-layer security model that already exists on the agency side. The portal must reuse the same server-side enforcement: notes are written into a separate notes table with agent-only visibility, are filtered out of customer-facing streams by server-side query, are never preview-leaked into notification previews, and are never returned over any public endpoint. Any portal path that touches conversation messages must verify at the server that the requester is an agent and drop notes from the result if not.

Chiko AI is the fallback responder. Its behavior must be transparent in the portal. The portal must show an AI badge when AI is replying, a confidence indicator when relevant, and a clear handoff state when the AI has requested a human. If the AI call fails or rate limits, the portal must render a visible fallback message on the agent side and the customer side, rather than leaving the conversation idle. A portal-level toggle must allow clients with the chat permission to disable Chiko per site. When disabled, the widget must communicate that an agent will respond shortly, never that the AI is unavailable.

Canned responses, departments, and routing must be manageable from the portal, not only from the agency surface. A client team member with the chat permission must be able to create canned responses scoped to their site, assign default departments, and configure simple routing rules. The existing agency canned response system is a suitable base.

The customer-context bridge, which enriches AI responses with CRM, ecommerce, and booking context for the customer, must continue to function. The portal must surface the same context to human agents so they do not answer blind. File uploads including payment proof must continue to work and must be observable: who uploaded what, when, with what status, and how long it has been pending approval. A bulk approval or rejection experience for payment proofs is not a nice-to-have. It is a core portal need.

Reliability for live chat must improve. Every AI call must be wrapped with structured logging. Every conversation creation, especially the auto-created conversations tied to orders, quotes, and bookings, must be observable. Realtime subscriptions must be scoped to the correct tenant and user to prevent leak across agencies. Portal live chat must pass a tenant isolation test in the validation plan.

---

## 7. Communication Reliability Plan

Communication reliability is its own workstream because it spans the entire rebuild.

In-app notifications today are agency-owner centric. The overhaul introduces a portal-user recipient path. A portal user receives in-app notifications for events on sites they can access, subject to their notification preferences. The dispatcher must route each event to the full set of interested recipients, which is a union of agency owners and portal users with access and preferences opted in. The in-app feed in the portal shell becomes a client-first timeline with unread counts, filters, and archive.

Email must route through the branded pipeline with the correct site identifier for all customer-facing and client-facing messages. Platform messages continue through the legacy pipeline. Every send must produce a structured log record including send attempt, message type, recipient class, site identifier, agency identifier, and delivery status where the provider supports it. Delivery webhooks must be wired so that bounces, complaints, and delivery confirmations update the log. Retry policy must be defined and implemented for transient failures.

Web push must continue to use the admin Supabase client because it runs fire and forget. The overhaul adds structured logging for every push send, success or failure, and records whether a subscription was found. Push preferences must be respected per user per event type.

AI reliability matters here. Chiko AI, AI financial insights in invoicing, AI marketing suggestions, and the AI website designer all share a sixty second function budget and the multi-step orchestration pattern. Any AI call initiated from a portal surface must be wrapped with structured logging, must have a defined fallback behavior that is visible to the user, and must record tokens used for future cost observability.

Workflow execution is already logged per step. The overhaul requires that portal actions emit events and that execution failures be visible in the portal somewhere sensible, at minimum the automation module surface.

Observability becomes a portal need, not only a platform need. The rebuild adds a portal operations telemetry surface, visible to super admins and optionally to agency owners, that exposes rolling counts and error rates for in-app, email, web push, AI, and workflow events scoped to the tenant. Portal users do not see this surface. Agency owners may.

---

## 8. Data and Dependency Map

The portal depends on the following data domains. Each is identified by the module that owns it.

The clients domain owns portal user identity, portal permissions, site permissions, team membership, and team-level overrides. The sites domain owns site identity, domain state, branding, installed modules, and public-facing settings. The agencies domain owns branding base values, billing entitlements, and ownership.

The ecommerce domain owns products, variants, inventory, orders, payments, shipments, refunds, quotes, and storefront customers. The booking domain owns services, staff, availability, appointments, and payments. The CRM domain owns contacts, companies, deals, activities, and segmentation. The live chat domain owns conversations, messages, internal notes, files, canned responses, departments, and agent assignments. The invoicing domain owns invoices, payments, credit notes, recurring schedules, expenses, vendors, bills, purchase orders, and reports. The marketing domain owns subscribers, campaigns, sequences, landing pages, forms, and social posts. The automation domain owns workflows, triggers, events, and executions. The content domain owns blog posts, media, SEO, and form submissions.

The portal depends on every one of these domains as a reader and, for permitted surfaces, as a writer. The dependencies flow in one direction: the portal never mutates a domain directly through raw database access, it mutates through the existing server actions of the owning module, after the portal data access layer has verified that the portal user has the necessary permission and that the target entity belongs to a site the portal user can access.

The portal-specific domain introduced by this overhaul is thin by design. It owns the portal audit log, the portal notification preferences, the portal subscription entries for push notifications, and any portal session metadata that is not already covered by Supabase Auth. It does not duplicate any module data.

The email pipeline depends on agency branding and site branding. The push pipeline depends on subscription records keyed to user identifier. The automation pipeline depends on the events log. The AI surfaces depend on the Anthropic SDK and the shared AI provider configuration.

---

## 9. UX and IA Plan

Information architecture for the rebuilt portal follows five top-level groups: Overview, Sites, Operations, Growth, and Account.

Overview contains the dashboard only. Operations contains the surfaces that run the business day to day: orders, bookings, quotes, live chat, CRM, invoicing. Growth contains marketing, blog, SEO, forms, and analytics. Sites is the directory and cross-site entry point. Account contains settings, notifications, team, support, domains, business email, and apps. Each group is shown only if the client has at least one permission that unlocks something inside it.

Navigation follows two primary surfaces. The sidebar is the main navigator on tablet and larger viewports. The bottom tab bar is the main navigator on mobile, with a fixed set of five items: Overview, Operations, Growth, Inbox, and More. The More tab opens a sheet with the remaining sections. A persistent header across all viewports hosts the site switcher, the notifications bell, and the user menu.

The site switcher is always one tap away. On small viewports it opens a full-height sheet with a searchable list and a preview card per site. On large viewports it opens a popover. The currently selected site is always visible in the header so the user never has to guess which site's data they are looking at.

Every list view follows the same pattern: filter bar, bulk actions when items are selected, a responsive table that becomes a stack of cards on small viewports, empty state, loading skeleton, error state with retry. Every detail view follows the same pattern: header with title, status chips, and primary actions, tabbed body, sticky action bar on mobile.

Forms are mobile-first. Inputs are full-width, touch targets are at least forty-four pixels, validation errors are inline and descriptive, and destructive actions require confirmation.

Empty states are purposeful. They explain what the user is looking at, why it is empty, and the single next action that moves them forward.

Branding is applied consistently. The header, sidebar accent, button primary, and link color all derive from the site brand palette resolved by the existing brand inheritance system. Typography uses the site's heading and body fonts with the legacy-font-handling rule respected.

Motion is restrained. Transitions are short, used to indicate state change, and disabled entirely for users who prefer reduced motion.

Accessibility is not an afterthought. All interactive elements are reachable by keyboard, all images have meaningful alternatives, color contrast meets the standard guidelines across the brand palette, and screen reader labels are correct on icons and badges.

---

## 10. Permissions and Access Model

The rebuilt portal consolidates the permission model into a single resolver that every portal server action, server component, and API route uses.

The resolver takes a portal user, optionally a site identifier, and a permission key, and returns a boolean. It reads the client-level value first, then overlays the site-level value if one exists. It also respects team-level overrides where the portal user is a team member with narrower access than the client base. It caches within a single request and logs every deny.

Permissions are grouped by module and by verb. A view permission grants read access. A manage permission grants read and write. Some modules expose an additional admin permission that grants structural change, such as workflow editing in automation or routing rule management in live chat.

The permission matrix used by the rebuild includes, at minimum: portal access, analytics view, content edit, invoices view, invoices manage, orders manage, products manage, customers manage, bookings manage, quotes manage, CRM manage, chat manage, chat admin, marketing manage, automation view, automation manage, team manage, billing view, domains manage, and email manage. Every navigation entry and every action button in the portal is gated by one of these keys.

Every portal server action verifies the permission before touching the database. Every portal server component verifies the permission before rendering sensitive data. Every portal API route verifies the permission before responding. Row-level security policies on the database reinforce these checks at the storage layer. A portal request must pass both the application check and the database policy to see data.

Impersonation, which lets an agency view the portal as a specific client, is preserved. It must show an unambiguous banner on every page, must be logged with who impersonated whom and when, and must never silently elevate permissions beyond the impersonated client's own.

Audit logging is part of the permission model. Every portal write operation, every portal read of sensitive data, and every permission denial writes a row to the portal audit log with user identifier, client identifier, site identifier when applicable, action name, target entity type and identifier, result, and request metadata. The audit log is visible to super admins and to agency owners for their own tenant.

---

## 11. Testing and Validation Strategy

Testing is continuous. Every session produces working code behind completion gates and also produces evidence that the gates are met.

Unit-level testing covers the permission resolver, the portal data access layer, mapping between snake case and camel case, minor-unit math, locale formatting, brand resolution, and any utility shared across the portal.

Integration-level testing covers tenancy isolation, permission enforcement, branded email rendering, in-app notification delivery, web push delivery, AI fallback rendering, and automation event emission from portal actions.

End-to-end testing covers the primary journeys for each session. For the foundation session, the journeys include login, site switching, permission-gated route access, and impersonation. For later sessions, the journeys include payment proof approval, order fulfillment update, quote send and accept, booking confirm and cancel, invoice payment, campaign send, and workflow edit.

Tenancy isolation testing is a separate mandatory suite. Two agencies, two clients per agency, two sites per client are created. A script drives the portal as each user and verifies that no request returns data from outside that user's tenant or sites. This suite runs against staging before each session closes.

Mobile testing is mandatory. Every new surface is exercised on a small viewport. Touch targets, scroll behavior, sheet dismissal, and bottom tab navigation are verified. A small set of real devices is used, not only browser device emulation.

Accessibility testing is mandatory. Every new surface is exercised with a screen reader, keyboard only, high contrast, and reduced motion. Any blocking issue is fixed before the session closes.

Observability testing is mandatory. Every new surface produces structured logs or events for the messages it sends, the AI calls it makes, and the workflows it triggers. A small query suite verifies that logs exist and that error cases produce visible, not silent, failures.

TypeScript compilation must be clean for the files changed in the session. The existing baseline of errors elsewhere in the repo is not a reason to regress. No session may increase the TypeScript error count in the changed files.

---

## 12. Session Roadmap

The rebuild is delivered in six sessions. Each session has one to three focused phases. Each session has completion gates and an acceptance standard. Each session is sized to fit a single AI agent run with clear handoff at the end.

Session one is Foundation. It rebuilds the shell, the data access layer, the permission resolver, the audit log, the session handling, the site switching header, the bottom tab mobile navigation, the baseline empty, loading, and error patterns, and the observability scaffolding. It does not ship any new module surface. It is the ground on which sessions two through six stand.

Session two is Communication. It rebuilds live chat for the portal, rebuilds the notifications inbox for portal users, reworks the business notifications orchestrator to recognize portal users as recipients, lands the AI fallback behavior, lands the canned responses, departments, and routing surfaces for portal, and lands the reliability logging for email, push, and AI.

Session three is Commerce. It rebuilds orders, products, customers, quotes, and bookings as portal-first surfaces. It removes the shallow wrappers for these modules. It wires portal action event emission for commerce actions. It verifies minor-unit handling across every price display.

Session four is Operations. It rebuilds CRM, invoicing, marketing, and support as portal-first surfaces. It connects the invoicing module to the portal in full, including client portal statements and online payment flows. It reframes the MKT-11 client portal marketing slice inside the new shell. It brings support tickets consistent with the new shell and the new notification system.

Session five is Content and Infrastructure. It rebuilds blog, media, SEO, forms, domains, business email, and apps as portal-first surfaces. It resolves remaining white-label leaks from suppliers in the domain and email surfaces. It adds the per-site settings surface a client can actually use.

Session six is Polish and Acceptance. It runs the mobile-first pass across every portal surface, runs the white-label pass, runs the accessibility pass, runs the tenancy isolation suite, finalizes the observability surface, and produces the final acceptance report. After this session, the portal is production ready for external clients.

---

## 13. Session 1 — Foundation

### Objective

Deliver the rebuilt portal shell. A portal user can sign in, be routed to a secure layout, see only navigation that matches their permissions and installed modules, switch between sites quickly on any viewport, view a minimal dashboard that proves the data access layer and permission resolver work end to end, and produce an audit log entry for every sensitive action they take. No new module surface ships in this session. Module surfaces are reserved for sessions two through six and will sit on top of what Session one ships.

### Why this session comes first

The portal currently reads data through the admin client with application-layer filtering. That pattern is a production-risk. Before another module surface is added, a permission-safe, tenant-safe, observable data access layer must exist. Before a permission-safe data access layer can exist, a single permission resolver and a single portal user type must exist. Before either can exist, the layout, session handling, and site switching they rely on must be stable. This session sequences those pieces in the right order so every later session is building on rock, not sand.

### Focus areas

Shell and layout, including the header, sidebar, and mobile bottom tab bar, responsive at every breakpoint, branded at every surface, and with a persistent site switcher. Authentication and session handling, preserving magic link and password entry, preserving impersonation, and adding clear impersonation indicators. Permission resolver, a single function every portal path uses to decide access. Portal data access layer, a typed, tested, logged wrapper that every portal read goes through, with tenancy and permission enforcement. Row-level security policies, designed together with the data access layer, reinforcing tenancy and per-site access at the database layer. Portal audit log, a table and a shared writer that records every portal action of interest. Observability scaffolding, including structured event logging for sends, AI calls, and workflow triggers, even if the scaffolding is not exercised by this session beyond the audit log. Baseline patterns, including empty state, loading state, error state, confirmation dialog, and toast, all shared components used by every later session. A minimal dashboard that exercises the data access layer against three live domains, such as sites, orders, and live chat, so the foundation is demonstrably working.

### Module areas touched

Clients and agencies for identity and permission, sites for the site switcher and route scoping, and whichever three live domains are chosen for the minimal dashboard such as orders, bookings, or live chat summary counts. No write paths into commerce, live chat, invoicing, automation, marketing, or content are introduced in this session.

### Key risks

Reintroducing row-level security policies incorrectly can break either agency dashboard reads or storefront reads. Policies must be designed with explicit awareness of all three caller shapes: agency admin, portal user, and public storefront. The session must validate each before closing.

Replacing admin-client reads with scoped reads can expose existing bugs where application-layer filters were masking a missing policy. Each replacement must be validated against the tenancy isolation suite.

Breaking impersonation is easy. Impersonation must be preserved and visibly indicated, and it must never silently elevate the impersonator beyond the impersonated client's permissions.

Breaking branded email rendering is easy if site identifier threading regresses. This session does not send new emails, but it must not regress existing sends either.

Performance can regress if the data access layer adds layers without caching. Per-request caching inside the permission resolver and the data access layer is required, not optional.

Mobile layout can regress if the shell is built desktop-first. The shell must be built mobile-first and verified on the smallest target viewport before desktop polish.

### Success criteria

A portal user can sign in through magic link and through password. A portal user can see only the navigation entries their permissions allow. A portal user can switch sites from the header on any viewport in one interaction. A portal user who does not have access to a site cannot reach any route scoped to that site, both at the server component layer and at the database layer. An agency user impersonating a client sees the portal exactly as the client would, with a visible impersonation banner and a working stop-impersonation control, and no elevated access. A portal user triggers an audit log entry for signing in, switching sites, and viewing any sensitive data. The minimal dashboard reads from at least three domains through the portal data access layer and demonstrates correct scoping. Every page has loading, empty, and error states. TypeScript compiles cleanly for the files changed in this session.

### Validation checklist

Tenancy isolation suite runs and passes for two agencies with two clients each and two sites per client. A portal user from one tenant cannot read any data from another tenant through any portal route, server action, or API route. A portal user with only view permission cannot mutate any entity. A portal user without portal access cannot reach any portal route at all and is redirected to login. An impersonation session is auditable. Magic link entry works. Password entry works. Sign out works. Site switching works on a phone-sized viewport and on a desktop viewport. The dashboard's three data panels each render a loading skeleton, a populated state, an empty state, and an error state with retry under simulated conditions. The portal audit log contains entries for the actions specified above. The agency dashboard still works unchanged. The public storefront still works unchanged. No email regression. No push regression.

### Completion gates

All success criteria above are demonstrably met on a running branch, captured in the session handoff notes. The tenancy isolation suite is part of the repository and can be rerun by a later session. The permission resolver, the portal data access layer, the audit log writer, and the shared state components are documented in a short contributor-facing note so session two can use them without rediscovery. `memory-bank/activeContext.md` and `memory-bank/progress.md` are updated to reflect the new foundation state and to replace the prior "portal rolled back" framing. This document is updated if and only if something discovered during implementation contradicts what it says.

### Agent Operating Context

See Section 17 for the full operating contract. The short version that applies to this session specifically: the agent executing Session one has full access to the Supabase MCP against project nfirsqmyxmmtbignofgb, the Vercel MCP, the Cloudflare MCP, the Context7 documentation MCP, and the Paddle MCP. The agent must apply the foundation migration through the Supabase MCP itself, must create the required portal auth users and link them to the clients table through the Supabase admin REST API itself, must run the seed script itself against the staging database, must confirm all eight vitest tests pass itself, and must verify tenancy isolation itself. Nothing in this session is handed back to the user for manual SQL, manual user provisioning, manual scripting, or manual deployment. Destructive production actions, and only those, require explicit user confirmation.

### Handoff to Session 2

Session two receives a portal that does nothing useful yet but does it safely. Session two builds live chat and the notifications inbox on top of the foundation. Session two must not need to introduce a new permission mechanism, a new data access layer, or a new audit pattern. If session two finds itself tempted to, it means session one is incomplete and must be reopened before session two proceeds.

---

## 14. Sessions 2–6 High-Level Briefs

These briefs are intentionally terse. Each one becomes a full session brief, in the detail of Section 13, when the user requests it after the prior session closes. The purpose of the briefs in this document is to make dependencies, risks, and exit criteria visible up front so the sequencing does not drift.

### Session 2 — Communication

Goal: deliver a portal-first live chat experience and a portal-first notifications inbox, and make the communication pipeline reliable enough to trust.

Focus: live chat inbox, conversation detail, internal notes security, canned responses, departments, routing rules, Chiko AI transparency and fallback, portal notifications inbox, notification preferences, expansion of the business notifications orchestrator to recognize portal users as recipients, and structured logging across email, push, AI, and workflow events.

Prerequisites: Session one completed, permission resolver available, portal data access layer available, audit log available, site switcher available, shell patterns available.

Exit criteria: a client team member with the chat permission can work conversations end to end on mobile and desktop, including internal notes that never leak to customers and never leak in notification previews. Chiko AI shows transparent state and a visible fallback when it fails. A portal user receives in-app notifications for events on sites they can access, with per-event and per-site preferences. Every send produces a structured log entry. Tenancy isolation holds.

Risks: realtime subscription leakage across tenants, internal note preview leak regressions, AI rate-limit masking, notification duplication if the orchestrator treats a portal user and an agency owner as the same recipient for the same event.

### Session 3 — Commerce

Goal: deliver portal-first orders, products, customers, quotes, and bookings.

Focus: client-first list and detail views, fulfillment and payment flows where permitted, payment proof approval with bulk actions, quote builder and amendment workflow from the portal, booking calendar and appointment lifecycle from the portal, correct minor-unit handling across every price surface, portal action event emission for commerce events.

Prerequisites: Session one and two complete.

Exit criteria: commerce wrappers are removed and replaced with portal-first surfaces. Permissions gate every action. Minor-unit math is correct everywhere. Every commerce action emits an event that the automation module can see. Tenancy isolation holds. Mobile workflows are exercised.

Risks: regression in agency dashboard caused by shared component edits, minor-unit math drift, storefront regression, quote portal regression, payment proof flow regression, linked conversation creation regression.

### Session 4 — Operations

Goal: deliver portal-first CRM, invoicing, marketing, and support.

Focus: CRM contacts, companies, deals, activities, and segmentation with proper permission gating; invoicing connected to the portal in full, including invoices, payments, credit notes, recurring invoices, expenses, vendors, bills, reports, statements, and online payment flow for the client portal customer experience; marketing reframed inside the new shell for the MKT-11 slice; support tickets polished inside the new shell and notifications.

Prerequisites: Session one, two, and three complete.

Exit criteria: every operations surface is permission-gated, branded, mobile-first, observable, and permission enforced at server and database layers. The invoicing client portal experience is coherent end to end. The marketing experience matches the permission gate. Support is consistent with the new shell. Tenancy isolation holds.

Risks: invoicing minor-unit drift, Paddle and invoicing pipelines being conflated, Stripe resurfacing in invoicing, marketing supplier names leaking through, report render cost regressions.

### Session 5 — Content and Infrastructure

Goal: deliver portal-first blog, media, SEO, forms, domains, business email, and apps.

Focus: blog authoring and scheduling under content permission, media library under content permission, SEO insights and subset of settings under content permission, forms submissions management, domains management with supplier branding hidden, business email with supplier branding hidden, apps directory as a navigational hub for per-site modules.

Prerequisites: Session one through four complete.

Exit criteria: every content and infrastructure surface is permission-gated and white-labeled. No supplier brand is visible anywhere. Domain purchase, transfer, and renewal flows respect white-label. Business email respects white-label. Tenancy isolation holds.

Risks: supplier brand leak, DNS misconfiguration, email provisioning silent failure, SEO settings conflict with studio-generated pages.

### Session 6 — Polish, Mobile, Acceptance

Goal: produce an externally shippable portal.

Focus: mobile-first audit across every surface, white-label audit across every surface, accessibility audit, performance audit, observability surface, tenancy isolation rerun, final acceptance against Section 16.

Prerequisites: Session one through five complete.

Exit criteria: the portal is production ready by the acceptance standard defined in Section 16. A handoff document exists. The memory bank is updated to mark the portal rebuild complete.

Risks: scope creep, unresolved tail defects from earlier sessions surfacing only under mobile or accessibility scrutiny, white-label leaks caught late, silent failures caught only through observability queries.

---

## 15. Open Questions and Risk Register

Open questions are captured here so a later session can either answer them or explicitly defer them.

Portal user identity. Today a portal user is an authenticated Supabase Auth user bound to a clients row. Should a client support multiple portal users, for example a team at the client's business, each with their own authentication and their own permission scope, without creating more client rows? The clients table already supports a primary portal user. A portal team table or an extension of the current team member concept to clients is likely needed, and the overhaul should settle this before Session four.

Team model unification. Agencies have a team member concept with thirty-two granular permissions. Clients have a simpler team concept and thirteen portal-facing boolean permissions. Should the two models converge, or should they remain distinct? Convergence is appealing for consistency. Divergence is appealing for simplicity on the client side. The recommendation is to keep them distinct but align naming conventions so that a team member permission at the client level always maps to a known portal permission key.

Notification dispatcher redesign. The business notifications orchestrator currently assumes the agency owner is the primary recipient. The overhaul requires treating portal users as first-class recipients. The redesign must decide whether the orchestrator emits multiple notification records per event or a single record with multiple recipients. The recommended approach is multiple records keyed to user identifier so that read state, preferences, and deletion are per user.

Real-time transport. The portal currently uses the same realtime transport as the agency dashboard. A review of realtime subscription scoping is required to prevent cross-tenant leak. This should happen in Session two.

Invoicing portal scope. The invoicing module has fourteen complete phases and an ongoing INVFIX overhaul with carryover. Which INVFIX phases must be closed before Session four can land the portal invoicing surface cleanly? Session four must include a pre-flight check that confirms INVFIX-09 and the remaining report-spec carryover are closed or explicitly deferred with a documented workaround.

Automation editing from portal. How deep into workflow editing should a portal user be allowed to go? The recommendation is that portal users with an elevated automation permission can edit workflows scoped to their sites only, using the same ReactFlow canvas, with a server-side guard that rejects any workflow touching resources outside their sites.

AI cost control. Chiko AI and the other portal AI surfaces can be abused. The recommendation is per-site and per-user rate limiting, token accounting, and a visible usage dial in the portal.

Internationalization. The portal is English only today. The recommendation is to prepare the portal for internationalization in Session five by extracting strings, but not to translate until a client demands it.

Risk register summary. The highest residual risks across the rebuild are cross-tenant data leak during the data access layer refactor, silent communication failures during the notification and AI reliability work, minor-unit math drift during the commerce rebuild, white-label supplier leaks during the content and infrastructure rebuild, and acceptance drift if Session six is rushed. Each risk has mitigations described in the relevant session brief.

---

## 16. Final Acceptance Standard

The portal is considered complete when every statement below is demonstrably true in production with real client data.

Every portal route enforces authentication before rendering. Every portal server action enforces authentication and permission before mutating. Every portal API route enforces authentication and permission before responding. Every portal database read is constrained by row-level security in addition to application-layer filtering. No portal code path reads or writes another tenant's data under any legitimate call sequence.

Every portal surface responds to the client's permission set and to the site's installed modules. Nothing is shown that the client cannot act on. Nothing is hidden that the client can act on.

Every portal surface works on a small mobile viewport. Every interactive element is reachable by keyboard. Every interactive element has an accessible label. Color contrast meets the standard guidelines across every brand palette variation. Motion respects reduced-motion preferences.

Every portal send produces a structured log record. Every portal AI call produces a structured log record. Every portal workflow trigger produces a structured log record. Every portal write produces an audit log record. Failures are visible, not silent, both in the user interface and in the log layer.

Every portal customer-facing email and every portal client-facing email flows through the branded pipeline with the correct site identifier. Platform emails flow through the legacy pipeline and are clearly labeled as platform. In-app notifications reach both portal users and agency owners according to recipient rules and preferences. Web push reaches the intended recipient and respects preferences.

Every supplier brand is hidden from client surfaces. Domain registration, domain transfer, email provisioning, and any other upstream integration shows DRAMAC-agency-aligned copy only.

Every price field in every commerce and invoicing surface is correct to the minor unit, in the right currency, with the right tax treatment, matching the locale configuration.

Live chat never exposes an internal note to a customer or to a portal user without the chat permission. Live chat never stalls silently on AI failure. Canned responses, departments, and routing are manageable from the portal.

Every portal action that could trigger automation does trigger automation. The event log contains portal-originated events.

The tenancy isolation suite passes. The accessibility suite passes. The mobile audit passes. The white-label audit passes. The observability audit passes. The permission matrix audit passes.

The memory bank reflects the new portal reality. This master brief is up to date. The next team that touches the portal can reach full context from these documents alone.

When every statement in this section is true, the portal is complete by the definition of this overhaul. Until every statement is true, it is not.

---

## 17. Agent Operating Context and Available Tooling

This section is the standing operating contract for every AI agent executing any session of this portal overhaul. It applies retroactively to Session one and prospectively to Sessions two through six. Every per-session brief restates a short form of this contract under an "Agent Operating Context" subsection, and in every case the authoritative version lives here.

### Full tooling access is provided

The agent executing a session has full, first-class access to the following services through Model Context Protocol servers already wired into this workspace. The agent is expected to use them directly rather than ask the user to perform manual steps.

The Supabase MCP is connected to project nfirsqmyxmmtbignofgb. Through it the agent can list tables, read schemas, run read-only SQL, run write SQL, apply migrations, generate typed types, list branches, create branches, deploy edge functions, read logs, and read advisors. Every schema change introduced by a session must be applied by the agent through this MCP. The agent does not produce a dot-sql file for the user to run unless the file is also recorded in the migrations folder as part of version history, in which case the agent still applies it through the MCP itself.

The Vercel MCP is connected and can list projects, list deployments, fetch build logs, fetch runtime logs, deploy the working branch, and fetch protected preview URLs. The agent uses this MCP to verify that changes build and deploy cleanly, and to inspect logs when diagnosing a failure, rather than asking the user to paste logs.

The Cloudflare MCP is connected and can list zones, list DNS records, generate DNS reports, and search Cloudflare documentation. The agent uses this MCP when a session touches domains, DNS verification, or caching behavior.

The Context7 MCP is connected and returns current library documentation on demand. The agent uses this MCP to resolve framework or library behavior when training data may be out of date, before guessing and before asking the user to paste documentation.

The Paddle MCP is connected and can read and write Paddle billing entities. The agent uses this MCP when a session touches Paddle subscriptions, products, prices, transactions, or customers.

In addition, the agent has workspace file system access, terminal access, the ability to edit files, the ability to run vitest, playwright, tsc, and pnpm scripts, and access to the repository memory under the memories slash repo directory.

### The self-execution rule

No task in any session is ever handed back to the user for manual execution when the agent has an MCP or tool that can perform it. In particular: migrations are applied by the agent through the Supabase MCP and never left in a dot-sql file with a note that reads "please apply this in the dashboard"; authentication users are created by the agent through the Supabase admin REST API and are linked to the relevant rows in the same step; seed scripts are run by the agent against the staging database; edge functions are deployed by the agent through the Supabase MCP; type generation is run by the agent through the Supabase MCP; dependency installs are run by the agent; test suites are run by the agent and their output is reported back; deployments to a preview environment are triggered by the agent through the Vercel MCP when that is the natural way to verify a change. If a session step reads like the user will need to copy something from the brief into a SQL editor, an email provider console, or a cloud dashboard, the agent has misunderstood the operating contract and must reconsider.

The agent reports back to the user with verified outcomes, not pending instructions.

### The only exception: destructive production actions

There is exactly one category of action that requires explicit user confirmation before the agent executes it: actions against production that are destructive and not reversible in the ordinary workflow. Examples include dropping or truncating production tables, mass deletion of production rows outside a reversible soft-delete path, disabling or deleting production authentication users, force-pushing to a protected branch, removing a production domain, cancelling a live subscription without a user-initiated request, and any action that would visibly affect a real paying client. For these, the agent prepares the full command, describes the blast radius, and asks the user to confirm before proceeding. Even here, after the user confirms, the agent still executes the action itself rather than asking the user to run it.

Non-destructive, reversible, development and staging actions proceed without confirmation: applying additive migrations, creating staging auth users, running seed scripts, adding indexes, adding tables, deploying preview builds, writing audit log entries, editing files, running tests.

### How a session is considered complete

A session is considered complete when the agent has applied every migration, created every required entity, run every validation step, produced every document update required by the session brief, and handed back a session report that summarizes: which migrations were applied and through which MCP, which auth users and seed rows were created, which tests ran and which passed, which deployments were triggered, which memory bank files were updated, and any open items requiring a human decision in a later session. A session that ends with "the user still needs to run X" when the agent could have run X is not complete.

### How the brief communicates with the agent

Per-session briefs are written in prose. They intentionally contain no code, no SQL, and no command lines. The agent is responsible for translating the prose requirement into the right code, the right migration, the right MCP call, and the right test. The brief specifies the what and the why. The agent owns the how. The operating contract in this section defines the floor: full MCP access is assumed, manual hand-off to the user is disallowed, destructive production actions are gated by explicit user confirmation.

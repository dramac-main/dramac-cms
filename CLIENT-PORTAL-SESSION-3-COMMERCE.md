# DRAMAC Client Portal — Session 3: Commerce

**Document type:** Single-session implementation brief. Hand this document, together with `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md`, to the AI agent executing Session three.
**Audience:** One AI agent, working from a fresh context, with full MCP and tool access as defined in Section 17 of the master brief.
**Constraint:** Prose only. No code, SQL, pseudo-code, schema diffs, component snippets, or command lines appear anywhere in this file. The agent is responsible for translating the requirements below into the correct implementation.
**Working rule:** Read the master brief end to end. Read this session brief end to end. Read `memory-bank/activeContext.md`, `memory-bank/systemPatterns.md`, and `memory-bank/progress.md`. Read the foundation note at `next-platform-dashboard/docs/PORTAL-FOUNDATION.md`, including the Session 2A appendix on the send log, the orchestrator dispatch model, and the realtime subscription audit. Read `CLIENT-PORTAL-SESSION-1-FOUNDATION.md` and `CLIENT-PORTAL-SESSION-2-COMMUNICATION.md` for the contracts the commerce session must consume. Then plan the session before editing any file.

---

## 1. Starting State

Sessions one and two have shipped. The portal shell, the site switcher, the permission resolver, the portal data access layer, the portal audit log, the shared pattern primitives, the baseline dashboard, the support tests, and the foundation documentation are in place from Session one. The communication layer is in place from Session two: a portal live chat inbox and conversation detail with five-layer internal-note safety; a Chiko AI transparency, fallback, and per-site disable surface; a portal-first notifications inbox; per-event and per-site notification preferences; a per-recipient orchestrator keyed to user identifier; structured logging across in-app, email, push, AI, and workflow channels; an email delivery webhook with a bounded retry policy; a realtime subscription scope audit documented in the foundation note; and portal action event emission for the communication actions that session introduced. Fifteen portal vitest tests pass.

The commerce systems of the platform, as they stand before this session, are mature on the agency side and partially built on the portal side. Orders, products, customers, quotes, bookings, and payment proofs exist as agency-accessible surfaces with their own data, services, and views. Portal wrappers reuse agency components in several places and in several cases the portal cannot actually act on the underlying data even when the surface appears to allow it. The ecommerce minor-unit model, the Zambia-first locale and tax defaults, the branded email pipeline keyed to the site identifier, and the payment provider posture with Paddle as the only platform billing provider are all in place from prior platform work. The booking system exercises the same tenancy model and is the operational surface for service businesses running on DRAMAC.

Session three closes the commerce gaps on the portal side and makes the underlying commerce pipeline reliable enough that operations, content, and polish sessions can trust it.

---

## 2. Objective

Deliver a portal-first commerce experience that a client team member can actually run a business from, and make the underlying commerce pipeline reliable, tenancy-safe, and observable enough that the rest of the portal rebuild can trust it. Concretely: a portal orders list and detail with fulfillment, refunds, shipping updates, and payment-state progression where permitted; a portal products and variants and inventory surface with low-stock alerts; a portal storefront customers list and detail with lifetime value and order history; a portal quotes builder with amendments, acceptance, and conversion to order or invoice; a portal bookings calendar with appointment lifecycle, staff assignment, service catalog, and availability management; a portal payment proof approval surface with bulk actions; correct minor-unit math on every read, write, display, and aggregation; and portal action event emission for every commerce write so that the automation module can observe and react.

This session ships the largest user-visible surface area of the entire portal rebuild. It must also validate that the contracts delivered in Sessions one and two hold under commerce load without regression.

---

## 3. Why This Session Comes Now

Commerce is the economic center of DRAMAC for almost every client on the platform. Orders, products, customers, quotes, bookings, and payment proofs are the surfaces a client team member spends their working day on. If these surfaces cannot be operated from the portal, the portal does not solve the problem it exists to solve, regardless of how polished its foundation or its communication layer is.

Commerce is also the heaviest consumer of the contracts delivered in Sessions one and two. Every commerce write should run through the portal data access layer, every denied commerce write should produce an audit entry, every commerce event that notifies a user should flow through the per-recipient orchestrator with preference respect, every commerce send should produce a structured log record, and every commerce surface should respect the tenant-scoped realtime subscription model. If any of these contracts fail under commerce load, they will fail silently later; finding out now is the cheapest possible moment.

Commerce comes before operations and content so that operations surfaces, which rely on commerce data for invoicing, statements, and CRM activity, are built on top of a working commerce model rather than next to one.

---

## 4. Focus Areas

### 4.1 Portal Orders List and Detail

The portal gains a first-class orders surface. A client team member with the orders permission sees, for the currently selected site, a list of orders with order number, customer identity, order total in the site's currency rendered from integer minor units, status, payment state, fulfillment state, and created timestamp. Filtering covers status, payment state, fulfillment state, date range, customer, and payment method. Sorting defaults to most recent. Bulk selection supports bulk fulfillment and bulk status change where legal for the transitions in scope. The list is mobile-first and uses the shared empty, loading, and error patterns delivered in Session one.

The order detail surface presents the full order: customer context drawn from the customer-context bridge, line items with product and variant identity and per-item totals in minor units, applied discounts, applied taxes computed from the site's tax configuration rather than hardcoded, shipping information, payment history, refund history, fulfillment history, any linked conversation, and any automation events the order has already emitted. The detail surface allows the authorized portal user to progress fulfillment, record shipment information, issue a partial or full refund where permitted by the payment method and the platform policy, add an internal note that is never delivered to the customer, and create a linked conversation from the order.

All reads and writes in both surfaces flow through the portal data access layer, extended with an orders namespace. No raw admin-client reads from portal code are permitted for orders. Writes are gated on the orders permission, and the site-level tenancy check is enforced for every order, every line item, every refund, and every fulfillment record.

### 4.2 Portal Products, Variants, and Inventory with Low-Stock Alerts

The portal gains a products surface with creation, edit, deletion, variant management, inventory adjustment, and pricing. Products and variants render and persist every monetary field in integer minor units, with the site's currency resolved from the locale configuration. The surface supports image management through the existing media pipeline, category assignment, tag assignment, and publish state. Bulk actions cover publish, unpublish, price change within a guard rail, and inventory adjustment.

Low-stock alerts are a first-class surface of this session. A product or variant whose on-hand inventory falls below a threshold produces a low-stock notification routed through the per-recipient orchestrator to portal users with the products permission, and separately produces a low-stock row in a dedicated portal alerts feed. The threshold is configurable per product and has a site-level default. Low-stock alerts respect per-event preferences delivered in Session two and are logged through the structured send log.

Reads and writes flow through the portal data access layer's products namespace, which is added in this session. Tenancy checks apply to every product, every variant, every inventory row, and every alert.

### 4.3 Portal Storefront Customers List and Detail

The portal gains a storefront customers surface scoped to the currently selected site. A client team member sees a list of customers with identity, contact, total orders, lifetime value in the site's currency rendered from integer minor units, last order timestamp, and tags. The detail surface presents customer contact, order history, quote history, booking history where applicable, linked conversations, and any CRM notes the CRM module has produced.

This surface is explicitly storefront customers, not CRM contacts. The CRM module remains the authoritative owner of agency-side contact records. The customers surface reads CRM data through a read-only context bridge for display purposes only. No customer edit in this session mutates CRM records.

Reads flow through the portal data access layer's customers namespace. Tenancy checks apply to every customer and every historical record associated with that customer.

### 4.4 Portal Quotes Builder, Amendments, Acceptance, and Conversion

The portal gains a quotes surface with a quote builder that composes line items from the product catalog or free-form entries, applies discounts, applies taxes computed from the site's tax configuration, computes totals in integer minor units, and attaches customer identity. The surface supports quote send, quote amendment with a full history of prior revisions, quote acceptance by the customer recorded from the portal on the customer's behalf where the workflow requires it, quote rejection, and quote conversion to order or to invoice.

The storefront customer view of a quote, if one exists today, is not modified by this session. The portal-side builder respects the existing quote storage model and extends its write paths with portal authorization and audit.

Reads and writes flow through the portal data access layer's quotes namespace, which is added in this session. Every send from the portal uses the branded email pipeline keyed to the site identifier. Every write emits a portal action event as specified in section 4.8.

### 4.5 Portal Bookings Calendar, Appointment Lifecycle, Services, and Availability

The portal gains a bookings surface for service businesses. The primary view is a calendar, scoped to the currently selected site, with day, week, and month layouts. The calendar shows appointments with customer identity, service, staff assignment, and status. Clicking an appointment opens the appointment detail surface, with lifecycle transitions for scheduling, confirming, rescheduling, checking in, completing, no-showing, and cancelling, each of which is permission-gated and audited.

The surface also exposes the service catalog and the staff roster as configurable, within the existing booking storage model, and the availability window as editable per staff and per service where the existing model supports it. The calendar respects time zone as defined in the site's locale configuration.

Reads and writes flow through the portal data access layer's bookings namespace, which is added in this session. Every lifecycle transition emits a portal action event. Every customer-facing confirmation or reminder uses the branded email pipeline keyed to the site identifier and runs through the orchestrator with preference respect.

### 4.6 Payment Proof Approval with Bulk Actions

The portal gains a payment proof approval surface. For sites that accept manual payment proof uploads, a client team member with the orders permission sees a queue of submitted proofs with customer identity, order or invoice reference, amount in minor units, uploaded file or image, submitted timestamp, and any submitter note. The surface supports approval, rejection with a reason, and bulk approval of a selected subset. Approval and rejection are audited, emit portal action events, and trigger the appropriate customer-facing notification through the orchestrator.

Bulk actions in this surface are a first-class feature, not an afterthought. A reviewer must be able to select many proofs and approve or reject them in one operation, with a confirmation summary that lists the affected orders or invoices and their totals, and with a single audit entry per bulk operation that references each proof by identifier. Bulk writes must be transactional at the proof level so that a partial failure is reported cleanly rather than leaving the queue in a mixed state.

Reads and writes flow through the portal data access layer's payments namespace, which is added in this session.

### 4.7 Minor-Unit Math Correctness Across Every Surface

Every monetary value on every surface introduced or modified by this session reads from and writes to integer minor units, renders through the locale configuration, and never performs floating-point arithmetic on money. Aggregations, totals, subtotals, discounts, taxes, shipping, and refunds are computed in minor units and converted at the presentation boundary only.

The agent executing this session treats minor-unit drift as a P0 defect. If any existing helper or component displays a decimal by dividing an integer by one hundred in JavaScript, the helper or component is replaced with the locale-aware formatter for the duration of this session, on every path the session touches. The change is additive on paths the session does not touch; this session is not a global audit of minor-unit correctness, but any path it touches must leave the repository better than it found it on this dimension.

A regression test confirms that an order with a discount and a multi-jurisdictional tax resolves to the same integer total regardless of the order the line items and discounts were entered, and that the same order rendered through the locale formatter produces the same string regardless of which surface rendered it. A currency formatting snapshot test confirms no surface on the portal ever displays a currency symbol that was not resolved from the locale configuration.

### 4.8 Portal Action Event Emission for Every Commerce Write

Every commerce write introduced by this session emits an event into the existing automation event log with a documented payload shape. Specific actions that must emit events include: order created, order status changed, order fulfilled, shipment recorded, refund issued, order cancelled, product created or updated, variant created or updated, inventory adjusted, low-stock threshold crossed, quote created, quote sent, quote amended, quote accepted, quote rejected, quote converted, booking created, booking rescheduled, booking confirmed, booking checked in, booking completed, booking no-showed, booking cancelled, payment proof submitted from the portal on the customer's behalf where applicable, payment proof approved, and payment proof rejected.

The automation module does not need to gain any new consumer in this session. Existing workflows pointed at these events must fire correctly. The session handoff note records the full list of events emitted, their payload shape, and a note on whether each event existed prior to this session or is introduced by it.

---

## 5. Module Areas Touched

Orders, for list, detail, fulfillment, shipment, refund, and internal-note creation. Products, for catalog, variants, inventory, and low-stock alerts. Storefront customers, for list and detail. Quotes, for builder, amendment, acceptance, rejection, and conversion. Bookings, for calendar, appointment lifecycle, services, staff, and availability. Payments, for payment proof approval. CRM, read-only, for the customer context bridge on orders and customers detail. Portal foundation, for extending the portal data access layer with orders, products, customers, quotes, bookings, and payments namespaces, and for extending the audit log writer with new actions. Branded email pipeline, for commerce customer-facing emails keyed to the site identifier. Business notifications orchestrator, for the new commerce events. Automation, for the new portal-originated commerce events.

Live chat, internal notes, canned responses, departments, routing, Chiko AI transparency and fallback and per-site disable, notification inbox, notification preferences, structured send log, email delivery webhook, email retry policy, and realtime subscription scope audit are not rebuilt by this session. Their contracts are consumed as delivered by Session two.

Invoicing, marketing, CRM write paths, blog, media, SEO, forms, domains, and business email are not touched by this session.

---

## 6. Key Risks and Mitigations

Agency dashboard regression from shared component edits. Mitigated by treating every shared ecommerce or booking component as an agency-first contract, forking into a portal-specific wrapper where portal behavior must differ, and adding an explicit regression check on the agency surface for every shared component edited.

Minor-unit drift. Mitigated by the minor-unit regression test specified in section 4.7, by the refusal to introduce any new floating-point money helper, and by treating a decimal money literal anywhere in a changed file as a merge-blocking defect.

Storefront regression. Mitigated by confining portal-side changes to portal-side surfaces and the portal data access layer, by leaving the customer-facing storefront pages untouched unless a shared component demands a coordinated change, and by running the existing storefront smoke tests at the completion gate.

Quote regression. Mitigated by preserving the existing quote storage model and customer-facing view, by making the portal quote builder purely a writer into that model, and by a test that confirms a quote created from the portal renders identically on the customer-facing view to a quote created from the agency side.

Payment proof flow regression. Mitigated by a test that confirms the customer-facing proof submission endpoint continues to behave identically after the portal approval surface ships, by auditing every approval and rejection, and by a bulk-action test that confirms partial-failure semantics match the specification in section 4.6.

Linked conversation creation regression. Mitigated by routing any conversation creation from a commerce surface through the conversations namespace delivered in Session two, by tenancy checks on the site and client identifiers at creation time, and by a test that confirms an order-linked conversation appears in the portal live chat inbox under the correct site.

Paddle confusion with per-site payments for sellers. Mitigated by an explicit rule that this session treats Paddle as platform billing only and does not implement any per-site seller Paddle integration. Portal commerce in this session operates against the existing ecommerce payment surfaces including manual payment proof; per-site seller Paddle onboarding is explicitly future work and is not introduced here.

Orchestrator and send-log regression under commerce load. Mitigated by a targeted load check that exercises a representative burst of commerce events through the per-recipient orchestrator and confirms the send log records one structured row per recipient-channel attempt.

Realtime leak under commerce load. Mitigated by reusing the tenant-scoped subscriptions audited in Session two, by refusing to introduce any broader subscription in this session, and by an additional realtime leak test on at least one commerce subscription if this session introduces any.

Impersonation drift in commerce writes. Mitigated by an explicit rule that every commerce write performed under impersonation records the impersonator identity on the audit entry, uses the impersonated user as the acting recipient for any follow-up notification, and never routes a customer-facing email under the impersonator's identity.

Regression in Session one or Session two. Mitigated by running the Session one and Session two test suites as part of this session's completion gate.

---

## 7. Success Criteria

A client team member with the appropriate permissions operates orders, products, customers, quotes, bookings, and payment proofs end to end on mobile and on desktop. Minor-unit math is correct on every surface touched. Every commerce write emits an automation event that an existing workflow can observe.

A client team member without a given permission sees no data on the corresponding surface and is audited for any attempt. The five-layer internal-note safety delivered in Session two remains intact under every commerce surface that creates an internal note.

Every commerce customer-facing email uses the branded pipeline keyed to the site identifier and runs through the per-recipient orchestrator with preference respect. Low-stock alerts are delivered through in-app, email, and push where permitted and are logged through the structured send log.

Payment proof approval supports bulk actions with the specified partial-failure semantics. Every approval and rejection is audited and emits an automation event.

Every surface touched respects the tenant-scoped realtime subscription model. Tenancy isolation holds across orders, products, customers, quotes, bookings, payments, and linked conversations.

TypeScript compiles cleanly for every file changed. The Session one and Session two test suites still pass. New vitest tests cover the orders tenancy paths, the products low-stock path, the quotes conversion path, the bookings lifecycle, the payment proof bulk-action path, and the minor-unit regression path.

---

## 8. Validation Checklist

The agent confirms every item below before closing the session. Each item is verified against a running branch deployed to a preview environment through the Vercel MCP.

Tenancy isolation suite reruns and passes, extended for commerce. A portal user from one tenant cannot read any order, any product, any storefront customer, any quote, any booking, any payment proof, any inventory row, any low-stock alert, any refund, any fulfillment record, or any audit row from another tenant. A portal user from one client cannot read data from another client on the same agency. A portal user cannot read data for a site within their own client when their site-level access excludes it.

Minor-unit invariants hold. The currency formatter is the only path to a rendered money string on portal commerce surfaces. An order with a discount and a multi-jurisdictional tax resolves to a single integer total regardless of entry order. An amount displayed on a list view matches the amount displayed on the detail view for the same record byte for byte when rendered through the formatter.

Automation event emission holds. Every commerce write specified in section 4.8 emits an event, and a staging workflow pointed at one of the new emissions fires.

Low-stock alerts hold. A simulated stock adjustment crossing the threshold produces an in-app record, a send log row per channel, an automation event, and a row in the portal alerts feed.

Payment proof bulk actions hold. A simulated bulk approval containing a deliberate failure reports a clean partial-failure summary, audits each approved proof, and leaves the failed proofs in the queue with a recorded failure reason.

Booking lifecycle holds. Each lifecycle transition produces an audit entry, an automation event, and, where customer-facing, a branded email run through the orchestrator.

Quote conversion holds. A quote created on the portal, accepted from the customer-facing view, and converted from the portal produces an order or invoice identical to the one the agency-side flow produces for the same inputs.

Session one and Session two tests still pass. New commerce tests pass. TypeScript compiles. Vercel preview build succeeds. Supabase advisors produce no new warnings on the tables modified in this session.

---

## 9. Completion Gates

The agent does not declare the session complete until every gate below is met.

Every migration introduced by this session has been applied through the Supabase MCP against project nfirsqmyxmmtbignofgb, on staging first and verified, before any production application. The agent reports the applied migration names in the session handoff note.

Every new vitest test and every modified vitest test passes in the repository. The Session one and Session two tests continue to pass. The agent reports test counts.

Every commerce surface introduced or modified by this session routes its reads and writes through the portal data access layer. The agent reports the namespaces added and a short query plan confirming no portal surface calls the admin Supabase client directly for commerce data.

`memory-bank/activeContext.md` is updated to reflect the Session three deliverables and the shift of active focus from communication to commerce. `memory-bank/progress.md` is updated with the commerce workstream state. `next-platform-dashboard/docs/PORTAL-FOUNDATION.md` is extended with the Session three contracts: the orders, products, customers, quotes, bookings, and payments namespaces on the portal data access layer, the list of portal-originated commerce events with their payload shape, the minor-unit invariants enforced on portal commerce surfaces, and the updated Session-N checklist for later authors.

The master brief `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md` is not edited unless something discovered during implementation contradicts what it says, in which case the contradicting section is updated in place and the change is noted in the session handoff.

---

## 10. Agent Operating Context

This section restates the operating contract from Section 17 of the master brief in the form that applies to Session three specifically. The authoritative version lives in the master brief and is the one to consult in case of ambiguity.

The agent executing this session has full access to the Supabase MCP against project nfirsqmyxmmtbignofgb, to the Vercel MCP, to the Cloudflare MCP, to the Context7 MCP, and to the Paddle MCP. The agent has workspace file system access, terminal access, and the ability to run vitest, playwright, tsc, and pnpm scripts.

Every migration introduced by this session is applied by the agent through the Supabase MCP. The agent does not produce a dot-sql file for the user to paste into the Supabase SQL editor. The agent may record the migration in the migrations folder for version history; it still applies the migration itself.

Every authentication or role change, should any be required by this session, is performed by the agent through the Supabase admin REST API. The agent does not ask the user to create auth users, reset passwords, or link identifiers.

Every seed or backfill required by this session is produced and run by the agent against the staging database. The agent does not ask the user to execute a script.

Every deployment verification is performed by the agent through the Vercel MCP. Every documentation lookup for libraries or framework behavior is performed by the agent through the Context7 MCP where the agent's training data may be stale.

Destructive production actions, and only those, require explicit user confirmation before execution. For this session, a destructive production action would include, for example, dropping or truncating a production orders or bookings table, bulk-refunding in production, bulk-cancelling bookings in production, or force-merging a commerce schema change in a way that discards existing records. If such an action becomes necessary, the agent prepares the full change, explains the blast radius, asks the user to confirm, and then executes the action itself rather than handing a command to the user.

The rule, restated in one line for emphasis: nothing in this session is handed back to the user for manual execution. Everything needed to ship Session three is provided to the agent.

---

## 11. Handoff to Session 4

Session four receives a portal that can communicate reliably, observe its own communication, and run the economic center of a client business end to end on mobile and on desktop. Orders, products, storefront customers, quotes, bookings, and payment proofs work, minor-unit math is correct, portal-originated commerce events emit into automation, and the orchestrator and send log carry commerce traffic without regression.

Session four builds operations on top of this: invoicing from the portal including payments and statements and credits, CRM write paths from the portal, marketing list and campaign surfaces within the portal's permission model, and the business email pipeline surfaced for client visibility. Session four must not introduce a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, a new logging mechanism, or a new commerce mechanism. If session four finds itself tempted to, it means a prior session is incomplete and must be reopened before session four proceeds.

The session handoff note produced by the agent at the end of Session three summarizes: which migrations were applied and on which environments, which tests were added and which counts pass, which namespaces are now present on the portal data access layer, which commerce events are now emitted from portal actions with their payload shape, which realtime subscriptions were added or narrowed if any, which memory bank files were updated, and which open items, if any, are explicitly deferred to Sessions four through six with a reason and a target session.

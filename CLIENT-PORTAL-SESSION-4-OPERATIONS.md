# DRAMAC Client Portal — Session 4: Operations

**Document type:** Single-session implementation brief. Hand this document, together with `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md`, to the AI agent executing Session four.
**Audience:** One AI agent, working from a fresh context, with full MCP and tool access as defined in Section 17 of the master brief.
**Constraint:** Prose only. No code, SQL, pseudo-code, schema diffs, component snippets, or command lines appear anywhere in this file. The agent is responsible for translating the requirements below into the correct implementation.
**Working rule:** Read the master brief end to end. Read this session brief end to end. Read `memory-bank/activeContext.md`, `memory-bank/systemPatterns.md`, and `memory-bank/progress.md`. Read the foundation note at `next-platform-dashboard/docs/PORTAL-FOUNDATION.md`, including the Session 2A appendix on the send log and orchestrator dispatch model, and the Session 3 appendix on the commerce data access namespaces, payment-proof JSON schema, commerce events, and minor-unit invariants. Read `CLIENT-PORTAL-SESSION-1-FOUNDATION.md`, `CLIENT-PORTAL-SESSION-2-COMMUNICATION.md`, and `CLIENT-PORTAL-SESSION-3-COMMERCE.md` for the contracts the operations session must consume without reinventing. Then plan the session before editing any file.

---

## 1. Starting State

Sessions one, two, and three have shipped. The portal shell, the site switcher, the permission resolver, the portal data access layer, the portal audit log, the shared pattern primitives, the baseline dashboard, and the foundation documentation are in place from Session one. The communication layer is in place from Session two: a portal live chat inbox and conversation detail with five-layer internal-note safety; a Chiko AI transparency, fallback, and per-site disable surface; a portal-first notifications inbox; per-event and per-site notification preferences; a per-recipient orchestrator keyed to user identifier; structured logging across in-app, email, push, AI, and workflow channels; an email delivery webhook with a bounded retry policy; and a realtime subscription scope audit recorded in the foundation note. The commerce data access layer is in place from Session three: six namespaces on the portal data access layer for orders, products, storefront customers, quotes, bookings, and payments; canonical commerce events emitted into the automation event log with money in integer minor units; a portal-first payment proof approval surface with bulk actions and partial-failure semantics; and a Session 3 appendix in the foundation note documenting the commerce contracts. Twenty-eight portal vitest tests pass. TypeScript compiles cleanly across the dashboard.

One carryover is explicitly open from Session three and must be acknowledged by Session four. The portal routes at `/portal/sites/[siteId]/orders`, `/products`, `/customers`, `/quotes`, and `/bookings` still mount the shared agency ecommerce dashboard inside a portal provider rather than presenting portal-first list and detail surfaces. The commerce data access layer exposes the read and write paths those surfaces require, but the surfaces themselves have not yet been rebuilt in the portal-first shell. Session four does not close this carryover wholesale, because operations is already a large surface on its own. Session four is permitted, and in most cases required, to build its own portal-first list and detail surfaces for invoicing, CRM, marketing, and support within the portal shell, and must not regress the agency-side commerce dashboards while doing so. The commerce portal-first surface upgrade remains open and is handed to Session six as part of the final polish gate if Session four does not absorb it incidentally.

The operations systems of the platform, as they stand before this session, are mature on the agency side and partially integrated on the portal side. Invoicing has invoices, payments, credit notes, recurring invoices, expenses, vendors, bills, reports, statements, and an online payment flow for storefront-style customers. CRM has contacts, companies, deals, activities, segmentation, and a lifecycle view. Marketing has lists, campaigns, segments, a sequence engine, and a per-site email editor, with the MKT-11 slice already reframed for client visibility. Support has a ticketing surface with conversations and status lifecycle. Paddle is the only platform billing provider; Stripe is forbidden anywhere inside platform billing; invoicing uses its own payment surfaces including manual payment proof and per-site provider connections, and must never be conflated with platform billing. The branded email pipeline keyed to the site identifier and the legacy platform comms pipeline remain strictly separate. The Zambia-first locale, integer minor unit money model, Africa/Lusaka time zone, and 16 percent VAT default remain in force.

Session four closes the operations gap on the portal side so that every operations surface a client team member uses every working day is permission-gated, branded, mobile-first, observable, and tenancy-safe inside the new portal shell.

---

## 2. Objective

Deliver a portal-first operations experience that a client team member can actually run the back office of a business from, and do it without introducing a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, a new logging mechanism, or a new commerce mechanism. Concretely: a portal invoicing surface covering invoices, payments, credit notes, recurring invoices, expenses, vendors, bills, reports, statements, and the online payment flow for the client portal customer experience; a portal CRM surface covering contacts, companies, deals, activities, and segmentation with full write paths gated by the CRM permission; a portal marketing surface covering lists, segments, campaigns, sequences, subscribers, and templates within the portal's permission model and with all supplier branding hidden; a portal support surface covering tickets, conversations, status lifecycle, and linked commerce or invoicing records; and a portal surface on the platform communication pipeline that gives a client team member visibility into the branded emails and notifications dispatched on behalf of their sites without exposing any supplier brand.

This session ships the back-office surface area that operations teams spend their time on. It must consume the Session one permission, data access, audit, and shell contracts; the Session two orchestrator, send log, webhook, retry, preferences, and inbox contracts; and the Session three commerce data access, commerce events, and minor-unit contracts exactly as delivered, without reinvention.

---

## 3. Why This Session Comes Now

Operations surfaces depend on commerce data. Invoicing consumes orders and payments; statements consume order history and invoice history together; CRM activity links to conversations, orders, quotes, bookings, and deals; marketing lists and segments consume customer records, order history, and engagement signals; support links to orders, invoices, and conversations. Building operations before commerce would force operations to mock or stub the data model it needs. Now that commerce is wired through the portal data access layer with correct minor-unit math and observable events, operations can build directly on top of the same contracts.

Operations also has the heaviest money pipeline on the platform after commerce. Invoicing, recurring invoicing, credit notes, refunds, statements, and expense entry must every one of them enforce integer minor unit arithmetic and locale-aware rendering. The minor-unit invariants documented in the Session 3 appendix apply to every surface in this session, unchanged. If any invoicing or statement surface renders money by dividing an integer by one hundred in JavaScript, it is repaired in place on the paths this session touches.

Operations is the last session that can realistically uncover a flaw in the permission model or in the per-recipient orchestrator before the content and infrastructure session hardens those systems for whole-module white-label. A flaw surfaced in Session four is cheaper to repair than the same flaw surfaced in Session five or Session six.

---

## 4. Focus Areas

### 4.1 Portal Invoicing: List, Detail, Lifecycle, and Linked Payments

The portal gains a first-class invoicing surface. A client team member with the invoicing permission sees, for the currently selected site, an invoices list with invoice number, customer identity, issue date, due date, status, total in integer minor units rendered through the locale formatter, and an at-a-glance indicator for outstanding balance. Filtering covers status, payment state, customer, date range, and overdue flag. Sorting defaults to most recent. Bulk selection supports bulk send, bulk mark as paid where legal, and bulk void where legal.

The invoice detail surface presents the full invoice: customer context drawn from the storefront customer namespace or the CRM contact bridge depending on the invoice origin, line items with per-item totals in integer minor units, applied discounts, applied taxes computed from the site's tax configuration rather than hardcoded, shipping where applicable, payment history, credit note history, refund history, any linked order, any linked quote, any linked support ticket, any linked conversation, and any automation events the invoice has emitted. The detail surface allows the authorized portal user to progress status, record a payment, record a partial payment, record a refund, issue a credit note, void the invoice, clone the invoice, resend the invoice over email, download the invoice as PDF, and add an internal note that is never delivered to the customer.

All reads and writes flow through an invoicing namespace on the portal data access layer. If an invoicing namespace does not yet exist, this session adds it in the same shape as the commerce namespaces from Session three. Tenancy checks apply to every invoice, every line item, every payment, every credit note, every refund, and every linked record. Writes are gated on the invoicing permission.

### 4.2 Portal Recurring Invoices, Expenses, Vendors, Bills, Reports, and Statements

The portal gains surfaces for the rest of the invoicing module as it already exists on the agency side. Recurring invoices expose their schedule, next generation date, pause, resume, generate-now, and edit paths. Expenses, vendors, and bills expose their list and detail with the same minor-unit invariants as invoices. Reports reuse the agency report generators through a read-only context bridge and render inside the portal shell with the portal shell's loading, empty, and error patterns. Statements for a customer render the combined invoice, payment, credit note, and, where relevant, commerce order history over a selectable date range with a single integer balance carried through minor units, rendered through the locale formatter, and offered as a PDF download through the branded email pipeline keyed to the site identifier when sent from the portal.

Reads and writes for these surfaces flow through the portal data access layer's invoicing namespace introduced in focus area 4.1. Tenancy checks apply to every record. Writes are gated on the invoicing permission. Reports never leak a supplier name or a platform operational detail; they render data only.

### 4.3 Portal Online Payment Flow for the Client Portal Customer Experience

The portal surfaces the online payment flow that a customer of the client uses to pay an invoice. The flow is the client's customer experience, not the client team member's experience, but the portal owns its configuration visibility and its operational view. The portal invoicing surface allows the authorized portal user to inspect the online payment state for an invoice, reissue the payment link, cancel the payment intent where permitted, and see the per-attempt history including declined attempts and retry outcomes.

The online payment providers used here are the invoicing providers that already exist on the agency side. Paddle is the platform billing provider and is not introduced into per-invoice customer payment in this session. Stripe must not appear anywhere in this flow. Manual payment proof remains a supported path and is handled through the commerce payments namespace delivered in Session three.

All reads and writes flow through the invoicing namespace. Every online payment event emits the same structured send log and automation events that the agency side emits today, with tenancy checks applied at every read.

### 4.4 Portal CRM: Contacts, Companies, Deals, Activities, and Segmentation

The portal gains a full CRM surface with write paths. A client team member with the CRM permission sees, for the currently selected site or for a cross-site view where the permission and the site switcher allow it, a contacts list, a companies list, a deals pipeline, an activities feed, and a segmentation workspace. Each list supports filtering, sorting, saved views, bulk edits, and bulk tagging. Detail surfaces present the full record with linked records from commerce, invoicing, and support.

Write paths include create, edit, delete, merge, reassign, and convert. Activity creation from the portal supports notes, calls, meetings, tasks, and emails, with the email path running through the branded email pipeline keyed to the site identifier and through the per-recipient orchestrator with preference respect. Deal lifecycle transitions are audited and emit portal action events.

A CRM namespace on the portal data access layer carries these reads and writes. Tenancy checks apply to every contact, every company, every deal, every activity, every segment, and every linked record. Writes are gated on the CRM permission. The customer context bridge that Session three used for read-only linkage from commerce into CRM is promoted in this session into a read-write contract where the CRM permission permits, and the CRM remains the authoritative owner of agency-side contact records.

Dual-write conflicts with storefront customer records introduced in Session three are avoided by a single written rule: the CRM contact is authoritative for CRM-originated fields; the storefront customer is authoritative for commerce-originated fields; a conflict resolution path prefers CRM for identity, preference, and consent data and prefers commerce for order, payment, and fulfillment data. This rule is written into the Session 4 appendix of the foundation note.

### 4.5 Portal Marketing: Lists, Segments, Campaigns, Sequences, Subscribers, Templates

The portal gains a full marketing surface inside the portal shell with the portal's permission model. A client team member with the marketing permission sees lists, segments, campaigns, sequences, subscribers, and templates each as a first-class surface with list, detail, and lifecycle actions. Campaign send is gated on the marketing permission, requires a confirmation step, and runs through the branded email pipeline keyed to the site identifier. Sequences are operated, paused, resumed, and retired from the portal. Template editing uses the existing email editor inside the portal shell.

Consent and preference handling is a P0 correctness concern. A send from the portal respects the subscriber's consent state and the per-event preference delivered in Session two. A consent downgrade by a subscriber must not be overwritten by a portal write. Segmentation rules must not leak data across tenants, across clients on the same agency, or across sites on the same client where the portal user's site access excludes a site. The marketing namespace on the portal data access layer enforces these boundaries.

All supplier branding is hidden on every marketing surface. A client team member sees the marketing feature; they do not see the underlying provider. Reports and campaign metrics use the agency-side computations through a read-only bridge where the compute is heavy and are rendered through the portal shell.

### 4.6 Portal Support: Tickets, Conversations, Status Lifecycle, Linked Records

The portal gains a support surface inside the portal shell. A client team member with the support permission sees tickets list, ticket detail, status lifecycle, assignment, and SLA state. A ticket links to orders, invoices, and conversations where those exist. Conversation creation from a ticket runs through the conversations namespace delivered in Session two. Ticket notifications route through the per-recipient orchestrator with preference respect and log through the structured send log.

A support namespace on the portal data access layer, or an extension of the support service already present on the portal, carries these reads and writes. Tenancy checks apply to every ticket, every linked record, and every SLA row. Writes are gated on the support permission.

### 4.7 Portal Visibility into the Business Communication Pipeline

The portal gains a visibility surface over the communication pipeline that dispatches branded emails and notifications on behalf of the client's sites. This surface is not the business email product, which is Session five scope. This surface is an operations view that lets a client team member inspect the send log entries for their own sites, see delivery state, see bounce and complaint state, see retry history, and filter by recipient, by template key, by event type, and by date range. The surface reuses the Session 2 send log and the Session 2 delivery webhook without modification.

All supplier branding is hidden. The surface exposes the client-meaningful fields only. Tenancy checks apply to every log entry. Reads flow through the send log query path already present from Session two, extended with the portal filters required for this surface.

### 4.8 Portal Action Event Emission for Every Operations Write

Every operations write introduced or extended by this session emits an event into the existing automation event log with a documented payload shape. Specific actions that must emit events include: invoice created, invoice sent, invoice status changed, invoice voided, invoice cloned, payment recorded, payment updated, payment deleted, refund recorded, credit note issued, recurring invoice created or updated, recurring invoice paused, recurring invoice resumed, recurring invoice generated, expense created or updated, vendor created or updated, bill created or updated or paid, statement generated or sent, CRM contact created or updated or merged or deleted, CRM company created or updated, deal stage changed or won or lost, CRM activity logged, segment created or updated, marketing list created or updated or archived, campaign created or sent or paused or duplicated, sequence created or started or paused or resumed or retired, subscriber consent changed, template created or updated or archived, support ticket created or assigned or status-changed or closed, and portal-initiated resend of a branded email.

The automation module does not need to gain any new consumer in this session. Existing workflows pointed at these events must fire correctly. The session handoff note records the full list of events emitted, their payload shape, and a note on whether each event existed prior to this session or is introduced by it.

---

## 5. Module Areas Touched

Invoicing, for list, detail, lifecycle, recurring, expenses, vendors, bills, reports, statements, online payment flow, and the portal customer experience surface of online payment. CRM, for contacts, companies, deals, activities, and segmentation with full write paths. Marketing, for lists, segments, campaigns, sequences, subscribers, and templates within the portal permission model. Support, for tickets, conversations, status lifecycle, and linked records. Send log, read-only from the portal, for the operations visibility surface. Portal foundation, for extending the portal data access layer with invoicing, CRM, marketing, and support namespaces and for extending the audit log writer with operations actions. Branded email pipeline, for invoicing, CRM, marketing, support, and statement customer-facing sends keyed to the site identifier. Business notifications orchestrator, for the operations events. Automation, for the new portal-originated operations events.

Live chat, internal notes, canned responses, departments, routing, Chiko AI surfaces, notification inbox, notification preferences, structured send log primitive, email delivery webhook, email retry policy, and realtime subscription scope audit are not rebuilt by this session. Their contracts are consumed as delivered by Session two.

Orders, products, storefront customers, quotes, bookings, payment proofs, commerce events, and minor-unit formatter are not rebuilt by this session. Their contracts are consumed as delivered by Session three. The deferred commerce portal-first UI upgrade is not in scope unless incidentally absorbed.

Blog, media, SEO, forms, domains, business email product, and apps directory are not touched by this session.

---

## 6. Key Risks and Mitigations

Agency invoicing regression. Mitigated by treating every shared invoicing component as an agency-first contract, forking into a portal-specific wrapper where portal behavior must differ, and adding an explicit regression check on the agency-side invoicing dashboard for every shared component edited.

Invoicing minor-unit drift. Mitigated by reusing the locale-aware formatter from Session three as the only path to a rendered money string on portal invoicing surfaces, by refusing to introduce any new floating-point money helper, and by a minor-unit regression test that covers a multi-line invoice with a discount and a multi-jurisdictional tax and confirms the integer total is stable across list and detail renders.

Paddle and invoicing conflation. Mitigated by an explicit rule, written into the Session 4 appendix of the foundation note, that Paddle is platform billing only, that invoicing uses its own per-site providers, and that no code path in this session routes an invoice payment through Paddle or a platform-billing handler.

Stripe resurfacing in invoicing. Mitigated by a lint-level check on the session's changed files that flags any mention of a Stripe identifier, a Stripe key, or a Stripe URL in portal invoicing code. Any hit is treated as a merge-blocker.

CRM dual-write conflicts with the storefront customer namespace from Session three. Mitigated by the authoritative-owner rule in focus area 4.4 and by a test that creates a customer on the storefront, edits the corresponding contact on the portal CRM, and confirms that no field is silently reverted on either side.

Marketing consent leak. Mitigated by a test that downgrades consent on a subscriber, attempts a portal send to that subscriber, and confirms the send is skipped at the orchestrator layer and logged with the consent-skip reason in the send log.

Marketing supplier brand leak. Mitigated by a render audit that confirms no supplier name, no supplier logo, and no supplier URL appears on any marketing surface rendered inside the portal shell.

Business communication visibility surface scope creep. Mitigated by an explicit rule that this surface is read-only over the send log delivered in Session two and that it does not introduce a new log, a new dispatch, a new retry, or a new template path.

Impersonation drift in operations writes. Mitigated by an explicit rule that every operations write performed under impersonation records the impersonator identity on the audit entry, uses the impersonated user as the acting recipient for any follow-up notification, and never routes a customer-facing email under the impersonator's identity.

Support ticket regression. Mitigated by preserving the existing support service contract and by routing portal support writes through the portal data access layer and the audit log. A regression test confirms tickets raised before Session four remain visible and operable after Session four ships.

Realtime leak under operations load. Mitigated by reusing the tenant-scoped subscriptions audited in Session two, by refusing to introduce any broader subscription in this session, and by an additional realtime leak test on at least one operations subscription if this session introduces any.

Orchestrator and send log regression under operations load. Mitigated by a targeted load check that exercises a representative burst of invoicing, CRM, marketing, and support events through the per-recipient orchestrator and confirms the send log records one structured row per recipient-channel attempt.

Regression in Session one, Session two, or Session three. Mitigated by running all three prior test suites as part of this session's completion gate.

Deferred commerce portal-first UI carryover. Mitigated by acknowledging the carryover in the starting state, by accepting any incidental absorption of it during this session if it naturally falls out of operations work, and by explicitly handing the residual to Session six as a polish-gate item if this session does not fully absorb it. Under no circumstance does this session regress the agency-side ecommerce dashboard while chasing the carryover.

---

## 7. Success Criteria

A client team member with the appropriate permissions operates invoicing, CRM, marketing, and support end to end on mobile and on desktop. Minor-unit math is correct on every operations surface touched. Every operations write emits an automation event that an existing workflow can observe.

A client team member without a given permission sees no data on the corresponding surface and is audited for any attempt. The five-layer internal-note safety delivered in Session two remains intact under every operations surface that creates an internal note.

Every operations customer-facing email uses the branded pipeline keyed to the site identifier and runs through the per-recipient orchestrator with preference respect. The business communication visibility surface reads the send log for the user's sites only, with tenancy checks applied on every row.

CRM write paths do not silently overwrite storefront customer fields owned by the commerce namespace, and vice versa. Marketing sends respect consent and preference. No supplier brand is visible on any operations surface rendered inside the portal shell.

Paddle is not invoked for any invoicing payment in this session. Stripe does not appear anywhere in invoicing code in this session. The invoicing module uses its own per-site providers exactly as the agency side already does.

Every surface touched respects the tenant-scoped realtime subscription model. Tenancy isolation holds across invoices, payments, credit notes, recurring invoices, expenses, vendors, bills, reports, statements, CRM records, marketing records, support tickets, and linked conversations.

TypeScript compiles cleanly for every file changed. The Session one, Session two, and Session three test suites still pass. New vitest tests cover the invoicing tenancy paths, the invoicing minor-unit regression, the CRM dual-write conflict resolution, the marketing consent leak path, the marketing supplier brand render audit, the support ticket tenancy path, and the business communication visibility tenancy path.

---

## 8. Validation Checklist

The agent confirms every item below before closing the session. Each item is verified against a running branch deployed to a preview environment through the Vercel MCP.

Tenancy isolation suite reruns and passes, extended for operations. A portal user from one tenant cannot read any invoice, any payment, any credit note, any recurring invoice, any expense, any vendor, any bill, any report, any statement, any CRM contact, any CRM company, any deal, any activity, any segment, any marketing list, any campaign, any sequence, any subscriber, any template, any support ticket, any SLA row, or any send log entry from another tenant. A portal user from one client cannot read data from another client on the same agency. A portal user cannot read data for a site within their own client when their site-level access excludes it.

Minor-unit invariants hold across operations. The currency formatter is the only path to a rendered money string on portal invoicing and portal statement surfaces. A multi-line invoice with a discount and a multi-jurisdictional tax resolves to a single integer total regardless of entry order. An amount displayed on a list view matches the amount displayed on the detail view for the same record byte for byte when rendered through the formatter.

Paddle and Stripe rules hold. No invoicing payment path in this session invokes Paddle. No Stripe identifier, key, or URL appears in portal invoicing code in this session.

Automation event emission holds. Every operations write specified in focus area 4.8 emits an event, and a staging workflow pointed at one of the new emissions fires.

CRM dual-write rule holds. A storefront customer updated by the commerce module is not silently overwritten by a CRM edit, and a CRM contact updated by the portal CRM is not silently overwritten by a commerce write. The authoritative-owner rule in focus area 4.4 is written into the Session 4 appendix of the foundation note.

Marketing consent and brand rules hold. A consent downgrade blocks a subsequent portal send and is logged with the consent-skip reason. No supplier brand is visible on any marketing surface rendered inside the portal shell.

Support lifecycle holds. Each lifecycle transition produces an audit entry, an automation event, and, where customer-facing, a branded email run through the orchestrator.

Business communication visibility holds. The portal user sees only send log entries for sites within their access scope and only the client-meaningful fields.

Session one, Session two, and Session three tests still pass. New operations tests pass. TypeScript compiles cleanly across the dashboard. Vercel preview build succeeds. Supabase advisors produce no new warnings on the tables modified in this session.

---

## 9. Completion Gates

The agent does not declare the session complete until every gate below is met.

Every migration introduced by this session has been applied through the Supabase MCP against project nfirsqmyxmmtbignofgb, on staging first and verified, before any production application. The agent reports the applied migration names in the session handoff note.

Every new vitest test and every modified vitest test passes in the repository. The Session one, Session two, and Session three tests continue to pass. The agent reports test counts.

Every operations surface introduced or modified by this session routes its reads and writes through the portal data access layer. The agent reports the namespaces added, the existing namespaces extended, and a short query plan confirming no portal operations surface calls the admin Supabase client directly for operations data.

`memory-bank/activeContext.md` is updated to reflect the Session four deliverables and the shift of active focus from commerce to operations. `memory-bank/progress.md` is updated with the operations workstream state. `next-platform-dashboard/docs/PORTAL-FOUNDATION.md` is extended with the Session four contracts: the invoicing, CRM, marketing, and support namespaces on the portal data access layer, the list of portal-originated operations events with their payload shape, the CRM-versus-commerce authoritative-owner rule, the Paddle-versus-invoicing separation rule, the Stripe-forbidden rule inside invoicing, the marketing consent and supplier-brand rules, the business communication visibility rule, and the updated Session-N checklist for later authors.

The master brief `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md` is not edited unless something discovered during implementation contradicts what it says, in which case the contradicting section is updated in place and the change is noted in the session handoff.

The deferred commerce portal-first UI carryover is explicitly reported in the session handoff note as either absorbed in whole, absorbed in part with the residual listed, or handed untouched to Session six. Session four is not blocked by this carryover.

---

## 10. Agent Operating Context

This section restates the operating contract from Section 17 of the master brief in the form that applies to Session four specifically. The authoritative version lives in the master brief and is the one to consult in case of ambiguity.

The agent executing this session has full access to the Supabase MCP against project nfirsqmyxmmtbignofgb, to the Vercel MCP, to the Cloudflare MCP, to the Context7 MCP, and to the Paddle MCP. The agent has workspace file system access, terminal access, and the ability to run vitest, playwright, tsc, and pnpm scripts.

Every migration introduced by this session is applied by the agent through the Supabase MCP. The agent does not produce a dot-sql file for the user to paste into the Supabase SQL editor. The agent may record the migration in the migrations folder for version history; it still applies the migration itself.

Every authentication or role change, should any be required by this session, is performed by the agent through the Supabase admin REST API. The agent does not ask the user to create auth users, reset passwords, or link identifiers.

Every seed or backfill required by this session is produced and run by the agent against the staging database. The agent does not ask the user to execute a script.

Every deployment verification is performed by the agent through the Vercel MCP. Every documentation lookup for libraries or framework behavior is performed by the agent through the Context7 MCP where the agent's training data may be stale.

Every Paddle question, should any arise, is answered through the Paddle MCP and not through guesswork. The agent confirms in writing, in the session handoff note, that no Paddle path was introduced into invoicing in this session.

Destructive production actions, and only those, require explicit user confirmation before execution. For this session, a destructive production action would include, for example, dropping or truncating a production invoices, payments, credit notes, CRM, marketing, or support table; bulk-voiding invoices in production; bulk-deleting CRM contacts in production; bulk-cancelling sequences in production; bulk-unsubscribing subscribers in production; or force-merging an operations schema change in a way that discards existing records. If such an action becomes necessary, the agent prepares the full change, explains the blast radius, asks the user to confirm, and then executes the action itself rather than handing a command to the user.

The rule, restated in one line for emphasis: nothing in this session is handed back to the user for manual execution. Everything needed to ship Session four is provided to the agent.

---

## 11. Handoff to Session 5

Session five receives a portal that can communicate reliably, observe its own communication, run the commerce center of a client business, and run the back-office operations of a client business end to end on mobile and on desktop. Invoicing, CRM, marketing, and support work, minor-unit math is correct across operations, Paddle and invoicing remain strictly separate, Stripe does not appear in invoicing, portal-originated operations events emit into automation, the orchestrator and send log carry operations traffic without regression, and a client team member has visibility into the branded email pipeline for their sites without seeing any supplier brand.

Session five builds content and infrastructure on top of this: portal-first blog authoring and scheduling under the content permission, media library under the content permission, SEO insights and a subset of SEO settings under the content permission, forms submissions management, domains management with supplier branding hidden, the business email product with supplier branding hidden, and the apps directory as a navigational hub. Session five must not introduce a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, a new logging mechanism, a new commerce mechanism, or a new operations mechanism. If session five finds itself tempted to, it means a prior session is incomplete and must be reopened before session five proceeds.

The session handoff note produced by the agent at the end of Session four summarizes: which migrations were applied and on which environments, which tests were added and which counts pass, which namespaces are now present on the portal data access layer, which operations events are now emitted from portal actions with their payload shape, which realtime subscriptions were added or narrowed if any, which memory bank files were updated, the disposition of the deferred commerce portal-first UI carryover, and which open items, if any, are explicitly deferred to Sessions five and six with a reason and a target session.

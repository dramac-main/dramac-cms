# DRAMAC Client Portal — Session 2: Communication

**Document type:** Single-session implementation brief. Hand this document, together with `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md`, to the AI agent executing Session two.
**Audience:** One AI agent, working from a fresh context, with full MCP and tool access as defined in Section 17 of the master brief.
**Constraint:** Prose only. No code, SQL, pseudo-code, schema diffs, component snippets, or command lines appear anywhere in this file. The agent is responsible for translating the requirements below into the correct implementation.
**Working rule:** Read the master brief end to end. Read this session brief end to end. Read `memory-bank/activeContext.md`, `memory-bank/systemPatterns.md`, and `memory-bank/progress.md`. Read the Session one foundation note at `next-platform-dashboard/docs/PORTAL-FOUNDATION.md`. Then plan the session before editing any file.

---

## 1. Starting State

Session one has shipped. The portal shell, the site switcher, the permission resolver, the portal data access layer, the portal audit log, the shared pattern primitives, the baseline dashboard, and the supporting tests, seed, and documentation are in place. The foundation migration has been applied. Six portal auth users are provisioned and linked. Eight portal vitest tests pass. The master brief Section 17 operating contract applies. This session does not reintroduce any of the primitives Session one delivered; it consumes them.

The communication systems of the platform, as they stand before this session, are mature on the agency side and immature on the portal side. Live chat works for agency admins but has no first-class portal experience. Internal notes are protected on the agency side by a four-layer security model that must be preserved and, where the portal is concerned, extended without regression. Chiko AI is wired as the fallback responder with transparent badges, confidence indicators, and handoff state on the agency side; the portal has not yet surfaced any of this. Canned responses, departments, and routing rules exist as agency-manageable primitives; the portal cannot yet manage them. The business notifications orchestrator routes nineteen events across in-app, email, and web push, but today its in-app records are almost entirely agency-owner centric; portal users are not yet first-class recipients. Structured logging across email, push, AI, and workflow events is partially in place; parts of the send paths still write unstructured records or no record at all. The portal notifications inbox does not exist as a client-first surface; portal users experience notifications through branded email only.

Session two closes these gaps.

---

## 2. Objective

Deliver a portal-first communication experience that a client team member can actually work a business from, and make the underlying communication pipeline reliable enough that the rest of the portal rebuild can trust it. Concretely: a working portal live chat inbox and conversation detail surface with server-enforced internal-note safety, Chiko AI transparency and a visible fallback on failure, canned responses and departments and routing rules manageable from the portal, a portal-first notifications inbox with per-event and per-site preferences, an orchestrator expansion that treats portal users as first-class recipients alongside agency owners without duplication, structured logging for every send across every channel, delivery webhook wiring with a retry policy for transient failures, a documented realtime subscription scope audit, and portal action event emission for the communication actions introduced by this session.

This session ships a user-visible surface, unlike Session one. It also strengthens the pipeline under every later session, which is why it comes before Commerce, Operations, and Content.

---

## 3. Why This Session Comes Now

Commerce, Operations, and Content sessions all depend on a reliable communication pipeline. Commerce actions trigger order-confirmation emails, shipment updates, and payment-proof review conversations. Operations triggers invoice emails, statement emails, support notifications, and CRM activity alerts. Content triggers form-submission notifications and publish confirmations. If the pipeline is not proven reliable now, every later session will ship a surface whose failure modes are invisible, and the acceptance standard in Section 16 of the master brief cannot be met.

Live chat is chosen as the first user-visible portal module for a second reason: it exercises the permission resolver, the portal data access layer, the audit log, the patterns, and the site switcher all at once, with both reads and writes, across both human-agent and AI-responder paths. A portal that can run live chat correctly is a portal whose foundation has been validated under real load.

---

## 4. Focus Areas

### 4.1 Portal Live Chat Inbox and Conversation Detail

The portal gains a first-class live chat surface. A client team member with the live-chat permission sees, for the currently selected site, a list of conversations with unread indicators, last message preview, customer identity, linked-entity indicator for orders, quotes, bookings, and CRM, and a status marker for open, pending, resolved, and AI-handled. Filtering covers status, unread, assigned to me, department, and linked entity type. Sorting defaults to most recent activity. The inbox is mobile-first, renders cleanly on a small viewport, and falls back to the shared empty, loading, and error patterns from Session one.

The conversation detail surface presents the full message timeline, including attachments and file uploads, the internal notes thread visible only to authorized agents, a composer that supports plain text, emoji, attachments, canned responses, and an internal-note toggle, and a sidebar with customer context drawn from the customer-context bridge across CRM, ecommerce, and bookings. The detail surface indicates the conversation's current responder, AI or human, and the current AI state where applicable.

All reads and writes in both surfaces flow through the portal data access layer, extended with a conversations namespace. No raw admin-client reads from portal code are permitted. Writes are gated on the live-chat permission, and the site-level tenancy check is enforced for every conversation, every message, and every note.

### 4.2 Internal Notes Security, Extended to the Portal

The four-layer security model for internal notes already exists on the agency side and must be extended, without weakening, to the portal. The four layers are: notes live in a separate table or a server-filtered partition of the messages table, not mixed inline in customer-visible streams; server-side filtering removes notes from any query that serves a customer-facing stream, regardless of how the query was reached; notification previews, push bodies, and email bodies never contain note content under any code path, even a mistaken one; no public or anonymous endpoint returns notes under any query shape.

In this session, a fifth layer is added: portal users without the live-chat permission, including a client administrator who happens not to have enabled the flag for themselves, never see notes on any surface. The portal data access layer's conversations namespace is responsible for enforcing this, and the server components that render conversation detail rely on the layer rather than rechecking at the view level. Any attempt to request a note-bearing query without the permission is audited and rejected.

A validation test exercises each of the five layers. The test suite must include a test that confirms a portal user with no live-chat permission, calling the conversation detail path directly, cannot read notes and is audited for the attempt. The test suite must include a test that confirms a notification sent for a message that had internal-note siblings does not contain any note text in its subject, preview, body, or push payload.

### 4.3 Canned Responses, Departments, and Routing, Manageable from the Portal

The portal surfaces management of canned responses, departments, and routing rules, scoped to the currently selected site, for a client team member with the live-chat permission. Canned responses are creatable, editable, deletable, and reorderable from the portal. Departments are creatable, editable, and deletable, and conversations can be assigned to a department from the conversation detail surface. Routing rules are a simple, documented subset: an incoming conversation can be routed to a default department, routed to a specific agent if assigned, or routed to Chiko AI first with a defined handoff condition. Nothing about this surface exists to replace the agency-side primitives; it reuses their storage model and extends their write paths with portal authorization.

Writes from the portal emit audit log entries and emit automation events as described in section 4.10.

### 4.4 Chiko AI Transparency, Fallback, and Per-Site Control

Every conversation surface in the portal makes the AI state visible. When Chiko AI is the current responder, the conversation header and the latest AI message carry an AI badge. When the AI call produces a confidence signal, the badge is accompanied by a confidence indicator. When the AI has requested a human handoff, the conversation displays a handoff state banner above the composer, with a clear call to action to take over.

Failure of the AI call must never leave a conversation idle. On API failure, rate limit, or timeout, both the agent-facing surface and the customer-facing widget render a visible fallback message. On the agent side the message reads in substance that automated reply is temporarily unavailable and the conversation is awaiting a human reply. On the customer side the message reads that an agent will respond shortly. Neither message mentions the AI vendor by name. Neither message implies the system is broken. The failure is reported in structured logs as described in section 4.7 and raises a flag on the portal operations telemetry surface.

A per-site toggle, controllable by a client team member with the live-chat permission, disables Chiko AI for that site. When disabled, the customer-facing widget communicates that an agent will respond shortly and never that the AI is unavailable. The toggle is persisted on the site or a site-settings equivalent, is audited, and is respected by every code path that would otherwise invoke the AI for that site. The toggle must not introduce a separate permission; live-chat permission suffices.

### 4.5 Portal Notifications Inbox

The portal gains a client-first notifications inbox. A portal user sees a feed of notifications for the sites they can access, with unread counts per site and in total, filters by event type and by site, and bulk actions for mark-as-read and archive. The header bell in the portal shell, delivered in Session one, connects to the same data source. The inbox is mobile-first, paginated, lazy-loaded, and uses the shared empty, loading, and error patterns.

Clicking a notification opens the underlying resource within the portal when one exists, otherwise opens the notification detail. Archived notifications are not deleted; they are hidden from the default view and remain retrievable from a filter. Bulk actions write audit log entries summarizing the action and its scope. No notification record is mutated outside of the portal data access layer.

### 4.6 Notification Preferences, Per Event and Per Site

Every portal user has a preference record per event type, with per-site overrides where applicable, for the three channels: in-app, email, and web push. Preferences are editable from a settings sub-surface linked from the portal profile. Defaults are opt-in for the event types the user is permissioned for, and opt-out for the rest; each specific default is documented in the session handoff note.

The orchestrator consults these preferences when dispatching each event. A portal user opted out of a given event on a given channel does not receive a record on that channel. A portal user opted out of all channels for a given event does not receive a record at all, including in-app, so the inbox is not polluted with events the user has explicitly turned off. Agency-owner preferences are unaffected by this session.

### 4.7 Business Notifications Orchestrator Expansion

The orchestrator today treats the agency owner as the primary recipient for each of the nineteen business events. In this session, it is expanded to treat portal users as first-class recipients alongside agency owners, without duplication.

The recommended dispatch model, carried forward from the master brief, is one record per recipient keyed to the user identifier, so that read state, archive state, preferences, and deletion are strictly per user. Read state and archive state never leak across recipients. A single event therefore produces one record per interested recipient.

The set of interested recipients for an event is the union of agency owners for the affected agency, portal users for the affected client who have access to the affected site, and any additional recipient class defined by the event. Each recipient is filtered by their preference record before a channel is attempted. Duplication is prevented by identifying each recipient by user identifier exactly once per event regardless of how many roles they hold.

The orchestrator must be modified such that portal users with the relevant permission receive in-app, email, and push records where permitted, agency owners continue to receive their records unchanged, and nothing about the existing agency pipeline regresses.

### 4.8 Structured Logging Across Email, Push, AI, and Workflow Events

Every send produces a structured log record. The record fields are, at minimum, event type, recipient class, user identifier, client identifier, site identifier, agency identifier, channel, delivery state, latency, and error if any. In-app records are logged on creation. Email sends are logged on send attempt and updated by delivery webhook. Push sends are logged on attempt and carry subscription resolution state. AI calls are logged on invocation with tokens-in, tokens-out when known, fallback-triggered state, and latency. Workflow triggers emitted by portal actions are logged with trigger identifier, target workflow identifier, and execution identifier.

Logs are queryable per tenant. The schema supports the portal operations telemetry surface that will be finished in Session six. Logs must not contain note text, customer personally identifiable information beyond identifiers already in the record, or AI response bodies.

The agent executing this session adds logging at every send path where it is currently missing, and normalizes logging at every path where it is currently inconsistent. The change is additive.

### 4.9 Email Delivery Webhook Wiring and Retry Policy

The branded and platform email pipelines must record delivery outcomes end to end. The delivery webhook from the email provider is wired to update the structured send log with bounce, complaint, delivery, and open where supported. Records are updated by provider message identifier, which must be captured on send.

A retry policy for transient failures is defined and implemented. Transient failure is a provider-reported retryable error, a network error, or a rate limit. The retry policy uses a bounded exponential backoff with a maximum attempt count, and it is audited through the same send log. Non-transient failures are not retried, are marked as failed in the log, and raise a flag on the portal operations telemetry surface.

### 4.10 Portal Action Event Emission

Portal actions introduced by this session emit events so that the automation module can observe them and trigger workflows on them. Specific actions that must emit events include: conversation created from the portal, conversation assigned from the portal, conversation resolved from the portal, internal note added from the portal, canned response used from the portal, department created or updated from the portal, routing rule changed from the portal, Chiko AI disabled or enabled for a site from the portal, notification preference changed from the portal, and bulk notification archive from the portal. Emission goes through the existing event log with a documented payload shape. The automation module does not need to gain any new consumer in this session; the consumers already exist.

### 4.11 Realtime Subscription Scope Audit

The portal uses the same realtime transport as the agency dashboard. The agent audits every realtime subscription reachable from a portal code path and confirms that each is scoped so that a portal user cannot receive events for data outside their client and outside their accessible sites. Where a subscription is too broad, it is narrowed. Where a subscription can be constructed only by filtering on the client, a server-side filter is added. The audit produces a short appendix to the foundation document listing every subscription, its scope, and its verification test.

A realtime leak test is added to the tenancy isolation suite. The test confirms that a portal user from one tenant cannot receive a realtime event for another tenant's conversation, message, note, notification, or typing indicator.

---

## 5. Module Areas Touched

Live chat, for inbox, conversation detail, internal notes, canned responses, departments, routing, Chiko AI transparency, Chiko AI fallback, and per-site AI disable. Notifications and business notifications orchestrator, for inbox, preferences, per-recipient dispatch, and structured logging. Email pipeline, for delivery webhook wiring, retry policy, and structured logging. Push pipeline, for structured logging and subscription resolution logging. Automation, for portal-originated event emission. Realtime, for subscription scope audit. Portal foundation, for extending the portal data access layer with a conversations namespace and a notifications namespace, and for extending the audit log writer with new actions.

Commerce, invoicing, marketing, CRM, blog, media, SEO, forms, domains, and business email are not touched by this session.

---

## 6. Key Risks and Mitigations

Cross-tenant realtime leak. Mitigated by the subscription scope audit, narrowed scopes, a tenancy isolation test covering realtime, and a refusal to use broad subscriptions anywhere in portal code.

Internal note preview leak via notification previews or email bodies. Mitigated by explicit test coverage of the preview path for every event type that can involve a note, and by a rule that notification payload construction never reads from the notes path at all.

AI rate limit masking as silence. Mitigated by the visible fallback on both sides, by structured logging of every fallback trigger, and by a portal operations telemetry flag that lights up on elevated fallback rate.

Notification duplication when a user is both a portal user and an agency owner, or both a portal user and a team member on multiple clients. Mitigated by the per-recipient dispatch model keyed to user identifier with a deduplication pass before write.

Orchestrator regression affecting the agency pipeline. Mitigated by ordering the orchestrator expansion as additive, by preserving every existing agency dispatch code path, and by a regression test that confirms agency-owner records are produced for a representative sample of events.

Email retry storm under a long provider outage. Mitigated by bounded backoff, a maximum attempt count, and a non-transient failure code path that does not retry.

Performance regression on conversation detail under high message counts. Mitigated by pagination, keyset pagination if needed, and a loading pattern that does not block the primary composer.

White-label leak through an AI vendor name in any user-facing copy. Mitigated by a rule that user-facing copy never mentions the AI vendor, by translating any legacy copy that does, and by a review of every string introduced in this session.

Impersonation drift, where the orchestrator treats the impersonator as a recipient. Mitigated by an explicit rule that the orchestrator uses the impersonated user, not the impersonator, and by an audit entry that records impersonator identity on every write performed under impersonation.

Regression in Session one foundation. Mitigated by running the Session one test suite as part of this session's completion gate.

---

## 7. Success Criteria

A client team member with the live-chat permission works a conversation end to end on mobile and on desktop, including composing, sending, adding an internal note, using a canned response, assigning a department, marking resolved, and reopening. The same user with the permission disabled sees no conversation data and no note data on any portal surface and is audited for any attempt.

Chiko AI displays a transparent state in every portal conversation where it is the responder, and on failure the portal displays a visible, brand-neutral fallback message on both sides. A per-site AI disable toggle, controllable by the live-chat permission, turns Chiko AI off for that site and is respected by every invocation path.

A portal user sees a client-first notifications inbox, with unread counts per site and in total, filters, and bulk actions. Per-event and per-site preferences are editable and respected by every dispatch path. A single event produces one record per interested recipient, never more, never fewer. Agency owners continue to receive their expected records.

Every send across every channel produces a structured log record with the documented fields. Email delivery webhook updates the log. The retry policy is implemented. AI calls, workflow triggers emitted by portal actions, and push sends all produce structured records.

Portal actions introduced by this session emit events that the automation module can observe.

Realtime subscriptions are audited and narrowed. The tenancy isolation suite gains a realtime leak test and passes it.

TypeScript compiles cleanly for every file changed. The Session one test suite still passes. New vitest tests cover the internal-note security paths, the preference respect paths, the fallback visibility paths, and the orchestrator dispatch model.

---

## 8. Validation Checklist

The agent confirms every item below before closing the session. Each item is verified against a running branch deployed to a preview environment through the Vercel MCP.

Tenancy isolation suite reruns and passes, including the new realtime leak test. A portal user from one tenant cannot read any conversation, any note, any notification, any preference, any canned response, any department, any routing rule, or any log record from another tenant. A portal user from one client cannot read data from another client on the same agency. A portal user cannot read data for a site within their own client when their site-level access excludes it.

Internal note safety holds across all five layers. Notes do not appear in customer streams, do not appear in notification previews, do not appear in email bodies, do not appear in push payloads, and do not appear for portal users without live-chat permission. Explicit tests cover each layer.

Chiko AI transparency is visible in every conversation it responds in. Chiko AI fallback is visible on both agent and customer sides when the call fails. The per-site disable toggle turns the AI off and the customer-facing copy on a disabled site communicates that an agent will respond shortly.

Every send, across in-app, email, push, AI invocation, and workflow trigger emission, produces a structured log record. The email delivery webhook updates the log. The retry policy is exercised by a simulated transient failure and a simulated permanent failure, and behaves as specified.

Orchestrator dispatch produces one record per recipient keyed to user identifier. Duplication across agency-owner and portal-user roles for the same user is prevented. Preferences suppress channels as expected. Agency-owner dispatch is unchanged from Session one.

Portal actions emit events. An automation workflow pointed at one of the emitted events fires in a staging environment.

Realtime subscription audit exists as a short appendix in the foundation document. Every subscription listed is scoped to the tenant. A realtime leak test exercises at least one subscription per category.

Session one tests still pass. New tests pass. TypeScript compiles. Vercel preview build succeeds. Supabase advisors produce no new warnings on the tables modified in this session.

---

## 9. Completion Gates

The agent does not declare the session complete until every gate below is met.

Every migration introduced by this session has been applied through the Supabase MCP against project nfirsqmyxmmtbignofgb, on staging first and verified, before any production application. The agent reports the applied migration names in the session handoff note.

Every new vitest test and every modified vitest test passes in the repository. The Session one tests continue to pass. The agent reports test counts.

Every send path documented in section 4.8 produces a structured log record in the new schema. The agent includes a short query in the session handoff note confirming a representative record exists for in-app, email, push, AI, and workflow-trigger channels.

The delivery webhook is wired in the staging environment and confirmed to update the log for at least one real send. The agent reports the provider message identifier observed.

`memory-bank/activeContext.md` is updated to reflect the new Session two deliverables and the shift of active focus from foundation to communication. `memory-bank/progress.md` is updated with the communication workstream state. `next-platform-dashboard/docs/PORTAL-FOUNDATION.md` is extended with the Session two contracts: the conversations namespace on the portal data access layer, the notifications namespace on the portal data access layer, the structured send log schema, the orchestrator dispatch model, the realtime subscription appendix, and the updated Session-N checklist for later authors.

The master brief `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md` is not edited unless something discovered during implementation contradicts what it says, in which case the contradicting section is updated in place and the change is noted in the session handoff.

---

## 10. Agent Operating Context

This section restates the operating contract from Section 17 of the master brief in the form that applies to Session two specifically. The authoritative version lives in the master brief and is the one to consult in case of ambiguity.

The agent executing this session has full access to the Supabase MCP against project nfirsqmyxmmtbignofgb, to the Vercel MCP, to the Cloudflare MCP, to the Context7 MCP, and to the Paddle MCP. The agent has workspace file system access, terminal access, and the ability to run vitest, playwright, tsc, and pnpm scripts.

Every migration introduced by this session is applied by the agent through the Supabase MCP. The agent does not produce a dot-sql file for the user to paste into the Supabase SQL editor. The agent may record the migration in the migrations folder for version history; it still applies the migration itself.

Every authentication change, should any be required by this session, is performed by the agent through the Supabase admin REST API. The agent does not ask the user to create auth users, reset passwords, or link identifiers.

Every seed or backfill required by this session is produced and run by the agent against the staging database. The agent does not ask the user to execute a script.

Every deployment verification is performed by the agent through the Vercel MCP. Every documentation lookup for libraries or framework behavior is performed by the agent through the Context7 MCP where the agent's training data may be stale.

Destructive production actions, and only those, require explicit user confirmation before execution. For this session, a destructive production action would include, for example, dropping or truncating a production table, disabling a production notification channel in bulk, or force-merging the delivery-log schema change in a way that discards existing records. If such an action becomes necessary, the agent prepares the full change, explains the blast radius, asks the user to confirm, and then executes the action itself rather than handing a command to the user.

The rule, restated in one line for emphasis: nothing in this session is handed back to the user for manual execution. Everything needed to ship Session two is provided to the agent.

---

## 11. Handoff to Session 3

Session three receives a portal that can communicate reliably and observe its own communication. Live chat works, internal notes are safe, Chiko AI is transparent and has a visible fallback, the notifications inbox is client-first, per-recipient dispatch is in place, structured logging covers every channel, and portal-originated actions emit events into the automation log.

Session three builds commerce on top of this: orders, products, customers, quotes, and bookings, with payment proof approval, minor-unit math, and portal-first workflows. Session three must not introduce a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, or a new logging mechanism. If session three finds itself tempted to, it means Session two is incomplete and must be reopened before session three proceeds.

The session handoff note produced by the agent at the end of Session two summarizes: which migrations were applied and on which environments, which tests were added and which counts pass, which log schema is now in place and how to query it, which realtime subscriptions are in scope, which events are now emitted by portal actions, which memory bank files were updated, and which open items, if any, are explicitly deferred to Sessions three through six with a reason and a target session.

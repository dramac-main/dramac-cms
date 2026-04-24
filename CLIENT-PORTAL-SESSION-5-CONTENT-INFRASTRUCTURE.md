# DRAMAC Client Portal — Session 5: Content and Infrastructure

**Document type:** Single-session implementation brief. Hand this document, together with `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md`, to the AI agent executing Session five.
**Audience:** One AI agent, working from a fresh context, with full MCP and tool access as defined in Section 17 of the master brief.
**Constraint:** Prose only. No code, SQL, pseudo-code, schema diffs, component snippets, or command lines appear anywhere in this file. The agent is responsible for translating the requirements below into the correct implementation.
**Working rule:** Read the master brief end to end. Read this session brief end to end. Read `memory-bank/activeContext.md`, `memory-bank/systemPatterns.md`, and `memory-bank/progress.md`. Read the foundation note at `next-platform-dashboard/docs/PORTAL-FOUNDATION.md`, including the Session 2A appendix on the send log and orchestrator dispatch model, the Session 3 appendix on commerce data access and minor-unit invariants, and the Session 4 appendix on the invoicing, CRM, marketing, support, and communications namespaces, the double-scope rule, the no-supplier-leak rule, the authoritative-owner rule, the consent-gate rule, and the universal-permission pattern. Read `CLIENT-PORTAL-SESSION-1-FOUNDATION.md`, `CLIENT-PORTAL-SESSION-2-COMMUNICATION.md`, `CLIENT-PORTAL-SESSION-3-COMMERCE.md`, and `CLIENT-PORTAL-SESSION-4-OPERATIONS.md` for the contracts the content and infrastructure session must consume without reinventing. Then plan the session before editing any file.

---

## 1. Starting State

Sessions one, two, three, and four have shipped. The portal shell, the site switcher, the permission resolver, the portal data access layer, the portal audit log, the shared pattern primitives, the baseline dashboard, and the foundation documentation are in place from Session one. The communication layer — live chat, Chiko AI transparency, notifications inbox, per-event preferences, per-recipient orchestrator, structured send log, email delivery webhook, bounded retry, and realtime subscription audit — is in place from Session two. Six commerce namespaces on the portal data access layer and the portal-first payment proof approval surface are in place from Session three. Operations — invoicing, CRM, marketing, support, and a read-only communications visibility surface over the Session 2 send log with the supplier-brand strip rule applied — is in place from Session four. Eighty-five portal vitest tests pass across ten test files. TypeScript compiles cleanly across the dashboard.

The `createPortalDAL(ctx)` namespace list after Session four is: `sites`, `orders`, `conversations`, `products`, `customers`, `quotes`, `bookings`, `payments`, `invoicing`, `crm`, `marketing`, `support`, `communications`. The Session 4 invariants that later sessions must respect without re-derivation are the double-scope rule on support and communications surfaces, the no-supplier-leak rule on communications surfaces, the authoritative-owner rule on invoicing across join paths, the consent-gate rule on marketing audience segments, and the universal-permission pattern used for `canManageSupport`. The universal-permission pattern is the first in a small family of permissions where a default value of true is expressed in the portal auth layer and in the sidebar, with a null entry in the recipient resolver's permission-to-column map so no database lookup occurs for that key.

One explicit carryover survives from Session three. The portal routes at `/portal/sites/[siteId]/orders`, `/products`, `/customers`, `/quotes`, and `/bookings` still mount the shared agency ecommerce dashboard inside a portal provider rather than presenting portal-first list and detail surfaces. The commerce data access layer exposes the required reads and writes. Session four was permitted to absorb this carryover incidentally if operations work naturally exposed portal-first commerce surfaces, and must have reported the disposition in its session handoff note. Session five is not expected to close this carryover. The commerce portal-first surface upgrade, in whole or in part, is handed to Session six as a polish-gate item.

A second explicit gap surfaced from Session four that Session five must absorb as a prerequisite of its own first focus area. The communications visibility surface at `/portal/sites/[siteId]/communications`, delivered in Session 4D, is reachable only by direct URL and has no sidebar entry today. Session five must add the navigation entry in the portal sidebar configuration so that a portal user with the required permission can reach the surface without manual URL entry. This is a five-minute navigation correction and is not the substance of Session five. The substance of Session five is content and infrastructure.

The content and infrastructure systems of the platform, as they stand before this session, are mature on the agency side and partially integrated on the portal side. The blog module has authoring, scheduling, categories, tags, comments, and publish flow. The media library has upload, folders, variants, usage tracking, and the media service that already exists on the portal. SEO has per-page metadata, site-level SEO settings, sitemaps, robots configuration, and an insights surface. The forms module has form definitions, submissions, and a submissions dashboard. The domains module integrates with ResellerClub on the supplier side for purchase, transfer, renewal, and DNS. The business email module integrates with an upstream email provider on the supplier side for mailbox provisioning, per-mailbox quotas, aliases, forwarding, and webmail links. The apps directory exists on the agency side as a module catalog that drives per-site module installation. The Zambia-first locale, integer minor unit money model, Africa/Lusaka time zone, and 16 percent VAT default remain in force. The branded email pipeline keyed to the site identifier and the legacy platform communications pipeline remain strictly separate, and the Session 4 no-supplier-leak rule remains in force on every portal surface that reads any supplier-adjacent column.

Session five closes the content and infrastructure gap on the portal side so that every surface a client team member uses to manage the site content, the site media, the site SEO posture, the site form traffic, the site domains, the site business email mailboxes, and the per-site installed modules is permission-gated, mobile-first, branded, and observable inside the new portal shell with no supplier brand exposed anywhere.

---

## 2. Objective

Deliver a portal-first content and infrastructure experience that a client team member can actually run the site content, the media library, the SEO surface, the forms inbox, the domains portfolio, the business email mailboxes, and the apps directory from, and do it without introducing a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, a new logging mechanism, a new commerce mechanism, or a new operations mechanism. Concretely: a portal blog surface covering authoring, scheduling, categories, tags, and publish lifecycle under the content permission; a portal media library surface covering upload, folders, variants, usage tracking, and deletion under the content permission; a portal SEO surface covering insights and a safe subset of settings under the content permission; a portal forms surface covering submissions triage, export, and linked conversation creation with the submissions permission as it exists on the agency side; a portal domains surface covering search, purchase, transfer, renewal, and DNS management with every supplier name and every supplier URL hidden; a portal business email surface covering mailbox list, provisioning, alias and forwarding management, quota display, and webmail access with every supplier name and every supplier URL hidden; and a portal apps directory surface that lists the per-site modules available to the client and drives per-site module installation or uninstallation within the client's entitlements.

This session ships the last significant new surface area of the portal rebuild. After Session five, Session six is polish, mobile, accessibility, performance, observability, tenancy rerun, and acceptance. The weight of Session five is therefore on breadth rather than on novel infrastructure: it must deliver many surfaces cleanly inside the existing portal contracts, and it must introduce nothing that Session six would then have to repair.

---

## 3. Why This Session Comes Now

Content and infrastructure is the last surface area a client team member needs to run a site end to end. It sits downstream of commerce and operations because the blog, the media, the SEO, the forms, the domains, and the business email mailboxes link to, reference, or are referenced by commerce and operations records. Building these surfaces before commerce and operations would have forced them to mock or stub data they now consume correctly.

Content and infrastructure also carries the heaviest white-label risk remaining on the platform. Domains integrates with ResellerClub; business email integrates with an upstream provider; SEO touches outputs that search engines index with the client's site identity. A supplier-brand leak on any one of these surfaces is visible to the client and, in the case of SEO, visible to the open internet. The no-supplier-leak rule established in Session four on the communications surface must now apply universally to content and infrastructure surfaces, on every rendered field, every rendered label, every rendered icon, every rendered URL, every rendered tooltip, every rendered error message, and every rendered empty state.

Content and infrastructure is also the last session that can introduce schema or integration choices before polish. If a missing foreign key, a missing index, a missing policy, or a missing provider configuration is going to surface, it surfaces here. Session six does not have the budget to absorb new schema or integration work; it must be polish, not rebuild.

---

## 4. Focus Areas

### 4.0 Communications Navigation Correction

Session four delivered a portal communications page at `/portal/sites/[siteId]/communications` but did not wire a navigation entry to it. Session five opens by adding an entry in the portal sidebar configuration for the currently selected site, gated on the same permission the page uses for authorization, placed in the portal's operations or observability group as fits the existing grouping convention, with a label and an icon that match the portal shell's pattern. This correction is the first commit of Session five and closes before any content or infrastructure work begins. It is not the substance of the session; it is a five-minute prerequisite.

### 4.1 Portal Blog: Authoring, Scheduling, Taxonomy, Publish Lifecycle

The portal gains a first-class blog surface. A client team member with the content-edit permission sees, for the currently selected site, a posts list with title, author, category, status, scheduled publish date, and published date. Filtering covers status, author, category, tag, and date range. Sorting defaults to most recent. Bulk selection supports bulk publish, bulk unpublish, bulk schedule, and bulk delete where legal.

The post detail surface presents the authoring workspace: title, slug, body through the existing rich-text editor the agency side already uses, excerpt, featured image from the media library, categories, tags, SEO overrides, publish state, scheduled date, and revision history. Writes flow through the portal data access layer with a blog namespace added in this session. The editor is reused as a shared component; it is not forked. Every write emits a portal action event into the automation event log.

Scheduling uses the site's time zone as defined in the site's locale configuration. A scheduled publish that crosses the scheduled time produces a portal action event for post published, with the same payload shape the agency side already emits.

Reads and writes in both surfaces flow through the blog namespace on the portal data access layer. Tenancy checks apply to every post, every revision, every taxonomy record, and every featured image reference. Writes are gated on the content-edit permission. Comments, if the blog module exposes them, are operated from the portal under the same permission, with bulk approve, bulk reject, bulk mark as spam, and bulk delete available.

### 4.2 Portal Media Library: Upload, Folders, Variants, Usage Tracking, Deletion

The portal gains a first-class media library surface. A client team member with the content-edit permission sees a media grid with thumbnail, filename, size, dimensions for images, folder, uploader, upload date, and usage count. Filtering covers type, folder, date range, and uploader. Sorting defaults to most recent. Bulk selection supports bulk move, bulk delete, and bulk tag.

Upload uses the existing media service already present in the portal data access layer, unchanged in contract. A folder tree is navigable from the media grid, and a folder rename or move respects tenancy bounds. Deletion is guarded: a media asset referenced by a published blog post, a product, a page, or a form is not hard-deleted without a confirmation summary listing the referencing records and is soft-deleted by default where the existing schema supports it. Variants are exposed where the media service generates them, with an administrative rebuild action gated on the content-edit permission.

Usage tracking renders the reverse index of where an asset is used. Reads flow through the existing media service. Writes that affect usage — such as a delete that would orphan a reference — emit a portal action event and an audit entry.

Tenancy checks apply to every asset and every folder. No raw admin-client media read from portal code is introduced in this session.

### 4.3 Portal SEO: Insights and Safe Settings Subset

The portal gains an SEO surface scoped to the currently selected site. A client team member with the content-edit permission sees insights: a sitemap health summary, robots configuration visibility, a list of pages with SEO gaps such as missing meta description or missing Open Graph image, and a short rollup of indexability and canonical coverage. The insights are read-only and render through the portal shell patterns.

A safe subset of SEO settings is editable from the portal. Site title, default meta description, default Open Graph image, and default robots directives are editable under the content-edit permission. Settings that can break indexation site-wide — robots no-index globally, canonical rewriting rules, sitemap exclusion patterns — are read-only from the portal in this session and remain editable only from the agency side. The split is documented in the Session 5 appendix of the foundation note.

Reads and writes flow through an SEO namespace on the portal data access layer added in this session, or through an extension of an existing namespace if the agency side already exposes SEO settings through a sibling of the sites namespace. Tenancy checks apply to every setting and every insights query. Writes emit a portal action event.

The SEO surface does not conflict with studio-generated page metadata. Where a page managed by the studio exposes its own SEO fields, the portal SEO surface renders those fields as read-only at the site level and directs the user to the studio surface for per-page edits. The hand-off convention is documented in the Session 5 appendix of the foundation note.

### 4.4 Portal Forms: Submissions Management

The portal gains a forms submissions surface scoped to the currently selected site. A client team member with the submissions permission sees a list of submissions with form identity, submitted date, contact, primary field preview, status, and assignment. Filtering covers form, status, date range, contact, and assignment. Sorting defaults to most recent. Bulk selection supports bulk status change, bulk assignment, bulk export, and bulk delete.

The submission detail surface presents all captured fields, any uploaded files through the media service, a conversion path to a conversation in live chat using the Session 2 conversations namespace, a conversion path to a CRM contact using the Session 4 CRM namespace, and an event history. Assignment, status change, and conversions are audited and emit portal action events.

Form definition editing is explicitly out of scope for Session five and remains on the agency side. Only submissions are managed from the portal in this session.

Reads and writes flow through a forms namespace on the portal data access layer added in this session. Tenancy checks apply to every submission, every file reference, and every conversion target. Writes that create a conversation or a contact invoke the Session 2 and Session 4 namespaces, not a new primitive.

### 4.5 Portal Domains: Search, Purchase, Transfer, Renewal, DNS with Supplier Branding Hidden

The portal gains a full domains surface for the client team with the appropriate permission, at a cross-site scope because a domain belongs to the client, not to a single site. A client team member sees a domains list with name, status, expiry date, auto-renew state, DNS host state, and the sites any domain is currently pointed at. The detail surface exposes DNS record management, auto-renew toggle, transfer initiation, renewal purchase, and a deletion path where the domain lifecycle permits.

Search, purchase, transfer, and renewal route through the agency-side domains service, which integrates with ResellerClub. Every supplier-adjacent field is stripped or rewritten before it reaches a rendered surface: no supplier brand appears on any label, any icon, any URL, any tooltip, any empty state, any error message, any loading message, any success toast, any confirmation dialog, any inline hint, or any breadcrumb. The rendered brand is the DRAMAC platform brand and the client's own brand as configured; no other brand is visible.

Pricing renders in the site's currency through the locale formatter, using integer minor units as established by commerce and operations. Where the supplier returns prices in another currency, conversion is performed at the service boundary, not at the render boundary, and the converted amount is stored so that a subsequent render does not re-convert.

DNS management supports the record types the existing agency-side service supports, with bulk record add, bulk edit, and bulk delete available. A DNS change produces an audit entry and a portal action event. A change that would orphan a site's production DNS record is guarded by a confirmation summary.

Reads and writes flow through a domains namespace on the portal data access layer added in this session, or through an extension of the existing agency domain service behind a portal-facing namespace. Tenancy checks apply at the client level for every domain record, and at the site level for every DNS record associated with a pointed site. Writes are gated on the appropriate domains permission as it exists in the agency model; if no portal-facing permission exists today, the content-edit permission is the conservative default for this session with a note for Session six to revisit the granularity.

### 4.6 Portal Business Email: Mailboxes, Provisioning, Aliases, Forwarding, Quotas, Webmail with Supplier Branding Hidden

The portal gains a full business email surface for the client team with the appropriate permission. A client team member sees a mailboxes list with mailbox address, status, quota used and quota total, forwarding rules summary, alias count, and last login. The detail surface exposes password reset, quota adjustment within the client's entitlements, alias creation and deletion, forwarding rule creation and deletion, and a link into webmail using a single-sign-on path where the supplier supports one.

Provisioning, password reset, quota adjustment, alias management, forwarding management, and webmail access route through the agency-side business email service. Every supplier-adjacent field is stripped or rewritten before it reaches a rendered surface, as defined in focus area 4.5. The branded label of the business email product is the one configured in the platform's white-label settings, not the supplier's label.

A quota near-limit alert routes through the per-recipient orchestrator with preference respect and logs through the Session 2 send log. Provisioning, deletion, and quota change emit portal action events.

Reads and writes flow through a business email namespace on the portal data access layer added in this session, or through an extension of the existing agency business email service behind a portal-facing namespace. Tenancy checks apply at the client level for every mailbox, every alias, every forwarding rule, and every audit row. Writes are gated on the appropriate business email permission as it exists in the agency model; if no portal-facing permission exists today, the content-edit permission is the conservative default for this session with a note for Session six to revisit the granularity.

### 4.7 Portal Apps Directory: Per-Site Module Catalog, Install, Uninstall

The portal gains an apps directory surface. For the currently selected site, a client team member with the appropriate permission sees a catalog of installable modules with name, short description, installation state, and any required entitlement. The surface supports install, uninstall where permitted, and a direct link into the module's portal surface once installed. The catalog is derived from the existing agency-side module registry through a portal-facing namespace.

Install and uninstall mutate per-site module installation records, emit portal action events, produce an audit entry, and refresh the portal sidebar's operations group on the next render so that the installed module's navigation entry appears or disappears as appropriate. An install that requires an entitlement the client does not have is surfaced with an upgrade path, not a provider brand or a platform operational detail.

Reads and writes flow through an apps namespace on the portal data access layer added in this session. Tenancy checks apply at the client level for entitlement checks and at the site level for per-site install records. Writes are gated on the appropriate apps permission as it exists in the agency model; if no portal-facing permission exists today, a conservative default that gates install and uninstall to the portal user who owns the client record is used for this session with a note for Session six to revisit the granularity.

### 4.8 Portal Action Event Emission for Every Content and Infrastructure Write

Every content and infrastructure write introduced or extended by this session emits an event into the existing automation event log with a documented payload shape. Specific actions that must emit events include: blog post created, blog post updated, blog post scheduled, blog post published, blog post unpublished, blog post deleted, blog comment approved or rejected or marked spam or deleted, media asset uploaded, media asset moved, media asset deleted, media folder created or moved or deleted, SEO setting changed, form submission status changed, form submission assigned, form submission converted to conversation, form submission converted to contact, domain purchased, domain transferred, domain renewed, domain auto-renew toggled, DNS record created or updated or deleted, business email mailbox provisioned, business email mailbox deleted, business email password reset, business email quota adjusted, business email alias created or deleted, business email forwarding rule created or deleted, app installed, and app uninstalled.

The automation module does not need to gain any new consumer in this session. Existing workflows pointed at these events must fire correctly. The session handoff note records the full list of events emitted, their payload shape, and a note on whether each event existed prior to this session or is introduced by it.

### 4.9 No-Supplier-Leak Invariant Reinforced Across Content and Infrastructure

Every portal surface introduced or modified by this session enforces the no-supplier-leak invariant established on the Session 4 communications surface. A supplier name, a supplier URL, a supplier icon, a supplier error message verbatim, or a supplier-branded loading state is never rendered. A supplier-adjacent column is stripped at the data access layer boundary before any value crosses into rendered output. A supplier-sourced identifier that has no meaning to a client team member is suppressed in favor of a client-meaningful label. A supplier integration error is translated into a client-meaningful message before it reaches a toast or an inline error.

A render audit test covers at least one surface per focus area in this session and confirms no supplier brand token appears in the rendered output. The supplier brand tokens are enumerated in the Session 5 appendix of the foundation note and include the ResellerClub brand and its common spellings, the upstream business email provider brand and its common spellings, and any known aliases or legacy spellings discovered during Session five.

---

## 5. Module Areas Touched

Blog, for authoring, scheduling, taxonomy, publish lifecycle, and comments where present. Media, for the library surface, folder operations, variant visibility, usage tracking, and guarded deletion. SEO, for insights and the safe settings subset with the studio hand-off convention. Forms, for submissions management, conversions to conversations and contacts, and export. Domains, for search, purchase, transfer, renewal, DNS record management, and supplier brand strip. Business email, for mailboxes, provisioning, aliases, forwarding, quotas, webmail access, quota alerting, and supplier brand strip. Apps directory, for the per-site module catalog and install lifecycle. Portal foundation, for extending the portal data access layer with blog, forms, SEO, domains, business email, and apps namespaces and for extending the audit log writer with content and infrastructure actions. Branded email pipeline, for blog customer-facing notifications where applicable and business email quota alerts keyed to the site identifier. Business notifications orchestrator, for the new content and infrastructure events. Automation, for the new portal-originated content and infrastructure events. Portal sidebar configuration, for the Session 4 communications correction and for the new content and infrastructure entries.

Live chat, internal notes, canned responses, departments, routing, Chiko AI surfaces, notification inbox, notification preferences, structured send log primitive, email delivery webhook, email retry policy, and realtime subscription scope audit are not rebuilt by this session. Their contracts are consumed as delivered by Session two.

Orders, products, storefront customers, quotes, bookings, payment proofs, commerce events, and the minor-unit formatter are not rebuilt by this session. Their contracts are consumed as delivered by Session three. The deferred commerce portal-first UI carryover is not in scope for Session five and is handed to Session six.

Invoicing, CRM, marketing, support, and the communications visibility surface are not rebuilt by this session. Their contracts are consumed as delivered by Session four, and the no-supplier-leak rule established on the communications surface is extended across content and infrastructure here.

---

## 6. Key Risks and Mitigations

Supplier brand leak on domains. Mitigated by a render audit test on every domains surface, by a lint-level check on the session's changed files that flags any occurrence of the supplier brand token and its common spellings, and by a convention that every rendered label, URL, icon, tooltip, empty state, error message, loading message, success toast, confirmation dialog, inline hint, and breadcrumb passes through a branded-label resolver on the surface or through a stripped data access layer at the boundary.

Supplier brand leak on business email. Mitigated identically to domains, with the upstream email provider brand token and its common spellings added to the lint-level check and the render audit.

DNS misconfiguration. Mitigated by the guarded-delete rule on DNS records that points at a live site, by a confirmation summary listing affected sites before any destructive DNS change, by an audit entry on every DNS change, and by a portal action event on every DNS change.

Business email provisioning silent failure. Mitigated by a structured send log entry on every provisioning attempt, by translating provider errors into client-meaningful messages at the service boundary, by a retry policy consistent with the Session 2 retry policy, and by a quota near-limit alert test that confirms the alert reaches the portal user and the send log.

SEO settings conflict with studio-generated pages. Mitigated by the read-only rendering of per-page studio-managed metadata at the site level, by the hand-off convention documented in the Session 5 appendix, and by a test that confirms a site-level SEO change does not overwrite a studio-managed per-page override.

Blog publish lifecycle regression under site time zone. Mitigated by a test that schedules a post in the site's time zone, advances a clock beyond the scheduled time in test conditions, and confirms the post publishes with the correct event payload and the correct published timestamp in the site's time zone rendered through the locale formatter.

Media orphan reference. Mitigated by the guarded-delete rule on assets referenced by published posts, products, pages, or forms, by a confirmation summary listing the referencing records, and by a soft-delete default where the existing schema supports it.

Apps directory entitlement confusion. Mitigated by the rule that an install requiring an entitlement the client does not have surfaces an upgrade path, not a provider brand or a platform operational detail, and by a test that confirms the upgrade path renders the client-meaningful label, not the supplier or provider label.

Regression in Session one, Session two, Session three, or Session four. Mitigated by running all four prior test suites as part of this session's completion gate.

Communications navigation correction skipped. Mitigated by the rule that the correction is the first commit of Session five, before any other focus area work begins.

Scope creep into Session six. Mitigated by an explicit rule that Session five does not take on the deferred commerce portal-first UI carryover, does not take on mobile or accessibility audits as first-class concerns, and does not take on performance or observability audits as first-class concerns. Session five may leave a trail of breadcrumbs for Session six to follow; it does not do Session six's work.

Realtime leak under content and infrastructure load. Mitigated by reusing the tenant-scoped subscriptions audited in Session two, by refusing to introduce any broader subscription in this session, and by an additional realtime leak test on at least one content or infrastructure subscription if this session introduces any.

Orchestrator and send log regression under content and infrastructure load. Mitigated by a targeted load check that exercises a representative burst of domain, business email, and blog publish events through the per-recipient orchestrator and confirms the send log records one structured row per recipient-channel attempt.

Impersonation drift in content and infrastructure writes. Mitigated by an explicit rule that every such write performed under impersonation records the impersonator identity on the audit entry, uses the impersonated user as the acting recipient for any follow-up notification, and never routes a customer-facing email under the impersonator's identity.

---

## 7. Success Criteria

A client team member with the appropriate permissions operates the blog, the media library, the SEO surface, the forms submissions inbox, the domains portfolio, the business email mailboxes, and the apps directory end to end on mobile and on desktop. Every content and infrastructure write emits an automation event that an existing workflow can observe.

A client team member without a given permission sees no data on the corresponding surface and is audited for any attempt. The no-supplier-leak rule holds on every surface touched by this session. A supplier brand token does not appear in any rendered output. A supplier-sourced identifier without meaning to a client team member is suppressed in favor of a client-meaningful label.

The Session 4 communications surface is reachable from the portal sidebar under the correct permission gate. A portal user with the communications-visibility permission navigates to it without manual URL entry.

Money rendered on any domain or business email surface flows through the locale formatter with integer minor units. No new floating-point money helper is introduced anywhere.

Every surface touched respects the tenant-scoped realtime subscription model. Tenancy isolation holds across blog, media, SEO, forms, domains, business email, and apps records. The Session 4 double-scope rule is respected on every surface where both a site-scope and a client-scope apply simultaneously.

TypeScript compiles cleanly for every file changed. The Session one, Session two, Session three, and Session four test suites still pass. New vitest tests cover the blog tenancy and publish lifecycle paths, the media guarded-delete path, the SEO insights and safe-subset paths, the forms submission conversion paths, the domains supplier-brand strip and DNS guard paths, the business email supplier-brand strip and quota alert paths, the apps directory install lifecycle, and the communications navigation entry presence and permission gate.

---

## 8. Validation Checklist

The agent confirms every item below before closing the session. Each item is verified against a running branch deployed to a preview environment through the Vercel MCP.

Tenancy isolation suite reruns and passes, extended for content and infrastructure. A portal user from one tenant cannot read any blog post, any media asset, any folder, any SEO setting, any form submission, any domain, any DNS record, any mailbox, any alias, any forwarding rule, any app install record, or any audit row from another tenant. A portal user from one client cannot read data from another client on the same agency. A portal user cannot read data for a site within their own client when their site-level access excludes it.

No-supplier-leak invariant holds. The render audit test covers at least one surface per focus area in this session and confirms no supplier brand token appears in the rendered output.

Communications navigation correction is in place. A portal user with the communications-visibility permission sees the Communications entry in the sidebar on every site-scoped route and can navigate to the communications surface without manual URL entry.

Blog publish lifecycle holds. A scheduled post crosses its scheduled time and publishes in the correct site time zone with the correct event payload.

Media guarded-delete holds. An asset referenced by a published record surfaces a confirmation summary on delete and soft-deletes by default.

SEO hand-off holds. A studio-managed per-page override is not overwritten by a site-level SEO change.

Forms conversion paths hold. A submission converts to a Session 2 conversation and to a Session 4 CRM contact without reintroducing a primitive.

Domains and business email supplier-brand strip holds on every rendered label, URL, icon, tooltip, empty state, error message, loading message, success toast, confirmation dialog, inline hint, and breadcrumb. A guarded DNS delete on a live-pointed site surfaces a confirmation summary. A business email quota near-limit alert reaches the portal user and the send log.

Apps directory install lifecycle holds. An install and an uninstall refresh the portal sidebar's operations group on the next render.

Automation event emission holds. Every content and infrastructure write specified in focus area 4.8 emits an event, and a staging workflow pointed at one of the new emissions fires.

Session one, Session two, Session three, and Session four tests still pass. New content and infrastructure tests pass. TypeScript compiles cleanly across the dashboard. Vercel preview build succeeds. Supabase advisors produce no new warnings on the tables modified in this session.

---

## 9. Completion Gates

The agent does not declare the session complete until every gate below is met.

Every migration introduced by this session has been applied through the Supabase MCP against project nfirsqmyxmmtbignofgb, on staging first and verified, before any production application. The agent reports the applied migration names in the session handoff note.

Every new vitest test and every modified vitest test passes in the repository. The Session one, Session two, Session three, and Session four tests continue to pass. The agent reports test counts.

Every content and infrastructure surface introduced or modified by this session routes its reads and writes through the portal data access layer. The agent reports the namespaces added, the existing namespaces extended, and a short query plan confirming no portal content or infrastructure surface calls the admin Supabase client directly for content or infrastructure data.

`memory-bank/activeContext.md` is updated to reflect the Session five deliverables and the shift of active focus from operations to content and infrastructure. `memory-bank/progress.md` is updated with the content and infrastructure workstream state. `next-platform-dashboard/docs/PORTAL-FOUNDATION.md` is extended with the Session five contracts: the blog, forms, SEO, domains, business email, and apps namespaces on the portal data access layer, the list of portal-originated content and infrastructure events with their payload shape, the no-supplier-leak invariant enumeration with the supplier brand tokens, the SEO studio hand-off convention, the DNS guarded-delete rule, the media guarded-delete rule, the apps directory install lifecycle, and the updated Session-N checklist for later authors.

The master brief `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md` is not edited unless something discovered during implementation contradicts what it says, in which case the contradicting section is updated in place and the change is noted in the session handoff.

The deferred commerce portal-first UI carryover is explicitly reported in the session handoff note as either incidentally absorbed in whole, incidentally absorbed in part with the residual listed, or handed untouched to Session six. Session five is not blocked by this carryover and does not take it on as substance.

---

## 10. Agent Operating Context

This section restates the operating contract from Section 17 of the master brief in the form that applies to Session five specifically. The authoritative version lives in the master brief and is the one to consult in case of ambiguity.

The agent executing this session has full access to the Supabase MCP against project nfirsqmyxmmtbignofgb, to the Vercel MCP, to the Cloudflare MCP, to the Context7 MCP, and to the Paddle MCP. The agent has workspace file system access, terminal access, and the ability to run vitest, playwright, tsc, and pnpm scripts.

Every migration introduced by this session is applied by the agent through the Supabase MCP. The agent does not produce a dot-sql file for the user to paste into the Supabase SQL editor. The agent may record the migration in the migrations folder for version history; it still applies the migration itself.

Every authentication or role change, should any be required by this session, is performed by the agent through the Supabase admin REST API. The agent does not ask the user to create auth users, reset passwords, or link identifiers.

Every seed or backfill required by this session is produced and run by the agent against the staging database. The agent does not ask the user to execute a script.

Every deployment verification is performed by the agent through the Vercel MCP. Every documentation lookup for libraries or framework behavior is performed by the agent through the Context7 MCP where the agent's training data may be stale.

Every Cloudflare DNS question, should any arise during the domains focus area, is answered through the Cloudflare MCP where the question concerns records under Cloudflare management, and through the agency-side domains service where the question concerns supplier-managed records. The agent does not expose any supplier-adjacent field to the client in the course of answering such a question.

Destructive production actions, and only those, require explicit user confirmation before execution. For this session, a destructive production action would include, for example, dropping or truncating a production blog, media, SEO, forms, domains, business email, or apps table; bulk-deleting blog posts in production; bulk-deleting media assets in production; bulk-changing DNS records in production; bulk-deprovisioning mailboxes in production; bulk-uninstalling apps in production; or force-merging a content or infrastructure schema change in a way that discards existing records. If such an action becomes necessary, the agent prepares the full change, explains the blast radius, asks the user to confirm, and then executes the action itself rather than handing a command to the user.

The rule, restated in one line for emphasis: nothing in this session is handed back to the user for manual execution. Everything needed to ship Session five is provided to the agent.

---

## 11. Handoff to Session 6

Session six receives a portal that can communicate reliably, observe its own communication, run the commerce center of a client business, run the back-office operations of a client business, and run the content and infrastructure of a client business end to end on mobile and on desktop. Blog, media, SEO, forms, domains, business email, and apps work, the no-supplier-leak rule holds across every portal surface, the communications visibility surface is reachable from the sidebar, and portal-originated content and infrastructure events emit into automation.

Session six is polish. Its work is: a mobile-first audit across every surface, a white-label audit across every surface, an accessibility audit across every surface, a performance audit, an observability surface review, a tenancy isolation rerun, final acceptance against Section 16 of the master brief, and the disposition of any carryover from prior sessions including the deferred commerce portal-first UI surfaces. Session six does not introduce a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, a new logging mechanism, a new commerce mechanism, a new operations mechanism, or a new content or infrastructure mechanism. If session six finds itself tempted to, it means a prior session is incomplete and must be reopened before session six proceeds.

The session handoff note produced by the agent at the end of Session five summarizes: which migrations were applied and on which environments, which tests were added and which counts pass, which namespaces are now present on the portal data access layer, which content and infrastructure events are now emitted from portal actions with their payload shape, which realtime subscriptions were added or narrowed if any, which memory bank files were updated, the disposition of the deferred commerce portal-first UI carryover, the enumeration of supplier brand tokens that the render audit now guards against, and which open items, if any, are explicitly deferred to Session six with a reason.

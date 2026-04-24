# DRAMAC Client Portal — Session 6: Polish, Mobile, and Acceptance

**Document type:** Single-session implementation brief. Hand this document, together with `CLIENT-PORTAL-OVERHAUL-MASTER-BRIEF.md`, to the AI agent executing the sixth and final session of the portal overhaul.
**Audience:** One AI agent, working from a fresh context, with full MCP and tool access as defined in Section 17 of the master brief.
**Constraint:** Prose only. No code, SQL, pseudo-code, schema diffs, component snippets, or command lines appear anywhere in this file. The agent is responsible for translating the requirements below into the correct implementation.
**Working rule:** Read the master brief end to end. Read this session brief end to end. Read `memory-bank/activeContext.md`, `memory-bank/systemPatterns.md`, and `memory-bank/progress.md`. Read the foundation note at `next-platform-dashboard/docs/PORTAL-FOUNDATION.md`, including every appendix added by Sessions 2A, 3, 4, and 5. Read `CLIENT-PORTAL-SESSION-1-FOUNDATION.md`, `CLIENT-PORTAL-SESSION-2-COMMUNICATION.md`, `CLIENT-PORTAL-SESSION-3-COMMERCE.md`, `CLIENT-PORTAL-SESSION-4-OPERATIONS.md`, and `CLIENT-PORTAL-SESSION-5-CONTENT-INFRASTRUCTURE.md` for the contracts this session must respect without reinventing. Then plan the session before editing any file.

---

## 1. Starting State

Sessions one through five have shipped. The portal has a foundation layer, a communication layer, a commerce layer, an operations layer, and a content-and-infrastructure layer. The portal data access layer exposes twenty namespaces. One hundred portal vitest tests pass across eleven test files. TypeScript compiles cleanly across the dashboard. The portal sidebar renders Communications and Apps entries introduced in Session 4D and Session 5 respectively. The supplier-brand-strip utility is in force on the communications, domains, and business-email surfaces.

The twenty namespaces on `createPortalDAL(ctx)` after Session five are: `sites`, `orders`, `conversations`, `products`, `customers`, `quotes`, `bookings`, `payments`, `invoicing`, `crm`, `marketing`, `support`, `communications`, `blog`, `media`, `seo`, `forms`, `domains`, `businessEmail`, and `apps`. The invariants in force, cumulative from Sessions 2 through 5, are: the recipient resolver pattern, the structured send log primitive, the per-recipient orchestrator with bounded retry, the double-scope rule on support and communications, the no-supplier-leak rule extended across content and infrastructure, the authoritative-owner rule on invoicing, the consent-gate rule on marketing, the universal-permission pattern for keys like `canManageSupport`, the SEO field-level merge rule, the media guarded-delete rule, the apps directory site-installable filter, and the forms read-and-archive-only rule.

Three categories of known work remain open at the start of Session six. Each category is handed to this session for disposition — either absorption in whole, absorption in part, or explicit deferral with a documented reason.

The first category is the Session 3 commerce portal-first UI carryover. The portal routes at `/portal/sites/[siteId]/orders`, `/products`, `/customers`, `/quotes`, and `/bookings` still mount the shared agency ecommerce dashboard inside a portal provider rather than presenting portal-first list and detail surfaces. The commerce data access layer exposes the required reads and writes. Session five was explicitly permitted to defer this, and did. Session six inherits it.

The second category is the implicit UI-depth gap from Sessions 4 and 5. Several operations and content namespaces delivered in Sessions 4 and 5 are backed by the data access layer but not by rich portal-first list and detail surfaces. Where the portal currently falls back to the agency shell or to a read-only page, the surface is functional but not yet polished to the standard the master brief requires of a shippable portal. Session six inherits this gap with the authority to prioritize across the twenty namespaces rather than close every one.

The third category is the item Section 15 of the master brief lists as open questions. Several are already answered incidentally by Sessions 1 through 5; a few remain genuinely open. Session six records the final disposition of each open question in the session handoff note.

The content and infrastructure layer is intact. The commerce layer is intact. The operations layer is intact. The communication layer is intact. The foundation layer is intact. No regression from Session five tests is tolerated in this session.

---

## 2. Objective

Deliver an externally shippable portal. Every portal surface a client team member reaches is permission-gated, mobile-first, branded, accessible, performant, and observable. Every portal write emits into automation. Every portal customer-facing send flows through the branded pipeline keyed to the site identifier with the supplier-brand strip applied. Every portal record is tenant-scoped at the database row level and at the realtime subscription level. No supplier brand token appears in any rendered surface. The portal meets Section 16 of the master brief in full.

Session six is polish. It does not introduce a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, a new logging mechanism, a new commerce mechanism, a new operations mechanism, or a new content-or-infrastructure mechanism. If this session finds itself tempted to introduce a new primitive, the temptation is a signal that a prior session is incomplete and must be reopened before this session proceeds. Session six may extend an existing contract if extension is strictly additive and strictly internal to the portal; it may not change the contract shape in a way that would ripple into the agency side, the automation module, the notifications module, or any module-owned service.

The practical shape of Session six is therefore two interleaved streams of work. Stream A is breadth polish: a surface-by-surface pass across every portal route, applying the mobile-first layout, the accessible interaction, the branded visual language, and the white-label audit. Stream B is depth polish: closing the Session 3 and the Session 4/5 UI-depth gaps where the absence of a portal-first list or detail surface would fail the acceptance standard. The session prioritizes breadth over depth: a portal that is coherent across every surface but thin on a few is shippable; a portal that is deep on a few and broken on others is not.

---

## 3. Why This Session Comes Now

Polish cannot happen before the surfaces exist. Session five was the last session that introduces new surface area. With blog, media, SEO, forms, domains, business email, and apps landed on the portal data access layer, the polish session finally has the complete target set. An earlier attempt at polish would have missed surfaces it could not yet see.

Polish also cannot be interleaved with surface delivery without cost. A mobile-first pass that ships alongside a new namespace must either repeat itself when the next namespace lands or drift out of date. By gathering all polish concerns into one session at the end, Session six produces a single coherent result: the portal passes the acceptance standard as a whole, not as a patchwork of half-polished surfaces.

Polish is also the last practical chance to catch silent failures. Sessions one through five exercised every code path through tests and through the normal happy path. Session six exercises the failure paths: a flaky network, a realtime subscription disconnect, an AI call that hangs, a supplier outage, a concurrent editor, a slow query under load, a mobile viewport with a virtual keyboard obscuring the primary action. A portal that handles these gracefully is shippable; a portal that does not is not.

---

## 4. Focus Areas

### 4.1 Commerce Portal-First UI Carryover Disposition

The five routes at `/portal/sites/[siteId]/orders`, `/products`, `/customers`, `/quotes`, and `/bookings` still render the shared agency ecommerce dashboard inside a portal provider. Session six inherits this carryover and decides its disposition.

The preferred disposition is a targeted portal-first pass on the two routes with the highest client-team-member touch frequency, which are orders and products. Orders needs a portal-first list with filter by status, fulfillment state, date range, and customer; a portal-first detail view covering items, shipping, tax, totals in integer minor units through the locale formatter, payment state, and fulfillment timeline; and the existing Session 3 portal-first payment proof approval surface reachable from the detail. Products needs a portal-first list with filter by category and stock state; a portal-first detail view covering media from the Session 5 media service, description through the existing rich text editor, pricing in integer minor units, stock, and variants. Customers, quotes, and bookings may remain on the agency shell for this session provided the shell renders cleanly within the portal provider on mobile, respects the portal permission gate on every action, enforces the Session 3 no-supplier-leak rule on every rendered field, and emits into automation on every write. The session handoff note records whether customers, quotes, and bookings were absorbed into the portal-first pattern or explicitly deferred to a later minor session post-acceptance.

Where a commerce portal-first surface is introduced in this session, it consumes the Session 3 commerce namespace on the portal data access layer unchanged. No new namespace is added. No new primitive is introduced. The Session 3 impersonation rule, the Session 3 currency and minor-unit rule, and the Session 3 tenancy-check rule apply in full.

### 4.2 Operations and Content UI-Depth Sweep

Sessions 4 and 5 shipped the data access layer for invoicing, CRM, marketing, support, communications, blog, media, SEO, forms, domains, business email, and apps. Some of these namespaces are backed by rich portal-first surfaces already; others are not. Session six conducts an audit of each namespace and either (a) ships the portal-first list and detail surfaces to the standard of Sessions 1 and 2 or (b) explicitly defers the namespace to a post-acceptance minor session, with a note explaining why the deferral does not block acceptance.

The priority order for depth polish is: support tickets list and detail on the portal with internal-note security enforced at render time, invoicing list and detail with authoritative-owner rule respected, CRM contacts and deals with consent flags rendered, marketing campaigns list and audience-segment read-only detail with consent gate visible, blog posts list with scheduling and publish lifecycle, media library with guarded-delete confirmation summary, SEO insights view, forms submissions triage with archive action, domains list and DNS editor with supplier-brand strip verified at render, business email mailboxes list and mailbox detail with supplier-brand strip verified at render, apps directory with per-site install lifecycle, and communications read-only log polished with the site-timezone formatter applied to every timestamp.

Where a depth polish surface is introduced, it consumes the existing namespace unchanged. The shared portal shell, the shared page header, the shared table and list components, and the shared filter and empty-state components are reused. No new shell, no new shared component, no new primitive.

Where a namespace is explicitly deferred, the deferral is recorded in the session handoff note and the existing read-only or agency-shell surface is confirmed to meet the acceptance standard's minimum bar for that route.

### 4.3 Mobile-First Audit Across Every Portal Surface

Every portal route is audited on a small mobile viewport with a virtual keyboard taking the lower half of the screen. The audit confirms that the primary action on each surface is reachable without horizontal scrolling and without the primary action being occluded. The portal sidebar is collapsible on mobile and the site switcher is reachable within two taps from any portal route. Tables with more than four columns on desktop are replaced by card or list layouts on mobile. Modal dialogs on mobile use full-viewport layouts rather than centered overlays that clip on small screens. Form inputs on mobile respect the correct input type so the virtual keyboard matches the field.

The audit covers foundation, communication, commerce, operations, and content-and-infrastructure routes. A single representative surface per namespace is exercised end to end on a small mobile viewport, including the primary write path, the primary read path, and one error path. The audit output is a checklist in the session handoff note naming every surface and its status: passes, passes with minor note, or fails and fixed.

No new breakpoint is introduced. The existing responsive conventions of the agency dashboard are adopted unchanged. The audit does not redesign the shell; it verifies that the existing responsive conventions hold under real portal-content pressure.

### 4.4 White-Label Audit Across Every Portal Surface

Every portal route is audited for supplier-brand leak. The audit takes the union of all supplier brand tokens enumerated in the Sessions 2 and 4 no-supplier-leak rule and the Session 5 appendix of the foundation note, including but not limited to provider-prefixed columns, the upstream email-sending service names, the upstream domains registrar name, the upstream business email provider name, the Cloudflare brand where rendered on a client surface, the Paddle brand where rendered on a client-facing billing surface, and any known aliases or legacy spellings the session discovers. The audit confirms no supplier brand token appears in any rendered output: labels, headers, tooltips, empty states, error messages, success toasts, confirmation dialogs, breadcrumbs, and inline hints are all in scope.

The audit is performed surface by surface with a mix of automated render-snapshot checks and manual review. Automated render-snapshot checks cover the list and detail view of every namespace. Manual review covers empty states, error states, and loading states for at least one representative surface per namespace.

Where a leak is found, it is fixed by stripping at the data access layer boundary, by substituting the branded platform label at the render boundary, or by translating a supplier-sourced error at the service boundary — in that order of preference. No fix is applied at the copy layer alone if a structural strip is available, because a copy-only fix drifts when the supplier changes its branding.

The audit output is a checklist in the session handoff note naming every supplier brand token, every surface checked, and any leak found and fixed.

### 4.5 Accessibility Audit

Every portal route is audited for accessibility. Every interactive element has an accessible label and a keyboard-reachable focus state. Color contrast meets the WCAG AA standard across every brand palette variation the client's white-label configuration allows. Motion respects a reduced-motion preference. Skip links exist on every long list surface. Headings are ordered semantically. Landmarks are present on every page.

The audit covers foundation, communication, commerce, operations, and content-and-infrastructure routes. A single representative surface per namespace is exercised end to end using keyboard-only navigation. The audit output is a checklist in the session handoff note naming every surface and its status: passes, passes with minor note, or fails and fixed.

No new accessibility primitive is introduced. The existing accessible components of the agency dashboard are adopted unchanged. The audit verifies correctness and adds accessible labels where an inherited component was adopted without one.

### 4.6 Performance Audit

Every portal route is measured on a cold render and on a warm render. The cold-render measurement uses a clean session against the staging deployment. The warm-render measurement uses an already-authenticated session against the same deployment. A surface that exceeds a reasonable cold-render budget is investigated. The common causes considered are n-plus-one queries, unindexed lookups, large payload returns without a limit, and over-subscribing to realtime channels.

The audit identifies and fixes any portal query that lacks an index on a Session 1 through 5 schema addition, any portal query that does a full-table scan under tenancy filters, any portal list that returns more than the display budget without a limit, and any realtime subscription that has a scope broader than the current route needs. A slow query that is inherent to the scale of the data is not fixed; it is recorded as a known issue with a pagination mitigation noted.

The audit output is a performance summary in the session handoff note naming the top ten routes by cold-render time with the measured value, any fix applied, and any known issue recorded.

The Supabase MCP is used for advisors and for explain-plan queries. No production data is queried through the MCP during this audit; staging data of similar shape is used.

### 4.7 Observability Surface Review

Every portal action is confirmed to emit into the right observability surface. A portal write produces an audit log record. A portal send produces a structured send log record. A portal AI call produces a structured log record. A portal workflow trigger produces an automation event. A portal error produces a structured error record that a platform operator can reach without supplier-side tooling.

The audit cross-references the list of events emitted by Sessions 1 through 5 against the automation module's event catalog and against the structured send log schema. A missing emission is added. A drift between the documented payload shape and the actual payload shape is corrected in the documentation. A duplicate emission is removed. An unused event consumer on the automation side is noted for pruning in a post-acceptance cleanup.

The audit output is an observability summary in the session handoff note naming every event family, the namespace that emits it, the payload shape, and the consumer that observes it.

### 4.8 Tenancy Isolation Rerun

The Sessions 1 through 5 tenancy isolation suite is rerun and extended. The suite confirms that a portal user from one tenant cannot read or mutate any record belonging to another tenant across every namespace on the portal data access layer. The suite also confirms that a portal user within one tenant cannot read or mutate a record for a site outside their site-level access. The suite is run against staging data with a representative multi-tenant fixture.

The suite is extended with a cross-cutting scenario: an agency operator impersonating a portal user, with a Session 1 impersonation context in force, attempts every write across every namespace and confirms that the impersonation context is recorded on every audit entry, that no customer-facing communication is sent under the impersonator's identity, and that the acting-recipient for every follow-up notification is the impersonated user rather than the impersonator.

The output is a tenancy summary in the session handoff note reporting every scenario, its status, and any fix applied. A tenancy failure is treated as a blocking defect: the session does not close until every scenario passes.

### 4.9 Permission Matrix Audit

Every portal permission is confirmed to gate the correct set of surfaces, writes, and observability emissions. The matrix is the cross-product of the portal permission set and the portal surface set. A cell is passing when the permission-denied path produces an audit entry, does not touch the database, and does not leak the existence of the denied record. A cell is failing when any of those three properties is violated.

The matrix is exercised through a combination of targeted tests and manual verification. A cell that covers a high-impact write, such as delete-in-any-namespace or impersonation-initiation, is always tested. A cell that covers a low-impact read may be verified manually if testing every such cell would be disproportionate to the risk.

The output is a permission matrix summary in the session handoff note reporting every passing cell, every failing cell before fix, every fix applied, and every cell that remains failing with a documented mitigation. A failing cell that involves a data-leak class issue is a blocking defect.

### 4.10 Documentation and Memory Bank Finalization

The memory bank is brought up to date. `memory-bank/activeContext.md` is updated to reflect the completion of the portal overhaul and the shift from active delivery to maintenance. `memory-bank/progress.md` is updated with the completion status of every portal workstream and the disposition of every open question from Section 15 of the master brief. `memory-bank/systemPatterns.md` is extended with a portal-patterns appendix that summarizes the invariants in force across Sessions 1 through 5, as a single reference for future maintainers.

The foundation note at `next-platform-dashboard/docs/PORTAL-FOUNDATION.md` is extended with a Session 6 appendix covering the audit outputs described in focus areas 4.3 through 4.9 and the final disposition of every open question from Section 15. The audit outputs are recorded in prose, not in a dashboard or a spreadsheet, because the foundation note is the durable home for portal contracts.

A handoff document at the repository root, produced by this session, summarizes the portal overhaul from Session 1 through Session 6, notes the final namespace list, the final invariants, the final event catalog, and the final known-issues list, and points future maintainers at the session-by-session briefs and the foundation note for detail. The handoff document is the primary artifact the next team reads when they inherit the portal.

The agency-side documentation is left alone unless a contract-shape change in this session affected an agency-side reader, in which case the affected agency-side document is updated in place with a note of the change.

### 4.11 Final Acceptance Run-Through

A final run-through against Section 16 of the master brief is conducted. Every statement in Section 16 is verified end to end on a preview deployment through the Vercel MCP. The run-through output is an acceptance checklist in the session handoff note with one line per Section 16 statement: passes, passes with a note, or fails and blocks.

A failing statement in Section 16 is a blocking defect. The session does not close with a failing statement outstanding. A statement that passes with a note is allowed to close the session if the note is a known issue with a mitigation in place; the note is carried into `memory-bank/progress.md` as a post-acceptance maintenance item.

### 4.12 Internationalization Preparation Without Translation

Per Section 15 of the master brief, the portal is prepared for internationalization but not translated. Strings visible to a portal user across the new surfaces introduced by Sessions 1 through 5 are audited. Strings that live inline in a component are extracted into a consistent location per the repository's existing convention. Strings that already live in an externalized location are left alone. The extraction does not introduce a translation mechanism if one does not already exist; it prepares the surface area so that a future session can add translations without revisiting every route.

The scope of this focus area is bounded: only strings added by Sessions 1 through 5 are in scope. Strings inherited from pre-existing agency components are not audited in this session. The output is an internationalization summary in the session handoff note naming the audited surfaces and the extraction action taken.

### 4.13 AI Cost Control and Rate Limiting

Per Section 15 of the master brief, AI-facing surfaces in the portal — including the Session 2B Chiko AI transparency surface and any other portal AI call path — are bounded by rate limiting, token accounting, and a visible per-site usage dial. The rate-limit window and the token-budget window are aligned with the existing agency-side AI governance rules if they exist; otherwise a conservative default per client is applied, documented, and surfaced in the portal as a read-only usage dial so a client team member can see remaining budget without needing to ask the agency.

The rate-limit and token-accounting implementation reuses any existing agency-side primitive rather than introducing a new one. If no such primitive exists, this session adds a minimal accounting table scoped per site and per day, with reads through a new `aiUsage` namespace on the portal data access layer gated on the analytics permission. This is the one primitive extension Session six is permitted, and only if the audit finds no existing primitive to reuse.

A denial on the rate-limit or token-budget path returns a client-meaningful message, not a supplier-side error. The denial is audited and emits an automation event so a workflow can notify the agency operator if a client repeatedly trips the budget.

---

## 5. Module Areas Touched

Every portal route. Every portal namespace on the portal data access layer. Every portal write path. Every portal send path through the branded pipeline. Every portal AI call path. Every portal realtime subscription. The portal sidebar configuration. The portal shell and the shared portal components. The memory bank files, the foundation note, and any agency-side document affected by an internal contract-shape extension introduced by this session.

The agency-side surfaces are not rebuilt, not restyled, and not re-audited by this session. The agency side is consumed as delivered. An agency-side behavior change landed in this session is strictly an internal extension driven by a portal-side polish need; it does not change any agency-facing contract.

The automation module, the notifications module, the structured send log primitive, the recipient resolver, the email retry policy, and the realtime subscription audit primitive are not rebuilt, not extended in contract shape, and not re-audited by this session. They are consumed as delivered. Any drift in observability is corrected by bringing the portal side into alignment with the existing module contract, never the other way.

Paddle platform billing, LemonSqueezy, and Stripe remain out of scope for client-site billing. Paddle billing surfaces that this session polishes are strictly platform-facing surfaces of the agency operator, not client-facing surfaces. The client-facing commerce payment path on the portal uses the site-configured commerce payment providers, not Paddle.

---

## 6. Key Risks and Mitigations

Scope creep into new surface area. Mitigated by the rule that Session six does not introduce a new primitive and does not ship a new namespace; a namespace-depth gap is either absorbed with the existing namespace or explicitly deferred. The temptation to introduce a new primitive is explicitly treated as a signal that a prior session is incomplete rather than as a Session 6 task.

Regression in Sessions 1 through 5 under polish pressure. Mitigated by running every prior test suite as part of this session's completion gate, and by refusing to ship a polish change that breaks a passing test in a prior session unless the test was relying on a contract shape now known to be incorrect.

White-label leak caught late. Mitigated by the focus area 4.4 audit with automated render-snapshot checks across every namespace, manual review of empty, error, and loading states, and structural fixes at the data access layer or render boundary rather than copy-only fixes.

Mobile audit gap on a surface not exercised in development. Mitigated by the focus area 4.3 audit exercising a representative surface per namespace end to end on a small mobile viewport with a virtual keyboard occluding the lower half.

Accessibility gap on an inherited component. Mitigated by the focus area 4.5 audit exercising keyboard-only navigation across every namespace and by adding accessible labels where an inherited component was adopted without one.

Performance regression under load. Mitigated by the focus area 4.6 audit measuring cold and warm render across every route, identifying n-plus-one queries, unindexed lookups, oversized payloads, and overly broad realtime subscriptions, and fixing them or documenting them as known issues with pagination mitigations.

Silent observability gap. Mitigated by the focus area 4.7 audit cross-referencing every portal action against the automation event catalog and the structured send log schema, correcting missing emissions, payload drift, duplicates, and documenting unused consumers for post-acceptance pruning.

Tenancy isolation regression under polish. Mitigated by the focus area 4.8 rerun of the Sessions 1 through 5 tenancy isolation suite, extended with an impersonation cross-cut, with a failing scenario treated as a blocking defect.

Permission matrix drift. Mitigated by the focus area 4.9 audit exercising the cross-product of the portal permission set and the portal surface set, with a data-leak-class failing cell treated as a blocking defect.

AI cost runaway. Mitigated by the focus area 4.13 rate limit, token accounting, and per-site usage dial.

Commerce UI carryover never closed. Mitigated by the focus area 4.1 targeted portal-first pass on orders and products, with customers, quotes, and bookings either absorbed or explicitly deferred to a post-acceptance minor session.

Acceptance drift. Mitigated by the focus area 4.11 final run-through against Section 16 of the master brief, with a failing statement treated as a blocking defect.

Documentation drift. Mitigated by the focus area 4.10 finalization of the memory bank, the foundation note, and the repository-root handoff document.

Impersonation leak on a polish change. Mitigated by the impersonation cross-cut in the focus area 4.8 tenancy rerun, which exercises every write path under impersonation and confirms the impersonator identity is recorded on every audit, no customer-facing send is under the impersonator's identity, and the acting-recipient on every follow-up notification is the impersonated user.

---

## 7. Success Criteria

Every statement in Section 16 of the master brief is demonstrably true on a preview deployment through the Vercel MCP. The tenancy isolation suite passes. The accessibility audit passes. The mobile audit passes. The white-label audit passes. The observability audit passes. The permission matrix audit passes. The performance audit passes or documents known issues with mitigations. The memory bank reflects the new portal reality. The master brief is up to date. The next team that touches the portal can reach full context from the session briefs, the foundation note, the memory bank, and the repository-root handoff document alone.

The Session 3 commerce portal-first UI carryover is disposed: either absorbed in whole, absorbed in part with the residual explicitly deferred to a post-acceptance minor session, or explicitly deferred in full with a documented reason that does not block acceptance. The Session 4 and Session 5 UI-depth gap is disposed namespace by namespace on the same disposition scale. Every disposition is recorded in the session handoff note.

No new primitive is introduced. No new permission mechanism is introduced. No new data access mechanism is introduced. No new audit mechanism is introduced. No new communication mechanism is introduced. No new logging mechanism is introduced. The single permitted primitive extension, if the focus area 4.13 audit required it, is the AI usage accounting and the `aiUsage` namespace, and only if no existing primitive could be reused.

TypeScript compiles cleanly for every file changed. Every prior portal test continues to pass. New vitest tests, where introduced to guard a polish fix, pass.

---

## 8. Validation Checklist

The agent confirms every item below before closing the session. Each item is verified against a running branch deployed to a preview environment through the Vercel MCP.

The Sessions 1 through 5 tenancy isolation suite reruns and passes with the impersonation cross-cut extension.

The Sessions 1 through 5 vitest suite reruns and passes. New vitest tests introduced by this session pass.

Every portal route passes the mobile audit end to end on a small mobile viewport with a virtual keyboard occluding the lower half of the screen. The primary write and primary read paths work. One error path on each namespace works gracefully.

Every portal route passes the white-label audit. No supplier brand token appears in any rendered surface. Structural strips are in force at the data access layer boundary or the service boundary for every supplier-adjacent integration.

Every portal route passes the accessibility audit on keyboard-only navigation. Accessible labels, focus states, and landmarks are in place. Color contrast meets WCAG AA across every brand palette variation. Motion respects reduced-motion preferences.

Every portal route passes the performance audit or has a documented known issue with a mitigation. The top ten routes by cold-render time are measured and recorded.

Every portal write path emits into the right observability surface. Every portal send produces a structured send log record. Every portal AI call produces a structured log record. Every portal workflow trigger produces an automation event. Every portal error produces a structured error record reachable without supplier-side tooling.

The permission matrix audit runs. No data-leak-class cell fails. Non-data-leak failing cells are fixed or documented with a mitigation.

The commerce portal-first UI carryover is disposed. The operations and content UI-depth gap is disposed namespace by namespace. Every disposition is recorded.

The memory bank files, the foundation note, and the repository-root handoff document are finalized.

The Section 16 acceptance run-through passes. Any pass-with-note is carried into `memory-bank/progress.md` as a post-acceptance maintenance item.

---

## 9. Completion Gates

The agent does not declare the session complete, and therefore does not declare the portal overhaul complete, until every gate below is met.

Every audit output required by focus areas 4.3 through 4.9, 4.11, 4.12, and 4.13 is recorded in the session handoff note, the foundation note, or the memory bank as appropriate.

Every migration introduced by this session — if any, and only if the focus area 4.13 primitive extension required one — has been applied through the Supabase MCP against project nfirsqmyxmmtbignofgb, on staging first and verified, before any production application.

Every new vitest test and every modified vitest test passes. The Sessions 1 through 5 tests continue to pass.

Every polish change routes its reads and writes through the portal data access layer. No polish change introduces a new primitive, a new permission mechanism, a new data access mechanism, a new audit mechanism, a new communication mechanism, or a new logging mechanism, except for the single focus area 4.13 exception described in focus area 4.13 itself.

`memory-bank/activeContext.md` is updated to mark the portal overhaul complete and to shift the active focus to maintenance. `memory-bank/progress.md` is updated with the completion status of every portal workstream, the disposition of every open question from Section 15, and the post-acceptance maintenance items carried over from the Section 16 run-through. `memory-bank/systemPatterns.md` is extended with the portal-patterns appendix.

The foundation note is extended with the Session 6 appendix covering the audit outputs and the final open-question dispositions.

The repository-root handoff document is produced. It summarizes the portal overhaul from Session 1 through Session 6, names the final namespace list, the final invariants, the final event catalog, and the final known-issues list, and points future maintainers at the session briefs and the foundation note for detail.

A Vercel preview build succeeds on the Session 6 branch. Supabase advisors produce no new warnings on any table modified in this session.

The Section 16 acceptance run-through closes with no blocking failures.

---

## 10. Agent Operating Context

This section restates the operating contract from Section 17 of the master brief in the form that applies to Session six specifically. The authoritative version lives in the master brief and is the one to consult in case of ambiguity.

The agent executing this session has full access to the Supabase MCP against project nfirsqmyxmmtbignofgb, to the Vercel MCP, to the Cloudflare MCP, to the Context7 MCP, and to the Paddle MCP. The agent has workspace file system access, terminal access, and the ability to run vitest, playwright, tsc, and pnpm scripts.

Every migration introduced by this session, should any be required by focus area 4.13, is applied by the agent through the Supabase MCP. The agent does not produce a dot-sql file for the user to paste into the Supabase SQL editor. The agent may record the migration in the migrations folder for version history; it still applies the migration itself.

Every authentication or role change, should any be required, is performed by the agent through the Supabase admin REST API. The agent does not ask the user to create auth users, reset passwords, or link identifiers.

Every seed or backfill required by this session is produced and run by the agent against the staging database. The agent does not ask the user to execute a script.

Every deployment verification is performed by the agent through the Vercel MCP. Every documentation lookup for libraries or framework behavior is performed by the agent through the Context7 MCP where the agent's training data may be stale. Every Cloudflare DNS question arising from the focus area 4.4 white-label audit is answered through the Cloudflare MCP for records under Cloudflare management and through the agency-side domains service for supplier-managed records, without exposing any supplier-adjacent field to the client.

Destructive production actions, and only those, require explicit user confirmation before execution. For this session, a destructive production action would include, for example, dropping or truncating a production table; bulk-deleting production records; bulk-reconfiguring production DNS; bulk-reprovisioning or deprovisioning production mailboxes; cancelling a live subscription without a user-initiated request; removing a production domain; or force-merging a schema change in a way that discards existing records. If such an action becomes necessary, the agent prepares the full change, explains the blast radius, asks the user to confirm, and then executes the action itself rather than handing a command to the user.

The rule, restated in one line for emphasis: nothing in this session is handed back to the user for manual execution. Everything needed to ship Session six, and therefore the portal overhaul, is provided to the agent.

---

## 11. Handoff After Session 6

Session six is the last session. There is no Session seven. On Session six's completion, the portal overhaul is complete by the definition of Section 16 of the master brief.

The handoff after Session six is therefore not to another overhaul session; it is to the maintenance model the platform runs under. The repository-root handoff document produced by focus area 4.10 describes that maintenance model. It names the final namespace list, the final invariants, the final event catalog, the final known-issues list, the memory bank files to consult at the start of any future portal session, the foundation note appendices, and the session briefs to reference when a question about historical decision making arises.

Three classes of post-acceptance work are named but not scheduled in the handoff document. The first is post-acceptance minor sessions to close any deferred disposition from focus areas 4.1 and 4.2 — for example, a portal-first list and detail for customers, quotes, and bookings if deferred, or a richer depth polish on any namespace deferred to a minor session. The second is post-acceptance observability pruning to remove any unused event consumer noted in focus area 4.7. The third is post-acceptance maintenance items carried into `memory-bank/progress.md` from the Section 16 run-through.

No Session-6 focus area rolls a task to a hypothetical Session 7. If a focus area cannot close inside Session 6, it either lands before Session 6 closes or it is explicitly recorded as a post-acceptance minor session in the handoff document with a reason. Session 6 is the gate.

The portal overhaul closes here.

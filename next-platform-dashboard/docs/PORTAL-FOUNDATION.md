# Portal Foundation (Session 1)

This document describes the rebuilt client portal foundation delivered in
Session 1 of the Client Portal Overhaul. Future sessions (2-7) MUST build
on these primitives rather than re-implementing auth, permission checks,
data access, or audit logging.

## Architecture

```
Request → middleware → layout (portal-auth) → page (RSC)
                              │
                              ├─→ resolveClientSites() ─┐
                              └─→ resolveActiveSiteId() │ cache() per-request
                                                         │
                  page → createPortalDAL({ user, ...}) ──┘
                              │
                              ├─ sites.list()            → resolveClientSites
                              ├─ orders.summaryForSite() → checkPortalPermission
                              └─ conversations.summaryForSite() ↘
                                                                 audit-log
```

Every entry point into tenant data flows through
`checkPortalPermission(ctx, siteId, flag)` which validates both
**tenancy** (site belongs to client) and **permission** (effective flag
is true). Denied requests emit a `portal.permission.*` audit entry and
throw `PortalAccessDeniedError` — they never reach the database.

## Key Primitives

### `createPortalDAL(ctx)` — `src/lib/portal/data-access.ts`

The only sanctioned way to read tenant-scoped data from portal server
components and server actions. `ctx` shape:

```ts
{
  user: PortalUser; // from getPortalSession().user
  isImpersonation: boolean; // from getPortalSession().isImpersonating
  impersonatorEmail: string | null;
}
```

Current surface:

- `dal.sites.list()` — all sites the client owns
- `dal.orders.summaryForSite(siteId)` — requires `canManageOrders`
- `dal.conversations.summaryForSite(siteId)` — requires `canManageLiveChat`

Extend by adding a namespace (e.g. `dal.bookings`) that funnels through
`requireScope(siteId, flag)` before issuing its query. **Never read
tenant data directly from the admin client in portal code.**

### `resolveSiteScope(clientId, siteId)` — permission resolver

React `cache()`-memoised per request. Returns `null` for cross-tenant
siteIds. Used internally by `checkPortalPermission`; call it directly
only when you need the scope without a permission check (rare).

### `resolveClientSites(clientId)` — permission resolver

React `cache()`-memoised per request. Returns `{id,name,subdomain,customDomain,isPublished}[]`.
Drives the site switcher and the sites panel without hitting the DB twice.

### `resolveActiveSiteId(clientId, preferredSiteId?)` — `src/lib/portal/active-site.ts`

Reads the `portal_active_site` cookie; falls back to `preferredSiteId`;
falls back to the client's first site. Use `setPortalActiveSite(siteId)`
as a server action (called by the site switcher) to persist a choice.

### `writePortalAudit(entry)` / `auditPortalDenied(entry)` — `src/lib/portal/audit-log.ts`

Every sensitive action (data read/write, permission denial,
impersonation start/stop) must write an audit entry. The DAL already
emits `portal.permission.*` denials automatically; explicit mutations
should call `writePortalAudit` with a domain-specific `action`
(e.g. `portal.orders.status_change`).

### `logPortalEvent` / `withPortalEvent` — `src/lib/portal/observability.ts`

Structured logging wrapper. Prefer `withPortalEvent("event.name", ctx, fn)`
around any async DAL or server-action work — it emits start/success/fail
events with duration and ties them to the portal session.

## UI Primitives

All under `src/components/portal/`:

- `portal-header.tsx` — top bar (sign-out, impersonation banner, site switcher)
- `site-switcher.tsx` — persistent switcher, mobile Sheet / desktop Popover
- `dashboard/portal-sites-panel.tsx` — sites summary card (RSC)
- `dashboard/portal-orders-panel.tsx` — orders summary card (RSC, gated on `canManageOrders`)
- `dashboard/portal-live-chat-panel.tsx` — live chat summary card (RSC, gated on `canManageLiveChat`)
- `patterns/` — `PortalEmptyState`, `PortalErrorState`, `PortalPanelSkeleton`, `PortalPanelBoundary`

Wrap every RSC panel in `<PortalPanelBoundary><Suspense fallback={<PortalPanelSkeleton />}>` so a single panel failure never takes down the dashboard. Session 2+ should follow this contract.

## Permissions

`PortalUser` exposes **flat** permission booleans (no `.permissions`
nesting). Current flags:

- `canViewAnalytics`, `canEditContent`, `canViewInvoices`
- `canManageLiveChat`, `canManageOrders`, `canManageProducts`
- `canManageBookings`, `canManageCrm`, `canManageAutomation`
- `canManageQuotes`, `canManageAgents`, `canManageCustomers`
- `canManageMarketing`, `canManageInvoices`

Server components gate UI rendering on `user.canManageX`; the DAL enforces the same flag at the data boundary. **Never trust the UI gate alone — always pass through the DAL.**

## Impersonation

Preserved from the prior portal. `impersonateClient(clientId)` /
`stopImpersonatingClient()` server actions in `src/lib/portal/impersonation.ts`.
The header displays a yellow banner with "Actions are being logged" when
`getPortalSession().isImpersonating === true`. All DAL reads during
impersonation write the impersonator's email to the audit entry.

## Testing

Vitest config at `next-platform-dashboard/vitest.config.ts`. Portal unit
tests live under `src/lib/portal/__tests__/`:

- `permission-resolver.test.ts` — 4 tests covering allow/deny/site-not-found
- `data-access.test.ts` — 4 tests covering cross-tenant protection and audit emission

Run: `npx vitest run src/lib/portal/__tests__`

E2E coverage (Playwright) is deferred to Session 6.

## Seed

`scripts/seed-portal-tenancy.ts` — 2 agencies × 2 clients × 2 sites,
deterministic UUIDs, all permission flags true. Requires
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`:

```powershell
npx tsx scripts/seed-portal-tenancy.ts
```

After seeding, link each client's `portal_user_id` to a real Supabase
auth user to enable sign-in.

## Migration

`migrations/portal-01-foundation.sql` at the repo root adds the audit
log table, portal session cookie helpers, and indexes required by the
resolver. Apply via:

```
mcp_supabase_apply_migration (project: nfirsqmyxmmtbignofgb)
```

or paste the SQL into the Supabase SQL editor.

## Checklist for Session 2+ authors

- [ ] Use `createPortalDAL(ctx)` for ALL tenant reads/writes
- [ ] Gate RSC panels on the matching `user.canManageX` flag
- [ ] Wrap panels in `PortalPanelBoundary` + `Suspense`
- [ ] Emit `writePortalAudit` for every sensitive action
- [ ] Wrap async work in `withPortalEvent`
- [ ] Write a Vitest for each new DAL method covering allow + deny
- [ ] Honor `resolveActiveSiteId` instead of reading cookies directly

---

## Session 2A — Communication Foundation

Session 2A added the tenant-aware **notification dispatcher**, the shared
**portal_send_log** observability table, a **Resend webhook** for email
delivery feedback, and **conversation / notification** methods on the Portal
DAL. Full details are in
[CLIENT-PORTAL-SESSION-2-COMMUNICATION.md](../../CLIENT-PORTAL-SESSION-2-COMMUNICATION.md)
and in the migration file
[portal-02-communication.sql](../../migrations/portal-02-communication.sql).

### Notification Dispatcher

`src/lib/portal/notification-dispatcher.ts` exports `dispatchBusinessEvent`,
the single fanout primitive for all business events. It resolves recipients
(agency owner → permissioned portal users → assigned agents) with dedupe,
applies per-user preferences, then writes the in-app notification, enqueues
web push, and sends email (if the caller supplied `email`). Every delivery
attempt writes one row to `portal_send_log`. Legacy `business-notifications.ts`
keeps its owner-email / owner-push paths and passes `excludeUserIds` so
portal-users don't double-receive.

### Send Log

`src/lib/portal/send-log.ts` is the thin wrapper over `portal_send_log`. Use
`writeSendLog` at emission time and `updateSendLogState` when the provider
reports back (Resend webhook for email, internal handlers for push / AI).
`findSendLogByProviderMessageId` is used by webhook reconciliation.

### Resend Webhook

`POST /api/webhooks/resend` verifies the Svix signature (base64 `whsec_` key),
maps `email.sent|delivered|bounced|complained|failed|opened|clicked` to
`{ emailStatus, deliveryState }`, updates the matching `email_logs` row by
`resend_message_id`, and then updates `portal_send_log.delivery_state` via the
row's `send_log_id`. Set `RESEND_WEBHOOK_SECRET` in production; the handler
refuses unsigned requests when running outside of `development`.

### Realtime Subscriptions

Portal pages subscribe to five Supabase Realtime channels. All channels are
tenant-scoped; a `(user_id | site_id)` filter is the only cross-tenant barrier,
so **the filter is mandatory** on every `.channel()` call.

| Channel                       | Event / Filter                         | Source table             | Reachable via DAL?                                                                                    |
| ----------------------------- | -------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `notification-bell-${userId}` | `INSERT` where `user_id = :userId`     | `notifications`          | `notifications.list`, `notifications.unreadCount`                                                     |
| `chat:${conversationId}`      | `INSERT` where `conversation_id = :id` | `mod_chat_messages`      | `conversations.messages(...)` — hides `is_internal_note = true` unless caller has `canManageLiveChat` |
| `conversations:${siteId}`     | `UPDATE` where `site_id = :siteId`     | `mod_chat_conversations` | `conversations.list(siteId)`                                                                          |
| `presence:chat:${siteId}`     | presence state (no DB)                 | —                        | n/a (UI-only)                                                                                         |
| `portal-events:${siteId}`     | broadcast (server `sendBroadcast`)     | —                        | n/a                                                                                                   |

Client subscriptions **must** apply the same filter server-side that the DAL
would apply; the DAL is the source of truth for what a portal user is allowed
to see. For internal notes in `chat:${conversationId}`, either (a) gate the
channel on `canManageLiveChat` before subscribing or (b) filter
`is_internal_note = true` on the client for non-permissioned users — option
(a) is preferred because it avoids leaking row counts via timing.

### Internal Note Security — 5 Layers

1. **Storage**: `mod_chat_messages.is_internal_note BOOLEAN` marks rows as
   internal.
2. **DAL default**: `conversations.messages(...)` excludes internal notes
   unless the caller passes `{ includeNotes: true }` **and** holds
   `canManageLiveChat`.
3. **Dispatcher safety**: note content is never embedded in the notification
   dispatcher's `message` / `push.body` / `email.data` — notes are siloed
   away from outbound surfaces.
4. **Public endpoints**: visitor-facing chat endpoints (widget, WhatsApp echo)
   must hard-filter `is_internal_note = false`. This is asserted by
   `src/lib/portal/__tests__/internal-note-security.test.ts`.
5. **Permission gate**: `conversations.notes(...)` requires
   `canManageLiveChat` and writes a `portal.conversation.notes.view` audit
   entry on every access.


---

## Session 3 — Commerce Foundation

Session 3 extends the Portal DAL with six commerce namespaces: `orders` (new
extension methods), `products`, `customers`, `quotes`, `bookings`, and
`payments`. All live in `src/lib/portal/commerce-data-access.ts` and are wired
onto `createPortalDAL(ctx)` alongside the Session 1/2 surfaces. Every method
follows the same contract established by the foundation:

1. `requireScope(ctx, siteId, "canManageX")` — audits denials, throws
   `PortalAccessDeniedError` before any DB reach.
2. `withPortalEvent("portal.dal.<ns>.<op>", …, async () => { … })` — emits a
   structured start/ok/err timing event.
3. `admin.from("mod_…").eq("site_id", scope.siteId)` — every query is scoped.
4. Writes call `writePortalAudit` + `logAutomationEvent` with the keys below.

### Namespaces

- **orders** (extensions): `list`, `detail`, `updateStatus`, `recordShipment`,
  `issueRefund`, `addInternalNote`.
- **products**: `list`, `detail`, `adjustInventory`, `lowStockAlerts`.
- **customers**: `list`, `detail` (read-only — PII, locked behind
  `canManageCustomers`).
- **quotes**: `list`, `detail`, `send`, `accept`, `reject`,
  `convertToOrder`.
- **bookings**: `list`, `detail`, `updateStatus`, `cancel` on
  `mod_booking_appointments`.
- **payments**: `listProofs`, `approveProof`, `rejectProof`, `bulkReview`.

### Payment Proofs — storage model

**Payment proofs are NOT a separate table.** The customer-facing storefront
(`modules/ecommerce/actions/public-ecommerce-actions.ts#uploadPaymentProof`)
writes directly into
`mod_ecommod01_orders.metadata.payment_proof` as a JSON object:

```jsonc
{
  "storage_path": "<site>/<order>/<uuid>.png",
  "file_name": "receipt.png",
  "content_type": "image/png",
  "file_size": 123456,
  "uploaded_at": "2026-02-17T16:35:03.000Z",
  "status": "pending_review",  // normalized to "pending" by the DAL
  "reviewer_id": null,
  "reviewed_at": null,
  "reason": null
}
```

The DAL queries `mod_ecommod01_orders` with
`.not("metadata->payment_proof", "is", null)` and uses the **order id** as the
proof's stable handle. Approvals merge a patch back into
`metadata.payment_proof` (status + reviewer + timestamp) and also flip
`payment_status = "paid"` and `status = "confirmed"` on the order itself.
Rejections require a reason (min. 3 chars), which is surfaced to the
customer via the standard notification dispatcher.

The portal signs storage URLs on demand via `admin.storage.from("payment-proofs")
.createSignedUrl(storagePath, 60 * 5)` — the bucket is private and the URL
expires after 5 minutes.

### Emitted Automation Events

All writes emit one or more of the following event keys (all verified against
`EVENT_REGISTRY` in `src/modules/automation/lib/event-types.ts`):

- `ecommerce.order.status_changed`, `ecommerce.order.shipped`,
  `ecommerce.order.refunded`, `ecommerce.order.note_added`.
- `ecommerce.product.stock_adjusted`, `ecommerce.product.low_stock`.
- `ecommerce.quote.sent`, `ecommerce.quote.accepted`,
  `ecommerce.quote.rejected`, `ecommerce.quote.converted_to_order`.
- `booking.appointment.status_changed`, `booking.appointment.cancelled`.
- `ecommerce.payment.received` (proof approved),
  `ecommerce.payment.proof_rejected`.

Every payload includes `site_id` (implicit via the channel), amounts in
**minor units** (`*_cents`), `currency`, `source: "portal"`, and
`actor_user_id`.

### Money Invariants

All monetary values crossing the DAL are **cents (minor units)**. Helpers in
`src/lib/money.ts`:

- `toCents(decimal, currency)` — parse DB `NUMERIC` or storefront strings.
- `fromCents(cents, currency)` — format for UI.
- Locally in `commerce-data-access.ts`: `decimalToCents(v)` clamps to ≥0 and
  handles `null | string | number`.

Refund amounts, order totals, product prices, quote line items, proof amounts
— all normalized to cents before any portal surface reads them.

### Portal-First Payment Proofs UI

`src/app/portal/sites/[siteId]/payment-proofs/` is the first **portal-first**
commerce surface that uses the DAL end-to-end:

- `page.tsx` — RSC that calls `dal.payments.listProofs(siteId, { status })`.
- `proofs-queue.tsx` — client component with checkbox multi-select, per-row
  approve / reject, bulk approve / reject with reason dialog, and a signed-URL
  preview link.
- `_actions.ts` — server actions (`approvePaymentProofAction`,
  `rejectPaymentProofAction`, `bulkReviewPaymentProofsAction`,
  `signPaymentProofUrlAction`) wrap the DAL and `revalidatePath` on success.

The other commerce routes (`orders`, `products`, `customers`, `quotes`,
`bookings`) continue to mount the shared `EcommerceDashboard` inside a
`PortalProvider`; the DAL is now available to them as a portal-specific write
path for follow-on portal-first refactors without touching agency surfaces.

### Tests

`src/lib/portal/__tests__/commerce-dal.test.ts` — 13 deny-path assertions
covering `orders.list/detail/updateStatus`, `products.list/adjustInventory`,
`customers.list`, `quotes.list/convertToOrder`, `bookings.list/updateStatus`,
and `payments.listProofs/approveProof/rejectProof`. Every test verifies that
`auditPortalDenied` is written and that the admin Supabase client is NEVER
invoked when the scope check fails — the same contract enforced by Session 1
and Session 2A tests.

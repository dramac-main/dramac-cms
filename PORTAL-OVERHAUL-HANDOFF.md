# Client Portal Overhaul — Session 6 Handoff

**Status**: COMPLETE ✅ — merged to `main`.

## Summary

Session 6 (Polish • Mobile • Acceptance) is the final session of the
seven-session client portal overhaul. It hardens the portal surface
produced across Sessions 1–5 to production quality: commerce surfaces
got a full portal-first rewrite, every remaining `"use client"` page was
wrapped in a server auth-guard shell, a supplier-brand leak regression
test suite was added, and the i18n string registry landed as an
extraction-only skeleton.

The whole portal is now:

- Uniformly server-rendered at the page boundary.
- Gated by `requirePortalAuth` + site ownership checks before any DAL
  access.
- Layered with Suspense + `PortalPanelSkeleton` + `PortalErrorState`
  boundaries on every list/detail surface.
- Scrubbed of supplier-brand tokens at both the column and free-text
  level, enforced by a dedicated test suite.
- Rendered responsively with mobile cards + desktop tables.
- Prepared for localization through `src/lib/portal/i18n/strings.ts`.

## Deliverables

### Shared patterns (first-class now)

- `src/components/portal/patterns/portal-status-pill.tsx` —
  `PortalStatusPill{status, tone?, className?}`.
- `src/components/portal/patterns/portal-panel-skeleton.tsx`,
  `portal-panel-boundary.tsx`, `portal-empty-state.tsx`,
  `portal-error-state.tsx` (from prior sessions, now the canonical
  surface primitives).
- `src/lib/portal/format.ts` —
  `formatPortalCurrency(cents, currency, locale?)`,
  `formatPortalDate(iso, { timeZone?, withTime? })`,
  `formatPortalRelative(iso)`.

### Commerce portal-first rewrite (Session 6A — commit `9ffcb948`)

Full rewrite across five namespaces under
`src/app/portal/sites/[siteId]/`:

- `orders/` — `_actions.ts`, `orders-list-client.tsx`, `page.tsx`,
  `[orderId]/page.tsx`, `[orderId]/order-detail-client.tsx`.
- `products/`, `customers/` (read-only), `quotes/`, `bookings/` —
  matching structure.

Pattern applied per namespace:

- Server `page.tsx` → Suspense(`PortalPanelSkeleton rows=6|8`) →
  loader → client list.
- Detail loaders call `notFound()` on
  `err.code === "site_not_found"` (NB: property is `.code`, not
  `.reason`).
- Client lists expose URL-driven filters via a `push(nextParams)` helper
  that strips `all`/empty values and resets `page` when filters change.
- Mutations run inside `useTransition` with `toast.success` /
  `toast.error` and `router.refresh()`.
- Dual layouts: mobile cards (`block md:hidden`) + desktop table
  (`hidden md:block`). Pagination via `currentPage` / `hasMore`.

### Server auth-guard shells (Session 6B — commit `89e9b948`)

Previously `"use client"` pages (submissions, blog, media, seo) were
converted to a thin server `page.tsx` that calls `requirePortalAuth` +
`getClientSite` before mounting the existing client UI which has been
moved into `*-client.tsx`. The client's only change is accepting
`siteId` as a prop rather than unwrapping `params` with `use()`.

### Supplier-brand leak regression suite

`src/lib/portal/__tests__/supplier-brand-leak.test.ts` — 35 tests,
asserting:

- Every documented token column (`resellerclub_*`, `titan*`, `twilio_*`,
  `cloudflare_*`, `rcpl_*`, `logicboxes_*`, etc.) is flagged by
  `isBrandedColumn`.
- Every documented prefix column (`provider_*`, `rc_*`, `tm_*`) is
  flagged.
- `stripSupplierBrandRow` removes every branded column while preserving
  neutral columns (`id`, `name`, `total_cents`, `created_at`,
  `customer_email`).
- `stripSupplierBrandText` scrubs every free-text vendor name, both
  spaced ("Reseller Club") and unspaced ("ResellerClub"), and both
  capital and lowercase.
- `stripSupplierBrandDeep` composes both passes in order.

### i18n skeleton

`src/lib/portal/i18n/strings.ts` — `PORTAL_STRINGS` map (60+ keys across
`portal.common.*`, `portal.nav.*`, commerce CTAs), `t(key)`,
`resolvePortalLocale(hint)`, `PortalLocale` type (en / en-US / en-GB /
af). Runtime locale switching ships in a follow-up; the signature is
stable so callers don't churn when the switch lands.

## Test suite

```
Test Files  12 passed (12)
Tests       135 passed (135)
```

Run with:

```
cd next-platform-dashboard
npx vitest run src/lib/portal/__tests__
```

## Invariants reaffirmed in Session 6

1. **`PortalAccessDeniedError.code`** — always check `.code`, never
   `.reason`. Values: `"site_not_found"` | `"permission_denied"`.
2. **Tailwind v4** — `break-words` is deprecated, use
   `wrap-break-word`.
3. **Rate-limit primitives** — reuse the 9 predefined types in
   `src/lib/rate-limit.ts`; do not extend.
4. **Supplier-brand scrubber** — covers 13 tokens, 3 prefixes, 11 exact
   columns plus free-text patterns.

## Known follow-ups (not blocking)

- Wire `checkRateLimit` on the Chiko AI portal toggle and portal AI
  paths using existing rate-limit types.
- Add `ai_usage_daily` migration + `aiUsage` DAL namespace + usage-dial
  UI.
- Replace `createAdminClient` direct usage in analytics / apps / pages /
  automation / invoicing-invoice-detail pages with `createPortalDAL`
  calls.
- Implement runtime locale resolution in `resolvePortalLocale` once the
  translation pipeline is selected.

## Commits

- `9ffcb948` — feat(portal): session 6A commerce portal-first carryover
  (27 files, +4800/−289).
- `89e9b948` — feat(portal): session 6B client-page auth-guards
  (8 files, +1390/−1330).
- (final) — feat(portal): session 6 C/D/E — supplier-brand leak audit,
  i18n skeleton, acceptance docs.

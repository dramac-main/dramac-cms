# Ecommerce Module — Hardcoded Color Audit

**Generated:** 2026-02-18  
**Scope:** `src/modules/ecommerce/studio/components/`, `src/modules/ecommerce/components/`, `src/modules/ecommerce/widgets/`  
**Also checked:** `storefront-context.tsx`, `studio/index.ts`, `lib/` utilities, `types/`

---

## Executive Summary

| Category | Count |
|---|---|
| Files with hardcoded colors | **~85 of ~200 component files** |
| `dark:` Tailwind classes | **250+ instances** (200+ in `components/`, 52 in `studio/`, 2 in `widgets/`) |
| Hardcoded `bg-gray/white/black` | **142+ instances** |
| Hardcoded `text-gray/slate` | **200+ instances** |
| Hardcoded semantic colors (`bg-green/red/blue/yellow/amber/…`) | **200+ instances** |
| Hardcoded `border-` colors | **160 instances** |
| Hex color literals (`#rrggbb`) | **100+ instances** |
| `colorScheme` / `color-scheme` | **1 instance** (useMobile.ts — media query, acceptable) |
| Components accepting color props | **3 files** (StorefrontWidget, quote-pdf-generator, quote-template-dialog) |
| **StorefrontContext exposes brand colors?** | **❌ NO** — only currency, tax, quotation mode |

### Critical Finding

**`storefront-context.tsx` provides NO color, brand, or theme settings.** It only exposes `currency`, `currencySymbol`, `taxRate`, `formatPrice`, and quotation mode flags. There is no mechanism for storefront components to consume site brand colors. This is the root cause — **there is no brand color system for studio components to use.**

The `EcommerceSettings` type DOES have a `primary_color` field (in `ecommerce-types.ts` L1902, L1935), but **it is not exposed via StorefrontContext**, so studio/storefront components have no way to access it.

---

## Classification of Findings

### 🔴 P0 — Architecture Gap: No Brand Color Pipeline

The storefront-context does not expose `primary_color` or any theme colors from `EcommerceSettings`. Until this is fixed, all studio components will necessarily use hardcoded colors.

**Fix required in:** `storefront-context.tsx` — add `primaryColor`, `accentColor`, etc. to the context value, derived from `settings.primary_color`.

### 🟡 P1 — Storefront (Studio) Components: Hardcoded Colors

These are **customer-facing** and MUST respect site brand settings. Currently all use hardcoded Tailwind colors.

### 🟢 P2 — Dashboard Components: Hardcoded Colors

These are **admin-facing** and use the dashboard theme (shadcn/ui). Hardcoded semantic colors for status badges (green=active, red=error, yellow=warning) are **standard practice** for dashboards. However, they should use CSS variables (`text-destructive`, `bg-muted`, etc.) where possible.

### ⚪ P3 — Acceptable / Intentional

Hex colors for chart libraries (Recharts requires hex), variant color swatches (product color options), and `prefers-color-scheme` media queries.

---

## Per-File Detailed Findings

### A. `widgets/StorefrontWidget.tsx` — Embeddable Widget

| Metric | Value |
|---|---|
| Hex literals | **16** |
| `dark:` classes | 2 (isDark prop-based) |
| Accepts color props? | ✅ Yes (`primaryColor`, `isDark`) |

**This is the ONLY component that accepts `primaryColor` as a prop.** However, it still has 16 hardcoded hex fallbacks:

| Line | Hardcoded Value | Purpose |
|---|---|---|
| 282 | `#2563eb` | Default primaryColor |
| 904 | `#ffffff` | Light mode background |
| 905 | `#1f2937` | Light mode text |
| 909 | `#1f2937` | Dark mode background |
| 910 | `#f9fafb` | Dark mode text |
| 1048 | `#ef4444` | Sale badge bg |
| 1082 | `#ef4444` | Sale price color |
| 1237 | `#ffffff` | Cart light bg |
| 1245 | `#1f2937` | Cart dark bg |
| 1277 | `#fee2e2` | Error bg |
| 1278 | `#dc2626` | Error text |
| 1387 | `#ef4444` | Remove button |
| 1442 | `#ef4444` | Validation error |
| 1452 | `#22c55e` | Success message |
| 1453 | `#ef4444` | Error message |
| 1469 | `#22c55e` | Free shipping text |

---

### B. Studio Components (Storefront-Facing) — 65 Files

#### B1. `ProductStockBadge.tsx` — 🔴 P1

| Count | 12 `dark:` + 8 semantic colors |
|---|---|
| Accepts color props? | ❌ No |

| Lines | Hardcoded |
|---|---|
| 74 | `bg-green-100 dark:bg-green-900/30` (in-stock) |
| 75 | `text-green-700 dark:text-green-400` |
| 76 | `text-green-600 dark:text-green-500` |
| 81 | `bg-amber-100 dark:bg-amber-900/30` (low stock) |
| 82 | `text-amber-700 dark:text-amber-400` |
| 83 | `text-amber-600 dark:text-amber-500` |
| 88 | `bg-red-100 dark:bg-red-900/30` (out of stock) |
| 89 | `text-red-700 dark:text-red-400` |
| 90 | `text-red-600 dark:text-red-500` |
| 95 | `bg-blue-100 dark:bg-blue-900/30` (pre-order) |
| 96 | `text-blue-700 dark:text-blue-400` |
| 97 | `text-blue-600 dark:text-blue-500` |

#### B2. `ProductPriceDisplay.tsx` — 🔴 P1

| Count | 1 `dark:` + 1 semantic |
|---|---|
| Accepts color props? | ❌ No |

| Line | Hardcoded |
|---|---|
| 89 | `text-red-600 dark:text-red-500` (discount price) |

#### B3. `ProductRatingDisplay.tsx` — 🟡 P1

| Count | 4 `dark:` + 2 semantic |
|---|---|
| Lines | `text-gray-300 dark:text-gray-600` (empty stars, L70, L85) |
| | `fill-amber-400 text-amber-400` (filled stars, L62, L75) |

#### B4. `ProductDetailBlock.tsx` — 🔴 P1

| Count | 1 `text-gray-300` + 3 semantic + 4 `bg-gray/white/black` + 3 `border-gray` |
|---|---|
| Lines | `bg-gray-100` (L194), `bg-black` (L206 overlay), `bg-white` (L215, L221) |
| | `fill-yellow-400 text-yellow-400` (stars L69-70), `text-gray-300` (empty star L71) |
| | `text-green-600` (in-stock L292-293), `text-red-500` (out-of-stock L299-300) |
| | `fill-red-500 text-red-500` (wishlist L376) |
| | `border-gray-200 hover:border-gray-300` (variant selector L318) |

#### B5. `product-card-block.tsx` — 🔴 P1

| Count | 4 semantic + 2 `bg-white` |
|---|---|
| Lines | `bg-red-500 text-white` (sale badge L290) |
| | `bg-orange-500 hover:bg-orange-600` (pre-order L321) |
| | `text-red-500` / `hover:text-red-500` (wishlist L269) |
| | `bg-white/90` (overlay L268, L279) |

#### B6. `CartDiscountInput.tsx` — 🔴 P1

| Count | 4 `dark:` + 4 semantic |
|---|---|
| Lines | `bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800` (L89) |
| | `text-green-600 dark:text-green-400` (tag icon L91) |
| | `text-green-700 dark:text-green-300` (discount text L96) |

#### B7. `CartSummaryCard.tsx` — 🔴 P1

| Count | 2 `dark:` + 2 semantic |
|---|---|
| Lines | `text-green-600 dark:text-green-400` (discount labels L78-79) |

#### B8. `OrderSummaryCard.tsx` — 🔴 P1

| Count | 2 `dark:` + 2 semantic |
|---|---|
| Lines | `text-green-600 dark:text-green-400` (discount L169-170) |

#### B9. `OrderConfirmationBlock.tsx` — 🔴 P1

| Count | 3 `dark:` + 6 semantic |
|---|---|
| Lines | `bg-green-100 dark:bg-green-900/30` (success circle L149) |
| | `text-green-600 dark:text-green-400` (check icon L150) |
| | `text-green-600` (check L172, payment confirmed L229, discount L330-331) |

#### B10. `CheckoutPageBlock.tsx` — 🔴 P1

| Count | 2 `dark:` + 2 semantic |
|---|---|
| Lines | `bg-green-100 dark:bg-green-900` (success L355) |
| | `text-green-600 dark:text-green-400` (shield icon L356) |

#### B11. `ReviewFormBlock.tsx` — 🔴 P1

| Count | 5 `dark:` + 7 semantic |
|---|---|
| Lines | `border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900` (success L146) |
| | `text-green-500` (check icon L149), `text-green-700 dark:text-green-400` (L150) |
| | `text-green-600 dark:text-green-500` (L153) |
| | `fill-amber-400 text-amber-400` (stars L68) |
| | `text-red-500` (required asterisks L170, L179) |
| | `text-red-600 dark:text-red-400` (error L241) |

#### B12. `ReviewListBlock.tsx` — 🔴 P1

| Count | 2 `dark:` + 4 semantic |
|---|---|
| Lines | `bg-amber-400` (rating bar L62), `fill-amber-400 text-amber-400` (stars L58, L90) |
| | `text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30` (verified L128) |

#### B13. `QuoteStatusBadge.tsx` — 🔴 P1 (Status Map)

| Count | 7 status colors × 3 props = 21 hardcoded values |
|---|---|
| Lines | L53-110: Full status→color map: draft=`gray`, pending=`amber`, sent=`blue`, reviewed=`indigo`, accepted=`green`, rejected=`red`, expired=`gray`, countered=`orange`, converted=`teal` |

#### B14. `QuoteRequestBlock.tsx` — 🔴 P1

| Count | 16 `text-gray-*` + 7 `bg-gray-*` + 6 `border-red-500` + 4 `text-red-500` + 1 `text-green-600` |
|---|---|
| Massive use of gray-scale (text-gray-300/400/500/600/900) throughout. |

#### B15. `QuotePriceBreakdown.tsx` — 🔴 P1

| Count | 8 `text-gray-*` + 2 `bg-gray-50` + 3 `text-green-*` |
|---|---|

#### B16. `QuoteListBlock.tsx` — 🔴 P1

| Count | 20+ `text-gray-*` + 3 `bg-gray/white` + 1 `text-red-600` + 1 `border-red-200 bg-red-50` |
|---|---|

#### B17. `QuoteItemCard.tsx` — 🔴 P1

| Count | 15+ `text-gray-*` + 2 `bg-gray-100` + 1 `bg-white` + 2 `text-red-*` + 1 `text-green-600` |
|---|---|

#### B18. `QuoteDetailBlock.tsx` — 🔴 P1

| Count | 16+ `text-gray-*` + 1 `bg-white` + 1 `bg-gray-300` |
|---|---|

#### B19. `QuoteActionButtons.tsx` — 🟡 P1

| Count | 3 semantic |
|---|---|
| Lines | `bg-green-600 hover:bg-green-700` (accept L169, L294) |
| | `text-red-600 border-red-300 hover:bg-red-50` (decline L180) |
| | `text-gray-500` (L234) |

#### B20. `CategoryHeroBlock.tsx` — 🔴 P1

| Count | 1 `bg-black` + 3 `text-gray-*` |
|---|---|
| Lines | `bg-black` (fallback bg L158), `text-gray-900` (L168), `text-gray-600` (L176), `text-gray-500` (L185) |

#### B21. `FilterSidebarBlock.tsx` — 🟡 P1

| Lines | `fill-yellow-400 text-yellow-400` (rating filter L372) |

#### B22. Mobile Components (22 files)

##### `MobileQuickView.tsx` — 🔴 P1
| Count | 11 hex color literals + 4 semantic |
|---|---|
| Lines | L55-65: Full color→hex swatch map (red, blue, green, yellow, purple, pink, orange, black, white, gray, grey) |
| | `fill-red-500 text-red-500` (wishlist L284), `bg-green-600 hover:bg-green-700` (added-to-cart L509) |
| | `text-amber-600 border-amber-600` (pre-order badge L472) |

##### `MobileVariantSelector.tsx` — 🔴 P1
| Count | 16 hex color literals |
|---|---|
| Lines | L63-79: Full color→hex swatch map with 16 entries (including brown, navy, beige, cream, gold, silver) |

##### `ProductSwipeView.tsx` — 🔴 P1
| Count | 3 action color sets + 5 semantic |
|---|---|
| Lines | L56: wishlist = `bg-red-500 text-red-500 border-red-500` |
| | L57: skip = `bg-gray-500 text-gray-500 border-gray-500` |
| | L58: cart = `bg-green-500 text-green-500 border-green-500` |
| | `bg-red-500/20` (L254), `bg-green-500/20` (L288), `bg-green-500 hover:bg-green-600` (L357) |

##### `SwipeableCartItem.tsx` — 🟡 P1
| Lines | `bg-pink-500 text-white` (wishlist action L236) |

##### `StickyAddToCartBar.tsx` — 🔴 P1
| Lines | `bg-green-600 hover:bg-green-700` (added state L204) |
| | `fill-red-500 text-red-500` (wishlist L192) |

##### `MobileShippingSelector.tsx` — 🔴 P1
| Count | 3 `dark:` + 3 semantic |
|---|---|
| Lines | `bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300` (free badge L138) |
| | `text-green-600 dark:text-green-400` (free price L158) |

##### `MobileOrderReview.tsx` — 🟡 P1
| Lines | `text-green-600 dark:text-green-400` (discount L227) |

##### `MobilePaymentSelector.tsx` — 🟡 P1
| Lines | `text-blue-600` (VISA L89), `text-red-500` (MC L91), `text-blue-400` (AMEX L93), `text-orange-500` (DISC L95) |

##### `MobileCartBottomSheet.tsx` — 🟡 P1
| Lines | `text-green-600` (discount L273), `bg-black/50` (overlay) |

##### `MobileProductCard.tsx` — 🟡 P1
| Lines | `fill-red-500 text-red-500` (wishlist L198), `fill-amber-400 text-amber-400` (star L259) |

##### `MobileProductGallery.tsx` — 🟡 P1
| Lines | `bg-black` (image backdrop) |

##### `MobileInput.tsx` — 🟡 P1
| Lines | `border-green-500 focus:ring-green-500` (valid L83), `text-green-500` (check L136) |

##### `CollapsibleSection.tsx` — 🟡 P1
| Lines | `bg-green-100 dark:bg-green-900/30` (completed L65), `text-green-600 dark:text-green-400` (check L66) |

##### `CollapsibleProductDetails.tsx` — 🟡 P1
| Lines | `text-green-600 dark:text-green-400` (in-stock L189), `prose dark:prose-invert` (5 dark: instances) |

##### `CartNotification.tsx` — 🟡 P1
| Lines | `bg-green-100 dark:bg-green-900/30` (L141), `text-green-600 dark:text-green-400` (L142) |

##### `MobileCheckoutPage.tsx` — 🟡 P1
| Lines | `border-gray-300` (checkboxes L316, L388) |

---

### C. Dashboard Components — 135 Files

#### C1. `quote-timeline.tsx` — 🟢 P2 (Status Map)

| Count | 32+ `dark:` + 16 status colors |
|---|---|
| Lines | L53-118: Complete 16-status color map (blue, gray, indigo, purple, green, red, amber, emerald, orange) |

#### C2. `order-timeline.tsx` — 🟢 P2

| Count | 12+ `dark:` + status colors |
|---|---|
| Lines | L99: `text-gray-600` fallback |

#### C3. `order-detail-dialog.tsx` — 🟢 P2

| Count | 14+ `dark:` + status color map |
|---|---|
| Lines | L109: Status map mirrors order-card patterns |

#### C4. `recent-orders-widget.tsx` — 🟢 P2

| Count | 14 `dark:` + 8 status colors |
|---|---|
| Lines | L50-80: Full order status color map |

#### C5. `activity-feed.tsx` — 🟢 P2

| Count | 10 `dark:` + 5 activity type colors |
|---|---|
| Lines | L46-66: `bg-blue/purple/green/yellow/orange-100 dark:bg-*-900/30` |

#### C6. `stats-cards.tsx` — 🟢 P2

| Count | 7 semantic |
|---|---|
| Lines | `bg-green-500/10` (revenue L120), `bg-blue-500/10` (orders L153), `bg-purple-500/10` (products L175) |
| | `bg-red-500/10` / `bg-gray-500/10` (low stock L199), `bg-orange-500/10` (conversion L228) |
| | `bg-green-100 text-green-700` (growth badge L236) |

#### C7. `analytics-view.tsx` — 🟢 P2

| Count | 8 `dark:` + 5 hex colors |
|---|---|
| Lines | L167-230: Metric cards with `bg-green/blue/purple/orange-100 dark:bg-*-900/30` |
| | L316-317: `#3B82F6` (chart gradient), L336: `#3B82F6` (revenue line) |
| | L371: `#10B981` (orders bar), L405: `#8B5CF6` (products bar) |

#### C8. `analytics-charts.tsx` — ⚪ P3 (Charts)

| Count | 10 hex colors |
|---|---|
| Lines | L136-137: `#3B82F6` gradient, L171: `#3B82F6` stroke, L243: `#10B981` stroke |
| | L396: `#8B5CF6` fill, L586: `['#3B82F6', '#10B981', '#F59E0B', '#EF4444']` |
| | L630: `#000` fill |
| **Note:** Recharts requires hex colors. These are acceptable but should be centralized. |

#### C9. `ecommerce-metric-card.tsx` — ⚪ P3 (Charts)

| Count | 7 hex sparkline colors + `text-gray-600 dark:text-gray-400` |
|---|---|
| Lines | L83-113: sparkline hex colors per metric type |

#### C10. `product-card.tsx` (ui) — 🟢 P2

| Count | 8 `dark:` + status colors |
|---|---|
| Lines | L85-93: Status map (green=active, yellow=draft, gray=archived) |
| | L159: `text-red-600 dark:text-red-400` (out of stock), L168: `text-yellow-600` (low), L176: `text-green-600` (in stock) |

#### C11. `order-card.tsx` — 🟢 P2

| Count | Full status color maps for order, payment, fulfillment statuses |
|---|---|
| Lines | L78-124: Three separate status→color maps |

#### C12. `orders-view.tsx` — 🟢 P2

| Count | Two full status maps (order + payment) |
|---|---|
| Lines | L67-81: `bg-yellow/blue/purple/indigo/green/gray/red-100` with `dark:` variants |

#### C13. `reviews-view.tsx` — 🟢 P2

| Count | 4 status colors |
|---|---|
| Lines | L79-82: pending=yellow, approved=green, rejected=red, flagged=orange |

#### C14. `inventory-view.tsx` — 🟢 P2

| Count | 8 `dark:` + 10 semantic + alert level colors |
|---|---|
| Lines | L244-310: Stat cards (blue/green/yellow/red), L366-417: Progress bars (green/yellow/orange/red) |
| | L455-457: Alert level rows (red/orange/yellow) |

#### C15. `low-stock-alerts.tsx` — 🟢 P2

| Count | 6 `dark:` + alert level colors |
|---|---|
| Lines | L47-52: out-of-stock=red, critical=red, low=yellow |
| | L165-167: Progress bar colors |

#### C16. `StockAlertWidget.tsx` — 🟢 P2

| Count | Alert level colors |
|---|---|
| Lines | L38-56: out=red, critical=orange, low=yellow, ok=green |
| | `bg-orange-500 hover:bg-orange-600` (bulk reorder L147) |

#### C17. `OnboardingWizard.tsx` — 🟢 P2

| Count | 12+ `dark:` + 12 `bg-gray/white` + many `text-gray-*` |
|---|---|
| Lines | L226-307: Extensive hardcoded grays throughout wizard |

#### C18. Onboarding Steps (5 files) — 🟢 P2

**StoreBasicsStep, FirstProductStep, CurrencyTaxStep, ShippingStep, PaymentsStep, LaunchStep:**
| Count | ~70 `border-gray/text-gray/bg-white/bg-gray` instances across all 6 files |
|---|---|
| Heavy use of `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700` pattern |

#### C19. `embed-code-view.tsx` — 🟡 P1/P2

| Count | 5 hex literals |
|---|---|
| Lines | L68: `buttonColor: '#000000'` default, L133-184: Embed code with hex fallbacks |
| | L437-443: Color picker defaulting to `#000000` |

#### C20. `invoice-template.tsx` — 🟢 P2

| Count | 10 `text-gray-*` + 3 `border-gray-*` + `bg-white` + `text-black` |
|---|---|
| **Note:** Invoice must be print-friendly; hardcoded light colors are intentional. |

#### C21. `StoreTemplateSelector.tsx` — 🟢 P2

| Count | 14 `dark:` + `border-green/red-200` |

#### C22. Quote Components (`quotes/`) — 🟢 P2

- `quote-detail-dialog.tsx`: `text-red-600`, `text-amber-600`, `text-green-600`, `border-red/amber` (expiry/status)
- `send-quote-dialog.tsx`: `text-red-600`, `bg-red-50 border-red-200` (expiry warnings)
- `convert-to-order-dialog.tsx`: `bg-amber/green/blue-50 border-*-200` (info panels)
- `quote-template-dialog.tsx`: `primaryColor: '#2563eb'` (accepts color prop ✅)
- `quote-template-list.tsx`: `text-red-600` (delete action)
- `quote-template-selector.tsx`: `fill-amber-400 text-amber-400` (rating star)
- `product-selector.tsx`: `text-red-600` (out-of-stock badge)

#### C23. Portal Components — 🟢 P2

- `quote-portal-view.tsx`: 12 `dark:` + `bg-green/red/amber/blue-50 border-*-200` (status banners)
- `quote-accept-form.tsx`: `border-green-200 dark:border-green-900`, `ctx.strokeStyle = '#000'` (signature canvas)

#### C24. Settings Components — 🟢 P2

- `quote-settings.tsx`: `primary_color: '#2563eb'` defaults, color picker
- `inventory-settings.tsx`: `bg-blue-50 border-blue-200` (info panel)
- `payment-settings.tsx`: 5× `bg-blue-50 border-blue-200` + 1× `bg-amber-50 border-amber-200`
- `ecommerce-settings-dialog.tsx`: 4 `dark:` instances

#### C25. Misc Dashboard — 🟢 P2

- `flash-sales-view.tsx`: Status colors (blue=scheduled, green=active, yellow=paused, gray=ended, red=cancelled)
- `gift-cards-view.tsx`: `bg-green-500/10 text-green-500`, `bg-gray-500/10 text-gray-500`
- `loyalty-view.tsx`: Tier colors (bronze=amber, silver=gray, gold=yellow, platinum=purple, diamond=blue)
- `discounts-view.tsx`: `bg-blue/green-100` badges
- `categories-view.tsx`: `bg-green-100 text-green-700` (active badge)
- `bundles-view.tsx`: `bg-green-500/10 text-green-500/600` badges
- `webhooks-view.tsx`: `bg-green-500` (active/delivered badges)
- `integrations-view.tsx`: `border-yellow-500 text-yellow-600` (warning badge)
- `customer-table.tsx`: 6 `dark:` instances
- `customer-detail-dialog.tsx`: 6 `dark:` instances
- `product-columns.tsx`: 8 `dark:` instances (status color map)
- `view-product-dialog.tsx`: 6 `dark:` instances
- `import-products-dialog.tsx`: 3 `dark:` instances

#### C26. UI Utilities — 🟢 P2

- `revenue-chart.tsx`: `text-green-600` / `text-red-600` (positive/negative change)
- `inventory-alert.tsx`: `bg-yellow-50 border-yellow-200` (alert cards)
- `InventoryHistoryTable.tsx`: `text-gray-600 dark:text-gray-400` (set action)

---

### D. Shared Utility Files

#### D1. `lib/quote-utils.ts` — 🟢 P2

| Count | 8 status entries × (color + bgColor) = 16 hardcoded |
|---|---|
| Lines | L27-83: Full status→color map for quotes |

#### D2. `lib/analytics-utils.ts` — ⚪ P3

| Count | 10 hex chart colors |
|---|---|
| Lines | L335-344: `['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899', '#6366F1', '#14B8A6']` |

#### D3. `lib/quote-pdf-generator.ts` — ⚪ P3

| Count | `primaryColor: '#2563eb'` default, used throughout generated HTML |
|---|---|
| Accepts `primaryColor` option ✅ |

#### D4. `lib/page-templates.ts` — 🟡 P1

| Count | 6 hex `backgroundColor` values |
|---|---|
| Lines | L45, L164, L312, L352, L430: `#f9fafb`, L211: `#f0fdf4` |

#### D5. `hooks/useMobile.ts` — ⚪ P3

| Line | `prefers-color-scheme: dark` media query — acceptable |

---

## Recommendations

### 1. Fix the Architecture Gap (P0)

```typescript
// storefront-context.tsx — add to context value:
primaryColor: settings?.primary_color || '#2563eb',
// Future: accentColor, successColor, errorColor, warningColor
```

### 2. Create a Storefront Color Token System

Create `studio/lib/storefront-colors.ts`:
- Export CSS variable mappings that studio components can consume
- Allow override from site settings via CSS custom properties
- Provide semantic tokens: `--sf-primary`, `--sf-success`, `--sf-error`, `--sf-warning`, `--sf-text`, `--sf-bg`

### 3. Priority Refactoring Order

1. **StorefrontContext** — expose `primaryColor` (1 file)
2. **Product components** — ProductPriceDisplay, ProductStockBadge, ProductDetailBlock, product-card-block (4 files)
3. **Cart/Checkout** — CartDiscountInput, CartSummaryCard, CheckoutPageBlock, OrderConfirmationBlock (4 files)
4. **Quote storefront components** — QuoteStatusBadge, QuoteActionButtons, QuoteRequestBlock (3 files)
5. **Mobile components** — All 22 mobile files share similar patterns
6. **Review components** — ReviewFormBlock, ReviewListBlock (2 files)
7. **StorefrontWidget** — Already accepts `primaryColor`, just needs more token usage (1 file)

### 4. Dashboard Components — Lower Priority

Dashboard status colors (green=success, red=error, yellow=warning) are standard UX patterns. These should eventually migrate to shadcn/ui CSS variables (`bg-destructive`, `text-muted-foreground`, etc.) but are not customer-facing.

### 5. Chart Hex Colors — Centralize Only

Recharts requires hex colors. Centralize them in a single `chart-colors.ts` config file and import from there. `analytics-utils.ts` already partially does this.

---

## Summary Table

| Directory | Files Audited | Files with Issues | `dark:` | `bg-gray/white` | `text-gray` | Semantic Colors | Hex Literals |
|---|---|---|---|---|---|---|---|
| `studio/components/` | 43 | **38** | 52 | 36 | 70+ | 80+ | 27 |
| `studio/components/mobile/` | 22 | **18** | 13 | 10 | 5 | 35+ | 27 |
| `components/` | 135 | **45** | 200+ | 106 | 130+ | 200+ | 50+ |
| `widgets/` | 1 | **1** | 2 | 0 | 0 | 0 | 16 |
| `lib/` (utilities) | 4 | **4** | 0 | 0 | 4 | 16 | 22 |
| **TOTAL** | **~205** | **~106** | **267+** | **152+** | **209+** | **331+** | **142+** |

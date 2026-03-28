# DRAMAC CMS — E-Commerce Core Overhaul Specification

> **Version:** 2.1  
> **Date:** March 27, 2026 (Updated: March 27, 2026)  
> **Scope:** All storefront e-commerce widgets, modules, checkout, quotations, settings, branding — CORE level (affects ALL sites)  
> **Priority:** CRITICAL — This is the definitive, final implementation pass  
> **Philosophy:** Build it once, build it right, build it for every site forever

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Context — What "Core" Means](#2-architecture-context)
3. [PHASE 1: Branding & Theming — Light/Dark Mode Perfection](#3-phase-1-branding--theming)
4. [PHASE 2: Price & Currency Display — Overflow & Formatting](#4-phase-2-price--currency-display)
5. [PHASE 3: Product Grid & Category System — Scalable Layout](#5-phase-3-product-grid--category-system)
6. [PHASE 4: Cart System — Bulletproof & Responsive](#6-phase-4-cart-system)
7. [PHASE 5: Checkout Flow — Complete & Polished](#7-phase-5-checkout-flow)
8. [PHASE 6: Payment Proof Upload — Universal for All Sites](#8-phase-6-payment-proof-upload)
9. [PHASE 7: Quotation System — End-to-End Polish](#9-phase-7-quotation-system)
10. [PHASE 8: Order Confirmation & Tracking — Post-Purchase](#10-phase-8-order-confirmation--tracking)
11. [PHASE 9: My Account — Customer Dashboard](#11-phase-9-my-account)
12. [PHASE 10: Navbar & Footer — Module-Aware Navigation](#12-phase-10-navbar--footer)
13. [PHASE 11: E-Commerce Settings — Every Tab Verified](#13-phase-11-ecommerce-settings)
14. [PHASE 12: Mobile Responsiveness — Every Breakpoint](#14-phase-12-mobile-responsiveness)
15. [PHASE 13: Cross-Cutting Concerns](#15-phase-13-cross-cutting-concerns)
16. [PHASE 14: Error Boundaries & Resilience](#16-phase-14-error-boundaries--resilience)
17. [PHASE 15: Storefront Authentication — Document, Verify & Brand](#17-phase-15-storefront-authentication)
18. [PHASE 16: Email Templates — Verification & Branding](#18-phase-16-email-templates)
19. [PHASE 17: Reviews Integration on Product Pages](#19-phase-17-reviews-integration)
20. [PHASE 18: Social Sharing, Print CSS & Wishlist](#20-phase-18-social-sharing-print-css--wishlist)
21. [PHASE 19: Inventory & Discount Integrity — Critical Fixes](#21-phase-19-inventory--discount-integrity)
22. [PHASE 20: SEO & Structured Data — Storefront Visibility](#22-phase-20-seo--structured-data)
23. [PHASE 21: API Security Hardening](#23-phase-21-api-security-hardening)
24. [PHASE 22: Future Enhancements](#24-phase-22-future-enhancements)
25. [Implementation Rules](#25-implementation-rules)
26. [Verification Checklist](#26-verification-checklist)

---

## 1. Executive Summary

### The Problem

The DRAMAC CMS e-commerce storefront has multiple foundational issues that manifest across ALL sites because the affected code lives in the **core module components** (not in site-specific data). Key issues:

1. **Payment proof upload disappeared** — The feature was built and working, but only wired for specific order flows. New sites or different checkout paths don't trigger it. The upload UI, storage, and review pipeline must be universally available on ALL sites with manual/bank transfer payment.

2. **Price/amount overflow** — Currency values (especially large Zambian Kwacha amounts like `K999,999.99`) break out of their container boundaries in checkout totals, cart summaries, and product cards.

3. **White text on white background** — The branding system generates CSS variables, but some components still use hardcoded colors (`bg-white`, `text-gray-600`, `#ffffff`) instead of semantic Tailwind classes (`bg-card`, `text-foreground`). When a site uses a light theme, these hardcoded values create invisible text.

4. **Dark/Light mode confusion** — Published storefronts are forced to `light` mode via `.studio-renderer`, but some components use `dark:` Tailwind variants or hardcoded dark colors that conflict. The brand color system needs to handle sites that choose a dark aesthetic (dark background + light text) correctly WITHOUT using Tailwind's `dark:` mode.

5. **Categories listed vertically** — With 50+ categories, a vertical list is unusable. Needs a scalable UI (dropdown, horizontal scroll, or multi-column grid).

6. **General design quality** — Components need professional polish: consistent spacing, proper shadows, smooth transitions, and a cohesive design language.

### The Principle: Core vs. Site

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHAT WE'RE CHANGING (CORE)                    │
│                                                                  │
│  src/modules/ecommerce/studio/components/  ← Storefront blocks  │
│  src/modules/ecommerce/hooks/              ← Data hooks          │
│  src/modules/ecommerce/actions/            ← Server actions      │
│  src/modules/ecommerce/components/         ← Dashboard UI        │
│  src/lib/studio/engine/brand-colors.ts     ← Brand system        │
│  src/lib/studio/engine/renderer.tsx        ← Renderer            │
│  src/lib/studio/blocks/premium-components  ← Navbar/Footer       │
│  src/app/globals.css                       ← CSS isolation        │
│                                                                  │
│  These files are SHARED by ALL sites. Change once → every site   │
│  gets the fix. Sites only contribute their branding colors,      │
│  fonts, and content. The STRUCTURE and BEHAVIOR is core.         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 WHAT SITES CONTRIBUTE (BRANDING)                 │
│                                                                  │
│  site.settings.primary_color     → brand palette resolution      │
│  site.settings.secondary_color   →                               │
│  site.settings.accent_color      →                               │
│  site.settings.theme.backgroundColor →                           │
│  site.settings.theme.textColor   →                               │
│  site.settings.font_heading      →                               │
│  site.settings.font_body         →                               │
│                                                                  │
│  That's ALL. The widgets adapt to whatever branding comes in.    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Context

### How Published Sites Render

```
Browser requests: https://demo-shop.sites.dramacagency.com/shop

    ↓ Vercel Edge → middleware.ts (extracts subdomain)
    ↓ Routes to: src/app/site/[domain]/[[...slug]]/page.tsx
    ↓ Server: getSiteData(domain, slug)
    │   → Queries Supabase for site + pages + settings + modules
    │   → For /checkout, /products/[slug], etc: generates virtual pages
    ↓ Renders: <CraftRenderer content={...} siteSettings={...} />
    │   → Wraps in StorefrontProvider (e-commerce context)
    │   → Wraps in StorefrontAuthProvider (customer auth)
    │   → Renders StudioRenderer
    │       → resolveBrandColors(siteSettings) → BrandColorPalette
    │       → generateBrandCSSVars(palette) → CSS custom properties
    │       → For EACH component:
    │           → injectBrandColors(props, palette) — fills unset color props
    │           → injectBrandFonts(props, ...) — fills unset font props
    │           → Renders the component with injected props
    ↓ Result: Full HTML page with site-specific branding applied via CSS vars
```

### The Brand Color Pipeline (3 Layers)

| Layer                    | Mechanism                                          | What It Does                                                                                                                            |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **CSS Variable Layer**   | `generateBrandCSSVars()` on `.studio-renderer` div | Overrides `--color-card`, `--color-foreground`, `--color-primary`, etc. All Tailwind `bg-card`, `text-foreground` classes use these.    |
| **Color Prop Injection** | `injectBrandColors()` per component                | Fills component-specific color props (backgroundColor, textColor, buttonBg) from the brand palette. For components using inline styles. |
| **Font Injection**       | `injectBrandFonts()` per component                 | Fills font props (fontFamily, titleFont) from site's heading/body fonts.                                                                |

### Key Files to Modify

| File                                           | What It Contains           | Change Scope                                        |
| ---------------------------------------------- | -------------------------- | --------------------------------------------------- |
| `studio/components/CheckoutPageBlock.tsx`      | Multi-step checkout        | Payment proof, price overflow, branding, responsive |
| `studio/components/CartPageBlock.tsx`          | Full cart page             | Price overflow, branding, responsive                |
| `studio/components/CartSummaryCard.tsx`        | Cart totals sidebar        | Price overflow, layout                              |
| `studio/components/CartItemCard.tsx`           | Individual cart item       | Price display, responsive                           |
| `studio/components/ProductGridBlock.tsx`       | Shop page product grid     | Category filter, layout, branding                   |
| `studio/components/ProductDetailBlock.tsx`     | Single product page        | Branding, add-to-cart/quote, responsive             |
| `studio/components/product-card-block.tsx`     | Product card in grid       | Price overflow, branding                            |
| `studio/components/ProductPriceDisplay.tsx`    | Price formatting component | Overflow containment                                |
| `studio/components/CategoryNavBlock.tsx`       | Category navigation        | Complete redesign for scalability                   |
| `studio/components/QuoteRequestBlock.tsx`      | Quote request form         | Branding, responsive                                |
| `studio/components/QuoteListBlock.tsx`         | Customer's quote list      | Branding, responsive                                |
| `studio/components/QuoteDetailBlock.tsx`       | Quote detail view          | Branding, responsive                                |
| `studio/components/OrderConfirmationBlock.tsx` | Post-purchase page         | Payment proof upload, branding                      |
| `studio/components/OrderTrackingBlock.tsx`     | Order tracking             | Branding, responsive                                |
| `studio/components/MyAccountBlock.tsx`         | Customer account dashboard | Branding, responsive                                |
| `studio/components/MiniCartBlock.tsx`          | Header mini cart           | Branding, quotation mode                            |
| `studio/components/NavCartBadge.tsx`           | Cart icon in navbar        | Branding                                            |
| `premium-components.tsx`                       | Navbar renderer            | Cart icon, branding, dark backgrounds               |
| `brand-colors.ts`                              | Brand color resolution     | Contrast validation, dark theme support             |
| `renderer.tsx`                                 | Component renderer         | Injection pipeline                                  |
| `globals.css`                                  | CSS isolation              | Additional safety rules                             |

---

## 3. PHASE 1: Branding & Theming — Light/Dark Mode Perfection

### 3.1 The Problem

The brand color system (`brand-colors.ts`) resolves colors from site settings and generates CSS variables. However:

1. **Hardcoded colors persist in components** — Many storefront blocks still use `bg-white`, `text-gray-600`, `border-gray-200`, `#ffffff`, `#1f2937` instead of semantic classes.
2. **"Dark-themed" sites break** — A site with `backgroundColor: "#0f172a"` (dark) and `textColor: "#f8fafc"` (light) should work perfectly. But components with hardcoded `bg-white` create white blocks on a dark page.
3. **Navbar especially broken** — `PremiumNavbarRender` defaults `backgroundColor` to `"#ffffff"` and `textColor` to `"#1f2937"`. These should come from the brand palette.
4. **No contrast validation** — Nothing prevents a site from having `primary: "#ffffff"` on `background: "#fafafa"` (almost invisible).

### 3.2 What to Implement

#### A. Audit & Replace All Hardcoded Colors

**Every** storefront block component must be audited. Replace:

| Hardcoded                     | Replace With                                                |
| ----------------------------- | ----------------------------------------------------------- |
| `bg-white`                    | `bg-card` or `bg-background`                                |
| `bg-gray-50`                  | `bg-muted`                                                  |
| `bg-gray-100`                 | `bg-muted`                                                  |
| `bg-gray-900`                 | `bg-foreground` (rare, only for inverted sections)          |
| `text-gray-600`               | `text-muted-foreground`                                     |
| `text-gray-700`               | `text-foreground`                                           |
| `text-gray-800`               | `text-foreground`                                           |
| `text-gray-900`               | `text-foreground`                                           |
| `text-gray-500`               | `text-muted-foreground`                                     |
| `text-gray-400`               | `text-muted-foreground`                                     |
| `text-white` (on colored bg)  | `text-primary-foreground`                                   |
| `border-gray-200`             | `border`                                                    |
| `border-gray-100`             | `border`                                                    |
| `border-gray-300`             | `border`                                                    |
| `divide-gray-200`             | `divide-border` (or use `border` color)                     |
| `ring-gray-300`               | `ring-border`                                               |
| `hover:bg-gray-100`           | `hover:bg-muted`                                            |
| `hover:bg-gray-50`            | `hover:bg-muted/50`                                         |
| `focus:ring-blue-500`         | `focus:ring-primary`                                        |
| `bg-blue-600`                 | `bg-primary`                                                |
| `text-blue-600`               | `text-primary`                                              |
| `bg-red-500`                  | `bg-destructive`                                            |
| `bg-green-500`                | `bg-success` (define if needed)                             |
| `bg-yellow-500`               | `bg-warning` (define if needed)                             |
| `placeholder-gray-400`        | `placeholder:text-muted-foreground`                         |
| `shadow-gray-*`               | `shadow` (uses border color)                                |
| Any `#ffffff` in defaultProps | `""` (empty string, let brand injection fill)               |
| Any `#1f2937` in defaultProps | `""` (empty string)                                         |
| Any hex color in defaultProps | `""` (empty string, except state colors like success/error) |

**EXCEPTION:** State colors (error red, success green, warning yellow) may remain hardcoded because they are semantic and should not change with branding. But they should still be defined as CSS variables for consistency.

#### A.1 Extended Component Audit Checklist

In addition to the main blocks listed above, the following components MUST also be audited for hardcoded colors and branding compliance:

| Component                    | File                                           | Priority | Known Issues                                                                     |
| ---------------------------- | ---------------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `ReviewFormBlock`            | `studio/components/ReviewFormBlock.tsx`        | HIGH     | Form inputs, submit button may use hardcoded colors                              |
| `ReviewListBlock`            | `studio/components/ReviewListBlock.tsx`        | HIGH     | Star ratings, review cards, author text                                          |
| `SearchBarBlock`             | `studio/components/SearchBarBlock.tsx`         | HIGH     | Input bg, search icon, dropdown results bg                                       |
| `BreadcrumbBlock`            | `studio/components/BreadcrumbBlock.tsx`        | MEDIUM   | Separator color, link text color, active state                                   |
| `FeaturedProductsBlock`      | `studio/components/FeaturedProductsBlock.tsx`  | HIGH     | Section bg, heading text, card backgrounds                                       |
| `FilterSidebarBlock`         | `studio/components/FilterSidebarBlock.tsx`     | HIGH     | Filter labels, checkboxes, price range slider                                    |
| `ActiveFilters`              | `studio/components/ActiveFilters.tsx`          | MEDIUM   | Chip bg/text, clear button                                                       |
| `ProductQuickView`           | `studio/components/ProductQuickView.tsx`       | HIGH     | Modal overlay, content bg, close button                                          |
| `StorefrontAuthDialog`       | `studio/components/StorefrontAuthDialog.tsx`   | CRITICAL | Login/register forms, input fields, tab indicator, submit button, error messages |
| `CartDiscountInput`          | `studio/components/CartDiscountInput.tsx`      | MEDIUM   | Input field, apply button, success/error states                                  |
| `ProductStockBadge`          | `studio/components/ProductStockBadge.tsx`      | MEDIUM   | In-stock green, out-of-stock red, low-stock yellow                               |
| `CategoryCard`               | `studio/components/CategoryCard.tsx`           | MEDIUM   | Card bg, text overlay, hover state                                               |
| `CategoryHeroBlock`          | `studio/components/CategoryHeroBlock.tsx`      | MEDIUM   | Hero overlay, title text, breadcrumb                                             |
| `NavAccountBadge`            | `studio/components/NavAccountBadge.tsx`        | HIGH     | Logged-in initials badge, hover state                                            |
| `CheckoutStepIndicator`      | `studio/components/CheckoutStepIndicator.tsx`  | HIGH     | Active step color, completed step, connector line                                |
| `AddressForm`                | `studio/components/AddressForm.tsx`            | MEDIUM   | Input fields, labels, validation error text                                      |
| `ShippingMethodSelector`     | `studio/components/ShippingMethodSelector.tsx` | MEDIUM   | Radio buttons, selected state bg                                                 |
| `PaymentMethodSelector`      | `studio/components/PaymentMethodSelector.tsx`  | MEDIUM   | Radio buttons, selected state bg, gateway logos                                  |
| `QuoteStatusBadge`           | `studio/components/QuoteStatusBadge.tsx`       | MEDIUM   | Status chip colors                                                               |
| `QuoteActionButtons`         | `studio/components/QuoteActionButtons.tsx`     | MEDIUM   | Accept/reject button colors                                                      |
| **All `mobile/` components** | `studio/components/mobile/*.tsx`               | HIGH     | 20+ mobile components — audit ALL for same hardcoded color issues                |

> **Total audit scope:** 45+ storefront blocks + 20+ mobile variants = **65+ components** to verify for branding compliance.

#### B. Dark-Themed Site Support

A site with a dark background should work perfectly. The `.studio-renderer` forces `color-scheme: light` (which only affects native UI elements like scrollbars). The **CSS variables** already handle this:

- `--color-background` = site's background (could be dark)
- `--color-foreground` = site's text color (could be light)
- `--color-card` = derived from background (could be dark)

The problem is components that use `bg-white` instead of `bg-card`. Once all hardcoded colors are replaced with semantic classes, dark-themed sites work automatically.

No `dark:` Tailwind variants should exist in storefront components. The brand system handles everything through CSS variable values.

#### C. Contrast Validation in `brand-colors.ts`

Add a contrast check function:

```
resolveBrandColors(source):
  ... existing resolution ...

  // NEW: Validate minimum contrast ratios
  if (contrastRatio(palette.foreground, palette.background) < 4.5) {
    palette.foreground = contrastingForeground(palette.background);
  }
  if (contrastRatio(palette.primaryForeground, palette.primary) < 4.5) {
    palette.primaryForeground = contrastingForeground(palette.primary);
  }
  // ... for all foreground/background pairs
```

This ensures text is ALWAYS readable regardless of what colors the site owner picks.

#### D. Navbar Branding Fix

The `PremiumNavbarRender` in `premium-components.tsx`:

- Remove hardcoded `backgroundColor = "#ffffff"` and `textColor = "#1f2937"` defaults
- Let brand injection fill these from the palette (background → navbar bg, foreground → navbar text)
- Dropdown menus: replace `bg-white` with `bg-card`, `text-gray-700` with `text-foreground`
- Mobile menu: same treatment
- Utility icons (cart, account): use `text-foreground` instead of hardcoded colors

#### E. Required CSS Variable Additions

Add to `generateBrandCSSVars()` if missing:

```
--color-destructive          → #ef4444 (semantic red)
--color-destructive-foreground → #ffffff
--color-success              → #22c55e (semantic green)
--color-success-foreground   → #ffffff
--color-warning              → #f59e0b (semantic yellow)
--color-warning-foreground   → #ffffff
--color-info                 → #3b82f6 (semantic blue)
--color-info-foreground      → #ffffff
```

---

## 4. PHASE 2: Price & Currency Display — Overflow & Formatting

### 4.1 The Problem

- Checkout totals overflow their container boxes
- Large Kwacha amounts (`K999,999.99`) break layouts
- Cart summary card totals extend beyond boundaries
- Product card prices can overflow on mobile

### 4.2 What to Implement

#### A. `ProductPriceDisplay` Component

This is the centralized price display component. It must handle overflow gracefully:

```
Requirements:
- Use tabular-nums font feature for aligned digits
- max-width: 100% with overflow: hidden and text-overflow: ellipsis on extreme cases
- Responsive font sizing: text-lg on mobile, text-xl on tablet, text-2xl on desktop
- For sale prices (original + discounted): stack vertically on mobile, inline on desktop
- Strike-through prices: text-muted-foreground, smaller font size
- Currency symbol: same font weight, no wrapping between symbol and number
- Ensure the price wraps within its container, never overflows
```

#### B. Cart Summary Prices

The `CartSummaryCard` component:

```
Requirements:
- Labels on left, amounts on right: use flex with justify-between
- Amounts: text-right, tabular-nums, min-width: 0, overflow: hidden
- Grand total: larger font but still contained
- Use a table-like layout (CSS grid or flex) so columns never overlap
- On mobile: same layout but smaller font sizes
- Divider line between subtotal section and total
```

#### C. Checkout Price Summary

The `CheckoutPageBlock` order review panel:

```
Requirements:
- Same containment rules as CartSummaryCard
- Fixed-width right column for amounts (min-w-[80px] text-right)
- Line items: product name truncates (not the price)
- Mobile: stack if needed, but prices always stay contained
- Total bar: prominent but constrained within the card
```

#### D. Product Card Prices

The `product-card-block.tsx`:

```
Requirements:
- Price display area: fixed height, overflow hidden
- On small cards: reduce font size before truncating
- Sale badge: absolute positioned, doesn't push price out
- Price + "Add to Cart" button: flex-wrap so they stack on narrow cards
```

---

## 5. PHASE 3: Product Grid & Category System — Scalable Layout

### 5.1 The Category Problem

Currently, categories are listed vertically (one per row). With 50 categories this creates an impossibly long filter sidebar.

### 5.2 Category Solutions to Implement

#### A. Primary: Dropdown Category Selector

On the shop page, replace the vertical category list with:

```
┌──────────────────────────────────────────────────────────────────┐
│  🔍 [Search products...]     📂 [All Categories ▼]   ⚙️ Sort ▼  │
└──────────────────────────────────────────────────────────────────┘
```

- A dropdown button next to the search bar: "All Categories ▼"
- On click: opens a dropdown panel with:
  - A search/filter input at the top of the dropdown
  - Categories listed in a scrollable container (max-height: 300px)
  - Category count badges (e.g., "Clothing (24)")
  - Selected category highlighted with checkmark
  - "Clear filter" option at top
- On mobile: same dropdown, full-width
- Supports multi-select if design allows (checkboxes) or single-select (radio-like)

#### B. Secondary: Horizontal Scrolling Chips

Below the search bar, show category chips in a horizontal scrollable row:

```
┌──────────────────────────────────────────────────────────────────┐
│ [All] [Clothing] [Shoes] [Accessories] [Electronics] [→ more]   │
└──────────────────────────────────────────────────────────────────┘
```

- Horizontal scroll with `overflow-x-auto` and `scrollbar-hide`
- "All" chip always first, always visible
- Active category: filled primary color. Others: outlined
- Fade gradient on right edge to indicate scrollability
- Touch-friendly: large tap targets (min 44px height)

#### C. Implementation: `CategoryNavBlock` Redesign

The `CategoryNavBlock.tsx` component should support BOTH layouts via a `layout` prop:

- `layout: "dropdown"` — Dropdown selector (default when categories > 8)
- `layout: "chips"` — Horizontal scrolling chips (default when categories ≤ 8)
- `layout: "sidebar"` — Traditional sidebar (only for desktop filter sidebar, limited to visible + "Show more")
- Auto-detection: If categories > 8, default to dropdown. If ≤ 8, default to chips.

#### D. `FilterSidebarBlock` Update

The sidebar filter (desktop) should:

- Show max 6 categories initially
- "Show all (X)" expandable link
- When expanded: scrollable container with max-height
- Category count badges
- Search/filter within the expanded list

### 5.3 Product Grid Fixes

#### A. Grid Layout (already partially fixed but verify)

```
Requirements:
- Mobile (<640px): 2 columns (grid-cols-2)
- Tablet (640-1024px): 3 columns (grid-cols-3)
- Desktop (>1024px): 4 columns (grid-cols-4)
- Use ACTUAL Tailwind responsive classes, NOT template literals
  ❌ className={`grid-cols-${columns}`}  (broken at build time)
  ✅ Tailwind responsive: grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
- Gap: gap-4 on mobile, gap-6 on desktop
- Products should have consistent card heights (use flex layout with flex-grow on content)
```

#### B. Empty State

```
When no products match filters:
- Centered illustration or icon
- "No products found" message
- "Clear filters" button
- Suggestions: "Try a different category" or "Search for something else"
```

#### C. Loading State

```
- Skeleton cards matching the grid layout
- Pulse animation
- Same number of skeletons as expected products (or 8 default)
```

---

## 6. PHASE 4: Cart System — Bulletproof & Responsive

### 6.1 Components to Polish

#### A. `CartPageBlock` — Full Cart Page

```
Requirements:
- Two-column layout on desktop: items list (left 2/3), summary card (right 1/3)
- Single column on mobile: items stacked, summary at bottom (sticky)
- Empty cart: centered illustration, "Continue Shopping" button
- Loading: skeleton layout matching the real layout
- Each cart item: image (square, contained), name (truncate if long),
  variant info, quantity controls, unit price, line total, remove button
- Quantity controls: - [qty] + with min 1, max based on stock
- Remove: trash icon with confirmation (or swipe-to-delete on mobile)
- All prices: use semantic colors, overflow-contained
- Cart actions bar: "Clear Cart" (with confirmation), "Continue Shopping"
- All text: uses text-foreground, text-muted-foreground — NO hardcoded grays
- All backgrounds: bg-card, bg-background — NO bg-white
- Border: border class — NO border-gray-*
```

#### B. `CartSummaryCard` — Totals Sidebar

```
Requirements:
- Sticky on desktop (scrolls with page, stops at footer)
- Card design: bg-card with border, rounded-lg, shadow-sm
- Line items:
  - Subtotal: label left, amount right
  - Discount (if applied): label + code badge left, -amount right (text-success)
  - Shipping: label left, amount or "Calculated at checkout" right
  - Tax: label left, amount right
  - Divider line
  - Total: bold, larger font, label left, amount right
- "Proceed to Checkout" button: full width, bg-primary, text-primary-foreground
- Discount code input below (collapsible section)
- All amounts: tabular-nums, text-right, overflow contained
```

#### C. `MiniCartBlock` — Header Mini Cart Dropdown

```
Requirements:
- Triggered by cart icon click in navbar
- Slide-in panel or dropdown (not a full page)
- Shows last 3 items with thumbnails, names, quantities, prices
- "View Cart" and "Checkout" buttons at bottom
- Total at bottom
- Quotation mode: show "Quote Items" instead of cart items,
  button says "View Quote Items" instead of "View Cart"
- Branding: bg-card, text-foreground throughout
```

#### D. `NavCartBadge` — Cart Icon in Navbar

```
Requirements:
- Shopping bag/cart icon
- Badge with item count (bg-primary, text-primary-foreground)
- Badge hides when count is 0
- Animate badge on addition (scale bounce)
- In quotation mode: show clipboard/document icon instead of cart
- Uses text-foreground for the icon (inherits from navbar)
```

---

## 7. PHASE 5: Checkout Flow — Complete & Polished

### 7.1 `CheckoutPageBlock` — Multi-Step Checkout

This is the most complex storefront component. It handles the entire purchase flow.

#### A. Step Indicator

```
Requirements:
- Steps: Information → Shipping → Payment → Review
- Horizontal on desktop, can be compact on mobile
- Current step: bg-primary circle with number, text-primary-foreground
- Completed steps: checkmark, bg-primary/20
- Future steps: bg-muted, text-muted-foreground
- Lines connecting steps: bg-primary for completed, bg-border for future
- Step labels below circles (hide on very small mobile, show icons instead)
```

#### B. Information Step

```
Requirements:
- Email, Name, Phone fields
- Guest checkout option (if enabled in settings)
- "Already have an account? Sign in" link
- All inputs: bg-input, border-input-border, text-foreground
- Labels: text-foreground, font-medium
- Placeholder: text-muted-foreground
- Focus ring: ring-primary
- Validation errors: text-destructive, border-destructive
- "Continue to Shipping" button: bg-primary, text-primary-foreground
```

#### C. Shipping Step

```
Requirements:
- Address form (AddressForm component):
  - Fields: Street, City, State/Province, Zip, Country
  - Country: dropdown with flag icons (Zambia default)
  - Province: dropdown populated based on country (Zambia provinces built-in)
  - All inputs: semantic colors
- Shipping method selector:
  - Radio buttons for available methods
  - Method name, estimated delivery, price
  - Free shipping highlighted
```

#### D. Payment Step

```
Requirements:
- Payment method selector:
  - Radio cards for each enabled method
  - Icons for each provider:
    ✅ Flutterwave, Pesapal, DPO, Paddle, Manual/Bank Transfer
  - Selected: border-primary, bg-primary/5
  - Unselected: border, bg-card
- For manual/bank transfer:
  - Show bank details (from settings)
  - Show reference number format
  - Upload payment proof section (THIS IS CRITICAL — see Phase 6)
- For gateway payments:
  - "Pay with [Provider]" button that redirects to provider
  - "You'll be redirected to complete payment" message
```

#### E. Review Step

```
Requirements:
- Order summary with all items (image, name, variant, qty, price)
- Billing/shipping address summary
- Payment method summary
- Price breakdown: subtotal, discount, shipping, tax, total
- ALL PRICES CONTAINED — no overflow
- "Place Order" button: large, prominent, bg-primary
- Terms acceptance checkbox (if legal settings require it)
- "Back" buttons to edit previous steps
```

#### F. Branding Throughout

```
ALL checkout elements must use:
- bg-card for card backgrounds
- bg-background for page background
- text-foreground for primary text
- text-muted-foreground for secondary text
- bg-primary / text-primary-foreground for primary buttons
- bg-muted for subtle backgrounds
- border for all borders
- NO hardcoded colors anywhere
```

---

## 8. PHASE 6: Payment Proof Upload — Verify & Harden the Existing System

### 8.1 What Already Exists (DON'T REBUILD — VERIFY)

The payment proof system is **already built** with a sophisticated dual-entry-point architecture and intelligent intent detection. Here is the ACTUAL system:

#### Two Entry Points for Proof Upload

**Entry Point 1 — Live Chat (Automatic Bridge)**

- Customer uploads an image/PDF in the live chat widget
- Upload goes to `POST /api/modules/live-chat/upload` → saved to `chat-attachments` PUBLIC bucket
- AFTER the response, `bridgeChatImageAsPaymentProof()` runs asynchronously (Next.js `after()` API)
- **Intelligent Intent Detection** (two layers):
  - **Layer 1 — Filename patterns**: matches `receipt`, `proof`, `payment`, `paid`, `transfer`, `invoice`, `bank`, `momo`, `mtn`, `airtel`, `zamtel`, `transaction`, `debit`, `confirm` (case-insensitive)
  - **Layer 2 — Recent message analysis**: scans last visitor messages for `paid`, `payment`, `proof`, `receipt`, `transferred`, `money sent`, `ORD-XXXX`
- If intent detected AND a pending manual payment order exists for that email:
  - Downloads file from `chat-attachments` (public URL)
  - **Re-uploads** to `payment-proofs` PRIVATE bucket (`{siteId}/{orderId}/{timestamp}.{ext}`)
  - Updates `orders.metadata.payment_proof` with path, filename, size, type, timestamp, `status: "pending_review"`, `source: "live_chat"`
  - Adds order timeline entry (`payment_proof_uploaded`, source: live_chat)
  - AI sends acknowledgment: _"I can see you've uploaded your payment proof..."_
  - Notifies business owner (in-app + email) via `notifyPaymentProofUploaded()`
- Key files: `src/app/api/modules/live-chat/upload/route.ts`, `src/modules/live-chat/lib/chat-event-bridge.ts`

**Entry Point 2 — Order Confirmation Page (Direct Upload)**

- `OrderConfirmationBlock.tsx` shows a drag-drop upload zone for manual payment orders
- Accepted formats: JPEG, PNG, WebP, HEIC, PDF (max 3MB)
- Calls `uploadPaymentProof()` server action in `public-ecommerce-actions.ts`
  - Validates order exists + is pending payment + matches site
  - Decodes base64 → buffer → uploads to `payment-proofs` PRIVATE bucket
  - Updates `orders.metadata.payment_proof` with path, filename, size, type, timestamp, `status: "pending_review"`
  - Adds order timeline entry
- Async notifications: business owner (in-app + email) + customer's active chat via `notifyChatPaymentProofUploaded()`
- UI shows status: pending → under review → approved/rejected
- Polls `getOrderPaymentProofStatus()` to detect status changes

**When proof is uploaded from EITHER entry point, it syncs to the other.** Chat upload → reflected on order confirmation page (via metadata query). Order page upload → AI sends acknowledgment in chat.

#### Dashboard Review (Store Owner)

**ChatOrderPanel** (`src/modules/live-chat/components/shared/ChatOrderPanel.tsx`):

- Shows proof thumbnail with `ImageLightbox` component (full-screen zoom)
- "Approve" and "Reject" buttons when status = `pending_review`
- Calls `updatePaymentProofStatus()` in `order-actions.ts`

**Approval flow:**

1. Updates `metadata.payment_proof.status` → `"approved"`, `reviewed_at`, `reviewed_by`
2. Sets `payment_status` → `"paid"`
3. Adds timeline entry: `payment_proof_reviewed`
4. `notifyChatPaymentConfirmed()` → AI message: _"Payment confirmed! Order processing..."_
5. Sends order confirmation email

**Rejection flow:**

1. Updates proof status → `"rejected"`
2. Adds timeline entry
3. `sendProactiveMessage()` → AI tells customer proof couldn't be verified, asks for re-upload

#### AI Chat Integration

`ai-responder.ts` receives full payment context:

- If NO proof: AI guides customer through payment steps + uploading
- If proof uploaded (pending_review): AI acknowledges receipt, explains review timeline, does NOT ask for re-upload
- Payment guidance mode has 0.95 confidence threshold

#### Storage Architecture

| Bucket             | Visibility         | Purpose                                     |
| ------------------ | ------------------ | ------------------------------------------- |
| `chat-attachments` | PUBLIC             | All chat file uploads (temporary for proof) |
| `payment-proofs`   | PRIVATE (zero RLS) | Final proof storage. Admin client only.     |

Signed URLs via `getPaymentProofUrl()` in `order-actions.ts` — 1 hour validity, admin client required.

### 8.2 What to VERIFY (Not Rebuild)

The system is architecturally complete. The reported issue is that **new sites don't see it working.** Potential causes to investigate and fix:

#### A. Order Confirmation Page — Ensure Proof UI Always Shows for Manual Payment

```
Check in OrderConfirmationBlock.tsx:
- [ ] When payment_provider = "manual" or "bank_transfer": upload section ALWAYS renders
- [ ] When payment_provider is null (older orders): check if manual payment was selected
- [ ] The upload zone renders with proper brand colors (bg-card, text-foreground, border)
- [ ] File validation errors display clearly (text-destructive)
- [ ] Upload progress indicator works
- [ ] Success state shows green check + filename
- [ ] Status polling works — detects when store owner approves
- [ ] Component handles edge case: order already paid (hide upload, show confirmation)
```

#### B. Live Chat Bridge — Ensure It Fires for All Sites

```
Check in chat-event-bridge.ts:
- [ ] bridgeChatImageAsPaymentProof() is called in after() callback of upload route
- [ ] Site ID is correctly passed through the chain
- [ ] Visitor email lookup works (visitor record has email)
- [ ] Pending order query: correctly filters by site_id + customer_email + payment pending + manual provider
- [ ] Intent detection: filename patterns comprehensive enough for Zambian payment methods
- [ ] Download from chat-attachments: URL is accessible (public bucket)
- [ ] Upload to payment-proofs: admin client used, bucket exists, path is correct
- [ ] Order metadata update: doesn't clobber existing metadata (uses spread operator)
```

#### C. Cross-Site Consistency

```
- [ ] Create a BRAND NEW site with e-commerce enabled
- [ ] Enable manual payment in payment settings
- [ ] Place an order with manual payment
- [ ] Verify order confirmation page shows upload zone
- [ ] Upload a proof → verify it appears in ChatOrderPanel
- [ ] Upload via live chat → verify it reflects on order confirmation page
- [ ] Approve via ChatOrderPanel → verify customer sees "Payment Confirmed"
- [ ] Reject → verify customer gets re-upload prompt
```

#### D. Branding Fixes for Payment Proof Components

The upload zone and status cards in `OrderConfirmationBlock.tsx` must use semantic colors:

```
Required color replacements:
- Upload zone: bg-card (not bg-white), border-dashed border (not border-gray-300)
- Upload zone hover: bg-muted (not bg-gray-50)
- Success card: bg-success/10, text-success (not hardcoded green)
- Pending card: bg-warning/10, text-warning (not hardcoded amber)
- Error message: text-destructive (not hardcoded red)
- File name text: text-foreground (not text-gray-700)
- Instructions text: text-muted-foreground (not text-gray-500)
```

#### E. Error Handling Hardening

```
- [ ] Network failure during upload: show retry button, preserve selected file
- [ ] File too large: clear error message with max size stated
- [ ] Invalid file type: clear error message with accepted types listed
- [ ] Order not found (expired/deleted): graceful fallback message
- [ ] Upload succeeded but notification failed: still show success (notifications are async)
- [ ] Admin client failure on signed URL: show "Unable to load proof" with retry
```

### 8.3 Data Flow Diagram (Actual Architecture)

```
LIVE CHAT ENTRY                    ORDER PAGE ENTRY
     │                                    │
     ▼                                    ▼
chat-attachments (public)      uploadPaymentProof() action
     │                                    │
     ▼                                    │
bridgeChatImageAsPaymentProof()          │
  ├ Intent detection (2 layers)           │
  ├ Download from public bucket           │
  ▼                                       ▼
payment-proofs PRIVATE bucket ◄──── payment-proofs PRIVATE bucket
     │                                    │
     ▼                                    ▼
orders.metadata.payment_proof ◄──── orders.metadata.payment_proof
     │                                    │
     ├── AI chat acknowledgment           ├── notifyChatPaymentProofUploaded()
     ├── Business owner notification      ├── Business owner notification
     └── Order timeline entry             └── Order timeline entry
                    │
                    ▼
        DASHBOARD: ChatOrderPanel
          ├ Approve → payment_status="paid" + confirmation email + AI chat msg
          └ Reject → AI chat msg "please re-upload" + customer can try again
                    │
                    ▼
        OrderConfirmationBlock polls status
          └ Shows: pending → under review → confirmed
```

---

## 9. PHASE 7: Quotation System — End-to-End Polish

### 9.1 How Quotation Mode Works

When enabled in e-commerce settings → Quotes tab → "Quotation Mode" toggle:

1. All "Add to Cart" buttons become "Request a Quote" (custom label configurable)
2. Cart icon disappears from navbar
3. Prices can optionally be hidden
4. Clicking "Request a Quote" navigates to `/quotes` page
5. Customer fills quote form → submits → agency gets notification → sends formal quote → customer accepts/rejects

### 9.2 Components to Polish

#### A. `QuoteRequestBlock` — Quote Submission Form

```
Requirements:
- Product(s) pre-loaded from what customer clicked
- Customer adds more products or adjusts quantities
- Customer info: Name, Email, Phone, Company (optional)
- Notes/message textarea
- "Submit Quote Request" button
- Branding: all semantic colors
- Mobile: full-width form, stacked fields
- Success: confirmation message with quote number
- All text: text-foreground, text-muted-foreground
- All inputs: standard input styling from brand system
```

#### B. `QuoteListBlock` — Customer's Quote List (in My Account)

```
Requirements:
- Table/card list of customer's quotes
- Columns: Quote #, Date, Status, Total, Action
- Status badges using brand-aware colors:
  - Draft: bg-muted, text-muted-foreground
  - Pending: bg-warning/10, text-warning
  - Sent: bg-info/10, text-info
  - Accepted: bg-success/10, text-success
  - Rejected: bg-destructive/10, text-destructive
  - Expired: bg-muted, text-muted-foreground
  - Converted: bg-primary/10, text-primary
- "View" button on each quote
- Empty state: "No quotes yet"
- Mobile: card layout instead of table
```

#### C. `QuoteDetailBlock` — Quote View (from email link)

```
Requirements:
- Quote header: number, date, status, validity
- Sender info (agency): name, address, logo
- Recipient info (customer): name, email, company
- Line items table:
  - Product name, description, quantity, unit price, line total
  - Subtotal, tax, discount, total at bottom
  - All prices contained and aligned
- Terms and conditions section
- Action buttons:
  - "Accept Quote" (bg-success, text-white) — with signature dialog
  - "Reject Quote" (bg-destructive, text-white) — with reason dialog
  - Only shown when status is "sent"
- If accepted: show "Quote Accepted" banner
- If rejected: show "Quote Rejected" banner with reason
- Branding: all semantic colors
- Professional, invoice-like appearance
```

#### D. Quote Notification Flow

Ensure the full notification pipeline works:

```
1. Customer submits quote request
   → Agency gets in-app notification (bell icon)
   → Agency gets email
   → Customer gets confirmation email

2. Agency sends quote to customer
   → Customer gets email with "View Quote" link
   → Link goes to: /quote/[token] (public, no login needed)

3. Customer accepts quote
   → Agency gets in-app notification
   → Agency gets email
   → Customer gets confirmation email
   → Quote status → "accepted"

4. Customer rejects quote
   → Agency gets in-app notification
   → Agency gets email
   → Quote status → "rejected"

5. Quote expires (if automation enabled)
   → Customer gets reminder email before expiry
   → After expiry: status → "expired"
```

---

## 10. PHASE 8: Order Confirmation & Tracking — Post-Purchase

### 10.1 `OrderConfirmationBlock`

```
Requirements:
- Success animation or checkmark icon
- Order number prominently displayed
- Order summary: items, quantities, prices
- Shipping address, billing address
- Payment method and status
- For manual payment: upload proof section (see Phase 6)
- For gateway payment: "Payment confirmed" message
- "Track Your Order" link
- "Continue Shopping" button
- "Chat About Order" button (opens live chat with order context)
- Chat auto-opens after 3 seconds (existing feature)
- Branding: all semantic colors
- Mobile: single column, stacked sections
```

### 10.2 `OrderTrackingBlock`

```
Requirements:
- Lookup form: Email + Order Number
- If user recently placed order: auto-populate from localStorage
- Order status timeline:
  - Each status is a step (pending → confirmed → processing → shipped → delivered)
  - Current step highlighted with brand primary
  - Timeline line connects steps
- Tracking info: carrier, tracking number, tracking URL (clickable)
- Estimated delivery date (if available)
- Order details accordion (expandable)
- Branding: all semantic colors
```

---

## 11. PHASE 9: My Account — Customer Dashboard

### 11.1 `MyAccountBlock`

```
Requirements:
- Tab-based layout:
  - Orders: list of past orders with status, total, date, tracking
  - Quotes: list of quotes with status (uses QuoteListBlock)
  - Addresses: saved addresses with edit/delete
  - Profile: name, email, phone, password change
  - Wishlist: saved products (uses existing wishlist hook)
- Orders tab:
  - Card per order: order #, date, status badge, total, item count
  - "View Details" expands to show items, tracking
  - "Reorder" button (adds items back to cart)
  - Tracking link if shipped
- All tab content: semantic colors, responsive
- Mobile: tabs become a dropdown or horizontal scroll
- Empty states for each section
```

---

## 12. PHASE 10: Navbar & Footer — Module-Aware Navigation

### 12.1 `PremiumNavbarRender` (in `premium-components.tsx`)

```
Requirements:
- Background: inherits from brand palette (bg-background or custom nav bg)
- Text: inherits from brand palette (text-foreground)
- NO hardcoded #ffffff or #1f2937
- Logo section: site logo or site name
- Navigation links: brand text color, hover uses primary or accent
- Utility area (right side):
  - Cart icon (NavCartBadge) — hidden in quotation mode
  - Account icon (NavAccountBadge)
  - Search icon
- Mobile hamburger menu:
  - Slide-in panel or dropdown
  - Same semantic colors
  - Full-width nav items, large tap targets
  - Utility icons at bottom
- Dropdown menus: bg-card, border, text-foreground
- Active link: text-primary or border-b-primary
- Sticky on scroll (optional)
```

### 12.2 Footer

```
Requirements:
- Module-contributed links merged at render time (existing)
- Semantic colors: bg-card or bg-muted for footer, text-foreground
- Columns: responsive grid (4 cols desktop, 2 cols tablet, 1 col mobile)
- Social links with brand-colored icons
- Copyright text: text-muted-foreground
```

---

## 13. PHASE 11: E-Commerce Settings — Every Tab Verified

Go through every tab and ensure all settings are properly wired and working:

### 13.1 General Settings Tab

```
Verify:
- [ ] Store name persists and shows in storefront (emails, checkout)
- [ ] Store email used as "from" email for notifications
- [ ] Store phone shown in contact areas
- [ ] Store address shown in checkout/shipping origin
- [ ] Timezone affects order timestamps display
- [ ] Date/time format applied to dates in storefront (orders, quotes)
- [ ] Weight/dimension units affect product weights and shipping calculations
```

### 13.2 Currency Settings Tab

```
Verify:
- [ ] Default currency code used throughout storefront
- [ ] Currency symbol position (before/after) renders correctly
- [ ] Decimal separator works (comma vs period)
- [ ] Thousands separator works
- [ ] Number of decimal places respected
- [ ] Multi-currency toggle enables/disables correctly
- [ ] Auto-conversion rate updates (if enabled)
- [ ] ALL price displays respect these settings (products, cart, checkout, orders, quotes)
```

### 13.3 Tax Settings Tab

```
Verify:
- [ ] Enable/disable tax toggle affects checkout
- [ ] Prices inclusive/exclusive of tax: when inclusive, tax is extracted; when exclusive, tax is added
- [ ] Tax rates by zone: correct zone matched based on customer address
- [ ] Tax display: shown/hidden based on settings
- [ ] Tax calculation: on subtotal vs per-line-item
- [ ] Tax applied in cart summary, checkout review, order confirmation
- [ ] Tax zones can be added/edited/deleted
```

### 13.4 Shipping Settings Tab

```
Verify:
- [ ] Enable/disable shipping toggle
- [ ] Shipping origin address used for rate calculations
- [ ] Shipping zones: can create, edit, delete zones
- [ ] Shipping methods per zone: flat rate, free shipping, local pickup
- [ ] Flat rate amount correctly applied at checkout
- [ ] Free shipping threshold: free when order exceeds amount
- [ ] Local pickup: no shipping cost, shows pickup instructions
- [ ] Method displayed at checkout with correct prices
```

### 13.5 Payment Settings Tab

```
Verify:
- [ ] Each payment provider can be enabled/disabled
- [ ] API credentials saved securely (encrypted)
- [ ] "Test Connection" button works for each provider
- [ ] Active providers shown at checkout
- [ ] Manual/bank transfer: bank details shown at checkout
- [ ] Minimum/maximum order amounts enforced
- [ ] Capture mode setting respected (authorize vs capture)
- [ ] Provider-specific options saved and used (Zambia-specific for Flutterwave, PesaPal, DPO)
```

### 13.6 Checkout Settings Tab

```
Verify:
- [ ] Guest checkout toggle: when off, requires login/signup
- [ ] Required phone toggle: phone field required/optional at checkout
- [ ] Required company toggle: company field shown/required at checkout
- [ ] Address autocomplete toggle: enables/disables address suggestions
- [ ] Field ordering: drag-to-reorder actually reorders fields at checkout
- [ ] Custom fields: can add extra fields that appear at checkout
- [ ] Order notes: enable/disable customer notes field
```

### 13.7 Notification Settings Tab

```
Verify:
- [ ] Email "from" address used in outgoing emails
- [ ] Email footer text appears in all emails
- [ ] Admin alert toggles: each one enables/disables the respective notification
  - New order notification
  - Low stock notification
  - New review notification
  - New quote request notification
- [ ] Each customer email template:
  - Order confirmation: sent to customer after order placed
  - Order shipped: sent when status changes to shipped
  - Order delivered: sent when status changes to delivered
  - Order cancelled: sent when order cancelled
  - Order refunded: sent when refund processed
  - Quote received: sent when customer submits quote
  - Quote sent: sent when agency sends formal quote
  - Quote accepted: sent when customer accepts
  - Quote rejected: sent when customer rejects
- [ ] Email templates support markdown formatting
- [ ] Template variables work ({{order_number}}, {{customer_name}}, etc.)
- [ ] Preview button shows rendered template
```

### 13.8 Inventory Settings Tab

```
Verify:
- [ ] Track inventory toggle: enables/disables stock tracking
- [ ] Low stock threshold: triggers notification when product stock drops below
- [ ] Backorders: allow/disallow purchasing when out of stock
- [ ] Display stock on storefront: show/hide stock count
- [ ] Reserved stock hold duration: how long to hold items in cart
- [ ] Low stock notifications actually fire when threshold hit
```

### 13.9 Quote Settings Tab

```
Verify:
- [ ] Quotation Mode master toggle:
  - ON: "Add to Cart" becomes "Request a Quote" across ALL pages
  - ON: Cart icon hidden from navbar
  - ON: Optional "Hide Prices" works
  - OFF: Everything reverts to normal shopping mode
- [ ] Button label is customizable
- [ ] Quote numbering format works (prefix + auto-increment)
- [ ] Default validity days applied to new quotes
- [ ] Default tax rate applied to new quotes
- [ ] Default terms and footer text appear on quotes
- [ ] Auto-expire: quotes expire after validity period
- [ ] Reminder emails sent before expiry (if enabled)
- [ ] Branding on quotes: company info, logo, primary color
```

### 13.10 Legal Settings Tab

```
Verify:
- [ ] Terms & Conditions acceptance toggle: checkbox appears at checkout
- [ ] Privacy Policy acceptance toggle: checkbox appears at checkout
- [ ] Terms content (markdown): renders properly when linked
- [ ] Privacy Policy content (markdown): renders properly when linked
- [ ] Refund Policy page content
- [ ] Shipping Policy page content
- [ ] External URL option: links to external policy pages
- [ ] GDPR cookie banner: appears on storefront (if enabled)
- [ ] Data export: customer can request data export
- [ ] Account deletion: customer can request account deletion
```

---

## 14. PHASE 12: Mobile Responsiveness — Every Breakpoint

### 14.1 Breakpoint Strategy

```
xs: < 480px   (small phones)
sm: 480-640px  (large phones)
md: 640-768px  (small tablets)
lg: 768-1024px (tablets/small laptops)
xl: 1024-1280px (laptops)
2xl: > 1280px  (desktops)
```

### 14.2 Component-Specific Responsive Requirements

#### Product Grid

- xs: 1 column (full width cards)
- sm: 2 columns
- md-lg: 3 columns
- xl+: 4 columns

#### Cart Page

- xs-md: single column, items stacked, summary below (sticky bottom)
- lg+: two columns (70/30 split)

#### Checkout

- xs-md: single column, steps stacked
- lg+: two columns (form left, order summary right)
- Step indicator: horizontal with icons on xs, full labels on md+

#### Product Detail

- xs-md: image full width above, details below, sticky "Add to Cart" bar at bottom
- lg+: two columns (image left, details right)

#### Navbar

- xs-md: hamburger menu, utility icons in compact row
- lg+: full horizontal nav with all links visible

#### Quote Views

- xs-md: line items as cards (stacked), totals below
- lg+: table layout with columns

#### My Account

- xs-md: tabs as dropdown select or horizontal scroll
- lg+: vertical tab sidebar + content area

### 14.3 Touch Targets

ALL interactive elements must have:

- Minimum 44x44px touch target area
- Adequate spacing between targets (at least 8px)
- Active/pressed states (opacity or scale)

---

## 15. PHASE 13: Cross-Cutting Concerns

### 15.1 Loading States

Every data-fetching component needs:

- Skeleton loaders matching the real layout
- No layout shift when data loads (CLS ≈ 0)
- Consistent skeleton animation (pulse)

### 15.2 Error States

Every action (add to cart, checkout, quote submit) needs:

- Clear error message
- Retry button where applicable
- The error message uses `text-destructive`
- Errors don't break the page layout

### 15.3 Empty States

Every list/collection needs:

- Centered content with icon/illustration
- Descriptive message
- CTA button (e.g., "Start Shopping", "Browse Products")

### 15.4 Toast Notifications

- Success toasts: green/success-colored
- Error toasts: red/destructive-colored
- Auto-dismiss after 5 seconds
- Positioned consistently (top-right on desktop, top-center on mobile)

### 15.5 Currency Formatting

All prices must go through a consistent `formatCurrency()` utility that:

- Respects the site's currency settings (symbol, position, decimals, separators)
- Handles cents-to-dollars conversion (÷ 100)
- Is used in: product cards, cart, checkout, orders, quotes, emails
- Never produces NaN, undefined, or formatting errors

### 15.6 Animations

Subtle, purposeful animations:

- Page transitions: fade in
- Cart addition: badge bounce
- Quantity change: number transition
- Accordions: smooth height animation
- Dialogs: fade + scale
- No animation on reduced-motion preference: `motion-reduce:transition-none`

---

## 16. PHASE 14: Error Boundaries & Resilience

### 16.1 The Problem

Currently, **zero error boundaries** exist in the e-commerce storefront module. If any single storefront block throws a runtime error (e.g., malformed product data, missing price, null category), the **entire page crashes** with a React white screen. This is catastrophic for a production storefront.

### 16.2 What to Implement

#### A. StorefrontErrorBoundary Component

Create a reusable error boundary component in `studio/components/StorefrontErrorBoundary.tsx`:

```
Requirements:
- React class component (error boundaries MUST be class components)
- Catches errors from any child component
- Renders a graceful fallback UI:
  ┌─────────────────────────────────────────┐
  │  ⚠️ Something went wrong                │
  │                                          │
  │  This section couldn't load.             │
  │  [Try Again] [Continue Shopping]         │
  └─────────────────────────────────────────┘
- Fallback UI uses semantic classes (bg-muted, text-foreground, border)
- Logs error details to console in development
- In production: minimal UI, no stack traces shown
- Accepts a `fallback` prop for custom fallback per block
- Accepts a `blockName` prop for identifying which block failed
```

#### B. Wrap Strategy

**Every top-level storefront block** must be wrapped in `StorefrontErrorBoundary`:

| Block                    | Wrap Location                     | Fallback Behavior                        |
| ------------------------ | --------------------------------- | ---------------------------------------- |
| `ProductGridBlock`       | In `StudioRenderer` block map     | Shows "Products unavailable" + retry     |
| `ProductDetailBlock`     | In `StudioRenderer` block map     | Shows "Product not found" + back to shop |
| `CartPageBlock`          | In virtual page renderer          | Shows "Cart unavailable" + retry         |
| `CheckoutPageBlock`      | In virtual page renderer          | Shows "Checkout unavailable" + retry     |
| `OrderConfirmationBlock` | In virtual page renderer          | Shows "Order details loading..." + retry |
| `MyAccountBlock`         | In virtual page renderer          | Shows "Account unavailable" + retry      |
| `CategoryNavBlock`       | In `StudioRenderer` block map     | Silently fails (non-critical)            |
| `SearchBarBlock`         | In `StudioRenderer` block map     | Shows basic text search input            |
| `MiniCartBlock`          | In navbar                         | Silently fails (shows empty cart icon)   |
| `NavAccountBadge`        | In navbar                         | Silently fails (shows generic user icon) |
| `StorefrontAuthDialog`   | In `StorefrontAuthDialogProvider` | Falls back to page refresh + retry       |

**Wrapping in the renderer (NOT inside each component)** ensures the error boundary is always outside the component that might fail.

#### C. Data Validation Guards

Add defensive checks at the TOP of critical components before rendering:

```
ProductDetailBlock:
  if (!product || !product.id) → return <ProductNotFound />
  if (!product.name) → product.name = "Untitled Product"
  if (typeof product.price !== 'number') → product.price = 0

CartPageBlock:
  if (!Array.isArray(items)) → items = []

CheckoutPageBlock:
  if (!cartItems || cartItems.length === 0) → redirect to cart

OrderConfirmationBlock:
  if (!orderId) → show "Order not found" with link to My Account
```

### 16.3 Files to Create/Modify

| File                                            | Action                                                    |
| ----------------------------------------------- | --------------------------------------------------------- |
| `studio/components/StorefrontErrorBoundary.tsx` | **CREATE** — Reusable error boundary                      |
| `renderer.tsx`                                  | **MODIFY** — Wrap each storefront block in error boundary |
| `craft-renderer.tsx`                            | **MODIFY** — Wrap providers in error boundary             |
| `CheckoutPageBlock.tsx`                         | **MODIFY** — Add data validation guards                   |
| `ProductDetailBlock.tsx`                        | **MODIFY** — Add data validation guards                   |
| `CartPageBlock.tsx`                             | **MODIFY** — Add data validation guards                   |
| `OrderConfirmationBlock.tsx`                    | **MODIFY** — Add data validation guards                   |

---

## 17. PHASE 15: Storefront Authentication — Document, Verify & Brand

### 17.1 Architecture Overview

The storefront authentication system follows a **Shopify-style email-first, client-server token exchange** pattern. It is comprehensively implemented and production-ready. This phase documents the system and specifies branding + hardening fixes.

#### Core Pattern

```
┌─ Browser ─────────────────────────────────────────────────┐
│ StorefrontAuthProvider (React Context)                     │
│  ├─ State: customer, token, isLoggedIn, isLoading          │
│  ├─ Methods: login(), register(), logout(),                │
│  │           setPassword(), refreshCustomer()              │
│  ├─ Token: localStorage("dramac_customer_token_{siteId}")  │
│  └─ On mount: validates existing token via API             │
│                                                            │
│  StorefrontAuthDialog (Modal)                              │
│  ├─ Tabs: "Sign In" | "Create Account"                    │
│  ├─ LoginForm: email + password                            │
│  ├─ RegisterForm: first/last name + email + password       │
│  ├─ SetPasswordForm: for guest→account upgrade             │
│  └─ Forgot password: "Contact the store for assistance"    │
└────────────────────────────────────────────────────────────┘
          │ POST /api/modules/ecommerce/auth
          │ { action, siteId, email, password, ... }
          ▼
┌─ API Route (/api/modules/ecommerce/auth) ─────────────────┐
│ 9 Actions:                                                  │
│  ├─ register   → Supabase Auth + customers table           │
│  ├─ login      → signInWithPassword + create session       │
│  ├─ session    → validate token (SHA-256 hash lookup)      │
│  ├─ logout     → delete session row                        │
│  ├─ set-password → guest upgrade (is_guest→false)          │
│  ├─ magic-link → SKELETON (email sending TODO)             │
│  ├─ get-orders → fetch customer's orders                   │
│  ├─ get-addresses → fetch customer's addresses             │
│  └─ update-profile → update name, phone, marketing prefs   │
│                                                             │
│ Security:                                                   │
│  ├─ Rate limiting: 15 requests/min per IP                  │
│  ├─ Token hashing: SHA-256 (raw hex client, hash server)   │
│  ├─ Session TTL: 30 days automatic expiry                  │
│  ├─ CORS: scoped to request origin                         │
│  └─ Email enumeration prevention: generic error messages   │
└─────────────────────────────────────────────────────────────┘
```

#### Provider Nesting Order

```
craft-renderer.tsx:
  StorefrontProvider (e-commerce data context)
    → StorefrontAuthProvider (customer auth context)
      → StudioRenderer (renders blocks)
        → StorefrontAuthDialogProvider (dialog open/close state)
```

> Note: Providers always wrap even when e-commerce is disabled to prevent React hook reordering errors.

### 17.2 Database Schema (Auth-Related)

| Table                              | Key Columns                                                                                                                                                                                            | Purpose                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `mod_ecommod01_customers`          | `id`, `site_id`, `email` (UNIQUE per site), `first_name`, `last_name`, `phone`, `is_guest`, `auth_user_id` (FK → auth.users), `password_set_at`, `email_verified`, `marketing_consent`, `last_seen_at` | Customer master record — both guests and registered |
| `mod_ecommod01_customer_sessions`  | `id`, `customer_id`, `token_hash` (SHA-256), `expires_at` (30-day TTL), `user_agent`, `ip_address`, `created_at`                                                                                       | Active session tokens — allows multi-device         |
| `mod_ecommod01_customer_addresses` | `id`, `customer_id`, `type` (shipping/billing), `is_default`, `first_name`, `last_name`, `address_line_1`, `address_line_2`, `city`, `state`, `postal_code`, `country`, `phone`                        | Saved addresses                                     |

### 17.3 Authentication Flows

#### Flow 1: Registration

```
1. Customer fills: first name, last name, email, password (≥ 8 chars)
2. POST /api/modules/ecommerce/auth { action: "register", ... }
3. API: Create Supabase Auth user (signUp)
4. API: INSERT into mod_ecommod01_customers (is_guest: false, email_verified: true)
5. API: Generate 32-byte hex token → SHA-256 hash → INSERT customer_sessions
6. Return: { token, customer } → saved to localStorage
7. UI: Dialog closes, NavAccountBadge shows initials
```

#### Flow 2: Login

```
1. Customer enters: email, password
2. POST /api/modules/ecommerce/auth { action: "login", ... }
3. API: signInWithPassword via Supabase Auth
4. API: Update last_seen_at on customers table
5. API: CREATE session (token_hash, expires_at: NOW + 30 days)
6. Return: { token, customer } → saved to localStorage
7. UI: Dialog closes, checkout form pre-fills from customer data
```

#### Flow 3: Guest Checkout → Account Upgrade

```
1. Guest completes checkout with email + shipping details
2. API: Auto-creates customer (is_guest: true) linked to order
3. Order confirmation page shows: "Create account to track orders?"
4. Customer clicks "Set Password" → StorefrontAuthDialog opens (set-password mode)
5. POST /api/modules/ecommerce/auth { action: "set-password", email, password }
6. API: Create Supabase Auth user, UPDATE customer (is_guest→false, password_set_at→NOW)
7. CREATE session → return token
8. Customer now has full account with order history preserved
```

#### Flow 4: Session Validation on Page Load

```
1. StorefrontAuthProvider.useEffect() fires on mount
2. Read token from localStorage("dramac_customer_token_{siteId}")
3. If no token: isLoading = false, isLoggedIn = false
4. If token exists: POST { action: "session", token }
5. API: SHA-256(token) → lookup in customer_sessions → check expires_at
6. Valid: return customer data → setCustomer(), isLoggedIn = true
7. Expired/Invalid: return null → clear localStorage, isLoggedIn = false
```

### 17.4 Checkout Integration

The auth system deeply integrates with the checkout flow:

```
CheckoutPageBlock:
  const { customer, token } = useStorefrontAuth();

  // Auto-populate checkout form from logged-in customer:
  - Email from customer.email
  - Phone from customer.phone
  - Name from customer.firstName + customer.lastName
  - Default shipping address from customer's saved addresses

  // Pass token when placing order:
  placeOrder({ customerToken: token || undefined })

  // API: If token provided, validates and links order to customer
  // API: If no token, auto-creates guest customer from email
```

### 17.5 UI Components

| Component              | File                                         | Lines | Role                                                                                         |
| ---------------------- | -------------------------------------------- | ----- | -------------------------------------------------------------------------------------------- |
| `StorefrontAuthDialog` | `studio/components/StorefrontAuthDialog.tsx` | ~566  | Modal with Login/Register/SetPassword tabs                                                   |
| `NavAccountBadge`      | `studio/components/NavAccountBadge.tsx`      | ~92   | 3 states: loading (faded icon), logged-in (initials badge), guest (icon → opens auth dialog) |
| `MyAccountBlock`       | `studio/components/MyAccountBlock.tsx`       | ~700  | Customer dashboard: Orders, Addresses, Profile tabs + Sign Out                               |

### 17.6 What to Verify & Fix

#### A. Branding Compliance (CRITICAL)

The `StorefrontAuthDialog` and `MyAccountBlock` must pass the same branding audit as all other blocks:

```
StorefrontAuthDialog:
  - Dialog overlay → bg-background/80 backdrop-blur (no hardcoded gray)
  - Dialog content bg → bg-card (not bg-white)
  - Tab indicator → bg-primary (not hardcoded blue)
  - Input fields → bg-background border text-foreground (not hardcoded)
  - Submit button → bg-primary text-primary-foreground
  - Error messages → text-destructive
  - "Forgot password" link → text-muted-foreground
  - Form labels → text-foreground

NavAccountBadge:
  - Logged-in badge → bg-primary text-primary-foreground ✅ (already correct)
  - Guest icon → text-foreground (verify not hardcoded)
  - Hover state → uses brand colors

MyAccountBlock:
  - Tab navigation → active tab uses bg-primary text-primary-foreground
  - Order cards → bg-card border
  - Status badges → semantic colors (pending=warning, delivered=success, etc.)
  - Profile form inputs → bg-background border text-foreground
  - "Sign Out" button → bg-destructive text-destructive-foreground
```

#### B. Forgot Password Decision

**Current state:** "Contact the store for assistance" — no self-service reset.

**Decision required:** Implement one of:

| Option                         | Complexity                                               | Recommendation                                                                             |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **1. Magic link email**        | MEDIUM — skeleton exists in API, needs email integration | ✅ RECOMMENDED — Use existing Supabase Auth `resetPasswordForEmail()` or custom magic link |
| **2. Supabase password reset** | LOW — Supabase Auth has built-in password reset flow     | ✅ GOOD ALTERNATIVE — Leverages existing infrastructure                                    |
| **3. Keep manual**             | NONE                                                     | ❌ NOT RECOMMENDED for production                                                          |

**Implementation if Option 1 (Magic Link):**

```
1. User clicks "Forgot Password?" in LoginForm
2. UI: Shows email input + "Send Reset Link" button
3. POST { action: "magic-link", email, siteId }
4. API: Generate reset token → store in customer_sessions (type: "reset")
5. Send email via site's configured email provider (or Supabase SMTP)
6. User clicks link → opens StorefrontAuthDialog in "set-password" mode
7. POST { action: "set-password", email, password, resetToken }
8. API: Validate reset token → update password → create session
```

**Implementation if Option 2 (Supabase Reset):**

```
1. User clicks "Forgot Password?"
2. Call supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl })
3. Supabase sends branded reset email
4. User clicks link → redirected to site with reset token
5. Site catches token → opens set-password form
6. Update password via supabase.auth.updateUser({ password })
```

#### C. Email Verification Hardening

**Current state:** `email_verified` is set to `true` immediately on registration (no verification email sent).

**Recommendation:** For Phase 15, accept current behavior but add a TODO migration path:

- Track `email_verified_at` timestamp (null = never verified)
- Add optional email verification toggle in site settings
- When enabled: send verification email, block checkout for unverified accounts
- When disabled: current behavior (auto-verified)

#### D. Session Security Enhancements

**Already solid, verify these are working:**

- [ ] SHA-256 token hashing — raw hex never stored server-side
- [ ] 30-day session expiry enforced in `session` action
- [ ] Rate limiting (15/min/IP) active on auth endpoint
- [ ] Logout properly deletes session row (not just client clear)
- [ ] Multiple device sessions work (customer_sessions allows multiple rows per customer_id)

**Add if missing:**

- [ ] `/api/modules/ecommerce/auth` returns proper `Set-Cookie: SameSite=Strict` headers (defense-in-depth with CORS)
- [ ] Token rotation on sensitive actions (password change should invalidate old sessions)
- [ ] Session listing in My Account (optional, nice-to-have)

### 17.7 Customer Dashboard Features (My Account)

Verify all tabs work correctly with branding:

| Tab           | Features                                                             | Status                                          |
| ------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| **Orders**    | List all customer orders, click to view details, order status badges | ✅ Exists — verify branding                     |
| **Addresses** | List saved addresses, set default, add new                           | ✅ Exists — verify "Add New Address" form works |
| **Profile**   | First/last name, phone, marketing consent, sign out                  | ✅ Exists — verify form submission              |
| **Wishlist**  | ⬜ NOT YET ADDED — see Phase 18                                      | ❌ Missing                                      |

### 17.8 Files Involved

| File                                                          | Action                                           |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `context/storefront-auth-context.tsx` (253 lines)             | VERIFY — token persistence, session validation   |
| `studio/components/StorefrontAuthDialog.tsx` (566 lines)      | MODIFY — branding fix, forgot password flow      |
| `studio/components/NavAccountBadge.tsx` (92 lines)            | VERIFY — branding compliance                     |
| `studio/components/MyAccountBlock.tsx` (~700 lines)           | MODIFY — branding fix, verify all tabs           |
| `app/api/modules/ecommerce/auth/route.ts` (~800 lines)        | MODIFY — magic link completion, session rotation |
| `actions/customer-actions.ts` (~900 lines)                    | VERIFY — dashboard CRUD, bulk ops                |
| `app/site/[domain]/[[...slug]]/craft-renderer.tsx` (56 lines) | VERIFY — provider nesting order                  |

---

## 18. PHASE 16: Email Templates — Verification & Branding

### 18.1 The Problem

E-commerce requires transactional emails at multiple touchpoints. Some template infrastructure exists but completeness and branding compliance have not been verified.

### 18.2 Required Email Templates

Every e-commerce site MUST have these transactional emails, all respecting the site's branding:

| Email                       | Trigger                                                       | Recipient      | Priority       |
| --------------------------- | ------------------------------------------------------------- | -------------- | -------------- |
| **Order Confirmation**      | Order placed successfully                                     | Customer       | CRITICAL       |
| **Order Status Update**     | Status changes (processing, shipped, delivered)               | Customer       | CRITICAL       |
| **Shipping Notification**   | Shipment created with tracking number                         | Customer       | HIGH           |
| **Payment Proof Received**  | Customer uploads payment proof                                | Agency (admin) | HIGH           |
| **Payment Approved**        | Agency approves payment proof                                 | Customer       | HIGH           |
| **Payment Rejected**        | Agency rejects payment proof (with reason)                    | Customer       | HIGH           |
| **Quote Received**          | Customer submits quote request                                | Agency (admin) | HIGH           |
| **Quote Sent**              | Agency sends quote to customer                                | Customer       | HIGH           |
| **Quote Accepted**          | Customer accepts quote                                        | Agency (admin) | MEDIUM         |
| **Quote Rejected**          | Customer rejects quote                                        | Agency (admin) | MEDIUM         |
| **Account Welcome**         | Customer registers (not guest)                                | Customer       | MEDIUM         |
| **Password Reset**          | Customer requests password reset (if implementing magic link) | Customer       | HIGH           |
| **Review Request**          | X days after order delivered                                  | Customer       | LOW            |
| **Low Stock Alert**         | Product stock below threshold                                 | Agency (admin) | MEDIUM         |
| **Abandoned Cart Reminder** | Cart inactive for X hours (future)                            | Customer       | LOW (Phase 19) |

### 18.3 What to Verify & Implement

#### A. Template Structure

Each email template must:

```
1. Use the site's brand colors:
   - Header: bg-primary, text-primary-foreground
   - Body: bg-background, text-foreground
   - Buttons: bg-primary, text-primary-foreground
   - Footer: bg-muted, text-muted-foreground

2. Include the site's logo (from site.settings.logo_url)

3. Include the site's name and domain

4. Use responsive HTML email layout (600px max-width, single column)

5. Plain text alternative for every HTML email

6. Unsubscribe link for marketing emails (not transactional)
```

#### B. Email Sending Infrastructure

Verify or implement:

```
1. Email provider configuration in Notification Settings tab
   - SMTP settings (host, port, user, pass)
   - OR: Supabase built-in email (for basic usage)
   - OR: SendGrid/Resend API key integration

2. Email queue/sending function:
   - Shared utility: sendTransactionalEmail(siteId, templateName, recipient, data)
   - Resolves site branding → injects into template
   - Sends via configured provider
   - Logs send attempts/failures

3. Notification Settings tab (settings-actions.ts):
   - Toggle per email type (enable/disable)
   - Preview templates
   - Test send functionality
```

### 18.4 Files to Create/Modify

| File                                            | Action                                 |
| ----------------------------------------------- | -------------------------------------- |
| `templates/emails/*.tsx` or `.html`             | VERIFY exist for all 15 email types    |
| `actions/notification-actions.ts` or similar    | VERIFY email sending utility           |
| `components/settings/notification-settings.tsx` | VERIFY toggle + preview per template   |
| `actions/order-actions.ts`                      | VERIFY triggers email on status change |
| `actions/quote-workflow-actions.ts`             | VERIFY triggers email on quote events  |

---

## 19. PHASE 17: Reviews Integration on Product Pages

### 19.1 The Problem

The e-commerce module has `ReviewFormBlock.tsx` and `ReviewListBlock.tsx` components, plus `review-actions.ts` and `useStorefrontReviews.ts` hook. However, **reviews are NOT currently rendered on the ProductDetailBlock** (single product page). They exist as standalone blocks but aren't integrated into the product viewing experience.

### 19.2 What to Implement

#### A. Integrate Reviews into ProductDetailBlock

```
ProductDetailBlock layout should be:

┌─────────────────────────────────────────────────────┐
│  [Image Gallery]     [Product Info]                  │
│                      - Name                          │
│                      - ★★★★☆ (4.2) · 28 reviews     │  ← Rating summary
│                      - Price                         │
│                      - Description                   │
│                      - Options (size, color)         │
│                      - [Add to Cart] [Add to Quote]  │
│                      - Stock status                  │
├─────────────────────────────────────────────────────┤
│  Tabs: [Description] [Reviews (28)] [Shipping]       │  ← Tab section
├─────────────────────────────────────────────────────┤
│  Reviews Tab:                                        │
│  ┌────────────────────────────────────────────────┐ │
│  │ Customer Reviews (28)           [Write Review]  │ │
│  │                                                  │ │
│  │ ★★★★★ — "Amazing product!" — John D.           │ │
│  │ ★★★★☆ — "Good quality, slow shipping" — Jane   │ │
│  │ ★★★☆☆ — "Average" — Bob                        │ │
│  │                                                  │ │
│  │ [Load More Reviews]                              │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Write Review (expandable or inline):                │
│  ┌────────────────────────────────────────────────┐ │
│  │ ★ ★ ★ ★ ★  (click to rate)                    │ │
│  │ [Your review...]                                │ │
│  │ [Your name]  [Your email]                       │ │
│  │ [Submit Review]                                  │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### B. Rating Summary on Product Cards

In `product-card-block.tsx`, add:

```
- Small star display: ★★★★☆ (4.2)
- Only show if product has reviews (≥ 1)
- Average rating from product's review data
- Positioned below price, small text
```

#### C. Review Moderation in Dashboard

Verify the dashboard side:

```
- Reviews list with approve/reject actions
- Email notification to customer when review approved
- Spam/inappropriate review flagging
- Average rating auto-calculated on product record
```

### 19.3 Files to Modify

| File                                       | Action                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `studio/components/ProductDetailBlock.tsx` | MODIFY — Add reviews tab section, rating summary near title         |
| `studio/components/product-card-block.tsx` | MODIFY — Add small rating display below price                       |
| `studio/components/ReviewFormBlock.tsx`    | VERIFY — Branding compliance, integrated mode (not just standalone) |
| `studio/components/ReviewListBlock.tsx`    | VERIFY — Branding compliance, pagination, integrated mode           |
| `hooks/useStorefrontReviews.ts`            | VERIFY — Fetches reviews by product, calculates average             |
| `actions/review-actions.ts`                | VERIFY — CRUD, moderation, average calculation                      |

---

## 20. PHASE 18: Social Sharing, Print CSS & Wishlist

### 20.1 Social Sharing (HIGH Priority — Zambia Market)

WhatsApp is the dominant communication platform in Zambia. Every product and quote must be shareable.

#### A. Product Sharing

Add a share button on `ProductDetailBlock`:

```
Share Button Options:
  📱 WhatsApp — "Check out [Product Name] for K250.00 — [URL]"
  📋 Copy Link — copies product URL to clipboard
  📧 Email — mailto: with product name + URL in body
  📘 Facebook — Open Graph share (requires og:tags)
```

**WhatsApp Share Implementation:**

```
const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
  `Check out ${product.name} for ${formatCurrency(product.price)} — ${productUrl}`
)}`;
window.open(whatsappUrl, '_blank');
```

#### B. Quote/Order Sharing

On `QuoteDetailBlock` and `OrderConfirmationBlock`:

```
📱 [Share on WhatsApp] — "I just placed an order at [Store Name]! Order #12345"
📋 [Copy Order Link]
```

#### C. Open Graph Meta Tags

Ensure product pages generate proper OG tags for rich link previews:

```html
<meta property="og:title" content="Product Name" />
<meta property="og:description" content="Product description..." />
<meta property="og:image" content="product-image-url" />
<meta property="og:url" content="product-page-url" />
<meta property="og:type" content="product" />
<meta property="product:price:amount" content="250.00" />
<meta property="product:price:currency" content="ZMW" />
```

### 20.2 Print CSS (HIGH Priority)

Customers need to print order confirmations, quotes, and invoices as PDF or paper documents.

#### A. Print Stylesheet

Add print-specific CSS rules to `globals.css` or a dedicated `print.css`:

```css
@media print {
  /* Hide non-essential UI */
  .studio-renderer nav,
  .studio-renderer footer,
  .studio-renderer [data-block="mini-cart"],
  .studio-renderer [data-block="search-bar"],
  .studio-renderer .share-buttons,
  .studio-renderer .add-to-cart-btn,
  button[data-print-hidden] {
    display: none !important;
  }

  /* Force visible backgrounds */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Page margins */
  @page {
    margin: 2cm;
  }

  /* Ensure text is black on white for readability */
  body {
    color: #000 !important;
    background: #fff !important;
  }

  /* Table borders visible */
  table,
  th,
  td {
    border: 1px solid #ccc !important;
  }
}
```

#### B. Print Buttons

Add "Print" / "Download PDF" button to:

| Page                            | Button Location                 |
| ------------------------------- | ------------------------------- |
| `OrderConfirmationBlock`        | Top-right, next to order number |
| `QuoteDetailBlock`              | Top-right, next to quote status |
| `MyAccountBlock` (order detail) | Within order detail view        |

Implementation: `window.print()` with the print CSS handling layout.

### 20.3 Wishlist Tab in My Account (MEDIUM Priority)

#### A. Current State

- `useStorefrontWishlist.ts` hook EXISTS and works (localStorage-based)
- Wishlist data: stored in `localStorage("wishlist_{siteId}")` as product ID array
- Products can be wishlisted from product cards and product detail
- **BUT:** There is no "Wishlist" tab in `MyAccountBlock` to view all wishlisted products

#### B. What to Implement

Add a 4th tab to `MyAccountBlock`:

```
MyAccountBlock Tabs:
  [Orders] [Addresses] [Wishlist] [Profile]
                         ^^^^^^^^ NEW

Wishlist Tab:
  ┌────────────────────────────────────────────────┐
  │ My Wishlist (5 items)                           │
  │                                                 │
  │ ┌─────┐ Product Name          K250.00          │
  │ │ img │ In Stock                                │
  │ └─────┘ [Add to Cart] [Remove]                  │
  │                                                 │
  │ ┌─────┐ Another Product       K1,500.00        │
  │ │ img │ Out of Stock                            │
  │ └─────┘ [Notify When Available] [Remove]        │
  │                                                 │
  │ Empty State: "Your wishlist is empty"            │
  │              [Start Shopping]                    │
  └────────────────────────────────────────────────┘
```

**Note:** Since wishlist is localStorage-based, it works for both guests and logged-in users. For logged-in users, consider syncing to server (future enhancement).

### 20.4 Files to Create/Modify

| File                                           | Action                                      |
| ---------------------------------------------- | ------------------------------------------- |
| `studio/components/ProductDetailBlock.tsx`     | MODIFY — Add share buttons                  |
| `studio/components/product-card-block.tsx`     | MODIFY — Add small share icon (WhatsApp)    |
| `studio/components/QuoteDetailBlock.tsx`       | MODIFY — Add share + print buttons          |
| `studio/components/OrderConfirmationBlock.tsx` | MODIFY — Add share + print buttons          |
| `studio/components/MyAccountBlock.tsx`         | MODIFY — Add Wishlist tab (4th tab)         |
| `app/site/[domain]/[[...slug]]/page.tsx`       | MODIFY — Add OG meta tags for product pages |
| `globals.css`                                  | MODIFY — Add `@media print` rules           |

---

## 21. PHASE 19: Inventory & Discount Integrity — Critical Fixes

> **SEVERITY: CRITICAL** — These are production-breaking bugs that can cause real financial losses.

### 21.1 BUG: Stock Not Deducted on Order Creation

**Current State:**

- `inventory-actions.ts` has full stock management: `adjustStock()`, `bulkAdjustStock()`, `getStockHistory()`, `getStockAlerts()`
- `public-ecommerce-actions.ts` validates stock **when adding to cart** (`track_inventory && quantity < requested`)
- **BUT:** `createPublicOrderFromCart()` creates orders and copies cart items **without ever calling `adjustStock()`**
- The checkout API route also has **no stock deduction**
- Result: **10 people can buy the last item** because stock never decreases. Overselling is guaranteed.

**The Fix:**

```
In createPublicOrderFromCart() (public-ecommerce-actions.ts):

AFTER order is created, BEFORE returning success:

1. For each order item:
   a. If product.track_inventory === true:
      - Call adjustStock({
          productId: item.product_id,
          variantId: item.variant_id || null,
          adjustment: -item.quantity,
          reason: "order",
          referenceType: "order",
          referenceId: order.id
        })
      - If adjustStock fails (concurrent depletion):
        Mark order as "pending_stock_review" (don't fail the order)

2. ALSO: Add optimistic stock lock BEFORE inserting order:
   a. Re-validate all items have sufficient stock (race condition guard)
   b. If any item is now out of stock:
      - Return error: "Some items are no longer available"
      - List which items failed
      - Cart stays intact for customer to adjust

3. Edge case: If order is CANCELLED:
   a. Reverse stock: adjustStock(+quantity, reason: "order_cancelled")
   b. This must be in order-actions.ts updateOrderStatus()
```

### 21.2 BUG: Discount Usage Never Incremented

**Current State:**

- `validateDiscountCode()` checks usage limits (`usage_count < usage_limit`)
- `incrementDiscountUsage()` function EXISTS in `ecommerce-actions.ts`
- **BUT:** `createPublicOrderFromCart()` stores `discount_code` on the order but **never calls `incrementDiscountUsage()`**
- Result: A discount with `usage_limit: 1` can be used **infinitely** because `usage_count` stays at 0

**The Fix:**

```
In createPublicOrderFromCart() (public-ecommerce-actions.ts):

AFTER order is created:
1. If order has discount_code:
   a. Call incrementDiscountUsage(siteId, discountCode)
   b. If increment fails (concurrent use beyond limit):
      - Order still valid (don't punish customer)
      - Log warning for admin
      - Flag order for review

ALSO: Add once-per-customer enforcement:
1. In validateDiscountCode():
   a. Query: SELECT 1 FROM orders WHERE discount_code = ? AND customer_email = ?
   b. If found and discount is once_per_customer: reject
```

### 21.3 Payment Webhook Idempotency

**Current State:**

- `webhooks/payment/route.ts` processes gateway callbacks (Paddle, Flutterwave, Pesapal, DPO Pay)
- Signature verification exists for Paddle (HMAC) and Flutterwave (bearer token)
- **BUT:** No deduplication — if a webhook fires twice, the order could be updated twice

**The Fix:**

```
In webhook handler:
1. Extract payment_transaction_id from gateway payload
2. BEFORE updating order:
   a. Check: SELECT 1 FROM order_timeline WHERE
      event_type = 'payment' AND metadata->>'transaction_id' = ?
   b. If found: return 200 OK (already processed, idempotent)
   c. If not found: process payment, record transaction_id in timeline
3. Add webhook logging: INSERT into a webhook_logs table
   (gateway, event_type, payload_hash, status, processed_at)
```

### 21.4 Tax Calculation Accuracy

**Current State:**

- `tax_rate` in settings, `tax_enabled` toggle — basic flat-rate tax works
- Products have `is_taxable` and `tax_class` fields in the schema
- **BUT:** Checkout calculates tax as `subtotal * tax_rate / 100` ignoring per-product `is_taxable`
- Result: Tax is charged on non-taxable products (e.g., basic foods, exports)

**The Fix:**

```
In checkout API route:
1. For each order item:
   a. Fetch product.is_taxable (default: true)
   b. If is_taxable === false: exclude from taxable subtotal
2. Calculate tax: taxableSubtotal * (tax_rate / 100)
3. Display in checkout summary:
   - Subtotal: K1,000.00
   - Tax (16% on K800.00): K128.00  ← shows taxable amount
   - Total: K1,128.00
```

### 21.5 Files to Modify

| File                                                  | Action                                                                 | Priority     |
| ----------------------------------------------------- | ---------------------------------------------------------------------- | ------------ |
| `actions/public-ecommerce-actions.ts`                 | MODIFY — Add stock deduction + discount increment after order creation | **CRITICAL** |
| `actions/order-actions.ts`                            | MODIFY — Add stock reversal on order cancellation                      | **CRITICAL** |
| `actions/ecommerce-actions.ts`                        | VERIFY — `incrementDiscountUsage()` works correctly                    | **HIGH**     |
| `app/api/modules/ecommerce/webhooks/payment/route.ts` | MODIFY — Add idempotency + logging                                     | **MEDIUM**   |
| `app/api/modules/ecommerce/checkout/route.ts`         | MODIFY — Per-product tax calculation                                   | **MEDIUM**   |

---

## 22. PHASE 20: SEO & Structured Data — Storefront Visibility

### 22.1 What Already Exists

- `structured-data.ts` — Comprehensive JSON-LD: Product schema, ItemList, BreadcrumbList, Organization, WebSite with SearchAction
- `ecommerce-seo-injector.tsx` — Server component injecting JSON-LD for product/shop/category pages
- Handles: images, SKU, GTIN, brand, aggregate ratings, variant pricing (AggregateOffer), availability
- Quotation mode awareness (skips product schema when prices are hidden)

### 22.2 What's Missing

#### A. Open Graph & Twitter Meta Tags (CRITICAL for Social Sharing)

Product pages currently have NO `<meta>` tags for social previews. Without these, WhatsApp/Facebook/Twitter sharing (Phase 18) shows generic previews with no image or description.

**Implementation in `page.tsx` (generateMetadata):**

```
For product pages (/products/[slug]):
  <meta property="og:title" content="Product Name — Store Name" />
  <meta property="og:description" content="Product description (truncated 160 chars)" />
  <meta property="og:image" content="primary-product-image-url" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="canonical-product-url" />
  <meta property="og:type" content="product" />
  <meta property="product:price:amount" content="250.00" />
  <meta property="product:price:currency" content="ZMW" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Product Name" />
  <meta name="twitter:description" content="Product description" />
  <meta name="twitter:image" content="primary-product-image-url" />

For shop pages (/shop):
  <meta property="og:title" content="Shop — Store Name" />
  <meta property="og:type" content="website" />
  ... (site logo as og:image)

For category pages (/shop?category=shoes):
  <meta property="og:title" content="Shoes — Store Name" />
  ... (category image or site logo)
```

#### B. Canonical URLs

Prevent duplicate content penalties:

```
For every storefront page:
  <link rel="canonical" href="https://domain.com/path" />

Specifically:
  /products/blue-sneakers → canonical: https://store.com/products/blue-sneakers
  /shop?category=shoes&sort=price → canonical: https://store.com/shop?category=shoes
  (strip sort/page params, keep category)
```

#### C. Sitemap Generation

**Create:** `src/app/site/[domain]/sitemap.xml/route.ts`

```
Dynamic sitemap that:
1. Fetches all published products for the site
2. Fetches all categories with products
3. Generates XML sitemap:
   - / (homepage)
   - /shop (shop page)
   - /shop?category={slug} (each category)
   - /products/{slug} (each product)
   - /cart, /checkout, /account (low priority)
4. Sets lastmod to product/page updated_at
5. Sets changefreq: products=weekly, shop=daily, homepage=daily
6. Sets priority: homepage=1.0, shop=0.9, products=0.8, categories=0.7
```

#### D. Robots.txt Awareness

Ensure storefront pages aren't accidentally blocked:

```
- /checkout, /account → noindex (private user pages)
- /products/*, /shop → index, follow
- /api/* → disallow in robots.txt
```

### 22.3 Files to Create/Modify

| File                                     | Action                                                 |
| ---------------------------------------- | ------------------------------------------------------ |
| `app/site/[domain]/[[...slug]]/page.tsx` | MODIFY — Add `generateMetadata()` with OG/Twitter tags |
| `app/site/[domain]/sitemap.xml/route.ts` | **CREATE** — Dynamic sitemap                           |
| `ecommerce-seo-injector.tsx`             | VERIFY — JSON-LD already works                         |
| `structured-data.ts`                     | VERIFY — Schema.org compliance                         |

---

## 23. PHASE 21: API Security Hardening

### 23.1 The Problem

Only auth (15/min) and checkout (10/min) endpoints are rate-limited. Other public-facing APIs have **zero protection** against abuse.

### 23.2 What to Implement

#### A. Rate Limiting on All Public APIs

| Endpoint                               | Current Limit | Proposed Limit             | Risk if Unprotected          |
| -------------------------------------- | ------------- | -------------------------- | ---------------------------- |
| `/api/modules/ecommerce/auth`          | 15/min/IP     | 15/min/IP ✅               | Brute force                  |
| `/api/modules/ecommerce/checkout`      | 10/min/IP     | 10/min/IP ✅               | Order flooding               |
| `/api/modules/ecommerce/cart`          | **NONE**      | 30/min/IP                  | Cart spam, DB bloat          |
| `/api/modules/ecommerce/products`      | **NONE**      | 60/min/IP                  | Scraping, DoS                |
| `/api/modules/ecommerce/orders`        | **NONE**      | 20/min/IP                  | Data scraping                |
| `/api/modules/ecommerce/payment-proof` | **NONE**      | 5/min/IP                   | Storage abuse (file uploads) |
| `/api/modules/ecommerce/reviews`       | **NONE**      | 10/min/IP                  | Review spam                  |
| `/api/modules/ecommerce/webhooks/*`    | **NONE**      | 30/min/IP (per gateway IP) | Replay attacks               |

#### B. Input Validation Hardening

Verify all public endpoints validate:

```
- siteId: valid UUID format
- email: proper email format
- quantities: positive integers, max 999
- prices: never accepted from client (always server-calculated)
- text fields: max length limits (product name search: 200 chars, review text: 5000 chars)
- File uploads: max 10MB, only image MIME types, virus-free filename patterns
```

#### C. CORS Enforcement

```
Verify all API routes:
- Only accept requests from the site's own domain
- No wildcard Access-Control-Allow-Origin
- Webhook endpoints: verify signature/token instead of CORS
```

### 23.3 Files to Modify

| File                                               | Action                       |
| -------------------------------------------------- | ---------------------------- |
| `app/api/modules/ecommerce/cart/route.ts`          | MODIFY — Add rate limiting   |
| `app/api/modules/ecommerce/products/route.ts`      | MODIFY — Add rate limiting   |
| `app/api/modules/ecommerce/orders/route.ts`        | MODIFY — Add rate limiting   |
| `app/api/modules/ecommerce/payment-proof/route.ts` | MODIFY — Add rate limiting   |
| `app/api/modules/ecommerce/reviews/route.ts`       | MODIFY — Add rate limiting   |
| `lib/rate-limit.ts`                                | MODIFY — Add new limit tiers |

---

## 24. PHASE 22: Future Enhancements

> These features are **NOT part of the current overhaul** but should be planned for and coded defensively so they can be added later without refactoring.

### 24.1 Abandoned Cart Recovery

**When to build:** After email infrastructure (Phase 16) is solid.

```
Architecture:
1. Cart records already exist in mod_ecommod01_carts with customer association
2. Add cron job or scheduled function:
   - Query carts not converted to orders within X hours
   - Filter: has customer email (from checkout started or logged-in)
   - Send "You left items in your cart" email with cart recovery link
3. Cart recovery link: /checkout?cart={cart_id}&recover=true
4. Track: email sent, opened, clicked, recovered → analytics

Settings:
- Enable/disable in Checkout Settings
- Delay: hours after cart abandoned (default: 4 hours)
- Max reminders per cart: 3
- Exclude carts below minimum value
```

### 24.2 Back-in-Stock Notifications

**When to build:** After email infrastructure (Phase 16) is solid.

```
Architecture:
1. Add "Notify When Available" button on out-of-stock products
2. New table: mod_ecommod01_stock_notifications
   - site_id, product_id, variant_id (nullable), email, created_at, notified_at
3. When stock updated (inventory-actions.ts):
   - If stock goes from 0 → >0: query notification subscribers
   - Send "Back in Stock!" email with direct product link
4. Auto-delete notification after sending
5. Rate limit: max 1 notification per product per email per day

Settings:
- Enable/disable in Inventory Settings
- Email template customization
```

### 24.3 Social Login

**When to build:** After core auth (Phase 15) is verified.

```
Options:
1. Google OAuth — via Supabase Auth (built-in provider)
2. Facebook Login — via Supabase Auth (built-in provider)

Architecture:
- Supabase Auth already supports OAuth providers
- Add provider buttons to StorefrontAuthDialog
- On OAuth success: check if customer exists by email
  - Yes: link to existing customer, create session
  - No: auto-create customer from OAuth profile
- Update NavAccountBadge to show profile photo if available
```

### 24.4 Advanced Search & Filters

**When to build:** When product catalogs grow beyond 100 items.

```
Enhancements:
- Full-text search with Supabase pg_trgm or ts_vector
- Filter by: price range, categories (multi-select), ratings, stock status
- Sort by: price (asc/desc), newest, bestselling, rating
- URL-based filters (/shop?category=shoes&min=100&max=500) for shareability
- Search suggestions/autocomplete dropdown
```

### 24.5 Customer Order Reordering

```
- "Reorder" button on past orders in My Account
- Adds all items from previous order to current cart
- Handles: out-of-stock items (skip with notice), price changes (show updated total)
```

### 24.6 Product Comparison

```
- "Compare" checkbox on product cards
- Comparison tray at bottom of screen (max 4 products)
- Comparison page: side-by-side specs, pricing, ratings
```

---

## 25. Implementation Rules

### DO ✅

1. **Use semantic Tailwind classes**: `bg-card`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border`, `bg-background`
2. **Accept color props via defaultProps as empty strings** — let brand injection fill them
3. **Use `|| undefined` for inline fontFamily styles** — prevents empty strings from blocking CSS cascade
4. **Use `tabular-nums` for all price/number displays**
5. **Test with contrasting themes**: white bg + dark text, dark bg + light text, colored bg + white text
6. **Test with long currency values**: `K999,999,999.99`
7. **Test with 50+ categories**
8. **Test with 0, 1, 3, 10, 50, and 100 products**
9. **Test with very long product names**
10. **Run `npx tsc --noEmit --skipLibCheck` after every change**

### DON'T ❌

1. **Never use `bg-white`, `bg-gray-*`, `text-gray-*`** in storefront blocks
2. **Never use `dark:` Tailwind variants** in storefront blocks (the brand system handles themes)
3. **Never hardcode hex colors in defaultProps** (except state colors)
4. **Never use template literal grid classes** like `grid-cols-${n}` (not compiled by Tailwind)
5. **Never assume the background is white**
6. **Never assume the text is dark**
7. **Never create site-specific fixes** — all changes go to core components
8. **Never skip TypeScript checking**
9. **Never forget cents-to-dollars conversion** (`price / 100`)
10. **Never break the existing `injectBrandColors` pipeline** — components receive colors via this system

---

## 26. Verification Checklist

### After Implementation, Test Each Scenario:

#### Theme Testing

- [ ] Create a site with a LIGHT theme (white bg, dark text) → all e-commerce pages look correct
- [ ] Create a site with a DARK theme (dark bg, light text) → all e-commerce pages look correct
- [ ] Create a site with a COLORED theme (blue bg, white text) → all e-commerce pages look correct
- [ ] Verify no white-on-white text anywhere
- [ ] Verify no dark-on-dark text anywhere
- [ ] Verify all buttons are readable
- [ ] Verify all inputs are visible and usable

#### Price/Amount Testing

- [ ] Add a product with price K1.00 → displays correctly everywhere
- [ ] Add a product with price K999,999.99 → displays correctly, no overflow
- [ ] Cart with 10 items → totals display correctly
- [ ] Checkout total with discount + tax + shipping → all contained in boxes

#### Category Testing

- [ ] 0 categories → category filter hidden or shows "All Products"
- [ ] 3 categories → chips layout
- [ ] 15 categories → dropdown layout
- [ ] 50 categories → dropdown with search, no vertical list

#### Cart & Checkout Testing

- [ ] Add to cart → cart badge updates
- [ ] Update quantity → total updates
- [ ] Remove item → updates correctly
- [ ] Empty cart → empty state shown
- [ ] Guest checkout → works without login
- [ ] Manual payment → bank details shown, upload proof available
- [ ] Gateway payment → redirect works
- [ ] Order placed → confirmation page shows
- [ ] Payment proof upload → works from checkout AND confirmation page
- [ ] Payment proof visible in agency dashboard
- [ ] Payment proof approve/reject works

#### Quotation Testing

- [ ] Enable quotation mode → "Add to Cart" becomes "Request a Quote" sitewide
- [ ] Cart icon disappears
- [ ] Hide prices option works
- [ ] Submit quote request → notifications to agency + confirmation to customer
- [ ] Agency sends quote → customer receives email with link
- [ ] Customer accepts → both parties notified
- [ ] Customer rejects → agency notified
- [ ] Disable quotation mode → everything reverts to normal

#### Settings Testing

(Each setting tab verified per Phase 11 checklist above)

#### Mobile Testing

- [ ] All pages tested at 375px width (iPhone SE)
- [ ] All pages tested at 414px width (iPhone 14)
- [ ] All pages tested at 768px width (iPad)
- [ ] All pages tested at 1024px width (iPad landscape)
- [ ] All touch targets ≥ 44x44px
- [ ] No horizontal scroll on any page
- [ ] Sticky elements work correctly
- [ ] Modals/dialogs usable on mobile

#### Existing Sites

- [ ] Generate a NEW site with AI → e-commerce module auto-installed → all features work
- [ ] Check EXISTING sites → changes take effect (core components updated)
- [ ] No regression in existing functionality

#### Error Boundaries (Phase 14)

- [ ] ProductGridBlock throws error → shows fallback, rest of page works
- [ ] CartPageBlock with corrupt data → shows retry, doesn't crash
- [ ] CheckoutPageBlock with missing cart → redirects gracefully
- [ ] Nested component error → caught by nearest boundary, not propagated
- [ ] Error fallback UI uses semantic branding classes

#### Auth & Account (Phase 15)

- [ ] Register with email + password → account created, auto-login
- [ ] Login with valid credentials → logged in, NavAccountBadge shows initials
- [ ] Login with wrong password → generic "Invalid email or password" (no enumeration)
- [ ] Guest checkout → auto-creates guest customer
- [ ] Guest sets password → upgrades to full account, order history preserved
- [ ] Page reload → session validated, stays logged in
- [ ] After 30 days → session expired, prompted to re-login
- [ ] Logout → session deleted server-side, localStorage cleared
- [ ] Rate limiting → 16th request within 1 minute returns 429
- [ ] Auth dialog uses site brand colors (not hardcoded)
- [ ] My Account page uses site brand colors (not hardcoded)
- [ ] Forgot password flow works (per Phase 15 decision)

#### Email Templates (Phase 16)

- [ ] Place order → confirmation email sent with branding
- [ ] Order status change → email sent
- [ ] Payment proof approved/rejected → email sent
- [ ] Quote workflow → emails at each step
- [ ] All emails readable on mobile (600px max-width)

#### Reviews (Phase 17)

- [ ] ProductDetailBlock shows reviews tab with count
- [ ] Product card shows star rating (if reviews exist)
- [ ] Submit review → saved, pending moderation
- [ ] Approved review → appears on product page
- [ ] Average rating calculated correctly

#### Social/Print/Wishlist (Phase 18)

- [ ] WhatsApp share → opens WhatsApp with product message
- [ ] Copy link → URL in clipboard
- [ ] Product page OG tags → rich preview on WhatsApp/Facebook
- [ ] Print order confirmation → clean layout, nav/footer hidden
- [ ] Print quote → clean layout with totals
- [ ] Wishlist tab in My Account → shows wishlisted products
- [ ] Add to wishlist from product card → appears in My Account tab

#### Inventory & Discount Integrity (Phase 19 — CRITICAL)

- [ ] Place order → product stock decreases by ordered quantity
- [ ] Place order for last item → next customer sees "Out of Stock"
- [ ] Two concurrent orders for last item → one succeeds, one gets "no longer available"
- [ ] Cancel order → stock restored
- [ ] Use discount code → usage_count incremented
- [ ] Discount with usage_limit: 1 → second use rejected
- [ ] Once-per-customer discount → same email can't reuse
- [ ] Payment webhook fires twice → order updated only once (idempotent)
- [ ] Non-taxable product → no tax charged at checkout
- [ ] Mix of taxable + non-taxable → tax calculated only on taxable items

#### SEO (Phase 20)

- [ ] Share product link on WhatsApp → shows product image + name + price in preview
- [ ] Share shop link on Facebook → shows store name + logo
- [ ] Product page source → has JSON-LD Product schema
- [ ] Visit /sitemap.xml → lists all products and categories
- [ ] /checkout, /account pages → have `noindex` meta tag
- [ ] Product page → has `<link rel="canonical">` tag

#### API Security (Phase 21)

- [ ] Spam cart endpoint 50 times → rate limited after 30
- [ ] Spam payment proof upload → rate limited after 5
- [ ] Submit review 15 times → rate limited after 10
- [ ] File upload > 10MB → rejected
- [ ] Invalid UUID for siteId → returns 400, not 500

---

## Appendix A: File Map

### Storefront Block Components (to be modified)

```
src/modules/ecommerce/studio/components/
├── product-card-block.tsx          ← Product card in grid
├── ProductDetailBlock.tsx          ← Single product page
├── ProductGridBlock.tsx            ← Shop page with grid
├── ProductImageGallery.tsx         ← Image gallery
├── ProductPriceDisplay.tsx         ← Price formatting
├── ProductQuickView.tsx            ← Quick view modal
├── ProductRatingDisplay.tsx        ← Star ratings
├── ProductSortBlock.tsx            ← Sort dropdown
├── ProductStockBadge.tsx           ← In/out of stock badge
├── FeaturedProductsBlock.tsx       ← Featured section
├── CartPageBlock.tsx               ← Full cart page
├── CartDrawerBlock.tsx             ← Slide-out cart
├── CartItemCard.tsx                ← Individual cart item
├── CartSummaryCard.tsx             ← Cart totals
├── CartEmptyState.tsx              ← Empty cart state
├── CartQuantitySelector.tsx        ← Qty +/- buttons
├── CartDiscountInput.tsx           ← Discount code input
├── MiniCartBlock.tsx               ← Header mini cart
├── NavCartBadge.tsx                ← Cart icon badge
├── NavAccountBadge.tsx             ← Account icon
├── CheckoutPageBlock.tsx           ← Multi-step checkout
├── CheckoutStepIndicator.tsx       ← Step dots/labels
├── AddressForm.tsx                 ← Address fields
├── ShippingMethodSelector.tsx      ← Shipping options
├── PaymentMethodSelector.tsx       ← Payment options
├── OrderConfirmationBlock.tsx      ← Post-purchase
├── OrderSummaryCard.tsx            ← Order summary
├── OrderTrackingBlock.tsx          ← Track order
├── QuoteRequestBlock.tsx           ← Submit quote form
├── QuoteListBlock.tsx              ← Customer quote list
├── QuoteDetailBlock.tsx            ← View quote
├── QuoteItemCard.tsx               ← Quote line item
├── QuotePriceBreakdown.tsx         ← Quote totals
├── QuoteStatusBadge.tsx            ← Quote status chip
├── QuoteActionButtons.tsx          ← Accept/reject
├── ReviewFormBlock.tsx             ← Write review
├── ReviewListBlock.tsx             ← Review list
├── SearchBarBlock.tsx              ← Product search
├── FilterSidebarBlock.tsx          ← Filters
├── ActiveFilters.tsx               ← Applied filter chips
├── BreadcrumbBlock.tsx             ← Breadcrumbs
├── CategoryCard.tsx                ← Category card
├── CategoryHeroBlock.tsx           ← Category hero
├── CategoryNavBlock.tsx            ← Category navigation
├── MyAccountBlock.tsx              ← Customer account
├── StorefrontAuthDialog.tsx        ← Login/signup modal
├── StorefrontErrorBoundary.tsx      ← Error boundary (Phase 14 CREATE)
└── mobile/                         ← Mobile-specific variants
    ├── MobileCheckoutPage.tsx
    ├── MobileCartBottomSheet.tsx
    ├── MobileProductCard.tsx
    ├── StickyAddToCartBar.tsx
    └── ... (20+ mobile components)
```

### Core Engine Files

```
src/lib/studio/engine/
├── brand-colors.ts                 ← Brand palette resolution
├── renderer.tsx                    ← Component renderer with injection
└── smart-navigation.ts            ← Module-aware nav items

src/lib/studio/blocks/
└── premium-components.tsx          ← Navbar & Footer renderers
```

### Authentication Files

```
src/modules/ecommerce/context/
└── storefront-auth-context.tsx      ← Auth provider + React context (253 lines)

src/app/api/modules/ecommerce/auth/
└── route.ts                        ← Auth API route (800+ lines, 9 actions)

src/app/site/[domain]/[[...slug]]/
├── craft-renderer.tsx              ← Provider nesting (StorefrontProvider → AuthProvider → StudioRenderer)
└── page.tsx                        ← generateMetadata() for OG/Twitter tags (Phase 20)
```

### SEO & Webhooks

```
src/modules/ecommerce/lib/
├── structured-data.ts              ← JSON-LD Product/ItemList/BreadcrumbList schemas
└── shipping-calculator.ts          ← Zone-based shipping calculation

src/modules/ecommerce/components/
└── ecommerce-seo-injector.tsx      ← Server component injecting JSON-LD

src/app/api/modules/ecommerce/webhooks/payment/
└── route.ts                        ← Payment gateway callbacks (Paddle, Flutterwave, Pesapal, DPO)

src/app/site/[domain]/sitemap.xml/
└── route.ts                        ← Dynamic sitemap (Phase 20 CREATE)
```

### Live Chat Integration

```
src/modules/live-chat/
├── chat-event-bridge.ts            ← notifyChatPaymentProofUploaded(), notifyChatOrderStatusChanged()
├── chat-order-actions.ts           ← getOrderContextForChat(), verifyUserSiteAccess()
├── ai-responder.ts                 ← 3-tier order selection (metadata → regex → fallback)
└── components/ChatOrderPanel.tsx   ← Order sidebar with approve/reject payment proof
```

### Server Actions

```
src/modules/ecommerce/actions/
├── ecommerce-actions.ts            ← Core CRUD
├── public-ecommerce-actions.ts     ← Public storefront actions
├── order-actions.ts                ← Order management
├── settings-actions.ts             ← All settings tabs
├── quote-actions.ts                ← Quote CRUD
├── quote-template-actions.ts       ← Quote templates
├── quote-workflow-actions.ts       ← Quote automation
├── customer-actions.ts             ← Customer management
├── analytics-actions.ts            ← Analytics
├── inventory-actions.ts            ← Inventory
├── review-actions.ts               ← Reviews
├── integration-actions.ts          ← Payment gateways
├── marketing-actions.ts            ← Campaigns
├── product-import-export.ts        ← CSV import/export
├── store-template-actions.ts       ← Store templates
└── auto-setup-actions.ts           ← Auto-setup
```

### Dashboard Settings Components

```
src/modules/ecommerce/components/settings/
├── general-settings.tsx
├── currency-settings.tsx
├── tax-settings.tsx
├── shipping-settings.tsx
├── payment-settings.tsx
├── checkout-settings.tsx
├── notification-settings.tsx
├── inventory-settings.tsx
├── quote-settings.tsx
└── legal-settings.tsx
```

### Custom Hooks

```
src/modules/ecommerce/hooks/
├── useStorefrontCart.ts
├── useStorefrontProduct.ts
├── useStorefrontProducts.ts
├── useStorefrontCategories.ts
├── useStorefrontSearch.ts
├── useStorefrontWishlist.ts
├── useStorefrontReviews.ts
├── useCheckout.ts
├── useProductFilters.ts
├── useQuotations.ts
├── useRecentlyViewed.ts
├── useMobile.ts
└── ... (20 hooks total)
```

---

## Appendix B: Database Tables Reference

| Table                              | Purpose                                          |
| ---------------------------------- | ------------------------------------------------ |
| `mod_ecommod01_products`           | Product catalog                                  |
| `mod_ecommod01_product_categories` | Product-category mapping                         |
| `mod_ecommod01_categories`         | Category tree                                    |
| `mod_ecommod01_product_options`    | Size, color, etc.                                |
| `mod_ecommod01_product_variants`   | SKU variants                                     |
| `mod_ecommod01_carts`              | Shopping carts (guest + user)                    |
| `mod_ecommod01_cart_items`         | Cart line items                                  |
| `mod_ecommod01_orders`             | Orders with metadata JSONB                       |
| `mod_ecommod01_order_items`        | Order line items                                 |
| `mod_ecommod01_order_timeline`     | Order event log                                  |
| `mod_ecommod01_order_shipments`    | Shipping records                                 |
| `mod_ecommod01_discounts`          | Discount codes                                   |
| `mod_ecommod01_customers`          | Customer records (guests + registered)           |
| `mod_ecommod01_customer_sessions`  | Auth session tokens (SHA-256 hashed, 30-day TTL) |
| `mod_ecommod01_customer_addresses` | Saved shipping/billing addresses                 |
| `mod_ecommod01_settings`           | Per-site JSONB settings                          |
| `mod_ecommod01_reviews`            | Product reviews                                  |
| `mod_ecommod01_quotes`             | Quotations                                       |
| `mod_ecommod01_quote_items`        | Quote line items                                 |
| `mod_ecommod01_quote_activities`   | Quote event log                                  |

---

## Appendix C: Critical Technical Notes

### 1. Price Storage: CENTS (Integers)

ALL monetary values in the database are stored as **cents** (integers):

- `K250.00` → stored as `25000`
- Display: `(value / 100).toFixed(2)` → `"250.00"`
- Input: `Math.round(parseFloat(input) * 100)` → `25000`
- Never display raw cents to user
- Never pass dollars to database

### 2. Supabase snake_case → camelCase

Database returns `snake_case`. TypeScript uses `camelCase`. Always use `mapRecord()`/`mapRecords()` when returning raw Supabase data from server actions.

### 3. Admin Client for Public Actions

Public-facing server actions (storefront) use `createAdminClient()` to bypass RLS since visitors aren't authenticated. All queries are scoped by `site_id`.

### 4. Currency Formatting

Use the locale config from `src/lib/locale-config.ts`:

- Default locale: `en-ZM`
- Default currency: `ZMW` (Zambian Kwacha, symbol: `K`)
- Default timezone: `Africa/Lusaka`

The `formatCurrency()` utility should respect per-site currency settings (from `mod_ecommod01_settings`).

### 5. Vercel Hobby Constraints

- Max 60s per serverless function
- AI operations split into multi-step APIs
- ISR with 60s revalidation for published pages

---

_This document is the single source of truth for the E-Commerce Core Overhaul. 22 phases covering branding, checkout, payments, quotations, auth, inventory integrity, SEO, security, and resilience. Follow it phase by phase, verify each section, and commit frequently. The goal: a bulletproof, beautiful, brand-adaptive e-commerce system that works perfectly on every site, with every theme, on every device._

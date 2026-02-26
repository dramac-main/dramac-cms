# PHASE: E-Commerce Module — Production-Ready Comprehensive Fix

**Priority**: CRITICAL — Module is non-functional (orders cannot be placed)
**Scope**: Every e-commerce component, page, action, widget, template, and database table
**Goal**: Make the entire e-commerce module fully functional, mobile-responsive, correctly branded, and production-ready

---

## TABLE OF CONTENTS

1. [Platform Context](#1-platform-context)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [File Inventory](#4-file-inventory)
5. [Critical Bugs — Fix Immediately](#5-critical-bugs)
6. [Branding System](#6-branding-system)
7. [Mobile Responsiveness](#7-mobile-responsiveness)
8. [Checkout Flow](#8-checkout-flow)
9. [Cart System](#9-cart-system)
10. [Product Pages](#10-product-pages)
11. [Order Lifecycle](#11-order-lifecycle)
12. [Payment Integration](#12-payment-integration)
13. [Email Notifications](#13-email-notifications)
14. [Analytics](#14-analytics)
15. [Storefront Widget](#15-storefront-widget)
16. [Quotation System](#16-quotation-system)
17. [PDF Generation](#17-pdf-generation)
18. [Navigation Integration](#18-navigation-integration)
19. [SEO & Structured Data](#19-seo-and-structured-data)
20. [Published Site Rendering](#20-published-site-rendering)
21. [Admin Dashboard](#21-admin-dashboard)
22. [Testing Checklist](#22-testing-checklist)

---

## 1. PLATFORM CONTEXT

### What is DRAMAC CMS?
DRAMAC is a **multi-tenant SaaS platform** where agencies create websites for their clients. Each agency has multiple sites, each site can install modules. The E-Commerce module is one such installable module.

### Hierarchy
```
Agency (organization)
  └── Site (client's website)
        └── Module Installation (e-commerce)
              ├── Products, Categories, Variants
              ├── Cart, Checkout, Orders
              ├── Customers, Addresses
              ├── Payments (5 providers)
              ├── Shipping, Fulfillment
              ├── Quotes, Invoices, PDFs
              └── Analytics, Reports
```

### Two Contexts
1. **Dashboard** (admin) — Agency staff manage products, process orders, configure settings. URL: `app.dramacagency.com/dashboard/sites/[siteId]/ecommerce`
2. **Published Site** (customer-facing) — End customers browse products, add to cart, checkout, track orders. URL: `clientsite.sites.dramacagency.com/shop`

### Key Principle
Published sites must use the **site's brand colors**, NOT DRAMAC's colors. Every customer-facing component must respect CSS variables injected by the branding system. The dashboard uses its own theme (this is fine). Only published-site components need brand compliance.

---

## 2. TECHNOLOGY STACK

- **Framework**: Next.js 16.1.1 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Styling**: Tailwind CSS 4.x, Radix UI, shadcn/ui components
- **State**: Zustand (cart), TanStack Query (data fetching), React Hook Form + Zod
- **Payments**: Paddle, Flutterwave, Pesapal, DPO Group, Manual/Bank Transfer
- **Email**: Resend (transactional), Handlebars templates
- **Images**: next/image with Supabase Storage (`nfirsqmyxmmtbignofgb.supabase.co`)
- **Locale**: Default `en-ZM` (Zambia), currency `ZMW` (Zambian Kwacha, symbol `K`)
- **Fonts**: Google Fonts loaded dynamically per site settings

### Critical Rules
- **Snake_case ↔ camelCase**: Supabase returns `snake_case` columns. ALL server actions returning raw data MUST use `mapRecord()`/`mapRecords()` from `src/lib/map-db-record.ts`
- **Admin vs Public client**: Dashboard actions use RLS-bound `createClient()`. Public actions (storefront, checkout) use `createAdminClient()` to bypass RLS (anonymous users can't pass RLS)
- **Server actions**: Located in `src/modules/ecommerce/actions/`. Import with `'use server'` directive
- **Supabase Project ID**: `nfirsqmyxmmtbignofgb`

---

## 3. DATABASE SCHEMA

### Table Prefix
All e-commerce tables use prefix `mod_ecommod01_`. There are **49 tables** total.

### Core Tables

#### `mod_ecommod01_orders` (32 columns)
```
id                      uuid        NOT NULL  DEFAULT gen_random_uuid()
site_id                 uuid        NOT NULL
agency_id               uuid        NOT NULL
order_number            text        NOT NULL
customer_id             uuid        NULLABLE
customer_email          text        NOT NULL
customer_phone          text        NULLABLE
shipping_address        jsonb       NOT NULL    ← {firstName, lastName, address, city, state, postalCode, country}
billing_address         jsonb       NOT NULL
subtotal                numeric     NOT NULL    ← decimal, NOT cents
discount_amount         numeric     NULLABLE    DEFAULT 0
discount_code           text        NULLABLE
shipping_amount         numeric     NULLABLE    DEFAULT 0
tax_amount              numeric     NULLABLE    DEFAULT 0
total                   numeric     NOT NULL    ← decimal, NOT cents
currency                text        NULLABLE    DEFAULT 'USD'
status                  text        NULLABLE    DEFAULT 'pending'   ← pending/processing/shipped/delivered/cancelled/refunded
payment_status          text        NULLABLE    DEFAULT 'pending'   ← pending/paid/failed/refunded
payment_method          text        NULLABLE
payment_provider        text        NULLABLE
payment_transaction_id  text        NULLABLE
fulfillment_status      text        NULLABLE    DEFAULT 'unfulfilled'
shipping_method         text        NULLABLE
tracking_number         text        NULLABLE
tracking_url            text        NULLABLE
shipped_at              timestamptz NULLABLE
delivered_at            timestamptz NULLABLE
customer_notes          text        NULLABLE    ← NOT "notes", NOT "customer_name"
internal_notes          text        NULLABLE
metadata                jsonb       NULLABLE    DEFAULT '{}'
created_at              timestamptz NULLABLE    DEFAULT now()
updated_at              timestamptz NULLABLE    DEFAULT now()
```

**⚠️ CRITICAL: There is NO `customer_name` column. The code tries to insert it and fails.**

**⚠️ CRITICAL: Money columns are `numeric` (decimal like 250.00), NOT cents (25000). The analytics code references `total_cents`, `subtotal_cents`, `tax_cents`, `shipping_cents`, `discount_cents` — NONE of these exist.**

#### `mod_ecommod01_products` (30 columns)
```
id                  uuid        NOT NULL  DEFAULT gen_random_uuid()
site_id             uuid        NOT NULL
agency_id           uuid        NOT NULL
name                text        NOT NULL
slug                text        NOT NULL
description         text        NULLABLE
short_description   text        NULLABLE
base_price          numeric     NOT NULL    ← decimal amount
compare_at_price    numeric     NULLABLE    ← original price for "sale" display
cost_price          numeric     NULLABLE
tax_class           text        NULLABLE
is_taxable          boolean     NULLABLE
sku                 text        NULLABLE
barcode             text        NULLABLE
track_inventory     boolean     NULLABLE
quantity            integer     NULLABLE
low_stock_threshold integer     NULLABLE
weight              numeric     NULLABLE
weight_unit         text        NULLABLE
status              text        NULLABLE    ← active/draft/archived
is_featured         boolean     NULLABLE
seo_title           text        NULLABLE
seo_description     text        NULLABLE
images              jsonb       NULLABLE    ← string[] of Supabase Storage URLs
metadata            jsonb       NULLABLE
created_by          uuid        NULLABLE
created_at          timestamptz NULLABLE
updated_at          timestamptz NULLABLE
average_rating      numeric     NULLABLE
review_count        integer     NULLABLE
```

**⚠️ `images` is `string[]` (array of URL strings), NOT `{url: string, alt: string}[]`. Components must treat each entry as a plain URL string.**

#### `mod_ecommod01_carts` / `mod_ecommod01_cart_items`
```
-- Carts
id          uuid        NOT NULL
site_id     uuid        NOT NULL
session_id  text        NULLABLE
customer_id uuid        NULLABLE
currency    text        NULLABLE    DEFAULT 'ZMW'
metadata    jsonb       NULLABLE
expires_at  timestamptz NULLABLE
created_at  timestamptz NULLABLE
updated_at  timestamptz NULLABLE

-- Cart Items
id              uuid        NOT NULL
cart_id         uuid        NOT NULL  FK → carts.id
product_id      uuid        NOT NULL  FK → products.id
variant_id      uuid        NULLABLE  FK → product_variants.id
quantity        integer     NOT NULL
unit_price      numeric     NOT NULL
custom_options  jsonb       NULLABLE
created_at      timestamptz NULLABLE
```

#### `mod_ecommod01_order_items`
```
id              uuid        NOT NULL
order_id        uuid        NOT NULL  FK → orders.id
product_id      uuid        NULLABLE
variant_id      uuid        NULLABLE
product_name    text        NOT NULL  ← snapshot at time of order
variant_name    text        NULLABLE
sku             text        NULLABLE
quantity        integer     NOT NULL
unit_price      numeric     NOT NULL
subtotal        numeric     NOT NULL
tax_amount      numeric     NULLABLE    DEFAULT 0
discount_amount numeric     NULLABLE    DEFAULT 0
total           numeric     NOT NULL
image_url       text        NULLABLE
metadata        jsonb       NULLABLE
created_at      timestamptz NULLABLE
```

#### Other Important Tables
- `mod_ecommod01_categories` — Product categories with `slug`, `parent_id` for hierarchy
- `mod_ecommod01_product_categories` — Junction: product ↔ category (many-to-many)
- `mod_ecommod01_product_variants` — Size/color/etc variants with their own price/sku/stock
- `mod_ecommod01_product_options` — Option groups (e.g., "Size" with values ["S","M","L"])
- `mod_ecommod01_customers` — Customer records with `name`, `email`, `phone`
- `mod_ecommod01_customer_addresses` — Saved addresses per customer
- `mod_ecommod01_reviews` — Product reviews with rating, title, content, verified_purchase
- `mod_ecommod01_discounts` — Coupon/discount codes with rules (%, fixed, free shipping, etc.)
- `mod_ecommod01_order_shipments` — Shipment tracking per order
- `mod_ecommod01_order_timeline` — Audit trail of order status changes
- `mod_ecommod01_order_notes` — Internal/customer-visible notes on orders
- `mod_ecommod01_order_refunds` — Refund records
- `mod_ecommod01_settings` — Site-level e-commerce settings (currency, tax, shipping, etc.)
- `mod_ecommod01_quotes` / `mod_ecommod01_quote_items` / `mod_ecommod01_quote_templates` — Quotation system
- `mod_ecommod01_flash_sales` / `mod_ecommod01_flash_sale_products` — Time-limited sales
- `mod_ecommod01_bundles` / `mod_ecommod01_bundle_items` — Product bundles
- `mod_ecommod01_gift_cards` / `mod_ecommod01_gift_card_transactions` — Gift card system
- `mod_ecommod01_loyalty_config` / `mod_ecommod01_loyalty_points` / `mod_ecommod01_loyalty_transactions` — Loyalty program
- `mod_ecommod01_inventory_locations` / `mod_ecommod01_location_stock` / `mod_ecommod01_inventory_movements` — Multi-location inventory
- `mod_ecommod01_integrations` / `mod_ecommod01_integration_logs` — Third-party integrations
- `mod_ecommod01_webhook_endpoints` / `mod_ecommod01_webhook_deliveries` / `mod_ecommod01_webhook_event_types` — Webhook system
- `mod_ecommod01_analytics_snapshots` / `mod_ecommod01_saved_reports` / `mod_ecommod01_report_history` — Analytics

### RLS Policy
All tables use the same pattern — site isolation via agency membership:
```sql
site_id IN (
  SELECT sites.id FROM sites 
  WHERE sites.agency_id IN (
    SELECT agency_members.agency_id FROM agency_members 
    WHERE agency_members.user_id = auth.uid()
  )
)
```
This means **anonymous users (storefront visitors) cannot read/write through the RLS-bound client**. Public-facing actions MUST use `createAdminClient()`.

---

## 4. FILE INVENTORY

### Server Actions (`src/modules/ecommerce/actions/`)
| File | Lines | Purpose |
|------|-------|---------|
| `ecommerce-actions.ts` | ~2000 | Main CRUD: products, categories, orders, customers, settings, discounts |
| `public-ecommerce-actions.ts` | ~800 | Public storefront: cart operations, checkout, order placement |
| `ecommerce-analytics-actions.ts` | ~1200 | Analytics: revenue, conversion, top products, customer segments |
| `ecommerce-notification-actions.ts` | ~400 | Order notification emails (confirmation, status changes) |
| `ecommerce-quote-actions.ts` | ~600 | Quotation CRUD and lifecycle |
| `flash-sale-actions.ts` | ~300 | Flash sale management |
| `bundle-actions.ts` | ~300 | Bundle management |
| `gift-card-actions.ts` | ~300 | Gift card management |
| `loyalty-actions.ts` | ~300 | Loyalty program |
| `inventory-actions.ts` | ~400 | Multi-location inventory |
| `shipping-actions.ts` | ~300 | Shipping methods and rates |
| `integration-actions.ts` | ~300 | Third-party integrations |
| `webhook-actions.ts` | ~300 | Webhook management |
| `report-actions.ts` | ~300 | Report generation |
| `review-actions.ts` | ~200 | Product reviews CRUD |
| `customer-actions.ts` | ~300 | Customer management |
| `payment-provider-actions.ts` | ~500 | Multi-provider payment processing |
| `auto-setup-actions.ts` | ~250 | Auto-creates /shop, /cart, /checkout, /order-confirmation pages |

### Studio Blocks (`src/lib/studio/blocks/` and `src/components/studio/blocks/`)
| File | Purpose |
|------|---------|
| `renders.tsx` | Main render functions for ALL published-site blocks (12,000+ lines) — includes product grid, cart, checkout |
| `premium-components.tsx` | Premium block renderers |
| `interactive/ProductGridBlock.tsx` | Enhanced product catalog with filters/sort/pagination |
| `interactive/product-grid-block.tsx` | Simple product grid (delegates to ProductCardBlock) |
| `interactive/product-card-block.tsx` | Individual product card with image, price, add-to-cart |
| `interactive/ProductDetailBlock.tsx` | Product detail page with gallery, variants, reviews |
| `interactive/ProductImageGallery.tsx` | Image gallery with thumbnails and zoom |
| `interactive/CheckoutPageBlock.tsx` | Multi-step checkout (shipping → payment → review) |
| `interactive/AddressForm.tsx` | Checkout address form |
| `interactive/CheckoutStepIndicator.tsx` | Step progress bar |
| `interactive/CartPageBlock.tsx` | Full cart page |
| `interactive/CartItemCard.tsx` | Individual cart item row |
| `interactive/CartDrawerBlock.tsx` | Slide-out cart drawer |
| `interactive/MiniCartBlock.tsx` | Popover mini cart |
| `interactive/OrderConfirmationBlock.tsx` | Post-checkout confirmation |
| `interactive/SearchBarBlock.tsx` | Product search with results dropdown |
| `interactive/CategoryHeroBlock.tsx` | Category page hero banner |
| `interactive/CategoryNavBlock.tsx` | Category navigation sidebar |
| `interactive/EcommerceQuoteRequest.tsx` | Quote request form |

### Mobile Components (`src/modules/ecommerce/components/mobile/`)
| File | Purpose |
|------|---------|
| `MobileCheckoutPage.tsx` | Full mobile-optimized checkout ← EXISTS BUT DISCONNECTED |
| `MobileAddressInput.tsx` | Touch-optimized address form |
| `MobileCartButton.tsx` | Floating cart FAB with badge |
| `MobileCartBottomSheet.tsx` | Bottom sheet cart drawer |
| `MobileSelect.tsx` | Native select for mobile |
| `StickyCheckoutFooter.tsx` | Fixed bottom CTA bar |
| `MobileInput.tsx` | Large touch target inputs (h-14, 56px) |
| `MobileCheckoutProgress.tsx` | Step dots + progress bar |
| `MobileCartItem.tsx` | Swipeable cart item |
| `SwipeableCartItem.tsx` | Gesture-based cart item with swipe-to-delete |
| `MobileProductCard.tsx` | Mobile product card |
| `ProductSwipeView.tsx` | Swipeable product image gallery |
| Plus ~10 more mobile components |

### Dashboard Components (`src/modules/ecommerce/components/`)
Large set of admin UI components for managing products, orders, customers, settings, etc. These are admin-only and do NOT need to be mobile-responsive or brand-compliant (they use the dashboard theme).

### Widgets
| File | Purpose |
|------|---------|
| `StorefrontWidget.tsx` | Embeddable storefront widget with product display + cart |

### Hooks (`src/modules/ecommerce/hooks/`)
| File | Purpose |
|------|---------|
| `useStorefrontCart.ts` | Cart state management (Zustand-based) |
| `useCheckout.ts` | Checkout flow state and logic |
| `useEcommerceStatus.ts` | Module installation check |
| `useProducts.ts` | Product data fetching |
| Plus ~13 more hooks |

### API Routes (`src/app/api/modules/ecommerce/`)
| Route | Purpose |
|-------|---------|
| `checkout/route.ts` | Checkout processing API |
| `products/route.ts` | Public product listing API |
| `cart/route.ts` | Cart operations API |
| `webhooks/[provider]/route.ts` | Payment provider webhooks |
| Plus others for reviews, payments, etc. |

### Page Templates (auto-created when module is installed)
| Page | URL | Components |
|------|-----|------------|
| Shop | `/shop` | Hero + SearchBar + FeaturedProducts + CategoryNav + ProductGrid |
| Cart | `/cart` | Breadcrumb + CartPage |
| Checkout | `/checkout` | Breadcrumb + CheckoutPage |
| Order Confirmation | `/order-confirmation` | OrderConfirmation + FeaturedProducts |
| Product Detail | `/products/[slug]` | Dynamic — Breadcrumb + ProductDetail + RelatedProducts |
| Category | `/categories/[slug]` | Dynamic — CategoryHero + ProductGrid (filtered) |

---

## 5. CRITICAL BUGS — FIX IMMEDIATELY

### BUG 1: `customer_name` Column Missing (ORDER BLOCKER)
**Severity**: 🔴 CRITICAL — No orders can be placed
**Error**: `"Could not find the 'customer_name' column of 'mod_ecommod01_orders' in the schema cache"`

**Root Cause**: The database table `mod_ecommod01_orders` does NOT have a `customer_name` column. But the code in `public-ecommerce-actions.ts` → `createPublicOrderFromCart()` and the checkout API route both try to insert `customer_name`.

**Files that reference `customer_name`**:
- `src/modules/ecommerce/actions/public-ecommerce-actions.ts` — `createPublicOrderFromCart()` inserts it
- `src/app/api/modules/ecommerce/checkout/route.ts` — passes it to order creation
- `src/modules/ecommerce/types/ecommerce-types.ts` — `Order` interface defines it
- `src/modules/ecommerce/actions/ecommerce-actions.ts` — references in order queries
- `src/modules/ecommerce/actions/ecommerce-notification-actions.ts` — uses it for email greeting

**Fix Required**: Add the column to the database via migration:
```sql
ALTER TABLE mod_ecommod01_orders ADD COLUMN customer_name text;
```
Then verify all insert/select queries work correctly.

### BUG 2: Analytics Queries Use Wrong Column Names
**Severity**: 🔴 CRITICAL — Entire analytics dashboard shows zeros/nulls

**Root Cause**: `ecommerce-analytics-actions.ts` (1200+ lines) references:
- `total_cents` → should be `total`
- `subtotal_cents` → should be `subtotal`
- `tax_cents` → should be `tax_amount`
- `shipping_cents` → should be `shipping_amount`
- `discount_cents` → should be `discount_amount`

There are **40+ occurrences** of these wrong column names throughout the analytics file.

**Fix Required**: Find and replace ALL `_cents` column references with the correct column names. The values are stored as decimal amounts (e.g., `250.00`), not cents (e.g., `25000`). Adjust any arithmetic that divides by 100.

### BUG 3: Country Dropdown Missing Zambia + Only 8 Countries
**Severity**: 🟠 HIGH — Zambian customers (the primary market) cannot select their country

**Root Cause**: `AddressForm.tsx` has a hardcoded list of only 8 Western countries:
```typescript
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'NZ', name: 'New Zealand' }
]
```

The platform is Zambia-based! There's a comprehensive `getCountryList()` function in `src/modules/ecommerce/lib/settings-utils.ts` that has 50+ countries with Zambia at the top. The checkout form doesn't use it.

**Fix Required**: Import and use `getCountryList()` from `settings-utils.ts` in `AddressForm.tsx`. Ensure Zambia (ZM) and all African countries are included with Zambia as the default/top option.

### BUG 4: Cart Badge Not Showing on Navbar
**Severity**: 🟡 MEDIUM — Users don't know how many items are in their cart

**Root Cause**: The navbar cart icon is generated by `smart-navigation.ts` which creates a plain `<a href="/cart">` with a static SVG cart icon. It intentionally strips template badges (`{{cartCount}}`). The design relies on `EcommerceCartInjector` (floating FAB) to show the count, but:
1. The FAB is small and positioned in the corner — easy to miss
2. On desktop, users expect the navbar cart icon to show a badge
3. The `MiniCartBlock` and `CartDrawerBlock` DO have badges, but they must be explicitly placed by the site builder

**Fix Required**: Create a client-side wrapper component for the navbar cart icon that:
1. Uses `useStorefrontCart()` to get live `itemCount`
2. Renders a small red badge (with count) overlaid on the cart icon
3. Listens to `cart-updated` CustomEvent for real-time updates
4. Hydrates client-side (the navbar is server-rendered, but the badge must be client-rendered)

---

## 6. BRANDING SYSTEM

### How Published Site Branding Works
1. Site owner sets brand colors in Dashboard → Site Settings → Branding tab
2. Colors saved to `sites.settings` JSONB: `primary_color`, `secondary_color`, `accent_color`, `background_color`, `text_color`, `font_heading`, `font_body`
3. On published site load, `StudioRenderer` calls `resolveBrandColors()` which creates a full palette
4. `generateBrandCSSVars()` generates CSS custom properties applied to `.studio-renderer` div
5. All shadcn/ui tokens (`--primary`, `--secondary`, `--accent`, `--background`, etc.) are overridden
6. Component props are injected with brand colors via `injectBrandColors()` using `BRAND_COLOR_MAP`
7. Google Fonts are loaded dynamically based on site's font settings

### Available CSS Variables on Published Sites
```css
/* Tailwind HSL tokens (used by Tailwind classes like bg-primary) */
--color-primary: H S% L%;
--color-primary-foreground: H S% L%;
--color-secondary: ...;
--color-accent: ...;
--color-background: ...;
--color-foreground: ...;
--color-muted: ...;
--color-border: ...;
--color-input: ...;
--color-ring: ...;

/* Shadcn tokens (used by shadcn/ui components) */
--primary: H S% L%;
--primary-foreground: ...;
--background: ...;
--foreground: ...;
--card: ...;
--popover: ...;
--muted: ...;
--border: ...;
--input: ...;
--ring: ...;

/* Direct hex values */
--brand-primary: #hexcolor;
--brand-secondary: #hexcolor;
--brand-button-text: #hexcolor;

/* Fonts */
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-display: 'Playfair Display', serif;
```

### Branding Rules for Components
1. **NEVER hardcode** `#3b82f6`, `#2563eb`, `#1d4ed8`, `#8B5CF6`, or any brand-like color
2. **Use CSS variables**: `bg-primary`, `text-primary`, `border-primary` (Tailwind classes that read CSS vars)
3. **For inline styles**: Use `var(--brand-primary, #0f172a)` with neutral fallback
4. **For component defaults**: Use empty string `""` to let the branding system inject the correct color
5. **Semantic colors are OK**: `text-red-500` for errors, `text-green-500` for success, `text-amber-500` for warnings — these are NOT brand colors
6. **The neutral fallback** is `#0f172a` (Tailwind slate-900) — a dark neutral that works on white backgrounds

### Known Branding Issue: Radix Portals
The checkout country dropdown uses Radix UI `<Select>` which renders its `<SelectContent>` in a **portal** appended to `<body>`. The portal is OUTSIDE the `.studio-renderer` div where brand CSS variables are set. This means the dropdown inherits the **dashboard's default theme** instead of the site's brand.

**Fix Options**:
1. Use a native `<select>` element for the country field (respects inherited styles, better mobile UX too)
2. Or add a `container` prop to `SelectContent` pointing to the `.studio-renderer` element
3. Or duplicate the brand CSS variables on `<body>` for published sites

---

## 7. MOBILE RESPONSIVENESS

### Current State: POOR
The checkout flow and several e-commerce components are NOT mobile-friendly. A complete mobile optimization pass is required.

### Specific Issues

#### Checkout Page (`CheckoutPageBlock.tsx`)
- **Grid layout**: `grid-cols-1 lg:grid-cols-3` — order summary stacks below on mobile ✅ (adequate)
- **Input fields**: Default shadcn Input height (~36px) — below Apple/Google's 44px minimum touch target ❌
- **Country dropdown**: Radix Select portal — poor mobile UX (not native picker) ❌
- **Navigation buttons**: `flex justify-between mt-8` — no responsive sizing, buttons can be too small ❌
- **No sticky footer**: The "Continue" / "Place Order" button is at the bottom of a long form, requiring scroll ❌
- **Order summary**: Doesn't collapse on mobile — takes significant space above the fold ❌
- **No keyboard optimization**: Missing `inputMode`, `enterKeyHint`, `autoComplete` attributes ❌

#### Address Form (`AddressForm.tsx`)
- **Form layout**: `grid-cols-1 sm:grid-cols-2` for name row — OK ✅
- **City/State/Zip**: `grid-cols-1 sm:grid-cols-3` — stacks on mobile ✅
- **Input sizes**: Standard height, no `h-12` or `h-14` for touch targets ❌
- **iOS auto-zoom**: `fontSize: 14px` in some inputs triggers Safari auto-zoom (needs ≥16px) ❌
- **No auto-advance**: Missing `enterKeyHint="next"` for field-to-field navigation ❌

#### Product Grid
- **Responsive columns**: `mobile: 2, tablet: 3, desktop: 4` ✅ (good)
- **Product cards**: Reasonable sizing ✅
- **Image aspect ratios**: Consistent with `aspect-square` ✅

#### Cart Page (`CartPageBlock.tsx`)
- Need to verify responsive layout
- Cart item rows should stack on mobile
- Quantity selectors need adequate touch targets

#### Mobile Components EXIST But Are Disconnected
There is a COMPLETE set of mobile-optimized checkout components in `src/modules/ecommerce/components/mobile/`:
- `MobileCheckoutPage.tsx` — Collapsible sections, accordion-style progression
- `MobileAddressInput.tsx` — Native `<select>` for country, large inputs
- `MobileCartButton.tsx` — Floating FAB with badge
- `MobileCartBottomSheet.tsx` — Bottom sheet cart drawer
- `StickyCheckoutFooter.tsx` — Always-visible CTA at bottom
- `MobileInput.tsx` — `h-14` (56px) touch targets, 16px font (no iOS zoom)
- `MobileCheckoutProgress.tsx` — Step dots + progress bar
- `SwipeableCartItem.tsx` — Swipe-to-delete gesture

**These components are fully built but NEVER used.** The main `CheckoutPageBlock.tsx` does NOT detect mobile and does NOT render these components.

### Fix Required
Two approaches (choose one):
1. **Approach A** — Wire in the mobile components: `CheckoutPageBlock` detects mobile (via `useIsMobile()` hook or media query) and renders `MobileCheckoutPage` on small screens
2. **Approach B** — Make the desktop checkout fully responsive: Add responsive Tailwind classes, larger touch targets, native selects, sticky footer, collapsible order summary

**Recommended: Approach A** — The mobile components already exist and are well-built. Just wire them in.

---

## 8. CHECKOUT FLOW

### Current Flow (Step by Step)

1. **Customer clicks "Checkout"** from cart page
   - Navigates to `/checkout`
   - `CheckoutPageBlock` renders with `useCheckout()` hook

2. **Step 1: Shipping Address**
   - `AddressForm` renders with fields: email, phone, first name, last name, company, address, apt/suite, city, state, postal code, country
   - **Country dropdown only has 8 countries** ← BUG
   - Validation: email required, first/last name required, address required, city required, state required, postal code required, country required

3. **Step 2: Shipping Method**
   - Shows available shipping methods from `mod_ecommod01_settings`
   - Free shipping threshold logic
   - Flat rate / calculated options

4. **Step 3: Payment Method**
   - Multi-provider support: Paddle, Flutterwave, Pesapal, DPO, Manual/Bank Transfer
   - Each provider has its own checkout flow
   - Card payment forms rendered per provider

5. **Step 4: Review & Confirm**
   - Shows order summary, addresses, selected shipping/payment
   - "Place Order" button calls `createPublicOrderFromCart()`
   - **This fails because `customer_name` column is missing** ← CRITICAL BUG

6. **Order Created** → Redirect to `/order-confirmation?orderId=xxx`
   - `OrderConfirmationBlock` shows order details + tracking info

### Checkout State Management (`useCheckout.ts`)
```typescript
interface CheckoutState {
  step: 'shipping' | 'payment' | 'review' | 'confirmation'
  shippingAddress: Address
  billingAddress: Address
  billingSameAsShipping: boolean
  shippingMethod: ShippingMethod | null
  paymentMethod: PaymentMethod | null
  couponCode: string
  customerNotes: string
  isProcessing: boolean
  error: string | null
}
```

### Order Creation Flow (`createPublicOrderFromCart()`)
1. Validates cart has items
2. Fetches cart with items (joined to products for current prices)
3. Calculates totals (subtotal, tax, shipping, discount, total)
4. Creates order record in `mod_ecommod01_orders`
5. Creates order items in `mod_ecommod01_order_items`
6. Creates order timeline entry ("Order placed")
7. Updates product inventory (decrements `quantity`)
8. Deletes cart items + cart
9. Sends notification emails (async, non-blocking)
10. Returns order ID

### What Needs Fixing
1. Add `customer_name` column to DB
2. Fix country list (use `getCountryList()`)
3. Wire in mobile checkout components
4. Fix Radix Select portal branding issue
5. Add keyboard optimization attributes to form inputs
6. Add sticky footer for mobile
7. Make order summary collapsible on mobile
8. Ensure all form validation messages are clear and accessible
9. Add loading states during order processing
10. Handle payment failures gracefully

---

## 9. CART SYSTEM

### Cart Architecture
- **Storage**: Database-backed (`mod_ecommod01_carts` + `mod_ecommod01_cart_items`)
- **Client State**: `useStorefrontCart()` hook (Zustand store with event bus)
- **Session**: Uses `session_id` (generated client-side, stored in localStorage)
- **Events**: `cart-updated` CustomEvent dispatched on add/remove/update

### Cart Operations
| Operation | Function | Location |
|-----------|----------|----------|
| Add to cart | `addToPublicCart()` | `public-ecommerce-actions.ts` |
| Update quantity | `updateCartItemQuantity()` | `public-ecommerce-actions.ts` |
| Remove item | `removeFromPublicCart()` | `public-ecommerce-actions.ts` |
| Get cart | `getPublicCart()` | `public-ecommerce-actions.ts` |
| Clear cart | `clearPublicCart()` | `public-ecommerce-actions.ts` |
| Apply coupon | `applyCouponToCart()` | `public-ecommerce-actions.ts` |

### Cart Display Components
| Component | Purpose | Badge? |
|-----------|---------|--------|
| `CartPageBlock` | Full cart page | N/A |
| `CartDrawerBlock` | Slide-out drawer | Yes (on trigger) |
| `MiniCartBlock` | Popover mini cart | Yes (on trigger) |
| `MobileCartButton` | Floating FAB | Yes |
| `EcommerceCartInjector` | Fixed-position icon | Yes (basic) |
| Navbar cart icon | Navigation item | **NO** ← Bug |

### What Needs Fixing
1. Add badge to navbar cart icon (see Bug 4 above)
2. Ensure cart persists across page navigation (session_id must be stable)
3. Cart items should show product images
4. "Continue Shopping" link from cart page
5. Empty cart state should be attractive, not just text

---

## 10. PRODUCT PAGES

### Product Detail Page (`/products/[slug]`)
- **Component**: `ProductDetailBlock.tsx`
- **Features**: Image gallery, variant selector, price display, add-to-cart, reviews, related products
- **Images**: Uses `next/image` with `fill` + `sizes` for responsive optimization
- **Gallery**: `ProductImageGallery.tsx` handles both `string[]` and `ProductImage[]` formats
- **SEO**: `generateMetadata()` creates product-specific OG tags

### Product Grid Page (`/shop`)
- **Component**: `product-grid-block.tsx` (delegates to `ProductCardBlock`)
- **Features**: Grid display, product cards with hover effects, add-to-cart, sale badges, wishlist
- **Navigation**: Clicking product card navigates to `/products/[slug]`
- **Responsive**: 2/3/4 columns on mobile/tablet/desktop

### Category Pages (`/categories/[slug]`)
- **Component**: `CategoryHeroBlock` + filtered `ProductGridBlock`
- **Features**: Category banner, breadcrumbs, filtered product grid

### What Needs Checking
1. Product detail page mobile responsiveness
2. Variant selector touch targets on mobile
3. Image gallery swipe gestures on mobile
4. Related products section responsive layout
5. Product not found / out of stock states
6. Product search functionality
7. Category navigation on mobile
8. Breadcrumb truncation on mobile

---

## 11. ORDER LIFECYCLE

### Status Flow
```
pending → processing → shipped → delivered
                    ↘ cancelled
pending → cancelled
any → refunded (partial or full)
```

### Payment Status Flow
```
pending → paid → refunded
pending → failed
```

### Fulfillment Status Flow
```
unfulfilled → partially_fulfilled → fulfilled
```

### Admin Order Management
- View all orders with filters (status, date, search)
- Update order status
- Add tracking information
- Process refunds
- Add internal notes
- View order timeline (audit trail)
- Print/download invoices

### Customer Order Tracking
- Order confirmation page after checkout
- Order confirmation email with details
- Status update emails (when admin changes status)
- No self-service portal currently (customer can't log in to view orders)

### What Needs Fixing
1. Order status transition validation (prevent invalid transitions)
2. Automatic fulfillment status updates based on shipping status
3. Refund handling with payment provider integration
4. Order editing capabilities (before fulfillment)
5. Customer order lookup (by email + order number, no login required)

---

## 12. PAYMENT INTEGRATION

### Supported Providers
| Provider | Type | Status | Markets |
|----------|------|--------|---------|
| Paddle | Card/PayPal | Integrated | Global |
| Flutterwave | Card/Mobile Money | Integrated | Africa |
| Pesapal | Card/Mobile Money/M-Pesa | Integrated | East Africa |
| DPO Group | Card/Mobile Money | Integrated | Africa |
| Manual/Bank Transfer | Offline | Integrated | Universal |

### Payment Flow
1. Customer selects payment method at checkout
2. For online payments: Redirect to provider's checkout or embed inline form
3. Provider processes payment
4. Webhook callback hits `/api/modules/ecommerce/webhooks/[provider]/route.ts`
5. Webhook updates order `payment_status` to `paid`
6. Order notification emails sent

### Manual Payment Flow
1. Customer selects "Bank Transfer" / "Manual Payment"
2. Order created with `payment_status: 'pending'`
3. Bank details shown on confirmation page
4. Admin manually marks as paid when payment received

### What Needs Fixing
1. Ensure all webhook handlers update order status correctly
2. Payment failure handling and retry logic
3. Refund processing through payment providers
4. Payment receipt emails
5. Currency handling (ZMW default, multi-currency support)

---

## 13. EMAIL NOTIFICATIONS

### Order Emails
| Event | Recipient | Template | Status |
|-------|-----------|----------|--------|
| Order placed | Customer | `order_confirmation_customer` | ✅ Implemented |
| Order placed | Store owner | `order_confirmation_owner` | ✅ Implemented |
| Status change | Customer | `order_status_update` | Partially implemented |
| Shipping update | Customer | `shipping_notification` | ✅ Implemented |
| Refund processed | Customer | `refund_notification` | Needs verification |

### Email Branding
- Customer emails use **site branding** (colors, logo, fonts)
- Admin emails use **agency branding**
- All emails go through `sendBrandedEmail()` which applies the brand template
- Logo from `site.settings.logo_url`
- Colors from `site.settings.primary_color`, `secondary_color`

### What Needs Fixing
1. Verify all email templates render correctly with site branding
2. Ensure `customer_name` is available for email greeting (depends on Bug 1 fix)
3. Test email delivery for all event types
4. Add "View Order" link in emails (needs a public order lookup page)
5. Ensure emails include the correct currency symbol (ZMW/K)

---

## 14. ANALYTICS

### Current State: BROKEN
The analytics system references wrong column names (`total_cents` instead of `total`, etc.). ALL analytics queries return zeros or nulls.

### Analytics Features (when working)
- Revenue over time (daily/weekly/monthly)
- Order count and average order value
- Top selling products
- Customer acquisition and retention
- Conversion funnel (visits → cart → checkout → order)
- Revenue by payment method
- Revenue by category
- Customer segmentation (new vs returning)

### What Needs Fixing
1. Fix ALL column name references (`_cents` → correct names)
2. Remove any `/ 100` arithmetic that assumes cents-based storage
3. Verify all analytics queries against actual DB schema
4. Add proper error handling for empty data sets
5. Ensure date range filters work correctly
6. Test with real order data

---

## 15. STOREFRONT WIDGET

### What It Is
`StorefrontWidget.tsx` is an embeddable React component that agencies can place on external websites. It provides a mini-store experience with product browsing, cart, and checkout.

### Current Issues
1. Uses `primaryColor` prop that previously had hardcoded `#2563eb` — now fixed to empty string with CSS var fallback
2. Widget CSS may conflict with host page styles (needs scoping)
3. Cart badge shows count correctly within the widget
4. Product navigation within the widget vs on the full site page

### Configuration
```typescript
interface StorefrontConfig {
  siteId: string
  primaryColor: string     // Now defaults to ''
  layout: 'grid' | 'list' | 'carousel'
  productsPerPage: number
  showSearch: boolean
  showCategories: boolean
  showCart: boolean
  currency: string
}
```

---

## 16. QUOTATION SYSTEM

### Flow
```
Agency creates quote → Sends to customer (email with PDF)
  → Customer views quote (tracks "viewed" status)
    → Customer accepts quote
      → Quote converts to order (auto-creates order from quote items)
```

### Components
- `quote-template-dialog.tsx` — Create/edit quote templates
- `quote-settings.tsx` — Default quote settings (validity, payment terms, notes)
- `EcommerceQuoteRequest.tsx` — Public-facing quote request form

### PDF Generation
- `quote-pdf-generator.ts` — Generates branded PDF quotes
- Includes: Company logo, customer details, line items, totals, terms, status badge
- Status badges use semantic colors (sky for sent, green for converted, etc.)

### What Needs Fixing
1. Quote PDF should use site branding (logo, colors)
2. Public quote viewing page (link in email)
3. Quote acceptance flow (confirm button → payment or order creation)
4. Quote expiry handling

---

## 17. PDF GENERATION

### Files
- `src/modules/ecommerce/lib/quote-pdf-generator.ts` — Quote/invoice PDFs
- `src/lib/payout-statement-generator.ts` — Payout statement PDFs

### Branding in PDFs
PDFs cannot use CSS variables (they're generated server-side as HTML→PDF). They receive brand colors as parameters. The fallback color is `#0f172a` (neutral slate-900).

### What Needs Fixing
1. Ensure PDF generator receives correct site branding (primary color, logo URL)
2. Verify PDF rendering on different paper sizes
3. Test PDF download/attachment in emails

---

## 18. NAVIGATION INTEGRATION

### How E-Commerce Adds Nav Items
`smart-navigation.ts` detects the e-commerce module and injects:
- **Main Nav**: "Shop" → `/shop`
- **Utility**: Cart icon → `/cart` (NO badge currently)
- **Footer**: "Shop All" → `/shop`, "My Cart" → `/cart`

### Merge Strategy
- Main nav items insert before "Contact" if it exists
- Utility items append to the right side of navbar
- Footer items inject into "Quick Links" column

### What Needs Fixing
1. Cart icon needs live item count badge
2. Consider adding "Categories" dropdown in main nav
3. Product search icon in utility area
4. Active state highlighting for current page

---

## 19. SEO AND STRUCTURED DATA

### Implemented
- `generateMetadata()` for product pages (title, description, OG tags)
- `EcommerceSeoInjector` for JSON-LD (Product, ItemList, Organization, WebSite schemas)
- Dynamic `sitemap.xml` and `robots.txt` per site
- Product-specific OG images from product gallery

### What Needs Fixing
1. Verify all product pages have correct OG tags
2. Category pages need SEO metadata
3. Breadcrumb structured data
4. Review aggregate structured data
5. Price structured data with correct currency

---

## 20. PUBLISHED SITE RENDERING

### Rendering Pipeline
```
URL Request
  → Middleware proxy (resolves subdomain/custom domain)
    → Server Component data fetch (site + pages + modules)
      → Client Renderer (wraps in StorefrontProvider if ecommerce active)
        → StudioRenderer (CSS vars, brand injection, component tree)
          → Individual components render with injected brand props
```

### Module Loading
- Module components are dynamically imported with a 3-second timeout
- Each module component is wrapped in a containment section:
  ```html
  <section class="w-full py-12 md:py-16">
    <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- component renders here -->
    </div>
  </section>
  ```

### ISR (Incremental Static Regeneration)
- `revalidate = 60` — pages re-generated every 60 seconds
- Static for performance, revalidated for freshness
- Dynamic routes (`/products/[slug]`, `/categories/[slug]`) use on-demand ISR

### What Needs Fixing
1. Ensure StorefrontProvider wraps all ecommerce pages correctly
2. Module loading timeout handling (what shows if loading fails?)
3. Error boundaries for individual component failures
4. Image optimization for all product images

---

## 21. ADMIN DASHBOARD

The admin dashboard at `/dashboard/sites/[siteId]/ecommerce` provides:

### Views
| View | Features |
|------|----------|
| **Overview** | Sales stats, recent orders, top products |
| **Products** | CRUD, bulk actions, import/export, variant management |
| **Categories** | Hierarchical category management |
| **Orders** | Order list with filters, detail view, status management |
| **Customers** | Customer list, order history, addresses |
| **Analytics** | Revenue charts, conversion funnel, product performance |
| **Settings** | Store settings, payment providers, shipping, tax |
| **Quotes** | Quote management, templates, settings |
| **Marketing** | Flash sales, bundles, gift cards, loyalty program |
| **Inventory** | Multi-location stock management |
| **Reviews** | Review moderation |
| **Integrations** | Third-party integrations |

### What Needs Fixing (Admin)
1. Analytics dashboard (Bug 2 — wrong column names)
2. Order detail page — should show full order info
3. Product import/export functionality
4. Bulk order status updates
5. Customer communication from admin

---

## 22. TESTING CHECKLIST

### Before Shipping — Verify Each Item

#### Critical Path (Order Flow)
- [ ] Product creation in admin → appears on /shop page
- [ ] Product detail page loads with images, price, description
- [ ] "Add to Cart" works → cart count updates → item appears in cart
- [ ] Cart page shows all items with correct prices and images
- [ ] Quantity update works in cart
- [ ] Remove item from cart works
- [ ] Coupon/discount code application works
- [ ] Proceed to checkout from cart
- [ ] Checkout address form — all fields work, country dropdown has Zambia
- [ ] Shipping method selection
- [ ] Payment method selection (test each provider)
- [ ] Order review step shows correct totals
- [ ] "Place Order" succeeds → order created in DB
- [ ] Redirect to order confirmation page
- [ ] Order confirmation page shows correct details
- [ ] Customer receives confirmation email with site branding
- [ ] Admin receives notification email
- [ ] Order appears in admin dashboard
- [ ] Admin can update order status
- [ ] Customer receives status update email

#### Mobile Testing
- [ ] All above steps work on mobile (375px width)
- [ ] Touch targets are ≥44px on all interactive elements
- [ ] No iOS Safari auto-zoom on form inputs
- [ ] Cart FAB shows with badge on mobile
- [ ] Checkout form is scrollable and doesn't overflow
- [ ] Payment forms work on mobile
- [ ] Images load correctly on mobile (responsive sizes)

#### Branding
- [ ] Published site uses site's brand colors (not DRAMAC blue)
- [ ] Buttons use brand primary color
- [ ] Links use brand primary color
- [ ] Checkout dropdown matches brand styling
- [ ] Emails use site branding (logo, colors)
- [ ] PDF invoices use site branding
- [ ] Cart drawer/popover matches brand styling
- [ ] Product cards use brand colors for "Add to Cart" buttons

#### Analytics
- [ ] Revenue chart shows correct values
- [ ] Order count is accurate
- [ ] Top products list is correct
- [ ] Date range filter works
- [ ] No errors/zeros due to wrong column names

#### Edge Cases
- [ ] Out-of-stock product handling
- [ ] Zero-quantity cart item attempt
- [ ] Invalid coupon code
- [ ] Payment failure → error message → retry option
- [ ] Empty cart → checkout → redirect to cart with message
- [ ] Product with no images → placeholder shown
- [ ] Very long product names don't break layout
- [ ] Special characters in customer names
- [ ] Multiple currencies (if supported)
- [ ] Very large order (10+ items)

---

## END OF DOCUMENT

This document contains every detail needed to make the DRAMAC CMS E-Commerce module production-ready. The AI implementing these fixes should:

1. Start with the CRITICAL bugs (customer_name column, analytics column names)
2. Fix the country dropdown
3. Wire in mobile checkout components OR make desktop checkout responsive
4. Add cart badge to navbar
5. Fix all branding issues
6. Test the complete order flow end-to-end
7. Verify all emails send with correct branding
8. Verify analytics show correct data

**The Supabase project ID is `nfirsqmyxmmtbignofgb`** — use MCP tools to run migrations and verify data.

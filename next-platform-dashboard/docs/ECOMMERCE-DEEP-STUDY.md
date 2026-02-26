# E-Commerce Module — Comprehensive Deep Study

> **Generated:** 2026-02-18  
> **Module ID:** `ecommod01` | **Table Prefix:** `mod_ecommod01_`  
> **Location:** `src/modules/ecommerce/`  
> **Database:** Supabase Project `nfirsqmyxmmtbignofgb`

---

## Table of Contents

1. [Complete File Inventory](#1-complete-file-inventory)
2. [Database Schema (All 50 Tables)](#2-database-schema-all-50-tables)
3. [Complete Order Lifecycle](#3-complete-order-lifecycle)
4. [Checkout Flow In Detail](#4-checkout-flow-in-detail)
5. [Storefront Widget Architecture](#5-storefront-widget-architecture)
6. [Payment Provider Integration](#6-payment-provider-integration)
7. [Studio Component Registry](#7-studio-component-registry)
8. [Dashboard Architecture](#8-dashboard-architecture)
9. [All Page Routes](#9-all-page-routes)
10. [ALL BUGS & ISSUES](#10-all-bugs--issues)
11. [Missing Features & Incomplete Implementations](#11-missing-features--incomplete-implementations)
12. [Hardcoded Colors & Branding Issues](#12-hardcoded-colors--branding-issues)
13. [Mobile Responsiveness Analysis](#13-mobile-responsiveness-analysis)
14. [Security Audit](#14-security-audit)
15. [Performance Concerns](#15-performance-concerns)

---

## 1. Complete File Inventory

### Root Files (4 files)
| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | 231 | Module barrel exports — types, actions, context, hooks, manifest |
| `manifest.ts` | 573 | Module manifest — schema, 14 features, permissions, compatibility |
| `EcommerceDashboardEnhanced.tsx` | ~300 | Enhanced dashboard shell with sidebar nav |
| `ecommerce-seo-injector.tsx` | ~150 | SEO meta tag injection for product/category pages |

### Types (8 files)
| File | Lines | Purpose |
|------|-------|---------|
| `types/ecommerce-types.ts` | 2,220 | Master type definitions for ALL entities |
| `types/analytics-types.ts` | ~300 | Analytics-specific types (SalesOverview, charts, etc.) |
| `types/integration-types.ts` | ~200 | Third-party integration types |
| `types/inventory-types.ts` | ~250 | Inventory management types |
| `types/marketing-types.ts` | ~350 | Flash sales, bundles, gift cards, loyalty types |
| `types/onboarding-types.ts` | ~100 | Onboarding wizard types |
| `types/setup-types.ts` | ~100 | Initial setup types |
| `types/store-template-types.ts` | ~150 | Store template types |

### Server Actions (18 files, ~14,000+ lines total)
| File | Lines | Purpose |
|------|-------|---------|
| `actions/ecommerce-actions.ts` | 1,961 | **Main CRUD** — products, categories, variants, options, cart, orders, discounts, settings, inventory, analytics |
| `actions/public-ecommerce-actions.ts` | 821 | **Public storefront** — uses admin client to bypass RLS for anonymous visitors |
| `actions/order-actions.ts` | 757 | Order detail, status, notes, shipments, refunds, bulk actions, email |
| `actions/quote-actions.ts` | 1,375 | Quote CRUD, items, calculations, numbering |
| `actions/quote-workflow-actions.ts` | ~800 | Quote send, accept, reject, convert-to-order, reminders |
| `actions/quote-template-actions.ts` | ~400 | Quote template management |
| `actions/customer-actions.ts` | 897 | Customer CRUD, groups, addresses, notes, import/export, bulk |
| `actions/analytics-actions.ts` | 1,206 | Sales analytics, product performance, customer insights, funnels |
| `actions/inventory-actions.ts` | 1,098 | Stock management, alerts, bulk adjustments, locations, reports |
| `actions/marketing-actions.ts` | 1,299 | Flash sales, bundles, gift cards, loyalty program |
| `actions/settings-actions.ts` | 471 | Settings center — general, currency, tax, shipping, payment, etc. |
| `actions/dashboard-actions.ts` | ~300 | Dashboard stats, recent orders, activity feed |
| `actions/integration-actions.ts` | ~400 | Third-party integration management |
| `actions/onboarding-actions.ts` | ~250 | Setup wizard actions |
| `actions/product-import-export.ts` | ~500 | CSV import/export, bulk product actions |
| `actions/review-actions.ts` | ~350 | Product reviews CRUD, moderation |
| `actions/store-template-actions.ts` | ~300 | Pre-built store template application |
| `actions/auto-setup-actions.ts` | ~200 | Automatic module initialization |

### Hooks (17 files)
| File | Lines | Purpose |
|------|-------|---------|
| `hooks/useCheckout.ts` | 557 | Multi-step checkout process (information→shipping→payment→review) |
| `hooks/useStorefrontCart.ts` | 354 | Cart state management with session-based guest carts |
| `hooks/useProductFilters.ts` | ~200 | Product filtering/sorting state |
| `hooks/useQuotations.ts` | ~250 | Quotation management hooks |
| `hooks/useRecentlyViewed.ts` | ~100 | Recently viewed products (localStorage) |
| `hooks/useStorefrontCategories.ts` | ~150 | Category tree building |
| `hooks/useStorefrontProduct.ts` | ~200 | Single product detail with variants/options |
| `hooks/useStorefrontProducts.ts` | ~200 | Product listing with pagination |
| `hooks/useStorefrontReviews.ts` | ~200 | Product reviews with sorting/pagination |
| `hooks/useStorefrontSearch.ts` | ~150 | Product search with recent searches |
| `hooks/useStorefrontWishlist.ts` | ~150 | Wishlist (localStorage-based) |
| `hooks/useMobile.ts` | ~50 | Mobile detection hook |
| `hooks/useHapticFeedback.ts` | ~50 | Haptic feedback for mobile |
| `hooks/useKeyboardVisible.ts` | ~50 | Mobile keyboard visibility detection |
| `hooks/useSwipeGesture.ts` | ~100 | Swipe gesture handling |
| `hooks/useModuleStatus.ts` | ~100 | Module installation status |
| `hooks/use-analytics.ts` | ~200 | Analytics data fetching |
| `hooks/use-integrations.ts` | ~150 | Integration management hooks |
| `hooks/use-marketing.ts` | ~200 | Marketing features hooks |
| `hooks/installation-hook.ts` | ~100 | Module installation hook |

### Context Providers (2 files)
| File | Lines | Purpose |
|------|-------|---------|
| `context/ecommerce-context.tsx` | ~800 | **Dashboard context** — wraps all dashboard views with data fetching |
| `context/storefront-context.tsx` | 115 | **Storefront context** — site settings, currency, quotation mode |

### Widget (1 file)
| File | Lines | Purpose |
|------|-------|---------|
| `widgets/StorefrontWidget.tsx` | 1,514 | **Self-contained embeddable storefront** with own cart context, CSS |

### Lib Utilities (12 files)
| File | Lines | Purpose |
|------|-------|---------|
| `lib/shipping-calculator.ts` | 195 | Zone-based shipping cost calculation |
| `lib/page-templates.ts` | 530 | Auto-generated page templates (shop, product detail, cart, checkout) |
| `lib/structured-data.ts` | 359 | Schema.org JSON-LD for Google Rich Results |
| `lib/analytics-utils.ts` | ~400 | Chart formatting, data processing for analytics views |
| `lib/api-key-utils.ts` | ~100 | API key generation/validation |
| `lib/cart-recovery-automation.ts` | ~200 | Abandoned cart email recovery |
| `lib/quote-analytics.ts` | ~200 | Quote conversion analytics |
| `lib/quote-automation.ts` | ~200 | Quote reminder automation |
| `lib/quote-pdf-generator.ts` | ~300 | PDF generation for quotes |
| `lib/quote-utils.ts` | ~150 | Quote number formatting, totals calculation |
| `lib/settings-utils.ts` | ~100 | Settings helper functions |
| `lib/store-templates.ts` | ~300 | Pre-built store template definitions |
| `lib/template-utils.ts` | ~100 | Template helper functions |
| `lib/webhook-utils.ts` | ~150 | Webhook delivery helpers |

### Studio Components (30+ files)
| File | Lines | Purpose |
|------|-------|---------|
| `studio/index.ts` | 290 | **Registry** — registers 25 studio blocks + 2 custom fields |
| `studio/components/CheckoutPageBlock.tsx` | 575 | Multi-step checkout page |
| `studio/components/product-card-block.tsx` | 680 | Product card with cart/wishlist/quotation |
| `studio/components/product-grid-block.tsx` | 315 | Responsive product grid |
| `studio/components/ProductGridBlock.tsx` | ~500 | **Enhanced** product catalog with filters |
| `studio/components/CartDrawerBlock.tsx` | 200 | Slide-out cart drawer |
| `studio/components/CartPageBlock.tsx` | ~400 | Full cart page |
| `studio/components/MiniCartBlock.tsx` | ~200 | Compact cart indicator |
| `studio/components/ProductDetailBlock.tsx` | ~600 | Product detail page |
| `studio/components/ProductQuickView.tsx` | ~300 | Quick view modal |
| `studio/components/FeaturedProductsBlock.tsx` | ~300 | Featured products section |
| `studio/components/OrderConfirmationBlock.tsx` | ~250 | Post-checkout confirmation |
| `studio/components/CategoryNavBlock.tsx` | ~200 | Category navigation |
| `studio/components/SearchBarBlock.tsx` | ~200 | Search bar component |
| `studio/components/FilterSidebarBlock.tsx` | ~300 | Product filter sidebar |
| `studio/components/BreadcrumbBlock.tsx` | ~150 | Breadcrumb navigation |
| `studio/components/ProductSortBlock.tsx` | ~150 | Sort dropdown |
| `studio/components/QuoteRequestBlock.tsx` | ~400 | Quote request form |
| `studio/components/QuoteListBlock.tsx` | ~300 | Customer's quote list |
| `studio/components/QuoteDetailBlock.tsx` | ~400 | Quote detail view |
| `studio/components/ReviewFormBlock.tsx` | ~250 | Review submission form |
| `studio/components/ReviewListBlock.tsx` | ~300 | Product review list |
| `studio/components/CategoryHeroBlock.tsx` | ~200 | Category hero banner |
| `studio/components/ProductImageGallery.tsx` | ~300 | Image gallery with zoom |
| `studio/fields/product-selector-field.tsx` | ~200 | Custom studio field for product selection |
| `studio/fields/category-selector-field.tsx` | ~200 | Custom studio field for category selection |

### Mobile Components (23 files in `studio/components/mobile/`)
| File | Purpose |
|------|---------|
| `MobileProductCard.tsx` | Touch-optimized product card |
| `MobileProductDetail.tsx` | Mobile product detail |
| `MobileQuickView.tsx` | Touch quick view |
| `MobileCartDrawer.tsx` | Mobile cart drawer |
| `MobileCheckout.tsx` | Mobile checkout flow |
| `MobileFilterDrawer.tsx` | Bottom sheet filters |
| `MobileCategoryNav.tsx` | Swipeable category nav |
| `MobileSearchBar.tsx` | Mobile search with suggestions |
| `MobileVariantSelector.tsx` | Touch variant picker |
| `MobileImageGallery.tsx` | Swipeable image gallery |
| `MobileBottomNav.tsx` | Bottom navigation bar |
| `MobileMiniCart.tsx` | Floating cart button |
| `MobileAddressForm.tsx` | Mobile address entry |
| `MobilePaymentSelector.tsx` | Payment method picker |
| `MobileOrderStatus.tsx` | Order tracking |
| `MobileWishlist.tsx` | Wishlist view |
| `MobileReviewForm.tsx` | Mobile review submission |
| `MobileShareButton.tsx` | Share product |
| `MobileSizeGuide.tsx` | Size guide popup |
| `MobileStockAlert.tsx` | Stock notification |
| `MobileCompare.tsx` | Product comparison |
| `MobileNotifications.tsx` | Push notifications |
| `index.ts` | Mobile components barrel export |

### Dashboard Components (80+ files across subdirectories)

**Views** (`components/views/` — 23 files):
`analytics-view.tsx`, `api-keys-view.tsx`, `bundles-view.tsx`, `categories-view.tsx`, `customers-view.tsx`, `developer-settings-view.tsx`, `discounts-view.tsx`, `embed-code-view.tsx`, `flash-sales-view.tsx`, `gift-cards-view.tsx`, `home-view.tsx`, `integrations-view.tsx`, `inventory-view.tsx`, `loyalty-view.tsx`, `marketing-view.tsx`, `orders-view.tsx`, `products-view.tsx`, `quotes-view.tsx`, `reviews-view.tsx`, `settings-view.tsx`, `templates-view.tsx`, `webhooks-view.tsx`, `index.ts`

**Dialogs** (`components/dialogs/` — 17 files):
`create-product-dialog.tsx`, `edit-product-dialog.tsx`, `view-product-dialog.tsx`, `import-products-dialog.tsx`, `create-category-dialog.tsx`, `edit-category-dialog.tsx`, `create-discount-dialog.tsx`, `edit-discount-dialog.tsx`, `ecommerce-settings-dialog.tsx`, `create-api-key-dialog.tsx`, `flash-sale-dialog.tsx`, `create-gift-card-dialog.tsx`, `adjust-points-dialog.tsx`, `bundle-dialog.tsx`, `loyalty-config-dialog.tsx`, `webhook-endpoint-dialog.tsx`, `index.ts`

**Analytics** (`components/analytics/` — 6 files):
`analytics-cards.tsx`, `analytics-charts.tsx`, `analytics-dashboard-view.tsx`, `analytics-tables.tsx`, `date-range-picker.tsx`, `index.ts`

**Other subdirectories**: `orders/`, `customers/`, `quotes/`, `settings/`, `inventory/`, `onboarding/`, `layout/`, `shared/`, `tables/`, `ui/`, `bulk/`, `portal/`, `widgets/`

### API Routes (8 routes)
| Route | Methods | Lines | Purpose |
|-------|---------|-------|---------|
| `api/modules/ecommerce/checkout/route.ts` | POST | 431 | Create order from cart, initiate payment |
| `api/modules/ecommerce/webhooks/payment/route.ts` | POST, GET | 591 | Payment webhooks for all 4 providers |
| `api/modules/ecommerce/cart/route.ts` | GET, POST | 245 | Cart CRUD API |
| `api/modules/ecommerce/orders/route.ts` | GET | 176 | Authenticated order listing |
| `api/modules/ecommerce/products/route.ts` | GET | 169 | Public product listing |
| `api/ecommerce/cart-recovery/route.ts` | GET | 90 | Cart recovery via email token |
| `api/studio/modules/ecommerce/products/route.ts` | GET | ~100 | Studio product picker data |
| `api/studio/modules/ecommerce/categories/route.ts` | GET | ~100 | Studio category picker data |

---

## 2. Database Schema (All 50 Tables)

### Core Commerce Tables

#### `mod_ecommod01_products` — Product catalog
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | PK, gen_random_uuid() |
| site_id | uuid | NO | FK to sites |
| agency_id | uuid | NO | FK to agencies |
| name | text | NO | |
| slug | text | NO | |
| description | text | YES | |
| short_description | text | YES | |
| base_price | numeric | YES | Stored in **cents** |
| compare_at_price | numeric | YES | Strike-through price |
| cost_price | numeric | YES | Cost for profit calc |
| tax_class | text | YES | 'standard' |
| is_taxable | boolean | YES | true |
| sku | text | YES | |
| barcode | text | YES | |
| track_inventory | boolean | YES | true |
| quantity | integer | YES | 0 |
| low_stock_threshold | integer | YES | 5 |
| weight | numeric | YES | |
| weight_unit | text | YES | 'kg' |
| status | text | YES | 'draft', 'active', 'archived' |
| is_featured | boolean | YES | false |
| seo_title | text | YES | |
| seo_description | text | YES | |
| images | jsonb | YES | string[] of URLs |
| metadata | jsonb | YES | {} |
| tags | text[] | YES | |
| brand | text | YES | |
| created_by | uuid | YES | |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

#### `mod_ecommod01_orders` — Orders (32 columns)
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| site_id | uuid | NO | |
| agency_id | uuid | NO | |
| order_number | text | NO | |
| customer_id | uuid | YES | |
| customer_email | text | NO | |
| customer_phone | text | YES | |
| shipping_address | jsonb | NO | |
| billing_address | jsonb | NO | |
| subtotal | numeric | NO | |
| discount_amount | numeric | YES | 0 |
| discount_code | text | YES | |
| shipping_amount | numeric | YES | 0 |
| tax_amount | numeric | YES | 0 |
| total | numeric | NO | |
| currency | text | YES | 'USD' |
| status | text | YES | 'pending' |
| payment_status | text | YES | 'pending' |
| payment_method | text | YES | |
| payment_provider | text | YES | |
| payment_transaction_id | text | YES | |
| fulfillment_status | text | YES | 'unfulfilled' |
| shipping_method | text | YES | |
| tracking_number | text | YES | |
| tracking_url | text | YES | |
| shipped_at | timestamptz | YES | |
| delivered_at | timestamptz | YES | |
| customer_notes | text | YES | |
| internal_notes | text | YES | |
| metadata | jsonb | YES | {} |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

> ⚠️ **NOTE:** No `customer_name` column exists. See [Bug #1](#bug-1-customer_name-column-missing).

#### `mod_ecommod01_order_items` — Order line items
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO |
| order_id | uuid | NO |
| product_id | uuid | YES |
| variant_id | uuid | YES |
| product_name | text | NO |
| product_sku | text | YES |
| variant_options | jsonb | YES |
| image_url | text | YES |
| quantity | integer | NO |
| unit_price | numeric | NO |
| total_price | numeric | NO |
| fulfilled_quantity | integer | YES |
| created_at | timestamptz | YES |

> ⚠️ **NOTE:** Columns are `unit_price` and `total_price`, NOT `unit_price_cents` and `total_cents`. See [Bug #2](#bug-2-analytics-queries-use-wrong-column-names).

#### `mod_ecommod01_carts` — Shopping carts
Columns: `id`, `site_id`, `user_id`, `session_id`, `status` (active/abandoned/converted), `discount_code`, `discount_amount`, `recovery_token`, `recovery_email_sent`, `created_at`, `updated_at`

#### `mod_ecommod01_cart_items` — Cart line items
Columns: `id`, `cart_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `created_at`

### Supporting Order Tables
- `mod_ecommod01_order_timeline` — Status change events, notes, emails
- `mod_ecommod01_order_notes` — Staff/customer notes per order
- `mod_ecommod01_order_shipments` — Shipment tracking records
- `mod_ecommod01_order_refunds` — Refund requests and processing

### Product Structure Tables
- `mod_ecommod01_product_variants` — Variant combinations (color+size)
- `mod_ecommod01_product_options` — Option definitions (Color: [Red, Blue])
- `mod_ecommod01_product_categories` — Many-to-many product ↔ category
- `mod_ecommod01_categories` — Category hierarchy with parent_id

### Customer Tables
- `mod_ecommod01_customers` — Customer profiles with stats
- `mod_ecommod01_customer_addresses` — Multiple addresses per customer
- `mod_ecommod01_customer_groups` — Customer segmentation groups
- `mod_ecommod01_customer_group_members` — Many-to-many customer ↔ group
- `mod_ecommod01_customer_notes` — Staff notes on customers

### Quotation Tables
- `mod_ecommod01_quotes` — Full quote documents
- `mod_ecommod01_quote_items` — Quote line items
- `mod_ecommod01_quote_activities` — Quote audit log
- `mod_ecommod01_quote_templates` — Reusable quote templates
- `mod_ecommod01_quote_settings` — Per-site quote configuration

### Marketing Tables
- `mod_ecommod01_flash_sales` — Time-limited sales
- `mod_ecommod01_flash_sale_products` — Products in flash sales
- `mod_ecommod01_bundles` — Product bundles
- `mod_ecommod01_bundle_items` — Bundle line items
- `mod_ecommod01_gift_cards` — Gift card codes and balances
- `mod_ecommod01_gift_card_transactions` — Gift card usage history
- `mod_ecommod01_loyalty_config` — Loyalty program settings
- `mod_ecommod01_loyalty_points` — Customer point balances
- `mod_ecommod01_loyalty_transactions` — Points earn/redeem history

### Inventory Tables
- `mod_ecommod01_inventory_locations` — Warehouse/location definitions
- `mod_ecommod01_inventory_movements` — Stock adjustment audit trail
- `mod_ecommod01_location_stock` — Stock per location
- `mod_ecommod01_stock_alerts` — Low stock alert configurations

### Review Tables
- `mod_ecommod01_reviews` — Product reviews with ratings

### Discount Tables
- `mod_ecommod01_discounts` — Discount codes with rules

### Integration Tables
- `mod_ecommod01_integrations` — Third-party integrations
- `mod_ecommod01_integration_logs` — Integration event logs
- `mod_ecommod01_sync_jobs` — Data sync job tracking

### Webhook Tables
- `mod_ecommod01_webhook_endpoints` — Registered webhook URLs
- `mod_ecommod01_webhook_event_types` — Event type subscriptions
- `mod_ecommod01_webhook_deliveries` — Delivery attempt logs

### Analytics & Reporting Tables
- `mod_ecommod01_analytics_snapshots` — Periodic stats snapshots
- `mod_ecommod01_saved_reports` — User-saved report configurations
- `mod_ecommod01_report_history` — Generated report records

### Configuration Tables
- `mod_ecommod01_settings` — Site-specific ecommerce settings (single row per site)
- `mod_ecommod01_api_keys` — API keys for headless access

---

## 3. Complete Order Lifecycle

```
                   ┌──────────────────────────────────────────┐
                   │           CART PHASE                      │
                   │                                           │
                   │  1. Guest/User browses products            │
                   │  2. Adds items to cart (session/user ID)   │
                   │  3. Cart stored in mod_ecommod01_carts     │
                   │  4. Discount code applied (optional)       │
                   │  5. Navigates to checkout                  │
                   └───────────────┬──────────────────────────┘
                                   │
                   ┌───────────────▼──────────────────────────┐
                   │         CHECKOUT PHASE                     │
                   │                                           │
                   │  Step 1: Information                       │
                   │    - Email, phone                          │
                   │    - Shipping address                      │
                   │    - Billing address (same or different)   │
                   │                                           │
                   │  Step 2: Shipping                          │
                   │    - Select shipping method from zones     │
                   │    - Free shipping threshold check         │
                   │                                           │
                   │  Step 3: Payment                           │
                   │    - Select payment provider               │
                   │    - Dynamic from store settings            │
                   │                                           │
                   │  Step 4: Review                            │
                   │    - Review all details                    │
                   │    - Add order notes                       │
                   │    - Place Order → POST /api/.../checkout  │
                   └───────────────┬──────────────────────────┘
                                   │
                   ┌───────────────▼──────────────────────────┐
                   │      ORDER CREATION (API Route)            │
                   │                                           │
                   │  1. Validate cart exists and has items     │
                   │  2. Verify product availability & stock    │
                   │  3. Calculate totals (subtotal, tax, ship) │
                   │  4. Create order (status: 'pending')       │
                   │  5. Copy cart items → order_items           │
                   │  6. Mark cart as 'converted'               │
                   │  7. Initiate payment flow                  │
                   │  8. Send notification emails               │
                   └───────────────┬──────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼─────────┐ ┌──────▼──────┐ ┌───────────▼─────────┐
    │  CLIENT-SIDE PAY   │ │  REDIRECT   │ │   MANUAL PAYMENT     │
    │  (Paddle/Flutterw) │ │ (Pesapal/   │ │                     │
    │                     │ │  DPO)       │ │  Show instructions   │
    │  Opens JS overlay   │ │             │ │  Order stays pending │
    │  Success callback → │ │ User goes   │ │  Until manual confirm│
    │  updates order      │ │ to external │ │                     │
    └─────────┬───────────┘ │ page        │ └───────────┬─────────┘
              │             └──────┬──────┘             │
              │                    │                     │
              │     ┌──────────────▼──────────────┐     │
              │     │     PAYMENT WEBHOOK          │     │
              │     │                              │     │
              │     │  POST /api/.../webhooks/     │     │
              │     │  payment                     │     │
              │     │                              │     │
              │     │  Verifies signature/hash     │     │
              │     │  Updates payment_status      │     │
              │     │  → 'paid' = status 'confirmed'│    │
              │     │  → 'failed' = status 'cancelled'│  │
              │     └──────────────┬──────────────┘     │
              │                    │                     │
              └────────────────────┼─────────────────────┘
                                   │
                   ┌───────────────▼──────────────────────────┐
                   │       FULFILLMENT PHASE                    │
                   │                                           │
                   │  pending → confirmed → processing →        │
                   │  shipped → delivered                       │
                   │                                           │
                   │  OR: cancelled / refunded                  │
                   │                                           │
                   │  Each transition:                          │
                   │    - Timeline event logged                 │
                   │    - Email notification sent               │
                   │    - Status badge updated in dashboard     │
                   └──────────────────────────────────────────┘
```

### Order Statuses
| Status | Trigger | Payment Status |
|--------|---------|----------------|
| `pending` | Order created | `pending` |
| `confirmed` | Payment received (webhook) | `paid` |
| `processing` | Staff begins fulfillment | `paid` |
| `shipped` | Tracking number added | `paid` |
| `delivered` | Delivery confirmed | `paid` |
| `cancelled` | Payment failed or manual cancel | `failed` / `pending` |
| `refunded` | Refund processed | `refunded` / `partially_refunded` |

### Fulfillment Statuses
`unfulfilled` → `partially_fulfilled` → `fulfilled`

---

## 4. Checkout Flow In Detail

### Source: `hooks/useCheckout.ts` (557 lines)

**Steps:** `information` → `shipping` → `payment` → `review`

**Step 1 — Information:**
- Email (validated via regex)
- Phone (optional)
- Shipping address (7 required fields: first_name, last_name, address_line_1, city, state, postal_code, country)
- Billing address (same as shipping by default, or separate)

**Step 2 — Shipping:**
- Methods built dynamically from `settings.shipping_zones`
- Falls back to flat rate / free shipping if no zones
- Fallback: Standard Shipping ($10, 3-7 days)

**Step 3 — Payment:**
- Methods built dynamically from store settings
- Checks each provider's `enabled` flag
- Priority order: Paddle → Flutterwave → Pesapal → DPO → Manual
- Fallback: Manual payment only

**Step 4 — Review:**
- Displays all selections
- Order notes textarea
- Place Order button → `POST /api/modules/ecommerce/checkout`

**Payment Flow Branching (in CheckoutPageBlock.tsx):**
- **Pesapal/DPO:** `window.location.href = paymentUrl` (redirect)
- **Paddle:** Opens `Paddle.Checkout.open()` JS overlay
- **Flutterwave:** Opens `FlutterwaveCheckout()` inline modal
- **Manual:** Shows payment instructions text

**Cart Clearing Logic:**
- Manual/unknown providers: cart cleared immediately
- Redirect providers (Pesapal/DPO): cart cleared before redirect
- Client-side providers (Paddle/Flutterwave): cart cleared only in success callback

---

## 5. Storefront Widget Architecture

### Source: `widgets/StorefrontWidget.tsx` (1,514 lines)

The StorefrontWidget is a **self-contained, embeddable storefront** designed for external websites.

**Architecture:**
```
StorefrontWidget
├── CartProvider (internal, separate from studio's StorefrontProvider)
│   ├── CartContext — manages cart state, add/remove/update
│   └── calculateTotals() — local subtotal/tax/shipping calculation
├── Product Grid — fetches products with pagination, filters, search
├── Category Navigation — filterable category buttons
├── Cart Drawer — slide-out cart panel
└── Scoped CSS — all styles scoped with `.storefront-widget` prefix
```

**Configuration:**
```typescript
interface StorefrontConfig {
  showCart?: boolean           // Show cart button/drawer
  showCategories?: boolean     // Show category nav
  productsPerPage?: number     // 12 default
  theme?: 'light' | 'dark'    // Color scheme
  primaryColor?: string        // Brand color
  borderRadius?: number        // 8px default
  showSearch?: boolean         // Search bar
  showFilters?: boolean        // Filter sidebar
  layout?: 'grid' | 'list'    // Product layout
  columns?: 2 | 3 | 4         // Grid columns
}
```

**⚠️ Security Issue:** Uses `ecommerce-actions.ts` (RLS-bound `createClient()`) instead of `public-ecommerce-actions.ts` (admin client). This means the widget will fail for unauthenticated visitors on external sites because RLS policies will block the queries.

---

## 6. Payment Provider Integration

### Paddle (Global — Cards)
- **Client-side:** `Paddle.Checkout.open()` overlay
- **Webhook:** Signature verification via `crypto.createHmac('sha256')`
- **Config:** `paddle_config: { enabled, environment, seller_id, api_key, webhook_secret }`
- **Flow:** Client overlay → success callback → webhook confirms

### Flutterwave (Africa — Cards + Mobile Money)
- **Client-side:** `FlutterwaveCheckout()` inline modal
- **Webhook:** Hash verification via `crypto.createHash('sha256')` + API transaction verify on redirect
- **Config:** `flutterwave_config: { enabled, public_key, secret_key, encryption_key, webhook_hash }`
- **Flow:** Inline modal → callback + redirect URL → GET webhook verifies with Flutterwave API

### Pesapal (Africa — Cards + Mobile)
- **Server-side:** OAuth2 token → SubmitOrderRequest → redirect URL
- **Webhook:** IPN notification → TransactionStatus query
- **Config:** `pesapal_config: { enabled, consumer_key, consumer_secret, environment }`
- **Flow:** Server gets redirect URL → user redirected → IPN webhook confirms

### DPO Pay (Zambia — Local)
- **Server-side:** XML createToken → redirect to DPO payment page
- **Webhook:** XML verifyToken on callback
- **Config:** `dpo_config: { enabled, company_token, service_type, environment }`
- **Flow:** XML API creates token → redirect → callback verifies XML

### Manual Payment
- **Flow:** Order created as pending → instructions displayed → staff manually confirms
- **Config:** `manual_payment_enabled: boolean`, `manual_payment_instructions: string`

---

## 7. Studio Component Registry

All components registered in `studio/index.ts`:

| Block Name | Component | Category | Description |
|------------|-----------|----------|-------------|
| `EcommerceProductCard` | ProductCardBlock | Products | Product card with cart actions |
| `EcommerceProductGrid` | product-grid-block | Products | Simple responsive grid |
| `EcommerceProductCatalog` | ProductGridBlock | Products | Enhanced grid with filters |
| `EcommerceFeaturedProducts` | FeaturedProductsBlock | Products | Featured products section |
| `EcommerceCartPage` | CartPageBlock | Cart | Full cart page |
| `EcommerceCartDrawer` | CartDrawerBlock | Cart | Slide-out drawer |
| `EcommerceMiniCart` | MiniCartBlock | Cart | Cart indicator |
| `EcommerceCheckoutPage` | CheckoutPageBlock | Checkout | Multi-step checkout |
| `EcommerceOrderConfirmation` | OrderConfirmationBlock | Orders | Confirmation page |
| `EcommerceCategoryNav` | CategoryNavBlock | Navigation | Category buttons |
| `EcommerceSearchBar` | SearchBarBlock | Navigation | Search input |
| `EcommerceFilterSidebar` | FilterSidebarBlock | Navigation | Product filters |
| `EcommerceBreadcrumb` | BreadcrumbBlock | Navigation | Breadcrumbs |
| `EcommerceProductSort` | ProductSortBlock | Navigation | Sort dropdown |
| `EcommerceQuoteRequest` | QuoteRequestBlock | Quotes | Quote request form |
| `EcommerceQuoteList` | QuoteListBlock | Quotes | Quote listing |
| `EcommerceQuoteDetail` | QuoteDetailBlock | Quotes | Quote detail |
| `EcommerceReviewForm` | ReviewFormBlock | Reviews | Review submission |
| `EcommerceReviewList` | ReviewListBlock | Reviews | Review display |
| `ProductDetailBlock` | ProductDetailBlock | Products | Product detail page |
| `CategoryHeroBlock` | CategoryHeroBlock | Navigation | Category hero |

**Custom Studio Fields:**
- `product-selector` — dropdown/search to pick a product
- `category-selector` — dropdown/search to pick a category

---

## 8. Dashboard Architecture

### Entry Point
`app/(dashboard)/dashboard/sites/[siteId]/ecommerce/page.tsx` — Server component, auth guard, renders `EcommerceDashboard`

### Dashboard Shell
`components/ecommerce-dashboard.tsx` — Sidebar navigation with 16 views:

| View | Component | Description |
|------|-----------|-------------|
| home | HomeView | Stats cards, recent orders, low stock alerts |
| products | ProductsView | Product data table with bulk actions |
| orders | OrdersView | Order table with status/payment filters |
| customers | CustomersView | Customer management |
| categories | CategoriesView | Category tree management |
| discounts | DiscountsView | Discount code management |
| quotes | QuotesView | Quotation management |
| reviews | ReviewsView | Review moderation |
| templates | TemplatesView | Store templates |
| inventory | InventoryView | Stock management |
| analytics | AnalyticsView | Sales/product/customer analytics |
| marketing | MarketingView | Flash sales, bundles, gift cards, loyalty |
| developer | DeveloperSettingsView | API keys, webhooks |
| embed | EmbedCodeView | Widget embed code generator |
| settings | SettingsView | 10-tab settings center |

### Context Provider
`context/ecommerce-context.tsx` wraps the entire dashboard:
- Fetches and caches: products, categories, orders, customers, discounts, settings
- Provides: CRUD operations, refresh, loading states
- Sub-contexts: `useCurrency()` for price formatting

---

## 9. All Page Routes

### Dashboard Routes
| Route | Purpose |
|-------|---------|
| `/dashboard/sites/[siteId]/ecommerce` | E-commerce dashboard |

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/modules/ecommerce/checkout` | POST | Create order + initiate payment |
| `/api/modules/ecommerce/webhooks/payment` | POST, GET | Payment provider webhooks |
| `/api/modules/ecommerce/cart` | GET, POST | Cart CRUD |
| `/api/modules/ecommerce/orders` | GET | Order listing (authenticated) |
| `/api/modules/ecommerce/products` | GET | Public product listing |
| `/api/ecommerce/cart-recovery` | GET | Cart recovery from email link |
| `/api/studio/modules/ecommerce/products` | GET | Studio product picker |
| `/api/studio/modules/ecommerce/categories` | GET | Studio category picker |

### Published Site Routes (generated via page-templates.ts)
| Route | Purpose |
|-------|---------|
| `/shop` | Product catalog page |
| `/products/[slug]` | Product detail page |
| `/cart` | Shopping cart page |
| `/checkout` | Multi-step checkout |
| `/order-confirmation` | Post-purchase confirmation |

---

## 10. ALL BUGS & ISSUES

### 🔴 Bug #1: `customer_name` Column Missing from Orders Table {#bug-1-customer_name-column-missing}

**Severity: CRITICAL — Data Loss**

The `mod_ecommod01_orders` database table does **not** have a `customer_name` column, but the code extensively writes and reads it.

**Evidence:**
- DB query confirmed only 32 columns — no `customer_name`
- TypeScript `Order` interface (ecommerce-types.ts line 218) declares `customer_name: string`
- `createOrderFromCart()` in ecommerce-actions.ts inserts `customer_name: input.customer_name || null`
- `createPublicOrderFromCart()` in public-ecommerce-actions.ts inserts `customer_name: input.customer_name || null`
- PostgREST silently drops unknown columns — no error, data just lost

**Impact:**
- Customer names are NEVER saved with orders
- All email notifications fall back to "Customer" (e.g., "Dear Customer, your order...")
- `order-actions.ts` references `order.customer_name` in 5+ email calls — always undefined
- Quote-to-order conversion loses customer name

**Fix:** Add `customer_name text` column to `mod_ecommod01_orders` table:
```sql
ALTER TABLE mod_ecommod01_orders ADD COLUMN customer_name text;
```

---

### 🔴 Bug #2: Analytics Queries Use Wrong Column Names {#bug-2-analytics-queries-use-wrong-column-names}

**Severity: CRITICAL — Analytics Completely Broken**

`analytics-actions.ts` (1,206 lines) queries for columns that don't exist in the database:

| Code References | Actual DB Column |
|----------------|------------------|
| `total_cents` | `total` |
| `subtotal_cents` | `subtotal` |
| `tax_cents` | `tax_amount` |
| `shipping_cents` | `shipping_amount` |
| `discount_cents` | `discount_amount` |
| `unit_price_cents` (order_items) | `unit_price` |
| `total_cents` (order_items) | `total_price` |

**40+ occurrences** across the file including:
- Line 102: `.select('id, total_cents, subtotal_cents, tax_cents, shipping_cents, discount_cents, status, created_at')`
- Line 173: `.select('id, total_cents, created_at, status')`
- Line 272: `.select('total_cents, metadata, status')`
- Line 323: `.select('subtotal_cents, tax_cents, shipping_cents, discount_cents, total_cents, status')`
- Line 384: `.select('product_id, product_name, quantity, total_cents')`
- Line 550: `.select('product_id, quantity, total_cents, unit_price_cents')`

**Impact:**
- ALL analytics functions return zeros/nulls
- Sales overview shows $0 revenue
- Sales by period chart is empty
- Revenue breakdown is empty
- Product performance shows no data
- Customer insights show no spending data
- The entire analytics dashboard is non-functional

**Fix:** Replace all `_cents` references with actual column names across the file.

---

### 🟡 Bug #3: `window.location.href` for Navigation

**Severity: MEDIUM — Performance**

7 instances of `window.location.href` used for navigation instead of Next.js router:

| File | Line | Usage |
|------|------|-------|
| `product-grid-block.tsx` | 86 | Product card click |
| `product-card-block.tsx` | 216 | Product link click |
| `ProductDetailBlock.tsx` | 144 | Quote redirect |
| `ProductDetailBlock.tsx` | 152 | Clipboard (acceptable) |
| `ProductQuickView.tsx` | 188 | Share URL (acceptable) |
| `ProductQuickView.tsx` | 194 | Clipboard (acceptable) |
| `CheckoutPageBlock.tsx` | 310 | Payment redirect (necessary) |

**Impact:** Product navigation causes full page reload instead of client-side SPA navigation, losing React state and making the experience feel slow.

**Fix:** Replace with `useRouter().push()` for product-grid-block and product-card-block.

---

### 🟡 Bug #4: StorefrontWidget Uses RLS-Bound Client

**Severity: MEDIUM — Widget Broken for Anonymous Users**

`widgets/StorefrontWidget.tsx` imports from `ecommerce-actions.ts`:
```typescript
import { getProducts, getCategories, getEcommerceSettings } from '../actions/ecommerce-actions'
```

These use `createClient()` (RLS-bound). For an **embeddable widget** on external sites, anonymous visitors have no Supabase auth session → all queries return empty results or errors.

**Fix:** Import from `public-ecommerce-actions.ts` which uses `createAdminClient()`.

---

### 🟡 Bug #5: Cart `total_cents` in Analytics for Carts Table

**Severity: MEDIUM — Abandoned Cart Analytics Broken**

Line 999 of analytics-actions.ts:
```typescript
.select('id, status, total_cents, created_at')
```

The `mod_ecommod01_carts` table doesn't have a `total_cents` column. Cart totals are computed from cart items, not stored directly.

---

### 🟢 Bug #6: Order Currency Defaults to 'USD' Instead of Platform Default

**Severity: LOW**

The `mod_ecommod01_orders` table has `currency text DEFAULT 'USD'`, but the platform default is ZMW (Zambian Kwacha). The default should match `DEFAULT_CURRENCY` from `locale-config.ts`.

---

### 🟢 Bug #7: Discount Amount Display Division Mismatch

**Severity: LOW**

In `useStorefrontCart.ts` line ~340, the apply discount success message does:
```typescript
message: `Discount applied: -${formatCurrency(result.discountAmount / 100)}`
```

But `result.discountAmount` is already calculated from `subtotal * value / 100` where subtotal is in cents. Dividing by 100 again would show incorrect amounts if prices are already in cents.

---

### 🟢 Bug #8: Duplicate `getOrders` Function

**Severity: LOW — Confusion Risk**

Both `ecommerce-actions.ts` and `order-actions.ts` export a `getOrders()` function with different signatures:
- `ecommerce-actions.ts`: Returns `PaginatedResponse<Order>` with extended filters
- `order-actions.ts`: Returns `Order[]` with join on order_items

This could cause import confusion.

---

## 11. Missing Features & Incomplete Implementations

### Not Implemented (Schema exists, code incomplete)
1. **Location-based stock** — `mod_ecommod01_location_stock` table exists, but no UI for multi-location inventory
2. **Webhook delivery system** — Tables exist (`webhook_endpoints`, `webhook_deliveries`, `webhook_event_types`) but delivery mechanism not fully implemented
3. **Gift card redemption at checkout** — Gift cards can be created but checkout doesn't accept them as payment
4. **Loyalty points at checkout** — Points can be earned/redeemed in dashboard but not integrated into checkout flow
5. **Bundle pricing at checkout** — Bundles exist but bundle discounts aren't automatically applied
6. **Product comparison** — `MobileCompare.tsx` exists but no desktop comparison feature
7. **Push notifications** — `MobileNotifications.tsx` exists but no notification infrastructure
8. **Express checkout** — `CheckoutSettings.express_checkout` type defined but not implemented
9. **Address autocomplete** — `CheckoutSettings.address_autocomplete` defined but not implemented
10. **Cart recovery automation** — `lib/cart-recovery-automation.ts` exists but no cron/scheduler triggers it

### Partially Implemented
1. **Reviews moderation** — CRUD works, but no spam detection or automated moderation
2. **Customer import** — CSV import dialog exists but limited field mapping
3. **Report generation** — Report history table exists but no actual PDF/CSV generation pipeline
4. **Sync jobs** — Table exists but no actual third-party sync implementation
5. **API key authentication** — Keys can be created but API routes don't validate them

---

## 12. Hardcoded Colors & Branding Issues

### 14 Remaining Hardcoded `#3b82f6` (Blue) Instances

| File | Line | Context |
|------|------|---------|
| `studio/components/mobile/MobileQuickView.tsx` | 56 | Border/accent color |
| `studio/components/mobile/MobileVariantSelector.tsx` | 64 | Selected variant highlight |
| `lib/analytics-utils.ts` | 335 | Chart color palette |
| `components/ecommerce-metric-card.tsx` | 83 | Metric card accent |
| `components/ecommerce-metric-card.tsx` | 93 | Metric card accent |
| `lib/store-templates.ts` | 177 | Template primary color |
| `components/views/analytics-view.tsx` | 316 | Chart color |
| `components/views/analytics-view.tsx` | 317 | Chart color |
| `components/views/analytics-view.tsx` | 336 | Chart color |
| `components/analytics/analytics-charts.tsx` | 136 | Bar chart color |
| `components/analytics/analytics-charts.tsx` | 137 | Bar chart color |
| `components/analytics/analytics-charts.tsx` | 171 | Line chart color |
| `components/analytics/analytics-charts.tsx` | 586 | Pie chart color |

**Fix:** Replace with `var(--brand-primary)` or Tailwind `text-primary` / `bg-primary`.

---

## 13. Mobile Responsiveness Analysis

### Strengths
- **23 dedicated mobile components** in `studio/components/mobile/`
- **Touch gesture hooks** — `useSwipeGesture`, `useHapticFeedback`, `useKeyboardVisible`
- **Mobile detection** — `useMobile()` hook for conditional rendering
- **Responsive grid** — product-grid-block uses `<style jsx>` media queries
- **Checkout layout** — 1-column on mobile, 2-column on desktop (`grid-cols-1 lg:grid-cols-3`)

### Weaknesses (from code review)
1. **Mobile components not auto-loaded** — They exist but are separate imports, not automatically swapped based on viewport. The studio blocks use the desktop components; mobile versions must be manually selected by the site builder.
2. **Cart drawer** — Uses Radix Sheet which works on mobile but no swipe-to-dismiss gesture
3. **Image gallery** — Desktop `ProductImageGallery` doesn't support pinch-to-zoom; mobile `MobileImageGallery` does
4. **Checkout steps** — Step indicator is horizontal, may overflow on small screens
5. **Data tables** — Dashboard order/product tables are standard HTML tables without horizontal scroll wrapping

---

## 14. Security Audit

### ✅ Good Practices
- **RLS separation** — Dashboard uses `createClient()` (RLS), storefront uses `createAdminClient()` (service role)
- **Site scoping** — All queries filter by `site_id` to prevent cross-site data access
- **Payment webhook verification** — Each provider has signature/hash verification
- **Public action whitelisting** — `updatePublicOrder` only allows specific fields
- **SQL injection prevention** — Uses Supabase query builder, no raw SQL

### ⚠️ Concerns
1. **StorefrontWidget uses wrong client** — See Bug #4
2. **No rate limiting** on public cart/checkout API routes
3. **No CSRF protection** on checkout POST (relies on same-origin, but widget is cross-origin)
4. **Cart recovery token** — Simple UUID in URL, no expiry validation (just checks if cart exists)
5. **Discount code brute-force** — No rate limiting on discount code validation
6. **API key routes** — Keys can be created but not validated on any route
7. **Guest cart merge** — `mergeGuestCartToUser()` doesn't verify session ownership

---

## 15. Performance Concerns

1. **N+1 queries in product fetch** — `getProduct()` and `getPublicProduct()` make 3 separate queries (product + variants + options) instead of using joins
2. **Cart refresh on every action** — Each cart action (add/remove/update) triggers a full cart refetch including product/variant joins
3. **No caching** — Product listings, categories, settings are fetched fresh on every render with no SWR/React Query caching
4. **Analytics full table scans** — Analytics queries fetch all orders in date range then aggregate in JavaScript instead of using SQL aggregation
5. **Low stock check** — `getLowStockProducts()` fetches ALL active products then filters in JS (`product.quantity <= product.low_stock_threshold`) because PostgREST can't compare columns
6. **Full page reload** — `window.location.href` for product navigation (see Bug #3)
7. **StorefrontWidget** — Fetches all data on mount with no pagination optimization for the initial load

---

## Summary of Critical Issues to Fix

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| 🔴 P0 | Analytics column names wrong | Dashboard analytics 100% broken | Medium (find/replace) |
| 🔴 P0 | `customer_name` missing from DB | Customer names never saved | Low (1 ALTER TABLE) |
| 🟡 P1 | StorefrontWidget wrong client | Widget fails for anonymous users | Low (change imports) |
| 🟡 P1 | 14 hardcoded colors | Branding inconsistency | Low (CSS variable swap) |
| 🟡 P2 | `window.location.href` navigation | Full page reloads | Low (use router.push) |
| 🟢 P3 | N+1 queries | Performance | Medium (rewrite queries) |
| 🟢 P3 | No rate limiting | Security | Medium (add middleware) |
| 🟢 P3 | Discount display division | Wrong discount amount shown | Low (remove /100) |

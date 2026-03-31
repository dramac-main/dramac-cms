# DRAMAC CMS — E-Commerce Components Master Plan

## Executive Vision

Transform DRAMAC's **23 e-commerce studio components** from a fully functional but **brand-disconnected, hardcoded-color, dashboard-themed storefront** into a **site-branded, theme-aware, AI-Designer-integrated visual commerce system** that delivers Shopify-quality storefronts through DRAMAC's visual builder — with zero manual CSS from site owners.

E-commerce components are the **revenue engine of every DRAMAC site**. They display products (ProductGrid, ProductCard, FeaturedProducts), enable purchasing (CartPage, CartDrawer, MiniCart, CheckoutPage), build buyer confidence (ReviewList, ReviewForm), facilitate discovery (CategoryNav, SearchBar, FilterSidebar, Breadcrumb, ProductSort), handle post-purchase (OrderConfirmation, OrderTracking), and support B2B workflows (QuoteRequest, QuoteList, QuoteDetail). When a visitor browses a grid of branded product cards, adds items to a slide-out cart, glides through a multi-step checkout, and lands on a confirmation page that echoes the site's brand colours — that seamless, trust-building experience converts browsers into paying customers. This plan treats all 23 components as the unified commerce layer that makes every DRAMAC site sell.

**Current reality:** The 23 e-commerce studio components are **functionally complete** — cart works, checkout processes payments, orders flow through the lifecycle, quotations convert. The architecture is sound: module-based registration via `studioComponents`, dynamic loading via `module-loader.ts`, and AI conversion via `typeMap` aliases + `MODULE_TYPES` containment normalizer. However, every storefront component uses **hardcoded Tailwind colours** (`bg-gray-100`, `text-green-600`, `border-red-500`) because the `StorefrontContext` exposes **no brand colour information**. The `EcommerceSettings` type has a `primary_color` field, but it is not piped through to components. This creates a critical brand disconnect: every DRAMAC storefront looks identical regardless of the site's brand. This plan fixes the brand pipeline, documents the complete component architecture, and provides the implementation blueprint for full theme integration.

---

## Table of Contents

0. [Implementation Blueprint](#section-0--implementation-blueprint)
1. [Current State Audit](#1-current-state-audit)
2. [Architecture Overview](#2-architecture-overview)
3. [Component Pipeline — How E-Commerce Components Reach the Page](#3-component-pipeline)
4. [Product Display Components — Deep Dive](#4-product-display-components--deep-dive)
5. [Cart Components — Deep Dive](#5-cart-components--deep-dive)
6. [Checkout Components — Deep Dive](#6-checkout-components--deep-dive)
7. [Navigation & Discovery Components — Deep Dive](#7-navigation--discovery-components--deep-dive)
8. [Quotation Components — Deep Dive](#8-quotation-components--deep-dive)
9. [Review Components — Deep Dive](#9-review-components--deep-dive)
10. [Dynamic Page Components — Deep Dive](#10-dynamic-page-components--deep-dive)
11. [Brand Colour Pipeline — The Critical Gap](#11-brand-colour-pipeline--the-critical-gap)
12. [Dark Mode & Theming](#12-dark-mode--theming)
13. [AI Designer Integration](#13-ai-designer-integration)
14. [Mobile Components Architecture](#14-mobile-components-architecture)
15. [Data Hooks & Context System](#15-data-hooks--context-system)
16. [Registry, Metadata & Converter Alignment](#16-registry-metadata--converter-alignment)
17. [Hardcoded Colour Inventory](#17-hardcoded-colour-inventory)
18. [Implementation Phases](#18-implementation-phases)
19. [Testing & Quality Gates](#19-testing--quality-gates)
20. [CRITICAL FOR AI AGENT — Implementation Guard Rails](#20-critical-for-ai-agent--implementation-guard-rails)

---

## Section 0 — Implementation Blueprint

> **For the AI agent implementing this plan.** Read this section FIRST. It contains every file path, every line number, and every registration point you need. Do NOT guess — use these exact references.

### 0.1 File Map

| File | Path | Purpose |
|---|---|---|
| **studio/index.ts** | `src/modules/ecommerce/studio/index.ts` | Module studio registration — 23 component definitions, 2 custom fields, metadata |
| **module-loader.ts** | `src/lib/studio/registry/module-loader.ts` | Dynamic module loader — imports ecommerce studio, registers in componentRegistry |
| **component-metadata.ts** | `src/lib/studio/registry/component-metadata.ts` | AI discovery metadata — 6 legacy e-commerce entries (ProductGrid, ProductCard, ProductCategories, CartSummary, FeaturedProducts, CartIcon) |
| **converter.ts** | `src/lib/ai/website-designer/converter.ts` | typeMap aliases (L707–L758) + `KNOWN_REGISTRY_TYPES` (L885–L907) + `MODULE_TYPES` containment normalizer (L2476–L2508) |
| **renderer.tsx** | `src/lib/studio/engine/renderer.tsx` | Page renderer — dispatches to module components via componentRegistry |
| **craft-renderer.tsx** | `src/app/site/[domain]/[[...slug]]/craft-renderer.tsx` | Site renderer — wraps StorefrontProvider + StorefrontAuthProvider + StudioRenderer |
| **storefront-context.tsx** | `src/modules/ecommerce/context/storefront-context.tsx` | Storefront context — currency, formatPrice, quotation mode (**NO brand colours**) |
| **page-templates.ts** | `src/modules/ecommerce/lib/page-templates.ts` | Auto-generates shop, cart, checkout, product detail, categories pages |
| **ecommerce-types.ts** | `src/modules/ecommerce/types/ecommerce-types.ts` | Master type definitions — 2,220 lines |

### 0.2 Component Registry — All 23 Studio Components

E-commerce components are **NOT** in `renders.tsx`. They are module-based: defined in `studio/index.ts` and dynamically loaded by `module-loader.ts` into the component registry at runtime.

#### Product Display (4 components — ECOM-21)

| # | Type | Label | Definition Source | Render Component | Props Interface | Interface Line |
|---|---|---|---|---|---|---|
| 1 | `EcommerceProductCard` | Product Card | `productCardDefinition` (imported from `product-card-block.tsx`) | `ProductCardBlock` | `ProductCardProps` | L48 of `product-card-block.tsx` |
| 2 | `EcommerceProductGrid` | Product Grid | `productGridDefinition` (imported from `product-grid-block.tsx`) | `ProductGridBlock` | `ProductGridProps` | L38 of `product-grid-block.tsx` |
| 3 | `EcommerceProductCatalog` | Product Catalog | `enhancedProductGridDefinition` (imported from `ProductGridBlock.tsx`) | `EnhancedProductGridBlock` | `ProductGridProps` | L95 of `ProductGridBlock.tsx` |
| 4 | `EcommerceFeaturedProducts` | Featured Products | `featuredProductsDefinition` (imported from `FeaturedProductsBlock.tsx`) | `FeaturedProductsBlock` | `FeaturedProductsProps` | L51 of `FeaturedProductsBlock.tsx` |

#### Cart (3 components — ECOM-22)

| # | Type | Label | Definition Location | Render Component | Props Interface | Interface Line |
|---|---|---|---|---|---|---|
| 5 | `EcommerceCartPage` | Shopping Cart | `cartPageDefinition` (inline, L158 of `studio/index.ts`) | `CartPageBlock` | `CartPageBlockProps` | L23 of `CartPageBlock.tsx` |
| 6 | `EcommerceCartDrawer` | Cart Drawer | `cartDrawerDefinition` (inline, L190 of `studio/index.ts`) | `CartDrawerBlock` | `CartDrawerBlockProps` | L24 of `CartDrawerBlock.tsx` |
| 7 | `EcommerceMiniCart` | Mini Cart | `miniCartDefinition` (inline, L206 of `studio/index.ts`) | `MiniCartBlock` | `MiniCartBlockProps` | L42 of `MiniCartBlock.tsx` |

#### Checkout (3 components — ECOM-23)

| # | Type | Label | Definition Location | Render Component | Props Interface | Interface Line |
|---|---|---|---|---|---|---|
| 8 | `EcommerceCheckoutPage` | Checkout Page | `checkoutPageDefinition` (inline, L237 of `studio/index.ts`) | `CheckoutPageBlock` | `CheckoutPageBlockProps` | L80 of `CheckoutPageBlock.tsx` |
| 9 | `EcommerceOrderConfirmation` | Order Confirmation | `orderConfirmationDefinition` (inline, L257 of `studio/index.ts`) | `OrderConfirmationBlock` | `OrderConfirmationBlockProps` | L92 of `OrderConfirmationBlock.tsx` |
| 10 | `EcommerceOrderTracking` | Order Tracking | `orderTrackingDefinition` (inline, L270 of `studio/index.ts`) | `OrderTrackingBlock` | `OrderTrackingBlockProps` | L30 of `OrderTrackingBlock.tsx` |

#### Navigation & Discovery (5 components — ECOM-24)

| # | Type | Label | Definition Location | Render Component | Props Interface | Interface Line |
|---|---|---|---|---|---|---|
| 11 | `EcommerceCategoryNav` | Category Navigation | `categoryNavDefinition` (inline, L286 of `studio/index.ts`) | `CategoryNavBlock` | `CategoryNavBlockProps` | L33 of `CategoryNavBlock.tsx` |
| 12 | `EcommerceSearchBar` | Product Search | `searchBarDefinition` (inline, L332 of `studio/index.ts`) | `SearchBarBlock` | `SearchBarBlockProps` | L16 of `SearchBarBlock.tsx` |
| 13 | `EcommerceFilterSidebar` | Product Filters | `filterSidebarDefinition` (inline, L357 of `studio/index.ts`) | `FilterSidebarBlock` | `FilterSidebarBlockProps` | L42 of `FilterSidebarBlock.tsx` |
| 14 | `EcommerceBreadcrumb` | Breadcrumb Navigation | `breadcrumbDefinition` (inline, L393 of `studio/index.ts`) | `BreadcrumbBlock` | `BreadcrumbBlockProps` | L18 of `BreadcrumbBlock.tsx` |
| 15 | `EcommerceProductSort` | Product Sort | `productSortDefinition` (inline, L416 of `studio/index.ts`) | `ProductSortBlock` | `ProductSortBlockProps` | L19 of `ProductSortBlock.tsx` |

#### Quotation (3 components — ECOM-25)

| # | Type | Label | Definition Location | Render Component | Props Interface | Interface Line |
|---|---|---|---|---|---|---|
| 16 | `EcommerceQuoteRequest` | Quote Request Form | `quoteRequestDefinition` (inline, L437 of `studio/index.ts`) | `QuoteRequestBlock` | `QuoteRequestBlockProps` | L28 of `QuoteRequestBlock.tsx` |
| 17 | `EcommerceQuoteList` | Quote List | `quoteListDefinition` (inline, L456 of `studio/index.ts`) | `QuoteListBlock` | `QuoteListBlockProps` | L38 of `QuoteListBlock.tsx` |
| 18 | `EcommerceQuoteDetail` | Quote Detail | `quoteDetailDefinition` (inline, L474 of `studio/index.ts`) | `QuoteDetailBlock` | `QuoteDetailBlockProps` | L43 of `QuoteDetailBlock.tsx` |

#### Reviews (2 components — ECOM-60)

| # | Type | Label | Definition Source | Render Component | Props Interface | Interface Line |
|---|---|---|---|---|---|---|
| 19 | `EcommerceReviewForm` | Review Form | `reviewFormDefinition` (imported from `ReviewFormBlock.tsx`) | `ReviewFormBlock` | `ReviewFormBlockProps` | L33 of `ReviewFormBlock.tsx` |
| 20 | `EcommerceReviewList` | Review List | `reviewListDefinition` (imported from `ReviewListBlock.tsx`) | `ReviewListBlock` | `ReviewListBlockProps` | L28 of `ReviewListBlock.tsx` |

#### Dynamic Pages (3 components — ECOM-51)

| # | Type | Label | Definition Source | Render Component | Props Interface | Interface Line |
|---|---|---|---|---|---|---|
| 21 | `ProductDetailBlock` | Product Detail | `productDetailDefinition` (imported from `ProductDetailBlock.tsx`) | `ProductDetailBlock` | `ProductDetailBlockProps` | L55 of `ProductDetailBlock.tsx` |
| 22 | `CategoryHeroBlock` | Category Hero | `categoryHeroDefinition` (imported from `CategoryHeroBlock.tsx`) | `CategoryHeroBlock` | `CategoryHeroBlockProps` | L25 of `CategoryHeroBlock.tsx` |
| 23 | `EcommerceCategoriesPage` | Categories Page | `categoriesPageDefinition` (imported from `CategoriesPageBlock.tsx`) | `CategoriesPageBlock` | `CategoriesPageBlockProps` | L44 of `CategoriesPageBlock.tsx` |

#### Utility Components (re-exported, not registered as studio blocks)

| Component | File | Purpose |
|---|---|---|
| `ProductPriceDisplay` | `ProductPriceDisplay.tsx` | Formats & displays product prices (sale, original, discount %) |
| `ProductStockBadge` | `ProductStockBadge.tsx` | Stock status indicator (in-stock, low, out-of-stock, pre-order) |
| `ProductRatingDisplay` | `ProductRatingDisplay.tsx` | Star rating display |
| `ProductImageGallery` | `ProductImageGallery.tsx` | Image gallery with zoom |
| `CartItemCard` | `CartItemCard.tsx` | Individual cart item row |
| `CartSummaryCard` | `CartSummaryCard.tsx` | Cart totals summary |
| `CartQuantitySelector` | `CartQuantitySelector.tsx` | Quantity increment/decrement |
| `CartEmptyState` | `CartEmptyState.tsx` | Empty cart display |
| `CartDiscountInput` | `CartDiscountInput.tsx` | Discount/coupon code input |
| `CheckoutStepIndicator` | `CheckoutStepIndicator.tsx` | Multi-step progress indicator |
| `AddressForm` | `AddressForm.tsx` | Shipping/billing address form |
| `ShippingMethodSelector` | `ShippingMethodSelector.tsx` | Shipping option picker |
| `PaymentMethodSelector` | `PaymentMethodSelector.tsx` | Payment method picker |
| `OrderSummaryCard` | `OrderSummaryCard.tsx` | Checkout order summary |
| `CategoryCard` | `CategoryCard.tsx` | Category display card |
| `ActiveFilters` | `ActiveFilters.tsx` | Active filter tags display |
| `QuoteStatusBadge` | `QuoteStatusBadge.tsx` | Quote status colour badge |
| `QuoteItemCard` | `QuoteItemCard.tsx` | Quote line item display |
| `QuotePriceBreakdown` | `QuotePriceBreakdown.tsx` | Quote pricing breakdown |
| `QuoteActionButtons` | `QuoteActionButtons.tsx` | Accept/reject/counter quote actions |
| `StorefrontAuthDialog` | `StorefrontAuthDialog.tsx` | Login/signup dialog |
| `StorefrontErrorBoundary` | `StorefrontErrorBoundary.tsx` | Error boundary wrapper |
| `NavAccountBadge` | `NavAccountBadge.tsx` | Navigation account menu |
| `NavCartBadge` | `NavCartBadge.tsx` | Navigation cart badge |

### 0.3 Props Pipeline — How E-Commerce Components Differ from Core

```
AI Designer generates component JSON (type: "ProductGrid", props: {...})
  ↓
converter.ts typeMap (L707): "ProductGrid" → "EcommerceProductGrid"
  ↓
converter.ts KNOWN_REGISTRY_TYPES (L885): validates "EcommerceProductGrid" ✅
  ↓
converter.ts transformPropsForStudio() MODULE_TYPES handler (L2476):
  → Adds containment: maxWidth="1280px", containerClassName, sectionPaddingY/X
  → Does NOT normalize individual prop names (generic ...props spread)
  ↓
Supabase JSONB storage (site pages content)
  ↓
craft-renderer.tsx → StudioRenderer → componentRegistry.get("EcommerceProductGrid")
  ↓
module-loader.ts dynamically loads ecommerce/studio → registers components
  ↓
Component renders with {…component.props, siteId} inside StorefrontProvider
```

**Key difference from core components:** Core components (Hero, CTA, etc.) have detailed normalizers in `transformPropsForStudio()` that map AI field names to render field names (`headline` → `title`, `ctaText` → `buttonText`). E-commerce module components use a **generic MODULE_TYPES handler** that only adds containment props — there is no per-component field name normalization. The AI must use exact field names that match the component definitions in `studio/index.ts`.

### 0.4 Custom Fields

| Field Type | Registration Key | Component | Used In |
|---|---|---|---|
| Product Selector | `ecommerce:product-selector` | `ProductSelectorField` | `EcommerceProductCard.productId` |
| Category Selector | `ecommerce:category-selector` | `CategorySelectorField` | `EcommerceProductGrid.categoryId`, `EcommerceProductCatalog.categoryId`, `EcommerceFeaturedProducts.categoryId` |

### 0.5 Auto-Generated Page Templates

When the e-commerce module is installed, `page-templates.ts` creates:

| Page | URL | Components Used |
|---|---|---|
| **Shop** | `/shop` | SearchBar → ValuePropositions → FeaturedProducts → CategoryNav → FeaturedProducts (new arrivals) → ProductCatalog → Newsletter |
| **Cart** | `/cart` | Breadcrumb → CartPage |
| **Checkout** | `/checkout` | CheckoutPage |
| **Order Confirmation** | `/order-confirmation` | OrderConfirmation |
| **Order Tracking** | `/order-tracking` | OrderTracking |
| **Product Detail** | `/product/[slug]` | Breadcrumb → ProductDetail → FeaturedProducts (related) |
| **Categories** | `/categories` | CategoriesPage |
| **Category** | `/category/[slug]` | CategoryHero → Breadcrumb → FilterSidebar + ProductCatalog |

### 0.6 Critical Constants

| Constant | Value | Location | Significance |
|---|---|---|---|
| **Price storage** | **ALL values in CENTS (integers)** | `storefront-context.tsx` L102: `amount / 100` | `formatPrice(2500)` → "$25.00". NEVER store dollars as floats. |
| **Module slug** | `"ecommerce"` | `module-loader.ts` L31 | Used for dynamic import and field prefixing |
| **Module ID** | `ecommod01` | `manifest.ts` | Database table prefix: `mod_ecommod01_*` |
| **Table prefix** | `mod_ecommod01_` | Supabase | 50 tables total |
| **Default currency** | `ZMW` (Zambian Kwacha) | `locale-config.ts` | DRAMAC targets Zambian market first |

---

## 1. Current State Audit

### 1.1 What Works ✅

| Area | Status | Details |
|---|---|---|
| **Product display** | ✅ Complete | Grid, card, catalog, featured products — all render with real data |
| **Cart system** | ✅ Complete | Session-based guest carts, quantity management, discount codes |
| **Checkout flow** | ✅ Complete | Multi-step (information→payment), guest checkout, mobile-responsive |
| **Order lifecycle** | ✅ Complete | Create→process→ship→deliver, payment proof upload, email notifications |
| **Quotation system** | ✅ Complete | Request→review→accept/reject→convert-to-order, PDF generation |
| **Product reviews** | ✅ Complete | Submit, moderate, display with ratings, verified purchase badges |
| **Category navigation** | ✅ Complete | Tree, grid, list, dropdown variants with recursive subcategories |
| **Search** | ✅ Complete | Live autocomplete, recent searches, trending terms |
| **Filters** | ✅ Complete | Price range, category, brand, stock, rating, on-sale |
| **AI typeMap** | ✅ Complete | 40+ aliases map AI names to canonical types |
| **Module loader** | ✅ Complete | Dynamic import, componentRegistry integration, field registration |
| **Auto pages** | ✅ Complete | 8 page templates auto-generated on module install |
| **Mobile components** | ✅ Complete | 22 dedicated mobile components with touch gestures |
| **Responsive design** | ✅ Complete | `ResponsiveValue<T>` type for mobile/tablet/desktop breakpoints |

### 1.2 What's Broken 🔴

| Area | Issue | Impact | Root Cause |
|---|---|---|---|
| **Brand colours** | All 65+ storefront files use hardcoded Tailwind colours | Every DRAMAC store looks identical | `StorefrontContext` exposes NO brand colours despite `EcommerceSettings.primary_color` existing |
| **Dark mode** | 250+ `dark:` Tailwind classes across components | Inconsistent dark mode — some components support it, others don't | No centralized theme system |
| **component-metadata.ts** | Only 6 legacy entries (ProductGrid, ProductCard, etc.) — 19 module components have NO metadata | AI has limited discovery info for most e-commerce components | Legacy entries predate the module system |
| **Converter normalizer** | Generic `MODULE_TYPES` handler — no per-component field mapping | AI must use exact field names or props are lost | Module components treated as black boxes by the converter |

### 1.3 Component Count Summary

| Category | Studio Blocks | Utility Components | Mobile Components | Total |
|---|---|---|---|---|
| Product Display | 4 | 5 (PriceDisplay, StockBadge, RatingDisplay, ImageGallery, QuickView) | 5 (MobileProductCard, MobileProductGrid, MobileProductDetail, MobileQuickView, MobileImageGallery) | 14 |
| Cart | 3 | 5 (ItemCard, SummaryCard, QuantitySelector, EmptyState, DiscountInput) | 3 (MobileCartDrawer, MobileMiniCart, SwipeableCartItem) | 11 |
| Checkout | 3 | 5 (StepIndicator, AddressForm, ShippingMethodSelector, PaymentMethodSelector, OrderSummaryCard) | 3 (MobileCheckout, MobileAddressForm, MobilePaymentSelector) | 11 |
| Navigation | 5 | 2 (CategoryCard, ActiveFilters) | 3 (MobileCategoryNav, MobileSearchBar, MobileFilterDrawer) | 10 |
| Quotation | 3 | 4 (StatusBadge, ItemCard, PriceBreakdown, ActionButtons) | 0 | 7 |
| Reviews | 2 | 0 | 1 (MobileReviewForm) | 3 |
| Dynamic Pages | 3 | 0 | 0 | 3 |
| Auth/Utility | 0 | 4 (AuthDialog, ErrorBoundary, NavAccountBadge, NavCartBadge) | 4 (MobileBottomNav, MobileShareButton, MobileSizeGuide, MobileStockAlert) | 8 |
| **Total** | **23** | **25** | **19** | **67** |

> Note: `EcommerceCategoriesPage` and `ProductDetailBlock`/`CategoryHeroBlock` are registered as studio types, totalling 23 unique registrations (not 25 — the index.ts file shows 23 entries in the `studioComponents` export object).

---

## 2. Architecture Overview

### 2.1 Module-Based Components vs Core Components

Core DRAMAC components (Hero, CTA, Features, etc.) live in a **centralised** architecture:
- Render functions → `src/lib/studio/blocks/renders.tsx` (single 26,000+ line file)
- Registry → `src/lib/studio/registry/core-components.ts` (single file, all definitions)
- AI metadata → `src/lib/studio/registry/component-metadata.ts` (single file, all entries)

E-commerce components use a **decentralised module** architecture:
- Each component has its **own file** in `src/modules/ecommerce/studio/components/`
- Definitions are either inline in `studio/index.ts` or co-located with the component file
- Registration happens dynamically via `module-loader.ts` when the module is installed
- Components use real data hooks instead of static props

```
Core Architecture                     Module Architecture
┌─────────────────┐                   ┌─────────────────────────────┐
│  renders.tsx     │                   │  ecommerce/studio/index.ts  │
│  (all renders)   │                   │  (exports studioComponents) │
└────────┬────────┘                   └──────────────┬──────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                   ┌─────────────────────────────┐
│ core-components  │                   │  module-loader.ts           │
│ .ts (registry)   │                   │  (dynamic import & register)│
└────────┬────────┘                   └──────────────┬──────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                   ┌─────────────────────────────┐
│ componentRegistry│ ◄──── MERGE ────►│ componentRegistry           │
│ (core types)     │                   │ (module types)              │
└────────┬────────┘                   └──────────────┬──────────────┘
         │                                           │
         └───────────────────┬───────────────────────┘
                             ▼
                  ┌──────────────────┐
                  │  renderer.tsx     │
                  │  (dispatches by   │
                  │   component type) │
                  └──────────────────┘
```

### 2.2 Data Flow — StorefrontProvider Context

Every e-commerce storefront component renders inside a `StorefrontProvider`:

```
craft-renderer.tsx
  └── StorefrontProvider (siteId)
       └── StorefrontAuthProvider (siteId)
            └── StudioRenderer (content, modules)
                 └── ComponentRenderer
                      └── EcommerceProductGrid ({ ...props, siteId })
                           └── useStorefrontProducts(siteId, filters)
                                └── getPublicProducts(siteId, ...) [server action]
                                     └── Supabase query (mod_ecommod01_products)
```

StorefrontContext provides:
| Field | Type | Source | Notes |
|---|---|---|---|
| `siteId` | `string` | Prop from CraftRenderer | Used by all data hooks |
| `settings` | `EcommerceSettings \| null` | Fetched from `getPublicEcommerceSettings(siteId)` | Currency, tax, quotation config |
| `currency` | `string` | `settings.currency` or `"ZMW"` default | ISO 4217 code |
| `currencySymbol` | `string` | Derived from currency | `K` for ZMW, `$` for USD, etc. |
| `taxRate` | `number` | `settings.tax_rate` or `0` | Percentage (e.g., 16 = 16%) |
| `formatPrice` | `(amount: number) => string` | Uses `formatCurrency(amount / 100, currency)` | **Input in CENTS** |
| `isInitialized` | `boolean` | After settings load | Gate for rendering |
| `quotationModeEnabled` | `boolean` | `settings.quotation_mode_enabled` | Hide prices, show "Request Quote" |
| `quotationButtonLabel` | `string` | `settings.quotation_button_label` | Default: "Request a Quote" |
| `quotationRedirectUrl` | `string` | `settings.quotation_redirect_url` | Default: "/quotes" |
| `quotationHidePrices` | `boolean` | `settings.quotation_hide_prices` | Hides price display when true |

**Missing:** `primaryColor`, `accentColor`, `textColor`, `backgroundColor`, `fontFamily` — none of the brand styling information is exposed.

---

## 3. Component Pipeline

### 3.1 AI → Storefront Flow

```
Step 1: AI generates component
   { type: "ProductGrid", props: { columns: 4, source: "featured" } }

Step 2: converter.ts typeMap (L707)
   "ProductGrid" → "EcommerceProductGrid"

Step 3: converter.ts KNOWN_REGISTRY_TYPES (L885)
   Validates "EcommerceProductGrid" is in the Set → ✅ passes

Step 4: converter.ts transformPropsForStudio() MODULE_TYPES (L2476-2508)
   if (MODULE_TYPES.includes("EcommerceProductGrid")) {
     return {
       ...props,
       maxWidth: "1280px",
       containerClassName: "max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8",
       sectionPaddingY: "py-12 md:py-16",
       sectionPaddingX: "px-4 sm:px-6 lg:px-8",
     };
   }

Step 5: Stored in Supabase JSONB (site page content)

Step 6: craft-renderer.tsx renders page
   → StorefrontProvider wraps content
   → StudioRenderer loads module components via module-loader.ts
   → componentRegistry.get("EcommerceProductGrid") → returns definition
   → Renders ProductGridBlock with { ...component.props, siteId }

Step 7: ProductGridBlock uses hooks
   → useStorefrontProducts(siteId, { source, categoryId, limit })
   → Returns real product data from Supabase
   → Renders product cards with live prices, images, stock status
```

### 3.2 Module Loader Flow

```
module-loader.ts loadModuleComponents(modules)
  ↓
  For each module with status === "active":
    ↓
    MODULE_IMPORTS["ecommerce"]() → dynamic import("@/modules/ecommerce/studio")
    ↓
    Receives: { studioComponents, studioFields, studioMetadata }
    ↓
    processModuleComponents(studioComponents, moduleInfo)
      → Adds module: moduleInfo.id to each definition
      → componentRegistry.register(def, "module", moduleInfo.id)
    ↓
    For each studioField:
      → fieldRegistry.registerCustomRenderer("ecommerce:product-selector", ...)
      → fieldRegistry.registerCustomRenderer("ecommerce:category-selector", ...)
```

---

## 4. Product Display Components — Deep Dive

### 4.1 EcommerceProductCard

**Type:** `EcommerceProductCard` | **File:** `studio/components/product-card-block.tsx`

#### Studio Definition Fields (from `studio/index.ts` L498)

```typescript
fields: {
  ...productCardDefinition.fields,  // Spread from product-card-block.tsx
  productId: {                       // Override with custom selector
    type: "custom",
    customType: "ecommerce:product-selector",
    label: "Product",
    description: "Select a product from your catalog",
  },
}
```

#### ProductCardProps Interface (L48 of `product-card-block.tsx`)

| Prop | Type | Default | Source | Notes |
|---|---|---|---|---|
| `productId` | `string?` | — | Custom field selector | Product to display |
| `siteId` | `string?` | — | Injected by renderer | Site context |
| `_siteId` | `string?` | — | Editor fallback | Used in editor preview |
| `productData` | `Product?` | — | Direct data prop | Skip fetch if provided |
| `showPrice` | `boolean` | `true` | Registry field | Show/hide price |
| `showRating` | `boolean` | `true` | Registry field | Show/hide star rating |
| `showButton` | `boolean` | `true` | Registry field | Show/hide add-to-cart |
| `showWishlistButton` | `boolean` | — | Registry field | Show/hide wishlist heart |
| `showQuickView` | `boolean` | — | Registry field | Show/hide quick view |
| `showStockBadge` | `boolean` | — | Registry field | Show/hide stock status |
| `showSaleBadge` | `boolean` | — | Registry field | Show/hide sale % badge |
| `buttonText` | `string` | — | Registry field | CTA button text |
| `variant` | `"card" \| "horizontal" \| "minimal" \| "compact"` | `"card"` | Registry field | Card layout style |
| `imageAspect` | `"square" \| "portrait" \| "landscape"` | `"square"` | Registry field | Image ratio |
| `hoverEffect` | `"zoom" \| "slide" \| "fade" \| "none"` | `"zoom"` | Registry field | Image hover animation |
| `padding` | `string?` | — | Registry field | Card padding |
| `borderRadius` | `string?` | — | Registry field | Card border radius |
| `onQuickView` | `(product) => void` | — | Parent callback | Quick view trigger |
| `onProductClick` | `(product) => void` | — | Parent callback | Click handler |

#### Hooks Used
- `useStorefrontProduct(siteId, productId)` — fetches single product
- `useStorefrontCart()` — add-to-cart operations
- `useStorefrontWishlist()` — wishlist toggle
- `useStorefront()` — formatPrice, quotation mode

#### Hardcoded Colours (P1)
| Element | Classes | Should Be |
|---|---|---|
| Sale badge | `bg-red-500 text-white` | Brand accent / CSS variable |
| Pre-order badge | `bg-orange-500 hover:bg-orange-600` | Brand secondary |
| Wishlist heart | `text-red-500 hover:text-red-500` | Semantic (acceptable) |
| Quick view overlay | `bg-white/90` | Theme surface/overlay |

### 4.2 EcommerceProductGrid

**Type:** `EcommerceProductGrid` | **File:** `studio/components/product-grid-block.tsx`

#### ProductGridProps Interface (L38 of `product-grid-block.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `columns` | `ResponsiveValue<number>` | `{mobile:2, tablet:3, desktop:4}` | Responsive grid columns |
| `gap` | `ResponsiveValue<string>` | `{mobile:"16px"}` | Grid gap |
| `source` | `"featured" \| "new" \| "sale" \| "category" \| "manual"` | `"featured"` | Product source filter |
| `categoryId` | `string?` | — | Custom category selector field |
| `productIds` | `string[]?` | — | Manual product selection |
| `limit` | `number` | `8` | Max products to display |
| `showPrice` | `boolean` | `true` | Passed to ProductCardBlock |
| `showRating` | `boolean` | `true` | Passed to ProductCardBlock |
| `cardVariant` | `"card" \| "minimal" \| "horizontal"` | `"card"` | Card style for all items |
| `siteId` | `string?` | — | Injected |
| `_isEditor` | `boolean?` | — | Editor mode flag |
| `_siteId` | `string?` | — | Editor fallback |

#### Hooks Used
- `useStorefrontProducts(siteId, { source, categoryId, limit })` — product list
- `useStorefront()` — context
- `useRouter()` — click navigation

### 4.3 EcommerceProductCatalog

**Type:** `EcommerceProductCatalog` | **File:** `studio/components/ProductGridBlock.tsx`

This is the **enhanced** version of ProductGrid with built-in filtering, sorting, search, and pagination.

#### ProductGridProps Interface (L95 of `ProductGridBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `siteId` | `string?` | — | Injected |
| `categoryId` | `string?` | — | Category filter |
| `columns` | `number` | — | Grid columns (not responsive) |
| `showFilters` | `boolean` | `true` | Show filter sidebar |
| `showSorting` | `boolean` | `true` | Show sort dropdown |
| `showPagination` | `boolean` | `true` | Show page controls |
| `showSearch` | `boolean` | — | Search bar integration |
| `showResultCount` | `boolean` | — | "Showing X of Y" text |
| `productsPerPage` | `number` | `12` | Pagination page size |
| `cardVariant` | `string` | — | Card style |
| `showPrice` | `boolean` | — | Price display |
| `showRating` | `boolean` | — | Rating display |
| `showAddToCart` | `boolean` | — | Add to cart button |
| `showWishlist` | `boolean` | — | Wishlist button |
| `showQuickView` | `boolean` | — | Quick view |
| `gap` | `string?` | — | Grid gap |
| `padding` | `string?` | — | Container padding |

#### Internal State Management
- `searchQuery`, `debouncedSearch` — search with debounce
- `selectedCategory` — active category filter
- `priceRange` — [min, max] price filter
- `inStockOnly`, `onSaleOnly` — toggle filters
- `sortBy` — active sort option
- `currentPage` — pagination state
- `viewMode` — grid/list toggle

#### Grid Column Maps (module-level constants for Tailwind purge safety)
- `GRID_COLS_MAP` — mobile columns
- `MD_GRID_COLS_MAP` — tablet columns
- `LG_GRID_COLS_MAP` — desktop columns

### 4.4 EcommerceFeaturedProducts

**Type:** `EcommerceFeaturedProducts` | **File:** `studio/components/FeaturedProductsBlock.tsx`

#### FeaturedProductsProps Interface (L51 of `FeaturedProductsBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `siteId` | `string?` | — | Injected |
| `_siteId` | `string?` | — | Editor fallback |
| `productSource` | `"featured" \| "new" \| "bestselling" \| "sale" \| "category"` | `"featured"` | Product source |
| `categoryId` | `string?` | — | Category filter |
| `productIds` | `string[]?` | — | Manual selection |
| `limit` | `number` | `8` | Max products |
| `title` | `string?` | — | Section heading |
| `subtitle` | `string?` | — | Section subtitle |
| `showTitle` | `boolean` | `true` | Show heading |
| `showViewAll` | `boolean` | `true` | Show "View All" link |
| `viewAllLink` | `string?` | — | View all destination |
| `displayMode` | `"carousel" \| "scroll" \| "hero-grid"` | `"carousel"` | Layout mode (Carousel, Scrollable Row, Hero Grid) |
| `columns` | `ResponsiveValue<number>` | `{mobile:2, tablet:3, desktop:4}` | Grid columns |
| `cardVariant` | `string` | `"card"` | Card style |
| `autoPlay` | `boolean` | `false` | Carousel auto-play |
| `autoPlayInterval` | `number` | — | Auto-play delay (ms) |
| `showNavigation` | `boolean` | `true` | Carousel arrows |
| `showDots` | `boolean` | `true` | Carousel dots |
| `showPrice` | `boolean` | — | Price display |
| `showRating` | `boolean` | — | Rating display |
| `showAddToCart` | `boolean` | — | Add to cart |
| `showWishlist` | `boolean` | — | Wishlist |
| `gap` | `string?` | — | Grid gap |
| `padding` | `string?` | — | Container padding |

#### Source Icons
| Source | Icon |
|---|---|
| `featured` | Sparkles |
| `new` | Clock |
| `bestselling` | TrendingUp |
| `sale` | Tag |

---

## 5. Cart Components — Deep Dive

### 5.1 EcommerceCartPage

**Type:** `EcommerceCartPage` | **File:** `studio/components/CartPageBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L158)

| Field | Type | Default | Label |
|---|---|---|---|
| `showContinueShopping` | toggle | `true` | Show Continue Shopping |
| `showDiscountInput` | toggle | `true` | Show Discount Code Input |
| `checkoutUrl` | text | `"/checkout"` | Checkout URL |

#### CartPageBlockProps Interface (L23 of `CartPageBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string?` | `"Shopping Cart"` | Page heading |
| `shopLink` | `string?` | `"/shop"` | Continue shopping URL |
| `shopLinkText` | `string?` | — | Button text |
| `checkoutHref` | `string?` | `"/checkout"` | Checkout URL |
| `checkoutText` | `string?` | — | Checkout button text |
| `showClearCart` | `boolean` | `true` | Clear cart button |
| `className` | `string?` | — | Custom classes |

#### Child Components
- `CartItemCard` — individual cart item with quantity controls
- `CartEmptyState` — empty cart display with shop link
- `CartSummaryCard` — subtotal, discounts, tax, total, checkout button

#### Quotation Integration
When `quotationModeEnabled` is true, the checkout button redirects to the quote page instead.

### 5.2 EcommerceCartDrawer

**Type:** `EcommerceCartDrawer` | **File:** `studio/components/CartDrawerBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L190)

| Field | Type | Default | Options |
|---|---|---|---|
| `position` | select | `"right"` | Right, Left |

#### CartDrawerBlockProps Interface (L24 of `CartDrawerBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `trigger` | `ReactNode?` | — | Custom trigger element (defaults to ShoppingCart icon with badge) |
| `side` | `"right" \| "left"` | `"right"` | Drawer slide direction |
| `checkoutHref` | `string?` | `"/checkout"` | Checkout URL |
| `shopLink` | `string?` | `"/shop"` | Continue shopping URL |
| `className` | `string?` | — | Custom classes |

### 5.3 EcommerceMiniCart

**Type:** `EcommerceMiniCart` | **File:** `studio/components/MiniCartBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L206)

| Field | Type | Default | Options |
|---|---|---|---|
| `position` | select | `"top-right"` | Top Right, Bottom Right |
| `showItemCount` | toggle | `true` | Show Item Count |

#### MiniCartBlockProps Interface (L42 of `MiniCartBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `trigger` | `ReactNode?` | — | Custom trigger (defaults to ghost button with cart icon) |
| `maxItems` | `number` | `3` | Max items shown in preview |
| `cartHref` | `string?` | `"/cart"` | Full cart page URL |
| `checkoutHref` | `string?` | `"/checkout"` | Checkout URL |
| `shopLink` | `string?` | `"/shop"` | Continue shopping URL |
| `align` | `"start" \| "center" \| "end"` | `"end"` | Popover alignment |
| `className` | `string?` | — | Custom classes |

### 5.4 Cart Data Hook — `useStorefrontCart`

| Function | Return | Notes |
|---|---|---|
| `cart` | `StorefrontCart` | Full cart object with items |
| `itemCount` | `number` | Total item count |
| `subtotal` | `number` | Subtotal in cents |
| `total` | `number` | Total in cents (after discounts/tax) |
| `isLoading` | `boolean` | Loading state |
| `addItem(productId, quantity, variantId?)` | `void` | Add to cart |
| `updateQuantity(itemId, quantity)` | `void` | Update quantity |
| `removeItem(itemId)` | `void` | Remove from cart |
| `clearCart()` | `void` | Clear all items |
| `applyDiscount(code)` | `void` | Apply discount code |

Session-based guest carts — no login required. Cart persists via session ID in localStorage.

---

## 6. Checkout Components — Deep Dive

### 6.1 EcommerceCheckoutPage

**Type:** `EcommerceCheckoutPage` | **File:** `studio/components/CheckoutPageBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L237)

| Field | Type | Default | Label |
|---|---|---|---|
| `enableGuestCheckout` | toggle | `true` | Enable Guest Checkout |
| `showOrderSummary` | toggle | `true` | Show Order Summary |

#### CheckoutPageBlockProps Interface (L80 of `CheckoutPageBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `cartHref` | `string?` | `"/cart"` | Back to cart URL |
| `successHref` | `string?` | `"/order-confirmation"` | Success redirect |
| `onOrderComplete` | `(orderId: string) => void` | — | Callback |
| `className` | `string?` | — | Custom classes |

#### Checkout Steps (managed by `useCheckout` hook)
1. **Information** — Email, phone, shipping address, shipping method
2. **Payment** — Payment method, billing address, order notes
3. **Review** — Order summary, confirm & pay

#### Nested Step Components
- `InformationStep` — shipping address form + method selection
- `PaymentStep` — payment method + billing address + notes

#### Mobile Variant
Uses `MobileCheckoutPage` component with data mapping for touch-optimised layout.

### 6.2 EcommerceOrderConfirmation

**Type:** `EcommerceOrderConfirmation` | **File:** `studio/components/OrderConfirmationBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L257)

| Field | Type | Default | Label |
|---|---|---|---|
| `showContinueShopping` | toggle | `true` | Show Continue Shopping |

#### OrderConfirmationBlockProps Interface (L92 of `OrderConfirmationBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `order` | `Order?` | — | Pre-loaded order data |
| `orderId` | `string?` | — | Order ID to fetch |
| `isLoading` | `boolean?` | — | Loading state |
| `error` | `string?` | — | Error message |
| `formatPrice` | `(amount: number) => string` | — | Price formatter |
| `shopLink` | `string?` | — | Continue shopping URL |
| `trackingLink` | `string?` | — | Order tracking URL |
| `className` | `string?` | — | Custom classes |

#### Features
- Reads `orderId` from URL search params (`?orderId=XXX`)
- Self-fetches order via `getPublicOrderById(orderId)`
- Payment proof upload (for bank transfer / manual payment)
- Copy order number
- Print link

### 6.3 EcommerceOrderTracking

**Type:** `EcommerceOrderTracking` | **File:** `studio/components/OrderTrackingBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L270)

| Field | Type | Default | Label |
|---|---|---|---|
| `showRecentOrder` | toggle | `true` | Show Recent Order Link |

#### OrderTrackingBlockProps Interface (L30 of `OrderTrackingBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `shopLink` | `string?` | `"/shop"` | Continue shopping URL |
| `className` | `string?` | — | Custom classes |

#### Features
- Lookup by email + order number
- Checks localStorage for recent order ID
- Self-fetches via `getPublicOrderByLookup(email, orderNumber)`

---

## 7. Navigation & Discovery Components — Deep Dive

### 7.1 EcommerceCategoryNav

**Type:** `EcommerceCategoryNav` | **File:** `studio/components/CategoryNavBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L286)

| Field | Type | Default | Options |
|---|---|---|---|
| `variant` | select | `"tree"` | Tree Menu, Grid Cards, List, Chips/Tags |
| `showProductCount` | toggle | `true` | Show Product Count |
| `showImages` | toggle | `true` | Show Images |
| `showSubcategories` | toggle | `true` | Show Subcategories |
| `title` | text | `"Categories"` | Section Title |
| `showTitle` | toggle | `true` | Show Title |

#### CategoryNavBlockProps Interface (L33 of `CategoryNavBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"tree" \| "grid" \| "list" \| "cards" \| "dropdown" \| "auto"` | — | Display style |
| `columns` | `ResponsiveValue<number>?` | — | Grid columns |
| `title` | `string?` | — | Section heading |
| `showTitle` | `boolean` | `true` | Show heading |
| `showProductCount` | `boolean` | — | Show count per category |
| `showImages` | `boolean` | — | Show category images |
| `showSubcategories` | `boolean` | — | Show child categories |
| `maxDepth` | `number` | `3` | Maximum nesting depth |
| `expandable` | `boolean` | `true` | Collapsible tree items |
| `defaultExpanded` | `boolean` | `false` | Start expanded |
| `parentCategory` | `string?` | — | Root category filter |
| `className` | `string?` | — | Custom classes |

#### Helper Functions
- `buildTree()` — builds hierarchical category tree from flat list
- `getResponsiveValue()` — resolves responsive prop at current breakpoint

#### Sub-components
- `TreeItem` — recursive tree node with expand/collapse
- `DropdownCategoryNav` — dropdown select variant

### 7.2 EcommerceSearchBar

**Type:** `EcommerceSearchBar` | **File:** `studio/components/SearchBarBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L332)

| Field | Type | Default | Label |
|---|---|---|---|
| `placeholder` | text | `"Search products..."` | Placeholder Text |
| `showSuggestions` | toggle | `true` | Show Suggestions |
| `maxSuggestions` | number | `5` | Max Suggestions |

#### SearchBarBlockProps Interface (L16 of `SearchBarBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `string` | `"default"` | Visual variant |
| `placeholder` | `string` | `"Search products..."` | Input placeholder |
| `showSuggestions` | `boolean` | `true` | Show autocomplete |
| `showRecentSearches` | `boolean` | — | Show search history |
| `showTrendingSearches` | `boolean` | — | Show trending terms |
| `minSearchLength` | `number` | `2` | Min chars to trigger |
| `debounceMs` | `number` | `300` | Debounce delay |
| `maxSuggestions` | `number` | `6` | Max suggestion items |
| `searchUrl` | `string` | `"/shop/search"` | Search results page |
| `trendingTerms` | `string[]?` | — | Static trending terms |
| `className` | `string?` | — | Custom classes |

#### Hooks Used
- `useStorefrontSearch()` — autocomplete results
- `useRecentlyViewed()` — search history
- `useStorefrontCategories()` — trending terms fallback
- `useRouter()` — navigation on submit

### 7.3 EcommerceFilterSidebar

**Type:** `EcommerceFilterSidebar` | **File:** `studio/components/FilterSidebarBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L357)

| Field | Type | Default | Label |
|---|---|---|---|
| `showPriceFilter` | toggle | `true` | Show Price Filter |
| `showCategoryFilter` | toggle | `true` | Show Category Filter |
| `showStockFilter` | toggle | `true` | Show Stock Filter |
| `collapsible` | toggle | `true` | Collapsible Sections |

#### FilterSidebarBlockProps Interface (L42 of `FilterSidebarBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `string?` | — | Visual variant |
| `collapsible` | `boolean` | `true` | Collapsible sections |
| `defaultExpanded` | `boolean?` | — | Start expanded |
| `showCategories` | `boolean` | `true` | Category filter |
| `showBrands` | `boolean` | `true` | Brand filter |
| `showPriceRange` | `boolean` | `true` | Price range slider |
| `showAvailability` | `boolean?` | — | Stock filter |
| `showRating` | `boolean?` | — | Rating filter |
| `showOnSale` | `boolean?` | — | Sale filter |
| `minPrice` | `number?` | — | Min price (cents) |
| `maxPrice` | `number?` | — | Max price (cents) |
| `priceStep` | `number?` | — | Price increment |
| `brands` | `string[]?` | — | Brand options |
| `onFilterChange` | `(filters) => void` | — | Filter callback |
| `className` | `string?` | — | Custom classes |

### 7.4 EcommerceBreadcrumb

**Type:** `EcommerceBreadcrumb` | **File:** `studio/components/BreadcrumbBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L393)

| Field | Type | Default | Options |
|---|---|---|---|
| `showHome` | toggle | `true` | Show Home Link |
| `separator` | select | `"chevron"` | Chevron, Slash, Arrow |

#### BreadcrumbBlockProps Interface (L18 of `BreadcrumbBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `BreadcrumbItem[]?` | — | Manual breadcrumb items |
| `autoGenerate` | `boolean` | `true` | Generate from URL path |
| `showHome` | `boolean` | `true` | Include "Home" as first item |
| `homeLabel` | `string` | `"Home"` | Home link text |
| `homeHref` | `string` | `"/"` | Home link URL |
| `separator` | `"chevron" \| "slash" \| "arrow"` | `"chevron"` | Separator style |
| `variant` | `string` | `"default"` | Visual variant |
| `currentLabel` | `string?` | — | Override last item text |
| `className` | `string?` | — | Custom classes |

### 7.5 EcommerceProductSort

**Type:** `EcommerceProductSort` | **File:** `studio/components/ProductSortBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L416)

| Field | Type | Default | Options |
|---|---|---|---|
| `defaultSort` | select | `"newest"` | Newest, Price Low→High, Price High→Low, Name A–Z |

#### ProductSortBlockProps Interface (L19 of `ProductSortBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | `"featured"` | Current sort value |
| `onChange` | `(value: string) => void` | — | Sort change callback |
| `variant` | `"select" \| "dropdown" \| "buttons"` | `"select"` | Display variant |
| `showLabel` | `boolean` | `true` | Show "Sort by" label |
| `label` | `string` | `"Sort by"` | Label text |
| `options` | `SortOption[]` | `SORT_OPTIONS` | Available sort options |
| `className` | `string?` | — | Custom classes |

---

## 8. Quotation Components — Deep Dive

### 8.1 EcommerceQuoteRequest

**Type:** `EcommerceQuoteRequest` | **File:** `studio/components/QuoteRequestBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L437)

| Field | Type | Default | Label |
|---|---|---|---|
| `showNotes` | toggle | `true` | Show Notes Field |
| `requirePhone` | toggle | `false` | Require Phone Number |

#### QuoteRequestBlockProps Interface (L28 of `QuoteRequestBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `string` | `"default"` | Visual variant |
| `customerName` | `string?` | — | Pre-fill customer name |
| `customerEmail` | `string?` | — | Pre-fill email |
| `customerPhone` | `string?` | — | Pre-fill phone |
| `companyName` | `string?` | — | Pre-fill company |
| `showItems` | `boolean` | `true` | Show item builder |
| `showPricing` | `boolean` | `true` | Show pricing breakdown |
| `requirePhone` | `boolean` | `false` | Phone required |
| `requireCompany` | `boolean` | `false` | Company required |
| `onSuccess` | `(quote) => void` | — | Success callback |
| `title` | `string?` | `"Request a Quote"` | Form heading |
| `description` | `string?` | — | Form description |
| `className` | `string?` | — | Custom classes |

#### Features
- Reads `?product=ID` from URL to auto-add product to quote
- Form validation: name, email required; phone/company configurable
- Uses `useQuotations()` hook for submission

### 8.2 EcommerceQuoteList

**Type:** `EcommerceQuoteList` | **File:** `studio/components/QuoteListBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L456)

| Field | Type | Default | Options |
|---|---|---|---|
| `variant` | select | `"card"` | Cards, List, Table |

#### QuoteListBlockProps Interface (L38 of `QuoteListBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `userId` | `string?` | — | Filter by user |
| `statusFilter` | `string?` | — | Filter by status |
| `variant` | `"list" \| "card" \| "table"` | `"list"` | Layout variant |
| `detailUrl` | `string?` | — | Quote detail page base URL |
| `maxItems` | `number?` | — | Pagination limit |
| `showStatusFilter` | `boolean` | `true` | Show status filter dropdown |
| `showEmptyState` | `boolean` | `true` | Show empty state |
| `emptyMessage` | `string?` | — | Custom empty message |
| `title` | `string?` | — | Section heading |
| `className` | `string?` | — | Custom classes |

#### Status Options
`all`, `draft`, `pending_approval`, `sent`, `viewed`, `accepted`, `rejected`, `expired`, `converted`

### 8.3 EcommerceQuoteDetail

**Type:** `EcommerceQuoteDetail` | **File:** `studio/components/QuoteDetailBlock.tsx`

#### Studio Definition Fields (inline at `studio/index.ts` L474)
Empty fields object — no studio-configurable options.

#### QuoteDetailBlockProps Interface (L43 of `QuoteDetailBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `quoteId` | `string?` | — | Quote to display |
| `accessToken` | `string?` | — | Public access token |
| `quote` | `Quote?` | — | Pre-loaded quote data |
| `variant` | `string` | `"default"` | Visual variant |
| `showBackButton` | `boolean` | `true` | Show back navigation |
| `backUrl` | `string` | `"/quotes"` | Back button URL |
| `showCustomerInfo` | `boolean` | `true` | Show customer details |
| `showActivity` | `boolean?` | — | Show activity log |
| `enableActions` | `boolean` | `true` | Show accept/reject buttons |
| `onPrint` | `() => void` | — | Print callback |
| `onDownload` | `() => void` | — | Download PDF callback |
| `onShare` | `() => void` | — | Share callback |
| `className` | `string?` | — | Custom classes |

---

## 9. Review Components — Deep Dive

### 9.1 EcommerceReviewForm

**Type:** `EcommerceReviewForm` | **File:** `studio/components/ReviewFormBlock.tsx`

#### Studio Definition Fields (from `reviewFormDefinition` in `ReviewFormBlock.tsx`)

| Field | Type | Default | Label |
|---|---|---|---|
| `requireEmail` | toggle | `false` | Require Email |

#### ReviewFormBlockProps Interface (L33 of `ReviewFormBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `siteId` | `string?` | — | Site context |
| `productId` | `string?` | — | Product to review |
| `userId` | `string?` | — | User ID |
| `userName` | `string?` | — | Pre-fill name |
| `userEmail` | `string?` | — | Pre-fill email |
| `onSubmit` | `(review) => void` | — | Submit callback |
| `className` | `string?` | — | Custom classes |

#### Internal State
- `rating` (1–5 stars, required)
- `title`, `body` (review content)
- `name` (required), `email` (optional)
- `isSubmitting`, `submitted`, `error`

#### Sub-component
`StarRatingInput()` — interactive 5-star rating with hover preview

### 9.2 EcommerceReviewList

**Type:** `EcommerceReviewList` | **File:** `studio/components/ReviewListBlock.tsx`

#### Studio Definition Fields (from `reviewListDefinition` in `ReviewListBlock.tsx`)

| Field | Type | Default | Label |
|---|---|---|---|
| `showDistribution` | toggle | `true` | Show Rating Distribution |
| `pageSize` | number | `10` | Reviews Per Page |

#### ReviewListBlockProps Interface (L28 of `ReviewListBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `reviews` | `Review[]?` | — | Pre-loaded reviews |
| `stats` | `ReviewStats?` | — | Rating distribution |
| `totalReviews` | `number?` | — | Total count |
| `isLoading` | `boolean?` | — | Loading state |
| `hasMore` | `boolean?` | — | Load more flag |
| `sortBy` | `string?` | — | Current sort |
| `onSortChange` | `(sort: string) => void` | — | Sort callback |
| `onLoadMore` | `() => void` | — | Load more callback |
| `onMarkHelpful` | `(reviewId: string) => void` | — | Helpful callback |
| `className` | `string?` | — | Custom classes |

#### Sort Options
`newest`, `oldest`, `highest`, `lowest`, `helpful`

#### Sub-components
- `RatingDistribution()` — bar chart of 5-star breakdown
- `StarRating()` — display-only star rating
- `ReviewCard()` — individual review with verified badge, helpful button, admin response

---

## 10. Dynamic Page Components — Deep Dive

### 10.1 ProductDetailBlock

**Type:** `ProductDetailBlock` | **File:** `studio/components/ProductDetailBlock.tsx`

#### ProductDetailBlockProps Interface (L55 of `ProductDetailBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `siteId` | `string?` | — | Site context |
| `_siteId` | `string?` | — | Editor fallback |
| `productSlug` | `string?` | — | Product slug from URL |
| `showGallery` | `boolean` | `true` | Image gallery |
| `showVariants` | `boolean` | `true` | Variant selector |
| `showQuantity` | `boolean` | `true` | Quantity input |
| `showAddToCart` | `boolean` | `true` | Add to cart button |
| `showWishlist` | `boolean` | `true` | Wishlist button |
| `showShare` | `boolean?` | — | Share button |
| `showDescription` | `boolean?` | — | Description tab |
| `showSpecifications` | `boolean?` | — | Specs tab |
| `showReviews` | `boolean?` | — | Reviews tab |
| `galleryPosition` | `"left" \| "right"` | `"left"` | Gallery placement |
| `stickyAddToCart` | `boolean` | `true` | Sticky add-to-cart bar |
| `className` | `string?` | — | Custom classes |

#### Hooks Used
- `useStorefrontProduct(siteId, { slug })` — fetch product + variants
- `useStorefrontCart()` — add to cart
- `useStorefrontReviews(siteId, productId)` — reviews with submission
- `useStorefront()` — formatPrice, quotation mode
- `useRouter()`, `usePathname()` — slug extraction

#### Key Behaviour
- Extracts slug from URL path via `getSlugFromPath()`
- Supports tabbed content: Details, Specifications, Reviews
- Quotation mode: replaces "Add to Cart" with "Request a Quote"
- Variant selection: updates price, images, stock status

### 10.2 CategoryHeroBlock

**Type:** `CategoryHeroBlock` | **File:** `studio/components/CategoryHeroBlock.tsx`

#### CategoryHeroBlockProps Interface (L25 of `CategoryHeroBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `siteId` | `string?` | — | Site context |
| `_siteId` | `string?` | — | Editor fallback |
| `categorySlug` | `string?` | — | Category slug from URL |
| `showImage` | `boolean` | `true` | Background image |
| `showDescription` | `boolean` | `true` | Category description |
| `showProductCount` | `boolean` | `true` | Product count |
| `overlayOpacity` | `number` | `0.5` | Background overlay |
| `minHeight` | `string` | `"200px"` | Minimum height |
| `className` | `string?` | — | Custom classes |

### 10.3 EcommerceCategoriesPage

**Type:** `EcommerceCategoriesPage` | **File:** `studio/components/CategoriesPageBlock.tsx`

#### CategoriesPageBlockProps Interface (L44 of `CategoriesPageBlock.tsx`)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `siteId` | `string?` | — | Site context |
| `_siteId` | `string?` | — | Editor fallback |
| `title` | `string?` | — | Page heading |
| `subtitle` | `string?` | — | Page subtitle |
| `showSearch` | `boolean` | `true` | Search input |
| `showSubcategories` | `boolean` | `true` | Show child categories |
| `showProductCount` | `boolean` | `true` | Show count per category |
| `showImages` | `boolean` | `true` | Show category images |
| `showDescription` | `boolean?` | — | Show descriptions |
| `layout` | `"grid" \| "list"` | `"grid"` | Layout mode |
| `columns` | `"2" \| "3" \| "4"` (select) | `"3"` | Grid columns (select field, string values) |
| `className` | `string?` | — | Custom classes |

---

## 11. Brand Colour Pipeline — The Critical Gap

### 11.1 The Problem

`StorefrontContext` exposes **NO brand colours**. Every storefront component uses hardcoded Tailwind classes like `bg-gray-100`, `text-green-600`, `border-red-500`. This means every DRAMAC storefront looks identical regardless of the site owner's brand.

### 11.2 The Data Exists But Isn't Piped

`EcommerceSettings` type (in `ecommerce-types.ts`) has:
```typescript
primary_color?: string;  // L1902
```

This field exists in the database table `mod_ecommod01_settings` but is **never read by `StorefrontProvider`** and therefore **never available to any component**.

Additionally, sites have theme settings in `craft-renderer.tsx` via `themeSettings`:
```typescript
interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  // ... etc
}
```

These are available at the renderer level but **not passed down to module components** as props or context.

### 11.3 The Fix Required

**Option A: Expose brand colours via StorefrontContext** (recommended)
1. Read `settings.primary_color` in `StorefrontProvider`
2. Add `primaryColor`, `accentColor`, `textColor`, `backgroundColor` to the context value
3. Components use `useStorefront().primaryColor` instead of hardcoded classes
4. CSS variables injected at provider level: `--storefront-primary`, `--storefront-accent`, etc.

**Option B: Pass theme settings through to module components via renderer**
1. `craft-renderer.tsx` already has `themeSettings`
2. StudioRenderer could inject theme values as props to all components
3. Module components read `props.themeSettings` or a `useTheme()` hook

**Option C: CSS variable injection at the site level**
1. Site theme settings generate CSS variables on the `<html>` element
2. Components use `var(--brand-primary)` instead of hardcoded colours
3. This already partially exists for core components — extend to modules

### 11.4 Impact Assessment

| Affected Components | Count | Severity |
|---|---|---|
| Studio storefront components | **23** | P0 — customer-facing, brand-critical |
| Utility sub-components | **25** | P0 — rendered inside studio blocks |
| Mobile components | **19** | P1 — mobile storefront is brand-critical too |
| Dashboard components | **80+** | P2 — admin-facing, uses shadcn/ui theme |
| **Total customer-facing files** | **67** | **All need brand colour integration** |

---

## 12. Dark Mode & Theming

### 12.1 Current State

| Component Category | `dark:` Classes | Status |
|---|---|---|
| Product components | ~30 instances | Partial — ProductStockBadge, ProductPriceDisplay, ProductRatingDisplay have dark variants |
| Cart components | ~15 instances | Partial — CartDiscountInput, CartSummaryCard have dark variants |
| Checkout components | ~10 instances | Partial — CheckoutPageBlock, OrderConfirmationBlock |
| Navigation components | ~5 instances | Minimal — FilterSidebarBlock rating stars |
| Quote components | ~30 instances | Most quote components have dark mode Tailwind classes |
| Review components | ~10 instances | ReviewFormBlock, ReviewListBlock have dark variants |
| Mobile components | ~20 instances | Partial coverage |
| **Total** | **~120** | **Inconsistent — no unified system** |

### 12.2 Theming Strategy

E-commerce components should follow the same theming pattern as core components:

1. **Semantic CSS variables** over hardcoded colours
   - `var(--brand-primary)` instead of `bg-blue-600`
   - `var(--text-primary)` instead of `text-gray-900`
   - `var(--surface)` instead of `bg-white`
   - `var(--surface-muted)` instead of `bg-gray-100`
   - `var(--border)` instead of `border-gray-200`

2. **Status colours remain semantic** (acceptable)
   - Green for success/in-stock: `text-green-600 dark:text-green-400`
   - Red for error/out-of-stock: `text-red-600 dark:text-red-400`
   - Amber for warning/low-stock: `text-amber-600 dark:text-amber-400`
   - Blue for info: `text-blue-600 dark:text-blue-400`

3. **Star ratings use amber** (universal convention)
   - `fill-amber-400 text-amber-400` — acceptable, no change needed

---

## 13. AI Designer Integration

### 13.1 TypeMap Aliases (converter.ts L707–L758)

The AI converter maps multiple name variants to canonical e-commerce types:

| Canonical Type | Aliases | Line |
|---|---|---|
| `EcommerceProductGrid` | `ProductGrid` | L707 |
| `EcommerceFeaturedProducts` | `FeaturedProducts` | L709 |
| `EcommerceProductCard` | `ProductCard` | L711 |
| `EcommerceProductCatalog` | `ProductCatalog` | L713 |
| `EcommerceCartPage` | `CartItems`, `CartPage` | L715–L716 |
| `EcommerceCartDrawer` | `CartDrawer` | L718 |
| `EcommerceMiniCart` | `CartSummary`, `MiniCart` | L720–L721 |
| `EcommerceCheckoutPage` | `CheckoutForm`, `CheckoutPage` | L723–L724 |
| `EcommerceOrderConfirmation` | `OrderConfirmation` | L726 |
| `EcommerceCategoryNav` | `CategoryNav`, `CategoryNavigation` | L728–L729 |
| `EcommerceSearchBar` | `ProductSearch`, `SearchBar` | L731–L732 |
| `EcommerceFilterSidebar` | `FilterSidebar`, `ProductFilters` | L734–L735 |
| `EcommerceBreadcrumb` | `Breadcrumbs` | L739 |
| `EcommerceProductSort` | `ProductSort`, `SortBar` | L741–L742 |
| `EcommerceQuoteRequest` | `QuoteRequest` | L744 |
| `EcommerceQuoteList` | `QuoteList` | L746 |
| `EcommerceQuoteDetail` | `QuoteDetail` | L748 |
| `EcommerceReviewForm` | `ReviewForm` | L751 |
| `EcommerceReviewList` | `ProductReviews`, `ReviewList` | L753–L754 |
| `ProductDetailBlock` | `ProductDetail` | L756 |
| `CategoryHeroBlock` | `CategoryHero` | L758 |

### 13.2 KNOWN_REGISTRY_TYPES (converter.ts L885–L907)

All 21 e-commerce types are registered:
```
EcommerceProductGrid, EcommerceProductCard, EcommerceProductCatalog,
EcommerceFeaturedProducts, EcommerceCartPage, EcommerceCartDrawer,
EcommerceMiniCart, EcommerceCheckoutPage, EcommerceOrderConfirmation,
EcommerceCategoryNav, EcommerceSearchBar, EcommerceFilterSidebar,
EcommerceBreadcrumb, EcommerceProductSort, EcommerceQuoteRequest,
EcommerceQuoteList, EcommerceQuoteDetail, EcommerceReviewForm,
EcommerceReviewList, ProductDetailBlock, CategoryHeroBlock
```

**Note:** `EcommerceOrderTracking` and `EcommerceCategoriesPage` are **NOT** in `KNOWN_REGISTRY_TYPES`. If the AI generates these types, they will be flagged as unknown and potentially stripped.

### 13.3 MODULE_TYPES Containment (converter.ts L2476–L2508)

The generic normalizer adds containment to all e-commerce components:
```typescript
const MODULE_TYPES = [
  // ... booking types
  "EcommerceProductGrid",
  "EcommerceProductCard",
  "EcommerceProductCatalog",
  "EcommerceFeaturedProducts",
  "EcommerceCartPage",
  "EcommerceCartDrawer",
  "EcommerceMiniCart",
  "EcommerceCheckoutPage",
  "EcommerceOrderConfirmation",
  "EcommerceCategoryNav",
  "EcommerceSearchBar",
  "EcommerceFilterSidebar",
  "EcommerceBreadcrumb",
  "EcommerceProductSort",
  "EcommerceQuoteRequest",
  "EcommerceQuoteList",
  "EcommerceQuoteDetail",
  "EcommerceReviewForm",
  "EcommerceReviewList",
  "ProductDetailBlock",
  "CategoryHeroBlock",
];

if (MODULE_TYPES.includes(type)) {
  return {
    ...props,
    maxWidth: props.maxWidth || "1280px",
    containerClassName: props.containerClassName || "max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8",
    sectionPaddingY: props.sectionPaddingY || "py-12 md:py-16",
    sectionPaddingX: props.sectionPaddingX || "px-4 sm:px-6 lg:px-8",
  };
}
```

### 13.4 AI Metadata (component-metadata.ts L1019–L1091)

Only **6 legacy entries** exist:

| Type | Keywords | Category |
|---|---|---|
| `ProductGrid` | products, shop, store, catalog | ecommerce |
| `ProductCard` | product, item, card | ecommerce |
| `ProductCategories` | categories, collections, departments | ecommerce |
| `CartSummary` | cart, basket, checkout, summary | ecommerce |
| `FeaturedProducts` | featured, popular, bestsellers | ecommerce |
| `CartIcon` | cart, icon, basket | ecommerce |

**These use old type names** (`ProductGrid` not `EcommerceProductGrid`, `CartSummary` not `EcommerceMiniCart`). The AI may generate these old names, which then get mapped via `typeMap` — but the metadata descriptions are thin.

**Missing metadata for:** EcommerceProductCatalog, EcommerceCartPage, EcommerceCartDrawer, EcommerceCheckoutPage, EcommerceOrderConfirmation, EcommerceOrderTracking, EcommerceCategoryNav, EcommerceSearchBar, EcommerceFilterSidebar, EcommerceBreadcrumb, EcommerceProductSort, EcommerceQuoteRequest, EcommerceQuoteList, EcommerceQuoteDetail, EcommerceReviewForm, EcommerceReviewList, ProductDetailBlock, CategoryHeroBlock, EcommerceCategoriesPage (19 components).

### 13.5 Mismatches & Gaps Summary

| Issue | Details | Fix |
|---|---|---|
| `KNOWN_REGISTRY_TYPES` missing 2 types | `EcommerceOrderTracking`, `EcommerceCategoriesPage` not registered | Add to Set at L885 |
| `MODULE_TYPES` missing 2 types | Same — `EcommerceOrderTracking`, `EcommerceCategoriesPage` not in containment array | Add to array at L2476 |
| Metadata stale type names | 6 entries use old names (ProductGrid, CartSummary) | Update or add canonical names |
| 19 components missing metadata | No AI discovery metadata for most module components | Add entries to component-metadata.ts |
| No per-component normalizers | Generic MODULE_TYPES handler only adds containment | Add normalizers if field name mapping is needed |
| `EcommerceOrderTracking` typeMap aliases missing | No alias entries for `OrderTracking` → `EcommerceOrderTracking` | Add typeMap entry |
| `EcommerceCategoriesPage` typeMap aliases missing | No alias entries for `CategoriesPage` → `EcommerceCategoriesPage` | Add typeMap entry |

---

## 14. Mobile Components Architecture

### 14.1 Overview

22 dedicated mobile component files in `studio/components/mobile/` (plus index.ts):

| Component | Desktop Counterpart | Purpose |
|---|---|---|
| `MobileProductCard` | `ProductCardBlock` | Touch-optimised product card |
| `MobileProductGrid` | `ProductGridBlock` | Mobile-responsive grid |
| `MobileProductDetail` | `ProductDetailBlock` | Swipeable gallery, bottom-sheet actions |
| `MobileQuickView` | `ProductQuickView` | Full-screen mobile quick view |
| `MobileImageGallery` | `ProductImageGallery` | Pinch-to-zoom, swipe gallery |
| `MobileCartDrawer` | `CartDrawerBlock` | Bottom-sheet cart |
| `MobileMiniCart` | `MiniCartBlock` | Floating cart button |
| `SwipeableCartItem` | `CartItemCard` | Swipe-to-delete cart item |
| `MobileCheckout` | `CheckoutPageBlock` | Mobile-optimised checkout |
| `MobileAddressForm` | `AddressForm` | Mobile address entry |
| `MobilePaymentSelector` | `PaymentMethodSelector` | Mobile payment picker |
| `MobileFilterDrawer` | `FilterSidebarBlock` | Bottom-sheet filters |
| `MobileCategoryNav` | `CategoryNavBlock` | Swipeable category tabs |
| `MobileSearchBar` | `SearchBarBlock` | Full-screen search overlay |
| `MobileVariantSelector` | — | Touch variant picker (colour swatches) |
| `MobileBottomNav` | — | Sticky bottom navigation bar |
| `MobileShareButton` | — | Native share sheet integration |
| `MobileSizeGuide` | — | Size guide popup |
| `MobileStockAlert` | — | Stock notification signup |
| `MobileCompare` | — | Side-by-side product comparison |
| `MobileNotifications` | — | Push notification preferences |
| `MobileReviewForm` | `ReviewFormBlock` | Mobile review submission |
| `MobileWishlist` | — | Mobile wishlist view |
| `MobileOrderStatus` | `OrderTrackingBlock` | Mobile order tracking |

### 14.2 Responsive Detection

Components use `useMobile()` hook to detect mobile viewport:
```typescript
const isMobile = useMobile(); // boolean
```

Some components (CheckoutPageBlock, ProductDetailBlock) switch to mobile component variants:
```typescript
if (isMobile) return <MobileCheckoutPage {...mobileProps} />;
```

### 14.3 Touch Gestures

Mobile components use custom hooks:
- `useSwipeGesture()` — swipe detection for cart items, galleries
- `useHapticFeedback()` — vibration on add-to-cart, wishlist toggle
- `useKeyboardVisible()` — keyboard avoidance for checkout forms

---

## 15. Data Hooks & Context System

### 15.1 Hook Inventory

| Hook | File | Purpose | Returns |
|---|---|---|---|
| `useStorefront()` | `context/storefront-context.tsx` | Site settings, currency, formatPrice | `StorefrontContextValue` |
| `useStorefrontProducts()` | `hooks/useStorefrontProducts.ts` | Product list with pagination/filters | `{ products, total, isLoading }` |
| `useStorefrontProduct()` | `hooks/useStorefrontProduct.ts` | Single product with variants | `{ product, variants, isLoading }` |
| `useStorefrontCart()` | `hooks/useStorefrontCart.ts` | Cart CRUD operations | `{ cart, itemCount, addItem, ... }` |
| `useStorefrontCategories()` | `hooks/useStorefrontCategories.ts` | Category tree | `{ categories, buildTree }` |
| `useStorefrontSearch()` | `hooks/useStorefrontSearch.ts` | Search autocomplete | `{ results, suggestions }` |
| `useStorefrontReviews()` | `hooks/useStorefrontReviews.ts` | Product reviews CRUD | `{ reviews, stats, submitReview }` |
| `useStorefrontWishlist()` | `hooks/useStorefrontWishlist.ts` | Wishlist (localStorage) | `{ items, toggle, isWishlisted }` |
| `useStorefrontAuth()` | `context/storefront-auth-context.tsx` | Customer login/signup | `{ user, login, register }` |
| `useCheckout()` | `hooks/useCheckout.ts` | Multi-step checkout state | `{ step, shippingAddress, ... }` |
| `useQuotations()` | `hooks/useQuotations.ts` | Quotation CRUD | `{ quotes, createQuote, ... }` |
| `useProductFilters()` | `hooks/useProductFilters.ts` | Filter state management | `{ filters, setFilter, clearAll }` |
| `useRecentlyViewed()` | `hooks/useRecentlyViewed.ts` | Recently viewed (localStorage) | `{ items, addItem }` |
| `useMobile()` | `hooks/useMobile.ts` | Mobile viewport detection | `boolean` |
| `useHapticFeedback()` | `hooks/useHapticFeedback.ts` | Haptic vibration | `{ triggerFeedback }` |
| `useSwipeGesture()` | `hooks/useSwipeGesture.ts` | Swipe detection | `{ onSwipeLeft, onSwipeRight }` |
| `useKeyboardVisible()` | `hooks/useKeyboardVisible.ts` | Mobile keyboard detection | `boolean` |

### 15.2 Server Actions

| Action File | Functions | Scope |
|---|---|---|
| `ecommerce-actions.ts` (1,961 lines) | Product CRUD, category CRUD, cart ops, order create, discount management, settings, analytics | Admin (RLS enforced) |
| `public-ecommerce-actions.ts` (821 lines) | `getPublicProducts`, `getPublicProduct`, `getPublicCategories`, `getPublicEcommerceSettings` | Public (uses admin client to bypass RLS) |
| `order-actions.ts` (757 lines) | Order detail, status update, shipments, refunds, bulk actions | Admin |
| `quote-actions.ts` (1,375 lines) | Quote CRUD, items, calculations, numbering | Admin + Public |
| `customer-actions.ts` (897 lines) | Customer CRUD, groups, addresses | Admin |
| `analytics-actions.ts` (1,206 lines) | Sales analytics, product performance, customer insights | Admin |
| `review-actions.ts` (~350 lines) | Review CRUD, moderation | Admin + Public |

### 15.3 Price Handling — The Critical Rule

> **ALL monetary values are stored as CENTS (integers).**

| Operation | Code | Example |
|---|---|---|
| Store price | `Math.round(parseFloat(input) * 100)` | "$25.00" → `2500` |
| Display price | `formatPrice(cents)` → `formatCurrency(cents / 100, currency)` | `2500` → "K25.00" |
| Comparison | Use integer arithmetic only | `2500 > 1000` ✅, not `25.00 > 10.00` ❌ |

This applies to: `base_price`, `compare_at_price`, `variant_price`, cart `subtotal`, cart `total`, order `total_amount`, discount amounts, shipping costs, tax amounts — **everything**.

---

## 16. Registry, Metadata & Converter Alignment

### 16.1 Component Registration Flow

```
studio/index.ts                     module-loader.ts                   componentRegistry
┌──────────────────┐                ┌─────────────────┐                ┌─────────────────┐
│ studioComponents │ ──import()──→  │ processModule   │ ──register()─→ │ .get("Ecommerce │
│ {                │                │ Components()    │                │  ProductGrid")  │
│   EcommerceProduct│                │ - adds module id│                │  → definition   │
│   Grid: {        │                │ - adds category │                │    with render() │
│     ...definition│                │                 │                │                  │
│     render: Block│                │                 │                │                  │
│   }              │                │                 │                │                  │
│ }                │                │                 │                │                  │
└──────────────────┘                └─────────────────┘                └─────────────────┘
```

### 16.2 Definition vs Render Props — Alignment Audit

For e-commerce components, the definition (in `studio/index.ts`) and the render component (in `*.tsx`) **should** have matching field names. Here's the audit:

#### EcommerceCartPage

| Definition Field | Definition Default | Render Prop | Render Default | Match? |
|---|---|---|---|---|
| `showContinueShopping` | `true` | `showClearCart` | `true` | ⚠️ **Name mismatch** — definition has `showContinueShopping`, render has different prop name |
| `showDiscountInput` | `true` | — | — | ⚠️ **Render doesn't read this** — render relies on CartSummaryCard internal logic |
| `checkoutUrl` | `"/checkout"` | `checkoutHref` | `"/checkout"` | ⚠️ **Name mismatch** — `checkoutUrl` vs `checkoutHref` |

#### EcommerceCartDrawer

| Definition Field | Definition Default | Render Prop | Render Default | Match? |
|---|---|---|---|---|
| `position` | `"right"` | `side` | `"right"` | ⚠️ **Name mismatch** — `position` vs `side` |

#### EcommerceMiniCart

| Definition Field | Definition Default | Render Prop | Render Default | Match? |
|---|---|---|---|---|
| `position` | `"top-right"` | — | — | ⚠️ **Render doesn't read `position`** — MiniCartBlock uses `align` prop instead |
| `showItemCount` | `true` | — | — | ⚠️ **Render doesn't read this** — always shows badge |

#### EcommerceCheckoutPage

| Definition Field | Render Prop | Match? |
|---|---|---|
| `enableGuestCheckout` | — | ⚠️ **Not consumed** — render doesn't gate guest checkout |
| `showOrderSummary` | — | ⚠️ **Not consumed** — always shows summary |

#### EcommerceOrderConfirmation

| Definition Field | Render Prop | Match? |
|---|---|---|
| `showContinueShopping` | `shopLink` | ✅ Indirect — shows continue shopping if shopLink provided |

#### EcommerceOrderTracking

| Definition Field | Render Prop | Match? |
|---|---|---|
| `showRecentOrder` | — | ⚠️ **Not consumed** — always checks localStorage |

#### EcommerceCategoryNav — ✅ Good alignment
All definition fields match render props.

#### EcommerceSearchBar — ✅ Good alignment
Definition fields map to render props correctly.

#### EcommerceFilterSidebar — ✅ Good alignment
Definition fields match render props.

#### EcommerceBreadcrumb — ✅ Good alignment

#### EcommerceProductSort — ⚠️ Partial
| Definition Field | Render Prop | Match? |
|---|---|---|
| `defaultSort` | `value` | ⚠️ **Name mismatch** — `defaultSort` vs `value` |

#### EcommerceQuoteRequest — ✅ Good alignment

#### EcommerceQuoteList — ✅ Good alignment

#### EcommerceQuoteDetail — ✅ (no studio fields)

### 16.3 Mismatch Summary

| Component | Mismatches | Severity |
|---|---|---|
| EcommerceCartPage | 3 (showContinueShopping, showDiscountInput, checkoutUrl→checkoutHref) | Medium — cart page works but studio fields silently ignored |
| EcommerceCartDrawer | 1 (position→side) | Medium — position field maps to wrong prop |
| EcommerceMiniCart | 2 (position not read, showItemCount not read) | Medium — fields do nothing |
| EcommerceCheckoutPage | 2 (enableGuestCheckout, showOrderSummary) | Low — features always on anyway |
| EcommerceOrderTracking | 1 (showRecentOrder) | Low — feature always on |
| EcommerceProductSort | 1 (defaultSort→value) | Medium — initial sort may not apply |
| **Total** | **10 mismatches** | **Fix by aligning definition fields with render prop names** |

---

## 17. Hardcoded Colour Inventory

### 17.1 Summary by Category

| Category | Files | Hardcoded Instances | `dark:` Classes | Hex Literals |
|---|---|---|---|---|
| Studio components | ~30 files | 200+ | 120+ | 20+ |
| Mobile components | ~22 files | 150+ | 20+ | 30+ |
| Dashboard components | ~80 files | 300+ | 50+ | 10+ |
| Widgets | 1 file | 50+ | 2 | 16 |
| **Total** | **~133 files** | **700+** | **192+** | **76+** |

### 17.2 Most Critical Files (P0 — customer-facing)

| File | Hardcoded Colours | Key Issues |
|---|---|---|
| `product-card-block.tsx` | `bg-red-500`, `bg-orange-500`, `text-red-500`, `bg-white/90` | Sale badge, pre-order, wishlist |
| `ProductDetailBlock.tsx` | `bg-gray-100`, `bg-black`, `bg-white`, `fill-yellow-400`, `text-green-600`, `text-red-500`, `fill-red-500` | Gallery background, stars, stock, wishlist |
| `ProductStockBadge.tsx` | 12 `dark:` + 8 semantic | In-stock green, low-stock amber, out red, pre-order blue |
| `ProductPriceDisplay.tsx` | `text-red-600 dark:text-red-500` | Discount price colour |
| `CartDiscountInput.tsx` | `bg-green-50`, `text-green-600`, `border-green-200` | Success state |
| `OrderConfirmationBlock.tsx` | `bg-green-100`, `text-green-600` | Success circle |
| `CheckoutPageBlock.tsx` | `bg-green-100`, `text-green-600` | Success indicator |
| `QuoteRequestBlock.tsx` | 16 `text-gray-*` + 7 `bg-gray-*` + 10 `border/text-red-*` | Pervasive gray palette |
| `QuoteStatusBadge.tsx` | 21 hardcoded status→colour values | 9 statuses × 3 colour props |
| `ReviewFormBlock.tsx` | 5 `dark:` + 7 semantic | Stars, success, errors |
| `ReviewListBlock.tsx` | `bg-amber-400`, `fill-amber-400`, `text-green-600` | Rating bars, verified badge |
| `MobileQuickView.tsx` | 11 hex literals + 4 semantic | Colour swatches, wishlist, pre-order |
| `MobileVariantSelector.tsx` | 16 hex literals | Full colour→hex swatch map |

### 17.3 Acceptable Hardcoded Colours (No Change Needed)

| Pattern | Where | Why Acceptable |
|---|---|---|
| `fill-amber-400 text-amber-400` | Star ratings | Universal convention |
| `text-green-600 dark:text-green-400` | Stock "In Stock" | Semantic status colour |
| `text-red-600 dark:text-red-400` | Stock "Out of Stock" | Semantic status colour |
| `text-amber-600 dark:text-amber-400` | Stock "Low Stock" | Semantic status colour |
| Chart hex colours | Recharts components | Library requires hex |
| Colour swatch hex | Variant selectors | Literal product colours |

---

## 18. Implementation Phases

### Phase 1: Brand Colour Pipeline (P0)

| Task | File | Change |
|---|---|---|
| 1.1 | `storefront-context.tsx` | Expose `primaryColor`, `accentColor`, `surfaceColor` from `settings.primary_color` |
| 1.2 | `storefront-context.tsx` | Inject CSS variables: `--storefront-primary`, `--storefront-primary-hover`, `--storefront-surface`, etc. |
| 1.3 | All 23 studio components | Replace hardcoded `bg-blue-600` → `var(--storefront-primary)` for CTA buttons |
| 1.4 | All utility sub-components | Same — replace brand-sensitive hardcoded colours |

### Phase 2: Definition-Render Alignment (P1)

| Task | File | Change |
|---|---|---|
| 2.1 | `studio/index.ts` L158–L230 | Fix CartPage: `checkoutUrl` → `checkoutHref`, add missing fields |
| 2.2 | `studio/index.ts` L190 | Fix CartDrawer: `position` → `side` |
| 2.3 | `studio/index.ts` L206 | Fix MiniCart: `position` → `align`, `showItemCount` → implement in render |
| 2.4 | `studio/index.ts` L237 | Fix CheckoutPage: implement `enableGuestCheckout` and `showOrderSummary` |
| 2.5 | `studio/index.ts` L416 | Fix ProductSort: `defaultSort` → `value` |
| 2.6 | Component renders | Where needed, add prop reads for missing fields |

### Phase 3: Converter & Metadata (P1)

| Task | File | Change |
|---|---|---|
| 3.1 | `converter.ts` L885 | Add `EcommerceOrderTracking`, `EcommerceCategoriesPage` to `KNOWN_REGISTRY_TYPES` |
| 3.2 | `converter.ts` L2476 | Add `EcommerceOrderTracking`, `EcommerceCategoriesPage` to `MODULE_TYPES` |
| 3.3 | `converter.ts` L707+ | Add typeMap aliases: `OrderTracking` → `EcommerceOrderTracking`, `CategoriesPage` → `EcommerceCategoriesPage` |
| 3.4 | `component-metadata.ts` | Add 19 missing metadata entries with keywords, descriptions, usageGuidelines |

### Phase 4: Dark Mode Consistency (P2)

| Task | Scope | Change |
|---|---|---|
| 4.1 | All 23 studio components | Audit `dark:` classes — ensure all surface/text/border colours have dark variants |
| 4.2 | All 25 utility components | Same audit |
| 4.3 | 19 mobile components | Same audit |

### Phase 5: Mobile Component Hardcoded Colours (P2)

| Task | File | Change |
|---|---|---|
| 5.1 | `MobileQuickView.tsx` | Replace 11 hex literals with CSS variables or semantic colours |
| 5.2 | `MobileVariantSelector.tsx` | Keep colour swatch hex (acceptable) but brand-ify CTA buttons |
| 5.3 | All mobile components | Replace hardcoded grays with CSS variables |

---

## 19. Testing & Quality Gates

### 19.1 Test Scenarios by Component

| Component | Test | Expected Behaviour |
|---|---|---|
| ProductGrid | Load with `source="featured"` | Shows products from Supabase |
| ProductCard | Click "Add to Cart" | Item appears in cart, count updates |
| ProductCatalog | Apply price filter | Only matching-price products shown |
| FeaturedProducts | Set `displayMode="carousel"` | Shows carousel with arrows/dots |
| CartPage | Remove item | Cart updates, total recalculates |
| CartDrawer | Open/close | Slide animation, correct side |
| CheckoutPage | Complete checkout flow | Order created, redirect to confirmation |
| CategoryNav | Switch variants (tree/grid/list) | Layout changes correctly |
| SearchBar | Type search query | Autocomplete suggestions appear |
| FilterSidebar | Toggle "In Stock Only" | Product list filters |
| QuoteRequest | Submit quote | Success message, quote created |
| ReviewForm | Submit 5-star review | Review appears in list |
| ProductDetail | Select variant | Price/image/stock updates |

### 19.2 Brand Colour Test

| Test | Assertion |
|---|---|
| Set `primary_color` to `#FF6B00` in settings | All CTA buttons, links, active states use orange |
| Set `primary_color` to `#1A1A2E` | Components adjust — no contrast issues |
| Remove `primary_color` | Falls back to default `#3b82f6` (blue-500) |
| Dark mode toggle | All surfaces, text, borders switch appropriately |

### 19.3 AI Designer Test

| Test | Expected |
|---|---|
| AI generates `type: "ProductGrid"` | Maps to `EcommerceProductGrid`, renders product grid |
| AI generates `type: "CartPage"` | Maps to `EcommerceCartPage`, renders cart |
| AI generates `type: "OrderTracking"` | **CURRENTLY FAILS** — not in typeMap. After Phase 3 fix: maps to `EcommerceOrderTracking` |
| AI generates `type: "CategoriesPage"` | **CURRENTLY FAILS** — not in typeMap. After Phase 3 fix: maps to `EcommerceCategoriesPage` |

---

## 20. CRITICAL FOR AI AGENT — Implementation Guard Rails

### 20.0 AI Designer — Complete Studio Fields Quick Reference

> **THIS IS THE MOST IMPORTANT SECTION IN THE DOCUMENT.** When the AI Designer generates page content JSON, it uses these field names and values. Every field listed here is a configurable option in the visual builder. If a field name is wrong, it silently does nothing. Use the **exact field names** below — there is NO per-component normalizer for e-commerce module types.

#### Product Display Components

**EcommerceProductCard** (AI aliases: `ProductCard`)
| Field | Type | Default | Options |
|---|---|---|---|
| `productId` | custom (`ecommerce:product-selector`) | — | Select from catalog |
| `showPrice` | toggle | `true` | |
| `showRating` | toggle | `true` | |
| `showButton` | toggle | `true` | |
| `showWishlistButton` | toggle | `true` | |
| `showQuickView` | toggle | `false` | |
| `showStockBadge` | toggle | `false` | |
| `showSaleBadge` | toggle | `true` | |
| `buttonText` | text | `"Add to Cart"` | |
| `variant` | select | `"card"` | `card`, `horizontal`, `minimal`, `compact` |
| `imageAspect` | select | `"square"` | `square`, `portrait`, `landscape` |
| `hoverEffect` | select | `"zoom"` | `none`, `zoom`, `lift`, `shadow` |
| `padding` | responsive text | `"16px"` | |
| `borderRadius` | responsive text | `"8px"` | |

**EcommerceProductGrid** (AI aliases: `ProductGrid`)
| Field | Type | Default | Options |
|---|---|---|---|
| `columns` | responsive number | `{mobile:2, tablet:3, desktop:4}` | min 1, max 6 |
| `gap` | responsive text | `"16px"` | |
| `source` | select | `"featured"` | `featured`, `new`, `sale`, `category`, `manual` |
| `categoryId` | custom (`ecommerce:category-selector`) | — | Select from categories |
| `limit` | number | `8` | min 1, max 24 |
| `showPrice` | toggle | `true` | |
| `showRating` | toggle | `true` | |
| `cardVariant` | select | `"card"` | `card`, `minimal` |

**EcommerceProductCatalog** (AI aliases: `ProductCatalog`)
| Field | Type | Default | Options |
|---|---|---|---|
| `categoryId` | custom (`ecommerce:category-selector`) | — | Select from categories |
| `columns` | responsive number | `{mobile:2, tablet:3, desktop:4}` | |
| `productsPerPage` | number | `12` | |
| `showFilters` | toggle | `true` | |
| `showSorting` | toggle | `true` | |
| `showPagination` | toggle | `true` | |
| `showSearch` | toggle | `true` | |
| `showResultCount` | toggle | `true` | |
| `cardVariant` | select | `"card"` | `card`, `minimal`, `compact` |
| `showPrice` | toggle | `true` | |
| `showRating` | toggle | `true` | |
| `showAddToCart` | toggle | `true` | |
| `showWishlist` | toggle | `true` | |
| `showQuickView` | toggle | `false` | |
| `gap` | responsive text | `"16px"` | |
| `padding` | responsive text | `"16px"` | |

**EcommerceFeaturedProducts** (AI aliases: `FeaturedProducts`)
| Field | Type | Default | Options |
|---|---|---|---|
| `productSource` | select | `"featured"` | `featured`, `new`, `bestselling`, `sale`, `category`, `manual` |
| `categoryId` | custom (`ecommerce:category-selector`) | — | Select from categories |
| `limit` | number | `8` | |
| `title` | text | — | Section heading |
| `subtitle` | text | — | Section subtitle |
| `showTitle` | toggle | `true` | |
| `showViewAll` | toggle | `true` | |
| `viewAllLink` | text | — | View all URL |
| `displayMode` | select | `"carousel"` | `carousel`, `scroll`, `hero-grid` |
| `columns` | responsive number | `{mobile:2, tablet:3, desktop:4}` | |
| `cardVariant` | select | `"card"` | `card`, `minimal`, `compact` |
| `autoPlay` | toggle | `false` | |
| `autoPlayInterval` | number | `5000` | Milliseconds |
| `showNavigation` | toggle | `true` | Carousel arrows |
| `showDots` | toggle | `true` | Carousel dots |
| `showPrice` | toggle | `true` | |
| `showRating` | toggle | `true` | |
| `showAddToCart` | toggle | `true` | |
| `showWishlist` | toggle | `true` | |
| `gap` | responsive text | `"16px"` | |
| `padding` | responsive text | `"16px"` | |

#### Cart Components

**EcommerceCartPage** (AI aliases: `CartItems`, `CartPage`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showContinueShopping` | toggle | `true` | |
| `showDiscountInput` | toggle | `true` | |
| `checkoutUrl` | text | `"/checkout"` | ⚠️ Render reads `checkoutHref` — field is silently ignored |

**EcommerceCartDrawer** (AI aliases: `CartDrawer`)
| Field | Type | Default | Options |
|---|---|---|---|
| `position` | select | `"right"` | `right`, `left` — ⚠️ Render reads `side` — field is silently ignored |

**EcommerceMiniCart** (AI aliases: `CartSummary`, `MiniCart`)
| Field | Type | Default | Options |
|---|---|---|---|
| `position` | select | `"top-right"` | `top-right`, `bottom-right` — ⚠️ Render uses `align` — field is silently ignored |
| `showItemCount` | toggle | `true` | ⚠️ Not consumed by render component |

#### Checkout Components

**EcommerceCheckoutPage** (AI aliases: `CheckoutForm`, `CheckoutPage`)
| Field | Type | Default | Options |
|---|---|---|---|
| `enableGuestCheckout` | toggle | `true` | ⚠️ Not consumed by render component |
| `showOrderSummary` | toggle | `true` | ⚠️ Not consumed by render component |

**EcommerceOrderConfirmation** (AI aliases: `OrderConfirmation`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showContinueShopping` | toggle | `true` | |

**EcommerceOrderTracking** (AI aliases: ⚠️ NONE — missing from typeMap + KNOWN_REGISTRY_TYPES)
| Field | Type | Default | Options |
|---|---|---|---|
| `showRecentOrder` | toggle | `true` | ⚠️ Not consumed by render component |

#### Navigation & Discovery Components

**EcommerceCategoryNav** (AI aliases: `CategoryNav`, `CategoryNavigation`)
| Field | Type | Default | Options |
|---|---|---|---|
| `variant` | select | `"tree"` | `tree`, `grid`, `list`, `cards` |
| `showProductCount` | toggle | `true` | |
| `showImages` | toggle | `true` | |
| `showSubcategories` | toggle | `true` | |
| `title` | text | `"Categories"` | |
| `showTitle` | toggle | `true` | |

**EcommerceSearchBar** (AI aliases: `ProductSearch`, `SearchBar`)
| Field | Type | Default | Options |
|---|---|---|---|
| `placeholder` | text | `"Search products..."` | |
| `showSuggestions` | toggle | `true` | |
| `maxSuggestions` | number | `5` | |

**EcommerceFilterSidebar** (AI aliases: `FilterSidebar`, `ProductFilters`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showPriceFilter` | toggle | `true` | |
| `showCategoryFilter` | toggle | `true` | |
| `showStockFilter` | toggle | `true` | |
| `collapsible` | toggle | `true` | |

**EcommerceBreadcrumb** (AI aliases: `Breadcrumbs`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showHome` | toggle | `true` | |
| `separator` | select | `"chevron"` | `chevron`, `slash`, `arrow` |

**EcommerceProductSort** (AI aliases: `ProductSort`, `SortBar`)
| Field | Type | Default | Options |
|---|---|---|---|
| `defaultSort` | select | `"newest"` | `newest`, `price-asc`, `price-desc`, `name-asc` — ⚠️ Render reads `value` — field is silently ignored |

#### Quotation Components

**EcommerceQuoteRequest** (AI aliases: `QuoteRequest`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showNotes` | toggle | `true` | |
| `requirePhone` | toggle | `false` | |

**EcommerceQuoteList** (AI aliases: `QuoteList`)
| Field | Type | Default | Options |
|---|---|---|---|
| `variant` | select | `"card"` | `card`, `list`, `table` |

**EcommerceQuoteDetail** (AI aliases: `QuoteDetail`)
| Field | Type | Default | Options |
|---|---|---|---|
| *(no studio fields)* | — | — | Component auto-loads from URL params |

#### Review Components

**EcommerceReviewForm** (AI aliases: `ReviewForm`)
| Field | Type | Default | Options |
|---|---|---|---|
| `requireEmail` | toggle | `false` | |

**EcommerceReviewList** (AI aliases: `ReviewList`, `ProductReviews`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showDistribution` | toggle | `true` | Show rating bar chart |
| `pageSize` | number | `10` | Reviews per page |

#### Dynamic Page Components

**ProductDetailBlock** (AI aliases: `ProductDetail`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showGallery` | toggle | `true` | |
| `showVariants` | toggle | `true` | |
| `showQuantity` | toggle | `true` | |
| `showAddToCart` | toggle | `true` | |
| `showWishlist` | toggle | `true` | |
| `showShare` | toggle | `false` | |
| `showDescription` | toggle | `true` | |
| `showSpecifications` | toggle | `true` | |
| `showReviews` | toggle | `true` | |
| `galleryPosition` | select | `"left"` | `left`, `right` |
| `stickyAddToCart` | toggle | `true` | |

**CategoryHeroBlock** (AI aliases: `CategoryHero`)
| Field | Type | Default | Options |
|---|---|---|---|
| `showImage` | toggle | `true` | |
| `showDescription` | toggle | `true` | |
| `showProductCount` | toggle | `true` | |
| `overlayOpacity` | number | `0.5` | 0–1 range |
| `minHeight` | text | `"200px"` | CSS value |

**EcommerceCategoriesPage** (AI aliases: ⚠️ NONE — missing from typeMap + KNOWN_REGISTRY_TYPES)
| Field | Type | Default | Options |
|---|---|---|---|
| `title` | text | `"Shop by Category"` | |
| `subtitle` | text | `""` | |
| `showSearch` | toggle | `true` | |
| `showSubcategories` | toggle | `true` | |
| `showProductCount` | toggle | `true` | |
| `showImages` | toggle | `true` | |
| `showDescription` | toggle | `true` | |
| `layout` | select | `"grid"` | `grid`, `list` |
| `columns` | select | `"3"` | `"2"`, `"3"`, `"4"` (string values, not numbers) |

#### ⚠️ Definition→Render Mismatches Summary

These studio definition fields exist but are **silently ignored** by the render components. The AI can set these values — they will be saved in the page JSONB — but the component won't read them:

| Component | Definition Field | Render Reads | Issue |
|---|---|---|---|
| EcommerceCartPage | `checkoutUrl` | `checkoutHref` | Name mismatch |
| EcommerceCartDrawer | `position` | `side` | Name mismatch |
| EcommerceMiniCart | `position` | `align` | Name mismatch |
| EcommerceMiniCart | `showItemCount` | *(nothing)* | Not consumed |
| EcommerceCheckoutPage | `enableGuestCheckout` | *(nothing)* | Not consumed |
| EcommerceCheckoutPage | `showOrderSummary` | *(nothing)* | Not consumed |
| EcommerceOrderTracking | `showRecentOrder` | *(nothing)* | Not consumed |
| EcommerceProductSort | `defaultSort` | `value` | Name mismatch |

### 20.1 Do NOT Touch List

| File/Area | Reason |
|---|---|
| `public-ecommerce-actions.ts` | Public server actions bypass RLS by design — do not add auth checks |
| `useCheckout.ts` (557 lines) | Complex multi-step state machine — changing step logic breaks checkout |
| `manifest.ts` (573 lines) | Module registration — schema changes require database migration |
| Cart session management | Session-based guest carts in `useStorefrontCart` — changing storage breaks existing carts |
| Price arithmetic | ALL values in cents — NEVER convert to dollars for calculation |

### 20.2 Definition Field → Render Prop Mapping Rules

When fixing studio definition fields (Phase 2):

1. **The render component is authoritative** — its props interface defines what actually works
2. **The definition field name should match the render prop name** — or the field does nothing
3. **If you change a definition field name**, you must update any saved page content that uses the old name (migration)
4. **Prefer changing the definition to match the render** — it's simpler than changing the render

### 20.3 Module Loading Constraints

1. E-commerce components are **only available when the module is installed** on a site
2. `module-loader.ts` skips modules with `status !== "active"`
3. Components are registered with `source: "module"` in the registry — not `source: "core"`
4. Custom fields are prefixed: `ecommerce:product-selector`, `ecommerce:category-selector`

### 20.4 Responsive Value Pattern

Many e-commerce components use `ResponsiveValue<T>`:
```typescript
type ResponsiveValue<T> = T | {
  mobile?: T;
  tablet?: T;
  desktop?: T;
}
```

When the AI sends a single value (e.g., `columns: 4`), it should be acceptable — components handle both single values and responsive objects. Do NOT force responsive objects if the component handles primitives.

### 20.5 StorefrontWidget vs Studio Components

`StorefrontWidget.tsx` (1,514 lines) is a **separate, self-contained embeddable widget** — it is NOT a studio component. It has its own cart context, CSS isolation, and renders without the visual builder. Do NOT confuse it with studio block components. The widget is the only component that currently accepts `primaryColor` as a prop.

### 20.6 Implementation Order

```
1. Brand Colour Pipeline (Phase 1) — MUST BE FIRST
   StorefrontContext → CSS variables → all components read variables
   Without this, all other changes still leave stores looking identical

2. Converter & Metadata (Phase 3) — enables AI to use all components
   Missing KNOWN_REGISTRY_TYPES entries mean AI-generated pages break

3. Definition-Render Alignment (Phase 2) — makes studio editor work
   Without this, studio field changes silently do nothing

4. Dark Mode (Phase 4) — polish
5. Mobile Colours (Phase 5) — polish
```

### 20.7 File Paths — Quick Reference

All paths relative to `src/modules/ecommerce/`:

| Category | Path |
|---|---|
| Studio index | `studio/index.ts` |
| Studio components | `studio/components/*.tsx` |
| Studio fields | `studio/fields/*.tsx` |
| Mobile components | `studio/components/mobile/*.tsx` |
| Data hooks | `hooks/*.ts` |
| Context | `context/storefront-context.tsx` |
| Server actions | `actions/*.ts` |
| Types | `types/ecommerce-types.ts` |
| Utilities | `lib/*.ts` |
| Page templates | `lib/page-templates.ts` |
| Widget | `widgets/StorefrontWidget.tsx` |
| Manifest | `manifest.ts` |

---

*Document version: 1.1 — Verified, corrected, and enriched from live codebase audit*
*Section 20.0 AI Quick Reference: all 23 components' studio fields verified against source*
*Component counts verified against `studio/index.ts` studioComponents export (23 components)*
*Line numbers verified against workspace files*
*TypeMap entries verified against converter.ts L707–L758 (21 registered, 2 missing)*
*KNOWN_REGISTRY_TYPES verified against converter.ts L885–L907 (21 registered, 2 missing)*
*MODULE_TYPES verified against converter.ts L2476–L2508 (21 registered, 2 missing)*
*Definition→Render mismatches documented: 8 silently ignored fields across 6 components*

# AI AGENT PROMPT: Generate WAVE 3 E-Commerce Phase Documents

---

## YOUR TASK

You are a senior software architect creating detailed PHASE implementation documents for the DRAMAC CMS E-Commerce Module. Your job is to generate **WAVE 3: Studio Components - Real Data Integration** - consisting of **6 comprehensive PHASE documents** that another AI agent will use to implement the code.

**IMPORTANT**: Wave 1 (Dashboard Foundation) and Wave 2 (Quotation System) have been completed. The following already exists:

### Wave 1 ✅ Complete:
- ECOM-01 ✅ Dashboard Redesign & Navigation (sidebar, widgets, command palette)
- ECOM-02 ✅ Product Management Enhancement (TanStack Table, filters, bulk actions, import/export)
- ECOM-03 ✅ Settings & Configuration Center (9 settings tabs, server actions)
- ECOM-04 ✅ Order Management Enhancement (order detail dialog, timeline, refunds, invoices)
- ECOM-05 ✅ Customer Management (customer list, detail dialog, groups, notes)

### Wave 2 ✅ Complete:
- ECOM-10 ✅ Quotation Database Schema & Types
- ECOM-11A ✅ Quote Server Actions
- ECOM-11B ✅ Quote UI Components
- ECOM-12 ✅ Quote Workflow & Customer Portal
- ECOM-13 ✅ Quote Templates & Automation

---

## PHASES TO CREATE

Generate the following 6 PHASE documents:

| Phase | Title | Priority | Est. Hours |
|-------|-------|----------|------------|
| **PHASE-ECOM-20** | Core Data Hooks & Context | 🔴 CRITICAL | 6-8 |
| **PHASE-ECOM-21** | Product Display Components | 🔴 CRITICAL | 10-12 |
| **PHASE-ECOM-22** | Cart Components | 🔴 CRITICAL | 10-12 |
| **PHASE-ECOM-23** | Checkout Components | 🔴 CRITICAL | 12-14 |
| **PHASE-ECOM-24** | Navigation & Discovery Components | 🟠 HIGH | 8-10 |
| **PHASE-ECOM-25** | Quotation Components (Frontend) | 🟠 HIGH | 6-8 |

---

## EXISTING CODE CONTEXT

### Current E-Commerce Module Structure (After Wave 1 & 2)
```
src/modules/ecommerce/
├── actions/
│   ├── customer-actions.ts      # ✅ Customer CRUD
│   ├── dashboard-actions.ts     # ✅ Dashboard stats & search
│   ├── ecommerce-actions.ts     # ✅ Products, orders, categories, cart (1800+ lines)
│   ├── order-actions.ts         # ✅ Order management
│   ├── product-import-export.ts # ✅ Import/export/bulk ops
│   ├── quote-actions.ts         # ✅ Quote CRUD
│   ├── quote-template-actions.ts # ✅ Quote templates
│   ├── quote-workflow-actions.ts # ✅ Quote workflow
│   └── settings-actions.ts      # ✅ Settings CRUD
├── components/
│   ├── bulk/                    # ✅ Bulk actions toolbar
│   ├── customers/               # ✅ Customer table, detail dialog
│   ├── dialogs/                 # ✅ Product, order, import dialogs
│   ├── filters/                 # ✅ Product filters
│   ├── layout/                  # ✅ Sidebar, header
│   ├── orders/                  # ✅ Order detail, timeline, refund
│   ├── portal/                  # ✅ Customer quote portal
│   ├── quotes/                  # ✅ Quote builder, templates
│   ├── settings/                # ✅ 9 settings components
│   ├── tables/                  # ✅ Product data table
│   ├── views/                   # ✅ Home, products, orders, customers, categories, discounts, analytics, settings, quotes
│   ├── widgets/                 # ✅ Stats cards, recent orders, low stock, activity
│   ├── command-palette.tsx      # ✅ Cmd+K search
│   └── ecommerce-dashboard.tsx  # ✅ Main dashboard with sidebar
├── context/
│   └── ecommerce-context.tsx    # ✅ Provider pattern with useProducts, useOrders, etc.
├── lib/
│   ├── settings-utils.ts        # ✅ Pure utility functions
│   ├── quote-automation.ts      # ✅ Quote expiration/reminders
│   └── quote-analytics.ts       # ✅ Quote performance analytics
├── studio/
│   ├── components/
│   │   ├── product-card-block.tsx   # ⚠️ Exists but uses DEMO data
│   │   └── product-grid-block.tsx   # ⚠️ Exists but uses DEMO data
│   ├── fields/
│   │   ├── product-selector-field.tsx  # ✅ Product selector
│   │   └── category-selector-field.tsx # ✅ Category selector
│   └── index.ts                 # ✅ Module studio exports
├── widgets/
│   └── StorefrontWidget.tsx     # ✅ CartProvider + useCart (1500+ lines)
├── types/
│   └── ecommerce-types.ts       # ✅ All types (1950+ lines)
└── index.ts                     # ✅ Module exports
```

### CRITICAL: Existing Cart & Checkout Infrastructure

The `StorefrontWidget.tsx` (1500+ lines) already has:
- `CartProvider` - Cart state management with React Context
- `useCart()` hook - Full cart operations
- `ProductCard` component (internal to widget)
- `CartDrawer`, `CartPage` components (internal to widget)
- `CheckoutPage` component (internal to widget)

**Strategy for Wave 3:** 
1. Extract and refactor the good patterns from StorefrontWidget
2. Create STANDALONE Studio components that use new hooks
3. DO NOT duplicate - reference and extend existing cart actions

### Studio Component Registry Pattern

Components must be registered in the Studio registry:
```typescript
// src/lib/studio/registry/core-components.ts pattern
defineComponent({
  type: "ProductCard",
  label: "Product Card",
  description: "Display a single product",
  category: "ecommerce",
  icon: "ShoppingBag",
  render: ProductCardRender,
  fields: { /* field definitions */ },
  defaultProps: { /* defaults */ },
  ai: {
    description: "Product card showing image, name, price, and add to cart",
    canModify: ["showPrice", "showRating", "buttonText"],
    suggestions: ["Make it minimal", "Add hover effects"]
  }
})
```

### ResponsiveValue Pattern (CRITICAL)

ALL visual props MUST use ResponsiveValue:
```typescript
type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

// Example
interface ProductCardProps {
  padding: ResponsiveValue<"sm" | "md" | "lg">;
  imageAspect: ResponsiveValue<"square" | "portrait" | "landscape">;
  showPrice: ResponsiveValue<boolean>;
}
```

### Existing Server Actions for Frontend

From `ecommerce-actions.ts`:
- `getProducts(siteId, filters, page, limit)` - Product listing
- `getProduct(siteId, id)` - Single product
- `getProductBySlug(siteId, slug)` - Product by slug
- `getCategories(siteId)` - All categories
- `getOrCreateCart(siteId, userId?, sessionId?)` - Cart management
- `addCartItem(cartId, productId, variantId, quantity)` - Add to cart
- `updateCartItemQuantity(cartId, itemId, quantity)` - Update quantity
- `removeCartItem(cartId, itemId)` - Remove item
- `clearCart(cartId)` - Clear cart
- `applyDiscountToCart(cartId, code)` - Apply discount
- `calculateCartTotals(cart, taxRate)` - Calculate totals

---

## DOCUMENT FORMAT REQUIREMENTS

Each PHASE document MUST follow this EXACT structure:

```markdown
# PHASE-ECOM-XX: [Phase Title]

> **Priority**: 🔴 CRITICAL | 🟠 HIGH
> **Estimated Time**: X-Y hours
> **Prerequisites**: [List any prior phases]
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

[2-3 sentences describing what this phase accomplishes]

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code (`src/modules/ecommerce/`)
- [ ] Verify Wave 1 & 2 phases are complete
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

[Diagram or description of how this phase fits into the module]

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `path/to/file.tsx` | Create/Modify | Description |

---

## 📋 Implementation Tasks

### Task X.1: [Task Name]

**File**: `src/modules/ecommerce/path/to/file.tsx`
**Action**: Create | Modify

**Description**: [What this task accomplishes]

```typescript
// COMPLETE implementation code here
// Include ALL imports
// Include ALL TypeScript types
// Include inline comments explaining logic
// This must be copy-paste ready
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] [Specific manual test 1]
- [ ] [Specific manual test 2]
- [ ] Mobile responsive check (Chrome DevTools)

---

## 🔄 Rollback Plan

If issues occur:
1. [Step to revert change 1]
2. [Step to revert change 2]

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add phase completion note
- `progress.md`: Update e-commerce section

---

## ✨ Success Criteria

- [ ] [Specific measurable outcome 1]
- [ ] [Specific measurable outcome 2]
```

---

## CRITICAL REQUIREMENTS FOR ALL PHASES

### 1. Complete, Copy-Paste Ready Code
- Every code block must be COMPLETE - no placeholders
- Include ALL imports
- Include ALL TypeScript types
- Include inline comments

### 2. Follow Existing Patterns
- **Server Actions**: Use `'use server'` directive
- **Utility Functions**: Put in `lib/` folder WITHOUT `'use server'`
- **Table Prefix**: `mod_ecommod01_` for database tables
- **Component Pattern**: Match existing Studio components
- **Hooks Pattern**: Match existing `useProducts`, `useCart` patterns

### 3. Mobile-First Responsive
- Base styles for mobile, breakpoints for larger
- Touch-friendly (min 44px tap targets)
- Use Tailwind responsive classes

### 4. TypeScript Strict Mode
- All types must be defined
- No `any` types unless necessary
- Export types for reuse

### 5. Real Data Integration
All components MUST:
- Fetch REAL product data via hooks
- Handle loading states with skeletons
- Handle error states gracefully
- Support empty states
- Use actual cart actions (not fake)

---

## WAVE 3 PHASE DETAILS

### PHASE-ECOM-20: Core Data Hooks & Context

**Purpose:** Create standalone hooks that can be used across Studio components and pages.

**Must Include:**

**Storefront Hooks (NEW - `src/modules/ecommerce/hooks/`):**
```typescript
// useStorefrontProducts.ts - Fetch products for frontend display
export function useStorefrontProducts(siteId: string, options?: {
  categoryId?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  page?: number;
}) {
  // Returns { products, isLoading, error, pagination, refetch }
}

// useStorefrontProduct.ts - Single product by ID or slug
export function useStorefrontProduct(siteId: string, idOrSlug: string) {
  // Returns { product, variants, options, relatedProducts, isLoading, error }
}

// useStorefrontCategories.ts - Category listing
export function useStorefrontCategories(siteId: string) {
  // Returns { categories, isLoading, error, getCategoryPath }
}

// useStorefrontCart.ts - Cart management (wrapper around existing)
export function useStorefrontCart(siteId: string) {
  // Returns { cart, totals, addItem, updateItem, removeItem, clear, isLoading }
}

// useStorefrontWishlist.ts - Wishlist (localStorage based)
export function useStorefrontWishlist(siteId: string) {
  // Returns { items, addItem, removeItem, isInWishlist, clear }
}

// useStorefrontSearch.ts - Product search with debounce
export function useStorefrontSearch(siteId: string) {
  // Returns { query, setQuery, results, isSearching }
}

// useRecentlyViewed.ts - Track recently viewed products
export function useRecentlyViewed(siteId: string, maxItems?: number) {
  // Returns { products, addProduct, clear }
}
```

**Storefront Context Provider:**
```typescript
// StorefrontProvider.tsx - Wraps all storefront hooks
export function StorefrontProvider({ siteId, children }) {
  // Provides cart, settings, currency, etc. to all children
}
```

**Key Files to Create:**
- `src/modules/ecommerce/hooks/index.ts`
- `src/modules/ecommerce/hooks/useStorefrontProducts.ts`
- `src/modules/ecommerce/hooks/useStorefrontProduct.ts`
- `src/modules/ecommerce/hooks/useStorefrontCategories.ts`
- `src/modules/ecommerce/hooks/useStorefrontCart.ts`
- `src/modules/ecommerce/hooks/useStorefrontWishlist.ts`
- `src/modules/ecommerce/hooks/useStorefrontSearch.ts`
- `src/modules/ecommerce/hooks/useRecentlyViewed.ts`
- `src/modules/ecommerce/context/storefront-context.tsx`

---

### PHASE-ECOM-21: Product Display Components

**Purpose:** Create Studio-compatible product display components with real data.

**Must Include:**

**Enhanced ProductCard (`product-card-block.tsx` - REWRITE):**
- Uses `useStorefrontProduct` or accepts `productId` prop
- Variants: card, horizontal, minimal, overlay
- Shows: Image, name, price, sale badge, rating, add to cart
- Hover effects: Quick view trigger, wishlist button
- Loading skeleton when fetching
- Responsive (mobile-first)

**ProductGrid (`product-grid-block.tsx` - REWRITE):**
- Uses `useStorefrontProducts` hook
- Grid layouts: 2-col mobile, 3-col tablet, 4-col desktop (configurable)
- Filters: Category, price range, stock status
- Sorting: Name, price, date, popularity
- Pagination with load more option
- Empty state component

**NEW Components:**
- `ProductGallery` - Image carousel with zoom, thumbnails
- `ProductDetails` - Full product info (description, specs, meta)
- `ProductPrice` - Price display with currency, sale, variants
- `ProductVariantSelector` - Size, color, custom option pickers
- `ProductRating` - Star display with review count
- `ProductBadge` - Sale, New, Out of Stock badges
- `ProductQuickView` - Modal with quick product view
- `RelatedProducts` - "You might also like" grid
- `RecentlyViewedProducts` - Recently viewed carousel

**Key Files to Create/Modify:**
- `src/modules/ecommerce/studio/components/product-card-block.tsx` (REWRITE)
- `src/modules/ecommerce/studio/components/product-grid-block.tsx` (REWRITE)
- `src/modules/ecommerce/studio/components/product-gallery-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/product-details-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/product-price-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/product-variant-selector-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/product-rating-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/product-badge-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/product-quick-view-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/related-products-block.tsx` (NEW)
- `src/modules/ecommerce/studio/components/recently-viewed-block.tsx` (NEW)
- `src/modules/ecommerce/studio/index.ts` (UPDATE - register new components)

---

### PHASE-ECOM-22: Cart Components

**Purpose:** Create standalone cart components for Studio and pages.

**Must Include:**

**AddToCartButton:**
- Handles variant selection requirement
- Shows quantity picker (optional)
- Disabled when out of stock
- Loading state during add
- Success animation/toast
- Variants: button, icon-only, floating

**CartIcon:**
- Badge with item count
- Opens drawer or navigates to cart
- Animated on item add
- Variants: icon, icon-with-text

**CartDrawer:**
- Slide-out panel from right
- Full cart management (update qty, remove)
- Mini totals display
- Checkout button
- Continue shopping link
- Responsive (full screen on mobile)

**CartPage:**
- Full cart table/list view
- Quantity adjusters
- Remove buttons
- Cart summary sidebar
- Discount code input
- Checkout button
- Empty cart state

**CartItem:**
- Product thumbnail
- Name with variant info
- Quantity adjuster
- Line total
- Remove button

**CartSummary:**
- Subtotal
- Discounts applied
- Shipping estimate
- Tax
- Total
- Promo code input

**CartEmpty:**
- Empty state illustration
- "Start shopping" CTA
- Featured products suggestion

**BuyNowButton:**
- Adds to cart and goes to checkout
- Skips cart for quick purchase

**Key Files to Create:**
- `src/modules/ecommerce/studio/components/add-to-cart-button-block.tsx`
- `src/modules/ecommerce/studio/components/cart-icon-block.tsx`
- `src/modules/ecommerce/studio/components/cart-drawer-block.tsx`
- `src/modules/ecommerce/studio/components/cart-page-block.tsx`
- `src/modules/ecommerce/studio/components/cart-item-block.tsx`
- `src/modules/ecommerce/studio/components/cart-summary-block.tsx`
- `src/modules/ecommerce/studio/components/cart-empty-block.tsx`
- `src/modules/ecommerce/studio/components/buy-now-button-block.tsx`

---

### PHASE-ECOM-23: Checkout Components

**Purpose:** Create checkout flow components.

**Must Include:**

**CheckoutForm (Multi-step or Single Page):**
- Step 1: Customer Info (email, name, phone)
- Step 2: Shipping Address (with autocomplete)
- Step 3: Shipping Method selection
- Step 4: Payment Method selection
- Step 5: Review & Place Order
- Progress indicator
- Validation with Zod
- Mobile-optimized forms

**AddressForm:**
- First/Last name
- Company (optional)
- Address lines 1 & 2
- City, State, Postal Code
- Country dropdown
- Phone
- Save as default option
- Address autocomplete (optional)

**ShippingMethodSelector:**
- List shipping options with prices
- Estimated delivery dates
- Free shipping threshold indicator

**PaymentMethodSelector:**
- Payment provider cards (Flutterwave, Pesapal, Paddle)
- Card icons
- "Pay on delivery" option (if enabled)
- Manual/Bank transfer option (if enabled)

**OrderSummary:**
- Cart items list
- Totals breakdown
- Edit cart link

**OrderConfirmation:**
- Order number display
- Order details summary
- Email confirmation notice
- Continue shopping button
- Track order link

**GuestCheckout:**
- Checkout without account
- Option to create account after order
- Email for order updates

**ExpressCheckout (Optional):**
- Saved payment methods
- One-click reorder

**Key Files to Create:**
- `src/modules/ecommerce/studio/components/checkout-form-block.tsx`
- `src/modules/ecommerce/studio/components/address-form-block.tsx`
- `src/modules/ecommerce/studio/components/shipping-method-selector-block.tsx`
- `src/modules/ecommerce/studio/components/payment-method-selector-block.tsx`
- `src/modules/ecommerce/studio/components/order-summary-block.tsx`
- `src/modules/ecommerce/studio/components/order-confirmation-block.tsx`
- `src/modules/ecommerce/studio/components/guest-checkout-block.tsx`
- `src/modules/ecommerce/actions/checkout-actions.ts` (NEW - checkout flow server actions)

---

### PHASE-ECOM-24: Navigation & Discovery Components

**Purpose:** Product navigation, search, and filtering components.

**Must Include:**

**CategoryNavigation:**
- Horizontal or vertical layout
- Nested categories support
- Active state indication
- Mobile-friendly accordion
- Icons per category (optional)

**ProductSearch:**
- Search input with icon
- Autocomplete dropdown
- Recent searches
- Popular searches
- Instant results preview
- Full search page link

**ProductFilters:**
- Category filter (checkboxes)
- Price range (slider)
- Color swatches
- Size options
- Rating filter
- Stock filter (In Stock only)
- Clear all button
- Mobile: Bottom sheet filter panel

**SortDropdown:**
- Sort options: Newest, Price Low-High, Price High-Low, Most Popular, Best Rating
- Current selection indicator

**Pagination:**
- Page numbers
- Previous/Next buttons
- Items per page selector
- "Showing X-Y of Z results"

**Breadcrumbs:**
- Home > Category > Subcategory > Product
- Linked navigation
- Responsive (truncate on mobile)

**Key Files to Create:**
- `src/modules/ecommerce/studio/components/category-navigation-block.tsx`
- `src/modules/ecommerce/studio/components/product-search-block.tsx`
- `src/modules/ecommerce/studio/components/product-filters-block.tsx`
- `src/modules/ecommerce/studio/components/sort-dropdown-block.tsx`
- `src/modules/ecommerce/studio/components/pagination-block.tsx`
- `src/modules/ecommerce/studio/components/breadcrumbs-block.tsx`

---

### PHASE-ECOM-25: Quotation Components (Frontend)

**Purpose:** Customer-facing quote request components.

**Must Include:**

**RequestQuoteButton:**
- Opens quote form modal
- Can be placed on product or cart
- Variants: button, link, floating

**RequestQuoteForm:**
- Customer info (name, email, phone, company)
- Products/items selection
- Quantities
- Message/requirements textarea
- Preferred delivery date
- Submit with validation
- Success confirmation

**QuoteItemsSelector:**
- Multi-product selection
- Quantity per item
- Notes per item
- Search products
- Category browse

**QuoteSummary:**
- Selected items list
- Quantities
- Not prices (those come in quote)
- Total items count

**MyQuotesPage (Optional):**
- List of customer's quotes
- Status badges
- View quote details
- Accept/Reject actions (from portal)

**Key Files to Create:**
- `src/modules/ecommerce/studio/components/request-quote-button-block.tsx`
- `src/modules/ecommerce/studio/components/request-quote-form-block.tsx`
- `src/modules/ecommerce/studio/components/quote-items-selector-block.tsx`
- `src/modules/ecommerce/studio/components/quote-summary-block.tsx`
- `src/modules/ecommerce/actions/customer-quote-actions.ts` (NEW - customer-facing quote actions)

---

## OUTPUT FORMAT

Generate each phase as a SEPARATE document with clear headers. Output them in order:

1. First output `PHASE-ECOM-20-CORE-HOOKS.md`
2. Then output `PHASE-ECOM-21-PRODUCT-DISPLAY.md`
3. Then output `PHASE-ECOM-22-CART-COMPONENTS.md`
4. Then output `PHASE-ECOM-23-CHECKOUT-COMPONENTS.md`
5. Then output `PHASE-ECOM-24-NAVIGATION-DISCOVERY.md`
6. Finally output `PHASE-ECOM-25-QUOTATION-FRONTEND.md`

Each document should be complete and ready for an implementing AI agent to execute.

---

**NOW GENERATE ALL 6 WAVE 3 PHASE DOCUMENTS WITH COMPLETE, IMPLEMENTATION-READY CODE.**

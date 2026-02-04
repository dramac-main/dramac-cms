# IMPROVED PHASE CREATION PROMPT: E-Commerce Module - Industry-Grade Implementation

---

## 📋 **MASTER PROMPT: DRAMAC CMS E-Commerce Module - Complete Industry-Standard Implementation**

---

### **CONTEXT & PLATFORM UNDERSTANDING**

You are creating PHASE documents for the DRAMAC CMS platform - an enterprise modular CMS built with Next.js 16, React 19, TypeScript, Supabase (PostgreSQL), and a custom visual editor called DRAMAC Studio.

**Platform Hierarchy:**
```
Super Admin (Platform)
└── Agency (Organization)
    ├── Team Members (roles: owner, admin, member)
    ├── Clients
    └── Sites (one per client)
        ├── Pages (DRAMAC Studio visual builder)
        ├── Blog
        └── Installed Modules (E-Commerce, CRM, Booking, etc.)
```

**Key Technical Patterns:**
- Module ID: `ecommod01` (8 chars), Table prefix: `mod_ecommod01_`
- Server Actions pattern (NOT classes) with `'use server'` directive
- Mobile-first responsive with `ResponsiveValue<T>` type system
- DRAMAC Studio for visual website building with drag-drop components
- Module isolation: Each module has its own database tables, actions, components

**Current E-Commerce Module Location:**
```
src/modules/ecommerce/
├── manifest.ts           # Module definition
├── actions/              # Server actions for CRUD
├── components/           # Dashboard UI (Products, Orders, Categories, Discounts, Analytics)
├── context/              # React context provider
├── studio/               # Visual editor components (ProductCard, ProductGrid only)
├── types/                # TypeScript types
└── widgets/              # Embeddable storefront widget
```

---

### **CRITICAL PROBLEMS IDENTIFIED**

After comprehensive platform analysis, these are the critical issues with the current e-commerce module:

#### **1. Target Audience Unclear**
- Module doesn't clearly serve agency clients' needs
- Missing B2B features (bulk pricing, quotations, customer accounts)
- No white-label capabilities for agencies to resell to their clients

#### **2. Navigation & UX Issues**
- Dashboard is disorganized and lacks intuitive workflow
- Missing quick actions and contextual navigation
- No onboarding flow for first-time users
- Search functionality is basic

#### **3. Missing Core Dashboard Features**
- ❌ No product ID display (UUID hidden from users)
- ❌ No SKU management interface
- ❌ No bulk product operations (import/export CSV)
- ❌ No inventory alerts dashboard
- ❌ No revenue/sales analytics widgets
- ❌ No customer management view
- ❌ No abandoned cart recovery
- ❌ No settings page (store configuration, notifications, integrations)

#### **4. Missing Quotation System**
- ❌ No Request for Quote (RFQ) functionality
- ❌ No quote builder/generator
- ❌ No quote approval workflow
- ❌ No quote-to-order conversion
- ❌ No quote templates
- ❌ No quote expiration handling

#### **5. Incomplete Product Management**
- Products lack visible IDs/SKUs in UI
- No product duplication
- No bulk editing
- No product bundles/kits
- No digital product support
- No product reviews system
- No related products management
- No product comparison feature
- Limited variant management

#### **6. Missing Store Settings**
- ❌ No store branding settings
- ❌ No email notification templates
- ❌ No tax configuration per region
- ❌ No shipping zones/rates configuration UI
- ❌ No payment provider configuration UI
- ❌ No currency management
- ❌ No checkout customization
- ❌ No inventory settings

#### **7. Frontend/Website Integration Issues**
- Only 2 Studio components exist (ProductCard, ProductGrid)
- Components use FAKE demo data, not real product data
- No actual cart functionality on websites
- No checkout flow on websites
- Missing essential e-commerce components:
  - ❌ AddToCartButton (connected)
  - ❌ BuyNowButton
  - ❌ ProductGallery
  - ❌ ProductDetails
  - ❌ ProductPrice
  - ❌ ProductVariantSelector
  - ❌ CartDrawer/CartPage
  - ❌ CheckoutForm
  - ❌ OrderConfirmation
  - ❌ WishlistButton
  - ❌ QuickView modal
  - ❌ ProductSearch
  - ❌ CategoryNavigation
  - ❌ Filters (price, size, color)
  - ❌ SortDropdown
  - ❌ Pagination
  - ❌ RequestQuoteButton
  - ❌ RequestQuoteForm

#### **8. Mobile Responsiveness**
- Current components not fully mobile-first
- Missing touch-friendly interactions
- No mobile-optimized cart experience
- No mobile checkout flow

---

### **INDUSTRY LEADERS REFERENCE**

Study and implement patterns from:

1. **Shopify** - Product management, variants, collections, checkout flow, apps ecosystem
2. **WooCommerce** - WordPress integration, extensions, B2B features
3. **BigCommerce** - Multi-channel, B2B, headless commerce
4. **Saleor** - Modern headless, GraphQL, composable commerce
5. **Medusa** - Open-source, modular, developer-first
6. **Stripe** - Checkout UX, payment handling, webhooks

**Key Industry Patterns to Implement:**
- SKU/Barcode prominently displayed
- Product status badges (Draft, Active, Out of Stock)
- Quick edit inline editing
- Bulk actions toolbar
- Advanced filtering and search
- Real-time inventory sync
- Abandoned cart recovery
- Multi-currency support
- Tax automation
- Shipping calculator
- One-page checkout
- Guest checkout
- Customer accounts
- Order tracking
- Email notifications
- Webhooks for integrations

---

### **PHASE CREATION REQUIREMENTS**

Create a comprehensive set of PHASE documents following this structure:

```markdown
# PHASE-ECOM-XX: [Phase Title]

## Overview
- **Objective**: Clear goal statement
- **Scope**: Files and features affected
- **Dependencies**: Previous phases required
- **Estimated Effort**: Hours
- **Priority**: 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW

## Pre-Implementation Checklist
- [ ] Memory bank files reviewed
- [ ] Dependencies completed
- [ ] No conflicts with existing code

## Implementation Tasks

### Task X.Y: [Task Name]
**File**: `path/to/file.tsx`
**Action**: Create | Modify

[Complete code with inline comments]

## Database Migrations (if needed)
[SQL migrations]

## Type Definitions
[TypeScript interfaces]

## Testing Checklist
- [ ] TypeScript: `npx tsc --noEmit`
- [ ] Manual testing steps

## Rollback Plan
[Recovery steps if issues]
```

---

### **RECOMMENDED PHASE BREAKDOWN**

Create the following phases in order:

#### **WAVE 1: Dashboard Foundation (CRITICAL)**

**PHASE-ECOM-01: Dashboard Redesign & Navigation**
- Redesigned dashboard layout with sidebar navigation
- Quick stats cards (Revenue, Orders, Products, Low Stock)
- Recent orders widget
- Activity feed
- Quick actions dropdown
- Breadcrumb navigation
- Search with filters
- Mobile-responsive dashboard

**PHASE-ECOM-02: Product Management Enhancement**
- Display Product IDs/SKUs prominently
- Product status badges (visual indicators)
- Bulk selection with actions toolbar
- Inline quick edit
- Product duplication
- Advanced filters (status, category, stock, price range)
- Column customization
- Export to CSV/Excel
- Import from CSV with validation
- Image gallery management improvement

**PHASE-ECOM-03: Settings & Configuration Center**
- Store settings (name, logo, address, contact)
- Currency settings (primary, display format)
- Tax settings (per region/country)
- Shipping zones and rates configuration
- Payment provider configuration UI (Flutterwave, Pesapal, Paddle)
- Email notification settings
- Checkout configuration
- Inventory settings
- SEO defaults
- Legal pages (Terms, Privacy, Refund Policy)

**PHASE-ECOM-04: Order Management Enhancement**
- Order detail view with timeline
- Order status workflow
- Bulk order actions
- Packing slip generation
- Invoice generation
- Refund processing
- Notes and communication log
- Order search and advanced filters
- Order exports

**PHASE-ECOM-05: Customer Management**
- Customer list view
- Customer detail page (orders, addresses, notes)
- Customer groups/segments
- Customer import/export
- Guest vs registered customers
- Customer activity timeline
- Communication history

#### **WAVE 2: Quotation System (HIGH)**

**PHASE-ECOM-10: Quotation Database Schema**
- Quotes table with statuses
- Quote items table
- Quote templates table
- Quote history/revisions

**PHASE-ECOM-11: Quote Builder**
- Create quote from scratch
- Add products with custom pricing
- Apply discounts
- Add custom line items
- Notes and terms
- Expiration date
- Quote numbering system

**PHASE-ECOM-12: Quote Workflow**
- Quote statuses (Draft, Sent, Viewed, Accepted, Rejected, Expired)
- Send quote via email
- Customer quote view page (public link)
- Accept/Reject actions
- Quote-to-order conversion
- Quote revision history
- Quote reminders

**PHASE-ECOM-13: Quote Templates**
- Save quote as template
- Template library
- Quick quote from template
- Template customization

#### **WAVE 3: Studio Components - Real Data Integration (CRITICAL)**

**PHASE-ECOM-20: Core Data Hooks & Context**
- `useProducts(siteId)` - Fetch real products
- `useCart(siteId)` - Cart state management
- `useCategories(siteId)` - Category fetching
- `useCheckout(siteId)` - Checkout flow
- Cart persistence (localStorage + server sync)
- Real-time stock validation

**PHASE-ECOM-21: Product Display Components**
- `ProductCard` - Connected to real data
- `ProductGrid` - With real products, pagination
- `ProductGallery` - Image carousel with zoom
- `ProductDetails` - Full product info
- `ProductPrice` - Price display with sale
- `ProductVariantSelector` - Size, color pickers
- `ProductReviews` - Rating display
- `RelatedProducts` - Algorithm-based
- `RecentlyViewed` - Cookie-based tracking

**PHASE-ECOM-22: Cart Components**
- `AddToCartButton` - With variant selection
- `BuyNowButton` - Direct to checkout
- `CartIcon` - With item count badge
- `CartDrawer` - Slide-out cart
- `CartPage` - Full cart view
- `CartItem` - Individual item with qty
- `CartSummary` - Totals, discounts
- `CartEmpty` - Empty state

**PHASE-ECOM-23: Checkout Components**
- `CheckoutForm` - Multi-step checkout
- `ShippingForm` - Address entry
- `PaymentForm` - Payment integration
- `OrderSummary` - Order review
- `OrderConfirmation` - Success page
- `GuestCheckout` - No account required
- `ExpressCheckout` - One-click buy

**PHASE-ECOM-24: Navigation & Discovery**
- `CategoryNavigation` - Category menu
- `ProductSearch` - Search with autocomplete
- `ProductFilters` - Price, size, color, etc.
- `SortDropdown` - Sort options
- `Pagination` - Page navigation
- `Breadcrumbs` - Navigation path
- `QuickView` - Modal product preview

**PHASE-ECOM-25: Quotation Components**
- `RequestQuoteButton` - Opens quote form
- `RequestQuoteForm` - Product inquiry
- `QuoteItemsSelector` - Multi-product quote
- `QuoteSummary` - Quote display

#### **WAVE 4: Mobile-First Optimization (HIGH)**

**PHASE-ECOM-30: Mobile Cart Experience**
- Bottom sheet cart
- Swipe to remove items
- Touch-friendly quantity selectors
- Floating cart button
- Cart notifications

**PHASE-ECOM-31: Mobile Checkout**
- Single-page mobile checkout
- Mobile payment integrations
- Address autocomplete
- Mobile-optimized forms
- Progress indicator

**PHASE-ECOM-32: Mobile Product Experience**
- Full-screen product gallery
- Swipe between products
- Sticky add-to-cart bar
- Collapsible product details
- Bottom sheet variant selector

#### **WAVE 5: Advanced Features (MEDIUM)**

**PHASE-ECOM-40: Inventory Management**
- Stock level dashboard
- Low stock alerts
- Restock notifications
- Inventory history
- Multi-location inventory (future)

**PHASE-ECOM-41: Analytics & Reports**
- Sales dashboard
- Product performance
- Category performance
- Customer insights
- Conversion funnel
- Revenue reports
- Export reports

**PHASE-ECOM-42: Marketing Features**
- Discount code management (enhanced)
- Automatic discounts (rules engine)
- Flash sales/time-limited
- Bundle deals
- Loyalty points (basic)
- Gift cards (basic)

**PHASE-ECOM-43: Integrations**
- Webhook events for all actions
- API documentation
- Third-party app support
- Email marketing integration
- Accounting integration hooks

#### **WAVE 6: Module Auto-Setup (MEDIUM)**

**PHASE-ECOM-50: Module Installation Wizard**
- When e-commerce module installed on site:
  - Auto-add cart icon to navbar
  - Create `/shop` page with ProductGrid
  - Create `/cart` page with CartPage
  - Create `/checkout` page with CheckoutForm
  - Create `/products/[slug]` dynamic product page
  - Create `/categories/[slug]` category page
  - Setup basic navigation

---

### **COMPONENT REQUIREMENTS**

All Studio components MUST:

1. **Use ResponsiveValue<T> for ALL visual props**:
```typescript
interface ProductCardProps {
  padding: ResponsiveValue<SpacingSize>;
  imageAspect: ResponsiveValue<"square" | "portrait" | "landscape">;
  showPrice: ResponsiveValue<boolean>;
}
```

2. **Be Mobile-First**:
```css
/* Base = mobile */
.product-card { padding: 12px; }
@media (min-width: 768px) { .product-card { padding: 16px; } }
@media (min-width: 1024px) { .product-card { padding: 24px; } }
```

3. **Fetch REAL data**:
```typescript
// NOT THIS:
const product = { name: "Demo Product", price: 99.99 }

// THIS:
const { products } = useProducts(siteId);
```

4. **Handle Loading/Error States**:
```typescript
if (isLoading) return <ProductCardSkeleton />;
if (error) return <ProductCardError message={error} />;
```

5. **Be Fully Accessible**:
```tsx
<button aria-label="Add Product Name to cart" role="button">
  Add to Cart
</button>
```

6. **Register in Component Registry**:
```typescript
// src/lib/studio/registry/core-components.ts
{
  type: "ProductCard",
  label: "Product Card",
  category: "ecommerce",
  render: ProductCardRender,
  fields: { /* ... */ },
  ai: { description: "Displays a product..." }
}
```

---

### **DATABASE SCHEMA ADDITIONS**

Add to existing e-commerce schema:

```sql
-- Quotes/Quotations
CREATE TABLE mod_ecommod01_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  quote_number TEXT NOT NULL,
  customer_id UUID,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted')),
  subtotal DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  notes TEXT,
  terms TEXT,
  valid_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  converted_order_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mod_ecommod01_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES mod_ecommod01_products(id),
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id),
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL
);

CREATE TABLE mod_ecommod01_quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Reviews
CREATE TABLE mod_ecommod01_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id),
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlists
CREATE TABLE mod_ecommod01_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  user_id UUID,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id),
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, user_id, product_id, variant_id)
);

-- Customer Addresses
CREATE TABLE mod_ecommod01_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  customer_id UUID,
  type TEXT DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing')),
  is_default BOOLEAN DEFAULT false,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **DELETE FAKE COMPONENTS**

Remove or replace these placeholder/fake components:
- Current ProductCard in `renders.tsx` that uses demo data
- Current ProductGrid that doesn't fetch real products
- Any component with hardcoded `"Demo Product"` or `price: 99.99`

Replace with components that:
1. Accept `siteId` or use context
2. Fetch from e-commerce module actions
3. Handle loading/error states
4. Display real product data

---

### **SUCCESS CRITERIA**

The e-commerce module is complete when:

1. ✅ Agency clients can manage full e-commerce operations from dashboard
2. ✅ Products have visible IDs, SKUs, and all management features
3. ✅ Complete quotation system with request → quote → order flow
4. ✅ All settings are configurable (tax, shipping, payments, notifications)
5. ✅ Studio has 25+ e-commerce components pulling real data
6. ✅ Full cart → checkout → order flow works on websites
7. ✅ All components are mobile-first responsive
8. ✅ Module auto-configures when installed on a site
9. ✅ Analytics and reporting dashboard is comprehensive
10. ✅ Performance: <200ms API responses, <1s page loads

---

### **IMPLEMENTATION NOTES FOR AI AGENT**

1. **Always check existing code first** - Don't recreate what exists
2. **Follow established patterns** - Look at CRM/Booking modules for reference
3. **Use Server Actions** - NOT class-based services
4. **Mobile-first CSS** - Base styles for mobile, add breakpoints for larger
5. **TypeScript strict mode** - All types must be defined
6. **Test after each phase** - `npx tsc --noEmit` must pass
7. **Update memory bank** - Document changes in activeContext.md
8. **Commit after each phase** - Clear commit messages

---

### **FILE STRUCTURE FOR NEW COMPONENTS**

```
src/modules/ecommerce/
├── studio/
│   ├── components/
│   │   ├── product-card-block.tsx      # Enhanced with real data
│   │   ├── product-grid-block.tsx      # Enhanced with real data
│   │   ├── product-gallery-block.tsx   # NEW
│   │   ├── add-to-cart-button.tsx      # NEW
│   │   ├── cart-drawer-block.tsx       # NEW
│   │   ├── checkout-form-block.tsx     # NEW
│   │   ├── request-quote-button.tsx    # NEW
│   │   └── ... (25+ components)
│   ├── fields/
│   │   ├── product-selector-field.tsx  # Existing
│   │   ├── category-selector-field.tsx # Existing
│   │   └── variant-selector-field.tsx  # NEW
│   └── index.ts                        # Export all
├── hooks/
│   ├── use-products.ts                 # NEW
│   ├── use-cart.ts                     # NEW
│   ├── use-checkout.ts                 # NEW
│   └── use-quotes.ts                   # NEW
└── components/
    ├── views/
    │   ├── quotes-view.tsx             # NEW
    │   ├── customers-view.tsx          # NEW
    │   └── settings-view.tsx           # NEW
    └── dialogs/
        ├── create-quote-dialog.tsx     # NEW
        └── store-settings-dialog.tsx   # Enhanced
```

---

**END OF MASTER PROMPT**

---

This comprehensive prompt provides your AI agent with:
1. Full platform understanding
2. Specific problems to solve
3. Industry-standard patterns to follow
4. Detailed phase breakdown with priorities
5. Code requirements and patterns
6. Database schema additions
7. Component specifications
8. Success criteria

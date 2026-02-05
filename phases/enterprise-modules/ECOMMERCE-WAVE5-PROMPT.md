# AI AGENT PROMPT: Generate WAVE 5 E-Commerce Phase Documents

---

## YOUR TASK

You are a senior software architect creating detailed PHASE implementation documents for the DRAMAC CMS E-Commerce Module. Your job is to generate **WAVE 5: Advanced Features (MEDIUM Priority)** - consisting of **4 comprehensive PHASE documents** that another AI agent will use to implement the code.

**IMPORTANT**: Waves 1, 2, 3, and 4 have been completed. The following already exists:

### Wave 1 ✅ Complete - Dashboard Foundation:
- ECOM-01 ✅ Dashboard Redesign & Navigation (sidebar, widgets, command palette)
- ECOM-02 ✅ Product Management Enhancement (TanStack Table, filters, bulk actions, import/export)
- ECOM-03 ✅ Settings & Configuration Center (9 settings tabs, server actions)
- ECOM-04 ✅ Order Management Enhancement (order detail dialog, timeline, refunds, invoices)
- ECOM-05 ✅ Customer Management (customer list, detail dialog, groups, notes)

### Wave 2 ✅ Complete - Quotation System:
- ECOM-10 ✅ Quotation Database Schema & Types
- ECOM-11A ✅ Quote Server Actions
- ECOM-11B ✅ Quote UI Components
- ECOM-12 ✅ Quote Workflow & Customer Portal
- ECOM-13 ✅ Quote Templates & Automation

### Wave 3 ✅ Complete - Studio Components (Real Data Integration):
- ECOM-20 ✅ Core Data Hooks & Context (10 hooks + StorefrontProvider)
- ECOM-21 ✅ Product Display Components (ProductCardBlock, ProductGridBlock, FeaturedProductsBlock, etc.)
- ECOM-22 ✅ Cart Components (CartDrawerBlock, CartPageBlock, MiniCartBlock, etc.)
- ECOM-23 ✅ Checkout Components (CheckoutPageBlock, AddressForm, PaymentMethodSelector, etc.)
- ECOM-24 ✅ Navigation & Discovery (CategoryNavBlock, SearchBarBlock, FilterSidebarBlock, etc.)
- ECOM-25 ✅ Quotation Frontend (QuoteRequestBlock, QuoteListBlock, QuoteDetailBlock)

### Wave 4 ✅ Complete - Mobile-First Optimization:
- ECOM-30 ✅ Mobile Cart Experience (MobileCartBottomSheet, SwipeableCartItem, CartNotification, etc.)
- ECOM-31 ✅ Mobile Checkout Flow (MobileCheckoutPage, MobileAddressInput, MobilePaymentSelector, etc.)
- ECOM-32 ✅ Mobile Product Experience (MobileProductGallery, StickyAddToCartBar, ProductSwipeView, etc.)

---

## PHASES TO CREATE

Generate the following 4 PHASE documents:

| Phase | Title | Priority | Est. Hours |
|-------|-------|----------|------------|
| **PHASE-ECOM-40** | Inventory Management | 🟡 MEDIUM | 10-12 |
| **PHASE-ECOM-41** | Analytics & Reports | 🟡 MEDIUM | 12-14 |
| **PHASE-ECOM-42** | Marketing Features | 🟡 MEDIUM | 10-12 |
| **PHASE-ECOM-43** | Integrations & Webhooks | 🟡 MEDIUM | 8-10 |

---

## EXISTING CODE CONTEXT

### Current E-Commerce Module Structure (After Waves 1-4)
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
│   ├── views/                   # ✅ 10 dashboard views
│   │   ├── analytics-view.tsx   # ⚠️ Basic - needs enhancement
│   │   ├── categories-view.tsx
│   │   ├── customers-view.tsx
│   │   ├── discounts-view.tsx   # ⚠️ Basic - needs enhancement
│   │   ├── home-view.tsx
│   │   ├── orders-view.tsx
│   │   ├── products-view.tsx
│   │   ├── quotes-view.tsx
│   │   └── settings-view.tsx
│   ├── widgets/                 # ✅ Stats cards, recent orders, low stock
│   ├── command-palette.tsx
│   └── ecommerce-dashboard.tsx
├── context/
│   ├── ecommerce-context.tsx    # ✅ Dashboard provider
│   └── storefront-context.tsx   # ✅ Storefront provider
├── hooks/                       # ✅ 15 hooks total
│   ├── useCheckout.ts
│   ├── useHapticFeedback.ts
│   ├── useKeyboardVisible.ts
│   ├── useMobile.ts
│   ├── useProductFilters.ts
│   ├── useQuotations.ts
│   ├── useRecentlyViewed.ts
│   ├── useStorefrontCart.ts
│   ├── useStorefrontCategories.ts
│   ├── useStorefrontProduct.ts
│   ├── useStorefrontProducts.ts
│   ├── useStorefrontSearch.ts
│   ├── useStorefrontWishlist.ts
│   └── useSwipeGesture.ts
├── lib/
│   ├── quote-analytics.ts       # ✅ Quote performance analytics
│   ├── quote-automation.ts      # ✅ Quote expiration/reminders
│   ├── quote-pdf-generator.ts   # ✅ Quote PDF generation
│   ├── quote-utils.ts           # ✅ Quote utilities
│   └── settings-utils.ts        # ✅ Settings utilities
├── studio/
│   ├── components/              # ✅ 38 desktop + 23 mobile components
│   │   ├── mobile/              # ✅ Wave 4 mobile components (23 files)
│   │   └── [38 desktop components]
│   ├── fields/
│   └── index.ts
├── types/
│   └── ecommerce-types.ts       # ✅ All types (2500+ lines)
├── widgets/
│   └── StorefrontWidget.tsx
├── manifest.ts
└── index.ts
```

### Current Database Tables (mod_ecommod01_*)
```sql
-- Core tables (existing)
mod_ecommod01_products
mod_ecommod01_product_variants
mod_ecommod01_product_options
mod_ecommod01_product_option_values
mod_ecommod01_product_images
mod_ecommod01_categories
mod_ecommod01_orders
mod_ecommod01_order_items
mod_ecommod01_order_timeline
mod_ecommod01_order_notes
mod_ecommod01_order_shipments
mod_ecommod01_order_refunds
mod_ecommod01_carts
mod_ecommod01_cart_items
mod_ecommod01_customers
mod_ecommod01_customer_addresses
mod_ecommod01_customer_groups
mod_ecommod01_customer_group_members
mod_ecommod01_customer_notes
mod_ecommod01_discounts
mod_ecommod01_quotes
mod_ecommod01_quote_items
mod_ecommod01_quote_templates
mod_ecommod01_quote_settings
mod_ecommod01_settings
```

---

## WAVE 5 PHASE SPECIFICATIONS

### PHASE-ECOM-40: Inventory Management

**Purpose:** Comprehensive inventory tracking, stock alerts, and restock management.

**Must Include:**

#### Database Schema Additions:
```sql
-- Inventory movements/history
CREATE TABLE mod_ecommod01_inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id),
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id),
  type TEXT NOT NULL CHECK (type IN ('adjustment', 'sale', 'return', 'restock', 'transfer', 'damage', 'expired')),
  quantity INTEGER NOT NULL, -- positive for in, negative for out
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT, -- 'order', 'manual', 'import'
  reference_id UUID,   -- order_id, etc.
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock alerts configuration
CREATE TABLE mod_ecommod01_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  product_id UUID REFERENCES mod_ecommod01_products(id), -- null for global
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id),
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  critical_stock_threshold INTEGER NOT NULL DEFAULT 3,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_dashboard BOOLEAN DEFAULT true,
  last_alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory locations (future multi-location support)
CREATE TABLE mod_ecommod01_inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Server Actions (NEW - `inventory-actions.ts`):
```typescript
// Stock management
adjustStock(siteId, productId, variantId, quantity, type, reason)
getStockHistory(siteId, productId, options)
bulkAdjustStock(siteId, adjustments[])

// Alerts
getStockAlerts(siteId, status) // 'low', 'critical', 'out'
configureAlert(siteId, productId, config)
dismissAlert(alertId)
getAlertSettings(siteId)
updateAlertSettings(siteId, settings)

// Inventory reports
getInventoryReport(siteId, filters)
getStockValuation(siteId) // total inventory value
getLowStockProducts(siteId, threshold)
getOutOfStockProducts(siteId)
getStockMovementReport(siteId, dateRange)
```

#### Dashboard Components:
1. **InventoryDashboardView** - Main inventory view with:
   - Stock level cards (Total, Low, Out of Stock, Value)
   - Stock alerts list
   - Quick stock adjustment form
   - Inventory movement log

2. **StockAlertWidget** - Dashboard widget showing:
   - Critical stock items
   - Low stock items
   - Reorder suggestions

3. **StockAdjustmentDialog** - Modal for:
   - Single product adjustment
   - Bulk adjustments
   - Reason/notes tracking
   - Movement type selection

4. **InventoryHistoryTable** - TanStack Table with:
   - Movement type filters
   - Date range filters
   - Product/variant search
   - Export to CSV

5. **StockAlertSettings** - Settings panel for:
   - Global thresholds
   - Per-product thresholds
   - Notification preferences
   - Email alert recipients

---

### PHASE-ECOM-41: Analytics & Reports

**Purpose:** Comprehensive sales analytics, product performance, and exportable reports.

**Must Include:**

#### Database Schema Additions:
```sql
-- Analytics snapshots (for historical data)
CREATE TABLE mod_ecommod01_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  snapshot_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  metrics JSONB NOT NULL, -- {revenue, orders, products_sold, average_order, new_customers, etc.}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, snapshot_date, type)
);

-- Report definitions (saved reports)
CREATE TABLE mod_ecommod01_saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sales', 'products', 'customers', 'inventory', 'custom')),
  config JSONB NOT NULL, -- filters, date range, metrics, grouping
  schedule TEXT, -- 'daily', 'weekly', 'monthly', null for manual
  recipients TEXT[], -- email addresses
  last_generated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Server Actions (NEW - `analytics-actions.ts`):
```typescript
// Sales analytics
getSalesOverview(siteId, dateRange)
getSalesByPeriod(siteId, period, dateRange) // daily, weekly, monthly
getSalesByChannel(siteId, dateRange) // website, quote, manual
getRevenueBreakdown(siteId, dateRange)

// Product analytics
getProductPerformance(siteId, dateRange, limit)
getTopProducts(siteId, by, dateRange) // by: 'revenue', 'quantity', 'views'
getCategoryPerformance(siteId, dateRange)
getProductViewsVsConversions(siteId, productIds)

// Customer analytics
getCustomerInsights(siteId, dateRange)
getCustomerLifetimeValue(siteId, customerId)
getCustomerSegmentation(siteId)
getRepeatCustomerRate(siteId, dateRange)
getNewVsReturningCustomers(siteId, dateRange)

// Conversion funnel
getConversionFunnel(siteId, dateRange)
getCartAbandonmentRate(siteId, dateRange)
getCheckoutDropoffPoints(siteId, dateRange)

// Report generation
generateReport(siteId, type, config)
scheduleReport(siteId, reportConfig)
exportReport(siteId, reportId, format) // 'csv', 'xlsx', 'pdf'
getSavedReports(siteId)
getReportHistory(siteId, reportId)
```

#### Dashboard Components:

1. **AnalyticsDashboardView** (ENHANCED - replace existing) - Comprehensive view with:
   - Date range picker (Today, 7d, 30d, 90d, Custom)
   - Period comparison toggle (vs previous period)
   - KPI cards (Revenue, Orders, AOV, Conversion Rate)
   - Sales trend chart (line/bar)
   - Top products table
   - Category breakdown pie chart
   - Traffic sources (if analytics integrated)

2. **SalesChart** - Recharts-based with:
   - Line chart for trends
   - Bar chart for comparisons
   - Multiple metrics overlay
   - Zoom/pan capabilities
   - Export as image

3. **ProductPerformanceTable** - TanStack Table with:
   - Sortable columns (revenue, quantity, views, conversion)
   - Sparkline trends
   - Category filter
   - Date range filter

4. **CustomerInsightsCard** - Card showing:
   - New customers this period
   - Repeat customer rate
   - Average customer LTV
   - Top customer segments

5. **ConversionFunnelChart** - Funnel visualization:
   - Views → Cart → Checkout → Purchase
   - Drop-off percentages
   - Period comparison

6. **ReportBuilderDialog** - Custom report builder:
   - Metric selection
   - Dimension selection (product, category, customer, date)
   - Filter configuration
   - Schedule options
   - Export format selection

7. **SavedReportsView** - Saved reports management:
   - Report list with last run
   - Run now / Edit / Delete
   - Download previous runs
   - Schedule management

---

### PHASE-ECOM-42: Marketing Features

**Purpose:** Enhanced discount management, flash sales, bundle deals, and promotional tools.

**Must Include:**

#### Database Schema Additions:
```sql
-- Enhanced discount rules (extend existing discounts table)
ALTER TABLE mod_ecommod01_discounts ADD COLUMN IF NOT EXISTS
  rules JSONB DEFAULT '{}', -- complex rule engine
  auto_apply BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  stacking_allowed BOOLEAN DEFAULT false,
  usage_limit_per_customer INTEGER;

-- Flash sales / Time-limited promotions
CREATE TABLE mod_ecommod01_flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  product_ids UUID[], -- null for all products
  category_ids UUID[],
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  show_countdown BOOLEAN DEFAULT true,
  show_stock_urgency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product bundles
CREATE TABLE mod_ecommod01_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  image_url TEXT,
  bundle_type TEXT DEFAULT 'fixed' CHECK (bundle_type IN ('fixed', 'mix_match')),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'fixed_price')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_items INTEGER DEFAULT 1, -- for mix_match
  max_items INTEGER,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mod_ecommod01_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES mod_ecommod01_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES mod_ecommod01_products(id),
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id),
  quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT true -- for mix_match bundles
);

-- Gift cards (basic)
CREATE TABLE mod_ecommod01_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  code TEXT NOT NULL UNIQUE,
  initial_value DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  purchaser_email TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty points (basic)
CREATE TABLE mod_ecommod01_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id),
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mod_ecommod01_loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  customer_id UUID NOT NULL REFERENCES mod_ecommod01_customers(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjustment', 'bonus')),
  points INTEGER NOT NULL,
  description TEXT,
  reference_type TEXT, -- 'order', 'review', 'referral', 'manual'
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Server Actions:

**Enhanced Discounts (`discount-actions.ts`):**
```typescript
// Automatic discounts
createAutoDiscount(siteId, config) // auto-apply rules
getActiveAutoDiscounts(siteId)
evaluateDiscounts(siteId, cart) // returns applicable discounts

// Discount rules engine
validateDiscountRules(rules)
testDiscount(siteId, discountId, testCart)
```

**Flash Sales (`flash-sale-actions.ts`):**
```typescript
createFlashSale(siteId, data)
updateFlashSale(saleId, data)
deleteFlashSale(saleId)
getActiveFlashSales(siteId)
getUpcomingFlashSales(siteId)
getFlashSaleProducts(saleId)
incrementFlashSaleUse(saleId)
```

**Bundles (`bundle-actions.ts`):**
```typescript
createBundle(siteId, data)
updateBundle(bundleId, data)
deleteBundle(bundleId)
getBundles(siteId)
getBundleBySlug(siteId, slug)
getBundlePrice(bundleId, selectedItems) // for mix_match
validateBundleSelection(bundleId, items)
```

**Gift Cards (`gift-card-actions.ts`):**
```typescript
createGiftCard(siteId, data)
sendGiftCard(giftCardId, recipientEmail)
redeemGiftCard(siteId, code, amount)
getGiftCardBalance(code)
getGiftCards(siteId, filters)
deactivateGiftCard(giftCardId)
```

**Loyalty (`loyalty-actions.ts`):**
```typescript
getLoyaltySettings(siteId)
updateLoyaltySettings(siteId, settings)
getCustomerPoints(siteId, customerId)
awardPoints(siteId, customerId, points, type, reference)
redeemPoints(siteId, customerId, points)
getPointsHistory(siteId, customerId)
calculatePointsForOrder(siteId, orderTotal)
getCustomerTier(siteId, customerId)
```

#### Dashboard Components:

1. **DiscountsViewEnhanced** - Replace/enhance existing:
   - Manual discount codes section
   - Automatic discounts section
   - Rules builder UI
   - Usage statistics
   - A/B test comparison

2. **FlashSaleManager** - New view with:
   - Active sales list with countdown
   - Create sale wizard
   - Product selector
   - Schedule calendar
   - Performance metrics

3. **BundleManager** - New view with:
   - Bundle list
   - Bundle builder (drag-drop products)
   - Bundle preview
   - Pricing calculator
   - Performance stats

4. **GiftCardManager** - New view with:
   - Gift card list
   - Create/send dialog
   - Balance lookup
   - Transaction history
   - Bulk generation

5. **LoyaltyDashboard** - New view with:
   - Program settings
   - Points rules configuration
   - Tier definitions
   - Customer leaderboard
   - Points transaction log

#### Storefront Components (Studio):

1. **FlashSaleBanner** - Countdown timer, product highlights
2. **BundleCard** - Bundle display with savings
3. **BundleBuilder** - Mix-and-match selector (for mix_match bundles)
4. **GiftCardPurchase** - Gift card purchase form
5. **GiftCardRedeem** - Redeem code input at checkout
6. **LoyaltyPointsDisplay** - Customer points balance
7. **LoyaltyEarnBanner** - "Earn X points on this purchase"

---

### PHASE-ECOM-43: Integrations & Webhooks

**Purpose:** Event-driven webhooks, API documentation, and third-party integration hooks.

**Must Include:**

#### Database Schema:
```sql
-- Webhook endpoints
CREATE TABLE mod_ecommod01_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- ['order.created', 'order.updated', 'product.created', etc.]
  secret TEXT NOT NULL, -- for signature verification
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}', -- custom headers
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMPTZ,
  last_status INTEGER, -- HTTP status code
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook delivery log
CREATE TABLE mod_ecommod01_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES mod_ecommod01_webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  attempt INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration configurations
CREATE TABLE mod_ecommod01_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  type TEXT NOT NULL, -- 'email_marketing', 'accounting', 'shipping', 'analytics', 'custom'
  provider TEXT NOT NULL, -- 'mailchimp', 'klaviyo', 'quickbooks', 'google_analytics', etc.
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- provider-specific config (API keys, etc.)
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, type, provider)
);
```

#### Webhook Events to Support:
```typescript
// Order events
'order.created'
'order.updated'
'order.paid'
'order.fulfilled'
'order.cancelled'
'order.refunded'

// Product events
'product.created'
'product.updated'
'product.deleted'
'product.stock_low'
'product.out_of_stock'
'product.back_in_stock'

// Customer events
'customer.created'
'customer.updated'
'customer.deleted'

// Cart events
'cart.created'
'cart.updated'
'cart.abandoned'
'cart.recovered'

// Quote events
'quote.created'
'quote.sent'
'quote.viewed'
'quote.accepted'
'quote.rejected'
'quote.expired'
'quote.converted'

// Inventory events
'inventory.adjusted'
'inventory.low'
'inventory.restocked'
```

#### Server Actions:

**Webhooks (`webhook-actions.ts`):**
```typescript
// Webhook management
createWebhook(siteId, data)
updateWebhook(webhookId, data)
deleteWebhook(webhookId)
getWebhooks(siteId)
testWebhook(webhookId) // send test payload
regenerateSecret(webhookId)

// Webhook triggering (internal)
triggerWebhook(siteId, event, payload)
retryWebhook(deliveryId)
getWebhookDeliveries(webhookId, filters)

// Event types
getAvailableEvents()
```

**Integrations (`integration-actions.ts`):**
```typescript
// Integration management
configureIntegration(siteId, type, provider, config)
updateIntegration(integrationId, config)
deleteIntegration(integrationId)
getIntegrations(siteId)
testIntegration(integrationId)
syncIntegration(integrationId)

// Provider-specific
getAvailableProviders(type)
getProviderConfig(provider) // returns required fields
validateProviderConfig(provider, config)
```

#### Webhook Utility (`lib/webhook-utils.ts`):
```typescript
// Signature generation
generateWebhookSignature(payload, secret)
verifyWebhookSignature(payload, signature, secret)

// Delivery
deliverWebhook(webhook, event, payload)
retryFailedDeliveries(siteId)

// Event helpers
formatEventPayload(event, data)
getEventDescription(event)
```

#### Dashboard Components:

1. **WebhooksView** - New view with:
   - Webhook list with status indicators
   - Create/edit webhook dialog
   - Event selector (multi-select)
   - Test webhook button
   - Delivery history table

2. **WebhookDeliveryLog** - Component showing:
   - Recent deliveries
   - Status (success/failed/retrying)
   - Response details
   - Retry button
   - Payload viewer

3. **IntegrationsView** - New view with:
   - Integration categories (Email, Accounting, Shipping, Analytics)
   - Available providers per category
   - Connected integrations list
   - Setup wizard per provider
   - Sync status and controls

4. **IntegrationSetupDialog** - Modal for:
   - Provider-specific configuration
   - API key entry
   - Connection test
   - Sync options

5. **APIDocumentation** - New view with:
   - Available endpoints list
   - Request/response examples
   - Authentication guide
   - Rate limits info
   - Webhook payload examples

---

## DOCUMENT FORMAT REQUIREMENTS

Each PHASE document MUST follow this EXACT structure:

```markdown
# PHASE-ECOM-XX: [Phase Title]

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: X-Y hours
> **Prerequisites**: Waves 1-4 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

[2-3 sentences describing what this phase accomplishes]

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code
- [ ] Verify Waves 1-4 are complete
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

## 🗃️ Database Migration

\`\`\`sql
-- Migration: ECOM-XX
-- Description: [What this migration does]

[SQL statements]
\`\`\`

---

## 📋 Implementation Tasks

### Task X.1: [Task Name]

**File**: `src/modules/ecommerce/path/to/file.tsx`
**Action**: Create | Modify

**Description**: [What this task accomplishes]

\`\`\`typescript
// COMPLETE implementation code here
// Include ALL imports
// Include ALL TypeScript types
// Include inline comments explaining logic
\`\`\`

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Database migration runs without errors
- [ ] Manual testing of all CRUD operations
- [ ] Verify data integrity
- [ ] Test error handling

---

## 🔄 Rollback Plan

If issues occur:
1. [Specific rollback steps]
2. [Database rollback if needed]

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add phase completion note
- `progress.md`: Update Wave 5 section

---

## ✨ Success Criteria

- [ ] [Specific measurable outcome 1]
- [ ] [Specific measurable outcome 2]
```

---

## CRITICAL REQUIREMENTS

### 1. Complete, Copy-Paste Ready Code
- Every code block must be COMPLETE - no placeholders
- Include ALL imports
- Include ALL TypeScript types
- Include inline comments

### 2. Follow Existing Patterns
- **Server Actions**: Use `'use server'` directive
- **Utility Functions**: Put in `lib/` folder WITHOUT `'use server'`
- **Table Prefix**: `mod_ecommod01_` for all database tables
- **Types**: Add to `ecommerce-types.ts` or create new type file

### 3. TypeScript Strict Mode
- All types must be defined
- No `any` types unless necessary
- Export types for reuse

### 4. Recharts for Analytics
- Use existing Recharts setup
- Follow existing chart patterns in the codebase
- Responsive chart containers

### 5. TanStack Table for Data Tables
- Use existing table patterns
- Include sorting, filtering, pagination
- Export functionality

---

## FILES TO CREATE SUMMARY

### ECOM-40: Inventory Management
```
src/modules/ecommerce/
├── actions/inventory-actions.ts      # Stock management, alerts
├── components/views/inventory-view.tsx
├── components/inventory/
│   ├── StockAlertWidget.tsx
│   ├── StockAdjustmentDialog.tsx
│   ├── InventoryHistoryTable.tsx
│   └── StockAlertSettings.tsx
└── types/inventory-types.ts          # Or add to ecommerce-types.ts
```

### ECOM-41: Analytics & Reports
```
src/modules/ecommerce/
├── actions/analytics-actions.ts      # All analytics queries
├── components/views/analytics-view.tsx  # ENHANCED
├── components/analytics/
│   ├── SalesChart.tsx
│   ├── ProductPerformanceTable.tsx
│   ├── CustomerInsightsCard.tsx
│   ├── ConversionFunnelChart.tsx
│   ├── ReportBuilderDialog.tsx
│   └── SavedReportsView.tsx
└── lib/analytics-utils.ts            # Chart helpers, formatters
```

### ECOM-42: Marketing Features
```
src/modules/ecommerce/
├── actions/
│   ├── discount-actions.ts           # ENHANCED
│   ├── flash-sale-actions.ts
│   ├── bundle-actions.ts
│   ├── gift-card-actions.ts
│   └── loyalty-actions.ts
├── components/marketing/
│   ├── FlashSaleManager.tsx
│   ├── BundleManager.tsx
│   ├── GiftCardManager.tsx
│   └── LoyaltyDashboard.tsx
├── studio/components/
│   ├── FlashSaleBanner.tsx
│   ├── BundleCard.tsx
│   ├── BundleBuilder.tsx
│   ├── GiftCardPurchase.tsx
│   ├── GiftCardRedeem.tsx
│   ├── LoyaltyPointsDisplay.tsx
│   └── LoyaltyEarnBanner.tsx
└── types/marketing-types.ts
```

### ECOM-43: Integrations & Webhooks
```
src/modules/ecommerce/
├── actions/
│   ├── webhook-actions.ts
│   └── integration-actions.ts
├── components/integrations/
│   ├── WebhooksView.tsx
│   ├── WebhookDeliveryLog.tsx
│   ├── IntegrationsView.tsx
│   ├── IntegrationSetupDialog.tsx
│   └── APIDocumentation.tsx
├── lib/webhook-utils.ts
└── types/integration-types.ts
```

---

## SUCCESS METRICS FOR WAVE 5

After implementation:

1. ✅ Full inventory tracking with movement history
2. ✅ Configurable stock alerts with notifications
3. ✅ Comprehensive sales analytics dashboard
4. ✅ Custom report builder with scheduling
5. ✅ Flash sales with countdown timers
6. ✅ Product bundles (fixed and mix-match)
7. ✅ Gift card system (create, send, redeem)
8. ✅ Basic loyalty points program
9. ✅ Webhook system with 20+ events
10. ✅ Integration framework for third-party services
11. ✅ API documentation page
12. ✅ All features work with existing Wave 1-4 components

---

**END OF WAVE 5 MASTER PROMPT**

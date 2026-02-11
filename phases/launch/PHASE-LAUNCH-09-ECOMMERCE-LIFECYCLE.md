# PHASE LAUNCH-09: E-Commerce Order E2E Lifecycle

**User Journeys Covered**: Journey 9.2 (E-Commerce Order Lifecycle — All Users), Journey 10.3 (E-Commerce Module Roles)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Storefront on published sites (LAUNCH-01 Task 6), E-Commerce dashboard (LAUNCH-05)

---

## Pre-Implementation: Read These Files First

```
memory-bank/systemPatterns.md (Auth Client Pattern, Notification Pattern)
memory-bank/progress.md (Booking & Ecommerce Module Bugs Fixed, Subdomain Ecommerce Fix)
docs/USER-JOURNEYS.md (Journey 9.2, Journey 10.3, Appendix D — Payment Providers)
```

---

## Context

The e-commerce order lifecycle spans 4 user types:
1. **Agency Owner** → Set up store (products, categories, settings, payment providers)
2. **Anonymous Visitor** → Browse, add to cart, checkout, pay
3. **Agency Owner/Admin** → Process orders, fulfill, ship
4. **Portal Client** → View orders and invoices (if permitted)

All e-commerce data lives in `mod_ecom_*` tables. Payment providers: Paddle, Flutterwave, Pesapal, DPO Pay, Manual.

---

## Task 1: Store Setup (Agency Owner)

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/ecommerce/page.tsx`
- `src/app/(dashboard)/dashboard/[siteId]/ecommerce/page.tsx` (alternate route)
- `src/modules/ecommerce/components/*` (dashboard components)
- `src/modules/ecommerce/actions/ecommerce-actions.ts`
- `src/modules/ecommerce/context/*`
- `src/modules/ecommerce/components/onboarding/OnboardingWizard.tsx`
- `src/modules/ecommerce/components/dialogs/ecommerce-settings-dialog.tsx`

### Requirements
1. **Module access guard**: E-Commerce page only if module installed
2. **Onboarding wizard**: First-time store setup (name, currency, tax rate, first product)
3. **Product management**: CRUD for products (name, description, price, images, variants, stock, slug)
4. **Category management**: CRUD for categories
5. **Inventory management**: Track stock levels, low stock alerts
6. **Discount management**: Create/edit discount codes
7. **Payment provider setup**: Configure Paddle, Flutterwave, Pesapal, DPO Pay, Manual
8. **Shipping settings**: Shipping zones, rates, free shipping threshold
9. **Tax settings**: Tax rate, tax included in price toggle
10. **Store settings**: Store name, currency (should default to ZMW), policies
11. **All pricing in ZMW**: `formatCurrency()` from locale-config
12. **Settings save real**: `updateSettings()` saves to DB (was fixed in FIX-07)

### What to Fix
- If product CRUD doesn't save — wire to real `mod_ecom_products` table
- If category CRUD doesn't save — wire to real table
- If discount codes don't save — wire to real table
- If payment provider config doesn't save — wire to real settings
- If onboarding wizard doesn't save — wire to real DB
- If settings dialog is still mocked — verify FIX-07 fix is in place
- If pricing shows `$` — change to `formatCurrency()`
- If currency dropdown hardcoded — use `SUPPORTED_CURRENCIES`

### Verification
```
□ Onboarding wizard → Sets up store in DB
□ Create product → Saved with all fields
□ Create category → Saved
□ Create discount → Saved with rules
□ Payment provider configured
□ Shipping rates saved
□ Tax settings saved
□ All pricing in ZMW
□ Settings save correctly (no mock)
```

---

## Task 2: Public Storefront (Anonymous Visitor)

### Files to Audit
- `src/modules/ecommerce/studio/components/product-grid-block.tsx`
- `src/modules/ecommerce/studio/components/product-card-block.tsx`
- `src/modules/ecommerce/hooks/useStorefrontProducts.ts`
- `src/modules/ecommerce/hooks/useStorefrontProduct.ts`
- `src/modules/ecommerce/hooks/useStorefrontCategories.ts`
- `src/modules/ecommerce/hooks/useStorefrontCart.ts`
- `src/modules/ecommerce/hooks/useStorefrontSearch.ts`
- `src/modules/ecommerce/hooks/useStorefrontWishlist.ts`
- `src/modules/ecommerce/hooks/useRecentlyViewed.ts`
- `src/modules/ecommerce/actions/public-ecommerce-actions.ts`
- Cart/checkout components

### Requirements
1. **Product listing**: `getPublicProducts()` returns real products using admin client
2. **Product detail**: `getPublicProductBySlug()` returns full product data
3. **Category filtering**: Real categories from `getPublicCategories()`
4. **Search**: Product search returns matching results
5. **Wishlist**: Add/remove from wishlist (localStorage + optional DB)
6. **Recently viewed**: Track recently viewed products
7. **Add to cart**: `addToPublicCart()` creates/updates cart
8. **Cart management**: Update quantities, remove items, apply discount code
9. **Cart persistence**: Cart persists via cookies/localStorage
10. **All hooks use admin client**: Import from `public-ecommerce-actions.ts`
11. **Demo data**: ONLY when `!siteId` (Studio editor)
12. **Pricing**: All in `formatCurrency()` from locale-config

### What to Fix
- If any hook uses `createClient()` — must import from `public-ecommerce-actions.ts`
- If products show demo data on live site — verify `siteId` guard
- If cart doesn't persist — check cookie/localStorage implementation
- If discount validation is mocked — wire to real discount table
- If pricing shows `$` — change to `formatCurrency()`

### Verification
```
□ Product grid shows real products on published site
□ Product detail page works
□ Category filtering works
□ Search returns real results
□ Add to cart works
□ Cart persists across page refreshes
□ Discount code validates against real discounts
□ All pricing in ZMW
□ Demo data only in Studio editor
```

---

## Task 3: Checkout & Payment

### Files to Audit
- `src/app/api/modules/ecommerce/checkout/route.ts`
- `src/modules/ecommerce/actions/public-ecommerce-actions.ts` (checkout functions)
- `src/app/api/webhooks/payment/route.ts` (or provider-specific routes)
- `src/app/api/webhooks/paddle/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- Payment provider integration files

### Requirements
1. **Checkout page**: Collects shipping info, billing info
2. **Shipping calculation**: Based on address + shipping zone (only when address provided — FIX-05)
3. **Tax calculation**: Based on store tax rate settings
4. **Order total**: Subtotal + tax + shipping - discount
5. **Payment methods**: Paddle, Flutterwave, Pesapal, DPO Pay, Manual
6. **Payment processing**: Redirect to payment provider → process → return
7. **Order creation**: `createPublicOrderFromCart()` → saves to DB with admin client
8. **Webhook handling**: Payment webhooks update order status using `createAdminClient()`
9. **Order confirmation page**: Shows order number, details
10. **All amounts in ZMW**: Including checkout totals

### What to Fix
- If checkout uses `createClient()` — change to `createAdminClient()` (was fixed in subdomain fix session)
- If webhooks use `createClient()` — change to `createAdminClient()` (was fixed)
- If shipping calculates with empty address — verify FIX-05 guard is in place
- If tax isn't calculated — use store tax rate
- If manual payment doesn't work — implement offline order creation
- If order confirmation page is missing — create or verify

### Verification
```
□ Checkout collects shipping + billing info
□ Shipping calculated correctly (or $0 with empty address)
□ Tax calculated from store settings
□ Order total correct (subtotal + tax + shipping - discount)
□ Payment flow works (at least one provider)
□ Webhook updates order status in DB
□ Order confirmation page shows details
□ All amounts in ZMW
□ Works on subdomain (admin client)
```

---

## Task 4: Order Management (Agency Dashboard)

### Files to Audit
- E-Commerce dashboard order management components
- `src/modules/ecommerce/actions/ecommerce-actions.ts` (order functions)
- Order status management
- Fulfillment flow

### Requirements
1. **Order list**: All orders from DB with search, filter, sort
2. **Order detail**: Customer info, items, totals, payment status, shipping info
3. **Update order status**: pending → processing → shipped → delivered → completed
4. **Fulfillment**: Mark items as fulfilled, add tracking number
5. **Ship notification**: `notifyOrderShipped()` → email to customer (order_shipped_customer)
6. **Cancel order**: Cancel with refund handling
7. **Order analytics**: Revenue, order count, average order value — all real data
8. **Export**: Export orders to CSV
9. **No hardcoded user IDs**: Was fixed in deep audit (userId = 'user-id' literal removed)

### What to Fix
- If order list shows mock data — query from real orders table
- If status updates don't save — wire to real DB update
- If ship notification doesn't trigger — call `notifyOrderShipped()`
- If analytics uses mock data — query real order aggregations
- If export is stubbed — implement CSV generation
- If hardcoded user IDs remain — replace with real auth user

### Verification
```
□ Order list shows real orders
□ Order detail shows all info
□ Status update → Saved to DB
□ Mark as shipped → Customer email sent
□ Order analytics show real numbers
□ Export produces real CSV
□ No hardcoded user IDs
```

---

## Task 5: Customer Notification Chain

### Files to Audit
- `src/lib/services/business-notifications.ts` (`notifyNewOrder`, `notifyOrderShipped`)
- `src/lib/email/templates.ts` (order templates)
- `src/lib/email/email-types.ts` (order types)
- `src/modules/ecommerce/actions/ecommerce-actions.ts` (notification calls)

### Requirements
1. **New order**: In-app notification to owner + email to owner + email to customer
2. **Order shipped**: Email to customer with tracking info
3. **Email templates**: HTML with order details, items, totals, tracking
4. **Email sender**: From `noreply@app.dramacagency.com`
5. **No duplicate emails**: `createNotification()` is in-app only
6. **Order amounts in ZMW**: In email templates too

### What to Fix
- If `notifyNewOrder()` isn't called after order creation — wire it
- If `notifyOrderShipped()` isn't called after fulfillment — wire it
- If email templates show `$` — use ZMW in templates
- If tracking info not included in shipped email — add it

### Verification
```
□ New order → Owner in-app notification
□ New order → Owner email with order details
□ New order → Customer confirmation email
□ Shipped → Customer email with tracking
□ No duplicate emails
□ All amounts in ZMW in emails
```

---

## Task 6: E-Commerce Module Roles

### Requirements
1. **Admin (100)**: Full access
2. **Store Manager (75)**: Products, orders, inventory, discounts
3. **Order Manager (50)**: Order processing, fulfillment, refunds
4. **Inventory Manager (50)**: Stock management, product updates
5. **Viewer (10)**: Read-only

### What to Fix
- If roles aren't enforced — add role checks
- If all users see everything — implement role-based UI filtering

### Verification
```
□ Admin can manage everything
□ Store Manager can manage products + orders
□ Order Manager can only manage orders
□ Viewer is read-only
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 6 tasks verified
□ Complete e-commerce lifecycle works:
  □ Owner sets up store with products
  □ Visitor browses products on published site
  □ Visitor adds to cart and checks out
  □ Payment processes correctly
  □ Order created in DB
  □ Owner receives notification + email
  □ Customer receives confirmation email
  □ Owner processes and ships order
  □ Customer receives shipping email
□ All pricing in ZMW
□ No mock data on published storefront
□ Subdomain checkout works (admin client)
□ Webhooks update order status
```

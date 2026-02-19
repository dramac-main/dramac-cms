# DRAMAC CMS — E-Commerce Module: Complete User Journey Guide

**Date:** February 19, 2026  
**Scope:** Every user journey in the E-Commerce Dashboard Module + Studio Editor Components  
**Purpose:** Step-by-step guide to manually test every feature, field, and interaction

---

## Table of Contents

1. [Prerequisites & Access](#1-prerequisites--access)
2. [Journey 1: First-Time Onboarding Wizard](#2-journey-1-first-time-onboarding-wizard)
3. [Journey 2: Home Dashboard Overview](#3-journey-2-home-dashboard-overview)
4. [Journey 3: Product Management (Full CRUD)](#4-journey-3-product-management-full-crud)
5. [Journey 4: Category Management](#5-journey-4-category-management)
6. [Journey 5: Order Management & Fulfillment](#6-journey-5-order-management--fulfillment)
7. [Journey 6: Customer Management (CRM)](#7-journey-6-customer-management-crm)
8. [Journey 7: Discount & Coupon Management](#8-journey-7-discount--coupon-management)
9. [Journey 8: Quotation System (B2B)](#9-journey-8-quotation-system-b2b)
10. [Journey 9: Inventory Management](#10-journey-9-inventory-management)
11. [Journey 10: Analytics Dashboard](#11-journey-10-analytics-dashboard)
12. [Journey 11: Store Settings (All 10 Tabs)](#12-journey-11-store-settings-all-10-tabs)
13. [Journey 12: Marketing Features](#13-journey-12-marketing-features)
14. [Journey 13: Developer Tools (API Keys & Webhooks)](#14-journey-13-developer-tools-api-keys--webhooks)
15. [Journey 14: Studio Editor — E-Commerce Components](#15-journey-14-studio-editor--e-commerce-components)
16. [Journey 15: Public Storefront — Customer Shopping Flow](#16-journey-15-public-storefront--customer-shopping-flow)
17. [Journey 16: Checkout & Payment Flow](#17-journey-16-checkout--payment-flow)
18. [Journey 17: Embed Code & External Integration](#18-journey-17-embed-code--external-integration)
19. [Known Issues & Missing Features](#19-known-issues--missing-features)

---

## 1. Prerequisites & Access

### How to Access the E-Commerce Module

1. **Log in** to DRAMAC CMS at your dashboard URL
2. Navigate to **Dashboard → Sites** 
3. **Click on a site** that has the e-commerce module installed
4. On the site detail page, look for the **"ecommerce" tab** in the tab bar
5. Inside the tab, click the **"Open Store Dashboard"** button
6. **URL pattern:** `/dashboard/sites/{siteId}/ecommerce`
7. You can jump to specific views: `/dashboard/sites/{siteId}/ecommerce?view=products`

### If E-Commerce is NOT Installed

- You must first **install the e-commerce module** on the site from the Modules Marketplace
- After installation, the module's `onInstall` hook automatically:
  - Creates 4 pages (Shop, Cart, Checkout, Order Confirmation)
  - Adds navigation items (Shop link + Cart icon)
  - Applies default store settings (ZMW currency, 16% VAT, etc.)
- After installation, navigating to the e-commerce dashboard triggers the **Onboarding Wizard**

---

## 2. Journey 1: First-Time Onboarding Wizard

> **When it appears:** Automatically on first visit to the E-Commerce Dashboard (if onboarding not completed)  
> **Appearance:** Full-screen overlay modal with a white card (max-width 2xl)  
> **Skip option:** "Skip All" button with confirmation dialog

### Step 1 of 6: Store Basics — "Let's set up your store"

**Icon:** Blue Store icon at top

| # | Field | Label | Type | Required | Default | Placeholder | What to Enter |
|---|-------|-------|------|----------|---------|-------------|---------------|
| 1 | `storeName` | Store Name | Text input | **Yes** | Empty | — | Your store name (e.g., "DRAMAC Shop") |
| 2 | `storeDescription` | Store Description | Text input | No | Empty | — | Brief store description |
| 3 | `contactEmail` | Contact Email | Email input (with Mail icon) | **Yes** | Empty | — | Your store email |
| 4 | `contactPhone` | Contact Phone | Text input (with Phone icon) | No | Empty | `+260 97 1234567` | Your phone number |
| 5 | `logoUrl` | Store Logo | Drag-and-drop upload area | No | Empty | "Click to upload or drag and drop" | Upload your logo |

**Actions:**
- **Continue** → Saves step data and advances to Step 2
- **Skip** → Marks step as skipped, advances

**Test Checklist:**
- [ ] Can you submit with just storeName and contactEmail?
- [ ] Does leaving storeName empty prevent continuing?
- [ ] Does leaving contactEmail empty prevent continuing?
- [ ] Does the logo upload area work?

---

### Step 2 of 6: Currency & Tax Settings — "Currency & Tax Settings"

**Icon:** Green Coins icon

| # | Field | Label | Type | Required | Default | Options/Placeholder |
|---|-------|-------|------|----------|---------|---------------------|
| 1 | `currency` | Currency | Select dropdown | Yes | `USD` | 14 currencies: USD, EUR, GBP, ZMW, ZAR, KES, NGN, GHS, TZS, UGX, BWP, MWK, JPY, CAD |
| 2 | `currencySymbol` | Currency Symbol | Text input | Yes | `$` | Auto-updates when currency changes |
| 3 | `currencyPosition` | Currency Position | 2-button selector | Yes | `before` | "before" ($99.00) or "after" (99.00$) — shows live preview |
| 4 | `taxEnabled` | Enable Tax Collection | Switch toggle | No | `false` | — |
| 5 | `taxRate` | Tax Rate | Number input (with %) | Conditional | Empty | "0" — only shown when taxEnabled is ON |
| 6 | `taxIncludedInPrice` | Tax Included in Prices | Switch toggle | No | `false` | Only shown when taxEnabled is ON |

**Test Checklist:**
- [ ] Change currency to ZMW — does the symbol auto-update to "K"?
- [ ] Toggle currency position — does the preview text update live?
- [ ] Enable tax — do the rate and included fields appear?
- [ ] Enter 16 as tax rate — does it accept?

---

### Step 3 of 6: Shipping Configuration — "Shipping Configuration"

**Icon:** Purple Truck icon

| # | Field | Label | Type | Required | Default | Notes |
|---|-------|-------|------|----------|---------|-------|
| 1 | `shippingEnabled` | Enable Shipping | Switch toggle (in card) | No | `true` | Master toggle |
| 2 | `defaultShippingRate` | Default Shipping Rate | Number input with currency prefix | No | Empty | Only when shipping enabled |
| 3 | `freeShippingEnabled` | Enable Free Shipping | Switch toggle (in gift card) | No | `false` | Only when shipping enabled |
| 4 | `freeShippingThreshold` | Free Shipping Above | Number input with currency prefix | No | Empty | Only when free shipping enabled |

**Test Checklist:**
- [ ] Disable shipping — do rate fields disappear?
- [ ] Enable shipping, set rate to 50 — is the currency prefix correct?
- [ ] Enable free shipping — does the threshold field appear?
- [ ] Currency prefix should match Step 2's currency symbol

---

### Step 4 of 6: Payment Methods — "Payment Methods"

**Icon:** Emerald CreditCard icon

| # | Field | Label | Type | Notes |
|---|-------|-------|------|-------|
| 1 | `paymentsConfiguredLater` | Configure Later | Yellow toggle card | If ON, skips all provider setup |
| 2 | `paymentProviders` | Payment Providers | Toggleable provider cards | 4 options, each with external link |
| 3 | `manualOrdersEnabled` | Accept Manual/Bank Transfers | Toggle | Included in provider cards |

**Available Providers:**

| Provider | Region | Description |
|----------|--------|-------------|
| Flutterwave | Africa-wide | Card, Mobile Money, Bank Transfer |
| Pesapal | East Africa | M-Pesa, Airtel Money, Card |
| Paddle | Global | International cards + PayPal |
| Manual/Bank Transfer | Anywhere | Bank details + manual confirmation |

**Test Checklist:**
- [ ] Toggle "Configure Later" — do provider cards disappear?
- [ ] Toggle each provider on/off — do they toggle independently?
- [ ] Are external setup links clickable (opens new tab)?
- [ ] Can you proceed without any provider selected?

---

### Step 5 of 6: First Product — "Add Your First Product"

**Icon:** Orange Package icon

| # | Field | Label | Type | Required | Notes |
|---|-------|-------|------|----------|-------|
| 1 | Choice | Add Product / Skip | Two buttons | Pick one | "Add Product" shows the form, "Skip" skips |
| 2 | `name` | Product Name | Text input | **Yes** (if adding) | — |
| 3 | `price` | Price | Number input with currency prefix | **Yes** (if adding) | Currency from Step 2 |
| 4 | `description` | Description | Textarea | No | — |
| 5 | `imageUrl` | Product Image | Upload | No | — |

**Test Checklist:**
- [ ] Click "Skip for Now" — does it advance to Step 6?
- [ ] Click "Add Product" — does the form appear?
- [ ] Leave name empty — can you still continue?
- [ ] Enter product details and continue — does it save?

---

### Step 6 of 6: Launch — "Ready to Launch!"

**Icon:** Gradient blue-purple Rocket icon

**This step is READ-ONLY — a review screen:**
- Progress bar showing completion percentage
- **5-item checklist:** Store Basics ✓/○, Currency & Tax ✓/○, Shipping ✓/○, Payments ✓/○, First Product ✓/○
- **Summary table** showing all values entered across steps

**Actions:**
- **"Launch Your Store"** button → Calls `completeOnboarding()` → Converts all data to store settings → Redirects to Dashboard Home view

**Test Checklist:**
- [ ] Does the checklist show green checks for completed steps?
- [ ] Does the checklist show gray circles for skipped steps?
- [ ] Is the summary accurate (currency, tax rate, shipping rate, store name)?
- [ ] Does "Launch Your Store" take you to the E-Commerce Dashboard?
- [ ] On subsequent visits, does the onboarding NOT appear again?

---

## 3. Journey 2: Home Dashboard Overview

> **Navigation:** Sidebar → Home (or visit `/dashboard/sites/{siteId}/ecommerce?view=home`)

### What You Should See

#### A. Stats Cards (Top Row — 5 Cards)

| Card | Metric | Sub-detail |
|------|--------|-----------|
| Total Revenue | Total revenue amount | Revenue change % vs previous period |
| Total Orders | Order count | Pending orders badge |
| Total Products | Product count | Active / Draft breakdown |
| Low Stock | Low stock product count | — |
| Total Customers | Customer count | New this week |

**Test Checklist:**
- [ ] Are all 5 stat cards visible?
- [ ] Does the period selector dropdown work (change to different period)?
- [ ] Do numbers update when period changes?
- [ ] If no orders exist, do cards show 0 gracefully?

#### B. Recent Orders Widget (Left Column, 2/3 Width)

- Shows last 5 orders
- Each row: order number, customer email, amount, status badge, "View Order" button
- "View All" link at bottom

**Test Checklist:**
- [ ] Are orders displayed? (If none exist: does it show empty state?)
- [ ] Click "View Order" on any order → does the Order Detail Dialog open?
- [ ] Click "View All" → does it navigate to the Orders view?

#### C. Activity Feed (Right Column, 1/3 Width)

- Shows last 20 activity items (scrollable, max-height 400px)
- Each item: type icon, title, description, timestamp

**Test Checklist:**
- [ ] Is the activity feed visible?
- [ ] Does it scroll if more than a few items?
- [ ] Are timestamps formatted correctly?

#### D. Low Stock Alerts (Bottom, Full Width)

- Shows top 5 low-stock products
- Each: product name, SKU, current stock, "View Product" button
- "View All" link

**Test Checklist:**
- [ ] Are low stock items shown? (If none: does it show a message?)
- [ ] Click "View Product" → does the product detail dialog open?
- [ ] Click "View All" → does it navigate to Products view?

---

## 4. Journey 3: Product Management (Full CRUD)

> **Navigation:** Sidebar → Products

### 3A. Empty State (No Products)

**You should see:**
- Package icon
- "No products yet" heading
- Two buttons: **"Add Product"** and **"Import from CSV"**

### 3B. Creating a Product

**Trigger:** Click "Add Product" button (header or empty state)  
**Dialog:** `CreateProductDialog` — a modal form

| # | Field | Label | Type | Required | Default | Placeholder | Validation |
|---|-------|-------|------|----------|---------|-------------|------------|
| 1 | `images` | Product Images | Image gallery upload | No | `[]` | Drop zone | Max 10 images |
| 2 | `name` | Product Name | Text input | **Yes** | Empty | "Enter product name" | Cannot be empty |
| 3 | `slug` | URL Slug | Text input | No | Auto-generated from name | "product-url-slug" | Auto-fills when name typed |
| 4 | `shortDescription` | Short Description | Text input | No | Empty | "Brief product summary" | — |
| 5 | `description` | Full Description | Textarea (4 rows) | No | Empty | "Detailed product description" | — |
| 6 | `basePrice` | Price | Number (step 0.01, min 0, with $ prefix) | **Yes** | Empty | "0.00" | Must be ≥ 0 |
| 7 | `compareAtPrice` | Compare at Price | Number (step 0.01, min 0, with $ prefix) | No | Empty | "0.00" | Optional strikethrough price |
| 8 | `sku` | SKU | Text input | No | Empty | "Stock Keeping Unit" | — |
| 9 | `quantity` | Quantity | Number (min 0) | No | `0` | — | Disabled if trackInventory is off |
| 10 | `trackInventory` | Track Inventory | Switch toggle | No | `true` | — | Controls quantity field |
| 11 | `status` | Status | Select dropdown | No | `draft` | Options: Draft / Active / Archived | — |

**Buttons:** Cancel (outline) | Create Product (with loading spinner)

**Test Checklist:**
- [ ] Open dialog — are all 11 fields visible?
- [ ] Type a product name — does the slug auto-generate?
- [ ] Set a price — does it accept decimal values?
- [ ] Toggle trackInventory OFF — does the quantity field become disabled?
- [ ] Leave name empty and submit — is it blocked?
- [ ] Leave price empty and submit — is it blocked?
- [ ] Upload an image — does it appear in the gallery?
- [ ] Set status to "Active" — submit — does the product appear in the table?
- [ ] After creation, does the products table refresh and show the new product?

### 3C. Products Data Table

**Columns visible:**
- Product image thumbnail
- Name
- SKU
- Price
- Stock quantity
- Status badge (Draft/Active/Archived)
- Actions menu (⋯)

**Per-Row Actions (⋯ dropdown):**

| Action | What Happens |
|--------|-------------|
| **View** | Opens `ViewProductDialog` — read-only product details |
| **Edit** | Opens `EditProductDialog` — same fields as Create, pre-populated |
| **Duplicate** | Creates a copy of the product |
| **Archive** | Sets product status to `archived` |
| **Delete** | Confirmation prompt → permanently deletes product |

**Test Checklist:**
- [ ] Can you see all products in the table?
- [ ] Click ⋯ → View → does the view dialog show all product details?
- [ ] Click ⋯ → Edit → are fields pre-populated with current values?
- [ ] Edit the name and save → does the table update?
- [ ] Click ⋯ → Duplicate → does a copy appear?
- [ ] Click ⋯ → Archive → does the status change?
- [ ] Click ⋯ → Delete → does a confirmation appear? Confirm → is it deleted?

### 3D. Viewing a Product (ViewProductDialog)

**Displays (read-only):**
- Image gallery (scrollable)
- SKU, URL Slug
- Full description, short description
- Base price (displayed divided by 100)
- Compare at price (if set) with "% off" badge
- Track inventory: yes/no
- Quantity (red if ≤ low_stock_threshold)
- Low stock threshold
- Weight + unit
- Is taxable
- Is featured
- Created at / Updated at timestamps
- **"Edit Product"** button (if callback provided)

### 3E. Editing a Product (EditProductDialog)

**Same fields as Create dialog, pre-populated from the product**
- Prices are displayed divided by 100 (the dialog divides `base_price/100` for display)
- On save, the price is multiplied by 100 again for storage

### 3F. Product Import (CSV)

**Trigger:** Click "Import from CSV" button  
**Dialog:** `ImportProductsDialog` — 4-step wizard

**Step 1 — Upload:**
- Drag-and-drop zone for `.csv` files
- **"Download Template"** button generates a CSV template with headers:
  - Required: `name`, `base_price` (or `price`)
  - Optional: `sku`, `description`, `compare_at_price`, `quantity`, `category`, `status`, `images`, `track_inventory`, `low_stock_threshold`

**Step 2 — Preview:**
- Table showing first 100 rows (Name, SKU, Price, Quantity, Status)
- "Change file" link to go back

**Step 3 — Importing:**
- Spinner + progress indicator

**Step 4 — Complete:**
- Shows: Imported count, Skipped count, Errors count
- Scrollable error list if any

**Test Checklist:**
- [ ] Download the CSV template — does it have the correct headers?
- [ ] Fill in 2–3 products and upload — does the preview show them?
- [ ] Click "Import" — does it process?
- [ ] After import, are the products visible in the products table?

### 3G. Product Export

**Trigger:** Export button in the header  
**Exports CSV with columns:** name, sku, description, base_price, compare_at_price, quantity, status  
**Auto-downloads** the file

**Test Checklist:**
- [ ] Click Export — does a CSV download?
- [ ] Open the CSV — are all products listed with correct data?

---

## 5. Journey 4: Category Management

> **Navigation:** Sidebar → Categories

### 4A. Empty State

- Folder tree icon + "No categories found"
- **"Add Category"** button

### 4B. Creating a Category

**Trigger:** Click "Add Category" (header or empty state)  
**Dialog:** `CreateCategoryDialog`

| # | Field | Label | Type | Required | Default | Placeholder |
|---|-------|-------|------|----------|---------|-------------|
| 1 | `name` | Category Name | Text input | **Yes** | Empty | "Enter category name" |
| 2 | `slug` | URL Slug | Text input | No | Auto from name | "category-url-slug" |
| 3 | `selectedParentId` | Parent Category | Select dropdown | No | `null` | "None (Top Level)" + list of existing top-level categories |
| 4 | `description` | Description | Textarea (3 rows) | No | Empty | "Optional category description" |

**Buttons:** Cancel | Create Category

**Test Checklist:**
- [ ] Create a top-level category (no parent) — does it appear in the table?
- [ ] Create a subcategory by selecting a parent — does it appear indented under the parent?
- [ ] Does the slug auto-generate from the name?
- [ ] Can you submit without a name? (Should be blocked)

### 4C. Categories Table (Tree Structure)

**Columns:**

| Column | Description |
|--------|-------------|
| **Name** | Indented tree hierarchy with expand/collapse chevrons + folder icons |
| **Slug** | URL-safe slug in monospace |
| **Products** | Badge showing product count |
| **Status** | "Active" (green) or "Hidden" (gray) badge |
| **Actions** | ⋯ dropdown menu |

**Tree Behavior:**
- Root categories at top level
- Child categories indented (24px per nesting level)
- Expand/collapse button for categories with children
- Folder icon changes from closed → open

**Per-Row Actions (⋯ dropdown):**

| Action | What Happens |
|--------|-------------|
| **View Products** | (Placeholder — should filter products by category) |
| **Edit** | Opens `EditCategoryDialog` |
| **Add Subcategory** | Opens `CreateCategoryDialog` with parent pre-selected |
| **Delete** | Confirmation → deletes category |

**Test Checklist:**
- [ ] Are categories displayed in a tree structure?
- [ ] Click expand/collapse on a parent category — do children show/hide?
- [ ] Does the folder icon change state?
- [ ] Edit a category — does the name update in the table?
- [ ] Add a subcategory from the dropdown — is the parent pre-selected?
- [ ] Delete a category — does it disappear?

---

## 6. Journey 5: Order Management & Fulfillment

> **Navigation:** Sidebar → Orders

### 5A. Filters Bar

| Filter | Type | Options |
|--------|------|---------|
| **Status** | Select dropdown | All Status / Pending / Confirmed / Processing / Shipped / Delivered / Cancelled / Refunded |
| **Payment** | Select dropdown | All Payments / Pending / Paid / Partial Refund / Refunded / Failed |
| **Search** | Text input | Searches order number and customer email |

### 5B. Orders Table

| Column | Data Shown |
|--------|-----------|
| **Order** | Order number (#XXXX) + item count |
| **Date** | Formatted date with time |
| **Customer** | Email + phone (if available) |
| **Status** | Color badge — Pending (yellow), Confirmed (blue), Processing (purple), Shipped (indigo), Delivered (green), Cancelled (gray), Refunded (red) |
| **Payment** | Color badge — Pending (yellow), Paid (green), Partial Refund (orange), Refunded (red), Failed (red) |
| **Total** | Formatted currency amount + currency code |
| **Actions** | ⋯ dropdown |

**Per-Row Actions (⋯ dropdown):**

| Action | What Happens |
|--------|-------------|
| **View Details** | Opens `OrderDetailDialog` modal |
| **Confirm** | Changes status to `confirmed` |
| **Mark Processing** | Changes status to `processing` |
| **Mark Shipped** | Changes status to `shipped` |
| **Mark Delivered** | Changes status to `delivered` |
| **Cancel Order** (destructive) | Changes status to `cancelled` |

### 5C. Order Detail Dialog (Modal)

**3 Tabs:**

#### Tab 1: Details
- **Order summary card**: total, item count, payment status badge
- **Order Items Table**: product name, image, SKU, quantity, unit price, line total
- **Customer Panel**: customer name, email, phone, shipping address, billing address

#### Tab 2: Timeline
- Chronological event entries with icons
- Each entry: event type, title, description, actor name, timestamp
- Events include: created, status changes, notes, emails sent

#### Tab 3: Invoice
- Full invoice template with store info, customer info, items table, totals
- **"Print Invoice"** button (opens browser print dialog in popup)

**Header Actions:**
- **Status dropdown** — change order status
- **Print Invoice** — opens popup print window
- **Print Packing Slip** — opens popup print window
- **Resend Confirmation** — sends confirmation email
- **Send Shipping Update** — sends shipping notification
- **Process Refund** — opens `RefundDialog`

**Test Checklist:**
- [ ] Create a test order (via the storefront checkout flow)
- [ ] Find it in the Orders table — is the status "pending"?
- [ ] Filter by status "Pending" — does it show?
- [ ] Click ⋯ → View Details — does the dialog open?
- [ ] Check the Details tab — are order items, amounts, and customer info correct?
- [ ] Check the Timeline tab — is the "Order created" event shown?
- [ ] Check the Invoice tab — does it render properly?
- [ ] Click "Print Invoice" — does the print dialog open?
- [ ] Close the dialog
- [ ] Change status: ⋯ → Confirm → does the badge change to blue "Confirmed"?
- [ ] Change status: ⋯ → Mark Processing → does badge change to purple?
- [ ] Change status: ⋯ → Mark Shipped → does badge change to indigo?
- [ ] Change status: ⋯ → Mark Delivered → does badge change to green?
- [ ] Reopen the detail dialog — does the Timeline show all status change events?
- [ ] Filter by Payment Status "Paid" — does it filter correctly?
- [ ] Search by order number — does it find it?
- [ ] Search by customer email — does it find it?
- [ ] Test "Cancel Order" — does it show a confirmation? Does the badge change to gray?

---

## 7. Journey 6: Customer Management (CRM)

> **Navigation:** Sidebar → Customers

### 6A. Stats Cards (Top Row — 4 Cards)

| Card | Metric | Sub-detail |
|------|--------|-----------|
| Total Customers | Count | "X new this month" |
| Active Customers | Count | "X% of total" |
| With Orders | Count | "X% conversion" |
| Total Revenue | Currency amount | "From all customers" |

### 6B. Filters

| Filter | Type | Options |
|--------|------|---------|
| **Search** | Text input (form submit) | "Search customers..." |
| **Status** | Select dropdown | All Status / Active / Inactive / Guest |
| **Has Orders** | Select dropdown | All / Has Orders / No Orders |
| **Marketing** | Select dropdown | All / Subscribed / Not Subscribed |
| **Clear** | Ghost button | Only shown when filters active |

### 6C. Creating a Customer

**Trigger:** Click "Add Customer" button  
**Dialog:** `CreateCustomerDialog`

**Fields to test (based on the Customer type):**
- First name, last name
- Email
- Phone
- Company
- Tags
- Notes

**Test Checklist:**
- [ ] Click "Add Customer" — does the dialog open?
- [ ] Fill in first name, last name, email — submit
- [ ] Does the new customer appear in the table?
- [ ] Does the "Total Customers" stat card increment?

### 6D. Customer Detail Dialog

**Trigger:** Click on a customer row  
**Shows:** Full customer profile with order history, addresses, notes, groups

**Test Checklist:**
- [ ] Click on a customer — does the detail dialog open?
- [ ] Are customer details (name, email, phone, status) displayed?
- [ ] Is the order history shown (if any orders exist)?
- [ ] Can you add a note?
- [ ] Can you navigate to a linked order from the dialog?

### 6E. Import/Export

**Import:**
1. Click "Import" button → hidden file input triggers
2. Select a CSV with headers: `email`, `first_name`/`firstname`, `last_name`/`lastname`, `phone`, `tags`
3. Parses client-side → calls `importCustomers` server action
4. Toast shows: imported/updated/skipped counts

**Export:**
- Dropdown: "Export as CSV" or "Export as Excel"

**Test Checklist:**
- [ ] Prepare a CSV with 2 customers (email, first_name, last_name)
- [ ] Import it — does the toast show the imported count?
- [ ] Are the imported customers in the table?
- [ ] Export as CSV — does a file download?
- [ ] Open the exported CSV — is the data correct?

### 6F. Pagination

- Shown when total > 20 customers
- "Showing X to Y of Z customers"
- Previous / Next buttons

---

## 8. Journey 7: Discount & Coupon Management

> **Navigation:** Sidebar → Discounts

### 7A. Empty State

- Percent icon + "No discounts found"
- **"Add Discount"** button

### 7B. Creating a Discount

**Trigger:** Click "Add Discount"  
**Dialog:** `CreateDiscountDialog`

| # | Field | Label | Type | Required | Default | Placeholder | Notes |
|---|-------|-------|------|----------|---------|-------------|-------|
| 1 | `code` | Discount Code | Text (uppercase, monospace) + **Generate** button | **Yes** | Empty | "SUMMER20" | Generate creates random 8-char code |
| 2 | `description` | Description | Textarea (2 rows) | No | Empty | "Internal description (not shown to customers)" | — |
| 3 | `discountType` | Type | Select dropdown | No | `percentage` | Percentage / Fixed Amount / Free Shipping | — |
| 4 | `discountValue` | Value | Number | **Yes** | Empty | "0" | Prefix changes (% or $), max 100 for percentage, disabled for free shipping |
| 5 | `minimumOrderAmount` | Minimum Order Amount | Number (step 0.01) | No | Empty | "0.00" ($) | — |
| 6 | `usageLimit` | Total Uses | Number (min 0) | No | Empty | "Unlimited" | — |
| 7 | `usageLimitPerUser` | Per Customer | Number (min 0) | No | Empty | "Unlimited" | — |
| 8 | `startsAt` | Start Date | datetime-local | No | Empty | — | — |
| 9 | `endsAt` | End Date | datetime-local | No | Empty | — | — |
| 10 | `isActive` | Active | Switch toggle | No | `true` | — | — |

**Test Checklist:**
- [ ] Click "Generate" button — does a random code appear?
- [ ] Set type to "Percentage", value to 20 — is the prefix "%"?
- [ ] Set type to "Fixed Amount", value to 10 — is the prefix "$"?
- [ ] Set type to "Free Shipping" — is the value field disabled?
- [ ] Set value to 150 with type "Percentage" — is it blocked? (should be ≤ 100)
- [ ] Set a start date and end date
- [ ] Toggle active to OFF
- [ ] Submit — does the discount appear in the table?

### 7C. Discounts Table

| Column | Data |
|--------|------|
| **Code** | Bold monospace code + Copy icon button |
| **Type** | Badge: "Percentage Off" / "Fixed Amount" / "Free Shipping" |
| **Value** | Green text: "X%" or "$X.XX" or "Free Shipping" |
| **Usage** | "X / Y" (if limit) or "X uses" |
| **Valid Period** | Calendar icon + date range |
| **Status** | Badge: Active (green) / Inactive (gray) / Expired (gray) / Upcoming (blue) |
| **Actions** | ⋯ dropdown |

**Status Logic:**
- **Expired:** `ends_at` is in the past → gray, row at 60% opacity
- **Upcoming:** `starts_at` is in the future → blue
- **Active/Inactive:** Based on `is_active` toggle

**Per-Row Actions:**

| Action | What Happens |
|--------|-------------|
| **Copy Code** | Copies discount code to clipboard |
| **Edit** | Opens `EditDiscountDialog` |
| **Activate/Deactivate** | Toggles `is_active` |
| **Delete** | Confirmation → deletes |

**Test Checklist:**
- [ ] Click the Copy icon — does the code copy to clipboard?
- [ ] Click ⋯ → Edit — are fields pre-populated?
- [ ] Change the value and save — does it update?
- [ ] Click ⋯ → Deactivate — does the status badge change to "Inactive"?
- [ ] Click ⋯ → Activate — does it change back to "Active"?
- [ ] Delete a discount — confirmation dialog → discount removed?

---

## 9. Journey 8: Quotation System (B2B)

> **Navigation:** Sidebar → Quotes

### 8A. Stats Row (5 Stats)

| Stat | Color |
|------|-------|
| Total | Default |
| Drafts | Gray |
| Sent | Blue |
| Accepted | Green |
| Converted | Emerald |

### 8B. Creating a Quote

**Trigger:** Click "Create Quote" button  
**Dialog:** `QuoteBuilderDialog` — full quote creation/editing form

**What to test:**
- Adding line items (products from catalog)
- Setting quantities and prices per line item
- Adding discount to the quote
- Setting validity period
- Adding terms and conditions
- Adding customer info (name, email, phone, company)
- Adding notes

### 8C. Quotes Table

- Shows quote summaries
- **Columns:** Quote number, date, items count, status badge, total
- Clicking a row opens `QuoteDetailDialog`

### 8D. Quote Status Workflow (9 States)

```
draft → pending_approval → sent → viewed → accepted → converted
                                        → rejected
                                        → expired
                         → cancelled
```

**Status badges:**
| Status | Color |
|--------|-------|
| Draft | Gray |
| Pending Approval | Amber |
| Sent | Blue |
| Viewed | Indigo |
| Accepted | Green |
| Rejected | Red |
| Cancelled | Gray |
| Expired | Orange |
| Converted | Teal |

### 8E. Quote Detail Dialog

**Displays:**
- Customer info card (name, email, phone, company)
- Quote items with product images, quantities, prices
- Price breakdown (subtotal, discount, tax, shipping, total)
- Terms & conditions
- Activity timeline (who did what, when)

**Actions:**
- **Edit** (opens QuoteBuilderDialog in edit mode)
- **Accept** (dialog with name, email, electronic signature)
- **Reject** (dialog with reason textarea)
- **Print** / **Download**
- **Share** (copies quote link with access_token)
- **Request Revision** (message textarea)

**Test Checklist:**
- [ ] Create a new quote with 2 line items
- [ ] Is the total calculated correctly?
- [ ] Save as draft — does it appear in the quotes table?
- [ ] Open the quote detail — are all items shown?
- [ ] Change status from Draft to Sent
- [ ] Check that the Timeline shows the status change event
- [ ] Click Share — is the link copied?
- [ ] Click Print — does a print dialog open?

---

## 10. Journey 9: Inventory Management

> **Navigation:** Sidebar → Inventory

### 9A. Header Actions

| Button | What Happens |
|--------|-------------|
| **Refresh** | Re-fetches all inventory data |
| **Export** (dropdown) | Export All Inventory CSV / Export Low Stock Items CSV / Export History CSV |
| **Settings** | Navigates to Settings view → Inventory tab |

### 9B. Summary Cards (4 Cards)

| Card | Metric | Sub-detail |
|------|--------|-----------|
| Total Products | Count | "X units" total quantity |
| Inventory Value | Cost value (currency) | "X potential profit" (green) |
| Low Stock | Low + critical count (yellow) | "X critical" |
| Out of Stock | Count (red) | "products unavailable" |

### 9C. Four Tabs

#### Tab: Overview
- **Stock Alert Widget** (1/3 width) — compact alert list
- **Stock Distribution Card** (2/3 width) — 4 progress bars:
  - In Stock (green)
  - Low Stock (yellow)
  - Critical Stock (orange)
  - Out of Stock (red)

#### Tab: Alerts
- List of alerted products with:
  - Product image, name, SKU, stock count
  - Badge: "Out of Stock" (red) / "Critical" (orange) / "Low Stock" (yellow)
  - **"Restock"** button per item → opens `StockAdjustmentDialog`
- If all healthy: green icon + "All stock levels healthy"

#### Tab: History
- `InventoryHistoryTable` — all stock movements and adjustments

#### Tab: Valuation
- 3 summary cards: Total Cost Value, Total Retail Value, Potential Profit
- "Value by Category" card listing each category with unit count and value

**Test Checklist:**
- [ ] Navigate to Inventory — are all 4 summary cards shown?
- [ ] Click the "Alerts" tab — are low/out-of-stock products listed?
- [ ] Click "Restock" on a product — does the adjustment dialog open?
- [ ] In the adjustment dialog, add 10 units — does the stock update?
- [ ] Check the "History" tab — is the adjustment logged?
- [ ] Check the "Valuation" tab — is the cost/retail/profit calculated?
- [ ] Export All Inventory as CSV — does a file download?

---

## 11. Journey 10: Analytics Dashboard

> **Navigation:** Sidebar → Analytics

### Revenue Overview Cards (4 Cards)

| Card | Metric | Sub-detail |
|------|--------|-----------|
| Today's Revenue | Currency amount | Order count today |
| This Week | Currency amount | Order count this week |
| This Month | Currency + trend arrow | % growth vs last month (green ↑ / red ↓) |
| Avg. Order Value | Currency amount | Order count this month |

### Quick Stats (3 Cards)

| Card | Content |
|------|---------|
| Products | Active count + Low Stock Items badge |
| Orders | Total + This Month count |
| Top Products | Top 3 by revenue (name + revenue badge) |

### Charts (2-Column Grid)

| Chart | Type | Data |
|-------|------|------|
| Revenue (Last 30 Days) | Area Chart (blue gradient) | Daily revenue with tooltip |
| Orders (Last 30 Days) | Bar Chart (green bars) | Daily order count with tooltip |

### Top Products Chart (Full Width)

- Horizontal Bar Chart (purple) — top 5 products by revenue
- Only shown if there are product sales

**Test Checklist:**
- [ ] Navigate to Analytics — are all 4 revenue cards shown?
- [ ] Are the quick stats cards accurate?
- [ ] Are the charts rendering? (If no data: "No analytics data available yet")
- [ ] Hover over chart data points — do tooltips show date + value?
- [ ] Is the trend arrow correct (comparing to previous month)?

---

## 12. Journey 11: Store Settings (All 10 Tabs)

> **Navigation:** Sidebar → Settings

The Settings view has **10 horizontally scrollable tabs**. Test each:

### Tab 1: General

**Card: Store Information**

| Field | Type | Notes |
|-------|------|-------|
| Store Name | Text input | — |
| Store Email | Email input | — |
| Store Phone | Text input | — |

**Card: Store Address**

| Field | Type | Notes |
|-------|------|-------|
| Address Line 1 | Text | — |
| Address Line 2 | Text | Optional |
| City | Text | — |
| State/Province | Text | — |
| Postal Code | Text | — |
| Country | Select dropdown | Country list |

**Card: Regional Settings**

| Field | Type | Options |
|-------|------|---------|
| Timezone | Select | Timezone list |
| Date Format | Select | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD |
| Time Format | Select | 12-hour, 24-hour |
| Weight Unit | Select | kg, lb, g, oz |
| Dimension Unit | Select | cm, in, m, ft |

### Tab 2: Currency

| Field | Type | Notes |
|-------|------|-------|
| Default Currency | Select | Currency list with symbol + name |
| Symbol Position | Select | Before / After |
| Thousands Separator | Select | Comma / Period / Space |
| Decimal Separator | Select | Period / Comma |
| Decimal Places | Number | 0-4 |

### Tab 3: Tax

| Field | Type | Notes |
|-------|------|-------|
| Tax Enabled | Switch | Master toggle |
| Prices Include Tax | Switch | — |
| Tax Calculation | Select | Per line item / Order total |
| Tax Rounding | Select | Round / Ceil / Floor |
| Display Tax Summary | Switch | Show tax breakdown at checkout |
| Tax ID Collection | Switch | Collect tax ID from customers |
| Tax Zones | CRUD table | Add/edit zones with rates |

**Tax Zone Dialog:**
- Zone name
- Countries (multi-select with badges)
- Tax rates (dynamic list): Rate name + Rate % + Tax class

### Tab 4: Shipping

| Field | Type | Notes |
|-------|------|-------|
| Enable Shipping | Switch | — |
| Shipping Calculation | Select | Per order / Per item / Per class |
| Shipping Origin Address | Address fields | Where you ship from |
| Default Package Dimensions | Number inputs | Length, Width, Height (cm), Weight (kg) |
| Shipping Zones | CRUD table | Add zones with methods |

**Shipping Zone Dialog:**
- Zone name
- Regions (multi-select countries)
- Shipping methods: Name, Type (Flat Rate/Free/Local Pickup/Table Rate), Cost, Handling Fee, Free threshold, Min/Max amounts, Delivery time

### Tab 5: Payments

**Payment Gateways Card:**
- CRUD list of gateways with Add/Edit/Toggle

**Gateway Dialog:**

| Field | Type | Notes |
|-------|------|-------|
| Gateway Type | Select | Stripe / PayPal / Manual / COD |
| Display Name | Text | Customer-facing name |
| API Key | Password input | Only for Stripe/PayPal |
| Secret Key | Password input | Only for Stripe/PayPal |
| Webhook Secret | Password input | Only for Stripe/PayPal |
| Test Mode | Switch | Sandbox/live toggle |
| Enabled | Switch | — |
| **Test Connection** | Button | Tests credentials (stub — always succeeds) |

**Payment Options Card:**
- Capture Mode: Automatic / Manual
- Statement Descriptor (max 22 chars)
- Min/Max Order Amount
- Allow Partial Payments switch

### Tab 6: Checkout

**Checkout Options:**
- Guest Checkout (Switch)
- Require Phone (Switch)
- Require Company (Switch)
- Address Autocomplete (Switch)
- Show Order Notes (Switch)

**Express Checkout:**
- Enable Express Checkout (Switch)
- Apple Pay (Checkbox)
- Google Pay (Checkbox)
- PayPal Express (Checkbox)

**Checkout Fields:**
- 12 fields in 3 groups (Billing / Shipping / Order)
- Each field has: Enabled checkbox + Required checkbox
- Fields: first_name, last_name, email, phone, company, address_1, address_2, city, state, postal_code, country, order_notes

### Tab 7: Notifications

| Setting | Type |
|---------|------|
| From Name | Text |
| From Address | Email |
| Logo URL | Text |
| Footer Text | Text |
| 9 notification templates | Toggle on/off each type |
| Admin Notifications | Toggle for low stock, new orders, refunds |

### Tab 8: Inventory

| Setting | Type | Options |
|---------|------|---------|
| Track Inventory | Switch | — |
| Backorder Mode | Select | Don't allow / Allow but notify / Allow silently |
| Hold Stock Minutes | Number | Minutes to reserve stock |
| Low Stock Threshold | Number | Default threshold |
| Out-of-Stock Visibility | Select | Hide / Show / Show (marked) |
| Stock Display | Select | Show quantity / In stock/Out of stock / Hide |
| Reserved Stock Expiry | Number | Minutes |

### Tab 9: Quotes

Quote-specific settings: numbering format, prefix, default validity, automation (auto-expire, reminders), email settings, PDF branding

### Tab 10: Legal

| Setting | Type |
|---------|------|
| Terms & Conditions | Textarea |
| Privacy Policy | Textarea |
| Refund Policy | Textarea |
| Shipping Policy | Textarea |
| Cookie Policy | Textarea |
| GDPR Compliance | Switch |
| Cookie Banner | Switch |
| Data Export | Switch |
| Data Deletion | Switch |
| Age Verification | Switch |

**Test Checklist for ALL tabs:**
- [ ] Can you navigate between all 10 tabs?
- [ ] On mobile, can you scroll through the tab bar?
- [ ] Change a setting in each tab and save — does it persist?
- [ ] Reload the page — are the saved settings still there?
- [ ] Are conditional fields showing/hiding correctly? (e.g., tax rate only when tax enabled)

---

## 13. Journey 12: Marketing Features

> **Navigation:** Sidebar → Marketing

### 12A. Flash Sales

**Creating a Flash Sale:**

| Field | Label | Type | Required |
|-------|-------|------|----------|
| `name` | Sale Name | Text | **Yes** |
| `description` | Description | Textarea | No |
| `discountType` | Discount Type | Select (Percentage / Fixed) | Yes |
| `discountValue` | Value | Number | **Yes** |
| `startDate` | Start Date | Date | **Yes** |
| `startTime` | Start Time | Time | **Yes** |
| `endDate` | End Date | Date | **Yes** (must be after start) |
| `endTime` | End Time | Time | **Yes** |
| `maxUses` | Max Uses | Number | No (unlimited if empty) |

### 12B. Bundles

| Field | Label | Type | Required |
|-------|-------|------|----------|
| `name` | Bundle Name | Text | **Yes** |
| `description` | Description | Textarea | No |
| `sku` | SKU | Text (uppercase, monospace) | No |
| `bundlePrice` | Bundle Price | Number | No |
| `isActive` | Active | Switch | No (default true) |

### 12C. Gift Cards

| Field | Label | Type | Required |
|-------|-------|------|----------|
| `amount` | Amount | Number | **Yes** (>0) |
| `recipientName` | Recipient Name | Text | No |
| `recipientEmail` | Recipient Email | Email | No |
| `message` | Personal Message | Textarea | No |
| `expiresAt` | Expiration Date | Date (min today) | No |

- **Preset amounts:** $25, $50, $100, $250 (click to auto-fill)
- **On success:** Copies gift card code to clipboard

### 12D. Loyalty Program

| Field | Label | Type | Default |
|-------|-------|------|---------|
| `programName` | Program Name | Text | "Rewards Program" |
| `pointsPerDollar` | Points per $1 Spent | Number | 1 |
| `redemptionRate` | Points per $1 Discount | Number | 100 |
| `minRedemption` | Min Points to Redeem | Number | 100 |
| `signupBonus` | Signup Bonus | Number | 50 |
| `referralBonus` | Referral Bonus | Number | 100 |
| `birthdayBonus` | Birthday Bonus | Number | 50 |
| `isActive` | Program Active | Switch | true |

**Live calculation:** "A $100 purchase earns X points" / "X points = $1 discount"

**Adjust Points (per customer):**

| Field | Type | Required |
|-------|------|----------|
| Adjustment Type | Select (Add/Subtract) | Yes |
| Amount | Number (min 1) | **Yes** |
| Reason | Textarea | **Yes** |

**Test Checklist:**
- [ ] Create a flash sale — does it appear in the flash sales list?
- [ ] Create a bundle — does it save?
- [ ] Issue a gift card — is the code copied to clipboard?
- [ ] Set up loyalty program — does the calculation preview update live?
- [ ] Adjust points for a customer — does the balance change?

---

## 14. Journey 13: Developer Tools (API Keys & Webhooks)

> **Navigation:** Sidebar → Developer

### 13A. API Keys

**Creating an API Key:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | **Yes** | e.g., "My Integration" |
| Scopes | Checkbox grid (2-col) | **Yes** (≥1) | Default: `read:products` |
| Expiration | Date (min today) | No | Optional |
| Allowed IPs | Text (comma-separated) | No | e.g., "192.168.1.1, 10.0.0.0/8" |
| Allowed Origins | Text (comma-separated) | No | e.g., "https://myapp.com" |

**After creation:** Shows the secret key ONCE with Copy button + warning it won't be shown again

### 13B. Webhooks

**Creating a Webhook Endpoint:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | **Yes** | — |
| Endpoint URL | URL | **Yes** | — |
| Description | Textarea | No | — |
| Events | Checkbox accordion (grouped by category) | **Yes** (≥1) | — |
| Custom Headers | Dynamic key-value pairs | No | Add/remove buttons |
| Timeout | Number (5-60 seconds) | No | Default: 30 |
| Max Retries | Number (0-10) | No | Default: 3 |

**Test Checklist:**
- [ ] Create an API key — is the secret shown once?
- [ ] Can you copy the secret to clipboard?
- [ ] Create a webhook endpoint — does it appear in the list?
- [ ] Can you toggle events on/off?
- [ ] Can you add custom headers?

---

## 15. Journey 14: Studio Editor — E-Commerce Components

> **Access:** Go to a site → Pages → Edit a page in the Studio Editor  
> **E-Commerce components appear in the component library when the module is installed**

### 14A. Registered Studio Components (4 Drag-and-Drop Components)

#### Component 1: `EcommerceProductCard` — Single Product Card

**How to use:** Drag it onto a page section

**Configurable Properties (in the right settings panel):**

| Property | Type | Default | Options |
|----------|------|---------|---------|
| `productId` | Product Selector (custom field) | — | Opens searchable product picker popover |
| `showPrice` | Toggle | `true` | — |
| `showRating` | Toggle | `true` | — |
| `showButton` | Toggle | `true` | — |
| `showWishlistButton` | Toggle | `true` | — |
| `showQuickView` | Toggle | `true` | — |
| `showStockBadge` | Toggle | `true` | — |
| `showSaleBadge` | Toggle | `true` | — |
| `buttonText` | Text | `"Add to Cart"` | — |
| `variant` | Select | `"card"` | card / horizontal / minimal / compact |
| `imageAspect` | Select | `"square"` | square / portrait / landscape |
| `hoverEffect` | Select | `"zoom"` | none / zoom / lift / shadow |
| `padding` | Slider | `4` | 0–8 |
| `borderRadius` | Slider | `2` | 0–6 |

**Product Selector Field:**
- Opens a popover with search input
- Shows products with: image thumbnail, name, price, SKU, category badge
- Debounced search (300ms)
- Fetches from `/api/studio/modules/ecommerce/products?siteId=X&search=X`
- Demo products shown if no real products exist

**Test Checklist:**
- [ ] Drag `EcommerceProductCard` onto a page — does it render?
- [ ] Click the product selector — does the popover open?
- [ ] Search for a product — do results appear?
- [ ] Select a product — does the card update with real data?
- [ ] Toggle `showPrice` off — does the price disappear?
- [ ] Change `variant` to "horizontal" — does the layout change?
- [ ] Change `imageAspect` to "landscape" — does the image shape change?
- [ ] Change `hoverEffect` to "lift" — hover over the card — does it lift?
- [ ] In quote mode: does the button change to "Request a Quote" (orange)?

#### Component 2: `EcommerceProductGrid` — Product Grid

**Configurable Properties:**

| Property | Type | Default | Options |
|----------|------|---------|---------|
| `columns` | Responsive object | `{mobile:1, tablet:2, desktop:3}` | — |
| `gap` | Slider | `6` | 2–12 |
| `source` | Select | `"category"` | category / featured / new / sale / custom |
| `categoryId` | Category Selector (custom field) | — | Hierarchical tree picker |
| `productIds` | Text | — | Comma-separated product IDs |
| `limit` | Number | `8` | — |
| `showPrice` | Toggle | `true` | — |
| `showRating` | Toggle | `true` | — |
| `cardVariant` | Select | `"card"` | card / minimal |

**Category Selector Field:**
- Opens popover with hierarchical tree
- Shows category name + product count
- "All Categories" option at top
- Parent → child indentation

**Test Checklist:**
- [ ] Drag `EcommerceProductGrid` onto a page
- [ ] Set source to "featured" — do featured products appear?
- [ ] Set source to "category" → select a category — do filtered products appear?
- [ ] Change columns to `{mobile:2, tablet:3, desktop:4}` — does grid adjust?
- [ ] Change `cardVariant` to "minimal" — do cards simplify?
- [ ] Set limit to 4 — do only 4 products show?

#### Component 3: `EcommerceProductCatalog` — Full Catalog with Filters

**Configurable Properties:**

| Property | Type | Default | Options |
|----------|------|---------|---------|
| `columns` | Responsive | `{mobile:1, tablet:2, desktop:3}` | — |
| `showFilters` | Toggle | `true` | — |
| `showSorting` | Toggle | `true` | — |
| `showPagination` | Toggle | `true` | — |
| `showSearch` | Toggle | `true` | — |
| `showResultCount` | Toggle | `true` | — |
| `productsPerPage` | Number | `12` | — |
| `cardVariant` | Select | `"card"` | card / horizontal / minimal / compact |
| `showPrice` | Toggle | `true` | — |
| `showRating` | Toggle | `true` | — |
| `showAddToCart` | Toggle | `true` | — |
| `showWishlist` | Toggle | `true` | — |
| `showQuickView` | Toggle | `true` | — |
| `gap` | Slider | `6` | 2–12 |
| `padding` | Slider | `4` | 0–8 |

**Runtime Features (on published site):**
- **Sort dropdown:** Newest, Price Low→High, Price High→Low, Name A-Z, Best Selling
- **Filter sidebar:** Categories (checkboxes), Price range slider ($0–$10,000), In Stock checkbox, On Sale checkbox
- **Mobile:** Filters in Sheet drawer, grid/list view toggle
- **Pagination:** Page numbers

**Test Checklist:**
- [ ] Drag `EcommerceProductCatalog` onto a page
- [ ] Toggle `showFilters` off — does the filter sidebar disappear?
- [ ] Toggle `showSorting` off — does the sort dropdown disappear?
- [ ] Preview the page — can you sort products?
- [ ] Can you filter by category checkbox?
- [ ] Can you filter by price range?
- [ ] Does pagination work?
- [ ] On mobile preview — do filters appear in a slide-up sheet?

#### Component 4: `EcommerceFeaturedProducts` — Featured/Carousel

**Configurable Properties:**

| Property | Type | Default | Options |
|----------|------|---------|---------|
| `productSource` | Select | `"featured"` | featured / new / bestselling / sale / category / manual |
| `categoryId` | Category Selector | — | Custom field |
| `productIds` | Text | — | Comma-separated (for manual source) |
| `limit` | Number | `8` | — |
| `title` | Text | Auto per source | e.g., "Featured Products", "New Arrivals" |
| `subtitle` | Text | — | — |
| `showTitle` | Toggle | `true` | — |
| `showViewAll` | Toggle | `true` | — |
| `viewAllLink` | Text | `"/shop"` | — |
| `displayMode` | Select | `"carousel"` | carousel / row / hero |
| `columns` | Responsive | `{mobile:1, tablet:2, desktop:4}` | — |
| `cardVariant` | Select | `"card"` | card / horizontal / minimal / compact |
| `autoPlay` | Toggle | `false` | — |
| `autoPlayInterval` | Number | `5000` | ms (only for carousel) |
| `showNavigation` | Toggle | `true` | Arrow buttons (carousel) |
| `showDots` | Toggle | `true` | Dot indicators (carousel) |
| `showPrice` | Toggle | `true` | — |
| `showRating` | Toggle | `true` | — |
| `showAddToCart` | Toggle | `true` | — |
| `showWishlist` | Toggle | `true` | — |

**Display Modes:**
- **Carousel:** Left/right navigation arrows + dot indicators
- **Row:** Static grid (uses columns)
- **Hero:** 1 large product + 4 small in 2×2 grid

**Test Checklist:**
- [ ] Drag `EcommerceFeaturedProducts` onto a page
- [ ] Set source to "new" — does the title change to "New Arrivals"?
- [ ] Set displayMode to "carousel" — do navigation arrows appear?
- [ ] Enable autoPlay — does the carousel auto-advance?
- [ ] Set displayMode to "hero" — does 1 large + 4 small layout appear?
- [ ] Set displayMode to "row" — does it show a static grid?
- [ ] Toggle `showViewAll` — does the "View All" link toggle?

---

## 16. Journey 15: Public Storefront — Customer Shopping Flow

> **Access:** Visit the published site URL (e.g., `yoursite.dramac.io/shop`)

### Auto-Created Pages (on module install):

| Page | URL | Purpose |
|------|-----|---------|
| **Shop** | `/shop` | Main product listing with search, filters, sort |
| **Cart** | `/cart` | Shopping cart page |
| **Checkout** | `/checkout` | Multi-step checkout |
| **Order Confirmation** | `/order-confirmation` | Post-purchase confirmation |

### 15A. Shopping on the Published Site

1. **Visit `/shop`** — see the product catalog
   - [ ] Is the search bar visible?
   - [ ] Is the category navigation visible?
   - [ ] Are products displayed in a grid?
   - [ ] Can you sort by Price Low→High, Newest, etc.?
   - [ ] Can you filter by category (checkbox)?
   - [ ] Can you filter by price range (slider)?
   - [ ] Does the "In Stock" filter work?
   - [ ] Does pagination work (next/previous page)?

2. **Click a product** — product detail page (`/products/{slug}`)
   - [ ] Is the product image gallery visible?
   - [ ] Can you click thumbnails to change the main image?
   - [ ] Is the price displayed correctly?
   - [ ] If compare_at_price is set, is there a strikethrough + "% off" badge?
   - [ ] Is the stock badge visible (In Stock / Low Stock / Out of Stock)?
   - [ ] If the product has variants (size, color), can you select them?
   - [ ] Is the quantity selector working (±)?
   - [ ] Click "Add to Cart" — does the item add? Does a notification appear?
   - [ ] Click the heart icon — does it toggle the wishlist?
   - [ ] Click the eye icon — does the Quick View modal open?

3. **Floating Cart Icon** (auto-injected on all pages)
   - [ ] Is there a floating cart icon in the bottom-right corner?
   - [ ] Does it show a badge with the item count?
   - [ ] Click it — does a cart drawer/sheet slide open?
   - [ ] Are cart items listed with image, name, quantity, price?
   - [ ] Can you change quantity (±)?
   - [ ] Can you remove items?
   - [ ] Is the subtotal correct?
   - [ ] Is there a "Proceed to Checkout" button?

4. **Cart Page (`/cart`)**
   - [ ] Are all cart items displayed?
   - [ ] Can you change quantities?
   - [ ] Can you remove items?
   - [ ] Is there a "Clear Cart" button (with confirmation)?
   - [ ] Is the discount code input visible?
   - [ ] Enter a valid discount code → "Apply" → is the discount applied?
   - [ ] Is the discount amount shown in green?
   - [ ] Can you remove an applied discount?
   - [ ] Is the cart summary correct (subtotal, discount, shipping, tax, total)?
   - [ ] Click "Proceed to Checkout" → goes to `/checkout`?

---

## 17. Journey 16: Checkout & Payment Flow

> **URL:** `/checkout`

### 4-Step Checkout Flow

#### Step 1: Information
- **Desktop:** Numbered circles + connector lines
- **Mobile:** Progress bar + step dots

| Field | Label | Type | Required | Validation |
|-------|-------|------|----------|------------|
| `email` | Email | Email input | **Yes** | Regex validation |
| `phone` | Phone | Text input | Conditional | Based on store settings |
| `shipping_address.first_name` | First Name | Text | **Yes** | Not empty |
| `shipping_address.last_name` | Last Name | Text | **Yes** | Not empty |
| `shipping_address.address_line_1` | Address | Text | **Yes** | Not empty |
| `shipping_address.address_line_2` | Apt/Suite | Text | No | — |
| `shipping_address.city` | City | Text | **Yes** | Not empty |
| `shipping_address.state` | State/Province | Text | **Yes** | Not empty |
| `shipping_address.postal_code` | Postal Code | Text | **Yes** | Not empty |
| `shipping_address.country` | Country | Select | **Yes** | From list (US, CA, GB, AU, NZ, ZA, ZM, Other) |

- [ ] Fill in email + address → Click "Continue"
- [ ] Leave required fields empty → is submission blocked?
- [ ] Enter an invalid email → is there an error?

#### Step 2: Shipping Method
- Radio group showing available shipping options
- Each option: icon, name, description, estimated days, price

- [ ] Are shipping methods displayed? (based on store settings)
- [ ] Select a method → Click "Continue"
- [ ] Is "Free" shown for $0 methods?

#### Step 3: Payment Method
- Radio group showing available payment methods
- Each option: icon, provider name, description
- Security note at bottom

**Available methods (dynamic from store settings):**
- Flutterwave (if configured)
- Pesapal (if configured)
- DPO Pay (if configured)
- Paddle (if configured)
- Manual/Bank Transfer (always available if enabled)

- [ ] Are payment methods displayed based on what's configured in settings?
- [ ] Select a method → Click "Continue"

#### Step 4: Review
- **Contact info card** (email, phone) — with Edit link back to Step 1
- **Shipping address card** — with Edit link
- **Billing address card** — with Edit link (or "Same as shipping")
- **Shipping method card** — with Edit link back to Step 2
- **Payment method card** — with Edit link back to Step 3
- **Order notes** textarea (optional)
- **Order Summary** card (items, subtotal, discount, shipping, tax, total)
- **"Place Order"** button

- [ ] Review all information — is it accurate?
- [ ] Click Edit on any section — does it go back to that step?
- [ ] Add an order note
- [ ] Click "Place Order" — does it process?

#### After Placing Order:
- **For Flutterwave:** Inline checkout popup appears
- **For Pesapal:** Redirects to Pesapal hosted payment page
- **For DPO:** Redirects to DPO hosted payment page
- **For Paddle:** Paddle.js checkout overlay
- **For Manual:** Shows bank/payment instructions

- [ ] Does the payment flow work for the configured provider?
- [ ] After successful payment → redirected to Order Confirmation page?

#### Order Confirmation Page (`/order-confirmation`):
- Success green check icon
- Order number (with copy button)
- "A confirmation email has been sent" message
- Shipping + billing address cards
- Order items with images
- Price breakdown
- "Continue Shopping" button
- "Track Order" button (if tracking available)

- [ ] Is the order number displayed?
- [ ] Can you copy the order number?
- [ ] Does "Continue Shopping" go back to `/shop`?
- [ ] Is the order now visible in the admin dashboard Orders view?

---

## 18. Journey 17: Embed Code & External Integration

> **Navigation:** Sidebar → Embed

### What You Should See

- Embed code snippets for adding the storefront widget to external websites
- Configuration options for the widget

**StorefrontWidget Configuration:**

| Setting | Type | Default | Options |
|---------|------|---------|---------|
| showCart | Toggle | true | — |
| showCategories | Toggle | true | — |
| productsPerPage | Number | 12 | — |
| theme | Select | "light" | light / dark |
| primaryColor | Color | `#2563eb` | Color picker |
| borderRadius | Number | 8 | px |
| showSearch | Toggle | true | — |
| showFilters | Toggle | true | — |
| layout | Select | "grid" | grid / list |
| columns | Select | 3 | 2 / 3 / 4 |

**Test Checklist:**
- [ ] Navigate to Embed view — is there an embed code?
- [ ] Copy the embed code
- [ ] Paste it into an external HTML page — does the widget render?
- [ ] Does the widget show products from this site?
- [ ] Can you add items to cart from the widget?
- [ ] Does the cart work within the widget?

---

## 19. Known Issues & Missing Features

> **These are items discovered during the deep scan that need attention**

### ⚠️ CRITICAL ISSUES

#### 1. Price Storage Mismatch
**Create/Edit product dialogs** multiply the price by 100 (storing as cents: `Math.round(parseFloat(basePrice) * 100)`). However, the **public products API** transform does NOT divide by 100 — it treats DB values as dollar amounts. The **View Product Dialog** does divide by 100 for display. This means:
- If you create a product at $29.99, it stores as 2999 in the database
- The admin View dialog shows $29.99 (correct — divides by 100)
- The public storefront would show $2999.00 (WRONG — doesn't divide by 100)

**Impact:** Product prices on the storefront may be 100x too high.

#### 2. Discount Type Enum Mismatch
- **Create Discount Dialog** uses: `'percentage' | 'fixed_amount' | 'free_shipping'`
- **Edit Discount Dialog** uses: `'percentage' | 'fixed'`
- These are different values for the same concept. Editing a "fixed_amount" discount created via the Create dialog may fail or show incorrect type.

#### 3. Edit Discount Date Fields Inconsistency
- **Create Discount** uses `type="datetime-local"` for dates
- **Edit Discount** uses `type="date"` for dates
- This means time information may be lost when editing a discount

### ⚠️ MODERATE ISSUES

#### 4. Loyalty Birthday Bonus → Review Bonus Mapping
The Loyalty Config Dialog labels a field "Birthday Bonus" but maps it to `review_bonus` in the backend. The field label should either match the backend field name, or the backend should be updated to use `birthday_bonus`.

#### 5. Payment Provider Ecosystem Mismatch
- The **Quick Settings Dialog** (accessible from header) supports: Flutterwave / Pesapal / DPO / Manual
- The **Full Settings → Payments tab** supports: Stripe / PayPal / Manual / COD
- These are completely different ecosystems. Users may configure Stripe in full settings but the checkout only supports Flutterwave/Pesapal/DPO/Manual.

#### 6. Studio Products API Category Filter Bug
The category filter in `/api/studio/modules/ecommerce/products` is applied AFTER the database query's `range()` pagination. This means when filtering by category, the total count and pagination may be incorrect.

#### 7. Payment Gateway Test Connection is a Stub
The `testPaymentGateway()` function in settings-actions always returns success after a 1-second delay. It doesn't actually test the connection.

### 📋 MISSING FEATURES (Not Yet Implemented)

#### 8. Product Reviews System
- Types reference reviews but there is NO database table, NO API, and NO UI for product reviews
- `ProductRatingDisplay` renders stars but no actual review data exists
- This is documented as "future work"

#### 9. Gift Card Email Sending
- The "Send email to recipient" toggle in the Gift Card dialog is **commented out** as a future feature
- Gift cards are created but not delivered via email

#### 10. View Products Action in Categories
- In the Categories table, the "View Products" dropdown action is listed as a **placeholder** — it doesn't actually filter the products view

#### 11. Product Detail Dynamic Route
- The `products/[slug]` dynamic route template is defined in `page-templates.ts` but relies on a dynamic Next.js route handler. Verify that this route actually resolves and renders product details on the published site.

#### 12. Wishlist Persistence
- Wishlist is **localStorage-only** — no server persistence
- If user clears browser data or switches devices, wishlist is lost

#### 13. "EcommerceDashboardEnhanced" Dead Code
- `EcommerceDashboardEnhanced.tsx` exists but is never imported anywhere
- It contains mock data and returns empty arrays
- This is dead code that can be cleaned up

---

## Quick Reference: All E-Commerce Routes

### Admin Dashboard
| URL | View |
|-----|------|
| `/dashboard/sites/{siteId}/ecommerce` | Home |
| `/dashboard/sites/{siteId}/ecommerce?view=products` | Products |
| `/dashboard/sites/{siteId}/ecommerce?view=orders` | Orders |
| `/dashboard/sites/{siteId}/ecommerce?view=customers` | Customers |
| `/dashboard/sites/{siteId}/ecommerce?view=categories` | Categories |
| `/dashboard/sites/{siteId}/ecommerce?view=discounts` | Discounts |
| `/dashboard/sites/{siteId}/ecommerce?view=quotes` | Quotes |
| `/dashboard/sites/{siteId}/ecommerce?view=inventory` | Inventory |
| `/dashboard/sites/{siteId}/ecommerce?view=analytics` | Analytics |
| `/dashboard/sites/{siteId}/ecommerce?view=marketing` | Marketing |
| `/dashboard/sites/{siteId}/ecommerce?view=developer` | Developer |
| `/dashboard/sites/{siteId}/ecommerce?view=settings` | Settings |
| `/dashboard/sites/{siteId}/ecommerce?view=embed` | Embed |

### Public Storefront
| URL | Page |
|-----|------|
| `{site-domain}/shop` | Product catalog |
| `{site-domain}/cart` | Shopping cart |
| `{site-domain}/checkout` | Checkout flow |
| `{site-domain}/order-confirmation` | Confirmation |
| `{site-domain}/products/{slug}` | Product detail |
| `{site-domain}/categories/{slug}` | Category listing |

### API Endpoints
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/modules/ecommerce/products` | Public product listing |
| GET | `/api/modules/ecommerce/categories` | Public categories |
| GET | `/api/modules/ecommerce/cart` | Get/create cart |
| POST | `/api/modules/ecommerce/cart` | Cart actions (add/update/remove/clear/discount) |
| POST | `/api/modules/ecommerce/checkout` | Place order |
| GET | `/api/modules/ecommerce/orders` | Get orders (auth required) |
| PATCH | `/api/modules/ecommerce/orders` | Update order status |
| POST | `/api/modules/ecommerce/webhooks/payment?provider=X` | Payment webhooks |
| GET | `/api/studio/modules/ecommerce/products` | Studio product selector |
| GET | `/api/studio/modules/ecommerce/categories` | Studio category selector |

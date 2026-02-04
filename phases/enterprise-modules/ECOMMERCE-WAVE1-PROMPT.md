# AI AGENT PROMPT: Generate WAVE 1 E-Commerce Phase Documents

---

## YOUR TASK

You are a senior software architect creating detailed PHASE implementation documents for the DRAMAC CMS E-Commerce Module. Your job is to generate **WAVE 1: Dashboard Foundation** - consisting of **5 comprehensive PHASE documents** that another AI agent will use to implement the code.

---

## PHASES TO CREATE

Generate the following 5 PHASE documents:

| Phase | Title | Priority | Est. Hours |
|-------|-------|----------|------------|
| **PHASE-ECOM-01** | Dashboard Redesign & Navigation | 🔴 CRITICAL | 8-10 |
| **PHASE-ECOM-02** | Product Management Enhancement | 🔴 CRITICAL | 10-12 |
| **PHASE-ECOM-03** | Settings & Configuration Center | 🟠 HIGH | 8-10 |
| **PHASE-ECOM-04** | Order Management Enhancement | 🟠 HIGH | 8-10 |
| **PHASE-ECOM-05** | Customer Management | 🟠 HIGH | 6-8 |

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
- [ ] Verify dependencies are complete
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

### Task X.2: [Next Task]
[Continue with complete code for each task]

---

## 🗄️ Database Migrations (if needed)

**File**: `migrations/ecom-XX-description.sql`

```sql
-- Complete SQL migration
-- Include comments
-- Include indexes
-- Include RLS policies
```

---

## 🔧 Type Definitions

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`

```typescript
// New or modified type definitions
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] [Specific manual test 1]
- [ ] [Specific manual test 2]
- [ ] [Specific manual test 3]
- [ ] Mobile responsive check (Chrome DevTools)

---

## 🔄 Rollback Plan

If issues occur:
1. [Step to revert change 1]
2. [Step to revert change 2]
3. Run `npx tsc --noEmit` to verify clean state

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add phase completion note
- `progress.md`: Update e-commerce section

---

## ✨ Success Criteria

- [ ] [Specific measurable outcome 1]
- [ ] [Specific measurable outcome 2]
- [ ] [Specific measurable outcome 3]
```

---

## CRITICAL REQUIREMENTS FOR ALL PHASES

### 1. Complete, Copy-Paste Ready Code
- Every code block must be COMPLETE - no placeholders like `// ... rest of code`
- Include ALL imports at the top
- Include ALL TypeScript interfaces/types
- Include inline comments explaining complex logic

### 2. Follow Existing Patterns
The e-commerce module follows specific patterns. Study and match:
- **Server Actions**: Use `'use server'` directive, NOT classes
- **File Location**: `src/modules/ecommerce/` structure
- **Table Prefix**: `mod_ecommod01_` for all database tables
- **Context Pattern**: Use React Context for state management
- **Component Pattern**: Shadcn/ui components with Tailwind CSS

### 3. Mobile-First Responsive
- All components must work on mobile first
- Use Tailwind responsive classes (`md:`, `lg:`)
- Touch-friendly interactions (min 44px tap targets)

### 4. TypeScript Strict Mode
- All types must be explicitly defined
- No `any` types unless absolutely necessary
- Export types for reuse

### 5. Existing Code Awareness
Reference existing files:
- `src/modules/ecommerce/components/ecommerce-dashboard.tsx` - Current dashboard
- `src/modules/ecommerce/components/views/` - Existing views
- `src/modules/ecommerce/components/dialogs/` - Existing dialogs
- `src/modules/ecommerce/actions/ecommerce-actions.ts` - Server actions
- `src/modules/ecommerce/types/ecommerce-types.ts` - Type definitions

---

## WAVE 1 PHASE DETAILS

### PHASE-ECOM-01: Dashboard Redesign & Navigation

**Must Include:**
- New sidebar navigation component (Products, Orders, Customers, Discounts, Quotes, Analytics, Settings)
- Redesigned header with breadcrumbs
- Quick stats cards row:
  - Total Revenue (today/week/month toggle)
  - Orders (with pending count badge)
  - Products (with low stock alert)
  - Customers (new this week)
- Recent Orders widget (last 5 orders)
- Low Stock Alerts widget
- Quick Actions dropdown (Add Product, Create Order, Create Quote)
- Activity feed sidebar
- Global search with command palette (Cmd+K)
- Mobile-responsive layout with hamburger menu

**Key Files to Create/Modify:**
- `src/modules/ecommerce/components/layout/ecommerce-sidebar.tsx` (NEW)
- `src/modules/ecommerce/components/layout/ecommerce-header.tsx` (NEW)
- `src/modules/ecommerce/components/widgets/stats-cards.tsx` (NEW)
- `src/modules/ecommerce/components/widgets/recent-orders.tsx` (NEW)
- `src/modules/ecommerce/components/widgets/low-stock-alerts.tsx` (NEW)
- `src/modules/ecommerce/components/widgets/activity-feed.tsx` (NEW)
- `src/modules/ecommerce/components/ecommerce-dashboard.tsx` (MODIFY)

---

### PHASE-ECOM-02: Product Management Enhancement

**Must Include:**
- Product list table with columns:
  - Checkbox (for bulk select)
  - Image thumbnail
  - Product Name
  - SKU (prominently displayed)
  - Status badge (Draft/Active/Archived)
  - Price
  - Inventory count (with low stock warning)
  - Category
  - Actions dropdown
- Product ID/SKU display in detail view
- Bulk actions toolbar:
  - Bulk delete
  - Bulk status change
  - Bulk category assign
  - Bulk price adjust
- Inline quick edit (click to edit price, stock)
- Product duplication action
- Advanced filters:
  - Status filter
  - Category filter
  - Stock level filter (In Stock/Low Stock/Out of Stock)
  - Price range filter
  - Date created filter
- Column visibility toggle
- Export to CSV button
- Import from CSV with preview/validation

**Key Files to Create/Modify:**
- `src/modules/ecommerce/components/views/products-view.tsx` (MODIFY - major)
- `src/modules/ecommerce/components/tables/product-table.tsx` (NEW)
- `src/modules/ecommerce/components/tables/product-table-columns.tsx` (NEW)
- `src/modules/ecommerce/components/filters/product-filters.tsx` (NEW)
- `src/modules/ecommerce/components/bulk/bulk-actions-toolbar.tsx` (NEW)
- `src/modules/ecommerce/components/dialogs/import-products-dialog.tsx` (NEW)
- `src/modules/ecommerce/actions/product-import-export.ts` (NEW)

---

### PHASE-ECOM-03: Settings & Configuration Center

**Must Include:**
- Settings page with tabbed interface:
  - **General**: Store name, logo, address, contact email, phone
  - **Currency**: Primary currency, display format, decimal places
  - **Tax**: Tax rate, tax included in price toggle, tax by region (table)
  - **Shipping**: Shipping zones table, rates per zone, free shipping threshold
  - **Payments**: Payment provider cards (Flutterwave, Pesapal, Paddle, Manual) with enable/configure
  - **Checkout**: Guest checkout toggle, required fields, terms checkbox
  - **Notifications**: Order confirmation email, low stock alerts, new order alerts
  - **Inventory**: Track inventory toggle, continue selling when OOS, low stock threshold default
  - **Legal**: Terms of service, Privacy policy, Refund policy (rich text editors)
- Settings server actions for save/load
- Settings validation with Zod
- Success/error toast notifications

**Key Files to Create/Modify:**
- `src/modules/ecommerce/components/views/settings-view.tsx` (NEW)
- `src/modules/ecommerce/components/settings/general-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/currency-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/tax-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/shipping-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/payment-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/checkout-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/notification-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/inventory-settings.tsx` (NEW)
- `src/modules/ecommerce/components/settings/legal-settings.tsx` (NEW)
- `src/modules/ecommerce/types/ecommerce-types.ts` (MODIFY - add settings types)
- `src/modules/ecommerce/actions/settings-actions.ts` (NEW)

---

### PHASE-ECOM-04: Order Management Enhancement

**Must Include:**
- Order list table with:
  - Order number (clickable)
  - Customer name/email
  - Status badge with color coding
  - Payment status badge
  - Fulfillment status
  - Total amount
  - Date
  - Actions
- Order detail page/dialog:
  - Order timeline (created, paid, shipped, delivered)
  - Customer info card
  - Shipping address card
  - Billing address card
  - Order items table
  - Payment details
  - Internal notes (add/view)
  - Status change dropdown
- Bulk order actions (mark shipped, mark paid)
- Packing slip generation (printable)
- Invoice generation (PDF)
- Refund processing dialog
- Order search (by number, email, name)
- Advanced filters (status, date range, amount range)
- Order export to CSV

**Key Files to Create/Modify:**
- `src/modules/ecommerce/components/views/orders-view.tsx` (MODIFY - major)
- `src/modules/ecommerce/components/tables/order-table.tsx` (NEW)
- `src/modules/ecommerce/components/tables/order-table-columns.tsx` (NEW)
- `src/modules/ecommerce/components/dialogs/order-detail-dialog.tsx` (NEW)
- `src/modules/ecommerce/components/orders/order-timeline.tsx` (NEW)
- `src/modules/ecommerce/components/orders/order-items-table.tsx` (NEW)
- `src/modules/ecommerce/components/dialogs/refund-dialog.tsx` (NEW)
- `src/modules/ecommerce/components/print/packing-slip.tsx` (NEW)
- `src/modules/ecommerce/components/print/invoice-template.tsx` (NEW)
- `src/modules/ecommerce/actions/order-actions.ts` (MODIFY - add refund, invoice)

---

### PHASE-ECOM-05: Customer Management

**Must Include:**
- New "Customers" tab in dashboard
- Customer list table:
  - Name
  - Email
  - Phone
  - Total orders
  - Total spent
  - Last order date
  - Customer since
  - Actions
- Customer detail page/dialog:
  - Profile info (name, email, phone)
  - Addresses list (shipping/billing)
  - Order history table
  - Activity timeline
  - Internal notes
  - Customer tags/groups
- Customer search (name, email, phone)
- Customer filters (by order count, spend, date)
- Customer groups/segments management
- Import customers from CSV
- Export customers to CSV
- Guest customer list (orders without accounts)

**Database Additions:**
```sql
-- Customer groups
CREATE TABLE mod_ecommod01_customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  name TEXT NOT NULL,
  description TEXT,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer to group mapping
CREATE TABLE mod_ecommod01_customer_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES mod_ecommod01_customer_groups(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, group_id)
);

-- Customer notes
CREATE TABLE mod_ecommod01_customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id),
  customer_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Files to Create:**
- `src/modules/ecommerce/components/views/customers-view.tsx` (NEW)
- `src/modules/ecommerce/components/tables/customer-table.tsx` (NEW)
- `src/modules/ecommerce/components/tables/customer-table-columns.tsx` (NEW)
- `src/modules/ecommerce/components/dialogs/customer-detail-dialog.tsx` (NEW)
- `src/modules/ecommerce/components/customers/customer-orders.tsx` (NEW)
- `src/modules/ecommerce/components/customers/customer-addresses.tsx` (NEW)
- `src/modules/ecommerce/components/customers/customer-groups.tsx` (NEW)
- `src/modules/ecommerce/components/dialogs/customer-group-dialog.tsx` (NEW)
- `src/modules/ecommerce/actions/customer-actions.ts` (NEW)
- `src/modules/ecommerce/types/ecommerce-types.ts` (MODIFY - add customer types)
- `migrations/ecom-05-customer-management.sql` (NEW)

---

## OUTPUT FORMAT

Generate each phase as a SEPARATE document with clear headers. Output them in order:

1. First output `PHASE-ECOM-01-DASHBOARD-REDESIGN.md`
2. Then output `PHASE-ECOM-02-PRODUCT-MANAGEMENT.md`
3. Then output `PHASE-ECOM-03-SETTINGS-CONFIGURATION.md`
4. Then output `PHASE-ECOM-04-ORDER-MANAGEMENT.md`
5. Finally output `PHASE-ECOM-05-CUSTOMER-MANAGEMENT.md`

Each document should be complete and ready for an implementing AI agent to execute.

---

## REFERENCE: MASTER PROMPT CONTEXT

Below is the full context about the DRAMAC CMS E-Commerce module. Use this as your reference for understanding the platform, patterns, and requirements:

---

[PASTE ECOMMERCE-MASTER-PROMPT-V1.md CONTENT HERE]

---

**NOW GENERATE ALL 5 WAVE 1 PHASE DOCUMENTS WITH COMPLETE, IMPLEMENTATION-READY CODE.**

# DRAMAC CMS — Invoicing Module: Session 9 (FINAL)

## Phase: INV-14 — Vendor Management, Purchase Orders & Bills

> **This is the FINAL session of the Invoicing & Financial Management module.**

---

## Pre-Session Setup

### Memory Bank — Read These Files FIRST (in order)

1. `/memory-bank/projectbrief.md`
2. `/memory-bank/productContext.md`
3. `/memory-bank/systemPatterns.md`
4. `/memory-bank/techContext.md`
5. `/memory-bank/activeContext.md`
6. `/memory-bank/progress.md`

### Master Guide Reference

**File**: `/phases/PHASE-INV-MASTER-GUIDE.md`  
**INV-14 Section**: Lines 3081–3250 (Phase INV-14: Vendor Management, Purchase Orders & Bills)  
**Quality Standards**: Lines 3252–3311 (Section 5: Implementation Notes & Quality Standards)

Read **both** sections before implementing anything.

---

## Session Scope

| Phase  | Title                                      | Estimated Files             | Complexity |
| ------ | ------------------------------------------ | --------------------------- | ---------- |
| INV-14 | Vendor Management, Purchase Orders & Bills | ~20 new files + ~5 modified | HIGH       |

---

## What Already Exists (DO NOT Recreate)

### Types — COMPLETE (from INV-01)

**File**: `src/modules/invoicing/types/vendor-types.ts`

Already defines:

- `Vendor` interface (full entity)
- `Bill` interface (with optional `vendor` and `lineItems` relations)
- `BillLineItem` interface
- `PurchaseOrder` interface (with optional `vendor` relation)
- `BillStatus` type: `"draft" | "received" | "partial" | "paid" | "overdue" | "void"`
- `POStatus` type: `"draft" | "sent" | "acknowledged" | "partially_received" | "received" | "cancelled"`
- `CreateVendorInput`, `CreateBillInput`, `CreateBillLineItemInput`, `CreatePurchaseOrderInput`

**IMPORTANT**: `PurchaseOrder` currently has NO `lineItems` field. You will need to either:

- Add a `PurchaseOrderLineItem` type (if using a separate PO line items table — check if `mod_invmod01_purchase_order_line_items` exists in DB), OR
- Reuse `BillLineItem` structure for PO lines and add a `lineItems?: BillLineItem[]` relation to `PurchaseOrder`.

The master guide does NOT define a `purchase_order_line_items` table — PO line items should be stored in the PO's `metadata` jsonb field, OR you can create a lightweight inline approach. Choose the simplest approach that works.

### Database Tables — COMPLETE (from INV-01)

Table constants in `src/modules/invoicing/lib/invoicing-constants.ts`:

- `mod_invmod01_vendors`
- `mod_invmod01_bills`
- `mod_invmod01_bill_line_items`
- `mod_invmod01_purchase_orders`
- `mod_invmod01_invoice_activity` (for audit trail)

### Number Generation — COMPLETE (from INV-02)

**File**: `src/modules/invoicing/services/invoice-number-service.ts`

Function `generateNextDocumentNumber(siteId, docType)` already supports:

- `"bill"` → uses `bill_prefix` + `bill_next_number` from settings
- `"po"` → uses `po_prefix` + `po_next_number` from settings

**DO NOT** recreate this service. Import and use it directly.

### Settings — COMPLETE (from INV-01)

Settings already contain `bill_prefix`, `bill_next_number`, `po_prefix`, `po_next_number` fields, properly initialized in the bootstrap function.

### References for Patterns

| What                          | File Path                                                        | Use For                     |
| ----------------------------- | ---------------------------------------------------------------- | --------------------------- |
| Invoice PDF template          | `src/modules/invoicing/components/invoice-pdf-template.tsx`      | PO PDF template pattern     |
| Payment form (record payment) | `src/modules/invoicing/components/payment-form.tsx`              | Bill payment dialog pattern |
| Invoice list component        | `src/modules/invoicing/components/invoice-list.tsx`              | Bill/vendor list pattern    |
| Invoice detail component      | `src/modules/invoicing/components/invoice-detail.tsx`            | Bill/vendor detail pattern  |
| Invoice form component        | `src/modules/invoicing/components/invoice-form.tsx`              | Bill/PO form pattern        |
| Invoice actions (CRUD)        | `src/modules/invoicing/actions/invoice-actions.ts`               | Server action structure     |
| Payment actions               | `src/modules/invoicing/actions/payment-actions.ts`               | Bill payment action pattern |
| Expense category manager      | `src/modules/invoicing/components/expense-category-manager.tsx`  | Category UX pattern         |
| Billable expense selector     | `src/modules/invoicing/components/billable-expense-selector.tsx` | Already exists              |

---

## What to Build

### 1. Server Actions — Vendors (`vendor-actions.ts`)

**New file**: `src/modules/invoicing/actions/vendor-actions.ts`

| Function         | Parameters                         | Returns                                                                            | Description                                                     |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `getVendors`     | `siteId, filters?, pagination?`    | `{ vendors: Vendor[], total: number }`                                             | Paginated vendor list with search, status filter                |
| `getVendor`      | `vendorId`                         | `Vendor & { bills: Bill[], purchaseOrders: PurchaseOrder[], expenses: Expense[] }` | Full vendor with related records                                |
| `createVendor`   | `siteId, input: CreateVendorInput` | `Vendor`                                                                           | Create vendor with all fields                                   |
| `updateVendor`   | `vendorId, input`                  | `Vendor`                                                                           | Update vendor details                                           |
| `deleteVendor`   | `vendorId`                         | `void`                                                                             | Soft delete (set `is_active = false`). Fail if has unpaid bills |
| `getVendorStats` | `vendorId`                         | `VendorStats`                                                                      | Summary: total billed, paid, outstanding, avg payment time      |

**Add `VendorStats` type** to `vendor-types.ts`:

```typescript
export interface VendorStats {
  totalBilled: number; // CENTS
  totalPaid: number; // CENTS
  totalOutstanding: number; // CENTS
  billCount: number;
  poCount: number;
  avgPaymentDays: number;
}
```

### 2. Server Actions — Purchase Orders (`purchase-order-actions.ts`)

**New file**: `src/modules/invoicing/actions/purchase-order-actions.ts`

| Function               | Parameters                      | Returns                                              | Description                                        |
| ---------------------- | ------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `getPurchaseOrders`    | `siteId, filters?, pagination?` | `{ purchaseOrders: PurchaseOrder[], total: number }` | Paginated PO list                                  |
| `getPurchaseOrder`     | `purchaseOrderId`               | `PurchaseOrder with vendor, linked bills`            | Full PO with related data                          |
| `createPurchaseOrder`  | `siteId, input`                 | `PurchaseOrder`                                      | Create PO with line items, auto-generate PO number |
| `updatePurchaseOrder`  | `purchaseOrderId, input`        | `PurchaseOrder`                                      | Update PO (only if draft)                          |
| `deletePurchaseOrder`  | `purchaseOrderId`               | `void`                                               | Delete PO (only if draft)                          |
| `sendPurchaseOrder`    | `purchaseOrderId`               | `void`                                               | Send PO to vendor via email, status → 'sent'       |
| `approvePurchaseOrder` | `purchaseOrderId`               | `void`                                               | Mark PO as acknowledged                            |
| `convertToBill`        | `purchaseOrderId`               | `Bill`                                               | Convert received PO to bill (copy line items)      |
| `markAsReceived`       | `purchaseOrderId`               | `void`                                               | Mark goods/services received                       |
| `cancelPurchaseOrder`  | `purchaseOrderId`               | `void`                                               | Cancel PO                                          |

Use `generateNextDocumentNumber(siteId, "po")` from `invoice-number-service.ts`.

**PO Line Items Approach**: Since the DB has no separate PO line items table, store line items in `metadata.lineItems` as a JSON array. Define a `PurchaseOrderLineItem` interface:

```typescript
export interface PurchaseOrderLineItem {
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number; // CENTS
  taxRateId?: string | null;
  taxRate?: number;
  taxAmount?: number; // CENTS
  subtotal: number; // CENTS
  total: number; // CENTS
}
```

### 3. Server Actions — Bills (`bill-actions.ts`)

**New file**: `src/modules/invoicing/actions/bill-actions.ts`

| Function            | Parameters                       | Returns                                              | Description                                            |
| ------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `getBills`          | `siteId, filters?, pagination?`  | `{ bills: Bill[], total: number }`                   | Paginated bill list                                    |
| `getBill`           | `billId`                         | `Bill with line items, vendor, payments, activities` | Full bill detail                                       |
| `createBill`        | `siteId, input: CreateBillInput` | `Bill`                                               | Create bill with line items, auto-generate bill number |
| `updateBill`        | `billId, input`                  | `Bill`                                               | Update bill (cannot update if paid)                    |
| `deleteBill`        | `billId`                         | `void`                                               | Delete bill (only if draft, no payments)               |
| `recordBillPayment` | `billId, input`                  | `void`                                               | Record payment against bill (partial or full)          |
| `voidBill`          | `billId, reason`                 | `void`                                               | Void bill — reverse any payments                       |
| `approveBill`       | `billId`                         | `void`                                               | Approve bill for payment                               |
| `getBillStats`      | `siteId, dateRange?`             | `BillStats`                                          | Summary: total billed, paid, outstanding, overdue      |

Use `generateNextDocumentNumber(siteId, "bill")` from `invoice-number-service.ts`.

**Add `BillStats` type** to `vendor-types.ts`:

```typescript
export interface BillStats {
  totalBilled: number; // CENTS
  totalPaid: number; // CENTS
  totalOutstanding: number; // CENTS
  totalOverdue: number; // CENTS
  billCount: number;
  overdueCount: number;
}
```

**Bill Payment Logic** (mirrors invoice payment from INV-03):

```
1. Validate: amount > 0, bill exists, bill not void
2. Create payment record (or activity entry tracking bill payment)
3. Update bill: amount_paid += payment_amount
4. Recalculate: amount_due = total - amount_paid
5. Update bill status:
   - If amount_due <= 0: status = 'paid', paid_date = today
   - If amount_due > 0 && amount_paid > 0: status = 'partial'
6. Update vendor: total_paid += payment_amount (denormalized)
7. Log activity: "bill_payment_recorded"
8. Fire automation event: accounting.bill.paid (if fully paid)
```

### 4. Components — Vendors (3 files)

**Directory**: `src/modules/invoicing/components/vendors/`

| Component      | File                | Description                                                                                                                                                                     |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VendorList`   | `vendor-list.tsx`   | Paginated table — name, email, total billed, outstanding, status badge. Search + active/inactive filter                                                                         |
| `VendorForm`   | `vendor-form.tsx`   | Create/edit form — name, email, phone, address fields, tax ID, payment terms, bank details (name, account, branch), mobile money number, notes, tags. Use React Hook Form + Zod |
| `VendorDetail` | `vendor-detail.tsx` | Vendor profile — info card at top, then Tabs: Bills, Purchase Orders, Expenses, Activity                                                                                        |

### 5. Components — Purchase Orders (4 files)

**Directory**: `src/modules/invoicing/components/purchase-orders/`

| Component             | File                        | Description                                                                                                                                                                                                    |
| --------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PurchaseOrderList`   | `purchase-order-list.tsx`   | Paginated table — PO#, vendor name, total, status badge, date. Filters: vendor, status, date range                                                                                                             |
| `PurchaseOrderForm`   | `purchase-order-form.tsx`   | Create/edit PO — vendor select, line items editor (name, qty, unit price, tax), expected delivery date, shipping address, notes. Follow invoice form pattern for line items                                    |
| `PurchaseOrderDetail` | `purchase-order-detail.tsx` | Full PO view — line items table, totals, status timeline, actions toolbar (Send, Approve, Mark Received, Convert to Bill, Cancel)                                                                              |
| `PurchaseOrderPdf`    | `purchase-order-pdf.tsx`    | Print-friendly PO view. Follow `invoice-pdf-template.tsx` pattern exactly: company letterhead, vendor details, PO number, date, expected delivery, line items table, totals, notes. Use `@media print` styling |

### 6. Components — Bills (4 files)

**Directory**: `src/modules/invoicing/components/bills/`

| Component           | File                      | Description                                                                                                                                                                             |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BillList`          | `bill-list.tsx`           | Paginated table — bill#, vendor name, total, due date, status badge, amount_due. Filters: vendor, status, date range                                                                    |
| `BillForm`          | `bill-form.tsx`           | Create/edit bill — vendor select, vendor bill reference, line items (with expense category per line), due date, attachment upload, linked PO select, notes. Follow invoice form pattern |
| `BillDetail`        | `bill-detail.tsx`         | Full bill view — line items, totals, payment history, linked PO, attachment preview, activity log, actions (Approve, Record Payment, Void)                                              |
| `BillPaymentDialog` | `bill-payment-dialog.tsx` | Record payment dialog — amount (prefill with amount_due), date, payment method, reference, notes. Mirror the existing `payment-form.tsx` pattern                                        |

### 7. Pages (9 pages)

**All under** `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/`

| Route                                | Page File                         | Component                           |
| ------------------------------------ | --------------------------------- | ----------------------------------- |
| `/invoicing/vendors/`                | `vendors/page.tsx`                | `<VendorList>`                      |
| `/invoicing/vendors/new/`            | `vendors/new/page.tsx`            | `<VendorForm mode="create">`        |
| `/invoicing/vendors/[vendorId]/`     | `vendors/[vendorId]/page.tsx`     | `<VendorDetail>`                    |
| `/invoicing/bills/`                  | `bills/page.tsx`                  | `<BillList>`                        |
| `/invoicing/bills/new/`              | `bills/new/page.tsx`              | `<BillForm mode="create">`          |
| `/invoicing/bills/[billId]/`         | `bills/[billId]/page.tsx`         | `<BillDetail>`                      |
| `/invoicing/purchase-orders/`        | `purchase-orders/page.tsx`        | `<PurchaseOrderList>`               |
| `/invoicing/purchase-orders/new/`    | `purchase-orders/new/page.tsx`    | `<PurchaseOrderForm mode="create">` |
| `/invoicing/purchase-orders/[poId]/` | `purchase-orders/[poId]/page.tsx` | `<PurchaseOrderDetail>`             |

**Page pattern** — follow existing invoicing pages exactly:

```tsx
// Example: vendors/page.tsx
import { VendorList } from "@/modules/invoicing/components/vendors/vendor-list";

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  return <VendorList siteId={siteId} />;
}
```

### 8. Navigation Update

**File to modify**: `src/modules/invoicing/components/invoicing-nav.tsx`

Add 3 new nav items to the `navItems` array, **before** the Settings item:

```typescript
// Add these imports at top:
import { Building2, ClipboardList, FileStack } from "lucide-react";

// Add to navItems array (before Settings):
{ href: `${base}/vendors`, label: "Vendors", icon: Building2, exact: false },
{ href: `${base}/bills`, label: "Bills", icon: FileStack, exact: false },
{ href: `${base}/purchase-orders`, label: "POs", icon: ClipboardList, exact: false },
```

### 9. Dashboard Metrics Extension

**File to modify**: `src/modules/invoicing/types/report-types.ts`

Add AP (Accounts Payable) fields to `DashboardMetrics`:

```typescript
export interface DashboardMetrics {
  // ... existing fields (keep all)
  // NEW — Accounts Payable
  totalBillsOutstanding: number; // CENTS
  totalBillsOverdue: number; // CENTS
  totalBillsPaidThisPeriod: number; // CENTS
  activePurchaseOrders: number; // count
  netCashPosition: number; // receivables - payables, CENTS
}
```

**File to modify**: `src/modules/invoicing/actions/report-actions.ts`

Update `getDashboardMetrics()` to query bills table for AP metrics. Add bills data to P&L report and cash flow report.

### 10. Automation Events

**File to modify**: `src/modules/automation/lib/event-types.ts`

Add these event definitions to the `accounting` category (follow the exact same pattern as existing `accounting.invoice.*` events):

| Event                                | When                      |
| ------------------------------------ | ------------------------- |
| `accounting.bill.created`            | Bill recorded             |
| `accounting.bill.approved`           | Bill approved for payment |
| `accounting.bill.paid`               | Bill fully paid           |
| `accounting.bill.overdue`            | Bill past due date        |
| `accounting.purchase_order.created`  | PO created                |
| `accounting.purchase_order.sent`     | PO sent to vendor         |
| `accounting.purchase_order.received` | Goods/services received   |

Add corresponding payload variables for each event (follow the same `variables` array pattern used by existing `accounting.invoice.*` events).

### 11. PO Email to Vendor

When `sendPurchaseOrder` is called:

1. Render branded HTML email with PO details (PO#, items, total, expected delivery)
2. Send via Resend to vendor email
3. Subject: `"Purchase Order {{po_number}} from {{company_name}}"`
4. Sender: `Dramac <noreply@app.dramacagency.com>`
5. Include "View PO" link (or attach PDF if feasible)
6. Log activity: `"purchase_order_sent"`
7. Fire event: `accounting.purchase_order.sent`

### 12. Types Barrel Export

**File to modify**: `src/modules/invoicing/types/index.ts`

Ensure `VendorStats`, `BillStats`, and `PurchaseOrderLineItem` are exported (the existing vendor-types.ts exports should already be re-exported).

---

## File Path Correction Table

| Master Guide Says                      | Actual Path                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `navigation.ts` (for nav update)       | `src/modules/invoicing/components/invoicing-nav.tsx`                           |
| PO line items table                    | Does NOT exist — use `metadata.lineItems` JSON approach                        |
| PDF template at `components/invoices/` | `src/modules/invoicing/components/invoice-pdf-template.tsx` (flat, not nested) |

---

## Critical Rules (from Master Guide Section 5)

1. **ALL amounts in CENTS** — integers only, never floating point for money
2. **ALL server actions** — use `"use server"` directive, validate inputs via Zod
3. **ALL components** — typed props with `interface`, use design system (`@/components/ui/`)
4. **ALL forms** — React Hook Form + Zod resolver
5. **ALL lists** — paginated, filterable
6. **ALL status changes** — logged in `mod_invmod01_invoice_activity` table
7. **NEVER** use `DELETE FROM` — always soft delete or `UPDATE status`
8. **NEVER** store money as `numeric` or `float` — use `integer` (cents)
9. **NEVER** trust client-side totals — always recalculate on server
10. **Zambia-first**: Default currency `ZMW`, symbol `K`, 16% VAT, timezone `Africa/Lusaka`
11. **Email sender**: `Dramac <noreply@app.dramacagency.com>` via Resend

---

## INV-14 Deliverables Checklist

- [ ] `vendor-actions.ts` — 6 vendor server actions
- [ ] `purchase-order-actions.ts` — 10 PO server actions (including `convertToBill`)
- [ ] `bill-actions.ts` — 9 bill server actions (including `recordBillPayment`)
- [ ] `VendorStats` and `BillStats` types added to `vendor-types.ts`
- [ ] `PurchaseOrderLineItem` type defined
- [ ] PO → Bill conversion logic
- [ ] Bill payment recording + status management
- [ ] 3 vendor components (`vendor-list.tsx`, `vendor-form.tsx`, `vendor-detail.tsx`)
- [ ] 4 purchase order components (`purchase-order-list.tsx`, `purchase-order-form.tsx`, `purchase-order-detail.tsx`, `purchase-order-pdf.tsx`)
- [ ] 4 bill components (`bill-list.tsx`, `bill-form.tsx`, `bill-detail.tsx`, `bill-payment-dialog.tsx`)
- [ ] 9 dashboard pages (3 vendor, 3 bill, 3 PO)
- [ ] PO PDF generation (follows invoice PDF pattern)
- [ ] PO email sending to vendor
- [ ] Dashboard metrics extended with AP data (report-types.ts + report-actions.ts)
- [ ] P&L and cash flow reports include bill data
- [ ] 7 automation events registered in event-types.ts
- [ ] Navigation updated in `invoicing-nav.tsx` (Vendors, Bills, POs)
- [ ] Activity logging for all vendor/bill/PO operations
- [ ] Types barrel export updated
- [ ] Zero TypeScript errors (`npx tsc --noEmit`)
- [ ] Successful build (`npx next build`)

---

## TSC Verification

After completing all work, run:

```bash
npx tsc --noEmit 2>&1 | Select-String "error TS" | Measure-Object | Select-Object -ExpandProperty Count
```

**Expected**: ≤ 101 errors (current pre-existing baseline). **Zero** from invoicing module files.

Also verify no invoicing-specific errors:

```bash
npx tsc --noEmit 2>&1 | Select-String "invoicing|vendor|bill|purchase-order"
```

**Expected**: No output (zero invoicing errors).

---

## After Completion

Update `/memory-bank/activeContext.md` and `/memory-bank/progress.md` to reflect:

- INV-14 COMPLETE
- **ALL 14 PHASES COMPLETE** — Invoicing & Financial Management module is DONE
- Total files created across all sessions
- Final TSC error count

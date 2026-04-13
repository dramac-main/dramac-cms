/**
 * Invoicing Module - Vendor Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for vendors, bills, bill line items, and purchase orders.
 * Maps to mod_invmod01_vendors, mod_invmod01_bills,
 * mod_invmod01_bill_line_items, and mod_invmod01_purchase_orders tables.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type BillStatus =
  | "draft"
  | "received"
  | "partial"
  | "paid"
  | "overdue"
  | "void";

export type POStatus =
  | "draft"
  | "sent"
  | "acknowledged"
  | "partially_received"
  | "received"
  | "cancelled";

// ============================================================================
// VENDORS
// ============================================================================

export interface Vendor {
  id: string;
  siteId: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  taxId: string | null;
  currency: string;
  paymentTermsDays: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  mobileMoneyNumber: string | null;
  notes: string | null;
  isActive: boolean;
  totalBilled: number;
  totalPaid: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// BILLS
// ============================================================================

export interface Bill {
  id: string;
  siteId: string;
  billNumber: string;
  vendorId: string;
  vendorBillReference: string | null;
  status: BillStatus;
  currency: string;
  exchangeRate: number;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  internalNotes: string | null;
  attachmentUrl: string | null;
  attachmentFilename: string | null;
  purchaseOrderId: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional joins)
  vendor?: Vendor | null;
  lineItems?: BillLineItem[];
}

// ============================================================================
// BILL LINE ITEMS
// ============================================================================

export interface BillLineItem {
  id: string;
  billId: string;
  expenseCategoryId: string | null;
  sortOrder: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  taxRateId: string | null;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  createdAt: string;
}

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export interface PurchaseOrder {
  id: string;
  siteId: string;
  poNumber: string;
  vendorId: string;
  status: POStatus;
  currency: string;
  issueDate: string;
  expectedDate: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  shippingAddress: string | null;
  notes: string | null;
  internalNotes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional joins)
  vendor?: Vendor | null;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateVendorInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  postalCode?: string | null;
  taxId?: string | null;
  currency?: string;
  paymentTermsDays?: number;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankBranchCode?: string | null;
  mobileMoneyNumber?: string | null;
  notes?: string | null;
  tags?: string[];
}

export interface CreateBillInput {
  vendorId: string;
  vendorBillReference?: string | null;
  currency?: string;
  issueDate?: string;
  dueDate: string;
  notes?: string | null;
  internalNotes?: string | null;
  attachmentUrl?: string | null;
  attachmentFilename?: string | null;
  purchaseOrderId?: string | null;
  tags?: string[];
  lineItems: CreateBillLineItemInput[];
}

export interface CreateBillLineItemInput {
  expenseCategoryId?: string | null;
  sortOrder?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  taxRateId?: string | null;
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  currency?: string;
  issueDate?: string;
  expectedDate?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  tags?: string[];
}

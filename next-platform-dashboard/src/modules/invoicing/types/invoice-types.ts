/**
 * Invoicing Module - Invoice Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for invoicing settings, invoices, invoice line items,
 * and items catalog. Maps to mod_invmod01_settings, mod_invmod01_invoices,
 * mod_invmod01_invoice_line_items, and mod_invmod01_items tables.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partial"
  | "paid"
  | "overdue"
  | "void"
  | "cancelled";

export type InvoiceSourceType =
  | "manual"
  | "recurring"
  | "booking"
  | "ecommerce"
  | "crm_deal"
  | "automation"
  | "quote_conversion";

export type DiscountType = "percentage" | "fixed";

export type LateFeeType = "percentage" | "fixed";

export type ItemType = "service" | "product" | "expense";

// ============================================================================
// INVOICING SETTINGS
// ============================================================================

export interface InvoicingSettings {
  id: string;
  siteId: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  invoiceNumberFormat: string;
  invoicePadding: number;
  creditNotePrefix: string;
  creditNoteNextNumber: number;
  billPrefix: string;
  billNextNumber: number;
  poPrefix: string;
  poNextNumber: number;
  defaultCurrency: string;
  defaultPaymentTermsDays: number;
  defaultPaymentTermsLabel: string;
  defaultTaxRateId: string | null;
  defaultNotes: string | null;
  defaultTerms: string | null;
  lateFeeEnabled: boolean;
  lateFeeType: LateFeeType;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  overdueReminderEnabled: boolean;
  overdueReminderSchedule: number[];
  brandLogoUrl: string | null;
  brandColor: string;
  companyName: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  companyTaxId: string | null;
  onlinePaymentEnabled: boolean;
  paymentInstructions: string | null;
  timezone: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ITEMS CATALOG
// ============================================================================

export interface Item {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  type: ItemType;
  unitPrice: number;
  unit: string | null;
  taxRateId: string | null;
  sku: string | null;
  category: string | null;
  isActive: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// INVOICES
// ============================================================================

export interface Invoice {
  id: string;
  siteId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  contactId: string | null;
  companyId: string | null;
  storefrontCustomerId: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  clientTaxId: string | null;
  currency: string;
  exchangeRate: number;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  paymentTerms: string | null;
  subtotal: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  creditsApplied: number;
  depositAmount: number;
  depositPaid: boolean;
  notes: string | null;
  terms: string | null;
  internalNotes: string | null;
  footer: string | null;
  reference: string | null;
  recurringInvoiceId: string | null;
  sourceType: InvoiceSourceType | null;
  sourceId: string | null;
  viewToken: string;
  paymentToken: string;
  sentAt: string | null;
  viewedAt: string | null;
  lastReminderSentAt: string | null;
  reminderCount: number;
  lateFeeAmount: number;
  lateFeeAppliedAt: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional joins)
  lineItems?: InvoiceLineItem[];
}

// ============================================================================
// INVOICE LINE ITEMS
// ============================================================================

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  itemId: string | null;
  sortOrder: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  taxRateId: string | null;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

export interface InvoiceWithItems extends Invoice {
  lineItems: InvoiceLineItem[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateInvoiceInput {
  contactId?: string | null;
  companyId?: string | null;
  storefrontCustomerId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientTaxId?: string | null;
  currency?: string;
  issueDate?: string;
  dueDate: string;
  paymentTerms?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number;
  depositAmount?: number;
  notes?: string | null;
  terms?: string | null;
  internalNotes?: string | null;
  footer?: string | null;
  reference?: string | null;
  sourceType?: InvoiceSourceType | null;
  sourceId?: string | null;
  tags?: string[];
  lineItems: CreateInvoiceLineItemInput[];
}

export interface CreateInvoiceLineItemInput {
  itemId?: string | null;
  sortOrder?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discountType?: DiscountType | null;
  discountValue?: number;
  taxRateId?: string | null;
}

export interface UpdateInvoiceInput {
  clientName?: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientTaxId?: string | null;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  paymentTerms?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number;
  depositAmount?: number;
  notes?: string | null;
  terms?: string | null;
  internalNotes?: string | null;
  footer?: string | null;
  reference?: string | null;
  tags?: string[];
  lineItems?: CreateInvoiceLineItemInput[];
}

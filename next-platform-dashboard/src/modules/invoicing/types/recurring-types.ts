/**
 * Invoicing Module - Recurring Invoice Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for recurring invoice templates and their line items.
 * Maps to mod_invmod01_recurring_invoices and mod_invmod01_recurring_line_items tables.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type RecurringStatus = "active" | "paused" | "completed" | "cancelled";

export type RecurringFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "semi_annually"
  | "annually"
  | "custom";

// ============================================================================
// RECURRING INVOICES
// ============================================================================

export interface RecurringInvoice {
  id: string;
  siteId: string;
  name: string;
  status: RecurringStatus;
  contactId: string | null;
  companyId: string | null;
  storefrontCustomerId: string | null;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  currency: string;
  frequency: RecurringFrequency;
  customIntervalDays: number | null;
  startDate: string;
  endDate: string | null;
  nextGenerateDate: string;
  maxOccurrences: number | null;
  occurrencesGenerated: number;
  autoSend: boolean;
  paymentTermsDays: number;
  notes: string | null;
  terms: string | null;
  subtotal: number;
  discountType: "percentage" | "fixed" | null;
  discountValue: number;
  taxAmount: number;
  total: number;
  tags: string[];
  lastGeneratedAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional joins)
  lineItems?: RecurringLineItem[];
}

// ============================================================================
// RECURRING LINE ITEMS
// ============================================================================

export interface RecurringLineItem {
  id: string;
  recurringInvoiceId: string;
  itemId: string | null;
  sortOrder: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  discountType: "percentage" | "fixed" | null;
  discountValue: number;
  taxRateId: string | null;
  taxRate: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateRecurringInput {
  name: string;
  contactId?: string | null;
  companyId?: string | null;
  storefrontCustomerId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientAddress?: string | null;
  currency?: string;
  frequency: RecurringFrequency;
  customIntervalDays?: number | null;
  startDate: string;
  endDate?: string | null;
  maxOccurrences?: number | null;
  autoSend?: boolean;
  paymentTermsDays?: number;
  notes?: string | null;
  terms?: string | null;
  tags?: string[];
  lineItems: CreateRecurringLineItemInput[];
}

export interface CreateRecurringLineItemInput {
  itemId?: string | null;
  sortOrder?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number;
  taxRateId?: string | null;
}

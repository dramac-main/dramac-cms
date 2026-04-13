/**
 * Invoicing Module - Credit Note Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for credit notes, credit note line items, and credit applications.
 * Maps to mod_invmod01_credit_notes, mod_invmod01_credit_note_line_items,
 * and mod_invmod01_credit_applications tables.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type CreditNoteStatus =
  | "draft"
  | "issued"
  | "partially_applied"
  | "fully_applied"
  | "void";

// ============================================================================
// CREDIT NOTES
// ============================================================================

export interface CreditNote {
  id: string;
  siteId: string;
  creditNumber: string;
  status: CreditNoteStatus;
  invoiceId: string | null;
  contactId: string | null;
  companyId: string | null;
  clientName: string;
  clientEmail: string | null;
  currency: string;
  issueDate: string;
  reason: string | null;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountApplied: number;
  amountRemaining: number;
  notes: string | null;
  internalNotes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional joins)
  lineItems?: CreditNoteLineItem[];
}

// ============================================================================
// CREDIT NOTE LINE ITEMS
// ============================================================================

export interface CreditNoteLineItem {
  id: string;
  creditNoteId: string;
  itemId: string | null;
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
// CREDIT APPLICATIONS
// ============================================================================

export interface CreditApplication {
  id: string;
  creditNoteId: string;
  invoiceId: string;
  amount: number;
  appliedAt: string;
  appliedBy: string | null;
  notes: string | null;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateCreditNoteInput {
  invoiceId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  currency?: string;
  issueDate?: string;
  reason?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  tags?: string[];
  lineItems: CreateCreditNoteLineItemInput[];
}

export interface CreateCreditNoteLineItemInput {
  itemId?: string | null;
  sortOrder?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  taxRateId?: string | null;
}

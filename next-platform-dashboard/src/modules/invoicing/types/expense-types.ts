/**
 * Invoicing Module - Expense Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for expenses and expense categories.
 * Maps to mod_invmod01_expenses and mod_invmod01_expense_categories tables.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid" | "void";

export type ExpensePaymentMethod =
  | "bank_transfer"
  | "cash"
  | "mobile_money"
  | "card"
  | "cheque"
  | "petty_cash"
  | "other";

// ============================================================================
// EXPENSE CATEGORIES
// ============================================================================

export interface ExpenseCategory {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  parentId: string | null;
  monthlyBudget: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

// ============================================================================
// EXPENSES
// ============================================================================

export interface Expense {
  id: string;
  siteId: string;
  expenseNumber: string | null;
  categoryId: string | null;
  vendorId: string | null;
  status: ExpenseStatus;
  date: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  taxRateId: string | null;
  taxAmount: number;
  description: string;
  receiptUrl: string | null;
  receiptFilename: string | null;
  paymentMethod: ExpensePaymentMethod | null;
  paymentReference: string | null;
  isBillable: boolean;
  isBilled: boolean;
  billedInvoiceId: string | null;
  contactId: string | null;
  companyId: string | null;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional joins)
  category?: ExpenseCategory | null;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateExpenseInput {
  categoryId?: string | null;
  vendorId?: string | null;
  date?: string;
  amount: number;
  currency?: string;
  taxRateId?: string | null;
  description: string;
  receiptUrl?: string | null;
  receiptFilename?: string | null;
  paymentMethod?: ExpensePaymentMethod | null;
  paymentReference?: string | null;
  isBillable?: boolean;
  contactId?: string | null;
  companyId?: string | null;
  notes?: string | null;
  tags?: string[];
}

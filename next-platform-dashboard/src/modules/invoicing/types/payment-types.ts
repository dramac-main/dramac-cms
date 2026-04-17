/**
 * Invoicing Module - Payment Types
 *
 * Phase INV-01: Database Foundation
 *
 * Types for payment records. Maps to mod_invmod01_payments table.
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

export type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "mobile_money"
  | "card"
  | "cheque"
  | "paypal"
  | "other"
  | "online";

export type PaymentType = "payment" | "refund";

export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

// ============================================================================
// PAYMENTS
// ============================================================================

export interface Payment {
  id: string;
  siteId: string;
  invoiceId: string;
  paymentNumber: string | null;
  receiptNumber: string | null;
  type: PaymentType;
  amount: number;
  currency: string;
  exchangeRate: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentMethodDetail: string | null;
  transactionReference: string | null;
  gatewayTransactionId: string | null;
  gatewayProvider: string | null;
  proofUrl: string | null;
  notes: string | null;
  status: PaymentStatus;
  recordedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreatePaymentInput {
  invoiceId: string;
  type?: PaymentType;
  amount: number;
  currency?: string;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  paymentMethodDetail?: string | null;
  transactionReference?: string | null;
  gatewayTransactionId?: string | null;
  gatewayProvider?: string | null;
  proofUrl?: string | null;
  notes?: string | null;
}

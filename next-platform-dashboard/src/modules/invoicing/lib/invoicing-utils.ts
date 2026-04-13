/**
 * Invoicing Module - Utility Functions
 *
 * Phase INV-01: Database Foundation
 *
 * Shared utility functions for the invoicing module.
 */

import { DEFAULT_INVOICING_SETTINGS } from "./invoicing-constants";

/**
 * Format an amount in cents to a display string.
 * E.g., 25000 → "K250.00"
 */
export function formatInvoiceAmount(
  amountInCents: number,
  currency: string = "ZMW",
): string {
  const symbols: Record<string, string> = {
    ZMW: "K",
    USD: "$",
    GBP: "£",
    EUR: "€",
    ZAR: "R",
  };
  const symbol = symbols[currency] || currency + " ";
  const amount = (amountInCents / 100).toFixed(2);
  return `${symbol}${amount}`;
}

/**
 * Generate an invoice number from settings.
 * E.g., "{prefix}-{year}-{number}" with prefix="INV", year=2026, number=1, padding=4
 * → "INV-2026-0001"
 */
export function generateInvoiceNumber(
  format: string,
  prefix: string,
  nextNumber: number,
  padding: number = DEFAULT_INVOICING_SETTINGS.invoicePadding,
): string {
  const year = new Date().getFullYear().toString();
  const paddedNumber = nextNumber.toString().padStart(padding, "0");

  return format
    .replace("{prefix}", prefix)
    .replace("{year}", year)
    .replace("{number}", paddedNumber);
}

/**
 * Calculate line item totals.
 * Returns subtotal, discount amount, tax amount, and total — all in cents.
 */
export function calculateLineItemTotals(
  quantity: number,
  unitPrice: number,
  discountType: "percentage" | "fixed" | null,
  discountValue: number,
  taxRate: number,
): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
} {
  const rawSubtotal = Math.round(quantity * unitPrice);

  let discountAmount = 0;
  if (discountType === "percentage") {
    // discountValue is in basis points (1000 = 10%)
    discountAmount = Math.round((rawSubtotal * discountValue) / 10000);
  } else if (discountType === "fixed") {
    discountAmount = discountValue;
  }

  const subtotal = rawSubtotal - discountAmount;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + taxAmount;

  return { subtotal: rawSubtotal, discountAmount, taxAmount, total };
}

/**
 * Calculate invoice-level totals from line items.
 */
export function calculateInvoiceTotals(
  lineItems: Array<{ subtotal: number; discountAmount: number; taxAmount: number; total: number }>,
  invoiceDiscountType: "percentage" | "fixed" | null,
  invoiceDiscountValue: number,
): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const taxAmount = lineItems.reduce((sum, li) => sum + li.taxAmount, 0);

  let discountAmount = 0;
  if (invoiceDiscountType === "percentage") {
    discountAmount = Math.round((subtotal * invoiceDiscountValue) / 10000);
  } else if (invoiceDiscountType === "fixed") {
    discountAmount = invoiceDiscountValue;
  }

  const total = subtotal - discountAmount + taxAmount;

  return { subtotal, discountAmount, taxAmount, total };
}

/**
 * Determine the number of days until an invoice is overdue.
 * Returns negative number if already overdue.
 */
export function daysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if an invoice status transition is valid.
 */
export function isValidInvoiceTransition(
  from: string,
  to: string,
  validTransitions: Record<string, string[]>,
): boolean {
  const allowed = validTransitions[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

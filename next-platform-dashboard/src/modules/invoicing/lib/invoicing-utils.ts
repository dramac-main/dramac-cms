/**
 * Invoicing Module - Utility Functions
 *
 * Phase INV-01: Database Foundation
 *
 * Shared utility functions for the invoicing module.
 */

import { DEFAULT_INVOICING_SETTINGS } from "./invoicing-constants";
import type { RecurringFrequency } from "../types/recurring-types";

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
 * Calculate the next generation date based on frequency.
 */
export function calculateNextDate(
  currentDate: string,
  frequency: RecurringFrequency,
  customIntervalDays?: number | null,
): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly": {
      const day = date.getDate();
      date.setMonth(date.getMonth() + 1);
      if (date.getDate() !== day) {
        date.setDate(0);
      }
      break;
    }
    case "quarterly": {
      const qDay = date.getDate();
      date.setMonth(date.getMonth() + 3);
      if (date.getDate() !== qDay) {
        date.setDate(0);
      }
      break;
    }
    case "semi_annually": {
      const sDay = date.getDate();
      date.setMonth(date.getMonth() + 6);
      if (date.getDate() !== sDay) {
        date.setDate(0);
      }
      break;
    }
    case "annually": {
      const aDay = date.getDate();
      date.setFullYear(date.getFullYear() + 1);
      if (date.getDate() !== aDay) {
        date.setDate(0);
      }
      break;
    }
    case "custom":
      date.setDate(date.getDate() + (customIntervalDays || 30));
      break;
  }

  return date.toISOString().split("T")[0];
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

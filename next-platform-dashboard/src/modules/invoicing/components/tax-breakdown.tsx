"use client";

/**
 * Tax Breakdown Component — INV-08
 *
 * Per-tax-rate breakdown display for invoice totals.
 * Shows each tax rate, its contribution, and totals.
 * All amounts in CENTS.
 */

import { formatInvoiceAmount } from "../lib/invoicing-utils";

interface TaxBreakdownItem {
  taxRateName: string;
  taxRatePercent: number;
  taxType: "inclusive" | "exclusive";
  amount: number;
}

interface TaxBreakdownProps {
  items: TaxBreakdownItem[];
  currency: string;
  /** Show as compact list or detailed card */
  variant?: "compact" | "detailed";
}

export function TaxBreakdown({
  items,
  currency,
  variant = "compact",
}: TaxBreakdownProps) {
  if (items.length === 0) return null;

  const totalTax = items.reduce((sum, item) => sum + item.amount, 0);

  if (variant === "compact") {
    return (
      <div className="space-y-1 text-sm">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-muted-foreground">
            <span>
              {item.taxRateName} ({item.taxRatePercent}%
              {item.taxType === "inclusive" ? " incl." : ""})
            </span>
            <span>{formatInvoiceAmount(item.amount, currency)}</span>
          </div>
        ))}
        {items.length > 1 && (
          <div className="flex justify-between font-medium border-t pt-1 mt-1">
            <span>Total Tax</span>
            <span>{formatInvoiceAmount(totalTax, currency)}</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h4 className="text-sm font-medium">Tax Breakdown</h4>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div>
              <span className="text-sm">{item.taxRateName}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {item.taxRatePercent}%
                {item.taxType === "inclusive" ? " (included)" : " (added)"}
              </span>
            </div>
            <span className="text-sm font-medium">
              {formatInvoiceAmount(item.amount, currency)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t pt-2">
        <span className="text-sm font-medium">Total Tax</span>
        <span className="text-sm font-semibold">
          {formatInvoiceAmount(totalTax, currency)}
        </span>
      </div>
    </div>
  );
}

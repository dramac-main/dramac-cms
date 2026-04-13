"use client";

import { formatInvoiceAmount } from "../lib/invoicing-utils";

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function AmountDisplay({
  amount,
  currency = "ZMW",
  className,
}: AmountDisplayProps) {
  return (
    <span className={className}>{formatInvoiceAmount(amount, currency)}</span>
  );
}

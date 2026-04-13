"use client";

import { INVOICE_STATUS_CONFIG } from "../lib/invoicing-constants";
import type { InvoiceStatus } from "../types";
import { cn } from "@/lib/utils";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = INVOICE_STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.color,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

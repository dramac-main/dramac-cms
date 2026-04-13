"use client";

import { Badge } from "@/components/ui/badge";
import { CREDIT_NOTE_STATUS_CONFIG } from "../lib/invoicing-constants";
import type { CreditNoteStatus } from "../types/credit-types";

interface CreditStatusBadgeProps {
  status: CreditNoteStatus;
}

export function CreditStatusBadge({ status }: CreditStatusBadgeProps) {
  const config = CREDIT_NOTE_STATUS_CONFIG[status] || {
    label: status,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  };

  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
      {config.label}
    </Badge>
  );
}

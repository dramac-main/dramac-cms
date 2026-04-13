"use client";

import { Badge } from "@/components/ui/badge";
import { EXPENSE_STATUS_CONFIG } from "../lib/invoicing-constants";
import type { ExpenseStatus } from "../types/expense-types";

interface ExpenseStatusBadgeProps {
  status: ExpenseStatus;
}

export function ExpenseStatusBadge({ status }: ExpenseStatusBadgeProps) {
  const config = EXPENSE_STATUS_CONFIG[status] || {
    label: status,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  };
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
      {config.label}
    </Badge>
  );
}

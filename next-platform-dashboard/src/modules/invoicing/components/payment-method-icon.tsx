"use client";

import type { PaymentMethod } from "../types/payment-types";
import { PAYMENT_METHOD_LABELS } from "../lib/invoicing-constants";
import {
  Building2,
  Banknote,
  Smartphone,
  CreditCard,
  FileCheck,
  Globe,
  CircleDollarSign,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  bank_transfer: Building2,
  cash: Banknote,
  mobile_money: Smartphone,
  card: CreditCard,
  cheque: FileCheck,
  paypal: CircleDollarSign,
  stripe: CreditCard,
  online: Globe,
  other: HelpCircle,
};

interface PaymentMethodIconProps {
  method: PaymentMethod;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

export function PaymentMethodIcon({
  method,
  showLabel = true,
  className,
  iconClassName,
}: PaymentMethodIconProps) {
  const Icon = METHOD_ICONS[method] || HelpCircle;
  const label = PAYMENT_METHOD_LABELS[method] || method;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn("h-4 w-4 shrink-0", iconClassName)} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

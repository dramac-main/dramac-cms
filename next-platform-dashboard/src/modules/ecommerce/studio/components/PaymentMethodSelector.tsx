/**
 * PaymentMethodSelector - Payment method selection component
 *
 * Phase ECOM-23: Checkout Components
 *
 * Allows customers to select their preferred payment method.
 */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Banknote, CreditCard, Landmark, Lock, Wallet } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentMethod } from "../../hooks/useCheckout";

// ============================================================================
// TYPES
// ============================================================================

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

function getMethodIcon(methodId: string) {
  if (methodId.startsWith("manual")) return Banknote;
  switch (methodId) {
    case "paddle":
    case "dpo":
    case "card":
    case "credit_card":
      return CreditCard;
    case "flutterwave":
    case "pesapal":
    case "bank":
    case "bank_transfer":
      return Landmark;
    case "paypal":
    case "wallet":
    default:
      return Wallet;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentMethodSelector({
  methods,
  selected,
  onSelect,
  disabled = false,
  className,
}: PaymentMethodSelectorProps) {
  /** Render a single payment method as a radio item */
  const renderMethodItem = (method: PaymentMethod) => {
    const Icon = getMethodIcon(method.id);
    const isMethodSelected = selected?.id === method.id;

    return (
      <label
        key={method.id}
        className={cn(
          "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors",
          isMethodSelected && "border-primary bg-primary/5",
          !isMethodSelected && "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <RadioGroupItem value={method.id} id={`payment-${method.id}`} />

        <div className="flex items-center gap-3 flex-1">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isMethodSelected
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="flex-1">
            <p className="font-medium">{method.name}</p>
            {method.description && (
              <p className="text-sm text-muted-foreground">
                {method.description}
              </p>
            )}
          </div>
        </div>
      </label>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">Payment Method</h3>

      {methods.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No payment methods available. Please contact support.
        </p>
      ) : (
        <RadioGroup
          value={selected?.id || ""}
          onValueChange={(value) => {
            const method = methods.find((m) => m.id === value);
            if (method) onSelect(method);
          }}
          disabled={disabled}
          className="space-y-3"
        >
          {methods.map(renderMethodItem)}
        </RadioGroup>
      )}

      {/* Security note */}
      <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
        <Lock className="h-4 w-4" aria-hidden="true" />
        Your payment information is secure and encrypted
      </p>
    </div>
  );
}

"use client";

/**
 * Currency Selector Component — INV-08
 *
 * Dropdown with currency code, symbol, and name.
 * Uses SUPPORTED_CURRENCIES from currency-service.
 */

import { SUPPORTED_CURRENCIES } from "../services/currency-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CurrencySelectorProps {
  value: string;
  onValueChange: (currency: string) => void;
  disabled?: boolean;
  /** Show only a subset of currencies */
  currencies?: string[];
}

export function CurrencySelector({
  value,
  onValueChange,
  disabled,
  currencies,
}: CurrencySelectorProps) {
  const available = currencies
    ? SUPPORTED_CURRENCIES.filter((c) => currencies.includes(c.code))
    : SUPPORTED_CURRENCIES;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {available.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span className="font-medium">{c.code}</span>
              <span className="text-muted-foreground">
                ({c.symbol}) {c.name}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

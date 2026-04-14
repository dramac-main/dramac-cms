"use client";

/**
 * Exchange Rate Display Component — INV-08
 *
 * Shows the current exchange rate between two currencies.
 * Read-only display for invoice forms and reports.
 */

import { useMemo } from "react";
import { getExchangeRate, getCurrency } from "../services/currency-service";
import { ArrowRight, TrendingUp } from "lucide-react";

interface ExchangeRateDisplayProps {
  fromCurrency: string;
  toCurrency: string;
  /** Optional pre-fetched rates */
  rates?: Record<string, number>;
  /** Show compact inline version */
  compact?: boolean;
}

export function ExchangeRateDisplay({
  fromCurrency,
  toCurrency,
  rates,
  compact,
}: ExchangeRateDisplayProps) {
  const rate = useMemo(
    () => getExchangeRate(fromCurrency, toCurrency, rates),
    [fromCurrency, toCurrency, rates],
  );

  const fromSymbol = getCurrency(fromCurrency)?.symbol || fromCurrency;
  const toSymbol = getCurrency(toCurrency)?.symbol || toCurrency;

  if (fromCurrency === toCurrency) return null;

  if (compact) {
    return (
      <span className="text-xs text-muted-foreground">
        1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
      <TrendingUp className="h-4 w-4 text-muted-foreground" />
      <span>
        {fromSymbol}1 {fromCurrency}
      </span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <span className="font-medium">
        {toSymbol}
        {rate.toFixed(4)} {toCurrency}
      </span>
    </div>
  );
}

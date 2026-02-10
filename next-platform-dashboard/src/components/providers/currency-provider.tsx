/**
 * CurrencyProvider — Phase FIX-01 Task 7
 * 
 * React context providing the agency's regional preferences (currency, locale, timezone, etc.)
 * to ALL components. Replaces the static DEFAULT_CURRENCY import pattern.
 * 
 * Mounted in (dashboard)/layout.tsx alongside BrandingProvider.
 * Server-side: layout fetches agency preferences and passes as initialPreferences prop.
 */
"use client";

import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TAX_RATE,
  DEFAULT_TAX_INCLUDED,
  DEFAULT_WEIGHT_UNIT,
  DEFAULT_DIMENSION_UNIT,
  getCurrencySymbol,
  formatCurrency as formatCurrencyUtil,
  formatDate as formatDateUtil,
  formatDateTime as formatDateTimeUtil,
} from "@/lib/locale-config";

export interface RegionalPreferences {
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  taxRate: number;
  taxInclusive: boolean;
  weightUnit: string;
  dimensionUnit: string;
}

export interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  taxRate: number;
  taxInclusive: boolean;
  weightUnit: string;
  dimensionUnit: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: RegionalPreferences = {
  currency: DEFAULT_CURRENCY,
  locale: DEFAULT_LOCALE,
  timezone: DEFAULT_TIMEZONE,
  dateFormat: DEFAULT_DATE_FORMAT,
  taxRate: DEFAULT_TAX_RATE,
  taxInclusive: DEFAULT_TAX_INCLUDED,
  weightUnit: DEFAULT_WEIGHT_UNIT,
  dimensionUnit: DEFAULT_DIMENSION_UNIT,
};

interface CurrencyProviderProps {
  children: React.ReactNode;
  /** Server-side fetched preferences for instant SSR render */
  initialPreferences?: Partial<RegionalPreferences> | null;
}

export function CurrencyProvider({
  children,
  initialPreferences,
}: CurrencyProviderProps) {
  const prefs: RegionalPreferences = useMemo(() => ({
    ...DEFAULT_PREFERENCES,
    ...initialPreferences,
  }), [initialPreferences]);

  const value: CurrencyContextType = useMemo(() => ({
    currency: prefs.currency,
    currencySymbol: getCurrencySymbol(prefs.currency),
    locale: prefs.locale,
    timezone: prefs.timezone,
    dateFormat: prefs.dateFormat,
    taxRate: prefs.taxRate,
    taxInclusive: prefs.taxInclusive,
    weightUnit: prefs.weightUnit,
    dimensionUnit: prefs.dimensionUnit,
    formatCurrency: (amount: number) =>
      formatCurrencyUtil(amount, prefs.currency, prefs.locale),
    formatDate: (date: Date | string) =>
      formatDateUtil(date, prefs.locale),
    formatDateTime: (date: Date | string) =>
      formatDateTimeUtil(date, prefs.locale, prefs.timezone),
  }), [prefs]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Hook to access agency currency/regional context.
 * Must be used within a CurrencyProvider.
 */
export function useAgencyCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback to defaults if used outside provider (e.g., in admin or public pages)
    return {
      currency: DEFAULT_CURRENCY,
      currencySymbol: DEFAULT_CURRENCY_SYMBOL,
      locale: DEFAULT_LOCALE,
      timezone: DEFAULT_TIMEZONE,
      dateFormat: DEFAULT_DATE_FORMAT,
      taxRate: DEFAULT_TAX_RATE,
      taxInclusive: DEFAULT_TAX_INCLUDED,
      weightUnit: DEFAULT_WEIGHT_UNIT,
      dimensionUnit: DEFAULT_DIMENSION_UNIT,
      formatCurrency: (amount: number) => formatCurrencyUtil(amount),
      formatDate: (date: Date | string) => formatDateUtil(date),
      formatDateTime: (date: Date | string) => formatDateTimeUtil(date),
    };
  }
  return context;
}

/**
 * Optional hook that returns null instead of throwing if not in a CurrencyProvider.
 */
export function useAgencyCurrencyOptional(): CurrencyContextType | null {
  return useContext(CurrencyContext) ?? null;
}

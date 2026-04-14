/**
 * Invoicing Module - Currency Service
 *
 * Phase INV-08: Tax Management, Multi-Currency & Compliance
 *
 * Multi-currency support with exchange rates, conversion, and formatting.
 * All monetary amounts are in CENTS (integers).
 */

// ============================================================================
// CURRENCY DEFINITIONS (Zambia-first)
// ============================================================================

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  /** Symbol position: "before" (default) or "after" */
  symbolPosition: "before" | "after";
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: "ZMW",
    name: "Zambian Kwacha",
    symbol: "K",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "BWP",
    name: "Botswana Pula",
    symbol: "P",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    decimals: 2,
    symbolPosition: "before",
  },
  {
    code: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    decimals: 0,
    symbolPosition: "before",
  },
  {
    code: "MWK",
    name: "Malawian Kwacha",
    symbol: "MK",
    decimals: 2,
    symbolPosition: "before",
  },
];

/** Quick lookup map */
const CURRENCY_MAP = new Map(SUPPORTED_CURRENCIES.map((c) => [c.code, c]));

// ============================================================================
// EXCHANGE RATE CACHE
// ============================================================================

interface ExchangeRateCache {
  rates: Record<string, number>;
  baseCurrency: string;
  lastUpdated: string;
}

/** In-memory cache for exchange rates (server-side) */
let rateCache: ExchangeRateCache | null = null;

/** Default fallback rates (approximate, used when API is unavailable) */
const FALLBACK_RATES: Record<string, number> = {
  ZMW: 1,
  USD: 0.037,
  GBP: 0.029,
  EUR: 0.034,
  ZAR: 0.67,
  BWP: 0.5,
  KES: 4.76,
  NGN: 57.0,
  TZS: 97.0,
  MWK: 64.0,
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the list of supported currencies.
 */
export function getSupportedCurrencies(): Currency[] {
  return SUPPORTED_CURRENCIES;
}

/**
 * Look up a currency by code.
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCY_MAP.get(code);
}

/**
 * Get the exchange rate between two currencies.
 * Uses cached rates or falls back to hardcoded estimates.
 *
 * @returns Exchange rate (multiply `from` amount by rate to get `to` amount)
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  cachedRates?: Record<string, number>,
): number {
  if (fromCurrency === toCurrency) return 1;

  const rates = cachedRates || rateCache?.rates || FALLBACK_RATES;

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  if (!fromRate || !toRate) return 1;

  // Rates are relative to ZMW base: convert from→ZMW→to
  // If rates are per-ZMW (i.e., 1 ZMW = X currency), then:
  // from→to = toRate / fromRate
  return toRate / fromRate;
}

/**
 * Convert an amount from one currency to another.
 * Amount is in CENTS. Returns CENTS in the target currency.
 *
 * @param amount Amount in CENTS
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @param rate Optional explicit exchange rate (overrides cached)
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate?: number,
): number {
  if (fromCurrency === toCurrency) return amount;

  const exchangeRate = rate ?? getExchangeRate(fromCurrency, toCurrency);
  return Math.round(amount * exchangeRate);
}

/**
 * Format an amount in cents for display with the correct currency symbol.
 *
 * @param amountInCents Amount in cents
 * @param currencyCode Currency code (default: "ZMW")
 */
export function formatCurrency(
  amountInCents: number,
  currencyCode: string = "ZMW",
): string {
  const currency = CURRENCY_MAP.get(currencyCode);
  const symbol = currency?.symbol || currencyCode + " ";
  const decimals = currency?.decimals ?? 2;
  const position = currency?.symbolPosition || "before";

  const absAmount = Math.abs(amountInCents);
  const divisor = decimals === 0 ? 1 : Math.pow(10, decimals);
  const formatted = (absAmount / divisor).toFixed(decimals);

  // Add thousands separator
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const displayAmount = parts.join(".");

  const sign = amountInCents < 0 ? "-" : "";

  if (position === "after") {
    return `${sign}${displayAmount} ${symbol}`;
  }
  return `${sign}${symbol}${displayAmount}`;
}

/**
 * Update the exchange rate cache from settings metadata.
 * Called when settings are loaded.
 */
export function setExchangeRateCache(cache: ExchangeRateCache): void {
  rateCache = cache;
}

/**
 * Get the current exchange rate cache.
 */
export function getExchangeRateCache(): ExchangeRateCache | null {
  return rateCache;
}

/**
 * Fetch exchange rates from a free API and return them.
 * Uses frankfurter.app (free, no API key required).
 * Returns rates relative to ZMW.
 */
export async function fetchExchangeRates(
  baseCurrency: string = "USD",
): Promise<Record<string, number> | null> {
  try {
    const targetCurrencies = SUPPORTED_CURRENCIES.map((c) => c.code)
      .filter((c) => c !== baseCurrency)
      .join(",");

    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(baseCurrency)}&to=${encodeURIComponent(targetCurrencies)}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.rates) return null;

    // frankfurter returns rates relative to baseCurrency
    // We want all rates relative to ZMW
    const usdToOthers: Record<string, number> = data.rates;
    usdToOthers[baseCurrency] = 1;

    // Convert to ZMW base
    const zmwRate = usdToOthers["ZMW"] || 27; // ~27 ZMW per 1 USD
    const zmwBaseRates: Record<string, number> = {};

    for (const [code, rate] of Object.entries(usdToOthers)) {
      // Rate is how many units of `code` per 1 USD
      // We want: how many units of `code` per 1 ZMW
      zmwBaseRates[code] = rate / zmwRate;
    }
    zmwBaseRates["ZMW"] = 1;

    return zmwBaseRates;
  } catch {
    return null;
  }
}

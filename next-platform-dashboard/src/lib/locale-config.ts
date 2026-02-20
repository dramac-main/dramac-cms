/**
 * Centralized Locale Configuration — USD Platform Defaults
 * 
 * ALL modules and components should import from this file
 * for currency formatting, date formatting, timezone, and region defaults.
 * 
 * Platform billing (Paddle) and domain registrar (ResellerClub) both use USD.
 * This ensures consistent USD localization across the entire platform.
 */

// =============================================================================
// REGION DEFAULTS
// =============================================================================

/** Default locale for formatting (US English) */
export const DEFAULT_LOCALE = 'en-US'

/** Default currency code — Zambian Kwacha (platform is Zambia-based) */
export const DEFAULT_CURRENCY = 'ZMW'

/** Default currency symbol */
export const DEFAULT_CURRENCY_SYMBOL = 'K'

/** Default timezone */
export const DEFAULT_TIMEZONE = 'Africa/Lusaka'

/** Default country code */
export const DEFAULT_COUNTRY = 'ZM'

/** Default date format */
export const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY'

/** Default tax rate (16% — Zambia standard VAT rate) */
export const DEFAULT_TAX_RATE = 16

/** Tax included in price by default (true — prices shown inclusive of VAT in Zambia) */
export const DEFAULT_TAX_INCLUDED = true

/** Default weight unit */
export const DEFAULT_WEIGHT_UNIT = 'kg'

/** Default dimension unit */
export const DEFAULT_DIMENSION_UNIT = 'cm'

// =============================================================================
// CURRENCY SYMBOLS MAP
// =============================================================================

export const CURRENCY_SYMBOLS: Record<string, string> = {
  ZMW: 'K',
  USD: '$',
  EUR: '€',
  GBP: '£',
  ZAR: 'R',
  KES: 'KSh',
  NGN: '₦',
  TZS: 'TSh',
  UGX: 'USh',
  RWF: 'FRw',
  GHS: '₵',
  XOF: 'CFA',
  XAF: 'FCFA',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  BWP: 'P',
  MWK: 'MK',
  MZN: 'MT',
}

/** Get the symbol for a currency code */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency
}

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format a number as currency
 * Defaults to USD with en-US locale
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback if currency code is invalid
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount.toFixed(2)}`
  }
}

/**
 * Format a price (alias for formatCurrency with simpler signature)
 */
export function formatPrice(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  return formatCurrency(amount, currency, locale)
}

/**
 * Format a number with locale-appropriate grouping
 * Defaults to en-US locale
 */
export function formatNumber(
  num: number,
  locale: string = DEFAULT_LOCALE
): string {
  if (num >= 1000000) {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(num)
  }
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Format a date with locale-appropriate formatting
 * Defaults to en-US locale with short month, numeric day and year
 */
export function formatDate(
  date: string | Date,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }
  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(new Date(date))
}

/**
 * Format a date range
 */
export function formatDateRange(
  start: string | Date,
  end: string | Date,
  locale: string = DEFAULT_LOCALE
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  })
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: string | Date,
  locale: string = DEFAULT_LOCALE,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(date))
}

/**
 * Format time only
 */
export function formatTime(
  date: string | Date,
  locale: string = DEFAULT_LOCALE,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(date))
}

// =============================================================================
// SUPPORTED CURRENCIES (for dropdowns)
// =============================================================================

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'K' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
]

// =============================================================================
// AFRICAN TIMEZONES (for dropdowns)
// =============================================================================

export const AFRICAN_TIMEZONES = [
  { value: 'Africa/Lusaka', label: 'Lusaka (CAT, UTC+2)' },
  { value: 'Africa/Harare', label: 'Harare (CAT, UTC+2)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST, UTC+2)' },
  { value: 'Africa/Maputo', label: 'Maputo (CAT, UTC+2)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT, UTC+3)' },
  { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (EAT, UTC+3)' },
  { value: 'Africa/Kampala', label: 'Kampala (EAT, UTC+3)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT, UTC+1)' },
  { value: 'Africa/Accra', label: 'Accra (GMT, UTC+0)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET, UTC+2)' },
  { value: 'Africa/Casablanca', label: 'Casablanca (WET, UTC+0)' },
  { value: 'Africa/Kigali', label: 'Kigali (CAT, UTC+2)' },
  { value: 'Africa/Windhoek', label: 'Windhoek (CAT, UTC+2)' },
  { value: 'Africa/Gaborone', label: 'Gaborone (CAT, UTC+2)' },
  { value: 'Africa/Blantyre', label: 'Blantyre (CAT, UTC+2)' },
]

export const ALL_TIMEZONES = [
  ...AFRICAN_TIMEZONES,
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (EST, UTC-5)' },
  { value: 'America/Chicago', label: 'Chicago (CST, UTC-6)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST, UTC-8)' },
  { value: 'Europe/London', label: 'London (GMT, UTC+0)' },
  { value: 'Europe/Paris', label: 'Paris (CET, UTC+1)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST, UTC+5:30)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST, UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST, UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST, UTC+10)' },
]

/**
 * Money helper — Session 3 (Commerce) portal-first invariant.
 *
 * Context: ecommerce, quotation, and booking tables store monetary values
 * as DECIMAL(p,2) / NUMERIC(p,2). Postgres returns them as strings or JS
 * numbers through the supabase-js client. Float arithmetic on those values
 * (e.g. 0.1 + 0.2 === 0.30000000000000004) is forbidden per Session 3 §4.7.
 *
 * Rules for Session 3 and beyond:
 *   - Any read that touches money must flow through `toCents()` into integer
 *     arithmetic. NEVER add, multiply, or apply percentages to DECIMAL
 *     values as JS numbers.
 *   - Any render that shows money to a portal user must flow through
 *     `formatCentsAsCurrency()` (or src/lib/locale-config.ts `formatCurrency`
 *     after `fromCents`). No `toFixed(2)`, no string concat with symbols.
 *   - DB columns remain DECIMAL in Session 3. A BIGINT cents migration is
 *     an explicit future project and out of scope here.
 *
 * This module has no external dependencies so it is safe to import from
 * client or server code.
 */

import { formatCurrency } from "@/lib/locale-config";

/**
 * Convert a DECIMAL / NUMERIC / number / numeric-string value to integer
 * minor units (cents). Uses banker-safe scaling: multiplies as strings when
 * possible so that 29.99 becomes exactly 2999 without floating drift.
 *
 * Examples:
 *   toCents("29.99")     -> 2999
 *   toCents(29.99)       -> 2999
 *   toCents("0.1")       -> 10
 *   toCents(null)        -> 0
 *   toCents("29.999")    -> 3000 (rounded half-up at 1/10th cent)
 */
export function toCents(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined || value === "") return 0;

  const str = typeof value === "number" ? numberToFixedString(value) : String(value).trim();
  if (str === "") return 0;

  // Accept optional sign + digits + optional "." + digits
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(str);
  if (!match) {
    // Fall back to Number parsing for exotic inputs; still avoid direct float math by rounding.
    const asNum = Number(value);
    if (!Number.isFinite(asNum)) return 0;
    return Math.round(asNum * 100);
  }

  const sign = match[1] === "-" ? -1 : 1;
  const whole = match[2];
  const frac = match[3] ?? "";

  // Normalize fractional part to exactly 2 digits with half-up rounding on the 3rd.
  let centsFrac: number;
  if (frac.length === 0) {
    centsFrac = 0;
  } else if (frac.length === 1) {
    centsFrac = Number(frac) * 10;
  } else if (frac.length === 2) {
    centsFrac = Number(frac);
  } else {
    const head = frac.slice(0, 2);
    const next = frac.charCodeAt(2) - 48; // '0' = 48
    centsFrac = Number(head) + (next >= 5 ? 1 : 0);
    // Handle carry (e.g. "0.999" -> 100 cents + 1 => bump whole)
    if (centsFrac === 100) {
      return sign * (Number(whole) * 100 + 100);
    }
  }

  return sign * (Number(whole) * 100 + centsFrac);
}

/**
 * Convert integer cents back to a DECIMAL-equivalent JS number with exactly
 * 2 decimal places. Safe because we divide cents (an integer) by 100.
 *
 * Examples:
 *   fromCents(2999) -> 29.99
 *   fromCents(0)    -> 0
 *   fromCents(-50)  -> -0.5
 */
export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return Math.trunc(cents) / 100;
}

/**
 * Add two or more cent values, guarding against non-integer inputs.
 */
export function addCents(...values: Array<number | null | undefined>): number {
  let total = 0;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) {
      total += Math.trunc(v);
    }
  }
  return total;
}

/**
 * Subtract b cents from a cents.
 */
export function subtractCents(a: number, b: number): number {
  return Math.trunc(a) - Math.trunc(b);
}

/**
 * Multiply a cents value by a non-money scalar (quantity, integer count).
 * Returns integer cents. Quantity must be an integer; decimal quantities are
 * rejected to avoid hidden rounding.
 */
export function multiplyCentsByQuantity(cents: number, quantity: number): number {
  if (!Number.isInteger(quantity)) {
    throw new Error(`multiplyCentsByQuantity: quantity must be an integer, got ${quantity}`);
  }
  return Math.trunc(cents) * quantity;
}

/**
 * Apply a percentage (e.g. tax rate 16, discount 10) to a cents value.
 * Rounds half-up. The percentage itself is accepted as a number (not cents).
 *
 * Examples:
 *   applyPercent(10000, 16)  -> 1600   (16% of K100.00 = K16.00)
 *   applyPercent(9999, 10)   -> 1000   (rounded from 999.9)
 */
export function applyPercent(cents: number, percent: number): number {
  if (!Number.isFinite(percent) || !Number.isFinite(cents)) return 0;
  // Scale percent to a 4-decimal integer so 7.5% and 16% both survive as
  // exact integers (75000 and 160000). Combined with *100 for the percent
  // divisor, we scale by 1_000_000 total.
  const pScaled = Math.round(percent * 10000);
  const numerator = Math.trunc(cents) * pScaled;
  // numerator / 1_000_000 stays within 2^53 for all realistic money values
  // (up to ~9 trillion cents). Math.round is half-away-from-zero for
  // non-negative values, which matches the half-up convention we want.
  return Math.round(numerator / 1_000_000);
}

/**
 * Format integer cents as a localized currency string.
 * Primary portal render-boundary entrypoint for Session 3.
 */
export function formatCentsAsCurrency(
  cents: number,
  currency?: string,
  locale?: string,
): string {
  return formatCurrency(fromCents(cents), currency, locale);
}

/**
 * Internal: convert a JS number to a fixed-scale string without scientific
 * notation (handles edge cases like 1e-7 that Number.prototype.toString
 * formats awkwardly).
 */
function numberToFixedString(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  // Use toFixed with 6 digits then strip trailing zeros to dodge scientific notation.
  const fixed = n.toFixed(6);
  return fixed.replace(/\.?0+$/, "");
}

/**
 * Portal-facing locale formatters.
 *
 * Money is stored internally in integer minor units (cents). Rendering
 * goes through Intl.NumberFormat with the row's currency. Dates use the
 * site's timezone when supplied, falling back to the user's runtime tz.
 */

import { fromCents } from "@/lib/money";

export function formatPortalCurrency(
  cents: number,
  currency: string | null | undefined,
  locale?: string,
): string {
  const iso = (currency && currency.length === 3 ? currency : "USD").toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: iso,
    }).format(fromCents(cents));
  } catch {
    // Fallback for invalid currency codes — never crash a portal render.
    return `${iso} ${fromCents(cents).toFixed(2)}`;
  }
}

export function formatPortalDate(
  iso: string | null | undefined,
  opts: { timeZone?: string; withTime?: boolean } = {},
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: opts.withTime ? "short" : undefined,
      timeZone: opts.timeZone,
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export function formatPortalRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatPortalDate(iso);
}

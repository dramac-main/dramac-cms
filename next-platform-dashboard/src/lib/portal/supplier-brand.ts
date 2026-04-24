import "server-only";

/**
 * Portal Supplier Brand Strip (Session 5).
 *
 * The portal must never leak the upstream supplier identity. A client
 * browsing their domains or business-email inbox sees only a neutral
 * "Domains" / "Business Email" surface — no ResellerClub or Titan
 * branding, no provider message ids, no supplier-specific hostnames.
 *
 * Two strippers are exported:
 *
 *   1. `stripSupplierBrandRow<T>(row)` — removes columns whose names
 *      carry supplier brand tokens (provider, provider_*, resellerclub,
 *      titan, resend, sendgrid, mailgun, postmark, twilio, cloudflare).
 *      Used by DAL reads before the row leaves the server boundary.
 *
 *   2. `stripSupplierBrandText(text)` — replaces brand tokens inside
 *      human-readable strings (labels, messages, error hints) with the
 *      neutral platform label. Used on anything that might carry a
 *      supplier brand in free text (error messages from upstream APIs,
 *      audit metadata echoed back to the client).
 *
 * Keep this list tightly scoped. Adding a token that also appears in
 * unrelated product names (e.g. `twilio` would match `twilio-style`)
 * risks stripping legitimate content. If in doubt, strip at the row
 * level only and leave text alone.
 */

const SUPPLIER_BRAND_COLUMN_TOKENS = [
  "resellerclub",
  "reseller_club",
  "titan",
  "titanmail",
  "titan_mail",
  "resend",
  "sendgrid",
  "mailgun",
  "postmark",
  "twilio",
  "cloudflare",
  "rcpl",
  "logicboxes",
];

const SUPPLIER_BRAND_COLUMN_PREFIXES = ["provider_", "rc_", "tm_"];

const SUPPLIER_BRAND_EXACT_COLUMNS = new Set([
  "provider",
  "provider_id",
  "provider_message_id",
  "provider_order_id",
  "provider_customer_id",
  "rc_order_id",
  "rc_customer_id",
  "rc_entity_id",
  "tm_order_id",
  "resellerclub_customer_id",
  "resellerclub_order_id",
]);

/**
 * Strip supplier-brand columns from a row-shaped object. Returns a new
 * object (never mutates the input). Nulls/undefined pass through.
 */
export function stripSupplierBrandRow<T extends Record<string, unknown>>(
  row: T | null | undefined,
): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (isBrandedColumn(k)) continue;
    out[k] = v;
  }
  return out as T;
}

export function isBrandedColumn(name: string): boolean {
  const lk = name.toLowerCase();
  if (SUPPLIER_BRAND_EXACT_COLUMNS.has(lk)) return true;
  if (SUPPLIER_BRAND_COLUMN_PREFIXES.some((p) => lk.startsWith(p))) return true;
  if (SUPPLIER_BRAND_COLUMN_TOKENS.some((t) => lk.includes(t))) return true;
  return false;
}

/**
 * Replace supplier brand tokens in a human-readable string with the
 * neutral platform label. Case-insensitive, whole-word-ish match.
 *
 * This handles error messages bubbling up from upstream APIs. A raw
 * "ResellerClub error: invalid auth" becomes "Service error: invalid
 * auth" before it reaches the portal UI.
 */
const TEXT_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /reseller\s*club/gi, replacement: "the domain service" },
  { pattern: /resellerclub/gi, replacement: "the domain service" },
  { pattern: /\btitan\s*mail\b/gi, replacement: "the email service" },
  { pattern: /\btitan\b/gi, replacement: "the email service" },
  { pattern: /\brcpl\b/gi, replacement: "the service" },
  { pattern: /\blogicboxes\b/gi, replacement: "the service" },
  { pattern: /\bresend\b/gi, replacement: "the delivery service" },
  { pattern: /\bsendgrid\b/gi, replacement: "the delivery service" },
  { pattern: /\bmailgun\b/gi, replacement: "the delivery service" },
  { pattern: /\bpostmark\b/gi, replacement: "the delivery service" },
  { pattern: /\btwilio\b/gi, replacement: "the messaging service" },
];

export function stripSupplierBrandText(text: string | null | undefined): string {
  if (text === null || text === undefined) return "";
  let out = String(text);
  for (const { pattern, replacement } of TEXT_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Apply both row-level column strip and text-level token strip to any
 * string fields in the cleaned row. Use this for domain/email DAL rows
 * where upstream error messages may appear in free-text columns like
 * `last_error_message`.
 */
export function stripSupplierBrandDeep<T extends Record<string, unknown>>(
  row: T | null | undefined,
): T | null {
  const cleaned = stripSupplierBrandRow(row);
  if (!cleaned) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cleaned)) {
    if (typeof v === "string") {
      out[k] = stripSupplierBrandText(v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

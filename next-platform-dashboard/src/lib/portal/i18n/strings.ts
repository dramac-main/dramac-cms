/**
 * Portal i18n Strings - Session 6D skeleton
 *
 * Central registry for portal-facing copy. Extraction-only in Session 6;
 * runtime locale switching will land in a follow-up session once the
 * translation pipeline (crowdin / po-files / AI pre-translate) is
 * picked. All user-facing strings rendered from portal surfaces should
 * eventually resolve through `t(...)` below.
 *
 * Usage:
 *   import { t } from "@/lib/portal/i18n/strings";
 *   <button>{t("portal.orders.refund.cta")}</button>
 *
 * Guidelines:
 *   - Keys are dot-delimited: `portal.<namespace>.<surface>.<role>`
 *   - Values are English source strings (en-US).
 *   - Never interpolate secrets/PII into keys.
 *   - Do NOT use for log output, audit trail, or machine-readable fields.
 */

export type PortalLocale = "en" | "en-US" | "en-GB" | "af";

export const DEFAULT_PORTAL_LOCALE: PortalLocale = "en-US";

/**
 * Central source strings. Keep sorted by namespace for discoverability.
 */
export const PORTAL_STRINGS = {
  // Common
  "portal.common.loading": "Loading…",
  "portal.common.retry": "Try again",
  "portal.common.save": "Save",
  "portal.common.cancel": "Cancel",
  "portal.common.delete": "Delete",
  "portal.common.refresh": "Refresh",
  "portal.common.search": "Search",
  "portal.common.filter": "Filter",
  "portal.common.clear": "Clear filters",
  "portal.common.all": "All",
  "portal.common.none": "None",
  "portal.common.empty": "Nothing to show yet",
  "portal.common.error.generic": "Something went wrong. Please try again.",
  "portal.common.error.denied": "You don't have permission for this action.",

  // Nav
  "portal.nav.overview": "Overview",
  "portal.nav.orders": "Orders",
  "portal.nav.products": "Products",
  "portal.nav.customers": "Customers",
  "portal.nav.quotes": "Quotes",
  "portal.nav.bookings": "Bookings",
  "portal.nav.invoices": "Invoicing",
  "portal.nav.blog": "Blog",
  "portal.nav.seo": "SEO",
  "portal.nav.media": "Media",
  "portal.nav.submissions": "Form submissions",
  "portal.nav.analytics": "Analytics",
  "portal.nav.communications": "Communications",
  "portal.nav.marketing": "Marketing",
  "portal.nav.crm": "CRM",
  "portal.nav.liveChat": "Live chat",
  "portal.nav.automation": "Automation",
  "portal.nav.agents": "AI agents",
  "portal.nav.support": "Support",

  // Orders
  "portal.orders.title": "Orders",
  "portal.orders.filter.status": "Status",
  "portal.orders.filter.fulfillment": "Fulfillment",
  "portal.orders.empty": "No orders match these filters.",
  "portal.orders.refund.cta": "Refund order",
  "portal.orders.cancel.cta": "Cancel order",
  "portal.orders.fulfill.cta": "Mark fulfilled",

  // Bookings
  "portal.bookings.title": "Bookings",
  "portal.bookings.reschedule.cta": "Reschedule",
  "portal.bookings.cancel.cta": "Cancel booking",
  "portal.bookings.checkIn.cta": "Check in",

  // Quotes
  "portal.quotes.title": "Quotes",
  "portal.quotes.accept.cta": "Mark accepted",
  "portal.quotes.reject.cta": "Mark rejected",
  "portal.quotes.expire.cta": "Expire quote",

  // Products
  "portal.products.title": "Products",
  "portal.products.publish.cta": "Publish",
  "portal.products.unpublish.cta": "Unpublish",
  "portal.products.archive.cta": "Archive",

  // Customers
  "portal.customers.title": "Customers",
  "portal.customers.viewOrders": "View orders",
} as const;

export type PortalStringKey = keyof typeof PORTAL_STRINGS;

/**
 * Resolve a portal string by key.
 *
 * For now this is a pass-through on source strings; when runtime
 * locale switching lands, replace the body with a locale-aware
 * resolver. The signature stays stable so callers don't churn.
 */
export function t(key: PortalStringKey): string {
  return PORTAL_STRINGS[key];
}

/**
 * Negotiate a PortalLocale from an Accept-Language header or similar.
 * Currently always returns the default — locale switching ships later.
 */
export function resolvePortalLocale(_hint?: string | null): PortalLocale {
  return DEFAULT_PORTAL_LOCALE;
}

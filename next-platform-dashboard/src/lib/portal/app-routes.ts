/**
 * Maps a module slug to the canonical portal route for that module's
 * primary surface, scoped to a given site. Falls back to the generic
 * launcher (`/portal/sites/{siteId}/apps/{slug}`) when no native portal
 * surface exists for that slug yet.
 *
 * Keep this map aligned with `next-platform-dashboard/src/app/portal/sites/[siteId]/`
 * directory: every entry MUST point at a directory that exists for portal users.
 */

const NATIVE_PORTAL_ROUTES: Record<string, string> = {
  // Commerce
  ecommerce: "/orders",
  "ecommerce-store": "/orders",
  store: "/orders",
  shop: "/orders",
  products: "/products",
  // Bookings & scheduling
  booking: "/bookings",
  bookings: "/bookings",
  appointments: "/bookings",
  scheduling: "/bookings",
  // Customer & sales
  crm: "/crm",
  customers: "/customers",
  quotes: "/quotes",
  // Finance
  invoicing: "/invoicing",
  invoices: "/invoicing",
  finance: "/invoicing",
  payments: "/payment-proofs",
  // Marketing
  marketing: "/marketing",
  "marketing-suite": "/marketing",
  "social-media": "/marketing",
  // Communications
  "live-chat": "/live-chat",
  livechat: "/live-chat",
  chat: "/live-chat",
  "chat-agents": "/chat-agents",
  // Content
  blog: "/blog",
  media: "/media",
  pages: "/pages",
  // SEO & analytics
  "seo-optimizer": "/seo",
  seo: "/seo",
  analytics: "/analytics",
  "google-analytics": "/analytics",
  // Automation
  automation: "/automation",
  workflows: "/automation",
  // Forms & submissions
  forms: "/submissions",
  submissions: "/submissions",
};

export function resolvePortalAppRoute(
  siteId: string,
  slugOrId: string,
  fallbackId?: string,
): string {
  const key = (slugOrId || "").toLowerCase().trim();
  const native = NATIVE_PORTAL_ROUTES[key];
  if (native) return `/portal/sites/${siteId}${native}`;
  // No native surface — link to the generic app launcher.
  const target = slugOrId || fallbackId || "";
  return `/portal/sites/${siteId}/apps/${target}`;
}

export function hasNativePortalSurface(
  slug: string | null | undefined,
): boolean {
  if (!slug) return false;
  return Boolean(NATIVE_PORTAL_ROUTES[slug.toLowerCase().trim()]);
}

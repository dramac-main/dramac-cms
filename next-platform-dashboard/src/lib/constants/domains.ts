/**
 * Domain Constants
 *
 * Phase DM-01: Domain Management Overhaul
 *
 * Single source of truth for all domain configuration.
 * All domain logic across the app MUST import from here.
 */

export const DOMAINS = {
  /** Platform base domain (for agency subdomains like agency-slug.dramac.app) */
  PLATFORM_BASE: process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "dramac.app",

  /** Sites base domain (for site subdomains like my-site.sites.dramacagency.com) */
  SITES_BASE:
    process.env.NEXT_PUBLIC_SITES_DOMAIN ?? "sites.dramacagency.com",

  /** App domain (dashboard, API, auth) — full URL */
  APP_DOMAIN:
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dramacagency.com",

  /** Default protocol */
  PROTOCOL: (process.env.NODE_ENV === "production" ? "https" : "http") as
    | "https"
    | "http",

  /** Vercel DNS CNAME target */
  VERCEL_CNAME: "cname.vercel-dns.com",

  /** Vercel A record IP */
  VERCEL_A_RECORD: "76.76.21.21",
} as const;

/**
 * Get the full public URL for a site.
 * Prefers custom domain if set, otherwise uses subdomain.
 */
export function getSiteUrl(site: {
  custom_domain?: string | null;
  subdomain: string;
}): string {
  if (site.custom_domain) {
    return `${DOMAINS.PROTOCOL}://${site.custom_domain}`;
  }
  return `${DOMAINS.PROTOCOL}://${site.subdomain}.${DOMAINS.SITES_BASE}`;
}

/**
 * Get the canonical URL for a specific page on a site.
 */
export function getCanonicalUrl(
  site: { custom_domain?: string | null; subdomain: string },
  path: string = "/"
): string {
  const base = getSiteUrl(site);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Extract subdomain from a hostname.
 * Returns null if hostname is not a subdomain of SITES_BASE.
 */
export function extractSubdomain(hostname: string): string | null {
  const base = DOMAINS.SITES_BASE;
  if (hostname.endsWith(`.${base}`)) {
    return hostname.replace(`.${base}`, "");
  }
  return null;
}

/**
 * Check if a hostname is the app domain (dashboard/API).
 */
export function isAppDomain(hostname: string): boolean {
  try {
    const appHostname = new URL(DOMAINS.APP_DOMAIN).hostname;
    return hostname === appHostname || hostname === "localhost";
  } catch {
    return hostname === "localhost";
  }
}

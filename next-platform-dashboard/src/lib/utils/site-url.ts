/**
 * Site URL utility functions
 * Centralized handling of site URLs using environment variables
 */

import { DOMAINS } from "@/lib/constants/domains";

const BASE_DOMAIN = DOMAINS.SITES_BASE;

/**
 * Get the full URL for a site
 */
export function getSiteUrl(
  subdomain: string,
  customDomain?: string | null,
): string {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  return `https://${subdomain}.${BASE_DOMAIN}`;
}

/**
 * Get the display domain for a site (without protocol)
 */
export function getSiteDomain(
  subdomain: string,
  customDomain?: string | null,
): string {
  if (customDomain) {
    return customDomain;
  }
  return `${subdomain}.${BASE_DOMAIN}`;
}

/**
 * Get the base domain from environment
 */
export function getBaseDomain(): string {
  return BASE_DOMAIN;
}

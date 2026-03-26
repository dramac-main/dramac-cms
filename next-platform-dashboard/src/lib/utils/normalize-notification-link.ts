/**
 * Normalize notification links to handle old URL formats.
 *
 * Old notifications stored URLs like:
 *   https://app.dramacagency.com/sites/{siteId}/ecommerce/orders
 *
 * Correct format is:
 *   /dashboard/sites/{siteId}/ecommerce?view=orders
 *
 * This function transforms old URLs to the correct format at click time,
 * ensuring both old and new notification links work correctly.
 */
export function normalizeNotificationLink(link: string): string {
  // Strip the origin if it's an absolute app URL, keep only the pathname
  let path = link;
  try {
    const url = new URL(link, "https://app.dramacagency.com");
    if (
      url.hostname === "app.dramacagency.com" ||
      url.hostname === "localhost"
    ) {
      path = url.pathname + url.search + url.hash;
    }
  } catch {
    // Not a valid URL, treat as relative path
  }

  // Already has /dashboard/ prefix — pass through
  if (path.startsWith("/dashboard/")) {
    return path;
  }

  // Old pattern: /sites/{siteId}/ecommerce/orders → /dashboard/sites/{siteId}/ecommerce?view=orders
  const ecomSubpageMatch = path.match(
    /^\/sites\/([^/]+)\/ecommerce\/(orders|products|quotes|customers)$/,
  );
  if (ecomSubpageMatch) {
    const [, siteId, view] = ecomSubpageMatch;
    return `/dashboard/sites/${siteId}/ecommerce?view=${view}`;
  }

  // Old pattern: /sites/{siteId}/ecommerce → /dashboard/sites/{siteId}/ecommerce
  const ecomMatch = path.match(/^\/sites\/([^/]+)\/ecommerce$/);
  if (ecomMatch) {
    return `/dashboard/sites/${ecomMatch[1]}/ecommerce`;
  }

  // Old pattern: /sites/{siteId}/booking → /dashboard/sites/{siteId}/booking
  const siteSubMatch = path.match(/^\/sites\/([^/]+)\/(.*)/);
  if (siteSubMatch) {
    return `/dashboard/sites/${siteSubMatch[1]}/${siteSubMatch[2]}`;
  }

  // Old pattern: /sites/{siteId} → /dashboard/sites/{siteId}
  const siteMatch = path.match(/^\/sites\/([^/]+)$/);
  if (siteMatch) {
    return `/dashboard/sites/${siteMatch[1]}`;
  }

  return path;
}

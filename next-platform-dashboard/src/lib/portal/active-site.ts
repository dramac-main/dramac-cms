import "server-only";

/**
 * Active-site resolution for the portal.
 *
 * The portal persists the last site the user had selected in a cookie so that
 * refreshing the root `/portal` page returns them to the same context. URL
 * path takes precedence when present (e.g. `/portal/sites/{siteId}/...`).
 *
 * Cookie is:
 *   - HttpOnly = false so the client site switcher can read it for optimistic UI
 *   - SameSite = Lax (portal runs same-origin with dashboard admin)
 *   - Max-Age = 30 days
 *   - NOT user-trusted. Every read through the DAL re-verifies ownership.
 *
 * NOTE: Server actions (`setPortalActiveSite`) live in `active-site-actions.ts`
 * because a file carrying `"use server"` may only export async functions.
 */

import { cookies } from "next/headers";
import { resolveClientSites } from "./permission-resolver";

export const PORTAL_ACTIVE_SITE_COOKIE = "portal_active_site_id";
export const PORTAL_ACTIVE_SITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Resolve the active site for a portal user.
 *
 * Priority:
 *   1. `preferredSiteId` from URL (caller pulls from path).
 *   2. Cookie, if it still references a site the user owns.
 *   3. The first site in the client's list.
 *   4. `null` when the client has no sites.
 *
 * This function is cheap — `resolveClientSites` is memoized per request.
 */
export async function resolveActiveSiteId(
  clientId: string,
  preferredSiteId?: string | null,
): Promise<string | null> {
  const sites = await resolveClientSites(clientId);
  if (sites.length === 0) return null;

  const owned = (id: string | null | undefined): boolean =>
    !!id && sites.some((s) => s.id === id);

  if (preferredSiteId && owned(preferredSiteId)) return preferredSiteId;

  const store = await cookies();
  const cookieVal = store.get(PORTAL_ACTIVE_SITE_COOKIE)?.value ?? null;
  if (owned(cookieVal)) return cookieVal;

  return sites[0]!.id;
}

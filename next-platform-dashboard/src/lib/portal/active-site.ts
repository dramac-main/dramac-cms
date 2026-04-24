"use server";

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
 */

import { cookies } from "next/headers";
import { resolveClientSites } from "./permission-resolver";
import { auditPortalSiteSwitch } from "./audit-log";

export const PORTAL_ACTIVE_SITE_COOKIE = "portal_active_site_id";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

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

/**
 * Server action invoked by the site switcher to persist the selection and
 * record an audit entry. Does NOT redirect — the client handles navigation.
 */
export async function setPortalActiveSite(params: {
  siteId: string;
  clientId: string;
  agencyId: string;
  authUserId: string;
  fromSiteId: string | null;
  isImpersonation?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    siteId,
    clientId,
    agencyId,
    authUserId,
    fromSiteId,
    isImpersonation,
  } = params;

  const sites = await resolveClientSites(clientId);
  if (!sites.some((s) => s.id === siteId)) {
    return { ok: false, error: "site_not_owned" };
  }

  const store = await cookies();
  store.set(PORTAL_ACTIVE_SITE_COOKIE, siteId, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: THIRTY_DAYS_SECONDS,
    path: "/",
  });

  await auditPortalSiteSwitch({
    authUserId,
    clientId,
    agencyId,
    fromSiteId,
    toSiteId: siteId,
    isImpersonation,
  });

  return { ok: true };
}

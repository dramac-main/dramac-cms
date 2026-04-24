"use server";

/**
 * Portal active-site server actions.
 *
 * Kept separate from `active-site.ts` because a module carrying the
 * `"use server"` directive may only export async functions (Next.js /
 * Turbopack enforces this at build time). Pure helpers and the cookie
 * constant live in `active-site.ts`.
 */

import { cookies } from "next/headers";
import { resolveClientSites } from "./permission-resolver";
import { auditPortalSiteSwitch } from "./audit-log";
import {
  PORTAL_ACTIVE_SITE_COOKIE,
  PORTAL_ACTIVE_SITE_COOKIE_MAX_AGE,
} from "./active-site";

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
    maxAge: PORTAL_ACTIVE_SITE_COOKIE_MAX_AGE,
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

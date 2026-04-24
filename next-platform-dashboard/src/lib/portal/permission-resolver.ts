import "server-only";

/**
 * Cached permission resolver for portal users.
 *
 * This is the ONE function portal code paths should call to ask
 * "can this user do X on site Y?". It wraps `getEffectivePermissions`
 * in React's per-request `cache()` so a single Server Component tree
 * that checks the same (clientId, siteId) pair many times pays the
 * DB round-trip exactly once.
 *
 * Design decisions:
 *   - Cached per (clientId, siteId) tuple using React `cache()`. Each
 *     RSC request gets a fresh cache; cross-request leakage is impossible.
 *   - Returns `null` for site access when the site does not belong to
 *     the client or is not loadable. Callers get a single failure mode.
 *   - Denials are NOT audited here. Audit logging lives in the DAL — it
 *     knows the action name, and a denial without an attempted action is
 *     just noise.
 */

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getEffectivePermissions,
  type EffectivePortalPermissions,
} from "./portal-permissions";
import type { PortalUser } from "./portal-auth";

export type PortalPermissionKey = keyof EffectivePortalPermissions;

export interface PortalSiteScope {
  siteId: string;
  name: string;
  agencyId: string;
  clientId: string;
  subdomain: string | null;
  customDomain: string | null;
  isPublished: boolean;
  permissions: EffectivePortalPermissions;
}

/**
 * Per-request cached site scope lookup. Returns `null` if the site does
 * not belong to the client, or cannot be loaded.
 *
 * Using React `cache()` means two calls with the same arguments in the
 * same RSC render share a single in-flight promise and result.
 */
export const resolveSiteScope = cache(
  async (clientId: string, siteId: string): Promise<PortalSiteScope | null> => {
    if (!clientId || !siteId) return null;

    const admin = createAdminClient();

    const { data: site, error } = await admin
      .from("sites")
      .select(
        "id, name, agency_id, client_id, subdomain, custom_domain, published",
      )
      .eq("id", siteId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (error || !site) return null;

    const permissions = await getEffectivePermissions(clientId, siteId);

    return {
      siteId: site.id,
      name: site.name,
      agencyId: site.agency_id,
      clientId: site.client_id ?? clientId,
      subdomain: site.subdomain ?? null,
      customDomain: site.custom_domain ?? null,
      isPublished: site.published ?? false,
      permissions,
    };
  },
);

/**
 * Per-request cached list of sites belonging to a client. Ordered by name.
 */
export const resolveClientSites = cache(
  async (
    clientId: string,
  ): Promise<
    Array<{
      id: string;
      name: string;
      subdomain: string | null;
      customDomain: string | null;
      isPublished: boolean;
    }>
  > => {
    if (!clientId) return [];

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("sites")
      .select("id, name, subdomain, custom_domain, published")
      .eq("client_id", clientId)
      .order("name", { ascending: true });

    if (error || !data) return [];

    return data.map((s) => ({
      id: s.id,
      name: s.name,
      subdomain: s.subdomain ?? null,
      customDomain: s.custom_domain ?? null,
      isPublished: s.published ?? false,
    }));
  },
);

/**
 * Single entry point for permission checks.
 *
 * Returns a rich result so callers can both branch on the boolean and get
 * the scope object for downstream use (e.g. passing to a data query).
 */
export interface PermissionCheckResult {
  allowed: boolean;
  scope: PortalSiteScope | null;
  reason: "ok" | "site_not_found" | "permission_denied";
}

export async function checkPortalPermission(
  user: Pick<PortalUser, "clientId">,
  siteId: string,
  permission: PortalPermissionKey,
): Promise<PermissionCheckResult> {
  const scope = await resolveSiteScope(user.clientId, siteId);
  if (!scope) {
    return { allowed: false, scope: null, reason: "site_not_found" };
  }
  if (!scope.permissions[permission]) {
    return { allowed: false, scope, reason: "permission_denied" };
  }
  return { allowed: true, scope, reason: "ok" };
}

/**
 * Convenience boolean wrapper for places that only need yes/no.
 */
export async function canPortalUser(
  user: Pick<PortalUser, "clientId">,
  siteId: string,
  permission: PortalPermissionKey,
): Promise<boolean> {
  const { allowed } = await checkPortalPermission(user, siteId, permission);
  return allowed;
}

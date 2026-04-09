"use server";

import { createClient } from "@/lib/supabase/server";
import type { PortalUser } from "./portal-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

// =============================================================================
// TYPES
// =============================================================================

export interface EffectivePortalPermissions {
  canViewAnalytics: boolean;
  canEditContent: boolean;
  canViewInvoices: boolean;
  canPublish: boolean;
  canManageLiveChat: boolean;
  canManageOrders: boolean;
  canManageProducts: boolean;
  canManageBookings: boolean;
  canManageCrm: boolean;
  canManageAutomation: boolean;
  canManageQuotes: boolean;
  canManageAgents: boolean;
  canManageCustomers: boolean;
}

// =============================================================================
// PERMISSION RESOLUTION
// =============================================================================

/**
 * Resolve effective permissions for a client on a specific site.
 * Site-level overrides take priority (if not null), else falls back to client-level.
 */
export async function getEffectivePermissions(
  clientId: string,
  siteId: string,
): Promise<EffectivePortalPermissions> {
  const supabase = await createClient();

  // Fetch client-level permissions and site-level overrides in parallel
  const [clientResult, sitePermResult] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "can_view_analytics, can_edit_content, can_view_invoices, can_manage_live_chat, can_manage_orders, can_manage_products, can_manage_bookings, can_manage_crm, can_manage_automation, can_manage_quotes, can_manage_agents, can_manage_customers",
      )
      .eq("id", clientId)
      .single(),
    supabase
      .from("client_site_permissions")
      .select(
        "can_view, can_edit_content, can_view_analytics, can_publish, can_manage_live_chat, can_manage_orders, can_manage_products, can_manage_bookings, can_manage_crm, can_manage_automation, can_manage_quotes, can_manage_agents, can_manage_customers",
      )
      .eq("client_id", clientId)
      .eq("site_id", siteId)
      .maybeSingle(),
  ]);

  const client = clientResult.data;
  const sitePerm = sitePermResult.data;

  if (!client) {
    // Client not found — return all false
    return {
      canViewAnalytics: false,
      canEditContent: false,
      canViewInvoices: false,
      canPublish: false,
      canManageLiveChat: false,
      canManageOrders: false,
      canManageProducts: false,
      canManageBookings: false,
      canManageCrm: false,
      canManageAutomation: false,
      canManageQuotes: false,
      canManageAgents: false,
      canManageCustomers: false,
    };
  }

  // Resolution: site-level not-null overrides client-level; otherwise use client-level
  const resolve = (
    siteVal: boolean | null | undefined,
    clientVal: boolean | null | undefined,
    fallback: boolean = false,
  ): boolean => {
    if (siteVal !== null && siteVal !== undefined) return siteVal;
    if (clientVal !== null && clientVal !== undefined) return clientVal;
    return fallback;
  };

  return {
    canViewAnalytics: resolve(
      sitePerm?.can_view_analytics,
      client.can_view_analytics,
      true,
    ),
    canEditContent: resolve(
      sitePerm?.can_edit_content,
      client.can_edit_content,
      false,
    ),
    canViewInvoices: resolve(null, client.can_view_invoices, true),
    canPublish: resolve(sitePerm?.can_publish, null, false),
    canManageLiveChat: resolve(
      sitePerm?.can_manage_live_chat,
      client.can_manage_live_chat,
    ),
    canManageOrders: resolve(
      sitePerm?.can_manage_orders,
      client.can_manage_orders,
    ),
    canManageProducts: resolve(
      sitePerm?.can_manage_products,
      client.can_manage_products,
    ),
    canManageBookings: resolve(
      sitePerm?.can_manage_bookings,
      client.can_manage_bookings,
    ),
    canManageCrm: resolve(sitePerm?.can_manage_crm, client.can_manage_crm),
    canManageAutomation: resolve(
      sitePerm?.can_manage_automation,
      client.can_manage_automation,
    ),
    canManageQuotes: resolve(
      sitePerm?.can_manage_quotes,
      client.can_manage_quotes,
    ),
    canManageAgents: resolve(
      sitePerm?.can_manage_agents,
      client.can_manage_agents,
    ),
    canManageCustomers: resolve(
      sitePerm?.can_manage_customers,
      client.can_manage_customers,
    ),
  };
}

// =============================================================================
// MODULE ACCESS VERIFICATION
// =============================================================================

/**
 * Verify a portal client has access to a module on a specific site.
 * Checks: site ownership, module installation, permission grant.
 * Throws notFound() or redirect() on failure.
 */
export async function verifyPortalModuleAccess(
  user: PortalUser,
  siteId: string,
  moduleSlug: string,
  requiredPermission: keyof EffectivePortalPermissions,
): Promise<{
  site: { id: string; name: string; agencyId: string };
  permissions: EffectivePortalPermissions;
}> {
  const supabase = await createClient();

  // 1. Verify the site belongs to this client
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, agency_id")
    .eq("id", siteId)
    .eq("client_id", user.clientId)
    .single();

  if (siteError || !site) {
    notFound();
  }

  // 2. Check module is installed on this site (by slug)
  const { data: moduleData } = await supabase
    .from("modules_v2")
    .select("id")
    .eq("slug", moduleSlug)
    .single();

  if (!moduleData) {
    notFound();
  }

  const { count } = await supabase
    .from("site_module_installations")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("module_id", moduleData.id)
    .eq("is_enabled", true);

  if (!count || count === 0) {
    notFound();
  }

  // 3. Check client has the required permission
  const permissions = await getEffectivePermissions(user.clientId, siteId);

  if (!permissions[requiredPermission]) {
    redirect("/portal");
  }

  return {
    site: { id: site.id, name: site.name, agencyId: site.agency_id },
    permissions,
  };
}

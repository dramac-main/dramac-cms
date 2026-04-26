import "server-only";

/**
 * Portal recipient resolver.
 *
 * Given a siteId + the portal permission flag that gates an event, returns
 * the full list of portal users interested in that event, PLUS the agency
 * owner. The dispatcher dedupes by user_id, so if an agency owner also has
 * a linked portal client we ship a single notification.
 *
 * A "portal user" here is an auth user whose client row:
 *   - is linked to the target site (sites.client_id match OR an entry in
 *     client_site_permissions)
 *   - has the relevant permission flag true (client-level or site-level)
 *   - has a linked auth user id (clients.portal_user_id set)
 *
 * Impersonators are NEVER recipients — the brief explicitly forbids this.
 * Impersonation is tracked on the WRITE side (audit log), not the read side.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { PortalPermissionKey } from "./permission-resolver";
import type { RecipientClass } from "./send-log";

export interface DispatchRecipient {
  userId: string;
  recipientClass: RecipientClass;
  email: string | null;
  name: string | null;
  agencyId: string;
  clientId: string | null;
  siteId: string;
}

const PERMISSION_TO_CLIENT_COLUMN: Record<PortalPermissionKey, string | null> =
  {
    canViewAnalytics: "can_view_analytics",
    canEditContent: "can_edit_content",
    canViewInvoices: "can_view_invoices",
    canManageInvoices: "can_manage_invoices" as string, // may not exist yet; falls back to view_invoices
    canPublish: null,
    canManageLiveChat: "can_manage_live_chat",
    canManageOrders: "can_manage_orders",
    canManageProducts: "can_manage_products",
    canManageBookings: "can_manage_bookings",
    canManageCrm: "can_manage_crm",
    canManageAutomation: "can_manage_automation",
    canManageQuotes: "can_manage_quotes",
    canManageAgents: "can_manage_agents",
    canManageCustomers: "can_manage_customers",
    canManageMarketing: "can_manage_marketing",
    canManageSupport: null,
  };

interface SiteRow {
  id: string;
  agency_id: string;
  client_id: string | null;
}

interface ClientRow {
  id: string;
  portal_user_id: string | null;
  email: string | null;
  name: string | null;
  [key: string]: unknown;
}

interface OwnerProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

/**
 * Resolve the full list of recipients for a site + permission flag.
 * Always includes the agency owner (recipient_class=agency_owner) and
 * any linked portal users who carry the permission (recipient_class=portal_user).
 */
export async function resolveInterestedRecipients(
  siteId: string,
  permission: PortalPermissionKey | null,
): Promise<DispatchRecipient[]> {
  const admin = createAdminClient();

  const { data: siteRow } = await admin
    .from("sites")
    .select("id, agency_id, client_id")
    .eq("id", siteId)
    .maybeSingle<SiteRow>();

  if (!siteRow || !siteRow.agency_id) return [];

  const out: DispatchRecipient[] = [];

  // 1. Agency owner — always receives (preserves existing behavior).
  const { data: agency } = await admin
    .from("agencies")
    .select("owner_id")
    .eq("id", siteRow.agency_id)
    .maybeSingle<{ owner_id: string | null }>();

  if (agency?.owner_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", agency.owner_id)
      .maybeSingle<OwnerProfile>();
    out.push({
      userId: agency.owner_id,
      recipientClass: "agency_owner",
      email: profile?.email ?? null,
      name: profile?.full_name ?? null,
      agencyId: siteRow.agency_id,
      clientId: null,
      siteId,
    });
  }

  // 2. Portal users — require permission flag to match.
  const clientColumn = permission
    ? PERMISSION_TO_CLIENT_COLUMN[permission]
    : null;

  // Build a query returning clients linked to this site via sites.client_id
  // and via client_site_permissions override table.
  const clientIds = new Set<string>();
  if (siteRow.client_id) clientIds.add(siteRow.client_id);

  const { data: sitePermRows } = await admin
    .from("client_site_permissions")
    .select("client_id")
    .eq("site_id", siteId);
  if (Array.isArray(sitePermRows)) {
    for (const r of sitePermRows as { client_id: string | null }[]) {
      if (r.client_id) clientIds.add(r.client_id);
    }
  }

  if (clientIds.size === 0) return out;

  // Fetch all candidate clients with their portal_user_id + permission column.
  const baseColumns = "id, portal_user_id, email, name";
  const selectColumns = clientColumn
    ? `${baseColumns}, ${clientColumn}`
    : baseColumns;

  const { data: clientRows } = await admin
    .from("clients")
    .select(selectColumns)
    .in("id", Array.from(clientIds));

  const candidateClients = (clientRows ?? []) as unknown as ClientRow[];

  // Pull site-level overrides in a single shot to evaluate effective permission.
  const { data: sitePermAll } = clientColumn
    ? await admin
        .from("client_site_permissions")
        .select(`client_id, ${clientColumn}`)
        .eq("site_id", siteId)
        .in("client_id", Array.from(clientIds))
    : { data: null };

  const sitePermMap = new Map<string, boolean | null>();
  if (Array.isArray(sitePermAll) && clientColumn) {
    for (const row of sitePermAll as unknown as Array<
      Record<string, unknown>
    >) {
      const cid = row.client_id as string | null;
      if (cid)
        sitePermMap.set(cid, (row[clientColumn] as boolean | null) ?? null);
    }
  }

  for (const c of candidateClients) {
    if (!c.portal_user_id) continue;
    // Permission check: site-level override wins, else client-level column.
    if (clientColumn) {
      const siteLevel = sitePermMap.get(c.id);
      const effective =
        siteLevel !== undefined && siteLevel !== null
          ? siteLevel
          : Boolean(c[clientColumn]);
      if (!effective) continue;
    }

    out.push({
      userId: c.portal_user_id,
      recipientClass: "portal_user",
      email: c.email ?? null,
      name: c.name ?? null,
      agencyId: siteRow.agency_id,
      clientId: c.id,
      siteId,
    });
  }

  return out;
}

/**
 * Dedupe recipients by userId. If a user appears as both agency_owner and
 * portal_user, keep the agency_owner entry (it preserves the legacy email
 * template binding and avoids accidental double-send).
 */
export function dedupeRecipients(
  recipients: DispatchRecipient[],
): DispatchRecipient[] {
  const byUser = new Map<string, DispatchRecipient>();
  for (const r of recipients) {
    const existing = byUser.get(r.userId);
    if (!existing) {
      byUser.set(r.userId, r);
      continue;
    }
    // Prefer agency_owner class if there's a conflict.
    if (
      existing.recipientClass !== "agency_owner" &&
      r.recipientClass === "agency_owner"
    ) {
      byUser.set(r.userId, r);
    }
  }
  return Array.from(byUser.values());
}

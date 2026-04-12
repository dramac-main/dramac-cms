/**
 * Portal Subscribers Page
 *
 * Phase MKT-11: Client Portal Marketing Views
 *
 * Subscriber management for portal clients.
 * Permission: canManageMarketing
 */

import { Suspense } from "react";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { getSubscribers } from "@/modules/marketing/actions/subscriber-actions";
import { getMailingLists } from "@/modules/marketing/actions/audience-actions";
import { SubscriberManager } from "@/modules/marketing/components/subscribers/subscriber-manager";
import { SubscriberManagerSkeleton } from "@/modules/marketing/components/subscribers/subscriber-manager-skeleton";

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function PortalSubscribersPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;
  const filters = await searchParams;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "marketing",
    "canManageMarketing",
  );

  const page = parseInt(filters.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  const [{ subscribers, total }, mailingLists] = await Promise.all([
    getSubscribers(siteId, {
      status: filters.status as any,
      search: filters.search || undefined,
      limit,
      offset,
    }),
    getMailingLists(siteId),
  ]);

  return (
    <PortalProvider
      value={{
        isPortalView: true,
        portalUser: {
          clientId: user.clientId,
          fullName: user.fullName,
          email: user.email,
          agencyId: user.agencyId,
        },
        permissions: {
          canManageLiveChat: permissions.canManageLiveChat,
          canManageOrders: permissions.canManageOrders,
          canManageProducts: permissions.canManageProducts,
          canManageBookings: permissions.canManageBookings,
          canManageCrm: permissions.canManageCrm,
          canManageAutomation: permissions.canManageAutomation,
          canManageQuotes: permissions.canManageQuotes,
          canManageAgents: permissions.canManageAgents,
          canManageCustomers: permissions.canManageCustomers,
          canManageMarketing: permissions.canManageMarketing,
        },
        siteId,
      }}
    >
      <Suspense fallback={<SubscriberManagerSkeleton />}>
        <SubscriberManager
          siteId={siteId}
          subscribers={subscribers}
          subscriberTotal={total}
          mailingLists={mailingLists}
          page={page}
          limit={limit}
        />
      </Suspense>
    </PortalProvider>
  );
}

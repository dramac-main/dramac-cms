/**
 * Portal Sequences Page
 *
 * Phase MKT-11: Client Portal Marketing Views
 *
 * Sequence list (view/pause only, no builder) for portal clients.
 * Permission: canManageMarketing
 */

import { Suspense } from "react";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { SequenceList } from "@/modules/marketing/components/sequences/sequence-list";
import { SequenceListSkeleton } from "@/modules/marketing/components/sequences/sequence-list-skeleton";

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function PortalSequencesPage({
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
      <Suspense fallback={<SequenceListSkeleton />}>
        <SequenceList siteId={siteId} filters={filters} />
      </Suspense>
    </PortalProvider>
  );
}

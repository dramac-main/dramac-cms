/**
 * Portal Marketing Hub Page
 *
 * Phase MKT-11: Client Portal Marketing Views
 *
 * Simplified marketing overview for portal clients.
 * Permission: canManageMarketing
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { MarketingHubDashboard } from "@/modules/marketing/components/hub/marketing-hub-dashboard";
import { MarketingHubSkeleton } from "@/modules/marketing/components/hub/marketing-hub-skeleton";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function PortalMarketingPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

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
      <Suspense fallback={<MarketingHubSkeleton />}>
        <MarketingHubDashboard siteId={siteId} />
      </Suspense>
    </PortalProvider>
  );
}

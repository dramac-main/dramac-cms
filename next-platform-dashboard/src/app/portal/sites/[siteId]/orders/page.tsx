/**
 * Portal Orders Page
 *
 * Mounts the existing EcommerceDashboard with initialView="orders".
 * Permission: canManageOrders
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { EcommerceDashboard } from "@/modules/ecommerce/components/ecommerce-dashboard";
import { PortalProvider } from "@/lib/portal/portal-context";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

function EcommerceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

export default async function PortalOrdersPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  const { site, permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "ecommerce",
    "canManageOrders",
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
      <Suspense fallback={<EcommerceSkeleton />}>
        <EcommerceDashboard
          siteId={siteId}
          agencyId={site.agencyId}
          userId={user.userId}
          userName={user.fullName}
          initialView="orders"
        />
      </Suspense>
    </PortalProvider>
  );
}

/**
 * Portal Landing Pages List
 *
 * Portal view for managing landing pages.
 * Permission: canManageMarketing
 */
import { Suspense } from "react";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { LandingPageList } from "@/modules/marketing/components/landing-pages/landing-page-list";
import { LandingPageListSkeleton } from "@/modules/marketing/components/landing-pages/landing-page-list-skeleton";

interface PageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function PortalLandingPagesPage({
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
      <Suspense fallback={<LandingPageListSkeleton />}>
        <LandingPageList siteId={siteId} filters={filters} basePath={`/portal/sites/${siteId}/marketing/landing-pages`} />
      </Suspense>
    </PortalProvider>
  );
}

/**
 * Portal - Edit Landing Page
 *
 * Permission: canManageMarketing
 */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { getLandingPage } from "@/modules/marketing/actions/landing-page-actions";
import { LandingPageEditor } from "@/modules/marketing/components/landing-pages/landing-page-editor";

interface PageProps {
  params: Promise<{ siteId: string; id: string }>;
}

async function LandingPageContent({
  siteId,
  id,
}: {
  siteId: string;
  id: string;
}) {
  const landingPage = await getLandingPage(id);
  if (!landingPage) notFound();

  return <LandingPageEditor siteId={siteId} landingPage={landingPage} />;
}

export default async function PortalLandingPageDetailPage({
  params,
}: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, id } = await params;

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
      <div className="flex-1 p-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-48 w-full" />
            </div>
          }
        >
          <LandingPageContent siteId={siteId} id={id} />
        </Suspense>
      </div>
    </PortalProvider>
  );
}

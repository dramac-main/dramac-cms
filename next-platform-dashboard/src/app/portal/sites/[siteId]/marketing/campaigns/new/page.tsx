/**
 * Portal New Campaign Page
 *
 * Phase MKT-11: Client Portal Marketing Views
 *
 * Campaign creation wizard for portal clients.
 * Reuses the campaign wizard component from dashboard.
 * Permission: canManageMarketing
 */

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { CampaignWizard } from "@/modules/marketing/components/campaigns/campaign-wizard";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

function WizardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default async function PortalNewCampaignPage({ params }: PageProps) {
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
      <Suspense fallback={<WizardSkeleton />}>
        <CampaignWizard siteId={siteId} />
      </Suspense>
    </PortalProvider>
  );
}

/**
 * Portal Campaign Detail Page
 *
 * Phase MKT-11: Client Portal Marketing Views
 *
 * Campaign details and analytics for portal clients.
 * Permission: canManageMarketing
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { getCampaign } from "@/modules/marketing/actions/campaign-actions";
import { CampaignDetail } from "@/modules/marketing/components/campaigns/campaign-detail";
import { CampaignDetailSkeleton } from "@/modules/marketing/components/campaigns/campaign-detail-skeleton";

interface PageProps {
  params: Promise<{ siteId: string; campaignId: string }>;
}

export default async function PortalCampaignDetailPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId, campaignId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "marketing",
    "canManageMarketing",
  );

  const campaign = await getCampaign(siteId, campaignId);
  if (!campaign) notFound();

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
      <div className="flex flex-col h-full">
        <div className="border-b px-6 py-3">
          <Link href={`/portal/sites/${siteId}/marketing/campaigns`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
        <div className="flex-1 p-6">
          <CampaignDetail siteId={siteId} campaign={campaign} />
        </div>
      </div>
    </PortalProvider>
  );
}

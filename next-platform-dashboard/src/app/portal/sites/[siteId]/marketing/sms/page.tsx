/**
 * Portal - SMS Campaigns
 *
 * Permission: canManageMarketing
 */
import { Suspense } from "react";
import Link from "next/link";
import { MessageSquare, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { verifyPortalModuleAccess } from "@/lib/portal/portal-permissions";
import { PortalProvider } from "@/lib/portal/portal-context";
import { getCampaigns } from "@/modules/marketing/actions/campaign-actions";
import { CAMPAIGN_STATUS_CONFIG } from "@/modules/marketing/lib/marketing-constants";
import type { CampaignStatus } from "@/modules/marketing/types";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function SMSCampaignsList({
  siteId,
  basePath,
}: {
  siteId: string;
  basePath: string;
}) {
  const { campaigns } = await getCampaigns(siteId, {
    type: "sms",
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              SMS Campaigns
            </h1>
            <p className="text-muted-foreground text-sm">
              Create and manage text message marketing campaigns
            </p>
          </div>
        </div>
        <Link href={`${basePath}/campaigns/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New SMS Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No SMS campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create your first SMS campaign to reach subscribers via text
              message.
            </p>
            <Link href={`${basePath}/campaigns/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create SMS Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              SMS Campaigns ({campaigns.length})
            </CardTitle>
            <Link href={`${basePath}/campaigns?type=sms`}>
              <Button variant="ghost" size="sm">
                View All in Campaigns
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.map((campaign: any) => {
                const status =
                  (campaign.status as CampaignStatus) || "draft";
                const config = CAMPAIGN_STATUS_CONFIG[status];
                return (
                  <Link
                    key={campaign.id}
                    href={`${basePath}/campaigns/${campaign.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.subject_line || "No subject"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`ml-2 ${config?.bgColor || ""} ${config?.color || ""}`}
                    >
                      {config?.label || status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SMSSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 mt-1" />
          </div>
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export default async function PortalSMSPage({ params }: PageProps) {
  const user = await requirePortalAuth();
  const { siteId } = await params;

  const { permissions } = await verifyPortalModuleAccess(
    user,
    siteId,
    "marketing",
    "canManageMarketing",
  );

  const basePath = `/portal/sites/${siteId}/marketing`;

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
        <Suspense fallback={<SMSSkeleton />}>
          <SMSCampaignsList siteId={siteId} basePath={basePath} />
        </Suspense>
      </div>
    </PortalProvider>
  );
}

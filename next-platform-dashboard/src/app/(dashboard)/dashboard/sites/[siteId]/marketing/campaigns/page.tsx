/**
 * Campaigns List Page
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { CampaignList } from "@/modules/marketing/components/campaigns/campaign-list";
import { CampaignListSkeleton } from "@/modules/marketing/components/campaigns/campaign-list-skeleton";

export const metadata: Metadata = {
  title: `Campaigns | ${PLATFORM.name}`,
  description: "Manage email campaigns",
};

interface CampaignsPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function CampaignsPage({
  params,
  searchParams,
}: CampaignsPageProps) {
  const { siteId } = await params;
  const filters = await searchParams;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <Link href={`/dashboard/sites/${siteId}/marketing`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Marketing Hub
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${siteId}/marketing/campaigns/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense fallback={<CampaignListSkeleton />}>
          <CampaignList siteId={siteId} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Campaigns List Page
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
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
    <div className="flex-1 p-6">
      <Suspense fallback={<CampaignListSkeleton />}>
        <CampaignList siteId={siteId} filters={filters} />
      </Suspense>
    </div>
  );
}

/**
 * Campaign Detail/Report Page
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { getCampaign } from "@/modules/marketing/actions/campaign-actions";
import { CampaignDetail } from "@/modules/marketing/components/campaigns/campaign-detail";
import { CampaignDetailSkeleton } from "@/modules/marketing/components/campaigns/campaign-detail-skeleton";

export const metadata: Metadata = {
  title: `Campaign | ${PLATFORM.name}`,
  description: "Campaign details and analytics",
};

interface CampaignDetailPageProps {
  params: Promise<{ siteId: string; campaignId: string }>;
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { siteId, campaignId } = await params;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing/campaigns`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense fallback={<CampaignDetailSkeleton />}>
          <CampaignDetailLoader siteId={siteId} campaignId={campaignId} />
        </Suspense>
      </div>
    </div>
  );
}

async function CampaignDetailLoader({
  siteId,
  campaignId,
}: {
  siteId: string;
  campaignId: string;
}) {
  const campaign = await getCampaign(siteId, campaignId);
  if (!campaign) notFound();

  return <CampaignDetail siteId={siteId} campaign={campaign} />;
}

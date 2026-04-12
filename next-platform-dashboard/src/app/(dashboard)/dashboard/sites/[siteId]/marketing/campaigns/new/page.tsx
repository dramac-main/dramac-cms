/**
 * New Campaign Page - Campaign Creation Wizard
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { CampaignWizard } from "@/modules/marketing/components/campaigns/campaign-wizard";

export const metadata: Metadata = {
  title: `New Campaign | ${PLATFORM.name}`,
  description: "Create a new email campaign",
};

interface NewCampaignPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewCampaignPage({
  params,
}: NewCampaignPageProps) {
  const { siteId } = await params;

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
        <CampaignWizard siteId={siteId} />
      </div>
    </div>
  );
}

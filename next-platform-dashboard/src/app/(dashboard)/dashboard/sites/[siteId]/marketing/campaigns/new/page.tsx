/**
 * New Campaign Page - Campaign Creation Wizard
 * Phase MKT-02: Email Campaign Engine (UI)
 */
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
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
    <div className="flex-1 p-6">
      <CampaignWizard siteId={siteId} />
    </div>
  );
}

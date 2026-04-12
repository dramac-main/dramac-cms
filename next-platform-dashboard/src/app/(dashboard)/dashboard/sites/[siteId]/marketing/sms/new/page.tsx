/**
 * New SMS Campaign Page
 * Phase MKT-08: SMS & WhatsApp Channel Foundation
 */
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { SMSCampaignComposer } from "@/modules/marketing/components/campaigns/sms-campaign-composer";

export const metadata: Metadata = {
  title: `New SMS Campaign | ${PLATFORM.name}`,
  description: "Create a new SMS campaign",
};

interface SMSCampaignPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function SMSCampaignPage({
  params,
}: SMSCampaignPageProps) {
  const { siteId } = await params;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6">
        <SMSCampaignComposer siteId={siteId} />
      </div>
    </div>
  );
}

/**
 * Marketing Hub - Main Dashboard Page
 * Phase MKT-05: Marketing Hub Dashboard
 *
 * Landing page for the marketing module with stats, recent activity,
 * and quick actions.
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { MarketingHubDashboard } from "@/modules/marketing/components/hub/marketing-hub-dashboard";
import { MarketingHubSkeleton } from "@/modules/marketing/components/hub/marketing-hub-skeleton";

export const metadata: Metadata = {
  title: `Marketing | ${PLATFORM.name}`,
  description:
    "Marketing Hub - Manage campaigns, sequences, and subscriber engagement",
};

interface MarketingPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { siteId } = await params;

  return (
    <Suspense fallback={<MarketingHubSkeleton />}>
      <MarketingHubDashboard siteId={siteId} />
    </Suspense>
  );
}

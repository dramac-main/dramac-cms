/**
 * Marketing Hub - Main Dashboard Page
 * Phase MKT-05: Marketing Hub Dashboard
 *
 * Landing page for the marketing module with stats, recent activity,
 * and quick actions.
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}?tab=marketing`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>

      <Suspense fallback={<MarketingHubSkeleton />}>
        <MarketingHubDashboard siteId={siteId} />
      </Suspense>
    </div>
  );
}

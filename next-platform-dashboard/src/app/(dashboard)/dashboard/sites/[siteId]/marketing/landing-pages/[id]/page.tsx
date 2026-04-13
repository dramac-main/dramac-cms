/**
 * Landing Page Analytics / Detail Page
 * Phase LPB-02: Studio LP Editor — Analytics Dashboard
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLATFORM } from "@/lib/constants/platform";
import { Skeleton } from "@/components/ui/skeleton";
import { getSite } from "@/lib/actions/sites";
import { getLandingPage } from "@/modules/marketing/actions/landing-page-actions";
import {
  getLPAnalytics,
  getLPFormSubmissions,
} from "@/modules/marketing/actions/lp-builder-actions";
import { LPAnalyticsDashboard } from "@/modules/marketing/components/landing-pages/lp-analytics-dashboard";
import type { LandingPageStudio } from "@/modules/marketing/types/lp-builder-types";

export const metadata: Metadata = {
  title: `Landing Page Analytics | ${PLATFORM.name}`,
  description: "View landing page analytics and performance",
};

interface LandingPageDetailProps {
  params: Promise<{ siteId: string; id: string }>;
}

async function LandingPageAnalyticsContent({
  siteId,
  id,
}: {
  siteId: string;
  id: string;
}) {
  const [site, landingPage, analytics, { submissions }] = await Promise.all([
    getSite(siteId),
    getLandingPage(id),
    getLPAnalytics(id),
    getLPFormSubmissions(id, { page: 1, pageSize: 10 }),
  ]);

  if (!landingPage) notFound();

  return (
    <LPAnalyticsDashboard
      landingPage={landingPage as unknown as LandingPageStudio}
      analytics={analytics}
      recentSubmissions={submissions}
      siteId={siteId}
      siteSubdomain={site.subdomain}
      siteCustomDomain={site.custom_domain}
    />
  );
}

export default async function LandingPageDetailPage({
  params,
}: LandingPageDetailProps) {
  const { siteId, id } = await params;

  return (
    <div className="flex-1 p-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        }
      >
        <LandingPageAnalyticsContent siteId={siteId} id={id} />
      </Suspense>
    </div>
  );
}

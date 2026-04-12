/**
 * Landing Pages List Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { LandingPageList } from "@/modules/marketing/components/landing-pages/landing-page-list";
import { LandingPageListSkeleton } from "@/modules/marketing/components/landing-pages/landing-page-list-skeleton";

export const metadata: Metadata = {
  title: `Landing Pages | ${PLATFORM.name}`,
  description: "Manage landing pages and lead capture",
};

interface LandingPagesPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function LandingPagesPage({
  params,
  searchParams,
}: LandingPagesPageProps) {
  const { siteId } = await params;
  const filters = await searchParams;

  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<LandingPageListSkeleton />}>
        <LandingPageList siteId={siteId} filters={filters} />
      </Suspense>
    </div>
  );
}

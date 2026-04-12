/**
 * Landing Pages List Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <Link href={`/dashboard/sites/${siteId}/marketing`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Marketing Hub
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${siteId}/marketing/landing-pages/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Landing Page
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense fallback={<LandingPageListSkeleton />}>
          <LandingPageList siteId={siteId} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}

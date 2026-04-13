/**
 * Landing Pages List Page
 * Phase LPB-02: Studio LP Editor — Enhanced List
 * Phase LPB-11: Migration tab for legacy → Studio conversion
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { getSite } from "@/lib/actions/sites";
import { getLandingPages } from "@/modules/marketing/actions/landing-page-actions";
import { getLPAnalyticsSummary } from "@/modules/marketing/actions/lp-builder-actions";
import { getMigrationStatus } from "@/modules/marketing/actions/lp-migration";
import { LPListEnhanced } from "@/modules/marketing/components/landing-pages/lp-list-enhanced";
import { LPMigrationPanel } from "@/modules/marketing/components/landing-pages/lp-migration-panel";
import { LandingPageListSkeleton } from "@/modules/marketing/components/landing-pages/landing-page-list-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LandingPageStudio } from "@/modules/marketing/types/lp-builder-types";
import type { LandingPageStatus } from "@/modules/marketing/types";

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

async function LandingPagesContent({
  siteId,
  filters,
}: {
  siteId: string;
  filters: { status?: string; search?: string; page?: string };
}) {
  const page = parseInt(filters.page || "1", 10);
  const pageSize = 20;

  const [site, { landingPages, total }, analyticsSummary] = await Promise.all([
    getSite(siteId),
    getLandingPages(siteId, {
      status: (filters.status as LandingPageStatus) || undefined,
      search: filters.search || undefined,
      page,
      pageSize,
    }),
    getLPAnalyticsSummary(siteId),
  ]);

  // Merge analytics summary into landing pages for display
  const enrichedPages = landingPages.map((lp) => {
    const stats = analyticsSummary[lp.id];
    return {
      ...lp,
      totalVisits: stats?.visits ?? lp.totalVisits ?? 0,
      totalConversions: stats?.conversions ?? lp.totalConversions ?? 0,
      conversionRate: stats?.rate ?? lp.conversionRate ?? 0,
    } as LandingPageStudio;
  });

  return (
    <LPListEnhanced
      landingPages={enrichedPages}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      siteId={siteId}
      siteName={site.name}
      siteSubdomain={site.subdomain}
      siteCustomDomain={site.custom_domain}
      currentStatus={filters.status}
      currentSearch={filters.search}
    />
  );
}

export default async function LandingPagesPage({
  params,
  searchParams,
}: LandingPagesPageProps) {
  const { siteId } = await params;
  const filters = await searchParams;

  // Check if there are legacy LPs to determine whether to show Migration tab
  const migrationStatus = await getMigrationStatus(siteId);
  const showMigrationTab = migrationStatus.legacy > 0;

  // If migration tab needed, also fetch the LP list for migration panel
  let legacyLPs: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    useStudioFormat: boolean;
    migratedAt: string | null;
  }> = [];

  if (showMigrationTab) {
    const { landingPages } = await getLandingPages(siteId, {
      page: 1,
      pageSize: 200,
    });
    legacyLPs = landingPages.map((lp) => {
      const raw = lp as unknown as Record<string, unknown>;
      return {
        id: lp.id,
        title: lp.title,
        slug: lp.slug,
        status: lp.status,
        useStudioFormat: (raw.useStudioFormat as boolean) ?? false,
        migratedAt: (raw.migratedAt as string | null) ?? null,
      };
    });
  }

  if (!showMigrationTab) {
    return (
      <div className="flex-1 p-6">
        <Suspense fallback={<LandingPageListSkeleton />}>
          <LandingPagesContent siteId={siteId} filters={filters} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">Landing Pages</TabsTrigger>
          <TabsTrigger value="migration">
            Migration ({migrationStatus.legacy} legacy)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pages">
          <Suspense fallback={<LandingPageListSkeleton />}>
            <LandingPagesContent siteId={siteId} filters={filters} />
          </Suspense>
        </TabsContent>
        <TabsContent value="migration">
          <LPMigrationPanel siteId={siteId} legacyLPs={legacyLPs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

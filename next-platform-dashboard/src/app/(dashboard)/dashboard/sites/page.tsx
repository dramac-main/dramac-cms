import { Suspense } from "react";
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SitesGrid } from "@/components/sites/sites-grid";
import { SitesGridSkeleton } from "@/components/sites/sites-grid-skeleton";
import { SiteFiltersBar } from "@/components/sites/site-filters-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { SiteFilters, SiteStatus } from "@/types/site";

export const metadata: Metadata = {
  title: "Sites | DRAMAC",
  description: "Manage your websites",
};

interface SitesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function SitesPage({ searchParams }: SitesPageProps) {
  const params = await searchParams;
  
  const filters: SiteFilters = {
    search: params.search,
    status: (params.status as SiteStatus | "all") || undefined,
    clientId: params.clientId,
    sortBy: params.sortBy as SiteFilters["sortBy"],
    sortOrder: params.sortOrder as SiteFilters["sortOrder"],
  };

  return (
    <div>
      <PageHeader
        title="Sites"
        description="Manage all your client websites."
      >
        <Link href="/dashboard/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Site
          </Button>
        </Link>
      </PageHeader>

      <div className="space-y-4">
        <SiteFiltersBar />

        <Suspense fallback={<SitesGridSkeleton />}>
          <SitesGrid filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}

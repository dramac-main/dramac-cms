import { Suspense } from "react";
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SitesGrid } from "@/components/sites/sites-grid";
import { SitesGridSkeleton } from "@/components/sites/sites-grid-skeleton";
import { SiteFiltersBar } from "@/components/sites/site-filters-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

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
  
  const filters = {
    search: params.search,
    status: params.status as "all" | "published" | "draft" | undefined,
    clientId: params.clientId,
    sortBy: params.sortBy as "name" | "created_at" | "updated_at" | undefined,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites"
        description="Manage all your client websites"
      >
        <Link href="/dashboard/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </Button>
        </Link>
      </PageHeader>

      <SiteFiltersBar />

      <Suspense fallback={<SitesGridSkeleton />}>
        <SitesGrid filters={filters} />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsTableSkeleton } from "@/components/clients/clients-table-skeleton";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ClientFiltersBar } from "@/components/clients/client-filters-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ClientFilters, ClientStatus } from "@/types/client";

export const metadata: Metadata = {
  title: "Clients | DRAMAC",
  description: "Manage your clients",
};

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    create?: string;
  }>;
}

// Helper to validate and convert search params to ClientFilters
function parseFilters(params: {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}): ClientFilters {
  const validStatuses: (ClientStatus | "all")[] = ["all", "active", "inactive", "archived"];
  const validSortBy: ClientFilters["sortBy"][] = ["name", "created_at", "updated_at"];
  const validSortOrder: ClientFilters["sortOrder"][] = ["asc", "desc"];

  return {
    search: params.search,
    status: validStatuses.includes(params.status as ClientStatus | "all")
      ? (params.status as ClientStatus | "all")
      : undefined,
    sortBy: validSortBy.includes(params.sortBy as ClientFilters["sortBy"])
      ? (params.sortBy as ClientFilters["sortBy"])
      : undefined,
    sortOrder: validSortOrder.includes(params.sortOrder as ClientFilters["sortOrder"])
      ? (params.sortOrder as ClientFilters["sortOrder"])
      : undefined,
  };
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const autoOpenCreate = params.create === "true";

  return (
    <DashboardShell>
      <PageHeader
        title="Clients"
        description="Manage your client accounts and their websites."
        actions={
          <CreateClientDialog defaultOpen={autoOpenCreate}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </CreateClientDialog>
        }
      />

      <div className="space-y-4">
        <ClientFiltersBar />

        <Suspense fallback={<ClientsTableSkeleton />}>
          <ClientsTable filters={filters} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}

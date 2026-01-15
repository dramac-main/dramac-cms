import { Metadata } from "next";
import { getAllAgencies } from "@/lib/actions/admin";
import { AgenciesTable } from "@/components/admin/agencies-table";
import { AgenciesFilters } from "@/components/admin/agencies-filters";

export const metadata: Metadata = {
  title: "Agency Management | Admin | DRAMAC",
  description: "View and manage all agencies on the platform",
};

interface AgenciesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminAgenciesPage({
  searchParams,
}: AgenciesPageProps) {
  const params = await searchParams;
  const { agencies, total, page, pageSize } = await getAllAgencies({
    search: params.search,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agency Management</h1>
        <p className="text-muted-foreground">
          View and manage all agencies on the platform
        </p>
      </div>

      <AgenciesFilters />

      <AgenciesTable
        agencies={agencies}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}

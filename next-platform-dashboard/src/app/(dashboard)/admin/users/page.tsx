import { Metadata } from "next";
import { getAllUsers } from "@/lib/actions/admin";
import { UsersTable } from "@/components/admin/users-table";
import { UsersFilters } from "@/components/admin/users-filters";

export const metadata: Metadata = {
  title: "User Management | Admin | DRAMAC",
  description: "Manage all users across the platform",
};

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({
  searchParams,
}: UsersPageProps) {
  const params = await searchParams;
  const { users, total, page, pageSize } = await getAllUsers({
    search: params.search,
    role: params.role,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage all users across the platform
        </p>
      </div>

      <UsersFilters />

      <UsersTable
        users={users}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}

import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isSuperAdmin();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto bg-background">{children}</main>
    </div>
  );
}

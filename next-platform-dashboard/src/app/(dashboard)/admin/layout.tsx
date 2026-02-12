import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";
import { LAYOUT } from "@/config/layout";

// All admin pages use cookies() via isSuperAdmin — must be dynamic
export const dynamic = 'force-dynamic';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isSuperAdmin();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin Sidebar - uses unified component with admin variant */}
      <AdminSidebar />
      
      {/* Main Content Area with responsive padding */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        LAYOUT.PAGE_PADDING // Responsive: p-4 lg:p-6
      )}>
        {children}
      </main>
    </div>
  );
}

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { getSyncStatus } from "@/lib/modules/module-catalog-sync";
import { SyncDashboard } from "@/components/admin/modules/sync-dashboard";

export const metadata: Metadata = {
  title: "Module Catalog Sync - Admin",
  description: "Sync studio modules to the marketplace catalog",
};

export default async function ModuleSyncPage() {
  const isAdmin = await isSuperAdmin();
  
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Get initial sync status
  const initialStatus = await getSyncStatus();

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Module Catalog Sync</h1>
        <p className="text-muted-foreground">
          Manage synchronization between Module Studio and the Marketplace catalog.
        </p>
      </div>

      <SyncDashboard initialStatus={initialStatus} />
    </div>
  );
}

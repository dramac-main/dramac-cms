import { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { PLATFORM } from "@/lib/constants/platform";
import { loadAdminSettings } from "./actions";
import { AdminSettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: `Admin Settings | ${PLATFORM.name}`,
  description: "Configure platform settings",
};

export default async function AdminSettingsPage() {
  await requireSuperAdmin();

  const initialSettings = await loadAdminSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure global platform settings and preferences"
      />

      <AdminSettingsClient initialSettings={initialSettings} />
    </div>
  );
}

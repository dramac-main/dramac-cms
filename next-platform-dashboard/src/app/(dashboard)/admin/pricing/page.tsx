import { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { PLATFORM } from "@/lib/constants/platform";
import PricingManagementClient from "./pricing-client";

export const metadata: Metadata = {
  title: `Pricing Cache Management | ${PLATFORM.name}`,
  description: "Manage and refresh ResellerClub domain and email pricing cache",
};

export default async function AdminPricingPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Cache"
        description="Manage the ResellerClub pricing cache. Prices are synced daily at 02:00 UTC — use manual refresh if you've updated prices in your ResellerClub panel."
      />

      <PricingManagementClient />
    </div>
  );
}

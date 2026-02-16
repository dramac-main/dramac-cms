import { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { PLATFORM } from "@/lib/constants/platform";
import PricingManagementClient from "./pricing-client";

export const metadata: Metadata = {
  title: `Domain Pricing | ${PLATFORM.name}`,
  description: "Manage and refresh ResellerClub domain and email pricing cache",
};

export default async function AdminPricingPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain Pricing"
        description="Manage the ResellerClub pricing cache. Prices are fetched from your RC panel's customer pricing (cost × profit margin). Use manual refresh after updating prices in ResellerClub."
      />

      <PricingManagementClient />
    </div>
  );
}

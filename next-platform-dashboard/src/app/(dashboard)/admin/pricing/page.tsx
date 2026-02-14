import { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { PLATFORM } from "@/lib/constants/platform";
import PricingManagementClient from "./pricing-client";

export const metadata: Metadata = {
  title: `Domain Pricing Management | ${PLATFORM.name}`,
  description: "Manage ResellerClub domain and email pricing cache",
};

export default async function AdminPricingPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="ResellerClub Pricing Management"
        description="Manually refresh domain and email pricing from ResellerClub API. Pricing is also automatically synced daily at 02:00 UTC."
      />

      <PricingManagementClient />
    </div>
  );
}

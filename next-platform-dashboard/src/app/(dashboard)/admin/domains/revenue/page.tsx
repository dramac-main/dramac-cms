// src/app/(dashboard)/admin/domains/revenue/page.tsx
// Super Admin — Platform Revenue Analytics

import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { getPlatformRevenueAnalytics } from "@/lib/actions/admin-domains";
import { RevenueAnalyticsClient } from "./revenue-client";

export default async function AdminDomainRevenuePage() {
  await requireSuperAdmin();

  let initialData = null;
  let error: string | undefined;

  try {
    const result = await getPlatformRevenueAnalytics();
    if (result.success && result.data) {
      initialData = result.data;
    } else {
      error = result.error;
    }
  } catch (e) {
    error = "Failed to load revenue analytics";
  }

  return (
    <div className="container mx-auto py-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">
                Loading revenue analytics...
              </p>
            </div>
          </div>
        }
      >
        <RevenueAnalyticsClient initialData={initialData} error={error} />
      </Suspense>
    </div>
  );
}

// src/app/(dashboard)/admin/domains/pricing/page.tsx
// Super Admin — Platform Pricing Controls
// Controls the apply_platform_markup flag and default markup for ALL agencies

import { Suspense } from "react";
import { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { PLATFORM } from "@/lib/constants/platform";
import { getPlatformPricingConfig } from "@/lib/actions/admin-domains";
import { PlatformPricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: `Platform Pricing Controls | ${PLATFORM.name}`,
  description: "Configure platform-wide domain pricing markup",
};

async function PricingContent() {
  const result = await getPlatformPricingConfig();
  return <PlatformPricingClient initialConfig={result.data || { apply_platform_markup: false, default_markup_type: "percentage", default_markup_value: 0 }} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
      </Card>
    </div>
  );
}

export default async function AdminDomainPricingPage() {
  await requireSuperAdmin();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}

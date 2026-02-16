// src/app/(dashboard)/dashboard/domains/settings/pricing/page.tsx
// Domain Pricing Configuration Page
// Moved from /dashboard/settings/domains/pricing/

import { Suspense } from "react";
import { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAgencyPricingConfig } from "@/lib/actions/domain-billing";
import { PricingPageClient } from "./pricing-client";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Pricing Configuration | Domain Settings | ${PLATFORM.name}`,
  description: "Configure domain pricing and markup rates",
};

async function PricingContent() {
  const result = await getAgencyPricingConfig();
  const config = result.data || {};
  
  return <PricingPageClient initialConfig={config} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>
      
      <Skeleton className="h-10 w-96" />
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DomainPricingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PricingContent />
    </Suspense>
  );
}

// src/app/(dashboard)/dashboard/settings/domains/billing/page.tsx
// Domain Billing Integration Page

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAgencyPricingConfig } from "@/lib/actions/domain-billing";
import { BillingIntegration } from "@/components/domains/settings";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Billing Integration | Domain Settings | ${PLATFORM.name}`,
  description: "Configure Paddle billing for domain services",
};

async function BillingContent() {
  const result = await getAgencyPricingConfig();
  const config = result.data || {};
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings/domains">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Billing Integration
          </h1>
          <p className="text-muted-foreground">
            Connect payment processing for domain purchases
          </p>
        </div>
      </div>
      
      <div className="max-w-2xl">
        <BillingIntegration config={config} />
      </div>
    </div>
  );
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
      
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DomainBillingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BillingContent />
    </Suspense>
  );
}

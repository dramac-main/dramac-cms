// src/app/(dashboard)/dashboard/settings/domains/branding/page.tsx
// Domain White-Label Branding Page

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAgencyPricingConfig } from "@/lib/actions/domain-billing";
import { DomainBrandingConfig } from "@/components/domains/settings";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Branding | Domain Settings | ${PLATFORM.name}`,
  description: "Configure white-label branding for domain services",
};

async function BrandingContent() {
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
            <Palette className="h-6 w-6" />
            White-Label Branding
          </h1>
          <p className="text-muted-foreground">
            Customize the domain services experience for your clients
          </p>
        </div>
      </div>
      
      <div className="max-w-2xl">
        <DomainBrandingConfig config={config} />
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
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DomainBrandingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BrandingContent />
    </Suspense>
  );
}

// src/app/(dashboard)/admin/domains/health/page.tsx
// Super Admin — Supplier Health Monitoring

import { Suspense } from "react";
import { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";
import { PLATFORM } from "@/lib/constants/platform";
import { SupplierHealthClient } from "./health-client";
import { checkSupplierHealth } from "@/lib/actions/admin-domains";

export const metadata: Metadata = {
  title: `Supplier Health | ${PLATFORM.name}`,
  description: "Monitor ResellerClub API status and account health",
};

async function HealthContent() {
  const result = await checkSupplierHealth();
  return <SupplierHealthClient initialHealth={result.data || null} error={result.error} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function SupplierHealthPage() {
  await requireSuperAdmin();

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HealthContent />
    </Suspense>
  );
}

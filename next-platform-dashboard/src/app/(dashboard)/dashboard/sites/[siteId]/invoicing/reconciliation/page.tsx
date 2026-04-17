/**
 * Payment Reconciliation Page — INVFIX-04.3
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { ReconciliationTool } from "@/modules/invoicing/components/reconciliation-tool";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Reconciliation | ${PLATFORM.name}`,
  description: "Match payments to invoices and resolve discrepancies",
};

interface ReconciliationPageProps {
  params: Promise<{ siteId: string }>;
}

function ReconciliationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-60" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function ReconciliationPage({
  params,
}: ReconciliationPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<ReconciliationSkeleton />}>
        <ReconciliationTool siteId={siteId} />
      </Suspense>
    </div>
  );
}

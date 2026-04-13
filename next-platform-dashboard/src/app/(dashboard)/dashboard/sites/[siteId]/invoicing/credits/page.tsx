/**
 * Credit Notes List Page — INV-05
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { CreditList } from "@/modules/invoicing/components/credit-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Credit Notes | ${PLATFORM.name}`,
  description: "Manage credit notes, refunds and adjustments",
};

interface CreditsPageProps {
  params: Promise<{ siteId: string }>;
}

function CreditListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function CreditsPage({ params }: CreditsPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<CreditListSkeleton />}>
        <CreditList siteId={siteId} />
      </Suspense>
    </div>
  );
}

/**
 * Expense Detail Page — INV-06
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { ExpenseDetail } from "@/modules/invoicing/components/expense-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Expense Details | ${PLATFORM.name}`,
  description: "View expense details and receipt",
};

interface ExpenseDetailPageProps {
  params: Promise<{ siteId: string; expenseId: string }>;
}

function ExpenseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}

export default async function ExpenseDetailPage({
  params,
}: ExpenseDetailPageProps) {
  const { siteId, expenseId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<ExpenseDetailSkeleton />}>
        <ExpenseDetail siteId={siteId} expenseId={expenseId} />
      </Suspense>
    </div>
  );
}

/**
 * Expenses List Page — INV-06
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { ExpenseList } from "@/modules/invoicing/components/expense-list";
import { ExpenseStatsCard } from "@/modules/invoicing/components/expense-stats-card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Expenses | ${PLATFORM.name}`,
  description: "Track and manage business expenses",
};

interface ExpensesPageProps {
  params: Promise<{ siteId: string }>;
}

function ExpenseListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6 space-y-6">
      <Suspense fallback={<ExpenseListSkeleton />}>
        <ExpenseStatsCard siteId={siteId} />
        <ExpenseList siteId={siteId} />
      </Suspense>
    </div>
  );
}

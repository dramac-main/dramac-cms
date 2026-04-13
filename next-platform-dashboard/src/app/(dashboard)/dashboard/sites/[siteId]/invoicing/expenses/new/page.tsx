/**
 * New Expense Page — INV-06
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { ExpenseForm } from "@/modules/invoicing/components/expense-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `New Expense | ${PLATFORM.name}`,
  description: "Record a new business expense",
};

interface NewExpensePageProps {
  params: Promise<{ siteId: string }>;
}

function ExpenseFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>
      </div>
    </div>
  );
}

export default async function NewExpensePage({ params }: NewExpensePageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<ExpenseFormSkeleton />}>
        <ExpenseForm siteId={siteId} mode="create" />
      </Suspense>
    </div>
  );
}

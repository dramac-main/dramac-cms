/**
 * Payments List Page — INV-03
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { PaymentList } from "@/modules/invoicing/components/payment-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Payments | ${PLATFORM.name}`,
  description: "Track payment history across all invoices",
};

interface PaymentsPageProps {
  params: Promise<{ siteId: string }>;
}

function PaymentListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<PaymentListSkeleton />}>
        <PaymentList siteId={siteId} />
      </Suspense>
    </div>
  );
}

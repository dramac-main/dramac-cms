/**
 * Payment Detail Page — INVFIX-04
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { PaymentDetail } from "@/modules/invoicing/components/payment-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Payment | ${PLATFORM.name}`,
  description: "View payment details",
};

interface PaymentDetailPageProps {
  params: Promise<{ siteId: string; paymentId: string }>;
}

export default async function PaymentDetailPage({
  params,
}: PaymentDetailPageProps) {
  const { siteId, paymentId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <PaymentDetail siteId={siteId} paymentId={paymentId} />
      </Suspense>
    </div>
  );
}

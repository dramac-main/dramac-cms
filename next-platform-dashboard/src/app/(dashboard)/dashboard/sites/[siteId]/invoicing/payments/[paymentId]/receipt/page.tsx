/**
 * Payment Receipt Page — INVFIX-04.1
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { PaymentReceiptPdf } from "@/modules/invoicing/components/payment-receipt-pdf";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Receipt | ${PLATFORM.name}`,
  description: "View and print payment receipt",
};

interface ReceiptPageProps {
  params: Promise<{ siteId: string; paymentId: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { siteId, paymentId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <PaymentReceiptPdf siteId={siteId} paymentId={paymentId} />
      </Suspense>
    </div>
  );
}

/**
 * Purchase Order Detail Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { PurchaseOrderDetail } from "@/modules/invoicing/components/purchase-order-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Purchase Order | ${PLATFORM.name}`,
  description: "View purchase order details",
};

interface PurchaseOrderDetailPageProps {
  params: Promise<{ siteId: string; purchaseOrderId: string }>;
}

export default async function PurchaseOrderDetailPage({
  params,
}: PurchaseOrderDetailPageProps) {
  const { siteId, purchaseOrderId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <PurchaseOrderDetail siteId={siteId} purchaseOrderId={purchaseOrderId} />
      </Suspense>
    </div>
  );
}

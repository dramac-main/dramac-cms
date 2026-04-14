/**
 * Edit Purchase Order Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { PurchaseOrderForm } from "@/modules/invoicing/components/purchase-order-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Edit Purchase Order | ${PLATFORM.name}`,
  description: "Edit a purchase order",
};

interface EditPurchaseOrderPageProps {
  params: Promise<{ siteId: string; purchaseOrderId: string }>;
}

export default async function EditPurchaseOrderPage({
  params,
}: EditPurchaseOrderPageProps) {
  const { siteId, purchaseOrderId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <PurchaseOrderForm siteId={siteId} purchaseOrderId={purchaseOrderId} />
      </Suspense>
    </div>
  );
}

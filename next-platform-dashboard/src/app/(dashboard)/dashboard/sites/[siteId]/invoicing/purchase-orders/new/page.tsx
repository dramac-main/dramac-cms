/**
 * New Purchase Order Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { PurchaseOrderForm } from "@/modules/invoicing/components/purchase-order-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `New Purchase Order | ${PLATFORM.name}`,
  description: "Create a new purchase order",
};

interface NewPurchaseOrderPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewPurchaseOrderPage({
  params,
}: NewPurchaseOrderPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <PurchaseOrderForm siteId={siteId} />
      </Suspense>
    </div>
  );
}

/**
 * Purchase Orders List Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { PurchaseOrderList } from "@/modules/invoicing/components/purchase-order-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Purchase Orders | ${PLATFORM.name}`,
  description: "Manage purchase orders for vendors",
};

interface PurchaseOrdersPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function PurchaseOrdersPage({
  params,
}: PurchaseOrdersPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <PurchaseOrderList siteId={siteId} />
      </Suspense>
    </div>
  );
}

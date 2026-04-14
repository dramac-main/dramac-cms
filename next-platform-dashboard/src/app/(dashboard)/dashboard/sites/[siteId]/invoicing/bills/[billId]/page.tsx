/**
 * Bill Detail Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { BillDetail } from "@/modules/invoicing/components/bill-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Bill | ${PLATFORM.name}`,
  description: "View bill details",
};

interface BillDetailPageProps {
  params: Promise<{ siteId: string; billId: string }>;
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { siteId, billId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <BillDetail siteId={siteId} billId={billId} />
      </Suspense>
    </div>
  );
}

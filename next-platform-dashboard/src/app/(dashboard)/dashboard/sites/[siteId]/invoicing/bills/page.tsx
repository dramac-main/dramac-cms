/**
 * Bills List Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { BillList } from "@/modules/invoicing/components/bill-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Bills | ${PLATFORM.name}`,
  description: "Manage vendor bills and accounts payable",
};

interface BillsPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function BillsPage({ params }: BillsPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <BillList siteId={siteId} />
      </Suspense>
    </div>
  );
}

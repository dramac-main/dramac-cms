/**
 * Edit Bill Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { BillForm } from "@/modules/invoicing/components/bill-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Edit Bill | ${PLATFORM.name}`,
  description: "Edit a vendor bill",
};

interface EditBillPageProps {
  params: Promise<{ siteId: string; billId: string }>;
}

export default async function EditBillPage({ params }: EditBillPageProps) {
  const { siteId, billId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <BillForm siteId={siteId} billId={billId} />
      </Suspense>
    </div>
  );
}

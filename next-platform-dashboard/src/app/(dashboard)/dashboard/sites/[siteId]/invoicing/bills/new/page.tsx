/**
 * New Bill Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { BillForm } from "@/modules/invoicing/components/bill-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `New Bill | ${PLATFORM.name}`,
  description: "Create a new vendor bill",
};

interface NewBillPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewBillPage({ params }: NewBillPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <BillForm siteId={siteId} />
      </Suspense>
    </div>
  );
}

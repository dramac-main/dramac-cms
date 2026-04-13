/**
 * Invoice Detail Page — INV-02
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { InvoiceDetail } from "@/modules/invoicing/components/invoice-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Invoice | ${PLATFORM.name}`,
  description: "View invoice details",
};

interface InvoiceDetailPageProps {
  params: Promise<{ siteId: string; invoiceId: string }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { siteId, invoiceId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <InvoiceDetail siteId={siteId} invoiceId={invoiceId} />
      </Suspense>
    </div>
  );
}

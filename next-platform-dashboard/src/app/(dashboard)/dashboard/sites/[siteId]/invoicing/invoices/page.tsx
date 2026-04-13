/**
 * Invoices List Page — INV-02
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { InvoiceList } from "@/modules/invoicing/components/invoice-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Invoices | ${PLATFORM.name}`,
  description: "Manage invoices, track payments, and send to clients",
};

interface InvoicesPageProps {
  params: Promise<{ siteId: string }>;
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function InvoicesPage({ params }: InvoicesPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList siteId={siteId} />
      </Suspense>
    </div>
  );
}

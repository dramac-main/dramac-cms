/**
 * Create New Invoice Page — INV-02
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { InvoiceForm } from "@/modules/invoicing/components/invoice-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `New Invoice | ${PLATFORM.name}`,
  description: "Create a new invoice",
};

interface NewInvoicePageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewInvoicePage({ params }: NewInvoicePageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <InvoiceForm siteId={siteId} mode="create" />
      </Suspense>
    </div>
  );
}

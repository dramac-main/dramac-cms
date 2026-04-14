/**
 * New Vendor Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { VendorForm } from "@/modules/invoicing/components/vendor-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `New Vendor | ${PLATFORM.name}`,
  description: "Add a new vendor",
};

interface NewVendorPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewVendorPage({ params }: NewVendorPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <VendorForm siteId={siteId} />
      </Suspense>
    </div>
  );
}

/**
 * Edit Vendor Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { VendorForm } from "@/modules/invoicing/components/vendor-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Edit Vendor | ${PLATFORM.name}`,
  description: "Edit vendor details",
};

interface EditVendorPageProps {
  params: Promise<{ siteId: string; vendorId: string }>;
}

export default async function EditVendorPage({ params }: EditVendorPageProps) {
  const { siteId, vendorId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <VendorForm siteId={siteId} vendorId={vendorId} />
      </Suspense>
    </div>
  );
}

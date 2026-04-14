/**
 * Vendor Detail Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { VendorDetail } from "@/modules/invoicing/components/vendor-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Vendor | ${PLATFORM.name}`,
  description: "View vendor details",
};

interface VendorDetailPageProps {
  params: Promise<{ siteId: string; vendorId: string }>;
}

export default async function VendorDetailPage({
  params,
}: VendorDetailPageProps) {
  const { siteId, vendorId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <VendorDetail siteId={siteId} vendorId={vendorId} />
      </Suspense>
    </div>
  );
}

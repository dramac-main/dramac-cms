/**
 * Vendors List Page — INV-14
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { VendorList } from "@/modules/invoicing/components/vendor-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Vendors | ${PLATFORM.name}`,
  description: "Manage vendors and supplier relationships",
};

interface VendorsPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function VendorsPage({ params }: VendorsPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <VendorList siteId={siteId} />
      </Suspense>
    </div>
  );
}

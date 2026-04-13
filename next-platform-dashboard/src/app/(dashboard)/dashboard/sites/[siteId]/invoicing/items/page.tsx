/**
 * Items Catalog Page — INV-02
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { ItemsCatalog } from "@/modules/invoicing/components/items-catalog";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Items | ${PLATFORM.name}`,
  description: "Manage reusable items for invoices",
};

interface ItemsPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function ItemsPage({ params }: ItemsPageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ItemsCatalog siteId={siteId} />
      </Suspense>
    </div>
  );
}

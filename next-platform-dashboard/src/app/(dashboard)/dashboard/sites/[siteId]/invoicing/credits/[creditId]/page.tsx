/**
 * Credit Note Detail Page — INV-05
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { CreditDetail } from "@/modules/invoicing/components/credit-detail";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `Credit Note | ${PLATFORM.name}`,
  description: "View credit note details",
};

interface CreditNoteDetailPageProps {
  params: Promise<{ siteId: string; creditId: string }>;
}

export default async function CreditNoteDetailPage({
  params,
}: CreditNoteDetailPageProps) {
  const { siteId, creditId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <CreditDetail siteId={siteId} creditNoteId={creditId} />
      </Suspense>
    </div>
  );
}

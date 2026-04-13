/**
 * Create New Credit Note Page — INV-05
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { CreditForm } from "@/modules/invoicing/components/credit-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: `New Credit Note | ${PLATFORM.name}`,
  description: "Create a new credit note",
};

interface NewCreditNotePageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewCreditNotePage({
  params,
}: NewCreditNotePageProps) {
  const { siteId } = await params;
  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <CreditForm siteId={siteId} mode="create" />
      </Suspense>
    </div>
  );
}

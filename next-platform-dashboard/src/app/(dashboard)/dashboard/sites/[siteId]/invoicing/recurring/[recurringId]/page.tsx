import { Suspense } from "react";
import { RecurringDetail } from "@/modules/invoicing/components/recurring-detail";

export default async function RecurringDetailPage({
  params,
}: {
  params: Promise<{ siteId: string; recurringId: string }>;
}) {
  const { siteId, recurringId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <RecurringDetail siteId={siteId} recurringId={recurringId} />
    </Suspense>
  );
}

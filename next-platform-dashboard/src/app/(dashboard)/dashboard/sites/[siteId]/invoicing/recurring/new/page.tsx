import { Suspense } from "react";
import { RecurringForm } from "@/modules/invoicing/components/recurring-form";

export default async function NewRecurringPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <RecurringForm siteId={siteId} />
    </Suspense>
  );
}

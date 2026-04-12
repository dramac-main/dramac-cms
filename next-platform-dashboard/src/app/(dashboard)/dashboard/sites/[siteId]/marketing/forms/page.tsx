/**
 * Forms List Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { FormList } from "@/modules/marketing/components/forms/form-list";
import { FormListSkeleton } from "@/modules/marketing/components/forms/form-list-skeleton";

export const metadata: Metadata = {
  title: `Opt-In Forms | ${PLATFORM.name}`,
  description: "Manage opt-in forms and lead capture",
};

interface FormsPageProps {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{
    formType?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function FormsPage({
  params,
  searchParams,
}: FormsPageProps) {
  const { siteId } = await params;
  const filters = await searchParams;

  return (
    <div className="flex-1 p-6">
      <Suspense fallback={<FormListSkeleton />}>
        <FormList siteId={siteId} filters={filters} />
      </Suspense>
    </div>
  );
}

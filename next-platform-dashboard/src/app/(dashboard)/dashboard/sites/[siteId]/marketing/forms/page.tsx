/**
 * Forms List Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <Link href={`/dashboard/sites/${siteId}/marketing`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Marketing Hub
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${siteId}/marketing/forms/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Form
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense fallback={<FormListSkeleton />}>
          <FormList siteId={siteId} filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}

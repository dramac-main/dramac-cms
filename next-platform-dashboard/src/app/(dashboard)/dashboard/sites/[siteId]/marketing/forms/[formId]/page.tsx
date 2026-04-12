/**
 * Form Detail / Edit Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PLATFORM } from "@/lib/constants/platform";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getForm } from "@/modules/marketing/actions/form-actions";
import { FormBuilder } from "@/modules/marketing/components/forms/form-builder";

export const metadata: Metadata = {
  title: `Edit Form | ${PLATFORM.name}`,
  description: "Edit opt-in form",
};

interface FormDetailProps {
  params: Promise<{ siteId: string; formId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

async function FormContent({
  siteId,
  formId,
  defaultTab,
}: {
  siteId: string;
  formId: string;
  defaultTab?: string;
}) {
  const form = await getForm(formId);
  if (!form) notFound();

  return <FormBuilder siteId={siteId} form={form} defaultTab={defaultTab} />;
}

export default async function FormDetailPage({
  params,
  searchParams,
}: FormDetailProps) {
  const { siteId, formId } = await params;
  const { tab } = await searchParams;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <Link href={`/dashboard/sites/${siteId}/marketing/forms`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-48 w-full" />
            </div>
          }
        >
          <FormContent siteId={siteId} formId={formId} defaultTab={tab} />
        </Suspense>
      </div>
    </div>
  );
}

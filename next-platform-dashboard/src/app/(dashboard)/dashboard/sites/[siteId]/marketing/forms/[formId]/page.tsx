/**
 * Form Detail / Edit Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLATFORM } from "@/lib/constants/platform";
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
  );
}

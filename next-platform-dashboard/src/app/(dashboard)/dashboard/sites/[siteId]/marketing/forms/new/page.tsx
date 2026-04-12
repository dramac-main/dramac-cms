/**
 * New Form Page
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import type { Metadata } from "next";
import { PLATFORM } from "@/lib/constants/platform";
import { FormBuilder } from "@/modules/marketing/components/forms/form-builder";

export const metadata: Metadata = {
  title: `New Form | ${PLATFORM.name}`,
  description: "Create a new opt-in form",
};

interface NewFormPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function NewFormPage({ params }: NewFormPageProps) {
  const { siteId } = await params;

  return (
    <div className="flex-1 p-6">
      <FormBuilder siteId={siteId} />
    </div>
  );
}
